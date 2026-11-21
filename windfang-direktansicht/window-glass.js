// Clear, lightly tinted glazing shared by the portico doors and fallback sashes.
export function createRealisticExteriorGlass(THREE, renderer) {
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'Weisses_Haus_Aussenfenster_Realglas',
    color: 0xb2b9ad,
    roughness: 0.16,
    metalness: 0,
    ior: 1.52,
    clearcoat: 0.32,
    clearcoatRoughness: 0.13,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
    opacity: .26
  });
  // Avoid hard opaque window-shaped shadows in the interior.
  glass.userData.isExteriorGlass = true;

  // Tiny variations in surface smoothness and tint reduce identical-looking
  // panes. Everything stays subtle so the glass does not look dirty or frosted.
  glass.customProgramCacheKey = () => 'white-house-realglass-optical-v1';
  glass.onBeforeCompile = shader => {
    shader.vertexShader = `varying vec3 whGlassPosition;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nwhGlassPosition=(modelMatrix*vec4(transformed,1.0)).xyz;'
    );
    shader.fragmentShader = `varying vec3 whGlassPosition;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       float glassLarge=sin(whGlassPosition.x*0.42+whGlassPosition.y*0.17+whGlassPosition.z*0.29);
       float glassFine=sin(whGlassPosition.x*8.2-whGlassPosition.z*5.3)*sin(whGlassPosition.y*2.4);
       diffuseColor.rgb *= 1.0 + glassLarge*0.035 + glassFine*0.008;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
       float glassMicro=sin(whGlassPosition.x*9.1+whGlassPosition.z*7.7)*sin(whGlassPosition.y*5.3);
       roughnessFactor = clamp(roughnessFactor + glassMicro*0.018, 0.068, 0.19);`
    );
  };

  // One LDR environment map gets PMREM-filtered on load. The map is a purpose-
  // generated soft photographic-style sky/grounds panorama, not a photo of the
  // user's surroundings, and never appears visibly as a background skybox.
  const loader = new THREE.TextureLoader();
  loader.load('./assets/glass/sky-reflection-2026.jpg', texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    let generator;
    try {
      generator = new THREE.PMREMGenerator(renderer);
      const pmrem = generator.fromEquirectangular(texture);
      glass.envMap = pmrem.texture;
      glass.needsUpdate = true;
    } catch (error) {
      console.warn('Exterior window reflection unavailable:', error);
    } finally {
      if (generator) generator.dispose();
      texture.dispose();
    }
  }, undefined, error => {
    console.warn('Exterior glass using its default finish; local sky texture unavailable:', error);
  });

  return glass;
}
