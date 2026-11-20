import { WINDOW_PAINT } from './window-finish.js?v=40';
function clamp01(v){return Math.max(0,Math.min(1,v));}
function fract(v){return v-Math.floor(v);}
function hash31(x,y,z){
  return fract(Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453123);
}
function shaderNoisePreamble(){
  return `
  varying vec3 vExteriorWorldPos;
  varying vec3 vExteriorWorldNormal;
  float ehash(vec3 p){
    return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123);
  }
  float enoise(vec3 p){
    vec3 i=floor(p),f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(
      mix(mix(ehash(i+vec3(0.,0.,0.)),ehash(i+vec3(1.,0.,0.)),f.x),
              mix(ehash(i+vec3(0.,1.,0.)),ehash(i+vec3(1.,1.,0.)),f.x),f.y),
      mix(mix(ehash(i+vec3(0.,0.,1.)),ehash(i+vec3(1.,0.,1.)),f.x),
              mix(ehash(i+vec3(0.,1.,1.)),ehash(i+vec3(1.,1.,1.)),f.x),f.y),f.z);
  }
  float efbm(vec3 p){
    float value=0.0;
    float amplitude=0.5;
    for(int i=0;i<5;i++){
      value+=amplitude*enoise(p);
      p*=2.03;
      amplitude*=0.5;
    }
    return value;
  }
  `;
}

function patchWorldVaryings(shader){
  // Computes the correct world-space position for both regular meshes and GPU
  // instances. Three.js does not guarantee that worldPosition is declared in
  // every compiled material variant, so never depend on that shader variable.
  shader.vertexShader=shader.vertexShader
    .replace('void main() {',`varying vec3 vExteriorWorldPos;
     varying vec3 vExteriorWorldNormal;
     void main() {`)
    .replace('#include <project_vertex>',`
      vec4 whLocalPosition=vec4(transformed,1.0);
      vec3 whLocalNormal=objectNormal;
      #ifdef USE_INSTANCING
        whLocalPosition=instanceMatrix*whLocalPosition;
        whLocalNormal=mat3(instanceMatrix)*whLocalNormal;
      #endif
      vExteriorWorldPos=(modelMatrix*whLocalPosition).xyz;
      vExteriorWorldNormal=normalize(mat3(modelMatrix)*whLocalNormal);
      #include <project_vertex>`);
}

