import { describe, expect, it } from 'vitest';
import { Engine } from '../src/core/engine';
import { History } from '../src/core/history';
import { validateScene, type EngineEvent, type Piece, type Scene, type Trigger } from '../src/core/contracts';

// Independently specified first-face corners: generator 0, sounds 3 and 9.
// Their angular distance quantizes to exactly one beat; at 120 BPM arrivals
// are .5 seconds after the literal emission times 0, 2, 4, 6. See Plan.md.
const generator: Piece = { id: 'original-generator', kind: 'generator', vertex: 0, period: 4, phase: 0, reach: 180, enabled: true };
const keptNote: Piece = { id: 'kept-note', kind: 'note', vertex: 3, degree: 0, octave: 4, timbre: 'sine', duration: .3, level: .4 };
const placedNote: Piece = { id: 'placed-note', kind: 'note', vertex: 9, degree: 0, octave: 4, timbre: 'triangle', duration: .7, level: .6 };
const restoredNote: Piece = { ...keptNote, id: 'restored-note' };
const keptBeat: Piece = { id: 'kept-beat', kind: 'beat', vertex: 9, sound: 'kick', decay: .2, level: .7 };
function scene(pieces: Piece[]): Scene {
 return validateScene({ version: 1, topology: 'icosa-3v-v1', settings: { bpm: 120, key: 9, scale: 'major', travel: .75, quantization: .25, volume: .65 }, pieces });
}

class EditTransport {
 readonly history = new History();
 readonly engine: Engine;
 readonly events: EngineEvent[] = [];
 current: Scene;
 constructor(initial: Scene) {
  this.current = structuredClone(initial); this.engine = new Engine(initial);
  this.engine.play(0); this.engine.advance(0); this.collect();
 }
 private collect() { this.events.push(...this.engine.drain()); }
 advance(time: number) {
  // Tick well below the interruption and late-onset limits; never skip time.
  while (this.engine.now < time) { this.engine.advance(Math.min(time, this.engine.now + .01)); this.collect(); }
 }
 edit(next: Scene, time: number) {
  this.advance(time); this.history.push(this.current, 'edit');
  this.current = structuredClone(next); this.engine.update(this.current, time); this.collect();
 }
 restore(direction: 'undo' | 'redo', time: number) {
  this.advance(time);
  const next = this.history[direction](this.current);
  expect(next).not.toBeNull(); expect(this.history.restorationMode).toBe('edit');
  this.current = next!; this.engine.update(this.current, time); this.collect();
 }
}
function triggers(events: EngineEvent[], type: 'trigger' | 'onset'): Trigger[] {
 return events.flatMap(event => event.type === type && 'trigger' in event ? [event.trigger] : []);
}
type Expected = readonly [sequence: number, nodeId: string, emission: number];
function assertLedger(transport: EditTransport, expected: Expected[], expectedOnsets: number[], cancelled: number[], removedNodeId: string, emissionTimes: number[]) {
 const engine = transport.engine, session = engine.session;
 const scheduled = triggers(transport.events, 'trigger');
 expect(scheduled.map(t => [t.sequence, t.nodeId])).toEqual(expected.map(([sequence, id]) => [sequence, id]));
 scheduled.forEach((t, i) => {
  const [sequence, nodeId, emission] = expected[i];
  expect(t.id).toBe(`${session}-${sequence}`); expect(t.session).toBe(session);
  expect(t.generatorId).toBe('original-generator'); expect(t.nodeId).toBe(nodeId);
  expect(t.emission).toBeCloseTo(emission, 9); expect(t.onset).toBeCloseTo(emission + .5, 9);
  expect(t.beat).toBeCloseTo(emission * 2, 9);
  const p = nodeId === 'placed-note' ? placedNote : nodeId === 'kept-beat' ? keptBeat : keptNote;
  const position = p.vertex === 3 ? [0, .5257311121191336, .85065080835204] : [-.85065080835204, 0, .5257311121191336];
  t.position.forEach((value, axis) => expect(value).toBeCloseTo(position[axis], 13));
  expect(t.sound).toEqual(p.kind === 'beat'
   ? { kind: 'beat', sound: 'kick', duration: .2, level: .7 }
   : { kind: 'note', frequency: 440, timbre: p.kind === 'note' ? p.timbre : 'sine', duration: p.kind === 'note' ? p.duration : 0, level: p.kind === 'note' ? p.level : 0 });
 });
 const sounded = triggers(transport.events, 'onset');
 expect(sounded.map(t => t.id)).toEqual(expectedOnsets.map(sequence => `${session}-${sequence}`));
 sounded.forEach(t => expect(t).toEqual(scheduled.find(original => original.id === t.id)));
 expect(new Set(scheduled.map(t => t.id)).size).toBe(scheduled.length);
 expect(new Set(sounded.map(t => t.id)).size).toBe(sounded.length);
 const cancels = transport.events.filter((e): e is Extract<EngineEvent, { type: 'cancel' }> => e.type === 'cancel');
 expect(cancels).toEqual(cancelled.map(sequence => ({ type: 'cancel', ids: [`${session}-${sequence}`], nodeIds: [removedNodeId], reason: 'delete' })));
 for (const sequence of cancelled) expect(sounded.some(t => t.id === `${session}-${sequence}`)).toBe(false);
 const emissions = transport.events.filter((e): e is Extract<EngineEvent, { type: 'emission' }> => e.type === 'emission');
 expect(emissions).toHaveLength(emissionTimes.length);
 emissions.forEach((e, i) => { expect(e.generatorId).toBe('original-generator'); expect(e.time).toBeCloseTo(emissionTimes[i], 9); expect(e.periodSeconds).toBe(2); });
 expect(transport.events.some(e => e.type === 'reset')).toBe(false);
 expect(engine.running).toBe(true); expect(engine.lateDrops).toBe(0); expect(engine.pendingCount).toBe(0);
 expect(engine.scene).toEqual(transport.current);
}

