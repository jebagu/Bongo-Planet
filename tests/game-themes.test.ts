import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_THEMES } from '../src/core/gameThemes';
import { classicSongScene } from '../src/core/classics';
import { EXAMPLE_GROUPS } from '../src/core/examples';
import { Engine } from '../src/core/engine';
import type { Trigger } from '../src/core/contracts';
import { importCompositionFile } from '../src/compositionFile';

const inventory = JSON.parse(readFileSync('public/songs/game-themes.json', 'utf8')) as {tracks: {id: string; file: string}[]};

// Independent concert-pitch and hop-position references for these arrangements.
// Zelda's sustained final F closes the adapted loop before the next triplet run.
const references: Record<string, {midi: number[]; steps: number[]}> = {
  S41: {midi: [76,76,76,72,76,79,67], steps: [0,2,6,10,12,16,24]},
  S42: {midi: [70,65,70,70,72,74,75,77], steps: [0,4,11,12,13,14,15,16]},
  S43: {
    midi: [76,71,72,74,72,71,69,69,72,76,74,72,71,72,74,76,72,69,69,
      74,77,81,79,77,76,72,76,74,72,71,71,72,74,76,72,69,69,
      76,72,74,71,72,69,64,71,76,72,74,71,72,76,81,76,69,72,71,69],
    steps: [0,2,3,4,6,7,8,10,11,12,14,15,16,19,20,22,24,26,28,
      32,35,36,38,39,40,43,44,46,47,48,50,51,52,54,56,58,60,
      64,65,66,67,68,69,70,71,72,74,76,78,80,81,82,84,86,88,89,90],
  },
  S44: {midi: [36,38,40,43,48,50,52,55,60,62,64,67,72,74,76,79,84,79,76,74,72,67,64,62,60,55,52,50,48,43,40,38], steps: Array.from({length: 32}, (_, i) => i)},
};

describe('classic video game themes', () => {
  it('retains all four local theme exports while exposing only favorites in the app', () => {
    expect(GAME_THEMES.map(song => song.id)).toEqual(['S41','S42','S43','S44']);
    expect(EXAMPLE_GROUPS.map(group => group.name)).toEqual(['Favorites - Simple','Favorites - Chords','favorites - with loops','Drum Loops','Airy & Ambient','Minimal Routing']);
    expect(EXAMPLE_GROUPS.find(group => group.name === 'Favorites - Simple')!.examples)
      .toContainEqual({id:'S43',name:'Tetris — Type A (Korobeiniki)'});
    expect(inventory.tracks.map(track => track.id)).toEqual(GAME_THEMES.map(song => song.id));
  });

  it.each(GAME_THEMES)('$id: $title exports the complete playable music and look', song => {
    const scene = classicSongScene(song);
    expect(JSON.parse(readFileSync(`public/fixtures/${song.id}.json`, 'utf8'))).toEqual(scene);
    const file = inventory.tracks.find(track => track.id === song.id)!.file;
    const portable = readFileSync(`public/songs/${file}`, 'utf8');
    expect(Buffer.byteLength(portable)).toBeLessThan(128 * 1024);
    const imported = importCompositionFile(portable);
    expect(imported.scene).toEqual(scene);
    expect(imported.appearance).toBeDefined();
    expect(scene.version).toBe(2);
    expect(scene.settings.propagation).toBe('gated');
    expect(scene.pieces).toHaveLength(song.nodes);
    expect(new Set(scene.pieces.map(piece => piece.vertex)).size).toBe(song.nodes);
  });

  it.each(GAME_THEMES)('$id: $title keeps its reference notes and rests across three bounded loops', song => {
    const scene = classicSongScene(song), engine = new Engine(scene);
    const onsets: Trigger[] = [], resets: string[] = [];
    const quantum = 128 / 48000, hop = 15 / song.bpm;
    let maxEdges = 0, maxPending = 0;
    engine.play(0);
    for (let time = 0; time <= song.period * 3 * 60 / song.bpm + quantum; time += quantum) {
      engine.advance(time, quantum);
      const state = engine.snapshot();
      maxEdges = Math.max(maxEdges, state.gatedEdges);
      maxPending = Math.max(maxPending, state.pending);
      for (const event of engine.drain()) {
        if (event.type === 'onset') onsets.push(event.trigger);
        if (event.type === 'reset') resets.push(event.reason);
      }
    }
    expect(resets).toEqual([]);
    expect(engine.running).toBe(true);
    expect(engine.lateDrops).toBe(0);
    expect(maxEdges).toBeLessThanOrEqual(3);
    expect(maxPending).toBeLessThanOrEqual(3);
    expect(new Set(onsets.map(trigger => trigger.nodeId)))
      .toEqual(new Set(scene.pieces.filter(piece => piece.kind === 'note').map(piece => piece.id)));
    const hook = onsets.filter(trigger => trigger.nodeId.startsWith(`${song.id}-hook-`)
      && trigger.sound.kind === 'note' && trigger.sound.instrument === song.lead);
    const reference = references[song.id];
    expect(hook).toHaveLength(reference.midi.length * 3);
    for (let cycle = 0; cycle < 3; cycle++) {
      const phrase = hook.slice(cycle * reference.midi.length, (cycle + 1) * reference.midi.length);
      expect(phrase.map(trigger => trigger.sound.kind === 'note'
        ? Math.round(69 + 12 * Math.log2(trigger.sound.frequency / 440)) : null)).toEqual(reference.midi);
      phrase.forEach((trigger, index) => {
        expect(trigger.onset).toBeCloseTo((cycle * song.period * 4 + reference.steps[index] + 1) * hop, 9);
      });
    }
  });
});
