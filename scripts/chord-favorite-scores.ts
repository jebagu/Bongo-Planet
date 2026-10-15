import layouts from '../assets/wraparound-layouts.json' with {type:'json'};
import {readFileSync} from 'node:fs';
import {emptyScene, newPiece, validateScene, type Generator, type Scene} from '../src/core/contracts';
import {type Instrument, isPercussion} from '../src/core/instruments';
import {labelPieces} from '../src/core/pieceLabels';
import {SONG_WALKS} from '../src/core/songbook';
import {CLASSIC_SONGS} from '../src/core/classics';
import {GAME_THEMES} from '../src/core/gameThemes';
import {TETRIS_MELODY} from '../src/core/tetris';
import {DEFAULT_APPEARANCE, type Appearance} from '../src/view/art/appearance';
import {applyLookTheme, LOOK_THEMES} from '../src/view/art/themes';
import {spatialArrangement} from '../src/core/spatialArrangement';

type Phrase = readonly (readonly [pitch:number|null,ticks:number])[];
type Tone = {pitch:number;octave:number;instrument:Instrument;ticks:number;level:number;role:string};
type Chord = readonly [number,number,number];
export interface ChordFavorite {
  id:string;name:string;slug:string;sourceId?:string;bpm:number;key:number;scale:'major'|'minor';cycleBeats:number;
  description:string;arrangement:string;source?:string;theme:22|25;build:()=>Scene;
}
const mod=(pitch:number)=>((pitch%7)+7)%7;

/** Written cells are simultaneous stacks. Empty cells keep their musical time. */
class Lane {
  readonly cells=new Map<number,Tone[]>();
  constructor(readonly steps:number,readonly period:Generator['period'],readonly offset=0){}
  note(step:number,pitch:number,octave:number,instrument:Instrument,ticks:number,level:number,role='lead') {
    if(!Number.isInteger(step)||step<0||step>=this.steps)throw Error(`Note outside lane: ${step}/${this.steps}`);
    const cell=this.cells.get(step)??[];
    if(cell.length===4)throw Error(`More than four voices at step ${step}`);
    cell.push({pitch,octave,instrument,ticks,level,role});this.cells.set(step,cell);return this;
  }
  melody(phrase:Phrase,instrument:Instrument,octave:number,level:number,stretch=1,legato=.92) {
    let step=0,index=0;
    for(const [pitch,length] of phrase) {
      const ticks=length*stretch;
      if(pitch!==null) {
        const arc=.87+.13*Math.sin(index/Math.max(1,phrase.length-1)*Math.PI);
        const accent=step%8===0?1.05:step%4===3?.91:1;
        this.note(step,pitch,octave,instrument,ticks*legato,level*arc*accent);
        index++;
      }
      step+=ticks;
    }
    return step;
  }
  chord(step:number,pitches:readonly number[],octave:number,instruments:readonly Instrument[],ticks:number,level:number,role='chord') {
    pitches.forEach((pitch,i)=>this.note(step,pitch,octave,instruments[i%instruments.length],ticks,level*[1,.86,.73,.68][i],role));
  }
  drum(step:number,instrument:Instrument,level:number) {this.note(step,0,4,instrument,1,level,'rhythm');}
}

function compile(id:string,bpm:number,key:number,scale:'major'|'minor',lanes:Lane[],volume=.72):Scene {
  const scene=emptyScene();scene.settings={...scene.settings,bpm,key,scale,volume};
  const walk=SONG_WALKS[92];let cursor=0;
  for(const [laneIndex,lane] of lanes.entries()) {
    const path=walk.slice(cursor,cursor+lane.steps+1);cursor+=lane.steps+1;
    if(path.length!==lane.steps+1)throw Error(`${id}: routes exceed the planet`);
    scene.pieces.push({...newPiece('generator',path[0],`${id}-source-${laneIndex}`),period:lane.period,phase:lane.offset/lane.period,travel:lane.steps,reach:180});
    path.forEach((vertex,index)=>scene.wiring!.push({vertex,exits:index<lane.steps?[path[index+1]]:[]}));
    for(const [step,tones] of [...lane.cells].sort((a,b)=>a[0]-b[0])) {
      const ordered=[...tones].sort((a,b)=>Number(isPercussion(b.instrument))-Number(isPercussion(a.instrument))||(a.octave*7+a.pitch)-(b.octave*7+b.pitch));
      for(const [layer,tone] of ordered.entries()) {
        scene.pieces.push({...newPiece('note',path[step+1],`${id}-${tone.role}-${laneIndex}-${step}-${layer}`),instrument:tone.instrument,
          degree:mod(tone.pitch),octave:tone.octave+Math.floor(tone.pitch/7),duration:Math.min(8,Math.max(.05,tone.ticks*15/bpm)),level:tone.level});
      }
    }
  }
  return spatialArrangement(validateScene(labelPieces(scene)),id);
}

