import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {LOOP_BUILDS,LOOP_BUILD_GROUP} from '../scripts/loop-build-scores';
import {importCompositionFile} from '../src/compositionFile';
import {Engine} from '../src/core/engine';
import {LIMITS,type Scene,type Trigger} from '../src/core/contracts';
import {POP_SONGS,popAttacks} from '../src/core/popSongs';
import {EXAMPLE_GROUPS} from '../src/core/examples';

function trace(scene:Scene,beats:number) {
  const engine=new Engine(scene),q=128/48000,hits:Trigger[]=[];let edges=0,decisions=0;
  engine.play(0);
  for(let tick=1;tick<=Math.ceil(beats*60/scene.settings.bpm/q);tick++) {
    engine.advance(tick*q,q);const batch=engine.drain();
    expect(engine.running).toBe(true);expect(batch.some(event=>event.type==='reset')).toBe(false);
    edges=Math.max(edges,engine.snapshot().gatedEdges);
    decisions=Math.max(decisions,batch.filter(event=>event.type==='arrival').length+new Set(batch.filter(event=>event.type==='emission').map(event=>event.time)).size);
    for(const event of batch)if(event.type==='onset')hits.push(event.trigger);
  }
  expect(engine.lateDrops).toBe(0);expect(edges).toBeLessThanOrEqual(LIMITS.gatedEdges);expect(decisions).toBeLessThanOrEqual(LIMITS.gatedQuantum);
  return hits;
}

describe('favorites with finite feedback loops',()=>{
  it('puts precisely the three new arrangements in their own requested section',()=>{
    expect(EXAMPLE_GROUPS.find(group=>group.name===LOOP_BUILD_GROUP)?.examples).toEqual(LOOP_BUILDS.map(({id,name})=>({id,name})));
  });
  it.each(LOOP_BUILDS)('$name builds, becomes much busier, releases, and repeats without accumulating work',loop=>{
    const scene=loop.build(),portable=importCompositionFile(readFileSync(`public/compositions/${loop.slug}/Bongo-Planet.json`,'utf8'));
    expect(portable.scene).toEqual(scene);expect(scene).toEqual(JSON.parse(readFileSync(`public/fixtures/${loop.id}.json`,'utf8')));
    const hits=trace(scene,96),seconds=loop.cycleBeats*60/loop.bpm,hop=15/loop.bpm;
    const pattern=(cycle:number)=>hits.filter(hit=>hit.onset>=cycle*seconds-1e-7&&hit.onset<(cycle+1)*seconds-1e-7)
      .map(hit=>`${hit.nodeId}/${hit.generatorId}@${Math.round((hit.onset-cycle*seconds)/hop)}`).sort();
    expect(pattern(2)).toEqual(pattern(1));
    expect(new Set(hits.map(hit=>hit.nodeId))).toEqual(new Set(scene.pieces.filter(p=>p.kind==='note').map(p=>p.id)));
    const first=hits.filter(hit=>hit.onset<seconds-1e-7),bins=Array.from({length:16},(_,index)=>first.filter(hit=>hit.onset>=index*2*60/loop.bpm-1e-7&&hit.onset<(index+1)*2*60/loop.bpm-1e-7).length);
    expect(Math.max(...bins)).toBeGreaterThanOrEqual(4*(bins[0]+bins[1])/2);
    expect(bins.slice(-4).reduce((a,b)=>a+b,0)/4).toBeLessThan(Math.max(...bins)/2);
    const source=scene.pieces.find(p=>p.id===`${loop.id}-feedback-source`)!;
    expect(source.kind).toBe('generator');if(source.kind!=='generator')return;
    const start=source.phase*source.period*60/loop.bpm,end=start+Number(source.travel)*hop;
    const feedback=first.filter(hit=>hit.generatorId===source.id);
    expect(feedback.length).toBeGreaterThan(30);expect(feedback.every(hit=>hit.onset>start-1e-7&&hit.onset<=end+1e-7)).toBe(true);
    expect(source.travel).not.toBe('infinite');
  });
  it.each(LOOP_BUILDS.filter(loop=>loop.sourceId.startsWith('P')))('$name retains the exact recognizable lead pitches and grid positions',loop=>{
    const song=POP_SONGS.find(song=>song.id===loop.sourceId)!,scene=loop.build(),hop=15/loop.bpm;
    const firstVerse=trace(scene,17).filter(hit=>hit.nodeId.startsWith(`${loop.id}-lead-`)&&hit.onset<(64.25)*hop);
    const written=popAttacks(song).filter(hit=>hit.id.startsWith(`${song.id}-lead-`));
    expect(firstVerse).toHaveLength(written.length);
    firstVerse.forEach((hit,index)=>{
      expect(hit.sound.kind).toBe('note');if(hit.sound.kind!=='note')return;
      expect(Math.round(69+12*Math.log2(hit.sound.frequency/440))).toBe(written[index].midi);
      expect(hit.onset).toBeCloseTo((written[index].step+1)*hop,8);
    });
  });
  it('lets Squall make a second round of returns through the original Kite Weather network',()=>{
    const original=JSON.parse(readFileSync('public/fixtures/AA03.json','utf8')) as Scene,scene=LOOP_BUILDS.find(loop=>loop.id==='BR03')!.build();
    expect(scene.wiring).toEqual(original.wiring);expect(scene.settings).toMatchObject({bpm:144,key:7,scale:'pentatonic'});
    expect(scene.pieces.filter(p=>p.kind==='generator')).toMatchObject([{travel:63,period:32,phase:0}]);
  });
});
