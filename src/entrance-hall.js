import {addPortalDoors} from './portal-doors-v2.js';

const frontPartition=12.35;
const rearPartition=7.65;
const vestibuleHalf=1.85;
const rearRoomSplit=3.05;
const doorHeight=2.78;
const floorY=.05;
const ceilingY=4.36;
const thickness=.23;

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
 const front=15.73,rear=1.27;
 mesh('Verputzte Deckenuntersicht',cx,ceilingY-.019,(front+rear)/2,halfWidth*2,.042,front-rear,ceiling);
 mesh('Fugenbett',cx,floorY+.003,(front+rear)/2,halfWidth*2,.009,front-rear,grout);
 const columns=24,rows=16,tileWidth=2*halfWidth/columns,tileDepth=(front-rear)/rows;
 const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(tileWidth-.012,.013,tileDepth-.012),stone,columns*rows);
 const transform=new THREE.Matrix4();
 const colors=[0xcdbba4,0xd9c8b0,0xd4c1a9,0xc8b79f,0xdccdb8].map(color=>new THREE.Color(color));
 for(let row=0;row<rows;row++){
  for(let col=0;col<columns;col++){
   const index=row*columns+col;
   transform.makeTranslation(cx-halfWidth+(col+.5)*tileWidth,floorY+.009,rear+(row+.5)*tileDepth);
   tiles.setMatrixAt(index,transform);
   tiles.setColorAt(index,colors[(col*13+row*7+col*row)%colors.length]);
  }
 }
 tiles.name='Geschliffene Kalksteinplatten';
 tiles.receiveShadow=true;
 scene.add(tiles);
 function frame(name,x,z,w,d,y,breadth,height,material){
  for(const side of [-1,1]){
   mesh(name,cx+x,y,z+side*(d-breadth)/2,w,height,breadth,material);
   mesh(name,cx+x+side*(w-breadth)/2,y,z,breadth,height,d-2*breadth,material);
  }
 }
 const rooms=[
  [0,10,2*halfWidth-.55,4.14],
  [0,13.99,3.22,2.88],[0,4.45,5.60,5.84],
  ...[-1,1].flatMap(side=>[
   [side*(halfWidth+vestibuleHalf)/2,14.03,halfWidth-vestibuleHalf-.52,2.79],
   [side*(halfWidth+rearRoomSplit)/2,4.45,halfWidth-rearRoomSplit-.52,5.84]
  ])
 ];
 for(const [x,z,w,d] of rooms){
  frame('Eingelegtes Bodenband',x,z,w,d,floorY+.018,.065,.008,border);
  frame('Deckengesims',x,z,w+.22,d+.22,ceilingY-.075,.24,.14,molding);
  frame('Profiliertes Deckenfeld',x,z,w-.27,d-.27,ceilingY-.051,.11,.09,molding);
 }
 for(const x of [-8,-4,0,4,8]){
  frame('Kassette der Eingangshalle',x,10,3.75,3.41,ceilingY-.054,.11,.097,molding);
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
 partition(rearPartition,[[-7.1,1.55],[0,2.08],[7.1,1.55]]);
 for(const sign of [-1,1]){
  wall('Windfangwand',sign*vestibuleHalf,(frontPartition+15.74)/2,thickness,15.74-frontPartition);
  wall('Raumtrennwand',sign*rearRoomSplit,(rearPartition+1.27)/2,thickness,rearPartition-1.27);
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
  [0,14.12,24],[-8,10,46],[0,10,52],[8,10,46],[0,4.55,28],
  [-7.2,14.1,34],[7.2,14.1,34],[-7.2,4.45,42],[7.2,4.45,42]
 ])pendant(x,z,power);

}

export function entranceHallRegion(x,z){
 if(z>frontPartition)return Math.abs(x)<vestibuleHalf?'Windfang':x<0?'Vorderer Raum links':'Vorderer Raum rechts';
 if(z>rearPartition)return 'Eingangshalle';
 if(Math.abs(x)<rearRoomSplit)return 'Gartengang';
 return x<0?'Hinterer Raum links':'Hinterer Raum rechts';
}
