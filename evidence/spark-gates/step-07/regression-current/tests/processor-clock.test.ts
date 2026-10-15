import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyLegacyScene as emptyScene, newPiece, type EngineEvent, type Scene } from '../src/core/contracts';
import { topology } from '../src/core/geometry';
import type { AudioCommand, AudioMessage } from '../src/audio/protocol';

const SAMPLE_RATE = 48000;
const QUANTUM = 128 / SAMPLE_RATE;
type Processor = {
  messages: AudioMessage[];
  port: { onmessage: ((message: { data: AudioCommand }) => void) | null };
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
};

afterEach(() => vi.unstubAllGlobals());

async function processors(count = 1): Promise<Processor[]> {
  vi.resetModules();
  let Constructor: (new () => Processor) | undefined;
  vi.stubGlobal('sampleRate', SAMPLE_RATE);
  vi.stubGlobal('currentTime', 0);
  vi.stubGlobal('AudioWorkletProcessor', class {
    messages: AudioMessage[] = [];
    port = {
      onmessage: null,
      postMessage: (message: AudioMessage) => this.messages.push(structuredClone(message)),
    };
  });
  vi.stubGlobal('registerProcessor', (_name: string, ctor: new () => Processor) => { Constructor = ctor; });
  await import('../src/audio/processor');
  if (!Constructor) throw Error('Processor was not registered');
  return Array.from({ length: count }, () => new Constructor!());
}

function scene(): Scene {
  const s = emptyScene();
  s.settings.travel = 0.25;
  s.settings.quantization = 0;
  const generator = newPiece('generator', 0, 'g');
  generator.reach = 180;
  generator.period = 1;
  const note = newPiece('note', 4, 'n');
  note.duration = 0.4;
  s.pieces = [generator, note];
  return s;
}

function command(p: Processor, data: AudioCommand, rawTime: number): void {
  vi.stubGlobal('currentTime', rawTime);
  p.port.onmessage!({ data });
}

function step(p: Processor, rawTime: number): Float32Array {
  vi.stubGlobal('currentTime', rawTime);
  const output = new Float32Array(128);
  expect(p.process([], [[output]])).toBe(true);
  p.port.onmessage!({ data: { type: 'ack' } });
  p.port.onmessage!({ data: { type: 'ackEvents' } });
  return output;
}

function start(p: Processor): void {
  command(p, { type: 'scene', scene: scene(), mode: 'load' }, 0);
  command(p, { type: 'play' }, 0);
}

function events(p: Processor): EngineEvent[] {
  return p.messages.flatMap(message => message.type === 'events' ? message.events : []);
}

function errors(p: Processor): string[] {
  return p.messages.flatMap(message => message.type === 'error' ? [message.message] : []);
}

function musicalTimes(p: Processor) {
  const times: { type: string; time?: number; sequence?: number; onset?: number }[] = [];
  for (const event of events(p)) {
    if (event.type === 'emission') times.push({ type: event.type, time: event.time });
    else if (event.type === 'trigger' || event.type === 'onset') times.push({ type: event.type, sequence: event.trigger.sequence, onset: event.trigger.onset });
  }
  return times;
}

function maxError(a: Float32Array, b: Float32Array): number {
  let maximum = 0;
  for (let i = 0; i < a.length; i++) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
  return maximum;
}

