/* Ordered course gates and interpolated lap timing, without rendering dependencies. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class CourseProgress{
 constructor(track){
  this.track=typeof track==='number'?null:track;
  this.length=typeof track==='number'?track:track.length;
  this.divisions=120;this.spacing=this.length/this.divisions;
  this.started=false;this.next=0;this.laps=0;this.blocked=false;
  this.lastCheckpointD=null;this.lastStartD=null;this.sample=null;this.distance=0;
 }
 reposition(d,x,z){this.sample={d,x,z};if(this.started)this.blocked=true;}
 gate(distance,segment){
  if(!this.track)return true;
  const {fromX,fromZ,x,z}=segment;
  if(![fromX,fromZ,x,z].every(Number.isFinite))return false;
  const q=this.track.at(distance),a=(fromX-q.x)*q.tx+(fromZ-q.z)*q.tz,b=(x-q.x)*q.tx+(z-q.z)*q.tz;
  if(b<=a||a>.15||b<-.15)return false;
  const fraction=clamp(-a/(b-a),0,1),side=(fromX+(x-fromX)*fraction-q.x)*q.nx+(fromZ+(z-fromZ)*fraction-q.z)*q.nz;
  const local=((distance%this.length)+this.length)%this.length;
  const pitGate=segment.pit&&(local>this.length-370||local<170);
  return Math.abs(side)<=(pitGate?17:8.5);
 }
 update(segment,before,after){
  const {from,to,fromX,fromZ,x,z}=segment,events=[];
  const fail=reason=>{this.blocked=true;events.push({type:'invalid',reason,time:before});};
  if(![from,to,before,after].every(Number.isFinite)||after<before){fail('Amostra inválida');return events;}
  const allowance=150*(after-before)+2;
  const disconnected=this.sample&&(Math.abs(from-this.sample.d)>.05||
   ([fromX,fromZ,this.sample.x,this.sample.z].every(Number.isFinite)&&Math.hypot(fromX-this.sample.x,fromZ-this.sample.z)>.1));
  const jump=Math.abs(to-from)>allowance||
   ([fromX,fromZ,x,z].every(Number.isFinite)&&Math.hypot(x-fromX,z-fromZ)>allowance);
  this.sample={d:to,x,z};
  if(disconnected||jump){fail('Salto de posição');return events;}
  const accept=(distance,time)=>{
   const index=((Math.round(distance/this.spacing)%this.divisions)+this.divisions)%this.divisions;
   if(index===0){
    if(this.lastStartD!==null&&distance<=this.lastStartD+1e-7)return;
    if(this.started){
     const credited=this.next===0;
     if(credited)this.laps++;
     events.push({type:'line',distance,time,credited,laps:this.laps});
    }else{this.started=true;events.push({type:'start',distance,time});}
    this.next=1;this.blocked=false;this.lastCheckpointD=distance;this.lastStartD=distance;
   }else if(this.started&&index===this.next){
    if(distance<=this.lastCheckpointD+1e-7)return;
    this.lastCheckpointD=distance;this.next=(index+1)%this.divisions;this.blocked=false;
    events.push({type:'checkpoint',index,distance,time});
   }else if(this.started){
    const last=(this.next+this.divisions-1)%this.divisions;
    if(index!==last){this.blocked=true;events.push({type:'invalid',reason:'Ponto de controle fora de ordem',time});}
   }
  };
  // Starting on the grid line is allowed; starting mid-lap never credits a lap.
  if(!this.started&&Math.abs(from/this.length-Math.round(from/this.length))<1e-8&&from>=0&&to>from){
   const q=this.track?.at(from),side=q&&Number.isFinite(fromX)?Math.abs((fromX-q.x)*q.nx+(fromZ-q.z)*q.nz):0;
   if(!this.track||side<=8.5)accept(from,before);
  }
  if(to>from){
   for(let n=Math.max(0,Math.floor(from/this.spacing)+1);n*this.spacing<=to+1e-8;n++){
    const distance=n%this.divisions===0?n/this.divisions*this.length:n*this.spacing,time=before+(after-before)*(distance-from)/(to-from);
    if(distance<=from+1e-8)continue;
    if(this.gate(distance,segment))accept(distance,time);
    else if(this.started){this.blocked=true;events.push({type:'invalid',reason:'Ponto de controle fora do traçado',time});}
   }
  }
  if(!this.started)this.distance=Math.min(0,to);
  else{
   const index=(this.next+this.divisions-1)%this.divisions;
   this.distance=this.laps*this.length+index*this.spacing+(this.blocked?0:clamp(to-this.lastCheckpointD,0,this.spacing));
  }
  return events;
 }
}
class LapClock{
 constructor(length,progress=new CourseProgress(length)){this.length=length;this.progress=progress;this.divisions=120;this.started=false;this.best=null;this.last=null;this.bestTrace=null;this.bestSectors=null;this.lastSectors=[null,null,null];this.completed=[];}
 begin(base,time){this.started=true;this.base=base;this.start=time;this.next=1;this.trace=[0];this.sectors=[null,null,null];this.valid=true;}
 invalidate(){if(this.started)this.valid=false;}
 consume(events){
  const completed=[];
  for(const event of events){
   if(event.type==='invalid'){this.invalidate();continue;}
   if(event.type==='start'){this.begin(event.distance,event.time);continue;}
   if(event.type==='checkpoint'&&this.started){
    if(event.index!==this.next)this.valid=false;
    const elapsed=event.time-this.start;
    this.trace[event.index]=elapsed;this.next=event.index+1;
    if(event.index%40===0){const sector=event.index/40-1;this.sectors[sector]=elapsed-this.sectors.slice(0,sector).reduce((a,b)=>a+(b||0),0);}
   }
   if(event.type==='line'&&this.started){
    const elapsed=event.time-this.start;this.trace[120]=elapsed;
    if(this.next===120)this.sectors[2]=elapsed-this.sectors[0]-this.sectors[1];
    const lap={time:elapsed,sectors:[...this.sectors],trace:[...this.trace],start:this.start,base:this.base,valid:this.valid&&event.credited&&this.next===120,credited:event.credited};
    this.last=elapsed;this.lastSectors=[...this.sectors];this.completed.push(lap);completed.push(lap);
    if(lap.valid&&(this.best===null||elapsed<this.best)){this.best=elapsed;this.bestTrace=[...this.trace];this.bestSectors=[...this.sectors];}
    this.begin(event.distance,event.time);
   }
  }
  return completed;
 }
 update(oldD,newD,before,after,segment={from:oldD,to:newD}){return this.consume(this.progress.update(segment,before,after));}
 delta(d,time){if(!this.started||!this.valid||!this.bestTrace)return null;const f=Math.max(0,Math.min(120,(d-this.base)/this.length*120)),i=Math.min(119,Math.floor(f)),reference=this.bestTrace[i]+(this.bestTrace[i+1]-this.bestTrace[i])*(f-i);return time-this.start-reference;}
}
function qualifyingResult(best,length,drivers=20){
 const hasTime=Number.isFinite(best)&&best>0;
 return {hasTime,time:hasTime?best:null,grid:hasTime?clamp(Math.round((best/(length/56)-1)*50)+6,0,drivers-1):drivers-1};
}
root.ApexTiming={CourseProgress,LapClock,qualifyingResult};if(typeof module!=='undefined')module.exports=root.ApexTiming;
})(typeof window!=='undefined'?window:globalThis);
