const test=require('node:test'),assert=require('node:assert/strict');
const {Classification,applyReward}=require('../results.js');
const View=require('../results-view.js');
const {S,race,advance,drive}=require('./helpers.cjs');
const {cross:crossing,prepare,segment}=require('./course-fixtures.js');
const car=(id,d=0)=>({id,name:'Piloto '+id,d,speed:40,vx:40,vz:0});
function twoFinishers(){
 const a=car(9),b=car(1),board=new Classification(1000,1);
 crossing(board,a,1,100);crossing(board,b,1,102);
 return {a,b,board,cars:[a,b]};
}
test('five second penalty reverses a two second lead and rewards the corrected position once',()=>{
 const {a,b,board,cars}=twoFinishers();
 assert.deepEqual(board.rows(cars).map(r=>r.id),[a.id,b.id]);
 board.setPenalty(a,5);
 const rows=board.finalize(cars);
 assert.deepEqual(rows.map(r=>[r.id,r.correctedTime,r.points]),[[b.id,102,25],[a.id,105,18]]);
 const profile={points:0,credits:0,reputation:0,round:0,season:1};
 applyReward(profile,board.claimReward(cars,a,'career'));
 assert.deepEqual(profile,{points:18,credits:112,reputation:20,round:1,season:1});
 assert.equal(board.claimReward(cars,a,'career'),null);
 applyReward(profile,board.claimReward(cars,a,'career'));
 assert.equal(profile.points,18);assert.equal(profile.round,1);
});
test('no rewards are available from provisional standings',()=>{
 const {a,board,cars}=twoFinishers();
 assert.equal(board.claimReward(cars,a,'career'),null);
 board.finalize(cars);
 assert.equal(board.claimReward(cars,a,'gp'),null);
 assert.equal(board.claimReward(cars,a,'championship').points,25);
});
test('lapped cars finish on their next line after the leader, sorted by completed laps',()=>{
 const a=car(9),b=car(1),board=new Classification(1000,3),cars=[a,b];
 crossing(board,b,1,50);crossing(board,a,1,30);crossing(board,a,2,60);
 // Both cross at the same time, regardless of the input array order.
 prepare(board,a,2999,89);prepare(board,b,1999,89);
 board.update([{car:b,from:1999,to:2001},{car:a,from:2999,to:3001}],89,91);
 // Simultaneous crossings receive the flag regardless of input array order.
 assert.equal(board.status(a),'finished');assert.equal(board.status(b),'finished');
 board.setPenalty(a,1000);
 const rows=board.finalize(cars);
 assert.equal(rows[0].id,a.id);assert.equal(rows[1].laps,2);assert.equal(rows[1].lapsBehind,1);
});
test('chronological crossing order inside a large step prevents a premature lapped finish',()=>{
 const a=car(9),b=car(1),board=new Classification(1000,3);
 prepare(board,a,2999,90);prepare(board,b,1999,90);
 board.update([{car:a,from:2999,to:3001},{car:b,from:1999,to:2003}],90,92);
 assert.equal(board.checkeredAt,91);
 assert.equal(board.status(b),'running');
 crossing(board,b,3,120);
 assert.equal(board.record(b).finishTime,120);
});
test('a retiree cannot win or earn points even with more projected distance',()=>{
 const a=car(9,9000),b=car(1),board=new Classification(1000,1),cars=[a,b];
 board.retire(a,50,'Combustível esgotado');crossing(board,b,1,100);
 const rows=board.finalize(cars);
 assert.equal(rows[0].id,b.id);assert.equal(rows[1].status,'dnf');assert.equal(rows[1].points,0);
 assert.equal(rows[1].finishTime,null);assert.equal(rows[1].correctedTime,null);
 const reward=board.claimReward(cars,a,'career');
 assert.equal(reward.points,0);assert.equal(reward.credits,0);assert.equal(reward.reputation,0);
 assert.equal(reward.advanceRound,true);
});
test('a running driver has no invented arrival time and keeps the result provisional',()=>{
 const a=car(9),b=car(1),board=new Classification(1000,1),cars=[a,b];
 crossing(board,a,1,100);
 assert.equal(board.finalize(cars),null);
 assert.equal(board.rows(cars)[1].finishTime,null);
 assert.match(View.table(board.rows(cars),a.id),/Em pista/);
 board.expire(cars,699);assert.equal(board.status(b),'running');
 board.expire(cars,700);assert.equal(board.status(b),'dnf');assert(board.finalize(cars));
});
test('grid, reverse motion and repeated line crossings do not duplicate a finish',()=>{
 const a=car(9),board=new Classification(1000,1);
 board.update([{car:a,from:-10,to:10}],0,1);assert.equal(board.record(a).laps,0);
 board.update([{car:a,from:10,to:-10}],1,2);assert.equal(board.checkeredAt,null);
 crossing(board,a,1,100);const first={...board.record(a)};
 board.update([{car:a,from:1001,to:999}],101,102);
 crossing(board,a,1,103);assert.deepEqual(board.record(a),first);
});
test('arrival interpolation is independent of sample frequency and preserves dead heats',()=>{
 function run(hz){const a=car(9),board=new Classification(1000,1);prepare(board,a,990,0);for(let i=0;i<2*hz;i++)board.update([{car:a,from:990+i*10/hz,to:990+(i+1)*10/hz}],i/hz,(i+1)/hz);return board.record(a).finishTime;}
 assert(Math.abs(run(60)-1)<1e-9);assert(Math.abs(run(120)-1)<1e-9);
 const a=car(9),b=car(1),board=new Classification(1000,1);
 prepare(board,a,999,99);prepare(board,b,999,99);
 board.update([{car:a,from:999,to:1001},{car:b,from:999,to:1001}],99,101);
 assert.equal(board.status(a),'finished');assert.equal(board.status(b),'finished');
 assert.deepEqual(board.finalize([a,b]).map(r=>r.id),[1,9]);
});
test('final records and rewards stay stable after cars, penalties and presentation change',()=>{
 const {a,b,board,cars}=twoFinishers();board.finalize(cars);
 const first=JSON.stringify(board.rows(cars));
 a.d=1e9;b.name='Alterado';board.setPenalty(b,999);crossing(board,b,2,300);
 assert.equal(JSON.stringify(board.rows(cars)),first);
 const html=View.table(board.rows(cars),a.id);
 assert.match(html,/CHEGADA/);assert.match(html,/CORRIGIDO/);assert.match(html,/VOCÊ/);
});
test('result rendering escapes names and retirement reasons',()=>{
 const a=car(9);a.name='<script>bad</script>';
 const board=new Classification(1000,1);board.retire(a,10,'<img src=x>');
 const html=View.table(board.finalize([a]),a.id);
 assert(!html.includes('<script>'));assert(!html.includes('<img'));assert.match(html,/&lt;script&gt;/);
});
test('the final season records corrected points before resetting its total',()=>{
 const {a,board,cars}=twoFinishers();board.setPenalty(a,5);board.finalize(cars);
 const profile={points:50,credits:0,reputation:99,round:5,season:1};
 const extra=applyReward(profile,board.claimReward(cars,a,'career'));
 assert.equal(profile.lastSeasonPoints,68);assert.equal(profile.points,0);assert.equal(profile.round,0);
 assert.equal(profile.season,2);assert.equal(profile.reputation,100);assert.match(extra,/68 pontos/);
});
test('real GP physics registers a lapped player and finishes all rivals without moving completed cars',()=>{
 const r=new S.Race(S.makeTrack(0),{laps:1,fuel:30,pitLap:99,consumption:false,wear:false,damage:false});
 r.phase='race';
 // Start every rival close to its final line; player is one lap behind.
 r.cars.filter(a=>a!==r.player).forEach((a,i)=>{prepare(r.results,a,r.track.length-10-i*9,0);a.speed=40;});
 r.resetPlayer(-40,0,0);
 for(let i=0;i<120*400&&!r.finish;i++)r.step(1/120,r.playerDone?{}:drive(r));
 assert(r.finish);assert(r.results.final);assert.equal(r.results.final.length,20);
 const player=r.classification().find(row=>row.id===r.player.id);
 assert.equal(player.status,'finished');assert.equal(player.laps,0);assert.equal(player.lapsBehind,1);
 const snapshot=JSON.stringify(r.classification());advance(r,2,{throttle:1});
 assert.equal(JSON.stringify(r.classification()),snapshot);
 assert.equal(r.position,player.position);assert.equal(r.rank()[r.position-1],r.player);
});
test('a winner is still registered while the player is stopped for pit service',()=>{
 const r=new S.Race(S.makeTrack(0),{laps:1,pitLap:99,fuel:30});r.phase='race';
 const opponent=r.cars[0];prepare(r.results,opponent,r.track.length-.01,0);opponent.speed=40;
 r.pit=true;r.pitState='service';r.pitTimer=20;
 r.step(1/120,{});
 assert.equal(r.results.status(opponent),'finished');assert.notEqual(r.results.checkeredAt,null);
});
test('a single competitor runs through the same final standings and reward rules',()=>{
 const r=new S.Race(S.makeTrack(0),{laps:1,fuel:30});r.phase='race';r.cars=[r.player];
 r.resetPlayer(r.track.length-.1,0,20);r.player.temp=100;
 // A valid prior route is required; a raw reposition no longer grants a finish.
 r.progress.sample=null;prepare(r.results,r.player,r.track.length-.1,0);
 r.step(1/120,{throttle:.2});
 assert(r.finish);assert.equal(r.classification()[0].points,25);assert.equal(r.classification()[0].status,'finished');
});
test('practice and time trial retain their solo finish and fuel retirement rules',()=>{
 for(const config of [{session:'practice',mode:'career'},{mode:'time'}]){
  const r=race({...config,fuel:0});advance(r,1);
  assert.equal(r.competitive,false);assert(r.finish);assert(r.dnf);assert.equal(r.results.final,null);
 }
});
test('weather and red flag timers continue while waiting for rivals after player retirement',()=>{
 const r=new S.Race(S.makeTrack(0),{laps:1,weather:'dynamic',fuel:30});r.phase='race';r.player.fuel=0;
 r.results.retire(r.player,0,'Combustível esgotado');
 r.time=100;r.flag='red';r.flagTimer=1;
 const distances=r.cars.map(a=>a.d);
 advance(r,.5);assert.deepEqual(r.cars.map(a=>a.d),distances);
 advance(r,2);assert.notEqual(r.flag,'red');assert(r.rain>0);assert(r.wetness>0);
 assert(r.cars.some((a,i)=>a.d>distances[i]));
});
test('a complete GP from the grid settles twenty records including a stranded player',()=>{
 const r=new S.Race(S.makeTrack(0),{laps:1,fuel:30,pitLap:99,consumption:false,wear:false,damage:false});
 for(let i=0;i<120*900&&!r.finish;i++)r.step(1/120,r.playerDone?{}:drive(r));
 assert(r.finish,'GP must settle');
 const rows=r.classification();assert.equal(rows.length,20);
 assert(rows.every(row=>row.status!=='running'));
 assert(rows.filter(row=>row.status==='finished').every(row=>row.finishTime!==null));
 assert(rows.filter(row=>row.status==='dnf').every(row=>row.finishTime===null&&row.points===0));
 assert.equal(rows.find(row=>row.id===r.player.id).position,r.position);
 assert.equal(r.rank()[r.position-1],r.player);
});
