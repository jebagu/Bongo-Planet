import { describe, expect, it } from 'vitest';
import { emptyScene, newPiece, validateScene, type EngineEvent, type Generator, type Scene, type Wiring } from '../src/core/contracts';
import { Engine } from '../src/core/engine';
import { topology } from '../src/core/geometry';
import { exportScene, importScene } from '../src/core/history';
import { StrutSparkModel } from '../src/view/StrutSparkModel';

const length = (a: number, b: number) => Math.hypot(...topology.vertices[a].map((v, i) => v - topology.vertices[b][i]));
function composition(wiring: Wiring, generators: Generator[], notes: number[], bpm = 120): Scene {
  return validateScene({ ...emptyScene(), settings: { ...emptyScene().settings, bpm }, wiring,
    pieces: [...generators, ...notes.map((vertex, i) => ({ ...newPiece('note', vertex, `n${vertex}`), degree: i * 2 }))] });
}
const source = (vertex: number, id = 'g'): Generator => ({ ...newPiece('generator', vertex, id), period: 8, travel: 8 });
function tick(engine: Engine, until: number, step = .025): EngineEvent[] {
  const events: EngineEvent[] = [];
  while (engine.now < until - 1e-10) { engine.advance(Math.min(until, engine.now + step)); events.push(...engine.drain()); }
  return events;
}
function start(scene: Scene, epoch = 0) {
  const engine = new Engine(scene); engine.play(epoch); engine.advance(epoch);
  return { engine, events: engine.drain() };
}
const arrivals = (events: EngineEvent[]) => events.filter(e => e.type === 'arrival');
const edges = (events: EngineEvent[]) => events.filter(e => e.type === 'edge').map(e => e.edge);
const onsets = (events: EngineEvent[]) => events.filter(e => e.type === 'onset').map(e => e.trigger);

