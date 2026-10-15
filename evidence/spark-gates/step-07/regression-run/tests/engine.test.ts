import {it,expect,describe} from 'vitest';
import {Engine,delayBeats,soundFor} from '../src/core/engine';
import {emptyLegacyScene as emptyScene,newPiece,type Scene,type EngineEvent} from '../src/core/contracts';
import fs from 'node:fs';
const fixture=(id:string)=>JSON.parse(fs.readFileSync(`public/fixtures/${id}.json`,'utf8')) as Scene;
function tick(e:Engine,to:number){const events:EngineEvent[]=[];for(let t=e.now+.005;t<to-1e-9;t+=.005){e.advance(t);events.push(...e.drain());}e.advance(to);events.push(...e.drain());return events;}
const onsets=(events:EngineEvent[])=>events.filter(e=>e.type==='onset').map(e=>e.trigger);
const triggers=(events:EngineEvent[])=>events.filter(e=>e.type==='trigger').map(e=>e.trigger);
describe('analytic published rules',()=>{
 it('major/minor and pentatonic-overflow pitches match independent equal-temperament note constants',()=>{
  const p=newPiece('note',0,'pitch');p.octave=4;
  const cases:[Scene['settings']['scale'],number,number,number][]=[['major',2,0,329.627556913],['major',6,0,493.883301256],['minor',2,0,311.126983722],['minor',5,0,415.304697580],['pentatonic',4,0,440],['pentatonic',5,0,523.251130601],['pentatonic',6,0,587.329535835],['major',0,1,277.182630977]];
  for(const [scale,degree,key,frequency] of cases){const sound=soundFor({...p,degree},{...emptyScene().settings,scale,key});expect(sound.kind).toBe('note');if(sound.kind==='note')expect(sound.frequency).toBeCloseTo(frequency,7);}
 });
 it('30/60/90 degree analytic delay equals 250/500/750ms',()=>{for(const [deg,seconds] of [[30,.25],[60,.5],[90,.75]]){expect(delayBeats(deg*Math.PI/180,4,.75,0)*.5).toBeCloseTo(seconds,12);expect(delayBeats(deg*Math.PI/180,4,.75,.25)*.5).toBeCloseTo(seconds,12);}});
 it('quantization ties up and stays strictly within a period',()=>{expect(delayBeats(Math.PI/24,4,.75,.25)).toBe(.25);for(const p of [1,2,3,4,6,8])for(const grid of [0,.125,.25])expect(delayBeats(Math.PI,p,.75,grid)).toBeLessThan(p);});
 it('pitch constants and scale overflow are independently specified',()=>{const s=emptyScene();const p={...newPiece('note',1,'n'),kind:'note',degree:0,octave:4} as const;expect(soundFor(p,s.settings)).toMatchObject({frequency:261.6255653005986});expect(soundFor({...p,degree:4,octave:4},s.settings)).toMatchObject({frequency:391.99543598174927});});
});
describe('emission commitment, provenance and clock continuity',()=>{
 it('scale edit preserves committed E4 and remaps the subsequent emission to E-flat4',()=>{
  const scene=emptyScene(),generator=newPiece('generator',0,'g'),note=newPiece('note',4,'n');generator.reach=180;note.degree=2;scene.pieces=[generator,note];
  const engine=new Engine(scene);engine.play(0);engine.advance(0);const first=triggers(engine.drain())[0];
  expect(first.sound.kind).toBe('note');if(first.sound.kind==='note')expect(first.sound.frequency).toBeCloseTo(329.627556913,7);
  tick(engine,.05);engine.update({...scene,settings:{...scene.settings,scale:'minor'}},.05);
  const events=[...engine.drain(),...tick(engine,2)],played=onsets(events),next=triggers(events);
  expect(played).toHaveLength(1);expect(played[0].id).toBe(first.id);expect(played[0].sound).toEqual(first.sound);
  expect(next).toHaveLength(1);expect(next[0].emission).toBeCloseTo(2,10);expect(next[0].sound.kind).toBe('note');
  if(next[0].sound.kind==='note')expect(next[0].sound.frequency).toBeCloseTo(311.126983722,7);
 });
 it('golden independent fixture tables match F01–F05',()=>{const golden=JSON.parse(fs.readFileSync('public/fixtures/expected.json','utf8'));for(const id of ['F01','F02','F03','F04','F05']){const e=new Engine(fixture(id));e.play(0);e.advance(0);const actual=triggers(e.drain());expect(actual.length).toBe(golden[id].length);for(const t of actual){const expected=golden[id].find((x:any)=>x.nodeId===t.nodeId&&x.generatorId===t.generatorId);expect(t.onset).toBeCloseTo(expected.delaySeconds,9);}if(id==='F02'){expect(new Set(actual.map(t=>t.onset)).size).toBe(1);expect(new Set(actual.map(t=>t.sound.kind==='note'?t.sound.frequency:0)).size).toBe(3);}if(id==='F03')expect(new Set(actual.map(t=>t.onset)).size).toBe(3);}});
 it('pre-emission edit is committed; post-emission movement retains onset but refreshes position',()=>{const s=fixture('F05'),e=new Engine(s);e.play(0);e.advance(0);const first=triggers(e.drain())[0];expect(first.onset).toBe(3);const moved=structuredClone(s);moved.pieces[1].vertex=1;tick(e,.2);e.update(moved,.2);expect(onsets(tick(e,3))[0]).toMatchObject({id:first.id,onset:3,position:fixturePosition(1)});const second=triggers(tick(e,4));expect(second[0].onset).toBeLessThan(4.5);
 const e2=new Engine(s);e2.play(0);tick(e2,3.9);const edited=structuredClone(s);if(edited.pieces[1].kind==='note')edited.pieces[1].degree=4;e2.update(edited,3.9);expect(triggers(tick(e2,4))[0].sound).toMatchObject({frequency:391.99543598174927});});
 it('deletion cancels children, disable preserves committed work, pause/clear/load purge session',()=>{for(const action of ['target','generator','pause','load']){const s=fixture('F05'),e=new Engine(s);e.play(0);tick(e,.2);if(action==='target')e.update({...s,pieces:[s.pieces[0]]},.2);if(action==='generator')e.update({...s,pieces:[s.pieces[1]]},.2);if(action==='pause')e.pause(.2);if(action==='load'){e.replace(s,.2);e.play(.2);}const ev=e.drain();expect(ev.some(x=>x.type==='cancel')).toBe(true);const later=onsets(tick(e,3));expect(later).toHaveLength(0);}
 const s=fixture('F05'),e=new Engine(s);e.play(0);tick(e,.2);const disabled=structuredClone(s);if(disabled.pieces[0].kind==='generator')disabled.pieces[0].enabled=false;e.update(disabled,.2);expect(onsets(tick(e,3))).toHaveLength(1);expect(triggers(tick(e,8))).toHaveLength(0);});
 it('tempo increase can overtake committed onsets without altering them',()=>{const s=fixture('F05');s.settings.bpm=40;const e=new Engine(s);e.play(0);e.advance(0);const committed=triggers(e.drain())[0];expect(committed.onset).toBe(9);tick(e,.2);e.update({...s,settings:{...s.settings,bpm:180}},.2);const events=tick(e,9);const late=onsets(events).find(t=>t.id===committed.id);expect(late?.onset).toBe(9);expect(triggers(events).some(t=>t.onset<9)).toBe(true);});
 it('resume does not replay phase boundaries and edited phase joins future grid',()=>{const s=fixture('F01'),e=new Engine(s);e.play(0);tick(e,.3);e.pause(.3);e.drain();e.play(10);expect(triggers(tick(e,10.1))).toHaveLength(0);const changed=structuredClone(s);if(changed.pieces[0].kind==='generator')changed.pieces[0].phase=.5;e.update(changed,10.1);const ts=triggers(tick(e,12));expect(ts.length).toBeGreaterThan(0);expect(ts.every(t=>t.emission>10.1)).toBe(true);expect(new Set(ts.map(t=>t.id)).size).toBe(ts.length);});
 it('sound edits preserve committed parameters and active voices are separate',()=>{const s=fixture('F04'),e=new Engine(s);e.play(0);e.advance(0);const first=triggers(e.drain());expect(new Set(first.map(t=>t.generatorId)).size).toBe(2);expect(new Set(first.map(t=>t.id)).size).toBe(first.length);const edit=structuredClone(s);edit.settings.key=7;e.update(edit,0);const played=onsets(tick(e,1.5));for(const t of played)expect(t.sound).toEqual(first.find(x=>x.id===t.id)!.sound);});
 it('maximum supported load stays bounded and suspension creates no catch-up burst',()=>{const e=new Engine(fixture('F08'));e.play(0);let count=0;for(let t=0;t<10;t+=.005){e.advance(t);count+=triggers(e.drain()).length;expect(e.pendingCount).toBeLessThanOrEqual(5376);}expect(count).toBeGreaterThan(19000);e.advance(11);expect(e.running).toBe(false);expect(triggers(e.drain())).toHaveLength(0);});
 it('render frequency has no connection to engine timestamps',()=>{const run=(fps:number)=>{const e=new Engine(fixture('F04'));e.play(0);const result=[];for(let t=0;t<6;t+=.005){e.advance(t);const events=e.drain();result.push(...triggers(events).map(t=>[t.generatorId,t.nodeId,t.onset]));if(Math.floor(t*fps)!==Math.floor((t-.005)*fps)){void e.snapshot();}}return result;};expect(run(2)).toEqual(run(60));expect(run(15)).toEqual(run(60));});
});
function fixturePosition(v:number){return JSON.parse(fs.readFileSync('evidence/step-02/topology.json','utf8')).vertices[v];}
it('paused tempo edits discard an older pending tempo transition',()=>{const s=fixture('F01'),e=new Engine(s);e.play(0);tick(e,.1);const fast={...s,settings:{...s.settings,bpm:180}};e.update(fast,.1);tick(e,.2);e.pause(.2);e.update({...fast,settings:{...fast.settings,bpm:60}},.2);e.play(10);tick(e,11);expect(e.beat).toBeCloseTo(1.4,10);});
it('late onsets are dropped/countable and invalid play times cannot poison state',()=>{const e=new Engine(fixture('F02'));e.play(0);tick(e,.1);e.drain();e.advance(.17);expect(onsets(e.drain())).toHaveLength(0);expect(e.lateDrops).toBe(3);e.pause(.17);const snap=e.snapshot();expect(()=>e.play(NaN)).toThrow();expect(()=>e.play(-1)).toThrow();expect(e.snapshot()).toEqual(snap);});
it('silent generator pause at beat zero never re-emits that boundary',()=>{const s=emptyScene();s.pieces=[newPiece('generator',0,'g')];const e=new Engine(s);e.play(0);e.advance(0);expect(e.drain().filter(e=>e.type==='emission')).toHaveLength(1);e.pause(0);e.drain();e.play(1);e.advance(1);expect(e.drain().filter(e=>e.type==='emission')).toHaveLength(0);});
it('repeated valid phase edits fail closed at pending capacity with no post-reset events',()=>{let s=fixture('F09');const e=new Engine(s);e.play(0);e.advance(0);e.drain();let resetEvents:EngineEvent[]=[];for(let i=1;i<=12&&e.running;i++){const now=i*.02;s=structuredClone(s);s.pieces.forEach(p=>{if(p.kind==='generator')p.phase=(now*40/60+.00001)/8;});e.update(s,now);resetEvents=e.drain();}expect(e.running).toBe(false);expect(e.pendingCount).toBe(0);const index=resetEvents.findIndex(ev=>ev.type==='reset');expect(index).toBeGreaterThan(-1);expect(resetEvents.slice(index+1)).toEqual([]);});
it('capacity interruption preserves a requested future tempo on explicit resume',()=>{let s=fixture('F09');const e=new Engine(s);e.play(0);e.advance(0);e.drain();s.settings.bpm=180;e.update(s,.001);e.drain();for(let i=1;i<=12&&e.running;i++){const now=i*.02;s=structuredClone(s);s.pieces.forEach(p=>{if(p.kind==='generator')p.phase=(now*40/60+.00001)/8;});e.update(s,now);e.drain();}expect(e.running).toBe(false);e.play(10);tick(e,12);expect(e.beat).toBeGreaterThan(2.9);expect(e.beat).toBeLessThan(3.1);});
it('F08 commits exactly 672 distinct pairs per batch and2016 triggers in [0,1)',()=>{
 const scene=fixture('F08');
 expect(scene.settings.bpm).toBe(180);
 expect(scene.pieces.filter(p=>p.kind==='generator')).toHaveLength(8);
 expect(scene.pieces.filter(p=>p.kind!=='generator')).toHaveLength(84);
 const engine=new Engine(scene);engine.play(0);engine.advance(0);
 const actual=triggers([...engine.drain(),...tick(engine,1)]).filter(t=>t.emission<1-1e-9);
 expect(actual).toHaveLength(2016);
 expect(new Set(actual.map(t=>t.id)).size).toBe(2016);
 for(const emission of [0,1/3,2/3]){
  const batch=actual.filter(t=>Math.abs(t.emission-emission)<1e-9);
  expect(batch).toHaveLength(672);
  expect(new Set(batch.map(t=>`${t.generatorId}/${t.nodeId}`)).size).toBe(672);
 }
 expect(engine.pendingCount).toBeLessThanOrEqual(5376);
});
it('F09 tempo transition at beat1 preserves initial arrivals while later batches overtake',()=>{
 const scene=fixture('F09'),engine=new Engine(scene);engine.play(0);engine.advance(0);
 const initial=triggers(engine.drain());expect(initial).toHaveLength(672);
 tick(engine,.2);engine.update({...scene,settings:{...scene.settings,bpm:180}},.2);
 const events=[...engine.drain(),...tick(engine,12)],later=triggers(events);
 const emissions=events.filter(e=>e.type==='emission');
 expect(emissions).toHaveLength(32);
 expect(later).toHaveLength(2688);
 expect(new Set(later.map(t=>t.id)).size).toBe(2688);
 for(const event of emissions)if(event.type==='emission')expect([23/6,6.5,55/6,71/6].some(time=>Math.abs(time-event.time)<1e-9)).toBe(true);
 for(const [beat,time] of [[8,23/6],[16,6.5],[24,55/6],[32,71/6]]){
  const batch=emissions.filter(e=>e.type==='emission'&&Math.abs(e.time-time)<1e-9);
  expect(batch).toHaveLength(8);
  for(const event of batch)if(event.type==='emission')expect(event.time).toBeCloseTo(time,9);
  expect(new Set(batch.map(e=>e.type==='emission'?e.generatorId:'')).size).toBe(8);
  const committed=later.filter(t=>t.beat===beat);expect(committed).toHaveLength(672);
  expect(new Set(committed.map(t=>`${t.generatorId}/${t.nodeId}`)).size).toBe(672);
  for(const trigger of committed)expect(trigger.emission).toBeCloseTo(time,9);
 }
 const played=onsets(events);
 for(const committed of initial){
  const matches=played.filter(t=>t.id===committed.id);expect(matches).toHaveLength(1);
  expect(matches[0].onset).toBe(committed.onset);
 }
 expect(later.some(t=>t.onset<Math.max(...initial.map(t=>t.onset)))).toBe(true);
 expect(engine.lateDrops).toBe(0);
});
