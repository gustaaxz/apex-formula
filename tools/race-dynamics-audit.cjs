/* CPU-only smoke/performance audit. No graphics or hardware FPS claim. */
const {performance}=require('node:perf_hooks'),fs=require('node:fs'),path=require('node:path');
const {S,drive}=require('../tests/helpers.cjs');
const measurements=[];
for(let index=0;index<6;index++)for(const wet of [false,true]){
 const track=S.makeTrack(index),r=new S.Race(track,{laps:5,pitLap:2,fuel:40,weather:wet?'storm':'sun',tyre:wet?'wet':'medium'});
 r.phase='race';const start=performance.now();let maxStepMs=0;
 for(let i=0;i<60*60&&!r.finish;i++){
  const before=performance.now();r.step(1/60,drive(r,wet?30:45));maxStepMs=Math.max(maxStepMs,performance.now()-before);
 }
 const elapsedMs=performance.now()-start;
 const finite=r.cars.every(car=>[car.d,car.speed,car.x,car.z,car.fuel].every(Number.isFinite));
 if(!finite)throw Error('Non-finite grid: '+track.id);
 measurements.push({track:track.id,wet,simulatedSeconds:r.time,wallMs:+elapsedMs.toFixed(2),meanStepMs:+(elapsedMs/(60*60)).toFixed(4),maxStepMs:+maxStepMs.toFixed(3),contacts:r.contactCount||0,playerPenalties:r.penalty,aiPenalties:r.cars.filter(car=>car!==r.player).reduce((sum,car)=>sum+(car.timePenalty||0),0),finite});
 console.log(track.id+' '+(wet?'wet':'dry')+' '+elapsedMs.toFixed(0)+' ms');
}
fs.writeFileSync(path.join(__dirname,'../docs/race-stage3-audit.json'),JSON.stringify({renderingIncluded:false,physicsHz:240,reportedStepHz:60,measurements},null,2)+'\n');
