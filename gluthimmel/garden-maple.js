import { mergeGeometries } from '../vendor/three/examples/jsm/utils/BufferGeometryUtils.js';

// The JPEG atlas has a pale opaque background. Cut it out in the
// visible and shadow passes, while preserving the textured green leaf.
function cutOutLeafBackground(material){
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #include <map_fragment>
      #ifdef USE_MAP
        vec3 leafPixel=sampledDiffuseColor.rgb;
        float lightest=max(max(leafPixel.r,leafPixel.g),leafPixel.b);
        float darkest=min(min(leafPixel.r,leafPixel.g),leafPixel.b);
        if(darkest>.34 && lightest-darkest<.19)discard;
      #endif
    `);
  };
  material.customProgramCacheKey=()=> 'garden-maple-atlas-cutout';
}

export async function loadGardenMaple(THREE, loader){
  const {scene}=await loader.loadAsync('./assets/vegetation/maple_tree.glb');
  scene.updateMatrixWorld(true);
  const parts=new Map();
  scene.traverse(mesh=>{
    const name=mesh.material?.name;
    if(!mesh.isMesh||!['sugar_maple_bark','sugar_maple_leaf'].includes(name))return;
    if(!parts.has(name))parts.set(name,{material:mesh.material,geometries:[]});
    const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    for(const attribute in geometry.attributes){
      if(!['position','normal','uv'].includes(attribute))geometry.deleteAttribute(attribute);
    }
    geometry.applyMatrix4(mesh.matrixWorld);
    parts.get(name).geometries.push(geometry);
  });
  if(parts.size!==2)throw new Error('Maple tree requires both bark and leaf geometry');
  const model=new THREE.Group();
  model.name='Suedgarten_Zuckerahorn';
  for(const [name,{material,geometries}] of parts){
    const geometry=mergeGeometries(geometries);
    geometries.forEach(part=>part.dispose());
    if(!geometry)throw new Error('Maple tree geometry could not be merged');
    const finish=material.clone();
    finish.metalness=0;
    finish.roughness=.94;
    finish.emissiveIntensity=name==='sugar_maple_leaf'?.17:0;
    finish.side=THREE.DoubleSide;
    const mesh=new THREE.Mesh(geometry,finish);
    if(name==='sugar_maple_leaf'){
      finish.emissiveIntensity=.07;
      cutOutLeafBackground(finish);
      mesh.customDepthMaterial=new THREE.MeshDepthMaterial({
        map:finish.map,depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide
      });
      cutOutLeafBackground(mesh.customDepthMaterial);
    }
    mesh.name=name;
    mesh.castShadow=mesh.receiveShadow=true;
    model.add(mesh);
  }

  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Maple tree has invalid bounds');
  const bark=model.getObjectByName('sugar_maple_bark').geometry;
  const positions=bark.getAttribute('position');
  const base=new THREE.Box3();
  const point=new THREE.Vector3();
  for(let i=0;i<positions.count;i++){
    point.fromBufferAttribute(positions,i);
    if(point.y<=bounds.min.y+size.y*.035)base.expandByPoint(point);
  }
  if(base.isEmpty())throw new Error('Maple tree has no ground-level trunk');
  const center=base.getCenter(new THREE.Vector3());
  const scale=15/size.y;
  model.scale.setScalar(scale);
  model.position.set(-center.x*scale,-.056-bounds.min.y*scale,-center.z*scale);
  const tree=new THREE.Group();
  tree.add(model);
  return tree;
}
