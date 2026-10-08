/* Original circuits. Geometry, corner identifiers and scenery clearance share
 * the same centreline; none of these layouts represents an official circuit. */
(function(root){
'use strict';
const mod=(v,n)=>((v%n)+n)%n,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const start=[[-600,0],[-600,-350],[-600,-650]],finish=[[-400,800],[-600,700],[-600,400]];
const TRACKS=[
 {id:'APX-01',name:'Costa Verde',country:'BRASIL',theme:'tropical',accent:'#50dfae',difficulty:'TÉCNICO',character:'Esses da floresta, subida e uma curva de raio decrescente.',signature:'Esses da Mata',hill:4,
  points:[...start,[-455,-815],[-225,-850],[-80,-690],[100,-680],[235,-790],[470,-755],[620,-545],[540,-340],[360,-300],[335,-120],[555,20],[600,245],[420,355],[195,290],[50,440],[-175,505],[-250,660],...finish]},
 {id:'APX-02',name:'Marina Neon',country:'SINGAPURA',theme:'city',accent:'#bda0ff',difficulty:'PRECISÃO',character:'Curvas lentas, mudança de direção e skyline iluminado.',signature:'Chicane da Marina',hill:0,
  points:[...start,[-400,-780],[-155,-780],[-60,-575],[135,-555],[210,-780],[445,-780],[600,-605],[560,-405],[335,-325],[345,-145],[580,-65],[615,195],[410,340],[245,155],[30,140],[-65,380],[-240,480],[-265,660],...finish]},
 {id:'APX-03',name:'Alta Velocità',country:'ITÁLIA',theme:'forest',accent:'#ff8579',difficulty:'ALTA VELOCIDADE',character:'Retas longas, frenagem forte e uma sequência de esses.',signature:'Esses do Bosque',hill:0,
  points:[...start,[-450,-790],[-180,-785],[-75,-665],[65,-760],[395,-795],[650,-615],[650,-300],[450,-135],[500,45],[375,195],[130,180],[40,375],[-220,475],[-265,650],...finish]},
 {id:'APX-04',name:'Sierra Blanca',country:'ESPANHA',theme:'mountain',accent:'#8fc3ff',difficulty:'RELEVO',character:'Subidas suaves, curvas cegas e um miolo técnico.',signature:'Curva do Mirante',hill:12,
  points:[...start,[-430,-795],[-230,-760],[-100,-560],[105,-670],[270,-780],[480,-690],[485,-445],[655,-275],[495,-95],[260,-150],[170,50],[420,200],[310,430],[95,550],[-130,430],[-240,550],[-270,660],...finish]},
 {id:'APX-05',name:'Dunas de Yas',country:'EMIRADOS ÁRABES',theme:'desert',accent:'#ffd18a',difficulty:'FRENAGEM',character:'Retas abertas, hairpins e transições no deserto.',signature:'Gancho das Dunas',hill:0,
  points:[...start,[-425,-815],[-130,-820],[60,-635],[450,-660],[665,-475],[630,-150],[405,-95],[345,135],[565,275],[460,495],[175,570],[80,340],[-130,305],[-250,480],[-270,650],...finish]},
 {id:'APX-06',name:'Silver Coast',country:'REINO UNIDO',theme:'coast',accent:'#68d9f4',difficulty:'RITMO',character:'Curvas rápidas, esses encadeados e uma freada técnica.',signature:'Esses do Farol',hill:0,
  points:[...start,[-440,-825],[-155,-790],[-20,-570],[195,-670],[420,-790],[630,-590],[575,-365],[340,-245],[455,-20],[355,230],[125,205],[0,530],[-220,490],[-300,375],[-465,480],[-290,675],...finish]}
];
// Centripetal Catmull-Rom prevents loops caused by unequal control-point spacing.
function curvePoint(a,b,c,d,t){
 const knot=(p,q)=>Math.sqrt(Math.hypot(q[0]-p[0],q[1]-p[1]));
 const t0=0,t1=knot(a,b),t2=t1+knot(b,c),t3=t2+knot(c,d),u=lerp(t1,t2,t);
 const blend=(p,q,x,y)=>p.map((v,i)=>((y-u)*v+(u-x)*q[i])/(y-x));
 const a1=blend(a,b,t0,t1),a2=blend(b,c,t1,t2),a3=blend(c,d,t2,t3);
 return blend(blend(a1,a2,t0,t2),blend(a2,a3,t1,t3),t1,t2);
}
function makeTrack(index){
 const normalized=mod(index,TRACKS.length),def=TRACKS[normalized],pts=def.points,n=pts.length,raw=[];
 for(let i=0;i<n;i++)for(let j=0;j<100;j++){
  const q=curvePoint(pts[mod(i-1,n)],pts[i],pts[(i+1)%n],pts[(i+2)%n],j/100);
  raw.push({x:q[0]*1.24,z:q[1]*1.24});
 }
 raw.push({...raw[0]});let length=0;raw[0].d=0;
 for(let i=1;i<raw.length;i++){length+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z);raw[i].d=length;}
 const count=Math.ceil(length/3),step=length/count,samples=[];let cursor=0;
 // Keep the entire start/pit corridor level, including on the hilly courses.
 const heightAt=(x,z)=>{const t=clamp((x+744-65)/240,0,1),fade=t*t*(3-2*t);return def.hill*fade*(Math.sin(x*.0033)*Math.cos(z*.0025)+.23*Math.sin(z*.007));};
 for(let i=0;i<count;i++){
  const d=i*step;while(raw[cursor+1].d<d)cursor++;
  const t=(d-raw[cursor].d)/(raw[cursor+1].d-raw[cursor].d),x=lerp(raw[cursor].x,raw[cursor+1].x,t),z=lerp(raw[cursor].z,raw[cursor+1].z,t);
  samples.push({x,z,y:heightAt(x,z)});
 }
 samples.forEach((p,i)=>{const a=samples[mod(i-1,count)],b=samples[(i+1)%count],len=Math.hypot(b.x-a.x,b.z-a.z);p.tx=(b.x-a.x)/len;p.tz=(b.z-a.z)/len;p.nx=-p.tz;p.nz=p.tx;});
 samples.forEach((p,i)=>{const a=samples[mod(i-2,count)],b=samples[(i+2)%count];p.k=Math.atan2(a.tx*b.tz-a.tz*b.tx,a.tx*b.tx+a.tz*b.tz)/(step*4);});
 const at=d=>{
  const f=mod(d,length)/step,i=Math.floor(f),a=samples[i],b=samples[(i+1)%count],t=f-i,tx=lerp(a.tx,b.tx,t),tz=lerp(a.tz,b.tz,t),norm=Math.hypot(tx,tz);
  return {x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),y:lerp(a.y,b.y,t),tx:tx/norm,tz:tz/norm,nx:-tz/norm,nz:tx/norm,k:lerp(a.k,b.k,t)};
 };
 // Curvature lobes identify actual turns, rather than counting control points.
 const corners=[];let group=null;
 for(let i=0;i<count;i++){
  const d=i*step,k=samples[i].k,sign=Math.sign(k),active=Math.abs(k)>.0022;
  if(active){
   if(!group||group.sign!==sign||d-group.end>32){if(group)corners.push(group);group={start:d,end:d,apex:d,peak:Math.abs(k),sign};}
   group.end=d;if(Math.abs(k)>group.peak){group.peak=Math.abs(k);group.apex=d;}
  }else if(group&&d-group.end>32){corners.push(group);group=null;}
 }
 if(group)corners.push(group);
 const turns=corners.filter(c=>c.end-c.start>15&&c.peak>.0035);
 turns.forEach((c,i)=>{c.number=i+1;c.radius=1/c.peak;c.direction=c.sign>0?'DIREITA':'ESQUERDA';c.kind=c.radius<55?'FECHADA':c.radius<105?'TÉCNICA':'RÁPIDA';c.name='Curva '+c.number;c.referenceKph=Math.round(Math.sqrt(8*c.radius)*3.6/5)*5;});
 const signature=turns.filter(c=>c.start>length*.22&&c.start<length*.82).sort((a,b)=>b.peak-a.peak)[0];if(signature)signature.name=def.signature;
 const boundsAt=d=>{
  const s=mod(d,length),pitSide=s>length-375||s<175;let left=11.3,right=11.3;
  for(const c of turns){const before=c.start-75,after=c.end+65;if(s<before||s>after)continue;const fade=Math.min(1,(s-before)/55,(after-s)/55),extra=clamp(fade,0,1)*Math.min(7,2+c.peak*190);if(c.sign>0)left=Math.max(left,11.3+extra);else right=Math.max(right,11.3+extra);}
  if(pitSide)right=18.5;
  return {left:-left,right,minLane:-left+1.1,maxLane:right-1.1};
 };
 const distanceToRoad=(x,z)=>{let best=Infinity;for(let i=0;i<count;i+=3){const a=samples[i],b=samples[(i+3)%count],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);best=Math.min(best,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));}return best;};
 const scenerySafe=(x,z,radius=0)=>{
  if(distanceToRoad(x,z)<20+radius)return false;
  // The pit road is a real drivable corridor and is kept clear as well.
  const origin=at(0),dx=x-origin.x,dz=z-origin.z,lane=dx*origin.nx+dz*origin.nz,along=dx*origin.tx+dz*origin.tz;
  return !(along>-400-radius&&along<200+radius&&Math.abs(lane-14)<4.8+radius);
 };
 const surfaceAt=(x,z,near)=>{let d=near;for(let i=0;i<3;i++){const q=at(d);d+=clamp((x-q.x)*q.tx+(z-q.z)*q.tz,-8,8);}const q=at(d),lane=(x-q.x)*q.nx+(z-q.z)*q.nz,w=Math.abs(lane);return q.y+(w>7.2&&w<8.1?.04*Math.sin(Math.PI*(w-7.2)/.9)**2:0);};
 const nextCorner=d=>{const s=mod(d,length);let best=null;for(const c of turns){const distance=mod(c.apex-s,length);if(distance>8&&(!best||distance<best.distance))best={...c,distance};}return best;};
 const drsZones=[];let zone=null;
 for(let i=0;i<count;i++){if(Math.abs(samples[i].k)<.00125){if(!zone)zone={start:i*step,end:i*step};zone.end=i*step;}else if(zone){if(zone.end-zone.start>180)drsZones.push(zone);zone=null;}}
 if(zone&&zone.end-zone.start>180)drsZones.push(zone);
 const main=drsZones.find(z=>z.end>length-100);if(main&&drsZones[0]?.start===0){main.end=length+drsZones[0].end;drsZones.shift();}
 return {...def,index:normalized,length,step,samples,at,heightAt,turns:turns.length,corners:turns,boundsAt,distanceToRoad,scenerySafe,surfaceAt,nextCorner,drsZones,
  sectors:[0,length/3,length*2/3,length],pit:{entry:length-360,service:length-90,exit:160},fictional:true};
}
root.ApexTracks={TRACKS,makeTrack};if(typeof module!=='undefined')module.exports=root.ApexTracks;
})(typeof window!=='undefined'?window:globalThis);
