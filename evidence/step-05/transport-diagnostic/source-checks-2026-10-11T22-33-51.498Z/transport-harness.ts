import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { createHash, randomUUID } from 'node:crypto';
import { chromium, type Browser, type BrowserServer, type Page } from '@playwright/test';

const MAX_FRAME=262144,MAX_CONTAINER=64*1024*1024,MAX_FRAMES=4096;
type Ledger={pcm:number;events:number;blocks:number;eventRecords:number;bytes:number;frames:number};
function checksum(bytes:Uint8Array){let h=2166136261;for(const value of bytes)h=Math.imul(h^value,16777619);return h>>>0;}
function encode(kind:number,meta:any,source=Buffer.alloc(0),input=Buffer.alloc(0)){
 if(!finiteJSON(meta))throw Error('Original nonfinite metadata/events');const json=Buffer.from(JSON.stringify(meta)),length=28+json.length+source.length+input.length;if(length>MAX_FRAME||source.length%4||input.length%4)throw Error('Frame cap/PCM byte alignment');
 const header=Buffer.alloc(28);[0x42475031,1,kind,meta.sequence,json.length,source.length/4,input.length/4].forEach((v,i)=>header.writeUInt32LE(v,i*4));return Buffer.concat([header,json,source,input]);
}
function decode(frame:Buffer){
 if(frame.length<28||frame.length>MAX_FRAME||frame.readUInt32LE(0)!==0x42475031||frame.readUInt32LE(4)!==1)throw Error('Invalid frame header/cap');
 const kind=frame.readUInt32LE(8),sequence=frame.readUInt32LE(12),jsonBytes=frame.readUInt32LE(16),sourceSamples=frame.readUInt32LE(20),inputSamples=frame.readUInt32LE(24);
 if(![1,2].includes(kind)||28+jsonBytes+4*(sourceSamples+inputSamples)!==frame.length)throw Error('Frame length/kind mismatch');
 const meta=JSON.parse(frame.subarray(28,28+jsonBytes).toString());if(meta.sequence!==sequence)throw Error('Frame sequence binding');
 const source=frame.subarray(28+jsonBytes,28+jsonBytes+4*sourceSamples),input=frame.subarray(28+jsonBytes+4*sourceSamples);return{kind,meta,source,input,frameBytes:frame.length};
}
function finiteJSON(value:any):boolean{if(typeof value==='number')return Number.isFinite(value);if(value&&typeof value==='object')return Object.values(value).every(finiteJSON);return true;}
function validate(d:ReturnType<typeof decode>,l:Ledger):Ledger{
 if(!Number.isSafeInteger(d.meta.sequence)||!finiteJSON(d.meta)||l.frames>=MAX_FRAMES||l.bytes+d.frameBytes+4>MAX_CONTAINER)throw Error('Sequence/finite/container frame or byte cap');
 const next={...l,frames:l.frames+1,bytes:l.bytes+d.frameBytes+4};
 if(d.kind===1){
  if(d.meta.sequence!==l.pcm||!Array.isArray(d.meta.blocks)||d.meta.blocks.length!==32||d.source.length!==32*128*4||d.input.length!==32*128*4)throw Error('PCM sequence/batch/path length');
  for(const [i,b]of d.meta.blocks.entries())if(b.index!==l.blocks+i||b.quantum!==128||b.sourceLength!==128||b.inputLength!==128||!Number.isSafeInteger(b.sourceChannels)||b.sourceChannels<1||!Number.isSafeInteger(b.inputChannels)||b.inputChannels<1||!Number.isSafeInteger(b.currentFrame)||b.currentFrame<0||!Number.isFinite(b.currentTime)||b.currentTime<0)throw Error('PCM independent index/channels/quantum/clock');
  for(const bytes of[d.source,d.input])for(let i=0;i<bytes.length;i+=4)if(!Number.isFinite(bytes.readFloatLE(i)))throw Error('Nonfinite original Float32');
  if(checksum(d.source)!==d.meta.sourceChecksum32||checksum(d.input)!==d.meta.inputChecksum32)throw Error('Original Float32 byte checksum mismatch');
  next.pcm++;next.blocks+=32;
 }else{
  if(d.source.length||d.input.length||d.meta.sequence!==l.events||!Array.isArray(d.meta.events)||!d.meta.events.length||d.meta.events.length>2048||!Number.isFinite(d.meta.receiveBrowserMonotonicMs)||!Number.isFinite(d.meta.receiveContextTime))throw Error('Event sequence/count/path/receive clock');
  next.events++;next.eventRecords+=d.meta.events.length;
 }
 return next;
}
function validAck(ack:any,kind:string,sequence:number,frameBytes:number,nextSequence:number){if(!ack||ack.kind!==(kind==='pcm'?1:2)||ack.sequence!==sequence||ack.sequence!==nextSequence||ack.frameBytes!==frameBytes)throw Error('Missing/reordered/invalid retention ACK');return true;}
function appendComplete(fd:number,record:Buffer,trace:any,write=(buffer:Buffer,offset:number,length:number)=>fs.writeSync(fd,buffer,offset,length)){
 trace.expectedRecordBytes=record.length;trace.writtenBytes=0;while(trace.writtenBytes<record.length){const count=write(record,trace.writtenBytes,record.length-trace.writtenBytes);if(!Number.isSafeInteger(count)||count<=0||count>record.length-trace.writtenBytes)throw Error('Incomplete/invalid container write');trace.writtenBytes+=count;}
}
type Collector={ledger:Ledger;failure:null|{error:string;nodeMonotonicMs:number;writtenBytes:number;expectedRecordBytes:number|null}};
function commitFrame(fd:number,frame:Buffer,trace:any,collector:Collector,write?: (buffer:Buffer,offset:number,length:number)=>number){
 if(collector.failure){trace.refusedAfterPoison=true;throw Error('Collector terminal failure: '+collector.failure.error);}
 try{trace.decodeStartMs=performance.now();const decoded=decode(frame);trace.decodeEndMs=performance.now();trace.validateStartMs=performance.now();const delta=validate(decoded,collector.ledger);trace.validateEndMs=performance.now();trace.writeStartMs=performance.now();const prefix=Buffer.alloc(4);prefix.writeUInt32LE(frame.length);appendComplete(fd,Buffer.concat([prefix,frame]),trace,write);trace.writeEndMs=performance.now();collector.ledger=delta;return{kind:decoded.kind,sequence:decoded.meta.sequence,frameBytes:frame.length};}
 catch(error){trace.error=String(error);collector.failure={error:trace.error,nodeMonotonicMs:performance.now(),writtenBytes:trace.writtenBytes??0,expectedRecordBytes:trace.expectedRecordBytes??null};throw error;}
}
function derive(file:string,directory:string){
 const fd=fs.openSync(file,'r'),size=fs.statSync(file).size;let offset=0,ledger:Ledger={pcm:0,events:0,blocks:0,eventRecords:0,bytes:0,frames:0};const errors:string[]=[];
 try{while(offset<size){const prefix=Buffer.alloc(4);if(fs.readSync(fd,prefix,0,4,offset)!==4)throw Error('Partial container length prefix');const length=prefix.readUInt32LE();if(length<28||length>MAX_FRAME||offset+4+length>size)throw Error('Partial/oversize container frame');const frame=Buffer.alloc(length);if(fs.readSync(fd,frame,0,length,offset+4)!==length)throw Error('Short retained frame');const d=decode(frame),next=validate(d,ledger);if(d.kind===1){fs.appendFileSync(path.join(directory,'product-tap.f32'),d.source);fs.appendFileSync(path.join(directory,'virtual-input.f32'),d.input);fs.appendFileSync(path.join(directory,'quantums.jsonl'),d.meta.blocks.map((b:any,i:number)=>JSON.stringify({...b,sourceOffset:(ledger.blocks+i)*128,inputOffset:(ledger.blocks+i)*128,containerFrame:ledger.frames,containerOffset:offset,pcmSequence:d.meta.sequence})).join('\n')+'\n');}else fs.appendFileSync(path.join(directory,'events.jsonl'),d.meta.events.map((event:any,i:number)=>JSON.stringify({independentEventIndex:ledger.eventRecords+i,eventBatchIndex:d.meta.sequence,containerFrame:ledger.frames,containerOffset:offset,receiveContextTime:d.meta.receiveContextTime,receiveBrowserMonotonicMs:d.meta.receiveBrowserMonotonicMs,event})).join('\n')+'\n');ledger=next;offset+=4+length;}}
 catch(error){errors.push(String(error));}finally{fs.closeSync(fd);}
 return{complete:offset===size&&!errors.length,containerBytes:size,derivedPrefixBytes:offset,unparsedTailBytes:size-offset,ledger,errors,limitation:'Derived copies only; original complete/partial container bytes are untouched. No cross-file atomicity or fsync durability claim.'};
}