function canon() {
  const lane=new Lane(64,16);
  lane.melody([[9,8],[8,8],[7,8],[6,8],[5,8],[4,8],[5,8],[6,8]],'piano',4,.49,1,1.04);
  const bass=[0,-3,-2,-5,-4,-7,-4,-3];
  const inner=[[2,4],[6,8],[7,9],[4,6],[5,7],[4,9],[3,7],[6,8]];
  const roots=[0,4,5,2,3,0,3,4];
  for(let i=0;i<8;i++) {
    const step=i*8;
    lane.note(step,bass[i],3,'guitar',7.6,.28,'bass');
    lane.chord(step,inner[i],3,['piano','glass'],7.3,.19);
    for(const [j,offset] of [2,4,6].entries())lane.note(step+offset,roots[i]+[2,4,7][j],3,'kalimba',2.7,.17*[.86,1,.78][j],'answer');
    lane.drum(step+7,i%2?'bongo-high':'bongo-low',i===7?.07:.045);
  }
  return compile('C01',80,2,'major',[lane]);
}

function ensemble() {
  const left=new Lane(32,8),right=new Lane(32,8,4);
  const roots=[0,5,1,4],upper=[[2,4,6],[2,4,7],[3,5,7],[3,6,8]];
  for(let i=0;i<4;i++) {
    const step=i*8,root=roots[i];
    left.note(step,root,3,'guitar',6.7,.29,'bass');
    left.chord(step,upper[i],3,['piano','kalimba','glass'],6.4,.22);
    left.note(step+3,root+7,3,'marimba',1.7,.24);
    left.note(step+6,root+9,3,'kalimba',2.1,.19,'answer');
    left.drum(step+2,'hi-hat',.06);left.drum(step+7,'bongo-low',.10);
    const harmony=(i+2)%4,r=roots[harmony];
    right.chord(step,upper[harmony],4,['glass','piano','kalimba'],5.8,.12);
    right.note(step+2,r+4,3,'guitar',2.3,.20,'answer');
    right.note(step+5,r+7,3,'marimba',1.7,.21);
    right.drum(step+7,'bongo-high',.09);
  }
  return compile('C02',100,0,'major',[left,right]);
}

function airy() {
  const scene=JSON.parse(readFileSync('public/fixtures/A01.json','utf8')) as Scene;
  scene.pieces.forEach(p=>{p.id=`C03-${p.id}`;if(p.kind==='note'&&!isPercussion(p.instrument)){p.level*=.86;p.duration=Math.min(4.8,p.duration);}});
  const add=(vertex:number,pitches:number[],octave:number,instruments:Instrument[],level:number,duration=3.6)=>pitches.forEach((pitch,i)=>scene.pieces.push({
    ...newPiece('note',vertex,`C03-pad-${vertex}-${i}`),instrument:instruments[i%instruments.length],degree:mod(pitch),octave:octave+Math.floor(pitch/7),duration,level:level*[1,.78,.64][i],
  }));
  add(4,[0,4],3,['guitar','piano'],.095,4.2);
  add(31,[1,6],3,['kalimba','piano'],.075,4.0);
  add(44,[2,7],3,['piano','glass'],.072,3.8);
  add(64,[4,9],3,['guitar','piano'],.07,3.7);
  add(52,[4,6,8],3,['piano','guitar','kalimba'],.035,3.1);
  add(90,[0,2,4],3,['piano','guitar','kalimba'],.035,3.3);
  add(53,[4,9],3,['piano','glass'],.034,3.2);
  add(73,[1,3],4,['kalimba','piano'],.04,3.4);
  scene.settings.volume=.72;
  return spatialArrangement(validateScene(labelPieces(scene)),'C03');
}

