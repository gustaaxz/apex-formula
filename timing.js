/* Distance-triggered timing. Crossing times are interpolated inside each step. */
(function(root){
'use strict';
class LapClock{
 constructor(length){this.length=length;this.divisions=120;this.started=false;this.best=null;this.last=null;this.bestTrace=null;this.bestSectors=null;this.lastSectors=[null,null,null];this.completed=[];}
 begin(base,time,valid=true){this.started=true;this.base=base;this.start=time;this.next=1;this.trace=[0];this.sectors=[null,null,null];this.valid=valid;}
 invalidate(){if(this.started)this.valid=false;}
 update(oldD,newD,before,after){
  const events=[];if(newD<=oldD)return events;
  const crossing=d=>before+(after-before)*(d-oldD)/(newD-oldD);
  if(!this.started){if(oldD<0){if(newD<0)return events;this.begin(0,crossing(0));}else this.begin(Math.floor(oldD/this.length)*this.length,before,oldD%this.length<.01);}
  while(newD>=this.base+this.next*this.length/this.divisions){
   const stamp=crossing(this.base+this.next*this.length/this.divisions),elapsed=stamp-this.start;
   this.trace[this.next]=elapsed;
   if(this.next%40===0){const sector=this.next/40-1;this.sectors[sector]=elapsed-this.sectors.slice(0,sector).reduce((a,b)=>a+b,0);}
   if(this.next===this.divisions){
    const event={time:elapsed,sectors:[...this.sectors],valid:this.valid};this.last=elapsed;this.lastSectors=[...this.sectors];this.completed.push(event);events.push(event);
    if(this.valid&&(this.best===null||elapsed<this.best)){this.best=elapsed;this.bestTrace=[...this.trace];this.bestSectors=[...this.sectors];}
    this.begin(this.base+this.length,stamp);
   }else this.next++;
  }
  return events;
 }
 delta(d,time){if(!this.started||!this.valid||!this.bestTrace)return null;const f=Math.max(0,Math.min(120,(d-this.base)/this.length*120)),i=Math.min(119,Math.floor(f)),reference=this.bestTrace[i]+(this.bestTrace[i+1]-this.bestTrace[i])*(f-i);return time-this.start-reference;}
}
root.ApexTiming={LapClock};if(typeof module!=='undefined')module.exports=root.ApexTiming;
})(typeof window!=='undefined'?window:globalThis);
