/* Deterministic opponent controller. Bounded road/lane motion, approximate tyre
   and power limits; it is not the player's full free-heading vehicle solver. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./chassis.js'):root.ApexChassis;
const V=typeof module!=='undefined'?require('./vehicle.js'):root.ApexVehicle;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(v,n)=>((v%n)+n)%n;
const gap=(a,b,L)=>mod(b.d-a.d+L/2,L)-L/2;
function init(r,a){
 if(a.aiReady)return;
 Object.assign(a,{aiReady:true,fuel:r.config.fuel,battery:100,frontTemp:70,rearTemp:70,temp:70,damage:a.damage||0,lateralSpeed:0,targetLane:a.lane,decisionAt:0,decisionHold:0,pitPhase:'',gear:1});
}
function clearLane(r,a,lane){
 return !r.cars.some(b=>b!==a&&!b.raceStatus&&Math.abs(gap(a,b,r.track.length))<12+a.speed*.25&&Math.abs(b.lane-lane)<2.6);
}
function mergeClear(r,a){
 return !r.cars.some(b=>b!==a&&!b.raceStatus&&Math.abs(b.lane)<8&&Math.abs(gap(a,b,r.track.length))<Math.max(22,b.speed*1.4));
}
function step(r,dt,tyres){
 const L=r.track.length,c=r.config;
 for(const a of r.cars){
  if(a===r.player||a.raceStatus)continue;
  init(r,a);
  const course=r.results.progressOf(a),priorSpeed=a.speed,s=mod(a.d,L),lap=course.sample?course.laps+1:Math.floor(Math.max(0,a.d)/L)+1;
  const q0=r.track.at(a.d);
  if(!a._contactReady){a.x=q0.x+q0.nx*a.lane;a.z=q0.z+q0.nz*a.lane;a.heading=Math.atan2(q0.tz,q0.tx);}
  const tyre=tyres[a.tyre],thermal=(V.thermalGrip(a.frontTemp,a.tyre)+V.thermalGrip(a.rearTemp,a.tyre))/2;
  const grip=(tyre.grip*(1-r.wetness)+tyre.wet*r.wetness)*(1-(1-a.condition)*.4)*(1-a.damage*.22)*thermal;
  const mass=800+a.fuel,downforce=(a.aero?.front||0)+(a.aero?.rear||0);
  const traction=clamp(grip*1.65*(9.81+downforce/mass),4,45),braking=Math.min(27,traction*.9);
  let desired=r.targetSpeed(a.d,grip)*a.skill*(.65+c.difficulty*.0045)*(1-r.wetness*(1-a.wetSkill)),lane=a.targetLane;
  // Plan braking over distance, rather than changing speed at a curve's apex.
  for(let look=30;look<=210;look+=30){const k=Math.abs(r.track.at(a.d+look).k),corner=Math.sqrt(traction/(k+.001));desired=Math.min(desired,Math.sqrt(corner*corner+2*braking*look));}
  const neutral=r.control?.active==='sc'||r.control?.active==='vsc';
  if(!a.pitted&&lap>=c.pitLap&&s>L-650){a.pitIntent=true;lane=3.2;}
  if(a.pitIntent&&!a.pitPhase&&s>L-360&&s<L-255){
   a.pitPhase='entry';a.aiMode='pit';a.pitStart=a.d;a.pitStartLane=a.lane;
   a.serviceD=Math.floor(a.d/L)*L+L-105-Math.floor(a.id/2)*9;
  }
  if(a.pitIntent&&s>L-650&&!a.pitPhase)desired=Math.min(desired,Math.sqrt((80/3.6)**2+2*Math.min(braking,8)*Math.max(0,L-360-s)));
  if(a.pitPhase){
   desired=Math.min(desired,80/3.6);
   if(a.pitPhase==='entry'){
    const u=clamp((a.d-a.pitStart)/105,0,1),smooth=u*u*(3-2*u);
    lane=a.pitStartLane+(14-a.pitStartLane)*smooth;
    desired=Math.min(desired,Math.sqrt(2*braking*Math.max(0,a.serviceD-a.d-.05)));
    if(a.d>=a.serviceD-.25&&a.speed<1&&Math.abs(a.lane-14)<.6){a.pitPhase='service';a.pitTimer=2.8+(a.id%4)*.2;a.speed=0;}
   }
   if(a.pitPhase==='service'){
    a.pitTimer-=dt;desired=0;lane=14;
    if(a.pitTimer<=0){a.pitPhase='exit';a.pitStops=(a.pitStops||0)+1;a.pitted=true;a.pitIntent=false;a.tyre=r.wetness>.65?'wet':r.wetness>.3?'inter':'hard';a.condition=1;a.frontTemp=a.rearTemp=a.temp=70;a.damage=a.frontWingDamage=a.rearWingDamage=0;}
   }
   if(a.pitPhase==='exit'){
    lane=14;
    if(s>90&&s<180&&mergeClear(r,a)){a.pitPhase='merge';a.mergeStart=a.d;a.mergeLane=a.lane;}
    else if(s>125&&s<180)desired=Math.min(desired,Math.sqrt(2*braking*Math.max(0,165-s)));
   }
   if(a.pitPhase==='merge'){
    const u=clamp((a.d-a.mergeStart)/75,0,1);lane=a.mergeLane+(3.2-a.mergeLane)*(u*u*(3-2*u));
    if(!mergeClear(r,a)&&a.lane>8){desired=0;lane=a.lane;}
    if(a.lane<6){a.pitPhase='';a.aiMode='racing';a.targetLane=3.2;}
   }
  }else if(!a.pitIntent&&r.time>=a.decisionAt){
   a.decisionAt=r.time+.25;
   const front=r.cars.filter(b=>b!==a&&!b.raceStatus&&Math.abs(b.lane-a.lane)<2.5&&gap(a,b,L)>0).sort((b,d)=>gap(a,b,L)-gap(a,d,L))[0];
   a.aiDecision='racing';lane=0;
   if(front&&gap(a,front,L)<65){
    const choices=[-3.2,3.2].sort((x,y)=>Math.abs(x-a.lane)-Math.abs(y-a.lane));
    const pass=!neutral&&choices.find(candidate=>clearLane(r,a,candidate));
    if(pass!==false&&pass!==undefined&&a.speed>front.speed-2){lane=pass;a.aiDecision='attack';a.decisionHold=r.time+1.5;}
    else{lane=a.lane;a.aiDecision='follow';}
   }else if(!neutral){
    const rear=r.cars.find(b=>b!==a&&!b.raceStatus&&gap(a,b,L)<0&&gap(a,b,L)>-30&&b.speed>a.speed+2);
    if(rear&&r.time>=a.decisionHold&&clearLane(r,a,Math.sign(rear.lane||1)*2.4)){lane=Math.sign(rear.lane||1)*2.4;a.aiDecision='defend';a.decisionHold=r.time+2;}
    else if(r.time<a.decisionHold)lane=a.targetLane;
   }
   a.targetLane=lane;
  }else if(!a.pitIntent)lane=a.targetLane;
  if(neutral&&!a.pitPhase){desired=Math.min(desired,r.control.speedLimit(a));lane=a.lane;}
  // Keep a braking gap even when a passing lane becomes occupied.
  for(const b of r.cars){
   if(b===a||b.raceStatus)continue;
   const ahead=gap(a,b,L),sameCorridor=Math.abs(b.lane-a.lane)<2.6;
   if(ahead>0&&ahead<100&&sameCorridor){
    const safe=7+a.speed*.45;
    desired=Math.min(desired,Math.max(0,b.speed+(ahead-safe)*.8));
   }
   if(Math.abs(ahead)<9&&Math.abs(lane-b.lane)<2.6&&Math.abs(a.lane-b.lane)>2.3)lane=a.lane;
  }
  if(a.fuel<=0)desired=0;
  const boost=!neutral&&!a.pitPhase&&a.aiDecision==='attack'&&a.battery>10;
  const enginePower=(540000+(boost?120000:0))*(1-a.damage*.4);
  const acceleration=Math.max(0,Math.min(11,traction*.65,enginePower/(mass*Math.max(15,a.speed)))-(a.aero?.drag||0)/mass);
  a.speed+=clamp(desired-a.speed,-braking*dt,acceleration*dt);
  if(a.pitPhase==='service')a.speed=0;
  const maxLateral=a.pitPhase?3.5:1.8;
  const targetLateral=clamp((lane-a.lane)*2,-maxLateral,maxLateral);
  a.lateralSpeed+=clamp(targetLateral-a.lateralSpeed,-4*dt,4*dt);
  a.lane+=a.lateralSpeed*dt;a.d+=a.speed*dt;
  if(c.consumption)a.fuel=Math.max(0,a.fuel-a.speed*dt*.00045);
  if(c.wear)a.condition=Math.max(.08,a.condition-a.speed*dt*.000009*tyre.wear);
  a.battery=clamp(a.battery+(boost?-7:a.speed>2&&a.speed<priorSpeed?5:0)*dt,0,100);
  const ambient=32-r.wetness*12,optimal=a.tyre==='wet'?55:a.tyre==='inter'?75:100;
  const targetTemp=ambient+(optimal-ambient)*clamp(a.speed/45,0,1)+(priorSpeed-a.speed)/dt*.5;
  a.frontTemp+=(targetTemp-a.frontTemp)*dt*.08;a.rearTemp+=(targetTemp+(boost?8:0)-a.rearTemp)*dt*.08;a.temp=(a.frontTemp+a.rearTemp)/2;
  a.gear=1;while(a.gear<8&&a.speed*3.6*V.POWERTRAIN.rpmPerKph[a.gear]>11500)a.gear++;
  const q=r.track.at(a.d);
  a.contactYaw=(a.contactYaw||0)+(a.contactYawRate||0)*dt;a.contactYaw*=Math.exp(-dt*1.5);a.contactYawRate=(a.contactYawRate||0)*Math.exp(-dt*2);
  a.heading=Math.atan2(q.tz,q.tx)+a.contactYaw;
  a.x=q.x+q.nx*a.lane+(a.contactVX||0)*dt;a.z=q.z+q.nz*a.lane+(a.contactVZ||0)*dt;
  a.contactVX=(a.contactVX||0)*Math.exp(-dt*1.1);a.contactVZ=(a.contactVZ||0)*Math.exp(-dt*1.1);
  a.vx=q.tx*a.speed+q.nx*a.lateralSpeed+a.contactVX;a.vz=q.tz*a.speed+q.nz*a.lateralSpeed+a.contactVZ;
  a.yawRate=a.contactYawRate;a._contactReady=true;a.steerAngle=clamp(Math.atan(3.6*q.k)+a.lateralSpeed/Math.max(10,a.speed),-.34,.34);
  C.project(r,a);C.walls(r,a);if(!a.chassis)C.init(r,a);
  C.step(r,a,dt,(a.speed-priorSpeed)/dt,a.speed*a.speed*q.k,C.aero(r,a,a.speed));
 }
}
root.ApexOpponents={step,clearLane,mergeClear,gap};
if(typeof module!=='undefined')module.exports=root.ApexOpponents;
})(typeof window!=='undefined'?window:globalThis);
