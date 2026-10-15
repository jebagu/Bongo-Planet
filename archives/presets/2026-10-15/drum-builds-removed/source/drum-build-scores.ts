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
  {id:'DB01',name:'Pressure Cooker — House Build',slug:'pressure-cooker',genre:'House',bpm:120,theme:22,
    feedbackLengths:[7,9],feedbackOffset:8,feedbackTravel:33,reverse:false,
    description:'A firm house kick and light offbeat hats hold their place while quiet snare and hand-drum replies begin to stack. The rolls tighten into a small rush, then drop away to reveal the same clean dance groove.',
    routing:'Two return circuits of seven and nine hops begin on beat eight. Returning sparks split again until their shared 33-hop budget ends the fill; the independent four-bar groove continues throughout.',
    groove:[...hits('kick',[0,4,8,12,16,20,24,28],.66,.92),...hits('snare',[4,12,20,28],.39,.94),
      ...hits('hi-hat',[2,6,10,14,18,22,26,30],.15,.9),...hits('bongo-low',[7,23],.13),...hits('bongo-high',[15,31],.12)],
    fill:[{loop:0,step:2,instrument:'snare',level:.095},{loop:1,step:1,instrument:'bongo-high',level:.11},{loop:1,step:6,instrument:'bongo-low',level:.075}]},
  {id:'DB02',name:'Rubber Staircase — Bongo Build',slug:'rubber-staircase',genre:'Afrobeat / hand drums',bpm:100,theme:25,
    feedbackLengths:[5,6,8],feedbackOffset:12,feedbackTravel:18,reverse:true,
    description:'A loping, syncopated kick supports a conversation between low and high bongos. Three differently timed return lanes turn that conversation into a rolling hand-drum cascade, then leave the original pocket intact.',
    routing:'Five-, six- and eight-hop circuits meet at one three-way fork. They enter after three bars, add offset copies to the rhythm, and stop at an 18-hop limit before the relaxed groove returns.',
    groove:[...hits('kick',[0,6,10,16,22,27],.58,.82),...hits('snare',[4,12,20,28],.26,.9),
      ...hits('hi-hat',[2,10,18,26],.12),...hits('bongo-low',[1,7,17,24],.28,.68),...hits('bongo-high',[5,14,21,30],.3,.72)],
    fill:[{loop:0,step:1,instrument:'bongo-low',level:.105},{loop:1,step:2,instrument:'bongo-high',level:.115},{loop:2,step:4,instrument:'snare',level:.065}]},
  {id:'DB03',name:'Trapdoor — Half-Time Build',slug:'trapdoor',genre:'Half-time / trap',bpm:160,theme:22,
    feedbackLengths:[5,7],feedbackOffset:8,feedbackTravel:25,reverse:false,
    description:'Heavy, widely spaced kicks and a half-time snare leave space for a sudden skittering hat roll. Unequal returns keep nudging the hats between the main beats; the roll shuts off and the wide pocket lands again.',
    routing:'Five- and seven-hop circuits create an interleaved hat-and-snare fill on the 93.75 ms hop grid. A 25-hop budget ends every descendant while the underlying half-time phrase keeps playing.',
    groove:[...hits('kick',[0,11,16,22,30],.7,.64),...hits('snare',[8,24],.5,.97),
      ...hits('hi-hat',[0,4,6,12,16,20,22,28],.13,.67),...hits('bongo-low',[15,31],.1),...hits('bongo-high',[7,23],.085)],
    fill:[{loop:0,step:1,instrument:'hi-hat',level:.07},{loop:1,step:2,instrument:'hi-hat',level:.06},{loop:1,step:5,instrument:'snare',level:.065}]},
  {id:'DB04',name:'Loose Wheel — Breakbeat Build',slug:'loose-wheel',genre:'Breakbeat',bpm:144,theme:25,
    feedbackLengths:[5,7,9],feedbackOffset:16,feedbackTravel:20,reverse:true,
    description:'A broken kick line, solid backbeat and little ghost notes run cleanly for the first half. Three returning streams then kick up a snare-and-bongo tumble, resolve together, and hand the rhythm back to the original break.',
    routing:'Three unequal circuits enter on beat 16, producing a late rolling crest. Five-, seven- and nine-hop returns rebranch for 20 hops, after which the fill is silent and the main break stays unchanged.',
    groove:[...hits('kick',[0,6,10,15,16,22,25,30],.64,.68),...hits('snare',[4,12,20,28],.47,.93),
      ...hits('snare',[7,19,27,31],.08,.75),...hits('hi-hat',[0,2,6,8,10,14,16,18,22,24,26,30],.14,.82),
      ...hits('bongo-low',[3,23],.15),...hits('bongo-high',[13,29],.13)],
    fill:[{loop:0,step:1,instrument:'snare',level:.085},{loop:1,step:3,instrument:'bongo-high',level:.095},{loop:2,step:5,instrument:'hi-hat',level:.055}]},
  {id:'DB05',name:'White Knuckle — Techno Build',slug:'white-knuckle',genre:'Fast techno',bpm:180,theme:22,
    feedbackLengths:[6,9],feedbackOffset:8,feedbackTravel:29,reverse:false,
    description:'A fast quarter-note kick drives a deliberately uncluttered techno pulse. Tight hats and low wooden knocks multiply into an urgent burst, then snap back to the steady kick and open space.',
    routing:'Six- and nine-hop return circuits turn a small seed into a fast fill at 83.3 ms per hop. The 29-hop limit makes the peak finite; the next half of the 32-beat cycle returns to the normal groove.',
    groove:[...hits('kick',[0,4,8,12,16,20,24,28],.65,.94),...hits('snare',[4,12,20,28],.3,.95),
      ...hits('hi-hat',[2,6,10,14,18,22,26,30],.14,.85),...hits('bongo-low',[7,23],.13),...hits('bongo-high',[15,31],.1)],
    fill:[{loop:0,step:1,instrument:'hi-hat',level:.065},{loop:1,step:4,instrument:'bongo-low',level:.105},{loop:1,step:7,instrument:'snare',level:.07}]},
];

export const DRUM_BUILDS:readonly DrumBuild[]=definitions.map(definition=>{
  const score:DrumBuild={...definition,key:0,scale:'major',cycleBeats:32,build:()=>compose(score)};return score;
});
export function drumBuildAppearance(score:DrumBuild):Appearance {
  const theme=LOOK_THEMES.find(t=>t.id===score.theme);assert(theme);
  return applyLookTheme({...DEFAULT_APPEARANCE,lighting:.9,size:1,sparkStyle:'white'},theme);
}
