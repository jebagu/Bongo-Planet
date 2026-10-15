import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import type { EngineEvent, Piece, Scene, Trigger, Vec3 } from '../core/contracts';
import { canPlacePiece, emptyScene, LIMITS, piecesAt } from '../core/contracts';
import { angle, surfacePoint, topology } from '../core/geometry';
import { surfaceArc, toRenderPoint, wavefront } from './math';
import { DEFAULT_APPEARANCE, validateAppearance, type Appearance } from './art/appearance';
import type { Instrument } from '../core/instruments';
import { createToy, createFacetedPlanet } from './art/toys';
import { NorthPole } from './art/northPole';
import { PlanetMaterials } from './art/planetMaterials';
import { ThemeAtmosphere } from './art/ThemeAtmosphere';
import { protectFromScenery } from './art/SceneryMask';
import { SCENERY_FOCUS_LAYER } from './art/SceneryFocus';
import { strutPoints, strutRoute, routeThrough, type Surface } from './strutRoutes';
import { generatorRoutes, routesForGenerator } from '../core/routes';
import { StrutSparkModel } from './StrutSparkModel';
import { StrutSparkRenderer } from './StrutSparkRenderer';
import { SparkGateRenderer } from './SparkGateRenderer';
import { gateFacesCamera,pickGate,type ProjectedGate } from './SparkGateModel';
import {InstrumentStackGuide, STACK_BASE_RADIUS, STACK_SPACING, STACK_SLOT_CENTER} from './InstrumentStackGuide';

type Callbacks = {
  place: (kind: Piece['kind'], vertex: number) => void;
  select: (id: string | null) => void;
  move: (id: string, vertex: number) => void;
  remove?: (id: string) => void;
  exitTool?: () => void;
  selectJunction?: (vertex:number|null)=>void;
  toggleGate?: (vertex:number,exit:number)=>void;
  message: (text: string) => void;
};
type PieceVisual = { group: THREE.Group; material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial; halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; vertex: number; placed: number; layer: number };
type Motion = { from: Vec3; to: Vec3; start: number; trail: THREE.Line };
type Drag = { pointer: number; kind: Piece['kind']; id: string | null; x: number; y: number; moved: boolean; vertex: number | null };
type Pulse = { generatorId: string; source: Vec3; time: number; periodSeconds: number; reach: number; travel: number; line: THREE.Line };
type Travel = { trigger: Trigger; source: Vec3; target: Vec3; line: THREE.Line; glow?: THREE.Group; bead?: THREE.Mesh };
const COLORS = { generator: 0xffc875, note: 0x73efda, beat: 0xe993f7 };
const UP = new THREE.Vector3(0, 0, 1);
const CAMERA_FOV = 39;
const CAMERA_DISTANCE = Math.hypot(0.3, 0.26, 3.5);
const MIN_CAMERA_DISTANCE = 2.3;
const MAX_CAMERA_DISTANCE = 5.5;
const SLOW_ROTATION_SPEED = Math.PI / 60; // One revolution every two minutes.
const vector = (p: Vec3, radius = 1) => new THREE.Vector3(...toRenderPoint(p, radius));
const lineMaterial = (color: number, opacity: number) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

