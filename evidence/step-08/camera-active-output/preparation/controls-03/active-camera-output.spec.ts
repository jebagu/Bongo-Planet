/** Bongo Planet source-prepared sole-active-source camera/output check. Separate root GO is
 * required for actual execution. No renderer/adapter/geometry replacement. */
import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createBridge} from '../src/output/bridge';
import type {Scene} from '../src/core/contracts';
import {ObservationBudget,PrefixHistory,NativeTailHistory,LocalFreshness,FixedHrMapping,assertActiveLocal,assertActiveNative,soleTriggerChain,type LocalObservation,type Pair} from './active-camera-observer';

const APP='http://127.0.0.1:5417/BongoPlanet/';
const MAIN=new URL('assets/index-BXks7Y4v.js',APP).href;
const MAIN_SHA='32b57ff2dabeadc3d85f8143cd91c50abeea9785ebb1a2f35497ee1db198bb93';
const OUTPUT_SHA='70d3cb4326689f0348a86a5f1929ca0a3ff6b32d95be24a303944fac53763089';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const phi=(1+Math.sqrt(5))/2,s=1/Math.sqrt(9*phi*phi+1),c=3*phi*s;
type V=[number,number,number];
const XYZ:Record<string,V>={right:[c,0,s],left:[-c,0,s],forward:[-s,c,0],back:[s,-c,0],up:[0,s,c],down:[0,-s,-c]};
const VERTEX={right:85,left:29,forward:10,back:69,up:37,down:53};
const norm=(v:number[])=>Math.hypot(...v),distance=(a:number[],b:number[])=>norm(a.map((x,i)=>x-b[i]));
const dot=(a:number[],b:number[])=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const theta=Math.acos(dot(XYZ.right,XYZ.forward));
const tangent=XYZ.forward.map((x,i)=>(x-dot(XYZ.right,XYZ.forward)*XYZ.right[i])/Math.sin(theta));
function arc(f:number):V{return XYZ.right.map((x,i)=>x*Math.cos(theta*f)+tangent[i]*Math.sin(theta*f)) as V;}
function progress(q:number[]){const f=Math.atan2(dot(q,tangent),dot(q,XYZ.right))/theta;expect(distance(q,arc(f))).toBeLessThanOrEqual(1e-6);expect(Math.abs(norm(q)-1)).toBeLessThanOrEqual(1e-6);return f;}
/** Independent bounded OSC string/padding/type/float decoding, not decodeOSC. */
function decode(hex:string){
 const bytes=Buffer.from(hex,'hex');expect(bytes.length).toBeLessThanOrEqual(128);let offset=0;
 const string=()=>{const end=bytes.indexOf(0,offset);expect(end).toBeGreaterThanOrEqual(offset);const value=bytes.toString('ascii',offset,end),next=(end+4)&~3;expect(next).toBeLessThanOrEqual(bytes.length);for(let i=end;i<next;i++)expect(bytes[i]).toBe(0);offset=next;return value;};
 const address=string(),types=string(),match=/^\/adm\/obj\/([1-9]\d*)\/xyz$/.exec(address);expect(match).toBeTruthy();expect(types).toBe(',fff');expect(bytes.length-offset).toBe(12);
 const position=[0,1,2].map(i=>bytes.readFloatBE(offset+i*4));expect(position.every(Number.isFinite)).toBe(true);return{objectId:Number(match![1]),position,address};
}
type Wire={index:number;before:number;after:number;camera:number[];packet:any};
const PROCESSOR=new URL('assets/processor-DjdrVTs8.js',APP).href;
const PROCESSOR_SHA='0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793';
const budget=new ObservationBudget(),wires=new PrefixHistory<Wire>(budget,'wire'),inputs=new PrefixHistory<any>(budget,'pointer'),events=new PrefixHistory<any>(budget,'local-event'),records=new PrefixHistory<any>(budget,'receiver'),raw=new PrefixHistory<any>(budget,'raw-OSC'),tail=new NativeTailHistory(budget),fresh=new LocalFreshness();
const localRows:Array<LocalObservation&{fresh:boolean}>=[],nativeReads:any[]=[];
let bridge:ReturnType<typeof createBridge>|undefined,out='',port=0,mapping:FixedHrMapping,chain:ReturnType<typeof soleTriggerChain>|undefined,guard=false;
let sampling:ReturnType<typeof setInterval>|undefined,sampleFailure='',inFlight:Promise<any>|undefined,playEventStart=0,playWireStart=0;
const report:any={title:'Bongo Planet sole active-source camera/output evidence',qualificationPassed:false,scope:'One local numerical synth/native control voice, finite output trajectories; loaded worklet body, physical sound/venue/human smoothness unqualified',cases:[],attempts:[],errors:[],checkpoints:[],cleanup:{audioClosedObserved:false,nativeCloseObserved:false,httpClosedObserved:false},limits:{testSeconds:30,globalSeconds:45,wireRows:1024,pointerRows:128,checkpointRows:64,allObservationRows:4000,allObservationBytes:524288,bodyBytes:2097152}};
function error(reason:unknown){if(report.errors.length<32)report.errors.push(String(reason).slice(0,1024));else report.errorOverflow=true;}
function save(name:string,value:unknown){fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
function checkpoint(name:string,detail:any={}){expect(report.checkpoints.length).toBeLessThan(64);const row={name,parentHrNs:process.hrtime.bigint().toString(),...detail};budget.charge({kind:'checkpoint',row});report.checkpoints.push(row);}
function pair():Pair{const before=process.hrtime.bigint(),p=BigInt(Math.round(performance.now()*1e6)),after=process.hrtime.bigint();return{beforeHrNs:before.toString(),afterHrNs:after.toString(),performanceNs:p.toString(),offsetLowerNs:(before-p-1n).toString(),offsetUpperNs:(after-p+1n).toString()};}
function healthy(){const s=bridge!.state() as any;expect(s.clock.ready).toBe(true);expect(s.clock.failure??'').toBe('');expect(s.clock.clockEvidenceFailure).toBe('');expect(s.clock.uncertaintyMs).toBeLessThanOrEqual(10);expect(s.drops).toBe(0);return s;}
function check(){if(sampleFailure)throw Error(sampleFailure);expect(report.errors).toEqual([]);expect(report.errorOverflow??false).toBe(false);if(guard){expect(chain).toBeDefined();soleTriggerChain(events.rows.slice(playEventStart),wires.rows.slice(playWireStart).map(r=>r.packet),records.rows);const s=healthy();expect(s.session).toBe(chain!.outputSession);expect(s.pending).toBe(0);expect(s.activeVoices).toBe(1);expect(s.clock.workerIncarnation).toBe(chain!.nativeOnset.workerIncarnation);expect(process.hrtime.bigint()<chain!.nativeEndHrNs).toBe(true);}}
function drainNative(){
 const before=process.hrtime.bigint();mapping.check(pair());const s=healthy();records.ingest(bridge!.records);raw.ingest(bridge!.raw);expect(bridge!.records.length).toBeLessThan(4000);expect(bridge!.raw.length).toBeLessThan(4000);const after=process.hrtime.bigint();
 const added=tail.ingest(s.clock.recentRows,s.clock.workerIncarnation,{beforeHrNs:before.toString(),afterHrNs:after.toString()});
 const stateRead={parentBracket:{beforeHrNs:before.toString(),afterHrNs:after.toString()},session:s.session,pending:s.pending,activeVoices:s.activeVoices,drops:s.drops,clock:{ready:s.clock.ready,uncertaintyMs:s.clock.uncertaintyMs,workerIncarnation:s.clock.workerIncarnation,clockPairSequence:s.clock.clockPairSequence,clockPairAgeMs:s.clock.clockPairAgeMs,worker:{session:s.clock.worker?.session,pending:s.clock.worker?.pending,activeVoices:s.clock.worker?.activeVoices,onsetCount:s.clock.worker?.onsetCount,lateDrops:s.clock.worker?.lateDrops}}};
 budget.charge({kind:'native-read',stateRead});nativeReads.push(stateRead);
 if(guard)for(const observed of added)if(BigInt(observed.row.observedHrNs)>=BigInt(chain!.nativeOnset.actualHrNs))assertActiveNative(observed.row,chain!.outputSession,chain!.nativeEndHrNs);
 return s;
}
async function browserState(page:Page){return page.evaluate(()=>{const b=(window as any).__bongo,w=(window as any).__activeCameraWitness,before=performance.now()/1000;return{scene:b.scene,view:b.view.getDiagnostics(),output:b.output,local:{status:b.status,adapterState:b.audio.state,contextState:b.audio.context?.state??null,audioNow:b.audio.now,browserBefore:before,browserAfter:performance.now()/1000},events:b.events,wires:w.rows,inputs:w.inputs,wireError:w.error};});}
function observe(page:Page):Promise<any>{
 if(inFlight)return inFlight;
 const before=process.hrtime.bigint();
 inFlight=browserState(page).then(s=>{
  const after=process.hrtime.bigint(),local={...s.local,parentBracket:{beforeHrNs:before.toString(),afterHrNs:after.toString()}},newTime=fresh.observe(local),value={...local,fresh:newTime};
  budget.charge({kind:'local-observation',value});localRows.push(value);events.ingest(s.events);wires.ingest(s.wires);inputs.ingest(s.inputs);expect(s.wireError).toBe('');
  if(guard)assertActiveLocal(local,chain!.engineSession,chain!.localEnd);check();return s;
 }).catch(e=>{sampleFailure=String(e);throw e;}).finally(()=>{inFlight=undefined;});return inFlight;
}
async function capture(page:Page){drainNative();return observe(page);}
async function newLocal(page:Page,after:number){await expect.poll(async()=>{await capture(page);return localRows.some(r=>r.fresh&&r.status?.time>after);},{timeout:1000}).toBe(true);for(let i=localRows.length-1;i>=0;i--)if(localRows[i].fresh&&localRows[i].status?.time>after)return localRows[i];throw Error('Fresh local witness unavailable');}
function lastNativeState(){for(let i=tail.rows.length-1;i>=0;i--)if(tail.rows[i].row.type==='state'&&tail.rows[i].row.session===chain!.outputSession){assertActiveNative(tail.rows[i].row,chain!.outputSession,chain!.nativeEndHrNs);return tail.rows[i];}throw Error('No timestamped sole native state');}
function scene():Scene{return{version:1,topology:'icosa-3v-v1',settings:{bpm:120,key:9,scale:'major',travel:.75,quantization:.25,volume:.1},pieces:[{kind:'generator',id:'gen',vertex:0,period:8,phase:0,reach:180,enabled:true},{kind:'note',id:'long-note',vertex:3,degree:0,octave:4,timbre:'sine',duration:8,level:.1}]};}
function relocate(s:Scene,vertex:number){const next=structuredClone(s);next.pieces.find(p=>p.id==='long-note')!.vertex=vertex;return next;}
function verifyReceived(rows:Wire[],receiver:any[],udp:any[]){
 let ei=0,ui=0;expect(rows.length).toBeGreaterThan(0);
 for(const r of rows){const p=r.packet;while(ei<receiver.length&&!(receiver[ei].type==='position'&&receiver[ei].nodeId===p.nodeId&&receiver[ei].objectId===p.objectId&&distance(receiver[ei].position,p.position)<1e-12))ei++;expect(ei,'Missing ordered receiver position').toBeLessThan(receiver.length);ei++;let matched=false;while(ui<udp.length){const d=decode(udp[ui++].hex);if(d.objectId===p.objectId&&distance(d.position,p.position)<=1e-6){matched=true;break;}}expect(matched,'Missing ordered independent raw OSC').toBe(true);}
}
async function emptyGesture(page:Page,dx:number){
 const decision=await page.evaluate(dx=>{
  const canvas=document.querySelector('canvas')!,box=canvas.getBoundingClientRect(),b=(window as any).__bongo,camera=b.view.getDiagnostics().camera;
  // A positive vertical drag reduces phi. Choose the predeclared opposite
  // direction at the nearest pole, never mutate controls/private camera.
  const dy=camera[1]>=0?-120:120,top=box.y+240,bottom=box.y+box.height-240;
  const ys=dy<0?[top,bottom]:[bottom,top],xs=[box.x+128,box.x+box.width-348];
  const identity=(element:Element|null)=>({tag:element?.tagName??null,id:element?.id??null,isCanvas:element===canvas});
  const point=(x:number,y:number)=>({x,y,margin:Math.min(x-box.x,box.x+box.width-x,y-box.y,box.y+box.height-y),hit:identity(document.elementFromPoint(x,y)),slotClear:b.slots.filter((s:any)=>s.visible).every((s:any)=>Math.hypot(s.x-x,s.y-y)>40)});
  const candidates=ys.flatMap(y=>xs.map(x=>({start:point(x,y),end:point(x+dx,y+dy)}))),chosen=candidates.find(c=>[c.start,c.end].every(p=>p.margin>=120&&p.hit.isCanvas&&p.slotClear));
  return{camera,nearestPole:camera[1]>=0?'north':'south',dx,dy,box:{x:box.x,y:box.y,width:box.width,height:box.height},candidates,chosen};
 },dx);
 expect(decision.chosen,'No declared interior canvas-hit/slot-clear gesture').toBeTruthy();checkpoint('gesture hit/precondition',decision);return decision as typeof decision&{chosen:NonNullable<typeof decision.chosen>};
}

test.use({viewport:{width:1440,height:1000},launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']}});
test.setTimeout(30000);
test.beforeAll(async()=>{
 out=process.env.BONGO_ACTIVE_CAMERA_EVIDENCE_DIR??'';if(!out)throw Error('Exclusive BONGO_ACTIVE_CAMERA_EVIDENCE_DIR required');fs.mkdirSync(out,{recursive:false});
 report.outputSourceHash=sha(fs.readFileSync('src/output/OutputAdapter.ts'));expect(report.outputSourceHash).toBe(OUTPUT_SHA);
 mapping=new FixedHrMapping(pair(),budget);checkpoint('private native bridge startup');bridge=createBridge(0,0,{nativeClock:true});port=await bridge.start();
 await expect.poll(()=>{const s=healthy();return s.clock.worker?.clockDomain??'';},{timeout:3000}).toBe('native-monotonic');drainNative();save('initial-receiver.json',bridge.state());checkpoint('native ready',{port});
});
test.afterAll(async()=>{
 if(sampling)clearInterval(sampling);if(!out)return;
 if(bridge){try{save('receiver-before-close.json',bridge.state());records.ingest(bridge.records);raw.ingest(bridge.raw);}catch(e){error('Preclose evidence '+String(e));}try{await bridge.close();report.cleanup.nativeCloseObserved=true;report.cleanup.httpClosedObserved=!bridge.server.listening;report.receiverAfterClose=bridge.state();}catch(e){error('Native cleanup '+String(e));}}
 report.wires=wires.rows;report.pointerInputs=inputs.rows;report.localEvents=events.rows;report.receiverRecords=records.rows;report.rawOSC=raw.rows;report.nativeRows=tail.rows;report.localObservations=localRows;report.nativeReads=nativeReads;report.observationBudget={count:budget.count,bytes:budget.bytes,failure:budget.failure};report.mapping={fixedOffsetNs:mapping?.offsetNs.toString(),observedUncertaintyNs:mapping?.uncertaintyNs.toString(),pairs:mapping?.pairs,scope:'Fixed same-Node stable-rate/1ns rounding premise; sparse independent brackets are not continuous observed clock proof.'};report.sampleFailure=sampleFailure;
 try{save('report.json',report);}catch(e){error('Final report write '+String(e));throw e;}
 expect(report.errors).toEqual([]);expect(report.errorOverflow??false).toBe(false);expect(report.cleanup.audioClosedObserved).toBe(true);expect(report.cleanup.nativeCloseObserved).toBe(true);expect(report.cleanup.httpClosedObserved).toBe(true);
});

test('one genuine8s local/native voice retains world trajectory through camera motion at60/15/2FPS',async({page})=>{
 let ready=false;
 try{
  page.on('pageerror',e=>error('Page '+e.message));
  let originalBody:Promise<void>|undefined;
  page.on('response',response=>{if(response.url()!==MAIN||response.request().resourceType()!=='script')return;report.originalMainResponses=(report.originalMainResponses??0)+1;if(report.originalMainResponses!==1){error('Duplicate original main response');return;}originalBody=response.body().then(b=>{if(b.length>2097152)throw Error('Main body cap');fs.writeFileSync(path.join(out,'original-page-main.js'),b,{flag:'wx'});report.originalMainHash=sha(b);report.originalMainBytes=b.length;}).catch(e=>error('Original body '+String(e)));});
  sampling=setInterval(()=>{try{drainNative();if(ready)void observe(page).catch(e=>{sampleFailure=String(e);});}catch(e){sampleFailure=String(e);if(sampling)clearInterval(sampling);}},25);
  async function body(url:string,name:string,expected:string){const b=await(await page.request.get(url)).body();expect(b.length).toBeLessThanOrEqual(2097152);fs.writeFileSync(path.join(out,name),b,{flag:'wx'});expect(sha(b)).toBe(expected);return b;}
  const mainBefore=await body(MAIN,'served-main-before.js',MAIN_SHA),paths=[...new Set([...mainBefore.toString('utf8').matchAll(/\/BongoPlanet\/assets\/processor-[^"\s]+?\.js/g)].map(m=>m[0]))];expect(paths).toHaveLength(1);expect(new URL(paths[0],APP).href).toBe(PROCESSOR);await body(PROCESSOR,'served-processor-before.js',PROCESSOR_SHA);
  report.processorBinding={url:PROCESSOR,sha256:PROCESSOR_SHA,scope:'Fixed addModule URL in immutable observed main plus separately fetched processor before/after; genuine loaded AudioWorklet body UNOBSERVED.'};
  await page.addInitScript(({target})=>{
   (window as any).__name=(f:unknown)=>f;const Base=window.WebSocket,w:{rows:any[];inputs:any[];bytes:number;error:string}={rows:[],inputs:[],bytes:0,error:''};(window as any).__activeCameraWitness=w;
   const append=(list:any[],row:any,cap:number)=>{const bytes=new TextEncoder().encode(JSON.stringify(row)).byteLength;if(list.length>=cap||w.bytes+bytes>524288){w.error='Browser witness count/byte cap';return;}w.bytes+=bytes;list.push(row);};
   for(const kind of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture'])window.addEventListener(kind,e=>{const p=e as PointerEvent;if(!p.isTrusted)return;const canvas=document.querySelector('canvas'),hit=document.elementFromPoint(p.clientX,p.clientY),t=e.target as Element|null;append(w.inputs,{kind:p.type,time:performance.now()/1000,trusted:p.isTrusted,pointerId:p.pointerId,buttons:p.buttons,x:p.clientX,y:p.clientY,targetIsCanvas:t===canvas,targetTag:t?.tagName??null,targetId:t?.id??null,hitIsCanvas:hit===canvas,hitTag:hit?.tagName??null,hitId:hit?.id??null,canvasHasCapture:canvas?.hasPointerCapture(p.pointerId)??false,cameraBeforeControls:(window as any).__bongo?.view.getDiagnostics().camera},128);},{capture:true});
   class Observed extends Base{constructor(url:string|URL,protocols?:string|string[]){super(String(url)==='ws://127.0.0.1:5418'?target:url,protocols);}override send(data:string|Blob|BufferSource){const before=performance.now()/1000;super.send(data);const after=performance.now()/1000;try{if(typeof data!=='string')throw Error('Nonstring producer wire');append(w.rows,{index:w.rows.length,before,after,camera:(window as any).__bongo?.view.getDiagnostics().camera,packet:JSON.parse(data)},1024);}catch(e){w.error=String(e);}}}window.WebSocket=Observed;
  },{target:`ws://127.0.0.1:${port}`});
  await page.goto(APP);await page.waitForFunction(()=>(window as any).__bongo);ready=true;await expect.poll(()=>report.originalMainResponses??0).toBe(1);expect(originalBody).toBeDefined();await originalBody;expect(report.originalMainHash).toBe(MAIN_SHA);
  const initial=scene();await page.evaluate(s=>(window as any).__bongo.load(s),initial);await page.locator('details.diagnostics summary').click();await page.locator('#bridge').click();await expect.poll(async()=>{const b=await capture(page);return b.output.connected&&b.output.clockSynchronization.length===8;}).toBe(true);
  const beforePlay=await capture(page);expect(beforePlay.scene).toEqual(initial);expect(beforePlay.local.adapterState).toBe('locked');expect(tail.rows.length).toBeGreaterThan(0);playEventStart=events.rows.length;playWireStart=wires.rows.length;report.preludeStart={localEventIndex:playEventStart,wireIndex:playWireStart,nativeIndex:tail.rows.length,parentHrNs:process.hrtime.bigint().toString()};checkpoint('deliberate Play');await page.locator('#play').click();
  await expect.poll(async()=>{
   const b=await capture(page);const counts=[events.rows.slice(playEventStart).filter(e=>e.type==='trigger').length,events.rows.slice(playEventStart).filter(e=>e.type==='onset').length,wires.rows.slice(playWireStart).filter(w=>w.packet.type==='trigger').length,records.rows.filter(r=>r.type==='onset').length];expect(counts.every(n=>n<=1)).toBe(true);check();return counts.every(n=>n===1)&&b.local.status?.activeVoices===1&&healthy().clock.worker?.activeVoices===1;
  },{timeout:5000}).toBe(true);
  chain=soleTriggerChain(events.rows.slice(playEventStart),wires.rows.slice(playWireStart).map(w=>w.packet),records.rows);expect(chain.nativeOnset.workerIncarnation).toBe(healthy().clock.workerIncarnation);expect(chain.nativeOnset.position).toHaveLength(3);const icoNorm=Math.hypot(1,phi);expect(distance(chain.nativeOnset.position,[0,1/icoNorm,phi/icoNorm])).toBeLessThanOrEqual(1e-6);const emission=events.rows.slice(playEventStart).find(e=>e.type==='emission');expect(Math.abs(chain.trigger.onset-emission.time-1)).toBeLessThanOrEqual(1e-8);
  report.chain={...chain,nativeEndHrNs:chain.nativeEndHrNs.toString()};guard=true;
  for(const n of tail.rows)if(BigInt(n.row.observedHrNs)>=BigInt(chain.nativeOnset.actualHrNs))assertActiveNative(n.row,chain.outputSession,chain.nativeEndHrNs);
  for(const l of localRows)if(l.status?.session===chain.engineSession&&l.status.time>=chain.localOnset.onset)assertActiveLocal(l,chain.engineSession,chain.localEnd);
  const disabled=structuredClone(initial);disabled.pieces[0]= {...disabled.pieces[0],enabled:false} as Scene['pieces'][number];checkpoint('generator disable normal edit');await page.evaluate(s=>(window as any).__bongo.edit(s),disabled);await page.waitForTimeout(150);let b=await capture(page);expect(b.scene).toEqual(disabled);check();
  const setup=relocate(disabled,85);checkpoint('unmeasured setup3 to85');await page.evaluate(s=>(window as any).__bongo.edit(s),setup);await page.waitForTimeout(150);b=await capture(page);expect(b.scene).toEqual(setup);expect(distance(healthy().objects[0].position,XYZ.right)).toBeLessThanOrEqual(1e-6);
  const remaining=Number(chain.nativeEndHrNs-process.hrtime.bigint())/1e9;report.nativeLifetimeAdmission={remainingSeconds:remaining,nativeEndHrNs:chain.nativeEndHrNs.toString(),observedParentHrNs:process.hrtime.bigint().toString()};expect(remaining).toBeGreaterThan(3);
  for(const fps of [60,15,2]){
   checkpoint('active movement preparation',{fps});await page.evaluate(s=>(window as any).__bongo.edit(s),setup);await page.locator('#fps').selectOption(String(fps));await page.waitForTimeout(150);const before=await newLocal(page,fresh.lastTime??0),pre=await capture(page);expect(pre.scene).toEqual(setup);check();
   const nativeBefore=lastNativeState(),old=healthy().objects[0],chosen=pre.output.clockSynchronization.reduce((best:any,x:any)=>x.uncertaintyMs<best.uncertaintyMs?x:best,{uncertaintyMs:Infinity});expect(chosen.uncertaintyMs).toBeLessThanOrEqual(10);expect(distance(old.position,XYZ.right)).toBeLessThanOrEqual(1e-6);expect(old.objectId).toBe(chain.wire.objectId);expect(old.nodeId).toBe('long-note');
   const next=relocate(setup,10),decision=await emptyGesture(page,0),attempt:any={fps,sceneBefore:setup,sceneAfter:next,decision,localBefore:before,nativeBefore,wireStart:wires.rows.length,eventStart:records.rows.length,rawStart:raw.rows.length,pointerStart:inputs.rows.length,localStart:localRows.length,nativeStart:tail.rows.length,chosenSynchronization:chosen};report.attempts.push(attempt);
   await page.mouse.move(decision.chosen.start.x,decision.chosen.start.y);await page.mouse.down();const parentEditBefore=process.hrtime.bigint();const bracket=await page.evaluate(s=>{const b=(window as any).__bongo,before=performance.now()/1000,camera=b.view.getDiagnostics().camera;b.edit(s);return{before,after:performance.now()/1000,camera};},next);attempt.parentEditBracket={beforeHrNs:parentEditBefore.toString(),afterHrNs:process.hrtime.bigint().toString()};attempt.editBracket=bracket;expect(BigInt(nativeBefore.row.observedHrNs)<parentEditBefore).toBe(true);expect(bracket.after-bracket.before).toBeLessThanOrEqual(.005);
   await page.waitForTimeout(45);await page.mouse.move(decision.chosen.end.x,decision.chosen.end.y,{steps:2});await page.mouse.up();await page.waitForTimeout(220);const post=await capture(page);attempt.post={scene:post.scene,camera:post.view.camera,local:post.local,outputSession:post.output.session};const after=await newLocal(page,fresh.lastTime??0);attempt.localAfter=after;const nativeAfter=lastNativeState();attempt.nativeAfter=nativeAfter;check();
   expect(post.scene).toEqual(next);expect(distance(post.view.camera,bracket.camera)).toBeGreaterThan(.05);const ps=inputs.rows.slice(attempt.pointerStart),gesture=ps.find(p=>p.kind==='pointermove'&&p.buttons===1&&p.time>=bracket.after);attempt.pointerInputs=ps;expect(gesture).toBeTruthy();expect(gesture.trusted&&gesture.targetIsCanvas&&gesture.canvasHasCapture).toBe(true);expect(ps.some(p=>p.kind==='gotpointercapture'&&p.pointerId===gesture.pointerId&&p.targetIsCanvas&&p.canvasHasCapture)).toBe(true);
   const movement=wires.rows.slice(attempt.wireStart).filter(w=>w.packet.type==='position'),samples=movement.map(w=>{const p=w.packet;expect(p.nodeId).toBe('long-note');expect(p.objectId).toBe(chain!.wire.objectId);const f=progress(p.position),t=p.sent-chosen.offset,lo=Math.max(0,Math.min(1,(t-bracket.after-.001)/.12)),hi=Math.max(0,Math.min(1,(t-bracket.before+.001)/.12));expect(f).toBeGreaterThanOrEqual(lo-1e-6);expect(f).toBeLessThanOrEqual(hi+1e-6);return{...w,progress:f,allowedFraction:{lo,hi},cameraDistance:distance(w.camera,gesture.cameraBeforeControls)};});attempt.samples=samples;expect(samples.length).toBeGreaterThanOrEqual(3);expect(samples.every((s,i)=>i===0||s.progress>=samples[i-1].progress-1e-8)).toBe(true);expect(samples.filter(s=>s.progress>0&&s.progress<.99&&s.before<gesture.time).length).toBeGreaterThanOrEqual(1);expect(samples.filter(s=>s.progress>0&&s.progress<.99&&s.before>=gesture.time&&s.cameraDistance>.05).length).toBeGreaterThanOrEqual(1);
   const received=records.rows.slice(attempt.eventStart).filter(r=>r.type==='position'),udp=raw.rows.slice(attempt.rawStart);verifyReceived(movement,received,udp);const firstReceipt=mapping.interval(received[0].time),lastReceipt=mapping.interval(received.at(-1).time);attempt.receiptInterval={firstLowerHrNs:firstReceipt.lower.toString(),firstUpperHrNs:firstReceipt.upper.toString(),lastLowerHrNs:lastReceipt.lower.toString(),lastUpperHrNs:lastReceipt.upper.toString(),fixedOffsetNs:mapping.offsetNs.toString(),observedUncertaintyNs:mapping.uncertaintyNs.toString(),scope:'Conditional fixed same-Node monotonic relation; actual parent position receipt times, not audio times.'};
   const nativeDuring=tail.rows.slice(attempt.nativeStart).find(n=>n.row.type==='state'&&BigInt(n.row.observedHrNs)>firstReceipt.upper&&BigInt(n.row.observedHrNs)<lastReceipt.lower);expect(nativeDuring,'No fresh native state during movement receipts').toBeTruthy();assertActiveNative(nativeDuring!.row,chain.outputSession,chain.nativeEndHrNs);expect(BigInt(nativeDuring!.row.observedHrNs)>BigInt(nativeBefore.row.observedHrNs)).toBe(true);expect(BigInt(nativeAfter.row.observedHrNs)>lastReceipt.upper).toBe(true);expect(BigInt(nativeAfter.row.observedHrNs)>BigInt(nativeDuring!.row.observedHrNs)).toBe(true);const localDuring=localRows.slice(attempt.localStart).find(l=>l.fresh&&l.status.time>before.status.time&&l.status.time<after.status.time&&BigInt(l.parentBracket.beforeHrNs)>firstReceipt.upper&&BigInt(l.parentBracket.afterHrNs)<lastReceipt.lower);expect(localDuring,'No distinct fresh local observation during receipt interval').toBeTruthy();attempt.localDuring=localDuring;attempt.nativeDuring=nativeDuring;expect(healthy().objects[0].objectId).toBe(chain.wire.objectId);expect(distance(healthy().objects[0].position,XYZ.forward)).toBeLessThanOrEqual(1e-6);report.cases.push({...attempt,passed:true});
  }
  checkpoint('100ms normal running observation drain');await page.waitForTimeout(100);await newLocal(page,fresh.lastTime??0);await capture(page);check();verifyReceived(wires.rows.filter(w=>w.packet.type==='position'),records.rows,raw.rows);await body(MAIN,'served-main-after.js',MAIN_SHA);await body(PROCESSOR,'served-processor-after.js',PROCESSOR_SHA);await capture(page);check();report.guardEnd={parentHrNs:process.hrtime.bigint().toString(),localTime:fresh.lastTime,nativeEndHrNs:chain.nativeEndHrNs.toString(),localEventIndex:events.rows.length,wireIndex:wires.rows.length,nativeIndex:tail.rows.length};report.scopedChecksPassed=true;
 }catch(e){error(e);throw e;}
 finally{
  guard=false;if(sampling)clearInterval(sampling);if(inFlight)try{await inFlight;}catch(e){error('Observation drain '+String(e));}
  if(!page.isClosed()){
   try{await page.evaluate(()=>{const b=(window as any).__bongo;if(b?.audio)b.audio.pause();});await page.waitForTimeout(80);report.cleanup.audioAfterPause=await page.evaluate(()=>{const b=(window as any).__bongo;return b?{status:b.status,adapterState:b.audio.state,contextState:b.audio.context?.state}:null;});}catch(e){error('Audio pause cleanup '+String(e));}
   try{report.cleanup.audioClosedObserved=await page.evaluate(async()=>{const b=(window as any).__bongo;if(!b?.audio)return false;await b.audio.dispose();return b.audio.context?.state==='closed';});}catch(e){error('Audio context cleanup '+String(e));}
   try{if((await browserState(page)).output.connected)await page.locator('#bridge').click();}catch(e){error('Producer cleanup '+String(e));}
  }
 }
});
