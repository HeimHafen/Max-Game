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
 const plaster=new THREE.MeshStandardMaterial({color:0xd8c5a8,roughness:.91});
 function wall(name,x,z,w,d,bottom=floorY){
  mesh(name,cx+x,(bottom+ceilingY)/2,z,w,ceilingY-bottom,d,plaster,true);
 }
 function partition(z,openings){
  let left=-halfWidth;
  for(const [x,width] of openings){
   const lo=x-width/2,hi=x+width/2;
   wall('Innenwand',(left+lo)/2,z,lo-left,thickness);
   wall('Türsturz',x,z,width,thickness,floorY+doorHeight);
   for(const sign of [-1,1]){
    mesh('Kalksteingewände',cx+x+sign*(width/2+.07),floorY+doorHeight/2,z,.14,doorHeight,.32,mats.dressedStone);
   }
   mesh('Kalksteinsturz',cx+x,floorY+doorHeight+.07,z,width+.44,.14,.35,mats.trim);
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
 for(const [x,z] of [[0,14.1],[-5.5,10],[0,10],[5.5,10]]){
  mesh('Messingfassung',cx+x,4.28,z,.34,.16,.34,mats.brass);
  const shade=new THREE.MeshStandardMaterial({color:0xffe0ad,emissive:0xffbe79,emissiveIntensity:.65,roughness:.55});
  mesh('Opalglasschirm',cx+x,4.14,z,.28,.13,.28,shade).castShadow=false;
  const light=new THREE.PointLight(0xffd9ad,22,7,2);
  light.position.set(cx+x,3.98,z);
  scene.add(light);
 }
}

export function entranceHallRegion(x,z){
 if(z>frontPartition)return Math.abs(x)<vestibuleHalf?'Windfang':x<0?'Vorderer Raum links':'Vorderer Raum rechts';
 if(z>rearPartition)return 'Eingangshalle';
 if(Math.abs(x)<rearRoomSplit)return 'Gartengang';
 return x<0?'Hinterer Raum links':'Hinterer Raum rechts';
}
