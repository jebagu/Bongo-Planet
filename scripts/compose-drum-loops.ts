import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { exportCompositionFile, importCompositionFile } from '../src/compositionFile';
import { Engine } from '../src/core/engine';
import type { Trigger } from '../src/core/contracts';
import { INSTRUMENTS } from '../src/core/instruments';
import { MonoSynth } from '../src/audio/synth';
import type { InstrumentSample, SampleBank } from '../src/audio/samples';
import { DRUM_LOOPS, LANE_STEPS, drumLoopAppearance, drumLoopScene } from './drum-loop-scores';

const sampleRate = 48000, quantum = 128 / sampleRate, loopBeats = 16;
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
  assert(format === 1 && bits === 16 && channels > 0 && rate > 0 && data, 'Expected PCM16 source recordings.');
  const frames = data.length / (channels * 2), pcm = Array.from({ length: channels }, () => new Float32Array(frames));
  assert(Number.isInteger(frames));
  for (let frame = 0; frame < frames; frame++) for (let channel = 0; channel < channels; channel++) pcm[channel][frame] = data.readInt16LE((frame * channels + channel) * 2) / 32768;
  return { channels: pcm, sampleRate: rate };
}
const samples = Object.fromEntries(INSTRUMENTS.filter(instrument => ['kick','snare','hi-hat','bongo-high','bongo-low'].includes(instrument.id)).map(instrument => {
  const takes = instrument.samples.map(path => decodeWav(`public/${path}`));
  return [instrument.id, { ...takes[0], alternates: takes.slice(1) }];
})) as SampleBank;

