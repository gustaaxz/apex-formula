const test=require('node:test'),assert=require('node:assert/strict');
const {S,straight,race,advance}=require('./helpers.cjs');

test('accelerator alone holds the grid, then launches in first after lights out',()=>{
 const r=new S.Race(straight,{mode:'time',laps:58,consumption:false}),d=r.player.d;
 advance(r,6,{throttle:1});assert.equal(r.phase,'start');assert.equal(r.player.d,d);assert.equal(r.player.speed,0);
 advance(r,5,{throttle:1});assert.equal(r.phase,'race');assert(r.player.d>d+40);assert(r.player.speed>20);
 assert.equal(r.player.gear,1);assert(r.player.engineRunning);assert.equal(r.config.tc,false);assert.equal(r.config.abs,false);
});
test('waiting without pedals causes neither creep nor a stalled engine',()=>{
 const r=race();advance(r,20);assert.equal(r.player.speed,0);assert.equal(r.player.d,0);assert(r.player.engineRunning);assert(r.rpm>3500);
});
test('partial accelerator launches gently and more pedal increases speed',()=>{
 const speeds=[.05,.1,.2].map(throttle=>{const r=race();advance(r,2,{throttle});assert(r.player.engineRunning);assert(r.player.d>0);return r.player.speed;});
 assert(speeds[1]>speeds[0],JSON.stringify(speeds));assert(speeds[2]>speeds[1]*1.5,JSON.stringify(speeds));
});
test('repeated accelerate, stop and restart need only the two pedals',()=>{
 const r=race();for(let i=0;i<3;i++){advance(r,3,{throttle:.5});assert(r.player.speed>10);advance(r,6,{brake:.4});assert.equal(r.player.speed,0);assert(r.player.engineRunning);advance(r,2);assert.equal(r.player.speed,0);}
});
test('braking in any of eight gears disengages at low RPM without stalling',()=>{
 for(let gear=1;gear<=8;gear++){const r=race();r.player.gear=gear;r.resetPlayer(0,0,28);advance(r,8,{brake:.4});assert.equal(r.player.speed,0);assert(r.player.engineRunning,'gear '+gear);assert.equal(r.player.gear,gear);}
});
test('reverse uses the same accelerator without any clutch command',()=>{
 const r=race();r.toggleReverse();advance(r,2,{throttle:.3});assert(r.player.d<-2);assert(r.player.forwardSpeed<0);assert(r.player.engineRunning);assert.equal(r.player.gear,-1);
});
test('cold slicks still spin and wet road still changes acceleration with automatic coupling',()=>{
 const dry=race(),wet=race({weather:'storm',tyre:'medium'});let spin=false;
 for(let i=0;i<240;i++){dry.step(1/120,{throttle:1});wet.step(1/120,{throttle:1});spin||=dry.player.wheelspin||wet.player.wheelspin;}
 assert(spin);assert(dry.player.speed>wet.player.speed);assert(dry.player.engineRunning&&wet.player.engineRunning);
});
