import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { INSTRUMENTS, MELODIC_INSTRUMENTS, PERCUSSION_INSTRUMENTS, instrumentScene } from '../src/core/instruments';
import { emptyLegacyScene as emptyScene, newPiece, validateScene, type Trigger } from '../src/core/contracts';
import { soundFor } from '../src/core/engine';
import { MonoSynth } from '../src/audio/synth';
import { loadSamples, SAMPLE_ROOT_HZ, type SampleBank, type InstrumentSample } from '../src/audio/samples';
import { createToy } from '../src/view/art/toys';
import { DEFAULT_APPEARANCE } from '../src/view/art/appearance';
import { packetSchema } from '../src/output/protocol';
import { selectedControls } from '../src/view/selectionPanel';

function wav(path: string): InstrumentSample {
  const bytes = readFileSync(path);
  let data = 0, size = 0, channels = 0, rate = 0;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const name = bytes.toString('ascii', offset, offset + 4), length = bytes.readUInt32LE(offset + 4);
    if (name === 'fmt ') { expect(bytes.readUInt16LE(offset + 8)).toBe(1); channels = bytes.readUInt16LE(offset + 10); rate = bytes.readUInt32LE(offset + 12); expect(bytes.readUInt16LE(offset + 22)).toBe(16); }
    if (name === 'data') { data = offset + 8; size = length; break; }
    offset += 8 + length + length % 2;
  }
  expect(data).toBeGreaterThan(0);
  return { sampleRate: rate, channels: Array.from({ length: channels }, (_, channel) => Float32Array.from({ length: size / channels / 2 }, (_, i) => bytes.readInt16LE(data + (i * channels + channel) * 2) / 32768)) };
}
const bank = Object.fromEntries(INSTRUMENTS.map(i => {
  const takes = i.samples.map(path => wav(`public/${path}`));
  return [i.id, {...takes[0], ...(takes.length > 1 ? {alternates: takes.slice(1)} : {})}];
})) as SampleBank;
const trigger = (instrument: typeof INSTRUMENTS[number]['id'], frequency = SAMPLE_ROOT_HZ): Trigger => ({ id: 't', session: 's', sequence: 1, generatorId: 'g', nodeId: 'n', emission: 0, onset: 0.1, beat: 0, angle: 0, position: [1,0,0], sound: { kind: 'note', instrument, timbre: 'sine', frequency, duration: 8, level: 1 } });

