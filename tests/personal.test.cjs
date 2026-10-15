const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../personal.js'),View=require('../personal-view.js'),ResultsView=require('../results-view.js');
const {S,race,drive}=require('./helpers.cjs'),{feedLap,feedDriver}=require('./personal-fixtures.js');
const track=S.makeTrack(0);
const make=config=>race({mode:'time',session:'race',weather:'sun',fuel:18,laps:5,wear:false,consumption:false,damage:false,...config},track);
const disk=seed=>{const map=new Map(Object.entries(seed||{}));return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};};
function reference(seconds=100){const r=make();r.player.speed=track.length/seconds;return feedLap(r,seconds);}

test('ordered valid telemetry records an interpolated ghost with all sectors and endpoints',()=>{
 const r=make();r.player.speed=track.length/100;const record=feedLap(r);
 assert(record);assert(P.validate(record));assert.equal(record.samples[0][0],0);assert.equal(record.samples[0][1],0);
 assert(Math.abs(record.samples.at(-1)[1]-track.length)<.001);assert(Math.abs(record.samples.at(-1)[0]-100)<.002);
 assert.equal(record.trace.length,121);assert.equal(record.sectors.length,3);assert.equal(r.analysis.laps[0].clean,true);
 assert(r.analysis.laps[0].curves.length>10);assert.equal(r.player.bestLap,100);
});
test('actual vehicle physics completes a clean lap and creates a usable ghost',()=>{
 const r=make({laps:1,fuel:30});r.resetPlayer(-40,0,0);
 for(let i=0;i<120*400&&!r.finish;i++)r.step(1/120,drive(r,38));
 assert(r.finish);assert(r.analysis.pendingGhost);assert(P.validate(r.analysis.pendingGhost));assert.equal(r.analysis.summary(r).clean,1);
});
test('ghost samples remain identical with telemetry fed at 30, 60 and 120 Hz',()=>{
 function capture(hz){const r=make();r.player.speed=track.length/100;return feedLap(r,100,null,hz);}
 const low=capture(30),medium=capture(60),high=capture(120);assert(low&&medium&&high);assert.deepEqual(low.samples,medium.samples);assert.deepEqual(medium.samples,high.samples);
});
test('a clean lap longer than the ghost limit still counts for timing and consistency with a clear notice',()=>{
 const r=make();feedLap(r,601);assert.equal(r.analysis.pendingGhost,null);assert.equal(r.best,601);assert.equal(r.analysis.summary(r).clean,1);assert.match(r.analysis.ghostNotice,/10 minutos/);const boundary=make();assert(feedLap(boundary,600));
});
test('ghost compatibility includes geometry, physics, weather, tyre and physical setup',()=>{
 const r=make(),key=P.signature(track,r.config);assert.equal(key,r.analysis.signature);
 for(const change of [{weather:'storm'},{tyre:'hard'},{fuel:20},{aero:6},{bias:60},{wear:true},{consumption:true},{damage:true},{powerBoost:1.1}])assert.notEqual(key,P.signature(track,{...r.config,...change}));
 assert.notEqual(key,P.signature(S.makeTrack(1),r.config));
 const altered={...track,at:d=>({...track.at(d),y:track.at(d).y+1})};assert.notEqual(key,P.signature(altered,r.config));
 assert.equal(key,P.signature(track,{...r.config,volume:0,fov:90,steerRate:2}));
});
test('invalid, repositioned, penalized, pit, neutralized and changed-setup laps cannot become ghosts',()=>{
 for(const kind of ['invalid','reposition','penalty','pit','neutral','contact','setup']){
  const r=make();let changed=false;
  feedLap(r,100,(r,f)=>{if(f>.4&&!changed){changed=true;if(kind==='invalid')r.timing.invalidate();if(kind==='reposition')r.resetPlayer(r.player.d,0,r.player.speed);if(kind==='penalty')r.penalty+=5;if(kind==='pit')r.pit=true;if(kind==='neutral')r.flag='vsc';if(kind==='contact')r.collisions++;if(kind==='setup')r.config.aero=6;}});
  assert.equal(r.analysis.pendingGhost,null,kind);assert.equal(r.analysis.summary(r).clean,0,kind);
 }
});
test('practice, GP, training and dynamic weather do not create persistent time trial ghosts',()=>{
 for(const config of [{mode:'gp'},{session:'practice'},{mode:'training'},{weather:'dynamic'}]){const r=make(config);feedLap(r);assert.equal(r.analysis.pendingGhost,null,JSON.stringify(config));}
});
test('invalid lap does not replace an existing best, next clean lap can recover',()=>{
 const r=make();feedLap(r,100);const first=r.analysis.pendingGhost;r.analysis.pendingGhost=null;
 feedLap(r,90,(r,f)=>{if(f>.3)r.timing.invalidate();});assert.equal(r.analysis.pendingGhost,null);assert.equal(r.analysis.best.time,100);
 feedLap(r,95);assert(r.analysis.pendingGhost);assert.equal(r.analysis.best.time,95);assert.equal(first.time,100);
});
test('time and distance interpolation handles endpoints and wrapped angles without extrapolation',()=>{
 const record={time:1,samples:[[0,0,0,3.1,10],[1,10,2,-3.1,20]]};
 const middle=P.atTime(record,.5);assert.equal(middle.d,5);assert.equal(middle.lane,1);assert.equal(middle.speed,15);assert(Math.abs(middle.yaw)>3.1);
 assert.equal(P.atTime(record,-.1),null);assert.equal(P.atTime(record,1.1),null);assert.equal(P.atTime(record,1).d,10);
 const trace=Array.from({length:121},(_,i)=>i);assert.equal(P.timeAt(trace,track.length/2,track.length),60);assert.equal(P.delta({trace},track.length/2,59,track.length),-1);
});
test('ghost validation rejects malformed and discontinuous samples, missing gates and excessive duration',()=>{
 const valid=reference();assert(valid);const clone=()=>structuredClone(valid);
 for(const mutate of [r=>r.trace.pop(),r=>r.trace[30]=NaN,r=>r.time=601,r=>r.samples[3][0]=r.samples[2][0],r=>r.samples[2][2]=20,r=>r.samples[2][1]+=1000,r=>r.samples.pop(),r=>r.samples[0][1]=50]){
  const r=clone();mutate(r);assert.equal(P.validate(r),null);
 }
});
test('ghost store keeps faster references per configuration, survives reload and bounds variants',()=>{
 const storage=disk(),store=new P.GhostStore(storage),record=reference();assert(store.offer(record).saved);
 assert.equal(store.offer(reference(110)).accepted,false);assert.equal(store.find(record.signature).time,100);
 assert(store.offer(reference(95)).accepted);assert.equal(new P.GhostStore(storage).find(record.signature).time,95);
 for(let i=0;i<10;i++)store.offer({...record,signature:record.signature+'variant'+i});assert.equal(store.records.length,8);
});
test('corrupt/future saves and failed backup/write preserve existing ghost bytes',()=>{
 const storage=disk({[P.KEY]:'broken'}),store=new P.GhostStore(storage);assert(store.offer(reference()).saved);assert.equal(storage.getItem(P.KEY+'-recovery'),'broken');
 const future='{"version":999,"records":[]}',next=disk({[P.KEY]:future}),blocked=new P.GhostStore(next);assert.equal(blocked.offer(reference()).saved,false);assert.equal(next.getItem(P.KEY),future);
 const bad=disk({[P.KEY]:'broken'}),quota=new P.GhostStore(bad);bad.setItem=()=>{throw Error('quota');};assert.equal(quota.offer(reference()).saved,false);assert.equal(bad.getItem(P.KEY),'broken');
 assert.equal(new P.GhostStore(undefined).offer(reference()).saved,false);
});
test('all twenty drivers have teams and unique numbers, player identity reserves its number',()=>{
 const r=new S.Race(track);assert.equal(r.cars.length,20);assert.equal(new Set(r.cars.map(c=>c.number)).size,20);assert(r.cars.every(c=>c.team&&Number.isInteger(c.number)));
 r.setIdentity('Piloto','Apex Works',12);assert.equal(r.player.number,12);assert.equal(r.player.team,'Apex Works');assert.equal(new Set(r.cars.map(c=>c.number)).size,20);
});
test('fastest opponent lap uses actual ordered crossings and ignores a faster invalid attempt',()=>{
 const r=new S.Race(track,{laps:5,consumption:false,wear:false});r.phase='race';
 feedDriver(r,r.cars[0],100);feedDriver(r,r.cars[1],90);feedDriver(r,r.cars[2],80,true);
 assert(Math.abs(r.cars[0].bestLap-100)<1e-6);assert(Math.abs(r.cars[1].bestLap-90)<1e-6);assert.equal(r.cars[2].bestLap,null);assert.equal(r.fastestLap().id,1);
 const html=View.board(r);assert.equal((html.match(/data-driver-id=/g)||[]).length,20);assert.match(html,/ESCUDERIA/);assert.match(html,/PARADAS/);assert.match(html,/VOLTA MAIS RÁPIDA/);assert.match(html,/fastest-badge/);
});
test('consistency and sector comparison use clean laps and an earlier faster saved reference',()=>{
 const r=make();r.analysis.reference=reference(90);feedLap(r,100);feedLap(r,110);const s=r.analysis.summary(r);
 assert.equal(s.clean,2);assert.equal(s.mean,105);assert.equal(s.spread,10);assert.equal(s.deviation,5);assert.equal(s.comparison.reference.time,90);
 assert.equal(s.comparison.lap.number,2);assert(s.comparison.lap.curves.every(c=>c.time>0));
 assert.match(View.analysis(r),/desvio padrão/);assert.match(View.analysis(r),/S1/);assert.match(View.analysis(r),/T1/);
});
test('pit lane duration differs from stationary service and incomplete stops remain explicit',()=>{
 const r=make();function advance(seconds,change){const from=P.pose(r);r.analysis.from=from;r.time+=seconds;change?.();r.analysis.tick(r,from);}
 advance(2,()=>{r.pit=true;r.pitState='entry';});advance(8,()=>{r.pitState='service';});advance(3,()=>{r.pitState='exit';r.pitCount=1;r.player.tyre='hard';});advance(6,()=>{r.pit=false;});
 let s=r.analysis.summary(r);assert.equal(s.stops.length,1);assert.equal(s.stops[0].service,3);assert.equal(s.stops[0].total,19);assert(s.stops[0].complete);assert.equal(s.stops[0].tyreOut,'hard');
 advance(2,()=>{r.pit=true;r.pitState='entry';});s=r.analysis.summary(r);assert.equal(s.stops.length,2);assert.equal(s.stops[1].complete,false);
});
test('a real physical pit stop records lane transit, service and the new compound',()=>{
 const r=make();r.player.temp=100;r.resetPlayer(track.length-420,0,10);r.nextTyre='hard';r.requestPit();r.toggleLimiter();
 for(let i=0;i<120*120;i++){
  const d=r.player.d-track.length,input=drive(r,10,d<-370?0:d<55?14:0);if(!r.pitCount&&d>-94&&d<-60){input.throttle=0;input.brake=.3;}
  r.step(1/120,input);if(r.pitCount&&!r.pit)break;
 }
 const stops=r.analysis.summary(r).stops;assert.equal(stops.length,1);assert(stops[0].complete);assert(stops[0].total>stops[0].service);assert(stops[0].service>3&&stops[0].service<3.2);assert.equal(stops[0].tyreOut,'hard');
});
test('report freezes player time and resources while remaining opponents settle',()=>{
 const r=make(),from=P.pose(r);r.time=10;r.finish=true;r.analysis.tick(r,from);r.time=600;r.player.fuel=0;r.collisions=9;r.analysis.tick(r,P.pose(r));
 const s=r.analysis.summary(r);assert.equal(s.elapsed,10);assert.equal(s.end.fuel,18);assert.equal(s.end.collisions,0);
});
test('incident ledger detects contact, limits, penalty and recovery without duplicating stable states',()=>{
 const r=make();let from=P.pose(r);r.collisions=1;r.penalty=5;r.trackWarnings=1;r.time=1;r.analysis.tick(r,from);from=P.pose(r);r.time=2;r.analysis.tick(r,from);r.recoverPlayer();
 assert.deepEqual(r.analysis.events.map(e=>e.type),['contact','penalty','limits','recovery']);
});
test('report and final classification escape team/driver strings and handle missing telemetry',()=>{
 const r=make();r.player.name='<script>x</script>';r.player.team='<img src=x>';
 const html=View.board(r);assert(!html.includes('<script>'));assert(!html.includes('<img'));assert(html.includes('&lt;script&gt;'));assert.match(View.analysis(r),/Nenhuma volta completa/);
 const result=ResultsView.table([{id:9,name:r.player.name,team:r.player.team,number:27,bestLap:90,status:'dnf',position:1,laps:0,finishTime:null,correctedTime:null,penalty:0}],9);
 assert(!result.includes('<img'));assert.match(result,/MELHOR VOLTA/);assert.match(result,/VR/);
});
