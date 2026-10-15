import { emptyScene, newPiece, validateScene, type Generator, type Scene } from './contracts';
import type { Instrument } from './instruments';
import { SONG_WALKS } from './songbook';
import { tetrisSongScene } from './tetris';

type Phrase = readonly (readonly [pitch: number | null, ticks: number])[];
type Style = 'ballad' | 'soul' | 'dance' | 'rock' | 'baroque' | 'chamber' | 'nocturne' | 'jazz';
export interface ClassicSong {
  id: string;
  title: string;
  artist: string;
  genre: 'Pop' | 'Rock' | 'Classical' | 'Jazz' | 'Video game';
  nodes: number;
  bpm: number;
  key: number;
  scale: 'major' | 'minor';
  period: 6 | 8 | 24;
  meter: string;
  lead: Instrument;
  leadOctave: number;
  bass: Instrument;
  accompaniment: Instrument;
  style: Style;
  roots: readonly number[];
  bassRoots?: readonly number[];
  melody: Phrase;
  description: string;
  source?: string;
}
const eighths = (...pitches: number[]): Phrase => pitches.map(pitch => [pitch,2]);
const sixteenths = (...pitches: number[]): Phrase => pitches.map(pitch => [pitch,1]);
const twice = (phrase: Phrase): Phrase => [...phrase,...phrase];

/** Short instrumental hook arrangements. Chromatic bridge/solo passages are
 * deliberately outside these excerpts: the saved planet has one diatonic scale.
 * Roots describe this excerpt's harmony, not an unrelated generic backing loop.
 */
