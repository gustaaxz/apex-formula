/* Test-only ordered telemetry; never included by index.html. */
(function(root){
'use strict';
function feedLap(r,duration=100,mutate,sampleRate=20){
 const p=r.player,L=r.track.length,start=r.time,base=r.timing.started?r.timing.base:Math.ceil(p.d/L)*L,count=Math.ceil(duration*sampleRate);
 if(!r.timing.started){p.d=base;r.progress.reposition(base,r.track.at(base).x,r.track.at(base).z);}
 for(let i=0;i<count;i++){
  const from={time:r.time,d:p.d,lane:p.lane||0,yaw:p.yaw||0,speed:p.speed||0,pit:r.pit,pitState:r.pitState,penalty:r.penalty,collisions:r.collisions,warnings:r.trackWarnings,tyre:p.tyre};
  r.analysis.from=from;const old=r.track.at(p.d);r.time=start+(i+1)/count*duration;p.d=base+(i+1)/count*L;
  const q=r.track.at(p.d);p.x=q.x;p.z=q.z;p.lane=0;p.yaw=0;p.heading=Math.atan2(q.tz,q.tx);p.speed=L/duration;p._worldReady=true;
  mutate?.(r,i/count);
  const events=r.progress.update({from:from.d,to:p.d,fromX:old.x,fromZ:old.z,x:q.x,z:q.z,pit:r.pit},from.time,r.time);
  r.recordTiming(events);r.analysis.tick(r,from);
 }
 return r.analysis.pendingGhost;
}
function feedDriver(r,car,duration=100,invalid=false){
 const L=r.track.length,start=r.time,count=Math.ceil(duration*20);car.d=0;car.lane=0;car._worldReady=car._contactReady=false;
 for(let i=0;i<count;i++){
  const oldD=car.d,old=r.track.at(oldD),before=r.time;r.time=start+(i+1)/count*duration;car.d=(i+1)/count*L;
  if(invalid&&i===Math.floor(count/2))r.driverClocks.get(car.id).invalidate();
  r.updateResults([{car,d:oldD,x:old.x,z:old.z}],before);
 }
 return car.bestLap;
}
root.ApexPersonalFixtures={feedLap,feedDriver};if(typeof module!=='undefined')module.exports=root.ApexPersonalFixtures;
})(typeof window!=='undefined'?window:globalThis);
