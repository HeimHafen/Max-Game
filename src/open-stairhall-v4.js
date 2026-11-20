export const upperFloor=9.06;
const levels=[0,4.56,upperFloor];
const well={left:-5.75,right:-2.70,rear:3.62,front:12.22};
const flightSteps=24;

export function addOpenStairhall(THREE,scene,mats,mesh,floor,cx,oak){
 const {left,right,rear,front}=well;
 const iron=mats.steel;
 const handrail=oak;
 const bronze=new THREE.MeshStandardMaterial({color:0x493323,roughness:.43,metalness:.48});
 const glass=new THREE.MeshPhysicalMaterial({color:0xffe5c3,roughness:.23,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide});
 const flame=new THREE.MeshStandardMaterial({color:0xffca84,emissive:0xffb466,emissiveIntensity:1.45});
 function sconce(y,z){
  const x=cx-6.77;
  mesh('Bronzene Wandplatte',cx-7.12,y,z,.085,.43,.19,bronze);
  mesh('Ausleger der Wandlaterne',cx-6.99,y+.25,z,.39,.06,.073,bronze);
  function lanternPiece(geometry,material,height){
   const piece=new THREE.Mesh(geometry,material);
   piece.position.set(x,y+height,z);
   piece.rotation.y=Math.PI/4;
   scene.add(piece);
   return piece;
  }
  lanternPiece(new THREE.CylinderGeometry(.185,.052,.14,4),bronze,-.26);
  lanternPiece(new THREE.CylinderGeometry(.203,.171,.42,4,1,true),glass,0);
  lanternPiece(new THREE.CylinderGeometry(.055,.232,.15,4),bronze,.283);
  for(const a of [-1,1])for(const b of [-1,1]){
   mesh('Bronzestrebe der Wandlaterne',x+a*.128,y,z+b*.128,.024,.437,.024,bronze);
  }
  mesh('Kerze der Wandlaterne',x,y-.09,z,.062,.19,.062,mats.brass);
  lanternPiece(new THREE.SphereGeometry(.041,10,8),flame,.04).scale.y=1.7;
  const light=new THREE.PointLight(0xffcb98,38,7.5,2);
  light.name='Warmes Treppenlicht';
  light.position.set(x+.14,y+.04,z);
  scene.add(light);
 }
 for(const [y,z] of [[2.45,6.08],[6.98,6.08],[11.30,6.08],[2.55,10.92],[7.05,10.92],[11.35,10.92]])sconce(y,z);
 function slab(name,l,r,a,b,y,h=.20,mat=mats.stairStone){
  const piece=mesh(name,cx+(l+r)/2,y-h/2,(a+b)/2,r-l,h,b-a,mat);
  floor(cx+l,cx+r,a,b,y);
  return piece;
 }
 function guard(x1,y1,z1,x2,y2,z2){
  const start=new THREE.Vector3(cx+x1,y1+.98,z1);
  const end=new THREE.Vector3(cx+x2,y2+.98,z2);
  const axis=end.clone().sub(start),center=start.clone().addScaledVector(axis,.5);
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(.048,.048,axis.length(),12),handrail);
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
  const section=new THREE.Shape();
  section.moveTo(a,base-.12);
  section.lineTo(b,top-.09);
  section.lineTo(b,top-.31);
  section.lineTo(a,base-.34);
  section.closePath();
  const underside=new THREE.Mesh(new THREE.ExtrudeGeometry(section,{depth:r-l-.08,bevelEnabled:false}),mats.dressedStone);
  underside.name='Durchgehende Steinuntersicht';
  underside.position.x=cx+r-.04;
  underside.rotation.y=-Math.PI/2;
  underside.castShadow=underside.receiveShadow=true;
  scene.add(underside);
  for(const x of [l+.035,r-.035])guard(x,base+rise,a,x,top,b);
 }
 for(let i=1;i<levels.length;i++){
  const level=levels[i],base=levels[i-1];
  for(const [l,r,a,b] of [
   [-7.12,left,1.28,15.74],[right,7.12,1.28,15.74],
   [left,right,1.28,rear],[left,right,front,15.74],
   [-1.22,1.22,15.74,16.01]
  ])slab('Geschossdecke mit offenem Treppenauge',l,r,a,b,level);
  for(const edge of [left,right]){
   guard(edge,level,rear,edge,level,front);
   mesh('Kalksteinprofil an der Galerie',cx+edge,level-.174,(rear+front)/2,
    .12,.095,front-rear,mats.capitalFinish);
  }
  flight(left,right,front,rear,base,level);
 }
 guard(left,upperFloor,front,right,upperFloor,front);
}
