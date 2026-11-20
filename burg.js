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
const flag=[.33,.055,.045], iron=[.18,.19,.19], grass=[.32,.37,.22], gold=[.76,.53,.26];
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
function barrel(x,y,z,s=.64){
 const rings=[[0,.78],[.16,.95],[.7,1],[1.31,.95],[1.46,.78]];
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,b=a+Math.PI/6;
  const p=(ang,[h,r])=>[x+Math.cos(ang)*r*s,y+h*s,z+Math.sin(ang)*r*s];
  for(let j=0;j<4;j++)quad(p(a,rings[j]),p(a,rings[j+1]),p(b,rings[j+1]),p(b,rings[j]),wood.map(c=>c*(.86+.23*(i%3)/2)),2);
  tri([x,y+1.46*s,z],p(b,rings[4]),p(a,rings[4]),wood,2);
  for(const [h,r] of [[.2,.967],[1.23,.968]])quad(p(a,[h,r]),p(a,[h+.08,r]),p(b,[h+.08,r]),p(b,[h,r]),iron);
 }
 walls.push([x-s,x+s,z-s,z+s,y,y+1.46*s]);
}
function torch(x,y,z,fixture=true){
 if(fixture){
 box(x,y-.42,z,.09,.55,.09,iron,0);
 box(x,y-.06,z,.24,.10,.24,iron,0);
 }
 for(let i=0;i<5;i++){
  const a=i*1.256,b=a+1.256;
  const A=[x+.08*Math.cos(a),y,z+.08*Math.sin(a)],B=[x+.08*Math.cos(b),y,z+.08*Math.sin(b)];
  const C=[x+.102*Math.cos(b),y+.09,z+.102*Math.sin(b)],D=[x+.102*Math.cos(a),y+.09,z+.102*Math.sin(a)];
  quad(A,B,C,D,[1,.77,.07],4);
  tri(D,C,[x+.036,y+.24+.065*Math.cos(a),z],[1,.37,.07],4);
 }
 if(fixture)lights.push([x,y+.17,z,1]);
}
// Durchgehender gemauerter Bogen, mit sichtbaren Keilsteinen an beiden Stirnseiten.
function arch(x,z,y,r,spring,depth,thick=.34){
 const pieces=20;
 for(let i=0;i<pieces;i++){
  const a=i*Math.PI/pieces+.006,b=(i+1)*Math.PI/pieces-.006;
  const p=(t,R,Z)=>[x+Math.cos(t)*R,y+spring+Math.sin(t)*R,Z];
  const n=z-depth/2,f=z+depth/2;
  const c=trim.map(v=>v*(.84+.22*rand()));
  quad(p(a,r,n),p(b,r,n),p(b,r+thick,n),p(a,r+thick,n),c);
  quad(p(b,r,f),p(a,r,f),p(a,r+thick,f),p(b,r+thick,f),c);
  quad(p(a,r,f),p(b,r,f),p(b,r,n),p(a,r,n),c,1);
 }
}
function portal(x,z,y,width,opening,height,depth){
 const r=opening/2,spring=1.68;
 const side=(width-opening)/2;
 for(const sign of [-1,1])box(x+sign*(r+side/2),y,z,side,height,depth,stone,1,true);
 arch(x,z,y,r,spring,depth+.08);
 for(let i=0;i<24;i++){
  const a=Math.PI*i/24,b=Math.PI*(i+1)/24;
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
 for(let i=0;i<n;i++){
  const y=y0+(y1-y0)*(i+1)/n,zz=z+dir*(i+.5)*step;
  floor(x,zz,w,step+.003,y,trim);
  box(x,y-.04,zz-dir*step*.46,w,.045,.07,dark,0);
 }
}
function pitched(x,z,y,w,d,rise){
 const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];
 const p=[x,y+rise,z-d/2],q=[x,y+rise,z+d/2];
 quad(a,p,q,e,[.28,.32,.32],5);quad(b,c,q,p,[.28,.32,.32],5);
 tri(a,b,p,stone,1);tri(e,q,c,stone,1);
}
function table(x,z,w,d){
 box(x,.74,z,w,.13,d,wood,2,true);
 for(const dx of [-1,1])for(const dz of [-1,1])box(x+dx*(w/2-.15),0,z+dz*(d/2-.15),.14,.74,.14,wood,2,true);
}
function banner(x,y,z){
 const p=(u,v)=>[x+u,y+v,z+.065*Math.cos(u*12.)+.02*(2.5-v)];
 const left=-.88,right=.88;
 const cut=u=>.05+Math.max(0,1-Math.abs(u)*1.9)*.34;
 for(let i=0;i<24;i++){
  const a=left+(right-left)*i/24,b=left+(right-left)*(i+1)/24;
  quad(p(a,cut(a)),p(b,cut(b)),p(b,2.53),p(a,2.53),flag,7);
  quad(p(a,cut(a)),p(b,cut(b)),p(b,cut(b)+.035),p(a,cut(a)+.035),gold,7);
 }
 box(x,y+2.54,z,2.03,.065,.08,gold);
 for(const offset of [-.78,.78]){
  const a=p(offset,.21),b=p(offset,2.49);
  quad([a[0]-.015,a[1],a[2]+.003],[a[0]+.015,a[1],a[2]+.003],[b[0]+.015,b[1],b[2]+.003],[b[0]-.015,b[1],b[2]+.003],gold,7);
 }
 const crest=[
  [[-.62,1.73],[-.38,1.37],[-.10,1.24]],[[.62,1.73],[.10,1.24],[.38,1.37]],
  [[-.62,1.73],[-.19,1.52],[-.10,1.24]],[[.62,1.73],[.10,1.24],[.19,1.52]],
  [[0,1.68],[-.17,1.36],[.16,1.36]],[[0,1.12],[-.17,1.36],[.16,1.36]],
  [[0,1.12],[-.13,.99],[.15,.99]],[[.015,1.63],[.045,1.76],[.23,1.68]]
 ];
 for(const points of crest)tri(...points.map(([u,v])=>[x+u,y+v,z+.16]),gold,7);
}
function cylinder(x,y,z,r,h,color,kind=0,r2=r,segments=12){
 for(let i=0;i<segments;i++){
  const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
  const p=(angle,radius,Y)=>[x+Math.cos(angle)*radius,Y,z+Math.sin(angle)*radius];
  quad(p(a,r,y),p(a,r2,y+h),p(b,r2,y+h),p(b,r,y),color,kind);
  tri([x,y+h,z],p(b,r2,y+h),p(a,r2,y+h),color,kind);
 }
}
function chandelier(x,z){
 const h=3.7, radius=1.18;
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
  const p=(t,r,Y)=>[x+Math.cos(t)*r,Y,z+Math.sin(t)*r];
  quad(p(a,radius,h),p(a,radius,h+.11),p(b,radius,h+.11),p(b,radius,h),iron);
  quad(p(a,radius,h+.11),p(a,radius-.09,h+.11),p(b,radius-.09,h+.11),p(b,radius,h+.11),gold);
  if(i%2===0){
   const [cx,,cz]=p(a,radius,h);
   cylinder(cx,h+.09,cz,.111,.045,iron);
   cylinder(cx,h+.135,cz,.047,.20+rand()*.08,[.78,.65,.45]);
   torch(cx,h+.36,cz,false);
   // Die Ketten steigen von vier Punkten zur mittleren Aufhängung.
   if(i%4===0){
    for(let j=0;j<18;j++){
     const t=j/18;
     cylinder(cx+(x-cx)*t,h+.08+t*1.45,cz+(z-cz)*t,.037,.10,iron,0,.026,6);
    }
   }
  }
 }
 cylinder(x,5.1,z,.046,1.22,iron);
 lights.push([x,h+.25,z,1.5]);
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
hillside(-44,-28,21,24,17);
hillside(45,-37,23,23,20);
hillside(-49,34,28,24,15);
hillside(41,39,18,21,10);
hillside(4,-70,28,25,19);
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
 const z=18.6+i*.75,x=-.132*(z-19)*(z-19);
 const next=-.132*(z+.75-19)*(z+.75-19);
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
 const size=.5+rand()*3.5;
 rock(x,-4.85,z,size*.55,.25+rand()*2.2,size*.43);
}
for(let i=0;i<115;i++){
 const x=(rand()-.5)*155,z=(rand()-.5)*155;
 if(Math.abs(x)<29&&Math.abs(z)<36)continue;
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
stairs(12.7,5.5,3.2,29,.49,0,-4.35,-1);
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
 torch(x-1.58,2.76,11.42);torch(x+1.58,5.36,11.86);
 for(const a of [-1,1]){
  parapet(x,z+a*2.68,4.55,.38,7.68);
  parapet(x+a*2.02,z,.38,5.52,7.68);
 }
 for(const y of [3.45,5.28])box(x,y,front+.23,.16,.72,.035,[.12,.105,.085],0);
 banner(s*2.74,2.42,12.92);
 torch(s*2.3,2.36,13.02);
}
// Hochgezogenes Fallgatter und geöffnete Torflügel mit Eisenbeschlägen.
for(let i=-4;i<=4;i++){
 const x=i*.39, y=2.37+.36*Math.abs(i)/4;
 const available=1.68+Math.sqrt(4-x*x)-y;
 if(available>.15){
  box(x,y,11.62,.073,available,.085,iron);
  tri([x-.036,y,11.666],[x+.036,y,11.666],[x,y-.115,11.666],iron,0);
 }
}
box(0,3.01,11.62,2.82,.081,.11,iron);
for(const sign of [-1,1]){
 const x=sign*1.89;
 box(x,0,10.76,.125,2.82,1.76,wood,2,true);
 for(const y of [.49,1.37,2.23]){
  box(x-sign*.072,y,10.76,.03,.085,1.67,iron);
  for(let i=0;i<4;i++)cylinder(x-sign*.089,y-.006,10.13+i*.42,.026,.06,gold,0,.020,7);
 }
}
// Palas mit offenem Torbogen, Balkendecke, Bänken und Kamin.
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
box(0,0,-26,23,6.8,.75,stone,1,true);
for(const s of [-1,1]){
 const x=s*11.25;
 for(const z of [-24.5,-20,-15.5])box(x,0,z,.8,6.8,2.8,stone,1,true);
 box(x,0,-20,.8,1.5,13,stone,1,true);
 box(x,4.7,-20,.8,2.1,13,stone,1,true);
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
for(const s of [-1,1]){
 table(s*4.9,-19.2,1.65,7.1);
 for(const j of [-1,1]){
  box(s*4.9+j*1.21,.4,-19.2,.35,.11,6.5,wood,2,true);
  for(const z of [-21.8,-16.6])box(s*4.9+j*1.21,0,z,.16,.42,.15,wood,2,true);
 }
 for(let j=0;j<6;j++){
  box(s*4.9,.87,-22+j*1.1,.32,.065,.24,trim,0);
  box(s*4.9+.3,.87,-22+j*1.1,.11,.14,.11,iron,0);
 }
 banner(s*5.55,2.32,-25.58);
 torch(s*8.5,2.45,-25.45);
}
for(const s of [-1,1])box(s*1.26,0,-24.95,.63,2.65,1.2,trim,1,true);
box(0,2.36,-24.95,3.18,.54,1.29,trim);
box(0,2.48,-24.23,3.46,.15,.26,trim);
box(0,2.85,-24.92,3.5,.19,1.38,trim);
box(0,3.03,-25.13,2.73,1.55,.74,dark);
box(0,4.57,-25.13,2.96,.18,.88,trim);
for(const x of [-1.42,1.42])cylinder(x,2.47,-24.2,.128,.55,trim,1,.082,8);
banner(0,3.04,-24.58);

box(0,.02,-24.83,2.43,.14,1.48,dark);
for(let i=0;i<5;i++){
 const x=(i-2)*.25;
 box(x,.15,-24.86,.22,.16,.57,wood.map(v=>v*.4),2);
 torch(x,.26,-24.86);
 lights.pop();
}
lights.push([0,.6,-24.47,1.8]);
chandelier(0,-16.5);chandelier(0,-21.1);
box(0,.16,-25.48,2,1.96,.06,[.22,.19,.16],1);
box(0,.012,-20,1.85,.027,7.4,flag,0);
for(const x of [-.82,.82])box(x,.04,-20,.036,.008,7.36,gold,0);
// Westturm mit Treppe im Innenraum und frei begehbarer Aussichtsplattform.
const tx=-19;
floor(tx,0,7.4,10,0);
portal(-15.52,0,0,0.01,.01,0.01,.01); // seitlicher Eingang wird unten mit echten Wandöffnungen gebaut
for(const z of [-3.52,3.52])box(-15.28,0,z,.65,7.1,3.2,stone,1,true);
box(-15.28,3.12,0,.65,3.98,4,stone,1,true);
box(-22.74,0,0,.78,7.1,10.65,stone,1,true);
for(const z of [-5.24,5.24])box(tx,0,z,8.2,7.1,.72,stone,1,true);
stairs(-20.55,4.75,2.35,34,.27,0,7.1,-1);
floor(-17.5,0,3.75,10,7.1);
floor(-20.55,-4.61,2.35,.78,7.1);
for(const z of [-4.94,4.94])parapet(tx,z,8.2,.46,7.1);
for(const x of [-22.65,-15.28])parapet(x,0,.48,9.42,7.1);
box(-19.02,7.1,.32,.17,.88,7.7,stone,1,true);
torch(-21.7,2.8,1.4);torch(-21.7,5.8,-2.35);
barrel(-17.5,0,-3.55);
torch(-16.3,2.3,-4.7);
// Gewölbekeller unter dem Hof: gemauerter Tonnenbogen und Gurtbögen.
const cy=-4.35;
floor(-.2,-4.6,23,8.7,cy,dark);
floor(12.4,-8.02,3.9,1.48,cy,dark);
floor(10.7,-8.02,3,1.48,cy,dark);
box(-11.82,cy,-4.6,.58,3.65,9,stone,1,true);
box(11.45,cy,-3.9,.35,3.5,7.22,stone,1,true);
for(const z of [-8.94,-.25])box(-.2,cy,z,23.2,1.78,.38,stone,1,true);
for(let i=0;i<22;i++){
 const a=i*Math.PI/22,b=(i+1)*Math.PI/22;
 const p=(x,t)=>[x,cy+1.69+2.47*Math.sin(t),-4.60+4.32*Math.cos(t)];
 quad(p(-11.82,a),p(11.45,a),p(11.45,b),p(-11.82,b),dark,1);
}
for(const x of [-9,-4.8,-.6,3.6,7.8]){
 for(let i=0;i<25;i++){
  const a=i*Math.PI/25+.009,b=(i+1)*Math.PI/25-.009;
  const p=(xx,t,r)=>[xx,cy+1.67+(2.45+r)*Math.sin(t),-4.6+(4.12+r)*Math.cos(t)];
  const c=trim.map(v=>v*(.72+.21*rand()));
  quad(p(x-.2,b,0),p(x+.2,b,0),p(x+.2,a,0),p(x-.2,a,0),c);
  for(const s of [-1,1])quad(p(x+s*.2,a,0),p(x+s*.2,b,0),p(x+s*.2,b,.29),p(x+s*.2,a,.29),c);
 }
 for(const z of [-8.71,-.48])box(x,cy,z,.56,1.69,.4,trim,1,true);
 torch(x,cy+2.03,-8.35);
 torch(x+.8,cy+2.12,-.78);
}
for(let i=0;i<13;i++)barrel(-10+i*1.12,cy,-1.56,.48+rand()*.13);
for(let i=0;i<4;i++)barrel(-9.8+i*1.38,cy,-7.44,.56);
for(const x of [-6,1.7,6.9]){
 box(x,cy,-7.58,1,.69,.67,wood,2,true);
 for(const y of [.12,.48])box(x,cy+y,-7.23,1.04,.064,.04,iron,0);
}
// Gewölbeausbau: Lagergestelle mit abgestellten Fässern und vergitterter Nische.
for(const x of [-9.6,-7.9,-6.2]){
 box(x,cy+.99,-1.04,1.67,.16,.9,wood,2);
 for(const dx of [-.72,.72])box(x+dx,cy,-1.05,.11,1.15,.81,wood,2,true);
 barrel(x,cy+1.15,-1.21,.39);
}
for(const dx of [-.22,.22]){
 box(-11.492,cy+.82,-4.65+dx,.08,1.75,.051,iron);
}
for(let j=0;j<5;j++)box(-11.48,cy+.82+j*.35,-4.65,.09,.05,.64,iron);
box(-11.50,cy+.74,-4.65,.07,.13,.74,trim);
torch(13.7,-1.5,-3.5);torch(13.66,-2.04,-7.53);
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
box(-6.3,0,-5.4,2.05,.49,1.78,stone,1,true);
box(-6.3,.49,-5.4,1.86,.63,1.6,stone,1,true);
box(-6.3,1.12,-5.4,2.15,.17,1.9,trim);
box(-6.3,1.29,-5.4,1.61,.02,1.38,[.11,.16,.15],0);
for(const x of [-7.18,-5.42])box(x,1.30,-5.4,.12,1.72,.17,wood,2);
box(-6.3,2.95,-5.4,2.05,.16,.17,wood,2);
box(-6.3,1.35,-5.4,.033,1.58,.033,wood,2);
barrel(-7.73,0,-5.68,.58);
for(const x of [-10.52,-4.08,4.08,10.52]){
 box(x,0,-12.01,.43,5.54,.47,trim);
 box(x,5.38,-12.01,.53,.22,.59,trim);
}
for(const [x,z] of [[-9.5,-10],[10.4,-10.55],[-10.8,8.3],[7.6,9.1]])barrel(x,0,z);
for(const x of [-7.25,7.25]){
 banner(x,2.58,-12.06);
 torch(x*.58,2.48,-11.99);
}
for(const s of [-1,1]){
 const x=s*10.25;
 cylinder(x,-3.7,17,.115,7.67,wood,2,.087);
 cylinder(x,3.92,17,.12,.28,gold,0,0,8);
 box(x,3.72,17,1.68,.085,.09,wood,2);
 banner(x,1.25,17.05);
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
cylinder(7,7.0,-.98,.32,.39,[.33,.28,.20],0,.18);
cylinder(7,6.95,-.98,.09,.13,iron);
for(const z of [-3.25,-5.55,-7.86]){
 arch(7,z,0,2.73,2.42,.30,.26);
 for(const x of [4.35,9.65])cylinder(x,0,z,.16,2.52,trim,1,.15,10);
}
floor(7,-8.67,3.13,1.6,.14,trim);
box(7,.14,-9.02,1.76,.83,.61,stone,1,true);
box(7,.89,-9.02,2.00,.15,.86,trim);
for(const x of [6.38,7.62]){
 cylinder(x,1.04,-8.94,.074,.24,[.78,.65,.45]);
 torch(x,1.28,-8.94,false);
 lights.push([x,1.5,-8.85,.68]);
}
for(const x of [5.38,8.62]){
 for(const z of [-4.02,-5.37,-6.72]){
  box(x,.42,z,1.28,.13,.34,wood,2,true);
  box(x,.54,z+.15,1.28,.30,.09,wood,2);
  for(const dx of [-.49,.49])box(x+dx,0,z,.09,.45,.28,wood,2,true);
 }
 torch(x,2.20,-9.14);
}
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
// Der Start ist bewusst weiter vor der Brücke positioniert.
const destinations=[
 ['Burgbrücke',-9.75,27,0,.41],
 ['Burghof',0,4,0,0],
 ['Rittersaal',0,-16,0,0],
 ['Westturm',-17,1,0,-1.57],
 ['Turmplattform',-17.7,-3,7.1,2.2],
 ['Wehrgang',-13.65,6.1,5.5,0],
 ['Gewölbekeller',8,-5.55,cy,-Math.PI/2],
 ['Linker Torturm',-7.35,11.3,7.7,.3],
 ['Rechter Torturm',5.65,11.3,7.7,-.3],
 ['Burgkapelle',7,-2.64,0,0]
];
// Das Sonnenlicht nutzt eine einmalig aus der Burggeometrie berechnete Tiefenkarte.
const shadowSize=640, shadowWorld=94;
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
 vec2 uv=vec2(dot(point,sunAcross),dot(point,sunVertical))/94.+.5;
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
  float moss=smoothstep(.57,.79,noise(uv*.88))*smoothstep(.5,.77,stains);
  base=mix(base,base*vec3(.66,.78,.54),moss*.9);
 } else if(m>1.5&&m<2.5){
  base*=.67+.34*noise(vec2(uv.x*30.,uv.y*1.2))+.19*stains;
 } else if(m>2.5&&m<3.5){
  base*=.62+.4*stains+.38*grit;
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
 vec3 lit=mix(vec3(.44,.48,.55)+vec3(.87,.70,.46)*sun,vec3(.25,.255,.28),shelter);
 for(int i=0;i<12;i++){
  vec3 offset=lamps[i].xyz-p;
  float d=dot(offset,offset);
  float cosine=max(.26,dot(nn,normalize(offset+vec3(.0001))));
  lit+=vec3(1.27,.64,.25)*lamps[i].w*cosine*(1.+.075*sin(time*9.+float(i)*2.1))/(.82+d*.36);
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
 if(m>8.5)result=mix(base*.85,base*1.27,grit);
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
const place=document.querySelector('#place'), nav=document.querySelector('#places'), intro=document.querySelector('.intro'), pad=document.querySelector('.pad');
let x=-9.75,y=0,z=27,yaw=.41,pitch=.13,started=false, drag=null, eyeHeight=1.64;
const keys=new Set();
for(const [i,[name]] of destinations.entries()){
 const button=document.createElement('button');
 button.textContent=name;
 button.onclick=()=>{go(i);nav.hidden=true;canvas.focus();};
 nav.append(button);
}
function go(i){
 const [,sx,sz,sy,angle]=destinations[i];
 x=sx;y=sy;z=sz;yaw=angle;pitch=0;eyeHeight=y+1.64;keys.clear();
}
document.querySelector('#start').onclick=()=>{started=true;intro.hidden=true;pad.hidden=false;};
document.querySelector('#map').onclick=()=>{nav.hidden=!nav.hidden;};
document.querySelector('#help').onclick=()=>{intro.hidden=false;pad.hidden=true;started=false;keys.clear();};
const supported=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'];
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(k==='escape'){nav.hidden=true;keys.clear();}
 if(started&&supported.includes(k)){keys.add(k);e.preventDefault();}
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>{keys.clear();drag=null;});
for(const button of pad.querySelectorAll('button')){
 const key=button.dataset.key;
 button.onpointerdown=e=>{button.setPointerCapture(e.pointerId);keys.add(key);};
 button.onpointerup=button.onpointercancel=button.onlostpointercapture=()=>keys.delete(key);
}
canvas.onpointerdown=e=>{
 if(started&&drag===null){canvas.setPointerCapture(e.pointerId);drag=[e.pointerId,e.clientX,e.clientY];}
};
canvas.onpointermove=e=>{
 if(!drag||drag[0]!==e.pointerId)return;
 yaw+=(e.clientX-drag[1])*.0048;
 pitch=Math.max(-1.22,Math.min(1.22,pitch+(drag[2]-e.clientY)*.0043));
 drag=[e.pointerId,e.clientX,e.clientY];
};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{if(drag?.[0]===e.pointerId)drag=null;};
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
 if(started){
  const forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
  const side=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
  const pace=dt*(keys.has('shift')?5.7:3.6)/(Math.hypot(forward,side)||1);
  if(forward||side){step(x+(sn*forward+cs*side)*pace,z);step(x,z+(-cs*forward+sn*side)*pace);}
 }
 const region=y>7.5&&z>8?'Torturm':y<-.35?(x>11.1?'Kellertreppe':'Gewölbekeller'):x<-15.45?(y>6.8?'Turmplattform':'Westturm'):y>4.9?'Wehrgang':z<-12.7?'Rittersaal':x>4.35&&x<9.65&&z<-1.75&&z>-9.45?'Burgkapelle':z>13?'Burgbrücke':z>11?'Burgtor':'Burghof';
 if(place.textContent!==region)place.textContent=region;
 eyeHeight+=(y+1.64-eyeHeight)*Math.min(1,dt*15);
 const right=[cs,0,sn],up=[-sn*Math.sin(pitch),Math.cos(pitch),cs*Math.sin(pitch)],back=[-sn*Math.cos(pitch),-Math.sin(pitch),cs*Math.cos(pitch)];
 const ratio=Math.min(devicePixelRatio||1,1.45);
 const w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
 const vertical=w<h?fov*1.22:fov, horizontal=vertical*w/h;
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
