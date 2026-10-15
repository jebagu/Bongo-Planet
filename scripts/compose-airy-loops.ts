import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { exportCompositionFile, importCompositionFile } from '../src/compositionFile';
import { emptyScene, validateScene, type EngineEvent, type Scene } from '../src/core/contracts';
import { Engine } from '../src/core/engine';
import { topology } from '../src/core/geometry';
import { INSTRUMENTS, type Instrument } from '../src/core/instruments';
import { labelPieces } from '../src/core/pieceLabels';
import { MonoSynth } from '../src/audio/synth';
import type { InstrumentSample, SampleBank } from '../src/audio/samples';
import { DEFAULT_APPEARANCE } from '../src/view/art/appearance';
import { applyLookTheme, LOOK_THEMES } from '../src/view/art/themes';

const destination = 'public/compositions/airy-loops';
const bpm = 40, cycleSeconds = 24, sampleRate = 48000, quantum = 128 / sampleRate;
const scene = emptyScene();
scene.settings = { ...scene.settings, bpm, key: 9, scale: 'minor', volume: 0.62 };

// Four meridians descend for thirteen hops, merging into two quiet return lanes.
// These are adjacent-strut walks; a complete north-to-north journey is 24 hops.
const descents = [
  [38, 40, 8, 5, 7, 4, 0, 22, 16, 25, 26, 27, 52, 54],
  [38, 87, 35, 34, 32, 31, 12, 60, 21, 58, 56, 55, 90, 53],
  [38, 41, 42, 88, 43, 44, 45, 47, 78, 89, 49, 50, 52, 54],
  [38, 66, 68, 65, 67, 64, 61, 79, 74, 81, 82, 83, 90, 53],
];
const returns = [
  [54, 18, 17, 19, 10, 11, 14, 13, 15, 3, 37, 38],
  [53, 51, 75, 76, 69, 70, 72, 71, 63, 73, 39, 38],
];
const gates = new Map<number, Set<number>>();
for (const path of [...descents, ...returns]) {
  for (let step = 1; step < path.length; step++) {
    const from = path[step - 1], to = path[step];
    assert(topology.neighbors[from].includes(to));
    const exits = gates.get(from) ?? new Set<number>();
    exits.add(to); gates.set(from, exits);
  }
}
scene.wiring = [...gates].map(([vertex, exits]) => ({ vertex, exits: [...exits].sort((a, b) => a - b) })).sort((a, b) => a.vertex - b.vertex);
assert([...gates].every(([vertex, exits]) => exits.size === (vertex === 38 ? 4 : 1)));

function generator(id: string, vertex: number, period: 1 | 16, offsetBeats: number, travel: number) {
  scene.pieces.push({ id, vertex, kind: 'generator', period, phase: offsetBeats / period, reach: 180, enabled: true, travel });
}
// The short source stops after four hops: kick + low marimba on the beat,
// closed hat on the offbeat. It never reaches the airy melodic layer.
generator('cloud-pulse', 38, 1, 0, 4);
// Each slow source enters the same northern fork on beats 1, 5, 9 or 13.
// Include its approach in the finite budget, so returning sparks stop at 38.
generator('cloud-east', 39, 16, 0.75, 25);
generator('cloud-west', 37, 16, 4.75, 25);
generator('cloud-southwest', 17, 16, 6.75, 33);
generator('cloud-southeast', 75, 16, 10.75, 33);

function note(vertex: number, instrument: Instrument, degree: number, octave: number, duration: number, level: number) {
  scene.pieces.push({ id: `cloud-${instrument}-${vertex}`, vertex, kind: 'note', instrument, degree, octave, timbre: 'sine', duration, level });
}
note(40, 'kick', 0, 2, 0.4, 0.36);
note(87, 'marimba', 0, 2, 1.3, 0.25);
note(42, 'hi-hat', 0, 4, 0.2, 0.085);

