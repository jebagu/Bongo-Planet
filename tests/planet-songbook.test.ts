import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLANET_SONGS, planetSongScene } from '../src/core/songbook';
import { EXAMPLES } from '../src/core/examples';
import { Engine } from '../src/core/engine';
import { topology } from '../src/core/geometry';
import { isPercussion, PERCUSSION_INSTRUMENTS } from '../src/core/instruments';
import { importCompositionFile } from '../src/compositionFile';
import type { Trigger } from '../src/core/contracts';

const inventory = JSON.parse(readFileSync('public/songs/index.json','utf8')) as {tracks:{id:string;file:string}[]};

describe('20-song Bongo Planet collection', () => {
  it('adds 14 covers and six originals, with the requested distribution of occupied nodes', () => {
    expect(PLANET_SONGS).toHaveLength(20);
    expect(new Set(PLANET_SONGS.map(song => song.id)).size).toBe(20);
    expect(new Set(PLANET_SONGS.map(song => song.title)).size).toBe(20);
    expect(PLANET_SONGS.filter(song => song.kind === 'cover')).toHaveLength(14);
    expect(PLANET_SONGS.filter(song => song.kind === 'original')).toHaveLength(6);
    expect(PLANET_SONGS.map(song => song.nodes)).toEqual([...Array(6).fill(23),...Array(6).fill(46),...Array(4).fill(76),...Array(4).fill(92)]);
    expect(inventory.tracks.map(track => track.id)).toEqual(PLANET_SONGS.map(song => song.id));
    expect(PLANET_SONGS.filter(song => EXAMPLES.some(example => example.id === song.id)).map(song => song.id)).toEqual(['S13']);
    expect(new Set(PLANET_SONGS.map(song => JSON.stringify(song.melody))).size).toBe(20);
  });

  it.each(PLANET_SONGS)('$id: $title imports with its complete music and look', song => {
    const scene = planetSongScene(song);
    const fixture = JSON.parse(readFileSync(`public/fixtures/${song.id}.json`,'utf8'));
    expect(fixture).toEqual(scene);
    const track = inventory.tracks.find(track => track.id === song.id)!;
    const portable = readFileSync(`public/songs/${track.file}`,'utf8');
    expect(Buffer.byteLength(portable)).toBeLessThan(128 * 1024);
    const restored = importCompositionFile(portable);
    expect(restored.scene).toEqual(scene);
    expect(restored.appearance).toBeDefined();
    expect(scene.version).toBe(2);
    expect(scene.settings.propagation).toBe('gated');
    expect(scene.pieces).toHaveLength(song.nodes);
    expect(new Set(scene.pieces.map(piece => piece.vertex)).size).toBe(song.nodes);
    const drums = scene.pieces.filter(piece => piece.kind === 'note' && isPercussion(piece.instrument));
    expect(new Set(drums.map(piece => piece.kind === 'note' && piece.instrument))).toEqual(new Set(PERCUSSION_INSTRUMENTS.map(instrument => instrument.id)));
    for (const piece of scene.pieces) {
      if (piece.kind === 'generator') {
        expect(piece.enabled).toBe(true);
        expect(piece).not.toHaveProperty('path');
        expect(typeof piece.travel).toBe('number');
        expect(piece.travel as number).toBeLessThanOrEqual(piece.period * 4);
      } else if (piece.kind === 'note') expect(piece.level).toBeGreaterThan(.03);
    }
    for (const record of scene.wiring!) {
      expect(record.exits.length).toBeLessThanOrEqual(1);
      for (const destination of record.exits) expect(topology.neighbors[record.vertex]).toContain(destination);
    }
    if (song.nodes === 92) expect(scene.pieces.map(piece => piece.vertex).sort((a,b) => a-b)).toEqual(Array.from({length:92},(_,i) => i));
  });

  it.each(PLANET_SONGS)('$id: every sound node plays, the lead keeps its score, and repetition stays bounded', song => {
    const scene = planetSongScene(song), engine = new Engine(scene);
    const onsets: Trigger[] = [];
    const resets: string[] = [];
    const quantum = 128 / 48000;
    const until = (song.nodes === 92 ? 64 : song.meter * 4) * 60 / song.bpm;
    let maxEdges = 0, maxPending = 0;
    engine.play(0);
    for (let time = 0; time <= until + quantum; time += quantum) {
      engine.advance(time,quantum);
      const snapshot = engine.snapshot();
      maxEdges = Math.max(maxEdges,snapshot.gatedEdges); maxPending = Math.max(maxPending,snapshot.pending);
      for (const event of engine.drain()) {
        if (event.type === 'onset') onsets.push(event.trigger);
        if (event.type === 'reset') resets.push(event.reason);
        if (event.type === 'edge') expect(event.edge.arrival - event.edge.departure).toBeCloseTo(15 / song.bpm,10);
      }
    }
    expect(resets).toEqual([]);
    expect(engine.running).toBe(true);
    expect(engine.lateDrops).toBe(0);
    const sounds = scene.pieces.filter(piece => piece.kind !== 'generator');
    expect(new Set(onsets.map(trigger => trigger.nodeId))).toEqual(new Set(sounds.map(piece => piece.id)));
    expect(maxEdges).toBeLessThanOrEqual(scene.pieces.length - sounds.length);
    expect(maxPending).toBeLessThanOrEqual(scene.pieces.length - sounds.length);
    let step = 0;
    const scale = song.scale === 'major' ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10];
    for (const [pitch,ticks] of song.melody) {
      const trigger = onsets.find(trigger => trigger.nodeId === `${song.id}-melody-${step}`)!;
      expect(trigger).toBeDefined();
      expect(trigger.onset).toBeCloseTo((step + 1) * 15 / song.bpm,10);
      expect(trigger.sound.kind).toBe('note');
      if (trigger.sound.kind !== 'note') throw Error('Unexpected legacy percussion');
      const degree = ((pitch % 7) + 7) % 7;
      const midi = 12 * (5 + Math.floor(pitch / 7)) + song.key + scale[degree];
      expect(trigger.sound.instrument).toBe(song.lead);
      expect(trigger.sound.frequency).toBeCloseTo(440 * 2 ** ((midi - 69) / 12),8);
      step += ticks;
    }
  });

  it('uses all seven scale degrees and all five octave registers with pitched instruments', () => {
    const notes = PLANET_SONGS.flatMap(song => planetSongScene(song).pieces)
      .filter(piece => piece.kind === 'note' && !isPercussion(piece.instrument));
    expect(new Set(notes.map(piece => piece.kind === 'note' && piece.degree))).toEqual(new Set([0,1,2,3,4,5,6]));
    expect(new Set(notes.map(piece => piece.kind === 'note' && piece.octave))).toEqual(new Set([2,3,4,5,6]));
  });
});
