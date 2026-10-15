import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {REWORKED_SONGS,REWORKED_PRESETS,reworkedAttacks,reworkedSongScene} from '../src/core/reworkedSongs';
import {PLANET_SONGS} from '../src/core/songbook';
import {CLASSIC_SONGS} from '../src/core/classics';
import {GAME_THEMES} from '../src/core/gameThemes';
import {SONGS} from '../src/core/legacySongs';
import {EXAMPLE_GROUPS,EXAMPLES} from '../src/core/examples';
import {Engine} from '../src/core/engine';
import {topology} from '../src/core/geometry';
import {isPercussion} from '../src/core/instruments';
import {importCompositionFile} from '../src/compositionFile';
import type {Trigger} from '../src/core/contracts';

const inventory = JSON.parse(readFileSync('public/songs/reworked/index.json','utf8')) as {tracks:{id:string;sourceId:string;file:string}[]};
const originalPitches = new Map<string,readonly number[]>([
  ...PLANET_SONGS.filter(song => song.kind === 'cover').map(song => [song.id,song.melody.map(note => note[0]).filter(pitch => pitch !== null)] as const),
  ...[...CLASSIC_SONGS,...GAME_THEMES].map(song => [song.id,song.melody.map(note => note[0]).filter(pitch => pitch !== null)] as const),
  ...SONGS.map(song => [song.id,song.degrees] as const),
]);

