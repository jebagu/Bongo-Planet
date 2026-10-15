import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = path.resolve('evidence/step-10/audio-path-investigation/native-control');
if (fs.existsSync(path.join(root, 'report.json'))) throw Error('Existing investigation will not be overwritten.');
fs.mkdirSync(root, { recursive: true });
const snapshot = path.join(root, 'source');
fs.cpSync('dist', snapshot, { recursive: true });
const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex');
const mainName = 'assets/index-BJ803lmz.js', processorName = 'assets/processor-CXjMaizv.js';
const expectedMain = 'e0985953a9a9dc53c99a60420ea3ce3e4cf762c5c53056e9a7dafc41397fe85f';
const expectedProcessor = '155ba49f4f3e41921a86ae4adaa5595bcfe2858f5ebbadc7b28fa3281b50607d';
if (sha(fs.readFileSync(path.join(snapshot, mainName))) !== expectedMain || sha(fs.readFileSync(path.join(snapshot, processorName))) !== expectedProcessor) throw Error('Frozen application bundle mismatch.');
const harness = fs.readFileSync('scripts/native-audio-path-investigation.ts');
fs.writeFileSync(path.join(root, 'capture-harness.ts'), harness);
const save = (name: string, data: unknown) => fs.writeFileSync(path.join(root, name), JSON.stringify(data, null, 2) + '\n');
const report: any = { title: 'Bongo Planet ten-minute native aperiodic audio path investigation', investigationOnly: true, acceptancePassed: false, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), harnessSha256: sha(harness), expectedMain, expectedProcessor, createdAt: new Date().toISOString(), status: 'initializing', errors: [], snapshots: [], edits: [], paths: {}, limitations: [] };
const sourceHashes: Record<string, string> = {};
for (const name of ['src/core/engine.ts', 'src/core/contracts.ts', 'src/audio/synth.ts', 'src/audio/processor.ts', 'src/audio/AudioAdapter.ts', 'src/main.ts']) { const data = fs.readFileSync(name); sourceHashes[name] = sha(data); const target = path.join(root, 'application-source', name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, data); }
report.applicationSourceHashes = sourceHashes;
const server = http.createServer((request, response) => {
  const url = decodeURIComponent((request.url ?? '/').split('?')[0]);
  const relative = url.startsWith('/BongoPlanet/') ? url.slice('/BongoPlanet/'.length) || 'index.html' : null;
  const file = relative === null ? '' : path.resolve(snapshot, relative);
  if (!file.startsWith(snapshot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' } as Record<string, string>)[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(5420, '127.0.0.1', resolve); });
report.testUrl = 'http://127.0.0.1:5420/BongoPlanet/';
async function attest() {
  const html = await (await fetch(report.testUrl)).text();
  const script = html.match(/<script[^>]*src="([^"]+)"/)?.[1];
  if (script !== '/BongoPlanet/' + mainName) throw Error('Served HTML references unexpected main asset.');
  const main = Buffer.from(await (await fetch(new URL(script, report.testUrl))).arrayBuffer());
  const processor = Buffer.from(await (await fetch(report.testUrl + processorName)).arrayBuffer());
  if (sha(main) !== expectedMain || sha(processor) !== expectedProcessor) throw Error('Fetched asset binding mismatch.');
  return { htmlSha256: sha(Buffer.from(html)), mainSha256: sha(main), processorSha256: sha(processor), at: new Date().toISOString() };
}
report.servedBefore = await attest();
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, ignoreDefaultArgs: ['--mute-audio'], args: ['--enable-automation', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const context = await browser.newContext({ viewport: { width: 1360, height: 820 } });
await context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5420' });
const page = await context.newPage(); await page.addInitScript('globalThis.__name = fn => fn;');
report.browser = browser.version();
report.actualBrowserArguments = (await (await browser.newBrowserCDPSession()).send('Browser.getBrowserCommandLine')).arguments;
if (report.actualBrowserArguments.includes('--mute-audio')) throw Error('Output mute detected.');
page.on('pageerror', error => report.errors.push(String(error)));
const metadataFile = path.join(root, 'quantums.jsonl'), sourceFile = path.join(root, 'native-tap.f32'), inputFile = path.join(root, 'virtual-input.f32');
for (const file of [metadataFile, sourceFile, inputFile]) fs.writeFileSync(file, '');
const stats = { batches: 0, blocks: 0, sourceSamples: 0, inputSamples: 0, sourcePeak: 0, inputPeak: 0, nonfinite: 0 };
await page.exposeFunction('retainDual', (batch: any) => {
  if (batch.sequence !== stats.batches) throw Error('Batch ordering changed or a batch was lost.');
  const source = Float32Array.from(batch.source), input = Float32Array.from(batch.input);
  if (batch.blocks.reduce((n: number, b: any) => n + b.sourceLength, 0) !== source.length || batch.blocks.reduce((n: number, b: any) => n + b.inputLength, 0) !== input.length) throw Error('Atomic metadata/sample mismatch.');
  fs.appendFileSync(sourceFile, Buffer.from(source.buffer)); fs.appendFileSync(inputFile, Buffer.from(input.buffer));
  const lines: string[] = [];
  for (const block of batch.blocks) {
    if (block.index !== stats.blocks) throw Error('Independent block index changed.');
    lines.push(JSON.stringify({ ...block, sourceOffset: stats.sourceSamples, inputOffset: stats.inputSamples }));
    stats.sourceSamples += block.sourceLength; stats.inputSamples += block.inputLength; stats.blocks++;
  }
  fs.appendFileSync(metadataFile, lines.join('\n') + '\n'); stats.batches++;
  for (const value of source) { if (!Number.isFinite(value)) stats.nonfinite++; stats.sourcePeak = Math.max(stats.sourcePeak, Math.abs(value)); }
  for (const value of input) { if (!Number.isFinite(value)) stats.nonfinite++; stats.inputPeak = Math.max(stats.inputPeak, Math.abs(value)); }
});
const workletSource = [
  'class DualCapture extends AudioWorkletProcessor {',
  'constructor(){super();this.index=0;this.sequence=0;this.blocks=[];this.source=[];this.input=[];}',
  'process(inputs,outputs){',
  'for(const channel of outputs[0]||[])channel.fill(0);',
  'const source=inputs[0]?.[0]||new Float32Array(0),input=inputs[1]?.[0]||new Float32Array(0);',
  'this.blocks.push({index:this.index++,currentFrame,currentTime,quantum:outputs[0]?.[0]?.length||0,sourceLength:source.length,inputLength:input.length,sourceChannels:inputs[0]?.length||0,inputChannels:inputs[1]?.length||0});',
  'this.source.push(new Float32Array(source));this.input.push(new Float32Array(input));',
  'if(this.blocks.length===32){const join=arrays=>{const data=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){data.set(a,offset);offset+=a.length;}return data;};const source=join(this.source),input=join(this.input);this.port.postMessage({sequence:this.sequence++,blocks:this.blocks,source,input},[source.buffer,input.buffer]);this.blocks=[];this.source=[];this.input=[];}',
  'return true;}}',
  "registerProcessor('dual-capture',DualCapture);",
].join('\n');
fs.writeFileSync(path.join(root, 'observer-worklet.js'), workletSource);
let timerStart = 0;
try {
  await page.goto(report.testUrl); await page.waitForFunction(() => !!(window as any).__bongo);
  const fixture = JSON.parse(fs.readFileSync(path.join(snapshot, 'fixtures/F06.json'), 'utf8')); save('fixture.json', fixture);
  await page.evaluate(scene => (window as any).__bongo.load(scene), fixture);
  await page.locator('#enable').click(); await page.waitForFunction(() => !!(window as any).__bongo.audio.node);
  const devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId })));
  save('devices.json', devices);
  const input = devices.find(d => d.kind === 'audioinput' && d.label === 'SPAT 8ch loopback (Virtual)'), output = devices.find(d => d.kind === 'audiooutput' && d.label === 'SPAT 8ch loopback (Virtual)');
  if (!input || !output) throw Error('Exact SPAT input/output unavailable; default microphone fallback forbidden.');
  report.setup = await page.evaluate(async ({ inputId, outputId, code }) => {
    const b = (window as any).__bongo, ctx: AudioContext = b.audio.context;
    await (ctx as any).setSinkId(outputId); await b.audio.enable();
    if (ctx.sampleRate !== 48000) throw Error('Unexpected context sample rate.');
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { deviceId: { exact: inputId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 1 }, sampleRate: { ideal: 48000 } } });
    const track = stream.getAudioTracks()[0];
    if (track.getSettings().deviceId !== inputId || !track.label.includes('SPAT 8ch loopback')) throw Error('Input identity mismatch.');
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
    const observer = new AudioWorkletNode(ctx, 'dual-capture', { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [1], channelCountMode: 'max' });
    const media = ctx.createMediaStreamSource(stream), product = ctx.createBufferSource();
    const known = ctx.createBuffer(1, 604 * ctx.sampleRate, ctx.sampleRate), samples = known.getChannelData(0);
    let seed = 0x13579bdf;
    for (let i = 0; i < samples.length; i++) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; samples[i] = ((seed >>> 0) / 4294967296 - .5) * .5; }
    product.buffer = known;
    const knownSha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', samples.buffer))).map(v => v.toString(16).padStart(2, '0')).join('');
    product.connect(ctx.destination);
    const state = { ctx, stream, observer, media, product, pending: 0, maxPending: 0, error: null as string | null };
    observer.port.onmessage = ({ data }) => { if (++state.pending > 128) { state.error = 'Observer backlog limit exceeded'; state.pending--; return; } state.maxPending = Math.max(state.maxPending, state.pending); void (window as any).retainDual({ ...data, source: Array.from(data.source), input: Array.from(data.input) }).catch((error: unknown) => state.error = String(error)).finally(() => state.pending--); };
    product.connect(observer, 0, 0); media.connect(observer, 0, 1); observer.connect(ctx.destination);
    (window as any).__dual = state;
    const clickTimes: number[] = [], anchor = ctx.currentTime + .5;
    for (let i = 0; i < 12; i++) { const buffer = ctx.createBuffer(1, 48, ctx.sampleRate); buffer.getChannelData(0).fill(.3); const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination); const time = anchor + i * .3; source.start(time); clickTimes.push(time); }
    return { sampleRate: ctx.sampleRate, inputSettings: track.getSettings(), inputLabel: track.label, sinkId: (ctx as any).sinkId, clickTimes, nativeClicksBypassSourceTap: true, nativeWaveform: { seed: '0x13579bdf', algorithm: 'xorshift32; Float32(((uint32 / 2^32) - 0.5) * 0.5)', samples: samples.length, sha256: knownSha256 }, productRunning: b.status.running, graph: 'native AudioBufferSource to destination; parallel tee to observer input0; exact SPAT media input1; observer output silence to destination; production remains paused' };
  }, { inputId: input.deviceId, outputId: output.deviceId, code: workletSource });
  await page.waitForTimeout(4200);
  report.nativeStartFrame = await page.evaluate(() => { const d = (window as any).__dual, frame = Math.ceil((d.ctx.currentTime + .5) * d.ctx.sampleRate / 128) * 128; d.product.start(frame / d.ctx.sampleRate); return frame; });
  await page.waitForTimeout(1500); if (stats.inputPeak < .01 || stats.sourcePeak < .01) throw Error('One actual path has no signal.');
  report.timerContextStart = await page.evaluate(() => (window as any).__dual.ctx.currentTime);
  timerStart = Date.now(); report.startedAt = new Date(timerStart).toISOString(); report.status = 'capturing'; report.stats = stats; save('report.json', report);
  console.log('DUAL_STARTED ' + report.startedAt + '; 600 real seconds native aperiodic source; production paused.');
  let nextSample = 0, nextEdit = Infinity, editIndex = 0;
  while (Date.now() - timerStart < 600000) {
    const elapsed = Date.now() - timerStart;
    if (elapsed >= nextEdit) {
      report.edits.push(await page.evaluate(index => { const b = (window as any).__bongo, scene = b.scene, a = scene.pieces.find((p: any) => p.id === 'n4'), c = scene.pieces.find((p: any) => p.id === 'n5'); scene.settings.bpm = index % 2 ? 120 : 121; [a.vertex, c.vertex] = [c.vertex, a.vertex]; a.degree = index % 7; b.edit(scene); return { contextTime: b.audio.now, bpm: scene.settings.bpm, degree: a.degree, vertices: [a.vertex, c.vertex] }; }, editIndex++)); nextEdit += 30000;
    }
    if (elapsed >= nextSample) {
      const state = await page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__dual; return { audio: b.status, observer: { pending: d.pending, maxPending: d.maxPending, error: d.error }, contextTime: d.ctx.currentTime }; });
      report.snapshots.push({ elapsedSeconds: (Date.now() - timerStart) / 1000, ...state, stats: { ...stats } }); save('report.json', report);
      console.log('DUAL_PROGRESS ' + JSON.stringify(report.snapshots.at(-1)));
      if (state.audio.running || state.observer.error) throw Error('Production unexpectedly started or observer stopped.');
      nextSample += 60000;
    }
    await page.waitForTimeout(1000);
  }
  report.elapsedSeconds = (Date.now() - timerStart) / 1000;
  report.timerContextEnd = await page.evaluate(() => (window as any).__dual.ctx.currentTime); await page.waitForTimeout(150);
  report.status = 'captured-investigation';
} catch (error) { report.status = 'failed-or-interrupted'; report.failure = String(error); report.elapsedSeconds = timerStart ? (Date.now() - timerStart) / 1000 : 0; }
finally {
  try { report.cleanup = await page.evaluate(async () => { const b = (window as any).__bongo, d = (window as any).__dual; if (!d) return null; b.audio.pause(); d.product.disconnect(d.observer); d.media.disconnect(); d.observer.disconnect(); d.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop()); d.observer.port.onmessage = null; await d.ctx.close(); while (d.pending) await new Promise(resolve => setTimeout(resolve, 10)); return { pending: d.pending, maxPending: d.maxPending, error: d.error }; }); } catch (error) { report.cleanupError = String(error); }
  await browser.close(); report.browserClosed = true; report.servedAfter = await attest(); await new Promise<void>(resolve => server.close(() => resolve())); report.serverClosed = true; report.finishedAt = new Date().toISOString(); report.stats = stats;
  save('report.json', report);
}

