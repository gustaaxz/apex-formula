/* Local race-control rules: pairwise passes, return-position window, SC queue,
   restart line and VSC reference delta. The player always controls the pedals. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class RaceControl{
 constructor(race){this.race=race;this.active=null;this.phase='green';this.order=[];this.pending=new Map();this.bases=new Map();this.events=[];this.frame=new Map();this.startedAt=0;}
 inPit(car){return car===this.race.player?this.race.pit:car.aiMode==='pit';}
 eligible(car){return !car.raceStatus&&!this.inPit(car)&&(car.recoveredUntil||0)<=this.race.time;}
 signedGap(a,b){const L=this.race.track.length;return ((b-a+L*1.5)%L+L)%L-L/2;}
 activate(type,duration){
  const r=this.race,priority={red:3,sc:2,vsc:1};
  if(this.active&&(priority[this.active]||0)>=(priority[type]||0)){this.endsAt=Math.max(this.endsAt,r.time+duration);r.flag=this.active;r.flagTimer=this.endsAt-r.time;return;}
  this.active=type;this.phase=type;this.startedAt=r.time;this.endsAt=r.time+duration;r.flag=type;r.flagTimer=duration;
  this.order=r.cars.filter(car=>this.eligible(car)).sort((a,b)=>b.d-a.d).map(car=>car.id);
  this.bases.clear();for(const car of r.cars)this.bases.set(car.id,{d:car.d,time:r.time});
  const leader=r.cars.find(car=>car.id===this.order[0]);
  this.safetyCarD=(leader?.d||0)+35;this.restartLine=null;
 }
 release(){
  const r=this.race;this.active=null;this.phase='green';r.flag='green';r.flagTimer=0;
  r.message('Bandeira verde. Corrida liberada.');
 }
 tick(dt){
  const r=this.race;
  if(['sc','vsc','red'].includes(r.flag)&&!this.active)this.activate(r.flag,r.flagTimer||20);
  this.frame=new Map(r.cars.map(car=>[car.id,{d:car.d,eligible:this.eligible(car),speed:car.speed}]));
  if(!this.active){
   if(r.flagTimer>0){r.flagTimer-=dt;if(r.flagTimer<=0&&r.flag!=='checkered')this.release();}
   return;
  }
  const checkered=r.flag==='checkered';
  if(!checkered)r.flag=this.active;
  r.flagTimer=Math.max(0,this.endsAt-r.time);
  if(this.active==='sc'){
   this.safetyCarD+=28*dt;
   this.order=this.order.filter(id=>r.cars.some(car=>car.id===id&&this.eligible(car)));
   for(const car of r.cars)if(this.eligible(car)&&!this.order.includes(car.id))this.order.push(car.id);
   if(!checkered&&r.flagTimer<=0){
    const cars=this.order.map(id=>r.cars.find(car=>car.id===id));
    const grouped=cars.every((car,i)=>!i||(this.signedGap(car.d,cars[i-1].d)>=-1&&this.signedGap(car.d,cars[i-1].d)<55));
    if(cars.length<=1){this.release();return;}
    if(this.phase==='sc'&&(grouped||r.time-this.startedAt>=65)){
     this.phase='restart';const leader=cars[0];this.restartLine=(Math.floor(leader.d/r.track.length)+1)*r.track.length;
     r.message('Safety Car entrando. Mantenha a fila; ultrapassagens só após a linha de relargada.');
    }
    if(this.phase==='restart'&&cars[0]?.d>=this.restartLine)this.release();
   }
  }else if(!checkered&&r.flagTimer<=0)this.release();
 }
 delta(car){
  const r=this.race;
  if(!this.bases.has(car.id))this.bases.set(car.id,{d:car.d,time:r.time});
  const base=this.bases.get(car.id);
  return r.time-base.time-(car.d-base.d)/40;
 }
 speedLimit(car){
  const r=this.race;
  if(this.active==='vsc')return 40+clamp(this.delta(car)*2,0,8);
  if(this.active!=='sc')return Infinity;
  const index=this.order.indexOf(car.id),front=index>0?r.cars.find(a=>a.id===this.order[index-1]):null;
  const distance=front?this.signedGap(car.d,front.d):this.safetyCarD-car.d;
  return clamp((front?front.speed:28)+(distance-(front?15:35))*.8,0,35);
 }
 penalize(car,reason){
  const r=this.race;
  if(car===r.player){r.penalty+=5;r.message(reason+' Penalidade de cinco segundos.');}
  else car.timePenalty=(car.timePenalty||0)+5;
  this.events.push({type:'penalty',car:car.id,reason,time:r.time,seconds:5});
 }
 observe(dt){
  const r=this.race,neutral=this.active==='sc'||this.active==='vsc';
  if(neutral)for(let i=0;i<r.cars.length;i++)for(let j=i+1;j<r.cars.length;j++){
   const a=r.cars[i],b=r.cars[j],oldA=this.frame.get(a.id),oldB=this.frame.get(b.id);
   if(!oldA?.eligible||!oldB?.eligible||this.inPit(a)||this.inPit(b)||a.raceStatus==='dnf'||b.raceStatus==='dnf')continue;
   if(Math.abs(a.d-oldA.d)>150*dt+2||Math.abs(b.d-oldB.d)>150*dt+2)continue;
   const before=this.signedGap(oldA.d,oldB.d),after=this.signedGap(a.d,b.d);
   if(Math.abs(before)>12||Math.abs(after)>12)continue;
   const actor=before>0&&after<=0?a:before<0&&after>=0?b:null,other=actor===a?b:a;
   if(!actor||other.speed<3)continue;
   const key=actor.id+':'+other.id;
   const returned=other.id+':'+actor.id;
   if(this.pending.has(returned)){this.pending.delete(returned);continue;}
   if(!this.pending.has(key)){
    this.pending.set(key,{actor,other,deadline:r.time+5});
    if(actor===r.player)r.message('Devolva a posição a '+other.name+' em até cinco segundos.');
   }
  }
  for(const [key,pass] of this.pending){
   const {actor,other}=pass;
   if(this.inPit(other)||other.raceStatus==='dnf'||other.speed<3&&!other.raceStatus||this.signedGap(actor.d,other.d)>1){this.pending.delete(key);continue;}
   if(r.time>=pass.deadline||actor.raceStatus==='finished'){
    this.penalize(actor,'Posição não devolvida durante neutralização.');this.pending.delete(key);
   }
  }
  if(neutral)for(const car of r.cars){
   if(!this.eligible(car)){this.bases.set(car.id,{d:car.d,time:r.time});continue;}
   const excess=this.active==='vsc'?this.delta(car)<-.5:car.speed>35||(car.id===this.order[0]&&car.d>this.safetyCarD-6);
   car.neutralExcess=excess&&r.time-this.startedAt>3?(car.neutralExcess||0)+dt:0;
   if(car.neutralExcess>2&&r.time>=(car.neutralPenaltyAt||0)){
    this.penalize(car,this.active==='vsc'?'Delta do VSC não respeitado.':'Velocidade excessiva sob Safety Car.');
    car.neutralPenaltyAt=r.time+10;car.neutralExcess=0;
   }
  }
 }
 instruction(){
  const r=this.race,pass=[...this.pending.values()].find(pass=>pass.actor===r.player);
  if(pass)return 'DEVOLVA A POSIÇÃO A '+pass.other.name+' · '+Math.max(0,pass.deadline-r.time).toFixed(1)+' S';
  if(this.active==='vsc')return 'DELTA VSC '+(this.delta(r.player)>=0?'+':'')+this.delta(r.player).toFixed(1)+' S · MANTENHA ZERO OU POSITIVO';
  if(this.active==='sc')return this.phase==='restart'?'RELARGADA · SEM ULTRAPASSAR ATÉ A LINHA':'SAFETY CAR · MANTENHA A FILA E REDUZA';
  return '';
 }
}
root.ApexRaceControl={RaceControl};if(typeof module!=='undefined')module.exports=root.ApexRaceControl;
})(typeof window!=='undefined'?window:globalThis);
