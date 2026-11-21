export function buildSky(THREE,scene,camera){
  const vertexShader=`
    varying vec3 vSky;
    void main(){
      vSky=normalize(position);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    }`;
  const fragmentShader=`
    precision highp float;
    varying vec3 vSky;
    uniform float drift;
    float hash2(vec2 p){
      vec3 q=fract(vec3(p.xyx)*.1031);
      q+=dot(q,q.yzx+33.33);
      return fract((q.x+q.y)*q.z);
    }
    float noise2(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),
        mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);
    }
    float cloud(vec2 p){
      mat2 turn=mat2(.8,.6,-.6,.8);
      float sum=0.,weight=.53;
      for(int i=0;i<5;i++){
        sum+=noise2(p)*weight;
        p=turn*p*2.08+vec2(8.4,2.7);
        weight*=.5;
      }
      return sum;
    }
    void main(){
      vec3 dir=normalize(vSky);
      float y=max(dir.y,0.);
      vec2 p=dir.xz*(3.1/(.34+y))+vec2(drift,.3);
      float wind=cloud(p*.61+vec2(11.3,5.2));
      vec2 warped=p+vec2(wind,noise2(p*.58+7.))*1.6;
      float mass=cloud(warped);
      float relief=cloud(warped+vec2(.17,-.14));
      float edge=mass-relief;
      float storm=smoothstep(-.91,.35,dot(dir,normalize(vec3(.67,.29,-.68))));
      vec3 dusk=mix(vec3(.57,.32,.36),vec3(.21,.29,.47),smoothstep(0.,.7,y));
      dusk=mix(dusk,vec3(.23,.115,.25),storm*.77);
      vec3 dark=mix(vec3(.18,.18,.28),vec3(.084,.033,.081),storm);
      vec3 lit=mix(vec3(.48,.45,.61),vec3(.41,.20,.38),storm);
      float cloudMask=smoothstep(.35,.61,mass+storm*.08);
      vec3 col=mix(dusk,mix(dark,lit,clamp(.26+edge*4.4,0.,1.)),cloudMask);
      float contour=abs(mass-(.48+.047*sin(warped.x*.82+wind*5.)));
      float hot=smoothstep(.45,.70,cloud(p*.72+vec2(19.,9.)))*storm;
      float halo=exp(-contour*38.)*hot;
      float vein=exp(-contour*180.)*hot;
      col+=vec3(.66,.035,.095)*halo+vec3(.95,.24,.08)*vein*.77;
      col+=vec3(.20,.06,.27)*max(edge,0.)*1.55*storm;
      col=mix(vec3(.22,.105,.148),col,smoothstep(-.10,.052,dir.y));
      gl_FragColor=vec4(clamp(col,0.,1.),1.);
    }`;
  const geometry=new THREE.SphereGeometry(188,32,16);
  const material=new THREE.ShaderMaterial({
    vertexShader,fragmentShader,uniforms:{drift:{value:0}},side:THREE.BackSide,depthWrite:false,
    depthTest:false,fog:false,toneMapped:false
  });
  const sky=new THREE.Mesh(geometry,material);
  sky.name='Violetter Gluthimmel';
  sky.renderOrder=-1000;
  sky.frustumCulled=false;
  scene.add(sky);
  sky.position.copy(camera.position);
  const start=performance.now();
  return {sky,update(){
    sky.position.copy(camera.position);
    material.uniforms.drift.value=(performance.now()-start)*.000018;
  }};
}