export const CLASSIC_SONGS: readonly ClassicSong[] = [
  {id:'S21',title:'Let It Be',artist:'The Beatles',genre:'Pop',nodes:84,bpm:78,key:0,scale:'major',period:8,meter:'4/4',lead:'piano',leadOctave:4,bass:'guitar',accompaniment:'glass',style:'ballad',roots:[5,4,3,0],
    melody:[[9,1],[8,1],[7,6],[9,1],[11,1],[12,6],[11,1],[11,1],[9,2],[8,2],[7,2],[5,2],[4,2],[9,4]],description:'The familiar chorus on piano, supported by the Am–G–F–C descent and soft sustained glass.',source:'https://www.pianokeyboardnotes.com/let-it-be-the-beatles-piano.html'},
  {id:'S22',title:'Stand by Me',artist:'Ben E. King',genre:'Pop',nodes:86,bpm:116,key:0,scale:'major',period:8,meter:'4/4',lead:'guitar',leadOctave:3,bass:'piano',accompaniment:'kalimba',style:'soul',roots:[0,5,3,4],
    melody:[[0,3],[0,1],[4,2],[-1,2],[-2,3],[-2,1],[2,2],[-3,2],[-4,3],[-4,1],[0,2],[-5,2],[-3,3],[-3,1],[1,2],[-1,2]],description:'The walking bass hook takes the lead, with warm upper chords and restrained hand percussion.'},
  {id:'S23',title:'Billie Jean',artist:'Michael Jackson',genre:'Pop',nodes:88,bpm:117,key:6,scale:'minor',period:8,meter:'4/4',lead:'guitar',leadOctave:2,bass:'piano',accompaniment:'marimba',style:'dance',roots:[0,0,0,0],
    melody:twice(eighths(0,4,6,7,6,4,3,4)),description:'The low F-sharp bass ostinato stays out in front; short minor-chord answers and tight drums surround it.',source:'https://www.mssiah.com/files/MSSIAH_Bassline.pdf'},
  {id:'S24',title:'Take On Me',artist:'a-ha',genre:'Pop',nodes:84,bpm:166,key:9,scale:'major',period:8,meter:'4/4',lead:'marimba',leadOctave:3,bass:'piano',accompaniment:'kalimba',style:'dance',roots:[1,4,0,3],
    melody:[[5,2],[5,2],[3,2],[1,2],[1,2],[4,2],[4,2],[4,2],[6,1],[6,1],[7,1],[8,1],[7,1],[7,1],[7,2],[4,4],[3,4]],description:'The quick keyboard hook becomes a clean marimba line, with B-minor, E, A, and D underneath.',source:'https://www.pianokeyboardnotes.com/take-on-me-piano.html'},
  {id:'S25',title:'Lean on Me',artist:'Bill Withers',genre:'Pop',nodes:82,bpm:92,key:0,scale:'major',period:8,meter:'4/4',lead:'piano',leadOctave:4,bass:'guitar',accompaniment:'kalimba',style:'soul',roots:[0,3,0,4],
    melody:eighths(0,0,1,2,3,3,2,1,0,0,1,2,2,1,1,0),description:'A direct, singable piano staircase, with gospel-like chord answers and a low plucked pulse.'},
  {id:'S26',title:'Imagine',artist:'John Lennon',genre:'Pop',nodes:82,bpm:76,key:0,scale:'major',period:8,meter:'4/4',lead:'piano',leadOctave:4,bass:'guitar',accompaniment:'glass',style:'ballad',roots:[0,0,3,3],
    melody:[[4,2],[4,2],[2,2],[4,6],[6,2],[6,2],[5,16]],description:'The opening vocal phrase on piano, with the quiet C-to-F motion and a soft glass halo.',source:'https://www.pianokeyboardnotes.com/imagine-john-lennon-piano.html'},
  {id:'S27',title:'Seven Nation Army',artist:'The White Stripes',genre:'Rock',nodes:86,bpm:124,key:4,scale:'minor',period:8,meter:'4/4',lead:'guitar',leadOctave:3,bass:'piano',accompaniment:'marimba',style:'rock',roots:[0,0,0,0],
    melody:[[0,6],[0,2],[2,5],[0,3],[-1,4],[-2,8],[-3,4]],description:'The seven-note guitar riff anchors the planet, with a grounded beat and dark, sparse chord replies.'},
  {id:'S28',title:'Another One Bites the Dust',artist:'Queen',genre:'Rock',nodes:84,bpm:110,key:4,scale:'minor',period:8,meter:'4/4',lead:'guitar',leadOctave:2,bass:'piano',accompaniment:'kalimba',style:'soul',roots:[0,0,0,3],
    melody:twice([[0,2],[0,2],[0,2],[null,4],[0,2],[0,1],[2,1],[0,1],[3,1]]),description:'The bass riff keeps its stops and short notes; dry kalimba chords and a clipped backbeat leave it room.'},
  {id:'S29',title:'Sweet Child O’ Mine',artist:'Guns N’ Roses',genre:'Rock',nodes:88,bpm:125,key:6,scale:'major',period:8,meter:'4/4',lead:'guitar',leadOctave:4,bass:'piano',accompaniment:'glass',style:'rock',roots:[4,4,3,3],
    melody:eighths(-3,4,1,0,7,1,6,1,-4,4,1,0,7,1,6,1),description:'The wide, octave-jumping guitar introduction spans the sphere, with the original lowered tuning and clear bass changes.',source:'https://www.rockoutschool.com/assets/ugc/docs/sweet_child_chords_pdf.pdf'},
  {id:'S30',title:'Clocks',artist:'Coldplay',genre:'Rock',nodes:88,bpm:130,key:8,scale:'major',period:8,meter:'4/4',lead:'piano',leadOctave:4,bass:'guitar',accompaniment:'glass',style:'rock',roots:[4,4,1,1],
    melody:eighths(4,1,-1,4,1,-1,4,1,3,1,-2,3,1,-2,3,1),description:'The descending piano figure follows E-flat into B-flat minor, with broad low roots and quiet upper chord tones.',source:'https://www.piano-keyboard-guide.com/how-to-play-clocks-by-coldplay-easy-piano-tutorial-chords-and-notes/'},
  {id:'S31',title:'Nothing Else Matters',artist:'Metallica',genre:'Rock',nodes:84,bpm:84,key:4,scale:'minor',period:6,meter:'6/8',lead:'guitar',leadOctave:3,bass:'piano',accompaniment:'glass',style:'nocturne',roots:[0,0],
    melody:twice(eighths(0,4,7,9,7,4)),description:'The open-string E-minor arpeggio rolls in six, with long piano roots and very light glass answers.'},
  {id:'S32',title:'(I Can’t Get No) Satisfaction',artist:'The Rolling Stones',genre:'Rock',nodes:86,bpm:136,key:9,scale:'major',period:8,meter:'4/4',lead:'guitar',leadOctave:2,bass:'piano',accompaniment:'marimba',style:'rock',roots:[4,4,0,4],
    melody:[[1,2],[1,4],[1,2],[2,2],[3,6],[3,2],[3,2],[2,2],[2,2],[2,2],[1,2],[1,4]],description:'The insistent B–C-sharp–D guitar hook against an E dominant vamp, with clipped chord stabs and a firm beat.',source:'https://www.ethanhein.com/wp/2026/satisfaction/'},
  {id:'S33',title:'Prelude in C Major',artist:'J. S. Bach',genre:'Classical',nodes:88,bpm:94,key:0,scale:'major',period:8,meter:'4/4',lead:'piano',leadOctave:4,bass:'guitar',accompaniment:'kalimba',style:'baroque',roots:[0,1],bassRoots:[0,0],
    melody:sixteenths(0,2,4,7,9,4,7,9,0,2,4,7,9,4,7,9,0,1,5,8,10,5,8,10,0,1,5,8,10,5,8,10),description:'The first two rolling figures from BWV 846, with a held C foundation and chord tones that follow the arpeggio.'},
  {id:'S34',title:'Minuet in G',artist:'Christian Petzold',genre:'Classical',nodes:82,bpm:108,key:7,scale:'major',period:6,meter:'3/4',lead:'piano',leadOctave:4,bass:'guitar',accompaniment:'kalimba',style:'chamber',roots:[0,0],
    melody:[[4,4],[0,2],[1,2],[2,2],[3,2],[4,4],[0,4],[0,4]],description:'The familiar opening from the Anna Magdalena notebook, with a lilting three-beat accompaniment.'},
  {id:'S35',title:'Eine kleine Nachtmusik',artist:'W. A. Mozart',genre:'Classical',nodes:86,bpm:130,key:7,scale:'major',period:8,meter:'4/4',lead:'marimba',leadOctave:4,bass:'piano',accompaniment:'guitar',style:'chamber',roots:[0,0,4,4],
    melody:[[0,3],[-3,1],[0,3],[-3,1],[0,2],[2,2],[4,4],[3,3],[1,1],[3,3],[1,1],[3,2],[5,2],[6,4]],description:'The punchy opening fanfare, with short articulations, alternating bass, and answering plucked chords.'},
  {id:'S36',title:'Moonlight Sonata',artist:'Ludwig van Beethoven',genre:'Classical',nodes:86,bpm:64,key:1,scale:'minor',period:6,meter:'Triplet flow',lead:'piano',leadOctave:4,bass:'guitar',accompaniment:'glass',style:'nocturne',roots:[0,0],bassRoots:[0,-1],
    melody:sixteenths(-3,0,2,-3,0,2,-3,0,2,-3,0,2,-3,0,2,-3,0,2,-3,0,2,-3,0,2),description:'The opening C-sharp-minor triplet figure over its descending bass, with sustained glass and almost whispered percussion.'},
  {id:'S37',title:'Swan Lake',artist:'Pyotr Ilyich Tchaikovsky',genre:'Classical',nodes:84,bpm:82,key:9,scale:'minor',period:8,meter:'4/4',lead:'glass',leadOctave:4,bass:'piano',accompaniment:'guitar',style:'chamber',roots:[0,0,3,4],
    melody:[[4,4],[0,2],[1,2],[2,2],[3,2],[4,4],[2,2],[4,2],[2,2],[4,2],[7,4],[5,2],[3,2]],description:'The sweeping minor-key swan theme on glass, with a broad bass and gently moving guitar harmony.'},
  {id:'S38',title:'Fly Me to the Moon',artist:'Bart Howard',genre:'Jazz',nodes:84,bpm:112,key:0,scale:'major',period:8,meter:'4/4',lead:'piano',leadOctave:4,bass:'guitar',accompaniment:'kalimba',style:'jazz',roots:[5,1,4,0],
    melody:[[7,3],[6,1],[5,4],[4,4],[3,8],[4,2],[5,2],[7,4],[6,4]],description:'The descending jazz-standard melody, with seventh-chord voicings, soft guitar bass, and offbeat comping.'},
  {id:'S39',title:'Autumn Leaves',artist:'Joseph Kosma',genre:'Jazz',nodes:86,bpm:92,key:0,scale:'major',period:8,meter:'4/4',lead:'guitar',leadOctave:4,bass:'piano',accompaniment:'glass',style:'jazz',roots:[1,4,0,3],
    melody:[[2,1],[3,1],[4,1],[7,5],[1,1],[2,1],[3,1],[6,5],[0,1],[1,1],[2,1],[5,5],[-1,1],[0,1],[1,1],[4,5]],description:'The falling sequence moves through D minor, G, C, and F, with low piano and warm glass sevenths.'},
  {id:'S40',title:'In the Mood',artist:'Joe Garland / Glenn Miller',genre:'Jazz',nodes:88,bpm:152,key:5,scale:'major',period:8,meter:'Swing 4/4',lead:'marimba',leadOctave:3,bass:'piano',accompaniment:'guitar',style:'jazz',roots:[4,4,0,4],
    melody:twice([[4,3],[6,1],[8,3],[9,1],[10,3],[9,1],[8,3],[6,1]]),description:'The famous rising and falling riff gets a 3:1 swing pulse, a walking foundation, and short guitar chords.'},
];

