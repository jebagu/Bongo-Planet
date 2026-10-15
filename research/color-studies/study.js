import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/manrope/latin-700.css';
import './style.css';
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { topology } from '../../src/core/geometry';
import { emptyScene } from '../../src/core/contracts';
import { toRenderPoint } from '../../src/view/math';
import { strutPoints } from '../../src/view/strutRoutes';
import { createFacetedPlanet, createToy } from '../../src/view/art/toys';
import { DEFAULT_APPEARANCE } from '../../src/view/art/appearance';
import { createPlanetGrainTexture, createClayReliefTexture } from '../../src/view/art/planetMaterials';
import { starPoints } from '../../src/view/art/swatches';
import { SparkGateRenderer } from '../../src/view/SparkGateRenderer';
import { COMBOS, FINISHES, ORIGINAL_SKY } from './combos';

const $ = selector => document.querySelector(selector);
const state = { selected: 21, originalSky: false, showGates: true, compareTarget: null, lastClay: new Map() };
const stages = [];
const camera = new THREE.OrthographicCamera(-1.24, 1.24, 1.24, -1.24, .1, 30);
camera.position.set(0, 0, 3.5);
const world = new THREE.Scene();
let renderer, controls, pendingFrame = 0;
const vector = point => new THREE.Vector3(...toRenderPoint(point));
const globe = createFacetedPlanet(topology.vertices.map(vector), topology.faces, COMBOS[0].planet);
const textures = Object.fromEntries(['smooth', 'chalk', 'velvet', 'clay', 'workedClay'].map(kind => [kind, createPlanetGrainTexture(kind)]));
const relief = { clay: createClayReliefTexture(false), workedClay: createClayReliefTexture(true) };
const materials = COMBOS.map(combo => {
  const finish = FINISHES[combo.finish];
  return new THREE.MeshPhysicalMaterial({ color: combo.planet, roughness: finish.roughness, metalness: 0, clearcoat: finish.clearcoat, clearcoatRoughness: .85, map: textures[finish.texture], bumpMap: relief[finish.texture] ?? textures[finish.texture], bumpScale: finish.bump, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
});
globe.material.dispose(); world.add(globe);

const seams = topology.edges.flatMap(([a, b]) => strutPoints(a, b, 'seams').flat());
const gridMaterial = new LineMaterial({ color: COMBOS[0].grid, linewidth: .9, transparent: true, opacity: COMBOS[0].opacity, depthWrite: false });
world.add(new LineSegments2(new LineSegmentsGeometry().setPositions(seams), gridMaterial));
const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(.009, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff0c7' }), topology.vertices.length);
const matrix = new THREE.Matrix4();
topology.vertices.forEach((point, index) => { matrix.makeTranslation(...toRenderPoint(point, 1.009)); dots.setMatrixAt(index, matrix); });
world.add(dots);

// Repeat exactly the same original instruments, colors and placement in all 20 views.
const placements = [
  ['generator', -.66, .30], ['guitar', -.05, .73], ['glass', -.43, -.43],
  ['kalimba', .36, .35], ['piano', -.02, -.73], ['marimba', .69, .02],
  ['bongo-high', -.48, .68], ['bongo-low', -.70, -.10], ['kick', .20, -.36],
  ['snare', .63, -.49], ['hi-hat', .42, .67], ['generator', -.05, .08],
];
const occupied = new Set();
for (const [kind, x, y] of placements) {
  const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
  const target = new THREE.Vector3(x, y, z);
  const candidates = topology.vertices.map((point, vertex) => ({ vertex, point: vector(point) }))
    .filter(item => !occupied.has(item.vertex)).sort((a, b) => a.point.distanceToSquared(target) - b.point.distanceToSquared(target));
  const { vertex, point } = candidates[0]; occupied.add(vertex);
  const toy = createToy(kind === 'generator' ? 'generator' : 'note', DEFAULT_APPEARANCE, kind === 'generator' ? undefined : kind);
  toy.group.position.copy(point.clone().multiplyScalar(1.015));
  toy.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), point.normalize());
  toy.group.scale.setScalar(DEFAULT_APPEARANCE.size);
  world.add(toy.group);
}
const ambient = new THREE.AmbientLight('#ffffff', 1.2);
const sunlight = new THREE.DirectionalLight('#fff1da', 3); sunlight.position.set(-2, 3, 4); sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024); sunlight.shadow.normalBias = .018;
Object.assign(sunlight.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: .1, far: 12 });
const fill = new THREE.DirectionalLight('#c4b5ff', .65); fill.position.set(3, -1, 2);
world.add(ambient, sunlight, fill);
const gates = new SparkGateRenderer();
const scene = emptyScene();
scene.wiring = topology.neighbors.flatMap((exits, vertex) => vertex % 5 === 0 ? [{ vertex, exits: exits.slice(0, 2) }] : []);
gates.setScene(scene, null, 0); gates.setLook(DEFAULT_APPEARANCE.switches); world.add(gates);

