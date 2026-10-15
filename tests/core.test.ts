import {describe,it,expect} from 'vitest';
import {topology,makeTopology,angle,cross} from '../src/core/geometry';
import {emptyLegacyScene as emptyScene,newPiece,validateScene,movePiece,changeScene,sceneSchema} from '../src/core/contracts';
import {History,exportScene,importScene,saveScene} from '../src/core/history';
import fs from 'node:fs';
describe('3V geometry independent invariants',()=>{
 it('counts, manifold, Euler, connectivity, unit vectors and stable IDs',()=>{
 expect([topology.vertices.length,topology.edges.length,topology.faces.length]).toEqual([92,270,180]);expect(92-270+180).toBe(2);expect(makeTopology()).toEqual(topology);
 const edges=new Map<string,number>();for(const f of topology.faces){const [a,b,c]=f.map(i=>topology.vertices[i]);const u=a.map((x,i)=>b[i]-x),v=a.map((x,i)=>c[i]-x);expect(Math.hypot(...cross(u as any,v as any))).toBeGreaterThan(.01);for(const pair of [[f[0],f[1]],[f[1],f[2]],[f[2],f[0]]]){pair.sort((a,b)=>a-b);const key=pair.join(',');edges.set(key,(edges.get(key)||0)+1);}}
 expect([...edges.values()].every(n=>n===2)).toBe(true);const visited=new Set<number>();const walk=(v:number)=>{if(visited.has(v))return;visited.add(v);topology.neighbors[v].forEach(walk);};walk(0);expect(visited.size).toBe(92);topology.vertices.forEach(v=>expect(Math.hypot(...v)).toBeCloseTo(1,10));expect(new Set(topology.vertices.map(v=>v.join(','))).size).toBe(92);
 });
 it('analytic distances use surface angle',()=>{expect(angle([1,0,0],[1,0,0])).toBe(0);expect(angle([1,0,0],[0,1,0])).toBe(Math.PI/2);expect(angle([1,0,0],[-1,0,0])).toBe(Math.PI);expect(angle(topology.vertices[0],topology.vertices[15])).toBe(angle(topology.vertices[15],topology.vertices[0]));});
});
describe('strict contracts, atomic occupancy and portable storage',()=>{
 it('accepts92 occupied vertices and40/180BPM boundaries; rejects93 pieces and out-of-range tempo',()=>{
  const s=emptyScene();s.pieces=Array.from({length:92},(_,i)=>newPiece('note',i,`n${i}`));
  expect(validateScene(s).pieces).toHaveLength(92);
  for(const bpm of [40,180])expect(validateScene({...s,settings:{...s.settings,bpm}}).settings.bpm).toBe(bpm);
  for(const bpm of [39.99,180.01])expect(()=>validateScene({...s,settings:{...s.settings,bpm}})).toThrow();
  const oversized={...s,pieces:[...s.pieces,newPiece('note',0,'extra')]};
  const result=sceneSchema.safeParse(oversized);expect(result.success).toBe(false);
  if(!result.success)expect(result.error.issues.some(issue=>issue.code==='too_big'&&issue.path.join('.')==='pieces')).toBe(true);
  expect(s.pieces).toHaveLength(92);expect(s.settings.bpm).toBe(120);
 });
 it('rejects malformed values and duplicates with no mutation',()=>{const s=emptyScene();s.pieces=[newPiece('note',0,'n'),newPiece('generator',1,'g')];const before=exportScene(s);expect(()=>movePiece(s,'n',1)).toThrow();expect(()=>movePiece(s,'n',92)).toThrow();expect(exportScene(s)).toBe(before);expect(movePiece(s,'n',2).pieces[0].vertex).toBe(2);for(const bad of [{...s,version:2},{...s,settings:{...s.settings,bpm:NaN}},{...s,pieces:[s.pieces[0],{...s.pieces[1],id:'n'}]},{...s,endpoint:'secret'}, {...s,pieces:Array.from({length:9},(_,i)=>newPiece('generator',i,`g${i}`))}])expect(()=>validateScene(bad)).toThrow();});
 it('round trips every fixture; retains old scene on JSON/storage errors',()=>{for(const file of fs.readdirSync('public/fixtures').filter(f=>f!=='expected.json')){const s=importScene(fs.readFileSync(`public/fixtures/${file}`,'utf8'));expect(importScene(exportScene(s))).toEqual(s);expect(exportScene(s)).not.toMatch(/endpoint|credentials|camera/);}const s=emptyScene();expect(()=>saveScene(s,{setItem(){throw Error('QuotaExceeded');}})).toThrow('QuotaExceeded');expect(()=>importScene('{oops')).toThrow();expect(s).toEqual(emptyScene());});
 it('history edits preserve IDs and redo',()=>{const h=new History(),s=emptyScene();h.push(s);const next=changeScene(s,x=>x.pieces.push(newPiece('note',0,'n')));expect(h.undo(next)).toEqual(s);expect(h.redo(s)).toEqual(next);});
 it('scene replacement undo and redo both restore through a paused load',()=>{const h=new History(),a=emptyScene(),b=changeScene(a,s=>s.pieces.push(newPiece('note',0,'n')));h.push(a,'load');expect(h.undo(b)).toEqual(a);expect(h.restorationMode).toBe('load');expect(h.redo(a)).toEqual(b);expect(h.restorationMode).toBe('load');h.push(b,'clear');expect(h.undo(a)).toEqual(b);expect(h.restorationMode).toBe('load');expect(h.redo(b)).toEqual(a);expect(h.restorationMode).toBe('clear');});
});
