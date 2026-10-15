import type { Scene } from './contracts';

export const INSTRUMENTS = [
  { id: 'guitar', name: 'Guitar', color: '#ffb883' },
  { id: 'glass', name: 'Glass', color: '#a1dff9' },
  { id: 'kalimba', name: 'Kalimba', color: '#b5dfaa' },
  { id: 'piano', name: 'Piano', color: '#c6b4f6' },
  { id: 'marimba', name: 'Marimba', color: '#f7aab9' },
] as const;
export type Instrument = typeof INSTRUMENTS[number]['id'];
export const instrumentName = (id: Instrument) => INSTRUMENTS.find(i => i.id === id)!.name;

/** Upgrade old compositions at the app boundary, retaining positions and timing. */
export function instrumentScene(scene: Scene): Scene {
  return { ...scene, pieces: scene.pieces.map(p => {
    if (p.kind === 'generator') return { ...p, travel: p.travel ?? scene.settings.travel };
    if (p.kind === 'note') return p.instrument ? p : { ...p, instrument: 'piano' };
    return { id: p.id, vertex: p.vertex, label: p.label, kind: 'note', instrument: 'marimba',
      degree: p.sound === 'kick' ? 0 : p.sound === 'snare' ? 2 : 4,
      octave: 4, timbre: 'sine', duration: Math.max(0.05, p.decay), level: p.level };
  }) };
}
