import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {CHORD_FAVORITES} from '../scripts/chord-favorite-scores';
import {POP_SONGS,popSongScene} from '../src/core/popSongs';
import {spatialArrangement,spatialCoverage} from '../src/core/spatialArrangement';
import {Engine} from '../src/core/engine';
import {topology} from '../src/core/geometry';
import {LIMITS,type Scene,type Trigger} from '../src/core/contracts';

const before=(id:string):Scene=>JSON.parse(readFileSync(`evidence/wraparound/before/${id}.json`,'utf8'));
const catalog:{id:string;name:string}[]=JSON.parse(readFileSync('evidence/wraparound/before/catalog.json','utf8'));
const cases=catalog.map(song=>({
  ...song,
  build:()=>CHORD_FAVORITES.find(item=>item.id===song.id)?.build()??popSongScene(POP_SONGS.find(item=>item.id===song.id)!),
}));

function play(scene:Scene,cycleBeats:number) {
  const engine=new Engine(scene),hits:Trigger[]=[],quantum=128/48000;
  engine.play(0);let maximumEdges=0;
  for(let tick=1;tick<=Math.ceil((4*cycleBeats+.5)*60/scene.settings.bpm/quantum);tick++) {
    engine.advance(tick*quantum,quantum);
    maximumEdges=Math.max(maximumEdges,engine.snapshot().gatedEdges);
    for(const event of engine.drain()) {
      if(event.type==='reset')throw Error(`Spatial arrangement reset: ${event.reason}`);
      if(event.type==='onset')hits.push(event.trigger);
    }
  }
  expect(engine.running).toBe(true);expect(engine.lateDrops).toBe(0);expect(maximumEdges).toBeLessThanOrEqual(LIMITS.gatedEdges);
  return hits;
}
const music=(hits:Trigger[])=>hits.map(hit=>({nodeId:hit.nodeId,generatorId:hit.generatorId,onset:Number(hit.onset.toFixed(8)),sound:hit.sound}))
  .sort((a,b)=>a.onset-b.onset||a.nodeId.localeCompare(b.nodeId)||a.generatorId.localeCompare(b.generatorId));

describe('wraparound arrangements of the retained chord favorites',()=>{
  it.each(cases)('$id: $name covers the sphere while retaining every original note and its timing',song=>{
    const original=before(song.id),scene=song.build();
    expect(scene.settings).toEqual(original.settings);
    const originals=new Map(original.pieces.map(piece=>[piece.id,piece]));
    for(const piece of scene.pieces.filter(piece=>originals.has(piece.id))) {
      const {vertex:oldVertex,...old}=originals.get(piece.id)!;
      const {vertex:newVertex,...current}=piece;
      expect(current).toEqual(old);
    }
    expect(scene.pieces.filter(piece=>originals.has(piece.id))).toHaveLength(original.pieces.length);
    const added=scene.pieces.filter(piece=>!originals.has(piece.id));
    expect(added).toHaveLength(['C03','C09','C10','C11'].includes(song.id)?6:0);
    expect(added.every(piece=>piece.kind==='note'&&piece.level<=.07&&piece.id.startsWith(`${song.id}-wrap-answer-`))).toBe(true);
    expect(scene.pieces.length).toBeLessThanOrEqual(92);
    const oldCoverage=spatialCoverage(original),coverage=spatialCoverage(scene);
    expect(coverage.largestGapDegrees).toBeLessThanOrEqual(24);
    expect(coverage.largestGapDegrees).toBeLessThanOrEqual(oldCoverage.largestGapDegrees);
    expect(coverage.soundingLocations).toBeGreaterThanOrEqual(oldCoverage.soundingLocations);
    const cycleBeats=CHORD_FAVORITES.find(item=>item.id===song.id)?.cycleBeats??16;
    const oldHits=play(original,cycleBeats),hits=play(scene,cycleBeats);
    expect(music(hits.filter(hit=>originals.has(hit.nodeId)))).toEqual(music(oldHits));
    expect(new Set(hits.map(hit=>hit.nodeId))).toEqual(new Set(scene.pieces.filter(piece=>piece.kind!=='generator').map(piece=>piece.id)));
    for(const hit of hits)expect(hit.position).toEqual(topology.vertices[scene.pieces.find(piece=>piece.id===hit.nodeId)!.vertex]);
  });

  it('leaves its input intact and applies no layout to unrelated presets',()=>{
    const scene=before('C01'),snapshot=structuredClone(scene);
    spatialArrangement(scene,'C01');expect(scene).toEqual(snapshot);
    expect(spatialArrangement(scene,'unrelated')).toBe(scene);
  });
});
