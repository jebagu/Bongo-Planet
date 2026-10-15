// Independent review probes. Run: node --import tsx scripts/independent-engine-probe.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Engine } from '../src/core/engine';
import { emptyScene, newPiece, validateScene, type EngineEvent, type Scene } from '../src/core/contracts';
import { topology, angle } from '../src/core/geometry';
import { History } from '../src/core/history';

const checks: string[] = [];
function check(name: string, body: () => void) { body(); checks.push(name); }
const fixture = (id: string): Scene => validateScene(JSON.parse(fs.readFileSync(`public/fixtures/${id}.json`, 'utf8')));
const triggers = (events: EngineEvent[]) => events.filter(event => event.type === 'trigger').map(event => event.trigger);
const emissions = (events: EngineEvent[]) => events.filter(event => event.type === 'emission').map(event => event.time);
function advanceTo(engine: Engine, until: number): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let time = engine.now + .005; time < until - 1e-9; time += .005) {
    engine.advance(time);
    events.push(...engine.drain());
  }
  engine.advance(until);
  events.push(...engine.drain());
  return events;
}
function smallScene(): Scene {
  return { ...emptyScene(), pieces: [newPiece('generator', 0, 'g'), newPiece('note', 1, 'n')] };
}

// This oracle does not import delayBeats or read expected.json. It enumerates
// every eligible k directly, calculates the dot product explicitly, and uses
// the published surface-distance / quantization equation independently.
const initialSeed = 92881;
let seed = initialSeed;
const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2 ** 32; };
let checkedTriggers = 0;
check('32 seeded scenes match an independent constant-tempo oracle', () => {
  for (let run = 0; run < 32; run++) {
    const scene = emptyScene();
    const used = new Set<number>();
    scene.settings.bpm = 40 + random() * 140;
    scene.settings.travel = .25 + random() * .5;
    scene.settings.quantization = ([0, .125, .25] as const)[run % 3];
    const freeVertex = () => {
      let vertex: number;
      do { vertex = Math.floor(random() * 92); } while (used.has(vertex));
      used.add(vertex);
      return vertex;
    };
    for (let i = 0; i < 8; i++) scene.pieces.push({
      ...newPiece('generator', freeVertex(), `g${i}`),
      period: ([1, 2, 3, 4, 6, 8] as const)[Math.floor(random() * 6)],
      phase: i === 0 ? 0 : random() * .999999,
      reach: random() * 180,
    });
    for (let i = 0; i < 20; i++) scene.pieces.push(newPiece('note', freeVertex(), `n${i}`));
    validateScene(scene);
    const engine = new Engine(scene);
    const actual: ReturnType<typeof triggers> = [];
    engine.play(0);
    for (let i = 0; i <= 6000; i++) {
      engine.advance(i * .005);
      actual.push(...triggers(engine.drain()));
    }
    assert.equal(engine.running, true);
    const expected = new Map<string, number>();
    for (const generator of scene.pieces.filter(piece => piece.kind === 'generator')) {
      for (let k = 0; (k + generator.phase) * generator.period * 60 / scene.settings.bpm <= 30 + 1e-9; k++) {
        for (const note of scene.pieces.filter(piece => piece.kind === 'note')) {
          const u = topology.vertices[generator.vertex], v = topology.vertices[note.vertex];
          const theta = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])));
          if (theta > generator.reach * Math.PI / 180 + 1e-9) continue;
          const raw = scene.settings.travel * generator.period * theta / Math.PI;
          const grid = scene.settings.quantization;
          const delay = grid ? Math.min(Math.round(raw / grid) * grid, generator.period - grid) : raw;
          const beat = (k + generator.phase) * generator.period;
          expected.set(`${generator.id}:${note.id}:${beat.toFixed(7)}`, (beat + delay) * 60 / scene.settings.bpm);
        }
      }
    }
    assert.equal(actual.length, expected.size);
    assert.equal(new Set(actual.map(trigger => trigger.id)).size, actual.length);
    for (const trigger of actual) {
      const onset = expected.get(`${trigger.generatorId}:${trigger.nodeId}:${trigger.beat.toFixed(7)}`);
      assert.notEqual(onset, undefined);
      assert.ok(Math.abs(onset! - trigger.onset) < 1e-6);
      checkedTriggers++;
    }
  }
});

check('reach includes exact boundary and half-tolerance, excludes twice-tolerance', () => {
  const scene = smallScene(), generator = scene.pieces[0];
  assert.equal(generator.kind, 'generator');
  if (generator.kind !== 'generator') throw Error('Invalid probe');
  const degrees = angle(topology.vertices[0], topology.vertices[1]) * 180 / Math.PI;
  const counts = [0, -.5e-9, -2e-9].map(delta => {
    generator.reach = degrees + delta * 180 / Math.PI;
    const engine = new Engine(validateScene(scene));
    engine.play(0); engine.advance(0);
    return triggers(engine.drain()).length;
  });
  assert.deepEqual(counts, [1, 1, 0]);
});

