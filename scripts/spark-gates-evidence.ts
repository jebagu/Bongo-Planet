import {mkdirSync,writeFileSync} from 'node:fs';
import {Engine} from '../src/core/engine';
import {emptyScene,newPiece,validateScene,type EngineEvent} from '../src/core/contracts';

// Fixed topology IDs and analytic times, independent of the routing algorithm.
const fixtures=[
 {name:'chain-one',limit:1,wiring:[[0,[1]],[1,[2]],[2,[3]]],arrivals:[[1,.125]]},
 {name:'chain-two',limit:2,wiring:[[0,[1]],[1,[2]],[2,[3]]],arrivals:[[1,.125],[2,.25]]},
 {name:'chain-three',limit:3,wiring:[[0,[1]],[1,[2]],[2,[3]]],arrivals:[[1,.125],[2,.25],[3,.375]]},
 {name:'empty-hop',limit:3,wiring:[[0,[1]],[1,[2]],[2,[3]]],arrivals:[[1,.125],[2,.25],[3,.375]],empty:[1]},
 {name:'fork',limit:2,wiring:[[0,[1]],[1,[2,5]]],arrivals:[[1,.125],[2,.25],[5,.25]]},
 {name:'sink',limit:3,wiring:[[0,[1]],[1,[]]],arrivals:[[1,.125]]},
 {name:'return',limit:3,wiring:[[0,[1]],[1,[0]]],arrivals:[[1,.125],[0,.25],[1,.375]]},
 {name:'convergence',limit:2,wiring:[[0,[1,4]],[1,[5]],[4,[5]]],arrivals:[[1,.125],[4,.125],[5,.25],[5,.25]]},
 {name:'seven-hop-loop',limit:7,wiring:[[0,[1]],[1,[4]],[4,[0]]],arrivals:[[1,.125],[4,.25],[0,.375],[1,.5],[4,.625],[0,.75],[1,.875]]},
] as const;
const results=fixtures.map(f=>{
 const scene=emptyScene();scene.pieces=[{...newPiece('generator',0,'G'),travel:f.limit,period:8},...[1,2,3,4,5].filter(v=>!('empty' in f&&f.empty.some(n=>n===v))).map(v=>newPiece('note',v,`note-${v}`))];
 scene.wiring=f.wiring.map(([vertex,exits])=>({vertex,exits:[...exits]}));validateScene(scene);
 const engine=new Engine(scene),events:EngineEvent[]=[];engine.play(0);engine.advance(0);events.push(...engine.drain());
 for(let ms=1;ms<=1100;ms++){engine.advance(ms/1000);events.push(...engine.drain());}
 const actualArrivals=events.flatMap(e=>e.type==='arrival'?[[e.vertex,e.time]]:[]);
 const actualSounds=events.flatMap(e=>e.type==='onset'?[[scene.pieces.find(p=>p.id===e.trigger.nodeId)!.vertex,e.trigger.onset]]:[]);
 const expectedSounds=f.arrivals.filter(([v])=>v!==0&&!('empty' in f&&f.empty.some(n=>n===v)));
 const passed=JSON.stringify(actualArrivals)===JSON.stringify(f.arrivals)&&JSON.stringify(actualSounds)===JSON.stringify(expectedSounds)&&engine.snapshot().gatedEdges===0;
 return {name:f.name,scene,expectedArrivals:f.arrivals,actualArrivals,expectedSounds,actualSounds,passed,final:engine.snapshot(),events};
});
mkdirSync('evidence/spark-gates/step-02',{recursive:true});
writeFileSync('evidence/spark-gates/step-02/circuit-traces.json',JSON.stringify({date:new Date().toISOString(),oracle:'At 120 BPM, each fixed adjacent hop takes 0.125 seconds. Listed vertex IDs and arrival sequences are fixed before engine execution.',passed:results.every(r=>r.passed),fixtures:results},null,2));
console.log(JSON.stringify({passed:results.every(r=>r.passed),fixtures:results.map(r=>({name:r.name,passed:r.passed}))}));
if(results.some(r=>!r.passed))process.exitCode=1;
