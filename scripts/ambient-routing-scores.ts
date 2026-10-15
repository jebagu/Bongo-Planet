import assert from 'node:assert/strict';
import {emptyScene, validateScene, type Generator, type Scene} from '../src/core/contracts';
import {topology} from '../src/core/geometry';
import {type Instrument} from '../src/core/instruments';
import {labelPieces} from '../src/core/pieceLabels';
import {SONG_WALKS} from '../src/core/songbook';
import {DEFAULT_APPEARANCE, type Appearance} from '../src/view/art/appearance';
import {applyLookTheme, LOOK_THEMES} from '../src/view/art/themes';

export interface PlanetLoop {
  id:string; name:string; slug:string; group:'Airy & Ambient'|'Minimal Routing';
  bpm:number; key:number; scale:Scene['settings']['scale']; cycleBeats:number; theme:22|25;
  description:string; routing:string; build:()=>Scene;
}

/** Pose a different valid closed seam walk without changing any vertex coordinates. */
function globeCycle(seed:number):number[] {
  let state=seed>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  let path=[...SONG_WALKS[92]];
  for(let turn=0;turn<20000;turn++) {
    if(topology.neighbors[path.at(-1)!].includes(path[0])&&turn>30)return path;
    const pivots=topology.neighbors[path.at(-1)!].map(v=>path.indexOf(v)).filter(i=>i<path.length-2);
    const pivot=pivots[Math.floor(random()*pivots.length)];
    path=[...path.slice(0,pivot+1),...path.slice(pivot+1).reverse()];
  }
  throw Error('Could not close the full-globe route.');
}

class Score {
  scene=emptyScene();
  gates=new Map<number,Set<number>>();
  constructor(readonly id:string,bpm:number,key:number,scale:Scene['settings']['scale'],volume=.75) {
    this.scene.settings={...this.scene.settings,bpm,key,scale,volume};
  }
  edge(from:number,to:number) {
    assert(topology.neighbors[from].includes(to),`${from} -> ${to} must be a real strut.`);
    const exits=this.gates.get(from)??new Set<number>();exits.add(to);this.gates.set(from,exits);
  }
  path(vertices:readonly number[]) {for(let i=1;i<vertices.length;i++)this.edge(vertices[i-1],vertices[i]);return this;}
  source(vertex:number,period:Generator['period'],offset:number,travel:number) {
    this.scene.pieces.push({id:`${this.id}-source-${this.scene.pieces.length}`,kind:'generator',vertex,period,phase:offset/period,travel,enabled:true,reach:180});
  }
  note(vertex:number,instrument:Instrument,degree:number,octave:number,duration:number,level:number) {
    this.scene.pieces.push({id:`${this.id}-${instrument}-${this.scene.pieces.length}`,kind:'note',vertex,instrument,degree,octave,timbre:'sine',duration,level});
  }
  finish() {
    this.scene.wiring=[...this.gates].sort((a,b)=>a[0]-b[0]).map(([vertex,exits])=>({vertex,exits:[...exits].sort((a,b)=>a-b)}));
    return validateScene(labelPieces(this.scene));
  }
}

const meridians=[
  [38,40,8,5,7,4,0,22,16,25,26,27,52,54,18,17,19,10,11,14,13,15,3,37,38],
  [38,87,35,34,32,31,12,60,21,58,56,55,90,53,51,75,76,69,70,72,71,63,73,39,38],
  [38,41,42,88,43,44,45,47,78,89,49,50,52,54,18,17,19,10,11,14,13,15,3,37,38],
  [38,66,68,65,67,64,61,79,74,81,82,83,90,53,51,75,76,69,70,72,71,63,73,39,38],
];

/** Insert silent detours into every occurrence of a shared edge, preserving one fork. */
function longMeridians(target=88):number[][] {
  const paths=meridians.map(p=>[...p]),used=new Set(paths.flat());
  while(used.size<target) {
    let inserted=false;
    for(let v=0;v<92&&!inserted;v++)if(!used.has(v)) {
      for(const path of paths) {
        const index=path.findIndex((from,i)=>i<path.length-1&&topology.neighbors[from].includes(v)&&topology.neighbors[v].includes(path[i+1]));
        if(index<0)continue;
        const from=path[index],to=path[index+1];
        for(const other of paths)for(let i=other.length-2;i>=0;i--)if(other[i]===from&&other[i+1]===to)other.splice(i+1,0,v);
        used.add(v);inserted=true;break;
      }
    }
    if(!inserted)break;
  }
  assert(used.size>=80,'The meridians must use most of the sphere.');
  return paths;
}

