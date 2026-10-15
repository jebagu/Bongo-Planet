import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { EngineEvent, Piece, Scene, Trigger, Vec3 } from '../core/contracts';
import { emptyScene } from '../core/contracts';
import { angle, surfacePoint, topology } from '../core/geometry';
import { surfaceArc, toRenderPoint, wavefront } from './math';

type Callbacks = {
  place: (kind: Piece['kind'], vertex: number) => void;
  select: (id: string | null) => void;
  move: (id: string, vertex: number) => void;
  message: (text: string) => void;
};
type PieceVisual = { group: THREE.Group; material: THREE.MeshBasicMaterial; vertex: number; placed: number };
type Motion = { from: Vec3; to: Vec3; start: number; trail: THREE.Line };
type Drag = { pointer: number; kind: Piece['kind']; id: string | null; x: number; y: number; moved: boolean; vertex: number | null };
type Pulse = { generatorId: string; source: Vec3; time: number; periodSeconds: number; reach: number; travel: number; line: THREE.Line };
type Travel = { trigger: Trigger; source: Vec3; target: Vec3; line: THREE.Line };
const COLORS = { generator: 0xffc875, note: 0x73efda, beat: 0xe993f7 };
const UP = new THREE.Vector3(0, 0, 1);
const vector = (p: Vec3, radius = 1) => new THREE.Vector3(...toRenderPoint(p, radius));
const lineMaterial = (color: number, opacity: number) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

/** Presentation and pointer routing only. This class never schedules musical work. */
export class SphereView {
  private readonly world = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(39, 1, 0.1, 30);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly connections = new THREE.Group();
  private readonly previews = new THREE.Group();
  private readonly slots: THREE.Mesh[] = [];
  private readonly pieces = new Map<string, PieceVisual>();
  private readonly motions = new Map<string, Motion>();
  private readonly pulses: Pulse[] = [];
  private readonly travels = new Map<string, Travel>();
  private readonly highlight: THREE.Mesh;
  private readonly resizeObserver: ResizeObserver;
  private readonly preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private scene: Scene = emptyScene();
  private selected: string | null = null;
  private tool: Piece['kind'] | null = null;
  private drag: Drag | null = null;
  private cameraTap: { pointer: number; x: number; y: number; moved: boolean } | null = null;
  private now = () => performance.now() / 1000;
  private fps = 60;
  private lastFrame = -Infinity;
  private frame = 0;
  private frameCount = 0;
  private disposed = false;
  private reducedMotion = this.preference.matches;
  private contextLost = false;
  private previewVertex: number | null = null;
  private previewSignature: string | null = null;
  private ghost: THREE.Group | null = null;

