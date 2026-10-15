import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {DRUM_BUILDS} from '../scripts/drum-build-scores';
import {importCompositionFile} from '../src/compositionFile';
import {Engine} from '../src/core/engine';
import {LIMITS,type Scene,type Trigger} from '../src/core/contracts';
import {EXAMPLE_GROUPS} from '../src/core/examples';

function trace(scene:Scene) {
  const engine=new Engine(scene),quantum=128/48000,hits:Trigger[]=[];
  const seconds=128*60/scene.settings.bpm;let edges=0,decisions=0;
  engine.play(0);
  for(let tick=1;tick<=Math.ceil(seconds/quantum);tick++) {
    engine.advance(tick*quantum,quantum);const batch=engine.drain();
    assert(engine.running);assert(!batch.some(event=>event.type==='reset'));
    edges=Math.max(edges,engine.snapshot().gatedEdges);
    decisions=Math.max(decisions,batch.filter(event=>event.type==='arrival').length+new Set(batch.filter(event=>event.type==='emission').map(event=>event.time)).size);
    for(const event of batch)if(event.type==='onset')hits.push(event.trigger);
  }
  expect(engine.lateDrops).toBe(0);expect(edges).toBeLessThanOrEqual(LIMITS.gatedEdges);
  expect(decisions).toBeLessThanOrEqual(LIMITS.gatedQuantum);
  return hits;
}

describe('drum builds with finite feedback',()=>{
  it('keeps only Trapdoor after the two existing Drum Loops',()=>{
    expect(DRUM_BUILDS.map(loop=>loop.id)).toEqual(['DB03']);
    expect(EXAMPLE_GROUPS.find(group=>group.name==='Drum Loops')?.examples).toEqual([
      {id:'D04',name:'Dub Drum Loop'},{id:'D05',name:'Afrobeat Drum Loop'},
      ...DRUM_BUILDS.map(({id,name})=>({id,name})),
    ]);
  });
  it.each(DRUM_BUILDS)('$name builds and releases while the underlying groove stays unchanged',loop=>{
    const scene=loop.build(),portable=importCompositionFile(readFileSync(`public/compositions/${loop.slug}/Bongo-Planet.json`,'utf8'));
    expect(portable.scene).toEqual(scene);
    expect(scene).toEqual(JSON.parse(readFileSync(`public/fixtures/${loop.id}.json`,'utf8')));
    expect(new Set(scene.pieces.filter(p=>p.kind==='note').map(p=>p.instrument))).toEqual(new Set(['kick','snare','hi-hat','bongo-high','bongo-low']));
    const sources=scene.pieces.filter(p=>p.kind==='generator');
    expect(sources).toHaveLength(2);
    expect(sources.every(source=>Number.isInteger(source.travel)&&Number(source.travel)>0)).toBe(true);
    const hits=trace(scene),beat=60/loop.bpm,seconds=loop.cycleBeats*beat,hop=beat/4;
    expect(new Set(hits.map(hit=>hit.nodeId))).toEqual(new Set(scene.pieces.filter(p=>p.kind==='note').map(p=>p.id)));
    const cyclePattern=(cycle:number)=>hits.filter(hit=>hit.onset>=cycle*seconds-1e-7&&hit.onset<(cycle+1)*seconds-1e-7)
      .map(hit=>`${hit.nodeId}/${hit.generatorId}@${Math.round((hit.onset-cycle*seconds)/hop)}`).sort();
    expect(cyclePattern(3)).toEqual(cyclePattern(2));expect(cyclePattern(2)).toEqual(cyclePattern(1));
    const base=hits.filter(hit=>hit.generatorId===`${loop.id}-groove-source`);
    const phrase=(index:number)=>base.filter(hit=>hit.onset>=(index*16+.25)*beat-1e-7&&hit.onset<((index+1)*16+.25)*beat-1e-7)
      .map(hit=>`${hit.nodeId}@${Math.round((hit.onset-index*16*beat)/hop)}`).sort();
    expect(phrase(0)).toHaveLength(loop.groove.length*2);
    for(let index=1;index<7;index++)expect(phrase(index)).toEqual(phrase(0));
    const first=hits.filter(hit=>hit.onset<seconds-1e-7);
    const bins=Array.from({length:16},(_,index)=>first.filter(hit=>hit.onset>=index*2*beat-1e-7&&hit.onset<(index+1)*2*beat-1e-7).length);
    expect(Math.max(...bins)).toBeGreaterThanOrEqual(4*(bins[0]+bins[1])/2);
    const feedback=first.filter(hit=>hit.generatorId===`${loop.id}-feedback-source`);
    const start=loop.feedbackOffset*beat,end=start+loop.feedbackTravel*hop;
    expect(feedback.length).toBeGreaterThan(30);
    expect(feedback.every(hit=>hit.onset>start-1e-7&&hit.onset<=end+1e-7)).toBe(true);
    expect(first.filter(hit=>hit.onset>=24*beat-1e-7).every(hit=>hit.generatorId===`${loop.id}-groove-source`)).toBe(true);
    expect(first.some(hit=>hit.onset>end+beat&&hit.generatorId===`${loop.id}-groove-source`)).toBe(true);
  });
});