/** Add spaced, forward-only shortcuts: each fork makes a different musical delay. */
function shortcuts(score:Score,path:number[],count:number,minSkip=6,maxSkip=18) {
  const candidates=path.flatMap((from,i)=>i>=5?
    topology.neighbors[from].map(to=>({i,j:path.indexOf(to)})).filter(({j})=>j-i>=minSkip&&j-i<=maxSkip&&j<path.length-5):[]);
  function choose(after:number,n:number):{i:number;j:number}[]|null {
    if(n===count)return [];
    const desired=8+n*Math.floor((path.length-30)/count);
    const options=candidates.filter(p=>p.i>=after).sort((a,b)=>Math.abs(a.i-desired)-Math.abs(b.i-desired)||(b.j-b.i)-(a.j-a.i));
    for(const candidate of options) {const tail=choose(candidate.j+3,n+1);if(tail)return [candidate,...tail];}
    return null;
  }
  const selected=choose(5,0);assert(selected,`Need ${count} separated routing forks.`);
  selected.forEach(({i,j})=>score.edge(path[i],path[j]));
}

function paperMoons() {
  const s=new Score('AA01',40,2,'pentatonic'),walk=globeCycle(101),lengths=[24,24,24,20];
  const phrases=[[0,2,3,4,2,1,3,2,0],[2,3,4,1,0,2,4,3,2],[3,4,2,0,1,2,3,1,0],[0,3,1,4,2,1,3,0,2]];
  const voices:Instrument[]=['piano','glass','kalimba','guitar'];let cursor=0;
  for(let lane=0;lane<4;lane++) {
    const path=walk.slice(cursor,cursor+lengths[lane]);cursor+=lengths[lane];s.path(path);
    s.source(path[0],16,[0,2,8,10][lane],path.length-1);
    [2,4,7,9,12,14,17,19,22].filter(step=>step<path.length).forEach((step,i)=>{
      s.note(path[step],voices[lane],phrases[lane][i],lane===1?4:3,4.6+(i%3)*.7,.18+(i%3)*.025);
      if(i===0||i===4)s.note(path[step],lane%2?'piano':'glass',lane%2?0:3,3,5.8,.09);
    });
  }
  return s.finish();
}

function seaGlass() {
  const s=new Score('AA02',48,4,'minor',.78),walk=globeCycle(202);
  s.path(walk);s.source(walk[0],24,0,91);shortcuts(s,walk,2,4,35);
  const palette:Instrument[]=['glass','piano','guitar','kalimba','marimba'],tones=[0,4,6,1,2,4,0,6,4,2,1,4];
  for(let i=2;i<91;i+=3) {
    const n=Math.floor(i/3);s.note(walk[i],palette[n%5],tones[n%tones.length],n%5===0?4:3,4.8+(n%4)*.6,.09+(n%4)*.015);
    if(n%7===0)s.note(walk[i],'piano',n%2?2:6,3,6.4,.055);
  }
  return s.finish();
}

function kiteWeather() {
  const s=new Score('AA03',50,7,'pentatonic',.72),paths=longMeridians(90);
  paths.forEach(p=>s.path(p));s.source(38,16,0,Math.max(...paths.map(p=>p.length-1)));
  const used=new Set<number>(),voices:Instrument[]=['kalimba','glass','piano','guitar'];
  paths.forEach((path,lane)=>path.forEach((vertex,index)=>{
    if(vertex===38||used.has(vertex)||index%2===0)return;used.add(vertex);
    const tones=[0,2,4,3,2,1,3,4,2,0];
    s.note(vertex,voices[lane],tones[(Math.floor(index/2)+lane*2)%tones.length],lane===1?4:3,3.5+(index%4)*.6,.105+(index%3)*.015);
  }));
  return s.finish();
}

function blueGreenhouse() {
  const s=new Score('AA04',40,0,'major',.78),walk=globeCycle(404),lengths=[28,24,22,18];
  const colors=[[0,2,4,6],[3,5,0,2],[5,0,2,4],[0,2,4,1]],voices:Instrument[]=['piano','guitar','glass','kalimba'];let cursor=0;
  lengths.forEach((length,lane)=>{
    const path=walk.slice(cursor,cursor+length);cursor+=length;s.path(path);
    s.source(path[0],lane%2?16:8,[0,3,4,11][lane],length-1);
    for(let index=2;index<length;index+=2) {
      const i=index/2-1;s.note(path[index],voices[lane],colors[lane][i%4],lane===2?4:3,5+(i%3),.145+(i%3)*.02);
      if(i===0||i===4)s.note(path[index],lane%2?'marimba':'glass',colors[lane][(i+2)%4],3,6,.075);
    }
  });
  return s.finish();
}

