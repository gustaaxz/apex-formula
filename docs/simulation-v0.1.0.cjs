/* APEX Formula — deterministic fixed-step racing model. No rendering dependencies. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,mod=(v,n)=>((v%n)+n)%n;
const TRACKS=[
 {name:'Costa Verde',country:'BRASIL',theme:'tropical',turns:18,points:[[-520,40],[-520,-200],[-470,-360],[-300,-440],[-120,-425],[20,-315],[210,-350],[385,-285],[490,-160],[410,-45],[465,100],[370,265],[200,300],[80,180],[-60,230],[-125,380],[-310,380],[-465,240]]},
 {name:'Marina Neon',country:'SINGAPURA',theme:'city',turns:22,points:[[-480,80],[-480,-230],[-350,-350],[-140,-350],[-90,-220],[60,-220],[65,-370],[290,-370],[360,-230],[215,-140],[270,0],[470,35],[475,260],[300,345],[155,290],[120,150],[-40,170],[-75,320],[-255,365],[-350,275],[-290,115],[-450,170]]},
 {name:'Alta Velocità',country:'ITÁLIA',theme:'forest',turns:16,points:[[-570,60],[-570,-300],[-490,-460],[-335,-475],[-200,-415],[-80,-445],[430,-450],[600,-310],[580,-100],[410,50],[440,165],[285,195],[100,150],[-80,250],[-230,380],[-440,300]]},
 {name:'Sierra Blanca',country:'ESPANHA',theme:'mountain',turns:20,points:[[-470,80],[-470,-170],[-385,-320],[-230,-400],[-65,-340],[50,-430],[250,-360],[320,-190],[440,-110],[395,75],[245,55],[140,195],[280,320],[135,420],[-30,335],[-125,190],[-240,275],[-350,365],[-475,260],[-400,145]]},
 {name:'Dunas de Yas',country:'EMIRADOS ÁRABES',theme:'desert',turns:18,points:[[-560,60],[-560,-260],[-415,-420],[-220,-430],[-105,-340],[95,-395],[430,-350],[560,-210],[510,20],[350,155],[285,320],[105,390],[-50,340],[-90,160],[-235,140],[-320,280],[-445,320],[-530,200]]},
 {name:'Silver Coast',country:'REINO UNIDO',theme:'coast',turns:19,points:[[-480,70],[-480,-250],[-390,-395],[-190,-410],[-95,-250],[75,-230],[200,-385],[400,-330],[485,-155],[340,-30],[390,150],[230,315],[80,260],[-30,360],[-205,345],[-265,180],[-160,60],[-325,-5],[-405,170]]}
];
function makeTrack(index){
 const def=TRACKS[mod(index,TRACKS.length)],pts=def.points,n=pts.length,raw=[];
 for(let i=0;i<n;i++)for(let j=0;j<100;j++){
  const t=j/100,t2=t*t,t3=t2*t,p0=pts[mod(i-1,n)],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
  const f=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);
  raw.push({x:f(0)*1.24,z:f(1)*1.24});
 }
 raw.push({...raw[0]});let length=0;raw[0].d=0;for(let i=1;i<raw.length;i++){length+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z);raw[i].d=length;}
 const count=Math.ceil(length/3),step=length/count,samples=[];let idx=0;
 for(let i=0;i<count;i++){let d=i*step;while(raw[idx+1].d<d)idx++;const t=(d-raw[idx].d)/(raw[idx+1].d-raw[idx].d),x=lerp(raw[idx].x,raw[idx+1].x,t),z=lerp(raw[idx].z,raw[idx+1].z,t);samples.push({x,z});}
 const hill=def.theme==='mountain'?15:def.theme==='tropical'?4:0;
 samples.forEach((p,i)=>{const a=samples[mod(i-1,count)],b=samples[(i+1)%count],len=Math.hypot(b.x-a.x,b.z-a.z);p.tx=(b.x-a.x)/len;p.tz=(b.z-a.z)/len;p.nx=-p.tz;p.nz=p.tx;p.y=hill*(Math.sin(i/count*Math.PI*4)+.3*Math.sin(i/count*Math.PI*8));});
 samples.forEach((p,i)=>{const b=samples[(i+3)%count];p.k=Math.atan2(b.tx*p.nx+b.tz*p.nz,b.tx*p.tx+b.tz*p.tz)/(step*3);});
 const at=d=>{const f=mod(d,length)/step,i=Math.floor(f),a=samples[i],b=samples[(i+1)%count],t=f-i;return {x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),y:lerp(a.y,b.y,t),tx:lerp(a.tx,b.tx,t),tz:lerp(a.tz,b.tz,t),nx:lerp(a.nx,b.nx,t),nz:lerp(a.nz,b.nz,t),k:lerp(a.k,b.k,t)};};
 return {...def,index,length,step,samples,at};
}
const TYRES={soft:{code:'S',name:'Macio',color:'#ff5262',grip:1.09,wear:1.6,wet:.44},medium:{code:'M',name:'Médio',color:'#ffe257',grip:1,wear:1,wet:.49},hard:{code:'H',name:'Duro',color:'#eeeeee',grip:.94,wear:.72,wet:.5},inter:{code:'I',name:'Intermediário',color:'#6bdf7e',grip:.88,wear:1.4,wet:1.05},wet:{code:'W',name:'Chuva',color:'#52afff',grip:.76,wear:1.8,wet:1.12}};
const DRIVERS=['L. MOREAU','K. TANAKA','M. SILVA','A. ROSSI','N. WEBER','S. PARK','R. COSTA','E. LARSEN','T. MARTIN','VOCÊ','I. NOVAK','D. CRUZ','O. REED','V. BIANCHI','J. KIM','F. SANTOS','H. CLARKE','P. LECLERC','B. ALVES','C. WILSON'];
const COLORS=[0x1de0c0,0x1de0c0,0xe84043,0xe84043,0x368cff,0x368cff,0xf69d39,0xf69d39,0xdded34,0xd8ff3e,0xaa77f0,0xaa77f0,0xffffff,0xffffff,0x279780,0x279780,0x4670dd,0x4670dd,0xeb5692,0xeb5692];
class Race{
 constructor(track,config={}){this.track=track;this.config={laps:5,weather:'sunset',tyre:'medium',fuel:18,pitLap:3,aero:5,bias:57,difficulty:65,assists:true,brakeAssist:true,tc:true,abs:true,damage:true,wear:true,consumption:true,automatic:true,mode:'gp',session:'race',...config};this.time=0;this.countdown=6.4;this.phase='start';this.wetness=['storm','light'].includes(this.config.weather)?(this.config.weather==='storm'?.9:.4):0;this.rain=this.wetness;this.ersMode=1;this.flag='green';this.flagTimer=0;this.messages=[];this.finish=false;this.best=null;this.last=null;this.lapStart=0;this.laps=[];this.pitRequested=false;this.pit=false;this.pitState='';this.pitTimer=0;this.nextTyre=this.config.tyre;this.flash=0;this.collisions=0;this.penalty=0;this.offroadTime=0;this.trackWarnings=0;this.flagPenaltyCooldown=0;this.warnedFuel=false;this.position=10;this.drsAvailable=false;this.drs=false;this.rpm=4000;this.pitCount=0;this.damageCooldown=0;
 this.cars=DRIVERS.map((name,i)=>({id:i,name,color:COLORS[i],d:-i*9,lane:i%2?-2.4:2.4,speed:0,skill:.91+((i*7)%11)/95,aggression:.25+(i%4)*.18,wetSkill:i%5===0?1.05:.9,tyre:this.config.tyre,condition:1,pitTimer:0,pitted:false,aiMode:'racing'}));
 this.player=this.cars[9];Object.assign(this.player,{lane:-2.4,yaw:0,steer:0,fuel:this.config.fuel,battery:100,condition:1,temp:78,damage:0,gear:1,tyre:this.config.tyre});
 if(this.config.mode==='time'||this.config.session!=='race'){this.cars=[this.player];this.player.d=-40;this.position=1;}this.message('A pista é sua. Aguarde as luzes apagarem.');
 }
 message(text){this.messages.push(text);if(this.messages.length>5)this.messages.shift();}
 rank(){return this.cars.slice().sort((a,b)=>b.d-a.d);}
 lap(){return Math.min(this.config.laps,Math.floor(Math.max(0,this.player.d)/this.track.length)+1);}
 targetSpeed(d,grip=1){let maxK=0;for(let j=10;j<=125;j+=20)maxK=Math.max(maxK,Math.abs(this.track.at(d+j).k));return clamp(Math.sqrt(22*grip/(maxK+.001)),28,97);}
 shift(delta){this.player.gear=clamp(this.player.gear+delta,1,8);}
 requestPit(){if(this.pit)return;this.pitRequested=!this.pitRequested;this.message(this.pitRequested?'Box confirmado. Na entrada dos boxes, siga à direita.':'Permanecemos na pista.');}
 toggleDRS(){if(this.drsAvailable){this.drs=!this.drs;if(this.drs)this.message('DRS ativado. Aproveite a reta.');}else this.message('DRS indisponível. Aproxime-se a menos de um segundo em uma reta.');}
 cycleERS(){this.ersMode=(this.ersMode+1)%4;this.message('Energia: '+['econômico','normal','ataque','ultrapassagem'][this.ersMode]+'.');}
 collide(force){if(this.damageCooldown>0)return;this.damageCooldown=1;this.flash=.65;this.collisions++;this.player.speed*=.65;if(this.config.damage)this.player.damage=clamp(this.player.damage+force*(this.config.reliability||1),0,1);this.message(force>.15?'Contato forte. Verifique a asa e entre nos boxes.':'Contato. Mantenha espaço para o outro carro.');if(force>.7){this.flag='red';this.flagTimer=20;this.message('Bandeira vermelha. Corrida interrompida por vinte segundos.');}else if(force>.22){this.flag=force>.38?'sc':'vsc';this.flagTimer=force>.38?35:18;this.message(this.flag==='sc'?'Safety Car. Reduza a velocidade. Ultrapassagens proibidas.':'Virtual Safety Car. Mantenha o delta e reduza.');}else{this.flag='yellow';this.flagTimer=6;}}
 step(dt,input={}){
  if(this.finish||this.phase==='paused')return;const p=this.player,c=this.config,L=this.track.length;this.flash=Math.max(0,this.flash-dt*1.6);this.damageCooldown=Math.max(0,this.damageCooldown-dt);
  if(this.phase==='start'){this.countdown-=dt;if(this.countdown<=0){this.phase='race';this.message('Luzes apagadas. Boa corrida!');}return;}
  this.time+=dt;if(this.flagTimer>0){this.flagTimer-=dt;if(this.flagTimer<=0){this.flag='green';this.message('Bandeira verde. Corrida liberada.');}}
  if(this.flag==='red'){p.speed=0;this.cars.forEach(a=>a.speed=0);return;}this.flagPenaltyCooldown=Math.max(0,this.flagPenaltyCooldown-dt);
  if(c.weather==='dynamic'){const stage=this.time/90;this.rain=stage<1?0:stage<2?(stage-1)*.45:stage<3?.45+(stage-2)*.5:stage<4?.95:Math.max(0,.95-(stage-4)*.5);this.wetness+=clamp(this.rain-this.wetness,-dt*.003,dt*.012);}else this.rain=c.weather==='storm'?.9:c.weather==='light'?.4:0;
  const tyre=TYRES[p.tyre],grip=lerp(tyre.grip,tyre.wet,this.wetness)*(1-(1-p.condition)*.35)*(1-Math.max(0,p.temp-105)*.003)*(1-p.damage*.24)*(c.gripBoost||1)*(1+(c.aero-5)*.008),oldD=p.d,point=this.track.at(p.d),s=mod(p.d,L);
  const ahead=this.cars.filter(a=>a!==p&&a.d>p.d).sort((a,b)=>a.d-b.d)[0];this.gap=ahead?(ahead.d-p.d)/Math.max(20,p.speed):null;
  this.drsAvailable=Math.abs(point.k)<.0018&&this.wetness<.35&&!this.pit&&this.flag==='green'&&(c.mode==='time'||(this.gap!==null&&this.gap<1));if(!this.drsAvailable||input.brake>.1)this.drs=false;
  if(this.pitRequested&&!this.pit&&s>L-360&&s<L-255&&p.lane>4.5){this.pit=true;this.pitState='entry';this.pitRequested=false;this.message('Limite de 80 km/h. Pare na marca amarela.');}
  if(this.pit){p.lane=lerp(p.lane,14,Math.min(1,dt*2));p.yaw=0;if(this.pitState==='entry'&&s>L-105&&s<L-60&&p.speed<1.5){this.pitState='service';this.pitTimer=3.1+p.damage*6;p.speed=0;this.message('Carro na marca. Trocando pneus.');}
   if(this.pitState==='service'){this.pitTimer-=dt;if(this.pitTimer<=0){p.tyre=this.nextTyre;p.condition=1;p.temp=75;p.damage=0;this.pitState='exit';this.pitCount++;this.message('Troca concluída. Pode sair!');}this.updateAI(dt);return;}
   if(this.pitState==='exit'&&s>90&&s<160){this.pit=false;this.pitState='';p.lane=5.8;this.message('Saída dos boxes. Observe o tráfego à esquerda.');}
  }
  let throttle=clamp(input.throttle||0,0,1),brake=clamp(input.brake||0,0,1);const safe=this.targetSpeed(p.d,grip);
  if(c.brakeAssist&&p.speed>safe+3)brake=Math.max(brake,clamp((p.speed-safe)/18,0,.85));
  if(this.pit&&s>L-150&&s<L-75&&this.pitState==='entry'){brake=Math.max(brake,clamp((p.speed-Math.max(0,(L-90-s)*.35))/8,0,1));if(s>L-100)throttle=0;}
  const mode=input.boost?3:this.ersMode;this.deploy=throttle>.5&&p.battery>0&&mode>0;const electric=this.deploy?[0,.65,1.65,2.8][mode]:0,slipstream=ahead&&this.gap<.7&&Math.abs(ahead.lane-p.lane)<2?1.04:1;
  let acc=(12.6+electric)*(1-Math.pow(p.speed/(97+(this.drs?9:0)-(c.aero-5)*.45),2))*(1-p.damage*.45)*slipstream*(1-(p.fuel/300));
  if(!c.automatic){const ideal=clamp(Math.floor(p.speed/12)+1,1,8);acc*=Math.max(.32,1-Math.abs(ideal-p.gear)*.2);}
  if(p.fuel<=0)acc=0;if(!c.tc&&throttle>.8&&p.speed<20&&this.wetness>.2){acc*=.7;p.yaw+=Math.sin(this.time*6)*dt*.14;}
  const offroad=!this.pit&&Math.abs(p.lane)>7.4;
  if(offroad){this.offroadTime+=dt;if(this.offroadTime>2.5){this.offroadTime=0;this.trackWarnings++;if(this.flag==='green'){this.flag='warning';this.flagTimer=5;}this.message('Limites de pista. Mantenha o carro entre as linhas brancas.');if(this.trackWarnings%3===0){this.penalty+=5;this.message('Reincidência de limites de pista. Penalidade de cinco segundos.');}}}else this.offroadTime=Math.max(0,this.offroadTime-dt);
  p.speed=clamp(p.speed+(throttle*acc-brake*(c.abs?29:33)*grip*(c.brakeBoost||1)*(1-Math.abs(c.bias-57)*.006)-.33-p.speed*p.speed*.00013-(offroad?7:0))*dt,0,110);
  if(this.pit&&p.speed>22.22){p.speed=Math.max(22.22,p.speed-45*dt);if(p.speed>26&&!this.pitPenalty){this.penalty+=5;this.pitPenalty=true;this.message('Excesso de velocidade nos boxes. Penalidade de cinco segundos.');}}
  if(this.flag==='sc'||this.flag==='vsc')p.speed=Math.min(p.speed,this.flag==='sc'?29:42);
  let steering=clamp(input.steer||0,-1,1);p.steer=lerp(p.steer,steering,Math.min(1,dt*7));
  if(!this.pit){
   if(c.assists){const laneVel=p.steer*(3.5+p.speed*.07)*grip;p.lane+=laneVel*dt;p.yaw=lerp(p.yaw,p.steer*.085,dt*5);}
   else{const steerAngle=p.steer*.36/(1+p.speed*.05),desired=p.speed/3.5*Math.tan(steerAngle),maxYaw=grip*(11+p.speed*p.speed*.003)/Math.max(p.speed,8);p.yaw+=(clamp(desired,-maxYaw,maxYaw)-point.k*p.speed)*dt;p.yaw*=1-dt*.65;p.yaw=clamp(p.yaw,-1.15,1.15);p.lane+=Math.sin(p.yaw)*p.speed*dt;}
   if(!c.abs&&brake>.85&&p.speed>20)p.yaw+=p.steer*dt*.18;
   if(Math.abs(p.lane)>10.2){p.lane=Math.sign(p.lane)*10.1;this.collide(.07+p.speed/300);p.yaw*=-.3;}
  }
  p.d+=p.speed*Math.cos(p.yaw)*dt;p.battery=clamp(p.battery+dt*(brake*6.5+(mode===0?1.2:.14)-(this.deploy?[0,.24,.8,2.5][mode]:0)),0,100);
  if(c.consumption)p.fuel=Math.max(0,p.fuel-p.speed*dt*.00045*(.8+throttle*.2));
  if(c.wear)p.condition=Math.max(.08,p.condition-dt*p.speed*.000012*tyre.wear*(1+Math.abs(p.steer)*.6)*(p.tyre==='wet'&&this.wetness<.3?2:1));
  p.temp+=((68+throttle*22+Math.abs(p.steer)*25-this.wetness*24+(1-p.condition)*12)-p.temp)*dt*.05;
  if(p.condition<.18&&c.damage)p.damage=Math.min(1,p.damage+dt*.002);
  if(c.automatic)p.gear=clamp(Math.floor(p.speed/12)+1,1,8);this.rpm=clamp(5400+(p.speed-(p.gear-1)*12)*530,3500,14500);
  this.updateAI(dt);
  for(const other of this.cars){if(other===p||this.pit||other.aiMode==='pit')continue;let gap=mod(other.d-p.d+L/2,L)-L/2;if(Math.abs(gap)<3.7&&Math.abs(other.lane-p.lane)<1.6){this.collide(.06+Math.abs(other.speed-p.speed)/110);other.speed*=.8;p.lane+=p.lane>=other.lane?.4:-.4;}}
  const nextPosition=this.rank().findIndex(a=>a===p)+1;if((this.flag==='sc'||this.flag==='vsc')&&nextPosition<this.position&&this.flagPenaltyCooldown===0){this.penalty+=5;this.flagPenaltyCooldown=4;this.message('Ultrapassagem durante neutralização. Penalidade de cinco segundos.');}this.position=nextPosition;this.blueFlag=this.cars.some(a=>a!==p&&a.d-p.d>L-35&&mod(p.d-a.d,L)<35);
  if(oldD<0&&p.d>=0)this.lapStart=this.time;
  if(Math.floor(Math.max(0,oldD)/L)<Math.floor(Math.max(0,p.d)/L)){this.last=this.time-this.lapStart;this.laps.push(this.last);this.best=this.best===null?this.last:Math.min(this.best,this.last);this.lapStart=this.time;this.message('Volta concluída. Posição '+this.position+'.');if(this.lap()===c.pitLap&&!this.pitRequested)this.message('Janela de pit stop aberta. Solicite os boxes com B.');}
  if(p.fuel<2&&!this.warnedFuel){this.warnedFuel=true;this.message('Pouco combustível. Use o modo econômico e evite acelerações bruscas.');}
  if(p.d>=L*c.laps){this.finish=true;this.phase='finished';this.flag='checkered';this.message('Bandeira quadriculada! Excelente trabalho.');}
  if(p.fuel<=0&&p.speed<.5){this.finish=true;this.phase='finished';this.dnf=true;this.message('Combustível esgotado. Fim da sessão.');}
 }
 updateAI(dt){const p=this.player,c=this.config,L=this.track.length;for(const a of this.cars){if(a===p)continue;const s=mod(a.d,L),lap=Math.floor(Math.max(0,a.d)/L)+1;
  if(!a.pitted&&lap>=c.pitLap&&s>L-320&&s<L-230){a.aiMode='pit';a.lane=14;}
  if(a.aiMode==='pit'){if(s>L-103&&s<L-55&&!a.pitTimer){a.pitTimer=2.8+(a.id%4)*.2;a.speed=0;}if(a.pitTimer>0){a.pitTimer-=dt;if(a.pitTimer<=0){a.pitTimer=-1;a.pitted=true;a.tyre=this.wetness>.65?'wet':this.wetness>.3?'inter':'hard';a.condition=1;}else continue;}a.speed=lerp(a.speed,21,dt*2);if(s>100&&s<160){a.aiMode='racing';a.lane=5.5;}}
  else{const tyre=TYRES[a.tyre],grip=lerp(tyre.grip,tyre.wet,this.wetness)*(1-(1-a.condition)*.25);let desired=this.targetSpeed(a.d,grip)*a.skill*(.65+c.difficulty*.0045)*(1-this.wetness*(1-a.wetSkill));const front=this.cars.find(b=>b!==a&&b.d>a.d&&b.d-a.d<27&&Math.abs(b.lane-a.lane)<2.1);let targetLane=Math.sin(a.id*3.1)*2.4;
   if(front){targetLane=front.lane>0?-3.1:3.1;desired*=1+a.aggression*.04;if(front.d-a.d<8)desired=Math.min(desired,front.speed*.94);}
   if(this.flag==='sc'||this.flag==='vsc'){desired=Math.min(desired,this.flag==='sc'?28:40);if(front)desired=Math.min(desired,front.speed);targetLane=0;}
   if(Math.sin(this.time*.023+a.id*9.13)>.9999)desired*=.8;
   a.lane=lerp(a.lane,targetLane,dt*(front?1.2:.55));a.speed+=clamp(desired-a.speed,-27*dt,(10+(a.id%3))*dt);
  }a.d+=a.speed*dt;if(c.wear)a.condition=Math.max(.2,a.condition-a.speed*dt*.000009);}}
}
root.ApexSim={TRACKS,TYRES,DRIVERS,COLORS,makeTrack,Race,clamp,lerp,mod};
if(typeof module!=='undefined')module.exports=root.ApexSim;
})(typeof window!=='undefined'?window:globalThis);
