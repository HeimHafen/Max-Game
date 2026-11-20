export function buildPorticoLantern(THREE,exterior){
  const fixture=new THREE.Group();
  fixture.name='Nordportikus_Bronze_Pendellaterne';
  fixture.position.set(0,8.72,15.2);
  exterior.add(fixture);

  const bronze=new THREE.MeshStandardMaterial({color:0x5c4028,roughness:.37,metalness:.72});
  const trim=new THREE.MeshStandardMaterial({color:0x9d7647,roughness:.35,metalness:.72});
  const glass=new THREE.MeshPhysicalMaterial({color:0xe9d5ae,roughness:.14,metalness:.08,
    transparent:true,opacity:.23,depthWrite:false,side:THREE.DoubleSide});
  const flame=new THREE.MeshBasicMaterial({color:0xffdda0});
  const wax=new THREE.MeshStandardMaterial({color:0xffe9be,roughness:.71});
  function mesh(geometry,material,x,y,z){
    const piece=new THREE.Mesh(geometry,material);
    piece.position.set(x,y,z);
    piece.receiveShadow=material!==flame;
    fixture.add(piece);
    return piece;
  }
  function profile(y0,y1,r0,r1,material,sides=6){
    return mesh(new THREE.CylinderGeometry(r1,r0,y1-y0,sides),material,0,(y0+y1)/2,0);
  }
  function ball(radius,y,material){
    mesh(new THREE.SphereGeometry(radius,16,12),material,0,y,0);
  }

  profile(-.03,.05,.11,.17,bronze);
  ball(.075,-.045,trim);
  profile(.05,.26,.17,.52,bronze);
  profile(.24,.30,.53,.53,trim);
  profile(1.49,1.57,.67,.67,trim);
  profile(1.57,1.79,.66,.40,bronze);
  profile(1.79,1.93,.40,.17,bronze);
  ball(.102,1.96,trim);

  for(let side=0;side<6;side++){
    const angle=side*Math.PI/3;
    const vertex=(r,y,a)=>new THREE.Vector3(r*Math.sin(a),y,r*Math.cos(a));
    const a=vertex(.52,.30,angle),b=vertex(.65,1.49,angle);
    const c=vertex(.65,1.49,angle+Math.PI/3),d=vertex(.52,.30,angle+Math.PI/3);
    const pane=new THREE.BufferGeometry().setFromPoints([a,d,b,d,c,b]);
    pane.computeVertexNormals();
    mesh(pane,glass,0,0,0);
    const delta=b.clone().sub(a);
    const center=a.clone().add(b).multiplyScalar(.5);
    const stile=mesh(new THREE.CylinderGeometry(.026,.031,delta.length(),8),bronze,
      center.x,center.y,center.z);
    stile.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  }
  for(let i=0;i<3;i++){
    const angle=i*2*Math.PI/3,x=.18*Math.cos(angle),z=.18*Math.sin(angle);
    mesh(new THREE.CylinderGeometry(.061,.041,.06,12),trim,x,.63,z);
    mesh(new THREE.CylinderGeometry(.031,.033,.22,12),wax,x,.765,z);
    mesh(new THREE.SphereGeometry(.039,12,10),flame,x,.92,z).scale.set(.62,1.52,.62);
    const arm=mesh(new THREE.TorusGeometry(.12,.019,8,16,Math.PI),bronze,x*.54,.59,z*.54);
    arm.rotation.set(0,-angle,Math.PI);
  }
  profile(.3,.68,.038,.032,bronze,12);

  // Seat the canopy on the exposed soffit, below the pediment structure.
  const top=11.42-fixture.position.y;
  for(let y=2.055,index=0;y<top-.045;y+=.082,index++){
    const link=mesh(new THREE.TorusGeometry(.054,.012,8,16),bronze,0,y,0);
    link.rotation.y=index%2*Math.PI/2;
    link.scale.y=1.25;
  }
  profile(top-.065,top+.018,.135,.245,bronze,24);
  profile(top-.014,top+.022,.253,.253,trim,24);
  const light=new THREE.PointLight(0xffd3a0,16,8,2);
  light.position.y=.83;
  fixture.add(light);
  return fixture;
}
