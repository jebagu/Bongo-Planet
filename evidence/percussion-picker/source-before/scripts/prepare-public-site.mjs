import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Publish only the browser game; keep local research and recordings local.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkout = join(root, 'sites/bongo-planet');
const built = join(root, 'dist');
const output = join(checkout, 'dist');
const game = join(output, 'BongoPlanet');
const html = readFileSync(join(built, 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(join(checkout, '.openai/hosting.json'), 'utf8'));
if (!manifest.project_id || manifest.static?.directory !== 'dist') throw Error('Configure the existing Bongo Planet Site before preparing publication.');
for (const [, path] of html.matchAll(/(?:src|href)="(\/BongoPlanet\/[^"?#]+)"/g)) {
  if (!existsSync(join(built, path.slice('/BongoPlanet/'.length)))) throw Error(`Missing built asset: ${path}`);
}
rmSync(output, { recursive: true, force: true });
mkdirSync(game, { recursive: true });
for (const name of ['index.html', 'icon.svg', 'favicon-kick.png', 'assets', 'fixtures']) {
  cpSync(join(built, name), join(game, name), { recursive: true });
}
mkdirSync(join(game, 'audio/harmony-bloom'), { recursive: true });
for (const id of ['guitar', 'glass', 'kalimba', 'piano', 'marimba']) {
  cpSync(join(built, `audio/harmony-bloom/${id}.wav`), join(game, `audio/harmony-bloom/${id}.wav`));
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