describe('equal-hop musical grid', () => {
  it.each([40, 120, 180])('every one of the 270 struts takes one sixteenth note at %s BPM', bpm => {
    const speeds: number[] = [];
    for (const [from, to] of topology.edges) {
      const scene = composition([{ vertex: from, exits: [to] }], [{ ...source(from), travel: 1 }], [to], bpm);
      const { events } = start(scene, 7.3), edge = edges(events)[0];
      expect(edge.arrival - edge.departure).toBeCloseTo(15 / bpm, 12);
      expect(events.find(e => e.type === 'trigger')?.trigger.onset).toBe(edge.arrival);
      expect(edge.speed * (15 / bpm)).toBeCloseTo(length(from, to), 12);
      speeds.push(edge.speed);
    }
    expect(Math.max(...speeds) / Math.min(...speeds)).toBeGreaterThan(1.1);
  });

  it('unequal-length branches form a C-major chord at exactly 125 ms', () => {
    const scene = composition([{ vertex: 1, exits: [5, 0, 2] }], [{ ...source(1), travel: 1 }], [0, 2, 5]);
    expect(length(1, 0)).not.toBeCloseTo(length(1, 5), 3);
    const { engine } = start(scene), played = onsets(tick(engine, .2));
    expect(played.map(t => t.nodeId)).toEqual(['n0', 'n2', 'n5']);
    expect(played.map(t => t.onset)).toEqual([.125, .125, .125]);
    expect(played.map(t => t.sound.kind === 'note' && t.sound.frequency)).toEqual([0, 4, 7].map(semitones => 440 * 2 ** ((60 + semitones - 69) / 12)));
  });

  it('empty junctions add a step and equal-hop convergences keep every simultaneous voice', () => {
    const scene = composition([{ vertex: 0, exits: [1, 4] }, { vertex: 1, exits: [5] }, { vertex: 4, exits: [5] }], [{ ...source(0), travel: 2 }], [5]);
    const { engine } = start(scene), played = onsets(tick(engine, .3));
    expect(played.map(t => [t.nodeId, t.onset])).toEqual([['n5', .25], ['n5', .25]]);
    expect(new Set(played.map(t => t.id)).size).toBe(2);
  });

  it('independent periods and imported phase offsets use one shared sixteenth-note grid', () => {
    const scene = composition([{ vertex: 0, exits: [1] }, { vertex: 10, exits: [1] }, { vertex: 3, exits: [2] }], [
      { ...source(0, 'one'), period: 1, travel: 1 },
      { ...source(10, 'two'), period: 2, phase: .13, travel: 1 },
      { ...source(3, 'three'), period: 3, phase: .999999, travel: 1 },
    ], [1, 2]);
    const epoch = 12.37, { engine, events } = start(importScene(exportScene(scene)), epoch);
    events.push(...tick(engine, epoch + 3.2));
    const emissions = events.filter(e => e.type === 'emission');
    expect(emissions.filter(e => e.generatorId === 'two').map(e => e.time - epoch)).toEqual([.125, 1.125, 2.125, 3.125]);
    expect(emissions.filter(e => e.generatorId === 'three').map(e => e.time - epoch)).toEqual([0, 1.5, 3]);
    for (const time of [...emissions.map(e => e.time), ...onsets(events).map(t => t.onset)]) {
      const step = (time - epoch) / .125; expect(step).toBeCloseTo(Math.round(step), 10);
    }
    expect(engine.scene).toEqual(scene); // Interpret the saved phase; do not rewrite its metadata.
  });

  it('a generator added while playing joins its next master boundary', () => {
    const scene = composition([{ vertex: 0, exits: [1] }, { vertex: 10, exits: [1] }], [source(0)], [1]);
    const { engine } = start(scene); tick(engine, .21);
    const next = { ...scene, pieces: [...scene.pieces, { ...source(10, 'late'), period: 1 as const, travel: 1 }] };
    engine.update(next, .21); engine.drain();
    const events = tick(engine, .7);
    expect(events.filter(e => e.type === 'emission').filter(e => e.generatorId === 'late').map(e => e.time)).toEqual([.5]);
    expect(onsets(events).filter(t => t.generatorId === 'late').map(t => t.onset)).toEqual([.625]);
  });

  it.each([[.124999, 0], [.125, .125], [.999999, 0]])('phase %s snaps with upward ties and period wrapping', (phase, firstEmission) => {
    const scene = composition([{ vertex: 0, exits: [1] }], [{ ...source(0), period: 1, phase, travel: 1 }], [1]);
    const { engine, events } = start(scene); events.push(...tick(engine, .65));
    expect(events.filter(e => e.type === 'emission')[0].time).toBe(firstEmission);
  });

  it('legacy radial grid metadata cannot change gated hop duration', () => {
    const scene = composition([{ vertex: 0, exits: [1] }, { vertex: 1, exits: [2] }], [{ ...source(0), travel: 2 }], [1, 2]);
    for (const quantization of [0, .125, .25] as const) {
      const { engine } = start({ ...scene, settings: { ...scene.settings, quantization, travel: .25 } });
      expect(onsets(tick(engine, .3)).map(t => t.onset)).toEqual([.125, .25]);
    }
  });

  it('tempo changes keep old circuits and newly emitted sparks together at the next beat', () => {
    const scene = composition([{ vertex: 0, exits: [1] }, { vertex: 1, exits: [4] }, { vertex: 4, exits: [0] }, { vertex: 10, exits: [1] }], [
      { ...source(0), travel: 'infinite' }, { ...source(10, 'clock'), period: 1, travel: 1 },
    ], [1, 4]);
    const { engine, events } = start(scene); events.push(...tick(engine, .2));
    const changed = structuredClone(scene); changed.settings.bpm = 60;
    engine.update(changed, .2); events.push(...engine.drain(), ...tick(engine, 1.26));
    expect(arrivals(events).filter(e => e.generatorId === 'g').map(e => e.time)).toEqual([.125, .25, .375, .5, .75, 1, 1.25]);
    expect(onsets(events).filter(t => t.generatorId === 'clock').map(t => t.onset)).toEqual([.125, .75]);
    for (const edge of edges(events)) expect(edge.arrival - edge.departure).toBeCloseTo(edge.departure < .5 ? .125 : .25, 12);
    expect(engine.running).toBe(true);
  });

  it('three-hop and four-hop circuits meet again after twelve steps', () => {
    const scene = composition([{ vertex: 0, exits: [1] }, { vertex: 1, exits: [4] }, { vertex: 4, exits: [0] },
      { vertex: 44, exits: [46] }, { vertex: 46, exits: [47] }, { vertex: 47, exits: [45] }, { vertex: 45, exits: [44] }],
    [{ ...source(0), travel: 'infinite' }, { ...source(44, 'four'), travel: 'infinite' }], [1, 46]);
    const { engine } = start(scene), disabled = structuredClone(scene);
    disabled.pieces.forEach(p => { if (p.kind === 'generator') p.enabled = false; }); engine.update(disabled, 0); engine.drain();
    const events = arrivals(tick(engine, 1.51));
    expect(events.filter(e => e.vertex === 0).map(e => e.time)).toEqual([.375, .75, 1.125, 1.5]);
    expect(events.filter(e => e.vertex === 44).map(e => e.time)).toEqual([.5, 1, 1.5]);
  });

  it('an Infinite circuit stays on the grid for thirty simulated minutes at 137 BPM', () => {
    const scene = composition([{ vertex: 0, exits: [1] }, { vertex: 1, exits: [4] }, { vertex: 4, exits: [0] }], [{ ...source(0), travel: 'infinite' }], [1, 4], 137);
    const epoch = 123.456, { engine } = start(scene, epoch), disabled = structuredClone(scene);
    (disabled.pieces[0] as Generator).enabled = false; engine.update(disabled, epoch); engine.drain();
    let count = 0, maxError = 0;
    for (let i = 1; i <= 36000; i++) for (const event of arrivals(tick(engine, epoch + i * .05, .05))) {
      count++; maxError = Math.max(maxError, Math.abs(event.time - (epoch + count * 15 / 137)));
    }
    expect(count).toBe(16440); expect(maxError).toBeLessThan(1e-9);
    expect(engine.running).toBe(true); expect(engine.snapshot().gatedEdges).toBe(1);
  });

  it('spark positions reach the midpoint of unequal struts together and flash at the audible arrival', () => {
    const scene = composition([{ vertex: 1, exits: [0, 2, 5] }], [{ ...source(1), travel: 1 }], [0, 2, 5]);
    const { engine, events } = start(scene), model = new StrutSparkModel(); events.forEach(e => model.event(e, scene));
    const frame = model.frame(.0625);
    expect(frame.sparks).toHaveLength(3);
    for (const spark of frame.sparks) {
      const edge = edges(events).find(e => e.id === spark.routeId)!;
      const midpoint = topology.vertices[edge.from].map((v, i) => (v + topology.vertices[edge.to][i]) / 2);
      const rendered = [midpoint[0], midpoint[2], -midpoint[1]];
      spark.point.forEach((v, i) => expect(v).toBeCloseTo(.99 * rendered[i], 10));
    }
    tick(engine, .125).forEach(e => model.event(e, scene));
    expect(model.frame(.125).sparks).toHaveLength(0);
    for (const vertex of [0, 2, 5]) expect(model.frame(.125).flashes.get(`n${vertex}`)).toBe(1);
  });
});
