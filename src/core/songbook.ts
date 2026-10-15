import { emptyScene, newPiece, validateScene, type Generator, type Scene } from './contracts';
import type { Instrument } from './instruments';

type Phrase = readonly (readonly [pitch: number, sixteenths: number])[];
type Size = 'quarter' | 'half' | 'nearly-full' | 'every-node';
type Groove = 'bongo' | 'backbeat' | 'clave' | 'half-time' | 'waltz' | 'disco' | 'breakbeat';
export interface PlanetSong {
  id: string;
  title: string;
  kind: 'cover' | 'original';
  credit: string;
  size: Size;
  nodes: number;
  bpm: number;
  key: number;
  scale: 'major' | 'minor';
  meter: 3 | 4;
  lead: Instrument;
  bass: Instrument;
  bells: Instrument;
  groove: Groove;
  roots: readonly number[];
  melody: Phrase;
  description: string;
}

const quarters = (...notes: number[]): Phrase => notes.map(pitch => [pitch, 4]);
const eighths = (...notes: number[]): Phrase => notes.map(pitch => [pitch, 2]);

/** Pitches are diatonic offsets from octave four; negative values are lower notes.
 * These are new, compact instrumental arrangements of the credited melodies.
 * Each melody occupies two bars; accompaniment repeats on the same master grid.
 */
