export const stairOpening=[2.42,8.12,1.34,7.68];

export function addGalleryStair(THREE,scene,mats,mesh,floor,cx,level){
 const [left,right,rear,front]=stairOpening;
 const oak=new THREE.MeshStandardMaterial({color:0x674229,roughness:.45});
 const iron=new THREE.MeshStandardMaterial({color:0x23201e,metalness:.65,roughness:.4});
 const stone=mats.stairStone;
 const soffit=new THREE.MeshStandardMaterial({color:0xf0e3cd,roughness:.8});
 const start=2.53,end=6.47,landingEnd=right-.14;
 const ground=.05,half=(level+ground)/2;
 const treads=13,going=(end-start)/treads;
 const lowZ=6.53,highZ=2.45,width=1.77;
 function rail(a,b,z,yA,yB){
  const v=new THREE.Vector3(b-a,yB-yA,0);
  const item=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,v.length(),12),oak);
  item.position.set(cx+(a+b)/2,(yA+yB)/2,z);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());
  item.castShadow=true;
  scene.add(item);
 }
 function spindle(x,y,z,h){
  const item=new THREE.Mesh(new THREE.CylinderGeometry(.013,.017,h,8),iron);
  item.position.set(cx+x,y+h/2,z);
  item.castShadow=true;
  scene.add(item);
  mesh('Bund des Geländerstabs',cx+x,y+h*.36,z,.039,.047,.039,iron);
 }
 function flight(from,to,base,top,z,rounded){
  const span=(to-from)/treads,rise=(top-base)/treads;
  for(let i=0;i<treads;i++){
   const a=from+span*i,b=a+span;
   const l=Math.min(a,b),r=Math.max(a,b),y=base+(i+1)*rise;
   const extra=rounded?Math.max(0,3-i)*.098:0;
   const treadWidth=width+extra*2;
   if(extra){
    const radius=.15+extra*.28;
    const halfWidth=treadWidth/2;
    const outline=new THREE.Shape();
    outline.moveTo(going,-halfWidth);
    outline.lineTo(radius,-halfWidth);
    outline.quadraticCurveTo(0,-halfWidth,0,-halfWidth+radius);
    outline.lineTo(0,halfWidth-radius);
    outline.quadraticCurveTo(0,halfWidth,radius,halfWidth);
    outline.lineTo(going,halfWidth);
    outline.closePath();
    const step=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{
     depth:rise-.024,bevelEnabled:true,bevelThickness:.012,bevelSize:.013,bevelSegments:3,curveSegments:12
    }),stone);
    step.name='Gerundete Kalkstein-Antrittsstufe';
    step.rotation.x=-Math.PI/2;
    step.position.set(cx+l,y-rise+.012,z);
    step.castShadow=step.receiveShadow=true;
    scene.add(step);
   }else{
    mesh('Kalksteinstufe',cx+(l+r)/2,y-rise/2,z,going,rise,treadWidth,stone);
    const nose=new THREE.Mesh(new THREE.CapsuleGeometry(.034,treadWidth-.068,4,10),stone);
    nose.name='Gerundete Kalksteinkante';
    nose.rotation.x=Math.PI/2;
    nose.position.set(cx+a,y-.032,z);
    nose.castShadow=nose.receiveShadow=true;
    scene.add(nose);
   }
   floor(cx+l,cx+r,z-width/2,z+width/2,y);
   for(const side of [-1,1]){
    const edge=z+side*width/2;
    for(const fraction of [.25,.75]){
     spindle(a+span*fraction,y,edge,.96+rise*(fraction-1));
    }
    const guard=mesh('Kollision des Treppengeländers',cx+(l+r)/2,y+.52,edge,going+.005,1.04,.051,iron,true);
    guard.visible=false;
   }
  }
  for(const side of [-1,1])rail(from,to,z+side*width/2,base+.96,top+.96);
  // The inclined soffit closes the underside between the two landings.
  const length=Math.hypot(to-from,top-base);
  const stringer=mesh('Geschlossene Treppenuntersicht',cx+(from+to)/2,(base+top)/2-.151,z,length,.15,width-.055,soffit);
  stringer.rotation.z=Math.atan((top-base)/(to-from));
 }
 flight(start,end,ground,half,lowZ,true);
 flight(end,left,half,level,highZ,false);
 mesh('Kalkstein-Zwischenpodest',cx+(end+landingEnd)/2,half-.13,4.49,landingEnd-end,.26,5.85,stone);
 floor(cx+end,cx+landingEnd,1.565,7.415,half);
 function barrier(x1,z1,x2,z2,y){
  const length=Math.hypot(x2-x1,z2-z1);
  const horizontal=z1===z2;
  const x=(x1+x2)/2,z=(z1+z2)/2;
  const railMesh=mesh('Eichenhandlauf am Podest',cx+x,y+.96,z,horizontal?length:.075,.068,horizontal?.075:length,oak);
  railMesh.castShadow=true;
  const guard=mesh('Kollision der Brüstung',cx+x,y+.51,z,horizontal?length:.055,1.02,horizontal?.055:length,iron,true);
  guard.visible=false;
  const count=Math.ceil(length/.145);
  for(let i=0;i<=count;i++)spindle(x1+(x2-x1)*i/count,y,z1+(z2-z1)*i/count,.94);
 }
 barrier(landingEnd,1.565,landingEnd,5.465,half);
 barrier(end,1.565,landingEnd,1.565,half);
 barrier(end,7.415,landingEnd,7.415,half);
 barrier(left,rear,right,rear,level);
 barrier(left,front,right,front,level);
 barrier(right,rear,right,front,level);
 barrier(left,rear,left,highZ-width/2,level);
 barrier(left,highZ+width/2,left,front,level);
 const apron=mesh('Steinprofil an der Galerieöffnung',cx+(left+right)/2,level-.155,front,right-left,.09,.055,stone);
 apron.castShadow=false;
 const light=new THREE.PointLight(0xffead2,42,12,2);
 light.position.set(cx+5.3,6.9,3.5);
 scene.add(light);
}
