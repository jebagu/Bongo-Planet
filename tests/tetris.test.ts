import { describe, expect, it } from 'vitest';
import { emptyLegacyScene, emptyScene, GATED_GENERATOR_PERIODS, newPiece, validateScene, type Trigger } from '../src/core/contracts';
import { Engine } from '../src/core/engine';
import { topology } from '../src/core/geometry';
import { tetrisSongScene } from '../src/core/tetris';
import { REWORKED_SONGS, reworkedAttacks, reworkedSongScene } from '../src/core/reworkedSongs';
import { exportCompositionFile, importCompositionFile } from '../src/compositionFile';
import { DEFAULT_APPEARANCE } from '../src/view/art/appearance';
import { selectedControls } from '../src/view/selectionPanel';

describe('full-planet Tetris', () => {
  it.each([['S43',75,false],['R-S43',82,true]] as const)('%s plays every node once before restarting the complete journey', (id,bpm,expressive) => {
    const scene=tetrisSongScene(id,bpm,expressive);
    expect(scene.pieces).toHaveLength(92);
    expect(new Set(scene.pieces.map(piece=>piece.vertex))).toEqual(new Set(topology.vertices.map((_,index)=>index)));
    const sources=scene.pieces.filter(piece=>piece.kind==='generator');
    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({period:24,travel:91,enabled:true});
    expect(scene.wiring!.filter(record=>record.exits.length===0)).toHaveLength(1);
    expect(scene.wiring!.every(record=>record.exits.length<=1)).toBe(true);
    const engine=new Engine(scene),onsets: Trigger[]=[];
    let maxEdges=0;
    engine.play(0);
    const hop=15/bpm,loop=24*60/bpm,quantum=128/48000;
    for(let time=0;time<loop*3;time+=quantum) {
      engine.advance(time,quantum);
      maxEdges=Math.max(maxEdges,engine.snapshot().gatedEdges);
      for(const event of engine.drain()) {
        expect(event.type).not.toBe('reset');
        if(event.type==='onset')onsets.push(event.trigger);
      }
    }
    expect(maxEdges).toBe(1);
    expect(engine.running).toBe(true);
    expect(engine.lateDrops).toBe(0);
    expect(onsets).toHaveLength(91*3);
    for(let cycle=0;cycle<3;cycle++) {
      const played=onsets.slice(cycle*91,(cycle+1)*91);
      expect(new Set(played.map(trigger=>trigger.nodeId))).toEqual(new Set(scene.pieces.filter(piece=>piece.kind==='note').map(piece=>piece.id)));
      played.forEach((trigger,index)=>expect(trigger.onset).toBeCloseTo(cycle*loop+(index+1)*hop,9));
    }
    expect(importCompositionFile(exportCompositionFile(scene,DEFAULT_APPEARANCE)).scene).toEqual(scene);
  });

  it('uses the extended score in the Reworked preset with the same pitches and different expression', () => {
    const song=REWORKED_SONGS.find(song=>song.id==='R-S43')!;
    const scene=reworkedSongScene(song),attacks=reworkedAttacks(song);
    expect(scene).toEqual(tetrisSongScene('R-S43',82,true));
    expect(attacks).toHaveLength(57);
    expect(attacks.at(-1)).toMatchObject({step:90,pitch:0,ticks:6});
    const standard=tetrisSongScene('S43',75);
    expect(scene.pieces.filter(piece=>piece.kind==='note').map(piece=>[piece.vertex,piece.instrument,piece.degree,piece.octave]))
      .toEqual(standard.pieces.filter(piece=>piece.kind==='note').map(piece=>[piece.vertex,piece.instrument,piece.degree,piece.octave]));
  });
});

describe('long gated generator intervals', () => {
  it.each(GATED_GENERATOR_PERIODS)('round-trips and exposes the %s-beat interval', period => {
    const scene=emptyScene();
    scene.pieces=[{...newPiece('generator',0,'source'),period,travel:1},newPiece('note',1,'note')];
    scene.wiring=[{vertex:0,exits:[1]}];
    const source=validateScene(scene).pieces[0];
    expect(importCompositionFile(exportCompositionFile(scene,DEFAULT_APPEARANCE)).scene).toEqual(scene);
    expect(selectedControls(source,scene.settings)).toContain(`value="${period}" selected`);
  });

  it('keeps longer intervals out of the legacy timing contract', () => {
    const scene={...emptyLegacyScene(),pieces:[{...newPiece('generator',0,'source'),period:24}]};
    expect(()=>validateScene(scene)).toThrow();
    const invalid=emptyScene();
    invalid.pieces=[{...newPiece('generator',0,'source'),period:10 as 8,travel:1}];
    expect(()=>validateScene(invalid)).toThrow();
  });

  it('keeps a long phased source on the grid through a whole-beat tempo change', () => {
    const scene=emptyScene();
    scene.pieces=[{...newPiece('generator',0,'source'),period:24,phase:.5,travel:1},newPiece('note',1,'note')];
    scene.wiring=[{vertex:0,exits:[1]}];
    const engine=new Engine(scene),times:number[]=[];
    engine.play(0);
    for(let tick=0;tick<=2000;tick++) {
      const time=tick*.01;
      if(tick===100)engine.update({...scene,settings:{...scene.settings,bpm:60}},time);
      engine.advance(time);
      for(const event of engine.drain())if(event.type==='onset')times.push(event.trigger.onset);
    }
    // Tempo changes at beat three (1.5s); beat 12.25 arrives at 10.75s.
    expect(times).toEqual([10.75]);
    expect(engine.running).toBe(true);
  });
});
