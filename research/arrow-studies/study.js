import { source } from './source-data.js';

const treatments = [
  { id: 1, name: 'Light contour', width: .75, opacity: .60, note: 'A familiar line, with less weight.' },
  { id: 2, name: 'Dim contour', width: .75, opacity: .35, note: 'Same thin line, further in the background.' },
  { id: 3, name: 'Clear half pixel', width: .50, opacity: .70, note: 'Half a pixel, still easy to find.' },
  { id: 4, name: 'Soft half pixel', width: .50, opacity: .45, note: 'Half a pixel, gently dimmed.', recommended: true },
  { id: 5, name: 'Whisper half pixel', width: .50, opacity: .25, note: 'Visible when you look for it.' },
  { id: 6, name: 'Fine line', width: .35, opacity: .55, note: 'An even thinner, delicate contour.' },
  { id: 7, name: 'Dim fine line', width: .35, opacity: .30, note: 'A fine line with a softer presence.' },
  { id: 8, name: 'Quarter pixel', width: .25, opacity: .50, note: 'A tiny trace of the original outline.' },
  { id: 9, name: 'Warm whisper', width: .50, opacity: .35, color: '#fff0dc', note: 'A warmer white, for a gentler edge.' },
  { id: 10, name: 'Almost invisible', width: .50, opacity: .15, note: 'The orange fill does almost all the talking.' },
];
const current = { id: 0, name: 'Current outline', sourceWeight: true, opacity: 1, color: source.current.offColor };
const NS = 'http://www.w3.org/2000/svg';
const node = (tag, attrs = {}) => { const el = document.createElementNS(NS, tag); for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value)); return el; };
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, k) => a.map(v => v * k);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = a => mul(a, 1 / (Math.hypot(...a) || 1));
const pointsAttr = p => p.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
const state = { chosen: 4, yaw: -.07, pitch: .065, zoom: 1, showOn: true, active: new Set() };
const previews = [];
let frame = 0;

// Camera-facing arrows use the same normal threshold and basis as production.
function rotate([x, y, z]) {
  const a = x * Math.cos(state.yaw) + z * Math.sin(state.yaw);
  const c = -x * Math.sin(state.yaw) + z * Math.cos(state.yaw);
  return [a, y * Math.cos(state.pitch) - c * Math.sin(state.pitch), y * Math.sin(state.pitch) + c * Math.cos(state.pitch)];
}
function project(p, scale) {
  const [x, y, z] = rotate(p);
  const perspective = 3.5 / (3.5 - z);
  return [250 + x * scale * perspective, 250 - y * scale * perspective, z];
}
function activeFor(gate) { return state.showOn && state.active.has(gate.id); }
// Small, fixed set of real neighboring gates demonstrates the unchanged fill.
const frontGates = source.gates.filter(g => rotate(g.point)[2] > .55 && g.vertex % 6 === 0);
frontGates.filter((_, i) => i % 3 === 0).slice(0, 11).forEach(g => state.active.add(g.id));
const initialActive = [...state.active];

function samples(treatment) {
  const row = document.createElement('div'); row.className = 'samples';
  for (const on of [false, true]) {
    const svg = node('svg', { viewBox: '0 0 24 24', class: 'sample-icon', 'aria-hidden': 'true' });
    svg.append(node('polygon', { points: pointsAttr(source.contour), fill: on ? source.current.onColor : 'none',
      stroke: on ? 'none' : treatment.color || '#ffffff',
      'stroke-width': treatment.sourceWeight ? 1.5 * source.current.stroke : treatment.width,
      opacity: on ? 1 : treatment.opacity, 'stroke-linejoin': 'round' }));
    row.append(svg); const text = document.createElement('span'); text.textContent = on ? 'ON' : 'OFF'; row.append(text);
  }
  return row;
}

