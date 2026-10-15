import assert from 'node:assert/strict';
import { emptyScene, validateScene, type Scene } from '../src/core/contracts';
import { topology } from '../src/core/geometry';
import { labelPieces } from '../src/core/pieceLabels';
import { DEFAULT_APPEARANCE, type Appearance } from '../src/view/art/appearance';

type Drum = 'kick' | 'snare' | 'hi-hat' | 'bongo-high' | 'bongo-low';
export type DrumHit = { step: number; instrument: Drum; level: number };
type Score = {
  id: string; name: string; genre: string; slug: string; bpm: number; description: string;
  planet: string; backdrop: Appearance['backdrop']; lanes: DrumHit[][];
};
const hits = (instrument: Drum, values: [number, number][]): DrumHit[] => values.map(([step, level]) => ({ step, instrument, level }));

// Steps count from zero: 0, 4, 8, 12 are the four quarter notes of a bar.
// Kick and snare lanes span two bars; hats span one; bongos span two beats.
export const DRUM_LOOPS: Score[] = [
  {
    id: 'D01', name: 'House Drum Loop', genre: 'House', slug: 'velvet-basement', bpm: 120,
    description: 'Four-on-the-floor kick, crisp offbeat hats, a backbeat with tiny ghost notes, and a low/high bongo answer. A soft kick pickup turns the second bar around.',
    planet: '#543468', backdrop: 'violet-stars', lanes: [
      hits('kick', [[0,.78],[4,.69],[8,.75],[12,.69],[16,.78],[20,.69],[24,.75],[28,.67],[31,.25]]),
      hits('snare', [[4,.48],[12,.51],[20,.48],[26,.10],[28,.52],[30,.13]]),
      hits('hi-hat', [[2,.25],[6,.28],[10,.24],[14,.30],[15,.07]]),
      [...hits('bongo-low', [[3,.19],[7,.08]]), ...hits('bongo-high', [[6,.20]])]],
  },
  {
    id: 'D02', name: 'Techno Drum Loop', genre: 'Techno', slug: 'night-shift', bpm: 128,
    description: 'A firm quarter-note kick under accented sixteenth hats. Woodblock-like high bongos and low bongo syncopations roll around a restrained snare; the final half beat adds a kick pickup.',
    planet: '#3b404b', backdrop: 'stars', lanes: [
      hits('kick', [[0,.80],[4,.73],[8,.77],[12,.73],[16,.80],[20,.73],[24,.77],[28,.73],[30,.25]]),
      [...hits('snare', [[4,.32],[12,.35],[20,.32],[28,.38],[31,.12]]), ...hits('bongo-low', [[3,.18],[10,.13],[19,.18],[26,.15]])],
      hits('hi-hat', [[0,.13],[1,.05],[2,.23],[3,.07],[4,.15],[5,.06],[6,.26],[7,.08],[8,.13],[9,.05],[10,.23],[11,.08],[12,.15],[13,.06],[14,.29],[15,.14]]),
      hits('bongo-high', [[0,.14],[3,.25],[6,.21],[7,.12]])],
  },
  {
    id: 'D03', name: 'Breakbeat Drum Loop', genre: 'Breakbeat', slug: 'loose-bolts', bpm: 144,
    description: 'Broken kick syncopations and a strong two-and-four snare, with quiet snare drags, interrupted hats and little bongo flicks. The second bar answers with a different kick pattern and a snare turnaround.',
    planet: '#794629', backdrop: 'peach', lanes: [
      hits('kick', [[0,.79],[6,.58],[10,.67],[15,.29],[16,.77],[22,.58],[25,.64],[30,.44]]),
      hits('snare', [[4,.60],[7,.13],[12,.65],[14,.20],[19,.11],[20,.61],[27,.16],[28,.66],[30,.20],[31,.27]]),
      hits('hi-hat', [[0,.14],[2,.20],[3,.07],[4,.13],[6,.22],[8,.13],[9,.06],[10,.21],[11,.08],[12,.13],[14,.24],[15,.10]]),
      [...hits('bongo-high', [[1,.14],[7,.12]]), ...hits('bongo-low', [[5,.16]])]],
  },
  {
    id: 'D04', name: 'Dub Drum Loop', genre: 'Dub', slug: 'low-tide', bpm: 80,
    description: 'A one-drop groove: kick and snare meet on beat three, leaving the downbeat open. Light offbeat hats and progressively quieter bongo answers leave plenty of air; a final snare ghost leads back around.',
    planet: '#20534d', backdrop: 'mint', lanes: [
      hits('kick', [[8,.74],[24,.71]]),
      [...hits('snare', [[8,.43],[24,.46],[31,.10]]), ...hits('bongo-low', [[11,.18],[14,.09],[27,.19],[30,.09]])],
      hits('hi-hat', [[2,.19],[6,.18],[10,.21],[14,.19]]),
      hits('bongo-high', [[5,.18]])],
  },
  {
    id: 'D05', name: 'Afrobeat Drum Loop', genre: 'Afrobeat', slug: 'sunwheel', bpm: 100,
    description: 'Interlocking high and low bongos weave around an asymmetrical kick line and an even eighth-note hat pulse. The snare stays light, with a short second-bar pickup so the hand drums carry the groove.',
    planet: '#662b48', backdrop: 'peach', lanes: [
      hits('kick', [[0,.72],[6,.40],[10,.59],[16,.70],[22,.48],[26,.61],[30,.35]]),
      hits('snare', [[4,.34],[12,.39],[20,.35],[27,.11],[28,.40],[31,.10]]),
      hits('hi-hat', [[0,.12],[2,.17],[4,.12],[6,.18],[8,.12],[10,.18],[12,.12],[14,.20],[15,.07]]),
      [...hits('bongo-low', [[1,.35],[4,.18],[7,.22]]), ...hits('bongo-high', [[3,.40],[6,.34]])]],
  },
];

