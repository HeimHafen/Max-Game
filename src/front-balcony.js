export const balconyLevel=4.56;
export const balconyHouse=-19.6;

export function addFrontBalcony(THREE,scene,mats,mesh,floor,x,z){
 const y=balconyLevel,front=z+1.96,back=z+.25,side=2.84;
 const iron=mats.steel.clone();
 iron.color.setHex(0x29231e);
 const stone=mats.dressedStone;
 for(const [offset,w,h,d] of [[-.085,5.94,.17,1.83],[-.215,5.83,.115,1.79],[-.312,5.62,.10,1.68]]){
  mesh('Profiliertes Balkongesims',x,y+offset,back+d/2-.09,w,h,d,stone);
 }
 mesh('Balkonschwelle',x,y-.048,z,2.44,.096,.62,mats.stairStone);
 for(let i=-11;i<=11;i++){
  const points=Array.from({length:13},(_,j)=>{
   const t=Math.PI*j/12;
   return new THREE.Vector3(x+i*.237+.094*Math.cos(t),y-.195-.057*Math.sin(t),z+1.951);
  });
  const relief=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.012,5,false),mats.capitalFinish);
  relief.name='Bogenfries am Balkonrand';
  relief.receiveShadow=true;
  scene.add(relief);
 }
 floor(x-2.97,x+2.97,z-.28,front+.10,y);
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
 }
 for(const h of [.08,.99,1.07]){
  mesh('Eisengeländer Front',x,y+h,front,2*side,.052,.064,iron,h===1.07);
  for(const sign of [-1,1]){
   mesh('Eisengeländer Rücklauf',x+sign*side,y+h,(front+back)/2,.062,.052,front-back,iron,h===1.07);
  }
 }
 for(let i=-12;i<=12;i++){
  const offset=i*.233;
  if(Math.abs(i)<3||Math.abs(i)>9)continue;
  mesh('Geländerstab',x+offset,y+.53,front,.028,.91,.028,iron);
 }
 for(const sign of [-1,1])for(let i=0;i<9;i++){
  const post=i===0||i===8;
  mesh('Seitlicher Geländerstab',x+sign*side,y+.55,back+i*(front-back)/8,post?.058:.028,1.10,post?.058:.028,iron);
 }
 for(const center of [-2.32,0,2.32]){
  for(const sign of [-1,1]){
   const points=[];
   for(let i=0;i<=48;i++){
    const t=i/48;
    const theta=t*Math.PI*2.05;
    const radius=.26*(1-t)+.028;
    points.push(new THREE.Vector3(x+center+sign*(.18+Math.cos(theta)*radius),y+.29+Math.sin(theta)*radius*.66+t*.51,front));
   }
   const scroll=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.021,7,false),iron);
   scroll.name='Geschmiedete Volute';
   scroll.castShadow=true;
   scene.add(scroll);
  }
 }
}
