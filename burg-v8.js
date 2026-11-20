'use strict';
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl', {alpha:false, antialias:true});
function showError(message) {
  document.querySelector('#error').textContent = message;
  document.querySelector('#start').disabled = true;
}
if (!gl) {
  showError('Für den Rundgang wird WebGL benötigt.');
} else {
  try { run(); } catch (error) {
    console.error(error);
    showError('Die 3D-Grafik konnte auf diesem Gerät nicht gestartet werden.');
  }
}
function run() {
const vertices=[], surfaces=[], walls=[], lights=[];
const stone=[.55,.51,.44], trim=[.67,.60,.49], dark=[.46,.41,.35], wood=[.38,.23,.13];
const iron=[.18,.19,.19], grass=[.32,.37,.22];
let seed=2317;
function rand(){ seed=(Math.imul(1664525,seed)+1013904223)>>>0; return seed/4294967296; }
function tri(a,b,c,color,kind) {
 const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);
 const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 const length=Math.hypot(...n)||1;
 for(const p of [a,b,c]) vertices.push(...p,...n.map(e=>e/length),...color,kind);
}
function quad(a,b,c,d,col,kind=0){tri(a,b,c,col,kind);tri(a,c,d,col,kind);}
function box(x,y,z,w,h,d,col=stone,kind=1,solid=false){
 const l=x-w/2,r=x+w/2,f=z-d/2,b=z+d/2;
 const a=[l,y,f],c=[r,y,f],e=[r,y,b],g=[l,y,b];
 const A=[l,y+h,f],C=[r,y+h,f],E=[r,y+h,b],G=[l,y+h,b];
 quad(c,a,A,C,col,kind);quad(e,c,C,E,col,kind);quad(g,e,E,G,col,kind);quad(a,g,G,A,col,kind);
 quad(A,G,E,C,col,kind);quad(a,c,e,g,col,kind);
 if(solid) walls.push([l,r,f,b,y,y+h]);
}
function walk(x,z,w,d,y){surfaces.push([x-w/2,x+w/2,z-d/2,z+d/2,y]);}
function floor(x,z,w,d,y,col=stone,kind=1){
 box(x,y-.23,z,w,.23,d,col,kind);walk(x,z,w,d,y);
}
function ambient(x,y,z,power=1){
 lights.push([x,y,z,power]);
}
// Durchgehender gemauerter Bogen, mit sichtbaren Keilsteinen an beiden Stirnseiten.
function arch(x,z,y,r,spring,depth,thick=.34){
 const pieces=20, increment=Math.PI/pieces;
 const point=(t,R,Z)=>[x+Math.cos(t)*R,y+spring+Math.sin(t)*R,Z];
 const n=z-depth/2,f=z+depth/2;
 function stoneSlice(a,b,c){
  quad(point(a,r,n),point(b,r,n),point(b,r+thick,n),point(a,r+thick,n),c,6);
  quad(point(b,r,f),point(a,r,f),point(a,r+thick,f),point(b,r+thick,f),c,6);
  quad(point(a,r,f),point(b,r,f),point(b,r,n),point(a,r,n),c,6);
  quad(point(a,r+thick,n),point(b,r+thick,n),point(b,r+thick,f),point(a,r+thick,f),c,6);
 }
 for(let i=0;i<pieces;i++){
  const a=i*increment,b=(i+1)*increment;
  const c=trim.map(v=>v*(.95+.08*rand()));
  stoneSlice(a,b-.004,c);
  stoneSlice(b-.004,b,trim.map(v=>v*.68));
 }
}

function portal(x,z,y,width,opening,height,depth){
 const r=opening/2,spring=1.68;
 const side=(width-opening)/2;
 for(const sign of [-1,1])box(x+sign*(r+side/2),y,z,side,height,depth,stone,1,true);
 arch(x,z,y,r,spring,depth+.08);
 for(let i=0;i<20;i++){
  const a=Math.PI*i/20,b=Math.PI*(i+1)/20;
  const lower=(angle,Z)=>[x+Math.cos(angle)*r,y+spring+Math.sin(angle)*r,Z];
  for(const Z of [z-depth/2,z+depth/2]){
   const p=lower(a,Z),q=lower(b,Z);
   const corners=[p,q,[q[0],y+height,Z],[p[0],y+height,Z]];
   if(Z>z)corners.reverse();
   quad(...corners,stone,1);
  }
 }
 walls.push([x-r,x+r,z-depth/2,z+depth/2,y+spring+r*.82,y+height]);
 for(const sign of [-1,1])box(x+sign*(r+.12),y,z,.24,spring,depth+.12,trim);
}
function parapet(x,z,w,d,y){
 box(x,y,z,w,.82,d,stone,1,true);
 const length=Math.max(w,d), count=Math.max(2,Math.round(length/1.48));
 for(let i=0;i<count;i++){
  const offset=(i+.5)*length/count-length/2;
  box(x+(w>d?offset:0),y+.82,z+(w>d?0:offset),w>d?.74:w,.55,w>d?d:.74,trim);
 }
}
function stairs(x,z,w,n,step,y0,y1,dir){
 const rise=(y1-y0)/n, left=x-w/2,right=x+w/2;
 const thickness=.34+Math.abs(rise);
 const sideColor=trim.map(v=>v*.90);
 const face=(a,b,c,d)=>dir>0?quad(a,b,c,d,sideColor,10):quad(d,c,b,a,sideColor,10);
 for(let i=0;i<n;i++){
  const y=y0+rise*(i+1),a=z+dir*i*step,b=z+dir*(i+1)*step;
  const lowA=y0+rise*i-thickness,lowB=y-thickness;
  walk(x,(a+b)/2,w,step+.0004,y);
  const front=Math.min(a,b),back=Math.max(a,b);
  quad([left,y,front],[left,y,back],[right,y,back],[right,y,front],trim,10);
  face([right,lowA,a],[right,lowB,b],[left,lowB,b],[left,lowA,a]);
  face([left,lowA,a],[left,lowB,b],[left,y,b],[left,y,a]);
  face([right,lowB,b],[right,lowA,a],[right,y,a],[right,y,b]);
  const previous=i===0?lowA:y-rise;
  face([left,previous,a],[left,y,a],[right,y,a],[right,previous,a]);
  if(i===n-1)face([right,lowB,b],[right,y,b],[left,y,b],[left,lowB,b]);
 }
}
function pitched(x,z,y,w,d,rise){
 const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];
 const p=[x,y+rise,z-d/2],q=[x,y+rise,z+d/2];
 quad(a,p,q,e,[.28,.32,.32],5);quad(b,c,q,p,[.28,.32,.32],5);
 tri(a,b,p,stone,1);tri(e,q,c,stone,1);
}
function cylinder(x,y,z,r,h,color,kind=0,r2=r,segments=12){
 for(let i=0;i<segments;i++){
  const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
  const p=(angle,radius,Y)=>[x+Math.cos(angle)*radius,Y,z+Math.sin(angle)*radius];
  quad(p(a,r,y),p(a,r2,y+h),p(b,r2,y+h),p(b,r,y),color,kind);
  tri([x,y+h,z],p(b,r2,y+h),p(a,r2,y+h),color,kind);
 }
}
function rock(x,y,z,w,h,d){
 const rings=[];
 const sides=7;
 for(let j=0;j<3;j++){
  const r=[1,.92,.59][j];
  rings.push(Array.from({length:sides},(_,i)=>{
   const a=(i+j*.23)/sides*Math.PI*2,f=.78+.36*rand();
   return [x+Math.cos(a)*w*r*f,y+h*(j*.41+.16*rand()),z+Math.sin(a)*d*r*f];
  }));
 }
 const color=[.38,.39,.35];
 for(let i=0;i<sides;i++){
  const j=(i+1)%sides;
  for(let k=0;k<2;k++)quad(rings[k][i],rings[k+1][i],rings[k+1][j],rings[k][j],color.map(c=>c*(.83+rand()*.25)),6);
  tri([x,y+h,z],rings[2][j],rings[2][i],color,6);
 }
}
function hillside(x,z,w,d,height){
 const rows=17;
 const pts=Array.from({length:rows+1},(_,j)=>Array.from({length:rows+1},(_,i)=>{
  const a=i/rows*2-1,b=j/rows*2-1;
  const base=Math.max(0,1-Math.sqrt(a*a+b*b));
  return [x+a*w,-4.95+Math.pow(base,1.17)*height*(.8+rand()*.29),z+b*d];
 }));
 for(let j=0;j<rows;j++)for(let i=0;i<rows;i++){
  quad(pts[j][i],pts[j+1][i],pts[j+1][i+1],pts[j][i+1],[.28,.34,.27],3);
 }
}
// Felsplateau, Graben und hölzerne Brücke.
floor(0,1,156,150,-4.8,grass,3);
hillside(-72,-37,19,24,17);
hillside(77,-46,21,23,20);
hillside(-49,34,28,24,15);
hillside(41,39,18,21,10);
hillside(4,-99,28,25,19);
for(const sign of [-1,1]){
 for(let i=0;i<60;i++){
  const z=14+rand()*11;
  const x=sign*(2.65+rand()*17);
  rock(x,-4.9,z,1+rand()*1.6,1+rand()*3.55,1+rand()*1.4);
 }
 for(let i=0;i<24;i++)rock(sign*(15.8+rand()*4),-5,-20+rand()*32,1+rand()*2,1+rand()*3,1+rand()*2);
}
floor(0,24,33,12,0,grass,3);
for(let i=0;i<15;i++){
 const z=18.6+i*.75,x=-.013*Math.max(0,z-28)**2;
 const next=-.013*Math.max(0,z+.75-28)**2;
 quad([x-1.94,.01,z],[next-1.94,.01,z+.75],[next+1.94,.01,z+.75],[x+1.94,.01,z],[.38,.34,.26],6);
}
quad([-19,-3.85,14.1],[-19,-3.85,19.1],[19,-3.85,19.1],[19,-3.85,14.1],[.17,.24,.24],8);

