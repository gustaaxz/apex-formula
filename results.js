/* Race classification from ordered course crossings; times are seconds since lights out. */
(function(root){
'use strict';
const POINTS=Object.freeze([25,18,15,12,10,8,6,4,2,1]);
const Timing=typeof module!=='undefined'?require('./timing.js'):root.ApexTiming;
class Classification{
 constructor(track,laps){
  this.track=track;this.length=typeof track==='number'?track:track.length;
  this.laps=laps;
  this.records=new Map();
  this.progress=new Map();
  this.checkeredAt=null;
  this.gracePeriod=600;
  this.final=null;
  this.rewardClaimed=false;
 }
 record(car){
  if(!this.records.has(car.id))this.records.set(car.id,{
   id:car.id,status:'running',laps:0,lastLine:-1,distance:Math.min(0,car.d),
   finishTime:null,retiredAt:null,reason:'',penalty:0
  });
  return this.records.get(car.id);
 }
 status(car){return this.record(car).status;}
 progressOf(car){
  if(!this.progress.has(car.id))this.progress.set(car.id,new Timing.CourseProgress(this.track));
  return this.progress.get(car.id);
 }
 setPenalty(car,seconds){if(!this.final)this.record(car).penalty=Math.max(0,Number(seconds)||0);}
 update(segments,before,after){
  const updates=new Map();
  if(this.final)return updates;
  const crossings=[];
  for(const segment of segments){
   const {car}=segment;
   const row=this.record(car);
   if(row.status!=='running')continue;
   const progress=this.progressOf(car),events=progress.update(segment,before,after);
   updates.set(car.id,events);row.distance=progress.distance;
   for(const event of events)if(event.type==='line'||event.type==='start')crossings.push({...event,car});
  }
  // A leader may cross after a lapped car within the same physics step.
  crossings.sort((a,b)=>a.time-b.time||a.car.id-b.car.id);
  if(this.checkeredAt===null){
   const winner=crossings.find(event=>event.credited&&event.laps>=this.laps);
   if(winner)this.checkeredAt=winner.time;
  }
  for(const {car,laps=0,time,distance,type,credited} of crossings){
   const row=this.record(car);
   if(row.status!=='running')continue;
   row.lastLine=Math.round(distance/this.length);
   row.laps=laps;
   if(this.checkeredAt!==null&&time>=this.checkeredAt&&(credited||type==='start')){
    row.status='finished';
    row.finishTime=time;
    row.distance=laps*this.length;
    this.stop(car,'finished');
   }
  }
  return updates;
 }
 stop(car,status){
  car.raceStatus=status;
  car.speed=car.vx=car.vz=car.yawRate=car.forwardSpeed=0;
  car._lastSpeed=0;
 }
 retire(car,time,reason='Abandono'){
  if(this.final)return;
  const row=this.record(car);
  if(row.status!=='running')return;
  row.status='dnf';
  row.retiredAt=time;
  row.distance=this.progressOf(car).distance;
  row.reason=reason;
  this.stop(car,'dnf');
 }
 expire(cars,time){
  if(this.checkeredAt===null||time<this.checkeredAt+this.gracePeriod)return;
  for(const car of cars)this.retire(car,time,'Não concluiu em 10 min após a bandeirada');
 }
 rows(cars){
  if(this.final)return this.final;
  const order={finished:0,running:1,dnf:2};
  const rows=cars.map(car=>({...this.record(car),name:car.name,team:car.team,number:car.number,bestLap:car.bestLap,lastLap:car.lastLap,tyre:car.tyre,pitStops:car.pitStops||0}));
  rows.sort((a,b)=>order[a.status]-order[b.status]||b.laps-a.laps||
   (a.status==='finished'?(a.finishTime+a.penalty)-(b.finishTime+b.penalty):b.distance-a.distance)||a.id-b.id);
  const leader=rows.find(row=>row.status==='finished');
  return rows.map((row,i)=>({
   ...row,position:i+1,
   correctedTime:row.finishTime===null?null:row.finishTime+row.penalty,
   lapsBehind:leader?Math.max(0,leader.laps-row.laps):null,
   points:row.status==='finished'?(POINTS[i]||0):0
  }));
 }
 complete(cars){return cars.every(car=>this.status(car)!=='running');}
 finalize(cars){
  if(!this.final&&this.complete(cars))this.final=Object.freeze(this.rows(cars).map(row=>Object.freeze(row)));
  return this.final;
 }
 claimReward(cars,player,mode,collisions=0){
  if(!this.final||this.rewardClaimed||!['career','championship'].includes(mode))return null;
  this.rewardClaimed=true;
  const row=this.final.find(row=>row.id===player.id);
  const finished=row?.status==='finished';
  return Object.freeze({
   position:row?.position??null,points:finished?row.points:0,
   credits:finished&&mode==='career'?40+row.points*4:0,
   reputation:finished&&mode==='career'?Math.max(2,22-row.position)-collisions*3:0,
   advanceRound:true
  });
 }
}
function applyReward(profile,reward){
 if(!reward)return '';
 profile.points+=reward.points;
 profile.credits+=reward.credits;
 profile.reputation=Math.max(0,Math.min(100,profile.reputation+reward.reputation));
 if(reward.advanceRound)profile.round++;
 if(profile.round<6)return '';
 const message=`Temporada concluída: ${profile.points} pontos. Uma nova temporada está disponível.`;
 profile.round=0;profile.season++;profile.lastSeasonPoints=profile.points;profile.points=0;
 return message;
}
root.ApexResults={Classification,applyReward};
if(typeof module!=='undefined')module.exports=root.ApexResults;
})(typeof window!=='undefined'?window:globalThis);