function porchLights() {
  const s=new Score('AA05',45,5,'major',.8),walk=globeCycle(505);s.path(walk);
  s.source(walk[0],24,0,91);s.source(walk[46],12,6,45);
  const melody=[0,4,5,4,2,0,1,2,4,6,5,4,2,1,0],voices:Instrument[]=['guitar','piano','marimba','glass','kalimba'];
  for(let index=2;index<92;index+=2) {
    if(index===46)continue;const i=index/2-1;
    s.note(walk[index],voices[i%5],melody[i%melody.length],i%5===3?4:3,4+(i%3),.145+(i%4)*.014);
    if(index%18===2)s.note(walk[index],'piano',index%36===2?4:0,2,7.2,.1);
  }
  return s.finish();
}

function oneBell() {
  const s=new Score('MR01',40,2,'pentatonic',.8),walk=globeCycle(611);s.path([...walk,walk[0]]);
  shortcuts(s,walk,2,6,13);s.source(walk[0],32,0,104);
  s.note(walk[10],'glass',0,4,7.6,.3);return s.finish();
}

function twoTinCans() {
  const s=new Score('MR02',48,9,'minor',.82),walk=globeCycle(722).slice(0,88);s.path(walk);
  shortcuts(s,walk,3,7,17);s.source(walk[0],24,0,87);
  s.note(walk[18],'marimba',0,3,3.2,.23);s.note(walk[72],'piano',4,4,6,.12);return s.finish();
}

function threadTheNeedle() {
  const s=new Score('MR03',40,7,'pentatonic',.8),walk=globeCycle(833);s.path([...walk,walk[0]]);
  shortcuts(s,walk,2,6,15);s.source(walk[0],16,0,64);s.source(walk[46],16,8,64);
  s.note(walk[12],'kalimba',0,4,4.5,.22);s.note(walk[39],'guitar',3,3,6,.2);s.note(walk[76],'glass',2,4,7,.16);
  return s.finish();
}

function catsCradle() {
  const s=new Score('MR04',50,4,'minor',.83),paths=longMeridians(88),minimum=Math.min(...paths.map(p=>p.length-1));
  paths.forEach(p=>s.path(p));s.source(38,24,0,2*minimum-1);
  s.note(4,'piano',0,3,6.8,.19);s.note(56,'glass',4,4,7.4,.14);s.note(81,'kalimba',6,3,5.6,.16);
  return s.finish();
}

function roundTripTicket() {
  const s=new Score('MR05',45,0,'pentatonic',.8);let loops:number[][]|undefined;
  for(let seed=900;seed<930&&!loops;seed++) {
    const cycle=globeCycle(seed);
    for(let rotation=0;rotation<92&&!loops;rotation++) {
      const walk=[...cycle.slice(rotation),...cycle.slice(0,rotation)];
      for(let split=32;split<=59;split++)if(topology.neighbors[walk[0]].includes(walk[split])&&topology.neighbors[walk[0]].includes(walk[split+1])) {
        loops=[[...walk.slice(0,split+1),walk[0]],[walk[0],...walk.slice(split+1).reverse(),walk[0]]];break;
      }
    }
  }
  assert(loops,'Need two disjoint unequal return circuits.');
  loops.forEach(p=>s.path(p));const minimum=Math.min(...loops.map(p=>p.length-1));s.source(loops[0][0],24,0,2*minimum-1);
  s.note(loops[0][7],'guitar',0,3,6,.23);s.note(loops[0][22],'glass',3,4,7.5,.15);
  s.note(loops[1][9],'piano',0,4,6.5,.18);s.note(loops[1][26],'kalimba',3,3,5,.2);return s.finish();
}

