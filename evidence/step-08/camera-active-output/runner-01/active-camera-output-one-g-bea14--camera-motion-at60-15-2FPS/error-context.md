# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: active-camera-output.spec.ts >> one genuine8s local/native voice retains world trajectory through camera motion at60/15/2FPS
- Location: scripts/active-camera-output.spec.ts:108:1

# Error details

```
Error: Observation count/byte cap exceeded
```

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 4

- Array []
+ Array [
+   "Error: Observation count/byte cap exceeded",
+   "Preclose evidence Error: Observation count/byte cap exceeded",
+ ]
```

# Test source

```ts
  5   | import path from 'node:path';
  6   | import {createHash} from 'node:crypto';
  7   | import {createBridge} from '../src/output/bridge';
  8   | import type {Scene} from '../src/core/contracts';
  9   | import {ObservationBudget,PrefixHistory,NativeTailHistory,LocalFreshness,FixedHrMapping,OwnedBrowserLaunch,assertActiveLocal,assertActiveNative,soleTriggerChain,type LocalObservation,type Pair} from './active-camera-observer';
  10  | import {appendResourceClaim} from '../evidence/step-01/movement-backpressure-live/preparation/trace-contract02';
  11  | 
  12  | const APP='http://127.0.0.1:5417/BongoPlanet/';
  13  | const MAIN=new URL('assets/index-BXks7Y4v.js',APP).href;
  14  | const MAIN_SHA='32b57ff2dabeadc3d85f8143cd91c50abeea9785ebb1a2f35497ee1db198bb93';
  15  | const OUTPUT_SHA='70d3cb4326689f0348a86a5f1929ca0a3ff6b32d95be24a303944fac53763089';
  16  | const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  17  | const phi=(1+Math.sqrt(5))/2,s=1/Math.sqrt(9*phi*phi+1),c=3*phi*s;
  18  | type V=[number,number,number];
  19  | const XYZ:Record<string,V>={right:[c,0,s],left:[-c,0,s],forward:[-s,c,0],back:[s,-c,0],up:[0,s,c],down:[0,-s,-c]};
  20  | const VERTEX={right:85,left:29,forward:10,back:69,up:37,down:53};
  21  | const norm=(v:number[])=>Math.hypot(...v),distance=(a:number[],b:number[])=>norm(a.map((x,i)=>x-b[i]));
  22  | const dot=(a:number[],b:number[])=>a.reduce((sum,x,i)=>sum+x*b[i],0);
  23  | const theta=Math.acos(dot(XYZ.right,XYZ.forward));
  24  | const tangent=XYZ.forward.map((x,i)=>(x-dot(XYZ.right,XYZ.forward)*XYZ.right[i])/Math.sin(theta));
  25  | function arc(f:number):V{return XYZ.right.map((x,i)=>x*Math.cos(theta*f)+tangent[i]*Math.sin(theta*f)) as V;}
  26  | function progress(q:number[]){const f=Math.atan2(dot(q,tangent),dot(q,XYZ.right))/theta;expect(distance(q,arc(f))).toBeLessThanOrEqual(1e-6);expect(Math.abs(norm(q)-1)).toBeLessThanOrEqual(1e-6);return f;}
  27  | /** Independent bounded OSC string/padding/type/float decoding, not decodeOSC. */
  28  | function decode(hex:string){
  29  |  const bytes=Buffer.from(hex,'hex');expect(bytes.length).toBeLessThanOrEqual(128);let offset=0;
  30  |  const string=()=>{const end=bytes.indexOf(0,offset);expect(end).toBeGreaterThanOrEqual(offset);const value=bytes.toString('ascii',offset,end),next=(end+4)&~3;expect(next).toBeLessThanOrEqual(bytes.length);for(let i=end;i<next;i++)expect(bytes[i]).toBe(0);offset=next;return value;};
  31  |  const address=string(),types=string(),match=/^\/adm\/obj\/([1-9]\d*)\/xyz$/.exec(address);expect(match).toBeTruthy();expect(types).toBe(',fff');expect(bytes.length-offset).toBe(12);
  32  |  const position=[0,1,2].map(i=>bytes.readFloatBE(offset+i*4));expect(position.every(Number.isFinite)).toBe(true);return{objectId:Number(match![1]),position,address};
  33  | }
  34  | type Wire={index:number;before:number;after:number;camera:number[];packet:any};
  35  | const PROCESSOR=new URL('assets/processor-DjdrVTs8.js',APP).href;
  36  | const PROCESSOR_SHA='0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793';
  37  | const budget=new ObservationBudget(),wires=new PrefixHistory<Wire>(budget,'wire'),inputs=new PrefixHistory<any>(budget,'pointer'),events=new PrefixHistory<any>(budget,'local-event'),records=new PrefixHistory<any>(budget,'receiver'),raw=new PrefixHistory<any>(budget,'raw-OSC'),tail=new NativeTailHistory(budget),fresh=new LocalFreshness();
  38  | const localRows:Array<LocalObservation&{fresh:boolean}>=[],nativeReads:any[]=[];
  39  | let bridge:ReturnType<typeof createBridge>|undefined,out='',journal='',port=0,mapping:FixedHrMapping,chain:ReturnType<typeof soleTriggerChain>|undefined,guard=false;
  40  | let sampling:ReturnType<typeof setInterval>|undefined,sampleFailure='',inFlight:Promise<any>|undefined,playEventStart=0,playWireStart=0;
  41  | const report:any={title:'Bongo Planet sole active-source camera/output evidence',qualificationPassed:false,scope:'One local numerical synth/native control voice, finite output trajectories; loaded worklet body, physical sound/venue/human smoothness unqualified',cases:[],attempts:[],errors:[],checkpoints:[],cleanup:{audioClosedObserved:false,pageClosedObserved:false,contextClosedObserved:false,browserClosedObserved:false,browserProcessClosedObserved:false,nativeCloseObserved:false,httpClosedObserved:false},limits:{testSeconds:30,globalSeconds:45,wireRows:1024,pointerRows:128,checkpointRows:64,allObservationRows:4000,allObservationBytes:524288,bodyBytes:2097152}};
  42  | async function bounded<T>(promise:Promise<T>,ms:number):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Operation deadline '+ms+'ms')),ms);})]);}finally{clearTimeout(timer);}}
  43  | function error(reason:unknown){if(report.errors.length<32)report.errors.push(String(reason).slice(0,1024));else report.errorOverflow=true;}
  44  | function save(name:string,value:unknown){fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
  45  | function checkpoint(name:string,detail:any={}){expect(report.checkpoints.length).toBeLessThan(64);const row={name,parentHrNs:process.hrtime.bigint().toString(),...detail};budget.charge({kind:'checkpoint',row});report.checkpoints.push(row);}
  46  | function pair():Pair{const before=process.hrtime.bigint(),p=BigInt(Math.round(performance.now()*1e6)),after=process.hrtime.bigint();return{beforeHrNs:before.toString(),afterHrNs:after.toString(),performanceNs:p.toString(),offsetLowerNs:(before-p-1n).toString(),offsetUpperNs:(after-p+1n).toString()};}
  47  | function healthy(){const s=bridge!.state() as any;expect(s.clock.ready).toBe(true);expect(s.clock.failure??'').toBe('');expect(s.clock.clockEvidenceFailure).toBe('');expect(s.clock.uncertaintyMs).toBeLessThanOrEqual(10);expect(s.drops).toBe(0);return s;}
  48  | function check(){if(sampleFailure)throw Error(sampleFailure);expect(report.errors).toEqual([]);expect(report.errorOverflow??false).toBe(false);if(guard){expect(chain).toBeDefined();soleTriggerChain(events.rows.slice(playEventStart),wires.rows.slice(playWireStart).map(r=>r.packet),records.rows);const s=healthy();expect(s.session).toBe(chain!.outputSession);expect(s.pending).toBe(0);expect(s.activeVoices).toBe(1);expect(s.clock.workerIncarnation).toBe(chain!.nativeOnset.workerIncarnation);expect(process.hrtime.bigint()<chain!.nativeEndHrNs).toBe(true);}}
  49  | function drainNative(){
  50  |  const before=process.hrtime.bigint();mapping.check(pair());const s=healthy();records.ingest(bridge!.records);raw.ingest(bridge!.raw);expect(bridge!.records.length).toBeLessThan(4000);expect(bridge!.raw.length).toBeLessThan(4000);const after=process.hrtime.bigint();
  51  |  const added=tail.ingest(s.clock.recentRows,s.clock.workerIncarnation,{beforeHrNs:before.toString(),afterHrNs:after.toString()});
  52  |  const stateRead={parentBracket:{beforeHrNs:before.toString(),afterHrNs:after.toString()},session:s.session,pending:s.pending,activeVoices:s.activeVoices,drops:s.drops,clock:{ready:s.clock.ready,uncertaintyMs:s.clock.uncertaintyMs,workerIncarnation:s.clock.workerIncarnation,clockPairSequence:s.clock.clockPairSequence,clockPairAgeMs:s.clock.clockPairAgeMs,worker:{session:s.clock.worker?.session,pending:s.clock.worker?.pending,activeVoices:s.clock.worker?.activeVoices,onsetCount:s.clock.worker?.onsetCount,lateDrops:s.clock.worker?.lateDrops}}};
  53  |  budget.charge({kind:'native-read',stateRead});nativeReads.push(stateRead);
  54  |  if(guard)for(const observed of added)if(BigInt(observed.row.observedHrNs)>=BigInt(chain!.nativeOnset.actualHrNs))assertActiveNative(observed.row,chain!.outputSession,chain!.nativeEndHrNs);
  55  |  return s;
  56  | }
  57  | async function browserState(page:Page){return page.evaluate(()=>{const b=(window as any).__bongo,w=(window as any).__activeCameraWitness,before=performance.now()/1000;return{scene:b.scene,view:b.view.getDiagnostics(),output:b.output,local:{status:b.status,adapterState:b.audio.state,contextState:b.audio.context?.state??null,audioNow:b.audio.now,browserBefore:before,browserAfter:performance.now()/1000},events:b.events,wires:w.rows,inputs:w.inputs,wireError:w.error};});}
  58  | function observe(page:Page):Promise<any>{
  59  |  if(inFlight)return inFlight;
  60  |  const before=process.hrtime.bigint();
  61  |  inFlight=browserState(page).then(s=>{
  62  |   const after=process.hrtime.bigint(),local={...s.local,parentBracket:{beforeHrNs:before.toString(),afterHrNs:after.toString()}},newTime=fresh.observe(local),value={...local,fresh:newTime};
  63  |   budget.charge({kind:'local-observation',value});localRows.push(value);events.ingest(s.events);wires.ingest(s.wires);inputs.ingest(s.inputs);expect(s.wireError).toBe('');
  64  |   if(guard)assertActiveLocal(local,chain!.engineSession,chain!.localEnd);check();return s;
  65  |  }).catch(e=>{sampleFailure=String(e);throw e;}).finally(()=>{inFlight=undefined;});return inFlight;
  66  | }
  67  | async function capture(page:Page){drainNative();return observe(page);}
  68  | async function newLocal(page:Page,after:number){await expect.poll(async()=>{await capture(page);return localRows.some(r=>r.fresh&&r.status?.time>after);},{timeout:1000}).toBe(true);for(let i=localRows.length-1;i>=0;i--)if(localRows[i].fresh&&localRows[i].status?.time>after)return localRows[i];throw Error('Fresh local witness unavailable');}
  69  | function lastNativeState(){for(let i=tail.rows.length-1;i>=0;i--)if(tail.rows[i].row.type==='state'&&tail.rows[i].row.session===chain!.outputSession){assertActiveNative(tail.rows[i].row,chain!.outputSession,chain!.nativeEndHrNs);return tail.rows[i];}throw Error('No timestamped sole native state');}
  70  | function scene():Scene{return{version:1,topology:'icosa-3v-v1',settings:{bpm:120,key:9,scale:'major',travel:.75,quantization:.25,volume:.1},pieces:[{kind:'generator',id:'gen',vertex:0,period:8,phase:0,reach:180,enabled:true},{kind:'note',id:'long-note',vertex:3,degree:0,octave:4,timbre:'sine',duration:8,level:.1}]};}
  71  | function relocate(s:Scene,vertex:number){const next=structuredClone(s);next.pieces.find(p=>p.id==='long-note')!.vertex=vertex;return next;}
  72  | function verifyReceived(rows:Wire[],receiver:any[],udp:any[]){
  73  |  let ei=0,ui=0;expect(rows.length).toBeGreaterThan(0);
  74  |  for(const r of rows){const p=r.packet;while(ei<receiver.length&&!(receiver[ei].type==='position'&&receiver[ei].nodeId===p.nodeId&&receiver[ei].objectId===p.objectId&&distance(receiver[ei].position,p.position)<1e-12))ei++;expect(ei,'Missing ordered receiver position').toBeLessThan(receiver.length);ei++;let matched=false;while(ui<udp.length){const d=decode(udp[ui++].hex);if(d.objectId===p.objectId&&distance(d.position,p.position)<=1e-6){matched=true;break;}}expect(matched,'Missing ordered independent raw OSC').toBe(true);}
  75  | }
  76  | async function emptyGesture(page:Page,dx:number){
  77  |  const decision=await page.evaluate(dx=>{
  78  |   const canvas=document.querySelector('canvas')!,box=canvas.getBoundingClientRect(),b=(window as any).__bongo,camera=b.view.getDiagnostics().camera;
  79  |   // A positive vertical drag reduces phi. Choose the predeclared opposite
  80  |   // direction at the nearest pole, never mutate controls/private camera.
  81  |   const dy=camera[1]>=0?-120:120,top=box.y+240,bottom=box.y+box.height-240;
  82  |   const ys=dy<0?[top,bottom]:[bottom,top],xs=[box.x+128,box.x+box.width-348];
  83  |   const identity=(element:Element|null)=>({tag:element?.tagName??null,id:element?.id??null,isCanvas:element===canvas});
  84  |   const point=(x:number,y:number)=>({x,y,margin:Math.min(x-box.x,box.x+box.width-x,y-box.y,box.y+box.height-y),hit:identity(document.elementFromPoint(x,y)),slotClear:b.slots.filter((s:any)=>s.visible).every((s:any)=>Math.hypot(s.x-x,s.y-y)>40)});
  85  |   const candidates=ys.flatMap(y=>xs.map(x=>({start:point(x,y),end:point(x+dx,y+dy)}))),chosen=candidates.find(c=>[c.start,c.end].every(p=>p.margin>=120&&p.hit.isCanvas&&p.slotClear));
  86  |   return{camera,nearestPole:camera[1]>=0?'north':'south',dx,dy,box:{x:box.x,y:box.y,width:box.width,height:box.height},candidates,chosen};
  87  |  },dx);
  88  |  expect(decision.chosen,'No declared interior canvas-hit/slot-clear gesture').toBeTruthy();checkpoint('gesture hit/precondition',decision);return decision as typeof decision&{chosen:NonNullable<typeof decision.chosen>};
  89  | }
  90  | 
  91  | test.setTimeout(30000);
  92  | test.beforeAll(async()=>{
  93  |  out=process.env.BONGO_ACTIVE_CAMERA_EVIDENCE_DIR??'';if(!out)throw Error('Exclusive BONGO_ACTIVE_CAMERA_EVIDENCE_DIR required');fs.mkdirSync(out,{recursive:false});
  94  |  journal=process.env.BONGO_MOVEMENT_RESOURCE_JOURNAL??'';if(!journal||!fs.lstatSync(journal).isFile()||fs.statSync(journal).size!==0)throw Error('Existing empty exclusive resource journal required');if(path.resolve(journal).startsWith(path.resolve(out)+path.sep))throw Error('Resource journal must be outside attempt');report.resourceJournal=journal;
  95  |  report.outputSourceHash=sha(fs.readFileSync('src/output/OutputAdapter.ts'));expect(report.outputSourceHash).toBe(OUTPUT_SHA);
  96  |  mapping=new FixedHrMapping(pair(),budget);checkpoint('private native bridge startup');bridge=createBridge(0,0,{nativeClock:true});port=await bridge.start();
  97  |  await expect.poll(()=>{const s=healthy();return s.clock.worker?.clockDomain??'';},{timeout:3000}).toBe('native-monotonic');drainNative();save('initial-receiver.json',bridge.state());checkpoint('native ready',{port});
  98  | });
  99  | test.afterAll(async()=>{
  100 |  if(sampling)clearInterval(sampling);if(!out)return;
  101 |  if(bridge){try{save('receiver-before-close.json',bridge.state());records.ingest(bridge.records);raw.ingest(bridge.raw);}catch(e){error('Preclose evidence '+String(e));}try{await bridge.close();report.cleanup.nativeCloseObserved=true;report.cleanup.httpClosedObserved=!bridge.server.listening;report.receiverAfterClose=bridge.state();}catch(e){error('Native cleanup '+String(e));}}
  102 |  try{const bytes=fs.readFileSync(journal);expect(bytes.length).toBeLessThanOrEqual(8192);report.resourceJournalFinal=bytes.toString('utf8');const claims=report.resourceJournalFinal.split('\n').filter(Boolean).map((line:string)=>JSON.parse(line));expect(claims).toEqual([report.browserResourceClaim]);}catch(e){error('Final resource journal '+String(e));}
  103 |  report.wires=wires.rows;report.pointerInputs=inputs.rows;report.localEvents=events.rows;report.receiverRecords=records.rows;report.rawOSC=raw.rows;report.nativeRows=tail.rows;report.localObservations=localRows;report.nativeReads=nativeReads;report.observationBudget={count:budget.count,bytes:budget.bytes,failure:budget.failure};report.mapping={fixedOffsetNs:mapping?.offsetNs.toString(),observedUncertaintyNs:mapping?.uncertaintyNs.toString(),pairs:mapping?.pairs,scope:'Fixed same-Node stable-rate/1ns rounding premise; sparse independent brackets are not continuous observed clock proof.'};report.sampleFailure=sampleFailure;
  104 |  try{save('report.json',report);}catch(e){error('Final report write '+String(e));throw e;}
> 105 |  expect(report.errors).toEqual([]);expect(report.errorOverflow??false).toBe(false);for(const key of ['audioClosedObserved','pageClosedObserved','contextClosedObserved','browserClosedObserved','browserProcessClosedObserved','nativeCloseObserved','httpClosedObserved'])expect(report.cleanup[key],key).toBe(true);expect(report.cleanup.forcedBrowser??false).toBe(false);
      |                        ^ Error: expect(received).toEqual(expected) // deep equality
  106 | });
  107 | 
  108 | test('one genuine8s local/native voice retains world trajectory through camera motion at60/15/2FPS',async()=>{
  109 |  let ready=false;
  110 |  let browser:Browser|undefined,context:BrowserContext|undefined,ownedPage:Page|undefined;
  111 |  const ownership=new OwnedBrowserLaunch<BrowserServer>(s=>{const pid=s.process().pid;if(!pid)throw Error('Browser server PID missing');report.browserResourceClaim=appendResourceClaim(journal,pid,process.pid,'browser-server');checkpoint('owned browser PID durable',{claim:report.browserResourceClaim});},async s=>{try{await bounded(s.close(),2000);report.cleanup.browserProcessExit={code:s.process().exitCode,signal:s.process().signalCode};report.cleanup.browserProcessClosedObserved=s.process().exitCode!==null||s.process().signalCode!==null;if(!report.cleanup.browserProcessClosedObserved)throw Error('Browser close lacks process exit');}catch(e){report.cleanup.forcedBrowser=true;s.process().kill('SIGTERM');throw e;}},error);
  112 |  try{
  113 |   const launch=chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader'],timeout:5000}).then(s=>ownership.adopt(s)).catch(e=>{error('Owned browser launch '+String(e));throw e;});launch.catch(()=>{});let server:BrowserServer;try{server=await bounded(launch,6000);}catch(e){ownership.abandon();throw e;}
  114 |   const connection=chromium.connect(server.wsEndpoint(),{timeout:2000}).then(async b=>{browser=b;if(ownership.abandoned){await bounded(b.close(),2000);throw Error('Late browser connection');}return b;}).catch(e=>{error('Browser connection acquisition '+String(e));throw e;});connection.catch(()=>{});browser=await bounded(connection,2500);
  115 |   const creation=browser.newContext({viewport:{width:1440,height:1000}}).then(async c=>{context=c;if(ownership.abandoned){await bounded(c.close(),2000);throw Error('Late browser context');}return c;}).catch(e=>{error('Browser context acquisition '+String(e));throw e;});creation.catch(()=>{});context=await bounded(creation,2500);
  116 |   const paging=context.newPage().then(async p=>{ownedPage=p;if(ownership.abandoned){await bounded(p.close(),2000);throw Error('Late browser page');}return p;}).catch(e=>{error('Browser page acquisition '+String(e));throw e;});paging.catch(()=>{});const page=await bounded(paging,2500);page.setDefaultTimeout(2000);page.setDefaultNavigationTimeout(4000);
  117 |   page.on('pageerror',e=>error('Page '+e.message));
  118 |   let originalBody:Promise<void>|undefined;
  119 |   page.on('response',response=>{if(response.url()!==MAIN||response.request().resourceType()!=='script')return;report.originalMainResponses=(report.originalMainResponses??0)+1;if(report.originalMainResponses!==1){error('Duplicate original main response');return;}originalBody=response.body().then(b=>{if(b.length>2097152)throw Error('Main body cap');fs.writeFileSync(path.join(out,'original-page-main.js'),b,{flag:'wx'});report.originalMainHash=sha(b);report.originalMainBytes=b.length;}).catch(e=>error('Original body '+String(e)));});
  120 |   sampling=setInterval(()=>{try{drainNative();if(ready)void observe(page).catch(e=>{sampleFailure=String(e);});}catch(e){sampleFailure=String(e);if(sampling)clearInterval(sampling);}},25);
  121 |   async function body(url:string,name:string,expected:string){const b=await(await page.request.get(url)).body();expect(b.length).toBeLessThanOrEqual(2097152);fs.writeFileSync(path.join(out,name),b,{flag:'wx'});expect(sha(b)).toBe(expected);return b;}
  122 |   const mainBefore=await body(MAIN,'served-main-before.js',MAIN_SHA),paths=[...new Set([...mainBefore.toString('utf8').matchAll(/\/BongoPlanet\/assets\/processor-[^"\s]+?\.js/g)].map(m=>m[0]))];expect(paths).toHaveLength(1);expect(new URL(paths[0],APP).href).toBe(PROCESSOR);await body(PROCESSOR,'served-processor-before.js',PROCESSOR_SHA);
  123 |   report.processorBinding={url:PROCESSOR,sha256:PROCESSOR_SHA,scope:'Fixed addModule URL in immutable observed main plus separately fetched processor before/after; genuine loaded AudioWorklet body UNOBSERVED.'};
  124 |   await page.addInitScript(({target})=>{
  125 |    (window as any).__name=(f:unknown)=>f;const Base=window.WebSocket,w:{rows:any[];inputs:any[];bytes:number;error:string}={rows:[],inputs:[],bytes:0,error:''};(window as any).__activeCameraWitness=w;
  126 |    const append=(list:any[],row:any,cap:number)=>{const bytes=new TextEncoder().encode(JSON.stringify(row)).byteLength;if(list.length>=cap||w.bytes+bytes>524288){w.error='Browser witness count/byte cap';return;}w.bytes+=bytes;list.push(row);};
  127 |    for(const kind of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture'])window.addEventListener(kind,e=>{const p=e as PointerEvent;if(!p.isTrusted)return;const canvas=document.querySelector('canvas'),hit=document.elementFromPoint(p.clientX,p.clientY),t=e.target as Element|null;append(w.inputs,{kind:p.type,time:performance.now()/1000,trusted:p.isTrusted,pointerId:p.pointerId,buttons:p.buttons,x:p.clientX,y:p.clientY,targetIsCanvas:t===canvas,targetTag:t?.tagName??null,targetId:t?.id??null,hitIsCanvas:hit===canvas,hitTag:hit?.tagName??null,hitId:hit?.id??null,canvasHasCapture:canvas?.hasPointerCapture(p.pointerId)??false,cameraBeforeControls:(window as any).__bongo?.view.getDiagnostics().camera},128);},{capture:true});
  128 |    class Observed extends Base{constructor(url:string|URL,protocols?:string|string[]){super(String(url)==='ws://127.0.0.1:5418'?target:url,protocols);}override send(data:string|Blob|BufferSource){const before=performance.now()/1000;super.send(data);const after=performance.now()/1000;try{if(typeof data!=='string')throw Error('Nonstring producer wire');append(w.rows,{index:w.rows.length,before,after,camera:(window as any).__bongo?.view.getDiagnostics().camera,packet:JSON.parse(data)},1024);}catch(e){w.error=String(e);}}}window.WebSocket=Observed;
  129 |   },{target:`ws://127.0.0.1:${port}`});
  130 |   await page.goto(APP);await page.waitForFunction(()=>(window as any).__bongo);ready=true;await expect.poll(()=>report.originalMainResponses??0).toBe(1);expect(originalBody).toBeDefined();await originalBody;expect(report.originalMainHash).toBe(MAIN_SHA);
  131 |   const initial=scene();await page.evaluate(s=>(window as any).__bongo.load(s),initial);await page.locator('details.diagnostics summary').click();await page.locator('#bridge').click();await expect.poll(async()=>{const b=await capture(page);return b.output.connected&&b.output.clockSynchronization.length===8;}).toBe(true);
  132 |   const beforePlay=await capture(page);expect(beforePlay.scene).toEqual(initial);expect(beforePlay.local.adapterState).toBe('locked');expect(tail.rows.length).toBeGreaterThan(0);playEventStart=events.rows.length;playWireStart=wires.rows.length;report.preludeStart={localEventIndex:playEventStart,wireIndex:playWireStart,nativeIndex:tail.rows.length,parentHrNs:process.hrtime.bigint().toString()};checkpoint('deliberate Play');await page.locator('#play').click();
  133 |   await expect.poll(async()=>{
  134 |    const b=await capture(page);const counts=[events.rows.slice(playEventStart).filter(e=>e.type==='trigger').length,events.rows.slice(playEventStart).filter(e=>e.type==='onset').length,wires.rows.slice(playWireStart).filter(w=>w.packet.type==='trigger').length,records.rows.filter(r=>r.type==='onset').length];expect(counts.every(n=>n<=1)).toBe(true);check();return counts.every(n=>n===1)&&b.local.status?.activeVoices===1&&healthy().clock.worker?.activeVoices===1;
  135 |   },{timeout:5000}).toBe(true);
  136 |   chain=soleTriggerChain(events.rows.slice(playEventStart),wires.rows.slice(playWireStart).map(w=>w.packet),records.rows);expect(chain.nativeOnset.workerIncarnation).toBe(healthy().clock.workerIncarnation);expect(chain.nativeOnset.position).toHaveLength(3);const icoNorm=Math.hypot(1,phi);expect(distance(chain.nativeOnset.position,[0,1/icoNorm,phi/icoNorm])).toBeLessThanOrEqual(1e-6);const emission=events.rows.slice(playEventStart).find(e=>e.type==='emission');expect(Math.abs(chain.trigger.onset-emission.time-1)).toBeLessThanOrEqual(1e-8);
  137 |   report.chain={...chain,nativeEndHrNs:chain.nativeEndHrNs.toString()};guard=true;
  138 |   for(const n of tail.rows)if(BigInt(n.row.observedHrNs)>=BigInt(chain.nativeOnset.actualHrNs))assertActiveNative(n.row,chain.outputSession,chain.nativeEndHrNs);
  139 |   for(const l of localRows)if(l.status?.session===chain.engineSession&&l.status.time>=chain.localOnset.onset)assertActiveLocal(l,chain.engineSession,chain.localEnd);
  140 |   const disabled=structuredClone(initial);disabled.pieces[0]= {...disabled.pieces[0],enabled:false} as Scene['pieces'][number];checkpoint('generator disable normal edit');await page.evaluate(s=>(window as any).__bongo.edit(s),disabled);await page.waitForTimeout(150);let b=await capture(page);expect(b.scene).toEqual(disabled);check();
  141 |   const setup=relocate(disabled,85);checkpoint('unmeasured setup3 to85');await page.evaluate(s=>(window as any).__bongo.edit(s),setup);await page.waitForTimeout(150);b=await capture(page);expect(b.scene).toEqual(setup);expect(distance(healthy().objects[0].position,XYZ.right)).toBeLessThanOrEqual(1e-6);
  142 |   const remaining=Number(chain.nativeEndHrNs-process.hrtime.bigint())/1e9;report.nativeLifetimeAdmission={remainingSeconds:remaining,nativeEndHrNs:chain.nativeEndHrNs.toString(),observedParentHrNs:process.hrtime.bigint().toString()};expect(remaining).toBeGreaterThan(3);
  143 |   for(const fps of [60,15,2]){
  144 |    checkpoint('active movement preparation',{fps});await page.evaluate(s=>(window as any).__bongo.edit(s),setup);await page.locator('#fps').selectOption(String(fps));await page.waitForTimeout(150);const before=await newLocal(page,fresh.lastTime??0),pre=await capture(page);expect(pre.scene).toEqual(setup);check();
  145 |    const nativeBefore=lastNativeState(),old=healthy().objects[0],chosen=pre.output.clockSynchronization.reduce((best:any,x:any)=>x.uncertaintyMs<best.uncertaintyMs?x:best,{uncertaintyMs:Infinity});expect(chosen.uncertaintyMs).toBeLessThanOrEqual(10);expect(distance(old.position,XYZ.right)).toBeLessThanOrEqual(1e-6);expect(old.objectId).toBe(chain.wire.objectId);expect(old.nodeId).toBe('long-note');
  146 |    const next=relocate(setup,10),decision=await emptyGesture(page,0),attempt:any={fps,sceneBefore:setup,sceneAfter:next,decision,localBefore:before,nativeBefore,wireStart:wires.rows.length,eventStart:records.rows.length,rawStart:raw.rows.length,pointerStart:inputs.rows.length,localStart:localRows.length,nativeStart:tail.rows.length,chosenSynchronization:chosen};report.attempts.push(attempt);
  147 |    await page.mouse.move(decision.chosen.start.x,decision.chosen.start.y);await page.mouse.down();const parentEditBefore=process.hrtime.bigint();const bracket=await page.evaluate(s=>{const b=(window as any).__bongo,before=performance.now()/1000,camera=b.view.getDiagnostics().camera;b.edit(s);return{before,after:performance.now()/1000,camera};},next);attempt.parentEditBracket={beforeHrNs:parentEditBefore.toString(),afterHrNs:process.hrtime.bigint().toString()};attempt.editBracket=bracket;expect(BigInt(nativeBefore.row.observedHrNs)<parentEditBefore).toBe(true);expect(bracket.after-bracket.before).toBeLessThanOrEqual(.005);
  148 |    await page.waitForTimeout(45);await page.mouse.move(decision.chosen.end.x,decision.chosen.end.y,{steps:2});await page.mouse.up();await page.waitForTimeout(220);const post=await capture(page);attempt.post={scene:post.scene,camera:post.view.camera,local:post.local,outputSession:post.output.session};const after=await newLocal(page,fresh.lastTime??0);attempt.localAfter=after;const nativeAfter=lastNativeState();attempt.nativeAfter=nativeAfter;check();
  149 |    expect(post.scene).toEqual(next);expect(distance(post.view.camera,bracket.camera)).toBeGreaterThan(.05);const ps=inputs.rows.slice(attempt.pointerStart),gesture=ps.find(p=>p.kind==='pointermove'&&p.buttons===1&&p.time>=bracket.after);attempt.pointerInputs=ps;expect(gesture).toBeTruthy();expect(gesture.trusted&&gesture.targetIsCanvas&&gesture.canvasHasCapture).toBe(true);expect(ps.some(p=>p.kind==='gotpointercapture'&&p.pointerId===gesture.pointerId&&p.targetIsCanvas&&p.canvasHasCapture)).toBe(true);
  150 |    const movement=wires.rows.slice(attempt.wireStart).filter(w=>w.packet.type==='position'),samples=movement.map(w=>{const p=w.packet;expect(p.nodeId).toBe('long-note');expect(p.objectId).toBe(chain!.wire.objectId);const f=progress(p.position),t=p.sent-chosen.offset,lo=Math.max(0,Math.min(1,(t-bracket.after-.001)/.12)),hi=Math.max(0,Math.min(1,(t-bracket.before+.001)/.12));expect(f).toBeGreaterThanOrEqual(lo-1e-6);expect(f).toBeLessThanOrEqual(hi+1e-6);return{...w,progress:f,allowedFraction:{lo,hi},cameraDistance:distance(w.camera,gesture.cameraBeforeControls)};});attempt.samples=samples;expect(samples.length).toBeGreaterThanOrEqual(3);expect(samples.every((s,i)=>i===0||s.progress>=samples[i-1].progress-1e-8)).toBe(true);expect(samples.filter(s=>s.progress>0&&s.progress<.99&&s.before<gesture.time).length).toBeGreaterThanOrEqual(1);expect(samples.filter(s=>s.progress>0&&s.progress<.99&&s.before>=gesture.time&&s.cameraDistance>.05).length).toBeGreaterThanOrEqual(1);
  151 |    const received=records.rows.slice(attempt.eventStart).filter(r=>r.type==='position'),udp=raw.rows.slice(attempt.rawStart);verifyReceived(movement,received,udp);const firstReceipt=mapping.interval(received[0].time),lastReceipt=mapping.interval(received.at(-1).time);attempt.receiptInterval={firstLowerHrNs:firstReceipt.lower.toString(),firstUpperHrNs:firstReceipt.upper.toString(),lastLowerHrNs:lastReceipt.lower.toString(),lastUpperHrNs:lastReceipt.upper.toString(),fixedOffsetNs:mapping.offsetNs.toString(),observedUncertaintyNs:mapping.uncertaintyNs.toString(),scope:'Conditional fixed same-Node monotonic relation; actual parent position receipt times, not audio times.'};
  152 |    const nativeDuring=tail.rows.slice(attempt.nativeStart).find(n=>n.row.type==='state'&&BigInt(n.row.observedHrNs)>firstReceipt.upper&&BigInt(n.row.observedHrNs)<lastReceipt.lower);expect(nativeDuring,'No fresh native state during movement receipts').toBeTruthy();assertActiveNative(nativeDuring!.row,chain.outputSession,chain.nativeEndHrNs);expect(BigInt(nativeDuring!.row.observedHrNs)>BigInt(nativeBefore.row.observedHrNs)).toBe(true);expect(BigInt(nativeAfter.row.observedHrNs)>lastReceipt.upper).toBe(true);expect(BigInt(nativeAfter.row.observedHrNs)>BigInt(nativeDuring!.row.observedHrNs)).toBe(true);const localDuring=localRows.slice(attempt.localStart).find(l=>l.fresh&&l.status.time>before.status.time&&l.status.time<after.status.time&&BigInt(l.parentBracket.beforeHrNs)>firstReceipt.upper&&BigInt(l.parentBracket.afterHrNs)<lastReceipt.lower);expect(localDuring,'No distinct fresh local observation during receipt interval').toBeTruthy();attempt.localDuring=localDuring;attempt.nativeDuring=nativeDuring;expect(healthy().objects[0].objectId).toBe(chain.wire.objectId);expect(distance(healthy().objects[0].position,XYZ.forward)).toBeLessThanOrEqual(1e-6);report.cases.push({...attempt,passed:true});
  153 |   }
  154 |   checkpoint('100ms normal running observation drain');await page.waitForTimeout(100);await newLocal(page,fresh.lastTime??0);await capture(page);check();verifyReceived(wires.rows.filter(w=>w.packet.type==='position'),records.rows,raw.rows);await body(MAIN,'served-main-after.js',MAIN_SHA);await body(PROCESSOR,'served-processor-after.js',PROCESSOR_SHA);await capture(page);check();report.guardEnd={parentHrNs:process.hrtime.bigint().toString(),localTime:fresh.lastTime,nativeEndHrNs:chain.nativeEndHrNs.toString(),localEventIndex:events.rows.length,wireIndex:wires.rows.length,nativeIndex:tail.rows.length};report.scopedChecksPassed=true;
  155 |  }catch(e){error(e);throw e;}
  156 |  finally{
  157 |   ownership.abandon();
  158 |   guard=false;if(sampling)clearInterval(sampling);if(inFlight)try{await bounded(inFlight,2000);}catch(e){error('Observation drain '+String(e));}
  159 |   const page=ownedPage;
  160 |   if(page&&!page.isClosed()){
  161 |    try{await bounded(page.evaluate(()=>{const b=(window as any).__bongo;if(b?.audio)b.audio.pause();}),2000);await page.waitForTimeout(80);report.cleanup.audioAfterPause=await bounded(page.evaluate(()=>{const b=(window as any).__bongo;return b?{status:b.status,adapterState:b.audio.state,contextState:b.audio.context?.state}:null;}),2000);}catch(e){error('Audio pause cleanup '+String(e));}
  162 |    try{report.cleanup.audioClosedObserved=await bounded(page.evaluate(async()=>{const b=(window as any).__bongo;if(!b?.audio)return false;await b.audio.dispose();return b.audio.context?.state==='closed';}),2000);}catch(e){error('Audio context cleanup '+String(e));}
  163 |    try{if((await bounded(browserState(page),2000)).output.connected)await page.locator('#bridge').click();}catch(e){error('Producer cleanup '+String(e));}
  164 |   }
  165 |   if(page)try{await bounded(page.close(),2000);report.cleanup.pageClosedObserved=page.isClosed();}catch(e){error('Page cleanup '+String(e));}
  166 |   if(context)try{await bounded(context.close(),2000);report.cleanup.contextClosedObserved=true;}catch(e){error('Context cleanup '+String(e));}
  167 |   if(browser)try{await bounded(browser.close(),2000);report.cleanup.browserClosedObserved=!browser.isConnected();}catch(e){error('Browser connection cleanup '+String(e));}
  168 |   try{await ownership.close();}catch(e){error('Browser server cleanup '+String(e));}
  169 |  }
  170 | });
  171 | 
```