// A minor 9 colors: A, C, E, G and B; F adds a gentle suspended answer.
note(4, 'piano', 2, 3, 4.8, 0.15);       // C4
note(22, 'guitar', 4, 3, 4.5, 0.12);     // E4
note(26, 'kalimba', 1, 4, 3.2, 0.16);    // B4
note(31, 'glass', 4, 4, 5.8, 0.11);     // E5
note(60, 'piano', 6, 3, 4.8, 0.13);     // G4
note(56, 'glass', 2, 4, 5.5, 0.10);     // C5
note(44, 'kalimba', 4, 4, 3.8, 0.14);   // E5
note(47, 'bongo-low', 0, 3, 0.4, 0.12);
note(49, 'piano', 4, 3, 4.8, 0.12);     // E4
note(64, 'kalimba', 0, 4, 3.2, 0.13);   // A4
note(79, 'bongo-high', 0, 4, 0.4, 0.09);
note(82, 'guitar', 6, 3, 4.8, 0.105);   // G4
// Two independent sparks meet at each bottom note; halve their levels.
note(52, 'glass', 0, 4, 6, 0.075);      // A4
note(54, 'marimba', 4, 2, 2.8, 0.08);   // E3
note(90, 'glass', 5, 3, 6, 0.07);       // F4
note(53, 'guitar', 0, 3, 5.5, 0.075);   // A3
// Tiny return-lane echoes also make the four entry waves subtly different.
note(19, 'piano', 0, 3, 5.5, 0.04);     // A3
note(51, 'kalimba', 4, 4, 2.5, 0.04);   // E5
note(73, 'glass', 6, 4, 5.5, 0.045);   // G5

const validated: Scene = validateScene(labelPieces(scene));
const moonChalk = LOOK_THEMES.find(theme => theme.id === 22);
assert(moonChalk, 'Moon chalk must use the current theme catalog.');
const appearance = applyLookTheme({ ...DEFAULT_APPEARANCE, size: 1.05, lighting: 0.9, sparkStyle: 'white' }, moonChalk);
const json = exportCompositionFile(validated, appearance);
assert.deepEqual(importCompositionFile(json), { scene: validated, appearance });
mkdirSync(destination, { recursive: true });
writeFileSync(`${destination}/Bongo-Planet.json`, json + '\n');
writeFileSync('public/fixtures/A01.json', JSON.stringify(validated, null, 2) + '\n');

// Decode the exact local PCM recordings used by the live synthesizer.
function decodeWav(path: string): InstrumentSample {
  const bytes = readFileSync(path);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  let channels = 0, rate = 0, bits = 0, format = 0, data: Buffer | undefined;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const name = bytes.toString('ascii', offset, offset + 4), length = bytes.readUInt32LE(offset + 4), start = offset + 8;
    if (name === 'fmt ') {
      format = bytes.readUInt16LE(start); channels = bytes.readUInt16LE(start + 2);
      rate = bytes.readUInt32LE(start + 4); bits = bytes.readUInt16LE(start + 14);
    } else if (name === 'data') data = bytes.subarray(start, start + length);
    offset = start + length + length % 2;
  }
  assert(format === 1 && bits === 16 && channels > 0 && rate > 0 && data, 'Expected PCM16 source audio.');
  const frames = data.length / (channels * 2);
  assert(Number.isInteger(frames));
  const pcm = Array.from({ length: channels }, () => new Float32Array(frames));
  for (let frame = 0; frame < frames; frame++) for (let channel = 0; channel < channels; channel++) {
    pcm[channel][frame] = data.readInt16LE((frame * channels + channel) * 2) / 32768;
  }
  return { channels: pcm, sampleRate: rate };
}
const samples = Object.fromEntries(INSTRUMENTS.map(instrument => {
  const takes = instrument.samples.map(path => decodeWav(`public/${path}`));
  return [instrument.id, { ...takes[0], ...(takes.length > 1 ? { alternates: takes.slice(1) } : {}) }];
})) as SampleBank;

