import type { Scene } from '../src/core/contracts';

/** Independent, unchanged sine/kick fixture model. No engine or synth import. */
export interface OracleVoice {
  sequence: number; generatorId: string; nodeId: string; onset: number;
  kind: 'sine' | 'kick'; frequency: number; duration: number; level: number;
  admittedFrame: number; removedFrame: number;
}
export interface OracleGroup { onset: number; voices: OracleVoice[] }

export function fixtureOracle(scene: Scene, vertices: readonly number[][], epoch: number,
  seconds: number, sampleRate = 48000, quantum = 128): OracleVoice[] {
  if (![epoch, seconds, sampleRate, quantum].every(Number.isFinite) || seconds <= 0 || seconds > 120 || sampleRate <= 0 || !Number.isInteger(quantum) || quantum <= 0) throw Error('Invalid oracle interval');
  if (scene.settings.scale !== 'major' || scene.pieces.some(p => p.kind === 'note' && p.timbre !== 'sine' || p.kind === 'beat' && p.sound !== 'kick')) throw Error('Oracle supports unchanged major/sine/kick fixtures only');
  const generators = scene.pieces.filter(p => p.kind === 'generator' && p.enabled);
  const emissions = generators.flatMap(g => {
    if (g.kind !== 'generator') return [];
    const period = g.period * 60 / scene.settings.bpm;
    const rows: { time: number; generator: typeof g; order: number }[] = [];
    for (let cycle = 0; (cycle + g.phase) * period < seconds; cycle++) rows.push({time: epoch + (cycle + g.phase) * period, generator: g, order: scene.pieces.indexOf(g)});
    return rows;
  }).sort((a, b) => a.time - b.time || a.order - b.order);
  const voices: OracleVoice[] = [];
  let sequence = 0;
  for (const emission of emissions) for (const node of scene.pieces) {
    if (node.kind === 'generator') continue;
    const a = vertices[emission.generator.vertex], b = vertices[node.vertex];
    if (!a || !b || a.length !== 3 || b.length !== 3) throw Error('Missing independent topology vector');
    const angle = Math.acos(Math.max(-1, Math.min(1, a.reduce((sum, coordinate, i) => sum + coordinate * b[i], 0))));
    if (angle > emission.generator.reach * Math.PI / 180 + 1e-9) continue;
    const unrounded = angle / Math.PI * scene.settings.travel * emission.generator.period;
    const grid = scene.settings.quantization;
    const beats = grid ? Math.min(Math.floor(unrounded / grid + .5 + 1e-10) * grid, (Math.ceil(emission.generator.period / grid) - 1) * grid) : unrounded;
    const onset = emission.time + beats * 60 / scene.settings.bpm;
    const serial = ++sequence;
    if (onset >= epoch + seconds - 1e-9) continue;
    const semitones = [0, 2, 4, 5, 7, 9, 11];
    voices.push({sequence: serial, generatorId: emission.generator.id, nodeId: node.id, onset,
      kind: node.kind === 'note' ? 'sine' : 'kick',
      frequency: node.kind === 'note' ? 440 * Math.pow(2, (12 * (node.octave + 1) + scene.settings.key + semitones[node.degree] - 69) / 12) : 0,
      duration: node.kind === 'note' ? node.duration : node.decay, level: node.level,
      // A future boundary is admitted by the preceding block's end-inclusive
      // event service. The first transport block cannot precede its epoch.
      admittedFrame: Math.max(Math.round(epoch * sampleRate), (Math.ceil((onset * sampleRate - 1e-7) / quantum) - 1) * quantum), removedFrame: Infinity});
  }
  voices.sort((a, b) => a.onset - b.onset || a.sequence - b.sequence);
  return assignOwnership(voices, sampleRate);
}

/** Ownership is recomputed for counterfactual starts, never copied from PCM. */
export function assignOwnership(input: readonly OracleVoice[], sampleRate = 48000): OracleVoice[] {
  const voices = input.map(v => ({...v, removedFrame: Infinity}));
  let active: OracleVoice[] = [];
  const insertions = [...voices].sort((a, b) => a.admittedFrame - b.admittedFrame || a.onset - b.onset || a.sequence - b.sequence);
  for (const voice of insertions) {
    const blockTime = voice.admittedFrame / sampleRate;
    active = active.filter(old => old.onset + old.duration > blockTime);
    if (active.length >= 64) {
      const oldest = active.reduce((first, next) => next.onset < first.onset || next.onset === first.onset && next.sequence < first.sequence ? next : first);
      oldest.removedFrame = voice.admittedFrame;
      active = active.filter(old => old !== oldest);
    }
    active.push(voice);
  }
  return voices;
}

export function onsetGroups(voices: readonly OracleVoice[]): OracleGroup[] {
  const result: OracleGroup[] = [];
  for (const voice of voices) {
    const last = result.at(-1);
    if (last && Math.abs(last.onset - voice.onset) < 1e-9) last.voices.push(voice);
    else result.push({onset: voice.onset, voices: [voice]});
  }
  return result;
}

export function scalarVoice(voice: Pick<OracleVoice, 'onset' | 'kind' | 'frequency' | 'duration' | 'level'>, time: number): number {
  const age = time - voice.onset;
  if (age <= 0 || age >= voice.duration) return 0;
  const envelope = Math.min(1, age / .002) * Math.min(1, (voice.duration - age) / Math.min(.02, voice.duration / 4));
  if (voice.kind === 'sine') return Math.sin(2 * Math.PI * voice.frequency * age) * envelope * .18 * voice.level;
  const cycles = 48 * age + 2.31 * (1 - Math.exp(-age / .022));
  return Math.sin(2 * Math.PI * cycles) * envelope * .65 * Math.exp(-4.5 * age / voice.duration) * voice.level;
}

export function renderOracle(voices: readonly OracleVoice[], firstFrame: number, samples: number, sampleRate = 48000, volume = .65): Float32Array {
  if (!Number.isInteger(firstFrame) || !Number.isInteger(samples) || samples < 1 || !Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('Invalid render window');
  const candidates = voices.filter(v => v.onset * sampleRate < firstFrame + samples && v.removedFrame > firstFrame && (v.onset + v.duration) * sampleRate > firstFrame).sort((a, b) => a.admittedFrame - b.admittedFrame || a.sequence - b.sequence);
  let cursor = 0, active: OracleVoice[] = [];
  const output = new Float32Array(samples);
  for (let sample = 0; sample < samples; sample++) {
    const frame = firstFrame + sample, time = frame / sampleRate;
    while (cursor < candidates.length && candidates[cursor].admittedFrame <= frame) active.push(candidates[cursor++]);
    active = active.filter(v => frame < v.removedFrame && time < v.onset + v.duration);
    let mix = 0;
    for (const voice of active) mix += scalarVoice(voice, time);
    output[sample] = .98 * Math.tanh(mix * volume);
  }
  return output;
}

/** Deliberately inaudible starts are reported, never counted as PCM onsets. */
export function erasedBeforeSound(voice: OracleVoice, sampleRate = 48000): boolean {
  return voice.removedFrame <= Math.max(voice.admittedFrame, Math.floor(voice.onset * sampleRate) + 1);
}
