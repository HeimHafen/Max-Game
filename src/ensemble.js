// Das Nordportal stammt aus dem Originalmodell des Herrenhauses V97.
export function buildEnsemble(THREE, scene, source, mats, glass){
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
  else if(obj.name==='Giebel')part.material=mats.facadeWall;
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
  mesh('Gartenstufe',0,y/2,z,16.60,y,depth,mats.stairStone);
  floor(-8.3,8.3,z-depth/2-.001,z+depth/2+.001,y);
 }

 function house(cx){
  const width=15, left=cx-width/2,right=cx+width/2;
  const front=16,rear=1, height=13.5, thick=.55;
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
  for(const x of [left+.17,right-.17]){
   mesh('Seitenwand',x,height/2,8.5,.48,height,15,mats.facadeWall,true);
   for(const y of [4.5,9,13.36])mesh('Seitengesims',x,y,8.5,.56,.15,15.1,mats.trim);
  }
  mesh('Dachgesims',cx,13.52,8.5,15.48,.27,15.57,mats.trim);
  mesh('Zinkdach',cx,13.72,8.5,15.16,.14,15.33,mats.roof);
  for(const offset of [-4.1,4.1]){
   mesh('Schornstein',cx+offset,14.39,7.6,1.07,1.2,.93,mats.facadeWall);
   mesh('Schornsteinkrone',cx+offset,15.03,7.6,1.29,.18,1.17,mats.trim);
  }
  mesh('Erdgeschoss',cx,.025,8.5,14.42,.05,14.42,mats.stairStone);
  mesh('Decke Erdgeschoss',cx,4.47,8.5,14.65,.18,14.68,mats.soffit);
 }
 house(-18);house(18);
 return {portico,surfaces,walls};
}