for (const score of DRUM_LOOPS) {
  const scene = drumLoopScene(score), appearance = drumLoopAppearance(score), json = exportCompositionFile(scene, appearance) + '\n';
  assert.deepEqual(importCompositionFile(json), { scene, appearance });
  const directory = `public/compositions/${score.slug}`;
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/Bongo-Planet.json`, json);
  writeFileSync(`public/fixtures/${score.id}.json`, JSON.stringify(scene, null, 2) + '\n');

  // Qualify the written rhythm against actual engine events, over eight phrases.
  const simulation = new Engine(scene), onsets: Trigger[] = [];
  const beatSeconds = 60 / score.bpm, phraseSeconds = 8 * beatSeconds;
  let maximumEdges = 0, maximumDecisions = 0;
  simulation.play(0);
  for (let tick = 1; tick <= Math.ceil(8 * phraseSeconds / quantum); tick++) {
    simulation.advance(tick * quantum, quantum);
    const batch = simulation.drain(), state = simulation.snapshot();
    assert(state.running, 'Playback must remain running.');
    maximumEdges = Math.max(maximumEdges, state.gatedEdges);
    maximumDecisions = Math.max(maximumDecisions, batch.filter(event => event.type === 'arrival').length + new Set(batch.filter(event => event.type === 'emission').map(event => event.time)).size);
    for (const event of batch) {
      if (event.type === 'onset') onsets.push(event.trigger);
      assert(event.type !== 'reset', 'No capacity or clock reset is allowed.');
    }
  }
  for (let phrase = 1; phrase < 7; phrase++) {
    const start = (phrase * 8 + .25) * beatSeconds;
    const observed = onsets.filter(hit => hit.onset >= start - 1e-7 && hit.onset < start + phraseSeconds - 1e-7)
      .map(hit => `${hit.nodeId}@${Math.round((hit.onset - start) / beatSeconds * 4)}`).sort();
    const expected = score.lanes.flatMap((lane, index) => Array.from({ length: 32 / LANE_STEPS[index] }, (_, repeat) => lane.map(hit => `${score.id}-lane-${index}-step-${hit.step}@${repeat * LANE_STEPS[index] + hit.step}`)).flat()).sort();
    assert.deepEqual(observed, expected, `${score.name}: each written hit and rest must survive routing.`);
  }
  assert(maximumDecisions <= 64 && maximumEdges <= 256);
  assert.equal(simulation.lateDrops, 0);

  // A four-bar audio loop includes both alternating percussion takes. Align its
  // start to the first destination, one sixteenth after the generator launch.
  const exactFrames = loopBeats * beatSeconds * sampleRate, exactStart = (2 * loopBeats + .25) * beatSeconds * sampleRate;
  const loopFrames = Math.round(exactFrames), loopStart = Math.round(exactStart);
  assert(Math.abs(loopFrames - exactFrames) < 1e-6 && Math.abs(loopStart - exactStart) < 1e-6, 'Choose tempos with sample-aligned four-bar cycles.');
  const totalFrames = Math.ceil((loopStart + 2 * loopFrames) / 128) * 128;
  const output = [new Float32Array(totalFrames), new Float32Array(totalFrames)];
  const engine = new Engine(scene), synth = new MonoSynth(sampleRate, samples);
  let maximumVoices = 0;
  engine.play(0);
  for (let offset = 0; offset < totalFrames; offset += 128) {
    const time = offset / sampleRate;
    engine.advance(time + quantum, quantum); synth.apply(engine.drain(), time);
    for (let channel = 0; channel < 2; channel++) synth.render(output[channel].subarray(offset, offset + 128), time, scene.settings.volume, channel, channel === 1);
    maximumVoices = Math.max(maximumVoices, synth.counters.activeVoices);
  }
  const wav = Buffer.alloc(44 + loopFrames * 4);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 4, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(loopFrames * 4, 40);
  let peak = 0, sumSquares = 0, repeatError = 0;
  for (let frame = 0; frame < loopFrames; frame++) for (let channel = 0; channel < 2; channel++) {
    const value = output[channel][loopStart + frame];
    assert(Number.isFinite(value)); peak = Math.max(peak, Math.abs(value)); sumSquares += value * value;
    repeatError = Math.max(repeatError, Math.abs(value - output[channel][loopStart + loopFrames + frame]));
    wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + (frame * 2 + channel) * 2);
  }
  assert(peak > .03 && peak < .98, 'The drums must be audible and retain headroom.');
  assert(repeatError < 1e-5, 'Loop tails and alternating takes must repeat cleanly.');
  assert.equal(synth.stolenVoices, 0); assert.equal(synth.lateDropsAudio, 0);
  const audioFile = `${score.slug.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('-')}.wav`;
  writeFileSync(`${directory}/${audioFile}`, wav);
  const report = {
    name: score.name, genre: score.genre, presetId: score.id, bpm: score.bpm,
    phraseBeats: 8, audioLoopBeats: loopBeats, generators: 4, soundingPieces: scene.pieces.length - 4,
    routedVertices: 92, directedGates: 88, allTravelFinite: true,
    compositionSha256: createHash('sha256').update(json).digest('hex'),
    simulation: { phrases: 8, writtenHitsAndRestsMatch: true, maximumEdges, maximumDecisionsPerQuantum: maximumDecisions, lateDrops: simulation.lateDrops },
    audio: { file: audioFile, seconds: loopFrames / sampleRate, sampleRate, channels: 2, peak, rms: Math.sqrt(sumSquares / (loopFrames * 2)), repeatError, maximumVoices, stolenVoices: synth.stolenVoices, lateDrops: synth.lateDropsAudio },
  };
  writeFileSync(`${directory}/validation.json`, JSON.stringify(report, null, 2) + '\n');
  writeFileSync(`${directory}/README.md`, `# ${score.name}\n\n${score.genre}, ${score.bpm} BPM. ${score.description}\n\nChoose **Load preset → Drum Loops → ${score.name}**, then **Play**. The two-bar musical phrase uses four finite spark lanes, 88 directed gates and all 92 junctions. Kick and snare lanes are two bars long, hats one bar, and bongos two beats. Empty junctions are rests. Every crossing is one sixteenth note.\n\nImport \`Bongo-Planet.json\` for music and its complete look. The preset menu preserves your existing look. All sounds use the five recorded percussion instruments at their natural pitch and full length. Each lane begins one sixteenth after Play; all four share that same downbeat.\n\n\`${audioFile}\` is a four-bar stereo WAV rendered with the actual engine, synth and recordings. It starts on the musical downbeat, contains steady-state tails and both sample takes, and repeats directly. \`validation.json\` records exact written-hit/rest comparisons over eight phrases, bounded playback, headroom and matching repeated PCM. Recreate with \`node_modules/.bin/tsx scripts/compose-drum-loops.ts\`.\n`);
  console.log(JSON.stringify(report));
}
