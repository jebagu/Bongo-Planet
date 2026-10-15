/** Bongo Planet source-prepared paused camera/output check. Separate root GO is
 * required for actual execution. No renderer/adapter/geometry replacement. */
import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createBridge} from '../src/output/bridge';

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
let bridge:ReturnType<typeof createBridge>|undefined,out='',port=0;
const report:any={title:'Bongo Planet paused camera/output contract',qualificationPassed:false,scope:'Finite camera/paused movement control checks; no sound/venue/continuous clock qualification',cases:[],errors:[],checkpoints:[],cleanup:{nativeCloseObserved:false,httpClosedObserved:false}};
function save(name:string,value:unknown){fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
function checkpoint(name:string,detail:any={}){expect(report.checkpoints.length).toBeLessThan(64);report.checkpoints.push({name,nodeMonotonic:performance.now()/1000,...detail});}
function healthy(){const state=bridge!.state() as any;expect(state.clock.ready).toBe(true);expect(state.clock.failure??'').toBe('');expect(state.clock.clockEvidenceFailure).toBe('');expect(state.clock.uncertaintyMs).toBeLessThanOrEqual(10);expect(state.drops).toBe(0);expect(state.pending).toBe(0);expect(state.activeVoices).toBe(0);return state;}
async function browserState(page:Page){return page.evaluate(()=>{const b=(window as any).__bongo,w=(window as any).__cameraWitness;return{scene:b.scene,view:b.view.getDiagnostics(),output:b.output,status:b.status,audioState:b.audio.state,events:b.events,wires:w.rows,inputs:w.inputs,wireError:w.error};});}
function stableObjects(state:any){return state.objects.map((o:any)=>({objectId:o.objectId,nodeId:o.nodeId,position:o.position})).sort((a:any,b:any)=>a.nodeId.localeCompare(b.nodeId));}
function verifyReceived(wires:Wire[],events:any[],raw:any[]){
 let eventIndex=0,rawIndex=0;expect(wires.length).toBeGreaterThan(0);
 for(const row of wires){const p=row.packet;while(eventIndex<events.length&&!(events[eventIndex].type==='position'&&events[eventIndex].nodeId===p.nodeId&&events[eventIndex].objectId===p.objectId&&distance(events[eventIndex].position,p.position)<1e-12))eventIndex++;
  expect(eventIndex,'Missing ordered receiver position').toBeLessThan(events.length);eventIndex++;
  let matched=false;while(rawIndex<raw.length){const d=decode(raw[rawIndex].hex);rawIndex++;if(d.objectId===p.objectId&&distance(d.position,p.position)<=1e-6){matched=true;break;}}
  expect(matched,'Missing ordered independent raw OSC').toBe(true);expect(rawIndex).toBeGreaterThan(0);
  const decoded=decode(raw[rawIndex-1].hex);expect(decoded.objectId).toBe(p.objectId);expect(distance(decoded.position,p.position)).toBeLessThanOrEqual(1e-6);
 }
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
 out=process.env.BONGO_CAMERA_EVIDENCE_DIR??'';if(!out)throw Error('Exclusive BONGO_CAMERA_EVIDENCE_DIR required');fs.mkdirSync(out,{recursive:false});
 const outputSource=fs.readFileSync('src/output/OutputAdapter.ts');report.outputSourceHash=sha(outputSource);expect(report.outputSourceHash).toBe(OUTPUT_SHA);
 checkpoint('owned bridge startup');bridge=createBridge(0,0,{nativeClock:true});port=await bridge.start();
 await expect.poll(()=>{const state=healthy();return state.clock.worker?.clockDomain??'';},{timeout:3000}).toBe('native-monotonic');
 save('initial-receiver.json',healthy());checkpoint('receiver ready',{port});
});
test.afterAll(async()=>{
 if(!out)return;
 if(bridge){
  try{save('receiver-before-close.json',bridge.state());report.receiverRecords=bridge.records;report.rawOSC=bridge.raw;expect(bridge.records.length).toBeLessThan(4000);expect(bridge.raw.length).toBeLessThan(4000);}catch(error){report.errors.push('Preclose evidence: '+String(error));}
  // Observation/assertion/disk errors never bypass the owned close attempt.
  try{await bridge.close();report.cleanup.nativeCloseObserved=true;report.cleanup.httpClosedObserved=!bridge.server.listening;report.receiverAfterClose=bridge.state();}catch(error){report.errors.push('Cleanup: '+String(error));}
 }
 try{save('report.json',report);}catch(error){report.errors.push('Final evidence write: '+String(error));throw error;}
 expect(report.errors).toEqual([]);expect(report.cleanup.nativeCloseObserved).toBe(true);expect(report.cleanup.httpClosedObserved).toBe(true);
});

