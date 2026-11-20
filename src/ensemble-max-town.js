// Das Nordportal stammt aus dem Originalmodell des Herrenhauses V97.
export const houseAxis=19.6;

export function buildEnsemble(THREE, scene, source, mats, glass, gableMaterial=mats.facadeWall){
 const surfaces=[[-80,80,-90,95,0]], walls=[];
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
 portico.name='Originaler Nordportikus V97';
 scene.add(portico);
 source.updateMatrixWorld(true);
 source.traverse(obj=>{
  if(!obj.isMesh)return;
  const cube=/^Cube(\d+)$/.exec(obj.name);
  const cone=/^Cone(\d*)$/.exec(obj.name);
  const id=cube?Number(cube[1]):-1;
  if(!(id>=419&&id<=440)&&!(cone&&Number(cone[1])<=65)&&obj.name!=='Giebel')return;
  const part=obj.clone(false);
  obj.matrixWorld.decompose(part.position,part.quaternion,part.scale);
  if(cone)part.material=mats.columnFinish;
  else if(id>=433&&id<=438)part.material=mats.stairStone;
  else if(id===431)part.material=mats.soffit;
  else if(obj.name==='Giebel')part.material=gableMaterial;
  else part.material=mats.trim;
  part.castShadow=part.receiveShadow=true;
  portico.add(part);
  const bounds=new THREE.Box3().setFromObject(part);
  if(id>=433&&id<=438)floor(bounds.min.x,bounds.max.x,bounds.min.z,bounds.max.z,bounds.max.y);
  if(id>=419&&id<=429&&id%2===1){
   bounds.min.y=0;bounds.max.y=11.42;block(bounds);
  }
 });
 const terrace=new THREE.Box3().setFromObject(portico.getObjectByName('Cube433'));
 // Die Gartenstufen schließen am hinteren Rand auf Höhe der Originalterrasse an.
 for(let i=0;i<5;i++){
  const y=terrace.max.y*(5-i)/6,depth=.38;
  const z=terrace.min.z-depth*(i+.5);
  const step=mesh('Gartenstufe',0,y/2,z,16.60,y,depth,mats.stairStone);
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

 function house(cx){
  const width=15, left=cx-width/2,right=cx+width/2;
  const front=16,rear=1, thick=.55;
  const centers=[cx-4.4,cx,cx+4.4];
  for(const z of [front,rear]){
   const outward=z===front?1:-1;
   for(let i=0;i<3;i++){
    const y=i*4.5,top=y+4.5;
    let cursor=left;
    for(const x of centers){
     const entrance=x===cx&&i===0;
     const w=entrance?2.15:1.74;
     const lo=x-w/2,hi=x+w/2;
     const sill=entrance?0:y+1.01, lintel=entrance?3.02:y+3.47;
     mesh('Kalksteinfassade',(cursor+lo)/2,(y+top)/2,z,lo-cursor,top-y,thick,mats.facadeWall,true);
     mesh('Fenstersturz',x,(top+lintel)/2,z,w,top-lintel,thick,mats.facadeWall,true);
     if(!entrance){
      mesh('Fensterbrüstung',x,(sill+y)/2,z,w,sill-y,thick,mats.facadeWall,true);
      mesh('Fensterglas',x,(sill+lintel)/2,z,w-.035,lintel-sill,.035,glass,true).castShadow=false;
      const gridFace=z+outward*.085;
      for(let k=0;k<=4;k++)mesh('Fenstersprosse',lo+w*k/4,(sill+lintel)/2,gridFace,.039,lintel-sill,.09,mats.paintedSash);
      for(let k=0;k<=5;k++)mesh('Fenstersprosse',x,sill+(lintel-sill)*k/5,gridFace,w,.044,.09,mats.paintedSash);
      mesh('Sohlbank',x,sill-.04,z+outward*.28,w+.31,.15,.41,mats.windowStone);
     }
     for(const sign of [-1,1])mesh('Laibungsprofil',x+sign*(w/2+.065),(sill+lintel)/2,z+outward*.28,.13,lintel-sill,.16,mats.trim);
     mesh('Sturzprofil',x,lintel+.055,z+outward*.29,w+.32,.14,.19,mats.trim);
     cursor=hi;
    }
    mesh('Kalksteinfassade',(cursor+right)/2,(y+top)/2,z,right-cursor,top-y,thick,mats.facadeWall,true);
   }
   for(const y of [4.5,9,13.36])mesh('Gesims',cx,y,z,width+.10,.15,.72,mats.trim);
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
   for(const y of [4.5,9,13.36])mesh('Seitengesims',x,y,8.5,.56,.15,15.1,mats.trim);
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
  }
  for(const [y,w,d,h] of [[13.38,15.22,15.43,.12],[13.54,15.52,15.70,.20],[13.69,15.68,15.84,.10]]){
   mesh('Mehrstufiges Dachgesims',cx,y,8.5,w,h,d,mats.trim);
  }
  mesh('Zinkdach',cx,13.80,8.5,15.42,.14,15.56,mats.roof);
  for(const offset of [-4.1,4.1]){
   mesh('Schornstein',cx+offset,14.39,7.6,1.07,1.2,.93,mats.facadeWall);
   mesh('Schornsteinkrone',cx+offset,15.03,7.6,1.29,.18,1.17,mats.trim);
  }
  mesh('Erdgeschoss',cx,.025,8.5,14.42,.05,14.42,mats.stairStone);
  mesh('Decke Erdgeschoss',cx,4.47,8.5,14.65,.18,14.68,mats.soffit);
 }
 house(-houseAxis);house(houseAxis);
 return {portico,surfaces,walls};
}
