import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Publish only the browser game; keep local research and recordings local.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkout = join(root, 'sites/bongo-planet');
const built = join(root, 'dist');
const html = readFileSync(join(built, 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(join(checkout, '.openai/hosting.json'), 'utf8'));
const liveConnection = !manifest.static; // Worker hosting is independent of the shelved MCP capability.
const output = join(checkout, liveConnection ? 'public' : 'dist');
const game = join(output, 'BongoPlanet');
const favorites = ['favorite-presets.json', 'chord-favorites.json', 'pop-presets.json','drum-presets.json','drum-build-presets.json','ambient-presets.json','routing-presets.json','loop-favorites.json'].flatMap(name => JSON.parse(readFileSync(join(root, 'assets', name), 'utf8')));
const favoriteScenes = new Set(favorites.map(({ id }) => JSON.stringify(JSON.parse(readFileSync(join(built, 'fixtures', `${id}.json`), 'utf8')))));
if (!manifest.project_id || (!liveConnection && manifest.static?.directory !== 'dist')) throw Error('Configure the existing Bongo Planet Site before preparing publication.');
for (const [, path] of html.matchAll(/(?:src|href)="(\/BongoPlanet\/[^"?#]+)"/g)) {
  if (!existsSync(join(built, path.slice('/BongoPlanet/'.length)))) throw Error(`Missing built asset: ${path}`);
}
rmSync(output, { recursive: true, force: true });
mkdirSync(game, { recursive: true });
for (const name of ['index.html', 'ai-music', 'icon.svg', 'favicon-kick.png', 'assets']) {
  cpSync(join(built, name), join(game, name), { recursive: true });
}
mkdirSync(join(game, 'fixtures'), { recursive: true });
for (const { id } of favorites) cpSync(join(built, 'fixtures', `${id}.json`), join(game, 'fixtures', `${id}.json`));
mkdirSync(join(game, 'audio/harmony-bloom'), { recursive: true });
for (const id of ['guitar', 'glass', 'kalimba', 'piano', 'marimba']) {
  cpSync(join(built, `audio/harmony-bloom/${id}.wav`), join(game, `audio/harmony-bloom/${id}.wav`));
}
cpSync(join(built, 'audio/percussion'), join(game, 'audio/percussion'), { recursive: true });
// Publish portable compositions without their local recordings or evidence.
const compositions = join(built, 'compositions');
if (existsSync(compositions)) for (const entry of readdirSync(compositions, { withFileTypes: true })) {
  const source = join(compositions, entry.name, 'Bongo-Planet.json');
  if (!entry.isDirectory() || !existsSync(source)) continue;
  if (!favoriteScenes.has(JSON.stringify(JSON.parse(readFileSync(source, 'utf8')).scene))) continue;
  const destination = join(game, 'compositions', entry.name);
  mkdirSync(destination, { recursive: true });
  cpSync(source, join(destination, 'Bongo-Planet.json'));
}
// Refresh only the instrument's shared sources; retain the Worker's APIs and migrations.
if (liveConnection) {
  for (const name of ['src', 'assets', 'ai-music']) cpSync(join(root, name), join(checkout, 'bongo', name), { recursive: true });
  for (const name of ['Creation-Guide.md', 'Rules.md', 'Agent-Guide.md']) cpSync(join(root, name), join(checkout, 'bongo', name));
}
// Serve the same app at the published origin and its permanent application path.
writeFileSync(join(output, 'index.html'), html);
cpSync(join(root, 'docs/licenses'), join(game, 'licenses'), { recursive: true });
const files = [];
function inventory(directory, prefix = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name), relative = prefix + entry.name;
    if (entry.isDirectory()) inventory(path, relative + '/');
    else {
      const bytes = readFileSync(path);
      files.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
  }
}
inventory(output);
writeFileSync(join(checkout, 'build-receipt.json'), JSON.stringify({ title: 'Bongo Planet', project_id: manifest.project_id, files }, null, 2) + '\n');
console.log(JSON.stringify({ checkout, files: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0) }));