export const PLANET_SONGS: readonly PlanetSong[] = [
  {id:'S01', title:'Ode to Joy', kind:'cover', credit:'Ludwig van Beethoven', size:'quarter', nodes:23, bpm:114, key:0, scale:'major', meter:4, lead:'piano', bass:'guitar', bells:'glass', groove:'backbeat', roots:[0,0,3,4], melody:quarters(2,2,3,4,4,3,2,1), description:'The opening theme on piano, with a warm guitar floor and a crisp bongo backbeat.'},
  {id:'S02', title:'When the Saints Go Marching In', kind:'cover', credit:'Traditional spiritual', size:'quarter', nodes:23, bpm:126, key:5, scale:'major', meter:4, lead:'marimba', bass:'piano', bells:'kalimba', groove:'clave', roots:[0,0,4,0], melody:[[0,2],[2,2],[3,2],[4,10],[0,2],[2,2],[3,2],[4,10]], description:'A little marimba street parade, with syncopated low bongos and a snare answer.'},
  {id:'S03', title:'Simple Gifts', kind:'cover', credit:'Joseph Brackett', size:'quarter', nodes:23, bpm:108, key:7, scale:'major', meter:4, lead:'kalimba', bass:'guitar', bells:'glass', groove:'bongo', roots:[0,0,3,4], melody:quarters(-3,0,0,1,2,0,2,3), description:'A thumb-piano Shaker melody, woody bass, and a small hand-drum circle.'},
  {id:'S04', title:'Drunken Sailor', kind:'cover', credit:'Traditional sea shanty', size:'quarter', nodes:23, bpm:132, key:2, scale:'minor', meter:4, lead:'guitar', bass:'marimba', bells:'kalimba', groove:'breakbeat', roots:[0,0,6,0], melody:[[0,2],[0,2],[0,2],[0,2],[0,2],[0,2],[0,2],[2,2],[-2,4],[-1,4],[0,8]], description:'A short, rowdy shanty riff over a lopsided kick and snare break.'},
  {id:'S05', title:'Scarborough Fair', kind:'cover', credit:'Traditional English ballad', size:'quarter', nodes:23, bpm:88, key:0, scale:'major', meter:4, lead:'glass', bass:'guitar', bells:'kalimba', groove:'half-time', roots:[1,1,0,1], melody:[[1,4],[1,4],[5,6],[5,2],[2,4],[3,4],[2,4],[1,4]], description:'A D-Dorian glass refrain with a low drone and widely spaced hand percussion.'},
  {id:'S06', title:'Sakura', kind:'cover', credit:'Traditional Japanese melody', size:'quarter', nodes:23, bpm:84, key:0, scale:'major', meter:4, lead:'kalimba', bass:'piano', bells:'glass', groove:'half-time', roots:[2,3,2,2], melody:[[2,2],[2,2],[3,4],[2,2],[2,2],[3,4],[2,2],[3,2],[5,2],[3,2],[2,2],[3,2],[2,4]], description:'The E-Phrygian cherry-blossom melody, with deep piano and delicate bongo taps.'},
  {id:'S07', title:'Amazing Grace', kind:'cover', credit:'Traditional NEW BRITAIN tune', size:'half', nodes:46, bpm:92, key:5, scale:'major', meter:3, lead:'guitar', bass:'piano', bells:'glass', groove:'waltz', roots:[0,0,4], melody:[[-3,2],[0,6],[2,2],[0,2],[2,6],[1,2],[0,4]], description:'A lilting six-beat guitar phrase, piano roots, glass responses, and a brushed-feeling drum waltz.'},
  {id:'S08', title:'Auld Lang Syne', kind:'cover', credit:'Traditional Scottish melody', size:'half', nodes:46, bpm:102, key:2, scale:'major', meter:4, lead:'piano', bass:'guitar', bells:'glass', groove:'backbeat', roots:[0,0,3,4], melody:eighths(-3,0,0,0,2,1,0,1,2,0,0,2,4,5,5,4), description:'A bright piano toast, a climbing upper register, and warm snare-and-bongo replies.'},
  {id:'S09', title:'Greensleeves', kind:'cover', credit:'Traditional English melody', size:'half', nodes:46, bpm:112, key:9, scale:'minor', meter:3, lead:'glass', bass:'guitar', bells:'kalimba', groove:'waltz', roots:[0,5,6], melody:[[0,2],[2,4],[3,2],[4,3],[5,1],[4,2],[3,4],[1,6]], description:'A six-beat glass waltz, plucked low strings, and a rolling high/low bongo conversation.'},
  {id:'S10', title:'Oh! Susanna', kind:'cover', credit:'Stephen Foster', size:'half', nodes:46, bpm:138, key:0, scale:'major', meter:4, lead:'marimba', bass:'guitar', bells:'kalimba', groove:'bongo', roots:[0,0,4,0], melody:eighths(0,1,2,4,4,5,4,2,0,1,2,2,1,0,1,2), description:'A fast marimba hoedown with a picked bass and alternating hand drums.'},
  {id:'S11', title:'Shenandoah', kind:'cover', credit:'Traditional American folk melody', size:'half', nodes:46, bpm:78, key:5, scale:'major', meter:4, lead:'guitar', bass:'piano', bells:'glass', groove:'half-time', roots:[0,3,0,4], melody:eighths(0,3,3,3,2,1,0,1,2,3,4,5,4,3,2,3), description:'An unhurried river-song guitar line, resonant piano bass, and soft high glass.'},
  {id:'S12', title:'Brahms’ Lullaby', kind:'cover', credit:'Johannes Brahms', size:'half', nodes:46, bpm:88, key:7, scale:'major', meter:3, lead:'piano', bass:'marimba', bells:'glass', groove:'waltz', roots:[0,3,4], melody:[[2,1],[2,1],[4,4],[2,1],[2,1],[4,4],[2,2],[4,2],[7,2],[6,2],[5,2],[4,2]], description:'A small piano music box with a descending high answer and a gentle three-beat bongo pulse.'},
  {id:'S13', title:'Pachelbel’s Canon', kind:'cover', credit:'Johann Pachelbel', size:'nearly-full', nodes:76, bpm:96, key:2, scale:'major', meter:4, lead:'glass', bass:'piano', bells:'kalimba', groove:'disco', roots:[0,-3,-2,-5,-4,-7,-4,-3], melody:quarters(9,8,7,6,5,4,5,6), description:'The descending Canon line and its eight bass changes, wrapped in a sparkling four-on-the-floor arrangement.'},
  {id:'S14', title:'New World Largo', kind:'cover', credit:'Antonín Dvořák, Symphony No. 9', size:'nearly-full', nodes:76, bpm:74, key:1, scale:'major', meter:4, lead:'guitar', bass:'piano', bells:'glass', groove:'half-time', roots:[0,0,3,0,4,4,0,0], melody:[[2,3],[4,1],[4,4],[2,3],[1,1],[0,4],[1,3],[2,1],[4,4],[2,4],[1,4]], description:'The Largo’s opening melody, spacious piano bass, and a slow, low-bongo heartbeat.'},
  {id:'S15', title:'Mango Moon', kind:'original', credit:'Original Bongo Planet composition', size:'nearly-full', nodes:76, bpm:116, key:5, scale:'major', meter:4, lead:'marimba', bass:'guitar', bells:'kalimba', groove:'clave', roots:[0,0,5,5,3,3,4,4], melody:[[0,3],[2,1],[4,2],[5,2],[4,3],[2,1],[1,2],[0,2],[3,3],[5,1],[7,2],[6,2],[5,2],[3,2],[1,2],[0,2]], description:'A sunny, syncopated marimba hook over a tumbling clave groove and a kalimba crown.'},
  {id:'S16', title:'Velvet Meteor', kind:'original', credit:'Original Bongo Planet composition', size:'nearly-full', nodes:76, bpm:94, key:4, scale:'minor', meter:4, lead:'glass', bass:'piano', bells:'guitar', groove:'breakbeat', roots:[0,0,5,5,2,2,6,6], melody:[[0,2],[4,2],[6,3],[7,1],[6,2],[4,2],[2,2],[1,2],[5,2],[7,2],[9,3],[8,1],[6,2],[4,2],[1,2],[0,2]], description:'A wide minor glass melody, a weighty broken beat, and dry little guitar sparks.'},
  {id:'S17', title:'Bongo World Carnival', kind:'original', credit:'Original Bongo Planet composition', size:'every-node', nodes:92, bpm:128, key:0, scale:'major', meter:4, lead:'marimba', bass:'guitar', bells:'glass', groove:'bongo', roots:[0,0,3,3,5,5,4,4], melody:eighths(0,2,4,7,6,5,4,2,3,5,7,9,8,6,4,7), description:'Every node joins a bright hand-drum carnival: a rising marimba hook, low guitar, and tiny glass fireworks.'},
  {id:'S18', title:'Midnight Circuit', kind:'original', credit:'Original Bongo Planet composition', size:'every-node', nodes:92, bpm:122, key:2, scale:'minor', meter:4, lead:'piano', bass:'marimba', bells:'glass', groove:'disco', roots:[0,0,5,5,2,2,6,6], melody:[[0,3],[4,1],[7,2],[6,2],[5,3],[4,1],[2,2],[1,2],[2,3],[6,1],[9,2],[8,2],[6,2],[4,2],[1,2],[0,2]], description:'A minor-key night drive with pumping kick, an insistent piano hook, and glass lights at the top of the planet.'},
  {id:'S19', title:'Seven-Step Sun', kind:'original', credit:'Original Bongo Planet composition', size:'every-node', nodes:92, bpm:144, key:7, scale:'major', meter:4, lead:'kalimba', bass:'piano', bells:'marimba', groove:'breakbeat', roots:[0,0,4,4,5,5,3,4], melody:eighths(0,1,2,3,4,5,6,7,9,8,7,6,5,4,2,0), description:'A full-scale kalimba climb and diving answer, with quick broken drums and very high marimba flecks.'},
  {id:'S20', title:'The Planet After Rain', kind:'original', credit:'Original Bongo Planet composition', size:'every-node', nodes:92, bpm:82, key:9, scale:'minor', meter:4, lead:'guitar', bass:'piano', bells:'glass', groove:'half-time', roots:[0,0,3,3,5,5,6,4], melody:[[0,4],[2,3],[4,1],[7,4],[6,4],[5,3],[3,1],[1,2],[2,2],[4,4],[0,4]], description:'A spacious guitar melody through five registers, a deep half-time pulse, and a quiet halo of glass.'},
];