const blocks = fs.readFileSync(metadataFile, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
const sourceRaw = fs.readFileSync(sourceFile), inputRaw = fs.readFileSync(inputFile);
function analyze(file: Buffer, field: 'source' | 'input') {
  const duplicates: any[] = [], clocks: any[] = []; let constantMatches = 0, maxTimeFrameDifference = 0;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i], previous = blocks[i - 1];
    maxTimeFrameDifference = Math.max(maxTimeFrameDifference, Math.abs(block.currentTime * 48000 - block.currentFrame));
    if (previous && block.currentFrame !== previous.currentFrame + previous.quantum) clocks.push({ blockIndex: i, previousFrame: previous.currentFrame, frame: block.currentFrame, gap: block.currentFrame - previous.currentFrame - previous.quantum });
    if (!previous || block[field + 'Length'] !== previous[field + 'Length'] || !block[field + 'Length']) continue;
    const data = file.subarray(block[field + 'Offset'] * 4, (block[field + 'Offset'] + block[field + 'Length']) * 4), old = file.subarray(previous[field + 'Offset'] * 4, (previous[field + 'Offset'] + previous[field + 'Length']) * 4);
    if (!data.equals(old)) continue;
    const values: number[] = []; for (let pos = 0; pos < data.length; pos += 4) values.push(data.readFloatLE(pos));
    const uniqueValues = new Set(values).size;
    if (uniqueValues === 1) { constantMatches++; continue; }
    duplicates.push({ blockIndex: i, rawOffset: block[field + 'Offset'], frame: block.currentFrame, length: values.length, sha256: sha(data), uniqueValues, range: Math.max(...values) - Math.min(...values), rms: Math.sqrt(values.reduce((n, value) => n + value * value, 0) / values.length) });
  }
  return { duplicates, constantMatches, clockDiscontinuities: clocks, maxTimeFrameDifferenceSamples: maxTimeFrameDifference, bytes: file.length, samples: file.length / 4, sha256: sha(file), metadataSamples: blocks.reduce((n, block) => n + block[field + 'Length'], 0), blockLengths: [...new Set(blocks.map(block => block[field + 'Length']))] };
}
report.paths.product = analyze(sourceRaw, 'source'); report.paths.virtual = analyze(inputRaw, 'input');
report.quantumSizes = [...new Set(blocks.map(block => block.quantum))];
report.orderedBlockIndices = blocks.every((block, index) => block.index === index);
const clicks: any[] = []; let quietSamples = 2401, currentBlock = 0;
for (let sample = 0; sample < inputRaw.length / 4; sample++) {
  while (currentBlock + 1 < blocks.length && blocks[currentBlock + 1].inputOffset <= sample) currentBlock++;
  const block = blocks[currentBlock], time = (block.currentFrame + sample - block.inputOffset) / 48000;
  if (time > report.setup.clickTimes.at(-1) + .15) break;
  const value = Math.abs(inputRaw.readFloatLE(sample * 4));
  if (value > .001) { if (quietSamples > 2400) { const expected = report.setup.clickTimes.find((click: number) => Math.abs(time - click) < .1); if (expected !== undefined) clicks.push({ expected, measured: time, inputRawOffset: sample, offsetSamples: (time - expected) * 48000 }); } quietSamples = 0; } else quietSamples++;
}
const offsets = clicks.map(click => click.offsetSamples).sort((a, b) => a - b), lagSamples = offsets[Math.floor(offsets.length / 2)];
report.nativeCalibration = { clicks, expectedCount: report.setup.clickTimes.length, detectedCount: clicks.length, medianLagSamples: lagSamples, medianLagMs: lagSamples / 48 };
report.duplicateComparison = report.paths.virtual.duplicates.map((duplicate: any) => {
  const expected = duplicate.rawOffset - Math.round(lagSamples), length = duplicate.length, data = inputRaw.subarray(duplicate.rawOffset * 4, (duplicate.rawOffset + length) * 4), matches: number[] = [];
  for (let candidate = Math.max(0, expected - 1024); candidate <= Math.min(sourceRaw.length / 4 - length, expected + 1024); candidate++) if (sourceRaw.subarray(candidate * 4, (candidate + length) * 4).equals(data)) matches.push(candidate);
  return { ...duplicate, expectedSourceRawOffset: expected, exactNearbySourceRawOffsets: matches, nearbySearchSamples: 1024, sourceDuplicateAtSameObserverBlock: report.paths.product.duplicates.some((candidate: any) => candidate.blockIndex === duplicate.blockIndex) };
});
for (const [name, raw] of [['native-tap', sourceRaw], ['virtual-input', inputRaw]] as const) {
  const header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(36 + raw.length, 4); header.write('WAVE', 8); header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(3, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(48000, 24); header.writeUInt32LE(192000, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(32, 34); header.write('data', 36); header.writeUInt32LE(raw.length, 40); fs.writeFileSync(path.join(root, name + '.wav'), Buffer.concat([header, raw]));
}
report.limitations = ['Investigation only: ten-minute native control cannot establish a product thirty-minute acceptance pass.', 'One dual-input observer records both paths on the same graph quantum; its shared clock values do not prove the paused production processor saw identical clock values.', 'An input-only repeated waveform localizes the observed difference beyond the tap, but cannot distinguish output graph, virtual driver, browser media pipeline, or capture transport.', 'No raw samples or timestamps were repaired, sorted, inserted, deleted, or resampled.', 'Constant plateaus are excluded; nonconstant exact matches include nearly flat matches, whose range is retained.', 'Native route delay is a fixed independently measured calibration, not a product-onset fit.'];
save('report.json', report);
console.log('DUAL_FINISHED ' + report.status + ' productRepeats=' + report.paths.product.duplicates.length + ' virtualRepeats=' + report.paths.virtual.duplicates.length + ' clocks=' + report.paths.product.clockDiscontinuities.length);

// Independent native-source oracle: compare actual tap samples with known sample indices,
// using the first known nonzero source sample and recorder order, never sorting clock fields.
const knownFile = path.join(root, 'known-native-source.f32'); fs.writeFileSync(knownFile, '');
let seed = 0x13579bdf, firstActive = -1, mismatches = 0, examples: any[] = [], tested = 0;
for (let i = 0; i < sourceRaw.length / 4; i++) if (sourceRaw.readFloatLE(i * 4) !== 0) { firstActive = i; break; }
for (let base = 0; base < report.setup.nativeWaveform.samples; base += 8192) {
  const length = Math.min(8192, report.setup.nativeWaveform.samples - base), data = Buffer.alloc(length * 4);
  for (let i = 0; i < length; i++) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; const expected = Math.fround(((seed >>> 0) / 4294967296 - .5) * .5); data.writeFloatLE(expected, i * 4); const observedIndex = firstActive + base + i;
    if (firstActive >= 0 && observedIndex < sourceRaw.length / 4) { tested++; const actual = sourceRaw.readFloatLE(observedIndex * 4); if (actual !== expected) { mismatches++; if (examples.length < 16) examples.push({ independentNativeIndex: base + i, recordedRawOffset: observedIndex, expected, actual }); } }
  } fs.appendFileSync(knownFile, data);
}
const knownHash = sha(fs.readFileSync(knownFile));
report.nativeSampleAdvancement = { firstActiveRawOffset: firstActive, sampleComparisons: tested, mismatches, examples, expectedBufferSha256: report.setup.nativeWaveform.sha256, independentlyGeneratedBufferSha256: knownHash, knownHashMatches: knownHash === report.setup.nativeWaveform.sha256, method: 'Actual native tap matched against independent xorshift32 oracle by monotonic raw sample index; no currentTime-derived sample index.' };
save('report.json', report); console.log('NATIVE_ORACLE ' + JSON.stringify(report.nativeSampleAdvancement));
