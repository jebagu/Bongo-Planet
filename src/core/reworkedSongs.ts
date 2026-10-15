import {emptyScene,newPiece,validateScene,type Scene} from './contracts';
import {CLASSIC_SONGS} from './classics';
import {GAME_THEMES} from './gameThemes';
import {PLANET_SONGS,SONG_WALKS} from './songbook';
import {SONGS} from './legacySongs';
import type {Instrument} from './instruments';
import {topology} from './geometry';
import {tetrisSongScene} from './tetris';

export type ReworkPhrase = readonly (readonly [pitch: number | null,ticks: number])[];
type Feel = 'lyrical' | 'folk' | 'soul' | 'dance' | 'rock' | 'baroque' | 'chamber' | 'nocturne' | 'jazz';
interface Cover {
  sourceId: string;title: string;artist: string;originalBpm: number;key: number;scale: 'major'|'minor';
  period: 6|8|24;melody: ReworkPhrase;roots: readonly number[];bassRoots: readonly number[];
  leadOctave: number;feel: Feel;
}
export interface ReworkedSong extends Cover {id: string;bpm: number;lead: Instrument;description: string}

// Deliberate tempi and lead voices, rather than speeding up every cover equally.
const PROFILES: Record<string,readonly [bpm: number,lead: Instrument]> = {
  S01:[126,'piano'],S02:[140,'piano'],S03:[112,'guitar'],S04:[148,'guitar'],S05:[86,'guitar'],S06:[84,'piano'],
  S07:[96,'guitar'],S08:[110,'piano'],S09:[120,'guitar'],S10:[156,'piano'],S11:[80,'guitar'],S12:[84,'piano'],S13:[108,'piano'],S14:[76,'piano'],
  S21:[82,'piano'],S22:[124,'guitar'],S23:[124,'guitar'],S24:[176,'piano'],S25:[102,'piano'],S26:[78,'piano'],
  S27:[138,'guitar'],S28:[120,'guitar'],S29:[140,'guitar'],S30:[148,'piano'],S31:[88,'guitar'],S32:[152,'guitar'],
  S33:[118,'piano'],S34:[120,'piano'],S35:[148,'piano'],S36:[66,'piano'],S37:[86,'piano'],S38:[126,'piano'],S39:[108,'guitar'],S40:[168,'piano'],
  F11:[104,'piano'],F12:[112,'guitar'],F13:[108,'guitar'],F14:[112,'piano'],
  S41:[176,'piano'],S42:[156,'piano'],S43:[82,'piano'],S44:[116,'piano'],
};
const FIRST_FEELS: Record<string,Feel> = {S01:'chamber',S02:'soul',S03:'folk',S04:'rock',S05:'lyrical',S06:'nocturne',S07:'lyrical',S08:'folk',S09:'lyrical',S10:'folk',S11:'lyrical',S12:'nocturne',S13:'baroque',S14:'lyrical'};

const firstCovers: Cover[] = PLANET_SONGS.filter(song => song.kind === 'cover').map(song => ({
  sourceId:song.id,title:song.title,artist:song.credit,originalBpm:song.bpm,key:song.key,scale:song.scale,
  period:song.meter === 3 ? 6 : 8,melody:song.melody,roots:song.roots.length === song.meter ? [...song.roots,...song.roots] : song.roots,
  bassRoots:song.roots.length === song.meter ? [...song.roots,...song.roots] : song.roots,leadOctave:4,feel:FIRST_FEELS[song.id],
}));
const classicCovers: Cover[] = [...CLASSIC_SONGS,...GAME_THEMES].map(song => ({
  sourceId:song.id,title:song.title,artist:song.artist,originalBpm:song.bpm,key:song.key,scale:song.scale,
  period:song.period,melody:song.melody,roots:song.roots,bassRoots:song.bassRoots ?? song.roots,leadOctave:song.leadOctave-(song.id==='S41'?1:0),
  feel:song.style === 'ballad' ? 'lyrical' : song.style,
}));
const legacyCovers: Cover[] = SONGS.map((song): Cover => {
  const durations = song.id === 'F13' ? [4,3,1,3,1,3,1,2,2,4] : song.degrees.map((_,i) => i === song.degrees.length-1 ? 32-(song.degrees.length-1)*4 : 4);
  return {sourceId:song.id,title:song.song,artist:'Traditional',originalBpm:song.bpm,key:0,scale:'major',period:song.id === 'F13' ? 6 : 8,
    melody:song.degrees.map((pitch,i) => [pitch,durations[i]] as const),roots:[0,3,4,0],bassRoots:[0,3,4,0],leadOctave:4,feel:'folk'};
});