function colorChips(combo, compact = false) {
  const sky = state.originalSky ? ORIGINAL_SKY : combo.sky;
  return `<div class="${compact ? 'option-palette' : 'selected-colors'}">${[['Planet', combo.planet], ['Grid', combo.grid], ['Sky', sky.color]].map(([label, color]) => `<div class="color-chip"><span class="color-block" style="background:${color}"></span><span>${label}</span><code>${color}</code></div>`).join('')}</div>`;
}
function decorateStage(element) {
  const stars = element.querySelector('.stars');
  for (const point of starPoints()) {
    const star = document.createElement('i');
    star.style.cssText = `left:${point.x}%;top:${point.y}%;width:${point.size * .65}px;height:${point.size * .65}px;opacity:${point.opacity * .8}`;
    stars.append(star);
  }
}
decorateStage($('#featured-stage'));
stages.push({ element: $('#featured-stage'), selected: true });
for (const combo of COMBOS) {
  const option = document.createElement('button'); option.type = 'button'; option.className = 'option';
  option.dataset.option = String(combo.id); option.setAttribute('aria-pressed', String(combo.id === state.selected));
  option.setAttribute('aria-label', `Inspect option ${combo.id}: ${combo.name}`);
  option.innerHTML = `<div class="option-stage stage"><div class="stars" aria-hidden="true"></div><span class="option-number">${String(combo.id).padStart(2, '0')}</span><span class="option-picked">Selected</span></div><span class="option-copy"><span class="option-name">${combo.name}</span><span class="option-meta">${FINISHES[combo.finish].name} · ${combo.sky.name}</span>${colorChips(combo, true)}</span>`;
  const stage = option.querySelector('.stage'); decorateStage(stage);
  stages.push({ element: stage, combo });
  option.addEventListener('click', () => { choose(combo.id); $('.featured').scrollIntoView({ block: 'start', behavior: 'instant' }); });
  $(combo.baseId ? '#clay-grid' : '#option-grid').append(option);
}

function updateSkies() {
  for (const item of stages) {
    const combo = item.selected ? COMBOS[state.selected - 1] : item.combo;
    const sky = state.originalSky ? ORIGINAL_SKY : combo.sky;
    item.element.style.background = sky.fill;
    item.element.querySelector('.stars').hidden = !sky.stars;
  }
  for (const combo of COMBOS) {
    const card = $(`[data-option="${combo.id}"]`);
    card.querySelector('.option-palette').outerHTML = colorChips(combo, true);
    card.querySelector('.option-meta').textContent = `${FINISHES[combo.finish].name} · ${state.originalSky ? ORIGINAL_SKY.name : combo.sky.name}`;
  }
}
function choose(id) {
  state.selected = ((id - 1 + COMBOS.length) % COMBOS.length) + 1;
  const combo = COMBOS[state.selected - 1], finish = FINISHES[combo.finish];
  $('#selected-title').textContent = `${String(combo.id).padStart(2, '0')} · ${combo.name}`;
  $('#stage-label').textContent = `${String(combo.id).padStart(2, '0')} / ${COMBOS.length}`;
  $('#selected-note').textContent = combo.note;
  $('#selected-colors').innerHTML = colorChips(combo);
  $('#selected-finish').textContent = finish.name;
  $('#finish-note').textContent = finish.note;
  if (combo.baseId) state.lastClay.set(combo.baseId, combo.id);
  const clayVersion = COMBOS.find(item => item.baseId === combo.id);
  state.compareTarget = combo.baseId ?? (clayVersion ? state.lastClay.get(combo.id) ?? clayVersion.id : null);
  $('#compare-base').hidden = state.compareTarget === null;
  $('#compare-base').textContent = combo.baseId ? `Compare with original ${String(combo.baseId).padStart(2, '0')}` : `See clay version ${String(state.compareTarget).padStart(2, '0')}`;
  $('#featured-stage').setAttribute('aria-label', `Option ${combo.id}: ${combo.name}. Drag to rotate. Arrow keys also rotate the planet.`);
  document.querySelectorAll('.option').forEach(option => option.setAttribute('aria-pressed', String(Number(option.dataset.option) === combo.id)));
  $('#status').textContent = `Option ${combo.id} selected for comparison.`;
  updateSkies(); requestRender();
}