function finalFantasy() {
  const lane=new Lane(64,16);
  const phrase=GAME_THEMES.find(song=>song.id==='S44')!.melody;
  lane.melody([...phrase,...phrase],'piano',2,.43,1,2.5);
  const harmony=[[0,4,9],[0,5,9],[-2,3,7],[-3,3,6]];
  for(let i=0;i<4;i++) {
    const step=i*16;
    lane.chord(step,harmony[i],3,['guitar','glass','kalimba'],15.2,.17);
    lane.note(step+10,harmony[i][2]+7,3,'glass',9,.10,'answer');
    lane.note(step+14,harmony[i][1]+7,3,'kalimba',3,.10,'answer');
  }
  return compile('C04',96,0,'major',[lane],.76);
}

const descents=[
  [38,40,8,5,7,4,0,22,16,25,26,27,52,54],
  [38,87,35,34,32,31,12,60,21,58,56,55,90,53],
  [38,41,42,88,43,44,45,47,78,89,49,50,52,54],
  [38,66,68,65,67,64,61,79,74,81,82,83,90,53],
];
function northPole() {
  const original=JSON.parse(readFileSync('public/fixtures/N02.json','utf8')) as Scene;
  const scene=emptyScene();scene.settings={...original.settings,volume:.73};scene.wiring=original.wiring;
  scene.pieces=[{...original.pieces.find(p=>p.kind==='generator')!,id:'C05-source'}];
  // Cmaj9 → Am9 → Fmaj9 → G9, with one inversion and register per meridian.
  const voices:Chord[][]=[
    [[4,7,9],[4,7,9],[3,5,7],[1,4,6]],
    [[0,2,4],[-2,0,2],[-4,-2,0],[-3,-1,1]],
    [[2,4,6],[0,2,4],[-2,0,2],[-1,1,3]],
    [[4,6,8],[2,4,6],[0,2,4],[1,3,5]],
  ];
  const instruments:Instrument[]=['piano','guitar','kalimba','glass'];
  for(let branch=0;branch<4;branch++) for(let group=0;group<4;group++) {
    const step=1+group*3,vertex=descents[branch][step],chord=voices[branch][group];
    for(let layer=0;layer<3;layer++) {
      const pitch=chord[layer],octave=branch===1?3:4;
      scene.pieces.push({...newPiece('note',vertex,`C05-chord-${branch}-${group}-${layer}`),instrument:instruments[branch],degree:mod(pitch),octave:octave+Math.floor(pitch/7),duration:1.65,level:[.13,.12,.105,.085][branch]*[1,.88,.74][layer]});
    }
    const pitch=chord[(group+branch)%3]+(branch===3?0:7),answerVertex=descents[branch][step+1];
    scene.pieces.push({...newPiece('note',answerVertex,`C05-answer-${branch}-${group}`),instrument:instruments[(branch+2)%4],degree:mod(pitch),octave:(branch===1?3:4)+Math.floor(pitch/7),duration:.85,level:branch===3?.065:.09});
  }
  for(const [i,vertex] of [52,54,90,53].entries())scene.pieces.push({...newPiece('note',vertex,`C05-cadence-${i}`),instrument:i%2?'guitar':'glass',degree:[1,4,3,4][i],octave:i%2?3:4,duration:2.2,level:.055});
  return validateScene(labelPieces(scene));
}

function tetris() {
  const lane=new Lane(91,24);
  lane.melody(TETRIS_MELODY,'piano',4,.50,1,.82);
  const changes=[{step:0,root:4},{step:8,root:0},{step:24,root:0},{step:32,root:3},{step:40,root:0},{step:48,root:4},{step:56,root:0},{step:64,root:4},{step:80,root:0}];
  for(const {step,root} of changes) {
    lane.note(step,root,2,'guitar',5.6,.30,'bass');
    lane.chord(step,[root+2,root+4],3,['marimba','kalimba'],3.3,.18);
  }
  for(const step of [14,30,46,62])lane.drum(step,'bongo-high',.08);
  lane.chord(90,[0,2],3,['guitar','glass'],7.7,.19,'cadence');
  return compile('C06',75,9,'minor',[lane],.75);
}

