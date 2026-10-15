import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { emptyLegacyScene as emptyScene, newPiece, type EngineEvent, type Scene, type Trigger, LIMITS } from '../src/core/contracts';
import { topology } from '../src/core/geometry';
import { Engine } from '../src/core/engine';
import { surfaceArc } from '../src/view/math';
import { shortestStrutPath, strutPoints, strutRoute, sampleRoute, rerouteStrut } from '../src/view/strutRoutes';
import { StrutSparkModel, MAX_VISIBLE_SPARKS } from '../src/view/StrutSparkModel';
import { StrutSparkRenderer } from '../src/view/StrutSparkRenderer';

const separation = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
const scene = (): Scene => ({ ...emptyScene(), pieces: [newPiece('generator', 0, 'g'), newPiece('note', 20, 'n')] });
const trigger = (patch: Partial<Trigger> = {}): Trigger => ({ session: 's', sequence: 1, id: 't', generatorId: 'g', nodeId: 'n', emission: 1, beat: 0, onset: 4, angle: 1, position: [...topology.vertices[20]], sound: { kind: 'note', frequency: 440, timbre: 'sine', duration: 1, level: 0.5 }, ...patch });
const emission: EngineEvent = { type: 'emission', generatorId: 'g', sourceVertex: 0, time: 1, periodSeconds: 4, reach: 180 };
function started(t = trigger(), s = scene()) {
  const model = new StrutSparkModel(); model.event(emission, s); model.event({ type: 'trigger', trigger: t }, s); return model;
}

describe('strut routing', () => {
  it('routes every pair through adjacent vertices and exactly the displayed chord samples', () => {
    for (let a = 0; a < 92; a++) for (let b = 0; b < 92; b++) {
      const vertices = shortestStrutPath(a, b), path = strutRoute(a, b);
      expect(vertices[0]).toBe(a); expect(vertices.at(-1)).toBe(b);
      for (let i = 1; i < vertices.length; i++) expect(topology.neighbors[vertices[i - 1]]).toContain(vertices[i]);
      expect(path.points.every(p => p.every(Number.isFinite))).toBe(true);
      expect(separation(sampleRoute(path, 0).point, path.points[0])).toBeLessThan(1e-12);
      expect(separation(sampleRoute(path, 1).point, path.points.at(-1)!)).toBeLessThan(1e-12);
    }
    for (const [a, b] of topology.edges) {
      expect(strutPoints(a, b)).toEqual(surfaceArc(topology.vertices[a], topology.vertices[b], 8, 1.002));
      expect(strutPoints(b, a)).toEqual(strutPoints(a, b).reverse());
    }
  });
  it('keeps a reroute continuous, on its current edge, and ends at the new destination', () => {
    const original = strutRoute(0, 30);
    for (const fraction of [0, 0.01, 0.28, 0.5, 0.99]) for (const target of [0, 20, 45, 91]) {
      const next = rerouteStrut(original, fraction, target);
      expect(separation(next.points[0], sampleRoute(original, fraction).point)).toBeLessThan(1e-12);
      expect(separation(next.points.at(-1)!, strutRoute(target, target).points[0])).toBeLessThan(1e-12);
      expect(next.edges.every(([a, b]) => topology.neighbors[a].includes(b))).toBe(true);
    }
    const zero = strutRoute(0, 0), moved = rerouteStrut(zero, 0.5, 91);
    expect(moved.points[0]).toEqual(zero.points[0]);
    expect(moved.points.at(-1)).toEqual(strutRoute(91, 91).points[0]);
  });
});

