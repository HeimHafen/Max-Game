import {rearPartition,terraceRoomHalf} from './house-layout.js';

export function addReferenceRoom(T,scene,axis,walls){
 const room=new T.Group();
 room.name='Wohnzimmer nach Fotovorlage';
 room.position.set(axis+terraceRoomHalf+.13,.05,-8.52);
 scene.add(room);
 const width=5.43,length=rearPartition-.115-room.position.z,ceiling=2.78;
 const material=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
 const blue=material(0x063a96),white=material(0xe7e2de),trim=material(0xf0ebe2);
 const coal=material(0x232429),black=material(0x101317,.46),glass=material(0x15232d,.19);
 const canvas=material(0xd9d9d3),chair=material(0x847c72),lime=material(0xbfe32d);
 const wood=material(0xad7a44),brass=material(0x947448,.37),leaf=material(0x2d592c);
 const pots=[material(0x312451),material(0x93634b),material(0xb0a499),material(0x302e38)];
 const lamp=new T.MeshBasicMaterial({color:0xfff3d9});
 const boxGeometry=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,14,10);
 const cylinder=new T.CylinderGeometry(1,1,1,16);
 let seed=447;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

 function mesh(name,geometry,mat,x,y,z,sx,sy,sz,parent=room){
  const m=new T.Mesh(geometry,mat);
  m.name=name;
  m.position.set(x,y,z);
  m.scale.set(sx,sy,sz);
  m.receiveShadow=true;
  parent.add(m);
  return m;
 }
 const box=(name,m,x,y,z,a,b,c,p)=>mesh(name,boxGeometry,m,x,y,z,a,b,c,p);
 const oval=(name,m,x,y,z,a,b,c,p)=>mesh(name,sphere,m,x,y,z,a,b,c,p);
 function collide(x,z,w,d,h){
  const px=room.position.x+x,pz=room.position.z+z;
  walls.push([px-w/2,px+w/2,pz-d/2,pz+d/2,room.position.y,room.position.y+h]);
 }
 function texture(w,h,paint){
  const c=document.createElement('canvas');
  c.width=w;c.height=h;
  paint(c.getContext('2d'),w,h);
  const map=new T.CanvasTexture(c);
  map.colorSpace=T.SRGBColorSpace;
  map.anisotropy=8;
  return map;
 }
 const flooring=material(0xffffff,.69);
 flooring.map=texture(768,1152,(g,w,h)=>{
  for(let i=0;i<28;i++){
   const x=i*w/28,pw=w/28;
   let y=-random()*260;
   while(y<h){
    const plank=165+random()*315,tone=random()*22;
    g.fillStyle=`rgb(${192+tone} ${142+tone} ${86+tone})`;
    g.fillRect(x,y,pw+.3,plank+.5);
    for(let j=0;j<22;j++){
     const u=x+random()*pw;
     g.strokeStyle=random()<.65?'rgba(91,49,21,.14)':'rgba(255,237,188,.29)';
     g.beginPath();g.moveTo(u,y);g.bezierCurveTo(u+3,y+plank*.34,u-3,y+plank*.6,u+1,y+plank);g.stroke();
    }
    g.fillStyle='rgba(78,49,31,.32)';g.fillRect(x,y,pw,1);
    y+=plank;
   }
   g.fillStyle='rgba(95,67,38,.20)';g.fillRect(x,0,1,h);
  }
 });
 const floor=mesh('Eiche, längs verlegt',new T.PlaneGeometry(width,length),flooring,width/2,.027,length/2,1,1,1);
 floor.rotation.x=-Math.PI/2;
 box('Blaue Längswand',blue,.01,ceiling/2,length/2,.038,ceiling,length);
 box('Weiße Längswand',white,width-.014,ceiling/2,length/2,.046,ceiling,length);
 collide(.01,length/2,.044,length,ceiling);
 collide(width-.014,length/2,.046,length,ceiling);
 collide(width/2,0,width,.08,ceiling);
 box('Weiße Decke',trim,width/2,ceiling+.035,length/2,width+.05,.08,length);
 for(let x=.19;x<width;x+=.26)box('Fuge der weißen Deckenpaneele',white,x,ceiling-.006,length/2,.004,.004,length);
 for(const x of [.04,width-.04]){
  box('Weiße Abschlussleiste',trim,x,ceiling-.044,length/2,.08,.083,length);
  box('Weiße Sockelleiste',trim,x,.052,length/2,.052,.104,length);
 }
 box('Sturz über der Fensterfront',white,width/2,2.61,.006,width,.29,.17);
 const bays=[.04,.71,2.66,4.14,width-.04];
 for(let i=0;i<bays.length-1;i++){
  const l=bays[i],r=bays[i+1],x=(l+r)/2,w=r-l;
  box('Dunkle Verglasung',glass,x,1.23,.018,w,2.45,.055);
  const bottom=[1.52,1.31,.42,1.19][i],top=2.43;
  box(i===1?'Schwarzes Rollo':'Dunkle Jalousie',coal,x,(top+bottom)/2,.096,w-.06,top-bottom,.044);
  if(i!==1){
   for(let y=bottom+.026;y<top;y+=.044)box('Lamelle',black,x,y,.128,w-.058,.008,.016);
  }else{
   for(let k=0;k<12;k++)box('Unterkante des Rollos',black,l+.09+k*(w-.17)/11,bottom-.018,.098,.05,.043,.043);
  }
 }
 for(const x of bays)box('Weißer Fensterpfosten',trim,x,1.24,.1,.063,2.48,.104);
 for(const y of [.05,2.45])box('Waagerechter Fensterrahmen',trim,width/2,y,.1,width,.072,.10);

 const rugMat=material(0xffffff);
 rugMat.map=texture(384,512,(g,w,h)=>{
  g.fillStyle='#c2c4c3';g.fillRect(0,0,w,h);
  for(let y=-40;y<h;y+=28)for(let x=-24;x<w;x+=24){
   g.strokeStyle=(x+y)%3?'#d7d9d7':'#aeb3b4';g.lineWidth=5;
   g.beginPath();g.moveTo(x,y);g.lineTo(x+12,y+10);g.lineTo(x+24,y);g.stroke();
  }
 });
 function rug(x,z,w,d,mat){
  const m=mesh('Teppich',new T.PlaneGeometry(w,d),mat,x,.033,z,1,1,1);
  m.rotation.x=-Math.PI/2;
 }
 rug(1.35,6.48,2.62,5.31,rugMat);
 rug(2.14,2.11,2.75,2.02,material(0xcbd8cf));

 function seat(name,x,z,rotation,mat,low=false){
  const group=new T.Group();
  group.position.set(x,.043,z);group.rotation.y=rotation;room.add(group);
  const seatY=low?.40:.47,w=low?.54:.78,d=low?.50:.70;
  box(name,mat,0,seatY,0,w,.092,d,group);
  oval('Geformte Rückenlehne',mat,0,seatY+.30,-d*.47,w*.54,.36,.068,group).rotation.x=-.14;
  for(const a of [-1,1])for(const b of [-1,1]){
   const leg=box('Stuhlbein',low?black:wood,a*w*.40,seatY*.47,b*d*.38,.043,seatY,.045,group);
   leg.rotation.z=a*.14;leg.rotation.x=-b*.12;
  }
  collide(x,z,low?.62:.85,low?.62:.85,.86);
  return group;
 }
 const easy=seat('Grauer Sessel',1.87,4.45,-.99,chair);
 const second=seat('Heller Sessel',1.17,5.60,-1.47,chair);
 oval('Grünes Kissen',lime,.02,.72,-.25,.27,.237,.086,easy).rotation.z=.17;
 oval('Helle Decke',canvas,-.04,.58,.016,.39,.11,.35,easy);
 oval('Weißer Überwurf',canvas,.014,.75,-.27,.38,.33,.11,second);
 box('Herabhängender Überwurf',canvas,.28,.31,.19,.14,.46,.33,second);
 seat('Schwarzer Besucherstuhl',1.95,7.37,-1.89,coal,true);

 box('Schwarzer niedriger Tisch',black,.49,.52,6.54,.95,.055,2.43);
 box('Tischunterbau',coal,.49,.27,6.54,.83,.43,2.24);
 collide(.49,6.54,.97,2.43,.56);
 for(let i=0;i<14;i++){
  const x=.20+random()*.58,z=5.47+random()*2.04,h=.05+random()*.14;
  const mat=[trim,glass,brass,black][i%4];
  mesh('Tischobjekt',cylinder,mat,x,.55+h/2,z,.025+random()*.034,h,.044);
 }
 const bottle=material(0x44788b,.24);
 mesh('Wasserflasche',cylinder,bottle,2.36,.15,7.16,.043,.24,.043);
 mesh('Flaschenverschluss',cylinder,blue,2.36,.28,7.16,.026,.035,.026);
 box('Arbeitsplatte am Fenster',wood,1.42,.86,.91,2.30,.064,.65);
 box('Weißer Unterschrank',trim,1.82,.43,.92,.72,.85,.60);
 collide(1.42,.92,2.30,.65,.90);
 for(let i=0;i<8;i++)box('Bücher und Schachteln',i%2?trim:wood,1.11+(i%3)*.28,.91+Math.floor(i/3)*.054,.90,.27,.048,.17);
 const red=material(0xb8363d);
 oval('Rote Gießkanne',red,3.26,.16,1.76,.16,.17,.11);
 const spout=mesh('Ausguss',cylinder,red,3.40,.26,1.76,.027,.24,.027);
 spout.rotation.z=-.57;

 function plant(x,z,height,spread,mat,style){
  const potH=.23+height*.074,potR=.15+spread*.11;
  const pot=new T.CylinderGeometry(potR,potR*.72,potH,18);
  mesh('Pflanztopf',pot,mat,x,potH*.5+.028,z,1,1,1);
  mesh('Pflanzerde',cylinder,shadowSoil,x,potH+.022,z,potR*.93,.023,potR*.93);
  collide(x,z,potR*2,potR*2,potH);
  for(let i=0;i<3;i++){
   const ty=height*(.71+i*.105);
   mesh('Pflanzenstamm',cylinder,wood,x+(i-1)*.048,ty/2+potH/2,z,.012,ty-potH,.012);
  }
  for(let i=0;i<(style?23:31);i++){
   const base=height*(.44+random()*.53),angle=i*2.399;
   const dx=Math.cos(angle),dz=Math.sin(angle),reach=spread*(.44+random()*.42);
   const geometry=style?strap:broad;
   const material=leafTones[i%leafTones.length];
   const blade=mesh('Blatt',geometry,material,x,base,z,reach,reach,reach);
   blade.rotation.y=-angle;
   if(!style)blade.rotation.z=(random()-.5)*.66;
   if(style&&i%4===0){
    const stem=mesh('Seitentrieb',cylinder,wood,x+dx*.13,base-.12,z+dz*.13,.005,.28,.005);
    stem.rotation.z=-dx*.65;stem.rotation.x=dz*.65;
   }
  }
 }
 function bladeGeometry(outline){
  const positions=[];
  for(const [x,y,w] of outline)positions.push(x,y,-w,x,y,w);
  const indices=[];
  for(let i=0;i<outline.length-1;i++){const a=2*i;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
 }
 const broad=bladeGeometry([[0,0,.005],[.27,.11,.13],[.61,.09,.18],[.83,.02,.12],[1,-.09,0]]);
 const strap=bladeGeometry([[0,0,.018],[.26,.39,.038],[.55,.40,.04],[.81,.22,.031],[1,-.25,0]]);
 const shadowSoil=material(0x312821);
 const leafTones=[leaf,material(0x3e6b35),material(0x5a7b3d),material(0x254c32)];
 for(const mat of leafTones)mat.side=T.DoubleSide;
 for(const [x,z,h,s,p,type] of [
  [.37,.81,2.34,.59,2,1],[2.86,2.05,2.05,.63,0,0],[4.63,1.27,2.42,.8,1,1],
  [4.90,2.63,2.28,.7,1,1],[4.56,3.46,1.13,.66,2,0],[4.84,4.63,1.43,.84,1,0],
  [5.02,6.74,1.15,.66,0,0],[.36,8.86,1.39,.55,2,1]
 ])plant(x,z,h,s,pots[p],type);
 box('Runder Pflanzenhocker',wood,5.02,.16,6.74,.59,.28,.59);

 function shelf(x,z,y,side){
  box('Holzregal',wood,x,y,z,.28,.05,1.22);
  for(const dz of [-.43,.43])box('Schwarzer Regalwinkel',black,x+side*.064,y-.105,z+dz,.16,.18,.034);
  for(let i=0;i<4;i++)oval('Dekoration am Regal',i%2?canvas:pots[i],x,y+.10,z-.42+i*.24,.09,.09,.082);
 }
 shelf(.16,4.73,2.27,-1);
 shelf(width-.16,6.53,2.33,1);
 shelf(width-.16,.58,2.36,1);

 const picture=material(0xffffff);
 picture.map=texture(320,160,(g,w,h)=>{
  const gradient=g.createLinearGradient(0,0,0,h);
  gradient.addColorStop(0,'#5b7190');gradient.addColorStop(.46,'#abc1c6');gradient.addColorStop(.5,'#6e9ea9');gradient.addColorStop(1,'#2c5967');
  g.fillStyle=gradient;g.fillRect(0,0,w,h);
  for(let i=0;i<11;i++){
   const x=random()*w,y=56+random()*55;
   g.fillStyle=i%2?'#425c62':'#536e71';
   g.beginPath();g.moveTo(x-19,y+8);g.quadraticCurveTo(x-4,y-26,x+12,y-15);g.lineTo(x+35,y+12);g.closePath();g.fill();
  }
 });
 function art(x,z,y,w,h,mat,side){
  box('Bilderrahmen',wood,x,y,z,.033,h+.058,w+.058);
  const p=mesh('Wandbild',new T.PlaneGeometry(w,h),mat,x+side*.018,y,z,1,1,1);
  p.rotation.y=side*Math.PI/2;
 }
 art(.040,7.90,1.95,1.63,.84,picture,1);
 art(.043,2.77,1.94,.73,.51,picture,1);
 art(width-.039,4.38,1.91,.53,.64,canvas,-1);

 for(const [x,z] of [[1.13,2],[2.71,2.21],[4.23,2.75],[1.19,4.72],[2.76,5.15],[4.3,6.1],[1.23,8.21]]){
  mesh('Einbaustrahler',cylinder,trim,x,ceiling-.019,z,.083,.032,.083);
  mesh('Lichtfläche des Spots',cylinder,lamp,x,ceiling-.040,z,.056,.013,.056);
 }
 for(const [x,z,power] of [[1.4,2.1,20],[4,3.4,19],[1.6,6.8,23],[4.1,7.8,16]]){
  const light=new T.PointLight(0xffeddb,power,5.7,2);
  light.position.set(x,ceiling-.26,z);
  room.add(light);
 }

 // Batch repeated leaves, slats, and furniture parts without changing their transforms.
 room.updateMatrixWorld(true);
 const batches=new Map();
 const roomSpace=room.matrixWorld.clone().invert();
 room.traverse(object=>{
  if(!object.isMesh)return;
  const key=object.geometry.id+'-'+object.material.id;
  if(!batches.has(key))batches.set(key,[]);
  batches.get(key).push(object);
 });
 for(const objects of batches.values()){
  if(objects.length<3)continue;
  const first=objects[0];
  const batch=new T.InstancedMesh(first.geometry,first.material,objects.length);
  batch.name=first.name;
  batch.receiveShadow=first.receiveShadow;
  objects.forEach((object,i)=>{
   batch.setMatrixAt(i,roomSpace.clone().multiply(object.matrixWorld));
   object.removeFromParent();
  });
  room.add(batch);
 }

 return [room.position.x+3.40,room.position.z+length-.63,.05,-.05,.025];
}
