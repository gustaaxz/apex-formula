const test=require('node:test'),assert=require('node:assert/strict');
const {S,race,advance}=require('./helpers.cjs');
const AI=require('../opponents.js');
const {prepare}=require('./course-fixtures.js');
const flat={length:1200,at:d=>({x:d,z:0,y:0,tx:1,tz:0,nx:0,nz:1,k:0})};
function pair(){
 const r=race({mode:'gp'},flat),p=r.player,b=r.cars[0];r.cars=[p,b];
 p.d=100;p.speed=20;p.lane=0;b.d=108;b.speed=20;b.lane=3.2;
 return {r,p,b};
}
function frame(r,dt,change=()=>{}){r.time+=dt;r.control.tick(dt);change();r.control.observe(dt);}
test('a neutralized pass offers a return window then applies one five second penalty',()=>{
 const {r,p}=pair();r.control.activate('vsc',30);
 frame(r,.5,()=>p.d=109);assert.equal(r.penalty,0);assert.equal(r.control.pending.size,1);
 assert.match(r.control.instruction(),/DEVOLVA/);
 frame(r,4);assert.equal(r.penalty,0);
 frame(r,1.1);assert.equal(r.penalty,5);assert.equal(r.control.pending.size,0);
 frame(r,1);assert.equal(r.penalty,5);
});
test('returning the place clears the obligation and does not penalize the returning opponent',()=>{
 const {r,p}=pair();r.control.activate('vsc',30);
 frame(r,.5,()=>p.d=109);frame(r,.5,()=>p.d=105);
 frame(r,6);assert.equal(r.penalty,0);assert.equal(r.control.pending.size,0);
 assert.equal(r.cars[1].timePenalty||0,0);
});
test('pit entry and retirement cannot be mistaken for a prohibited pass',()=>{
 for(const change of [b=>b.aiMode='pit',b=>b.raceStatus='dnf']){
  const {r,p,b}=pair();r.control.activate('vsc',30);
  frame(r,.5,()=>{change(b);p.d=109;});frame(r,6);
  assert.equal(r.penalty,0);assert.equal(r.control.pending.size,0);
 }
});
test('passing a stopped obstruction or a recovering car creates no return demand',()=>{
 for(const state of ['stopped','recovered']){
  const {r,p,b}=pair();if(state==='stopped')b.speed=0;else b.recoveredUntil=10;
  r.control.activate('sc',30);frame(r,.5,()=>p.d=109);
  assert.equal(r.control.pending.size,0);assert.equal(r.penalty,0);
 }
});
test('the same return-position rule penalizes an AI driver',()=>{
 const {r,p,b}=pair();p.d=108;b.d=100;r.control.activate('vsc',30);
 frame(r,.5,()=>b.d=109);frame(r,6);
 assert.equal(b.timePenalty,5);assert.equal(r.penalty,0);
});
test('finishing cannot erase a pending overtaking penalty',()=>{
 const {r,p}=pair();r.control.activate('vsc',30);
 frame(r,.5,()=>p.d=109);frame(r,.1,()=>p.raceStatus='finished');
 assert.equal(r.penalty,5);
});
test('VSC measures a reference delta and penalizes sustained gain without moving the player',()=>{
 const {r,p,b}=pair();b.d=700;r.control.activate('vsc',30);
 for(let i=0;i<70;i++)frame(r,.1,()=>p.d+=5);
 assert(r.control.delta(p)<0);assert(r.penalty>=5);assert(r.control.events.some(e=>e.reason.includes('Delta')));
 assert.equal(p.d,450);assert.equal(p.speed,20);
 assert.match(r.control.instruction(),/DELTA VSC/);
});
test('a compliant VSC delta stays positive without a penalty',()=>{
 const {r,p,b}=pair();b.d=700;r.control.activate('vsc',30);
 for(let i=0;i<70;i++)frame(r,.1,()=>p.d+=3);
 assert(r.control.delta(p)>0);assert.equal(r.penalty,0);
});
test('Safety Car captures a queue and releases overtaking only at the restart line',()=>{
 const {r,p,b}=pair();p.d=100;b.d=80;r.control.activate('sc',.1);
 frame(r,.2);assert.equal(r.control.phase,'restart');assert.equal(r.flag,'sc');
 const line=r.control.restartLine;assert.equal(line,1200);
 p.d=line-.1;frame(r,.1);assert.equal(r.flag,'sc');
 p.d=line+.1;frame(r,.1);assert.equal(r.flag,'green');assert.equal(r.control.active,null);
});
test('a minor contact cannot downgrade an active Safety Car',()=>{
 const {r}=pair();r.control.activate('sc',35);r.collide(.05);
 assert.equal(r.flag,'sc');assert.equal(r.control.active,'sc');assert(r.flagTimer>=35);
});
test('Safety Car pace is a target for AI and a monitored limit for the manual player',()=>{
 const {r,p,b}=pair();p.d=200;b.d=180;r.control.activate('sc',30);
 assert(r.control.speedLimit(b)<=35);const original=p.d;
 for(let i=0;i<70;i++)frame(r,.1,()=>{p.speed=40;});
 assert(r.penalty>=5);assert.equal(p.d,original);assert.equal(p.speed,40);
});
for(let i=0;i<6;i++)test(`APX-0${i+1} AI pit entry, stationary service and merge have bounded lateral motion`,()=>{
 const r=new S.Race(S.makeTrack(i),{laps:5,pitLap:1,fuel:30,consumption:false}),a=r.cars[0];
 r.cars=[r.player,a];r.player.d=-1500;a.d=r.track.length-670;a.speed=50;r.phase='race';
 let serviced=false,maxLaneStep=0,previous=a.lane,limited=true;
 for(let n=0;n<120*100;n++){
  r.time+=1/120;r.updateAI(1/120);
  maxLaneStep=Math.max(maxLaneStep,Math.abs(a.lane-previous));previous=a.lane;
  if(a.pitPhase==='service'){serviced=true;assert.equal(a.speed,0);}
  if(a.pitPhase)limited&&=a.speed<=80/3.6+.2;
  if(a.pitted&&!a.pitPhase)break;
 }
 assert(serviced);assert(a.pitted);assert.equal(a.pitPhase,'');assert(a.lane<7.4);
 assert(maxLaneStep<.04,JSON.stringify({maxLaneStep}));assert(limited);
});
test('pit exit waits for traffic instead of crossing an occupied lane',()=>{
 const {r,p,b:a}=pair();r.updateAI(1/120);
 Object.assign(a,{d:1350,lane:14,speed:10,pitPhase:'exit',aiMode:'pit',pitted:true});
 p.d=1345;p.lane=0;p.speed=40;
 assert.equal(AI.mergeClear(r,a),false);
 for(let i=0;i<240;i++){r.time+=1/120;r.updateAI(1/120);}
 assert.equal(a.pitPhase,'exit');assert(a.lane>13.9);assert(a.d<1366);
});
test('an occupied adjacent lane is rejected for attack or defence',()=>{
 const {r,p,b}=pair();p.d=b.d+2;p.lane=-3.2;
 assert.equal(AI.clearLane(r,b,-3.2),false);assert.equal(AI.clearLane(r,b,3.2),true);
});
test('AI wet tyres, temperatures, fuel mass and damage affect bounded dynamics',()=>{
 const speeds=[];
 for(const wet of [false,true]){
  const r=new S.Race({...flat,length:1e6},{fuel:30,weather:wet?'storm':'sun',tyre:'soft',consumption:true}),a=r.cars[0];
  r.cars=[r.player,a];r.player.d=-1000;r.updateAI(1/120);a.frontTemp=a.rearTemp=wet?20:95;
  for(let i=0;i<600;i++){r.time+=1/120;r.updateAI(1/120);}
  speeds.push(a.speed);assert(a.fuel<30);assert(a.battery>=0&&a.battery<=100);assert(Number.isFinite(a.temp));
 }
 assert(speeds[0]>speeds[1]+3,JSON.stringify(speeds));
});
test('AI fuel mass and component damage have measurable effects without unbounded acceleration',()=>{
 function run(fuel,damage){
  const r=new S.Race({...flat,length:1e6},{fuel,consumption:false,weather:'sun'}),a=r.cars[0];
  r.cars=[a];r.updateAI(1/240);a.speed=60;a.frontTemp=a.rearTemp=100;a.damage=damage;
  let maxAcceleration=0,maxBraking=0;
  for(let i=0;i<240*4;i++){
   const old=a.speed;r.time+=1/240;r.updateAI(1/240);
   maxAcceleration=Math.max(maxAcceleration,(a.speed-old)*240);maxBraking=Math.max(maxBraking,(old-a.speed)*240);
  }
  assert(maxAcceleration<=11.001);assert(maxBraking<=27.001);return a.speed;
 }
 const light=run(5,0),heavy=run(80,0),damaged=run(5,.8);
 assert(light>heavy+.1,JSON.stringify({light,heavy}));assert(light>damaged+2,JSON.stringify({light,damaged}));
});
test('AI time penalties feed the same result ledger as player penalties',()=>{
 const {r,p,b}=pair();p.d=108;b.d=100;r.control.activate('vsc',30);
 frame(r,.5,()=>b.d=109);frame(r,6);r.updateResults([],r.time);
 assert.equal(r.results.record(b).penalty,5);assert.equal(r.results.record(p).penalty,0);
});
test('an AI crossing the finish while running out of fuel keeps its recorded finish',()=>{
 const r=new S.Race(flat,{laps:1,fuel:30,pitLap:99}),a=r.cars[0];
 r.phase='race';r.cars=[r.player,a];r.player.d=-500;
 r.updateAI(1/240);prepare(r.results,a,flat.length-.001,0);
 Object.assign(a,{fuel:0,speed:.51,x:a.d,z:a.lane,heading:0,vx:.51,vz:0});
 r.step(1/240,{});
 assert.equal(r.results.status(a),'finished');assert.notEqual(r.results.record(a).finishTime,null);
});
test('a checkered flag does not release a neutralized field still approaching the finish',()=>{
 const {r}=pair();r.control.activate('sc',.1);const before=r.control.safetyCarD;
 r.flag='checkered';frame(r,.2);
 assert.equal(r.flag,'checkered');assert.equal(r.control.active,'sc');assert(r.control.safetyCarD>before);
});