function makePreview(container, treatment, interactive = false) {
  const svg = node('svg', { viewBox: '0 0 500 500', class: 'planet-svg', role: interactive ? 'group' : 'img',
    'aria-label': interactive ? `${treatment.name} planet preview. Drag to rotate. Tap an arrow to toggle its orange fill.` : `${treatment.name} arrow outlines on the planet` });
  const title = node('title'); title.textContent = treatment.name; svg.append(title);
  const faceLayer = node('g'), edgeLayer = node('g'), slotLayer = node('g'), gateLayer = node('g');
  svg.append(faceLayer, edgeLayer, slotLayer, gateLayer); container.append(svg);
  const preview = { svg, treatment, faceLayer, edgeLayer, slotLayer, gateLayer, interactive };
  previews.push(preview);
  if (interactive) {
    let drag = null;
    svg.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, yaw: state.yaw, pitch: state.pitch, moved: false, gate: event.target.closest('[data-gate]')?.dataset.gate };
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener('pointermove', event => {
      if (!drag) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) < 6 && !drag.moved) return;
      drag.moved = true; svg.classList.add('dragging');
      state.yaw = drag.yaw + dx * .009; state.pitch = drag.pitch + dy * .009;
      requestRender();
    });
    svg.addEventListener('pointerup', () => {
      if (drag && !drag.moved && drag.gate) {
        svg.querySelector(`[data-gate="${drag.gate}"]`)?.focus();
        toggleGate(drag.gate);
      }
      drag = null; svg.classList.remove('dragging');
    });
    for (const event of ['pointercancel', 'lostpointercapture']) svg.addEventListener(event, () => { drag = null; svg.classList.remove('dragging'); });
    svg.addEventListener('keydown', event => {
      const gate = event.target.closest('[data-gate]')?.dataset.gate;
      if (gate && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggleGate(gate); }
      if (gate && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        const here = event.target.closest('[data-gate]');
        const x = Number(here.dataset.x), y = Number(here.dataset.y);
        const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
        const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        const candidates = [...svg.querySelectorAll('[data-gate]')].map(el => {
          const dx = Number(el.dataset.x) - x, dy = Number(el.dataset.y) - y;
          return { el, ahead: (horizontal ? dx : dy) * direction, distance: Math.hypot(dx, dy) + Math.abs(horizontal ? dy : dx) };
        }).filter(item => item.ahead > 1).sort((a, b) => a.distance - b.distance);
        if (candidates[0]) {
          here.setAttribute('tabindex', '-1');
          candidates[0].el.setAttribute('tabindex', '0');
          candidates[0].el.focus();
        }
      }
    });
  }
  return preview;
}
function toggleGate(id) {
  if (!state.showOn) { state.showOn = true; document.querySelector('#show-on').checked = true; }
  state.active.has(id) ? state.active.delete(id) : state.active.add(id);
  document.querySelector('#announce').textContent = `Arrow ${id.replace('>', ' to ')} ${state.active.has(id) ? 'on' : 'off'} in every preview.`;
  requestRender();
}

function render(preview) {
  const { treatment, interactive } = preview;
  const focusedId = preview.svg.contains(document.activeElement) ? document.activeElement.dataset.gate : null;
  const tabStopId = focusedId || preview.svg.querySelector('[tabindex="0"]')?.dataset.gate;
  const scale = 220 * (interactive ? state.zoom : 1);
  const projected = source.vertices.map(p => project(p, scale));
  const faces = document.createDocumentFragment();
  const sortedFaces = source.faces.map(face => ({ face, z: face.reduce((sum, i) => sum + projected[i][2], 0) / 3 })).sort((a, b) => a.z - b.z);
  for (const { face } of sortedFaces) {
    const [a, b, c] = face.map(i => source.vertices[i]);
    let normal = norm(cross(sub(b, a), sub(c, a))); if (dot(normal, a) < 0) normal = mul(normal, -1);
    const turned = rotate(normal); if (turned[2] < -.08) continue;
    const light = .64 + Math.max(0, dot(turned, norm([-.55, .75, 1]))) * .36;
    const fill = `rgb(${Math.round(90 * light)} ${Math.round(102 * light)} ${Math.round(225 * light)})`;
    faces.append(node('polygon', { points: pointsAttr(face.map(i => projected[i])), fill, stroke: fill, 'stroke-width': .25 }));
  }
  preview.faceLayer.replaceChildren(faces);
  const edges = document.createDocumentFragment();
  for (const [a, b] of source.edges) {
    if ((projected[a][2] + projected[b][2]) / 2 < 0) continue;
    edges.append(node('line', { x1: projected[a][0], y1: projected[a][1], x2: projected[b][0], y2: projected[b][1], stroke: '#c3b8ff', 'stroke-opacity': .43, 'stroke-width': .75, 'vector-effect': 'non-scaling-stroke' }));
  }
  preview.edgeLayer.replaceChildren(edges);
  const slots = document.createDocumentFragment();
  for (const p of projected) if (p[2] > .025) slots.append(node('circle', { cx: p[0], cy: p[1], r: 1.5 + Math.max(0, p[2]) * .4, fill: '#eee5b0', opacity: .9 }));
  preview.slotLayer.replaceChildren(slots);
  const gates = document.createDocumentFragment();
  for (const gate of source.gates) {
    const normal = norm(add(gate.from, gate.to)); if (rotate(normal)[2] <= .08) continue;
    const axis = norm(sub(gate.to, gate.from)), side = norm(cross(normal, axis));
    const arrow = source.contour.map(([x, y]) => project(add(gate.point, add(mul(axis, (x - 12) / 24 * source.sourceScale), mul(side, (12 - y) / 24 * source.sourceScale))), scale));
    const center = project(gate.point, scale), on = activeFor(gate);
    const wrapper = node('g', interactive ? { class: 'gate-target', 'data-gate': gate.id, 'data-x': center[0], 'data-y': center[1], role: 'button', tabindex: gate.id === tabStopId ? '0' : '-1', 'aria-label': `Arrow ${gate.vertex + 1} to ${gate.exit + 1}`, 'aria-pressed': on } : {});
    if (interactive) wrapper.append(node('circle', { cx: center[0], cy: center[1], r: 9, fill: 'transparent', 'pointer-events': 'all' }));
    // The baseline keeps the production world-space outline. Candidates use
    // screen-space strokes so 0.5px stays 0.5px at every zoom and viewport.
    const sourceStroke = source.current.stroke * 1.5 / 24 * source.sourceScale * scale * (3.5 / (3.5 - center[2]));
    wrapper.append(node('polygon', { class: 'gate-ink', points: pointsAttr(arrow), fill: on ? source.current.onColor : 'none', stroke: on ? 'none' : treatment.color || '#ffffff',
      opacity: on ? 1 : treatment.opacity, 'stroke-width': treatment.sourceWeight ? sourceStroke : treatment.width,
      'stroke-linejoin': 'round', ...(!treatment.sourceWeight ? { 'vector-effect': 'non-scaling-stroke' } : {}), 'pointer-events': 'none' }));
    gates.append(wrapper);
  }
  preview.gateLayer.replaceChildren(gates);
  if (interactive && !preview.gateLayer.querySelector('[tabindex="0"]')) preview.gateLayer.querySelector('[data-gate]')?.setAttribute('tabindex', '0');
  if (focusedId) preview.gateLayer.querySelector(`[data-gate="${focusedId}"]`)?.focus();
}
function requestRender() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; previews.forEach(render); }); }

