import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Dedicated publication target. Never write to the main game's Site checkout.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkout = join(root, 'sites/bongo-planet-theme-experiment');
const manifestPath = join(checkout, '.openai/hosting.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const main = JSON.parse(readFileSync(join(root, 'sites/bongo-planet/.openai/hosting.json'), 'utf8'));
if (!manifest.project_id || manifest.project_id === main.project_id) throw Error('A separate experiment Site identity is required.');
const built = join(root, 'dist'), output = join(checkout, 'dist'), game = join(output, 'BongoPlanet');
mkdirSync(join(game, 'theme-experiment'), { recursive: true });
const html = readFileSync(join(built, 'index.html'), 'utf8');
writeFileSync(join(game, 'theme-experiment/index.html'), html);
const redirect = '<!doctype html><html lang="en"><meta charset="utf-8"><title>Bongo Planet</title><meta http-equiv="refresh" content="0;url=/BongoPlanet/theme-experiment/"><a href="/BongoPlanet/theme-experiment/">Open the Bongo Planet theme experiment</a></html>\n';
writeFileSync(join(output, 'index.html'), redirect);
writeFileSync(join(game, 'index.html'), redirect);
// Replace generated hashed assets so retired backdrops are not shipped in later revisions.
rmSync(join(game, 'assets'), { recursive: true, force: true });
for (const name of ['assets', 'ai-music', 'icon.svg', 'favicon-kick.png', 'fixtures']) cpSync(join(built, name), join(game, name), { recursive: true });
mkdirSync(join(game, 'audio/harmony-bloom'), { recursive: true });
for (const id of ['guitar', 'glass', 'kalimba', 'piano', 'marimba']) cpSync(join(built, `audio/harmony-bloom/${id}.wav`), join(game, `audio/harmony-bloom/${id}.wav`));
cpSync(join(built, 'audio/percussion'), join(game, 'audio/percussion'), { recursive: true });
cpSync(join(root, 'docs/licenses'), join(game, 'licenses'), { recursive: true });
const compositions = join(built, 'compositions');
if (existsSync(compositions)) for (const entry of readdirSync(compositions, { withFileTypes: true })) {
  const source = join(compositions, entry.name, 'Bongo-Planet.json');
  if (!entry.isDirectory() || !existsSync(source)) continue;
  mkdirSync(join(game, 'compositions', entry.name), { recursive: true });
  cpSync(source, join(game, 'compositions', entry.name, 'Bongo-Planet.json'));
}
manifest.static = { directory: 'dist' };
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(checkout, 'README.md'), '# Bongo Planet\n\nIsolated reversible theme experiment. This Site has its own project identity and source history. It must never deploy to the main game Site.\n\nPrepared by scripts/prepare-theme-experiment-site.mjs in the parent project.\n');
console.log(JSON.stringify({ checkout, project_id: manifest.project_id, entry: '/BongoPlanet/theme-experiment/' }));
