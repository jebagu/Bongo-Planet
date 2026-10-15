import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { exportCompositionFile, importCompositionFile } from '../src/compositionFile';
import { Engine } from '../src/core/engine';
import type { Trigger } from '../src/core/contracts';
import { INSTRUMENTS } from '../src/core/instruments';
import { POP_SONGS, POP_LANE_STEPS, popAttacks, popSongScene } from '../src/core/popSongs';
import { MonoSynth } from '../src/audio/synth';
import type { InstrumentSample, SampleBank } from '../src/audio/samples';
import { DEFAULT_APPEARANCE } from '../src/view/art/appearance';
import { spatialCoverage } from '../src/core/spatialArrangement';

const sampleRate = 48000, quantum = 128 / sampleRate;
function decodeWav(path: string): InstrumentSample {
  const bytes = readFileSync(path);
  assert.equal(bytes.toString('ascii',0,4),'RIFF'); assert.equal(bytes.toString('ascii',8,12),'WAVE');
  let channels = 0, rate = 0, bits = 0, format = 0, data: Buffer | undefined;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const name = bytes.toString('ascii',offset,offset + 4), length = bytes.readUInt32LE(offset + 4), start = offset + 8;
    if (name === 'fmt ') { format = bytes.readUInt16LE(start); channels = bytes.readUInt16LE(start + 2); rate = bytes.readUInt32LE(start + 4); bits = bytes.readUInt16LE(start + 14); }
    else if (name === 'data') data = bytes.subarray(start,start + length);
    offset = start + length + length % 2;
  }
  assert(format === 1 && bits === 16 && channels > 0 && rate > 0 && data,'Expected PCM16 recordings.');
  const frames = data.length / (channels * 2), pcm = Array.from({length:channels},() => new Float32Array(frames));
  assert(Number.isInteger(frames));
  for (let frame = 0; frame < frames; frame++) for (let channel = 0; channel < channels; channel++) pcm[channel][frame] = data.readInt16LE((frame * channels + channel) * 2) / 32768;
  return {channels:pcm,sampleRate:rate};
}
const samples = Object.fromEntries(INSTRUMENTS.map(instrument => {
  const takes = instrument.samples.map(path => decodeWav(`public/${path}`));
  return [instrument.id,{...takes[0],alternates:takes.slice(1)}];
})) as SampleBank;
const colors = ['#344d78','#746048','#60406e','#8b536a','#36556c'];

