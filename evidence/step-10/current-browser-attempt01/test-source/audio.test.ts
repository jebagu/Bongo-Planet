import { describe, expect, it, vi } from 'vitest';
import { MonoSynth } from '../src/audio/synth';
import { Engine } from '../src/core/engine';
import { topology } from '../src/core/geometry';
import type { AudioCommand, AudioMessage } from '../src/audio/protocol';
import { emptyScene, newPiece, type Sound, type Trigger } from '../src/core/contracts';
const sampleRate = 48000;
const note: Sound = { kind: 'note', frequency: 440, timbre: 'sine', duration: 0.12, level: 0.8 };
function trigger(sequence: number, onset = 0, sound: Sound = note, nodeId = `n${sequence}`): Trigger {
  return { id: `t${sequence}`, session: 'analytic', sequence, nodeId, generatorId: 'g', onset, emission: 0, beat: 0, angle: 0, position: [1, 0, 0], sound };
}
function render(synth: MonoSynth, seconds: number, start = 0): Float32Array {
  const output = new Float32Array(Math.round(seconds * sampleRate));
  synth.render(output, start);
  return output;
}
function firstSignal(samples: Float32Array): number {
  return samples.findIndex(value => Math.abs(value) > 0.0001) / sampleRate;
}
describe('original mono synthesis', () => {
  it('renders empty/generator-only audio as exact silence', () => {
    const scene = emptyScene(); scene.pieces = [newPiece('generator', 0, 'g')];
    const engine = new Engine(scene), synth = new MonoSynth(sampleRate);
    engine.play(0);
    for (let start = 0; start < 1; start += 128 / sampleRate) {
      engine.advance(start + 128 / sampleRate);
      synth.apply(engine.drain(), start);
      const block = new Float32Array(128); synth.render(block, start);
      expect(block.every(value => value === 0)).toBe(true);
    }
  });
  it.each([0.25, 0.5, 0.75])('matches independently specified %ss onset within 5ms', onset => {
    const synth = new MonoSynth(sampleRate);
    synth.start(trigger(1, onset), 0);
    const output = render(synth, 1);
    expect(Math.abs(firstSignal(output) - onset)).toBeLessThan(0.005);
    expect(output.subarray(0, Math.floor(onset * sampleRate)).every(x => x === 0)).toBe(true);
  });
  it('starts non-quantum-aligned voices at exact sample offset', () => {
    const synth = new MonoSynth(sampleRate), start = 0.25, onset = start + 73 / sampleRate;
    synth.start(trigger(1, onset), start);
    const block = new Float32Array(128); synth.render(block, start);
    expect(block.subarray(0, 74).every(value => Math.abs(value) < 1e-9)).toBe(true);
    expect(block[75]).toBeGreaterThan(0);
  });
  it('preserves separate chord voices', () => {
    const synth = new MonoSynth(sampleRate);
    [261.625565, 329.627557, 391.995436].forEach((frequency, i) => synth.start(trigger(i, 0.25, { ...note, frequency }), 0));
    expect(synth.counters.activeVoices).toBe(3);
    expect(Math.abs(firstSignal(render(synth, 0.4)) - 0.25)).toBeLessThan(0.005);
  });
  it('produces independently expected 440Hz pitch', () => {
    const synth = new MonoSynth(sampleRate);
    synth.start(trigger(1, 0, { ...note, duration: 1 }), 0);
    const samples = render(synth, 0.2);
    function energyAt(frequency: number): number {
      let real = 0, imaginary = 0;
      for (let i = 480; i < samples.length; i++) {
        real += samples[i] * Math.cos(2 * Math.PI * frequency * i / sampleRate);
        imaginary += samples[i] * Math.sin(2 * Math.PI * frequency * i / sampleRate);
      }
      return real ** 2 + imaginary ** 2;
    }
    expect(energyAt(440)).toBeGreaterThan(100 * energyAt(220));
    expect(energyAt(440)).toBeGreaterThan(100 * energyAt(660));
  });
  it.each(['kick', 'hat', 'snare'] as const)('renders deterministic finite original %s percussion', sound => {
    const a = new MonoSynth(sampleRate), b = new MonoSynth(sampleRate);
    const t = trigger(1, 0, { kind: 'beat', sound, duration: 0.3, level: 1 });
    a.start(t, 0); b.start(t, 0);
    const left = render(a, 0.5), right = render(b, 0.5);
    expect(left).toEqual(right);
    expect(left.some(x => x !== 0)).toBe(true);
    expect(left.every(Number.isFinite)).toBe(true);
    expect(left.subarray(14400).every(x => x === 0)).toBe(true);
  });
  it('limits to64 voices, steals oldest onset then sequence, and protects peaks', () => {
    const overloaded = new MonoSynth(sampleRate), expected = new MonoSynth(sampleRate);
    for (let i = 1; i <= 80; i++) {
      const t = trigger(i, 0, { ...note, duration: 1, level: 1, frequency: 200 + i * 11 });
      overloaded.start(t, 0);
      if (i > 16) expected.start(t, 0);
    }
    expect(overloaded.counters).toEqual({ activeVoices: 64, stolenVoices: 16, lateDropsAudio: 0 });
    const output = render(overloaded, 0.2);
    expect(output).toEqual(render(expected, 0.2));
    expect(output.every(Number.isFinite)).toBe(true);
    expect(Math.max(...output.map(Math.abs))).toBeLessThan(0.99);
  });
  it('releases target voices within20ms while preserving unrelated voices', () => {
    const synth = new MonoSynth(sampleRate);
    synth.start(trigger(1, 0, { ...note, duration: 1 }, 'deleted'), 0);
    synth.start(trigger(2, 0, { ...note, duration: 1 }, 'kept'), 0);
    render(synth, 0.1);
    synth.releaseNodes(['deleted'], 0.1);
    render(synth, 0.03, 0.1);
    expect(synth.counters.activeVoices).toBe(1);
    synth.releaseAll(0.13);
    expect(render(synth, 0.03, 0.13).subarray(961).every(x => x === 0)).toBe(true);
    expect(synth.counters.activeVoices).toBe(0);
  });
  it('drops events over20ms late without a burst', () => {
    const synth = new MonoSynth(sampleRate);
    synth.start(trigger(1, 0), 0.021);
    expect(synth.counters.lateDropsAudio).toBe(1);
    expect(render(synth, 0.1, 0.021).every(x => x === 0)).toBe(true);
  });
  it('clear/reset fades all active audio', () => {
    const synth = new MonoSynth(sampleRate);
    synth.start(trigger(1, 0, { ...note, duration: 1 }), 0);
    synth.apply([{ type: 'reset', session: 'new', reason: 'clear' }], 0.1);
    const output = render(synth, 0.2, 0.1);
    expect(output.subarray(961).every(x => x === 0)).toBe(true);
  });
});


