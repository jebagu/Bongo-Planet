import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {CLASSIC_SONGS,classicSongScene} from '../src/core/classics';
import {EXAMPLE_GROUPS,EXAMPLES} from '../src/core/examples';
import {Engine} from '../src/core/engine';
import {importCompositionFile} from '../src/compositionFile';
import type {Trigger} from '../src/core/contracts';

const inventory = JSON.parse(readFileSync('public/songs/classics.json','utf8')) as {tracks:{id:string;file:string}[]};

describe('classics and favorite presets',() => {
  it('retains the original favorites, renames the drums and adds a separate chord section',() => {
    expect(EXAMPLES.slice(0,2)).toEqual([{id:'S13',name:'Pachelbel’s Canon'},{id:'F10',name:'Toy Ensemble'}]);
    expect(EXAMPLE_GROUPS.map(group => group.name)).toEqual(['Favorites - Simple','Favorites - Chords','favorites - with loops','Drum Loops','Airy & Ambient','Minimal Routing']);
    expect(EXAMPLE_GROUPS[0].examples.map(example => example.id)).toEqual(['S13','F10','A01','R-S44','N02','S43','BR02-FAV']);
    expect(EXAMPLES.filter(example => example.id === 'BR02-FAV')).toEqual([{id:'BR02-FAV',name:'Take On Me — Spark Build'}]);
    expect(new Set(EXAMPLES.map(example => example.id)).size).toBe(EXAMPLES.length);
  });

  it('keeps the music in Pachelbel’s Canon and Toy Ensemble byte for byte',() => {
    for (const [id,sha] of [['S13','652bd6556f4976f5f0578abcb22109627fbafc5c552b2ffe66293b790176cbde'],['F10','ad4fb705a6a40223ca15c0b1bd7dae8635398ee8c28edae42f1061b95b03207d']]) {
      expect(createHash('sha256').update(readFileSync(`public/fixtures/${id}.json`)).digest('hex')).toBe(sha);
    }
  });

  it('adds 20 different classics across pop, rock, classical, and jazz, all using almost the full planet',() => {
    expect(CLASSIC_SONGS).toHaveLength(20);
    expect(new Set(CLASSIC_SONGS.map(song => song.id)).size).toBe(20);
    expect(new Set(CLASSIC_SONGS.map(song => song.title)).size).toBe(20);
    expect(new Set(CLASSIC_SONGS.map(song => JSON.stringify(song.melody))).size).toBe(20);
    expect(['Pop','Rock','Classical','Jazz'].map(genre => CLASSIC_SONGS.filter(song => song.genre === genre).length)).toEqual([6,6,5,3]);
    expect(inventory.tracks.map(track => track.id)).toEqual(CLASSIC_SONGS.map(song => song.id));
    for (const song of CLASSIC_SONGS) {expect(song.nodes).toBeGreaterThanOrEqual(82);expect(song.nodes).toBeLessThanOrEqual(88);}
  });

  it.each(CLASSIC_SONGS)('$id: $title validates, imports, and uses the promised number of live nodes',song => {
    const scene = classicSongScene(song);
    expect(scene).toEqual(JSON.parse(readFileSync(`public/fixtures/${song.id}.json`,'utf8')));
    const text = readFileSync(`public/songs/${inventory.tracks.find(track => track.id === song.id)!.file}`,'utf8');
    expect(Buffer.byteLength(text)).toBeLessThan(128 * 1024);
    const imported = importCompositionFile(text);
    expect(imported.scene).toEqual(scene); expect(imported.appearance).toBeDefined();
    expect(scene.pieces).toHaveLength(song.nodes);
    expect(new Set(scene.pieces.map(piece => piece.vertex)).size).toBe(song.nodes);
    for (const piece of scene.pieces) {
      if (piece.kind === 'generator') {expect(piece.enabled).toBe(true);expect(piece.travel as number).toBeLessThanOrEqual(piece.period * 4);}
      else {expect(piece.kind).toBe('note');expect(piece.level).toBeGreaterThan(.03);}
    }
    const engine = new Engine(scene),onsets: Trigger[] = [],resets: string[] = [];
    const quantum = 128 / 48000,until = song.period * 8 * 60 / song.bpm;
    let peakEdges = 0,peakPending = 0;
    engine.play(0);
    for (let time = 0; time <= until + quantum; time += quantum) {
      engine.advance(time,quantum);
      const state = engine.snapshot(); peakEdges = Math.max(peakEdges,state.gatedEdges);peakPending = Math.max(peakPending,state.pending);
      for (const event of engine.drain()) {
        if (event.type === 'onset') onsets.push(event.trigger);
        if (event.type === 'reset') resets.push(event.reason);
      }
    }
    expect(resets).toEqual([]);expect(engine.running).toBe(true);expect(engine.lateDrops).toBe(0);
    const sources = scene.pieces.filter(piece => piece.kind === 'generator').length;
    expect(peakEdges).toBeLessThanOrEqual(sources);expect(peakPending).toBeLessThanOrEqual(sources);
    expect(new Set(onsets.map(trigger => trigger.nodeId))).toEqual(new Set(scene.pieces.filter(piece => piece.kind === 'note').map(piece => piece.id)));
    const scale = song.scale === 'major' ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10];
    let step = 0;
    for (const [pitch,ticks] of song.melody) {
      const matching = onsets.filter(trigger => trigger.nodeId === `${song.id}-hook-${step}`);
      if (pitch !== null) {
        expect(matching).toHaveLength(8);
        for (const [cycle,trigger] of matching.entries()) {
          expect(trigger.onset).toBeCloseTo((cycle * song.period * 4 + step + 1) * 15 / song.bpm,9);
          expect(trigger.sound.kind).toBe('note');
          if (trigger.sound.kind !== 'note') throw Error('Expected sampled hook');
          const midi = 12 * (song.leadOctave + Math.floor(pitch / 7) + 1) + song.key + scale[((pitch % 7) + 7) % 7];
          expect(trigger.sound.instrument).toBe(song.lead);
          expect(trigger.sound.frequency).toBeCloseTo(440 * 2 ** ((midi - 69) / 12),8);
        }
      } else {
        // Other instruments may answer; a written gap cannot play the hook voice.
        expect(matching.every(trigger => trigger.sound.kind === 'note' && trigger.sound.instrument !== song.lead)).toBe(true);
      }
      step += ticks;
    }
  });

  it('retains independent reference pitches for three recognizable riffs',() => {
    const examples = [{id:'S23',midi:[42,49,52,54,52,49,47,49]},
      {id:'S24',midi:[66,66,62,59,59,64,64,64]},
      {id:'S30',midi:[75,70,67,75,70,67,75,70]}];
    for (const {id,midi} of examples) {
      const song = CLASSIC_SONGS.find(song => song.id === id)!,engine = new Engine(classicSongScene(song)),hits: Trigger[] = [];
      engine.play(0);
      for (let time = 0; time < song.period * 60 / song.bpm; time += .002) {
        engine.advance(time);
        hits.push(...engine.drain().filter(event => event.type === 'onset' && event.trigger.nodeId.startsWith(`${id}-hook-`) && event.trigger.sound.kind === 'note' && event.trigger.sound.instrument === song.lead).map(event => event.type === 'onset' ? event.trigger : null).filter((trigger): trigger is Trigger => trigger !== null));
      }
      expect(hits.slice(0,midi.length).map(trigger => trigger.sound.kind === 'note' ? Math.round(69 + 12 * Math.log2(trigger.sound.frequency / 440)) : 0)).toEqual(midi);
    }
  });
});