test('trusted camera orbit/zoom preserves XYZ, and paused manual output arc survives concurrent camera motion',async({page})=>{
 try{
  page.on('pageerror',error=>{if(report.errors.length<32)report.errors.push('Page: '+error.message.slice(0,1024));else report.browserErrorOverflow=true;});
  let originalBody:Promise<void>|undefined;
  // Register BEFORE goto; only the genuine page script response qualifies.
  page.on('response',response=>{if(response.url()!==MAIN||response.request().resourceType()!=='script')return;report.originalMainResponses=(report.originalMainResponses??0)+1;if(report.originalMainResponses!==1){report.errors.push('Duplicate original main script response');return;}originalBody=response.body().then(bytes=>{if(bytes.length>2*1024*1024)throw Error('Original main body cap exceeded');fs.writeFileSync(path.join(out,'original-page-main.js'),bytes,{flag:'wx'});report.originalMainHash=sha(bytes);report.originalMainBytes=bytes.length;report.originalMainURL=response.url();}).catch(error=>{report.errors.push('Original main response capture: '+String(error));});});
  const servedBefore=await(await page.request.get(MAIN)).body();expect(servedBefore.length).toBeLessThanOrEqual(2*1024*1024);fs.writeFileSync(path.join(out,'served-main-before.js'),servedBefore,{flag:'wx'});report.servedMainBeforeHash=sha(servedBefore);expect(report.servedMainBeforeHash).toBe(MAIN_SHA);
  await page.addInitScript(({target})=>{
   const Base=window.WebSocket;const witness:{rows:any[];inputs:any[];bytes:number;error:string}={rows:[],inputs:[],bytes:0,error:''};(window as any).__cameraWitness=witness;
   for(const kind of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture'])window.addEventListener(kind,event=>{
    const e=event as PointerEvent;if(!e.isTrusted)return;if(witness.inputs.length>=128){witness.error='Bounded pointer witness overflow';return;}const canvas=document.querySelector('canvas'),hit=document.elementFromPoint(e.clientX,e.clientY),target=e.target as Element|null;
    witness.inputs.push({kind:e.type,time:performance.now()/1000,trusted:e.isTrusted,pointerId:e.pointerId,buttons:e.buttons,x:e.clientX,y:e.clientY,targetIsCanvas:target===canvas,targetTag:target?.tagName??null,targetId:target?.id??null,hitIsCanvas:hit===canvas,hitTag:hit?.tagName??null,hitId:hit?.id??null,canvasHasCapture:canvas?.hasPointerCapture(e.pointerId)??false,cameraBeforeControls:(window as any).__bongo?.view.getDiagnostics().camera});
   },{capture:true});
   class Observed extends Base{constructor(url:string|URL,protocols?:string|string[]){super(String(url)==='ws://127.0.0.1:5418'?target:url,protocols);}override send(data:string|Blob|BufferSource){const before=performance.now()/1000;super.send(data);const after=performance.now()/1000;try{if(typeof data!=='string')throw Error('Nonstring producer wire');const packet=JSON.parse(data);if(packet.type!=='position')return;const row={index:witness.rows.length,before,after,camera:(window as any).__bongo.view.getDiagnostics().camera,packet},bytes=new TextEncoder().encode(JSON.stringify(row)).byteLength;if(witness.rows.length>=1024||witness.bytes+bytes>524288){witness.error='Bounded wire witness overflow';return;}witness.rows.push(row);witness.bytes+=bytes;}catch(error){witness.error=String(error);}}}
   window.WebSocket=Observed;
  },{target:`ws://127.0.0.1:${port}`});
  checkpoint('page navigation');await page.goto(APP);await page.waitForFunction(()=>(window as any).__bongo);await expect.poll(()=>report.originalMainResponses??0).toBe(1);expect(originalBody).toBeDefined();await originalBody;expect(report.originalMainHash).toBe(MAIN_SHA);expect(report.errors).toEqual([]);await page.locator('#fixture').selectOption('F07');await page.waitForFunction(()=>(window as any).__bongo.scene.pieces.length===6);
  const scene=(await browserState(page)).scene;expect(scene.pieces.map((p:any)=>[p.id,p.vertex])).toEqual(Object.entries(VERTEX));
  await page.locator('summary').click();await page.locator('#bridge').click();await expect.poll(async()=>{const state=await browserState(page);return state.output.connected&&Number.isFinite(state.output.uncertaintyMs);}).toBe(true);
  await expect.poll(()=>healthy().objects.length).toBe(6);const initial=healthy(),before=await browserState(page);expect(before.audioState).toBe('locked');expect(before.wireError).toBe('');
  for(const [id,xyz]of Object.entries(XYZ)){const obj=initial.objects.find((o:any)=>o.nodeId===id);expect(obj).toBeTruthy();expect(distance(obj.position,xyz)).toBeLessThanOrEqual(1e-6);}
  const staticStart={wireIndex:before.wires.length,receiverIndex:bridge!.records.length,rawIndex:bridge!.raw.length};
  checkpoint('static orbit');const staticGesture=await emptyGesture(page,220),box=staticGesture.box;await page.mouse.move(staticGesture.chosen.start.x,staticGesture.chosen.start.y);await page.mouse.down();await page.mouse.move(staticGesture.chosen.end.x,staticGesture.chosen.end.y,{steps:12});await page.mouse.up();
  await expect.poll(async()=>distance((await browserState(page)).view.camera,before.view.camera)).toBeGreaterThan(.1);await page.waitForTimeout(150);
  const orbited=await browserState(page);expect(orbited.scene).toEqual(scene);expect(stableObjects(healthy())).toEqual(stableObjects(initial));
  checkpoint('static zoom');await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.wheel(0,-200);await expect.poll(async()=>Math.abs(norm((await browserState(page)).view.camera)-norm(orbited.view.camera))).toBeGreaterThan(.05);
  await page.waitForTimeout(150);const zoomed=await browserState(page);expect(zoomed.scene).toEqual(scene);expect(stableObjects(healthy())).toEqual(stableObjects(initial));expect(zoomed.wireError).toBe('');
  const staticWires:Wire[]=zoomed.wires.slice(staticStart.wireIndex),staticEntries=bridge!.records.slice(staticStart.receiverIndex),staticRaw=bridge!.raw.slice(staticStart.rawIndex);
  for(const row of staticWires){const p=row.packet,original=initial.objects.find((o:any)=>o.nodeId===p.nodeId);expect(original,'Unknown static node').toBeTruthy();expect(p.objectId).toBe(original.objectId);expect(XYZ[p.nodeId]).toBeDefined();expect(distance(p.position,XYZ[p.nodeId]),'Transient camera-relative static XYZ').toBeLessThanOrEqual(1e-6);}
  if(staticWires.length)verifyReceived(staticWires,staticEntries,staticRaw);
  // No static resends is valid; the mandatory original six positions still
  // supply a nonempty receiver/UDP join, and ALL interval packets are checked.
  verifyReceived(zoomed.wires,bridge!.records,bridge!.raw);
  report.cases.push({name:'Paused F07 genuine orbit+zoom',before,orbited,zoomed,gesture:staticGesture,staticInterval:{...staticStart,wireEnd:zoomed.wires.length,wires:staticWires,entries:staticEntries,raw:staticRaw,allPacketsCheckedAgainstFixedWorldXYZ:true},receiverInitial:initial,receiverAfter:healthy(),independentXYZ:XYZ,passed:true});
  for(const fps of [60,15,2]){
   checkpoint('movement preparation',{fps});const startScene=structuredClone(scene);startScene.pieces=startScene.pieces.filter((p:any)=>p.id==='right');await page.evaluate(s=>(window as any).__bongo.load(s),startScene);await page.locator('#fps').selectOption(String(fps));
   await expect.poll(()=>{const q=healthy();return q.objects.length===1&&distance(q.objects[0].position,XYZ.right)<1e-6;}).toBe(true);await page.waitForTimeout(130);
   const pre=await browserState(page),old=healthy().objects[0],eventStart=bridge!.records.length,rawStart=bridge!.raw.length,wireStart=pre.wires.length;expect(pre.wireError).toBe('');expect(pre.audioState).toBe('locked');
   const chosen=pre.output.clockSynchronization.reduce((best:any,x:any)=>x.uncertaintyMs<best.uncertaintyMs?x:best,{uncertaintyMs:Infinity});expect(chosen.uncertaintyMs).toBeLessThanOrEqual(10);
   const next=structuredClone(startScene);next.pieces[0].vertex=10;const decision=await emptyGesture(page,0),arm:any={fps,sceneBefore:startScene,sceneAfter:next,decision,chosenSynchronization:chosen,pointerWitnessStart:pre.inputs.length,wireStart,eventStart,rawStart};(report.movementAttempts??=[]).push(arm);await page.mouse.move(decision.chosen.start.x,decision.chosen.start.y);await page.mouse.down();
   checkpoint('movement committed',{fps});const bracket=await page.evaluate(s=>{const b=(window as any).__bongo,before=performance.now()/1000,camera=b.view.getDiagnostics().camera;b.edit(s);return{before,after:performance.now()/1000,camera};},next);arm.editBracket=bracket;expect(bracket.after-bracket.before).toBeLessThanOrEqual(.005);
   await page.waitForTimeout(45);await page.mouse.move(decision.chosen.end.x,decision.chosen.end.y,{steps:2});await page.mouse.up();await page.waitForTimeout(220);
   const post=await browserState(page),wires:Wire[]=post.wires.slice(wireStart);arm.post=post;arm.wires=wires;const receiver=healthy();arm.receiver=receiver;expect(post.wireError).toBe('');expect(post.scene).toEqual(next);expect(post.audioState).toBe('locked');expect(post.events).toHaveLength(0);expect(distance(post.view.camera,bracket.camera)).toBeGreaterThan(.05);expect(receiver.objects).toHaveLength(1);expect(receiver.objects[0].objectId).toBe(old.objectId);expect(receiver.objects[0].nodeId).toBe('right');expect(distance(receiver.objects[0].position,XYZ.forward)).toBeLessThanOrEqual(1e-6);
   expect(wires.length).toBeGreaterThanOrEqual(3);const inputs=post.inputs.slice(arm.pointerWitnessStart),gesture=inputs.find((input:any)=>input.kind==='pointermove'&&input.buttons===1&&input.time>=bracket.after);arm.pointerInputs=inputs;expect(gesture).toBeTruthy();expect(gesture.trusted).toBe(true);expect(gesture.buttons).toBe(1);expect(gesture.targetIsCanvas).toBe(true);expect(gesture.canvasHasCapture).toBe(true);expect(inputs.some((input:any)=>input.kind==='gotpointercapture'&&input.pointerId===gesture.pointerId&&input.targetIsCanvas&&input.canvasHasCapture)).toBe(true);const samples=wires.map(row=>{expect(row.packet.objectId).toBe(old.objectId);expect(row.packet.nodeId).toBe('right');const f=progress(row.packet.position),producerTime=row.packet.sent-chosen.offset,lo=Math.max(0,Math.min(1,(producerTime-bracket.after-.001)/.12)),hi=Math.max(0,Math.min(1,(producerTime-bracket.before+.001)/.12));expect(f).toBeGreaterThanOrEqual(lo-1e-6);expect(f).toBeLessThanOrEqual(hi+1e-6);return{...row,progress:f,allowedFraction:{lo,hi},cameraDistance:distance(row.camera,gesture.cameraBeforeControls)};});
   expect(samples.every((x,i)=>i===0||x.progress>=samples[i-1].progress-1e-8)).toBe(true);expect(samples.filter(x=>x.progress>0&&x.progress<.99&&x.before<gesture.time).length).toBeGreaterThanOrEqual(1);expect(samples.filter(x=>x.progress>0&&x.progress<.99&&x.before>=gesture.time&&x.cameraDistance>.05).length).toBeGreaterThanOrEqual(1);
   const entries=bridge!.records.slice(eventStart),raw=bridge!.raw.slice(rawStart);verifyReceived(wires,entries,raw);report.cases.push({name:'Paused manual arc during genuine orbit',fps,from:{vertex:85,xyz:XYZ.right},to:{vertex:10,xyz:XYZ.forward},sceneBefore:startScene,sceneAfter:next,editBracket:bracket,gesture,decision,pointerInputs:inputs,chosenSynchronization:chosen,clockScope:'Common producer offset cancels; same-browser stable monotonic/1ms timestamp premise. No continuous cross-host bound.',samples,entries,raw,receiver,passed:true});
  }
  const final=await browserState(page);verifyReceived(final.wires,bridge!.records,bridge!.raw);expect(final.wireError).toBe('');const servedAfter=await(await page.request.get(MAIN)).body();expect(servedAfter.length).toBeLessThanOrEqual(2*1024*1024);fs.writeFileSync(path.join(out,'served-main-after.js'),servedAfter,{flag:'wx'});report.servedMainAfterHash=sha(servedAfter);expect(report.servedMainAfterHash).toBe(MAIN_SHA);expect(report.browserErrorOverflow??false).toBe(false);expect(report.errors).toEqual([]);checkpoint('output disconnect');await page.locator('#bridge').click();await expect.poll(()=>bridge!.state().session).toBe('');await expect.poll(()=>(bridge!.state() as any).clock.worker?.objects??-1).toBe(0);report.scopedChecksPassed=true;
 }catch(error){report.errors.push(String(error));throw error;}
 finally{if(!page.isClosed()){try{const final=await browserState(page);report.finalBrowser=final;if(final.output.connected)await page.locator('#bridge').click();}catch(error){report.errors.push('Browser cleanup observation: '+String(error));}}}
});
