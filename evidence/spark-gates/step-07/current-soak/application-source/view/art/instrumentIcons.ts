import * as THREE from 'three';
import { INSTRUMENTS, type Instrument } from '../../core/instruments';
import { createToy } from './toys';
import type { Appearance } from './appearance';

/** Palette portraits use the actual game meshes, so edited colors and eyes agree. */
export function renderInstrumentIcons(appearance: Appearance): Map<string, string> {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(192, 192);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight('#ffffff', 1.8));
  const light = new THREE.DirectionalLight('#fff1da', 3); light.position.set(-1, 2, 3); scene.add(light);
  const fill = new THREE.DirectionalLight('#c4b5ff', 1); fill.position.set(2, 0, 1); scene.add(fill);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 5);
  const icons = new Map<string, string>();
  for (const id of ['generator', ...INSTRUMENTS.map(i => i.id)]) {
    const toy = createToy(id === 'generator' ? 'generator' : 'note', appearance, id === 'generator' ? undefined : id as Instrument);
    toy.halo.removeFromParent(); scene.add(toy.group);
    const bounds = new THREE.Box3().setFromObject(toy.group);
    const center = bounds.getCenter(new THREE.Vector3());
    camera.position.copy(center).add(new THREE.Vector3(0.12, 0.10, 0.55));
    camera.lookAt(center); camera.updateMatrixWorld();
    const size = bounds.clone().applyMatrix4(camera.matrixWorldInverse).getSize(new THREE.Vector3());
    const halfSize = Math.max(size.x, size.y) * 0.57;
    Object.assign(camera, { left: -halfSize, right: halfSize, top: halfSize, bottom: -halfSize });
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    icons.set(id, renderer.domElement.toDataURL('image/png'));
    scene.remove(toy.group);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    toy.group.traverse(object => { if (object instanceof THREE.Mesh) { geometries.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material); } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    toy.halo.geometry.dispose(); toy.halo.material.dispose();
  }
  renderer.dispose();
  return icons;
}
