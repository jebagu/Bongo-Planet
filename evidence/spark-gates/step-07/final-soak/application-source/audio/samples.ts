import { INSTRUMENTS, type Instrument } from '../core/instruments';

export interface InstrumentSample { channels: Float32Array[]; sampleRate: number }
export type SampleBank = Record<Instrument, InstrumentSample>;
// FFT measurements of the extracted recordings place their root near MIDI 60.
// Harmony Bloom's native root, envelopes and effects remain undocumented.
export const SAMPLE_ROOT_HZ = 261.6255653005986;

export async function loadSamples(context: AudioContext): Promise<SampleBank> {
  const entries = await Promise.all(INSTRUMENTS.map(async ({ id }) => {
    const response = await fetch(`${import.meta.env.BASE_URL}audio/harmony-bloom/${id}.wav`);
    if (!response.ok) throw Error(`Could not load ${id} sample (${response.status}).`);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i).slice());
    return [id, { channels, sampleRate: buffer.sampleRate }] as const;
  }));
  return Object.fromEntries(entries) as SampleBank;
}