describe('Harmony Bloom instruments', () => {
  it('copies all five original WAVs byte for byte', () => {
    const manifest = JSON.parse(readFileSync('research/harmony-bloom/manifest.json','utf8'));
    MELODIC_INSTRUMENTS.forEach((i, index) => expect(createHash('sha256').update(readFileSync(`public/audio/harmony-bloom/${i.id}.wav`)).digest('hex')).toBe(manifest.resources[index].sha256));
  });
  it.each(MELODIC_INSTRUMENTS)('plays actual $name PCM at root and octave with exact onset and stereo', ({id}) => {
    for (const ratio of [1, 2]) {
      const sample = bank[id], synth = new MonoSynth(44100, bank), left = new Float32Array(22050), right = new Float32Array(22050);
      synth.start(trigger(id, SAMPLE_ROOT_HZ * ratio), 0);
      synth.render(left, 0, 1, 0, false); synth.render(right, 0, 1, 1);
      expect(left.subarray(0,4410).every(x => x === 0)).toBe(true);
      expect(left.some(x => x !== 0)).toBe(true);
      for (const index of [5000,6000,10000,18000]) {
        const position = (index / 44100 - 0.1) * 44100 * ratio, lo = Math.floor(position), fraction = position-lo;
        for (const [channel, output] of [[0,left],[1,right]] as const) {
          const pcm = sample.channels[channel], raw = pcm[lo]*(1-fraction)+(pcm[lo+1]??0)*fraction;
          expect(output[index]).toBeCloseTo(0.98*Math.tanh(raw*0.65),6);
        }
      }
    }
  });
  it('ends at the natural sample boundary and cancels within 20ms', () => {
    const synth = new MonoSynth(44100, bank); synth.start(trigger('guitar'), 0);
    synth.render(new Float32Array(44100*3),0);
    expect(synth.counters.activeVoices).toBe(0);
    synth.start({...trigger('piano'),onset:3},3); synth.releaseNodes(['n'],3.1);
    const output = new Float32Array(4410); synth.render(output,3.1);
    expect(output.subarray(883).every(x=>x===0)).toBe(true);
    expect(synth.counters.activeVoices).toBe(0);
  });
  it('retains instrument, pitch and controls through JSON and legacy migration', () => {
    const scene = emptyScene(); scene.pieces = INSTRUMENTS.map((i,index)=>({...newPiece('note',index,`n${index}`),instrument:i.id}));
    expect(validateScene(JSON.parse(JSON.stringify(scene)))).toEqual(scene);
    for (const piece of scene.pieces) if (piece.kind==='note') expect(soundFor(piece,scene.settings)).toMatchObject({instrument:piece.instrument,frequency:SAMPLE_ROOT_HZ});
    scene.pieces=[newPiece('note',0,'old-note'),newPiece('beat',1,'old-beat')];
    const migrated = instrumentScene(scene);
    expect(migrated.pieces[0]).toMatchObject({id:'old-note',vertex:0,instrument:'piano'});
    expect(migrated.pieces[1]).toMatchObject({id:'old-beat',vertex:1,kind:'note',instrument:'marimba'});
    expect(instrumentScene(migrated)).toEqual(migrated);
    expect(validateScene(migrated)).toEqual(migrated);
  });
  it.each(INSTRUMENTS)('carries $name identity through the companion output contract', ({id}) => {
    const packet={version:1,type:'trigger',session:'s',sequence:1,triggerSequence:1,id:'s-1',objectId:1,nodeId:'n',generatorId:'g',onset:1,sound:trigger(id).sound};
    expect(packetSchema.parse(packet)).toEqual(packet);
  });
  it.each(INSTRUMENTS)('builds an editable footless $name character', ({id}) => {
    const toy = createToy('note', {...DEFAULT_APPEARANCE},id);
    expect(toy.group.name).toContain(id);
    expect(toy.eyes.children).toHaveLength(4);
    expect(toy.group.getObjectByName('Feet')).toBeUndefined();
    expect(toy.group.getObjectByName('Body')!.children.length).toBeGreaterThan(1);
  });
});

