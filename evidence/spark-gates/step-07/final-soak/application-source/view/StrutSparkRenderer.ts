import * as THREE from 'three';
import { MAX_VISIBLE_SPARKS, type Spark } from './StrutSparkModel';

/** Fixed geometry budget: all sparks share two instanced meshes and one short-tail buffer. */
export class StrutSparkRenderer extends THREE.Group {
  private core = new THREE.InstancedMesh(new THREE.SphereGeometry(0.019, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff4cf' }), MAX_VISIBLE_SPARKS);
  private aura = new THREE.InstancedMesh(new THREE.SphereGeometry(0.038, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }), MAX_VISIBLE_SPARKS);
  private tails = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ transparent: true, opacity: 0.8, depthWrite: false }));
  private tailPositions = new Float32Array(MAX_VISIBLE_SPARKS * 8 * 6);
  private scratchMatrix = new THREE.Matrix4();
  private scratchScale = new THREE.Vector3(1, 1, 1);
  private orientation = new THREE.Quaternion();
  private scratchPosition = new THREE.Vector3();

  constructor() {
    super();
    this.tails.geometry.setAttribute('position', new THREE.BufferAttribute(this.tailPositions, 3).setUsage(THREE.DynamicDrawUsage));
    for (const mesh of [this.core, this.aura]) { mesh.count = 0; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }
    this.tails.frustumCulled = false;
    this.tails.geometry.setDrawRange(0, 0);
    this.add(this.tails, this.aura, this.core);
  }

  update(sparks: Spark[], color: number, glow: number, reducedMotion: boolean) {
    this.visible = glow > 0 && !reducedMotion;
    const count = this.visible ? Math.min(sparks.length, MAX_VISIBLE_SPARKS) : 0;
    this.aura.material.color.setHex(color);
    this.aura.material.opacity = Math.min(0.4, glow * 0.22);
    this.tails.material.color.setHex(color);
    this.tails.material.opacity = Math.min(1, glow * 0.8);
    this.core.material.color.setHex(color).lerp(new THREE.Color('#ffffff'), 0.65);
    let offset = 0;
    for (let i = 0; i < count; i++) {
      const spark = sparks[i];
      this.scratchMatrix.compose(this.scratchPosition.set(...spark.point), this.orientation, this.scratchScale);
      this.core.setMatrixAt(i, this.scratchMatrix); this.aura.setMatrixAt(i, this.scratchMatrix);
      for (let j = 1; j < spark.tail.length; j++) {
        this.tailPositions.set(spark.tail[j - 1], offset); this.tailPositions.set(spark.tail[j], offset + 3); offset += 6;
      }
    }
    this.core.count = this.aura.count = count;
    this.core.instanceMatrix.needsUpdate = this.aura.instanceMatrix.needsUpdate = true;
    this.tails.geometry.attributes.position.needsUpdate = true;
    this.tails.geometry.setDrawRange(0, offset / 3);
  }
}
