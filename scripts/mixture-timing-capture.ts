import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium, type Browser, type Page } from '@playwright/test';
import { fixtureOracle, onsetGroups, erasedBeforeSound } from './mixture-timing-oracle';
import type { Scene } from '../src/core/contracts';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--output')) throw Error('Usage: --output <new original-mixture evidence directory>');
const output = args[1] ?? 'evidence/step-05/original-mixture/capture-01';
const allowed = path.resolve('evidence/step-05/original-mixture'), root = path.resolve(output);
if (!root.startsWith(allowed + path.sep)) throw Error('Output must be a new child of original-mixture.');
if (fs.existsSync(root) && fs.readdirSync(root).length) throw Error('Existing evidence will not be overwritten.');
fs.mkdirSync(root, { recursive: true });
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const save = (name: string, data: unknown) => fs.writeFileSync(path.join(root, name), JSON.stringify(data, null, 2) + '\n');
const snapshot = path.join(root, 'source'); fs.mkdirSync(snapshot);
for (const name of ['index.html', 'icon.svg', 'assets', 'fixtures']) fs.cpSync(path.join('dist', name), path.join(snapshot, name), { recursive: true });
const html = fs.readFileSync(path.join(snapshot, 'index.html'), 'utf8');
const mainReference = html.match(/<script[^>]*src="([^"]+)"/)?.[1];
if (!mainReference?.startsWith('/BongoPlanet/assets/')) throw Error('Unexpected main asset path.');
const mainName = mainReference.slice('/BongoPlanet/'.length);
const processorNames = fs.readdirSync(path.join(snapshot, 'assets')).filter(name => /^processor-.+\.js$/.test(name));
if (processorNames.length !== 1) throw Error('Expected one uninstrumented production processor.');
const processorName = 'assets/' + processorNames[0];
const mainBytes = fs.readFileSync(path.join(snapshot, mainName)), processorBytes = fs.readFileSync(path.join(snapshot, processorName));
const mainHash = sha(mainBytes), processorHash = sha(processorBytes);
if (mainHash !== '3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207' || processorHash !== '0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793' || !mainBytes.toString().includes(processorNames[0])) throw Error('Frozen source binding changed; obtain coordinated new candidate.');
const sourceHashes: Record<string, string> = {};
for (const name of ['scripts/mixture-timing-capture.ts', 'scripts/mixture-timing-oracle.ts', 'src/core/engine.ts', 'src/core/contracts.ts', 'src/audio/synth.ts', 'src/audio/processor.ts', 'src/audio/AudioAdapter.ts', 'src/main.ts']) {
  const bytes = fs.readFileSync(name), target = path.join(root, 'application-source', name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); sourceHashes[name] = sha(bytes);
}
const harnessBytes = fs.readFileSync('scripts/mixture-timing-capture.ts'); fs.writeFileSync(path.join(root, 'capture-harness.ts'), harnessBytes);
const topologyBytes = fs.readFileSync('evidence/step-02/topology.json'); fs.writeFileSync(path.join(root, 'topology.json'), topologyBytes);
const vertices = JSON.parse(topologyBytes.toString()).vertices as number[][];
const plan = [
  { fixture: 'F02', seconds: 64, variant: 'original-positive', delaySeconds: 0 },
  { fixture: 'F03', seconds: 24, variant: 'original-positive', delaySeconds: 0 },
  { fixture: 'F06', seconds: 20, variant: 'original-positive', delaySeconds: 0 },
  { fixture: 'F08', seconds: 20, variant: 'original-positive', delaySeconds: 0 },
  { fixture: 'F02', seconds: 12, variant: 'original-delay100-negative', delaySeconds: .1 },
];
const report: any = { title: 'Bongo Planet original mixture timing capture', acceptancePassed: false, qualificationPassed: false, status: 'initializing', createdAt: new Date().toISOString(), commitAtSetup: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), mainAsset: mainName, processorAsset: processorName, mainHash, processorHash, harnessSha256: sha(harnessBytes), sourceHashes, topologySha256: sha(topologyBytes), plan, segments: [], errors: [], testUrl: 'http://127.0.0.1:5420/BongoPlanet/', limitations: ['Capture only; independent analyzer and review are required before any timing qualification.', 'Original PCM and metadata stay ordered and unmodified.', 'Shared observer clock fields are not internal processor clock instrumentation.', 'Negative control adds actual product-path100ms delay; direct native calibration bypasses it.'] };
const metadataFile = path.join(root, 'quantums.jsonl'), sourceFile = path.join(root, 'product-tap.f32'), inputFile = path.join(root, 'virtual-input.f32'), eventsFile = path.join(root, 'events.jsonl');
for (const file of [metadataFile, sourceFile, inputFile, eventsFile]) fs.writeFileSync(file, '');
const stats = { batches: 0, blocks: 0, sourceSamples: 0, inputSamples: 0, events: 0, eventBatches: 0, sourcePeak: 0, inputPeak: 0, nonfinite: 0, firstContextTime: null as number | null, lastContextEnd: null as number | null };
const observerCode = [
  'class MixtureCapture extends AudioWorkletProcessor {',
  'constructor(){super();this.index=0;this.sequence=0;this.blocks=[];this.source=[];this.input=[];}',
  'process(inputs,outputs){for(const c of outputs[0]||[])c.fill(0);',
  'const source=inputs[0]?.[0]||new Float32Array(0),input=inputs[1]?.[0]||new Float32Array(0);',
  'this.blocks.push({index:this.index++,currentFrame,currentTime,quantum:outputs[0]?.[0]?.length||0,sourceLength:source.length,inputLength:input.length,sourceChannels:inputs[0]?.length||0,inputChannels:inputs[1]?.length||0});',
  'this.source.push(new Float32Array(source));this.input.push(new Float32Array(input));',
  'if(this.blocks.length===32){const join=arrays=>{const d=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let o=0;for(const a of arrays){d.set(a,o);o+=a.length;}return d;};const source=join(this.source),input=join(this.input);this.port.postMessage({sequence:this.sequence++,blocks:this.blocks,source,input},[source.buffer,input.buffer]);this.blocks=[];this.source=[];this.input=[];}return true;}}',
  "registerProcessor('mixture-capture',MixtureCapture);",
].join('\n');
fs.writeFileSync(path.join(root, 'observer-worklet.js'), observerCode); report.observerSha256 = sha(Buffer.from(observerCode));
const server = http.createServer((request, response) => {
  const url = decodeURIComponent((request.url ?? '/').split('?')[0]), relative = url.startsWith('/BongoPlanet/') ? url.slice('/BongoPlanet/'.length) || 'index.html' : null;
  const file = relative === null ? '' : path.resolve(snapshot, relative);
  if (!file.startsWith(snapshot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' } as Record<string, string>)[path.extname(file)] ?? 'application/octet-stream'); fs.createReadStream(file).pipe(response);
});
async function attest(phase: string) {
  const response = await fetch(report.testUrl); if (!response.ok) throw Error('Client HTML fetch failed.'); const text = await response.text(); fs.writeFileSync(path.join(root, 'served-' + phase + '.html'), text);
  if (text.match(/<script[^>]*src="([^"]+)"/)?.[1] !== '/BongoPlanet/' + mainName) throw Error('Served main reference mismatch.');
  const fetchedMain = Buffer.from(await (await fetch(new URL(mainReference!, report.testUrl))).arrayBuffer()), fetchedProcessor = Buffer.from(await (await fetch(report.testUrl + processorName)).arrayBuffer());
  if (sha(fetchedMain) !== mainHash || sha(fetchedProcessor) !== processorHash) throw Error('Fetched source binding mismatch.');
  return { at: new Date().toISOString(), htmlSha256: sha(Buffer.from(text)), mainSha256: sha(fetchedMain), processorSha256: sha(fetchedProcessor) };
}
const segmentEventCounts = new Map<number | null, number>();
let browser: Browser | undefined, page: Page | undefined;
async function captureState() {
  return page ? page.evaluate(() => {
    const b = (window as any).__bongo, d = (window as any).__mixture;
    return { audio: b?.status ?? null, audioState: b?.audio.state ?? null, contextState: d?.ctx.state ?? null, contextTime: d?.ctx.currentTime ?? null,
      firstEmission: d?.firstEmission ?? null, firstEmissionSessionNamespace: d?.firstEmissionSessionNamespace ?? null,
      observer: d ? { error: d.error, pending: d.pending, eventPending: d.eventPending, maxPending: d.maxPending, maxEventPending: d.maxEventPending } : null };
  }) : null;
}
try {
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(5420, '127.0.0.1', resolve); }); report.servedBefore = await attest('before');
  browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, ignoreDefaultArgs: ['--mute-audio'], args: ['--enable-automation', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const context = await browser.newContext({ viewport: { width: 1360, height: 820 } }); await context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5420' });
  page = await context.newPage(); await page.addInitScript('globalThis.__name=fn=>fn;'); report.browser = browser.version();
  report.browserArguments = (await (await browser.newBrowserCDPSession()).send('Browser.getBrowserCommandLine')).arguments;
  if (report.browserArguments.includes('--mute-audio')) throw Error('Chrome output unexpectedly muted.');
  page.on('pageerror', error => report.errors.push(String(error)));
  await page.exposeFunction('retainMixture', (batch: any) => {
    if (batch.sequence !== stats.batches || batch.blocks[0]?.index !== stats.blocks) throw Error('Recorder order changed or batch lost.');
    const source = Float32Array.from(batch.source), input = Float32Array.from(batch.input);
    if (batch.blocks.reduce((n: number, b: any) => n + b.sourceLength, 0) !== source.length || batch.blocks.reduce((n: number, b: any) => n + b.inputLength, 0) !== input.length) throw Error('Atomic PCM/metadata mismatch.');
    const lines: string[] = [];
    for (const block of batch.blocks) { if (block.index !== stats.blocks) throw Error('Independent recorder index changed.'); lines.push(JSON.stringify({ ...block, sourceOffset: stats.sourceSamples, inputOffset: stats.inputSamples })); stats.firstContextTime ??= block.currentTime; stats.lastContextEnd = block.currentTime + block.quantum / 48000; stats.sourceSamples += block.sourceLength; stats.inputSamples += block.inputLength; stats.blocks++; }
    fs.appendFileSync(sourceFile, Buffer.from(source.buffer)); fs.appendFileSync(inputFile, Buffer.from(input.buffer)); fs.appendFileSync(metadataFile, lines.join('\n') + '\n'); stats.batches++;
    for (const value of source) { if (!Number.isFinite(value)) stats.nonfinite++; stats.sourcePeak = Math.max(stats.sourcePeak, Math.abs(value)); }
    for (const value of input) { if (!Number.isFinite(value)) stats.nonfinite++; stats.inputPeak = Math.max(stats.inputPeak, Math.abs(value)); }
  });
  await page.exposeFunction('retainMixtureEvents', (batch: any) => {
    if (batch.batchIndex !== stats.eventBatches) throw Error('Event retention batch changed.');
    const perSegmentStart = segmentEventCounts.get(batch.segment) ?? 0;
    const lines = batch.events.map((event: any, index: number) => JSON.stringify({ independentEventIndex: stats.events + index, perSegmentEventIndex: perSegmentStart + index, sessionNamespace: event.trigger?.session ?? event.session ?? batch.sessionNamespace, eventBatchIndex: batch.batchIndex, segment: batch.segment, receiveContextTime: batch.receiveContextTime, receiveBrowserMonotonicMs: batch.receiveBrowserMonotonicMs, event }));
    fs.appendFileSync(eventsFile, lines.join('\n') + '\n'); stats.events += batch.events.length; stats.eventBatches++; segmentEventCounts.set(batch.segment, perSegmentStart + batch.events.length);
  });
  await page.goto(report.testUrl); await page.waitForFunction(() => !!(window as any).__bongo); await page.locator('#enable').click(); await page.waitForFunction(() => !!(window as any).__bongo.audio.node);
  const devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId }))); save('devices.json', devices);
  const input = devices.find(d => d.kind === 'audioinput' && d.label === 'SPAT 8ch loopback (Virtual)'), output = devices.find(d => d.kind === 'audiooutput' && d.label === 'SPAT 8ch loopback (Virtual)');
  if (!input || !output) throw Error('Exact SPAT input/output missing; microphone fallback forbidden.');
  report.setup = await page.evaluate(async ({ inputId, outputId, code }) => {
    const b = (window as any).__bongo, ctx: AudioContext = b.audio.context; await (ctx as any).setSinkId(outputId); await b.audio.enable(); if (ctx.sampleRate !== 48000) throw Error('Unexpected context sample rate.');
    const state: any = { ctx, stream: null, observer: null, media: null, product: b.audio.node, delay: null, segment: null, firstEmission: null, firstEmissionSessionNamespace: null, pending: 0, eventPending: 0, maxPending: 0, maxEventPending: 0, error: null, eventBatchIndex: 0, sessionNamespace: null, originalOnEvents: b.audio.onEvents };
    (window as any).__mixture = state;
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { deviceId: { exact: inputId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 1 }, sampleRate: { ideal: 48000 } } }); state.stream = stream;
    const track = stream.getAudioTracks()[0]; if (track.getSettings().deviceId !== inputId || !track.label.includes('SPAT 8ch loopback')) throw Error('Input identity mismatch.');
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
    const observer = new AudioWorkletNode(ctx, 'mixture-capture', { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [1], channelCountMode: 'max' }), media = ctx.createMediaStreamSource(stream); state.observer = observer; state.media = media;
    observer.onprocessorerror = () => { state.error = 'Observer processorerror'; };
    observer.port.onmessage = ({ data }) => { if (++state.pending > 128) { state.error = 'PCM retention backlog limit exceeded'; state.pending--; return; } state.maxPending = Math.max(state.maxPending, state.pending); void (window as any).retainMixture({ ...data, source: Array.from(data.source), input: Array.from(data.input) }).catch((error: unknown) => state.error = String(error)).finally(() => state.pending--); };
    b.audio.onEvents = (events: any[]) => { const reset = events.find(event => event.type === 'reset'), trigger = events.find(event => event.type === 'trigger' || event.type === 'onset'); state.sessionNamespace = reset?.session ?? trigger?.trigger.session ?? state.sessionNamespace; state.originalOnEvents?.(events); const receiveContextTime = ctx.currentTime, receiveBrowserMonotonicMs = performance.now(); const first = events.find(event => event.type === 'emission'); if (state.segment !== null && !state.firstEmission && first) { state.firstEmission = { event: structuredClone(first), receiveContextTime, receiveBrowserMonotonicMs }; state.firstEmissionSessionNamespace = state.sessionNamespace; }
      if (++state.eventPending > 128) { state.error = 'Event retention backlog limit exceeded'; state.eventPending--; return; } state.maxEventPending = Math.max(state.maxEventPending, state.eventPending); void (window as any).retainMixtureEvents({ batchIndex: state.eventBatchIndex++, segment: state.segment, sessionNamespace: state.sessionNamespace, receiveContextTime, receiveBrowserMonotonicMs, events }).catch((error: unknown) => state.error = String(error)).finally(() => state.eventPending--); };
    state.product.connect(observer, 0, 0); media.connect(observer, 0, 1); observer.connect(ctx.destination);
    return { sampleRate: ctx.sampleRate, inputLabel: track.label, inputSettings: track.getSettings(), sinkId: (ctx as any).sinkId, graph: 'normal production destination plus parallel pre-device tap; input1 exact SPAT; observer output silence; negative product-only DelayNode on audible branch, native clicks direct to destination' };
  }, { inputId: input.deviceId, outputId: output.deviceId, code: observerCode });
  const calibration = async (segment: any, phase: string) => {
    const retainedBlocksBefore = stats.blocks;
    const result = await page!.evaluate(() => { const d = (window as any).__mixture, anchor = d.ctx.currentTime + .5, clicks = []; for (let i = 0; i < 12; i++) { const buffer = d.ctx.createBuffer(1, 48, d.ctx.sampleRate); buffer.getChannelData(0).fill(.3); const node = d.ctx.createBufferSource(); node.buffer = buffer; node.connect(d.ctx.destination); const time = anchor + i * .3; node.start(time); clicks.push({ expectedContextTime: time, amplitude: .3, samples: 48 }); } return { scheduledAtContextTime: d.ctx.currentTime, scheduledAtBrowserMonotonicMs: performance.now(), clicks, bypassesProductDelayAndTap: true }; });
    await page!.waitForTimeout(4200); segment['calibration' + phase] = { ...result, retainedBlocksBefore, retainedBlocksAfter: stats.blocks, noProductPCMFit: true };
  };
  for (let index = 0; index < plan.length; index++) {
    const specification = plan[index], fixtureBytes = fs.readFileSync(path.join(snapshot, 'fixtures', specification.fixture + '.json')), scene = JSON.parse(fixtureBytes.toString()) as Scene;
    const segment: any = { index, ...specification, scene, fixtureSha256: sha(fixtureBytes), stalls: [], snapshots: [], status: 'preparing', acceptancePassed: false, qualificationPassed: false }; report.segments.push(segment); save('report.json', report); fs.writeFileSync(path.join(root, 'segment-' + index + '-fixture.json'), fixtureBytes);
    await page.evaluate(({ scene, index, delaySeconds }) => { const b = (window as any).__bongo, d = (window as any).__mixture; b.load(scene); d.segment = index; d.firstEmission = null; d.firstEmissionSessionNamespace = null; if (delaySeconds) { d.product.disconnect(d.ctx.destination); d.delay = d.ctx.createDelay(1); d.delay.delayTime.value = delaySeconds; d.product.connect(d.delay); d.delay.connect(d.ctx.destination); } }, { scene, index, delaySeconds: specification.delaySeconds });
    await page.waitForTimeout(1000); await calibration(segment, 'Before');
    segment.nodeMonotonicPlayRequestMs = performance.now(); segment.playRequestContextTime = await page.evaluate(() => (window as any).__mixture.ctx.currentTime); await page.locator('#play').click();
    await page.waitForFunction(() => { const b = (window as any).__bongo, d = (window as any).__mixture; return !!d.firstEmission || !!d.error || ['error', 'interrupted'].includes(b.audio.state) || d.ctx.state !== 'running'; }, null, { timeout: 5000, polling: 5 });
    segment.activationFirstEmissionSnapshot = { ...await captureState(), retained: { ...stats } };
    if (!segment.activationFirstEmissionSnapshot.firstEmission || segment.activationFirstEmissionSnapshot.observer?.error || ['error', 'interrupted'].includes(segment.activationFirstEmissionSnapshot.audioState) || segment.activationFirstEmissionSnapshot.contextState !== 'running') throw Error('Audio or observer failed before the first emission.');
    segment.firstEmission = await page.evaluate(() => (window as any).__mixture.firstEmission); segment.transportEpochContextTime = segment.firstEmission.event.time;
    segment.transportEpochFrame = Math.round(segment.transportEpochContextTime * report.setup.sampleRate);
    segment.fixedAnalysisWindowContextStart = segment.transportEpochContextTime;
    segment.fixedAnalysisWindowContextEnd = segment.transportEpochContextTime + specification.seconds;
    segment.actualSessionNamespace = segment.activationFirstEmissionSnapshot.firstEmissionSessionNamespace;
    segment.activationSnapshots = [];
    const activationStartMs = performance.now();
    while (true) {
      const state = await captureState();
      const activation = { ...state, elapsedMonotonicMs: performance.now() - activationStartMs, retained: { ...stats } };
      segment.activationSnapshots.push(activation);
      if (activation.observer?.error || ['error', 'interrupted'].includes(activation.audioState ?? '') || activation.contextState !== 'running') throw Error('Audio or observer failed while awaiting current-session running telemetry.');
      if (activation.elapsedMonotonicMs >= 5000) throw Error('Current-session running telemetry did not arrive within 5 seconds.');
      if (activation.audio?.running && activation.audio.session !== segment.actualSessionNamespace) throw Error('Running telemetry belongs to a different emission session.');
      if (activation.audio?.running && activation.audio.session === segment.actualSessionNamespace) break;
      await page.waitForTimeout(5);
    }
    segment.activationWaitMonotonicMs = performance.now() - activationStartMs;
    save('report.json', report);
    segment.nodeMonotonicTimerStartMs = performance.now(); segment.startedAt = new Date().toISOString(); segment.timerContextStart = segment.transportEpochContextTime; segment.captureFirstRetainedObserverIndexAtTimerStart = stats.blocks; segment.status = 'capturing';
    const independent = fixtureOracle(scene, vertices, segment.transportEpochContextTime, specification.seconds, 48000), groups = onsetGroups(independent);
    segment.independentExpectedGroupCount = groups.length;
    const audibleGroups = groups.filter(group => group.voices.some(voice => voice.level > 0 && !erasedBeforeSound(voice)));
    const stallTargets = specification.fixture === 'F06' || specification.fixture === 'F08' ? [
      { durationMs: 100, beforeGroupMs: 25, group: audibleGroups.find(group => group.onset >= segment.transportEpochContextTime + 8) },
      { durationMs: 250, beforeGroupMs: 80, group: audibleGroups.find(group => group.onset >= segment.transportEpochContextTime + 12) },
    ] : [];
    if (stallTargets.some(target => !target.group)) throw Error('Independent fixture group unavailable for defined stall.');
    let nextStall = 0, nextProgress = 0, previousBlocks = -1;
    while (performance.now() - segment.nodeMonotonicTimerStartMs < specification.seconds * 1000) {
      const health = await page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__mixture; return { contextTime: d.ctx.currentTime, contextState: d.ctx.state, audioState: b.audio.state, error: d.error }; });
      if (health.error || ['error', 'interrupted'].includes(health.audioState) || health.contextState !== 'running') throw Error('Audio or observer failed during the fixed product window.');
      const contextTime = health.contextTime, target = stallTargets[nextStall];
      if (target && contextTime >= target.group!.onset - target.beforeGroupMs / 1000) {
        const nodeBefore = performance.now();
        const actual = await page.evaluate(durationMs => { const d = (window as any).__mixture, startContextTime = d.ctx.currentTime, startBrowserMonotonicMs = performance.now(); while (performance.now() - startBrowserMonotonicMs < durationMs) { /* Deliberate measured main-thread stall. */ } return { startContextTime, endContextTime: d.ctx.currentTime, startBrowserMonotonicMs, endBrowserMonotonicMs: performance.now() }; }, target.durationMs);
        segment.stalls.push({ durationMs: target.durationMs, independentlyExpectedGroupOnset: target.group!.onset, independentLogicalVoiceCount: target.group!.voices.length, nodeMonotonicBeforeMs: nodeBefore, nodeMonotonicAfterMs: performance.now(), ...actual, expectedGroupWithinActualContextStall: actual.startContextTime <= target.group!.onset && target.group!.onset <= actual.endContextTime, actualBrowserStallDurationMs: actual.endBrowserMonotonicMs - actual.startBrowserMonotonicMs });
        if (!segment.stalls.at(-1).expectedGroupWithinActualContextStall || segment.stalls.at(-1).actualBrowserStallDurationMs < target.durationMs) throw Error('Defined stall missed its fixed independent group or duration.');
        nextStall++;
      }
      const elapsed = performance.now() - segment.nodeMonotonicTimerStartMs;
      if (elapsed >= nextProgress) {
        const status = await page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__mixture; return { audio: b.status, contextTime: d.ctx.currentTime, observer: { error: d.error, pending: d.pending, eventPending: d.eventPending, maxPending: d.maxPending, maxEventPending: d.maxEventPending } }; });
        segment.snapshots.push({ elapsedMonotonicSeconds: elapsed / 1000, ...status, retained: { ...stats } }); save('report.json', report);
        if (!status.audio.running || status.audio.session !== segment.actualSessionNamespace || status.observer.error || stats.blocks <= previousBlocks) throw Error('Playback or recorder stopped.'); previousBlocks = stats.blocks;
        console.log('MIXTURE_PROGRESS ' + JSON.stringify({ index, fixture: specification.fixture, variant: specification.variant, elapsedSeconds: elapsed / 1000, blocks: stats.blocks, error: status.observer.error })); nextProgress += 10000;
      }
      await page.waitForTimeout(5);
    }
    segment.elapsedMonotonicSeconds = (performance.now() - segment.nodeMonotonicTimerStartMs) / 1000;
    segment.nodeMonotonicTimerEndMs = performance.now(); segment.timerContextEnd = await page.evaluate(() => (window as any).__mixture.ctx.currentTime); segment.endedAt = new Date().toISOString();
    segment.finalState = await page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__mixture; return { audio: b.status, observer: { error: d.error, pending: d.pending, eventPending: d.eventPending, maxPending: d.maxPending, maxEventPending: d.maxEventPending } }; });
    if (!segment.finalState.audio.running || segment.finalState.audio.session !== segment.actualSessionNamespace || segment.finalState.observer.error || stats.blocks <= previousBlocks || segment.stalls.length !== stallTargets.length) throw Error('Incomplete final segment capture.');
    await page.waitForTimeout(200); await page.evaluate(() => (window as any).__bongo.audio.pause()); await page.waitForTimeout(1000); await calibration(segment, 'After'); segment.status = 'captured-observation'; save('report.json', report);
    console.log('MIXTURE_SEGMENT_DONE ' + JSON.stringify({ index, fixture: specification.fixture, variant: specification.variant, elapsedSeconds: segment.elapsedMonotonicSeconds, firstEmission: segment.firstEmission.event, stalls: segment.stalls }));
  }
  report.status = 'captured-observation';
} catch (error) {
  report.status = 'failed-or-interrupted'; report.errors.push(String(error)); report.failure = String(error);
  try { report.failureSnapshot = { ...await captureState(), retained: { ...stats }, at: new Date().toISOString() }; }
  catch (snapshotError) { report.failureSnapshotUnavailable = String(snapshotError); }
  save('report.json', report);
}
finally {
  try { report.cleanup = page ? await page.evaluate(async () => { const b = (window as any).__bongo, d = (window as any).__mixture; if (!d) return null; b.audio.pause(); b.audio.onEvents = d.originalOnEvents; if (d.observer) { d.product.disconnect(d.observer); d.observer.disconnect(); d.observer.port.onmessage = null; } d.media?.disconnect(); d.delay?.disconnect(); d.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop()); await d.ctx.close(); const deadline = performance.now() + 10000; while ((d.pending || d.eventPending) && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10)); if (d.pending || d.eventPending) d.error = 'Retention drain timed out'; return { pending: d.pending, eventPending: d.eventPending, maxPending: d.maxPending, maxEventPending: d.maxEventPending, error: d.error, contextState: d.ctx.state, tracksStopped: !d.stream || d.stream.getTracks().every((track: MediaStreamTrack) => track.readyState === 'ended') }; }) : null; } catch (error) { report.errors.push('Cleanup: ' + String(error)); }
  try { await browser?.close(); report.browserClosed = true; } catch (error) { report.errors.push('Browser cleanup: ' + String(error)); }
  try { if (server.listening) report.servedAfter = await attest('after'); } catch (error) { report.errors.push('Post binding: ' + String(error)); report.status = 'failed-or-interrupted'; }
  if (server.listening) await new Promise<void>(resolve => server.close(() => resolve())); report.serverClosed = !server.listening; report.finishedAt = new Date().toISOString(); report.stats = stats; save('report.json', report);
}
const blocks = fs.readFileSync(metadataFile, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
report.observedQuantumSizes = [...new Set(blocks.map(block => block.quantum))]; report.orderedIndependentIndices = blocks.every((block, index) => block.index === index);
report.rawMetadataCountsMatch = stats.sourceSamples * 4 === fs.statSync(sourceFile).size && stats.inputSamples * 4 === fs.statSync(inputFile).size;
function originalInterval(start: number, end: number) {
  const first = blocks.findIndex(block => block.currentTime + block.quantum / 48000 > start);
  let last = -1; for (let index = blocks.length - 1; index >= 0; index--) if (blocks[index].currentTime < end) { last = index; break; }
  const selected = first >= 0 && last >= first ? blocks.slice(first, last + 1) : [];
  return { firstOriginalObserverIndex: selected[0]?.index, lastOriginalObserverIndex: selected.at(-1)?.index, blocks: selected.length,
    pathsComplete: selected.length > 0 && selected.every(block => block.quantum === 128 && block.sourceLength === 128 && block.inputLength === 128 && block.sourceChannels >= 1 && block.inputChannels >= 1),
    contextCovered: selected.length > 0 && Number.isFinite(start) && Number.isFinite(end) && end > start
      && selected[0].currentTime <= start + .01 / 48000
      && selected.at(-1).currentTime + selected.at(-1).quantum / 48000 >= end - .01 / 48000
      && selected.reduce((samples, block) => samples + block.quantum, 0) >= (end - start) * 48000 - .01 };
}
for (const segment of report.segments) {
  const actual = originalInterval(segment.timerContextStart, segment.timerContextEnd), analysis = originalInterval(segment.fixedAnalysisWindowContextStart, segment.fixedAnalysisWindowContextEnd);
  segment.firstOriginalObserverIndex = actual.firstOriginalObserverIndex; segment.lastOriginalObserverIndex = actual.lastOriginalObserverIndex; segment.observedTimedBlocks = actual.blocks;
  segment.firstAnalysisObserverIndex = analysis.firstOriginalObserverIndex; segment.lastAnalysisObserverIndex = analysis.lastOriginalObserverIndex; segment.analysisBlocks = analysis.blocks;
  segment.analysisSupport = originalInterval(segment.fixedAnalysisWindowContextStart, segment.fixedAnalysisWindowContextEnd + .2);
  segment.lagTailSupportSeconds = .2;
  segment.calibrationSupport = ['Before', 'After'].map(phase => { const cal = segment['calibration' + phase], clicks = cal?.clicks ?? []; return { phase, ...originalInterval((clicks[0]?.expectedContextTime ?? NaN) - .05, (clicks.at(-1)?.expectedContextTime ?? NaN) + .25) }; });
  segment.fullTimerCovered = actual.contextCovered && actual.pathsComplete && analysis.pathsComplete;
  segment.requiredPathsComplete = segment.analysisSupport.contextCovered && segment.analysisSupport.pathsComplete && segment.calibrationSupport.every((support: any) => support.contextCovered && support.pathsComplete);
  segment.stallInterventionsValid = segment.stalls.every((stall: any) => stall.expectedGroupWithinActualContextStall && stall.actualBrowserStallDurationMs >= stall.durationMs);
}
for (const [name, file] of [['product-tap', sourceFile], ['virtual-input', inputFile]]) {
  const bytes = fs.readFileSync(file), header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(36 + bytes.length, 4); header.write('WAVE', 8); header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(3, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(48000, 24); header.writeUInt32LE(192000, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(32, 34); header.write('data', 36); header.writeUInt32LE(bytes.length, 40); fs.writeFileSync(path.join(root, name + '.wav'), Buffer.concat([header, bytes])); report[name + 'RawSha256'] = sha(bytes);
}
report.captureErrorFree = report.status === 'captured-observation' && report.errors.length === 0 && !report.cleanup?.error && stats.nonfinite === 0 && report.orderedIndependentIndices && report.rawMetadataCountsMatch && report.segments.length === plan.length && report.segments.every((segment: any) => segment.status === 'captured-observation' && segment.elapsedMonotonicSeconds >= segment.seconds && segment.fullTimerCovered && segment.requiredPathsComplete && segment.stallInterventionsValid);
save('report.json', report);
const manifest: Record<string, { bytes: number; sha256: string }> = {};
for (const name of fs.readdirSync(root)) if (name !== 'manifest.json' && fs.statSync(path.join(root, name)).isFile()) { const bytes = fs.readFileSync(path.join(root, name)); manifest[name] = { bytes: bytes.length, sha256: sha(bytes) }; } save('manifest.json', manifest);
console.log('MIXTURE_DONE ' + JSON.stringify({ status: report.status, captureErrorFree: report.captureErrorFree, segments: report.segments.map((segment: any) => ({ fixture: segment.fixture, variant: segment.variant, firstEmission: segment.firstEmission, fullTimerCovered: segment.fullTimerCovered, observedTimedBlocks: segment.observedTimedBlocks })), acceptancePassed: false }));
if (!report.captureErrorFree) process.exitCode = 1;
