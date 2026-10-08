const S=require('../simulation.js');
const straight={length:1e6,at:d=>({x:d,z:0,y:0,tx:1,tz:0,nx:0,nz:1,k:0})};
function race(config={},track=straight){const r=new S.Race(track,{mode:'time',laps:58,fuel:30,consumption:false,wear:false,...config});r.phase='race';r.resetPlayer(0,0,0);return r;}
function advance(r,seconds,input={}){for(let i=0;i<Math.round(seconds*120);i++)r.step(1/120,input);}
function brakeRun(temp=100,config={},speed=100/3.6,pedal=1){const r=race(config);r.resetPlayer(0,0,speed);r.player.temp=temp;let seconds=0;for(;seconds<25&&r.player.speed>.1;seconds+=1/120)r.step(1/120,{brake:pedal});return {metres:r.player.d,seconds,speed:r.player.speed,frontTemp:r.player.frontTemp,rearTemp:r.player.rearTemp,race:r};}
// Test driver only: it sends the same steering, pedals and sequential shifts
// as a human. This controller is never included in the playable game.
function drive(r,maxSpeed=38,lane=0){const p=r.player;if(r.rpm>11000&&p.speed>20)r.shift(1);else if(r.rpm<6200&&p.gear>1)r.shift(-1);const look=8+p.speed*.3,q=r.track.at(p.d+look),dx=q.x+q.nx*lane-p.x,dz=q.z+q.nz*lane-p.z,lateral=-Math.sin(p.heading)*dx+Math.cos(p.heading)*dz,curvature=2*lateral/Math.max(1,dx*dx+dz*dz);let k=0;for(let d=8;d<=150;d+=8)k=Math.max(k,Math.abs(r.track.at(p.d+d).k));const target=Math.min(maxSpeed,Math.sqrt(7/(k+.001))),steer=S.clamp(Math.atan(3.6*curvature)/.34,-1,1),pedal=[0,.16,.22,.28,.34,.45,.55,.65,.75][p.gear];return {steer,throttle:S.clamp((target-p.speed)/5+.08,0,p.speed<4?.3:pedal),brake:S.clamp((p.speed-target)/15,0,.18),clutch:p.speed<4?.65:0};}
module.exports={S,straight,race,advance,brakeRun,drive};
