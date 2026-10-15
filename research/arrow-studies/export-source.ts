import { writeFileSync } from 'node:fs';
import { topology } from '../../src/core/geometry';
import { strutPoints } from '../../src/view/strutRoutes';
import { toRenderPoint } from '../../src/view/math';
import { GATE_ICONS } from '../../src/view/art/gateIcons';
import { DEFAULT_SWITCH_LOOK } from '../../src/view/art/appearance';

// Retain the production topology, flat arrow contour, and gate positions in a
// buildless, portable study. No game code or saved scene is modified.
const gates = topology.vertices.flatMap((_, vertex) => topology.neighbors[vertex].map(exit => {
  const [from, to] = strutPoints(vertex, exit, 'seams');
  const normal = from.map((v, i) => v + to[i]);
  const length = Math.hypot(...normal);
  return { id: `${vertex}>${exit}`, vertex, exit, from, to,
    point: from.map((v, i) => v * .75 + to[i] * .25 + normal[i] / length * .012) };
}));
const data = {
  vertices: topology.vertices.map(p => toRenderPoint(p, .99)),
  faces: topology.faces, edges: topology.edges, gates,
  contour: GATE_ICONS.find(g => g.id === 'arrow')!.polygons[0],
  sourceScale: .082, current: DEFAULT_SWITCH_LOOK,
};
writeFileSync(new URL('./source-data.js', import.meta.url), `// Snapshot of the real Bongo Planet topology and arrow asset.\nexport const source = ${JSON.stringify(data)};\n`);
