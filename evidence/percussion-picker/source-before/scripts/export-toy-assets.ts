import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createToy, createFacetedPlanet } from '../src/view/art/toys';
import { DEFAULT_APPEARANCE } from '../src/view/art/appearance';
import { topology } from '../src/core/geometry';
import { toRenderPoint } from '../src/view/math';
import * as THREE from 'three';
import { INSTRUMENTS } from '../src/core/instruments';
import { emptyLegacyScene as emptyScene, newPiece, validateScene } from '../src/core/contracts';

// GLTFExporter uses FileReader for binary buffers even without textures.
class NodeFileReader {
  result: ArrayBuffer | string | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob) { void blob.arrayBuffer().then(data => { this.result = data; this.onloadend?.(); }); }
  readAsDataURL(blob: Blob) { void blob.arrayBuffer().then(data => { this.result = `data:${blob.type};base64,${Buffer.from(data).toString('base64')}`; this.onloadend?.(); }); }
}
Object.defineProperty(globalThis, 'FileReader', { value: NodeFileReader, configurable: true });
const destination = 'public/art/geometric-toys';
await mkdir(destination, { recursive: true });
const manifest: { version: number; name: string; files: { path: string; bytes: number; sha256: string }[] } = { version: 1, name: 'Bongo Planet', files: [] };
const exporter = new GLTFExporter();
for (const kind of ['generator', 'note', 'beat'] as const) {
  const toy = createToy(kind, { ...DEFAULT_APPEARANCE });
  toy.halo.removeFromParent();
  await writeFile(`${destination}/${kind}.glb`, Buffer.from(await exporter.parseAsync(toy.group, { binary: true }) as ArrayBuffer));
}
for (const {id} of INSTRUMENTS) {
  const toy = createToy('note', {...DEFAULT_APPEARANCE}, id); toy.halo.removeFromParent();
  await writeFile(`${destination}/${id}.glb`, Buffer.from(await exporter.parseAsync(toy.group,{binary:true}) as ArrayBuffer));
}
const planet = createFacetedPlanet(topology.vertices.map(p => new THREE.Vector3(...toRenderPoint(p))), topology.faces, DEFAULT_APPEARANCE.planet);
await writeFile(`${destination}/planet.glb`, Buffer.from(await exporter.parseAsync(planet, { binary: true }) as ArrayBuffer));
const showcase = emptyScene();
showcase.settings.propagation = 'routes';
const used = new Set<number>();
const placements: [number, number, 'generator' | 'note' | 'beat'][] = [
  [-0.62, 0.35, 'generator'], [0.55, -0.3, 'generator'],
  [0, 0.73, 'note'], [-0.5, -0.2, 'note'], [0.35, 0.4, 'note'], [0.05, -0.65, 'note'],
  [0.62, 0.18, 'note'],
];
for (const [x, y, kind] of placements) {
  const target = new THREE.Vector3(x, y, Math.sqrt(1 - x*x - y*y));
  const vertex = topology.vertices.map((p, i) => ({ i, distance: new THREE.Vector3(...toRenderPoint(p)).distanceTo(target) }))
    .filter(p => !used.has(p.i)).sort((a,b) => a.distance - b.distance)[0].i;
  used.add(vertex);
  const piece = newPiece(kind, vertex, `toy-${showcase.pieces.length}`);
  if (piece.kind === 'generator') { piece.reach = 120; piece.period = 8; piece.phase = showcase.pieces.length ? 0.5 : 0; }
  if (piece.kind === 'note') { const index=showcase.pieces.filter(p => p.kind === 'note').length; piece.degree = [0,2,4,6,1][index]; piece.instrument=INSTRUMENTS[index].id; piece.duration=8; piece.level = 0.5; }
  if (piece.kind === 'beat') { piece.sound = showcase.pieces.some(p => p.kind === 'beat') ? 'hat' : 'kick'; piece.level = 0.45; }
  showcase.pieces.push(piece);
}
const showcaseJSON = JSON.stringify(validateScene(showcase), null, 2);
await writeFile(`${destination}/showcase.json`, showcaseJSON);
await writeFile('public/fixtures/F10.json', showcaseJSON);
await copyFile('assets/geometric-toys/theme.json', `${destination}/theme.json`);
await copyFile('assets/geometric-toys/README.md', `${destination}/README.md`);
const musicalDocs=['Creation-Guide.md','Agent-Guide.md','Rules.md','Game-Design-Brief.md','Spark-Gates-Work-Package.md'];
for(const file of musicalDocs)await copyFile(file,`${destination}/${file}`);
await copyFile('assets/geometric-toys/prompts.txt', `${destination}/prompts.txt`);
await mkdir(`${destination}/source`, { recursive: true });
const source = (await readFile('src/view/art/toys.ts', 'utf8')).replace("import type { Piece } from '../../core/contracts';", "type Piece = { kind: 'generator' | 'note' | 'beat' };").replace("import type { Instrument } from '../../core/instruments';", "type Instrument = 'guitar' | 'glass' | 'kalimba' | 'piano' | 'marimba';");
await writeFile(`${destination}/source/toys.ts`, source);
const settings = (await readFile('src/view/art/appearance.ts', 'utf8')).replace("../../../assets/geometric-toys/theme.json", "../theme.json");
await writeFile(`${destination}/source/appearance.ts`, settings);
await copyFile('src/view/art/swatches.ts', `${destination}/source/swatches.ts`);
await mkdir(`${destination}/examples`,{recursive:true});
for(const id of ['F11','F12','F13','F14','F15','F16','F17'])await copyFile(`public/fixtures/${id}.json`,`${destination}/examples/${id}.json`);
await copyFile('src/toy-style.css', `${destination}/source/toy-style.css`);
await copyFile('src/panel.css', `${destination}/source/panel.css`);
const effectsSources = ['view/StrutSparkModel.ts', 'view/StrutSparkRenderer.ts', 'view/strutRoutes.ts', 'view/math.ts', 'core/geometry.ts', 'core/contracts.ts', 'core/routes.ts', 'core/engine.ts', 'core/instruments.ts', 'core/examples.ts', 'core/pieceLabels.ts', 'view/selectionPanel.ts','view/SparkGateModel.ts','view/SparkGateRenderer.ts','core/gated.ts','core/gatedConversion.ts','core/gatedExamples.ts','view/art/appearance.ts','view/art/swatches.ts','view/art/gateIcons.ts'];
for (const path of effectsSources) {
  await mkdir(`${destination}/source/effects/${path.split('/').slice(0,-1).join('/')}`, { recursive: true });
  if(path==='view/art/appearance.ts')await writeFile(`${destination}/source/effects/${path}`,(await readFile(`src/${path}`,'utf8')).replace('../../../assets/geometric-toys/theme.json','../../../../theme.json'));
  else await copyFile(`src/${path}`, `${destination}/source/effects/${path}`);
}
for (const path of [...INSTRUMENTS.map(i=>`${i.id}.glb`), ...['generator',...INSTRUMENTS.map(i=>i.id)].map(id=>`${id}-portrait.png`), 'generator.glb', 'note.glb', 'beat.glb', 'planet.glb', 'generator.png', 'note.png', 'beat.png', 'theme.json', 'showcase.json', 'README.md', ...musicalDocs, 'prompts.txt', 'source/toys.ts', 'source/appearance.ts', 'source/swatches.ts', ...['F11','F12','F13','F14','F15','F16','F17'].map(id=>`examples/${id}.json`), 'source/toy-style.css', 'source/panel.css', ...effectsSources.map(path => `source/effects/${path}`)]) {
  const data = await readFile(`${destination}/${path}`);
  manifest.files.push({ path, bytes: data.byteLength, sha256: createHash('sha256').update(data).digest('hex') });
}
await writeFile(`${destination}/manifest.json`, JSON.stringify(manifest, null, 2));
execFileSync('zip', ['-q', '-r', 'Bongo-Planet-Assets.zip', '.', '-x', 'Bongo-Planet-Assets.zip'], { cwd: destination });
console.log(`Exported ${manifest.files.length} Bongo Planet art files to ${destination}.`);