export function applyProceduralFinish(THREE, material, kind, options={}){
  const key=`${kind}-${Object.entries(options).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>`${k}:${v}`).join('|')}`;
  material.customProgramCacheKey=()=>key;
  material.onBeforeCompile = shader => {
    patchWorldVaryings(shader);
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', `${shaderNoisePreamble()}\nvoid main() {`);
    let inject='';
    if(kind==='paintedStone'){
      const scale=options.scale??0.36;
      const dirt=options.dirt??0.12;
      inject = `
        vec3 wp=vExteriorWorldPos*${scale.toFixed(3)};
        float macro=efbm(wp);
        float micro=efbm(wp*4.3+19.7);
        float streak=efbm(vec3(vExteriorWorldPos.x*0.11+4.7,vExteriorWorldPos.z*0.11-1.3,vExteriorWorldPos.y*0.82));
        float lowDirt=(1.0-smoothstep(-0.6,5.2,vExteriorWorldPos.y));
        float sheltered=smoothstep(0.15,0.95,1.0-abs(vExteriorWorldNormal.y));
        vec3 warm=vec3(0.988,0.979,0.955);
        vec3 cool=vec3(0.932,0.928,0.912);
        vec3 tone=mix(warm,cool,macro*0.82);
        tone*=1.0 + (micro-0.5)*0.12;
        float grime=(smoothstep(0.55,0.94,streak)*0.6 + (1.0-macro)*0.4)*${dirt.toFixed(3)}*lowDirt*sheltered;
        diffuseColor.rgb*=tone;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.78,0.75,0.69),grime);
        roughnessFactor=clamp(roughnessFactor + (macro-0.5)*0.10 + grime*0.35,0.18,1.0);
      `;
    }else if(kind==='heritageAshlar'){
      // Sample all three PBR maps in metres, even on GPU-instanced boxes.
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', `void main() {
        vec3 stoneNormal = abs(vExteriorWorldNormal);
        vec3 stonePos = vExteriorWorldPos;
        vec2 stoneUv = (stoneNormal.y > max(stoneNormal.x, stoneNormal.z) ? stonePos.xz :
          (stoneNormal.x > stoneNormal.z ? stonePos.zy : stonePos.xy)) / 2.65;
        #define vMapUv stoneUv
        #define vNormalMapUv stoneUv
        #define vRoughnessMapUv stoneUv
      `);
      // World-coordinate, staggered ashlar courses: continuous across the many
      // segmented wall meshes, unlike UV-mapped stone images per mesh.
      inject = `
        vec3 wp=vExteriorWorldPos;
        float course=floor((wp.y+.12)/.70);
        float across=abs(vExteriorWorldNormal.z)>.45 ? wp.x : wp.z;
        float rowFrac=fract((wp.y+.12)/.70);
        float stoneFrac=fract((across + mod(course,2.0)*.88)/1.76);
        float rowEdge=1.0-smoothstep(.004,.013,min(rowFrac,1.0-rowFrac));
        float stoneEdge=1.0-smoothstep(.0018,.006,min(stoneFrac,1.0-stoneFrac));
        float joint=max(rowEdge,stoneEdge);
        float macro=efbm(wp*.18+vec3(2.4,7.1,3.7));
        float grain=enoise(wp*3.1+16.7);
        float tile=ehash(vec3(floor((across + mod(course,2.0)*.88)/1.76),course,6.0));
        float low=1.0-smoothstep(.25,3.4,wp.y);
        float stain=enoise(vec3(wp.x*.12,wp.y*.34,wp.z*.12)+8.1);
        vec3 stoneTint=mix(vec3(.955,.947,.938),vec3(1.040,1.027,1.018),tile*.43+macro*.43);
        float patina=enoise(wp*.87+vec3(7.3,4.1,5.8))*.65+grain*.35;
        float mineral=smoothstep(.47,.79,patina);
        stoneTint*=mix(vec3(1.05,1.034,1.013),vec3(.83,.77,.68),mineral*.70);
        stoneTint=mix(stoneTint,vec3(.76,.738,.704),joint*.68);
        stoneTint*=1.0 - low*(.024+.054*smoothstep(.60,.90,stain));
        diffuseColor.rgb*=stoneTint;
        roughnessFactor=clamp(roughnessFactor + (grain-.5)*.06 + joint*.05,.53,1.0);
      `;
    }else if(kind==='weatheredCarving'){
      inject = `
        vec3 wp=vExteriorWorldPos;
        float micro=enoise(wp*3.4+19.3);
        float macro=efbm(wp*.45+4.2);
        float streak=enoise(vec3(wp.x*.25,wp.y*.72,wp.z*.25)+24.0);
        vec3 tone=mix(vec3(.91,.905,.895),vec3(1.035,1.020,1.003),macro);
        tone*=1.0+(micro-.5)*.060;
        tone*=1.0-.055*smoothstep(.74,.98,streak);
        diffuseColor.rgb*=tone;
        roughnessFactor=clamp(roughnessFactor+(micro-.5)*.10,.45,1.0);
      `;
    }else if(kind==='paintedTrim'){
      const scale=options.scale??0.42;
      inject = `
        vec3 wp=vExteriorWorldPos*${scale.toFixed(3)};
        float macro=efbm(wp);
        float micro=efbm(wp*6.0+12.0);
        vec3 tone=mix(vec3(0.995,0.992,0.982),vec3(0.952,0.947,0.932),macro*0.55);
        tone*=1.0+(micro-0.5)*0.06;
        diffuseColor.rgb*=tone;
        roughnessFactor=clamp(roughnessFactor + macro*0.03 + (1.0-vExteriorWorldNormal.y*0.5)*0.02,0.16,1.0);
      `;
    }else if(kind==='wornStone'){
      const scale=options.scale??0.55;
      inject = `
        vec3 wp=vExteriorWorldPos*${scale.toFixed(3)};
        float macro=efbm(wp);
        float fleck=efbm(wp*7.0+21.0);
        float wear=smoothstep(0.75,0.98,abs(vExteriorWorldNormal.y));
        vec3 tone=mix(vec3(0.82,0.80,0.76),vec3(0.70,0.69,0.66),macro*0.8);
        tone+=vec3(0.06,0.05,0.04)*(fleck-0.5);
        diffuseColor.rgb*=tone;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.08,wear*0.18);
        roughnessFactor=clamp(roughnessFactor + 0.10 + (1.0-fleck)*0.12,0.35,1.0);
      `;
    }else if(kind==='roofMetal'){
      const spacing=options.spacing??0.76;
      inject = `
        float seam = (1.0-smoothstep(0.0,0.07,abs(fract(vExteriorWorldPos.x/${spacing.toFixed(3)})-0.5)));
        float macro=efbm(vExteriorWorldPos.xzy*0.18);
        float micro=efbm(vExteriorWorldPos.xzy*1.6+17.0);
        vec3 tone=mix(vec3(0.43,0.46,0.45),vec3(0.31,0.35,0.34),macro*0.75);
        tone += vec3(0.03,0.04,0.03)*(micro-0.5);
        tone = mix(tone, vec3(0.25,0.28,0.28), seam*0.55);
        diffuseColor.rgb*=tone;
        roughnessFactor=clamp(0.44 + macro*0.18 - seam*0.18,0.18,0.82);
        metalnessFactor=0.12;
      `;
    }else if(kind==='darkMetal'){
      inject = `
        float macro=efbm(vExteriorWorldPos.xzy*0.7);
        float edge=pow(1.0-abs(dot(normalize(vExteriorWorldNormal),vec3(0.0,1.0,0.0))),2.0);
        vec3 tone=mix(vec3(0.12,0.13,0.14),vec3(0.24,0.25,0.26),macro*0.65);
        tone+=vec3(0.03,0.02,0.01)*edge*0.35;
        diffuseColor.rgb*=tone;
        roughnessFactor=clamp(0.36 + (1.0-macro)*0.28,0.2,0.78);
        metalnessFactor=0.72;
      `;
    }else if(kind==='bark'){
      inject = `
        vec3 wp=vExteriorWorldPos;
        vec3 grain=wp*vec3(14.0,1.45,14.0);
        float twist=efbm(wp*vec3(1.7,.64,1.7));
        float ridges=smoothstep(.27,.73,efbm(grain+twist*3.3));
        float grainFine=enoise(grain*3.7);
        diffuseColor.rgb*=mix(vec3(.42,.34,.28),vec3(1.18,1.10,.97),ridges);
        diffuseColor.rgb*=.82+.28*grainFine;
      `;
    }else if(kind==='grassBreakup'){
      inject = `
        float macro=efbm(vExteriorWorldPos.xzy*0.10);
        float micro=efbm(vExteriorWorldPos.xzy*0.85+8.0);
        vec3 tone=mix(vec3(0.87,0.96,0.82),vec3(0.74,0.84,0.67),macro*0.85);
        tone*=1.0 + (micro-0.5)*0.18;
        diffuseColor.rgb*=tone;
        roughnessFactor=clamp(roughnessFactor + 0.06 + (1.0-macro)*0.08,0.45,1.0);
      `;
    }else if(kind==='pathBreakup'){
      inject = `
        float macro=efbm(vExteriorWorldPos.xzy*0.28);
        float micro=efbm(vExteriorWorldPos.xzy*1.25+13.0);
        vec3 tone=mix(vec3(0.96,0.94,0.90),vec3(0.78,0.75,0.69),macro*0.9);
        tone*=1.0 + (micro-0.5)*0.12;
        diffuseColor.rgb*=tone;
        roughnessFactor=clamp(roughnessFactor + 0.08 + macro*0.06,0.28,1.0);
      `;
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${inject}`);
  };
  material.needsUpdate=true;
}