describe('sampled percussion instruments', () => {
  it('keeps all ten CC0 recordings identical to the prepared selection', () => {
    const manifest = JSON.parse(readFileSync('public/audio/percussion/source-manifest.json', 'utf8'));
    expect(manifest.samples).toHaveLength(10);
    for (const sample of manifest.samples) {
      expect(sample.license).toBe('CC0-1.0');
      expect(createHash('sha256').update(readFileSync(`public/audio/percussion/${sample.id}.wav`)).digest('hex')).toBe(sample.prepared.sha256);
    }
  });
  it.each(PERCUSSION_INSTRUMENTS)('plays the whole $name hit without pitch changes or an added attack', ({id}) => {
    const sample = bank[id];
    for (const frequency of [SAMPLE_ROOT_HZ / 2, SAMPLE_ROOT_HZ * 2]) {
      const synth = new MonoSynth(48000, bank), length = 4800 + sample.channels[0].length + 100;
      const left = new Float32Array(length), right = new Float32Array(length);
      const hit = trigger(id, frequency);
      hit.sound.duration = 0.05;
      synth.start(hit, 0);
      synth.render(left, 0, 1, 0, false); synth.render(right, 0, 1, 1);
      expect(left.subarray(0, 4800).every(x => x === 0)).toBe(true);
      expect(left).toEqual(right);
      for (const offset of [48, 96, 1000, 12000, 20000]) {
        if (offset >= sample.channels[0].length) continue;
        expect(left[4800 + offset]).toBeCloseTo(0.98 * Math.tanh(sample.channels[0][offset] * 0.65), 6);
      }
      expect(left.subarray(4800 + 2400, length - 100).some(x => x !== 0)).toBe(true);
      expect(left.subarray(length - 99).every(x => x === 0)).toBe(true);
      expect(synth.counters.activeVoices).toBe(0);
    }
    const scene = emptyScene(), piece = {...newPiece('note', 0, 'drum'), instrument: id, degree: 6, octave: 6};
    expect(soundFor(piece, {...scene.settings, key: 11, scale: 'minor'})).toMatchObject({instrument: id, frequency: SAMPLE_ROOT_HZ});
    const scheduled = soundFor({...piece, duration: 0.05}, scene.settings);
    const longest = Math.max(sample.channels[0].length / sample.sampleRate, ...sample.alternates!.map(take => take.channels[0].length / take.sampleRate));
    expect(scheduled.duration).toBeGreaterThanOrEqual(longest);
    expect(scheduled.duration).toBeLessThan(longest + 0.001);
    const controls = selectedControls(piece, scene.settings);
    expect(controls).toContain('One hit at its natural pitch');
    expect(controls).not.toContain('data-field="degree"');
    expect(controls).not.toContain('data-field="octave"');
    expect(controls).not.toContain('data-field="duration"');
  });
  it('alternates real takes while cancellation retains the other node’s independent voice', () => {
    const synth = new MonoSynth(48000, bank);
    synth.start({...trigger('kick'), id: 't-1', nodeId: 'first'}, 0);
    synth.start({...trigger('kick'), id: 't-2', sequence: 2, nodeId: 'second'}, 0);
    synth.releaseNodes(['first'], 0.1);
    const output = new Float32Array(9600); synth.render(output, 0);
    const pcm = bank.kick.alternates![0].channels[0];
    for (const offset of [1500, 2000, 3000]) expect(output[4800 + offset]).toBeCloseTo(0.98 * Math.tanh(pcm[offset] * 0.65), 6);
    expect(synth.counters.activeVoices).toBe(1);
    synth.releaseAll(0.2); synth.render(new Float32Array(4800), 0.2);
    expect(synth.counters.activeVoices).toBe(0);
  });
  it('loads the catalog’s melodic files and both takes of each percussion voice', async () => {
    const requests: string[] = [], pcm = new Float32Array([0, 0.25, -0.25]);
    vi.stubGlobal('fetch', async (url: string) => { requests.push(url); return {ok: true, arrayBuffer: async () => new ArrayBuffer(0)}; });
    const context = {decodeAudioData: vi.fn(async () => ({numberOfChannels: 1, sampleRate: 48000, getChannelData: () => pcm}))} as unknown as AudioContext;
    try {
      const loaded = await loadSamples(context);
      expect(requests).toHaveLength(15);
      for (const item of INSTRUMENTS) for (const path of item.samples) expect(requests.filter(url => url.endsWith(path))).toHaveLength(1);
      for (const item of PERCUSSION_INSTRUMENTS) {
        expect(loaded[item.id].alternates).toHaveLength(1);
        expect(loaded[item.id].channels[0]).not.toBe(pcm);
      }
    } finally { vi.unstubAllGlobals(); }
  });
  it('reports the instrument when a percussion file fails to load', async () => {
    vi.stubGlobal('fetch', async (url: string) => ({ok: !url.endsWith('percussion/kick-A.wav'), status: 404, arrayBuffer: async () => new ArrayBuffer(0)}));
    const context = {decodeAudioData: async () => ({numberOfChannels: 1, sampleRate: 48000, getChannelData: () => new Float32Array([0])})} as unknown as AudioContext;
    try { await expect(loadSamples(context)).rejects.toThrow('Could not load kick sample (404)'); }
    finally { vi.unstubAllGlobals(); }
  });
});
