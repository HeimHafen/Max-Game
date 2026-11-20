export const upperFloor=9.06;
const levels=[0,4.56,upperFloor];
const well={left:-6.25,right:-2.05,rear:3.48,front:10.53};
const divider=-4.15;
const flightStart=4.92;
const flightSteps=12;

export function addOpenStairhall(THREE,scene,mats,mesh,floor,cx){
 const {left,right,rear,front}=well;
 const iron=mats.steel;
 const handrail=mats.brass;
 function slab(name,l,r,a,b,y,h=.20,mat=mats.stairStone){
  const piece=mesh(name,cx+(l+r)/2,y-h/2,(a+b)/2,r-l,h,b-a,mat);
  floor(cx+l,cx+r,a,b,y);
  return piece;
 }
 function guard(x1,y1,z1,x2,y2,z2){
  const start=new THREE.Vector3(cx+x1,y1+.98,z1);
  const end=new THREE.Vector3(cx+x2,y2+.98,z2);
  const axis=end.clone().sub(start),center=start.clone().addScaledVector(axis,.5);
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,axis.length(),12),handrail);
  rail.position.copy(center);
  rail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());
  rail.castShadow=rail.receiveShadow=true;
  scene.add(rail);
  const divisions=Math.ceil(Math.hypot(x2-x1,z2-z1)/.19);
  for(let i=0;i<=divisions;i++){
   const t=i/divisions;
   mesh('Eisenstab im Treppenhaus',THREE.MathUtils.lerp(cx+x1,cx+x2,t),
    THREE.MathUtils.lerp(y1,y2,t)+.48,THREE.MathUtils.lerp(z1,z2,t),.026,.96,.026,iron);
  }
  // Rectangular guards at landings also stop player movement.
  if(y1===y2){
   mesh('Absturzsicherung',center.x,y1+.55,center.z,
    Math.max(.05,Math.abs(x2-x1)),.85,Math.max(.05,Math.abs(z2-z1)),iron,true).visible=false;
  }
 }
 function flight(l,r,a,b,base,top){
  const depth=(b-a)/flightSteps, rise=(top-base)/flightSteps;
  for(let i=0;i<flightSteps;i++){
   const next=a+depth*(i+1),previous=next-depth;
   const y=base+rise*(i+1);
   slab('Kalksteinstufe',l,r,Math.min(previous,next),Math.max(previous,next),y,rise+.035);
   for(const edge of [l,r]){
    mesh('Treppenlaufbegrenzung',cx+edge,y+.49,(previous+next)/2,
     .035,.90,Math.abs(depth)+.004,iron,true).visible=false;
   }
   mesh('Profilierte Stufenkante',cx+(l+r)/2,y-.025,previous,r-l+.04,.05,.075,mats.nosingStone);
  }
  for(const x of [l+.035,r-.035])guard(x,base+rise,a,x,top,b);
 }
 for(let i=1;i<levels.length;i++){
  const level=levels[i],base=levels[i-1],half=(level+base)/2;
  for(const [l,r,a,b] of [
   [-7.12,left,1.28,15.74],[right,7.12,1.28,15.74],
   [left,right,1.28,rear],[left,right,front,15.74],
   [-1.22,1.22,15.74,16.01]
  ])slab('Geschossdecke mit offenem Treppenauge',l,r,a,b,level);
  // The intermediate landing joins both flights, with room to turn on one level.
  slab('Zwischenpodest',left,right,rear,flightStart,half);
  guard(left,half,rear,right,half,rear);
  guard(left,half,rear,left,half,flightStart);
  guard(right,half,rear,right,half,flightStart);
  guard(left,level,rear,right,level,rear);
  guard(left,level,rear,left,level,front);
  guard(right,level,rear,right,level,front);
  flight(left,divider,front,flightStart,base,half);
  flight(divider,right,flightStart,front,half,level);
 }
 guard(left,upperFloor,front,divider,upperFloor,front);
}
