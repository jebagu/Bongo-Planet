import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
const productMode = process.env.BONGO_PROBE_MODE === 'product';
const directory = path.resolve('evidence/step-05/live-output', productMode ? 'product' : '.'); fs.mkdirSync(directory, { recursive: true });
const capturedHarness = fs.readFileSync('scripts/live-output-probe.ts');
fs.writeFileSync(path.join(directory, 'capture-harness.ts'), capturedHarness);
const harnessSha256 = createHash('sha256').update(capturedHarness).digest('hex');
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, ignoreDefaultArgs: ['--mute-audio'], args: ['--enable-automation', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const context = await browser.newContext({ viewport: { width: 900, height: 650 } });
await context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5420' });
const page = await context.newPage();
await page.addInitScript('globalThis.__name = (fn) => fn;');
const partialCapture = path.join(directory, 'named-virtual-capture-partial.f32');
fs.writeFileSync(partialCapture, Buffer.alloc(0));
fs.writeFileSync(path.join(directory, 'capture-chunks.jsonl'), '');
await page.exposeFunction('retainChunk', (start: number, samples: number[]) => {
  fs.appendFileSync(partialCapture, Buffer.from(new Float32Array(samples).buffer));
  fs.appendFileSync(path.join(directory, 'capture-chunks.jsonl'), JSON.stringify({ start, samples: samples.length }) + '\n');
});
const report: any = { title: 'Bongo Planet named virtual-device live output probe', startedAt: new Date().toISOString(), browser: browser.version(), origin: 'http://127.0.0.1:5420/BongoPlanet/', headless: true, permanentUrl: 'http://127.0.0.1:5417/BongoPlanet/', status: 'initializing', actualLoopbackCaptured: false, fullProductLiveGatePassed: false, limitation: productMode ? 'Actual product adapter; dense timing uses explicitly documented sentinel variants, so original dense-mixture onset acceptance remains open. Safari untested.' : 'Probe uses original MonoSynth on independent analytic triggers; it does not qualify actual F02/F03/F06/F08 adapter playback or Safari.', errors: [] };
const browserCdp = await browser.newBrowserCDPSession();
report.actualBrowserArguments = (await browserCdp.send('Browser.getBrowserCommandLine')).arguments;
if (report.actualBrowserArguments.includes('--mute-audio')) throw Error('Actual output muted; refusing probe.');
page.on('pageerror', error => report.errors.push(String(error)));
const save = () => fs.writeFileSync(path.join(directory, 'probe-report.json'), JSON.stringify(report, null, 2) + '\n'); save();
try {
  await page.goto(report.origin); await page.waitForFunction(() => !!(window as any).__bongo);
  const devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId })));
  report.devices = devices; save();
  const name = 'SPAT 8ch loopback';
  const input = devices.find(d => d.kind === 'audioinput' && (d.label === name || d.label === `${name} (Virtual)`));
  const output = devices.find(d => d.kind === 'audiooutput' && (d.label === name || d.label === `${name} (Virtual)`));
  if (!input || !output) throw Error('Named SPAT virtual input/output not enumerated; no default/ambient stream will be requested.');
  console.log(`LIVE_PROBE_SELECTED ${name}; exact virtual input/output, no ambient microphone.`);
  report.status = 'capturing-named-virtual-device'; report.selectedInput = input; report.selectedOutput = output; save();
  const result = productMode ? await runProductProbe(page, input.deviceId, output.deviceId) : await page.evaluate(async ({ inputId, outputId }) => {
    const ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
    const c = ctx as AudioContext & { setSinkId: (device: string) => Promise<void>; sinkId: string };
    if (!c.setSinkId) { await ctx.close(); throw Error('AudioContext.setSinkId unavailable.'); }
    let stream: MediaStream | undefined;
    try {
      await c.setSinkId(outputId); await ctx.resume();
      // Mandatory exact ID only; never audio:true and never the default input.
      stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { deviceId: { exact: inputId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 1 }, sampleRate: { ideal: 48000 } } });
      const track = stream.getAudioTracks()[0], settings = track.getSettings();
      if (settings.deviceId !== inputId || !track.label.includes('SPAT 8ch loopback')) throw Error('Captured track does not match explicitly selected virtual device.');
      const recording: { start: number; data: Float32Array }[] = [];
      const recorderCode = `class Capture extends AudioWorkletProcessor { constructor(){ super();this.data=new Float32Array(2048);this.length=0;this.start=0; } process(inputs,outputs){const input=inputs[0]?.[0];for(const output of outputs[0]||[])output.fill(0);if(input)for(let i=0;i<input.length;i++){if(!this.length)this.start=currentTime+i/sampleRate;this.data[this.length++]=input[i];if(this.length===this.data.length){this.port.postMessage({start:this.start,data:this.data},[this.data.buffer]);this.data=new Float32Array(2048);this.length=0;}}return true;}}registerProcessor('named-device-capture',Capture);`;
      const recorderUrl = URL.createObjectURL(new Blob([recorderCode], { type: 'text/javascript' }));
      await ctx.audioWorklet.addModule(recorderUrl); URL.revokeObjectURL(recorderUrl);
      const recorder = new AudioWorkletNode(ctx, 'named-device-capture', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      recorder.port.onmessage = ({ data }) => { recording.push(data); void (window as any).retainChunk(data.start, Array.from(data.data)); };
      ctx.createMediaStreamSource(stream).connect(recorder); recorder.connect(ctx.destination); // Recorder emits silence, never input feedback.
      const probeCode = `import {MonoSynth} from 'http://127.0.0.1:5417/BongoPlanet/src/audio/synth.ts'; class Probe extends AudioWorkletProcessor {constructor(){super();this.synth=new MonoSynth(sampleRate);this.plan=[];this.port.onmessage=({data})=>this.plan=data;} process(inputs,outputs){const out=outputs[0][0],end=currentTime+out.length/sampleRate;while(this.plan.length&&this.plan[0].onset<=end)this.synth.start(this.plan.shift(),currentTime);this.synth.render(out,currentTime,.65);return true;}}registerProcessor('original-synth-probe',Probe);`;
      const probeUrl = URL.createObjectURL(new Blob([probeCode], { type: 'text/javascript' }));
      await ctx.audioWorklet.addModule(probeUrl); URL.revokeObjectURL(probeUrl);
      const probe = new AudioWorkletNode(ctx, 'original-synth-probe', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] }); probe.connect(ctx.destination);
      const anchor = ctx.currentTime + 2, plan: any[] = [];
      for (let i = 0; i < 132; i++) {
        const theta = [Math.PI / 6, Math.PI / 3, Math.PI / 2][i % 3];
        const emission = anchor + i * 0.9, delay = 0.75 * 4 * theta / Math.PI * 0.5;
        plan.push({ session: 'analytic-live', sequence: i + 1, id: `live-${i}`, nodeId: `n${i}`, generatorId: 'g', emission, beat: 0, angle: theta, onset: emission + delay, position: [1, 0, 0], sound: { kind: 'note', frequency: 440, timbre: 'sine', duration: 0.12, level: 0.8 } });
      }
      probe.port.postMessage(plan);
      const stalls: any[] = [];
      for (const [index, durationMs] of [[35, 100], [80, 250]]) {
        setTimeout(() => { const start = performance.now(), audioStart = ctx.currentTime; while (performance.now() - start < durationMs) { /* Deliberate main-thread stall; rendering/capture stay in audio thread. */ } stalls.push({ index, durationMs, actualMs: performance.now() - start, audioStart }); }, (plan[index].onset - ctx.currentTime - 0.04) * 1000);
      }
      await new Promise(resolve => setTimeout(resolve, (plan.at(-1).onset + 0.5 - ctx.currentTime) * 1000));
      const sampleRate = ctx.sampleRate, base = recording[0]?.start ?? 0;
      const pcm = new Float32Array(recording.length * 2048);
      recording.forEach((chunk, index) => pcm.set(chunk.data, index * 2048));
      let baselinePeak = 0;
      const baselineEnd = Math.max(0, Math.floor((anchor - base) * sampleRate));
      for (let i = 0; i < Math.min(pcm.length, baselineEnd); i++) baselinePeak = Math.max(baselinePeak, Math.abs(pcm[i]));
      const onsets: number[] = []; let quiet = true, quietCount = 0;
      for (let i = 0; i < pcm.length; i++) {
        if (Math.abs(pcm[i]) > 0.001) { if (quiet) onsets.push(base + i / sampleRate); quiet = false; quietCount = 0; }
        else if (++quietCount > 0.05 * sampleRate) quiet = true;
      }
      const observations = plan.map((p, i) => ({ id: p.id, degrees: [30, 60, 90][i % 3], expectedSeconds: p.onset, measuredSeconds: onsets[i] ?? null, uncorrectedErrorMs: onsets[i] === undefined ? null : (onsets[i] - p.onset) * 1000, calibration: i < 12 }));
      const calibration = observations.slice(0, 12).map(p => p.uncorrectedErrorMs).filter((x): x is number => x !== null).sort((a, b) => a - b);
      const fixedLatencyMs = calibration.length ? calibration[Math.floor(calibration.length / 2)] : null;
      const measurements = observations.slice(12).map(p => ({ ...p, compensatedErrorMs: p.uncorrectedErrorMs === null || fixedLatencyMs === null ? null : p.uncorrectedErrorMs - fixedLatencyMs }));
      const errors = measurements.map(p => p.compensatedErrorMs).filter((x): x is number => x !== null).map(Math.abs).sort((a, b) => a - b);
      const quantile = (q: number) => errors.length ? errors[Math.min(errors.length - 1, Math.ceil(q * errors.length) - 1)] : null;
      let binary = '';
      const raw = new Uint8Array(pcm.buffer);
      for (let i = 0; i < raw.length; i += 8192) binary += String.fromCharCode(...raw.subarray(i, i + 8192));
      return { captureBase64: btoa(binary), sampleRate, base, samples: pcm.length, inputSettings: settings, inputLabel: track.label, sinkId: c.sinkId, baselinePeak, capturedOnsetCount: onsets.length, expectedOnsetCount: plan.length, calibration, fixedLatencyMs, measurements, stalls, medianAbsErrorMs: quantile(0.5), p95AbsErrorMs: quantile(0.95), maxAbsErrorMs: errors.at(-1) ?? null, missing: Math.max(0, plan.length - onsets.length), duplicates: Math.max(0, onsets.length - plan.length), actualLoopbackCaptured: onsets.length > 0 };
    } finally { stream?.getTracks().forEach(track => track.stop()); await ctx.close(); }
  }, { inputId: input.deviceId, outputId: output.deviceId });
  const { captureBase64, ...summary } = result;
  fs.writeFileSync(path.join(directory, 'named-virtual-capture.f32'), Buffer.from(captureBase64, 'base64'));
  Object.assign(report, summary); report.status = result.actualLoopbackCaptured ? 'captured-probe-only-product-gate-open' : 'no-loopback-signal';
  report.capture = 'named-virtual-capture.f32'; report.captureFormat = 'little-endian mono Float32 at recorded sampleRate';
  retainDerivedEvidence(report);
  report.sourceSnapshot = JSON.parse(fs.readFileSync('evidence/step-10/soak-progress.json','utf8')).sourceHashes;
  report.harnessSha256 = harnessSha256; report.capturedHarness = 'capture-harness.ts';
} catch (error) { report.status = 'blocked-or-failed'; report.blocker = String(error); }
finally { await browser.close(); if (report.actualLoopbackCaptured) retainDerivedEvidence(report); report.finishedAt = new Date().toISOString(); save(); console.log(`LIVE_PROBE_FINISHED ${report.status} ${report.blocker ?? ''}`); }

