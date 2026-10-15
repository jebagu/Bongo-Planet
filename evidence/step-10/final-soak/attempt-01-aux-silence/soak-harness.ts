import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
const artifact = path.resolve(process.env.BONGO_SOAK_OUTPUT ?? 'evidence/step-10/final-soak');
const actualCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),expectedCommit=process.env.BONGO_SOAK_EXPECTED_COMMIT,expectedMainSha=process.env.BONGO_SOAK_EXPECTED_MAIN_SHA;
if(!expectedCommit||!actualCommit.startsWith(expectedCommit)||!expectedMainSha)throw Error('Pass the frozen expected commit and main bundle SHA prefix; source mismatch refuses launch.');
const snapshot = path.join(artifact, 'soak-source');
if (fs.existsSync(snapshot) || fs.existsSync(path.join(artifact,'soak-report.json'))) throw Error('Evidence destination already contains a run; choose a new BONGO_SOAK_OUTPUT. Existing evidence will not be overwritten.');
fs.mkdirSync(artifact, { recursive: true });
fs.cpSync('dist', snapshot, { recursive: true });
const harness=fs.readFileSync('scripts/soak.ts');fs.writeFileSync(path.join(artifact,'soak-harness.ts'),harness);
const sourceFileHashes:Record<string,string>={};
for(const name of ['src/core/engine.ts','src/core/contracts.ts','src/audio/synth.ts','src/audio/processor.ts','src/audio/AudioAdapter.ts','src/view/SphereView.ts','src/main.ts']){const data=fs.readFileSync(name);sourceFileHashes[name]=createHash('sha256').update(data).digest('hex');const target=path.join(artifact,'source-files',name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);}
const sourceHashes: Record<string, string> = {};
function hashFiles(folder: string) { for (const entry of fs.readdirSync(folder, { withFileTypes: true })) { const file = path.join(folder, entry.name); if (entry.isDirectory()) hashFiles(file); else sourceHashes[path.relative(snapshot, file)] = createHash('sha256').update(fs.readFileSync(file)).digest('hex'); } }
hashFiles(snapshot);
const mainHashes=Object.entries(sourceHashes).filter(([name])=>/^assets\/index-.*\.js$/.test(name));
if(!mainHashes.some(([,hash])=>hash.startsWith(expectedMainSha)))throw Error('Frozen main bundle hash mismatch; refusing browser launch.');
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
await context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5420' }); // Exact named virtual input only; never the default microphone.
const page = await context.newPage();
await page.addInitScript('globalThis.__name = fn => fn;');
const capture={chunks:0,samples:0,firstContextTime:null as number|null,lastContextEnd:null as number|null,maxAbsSampleGap:0,discontinuitiesOverHalfSample:0,peak:0,nonfinite:0,nonzeroSamples:0};
const rawFile=path.join(artifact,'continuous-virtual-capture.f32'),chunkFile=path.join(artifact,'capture-chunks.jsonl');fs.writeFileSync(rawFile,Buffer.alloc(0));fs.writeFileSync(chunkFile,'');
await page.exposeFunction('retainSoakChunk',(start:number,samples:number[])=>{const data=Float32Array.from(samples),gap=capture.lastContextEnd===null?0:(start-capture.lastContextEnd)*48000;capture.maxAbsSampleGap=Math.max(capture.maxAbsSampleGap,Math.abs(gap));if(Math.abs(gap)>.5)capture.discontinuitiesOverHalfSample++;capture.firstContextTime??=start;capture.lastContextEnd=start+data.length/48000;capture.chunks++;capture.samples+=data.length;for(const sample of data){if(!Number.isFinite(sample))capture.nonfinite++;capture.peak=Math.max(capture.peak,Math.abs(sample));if(Math.abs(sample)>.001)capture.nonzeroSamples++;}fs.appendFileSync(rawFile,Buffer.from(data.buffer));fs.appendFileSync(chunkFile,JSON.stringify({start,samples:data.length})+'\n');});
const errors: { elapsedSeconds: number; type: string; message: string }[] = [];
let started = Date.now(), timerStarted = false, navigations = 0;
page.on('pageerror', error => errors.push({ elapsedSeconds: (Date.now() - started) / 1000, type: 'uncaught', message: String(error) }));
page.on('console', message => { if (message.type() === 'error') errors.push({ elapsedSeconds: (Date.now() - started) / 1000, type: 'console', message: message.text() }); });
page.on('response', response => { if (response.status() >= 400) errors.push({ elapsedSeconds: (Date.now() - started) / 1000, type: 'http', message: `${response.status()} ${response.url()}` }); });
page.on('framenavigated', frame => { if (timerStarted && frame === page.mainFrame()) navigations++; });
const report: any = { title: 'Bongo Planet actual Chrome dense soak with continuous virtual output recording', status: 'initializing', complete30Minutes: false, requiredDurationSeconds: 1800, startedAt: null, testUrl, permanentUrl: 'http://127.0.0.1:5417/BongoPlanet/', note: '5420 is an immutable evidence-only snapshot server, not a changed permanent project URL.', browser: browser.version(), headless: true, executable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args, os: { platform: os.platform(), release: os.release(), architecture: os.arch(), memory: os.totalmem(), cpus: os.cpus()[0]?.model }, viewport: { width: 1360, height: 820 }, sourceHashes, sourceFileHashes, commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),harnessSha256:createHash('sha256').update(harness).digest('hex'),samples: [], edits: [], errors, sourceSnapshot: 'soak-source', audioRoute: null, inputRecording: true,capture,concurrentWork:'Lead browser, build and regression work may run concurrently; this is a declared stress run, not a quiet-machine benchmark.',humanListeningPassed:false, fullIndividualOnsetGatePassed:false };
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
  const sink=devices.find(d=>d.kind==='audiooutput'&&d.label==='Orbisonic Aux Cable (Virtual)'),input=devices.find(d=>d.kind==='audioinput'&&d.label==='Orbisonic Aux Cable (Virtual)');
  if(!sink||!input)throw Error('Exact named Orbisonic virtual input/output unavailable; no default microphone fallback.');
  report.audioRoute=await page.evaluate(async({inputId,outputId})=>{
    const b=(window as any).__bongo,audio:AudioContext=b.audio.context;if(typeof(audio as any).setSinkId!=='function')throw Error('Per-context sink selection unavailable.');
    await(audio as any).setSinkId(outputId);await b.audio.enable();if(audio.sampleRate!==48000)throw Error('Expected48kHz capture clock.');
    const stream=await navigator.mediaDevices.getUserMedia({video:false,audio:{deviceId:{exact:inputId},echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:{ideal:1},sampleRate:{ideal:48000}}});const track=stream.getAudioTracks()[0];if(track.getSettings().deviceId!==inputId||!track.label.includes('Orbisonic Aux Cable'))throw Error('Virtual input identity mismatch.');
    const code=`class Capture extends AudioWorkletProcessor{constructor(){super();this.data=new Float32Array(2048);this.length=0;this.start=0;}process(inputs,outputs){const input=inputs[0]?.[0];for(const out of outputs[0]||[])out.fill(0);if(input)for(let i=0;i<input.length;i++){if(!this.length)this.start=currentTime+i/sampleRate;this.data[this.length++]=input[i];if(this.length===2048){this.port.postMessage({start:this.start,data:this.data},[this.data.buffer]);this.data=new Float32Array(2048);this.length=0;}}return true;}}registerProcessor('soak-capture',Capture);`;
    const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));await audio.audioWorklet.addModule(url);URL.revokeObjectURL(url);const recorder=new AudioWorkletNode(audio,'soak-capture',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]}),source=audio.createMediaStreamSource(stream),state={pending:0,maxPending:0,error:null as string|null,stream,recorder,source,context:audio};
    recorder.port.onmessage=({data})=>{state.pending++;state.maxPending=Math.max(state.maxPending,state.pending);if(state.pending>128){state.error='Capture backlog exceeds128 chunks';state.pending--;return;}void(window as any).retainSoakChunk(data.start,Array.from(data.data)).catch((error:unknown)=>state.error=String(error)).finally(()=>state.pending--);};source.connect(recorder);recorder.connect(audio.destination);(window as any).__soakCapture=state;
    return{sink:'Orbisonic Aux Cable',inputLabel:track.label,inputSettings:track.getSettings(),sinkId:(audio as any).sinkId,sampleRate:audio.sampleRate};
  },{inputId:input.deviceId,outputId:sink.deviceId});
  await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__bongo.status?.running === true);
  await page.waitForTimeout(1500);if(capture.peak<.01)throw Error('Named virtual capture has no actual output signal; refusing30minute timer.');
  const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
  report.captureTimerStartContextTime=await page.evaluate(()=>(window as any).__bongo.audio.context.currentTime);
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
      const snapshot = await page.evaluate(() => { const b = (window as any).__bongo,c=(window as any).__soakCapture; return { audio: b.status, render: b.view.getDiagnostics(), pieces: b.scene.pieces.length, eventRecords: b.events.length, audioState: b.audio.state,captureState:{pending:c.pending,maxPending:c.maxPending,error:c.error} }; });
      const metrics = (await cdp.send('Performance.getMetrics')).metrics;
      const values = Object.fromEntries(metrics.filter(m => ['JSHeapUsedSize', 'JSHeapTotalSize', 'Nodes', 'Documents', 'JSEventListeners'].includes(m.name)).map(m => [m.name, m.value]));
      report.samples.push({ elapsedSeconds: (Date.now() - started) / 1000, ...snapshot, metrics: values });
      console.log(`SOAK_SAMPLE ${JSON.stringify(report.samples.at(-1))}`); nextSample += 60000; save();
      if (!snapshot.audio?.running) throw Error('Dense session stopped unexpectedly.');
      if(snapshot.captureState.error)throw Error(snapshot.captureState.error);
      if (snapshot.audio.activeVoices > 64 || snapshot.audio.pending > 5376) throw Error('Declared queue/voice bound exceeded.');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  report.elapsedSeconds = (Date.now() - started) / 1000;
  report.finalSnapshot=await page.evaluate(()=>{const b=(window as any).__bongo;return{audio:b.status,render:b.view.getDiagnostics(),contextTime:b.audio.context.currentTime,captureState:{pending:(window as any).__soakCapture.pending,maxPending:(window as any).__soakCapture.maxPending,error:(window as any).__soakCapture.error}};});
  if(!report.finalSnapshot.audio?.running||report.finalSnapshot.captureState.error)throw Error('Final audio/capture state failed.');
  report.captureTimerEndContextTime=report.finalSnapshot.contextTime;
  report.complete30Minutes = report.elapsedSeconds >= 1800 && navigations === 0;
  report.status = report.complete30Minutes ? 'completed-observations-require-review' : 'incomplete';
  report.warmupVsLater = { warmup: report.samples.filter((s: any) => s.elapsedSeconds >= 120 && s.elapsedSeconds < 300), later: report.samples.filter((s: any) => s.elapsedSeconds >= 1500) };
  await page.screenshot({ path: path.join(artifact, 'soak-end.png') });
} catch (error) { report.status = 'failed-or-interrupted'; report.failure = String(error); report.elapsedSeconds = timerStarted ? (Date.now() - started) / 1000 : 0; }
finally {
  if(!page.isClosed())try{await page.evaluate(async()=>{const b=(window as any).__bongo,c=(window as any).__soakCapture;b.audio.pause();if(!c)return;c.recorder.port.onmessage=null;c.source.disconnect();c.recorder.disconnect();c.stream.getTracks().forEach((track:MediaStreamTrack)=>track.stop());await c.context.close();while(c.pending)await new Promise(resolve=>setTimeout(resolve,10));});}catch(error){report.captureCleanupError=String(error);}
  await browser.close();server.close();
  const rawBytes=fs.statSync(rawFile).size,header=Buffer.alloc(44),sr=48000;header.write('RIFF');header.writeUInt32LE(36+rawBytes,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(3,20);header.writeUInt16LE(1,22);header.writeUInt32LE(sr,24);header.writeUInt32LE(sr*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(32,34);header.write('data',36);header.writeUInt32LE(rawBytes,40);const fd=fs.openSync(path.join(artifact,'continuous-virtual-capture.wav'),'w');fs.writeSync(fd,header);const rawFd=fs.openSync(rawFile,'r'),buffer=Buffer.alloc(1024*1024),digest=createHash('sha256');let bytes:number;while((bytes=fs.readSync(rawFd,buffer,0,buffer.length,null))>0){fs.writeSync(fd,buffer,0,bytes);digest.update(buffer.subarray(0,bytes));}fs.closeSync(fd);fs.closeSync(rawFd);report.captureSha256=digest.digest('hex');report.captureFormat='Actual named virtual input; mono little-endian Float32 at48kHz. WAV preserves identical sample bytes.';
  report.captureCoversTimedRun=capture.firstContextTime!==null&&capture.lastContextEnd!==null&&capture.firstContextTime<=report.captureTimerStartContextTime&&capture.lastContextEnd>=report.captureTimerEndContextTime-2048/48000&&capture.discontinuitiesOverHalfSample===0&&capture.nonfinite===0;
  report.finishedAt=new Date().toISOString();report.browserClosed=true;save();fs.writeFileSync(path.join(artifact,'soak-report.json'),JSON.stringify(report,null,2)+'\n');console.log(`SOAK_FINISHED ${report.status} elapsed=${report.elapsedSeconds} continuousCapture=${report.captureCoversTimedRun}`);
}