// Run 16 complete cycles at the same 128-sample quantum as the worklet.
const simulation = new Engine(validated), events: EngineEvent[] = [];
simulation.play(0);
let maximumActiveEdges = 0, maximumDecisions = 0;
for (let tick = 1; tick <= 16 * cycleSeconds / quantum; tick++) {
  simulation.advance(tick * quantum, quantum);
  const batch = simulation.drain(); events.push(...batch);
  assert(simulation.snapshot().running, 'The composition must run without capacity or clock failure.');
  maximumActiveEdges = Math.max(maximumActiveEdges, simulation.snapshot().gatedEdges);
  maximumDecisions = Math.max(maximumDecisions, batch.filter(event => event.type === 'arrival').length + new Set(batch.filter(event => event.type === 'emission').map(event => event.time)).size);
}
const onsets = events.filter((event): event is Extract<EngineEvent, { type: 'onset' }> => event.type === 'onset');
function cyclePattern(cycle: number) {
  const start = cycle * cycleSeconds;
  return onsets.filter(event => event.trigger.onset >= start && event.trigger.onset < start + cycleSeconds)
    .map(event => ({ node: event.trigger.nodeId, generator: event.trigger.generatorId, offset: Number((event.trigger.onset - start).toFixed(8)) }));
}
for (let cycle = 2; cycle < 16; cycle++) assert.deepEqual(cyclePattern(cycle), cyclePattern(1));
const homeArrivals = events.filter((event): event is Extract<EngineEvent, { type: 'arrival' }> => event.type === 'arrival' && event.vertex === 38);
for (const arrival of homeArrivals) {
  const source = validated.pieces.find(piece => piece.id === arrival.generatorId);
  assert(source?.kind === 'generator');
  // An approach visits the fork once, and the completed loop stops there.
  assert(arrival.hops === source.travel || arrival.hops === Number(source.travel) - 24);
}

// Render four cycles using the real engine, synth and recordings; retain a
// steady-state 24-second loop after all preceding tails and entry lanes exist.
const engine = new Engine(validated), synth = new MonoSynth(sampleRate, samples);
const output = [new Float32Array(4 * cycleSeconds * sampleRate), new Float32Array(4 * cycleSeconds * sampleRate)];
engine.play(0);
let maximumVoices = 0;
for (let offset = 0; offset < output[0].length; offset += 128) {
  const start = offset / sampleRate;
  engine.advance(start + quantum, quantum);
  synth.apply(engine.drain(), start);
  for (let channel = 0; channel < 2; channel++) synth.render(output[channel].subarray(offset, offset + 128), start, validated.settings.volume, channel, channel === 1);
  maximumVoices = Math.max(maximumVoices, synth.counters.activeVoices);
}
const loopStart = 2 * cycleSeconds * sampleRate, loopFrames = cycleSeconds * sampleRate;
let peak = 0, sumSquares = 0, repeatError = 0;
const wav = Buffer.alloc(44 + loopFrames * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 4, 28);
wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(loopFrames * 4, 40);
for (let frame = 0; frame < loopFrames; frame++) for (let channel = 0; channel < 2; channel++) {
  const value = output[channel][loopStart + frame];
  assert(Number.isFinite(value)); peak = Math.max(peak, Math.abs(value)); sumSquares += value * value;
  repeatError = Math.max(repeatError, Math.abs(value - output[channel][loopStart + loopFrames + frame]));
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + (frame * 2 + channel) * 2);
}
assert(peak > 0.005 && peak < 0.98, 'The mix must be audible and retain headroom.');
assert(repeatError < 1e-5, 'Steady-state PCM must repeat without mismatched tails or sample takes.');
assert.equal(synth.stolenVoices, 0); assert.equal(synth.lateDropsAudio, 0);
writeFileSync(`${destination}/Airy-Loops.wav`, wav);

const routedVertices = new Set([...descents, ...returns].flat());
const instruments = Object.fromEntries(INSTRUMENTS.map(instrument => [instrument.id, validated.pieces.filter(piece => piece.kind === 'note' && piece.instrument === instrument.id).length]).filter(([, count]) => Number(count) > 0));
const report = {
  name: 'Airy Loops', presetId: 'A01', bpm, key: 'A minor', cycleBeats: 16, cycleSeconds,
  hopSeconds: 15 / bpm, generators: 5, soundingPieces: validated.pieces.length - 5, instruments,
  routedVertices: routedVertices.size, directedGates: validated.wiring!.reduce((sum, record) => sum + record.exits.length, 0),
  descents, returns, northernWaveBeats: [1, 5, 9, 13], allTravelFinite: true,
  compositionSha256: createHash('sha256').update(json + '\n').digest('hex'),
  simulation: { seconds: 16 * cycleSeconds, cycles: 16, stablePatternsMatch: true, maximumActiveEdges, maximumDecisionsPerQuantum: maximumDecisions, overloads: 0 },
  audio: { file: 'Airy-Loops.wav', renderedFromCurrentEngineAndSamples: true, seconds: cycleSeconds, sampleRate, channels: 2, peak, rms: Math.sqrt(sumSquares / (loopFrames * 2)), repeatError, maximumVoices, stolenVoices: synth.stolenVoices, lateDrops: synth.lateDropsAudio },
};
writeFileSync(`${destination}/validation.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
