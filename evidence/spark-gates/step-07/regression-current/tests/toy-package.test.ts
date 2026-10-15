import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

it.each(['generator', 'note', 'beat', 'planet', 'guitar', 'glass', 'kalimba', 'piano', 'marimba'])('loads portable %s GLB with the game loader', async kind => {
  const file = readFileSync(`public/art/geometric-toys/${kind}.glb`);
  const data = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  const model = await new GLTFLoader().parseAsync(data, '');
  expect(new THREE.Box3().setFromObject(model.scene).isEmpty()).toBe(false);
  const meshes: THREE.Mesh[] = [];
  model.scene.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
  expect(meshes.length).toBeGreaterThan(0);
  expect(meshes.every(mesh => mesh.geometry.attributes.position.count > 0)).toBe(true);
});
