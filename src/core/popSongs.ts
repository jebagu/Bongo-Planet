import { emptyScene, validateScene, type Scene } from './contracts';
import { topology } from './geometry';
import { labelPieces } from './pieceLabels';
import type { Instrument } from './instruments';
import { spatialArrangement } from './spatialArrangement';

type Phrase = readonly (readonly [midi: number | null, ticks: number])[];
type Chord = { step: number; name: string; midi: readonly number[]; ticks: number };
export interface PopSong {
  id: string; title: string; artist: string; slug: string; bpm: number; key: number;
  lead: Instrument; harmony: Instrument; description: string; source: string;
  melody: Phrase; chords: readonly Chord[]; groove: 'rock' | 'anthem' | 'ballad' | 'disco' | 'synth';
}
const eighths = (...midi: number[]): Phrase => midi.map(pitch => [pitch, 2]);
const block = (step: number, name: string, midi: number[], ticks = 14): Chord => ({ step, name, midi, ticks });

// Short instrumental cover passages, not full-song transcriptions. MIDI pitches
// are written explicitly so the saved diatonic degrees cannot disguise a wrong
// transposition. Each main phrase is four bars / 64 adjacent sixteenth hops.
export const POP_SONGS: readonly PopSong[] = [
  {
    id: 'P01', title: 'Clocks', artist: 'Coldplay', slug: 'clocks', bpm: 132, key: 8,
    lead: 'piano', harmony: 'guitar', groove: 'rock',
    description: 'The rolling 3–3–2 piano hook over E-flat, B-flat minor, B-flat minor and F minor, with open bass voicings, quiet glass answers and a steady backbeat.',
    source: 'https://www.piano-keyboard-guide.com/how-to-play-clocks-by-coldplay-easy-piano-tutorial-chords-and-notes/',
    melody: [...eighths(75,70,67,75,70,67,75,70), ...eighths(73,70,65,73,70,65,73,70),
      ...eighths(73,70,65,73,70,65,73,70), ...eighths(72,68,65,72,68,65,72,68)],
    chords: [block(0,'E♭',[51,55,58]), block(16,'B♭m',[46,53,61]), block(32,'B♭m',[46,53,61]), block(48,'Fm',[53,56,60])],
  },
  {
    id: 'P02', title: 'Viva la Vida', artist: 'Coldplay', slug: 'viva-la-vida', bpm: 138, key: 8,
    lead: 'glass', harmony: 'piano', groove: 'anthem',
    description: 'The opening vocal phrases over the song’s D-flat–E-flat–A-flat–F-minor cycle. Three-note chord stacks carry the syncopated string-like pulse, with a low foundation and light marching percussion.',
    source: 'https://www.pianokeyboardnotes.com/viva-la-vida-coldplay-piano.html',
    melody: [[72,2],[72,2],[72,2],[72,6],[73,2],[70,10],[null,8],
      [70,4],[63,2],[70,2],[70,2],[68,2],[72,4],[63,2],[65,10],[null,4]],
    chords: [block(0,'D♭',[49,56,65],2.6), block(16,'E♭',[51,58,67],2.6),
      block(32,'A♭',[44,60,63],2.6), block(48,'Fm',[53,60,65],2.6)],
  },
  {
    id: 'P03', title: 'Bohemian Rhapsody', artist: 'Queen', slug: 'bohemian-rhapsody', bpm: 72, key: 10,
    lead: 'piano', harmony: 'glass', groove: 'ballad',
    description: 'A four-bar excerpt from the opening piano ballad: a singing piano line, broken chord replies, deep roots, and a full F7 stack. This is the ballad passage, not the operatic or hard-rock sections.',
    source: 'https://www.thepianonotes.com/bohemian-rhapsody-letter-notes-for-piano-queen/',
    melody: [[62,6],[62,2],[58,2],[60,2],[62,4],[62,12],[null,4],
      [62,2],[62,2],[63,2],[65,2],[63,2],[62,2],[60,4],
      [60,2],[62,2],[63,2],[65,2],[63,2],[62,2],[60,4]],
    chords: [block(0,'B♭',[46,53,58]), block(16,'Gm',[55,58,62]), block(32,'Cm',[48,55,63]), block(49,'F7',[53,57,60,63],14)],
  },
  {
    id: 'P04', title: 'Dancing Queen', artist: 'ABBA', slug: 'dancing-queen', bpm: 100, key: 9,
    lead: 'piano', harmony: 'guitar', groove: 'disco',
    description: 'The rising title refrain and its answering phrases over E, A and D, with clipped guitar chords, D6 color, a dancing bass answer and a soft four-on-the-floor groove.',
    source: 'https://www.pianokeyboardnotes.com/dancing-queen-abba-piano.html',
    melody: [[64,3],[66,3],[68,2],[68,3],[69,1],[69,12],[null,8],
      [68,3],[69,1],[69,8],[null,4],[71,3],[69,1],[68,4],[69,4],[69,4]],
    chords: [block(0,'E',[52,56,59],7), block(8,'A',[45,57,61],14), block(24,'A',[45,57,61],7),
      block(33,'D6',[50,57,59,66],14), block(48,'A',[45,57,61],7), block(56,'D',[50,57,66],7)],
  },
  {
    id: 'P05', title: 'Take On Me', artist: 'a-ha', slug: 'take-on-me', bpm: 166, key: 9,
    lead: 'marimba', harmony: 'piano', groove: 'synth',
    description: 'The familiar keyboard hook voiced on marimba, with B-minor–E–A–D chord stacks, low plucked roots, glass accents and a tight drum-machine pulse.',
    source: 'https://www.pianokeyboardnotes.com/take-on-me-piano.html',
    melody: [[66,4],[66,4],[62,4],[59,4],[59,4],[64,4],[64,4],[64,4],
      [68,2],[68,2],[69,2],[71,2],[69,2],[69,2],[69,4],[64,8],[62,8]],
    chords: [block(0,'Bm',[47,54,62]), block(16,'E',[52,56,59]), block(32,'A',[45,57,61]), block(48,'D',[50,57,66])],
  },
];