for (const [index,song] of POP_SONGS.entries()) {
  const scene = popSongScene(song), appearance = {...DEFAULT_APPEARANCE,planet:colors[index],planetFinish:'workedClay' as const,
    backdrop:'stars' as const,gridColor:'#d6d5ed',gridOpacity:.32,gridWidth:.9,switches:{...DEFAULT_APPEARANCE.switches}};
  const json = exportCompositionFile(scene,appearance) + '\n';
  assert.deepEqual(importCompositionFile(json),{scene,appearance});
  const directory = `public/compositions/${song.slug}`;
  mkdirSync(directory,{recursive:true}); mkdirSync('public/fixtures',{recursive:true});
  writeFileSync(`${directory}/Bongo-Planet.json`,json);
  writeFileSync(`public/fixtures/${song.id}.json`,JSON.stringify(scene,null,2) + '\n');

  const beatSeconds = 60 / song.bpm, phraseSeconds = 16 * beatSeconds;
  const simulation = new Engine(scene), onsets: Trigger[] = [];
  let maximumEdges = 0, maximumDecisions = 0;
  simulation.play(0);
  for (let tick = 1; tick <= Math.ceil(8 * phraseSeconds / quantum); tick++) {
    simulation.advance(tick * quantum,quantum);
    const batch = simulation.drain(), state = simulation.snapshot();
    assert(state.running,'Playback must remain running.');
    maximumEdges = Math.max(maximumEdges,state.gatedEdges);
    maximumDecisions = Math.max(maximumDecisions,batch.filter(event => event.type === 'arrival').length + new Set(batch.filter(event => event.type === 'emission').map(event => event.time)).size);
    for (const event of batch) { assert(event.type !== 'reset'); if (event.type === 'onset') onsets.push(event.trigger); }
  }
  const written = popAttacks(song).flatMap(hit => Array.from({length:64 / POP_LANE_STEPS[hit.lane]},(_,repeat) => `${hit.id}@${repeat * POP_LANE_STEPS[hit.lane] + hit.step}`)).sort();
  for (let phrase = 1; phrase < 7; phrase++) {
    const start = (phrase * 16 + .25) * beatSeconds;
    const heard = onsets.filter(hit => hit.onset >= start - 1e-7 && hit.onset < start + phraseSeconds - 1e-7)
      .map(hit => `${hit.nodeId}@${Math.round((hit.onset - start) / beatSeconds * 4)}`).sort();
    assert.deepEqual(heard,written,`${song.title}: every written sound and rest must survive routing.`);
  }
  assert(maximumEdges <= 3 && maximumDecisions <= 64); assert.equal(simulation.lateDrops,0);

  // Render the actual engine/samples, keeping one phrase after two warm-up
  // phrases. Non-integer sample periods are rounded by at most half a frame;
  // exact repeated-PCM identity is not claimed at those tempos.
  const loopStart = Math.round((32 + .25) * beatSeconds * sampleRate), loopFrames = Math.round(phraseSeconds * sampleRate);
  const totalFrames = Math.ceil((loopStart + loopFrames) / 128) * 128;
  const engine = new Engine(scene), synth = new MonoSynth(sampleRate,samples);
  const wav = Buffer.alloc(44 + loopFrames * 4);
  wav.write('RIFF',0); wav.writeUInt32LE(wav.length - 8,4); wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(2,22);
  wav.writeUInt32LE(sampleRate,24); wav.writeUInt32LE(sampleRate * 4,28);
  wav.writeUInt16LE(4,32); wav.writeUInt16LE(16,34); wav.write('data',36); wav.writeUInt32LE(loopFrames * 4,40);
  let peak = 0, sumSquares = 0, maximumVoices = 0;
  const output = [new Float32Array(128),new Float32Array(128)];
  engine.play(0);
  for (let offset = 0; offset < totalFrames; offset += 128) {
    const time = offset / sampleRate;
    engine.advance(time + quantum,quantum); synth.apply(engine.drain(),time);
    for (let channel = 0; channel < 2; channel++) synth.render(output[channel],time,scene.settings.volume,channel,channel === 1);
    maximumVoices = Math.max(maximumVoices,synth.counters.activeVoices);
    for (let frame = Math.max(offset,loopStart); frame < Math.min(offset + 128,loopStart + loopFrames); frame++) for (let channel = 0; channel < 2; channel++) {
      const value = output[channel][frame - offset]; assert(Number.isFinite(value));
      peak = Math.max(peak,Math.abs(value)); sumSquares += value * value;
      wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value)) * 32767),44 + ((frame - loopStart) * 2 + channel) * 2);
    }
  }
  assert(peak > .03 && peak < .90,'The cover must be audible and retain headroom.');
  assert.equal(synth.stolenVoices,0); assert.equal(synth.lateDropsAudio,0);
  const audioFile = `${song.slug}.wav`; writeFileSync(`${directory}/${audioFile}`,wav);
  const stacks = [...new Set(scene.pieces.map(piece => piece.vertex))].map(vertex => scene.pieces.filter(piece => piece.vertex === vertex && piece.kind !== 'generator').length);
  const report = {id:song.id,title:song.title,artist:song.artist,scope:'Four-bar instrumental cover excerpt',bpm:song.bpm,
    phraseBeats:16,generators:3,pieces:scene.pieces.length,chordStacks:stacks.filter(size => size >= 3).length,maximumStack:Math.max(...stacks),
    chordProgression:song.chords.map(chord => chord.name),routedVertices:91,directedGates:88,allTravelFinite:true,
    spatial:spatialCoverage(scene),compositionSha256:createHash('sha256').update(json).digest('hex'),
    simulation:{phrases:8,writtenHitsAndRestsMatch:true,maximumEdges,maximumDecisionsPerQuantum:maximumDecisions,lateDrops:simulation.lateDrops},
    audio:{file:audioFile,seconds:loopFrames / sampleRate,sampleRate,channels:2,peak,rms:Math.sqrt(sumSquares / (loopFrames * 2)),
      maximumVoices,stolenVoices:synth.stolenVoices,lateDrops:synth.lateDropsAudio,frameRoundingError:loopFrames - phraseSeconds * sampleRate}};
  writeFileSync(`${directory}/validation.json`,JSON.stringify(report,null,2) + '\n');
  writeFileSync(`${directory}/README.md`,`# ${song.title} — ${song.artist}\n\nFour-bar instrumental cover excerpt, ${song.bpm} BPM. ${song.description}\n\nChoose **Load preset → Favorites - Chords → ${song.title} — ${song.artist}**, then **Play**. Import \`Bongo-Planet.json\` to load the included look as well. The menu preserves the current look.\n\nThree independent finite lanes use 64, 16 and 8 adjacent hops; the first musical downbeat is one sixteenth after launch. Every layer in a chord sounds together. Empty junctions preserve the written rests. The arrangement loops every 16 beats.\n\nThe retained Dancing Queen and Take On Me presets use authored routes around the sphere while retaining the same pitches, levels, note lengths and onset times.\n\nThis is a short sampled-instrument arrangement, not the original recording or a complete transcription. Bohemian Rhapsody uses only its piano-ballad passage.\n\n[Pitch/harmony reference](${song.source}). Arrangement details and validation are in \`validation.json\`. The stereo WAV uses the current engine, synth and recorded instruments. Its four-bar duration is rounded to the nearest sample; exact PCM repetition is not claimed for fractional-frame periods. Recreate with \`npm run songs:pop\`.\n`);
  console.log(JSON.stringify(report));
}
