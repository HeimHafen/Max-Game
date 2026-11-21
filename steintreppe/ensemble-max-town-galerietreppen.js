import {addGalleryStair,stairOpening} from './galerie.js';
import {houseWidth,houseFront,houseRear,houseMiddle,sideWindowCenters,frontPartition,rearPartition,terraceHalf,terraceDepth} from './house-layout.js';
import {addEntranceHall} from './entrance-hall.js';
import {addFrontBalcony,balconyLevel} from './front-balcony-v2.js';
import {addEntranceLanterns} from './entrance-lanterns-v2.js';
import {addPortalDoors,createOakFinish} from './portal-doors-v2.js';
import {addPorticoColumn} from './portico-columns-v2.js';

// Das Nordportal stammt aus dem Originalmodell des Herrenhauses V97.

export const houseAxis=12.1+houseWidth/2;
export const upperFloor=9.06;
export const atticFloor=13.79;

export function buildEnsemble(THREE, scene, source, mats, glass, gableMaterial=mats.facadeWall){
 const surfaces=[[-80,80,-90,95,0]];
 const walls=[],doors=[];
 function floor(l,r,n,f,y,contains){surfaces.push([l,r,n,f,y,contains]);}
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
 const entranceOak=createOakFinish(THREE,0xc39665);
 // Use the standard WebGL material for the roof shell, including on mobile Safari.
 const roofCover=new THREE.MeshStandardMaterial({
  color:0x59616a,roughness:.88,metalness:.07,
  map:mats.roof.map,side:THREE.DoubleSide
 });
 const slateMap=new THREE.TextureLoader().load('./assets/exterior/roof_slate.jpg');
 slateMap.wrapS=slateMap.wrapT=THREE.RepeatWrapping;
 slateMap.colorSpace=THREE.SRGBColorSpace;
 slateMap.anisotropy=8;
 const planterStone=new THREE.MeshStandardMaterial({color:0xd7c7a5,roughness:.87});
 const soil=new THREE.MeshStandardMaterial({color:0x32251a,roughness:1});
 const foliage=new THREE.MeshStandardMaterial({color:0x46592b,roughness:.89});
 const citrus=new THREE.MeshStandardMaterial({color:0xca8b2c,roughness:.72});
 const slate=roofCover.clone();
 slate.map=slateMap;
 slate.color.setHex(0x858b94);
 function house(cx){
  const width=houseWidth, left=cx-width/2,right=cx+width/2;
  const front=houseFront,rear=houseRear, thick=.55;
  
  for(const z of [front,rear]){
   const outward=z===front?1:-1;
   const referenceFace=z===front;
   for(let i=0;i<3;i++){
    const y=i*4.5,top=y+4.5;
    let cursor=left;
    const centers=(!referenceFace&&i===0?[-9.3,0,9.3]:[-9.3,-4.65,0,4.65,9.3]).map(offset=>cx+offset);
    for(const x of centers){
     if(!referenceFace&&i===0&&x===cx){
      const lo=cx-terraceHalf,hi=cx+terraceHalf;
      mesh('Kalksteinfassade',(cursor+lo)/2,2.25,z,lo-cursor,4.5,thick,mats.facadeWall,true);
      mesh('Sturz des Terrassenzimmers',cx,4.35,z,2*terraceHalf,.30,thick,mats.facadeWall,true);
      cursor=hi;
      continue;
     }
     const entrance=referenceFace&&x===cx&&i===0;
     const balconyDoor=x===cx&&z===front&&i===1;
     const w=entrance?2.15:balconyDoor?2.44:1.69;
     const lo=x-w/2,hi=x+w/2;
     const sill=entrance?0:balconyDoor?balconyLevel:y+(i===0?.68:.76), lintel=entrance?3.02:balconyDoor?balconyLevel+3.25:y+3.67;
     mesh('Kalksteinfassade',(cursor+lo)/2,(y+top)/2,z,lo-cursor,top-y,thick,mats.facadeWall,true);
     mesh('Fenstersturz',x,(top+lintel)/2,z,w,top-lintel,thick,mats.facadeWall,true);
     if(balconyDoor){
      doors.push(addPortalDoors(THREE,scene,mats,glass,x,z,outward,w,lintel-sill,null,sill));
     }else if(!entrance){
      mesh('Fensterbrüstung',x,(sill+y)/2,z,w,sill-y,thick,mats.facadeWall,true);
      mesh('Fensterglas',x,(sill+lintel)/2,z,w+.004,lintel-sill+.004,.035,glass,true).castShadow=false;
      const gridFace=z+outward*.037;
      for(let k=0;k<=2;k++)mesh('Fenstersprosse',lo+w*k/2,(sill+lintel)/2,gridFace,k===1?.067:.082,lintel-sill,.12,mats.paintedSash);
      for(let k=0;k<=3;k++)mesh('Fenstersprosse',x,sill+(lintel-sill)*k/3,gridFace,w,k===0||k===3?.08:.038,.11,mats.paintedSash);
      mesh('Sohlbank',x,sill-.04,z+outward*.28,w+.31,.15,.41,mats.windowStone);
     }
     for(const sign of [-1,1])mesh('Laibungsprofil',x+sign*(w/2+.065),(sill+lintel)/2,z+outward*.28,.13,lintel-sill,.16,mats.trim);
     mesh('Sturzprofil',x,lintel+.055,z+outward*.29,w+.32,.14,.19,mats.trim);
     if(!entrance){
      for(const sign of [-1,1]){
       mesh('Profiliertes Kalksteingewände',x+sign*(w/2+.144),(sill+lintel)/2,z+outward*.301,.07,lintel-sill,.19,mats.windowStone);
      }
      mesh('Schmales Fensterkranzgesims',x,lintel+.115,z+outward*.35,w+.45,.087,.27,mats.trim);
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
    // Die Stirnwände der Eingangshalle bleiben im Erdgeschoss geschlossen.
    const windowCenters=i===0?sideWindowCenters.filter(z=>z+.84<rearPartition-.12||z-.84>frontPartition+.12):sideWindowCenters;
    const arches=i===0?[houseMiddle]:[];
    for(const z of [...windowCenters,...arches].sort((a,b)=>a-b)){
     if(arches.includes(z)){
      const half=1.28,sill=.18,spring=2.61,apex=spring+half;
      const lo=z-half,hi=z+half;
      mesh('Seitenwand',x,2.25,(cursor+lo)/2,.48,4.5,lo-cursor,mats.facadeWall,true);
      mesh('Rundbogenfenster-Brüstung',x,sill/2,z,.48,sill,2*half,mats.facadeWall,true);
      function shaped(name,shape,depth,xFace,material){
       const item=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:32}),material);
       item.name=name;item.rotation.y=-Math.PI/2;item.position.set(xFace,0,z);
       item.castShadow=material!==glass;item.receiveShadow=true;scene.add(item);
      }
      const pane=new THREE.Shape();
      pane.moveTo(-half,sill);pane.lineTo(half,sill);pane.lineTo(half,spring);
      pane.absarc(0,spring,half,0,Math.PI,false);pane.closePath();
      shaped('Rundbogenglas',pane,.025,x+.012,glass);
      mesh('Kollision Rundbogenfenster',x,(sill+apex)/2,z,.045,apex-sill,2*half,glass,true).visible=false;
      const crown=new THREE.Shape();
      crown.moveTo(-half,spring);crown.absarc(0,spring,half,Math.PI,0,true);
      crown.lineTo(half,4.5);crown.lineTo(-half,4.5);crown.closePath();
      shaped('Mauerwerk über Rundbogen',crown,.48,x+.24,mats.facadeWall);
      for(const d of [-1,1]){
       mesh('Rundbogenpfosten',x,(sill+spring)/2,z+d*(half-.035),.17,spring-sill,.07,mats.paintedSash);
      }
      for(const y of [sill,.81,1.42,2.02,spring])mesh('Rundbogen-Quersprosse',x,y,z,.12,.055,2*half,mats.paintedSash);
      mesh('Rundbogen-Mittelsprosse',x,(sill+apex)/2,z,.12,apex-sill,.055,mats.paintedSash);
      const rim=new THREE.Shape();
      rim.moveTo(half-.055,spring);rim.absarc(0,spring,half-.055,0,Math.PI,false);
      rim.lineTo(-half-.10,spring);rim.absarc(0,spring,half+.10,Math.PI,0,true);rim.closePath();
      const sash=new THREE.Shape();
      sash.moveTo(half-.13,spring);sash.absarc(0,spring,half-.13,0,Math.PI,false);
      sash.lineTo(-half-.012,spring);sash.absarc(0,spring,half+.012,Math.PI,0,true);sash.closePath();
      shaped('Anthrazitfarbener Bogenrahmen',sash,.14,x+.07,mats.paintedSash);
      shaped('Profilierter Steinbogen' ,rim,.56,x+.28,mats.trim);
      mesh('Rundbogenfensterbank',x,sill-.03,z,.64,.13,2*half+.25,mats.windowStone);
      cursor=hi;
      continue;
     }
     const w=1.68,lo=z-w/2,hi=z+w/2;
     mesh('Seitenwand',x,(y+top)/2,(cursor+lo)/2,.48,top-y,lo-cursor,mats.facadeWall,true);
     mesh('Seitliche Fensterbrüstung',x,(y+sill)/2,z,.48,sill-y,w,mats.facadeWall,true);
     mesh('Seitlicher Fenstersturz',x,(lintel+top)/2,z,.48,top-lintel,w,mats.facadeWall,true);
     mesh('Seitliches Fensterglas',x+side*.06,(sill+lintel)/2,z,.036,lintel-sill+.004,w+.004,glass,true).castShadow=false;
     for(let k=0;k<=2;k++)mesh('Seitliche Fenstersprosse',x+side*.097,(sill+lintel)/2,lo+k*w/2,.09,lintel-sill,.04,mats.paintedSash);
     for(let k=0;k<=3;k++)mesh('Seitliche Fenstersprosse',x+side*.097,sill+k*(lintel-sill)/3,z,.09,.043,w,mats.paintedSash);
     mesh('Seitliche Sohlbank',x+side*.25,sill-.055,z,.46,.14,w+.31,mats.windowStone);
     for(const edge of [lo-.05,hi+.05])mesh('Seitliche Laibung',x+side*.25,(sill+lintel)/2,edge,.15,lintel-sill,.105,mats.trim);
     mesh('Seitliches Sturzprofil',x+side*.25,lintel+.06,z,.21,.15,w+.32,mats.trim);
     cursor=hi;
    }
    mesh('Seitenwand',x,(y+top)/2,(cursor+front)/2,.48,top-y,front-cursor,mats.facadeWall,true);
   }
   mesh('Seitlicher Sockel',x+side*.07,.29,houseMiddle,.55,.58,width+.1,mats.shade);

  }
  for(const z of [front,rear]){
   const outward=z===front?1:-1;
   const gap=z===front?1.10:terraceHalf;
   const axis=z===front?cx:cx;
   for(const [lo,hi] of [[left,axis-gap],[axis+gap,right]]){
    mesh('Fassadensockel',(lo+hi)/2,.29,z+outward*.10,hi-lo,.58,.48,mats.shade);
   }
   if(z===rear)continue;
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
   doors.push(addPortalDoors(THREE,scene,mats,glass,cx,z,outward,2.15,3.02,z===front?entranceOak:null));
   mesh('Eingangsschwelle',cx,.012,z,2.15,.044,.88,mats.stairStone);
  }
  for(const [y,projection,height] of [[4.44,.12,.19],[4.57,.18,.08],[9.02,.085,.13]]){
   for(const z of [front,rear]){
    if(z===front&&y<5){
     const span=(width+2*projection-2.46)/2;
     for(const sign of [-1,1])mesh('Umlaufendes Gurtgesims',cx+sign*(1.23+span/2),y,z,span,height,thick+2*projection,mats.trim);
    }else mesh('Umlaufendes Gurtgesims',cx,y,z,width+2*projection,height,thick+2*projection,mats.trim);
   }
   for(const x of [left+.17,right-.17]){
    mesh('Seitliches Gurtgesims',x,y,houseMiddle,.48+2*projection,height,width-.02,mats.trim);
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
   mesh('Mehrstufiges Dachgesims',cx,y,houseMiddle,width+w-15,h,width+d-15,mats.trim);
  }
  mesh('Traufblech',cx,13.752,houseMiddle,width+.5,.045,width+.64,roofCover);
  const eave=13.77,ridge=21.45;
  const eaveX=width/2+.25;
  const points=[
   [-eaveX,eave,rear-.32],[eaveX,eave,rear-.32],[eaveX,eave,front+.32],[-eaveX,eave,front+.32],
   [-8.85,ridge,houseMiddle],[8.85,ridge,houseMiddle]
  ];
  for(let i=-19;i<=19;i++){
   for(const z of [rear-.34,front+.34]){
    mesh('Zahnfries unter der Traufe',cx+i*.64,13.33,z,.23,.16,.22,mats.trim);
   }
   for(const x of [left-.34,right+.34]){
    mesh('Zahnfries unter der Traufe',x,13.33,houseMiddle+i*.64,.22,.16,.23,mats.trim);
   }
  }
  const roofGeometry=new THREE.BufferGeometry();
  const dormers=[-8.8,-4.4,0,4.4,8.8];
  const run=front+.32-houseMiddle;
  const rise=ridge-eave;
  const dormerFace=10.19;
  const dormerHead=17.11;
  const backCut=run*(ridge-dormerHead)/rise;
  const vertices=[],uv=[];
  function triangle(a,b,c){
   for(const [x,y,z] of [a,b,c]){
    vertices.push(x,y,z);
    uv.push(x*.25,Math.sign(z-houseMiddle)*Math.hypot(z-houseMiddle,ridge-y)*.25);
   }
  }
  function quad(a,b,c,d){triangle(a,b,c);triangle(a,c,d);}
  triangle(points[1],points[5],points[2]);
  triangle(points[3],points[4],points[0]);
  for(const side of [-1,1]){
   function onSlope(x,t){return [x,ridge-t/run*rise,houseMiddle+side*t];}
   function edge(sign,t){return sign*(8.85+(eaveX-8.85)*t/run);}
   const bandCuts=[0,backCut,dormerFace,run];
   for(let i=0;i<3;i++){
    const t0=bandCuts[i],t1=bandCuts[i+1];
    if(i!==1){
     const band=[onSlope(edge(-1,t0),t0),onSlope(edge(1,t0),t0),
      onSlope(edge(1,t1),t1),onSlope(edge(-1,t1),t1)];
     if(side>0)band.reverse();
     quad(...band);
     continue;
    }
    let lower=edge(-1,t0),upper=edge(-1,t1);
    for(const offset of dormers){
     const lo=offset-.88,hi=offset+.88;
     const band=[onSlope(lower,t0),onSlope(lo,t0),onSlope(lo,t1),onSlope(upper,t1)];
     if(side>0)band.reverse();
     quad(...band);
     lower=upper=hi;
    }
    const band=[onSlope(lower,t0),onSlope(edge(1,t0),t0),onSlope(edge(1,t1),t1),onSlope(upper,t1)];
    if(side>0)band.reverse();
    quad(...band);
   }
  }
  roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  roofGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  roofGeometry.computeVertexNormals();
  const roof=new THREE.Mesh(roofGeometry,slate);
  roof.position.x=cx;
  roof.name='Steiles anthrazitfarbenes Walmdach';
  roof.castShadow=roof.receiveShadow=true;
  scene.add(roof);
  function roofFlashing(name,start,end,radius){
   const from=new THREE.Vector3(cx+start[0],start[1]+.035,start[2]);
   const to=new THREE.Vector3(cx+end[0],end[1]+.035,end[2]);
   const direction=to.clone().sub(from);
   const profile=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length()+.10,8),roofCover);
   profile.name=name;
   profile.position.copy(from).lerp(to,.5);
   profile.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
   profile.castShadow=profile.receiveShadow=true;
   scene.add(profile);
  }
  roofFlashing('Firstabdeckung',points[4],points[5],.11);
  for(let i=0;i<4;i++){
   roofFlashing('Gratabdeckung',points[i],points[i===0||i===3?4:5],.085);
   roofFlashing('Umlaufende Dachrinne',points[i],points[(i+1)%4],.091);
  }
  for(const offset of [-4.1,4.1]){
   mesh('Schornstein',cx+offset,21.15,houseMiddle-.8,1.07,2.0,.93,mats.facadeWall);
   mesh('Schornsteinkrone',cx+offset,22.21,houseMiddle-.8,1.29,.18,1.17,mats.trim);
  }
  for(const side of [-1,1])for(const offset of dormers){
   const x=cx+offset,z=houseMiddle+side*9.40,face=z+side*.79;
   for(const jamb of [-.92,.92]){
    mesh('Schieferwange der Gaube',x+jamb,16.13,z-side*.74,.10,1.96,3.06,roofCover);
   }
   mesh('Gaubenbrüstung',x,15.30,face,1.92,.44,.14,roofCover,true);
   mesh('Gaubensturz',x,17.055,face,1.92,.11,.14,roofCover);
   mesh('Seitlicher Fensterrahmen',x-.81,16.27,face,.18,1.53,.14,mats.paintedSash);
   mesh('Seitlicher Fensterrahmen',x+.81,16.27,face,.18,1.53,.14,mats.paintedSash);
   mesh('Gaubenfenster',x,16.27,face+side*.045,1.44,1.48,.04,glass,true).castShadow=false;
   for(const dx of [-.71,0,.71])mesh('Gaubenpfosten',x+dx,16.27,face+side*.063,.073,1.49,.10,mats.paintedSash);
   for(const y of [15.54,16.27,17])mesh('Gaubenquerriegel',x,y,face+side*.064,1.49,.064,.10,mats.paintedSash);
   mesh('Gaubensohlbank',x,15.49,face,1.61,.115,.29,roofCover);
   const gable=new THREE.Shape();
   gable.moveTo(-1.06,0);gable.lineTo(1.06,0);gable.lineTo(0,.51);gable.closePath();
   const cap=new THREE.Mesh(new THREE.ExtrudeGeometry(gable,{depth:3.22,bevelEnabled:false}),roofCover);
   cap.name='Giebeldach der Gaube';
   cap.position.set(x,17.11,z-side*.73-1.61);
   cap.castShadow=cap.receiveShadow=true;scene.add(cap);
  }
  // The plinth walls keep the player clear of the low eaves.
  const walkHalf=10.95, walkRun=8.88;
  for(const offset of [-6.5,6.5]){
   const light=new THREE.PointLight(0xffebcc,38,11,2);
   light.position.set(cx+offset,atticFloor+3.2,houseMiddle);
   scene.add(light);
  }
  mesh('Dachgeschossboden',cx,atticFloor-.10,houseMiddle,2*walkHalf+.22,.20,2*dormerFace+.27,oak);
  floor(cx-walkHalf,cx+walkHalf,houseMiddle-dormerFace,houseMiddle+dormerFace,atticFloor);
  for(const side of [-1,1]){
   mesh('Seitliche Abseitenwand',cx+side*walkHalf,atticFloor+1.08,houseMiddle,.18,2.16,2*dormerFace,mats.soffit,true);
   let cursor=-walkHalf;
   for(const offset of dormers){
    const lo=offset-.87,hi=offset+.87;
    mesh('Drempelwand zwischen den Gauben',cx+(cursor+lo)/2,atticFloor+1.08,houseMiddle+side*walkRun,lo-cursor,2.16,.16,mats.soffit,true);
    for(const jamb of [lo,hi]){
     mesh('Innenlaibung der Dachgaube',cx+jamb,atticFloor+1.05,houseMiddle+side*(walkRun+dormerFace)/2,.09,2.10,dormerFace-walkRun,mats.soffit,true);
    }
    mesh('Fensterbrüstung innen',cx+offset,atticFloor+.87,houseMiddle+side*dormerFace,hi-lo,1.74,.16,mats.soffit,true);
    cursor=hi;
   }
   mesh('Eckdrempel',cx+(cursor+walkHalf)/2,atticFloor+1.08,houseMiddle+side*walkRun,walkHalf-cursor,2.16,.16,mats.soffit,true);
  }
  const bayX=cx,doorZ=rear-terraceDepth;
  const halfDoor=1.70;
  const line=[
   [-terraceHalf,-rear],[-terraceHalf,-doorZ],[-halfDoor,-doorZ],
   [halfDoor,-doorZ],[terraceHalf,-doorZ],[terraceHalf,-rear]
  ];
  function solidProfile(name,outline,base,height,material){
   const shape=new THREE.Shape(outline.map(([u,v])=>new THREE.Vector2(u,v)));
   const item=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}),material);
   item.name=name;item.rotation.x=-Math.PI/2;item.position.set(bayX,base,0);
   item.castShadow=item.receiveShadow=true;scene.add(item);
  }
  const plan=[[-terraceHalf,-rear-.36],...line,[terraceHalf,-rear-.36]];
  solidProfile('Kalksteinboden des Erkers',[[-terraceHalf,-rear-.28],...line,[terraceHalf,-rear-.28]],-.06,.11,mats.stairStone);
  solidProfile('Geschlossene Erkerdecke',plan,4.13,.12,roofCover);
  solidProfile('Helle Erkeruntersicht',plan,4.10,.04,mats.soffit);
  const roofDepth=terraceDepth+.39,roofZ=doorZ+roofDepth/2-.13;
  const roofSlope=.17;
  const shed=mesh('Flach geneigtes Stehfalzdach',bayX,4.39,roofZ,2*terraceHalf+.39,.13,roofDepth,roofCover);
  shed.rotation.x=-roofSlope;
  for(let i=-9;i<=9;i++){
   const seam=mesh('Stehfalz der Orangerie',bayX+i*.67,4.463,roofZ,.031,.033,roofDepth-.04,roofCover);
   seam.rotation.x=-roofSlope;
  }
  for(let i=0;i<line.length-1;i++){
   const [a,pa]=line[i],[b,pb]=line[i+1],za=-pa,zb=-pb;
   if(a===-halfDoor&&b===halfDoor)continue;
   const w=Math.hypot(b-a,zb-za),x=bayX+(a+b)/2,z=(za+zb)/2;
   const angle=Math.atan2(za-zb,b-a);
   for(const [name,y,h,d,material] of [
    ['Orangeriesockel aus Kalkstein',.24,.48,.31,mats.facadeWall],
    ['Profilierte Fensterbank',.48,.12,.40,mats.trim],
    ['Orangerieverglasung',2.19,3.36,.024,glass],
    ['Unterer Rahmen des Fensters',.53,.078,.105,mats.paintedSash],
    ['Oberer Rahmen des Fensters',3.86,.084,.105,mats.paintedSash],
    ['Kalksteinsturz des Erkers',3.98,.25,.34,mats.facadeWall],
    ['Umlaufendes Erkerprofil',4.105,.14,.44,mats.trim],
    ['Anthrazitfarbene Dachkante',4.215,.08,.40,roofCover]
   ]){
    const piece=mesh(name,x,y,z,w+.04,h,d,material);
    piece.rotation.y=angle;
    if(material===glass)piece.castShadow=false;
   }
   for(const split of [-.25,0,.25]){
    const bar=mesh('Feine Orangeriesprosse',x+split*(b-a),2.19,z+split*(zb-za),split===0?.095:.043,3.36,.105,mats.paintedSash);
    bar.rotation.y=angle;
   }
   for(const y of [1.34,2.19,3.04]){
    mesh('Orangerie-Quersprosse',x,y,z,w+.035,.046,.103,mats.paintedSash).rotation.y=angle;
   }
   mesh('Kollision Erkerfenster',x,2.12,z,b-a+.045,4.24,Math.abs(zb-za)+.09,mats.facadeWall,true).visible=false;

  }
  for(const [u,v] of line){
   mesh('Anthrazitfarbener Erkerpfosten',bayX+u,2.19,-v,.12,3.38,.12,mats.paintedSash);
  }
  // Keep the walkable middle axis clear between the two potted trees.
  for(const side of [-1,1]){
   const x=bayX+side*(terraceHalf-1.05),z=doorZ+.94;
   const place=(name,geometry,material,dx,y,dz)=>{
    const item=new THREE.Mesh(geometry,material);
    item.name=name;
    item.position.set(x+dx,y,z+dz);
    item.castShadow=item.receiveShadow=true;
    scene.add(item);
   };
   place('Kalksteinpflanzgefäß',new THREE.CylinderGeometry(.34,.25,.58,20),planterStone,0,.34,0);
   place('Pflanzerde',new THREE.CylinderGeometry(.31,.31,.025,20),soil,0,.63,0);
   place('Stamm des Zitrusbäumchens',new THREE.CylinderGeometry(.031,.048,.76,8),oak,0,1,0);
   const leafCluster=new THREE.IcosahedronGeometry(.24,1);
   const fruit=new THREE.SphereGeometry(.043,8,6);
   for(let i=0;i<11;i++){
    const angle=i*2.4,radius=i<2?.07:.28;
    const dx=radius*Math.cos(angle),dz=radius*Math.sin(angle);
    const y=1.35+i%4*.14;
    place('Laub des Zitrusbäumchens',leafCluster,foliage,dx,y,dz);
    if(i%2===0)place('Zitrusfrucht',fruit,citrus,dx*1.55,y-.085,dz*1.55);
   }
   block(new THREE.Box3(new THREE.Vector3(x-.34,.05,z-.34),new THREE.Vector3(x+.34,.65,z+.34)));
  }
  floor(bayX-terraceHalf,bayX+terraceHalf,doorZ,rear+.35,.05);
  floor(bayX-halfDoor,bayX+halfDoor,doorZ-.24,doorZ,.05);
  mesh('Erker-Türsturz',bayX,3.98,doorZ,2*halfDoor+.035,.25,.33,mats.facadeWall,true);
  mesh('Gesims über der Terrassentür',bayX,4.18,doorZ,2*halfDoor+.08,.135,.44,mats.trim);
  mesh('Dachkante über der Terrassentür',bayX,4.37,doorZ,2*halfDoor+.08,.18,.40,roofCover);
  mesh('Terrassenschwelle',bayX,.025,doorZ,2*halfDoor,.05,.53,mats.stairStone);
  doors.push(addPortalDoors(THREE,scene,mats,glass,bayX,doorZ,-1,2*halfDoor,3.855,null));
  for(const [level,height] of [[.05,.05],[balconyLevel,.20],[upperFloor,.20]]){
   const half=width/2-.38;
   const bounds=[cx-half,cx+half,rear+.28,front-.26];
   const [l,r,n,f]=bounds;
   const sections=cx>0&&level===balconyLevel?[
    [l,cx+stairOpening[0],n,f],[cx+stairOpening[1],r,n,f],
    [cx+stairOpening[0],cx+stairOpening[1],n,stairOpening[2]],
    [cx+stairOpening[0],cx+stairOpening[1],stairOpening[3],f]
   ]:[bounds];
   for(const [left,right,rear,front] of sections){
    mesh('Geschossboden',(left+right)/2,level-height/2,(rear+front)/2,right-left,height,front-rear,mats.stairStone);
    floor(left,right,rear,front,level);
   }
  }
  if(cx>0)addGalleryStair(THREE,scene,mats,mesh,floor,cx,balconyLevel);
  floor(cx-1.22,cx+1.22,front-.28,front+.17,balconyLevel);
  addEntranceHall(THREE,scene,mats,mesh,cx,width/2-.17,glass,doors);
  addFrontBalcony(THREE,scene,mats,mesh,floor,cx,front);
 }
 house(-houseAxis);house(houseAxis);

 return {portico,surfaces,walls,doors};
}