floor(0,16,4.3,7,0,wood,2);
for(let i=0;i<26;i++)box(0,-.035,12.7+i*.26,4.28,.035,.243,wood.map(v=>v*(.78+.28*rand())),2);
for(const s of [-1,1]){
 box(s*2.08,.65,16,.12,.13,7,wood,2,true);
 for(let i=0;i<5;i++)box(s*2.08,0,12.8+i*1.6,.16,.91,.16,wood,2,true);
}
for(let i=0;i<260;i++){
 const x=(rand()-.5)*90,z=(rand()-.5)*89;
 if(Math.abs(x)<24 && Math.abs(z)<32)continue;
 if(x>-53&&x<47&&z<-23&&z>-74)continue;
 const size=.5+rand()*3.5;
 rock(x,-4.85,z,size*.55,.25+rand()*2.2,size*.43);
}
for(let i=0;i<115;i++){
 const x=(rand()-.5)*155,z=(rand()-.5)*155;
 if(Math.abs(x)<29&&Math.abs(z)<36)continue;
 if(x>-53&&x<47&&z<-23&&z>-74)continue;
 const h=2+rand()*5;
 box(x,-4.9,z,.22,h*.75,.22,wood,2);
 for(let k=0;k<3;k++){
  const y=-4.9+h*(.26+k*.2),r=h*(.26-k*.047);
  for(let j=0;j<7;j++){
   const a=j*6.283/7,b=(j+1)*6.283/7;
   tri([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x,y+h*.52,z],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[.22,.29,.21],3);
  }
 }
}
// Der Hof hat eine offene Kellertreppe an der Ostseite.
floor(-2,0,26,25,0);
floor(13,9,4,7,0);floor(13,-10.7,4,3.6,0);
floor(14.7,-1.7,.6,14.4,0);
stairs(12.91,5.5,2.58,29,.44,0,-4.35,-1);
// Gerades Kellerpodest außerhalb des Treppenlaufs.
floor(12.87,-8.02,2.66,1.52,-4.35,dark);
box(11.06,0,-1.66,.18,.69,14.32,stone,1,true);
box(12.7,0,-8.84,3.29,.69,.18,stone,1,true);
box(14.34,0,-1.7,.14,.73,14.36,stone,1,true);
box(11.07,-4.58,-.1,.28,4.53,11.7,dark,1,true);
box(14.37,-4.58,-1.7,.32,4.53,14.5,dark,1,true);
box(12.7,-4.58,-8.98,3.35,4.6,.28,dark,1,true);
for(const s of [-1,1]){
 if(s>0)box(15.1,0,0,1,5.5,26,stone,1,true);
 else {
  for(const z of [-7.4,7.4])box(-15.1,0,z,1,5.5,11.2,stone,1,true);
  box(-15.1,3.05,0,1,2.45,3.6,stone,1,true);
  floor(-15.13,0,1.5,3.6,0);
 }
 parapet(s*15.1,0,1.15,26,5.5);
 for(const [center,width] of [[3.2,2.4],[12.18,7.12]]){
  box(s*center,0,12,width,5.5,1.25,stone,1,true);
  parapet(s*center,12,width,1.25,5.5);
 }
}
portal(0,12,0,5.7,4,5.5,1.7);
parapet(0,12,5.8,1.35,5.5);
for(const s of [-1,1]){
 const x=s*6.5,z=11.54, front=14.27, rear=8.81;
 floor(x,z,4.25,5.46,0);
 for(const side of [-1,1]){
  box(x+side*1.94,0,z,.42,7.7,5.49,stone,1,true);
  box(x+side*1.36,0,rear,1.54,7.7,.38,stone,1,true);
 }
 box(x,2.62,rear,1.2,5.08,.38,stone,1,true);
 box(x,0,front,4.25,7.7,.42,stone,1,true);
 box(x,6.98,front+.23,4.56,.43,.32,trim);
 for(let k=-2;k<=2;k++)box(x+k*.83,6.66,front+.26,.29,.4,.39,trim);
 stairs(x-.87,9.64,1.53,20,.175,0,3.85,1);
 floor(x,13.52,3.45,.77,3.85);
 stairs(x+.87,13.14,1.53,20,.175,3.85,7.7,-1);
 floor(x,9.34,3.45,.62,7.7);
 floor(x-.845,11.725,1.76,4.15,7.7);
 box(x+.04,7.7,11.99,.13,.82,4.12,stone,1,true);
 ambient(x-1.58,2.76,11.42);ambient(x+1.58,5.36,11.86);
 for(const a of [-1,1]){
  parapet(x,z+a*2.68,4.55,.38,7.68);
  parapet(x+a*2.02,z,.38,4.98,7.68);
 }
 for(const y of [3.45,5.28])box(x,y,front+.23,.16,.72,.035,[.12,.105,.085],0);
 ambient(s*2.3,2.36,13.02);
}
// Palas mit offenem Torbogen, Balkendecke und gemauertem Kamin.
floor(0,-19.3,23,14,0);
portal(0,-12.55,0,6.06,3.8,6.8,.85);
for(const side of [-1,1]){
 const x=side*7.265,z=-12.55;
 box(x,0,z,8.47,2.22,.85,stone,1,true);
 box(x,4.87,z,8.47,1.93,.85,stone,1,true);
 for(const dx of [-3.18,0,3.18])box(x+dx,2.2,z,2.11,2.69,.85,stone,1,true);
 for(const dx of [-1.59,1.59]){
  box(x+dx,2.14,z,1.17,.13,1.05,trim);
  box(x+dx-.57,2.22,z,.115,2.39,.92,trim);
  box(x+dx+.57,2.22,z,.115,2.39,.92,trim);
  arch(x+dx,z,3.7,.54,.57,.95,.15);
  box(x+dx,4.72,z,1.08,.15,.85,stone);
  for(const offset of [-.31,0,.31])box(x+dx+offset,2.25,z,.051,2.04,.052,iron);
  box(x+dx,3.39,z,1.03,.058,.06,iron);
 }
}
portal(-7,-26,0,9,2.85,6.8,.75);
portal(7,-26,0,9,2.85,6.8,.75);
box(0,0,-26,5,6.8,.75,stone,1,true);
for(const s of [-1,1]){
 const x=s*11.25;
 const south=-12.55,north=-26, sill=1.5, lintel=4.7;
 const span=south-north;
 box(x,0,(south+north)/2,.8,sill,span,stone,1,true);
 box(x,lintel,(south+north)/2,.8,6.8-lintel,span,stone,1,true);
 for(const [near,far] of [[north,-23.1],[-21.4,-18.6],[-16.9,south]]){
  box(x,sill,(near+far)/2,.8,lintel-sill,far-near,stone,1,true);
 }
 for(const z of [-22.25,-17.75]){
  box(x,1.48,z,1.04,.16,1.72,trim);
  for(let i=-1;i<=1;i++)box(x,1.56,z+i*.39,.07,3.14,.048,iron,0);
  box(x,3.06,z,.07,.045,1.65,iron,0);
 }
}
pitched(0,-19.35,6.8,23.85,14.5,4.05);
for(let i=0;i<7;i++){
 const z=-13.8-i*1.85;
 box(0,5.87,z,22,.3,.29,wood,2);
 for(const s of [-1,1])box(s*10.7,4.95,z,.26,.98,.36,wood,2);
}
box(0,6.3,-19.4,22,.25,13,wood,2);
box(2.4,8,-24.5,1.5,3.9,1.3,stone);
box(2.4,11.75,-24.5,1.8,.26,1.65,trim);
for(const s of [-1,1])box(s*1.26,0,-24.95,.63,2.65,1.2,trim,1,true);
box(0,2.36,-24.95,3.18,.54,1.29,trim);
box(0,2.48,-24.23,3.46,.15,.26,trim);
box(0,2.85,-24.92,3.5,.19,1.38,trim);
box(0,3.03,-25.13,2.73,1.55,.74,dark);
box(0,4.57,-25.13,2.96,.18,.88,trim);
for(const x of [-1.42,1.42])cylinder(x,2.47,-24.2,.128,.55,trim,1,.082,8);
floor(0,-24.83,2.43,1.48,.16,dark);
box(0,.16,-25.48,2,1.96,.06,[.22,.19,.16],1,true);
for(const z of [-15,-19,-23])ambient(0,3.8,z,.85);
// Westturm mit Treppe im Innenraum und frei begehbarer Aussichtsplattform.
const tx=-19;
floor(tx,0,7.4,10,0);
for(const z of [-3.52,3.52])box(-15.28,0,z,.65,7.1,3.2,stone,1,true);
box(-15.28,3.12,0,.65,3.98,4,stone,1,true);
box(-22.74,0,0,.78,7.1,10.65,stone,1,true);
for(const z of [-5.24,5.24])box(tx,0,z,8.2,7.1,.72,stone,1,true);
stairs(-20.55,3.75,2.35,34,.241,0,7.1,-1);
floor(-17.5,0,3.75,10,7.1);
floor(-20.55,-4.61,2.35,.78,7.1);
for(const z of [-4.94,4.94])parapet(tx,z,8.2,.46,7.1);
for(const x of [-22.65,-15.28])parapet(x,0,.48,9.42,7.1);
box(-19.02,7.1,.32,.17,.88,7.7,stone,1,true);
ambient(-21.7,2.8,1.4);ambient(-21.7,5.8,-2.35);
ambient(-16.3,2.3,-4.7);
// Gewölbekeller unter dem Hof: gemauerter Tonnenbogen und Gurtbögen.
const cy=-4.35;
floor(-.2,-4.6,23,8.7,cy,dark);
floor(11.1,-8.02,1.41,1.52,cy,dark);
// Stirnwände schließen bis an die Wölbung. Im Osten bleibt der Kellerzugang frei.
const endDoor={left:-8.75,right:-7.52,height:2.11};
for(const [x,depth,hasDoor] of [[-11.82,.58,false],[11.45,.35,true]]){
 const profile=[-9.09,-8.92,-.28,-.10];
 for(let i=1;i<22;i++)profile.push(-4.60+4.32*Math.cos(i*Math.PI/22));
 if(hasDoor)profile.push(endDoor.left,endDoor.right);
 profile.sort((a,b)=>a-b);
 const heightAt=z=>1.69+2.47*Math.sqrt(Math.max(0,1-((z+4.60)/4.32)**2));
 for(let i=0;i<profile.length-1;i++){
  const a=profile[i],b=profile[i+1],mid=(a+b)/2;
  const base=hasDoor&&mid>endDoor.left&&mid<endDoor.right?endDoor.height:0;
  const upA=Math.max(base,heightAt(a)),upB=Math.max(base,heightAt(b));
  for(const sign of [-1,1]){
   const face=x+sign*depth/2;
   const points=[[face,cy+base,a],[face,cy+base,b],[face,cy+upB,b],[face,cy+upA,a]];
   if(sign>0)points.reverse();
   quad(...points,stone,1);
  }
  if(base===0)walls.push([x-depth/2,x+depth/2,a,b,cy,cy+Math.max(upA,upB)]);
 }
 if(hasDoor){
  box(x,cy+endDoor.height,(endDoor.left+endDoor.right)/2,depth,.13,endDoor.right-endDoor.left,trim,6);
  for(const z of [endDoor.left,endDoor.right])box(x,cy,z,depth,.12+endDoor.height,.065,trim,6);
 }
}
for(const z of [-8.94,-.25])box(-.2,cy,z,23.2,1.78,.38,stone,1,true);
for(let i=0;i<22;i++){
 const a=i*Math.PI/22,b=(i+1)*Math.PI/22;
 const p=(x,t)=>[x,cy+1.69+2.47*Math.sin(t),-4.60+4.32*Math.cos(t)];
 quad(p(-11.82,a),p(11.45,a),p(11.45,b),p(-11.82,b),dark,1);
}
for(const x of [-9,-4.8,-.6,3.6,7.8]){
 for(let i=0;i<25;i++){
  const a=i*Math.PI/25,b=(i+1)*Math.PI/25;
  const p=(xx,t,r)=>[xx,cy+1.67+(2.45+r)*Math.sin(t),-4.6+(4.12+r)*Math.cos(t)];
  const c=trim.map(v=>v*(.95+.055*rand()));
  quad(p(x-.2,b,0),p(x+.2,b,0),p(x+.2,a,0),p(x-.2,a,0),c,6);
  for(const s of [-1,1])quad(p(x+s*.2,a,0),p(x+s*.2,b,0),p(x+s*.2,b,.29),p(x+s*.2,a,.29),c);
 }
 for(const z of [-8.71,-.48])box(x,cy,z,.56,1.69,.4,trim,1,true);
 ambient(x,cy+2.03,-8.35);
 ambient(x+.8,cy+2.12,-.78);
}
ambient(13.7,-1.5,-3.5);ambient(13.66,-2.04,-7.53);
// Fundament am Graben und niedrige Zugmauern neben dem Tor.
for(const s of [-1,1]){
 box(s*9.18,-4.8,12,14.4,4.8,2.45,dark);
 box(s*15.2,-4.8,0,2,4.8,26,dark);
 box(s*6.5,-4.8,12.2,4.4,4.8,4.4,dark);
}
box(0,-4.8,-26.1,23,4.8,1.7,dark);
box(-19,-4.8,0,8.2,4.8,10.7,dark);
box(0,-4.8,24,33,4.8,12,grass,3);
// Außenzugang zum Wehrgang an der Nordwestseite des Hofes.
stairs(-13.1,-11.6,1.9,28,.44,0,5.5,1);
floor(-13.1,.61,1.9,.55,5.5);
floor(-13.76,1.59,2.13,1.64,5.5);
floor(-13.66,7.34,2.05,10.1,5.5);
parapet(-12.69,7.32,.18,10.15,5.5);
parapet(-13.65,12.46,2.24,.22,5.5);
for(let i=0;i<28;i++){
 const h=(i+1)*5.5/28;
 box(-12.21,h,-11.6+(i+.5)*.44,.13,.36,.445,trim,1,true);
}
box(-13.1,-.11,-11.8,1.9,.11,.4,trim);
for(const x of [-10.52,-4.08,4.08,10.52]){
 box(x,0,-12.01,.43,5.54,.47,trim);
 box(x,5.38,-12.01,.53,.22,.59,trim);
}
// Hofkapelle mit steilem Schieferdach, Blickachse zum Fenster und offenem Portal.
const chapelX=7, chapelZ=-5.66;
portal(chapelX,-1.58,0,6.20,1.84,5.34,.52);
for(const x of [4.04,9.96]){
 box(x,0,chapelZ,.48,5.34,8.08,stone,1,true);
 for(const z of [-8.1,-3.87]){
  box(x+Math.sign(x-7)*.23,0,z,.56,3.8,.63,trim);
  box(x+Math.sign(x-7)*.33,3.76,z,.63,.16,.7,trim);
 }
}
box(7,0,-9.67,6.34,5.34,.47,stone,1,true);
pitched(7,chapelZ,5.31,6.65,8.62,3.75);
for(const dx of [-.77,.77]){
 box(7+dx,5.32,-1.04,.33,3.12,.53,trim);
 box(7+dx,7.95,-1.04,.5,.16,.67,dark);
 box(7+dx,5.24,-1.05,.56,.26,.91,trim);
}
arch(7,-1.04,7.11,.63,.12,.54,.20);
box(7,7.95,-1.04,2.17,.24,.76,trim);
pitched(7,-1.04,8.15,2.40,.88,1.17);
for(const z of [-3.25,-5.55,-7.86]){
 arch(7,z,0,2.73,2.42,.30,.26);
 for(const x of [4.35,9.65])cylinder(x,0,z,.16,2.52,trim,1,.15,10);
}
floor(7,-8.67,3.13,1.6,.14,trim);
ambient(7,2.45,-7.7,.88);
ambient(7,2.45,-3.65,.75);
const glassColors=[[.13,.46,.66],[.35,.17,.43],[.81,.55,.22],[.18,.37,.50],[.65,.19,.18]];
const windowZ=-9.406;
const windowBottom=1.64, windowTop=4.36, glassWidth=1.62;
const glassTop=x=>windowTop-Math.pow(Math.abs(x-7),1.29)*1.08;
for(let i=0;i<17;i++){
 const x=6.15+i*.10,X=x+.101,Z=windowZ-.011;
 quad([x,1.57,Z],[X,1.57,Z],[X,glassTop(X),Z],[x,glassTop(x),Z],[.135,.115,.107]);
}
for(let i=0;i<16;i++){
 const width=glassWidth/16,l=7-glassWidth/2+i*width;
 for(let row=0;row<13;row++){
  const y=windowBottom+row*.21,r=l+width;
  const a=Math.min(y+.187,glassTop(l)),b=Math.min(y+.187,glassTop(r));
  if(y>=Math.min(a,b))continue;
  const edge=i<2||i>13||row===0;
  const radius=Math.hypot((i-7.5)*.12,(row-6.5)*.18);
  const motif=(i===7||i===8||row===7)&&radius<.48;
  const color=edge?4:motif||Math.abs(radius-.58)<.12?2:radius<.58?1:(i+row)%3===0?3:0;
  quad([l+.006,y,windowZ],[r-.006,y,windowZ],[r-.006,b,windowZ],[l+.006,a,windowZ],glassColors[color],9);
 }
}
for(const x of [6.15,7.85])box(x,1.53,windowZ,.07,2.15,.09,iron);
box(7,1.59,windowZ,1.78,.09,.09,iron);
for(let i=0;i<16;i++){
 const x=6.19+i*.101;
 quad([x,glassTop(x),windowZ],[x+.102,glassTop(x+.102),windowZ],[x+.102,glassTop(x+.102)+.077,windowZ],[x,glassTop(x)+.077,windowZ],iron);
}
// Hinterburg: zwei Raumflügel um den oberen Hof und ein zweigeschossiger Nordbau.
const newPlaces=[];
function doorAlongZ(x,z,y,length,opening,height,thickness=.48){
 const jamb=(length-opening)/2;
 for(const side of [-1,1]){
  box(x,y,z+side*(opening/2+jamb/2),thickness,height,jamb,stone,1,true);
  box(x,y,z+side*(opening/2+.075),thickness+.13,2.24,.15,trim);
 }
 box(x,y+2.24,z,thickness,height-2.24,opening,stone,1,true);
 box(x,y+2.24,z,thickness+.13,.16,opening+.32,trim);
}
floor(0,-37.75,23,24,0);
for(const x of [-7,7])ambient(x+1.95,2.75,-26.60);
for(const sign of [-1,1]){
 const x=sign*16.5;
 const names=sign<0?['Burgküche','Backstube','Vorratskammer']:['Wachstube','Schreibstube','Werkraum'];
 floor(x,-37.75,10,24,0);
 if(sign<0){
  box(-21.46,-4.8,-37.75,.84,4.8,24.4,stone);
  doorAlongZ(-21.46,-45.5,0,8.4,2.5,4.91,.84);
  box(-21.46,0,-33.3,.84,4.91,16.0,stone,1,true);
 }
 else {
  box(21.46,-4.8,-37.75,.84,4.8,24.4,stone);
  doorAlongZ(21.46,-37.75,0,24.4,2.54,4.91,.84);
 }
 box(x,0,-25.84,10,4.9,.48,stone,1,true);
 for(const z of [-33.8,-41.6])box(sign*17.57,0,z,7.96,4.9,.43,stone,1,true);
 for(let i=0;i<3;i++){
  const z=-29.9-i*7.8;
  doorAlongZ(sign*13.74,z,0,7.8,1.74,4.9);
  ambient(sign*14.12,2.72,z+1.73);
  ambient(sign*21.0,2.88,z-1.55);
  newPlaces.push([names[i],sign*17.1,z,0,sign*Math.PI/2]);
 }
 for(const z of [-27.5,-32.7,-37.9,-43.1,-48.3]){
  box(sign*11.62,0,z,.47,4.8,.52,trim,1,true);
 }
 box(x,4.78,-37.75,10.25,.25,24.25,wood,2);
 pitched(x,-37.75,5.0,10.46,24.5,2.77);
 // Getrennte Arkadenwege münden direkt in die untere Nordhalle.
 portal(sign*12.63,-49.56,0,2.41,1.52,4.4,.52);
}
const northNames=[['Archiv','Verbindungshalle','Versammlungssaal'],['Fürstenkammer','Oberer Saal','Gästekammer']];
const upper=4.4;
floor(0,-59.85,43,20.2,0);
portal(0,-49.56,0,22.52,4.22,4.4,.59);
for(const side of [-1,1]){
 box(side*11.34,0,-49.56,.19,4.4,.59,stone,1,true);
 box(side*17.55,0,-49.56,7.45,4.4,.59,stone,1,true);
 if(side<0){
  box(-21.45,-4.8,-59.85,.86,4.8,20.6,stone);
  doorAlongZ(-21.45,-55.35,0,8.55,2.54,4.4,.86);
  box(-21.45,0,-50.31,.86,4.4,1.54,stone,1,true);
  box(-21.45,0,-64.8,.86,4.4,10.85,stone,1,true);
  box(-21.45,4.4,-59.85,.86,4.4,20.6,stone,1,true);
 }
 else {
  box(21.45,-4.8,-59.85,.86,4.8,20.6,stone);
  doorAlongZ(21.45,-55.35,0,8.55,2.54,4.4,.86);
  box(21.45,0,-50.31,.86,4.4,1.54,stone,1,true);
  box(21.45,0,-64.8,.86,4.4,10.85,stone,1,true);
  box(21.45,4.4,-59.85,.86,4.4,20.6,stone,1,true);
 }
}
box(0,-4.8,-69.95,43,13.6,.77,stone,1,true);
for(const x of [-8.0,8.0]){
 stairs(x,-51.1,2.52,24,.39,0,upper,-1);
 for(const sign of [-1,1])box(x+sign*1.33,0,-55.82,.17,1.15,9.35,stone,1,true);
}
for(const [x,w] of [[-15.38,12.23],[0,13.48],[15.38,12.23]])floor(x,-55.51,w,9.87,upper);
floor(0,-65.2,43,9.54,upper);
floor(0,-50.55,43,1.0,upper);
for(const x of [-9.4,-6.6,6.6,9.4])box(x,upper,-55.77,.13,.81,9.39,stone,1,true);
for(const x of [-8,8])box(x,upper,-51.03,2.5,.82,.17,stone,1,true);
for(const side of [-1,1]){
 box(side*15.02,upper,-49.9,12.90,4.4,.68,stone,1,true);
 for(const dx of [-4.9,-1.65,1.65,4.9]){
  box(side*15.02+dx,upper+.91,-49.49,.31,2.53,.16,trim);
 }
}
portal(0,-49.9,upper,17.14,3.8,4.4,.62);
floor(0,-48.11,7.7,4.2,upper);
parapet(0,-46.02,7.99,.34,upper);
for(const x of [-3.85,3.85])parapet(x,-47.93,.34,3.47,upper);
for(const [level,names] of northNames.entries()){
 const y=level*upper;
 for(const x of [-14.2,0,14.2]){
  portal(x,-62.13,y,14.2,2.25,4.4,.47);
  ambient(x+1.85,y+2.46,-61.78);
  ambient(x-2.35,y+2.44,-68.79);
  newPlaces.push([names[Math.round(x/14.2)+1],x,-65.8,y,0]);
 }
 for(const x of [-7.1,7.1])box(x,y,-66.03,.53,4.4,7.8,stone,1,true);
}
for(const x of [-17.4,-6,6,17.4]){
 ambient(x,2.7,-51.3);
 ambient(x,upper+2.7,-50.81);
}
box(0,8.62,-59.85,43.65,.23,20.7,wood,2);
pitched(0,-59.85,8.83,44.4,21.2,6.8);
newPlaces.push(['Oberer Burghof',0,-38,0,0],['Nordhalle',0,-55,0,0],
 ['Obergeschoss',0,-60.8,upper,Math.PI],['Hofbalkon',0,-47.7,upper,Math.PI]);
