import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
const artifact = path.resolve('evidence/step-10');
const snapshot = path.join(artifact, 'soak-source');
fs.mkdirSync(artifact, { recursive: true });
fs.rmSync(snapshot, { recursive: true, force: true });
fs.cpSync('dist', snapshot, { recursive: true });
const sourceHashes: Record<string, string> = {};
function hashFiles(folder: string) { for (const entry of fs.readdirSync(folder, { withFileTypes: true })) { const file = path.join(folder, entry.name); if (entry.isDirectory()) hashFiles(file); else sourceHashes[path.relative(snapshot, file)] = createHash('sha256').update(fs.readFileSync(file)).digest('hex'); } }
hashFiles(snapshot);
const testUrl = 'http://127.0.0.1:5420/BongoPlanet/';
const server = http.createServer((req, res) => {
  const requested = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!requested.startsWith('/BongoPlanet/')) { res.writeHead(404); res.end(); return; }
  const relative = requested.slice('/BongoPlanet/'.length) || 'index.html';
  const file = path.resolve(snapshot, relative);
  if (!file.startsWith(snapshot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' } as Record<string, string>)[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(5420, '127.0.0.1', resolve); });
const args = ['--enable-automation', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, ignoreDefaultArgs: ['--mute-audio'], args });
const context = await browser.newContext({ viewport: { width: 1360, height: 820 } });
await context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5420' }); // Enumeration permission only; no input stream is opened.
const page = await context.newPage();
const errors: { elapsedSeconds: number; type: string; message: string }[] = [];
let started = Date.now(), timerStarted = false, navigations = 0;
page.on('pageerror', error => errors.push({ elapsedSeconds: (Date.now() - started) / 1000, type: 'uncaught', message: String(error) }));
page.on('console', message => { if (message.type() === 'error') errors.push({ elapsedSeconds: (Date.now() - started) / 1000, type: 'console', message: message.text() }); });
page.on('response', response => { if (response.status() >= 400) errors.push({ elapsedSeconds: (Date.now() - started) / 1000, type: 'http', message: `${response.status()} ${response.url()}` }); });
page.on('framenavigated', frame => { if (timerStarted && frame === page.mainFrame()) navigations++; });
const report: any = { title: 'Bongo Planet actual Chrome dense soak', status: 'initializing', complete30Minutes: false, requiredDurationSeconds: 1800, startedAt: null, testUrl, permanentUrl: 'http://127.0.0.1:5417/BongoPlanet/', note: '5420 is an immutable evidence-only snapshot server, not a changed permanent project URL.', browser: browser.version(), headless: true, executable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args, os: { platform: os.platform(), release: os.release(), architecture: os.arch(), memory: os.totalmem(), cpus: os.cpus()[0]?.model }, viewport: { width: 1360, height: 820 }, sourceHashes, samples: [], edits: [], errors, sourceSnapshot: 'soak-source', audioRoute: null, inputRecording: false };
const browserCdp = await browser.newBrowserCDPSession();
report.actualBrowserArguments = (await browserCdp.send('Browser.getBrowserCommandLine')).arguments;
if (report.actualBrowserArguments.includes('--mute-audio')) throw Error('Actual browser output is muted; refusing soak.');
const save = () => fs.writeFileSync(path.join(artifact, 'soak-progress.json'), JSON.stringify(report, null, 2) + '\n');
try {
  await page.goto(testUrl);
  await page.waitForFunction(() => !!(window as any).__bongo);
  const devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId })));
  fs.writeFileSync(path.join(artifact, 'soak-devices.json'), JSON.stringify(devices, null, 2));
  const fixture = JSON.parse(fs.readFileSync(path.join(snapshot, 'fixtures/F06.json'), 'utf8'));
  await page.evaluate(scene => (window as any).__bongo.load(scene), fixture);
  await page.locator('#enable').click();
  await page.waitForFunction(() => !!(window as any).__bongo.audio.context);
  const sink = devices.find(d => d.kind === 'audiooutput' && d.label.includes('Orbisonic Aux Cable'));
  report.audioRoute = await page.evaluate(async sinkId => {
    const audio = (window as any).__bongo.audio.context;
    if (typeof audio.setSinkId !== 'function') return { sink: 'system default', sampleRate: audio.sampleRate, limitation: 'AudioContext.setSinkId unavailable.' };
    if (sinkId) { await audio.setSinkId(sinkId); return { sink: 'Orbisonic Aux Cable', sampleRate: audio.sampleRate }; }
    await audio.setSinkId({ type: 'none' }); return { sink: 'none', sampleRate: audio.sampleRate, limitation: 'No named virtual output enumerated; runtime soak cannot qualify physical output.' };
  }, sink?.deviceId);
  await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__bongo.status?.running === true);
  const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
  started = Date.now(); timerStarted = true; report.startedAt = new Date(started).toISOString(); report.status = 'running'; save();
  console.log(`SOAK_STARTED ${report.startedAt}; immutable URL ${testUrl}; route ${JSON.stringify(report.audioRoute)}`);
  await page.screenshot({ path: path.join(artifact, 'soak-start.png') });
  let nextEdit = 30000, nextSample = 0, editIndex = 0;
  while (Date.now() - started < 1800000) {
    const elapsed = Date.now() - started;
    if (navigations) throw Error('Browser reloaded or navigated; continuous soak invalidated.');
    if (elapsed >= nextEdit) {
      const edit = await page.evaluate(index => {
        const b = (window as any).__bongo, scene = b.scene;
        scene.settings.bpm = index % 2 ? 120 : 121;
        const a = scene.pieces.find((p: any) => p.id === 'n4'), c = scene.pieces.find((p: any) => p.id === 'n5');
        [a.vertex, c.vertex] = [c.vertex, a.vertex];
        a.degree = index % 7;
        if (!b.edit) throw Error('Validated debug ordinary edit API unavailable.');
        b.edit(scene);
        return { bpm: scene.settings.bpm, a: { id: a.id, vertex: a.vertex, degree: a.degree }, c: { id: c.id, vertex: c.vertex } };
      }, editIndex++);
      report.edits.push({ elapsedSeconds: (Date.now() - started) / 1000, ...edit }); nextEdit += 30000; save();
    }
    if (elapsed >= nextSample) {
      const snapshot = await page.evaluate(() => { const b = (window as any).__bongo; return { audio: b.status, render: b.view.getDiagnostics(), pieces: b.scene.pieces.length, eventRecords: b.events.length, audioState: b.audio.state }; });
      const metrics = (await cdp.send('Performance.getMetrics')).metrics;
      const values = Object.fromEntries(metrics.filter(m => ['JSHeapUsedSize', 'JSHeapTotalSize', 'Nodes', 'Documents', 'JSEventListeners'].includes(m.name)).map(m => [m.name, m.value]));
      report.samples.push({ elapsedSeconds: (Date.now() - started) / 1000, ...snapshot, metrics: values });
      console.log(`SOAK_SAMPLE ${JSON.stringify(report.samples.at(-1))}`); nextSample += 60000; save();
      if (!snapshot.audio?.running) throw Error('Dense session stopped unexpectedly.');
      if (snapshot.audio.activeVoices > 64 || snapshot.audio.pending > 5376) throw Error('Declared queue/voice bound exceeded.');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  report.elapsedSeconds = (Date.now() - started) / 1000;
  report.complete30Minutes = report.elapsedSeconds >= 1800 && navigations === 0;
  report.status = report.complete30Minutes ? 'completed-observations-require-review' : 'incomplete';
  report.warmupVsLater = { warmup: report.samples.filter((s: any) => s.elapsedSeconds >= 120 && s.elapsedSeconds < 300), later: report.samples.filter((s: any) => s.elapsedSeconds >= 1500) };
  await page.screenshot({ path: path.join(artifact, 'soak-end.png') });
} catch (error) { report.status = 'failed-or-interrupted'; report.failure = String(error); report.elapsedSeconds = timerStarted ? (Date.now() - started) / 1000 : 0; }
finally { report.finishedAt = new Date().toISOString(); save(); fs.writeFileSync(path.join(artifact, 'soak-report.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); server.close(); console.log(`SOAK_FINISHED ${report.status} elapsed=${report.elapsedSeconds}`); }