function description(cover: Cover,bpm: number): string {
  const pace = bpm >= cover.originalBpm + 8 ? 'A stronger forward pulse' : ['lyrical','nocturne'].includes(cover.feel) ? 'A relaxed, singing pace' : 'An easy forward pulse';
  const phrasing = cover.feel === 'jazz' ? 'long-short phrasing, offbeat chord replies, and a soft bass walk'
    : cover.feel === 'baroque' ? 'shaped arpeggios, overlapping piano notes, and a steady low foundation'
    : cover.feel === 'rock' || cover.feel === 'dance' ? 'accented riffs, short drum answers, and space around the hook'
    : 'a rising and falling melody, ringing chord answers, and room at the ends of phrases';
  return `${pace}, with ${phrasing}.`;
}

export const REWORKED_SONGS: readonly ReworkedSong[] = [...firstCovers,...classicCovers,...legacyCovers].map(cover => {
  const profile = PROFILES[cover.sourceId];if (!profile) throw Error(`Missing rework profile: ${cover.sourceId}`);
  const [bpm,lead] = profile;
  return {...cover,id:`R-${cover.sourceId}`,bpm,lead,description:cover.sourceId==='S43'?'The full 92-node Tetris journey, with stronger piano accents and shorter offbeat replies. Its 82 BPM grid gives the main theme a 164 BPM feel, with a compact bridge and a held final A before the loop returns.':description(cover,bpm)};
});
export const REWORKED_PRESETS = [...REWORKED_SONGS].sort((a,b) => Number(b.sourceId==='S13')-Number(a.sourceId==='S13')).map(song => ({id:song.id,name:`${song.title} · Reworked`}));

interface Voice {instrument: Instrument;pitch: number;octave: number;ticks: number;level: number}
interface Attack {step: number;pitch: number;ticks: number;index: number}
const mod = (pitch: number) => ((pitch % 7) + 7) % 7;
const rootAt = (roots: readonly number[],step: number,total: number) => roots[Math.floor((step % total) * roots.length / total) % roots.length];
const isGentle = (song: ReworkedSong) => ['lyrical','nocturne'].includes(song.feel);
const isDriving = (song: ReworkedSong) => ['rock','dance','soul'].includes(song.feel);
const isBassHook = (song: ReworkedSong) => (isDriving(song)&&song.leadOctave <= 2) || ['S22','S27'].includes(song.sourceId);
const drum = (instrument: Instrument,level: number): Voice => ({instrument,pitch:0,octave:4,ticks:1,level});

/** Existing sixteenth-note grid, with swing written into eligible eighth-note
 * positions. No sound moves independently of its spark's arrival timestamp. */
export function reworkedAttacks(song: ReworkedSong): Attack[] {
  const attacks: Attack[] = [];let position = 0;
  for (const [pitch,ticks] of song.melody) {
    if (!Number.isInteger(ticks) || ticks < 1) throw Error(`Invalid duration in ${song.id}`);
    if (pitch !== null) attacks.push({step:position,pitch,ticks,index:attacks.length});
    position += ticks;
  }
  if (position !== song.period * 4) throw Error(`${song.id} has an incomplete phrase`);
  if (song.feel === 'jazz' && song.sourceId !== 'S40') {
    for (let i = 0; i < attacks.length; i++) {
      const hit = attacks[i],next = attacks[i+1];
      if (hit.step % 4 === 2 && (!next || next.step > hit.step + 1)) {hit.step++;hit.ticks=Math.max(1,hit.ticks-1);}
    }
  }
  return attacks;
}

