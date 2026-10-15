import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {CHORD_FAVORITES,chordFavoriteAppearance} from '../scripts/chord-favorite-scores';
import {importCompositionFile} from '../src/compositionFile';
import {CHORD_EXAMPLES,DRUM_EXAMPLES} from '../src/core/examples';
import {LIMITS,type Trigger} from '../src/core/contracts';
import {Engine} from '../src/core/engine';
import {isPercussion} from '../src/core/instruments';

const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const originalHashes={
  S13:'652bd6556f4976f5f0578abcb22109627fbafc5c552b2ffe66293b790176cbde',
  F10:'ad4fb705a6a40223ca15c0b1bd7dae8635398ee8c28edae42f1061b95b03207d',
  A01:'7f3e44da11381aebdd725dbae443951096150544ca84aeec10c9510887870dec',
  'R-S44':'dbb41195f3031b86491b8558da74154e686238477dd903c7533c5f33ca8f5877',
  N02:'14e34460e061b076ae7043e6a17014bd855307a94b9bf08818b372ee95020d13',
  S43:'8f5fa4a8e5761b98400e458668704d4a8bade35c560b83f52265d1a06f5738eb',
  D01:'df2896fdbaf8cdbf7c9133ed93229fa3a6e0f01ebf3489cd208502e00cae86fa',
  D02:'0f86e33c23f7f8ab1f56bdf977c078129b513b7b1004ec5ea0f9f184695b96be',
  D03:'b087712951b5b56ea1f7d0fe4190ccdcd16c83f39e98af38489c31aa89724c67',
  D04:'aa95d4e2b4733819ca629206b53d54251e0f044ba01ac156c663b528bc644fd7',
  D05:'d585634f9adee71eb9c7aff4b907ab3ad389bb53210e3e345ff19b208a24696d',
};
// These opening pitches are independent of the arrangement builder. They catch
// register/key errors and lost melodic notes when harmonies occupy the same cell.
const openingMidi:Record<string,number[]>={
  C01:[78,76,74,73,71,69,71,73],
  C04:[36,38,40,43,48,50,52,55],
  C06:[76,71,72,74,72,71,69,69],
  C07:[60,64,67,72,76,67,72,76],
  C08:[64,64,65,67,67,65,64,62],
  C09:[67,62,67,62,67,71,74,72],
  C10:[76,69,71,72,74,76,72,76],
  C11:[62,62,69,69,64,65,64,62],
  C12:[72,65,68,68,65,65,72,70,68,65],
};