describe('expressive cover reworks',() => {
  it('retains all 42 local reworks while keeping only the favorite Prelude in the app',() => {
    expect(REWORKED_SONGS).toHaveLength(42);
    expect(new Set(REWORKED_SONGS.map(song => song.sourceId))).toEqual(new Set(originalPitches.keys()));
    expect(REWORKED_PRESETS[0].id).toBe('R-S13');
    expect(EXAMPLE_GROUPS.map(group => group.name)).toEqual(['Favorites - Simple','Favorites - Chords','favorites - with loops','Drum Loops','Airy & Ambient','Minimal Routing']);
    expect(EXAMPLES.filter(preset => preset.id.startsWith('R-')).map(preset => preset.id)).toEqual(['R-S44']);
    expect(EXAMPLES.slice(0,2).map(preset => preset.id)).toEqual(['S13','F10']);
    for (const song of REWORKED_SONGS) {
      expect(song.id).toBe(`R-${song.sourceId}`);
      expect(reworkedAttacks(song).map(hit => hit.pitch)).toEqual(originalPitches.get(song.sourceId));
    }
    for (const id of ['F00','F10','F15','F16','F17','S15','S16','S17','S18','S19','S20']) {
      expect(REWORKED_SONGS.some(song => song.sourceId === id)).toBe(false);
    }
    expect(inventory.tracks.map(track => track.id)).toEqual(REWORKED_SONGS.map(song => song.id));
  });

  it('preserves the earlier scenes byte for byte, including the original songs',() => {
    const checks = readFileSync('evidence/reworked/original-scenes.sha256','utf8').trim().split('\n');
    expect(checks.length).toBeGreaterThanOrEqual(49);
    for (const line of checks) {
      const [sha,path] = line.split(/\s+/);
      expect(createHash('sha256').update(readFileSync(path)).digest('hex'),path).toBe(sha);
    }
  });

  it('chooses individual tempi and writes varied accents with all scale degrees and registers available',() => {
    expect(REWORKED_SONGS.filter(song => (song.bpm-song.originalBpm)*(song.sourceId === 'S43' ? 2 : 1) >= 8)).toHaveLength(29);
    expect(REWORKED_SONGS.find(song => song.sourceId === 'S36')!.bpm).toBe(66);
    expect(REWORKED_SONGS.find(song => song.sourceId === 'S24')!.bpm).toBe(176);
    const notes = REWORKED_SONGS.flatMap(song => reworkedSongScene(song).pieces)
      .filter(piece => piece.kind === 'note' && !isPercussion(piece.instrument));
    expect(new Set(notes.map(piece => piece.kind === 'note' && piece.degree))).toEqual(new Set([0,1,2,3,4,5,6]));
    expect(new Set(notes.map(piece => piece.kind === 'note' && piece.octave))).toEqual(new Set([2,3,4,5,6]));
  });

  it.each(REWORKED_SONGS)('$id: $title imports its complete arrangement, expression and finite adjacent routes',song => {
    const scene = reworkedSongScene(song);
    expect(scene).toEqual(JSON.parse(readFileSync(`public/fixtures/${song.id}.json`,'utf8')));
    const text = readFileSync(`public/songs/reworked/${inventory.tracks.find(track => track.id === song.id)!.file}`,'utf8');
    expect(Buffer.byteLength(text)).toBeLessThan(128 * 1024);
    const imported = importCompositionFile(text);
    expect(imported.scene).toEqual(scene);expect(imported.appearance).toBeDefined();
    expect(scene.version).toBe(2);expect(scene.settings.propagation).toBe('gated');
    expect(scene.pieces.length).toBeGreaterThanOrEqual(67);expect(scene.pieces.length).toBeLessThanOrEqual(92);
    expect(new Set(scene.pieces.map(piece => piece.vertex)).size).toBe(scene.pieces.length);
    const sources = scene.pieces.filter(piece => piece.kind === 'generator');
    expect(sources).toHaveLength(song.sourceId === 'S43' ? 1 : 8);
    for (const source of sources) {
      expect(source.enabled).toBe(true);expect(source.period).toBe(song.period);
      expect(typeof source.travel).toBe('number');expect(source.travel as number).toBeLessThanOrEqual(song.period * 4);
    }
    for (const route of scene.wiring!) for (const destination of route.exits) expect(topology.neighbors[route.vertex]).toContain(destination);
    expect(scene.wiring!.some(route => route.exits.length >= 2)).toBe(song.sourceId !== 'S43');
    const lead = scene.pieces.filter(piece => piece.kind === 'note' && piece.id.startsWith(`${song.id}-melody-`));
    expect(lead).toHaveLength(originalPitches.get(song.sourceId)!.length);
    const levels = lead.map(piece => piece.kind === 'note' ? piece.level : 0);
    expect(Math.max(...levels)-Math.min(...levels)).toBeGreaterThan(.05);
    expect(new Set(lead.map(piece => piece.kind === 'note' && piece.duration)).size).toBeGreaterThan(1);
    for (const piece of scene.pieces) if (piece.kind === 'note') expect(piece.level).toBeGreaterThan(.03);
  });

  it.each(REWORKED_SONGS)('$id: every instrument plays, chords sound together, and eight loops preserve the melody without overload',song => {
    const scene = reworkedSongScene(song),engine = new Engine(scene),onsets: Trigger[] = [],resets: string[] = [];
    const quantum = 128 / 48000,hop = 15 / song.bpm,loop = song.period * 4;
    let peakEdges = 0,peakPending = 0;
    engine.play(0);
    for (let time = 0;time <= loop * 8 * hop + quantum;time += quantum) {
      engine.advance(time,quantum);
      const state = engine.snapshot();peakEdges=Math.max(peakEdges,state.gatedEdges);peakPending=Math.max(peakPending,state.pending);
      for (const event of engine.drain()) {
        if (event.type === 'onset') onsets.push(event.trigger);
        if (event.type === 'reset') resets.push(event.reason);
        if (event.type === 'edge') expect(event.edge.arrival-event.edge.departure).toBeCloseTo(hop,10);
      }
    }
    expect(resets).toEqual([]);expect(engine.running).toBe(true);expect(engine.lateDrops).toBe(0);
    expect(peakEdges).toBeLessThanOrEqual(32);expect(peakPending).toBeLessThanOrEqual(32);
    expect(new Set(onsets.map(hit => hit.nodeId))).toEqual(new Set(scene.pieces.filter(piece => piece.kind === 'note').map(piece => piece.id)));
    const scale = song.scale === 'major' ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10];
    for (const hit of reworkedAttacks(song)) {
      const played = onsets.filter(trigger => trigger.nodeId === `${song.id}-melody-${hit.step}`);
      expect(played).toHaveLength(8);
      for (const [cycle,trigger] of played.entries()) {
        expect(trigger.onset).toBeCloseTo((cycle*loop+hit.step+1)*hop,9);
        expect(trigger.sound.kind).toBe('note');
        if (trigger.sound.kind !== 'note') throw Error('Expected sampled note');
        const midi = 12*(song.leadOctave+Math.floor(hit.pitch/7)+1)+song.key+scale[((hit.pitch%7)+7)%7];
        expect(trigger.sound.instrument).toBe(song.lead);
        expect(trigger.sound.frequency).toBeCloseTo(440*2**((midi-69)/12),8);
      }
    }
    const chordCounts = new Map<string,number>();
    for (const hit of onsets.filter(hit => hit.nodeId.startsWith(`${song.id}-chord-`) && hit.onset < loop*hop)) {
      const key = hit.onset.toFixed(9);chordCounts.set(key,(chordCounts.get(key)??0)+1);
    }
    if (song.sourceId !== 'S43') expect(Math.max(...chordCounts.values())).toBeGreaterThanOrEqual(2);
    engine.pause(engine.snapshot().time);expect(engine.snapshot().pending).toBe(0);expect(engine.snapshot().gatedEdges).toBe(0);
  });
});