function leadVoice(song: ReworkedSong,hit: Attack,count: number): Voice {
  const progress = hit.index / Math.max(1,count-1);
  // Written accents follow the phrase arc; repeated pitches have different weight.
  const arc = .78 + .20*Math.sin(progress*Math.PI),metrical = hit.step % 4 === 0 ? 1.07 : hit.step % 4 === 3 ? .86 : .94;
  const ending = hit.index === count-1 ? .86 : 1,contour = [1,.94,1.03,.90,1.06,.96][hit.index%6];
  const level = Math.min(.88,.78*arc*metrical*ending*contour);
  let ticks: number;
  if (song.feel === 'baroque' || song.feel === 'nocturne') ticks = Math.max(3.1,hit.ticks * 1.08) * [1.06,.96,1.03,.90][hit.index%4];
  else if (isGentle(song)) ticks = hit.ticks * (hit.index === count-1 ? 1.16 : 1.03);
  else if (song.feel === 'chamber') ticks = hit.ticks * (hit.step % 4 === 0 ? .93 : .72) * [1,.94,1.02,.88][hit.index%4];
  else if (song.feel === 'jazz') ticks = hit.ticks * (hit.step % 4 === 3 ? .62 : .91);
  else ticks = hit.ticks * ([.84,.64,.92,.72][hit.index%4]);
  return {instrument:song.lead,pitch:hit.pitch,octave:song.leadOctave,ticks,level};
}

function chordTree(vertices: readonly number[]) {
  const allowed=new Set(vertices);
  function distances(start: number) {
    const distance=new Map([[start,0]]),queue=[start];
    for (let i=0;i<queue.length;i++) for (const next of topology.neighbors[queue[i]]) {
      if (allowed.has(next)&&!distance.has(next)) {distance.set(next,distance.get(queue[i])!+1);queue.push(next);}
    }
    return distance;
  }
  const roots=vertices.map(vertex => ({vertex,distance:distances(vertex)}));
  roots.sort((a,b) => Math.max(...a.distance.values())-Math.max(...b.distance.values()) || a.vertex-b.vertex);
  const {vertex:root,distance}=roots[0];
  if (distance.size!==vertices.length) throw Error('Disconnected chord cluster');
  const children=new Map(vertices.map(vertex => [vertex,[] as number[]]));
  const notes=vertices.filter(vertex => vertex!==root).sort((a,b) => distance.get(a)!-distance.get(b)! || a-b);
  for (const vertex of notes) {
    const parent=topology.neighbors[vertex].filter(next => distance.get(next)===distance.get(vertex)!-1).sort((a,b) => children.get(a)!.length-children.get(b)!.length || a-b)[0];
    children.get(parent)!.push(vertex);
  }
  return {root,notes,distance,children,depth:Math.max(...distance.values())};
}

/** The lead travels its score; seven local chord trees take turns around the
 * globe. Equal-hop branches sound together, creating held/rolled chords rather
 * than a continuous stream of filler notes. Every occupied node is active.
 */