const baseline = makePreview(document.querySelector('#current-planet'), current, true);
const chosen = makePreview(document.querySelector('#chosen-planet'), treatments[3], true);
document.querySelector('#current-sample').append(samples(current));
document.querySelector('#chosen-sample').append(samples(treatments[3]));

function choose(id, announce = true) {
  state.chosen = id; const treatment = treatments.find(t => t.id === id);
  chosen.treatment = treatment;
  chosen.svg.setAttribute('aria-label', `${treatment.name} planet preview. Drag to rotate. Tap an arrow to toggle its orange fill.`);
  chosen.svg.querySelector('title').textContent = treatment.name;
  document.querySelector('#compare-name').textContent = `${String(id).padStart(2, '0')} · ${treatment.name}`;
  document.querySelector('#selected-name').textContent = treatment.name;
  document.querySelector('#selected-spec').textContent = `${treatment.width.toFixed(2)} px · ${Math.round(treatment.opacity * 100)}% ${treatment.color ? 'warm white' : 'white'}`;
  document.querySelector('#selected-note').textContent = treatment.note;
  document.querySelector('#chosen-sample').replaceChildren(samples(treatment));
  document.querySelectorAll('.treatment').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.id) === id)));
  history.replaceState(null, '', `#${String(id).padStart(2, '0')}`);
  if (announce) document.querySelector('#announce').textContent = `Comparing ${id}: ${treatment.name}. ${treatment.width.toFixed(2)} pixels at ${Math.round(treatment.opacity * 100)} percent opacity.`;
  requestRender();
}
for (const treatment of treatments) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'treatment'; button.dataset.id = treatment.id;
  button.setAttribute('aria-pressed', String(treatment.id === state.chosen));
  button.setAttribute('aria-label', `Compare ${String(treatment.id).padStart(2, '0')}: ${treatment.name}, ${treatment.width.toFixed(2)} pixels, ${Math.round(treatment.opacity * 100)} percent opacity`);
  const stage = document.createElement('div'); stage.className = 'mini-stage';
  const number = document.createElement('span'); number.className = 'treatment-number'; number.textContent = String(treatment.id).padStart(2, '0'); stage.append(number);
  const indicator = document.createElement('span'); indicator.className = 'choice-indicator'; indicator.textContent = '✓'; indicator.setAttribute('aria-hidden', 'true'); stage.append(indicator);
  if (treatment.recommended) { const recommendation = document.createElement('span'); recommendation.className = 'recommended'; recommendation.textContent = 'Start here'; stage.append(recommendation); }
  makePreview(stage, treatment);
  const copy = document.createElement('div'); copy.className = 'treatment-copy';
  for (const [className, text] of [['treatment-name', treatment.name], ['treatment-meta', `${treatment.width.toFixed(2)} px · ${Math.round(treatment.opacity * 100)}% ${treatment.color ? 'warm white' : 'white'}`], ['treatment-description', treatment.note]]) {
    const span = document.createElement('span'); span.className = className; span.textContent = text; copy.append(span);
  }
  button.append(stage, copy); document.querySelector('#treatment-grid').append(button);
  button.addEventListener('click', () => {
    choose(treatment.id);
    // A choice immediately returns to the full-size comparison.
    document.querySelector('.comparison').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
}
document.querySelector('#show-on').addEventListener('change', event => { state.showOn = event.target.checked; requestRender(); });
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  state.zoom = Number(button.dataset.zoom); document.querySelectorAll('[data-zoom]').forEach(other => other.setAttribute('aria-pressed', String(other === button))); requestRender();
}));
document.querySelector('#reset').addEventListener('click', () => {
  state.yaw = -.07; state.pitch = .065; state.zoom = 1; state.showOn = true; state.active = new Set(initialActive);
  document.querySelector('#show-on').checked = true; document.querySelectorAll('[data-zoom]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.zoom === '1'))); requestRender();
});
const initial = Number(location.hash.slice(1));
choose(treatments.some(t => t.id === initial) ? initial : 4, false);
