export const stairOpening=[2.5,8.78,6.48,13.34];

export function addGalleryStair(THREE,scene,mats,mesh,floor,cx,level){
 const [left,right,rear,front]=stairOpening;
 const centerZ=12.6,inner=3.45,outer=5.85,angle=Math.PI/2;
 const steps=26,base=.05,rise=(level-base)/steps,going=angle/steps;
 const stone=mats.stairStone.clone();
 stone.color.setHex(0xf6ead8);
 if(stone.normalScale)stone.normalScale.multiplyScalar(.4);
 const plaster=new THREE.MeshStandardMaterial({color:0xece0cf,roughness:.84});
 const iron=new THREE.MeshStandardMaterial({color:0x211b18,metalness:.7,roughness:.38});
 const oak=new THREE.MeshStandardMaterial({color:0x84502c,roughness:.42});
 const point=(r,t,y)=>new THREE.Vector3(cx+left+r*Math.cos(t),y,centerZ-r*Math.sin(t));
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
 const masonry=[],underside=[];
 function quad(target,a,b,c,d){
  for(const p of [a,b,c,a,c,d])target.push(p.x,p.y,p.z);
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
  path('Gerundete Steinkante',[outer-.013,(inner+outer)/2,inner+.013].map(r=>point(r,a-.002,y-.019)),.021,stone);
  floor(cx+left,cx+left+outer,centerZ-outer,centerZ,y,(x,z)=>{
   const dx=x-cx-left,dz=centerZ-z;
   const theta=Math.atan2(dz,dx),radius=Math.hypot(dx,dz);
   return theta>=a-1e-9&&theta<=b+1e-9&&radius>=inner&&radius<=outer;
  });
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
  post(point(r,0,base),1.11,.095);
  post(point(r,angle,level),1.11,.095);
  const panels=11;
  for(let i=0;i<panels;i++){
   const t=(i+.5)/panels;
   const y=base+(level-base)*t;
   post(point(r,t*angle,y-.028),.96,.02);
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
 for(const [x1,z1,x2,z2] of [[left,rear,right,rear],[left,front,right,front],[right,rear,right,front],[left,rear,left,exitRear],[left,exitFront,left,front]]){
  const length=Math.hypot(x2-x1,z2-z1),alongX=z1===z2;
  if(length<.05)continue;
  const x=cx+(x1+x2)/2,z=(z1+z2)/2;
  mesh('Profiliertes Galeriegesims',x,level-.155,z,alongX?length:.13,.087,alongX?.13:length,plaster);
  mesh('Unteres Galerieprofil',x,level-.208,z,alongX?length:.093,.028,alongX?.093:length,plaster);
  mesh('Galeriehandlauf',x,level+.97,z,alongX?length:.07,.065,alongX?.07:length,oak);
  mesh('Galeriebrüstung Kollision',x,level+.51,z,alongX?length:.05,1.02,alongX?.05:length,iron,true).visible=false;
  const count=Math.ceil(length/.14);
  for(let i=0;i<=count;i++)post(new THREE.Vector3(cx+x1+(x2-x1)*i/count,level,z1+(z2-z1)*i/count),.96,.024);
 }
 const light=new THREE.PointLight(0xffe6cc,48,13,2);
 light.position.set(cx+5,7.1,8);
 scene.add(light);
}
