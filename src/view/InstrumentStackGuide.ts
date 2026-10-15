import * as THREE from 'three';
import {LIMITS} from '../core/contracts';

export const STACK_BASE_RADIUS = 1.035;
export const STACK_SPACING = .19;
const SLOT_RADIUS = .115;
const SLOT_BOTTOM = -.008;
const SLOT_TOP = .13;
export const STACK_SLOT_CENTER = (SLOT_BOTTOM+SLOT_TOP)/2;
const OUTWARD = new THREE.Vector3(0, 0, 1);

/** Transient, surface-normal cylinders showing the instrument capacity of one node. */
export class InstrumentStackGuide extends THREE.Group {
  private readonly cells: {frame: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>; shell: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>}[] = [];
  vertex: number | null = null;
  occupied = 0;
  nextLayer: number | null = null;

  constructor() {
    super();
    this.name = 'Instrument stack slots';
    this.visible = false;
    const points: THREE.Vector3[] = [];
    for (const z of [SLOT_BOTTOM, SLOT_TOP]) for (let i=0; i<48; i++) {
      for (const step of [i, i+1]) {
        const angle = step / 48 * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle)*SLOT_RADIUS, Math.sin(angle)*SLOT_RADIUS, z));
      }
    }
    for (let i=0; i<4; i++) {
      const angle = (i+.5) / 4 * Math.PI * 2;
      for (const z of [SLOT_BOTTOM, SLOT_TOP]) points.push(new THREE.Vector3(Math.cos(angle)*SLOT_RADIUS, Math.sin(angle)*SLOT_RADIUS, z));
    }
    const outline = new THREE.BufferGeometry().setFromPoints(points);
    const cylinder = new THREE.CylinderGeometry(SLOT_RADIUS, SLOT_RADIUS, SLOT_TOP-SLOT_BOTTOM, 48);
    cylinder.rotateX(Math.PI/2);
    cylinder.translate(0, 0, STACK_SLOT_CENTER);
    for (let layer=0; layer<LIMITS.stack; layer++) {
      const frame = new THREE.LineSegments(outline, new THREE.LineBasicMaterial({color:'#e4f5ff',transparent:true,opacity:.18,depthWrite:false}));
      const shell = new THREE.Mesh(cylinder, new THREE.MeshBasicMaterial({color:'#d0fff1',transparent:true,opacity:.012,side:THREE.DoubleSide,depthWrite:false}));
      frame.position.z = shell.position.z = layer*STACK_SPACING;
      shell.userData.layer = layer;
      this.cells.push({frame,shell});
      this.add(frame,shell);
    }
  }

  show(vertex: number, normal: THREE.Vector3, occupied: number, size: number, nextLayer: number | null) {
    this.visible = true;
    this.vertex = vertex;
    this.occupied = occupied;
    this.nextLayer = nextLayer;
    this.position.copy(normal).multiplyScalar(STACK_BASE_RADIUS);
    this.quaternion.setFromUnitVectors(OUTWARD,normal);
    this.scale.setScalar(size);
    this.cells.forEach(({frame,shell},layer)=>{
      const next = layer === nextLayer;
      const filled = layer < occupied;
      frame.material.color.set(next ? '#c3fff1' : '#e4f5ff');
      frame.material.opacity = next ? .62 : filled ? .09 : .23;
      shell.material.opacity = next ? .035 : filled ? .004 : .012;
    });
    this.updateMatrixWorld(true);
  }

  hide() { this.visible = false; this.vertex = null; this.nextLayer = null; }

  hit(ray: THREE.Raycaster): number | null {
    if (!this.visible) return null;
    const hit = ray.intersectObjects(this.cells.map(cell=>cell.shell),false)[0];
    return hit ? hit.object.userData.layer as number : null;
  }

  get diagnostics() { return {visible:this.visible,vertex:this.vertex,occupied:this.occupied,slots:this.cells.length,nextLayer:this.nextLayer}; }
}