export function reworkedSongScene(song: ReworkedSong): Scene {
  if (song.sourceId==='S43') return tetrisSongScene(song.id,song.bpm,true);
  const total = song.period * 4,attacks = reworkedAttacks(song),hitAt = new Map(attacks.map(hit => [hit.step,hit]));
  const walk = SONG_WALKS[song.period === 8 ? 92 : 88];
  const scene = emptyScene();scene.settings={...scene.settings,bpm:song.bpm,key:song.key,scale:song.scale,volume:.66};
  const comp: Instrument = song.lead === 'piano' ? 'guitar' : 'piano';
  function place(vertex: number,lane: string,step: number,voice: Voice) {
    const octave = voice.octave + Math.floor(voice.pitch/7);
    if (octave < 2 || octave > 6) throw Error(`${song.id}: voice outside supported octave range`);
    scene.pieces.push({...newPiece('note',vertex,`${song.id}-${lane}-${step}`),instrument:voice.instrument,degree:mod(voice.pitch),octave,
      duration:Math.max(.05,Math.min(8,voice.ticks*15/song.bpm)),level:voice.level});
  }
  const path=walk.slice(0,total+1);
  scene.pieces.push({...newPiece('generator',path[0],`${song.id}-melody-source`),period:song.period,phase:0,reach:180,travel:total});
  path.forEach((vertex,index) => scene.wiring!.push({vertex,exits:index<total?[path[index+1]]:[]}));
  for (const [step,hit] of hitAt) place(path[step+1],'melody',step,leadVoice(song,hit,attacks.length));

  const phases=song.period===6
    ? song.feel==='nocturne'?[0,3,6,9,12,18,21]:[0,4,8,12,16,20,22]
    : song.feel==='jazz'?[0,3,7,11,16,23,27]:isGentle(song)?[0,6,10,14,18,24,28]:[0,4,8,12,16,24,28];
  const sizes=song.period===6?[9,9,9,9,9,9,9]:[8,8,8,8,8,9,10];
  let offset=total+1;
  for (let group=0;group<7;group++) {
    const vertices=walk.slice(offset,offset+sizes[group]);offset+=sizes[group];
    const tree=chordTree(vertices),phase=phases[group];
    const root=mod(rootAt(song.roots,phase,total)),bassRoot=rootAt(song.bassRoots,phase,total);
    scene.pieces.push({...newPiece('generator',tree.root,`${song.id}-chord-${group}-source`),period:song.period,phase:phase/total,reach:180,travel:tree.depth});
    for (const vertex of vertices) scene.wiring!.push({vertex,exits:tree.children.get(vertex)!});
    const swell=.78+.22*Math.sin(phase/total*Math.PI),gentle=isGentle(song),driving=isDriving(song);
    const tones=song.feel==='jazz'?[2,4,6,7,2,4,6]:[2,4,7,2,4,7,2];
    for (const [index,vertex] of tree.notes.entries()) {
      let voice: Voice;
      const bassIndex=driving?1:0;
      if (driving&&index===0) voice=drum(phase%8===4?'snare':'kick',(phase%8===4?.30:.44)*swell);
      else if (index===bassIndex) {
        const raw=bassRoot<0?bassRoot:mod(bassRoot),octave=bassRoot<0||song.leadOctave<=2?3:2;
        voice={instrument:'piano',pitch:raw,octave,ticks:gentle?7.4:song.feel==='baroque'?5:3.4,level:(isBassHook(song)?.19:gentle?.31:.39)*swell};
      } else if (driving&&index===tree.notes.length-1) voice=drum(group%3===2?'bongo-high':'hi-hat',group%3===2?.14:.10);
      else if (song.feel==='folk'&&index===tree.notes.length-1) voice=drum(group%2?'bongo-high':'bongo-low',.13*swell);
      else {
        const tone=tones[(index-bassIndex-1+tones.length)%tones.length];
        const instrument: Instrument=gentle&&group===5&&index===tree.notes.length-1?'glass':comp;
        const octave=index%3===0?3:4;
        const depth=tree.distance.get(vertex)!;
        voice={instrument,pitch:root+tone,octave,ticks:gentle?5.8:song.feel==='baroque'?3.4:song.feel==='jazz'?3.6:2.5,
          level:(gentle?.105:song.feel==='baroque'?.145:.18)*swell*(1-.06*(depth-1))*(index%2?.91:1)};
      }
      place(vertex,`chord-${group}`,index,voice);
    }
  }
  return validateScene(scene);
}
