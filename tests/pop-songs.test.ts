import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { importCompositionFile } from '../src/compositionFile';
import { Engine } from '../src/core/engine';
import { EXAMPLE_GROUPS, EXAMPLES, FAVORITE_EXAMPLES } from '../src/core/examples';
import { POP_SONGS, popSongScene } from '../src/core/popSongs';
import type { Trigger } from '../src/core/contracts';

// Separate concert-pitch references for the recognizable opening hooks.
const reference: Record<string,number[]> = {
  P01:[75,70,67,75,70,67,75,70,73,70,65],
  P02:[72,72,72,72,73,70,70,63,70,70,68,72,63,65],
  P03:[62,62,58,60,62,62,62,62,63,65,63,62,60],
  P04:[64,66,68,68,69,69,68,69,69,71,69,68,69,69],
  P05:[66,66,62,59,59,64,64,64,68,68,69,71],
};

describe('Pop Music cover presets',() => {
  it('keeps two pop covers with the chord favorites and preserves simple favorites',() => {
    expect(EXAMPLE_GROUPS.map(group => group.name)).toEqual(['Favorites - Simple','Favorites - Chords','favorites - with loops','Drum Loops','Airy & Ambient','Minimal Routing']);
    expect(FAVORITE_EXAMPLES.map(song => song.id)).toEqual(['S13','F10','A01','R-S44','N02','S43','BR02-FAV']);
    expect(EXAMPLE_GROUPS[1].examples.filter(song => song.id.startsWith('P')).map(song => song.id)).toEqual(['P04','P05']);
    expect(POP_SONGS.map(song => [song.title,song.artist])).toEqual([
      ['Clocks','Coldplay'],['Viva la Vida','Coldplay'],['Bohemian Rhapsody','Queen'],['Dancing Queen','ABBA'],['Take On Me','a-ha'],
    ]);
    expect(new Set(EXAMPLES.map(song => song.id)).size).toBe(EXAMPLES.length);
  });

  it.each(POP_SONGS)('$title imports with real chords and plays all notes and rests in bounded loops',song => {
    const scene = popSongScene(song);
    expect(JSON.parse(readFileSync(`public/fixtures/${song.id}.json`,'utf8'))).toEqual(scene);
    const portable = readFileSync(`public/compositions/${song.slug}/Bongo-Planet.json`,'utf8');
    expect(Buffer.byteLength(portable)).toBeLessThan(128 * 1024);
    expect(importCompositionFile(portable).scene).toEqual(scene);
    expect(scene.pieces.length).toBeLessThanOrEqual(92);
    const stacks = [...new Set(scene.pieces.map(piece => piece.vertex))].map(vertex => scene.pieces.filter(piece => piece.vertex === vertex));
    expect(stacks.some(stack => stack.length === 4)).toBe(true);
    expect(stacks.every(stack => stack.length <= 4)).toBe(true);
    expect(scene.pieces.filter(piece => piece.kind === 'generator').map(piece => piece.kind === 'generator' ? piece.travel : 0)).toEqual([64,16,8]);
    const engine = new Engine(scene), hits: Trigger[] = [], quantum = 128 / 48000;
    let maximumEdges = 0;
    engine.play(0);
    for (let tick = 1; tick <= Math.ceil((48.5 * 60 / song.bpm) / quantum); tick++) {
      engine.advance(tick * quantum,quantum); maximumEdges = Math.max(maximumEdges,engine.snapshot().gatedEdges);
      for (const event of engine.drain()) { expect(event.type).not.toBe('reset'); if (event.type === 'onset') hits.push(event.trigger); }
    }
    expect(engine.running).toBe(true); expect(engine.lateDrops).toBe(0); expect(maximumEdges).toBeLessThanOrEqual(3);
    expect(new Set(hits.map(hit => hit.nodeId))).toEqual(new Set(scene.pieces.filter(piece => piece.kind === 'note').map(piece => piece.id)));
    const start = .25 * 60 / song.bpm, seconds = 16 * 60 / song.bpm;
    const lead = hits.filter(hit => hit.nodeId.startsWith(`${song.id}-lead-`) && hit.onset < start + seconds - 1e-7);
    expect(lead.slice(0,reference[song.id].length).map(hit => hit.sound.kind === 'note' ? Math.round(69 + 12 * Math.log2(hit.sound.frequency / 440)) : 0)).toEqual(reference[song.id]);
    let step = 0, noteIndex = 0;
    for (const [midi,ticks] of song.melody) {
      if (midi !== null) {
        expect(lead[noteIndex].onset).toBeCloseTo((step + 1) * 15 / song.bpm,8); noteIndex++;
      } else {
        expect(lead.filter(hit => hit.onset >= (step + 1) * 15 / song.bpm - 1e-7 && hit.onset < (step + ticks + 1) * 15 / song.bpm - 1e-7)).toEqual([]);
      }
      step += ticks;
    }
    const phrase = (cycle:number) => hits.filter(hit => hit.onset >= start + cycle * seconds - 1e-7 && hit.onset < start + (cycle + 1) * seconds - 1e-7)
      .map(hit => `${hit.nodeId}@${Math.round((hit.onset - start - cycle * seconds) / (15 / song.bpm))}`).sort();
    expect(phrase(2)).toEqual(phrase(1));
    if (song.id === 'P03') {
      const seventh = hits.filter(hit => hit.nodeId.startsWith('P03-chord-3-') && hit.onset < seconds);
      expect(seventh).toHaveLength(4); expect(new Set(seventh.map(hit => hit.onset)).size).toBe(1);
      expect(seventh.map(hit => hit.sound.kind === 'note' ? Math.round(69 + 12 * Math.log2(hit.sound.frequency / 440)) : 0)).toEqual([53,57,60,63]);
    }
  });
});
