import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateScene,type Scene} from '../src/core/contracts';
import {topology} from '../src/core/geometry';
import {isPercussion,type Instrument} from '../src/core/instruments';
import {labelPieces} from '../src/core/pieceLabels';
import {POP_SONGS,popSongScene} from '../src/core/popSongs';
import {DEFAULT_APPEARANCE,type Appearance} from '../src/view/art/appearance';
import {LOOK_THEMES,applyLookTheme} from '../src/view/art/themes';

export const LOOP_BUILD_GROUP='favorites - with loops';
export interface LoopBuild {
  id:string; name:string; slug:string; sourceId:string; bpm:number; key:number; scale:Scene['settings']['scale']; cycleBeats:32; theme:22|25;
  description:string; routing:string; build:()=>Scene;
}
type Gates=Map<number,Set<number>>;
const projectRoot=resolve(process.env.BONGO_PROJECT_ROOT??join(dirname(fileURLToPath(import.meta.url)),'..'));

function addPath(gates:Gates,path:number[]) {
  for(let i=1;i<path.length;i++) {
    assert(topology.neighbors[path[i-1]].includes(path[i]));
    const exits=gates.get(path[i-1])??new Set<number>();exits.add(path[i]);gates.set(path[i-1],exits);
  }
}
function finish(scene:Scene,gates:Gates):Scene {
  scene.wiring=[...gates].map(([vertex,exits])=>({vertex,exits:[...exits].sort((a,b)=>a-b)})).sort((a,b)=>a.vertex-b.vertex);
  return validateScene(labelPieces(scene));
}
function note(scene:Scene,id:string,vertex:number,instrument:Instrument,midi:number,duration:number,level:number) {
  let pitch:{degree:number;octave:number}|undefined;
  const scale=scene.settings.scale==='pentatonic'?[0,2,4,7,9]:scene.settings.scale==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  if(isPercussion(instrument))pitch={degree:0,octave:4};
  else for(let octave=2;octave<=6;octave++)for(let degree=0;degree<scale.length;degree++)if(12*(octave+1)+scene.settings.key+scale[degree]===midi)pitch={degree,octave};
  assert(pitch,`${midi} must fit the composition's key and range.`);
  scene.pieces.push({id:`${id}-${scene.pieces.length}`,kind:'note',vertex,instrument,...pitch,timbre:'sine',duration,level});
}

/** Two disjoint return circuits in the space left by the unchanged cover melody. */
function returnCircuits(free:Set<number>):number[][] {
  function findCycle(hub:number,allowed:Set<number>,target:number):number[]|null {
    const walk=[hub],used=new Set(walk);let calls=0;
    function extend():number[]|null {
      if(++calls>200000)return null;
      if(walk.length===target)return topology.neighbors[walk.at(-1)!].includes(hub)?[...walk,hub]:null;
      const options=topology.neighbors[walk.at(-1)!].filter(v=>allowed.has(v)&&!used.has(v)).sort((a,b)=>
        topology.neighbors[a].filter(v=>allowed.has(v)&&!used.has(v)).length-topology.neighbors[b].filter(v=>allowed.has(v)&&!used.has(v)).length||a-b);
      for(const next of options) {walk.push(next);used.add(next);const found=extend();if(found)return found;used.delete(next);walk.pop();}
      return null;
    }
    return extend();
  }
  let loops:number[][]|undefined;
  for(const hub of [...free].sort((a,b)=>a-b)) {
    for(const length of [7,8,9,6,5]) {
      const first=findCycle(hub,free,length);if(!first)continue;
      const remaining=new Set([...free].filter(v=>v===hub||!first.includes(v)));
      for(const secondLength of [8,9,7,6,5].filter(n=>n!==length)) {
        const second=findCycle(hub,remaining,secondLength);if(second){loops=[first,second];break;}
      }
      if(loops)break;
    }
    if(loops)break;
  }
  assert(loops,'The cover needs two separate feedback circuits.');
  const used=new Set(loops.flat());
  while(used.size<24) {
    let inserted=false;
    for(const path of [...loops].sort((a,b)=>a.length-b.length)) {
      for(let i=0;i<path.length-1&&!inserted;i++) {
        const next=[...free].find(v=>!used.has(v)&&topology.neighbors[path[i]].includes(v)&&topology.neighbors[v].includes(path[i+1]));
        if(next!==undefined){path.splice(i+1,0,next);used.add(next);inserted=true;}
      }
      if(inserted)break;
    }
    if(!inserted)break;
  }
  return loops;
}