function draw() {
  pendingFrame = 0; if (!renderer || document.hidden) return;
  controls.update();
  const width = innerWidth, height = innerHeight;
  if (renderer.domElement.clientWidth !== width || renderer.domElement.clientHeight !== height) renderer.setSize(width, height);
  renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
  renderer.shadowMap.needsUpdate = true;
  for (const item of stages) {
    const rect = item.element.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= height || rect.right <= 0 || rect.left >= width || rect.width <= 0 || rect.height <= 0) continue;
    const combo = item.selected ? COMBOS[state.selected - 1] : item.combo;
    const aspect = rect.width / rect.height, span = 1.24;
    camera.left = -span * Math.max(1, aspect); camera.right = -camera.left;
    camera.top = span * Math.max(1, 1 / aspect); camera.bottom = -camera.top;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    globe.material = materials[combo.id - 1];
    gridMaterial.color.set(combo.grid); gridMaterial.opacity = combo.opacity; gridMaterial.resolution.set(rect.width, rect.height);
    gates.visible = state.showGates;
    if (state.showGates) gates.update(0, true, 0, camera.position.clone().normalize(), (camera.top - camera.bottom) / rect.height);
    const bottom = height - rect.bottom;
    renderer.setViewport(rect.left, bottom, rect.width, rect.height);
    renderer.setScissor(Math.max(0, rect.left), Math.max(0, bottom), Math.min(rect.right, width) - Math.max(0, rect.left), Math.min(rect.bottom, height) - Math.max(0, rect.top));
    renderer.clearDepth(); renderer.render(world, camera);
  }
  renderer.setScissorTest(false);
}
function requestRender() { if (!pendingFrame) pendingFrame = requestAnimationFrame(draw); }
try {
  // One shared WebGL context renders every visible preview, avoiding the browser's context limit.
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.domElement.className = 'render-canvas'; renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor('#000000', 0);
  renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.autoClear = false; document.body.append(renderer.domElement);
  controls = new TrackballControls(camera, $('#featured-stage'));
  controls.noPan = controls.noZoom = true; controls.staticMoving = true; controls.rotateSpeed = 1.4; controls.keys = ['', '', ''];
  controls.addEventListener('change', requestRender);
  $('#featured-stage').addEventListener('pointermove', requestRender);
  $('#featured-stage').addEventListener('pointerdown', requestRender);
  window.addEventListener('pointerup', requestRender);
  window.addEventListener('scroll', requestRender, { passive: true });
  const observer = new ResizeObserver(() => { controls.handleResize(); requestRender(); });
  stages.forEach(item => observer.observe(item.element));
  window.addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); controls.handleResize(); requestRender(); });
  document.addEventListener('visibilitychange', requestRender);
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); $('#render-error').hidden = false; $('#render-error').textContent = 'The 3D preview paused. Reload this page to restore it; the color swatches remain available.'; });
} catch {
  $('#render-error').hidden = false;
  $('#render-error').textContent = 'This browser could not start the 3D preview. Open the page in a browser with WebGL enabled. All 20 numbered color combinations are still listed below.';
}
$('#featured-stage').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const axis = new THREE.Vector3(...(event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? [0, 1, 0] : [1, 0, 0]));
  const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -.16 : .16;
  camera.position.applyAxisAngle(axis, direction); camera.up.applyAxisAngle(axis, direction); requestRender();
});
$('#previous').addEventListener('click', () => choose(state.selected - 1));
$('#next').addEventListener('click', () => choose(state.selected + 1));
$('#compare-base').addEventListener('click', () => { if (state.compareTarget !== null) choose(state.compareTarget); });
$('#reset-view').addEventListener('click', () => { controls?.reset(); requestRender(); });
$('#original-sky').addEventListener('change', event => { state.originalSky = event.target.checked; choose(state.selected); });
$('#show-gates').addEventListener('change', event => { state.showGates = event.target.checked; requestRender(); });
$('#copy-combo').addEventListener('click', async () => {
  const combo = COMBOS[state.selected - 1], sky = state.originalSky ? ORIGINAL_SKY : combo.sky;
  const text = `Bongo Planet color study ${String(combo.id).padStart(2, '0')}: ${combo.name}\nPlanet: ${combo.planet}\nGrid: ${combo.grid} at ${Math.round(combo.opacity * 100)}% opacity\nSky: ${sky.name} (${sky.color})\nSurface: ${FINISHES[combo.finish].name}\nInstrument colors: original`;
  try { await navigator.clipboard.writeText(text); $('#status').textContent = 'Combination copied. Paste it into the chat.'; }
  catch { $('#status').textContent = 'Clipboard unavailable. You can select and copy the color codes above.'; }
});
choose(21);
