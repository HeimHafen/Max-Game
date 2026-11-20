import {addFrontBalcony,balconyLevel,balconyHouse} from './front-balcony-v2.js';
import {addEntranceLanterns} from './entrance-lanterns-v2.js';
import {addPortalDoors,createOakFinish} from './portal-doors-v2.js';
import {addPorticoColumn} from './portico-columns-v2.js';

// Das Nordportal stammt aus dem Originalmodell des Herrenhauses V97.
export const houseAxis=19.6;

export function buildEnsemble(THREE, scene, source, mats, glass, gableMaterial=mats.facadeWall){
 const surfaces=[[-80,80,-90,95,0]], walls=[], doors=[];
 function floor(l,r,n,f,y){surfaces.push([l,r,n,f,y]);}
 function block(bounds){
  walls.push([bounds.min.x,bounds.max.x,bounds.min.z,bounds.max.z,bounds.min.y,bounds.max.y]);
 }
 function mesh(name,x,y,z,w,h,d,mat,solid=false){
  const item=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  item.name=name;
  item.position.set(x,y,z);
  item.castShadow=item.receiveShadow=true;
  scene.add(item);
  if(solid)block(new THREE.Box3().setFromObject(item));
  return item;
 }
 const portico=new THREE.Group();
 portico.name='Max-Town-Portikus';
 scene.add(portico);
 source.updateMatrixWorld(true);
 const frontPlinths=[419,423,425,427];
 const soffit=new THREE.Box3().setFromObject(source.getObjectByName('Cube431'),true);
 function registerColumn(plinth){
  plinth.updateWorldMatrix(true,false);
  const bounds=new THREE.Box3().setFromObject(plinth,true);
  bounds.min.y=0;
  bounds.max.y=soffit.min.y;
  block(bounds);
 }
 source.traverse(obj=>{
  if(!obj.isMesh)return;
  const cube=/^Cube(\d+)$/.exec(obj.name);
  const cone=/^Cone(\d*)$/.exec(obj.name);
  const id=cube?Number(cube[1]):-1;
  if(cone||id>=419&&id<=430)return;
  if(!(id>=431&&id<=440)&&obj.name!=='Giebel')return;
  const part=obj.clone(false);
  obj.matrixWorld.decompose(part.position,part.quaternion,part.scale);
  if(id>=433&&id<=438)part.material=mats.porticoPaving;
  else if(id===431)part.material=mats.soffit;
  else if(obj.name==='Giebel')part.material=gableMaterial;
  else part.material=mats.trim;
  part.castShadow=part.receiveShadow=true;
  portico.add(part);
  const bounds=new THREE.Box3().setFromObject(part);
  if(id>=433&&id<=438)floor(bounds.min.x,bounds.max.x,bounds.min.z,bounds.max.z,bounds.max.y);
 });
 for(const [index,id] of frontPlinths.entries()){
  const base=source.getObjectByName('Cube'+id);
  const abacus=source.getObjectByName('Cube'+(id+1));
  const shaft=source.getObjectByName(['Cone001','Cone007','Cone010','Cone013'][index]);
  const front=new THREE.Box3().setFromObject(base,true).getCenter(new THREE.Vector3()).z;
  const rear=soffit.min.z+soffit.max.z-front;
  for(const z of [front,rear]){
   const column=new THREE.Group();
   column.name='Portikussäule';
   column.position.z=z-front;
   portico.add(column);
   addPorticoColumn(THREE,column,shaft,mats);
   for(const original of [base,abacus]){
    const part=original.clone(false);
    original.matrixWorld.decompose(part.position,part.quaternion,part.scale);
    part.material=mats.trim;
    part.castShadow=part.receiveShadow=true;
    column.add(part);
    if(original===base)registerColumn(part);
   }
  }
 }
 const terrace=new THREE.Box3().setFromObject(portico.getObjectByName('Cube433'));
 // Die Gartenstufen schließen am hinteren Rand auf Höhe der Originalterrasse an.
 for(let i=0;i<5;i++){
  const y=terrace.max.y*(5-i)/6,depth=.38;
  const z=terrace.min.z-depth*(i+.5);
  const step=mesh('Gartenstufe',0,y/2,z,16.60,y,depth,mats.porticoPaving);
  const {position,normal,uv}=step.geometry.attributes;
  for(let vertex=0;vertex<position.count;vertex++){
   const px=position.getX(vertex)+step.position.x;
   const py=position.getY(vertex)+step.position.y;
   const pz=position.getZ(vertex)+step.position.z;
   const top=Math.abs(normal.getY(vertex))>.5;
   const side=Math.abs(normal.getX(vertex))>.5;
   uv.setXY(vertex,(side?pz:px)*.32,(top?pz:py)*.32);
  }
  floor(-8.3,8.3,z-depth/2-.001,z+depth/2+.001,y);
 }

 const oak=createOakFinish(THREE);
 function house(cx){
  const width=15, left=cx-width/2,right=cx+width/2;
  const front=16,rear=1, thick=.55;
  const centers=[cx-4.4,cx,cx+4.4];
  for(const z of [front,rear]){
   const outward=z===front?1:-1;
   const referenceFace=cx===balconyHouse&&z===front;
   for(let i=0;i<3;i++){
    const y=i*4.5,top=y+4.5;
    let cursor=left;
    for(const x of centers){
     const entrance=x===cx&&i===0;
     const balconyDoor=cx===balconyHouse&&x===cx&&z===front&&i===1;
     const w=entrance?2.15:balconyDoor?2.44:1.74;
     const lo=x-w/2,hi=x+w/2;
     const sill=entrance?0:balconyDoor?balconyLevel:y+(referenceFace?(i===0?1.02:.93):1.01), lintel=entrance?3.02:balconyDoor?balconyLevel+3.25:y+3.47;
     mesh('Kalksteinfassade',(cursor+lo)/2,(y+top)/2,z,lo-cursor,top-y,thick,mats.facadeWall,true);
     mesh('Fenstersturz',x,(top+lintel)/2,z,w,top-lintel,thick,mats.facadeWall,true);
     if(balconyDoor){
      doors.push(addPortalDoors(THREE,scene,mats,glass,x,z,outward,w,lintel-sill,null,sill));
     }else if(!entrance){
      mesh('Fensterbrüstung',x,(sill+y)/2,z,w,sill-y,thick,mats.facadeWall,true);
      mesh('Fensterglas',x,(sill+lintel)/2,z,w-.035,lintel-sill,.035,glass,true).castShadow=false;
      const gridFace=z+outward*.085;
      for(let k=0;k<=4;k++)mesh('Fenstersprosse',lo+w*k/4,(sill+lintel)/2,gridFace,.039,lintel-sill,.09,mats.paintedSash);
      for(let k=0;k<=5;k++)mesh('Fenstersprosse',x,sill+(lintel-sill)*k/5,gridFace,w,.044,.09,mats.paintedSash);
      mesh('Sohlbank',x,sill-.04,z+outward*.28,w+.31,.15,.41,mats.windowStone);
     }
     for(const sign of [-1,1])mesh('Laibungsprofil',x+sign*(w/2+.065),(sill+lintel)/2,z+outward*.28,.13,lintel-sill,.16,mats.trim);
     mesh('Sturzprofil',x,lintel+.055,z+outward*.29,w+.32,.14,.19,mats.trim);
     if(referenceFace&&!entrance){
      for(const sign of [-1,1]){
       mesh('Profiliertes Kalksteingewände',x+sign*(w/2+.144),(sill+lintel)/2,z+.301,.07,lintel-sill,.19,mats.windowStone);
      }
      mesh('Schmales Fensterkranzgesims',x,lintel+.115,z+.35,w+.45,.087,.27,mats.trim);
     }
     if(i===1){
      mesh('Fensterverdachung',x,lintel+.18,z+outward*.36,w+.56,.13,.32,mats.capitalFinish);
      for(const side of [-1,1]){
       mesh('Konsolstein',x+side*(w/2+.065),lintel-.13,z+outward*.354,.14,.22,.21,mats.trim);
      }
     }
     cursor=hi;
    }
    mesh('Kalksteinfassade',(cursor+right)/2,(y+top)/2,z,right-cursor,top-y,thick,mats.facadeWall,true);
   }

  }
  for(const [x,side] of [[left+.17,-1],[right-.17,1]]){
   for(let i=0;i<3;i++){
    const y=i*4.5,top=y+4.5,sill=y+1.01,lintel=y+3.47;
    let cursor=rear;
    for(const z of [3.65,8.5,13.35]){
     const w=1.68,lo=z-w/2,hi=z+w/2;
     mesh('Seitenwand',x,(y+top)/2,(cursor+lo)/2,.48,top-y,lo-cursor,mats.facadeWall,true);
     mesh('Seitliche Fensterbrüstung',x,(y+sill)/2,z,.48,sill-y,w,mats.facadeWall,true);
     mesh('Seitlicher Fenstersturz',x,(lintel+top)/2,z,.48,top-lintel,w,mats.facadeWall,true);
     mesh('Seitliches Fensterglas',x+side*.06,(sill+lintel)/2,z,.036,lintel-sill,w-.04,glass,true).castShadow=false;
     for(let k=0;k<=4;k++)mesh('Seitliche Fenstersprosse',x+side*.109,(sill+lintel)/2,lo+k*w/4,.09,lintel-sill,.04,mats.paintedSash);
     for(let k=0;k<=5;k++)mesh('Seitliche Fenstersprosse',x+side*.109,sill+k*(lintel-sill)/5,z,.09,.043,w,mats.paintedSash);
     mesh('Seitliche Sohlbank',x+side*.25,sill-.055,z,.46,.14,w+.31,mats.windowStone);
     for(const edge of [lo-.05,hi+.05])mesh('Seitliche Laibung',x+side*.25,(sill+lintel)/2,edge,.15,lintel-sill,.105,mats.trim);
     mesh('Seitliches Sturzprofil',x+side*.25,lintel+.06,z,.21,.15,w+.32,mats.trim);
     cursor=hi;
    }
    mesh('Seitenwand',x,(y+top)/2,(cursor+front)/2,.48,top-y,front-cursor,mats.facadeWall,true);
   }
   mesh('Seitlicher Sockel',x+side*.07,.29,8.5,.55,.58,15.1,mats.shade);

  }
  for(const z of [front,rear]){
   const outward=z===front?1:-1;
   for(const offset of [-4.29,4.29])mesh('Fassadensockel',cx+offset,.29,z+outward*.10,6.37,.58,.48,mats.shade);
   for(const sign of [-1,1]){
    const x=cx+sign*1.24;
    mesh('Portalpilaster',x,1.55,z+outward*.377,.25,3.1,.22,mats.dressedStone);
    mesh('Portalbasis',x,.13,z+outward*.405,.38,.26,.31,mats.stairStone);
    mesh('Portalkapitell',x,3.09,z+outward*.411,.41,.17,.31,mats.capitalFinish);
   }
   mesh('Portalgebälk',cx,3.25,z+outward*.432,3.12,.18,.38,mats.trim);
   mesh('Portalgesims',cx,3.38,z+outward*.451,3.34,.10,.46,mats.trim);
   for(const side of [-1,1]){
    const crown=mesh('Portalverdachung',cx+side*.76,3.67,z+outward*.43,1.61,.115,.37,mats.capitalFinish);
    crown.rotation.z=-side*.35;
   }
   const tympanum=new THREE.Shape();
   tympanum.moveTo(-1.47,0);
   tympanum.lineTo(1.47,0);
   tympanum.lineTo(0,.535);
   tympanum.closePath();
   const infill=new THREE.Mesh(new THREE.ExtrudeGeometry(tympanum,{depth:.14,bevelEnabled:false}),mats.dressedStone);
   infill.position.set(cx,3.41,z+outward*.30-.07);
   infill.name='Giebelfeld des Portals';
   infill.castShadow=infill.receiveShadow=true;
   scene.add(infill);
   if(z===front)addEntranceLanterns(THREE,scene,cx,z);
   doors.push(addPortalDoors(THREE,scene,mats,glass,cx,z,outward,2.15,3.02,z===front?oak:null));
   mesh('Eingangsschwelle',cx,.012,z,2.15,.044,.88,mats.stairStone);
  }
  for(const [y,projection,height] of [[4.44,.12,.19],[4.57,.18,.08],[9.02,.085,.13]]){
   for(const z of [front,rear]){
    if(cx===balconyHouse&&z===front&&y<5){
     const span=(width+2*projection-2.46)/2;
     for(const sign of [-1,1])mesh('Umlaufendes Gurtgesims',cx+sign*(1.23+span/2),y,z,span,height,thick+2*projection,mats.trim);
    }else mesh('Umlaufendes Gurtgesims',cx,y,z,width+2*projection,height,thick+2*projection,mats.trim);
   }
   for(const x of [left+.17,right-.17]){
    mesh('Seitliches Gurtgesims',x,y,8.5,.48+2*projection,height,14.98,mats.trim);
   }
  }
  for(const x of [left,right])for(const z of [rear,front]){
   for(let row=0;row<18;row++){
    const y=.70+row*.69;
    if(Math.abs(y-4.44)<.43||Math.abs(y-9.02)<.4)continue;
    const sx=x<cx?1:-1,sz=z===rear?1:-1;
    const faceWidth=row%2===0?.83:.61,sideWidth=row%2===0?.52:.76;
    mesh('Eckquader der Front',x+sx*(faceWidth/2-.13),y,z-sz*.255,faceWidth,.59,.18,mats.dressedStone);
    mesh('Eckquader der Seitenwand',x+sx*.015,y,z+sz*(sideWidth/2-.16),.30,.59,sideWidth,mats.dressedStone);
   }
  }
  for(const [y,w,d,h] of [[13.28,15.22,15.43,.14],[13.38,15.36,15.57,.09],[13.51,15.58,15.79,.18],[13.638,15.68,15.89,.08],[13.72,15.90,16.10,.085]]){
   mesh('Mehrstufiges Dachgesims',cx,y,8.5,w,h,d,mats.trim);
  }
  mesh('Traufblech',cx,13.752,8.5,15.5,.045,15.64,mats.roof);
  const eave=13.77,ridge=15.02;
  const points=[
   [-7.75,eave,.68],[7.75,eave,.68],[7.75,eave,16.32],[-7.75,eave,16.32],
   [-2.6,ridge,8.5],[2.6,ridge,8.5]
  ];
  const roofGeometry=new THREE.BufferGeometry();
  const faces=[0,4,5,0,5,1,1,5,2,2,5,4,2,4,3,3,4,0];
  roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(faces.flatMap(i=>points[i]),3));
  roofGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(faces.flatMap(i=>[points[i][0]*.25,points[i][2]*.25]),2));
  roofGeometry.computeVertexNormals();
  const roof=new THREE.Mesh(roofGeometry,mats.roof);
  roof.position.x=cx;
  roof.name='Niedriges Zinkwalmdach';
  roof.castShadow=roof.receiveShadow=true;
  scene.add(roof);
  for(const offset of [-4.1,4.1]){
   mesh('Schornstein',cx+offset,14.39,7.6,1.07,1.2,.93,mats.facadeWall);
   mesh('Schornsteinkrone',cx+offset,15.03,7.6,1.29,.18,1.17,mats.trim);
  }
  mesh('Erdgeschoss',cx,.025,8.5,14.42,.05,14.42,mats.stairStone);
  if(cx===balconyHouse){
   addFrontBalcony(THREE,scene,mats,mesh,floor,cx,front);
   floor(left+.4,right-.4,rear+.28,front,balconyLevel);
   mesh('Boden im Balkonzimmer',cx,balconyLevel-.016,8.5,14.28,.032,14.50,mats.stairStone);
  }
  mesh('Decke Erdgeschoss',cx,4.45,8.5,14.65,.18,14.68,mats.soffit);
 }
 house(-houseAxis);house(houseAxis);
 return {portico,surfaces,walls,doors};
}
