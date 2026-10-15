import { describe, expect, it } from 'vitest';
import { emptyLegacyScene as emptyScene, newPiece, validateScene, LIMITS, type Scene, type EngineEvent } from '../src/core/contracts';
import { topology, angle } from '../src/core/geometry';
import { generatorRoutes, seamDistance } from '../src/core/routes';
import { Engine } from '../src/core/engine';
import { MonoSynth } from '../src/audio/synth';
import { StrutSparkModel } from '../src/view/StrutSparkModel';
import { routeThrough, strutPoints, SEAM_RADIUS } from '../src/view/strutRoutes';

function scene(source = 44): Scene {
  const s = emptyScene(); s.settings.propagation = 'routes'; s.pieces = [newPiece('generator', source, 'g')];
  if (s.pieces[0].kind === 'generator') { s.pieces[0].period = 8; s.pieces[0].reach = 120; }
  return s;
}
function tick(engine: Engine, until: number) {
  const events: EngineEvent[] = [];
  while (engine.now < until - 1e-10) { engine.advance(Math.min(until, engine.now + 0.001)); events.push(...engine.drain()); }
  return events;
}
const routes = (events: EngineEvent[]) => events.filter(e => e.type === 'route').map(e => e.route);
const onsets = (events: EngineEvent[]) => events.filter(e => e.type === 'onset').map(e => e.trigger);
const triggers = (events: EngineEvent[]) => events.filter(e => e.type === 'trigger').map(e => e.trigger);
const separation = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));

describe('geometry-owned routes', () => {
  it('covers the reachable region with adjacent walks and distinct outgoing seams, for every source', () => {
    for (let source = 0; source < 92; source++) for (const reach of [0, 20, 60, 90, 120, 180]) {
      const plans = generatorRoutes(source, reach);
      const seen = new Set(plans.flatMap(plan => plan.vertices));
      expect(new Set(plans.map(plan => plan.vertices[1])).size).toBe(plans.length);
      expect(plans.length).toBeLessThanOrEqual(topology.neighbors[source].length);
      topology.vertices.forEach((p, vertex) => {
        if (vertex !== source && angle(topology.vertices[source], p) <= reach * Math.PI / 180 + 1e-9) expect(seen.has(vertex)).toBe(true);
      });
      for (const plan of plans) {
        expect(plan.vertices.length).toBeLessThanOrEqual(LIMITS.routeSteps);
        expect(plan.vertices[0]).toBe(source);
        for (let i = 1; i < plan.vertices.length; i++) {
          expect(topology.neighbors[plan.vertices[i - 1]]).toContain(plan.vertices[i]);
          expect(plan.distances[i] - plan.distances[i - 1]).toBeCloseTo(seamDistance(plan.vertices[i - 1], plan.vertices[i]), 10);
        }
      }
    }
  });
  it('uses one straight segment per seam and exactly the planet vertex positions', () => {
    for (const [a, b] of topology.edges) {
      const points = strutPoints(a, b, 'seams'); expect(points).toHaveLength(2);
      expect(points[0]).toEqual([topology.vertices[a][0] * SEAM_RADIUS, topology.vertices[a][2] * SEAM_RADIUS, -topology.vertices[a][1] * SEAM_RADIUS]);
      expect(points[1]).toEqual([topology.vertices[b][0] * SEAM_RADIUS, topology.vertices[b][2] * SEAM_RADIUS, -topology.vertices[b][1] * SEAM_RADIUS]);
    }
  });
});