check('F04 preserves exact equal-onset, identical-pitch provenance at 4.75 seconds', () => {
  const engine = new Engine(fixture('F04'));
  engine.play(0);
  const collision = triggers(advanceTo(engine, 5)).filter(trigger => trigger.onset === 4.75 && trigger.sound.kind === 'note');
  assert.deepEqual(collision.map(trigger => `${trigger.generatorId}:${trigger.nodeId}`).sort(), ['gen-3:shared-b', 'gen-4:shared-a', 'gen-4:shared-b']);
  assert.equal(new Set(collision.map(trigger => trigger.id)).size, 3);
  for (const trigger of collision) {
    assert.equal(trigger.sound.kind, 'note');
    if (trigger.sound.kind === 'note') assert.equal(trigger.sound.frequency, 261.6255653005986);
  }
});

check('delete then undo cannot resurrect an emitted, cancelled F05 pulse', () => {
  const scene = fixture('F05'), history = new History(), engine = new Engine(scene);
  engine.play(0); advanceTo(engine, .1); history.push(scene);
  const deleted = { ...scene, pieces: scene.pieces.filter(piece => piece.kind === 'generator') };
  engine.update(deleted, .1);
  assert.ok(engine.drain().some(event => event.type === 'cancel' && event.nodeIds.includes('moving')));
  const restored = history.undo(deleted); assert.ok(restored);
  engine.update(restored, .1);
  assert.equal(advanceTo(engine, 3).filter(event => event.type === 'onset').length, 0);
});

check('undo Clear restores scene paused at beat zero with the new session', () => {
  const scene = fixture('F05'), engine = new Engine(scene), history = new History();
  engine.play(0); advanceTo(engine, .1); history.push(scene);
  const oldSession = engine.session;
  engine.replace(emptyScene(), .1, 'clear');
  assert.notEqual(engine.session, oldSession);
  const clearSession = engine.session, restored = history.undo(emptyScene()); assert.ok(restored);
  engine.update(restored, .1);
  assert.equal(engine.running, false); assert.equal(engine.beat, 0); assert.equal(engine.session, clearSession);
  assert.equal(advanceTo(engine, 5).filter(event => event.type === 'onset').length, 0);
});

check('period and phase edit at beat 1.2 joins beat 3.75', () => {
  const scene = smallScene(), engine = new Engine(scene);
  engine.play(0); advanceTo(engine, .6);
  const generator = scene.pieces[0]; assert.ok(generator.kind === 'generator');
  generator.period = 3; generator.phase = .25;
  engine.update(scene, .6);
  assert.deepEqual(emissions(advanceTo(engine, 2)), [1.875]);
});

check('disable and re-enable at beat 2 joins beat 4 without replay', () => {
  const scene = smallScene(), engine = new Engine(scene), generator = scene.pieces[0];
  assert.ok(generator.kind === 'generator');
  engine.play(0); advanceTo(engine, .5); generator.enabled = false; engine.update(scene, .5);
  advanceTo(engine, 1); generator.enabled = true; engine.update(scene, 1);
  assert.deepEqual(emissions(advanceTo(engine, 2)), [2]);
});

check('key edit at exactly processed emission preserves old sound until the next emission', () => {
  const scene = smallScene(), engine = new Engine(scene);
  engine.play(0); advanceTo(engine, 1.995); scene.settings.key = 7; engine.update(scene, 2);
  const oldSound = triggers(engine.drain())[0].sound;
  const newSound = triggers(advanceTo(engine, 4))[0].sound;
  assert.ok(oldSound.kind === 'note' && newSound.kind === 'note');
  assert.equal(oldSound.frequency, 261.6255653005986);
  assert.equal(newSound.frequency, 391.99543598174927);
});

check('capacity reset stops all emission work and preserves requested future tempo on resume', () => {
  const scene = fixture('F09'), engine = new Engine(scene);
  engine.play(0); engine.advance(0); engine.drain();
  scene.settings.bpm = 180; engine.update(scene, .001); engine.drain();
  let overflow: EngineEvent[] = [];
  for (let i = 1; i <= 12 && engine.running; i++) {
    const time = i * .02;
    for (const generator of scene.pieces) if (generator.kind === 'generator') generator.phase = (time * 40 / 60 + .00001) / 8;
    engine.update(validateScene(scene), time); overflow = engine.drain();
  }
  assert.equal(engine.running, false); assert.equal(engine.pendingCount, 0);
  const reset = overflow.findIndex(event => event.type === 'reset'); assert.ok(reset >= 0);
  assert.deepEqual(overflow.slice(reset + 1), []);
  const retainedBeat = engine.beat;
  engine.play(10); advanceTo(engine, 12);
  const expectedBeat = 1 + (2 - (1 - retainedBeat) * 60 / 40) * 3;
  assert.ok(Math.abs(engine.beat - expectedBeat) < 1e-9);
});

console.log(JSON.stringify({ status: 'PASS', seed: initialSeed, randomScenes: 32, secondsPerScene: 30, tickSeconds: .005, checkedTriggers, checks }, null, 2));
