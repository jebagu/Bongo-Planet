import {describe, expect, it} from 'vitest';
import {canPlacePiece, changeScene, emptyLegacyScene, emptyScene, movePiece, newPiece, piecesAt, placePiece, validateScene, type EngineEvent, type Scene} from '../src/core/contracts';
import {Engine} from '../src/core/engine';
import {stackPitch} from '../src/core/instruments';
import {History} from '../src/core/history';
import {exportCompositionFile, importCompositionFile} from '../src/compositionFile';
import {DEFAULT_APPEARANCE} from '../src/view/art/appearance';

function chord(): Scene {
  const scene = emptyScene();
  scene.pieces = [{...newPiece('generator', 0, 'g'), travel: 1}, ...[0,2,4,6].map((degree,i)=>({...newPiece('note',1,`n${i}`),instrument:'piano' as const,degree}))];
  scene.wiring = [{vertex:0,exits:[1]}];
  return validateScene(scene);
}
function tick(engine: Engine, until: number) {
  const events: EngineEvent[] = [];
  for (let time=engine.now+.005;time<until;time+=.005) {engine.advance(time);events.push(...engine.drain());}
  engine.advance(until);events.push(...engine.drain());return events;
}
const onsets=(events:EngineEvent[])=>events.filter(e=>e.type==='onset').map(e=>e.trigger);

describe('instrument stack editing and storage',()=>{
  it.each([emptyScene,emptyLegacyScene])('allows four sound layers while rejecting a fifth, shared generators and duplicate IDs',create=>{
    const scene=create();scene.pieces=chord().pieces.slice(1);
    expect(validateScene(scene).pieces).toHaveLength(4);
    expect(()=>placePiece(scene,newPiece('note',1,'fifth'))).toThrow('At most 4');
    expect(()=>placePiece(scene,newPiece('generator',1,'shared'))).toThrow('Generators need');
    expect(()=>placePiece(scene,newPiece('note',2,'n0'))).toThrow('Duplicate piece ID');
    expect(canPlacePiece(scene,'note',1)).toBe(false);
    expect(canPlacePiece(scene,'note',1,'n0')).toBe(true);
    expect(canPlacePiece(scene,'generator',1)).toBe(false);
    expect(canPlacePiece(scene,'note',92)).toBe(false);
  });
  it('moves a layer to the top, compacts a removed layer, and preserves identities, wiring and undo',()=>{
    const scene=chord(),history=new History();
    const separate=movePiece(scene,'n0',2);history.push(separate);
    const moved=movePiece(separate,'n0',1);
    expect(piecesAt(moved,1).map(p=>p.id)).toEqual(['n1','n2','n3','n0']);
    expect(moved.wiring).toEqual(scene.wiring);
    expect(history.undo(moved)).toEqual(separate);expect(history.redo(separate)).toEqual(moved);
    const removed=changeScene(moved,s=>{s.pieces=s.pieces.filter(p=>p.id!=='n2');});
    expect(piecesAt(removed,1).map(p=>p.id)).toEqual(['n1','n3','n0']);
    expect(importCompositionFile(exportCompositionFile(removed,DEFAULT_APPEARANCE)).scene).toEqual(removed);
    expect(scene.pieces.map(p=>p.id)).toEqual(['g','n0','n1','n2','n3']);
  });
  it('retains the total 92-piece capacity independently of per-node stacks',()=>{
    const scene=emptyScene();scene.pieces=Array.from({length:92},(_,i)=>newPiece('note',Math.floor(i/4),`n${i}`));
    expect(validateScene(scene).pieces).toHaveLength(92);expect(canPlacePiece(scene,'note',91)).toBe(false);
    expect(canPlacePiece(scene,'note',91,'n0')).toBe(true);
  });
  it('voices new melodic layers in thirds and leaves percussion out of pitch selection',()=>{
    let scene=emptyScene();
    for (const degree of [0,2,4,6]) {
      const pitch=stackPitch(scene,1);expect(pitch).toEqual({degree,octave:4});
      scene=placePiece(scene,{...newPiece('note',1,`n${degree}`),...pitch,instrument:'piano'});
    }
    const other=emptyScene();other.pieces=[{...newPiece('note',1,'drum'),instrument:'kick'}];
    expect(stackPitch(other,1)).toEqual({degree:0,octave:4});
    other.pieces.push({...newPiece('note',1,'high'),degree:6,octave:4});
    expect(stackPitch(other,1)).toEqual({degree:1,octave:5});
  });
});

describe('simultaneous stack playback',()=>{
  it('plays all four pitches at one arrival without multiplying sparks or timing decisions',()=>{
    const engine=new Engine(chord());engine.play(0);
    const events=tick(engine,.2),notes=onsets(events);
    expect(notes.map(t=>t.nodeId)).toEqual(['n0','n1','n2','n3']);
    expect(new Set(notes.map(t=>t.onset))).toEqual(new Set([.125]));
    expect(new Set(notes.map(t=>t.id)).size).toBe(4);
    expect(new Set(notes.map(t=>t.sound.kind==='note'?t.sound.frequency:0)).size).toBe(4);
    expect(events.filter(e=>e.type==='arrival')).toHaveLength(1);
    expect(engine.pendingCount).toBe(0);expect(engine.running).toBe(true);
  });
  it('keeps separate voices when two sparks converge on a four-layer chord',()=>{
    const scene=chord();scene.pieces.forEach(p=>{if(p.kind==='generator')p.travel=2;else p.vertex=5;});
    scene.wiring=[{vertex:0,exits:[1,4]},{vertex:1,exits:[5]},{vertex:4,exits:[5]}];
    const engine=new Engine(scene);engine.play(0);const notes=onsets(tick(engine,.3));
    expect(notes).toHaveLength(8);expect(notes.every(t=>t.onset===.25)).toBe(true);
    expect(new Set(notes.map(t=>t.id)).size).toBe(8);
  });
  it('reconciles added, moved and deleted layers independently while retaining committed sibling pitches',()=>{
    const scene=chord();scene.pieces=scene.pieces.filter(p=>p.id!=='n3');
    const engine=new Engine(scene);engine.play(0);engine.advance(0);
    const original=engine.drain().filter(e=>e.type==='trigger').map(e=>e.trigger);
    const changed=movePiece(scene,'n1',2);const root=changed.pieces.find(p=>p.id==='n0');if(root?.kind==='note')root.degree=5;
    changed.pieces.push({...newPiece('note',1,'added'),degree:6});
    engine.update(changed,.02);const edits=engine.drain();
    expect(edits.filter(e=>e.type==='trigger').map(e=>e.trigger.nodeId)).toEqual(['added']);
    expect(edits.filter(e=>e.type==='cancel').flatMap(e=>e.ids)).toContain(original[1].id);
    const notes=onsets(tick(engine,.2));
    expect(notes.map(t=>t.nodeId)).toEqual(['n0','n2','added']);
    expect(notes[0]).toEqual(original[0]);expect(notes[1]).toEqual(original[2]);
    expect(engine.pendingCount).toBe(0);
  });
  it.each(['radial','routes'] as const)('plays all stacked layers together in legacy %s scenes',propagation=>{
    const scene=emptyLegacyScene();scene.settings.propagation=propagation;
    scene.pieces=[{...newPiece('generator',0,'g'),reach:180,...(propagation==='routes'?{path:[0,1]}:{})},...chord().pieces.slice(1)];
    const engine=new Engine(scene);engine.play(0);const notes=onsets(tick(engine,1.6));
    expect(notes).toHaveLength(4);expect(new Set(notes.map(t=>t.onset)).size).toBe(1);
  });
});
