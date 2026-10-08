/* APEX Formula — deterministic fixed-step racing model. No rendering dependencies. */
(function(root){
'use strict';
const Vehicle=typeof module!=='undefined'?require('./vehicle.js'):root.ApexVehicle;
const Chassis=typeof module!=='undefined'?require('./chassis.js'):root.ApexChassis;
const Timing=typeof module!=='undefined'?require('./timing.js'):root.ApexTiming;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,mod=(v,n)=>((v%n)+n)%n;
const TrackCatalog=typeof module!=='undefined'?require('./tracks.js'):root.ApexTracks;
const {TRACKS,makeTrack}=TrackCatalog;
const TYRES={soft:{code:'S',name:'Macio',color:'#ff5262',grip:1.09,wear:1.6,wet:.44},medium:{code:'M',name:'Médio',color:'#ffe257',grip:1,wear:1,wet:.49},hard:{code:'H',name:'Duro',color:'#eeeeee',grip:.94,wear:.72,wet:.5},inter:{code:'I',name:'Intermediário',color:'#6bdf7e',grip:.88,wear:1.4,wet:1.05},wet:{code:'W',name:'Chuva',color:'#52afff',grip:.76,wear:1.8,wet:1.12}};
const DRIVERS=['L. MOREAU','K. TANAKA','M. SILVA','A. ROSSI','N. WEBER','S. PARK','R. COSTA','E. LARSEN','T. MARTIN','VOCÊ','I. NOVAK','D. CRUZ','O. REED','V. BIANCHI','J. KIM','F. SANTOS','H. CLARKE','P. LECLERC','B. ALVES','C. WILSON'];
const COLORS=[0x1de0c0,0x1de0c0,0xe84043,0xe84043,0x368cff,0x368cff,0xf69d39,0xf69d39,0xdded34,0xd8ff3e,0xaa77f0,0xaa77f0,0xffffff,0xffffff,0x279780,0x279780,0x4670dd,0x4670dd,0xeb5692,0xeb5692];
class Race{
 constructor(track,config={}){this.track=track;this.config={laps:5,weather:'sunset',tyre:'medium',fuel:18,pitLap:3,aero:5,bias:57,difficulty:65,assists:false,brakeAssist:false,tc:false,abs:false,damage:true,wear:true,consumption:true,automatic:false,mode:'gp',session:'race',...config,assists:false,brakeAssist:false,tc:false,abs:false,automatic:false};this.time=0;this.countdown=6.4;this.phase='start';this.wetness=['storm','light'].includes(this.config.weather)?(this.config.weather==='storm'?.9:.4):0;this.rain=this.wetness;this.ersMode=1;this.flag='green';this.flagTimer=0;this.messages=[];this.finish=false;this.best=null;this.last=null;this.lapStart=0;this.laps=[];this.pitRequested=false;this.pit=false;this.pitState='';this.pitTimer=0;this.nextTyre=this.config.tyre;this.flash=0;this.collisions=0;this.penalty=0;this.offroadTime=0;this.trackWarnings=0;this.flagPenaltyCooldown=0;this.warnedFuel=false;this.position=10;this.drsAvailable=false;this.drs=false;this.rpm=4000;this.pitCount=0;this.damageCooldown=0;
 this.timing=new Timing.LapClock(track.length);
 this.cars=DRIVERS.map((name,i)=>({id:i,name,color:COLORS[i],d:-i*9,lane:i%2?-2.4:2.4,speed:0,skill:.91+((i*7)%11)/95,aggression:.25+(i%4)*.18,wetSkill:i%5===0?1.05:.9,tyre:this.config.tyre,condition:1,pitTimer:0,pitted:false,aiMode:'racing'}));
 this.player=this.cars[9];Object.assign(this.player,{lane:-2.4,yaw:0,steer:0,fuel:this.config.fuel,battery:100,condition:1,temp:70,damage:0,gear:1,tyre:this.config.tyre});
 if(this.config.mode==='time'||this.config.session!=='race'){this.cars=[this.player];this.player.d=-40;this.position=1;}this.message('A pista é sua. Aguarde as luzes apagarem.');
 }
 message(text){this.messages.push(text);if(this.messages.length>5)this.messages.shift();}
 rank(){return this.cars.slice().sort((a,b)=>b.d-a.d);}
 lap(){return Math.min(this.config.laps,Math.floor(Math.max(0,this.player.d)/this.track.length)+1);}
 targetSpeed(d,grip=1){let maxK=0;for(let j=10;j<=125;j+=20)maxK=Math.max(maxK,Math.abs(this.track.at(d+j).k));return clamp(Math.sqrt(22*grip/(maxK+.001)),28,97);}
 shift(delta){return Vehicle.shift(this,delta);}
 resetPlayer(d=this.player.d,lane=0,speed=0){this.timing.invalidate();Vehicle.reset(this,d,lane,speed);}
 toggleReverse(){return Vehicle.reverse(this);}
 toggleLimiter(){this.player.pitLimiter=!this.player.pitLimiter;this.message('Limitador de boxes '+(this.player.pitLimiter?'ativado.':'desativado.'));}
 requestPit(){if(this.pit)return;this.pitRequested=!this.pitRequested;this.message(this.pitRequested?'Box confirmado. Na entrada dos boxes, siga à direita.':'Permanecemos na pista.');}
 toggleDRS(){if(this.drsAvailable){this.drs=!this.drs;if(this.drs)this.message('DRS ativado. Aproveite a reta.');}else this.message('DRS indisponível. Aproxime-se a menos de um segundo em uma reta.');}
 cycleERS(){this.ersMode=(this.ersMode+1)%4;this.message('Energia: '+['econômico','normal','ataque','ultrapassagem'][this.ersMode]+'.');}
 collide(force,damp=true){if(this.damageCooldown>0)return;this.damageCooldown=1;this.flash=.65;this.collisions++;if(damp){this.player.speed*=.65;if(this.player._worldReady){this.player.vx*=.65;this.player.vz*=.65;this.player._lastSpeed=this.player.speed;}}if(this.config.damage)this.player.damage=clamp(this.player.damage+force*(this.config.reliability||1),0,1);this.message(force>.15?'Contato forte. Verifique a asa e entre nos boxes.':'Contato. Mantenha espaço para o outro carro.');if(force>.7){this.flag='red';this.flagTimer=20;this.message('Bandeira vermelha. Corrida interrompida por vinte segundos.');}else if(force>.22){this.flag=force>.38?'sc':'vsc';this.flagTimer=force>.38?35:18;this.message(this.flag==='sc'?'Safety Car. Reduza a velocidade. Ultrapassagens proibidas.':'Virtual Safety Car. Mantenha o delta e reduza.');}else{this.flag='yellow';this.flagTimer=6;}}
 step(dt,input={}){
  if(this.finish||this.phase==='paused')return;
  // Small steps also resolve fast crossing contacts instead of skipping over cars.
  if(dt>1/240+1e-9){const count=Math.ceil(dt*240);for(let i=0;i<count;i++)this.step(dt/count,input);return;}
  const p=this.player,c=this.config,L=this.track.length,oldD=p.d;
  this.flash=Math.max(0,this.flash-dt*1.6);this.damageCooldown=Math.max(0,this.damageCooldown-dt);
  if(this.phase==='start'){Vehicle.grid(this,dt,input);this.countdown-=dt;if(this.countdown<=0){this.phase='race';this.message('Luzes apagadas. Acelere com W, seta para cima ou RT.');}return;}
  this.time+=dt;
  if(this.flagTimer>0){this.flagTimer-=dt;if(this.flagTimer<=0){this.flag='green';this.message('Bandeira verde. Corrida liberada.');}}
  if(this.flag==='red'){p.speed=p.vx=p.vz=p.yawRate=0;p._lastSpeed=0;this.cars.forEach(a=>a.speed=0);return;}
  this.flagPenaltyCooldown=Math.max(0,this.flagPenaltyCooldown-dt);
  if(c.weather==='dynamic'){const stage=this.time/90;this.rain=stage<1?0:stage<2?(stage-1)*.45:stage<3?.45+(stage-2)*.5:stage<4?.95:Math.max(0,.95-(stage-4)*.5);this.wetness+=clamp(this.rain-this.wetness,-dt*.003,dt*.012);}else this.rain=c.weather==='storm'?.9:c.weather==='light'?.4:0;
  const point=this.track.at(p.d),s=mod(p.d,L),ahead=this.cars.filter(a=>a!==p&&a.d>p.d).sort((a,b)=>a.d-b.d)[0];
  this.gap=ahead?(ahead.d-p.d)/Math.max(20,p.speed):null;
  this.drsAvailable=Math.abs(point.k)<.0018&&this.wetness<.35&&!this.pit&&this.flag==='green'&&(c.mode==='time'||(this.gap!==null&&this.gap<1));if(!this.drsAvailable||input.brake>.01)this.drs=false;
  if(this.pitRequested&&!this.pit&&s>L-360&&s<L-255&&p.lane>4.5){this.pit=true;this.pitState='entry';this.pitRequested=false;this.message('Box: ative o limitador com L e pare na marca amarela.');}
  if(this.pit){
   if(this.pitState==='entry'&&s>L-95&&s<L-85&&p.lane>12&&p.lane<16&&p.speed<.5){this.pitState='service';this.pitTimer=3.1+p.damage*6;p.speed=p.vx=p.vz=p.yawRate=0;p._lastSpeed=0;this.message('Carro na marca. Trocando pneus.');}
   if(this.pitState==='service'){p.clutch=1;this.pitTimer-=dt;if(this.pitTimer<=0){p.tyre=this.nextTyre;p.condition=1;p.temp=p.frontTemp=p.rearTemp=70;p._thermalAverage=70;p.damage=p.frontWingDamage=p.rearWingDamage=0;this.pitState='exit';this.pitCount++;this.message('Troca concluída. Acelere para sair e observe o tráfego.');}this.updateAI(dt);Chassis.collisions(this);return;}
   if(this.pitState==='exit'&&s>90&&s<160&&p.lane<7.4){this.pit=false;this.pitState='';this.message('Saída dos boxes. Observe o tráfego à esquerda.');}
   if(p.speed>80/3.6+.8&&!this.pitPenalty){this.penalty+=5;this.pitPenalty=true;this.message('Excesso de velocidade nos boxes. Penalidade de cinco segundos.');}
  }
  Vehicle.step(this,dt,input,TYRES);
  const offroad=!this.pit&&Math.abs(p.lane)>7.4;
  if(offroad){this.offroadTime+=dt;if(this.offroadTime>2.5){this.offroadTime=0;this.trackWarnings++;if(this.flag==='green'){this.flag='warning';this.flagTimer=5;}this.message('Limites de pista. Mantenha o carro entre as linhas brancas.');if(this.trackWarnings%3===0){this.penalty+=5;this.message('Reincidência de limites de pista. Penalidade de cinco segundos.');}}}else this.offroadTime=Math.max(0,this.offroadTime-dt);
  if(p.condition<.18&&c.damage)p.damage=Math.min(1,p.damage+dt*.002);
  this.updateAI(dt);
  Chassis.collisions(this);
  const nextPosition=this.rank().findIndex(a=>a===p)+1;if((this.flag==='sc'||this.flag==='vsc')&&nextPosition<this.position&&this.flagPenaltyCooldown===0){this.penalty+=5;this.flagPenaltyCooldown=4;this.message('Ultrapassagem durante neutralização. Penalidade de cinco segundos.');}this.position=nextPosition;this.blueFlag=this.cars.some(a=>a!==p&&a.d-p.d>L-35&&mod(p.d-a.d,L)<35);
  if(offroad&&Math.abs(p.lane)>8.5)this.timing.invalidate();
  for(const lap of this.timing.update(oldD,p.d,this.time-dt,this.time)){this.last=lap.time;this.laps.push(this.last);this.best=this.timing.best;this.message(lap.valid?'Volta concluída. Posição '+this.position+'.':'Volta inválida para recorde: saída de pista ou reposicionamento.');if(this.lap()===c.pitLap&&!this.pitRequested)this.message('Janela de pit stop aberta. Solicite os boxes com B.');}
  if(this.timing.started)this.lapStart=this.timing.start;
  if(p.fuel<2&&!this.warnedFuel){this.warnedFuel=true;this.message('Pouco combustível. Use o modo econômico e evite acelerações bruscas.');}
  if(p.d>=L*c.laps){this.finish=true;this.phase='finished';this.flag='checkered';this.message('Bandeira quadriculada! Excelente trabalho.');}
  if(p.fuel<=0&&p.speed<.5){this.finish=true;this.phase='finished';this.dnf=true;this.message('Combustível esgotado. Fim da sessão.');}
 }

 updateAI(dt){const p=this.player,c=this.config,L=this.track.length;for(const a of this.cars){if(a===p)continue;const priorSpeed=a.speed,s=mod(a.d,L),lap=Math.floor(Math.max(0,a.d)/L)+1;
  if(!a.pitted&&lap>=c.pitLap&&s>L-320&&s<L-230){a.aiMode='pit';a.lane=14;}
  if(a.aiMode==='pit'){if(s>L-103&&s<L-55&&!a.pitTimer){a.pitTimer=2.8+(a.id%4)*.2;a.speed=0;}if(a.pitTimer>0){a.pitTimer-=dt;if(a.pitTimer<=0){a.pitTimer=-1;a.pitted=true;a.tyre=this.wetness>.65?'wet':this.wetness>.3?'inter':'hard';a.condition=1;}else continue;}a.speed=lerp(a.speed,21,dt*2);if(s>100&&s<160){a.aiMode='racing';a.lane=5.5;}}
  else{const tyre=TYRES[a.tyre],grip=lerp(tyre.grip,tyre.wet,this.wetness)*(1-(1-a.condition)*.25);let desired=this.targetSpeed(a.d,grip)*a.skill*(.65+c.difficulty*.0045)*(1-this.wetness*(1-a.wetSkill));const front=this.cars.find(b=>b!==a&&b.d>a.d&&b.d-a.d<27&&Math.abs(b.lane-a.lane)<2.1);let targetLane=Math.sin(a.id*3.1)*2.4;
   if(front){targetLane=front.lane>0?-3.1:3.1;desired*=1+a.aggression*.04;if(front.d-a.d<8)desired=Math.min(desired,front.speed*.94);}
   if(this.flag==='sc'||this.flag==='vsc'){desired=Math.min(desired,this.flag==='sc'?28:40);if(front)desired=Math.min(desired,front.speed);targetLane=0;}
   if(Math.sin(this.time*.023+a.id*9.13)>.9999)desired*=.8;
   a.lane=lerp(a.lane,targetLane,dt*(front?1.2:.55));a.speed+=clamp(desired-a.speed,-27*dt,(10+(a.id%3))*dt);
  }a.d+=a.speed*dt;const q=this.track.at(a.d);a.contactYaw=(a.contactYaw||0)+(a.contactYawRate||0)*dt;a.contactYaw*=Math.exp(-dt*1.5);a.contactYawRate=(a.contactYawRate||0)*Math.exp(-dt*2);a.heading=Math.atan2(q.tz,q.tx)+a.contactYaw;a.x=q.x+q.nx*a.lane+(a.contactVX||0)*dt;a.z=q.z+q.nz*a.lane+(a.contactVZ||0)*dt;a.contactVX=(a.contactVX||0)*Math.exp(-dt*1.1);a.contactVZ=(a.contactVZ||0)*Math.exp(-dt*1.1);a.vx=q.tx*a.speed+a.contactVX;a.vz=q.tz*a.speed+a.contactVZ;a.yawRate=a.contactYawRate;a._contactReady=true;Chassis.project(this,a);Chassis.walls(this,a);if(!a.chassis)Chassis.init(this,a);const aero=Chassis.aero(this,a,a.speed);Chassis.step(this,a,dt,clamp((a.speed-priorSpeed)/dt,-27,12),a.speed*a.speed*q.k,aero);if(c.wear)a.condition=Math.max(.2,a.condition-a.speed*dt*.000009);}}
}
root.ApexSim={POWERTRAIN:Vehicle.POWERTRAIN,thermalGrip:Vehicle.thermalGrip,TRACKS,TYRES,DRIVERS,COLORS,makeTrack,Race,clamp,lerp,mod};
if(typeof module!=='undefined')module.exports=root.ApexSim;
})(typeof window!=='undefined'?window:globalThis);
