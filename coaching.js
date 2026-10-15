/* Debounced telemetry explanations, evaluated in simulation time. */
(function(root){
'use strict';
const Vehicle=typeof module!=='undefined'?require('./vehicle.js'):root.ApexVehicle;
const DEFINITIONS={
 lock:{priority:0,label:'RODAS TRAVADAS',hint:'Alivie o freio para recuperar direção e aderência.',delay:.12,release:.3},
 spin:{priority:1,label:'PATINAGEM',hint:'Alivie o acelerador e endireite o volante antes de acelerar.',delay:.18,release:.4},
 fuel:{priority:2,label:'POUCO COMBUSTÍVEL',hint:'Alivie o acelerador e antecipe a desaceleração. Não há reabastecimento.',delay:.3,release:1},
 hot:{priority:3,label:'PNEUS SUPERAQUECIDOS',hint:'Evite escorregar; freie e acelere com suavidade para resfriar.',delay:1,release:1},
 cold:{priority:4,label:'PNEUS FRIOS',hint:'Aqueça com ritmo progressivo. Há menos aderência para frear e acelerar.',delay:1,release:1}
};
class Feedback{
 constructor(){this.time=0;this.states={};this.alerts=[];this.cues=[];this.lastCue=-100;this.cooldowns={};}
 tick(r,dt){
  const p=r.player;this.time+=dt;
  if(r.phase!=='race'||r.finish||r.playerDone){this.states={};this.alerts=[];this.cues=[];return;}
  const [low,high]=Vehicle.WINDOWS[p.tyre]||Vehicle.WINDOWS.medium;
  const temperatures=[p.frontTemp??p.temp,p.rearTemp??p.temp],moving=p.speed>5;
  const conditions={lock:p.speed>2&&(p.frontLocked||p.rearLocked),spin:p.speed>2&&p.wheelspin,
   cold:moving&&!r.pit&&Math.min(...temperatures)<low-3,hot:moving&&!r.pit&&Math.max(...temperatures)>high+3,
   fuel:r.config.consumption&&p.fuel<2};
  const entered=[];
  for(const [id,definition] of Object.entries(DEFINITIONS)){
   const state=this.states[id]||(this.states[id]={on:0,off:0,active:false});
   if(conditions[id]){state.on+=dt;state.off=0;if(!state.active&&state.on+1e-9>=definition.delay){state.active=true;entered.push(id);}}
   else{state.on=0;state.off+=dt;if(state.off>=definition.release)state.active=false;}
  }
  this.alerts=Object.entries(DEFINITIONS).filter(([id])=>this.states[id].active).map(([id,d])=>({id,...d})).sort((a,b)=>a.priority-b.priority);
  const cue=entered.find(id=>this.time-(this.cooldowns[id]??-100)>12);
  if(cue&&this.time-this.lastCue>2){this.cues.push(cue);this.cooldowns[cue]=this.time;this.lastCue=this.time;}
 }
 consumeCues(){const cues=this.cues;this.cues=[];return cues;}
}
root.ApexCoaching={Feedback,DEFINITIONS};
if(typeof module!=='undefined')module.exports=root.ApexCoaching;
})(typeof window!=='undefined'?window:globalThis);
