import { LIMITS, type EngineEvent, type Trigger } from '../core/contracts';

interface Voice { trigger: Trigger; release?: number; seed: number }
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
  stolenVoices = 0;
  lateDropsAudio = 0;
  constructor(readonly sampleRate: number) {
    if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw Error('Invalid sample rate');
  }
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
    this.voices.push({ trigger, seed: seedFor(trigger.id) });
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
  apply(events: readonly EngineEvent[], blockStart: number): void {
    for (const event of events) {
      if (event.type === 'onset') this.start(event.trigger, blockStart);
      else if (event.type === 'reset') this.releaseAll(blockStart);
      else if (event.type === 'cancel') {
        this.releaseNodes(event.nodeIds, blockStart);
        this.releaseTriggers(event.ids, blockStart);
      }
    }
  }
  private prune(time: number): void {
    this.voices = this.voices.filter(v => time < v.trigger.onset + v.trigger.sound.duration && (v.release === undefined || time < v.release + RELEASE));
  }
  render(output: Float32Array, blockStart: number, volume = 1): void {
    const gain = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
    for (let i = 0; i < output.length; i++) {
      const now = blockStart + i / this.sampleRate;
      let mix = 0;
      for (const voice of this.voices) {
        const sound = voice.trigger.sound, age = now - voice.trigger.onset;
        if (age < 0 || age >= sound.duration) continue;
        const attack = Math.min(1, age / 0.002);
        const end = Math.min(1, (sound.duration - age) / Math.min(RELEASE, sound.duration / 4));
        const release = voice.release === undefined ? 1 : Math.max(0, 1 - (now - voice.release) / RELEASE);
        if (release <= 0) continue;
        let waveform: number, envelope = attack * end;
        if (sound.kind === 'note') {
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
    this.prune(blockStart + output.length / this.sampleRate);
  }
}
