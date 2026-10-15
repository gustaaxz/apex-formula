const test=require('node:test'),assert=require('node:assert/strict');
const {CourseProgress,LapClock,qualifyingResult}=require('../timing.js');
const {Classification}=require('../results.js');
const {S,race,drive}=require('./helpers.cjs');
const {prepare}=require('./course-fixtures.js');
const flat={length:1200,at:d=>({x:d,z:0,y:0,tx:1,tz:0,nx:0,nz:1,k:0})};
test('standing on the grid line after the leader finishes is not a physical finish crossing',()=>{
 const board=new Classification(1200,1),a={id:9,name:'A',d:0},b={id:1,name:'B',d:0};
 prepare(board,a,1201,100);
 board.update([{car:b,from:0,to:0}],101,102);
 assert.equal(board.status(b),'running');assert.equal(board.record(b).finishTime,null);
});
function move(progress,from,to,before,after,lane=0,pit=false){
 const track=progress.track||flat,a=track.at(from),b=track.at(to);
 return progress.update({from,to,fromX:progress.sample?.x??a.x,fromZ:progress.sample?.z??a.z,x:b.x+b.nx*lane,z:b.z+b.nz*lane,pit},before,after);
}
function travel(progress,to,clock=null,lane=0){
 let from=progress.sample?.d??0,time=0;
 const events=[];
 while(from<to-1e-8){
  const next=Math.min(to,from+5),batch=move(progress,from,next,time,time+(next-from)/50,lane);
  events.push(...batch);if(clock)clock.consume(batch);
  time+=(next-from)/50;from=next;
 }
 return events;
}
for(let i=0;i<6;i++)test(`APX-0${i+1} accepts all spatial gates on a clean lap`,()=>{
 const track=S.makeTrack(i),p=new CourseProgress(track),clock=new LapClock(track.length,p);
 travel(p,track.length+1,clock);
 assert.equal(p.laps,1);assert.equal(clock.completed.length,1);assert(clock.completed[0].valid);
 assert(Math.abs(clock.best-track.length/50)<1e-7);
});
test('a cut outside a spatial gate cannot count a lap or create a record',()=>{
 const p=new CourseProgress(flat),clock=new LapClock(1200,p);
 clock.consume(move(p,0,20,0,1,20));
 assert(p.blocked);assert.equal(p.next,1);
 clock.consume(travel(p,1201));
 assert.equal(p.laps,0);assert.equal(clock.best,null);
 assert.equal(clock.completed.length,1);assert.equal(clock.completed[0].credited,false);
});
test('an implausible jump crossing the whole course cannot interpolate missing gates',()=>{
 const p=new CourseProgress(flat),clock=new LapClock(1200,p);
 clock.consume(move(p,0,5,0,.1));
 const prior=p.distance,events=move(p,5,1201,.1,.11);
 clock.consume(events);
 assert(events.some(e=>e.type==='invalid'));assert(!events.some(e=>e.type==='line'));
 assert.equal(p.laps,0);assert.equal(p.distance,prior);assert.equal(clock.best,null);
});
test('a changed sample origin is detected even when the small final step looks plausible',()=>{
 const p=new CourseProgress(flat);travel(p,100);
 const events=move(p,1100,1101,10,11);
 assert(events.some(e=>e.reason==='Salto de posição'));assert.equal(p.laps,0);assert(p.distance<=100);
});
test('reversing over a sector or finish never duplicates its credit',()=>{
 const p=new CourseProgress(flat),clock=new LapClock(1200,p);travel(p,1201,clock);
 clock.consume(move(p,1201,1190,30,31));clock.consume(move(p,1190,1202,31,32));
 assert.equal(p.laps,1);assert.equal(clock.completed.length,1);
 const next=p.next;clock.consume(move(p,1202,1195,32,33));clock.consume(move(p,1195,1203,33,34));
 assert.equal(p.next,next);assert.equal(p.laps,1);
});
test('the next complete clean lap can recover after an incomplete attempt',()=>{
 const p=new CourseProgress(flat),clock=new LapClock(1200,p);
 clock.consume(move(p,0,20,0,1,20));travel(p,1201,clock);
 assert.equal(p.laps,0);assert.equal(clock.best,null);
 travel(p,2401,clock);
 assert.equal(p.laps,1);assert.equal(clock.completed.length,2);assert(clock.completed[1].valid);
});
test('X restores the last verified gate without advancing the route and invalidates only the current record',()=>{
 const r=race({laps:2},flat);
 const events=travel(r.progress,405);r.recordTiming(events);
 const last=r.progress.lastCheckpointD,next=r.progress.next;
 r.timing.best=30;r.timing.bestTrace=Array.from({length:121},(_,i)=>i/4);r.best=30;
 r.resetPlayer(1199,4,10);
 assert.equal(r.progress.laps,0);assert.equal(r.progress.next,next);
 r.recoverPlayer();
 assert.equal(r.player.d,last);assert.equal(r.player.lane,0);assert.equal(r.player.speed,0);
 assert.equal(r.progress.next,next);assert.equal(r.progress.laps,0);assert.equal(r.penalty,5);
 assert.equal(r.timing.valid,false);assert.equal(r.best,30);assert.equal(r.timing.best,30);
});
test('a raw reposition near the line cannot finish a GP or a qualifying session',()=>{
 for(const config of [{mode:'gp'},{mode:'career',session:'qualify'}]){
  const r=new S.Race(flat,{...config,laps:1,fuel:30,consumption:false});
  r.phase='race';if(r.competitive)r.cars=[r.player];
  r.resetPlayer(1199.9,0,20);r.step(.1,{throttle:.2});
  assert.equal(r.progress.laps,0);assert.equal(r.finish,false);assert.equal(r.best,null);
  if(r.competitive)assert.equal(r.results.checkeredAt,null);
 }
});
test('live positions use earned course progress rather than a jumped projected distance',()=>{
 const r=new S.Race(flat,{laps:1,fuel:30});r.phase='race';const a=r.player,b=r.cars[0];r.cars=[a,b];
 prepare(r.results,a,100,10);prepare(r.results,b,200,10);
 a.d=1199;r.results.update([{car:a,from:100,to:1199}],10,10.01);
 assert.equal(r.rank()[0],b);assert.equal(r.results.record(a).laps,0);assert.equal(r.results.checkeredAt,null);
});
test('the same ordered route requirement applies to AI and player finish records',()=>{
 const board=new Classification(1200,1),a={id:9,name:'A',d:0},b={id:1,name:'B',d:0};
 prepare(board,a,100,10);board.update([{car:a,from:100,to:1201}],10,10.01);
 prepare(board,b,1201,50);
 assert.equal(board.status(b),'finished');assert.equal(board.status(a),'running');
 assert.equal(board.rows([a,b])[0].id,b.id);
});
test('pit gates allow the pit corridor only within the entry and exit section',()=>{
 for(const [pit,expected] of [[true,1],[false,0]]){
  const p=new CourseProgress(flat);
  travel(p,900);
  // Transition away from the racing line before the pit gate begins.
  for(let d=900;d<1200;d+=5)move(p,d,d+5,d/50,(d+5)/50,14,pit);
  assert.equal(p.laps,expected);
 }
 const p=new CourseProgress(flat);travel(p,300);
 move(p,300,320,6,7,14,true);assert(p.blocked);
});
test('qualifying without a positive finite valid best time always receives the last grid slot',()=>{
 for(const best of [null,undefined,0,-1,NaN,Infinity])assert.deepEqual(qualifyingResult(best,1200),{hasTime:false,time:null,grid:19});
 const valid=qualifyingResult(24,1200);assert(valid.hasTime);assert.equal(valid.time,24);assert(valid.grid<19);
});
test('an invalid qualifying attempt ends as no time rather than using elapsed session time',()=>{
 const r=race({mode:'career',session:'qualify',laps:1},flat);
 for(let i=0;i<120*100&&!r.finish;i++){
  r.step(1/120,drive(r));
  if(r.player.d>300)r.timing.invalidate();
 }
 assert(r.finish);assert.equal(r.progress.laps,1);assert.equal(r.best,null);
 assert.equal(qualifyingResult(r.best,flat.length).grid,19);
});