// Non-repeating adjacent walks through spherical caps facing the initial camera.
// The larger caps expand the same front region; the last walk visits all 92 nodes.
export const SONG_WALKS: Readonly<Record<number, readonly number[]>> = {
  48:[44,45,47,46,43,88,72,70,78,89,48,30,29,9,42,41,73,71,69,76,74,75,77,51,53,50,52,49,24,26,23,22,28,4,7,5,8,6,40,37,38,39,66,63,65,62,61,64],
  64:[44,45,47,46,43,88,72,70,78,89,48,30,29,9,42,41,73,71,69,76,77,50,49,24,23,28,7,8,40,38,39,63,62,61,74,75,51,83,81,79,84,64,67,65,66,68,87,36,37,3,6,2,5,1,4,0,22,16,25,26,27,52,53,54],
  88:[44,45,47,46,43,88,72,70,78,89,48,30,29,9,42,41,73,71,69,76,77,50,49,24,23,28,7,8,40,38,39,63,62,61,74,75,51,53,52,26,25,22,4,5,6,37,3,2,1,0,16,10,13,15,14,11,19,21,58,20,17,27,18,54,55,90,83,81,79,64,65,66,87,36,34,35,68,67,33,32,91,85,84,86,80,82,57,56],
  92:[44,45,47,46,43,88,72,70,78,89,48,30,29,9,42,41,73,71,69,76,77,50,49,24,23,28,7,8,40,38,39,63,62,61,74,75,51,53,52,26,25,22,4,5,6,37,3,2,1,0,16,10,13,15,36,87,66,65,64,79,81,83,90,54,27,17,18,55,20,19,11,14,34,35,68,67,33,32,85,84,80,82,57,56,58,21,12,31,60,91,86,59],
};

