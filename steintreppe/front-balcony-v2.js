export const balconyLevel=4.56;

export function addFrontBalcony(THREE,scene,mats,mesh,floor,x,z){
 const y=balconyLevel,front=z+1.96,back=z+.25,side=2.84;
 const iron=mats.steel.clone();
 iron.color.setHex(0x29231e);
 const stone=mats.dressedStone;
 function ornament(name,points,radius,material,segments=32){
  const curve=new THREE.CatmullRomCurve3(points);
  const detail=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,8,false),material);
  detail.name=name;
  detail.castShadow=detail.receiveShadow=true;
  scene.add(detail);
 }
 for(const [width,end,thickness,top] of [[5.94,2.015,.17,0],[5.88,1.98,.108,-.17],[5.71,1.90,.09,-.278]]){
  const half=width/2,r=.26;
  const outline=new THREE.Shape();
  outline.moveTo(-half,-.16);
  outline.lineTo(-half,-end+r);
  outline.quadraticCurveTo(-half,-end,-half+r,-end);
  outline.lineTo(half-r,-end);
  outline.quadraticCurveTo(half,-end,half,-end+r);
  outline.lineTo(half,-.16);
  outline.closePath();
  const deck=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:thickness,bevelEnabled:false,curveSegments:12}),stone);
  deck.name='Abgerundetes Balkongesims';
  deck.rotation.x=-Math.PI/2;
  deck.position.set(x,y+top-thickness,z);
  deck.castShadow=deck.receiveShadow=true;
  scene.add(deck);
 }
 mesh('Balkonschwelle',x,y-.048,z-.045,2.44,.096,.56,mats.stairStone);
 for(let i=-11;i<=11;i++){
  const points=Array.from({length:13},(_,j)=>{
   const t=Math.PI*j/12;
   return new THREE.Vector3(x+i*.237+.094*Math.cos(t),y-.195-.057*Math.sin(t),z+1.983);
  });
  const relief=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.012,5,false),mats.capitalFinish);
  relief.name='Bogenfries am Balkonrand';
  relief.receiveShadow=true;
  scene.add(relief);
 }
 floor(x-2.84,x+2.84,z+.16,front,y);
 for(const sign of [-1,1]){
  const cx=x+sign*2.22;
  mesh('Konsolenauflager',cx,y-.43,z+.78,.73,.14,1.19,stone);
  const shape=new THREE.Shape();
  shape.moveTo(.25,y-.47);
  shape.lineTo(1.31,y-.47);
  shape.bezierCurveTo(1.21,y-.69,.86,y-.77,.77,y-1.12);
  shape.bezierCurveTo(.70,y-1.43,.48,y-1.58,.25,y-1.53);
  shape.closePath();
  const support=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.48,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:3}),stone);
  support.name='Geschwungene Steinkonsole';
  // The profile is drawn in depth and height, then turned toward the facade.
  support.rotation.y=-Math.PI/2;
  support.position.set(cx+.24,0,z);
  support.castShadow=support.receiveShadow=true;
  scene.add(support);
  const edge=shape.curves.slice(1,3).flatMap((curve,i)=>curve.getPoints(18).slice(i===0?0:1));
  for(const rib of [-1,0,1]){
   const points=edge.map((point,i)=>new THREE.Vector3(
    cx+rib*(.05+.115*(1-i/(edge.length-1))),point.y+.012,z+point.x+.018
   ));
   ornament('Steinrippe der Konsole',points,rib===0?.038:.025,mats.capitalFinish,40);
  }
  const drop=new THREE.Mesh(new THREE.SphereGeometry(.092,12,10),stone);
  drop.position.set(cx,y-1.55,z+.38);
  drop.scale.set(1,1.22,.77);
  drop.castShadow=drop.receiveShadow=true;
  scene.add(drop);

 }
 const rounding=.25;
 const straight=side-rounding;
 for(const h of [.085,.967,1.045]){
  const rail=new THREE.Path();
  rail.moveTo(-side,back);
  rail.lineTo(-side,front-rounding);
  rail.quadraticCurveTo(-side,front,-straight,front);
  rail.lineTo(straight,front);
  rail.quadraticCurveTo(side,front,side,front-rounding);
  rail.lineTo(side,back);
  const curve=new THREE.CurvePath();
  for(const section of rail.curves){
   const points=section.getPoints(section.isLineCurve?1:8)
    .map(point=>new THREE.Vector3(x+point.x,y+h,point.y));
   curve.add(new THREE.CatmullRomCurve3(points));
  }
  const railing=new THREE.Mesh(new THREE.TubeGeometry(curve,96,h>1?.036:.021,8,false),iron);
  railing.name='Umlaufendes gerundetes Eisengeländer';
  railing.castShadow=true;
  scene.add(railing);
 }
 // Keep a continuous collision boundary behind the open ironwork.
 mesh('Balkonbegrenzung',x,y+1.04,front,2*side,.05,.06,iron,true).visible=false;
 for(const sign of [-1,1]){
  mesh('Seitliche Balkonbegrenzung',x+sign*side,y+1.04,(front+back)/2,.06,.05,front-back,iron,true).visible=false;
  for(let i=0;i<=7;i++){
   const pz=back+i*(front-back-rounding)/7;
   mesh('Seitlicher Geländerstab',x+sign*side,y+.53,pz,.027,1.02,.027,iron);
  }
  for(let i=1;i<=3;i++){
   const angle=Math.PI/2*i/3;
   mesh('Geländerstab im Eckbogen',x+sign*(straight+rounding*Math.cos(angle)),y+.53,
    front-rounding+rounding*Math.sin(angle),.027,1.02,.027,iron);
  }
 }
 for(let i=-11;i<=11;i++){
  if(Math.abs(i)<=2||Math.abs(i)>=9)continue;
  mesh('Geländerstab',x+i*.235,y+.53,front,.026,1.02,.026,iron);
 }
 for(const center of [-2.15,0,2.15])for(const sign of [-1,1]){
  for(const flip of [-1,1]){
   const points=Array.from({length:32},(_,i)=>{
    const t=i/31,angle=t*2.25*Math.PI;
    const radius=.225*(1-t)+.022;
    return new THREE.Vector3(x+center+sign*(.23-radius*Math.cos(angle)),
     y+.52+flip*(.235+radius*Math.sin(angle)),front);
   });
   ornament('Geschmiedete Doppelvolute',points,.016,iron,40);
  }
  mesh('Pfosten der Volute',x+center+sign*.49,y+.53,front,.026,1.02,.026,iron);
 }
}
