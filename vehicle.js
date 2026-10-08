/* APEX Formula: approximate planar bicycle model, SI units, no driving aids.
   Ratios inferred from OpenF1 Sainz/Singapore FP2 2023, not team specifications.
   Thermal windows, aero, torque and tyre curves are game calibrations. */
(function(root){
'use strict';
const Chassis=typeof module!=='undefined'?require('./chassis.js'):root.ApexChassis;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const POWERTRAIN=Object.freeze({rpmPerKph:Object.freeze([0,115.7119,88.7011,75.8714,64.1579,53.4306,45.9492,40.1028,35.5677]),idle:4000,shiftRPM:11500,limiterRPM:12500,mechanicalRPM:15000,wheelRadius:.36,reverseRPMPerKph:420,shiftTime:.075});
const WINDOWS={soft:[85,105],medium:[90,110],hard:[95,115],inter:[65,85],wet:[45,65]};
function thermalGrip(temp,tyre){const [lo,hi]=WINDOWS[tyre]||WINDOWS.medium;return temp<lo?clamp(1-(lo-temp)*.0075,.38,1):clamp(1-(temp-hi)*.013,.42,1);}
function init(r){const p=r.player,q=r.track.at(p.d);p.x=q.x+q.nx*p.lane;p.z=q.z+q.nz*p.lane;p.heading=Math.atan2(q.tz,q.tx)+(p.yaw||0);p.vx=Math.cos(p.heading)*p.speed;p.vz=Math.sin(p.heading)*p.speed;p.yawRate=0;p.forwardSpeed=p.speed;p._lastSpeed=p.speed;p._thermalAverage=p.temp;p.frontTemp=p.temp;p.rearTemp=p.temp;p.shiftTimer=0;p.steerAngle=0;p.pitLimiter=!!p.pitLimiter;p.frontLocked=false;p.rearLocked=false;p.wheelspin=false;p.longAcceleration=p.lateralAcceleration=0;p._worldReady=true;p.clutch=p.speed>1?0:1;p.engineRunning=true;p.engineRPM=Math.max(POWERTRAIN.idle,p.speed*3.6*ratio(p.gear));Chassis.init(r,p);}
function reset(r,d,lane=0,speed=0){const p=r.player;Object.assign(p,{d,lane,speed,yaw:0,steer:0});init(r);}
function sync(r){const p=r.player;if(!p._worldReady)init(r);if(Math.abs(p.speed-p._lastSpeed)>.00001){const u=p.forwardSpeed<0?-p.speed:p.speed;p.vx=Math.cos(p.heading)*u;p.vz=Math.sin(p.heading)*u;p.forwardSpeed=u;}if(Math.abs(p.temp-p._thermalAverage)>.00001)p.frontTemp=p.rearTemp=p.temp;}
function project(r){const p=r.player;let d=p.d;for(let i=0;i<6;i++){const q=r.track.at(d),e=(p.x-q.x)*q.tx+(p.z-q.z)*q.tz,l=(p.x-q.x)*q.nx+(p.z-q.z)*q.nz;d+=clamp(e/Math.max(.3,1-q.k*l),-30,30);if(Math.abs(e)<.0001)break;}const q=r.track.at(d);p.d=d;p.lane=(p.x-q.x)*q.nx+(p.z-q.z)*q.nz;p.yaw=wrap(p.heading-Math.atan2(q.tz,q.tx));}
function ratio(gear){return gear===-1?POWERTRAIN.reverseRPMPerKph:POWERTRAIN.rpmPerKph[gear]||0;}
function shift(r,delta){const p=r.player;if(p.gear<1||p.shiftTimer>0)return false;const next=clamp(p.gear+Math.sign(delta),1,8);if(next===p.gear)return false;if(next<p.gear&&Math.abs(p.forwardSpeed||p.speed)*3.6*ratio(next)>POWERTRAIN.mechanicalRPM){r.message('Redução recusada: rotação acima do limite mecânico.');return false;}p.gear=next;p.shiftTimer=POWERTRAIN.shiftTime;p.engineRPM=Math.max(POWERTRAIN.idle,Math.abs(p.forwardSpeed||p.speed)*3.6*ratio(next));return true;}
function reverse(r){const p=r.player;if(p.speed>1){r.message('Pare o carro antes de selecionar a ré.');return false;}p.gear=p.gear===-1?1:-1;p.shiftTimer=POWERTRAIN.shiftTime;r.message(p.gear===-1?'Ré selecionada. Acelere com cuidado.':'Primeira marcha selecionada.');return true;}
function restart(r){const p=r.player;if(p.clutch<.8){r.message('Puxe a embreagem antes de religar o motor.');return false;}p.engineRunning=true;p.engineRPM=POWERTRAIN.idle;r.message('Motor ligado. Dose a embreagem para sair.');return true;}
function powertrain(r,dt,input,u,rearCap=5000){const p=r.player,c=r.config,throttle=clamp(input.throttle||0,0,1);// The playable game couples automatically at low speed; explicit clutch input is retained for physical bench tests.
 const launch=clamp(Math.abs(u)/6,0,1),idleMargin=clamp(((p.engineRPM??POWERTRAIN.idle)-1800)/(POWERTRAIN.idle-1800),0,1);
 p.clutch=input.clutch!==undefined?clamp(input.clutch,0,1):1-idleMargin*(throttle>0?.6+.4*launch:launch);p.shiftTimer=Math.max(0,(p.shiftTimer||0)-dt);
 const roadRPM=u*(p.gear<0?-1:1)*3.6*ratio(p.gear),overall=ratio(p.gear)*2*Math.PI*POWERTRAIN.wheelRadius*60/1000;
 const engagement=p.shiftTimer>0?0:1-p.clutch,capacity=650*engagement*engagement;
 let rpm=p.engineRPM??POWERTRAIN.idle,transmitted=0;
 const coupledTorque=Math.min(540,540000/Math.max(POWERTRAIN.idle,roadRPM)*60/(2*Math.PI))*(c.powerBoost||1)*(1-p.damage*.4);
 const coupledCut=roadRPM>=POWERTRAIN.limiterRPM||p.shiftTimer>0||p.pitLimiter&&Math.abs(u)>80/3.6;
 const coupledNet=(coupledCut?0:throttle*coupledTorque)-40-roadRPM*Math.PI/30*.02;
 // Locked friction is a constraint: it transmits torque even at zero slip.
 // Integrating only a slip spring here would incorrectly remove engine power.
 if(p.engineRunning&&p.fuel>0&&roadRPM>1800&&Math.abs(rpm-roadRPM)<300&&Math.abs(coupledNet)<=capacity){p.engineRPM=r.rpm=roadRPM;p.clutchSlip=0;return {drive:coupledNet*overall/POWERTRAIN.wheelRadius*.92*(p.gear<0?-1:1),engagement};}
 for(let elapsed=0;elapsed<dt-1e-9;){const h=Math.min(.001,dt-elapsed);elapsed+=h;const omega=rpm*Math.PI/30,target=roadRPM*Math.PI/30;
  const torque=p.engineRunning&&p.fuel>0?Math.min(540,540000/Math.max(POWERTRAIN.idle,rpm)*60/(2*Math.PI))*(c.powerBoost||1)*(1-p.damage*.4):0;
  const cut=rpm>=POWERTRAIN.limiterRPM||p.shiftTimer>0||p.pitLimiter&&Math.abs(u)>80/3.6;
  const idle=p.engineRunning&&rpm<=POWERTRAIN.idle?clamp((POWERTRAIN.idle-rpm)*.08+40+omega*.02,0,200):0;
  const engineTorque=(cut?0:throttle*torque)+idle-(p.engineRunning?40+omega*.02:15);
  const clutchTorque=clamp((omega-target)*5,-capacity,capacity);
  const tractionTorque=rearCap*POWERTRAIN.wheelRadius/Math.max(1,overall)/.92;
  // A spinning driven wheel can carry engine speed above the road-speed RPM.
  const reaction=clutchTorque>0?Math.min(clutchTorque,tractionTorque+Math.max(0,clutchTorque-tractionTorque)*.12):clutchTorque;
  rpm=Math.max(0,rpm+(engineTorque-reaction)/.32*h*30/Math.PI);
  if(p.engineRunning&&rpm<1600&&engagement>.3){p.engineRunning=false;r.message('Motor apagou. Puxe SHIFT e pressione I para religar.');}
  transmitted+=clutchTorque*h/dt;
 }
 p.engineRPM=clamp(rpm,0,POWERTRAIN.mechanicalRPM);r.rpm=p.engineRPM;p.clutchSlip=Math.abs(p.engineRPM-roadRPM);
 return {drive:p.engineRunning?transmitted*overall/POWERTRAIN.wheelRadius*.92*(p.gear<0?-1:1):0,engagement};
}
function grid(r,dt,input){sync(r);powertrain(r,dt,input.clutch===undefined?{...input,clutch:1}:input,0);}
function tick(r,dt,input,tyres){
 const p=r.player,c=r.config,q=r.track.at(p.d),tyre=tyres[p.tyre],mass=800+p.fuel,a=1.65,b=1.95,wb=a+b;
 const fX=Math.cos(p.heading),fZ=Math.sin(p.heading),nX=-fZ,nZ=fX;
 let u=p.vx*fX+p.vz*fZ,v=p.vx*nX+p.vz*nZ;
 const throttle=clamp(input.throttle||0,0,1),brake=clamp(input.brake||0,0,1),steer=clamp(input.steer||0,-1,1);
 p.steer+=clamp(steer-p.steer,-dt*3.5,dt*3.5);p.steerAngle=p.steer*.34;
 const offroad=!r.pit&&Math.abs(p.lane)>7.4,wet=r.wetness;
 const base=(tyre.grip*(1-wet)+tyre.wet*wet)*1.65*(1-(1-p.condition)*.4)*(1-p.damage*.22)*(c.gripBoost||1)*(offroad?.42:1);
 const gf=thermalGrip(p.frontTemp,p.tyre),gr=thermalGrip(p.rearTemp,p.tyre);
 const aero=Chassis.aero(r,p,u,v),loads=Chassis.step(r,p,dt,p.longAcceleration||0,p.lateralAcceleration||0,aero);
 // Load sensitivity is applied to each contact; an unloaded wheel has no grip.
 const capacity=w=>w.load>0?base*(w.x>0?gf:gr)*w.load*Math.pow((mass*9.81*(w.x>0?b:a)/wb/2)/w.load,.08):0;
 const frontCap=capacity(p.suspension[0])+capacity(p.suspension[1]),rearCap=capacity(p.suspension[2])+capacity(p.suspension[3]);
 const mode=input.boost?3:r.ersMode,availableWatts=p.battery>0&&throttle>.1&&Math.abs(u)>2&&p.gear!==0?[0,20000,65000,120000][mode]:0;
 const transmission=powertrain(r,dt,input,u,rearCap);
 const deployWatts=p.engineRunning?availableWatts*transmission.engagement:0;r.deploy=deployWatts>0;
 let drive=transmission.drive+deployWatts/Math.max(8,Math.abs(u))*(p.gear<0?-1:1);
 const direction=Math.abs(u)>.05?Math.sign(u):Math.sign(drive)||1;
 const brakeForce=brake*mass*9.81*5.3*(c.brakeBoost||1),bias=clamp(c.bias/100,.45,.67);
 const frontDemand=-direction*brakeForce*bias,rearDemand=drive-direction*brakeForce*(1-bias);
 p.frontLocked=brake>.05&&Math.abs(u)>2&&Math.abs(frontDemand)>frontCap;
 p.rearLocked=brake>.05&&Math.abs(u)>2&&brakeForce*(1-bias)>rearCap;
 p.wheelspin=throttle>.1&&brake<.1&&Math.abs(drive)>rearCap;
 const fCap=frontCap*(p.frontLocked?.76:1),rCap=rearCap*(p.rearLocked?.76:p.wheelspin?.9:1);
 const fxF=clamp(frontDemand,-fCap,fCap),fxR=clamp(rearDemand,-rCap,rCap);
 const latCapF=Math.sqrt(Math.max(0,fCap*fCap-fxF*fxF)),latCapR=Math.sqrt(Math.max(0,rCap*rCap-fxR*fxR));
 const slipF=Math.atan2(v+a*p.yawRate,Math.max(3,Math.abs(u)))-p.steerAngle*Math.sign(u||1),slipR=Math.atan2(v-b*p.yawRate,Math.max(3,Math.abs(u)));
 let fyF=-latCapF*Math.tanh(slipF*70000/Math.max(1,latCapF)),fyR=-latCapR*Math.tanh(slipR*80000/Math.max(1,latCapR));
 const delta=p.frontLocked?0:p.steerAngle,frontX=fxF*Math.cos(delta)-fyF*Math.sin(delta),frontY=fxF*Math.sin(delta)+fyF*Math.cos(delta);
 const drag=aero.drag,grade=(r.track.at(p.d+2).y-r.track.at(p.d-2).y)/4;
 const roll=Math.abs(u)>.03?direction*(mass*9.81*.012+(offroad?mass*1.8:0)):0;
 const ax=(frontX+fxR-drag-roll)/mass-9.81*grade,ay=(frontY+fyR)/mass;
 p.longAcceleration=ax;p.lateralAcceleration=ay;
 p.vx+=(ax*fX+ay*nX)*dt;p.vz+=(ax*fZ+ay*nZ)*dt;
 if(Math.abs(u)<4){const target=u/wb*Math.tan(delta);p.yawRate+=(target-p.yawRate)*Math.min(1,dt*12);const lateral=p.vx*nX+p.vz*nZ;p.vx-=lateral*nX*Math.min(1,dt*8);p.vz-=lateral*nZ*Math.min(1,dt*8);}
 else p.yawRate+=(a*frontY-b*fyR)/(mass*2.4)*dt;
 const newU=p.vx*fX+p.vz*fZ;
 if(brake>0&&(u*newU<0||Math.abs(u)<.1)&&Math.abs(u)<1.5&&Math.abs(drive)<brakeForce||Math.hypot(p.vx,p.vz)<.06&&throttle===0&&Math.abs(grade)<.012){p.vx=p.vz=p.yawRate=0;p.longAcceleration=p.lateralAcceleration=0;}
 p.heading=wrap(p.heading+p.yawRate*dt);p.x+=p.vx*dt;p.z+=p.vz*dt;project(r);
 const s=((p.d%r.track.length)+r.track.length)%r.track.length,pitSide=s>r.track.length-375||s<175;
 const bounds=r.track.boundsAt?.(p.d),minLane=bounds?.minLane??-10.2,maxLane=bounds?.maxLane??(pitSide?17.4:10.2);
 if(p.lane<minLane||p.lane>maxLane){const sign=p.lane<minLane?-1:1,wall=sign<0?minLane:maxLane,t=r.track.at(p.d),out=(p.vx*t.nx+p.vz*t.nz)*sign;p.lane=wall-sign*.05;p.x=t.x+t.nx*p.lane;p.z=t.z+t.nz*p.lane;if(out>0){p.vx-=t.nx*sign*out*1.18;p.vz-=t.nz*sign*out*1.18;if(out>.7)r.collide(.04+out/100,false);}project(r);}
 p.speed=Math.hypot(p.vx,p.vz);p.forwardSpeed=p.vx*Math.cos(p.heading)+p.vz*Math.sin(p.heading);p._lastSpeed=p.speed;
 const regenWatts=brake>0?Math.min(120000,(Math.abs(fxF)+Math.abs(Math.min(0,fxR*direction)))*Math.abs(u)*.25):0;
 p.battery=clamp(p.battery+(regenWatts-deployWatts)*dt/40000,0,100);
 if(c.consumption)p.fuel=Math.max(0,p.fuel-dt*(.001+throttle*.018)*(p.fuel>0?1:0));
 const rollingHeat=Math.min(1,Math.abs(u)/4);
 const heatFront=brake*Math.abs(u)*.06+Math.abs(fyF*v)/25000+Math.abs(slipF)*Math.abs(u)*.055+Math.abs(u)*.02;
 const heatRear=throttle*Math.abs(u)*.024+Math.abs(slipR)*Math.abs(u)*.065+Math.abs(u)*.015+(p.wheelspin?1.8:0);
 const cooling=.008+Math.abs(u)*.00015+wet*.012,ambient=30-wet*7;
 p.frontTemp=clamp(p.frontTemp+(heatFront+.16*rollingHeat-(p.frontTemp-ambient)*cooling)*dt,0,180);
 p.rearTemp=clamp(p.rearTemp+(heatRear+.25*rollingHeat-(p.rearTemp-ambient)*cooling)*dt,0,180);
 p.temp=(p.frontTemp+p.rearTemp)/2;p._thermalAverage=p.temp;
 const [low,high]=WINDOWS[p.tyre]||WINDOWS.medium,cold=Math.min(p.frontTemp,p.rearTemp)<low,hot=Math.max(p.frontTemp,p.rearTemp)>high;
 p.thermalState=cold&&hot?'misto':cold?'frio':hot?'quente':'ideal';
 if(c.wear)p.condition=Math.max(.08,p.condition-dt*p.speed*.000009*tyre.wear*(1+Math.abs(slipF)+Math.abs(slipR)+(p.frontLocked||p.rearLocked?2:0)+(p.wheelspin?1:0))*(p.tyre==='wet'&&wet<.3?2:1));
 r.grip=(gf+gr)/2*base/1.65;r.brakingG=Math.max(0,-p.longAcceleration/9.81);r.lateralG=Math.abs(p.lateralAcceleration/9.81);
}
function step(r,dt,input,tyres){sync(r);const count=Math.ceil(dt/(1/120));for(let i=0;i<count;i++)tick(r,dt/count,input,tyres);}
root.ApexVehicle={POWERTRAIN,WINDOWS,thermalGrip,init,reset,shift,reverse,restart,grid,step};
if(typeof module!=='undefined')module.exports=root.ApexVehicle;
})(typeof window!=='undefined'?window:globalThis);
