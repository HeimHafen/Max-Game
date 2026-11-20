import {houseRear} from './house-layout.js';

export const cellarLevel=-3.42;
export const cellarEntranceZ=-7.15;
const stairEnd=.15;
const stairHalf=1.23;
const stepCount=20;
const stepRun=(stairEnd-cellarEntranceZ)/stepCount;
const stepRise=(.05-cellarLevel)/stepCount;
export const stairViewZ=cellarEntranceZ+6.5*stepRun;
export const stairViewY=.05-7*stepRise;
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
 const walnut=new THREE.MeshStandardMaterial({color:0x4c2918,roughness:.52});
 const ivory=new THREE.MeshStandardMaterial({color:0xe9d9bd,roughness:.64});
 const linen=new THREE.MeshStandardMaterial({color:0x777451,roughness:.93});
 const leaf=new THREE.MeshStandardMaterial({color:0x456047,roughness:.82});
 const petals=new THREE.MeshStandardMaterial({color:0xf3e8ca,roughness:.79});
 const rug=new THREE.MeshStandardMaterial({color:0x803f32,roughness:.96});
 const rugLine=new THREE.MeshStandardMaterial({color:0xbd9a67,roughness:.96});
 function detail(name,geometry,material,x,y,z){
  const item=new THREE.Mesh(geometry,material);
  item.name=name;item.position.set(x,y,z);
  item.castShadow=item.receiveShadow=true;
  scene.add(item);
  return item;
 }
 const brass=new THREE.MeshStandardMaterial({color:0x987043,metalness:.56,roughness:.34});
 const globe=new THREE.MeshStandardMaterial({color:0xffecd3,emissive:0xffd2a0,emissiveIntensity:.58});
 function rod(name,a,b,radius,material=brass){
  const delta=b.clone().sub(a);
  const item=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),16),material);
  item.name=name;
  item.position.copy(a).lerp(b,.5);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  scene.add(item);
 }
 function sconce(x,y,z,side){
  mesh('Messing-Wandplatte',x,y,z,.039,.30,.21,brass);
  const center=new THREE.Vector3(x+side*.18,y+.14,z);
  rod('Ausleger',new THREE.Vector3(x,y,z),center,.024);
  const shade=new THREE.Mesh(new THREE.SphereGeometry(.155,24,16),globe);
  shade.position.copy(center);
  shade.name='Opalglaskugel';
  scene.add(shade);
  const light=new THREE.PointLight(0xffdeb8,24,6,2);
  light.position.copy(center).x+=side*.15;
  scene.add(light);
 }
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
 function finishLanding(center){
  const portalZ=cellarEntranceZ-.02;
  const spring=2.48,crown=2.84,depth=.30;
  const arch=new THREE.Shape();
  arch.moveTo(-stairHalf,spring);
  arch.quadraticCurveTo(0,2*crown-spring,stairHalf,spring);
  arch.lineTo(stairHalf+.19,crown+.26);
  arch.lineTo(-stairHalf-.19,crown+.26);
  arch.closePath();
  detail('Flacher Kalksteinbogen',new THREE.ExtrudeGeometry(arch,{
   depth,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:24
  }),mats.dressedStone,center,0,portalZ-depth/2);
  for(const sign of [-1,1]){
   const x=center+sign*(stairHalf+.10);
   mesh('Pfeiler des Treppenbogens',x,1.32,portalZ,.23,2.64,.36,mats.dressedStone,true);
   mesh('Profilierter Kämpfer',x,2.46,portalZ,.31,.115,.42,mats.trim);
   mesh('Pfeilersockel',x,.17,portalZ,.34,.25,.42,mats.trim);
  }

  const axis=center+Math.sign(center)*7.4;
  for(const offset of [-9.3,-4.65,4.65,9.3]){
   const x=axis+offset;
   for(const sign of [-1,1]){
    mesh('Innengewände am Fenster',x+sign*.97,2.23,houseRear+.30,.19,2.47,.15,mats.trim);
    mesh('Kapitell am Fenster',x+sign*.97,3.40,houseRear+.36,.29,.17,.20,mats.dressedStone);
   }
   mesh('Fenstergesims innen',x,3.57,houseRear+.36,2.28,.17,.29,mats.trim);
   mesh('Fensterbank innen',x,.97,houseRear+.38,2.14,.11,.31,mats.trim);
  }
  const runnerZ=cellarEntranceZ-.68;
  mesh('Roter Läufer am Treppenpodest',center,.074,runnerZ,3.45,.018,.93,rug);
  for(const side of [-1,1]){
   mesh('Webkante des Läufers',center,.084,runnerZ+side*.40,3.34,.003,.023,rugLine);
   mesh('Webkante des Läufers',center+side*1.64,.084,runnerZ,.023,.003,.80,rugLine);
  }
  const tableX=center+.68,tableZ=houseRear+.59;
  mesh('Nussbaumkonsole',tableX,.84,tableZ,1.12,.115,.38,walnut,true);
  mesh('Geschnitzte Tischzarge',tableX,.76,tableZ,1.01,.13,.31,walnut,true);
  for(const dx of [-.43,.43])for(const dz of [-.12,.12]){
   detail('Gedrechseltes Konsolenbein',new THREE.LatheGeometry([
    new THREE.Vector2(.033,0),new THREE.Vector2(.042,.09),new THREE.Vector2(.024,.18),
    new THREE.Vector2(.046,.59),new THREE.Vector2(.062,.67)
   ],16),walnut,tableX+dx,.05,tableZ+dz);
  }
  detail('Klassische Keramikurne',new THREE.LatheGeometry([
   new THREE.Vector2(.10,0),new THREE.Vector2(.07,.055),new THREE.Vector2(.14,.12),
   new THREE.Vector2(.135,.20),new THREE.Vector2(.075,.26),new THREE.Vector2(.10,.29)
  ],24),ivory,tableX-.11,.9,tableZ);
  for(let i=0;i<12;i++){
   const angle=i*2.4, radius=.08+.10*(i%3)/2;
   const x=tableX-.11+Math.cos(angle)*radius,z=tableZ+Math.sin(angle)*radius;
   const y=1.25+.045*(i%4);
   const foliage=detail('Grünes Blatt',new THREE.SphereGeometry(.085,10,8),leaf,x,1.24,z);
   foliage.scale.set(1,.42,.47);foliage.rotation.y=angle;
   detail('Hortensienblüte',new THREE.IcosahedronGeometry(.064,1),petals,x,y,z);
  }
  for(let i=0;i<3;i++)mesh('Buch auf der Konsole',tableX+.30,.91+i*.039,tableZ,.215,.035,.14,i===1?ivory:rug);

  const pictureX=center-1.72,pictureZ=houseRear+.337;
  mesh('Gerahmte Landschaft',pictureX,1.91,pictureZ,.92,.77,.035,walnut);
  for(const side of [-1,1]){
   mesh('Vergoldete Rahmenleiste',pictureX+side*.459,1.91,pictureZ+.02,.052,.80,.05,brass);
   mesh('Vergoldete Rahmenleiste',pictureX,1.91+side*.38,pictureZ+.02,.92,.052,.05,brass);
  }
  const picture=new THREE.MeshStandardMaterial({color:0xc6a77a,roughness:.91});
  mesh('Malgrund',pictureX,1.91,pictureZ+.025,.86,.71,.012,picture);
  const hills=new THREE.Shape();
  hills.moveTo(-.425,-.35);hills.lineTo(-.425,.01);
  hills.quadraticCurveTo(-.24,.19,-.06,.045);
  hills.quadraticCurveTo(.19,-.065,.425,.093);
  hills.lineTo(.425,-.35);hills.closePath();
  detail('Gemalte Hügellandschaft',new THREE.ShapeGeometry(hills),leaf,pictureX,1.91,pictureZ+.033);

  const chairX=center-1.72,chairZ=houseRear+.79;
  mesh('Nussbaumrahmen des Sessels',chairX,.50,chairZ,.63,.10,.59,walnut,true);
  detail('Grünes Sitzpolster',new THREE.SphereGeometry(.35,24,12),linen,chairX,.56,chairZ).scale.set(.91,.23,.86);
  mesh('Gepolsterte Rückenlehne',chairX,.89,chairZ-.24,.59,.66,.12,walnut);
  detail('Rückenpolster',new THREE.SphereGeometry(.31,24,12),linen,chairX,.94,chairZ-.16).scale.set(.81,1,.22);
  for(const dx of [-.25,.25]){
   mesh('Armlehne',chairX+dx,.75,chairZ,.065,.06,.56,walnut);
   for(const dz of [-.21,.21]){
    detail('Sesselbein',new THREE.CylinderGeometry(.033,.021,.42,12),walnut,chairX+dx,.26,chairZ+dz);
    detail('Armstütze',new THREE.CylinderGeometry(.025,.030,.23,12),walnut,chairX+dx,.63,chairZ+dz);
   }
  }
 }
 for(const center of [left,right]){
  finishLanding(center);
  // The upper floor is a thin slab. Close its exposed edge down to the stair foundation.
  const landingBase=cellarLevel-.18;
  mesh('Geschlossener Anschluss unter dem oberen Podest',center,(landingBase+.05)/2,
   cellarEntranceZ-.12,2*stairHalf,.05-landingBase,.24,tiles);
  for(let i=0;i<stepCount;i++){
   const start=cellarEntranceZ+i*stepRun;
   const tread=.05-(i+1)*stepRise;
   slab('Massive Kalksteinstufe',center-stairHalf,center+stairHalf,start-.001,start+stepRun+.001,tread,tread-landingBase);
   // Low, recessed edge detail stays below the walking surface.
   mesh('Profilierte Stufenkante',center,tread-.023,start+stepRun-.009,2*stairHalf-.018,.035,.035,mats.trim);
  }
  for(const sign of [-1,1]){
   const x=center+sign*(stairHalf+.10);
   const upperEnd=cellarEntranceZ+2.9;
   wall('Kalksteinwand der oberen Treppe',x,(cellarEntranceZ+upperEnd)/2,.20,upperEnd-cellarEntranceZ,3.12);
   wall('Treppenwange',x,(upperEnd+stairEnd)/2,.20,stairEnd-upperEnd,1.02);
   mesh('Kalksteinabdeckung der Brüstung',x,1.045,(upperEnd+stairEnd)/2,.25,.075,stairEnd-upperEnd,mats.trim);
   const railX=center+sign*(stairHalf-.12);
   const highZ=cellarEntranceZ+.18,lowZ=stairEnd-.22;
   const railY=at=>.86+(.05-cellarLevel)*(stairEnd-at)/(stairEnd-cellarEntranceZ)+cellarLevel;
   rod('Durchgehender Messinghandlauf',new THREE.Vector3(railX,railY(highZ),highZ),new THREE.Vector3(railX,railY(lowZ),lowZ),.035);
   for(const at of [highZ,lowZ]){
    detail('Gedrehter Messingknauf',new THREE.SphereGeometry(.061,18,12),brass,railX,railY(at),at);
   }
   for(let j=0;j<5;j++){
    const at=highZ+(lowZ-highZ)*j/4;
    rod('Messingkonsole des Handlaufs',new THREE.Vector3(x-sign*.10,railY(at)-.055,at),new THREE.Vector3(railX,railY(at),at),.017);
   }
  }
  for(const z of [cellarEntranceZ+1.3,stairEnd-1.35]){
   const stepY=cellarLevel+(.05-cellarLevel)*(stairEnd-z)/(stairEnd-cellarEntranceZ);
   for(const side of [-1,1])sconce(center+side*(stairHalf-.018),stepY+1.43,z,-side);
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
