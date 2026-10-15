import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { importCompositionFile } from '../src/compositionFile';
import { validateScene, type Scene, type Trigger } from '../src/core/contracts';
import { Engine } from '../src/core/engine';
import { EXAMPLES } from '../src/core/examples';

const loops = [
  { id: 'D01', slug: 'velvet-basement', bpm: 120 },
  { id: 'D02', slug: 'night-shift', bpm: 128 },
  { id: 'D03', slug: 'loose-bolts', bpm: 144 },
  { id: 'D04', slug: 'low-tide', bpm: 80 },
  { id: 'D05', slug: 'sunwheel', bpm: 100 },
];
const fixture = (id: string): Scene => validateScene(JSON.parse(readFileSync(`public/fixtures/${id}.json`, 'utf8')));

function play(scene: Scene) {
  const engine = new Engine(scene), hits: Trigger[] = [], quantum = 128 / 48000;
  const seconds = 24.5 * 60 / scene.settings.bpm;
  let peakEdges = 0;
  engine.play(0);
  for (let tick = 1; tick <= Math.ceil(seconds / quantum); tick++) {
    engine.advance(tick * quantum, quantum);
    peakEdges = Math.max(peakEdges, engine.snapshot().gatedEdges);
    for (const event of engine.drain()) {
      expect(event.type).not.toBe('reset');
      if (event.type === 'onset') hits.push(event.trigger);
    }
  }
  expect(engine.running).toBe(true); expect(engine.lateDrops).toBe(0); expect(peakEdges).toBeLessThanOrEqual(4);
  const phrase = (index: number) => hits
    .filter(hit => hit.onset >= (index * 8 + .25) * 60 / scene.settings.bpm - 1e-7 && hit.onset < ((index + 1) * 8 + .25) * 60 / scene.settings.bpm - 1e-7)
    .map(hit => ({ instrument: hit.sound.kind === 'note' ? hit.sound.instrument : '', step: Math.round((hit.onset * scene.settings.bpm / 60 - index * 8 - .25) * 4), level: hit.sound.level }))
    .sort((a, b) => a.step - b.step || a.instrument!.localeCompare(b.instrument!));
  expect(phrase(2)).toEqual(phrase(1));
  return phrase(1);
}

describe('five percussion favorites', () => {
  it.each(loops)('$id imports the same scene, plays only drums, and repeats without growing the spark count', loop => {
    const scene = fixture(loop.id), portable = importCompositionFile(readFileSync(`public/compositions/${loop.slug}/Bongo-Planet.json`, 'utf8'));
    expect(portable.scene).toEqual(scene); expect(scene.settings.bpm).toBe(loop.bpm);
    expect(EXAMPLES.some(example => example.id === loop.id)).toBe(['D04','D05'].includes(loop.id));
    expect(scene.pieces.filter(piece => piece.kind === 'generator')).toHaveLength(4);
    expect(scene.pieces.every(piece => piece.kind === 'generator' ? Number.isInteger(piece.travel) && Number(piece.travel) <= 32 : piece.kind === 'note')).toBe(true);
    const rhythm = play(scene);
    expect(new Set(rhythm.map(hit => hit.instrument))).toEqual(new Set(['kick','snare','hi-hat','bongo-high','bongo-low']));
    expect(new Set(rhythm.map(hit => hit.level)).size).toBeGreaterThan(6);
    if (loop.id === 'D01' || loop.id === 'D02') {
      for (const step of [0,4,8,12,16,20,24,28]) expect(rhythm.some(hit => hit.instrument === 'kick' && hit.step === step)).toBe(true);
    }
    if (loop.id === 'D04') {
      expect(rhythm.filter(hit => hit.instrument === 'kick').map(hit => hit.step)).toEqual([8,24]);
      for (const step of [8,24]) expect(rhythm.some(hit => hit.instrument === 'snare' && hit.step === step)).toBe(true);
    }
    if (loop.id === 'D03' || loop.id === 'D05') {
      const kicks = rhythm.filter(hit => hit.instrument === 'kick');
      expect(kicks.some(hit => hit.step % 4 !== 0)).toBe(true);
      expect(kicks.filter(hit => hit.step < 16).map(hit => hit.step)).not.toEqual(kicks.filter(hit => hit.step >= 16).map(hit => hit.step - 16));
    }
  });
});
