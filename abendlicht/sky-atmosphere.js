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
      vec2 p=dir.xz*(2.5/(.51+y))+vec2(drift,.3);
      float wind=noise2(p*.82+vec2(11.3,5.2));
      vec2 warped=p+vec2(wind,noise2(p*.67+7.))*.83;
      float mass=cloud(warped);
      float relief=cloud(warped+vec2(-.12,.07));
      float edge=mass-relief;
      vec3 moonDir=normalize(vec3(.26,.36,-.90));
      float sunset=pow(max(0.,dot(dir,normalize(vec3(-.70,.03,-.72)))),5.);
      vec3 horizon=mix(vec3(.59,.56,.62),vec3(.90,.67,.52),sunset*.72);
      vec3 col=mix(horizon,vec3(.15,.25,.43),pow(smoothstep(0.,.92,y),.52));
      vec3 right=normalize(cross(vec3(0.,1.,0.),moonDir));
      vec3 up=cross(moonDir,right);
      vec2 lunar=vec2(dot(dir,right),dot(dir,up))/.009;
      float radius=length(lunar);
      float facing=smoothstep(.97,.99,dot(dir,moonDir));
      col+=vec3(.09,.10,.12)*exp(-radius*.37)*facing;
      if(radius<1.14&&facing>.0){
        float disc=1.-smoothstep(.94,1.06,radius);
        float depth=sqrt(max(0.,1.-dot(lunar,lunar)));
        float phase=smoothstep(-.035,.04,dot(vec3(lunar,depth),normalize(vec3(-.44,.08,.9))));
        float maria=smoothstep(.32,.66,cloud(lunar*2.65+vec2(5.,13.)));
        float grain=noise2(lunar*24.);
        vec3 moon=mix(vec3(.98,.961,.90),vec3(.59,.62,.64),maria*.76);
        moon*=.95+.05*grain;
        col=mix(col,moon,disc*phase);
      }
      vec2 high=p*vec2(.85,2.7)+vec2(-drift*.35,7.);
      float wisps=smoothstep(.52,.74,cloud(high+noise2(high*.54)*.5));
      col=mix(col,vec3(.59,.59,.68),wisps*.24);
      float layer=smoothstep(.44,.63,mass);
      float coverage=layer*(1.-.70*smoothstep(.14,.55,y));
      vec3 cloudShadow=vec3(.28,.32,.42);
      vec3 cloudRim=mix(vec3(.55,.52,.58),vec3(.84,.63,.56),sunset*.8);
      vec3 cloudColor=mix(cloudShadow,cloudRim,clamp(.32+edge*5.2+(1.-layer)*.25,0.,1.));
      col=mix(col,cloudColor,coverage*.79);
      col=mix(vec3(.53,.51,.57),col,smoothstep(-.12,.018,dir.y));
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
