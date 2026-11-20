const openAngle = Math.PI * .51;

export function addFrenchDoors(THREE, scene, materials, glass, x, wallZ, outward, width, height) {
 const door = new THREE.Group();
 door.name = 'Automatische verglaste Flügeltür';
 // Hang the leaves at the inside edge of the stone reveal.
 door.position.set(x, 0, wallZ - outward * .32);
 scene.add(door);

 function piece(parent, name, material, x, y, z, width, height, depth) {
  const item = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),material);
  item.name = name;
  item.position.set(x,y,z);
  item.castShadow = material !== glass;
  item.receiveShadow = true;
  parent.add(item);
 }
 const frame = materials.paintedSash;
 const leafWidth = width/2 - .077;
 const leafHeight = height - .12;
 const leaves = [-1,1].map(side => {
  piece(door,'Türzarge',frame,side*(width/2-.033),height/2,0,.066,height,.114);
  const hinge = new THREE.Group();
  hinge.name = 'Türflügel';
  hinge.position.x = side*(width/2-.067);
  door.add(hinge);
  const center = -side*leafWidth/2;
  const rail = (y,h) => piece(hinge,'Querholz',frame,center,y,0,leafWidth,h,.084);
  for(const offset of [.043,leafWidth-.043]){
   piece(hinge,'Rahmenholz',frame,-side*offset,.044+leafHeight/2,0,.086,leafHeight,.088);
  }
  rail(.09,.092);
  rail(.51,.13);
  rail(.044+leafHeight-.043,.086);
  const glassBottom=.575,glassTop=.044+leafHeight-.086;
  piece(hinge,'Türglas',glass,center,(glassBottom+glassTop)/2,0,leafWidth-.17,glassTop-glassBottom,.022);
  piece(hinge,'Sockelfüllung',frame,center,.306,0,leafWidth-.16,.36,.048);
  piece(hinge,'Senkrechte Sprosse',frame,center,(glassTop+glassBottom)/2,0,.034,glassTop-glassBottom,.048);
  for(let n=1;n<=4;n++)rail(glassBottom+(glassTop-glassBottom)*n/5,.039);
  for(const face of [-1,1]){
   piece(hinge,'Messinggriff',materials.brass,-side*(leafWidth-.105),1.08,face*.071,.13,.042,.067);
  }
  return {hinge,side};
 });
 piece(door,'Oberer Türrahmen',frame,0,height-.034,0,width,.068,.114);
 let angle=0, open=false;

 return {
  update(dt,playerX,playerZ){
   const dx=Math.abs(playerX-x),dz=Math.abs(playerZ-door.position.z);
   open=dx<(open?2.35:1.8)&&dz<(open?4.05:3.4);
   const target=open?openAngle:0;
   const speed=dt*(open?2.75:1.9);
   const next=angle+THREE.MathUtils.clamp(target-angle,-speed,speed);
   if(next===angle)return false;
   angle=next;
   for(const {hinge,side} of leaves)hinge.rotation.y=-side*outward*angle;
   return true;
  },
  blocks(playerX,playerZ,radius){
   const dz=playerZ-door.position.z;
   return leaves.some(({hinge,side})=>{
    const dx=playerX-x-hinge.position.x;
    const ux=-side*Math.cos(angle),uz=-outward*Math.sin(angle);
    const along=THREE.MathUtils.clamp(dx*ux+dz*uz,0,leafWidth);
    return Math.hypot(dx-along*ux,dz-along*uz)<radius+.046;
   });
  }
 };
}
