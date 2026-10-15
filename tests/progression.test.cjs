const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../progression.js'),{S,race}=require('./helpers.cjs');
const roster=S.DRIVERS;
function storage(seed={}){const data=new Map(Object.entries(seed));return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};}
function rows(winner=9){const ids=[winner,...roster.map((_,id)=>id).filter(id=>id!==winner)];return ids.map((id,i)=>({id,position:i+1,status:'finished',finishTime:100+i,laps:1,penalty:0,points:999}));}
function reward(list,mode='career'){const r=P.resultRows(list,roster).find(r=>r.id===9);return {position:r.position,points:r.points,credits:mode==='career'?40+r.points*4:0,reputation:mode==='career'?10:0,advanceRound:true};}
function record(store,mode='career',list=rows()){return store.record(store.context(mode),list,reward(list,mode));}

test('legacy migration preserves career and leaves an independent championship and the original bytes',()=>{
 const old=JSON.stringify({name:'Gustavo',round:3,season:4,points:52,credits:320,reputation:40,upgrades:{energy:2},helmet:'#abcdef'}),disk=storage({[P.LEGACY_KEY]:old}),s=new P.Store(disk,roster);
 assert.equal(disk.getItem(P.LEGACY_KEY),old);assert.equal(JSON.parse(disk.getItem(P.KEY)).version,2);
 const a=s.profile('career'),b=s.profile('championship');
 assert.deepEqual([a.round,a.season,a.points,a.credits,a.upgrades.energy],[3,4,52,320,2]);assert(a.historyIncomplete);
 assert.deepEqual([b.round,b.season,b.points,b.credits,b.upgrades.energy],[0,1,0,0,0]);assert.equal(b.name,'Gustavo');
 assert.notEqual(a.calendar,b.calendar);assert.notEqual(a.upgrades,b.upgrades);
 assert.deepEqual(new P.Store(disk,roster).data,s.data);
});
test('each mode retains its own calendar, points, rivals and wallet across reloads',()=>{
 const disk=storage(),s=new P.Store(disk,roster);s.profile('championship').calendar.reverse();
 assert.equal(s.context('championship').track,5);assert(record(s));assert(record(s,'championship',rows(0)));assert(s.save());
 const loaded=new P.Store(disk,roster),a=loaded.profile('career'),b=loaded.profile('championship');
 assert.deepEqual([a.points,a.credits,a.round],[25,140,1]);assert.deepEqual([b.points,b.credits,b.round],[1,0,1]);
 assert.equal(b.results[0].track,5);assert.equal(a.results[0].track,0);
 assert.equal(P.standings(b,roster)[0].id,0);assert.equal(P.standings(a,roster)[0].id,9);
 assert.equal(loaded.notice,'');
});
test('all rivals retain points with countback by wins then second places',()=>{
 const s=new P.Store(storage(),roster);record(s,'championship',rows(0));record(s,'championship',rows(1));
 const table=P.standings(s.profile('championship'),roster);
 assert.equal(table.length,20);assert.equal(table[0].id,0);assert.equal(table[0].points,43);assert.equal(table[1].points,43);
 assert.equal(table[0].finishes[0],1);assert.equal(table[0].finishes[1],1);assert.equal(table[0].starts,2);
 assert.equal(table.find(r=>r.id===9).points,2);
});
test('championship never grants career credits or reputation even with a malformed reward',()=>{
 const s=new P.Store(storage(),roster),list=rows();s.record(s.context('championship'),list,reward(list));
 assert.equal(s.profile('championship').credits,0);assert.equal(s.profile('championship').reputation,0);
 assert.equal(s.profile('career').round,0);
});
test('replayed results are rejected before and after reload and stale context cannot cross a season',()=>{
 const disk=storage(),s=new P.Store(disk,roster),context=s.context('career'),list=rows();
 assert(s.record(context,list,reward(list)));assert.equal(s.record(context,list,reward(list)),null);s.save();
 const loaded=new P.Store(disk,roster);assert.equal(loaded.record(context,list,reward(list)),null);
 for(let i=1;i<6;i++)record(loaded);assert.equal(loaded.record(context,list,reward(list)),null);
 assert.equal(loaded.profile('career').credits,840);
});
test('invalid modes, track, stage, reward and provisional rows cannot advance progression',()=>{
 const s=new P.Store(storage(),roster),c=s.context('career'),list=rows(),r=reward(list),before=JSON.stringify(s.data);
 for(const mode of ['gp','time','practice',undefined])assert.equal(s.record({...c,mode},list,r),null);
 for(const change of [{track:5},{round:1},{season:2}])assert.equal(s.record({...c,...change},list,r),null);
 assert.equal(s.record(c,list,{...r,points:0}),null);assert.equal(s.record(c,list,{...r,advanceRound:false}),null);
 assert.equal(s.record(c,[{...list[0],status:'running'}],r),null);assert.equal(s.record(c,list,null),null);
 assert.equal(JSON.stringify(s.data),before);
});
test('DNF advances one round without points or rewards and records retirements',()=>{
 const s=new P.Store(storage(),roster),list=rows(0);list.find(r=>r.id===9).status='dnf';
 assert(record(s,'career',list));const a=s.profile('career');assert.equal(a.points,0);
 assert.equal(a.round,1);assert.equal(a.credits,0);assert.equal(a.reputation,0);assert.equal(P.standings(a,roster).find(r=>r.id===9).retirements,1);
});
test('six rounds archive all standings and reset only the active season',()=>{
 const disk=storage(),s=new P.Store(disk,roster),a=s.profile('career');a.upgrades.energy=3;
 let result;for(let i=0;i<6;i++)result=record(s);
 assert(result.seasonFinished);assert.deepEqual([a.season,a.round,a.points,a.credits,a.upgrades.energy],[2,0,0,840,3]);
 assert.equal(a.history[0].points,150);assert.equal(a.history[0].standings.length,20);assert.equal(a.history[0].standings[1].points,108);
 assert.equal(a.history[0].position,1);assert.equal(a.history[0].partial,false);assert.equal(a.results.length,0);
 assert.equal(s.profile('championship').season,1);s.save();assert.equal(new P.Store(disk,roster).profile('career').history[0].points,150);
});
test('history is bounded to five seasons, legacy partial history is explicit and clears on rollover',()=>{
 const s=new P.Store(storage({[P.LEGACY_KEY]:JSON.stringify({round:5,points:75})}),roster),a=s.profile('career');
 record(s);assert.equal(a.history[0].partial,true);assert.equal(a.history[0].points,100);assert.equal(a.historyIncomplete,false);
 for(let i=0;i<36;i++)record(s);assert.equal(a.history.length,5);assert.equal(a.history[0].season,3);assert.equal(a.history[4].season,7);
});
test('partial or malformed saved fields are sanitized without losing the original',()=>{
 const raw=JSON.stringify({version:2,career:{name:'<script>x</script>',credits:-8,round:Infinity,season:'bad',calendar:[0,0],upgrades:{energy:90,engine:'3'},helmet:'javascript:x',results:[{round:0,track:0,rows:[{id:300}]}]},championship:null});
 const disk=storage({[P.KEY]:raw}),s=new P.Store(disk,roster),a=s.profile('career');
 assert.deepEqual([a.credits,a.round,a.season,a.upgrades.energy,a.upgrades.engine],[0,0,1,3,0]);assert.equal(a.helmet,'#d8ff3e');
 assert.equal(a.name,'<script>x</script>');assert(s.save());assert.equal(disk.getItem(P.BACKUP_KEY),raw);
 assert.equal(new P.Store(disk,roster).notice,'');
});
test('invalid history stops at the first missing round and cannot grant forged points',()=>{
 const a=P.createMode(roster,{results:[{round:0,track:0,rows:rows()},{round:2,track:2,rows:rows()}]});
 assert.equal(a.round,1);assert.equal(a.points,25);
 assert.equal(P.resultRows([rows()[0],rows()[0]],roster),null);assert.equal(P.resultRows([{...rows()[0],finishTime:Infinity}],roster),null);
});
test('an imported full season is rolled forward instead of creating an invalid seventh round',()=>{
 const a=P.createMode(roster,{results:Array.from({length:6},(_,round)=>({round,track:round,rows:rows()}))});
 assert.equal(a.season,2);assert.equal(a.round,0);assert.equal(a.history[0].points,150);
});
test('corrupt primary save is backed up and valid legacy is migrated',()=>{
 const disk=storage({[P.KEY]:'{corrupt',[P.LEGACY_KEY]:'{"points":18,"round":1}'}),s=new P.Store(disk,roster);
 assert.equal(s.profile('career').points,18);assert.equal(disk.getItem(P.BACKUP_KEY),'{corrupt');assert.equal(JSON.parse(disk.getItem(P.KEY)).version,2);
});
test('failed backup refuses to overwrite a corrupt save, failed writes retain in-memory progress',()=>{
 const disk=storage({[P.KEY]:'broken'}),s=new P.Store(disk,roster);disk.setItem=()=>{throw Error('quota');};
 record(s);assert.equal(s.save(),false);assert.equal(disk.getItem(P.KEY),'broken');assert.equal(s.profile('career').round,1);
});
test('future schema and inaccessible storage never overwrite user data or throw',()=>{
 const raw='{"version":999,"career":{"points":123}}',disk=storage({[P.KEY]:raw}),s=new P.Store(disk,roster);
 record(s);assert.equal(s.save(),false);assert.equal(disk.getItem(P.KEY),raw);assert(s.readOnly);
 assert.equal(new P.Store(undefined,roster).save(),false);
 assert.equal(new P.Store({getItem(){throw Error('blocked');}},roster).save(),false);
});

