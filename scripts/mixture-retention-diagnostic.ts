import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { chromium, type Browser, type BrowserServer, type Page } from '@playwright/test';

// Diagnostic controls only: production, original qualification harness and its
// limits are untouched. Fixed ordering is not a randomized causal experiment.
const root = path.resolve('evidence/step-05/retention-diagnostic/attempt-01');
if (process.argv.length !== 2) throw Error('This bounded diagnostic takes no arguments.');
if (fs.existsSync(root) && fs.readdirSync(root).length) throw Error('Existing evidence will not be overwritten.');
fs.mkdirSync(root, { recursive: true });
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const save = (name: string, value: unknown) => fs.writeFileSync(path.join(root, name), JSON.stringify(value, null, 2) + '\n');
const snapshot = path.join(root, 'source'); fs.mkdirSync(snapshot);
for (const name of ['index.html', 'icon.svg', 'assets', 'fixtures']) fs.cpSync(path.join('dist', name), path.join(snapshot, name), { recursive: true });
const html = fs.readFileSync(path.join(snapshot, 'index.html'), 'utf8'), mainReference = html.match(/<script[^>]*src="([^"]+)"/)?.[1];
if (!mainReference?.startsWith('/BongoPlanet/assets/')) throw Error('Unexpected production main path.');
const mainName = mainReference.slice('/BongoPlanet/'.length), processorNames = fs.readdirSync(path.join(snapshot, 'assets')).filter(name => /^processor-.+\.js$/.test(name));
if (processorNames.length !== 1) throw Error('Expected one production processor.');
const processorName = 'assets/' + processorNames[0], mainHash = hash(fs.readFileSync(path.join(snapshot, mainName))), processorHash = hash(fs.readFileSync(path.join(snapshot, processorName)));
if (mainHash !== '3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207' || processorHash !== '0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793') throw Error('Frozen production asset binding changed.');
const fixtureBytes = fs.readFileSync(path.join(snapshot, 'fixtures/F06.json')), scene = JSON.parse(fixtureBytes.toString());
fs.writeFileSync(path.join(root, 'F06.json'), fixtureBytes);
const harnessBytes = fs.readFileSync('scripts/mixture-retention-diagnostic.ts'); fs.writeFileSync(path.join(root, 'diagnostic-harness.ts'), harnessBytes);
const arms = [
  { name: 'baseline', observer: false, pcm: false, events: false },
  { name: 'observer-only', observer: true, pcm: false, events: false },
  { name: 'pcm-only', observer: true, pcm: true, events: false },
  { name: 'events-only', observer: false, pcm: false, events: true },
  { name: 'combined', observer: true, pcm: true, events: true },
];
const requestedSeconds = 16, softDeadlineMs = 110000, hardDeadlineMs = 120000;
const report: any = { title: 'Bongo Planet F06 retention diagnostic', diagnosticOnly: true, qualificationPassed: false, acceptancePassed: false, createdAt: new Date().toISOString(), status: 'preparing', mainAsset: mainName, processorAsset: processorName, mainHash, processorHash, fixtureSha256: hash(fixtureBytes), scene, harnessSha256: hash(harnessBytes), arms, requestedSeconds, softDeadlineMs, hardDeadlineMs, stages: [], errors: [], limitations: ['Fresh page/context for each arm; fixed ordering and shared browser process remain confounds.', 'Original handler duration covers synchronous onEvents only; deferred UI/render/GPU/GC costs are separate.', 'Expose-function invocation includes internal protocol serialization; its internals cannot be separated by this API.', 'Node callback entry is the first observed arrival, not transport arrival or queue admission.', 'Browser and Node monotonic clocks remain separate; no transit subtraction or timing gate.', 'No native click calibration or product onset qualification in this diagnostic.'] };
const probeStart = performance.now();
const nodeHeartbeats: Array<{ nodeMonotonicMs: number; elapsedMs: number }> = [];
let lastNodeHeartbeat = performance.now();
const nodeHeartbeat = setInterval(() => { const now = performance.now(); if (nodeHeartbeats.length < 4096) nodeHeartbeats.push({ nodeMonotonicMs: now, elapsedMs: now - lastNodeHeartbeat }); lastNodeHeartbeat = now; }, 50);
report.limitations.push('Diagnostic timers, traces, wrapper checks and trace serialization perturb the workload; these are measured controls, not an uninstrumented acceptance rerun.');
let browser: Browser | undefined, browserServer: BrowserServer | undefined, page: Page | undefined;
let watchdog: ReturnType<typeof setTimeout> | undefined;
const observerCode = [
  'class RetentionObserver extends AudioWorkletProcessor {',
  'constructor(){super();this.index=0;this.sequence=0;this.blocks=[];this.source=[];this.input=[];}',
  'process(inputs,outputs){for(const c of outputs[0]||[])c.fill(0);',
  'const source=inputs[0]?.[0]||new Float32Array(0),input=inputs[1]?.[0]||new Float32Array(0);',
  'this.blocks.push({index:this.index++,currentFrame,currentTime,quantum:outputs[0]?.[0]?.length||0,sourceLength:source.length,inputLength:input.length,sourceChannels:inputs[0]?.length||0,inputChannels:inputs[1]?.length||0});this.source.push(new Float32Array(source));this.input.push(new Float32Array(input));',
  'if(this.blocks.length===32){const join=a=>{const b=new Float32Array(a.reduce((n,c)=>n+c.length,0));let o=0;for(const c of a){b.set(c,o);o+=c.length;}return b;};const source=join(this.source),input=join(this.input);this.port.postMessage({sequence:this.sequence++,blocks:this.blocks,source,input},[source.buffer,input.buffer]);this.blocks=[];this.source=[];this.input=[];}return true;}}',
  "registerProcessor('retention-observer',RetentionObserver);",
].join('\n');
fs.writeFileSync(path.join(root, 'observer-worklet.js'), observerCode); report.observerSha256 = hash(Buffer.from(observerCode));
const server = http.createServer((request, response) => {
  const url = decodeURIComponent((request.url ?? '/').split('?')[0]), relative = url.startsWith('/BongoPlanet/') ? url.slice('/BongoPlanet/'.length) || 'index.html' : null;
  const file = relative === null ? '' : path.resolve(snapshot, relative);
  if (!file.startsWith(snapshot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' } as Record<string, string>)[path.extname(file)] ?? 'application/octet-stream'); fs.createReadStream(file).pipe(response);
});
async function attest(phase: string) {
  const base = 'http://127.0.0.1:5420/BongoPlanet/', servedHtml = await (await fetch(base)).text();
  const fetchedMain = Buffer.from(await (await fetch(new URL(mainReference!, base))).arrayBuffer()), fetchedProcessor = Buffer.from(await (await fetch(base + processorName)).arrayBuffer());
  if (hash(fetchedMain) !== mainHash || hash(fetchedProcessor) !== processorHash || servedHtml.match(/<script[^>]*src="([^"]+)"/)?.[1] !== mainReference) throw Error('Actual HTTP production binding mismatch.');
  fs.writeFileSync(path.join(root, 'served-' + phase + '.html'), servedHtml);
  return { at: new Date().toISOString(), mainHash: hash(fetchedMain), processorHash: hash(fetchedProcessor), htmlSha256: hash(Buffer.from(servedHtml)) };
}
async function bounded<T>(promise: Promise<T>, ms = softDeadlineMs - (performance.now() - probeStart)): Promise<T> {
  if (ms <= 0) throw Error('Global diagnostic deadline exceeded.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('Diagnostic operation deadline exceeded.')), ms); })]); }
  finally { if (timer) clearTimeout(timer); }
}
try {
  await bounded(new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(5420, '127.0.0.1', resolve); })); report.servedBefore = await bounded(attest('before'));
  browserServer = await chromium.launchServer({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, ignoreDefaultArgs: ['--mute-audio'], args: ['--enable-automation', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  report.ownedBrowserPid = browserServer.process().pid;
  watchdog = setTimeout(() => { report.hardDeadlineReached = true; browserServer?.process().kill('SIGTERM'); }, Math.max(1, hardDeadlineMs - (performance.now() - probeStart)));
  browser = await bounded(chromium.connect(browserServer.wsEndpoint())); report.browser = browser.version();
  report.browserArguments = (await bounded((await browser.newBrowserCDPSession()).send('Browser.getBrowserCommandLine'))).arguments;
  if (report.browserArguments.includes('--mute-audio')) throw Error('Chrome unexpectedly muted.');
  for (const arm of arms) {
    if (performance.now() - probeStart >= softDeadlineMs) throw Error('Global diagnostic deadline exceeded before next arm.');
    const nodeCallbacks: any[] = [];
    const stage: any = { ...arm, status: 'preparing', requestedSeconds, nodeStartedAtMonotonicMs: performance.now(), errors: [], stats: { pcmBatches: 0, pcmBlocks: 0, sourceSamples: 0, inputSamples: 0, eventBatches: 0, events: 0, nonfinite: 0 } }; report.stages.push(stage); save('report.json', report);
    const directory = path.join(root, arm.name); fs.mkdirSync(directory);
    for (const name of ['product-tap.f32', 'virtual-input.f32', 'quantums.jsonl', 'events.jsonl']) fs.writeFileSync(path.join(directory, name), '');
    const context = await bounded(browser.newContext({ viewport: { width: 1360, height: 820 } })); await bounded(context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5420' }));
    page = await bounded(context.newPage()); await bounded(page.addInitScript('globalThis.__name=fn=>fn;'));
    page.on('pageerror', error => stage.errors.push(String(error)));
    function nodeTrace(trace: any) { if (nodeCallbacks.length >= 4096) throw Error('Bounded Node trace exhausted.'); nodeCallbacks.push(trace); }
    await bounded(page.exposeFunction('retainDiagnosticPCM', (batch: any) => {
      const arrivalObservedAtCallbackEntryMs = performance.now(), trace: any = { kind: 'pcm', sequence: batch.sequence, arrivalObservedAtCallbackEntryMs, conversionStartMs: performance.now() };
      try {
        if (batch.sequence !== stage.stats.pcmBatches || batch.blocks[0]?.index !== stage.stats.pcmBlocks) throw Error('PCM retention sequence/index mismatch.');
        const source = Float32Array.from(batch.source), input = Float32Array.from(batch.input); trace.conversionEndMs = performance.now();
        if (batch.blocks.reduce((n: number, b: any) => n + b.sourceLength, 0) !== source.length || batch.blocks.reduce((n: number, b: any) => n + b.inputLength, 0) !== input.length) throw Error('Atomic PCM/metadata mismatch.');
        trace.jsonStartMs = performance.now(); const lines: string[] = [];
        for (const block of batch.blocks) { if (block.index !== stage.stats.pcmBlocks++) throw Error('Independent PCM index changed.'); lines.push(JSON.stringify({ ...block, sourceOffset: stage.stats.sourceSamples, inputOffset: stage.stats.inputSamples })); stage.stats.sourceSamples += block.sourceLength; stage.stats.inputSamples += block.inputLength; }
        const metadata = lines.join('\n') + '\n'; trace.jsonEndMs = performance.now(); trace.rawBytes = source.byteLength + input.byteLength; trace.metadataBytes = Buffer.byteLength(metadata); trace.appendStartMs = performance.now();
        fs.appendFileSync(path.join(directory, 'product-tap.f32'), Buffer.from(source.buffer)); fs.appendFileSync(path.join(directory, 'virtual-input.f32'), Buffer.from(input.buffer)); fs.appendFileSync(path.join(directory, 'quantums.jsonl'), metadata); trace.appendEndMs = performance.now();
        for (const value of source) if (!Number.isFinite(value)) stage.stats.nonfinite++;
        for (const value of input) if (!Number.isFinite(value)) stage.stats.nonfinite++;
        stage.stats.pcmBatches++; if (stage.stats.nonfinite) throw Error('Nonfinite actual PCM.');
      } catch (error) { trace.error = String(error); stage.errors.push(trace.error); throw error; }
      finally { trace.exitMs = performance.now(); nodeTrace(trace); }
    }));
    await bounded(page.exposeFunction('retainDiagnosticEvents', (batch: any) => {
      const arrivalObservedAtCallbackEntryMs = performance.now(), trace: any = { kind: 'events', sequence: batch.sequence, records: batch.events.length, arrivalObservedAtCallbackEntryMs, jsonStartMs: performance.now() };
      try {
        if (batch.sequence !== stage.stats.eventBatches) throw Error('Event retention sequence changed.');
        const text = batch.events.map((event: any, index: number) => JSON.stringify({ independentEventIndex: stage.stats.events + index, eventBatchIndex: batch.sequence, receiveContextTime: batch.receiveContextTime, receiveBrowserMonotonicMs: batch.receiveBrowserMonotonicMs, event })).join('\n') + '\n'; trace.jsonEndMs = performance.now(); trace.jsonBytes = Buffer.byteLength(text); trace.appendStartMs = performance.now();
        fs.appendFileSync(path.join(directory, 'events.jsonl'), text); trace.appendEndMs = performance.now(); stage.stats.events += batch.events.length; stage.stats.eventBatches++;
      } catch (error) { trace.error = String(error); stage.errors.push(trace.error); throw error; }
      finally { trace.exitMs = performance.now(); nodeTrace(trace); }
    }));
    try {
      await bounded(page.goto('http://127.0.0.1:5420/BongoPlanet/')); await bounded(page.waitForFunction(() => !!(window as any).__bongo));
      await bounded(page.locator('#enable').click()); await bounded(page.waitForFunction(() => !!(window as any).__bongo.audio.node));
      const devices = await bounded(page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId }))));
      stage.devices = devices;
      const output = devices.find(d => d.kind === 'audiooutput' && d.label === 'SPAT 8ch loopback (Virtual)'), input = devices.find(d => d.kind === 'audioinput' && d.label === 'SPAT 8ch loopback (Virtual)');
      if (!output || (arm.observer && !input)) throw Error('Exact SPAT route absent; no default or microphone fallback.');
      stage.setup = await bounded(page.evaluate(async ({ arm, scene, code, inputId, outputId }) => {
        const b = (window as any).__bongo, ctx: AudioContext = b.audio.context; await (ctx as any).setSinkId(outputId); if (ctx.sampleRate !== 48000) throw Error('Unexpected sample rate.');
        b.load(scene);
        const d: any = { ctx, arm, trace: [], error: null, firstOverflow: null, firstEmission: null, firstEmissionSession: null, session: null, pcmPending: 0, eventPending: 0, maxPCM: 0, maxEvents: 0, eventSequence: 0, eventDispatches: 0, pcmDispatches: 0, observerBatches: 0, exposureObserverBatches: 0, exposureObserverBlocks: 0, exposureEventRecords: 0, eventRecords: 0, exposure: false, originalOnEvents: b.audio.onEvents, observer: null, stream: null, media: null, stopped: false };
        (window as any).__retentionDiagnostic = d;
        d.record = (record: any) => { if (d.trace.length < 12000) d.trace.push(record); else d.fail('Browser diagnostic trace cap reached', { kind: 'trace' }); };
        d.fail = (message: string, details: any) => { if (d.error) return; d.error = message; const record = { kind: 'first-error', message, ...details, browserMonotonicMs: performance.now(), contextTime: ctx.currentTime, pcmPending: d.pcmPending, eventPending: d.eventPending }; d.firstError = record; if (details.kind === 'pcm-overflow' || details.kind === 'event-overflow') d.firstOverflow = record; if (d.trace.length < 12000) d.trace.push(record); b.audio.pause(); };
        b.audio.onEvents = (events: any[]) => {
          const receiveBrowserMonotonicMs = performance.now(), receiveContextTime = ctx.currentTime;
          const reset = events.find(event => event.type === 'reset'), trigger = events.find(event => event.type === 'trigger' || event.type === 'onset'); d.session = reset?.session ?? trigger?.trigger.session ?? d.session;
          const first = events.find(event => event.type === 'emission'); if (!d.firstEmission && first) { d.firstEmission = { event: structuredClone(first), receiveBrowserMonotonicMs, receiveContextTime }; d.firstEmissionSession = d.session; }
          const handlerStartMs = performance.now();
          try { d.originalOnEvents?.(events); }
          catch (error) { d.fail(String(error), { kind: 'original-handler' }); throw error; }
          finally { d.record({ kind: 'original-handler', receiveBrowserMonotonicMs, receiveContextTime, handlerStartMs, handlerEndMs: performance.now(), records: events.length, exposure: d.exposure }); }
          d.eventRecords += events.length;
          if (d.exposure && events.length) { d.exposureEventRecords += events.length; d.exposureEventBatches = (d.exposureEventBatches ?? 0) + 1; d.exposureEventFirstContextTime ??= receiveContextTime; d.exposureEventLastContextTime = receiveContextTime; }
          if (!arm.events || d.error || d.stopped) return;
          const sequence = d.eventSequence++;
          if (d.eventPending >= 128) { d.fail('Event retention backlog limit exceeded', { kind: 'event-overflow', sequence, records: events.length, receiveBrowserMonotonicMs, receiveContextTime }); return; }
          d.eventPending++; d.maxEvents = Math.max(d.maxEvents, d.eventPending);
          const payloadStartMs = performance.now(), payload = { sequence, receiveBrowserMonotonicMs, receiveContextTime, events }, payloadEndMs = performance.now(), dispatchStartMs = performance.now();
          const promise = (window as any).retainDiagnosticEvents(payload), dispatchEndMs = performance.now();
          d.eventDispatches++;
          d.record({ kind: 'event-dispatch', sequence, records: events.length, payloadStartMs, payloadEndMs, dispatchStartMs, dispatchEndMs, pcmPending: d.pcmPending, eventPending: d.eventPending });
          void promise.then(() => d.record({ kind: 'event-settlement', sequence, settledBrowserMonotonicMs: performance.now(), success: true })).catch((error: unknown) => { d.record({ kind: 'event-settlement', sequence, settledBrowserMonotonicMs: performance.now(), success: false, error: String(error) }); d.fail(String(error), { kind: 'event-retention', sequence }); }).finally(() => d.eventPending--);
        };
        let lastHeartbeat = performance.now(); d.heartbeat = setInterval(() => { const now = performance.now(); d.record({ kind: 'heartbeat', browserMonotonicMs: now, elapsedMs: now - lastHeartbeat, contextTime: ctx.currentTime, pcmPending: d.pcmPending, eventPending: d.eventPending }); lastHeartbeat = now; }, 50);
        let lastFrame: number | null = null; const frame = (timestamp: number) => { if (d.stopped) return; const now = performance.now(); d.record({ kind: 'frame', timestamp, browserMonotonicMs: now, gapMs: lastFrame === null ? null : timestamp - lastFrame }); lastFrame = timestamp; d.raf = requestAnimationFrame(frame); }; d.raf = requestAnimationFrame(frame);
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) { d.longtaskObserver = new PerformanceObserver(list => { for (const entry of list.getEntries()) d.record({ kind: 'longtask', startTimeMs: entry.startTime, durationMs: entry.duration, name: entry.name }); }); d.longtaskObserver.observe({ type: 'longtask', buffered: true }); }
        if (arm.observer) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { deviceId: { exact: inputId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 1 }, sampleRate: { ideal: 48000 } } }); d.stream = stream;
          const track = stream.getAudioTracks()[0]; if (track.getSettings().deviceId !== inputId || track.label !== 'SPAT 8ch loopback (Virtual)') throw Error('Named input identity mismatch.');
          const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
          const observer = new AudioWorkletNode(ctx, 'retention-observer', { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [1], channelCountMode: 'max' }); d.observer = observer; d.media = ctx.createMediaStreamSource(stream);
          observer.onprocessorerror = () => d.fail('Observer processorerror', { kind: 'observer' });
          observer.port.onmessage = ({ data }) => {
            const receiveBrowserMonotonicMs = performance.now(), receiveContextTime = ctx.currentTime;
            if (data.sequence !== d.observerBatches || data.blocks[0]?.index !== d.observerBatches * 32 || data.blocks.some((block: any, index: number) => block.index !== d.observerBatches * 32 + index)) { d.fail('Observer independent sequence/index changed', { kind: 'observer-order', sequence: data.sequence, firstIndex: data.blocks[0]?.index }); return; }
            d.observerBatches++;
            d.record({ kind: 'observer-batch', sequence: data.sequence, firstIndex: data.blocks[0]?.index, lastIndex: data.blocks.at(-1)?.index, blocks: data.blocks, records: data.blocks.length, sourceSamples: data.source.length, inputSamples: data.input.length, rawBytes: data.source.byteLength + data.input.byteLength, receiveBrowserMonotonicMs, receiveContextTime, exposure: d.exposure });
            if (d.exposure && (data.blocks.length !== 32 || data.blocks.some((block: any) => block.quantum !== 128 || block.sourceLength !== 128 || block.inputLength !== 128 || !block.sourceChannels || !block.inputChannels))) { d.fail('Actual exposed PCM path missing/short', { kind: 'pcm-path', sequence: data.sequence, firstIndex: data.blocks[0]?.index }); return; }
            if (d.exposure) { d.exposureObserverBatches++; d.exposureObserverBlocks += data.blocks.length; d.exposureObserverFirstIndex ??= data.blocks[0].index; d.exposureObserverLastIndex = data.blocks.at(-1).index; d.exposureObserverFirstContextTime ??= data.blocks[0].currentTime; d.exposureObserverLastContextEnd = data.blocks.at(-1).currentTime + data.blocks.at(-1).quantum / ctx.sampleRate; }
            if (!arm.pcm || d.error || d.stopped) return;
            if (d.pcmPending >= 128) { d.fail('PCM retention backlog limit exceeded', { kind: 'pcm-overflow', sequence: data.sequence, firstIndex: data.blocks[0]?.index, lastIndex: data.blocks.at(-1)?.index, receiveBrowserMonotonicMs, receiveContextTime }); return; }
            d.pcmPending++; d.maxPCM = Math.max(d.maxPCM, d.pcmPending);
            const payloadStartMs = performance.now(), payload = { ...data, source: Array.from(data.source), input: Array.from(data.input) }, payloadEndMs = performance.now(), dispatchStartMs = performance.now();
            const promise = (window as any).retainDiagnosticPCM(payload), dispatchEndMs = performance.now();
            d.pcmDispatches++;
            d.record({ kind: 'pcm-dispatch', sequence: data.sequence, firstIndex: data.blocks[0]?.index, payloadStartMs, payloadEndMs, dispatchStartMs, dispatchEndMs, pcmPending: d.pcmPending, eventPending: d.eventPending });
            void promise.then(() => d.record({ kind: 'pcm-settlement', sequence: data.sequence, settledBrowserMonotonicMs: performance.now(), success: true })).catch((error: unknown) => { d.record({ kind: 'pcm-settlement', sequence: data.sequence, settledBrowserMonotonicMs: performance.now(), success: false, error: String(error) }); d.fail(String(error), { kind: 'pcm-retention', sequence: data.sequence }); }).finally(() => d.pcmPending--);
          };
          b.audio.node.connect(observer, 0, 0); d.media.connect(observer, 0, 1); observer.connect(ctx.destination);
        }
        return { contextSampleRate: ctx.sampleRate, sinkId: (ctx as any).sinkId, inputOpened: !!d.stream, inputLabel: d.stream?.getAudioTracks()[0]?.label ?? null, inputSettings: d.stream?.getAudioTracks()[0]?.getSettings() ?? null, graph: arm.observer ? 'unchanged product destination plus parallel pre-device tap; exact SPAT input; silent observer output' : 'unchanged production graph; no input opened' };
      }, { arm, scene, code: observerCode, inputId: input?.deviceId ?? '', outputId: output.deviceId }));
      await bounded(page.waitForTimeout(500)); stage.playRequestNodeMonotonicMs = performance.now(); stage.playRequest = await bounded(page.evaluate(() => ({ browserMonotonicMs: performance.now(), contextTime: (window as any).__retentionDiagnostic.ctx.currentTime })));
      await bounded(page.locator('#play').click());
      await bounded(page.waitForFunction(() => { const b = (window as any).__bongo, d = (window as any).__retentionDiagnostic; return !!d.error || ['error', 'interrupted'].includes(b.audio.state) || d.ctx.state !== 'running' || (!!d.firstEmission && b.status?.running && b.status.session === d.firstEmissionSession); }, null, { timeout: 5000, polling: 5 }));
      stage.activation = await bounded(page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__retentionDiagnostic; return { firstEmission: d.firstEmission, session: d.firstEmissionSession, status: b.status, audioState: b.audio.state, error: d.error, contextState: d.ctx.state }; }));
      if (!stage.activation.firstEmission || !stage.activation.status.running || stage.activation.status.session !== stage.activation.session || stage.activation.error || stage.activation.contextState !== 'running') throw Error('Arm failed before current-session running activation.');
      stage.exposureStart = await bounded(page.evaluate(() => { const d = (window as any).__retentionDiagnostic; d.exposure = true; return { browserMonotonicMs: performance.now(), contextTime: d.ctx.currentTime }; }));
      stage.exposureStartNodeMonotonicMs = performance.now(); stage.exposureStartedAt = new Date().toISOString();
      while (performance.now() - stage.exposureStartNodeMonotonicMs < requestedSeconds * 1000) {
        if (stage.errors.length) throw Error('Node retention or page error: ' + stage.errors[0]);
        const state = await bounded(page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__retentionDiagnostic; return { error: d.error, firstError: d.firstError ?? null, firstOverflow: d.firstOverflow, status: b.status, audioState: b.audio.state, contextState: d.ctx.state, pcmPending: d.pcmPending, eventPending: d.eventPending, traceRecords: d.trace.length }; })); stage.lastState = state;
        if (state.error || !state.status?.running || state.status.session !== stage.activation.session || state.contextState !== 'running' || ['error', 'interrupted'].includes(state.audioState)) throw Error('Active arm stopped or failed.');
        await bounded(page.waitForTimeout(250));
      }
      stage.finalExposureState = await bounded(page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__retentionDiagnostic; const browserMonotonicMs = performance.now(); d.exposure = false; return { browserMonotonicMs, contextTime: d.ctx.currentTime, error: d.error, firstError: d.firstError ?? null, firstOverflow: d.firstOverflow, audioState: b.audio.state, contextState: d.ctx.state, status: b.status, exposureObserverBatches: d.exposureObserverBatches, exposureObserverBlocks: d.exposureObserverBlocks, exposureObserverFirstIndex: d.exposureObserverFirstIndex ?? null, exposureObserverLastIndex: d.exposureObserverLastIndex ?? null, exposureObserverFirstContextTime: d.exposureObserverFirstContextTime ?? null, exposureObserverLastContextEnd: d.exposureObserverLastContextEnd ?? null, exposureEventRecords: d.exposureEventRecords, exposureEventBatches: d.exposureEventBatches ?? 0, exposureEventFirstContextTime: d.exposureEventFirstContextTime ?? null, exposureEventLastContextTime: d.exposureEventLastContextTime ?? null }; }));
      stage.exposureEndNodeMonotonicMs = performance.now(); stage.elapsedMonotonicSeconds = (stage.exposureEndNodeMonotonicMs - stage.exposureStartNodeMonotonicMs) / 1000; stage.elapsedBrowserMonotonicSeconds = (stage.finalExposureState.browserMonotonicMs - stage.exposureStart.browserMonotonicMs) / 1000;
      stage.observerProgression = { allowedEdgeBlocks: 64, minimumExposureBlocks: Math.floor(requestedSeconds * 48000 / 128) - 64, edgeSeconds: 64 * 128 / 48000,
        meaningful: !arm.observer || (stage.finalExposureState.exposureObserverBlocks >= Math.floor(requestedSeconds * 48000 / 128) - 64
          && stage.finalExposureState.exposureObserverLastIndex - stage.finalExposureState.exposureObserverFirstIndex + 1 === stage.finalExposureState.exposureObserverBlocks
          && stage.finalExposureState.exposureObserverFirstContextTime <= stage.exposureStart.contextTime + 64 * 128 / 48000
          && stage.finalExposureState.exposureObserverLastContextEnd >= stage.finalExposureState.contextTime - 64 * 128 / 48000) };
      if (stage.finalExposureState.error || !stage.finalExposureState.status?.running || stage.finalExposureState.status.session !== stage.activation.session || stage.finalExposureState.contextState !== 'running' || ['error', 'interrupted'].includes(stage.finalExposureState.audioState) || stage.elapsedMonotonicSeconds < requestedSeconds || stage.elapsedBrowserMonotonicSeconds < requestedSeconds || !stage.finalExposureState.exposureEventRecords || (arm.observer && !stage.finalExposureState.exposureObserverBatches)) throw Error('Final running state/exposure/required arm activity incomplete.');
      if (!stage.observerProgression.meaningful) throw Error('Observer did not progress across the full diagnostic exposure with declared edge batches.');
      stage.eventProgression = { minimumExposureBatches: 30, allowedEdgeSeconds: 1,
        meaningful: stage.finalExposureState.exposureEventBatches >= 30
          && stage.finalExposureState.exposureEventFirstContextTime <= stage.exposureStart.contextTime + 1
          && stage.finalExposureState.exposureEventLastContextTime >= stage.finalExposureState.contextTime - 1 };
      if (!stage.eventProgression.meaningful) throw Error('Original event handler did not progress throughout F06 exposure.');
      await bounded(page.waitForTimeout(150)); stage.status = 'completed-diagnostic-observation';
    } catch (error) { stage.status = 'failed-or-incomplete'; stage.errors.push(String(error)); throw error; }
    finally {
      try {
        stage.preCleanupObservation = await bounded(page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__retentionDiagnostic; return d ? { trace: d.trace, firstError: d.firstError ?? null, firstOverflow: d.firstOverflow, audioState: b.audio.state, contextState: d.ctx.state, status: b.status, pcmPending: d.pcmPending, eventPending: d.eventPending } : null; }), 1500);
        if (stage.preCleanupObservation) { fs.writeFileSync(path.join(directory, 'pre-cleanup-browser-trace.json'), JSON.stringify(stage.preCleanupObservation.trace, null, 2) + '\n'); delete stage.preCleanupObservation.trace; }
        if (stage.status === 'completed-diagnostic-observation' && (!stage.preCleanupObservation?.status?.running || stage.preCleanupObservation.status.session !== stage.activation.session || stage.preCleanupObservation.contextState !== 'running' || ['error', 'interrupted'].includes(stage.preCleanupObservation.audioState))) { stage.status = 'failed-or-incomplete'; stage.errors.push('Product failed before cleanup after final exposure snapshot'); }
      } catch (error) { stage.preCleanupObservationUnavailable = String(error); stage.status = 'failed-or-incomplete'; stage.errors.push('Final pre-cleanup state/trace observation unavailable: ' + String(error)); }
      try {
        stage.browserObservation = await bounded(page.evaluate(async () => {
          const b = (window as any).__bongo, d = (window as any).__retentionDiagnostic; if (!d) return null;
          d.exposureEnd = { browserMonotonicMs: performance.now(), contextTime: d.ctx.currentTime }; d.exposure = false; b.audio.pause(); b.audio.onEvents = d.originalOnEvents;
          if (d.observer) { b.audio.node.disconnect(d.observer); d.observer.disconnect(); d.observer.port.onmessage = null; } d.media?.disconnect(); d.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop()); await d.ctx.close();
          const deadline = performance.now() + 2000; while ((d.pcmPending || d.eventPending) && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10));
          d.stopped = true; clearInterval(d.heartbeat); cancelAnimationFrame(d.raf); d.longtaskObserver?.disconnect();
          return { trace: d.trace, firstError: d.firstError ?? null, firstOverflow: d.firstOverflow, firstEmission: d.firstEmission, exposureEnd: d.exposureEnd, error: d.error, pcmPending: d.pcmPending, eventPending: d.eventPending, maxPCM: d.maxPCM, maxEvents: d.maxEvents, observerBatches: d.observerBatches, pcmDispatches: d.pcmDispatches, eventDispatches: d.eventDispatches, eventRecords: d.eventRecords, contextState: d.ctx.state, tracksStopped: !d.stream || d.stream.getTracks().every((track: MediaStreamTrack) => track.readyState === 'ended') };
        }), 4000);
        if (stage.browserObservation) { fs.writeFileSync(path.join(directory, 'browser-trace.json'), JSON.stringify(stage.browserObservation.trace, null, 2) + '\n'); delete stage.browserObservation.trace; }
        if (stage.browserObservation?.error || stage.browserObservation?.pcmPending || stage.browserObservation?.eventPending || stage.browserObservation?.contextState !== 'closed' || !stage.browserObservation?.tracksStopped) { stage.status = 'failed-or-incomplete'; stage.errors.push('Incomplete/error retention cleanup'); }
        if ((arm.pcm && (!stage.stats.pcmBatches || stage.stats.pcmBatches !== stage.browserObservation?.pcmDispatches || fs.statSync(path.join(directory, 'product-tap.f32')).size !== stage.stats.sourceSamples * 4 || fs.statSync(path.join(directory, 'virtual-input.f32')).size !== stage.stats.inputSamples * 4)) || (arm.events && (!stage.stats.eventBatches || stage.stats.eventBatches !== stage.browserObservation?.eventDispatches))) { stage.status = 'failed-or-incomplete'; stage.errors.push('Required retained arm denominators empty or unmatched'); }
      } catch (error) { stage.status = 'failed-or-incomplete'; stage.errors.push('Observation/cleanup: ' + String(error)); }
      try { await bounded(context.close(), 2000); stage.browserContextClosed = true; } catch (error) { stage.errors.push('Context closure: ' + String(error)); stage.status = 'failed-or-incomplete'; }
      fs.writeFileSync(path.join(directory, 'node-trace.json'), JSON.stringify(nodeCallbacks, null, 2) + '\n'); stage.nodeCallbackRecords = nodeCallbacks.length; stage.finishedAt = new Date().toISOString(); save('report.json', report);
    }
    if (stage.errors.length) stage.status = 'failed-or-incomplete';
    console.log('RETENTION_ARM ' + JSON.stringify({ name: arm.name, status: stage.status, elapsedSeconds: stage.elapsedMonotonicSeconds, stats: stage.stats, error: stage.browserObservation?.error, maxPCM: stage.browserObservation?.maxPCM, maxEvents: stage.browserObservation?.maxEvents }));
    if (stage.status !== 'completed-diagnostic-observation') throw Error('Arm did not complete/drain; remaining arms not attempted.');
  }
  report.status = 'completed-diagnostic-observation';
} catch (error) { report.status = 'failed-or-incomplete'; report.errors.push(String(error)); }
finally {
  clearInterval(nodeHeartbeat); fs.writeFileSync(path.join(root, 'node-heartbeat.json'), JSON.stringify(nodeHeartbeats, null, 2) + '\n');
  try { if (browser) await bounded(browser.close(), 2500); report.browserClosed = true; } catch (error) { report.errors.push('Browser cleanup: ' + String(error)); }
  try { if (browserServer) await bounded(browserServer.close(), 1500); report.browserProcessClosed = true; } catch (error) { report.errors.push('Browser process cleanup: ' + String(error)); browserServer?.process().kill('SIGTERM'); report.forcedOwnedBrowserStop = true; }
  if (watchdog) clearTimeout(watchdog);
  try { if (server.listening) report.servedAfter = await bounded(attest('after'), 2000); } catch (error) { report.errors.push('Post HTTP binding: ' + String(error)); }
  if (server.listening) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } report.serverClosed = !server.listening; report.finishedAt = new Date().toISOString(); report.elapsedMonotonicSeconds = (performance.now() - probeStart) / 1000;
  if (report.errors.length || report.stages.length !== arms.length || report.elapsedMonotonicSeconds > hardDeadlineMs / 1000) report.status = 'failed-or-incomplete';
  save('report.json', report);
  const manifest: Record<string, { bytes: number; sha256: string }> = {};
  for (const directory of [root, ...report.stages.map((stage: any) => path.join(root, stage.name))]) for (const name of fs.readdirSync(directory)) { const file = path.join(directory, name); if (fs.statSync(file).isFile() && name !== 'manifest.json') manifest[path.relative(root, file)] = { bytes: fs.statSync(file).size, sha256: hash(fs.readFileSync(file)) }; }
  save('manifest.json', manifest);
}
console.log('RETENTION_DONE ' + JSON.stringify({ status: report.status, elapsedSeconds: report.elapsedMonotonicSeconds, arms: report.stages.map((stage: any) => ({ name: stage.name, status: stage.status })), errors: report.errors, qualificationPassed: false }));
if (report.status !== 'completed-diagnostic-observation') process.exitCode = 1;
