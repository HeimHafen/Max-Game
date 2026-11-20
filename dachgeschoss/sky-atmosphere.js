// A subtle, original atmospheric sky shader rather than a featureless blue
// clear color. Entirely local – works on GitHub Pages and in mobile Safari.
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
    float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise2(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
      return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),
        mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);
    }
    void main(){
      vec3 dir=normalize(vSky);
      float h=clamp(dir.y*.5+.5,0.0,1.0);
      vec3 horizon=vec3(.72,.82,.89);
      vec3 zenith=vec3(.30,.54,.81);
      vec3 col=mix(horizon,zenith,smoothstep(.30,1.0,h));
      // Small, soft high-level cloud bands; no animated turbulence on iPhone.
      vec2 uv=vec2(atan(dir.z,dir.x)*2.9+2.1,dir.y*8.0);
      float clouds=noise2(uv*1.7)*.56+noise2(uv*3.4)*.29+noise2(uv*6.8)*.15;
      float mask=smoothstep(.58,.72,clouds)*(1.0-smoothstep(.80,.98,h));
      col=mix(col,vec3(.95,.96,.96),mask*.27);
      gl_FragColor=vec4(col,1.);
    }`;
  const geometry=new THREE.SphereGeometry(188,32,16);
  const material=new THREE.ShaderMaterial({
    vertexShader,fragmentShader,side:THREE.BackSide,depthWrite:false,
    depthTest:false,fog:false,toneMapped:false
  });
  const sky=new THREE.Mesh(geometry,material);
  sky.name='Himmel_Atmosphaere_2027_V4';
  sky.renderOrder=-1000;
  sky.frustumCulled=false;
  scene.add(sky);
  sky.position.copy(camera.position);
  return {sky,update(){sky.position.copy(camera.position);}};
}
