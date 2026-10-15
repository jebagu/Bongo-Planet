import assert from 'node:assert/strict';
import {emptyScene,validateScene,type Scene} from '../src/core/contracts';
import {topology} from '../src/core/geometry';
import {type Instrument} from '../src/core/instruments';
import {labelPieces} from '../src/core/pieceLabels';
import {SONG_WALKS} from '../src/core/songbook';
import {DEFAULT_APPEARANCE,type Appearance} from '../src/view/art/appearance';
import {LOOK_THEMES,applyLookTheme} from '../src/view/art/themes';

type Drum=Extract<Instrument,'kick'|'snare'|'hi-hat'|'bongo-high'|'bongo-low'>;
type Hit={step:number;instrument:Drum;level:number};
type FillHit={loop:number;step:number;instrument:Drum;level:number};
export interface DrumBuild {
  id:string;name:string;slug:string;genre:string;bpm:number;key:0;scale:'major';cycleBeats:32;theme:22|25;
  feedbackLengths:readonly number[];feedbackOffset:number;feedbackTravel:number;reverse:boolean;
  description:string;routing:string;groove:readonly Hit[];fill:readonly FillHit[];build:()=>Scene;
}
const hits=(instrument:Drum,steps:readonly number[],level:number,ghost=.75):Hit[]=>steps.map((step,index)=>({step,instrument,level:level*(index%2?ghost:1)}));
type Layout={main:number[];loops:number[][]};
const layouts=new Map<string,Layout>();

/** Reserve the long groove lane, then fit unequal closed circuits in the remaining patch. */
function layoutFor(score:DrumBuild):Layout {
  const cached=layouts.get(score.id);if(cached)return cached;
  const walk=score.reverse?[...SONG_WALKS[92]].reverse():[...SONG_WALKS[92]];
  const loopVertices=score.feedbackLengths.reduce((sum,n)=>sum+n,0)-score.feedbackLengths.length+1;
  for(let count=73;count>=Math.max(65,80-loopVertices);count--) {
    const main=walk.slice(0,count),free=new Set(walk.slice(count));
    const hubs=[...free].filter(v=>topology.neighbors[v].filter(n=>free.has(n)).length>=2*score.feedbackLengths.length);
    for(const hub of hubs) {
      let calls=0;const loops:number[][]=[];
      function choose(index:number,blocked:Set<number>):boolean {
        if(index===score.feedbackLengths.length)return true;
        const target=score.feedbackLengths[index],path:number[]=[hub],used=new Set([hub]);
        function extend():boolean {
          if(++calls>350000)return false;
          if(path.length===target) {
            if(!topology.neighbors[path.at(-1)!].includes(hub))return false;
            loops.push([...path,hub]);
            if(choose(index+1,new Set([...blocked,...path.slice(1)])))return true;
            loops.pop();return false;
          }
          const options=topology.neighbors[path.at(-1)!].filter(v=>free.has(v)&&!used.has(v)&&!blocked.has(v));
          options.sort((a,b)=>topology.neighbors[a].filter(v=>free.has(v)&&!used.has(v)&&!blocked.has(v)).length-
            topology.neighbors[b].filter(v=>free.has(v)&&!used.has(v)&&!blocked.has(v)).length||a-b);
          for(const next of options){path.push(next);used.add(next);if(extend())return true;used.delete(next);path.pop();}
          return false;
        }
        return extend();
      }
      if(choose(0,new Set())){const result={main,loops};layouts.set(score.id,result);return result;}
    }
  }
  throw Error(`${score.id}: could not fit the closed drum routes.`);
}

function compose(score:DrumBuild):Scene {
  const scene=emptyScene(),layout=layoutFor(score),gates=new Map<number,Set<number>>();
  scene.settings={...scene.settings,bpm:score.bpm,volume:.8};
  function path(vertices:number[]) {
    for(let i=1;i<vertices.length;i++) {
      assert(topology.neighbors[vertices[i-1]].includes(vertices[i]));
      const exits=gates.get(vertices[i-1])??new Set<number>();exits.add(vertices[i]);gates.set(vertices[i-1],exits);
    }
  }
  function drum(vertex:number,hit:Hit|FillHit,role:string) {
    scene.pieces.push({id:`${score.id}-${role}-${scene.pieces.length}`,kind:'note',vertex,instrument:hit.instrument,
      degree:0,octave:4,timbre:'sine',duration:.4,level:hit.level});
  }
  path(layout.main);layout.loops.forEach(path);
  scene.pieces.push({id:`${score.id}-groove-source`,kind:'generator',vertex:layout.main[0],period:16,phase:0,reach:180,enabled:true,travel:layout.main.length-1});
  for(let repeat=0;repeat<2;repeat++)for(const hit of score.groove)drum(layout.main[1+repeat*32+hit.step],hit,'groove');
  scene.pieces.push({id:`${score.id}-feedback-source`,kind:'generator',vertex:layout.loops[0][0],period:32,
    phase:score.feedbackOffset/32,reach:180,enabled:true,travel:score.feedbackTravel});
  for(const hit of score.fill) {
    const loop=layout.loops[hit.loop];assert(hit.step>0&&hit.step<loop.length-1);drum(loop[hit.step],hit,'fill');
  }
  scene.wiring=[...gates].map(([vertex,exits])=>({vertex,exits:[...exits].sort((a,b)=>a-b)})).sort((a,b)=>a.vertex-b.vertex);
  return validateScene(labelPieces(scene));
}

const definitions:Omit<DrumBuild,'build'|'key'|'scale'|'cycleBeats'>[]=[
  {id:'DB03',name:'Trapdoor — Half-Time Build',slug:'trapdoor',genre:'Half-time / trap',bpm:160,theme:22,
    feedbackLengths:[5,7],feedbackOffset:8,feedbackTravel:25,reverse:false,
    description:'Heavy, widely spaced kicks and a half-time snare leave space for a sudden skittering hat roll. Unequal returns keep nudging the hats between the main beats; the roll shuts off and the wide pocket lands again.',
    routing:'Five- and seven-hop circuits create an interleaved hat-and-snare fill on the 93.75 ms hop grid. A 25-hop budget ends every descendant while the underlying half-time phrase keeps playing.',
    groove:[...hits('kick',[0,11,16,22,30],.7,.64),...hits('snare',[8,24],.5,.97),
      ...hits('hi-hat',[0,4,6,12,16,20,22,28],.13,.67),...hits('bongo-low',[15,31],.1),...hits('bongo-high',[7,23],.085)],
    fill:[{loop:0,step:1,instrument:'hi-hat',level:.07},{loop:1,step:2,instrument:'hi-hat',level:.06},{loop:1,step:5,instrument:'snare',level:.065}]},
];

export const DRUM_BUILDS:readonly DrumBuild[]=definitions.map(definition=>{
  const score:DrumBuild={...definition,key:0,scale:'major',cycleBeats:32,build:()=>compose(score)};return score;
});
export function drumBuildAppearance(score:DrumBuild):Appearance {
  const theme=LOOK_THEMES.find(t=>t.id===score.theme);assert(theme);
  return applyLookTheme({...DEFAULT_APPEARANCE,lighting:.9,size:1,sparkStyle:'white'},theme);
}
