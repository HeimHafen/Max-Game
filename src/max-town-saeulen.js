import {engravedGableMaterial} from './inscription.js';
import * as THREE from '../vendor/three/build/three.module.js';
import {GLTFLoader} from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {createExteriorMaterialLibrary,applyProceduralFinish} from './exterior-materials.js';
import {createRealisticExteriorGlass} from './window-glass.js';
import {buildSky} from './sky-atmosphere.js';
import {buildPorticoLantern} from './portico-lantern.js';
import {loadGardenMaple} from './garden-maple.js';
import {buildEnsemble,houseAxis} from './ensemble-max-town-saeulen.js';

const canvas=document.querySelector('canvas');
const launch=document.querySelector('#start');
run().catch(error=>{
 console.error(error);
 document.querySelector('#error').textContent='Die 3D-Szene konnte nicht geladen werden.';
});

async function run(){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=.94;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.autoUpdate=false;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const mobile=matchMedia('(pointer:coarse)').matches;
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(0xb8d3e7);
 scene.fog=new THREE.Fog(0xb8d3e7,125,220);
 const camera=new THREE.PerspectiveCamera(66,1,.05,250);
 const atmosphere=buildSky(THREE,scene,camera);
 scene.add(new THREE.HemisphereLight(0xeaf3ff,0xb4a586,1.00));
 const sun=new THREE.DirectionalLight(0xfff4df,2.48);
 sun.position.set(39,48,-53);
 sun.castShadow=true;
 const shadow=mobile?1024:2048;
 sun.shadow.mapSize.set(shadow,shadow);
 Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:160});
 sun.shadow.camera.updateProjectionMatrix();
 sun.shadow.bias=-.0002;
 sun.shadow.normalBias=.023;
 sun.shadow.radius=1.25;
 scene.add(sun);
 for(const [color,intensity,x,y,z] of [[0xf0f4ff,.63,10,18,28],[0xffecd5,.42,20,19,-30]]){
  const bounce=new THREE.DirectionalLight(color,intensity);
  bounce.position.set(x,y,z);
  scene.add(bounce);
 }
 const loader=new GLTFLoader();
 const {scene:original}=await loader.loadAsync('./assets/white-house-structure.glb');
 const mats=createExteriorMaterialLibrary(THREE);
 const glass=createRealisticExteriorGlass(THREE,renderer);
 const {portico,surfaces,walls}=buildEnsemble(THREE,scene,original,mats,glass,engravedGableMaterial(THREE,mats.facadeWall));
 buildPorticoLantern(THREE,portico);
 buildGarden(scene);
 loadGardenMaple(THREE,loader).then(tree=>{
  const treeOrigins=[[-14,-21,1], [13,-24,.87],[-27,-14,.88],[26,-17,1.08],
   [-25,-43,.77],[25,-45,.94],[10,-63,.76],[-11,-65,.91]];
  for(const [i,[x,z,scale]] of treeOrigins.entries()){
   const instance=tree.clone();
   instance.position.set(x,0,z);
   instance.rotation.y=i*1.71;
   instance.scale.setScalar(scale);
   scene.add(instance);
   walls.push([x-.34,x+.34,z-.34,z+.34,0,4]);
  }
  renderer.shadowMap.needsUpdate=true;
 }).catch(error=>console.warn('Gartenbäume konnten nicht geladen werden.',error));

 const destinations=[
  ['Vorplatz',0,71,0,0],['Portikus',0,16,.86,0],['Garten',0,-12,0,Math.PI],
  ['Linkes Haus',-houseAxis,8,0,0],['Rechtes Haus',houseAxis,8,0,0]
 ];