// A real Hamiltonian walk, split into independent lanes: 64 + 16 + 8 hops.
// Empty destinations are rests. No lane shortcuts, repeats a junction, forks,
// or depends on the camera, frame rate or physical strut length for timing.
const WALK = [44,45,47,46,43,88,72,70,78,89,48,30,29,9,42,41,73,71,69,76,77,50,49,24,23,28,7,8,40,38,39,63,62,61,74,75,51,53,52,26,25,22,4,5,6,37,3,2,1,0,16,10,13,15,36,87,66,65,64,79,81,83,90,54,27,17,18,55,20,19,11,14,34,35,68,67,33,32,85,84,80,82,57,56,58,21,12,31,60,91,86,59];
export const POP_LANE_STEPS = [64,16,8] as const;
export type PopAttack = { id: string; lane: number; step: number; instrument: Instrument; midi: number; ticks: number; level: number };

export function popAttacks(song: PopSong): PopAttack[] {
  const result: PopAttack[] = [];
  const add = (role: string, lane: number, step: number, instrument: Instrument, midi: number, ticks: number, level: number) => {
    result.push({ id: `${song.id}-${role}-${step}`, lane, step, instrument, midi, ticks, level });
  };
  let cursor = 0;
  for (const [midi,ticks] of song.melody) {
    if (midi !== null) add('lead',0,cursor,song.lead,midi,ticks * .91,song.groove === 'ballad' ? .52 : .57 + (cursor % 16 === 0 ? .07 : cursor % 6 === 0 ? .03 : 0));
    cursor += ticks;
  }
  if (cursor !== 64) throw Error(`${song.title}: the written melody must fill 64 steps, including rests.`);
  song.chords.forEach((chord,index) => {
    const offsets = song.groove === 'anthem' ? [0,6,12] : [0];
    for (const offset of offsets) chord.midi.forEach((midi,layer) => {
      const low = layer === 0;
      add(`chord-${index}-${layer}`,0,chord.step + offset,low ? 'guitar' : song.harmony,midi,
        Math.min(chord.ticks,64 - chord.step - offset),low ? .40 : song.groove === 'anthem' ? .24 : .22);
    });
    // Quiet inversions answer the lead without flattening the melody's rests.
    if (song.groove !== 'anthem' && chord.step % 16 === 0) {
      const answer = chord.step + (song.groove === 'ballad' ? 10 : 11);
      for (const [layer,midi] of chord.midi.slice(1,3).entries()) {
        add(`answer-${index}-${layer}`,0,answer,song.groove === 'ballad' ? 'piano' : 'glass',midi + 12,2.4,.15);
      }
    }
  });
  const drum = (step: number, instrument: Instrument, level: number) => add(instrument,1,step,instrument,60,1,level);
  const quiet = song.groove === 'ballad';
  for (const step of song.groove === 'disco' || song.groove === 'synth' ? [0,4,8,12] : quiet ? [0] : [0,8]) drum(step,'kick',quiet ? .16 : .52);
  for (const step of quiet ? [12] : [4,12]) drum(step,'snare',quiet ? .07 : .32);
  if (song.groove === 'anthem') { drum(6,'bongo-low',.15); drum(14,'bongo-high',.18); }
  const hatSteps = quiet ? [6] : [0,2,4,6];
  for (const step of hatSteps) add('hat',2,step,'hi-hat',60,1,quiet ? .035 : step % 4 === 2 ? .15 : .09);
  return result;
}

export function popSongScene(song: PopSong): Scene {
  const scene = emptyScene();
  scene.settings = {...scene.settings,bpm:song.bpm,key:song.key,scale:'major',volume:.72};
  const paths: number[][] = [];
  let cursor = 0;
  for (const [lane,steps] of POP_LANE_STEPS.entries()) {
    const path = WALK.slice(cursor,cursor + steps + 1); cursor += path.length; paths.push(path);
    scene.pieces.push({id:`${song.id}-source-${lane}`,vertex:path[0],kind:'generator',period:steps / 4 as 16|4|2,phase:0,reach:180,enabled:true,travel:steps});
    for (let hop = 1; hop <= steps; hop++) {
      if (!topology.neighbors[path[hop - 1]].includes(path[hop])) throw Error('Pop route must follow real struts.');
      scene.wiring!.push({vertex:path[hop - 1],exits:[path[hop]]});
    }
    scene.wiring!.push({vertex:path[steps],exits:[]});
  }
  const scale = [0,2,4,5,7,9,11];
  for (const attack of popAttacks(song)) {
    let pitch: {degree:number;octave:number} | undefined;
    if (attack.lane > 0) pitch = {degree:0,octave:4};
    else for (let octave = 2; octave <= 6; octave++) for (let degree = 0; degree < 7; degree++) {
      if (12 * (octave + 1) + song.key + scale[degree] === attack.midi) pitch = {degree,octave};
    }
    if (!pitch) throw Error(`${song.title}: MIDI ${attack.midi} is outside the saved key/range.`);
    scene.pieces.push({id:attack.id,vertex:paths[attack.lane][attack.step + 1],kind:'note',instrument:attack.instrument,...pitch,
      timbre:'sine',duration:Math.max(.06,attack.ticks * 15 / song.bpm),level:attack.level});
  }
  scene.wiring!.sort((a,b) => a.vertex - b.vertex);
  return spatialArrangement(validateScene(labelPieces(scene)),song.id);
}