describe('visual event lifecycle', () => {
  it('does not flash from scheduled triggers or from passing intermediate nodes', () => {
    const model = started();
    expect(model.frame(0.9).sparks).toHaveLength(0);
    expect(model.frame(2).sparks).toHaveLength(1);
    expect(model.frame(4).flashes.has('n')).toBe(false);
    model.event({ type: 'onset', trigger: trigger() }, scene());
    expect(model.frame(4).flashes.get('n')).toBe(1);
    expect(model.frame(4).sparks).toHaveLength(0);
    expect([...model.frame(4).flashes.keys()]).toEqual(['n']);
  });
  it('uses the committed source after the generator moves, including delayed event delivery', () => {
    const moved = scene(); moved.pieces[0].vertex = 91;
    const model = started(trigger(), moved);
    expect(separation(model.frame(1).sparks[0].point, strutRoute(0, 20).points[0])).toBeLessThan(1e-12);
  });
  it('follows the current target when delivery occurs after a scene edit', () => {
    const moved = scene(); moved.pieces[1].vertex = 91;
    const model = started(trigger(), moved);
    expect(separation(model.frame(3.999999).sparks[0].point, strutRoute(91, 91).points[0])).toBeLessThan(0.00001);
  });
  it('reroutes repeatedly without jumping or changing the committed arrival', () => {
    const model = started(), changed = scene();
    for (const [time, vertex] of [[1.7, 45], [2.2, 7], [2.8, 91]]) {
      const before = model.frame(time).sparks[0].point;
      changed.pieces[1].vertex = vertex; model.setScene(changed, time);
      expect(separation(model.frame(time).sparks[0].point, before)).toBeLessThan(1e-12);
    }
    expect(separation(model.frame(3.999999).sparks[0].point, strutRoute(91, 91).points[0])).toBeLessThan(0.00001);
    expect(model.frame(4).pending).toBe(0);
  });
  it('combines coincident branches of one emission without combining different generators or emissions', () => {
    const model = started();
    model.event({ type: 'trigger', trigger: trigger({ id: 't2' }) }, scene());
    expect(model.frame(2).sparks).toHaveLength(1); expect(model.frame(2).merged).toBe(1);
    model.event({ type: 'trigger', trigger: trigger({ id: 't3', generatorId: 'g2' }) }, { ...scene(), pieces: [...scene().pieces, newPiece('generator', 0, 'g2')] });
    model.event({ type: 'trigger', trigger: trigger({ id: 't4', emission: 1.1 }) }, scene());
    expect(model.frame(2).sparks).toHaveLength(3);
  });
  it('removes canceled, deleted, and reset journeys, even at low frame rates', () => {
    const model = started(); model.event({ type: 'cancel', ids: ['t'], nodeIds: [], reason: 'late onset dropped' }, scene());
    expect(model.frame(3).pending).toBe(0); expect(model.frame(4).flashes.has('n')).toBe(false);
    const deleted = started(); deleted.setScene({ ...scene(), pieces: [scene().pieces[0]] }, 2);
    expect(deleted.frame(2).pending).toBe(0);
    const reset = started(); reset.event({ type: 'reset', session: 's', reason: 'pause' }, scene());
    expect(reset.frame(2)).toMatchObject({ pending: 0, sparks: [] }); expect(reset.frame(2).flashes.size).toBe(0);
    const skipped = started(); expect(skipped.frame(10).pending).toBe(0); expect(skipped.frame(10).sparks).toHaveLength(0);
  });
  it('reacts locally to instant notes and waits for audible time when onset events arrive early', () => {
    const t = trigger({ onset: 1 }), model = started(t);
    expect(model.frame(1).sparks).toHaveLength(0);
    model.event({ type: 'onset', trigger: t }, scene());
    expect(model.frame(0.99).flashes.has('n')).toBe(false);
    expect(model.frame(1).flashes.get('n')).toBe(1);
  });
  it('bounds drawing and pending state while preserving every real onset reaction', () => {
    const model = new StrutSparkModel(), s = scene();
    for (let i = 0; i < LIMITS.pending + 10; i++) model.event({ type: 'trigger', trigger: trigger({ id: `t${i}`, emission: i / 100000 }) }, s);
    const frame = model.frame(1);
    expect(frame.pending).toBe(LIMITS.pending); expect(frame.sparks).toHaveLength(MAX_VISIBLE_SPARKS);
    model.event({ type: 'onset', trigger: trigger({ id: 'not-rendered' }) }, s);
    expect(model.frame(4).flashes.get('n')).toBe(1);
  });
  it('adds source provenance without changing the engine timing or scene', () => {
    const s = scene(), before = structuredClone(s), engine = new Engine(s);
    engine.play(0); engine.advance(0); const events = engine.drain();
    const emitted = events.find(e => e.type === 'emission'); expect(emitted).toMatchObject({ sourceVertex: 0 });
    const model = new StrutSparkModel(); for (const event of events) model.event(event, s);
    expect(s).toEqual(before);
    const scheduled = events.find(e => e.type === 'trigger');
    if (scheduled?.type !== 'trigger') throw Error('Expected trigger');
    expect(model.frame(scheduled.trigger.onset - 0.000001).sparks).toHaveLength(1);
    expect(model.frame(scheduled.trigger.onset).sparks).toHaveLength(0);
  });
});

it('reuses a fixed render allocation and hides motion without suppressing local musical feedback', () => {
  const model = started(), visual = new StrutSparkRenderer();
  const resources = visual.children.map(child => (child as THREE.Mesh).geometry);
  for (const time of [1, 2, 3]) visual.update(model.frame(time).sparks, 0xffcc00, 1, false);
  expect(visual.children.map(child => (child as THREE.Mesh).geometry)).toEqual(resources);
  visual.update(model.frame(3).sparks, 0xffcc00, 1, true);
  expect(visual.visible).toBe(false);
  model.event({ type: 'onset', trigger: trigger() }, scene());
  expect(model.frame(4).flashes.get('n')).toBe(1);
});
