// Coordinates are local to the right house. Each figure stays on its floor.
export function addHauntedHouse(T,scene,axis,levels,surfaces,walls){
 const bone=new T.MeshStandardMaterial({color:0xd6c9ad,roughness:.76});
 const shadow=new T.MeshStandardMaterial({color:0x302b26,roughness:.95});
 const linen=new T.MeshStandardMaterial({
  color:0xb3c4c9,emissive:0x667d89,emissiveIntensity:.48,
  transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide
 });
 const sockets=new T.MeshBasicMaterial({color:0x263340});
 const sphere=new T.SphereGeometry(1,12,8);
 const cylinder=new T.CylinderGeometry(1,1,1,8);
 const root=new T.Group();
 root.name='Bewohner des rechten Hauses';
 scene.add(root);
 function shape(parent,geometry,material,x,y,z,sx,sy,sz){
  const object=new T.Mesh(geometry,material);
  object.position.set(x,y,z);
  object.scale.set(sx,sy,sz);
  parent.add(object);
  return object;
 }
 function skeleton(body){
  const ball=(p,x,y,z,a,b,c,m=bone)=>shape(p,sphere,m,x,y,z,a,b,c);
  const bar=(p,x,y,z,r,h)=>shape(p,cylinder,bone,x,y,z,r,h,r);
  ball(body,0,1.58,0,.127,.139,.12);
  ball(body,0,1.485,.052,.087,.048,.078);
  for(const side of [-1,1])ball(body,side*.049,1.59,.105,.032,.031,.014,shadow);
  ball(body,0,1.55,.117,.017,.024,.01,shadow);
  bar(body,0,1.13,-.055,.029,.64);
  ball(body,0,.87,0,.132,.081,.077);
  for(let i=0;i<4;i++){
   const rib=shape(body,new T.TorusGeometry(.12-i*.008,.012,5,14),bone,0,1.33-i*.072,0,1,.66,1);
   rib.rotation.x=Math.PI*.5;
  }
  const pairs=[];
  for(const side of [-1,1]){
   const arm=new T.Group(),leg=new T.Group(),shin=new T.Group();
   arm.position.set(side*.17,1.34,0);
   arm.rotation.z=side*.12;
   bar(arm,0,-.147,0,.028,.30);
   ball(arm,0,-.30,0,.033,.033,.036);
   bar(arm,0,-.425,.025,.021,.25).rotation.x=-.19;
   ball(arm,0,-.565,.05,.028,.056,.026);
   leg.position.set(side*.092,.83,0);
   bar(leg,0,-.195,0,.036,.39);
   shin.position.y=-.39;
   ball(shin,0,0,0,.038,.037,.041);
   bar(shin,0,-.185,0,.026,.36);
   ball(shin,0,-.392,.055,.044,.035,.10);
   leg.add(shin);
   body.add(leg,arm);
   pairs.push({arm,leg,shin,side});
  }
  return gait=>{
   body.position.y=.022*Math.cos(gait*2);
   for(const {arm,leg,shin,side} of pairs){
    const stride=Math.sin(gait)*side;
    arm.rotation.x=-stride*.38;
    leg.rotation.x=stride*.38;
    shin.rotation.x=Math.max(0,-stride)*.54;
   }
  };
 }
 const shroud=new T.LatheGeometry([
  [.31,0],[.25,.25],[.235,.53],[.31,.77],[.34,.92],
  [.28,1.11],[.22,1.22],[.205,1.39],[.13,1.56],[0,1.61]
 ].map(([r,y])=>new T.Vector2(r,y)),24);
 const hem=shroud.attributes.position;
 for(let i=0;i<hem.count;i++){
  const angle=Math.atan2(hem.getX(i),hem.getZ(i));
  const fade=Math.max(0,1-hem.getY(i)/.76);
  hem.setY(i,hem.getY(i)+.10*Math.sin(angle*5)*fade);
 }
 shroud.computeVertexNormals();
 function ghost(body){
  shape(body,shroud,linen,0,0,0,1,1,1).renderOrder=3;
  for(const side of [-1,1]){
   shape(body,sphere,sockets,side*.073,1.32,.192,.027,.049,.016).renderOrder=2;
  }
  return phase=>{
   body.position.y=.24+.10*Math.sin(phase);
   body.rotation.z=.09*Math.sin(phase*.72);
  };
 }
 const routes=[
  [0,false,0,12.8,2,1],[0,true,10.5,12.5,.8,1.9],
  [0,false,-7.1,10.5,2.3,2.6],[0,true,-9.5,-4.2,.85,1.45],
  [0,false,9.7,2.9,1.4,.65],[0,true,0,-5.4,3,1.6],
  [1,false,0,9.8,1.8,2.5],[1,true,10.4,9.6,.9,2.4],
  [1,true,-6.5,0,3.5,4],[2,false,0,3.5,5,3.8],
  [2,true,7,-2,3,3.2],[2,false,-7,10,3,2.4],[2,true,-8,-4,2,2],
  [3,false,-4,3.5,4.8,3.4],[3,true,4,3.5,4.8,4]
 ];
 const actors=[];
 for(const [floor,floating,cx,cz,rx,rz] of routes){
  const y=levels[floor],x=axis+cx;
  const safe=(px,pz)=>surfaces.some(([l,r,n,f,h,contains])=>
   Math.abs(h-y)<.01&&px>=l&&px<=r&&pz>=n&&pz<=f&&(!contains||contains(px,pz)))&&
   !walls.some(([l,r,n,f,low,high])=>px+.43>l&&px-.43<r&&pz+.43>n&&pz-.43<f&&y+1.94>low&&y+.04<high);
  const clear=Array.from({length:120},(_,i)=>i*Math.PI/60).every(a=>safe(x+rx*Math.cos(a),cz+rz*Math.sin(a)));
  if(!clear)continue;
  const actor=new T.Group();
  actor.name=floating?'Schwebender Geist':'Patrouillierendes Skelett';
  const body=new T.Group();
  actor.add(body);
  root.add(actor);
  actors.push({actor,x,y,z:cz,rx,rz,floating,pose:floating?ghost(body):skeleton(body),phase:actors.length*1.73});
 }
 return (time,playerX,playerY)=>{
  root.visible=playerX>0&&Math.abs(playerX-axis)<30;
  for(const {actor,x,y,z,rx,rz,floating,pose,phase} of actors){
   actor.visible=Math.abs(playerY-y)<5.2;
   const angle=time*(floating?.29:.21)+phase;
   actor.position.set(x+rx*Math.cos(angle),y,z+rz*Math.sin(angle));
   actor.rotation.y=Math.atan2(-rx*Math.sin(angle),rz*Math.cos(angle));
   pose(time*(floating?1.6:4.8)+phase);
  }
 };
}
