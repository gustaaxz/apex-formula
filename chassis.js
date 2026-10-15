/* Four spring/damper contacts, rigid-body heave/pitch/roll, calibrated aero and
   oriented rigid-body contacts. SI units; these are game models, not team CFD. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CORNERS=Object.freeze([{name:'FL',x:1.65,y:-.98},{name:'FR',x:1.65,y:.98},{name:'RL',x:-1.95,y:-.98},{name:'RR',x:-1.95,y:.98}]);
const SPRING=110000,DAMPER=4800,CG=.30;
function pose(r,p){if(p._worldReady||p._contactReady)return p;const q=r.track.at(p.d);return {...p,x:q.x+q.nx*p.lane,z:q.z+q.nz*p.lane,heading:Math.atan2(q.tz,q.tx),vx:q.tx*p.speed,vz:q.tz*p.speed,yawRate:0};}
function road(r,x,z,near){if(r.track.surfaceAt)return r.track.surfaceAt(x,z,near);let d=near;for(let i=0;i<3;i++){const q=r.track.at(d);d+=clamp((x-q.x)*q.tx+(z-q.z)*q.tz,-8,8);}const q=r.track.at(d),lane=(x-q.x)*q.nx+(z-q.z)*q.nz,w=Math.abs(lane);return q.y+(w>7.2&&w<8.1?.04*Math.sin(Math.PI*(w-7.2)/.9)**2:0);}
function init(r,p=r.player){const q=r.track.at(p.d),grade=(r.track.at(p.d+2).y-r.track.at(p.d-2).y)/4,mass=800+(p.fuel||0),fX=Math.cos(p.heading),fZ=Math.sin(p.heading);p.chassis={height:q.y,velocity:0,pitch:Math.atan(grade),pitchRate:0,roll:0,rollRate:0};p.suspension=CORNERS.map(c=>{const h=road(r,p.x+fX*c.x-fZ*c.y,p.z+fZ*c.x+fX*c.y,p.d);return {...c,preload:mass*9.81*(c.x>0?1.95:1.65)/3.6/2/SPRING,load:mass*9.81*(c.x>0?1.95:1.65)/3.6/2,compression:0,road:h,wheelHeight:h+.44,contact:true};});}
function wake(r,p){const fX=Math.cos(p.heading),fZ=Math.sin(p.heading);let strength=0;for(const car of r.cars){if(car===p||car.raceStatus)continue;const a=pose(r,car),dx=a.x-p.x,dz=a.z-p.z,d=dx*fX+dz*fZ,side=-dx*fZ+dz*fX;if(d<5||d>85||Math.cos(a.heading-p.heading)<.8)continue;const width=1.4+d*.035;strength=Math.max(strength,(1-d/85)*Math.exp(-((side/width)**2)));}return clamp(strength,0,.95);}
function aero(r,p,u,v=0){const c=r.config,ch=p.chassis||{height:r.track.at(p.d).y,pitch:0},q=r.track.at(p.d),w=wake(r,p),setup=clamp((c.aero||5)-5,-4,5),air2=u*u+v*v;
 const fX=Math.cos(p.heading),fZ=Math.sin(p.heading),frontRoad=road(r,p.x+fX*1.65,p.z+fZ*1.65,p.d),rearRoad=road(r,p.x-fX*1.95,p.z-fZ*1.95,p.d);
 const frontHeight=ch.height-frontRoad+ch.pitch*1.65+.065,rearHeight=ch.height-rearRoad-ch.pitch*1.95+.075,relativePitch=ch.pitch-Math.atan2(frontRoad-rearRoad,3.6);
 // Floor peaks near its design height and loses load when lifted or bottomed.
 const mean=(frontHeight+rearHeight)/2,floorFactor=clamp(1-Math.abs(mean-.07)*4.5-Math.abs(relativePitch)*1.8,.22,1),yawFactor=clamp(1-Math.abs(Math.atan2(v,Math.max(1,Math.abs(u))))*.7,.45,1);
 const damage=p.damage||0,frontDamage=p.frontWingDamage??damage*.8,rearDamage=p.rearWingDamage??damage*.5;
 const front=(.52+setup*.065)*air2*(1-w*.38)*(1-frontDamage*.75)*yawFactor;
 const rear=(.65+setup*.08)*air2*(r.drs&&p===r.player?.55:1)*(1-w*.22)*(1-rearDamage*.65)*yawFactor;
 const floor=1.43*air2*floorFactor*(1-w*.20)*yawFactor;
 const drag=(.74+setup*.025)*(1-w*.20)*(r.drs&&p===r.player?.79:1)*u*Math.abs(u);
 return p.aero={front:front+floor*.46,rear:rear+floor*.54,frontWing:front,rearWing:rear,floor,drag,wake:w,frontHeight,rearHeight,floorFactor};
}
function step(r,p,dt,ax,ay,loads){if(!p.chassis)init(r,p);const ch=p.chassis,mass=800+(p.fuel||0),fX=Math.cos(p.heading),fZ=Math.sin(p.heading);let sum=0,pitchTorque=mass*ax*CG,rollTorque=mass*ay*CG;
 for(const w of p.suspension){const x=p.x+fX*w.x-fZ*w.y,z=p.z+fZ*w.x+fX*w.y,h=road(r,x,z,p.d),terrainSpeed=clamp((h-w.road)/dt,-4,4);w.road=h;
  const raw=w.preload+h-ch.height-ch.pitch*w.x-ch.roll*w.y,vel=ch.velocity+ch.pitchRate*w.x+ch.rollRate*w.y-terrainSpeed;
  const stop=Math.max(0,raw-w.preload-.045)*600000;
  w.load=raw>0?Math.max(0,SPRING*raw-DAMPER*vel+stop):0;w.contact=w.load>0;
  w.compression=clamp(raw-w.preload,-.035,.065);w.wheelHeight=Math.max(h,ch.height+ch.pitch*w.x+ch.roll*w.y-w.preload-.035)+.44;
  sum+=w.load;pitchTorque+=w.load*w.x;rollTorque+=w.load*w.y;
 }
 sum-=mass*9.81+loads.front+loads.rear;pitchTorque-=loads.front*1.65-loads.rear*1.95;
 ch.velocity+=(sum/mass)*dt;ch.pitchRate+=pitchTorque/(mass*1.8)*dt;ch.rollRate+=rollTorque/(mass*.65)*dt;
 ch.height+=ch.velocity*dt;ch.pitch+=ch.pitchRate*dt;ch.roll+=ch.rollRate*dt;
 return {front:p.suspension[0].load+p.suspension[1].load,rear:p.suspension[2].load+p.suspension[3].load};
}
function project(r,p){let d=p.d;for(let i=0;i<5;i++){const q=r.track.at(d);d+=clamp((p.x-q.x)*q.tx+(p.z-q.z)*q.tz,-12,12);}const q=r.track.at(d);p.d=d;p.lane=(p.x-q.x)*q.nx+(p.z-q.z)*q.nz;p.yaw=Math.atan2(Math.sin(p.heading-Math.atan2(q.tz,q.tx)),Math.cos(p.heading-Math.atan2(q.tz,q.tx)));}
function contact(a,b){const dx=b.x-a.x,dz=b.z-a.z;if(dx*dx+dz*dz>40)return null;const af={x:Math.cos(a.heading),z:Math.sin(a.heading)},an={x:-af.z,z:af.x},bf={x:Math.cos(b.heading),z:Math.sin(b.heading)},bn={x:-bf.z,z:bf.x};let depth=Infinity,normal;
 for(const axis of [af,an,bf,bn]){const ra=2.85*Math.abs(af.x*axis.x+af.z*axis.z)+1.15*Math.abs(an.x*axis.x+an.z*axis.z),rb=2.85*Math.abs(bf.x*axis.x+bf.z*axis.z)+1.15*Math.abs(bn.x*axis.x+bn.z*axis.z),distance=dx*axis.x+dz*axis.z,overlap=ra+rb-Math.abs(distance);if(overlap<=0)return null;if(overlap<depth){depth=overlap;const s=distance>=0?1:-1;normal={x:axis.x*s,z:axis.z*s};}}
 // Closest points on the two centre segments keep grazing contacts off centre.
 const centre={x:(a.x+b.x)/2,z:(a.z+b.z)/2},point={x:centre.x,z:centre.z};
 for(const [p,f] of [[a,af],[b,bf]]){const along=clamp((centre.x-p.x)*f.x+(centre.z-p.z)*f.z,-2.5,2.5);point.x+=(p.x+along*f.x-centre.x)*.5;point.z+=(p.z+along*f.z-centre.z)*.5;}
 return {depth,normal,point};
}
function commit(r,p){project(r,p);const u=p.vx*Math.cos(p.heading)+p.vz*Math.sin(p.heading);if(p===r.player){p.speed=Math.hypot(p.vx,p.vz);p.forwardSpeed=u;p._lastSpeed=p.speed;}else{const q=r.track.at(p.d);p.speed=Math.max(0,p.vx*q.tx+p.vz*q.tz);p.contactVX=p.vx-q.tx*p.speed;p.contactVZ=p.vz-q.tz*p.speed;p.contactYaw=p.yaw;p.contactYawRate=p.yawRate;}}
// Every car shares the visible circuit barriers. Contact separation must not
// push an opponent (or the player) through a wall after its movement step.
function walls(r,p){const bounds=r.track.boundsAt?.(p.d);if(!bounds)return;const lane=clamp(p.lane,bounds.minLane,bounds.maxLane);if(lane===p.lane)return;const q=r.track.at(p.d),oldLane=p.lane,out=p.vx*q.nx+p.vz*q.nz;p.x+=q.nx*(lane-oldLane);p.z+=q.nz*(lane-oldLane);if((oldLane-lane)*out>0){p.vx-=q.nx*out*1.18;p.vz-=q.nz*out*1.18;p.yawRate*=.65;}commit(r,p);}
function collisions(r){for(let i=0;i<r.cars.length;i++)for(let j=i+1;j<r.cars.length;j++){const a=r.cars[i],b=r.cars[j];if(a.raceStatus||b.raceStatus)continue;if(!a._worldReady&&!a._contactReady)Object.assign(a,pose(r,a),{_contactReady:true});if(!b._worldReady&&!b._contactReady)Object.assign(b,pose(r,b),{_contactReady:true});const hit=contact(a,b);if(!hit)continue;
 const n=hit.normal,ra={x:hit.point.x-a.x,z:hit.point.z-a.z},rb={x:hit.point.x-b.x,z:hit.point.z-b.z},ma=800+(a.fuel||0),mb=800+(b.fuel||0),ia=ma*2.4,ib=mb*2.4;
 const cross=(v,w)=>v.x*w.z-v.z*w.x,va={x:a.vx-(a.yawRate||0)*ra.z,z:a.vz+(a.yawRate||0)*ra.x},vb={x:b.vx-(b.yawRate||0)*rb.z,z:b.vz+(b.yawRate||0)*rb.x},relative=(vb.x-va.x)*n.x+(vb.z-va.z)*n.z;
 const denom=1/ma+1/mb+cross(ra,n)**2/ia+cross(rb,n)**2/ib;
 if(relative<0){const impulse=-relative*1.08/denom,t={x:-n.z,z:n.x},tangent=(vb.x-va.x)*t.x+(vb.z-va.z)*t.z,friction=clamp(-tangent/(1/ma+1/mb+cross(ra,t)**2/ia+cross(rb,t)**2/ib),-impulse*.35,impulse*.35),J={x:n.x*impulse+t.x*friction,z:n.z*impulse+t.z*friction};
  a.vx-=J.x/ma;a.vz-=J.z/ma;b.vx+=J.x/mb;b.vz+=J.z/mb;a.yawRate=(a.yawRate||0)-cross(ra,J)/ia;b.yawRate=(b.yawRate||0)+cross(rb,J)/ib;
  const key=a.id+':'+b.id;r.contactCooldowns ||= {};if((r.contactCooldowns[key]||0)<=r.time&&-relative>.7){r.contactCooldowns[key]=r.time+.6;const damage=clamp(-relative/95,.003,.8);for(const p of [a,b]){if(r.config.damage){if(p!==r.player)p.damage=clamp((p.damage||0)+damage,0,1);const f={x:Math.cos(p.heading),z:Math.sin(p.heading)},arm=p===a?ra:rb;if(arm.x*f.x+arm.z*f.z>0)p.frontWingDamage=clamp((p.frontWingDamage||0)+damage,0,1);else p.rearWingDamage=clamp((p.rearWingDamage||0)+damage,0,1);}}if(a===r.player||b===r.player)r.collide(damage,false);r.contactCount=(r.contactCount||0)+1;}
 }
 const correction=Math.max(0,hit.depth-.002)*.8/(1/ma+1/mb);a.x-=n.x*correction/ma;a.z-=n.z*correction/ma;b.x+=n.x*correction/mb;b.z+=n.z*correction/mb;commit(r,a);commit(r,b);walls(r,a);walls(r,b);
}}
root.ApexChassis={CORNERS,SPRING,DAMPER,init,road,aero,step,pose,project,contact,walls,collisions};if(typeof module!=='undefined')module.exports=root.ApexChassis;
})(typeof window!=='undefined'?window:globalThis);
