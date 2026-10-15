import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const directory = path.resolve(process.env.BONGO_AV_OUTPUT ?? 'evidence/step-08/av');
const captureSeconds=Number(process.env.BONGO_AV_SECONDS ?? 88),productDelaySeconds=Number(process.env.BONGO_AV_PRODUCT_DELAY ?? 0);
if(fs.existsSync(path.join(directory,'report.json')))throw Error('Existing capture will not be overwritten; choose BONGO_AV_OUTPUT.');
if(!Number.isFinite(captureSeconds)||captureSeconds<1||captureSeconds>120||!Number.isFinite(productDelaySeconds)||productDelaySeconds<0||productDelaySeconds>1)throw Error('Invalid bounded capture parameters.');
fs.mkdirSync(path.join(directory, 'frames'), { recursive: true });
const save = (name: string, value: unknown) => fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + '\n');
const harness = fs.readFileSync('scripts/av-evidence.ts'); fs.writeFileSync(path.join(directory, 'capture-harness.ts'), harness);
const fixture = JSON.parse(fs.readFileSync('public/fixtures/F02.json', 'utf8'));
const vertices = JSON.parse(fs.readFileSync('evidence/step-02/topology.json', 'utf8')).vertices;
save('fixture.json', fixture); save('vertices.json', vertices);
const report: any = { title: 'Bongo Planet actual F02 audiovisual pixel/loopback measurement', status: 'initializing', startedAt: new Date().toISOString(), url: 'http://127.0.0.1:5417/BongoPlanet/', commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), harnessSha256: createHash('sha256').update(harness).digest('hex'), automatedNumericSubsetPassed: false, humanAcceptancePassed: false, physicalMonitorQualified: false, errors: [], captureSeconds,productDelaySeconds };
const bundleHashes: Record<string,string> = {};
function hashFiles(folder: string) { for (const entry of fs.readdirSync(folder, { withFileTypes: true })) { const file = path.join(folder,entry.name); if (entry.isDirectory()) hashFiles(file); else bundleHashes[path.relative('dist',file)] = createHash('sha256').update(fs.readFileSync(file)).digest('hex'); } }
hashFiles('dist'); report.bundleHashes = bundleHashes;
async function attestServed():Promise<any>{const html=await(await fetch(report.url)).text();const mainPath=html.match(/<script[^>]*src="([^"]+)"/)?.[1];if(!mainPath||!mainPath.includes('index-BJ803lmz.js'))throw Error('Expected frozen production script not served.');const main=Buffer.from(await(await fetch(new URL(mainPath,report.url))).arrayBuffer()),mainSha=createHash('sha256').update(main).digest('hex');const processorPath=main.toString().match(/\/BongoPlanet\/assets\/processor-[A-Za-z0-9_-]+\.js/)?.[0];if(!processorPath)throw Error('Production processor URL not found.');const processor=Buffer.from(await(await fetch(new URL(processorPath,report.url))).arrayBuffer()),processorSha=createHash('sha256').update(processor).digest('hex');if(!mainSha.startsWith('e0985953')||!processorSha.startsWith('155ba49f'))throw Error('Served frozen asset hash mismatch.');return{htmlSha256:createHash('sha256').update(html).digest('hex'),mainPath,mainSha256:mainSha,processorPath,processorSha256:processorSha,at:new Date().toISOString()};}
report.servedBefore=await attestServed();
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, ignoreDefaultArgs: ['--mute-audio'], args: ['--enable-automation', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
report.browser = browser.version(); report.headless = true; report.viewport = { width: 1200, height: 820 };
const context = await browser.newContext({ viewport: report.viewport });
await context.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:5417' });
const page = await context.newPage(); await page.addInitScript('globalThis.__name = fn => fn;');
page.on('pageerror', error => report.errors.push(String(error)));
const cdp = await context.newCDPSession(page), browserCdp = await browser.newBrowserCDPSession();
report.actualBrowserArguments = (await browserCdp.send('Browser.getBrowserCommandLine')).arguments;
if (report.actualBrowserArguments.includes('--mute-audio')) throw Error('Output muted; refusing measurement.');
const rawFile = path.join(directory,'named-virtual-capture.f32'); fs.writeFileSync(rawFile, Buffer.alloc(0));
const chunks: { start: number; samples: number }[] = [], frames: any[] = [];
await page.exposeFunction('retainAvChunk', (start: number, samples: number[]) => { fs.appendFileSync(rawFile, Buffer.from(new Float32Array(samples).buffer)); chunks.push({start,samples:samples.length}); });
cdp.on('Page.screencastFrame', data => {
  void cdp.send('Page.screencastFrameAck', { sessionId: data.sessionId });
  const filename = `frames/${String(frames.length).padStart(5,'0')}.jpg`;
  fs.writeFileSync(path.join(directory,filename), Buffer.from(data.data,'base64'));
  frames.push({ filename, metadata: data.metadata, receivedEpochMs: Date.now() });
});
try {
  await page.goto(report.url); await page.waitForFunction(() => !!(window as any).__bongo);
  await page.evaluate(scene => (window as any).__bongo.load(scene),fixture);
  // Original F02 notes start on the rear hemisphere. Turn the camera through the ordinary empty-canvas gesture.
  const canvasBox=await page.locator('#sphere canvas').boundingBox();
  if(!canvasBox)throw Error('Sphere canvas unavailable.');
  await page.mouse.move(canvasBox.x+canvasBox.width*.8,canvasBox.y+25);await page.mouse.down();
  await page.mouse.move(canvasBox.x+canvasBox.width*.3,canvasBox.y+25,{steps:30});await page.mouse.up();await page.waitForTimeout(500);
  await page.locator('#enable').click(); await page.waitForFunction(() => !!(window as any).__bongo.audio.node);
  const devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).map(d => ({kind:d.kind,label:d.label,deviceId:d.deviceId})));
  report.devices=devices;
  const input = devices.find(d => d.kind==='audioinput' && d.label==='SPAT 8ch loopback (Virtual)'), output=devices.find(d => d.kind==='audiooutput' && d.label==='SPAT 8ch loopback (Virtual)');
  if (!input || !output) throw Error('Exact named SPAT input/output unavailable; no default microphone fallback.');
  report.selectedInput=input; report.selectedOutput=output;
  const setup = await page.evaluate(async ({inputId,outputId}) => {
    const b=(window as any).__bongo,ctx:AudioContext=b.audio.context;
    await (ctx as any).setSinkId(outputId); await b.audio.enable();
    const stream=await navigator.mediaDevices.getUserMedia({video:false,audio:{deviceId:{exact:inputId},echoCancellation:false,noiseSuppression:false,autoGainControl:false,sampleRate:{ideal:48000},channelCount:{ideal:1}}});
    const track=stream.getAudioTracks()[0]; if(track.getSettings().deviceId!==inputId || !track.label.includes('SPAT 8ch loopback'))throw Error('Input identity mismatch.');
    const code=`class Capture extends AudioWorkletProcessor{constructor(){super();this.data=new Float32Array(2048);this.length=0;this.start=0;}process(inputs,outputs){const input=inputs[0]?.[0];for(const out of outputs[0]||[])out.fill(0);if(input)for(let i=0;i<input.length;i++){if(!this.length)this.start=(currentFrame+i)/sampleRate;this.data[this.length++]=input[i];if(this.length===2048){this.port.postMessage({start:this.start,data:this.data},[this.data.buffer]);this.data=new Float32Array(2048);this.length=0;}}return true;}}registerProcessor('av-capture',Capture);`;
    const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));await ctx.audioWorklet.addModule(url);URL.revokeObjectURL(url);
    const recorder=new AudioWorkletNode(ctx,'av-capture',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
    const state:any={clock:[],statuses:[],pending:0,maxPending:0,error:null,ctx,stream,recorder};
    recorder.port.onmessage=({data})=>{state.pending++;state.maxPending=Math.max(state.maxPending,state.pending);if(state.pending>128){state.error='Capture backlog exceeds128 chunks';state.pending--;return;}void (window as any).retainAvChunk(data.start,Array.from(data.data)).catch((e:any)=>state.error=String(e)).finally(()=>state.pending--);};
    ctx.createMediaStreamSource(stream).connect(recorder);recorder.connect(ctx.destination);
    state.interval=setInterval(()=>{const t=ctx.getOutputTimestamp();state.clock.push({performanceNow:performance.now(),timeOrigin:performance.timeOrigin,currentTime:ctx.currentTime,outputContextTime:t.contextTime,outputPerformanceTime:t.performanceTime,baseLatency:ctx.baseLatency,outputLatency:ctx.outputLatency,dateNow:Date.now()});},100);
    const targets=b.scene.pieces.filter((p:any)=>p.kind==='note').map((p:any)=>({...p,...b.slots[p.vertex]})).filter((p:any)=>p.visible);
    if(!targets.length)throw Error('No original F02 target visible in current camera.');
    state.target=targets[0];(window as any).__av=state;
    return{inputSettings:track.getSettings(),inputLabel:track.label,sinkId:(ctx as any).sinkId,sampleRate:ctx.sampleRate,timeOrigin:performance.timeOrigin,target:state.target};
  },{inputId:input.deviceId,outputId:output.deviceId});
  Object.assign(report,setup);report.status='capturing';save('report.json',report);
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1200,maxHeight:820,everyNthFrame:1});
  const nativeClickTimes=await page.evaluate(()=>{const ctx:AudioContext=(window as any).__av.ctx,anchor=ctx.currentTime+.5,plan:number[]=[];for(let i=0;i<12;i++){const buffer=ctx.createBuffer(1,48,ctx.sampleRate);buffer.getChannelData(0).fill(.3);const source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);const time=anchor+i*.3;source.start(time);plan.push(time);}return plan;});
  report.nativeClickTimes=nativeClickTimes;await page.waitForTimeout(4200);
  if(productDelaySeconds>0)report.injectedDelay=await page.evaluate(seconds=>{const b=(window as any).__bongo,ctx:AudioContext=b.audio.context,node:AudioWorkletNode=b.audio.node,delay=ctx.createDelay(1);delay.delayTime.value=seconds;node.disconnect();node.connect(delay);delay.connect(ctx.destination);(window as any).__av.productDelay=delay;return{seconds:delay.delayTime.value,contextTime:ctx.currentTime,nativeSourcesUnchanged:true};},productDelaySeconds);
  await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__bongo.status?.running===true);
  console.log(`AV_CAPTURE_STARTED original F02, actual pixels + exact virtual PCM; ${captureSeconds} real seconds, productDelay=${productDelaySeconds}.`);
  const deadline=Date.now()+captureSeconds*1000;let progress=0;while(Date.now()<deadline){await page.waitForTimeout(Math.min(1000,deadline-Date.now()));if(progress++%10===0)console.log(`AV_PROGRESS ${Math.round((captureSeconds*1000-(deadline-Date.now()))/1000)}s frames=${frames.length} audioChunks=${chunks.length}`);}
  await page.locator('#play').click(); await page.waitForTimeout(200); await cdp.send('Page.stopScreencast');
  const observed=await page.evaluate(async()=>{const b=(window as any).__bongo,a=(window as any).__av;clearInterval(a.interval);a.stream.getTracks().forEach((t:MediaStreamTrack)=>t.stop());a.recorder.disconnect();a.recorder.port.onmessage=null;await a.ctx.close();while(a.pending)await new Promise(r=>setTimeout(r,10));return{clock:a.clock,maxCapturePending:a.maxPending,captureError:a.error,emissions:b.events.filter((e:any)=>e.type==='emission'),audioStatus:b.status,render:b.view.getDiagnostics()};});
  Object.assign(report,observed);save('frames.json',frames);save('capture-chunks.json',chunks);save('clock.json',observed.clock);
  if(observed.captureError)throw Error(observed.captureError);
  const raw=fs.readFileSync(rawFile),pcm=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),sr=report.sampleRate,base=chunks[0].start;
  const recordedSamples=chunks.reduce((sum,c)=>sum+c.samples,0),maxAbsSampleDeviation=Math.max(0,...chunks.slice(1).map((c,i)=>Math.abs(c.start-chunks[i].start-chunks[i].samples/sr)*sr));
  report.captureContinuity={chunks:chunks.length,samples:pcm.length,metadataSamples:recordedSamples,rawBytes:raw.length,maxAbsSampleDeviation,metadataMatchesPCM:recordedSamples===pcm.length,noHalfSampleDiscontinuity:maxAbsSampleDeviation<=.5};
  if(recordedSamples!==pcm.length||maxAbsSampleDeviation>.5)throw Error('Capture metadata/PCM count or sample continuity mismatch.');
  const wav=Buffer.alloc(44+raw.length);wav.write('RIFF');wav.writeUInt32LE(36+raw.length,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(3,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(32,34);wav.write('data',36);wav.writeUInt32LE(raw.length,40);raw.copy(wav,44);fs.writeFileSync(path.join(directory,'named-virtual-capture.wav'),wav);report.captureSha256=createHash('sha256').update(raw).digest('hex');
  const actualOnsets:number[]=[];let quiet=true,quietSamples=0;
  for(let i=0;i<pcm.length;i++){if(Math.abs(pcm[i])>.001){if(quiet)actualOnsets.push(base+i/sr);quiet=false;quietSamples=0;}else if(++quietSamples>sr*.05)quiet=true;}
  const anchor=observed.emissions[0].time,generator=fixture.pieces.find((p:any)=>p.kind==='generator'),target=fixture.pieces.find((p:any)=>p.id===report.target.id);
  const a=vertices[generator.vertex],b=vertices[target.vertex],theta=Math.acos(Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]))),rawDelay=fixture.settings.travel*generator.period*theta/Math.PI,grid=fixture.settings.quantization,delayBeats=Math.min(Math.floor(rawDelay/grid+.5+1e-10)*grid,(Math.ceil(generator.period/grid)-1)*grid),delay=delayBeats*60/fixture.settings.bpm,period=generator.period*60/fixture.settings.bpm;
  const calibration=nativeClickTimes.map(time=>{const measured=actualOnsets.find(t=>Math.abs(t-time)<.1);if(measured===undefined)throw Error('Independent native calibration click missing.');return{expected:time,measured,offsetMs:(measured-time)*1000};});
  const median=(values:number[])=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
  const fixedLoopbackOffsetMs=median(calibration.map(c=>c.offsetMs));
  const expected:number[]=[];for(let k=0;anchor+delay+k*period<anchor+captureSeconds;k++)expected.push(anchor+delay+k*period);
  const productOnsets=actualOnsets.filter(t=>t>=anchor+fixedLoopbackOffsetMs/1000 && t<anchor+captureSeconds+fixedLoopbackOffsetMs/1000);
  report.independentExpectedGroupCount=expected.length;report.detectedProductGroupCount=productOnsets.length;
  if(productOnsets.length!==expected.length)throw Error(`Independent group count mismatch: expected${expected.length}, detected${productOnsets.length}.`);
  report.calibration=calibration;report.fixedLoopbackOffsetMs=fixedLoopbackOffsetMs;report.actualOnsets=actualOnsets;report.expectedOnsets=expected;report.productOnsets=productOnsets;report.independentLatencyCalibration=true;
  const productAudioErrors=productOnsets.map((t,i)=>(t-expected[i])*1000-fixedLoopbackOffsetMs);report.productAudioErrorsMs=productAudioErrors;report.negativeControlDetected=productDelaySeconds>0&&productAudioErrors.length>0&&productAudioErrors.every(e=>Math.abs(e-productDelaySeconds*1000)<5);if(productAudioErrors.some(e=>Math.abs(e)>20))throw Error('Product output differs by more than20ms from independent fixture expectation after native calibration.');
  const usableClock=observed.clock.filter((c:any)=>c.outputPerformanceTime>0&&c.outputContextTime>=nativeClickTimes[0]);
  const presentationOffsets=usableClock.map((c:any)=>c.outputPerformanceTime-c.outputContextTime*1000),presentationOffsetMs=median(presentationOffsets);
  const clockDeviationMs=Math.max(...presentationOffsets.map((v:number)=>Math.abs(v-presentationOffsetMs)));
  report.calibration=calibration;report.fixedLoopbackOffsetMs=fixedLoopbackOffsetMs;report.presentationOffsetMs=presentationOffsetMs;report.clockMaxDeviationMs=clockDeviationMs;report.actualOnsets=actualOnsets;report.expectedOnsets=expected;
  report.productOnsets=productOnsets;report.independentLatencyCalibration=true;
  const times=productOnsets.map(t=>report.timeOrigin+presentationOffsetMs+(t-fixedLoopbackOffsetMs/1000)*1000);
  const candidates=frames.filter(f=>times.some(t=>Math.abs(f.metadata.timestamp*1000-t)<300));
  const scores:any[]=[];
  for(let start=0;start<candidates.length;start+=30){
    const batch=candidates.slice(start,start+30).map(f=>({...f,jpeg:fs.readFileSync(path.join(directory,f.filename)).toString('base64')}));
    scores.push(...await page.evaluate(async({batch,target})=>{const results:any[]=[];for(const frame of batch){const bytes=Uint8Array.from(atob(frame.jpeg),c=>c.charCodeAt(0));const image=await createImageBitmap(new Blob([bytes],{type:'image/jpeg'}));const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const scale=image.width/frame.metadata.deviceWidth,x=Math.round(target.x*scale),y=Math.round(target.y*scale),radius=12;const pixels=ctx.getImageData(x-radius,y-radius,radius*2+1,radius*2+1).data;let white=0,cyan=0,maxRed=0;for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(g>170&&b>160){maxRed=Math.max(maxRed,r);if(r>180)white++;if(g-r>35&&b-r>25)cyan++;}}results.push({filename:frame.filename,timestamp:frame.metadata.timestamp,whitePixels:white,cyanPixels:cyan,maxRed,width:image.width,height:image.height});image.close();}return results;},{batch,target:report.target}));
  }
  scores.sort((a,b)=>a.timestamp-b.timestamp);save('pixel-scores.json',scores);
  const measurements=times.map((audioEpochMs,index)=>{const window=scores.filter(s=>Math.abs(s.timestamp*1000-audioEpochMs)<300);const first=window.find(s=>s.whitePixels>=3);const previous=first?window.filter(s=>s.timestamp<first.timestamp).at(-1):null;const valid=!!first&&!!previous&&previous.whitePixels<3;return{group:index,audioContextMeasured:productOnsets[index],audioEpochMs,previousFrame:previous?.filename??null,firstBrightFrame:first?.filename??null,previousFrameEpochMs:previous?previous.timestamp*1000:null,firstBrightFrameEpochMs:first?first.timestamp*1000:null,errorMs:valid?first.timestamp*1000-audioEpochMs:null,worstEndpointAbsErrorMs:valid?Math.max(Math.abs(previous.timestamp*1000-audioEpochMs),Math.abs(first.timestamp*1000-audioEpochMs))+clockDeviationMs:null,frameIntervalMs:valid?(first.timestamp-previous.timestamp)*1000:null,precedingDarkFrameValid:valid,pixelCriterion:'at least3 pixels with R>180,G>170,B>160 inside25x25 target ROI'};});
  report.measurements=measurements;
  const errors=measurements.filter(m=>m.worstEndpointAbsErrorMs!==null).map(m=>m.worstEndpointAbsErrorMs!).sort((a,b)=>a-b),q=(p:number)=>errors[Math.min(errors.length-1,Math.ceil(errors.length*p)-1)]??null;
  report.identifiablePostCalibrationGroups=errors.length;report.medianAbsVisualErrorMs=q(.5);report.p95AbsVisualErrorMs=q(.95);report.maxAbsVisualErrorMs=errors.at(-1);report.unidentifiedGroups=measurements.length-errors.length;
  report.maxBracketedFrameIntervalMs=Math.max(...measurements.map(m=>m.frameIntervalMs??Infinity));report.automatedNumericSubsetPassed=errors.length>=30&&q(.5)!<=50&&q(.95)!<=100&&report.unidentifiedGroups===0&&clockDeviationMs<=10&&report.errors.length===0;
  report.errorStatistic='Worst absolute endpoint of preceding-dark/first-bright interval plus observed output-clock uncertainty.';report.servedAfter=await attestServed();report.servedBindingUnchanged=report.servedBefore.mainSha256===report.servedAfter.mainSha256&&report.servedBefore.processorSha256===report.servedAfter.processorSha256;report.automatedNumericSubsetPassed&&=report.servedBindingUnchanged;
  report.status='measured-automated-subset-human-gates-open';report.limitations=['Actual headless compositor pixels, not physical monitor presentation or a human listening session.','Output timestamp is an estimated device presentation mapping; maximum observed offset deviation retained.','One fixed measured loopback offset removed; no audio/visual time-varying fit.','Original F02 only; F03, reduced motion, low FPS, pole/far-side readability, and venue checks remain separate.','Visual onset bracketed between last nonwhite and first white captured frames; missing frames contribute uncertainty.'];
  save('measurements.json',measurements);
}catch(error){report.automatedNumericSubsetPassed=false;report.status='failed-or-blocked';report.failure=String(error);}
finally{try{report.servedAfter=await attestServed();report.servedBindingUnchanged=report.servedBefore.mainSha256===report.servedAfter.mainSha256&&report.servedBefore.processorSha256===report.servedAfter.processorSha256;}catch(error){report.servedAfterFailure=String(error);report.automatedNumericSubsetPassed=false;}report.negativeControlPassed=productDelaySeconds>0&&report.negativeControlDetected===true&&report.failure?.includes('Product output differs by more than20ms')&&report.servedBindingUnchanged===true&&report.errors.length===0;if(report.negativeControlPassed)report.status='negative-control-expected-rejection';save('frames.json',frames);save('capture-chunks.json',chunks);await browser.close();report.finishedAt=new Date().toISOString();report.browserClosed=true;save('report.json',report);console.log(`AV_FINISHED ${report.status} ${report.failure??''}`);}