// One adjacent walk visits every junction once. Four separate stretches become
// finite sequencer lanes; their empty junctions are rests, never shortcut edges.
const walk = [44,45,47,46,43,88,72,70,78,89,48,30,29,9,42,41,73,71,69,76,77,50,49,24,23,28,7,8,40,38,39,63,62,61,74,75,51,53,52,26,25,22,4,5,6,37,3,2,1,0,16,10,13,15,36,87,66,65,64,79,81,83,90,54,27,17,18,55,20,19,11,14,34,35,68,67,33,32,85,84,80,82,57,56,58,21,12,31,60,91,86,59];
export const LANE_STEPS = [32, 32, 16, 8];

export function drumLoopScene(score: Score): Scene {
  const scene = emptyScene();
  scene.settings = { ...scene.settings, bpm: score.bpm, volume: .78 };
  const vertices = Number(score.id.slice(1)) % 2 ? walk : [...walk].reverse();
  assert.equal(new Set(vertices).size, 92);
  let cursor = 0;
  for (const [lane, steps] of LANE_STEPS.entries()) {
    const path = vertices.slice(cursor, cursor + steps + 1); cursor += path.length;
    assert.equal(path.length, steps + 1);
    scene.pieces.push({ id: `${score.id}-source-${lane}`, vertex: path[0], kind: 'generator', period: steps / 4 as 2 | 4 | 8, phase: 0, reach: 180, enabled: true, travel: steps });
    for (let hop = 1; hop <= steps; hop++) {
      assert(topology.neighbors[path[hop - 1]].includes(path[hop]));
      scene.wiring!.push({ vertex: path[hop - 1], exits: [path[hop]] });
    }
    scene.wiring!.push({ vertex: path[steps], exits: [] });
    assert.equal(new Set(score.lanes[lane].map(hit => hit.step)).size, score.lanes[lane].length, 'One sound per lane step.');
    for (const hit of score.lanes[lane]) {
      assert(Number.isInteger(hit.step) && hit.step >= 0 && hit.step < steps);
      scene.pieces.push({ id: `${score.id}-lane-${lane}-step-${hit.step}`, vertex: path[hit.step + 1], kind: 'note', instrument: hit.instrument, degree: 0, octave: 4, timbre: 'sine', duration: .4, level: hit.level });
    }
  }
  assert.equal(cursor, 92);
  scene.wiring!.sort((a, b) => a.vertex - b.vertex);
  return validateScene(labelPieces(scene));
}

export function drumLoopAppearance(score: Score): Appearance {
  return { ...DEFAULT_APPEARANCE, planet: score.planet, planetFinish: 'workedClay', backdrop: score.backdrop, gridColor: '#e0d4e9', gridOpacity: .32, gridWidth: .9, sparkStyle: 'white', switches: { ...DEFAULT_APPEARANCE.switches } };
}
