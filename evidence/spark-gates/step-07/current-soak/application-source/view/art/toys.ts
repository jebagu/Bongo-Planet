import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Piece } from '../../core/contracts';
import type { Instrument } from '../../core/instruments';
import type { Appearance } from './appearance';

export type Toy = {
  group: THREE.Group;
  material: THREE.MeshStandardMaterial;
  eyes: THREE.Group;
  halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
};

/** Real editable 3D meshes. Local +Z faces away from the planet surface. */
export function createToy(kind: Piece['kind'], appearance: Appearance, instrument?: Instrument): Toy {
  const group = new THREE.Group();
  group.name = `Bongo Planet ${instrument ?? kind}`;
  const color = appearance[instrument ?? kind];
  const material = new THREE.MeshStandardMaterial({
    name: 'Body', color, roughness: 0.4, metalness: 0,
    transparent: true, emissive: color, emissiveIntensity: 0,
  });
  const geometry = kind === 'generator'
    ? new THREE.TorusGeometry(0.068, 0.025, 12, 28)
    : kind === 'note'
      ? new THREE.CapsuleGeometry(0.038, 0.067, 5, 12)
      : new RoundedBoxGeometry(0.115, 0.104, 0.074, 2, 0.019);
  const body = new THREE.Mesh(geometry, material);
  body.name = 'Body';
  body.castShadow = true;
  body.position.set(0, kind === 'note' ? 0.016 : 0, kind === 'beat' ? 0.043 : 0.045);
  group.add(body);
  if (instrument) {
    group.remove(body);
    geometry.dispose();
    const instrumentBody = new THREE.Group(); instrumentBody.name = 'Body';
    group.add(instrumentBody); addInstrumentBody(instrumentBody, material, instrument);
  }

  const eyes = new THREE.Group();
  eyes.name = 'Eyes';
  eyes.visible = appearance.eyes;
  const eyeMaterial = new THREE.MeshStandardMaterial({ name: 'Eyes', color: '#15234e', roughness: 0.22, transparent: true });
  const shineMaterial = new THREE.MeshBasicMaterial({ name: 'Eye highlights', color: '#ffffff', transparent: true });
  for (const x of [-0.021, 0.021]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), eyeMaterial);
    eye.scale.set(0.72, 1.25, 0.65);
    const y = kind === 'generator' ? -0.047 : instrument === 'guitar' ? -0.014 : 0.013;
    const z = kind === 'generator' ? 0.068 : instrument === 'glass' ? 0.104 : kind === 'note' ? 0.081 : 0.082;
    eye.position.set(x, y, z);
    eyes.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.002, 6, 4), shineMaterial);
    shine.position.set(x - 0.0018, y + 0.003, z + 0.0046);
    eyes.add(shine);
  }
  group.add(eyes);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.104, 0.113, 40),
    new THREE.MeshBasicMaterial({ name: 'Selection halo', color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  halo.name = 'Selection halo';
  halo.position.z = 0.003;
  group.add(halo);
  return { group, material, eyes, halo };
}

/** Compact instrument silhouettes, using the same editable toy materials and eyes. */
function addInstrumentBody(group: THREE.Group, material: THREE.MeshStandardMaterial, instrument: Instrument) {
  const detail = new THREE.MeshStandardMaterial({ name: 'Ivory details', color: '#fff8e8', roughness: 0.42 });
  const ink = new THREE.MeshStandardMaterial({ name: 'Ink details', color: '#344362', roughness: 0.4 });
  const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number, mat = material) => {
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh); return mesh;
  };
  const box = (w: number, h: number, d: number) => new RoundedBoxGeometry(w, h, d, 2, Math.min(w,h,d) * 0.18);
  if (instrument === 'guitar') {
    const lower = add(new THREE.SphereGeometry(0.051, 16, 12), 0, -0.022, 0.044); lower.scale.set(1, 0.9, 0.7);
    const upper = add(new THREE.SphereGeometry(0.037, 16, 12), 0, 0.018, 0.044); upper.scale.z = 0.85;
    add(box(0.023, 0.09, 0.027), 0, 0.079, 0.047);
    add(box(0.038, 0.035, 0.027), 0, 0.126, 0.047);
    add(box(0.032, 0.007, 0.004), 0, -0.051, 0.080, ink);
    for (const x of [-0.004, 0, 0.004]) add(box(0.0015, 0.104, 0.002), x, 0.056, 0.065, detail);
  } else if (instrument === 'glass') {
    const bell = add(new THREE.CylinderGeometry(0.028, 0.054, 0.095, 8), 0, 0.006, 0.043);
    bell.rotation.x = Math.PI / 2; // Faceted blue glass bell, facing out from the planet.
    add(new THREE.TorusGeometry(0.045, 0.004, 6, 16), 0, 0.006, 0.092, detail);
    add(new THREE.SphereGeometry(0.014, 10, 8), 0, -0.055, 0.044, detail);
  } else {
    add(box(0.116, 0.108, 0.071), 0, 0, 0.044);
    if (instrument === 'piano') {
      for (let i = 0; i < 7; i++) add(box(0.014, 0.037, 0.009), (i-3)*0.015, -0.032, 0.084, detail);
      for (const i of [0,1,3,4,5]) add(box(0.007, 0.019, 0.01), (i-2.5)*0.015, -0.022, 0.092, ink);
    } else if (instrument === 'kalimba') {
      for (let i = 0; i < 5; i++) add(box(0.009, 0.024 + (2-Math.abs(i-2))*0.008, 0.007), (i-2)*0.017, -0.023, 0.084, detail);
    } else {
      for (let i = 0; i < 5; i++) add(box(0.016, 0.033 + i*0.006, 0.013), (i-2)*0.022, -0.029, 0.084, detail);
    }
  }
}

export function createFacetedPlanet(vertices: THREE.Vector3[], faces: [number, number, number][], color: string) {
  const positions: number[] = [];
  for (const face of faces) {
    const points = face.map(i => vertices[i]);
    const normal = new THREE.Vector3().subVectors(points[1], points[0]).cross(new THREE.Vector3().subVectors(points[2], points[0]));
    if (normal.dot(points[0]) < 0) [points[1], points[2]] = [points[2], points[1]];
    for (const p of points) positions.push(p.x * 0.99, p.y * 0.99, p.z * 0.99);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ name: 'Planet', color, roughness: 0.68, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Bongo Planet faceted globe';
  mesh.receiveShadow = true;
  return mesh;
}
