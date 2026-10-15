import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Engine } from '../src/core/engine';
import { validateScene, type Trigger } from '../src/core/contracts';
import { MonoSynth } from '../src/audio/synth';
const sampleRate = 48000;
const destination = path.resolve('evidence/step-05/offline-audio');
fs.mkdirSync(destination, { recursive: true });
function wav(filename: string, samples: Float32Array): void {
  const bytes = Buffer.alloc(44 + samples.length * 2);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(36 + samples.length * 2, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(destination, filename), bytes);
}
const fixtureReports = [];
for (const id of ['F00', 'F01', 'F02', 'F03', 'F04', 'F06', 'F08']) {
  const file = `public/fixtures/${id}.json`;
  const scene = validateScene(JSON.parse(fs.readFileSync(file, 'utf8')));
  const engine = new Engine(scene), synth = new MonoSynth(sampleRate), seconds = ['F06', 'F08'].includes(id) ? 3 : 6;
  const samples = new Float32Array(seconds * sampleRate);
  const onsets: { nodeId: string; generatorId: string; id: string; onset: number }[] = [];
  let maxActive = 0;
  engine.play(0);
  for (let offset = 0; offset < samples.length; offset += 128) {
    const block = samples.subarray(offset, Math.min(samples.length, offset + 128)), start = offset / sampleRate;
    engine.advance((offset + block.length) / sampleRate);
    const events = engine.drain();
    for (const event of events) if (event.type === 'onset') onsets.push({ nodeId: event.trigger.nodeId, generatorId: event.trigger.generatorId, id: event.trigger.id, onset: event.trigger.onset });
    synth.apply(events, start);
    maxActive = Math.max(maxActive, synth.counters.activeVoices);
    synth.render(block, start, scene.settings.volume);
  }
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const filename = `${id}.wav`;
  wav(filename, samples);
  fixtureReports.push({ fixture: id, fixtureSha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'), filename, seconds, logicalChannels: 1, sampleRate, peak, finite: samples.every(Number.isFinite), maxActive, ...synth.counters, onsets });
}
const independentTiming = [0.25, 0.5, 0.75].map((expected, index) => {
  const synth = new MonoSynth(sampleRate);
  const trigger: Trigger = { session: 'analytic', sequence: index + 1, id: `analytic-${index}`, nodeId: `analytic-note-${index}`, generatorId: 'analytic-g', emission: 0, beat: 0, angle: [Math.PI / 6, Math.PI / 3, Math.PI / 2][index], onset: expected, position: [1, 0, 0], sound: { kind: 'note', frequency: 440, timbre: 'sine', duration: 0.12, level: 0.8 } };
  synth.start(trigger, 0);
  const samples = new Float32Array(sampleRate); synth.render(samples, 0);
  const actual = samples.findIndex(sample => Math.abs(sample) > 0.0001) / sampleRate;
  wav(`analytic-${Math.round(expected * 1000)}ms.wav`, samples);
  return { degrees: [30, 60, 90][index], expectedSeconds: expected, measuredFirstSignalSeconds: actual, errorMs: (actual - expected) * 1000, toleranceMs: 5 };
});
const sourceFiles = ['src/audio/synth.ts', 'src/audio/processor.ts', 'src/audio/AudioAdapter.ts', 'src/core/engine.ts', 'src/core/contracts.ts'];
const sourceSnapshot = Object.fromEntries(sourceFiles.map(file => [file, createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const report = { title: 'Bongo Planet original offline PCM synthesis evidence', date: new Date().toISOString(), command: 'npx tsx scripts/audio-evidence.ts', node: process.version, sourceSnapshot, sampleRate, logicalChannels: 1, independentTiming, fixtureReports, limitations: ['Offline output only; does not pass live browser output timing.', 'Onset timestamps in fixture reports are engine records, not measured live audio.', 'No human listening, browser activation, or physical audio-route acceptance asserted.'] };
fs.writeFileSync(path.join(destination, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Wrote offline mono WAVs and measured analytic-onset report to ${destination}. Live/human gates remain open.`);
