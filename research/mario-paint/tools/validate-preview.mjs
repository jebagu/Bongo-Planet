import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Run after npm run build, with npm run preview serving the pinned project URL.
const base = 'http://127.0.0.1:5417/BongoPlanet/research/mario-paint/';
async function get(path) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  return Buffer.from(await response.arrayBuffer());
}
const html = (await get('index.html')).toString();
assert.match(html, /Mario Paint Sound Lab/);
assert.match(html, /id="asset-manifest"/); // Detect the main app's SPA fallback.
assert.match((await get('viewer.js')).toString(), /function enableAudio/);
assert.match((await get('viewer.css')).toString(), /\.workbench/);
const manifest = JSON.parse(await get('assets/manifest.json'));
assert.equal(manifest.instruments.length, 15);
const notes = manifest.instruments.flatMap((instrument) => instrument.notes);
assert.equal(notes.length, 195);
let icons = 0, wavs = 0;
for (const instrument of manifest.instruments) {
  const icon = await get(`assets/${instrument.icon}`);
  assert.equal(icon.subarray(1, 4).toString(), 'PNG');
  icons++;
}
for (const note of notes) {
  const wav = await get(`assets/${note.wav}`);
  assert.equal(wav.subarray(0, 4).toString(), 'RIFF');
  assert.equal(wav.subarray(8, 12).toString(), 'WAVE');
  assert.equal(wav.readUInt32LE(4) + 8, wav.length);
  wavs++;
}
const sourceIds = new Set(notes.map((note) => note.sampleIndex));
assert.equal(sourceIds.size, 16);
for (const id of sourceIds) {
  const sample = manifest.samples.find((entry) => entry.index === id);
  assert.equal((await get(`assets/${sample.decodedWav}`)).subarray(0, 4).toString(), 'RIFF');
}
const archive = await get('Mario-Paint-Composer-Assets.zip');
assert.equal(archive.subarray(0, 2).toString(), 'PK');
assert.match((await get('README.md')).toString(), /Bongo Planet/);
const result = { checkedAt: new Date().toISOString(), url: base + 'index.html', standalonePage: true, icons, nativeWavs: wavs, sourceWavs: sourceIds.size, archiveBytes: archive.length, status: 'pass', scope: 'HTTP route and file integrity; browser playback tested separately in preview-validation.json' };
await fs.writeFile(new URL('../http-validation.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