const place=document.querySelector('#place');
const nav=document.querySelector('#places');
const intro=document.querySelector('.intro');
const header=document.querySelector('header');
const toolbar=document.querySelector('aside');
const mapButton=document.querySelector('#map');
const startButton=document.querySelector('#start');
const description=document.querySelector('#description');
let x=0,y=0,z=71,yaw=0,pitch=.11,started=false,eyeHeight=1.64;
let walkTouch=null,lookTouch=null,forward=0,side=0;
function resetTouches(){
 for(const touch of [walkTouch,lookTouch]){
  if(touch&&canvas.hasPointerCapture(touch.id))canvas.releasePointerCapture(touch.id);
 }
 walkTouch=lookTouch=null;
 forward=side=0;
}
function setPlaces(open){
 nav.hidden=!open;
 mapButton.setAttribute('aria-expanded',String(open));
 resetTouches();
}
function showIntro(open){
 started=!open;
 intro.hidden=!open;
 header.hidden=toolbar.hidden=open;
 setPlaces(false);
 if(open)startButton.focus();
}
for(const [i,[name]] of destinations.entries()){
 const button=document.createElement('button');
 button.textContent=name;
 button.onclick=()=>{go(i);setPlaces(false);mapButton.focus();};
 nav.append(button);
}
function go(i){
 const [,sx,sz,sy,angle]=destinations[i];
 x=sx;y=sy;z=sz;yaw=angle;pitch=i===0?.11:0;eyeHeight=y+1.64;
 resetTouches();
}
startButton.onclick=()=>showIntro(false);
mapButton.onclick=()=>setPlaces(nav.hidden);
document.querySelector('#help').onclick=()=>{
 description.hidden=true;
 startButton.textContent='Weiter erkunden';
 showIntro(true);
};
addEventListener('blur',resetTouches);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetTouches();});
canvas.onpointerdown=e=>{
 if(e.pointerType!=='touch'||!started)return;
 if(!nav.hidden){setPlaces(false);return;}
 const isWalk=e.clientX<canvas.getBoundingClientRect().width/2;
 if(isWalk?walkTouch:lookTouch)return;
 canvas.setPointerCapture(e.pointerId);
 const contact={id:e.pointerId,x:e.clientX,y:e.clientY};
 if(isWalk)walkTouch=contact;
 else lookTouch=contact;
};
canvas.onpointermove=e=>{
 if(e.pointerId===walkTouch?.id){
  const dx=e.clientX-walkTouch.x,dy=e.clientY-walkTouch.y;
  const length=Math.hypot(dx,dy);
  const strength=Math.min(1,Math.max(0,(length-7)/49));
  side=length?dx/length*strength:0;
  forward=length?-dy/length*strength:0;
 }else if(e.pointerId===lookTouch?.id){
  yaw+=(e.clientX-lookTouch.x)*.006;
  pitch=Math.max(-1.22,Math.min(1.22,pitch+(lookTouch.y-e.clientY)*.0055));
  lookTouch.x=e.clientX;
  lookTouch.y=e.clientY;
 }
};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{
 if(e.pointerId===walkTouch?.id){walkTouch=null;forward=side=0;}
 if(e.pointerId===lookTouch?.id)lookTouch=null;
};
function step(nx,nz){
 let best=-Infinity;
 for(const [l,r,f,b,h] of surfaces){
  if(nx>=l&&nx<=r&&nz>=f&&nz<=b&&h<=y+.28&&h>=y-.31)best=Math.max(best,h);
 }
 if(best===-Infinity)return;
 const radius=.22;
 for(const [l,r,f,b,low,high] of walls){
  if(nx+radius>l&&nx-radius<r&&nz+radius>f&&nz-radius<b&&best+1.69>low&&best+.045<high)return;
 }
 x=nx;y=best;z=nz;
}
 function resize(){
  const aspect=innerWidth/Math.max(innerHeight,1);
  const half=Math.max(Math.tan(33*Math.PI/180),.53/aspect);
  camera.aspect=aspect;
  camera.fov=2*Math.atan(half)*180/Math.PI;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.30:1.65));
  renderer.setSize(innerWidth,innerHeight,false);
 }
 addEventListener('resize',resize);
 resize();
 renderer.shadowMap.needsUpdate=true;
 camera.rotation.order='YXZ';
 launch.disabled=false;
 let last=performance.now();
 function frame(ms){
  const dt=Math.min((ms-last)/1000,.035);last=ms;
  if(started&&(forward||side)){
   const sn=Math.sin(yaw),cs=Math.cos(yaw), pace=dt*3.6;
   step(x+(sn*forward+cs*side)*pace,z);
   step(x,z+(-cs*forward+sn*side)*pace);
  }
  let region='Vorplatz';
  if(Math.abs(Math.abs(x)-houseAxis)<7.2&&z>1.3&&z<15.7)region=x<0?'Linkes Haus':'Rechtes Haus';
  else if(Math.abs(x)<8.55&&z>=11.8&&z<=20.54)region='Portikus';
  else if(z<10)region='Garten';
  if(place.textContent!==region)place.textContent=region;
  eyeHeight+=(y+1.64-eyeHeight)*Math.min(1,dt*15);
  camera.position.set(x,eyeHeight,z);
  camera.rotation.set(pitch,-yaw,0);
  atmosphere.update();
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}

function buildGarden(scene){
 const loader=new THREE.TextureLoader();
 function material(name,roughness,repeat){
  function map(channel){
   const tex=loader.load('./assets/materials/'+name+'_'+channel+'.jpg');
   tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
   tex.repeat.set(...repeat);
   tex.anisotropy=8;
   if(channel==='albedo')tex.colorSpace=THREE.SRGBColorSpace;
   return tex;
  }
  const finish=new THREE.MeshStandardMaterial({
   map:map('albedo'),normalMap:map('normal'),roughnessMap:map('roughness'),
   normalScale:new THREE.Vector2(.42,.42),roughness
  });
  applyProceduralFinish(THREE,finish,name==='grass'?'grassBreakup':'pathBreakup');
  return finish;
 }
 function plane(x,y,z,w,d,mat){
  const item=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);
  item.position.set(x,y,z);
  item.rotation.x=-Math.PI/2;
  item.receiveShadow=true;
  scene.add(item);
 }
 plane(0,-.056,0,250,225,material('grass',.96,[24,24]));
 plane(0,-.017,42,3.8,43,material('paving',.80,[1.1,12]));
 plane(0,-.017,-26.05,3.8,72,material('paving',.80,[1.1,20]));
 const crossPaving=material('paving',.80,[16,1]);
 for(const z of [-.6,21.45])plane(0,-.025,z,55,2.05,crossPaving);
 const sidePaving=material('paving',.80,[1,7]);
 for(const x of [-10.34,10.34])plane(x,-.027,10.35,1.55,22.8,sidePaving);
 for(const x of [-houseAxis,houseAxis]){
  plane(x,-.018,18.6,2.5,5.4,material('paving',.80,[1,2]));
  plane(x,-.018,.04,2.5,2.12,material('paving',.80,[1,1]));
 }
}