function coverBuild(sourceId:'P04'|'P05',id:string,bpm:number):Scene {
  const song=POP_SONGS.find(s=>s.id===sourceId);assert(song);
  const original=popSongScene(song),source=original.pieces.find(p=>p.kind==='generator'&&p.id===`${sourceId}-source-0`);assert(source?.kind==='generator');
  const oldGates=new Map(original.wiring!.map(w=>[w.vertex,w.exits])),melodyPath=[source.vertex];
  while(oldGates.get(melodyPath.at(-1)!)?.length) {
    const exits=oldGates.get(melodyPath.at(-1)!)!;assert.equal(exits.length,1);melodyPath.push(exits[0]);assert(melodyPath.length<=65);
  }
  assert.equal(melodyPath.length,65);
  const scene:Scene={...original,settings:{...original.settings,bpm,volume:.8},pieces:original.pieces.filter(p=>
    p.id===source.id||(p.kind==='note'&&!isPercussion(p.instrument))).map(p=>p.kind==='note'?
      {...p,id:p.id.replace(sourceId,id),duration:Math.min(3.5,p.duration*song.bpm/bpm),level:p.level*.84}:
      {...p,id:`${id}-lead-source`}),wiring:[]};
  const gates:Gates=new Map();addPath(gates,melodyPath);
  const free=new Set(topology.vertices.map((_,i)=>i).filter(v=>!melodyPath.includes(v))),loops=returnCircuits(free);
  loops.forEach(path=>addPath(gates,path));
  const budget=sourceId==='P04'?51:37;
  scene.pieces.push({id:`${id}-feedback-source`,kind:'generator',vertex:loops[0][0],period:32,phase:8/32,reach:180,enabled:true,travel:budget});

  if(sourceId==='P04') {
    // Tight chord replies and lighter percussion leave the recognizable tune clear.
    note(scene,id,loops[0][1],'guitar',57,.24,.105);
    note(scene,id,loops[0][1],'hi-hat',60,.1,.055);
    note(scene,id,loops[0][4],'kalimba',76,.22,.09);
    note(scene,id,loops[0][8],'bongo-high',60,.1,.065);
    note(scene,id,loops[1][2],'piano',69,.26,.11);
    note(scene,id,loops[1][2],'kick',60,.1,.075);
    note(scene,id,loops[1][6],'glass',76,.32,.085);
    note(scene,id,loops[1][9],'snare',60,.1,.065);
  } else {
    // Short F#–D–B fragments turn the synth hook into rapid offset runs.
    const a=loops[0],b=loops[1];
    for(const [step,midi] of [[1,78],[3,74],[5,71],[8,76]] as const)if(step<a.length-1)note(scene,id,a[step],'marimba',midi,.08,.105);
    for(const [step,midi] of [[1,76],[3,80],[5,81]] as const)if(step<b.length-1)note(scene,id,b[step],'kalimba',midi,.075,.085);
    note(scene,id,a[2],'hi-hat',60,.1,.05);note(scene,id,b[2],'bongo-high',60,.1,.055);
    const remaining=[...free].filter(v=>!loops.flat().includes(v));
    outer:for(const from of remaining)for(const to of topology.neighbors[from])if(remaining.includes(to)) {
      addPath(gates,[from,to]);scene.pieces.push({id:`${id}-quiet-kick-source`,kind:'generator',vertex:from,period:2,phase:0,reach:180,enabled:true,travel:1});
      note(scene,id,to,'kick',60,.1,.22);break outer;
    }
  }
  return finish(scene,gates);
}

