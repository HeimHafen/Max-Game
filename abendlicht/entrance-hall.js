import {stairOpening} from './galerie.js';
import {addPortalDoors} from './portal-doors-v2.js';

import {houseFront,houseRear,vestibulePartition,frontPartition,rearPartition,terraceRoomHalf,interiorPartitionThickness} from './house-layout.js';
const vestibuleHalf=1.85;

const doorHeight=2.78;
const floorY=.05;
const ceilingY=4.36;
const thickness=interiorPartitionThickness;

export function addEntranceHall(THREE,scene,mats,mesh,cx,halfWidth,glass,doors){
 const rightHouse=cx>0;
 const plaster=new THREE.MeshStandardMaterial({color:rightHouse?0xeee3d4:0xe2d3bb,roughness:.9});
 const wainscot=new THREE.MeshStandardMaterial({color:rightHouse?0xc9bca9:0xc9b89e,roughness:.82});
 const ceiling=new THREE.MeshStandardMaterial({color:0xf0e6d5,roughness:.86});
 const molding=new THREE.MeshStandardMaterial({color:rightHouse?0xece2d3:0xe6d6bb,roughness:.76});
 const border=new THREE.MeshStandardMaterial({color:0x66574a,roughness:.68});
 const grout=new THREE.MeshStandardMaterial({color:rightHouse?0xc9bda9:0xa59683,roughness:.88});
 const stone=new THREE.MeshStandardMaterial({roughness:.65});
 if(rightHouse){
  stone.roughness=.77;
  stone.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec2 stoneWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
    #include <begin_vertex>
    stoneWorld=(modelMatrix*instanceMatrix*vec4(position,1.0)).xz;`);
   shader.fragmentShader='varying vec2 stoneWorld;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
    #include <color_fragment>
    vec2 p=stoneWorld;
    float cloud=sin(p.x*11.5+1.7*sin(p.y*9.1))*sin(p.y*14.3+p.x*3.6);
    float grain=sin(p.x*225.3+p.y*117.1)*sin(p.x*132.4-p.y*189.3);
    diffuseColor.rgb *= 1.0 + .046*cloud + .023*grain;`);
  };
 }
 const bronze=new THREE.MeshStandardMaterial({color:0x513920,metalness:.58,roughness:.47});
 const shade=new THREE.MeshStandardMaterial({color:0xffe8c6,emissive:0xffca8d,emissiveIntensity:.45,roughness:.58});
 const ivory=new THREE.MeshStandardMaterial({color:0xeee2ce,roughness:.91});
 const limestone=mats.stairStone.clone();
 limestone.color.setHex(0xf4e4cb);
 limestone.roughness=.76;
 const marble=new THREE.MeshStandardMaterial({color:0x38302b,roughness:.47});
 marble.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 marblePosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nmarblePosition=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader='varying vec3 marblePosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
   #include <color_fragment>
   vec2 p=marblePosition.xz;
   float v=sin(p.x*5.0+p.y*3.4+1.15*sin(p.y*6.5)+.2*sin(p.x*17.0));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.23,.19,.15),smoothstep(.98,1.0,v)*.32);`);
 };
 const vestibuleCeiling=3.52;
 const front=houseFront-.27,rear=houseRear+.27;
 const hallZ=(frontPartition+rearPartition)/2;
 const vestibuleZ=(front+vestibulePartition)/2;
 const frontZ=(frontPartition+front)/2;
 const rearZ=(rearPartition+rear)/2;
 const frontDepth=front-frontPartition-.55,rearDepth=rearPartition-rear-.55;
 const ceilingSections=cx>0?[
  [-halfWidth,stairOpening[0],rear,front],[stairOpening[1],halfWidth,rear,front],
  [stairOpening[0],stairOpening[1],rear,stairOpening[2]],
  [stairOpening[0],stairOpening[1],stairOpening[3],front]
 ]:[[-halfWidth,halfWidth,rear,front]];
 for(const [l,r,n,f] of ceilingSections){
  mesh('Verputzte Deckenuntersicht',cx+(l+r)/2,ceilingY-.019,(f+n)/2,r-l,.042,f-n,ceiling);
 }
 mesh('Fugenbett',cx,floorY+.003,(rear+front)/2,2*halfWidth,.009,front-rear,grout);
 const columns=rightHouse?19:24,rows=rightHouse?32:26;
 const tileWidth=2*halfWidth/columns,tileDepth=(front-rear)/rows;
 const tileSections=[];
 const colors=(rightHouse?[0xcfc3b0,0xd5c9b7,0xd1c5b2,0xcbbfae,0xd3c6b4]:
  [0xcdbba4,0xd9c8b0,0xd4c1a9,0xc8b79f,0xdccdb8]).map(color=>new THREE.Color(color));
 for(let row=0;row<rows;row++){
  const stagger=rightHouse&&row%2===1;
  const n=rear+row*tileDepth;
  for(let col=stagger?-1:0;col<columns;col++){
   const left=-halfWidth+(col+(stagger?.5:0))*tileWidth;
   const l=cx+Math.max(-halfWidth,left),r=cx+Math.min(halfWidth,left+tileWidth);
   const colorIndex=rightHouse?col+1:col;
   const color=colors[(colorIndex*13+row*7+colorIndex*row)%colors.length];
   const joint=rightHouse?.004:.006;
   tileSections.push({section:[l+joint,r-joint,n+joint,n+tileDepth-joint],color});
  }
 }
 const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.013,1),stone,tileSections.length);
 const matrix=new THREE.Matrix4();
 tileSections.forEach(({section:[l,r,n,f],color},index)=>{
  matrix.makeScale(r-l,1,f-n).setPosition((l+r)/2,floorY+.009,(n+f)/2);
  tiles.setMatrixAt(index,matrix);
  tiles.setColorAt(index,color);
 });
 tiles.name='Geschliffene Kalksteinplatten';
 tiles.receiveShadow=true;
 scene.add(tiles);
 function frame(name,x,z,w,d,y,breadth,height,material){
  for(const side of [-1,1]){
   for(const [px,pz,width,depth] of [[cx+x,z+side*(d-breadth)/2,w,breadth],[cx+x+side*(w-breadth)/2,z,breadth,d-2*breadth]]){
    const bounds=[px-width/2,px+width/2,pz-depth/2,pz+depth/2];
    const [l,r,n,f]=bounds;
    const strip=mesh(name,(l+r)/2,y,(n+f)/2,r-l,height,f-n,material);
    if(material===marble)strip.castShadow=false;
   }
  }
 }
 const rooms=[
  ...(cx>0?[[0,9.2,5.34,12.2]]:[[0,hallZ,2*halfWidth-.55,4.14]]),
  ...(rightHouse?[[-7.6,frontZ,8.75,frontDepth]]:
   [-1,1].map(side=>[side*(halfWidth+vestibuleHalf)/2,frontZ,halfWidth-vestibuleHalf-.52,frontDepth])),
  [0,rearZ,2*terraceRoomHalf-.52,rearDepth],
  ...[-1,1].map(side=>[side*(halfWidth+terraceRoomHalf)/2,rearZ,halfWidth-terraceRoomHalf-.52,rearDepth])
 ];
 for(const [x,z,w,d] of rooms){
  if(!rightHouse||z===rearZ)frame('Eingelegtes Bodenband',x,z,w,d,floorY+.018,.065,.008,border);
  frame('Deckengesims',x,z,w+.22,d+.22,ceilingY-.075,.24,.14,molding);
  frame('Profiliertes Deckenfeld',x,z,w-.27,d-.27,ceilingY-.051,.11,.09,molding);
 }
 for(const x of cx>0?[-8,-4,0]:[-8,-4,0,4,8]){
  frame('Kassette der Eingangshalle',x,hallZ,3.75,3.41,ceilingY-.054,.11,.097,molding);
 }
 function wall(name,x,z,w,d,bottom=floorY){
  mesh(name,cx+x,(bottom+ceilingY)/2,z,w,ceilingY-bottom,d,plaster,true);
  if(bottom!==floorY)return;
  mesh('Wandvertäfelung',cx+x,.62,z,w+.004,.94,d+.038,wainscot);
  mesh('Abschlussprofil der Vertäfelung',cx+x,1.09,z,w+.012,.062,d+.09,molding);
  mesh('Kalksteinsockel',cx+x,.16,z,w+.008,.22,d+.075,molding);
  mesh('Sockelprofil',cx+x,.274,z,w+.012,.036,d+.097,molding);
  mesh('Wandkranz',cx+x,4.22,z,w+.018,.24,d+.15,molding);
 }
 function partition(z,openings,start=-halfWidth,end=halfWidth){
  let left=start;
  for(const [x,width] of openings){
   const lo=x-width/2,hi=x+width/2;
   wall('Innenwand',(left+lo)/2,z,lo-left,thickness);
   wall('Türsturz',x,z,width,thickness,floorY+doorHeight);
   for(const sign of [-1,1]){
    mesh('Kalksteingewände',cx+x+sign*(width/2+.07),floorY+doorHeight/2,z,.14,doorHeight,.32,molding);
   }
   for(const side of z===vestibulePartition?[-1]:[-1,1]){
    mesh('Türbekrönung',cx+x,floorY+doorHeight+.19,z+side*.161,width+.55,.092,.14,molding);
   }
   mesh('Kalksteinsturz',cx+x,floorY+doorHeight+.07,z,width+.44,.14,.35,molding);
   left=hi;
  }
  wall('Innenwand',(left+end)/2,z,end-left,thickness);
 }
 if(cx>0){
  partition(frontPartition,[[-7.1,1.55]],-halfWidth,-3.05);
  wall('Linke Foyerwand',-3.05,(front+frontPartition)/2,thickness,front-frontPartition);
 }else{
  partition(frontPartition,[[-7.1,1.55]],-halfWidth,-vestibuleHalf);
  partition(frontPartition,[[7.1,1.55]],vestibuleHalf,halfWidth);
  partition(vestibulePartition,[[0,2.32]],-vestibuleHalf,vestibuleHalf);
  for(const sign of [-1,1]){
   wall('Seitliche Wand des Hallenzugangs',sign*vestibuleHalf,(vestibulePartition+frontPartition)/2,thickness,vestibulePartition-frontPartition);
  }
 }
 partition(rearPartition,[[-8.8,1.55],[0,2.08],[8.8,1.55]]);
 const terraceDoorFinish={
  frame:new THREE.MeshStandardMaterial({color:0xf8f8f5,roughness:.47}),
  handle:new THREE.MeshStandardMaterial({color:0x161616,roughness:.56,metalness:.24})
 };
 doors.push(addPortalDoors(THREE,scene,mats,glass,cx,rearPartition,1,2.08,doorHeight,null,floorY,terraceDoorFinish));
 for(const side of [-1,1])wall('Raumtrennwand',side*terraceRoomHalf,rearZ,thickness,rearPartition-rear);
 if(!rightHouse){
 const clearHalf=vestibuleHalf-thickness/2;
 const vestibuleDepth=front-vestibulePartition;
 mesh('Elfenbeinfarbene Windfangdecke',cx,vestibuleCeiling,vestibuleZ,clearHalf*2,.08,vestibuleDepth,ivory);
 mesh('Windfang Fugenbett',cx,floorY+.018,vestibuleZ,clearHalf*2,.008,vestibuleDepth,limestone).castShadow=false;
 const rowsInVestibule=Math.ceil(vestibuleDepth/.63);
 for(let row=0;row<rowsInVestibule;row++){
  const depth=vestibuleDepth/rowsInVestibule;
  const stagger=row%2===0?0:.54;
  for(let start=-clearHalf-stagger;start<clearHalf;start+=1.08){
   const l=Math.max(-clearHalf,start),r=Math.min(clearHalf,start+1.08);
   if(r-l>.01)mesh('Kalksteinplatte im Windfang',cx+(l+r)/2,floorY+.024,vestibulePartition+(row+.5)*depth,r-l-.006,.006,depth-.006,limestone).castShadow=false;
  }
 }
 frame('Dunkler Marmorfries',0,vestibuleZ,2*clearHalf-.36,vestibuleDepth-.48,floorY+.032,.043,.005,marble);
 for(const [y,width,depth,band,height] of [
  [3.46,clearHalf*2,vestibuleDepth,.083,.083],
  [3.49,clearHalf*2,vestibuleDepth,.13,.05],
  [3.515,clearHalf*2,vestibuleDepth,.19,.035]
 ])frame('Profiliertes Windfanggesims',0,vestibuleZ,width,depth,y,band,height,ivory);
 for(const sign of [-1,1]){
  const x=sign*vestibuleHalf;
  mesh('Windfangwand',cx+x,(floorY+ceilingY)/2,vestibuleZ,thickness,ceilingY-floorY,vestibuleDepth,ivory,true);
  mesh('Kalksteinsockel im Windfang',cx+sign*(clearHalf-.019),.48,vestibuleZ,.044,.86,vestibuleDepth,limestone);
  for(const [y,w,h] of [[.084,.064,.055],[.91,.068,.045],[.946,.051,.04]]){
   mesh('Profiliertes Kalksteinband',cx+sign*(clearHalf-w/2),y,vestibuleZ,w,h,vestibuleDepth,limestone);
  }
  const jambX=cx+sign*1.22;
  mesh('Kalksteingewände der Windfangtür',jambX,1.45,vestibulePartition+.197,.18,2.8,.10,limestone);
  mesh('Inneres Gewändeprofil',cx+sign*1.141,1.45,vestibulePartition+.254,.032,2.8,.045,limestone);
  const wingStart=1.31,wingEnd=clearHalf;
  mesh('Kalksteinsockel an der Stirnwand',cx+sign*(wingStart+wingEnd)/2,.48,vestibulePartition+.146,wingEnd-wingStart,.86,.06,limestone);
  mesh('Stirnseitiges Kalksteinband',cx+sign*(wingStart+wingEnd)/2,.94,vestibulePartition+.164,wingEnd-wingStart,.064,.085,limestone);
 }
 mesh('Kalksteinsturz der Windfangtür',cx,2.91,vestibulePartition+.212,2.62,.16,.13,limestone);
 mesh('Inneres Sturzprofil',cx,2.841,vestibulePartition+.261,2.31,.041,.043,limestone);
 doors.push(addPortalDoors(THREE,scene,mats,glass,cx,vestibulePartition,1,2.32,doorHeight,null,floorY,{
  frame:new THREE.MeshStandardMaterial({color:0x35312c,metalness:.36,roughness:.56}),
  fullGlass:true,inset:.03,activationDistance:2.25
 }));
 }
 function pendant(x,z,power,drop=0){
  function turned(name,geometry,y,material){
   const item=new THREE.Mesh(geometry,material);
   item.name=name;
   item.position.set(cx+x,y-drop,z);
   scene.add(item);
  }
  turned('Messingrosette',new THREE.CylinderGeometry(.24,.32,.07,24),4.28,bronze);
  turned('Pendelstab',new THREE.CylinderGeometry(.019,.019,.43,12),4.04,bronze);
  turned('Konische Messingkappe',new THREE.CylinderGeometry(.082,.25,.13,24),3.78,bronze);
  const globe=new THREE.SphereGeometry(drop?.285:.242,32,20);
  if(drop)globe.scale(1,.79,1);
  turned('Mattierter Opalglasschirm',globe,3.61,shade);
  if(!drop)turned('Messingring',new THREE.TorusGeometry(.231,.018,8,28).rotateX(Math.PI/2),3.65,bronze);
  const light=new THREE.PointLight(0xffdfbe,power,10,2);
  light.position.set(cx+x,3.43-drop,z);
  scene.add(light);
 }
  if(cx<0)pendant(0,vestibuleZ,15,.81);
 else pendant(0,12.8,32);
 const entranceFill=new THREE.PointLight(0xffe3c5,8,6,2);
 entranceFill.position.set(cx,2.85,front-.5);
 scene.add(entranceFill);
 for(const [x,z,power] of [
  [-8,hallZ,46],[0,hallZ,52],[cx>0?10.1:8,hallZ,46],
  ...[rearZ-3.5,rearZ+3.5].flatMap(z=>[[0,z,28],[-8.8,z,42],[8.8,z,42]]),
  [-7.2,frontZ,34],[cx>0?10.2:7.2,cx>0?vestibuleZ:frontZ,34]
 ])pendant(x,z,power);

}

export function entranceHallRegion(x,z,rightHouse=false){
 if(rightHouse&&z>rearPartition){
  if(x< -3.05&&z>frontPartition)return 'Vorderer Raum links';
  return 'Foyer';
 }
 if(Math.abs(x)<vestibuleHalf&&z>=vestibulePartition)return 'Windfang';
 if(Math.abs(x)>=vestibuleHalf&&z>frontPartition)return x<0?'Vorderer Raum links':'Vorderer Raum rechts';
 if(z>rearPartition)return 'Eingangshalle';
 return Math.abs(x)<terraceRoomHalf?'Terrassenzimmer':x<0?'Hinteres Zimmer links':'Hinteres Zimmer rechts';
}
