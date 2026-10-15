import { emptyLegacyScene as emptyScene, newPiece, validateScene, type Scene } from './contracts';
import { topology } from './geometry';
import type { Instrument } from './instruments';
import favoritePresets from '../../assets/favorite-presets.json' with {type:'json'};
import chordFavorites from '../../assets/chord-favorites.json' with {type:'json'};
import popPresets from '../../assets/pop-presets.json' with {type:'json'};
import drumPresets from '../../assets/drum-presets.json' with {type:'json'};
import drumBuildPresets from '../../assets/drum-build-presets.json' with {type:'json'};
import ambientPresets from '../../assets/ambient-presets.json' with {type:'json'};
import routingPresets from '../../assets/routing-presets.json' with {type:'json'};
import loopFavorites from '../../assets/loop-favorites.json' with {type:'json'};
import { SONGS } from './legacySongs';
export { SONGS } from './legacySongs';
export const FAVORITE_EXAMPLES = favoritePresets;
export const CHORD_EXAMPLES = chordFavorites;
export const POP_EXAMPLES = popPresets;
export const DRUM_EXAMPLES = [...drumPresets,...drumBuildPresets];
export const AMBIENT_EXAMPLES = ambientPresets;
export const ROUTING_EXAMPLES = routingPresets;
export const LOOP_EXAMPLES = loopFavorites;

export const EXAMPLE_GROUPS = [
  {name:'Favorites - Simple',examples:FAVORITE_EXAMPLES},
  {name:'Favorites - Chords',examples:[...CHORD_EXAMPLES,...POP_EXAMPLES]},
  {name:'favorites - with loops',examples:LOOP_EXAMPLES},
  {name:'Drum Loops',examples:DRUM_EXAMPLES},
  {name:'Airy & Ambient',examples:AMBIENT_EXAMPLES},
  {name:'Minimal Routing',examples:ROUTING_EXAMPLES},
] as const;
export const EXAMPLES = EXAMPLE_GROUPS.flatMap(group => [...group.examples]);

/** Find a visible, non-repeating seam walk, so every phrase note is editable. */
function phrasePath(count: number): number[] {
  const front = (vertex: number) => -topology.vertices[vertex][1] > 0.28;
  function extend(path: number[]): number[] | null {
    if (path.length === count) return path;
    const options = topology.neighbors[path.at(-1)!].filter(v => front(v) && !path.includes(v));
    // Prefer progressing around the face before turning inward.
    options.sort((a,b) => topology.vertices[b][2]-topology.vertices[a][2] || a-b);
    for (const next of options) { const found = extend([...path,next]); if (found) return found; }
    return null;
  }
  const path = extend([44]);
  if (!path) throw Error('Could not fit a song phrase on the visible planet.');
  return path;
}

export function songScene(song: typeof SONGS[number]): Scene {
  const scene = emptyScene();
  scene.settings = {...scene.settings,bpm:song.bpm,propagation:'routes',quantization:0,travel:0.75,volume:0.55};
  const path = phrasePath(song.degrees.length+1);
  const generator = newPiece('generator',path[0],`${song.id}-spark`);
  generator.period=8; generator.reach=120; generator.path=path;
  scene.pieces.push(generator);
  song.degrees.forEach((degree,index) => {
    const note=newPiece('note',path[index+1],`${song.id}-note-${index}`);
    note.instrument=song.instruments[index%song.instruments.length] as Instrument;
    note.degree=degree; note.duration=index===song.degrees.length-1?1.2:0.48; note.level=0.55;
    scene.pieces.push(note);
  });
  return validateScene(scene);
}
