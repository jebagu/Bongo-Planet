import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { gateFacesCamera, gateMarks, type GateMark } from './SparkGateModel';
import type { Scene } from '../core/contracts';
import { DEFAULT_SWITCH_LOOK, type GateIcon, type SwitchLook } from './art/appearance';
import { GATE_ICONS } from './art/gateIcons';

function glyphGeometry(icon: GateIcon, solid: boolean, stroke: number): THREE.BufferGeometry {
  const positions: number[] = [];
  for (const polygon of GATE_ICONS.find(g => g.id === icon)!.polygons) {
    const points = polygon.map(([x,y]) => new THREE.Vector2((x-12)/24, (12-y)/24));
    if (solid) {
      const shape = new THREE.Shape(points);
      const indexed = new THREE.ShapeGeometry(shape);
      const geometry = indexed.toNonIndexed();
      positions.push(...geometry.attributes.position.array);
      indexed.dispose(); geometry.dispose();
    } else {
      // Stroke the whole closed contour so corners meet, matching the tray's SVG.
      const geometry = SVGLoader.pointsToStroke(
        [...points, points[0]],
        SVGLoader.getStrokeStyle(stroke * 1.5 / 24, '#fff', 'round', 'round'),
      );
      positions.push(...geometry.attributes.position.array);
      geometry.dispose();
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  return geometry;
}

/** Two shared flat glyph meshes cover all 540 directed gates, including unwired ones. */
export class SparkGateRenderer extends THREE.Group {
  private on = new THREE.InstancedMesh(glyphGeometry('arrow',true,1), new THREE.MeshBasicMaterial({side:THREE.DoubleSide,depthWrite:false}), 540);
  private off = new THREE.InstancedMesh(glyphGeometry('arrow',false,1), new THREE.MeshBasicMaterial({side:THREE.DoubleSide,depthWrite:false}), 540);
  private look: SwitchLook = {...DEFAULT_SWITCH_LOOK};
  private selected: number|null = null;
  private dirty = true;
  private cameraDirection=new THREE.Vector3();
  private passages = new Map<number,number>();
  marks: GateMark[] = [];

  constructor() {
    super();
    for (const mesh of [this.off,this.on]) {
      mesh.count=0; mesh.frustumCulled=false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.add(mesh);
    }
  }

  setScene(scene:Scene,selected:number|null,_time:number) {
    this.marks=gateMarks(scene,selected); this.selected=selected; this.dirty=true;
  }
  setLook(look:SwitchLook) {
    if (JSON.stringify(look)===JSON.stringify(this.look)) return;
    if (look.icon!==this.look.icon || look.stroke!==this.look.stroke) {
      for (const [mesh,solid] of [[this.on,true],[this.off,false]] as const) {
        const old=mesh.geometry; mesh.geometry=glyphGeometry(look.icon,solid,look.stroke); old.dispose();
      }
    }
    this.look={...look}; this.dirty=true;
  }
  passage(vertex:number,time:number) { this.passages.set(vertex,time); }
  clearPassages() { this.passages.clear(); this.dirty=true; }

  update(time:number,reduced:boolean,_wallTime=time,cameraDirection?:THREE.Vector3) {
    if(cameraDirection&&!this.cameraDirection.equals(cameraDirection)){this.cameraDirection.copy(cameraDirection);this.dirty=true;}
    if (!this.dirty && this.passages.size===0) return;
    for (const [vertex,start] of this.passages) if (time-start>.2 || reduced || !this.look.animation) this.passages.delete(vertex);
    this.on.material.color.set(this.look.onColor);
    this.off.material.color.set(this.look.offColor);
    let on=0,off=0;
    const basis=new THREE.Matrix4(),rotation=new THREE.Quaternion(),matrix=new THREE.Matrix4();
    for (const mark of this.marks) {
      if(cameraDirection&&!gateFacesCamera(mark,cameraDirection.toArray()))continue;
      const axis=new THREE.Vector3(...mark.to).sub(new THREE.Vector3(...mark.from)).normalize();
      const normal=new THREE.Vector3(...mark.from).add(new THREE.Vector3(...mark.to)).normalize();
      const side=new THREE.Vector3().crossVectors(normal,axis).normalize();
      rotation.setFromRotationMatrix(basis.makeBasis(axis,side,normal));
      const start=this.passages.get(mark.vertex);
      const pulse=start!==undefined?Math.max(0,1-(time-start)/.2)*.12:0;
      matrix.compose(new THREE.Vector3(...mark.point),rotation,new THREE.Vector3().setScalar(.082*this.look.size*(1+pulse)));
      if (mark.on) this.on.setMatrixAt(on++,matrix); else this.off.setMatrixAt(off++,matrix);
    }
    this.on.count=on; this.off.count=off;
    this.on.instanceMatrix.needsUpdate=this.off.instanceMatrix.needsUpdate=true;
    this.dirty=false;
  }

  get diagnostics() { return {style:'flat',icon:this.look.icon,marks:this.marks.length,selected:this.selected,geometries:2,materials:2,animation:this.look.animation,look:{...this.look}}; }
  dispose() {
    for (const mesh of [this.on,this.off]) { mesh.geometry.dispose(); mesh.material.dispose(); }
    this.passages.clear(); this.removeFromParent();
  }
}