describe('one spark plays a route', () => {
  it('does not create routes or change their speed when instruments are added', () => {
    const a = scene(), b = scene(); b.pieces.push(newPiece('note', 62, 'n'), newPiece('beat', 78, 'b'));
    const run = (s: Scene) => { const engine = new Engine(s); engine.play(0); engine.advance(0); return routes(engine.drain()); };
    const bare = run(a), occupied = run(b);
    expect(occupied.map(r => [r.vertices, r.arrivals, r.speed])).toEqual(bare.map(r => [r.vertices, r.arrivals, r.speed]));
    expect(new Set(occupied.map(r => r.speed)).size).toBe(1);
    expect(occupied.every(r => r.emission === 0 && r.arrivals.at(-1)! <= 3 + 1e-9)).toBe(true);
  });
  it('uses the same route identity to sound multiple pieces at exact passage times', () => {
    const s = scene(), plan = generatorRoutes(44, 120).find(p => new Set(p.vertices).size >= 4)!;
    const vertices = [...new Set(plan.vertices)].slice(1, 4);
    s.pieces.push(newPiece('note', vertices[0], 'n1'), newPiece('beat', vertices[1], 'drum'), newPiece('note', vertices[2], 'n2'));
    const engine = new Engine(s), model = new StrutSparkModel(); model.setSurface('seams');
    engine.play(0); engine.advance(0); const initial = engine.drain();
    for (const event of initial) model.event(event, s);
    const route = routes(initial).find(r => r.vertices[1] === plan.vertices[1])!;
    const committed = triggers(initial).filter(t => t.routeId === route.id);
    expect(new Set(committed.map(t => t.nodeId))).toEqual(new Set(['n1', 'drum', 'n2']));
    const path = routeThrough(route.vertices, 'seams');
    for (const t of committed) {
      expect(t.onset).toBe(route.arrivals[t.routeStep!]);
      const head = model.frame(t.onset).sparks.find(spark => spark.routeId === route.id)!;
      expect(separation(head.point, path.points[t.routeStep!])).toBeLessThan(1e-10);
    }
    // frame() is monotonic in production; use a fresh model for the actual timeline.
    const timeline = new StrutSparkModel(); timeline.setSurface('seams'); for (const event of initial) timeline.event(event, s);
    const emittedCount = routes(initial).length;
    const before = timeline.frame(0.001); expect(before.sparks).toHaveLength(emittedCount);
    const played = tick(engine, route.arrivals.at(-1)!);
    const hits = onsets(played).filter(t => t.routeId === route.id);
    expect(hits.map(t => [t.nodeId, t.onset])).toEqual(committed.map(t => [t.nodeId, t.onset]).sort((a, b) => Number(a[1]) - Number(b[1])));
    for (const event of played) timeline.event(event, s);
    expect(engine.snapshot().routeHits).toBe(onsets(played).length);
    expect(engine.lateDrops).toBe(0);
  });
  it('keeps equal physical speed between consecutive vertices and in the middle of every seam', () => {
    const s = scene(), engine = new Engine(s); engine.play(0); engine.advance(0); const emitted = routes(engine.drain());
    for (const route of emitted) for (let step = 1; step < route.vertices.length; step++) {
      expect(seamDistance(route.vertices[step - 1], route.vertices[step]) / (route.arrivals[step] - route.arrivals[step - 1])).toBeCloseTo(route.speed, 9);
      const model = new StrutSparkModel(); model.setSurface('seams'); model.event({ type: 'route', route }, s);
      const time = (route.arrivals[step - 1] + route.arrivals[step]) / 2;
      const head = model.frame(time).sparks[0];
      const points = strutPoints(route.vertices[step - 1], route.vertices[step], 'seams');
      expect(separation(head.point, points[0].map((v, i) => (v + points[1][i]) / 2))).toBeLessThan(1e-10);
    }
  });
  it('schedules physical passage independently of the old rhythm grid and produces actual samples', () => {
    const s = scene(); const vertex = generatorRoutes(44, 120)[0].vertices[1]; s.pieces.push(newPiece('note', vertex, 'n'));
    const committed = (quantization: Scene['settings']['quantization']) => {
      const engine = new Engine({ ...s, settings: { ...s.settings, quantization } }); engine.play(0); engine.advance(0); return triggers(engine.drain());
    };
    expect(committed(0).map(t => t.onset)).toEqual(committed(0.25).map(t => t.onset));
    const t = committed(0)[0], synth = new MonoSynth(48000);
    synth.start(t, t.onset - 0.01);
    const pre = new Float32Array(128); synth.render(pre, t.onset - 0.01);
    expect(pre.every(v => v === 0)).toBe(true);
    const hit = new Float32Array(256); synth.render(hit, t.onset);
    expect(hit.some(v => Math.abs(v) > 0.001)).toBe(true);
  });
  it('moves and adds pieces onto remaining visits without redirecting or multiplying particles', () => {
    const s = scene(), plan = generatorRoutes(44, 120).find(p => p.vertices.length > 5)!;
    s.pieces.push(newPiece('note', plan.vertices[1], 'n'));
    const engine = new Engine(s); engine.play(0); engine.advance(0); const initial = engine.drain();
    const committed = triggers(initial).filter(t => t.nodeId === 'n');
    const target = [...new Set(plan.vertices)].at(-1)!;
    const changed = structuredClone(s); changed.pieces[1].vertex = target;
    engine.update(changed, 0.001); const edited = engine.drain();
    expect(routes(edited)).toHaveLength(0);
    expect(edited.some(e => e.type === 'cancel' && committed.some(t => e.ids.includes(t.id)))).toBe(true);
    const added = triggers(edited); expect(added.length).toBeGreaterThan(0);
    expect(added.every(t => t.position.every((v, i) => v === topology.vertices[target][i]))).toBe(true);
    const played = onsets(tick(engine, 3)); expect(played.some(t => committed.some(old => old.id === t.id))).toBe(false);
    expect(played.every(t => t.position.every((v, i) => v === topology.vertices[target][i]))).toBe(true);
    const empty = new Engine(scene()); empty.play(0); empty.advance(0); empty.drain();
    empty.update(changed, 0.001); expect(triggers(empty.drain()).length).toBeGreaterThan(0);
  });
  it('deleting a sound cancels its hits but deleting a generator stops its journeys', () => {
    const s = scene(); s.pieces.push(newPiece('note', generatorRoutes(44, 120)[0].vertices[1], 'n'));
    const engine = new Engine(s); engine.play(0); engine.advance(0); const initial = engine.drain();
    const model = new StrutSparkModel(); for (const event of initial) model.event(event, s);
    const withoutNote = { ...s, pieces: [s.pieces[0]] };
    engine.update(withoutNote, 0.001); for (const event of engine.drain()) model.event(event, withoutNote);
    expect(model.frame(0.001).journeys).toBe(routes(initial).length); expect(onsets(tick(engine, 0.1))).toHaveLength(0);
    engine.update({ ...s, pieces: [] }, 0.1); const deleted = engine.drain();
    expect(deleted.some(e => e.type === 'route-stop')).toBe(true);
    for (const event of deleted) model.event(event, { ...s, pieces: [] });
    expect(model.frame(0.1).journeys).toBe(0);
  });
  it('clears bounded route state on pause, mode changes, interruption, and capacity', () => {
    const s = scene(), engine = new Engine(s); engine.play(0); engine.advance(0); engine.drain();
    engine.pause(0.001); expect(engine.snapshot().routeJourneys).toBe(0);
    engine.play(1); tick(engine, 4); engine.update({ ...s, settings: { ...s.settings, propagation: 'radial' } }, 4);
    expect(engine.snapshot().routeJourneys).toBe(0);
    const interrupted = new Engine(s); interrupted.play(0); interrupted.advance(0); interrupted.drain(); interrupted.advance(1);
    expect(interrupted.snapshot()).toMatchObject({ running: false, routeJourneys: 0 });
    const capacity = new Engine(s); capacity.play(0); capacity.advance(0); capacity.drain();
    for (let i = 1; i < 100 && capacity.running; i++) {
      const changed = structuredClone(s); if (changed.pieces[0].kind === 'generator') changed.pieces[0].phase = (i * 0.01 * 2 + 0.00001) / 8;
      capacity.update(changed, i * 0.01); capacity.drain();
      expect(capacity.snapshot().routeJourneys).toBeLessThanOrEqual(LIMITS.routes);
    }
    expect(capacity.running).toBe(false); expect(capacity.snapshot().routeJourneys).toBe(0);
  });
  it('preserves legacy saved scenes and validates explicit playback modes', () => {
    const old = emptyScene(); expect(validateScene(old).settings.propagation).toBeUndefined();
    expect(validateScene(scene()).settings.propagation).toBe('routes');
    expect(() => validateScene({ ...old, settings: { ...old.settings, propagation: 'invalid' } })).toThrow();
  });
  it('keeps the maximum supported scene bounded and independent of render frequency', () => {
    const s = scene(0); s.settings.bpm = 180;
    s.pieces = Array.from({ length: 92 }, (_, vertex) => newPiece(vertex < 8 ? 'generator' : 'note', vertex, `p${vertex}`));
    for (const piece of s.pieces) if (piece.kind === 'generator') { piece.period = 1; piece.reach = 180; }
    const run = (fps: number) => {
      const engine = new Engine(s), model = new StrutSparkModel(); model.setSurface('seams'); engine.play(0);
      const result: [string, string, number, string | undefined][] = [];
      for (let time = 0; time <= 2; time += 0.005) {
        engine.advance(time); const events = engine.drain();
        for (const event of events) model.event(event, s);
        for (const hit of onsets(events)) result.push([hit.generatorId, hit.nodeId, hit.onset, hit.routeId?.replace(/^s\d+/, 'session')]);
        expect(engine.pendingCount).toBeLessThanOrEqual(LIMITS.pending);
        expect(engine.snapshot().routeJourneys).toBeLessThanOrEqual(48);
        if (Math.floor(time * fps) !== Math.floor((time - 0.005) * fps)) expect(model.frame(time).sparks.length).toBeLessThanOrEqual(48);
      }
      expect(engine.running).toBe(true); expect(engine.lateDrops).toBe(0); expect(result.length).toBeGreaterThan(4000);
      return result;
    };
    expect(run(2)).toEqual(run(60));
  });
});
