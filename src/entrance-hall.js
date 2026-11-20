import {addPortalDoors} from './portal-doors-v2.js';

import {houseFront,houseRear,frontPartition,rearPartition,terraceRoomHalf,interiorPartitionThickness} from './house-layout.js';
const vestibuleHalf=1.85;

const doorHeight=2.78;
const floorY=.05;
const ceilingY=4.36;
const thickness=interiorPartitionThickness;

export function addEntranceHall(THREE,scene,mats,mesh,cx,halfWidth,glass,doors){
 const plaster=new THREE.MeshStandardMaterial({color:0xe2d3bb,roughness:.9});
 const wainscot=new THREE.MeshStandardMaterial({color:0xc9b89e,roughness:.82});
 const ceiling=new THREE.MeshStandardMaterial({color:0xf0e6d5,roughness:.86});
 const molding=new THREE.MeshStandardMaterial({color:0xe6d6bb,roughness:.76});
 const border=new THREE.MeshStandardMaterial({color:0x66574a,roughness:.68});
 const grout=new THREE.MeshStandardMaterial({color:0xa59683,roughness:.88});
 const stone=new THREE.MeshStandardMaterial({roughness:.65});
 const bronze=new THREE.MeshStandardMaterial({color:0x513920,metalness:.58,roughness:.47});
 const shade=new THREE.MeshStandardMaterial({color:0xffe8c6,emissive:0xffca8d,emissiveIntensity:.45,roughness:.58});
 const front=houseFront-.27,rear=houseRear+.27;
 const hallZ=(frontPartition+rearPartition)/2;
 const frontZ=(frontPartition+front)/2;
 const rearZ=(rearPartition+rear)/2;
 const frontDepth=front-frontPartition-.55,rearDepth=rearPartition-rear-.55;
 mesh('Verputzte Deckenuntersicht',cx,ceilingY-.019,(front+rear)/2,halfWidth*2,.042,front-rear,ceiling);
 mesh('Fugenbett',cx,floorY+.003,(rear+front)/2,2*halfWidth,.009,front-rear,grout);
 const columns=24,rows=26,tileWidth=2*halfWidth/columns,tileDepth=(front-rear)/rows;
 const tileSections=[];
 const colors=[0xcdbba4,0xd9c8b0,0xd4c1a9,0xc8b79f,0xdccdb8].map(color=>new THREE.Color(color));
 for(let row=0;row<rows;row++){
  for(let col=0;col<columns;col++){
   const l=cx-halfWidth+col*tileWidth,n=rear+row*tileDepth;
   const color=colors[(col*13+row*7+col*row)%colors.length];
   tileSections.push({section:[l+.006,l+tileWidth-.006,n+.006,n+tileDepth-.006],color});
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
    mesh(name,(l+r)/2,y,(n+f)/2,r-l,height,f-n,material);
   }
  }
 }
 const rooms=[
  [0,hallZ,2*halfWidth-.55,4.14],
  [0,frontZ,3.22,frontDepth],
  ...[-1,1].map(side=>[side*(halfWidth+vestibuleHalf)/2,frontZ,halfWidth-vestibuleHalf-.52,frontDepth]),
  [0,rearZ,2*terraceRoomHalf-.52,rearDepth],
  ...[-1,1].map(side=>[side*(halfWidth+terraceRoomHalf)/2,rearZ,halfWidth-terraceRoomHalf-.52,rearDepth])
 ];
 for(const [x,z,w,d] of rooms){
  frame('Eingelegtes Bodenband',x,z,w,d,floorY+.018,.065,.008,border);
  frame('Deckengesims',x,z,w+.22,d+.22,ceilingY-.075,.24,.14,molding);
  frame('Profiliertes Deckenfeld',x,z,w-.27,d-.27,ceilingY-.051,.11,.09,molding);
 }
 for(const x of [-8,-4,0,4,8]){
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
 function partition(z,openings){
  let left=-halfWidth;
  for(const [x,width] of openings){
   const lo=x-width/2,hi=x+width/2;
   wall('Innenwand',(left+lo)/2,z,lo-left,thickness);
   wall('Türsturz',x,z,width,thickness,floorY+doorHeight);
   for(const sign of [-1,1]){
    mesh('Kalksteingewände',cx+x+sign*(width/2+.07),floorY+doorHeight/2,z,.14,doorHeight,.32,molding);
   }
   for(const side of [-1,1]){
    mesh('Türbekrönung',cx+x,floorY+doorHeight+.19,z+side*.161,width+.55,.092,.14,molding);
   }
   mesh('Kalksteinsturz',cx+x,floorY+doorHeight+.07,z,width+.44,.14,.35,molding);
   left=hi;
  }
  wall('Innenwand',(left+halfWidth)/2,z,halfWidth-left,thickness);
 }
 partition(frontPartition,[[-7.1,1.55],[0,2.08],[7.1,1.55]]);
 partition(rearPartition,[[-8.8,1.55],[0,2.08],[8.8,1.55]]);
 doors.push(addPortalDoors(THREE,scene,mats,glass,cx,rearPartition,1,2.08,doorHeight,null,floorY));
 for(const side of [-1,1])wall('Raumtrennwand',side*terraceRoomHalf,rearZ,thickness,rearPartition-rear);
 for(const sign of [-1,1]){
  wall('Windfangwand',sign*vestibuleHalf,(frontPartition+front)/2,thickness,front-frontPartition);

 }
 doors.push(addPortalDoors(THREE,scene,mats,glass,cx,frontPartition,1,2.08,doorHeight,null,floorY));
 function pendant(x,z,power){
  function turned(name,geometry,y,material){
   const item=new THREE.Mesh(geometry,material);
   item.name=name;
   item.position.set(cx+x,y,z);
   scene.add(item);
  }
  turned('Messingrosette',new THREE.CylinderGeometry(.24,.32,.07,24),4.28,bronze);
  turned('Pendelstab',new THREE.CylinderGeometry(.019,.019,.43,12),4.04,bronze);
  turned('Konische Messingkappe',new THREE.CylinderGeometry(.082,.25,.13,24),3.78,bronze);
  turned('Mattierter Opalglasschirm',new THREE.SphereGeometry(.242,24,14),3.61,shade);
  turned('Messingring',new THREE.TorusGeometry(.231,.018,8,28).rotateX(Math.PI/2),3.65,bronze);
  const light=new THREE.PointLight(0xffdfbe,power,10,2);
  light.position.set(cx+x,3.43,z);
  scene.add(light);
 }
 for(const [x,z,power] of [
  [0,frontZ,24],[-8,hallZ,46],[0,hallZ,52],[8,hallZ,46],
  ...[rearZ-3.5,rearZ+3.5].flatMap(z=>[[0,z,28],[-8.8,z,42],[8.8,z,42]]),
  [-7.2,frontZ,34],[7.2,frontZ,34]
 ])pendant(x,z,power);

}

export function entranceHallRegion(x,z){
 if(z>frontPartition)return Math.abs(x)<vestibuleHalf?'Windfang':x<0?'Vorderer Raum links':'Vorderer Raum rechts';
 if(z>rearPartition)return 'Eingangshalle';
 return Math.abs(x)<terraceRoomHalf?'Terrassenzimmer':x<0?'Hinteres Zimmer links':'Hinteres Zimmer rechts';
}
