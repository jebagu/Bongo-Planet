import { emptyScene, newPiece, validateScene, type Scene } from './contracts';
import type { Instrument } from './instruments';
import { SONG_WALKS } from './songbook';

type Phrase = readonly (readonly [pitch: number | null, ticks: number])[];

// The complete eight-bar main strain, with a notated eighth taking one hop.
// A 75 BPM master grid therefore sounds like the familiar 150 BPM tune.
const MAIN: Phrase = [
  [4,2],[1,1],[2,1],[3,2],[2,1],[1,1],
  [0,2],[0,1],[2,1],[4,2],[3,1],[2,1],
  [1,3],[2,1],[3,2],[4,2],[2,2],[0,2],[0,4],
  [3,3],[5,1],[7,2],[6,1],[5,1],
  [4,3],[2,1],[4,2],[3,1],[2,1],
  [1,2],[1,1],[2,1],[3,2],[4,2],[2,2],[0,2],[0,4],
];

// A compact, newly arranged bridge: quick descending answers, then broader
// replies and the high A. E replaces the original chromatic leading tone,
// keeping every voice in the supported A-natural-minor collection.
const BRIDGE: Phrase = [
  [4,1],[2,1],[3,1],[1,1],[2,1],[0,1],[-3,1],[1,1],
  [4,2],[2,2],[3,2],[1,2],[2,1],[4,1],[7,2],[4,2],[0,2],
];

export const TETRIS_PERIOD = 24;
export const TETRIS_MELODY: Phrase = [...MAIN,...BRIDGE,[2,1],[1,1],[0,6]];

/** A single 91-hop journey is the longest non-repeating path on this planet:
 * one silent source and 91 sounding instruments, with no empty or idle nodes.
 * Backing fills the lead's held notes; the final tonic rings through the five
 * remaining grid steps before the next launch. No overlapping melody streams.
 */
export function tetrisSongScene(id: string, bpm: number, expressive = false): Scene {
  const scene = emptyScene();
  scene.settings = {...scene.settings,bpm,key:9,scale:'minor',volume:.64};
  const path = SONG_WALKS[92];
  const attacks = new Map<number,{pitch:number;ticks:number;index:number}>();
  let position = 0;
  for (const [pitch,ticks] of TETRIS_MELODY) {
    if (pitch !== null) attacks.set(position,{pitch,ticks,index:attacks.size});
    position += ticks;
  }
  if (position !== TETRIS_PERIOD*4) throw Error('Incomplete Tetris score');
  scene.pieces.push({...newPiece('generator',path[0],`${id}-hook-source`),period:TETRIS_PERIOD,phase:0,reach:180,travel:path.length-1});
  scene.wiring = path.map((vertex,index) => ({vertex,exits:index+1<path.length?[path[index+1]]:[]}));
  const leadLane = expressive?'melody':'hook';
  for (let step = 0; step < path.length-1; step++) {
    const hit = attacks.get(step);
    let instrument: Instrument, pitch: number, octave: number, ticks: number, level: number;
    if (hit) {
      instrument='piano';pitch=hit.pitch;octave=4;
      const arc=.88+.12*Math.sin(hit.index/(attacks.size-1)*Math.PI);
      level=(step%8===0?.76:.67)*arc*(expressive?[1,.93,1.03,.96][hit.index%4]:1);
      ticks=hit.ticks*(hit.ticks>=4?.97:expressive?(step%2===0?.88:.73):.85);
    } else {
      // Diatonic E-minor → A-minor, D-minor → A-minor. Quiet offbeats
      // answer the tune instead of doubling it or retriggering held notes.
      const root=step<8?4:step<32?0:step<40?3:step<48?0:step<56?4:0;
      if (step%4===2) {
        instrument='guitar';pitch=root+(step%8===6?4:0);octave=2;ticks=1.5;level=.35;
      } else if (step%4===0) {
        instrument=step%8===4?'snare':'kick';pitch=0;octave=4;ticks=1;level=instrument==='kick'?.30:.18;
      } else if (step%8===7) {
        instrument='marimba';pitch=root+2;octave=3;ticks=1.25;level=.17;
      } else {
        instrument=step%8===3?'bongo-low':step%8===5?'bongo-high':'hi-hat';
        pitch=0;octave=4;ticks=1;level=instrument==='hi-hat'?.065:.14;
      }
      if (expressive) level*=[.92,1,.86,1.04][step%4];
    }
    scene.pieces.push({...newPiece('note',path[step+1],`${id}-${hit?leadLane:'backing'}-${step}`),instrument,
      degree:((pitch%7)+7)%7,octave:octave+Math.floor(pitch/7),
      duration:Math.max(.05,ticks*15/bpm),level});
  }
  return validateScene(scene);
}
