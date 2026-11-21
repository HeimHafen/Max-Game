const openAngle = Math.PI * .51;

export function createOakFinish(THREE, color=0x996235) {
 const oak = new THREE.MeshStandardMaterial({color,roughness:.59});
 oak.onBeforeCompile = shader => {
  shader.vertexShader = 'varying vec2 oakUv;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\noakUv = uv;');
  shader.fragmentShader = 'varying vec2 oakUv;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
   #include <color_fragment>
   float u = oakUv.x + .012*sin(oakUv.y*8.0+oakUv.x*9.0)
     + .005*sin(oakUv.y*17.0+oakUv.x*29.0);
   float grain = sin(u*158.0+2.0*sin(u*37.0))*.065;
   float pores = pow(.5+.5*sin(u*470.0+sin(oakUv.y*27.0)),12.0)*.085;
   diffuseColor.rgb *= .96 + grain + .09*sin(u*25.0) - pores;`);
 };
 oak.customProgramCacheKey = () => 'max-town-oak-grain';
 return oak;
}

export function addPortalDoors(THREE, scene, materials, glass, x, wallZ, outward, width, height, oak, level=0, finish={}) {
 const door = new THREE.Group();
 door.name = oak ? 'Massive Eichentür' : 'Automatische verglaste Flügeltür';
 // Hang the leaves at the inside edge of the stone reveal.
 door.position.set(x, level, wallZ - outward * (finish.inset ?? .32));
 scene.add(door);

 function piece(parent, name, material, x, y, z, width, height, depth) {
  const item = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),material);
  item.name = name;
  item.position.set(x,y,z);
  item.castShadow = material !== glass;
  item.receiveShadow = true;
  parent.add(item);
 }
 const frame = oak ?? finish.frame ?? materials.paintedSash;
 const leafWidth = width/2 - .077;
 const leafHeight = height - .12;
 const leaves = [-1,1].map(side => {
  piece(door,'Türzarge',frame,side*(width/2-.033),height/2,0,.066,height,.114);
  const hinge = new THREE.Group();
  hinge.name = 'Türflügel';
  hinge.position.x = side*(width/2-.067);
  door.add(hinge);
  const center = -side*leafWidth/2;
  if(oak){
   piece(hinge,'Massiver Eichenflügel',oak,center,.044+leafHeight/2,0,leafWidth,leafHeight,.105);
   for(const face of [-1,1]){
    for(const [bottom,top] of [[.22,.92],[1.29,2.73]]){
     const y=(bottom+top)/2,h=top-bottom,w=leafWidth-.245;
     piece(hinge,'Eichenfüllung',oak,center,y,face*.065,w-.082,h-.082,.038);
     for(const side of [-1,1]){
      piece(hinge,'Aufgesetztes Kassettenprofil',oak,center+side*(w/2-.022),y,face*.064,.044,h,.064);
      piece(hinge,'Aufgesetztes Kassettenprofil',oak,center,y+side*(h/2-.022),face*.064,w-.088,.044,.064);
     }
    }
   }
  }else{
   const rail = (y,h) => piece(hinge,'Querholz',frame,center,y,0,leafWidth,h,.084);
   for(const offset of [.043,leafWidth-.043]){
    piece(hinge,'Rahmenholz',frame,-side*offset,.044+leafHeight/2,0,.086,leafHeight,.088);
   }
   rail(.09,.092);
   if(!finish.fullGlass)rail(.51,.13);
   rail(.044+leafHeight-.043,.086);
   const glassBottom=finish.fullGlass?.136:.575,glassTop=.044+leafHeight-.086;
   piece(hinge,'Türglas',glass,center,(glassBottom+glassTop)/2,0,leafWidth-.17,glassTop-glassBottom,.022);
   if(!finish.fullGlass)piece(hinge,'Sockelfüllung',frame,center,.306,0,leafWidth-.16,.36,.048);
   piece(hinge,'Senkrechte Sprosse',frame,center,(glassTop+glassBottom)/2,0,.034,glassTop-glassBottom,.048);
   const panes=finish.fullGlass?4:5;
   for(let n=1;n<panes;n++)rail(glassBottom+(glassTop-glassBottom)*n/panes,finish.fullGlass?.025:.039);
  }
  for(const face of [-1,1]){
   const gripX=-side*(leafWidth-.105);
   if(finish.fullGlass){
    for(const y of [.96,1.23])piece(hinge,'Messinghalter',materials.brass,gripX,y,face*.063,.031,.035,.063);
    piece(hinge,'Senkrechter Messinggriff',materials.brass,gripX,1.095,face*.102,.023,.30,.024);
   }else if(oak){
    piece(hinge,'Messingschild der Eichentür',materials.brass,gripX,1.08,face*.057,.061,.21,.02);
    const knob=new THREE.Mesh(new THREE.SphereGeometry(.043,16,10),materials.brass);
    knob.name='Runder Messingknauf';
    knob.position.set(gripX,1.08,face*.117);
    knob.scale.set(1,1,.75);
    knob.castShadow=true;
    hinge.add(knob);
   }else if(finish.handle){
    piece(hinge,'Schwarze Griffrosette',finish.handle,gripX,1.08,face*.047,.052,.064,.014);
    piece(hinge,'Schwarzer Griffhals',finish.handle,gripX,1.08,face*.071,.032,.034,.053);
    piece(hinge,'Schwarzer Türdrücker',finish.handle,gripX+side*.044,1.08,face*.095,.12,.028,.035);
   }else{
    piece(hinge,'Messinggriff',materials.brass,gripX,1.08,face*(oak?.092:.071),.13,.042,.067);
   }
  }
  return {hinge,side};
 });
 piece(door,'Oberer Türrahmen',frame,0,height-.034,0,width,.068,.114);
 let angle=0, open=false;

 return {
  update(dt,playerX,playerZ,playerY=0){
   const dx=Math.abs(playerX-x),dz=Math.abs(playerZ-door.position.z);
   const activationDistance=finish.activationDistance??3.4;
   open=Math.abs(playerY-level)<1 && dx<(open?2.35:1.8)&&dz<activationDistance+(open?.65:0);
   const target=open?openAngle:0;
   const speed=dt*(open?2.75:1.9);
   const next=angle+THREE.MathUtils.clamp(target-angle,-speed,speed);
   if(next===angle)return false;
   angle=next;
   for(const {hinge,side} of leaves)hinge.rotation.y=-side*outward*angle;
   return true;
  },
  blocks(playerX,playerZ,radius,playerY=0){
   if(Math.abs(playerY-level)>1)return false;
   const dz=playerZ-door.position.z;
   return leaves.some(({hinge,side})=>{
    const dx=playerX-x-hinge.position.x;
    const ux=-side*Math.cos(angle),uz=-outward*Math.sin(angle);
    const along=THREE.MathUtils.clamp(dx*ux+dz*uz,0,leafWidth);
    return Math.hypot(dx-along*ux,dz-along*uz)<radius+(oak?.095:.046);
   });
  }
 };
}