function createCanvasTexture(THREE,size,draw,{repeatX=1,repeatY=1,color=true}={}){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  const img=ctx.createImageData(size,size);
  const data=img.data;
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const idx=(y*size+x)*4;
      const p=draw(x/size,y/size,x,y,size);
      data[idx]=Math.round(clamp01(p[0])*255);
      data[idx+1]=Math.round(clamp01(p[1])*255);
      data[idx+2]=Math.round(clamp01(p[2])*255);
      data[idx+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  const tex=new THREE.CanvasTexture(canvas);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(repeatX,repeatY);
  tex.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
  tex.needsUpdate=true;
  return tex;
}

function makeRoofBumpMap(THREE){
  return createCanvasTexture(THREE,256,(u,v)=>{
    const seams=Math.abs(fract(u*7.0)-0.5);
    const seam=seams<0.03?0.88:0.5+0.03*Math.sin(v*60.0);
    return [seam,seam,seam];
  },{repeatX:8,repeatY:2,color:false});
}

function makePaintBumpMap(THREE){
  return createCanvasTexture(THREE,256,(u,v)=>{
    const n1=hash31(Math.floor(u*32),Math.floor(v*32),1.0);
    const n2=hash31(Math.floor(u*96),Math.floor(v*96),2.0);
    const val=0.48+n1*0.10+n2*0.06;
    return [val,val,val];
  },{repeatX:2,repeatY:2,color:false});
}

// Version 4: locally bundled PBR limestone, brushed carved stone, column stone
// and natural weathered plinths. No external texture API or streaming server.
export function createExteriorMaterialLibrary(THREE){
  const loader=new THREE.TextureLoader();
  const sourceMaterials=new Set(['facade_limestone','trim_limestone','column_stone','base_limestone']);
  function load(name,channel,repeat=2){
    const root=sourceMaterials.has(name)?'./assets/heritage-v14/':'./assets/exterior/';
    const map=loader.load(`${root}${name}_${channel}.jpg`);
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    map.repeat.set(repeat,repeat);
    map.anisotropy=8;
    if(channel==='albedo')map.colorSpace=THREE.SRGBColorSpace;
    return map;
  }
  function limestone(name,color,roughness,normalStrength=.35,repeat=2){
    const mat=new THREE.MeshStandardMaterial({
      name:`WH2027_${name}_PBR`,
      color,metalness:0,roughness,
      map:load(name,'albedo',repeat),
      normalMap:load(name,'normal',repeat),
      roughnessMap:load(name,'roughness',repeat),
      normalScale:new THREE.Vector2(normalStrength,normalStrength)
    });
    return mat;
  }
  // Mature cool-taupe sandstone. Avoid the cream/whitewashed original shell.
  const facadeWall=limestone('facade_limestone',0xfff3e1,.88,.52,2);
  const wallStone=facadeWall;
  const trim=limestone('trim_limestone',0xf5e8d4,.84,.30,2);
  const windowStone=limestone('trim_limestone',0xf3eee7,.88,.34,2);
  const ornamentStone=limestone('column_stone',0xece7df,.86,.36,2);
  const deepJoint=new THREE.MeshStandardMaterial({name:'Historischer_Moertelschatten',color:0x918980,roughness:1});
  const paintedSash=new THREE.MeshStandardMaterial(WINDOW_PAINT);
  const dressedStone=limestone('trim_limestone',0xf5f0e9,.90,.32,2);
  // Preserve the visually striking classical colonnades, but age their stone.
  const columnFinish=limestone('column_stone',0xf5e6d0,.88,.33,2);
  const capitalFinish=limestone('trim_limestone',0xfaf7f1,.87,.32,2);
  const ceilingFinish=limestone('trim_limestone',0xf9f8f4,.90,.23,2);
  ceilingFinish.side=THREE.DoubleSide;
  const shade=limestone('base_limestone',0xd8d3cc,.97,.34,2);
  const stairStone=limestone('base_limestone',0xf3e8d8,.94,.42,2);
  const nosingStone=limestone('trim_limestone',0xf1e9de,.94,.34,2);
  const roof=new THREE.MeshStandardMaterial({
    name:'WH2027_ZincRoofs_PBR',color:0xbec3c8,
    map:load('roof_zinc','albedo',3),normalMap:load('roof_zinc','normal',3),
    roughnessMap:load('roof_zinc','roughness',3),roughness:.84,
    metalness:.22,normalScale:new THREE.Vector2(.42,.42)
  });
  const soffit=ceilingFinish;
  soffit.emissive.set(0xffe4bd);
  soffit.emissiveIntensity=.062;
  const steel=new THREE.MeshStandardMaterial({name:'WH2027_BlackIron',color:0x343838,metalness:.67,roughness:.47});
  const zincDetail=new THREE.MeshStandardMaterial({name:'Bewittertes Titanzink',color:0x626b6e,roughness:.68,metalness:.28});
  const brass=new THREE.MeshStandardMaterial({name:'WH2027_AgedBrass',color:0xa78653,metalness:.78,roughness:.32});
  applyProceduralFinish(THREE,facadeWall,'heritageAshlar');
  applyProceduralFinish(THREE,trim,'paintedTrim',{scale:.44});
  applyProceduralFinish(THREE,windowStone,'weatheredCarving');
  applyProceduralFinish(THREE,ornamentStone,'weatheredCarving');
  applyProceduralFinish(THREE,dressedStone,'paintedTrim',{scale:.36});
  applyProceduralFinish(THREE,columnFinish,'weatheredCarving');
  applyProceduralFinish(THREE,capitalFinish,'weatheredCarving');
  applyProceduralFinish(THREE,ceilingFinish,'paintedTrim',{scale:.32});
  applyProceduralFinish(THREE,shade,'wornStone',{scale:.62});
  applyProceduralFinish(THREE,stairStone,'wornStone',{scale:.70});
  applyProceduralFinish(THREE,nosingStone,'wornStone',{scale:.76});
  applyProceduralFinish(THREE,roof,'roofMetal',{spacing:.78});
  applyProceduralFinish(THREE,steel,'darkMetal');
  return {facadeWall,wallStone,trim,windowStone,ornamentStone,deepJoint,shade,roof,paintedSash,soffit,
    dressedStone,stairStone,nosingStone,steel,brass,zincDetail,columnFinish,capitalFinish,ceilingFinish};
}