describe('history edits preserve future emission identities without reviving cancelled work', () => {
 it('S07-A8/A20: undo placement preserves survivor IDs; redo restores the piece only for fresh future triggers', () => {
  const base = scene([generator, keptNote]), placed = scene([generator, keptNote, placedNote]);
  const t = new EditTransport(base), originalSession = t.engine.session;
  t.edit(placed, .1); t.advance(2.1); t.restore('undo', 2.1);
  expect(t.current).toEqual(base); expect(t.history.canRedo).toBe(true);
  t.advance(4.1); t.restore('redo', 4.1);
  expect(t.current).toEqual(placed); expect(t.engine.session).toBe(originalSession);
  t.advance(6.6);
  assertLedger(t, [[1, 'kept-note', 0], [2, 'kept-note', 2], [3, 'placed-note', 2], [4, 'kept-note', 4], [5, 'kept-note', 6], [6, 'placed-note', 6]], [1, 2, 4, 5, 6], [3], 'placed-note', [0, 2, 4, 6]);
 });

 it('S07-A8/A22: undo deletion restores exact IDs, while redo and a second undo never revive old cancelled triggers', () => {
  const base = scene([generator, restoredNote, keptBeat]), deleted = scene([generator, keptBeat]);
  const t = new EditTransport(base), originalSession = t.engine.session;
  t.edit(deleted, .1); t.restore('undo', .2);
  expect(t.current).toEqual(base); t.advance(2.1); t.restore('redo', 2.1);
  expect(t.current).toEqual(deleted); t.advance(2.6); t.restore('undo', 2.6);
  expect(t.current).toEqual(base); expect(t.engine.session).toBe(originalSession);
  t.advance(4.6);
  assertLedger(t, [[1, 'restored-note', 0], [2, 'kept-beat', 0], [3, 'restored-note', 2], [4, 'kept-beat', 2], [5, 'restored-note', 4], [6, 'kept-beat', 4]], [2, 4, 5, 6], [1, 3], 'restored-note', [0, 2, 4]);
 });
});