type Lane = 'melody' | 'drums' | 'bass' | 'bells';
interface LanePlan { lane: Lane; vertices: number; period: Generator['period'] }
interface Voice { instrument: Instrument; pitch: number; octave: number; ticks: number; level: number }
interface Cell { lane: Lane; step: number; vertex: number; priority: number; voice: Voice }

function lanesFor(song: PlanetSong): LanePlan[] {
  if (song.size === 'quarter') return [{lane:'melody',vertices:33,period:8},{lane:'drums',vertices:9,period:2},{lane:'bass',vertices:6,period:2}];
  if (song.size === 'half' && song.meter === 3) return [{lane:'melody',vertices:25,period:6},{lane:'drums',vertices:13,period:3},{lane:'bass',vertices:13,period:3},{lane:'bells',vertices:13,period:3}];
  if (song.size === 'half') return [{lane:'melody',vertices:33,period:8},{lane:'drums',vertices:17,period:4},{lane:'bass',vertices:14,period:4}];
  return [{lane:'melody',vertices:33,period:8},{lane:'bass',vertices:33,period:8},{lane:'drums',vertices:17,period:4},{lane:'bells',vertices:song.size === 'every-node' ? 9 : 5,period:song.size === 'every-node' ? 2 : 1}];
}

const drum = (instrument: Instrument, level: number): Voice => ({instrument,level,pitch:0,octave:4,ticks:1});
const DRUM_PATTERNS: Record<Groove, readonly Instrument[]> = {
  bongo:['kick','hi-hat','bongo-low','bongo-high','snare','hi-hat','bongo-high','bongo-low','kick','hi-hat','bongo-low','bongo-high','snare','bongo-low','hi-hat','bongo-high'],
  backbeat:['kick','hi-hat','bongo-low','hi-hat','snare','hi-hat','bongo-high','hi-hat','kick','bongo-low','hi-hat','bongo-high','snare','hi-hat','bongo-low','bongo-high'],
  clave:['kick','bongo-low','hi-hat','bongo-high','snare','hi-hat','bongo-low','hi-hat','kick','hi-hat','bongo-high','bongo-low','snare','bongo-high','hi-hat','bongo-low'],
  'half-time':['kick','hi-hat','bongo-low','hi-hat','bongo-high','hi-hat','bongo-low','hi-hat','snare','hi-hat','bongo-high','hi-hat','bongo-low','hi-hat','kick','bongo-high'],
  waltz:['kick','hi-hat','bongo-low','hi-hat','snare','hi-hat','bongo-high','hi-hat','bongo-low','hi-hat','snare','bongo-high'],
  disco:['kick','bongo-low','hi-hat','bongo-high','kick','snare','hi-hat','bongo-low','kick','bongo-high','hi-hat','bongo-low','kick','snare','hi-hat','bongo-high'],
  breakbeat:['kick','hi-hat','bongo-low','kick','snare','hi-hat','bongo-high','hi-hat','bongo-low','kick','hi-hat','bongo-high','snare','bongo-low','kick','bongo-high'],
};

function rootAt(song: PlanetSong, step: number): number {
  return song.roots[Math.floor(step / 4) % song.roots.length];
}

function drumVoice(song: PlanetSong, step: number, ghost = false): Voice {
  // The small kit still includes every percussion voice in its eight steps.
  const pattern = [...DRUM_PATTERNS[song.groove]];
  if (song.size === 'quarter') {
    pattern.length = 8;
    for (const instrument of ['kick','snare','hi-hat','bongo-high','bongo-low'] as const) {
      if (pattern.includes(instrument)) continue;
      const replace = pattern.length - 1 - [...pattern].reverse().findIndex(voice => pattern.filter(other => other === voice).length > 1);
      pattern[replace] = instrument;
    }
  }
  const instrument = pattern[step % pattern.length];
  const accent = instrument === 'kick' ? .58 : instrument === 'snare' ? .40 : instrument === 'hi-hat' ? .15 : .34;
  const softness = song.groove === 'half-time' || song.groove === 'waltz' ? .72 : 1;
  return drum(instrument, accent * softness * (ghost ? .40 : 1) * (step % 2 ? .85 : 1));
}

/** Compile an arrangement into independent, finite, directed sixteenth-note lanes.
 * There are no forks or Infinite emissions; each occupied sound node is reached
 * once per lane cycle, and the tails cannot accumulate active traveling sparks.
 */
