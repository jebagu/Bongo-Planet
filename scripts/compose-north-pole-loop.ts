import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {exportCompositionFile, importCompositionFile} from '../src/compositionFile';
import {validateScene, type EngineEvent} from '../src/core/contracts';
import {Engine} from '../src/core/engine';
import {topology} from '../src/core/geometry';

const sourcePath = 'public/compositions/north-pole-trickle/Bongo-Planet.json';
const sourceText = readFileSync(sourcePath, 'utf8');
const original = importCompositionFile(sourceText);
assert(original.appearance);
const scene = structuredClone(original.scene);
const generator = scene.pieces.find(piece => piece.kind === 'generator');
assert(generator?.kind === 'generator');
generator.period = 6;
generator.travel = 24;

// Move four neighboring piano pieces outward to open quiet return lanes.
const noteMoves = new Map([[17, 26], [20, 56], [77, 49], [75, 82]]);
for (const piece of scene.pieces) {
  if (noteMoves.has(piece.vertex)) piece.vertex = noteMoves.get(piece.vertex)!;
  // Two returning streams share each bottom note, retaining separate voices.
  if ([52, 54, 90, 53].includes(piece.vertex) && piece.kind === 'note') piece.level /= 2;
}

const downward = [
  [38, 40, 8, 5, 7, 4, 0, 22, 16, 25, 26, 27, 52, 54],
  [38, 87, 35, 34, 32, 31, 12, 60, 21, 58, 56, 55, 90, 53],
  [38, 41, 42, 88, 43, 44, 45, 47, 78, 89, 49, 50, 52, 54],
  [38, 66, 68, 65, 67, 64, 61, 79, 74, 81, 82, 83, 90, 53],
];
const upward = [
  [54, 18, 17, 19, 10, 11, 14, 13, 15, 3, 37, 38],
  [53, 51, 75, 76, 69, 70, 72, 71, 63, 73, 39, 38],
];
const gates = new Map<number, Set<number>>();
for (const path of [...downward, ...upward]) {
  for (let i = 0; i < path.length - 1; i++) {
    const vertex = path[i], next = path[i + 1];
    assert(topology.neighbors[vertex].includes(next), 'Every crossing uses a real adjacent strut.');
    const exits = gates.get(vertex) ?? new Set<number>();
    exits.add(next);
    gates.set(vertex, exits);
  }
}
for (const path of downward) {
  assert.equal(path.length - 1, 13);
  assert(path.every((vertex, i) => !i || topology.vertices[vertex][2] <= topology.vertices[path[i - 1]][2] + 1e-9));
}
for (const path of upward) {
  assert.equal(path.length - 1, 11);
  assert(path.every((vertex, i) => !i || topology.vertices[vertex][2] >= topology.vertices[path[i - 1]][2] - 1e-9));
  assert(path.slice(1, -1).every(vertex => !scene.pieces.some(piece => piece.vertex === vertex)), 'Returns are silent.');
}
assert([...gates].every(([vertex, exits]) => exits.size === (vertex === 38 ? 4 : 1)), 'Only the generator splits.');
scene.wiring = [...gates].map(([vertex, exits]) => ({vertex, exits: [...exits].sort((a, b) => a - b)})).sort((a, b) => a.vertex - b.vertex);
const validated = validateScene(scene);
const json = exportCompositionFile(validated, original.appearance);
assert.deepEqual(importCompositionFile(json).scene, validated);
assert.equal(validated.pieces.filter(piece => piece.kind === 'generator').length, 1);

// A finite 24-hop circuit closes on the next six-beat emission boundary.
// Returning arrivals stop at the source instead of multiplying four branches.
const engine = new Engine(validated), events: EngineEvent[] = [];
engine.play(0); engine.advance(0); events.push(...engine.drain());
let maximumActiveEdges = engine.snapshot().gatedEdges;
const quantum = 128 / 48000, seconds = 100 * 9;
for (let tick = 1; tick * quantum <= seconds + 1e-9; tick++) {
  engine.advance(tick * quantum); events.push(...engine.drain());
  assert(engine.snapshot().running, 'One hundred completed loops must not overload.');
  maximumActiveEdges = Math.max(maximumActiveEdges, engine.snapshot().gatedEdges);
}
const emissions = events.filter(event => event.type === 'emission');
const returns = events.filter((event): event is Extract<EngineEvent, {type: 'arrival'}> => event.type === 'arrival' && event.vertex === 38);
const onsets = events.filter(event => event.type === 'onset').map(event => event.trigger);
assert.equal(emissions.length, 101);
assert.equal(returns.length, 400);
assert.equal(onsets.length, 5000);
assert.equal(maximumActiveEdges, 4);
const noteSteps = new Map<number, number>();
downward.forEach(path => path.forEach((vertex, step) => noteSteps.set(vertex, step)));
for (let loop = 0; loop < 100; loop++) {
  const closes = returns.filter(event => Math.abs(event.time - (loop + 1) * 9) < 1e-8);
  assert.equal(closes.length, 4);
  assert(closes.every(event => event.hops === 24));
  const played = onsets.filter(trigger => trigger.onset >= loop * 9 && trigger.onset < (loop + 1) * 9);
  assert.equal(played.length, 50);
  for (const note of validated.pieces.filter(piece => piece.kind === 'note')) {
    const hits = played.filter(trigger => trigger.nodeId === note.id);
    assert.equal(hits.length, [52, 54, 90, 53].includes(note.vertex) ? 2 : 1);
    assert(hits.every(trigger => Math.abs(trigger.onset - (loop * 9 + noteSteps.get(note.vertex)! * 0.375)) < 1e-8));
  }
}
assert.equal(readFileSync(sourcePath, 'utf8'), sourceText, 'The original remains unchanged.');
const destination = 'public/compositions/north-pole-loop';
mkdirSync(destination, {recursive: true});
writeFileSync(`${destination}/Bongo-Planet.json`, json + '\n');
writeFileSync('public/fixtures/N02.json', JSON.stringify(validated, null, 2) + '\n');
const validation = {
  name: 'North Pole Loop', presetId: 'N02', validated: true, generators: 1,
  generatorVertex: 38, bpm: 40, intervalBeats: 6, cycleSeconds: 9, travelHops: 24,
  downwardHops: 13, upwardHops: 11, descentSeconds: 4.875, returnSeconds: 4.125,
  downwardPaths: downward, upwardPaths: upward, movedPianoVertices: Object.fromEntries(noteMoves),
  allCrossingsAdjacent: true, downwardRoutesNeverRise: true, upwardRoutesNeverDescend: true,
  returnLanesSilent: true, onlyGeneratorSplits: true, originalUnchanged: true,
  originalSha256: createHash('sha256').update(sourceText).digest('hex'),
  simulation: {seconds, completedLoops: 100, emissions: emissions.length, sourceReturns: returns.length,
    onsets: onsets.length, maximumActiveEdgesBetweenBoundaries: maximumActiveEdges,
    renderQuantum: {samples: 128, sampleRate: 48000}, overloads: 0},
};
writeFileSync(`${destination}/validation.json`, JSON.stringify(validation, null, 2) + '\n');
console.log(JSON.stringify({preset: validation.name, file: `${destination}/Bongo-Planet.json`, ...validation.simulation}, null, 2));
