export const lanternAxis = 15.40;

export function addCofferedCeiling(THREE, portico, materials) {
 const soffit = new THREE.Box3().setFromObject(portico.getObjectByName('Cube431'), true);
 const ceiling = soffit.min.y;
 const positions = [], uvs = [];
 // Each tier forms a continuous rectangular molding around the exposed stone.
 const profile = [[0,.013],[.047,-.028],[.083,-.078],[.139,-.084],
  [.171,-.065],[.203,-.023],[.224,.013]];
 function tier(x,z,w,d,inset,y) {
  const a=w/2-inset,b=d/2-inset;
  return [[x-a,y,z-b],[x+a,y,z-b],[x+a,y,z+b],[x-a,y,z+b]];
 }
 function triangle(...vertices) {
  for(const [x,y,z] of vertices){
   positions.push(x,y,z);
   uvs.push(x*.30,z*.30+y*.20);
  }
 }
 for(let bay=-1;bay<=1;bay++){
  const x=bay*4.935,z=lanternAxis;
  for(let i=1;i<profile.length;i++){
   const [a,ay]=profile[i-1], [b,by]=profile[i];
   const outer=tier(x,z,4.65,3.55,a,ceiling+ay);
   const inner=tier(x,z,4.65,3.55,b,ceiling+by);
   for(let j=0;j<4;j++){
    const next=(j+1)%4;
    triangle(outer[j],outer[next],inner[next]);
    triangle(outer[j],inner[next],inner[j]);
   }
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.computeVertexNormals();
 const frames=new THREE.Mesh(geometry,materials.ceilingFinish);
 frames.name='Steinkassetten';
 frames.castShadow=frames.receiveShadow=true;
 portico.add(frames);

 // The bronze canopy sits against a shallow carved stone medallion.
 const rose=new THREE.Mesh(new THREE.LatheGeometry([
  [0,-.095],[.252,-.095],[.27,-.084],[.304,-.082],[.33,-.057],
  [.395,-.053],[.415,-.062],[.448,-.052],[.47,-.022],[.47,.014]
 ].map(([r,y])=>new THREE.Vector2(r,y)),64),materials.capitalFinish);
 rose.position.set(0,ceiling,lanternAxis);
 rose.name='Steinrosette';
 rose.receiveShadow=true;
 portico.add(rose);
 return ceiling-.095;
}