function bach() {
  const lane=new Lane(64,16);
  const bars=[
    [0,2,4,7,9,4,7,9], [0,1,5,8,10,5,8,10],
    [-1,1,4,8,10,4,8,10], [0,2,4,7,9,4,7,9],
  ];
  bars.forEach((bar,index)=>{
    [...bar,...bar].forEach((pitch,i)=>lane.note(index*16+i,pitch,4,'piano',2.5,.32*(i%8===0?1.12:i%8===4?1:.84)));
    // A held foundation plus two inner voices, voiced under the arpeggio.
    const supporting=[[0,4,9],[0,5,10],[-1,4,10],[0,4,9]][index];
    lane.chord(index*16,supporting,3,['guitar','glass','kalimba'],14.8,.16);
  });
  return compile('C07',80,0,'major',[lane],.79);
}

function ode() {
  const lane=new Lane(64,16);
  const melody:Phrase=[
    [2,2],[2,2],[3,2],[4,2],[4,2],[3,2],[2,2],[1,2],
    [0,2],[0,2],[1,2],[2,2],[2,3],[1,1],[1,4],
    [2,2],[2,2],[3,2],[4,2],[4,2],[3,2],[2,2],[1,2],
    [0,2],[0,2],[1,2],[2,2],[1,3],[0,1],[0,4],
  ];
  lane.melody(melody,'piano',4,.48,1,.98);
  const voicings=[[0,4,9],[4,8,13],[0,4,9],[4,8,10],[0,4,9],[4,8,13],[3,7,12],[0,4,9]];
  for(let bar=0;bar<8;bar++) {
    const step=bar*8;
    lane.chord(step,voicings[bar],2,['guitar','piano','glass'],7.4,.23*(bar>3?1.06:.9));
    lane.note(step+5,voicings[bar][1],3,'kalimba',2.4,.13,'answer');
    if(bar%2===1)lane.drum(step+7,'bongo-low',.07);
  }
  return compile('C08',60,0,'major',[lane],.78);
}

function mozart() {
  const lane=new Lane(64,16),song=CLASSIC_SONGS.find(s=>s.id==='S35')!;
  lane.melody(song.melody,'marimba',4,.47,2,.73);
  const roots=[0,0,0,0,4,4,4,4];
  for(let bar=0;bar<8;bar++) {
    const step=bar*8,root=roots[bar];
    lane.chord(step,[root,root+9,root+11],2,['piano','guitar','kalimba'],bar%2?3.3:5.1,.25);
    lane.note(step+4,root+4,3,'guitar',1.8,.20,'answer');
    if((lane.cells.get(step+6)?.length??0)<2)lane.chord(step+6,[root+2,root+4],3,['piano','kalimba'],1.3,.14,'answer');
  }
  return compile('C09',100,7,'major',[lane],.75);
}

function swanLake() {
  const lane=new Lane(64,16),song=CLASSIC_SONGS.find(s=>s.id==='S37')!;
  lane.melody(song.melody,'glass',4,.40,2,1.02);
  const voicings=[[0,9,11],[0,9,11],[-1,8,11],[0,9,11],[3,10,12],[3,10,12],[4,8,10],[0,9,11]];
  for(let i=0;i<8;i++) {
    const step=i*8;
    lane.note(step,voicings[i][0],3,'guitar',7.8,.24,'bass');
    lane.chord(step,voicings[i].slice(1),2,['piano','kalimba'],7.8,.24*.86);
    lane.note(step+5,voicings[i][2],3,'piano',4.7,.14,'answer');
    if(i===3||i===7)lane.drum(step+7,'bongo-low',.055);
  }
  return compile('C10',64,9,'minor',[lane],.78);
}

