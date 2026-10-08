const {S,race,drive}=require('./helpers.cjs');
function geometry(t){
 const stride=4,count=Math.floor(t.samples.length/stride),points=Array.from({length:count},(_,i)=>t.at(i*t.length/count));let minimumSeparation=Infinity,maxGrade=0;
 for(let i=0;i<count;i++){const a=points[i],b=points[(i+1)%count];maxGrade=Math.max(maxGrade,Math.abs(b.y-a.y)/(t.length/count));
  for(let j=i+1;j<count;j++){const arc=Math.min(j-i,count-(j-i))*t.length/count;if(arc<125)continue;const c=points[j],e=points[(j+1)%count];
   const distance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,u=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-u*dx,p.z-a.z-u*dz);};
   const cross=(p,q,r)=>(q.x-p.x)*(r.z-p.z)-(q.z-p.z)*(r.x-p.x);
   const intersect=cross(a,b,c)*cross(a,b,e)<0&&cross(c,e,a)*cross(c,e,b)<0;
   minimumSeparation=Math.min(minimumSeparation,intersect?0:Math.min(distance(a,c,e),distance(b,c,e),distance(c,a,b),distance(e,a,b)));
  }
 }
 return {lengthM:t.length,turns:t.turns,minRadiusM:1/Math.max(...t.samples.map(p=>Math.abs(p.k))),minimumNonlocalRoadSeparationM:minimumSeparation,maxGradePercent:maxGrade*100,
  pitCurvature:Math.max(...Array.from({length:60},(_,i)=>Math.abs(t.at(-390+i*10).k))),pitGradePercent:Math.max(...Array.from({length:60},(_,i)=>Math.abs(t.at(-390+i*10).y-t.at(-380+i*10).y)/10))*100};
}
function lap(t,{wet=false,maxSpeed=52}={}){
 const r=race({laps:1,weather:wet?'storm':'sun',tyre:wet?'wet':'medium',wear:true,consumption:true},t);r.resetPlayer(-40,0,0);let maxLane=0,maxKph=0;
 for(let i=0;i<120*420&&!r.finish;i++){r.step(1/120,drive(r,maxSpeed));maxLane=Math.max(maxLane,Math.abs(r.player.lane));maxKph=Math.max(maxKph,r.player.speed*3.6);}
 return {finished:r.finish,timeS:r.last,maxAbsLaneM:maxLane,maxSpeedKph:maxKph,collisions:r.collisions,penaltyS:r.penalty,valid:r.timing.completed[0]?.valid??false};
}
function pit(t){const r=race({},t);r.player.temp=100;r.resetPlayer(t.length-420,0,10);r.nextTyre='hard';r.requestPit();r.toggleLimiter();let serviced=false;
 for(let i=0;i<120*120;i++){const d=r.player.d-t.length,input=drive(r,10,d<-370?0:d<55?14:0);if(!r.pitCount&&d>-94&&d<-60){input.throttle=0;input.brake=.3;}r.step(1/120,input);serviced||=r.pitState==='service';if(r.pitCount&&!r.pit)break;}
 return {serviced,exited:r.pitCount===1&&!r.pit,collisions:r.collisions,penaltyS:r.penalty,tyre:r.player.tyre};}
module.exports={geometry,lap,pit};