  constructor(private readonly container: HTMLElement, private readonly callbacks: Callbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x080c15, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-label', 'Bongo Planet sphere. Choose a piece, then tap an open slot; drag empty space to orbit.');
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.display = 'block';
    this.container.append(this.renderer.domElement);
    this.camera.position.set(0.3, 0.26, 3.5);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.3;
    this.controls.maxDistance = 5.5;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.7;
    this.world.add(new THREE.AmbientLight(0x91b7dd, 1.25));
    const light = new THREE.DirectionalLight(0xc6e8ff, 1.8);
    light.position.set(-2, 3, 4);
    this.world.add(light);
    this.world.add(new THREE.Mesh(new THREE.SphereGeometry(0.993, 64, 48), new THREE.MeshPhongMaterial({ color: 0x091924, shininess: 35, specular: 0x183542 })));
    const edgePoints = topology.edges.flatMap(([a, b]) => {
      const points = surfaceArc(topology.vertices[a], topology.vertices[b], 8, 1.002);
      return points.slice(1).flatMap((p, i) => [new THREE.Vector3(...points[i]), new THREE.Vector3(...p)]);
    });
    const edges = new THREE.BufferGeometry().setFromPoints(edgePoints);
    this.world.add(new THREE.LineSegments(edges, lineMaterial(0x6ea4bb, 0.22)));
    const backMaterial = lineMaterial(0x6ea4bb, 0.035);
    backMaterial.depthTest = false;
    this.world.add(new THREE.LineSegments(edges.clone(), backMaterial));
    const slotGeometry = new THREE.SphereGeometry(0.011, 8, 6);
    topology.vertices.forEach(p => {
      const material = new THREE.MeshBasicMaterial({ color: 0x81aec2, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false });
      const slot = new THREE.Mesh(slotGeometry, material);
      slot.position.copy(vector(p, 1.009));
      this.slots.push(slot);
      this.world.add(slot);
    });
    this.highlight = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.006, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false }));
    this.highlight.visible = false;
    this.world.add(this.highlight, this.connections, this.previews);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(container);
    this.resize();
    // Capture before OrbitControls receives a pointer: pieces and camera never share ownership.
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown, true);
    this.renderer.domElement.addEventListener('pointermove', this.hover);
    this.renderer.domElement.addEventListener('pointerleave', this.leave);
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLoss);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.contextRestore);
    document.addEventListener('pointermove', this.pointerMove, true);
    document.addEventListener('pointerdown', this.competingPointer, true);
    document.addEventListener('pointerup', this.pointerUp, true);
    document.addEventListener('pointercancel', this.pointerCancel, true);
    document.addEventListener('visibilitychange', this.visibilityChange);
    window.addEventListener('blur', this.cancelDrag);
    window.addEventListener('keydown', this.keyDown);
    this.preference.addEventListener('change', this.motionPreference);
    this.frame = requestAnimationFrame(this.animate);
  }

  setScene(scene: Scene) {
    const time = performance.now() / 1000;
    for (const [id, visual] of this.pieces) {
      if (!scene.pieces.some(p => p.id === id && p.kind === this.scene.pieces.find(old => old.id === id)?.kind)) {
        this.destroy(visual.group);
        this.pieces.delete(id);
        const motion = this.motions.get(id);
        if (motion) this.destroy(motion.trail);
        this.motions.delete(id);
      }
    }
    for (const piece of scene.pieces) {
      const existing = this.pieces.get(piece.id);
      if (existing) {
        if (existing.vertex !== piece.vertex) {
          const from = this.position(piece.id, time) ?? topology.vertices[existing.vertex];
          const previous = this.motions.get(piece.id);
          if (previous) this.destroy(previous.trail);
          const trail = this.arc(from, topology.vertices[piece.vertex], COLORS[piece.kind], 0.5);
          trail.visible = !this.reducedMotion;
          this.world.add(trail);
          this.motions.set(piece.id, { from, to: topology.vertices[piece.vertex], start: time, trail });
          existing.vertex = piece.vertex;
        }
      } else {
        const visual = this.createPiece(piece.kind);
        visual.vertex = piece.vertex;
        visual.placed = time;
        this.pieces.set(piece.id, visual);
        this.world.add(visual.group);
      }
    }
    this.scene = scene;
    this.previewSignature = null;
    for (let i = this.pulses.length - 1; i >= 0; i--) if (!this.pieces.has(this.pulses[i].generatorId)) {
      this.destroy(this.pulses[i].line); this.pulses.splice(i, 1);
    }
    if (this.selected && !this.pieces.has(this.selected)) this.selected = null;
    if (this.drag?.id && !this.pieces.has(this.drag.id)) this.cancelDrag();
    this.buildConnections();
    this.updateSelection();
    this.lastFrame = -Infinity;
  }

  setSelected(id: string | null) { this.selected = id; this.updateSelection(); }
  setTool(kind: Piece['kind'] | null) { this.tool = kind; this.clearPreview(); this.renderer.domElement.style.cursor = kind ? 'crosshair' : 'grab'; }
  setFPS(fps: number) { this.fps = Math.max(1, Math.min(120, Number.isFinite(fps) ? fps : 60)); }
  setClock(now: () => number) {
    // Musical feedback uses output time; placement/movement use monotonic presentation time.
    this.now = now;
    this.lastFrame = -Infinity;
  }

  event(event: EngineEvent) {
    if (event.type === 'reset') { this.clearEvents(); return; }
    if (event.type === 'cancel') {
      for (const [id, travel] of this.travels) if (event.ids.includes(id) || event.nodeIds.includes(travel.trigger.nodeId) || event.nodeIds.includes(travel.trigger.generatorId)) {
        this.destroy(travel.line); this.travels.delete(id);
      }
      return;
    }
    if (event.type === 'emission') {
      const generator = this.scene.pieces.find(p => p.id === event.generatorId);
      if (!generator) return;
      const line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial(COLORS.generator, 0.7));
      this.world.add(line);
      this.pulses.push({ ...event, source: [...topology.vertices[generator.vertex]], travel: this.scene.settings.travel, line });
      return;
    }
    const trigger = event.trigger;
    if (this.travels.has(trigger.id)) return;
    const generator = this.scene.pieces.find(p => p.id === trigger.generatorId);
    const source = generator ? [...topology.vertices[generator.vertex]] as Vec3 : trigger.position;
    const target = [...trigger.position] as Vec3;
    const line = this.arc(source, target, COLORS[this.scene.pieces.find(p => p.id === trigger.nodeId)?.kind ?? 'note'], 0);
    this.world.add(line);
    this.travels.set(trigger.id, { trigger, source, target, line });
  }

  beginPaletteDrag(kind: Piece['kind'], event: PointerEvent) {
    if (this.drag) { this.cancelDrag(); return; }
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    this.startDrag(kind, null, event);
  }

  getProjectedSlots() {
    this.camera.updateMatrixWorld();
    const rect = this.renderer.domElement.getBoundingClientRect();
    return topology.vertices.map((point, vertex) => {
      const p = vector(point, 1.01);
      const front = p.dot(this.camera.position.clone().sub(p)) > 0.03;
      p.project(this.camera);
      return { vertex, x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2, visible: front && Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && p.z < 1 };
    });
  }

  getDiagnostics() {
    return { renderer: 'WebGL2', fpsLimit: this.fps, frames: this.frameCount, reducedMotion: this.reducedMotion, contextLost: this.contextLost, dragging: this.drag?.id ?? (this.drag ? this.drag.kind : null), selected: this.selected, destination: this.drag?.vertex ?? this.previewVertex, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, camera: this.camera.position.toArray(), movingPieces: this.motions.size, visualTime: this.now() };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.cancelDrag();
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown, true);
    this.renderer.domElement.removeEventListener('pointermove', this.hover);
    this.renderer.domElement.removeEventListener('pointerleave', this.leave);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLoss);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.contextRestore);
    document.removeEventListener('pointermove', this.pointerMove, true);
    document.removeEventListener('pointerdown', this.competingPointer, true);
    document.removeEventListener('pointerup', this.pointerUp, true);
    document.removeEventListener('pointercancel', this.pointerCancel, true);
    document.removeEventListener('visibilitychange', this.visibilityChange);
    window.removeEventListener('blur', this.cancelDrag);
    window.removeEventListener('keydown', this.keyDown);
    this.preference.removeEventListener('change', this.motionPreference);
    this.destroy(this.world);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private createPiece(kind: Piece['kind']): PieceVisual {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: COLORS[kind], transparent: true, depthTest: false, depthWrite: false });
    const geometry = kind === 'generator' ? new THREE.TorusGeometry(0.043, 0.009, 12, 40) : kind === 'note' ? new THREE.SphereGeometry(0.035, 18, 14) : new THREE.OctahedronGeometry(0.046);
    group.add(new THREE.Mesh(geometry, material));
    if (kind === 'generator') group.add(new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), material));
    const haloMaterial = new THREE.MeshBasicMaterial({ color: COLORS[kind], transparent: true, opacity: 0.13, depthTest: false, depthWrite: false });
    group.add(new THREE.Mesh(new THREE.RingGeometry(0.057, 0.075, 48), haloMaterial));
    return { group, material, vertex: 0, placed: -Infinity };
  }

  private arc(a: Vec3, b: Vec3, color: number, opacity: number) {
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(surfaceArc(a, b).map(p => new THREE.Vector3(...p))), lineMaterial(color, opacity));
  }

  private buildConnections() {
    this.clearGroup(this.connections);
    for (const generator of this.scene.pieces) if (generator.kind === 'generator' && generator.enabled) {
      for (const target of this.scene.pieces) if (target.kind !== 'generator' && angle(topology.vertices[generator.vertex], topology.vertices[target.vertex]) <= generator.reach * Math.PI / 180 + 1e-9) {
        this.connections.add(this.arc(topology.vertices[generator.vertex], topology.vertices[target.vertex], COLORS[target.kind], generator.id === this.selected || target.id === this.selected ? 0.35 : 0.13));
      }
    }
  }

  private position(id: string, time: number): Vec3 | undefined {
    const motion = this.motions.get(id);
    if (motion) {
      const t = Math.max(0, Math.min(1, (time - motion.start) / 0.12));
      motion.trail.visible = !this.reducedMotion;
      (motion.trail.material as THREE.LineBasicMaterial).opacity = (1 - t) * 0.55;
      if (t === 1) { this.destroy(motion.trail); this.motions.delete(id); }
      return surfacePoint(motion.from, motion.to, t);
    }
    const visual = this.pieces.get(id);
    return visual ? topology.vertices[visual.vertex] : undefined;
  }

  private orient(object: THREE.Object3D, p: Vec3, radius = 1.035) {
    object.position.copy(vector(p, radius));
    object.quaternion.setFromUnitVectors(UP, vector(p).normalize());
  }

  private updateSelection() {
    if (this.drag || this.previewVertex !== null) return;
    const piece = this.scene.pieces.find(p => p.id === this.selected);
    this.highlight.visible = !!piece;
    if (piece) {
      this.orient(this.highlight, topology.vertices[piece.vertex], 1.038);
      (this.highlight.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
    }
    this.buildConnections();
  }

  private resize = () => {
    const width = Math.max(1, this.container.clientWidth), height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.lastFrame = -Infinity;
  };

  private animate = (wallTime: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    if (wallTime - this.lastFrame < 1000 / this.fps - 0.5 || this.contextLost) return;
    this.lastFrame = wallTime;
    if (!this.drag) this.controls.update();
    const time = this.now();
    const flashes = new Map<string, number>();
    for (const travel of this.travels.values()) if (time >= travel.trigger.onset) {
      const decay = Math.max(0.2, Math.min(0.8, travel.trigger.sound.duration * 0.3));
      const level = Math.exp(-(time - travel.trigger.onset) / decay);
      flashes.set(travel.trigger.nodeId, Math.max(flashes.get(travel.trigger.nodeId) ?? 0, level));
    }
    for (const pulse of this.pulses) if (time >= pulse.time) {
      const level = Math.exp(-(time - pulse.time) / 0.18);
      flashes.set(pulse.generatorId, Math.max(flashes.get(pulse.generatorId) ?? 0, level));
    }
    for (const [id, visual] of this.pieces) {
      const p = this.position(id, wallTime / 1000)!;
      this.orient(visual.group, p);
      const facing = vector(p).dot(this.camera.position.clone().sub(vector(p))) > 0;
      const piece = this.scene.pieces.find(piece => piece.id === id)!;
      const disabled = piece.kind === 'generator' && !piece.enabled;
      const glow = Math.min(1, flashes.get(id) ?? 0);
      visual.material.opacity = facing ? (disabled ? 0.35 : 1) : 0.12;
      visual.material.color.setHex(COLORS[piece.kind]).lerp(new THREE.Color(0xffffff), glow * 0.8);
      const settle = this.reducedMotion ? 0 : Math.max(0, 1 - (performance.now() / 1000 - visual.placed) / 0.18);
      const scale = this.reducedMotion ? 1 : 1 + glow * 0.35 + Math.sin(settle * Math.PI) * 0.2;
      visual.group.scale.setScalar(scale);
      (visual.group.children[visual.group.children.length - 1] as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>).material.opacity = facing ? (id === this.selected ? 0.65 : 0.15 + glow * 0.5) : 0.03;
    }
    this.slots.forEach((slot, vertex) => {
      const p = vector(topology.vertices[vertex]);
      const front = p.dot(this.camera.position.clone().sub(p)) > 0;
      const occupied = this.scene.pieces.some(piece => piece.vertex === vertex);
      (slot.material as THREE.MeshBasicMaterial).opacity = front ? (occupied ? 0.1 : 0.65) : 0.055;
    });
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i], elapsed = time - pulse.time;
      const reach = pulse.reach * Math.PI / 180;
      const theta = Math.PI * Math.max(0, elapsed) / (pulse.periodSeconds * pulse.travel);
      if (elapsed > Math.max(0.25, pulse.periodSeconds * pulse.travel * reach / Math.PI) + 0.12) {
        this.destroy(pulse.line); this.pulses.splice(i, 1); continue;
      }
      pulse.line.visible = !this.reducedMotion && elapsed >= 0 && theta <= reach;
      if (pulse.line.visible) {
        pulse.line.geometry.dispose();
        pulse.line.geometry = new THREE.BufferGeometry().setFromPoints(wavefront(pulse.source, theta).map(p => new THREE.Vector3(...p)));
        (pulse.line.material as THREE.LineBasicMaterial).opacity = 0.65 * (1 - Math.min(1, theta / Math.PI) * 0.6);
      }
    }
    for (const [id, travel] of this.travels) {
      const elapsed = time - travel.trigger.onset;
      if (elapsed > 1) { this.destroy(travel.line); this.travels.delete(id); continue; }
      const material = travel.line.material as THREE.LineBasicMaterial;
      material.opacity = time < travel.trigger.emission ? 0 : elapsed < 0 ? 0.55 : Math.exp(-elapsed / 0.18) * 0.6;
    }
    if (this.selected && !this.drag && this.previewVertex === null) {
      const p = this.position(this.selected, wallTime / 1000);
      if (p) this.orient(this.highlight, p, 1.04);
    }
    this.renderer.render(this.world, this.camera);
    this.frameCount++;
  };

  private nearest(x: number, y: number, touch = false) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    const slots = this.getProjectedSlots().filter(p => p.visible).map(p => ({ ...p, d: Math.hypot(x - p.x, y - p.y) })).sort((a, b) => a.d - b.d);
    return slots[0] && slots[0].d <= (touch ? 35 : 25) ? slots[0].vertex : null;
  }

  private legal(vertex: number | null, id: string | null) {
    return vertex !== null && !this.scene.pieces.some(piece => piece.vertex === vertex && piece.id !== id);
  }

  private pointerDown = (event: PointerEvent) => {
    if (this.drag) {
      event.preventDefault(); event.stopImmediatePropagation(); this.cancelDrag(); return;
    }
    if (!event.isPrimary || event.button !== 0) return;
    const vertex = this.nearest(event.clientX, event.clientY, event.pointerType === 'touch');
    const piece = this.scene.pieces.find(piece => piece.vertex === vertex);
    if (piece) {
      event.preventDefault(); event.stopImmediatePropagation();
      this.callbacks.select(piece.id);
      this.startDrag(piece.kind, piece.id, event);
    } else if (this.tool && vertex !== null) {
      event.preventDefault(); event.stopImmediatePropagation(); this.startDrag(this.tool, null, event);
    } else if (this.selected && vertex !== null) {
      event.preventDefault(); event.stopImmediatePropagation();
      const selected = this.scene.pieces.find(p => p.id === this.selected);
      if (selected) this.startDrag(selected.kind, selected.id, event);
    } else {
      this.clearPreview();
      // Deselect only for a tap; orbit is delegated entirely to OrbitControls.
      this.cameraTap = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    }
  };

  private startDrag(kind: Piece['kind'], id: string | null, event: PointerEvent) {
    this.cameraTap = null;
    this.drag = { pointer: event.pointerId, kind, id, x: event.clientX, y: event.clientY, moved: false, vertex: null };
    this.controls.enabled = false;
    this.renderer.domElement.style.cursor = 'grabbing';
    this.ghost = this.createPiece(kind).group;
    this.ghost.traverse(object => { if (object instanceof THREE.Mesh) object.material.opacity = 0.55; });
    this.world.add(this.ghost);
    this.showPreview(this.nearest(event.clientX, event.clientY, event.pointerType === 'touch'), kind, id);
    this.drag.vertex = this.previewVertex;
  }

  private pointerMove = (event: PointerEvent) => {
    if (this.cameraTap?.pointer === event.pointerId) this.cameraTap.moved ||= Math.hypot(event.clientX - this.cameraTap.x, event.clientY - this.cameraTap.y) > 5;
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    event.preventDefault(); event.stopImmediatePropagation();
    this.drag.moved ||= Math.hypot(event.clientX - this.drag.x, event.clientY - this.drag.y) > 5;
    const vertex = this.nearest(event.clientX, event.clientY, event.pointerType === 'touch');
    this.drag.vertex = vertex;
    this.showPreview(vertex, this.drag.kind, this.drag.id);
  };

  private pointerUp = (event: PointerEvent) => {
    if (this.cameraTap?.pointer === event.pointerId) {
      if (!this.cameraTap.moved) this.callbacks.select(null);
      this.cameraTap = null;
    }
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const drag = this.drag;
    const vertex = this.nearest(event.clientX, event.clientY, event.pointerType === 'touch');
    this.cancelDrag();
    // A palette tap may choose a tool in the UI without being a failed drop.
    if (!drag.id && !drag.moved && vertex === null) return;
    if (this.legal(vertex, drag.id)) {
      if (drag.id) {
        if (this.scene.pieces.find(piece => piece.id === drag.id)?.vertex !== vertex) this.callbacks.move(drag.id, vertex!);
      } else this.callbacks.place(drag.kind, vertex!);
    } else this.callbacks.message(vertex === null ? 'Drop on a visible slot to place a piece.' : 'That slot is occupied. Choose an open slot.');
  };

  private pointerCancel = (event: PointerEvent) => {
    if (event.pointerId === this.cameraTap?.pointer) this.cameraTap = null;
    if (event.pointerId === this.drag?.pointer) this.cancelDrag();
  };
  private competingPointer = (event: PointerEvent) => {
    if (this.drag && event.pointerId !== this.drag.pointer) {
      event.preventDefault(); event.stopImmediatePropagation(); this.cancelDrag();
    }
  };
  private cancelDrag = () => {
    this.drag = null;
    this.cameraTap = null;
    this.controls.enabled = true;
    if (this.ghost) { this.destroy(this.ghost); this.ghost = null; }
    this.clearPreview();
    this.renderer.domElement.style.cursor = this.tool ? 'crosshair' : 'grab';
  };

  private hover = (event: PointerEvent) => {
    if (this.drag || !this.tool || event.pointerType === 'touch') return;
    this.showPreview(this.nearest(event.clientX, event.clientY), this.tool, null);
  };
  private leave = () => { if (!this.drag) this.clearPreview(); };

  private showPreview(vertex: number | null, kind: Piece['kind'], id: string | null) {
    const signature = `${vertex}:${kind}:${id}`;
    if (signature === this.previewSignature) return;
    this.previewSignature = signature;
    this.previewVertex = vertex;
    this.clearGroup(this.previews);
    this.highlight.visible = vertex !== null;
    if (this.ghost) this.ghost.visible = vertex !== null;
    if (vertex === null) return;
    const legal = this.legal(vertex, id);
    this.orient(this.highlight, topology.vertices[vertex], 1.047);
    (this.highlight.material as THREE.MeshBasicMaterial).color.setHex(legal ? 0xffffff : 0xff7676);
    if (this.ghost) this.orient(this.ghost, topology.vertices[vertex], 1.055);
    if (!legal) return;
    const existing = this.scene.pieces.find(piece => piece.id === id);
    const reach = existing?.kind === 'generator' ? existing.reach : 90;
    for (const piece of this.scene.pieces) {
      if (piece.id === id || (kind === 'generator' ? piece.kind === 'generator' : piece.kind !== 'generator')) continue;
      const source = kind === 'generator' ? topology.vertices[vertex] : topology.vertices[piece.vertex];
      const target = kind === 'generator' ? topology.vertices[piece.vertex] : topology.vertices[vertex];
      const limit = piece.kind === 'generator' ? piece.reach : reach;
      if (piece.kind === 'generator' && !piece.enabled) continue;
      if (angle(source, target) <= limit * Math.PI / 180 + 1e-9) this.previews.add(this.arc(source, target, COLORS[kind === 'generator' ? piece.kind : kind], 0.7));
    }
  }

  private clearPreview() { this.previewVertex = null; this.previewSignature = null; this.clearGroup(this.previews); this.updateSelection(); }
  private keyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') this.cancelDrag(); };
  private visibilityChange = () => { if (document.hidden) this.cancelDrag(); };
  private motionPreference = (event: MediaQueryListEvent) => { this.reducedMotion = event.matches; this.lastFrame = -Infinity; };
  private contextLoss = (event: Event) => { event.preventDefault(); this.contextLost = true; this.cancelDrag(); this.callbacks.message('The graphics context was interrupted. Music controls remain available.'); };
  private contextRestore = () => { this.contextLost = false; this.lastFrame = -Infinity; };
  private clearEvents() {
    for (const pulse of this.pulses) this.destroy(pulse.line);
    this.pulses.length = 0;
    for (const travel of this.travels.values()) this.destroy(travel.line);
    this.travels.clear();
  }
  private clearGroup(group: THREE.Group) { for (const child of [...group.children]) this.destroy(child); }
  private destroy(object: THREE.Object3D) {
    object.removeFromParent();
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    object.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        geometries.add(child.geometry);
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material);
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
  }
}
