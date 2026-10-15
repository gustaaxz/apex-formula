/* APEX Formula — deterministic fixed-step racing model. No rendering dependencies. */
(function(root){
'use strict';
const Vehicle=typeof module!=='undefined'?require('./vehicle.js'):root.ApexVehicle;
const Personal=typeof module!=='undefined'?require('./personal.js'):root.ApexPersonal;
const Chassis=typeof module!=='undefined'?require('./chassis.js'):root.ApexChassis;
const Timing=typeof module!=='undefined'?require('./timing.js'):root.ApexTiming;
const Results=typeof module!=='undefined'?require('./results.js'):root.ApexResults;
const Opponents=typeof module!=='undefined'?require('./opponents.js'):root.ApexOpponents;
const {RaceControl}=typeof module!=='undefined'?require('./race-control.js'):root.ApexRaceControl;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,mod=(v,n)=>((v%n)+n)%n;
const TrackCatalog=typeof module!=='undefined'?require('./tracks.js'):root.ApexTracks;
const {TRACKS,makeTrack}=TrackCatalog;
const TYRES={soft:{code:'S',name:'Macio',color:'#ff5262',grip:1.09,wear:1.6,wet:.44},medium:{code:'M',name:'Médio',color:'#ffe257',grip:1,wear:1,wet:.49},hard:{code:'H',name:'Duro',color:'#eeeeee',grip:.94,wear:.72,wet:.5},inter:{code:'I',name:'Intermediário',color:'#6bdf7e',grip:.88,wear:1.4,wet:1.05},wet:{code:'W',name:'Chuva',color:'#52afff',grip:.76,wear:1.8,wet:1.12}};
const DRIVERS=['L. MOREAU','K. TANAKA','M. SILVA','A. ROSSI','N. WEBER','S. PARK','R. COSTA','E. LARSEN','T. MARTIN','VOCÊ','I. NOVAK','D. CRUZ','O. REED','V. BIANCHI','J. KIM','F. SANTOS','H. CLARKE','P. LECLERC','B. ALVES','C. WILSON'];
const TEAMS=['Apex Works','Rosso Racing','Nova Motorsport','Solaris GP','Vértice Racing','Nebula Racing','Polar Motorsport','Atlas GP','Cobalt Racing','Volta Racing'];
const NUMBERS=[12,18,7,21,33,44,55,77,23,27,3,11,16,24,31,36,42,47,63,88];
const COLORS=[0x1de0c0,0x1de0c0,0xe84043,0xe84043,0x368cff,0x368cff,0xf69d39,0xf69d39,0xdded34,0xd8ff3e,0xaa77f0,0xaa77f0,0xffffff,0xffffff,0x279780,0x279780,0x4670dd,0x4670dd,0xeb5692,0xeb5692];
class Race{
 constructor(track,config={}){this.track=track;this.config={laps:5,weather:'sunset',tyre:'medium',fuel:18,pitLap:3,aero:5,bias:57,difficulty:65,assists:false,brakeAssist:false,tc:false,abs:false,damage:true,wear:true,consumption:true,automatic:false,autoShift:false,mode:'gp',session:'race',...config,assists:false,brakeAssist:false,tc:false,abs:false,automatic:false};this.time=0;this.countdown=6.4;this.phase='start';this.wetness=['storm','light'].includes(this.config.weather)?(this.config.weather==='storm'?.9:.4):0;this.rain=this.wetness;this.ersMode=1;this.flag='green';this.flagTimer=0;this.messages=[];this.finish=false;this.best=null;this.last=null;this.lapStart=0;this.laps=[];this.pitRequested=false;this.pit=false;this.pitState='';this.pitTimer=0;this.nextTyre=this.config.tyre;this.flash=0;this.collisions=0;this.penalty=0;this.offroadTime=0;this.trackWarnings=0;this.flagPenaltyCooldown=0;this.warnedFuel=false;this.position=10;this.drsAvailable=false;this.drs=false;this.rpm=4000;this.pitCount=0;this.damageCooldown=0;
 this.cars=DRIVERS.map((name,i)=>({id:i,name,team:TEAMS[Math.floor(i/2)],number:NUMBERS[i],bestLap:null,lastLap:null,lastLapValid:null,pitStops:0,color:COLORS[i],d:-i*12,lane:i%2?-2.4:2.4,speed:0,skill:.91+((i*7)%11)/95,aggression:.25+(i%4)*.18,wetSkill:i%5===0?1.05:.9,tyre:this.config.tyre,condition:1,pitTimer:0,pitted:false,aiMode:'racing'}));
 this.player=this.cars[9];Object.assign(this.player,{lane:-2.4,yaw:0,steer:0,fuel:this.config.fuel,battery:100,condition:1,temp:70,damage:0,gear:1,tyre:this.config.tyre});
 if(this.config.mode==='time'||this.config.session!=='race'){this.cars=[this.player];this.player.d=-40;this.position=1;}this.message('A pista é sua. Aguarde as luzes apagarem.');
 this.competitive=this.config.mode!=='time'&&this.config.session==='race';
 this.results=new Results.Classification(track,this.config.laps);
 this.progress=this.results.progressOf(this.player);
 this.timing=new Timing.LapClock(track.length,this.progress);
 this.control=new RaceControl(this);
 this.driverClocks=new Map(this.cars.map(car=>[car.id,car===this.player?this.timing:new Timing.LapClock(track.length,this.results.progressOf(car))]));
 this.analysis=new Personal.Session(track,this.config);
 }
 message(text){this.messages.push(text);if(this.messages.length>5)this.messages.shift();}
 rank(){
  if(this.results.final)return this.results.final.map(row=>this.cars.find(car=>car.id===row.id));
  if(this.phase==='start')return this.cars.slice().sort((a,b)=>b.d-a.d);
  const distance=car=>{const p=this.results.progressOf(car);return p.sample?p.distance:Math.min(0,car.d);};
  return this.cars.slice().sort((a,b)=>distance(b)-distance(a)||a.id-b.id);
 }
 get playerDone(){return this.competitive&&this.results.status(this.player)!=='running';}
 classification(){return this.results.rows(this.cars);}
 courseSnapshot(){return this.cars.map(car=>{
  const q=this.track.at(car.d),ready=car._worldReady||car._contactReady;
  return {car,d:car.d,x:ready?car.x:q.x+q.nx*car.lane,z:ready?car.z:q.z+q.nz*car.lane};
 });}
 courseSegment(old){
  const {car}=old,q=this.track.at(car.d),ready=car._worldReady||car._contactReady;
  return {car,from:old.d,to:car.d,fromX:old.x,fromZ:old.z,x:ready?car.x:q.x+q.nx*car.lane,z:ready?car.z:q.z+q.nz*car.lane,pit:car===this.player?this.pit:car.aiMode==='pit'};
 }
 recordTiming(events){
  const completed=this.timing.consume(events);this.analysis.timing(events,completed,this);this.player.bestLap=this.timing.best;this.player.lastLap=this.timing.last;if(completed.length)this.player.lastLapValid=completed.at(-1).valid;
  for(const lap of completed){
   this.last=lap.time;if(lap.credited)this.laps.push(lap.time);this.best=this.timing.best;
   this.message(!lap.credited?'Volta não contabilizada: faltou um ponto de controle.':lap.valid?'Volta concluída. Posição '+this.position+'.':'Volta inválida para recorde: saída de pista ou reposicionamento.');
   if(this.lap()===this.config.pitLap&&!this.pitRequested)this.message('Janela de pit stop aberta. Solicite os boxes com o comando configurado.');
  }
  if(this.timing.started)this.lapStart=this.timing.start;
 }
 updateResults(previous,before){
  const events=this.results.update(previous.map(old=>this.courseSegment(old)),before,this.time);
  this.recordTiming(events.get(this.player.id)||[]);
  for(const car of this.cars)if(car!==this.player){
   const clock=this.driverClocks.get(car.id);if(!clock)continue;
   if(car.aiMode!=='pit'&&Math.abs(car.lane)>8.5)clock.invalidate();
   const completed=clock.consume(events.get(car.id)||[]);if(completed.length)car.lastLapValid=completed.at(-1).valid;car.bestLap=clock.best;car.lastLap=clock.last;
  }
  this.control.observe(this.time-before);
  for(const car of this.cars)this.results.setPenalty(car,car===this.player?this.penalty:(car.timePenalty||0));
  for(const car of this.cars)if(car.fuel<=0&&car.speed<.5)this.results.retire(car,this.time,'Combustível esgotado');
  this.results.expire(this.cars,this.time);
  this.dnf=this.results.status(this.player)==='dnf';
  if(this.results.checkeredAt!==null)this.flag='checkered';
  if(this.playerDone){this.phase='settling';this.drs=false;}
  const final=this.results.finalize(this.cars);
  if(final){this.finish=true;this.phase='finished';this.flag='checkered';}
  if(this.playerDone)this.position=this.classification().find(row=>row.id===this.player.id).position;
 }
 lap(){return Math.min(this.config.laps,this.progress.laps+1);}
 fastestLap(){return this.cars.filter(car=>Number.isFinite(car.bestLap)&&car.bestLap>0).sort((a,b)=>a.bestLap-b.bestLap||a.id-b.id)[0]||null;}
 setIdentity(name,team,number){
  this.player.name=name;this.player.team=team;this.player.number=number;
  const used=new Set([number]);for(const car of this.cars)if(car!==this.player){if(used.has(car.number))car.number=Array.from({length:98},(_,i)=>i+2).find(n=>!used.has(n));used.add(car.number);}
 }
 targetSpeed(d,grip=1){let maxK=0;for(let j=10;j<=125;j+=20)maxK=Math.max(maxK,Math.abs(this.track.at(d+j).k));return clamp(Math.sqrt(22*grip/(maxK+.001)),28,97);}
 shift(delta){return Vehicle.shift(this,delta);}
 resetPlayer(d=this.player.d,lane=0,speed=0){
  this.timing.invalidate();this.analysis?.invalidate('Reposicionamento');Vehicle.reset(this,d,lane,speed);
  this.progress.reposition(d,this.player.x,this.player.z);
 }
 recoverPlayer(){
  if(this.playerDone||this.finish)return;
  const d=this.progress.lastCheckpointD??Math.min(0,this.player.d);
  this.analysis.event('recovery',this.time,'Reposicionamento na pista');this.resetPlayer(d,0,0);this.progress.blocked=false;
  this.player.recoveredUntil=this.time+1;
  this.pit=false;this.pitState='';this.pitRequested=false;this.player.pitLimiter=false;
  this.penalty+=5;this.message('Último ponto válido recuperado. Volta inválida para recorde e +5 s.');
 }
 toggleReverse(){return Vehicle.reverse(this);}
 toggleLimiter(){this.player.pitLimiter=!this.player.pitLimiter;this.message('Limitador de boxes '+(this.player.pitLimiter?'ativado.':'desativado.'));}
 requestPit(){if(this.pit)return;this.pitRequested=!this.pitRequested;this.message(this.pitRequested?'Box confirmado. Na entrada dos boxes, siga à direita.':'Permanecemos na pista.');}
 toggleDRS(){if(this.drsAvailable){this.drs=!this.drs;if(this.drs)this.message('DRS ativado. Aproveite a reta.');}else this.message('DRS indisponível. Aproxime-se a menos de um segundo em uma reta.');}
 cycleERS(){this.ersMode=(this.ersMode+1)%4;this.message('Energia: '+['econômico','normal','ataque','ultrapassagem'][this.ersMode]+'.');}
 collide(force,damp=true){if(this.damageCooldown>0)return;this.damageCooldown=1;this.flash=.65;this.collisions++;if(damp){this.player.speed*=.65;if(this.player._worldReady){this.player.vx*=.65;this.player.vz*=.65;this.player._lastSpeed=this.player.speed;}}if(this.config.damage)this.player.damage=clamp(this.player.damage+force*(this.config.reliability||1),0,1);this.message(force>.15?'Contato forte. Verifique a asa e entre nos boxes.':'Contato. Mantenha espaço para o outro carro.');if(force>.7){this.flag='red';this.flagTimer=20;this.message('Bandeira vermelha. Corrida interrompida por vinte segundos.');}else if(force>.22){this.flag=force>.38?'sc':'vsc';this.flagTimer=force>.38?35:18;this.message(this.flag==='sc'?'Safety Car. Reduza a velocidade. Ultrapassagens proibidas.':'Virtual Safety Car. Mantenha o delta e reduza.');}else{this.flag='yellow';this.flagTimer=6;}this.control.activate(this.flag,this.flagTimer);}
 step(dt,input={}){
  if(this.finish||this.phase==='paused')return;
  // Small steps also resolve fast crossing contacts instead of skipping over cars.
  if(dt>1/240+1e-9){const count=Math.ceil(dt*240);for(let i=0;i<count;i++)this.step(dt/count,input);return;}
  const from=Personal.pose(this);this.analysis.from=from;
  this.stepPhysics(dt,input);this.analysis.tick(this,from);
 }
 stepPhysics(dt,input){
  const p=this.player,c=this.config,L=this.track.length,oldD=p.d;
  const previous=this.courseSnapshot(),before=this.time;
  this.flash=Math.max(0,this.flash-dt*1.6);this.damageCooldown=Math.max(0,this.damageCooldown-dt);
  if(this.phase==='start'){Vehicle.grid(this,dt,input);this.countdown-=dt;if(this.countdown<=0){this.phase='race';this.message('Luzes apagadas. Acelere com o comando configurado.');}return;}
  this.time+=dt;
  this.control.tick(dt);
  if(this.flag==='red'){p.speed=p.vx=p.vz=p.yawRate=0;p._lastSpeed=0;this.cars.forEach(a=>a.speed=0);if(this.competitive)this.updateResults(previous,before);return;}
  this.flagPenaltyCooldown=Math.max(0,this.flagPenaltyCooldown-dt);
  if(c.weather==='dynamic'){const stage=this.time/90;this.rain=stage<1?0:stage<2?(stage-1)*.45:stage<3?.45+(stage-2)*.5:stage<4?.95:Math.max(0,.95-(stage-4)*.5);this.wetness+=clamp(this.rain-this.wetness,-dt*.003,dt*.012);}else this.rain=c.weather==='storm'?.9:c.weather==='light'?.4:0;
  if(this.playerDone){this.updateAI(dt);Chassis.collisions(this);this.updateResults(previous,before);return;}
  const point=this.track.at(p.d),s=mod(p.d,L),ahead=this.cars.filter(a=>a!==p&&a.d>p.d).sort((a,b)=>a.d-b.d)[0];
  this.gap=ahead?(ahead.d-p.d)/Math.max(20,p.speed):null;
  this.drsAvailable=Math.abs(point.k)<.0018&&this.wetness<.35&&!this.pit&&this.flag==='green'&&(c.mode==='time'||(this.gap!==null&&this.gap<1));if(!this.drsAvailable||input.brake>.01)this.drs=false;
  if(this.pitRequested&&!this.pit&&s>L-360&&s<L-255&&p.lane>4.5){this.pit=true;this.pitState='entry';this.pitRequested=false;this.message('Box: ative o limitador e pare na marca amarela.');}
  if(this.pit){
   if(this.pitState==='entry'&&s>L-95&&s<L-85&&p.lane>12&&p.lane<16&&p.speed<.5){this.pitState='service';this.pitTimer=3.1+p.damage*6;p.speed=p.vx=p.vz=p.yawRate=0;p._lastSpeed=0;this.message('Carro na marca. Trocando pneus.');}
   if(this.pitState==='service'){p.clutch=1;this.pitTimer-=dt;if(this.pitTimer<=0){p.tyre=this.nextTyre;p.condition=1;p.temp=p.frontTemp=p.rearTemp=70;p._thermalAverage=70;p.damage=p.frontWingDamage=p.rearWingDamage=0;this.pitState='exit';this.pitCount++;p.pitStops=this.pitCount;this.message('Troca concluída. Acelere para sair e observe o tráfego.');}this.updateAI(dt);Chassis.collisions(this);if(this.competitive)this.updateResults(previous,before);return;}
   if(this.pitState==='exit'&&s>90&&s<160&&p.lane<7.4){this.pit=false;this.pitState='';this.message('Saída dos boxes. Observe o tráfego à esquerda.');}
   if(p.speed>80/3.6+.8&&!this.pitPenalty){this.penalty+=5;this.pitPenalty=true;this.message('Excesso de velocidade nos boxes. Penalidade de cinco segundos.');}
  }
  Vehicle.step(this,dt,input,TYRES);
  const offroad=!this.pit&&Math.abs(p.lane)>7.4;
  if(offroad){this.offroadTime+=dt;if(this.offroadTime>2.5){this.offroadTime=0;this.trackWarnings++;if(this.flag==='green'){this.flag='warning';this.flagTimer=5;}this.message('Limites de pista. Mantenha o carro entre as linhas brancas.');if(this.trackWarnings%3===0){this.penalty+=5;this.message('Reincidência de limites de pista. Penalidade de cinco segundos.');}}}else this.offroadTime=Math.max(0,this.offroadTime-dt);
  if(p.condition<.18&&c.damage)p.damage=Math.min(1,p.damage+dt*.002);
  this.updateAI(dt);
  Chassis.collisions(this);
  this.position=this.rank().findIndex(a=>a===p)+1;this.blueFlag=this.cars.some(a=>a!==p&&!a.raceStatus&&a.d-p.d>L-35&&mod(p.d-a.d,L)<35);
  if(offroad&&Math.abs(p.lane)>8.5){this.timing.invalidate();this.analysis.invalidate('Limites de pista');}
  if(p.fuel<2&&!this.warnedFuel){this.warnedFuel=true;this.message('Pouco combustível. Alivie o acelerador e antecipe as desacelerações.');}
  if(this.competitive){this.updateResults(previous,before);}
  else{
   this.recordTiming(this.progress.update(this.courseSegment(previous.find(old=>old.car===p)),before,this.time));
   this.control.observe(dt);
   if(this.progress.laps>=c.laps||(c.session==='qualify'&&this.timing.completed.length>=c.laps)){this.finish=true;this.phase='finished';this.flag='checkered';this.message('Bandeira quadriculada! Sessão concluída.');}
   if(p.fuel<=0&&p.speed<.5){this.finish=true;this.phase='finished';this.dnf=true;this.message('Combustível esgotado. Fim da sessão.');}
  }
 }

 updateAI(dt){Opponents.step(this,dt,TYRES);}

}
root.ApexSim={POWERTRAIN:Vehicle.POWERTRAIN,thermalGrip:Vehicle.thermalGrip,TRACKS,TYRES,DRIVERS,TEAMS,NUMBERS,COLORS,makeTrack,Race,clamp,lerp,mod};
if(typeof module!=='undefined')module.exports=root.ApexSim;
})(typeof window!=='undefined'?window:globalThis);
