export function engravedGableMaterial(THREE, stone){
 const material=stone.clone();
 material.name='Kalkstein mit vertiefter Max-Town-Inschrift';
 const depth=new THREE.TextureLoader().load('./assets/inscription/max-town-depth.png');
 depth.anisotropy=8;
 const stoneFinish=stone.onBeforeCompile.bind(stone);
 material.customProgramCacheKey=()=>stone.customProgramCacheKey()+'-max-town-cut-v1';
 material.onBeforeCompile=(shader,renderer)=>{
  stoneFinish(shader,renderer);
  shader.uniforms.inscriptionDepth={value:depth};
  shader.fragmentShader=shader.fragmentShader.replace('void main() {',`
uniform sampler2D inscriptionDepth;
void main() {
  vec2 engravingUV=vec2(vExteriorWorldPos.x/8.35+.5,(vExteriorWorldPos.y-12.50)/1.38);
  bool engravingFront=abs(vExteriorWorldNormal.z)>.78&&vExteriorWorldPos.z>18.85;
`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
#include <normal_fragment_maps>
if(engravingFront){
  vec2 pixel=vec2(1./1536.,1./256.);
  float depthCenter=texture2D(inscriptionDepth,engravingUV).r;
  float dx=texture2D(inscriptionDepth,engravingUV+vec2(pixel.x,0.)).r
          -texture2D(inscriptionDepth,engravingUV-vec2(pixel.x,0.)).r;
  float dy=texture2D(inscriptionDepth,engravingUV+vec2(0.,pixel.y)).r
          -texture2D(inscriptionDepth,engravingUV-vec2(0.,pixel.y)).r;
  vec3 slope=mat3(viewMatrix)*vec3(dx*2.1,dy*2.2,0.);
  normal=normalize(normal+slope);
  diffuseColor.rgb*=1.-.12*depthCenter;
}
`);
 };
 return material;
}
