export function addEntranceLanterns(THREE, scene, x, facadeZ) {
 const bronze = new THREE.MeshStandardMaterial({color:0x37291e,metalness:.61,roughness:.39});
 const edges = new THREE.MeshStandardMaterial({color:0x8c683d,metalness:.68,roughness:.36});
 const glass = new THREE.MeshPhysicalMaterial({color:0xf6dfbd,transparent:true,opacity:.18,
  depthWrite:false,side:THREE.DoubleSide,roughness:.17});
 const flame = new THREE.MeshStandardMaterial({color:0xffd69a,emissive:0xffad4e,emissiveIntensity:1.85});
 const wax = new THREE.MeshStandardMaterial({color:0xe6cfaf});
 for(const side of [-1,1]){
  const lantern=new THREE.Group();
  lantern.name='Wandlaterne am Eichenportal';
  lantern.position.set(x+side*2.04,2.42,facadeZ+.59);
  scene.add(lantern);
  function mesh(geo,mat,x,y,z){
   const item=new THREE.Mesh(geo,mat);
   item.position.set(x,y,z);
   item.castShadow=mat!==glass&&mat!==flame;
   item.receiveShadow=mat!==glass;
   lantern.add(item);
   return item;
  }
  function box(w,h,d,mat,x,y,z){
   return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  }
  function section(bottom,top,height,y,mat){
   const item=mesh(new THREE.CylinderGeometry(top*Math.SQRT2,bottom*Math.SQRT2,height,4),mat,0,y,0);
   item.rotation.y=Math.PI/4;
  }
  box(.19,.52,.052,bronze,0,.04,-.291);
  box(.09,.075,.27,bronze,0,-.26,-.165);
  box(.063,.067,.24,edges,0,.235,-.16);
  section(.064,.141,.14,-.33,bronze);
  section(.141,.145,.048,-.245,edges);
  section(.133,.185,.46,.008,glass);
  for(const x of [-1,1])for(const z of [-1,1]){
   const lower=new THREE.Vector3(x*.133,-.222,z*.133);
   const upper=new THREE.Vector3(x*.182,.238,z*.182);
   const delta=upper.clone().sub(lower),center=upper.clone().add(lower).multiplyScalar(.5);
   mesh(new THREE.CylinderGeometry(.016,.019,delta.length(),6),bronze,center.x,center.y,center.z)
    .quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  }
  section(.185,.194,.052,.25,edges);
  section(.201,.060,.151,.348,bronze);
  mesh(new THREE.SphereGeometry(.049,10,8),edges,0,.452,0);
  mesh(new THREE.CylinderGeometry(.047,.057,.16,12),wax,0,-.132,0);
  mesh(new THREE.SphereGeometry(.039,12,10),flame,0,.003,0).scale.set(.63,1.5,.63);
  const light=new THREE.PointLight(0xffc891,3.6,2.65,2);
  light.position.set(0,.035,.035);
  lantern.add(light);
 }
}
