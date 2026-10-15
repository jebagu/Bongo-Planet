import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SONGS, songScene } from '../src/core/examples';
import { Engine } from '../src/core/engine';
import { movePiece, validateScene, type EngineEvent } from '../src/core/contracts';
import { INSTRUMENTS } from '../src/core/instruments';
import { topology } from '../src/core/geometry';
import { DEFAULT_APPEARANCE, validateAppearance } from '../src/view/art/appearance';
import { BACKDROPS, starPoints, SWATCHES } from '../src/view/art/swatches';

describe('little song examples', () => {
  it.each(SONGS)('plays $song in order with one persistent spark and only Harmony Bloom samples', song => {
    const scene=songScene(song);
    expect(validateScene(JSON.parse(readFileSync(`public/fixtures/${song.id}.json`,'utf8')))).toEqual(scene);
    const engine=new Engine(scene),events:EngineEvent[]=[];
    engine.play(0);
    const period=8*60/song.bpm;
    for(let time=0;time<period-0.01;time+=0.002){engine.advance(time);events.push(...engine.drain());}
    const routes=events.filter(e=>e.type==='route').map(e=>e.route);
    const onsets=events.filter(e=>e.type==='onset').map(e=>e.trigger);
    expect(routes).toHaveLength(1);
    expect(onsets).toHaveLength(song.degrees.length);
    expect(onsets.map(t=>t.nodeId)).toEqual(song.degrees.map((_,i)=>`${song.id}-note-${i}`));
    expect(new Set(onsets.map(t=>t.routeId))).toEqual(new Set([routes[0].id]));
    expect(new Set(routes[0].vertices).size).toBe(routes[0].vertices.length);
    const semitones=[0,2,4,5,7,9,11];
    onsets.forEach((trigger,i)=>{
      expect(trigger.sound.kind).toBe('note');
      if(trigger.sound.kind!=='note')throw Error('Unexpected non-sample voice');
      expect(trigger.sound.instrument).toBe(song.instruments[i%song.instruments.length]);
      const sampleInstrument=trigger.sound.instrument;
      expect(INSTRUMENTS.some(instrument=>instrument.id===sampleInstrument)).toBe(true);
      expect(trigger.sound.frequency).toBeCloseTo(440*2**((60+semitones[song.degrees[i]]-69)/12),8);
      expect(trigger.routeStep).toBe(i+1);
    });
    for(let step=1;step<routes[0].vertices.length;step++){
      const a=routes[0].vertices[step-1],b=routes[0].vertices[step];
      expect(topology.neighbors[a]).toContain(b);
      const distance=Math.hypot(...topology.vertices[a].map((v,i)=>v-topology.vertices[b][i]));
      expect(distance/(routes[0].arrivals[step]-routes[0].arrivals[step-1])).toBeCloseTo(routes[0].speed,10);
    }
    expect(engine.lateDrops).toBe(0);
  });
  it('rejects disconnected imported paths and releases the song path when moving a generator',()=>{
    const scene=songScene(SONGS[0]);
    const broken=structuredClone(scene),generator=broken.pieces[0];
    if(generator.kind!=='generator')throw Error('Missing generator');
    generator.path=[generator.vertex,generator.vertex];
    expect(()=>validateScene(broken)).toThrow('neighboring vertices');
    generator.path=[topology.neighbors[generator.vertex][0],generator.vertex];
    expect(()=>validateScene(broken)).toThrow('start at its generator');
    const destination=topology.vertices.findIndex((_,i)=>!scene.pieces.some(p=>p.vertex===i));
    const moved=movePiece(scene,scene.pieces[0].id,destination);
    expect(moved.pieces[0]).not.toHaveProperty('path');
    expect(moved.pieces.slice(1)).toEqual(scene.pieces.slice(1));
    expect(scene.pieces[0]).toHaveProperty('path');
  });
});

describe('toy skies and swatches',()=>{
  it.each(BACKDROPS)('round-trips $name and maps it to a gradient',backdrop=>{
    expect(backdrop.fill).toContain('gradient(');
    expect(validateAppearance(JSON.parse(JSON.stringify({...DEFAULT_APPEARANCE,backdrop:backdrop.id})))).toMatchObject({backdrop:backdrop.id,style:'toys'});
  });
  it('keeps stars deterministic, bounded and separate from the composition',()=>{
    expect(starPoints()).toEqual(starPoints());
    expect(starPoints()).toHaveLength(110);
    for(const star of starPoints()){expect(star.x).toBeGreaterThanOrEqual(0);expect(star.x).toBeLessThan(100);expect(star.y).toBeGreaterThanOrEqual(0);expect(star.y).toBeLessThan(100);}
    for(const [_,color] of SWATCHES)expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
