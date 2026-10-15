const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../controls.js'),{Feedback}=require('../coaching.js'),Training=require('../training.js');
const {S,race,drive}=require('./helpers.cjs');
const pad=(buttons={},axes=[0,0,0,0])=>({connected:true,index:0,id:'test',mapping:'standard',axes,buttons:Array.from({length:32},(_,i)=>({value:buttons[i]||0}))});
function sample(config,keys={},buttons={},axes){return new C.Input(config).sample(keys,{},pad(buttons,axes));}
test('control settings validate numbers, schema, maps and missing or blocked storage',()=>{
 const out=C.normalize({version:1,deadzone:NaN,pedalRate:100,sensitivity:-1,keyboard:{throttle:'KeyS'},gamepad:{throttle:6}});
 assert.equal(out.deadzone,.12);assert.equal(out.pedalRate,8);assert.equal(out.sensitivity,.5);
 assert.deepEqual(out.keyboard,C.defaults().keyboard);assert.deepEqual(out.gamepad,C.defaults().gamepad);
 assert.deepEqual(C.load({getItem(){throw Error('blocked');}}),C.defaults());assert.deepEqual(C.load({getItem:()=>'{'}),C.defaults());
 assert.equal(C.save(undefined,out),false);assert.equal(C.save({setItem(){throw Error('quota');}},out),false);
 let value;assert(C.save({setItem(k,v){value=v;}},out));assert.deepEqual(C.load({getItem:()=>value}),out);
});
test('remapping removes the old primary key while keeping arrow and Escape backups',()=>{
 const c=C.defaults();c.keyboard.throttle='KeyI';assert.equal(C.actionForCode(c,'KeyI'),'throttle');assert.equal(C.actionForCode(c,'KeyW'),null);
 assert.equal(C.actionForCode(c,'ArrowUp'),'throttle');assert.equal(C.actionForCode(c,'Escape'),'pause');
 assert.equal(sample(c,{KeyW:true}).digitalThrottle,0);assert.equal(sample(c,{KeyI:true}).digitalThrottle,1);
 assert.equal(sample(c,{ArrowUp:true}).digitalThrottle,1);
 assert.equal(new C.Input(c).sample({}, {throttle:true}).digitalThrottle,1);
});
test('bindings reject collisions, reserved and browser shortcut keys and invalid buttons',()=>{
 const c=C.defaults();assert(C.bindingError(c,'keyboard','throttle','KeyS'));assert(C.bindingError(c,'keyboard','throttle','Escape'));
 for(const key of ['F5','ControlLeft','AltLeft','MetaLeft','ArrowUp','<script>'])assert(C.bindingError(c,'keyboard','throttle',key));
 assert.equal(C.bindingError(c,'keyboard','throttle','KeyI'),'');assert(C.bindingError(c,'gamepad','up',7));
 assert(C.bindingError(c,'gamepad','up',32));assert(C.bindingError(c,'gamepad','throttle',null));assert.equal(C.bindingError(c,'gamepad','up',null),'');
});
test('continuous dead zones keep neutral stable and full travel for every sensitivity',()=>{
 for(const sensitivity of [.5,1,2]){assert.equal(C.axis(.1,.12,sensitivity),0);assert.equal(C.axis(-.12,.12,sensitivity),0);assert.equal(C.axis(1,.12,sensitivity),1);assert.equal(C.axis(-1,.12,sensitivity),-1);}
 assert(Math.abs(C.axis(.12001,.12))<.0001);assert(C.axis(.5,.12,2)>C.axis(.5,.12,.5));assert.equal(C.axis(NaN,.1),0);
 assert.equal(C.pedal(.01,.02),0);assert.equal(C.pedal(1,.02),1);assert.equal(C.pedal(-1,.02),0);
});
test('gamepad remapped pedals and buttons are independent of keyboard and disconnect cleanly',()=>{
 const c=C.defaults();c.gamepad.up=10;const input=new C.Input(c),p=pad({10:1,7:.5},[.6,0,.5]);
 let raw=input.sample({}, {},p);assert.deepEqual(raw.actions,['up']);assert(raw.analogThrottle>.45&&raw.analogThrottle<.5);assert(raw.steer>0);assert(raw.look>0);
 assert.deepEqual(input.sample({}, {},p).actions,[]);input.sample({}, {},pad());assert.deepEqual(input.sample({}, {},p).actions,['up']);
 raw=input.sample({}, {},null);assert.equal(raw.analogThrottle,0);assert.equal(raw.steer,0);assert.equal(raw.look,0);
 const d=C.defaults();d.gamepad.left=10;assert.equal(sample(d,{}, {10:1}).steer,-1);
});
test('digital pedals rise by simulation time, release immediately and do not shape analog pressure',()=>{
 const input=new C.Input(),raw=input.sample({KeyW:true,KeyS:true});let result;
 for(let i=0;i<12;i++)result=input.step(raw,1/120);assert(Math.abs(result.throttle-.15)<1e-9);assert(Math.abs(result.brake-.15)<1e-9);
 result=input.step(input.sample(),1/120);assert.equal(result.throttle,0);assert.equal(result.brake,0);
 const analog=input.sample({}, {},pad({7:.4,6:.2}));result=input.step(analog,1/120);assert.equal(result.throttle,analog.analogThrottle);assert.equal(result.brake,analog.analogBrake);
 input.reset();assert.equal(input.throttle,0);
});
test('pedal response at 30, 60 and 120 render Hz produces identical physics at 120 Hz',()=>{
 function run(hz){const input=new C.Input(),r=race(),raw=input.sample({KeyW:true});let remainder=0;for(let frame=0;frame<hz*2;frame++){remainder+=1/hz;while(remainder>=1/120-1e-10){r.step(1/120,input.step(raw,1/120));remainder-=1/120;}}return [r.player.d,r.player.speed,r.player.battery];}
 assert.deepEqual(run(30),run(60));assert.deepEqual(run(60),run(120));
});
test('steering response setting changes input rate without automatic trajectory correction or assists',()=>{
 const slow=race({steerRate:1}),fast=race({steerRate:8});slow.step(.1,{steer:1});fast.step(.1,{steer:1});
 assert(fast.player.steer>slow.player.steer*4);assert.equal(slow.player.d,0);assert.equal(fast.player.d,0);
 for(const flag of ['automatic','assists','tc','abs','brakeAssist'])assert.equal(fast.config[flag],false);
});
function telemetry(overrides={}){return {phase:'race',finish:false,pit:false,playerDone:false,config:{consumption:true},player:{speed:20,frontLocked:false,rearLocked:false,wheelspin:false,frontTemp:100,rearTemp:100,tyre:'medium',fuel:18,...overrides}};}
function ticks(f,r,n){for(let i=0;i<n;i++)f.tick(r,1/120);}
test('feedback debounces lock, keeps recovery hint briefly and consumes each cue once',()=>{
 const f=new Feedback(),r=telemetry({frontLocked:true});ticks(f,r,10);assert.equal(f.alerts.length,0);ticks(f,r,6);assert.equal(f.alerts[0].id,'lock');
 assert.deepEqual(f.consumeCues(),['lock']);assert.deepEqual(f.consumeCues(),[]);r.player.frontLocked=false;ticks(f,r,12);assert.equal(f.alerts[0].id,'lock');ticks(f,r,30);assert.equal(f.alerts.length,0);
});
test('feedback prioritizes both axle locks and spin, suppresses stopped car and finished/grid phases',()=>{
 const f=new Feedback(),r=telemetry({rearLocked:true,wheelspin:true,frontTemp:20,rearTemp:140,fuel:1});ticks(f,r,150);
 assert.deepEqual(f.alerts.map(a=>a.id),['lock','spin','fuel','hot','cold']);
 r.phase='start';f.tick(r,.1);assert.equal(f.alerts.length,0);r.phase='race';r.player.speed=0;r.player.fuel=18;ticks(f,r,150);assert.equal(f.alerts.length,0);
 r.player.speed=20;r.finish=true;ticks(f,r,150);assert.equal(f.alerts.length,0);
});
test('temperature thresholds respect compound and fuel warnings respect consumption setting',()=>{
 const f=new Feedback(),r=telemetry({tyre:'wet',frontTemp:60,rearTemp:60,fuel:1});ticks(f,r,150);assert.deepEqual(f.alerts.map(a=>a.id),['fuel']);
 r.config.consumption=false;r.player.frontTemp=85;ticks(f,r,150);assert.deepEqual(f.alerts.map(a=>a.id),['hot']);
});
test('feedback has no repeated warning tone while the same condition remains active',()=>{
 const f=new Feedback(),r=telemetry({fuel:1});ticks(f,r,100);assert.deepEqual(f.consumeCues(),['fuel']);ticks(f,r,3000);assert.deepEqual(f.consumeCues(),[]);
 r.player.fuel=18;ticks(f,r,150);r.player.fuel=1;ticks(f,r,100);assert.deepEqual(f.consumeCues(),['fuel']);
});
test('lesson setup creates a solo manual session at explicit speeds and positions',()=>{
 for(const id of Object.keys(Training.LESSONS)){
  const r=race({mode:'training',session:'practice'},S.makeTrack(0)),l=Training.setup(r,id);
  assert.equal(r.cars.length,1);assert.equal(r.phase,'race');assert.equal(r.config.automatic,false);assert.equal(l.finished,false);
  assert.equal(Math.round(r.player.speed*3.6),id==='braking'?80:id==='pit'?40:0);
 }
});
test('gear lesson requires successful up and down actions in order',()=>{
 const r=race(),l=new Training.Lesson('gears',r);r.player.gear=1;r.player.speed=60/3.6;l.tick(r,.1,{});assert.equal(l.stage,1);
 r.player.gear=2;r.player.speed=80/3.6;l.tick(r,.1,{});assert.equal(l.stage,1);l.action('up',false);l.tick(r,.1,{});assert.equal(l.stage,1);
 l.action('up',true);l.tick(r,.1,{});assert.equal(l.stage,2);r.player.gear=1;r.player.speed=30/3.6;l.tick(r,.1,{});assert.equal(l.finished,false);
 l.action('down',true);l.tick(r,.1,{});assert(l.success);const reason=l.reason;l.action('down',true);l.tick(r,1000,{});assert.equal(l.reason,reason);
});
test('real braking exercise can be completed with proportional braking and fails with locked wheels',()=>{
 function run(brake){const r=race({mode:'training',session:'practice'},S.makeTrack(0)),l=Training.setup(r,'braking');for(let i=0;i<120*15&&!l.finished;i++){r.step(1/120,{brake});l.tick(r,1/120,{brake});}return l;}
 const clean=run(.14),locked=run(1);assert(clean.finished);assert(clean.success,clean.reason);assert(locked.finished);assert.equal(locked.success,false);assert(locked.lockTime>.35);
});
test('real gear exercise completes through explicit pedals and sequential shifts on the practice straight',()=>{
 const r=race({mode:'training',session:'practice'},S.makeTrack(0)),l=Training.setup(r,'gears');
 for(let i=0;i<120*60&&!l.finished;i++){
  if(l.stage===1&&r.player.gear===1)l.action('up',r.shift(1));
  if(l.stage===2&&r.player.gear===2&&r.player.speed*3.6<40)l.action('down',r.shift(-1));
  const input=l.stage<2?{throttle:.45}:{brake:.14};r.step(1/120,input);l.tick(r,1/120,input);
 }
 assert(l.success,l.reason);assert.equal(r.player.gear,1);assert(r.player.speed*3.6<40);assert.equal(r.collisions,0);
});
test('braking exercise rejects coasting, off-road, distance and collision failures',()=>{
 for(const kind of ['coast','distance','offroad','collision']){
  const r=race(),l=new Training.Lesson('braking',r);if(kind==='distance')r.player.d=101;else if(kind==='offroad')r.player.lane=8;else if(kind==='collision')r.collisions++;
  for(let i=0;i<65;i++)l.tick(r,1/120,{});assert(l.finished,kind);assert.equal(l.success,false,kind);
 }
});
test('default keyboard pedal ramp can pass braking with 167 ms presses and 100 ms releases',()=>{
 const r=race({mode:'training',session:'practice'},S.makeTrack(0)),l=Training.setup(r,'braking'),reader=new C.Input();
 for(let i=0;i<120*20&&!l.finished;i++){
  const held=r.player.speed<2||i%32<20,input=reader.step(reader.sample(held?{KeyS:true}:{}),1/120);
  r.step(1/120,input);l.tick(r,1/120,input);
 }
 assert(l.success,l.reason);assert.equal(l.lockTime,0);assert(r.player.d-l.start<100);
});
test('pit lesson observes the real entry, service and manual exit on Costa Verde',()=>{
 const t=S.makeTrack(0),r=race({mode:'training',session:'practice'},t),l=Training.setup(r,'pit');r.requestPit();r.toggleLimiter();
 const seen=new Set();for(let i=0;i<120*120&&!l.finished;i++){
  const d=r.player.d-t.length,input=drive(r,10,d<-370?0:d<55?14:0);if(!r.pitCount&&d>-94&&d<-60){input.throttle=0;input.brake=.3;}
  r.step(1/120,input);l.tick(r,1/120,input);seen.add(l.stage);
 }
 assert(l.success,l.reason);assert.equal(r.pitCount,1);assert.equal(r.pit,false);assert.equal(r.collisions,0);assert(seen.has(3));assert(seen.has(4));
});
test('pit lesson rejects limiter omission, speeding and missed approach',()=>{
 for(const kind of ['limiter','speed','missed']){
  const r=race(),l=new Training.Lesson('pit',r);r.track={length:1000};
  if(kind==='missed')r.player.d=750;
  else{r.pit=true;r.pitState='entry';r.player.speed=kind==='speed'?30:10;r.player.pitLimiter=kind==='speed';}
  l.tick(r,.1,{});assert(l.finished,kind);assert.equal(l.success,false);
 }
});
test('lessons time out and instructions follow configured key labels',()=>{
 const r=race(),l=new Training.Lesson('gears',r);assert(l.instruction(r,()=> 'I').includes('I'));l.tick(r,121,{});assert(l.finished);assert.equal(l.success,false);
});