function retainDerivedEvidence(report: any): void {
  const raw = fs.readFileSync(path.join(directory, 'named-virtual-capture.f32'));
  const wav = Buffer.alloc(44 + raw.length);
  wav.write('RIFF'); wav.writeUInt32LE(36 + raw.length, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(3, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(report.sampleRate, 24); wav.writeUInt32LE(report.sampleRate * 4, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(32, 34); wav.write('data', 36); wav.writeUInt32LE(raw.length, 40); raw.copy(wav, 44);
  fs.writeFileSync(path.join(directory, 'named-virtual-capture.wav'), wav);
  report.captureSha256 = createHash('sha256').update(raw).digest('hex');
  report.derivedWav = 'named-virtual-capture.wav'; report.derivedWavNote = 'Same recorded device samples in IEEE Float32 WAV, no normalization or resynthesis.';
  const allChunks = fs.readFileSync(path.join(directory, 'capture-chunks.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  const chunks = allChunks.slice(0, raw.length / 4 / 2048);
  const deviations = chunks.slice(1).map((chunk, index) => (chunk.start - chunks[index].start - chunks[index].samples / report.sampleRate) * report.sampleRate);
  report.captureContinuity = { chunks: chunks.length, sampleCount: chunks.reduce((sum, chunk) => sum + chunk.samples, 0), maxAbsSampleDeviation: Math.max(0, ...deviations.map(Math.abs)), discontinuitiesOverHalfSample: deviations.filter(value => Math.abs(value) > 0.5).length, additionalTailChunksInIncrementalFile: allChunks.length - chunks.length, tailNote: 'Incremental capture can include later samples received during result analysis; final capture and jitter use only the recorded prefix represented here.' };
  const measurements = report.measurements ?? [];
  fs.writeFileSync(path.join(directory, 'jitter.csv'), 'fixture,variant,expected_seconds,measured_seconds,compensated_error_ms\n' + measurements.map((m: any) => [m.fixture ?? 'analytic', m.variant ?? 'isolated', m.expectedSeconds, m.measuredSeconds, m.compensatedErrorMs].join(',')).join('\n') + '\n');
  if (report.segments) {
    let baselinePeak = 0;
    const baselineSamples = Math.max(0, Math.min(raw.length / 4, Math.floor((report.segments[0].anchor - report.base) * report.sampleRate)));
    for (let i = 0; i < baselineSamples; i++) baselinePeak = Math.max(baselinePeak, Math.abs(raw.readFloatLE(i * 4)));
    report.baselinePeak = baselinePeak;
    report.measuredSubsetChecks = { minimum120PostCalibrationGroups: measurements.length >= 120, medianWithin5Ms: report.medianAbsErrorMs <= 5, p95Within10Ms: report.p95AbsErrorMs <= 10, maxWithin20Ms: report.maxAbsErrorMs <= 20, zeroMissingAndDuplicateMatches: report.missing === 0 && report.duplicates === 0, qualification: 'Scoped original F02 and documented F03/F06/F08 variants only; full live acceptance remains open.' };
    for (const segment of report.segments) {
      segment.maxLateDropsObserved = Math.max(0, ...segment.statuses.map((status: any) => (status.lateDrops ?? 0) + (status.lateDropsAudio ?? 0)));
      segment.maxTelemetryDropsObserved = Math.max(0, ...segment.statuses.map((status: any) => status.telemetryDrops ?? 0));
    }
    for (const stall of report.stalls) {
      const during = measurements.filter((m: any) => m.fixture === stall.fixture && m.expectedSeconds >= stall.audioStart && m.expectedSeconds <= stall.audioStart + stall.actualMs / 1000);
      stall.identifiedGroupsDuringStall = during;
      stall.maxAbsErrorDuringStallMs = during.length ? Math.max(...during.map((m: any) => Math.abs(m.compensatedErrorMs))) : null;
      stall.allSelectedMeasuredOnsetsActuallyWithinStall = during.length > 0 && during.every((m: any) => m.measuredSeconds >= stall.audioStart && m.measuredSeconds <= stall.audioStart + stall.actualMs / 1000);
    }
  }
}


async function runProductProbe(page: Page, inputId: string, outputId: string): Promise<any> {
  const fixtureIds = ['F02', 'F03', 'F06', 'F08'];
  const fixtures = Object.fromEntries(fixtureIds.map(id => [id, JSON.parse(fs.readFileSync(`evidence/step-10/soak-source/fixtures/${id}.json`, 'utf8'))]));
  const vertices = JSON.parse(fs.readFileSync('evidence/step-02/topology.json', 'utf8')).vertices;
  fs.writeFileSync(path.join(directory, 'reference-fixtures.json'), JSON.stringify(fixtures, null, 2));
  fs.writeFileSync(path.join(directory, 'reference-vertices.json'), JSON.stringify(vertices, null, 2));
  await page.locator('#enable').click();
  await page.waitForFunction(() => !!(window as any).__bongo.audio.node && (window as any).__bongo.audio.context.state === 'running');
  return await page.evaluate(async ({ inputId, outputId, fixtures, vertices }) => {
    const b = (window as any).__bongo, ctx: AudioContext = b.audio.context;
    let stream: MediaStream | undefined;
    const segments: any[] = [], chunks: any[] = [];
    const stalls: any[] = [];
    try {
      await (ctx as any).setSinkId(outputId);
      await b.audio.enable();
      stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { deviceId: { exact: inputId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 1 }, sampleRate: { ideal: 48000 } } });
      const track = stream.getAudioTracks()[0], inputSettings = track.getSettings();
      if (inputSettings.deviceId !== inputId || !track.label.includes('SPAT 8ch loopback')) throw Error('Product capture selected wrong device.');
      const code = `class Capture extends AudioWorkletProcessor {constructor(){super();this.data=new Float32Array(2048);this.length=0;this.start=0;} process(inputs,outputs){const input=inputs[0]?.[0];for(const output of outputs[0]||[])output.fill(0);if(input)for(let i=0;i<input.length;i++){if(!this.length)this.start=currentTime+i/sampleRate;this.data[this.length++]=input[i];if(this.length===2048){this.port.postMessage({start:this.start,data:this.data},[this.data.buffer]);this.data=new Float32Array(2048);this.length=0;}}return true;}}registerProcessor('product-loopback-capture',Capture);`;
      const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
      const recorder = new AudioWorkletNode(ctx, 'product-loopback-capture', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      recorder.port.onmessage = ({ data }) => { chunks.push(data); void (window as any).retainChunk(data.start, Array.from(data.data)); };
      ctx.createMediaStreamSource(stream).connect(recorder); recorder.connect(ctx.destination);
      const originalCallback = b.audio.onEvents;
      let current: any = null;
      b.audio.onEvents = (events: any[]) => {
        originalCallback?.(events);
        if (!current) return;
        for (const event of events) {
          if (event.type === 'emission') { current.emissions.push(event); current.anchor ??= event.time; }
          if (event.type === 'trigger') current.triggerCount++;
          if (event.type === 'onset') current.onsetCount++;
        }
      };
      function independentEvents(scene: any, anchor: number, end: number, sentinel: string | null): any[] {
        const generators = scene.pieces.filter((p: any) => p.kind === 'generator' && p.enabled), targets = scene.pieces.filter((p: any) => p.kind !== 'generator');
        const emissions: any[] = [];
        for (const generator of generators) {
          const periodSeconds = generator.period * 60 / scene.settings.bpm;
          for (let k = 0; anchor + (k + generator.phase) * periodSeconds < end; k++) emissions.push({ generator, time: anchor + (k + generator.phase) * periodSeconds, k });
        }
        emissions.sort((a, c) => a.time - c.time || scene.pieces.indexOf(a.generator) - scene.pieces.indexOf(c.generator));
        let sequence = 0; const events: any[] = [];
        for (const emission of emissions) for (const target of targets) {
          const a = vertices[emission.generator.vertex], c = vertices[target.vertex];
          const theta = Math.acos(Math.max(-1, Math.min(1, a[0]*c[0]+a[1]*c[1]+a[2]*c[2])));
          if (theta > emission.generator.reach * Math.PI / 180 + 1e-9) continue;
          const raw = scene.settings.travel * emission.generator.period * theta / Math.PI, grid = scene.settings.quantization;
          const delayBeats = grid ? Math.min(Math.floor(raw / grid + 0.5 + 1e-10) * grid, (Math.ceil(emission.generator.period / grid) - 1) * grid) : raw;
          const onset = emission.time + delayBeats * 60 / scene.settings.bpm;
          events.push({ sequence: ++sequence, nodeId: target.id, generatorId: emission.generator.id, onset, end: onset + (target.kind === 'note' ? target.duration : target.decay), audible: target.level > 0, sentinel: target.id === sentinel });
        }
        events.sort((a, c) => a.onset - c.onset || a.sequence - c.sequence);
        const groups: any[] = []; let active: any[] = [], stolen = 0;
        for (let i = 0; i < events.length;) {
          const time = events[i].onset, batch: any[] = [];
          while (i < events.length && Math.abs(events[i].onset - time) < 1e-8) batch.push(events[i++]);
          active = active.filter(voice => voice.end > time);
          for (const event of batch) {
            if (active.length >= 64) { active.sort((a, c) => a.onset - c.onset || a.sequence - c.sequence); active.shift(); stolen++; }
            active.push(event);
          }
          const audible = batch.filter(event => event.audible && active.includes(event));
          if (audible.length && time >= anchor + 0.1 && time < end - 0.25) groups.push({ expectedSeconds: time, voices: audible.map(e => ({ nodeId: e.nodeId, generatorId: e.generatorId, sequence: e.sequence })) });
        }
        return groups;
      }
      const configs = [
        { id: 'F02', variant: 'original', seconds: 64 },
        { id: 'F03', variant: 'short-duration', seconds: 24 },
        { id: 'F06', variant: 'original-dense-capture', seconds: 8 },
        { id: 'F06', variant: 'dense-sentinel', seconds: 20 },
        { id: 'F08', variant: 'original-dense-capture', seconds: 8 },
        { id: 'F08', variant: 'dense-sentinel', seconds: 16 },
      ];
      for (const config of configs) {
        b.audio.pause(); await new Promise(resolve => setTimeout(resolve, 300));
        const scene = structuredClone(fixtures[config.id]); let sentinel: string | null = null;
        if (config.variant === 'short-duration') for (const p of scene.pieces) if (p.kind === 'note') p.duration = 0.05;
        if (config.variant === 'dense-sentinel') {
          const targets = scene.pieces.filter((p: any) => p.kind !== 'generator'); sentinel = targets.at(-1).id;
          for (const p of targets) p.level = p.id === sentinel ? 1 : 0;
          targets.at(-1).decay = 0.03;
        }
        current = { ...config, scene, sentinel, anchor: null, emissions: [], triggerCount: 0, onsetCount: 0, maxVoices: 0, maxPending: 0, statuses: [] };
        b.load(scene); await new Promise(resolve => setTimeout(resolve, 100)); document.getElementById('play')!.click();
        for (let attempt = 0; current.anchor === null && attempt < 20; attempt++) await new Promise(resolve => setTimeout(resolve, 100));
        if (current.anchor === null) throw Error(`${config.id} did not emit after Play: ${JSON.stringify({ audioState: b.audio.state, contextState: ctx.state, status: b.status, recentEvents: b.events.slice(-5), playButton: document.getElementById('play')?.textContent })}`);
        const segment = current;
        const interval = setInterval(() => { const s = b.status; segment.maxVoices = Math.max(segment.maxVoices, s?.activeVoices ?? 0); segment.maxPending = Math.max(segment.maxPending, s?.pending ?? 0); segment.statuses.push({ time: ctx.currentTime, ...s }); }, 500);
        if (config.variant === 'dense-sentinel') for (const [offset, durationMs] of [[3.2, 100], [8.2, 250]]) {
          const expected = independentEvents(scene, segment.anchor, segment.anchor + config.seconds, sentinel).find(group => group.expectedSeconds > segment.anchor + offset);
          if (!expected) throw Error('No independent audible onset available for stall probe.');
          setTimeout(() => { const start = performance.now(), audioStart = ctx.currentTime; while (performance.now() - start < durationMs) {} stalls.push({ fixture: config.id, durationMs, actualMs: performance.now() - start, audioStart, expectedOnsetSpanned: expected.expectedSeconds }); }, (expected.expectedSeconds - ctx.currentTime - 0.04) * 1000);
        }
        await new Promise(resolve => setTimeout(resolve, config.seconds * 1000));
        clearInterval(interval); segment.end = ctx.currentTime; b.audio.pause(); current = null;
        segment.expectedGroups = config.variant === 'original-dense-capture' ? [] : independentEvents(scene, segment.anchor, segment.end, sentinel);
        segment.timingIdentifiable = config.variant !== 'original-dense-capture'; segments.push(segment);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      b.audio.onEvents = originalCallback;
      const sampleRate = ctx.sampleRate, base = chunks[0]?.start ?? 0, pcm = new Float32Array(chunks.length * 2048);
      chunks.forEach((chunk, i) => pcm.set(chunk.data, i * 2048));
      const observed: number[] = []; let quiet = true, silentSamples = 0;
      for (let i = 0; i < pcm.length; i++) {
        if (Math.abs(pcm[i]) > 0.001) { if (quiet) observed.push(base + i / sampleRate); quiet = false; silentSamples = 0; }
        else if (++silentSamples >= sampleRate * 0.01) quiet = true;
      }
      const calibrationSegment = segments[0], calibrationActual = observed.filter(t => t >= calibrationSegment.anchor && t < calibrationSegment.end - 0.2);
      const calibration = calibrationSegment.expectedGroups.slice(0, 12).map((g: any, i: number) => ({ expected: g.expectedSeconds, actual: calibrationActual[i], latencyMs: (calibrationActual[i] - g.expectedSeconds) * 1000 }));
      const offsets = calibration.map((c: any) => c.latencyMs).filter(Number.isFinite).sort((a: number, c: number) => a - c);
      if (offsets.length !== 12) throw Error('Not enough isolated actual-output calibration onsets.');
      const fixedLatencyMs = offsets[Math.floor(offsets.length / 2)];
      let missing = 0, duplicates = 0; const measurements: any[] = [];
      for (const segment of segments) {
        let peak = 0;
        for (let i = Math.max(0, Math.floor((segment.anchor - base) * sampleRate)); i < Math.min(pcm.length, Math.ceil((segment.end - base) * sampleRate)); i++) peak = Math.max(peak, Math.abs(pcm[i]));
        segment.actualPeak = peak;
        if (!segment.timingIdentifiable) { segment.limitation = 'Raw actual dense output retained, but individual onsets are not independently identified in this saturated mono mixture.'; continue; }
        const candidates = observed.filter(t => t >= segment.anchor + 0.08 && t < segment.end - 0.15), used = new Set<number>();
        let skip = segment.id === 'F02' ? 12 : 0;
        segment.measurements = segment.expectedGroups.map((group: any) => {
          const target = group.expectedSeconds + fixedLatencyMs / 1000; let nearest = -1, distance = Infinity;
          for (let i = 0; i < candidates.length; i++) if (!used.has(i) && Math.abs(candidates[i] - target) < distance) { nearest = i; distance = Math.abs(candidates[i] - target); }
          const calibrationOnly = skip-- > 0;
          if (nearest < 0 || distance > 0.04) { if (!calibrationOnly) missing++; return { ...group, measuredSeconds: null, compensatedErrorMs: null, calibrationOnly }; }
          used.add(nearest);
          const result = { ...group, measuredSeconds: candidates[nearest], compensatedErrorMs: (candidates[nearest] - group.expectedSeconds) * 1000 - fixedLatencyMs, calibrationOnly };
          if (!calibrationOnly) measurements.push({ fixture: segment.id, variant: segment.variant, ...result });
          return result;
        });
        segment.unmatchedDetectedOnsets = candidates.filter((_, i) => !used.has(i)); duplicates += segment.unmatchedDetectedOnsets.length;
      }
      const errors = measurements.map(m => Math.abs(m.compensatedErrorMs)).sort((a, c) => a - c);
      const percentile = (q: number) => errors[Math.min(errors.length - 1, Math.ceil(q * errors.length) - 1)] ?? null;
      let binary = ''; const bytes = new Uint8Array(pcm.buffer);
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { captureBase64: btoa(binary), actualLoopbackCaptured: observed.length > 0, source: 'Actual Bongo Planet AudioAdapter from immutable build', inputSettings, inputLabel: track.label, sinkId: (ctx as any).sinkId, sampleRate, base, samples: pcm.length, fixedLatencyMs, calibration, measurements, segments, stalls, observedOnsetGroups: observed.length, identifiableMeasurementGroups: measurements.length, medianAbsErrorMs: percentile(0.5), p95AbsErrorMs: percentile(0.95), maxAbsErrorMs: errors.at(-1) ?? null, missing, duplicates, fullProductLiveGatePassed: false, limitations: ['F03 duration changed to0.05s to isolate onsets.', 'F06/F08 sentinel variants retain full event/64voice workload, but zero all other sound levels.', 'Original dense segments are actual recorded audio; individual defaultdense onsets remain unidentified.', 'Calibration removes only one fixed measured constant.', 'Safari not tested by this script.'] };
    } finally { b.audio.pause(); stream?.getTracks().forEach(track => track.stop()); await ctx.close(); }
  }, { inputId, outputId, fixtures, vertices });
}