/** Presentation and pointer routing only. This class never schedules musical work. */
export class SphereView {
  private readonly world = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: TrackballControls;
  private readonly classicSurface = new THREE.Group();
  private readonly toySurface = new THREE.Group();
  private readonly northPole = new NorthPole();
  private readonly curvedToyEdges: THREE.LineSegments;
  private readonly paintedEdges: LineSegments2;
  private readonly ambient = new THREE.AmbientLight(0x91b7dd, 1.25);
  private readonly light = new THREE.DirectionalLight(0xc6e8ff, 1.8);
  private readonly fill = new THREE.DirectionalLight(0xc4b5ff, 0.8);
  private readonly toyPlanet = createFacetedPlanet(topology.vertices.map(p => vector(p)), topology.faces, DEFAULT_APPEARANCE.planet);
  private readonly planetMaterials = new PlanetMaterials();
  private readonly themeAtmosphere = new ThemeAtmosphere();
  private readonly sceneryBounds = new WeakMap<THREE.Object3D, THREE.Sphere>();
  private readonly sceneryObstacles: THREE.Sphere[] = [];
  private readonly sceneryBufferSize = new THREE.Vector2();
  private appearance: Appearance = { ...DEFAULT_APPEARANCE, style: 'classic' };
  private readonly connections = new THREE.Group();
  private readonly previews = new THREE.Group();
  private readonly slots: THREE.Mesh[] = [];
  private readonly pieces = new Map<string, PieceVisual>();
  private readonly motions = new Map<string, Motion>();
  private readonly pulses: Pulse[] = [];
  private readonly travels = new Map<string, Travel>();
  private readonly sparks = new StrutSparkModel();
  private readonly sparkVisual = new StrutSparkRenderer();
  private readonly gates=new SparkGateRenderer();
  private junction:number|null=null;
  private keyboardGate:string|null=null;
  private readonly keyboardGateRing=new THREE.Mesh(new THREE.RingGeometry(.045,.05,32),new THREE.MeshBasicMaterial({color:'#ffd35b',side:THREE.DoubleSide,depthWrite:false}));
  private gateGesture:{pointer:number;vertex:number;exit:number;x:number;y:number;moved:boolean}|null=null;
  private hoverPoint: { x: number; y: number } | null = null;
  private sparkStats = { pending: 0, visible: 0, merged: 0,logical:0,hidden:0 };
  private routeStats: { journeys: number; heads: unknown[]; recentHits: unknown[] } = { journeys: 0, heads: [], recentHits: [] };
  private glowPaths = 0;
  private readonly highlight: THREE.Mesh;
  private readonly stackGuide = new InstrumentStackGuide();
  private readonly resizeObserver: ResizeObserver;
  private readonly preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private scene: Scene = emptyScene();
  private selected: string | null = null;
  private tool: Piece['kind'] | null = null;
  private moveIntent: string | null = null;
  private trash: HTMLElement | null = null;
  private drag: Drag | null = null;
  private cameraTap: { pointer: number; x: number; y: number; moved: boolean } | null = null;
  private cameraPointers = new Map<number, string>();
  private slowRotate = false;
  private rotationTime: number | null = null;
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
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'Bongo Planet sphere with a floating North Pole marker. Click gates to toggle them. Arrow keys choose a gate; Enter toggles it. Choose an instrument, then tap an open slot or the glow above an instrument to build a chord of up to four layers. Drag a layer to move it; drag empty space to orbit.');
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.tabIndex=0;
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.display = 'block';
    this.container.append(this.renderer.domElement);
    this.camera.position.set(0.3, 0.26, 3.5);
    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.staticMoving = true;
    this.controls.noPan = true;
    this.controls.keys = ['', '', ''];
    this.controls.rotateSpeed = 2;
    this.controls.zoomSpeed = 0.7;
    this.light.position.set(-2, 3, 4);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(1024, 1024);
    Object.assign(this.light.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 0.1, far: 12 });
    this.light.shadow.normalBias = 0.018;
    this.fill.position.set(3, -1, 2);
    this.fill.visible = false;
    for (const light of [this.ambient, this.light, this.fill]) light.layers.enable(SCENERY_FOCUS_LAYER);
    this.world.add(this.ambient, this.light, this.fill, this.classicSurface, this.toySurface, this.northPole, this.themeAtmosphere);
    protectFromScenery(this.northPole);
    this.classicSurface.add(new THREE.Mesh(new THREE.SphereGeometry(0.993, 64, 48), new THREE.MeshPhongMaterial({ color: 0x091924, shininess: 35, specular: 0x183542 })));
    this.toySurface.add(this.toyPlanet);
    this.toySurface.visible = false;
    const edgePoints = topology.edges.flatMap(([a, b]) => {
      const points = strutPoints(a, b);
      return points.slice(1).flatMap((p, i) => [new THREE.Vector3(...points[i]), new THREE.Vector3(...p)]);
    });
    const edges = new THREE.BufferGeometry().setFromPoints(edgePoints);
    this.classicSurface.add(new THREE.LineSegments(edges, lineMaterial(0x6ea4bb, 0.22)));
    this.curvedToyEdges = new THREE.LineSegments(edges.clone(), lineMaterial(0xb5bfff, 0.45));
    const seamPoints = topology.edges.flatMap(([a, b]) => strutPoints(a, b, 'seams').map(p => new THREE.Vector3(...p)));
    this.paintedEdges = new LineSegments2(new LineSegmentsGeometry().setPositions(seamPoints.flatMap(p => p.toArray())), new LineMaterial({ color: 0xc3b8ff, linewidth: 1.6, transparent: true, opacity: 0.85, depthWrite: false }));
    this.toySurface.add(this.curvedToyEdges, this.paintedEdges);
    const backMaterial = lineMaterial(0x6ea4bb, 0.035);
    backMaterial.depthTest = false;
    this.classicSurface.add(new THREE.LineSegments(edges.clone(), backMaterial));
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
    this.keyboardGateRing.visible=false;
    this.world.add(this.highlight, this.stackGuide, this.connections, this.previews, this.sparkVisual,this.gates,this.keyboardGateRing);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(container);
    this.resize();
    // Capture before camera controls receive a pointer: pieces and camera never share ownership.
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
    this.keyboardGate=null;this.keyboardGateRing.visible=false;
    if ((scene.settings.propagation ?? 'radial') !== (this.scene.settings.propagation ?? 'radial')) this.clearEvents();
    const time = performance.now() / 1000;
    for (const [id, visual] of this.pieces) {
      if (!scene.pieces.some(p => p.id === id && p.kind === this.scene.pieces.find(old => old.id === id)?.kind && (p.kind !== 'note' || p.instrument === (this.scene.pieces.find(old => old.id === id) as Extract<Piece,{kind:'note'}>)?.instrument))) {
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
          const trail = this.arc(from, topology.vertices[piece.vertex], this.color(piece.kind), 0.5);
          trail.visible = !this.reducedMotion && this.appearance.pulseEffects === 'legacy';
          this.world.add(trail);
          this.motions.set(piece.id, { from, to: topology.vertices[piece.vertex], start: time, trail });
          existing.vertex = piece.vertex;
        }
      } else {
        const visual = this.createPiece(piece.kind, piece.kind === 'note' ? piece.instrument : undefined);
        visual.vertex = piece.vertex;
        visual.placed = time;
        visual.layer = piecesAt(scene, piece.vertex).findIndex(p => p.id === piece.id);
        this.orient(visual.group, topology.vertices[piece.vertex]);
        visual.group.position.copy(this.stackPoint(topology.vertices[piece.vertex], visual.layer));
        this.pieces.set(piece.id, visual);
        this.world.add(visual.group);
      }
    }
    this.scene = scene;
    this.syncGates();
    this.sparks.setScene(scene, this.now());
    this.previewSignature = null;
    for (let i = this.pulses.length - 1; i >= 0; i--) if (!this.pieces.has(this.pulses[i].generatorId)) {
      this.destroy(this.pulses[i].line); this.pulses.splice(i, 1);
    }
    if (this.selected && !this.pieces.has(this.selected)) this.selected = null;
    if (this.moveIntent && !this.pieces.has(this.moveIntent)) this.moveIntent = null;
    if (this.drag?.id && !this.pieces.has(this.drag.id)) this.cancelDrag();
    this.buildConnections();
    this.updateSelection();
    this.lastFrame = -Infinity;
  }

  setSelected(id: string | null) { this.selected = id;if(id)this.junction=this.scene.pieces.find(p=>p.id===id)?.vertex??null;this.syncGates();this.updateSelection(); }
  setJunction(vertex:number|null){this.junction=vertex;if(vertex!==null&&!this.scene.pieces.some(p=>p.id===this.selected&&p.vertex===vertex))this.selected=null;this.syncGates();this.updateSelection();}
  private syncGates(){this.gates.setScene(this.scene,this.selected?this.scene.pieces.find(p=>p.id===this.selected)?.vertex??this.junction:this.junction,performance.now()/1000);this.gates.setLook(this.appearance.switches);}
  getProjectedGates(pointer?: { x: number; y: number; radius: number }):ProjectedGate[]{
    const rect=this.renderer.domElement.getBoundingClientRect();this.camera.updateMatrixWorld();
    const direction=this.camera.position.clone().sub(this.controls.target).normalize().toArray();
    const raycaster=new THREE.Raycaster(),occluders:THREE.Object3D[]=[this.toyPlanet,...[...this.pieces.values()].map(p=>p.group)];
    return this.gates.marks.map(mark=>{
      const point=new THREE.Vector3(...mark.point);const projected=point.clone().project(this.camera);
      let visible=gateFacesCamera(mark,direction)&&projected.z<1&&projected.z>-1;
      const x=rect.left+(projected.x+1)*rect.width/2,y=rect.top+(1-projected.y)*rect.height/2;
      // Hover only needs occlusion checks for gates inside the existing click target.
      if(pointer&&Math.hypot(x-pointer.x,y-pointer.y)>pointer.radius)visible=false;
      if(visible){raycaster.setFromCamera(new THREE.Vector2(projected.x,projected.y),this.camera);const hit=raycaster.intersectObjects(occluders,true)[0];if(hit&&hit.distance<raycaster.ray.origin.distanceTo(point)-.004)visible=false;}
      return {id:mark.id,vertex:mark.vertex,exit:mark.exit,on:mark.on,selected:mark.selected,x,y,visible};
    });
  }
  private gateAt(x: number, y: number, touch = false): ProjectedGate | null {
    if (this.moveIntent || !this.callbacks.toggleGate) return null;
    if (this.tool && this.stackSlotAt(x, y, this.tool, null, touch)) return null;
    const gate = pickGate(this.getProjectedGates({ x, y, radius: touch ? 22 : 12 }), x, y, touch);
    if (!gate) return null;
    const mark = this.gates.marks.find(mark=>mark.id===gate.id)!;
    const depth = new THREE.Vector3(...mark.point).sub(this.camera.position).dot(this.camera.getWorldDirection(new THREE.Vector3()));
    if (this.pieceAt(x,y,false,true,depth-.004)) return null;
    const vertex = this.nearest(x, y, touch), slot = vertex === null ? null : this.getProjectedSlots()[vertex];
    return slot && Math.hypot(x - slot.x, y - slot.y) < Math.hypot(x - gate.x, y - gate.y) ? null : gate;
  }
  private updateGateHover(): ProjectedGate | null {
    if (this.drag || this.gateGesture || this.cameraPointers.size) { this.gates.setHovered(null); return null; }
    if (this.hoverPoint) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      if (this.hoverPoint.x < rect.left || this.hoverPoint.x > rect.right || this.hoverPoint.y < rect.top || this.hoverPoint.y > rect.bottom) this.hoverPoint = null;
    }
    const gate = this.hoverPoint ? this.gateAt(this.hoverPoint.x, this.hoverPoint.y) : null;
    this.gates.setHovered(gate?.id ?? null);
    this.renderer.domElement.style.cursor = gate ? 'pointer' : this.tool || this.moveIntent ? 'crosshair' : 'grab';
    return gate;
  }
  getAppearance(): Appearance { return structuredClone(this.appearance); }
  setAppearance(value: Appearance) {
    const next = validateAppearance(value);
    if (JSON.stringify(next) === JSON.stringify(this.appearance)) return;
    if(JSON.stringify({...next,switches:this.appearance.switches,sparkStyle:this.appearance.sparkStyle})===JSON.stringify(this.appearance)){this.appearance=next;this.gates.setLook(next.switches);return;}
    this.cancelDrag();
    const effectsChanged = this.appearance.pulseEffects !== next.pulseEffects;
    this.appearance = next;
    this.gates.setLook(next.switches);
    if (effectsChanged) this.clearLegacyEvents();
    const toys = next.style === 'toys';
    this.classicSurface.visible = !toys;
    this.toySurface.visible = toys;
    this.curvedToyEdges.visible = next.surface === 'curved';
    this.paintedEdges.visible = next.surface === 'seams';
    this.sparks.setSurface(this.surface());
    this.renderer.shadowMap.enabled = toys;
    this.planetMaterials.apply(this.toyPlanet.material, next.planet, next.planetFinish);
    const planetColor=new THREE.Color(next.planet);
    const luminance=0.2126*planetColor.r+0.7152*planetColor.g+0.0722*planetColor.b;
    this.paintedEdges.material.color.copy(next.gridColor ? new THREE.Color(next.gridColor) : luminance>0.4?planetColor.clone().lerp(new THREE.Color('#344362'),0.45):new THREE.Color('#c3b8ff'));
    this.paintedEdges.material.opacity = next.gridOpacity;
    this.paintedEdges.material.linewidth = next.gridWidth;
    this.ambient.color.set(toys ? '#ffffff' : '#91b7dd');
    this.ambient.intensity = toys ? next.lighting * 1.2 : 1.25;
    this.light.color.set(toys ? '#fff1da' : '#c6e8ff');
    this.light.intensity = toys ? next.lighting * 3 : 1.8;
    this.fill.visible = toys;
    this.fill.intensity = next.lighting * 0.65;
    const theme = next.theme;
    this.themeAtmosphere.apply(theme);
    this.world.fog = theme?.atmosphere.fog ? new THREE.Fog(theme.atmosphere.haze, theme.atmosphere.fogNear, theme.atmosphere.fogFar) : null;
    this.light.position.set(...(theme?.lights.keyPosition ?? [-2, 3, 4] as const));
    this.fill.position.set(...(theme?.lights.fillPosition ?? [3, -1, 2] as const));
    this.fill.color.set(theme?.lights.fill ?? '#c4b5ff');
    this.light.shadow.intensity = theme?.shadows.strength ?? 1;
    this.light.shadow.radius = theme?.shadows.softness ?? 1;
    if (theme) {
      this.ambient.color.set(theme.lights.ambient);
      this.ambient.intensity = next.lighting * theme.lights.ambientPower;
      this.light.color.set(theme.lights.key);
      this.light.intensity = next.lighting * theme.lights.keyPower;
      this.fill.intensity = next.lighting * theme.lights.fillPower;
    }
    for (const [id, old] of this.pieces) {
      const piece = this.scene.pieces.find(p => p.id === id)!;
      const replacement = this.createPiece(piece.kind, piece.kind === 'note' ? piece.instrument : undefined);
      replacement.vertex = old.vertex;
      replacement.placed = old.placed;
      replacement.layer = old.layer;
      this.destroy(old.group);
      this.pieces.set(id, replacement);
      this.world.add(replacement.group);
    }
    for (const [vertex, slot] of this.slots.entries()) {
      const material = slot.material as THREE.MeshBasicMaterial;
      material.color.set(toys ? '#fff0c7' : '#81aec2');
      material.depthTest = toys;
      const seams = toys && next.surface === 'seams';
      slot.position.copy(vector(topology.vertices[vertex], seams ? 0.99 : 1.009));
      slot.scale.setScalar(toys ? seams ? 1.25 : 1.7 : 1);
    }
    for (const pulse of this.pulses) (pulse.line.material as THREE.LineBasicMaterial).color.setHex(this.color('generator'));
    for (const travel of this.travels.values()) {
      if (travel.glow) { this.destroy(travel.glow); this.glowPaths--; }
      travel.glow = undefined; travel.bead = undefined;
      (travel.line.material as THREE.LineBasicMaterial).color.setHex(this.color(this.scene.pieces.find(p => p.id === travel.trigger.nodeId)?.kind ?? 'note'));
      if (toys) this.decorateTravel(travel);
    }
    this.clearPreview();
    this.resize();
    this.lastFrame = -Infinity;
  }
  private color(kind: Piece['kind']) { return this.appearance.style === 'toys' ? new THREE.Color(this.appearance[kind]).getHex() : COLORS[kind]; }
  private surface(): Surface { return this.appearance.style === 'toys' ? this.appearance.surface : 'curved'; }
  private get routeMode() { return this.scene.settings.propagation === 'routes'||this.scene.version===2; }
  setTool(kind: Piece['kind'] | null) { this.moveIntent = null; this.tool = kind; this.clearPreview(); this.renderer.domElement.style.cursor = kind ? 'crosshair' : 'grab'; }
  setMoveIntent(id: string | null) { this.setTool(null); this.moveIntent = id; this.renderer.domElement.style.cursor = id ? 'crosshair' : 'grab'; }
  setTrashTarget(element: HTMLElement) { this.trash = element; }
  setSlowRotate(active: boolean) { this.slowRotate = active; this.rotationTime = null; }
  resetView() {
    this.setSlowRotate(false);
    this.cancelDrag();
    this.controls.update();
    this.controls.reset();
    this.camera.updateMatrixWorld();
    this.lastFrame = -Infinity;
  }
  resetInteraction() { this.clearPlayback();this.cancelDrag();this.junction=null; this.setTool(null); this.setSelected(null); }
  clearPlayback(){this.clearEvents();this.gates.clearPassages();this.sparkVisual.update([],this.color('generator'),1,this.reducedMotion,this.appearance.sparkStyle);this.lastFrame=-Infinity;}
  setFPS(fps: number) { this.fps = Math.max(1, Math.min(120, Number.isFinite(fps) ? fps : 60)); }
  setClock(now: () => number) {
    // Musical feedback uses output time; placement/movement use monotonic presentation time.
    this.now = now;
    this.lastFrame = -Infinity;
  }

  event(event: EngineEvent) {
    if(event.type==='arrival')this.gates.passage(event.vertex,event.time);
    this.sparks.event(event, this.scene);
    if (event.type === 'reset') { this.clearEvents(); return; }
    if (this.routeMode || this.appearance.pulseEffects === 'struts' || event.type === 'route' || event.type === 'route-stop'||event.type==='edge'||event.type==='arrival'||event.type==='edge-stop'||event.type==='edit-accepted') return;
    if (event.type === 'cancel') {
      for (const [id, travel] of this.travels) if (event.ids.includes(id) || event.nodeIds.includes(travel.trigger.nodeId) || event.nodeIds.includes(travel.trigger.generatorId)) {
        this.destroyTravel(travel); this.travels.delete(id);
      }
      return;
    }
    if (event.type === 'emission') {
      const generator = this.scene.pieces.find(p => p.id === event.generatorId);
      if (!generator || generator.kind !== 'generator') return;
      const line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial(this.color('generator'), 0.7));
      this.world.add(line);
      this.pulses.push({ ...event, source: [...topology.vertices[event.sourceVertex ?? generator.vertex]], travel: typeof generator.travel==='number'?generator.travel:this.scene.settings.travel, line });
      return;
    }
    if(event.type!=='trigger'&&event.type!=='onset')return;
    const trigger = event.trigger;
    if (this.travels.has(trigger.id)) return;
    const generator = this.scene.pieces.find(p => p.id === trigger.generatorId);
    const source = generator ? [...topology.vertices[generator.vertex]] as Vec3 : trigger.position;
    const target = [...trigger.position] as Vec3;
    const line = this.arc(source, target, this.color(this.scene.pieces.find(p => p.id === trigger.nodeId)?.kind ?? 'note'), 0);
    this.world.add(line);
    const travel: Travel = { trigger, source, target, line };
    if (this.appearance.style === 'toys') this.decorateTravel(travel);
    this.travels.set(trigger.id, travel);
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
      const front = this.frontFacing(p, 0.03);
      p.project(this.camera);
      return { vertex, x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2, visible: front && Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && p.z < 1 };
    });
  }

  /** Presented layers and next slots share these positions with picking and drawing. */
  getProjectedPieces() {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.camera.updateMatrixWorld();
    return this.scene.pieces.map(piece => {
      const visual = this.pieces.get(piece.id)!;
      const point = visual.group.position.clone().project(this.camera);
      return {id: piece.id, vertex: piece.vertex, layer: piecesAt(this.scene, piece.vertex).findIndex(p => p.id === piece.id), x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2, visible: this.frontFacing(vector(topology.vertices[piece.vertex]), .03) && Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && point.z < 1};
    });
  }

  getProjectedStackSlots(kind: Piece['kind'] = 'note', id: string | null = null) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.camera.updateMatrixWorld();
    return topology.vertices.flatMap((point, vertex) => {
      const stack = piecesAt(this.scene, vertex, id ?? undefined);
      if (!stack.length || !canPlacePiece(this.scene, kind, vertex, id) || !this.frontFacing(vector(point), .03)) return [];
      const size = this.appearance.style === 'toys' ? this.appearance.size : 1;
      const position = this.stackPoint(point, stack.length).addScaledVector(vector(point),STACK_SLOT_CENTER*size).project(this.camera);
      return [{vertex, layer: stack.length, x: rect.left + (position.x + 1) * rect.width / 2, y: rect.top + (1 - position.y) * rect.height / 2, visible: Math.abs(position.x) <= 1 && Math.abs(position.y) <= 1 && position.z < 1}];
    });
  }

  getDiagnostics() {
    return { renderer: 'WebGL2', fpsLimit: this.fps, frames: this.frameCount, reducedMotion: this.reducedMotion, contextLost: this.contextLost, dragging: this.drag?.id ?? (this.drag ? this.drag.kind : null), selected: this.selected, tool: this.tool, moveIntent: this.moveIntent, destination: this.drag?.vertex ?? this.previewVertex, stackGuide:this.stackGuide.diagnostics, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures, camera: this.camera.position.toArray(), cameraUp: this.camera.up.toArray(), cameraQuaternion: this.camera.quaternion.toArray(), projection: 'orthographic', cameraType: this.camera.type, cameraFov: null, cameraZoom: this.camera.zoom, slowRotate: this.slowRotate, movingPieces: this.motions.size, visualTime: this.now(), surface: this.surface(), propagation: this.scene.settings.propagation ?? 'radial', pulseEffects: this.appearance.pulseEffects, junction:this.junction,switches:this.gates.diagnostics,sparks: this.sparkStats, routes: this.routeStats, expandingRings: this.pulses.length, curvedPaths: this.travels.size };
  }

  dispose() {
    this.themeAtmosphere.dispose();
    this.gates.dispose();
    this.sparkVisual.dispose();
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
    this.planetMaterials.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  paletteInstrument?: Instrument;
  private createPiece(kind: Piece['kind'], instrument?: Instrument): PieceVisual {
    if (this.appearance.style === 'toys') {
      const toy = createToy(kind, this.appearance, instrument);
      protectFromScenery(toy.group);
      return { group: toy.group, material: toy.material, halo: toy.halo, vertex: 0, placed: -Infinity, layer: 0 };
    }
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: COLORS[kind], transparent: true, depthTest: false, depthWrite: false });
    const geometry = kind === 'generator' ? new THREE.TorusGeometry(0.043, 0.009, 12, 40) : kind === 'note' ? new THREE.SphereGeometry(0.035, 18, 14) : new THREE.OctahedronGeometry(0.046);
    group.add(new THREE.Mesh(geometry, material));
    if (kind === 'generator') group.add(new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), material));
    const haloMaterial = new THREE.MeshBasicMaterial({ color: COLORS[kind], transparent: true, opacity: 0.13, depthTest: false, depthWrite: false });
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.057, 0.075, 48), haloMaterial);
    group.add(halo);
    protectFromScenery(group);
    return { group, material, halo, vertex: 0, placed: -Infinity, layer: 0 };
  }

  private decorateTravel(travel: Travel) {
    // Dense arrangements retain all timing feedback with lightweight lines.
    if (this.glowPaths >= 64) return;
    const color = this.color(this.scene.pieces.find(p => p.id === travel.trigger.nodeId)?.kind ?? 'note');
    const group = new THREE.Group();
    const points = surfaceArc(travel.source, travel.target, 40, 1.018).map(p => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(points);
    for (const [radius, opacity] of [[0.005, 0.9], [0.015, 0.16]]) {
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 4, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
      mesh.userData.baseOpacity = opacity;
      group.add(mesh);
    }
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45), transparent: true, depthWrite: false }));
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.037, 10, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }));
    bead.add(aura);
    group.add(bead);
    travel.line.add(group);
    travel.glow = group; travel.bead = bead;
    this.glowPaths++;
  }
  private destroyTravel(travel: Travel) {
    if (travel.glow) this.glowPaths--;
    this.destroy(travel.line);
  }

  private arc(a: Vec3, b: Vec3, color: number, opacity: number) {
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(surfaceArc(a, b, 48, 1).map(p => new THREE.Vector3(...p))), lineMaterial(color, opacity));
  }

  private buildConnections() {
    this.clearGroup(this.connections);
    if(this.scene.version===2){this.syncGates();return;}
    if (this.routeMode) {
      const selected = this.scene.pieces.find(p => p.id === this.selected);
      if (!selected) return;
      for (const generator of this.scene.pieces) if (generator.kind === 'generator' && generator.enabled && (selected.kind !== 'generator' || generator.id === selected.id)) {
        for (const plan of routesForGenerator(generator)) if (selected.kind === 'generator' || plan.vertices.includes(selected.vertex)) this.connections.add(this.routeLine(plan.vertices, 0.25));
      }
      return;
    }
    if (this.appearance.pulseEffects === 'struts') return;
    for (const generator of this.scene.pieces) if (generator.kind === 'generator' && generator.enabled) {
      for (const target of this.scene.pieces) if (target.kind !== 'generator' && angle(topology.vertices[generator.vertex], topology.vertices[target.vertex]) <= generator.reach * Math.PI / 180 + 1e-9) {
        this.connections.add(this.arc(topology.vertices[generator.vertex], topology.vertices[target.vertex], this.color(target.kind), generator.id === this.selected || target.id === this.selected ? 0.35 : 0.13));
      }
    }
  }
  private routeLine(vertices: number[], opacity: number) {
    const path = routeThrough(vertices, this.surface());
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(path.points.map(p => new THREE.Vector3(...p))), lineMaterial(this.color('generator'), opacity));
  }

  private position(id: string, time: number): Vec3 | undefined {
    const motion = this.motions.get(id);
    if (motion) {
      const t = Math.max(0, Math.min(1, (time - motion.start) / 0.12));
      motion.trail.visible = !this.reducedMotion && this.appearance.pulseEffects === 'legacy';
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

  private stackPoint(point: Vec3, layer: number) {
    const size = this.appearance.style === 'toys' ? this.appearance.size : 1;
    return vector(point, STACK_BASE_RADIUS + layer * STACK_SPACING * size);
  }

  private previewLayer(vertex: number, id: string | null) {
    const stack = piecesAt(this.scene, vertex);
    const existing = stack.findIndex(p => p.id === id);
    return existing >= 0 ? existing : stack.length;
  }

  private updateSelection() {
    if (this.drag || this.previewVertex !== null) return;
    const piece = this.scene.pieces.find(p => p.id === this.selected);
    this.highlight.visible = !!piece;
    this.highlight.scale.setScalar(1);
    if (piece) {
      this.orient(this.highlight, topology.vertices[piece.vertex], 1.038);
      this.highlight.position.copy(this.stackPoint(topology.vertices[piece.vertex], piecesAt(this.scene, piece.vertex).findIndex(p => p.id === piece.id)));
      (this.highlight.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
    }
    this.buildConnections();
  }

  private fieldOfView(base: number, aspect: number) {
    return this.appearance.style === 'toys'
      ? 2 * Math.atan(Math.tan(base * Math.PI / 360) / Math.min(1, aspect)) * 180 / Math.PI
      : base;
  }

  private frontFacing(point: THREE.Vector3, margin = 0) {
    const toCamera = this.camera.position.clone().sub(this.controls.target).normalize();
    return point.dot(toCamera) > margin;
  }

  private resize = () => {
    const width = Math.max(1, this.container.clientWidth), height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    const aspect = width / height;
    // Fit the globe and floating pole, including when rotation brings north to either side.
    const halfHeight = Math.max(1.4 / Math.min(1, aspect), Math.sqrt(CAMERA_DISTANCE ** 2 - 1) * Math.tan(this.fieldOfView(CAMERA_FOV, aspect) * Math.PI / 360));
    Object.assign(this.camera, { left: -halfHeight * aspect, right: halfHeight * aspect, top: halfHeight, bottom: -halfHeight });
    this.controls.minZoom = Math.sqrt((CAMERA_DISTANCE ** 2 - 1) / (MAX_CAMERA_DISTANCE ** 2 - 1));
    this.controls.maxZoom = Math.sqrt((CAMERA_DISTANCE ** 2 - 1) / (MIN_CAMERA_DISTANCE ** 2 - 1));
    this.camera.updateProjectionMatrix();
    this.controls.handleResize();
    this.lastFrame = -Infinity;
  };

  private animate = (wallTime: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    if (wallTime - this.lastFrame < 1000 / this.fps - 0.5 || this.contextLost) return;
    this.lastFrame = wallTime;
    const elapsed = this.rotationTime === null ? 0 : Math.min(1, Math.max(0, (wallTime - this.rotationTime) / 1000));
    this.rotationTime = wallTime;
    if (this.slowRotate && this.controls.enabled && !this.drag && !this.gateGesture && !this.cameraPointers.size && !document.hidden) {
      // Orbit the camera around its current up vector, preserving the globe's tilt.
      // Use presentation time so rotation also works with music paused.
      this.camera.position.sub(this.controls.target)
        .applyAxisAngle(this.camera.up.clone().normalize(), elapsed * SLOW_ROTATION_SPEED)
        .add(this.controls.target);
    }
    if (!this.drag) this.controls.update();
    this.updateGateHover();
    const time = this.now();
    const gatePixelSize=(this.camera.top-this.camera.bottom)/(this.camera.zoom*Math.max(1,this.container.clientHeight));
    this.gates.update(time,this.reducedMotion,wallTime/1000,this.camera.position.clone().sub(this.controls.target).normalize(),gatePixelSize);
    const sparkFrame = this.sparks.frame(time);
    const coordinated = this.routeMode || this.appearance.pulseEffects === 'struts';
    this.sparkVisual.update(coordinated ? sparkFrame.sparks : [], this.color('generator'), 1, this.reducedMotion, this.appearance.sparkStyle, this.camera.quaternion, this.appearance.theme?.sparks);
    const visible=coordinated&&this.sparkVisual.visible?sparkFrame.sparks.length:0;
    this.sparkStats = { pending: sparkFrame.pending, visible, merged: sparkFrame.merged,logical:sparkFrame.logical,hidden:Math.max(0,sparkFrame.logical-visible) };
    this.routeStats = { journeys: sparkFrame.journeys, heads: sparkFrame.heads, recentHits: sparkFrame.recentHits };
    const flashes = coordinated ? sparkFrame.flashes : new Map<string, number>();
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
      const layer = piecesAt(this.scene, visual.vertex).findIndex(piece => piece.id === id);
      visual.layer = this.reducedMotion ? layer : visual.layer + (layer - visual.layer) * Math.min(1, elapsed / .12);
      visual.group.position.copy(this.stackPoint(p, visual.layer));
      const facing = this.frontFacing(vector(p));
      const piece = this.scene.pieces.find(piece => piece.id === id)!;
      const disabled = piece.kind === 'generator' && !piece.enabled;
      const glow = Math.min(1, flashes.get(id) ?? 0);
      visual.material.opacity = facing ? (disabled ? 0.35 : 1) : 0.12;
      visual.material.color.setHex(this.appearance.style === 'toys' && piece.kind === 'note' && piece.instrument ? new THREE.Color(this.appearance[piece.instrument]).getHex() : this.color(piece.kind)).lerp(new THREE.Color(0xffffff), glow * (this.appearance.style === 'toys' ? 0.25 : 0.8));
      const toys = this.appearance.style === 'toys';
      const still = this.reducedMotion || (toys && !this.appearance.bounce);
      const motion = this.appearance.theme?.motion;
      const settle = still ? 0 : Math.max(0, 1 - (performance.now() / 1000 - visual.placed) / (motion?.settle ?? .18));
      const scale = still ? 1 : 1 + glow * 0.35 + Math.sin(settle * Math.PI) * 0.2;
      if (toys) {
        const size = this.appearance.size;
        const hit = still ? 0 : glow;
        visual.group.scale.set(size * (1 + hit * (motion?.squash ?? .15)), size * (1 + hit * (piece.kind === 'beat' ? -(motion?.squash ?? .18) : (motion?.stretch ?? .3))), size * (1 + hit * .12 + Math.sin(settle * Math.PI) * (motion?.bounce ?? .15)));
        if (motion && !still) visual.group.rotateZ(Math.sin((1-glow)*Math.PI*3)*glow*motion.wobble);
        (visual.material as THREE.MeshStandardMaterial).emissiveIntensity = glow * this.appearance.glow * (motion?.glow ?? .3);
      } else visual.group.scale.setScalar(scale);
      visual.halo.material.opacity = facing ? (this.stackGuide.visible && piece.vertex === this.stackGuide.vertex ? id === this.selected ? .12 : 0 : id === this.selected ? 0.65 : toys ? this.surface() === 'seams' ? 0 : glow * 0.3 : 0.15 + glow * 0.5) : 0.03;
    }
    this.slots.forEach((slot, vertex) => {
      const p = vector(topology.vertices[vertex]);
      const front = this.frontFacing(p);
      const occupied = this.scene.pieces.some(piece => piece.vertex === vertex);
      (slot.material as THREE.MeshBasicMaterial).opacity = front ? (occupied ? 0.1 : this.appearance.style === 'toys' ? 1 : 0.65) : 0.055;
    });
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i], elapsed = time - pulse.time;
      const reach = pulse.reach * Math.PI / 180;
      const theta = Math.PI * Math.max(0, elapsed) / (pulse.periodSeconds * pulse.travel);
      if (elapsed > Math.max(0.25, pulse.periodSeconds * pulse.travel * reach / Math.PI) + 0.12) {
        this.destroy(pulse.line); this.pulses.splice(i, 1); continue;
      }
      pulse.line.visible = !this.reducedMotion && elapsed >= 0 && theta <= reach && (this.appearance.style === 'classic' || this.appearance.glow > 0);
      if (pulse.line.visible) {
        pulse.line.geometry.dispose();
        pulse.line.geometry = new THREE.BufferGeometry().setFromPoints(wavefront(pulse.source, theta).map(p => new THREE.Vector3(...p)));
        (pulse.line.material as THREE.LineBasicMaterial).opacity = 0.65 * (1 - Math.min(1, theta / Math.PI) * 0.6) * (this.appearance.style === 'toys' ? this.appearance.glow : 1);
      }
    }
    for (const [id, travel] of this.travels) {
      const elapsed = time - travel.trigger.onset;
      if (elapsed > 1) { this.destroyTravel(travel); this.travels.delete(id); continue; }
      const material = travel.line.material as THREE.LineBasicMaterial;
      material.opacity = time < travel.trigger.emission ? 0 : elapsed < 0 ? 0.55 : Math.exp(-elapsed / 0.18) * 0.6;
      if (travel.glow && travel.bead) {
        const opacity = time < travel.trigger.emission ? 0 : elapsed < 0 ? 1 : Math.exp(-elapsed / 0.18);
        material.opacity = 0;
        travel.glow.visible = opacity > 0.005 && this.appearance.glow > 0;
        for (const child of travel.glow.children) {
          if (child === travel.bead) continue;
          (child as THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>).material.opacity = child.userData.baseOpacity * opacity * this.appearance.glow;
        }
        const duration = travel.trigger.onset - travel.trigger.emission;
        const t = duration > 0 ? Math.max(0, Math.min(1, (time - travel.trigger.emission) / duration)) : 1;
        travel.bead.position.copy(vector(surfacePoint(travel.source, travel.target, t), 1.03));
        travel.bead.visible = !this.reducedMotion;
        (travel.bead.material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    }
    if (this.selected && !this.drag && this.previewVertex === null) {
      const p = this.position(this.selected, wallTime / 1000);
      if (p) { this.orient(this.highlight, p, 1.04); this.highlight.position.copy(this.pieces.get(this.selected)!.group.position); }
    }
    if (this.previewVertex !== null) this.positionPreview(this.previewVertex, this.drag?.id ?? this.moveIntent);
    this.themeAtmosphere.tick(wallTime / 1000, this.reducedMotion, this.camera.quaternion, this.sceneryClearance());
    this.drawWorld();
    this.frameCount++;
  };

  private drawWorld() {
    this.themeAtmosphere.renderMask(this.renderer, this.world, this.camera);
    const clear = this.renderer.autoClear;
    try {
      if (this.themeAtmosphere.renderBackground(this.renderer, this.world, this.camera)) this.renderer.autoClear = false;
      this.renderer.render(this.world, this.camera);
    } finally { this.renderer.autoClear = clear; }
  }

  private sceneryClearance() {
    if (!this.themeAtmosphere.hasScenery) return undefined;
    this.world.updateMatrixWorld(true);
    this.camera.updateMatrixWorld();
    const objects: THREE.Object3D[] = [this.northPole, ...[...this.pieces.values()].map(piece => piece.group)];
    if (this.ghost?.visible) objects.push(this.ghost);
    let count = 0;
    for (const object of objects) {
      let bounds = this.sceneryBounds.get(object);
      if (!bounds) {
        const inverse = object.matrixWorld.clone().invert(), box = new THREE.Box3();
        object.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
            const transform = new THREE.Matrix4().multiplyMatrices(inverse, child.matrixWorld);
            box.union(child.geometry.boundingBox!.clone().applyMatrix4(transform));
          }
        });
        bounds = box.getBoundingSphere(new THREE.Sphere());
        this.sceneryBounds.set(object, bounds);
      }
      const sphere = this.sceneryObstacles[count] ?? (this.sceneryObstacles[count] = new THREE.Sphere());
      sphere.copy(bounds).applyMatrix4(object.matrixWorld);
      sphere.center.applyMatrix4(this.camera.matrixWorldInverse);
      count++;
    }
    return { camera: this.camera, foreground: this.sceneryObstacles.slice(0, count), viewportHeight: this.container.clientHeight, bufferSize: this.renderer.getDrawingBufferSize(this.sceneryBufferSize) };
  }

  private pieceAt(x: number, y: number, touch = false, bodyOnly = false, maxDistance = Infinity): Piece | undefined {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return undefined;
    if (this.appearance.style === 'toys') {
      const bodies = [...this.pieces.entries()].filter(([, v]) => {
        const p = vector(topology.vertices[v.vertex]);
        return this.frontFacing(p, 0.03);
      }).map(([id, v]) => ({id, body: v.group.getObjectByName('Body')!}));
      const ray = new THREE.Raycaster();
      this.world.updateMatrixWorld(true);
      ray.setFromCamera(new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), this.camera);
      const hit = ray.intersectObjects(bodies.map(v => v.body), true).find(hit=>hit.distance<maxDistance);
      if (hit) return this.scene.pieces.find(p => p.id === bodies.find(v => v.body.getObjectById(hit.object.id))!.id);
    }
    if (bodyOnly) return undefined;
    const pieces = this.getProjectedPieces().filter(p => p.visible).map(p => ({...p, d: Math.hypot(x-p.x,y-p.y)})).sort((a,b)=>a.d-b.d);
    if (pieces[0]?.d <= (touch ? 20 : 12)) return this.scene.pieces.find(p => p.id === pieces[0].id);
    return undefined;
  }

  private stackSlotAt(x: number, y: number, kind: Piece['kind'], id: string | null, touch = false) {
    const slots = this.getProjectedStackSlots(kind, id).filter(p => p.visible).map(p => ({...p, d: Math.hypot(x-p.x,y-p.y)})).sort((a,b)=>a.d-b.d);
    return slots[0] && slots[0].d <= (touch ? 28 : 22) ? slots[0] : null;
  }

  private guideAt(x: number, y: number) {
    if (!this.stackGuide.visible || this.stackGuide.vertex === null || !this.frontFacing(vector(topology.vertices[this.stackGuide.vertex]),.03)) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (x<rect.left || x>rect.right || y<rect.top || y>rect.bottom) return null;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),this.camera);
    return this.stackGuide.hit(ray) === null ? null : this.stackGuide.vertex;
  }

  private nearest(x: number, y: number, touch = false, kind?: Piece['kind'], id: string | null = null) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    if (kind) { const slot = this.stackSlotAt(x, y, kind, id, touch); if (slot) return slot.vertex; }
    const piece = this.pieceAt(x, y, touch);
    if (piece) return piece.vertex;
    const guide = this.guideAt(x, y);
    if (guide !== null) return guide;
    const slots = this.getProjectedSlots().filter(p => p.visible).map(p => ({ ...p, d: Math.hypot(x - p.x, y - p.y) })).sort((a, b) => a.d - b.d);
    return slots[0] && slots[0].d <= (touch ? 35 : 25) ? slots[0].vertex : null;
  }

  private legal(vertex: number | null, id: string | null, kind: Piece['kind']) {
    return vertex !== null && canPlacePiece(this.scene, kind, vertex, id);
  }

  private pointerDown = (event: PointerEvent) => {
    this.hoverPoint = null;
    this.gates.setHovered(null);
    this.keyboardGate=null;this.keyboardGateRing.visible=false;
    if(this.gateGesture){event.preventDefault();event.stopImmediatePropagation();this.cancelDrag();return;}
    if (this.drag) {
      event.preventDefault(); event.stopImmediatePropagation(); this.cancelDrag(); return;
    }
    if (!event.isPrimary) {
      this.cameraTap = null;
      this.cameraPointers.set(event.pointerId, event.pointerType);
      return;
    }
    this.controls.handleResize();
    if (event.button !== 0) { this.cameraPointers.set(event.pointerId, event.pointerType); return; }
    const gate=this.gateAt(event.clientX,event.clientY,event.pointerType==='touch');
    if(gate){event.preventDefault();event.stopImmediatePropagation();this.gateGesture={pointer:event.pointerId,vertex:gate.vertex,exit:gate.exit,x:event.clientX,y:event.clientY,moved:false};this.controls.enabled=false;this.renderer.domElement.setPointerCapture(event.pointerId);return;}
    const body = this.pieceAt(event.clientX, event.clientY, false, true);
    const stackSlot = this.tool && !body ? this.stackSlotAt(event.clientX, event.clientY, this.tool, null, event.pointerType === 'touch') : null;
    const vertex = stackSlot?.vertex ?? this.nearest(event.clientX, event.clientY, event.pointerType === 'touch');
    const piece = body ?? this.pieceAt(event.clientX, event.clientY, event.pointerType === 'touch') ?? this.scene.pieces.find(piece => piece.vertex === vertex);
    if (this.moveIntent && vertex !== null) {
      event.preventDefault(); event.stopImmediatePropagation();
      const moving = this.scene.pieces.find(p => p.id === this.moveIntent);
      if (moving) this.startDrag(moving.kind, moving.id, event);
    } else if (stackSlot && this.tool) {
      event.preventDefault(); event.stopImmediatePropagation(); this.startDrag(this.tool, null, event);
    } else if (piece) {
      event.preventDefault(); event.stopImmediatePropagation();
      this.callbacks.select(piece.id);
      this.startDrag(piece.kind, piece.id, event);
    } else if (this.tool && vertex !== null) {
      event.preventDefault(); event.stopImmediatePropagation(); this.startDrag(this.tool, null, event);
    } else {
      this.clearPreview();
      // Deselect only for a tap; rotation belongs entirely to camera controls.
      this.cameraTap = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      this.cameraPointers.set(event.pointerId, event.pointerType);
    }
  };

  private startDrag(kind: Piece['kind'], id: string | null, event: PointerEvent) {
    this.cameraTap = null;
    this.drag = { pointer: event.pointerId, kind, id, x: event.clientX, y: event.clientY, moved: false, vertex: null };
    this.controls.enabled = false;
    this.renderer.domElement.style.cursor = 'grabbing';
    const existing = this.scene.pieces.find(p => p.id === id);
    this.ghost = this.createPiece(kind, existing?.kind === 'note' ? existing.instrument : kind === 'note' ? this.paletteInstrument : undefined).group;
    this.ghost.traverse(object => { if (object instanceof THREE.Mesh) for (const material of Array.isArray(object.material) ? object.material : [object.material]) {material.transparent=true;material.opacity=.35;material.depthWrite=false;} });
    this.world.add(this.ghost);
    this.showPreview(this.nearest(event.clientX, event.clientY, event.pointerType === 'touch', kind, id), kind, id);
    this.drag.vertex = this.previewVertex;
  }

  private pointerMove = (event: PointerEvent) => {
    if(this.gateGesture?.pointer===event.pointerId){event.preventDefault();event.stopImmediatePropagation();this.gateGesture.moved ||=Math.hypot(event.clientX-this.gateGesture.x,event.clientY-this.gateGesture.y)>5;return;}
    if (this.cameraTap?.pointer === event.pointerId) this.cameraTap.moved ||= Math.hypot(event.clientX - this.cameraTap.x, event.clientY - this.cameraTap.y) > 5;
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    event.preventDefault(); event.stopImmediatePropagation();
    this.drag.moved ||= Math.hypot(event.clientX - this.drag.x, event.clientY - this.drag.y) > 5;
    const trash = this.overTrash(event.clientX, event.clientY);
    this.trash?.classList.toggle('drop-active', trash && !!this.drag.id);
    if (trash) { this.drag.vertex = null; this.showPreview(null, this.drag.kind, this.drag.id); return; }
    const vertex = this.nearest(event.clientX, event.clientY, event.pointerType === 'touch', this.drag.kind, this.drag.id);
    this.drag.vertex = vertex;
    this.showPreview(vertex, this.drag.kind, this.drag.id);
  };

  private pointerUp = (event: PointerEvent) => {
    if(this.gateGesture?.pointer===event.pointerId){event.preventDefault();event.stopImmediatePropagation();const gesture=this.gateGesture,gate=this.gateAt(event.clientX,event.clientY,event.pointerType==='touch');this.cancelDrag();if(!gesture.moved&&gate?.vertex===gesture.vertex&&gate.exit===gesture.exit)this.callbacks.toggleGate?.(gesture.vertex,gesture.exit);this.hover(event);return;}
    this.cameraPointers.delete(event.pointerId);
    if (this.cameraTap?.pointer === event.pointerId) {
      if (!this.cameraTap.moved){const vertex=this.nearest(event.clientX,event.clientY,event.pointerType==='touch');this.callbacks.select(null);if(this.scene.version===2)this.callbacks.selectJunction?.(vertex);}
      this.cameraTap = null;
    }
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const drag = this.drag;
    const trash = this.overTrash(event.clientX, event.clientY);
    const vertex = this.nearest(event.clientX, event.clientY, event.pointerType === 'touch', drag.kind, drag.id);
    this.cancelDrag();
    if (trash) {
      if (drag.id && drag.moved) this.callbacks.remove?.(drag.id);
      return;
    }
    if (drag.id && !drag.moved && !this.moveIntent) { this.callbacks.select(drag.id); return; }
    // A palette tap may choose a tool in the UI without being a failed drop.
    if (!drag.id && !drag.moved && vertex === null) return;
    if (this.legal(vertex, drag.id, drag.kind)) {
      if (drag.id) {
        if (this.scene.pieces.find(piece => piece.id === drag.id)?.vertex !== vertex) this.callbacks.move(drag.id, vertex!);
        this.moveIntent = null;
        this.renderer.domElement.style.cursor = this.tool ? 'crosshair' : 'grab';
        this.callbacks.select(drag.id);
      } else this.callbacks.place(drag.kind, vertex!);
    } else this.callbacks.message(vertex === null ? 'Drop on a visible junction or the glow above an instrument.' : `A stack holds ${LIMITS.stack} instruments. Generators need their own junction.`);
  };

  private pointerCancel = (event: PointerEvent) => {
    if(this.gateGesture?.pointer===event.pointerId){event.preventDefault();event.stopImmediatePropagation();this.cancelDrag();return;}
    if (event.pointerId === this.cameraTap?.pointer) this.cameraTap = null;
    if (event.pointerId === this.drag?.pointer) {
      // Piece pointerdown never reached camera controls. Its cancellation belongs
      // to the piece too; camera cancellation must still reach the controls.
      event.preventDefault(); event.stopImmediatePropagation();
      this.cancelDrag();
    } else if (this.cameraPointers.has(event.pointerId)) {
      // TrackballControls only removes a cancelled pointer. Complete its release
      // path as well, so capture and document listeners cannot survive cancellation.
      this.renderer.domElement.dispatchEvent(new PointerEvent('pointerup', { pointerId: event.pointerId, pointerType: event.pointerType, bubbles: true }));
    }
  };
  private competingPointer = (event: PointerEvent) => {
    if(this.gateGesture&&event.pointerId!==this.gateGesture.pointer){event.preventDefault();event.stopImmediatePropagation();this.cancelDrag();return;}
    if (this.drag && event.pointerId !== this.drag.pointer) {
      event.preventDefault(); event.stopImmediatePropagation(); this.cancelDrag();
    }
  };
  private cancelDrag = () => {
    this.hoverPoint = null;
    this.gates.setHovered(null);
    const gate=this.gateGesture;this.gateGesture=null;if(gate&&this.renderer.domElement.hasPointerCapture(gate.pointer))this.renderer.domElement.releasePointerCapture(gate.pointer);
    this.drag = null;
    this.cameraTap = null;
    this.controls.enabled = true;
    for (const [pointerId, pointerType] of this.cameraPointers) {
      this.renderer.domElement.dispatchEvent(new PointerEvent('pointerup', { pointerId, pointerType, bubbles: true }));
      if (this.renderer.domElement.hasPointerCapture(pointerId)) this.renderer.domElement.releasePointerCapture(pointerId);
    }
    this.trash?.classList.remove('drop-active');
    if (this.ghost) { this.destroy(this.ghost); this.ghost = null; }
    this.clearPreview();
    this.renderer.domElement.style.cursor = this.tool || this.moveIntent ? 'crosshair' : 'grab';
  };

  private overTrash(x: number, y: number) {
    if (!this.trash) return false;
    const rect = this.trash.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  private hover = (event: PointerEvent) => {
    if (this.drag || this.gateGesture || this.cameraPointers.size || event.pointerType === 'touch') return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.hoverPoint = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
      ? { x: event.clientX, y: event.clientY } : null;
    if (this.updateGateHover()) { this.clearPreview(); return; }
    const moving = this.scene.pieces.find(p => p.id === this.moveIntent);
    const kind = moving?.kind ?? this.tool;
    const vertex = this.nearest(event.clientX, event.clientY, false, kind ?? undefined, moving?.id ?? null);
    if (kind) this.showPreview(vertex, kind, moving?.id ?? null);
    else {
      this.clearPreview();
      if (vertex !== null && piecesAt(this.scene,vertex).length) this.showStackGuide(vertex,null);
    }
  };
  private leave = () => { this.hoverPoint = null; this.updateGateHover(); if (!this.drag) this.clearPreview(); };

  private showPreview(vertex: number | null, kind: Piece['kind'], id: string | null) {
    const signature = `${vertex}:${kind}:${id}`;
    if (signature === this.previewSignature) return;
    this.previewSignature = signature;
    this.previewVertex = vertex;
    this.clearGroup(this.previews);
    this.stackGuide.hide();
    this.highlight.visible = vertex !== null;
    if (this.ghost) this.ghost.visible = vertex !== null;
    if (vertex === null) return;
    const legal = this.legal(vertex, id, kind);
    this.positionPreview(vertex, id);
    if (kind !== 'generator') {
      this.showStackGuide(vertex,legal ? this.previewLayer(vertex,id) : null);
      this.highlight.visible = !this.stackGuide.visible;
    }
    (this.highlight.material as THREE.MeshBasicMaterial).color.setHex(legal ? 0xffffff : 0xff7676);
    if (this.ghost) this.ghost.visible = legal && (this.drag?.moved === true || id === null);
    if (!legal) return;
    if(this.scene.version===2)return;
    const existing = this.scene.pieces.find(piece => piece.id === id);
    const reach = existing?.kind === 'generator' ? existing.reach : 90;
    if (this.routeMode) {
      if (kind === 'generator') for (const plan of generatorRoutes(vertex, reach)) this.previews.add(this.routeLine(plan.vertices, 0.4));
      else for (const generator of this.scene.pieces) if (generator.kind === 'generator' && generator.enabled) for (const plan of routesForGenerator(generator)) if (plan.vertices.includes(vertex)) this.previews.add(this.routeLine(plan.vertices, 0.4));
      return;
    }
    for (const piece of this.scene.pieces) {
      if (piece.id === id || (kind === 'generator' ? piece.kind === 'generator' : piece.kind !== 'generator')) continue;
      const source = kind === 'generator' ? topology.vertices[vertex] : topology.vertices[piece.vertex];
      const target = kind === 'generator' ? topology.vertices[piece.vertex] : topology.vertices[vertex];
      const limit = piece.kind === 'generator' ? piece.reach : reach;
      if (piece.kind === 'generator' && !piece.enabled) continue;
      if (angle(source, target) <= limit * Math.PI / 180 + 1e-9) {
        const color = this.color(kind === 'generator' ? piece.kind : kind);
        if (this.appearance.pulseEffects === 'struts') {
          const route = strutRoute(kind === 'generator' ? vertex : piece.vertex, kind === 'generator' ? piece.vertex : vertex, this.surface());
          this.previews.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(route.points.map(p => new THREE.Vector3(...p))), lineMaterial(color, 0.4)));
        } else this.previews.add(this.arc(source, target, color, 0.7));
      }
    }
  }

  private positionPreview(vertex: number, id: string | null) {
    const point = topology.vertices[vertex], layer = this.previewLayer(vertex, id);
    const position = this.stackPoint(point, layer);
    this.highlight.position.copy(position);
    this.highlight.quaternion.setFromUnitVectors(UP,vector(point).normalize());
    this.highlight.scale.setScalar(1);
    if (this.ghost) {
      this.orient(this.ghost, point);
      this.ghost.position.copy(position);
      this.ghost.scale.setScalar(this.appearance.style === 'toys' ? this.appearance.size : 1);
    }
  }

  private showStackGuide(vertex: number, nextLayer: number | null) {
    const stack = piecesAt(this.scene,vertex);
    if (stack.some(piece=>piece.kind==='generator')) { this.stackGuide.hide(); return; }
    this.stackGuide.show(vertex,vector(topology.vertices[vertex]).normalize(),stack.length,this.appearance.style==='toys'?this.appearance.size:1,nextLayer);
    this.highlight.visible = false;
  }

  private clearPreview() { this.previewVertex = null; this.previewSignature = null; this.stackGuide.hide(); this.clearGroup(this.previews); this.updateSelection(); }
  private keyDown = (event: KeyboardEvent) => {
    if(event.target===this.renderer.domElement&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key)){
      event.preventDefault();event.stopImmediatePropagation();
      const gates=this.getProjectedGates().filter(g=>g.visible),rect=this.renderer.domElement.getBoundingClientRect();
      const current=gates.find(g=>g.id===this.keyboardGate);
      if(current&&(event.key==='Enter'||event.key===' ')){
        this.callbacks.toggleGate?.(current.vertex,current.exit);
        this.focusGate({...current,on:!current.on});return;
      }
      const x=current?.x??rect.left+rect.width/2,y=current?.y??rect.top+rect.height/2;
      const candidates=current?gates.filter(g=>event.key==='ArrowRight'?g.x>x+2:event.key==='ArrowLeft'?g.x<x-2:event.key==='ArrowDown'?g.y>y+2:event.key==='ArrowUp'?g.y<y-2:false):gates;
      candidates.sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.vertex-b.vertex||a.exit-b.exit);
      if(candidates[0])this.focusGate(candidates[0]);return;
    }
    if (event.key !== 'Escape') return;
    this.keyboardGate=null;this.keyboardGateRing.visible=false;
    if (this.drag||this.gateGesture) this.cancelDrag();
    else { this.setTool(null); this.callbacks.exitTool?.(); }
  };
  private focusGate(gate:ProjectedGate){
    const mark=this.gates.marks.find(m=>m.id===gate.id);if(!mark)return;
    this.keyboardGate=gate.id;
    const normal=new THREE.Vector3(...mark.from).add(new THREE.Vector3(...mark.to)).normalize();
    this.keyboardGateRing.position.set(...mark.point).addScaledVector(normal,.004);
    this.keyboardGateRing.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
    this.keyboardGateRing.visible=true;
    this.callbacks.message(`Gate ${gate.vertex+1} → ${gate.exit+1}: ${gate.on?'on':'off'}. Enter toggles; arrow keys choose another gate.`);
  }
  private visibilityChange = () => { this.rotationTime = null; if (document.hidden) this.cancelDrag(); };
  private motionPreference = (event: MediaQueryListEvent) => { this.reducedMotion = event.matches; this.lastFrame = -Infinity; };
  private contextLoss = (event: Event) => { event.preventDefault(); this.contextLost = true; this.cancelDrag(); this.callbacks.message('The graphics context was interrupted. Music controls remain available.'); };
  private contextRestore = () => { this.contextLost = false; this.lastFrame = -Infinity; this.rotationTime = null; };
  private clearEvents() {
    this.sparks.clear();
    this.sparkVisual.update([], this.color('generator'), 0, this.reducedMotion);
    this.sparkStats = { pending: 0, visible: 0, merged: 0,logical:0,hidden:0 };
    this.routeStats = { journeys: 0, heads: [], recentHits: [] };
    this.clearLegacyEvents();
  }
  private clearLegacyEvents() {
    for (const pulse of this.pulses) this.destroy(pulse.line);
    this.pulses.length = 0;
    for (const travel of this.travels.values()) this.destroyTravel(travel);
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
