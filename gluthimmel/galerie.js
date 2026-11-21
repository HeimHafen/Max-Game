export const stairOpening=[2.70,8.90,6.48,13.34];

export function addGalleryStair(THREE,scene,mats,mesh,floor,cx,level){
 const [left,right,rear,front]=stairOpening;
 const centerZ=12.6,inner=3.45,outer=5.85,angle=Math.PI/2;
 const steps=26,base=.05,rise=(level-base)/steps,going=angle/steps;
 const stone=mats.stairStone.clone();
 stone.color.setHex(0xd7c9b5);
 stone.roughness=.77;
 if(stone.normalScale)stone.normalScale.multiplyScalar(.32);
 const plaster=new THREE.MeshStandardMaterial({color:0xeee5d7,roughness:.84});
 const iron=new THREE.MeshStandardMaterial({color:0x211b18,metalness:.7,roughness:.38});
 const bronze=new THREE.MeshStandardMaterial({color:0x8a633a,metalness:.67,roughness:.41});
 const oak=new THREE.MeshStandardMaterial({color:0x875a38,roughness:.42});
 const pivot=cx+right-(inner+outer)/2;
 const turn=Math.PI*42/180;
 function rotateEntry(x,z,rotation){
  const dx=x-pivot,dz=z-centerZ;
  return [pivot+dx*Math.cos(rotation)-dz*Math.sin(rotation),
   centerZ+dx*Math.sin(rotation)+dz*Math.cos(rotation)];
 }
 function point(r,t,y){
  const blend=1-THREE.MathUtils.smoothstep(t,0,1.30);
  const [x,z]=rotateEntry(cx+right-r*Math.cos(t),centerZ-r*Math.sin(t),turn*blend);
  return new THREE.Vector3(x,y,z);
 }
 function stairSurface(outline,y){
  const xs=outline.map(p=>p.x),zs=outline.map(p=>p.z);
  floor(Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs),y,(x,z)=>{
   let inside=false;
   for(let i=0,j=outline.length-1;i<outline.length;j=i++){
    const a=outline[i],b=outline[j];
    if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
   }
   return inside;
  });
 }
 function path(name,points,radius,material){
  const curve=new THREE.CatmullRomCurve3(points);
  const item=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(10,points.length*2),radius,6,false),material);
  item.name=name;
  item.castShadow=true;
  scene.add(item);
 }
 function post(p,h,size){
  const profile=[[0,0],[size,0],[size,.06],[size*.64,.14],[size*.55,.68],[size*.78,.83],[size,.92],[size*.58,1],[0,1]];
  const item=new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r,v])=>new THREE.Vector2(r,v*h)),12),iron);
  item.position.copy(p);
  item.castShadow=true;
  scene.add(item);
 }
 const stairLeft=cx+right-outer,stairRight=cx+right-inner;
 const middle=(stairLeft+stairRight)/2;
 const apron=new THREE.Shape();
 apron.moveTo(stairLeft,-centerZ);
 apron.lineTo(stairRight,-centerZ);
 apron.bezierCurveTo(stairRight+.27,-centerZ-.10,stairRight+.22,-centerZ-.36,stairRight-.03,-centerZ-.44);
 apron.quadraticCurveTo(middle,-centerZ-.68,stairLeft+.03,-centerZ-.44);
 apron.bezierCurveTo(stairLeft-.22,-centerZ-.36,stairLeft-.27,-centerZ-.10,stairLeft,-centerZ);
 const entryOutline=apron.getPoints(20).map(p=>{
  const [x,z]=rotateEntry(p.x,-p.y,turn);
  return new THREE.Vector3(x,0,z);
 });
 const entryShape=new THREE.Shape(entryOutline.map(p=>new THREE.Vector2(p.x,-p.z)));
 const entryStep=new THREE.Mesh(new THREE.ExtrudeGeometry(entryShape,{
  depth:rise-.024,bevelEnabled:true,bevelThickness:.012,bevelSize:.014,bevelSegments:3,curveSegments:18
 }),stone);
 entryStep.name='Gerundeter Steinantritt';
 entryStep.rotation.x=-Math.PI/2;
 entryStep.position.y=base+.012;
 entryStep.castShadow=true;
 entryStep.receiveShadow=true;
 scene.add(entryStep);
 stairSurface(entryOutline,base+rise);
 const masonry=[],underside=[];
 function quad(target,a,b,c,d){
  for(const p of [a,c,b,a,d,c])target.push(p.x,p.y,p.z);
 }
 const lower=t=>Math.max(base,base+(level-base)*t/angle-.19);
 for(let i=0;i<steps;i++){
  const a=i*going,b=(i+1)*going,y=base+(i+1)*rise;
  for(let segment=0;segment<4;segment++){
   const u=a+(b-a)*segment/4,v=a+(b-a)*(segment+1)/4;
   const lt=point(inner,u,y),rt=point(outer,u,y),nt=point(inner,v,y),ft=point(outer,v,y);
   const lb=point(inner,u,lower(u)),rb=point(outer,u,lower(u));
   const nb=point(inner,v,lower(v)),fb=point(outer,v,lower(v));
   quad(masonry,lt,rt,ft,nt);
   quad(masonry,lb,lt,nt,nb);
   quad(masonry,rt,rb,fb,ft);
   quad(underside,rb,lb,nb,fb);
  }
  const previous=i===0?base:y-rise;
  quad(masonry,point(outer,a,previous),point(outer,a,y),point(inner,a,y),point(inner,a,previous));
  if(i>0)path('Gerundete Steinkante',[outer-.013,(inner+outer)/2,inner+.013].map(r=>point(r,a-.002,y-.019)),.021,stone);
  const fractions=[0,.25,.5,.75,1];
  stairSurface([
   ...fractions.map(t=>point(inner,a+(b-a)*t,y)),
   ...fractions.slice().reverse().map(t=>point(outer,a+(b-a)*t,y))
  ],y);
 }
 const landingBottom=lower(angle);
 quad(masonry,point(inner,angle,landingBottom),point(inner,angle,level),
  point(outer,angle,level),point(outer,angle,landingBottom));
 function skin(name,vertices,material){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  const uv=[];
  for(let i=0;i<vertices.length;i+=3)uv.push((vertices[i]+vertices[i+2])*.42,(vertices[i+1]+vertices[i+2])*.42);
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.computeVertexNormals();
  const item=new THREE.Mesh(geometry,material);
  item.name=name;
  item.castShadow=true;
  scene.add(item);
 }
 stone.side=plaster.side=THREE.DoubleSide;
 skin('Steinlauf mit geschlossenen Setzstufen',masonry,stone);
 skin('Fugenlose helle Treppenuntersicht',underside,plaster);
 for(const r of [inner+.045,outer-.045]){
  const samples=Array.from({length:37},(_,i)=>i/36);
  for(const [h,size,material,name] of [[.97,.048,oak,'Geschwungener Holzhandlauf'],[.21,.017,iron,'Untergurt aus Schmiedeeisen']]){
   path(name,samples.map(t=>point(r,t*angle,base+(level-base)*t+h)),size,material);
  }
  const newel=point(r,0,base+rise);
  post(newel,.98,.092);
  const finial=new THREE.Mesh(new THREE.SphereGeometry(.068,16,12),iron);
  finial.position.copy(newel).add(new THREE.Vector3(0,1.034,0));
  finial.scale.y=1.28;
  scene.add(finial);
  post(point(r,angle,level),1.11,.095);
  path('Steinprofil an der geschwungenen Wange',samples.map(t=>{
   const sign=r<(inner+outer)/2?-1:1;
   return point(r+sign*.052,t*angle,lower(t*angle)+.055);
  }),.027,stone);
  const collar=new THREE.Mesh(new THREE.CylinderGeometry(.074,.084,.045,20),bronze);
  collar.position.copy(newel).add(new THREE.Vector3(0,.92,0));
  scene.add(collar);
  const panels=13;
  for(let i=0;i<panels;i++){
   const t=(i+.5)/panels;
   const y=base+(level-base)*t;
   const treadY=base+(Math.floor(t*steps)+1)*rise;
   post(point(r,t*angle,treadY),y+.94-treadY,.021);
   for(const sign of [-1,1]){
    const scroll=Array.from({length:19},(_,j)=>{
     const u=j/18,arc=u*Math.PI*2.45,scale=1-.79*u;
     return point(r,t*angle+sign*(.029+.041*scale*Math.cos(arc)),y+(sign>0?.69:.40)+.22*scale*Math.sin(arc));
    });
    path('Schmiedeeiserne Volute',scroll,.010,iron);
   }
  }
 }
 const exitRear=centerZ-outer,exitFront=centerZ-inner;
 for(const [x1,z1,x2,z2] of [[left,rear,right,rear],[left,front,right,front],[left,rear,left,front],[right,rear,right,exitRear],[right,exitFront,right,front]]){
  const length=Math.hypot(x2-x1,z2-z1),alongX=z1===z2;
  if(length<.05)continue;
  const x=cx+(x1+x2)/2,z=(z1+z2)/2;
  mesh('Profiliertes Galeriegesims',x,level-.155,z,alongX?length:.13,.087,alongX?.13:length,plaster);
  mesh('Unteres Galerieprofil',x,level-.208,z,alongX?length:.093,.028,alongX?.093:length,plaster);
  mesh('Galeriehandlauf',x,level+.97,z,alongX?length:.07,.065,alongX?.07:length,oak);
  mesh('Galeriebrüstung Kollision',x,level+.51,z,alongX?length:.05,1.02,alongX?.05:length,iron,true).visible=false;
  const count=Math.ceil(length/.46);
  const at=(t,h)=>new THREE.Vector3(cx+x1+(x2-x1)*t,level+h,z1+(z2-z1)*t);
  path('Untergurt der Galerie',[at(0,.17),at(.5,.17),at(1,.17)],.016,iron);
  for(let i=0;i<=count;i++)post(at(i/count,0),.94,.022);
  for(let i=0;i<count;i++){
   for(const sign of [-1,1]){
    const scroll=Array.from({length:17},(_,j)=>{
     const u=j/16,arc=u*Math.PI*2.28,shrink=1-.77*u;
     return at((i+.5+sign*(.16+.26*shrink*Math.cos(arc)))/count,.54+sign*.13+.19*shrink*Math.sin(arc));
    });
    path('Volute der Galerie',scroll,.009,iron);
   }
  }
 }
 const light=new THREE.PointLight(0xffefdc,40,13,2);
 light.position.set(cx+5,7.1,8);
 scene.add(light);
 const fill=new THREE.PointLight(0xfff0dc,25,8,2);
 fill.position.set(cx+4,3.1,13.9);
 scene.add(fill);
}
