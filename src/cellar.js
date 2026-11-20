
export const cellarLevel=-3.42;
export const cellarEntranceZ=-7.15;
const stairEnd=.15;
const stairHalf=1.23;
export const stairCenter=axis=>axis-Math.sign(axis)*7.4;
export const stairOpening=axis=>[stairCenter(axis)-stairHalf,stairCenter(axis)+stairHalf,cellarEntranceZ,stairEnd];

export function cutOpening(rect,opening){
 const [l,r,n,f]=rect;
 const [x1,x2,z1,z2]=opening;
 const a=Math.max(l,x1),b=Math.min(r,x2),c=Math.max(n,z1),d=Math.min(f,z2);
 if(a>=b||c>=d)return [rect];
 return [[l,a,n,f],[b,r,n,f],[a,b,n,c],[a,b,d,f]].filter(([u,v,w,t])=>u<v&&w<t);
}

export function addCellar(THREE,scene,mats,mesh,floor,axis){
 const left=stairCenter(-axis),right=stairCenter(axis),rear=stairEnd,front=3.5;
 const l=left-stairHalf,r=right+stairHalf;
 const masonry=mats.facadeWall,tiles=mats.stairStone;
 function slab(name,x1,x2,z1,z2,y,depth=.18){
  mesh(name,(x1+x2)/2,y-depth/2,(z1+z2)/2,x2-x1,depth,z2-z1,tiles);
  floor(x1,x2,z1,z2,y);
 }
 function wall(name,x,z,w,d,top=.02){
  mesh(name,x,(cellarLevel+top)/2,z,w,top-cellarLevel,d,masonry,true);
 }
 slab('Kellerflur mit Kalksteinboden',l,r,rear-.01,front,cellarLevel);
 wall('Südwand des Kellerflurs',0,front+.12,r-l+.48,.24);
 for(const [a,b] of [[l-.24,l],[left+stairHalf,right-stairHalf],[r,r+.24]]){
  wall('Nordwand des Kellerflurs',(a+b)/2,rear-.12,b-a,.24);
 }
 wall('Westwand des Kellerflurs',l-.12,(rear+front)/2,.24,front-rear);
 wall('Ostwand des Kellerflurs',r+.12,(rear+front)/2,.24,front-rear);
 mesh('Kalksteindecke im Keller',0,-.24,(rear+front)/2,r-l,.28,front-rear,masonry);
 for(const center of [left,right]){
  const count=20,run=(stairEnd-cellarEntranceZ)/count,rise=(.05-cellarLevel)/count;
  for(let i=0;i<count;i++){
   const start=cellarEntranceZ+i*run;
   slab('Kalksteinstufe',center-stairHalf,center+stairHalf,start-.001,start+run+.001,.05-(i+1)*rise,rise+.025);
  }
  for(const sign of [-1,1]){
   const x=center+sign*(stairHalf+.10),z=(cellarEntranceZ+stairEnd)/2;
   wall('Treppenwange',x,z,.20,stairEnd-cellarEntranceZ,1.02);
   mesh('Handlauf der Kelleröffnung',x,1.045,z,.25,.075,stairEnd-cellarEntranceZ,mats.trim);
  }
  mesh('Brüstung am Treppenende',center,.50,stairEnd+.10,2*stairHalf,.96,.20,masonry,true);
 }
 const glow=new THREE.MeshStandardMaterial({color:0xffe9c7,emissive:0xffc995,emissiveIntensity:.7});
 for(const x of [left,-9,0,9,right]){
  mesh('Kellerleuchte aus Opalglas',x,-.44,2.05,.40,.14,.40,glow).castShadow=false;
  const lamp=new THREE.PointLight(0xffdeba,29,9,2);
  lamp.position.set(x,-.61,2.05);
  scene.add(lamp);
 }
}