function braking(upgrade,mode='career',hz=60,input={brake:.08},speed=60){
 const r=race({mode,energyUpgrade:upgrade});r.cars=[r.player];r.resetPlayer(0,0,speed);r.player.battery=30;
 let accumulator=0;for(let frame=0;frame<hz*2;frame++){accumulator+=1/hz;while(accumulator>=1/120-1e-10){r.step(1/120,input);accumulator-=1/120;}}
 return r.player.battery;
}
test('energy upgrade regeneration is identical at different rendering rates and bounded',()=>{
 const base=braking(0),boosted=braking(3);assert(boosted>base);assert(Math.abs(boosted-base-.48)<1e-7);
 assert.equal(boosted,braking(3,'career',120));assert.equal(boosted,braking(3,'career',30));
 assert.equal(boosted,braking(99));assert.equal(base,braking(NaN));
});
test('energy upgrade does not apply in championship, GP, coasting, stationary, grid or service',()=>{
 for(const mode of ['gp','championship','time'])assert.equal(braking(3,mode),braking(0,mode));
 assert.equal(braking(3,'career',60,{},60),braking(0,'career',60,{},60));
 assert.equal(braking(3,'career',60,{brake:1},0),braking(0,'career',60,{brake:1},0));
 for(const phase of ['start','service']){
  const r=race({mode:'career',energyUpgrade:3});r.player.battery=30;r.resetPlayer(0,0,30);
  if(phase==='start')r.phase='start';else{r.pit=true;r.pitState='service';r.pitTimer=100;}
  r.step(1/120,{brake:1});assert.equal(r.player.battery,30);
 }
});