function scarborough() {
  const lane=new Lane(48,12);
  // The opening eight 3/4 measures: two hops per notated quarter. Preserve
  // the dotted rhythm, the breath before phrase two, and its Dorian B natural.
  const melody:Phrase=[[1,4],[1,2],[5,4],[5,2],[2,3],[3,1],[2,2],[1,6],
    [null,2],[5,2],[7,2],[8,4],[7,2],[5,2],[6,2],[4,2],[5,6]];
  lane.melody(melody,'guitar',4,.46,1,1.02);
  const harmony=[[1,3,5],[1,3,5],[0,4,9],[1,3,5],[3,5,7],[0,4,9],[4,8,10],[1,3,5]];
  for(let i=0;i<8;i++) {
    const step=i*6;
    lane.chord(step,harmony[i],3,['piano','kalimba','glass'],5.7,.19);
    if(!(lane.cells.get(step+4)?.length))lane.note(step+4,harmony[i][1]+7,3,'kalimba',1.8,.11,'answer');
    if(i%2===1)lane.drum(step+5,'bongo-high',.055);
  }
  return compile('C11',50,0,'major',[lane],.79);
}

function avril14th() {
  const lane=new Lane(64,32);
  // The four-measure opening leads to a new passage and a shortened return.
  // Keep the original A-flat pitches and the F tied across each odd barline.
  const melody=[
    [0,2,4.15,.34],[4,-2,3.75,.27],[8,0,5.8,.36],[14,0,.72,.24],[15,-2,7.2,.29],
    [22,-2,2.05,.26],[24,2,2.1,.35],[26,1,1.85,.31],[28,0,1.8,.28],[30,-2,2.15,.235],
    [32,2,4.25,.445],[36,-2,3.85,.34],[40,0,5.95,.46],[46,0,.7,.29],[47,-2,7.25,.35],
    [54,-2,2.05,.285],[56,2,2.25,.37],[58,1,2.05,.315],[60,0,1.9,.27],[62,-2,3.15,.22],
  ];
  for(const [step,pitch,ticks,level] of melody)lane.note(step,pitch,4,'piano',ticks,level);
  const left=[[0,5,7,9,2,7,9,11],[3,7,10,11,1,7,10,9]];
  const touch=[.17,.105,.13,.155,.145,.10,.125,.115],arc=[.9,.8,1.18,.85];
  for(let bar=0;bar<4;bar++)for(const [eighth,pitch] of left[bar%2].entries())
    lane.note(bar*16+eighth*2,pitch,2,'piano',eighth===0?7.2:eighth===4?3.8:2.15+(eighth%3)*.22,touch[eighth]*arc[bar],'bass');
  for(const start of [0,32]) {
    const swell=start===32?1.2:1;
    for(const [step,voices,ticks] of [[0,[5,7],7.3],[8,[4,7],6.8],[16,[5,7],7.5],[24,[3,5],5.8]] as const)
      lane.chord(start+step,voices,2,['piano','guitar'],ticks,.078*swell,'chord');
    // A quiet plucked inner voice answers in the spaces, with a stronger reply
    // in the third measure and a falling release into the last F.
    for(const [step,pitch,ticks,level] of [[10,4,2.8,.065],[26,7,2.6,.055]])
      lane.note(start+step,pitch,3,'guitar',ticks,level*swell,'answer');
  }
  lane.note(34,2,5,'glass',2.8,.045,'halo');
  lane.note(42,0,5,'glass',3.8,.04,'halo');
  // D-flat, B-flat minor and a suspended E-flat dominant broaden the harmony.
  // The last D-flat resolves down to C as the familiar opening returns.
  // Firmer downbeats and clipped releases make this passage step forward;
  // a low marimba attack adds definition beneath the piano.
  const bridge=new Lane(27,32,16);
  for(const [step,pitch,ticks,level] of [[0,3,2.7,.52],[4,2,2.5,.39],[8,1,2.6,.50],[12,0,2.4,.36],[16,4,6.3,.58],[24,3,2.6,.41]])
    bridge.note(step,pitch,4,'piano',ticks,level,'bridge-lead');
  for(const [step,pitch,ticks,level] of [[0,3,6.3,.19],[8,1,6.2,.20],[16,4,6.6,.22],[24,0,4.8,.18]])
    bridge.note(step,pitch,2,'piano',ticks,level,'bridge-bass');
  bridge.chord(0,[5,7],2,['marimba','guitar'],6.1,.095,'bridge-chord');
  bridge.chord(8,[10,12],2,['guitar','marimba'],6.0,.085,'bridge-chord');
  bridge.chord(16,[8,10],2,['marimba','guitar'],6.3,.095,'bridge-chord');

  const scene=emptyScene(),ring=layouts.C12.paths[0];
  scene.settings={...scene.settings,bpm:80,key:8,scale:'major',volume:.84};
  scene.wiring=ring.map((vertex,index)=>({vertex,exits:[ring[(index+1)%ring.length]]}));
  // Two finite launches hand off at beat 16. The second crosses the new passage,
  // reuses the opening's first two measures, and ends a beat before the next cycle.
  scene.pieces.push({...newPiece('generator',ring[0],'C12-source-0'),period:32,phase:0,travel:64,reach:180});
  scene.pieces.push({...newPiece('generator',ring[64],'C12-source-1'),period:32,phase:.5,travel:60,reach:180});
  for(const [section,offset,index] of [[lane,0,0],[bridge,64,1]] as const)
    for(const [step,tones] of [...section.cells].sort((a,b)=>a[0]-b[0]))
      for(const [layer,tone] of [...tones].sort((a,b)=>(a.octave*7+a.pitch)-(b.octave*7+b.pitch)).entries())
        scene.pieces.push({...newPiece('note',ring[offset+step+1],`C12-${tone.role}-${index}-${step}-${layer}`),instrument:tone.instrument,
          degree:mod(tone.pitch),octave:tone.octave+Math.floor(tone.pitch/7),duration:Math.min(8,Math.max(.05,tone.ticks*15/80)),level:tone.level});
  return validateScene(labelPieces(scene));
}