interface Voice {instrument: Instrument;pitch: number;octave: number;ticks: number;level: number}
interface Cell {vertex: number;lane: string;step: number;priority: number;voice: Voice}
const mod = (value: number) => ((value % 7) + 7) % 7;
const rootAt = (roots: readonly number[],step: number,steps: number) => roots[Math.floor(step * roots.length / steps) % roots.length];
const isQuiet = (song: ClassicSong) => ['baroque','chamber','nocturne'].includes(song.style);
const isBassHook = (song: ClassicSong) => song.leadOctave <= 2 || song.id === 'S22' || song.id === 'S27';
const percussion = (instrument: Instrument,level: number): Voice => ({instrument,pitch:0,octave:4,ticks:1,level});

function backing(song: ClassicSong,lane: string,step: number): {voice: Voice;priority: number} {
  const steps = song.period * 4, root = rootAt(song.roots,step,steps);
  const quiet = isQuiet(song), lowHook = isBassHook(song);
  const chord = [0,2,4,2,song.style === 'jazz' ? 6 : 4,2,4,2];
  const answer: Voice = {instrument:song.accompaniment,pitch:root + chord[step % chord.length],octave:4,ticks:quiet ? 3.5 : 1.8,level:quiet ? .20 : .25};
  if (lane === 'bass' && step % (lowHook ? 8 : 4) === 0) {
    return {voice:{instrument:song.bass,pitch:rootAt(song.bassRoots ?? song.roots,step,steps),octave:3,ticks:quiet ? 6 : 3.3,level:lowHook ? .24 : .49},priority:92};
  }
  if (lane === 'bass' && step % 4 === 2) {
    return {voice:{instrument:song.bass,pitch:mod(root + 4),octave:lowHook ? 4 : 2,ticks:1.7,level:lowHook ? .16 : .29},priority:70};
  }
  if (lane === 'harmony' && !quiet && step % 4 === 0) {
    const snare = step % 8 === 4;
    return {voice:percussion(snare ? 'snare' : 'kick',song.style === 'ballad' ? .22 : snare ? .34 : .49),priority:91};
  }
  if (lane === 'drums') {
    const pattern: Instrument[] = quiet ? ['bongo-low','hi-hat','bongo-high','hi-hat'] : ['kick','hi-hat','snare','bongo-high'];
    return {voice:percussion(pattern[step % 4],quiet ? .055 : .17),priority:step % 4 === 0 ? 75 : 30};
  }
  if (lane === 'hook' && step % 2 === 0) return {voice:{...answer,octave:step % 16 === 14 ? 5 : 4,level:.17},priority:57};
  if (lane === 'harmony') return {voice:{...answer,ticks:song.style === 'jazz' && step % 4 === 3 ? 2.6 : answer.ticks},priority:step % 2 === 0 ? 80 : 48};
  if (!quiet && step % 2 === 1) {
    const instrument: Instrument = step % 8 === 3 ? 'bongo-high' : step % 8 === 7 ? 'bongo-low' : 'hi-hat';
    return {voice:percussion(instrument,instrument === 'hi-hat' ? .07 : .12),priority:32};
  }
  return {voice:{...answer,instrument:lane === 'bass' ? song.bass : song.accompaniment,octave:3,level:quiet ? .12 : .15},priority:40};
}

