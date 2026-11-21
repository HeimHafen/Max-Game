// Radial sections are listed from bottom to top, in metres.
const baseProfile = [
 [1.105,.745],[1.125,.76],[1.15,.76],[1.17,.749],[1.193,.706],
 [1.213,.668],[1.238,.662],[1.25,.677],[1.27,.677],[1.287,.654],
 [1.305,.638],[1.325,.627],[1.355,.627]
];
const capitalProfile = [
 [10.82,.529],[10.86,.537],[10.88,.552],[10.90,.571],[10.923,.572],
 [10.942,.558],[10.968,.559],[10.993,.580],[11.023,.618],
 [11.053,.671],[11.075,.723],[11.095,.755],[11.117,.770],[11.195,.770]
];

const fluteCount = 20;
const radialSegments = fluteCount * 12;
function shaftRadius(t, angle) {
 const taper = .617 - .083 * t + .018 * Math.sin(Math.PI * t);
 const groove = Math.max(0, (Math.cos(angle * fluteCount) + .50) / 1.50);
 const fade = Math.min(1, t / .032, (1 - t) / .032);
 const termination = fade * fade * (3 - 2 * fade);
 return taper - .041 * groove ** 1.5 * termination;
}

function radialMesh(THREE, name, center, profile, material, radiusAt) {
 const positions = [], uvs = [], indices = [];
 const stride = radialSegments + 1;
 for (const [row, [y, radius]] of profile.entries()) {
  for (let i = 0; i <= radialSegments; i++) {
   const fraction = i / radialSegments;
   const angle = 2 * Math.PI * fraction;
   const r = radiusAt(row, angle, radius);
   positions.push(r * Math.cos(angle), y, r * Math.sin(angle));
   uvs.push(fraction, y * .32);
   if (row === 0 || i === radialSegments) continue;
   const lower = (row - 1) * stride + i;
   const upper = lower + stride;
   indices.push(lower, upper, upper + 1, lower, upper + 1, lower + 1);
  }
 }
 const geometry = new THREE.BufferGeometry();
 geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
 geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();

 // The seam uses duplicate vertices for UVs. Share their lighting normal.
 const normal = geometry.attributes.normal;
 const seam = new THREE.Vector3(), other = new THREE.Vector3();
 for (let row = 0; row < profile.length; row++) {
  const start = row * stride, end = start + radialSegments;
  seam.fromBufferAttribute(normal, start).add(other.fromBufferAttribute(normal, end)).normalize();
  normal.setXYZ(start, seam.x, seam.y, seam.z);
  normal.setXYZ(end, seam.x, seam.y, seam.z);
 }
 const mesh = new THREE.Mesh(geometry, material);
 mesh.name = name;
 mesh.position.set(center.x, 0, center.z);
 mesh.castShadow = mesh.receiveShadow = true;
 return mesh;
}

export function addPorticoColumn(THREE, portico, source, materials) {
 const bounds = new THREE.Box3().setFromObject(source, true);
 const center = bounds.getCenter(new THREE.Vector3());
 const sections = [0,.006,.012,.02,.032,.06,.12,.20,.30,.40,.50,.60,
  .70,.80,.88,.94,.968,.98,.988,.994,1];
 const shaftProfile = sections.map(t => [THREE.MathUtils.lerp(bounds.min.y, bounds.max.y, t)]);
 portico.add(
  radialMesh(THREE, 'Säulenschaft', center, shaftProfile, materials.columnFinish,
   (row, angle) => shaftRadius(sections[row], angle)),
  radialMesh(THREE, 'Säulenbasis', center, baseProfile, materials.columnFinish,
   (_, __, radius) => radius),
  radialMesh(THREE, 'Säulenkapitell', center, capitalProfile, materials.columnFinish,
   (_, __, radius) => radius)
 );
}