describe('worklet render-quantum integration (simulated processor environment)', () => {
  it('uses independent geometry timing and emits identical output channels', async () => {
    type Processor = { port: { onmessage: ((message: { data: AudioCommand }) => void) | null; postMessage: (message: AudioMessage) => void }; process: (inputs: Float32Array[][], outputs: Float32Array[][]) => boolean };
    let Constructor: (new () => Processor) | undefined;
    const messages: AudioMessage[] = [];
    class MockProcessor { port = { onmessage: null as Processor['port']['onmessage'], postMessage: (message: AudioMessage) => messages.push(message) }; }
    vi.stubGlobal('AudioWorkletProcessor', MockProcessor);
    vi.stubGlobal('sampleRate', sampleRate);
    vi.stubGlobal('currentTime', 0);
    vi.stubGlobal('registerProcessor', (_name: string, processor: new () => Processor) => { Constructor = processor; });
    try {
      await import('../src/audio/processor');
      expect(Constructor).toBeDefined();
      const processor = new Constructor!();
      const scene = emptyScene(); scene.settings.quantization = 0;
      const generator = newPiece('generator', 0, 'g');
      if (generator.kind === 'generator') generator.reach = 180;
      scene.pieces = [generator, newPiece('note', 1, 'n')];
      // Independent dot-product and analytic period/travel rule, not delayBeats().
      const a = topology.vertices[0], b = topology.vertices[1];
      const theta = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
      const stableStart = Math.ceil(0.25 * sampleRate / 128) * 128 / sampleRate;
      const expected = stableStart + 0.75 * 4 * theta / Math.PI * 0.5;
      processor.port.onmessage!({ data: { type: 'scene', scene, mode: 'load' } });
      processor.port.onmessage!({ data: { type: 'play' } });
      const total = Math.ceil((expected + 0.15) * sampleRate), mono = new Float32Array(total);
      for (let offset = 0; offset < total; offset += 128) {
        vi.stubGlobal('currentTime', offset / sampleRate);
        const left = mono.subarray(offset, Math.min(total, offset + 128)), right = new Float32Array(left.length);
        expect(processor.process([], [[left, right]])).toBe(true);
        expect(left).toEqual(right);
        processor.port.onmessage!({ data: { type: 'ack' } });
        processor.port.onmessage!({ data: { type: 'ackEvents' } });
      }
      expect(Math.abs(firstSignal(mono) - expected)).toBeLessThan(0.005);
      const onsets = messages.flatMap(message => message.type === 'events' ? message.events.filter(event => event.type === 'onset') : []);
      expect(onsets.length).toBe(1);
    } finally { vi.unstubAllGlobals(); }
  });
});