// Diagnostic controls only: production, original qualification harness and its
// limits are untouched. Fixed ordering is not a randomized causal experiment.
const checking=process.argv.slice(2).includes('--check');
if(process.argv.slice(2).some(v=>v!=='--check'))throw Error('Only --check is supported; actual run needs root GO.');
const root = path.resolve('evidence/step-05/transport-diagnostic/'+(checking?'source-checks-'+new Date().toISOString().replaceAll(':','-'):'attempt-01'));

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
const harnessBytes = fs.readFileSync('scripts/mixture-transport-diagnostic.ts'); fs.writeFileSync(path.join(root, 'transport-harness.ts'), harnessBytes);
const arms=[{name:'exposed-function',observer:true,pcm:true,events:true,transport:'exposed'},{name:'binary-websocket',observer:true,pcm:true,events:true,transport:'socket'}];
const requestedSeconds=24,softDeadlineMs=90000,hardDeadlineMs=100000;
const report: any = { title: 'Bongo Planet F06 transport diagnostic', diagnosticOnly: true, qualificationPassed: false, acceptancePassed: false, createdAt: new Date().toISOString(), status: 'preparing', mainAsset: mainName, processorAsset: processorName, mainHash, processorHash, fixtureSha256: hash(fixtureBytes), scene, harnessSha256: hash(harnessBytes), arms, requestedSeconds, softDeadlineMs, hardDeadlineMs, stages: [], errors: [], limitations: ['Fresh owned browser process/page/context for each arm prevents old protocol ACK queues carrying over; fixed ordering and short exposures remain confounds.', 'Original handler duration covers synchronous onEvents only; deferred UI/render/GPU/GC costs are separate.', 'Expose-function invocation includes internal protocol serialization; its internals cannot be separated by this API.', 'Node callback entry is the first observed arrival, not transport arrival or queue admission.', 'Browser and Node monotonic clocks remain separate; no transit subtraction or timing gate.', 'No native click calibration or product onset qualification in this diagnostic.'] };
if(checking){
 const tests:any[]=[];const test=(name:string,fn:()=>void)=>{fn();tests.push({name,passed:true});};const rejects=(fn:()=>void)=>{let rejected=false;try{fn();}catch{rejected=true;}if(!rejected)throw Error('Negative control unexpectedly accepted');};
 const raw=Buffer.alloc(32*128*4);for(let i=0;i<raw.length;i+=4)raw.writeFloatLE(Math.sin(i*.011)*.8,i);const blocks=Array.from({length:32},(_,index)=>({index,currentFrame:index*128,currentTime:index*128/48000,quantum:128,sourceLength:128,inputLength:128,sourceChannels:1,inputChannels:1}));
 const meta={sequence:0,blocks,sourceChecksum32:checksum(raw),inputChecksum32:checksum(raw)},frame=encode(1,meta,raw,raw),empty:Ledger={pcm:0,events:0,blocks:0,eventRecords:0,bytes:0,frames:0};
 test('Original binary Float32 bytes preserved',()=>{const d=decode(frame);validate(d,empty);if(!d.source.equals(raw)||!d.input.equals(raw))throw Error('Byte roundtrip');});
 test('Exposed JSON Array.from finite Float32 roundtrip',()=>{const array=Array.from(new Float32Array(raw.buffer,raw.byteOffset,raw.length/4)),round=Buffer.from(Float32Array.from(JSON.parse(JSON.stringify(array))).buffer);if(!round.equals(raw))throw Error('Baseline fidelity');});
 test('Header/truncation/extra bytes reject',()=>{rejects(()=>decode(frame.subarray(0,frame.length-1)));rejects(()=>decode(Buffer.concat([frame,Buffer.alloc(1)])));const bad=Buffer.from(frame);bad.writeUInt32LE(0,0);rejects(()=>decode(bad));});
 test('Corrupt PCM/NaN rejects without ACK',()=>{const bad=Buffer.from(frame);bad[bad.length-10]^=1;rejects(()=>validate(decode(bad),empty));const nonfinite=Buffer.from(raw);nonfinite.writeFloatLE(NaN,4);rejects(()=>validate(decode(encode(1,{...meta,sourceChecksum32:checksum(nonfinite)},nonfinite,raw)),empty));});
 test('Original NaN/Infinity JSON tree rejects before encoding',()=>{rejects(()=>encode(2,{sequence:0,receiveBrowserMonotonicMs:1,receiveContextTime:1,events:[{time:NaN}]}));rejects(()=>encode(1,{...meta,blocks:blocks.map((b,i)=>i?b:{...b,currentTime:Infinity})},raw,raw));});
 test('Sequence/index/channel/short quantum rejects',()=>{rejects(()=>validate(decode(frame),{...empty,pcm:1}));for(const change of[{index:2},{sourceChannels:0},{quantum:127}])rejects(()=>validate(decode(encode(1,{...meta,blocks:blocks.map((b,i)=>i?b:{...b,...change})},raw,raw)),empty));});
 test('Frame/count/bytes caps reject',()=>{rejects(()=>encode(1,meta,Buffer.alloc(MAX_FRAME),raw));rejects(()=>validate(decode(frame),{...empty,frames:MAX_FRAMES}));rejects(()=>validate(decode(frame),{...empty,bytes:MAX_CONTAINER}));});
 test('Partial/zero append cannot grant full write acknowledgement',()=>{const trace:any={};let writes=0;rejects(()=>appendComplete(0,Buffer.alloc(10),trace,()=>++writes===1?3:0));if(trace.writtenBytes!==3)throw Error('Partial prefix absent');});
 test('Partial PCM commit poisons event stream and refuses append/ACK',()=>{let callbacksOpen=true,nodeInFlight=0;
    const collector:Collector={ledger:{...empty},failure:null},first:any={},second:any={};let calls=0;rejects(()=>commitFrame(0,frame,first,collector,()=>++calls===1?3:0));const event=encode(2,{sequence:0,receiveBrowserMonotonicMs:1,receiveContextTime:1,events:[{type:'emission',time:1}]});const callsBefore=calls;rejects(()=>commitFrame(0,event,second,collector,()=>{calls++;return 1;}));if(calls!==callsBefore||!second.refusedAfterPoison||collector.ledger.frames||collector.failure?.writtenBytes!==3)throw Error('Poison failure escaped');});
 test('Negative zero baseline fidelity loss detected',()=>{const zero=Buffer.from(raw);zero.writeFloatLE(-0,0);const array=Array.from(new Float32Array(zero.buffer,zero.byteOffset,zero.length/4)),round=Buffer.from(Float32Array.from(JSON.parse(JSON.stringify(array))).buffer);if(round.equals(zero))throw Error('Expected JSON negative-zero censor');rejects(()=>validate(decode(encode(1,{...meta,sourceChecksum32:checksum(zero)},round,raw)),empty));});
 test('ACK stream/sequence/bytes controls',()=>{validAck({kind:1,sequence:0,frameBytes:32},'pcm',0,32,0);for(const ack of[{kind:2,sequence:0,frameBytes:32},{kind:1,sequence:1,frameBytes:32},{kind:1,sequence:0,frameBytes:31}])rejects(()=>validAck(ack,'pcm',0,32,0));rejects(()=>validAck({kind:1,sequence:0,frameBytes:32},'pcm',0,32,1));});
 test('Full framed container derives exact retained bytes',()=>{const control=path.join(root,'control');fs.mkdirSync(control);for(const name of['product-tap.f32','virtual-input.f32','quantums.jsonl','events.jsonl'])fs.writeFileSync(path.join(control,name),'');const prefix=Buffer.alloc(4);prefix.writeUInt32LE(frame.length);fs.writeFileSync(path.join(control,'capture.container'),Buffer.concat([prefix,frame]));const d=derive(path.join(control,'capture.container'),control);if(!d.complete||!fs.readFileSync(path.join(control,'product-tap.f32')).equals(raw))throw Error('Derived bytes mismatch');});
 save('checks.json',{sourceOnly:true,liveCapture:false,harnessSha256:hash(harnessBytes),tests});console.log(JSON.stringify({sourceOnly:true,checks:tests.length,output:root}));process.exit(0);
}
const probeStart = performance.now();
let socketServer:WebSocketServer|undefined;
const nodeHeartbeats: Array<{ nodeMonotonicMs: number; elapsedMs: number }> = [];
let lastNodeHeartbeat = performance.now();
const nodeHeartbeat = setInterval(() => { const now = performance.now(); if (nodeHeartbeats.length < 4096) nodeHeartbeats.push({ nodeMonotonicMs: now, elapsedMs: now - lastNodeHeartbeat }); lastNodeHeartbeat = now; }, 50);
report.transportBounds={maxFrameBytes:MAX_FRAME,maxContainerBytesPerArm:MAX_CONTAINER,maxContainerFramesPerArm:MAX_FRAMES,maxBrowserSendBufferBytes:8*1024*1024,maxNodeAckSendBufferBytes:8*1024*1024,independentPendingCaps:{pcm:128,events:128},observerBatchBlocks:32,quantumSamples:128,browserTraceRecords:12000,nodeTraceRecords:4096};
report.limitations.push('New bounded frame/container/send-buffer policies and checksums are diagnostic instrumentation; fixed-order fresh short controls do not reassign the original failure. ACK follows complete synchronous append, not fsync or cross-file atomicity. Resolved-only send-to-ACK percentiles exclude pending censored observations.');
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
  "registerProcessor('transport-observer',RetentionObserver);",
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
  watchdog=setTimeout(()=>{report.hardDeadlineReached=true;browserServer?.process().kill('SIGTERM');},Math.max(1,hardDeadlineMs-(performance.now()-probeStart)));
  for (const arm of arms) {
    if (performance.now() - probeStart >= softDeadlineMs) throw Error('Global diagnostic deadline exceeded before next arm.');
    const nodeCallbacks: any[] = [];
    const stage: any = { ...arm, status: 'preparing', requestedSeconds, nodeStartedAtMonotonicMs: performance.now(), errors: [], stats: { pcmBatches: 0, pcmBlocks: 0, sourceSamples: 0, inputSamples: 0, eventBatches: 0, events: 0, nonfinite: 0 } }; report.stages.push(stage); save('report.json', report);
  let armClosing=false;const launching=chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,ignoreDefaultArgs:['--mute-audio'],args:['--enable-automation','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});void launching.then(server=>{if(armClosing)server.process().kill('SIGTERM');},()=>{});browserServer=await bounded(launching,7000);
  stage.ownedBrowserPid = browserServer.process().pid;
  browser = await bounded(chromium.connect(browserServer.wsEndpoint())); stage.browser = browser.version();
  stage.browserArguments = (await bounded((await browser.newBrowserCDPSession()).send('Browser.getBrowserCommandLine'))).arguments;
  if (stage.browserArguments.includes('--mute-audio')) throw Error('Chrome unexpectedly muted.');

    const directory = path.join(root, arm.name); fs.mkdirSync(directory);
    for (const name of ['product-tap.f32', 'virtual-input.f32', 'quantums.jsonl', 'events.jsonl']) fs.writeFileSync(path.join(directory, name), '');
    const context = await bounded(browser.newContext({ viewport: { width: 1360, height: 820 } })); await bounded(context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5420' }));
    page = await bounded(context.newPage()); await bounded(page.addInitScript('globalThis.__name=fn=>fn;'));
    page.on('pageerror', error => stage.errors.push(String(error)));
    function nodeTrace(trace:any){if(nodeCallbacks.length>=4096){stage.errors.push('Bounded Node trace exhausted');return;}nodeCallbacks.push(trace);}
    const capability=randomUUID(),containerFile=path.join(directory,'capture.container');
    fs.writeFileSync(containerFile,'');const fd=fs.openSync(containerFile,'a');
    let callbacksOpen=true,nodeInFlight=0;
    const collector:Collector={ledger:{pcm:0,events:0,blocks:0,eventRecords:0,bytes:0,frames:0},failure:null};
    function commit(frame:Buffer,trace:any){try{if(!callbacksOpen)throw Error('Node callback admission closed');const ack=commitFrame(fd,frame,trace,collector),ledger=collector.ledger;Object.assign(stage.stats,{pcmBatches:ledger.pcm,eventBatches:ledger.events,pcmBlocks:ledger.blocks,sourceSamples:ledger.blocks*128,inputSamples:ledger.blocks*128,events:ledger.eventRecords,containerFrames:ledger.frames,containerBytes:ledger.bytes});return ack;}catch(error){trace.error=String(error);stage.errors.push(trace.error);stage.collectorFirstFailure=collector.failure;connected?.close(1011,'Collector poisoned');throw error;}}
    await bounded(page.exposeFunction('retainDiagnosticPCM',(batch:any)=>{const trace:any={kind:'pcm',sequence:batch.sequence,arrivalObservedAtCallbackEntryMs:performance.now(),reconstructionStartMs:performance.now()};nodeInFlight++;try{if(!callbacksOpen)throw Error('Node callback admission closed');const source=Float32Array.from(batch.source),input=Float32Array.from(batch.input),frame=encode(1,{sequence:batch.sequence,blocks:batch.blocks,sourceChecksum32:batch.sourceChecksum32,inputChecksum32:batch.inputChecksum32},Buffer.from(source.buffer),Buffer.from(input.buffer));trace.reconstructionEndMs=performance.now();const ack=commit(frame,trace);trace.ackStartMs=performance.now();return ack;}finally{trace.exitMs=performance.now();nodeInFlight--;nodeTrace(trace);}}));
    await bounded(page.exposeFunction('retainDiagnosticEvents',(batch:any)=>{const trace:any={kind:'events',sequence:batch.sequence,arrivalObservedAtCallbackEntryMs:performance.now()};nodeInFlight++;try{if(!callbacksOpen)throw Error('Node callback admission closed');const ack=commit(encode(2,batch),trace);trace.ackStartMs=performance.now();return ack;}finally{trace.exitMs=performance.now();nodeInFlight--;nodeTrace(trace);}}));
    let connected:WebSocket|undefined;
    socketServer=new WebSocketServer({port:5424,host:'127.0.0.1',maxPayload:MAX_FRAME,perMessageDeflate:false});
    await bounded(new Promise<void>((resolve,reject)=>{socketServer!.once('listening',resolve);socketServer!.once('error',reject);}));
    socketServer.on('connection',(ws,request)=>{if(arm.transport!=='socket'||connected||request.headers.origin!=='http://127.0.0.1:5420'||request.url!=='/?capability='+capability){ws.close(1008,'Unexpected diagnostic capability/origin');return;}connected=ws;ws.on('error',error=>stage.errors.push('Socket error: '+String(error)));ws.on('message',(data,binary)=>{const trace:any={arrivalObservedAtCallbackEntryMs:performance.now(),wireBytes:Buffer.isBuffer(data)?data.length:data instanceof ArrayBuffer?data.byteLength:data.reduce((n:number,b:Buffer)=>n+b.length,0),binary};nodeInFlight++;try{trace.wireDecodeStartMs=performance.now();const bytes=Buffer.isBuffer(data)?data:data instanceof ArrayBuffer?Buffer.from(data):Buffer.concat(data);let frame:Buffer;if(binary)frame=bytes;else{if(bytes.length>MAX_FRAME)throw Error('Event frame cap');const batch=JSON.parse(bytes.toString());if(batch.kind!=='events')throw Error('Socket text kind');frame=encode(2,batch);}trace.wireDecodeEndMs=performance.now();const ack=commit(frame,trace);trace.kind=ack.kind===1?'pcm':'events';trace.sequence=ack.sequence;trace.ackStartMs=performance.now();const ackText=JSON.stringify(ack);if(ws.bufferedAmount+Buffer.byteLength(ackText)>8*1024*1024)throw Error('Node ACK send-buffer cap');ws.send(ackText);trace.ackEndMs=performance.now();}catch(error){if(!trace.error)stage.errors.push(String(error));trace.error=String(error);if(!collector.failure)collector.failure={error:String(error),nodeMonotonicMs:performance.now(),writtenBytes:trace.writtenBytes??0,expectedRecordBytes:trace.expectedRecordBytes??null};stage.collectorFirstFailure=collector.failure;ws.close(1011,'Retention failed');}finally{trace.exitMs=performance.now();nodeInFlight--;nodeTrace(trace);}});ws.on('close',()=>{stage.socketClosed=true;});});
    try {
      await bounded(page.goto('http://127.0.0.1:5420/BongoPlanet/')); await bounded(page.waitForFunction(() => !!(window as any).__bongo));
      await bounded(page.locator('#enable').click()); await bounded(page.waitForFunction(() => !!(window as any).__bongo.audio.node));
      const devices = await bounded(page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId }))));
      stage.devices = devices;
      const output = devices.find(d => d.kind === 'audiooutput' && d.label === 'SPAT 8ch loopback (Virtual)'), input = devices.find(d => d.kind === 'audioinput' && d.label === 'SPAT 8ch loopback (Virtual)');
      if (!output || (arm.observer && !input)) throw Error('Exact SPAT route absent; no default or microphone fallback.');
      stage.setup = await bounded(page.evaluate(async ({ arm, scene, code, inputId, outputId, socketURL,ackCode,finiteCode }) => {
        const b = (window as any).__bongo, ctx: AudioContext = b.audio.context; await (ctx as any).setSinkId(outputId); if (ctx.sampleRate !== 48000) throw Error('Unexpected sample rate.');
        b.load(scene);
        const d: any = { ctx, arm, trace: [], error: null, firstOverflow: null, firstEmission: null, firstEmissionSession: null, session: null, pcmPending: 0, eventPending: 0, maxPCM: 0, maxEvents: 0, eventSequence: 0, eventDispatches: 0, pcmDispatches: 0, observerBatches: 0, exposureObserverBatches: 0, exposureObserverBlocks: 0, exposureEventRecords: 0, eventRecords: 0, exposure: false, originalOnEvents: b.audio.onEvents, observer: null, stream: null, media: null, stopped: false };
        (window as any).__retentionDiagnostic = d;
        d.checkAck=new Function('return ('+ackCode+');')();d.finite=new Function('return ('+finiteCode+');')();d.socketPending=new Map();d.socketAckSequence={pcm:0,events:0};d.socketClosed=false;
        d.record = (record: any) => { if (d.trace.length < 12000) d.trace.push(record); else d.fail('Browser diagnostic trace cap reached', { kind: 'trace' }); };
        d.fail = (message: string, details: any) => { if (d.error) return; d.error = message; const record = { kind: 'first-error', message, ...details, browserMonotonicMs: performance.now(), contextTime: ctx.currentTime, pcmPending: d.pcmPending, eventPending: d.eventPending }; d.firstError = record; if (details.kind === 'pcm-overflow' || details.kind === 'event-overflow') d.firstOverflow = record; if (d.trace.length < 12000) d.trace.push(record); b.audio.pause(); };
        const checksum=(array:Float32Array)=>{let h=2166136261;for(const v of new Uint8Array(array.buffer,array.byteOffset,array.byteLength))h=Math.imul(h^v,16777619);return h>>>0;};
        if(new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]!==4)throw Error('Float32 host byte order must be little endian');
        if(arm.transport==='socket'){
          d.socket=new WebSocket(socketURL);d.socket.binaryType='arraybuffer';
          await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Socket activation deadline')),2500);d.socket.onopen=()=>{clearTimeout(timer);resolve();};d.socket.onerror=()=>{clearTimeout(timer);reject(Error('Socket activation error'));};});
          d.socket.onerror=()=>d.fail('Retention socket error',{kind:'socket'});
          d.socket.onclose=()=>{d.socketClosed=true;if(!d.stopped)d.fail('Unexpected retention socket closure',{kind:'socket-close'});};
          d.socket.onmessage=(e:MessageEvent)=>{try{const ack=JSON.parse(e.data),kind=ack.kind===1?'pcm':ack.kind===2?'events':null,key=kind+':'+ack.sequence,entry=d.socketPending.get(key);if(!kind||!entry)throw Error('Unknown ACK stream/sequence');d.checkAck(ack,kind,ack.sequence,entry.frameBytes,d.socketAckSequence[kind]);d.socketAckSequence[kind]++;d.socketPending.delete(key);entry.resolve(ack);}catch(error){d.fail(String(error),{kind:'socket-ack'});}};
        }
        d.send=(kind:string,payload:any)=>{if(arm.transport==='exposed'){const promise=kind==='pcm'?(window as any).retainDiagnosticPCM(payload):(window as any).retainDiagnosticEvents(payload.batch);return promise.then((ack:any)=>{d.checkAck(ack,kind,payload.sequence,payload.frameBytes,d.socketAckSequence[kind]);d.socketAckSequence[kind]++;return ack;});}if(d.socket.readyState!==WebSocket.OPEN||d.socket.bufferedAmount+(typeof payload.wire==='string'?new TextEncoder().encode(payload.wire).length:payload.wire.byteLength)>8*1024*1024)throw Error('Retention socket closed/send-buffer cap');const key=kind+':'+payload.sequence;return new Promise((resolve,reject)=>{d.socketPending.set(key,{resolve,reject,frameBytes:payload.frameBytes});try{d.socket.send(payload.wire);}catch(error){d.socketPending.delete(key);reject(error);}});};
        d.preparePCM=(data:any)=>{const sourceChecksum32=checksum(data.source),inputChecksum32=checksum(data.input),meta={sequence:data.sequence,blocks:data.blocks,sourceChecksum32,inputChecksum32};if(!d.finite(meta))throw Error('Original PCM metadata nonfinite');const metadata=new TextEncoder().encode(JSON.stringify(meta)),length=28+metadata.byteLength+data.source.byteLength+data.input.byteLength;if(length>262144)throw Error('Binary PCM frame cap');if(arm.transport==='exposed')return{...meta,source:Array.from(data.source),input:Array.from(data.input),frameBytes:length};const bytes=new Uint8Array(length),header=new DataView(bytes.buffer);[0x42475031,1,1,data.sequence,metadata.length,data.source.length,data.input.length].forEach((value,index)=>header.setUint32(index*4,value,true));bytes.set(metadata,28);bytes.set(new Uint8Array(data.source.buffer,data.source.byteOffset,data.source.byteLength),28+metadata.length);bytes.set(new Uint8Array(data.input.buffer,data.input.byteOffset,data.input.byteLength),28+metadata.length+data.source.byteLength);return{sequence:data.sequence,frameBytes:length,wire:bytes};};
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
          const payloadStartMs = performance.now(), batch = { kind:'events',sequence, receiveBrowserMonotonicMs, receiveContextTime, events }, text = (()=>{if(!d.finite(batch)){d.fail('Original event tree nonfinite',{kind:'event-prepare',sequence});throw Error('Original event tree nonfinite');}return JSON.stringify(batch);})(),payload = {sequence,wire:text,frameBytes:28+new TextEncoder().encode(text).length,batch}, payloadEndMs = performance.now(), dispatchStartMs = performance.now();
          const promise = (()=>{try{if(payload.frameBytes>262144)throw Error('Event frame cap');return d.send('events',payload);}catch(error){d.fail(String(error),{kind:'event-send',sequence});return Promise.reject(error);}})(), dispatchEndMs = performance.now();
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
          const observer = new AudioWorkletNode(ctx, 'transport-observer', { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [1], channelCountMode: 'max' }); d.observer = observer; d.media = ctx.createMediaStreamSource(stream);
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
            const payloadStartMs = performance.now(), payload = (()=>{try{return d.preparePCM(data);}catch(error){d.fail(String(error),{kind:'pcm-prepare',sequence:data.sequence});throw error;}})(), payloadEndMs = performance.now(), dispatchStartMs = performance.now();
            const promise = (()=>{try{return d.send('pcm',payload);}catch(error){d.fail(String(error),{kind:'pcm-send',sequence:data.sequence});return Promise.reject(error);}})(), dispatchEndMs = performance.now();
            d.pcmDispatches++;
            d.record({ kind: 'pcm-dispatch', sequence: data.sequence, firstIndex: data.blocks[0]?.index, payloadStartMs, payloadEndMs, dispatchStartMs, dispatchEndMs, pcmPending: d.pcmPending, eventPending: d.eventPending });
            void promise.then(() => d.record({ kind: 'pcm-settlement', sequence: data.sequence, settledBrowserMonotonicMs: performance.now(), success: true })).catch((error: unknown) => { d.record({ kind: 'pcm-settlement', sequence: data.sequence, settledBrowserMonotonicMs: performance.now(), success: false, error: String(error) }); d.fail(String(error), { kind: 'pcm-retention', sequence: data.sequence }); }).finally(() => d.pcmPending--);
          };
          b.audio.node.connect(observer, 0, 0); d.media.connect(observer, 0, 1); observer.connect(ctx.destination);
        }
        return { contextSampleRate: ctx.sampleRate, sinkId: (ctx as any).sinkId, inputOpened: !!d.stream, inputLabel: d.stream?.getAudioTracks()[0]?.label ?? null, inputSettings: d.stream?.getAudioTracks()[0]?.getSettings() ?? null, graph: arm.observer ? 'unchanged product destination plus parallel pre-device tap; exact SPAT input; silent observer output' : 'unchanged production graph; no input opened' };
      }, { arm, scene, code: observerCode, inputId: input?.deviceId ?? '', outputId: output.deviceId,socketURL:'ws://127.0.0.1:5424/?capability='+capability,ackCode:validAck.toString(),finiteCode:finiteJSON.toString() }));
      await bounded(page.waitForTimeout(500)); stage.playRequestNodeMonotonicMs = performance.now(); stage.playRequest = await bounded(page.evaluate(() => ({ browserMonotonicMs: performance.now(), contextTime: (window as any).__retentionDiagnostic.ctx.currentTime })));
      await bounded(page.locator('#play').click());
      const activationStartMs=performance.now();
      while(true){stage.activation=await bounded(page.evaluate(()=>{const b=(window as any).__bongo,d=(window as any).__retentionDiagnostic;return{firstEmission:d.firstEmission,session:d.firstEmissionSession,status:b.status,audioState:b.audio.state,error:d.error,contextState:d.ctx.state,firstError:d.firstError??null,pcmPending:d.pcmPending,eventPending:d.eventPending};}));stage.activationElapsedMs=performance.now()-activationStartMs;if(stage.errors.length||stage.activation.error||['error','interrupted'].includes(stage.activation.audioState)||stage.activation.contextState!=='running')throw Error('Actual activation error');if(stage.activationElapsedMs>=5000)throw Error('Five-second current-session activation deadline');if(stage.activation.firstEmission&&stage.activation.status?.running&&stage.activation.status.session===stage.activation.session)break;await bounded(page.waitForTimeout(20));}
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
      await bounded(page.waitForTimeout(150)); stage.exposureCompleted=true;stage.status = 'completed-diagnostic-observation';
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
          d.stopped = true;if(d.socket){d.socket.close();const end=performance.now()+500;while(!d.socketClosed&&performance.now()<end)await new Promise(r=>setTimeout(r,10));} clearInterval(d.heartbeat); cancelAnimationFrame(d.raf); d.longtaskObserver?.disconnect();
          return { trace: d.trace, firstError: d.firstError ?? null, firstOverflow: d.firstOverflow, firstEmission: d.firstEmission, exposureEnd: d.exposureEnd, error: d.error, pcmPending: d.pcmPending, eventPending: d.eventPending, maxPCM: d.maxPCM, maxEvents: d.maxEvents,socketPending:d.socketPending.size,socketClosed:d.socketClosed, observerBatches: d.observerBatches, pcmDispatches: d.pcmDispatches, eventDispatches: d.eventDispatches, eventRecords: d.eventRecords, contextState: d.ctx.state, tracksStopped: !d.stream || d.stream.getTracks().every((track: MediaStreamTrack) => track.readyState === 'ended') };
        }), 4000);
        if (stage.browserObservation) { fs.writeFileSync(path.join(directory, 'browser-trace.json'), JSON.stringify(stage.browserObservation.trace, null, 2) + '\n'); delete stage.browserObservation.trace; }
        if (stage.browserObservation?.error || stage.browserObservation?.pcmPending || stage.browserObservation?.eventPending || stage.browserObservation?.contextState !== 'closed' || !stage.browserObservation?.tracksStopped ||stage.browserObservation?.socketPending ||(arm.transport==='socket'&&!stage.browserObservation?.socketClosed)) { stage.status = 'failed-or-incomplete'; stage.errors.push('Incomplete/error retention cleanup'); }
        if ((arm.pcm && (!stage.stats.pcmBatches || stage.stats.pcmBatches !== stage.browserObservation?.pcmDispatches || fs.statSync(containerFile).size!==collector.ledger.bytes)) || (arm.events && (!stage.stats.eventBatches || stage.stats.eventBatches !== stage.browserObservation?.eventDispatches))) { stage.status = 'failed-or-incomplete'; stage.errors.push('Required retained arm denominators empty or unmatched'); }
      } catch (error) { stage.status = 'failed-or-incomplete'; stage.errors.push('Observation/cleanup: ' + String(error)); }
      try { await bounded(context.close(), 2000); stage.browserContextClosed = true; } catch (error) { stage.errors.push('Context closure: ' + String(error)); stage.status = 'failed-or-incomplete'; }
      armClosing=true;callbacksOpen=false;stage.nodeCallbackAdmissionClosed=true;stage.nodeInFlightAtClose=nodeInFlight;
      try{await bounded(browser?.close()??Promise.resolve(),2500);await bounded(browserServer?.close()??Promise.resolve(),1500);stage.browserClosed=true;}catch(error){stage.errors.push('Owned arm browser close: '+String(error));stage.browserClosed=false;stage.status='failed-or-incomplete';}
      const owned=browserServer?.process();if(owned&&owned.exitCode===null&&owned.signalCode===null){stage.forcedBrowserStop=true;owned.kill('SIGTERM');const end=performance.now()+1000;while(owned.exitCode===null&&owned.signalCode===null&&performance.now()<end)await new Promise(r=>setTimeout(r,25));if(owned.exitCode===null&&owned.signalCode===null){owned.kill('SIGKILL');await new Promise(r=>setTimeout(r,100));}}stage.browserProcessClosed=!!owned&&(owned.exitCode!==null||owned.signalCode!==null);if(!stage.browserProcessClosed||nodeInFlight)stage.errors.push('Owned arm process/callback cleanup not confirmed');
      if(socketServer){socketServer.clients.forEach(ws=>ws.terminate());await new Promise<void>(r=>socketServer!.close(()=>r()));socketServer=undefined;stage.socketServerClosed=true;}fs.closeSync(fd);stage.containerFdClosed=true;stage.derived=derive(containerFile,directory);if(!stage.derived.complete){stage.status='failed-or-incomplete';stage.errors.push('Container partial/invalid retained tail');}
      fs.writeFileSync(path.join(directory, 'node-trace.json'), JSON.stringify(nodeCallbacks, null, 2) + '\n'); stage.nodeCallbackRecords = nodeCallbacks.length; stage.finishedAt = new Date().toISOString(); save('report.json', report);
    }
    if (stage.errors.length) stage.status = 'failed-or-incomplete';
    console.log('RETENTION_ARM ' + JSON.stringify({ name: arm.name, status: stage.status, elapsedSeconds: stage.elapsedMonotonicSeconds, stats: stage.stats, error: stage.browserObservation?.error, maxPCM: stage.browserObservation?.maxPCM, maxEvents: stage.browserObservation?.maxEvents }));
    const allowedCensor=arm.transport==='exposed'&&stage.exposureCompleted&&stage.errors.length===1&&stage.errors[0]==='Incomplete/error retention cleanup'&&stage.browserObservation&&!stage.browserObservation.error&&(stage.browserObservation.pcmPending||stage.browserObservation.eventPending)&&stage.browserObservation.contextState==='closed'&&stage.browserObservation.tracksStopped&&stage.browserContextClosed&&stage.browserClosed&&stage.browserProcessClosed&&!stage.forcedBrowserStop&&stage.socketServerClosed&&stage.containerFdClosed&&stage.nodeCallbackAdmissionClosed&&!stage.nodeInFlightAtClose&&!collector.failure&&stage.derived.complete&&stage.stats.pcmBatches===stage.browserObservation.pcmDispatches&&stage.stats.eventBatches===stage.browserObservation.eventDispatches;
    stage.plannedSecondArmAllowedAfterCensoredDrain=!!allowedCensor;save('report.json',report);
    if(stage.status!=='completed-diagnostic-observation'&&!allowedCensor)throw Error('Arm failed with unconfirmed/non-drain cleanup; remaining arm not attempted.');
  }
  report.status=report.stages.every((stage:any)=>stage.status==='completed-diagnostic-observation')?'completed-diagnostic-observation':'failed-or-incomplete';
} catch (error) { report.status = 'failed-or-incomplete'; report.errors.push(String(error)); }
finally {
  if(socketServer){socketServer.clients.forEach(ws=>ws.terminate());await new Promise<void>(r=>socketServer!.close(()=>r()));socketServer=undefined;}
  clearInterval(nodeHeartbeat); fs.writeFileSync(path.join(root, 'node-heartbeat.json'), JSON.stringify(nodeHeartbeats, null, 2) + '\n');
  try { if (browser) await bounded(browser.close(), 2500); report.browserClosed = true; } catch (error) { report.errors.push('Browser cleanup: ' + String(error)); }
  try { if (browserServer) await bounded(browserServer.close(), 1500); report.browserProcessClosed = browserServer?.process().exitCode!==null||browserServer?.process().signalCode!==null; } catch (error) { report.errors.push('Browser process cleanup: ' + String(error)); browserServer?.process().kill('SIGTERM'); report.forcedOwnedBrowserStop = true; }
  if(browserServer&&browserServer.process().exitCode===null&&browserServer.process().signalCode===null){report.forcedOwnedBrowserStop=true;browserServer.process().kill('SIGTERM');const end=performance.now()+1000;while(browserServer.process().exitCode===null&&browserServer.process().signalCode===null&&performance.now()<end)await new Promise(r=>setTimeout(r,25));if(browserServer.process().exitCode===null&&browserServer.process().signalCode===null){browserServer.process().kill('SIGKILL');await new Promise(r=>setTimeout(r,100));}report.browserProcessClosed=browserServer.process().exitCode!==null||browserServer.process().signalCode!==null;if(!report.browserProcessClosed)report.errors.push('Owned browser process exit unobserved');}
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