/** Three broad musical strands in 4/4; a fourth soft pulse in six-beat pieces.
 * Every part has finite travel and ends before its next emission. A written rest
 * stays a rest for the hook; accompaniment at that junction uses another voice.
 */
export function classicSongScene(song: ClassicSong): Scene {
  if (song.id === 'S43') return tetrisSongScene(song.id,song.bpm);
  const steps = song.period * 4;
  const hook = new Map<number,Voice>();
  let position = 0;
  for (const [pitch,ticks] of song.melody) {
    if (!Number.isInteger(ticks) || ticks < 1) throw Error(`${song.id}: invalid score duration`);
    const length = isQuiet(song) ? Math.max(ticks * 1.05,song.style === 'baroque' || song.style === 'nocturne' ? 3 : 2.5) : ticks * (song.style === 'soul' || song.style === 'dance' ? .72 : .90);
    if (pitch !== null) hook.set(position,{instrument:song.lead,pitch,octave:song.leadOctave,ticks:length,level:.73});
    position += ticks;
  }
  if (position !== steps) throw Error(`${song.id}: hook fills ${position} steps instead of ${steps}`);
  const plans = song.period === 8
    ? [{name:'hook',steps:32,period:8},{name:'bass',steps:32,period:8},{name:'harmony',steps:24,period:8}]
    : [{name:'hook',steps:24,period:6},{name:'bass',steps:24,period:6},{name:'harmony',steps:24,period:6},{name:'drums',steps:12,period:3}];
  const walk = SONG_WALKS[song.period === 8 ? 92 : 88];
  const scene = emptyScene(); scene.settings = {...scene.settings,bpm:song.bpm,key:song.key,scale:song.scale,volume:.60};
  const cells: Cell[] = [];
  let offset = 0;
  for (const plan of plans) {
    const path = walk.slice(offset,offset + plan.steps + 1); offset += plan.steps + 1;
    scene.pieces.push({...newPiece('generator',path[0],`${song.id}-${plan.name}-source`),period:plan.period as Generator['period'],phase:0,reach:180,travel:plan.steps});
    path.forEach((vertex,index) => scene.wiring!.push({vertex,exits:index < plan.steps ? [path[index+1]] : []}));
    for (let step = 0; step < plan.steps; step++) {
      const written = plan.name === 'hook' ? hook.get(step) : undefined;
      cells.push({vertex:path[step+1],lane:plan.name,step,...(written ? {voice:written,priority:100} : backing(song,plan.name,step))});
    }
  }
  const chosen = cells.sort((a,b) => b.priority - a.priority || a.vertex - b.vertex).slice(0,song.nodes - plans.length);
  if (chosen.filter(cell => cell.lane === 'hook' && hook.has(cell.step)).length !== hook.size) throw Error(`${song.id}: hook does not fit`);
  for (const {vertex,lane,step,voice} of chosen.sort((a,b) => a.vertex - b.vertex)) {
    scene.pieces.push({...newPiece('note',vertex,`${song.id}-${lane}-${step}`),instrument:voice.instrument,degree:mod(voice.pitch),octave:voice.octave + Math.floor(voice.pitch / 7),duration:Math.max(.05,voice.ticks * 15 / song.bpm),level:voice.level});
  }
  return validateScene(scene);
}

export const CLASSIC_PRESETS = CLASSIC_SONGS.map(song => ({id:song.id,name:`${song.title} · ${song.artist}`}));