export const PLANET_LOOPS:readonly PlanetLoop[]=[
  {id:'AA01',name:'Paper Moons',slug:'paper-moons',group:'Airy & Ambient',bpm:40,key:2,scale:'pentatonic',cycleBeats:16,theme:22,build:paperMoons,
    description:'Four unhurried D-pentatonic voices: low piano, high glass, little kalimba answers and a warm guitar floor. Open fifths and ninths hang across the gaps.',
    routing:'Four staggered finite lanes divide the entire globe, starting on beats 0, 2, 8 and 10. Silent junctions separate the notes; each lane ends before its next launch.'},
  {id:'AA02',name:'Sea Glass',slug:'sea-glass',group:'Airy & Ambient',bpm:48,key:4,scale:'minor',cycleBeats:24,theme:25,build:seaGlass,
    description:'E-minor-nine colors slowly refract through glass, piano, guitar and small wooden plucks. Quiet duplicates become echoes as different-length routes reunite.',
    routing:'A full-globe finite walk with two forward shortcuts. Each fork sends a long and a short copy into the same later passage, creating routed delays without a growing circuit.'},
  {id:'AA03',name:'Kite Weather',slug:'kite-weather',group:'Airy & Ambient',bpm:50,key:7,scale:'pentatonic',cycleBeats:16,theme:22,build:kiteWeather,
    description:'A soft G-pentatonic shimmer unfolds down four meridians. Glass sits above the piano and guitar while thumb-piano notes make a loose, suspended melody.',
    routing:'A northern fork sends four streams around long detours into two shared return lanes. Finite travel lets the whole branching wave fade before the next 16-beat launch.'},
  {id:'AA04',name:'Blue Greenhouse',slug:'blue-greenhouse',group:'Airy & Ambient',bpm:40,key:0,scale:'major',cycleBeats:16,theme:25,build:blueGreenhouse,
    description:'C-major-seven, F-major-nine and A-minor colors overlap like small sunlit rooms. Piano and guitar carry the low harmony; glass, kalimba and marimba answer above.',
    routing:'Four globe-spanning lanes interlock eight- and 16-beat sources with different phase offsets. Slow simultaneous layers and empty junctions give the harmony space.'},
  {id:'AA05',name:'Porch Lights',slug:'porch-lights',group:'Airy & Ambient',bpm:45,key:5,scale:'major',cycleBeats:24,theme:22,build:porchLights,
    description:'A warm F-major guitar-and-piano walk with low roots, soft wooden answers and occasional high glass. A second slow source gently lights up the far side.',
    routing:'One 91-hop journey crosses every junction. A second source joins halfway around, repeating at half the main interval so the rear hemisphere develops its own quiet answering phrase.'},
  {id:'MR01',name:'One Bell, Long Way',slug:'one-bell-long-way',group:'Minimal Routing',bpm:40,key:2,scale:'pentatonic',cycleBeats:32,theme:22,build:oneBell,
    description:'One D glass bell. The same note returns in small unequal clusters, with long stretches of silent spark travel.',
    routing:'A closed 92-junction circuit with two forward bypasses and a 104-hop budget. Copies return by different routes, revisit the single bell, then expire before the next launch.'},
  {id:'MR02',name:'Two Tin Cans',slug:'two-tin-cans',group:'Minimal Routing',bpm:48,key:9,scale:'minor',cycleBeats:24,theme:25,build:twoTinCans,
    description:'Only a low A marimba and a distant E piano answer. The route makes the repetitions; there is no drum part or chord stack.',
    routing:'An 88-junction one-way maze with three spaced split-and-rejoin bypasses. Up to eight finite copies reach the final stretch at different delays, then stop at the end.'},
  {id:'MR03',name:'Thread the Needle',slug:'thread-the-needle',group:'Minimal Routing',bpm:40,key:7,scale:'pentatonic',cycleBeats:16,theme:22,build:threadTheNeedle,
    description:'Three tiny G-pentatonic landmarks: kalimba, guitar and glass. Two out-of-phase sources keep trading the same sparse notes.',
    routing:'Two opposing entry points feed one 92-junction ring with two shortcut needles. Each source travels 64 hops; phase and path length produce the changing answers.'},
  {id:'MR04',name:'Cat’s Cradle',slug:'cats-cradle',group:'Minimal Routing',bpm:50,key:4,scale:'minor',cycleBeats:24,theme:25,build:catsCradle,
    description:'Only three E-minor landmarks sound inside a large moving lattice. A soft piano root, a high glass fifth and a kalimba seventh return in increasingly offset groups.',
    routing:'Four long meridians fold into two return lanes. The first wave returns to the northern fork and splits again; its finite budget ends before any third complete round can begin.'},
  {id:'MR05',name:'Round Trip Ticket',slug:'round-trip-ticket',group:'Minimal Routing',bpm:45,key:0,scale:'pentatonic',cycleBeats:24,theme:22,build:roundTripTicket,
    description:'Four quiet objects play only C and G across two octaves. Almost all the planet is silent, so the different return times become the composition.',
    routing:'Two unequal closed loops share one fork and otherwise divide all 92 junctions. Returning sparks take both exits again; a finite two-round budget keeps the figure-eight bounded.'},
];

export function loopAppearance(loop:PlanetLoop):Appearance {
  const theme=LOOK_THEMES.find(t=>t.id===loop.theme);assert(theme);
  return applyLookTheme({...DEFAULT_APPEARANCE,size:loop.group==='Minimal Routing'?.95:1,lighting:.85,sparkStyle:'white'},theme);
}