describe('separately voiced chord favorites',()=>{
  it('retains every original melodic and drum fixture while renaming the five drums',()=>{
    for(const [id,expected] of Object.entries(originalHashes))expect(sha(readFileSync(`public/fixtures/${id}.json`))).toBe(expected);
    expect(DRUM_EXAMPLES.slice(0,2).map(p=>p.name)).toEqual(['Dub Drum Loop','Afrobeat Drum Loop']);
    expect(CHORD_EXAMPLES).toEqual(CHORD_FAVORITES.filter(song=>!['C04','C05'].includes(song.id)).map(({id,name})=>({id,name})));
    expect(CHORD_FAVORITES.filter(s=>s.sourceId).map(s=>s.sourceId)).toEqual(['S13','F10','A01','R-S44','N02','S43']);
    expect(CHORD_FAVORITES.filter(s=>!s.sourceId)).toHaveLength(6);
  });

  it.each(CHORD_FAVORITES)('$id: $name imports, sounds all chord layers together and repeats safely',song=>{
    const scene=song.build(),fixture=JSON.parse(readFileSync(`public/fixtures/${song.id}.json`,'utf8'));
    const portable=readFileSync(`public/compositions/${song.slug}/Bongo-Planet.json`,'utf8');
    expect(scene).toEqual(fixture);expect(importCompositionFile(portable)).toEqual({scene,appearance:chordFavoriteAppearance(song)});
    expect(scene.version).toBe(2);expect(scene.settings.propagation).toBe('gated');expect(scene.pieces.length).toBeLessThanOrEqual(LIMITS.vertices);
    const generators=scene.pieces.filter(p=>p.kind==='generator'),notes=scene.pieces.filter(p=>p.kind==='note');
    expect(generators.every(p=>p.travel!=='infinite'&&Number.isInteger(p.travel))).toBe(true);
    const vertices=new Map<number,typeof notes>();
    for(const note of notes)vertices.set(note.vertex,[...(vertices.get(note.vertex)??[]),note]);
    const chords=[...vertices.values()].filter(stack=>stack.filter(p=>!isPercussion(p.instrument)).length>=3);
    expect(chords.length).toBeGreaterThanOrEqual(4);expect([...vertices.values()].every(stack=>stack.length<=4)).toBe(true);
    const engine=new Engine(scene),hits:Trigger[]=[],quantum=128/48000,cycleSeconds=song.cycleBeats*60/song.bpm;
    engine.play(0);let maximumEdges=0,maximumPending=0;
    for(let tick=1;tick<=Math.ceil((4*cycleSeconds+60/song.bpm)/quantum);tick++) {
      engine.advance(tick*quantum,quantum);
      const events=engine.drain(),state=engine.snapshot();
      maximumEdges=Math.max(maximumEdges,state.gatedEdges);maximumPending=Math.max(maximumPending,state.pending);
      if(!state.running||events.some(e=>e.type==='reset'))throw Error(`${song.id}: unexpected playback reset`);
      for(const e of events)if(e.type==='onset')hits.push(e.trigger);
    }
    expect(engine.lateDrops).toBe(0);expect(maximumEdges).toBeLessThanOrEqual(LIMITS.gatedEdges);expect(maximumPending).toBeLessThanOrEqual(LIMITS.pending);
    expect(new Set(hits.map(hit=>hit.nodeId))).toEqual(new Set(notes.map(note=>note.id)));
    for(const chord of chords) {
      const onsets=chord.map(note=>hits.filter(hit=>hit.nodeId===note.id).map(hit=>Number(hit.onset.toFixed(8))));
      for(const layer of onsets)expect(layer).toEqual(onsets[0]);
    }
    const pattern=(cycle:number)=>hits.filter(h=>h.onset>=cycle*cycleSeconds-1e-7&&h.onset<(cycle+1)*cycleSeconds-1e-7)
      .map(h=>`${h.nodeId}/${h.generatorId}@${Math.round((h.onset-cycle*cycleSeconds)*song.bpm/15)}`).sort();
    expect(pattern(3)).toEqual(pattern(2));
    if(openingMidi[song.id]) {
      const expected=openingMidi[song.id];
      const opening=hits.filter(hit=>hit.nodeId.includes('-lead-')&&hit.sound.kind==='note').slice(0,expected.length);
      expect(opening.map(hit=>hit.sound.kind==='note'?Math.round(69+12*Math.log2(hit.sound.frequency/440)):0)).toEqual(expected);
    }
    const report=JSON.parse(readFileSync(`public/compositions/${song.slug}/validation.json`,'utf8'));
    expect(report.compositionSha256).toBe(sha(portable));expect(report.simulation.allLayersReached).toBe(true);expect(report.simulation.maximumDecisionsPerQuantum).toBeLessThanOrEqual(64);
    const wav=readFileSync(`public/compositions/${song.slug}/preview.wav`);
    expect(report.audio.sha256).toBe(sha(wav));expect(wav.toString('ascii',0,4)).toBe('RIFF');expect(wav.readUInt16LE(22)).toBe(2);
    let peak=0,energy=0;for(let offset=44;offset<wav.length;offset+=2){const value=wav.readInt16LE(offset)/32768;peak=Math.max(peak,Math.abs(value));energy+=value*value;}
    expect(peak).toBeGreaterThan(.015);expect(peak).toBeLessThan(.9);expect(Math.sqrt(energy/((wav.length-44)/2))).toBeCloseTo(report.audio.rms,3);
    expect(report.audio.repeatError).toBeLessThan(1e-5);expect(report.audio.stolenVoices).toBe(0);expect(report.audio.lateDrops).toBe(0);
  });

  it('Avril keeps its melodic ties while shaping a lift and release',()=>{
    const scene=CHORD_FAVORITES.find(song=>song.id==='C12')!.build();
    const lead=scene.pieces.filter(p=>p.kind==='note').filter(p=>p.id.includes('-lead-'));
    expect(Math.max(...lead.map(p=>p.level))/Math.min(...lead.map(p=>p.level))).toBeGreaterThan(1.8);
    expect(lead.some(p=>p.id.includes('-15-')&&p.duration>7*15/80)).toBe(true);
    expect(new Set(scene.pieces.filter(p=>p.kind==='note').map(p=>p.instrument))).toEqual(new Set(['piano','guitar','glass','marimba']));
    expect(CHORD_EXAMPLES.some(song=>song.id==='C13')).toBe(false);
  });

  it('Avril develops for 24 seconds with a new middle and a return before repeating',()=>{
    const song=CHORD_FAVORITES.find(song=>song.id==='C12')!,scene=song.build();
    expect(song.cycleBeats*60/song.bpm).toBe(24);expect(scene.settings.bpm).toBe(80);
    const engine=new Engine(scene),hits:Trigger[]=[],quantum=128/48000;
    engine.play(0);
    for(let tick=1;tick<=Math.ceil(24/quantum);tick++) {
      engine.advance(tick*quantum,quantum);
      for(const event of engine.drain())if(event.type==='onset')hits.push(event.trigger);
    }
    const middle=hits.filter(hit=>hit.nodeId.includes('-bridge-lead-'));
    expect(middle.map(hit=>hit.sound.kind==='note'?Math.round(69+12*Math.log2(hit.sound.frequency/440)):0)).toEqual([73,72,70,68,75,73]);
    expect(middle.map(hit=>Number(hit.onset.toFixed(4)))).toEqual([12.1875,12.9375,13.6875,14.4375,15.1875,16.6875]);
    const opening=hits.filter(hit=>hit.nodeId.includes('-lead-0-0-'));
    expect(opening.map(hit=>Number(hit.onset.toFixed(4)))).toEqual([.1875,17.4375]);
    expect(scene.pieces.filter(p=>p.kind==='generator')).toHaveLength(2);
  });

  it('Avril gives the middle firmer accents and space between attacks',()=>{
    const scene=CHORD_FAVORITES.find(song=>song.id==='C12')!.build();
    const notes=scene.pieces.filter(p=>p.kind==='note');
    const middle=notes.filter(p=>p.id.includes('-bridge-lead-'));
    const opening=notes.filter(p=>p.id.includes('-lead-0-'));
    const accents=middle.filter(p=>[0,8,16].some(step=>p.id.includes(`-1-${step}-`)));
    const replies=middle.filter(p=>[4,12,24].some(step=>p.id.includes(`-1-${step}-`)));
    expect(Math.min(...accents.map(p=>p.level))).toBeGreaterThan(Math.max(...opening.map(p=>p.level)));
    expect(Math.min(...accents.map(p=>p.level))).toBeGreaterThan(Math.max(...replies.map(p=>p.level)));
    expect(middle.every(p=>p.duration<(p.id.includes('-1-16-')?8:4)*15/80)).toBe(true);
    const mallets=notes.filter(p=>p.instrument==='marimba');
    expect(mallets).toHaveLength(3);
    expect(mallets.every(p=>p.id.includes('-bridge-chord-'))).toBe(true);
  });

  it('retains Airy Loops sources and original exits, and the North Pole meridians with silent returns',()=>{
    for(const [index,sourceId] of [[2,'A01'],[4,'N02']] as const) {
      const scene=CHORD_FAVORITES[index].build(),original=JSON.parse(readFileSync(`public/fixtures/${sourceId}.json`,'utf8'));
      if(sourceId==='A01') {
        for(const record of original.wiring)expect(scene.wiring!.find(w=>w.vertex===record.vertex)!.exits).toEqual(expect.arrayContaining(record.exits));
      } else expect(scene.wiring).toEqual(original.wiring);
      expect(scene.pieces.filter(p=>p.kind==='generator').map(({id,...p})=>p)).toEqual(original.pieces.filter((p:any)=>p.kind==='generator').map(({id,...p}:any)=>p));
    }
    const folk=CHORD_FAVORITES[10].build();
    expect(folk.pieces.find(p=>p.kind==='generator')).toMatchObject({period:12,travel:48});
    const endings=folk.pieces.flatMap(p=>p.kind==='note'&&p.id.startsWith('C11-lead')?[p.duration]:[]);
    expect(Math.max(...endings)).toBeCloseTo(6*15/50*1.02);
  });
});