export const CHORD_FAVORITES: readonly ChordFavorite[]=[
  {id:'C01',name:'Pachelbel’s Canon',slug:'canon-chords',sourceId:'S13',bpm:80,key:2,scale:'major',cycleBeats:16,theme:25,build:canon,
    description:'A warm piano canon over its descending ground, open guitar bass and glowing inner voices.',arrangement:'Eight carefully inverted four-voice stacks follow D–A–Bm–F♯m–G–D–G–A. Quiet kalimba counterlines fill the spaces; the soprano stays legato.'},
  {id:'C02',name:'Toy Ensemble',slug:'toy-ensemble-chords',sourceId:'F10',bpm:100,key:0,scale:'major',cycleBeats:8,theme:22,build:ensemble,
    description:'A playful two-generator conversation between all five melodic toys.',arrangement:'Two finite lanes trade Cmaj7, Am7, Dm7 and G7 voicings, with the second lane entering four beats later. Marimba and kalimba answers dance around soft hand percussion.'},
  {id:'C03',name:'Airy Loops',slug:'airy-loops-chords',sourceId:'A01',bpm:40,key:9,scale:'minor',cycleBeats:16,theme:22,build:airy,
    description:'The original slow orbital waves, now breathing through restrained minor-nine and major-seven stacks.',arrangement:'The five sources, 72 gates and staggered entries remain; eight harmonically chosen nodes gain low roots and upper extensions. Shared bottom arrivals use half-level voicings.'},
  {id:'C04',name:'Final Fantasy — Prelude',slug:'final-fantasy-chords',sourceId:'R-S44',bpm:96,key:0,scale:'major',cycleBeats:16,theme:25,build:finalFantasy,
    description:'The rising and falling added-ninth arpeggio floats over four broad, suspended chord beds.',arrangement:'Two complete arpeggio arches are carried by overlapping piano, with Cadd9, Am7, Fmaj9 and G7 colors in guitar, glass and kalimba. Long upper echoes connect the register changes.'},
  {id:'C05',name:'North Pole Loop',slug:'north-pole-chords',sourceId:'N02',bpm:40,key:0,scale:'major',cycleBeats:6,theme:22,build:northPole,
    description:'Four descending choirs of instruments, then a quiet return to the pole.',arrangement:'Sixteen three-note stacks voice Cmaj9 → Am9 → Fmaj9 → G9 across four registers and timbres. Empty breaths separate the changes; the original 24-hop meridians and silent returns remain.'},
  {id:'C06',name:'Tetris — Type A (Korobeiniki)',slug:'tetris-chords',sourceId:'S43',bpm:75,key:9,scale:'minor',cycleBeats:24,theme:22,build:tetris,
    description:'The complete main strain and compact bridge, with a dancing low-string chord accompaniment.',arrangement:'The original melody and 24-beat form remain intact. Guitar roots, marimba/kalimba inner parts and a final held A-minor stack replace the constant percussion filling.'},
  {id:'C07',name:'Prelude in C Major · Bach',slug:'bach-prelude-chords',bpm:80,key:0,scale:'major',cycleBeats:16,theme:25,build:bach,
    description:'Four luminous opening measures of BWV 846, with piano ripple and a held harmonic foundation.',arrangement:'The written C, Dm7/C, G7/B and C arpeggios keep their bass inversions. Guitar, glass and kalimba quietly hold the inner harmony while the piano keeps moving.',source:'https://www.mutopiaproject.org/ftp/BachJS/BWV846/wtk1-prelude1/'},
  {id:'C08',name:'Ode to Joy · Beethoven',slug:'ode-to-joy-chords',bpm:60,key:0,scale:'major',cycleBeats:16,theme:25,build:ode,
    description:'A full eight-bar opening theme, shaped as a warm, growing miniature chorale.',arrangement:'Piano sings above guitar roots and held inner voices; small kalimba replies and almost whispered low bongos support the cadence. Two hops represent a notated quarter, giving a 120 BPM feel.',source:'https://www.mutopiaproject.org/ftp/BeethovenLv/ode/'},
  {id:'C09',name:'Eine kleine Nachtmusik · Mozart',slug:'nachtmusik-chords',bpm:100,key:7,scale:'major',cycleBeats:16,theme:22,build:mozart,
    description:'The famous fanfare as a crisp plucked chamber ensemble, with ringing answers.',arrangement:'Marimba leads; piano, guitar and kalimba form clipped tonic and dominant stacks. Accents and short releases leave room for the dotted rhythms.'},
  {id:'C10',name:'Swan Lake · Tchaikovsky',slug:'swan-lake-chords',bpm:64,key:9,scale:'minor',cycleBeats:16,theme:25,build:swanLake,
    description:'A broad glass melody over dark piano harmony and a low guitar foundation.',arrangement:'Sustained minor voicings, a moving bass and high piano echoes shape the opening swan theme. The natural-minor collection keeps the dark dominant as a modal adaptation.'},
  {id:'C11',name:'Scarborough Fair · Traditional',slug:'scarborough-fair-chords',bpm:50,key:0,scale:'major',cycleBeats:12,theme:22,build:scarborough,
    description:'A D-Dorian guitar ballad with glass suspensions and delicate thumb-piano replies.',arrangement:'The opening eight 3/4 measures keep their dotted rhythm and breathing space, with D-minor, C, F and suspended G voicings. Two hops per notated quarter give a gentle 100 BPM waltz feel. The D-Dorian pitches use the C-major note collection.',source:'https://camdenmusic.org/ks1-zoom-scarborough-fair/'},
  {id:'C12',name:'Avril 14th · Aphex Twin',slug:'avril-14th-chords',bpm:80,key:8,scale:'major',cycleBeats:32,theme:25,build:avril14th,
    description:'An expressive piano opening opens into a punchier middle with firm accents and marimba chord attacks, then returns softly.',arrangement:'An eight-measure instrumental arrangement keeps the shaped piano touch, tied melody, soft chord voices and glass harmonics. A D-flat/B-flat-minor passage rises through an E-flat suspended dominant with stronger piano downbeats, shorter releases and low marimba accents before returning to the gentle opening theme. Two finite spark sources hand off halfway through a 32-beat, 24-second form at the same 80 BPM, ending with a short breath before the next cycle.',source:'https://www.musicnotes.com/sheetmusic/aphex-twin/avril-14th/MN0099542'},
];

export function chordFavoriteAppearance(song:ChordFavorite):Appearance {
  return applyLookTheme({...DEFAULT_APPEARANCE,size:song.id==='C05'?.8:.86,lighting:.92,sparkStyle:song.id==='C02'||song.id==='C06'?'ember':'white'},LOOK_THEMES.find(t=>t.id===song.theme)!);
}
