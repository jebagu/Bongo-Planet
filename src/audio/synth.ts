import { LIMITS, type EngineEvent, type Trigger } from '../core/contracts';

import { SAMPLE_ROOT_HZ, type SampleBank, type InstrumentSample } from './samples';
import { isPercussion, type Instrument } from '../core/instruments';

interface Voice { trigger: Trigger; release?: number; seed: number; oneShot: boolean; sample?: InstrumentSample; duration: number }
export interface VoiceCounters { activeVoices: number; stolenVoices: number; lateDropsAudio: number }
const RELEASE = 0.02;
function seedFor(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  return hash >>> 0;
}
function noise(seed: number, sample: number): number {
  let value = (seed ^ Math.imul(sample + 1, 747796405)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 2246822507);
  value = Math.imul(value ^ (value >>> 13), 3266489909);
  return ((value ^ (value >>> 16)) >>> 0) / 2147483648 - 1;
}

/** Original deterministic voices shared by offline rendering and the audio render thread. */
export class MonoSynth {
  private voices: Voice[] = [];
  private sampleTakes = new Map<Instrument, number>();
  stolenVoices = 0;
  lateDropsAudio = 0;
  constructor(readonly sampleRate: number, private samples?: SampleBank) {
    if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw Error('Invalid sample rate');
  }
  setSamples(samples: SampleBank): void { this.samples = samples; }
  get counters(): VoiceCounters {
    return { activeVoices: this.voices.length, stolenVoices: this.stolenVoices, lateDropsAudio: this.lateDropsAudio };
  }
  start(trigger: Trigger, blockStart: number): void {
    if (blockStart - trigger.onset > RELEASE + 1e-9) { this.lateDropsAudio++; return; }
    this.prune(blockStart);
    if (this.voices.length >= LIMITS.voices) {
      let oldest = 0;
      for (let i = 1; i < this.voices.length; i++) {
        const a = this.voices[i].trigger, b = this.voices[oldest].trigger;
        if (a.onset < b.onset || (a.onset === b.onset && a.sequence < b.sequence)) oldest = i;
      }
      this.voices.splice(oldest, 1);
      this.stolenVoices++;
    }
    const instrument = trigger.sound.kind === 'note' ? trigger.sound.instrument : undefined;
    const oneShot = isPercussion(instrument);
    let sample: InstrumentSample | undefined;
    if (oneShot && instrument) {
      const primary = this.samples?.[instrument];
      if (primary) {
        const count = 1 + (primary.alternates?.length ?? 0);
        const take = (this.sampleTakes.get(instrument) ?? 0) % count;
        sample = take === 0 ? primary : primary.alternates![take - 1];
        this.sampleTakes.set(instrument, (take + 1) % count);
      }
    }
    const duration = sample ? sample.channels[0].length / sample.sampleRate : trigger.sound.duration;
    this.voices.push({ trigger, seed: seedFor(trigger.id), oneShot, sample, duration });
  }
  releaseAll(time: number): void { for (const voice of this.voices) voice.release ??= time; }
  releaseNodes(ids: readonly string[], time: number): void {
    const nodes = new Set(ids);
    for (const voice of this.voices) if (nodes.has(voice.trigger.nodeId)) voice.release ??= time;
  }
  releaseTriggers(ids: readonly string[], time: number): void {
    const triggers = new Set(ids);
    for (const voice of this.voices) if (triggers.has(voice.trigger.id)) voice.release ??= time;
  }
  releaseGenerators(ids:readonly string[],time:number):void{const sources=new Set(ids);for(const voice of this.voices)if(sources.has(voice.trigger.generatorId))voice.release??=time;}
  apply(events: readonly EngineEvent[], blockStart: number): void {
    for (const event of events) {
      if (event.type === 'onset') this.start(event.trigger, blockStart);
      else if (event.type === 'reset') { this.releaseAll(blockStart); this.sampleTakes.clear(); }
      else if (event.type === 'cancel') {
        if(event.generatorIds)this.releaseGenerators(event.generatorIds,blockStart);
        this.releaseNodes(event.nodeIds, blockStart);
        this.releaseTriggers(event.ids, blockStart);
      }
    }
  }
  private prune(time: number): void {
    this.voices = this.voices.filter(v => {
      const sound = v.trigger.sound;
      const sample = sound.kind === 'note' && sound.instrument ? this.samples?.[sound.instrument] : undefined;
      const duration = v.oneShot ? v.duration : sample && sound.kind === 'note' ? Math.min(sound.duration, sample.channels[0].length / sample.sampleRate * SAMPLE_ROOT_HZ / sound.frequency) : sound.duration;
      return time < v.trigger.onset + duration && (v.release === undefined || time < v.release + RELEASE);
    });
  }
  render(output: Float32Array, blockStart: number, volume = 1, channel = 0, pruneAtEnd = true): void {
    const gain = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
    for (let i = 0; i < output.length; i++) {
      const now = blockStart + i / this.sampleRate;
      let mix = 0;
      for (const voice of this.voices) {
        const sound = voice.trigger.sound, age = now - voice.trigger.onset;
        const duration = voice.oneShot ? voice.duration : sound.duration;
        if (age < 0 || age >= duration) continue;
        const release = voice.release === undefined ? 1 : Math.max(0, 1 - (now - voice.release) / RELEASE);
        if (release <= 0) continue;
        let waveform: number, envelope = voice.oneShot ? 1 : Math.min(1, age / 0.002) * Math.min(1, (sound.duration - age) / Math.min(RELEASE, sound.duration / 4));
        if (sound.kind === 'note') {
          if (sound.instrument) {
            const sample = voice.sample ?? this.samples?.[sound.instrument];
            if (!sample) continue;
            const pcm = sample.channels[Math.min(channel, sample.channels.length - 1)];
            const offset = age * sample.sampleRate * (voice.oneShot ? 1 : sound.frequency / SAMPLE_ROOT_HZ);
            const index = Math.floor(offset);
            if (index >= pcm.length) continue; // Natural decay; never loop or pad a sample.
            const fraction = offset - index;
            waveform = pcm[index] * (1 - fraction) + (pcm[index + 1] ?? 0) * fraction;
            // Prepared percussion retains its attack and tail; cancellation still fades.
            mix += waveform * envelope * release * sound.level * 0.65;
            continue;
          }
          const phase = age * sound.frequency;
          waveform = sound.timbre === 'sine' ? Math.sin(2 * Math.PI * phase) : 2 / Math.PI * Math.asin(Math.sin(2 * Math.PI * phase));
          envelope *= 0.18;
        } else {
          const n = Math.max(0, Math.floor(age * this.sampleRate + 1e-6));
          if (sound.sound === 'kick') {
            const phase = 48 * age + 105 * 0.022 * (1 - Math.exp(-age / 0.022));
            waveform = Math.sin(2 * Math.PI * phase);
            envelope *= 0.65 * Math.exp(-4.5 * age / sound.duration);
          } else if (sound.sound === 'hat') {
            waveform = (noise(voice.seed, n) - noise(voice.seed, Math.max(0, n - 1))) * 0.5;
            envelope *= 0.28 * Math.exp(-6 * age / sound.duration);
          } else {
            waveform = 0.8 * noise(voice.seed, n) + 0.2 * Math.sin(2 * Math.PI * 185 * age);
            envelope *= 0.45 * Math.exp(-5 * age / sound.duration);
          }
        }
        mix += waveform * envelope * release * sound.level;
      }
      // Apply master gain before bounded protection so every setting remains finite and <0.99.
      output[i] = 0.98 * Math.tanh(mix * gain);
    }
    if (pruneAtEnd) this.prune(blockStart + output.length / this.sampleRate);
  }
}
