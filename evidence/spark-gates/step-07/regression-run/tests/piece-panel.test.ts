import { describe, expect, it } from 'vitest';
import { emptyLegacyScene as emptyScene, newPiece, validateScene, movePiece, type EngineEvent, type Scene } from '../src/core/contracts';
import { labelPieces } from '../src/core/pieceLabels';
import { instrumentScene } from '../src/core/instruments';
import { History, exportScene, importScene } from '../src/core/history';
import { Engine } from '../src/core/engine';
import { selectedControls } from '../src/view/selectionPanel';
import { topology } from '../src/core/geometry';

function tick(engine: Engine, until: number): EngineEvent[] {
  const events:EngineEvent[]=[];
  for(let now=0;now<until;now+=0.002){engine.advance(now);events.push(...engine.drain());}
  return events;
}
function named(scene: Scene) { return labelPieces(instrumentScene(scene)); }

describe('stable piece names',()=>{
  it('assigns instrument-local names and preserves IDs, names and generator travel through moves/history/JSON',()=>{
    let scene=emptyScene();scene.settings.travel=0.5;
    scene.pieces=[newPiece('generator',0,'g'),{...newPiece('note',1,'one'),instrument:'guitar'},{...newPiece('note',2,'two'),instrument:'guitar'},{...newPiece('note',3,'three'),instrument:'marimba'}];
    scene=named(scene);
    expect(scene.pieces.map(p=>p.label)).toEqual(['Generator 1','Guitar 1','Guitar 2','Marimba 1']);
    expect(scene.pieces[0]).toMatchObject({travel:0.5});
    const moved=movePiece(scene,'two',4);expect(moved.pieces[2]).toMatchObject({id:'two',label:'Guitar 2',vertex:4});
    const history=new History();history.push(scene);expect(history.undo(moved)).toEqual(scene);expect(history.redo(scene)).toEqual(moved);
    expect(importScene(exportScene(moved))).toEqual(moved);
    const removed=named({...moved,pieces:moved.pieces.filter(p=>p.id!=='one')});
    expect(removed.pieces.find(p=>p.id==='two')!.label).toBe('Guitar 2');
    const added=named({...removed,pieces:[...removed.pieces,{...newPiece('note',5,'new'),instrument:'guitar'}]});
    expect(added.pieces.at(-1)!.label).toBe('Guitar 3');
  });
  it('renames a changed instrument without collisions, and preserves its actual ID',()=>{
    const scene=emptyScene();scene.pieces=[{...newPiece('note',1,'guitar'),instrument:'guitar',label:'Guitar 1'},{...newPiece('note',2,'piano'),instrument:'piano',label:'Piano 1'}];
    const changed=structuredClone(scene);if(changed.pieces[0].kind==='note')changed.pieces[0].instrument='piano';
    expect(named(changed).pieces[0]).toMatchObject({id:'guitar',label:'Piano 2'});
    expect(named(changed).pieces[1].label).toBe('Piano 1');
  });
  it('keeps imported maximum labels valid when allocating another name',()=>{
    const scene=emptyScene();scene.pieces=[{...newPiece('note',0,'high'),instrument:'piano',label:'Piano 999999'},{...newPiece('note',1,'low'),instrument:'piano',label:'Piano 1'},newPiece('note',2,'new')];
    expect(named(scene).pieces[2].label).toBe('Piano 2');expect(()=>validateScene(named(scene))).not.toThrow();
    expect(()=>validateScene({...scene,pieces:[{...scene.pieces[0],label:'<script>1</script>'}]})).toThrow();
  });
});

describe('individual generator travel',()=>{
  it('changes only its own journey arrival times and retains shared speed within each emission',()=>{
    const scene=emptyScene();scene.settings.propagation='routes';
    const a={...newPiece('generator',0,'a'),reach:180,period:8 as const,travel:0.25};
    const b={...a,id:'b',vertex:15,travel:0.75};scene.pieces=[a,b];
    const engine=new Engine(scene);engine.play(0);
    const routes=tick(engine,0.01).filter(e=>e.type==='route').map(e=>e.route);
    for(const generator of [a,b]){
      const own=routes.filter(r=>r.generatorId===generator.id);
      expect(own.length).toBeGreaterThan(0);expect(new Set(own.map(r=>r.speed)).size).toBe(1);
      expect(Math.max(...own.map(r=>r.arrivals.at(-1)!))).toBeCloseTo(4*generator.travel,10);
    }
    const legacy=structuredClone(scene);if(legacy.pieces[0].kind==='generator')delete legacy.pieces[0].travel;
    expect(named(legacy).pieces[0]).toMatchObject({travel:legacy.settings.travel});
    expect(()=>validateScene({...scene,pieces:[{...a,travel:0.99}]})).toThrow();
  });
  it('preserves committed journeys when travel changes and uses the new value next cycle',()=>{
    const scene=emptyScene();scene.settings.propagation='routes';scene.pieces=[{...newPiece('generator',0,'g'),reach:180,period:4,travel:0.75}];
    const engine=new Engine(scene);engine.play(0);
    const first=tick(engine,0.1).filter(e=>e.type==='route').map(e=>e.route);
    const changed=structuredClone(scene);if(changed.pieces[0].kind==='generator')changed.pieces[0].travel=0.25;
    engine.update(changed,engine.now);expect(engine.drain().some(e=>e.type==='reset')).toBe(false);
    const next:EngineEvent[]=[];for(let time=engine.now+0.002;time<2.01;time+=0.002){engine.advance(time);next.push(...engine.drain());}
    const later=next.filter(e=>e.type==='route').map(e=>e.route);
    expect(Math.max(...first.map(r=>r.arrivals.at(-1)!-r.emission))).toBeCloseTo(1.5,10);
    expect(Math.max(...later.map(r=>r.arrivals.at(-1)!-r.emission))).toBeCloseTo(0.5,10);
  });
  it('shows route behavior and places travel only in generator controls',()=>{
    const scene=emptyScene(),generator=newPiece('generator',0,'g');
    expect(selectedControls(generator,scene.settings)).toContain('Automatic branches');
    expect(selectedControls({...generator,path:[0,topology.neighbors[0][0]]},scene.settings)).toContain('Saved song path');
    expect(selectedControls(generator,scene.settings)).not.toContain('data-field="travel"');
    expect(selectedControls({...generator,travel:8},{...scene.settings,propagation:'gated'})).toContain('data-field="travel"');
    expect(selectedControls(newPiece('note',1,'n'),scene.settings)).not.toContain('data-field="travel"');
  });
});
