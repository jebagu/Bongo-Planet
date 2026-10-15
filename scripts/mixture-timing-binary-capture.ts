import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { checksum, encode, decode, validate, commitFrame, validAck, finiteJSON, encodeBrowserPCM, eventChunks, validateEventChunk, EMPTY_EVENT_ASSEMBLY, derivedEventRows, type Collector } from './mixture-retention-codec';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium, type Browser, type BrowserServer, type Page } from '@playwright/test';
import { fixtureOracle, onsetGroups, erasedBeforeSound } from './mixture-timing-oracle';
import type { Scene } from '../src/core/contracts';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--output')) throw Error('Usage: --output <new original-mixture evidence directory>');
const output = args[1] ?? 'evidence/step-05/original-mixture/binary-capture-01';
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
if (mainHash !== 'd8040f401399d61fddde16e1fcd744f1d85208073bf1dd64f2059bcdcaed2245' || processorHash !== '0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793' || !mainBytes.toString().includes(processorNames[0])) throw Error('Frozen source binding changed; obtain coordinated new candidate.');
const sourceHashes: Record<string, string> = {};
for (const name of ['scripts/mixture-timing-binary-capture.ts', 'scripts/mixture-timing-oracle.ts', 'scripts/mixture-retention-codec.ts', 'src/core/engine.ts', 'src/core/contracts.ts', 'src/audio/synth.ts', 'src/audio/processor.ts', 'src/audio/AudioAdapter.ts', 'src/main.ts']) {
  const bytes = fs.readFileSync(name), target = path.join(root, 'application-source', name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); sourceHashes[name] = sha(bytes);
}
const harnessBytes = fs.readFileSync('scripts/mixture-timing-binary-capture.ts'); fs.writeFileSync(path.join(root, 'capture-harness.ts'), harnessBytes);
const topologyBytes = fs.readFileSync('evidence/step-02/topology.json'); fs.writeFileSync(path.join(root, 'topology.json'), topologyBytes);
const vertices = JSON.parse(topologyBytes.toString()).vertices as number[][];
const plan = [
  { fixture: 'F02', seconds: 64, variant: 'original-positive', delaySeconds: 0 },
  { fixture: 'F03', seconds: 24, variant: 'original-positive', delaySeconds: 0 },
  { fixture: 'F06', seconds: 20, variant: 'original-positive', delaySeconds: 0 },
  { fixture: 'F08', seconds: 20, variant: 'original-positive', delaySeconds: 0 },
  { fixture: 'F02', seconds: 12, variant: 'original-delay100-negative', delaySeconds: .1 },
];
const report: any = { title: 'Bongo Planet original mixture binary timing capture', acceptancePassed: false, qualificationPassed: false, status: 'initializing', createdAt: new Date().toISOString(), commitAtSetup: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), mainAsset: mainName, processorAsset: processorName, mainHash, processorHash, harnessSha256: sha(harnessBytes), sourceHashes, topologySha256: sha(topologyBytes), plan, segments: [], errors: [], testUrl: 'http://127.0.0.1:5420/BongoPlanet/', limitations: ['Capture only; independent analyzer and review are required before any timing qualification.', 'Original PCM and metadata stay ordered and unmodified.', 'Shared observer clock fields are not internal processor clock instrumentation.', 'Negative control adds actual product-path100ms delay; direct native calibration bypasses it.'] };
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
// Fixed plan140s playback +53s calibration/quiet/tail +63s setup/activation/drain.
// Observer375 blocks/s: at256s at most96000 rows/3000 complete PCM frames.
// Bound event envelopes independently from fixture emissions and reach, adding
//5s activation +200ms retained tail per segment, plus all5376 cancellation IDs.
const maxSeconds=256,limits={maxBytes:512*1024*1024,maxFrames:300000};
const eventEnvelope=plan.map(p=>{const scene=JSON.parse(fs.readFileSync(path.join(snapshot,'fixtures',p.fixture+'.json'),'utf8'))as Scene;const duration=p.seconds+5.2;let triggerBound=0,emissionBound=0;for(const g of scene.pieces){if(g.kind!=='generator'||!g.enabled)continue;const count=Math.ceil(duration/(g.period*60/scene.settings.bpm))+1;const origin=vertices[g.vertex];const targets=scene.pieces.filter(n=>n.kind!=='generator'&&Math.acos(Math.max(-1,Math.min(1,origin.reduce((sum,x,i)=>sum+x*vertices[n.vertex][i],0))))<=g.reach*Math.PI/180+1e-9).length;emissionBound+=count;triggerBound+=count*targets;}return{fixture:p.fixture,variant:p.variant,maxPlaybackWithActivationTailSeconds:duration,emissionBound,triggerBound,eventRecordBound:2*triggerBound+emissionBound+5376+8};});
const eventRecords=eventEnvelope.reduce((sum,p)=>sum+p.eventRecordBound,0),pcmBytes=maxSeconds*48000*8,metadataBytes=96000*512,eventBytes=eventRecords*1024,eventBatchEnvelopeBytes=96000*256,estimatedBoundBytes=pcmBytes+metadataBytes+eventBytes+eventBatchEnvelopeBytes;
const budget={maxActualAcquisitionSeconds:maxSeconds,playbackSeconds:140,calibrationQuietTailSeconds:53,headroomSeconds:63,quantumsPerSecond:375,pcmFrames:3000,originalCallbackRenderBound:96000,eventWireFrameBound:eventRecords,commandFrameHeadroom:1000,eventEnvelope,eventRecords,serializedEventRecordEnvelopeBytes:1024,metadataRowEnvelopeBytes:512,eventBatchEnvelopeBytes,pcmBytes,metadataBytes,eventBytes,estimatedBoundBytes,containerHeadroomBytes:limits.maxBytes-estimatedBoundBytes,limits,maxFrameBytes:262144,maxSendBytes:8*1024*1024,pendingCaps:{pcmBatchFrames:128,eventWireChunkFrames:128},eventCallbackUnit:'Original callbacks separately indexed; event pending128 counts wire chunks after framing'};
if(eventRecords+3000+1000>=limits.maxFrames||estimatedBoundBytes>=limits.maxBytes)throw Error('Declared original-workload byte envelope exceeds container budget');report.transportBudget=budget;
report.preflight=plan.filter(p=>p.delaySeconds===0).map(p=>{const scene=JSON.parse(fs.readFileSync(path.join(snapshot,'fixtures',p.fixture+'.json'),'utf8'));const voices=fixtureOracle(scene,vertices,0,p.seconds),groups=onsetGroups(voices);return{fixture:p.fixture,seconds:p.seconds,logicalVoices:voices.length,groups:groups.length,audibleGroups:groups.filter(g=>g.voices.some(v=>v.level>0&&!erasedBeforeSound(v))).length,erasedBeforeSound:voices.filter(v=>erasedBeforeSound(v)).length,actualIdentifiedGroups:null};});
report.preflightModeledAudibleGroups=report.preflight.reduce((sum:number,p:any)=>sum+p.audibleGroups,0);
if(report.preflightModeledAudibleGroups<120)throw Error('Fixed independent positive group denominator below120');
report.limitations.push('Modeled audible groups are acquisition denominators, never actual identification; coincident/erased/saturated identity ambiguity remains for independent analysis.','Event pending cap128 counts transport chunk frames; original callback count/row denominator is independently retained and reassembled. Binary retention uses a complete length-prefixed container and ACK after full write; derived cross-file copies are not atomic or fsync durability proof.');
const capability=randomUUID(),containerFile=path.join(root,'capture.container');fs.writeFileSync(containerFile,'');const fd=fs.openSync(containerFile,'a');
const collector:Collector={ledger:{pcm:0,events:0,blocks:0,eventRecords:0,bytes:0,frames:0},failure:null};
let connected:WebSocket|undefined,socketServer:WebSocketServer|undefined,callbacksOpen=true,nodeInFlight=0;
let eventAssembly={...EMPTY_EVENT_ASSEMBLY};
const nodeTrace:any[]=[];const startedMs=performance.now(),softDeadlineMs=256000,hardDeadlineMs=270000;
let browserServer:BrowserServer|undefined,launchClosing=false,watchdog:ReturnType<typeof setTimeout>|undefined;
async function bounded<T>(promise:Promise<T>,ms=Math.min(10000,softDeadlineMs-(performance.now()-startedMs))):Promise<T>{if(ms<=0)throw Error('Acquisition deadline');let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([promise,new Promise<never>((_,reject)=>timer=setTimeout(()=>reject(Error('Bounded acquisition operation timed out')),ms))]);}finally{if(timer)clearTimeout(timer);}}
function retain(frame:Buffer,trace:any){if(!callbacksOpen)throw Error('Collector admission closed');const decoded=decode(frame),nextAssembly=decoded.kind===2?validateEventChunk(decoded.meta,eventAssembly):eventAssembly;const ack=commitFrame(fd,frame,trace,collector,undefined,limits);eventAssembly=nextAssembly;const l=collector.ledger;Object.assign(stats,{batches:l.pcm,blocks:l.blocks,sourceSamples:l.blocks*128,inputSamples:l.blocks*128,events:l.eventRecords,eventBatches:l.events});return ack;}
function derive(){let offset=0;const size=fs.statSync(containerFile).size,readfd=fs.openSync(containerFile,'r');let ledger={pcm:0,events:0,blocks:0,eventRecords:0,bytes:0,frames:0},assembly={...EMPTY_EVENT_ASSEMBLY};const errors:string[]=[];
try{while(offset<size){const prefix=Buffer.alloc(4);if(fs.readSync(readfd,prefix,0,4,offset)!==4)throw Error('Partial prefix');const length=prefix.readUInt32LE();if(length<28||length>262144||offset+4+length>size)throw Error('Partial/oversize frame');const frame=Buffer.alloc(length);if(fs.readSync(readfd,frame,0,length,offset+4)!==length)throw Error('Short frame');const d=decode(frame),next=validate(d,ledger,limits);
if(d.kind===1){stats.firstContextTime??=d.meta.blocks[0].currentTime;const end=d.meta.blocks.at(-1);stats.lastContextEnd=end.currentTime+end.quantum/48000;fs.appendFileSync(sourceFile,d.source);fs.appendFileSync(inputFile,d.input);fs.appendFileSync(metadataFile,d.meta.blocks.map((b:any,i:number)=>JSON.stringify({...b,sourceOffset:(ledger.blocks+i)*128,inputOffset:(ledger.blocks+i)*128,containerFrame:ledger.frames,containerOffset:offset,pcmSequence:d.meta.sequence})).join('\n')+'\n');for(const[bytes,name]of[[d.source,'sourcePeak'],[d.input,'inputPeak']]as const)for(let i=0;i<bytes.length;i+=4){const value=bytes.readFloatLE(i);if(!Number.isFinite(value))stats.nonfinite++;stats[name]=Math.max(stats[name],Math.abs(value));}}
else{assembly=validateEventChunk(d.meta,assembly);const start=segmentEventCounts.get(d.meta.segment)??0;fs.appendFileSync(eventsFile,derivedEventRows(d.meta,ledger.eventRecords,start,ledger.frames,offset).map((row:any)=>JSON.stringify(row)).join('\n')+'\n');segmentEventCounts.set(d.meta.segment,start+d.meta.events.length);}ledger=next;offset+=4+length;}}
catch(error){errors.push(String(error));}finally{fs.closeSync(readfd);}return{complete:offset===size&&!errors.length,containerBytes:size,derivedPrefixBytes:offset,unparsedTailBytes:size-offset,ledger,eventAssembly:assembly,originalCallbacksComplete:assembly.offset===0,errors};}

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
  watchdog=setTimeout(()=>{report.hardDeadlineReached=true;launchClosing=true;browserServer?.process().kill('SIGTERM');},hardDeadlineMs);
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(5420, '127.0.0.1', resolve); }); report.servedBefore = await attest('before');
  const launching=chromium.launchServer({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, ignoreDefaultArgs: ['--mute-audio'], args: ['--enable-automation', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  void launching.then(server=>{if(launchClosing)server.process().kill('SIGTERM');},()=>{}); browserServer=await bounded(launching,7000);report.ownedBrowserPid=browserServer.process().pid; browser=await bounded(chromium.connect(browserServer.wsEndpoint()));
  const context = await browser.newContext({ viewport: { width: 1360, height: 820 } }); await context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5420' });
  page = await context.newPage();const actualPage=page;page=new Proxy(actualPage,{get(target,key){const value=Reflect.get(target,key);if(['evaluate','waitForFunction','goto','waitForTimeout'].includes(String(key))&&typeof value==='function')return(...args:any[])=>bounded(value.apply(target,args));return typeof value==='function'?value.bind(target):value;}})as Page; await page.addInitScript('globalThis.__name=fn=>fn;'); report.browser = browser.version();
  report.browserArguments = (await (await browser.newBrowserCDPSession()).send('Browser.getBrowserCommandLine')).arguments;
  if (report.browserArguments.includes('--mute-audio')) throw Error('Chrome output unexpectedly muted.');
  page.on('pageerror', error => report.errors.push(String(error)));
  socketServer=new WebSocketServer({port:5424,host:'127.0.0.1',maxPayload:262144,perMessageDeflate:false});
  await bounded(new Promise<void>((resolve,reject)=>{socketServer!.once('listening',resolve);socketServer!.once('error',reject);}));
  socketServer.on('connection',(ws,request)=>{if(connected||request.headers.origin!=='http://127.0.0.1:5420'||request.url!=='/?capability='+capability){ws.close(1008,'Unexpected capability/origin');return;}connected=ws;
  ws.on('error',error=>report.errors.push('Retention socket: '+String(error)));ws.on('message',(data,binary)=>{const trace:any={arrivalObservedAtCallbackEntryMs:performance.now(),binary};nodeInFlight++;try{const bytes=Buffer.isBuffer(data)?data:data instanceof ArrayBuffer?Buffer.from(data):Buffer.concat(data);trace.wireBytes=bytes.length;if(bytes.length>262144)throw Error('Wire cap');trace.decodeStartMs=performance.now();let frame:Buffer;if(binary)frame=bytes;else{const meta=JSON.parse(bytes.toString());if(meta.kind!=='events')throw Error('Text stream kind');frame=encode(2,meta);}trace.decodeEndMs=performance.now();const ack=retain(frame,trace);trace.sequence=ack.sequence;trace.kind=ack.kind;trace.ackEnqueueStartMs=performance.now();const text=JSON.stringify(ack);if(ws.bufferedAmount+Buffer.byteLength(text)>8*1024*1024)throw Error('ACK send cap');ws.send(text);trace.ackEnqueueEndMs=performance.now();}catch(error){trace.error=String(error);report.errors.push(trace.error);if(!collector.failure)collector.failure={error:trace.error,nodeMonotonicMs:performance.now(),writtenBytes:trace.writtenBytes??0,expectedRecordBytes:trace.expectedRecordBytes??null};ws.close(1011,'Collector terminal failure');}finally{trace.exitMs=performance.now();nodeInFlight--;if(nodeTrace.length>=100000){report.errors.push('Node trace cap');ws.close(1011,'Trace cap');}else nodeTrace.push(trace);}});});
  await page.goto(report.testUrl); await page.waitForFunction(() => !!(window as any).__bongo); await page.locator('#enable').click(); await page.waitForFunction(() => !!(window as any).__bongo.audio.node);
  const devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId }))); save('devices.json', devices);
  const input = devices.find(d => d.kind === 'audioinput' && d.label === 'SPAT 8ch loopback (Virtual)'), output = devices.find(d => d.kind === 'audiooutput' && d.label === 'SPAT 8ch loopback (Virtual)');
  if (!input || !output) throw Error('Exact SPAT input/output missing; microphone fallback forbidden.');
  report.setup = await page.evaluate(async ({ inputId, outputId, code, socketURL, ackCode, finiteCode, checksumCode, pcmCode, chunkCode }) => {
    const b = (window as any).__bongo, ctx: AudioContext = b.audio.context; await (ctx as any).setSinkId(outputId); await b.audio.enable(); if (ctx.sampleRate !== 48000) throw Error('Unexpected context sample rate.');
    const state: any = { ctx, stream: null, observer: null, media: null, product: b.audio.node, delay: null, segment: null, firstEmission: null, firstEmissionSessionNamespace: null, pending: 0, eventPending: 0, maxPending: 0, maxEventPending: 0, error: null, eventBatchIndex: 0, eventCallbackIndex:0, sessionNamespace: null, originalOnEvents: b.audio.onEvents, trace:[],socketPending:new Map(),ackNext:{pcm:0,events:0},stopped:false,pcmDispatches:0,eventDispatches:0 };
    (window as any).__mixture = state;
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { deviceId: { exact: inputId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 1 }, sampleRate: { ideal: 48000 } } }); state.stream = stream;
    const track = stream.getAudioTracks()[0]; if (track.getSettings().deviceId !== inputId || !track.label.includes('SPAT 8ch loopback')) throw Error('Input identity mismatch.');
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
    const observer = new AudioWorkletNode(ctx, 'mixture-capture', { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [1], channelCountMode: 'max' }), media = ctx.createMediaStreamSource(stream); state.observer = observer; state.media = media;
    state.finite=new Function('return '+finiteCode)();state.checksum=new Function('return '+checksumCode)();state.preparePCM=new Function('checksum','finiteJSON','return '+pcmCode)(state.checksum,state.finite);state.validAck=new Function('return '+ackCode)();state.eventChunks=new Function('finiteJSON','return '+chunkCode)(state.finite);
    state.record=(row:any)=>{if(state.trace.length>=100000){state.fail('Browser trace cap',{kind:'trace'});return;}state.trace.push(row);};
    state.fail=(error:string,row:any)=>{if(!state.error){state.error=error;state.firstError={...row,error,browserMonotonicMs:performance.now(),contextTime:ctx.currentTime,pending:state.pending,eventPending:state.eventPending};if(row.kind?.includes('overflow'))state.firstOverflow=state.firstError;b.audio.pause();}};
    state.socket=new WebSocket(socketURL);state.socket.binaryType='arraybuffer';state.socketClosed=false;
    await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Socket activation deadline')),3000);state.socket.onopen=()=>{clearTimeout(timer);resolve();};state.socket.onerror=()=>{clearTimeout(timer);reject(Error('Socket activation error'));};});
    state.socket.onmessage=(event:MessageEvent)=>{try{const ack=JSON.parse(event.data),kind=ack.kind===1?'pcm':'events',key=kind+':'+ack.sequence,entry=state.socketPending.get(key);if(!entry)throw Error('Unmatched ACK');state.validAck(ack,kind,entry.sequence,entry.frameBytes,state.ackNext[kind]);state.ackNext[kind]++;state.socketPending.delete(key);entry.resolve();}catch(error){state.fail(String(error),{kind:'ack'});}};
    state.socket.onerror=()=>state.fail('Retention socket error',{kind:'socket'});state.socket.onclose=()=>{state.socketClosed=true;if(!state.stopped)state.fail('Retention disconnected',{kind:'socket-close'});};
    state.send=(kind:string,payload:any)=>new Promise<void>((resolve,reject)=>{const key=kind+':'+payload.sequence;if(state.socketPending.has(key)||state.socket.readyState!==WebSocket.OPEN)throw Error('Socket sequence/readiness');const wireBytes=typeof payload.wire==='string'?new TextEncoder().encode(payload.wire).length:payload.wire.byteLength;if(state.socket.bufferedAmount+wireBytes>8*1024*1024)throw Error('Browser send cap');state.socketPending.set(key,{...payload,resolve,reject});try{state.socket.send(payload.wire);}catch(error){state.socketPending.delete(key);reject(error);}});
    observer.onprocessorerror=()=>state.fail('Observer processorerror',{kind:'observer'});
    observer.port.onmessage=({data})=>{if(state.error||state.stopped)return;const receiveBrowserMonotonicMs=performance.now(),receiveContextTime=ctx.currentTime;if(state.pending>=128){state.fail('PCM retention backlog limit exceeded',{kind:'pcm-overflow',sequence:data.sequence,firstIndex:data.blocks[0]?.index,lastIndex:data.blocks.at(-1)?.index,receiveBrowserMonotonicMs,receiveContextTime});return;}state.pending++;state.maxPending=Math.max(state.maxPending,state.pending);let payload:any;try{payload=state.preparePCM(data);}catch(error){state.pending--;state.fail(String(error),{kind:'pcm-prepare',sequence:data.sequence});return;}const dispatchStartMs=performance.now();state.pcmDispatches++;state.record({kind:'pcm-dispatch',sequence:data.sequence,dispatchStartMs,receiveBrowserMonotonicMs,receiveContextTime,pending:state.pending,eventPending:state.eventPending});void state.send('pcm',payload).then(()=>state.record({kind:'pcm-settlement',sequence:data.sequence,settledBrowserMonotonicMs:performance.now(),success:true})).catch((error:unknown)=>{state.record({kind:'pcm-settlement',sequence:data.sequence,settledBrowserMonotonicMs:performance.now(),success:false,error:String(error)});state.fail(String(error),{kind:'pcm-retention',sequence:data.sequence});}).finally(()=>state.pending--);};
    b.audio.onEvents=(events:any[])=>{const receiveContextTime=ctx.currentTime,receiveBrowserMonotonicMs=performance.now();const reset=events.find(event=>event.type==='reset'),trigger=events.find(event=>event.type==='trigger'||event.type==='onset');state.sessionNamespace=reset?.session??trigger?.trigger.session??state.sessionNamespace;const first=events.find(event=>event.type==='emission');if(state.segment!==null&&!state.firstEmission&&first){state.firstEmission={event:structuredClone(first),receiveContextTime,receiveBrowserMonotonicMs};state.firstEmissionSessionNamespace=state.sessionNamespace;}try{state.originalOnEvents?.(events);}catch(error){state.fail(String(error),{kind:'original-handler'});throw error;}if(state.error||state.stopped)return;const callbackIndex=state.eventCallbackIndex++;try{const chunks=state.eventChunks({kind:'events',callbackIndex,segment:state.segment,sessionNamespace:state.sessionNamespace,receiveContextTime,receiveBrowserMonotonicMs,events},state.eventBatchIndex);for(const payload of chunks){const sequence=payload.sequence;if(state.eventPending>=128){state.fail('Event retention backlog limit exceeded',{kind:'event-overflow',sequence,callbackIndex,chunkIndex:payload.meta.chunkIndex,receiveBrowserMonotonicMs,receiveContextTime});return;}state.eventPending++;state.eventBatchIndex++;state.maxEventPending=Math.max(state.maxEventPending,state.eventPending);const dispatchStartMs=performance.now();state.eventDispatches++;state.record({kind:'event-dispatch',sequence,callbackIndex,chunkIndex:payload.meta.chunkIndex,chunkCount:payload.meta.chunkCount,chunkOffset:payload.meta.chunkOffset,callbackRows:payload.meta.callbackRows,dispatchStartMs,receiveBrowserMonotonicMs,receiveContextTime,segment:state.segment});void state.send('events',payload).then(()=>state.record({kind:'event-settlement',sequence,settledBrowserMonotonicMs:performance.now(),success:true})).catch((error:unknown)=>{state.record({kind:'event-settlement',sequence,settledBrowserMonotonicMs:performance.now(),success:false,error:String(error)});state.fail(String(error),{kind:'event-retention',sequence});}).finally(()=>state.eventPending--);}}catch(error){state.fail(String(error),{kind:'event-prepare',callbackIndex});}};
    state.product.connect(observer, 0, 0); media.connect(observer, 0, 1); observer.connect(ctx.destination);
    return { sampleRate: ctx.sampleRate, inputLabel: track.label, inputSettings: track.getSettings(), sinkId: (ctx as any).sinkId, graph: 'normal production destination plus parallel pre-device tap; input1 exact SPAT; observer output silence; negative product-only DelayNode on audible branch, native clicks direct to destination' };
  }, { inputId: input.deviceId, outputId: output.deviceId, code: observerCode, socketURL:'ws://127.0.0.1:5424/?capability='+capability,ackCode:validAck.toString(),finiteCode:finiteJSON.toString(),checksumCode:checksum.toString(),pcmCode:encodeBrowserPCM.toString(),chunkCode:eventChunks.toString() });
  const calibration = async (segment: any, phase: string) => {
    const retainedBlocksBefore = stats.blocks;
    const result = await page!.evaluate(() => { const d = (window as any).__mixture, anchor = d.ctx.currentTime + .5, clicks = []; for (let i = 0; i < 12; i++) { const buffer = d.ctx.createBuffer(1, 48, d.ctx.sampleRate); buffer.getChannelData(0).fill(.3); const node = d.ctx.createBufferSource(); node.buffer = buffer; node.connect(d.ctx.destination); const time = anchor + i * .3; node.start(time); clicks.push({ expectedContextTime: time, amplitude: .3, samples: 48 }); } return { scheduledAtContextTime: d.ctx.currentTime, scheduledAtBrowserMonotonicMs: performance.now(), clicks, bypassesProductDelayAndTap: true }; });
    await bounded(page!.waitForTimeout(4200)); await bounded(page!.waitForFunction(()=>{const d=(window as any).__mixture;return d.error||(!d.pending&&!d.eventPending);},null,{timeout:5000,polling:10}));const health=await captureState();if(health?.observer?.error||report.errors.length)throw Error('Native calibration retention failure'); segment['calibration' + phase] = { ...result, retainedBlocksBefore, retainedBlocksAfter: stats.blocks, noProductPCMFit: true };
  };
  for (let index = 0; index < plan.length; index++) {
    if(performance.now()-startedMs>=softDeadlineMs)throw Error('Global acquisition deadline');
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
      if(performance.now()-startedMs>=softDeadlineMs)throw Error('Global acquisition deadline');
      const health = await page.evaluate(() => { const b = (window as any).__bongo, d = (window as any).__mixture; return { contextTime: d.ctx.currentTime, contextState: d.ctx.state, audioState: b.audio.state, error: d.error }; });
      if (report.errors.length || collector.failure || health.error || ['error', 'interrupted'].includes(health.audioState) || health.contextState !== 'running') throw Error('Audio or observer failed during the fixed product window.');
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
        if (report.errors.length || collector.failure || !status.audio.running || status.audio.session !== segment.actualSessionNamespace || status.observer.error || stats.blocks <= previousBlocks) throw Error('Playback or recorder stopped.'); previousBlocks = stats.blocks;
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
 try{report.preCleanupSnapshot={...await bounded(captureState(),1500),retained:{...stats}};}catch(error){report.errors.push('Final snapshot: '+String(error));}
 try{report.cleanup=page?await bounded(page.evaluate(async()=>{const b=(window as any).__bongo,d=(window as any).__mixture;if(!d)return null;b.audio.pause();b.audio.onEvents=d.originalOnEvents;d.product.disconnect(d.observer);d.observer.disconnect();d.observer.port.onmessage=null;d.media?.disconnect();d.delay?.disconnect();d.stream?.getTracks().forEach((track:MediaStreamTrack)=>track.stop());await d.ctx.close();const deadline=performance.now()+5000;while((d.pending||d.eventPending)&&performance.now()<deadline)await new Promise(r=>setTimeout(r,10));if(d.pending||d.eventPending)d.error??='Retention drain timed out';d.stopped=true;d.socket.close();const close=performance.now()+500;while(!d.socketClosed&&performance.now()<close)await new Promise(r=>setTimeout(r,10));return{pending:d.pending,eventPending:d.eventPending,maxPending:d.maxPending,maxEventPending:d.maxEventPending,error:d.error,firstError:d.firstError??null,firstOverflow:d.firstOverflow??null,contextState:d.ctx.state,tracksStopped:d.stream.getTracks().every((t:MediaStreamTrack)=>t.readyState==='ended'),socketClosed:d.socketClosed,socketPending:d.socketPending.size,pcmDispatches:d.pcmDispatches,eventDispatches:d.eventDispatches,eventCallbackCount:d.eventCallbackIndex,trace:d.trace};}),7000):null;if(report.cleanup?.trace){fs.writeFileSync(path.join(root,'browser-retention-trace.json'),JSON.stringify(report.cleanup.trace)+'\n');delete report.cleanup.trace;}}catch(error){report.errors.push('Cleanup: '+String(error));}
 callbacksOpen=false;report.nodeCallbackAdmissionClosed=true;report.nodeInFlightAtClose=nodeInFlight;launchClosing=true;
 try{await bounded(browser?.close()??Promise.resolve(),2500);await bounded(browserServer?.close()??Promise.resolve(),1500);report.browserClosed=true;}catch(error){report.errors.push('Browser cleanup: '+String(error));}
 const owned=browserServer?.process();if(owned&&owned.exitCode===null&&owned.signalCode===null){report.forcedBrowserStop=true;owned.kill('SIGTERM');const end=performance.now()+1000;while(owned.exitCode===null&&owned.signalCode===null&&performance.now()<end)await new Promise(r=>setTimeout(r,25));if(owned.exitCode===null&&owned.signalCode===null){owned.kill('SIGKILL');await new Promise(r=>setTimeout(r,100));}}report.browserProcessClosed=!!owned&&(owned.exitCode!==null||owned.signalCode!==null);
 if(socketServer){try{socketServer.clients.forEach(ws=>ws.terminate());await bounded(new Promise<void>(r=>socketServer!.close(()=>r())),1500);report.socketServerClosed=true;}catch(error){report.errors.push('Socket cleanup: '+String(error));}}
 fs.closeSync(fd);report.containerFdClosed=true;report.collectorFailure=collector.failure;report.derived=derive();report.originalEventCallbacks=eventAssembly.nextCallback;fs.writeFileSync(path.join(root,'node-retention-trace.json'),JSON.stringify(nodeTrace)+'\n');
 try{if(server.listening)report.servedAfter=await bounded(attest('after'),2000);}catch(error){report.errors.push('Post binding: '+String(error));}
 if(server.listening){try{server.closeAllConnections();await bounded(new Promise<void>(r=>server.close(()=>r())),1500);}catch(error){report.errors.push('Client server cleanup: '+String(error));}}report.serverClosed=!server.listening;report.finishedAt=new Date().toISOString();report.elapsedMonotonicSeconds=(performance.now()-startedMs)/1000;if(watchdog)clearTimeout(watchdog);
 if(report.errors.length||report.elapsedMonotonicSeconds>hardDeadlineMs/1000||!report.derived.complete||!report.derived.originalCallbacksComplete||eventAssembly.offset!==0||eventAssembly.nextCallback!==report.cleanup?.eventCallbackCount||!report.cleanup||report.cleanup.error||report.cleanup.pending||report.cleanup.eventPending||report.cleanup.socketPending||!report.cleanup.socketClosed||!report.cleanup.tracksStopped||report.cleanup.contextState!=='closed'||stats.batches!==report.cleanup.pcmDispatches||stats.eventBatches!==report.cleanup.eventDispatches||nodeInFlight||!report.browserClosed||!report.browserProcessClosed||report.forcedBrowserStop||report.hardDeadlineReached)report.status='failed-or-interrupted';report.stats=stats;save('report.json',report);
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
report.captureErrorFree = report.derived.complete && report.derived.originalCallbacksComplete && report.browserClosed && report.browserProcessClosed && report.socketServerClosed && !report.collectorFailure && report.status === 'captured-observation' && report.errors.length === 0 && !report.cleanup?.error && stats.nonfinite === 0 && report.orderedIndependentIndices && report.rawMetadataCountsMatch && report.segments.length === plan.length && report.segments.every((segment: any) => segment.status === 'captured-observation' && segment.elapsedMonotonicSeconds >= segment.seconds && segment.fullTimerCovered && segment.requiredPathsComplete && segment.stallInterventionsValid);
save('report.json', report);
const manifest: Record<string, { bytes: number; sha256: string }> = {};
for (const name of fs.readdirSync(root)) if (name !== 'manifest.json' && fs.statSync(path.join(root, name)).isFile()) { const bytes = fs.readFileSync(path.join(root, name)); manifest[name] = { bytes: bytes.length, sha256: sha(bytes) }; } save('manifest.json', manifest);
console.log('MIXTURE_DONE ' + JSON.stringify({ status: report.status, captureErrorFree: report.captureErrorFree, segments: report.segments.map((segment: any) => ({ fixture: segment.fixture, variant: segment.variant, firstEmission: segment.firstEmission, fullTimerCovered: segment.fullTimerCovered, observedTimedBlocks: segment.observedTimedBlocks })), acceptancePassed: false }));
if (!report.captureErrorFree) process.exitCode = 1;