// Osthof mit einem zweiten Rückweg zur Hinterburg.
const eastPlaces=[];
floor(32.3,-48.85,22.6,33.0,0);
floor(21.5,-48.85,.72,33.0,0);
box(32.45,0,-32.48,22.4,4.8,.54,stone,1,true);
box(32.45,0,-65.25,22.4,4.8,.54,stone,1,true);
box(43.45,-4.8,-48.85,.78,9.6,33.35,stone,1,true);
parapet(43.45,-48.85,.78,33.35,4.8);
parapet(32.45,-32.48,22.4,.54,4.8);
parapet(32.45,-65.25,22.4,.54,4.8);
const eastNames=['Torstube Ost','Steinkammer','Lagerhalle','Nordkammer'];
for(const [i,name] of eastNames.entries()){
 const z=-36.6-i*8.15;
 doorAlongZ(35.3,z,0,8.15,1.92,4.8);
 ambient(39.4,3.2,z,1.05);
 eastPlaces.push([name,39.4,z,0,-Math.PI/2]);
}
for(const z of [-40.675,-48.825,-56.975])box(39.36,0,z,8.12,4.8,.46,stone,1,true);
for(const z of [-34,-41.4,-48.85,-56.3,-63.7])box(32.9,0,z,.44,4.8,.49,trim,1,true);
box(38.15,4.7,-48.84,11.2,.23,33,wood,2);
pitched(38.15,-48.84,4.93,11.46,33.2,2.9);
eastPlaces.push(['Osthof',27,-46,0,0]);
// Westhof: neue Verbindung zwischen Vorratskammer und Nordhalle.
const westPlaces=[];
floor(-36.8,-49,31.3,36,0);
for(const z of [-31.08,-66.92]){
 box(-37,0,z,31,4.82,.62,stone,1,true);
 parapet(-37,z,31,.64,4.82);
}
box(-52.43,-4.8,-49,.72,9.62,36.4,stone,1,true);
parapet(-52.43,-49,.77,36.4,4.82);
const westNames=['Südsaal','Steingalerie','Westkammer','Bogensaal','Nordsaal'];
for(const [i,name] of westNames.entries()){
 const z=-34.6-i*7.2;
 doorAlongZ(-42.25,z,0,7.2,2.08,4.82);
 ambient(-47.4,3.65,z,1.35);
 westPlaces.push([name,-47.4,z,0,-Math.PI/2]);
}
for(const z of [-38.2,-45.4,-52.6,-59.8])box(-47.35,0,z,10.25,4.82,.46,stone,1,true);
for(const z of [-32.3,-40.65,-49,-57.35,-65.7])box(-39.5,0,z,.57,4.82,.6,trim,1,true);
box(-45.99,4.69,-49,13.0,.28,36.3,wood,2);
pitched(-45.99,-49,4.97,13.5,36.45,3.4);
westPlaces.push(['Westhof',-31,-47,0,-Math.PI/2]);
// Der Start ist bewusst weiter vor der Brücke positioniert.
const destinations=[
 ['Burgbrücke',0,28,0,0],
 ['Burghof',0,4,0,0],
 ['Rittersaal',0,-16,0,0],
 ['Westturm',-17,1,0,-1.57],
 ['Turmplattform',-17.7,-3,7.1,2.2],
 ['Wehrgang',-13.65,6.1,5.5,0],
 ['Gewölbekeller',8,-5.55,cy,-Math.PI/2],
 ['Linker Torturm',-7.35,11.3,7.7,.3],
 ['Rechter Torturm',5.65,11.3,7.7,-.3],
 ['Burgkapelle',7,-2.64,0,0],
 ...newPlaces, ...eastPlaces, ...westPlaces
];
// Das Sonnenlicht nutzt eine einmalig aus der Burggeometrie berechnete Tiefenkarte.
const shadowSize=640, shadowWorld=154;
const sunLength=Math.hypot(-.46,.73,.58);
const sun=[-.46/sunLength,.73/sunLength,.58/sunLength];
const sunRight=[sun[2]/Math.hypot(sun[0],sun[2]),0,-sun[0]/Math.hypot(sun[0],sun[2])];
const sunUp=[sun[1]*sunRight[2],sun[2]*sunRight[0]-sun[0]*sunRight[2],-sun[1]*sunRight[0]];
function makeShadowMap(){
 const grid=new Float32Array(shadowSize*shadowSize).fill(-100);
 const scale=shadowSize/shadowWorld;
 function project(i){
  const x=vertices[i],y=vertices[i+1],z=vertices[i+2];
  return [(x*sunRight[0]+z*sunRight[2])*scale+shadowSize*.5,
          (x*sunUp[0]+y*sunUp[1]+z*sunUp[2])*scale+shadowSize*.5,
          x*sun[0]+y*sun[1]+z*sun[2]];
 }
 for(let i=0;i<vertices.length;i+=30){
  const a=project(i),b=project(i+10),c=project(i+20);
  const dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1];
  const det=dx*ey-dy*ex;
  if(Math.abs(det)<.0001)continue;
  const loX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));
  const hiX=Math.min(shadowSize-1,Math.ceil(Math.max(a[0],b[0],c[0])));
  const loY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));
  const hiY=Math.min(shadowSize-1,Math.ceil(Math.max(a[1],b[1],c[1])));
  for(let y=loY;y<=hiY;y++)for(let x=loX;x<=hiX;x++){
   const px=x+.5-a[0],py=y+.5-a[1];
   const u=(px*ey-py*ex)/det,v=(dx*py-dy*px)/det;
   if(u<0||v<0||u+v>1)continue;
   const depth=a[2]+(b[2]-a[2])*u+(c[2]-a[2])*v;
   const idx=y*shadowSize+x;
   if(depth>grid[idx])grid[idx]=depth;
  }
 }
 const packed=new Uint8Array(grid.length*4);
 for(let i=0;i<grid.length;i++){
  const value=Math.round(Math.max(0,Math.min(1,(grid[i]+100)/200))*65535);
  packed[i*4]=value>>8;packed[i*4+1]=value&255;packed[i*4+3]=255;
 }
 return packed;
}
const shadowPixels=makeShadowMap();
const vertexSource=`
attribute vec3 pos, normal, color;
attribute float material;
uniform mat4 projection;
uniform vec3 eye;
uniform vec3 right, up, back;
varying vec3 p,n,c;
varying float m;
void main(){
 vec3 q=pos-eye;
 gl_Position=projection*vec4(dot(q,right),dot(q,up),dot(q,back),1.);
 p=pos; n=normal; c=color; m=material;
}`;
const fragmentSource=`
precision highp float;
varying vec3 p,n,c;
varying float m;
uniform vec3 eye;
uniform vec4 lamps[12];
uniform float time;
uniform sampler2D shadowTex;
uniform vec3 sunDir,sunAcross,sunVertical;
float occlusion(vec2 uv,float d,float bias){
 vec2 encoded=texture2D(shadowTex,uv).rg*255.;
 float depth=(encoded.x*256.+encoded.y)*(200./65535.)-100.;
 return step(depth-bias,d);
}
float sunlight(vec3 point,vec3 normal){
 vec2 uv=vec2(dot(point,sunAcross),dot(point,sunVertical))/154.+.5;
 if(any(greaterThan(abs(uv-.5),vec2(.496))))return 1.;
 float d=dot(point,sunDir);
 float bias=.18+.24*(1.-max(dot(normal,sunDir),0.));
 vec2 t=vec2(1.15/640.,0.);
 return (occlusion(uv,d,bias)+occlusion(uv+t.xy,d,bias)+occlusion(uv-t.xy,d,bias)
  +occlusion(uv+t.yx,d,bias)+occlusion(uv-t.yx,d,bias))*.2;
}
float hash(vec2 v){return fract(sin(dot(mod(v,289.),vec2(12.9898,78.233)))*4375.854);}
float noise(vec2 v){
 vec2 i=floor(v),f=fract(v);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
}
void main(){
 vec3 nn=normalize(n);
 vec2 uv=abs(nn.y)>.57 ? p.xz : vec2(abs(nn.x)>.65?p.z:p.x,p.y);
 float grit=noise(uv*36.), stains=noise(uv*2.3)*.64+noise(uv*.55)*.36;
 vec3 base=c;
 if(m>.5&&m<1.5){
  float row=floor(uv.y*2.12);
  float offset=hash(vec2(row,4.1));
  float stretch=.83+offset*.4;
  vec2 cell=vec2(uv.x*1.44*stretch+offset,uv.y*2.12);
  cell+=vec2(noise(uv*9.)-.5,noise(uv*12.+8.)-.5)*.043;
  vec2 edge=min(fract(cell),1.-fract(cell));
  float joint=min(edge.x,edge.y);
  float mortar=smoothstep(.013,.05,joint);
  float bevel=smoothstep(.04,.10,joint);
  base=mix(c*.49,c*(.59+.36*hash(floor(cell))+.18*grit+.38*stains)*mix(.76,1.,bevel),mortar);
  float moss=smoothstep(.56,.81,noise(uv*.88))*smoothstep(.47,.76,stains);
  base*=.84+.25*noise(uv*5.6)+.11*noise(uv*14.3+vec2(noise(uv*3.7)));
  base=mix(base,base*vec3(.66,.78,.54),moss*.9);
 } else if(m>1.5&&m<2.5){
  base*=.67+.34*noise(vec2(uv.x*30.,uv.y*1.2))+.19*stains;
 } else if(m>2.5&&m<3.5){
  base*=.62+.4*stains+.38*grit;
 } else if(m>9.5){
  base*=.86+.17*grit+.16*stains;
 } else if(m>8.5){
  base*=.81+.28*noise(uv*26.);
 } else if(m>7.5){
  float ripples=noise(uv*vec2(6.,31.)+vec2(time*.18,time*.16));
  base=mix(base,vec3(.42,.48,.42),smoothstep(.59,.82,ripples)*.65);
 } else if(m>6.5){
  base*=.88+.12*noise(uv*42.)+.10*noise(vec2(uv.x*70.,uv.y*5.));
 } else if(m>5.5){
  float vein=noise(uv*vec2(2.,14.)+2.*noise(uv*3.));
  base*=.63+.39*stains+.28*grit+.23*vein;
  base=mix(base,base*vec3(.64,.86,.57),smoothstep(.51,.82,noise(uv*.83)));
 } else if(m>4.5){
  vec2 tile=vec2(uv.x*1.95,uv.y*3.9);
  tile.x+=mod(floor(tile.y),2.)*.5;
  base*=.73+.26*hash(floor(tile))+.16*grit;
  base*=mix(.64,1.,smoothstep(.02,.10,min(fract(tile.x),fract(tile.y))));
 }
 float sun=max(0.,dot(nn,sunDir))*sunlight(p,nn);
 float underground=1.-smoothstep(-.65,.25,p.y);
 float palas=step(-25.8,p.z)*step(p.z,-12.63)*step(abs(p.x),11.2)*step(p.y,6.25);
 float tower=step(-22.65,p.x)*step(p.x,-15.4)*step(abs(p.z),5.12)*step(p.y,7.02)*step(-.08,p.y);
 float chapel=step(-9.49,p.z)*step(p.z,-1.8)*step(4.31,p.x)*step(p.x,9.69)*step(p.y,5.2)*step(-.08,p.y);
 float shelter=max(underground*.98,max(chapel*.63,max(palas*.61,tower*.74)));
 vec3 lit=mix(vec3(.44,.48,.55)+vec3(.87,.70,.46)*sun,vec3(.40,.40,.42),shelter);
 for(int i=0;i<12;i++){
  vec3 offset=lamps[i].xyz-p;
  float d=dot(offset,offset);
  float cosine=max(.26,dot(nn,normalize(offset+vec3(.0001))));
  lit+=vec3(.60,.49,.36)*lamps[i].w*mix(.68,1.,cosine)/(2.1+d*.19);
 }
 float distance=length(p-eye);
 float fog=1.-exp(-distance*mix(.008,.012,shelter));
 fog=max(fog,(1.-smoothstep(-5.,3.,p.y))*smoothstep(14.,65.,distance)*(1.-shelter)*.52);
 vec3 fogColor=mix(vec3(.57,.59,.59),vec3(.105,.082,.07),shelter);
 float contact=smoothstep(.017,.34,min(abs(p.y),abs(p.y+4.35)));
 lit*=mix(.75,1.,mix(contact,1.,abs(nn.y)));
 vec3 result=mix(base*lit,fogColor,fog*.87);
 if(m>3.5&&m<4.5){
  float ember=clamp(c.g+noise(p.xy*26.+vec2(0.,-time*4.))*.31,0.,1.);
  result=mix(vec3(1.,.19,.029),vec3(1.,.88,.36),smoothstep(.23,.79,ember));
 }
 if(m>8.5&&m<9.5)result=mix(base*.85,base*1.27,grit);
 gl_FragColor=vec4(result,1.);
}`;
const skyVertex=`
attribute vec2 vertex;
varying vec2 uv;
void main(){uv=vertex;gl_Position=vec4(vertex,.99999,1.);}
`;
const skyFragment=`
precision highp float;
varying vec2 uv;
uniform vec3 right,up,back;
uniform vec2 spread;
float hash(vec2 v){return fract(sin(dot(mod(v,289.),vec2(42.13,72.21)))*4375.85);}
float noise(vec2 p){
 vec2 i=floor(p),f=smoothstep(0.,1.,fract(p));
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
}
void main(){
 vec3 ray=normalize(-back+right*uv.x*spread.x+up*uv.y*spread.y);
 vec3 col=mix(vec3(.78,.68,.54),vec3(.22,.35,.49),smoothstep(-.08,.78,ray.y));
 vec2 cloud=ray.xz/max(.12,ray.y+.25)*2.6;
 float n=noise(cloud)*.52+noise(cloud*2.1)*.28+noise(cloud*5.2)*.15+noise(cloud*11.)*.05;
 col=mix(col,vec3(.90,.81,.68), smoothstep(.39,.69,n)*smoothstep(-.02,.18,ray.y)*.83);
 float glow=max(0.,dot(ray,normalize(vec3(-.46,.73,.58))));
 col+=vec3(.32,.21,.09)*pow(glow,16.);
 gl_FragColor=vec4(col,1.);
}`;
function program(vs,fs){
 const result=gl.createProgram();
 for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
  gl.attachShader(result,shader);
 }
 gl.linkProgram(result);
 if(!gl.getProgramParameter(result,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(result));
 return result;
}
const world=program(vertexSource,fragmentSource),sky=program(skyVertex,skyFragment);
const worldBuffer=gl.createBuffer(),skyBuffer=gl.createBuffer();
const shadowTexture=gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D,shadowTexture);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,shadowSize,shadowSize,0,gl.RGBA,gl.UNSIGNED_BYTE,shadowPixels);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.bindBuffer(gl.ARRAY_BUFFER,worldBuffer);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
const worldCount=vertices.length/10;
vertices.length=0;
gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const attrs=['pos','normal','color','material'].map(name=>gl.getAttribLocation(world,name));
const skyAttr=gl.getAttribLocation(sky,'vertex');
function locations(p, names){return Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(p,n)]));}
const wu=locations(world,['eye','right','up','back','projection','lamps[0]','time','shadowTex','sunDir','sunAcross','sunVertical']);
gl.useProgram(world);
gl.uniform1i(wu.shadowTex,0);
gl.uniform3fv(wu.sunDir,sun);
gl.uniform3fv(wu.sunAcross,sunRight);
gl.uniform3fv(wu.sunVertical,sunUp);
const su=locations(sky,['right','up','back','spread']);
const place=document.querySelector('#place');
const nav=document.querySelector('#places');
const intro=document.querySelector('.intro');
const header=document.querySelector('header');
const toolbar=document.querySelector('aside');
const mapButton=document.querySelector('#map');
const startButton=document.querySelector('#start');
const description=document.querySelector('#description');
let x=0,y=0,z=28,yaw=0,pitch=.13,started=false,eyeHeight=1.64;
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
 x=sx;y=sy;z=sz;yaw=angle;pitch=i===0?.13:0;eyeHeight=y+1.64;
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
const fov=Math.tan(65*Math.PI/360), near=.065,far=195;
let last=0;
function frame(ms){
 const dt=Math.min((ms-last)/1000,.035);last=ms;
 const sn=Math.sin(yaw),cs=Math.cos(yaw);
 if(started&&(forward||side)){
  const pace=dt*3.6;
  step(x+(sn*forward+cs*side)*pace,z);
  step(x,z+(-cs*forward+sn*side)*pace);
 }
 const rear=z<-26.2&&y>-.35;
 const room=rear&&newPlaces.find(([name,rx,rz,ry])=>{
  if(Math.abs(ry-y)>.32)return false;
  if(rz===-65.8)return z<-62.45&&Math.abs(x-rx)<7.1;
  return Math.abs(rx)>16&&Math.abs(z-rz)<3.85&&x*rx>0&&Math.abs(x)>14.03;
 });
 const rearName=room?.[0]??(z<-49.75?(y>4.0?'Obergeschoss':'Nordhalle'):y>4?'Hofbalkon':Math.abs(x)>11.45?'Arkadenweg':'Oberer Burghof');
 const east=x>21.75&&z<-32.48&&z>-65.25;
 const eastName=x>35.54?eastPlaces[Math.max(0,Math.min(3,Math.round((-36.6-z)/8.15)))][0]:'Osthof';
 const west=x<-21.74&&z<-31.39&&z>-66.61;
 const westName=x<-42.49?westPlaces[Math.max(0,Math.min(4,Math.round((-34.6-z)/7.2)))][0]:'Westhof';
 const region=west?westName:east?eastName:rear?rearName:y>7.5&&z>8?'Torturm':y<-.35?(x>11.1?'Kellertreppe':'Gewölbekeller'):x<-15.45?(y>6.8?'Turmplattform':'Westturm'):y>4.9?'Wehrgang':z<-12.7?'Rittersaal':x>4.35&&x<9.65&&z<-1.75&&z>-9.45?'Burgkapelle':z>13?'Burgbrücke':z>11?'Burgtor':'Burghof';
 if(place.textContent!==region)place.textContent=region;
 eyeHeight+=(y+1.64-eyeHeight)*Math.min(1,dt*15);
 const right=[cs,0,sn],up=[-sn*Math.sin(pitch),Math.cos(pitch),cs*Math.sin(pitch)],back=[-sn*Math.cos(pitch),-Math.sin(pitch),cs*Math.cos(pitch)];
 const ratio=Math.min(devicePixelRatio||1,1.45);
 const w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
 const aspect=w/Math.max(1,h);
 const vertical=Math.max(fov,.46/aspect), horizontal=vertical*aspect;
 gl.clear(gl.DEPTH_BUFFER_BIT);
 gl.disable(gl.DEPTH_TEST);
 gl.useProgram(sky);gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);
 gl.enableVertexAttribArray(skyAttr);
 gl.vertexAttribPointer(skyAttr,2,gl.FLOAT,false,0,0);
 gl.uniform3fv(su.right,right);gl.uniform3fv(su.up,up);gl.uniform3fv(su.back,back);
 gl.uniform2f(su.spread,horizontal,vertical);gl.drawArrays(gl.TRIANGLES,0,3);
 gl.disableVertexAttribArray(skyAttr);
 gl.enable(gl.DEPTH_TEST);
 gl.useProgram(world);gl.bindBuffer(gl.ARRAY_BUFFER,worldBuffer);
 attrs.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,i===3?1:3,gl.FLOAT,false,40,i*12);});
 gl.uniform3f(wu.eye,x,eyeHeight,z);
 gl.uniform3fv(wu.right,right);gl.uniform3fv(wu.up,up);gl.uniform3fv(wu.back,back);
 gl.uniformMatrix4fv(wu.projection,false,[1/horizontal,0,0,0,0,1/vertical,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
 const dist=p=>(p[0]-x)**2+(p[1]-eyeHeight)**2*3+(p[2]-z)**2;
 const nearest=lights.slice().sort((a,b)=>dist(a)-dist(b)).slice(0,12);
 gl.uniform4fv(wu['lamps[0]'],nearest.flat());
 gl.uniform1f(wu.time,(ms/1000)%100);
 gl.drawArrays(gl.TRIANGLES,0,worldCount);
 attrs.forEach(a=>gl.disableVertexAttribArray(a));
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
}
