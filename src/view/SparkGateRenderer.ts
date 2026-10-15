import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { gateFacesCamera, gateMarks, type GateMark } from './SparkGateModel';
import type { Scene } from '../core/contracts';
import { makeGatedCopy } from '../core/gatedConversion';
import { DEFAULT_SWITCH_LOOK, type GateIcon, type SwitchLook } from './art/appearance';
import { GATE_ICONS, GATE_OUTLINE } from './art/gateIcons';

const GLYPH_SCALE = 0.082;
const HOVER_LAYERS = [
  { width: 4, opacity: 0.09 },
  { width: 2.2, opacity: 0.2 },
  { width: 0.9, opacity: 0.9 },
];

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
        SVGLoader.getStrokeStyle(stroke, '#fff', 'round', 'round'),
      );
      positions.push(...geometry.attributes.position.array);
      geometry.dispose();
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  return geometry;
}

/** Shared flat glyph meshes cover all 540 gates; three small contours highlight one hover target. */
export class SparkGateRenderer extends THREE.Group {
  private on = new THREE.InstancedMesh(glyphGeometry('arrow',true,1), new THREE.MeshBasicMaterial({side:THREE.DoubleSide,depthWrite:false}), 540);
  private off = new THREE.InstancedMesh(glyphGeometry('arrow',false,GATE_OUTLINE.width/24), new THREE.MeshBasicMaterial({side:THREE.DoubleSide,transparent:true,opacity:GATE_OUTLINE.opacity,depthWrite:false}), 540);
  private readonly hoverLayers = HOVER_LAYERS.map(({ width }, index) => {
    const mesh = new THREE.InstancedMesh(glyphGeometry('arrow', false, width / 24),
      new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, transparent: true, depthWrite: false }), 1);
    mesh.renderOrder = index + 1;
    return mesh;
  });
  private hovered: string | null = null;
  private hoverMark: string | null = null;
  private hoverOpacity = 0;
  private hoverTime: number | null = null;
  private worldUnitsPerPixel = GLYPH_SCALE / 24;
  private look: SwitchLook = {...DEFAULT_SWITCH_LOOK};
  private selected: number|null = null;
  private dirty = true;
  private cameraDirection=new THREE.Vector3();
  private passages = new Map<number,number>();
  private legacyRouting: Scene|null = null;
  private legacyRoutingKey = '';
  marks: GateMark[] = [];

  constructor() {
    super();
    for (const mesh of [this.off,this.on,...this.hoverLayers]) {
      mesh.count=0; mesh.frustumCulled=false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.add(mesh);
    }
  }

  setScene(scene:Scene,selected:number|null,_time:number) {
    let routing=scene;
    if(scene.version===1){
      // Musical phase/tempo/voice edits do not change the conversion preview.
      // Keep one preview, rather than recomputing hundreds of shortest paths
      // before every live command reaches the audio thread.
      const key=JSON.stringify([scene.settings.propagation,scene.pieces.map(p=>p.kind==='generator'?[p.kind,p.vertex,p.reach,p.path]:[p.kind,p.vertex])]);
      if(key!==this.legacyRoutingKey||!this.legacyRouting){this.legacyRouting=makeGatedCopy(scene);this.legacyRoutingKey=key;}
      routing=this.legacyRouting;
    }else{this.legacyRouting=null;this.legacyRoutingKey='';}
    this.marks=gateMarks(routing,selected); this.selected=selected; this.dirty=true;
  }
  setLook(look:SwitchLook) {
    if (JSON.stringify(look)===JSON.stringify(this.look)) return;
    const outlineChanged=look.icon!==this.look.icon || look.stroke!==this.look.stroke || look.size!==this.look.size;
    if (look.icon!==this.look.icon) {
      const old=this.on.geometry; this.on.geometry=glyphGeometry(look.icon,true,0); old.dispose();
    }
    this.look={...look}; this.dirty=true;
    if (outlineChanged) this.refreshOutline();
  }
  private refreshOutline() {
    // Convert the requested CSS-pixel width to local glyph units. Icon size,
    // viewport size and orthographic zoom must not make the outline bolder.
    const width=GATE_OUTLINE.width*this.look.stroke*this.worldUnitsPerPixel/(GLYPH_SCALE*this.look.size);
    const old=this.off.geometry; this.off.geometry=glyphGeometry(this.look.icon,false,width); old.dispose();
    this.hoverLayers.forEach((mesh, index) => {
      const previous = mesh.geometry;
      mesh.geometry = glyphGeometry(this.look.icon, false,
        HOVER_LAYERS[index].width * this.worldUnitsPerPixel / (GLYPH_SCALE * this.look.size));
      previous.dispose();
    });
    this.dirty = true;
  }
  setHovered(id: string | null) {
    if (id === this.hovered) return;
    this.hovered = id;
    if (id !== null) { this.hoverMark = id; this.hoverOpacity = 0; }
    this.dirty = true;
  }
  passage(vertex:number,time:number) { this.passages.set(vertex,time); }
  clearPassages() { this.passages.clear(); this.dirty=true; }

  update(time:number,reduced:boolean,wallTime=time,cameraDirection?:THREE.Vector3,worldUnitsPerPixel=this.worldUnitsPerPixel) {
    const elapsed = Math.max(0, wallTime - (this.hoverTime ?? wallTime));
    this.hoverTime = wallTime;
    const opacity = reduced ? (this.hovered ? 1 : 0)
      : THREE.MathUtils.clamp(this.hoverOpacity + (this.hovered ? 1 : -1) * elapsed / 0.1, 0, 1);
    if (opacity !== this.hoverOpacity) { this.hoverOpacity = opacity; this.dirty = true; }
    if (opacity === 0 && this.hovered === null) this.hoverMark = null;
    if (Math.abs(worldUnitsPerPixel-this.worldUnitsPerPixel)>1e-8) {
      this.worldUnitsPerPixel=worldUnitsPerPixel; this.refreshOutline();
    }
    if(cameraDirection&&!this.cameraDirection.equals(cameraDirection)){this.cameraDirection.copy(cameraDirection);this.dirty=true;}
    if (!this.dirty && this.passages.size===0) return;
    for (const [vertex,start] of this.passages) if (time-start>.2 || reduced || !this.look.animation) this.passages.delete(vertex);
    this.on.material.color.set(this.look.onColor);
    this.off.material.color.set(this.look.offColor);
    this.hoverLayers.forEach((mesh, index) => {
      mesh.count = 0;
      mesh.material.opacity = HOVER_LAYERS[index].opacity * this.hoverOpacity;
    });
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
      matrix.compose(new THREE.Vector3(...mark.point),rotation,new THREE.Vector3().setScalar(GLYPH_SCALE*this.look.size*(1+pulse)));
      if (mark.on) this.on.setMatrixAt(on++,matrix); else this.off.setMatrixAt(off++,matrix);
      if (mark.id === this.hoverMark && this.hoverOpacity > 0) {
        matrix.setPosition(new THREE.Vector3(...mark.point).addScaledVector(normal, 0.001));
        for (const mesh of this.hoverLayers) { mesh.count = 1; mesh.setMatrixAt(0, matrix); }
      }
    }
    this.on.count=on; this.off.count=off;
    this.on.instanceMatrix.needsUpdate=this.off.instanceMatrix.needsUpdate=true;
    for (const mesh of this.hoverLayers) mesh.instanceMatrix.needsUpdate = true;
    this.dirty=false;
  }

  get diagnostics() { return {style:'flat',icon:this.look.icon,marks:this.marks.length,selected:this.selected,geometries:2+this.hoverLayers.length,materials:2+this.hoverLayers.length,animation:this.look.animation,hover:{id:this.hovered,opacity:this.hoverOpacity},outline:{width:GATE_OUTLINE.width*this.look.stroke,opacity:GATE_OUTLINE.opacity,worldUnitsPerPixel:this.worldUnitsPerPixel},look:{...this.look}}; }
  dispose() {
    for (const mesh of [this.on,this.off,...this.hoverLayers]) { mesh.geometry.dispose(); mesh.material.dispose(); }
    this.passages.clear(); this.removeFromParent();
    this.legacyRouting=null;
  }
}
