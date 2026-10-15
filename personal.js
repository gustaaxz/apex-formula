/* Local lap references and session telemetry. No storage or rendering inside physics. */
(function(root){
'use strict';
const VERSION=1,KEY='apex-ghosts-v1',PHYSICS='apx-2026-10-stage6',MAX_TIME=600,MAX_SAMPLES=6002;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const round=v=>Math.round(v*1000)/1000;
function setup(config){return {weather:config.weather||'sunset',tyre:config.tyre||'medium',fuel:finite(config.fuel,18),aero:finite(config.aero,5),bias:finite(config.bias,57),wear:config.wear!==false,consumption:config.consumption!==false,damage:config.damage!==false,power:finite(config.powerBoost,1),brakes:finite(config.brakeBoost,1),grip:finite(config.gripBoost,1),energy:finite(config.energyUpgrade)};}
function trackCode(track){return JSON.stringify([PHYSICS,track.id||'custom',round(track.length),Array.from({length:24},(_,i)=>{const p=track.at(i*track.length/24);return [round(p.x),round(p.z),round(p.y||0)];})]);}
function signature(track,config){return trackCode(track)+'|'+JSON.stringify(setup(config));}
function pose(r){return {time:r.time,d:r.player.d,lane:r.player.lane||0,yaw:r.player.yaw||0,speed:r.player.speed||0,pit:r.pit,pitState:r.pitState,penalty:r.penalty,collisions:r.collisions,warnings:r.trackWarnings,tyre:r.player.tyre};}
function interpolate(a,b,time,base=0){const f=b.time>a.time?clamp((time-a.time)/(b.time-a.time),0,1):1,angle=Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw));return [time,lerp(a.d,b.d,f)-base,lerp(a.lane,b.lane,f),a.yaw+angle*f,lerp(a.speed,b.speed,f)];}
function atTime(record,time){
 if(!record||!Number.isFinite(time)||time<0||time>record.time)return null;
 const s=record.samples;let lo=0,hi=s.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(s[mid][0]<=time)lo=mid;else hi=mid;}
 const a=s[lo],b=s[hi],f=b[0]>a[0]?clamp((time-a[0])/(b[0]-a[0]),0,1):0;
 return {d:lerp(a[1],b[1],f),lane:lerp(a[2],b[2],f),yaw:a[3]+Math.atan2(Math.sin(b[3]-a[3]),Math.cos(b[3]-a[3]))*f,speed:lerp(a[4],b[4],f)};
}
function timeAt(trace,d,length){if(!trace||trace.length!==121)return null;const f=clamp(d/length*120,0,120),i=Math.min(119,Math.floor(f));return lerp(trace[i],trace[i+1],f-i);}
function delta(record,d,time,length){const reference=record&&timeAt(record.trace,d,length);return reference===null||!Number.isFinite(time)?null:time-reference;}
function validate(record){
 if(!record||typeof record.signature!=='string'||record.signature.length>6000||!Number.isFinite(record.time)||record.time<=0||record.time>MAX_TIME+.001||!Number.isFinite(record.length)||record.length<100||record.length>20000)return null;
 if(!Array.isArray(record.trace)||record.trace.length!==121||!record.trace.every((v,i,a)=>Number.isFinite(v)&&v>=0&&(!i||v>a[i-1]))||record.trace[0]!==0||Math.abs(record.trace[120]-record.time)>.002)return null;
 if(!Array.isArray(record.samples)||record.samples.length<2||record.samples.length>MAX_SAMPLES)return null;
 let previous=null;
 for(const point of record.samples){
  if(!Array.isArray(point)||point.length!==5||!point.every(Number.isFinite)||point[0]<0||point[0]>record.time+.002||point[1]<-.1||point[1]>record.length+.1||Math.abs(point[2])>8.5||Math.abs(point[3])>20||point[4]<0||point[4]>150)return null;
  if(previous&&(point[0]<=previous[0]||point[0]-previous[0]>.21||point[1]<previous[1]-.1||point[1]-previous[1]>150*(point[0]-previous[0])+1))return null;
  previous=point;
 }
 const first=record.samples[0],last=record.samples.at(-1);
 if(first[0]!==0||Math.abs(first[1])>.1||Math.abs(last[0]-record.time)>.002||Math.abs(last[1]-record.length)>.1)return null;
 return {signature:record.signature,trackId:String(record.trackId||'').slice(0,40),time:record.time,length:record.length,trace:[...record.trace],sectors:[record.trace[40],record.trace[80]-record.trace[40],record.time-record.trace[80]],samples:record.samples.map(p=>[...p]),start:{fuel:finite(record.start?.fuel),battery:finite(record.start?.battery),condition:finite(record.start?.condition),temp:finite(record.start?.temp)}};
}
class GhostStore{
 constructor(storage){
  this.storage=storage;this.records=[];this.notice='';this.readOnly=false;this.backup=null;
  try{const raw=storage?.getItem(KEY);if(!raw)return;const data=JSON.parse(raw);
   if(data?.version>VERSION){this.readOnly=true;this.notice='A referência é de uma versão mais recente e foi preservada.';return;}
   if(data?.version!==VERSION||!Array.isArray(data.records))throw Error('schema');
   this.records=data.records.slice(-8).map(validate).filter(Boolean);const ids=new Set();this.records=this.records.filter(r=>!ids.has(r.signature)&&ids.add(r.signature));
   if(this.records.length!==data.records.length){this.backup=raw;this.notice='Uma referência inválida foi ignorada; o original será preservado antes de gravar.';}
  }catch{try{this.backup=storage?.getItem(KEY)||null;}catch{this.readOnly=true;}this.notice='Não foi possível carregar o fantasma salvo. Os demais salvamentos foram preservados.';}
 }
 find(signature){return this.records.find(r=>r.signature===signature)||null;}
 offer(record){
  const clean=validate(record);if(!clean)return {accepted:false,saved:false};
  const old=this.find(clean.signature);if(old&&old.time<=clean.time)return {accepted:false,saved:true};
  this.records=this.records.filter(r=>r.signature!==clean.signature);this.records.push(clean);this.records=this.records.slice(-8);
  const saved=this.save();return {accepted:true,saved};
 }
 save(){
  if(this.readOnly||!this.storage)return false;
  try{if(this.backup!==null){this.storage.setItem(KEY+'-recovery',this.backup);this.backup=null;}this.storage.setItem(KEY,JSON.stringify({version:VERSION,records:this.records}));return true;}catch{return false;}
 }
}
class Session{
 constructor(track,config){
  this.track=track;this.enabled=config.mode!=='training';this.initial=setup(config);this.code=trackCode(track);this.signature=this.code+'|'+JSON.stringify(this.initial);
  this.reference=null;this.best=null;this.current=null;this.laps=[];this.events=[];this.stops=[];this.openStop=null;this.pendingGhost=null;this.comparison=null;this.end=null;this.last=null;this.ghostNotice='';
 }
 invalidate(reason){if(this.current){this.current.clean=false;if(!this.current.reasons.includes(reason))this.current.reasons.push(reason);}}
 event(type,time,label){this.events.push({type,time,label});this.events=this.events.slice(-100);}
 begin(event,r){
  const point=interpolate(this.from||pose(r),pose(r),event.time,event.distance);point[0]=0;point[1]=0;
  this.current={base:event.distance,startTime:event.time,samples:[point],next:.1,clean:true,reasons:[],signature:this.code+'|'+JSON.stringify(setup(r.config)),start:{fuel:r.player.fuel,battery:r.player.battery,condition:r.player.condition,temp:r.player.temp},collisions:r.collisions,penalty:r.penalty};
 }
 timing(events,laps,r){
  if(!this.enabled)return;let index=0;
  for(const event of events){
   if(event.type==='invalid')this.invalidate(event.reason||'Percurso inválido');
   if(event.type==='line'){
    const lap=laps[index++];if(lap)this.complete(lap,event,r);
    this.begin(event,r);
   }else if(event.type==='start')this.begin(event,r);
  }
 }
 capture(r,until){
  const current=this.current;if(!current)return;
  if(r.pit)this.invalidate('Boxes');if(r.flag!=='green'&&r.flag!=='checkered')this.invalidate('Neutralização / bandeira');
  if(r.collisions!==current.collisions)this.invalidate('Contato');if(r.penalty!==current.penalty)this.invalidate('Penalidade');
  if(r.player.tyre!==this.initial.tyre)this.invalidate('Composto diferente');
  const now=pose(r),from=this.from||now;
  if(now.d<from.d-.01)this.invalidate('Sentido inverso');
  if(current.next<=until+.000001){
   if(current.signature!==this.code+'|'+JSON.stringify(setup(r.config)))this.invalidate('Acerto alterado');
   while(current.next<=until+.000001){
    if(current.samples.length>=MAX_SAMPLES-1||current.next>MAX_TIME+.000001){current.recordable=false;if(r.config.mode==='time')this.ghostNotice='Limite do fantasma: 10 minutos por volta. A volta continua válida para cronometragem e análise.';break;}
    const p=interpolate(from,now,current.startTime+current.next,current.base);p[0]=current.next;current.samples.push(p);current.next+=.1;
   }
  }
 }
 complete(lap,event,r){
  const current=this.current;this.capture(r,lap.time-.000001);
  const clean=!!current?.clean&&lap.valid,record={...lap,clean,start:current?{...current.start}:null,reasons:current?[...current.reasons]:['Sem telemetria completa'],number:this.laps.length+1,trace:[...lap.trace]};
  if(!lap.valid&&!record.reasons.length)record.reasons.push('Percurso ou limites de pista');
  record.curves=(this.track.corners||[]).map(c=>({number:c.number,name:c.name,time:lap.valid?timeAt(lap.trace,c.end,this.track.length)-timeAt(lap.trace,c.start,this.track.length):null}));
  this.laps.push(record);this.laps=this.laps.slice(-200);
  const previous=[this.best,this.reference].filter(Boolean).sort((a,b)=>a.time-b.time)[0]||null;
  if(clean){this.comparison={lap:record,reference:previous};if(!this.best||lap.time<this.best.time)this.best=record;}
  if(r.config.mode==='time'&&r.config.session==='race'&&this.initial.weather!=='dynamic'&&clean&&current&&current.recordable!==false&&lap.time<=MAX_TIME+.001&&current.signature===this.signature){
   const end=interpolate(this.from||pose(r),pose(r),event.time,current.base);end[0]=lap.time;end[1]=this.track.length;
   const candidate=validate({signature:this.signature,trackId:this.track.id,length:this.track.length,time:lap.time,trace:lap.trace,start:current.start,samples:[...current.samples.filter(p=>p[0]<lap.time-.001),end].map(p=>p.map(round))});
   if(candidate&&(!this.reference||candidate.time<this.reference.time)&&(!this.pendingGhost||candidate.time<this.pendingGhost.time))this.pendingGhost=candidate;
  }
 }
 tick(r,from){
  if(!this.enabled||this.end)return;
  const now=pose(r),old=this.last||from,dt=Math.max(0,now.time-from.time);this.last=now;
  if(r.collisions>old.collisions)this.event('contact',r.time,'Contato registrado');
  if(r.penalty>old.penalty)this.event('penalty',r.time,'Penalidade: +'+round(r.penalty-old.penalty)+' s');
  if(r.trackWarnings>old.warnings)this.event('limits',r.time,'Advertência de limites de pista');
  if(r.pit&&!this.openStop)this.openStop={entry:from.time,lap:r.lap(),service:0,tyreIn:from.tyre,tyreOut:now.tyre,complete:false};
  if(this.openStop){if(from.pitState==='service')this.openStop.service+=dt;this.openStop.tyreOut=now.tyre;this.openStop.total=r.time-this.openStop.entry;if(!r.pit){this.openStop.complete=true;this.stops.push(this.openStop);this.openStop=null;}}
  if(this.current)this.capture(r,Math.max(0,r.time-this.current.startTime));
  if(r.playerDone||r.finish){this.end={time:r.time,fuel:r.player.fuel,condition:r.player.condition,penalty:r.penalty,collisions:r.collisions,warnings:r.trackWarnings};}
 }
 summary(r){
  const end=this.end||{time:r.time,fuel:r.player.fuel,condition:r.player.condition,penalty:r.penalty,collisions:r.collisions,warnings:r.trackWarnings},clean=this.laps.filter(l=>l.clean),mean=clean.length?clean.reduce((sum,l)=>sum+l.time,0)/clean.length:null;
  return {laps:this.laps,clean:clean.length,invalid:this.laps.filter(l=>!l.valid).length,mean,spread:clean.length>1?Math.max(...clean.map(l=>l.time))-Math.min(...clean.map(l=>l.time)):null,deviation:clean.length>1?Math.sqrt(clean.reduce((sum,l)=>sum+(l.time-mean)**2,0)/clean.length):null,elapsed:end.time,initial:this.initial,end,stops:[...this.stops,...(this.openStop?[{...this.openStop,complete:false}]:[])],events:this.events,comparison:this.comparison};
 }
}
root.ApexPersonal={VERSION,KEY,PHYSICS,MAX_TIME,setup,signature,trackCode,pose,atTime,timeAt,delta,validate,GhostStore,Session};
if(typeof module!=='undefined')module.exports=root.ApexPersonal;
})(typeof window!=='undefined'?window:globalThis);