function kiteSquall():Scene {
  const original=JSON.parse(readFileSync(join(projectRoot,'public/fixtures/AA03.json'),'utf8')) as Scene;
  const source=original.pieces.find(p=>p.kind==='generator');assert(source?.kind==='generator');
  const gates:Gates=new Map(original.wiring!.map(w=>[w.vertex,new Set(w.exits)]));
  const scene:Scene={...original,settings:{...original.settings,bpm:144,volume:.82},pieces:[{...source,id:'BR03-feedback-source',period:32,phase:0,travel:63}]};
  const byVertex=new Map(original.pieces.filter(p=>p.kind==='note').map(p=>[p.vertex,p])),used=new Set<number>();
  const voices:Instrument[]=['kalimba','glass','guitar','piano'],tones=[0,2,4,3,2,1,3,4];
  for(const [lane,start] of [...gates.get(source.vertex)!].sort((a,b)=>a-b).entries()) {
    const path:number[]=[source.vertex,start];
    while(path.at(-1)!==source.vertex) {const exits:number[]=[...(gates.get(path.at(-1)!)??[])];assert.equal(exits.length,1);path.push(exits[0]);assert(path.length<93);}
    for(let step=1;step<path.length-1;step+=6) {
      const vertex=path[step];if(used.has(vertex))continue;used.add(vertex);
      const previous=byVertex.get(vertex);
      scene.pieces.push(previous?.kind==='note'?{...previous,id:`BR03-landmark-${vertex}`,duration:previous.instrument==='glass'?.42:.25,level:previous.instrument==='glass'?.075:.095}:
        {id:`BR03-landmark-${vertex}`,kind:'note',vertex,instrument:voices[lane],degree:tones[(Math.floor(step/6)+lane)%tones.length],octave:lane===1?4:3,timbre:'sine',duration:.28,level:.09});
    }
  }
  return finish(scene,gates);
}

export const LOOP_BUILDS:readonly LoopBuild[]=[
  {id:'BR01',name:'Dancing Queen — Spark Build',slug:'dancing-queen-spark-build',sourceId:'P04',bpm:120,key:9,scale:'major',cycleBeats:32,theme:22,build:()=>coverBuild('P04','BR01',120),
    description:'The familiar piano refrain begins with open space. Returning sparks bring in guitar, piano and glass replies, then thicken the percussion into a short dance-floor crest before falling back to the clear tune.',
    routing:'The original 64-hop melody and chord lane remains separate. A delayed source enters two unequal return circuits on beat eight; its descendants rebranch until their shared 51-hop budget expires. The main tune continues during the release.'},
  {id:'BR02',name:'Take On Me — Spark Build',slug:'take-on-me-spark-build',sourceId:'P05',bpm:180,key:9,scale:'major',cycleBeats:32,theme:25,build:()=>coverBuild('P05','BR02',180),
    description:'A clear marimba hook and quiet half-time kick give way to rapid F-sharp–D–B fragments, high kalimba answers and tight percussion. The fast runs interlock, then disappear to reveal the hook again.',
    routing:'The recognizable melody keeps its written pitch sequence. A second source starts on beat eight and recirculates through unequal loops. The 37-hop lifetime bounds the flourish; at 180 BPM, adjacent attacks can be only 83.3 milliseconds apart.'},
  {id:'BR03',name:'Kite Weather — Squall',slug:'kite-weather-squall',sourceId:'AA03',bpm:144,key:7,scale:'pentatonic',cycleBeats:32,theme:22,build:kiteSquall,
    description:'The original G-pentatonic world opens with a few distant landmarks. Shorter notes and a faster underlying grid allow a much larger returning wave to break into a rapid shower, then clear into a long quiet interval.',
    routing:'The original four meridians and 90-junction network remain. A 63-hop budget permits another round of returns through the four-way northern fork. Sparse six-hop note spacing starts gently; unequal returns fill the spaces with faster layers before all descendants expire together.'},
];

export function loopBuildAppearance(loop:LoopBuild):Appearance {
  const theme=LOOK_THEMES.find(t=>t.id===loop.theme);assert(theme);
  return applyLookTheme({...DEFAULT_APPEARANCE,lighting:.9,size:1,sparkStyle:'white'},theme);
}
