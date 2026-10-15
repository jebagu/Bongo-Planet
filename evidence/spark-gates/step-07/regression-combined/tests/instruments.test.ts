import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { INSTRUMENTS, instrumentScene } from '../src/core/instruments';
import { emptyLegacyScene as emptyScene, newPiece, validateScene, type Trigger } from '../src/core/contracts';
import { soundFor } from '../src/core/engine';
import { MonoSynth } from '../src/audio/synth';
import { SAMPLE_ROOT_HZ, type SampleBank, type InstrumentSample } from '../src/audio/samples';
import { createToy } from '../src/view/art/toys';
import { DEFAULT_APPEARANCE } from '../src/view/art/appearance';
import { packetSchema } from '../src/output/protocol';

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
const bank = Object.fromEntries(INSTRUMENTS.map(i => [i.id, wav(`public/audio/harmony-bloom/${i.id}.wav`)])) as SampleBank;
const trigger = (instrument: typeof INSTRUMENTS[number]['id'], frequency = SAMPLE_ROOT_HZ): Trigger => ({ id: 't', session: 's', sequence: 1, generatorId: 'g', nodeId: 'n', emission: 0, onset: 0.1, beat: 0, angle: 0, position: [1,0,0], sound: { kind: 'note', instrument, timbre: 'sine', frequency, duration: 8, level: 1 } });

describe('Harmony Bloom instruments', () => {
  it('copies all five original WAVs byte for byte', () => {
    const manifest = JSON.parse(readFileSync('research/harmony-bloom/manifest.json','utf8'));
    INSTRUMENTS.forEach((i, index) => expect(createHash('sha256').update(readFileSync(`public/audio/harmony-bloom/${i.id}.wav`)).digest('hex')).toBe(manifest.resources[index].sha256));
  });
  it.each(INSTRUMENTS)('plays actual $name PCM at root and octave with exact onset and stereo', ({id}) => {
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
