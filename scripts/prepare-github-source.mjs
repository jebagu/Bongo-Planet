import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'release/github/Bongo-Planet');
const omittedRoots = new Set(['node_modules', 'dist', 'release', 'sites', '.git', '.gstack', 'test-results', 'playwright-report']);
const supportExtensions = new Set(['.md', '.sha256', '.ts', '.js', '.mjs', '.py', '.sh']);
const testData = new Set([
  'evidence/step-02/topology.json',
  'evidence/step-05/original-mixture/onset-interval-preparation/reference-vectors.json',
]);

function include(path) {
  const parts = path.split('/');
  if (omittedRoots.has(parts[0]) || path === 'NodeBeat-Research.zip') return false;
  if (parts.some(part => ['node_modules', 'dist', 'test-results', 'playwright-report', '.git', '.openai', '.wrangler', '.aws', '.codex', '.agents', '__pycache__'].includes(part))) return false;
  if (parts.some(part => part === '.env' || (part.startsWith('.env.') && part !== '.env.example'))) return false;
  if (/\.(?:pem|key|log|pyc)$/.test(path) || parts.includes('.DS_Store')) return false;
  if (parts[0] !== 'evidence') return true;
  if (parts.includes('chromium-readback')) return false;
  if (parts.some(part => part.startsWith('capture-'))) return false;
  return supportExtensions.has(extname(path)) || testData.has(path)
    || /^evidence\/wraparound\/before\/[^/]+\.json$/.test(path)
    || (/preparation|diagnostic-source/.test(path) && extname(path) === '.json');
}

const candidates = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0');
const paths = [...new Set(candidates)].filter(path => path && include(path) && existsSync(join(root, path))).sort();
for (const path of paths) {
  const stat = lstatSync(join(root, path));
  if (!stat.isFile()) throw new Error(`Expected a regular source file: ${path}`);
  if (stat.size >= 100 * 1024 * 1024) throw new Error(`File exceeds GitHub's limit: ${path}`);
}
mkdirSync(output, { recursive: true });
if (existsSync(join(output, '.git'))) {
  const selected = new Set(paths);
  const previous = execFileSync('git', ['ls-files', '-z'], { cwd: output, encoding: 'utf8' }).split('\0');
  for (const path of previous) if (path && !selected.has(path)) rmSync(join(output, path), { force: true });
}
let bytes = 0;
for (const path of paths) {
  const destination = join(output, path);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(root, path), destination);
  bytes += lstatSync(destination).size;
}
console.log(JSON.stringify({ output, files: paths.length, bytes }, null, 2));