export function planetSongScene(song: PlanetSong): Scene {
  const plans = lanesFor(song);
  const count = plans.reduce((sum, plan) => sum + plan.vertices, 0);
  const walk = SONG_WALKS[count];
  if (!walk) throw Error(`No song layout for ${count} junctions.`);
  const melody = new Map<number, Voice>();
  let tick = 0;
  for (const [pitch, ticks] of song.melody) {
    if (!Number.isInteger(ticks) || ticks < 1) throw Error(`Invalid note length in ${song.id}.`);
    melody.set(tick, {instrument:song.lead,pitch,octave:4,ticks,level:.68}); tick += ticks;
  }
  if (tick !== song.meter * 8) throw Error(`${song.id} melody must fill two bars (${tick} steps).`);

  const scene = emptyScene();
  scene.settings = {...scene.settings,bpm:song.bpm,key:song.key,scale:song.scale,volume:.62};
  const cells: Cell[] = [];
  let offset = 0;
  for (const plan of plans) {
    const path = walk.slice(offset, offset + plan.vertices); offset += plan.vertices;
    scene.pieces.push({...newPiece('generator',path[0],`${song.id}-${plan.lane}-source`),period:plan.period,phase:0,reach:180,travel:path.length - 1});
    path.forEach((vertex, index) => scene.wiring!.push({vertex,exits:index + 1 < path.length ? [path[index + 1]] : []}));
    const percussionSeen = new Set<Instrument>();
    for (let step = 0; step < path.length - 1; step++) {
      let voice: Voice, priority: number;
      const root = rootAt(song,step);
      if (plan.lane === 'melody' && melody.has(step)) {
        voice = melody.get(step)!; priority = 100;
      } else if (plan.lane === 'drums') {
        voice = drumVoice(song,step);
        priority = percussionSeen.has(voice.instrument) ? (step % 4 === 0 ? 74 : 52) : 96;
        percussionSeen.add(voice.instrument);
      } else if (plan.lane === 'bass' && step % 4 === 0) {
        // Canon's descent reaches octave two without dropping below the schema.
        voice = {instrument:song.bass,pitch:root,octave:3,ticks:3.3,level:.55}; priority = 90;
      } else if (plan.lane === 'bells') {
        const arc = [0,4,2,6,5,3,1,4];
        voice = {instrument:song.bells,pitch:arc[step % arc.length],octave:step % 4 === 0 ? 5 : 6,ticks:1.4,level:.21};
        priority = step % 2 === 0 ? 70 : 30;
      } else if (plan.lane === 'bass' && step % 4 === 2) {
        // The second half of the beat answers with a quiet picked chord tone.
        voice = {instrument:song.bass,pitch:root + 4,octave:step % 8 === 2 ? 2 : 3,ticks:1.5,level:.28}; priority = 65;
      } else if (plan.lane === 'melody' && step % 4 === 2) {
        voice = {instrument:song.bells,pitch:[0,2,4,6,5,3,1,2][Math.floor(step / 4) % 8],octave:step % 8 === 2 ? 5 : 6,ticks:1.5,level:.19}; priority = 58;
      } else {
        voice = drumVoice(song,step + (plan.lane === 'bass' ? 3 : 7),true); priority = 20 + step % 7;
      }
      cells.push({lane:plan.lane,step,vertex:path[step + 1],priority,voice});
    }
  }
  const selected = cells.sort((a,b) => b.priority - a.priority || a.vertex - b.vertex).slice(0,song.nodes - plans.length);
  if (selected.filter(cell => cell.lane === 'melody' && melody.has(cell.step)).length !== melody.size) throw Error(`${song.id} has no room for its melody.`);
  for (const {lane,step,vertex,voice} of selected.sort((a,b) => a.vertex - b.vertex)) {
    const octave = voice.octave + Math.floor(voice.pitch / 7);
    scene.pieces.push({...newPiece('note',vertex,`${song.id}-${lane}-${step}`),instrument:voice.instrument,
      degree:((voice.pitch % 7) + 7) % 7,octave,duration:Math.max(.05,voice.ticks * 15 / song.bpm * .92),level:voice.level});
  }
  return validateScene(scene);
}

export const SONG_SIZE_LABELS: Record<Size, string> = {quarter:'¼ planet',half:'½ planet','nearly-full':'Nearly full','every-node':'Every node'};
export const PLANET_SONG_PRESETS = PLANET_SONGS.map(song => ({id:song.id,name:`${song.title} · ${SONG_SIZE_LABELS[song.size]}`}));