describe('production processor clock correction (simulated worklet, real PCM)', () => {
  it('matches independently advancing PCM through one/two repeated clocks and recovery', async () => {
    const [reference, affected] = await processors(2);
    start(reference); start(affected);
    let error = 0, audibleBlocks = 0;
    for (let index = 0; index < 600; index++) {
      // Independent expected clock uses sample count; stale readings mirror actual traces.
      const normalTime = index * 128 / SAMPLE_RATE;
      const staleTime = index === 200 ? 199 * QUANTUM : index === 350 || index === 351 ? 349 * QUANTUM : normalTime;
      const expected = step(reference, normalTime), actual = step(affected, staleTime);
      error = Math.max(error, maxError(expected, actual));
      if (expected.some(value => Math.abs(value) > 0.001)) audibleBlocks++;
    }
    expect(audibleBlocks).toBeGreaterThan(100);
    expect(error).toBeLessThan(1e-6);
    expect(errors(affected)).toEqual([]);
    expect(musicalTimes(affected)).toEqual(musicalTimes(reference));
    // Independently apply the dot-product angle and travel/tempo formula,
    // without the engine's angle or delay helpers.
    const a = topology.vertices[0], b = topology.vertices[4];
    const theta = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    const expectedFirst = Math.ceil(0.25 / QUANTUM) * QUANTUM + 0.25 * theta / Math.PI * 0.5;
    const onsets = events(affected).flatMap(event => event.type === 'onset' ? [event.trigger.onset] : []);
    expect(onsets).toHaveLength(3);
    onsets.forEach((time, index) => expect(time).toBeCloseTo(expectedFirst + index * 0.5, 8));
    for (const type of ['trigger', 'onset'] as const) {
      const ids = events(affected).flatMap(event => event.type === type ? [event.trigger.id] : []);
      expect(ids.length).toBeGreaterThan(1);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('edits and pauses during double-repeat correction at the same musical time as the reference', async () => {
    const [reference, affected] = await processors(2);
    start(reference); start(affected);
    const edited = scene(); edited.settings.key = 3;
    let error = 0;
    for (let index = 0; index < 430; index++) {
      const normalTime = index * 128 / SAMPLE_RATE;
      const staleTime = index === 350 || index === 351 ? 349 * QUANTUM : normalTime;
      error = Math.max(error, maxError(step(reference, normalTime), step(affected, staleTime)));
      if (index === 350) {
        command(reference, { type: 'scene', scene: edited, mode: 'edit' }, normalTime);
        command(affected, { type: 'scene', scene: edited, mode: 'edit' }, staleTime);
      }
      if (index === 351) {
        command(reference, { type: 'pause' }, normalTime);
        command(affected, { type: 'pause' }, staleTime);
      }
    }
    expect(errors(affected)).toEqual([]);
    expect(error).toBeLessThan(1e-6);
    expect(musicalTimes(affected)).toEqual(musicalTimes(reference));
    expect(step(affected, 430 * QUANTUM).every(value => value === 0)).toBe(true);
    expect(events(affected).some(event => event.type === 'reset' && event.reason === 'pause')).toBe(true);
  });

  it.each(['load', 'clear'] as const)('%s while the clock lags releases and stays paused', async mode => {
    const [p] = await processors(); start(p);
    for (let i = 0; i < 350; i++) step(p, i * QUANTUM);
    step(p, 349 * QUANTUM);
    const replacement = mode === 'clear' ? emptyScene() : scene();
    command(p, { type: 'scene', scene: replacement, mode }, 349 * QUANTUM);
    for (let i = 351; i < 400; i++) step(p, i * QUANTUM);
    expect(errors(p)).toEqual([]);
    expect(step(p, 400 * QUANTUM).every(value => value === 0)).toBe(true);
    const lastStatus = p.messages.filter(message => message.type === 'telemetry').at(-1);
    expect(lastStatus?.status.running).toBe(false);
    expect(lastStatus?.status.pending).toBe(0);
    expect(lastStatus?.status.beat).toBe(0);
  });

  it('does not render behind a command that advanced engine time past the preceding block', async () => {
    const [reference, affected] = await processors(2); start(reference); start(affected);
    for (let i = 0; i < 200; i++) { step(reference, i * QUANTUM); step(affected, i * QUANTUM); }
    const commandTime = 200 * QUANTUM + QUANTUM / 2;
    const edited = scene(); edited.settings.key = 3;
    command(reference, { type: 'scene', scene: edited, mode: 'edit' }, commandTime);
    command(affected, { type: 'scene', scene: edited, mode: 'edit' }, commandTime);
    expect(maxError(step(reference, commandTime), step(affected, 200 * QUANTUM))).toBeLessThan(1e-6);
    expect(errors(affected)).toEqual([]);
    expect(musicalTimes(affected)).toEqual(musicalTimes(reference));
  });

  it.each([0.02, 0.02 + 0.005 / SAMPLE_RATE])('accepts bounded %.9f second lag with fractional-sample tolerance', async lag => {
    const [reference, affected] = await processors(2); start(reference); start(affected);
    for (let i = 0; i < 200; i++) { step(reference, i * QUANTUM); step(affected, i * QUANTUM); }
    const expected = step(reference, 200 * QUANTUM), actual = step(affected, 200 * QUANTUM - lag);
    expect(errors(affected)).toEqual([]);
    expect(maxError(expected, actual)).toBeLessThan(1e-6);
  });

  it.each(['render', 'edit'] as const)('fails visibly and stops for >20ms backward %s clock', async path => {
    const [p] = await processors(); start(p);
    for (let i = 0; i < 200; i++) step(p, i * QUANTUM);
    const rawTime = 200 * QUANTUM - 0.02 - 1 / SAMPLE_RATE;
    if (path === 'render') expect(step(p, rawTime).every(value => value === 0)).toBe(true);
    else command(p, { type: 'scene', scene: scene(), mode: 'edit' }, rawTime);
    expect(errors(p)).toHaveLength(1);
    expect(events(p).some(event => event.type === 'reset' && event.reason === 'processor error')).toBe(true);
    const previousEmissions = events(p).filter(event => event.type === 'emission').length;
    for (let i = 200; i < 400; i++) step(p, i * QUANTUM);
    expect(errors(p)).toHaveLength(1);
    expect(events(p).filter(event => event.type === 'emission')).toHaveLength(previousEmissions);
    expect(step(p, 400 * QUANTUM).every(value => value === 0)).toBe(true);
    expect(p.messages.filter(message => message.type === 'telemetry').at(-1)?.status.running).toBe(false);
  });

  it('does not indefinitely advance audio behind a frozen raw clock', async () => {
    const [p] = await processors(); start(p);
    for (let i = 0; i < 200; i++) step(p, i * QUANTUM);
    for (let i = 200; i < 207; i++) step(p, 199 * QUANTUM);
    expect(errors(p)).toEqual([]);
    expect(step(p, 199 * QUANTUM).every(value => value === 0)).toBe(true);
    expect(errors(p)).toHaveLength(1);
    command(p, { type: 'play' }, 1);
    expect(step(p, 1).every(value => value === 0)).toBe(true);
    expect(errors(p)).toHaveLength(1);
  });

  it.each([NaN, Infinity, -Infinity])('latches a nonfinite clock without nonfinite cleanup or repeated errors (%s)', async rawTime => {
    const [p] = await processors(); start(p);
    for (let i = 0; i < 200; i++) step(p, i * QUANTUM);
    for (let i = 0; i < 4; i++) expect(step(p, rawTime).every(value => value === 0)).toBe(true);
    const status = p.messages.filter(message => message.type === 'telemetry').at(-1)?.status;
    expect(status?.running).toBe(false);
    expect(Number.isFinite(status?.time)).toBe(true);
    expect(Number.isFinite(status?.beat)).toBe(true);
    expect(errors(p)).toHaveLength(1);
    expect(errors(p)[0]).toContain('Reload to recover.');
    command(p, { type: 'play' }, 1);
    expect(step(p, 1).every(value => value === 0)).toBe(true);
    expect(errors(p)).toHaveLength(1);
  });

  it('retains >100ms forward interruption and explicit-play warmup', async () => {
    const [p] = await processors(); start(p);
    for (let i = 0; i < 200; i++) step(p, i * QUANTUM);
    step(p, 0.8);
    expect(events(p).some(event => event.type === 'reset' && event.reason === 'interrupted clock')).toBe(true);
    const count = events(p).filter(event => event.type === 'emission').length;
    for (let i = 301; i < 450; i++) step(p, i * QUANTUM);
    expect(events(p).filter(event => event.type === 'emission')).toHaveLength(count);
    command(p, { type: 'play' }, 450 * QUANTUM);
    for (let i = 450; i < 530; i++) step(p, i * QUANTUM);
    expect(p.messages.filter(message => message.type === 'telemetry').at(-1)?.status.running).toBe(false);
    for (let i = 530; i < 600; i++) step(p, i * QUANTUM);
    expect(p.messages.filter(message => message.type === 'telemetry').at(-1)?.status.running).toBe(true);
    expect(errors(p)).toEqual([]);
  });
});
