/* Test-only telemetry: traverse every gate instead of teleporting to a finish line. */
(function(root){
'use strict';
function segment(board,car,from,to){
 const result={car,from,to,pit:car.aiMode==='pit'};
 if(typeof board.track!=='number'){
  const a=board.track.at(from),b=board.track.at(to),lane=car.lane||0;
  Object.assign(result,{fromX:a.x+a.nx*lane,fromZ:a.z+a.nz*lane,x:b.x+b.nx*lane,z:b.z+b.nz*lane});
 }
 return result;
}
function prepare(board,car,to,before){
 const progress=board.progressOf(car);let from=progress.sample?.d??0;
 const start=from,step=Math.min(board.length/240,10),startTime=before-(to-from)/100;
 while(from<to-1e-8){
  const next=Math.min(to,from+step);
  board.update([segment(board,car,from,next)],startTime+(from-start)/100,startTime+(next-start)/100);
  from=next;
 }
 car.d=to;
}
function cross(board,car,line,time){
 const from=line*board.length-1,to=from+2;
 prepare(board,car,from,time-1);car.d=to;
 board.update([segment(board,car,from,to)],time-1,time+1);
}
root.ApexCourseFixtures={segment,prepare,cross};
if(typeof module!=='undefined')module.exports=root.ApexCourseFixtures;
})(typeof window!=='undefined'?window:globalThis);
