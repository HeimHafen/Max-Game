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
      vec3 moonDir=normalize(vec3(.39,.32,-.86));
      float sunset=pow(max(0.,dot(dir,normalize(vec3(-.83,.06,-.54)))),4.);
      vec3 horizon=mix(vec3(.57,.52,.60),vec3(.88,.62,.48),sunset*.78);
      vec3 col=mix(horizon,vec3(.105,.188,.335),pow(smoothstep(0.,.93,y),.66));
      vec3 right=normalize(cross(vec3(0.,1.,0.),moonDir));
      vec3 up=cross(moonDir,right);
      vec2 lunar=vec2(dot(dir,right),dot(dir,up))/.008;
      float radius=length(lunar);
      float facing=smoothstep(.97,.99,dot(dir,moonDir));
      col+=vec3(.19,.20,.21)*exp(-radius*.49)*facing;
      float disc=(1.-smoothstep(.88,1.08,radius))*facing;
      float maria=smoothstep(.33,.67,cloud(lunar*2.9+vec2(5.,13.)));
      vec3 moon=mix(vec3(.98,.95,.86),vec3(.68,.69,.67),maria*.78);
      col=mix(col,moon,disc);
      float cloudMask=smoothstep(.42,.66,mass)*(1.-.48*smoothstep(.3,.9,y));
      vec3 cloudColor=mix(vec3(.29,.31,.41),vec3(.62,.48,.50),clamp(.35+edge*4.+sunset*.35,0.,1.));
      col=mix(col,cloudColor,cloudMask*.76);
      col=mix(vec3(.40,.37,.44),col,smoothstep(-.11,.025,dir.y));
      gl_FragColor=vec4(clamp(col,0.,1.),1.);
    }`;
  const geometry=new THREE.SphereGeometry(188,32,16);
  const material=new THREE.ShaderMaterial({
    vertexShader,fragmentShader,uniforms:{drift:{value:0}},side:THREE.BackSide,depthWrite:false,
    depthTest:false,fog:false,toneMapped:false
  });
  const sky=new THREE.Mesh(geometry,material);
  sky.name='Abenddämmerung mit Mond';
  sky.renderOrder=-1000;
  sky.frustumCulled=false;
  scene.add(sky);
  sky.position.copy(camera.position);
  const start=performance.now();
  return {sky,update(){
    sky.position.copy(camera.position);
    material.uniforms.drift.value=(performance.now()-start)*.000007;
  }};
}
