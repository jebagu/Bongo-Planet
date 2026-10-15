# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: camera-output-contract.spec.ts >> trusted camera orbit/zoom preserves XYZ, and paused manual output arc survives concurrent camera motion
- Location: scripts/camera-output-contract.spec.ts:70:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0.05
Received:   0.0000034025841776540665
```

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   "Error: expect(received).toBeGreaterThan(expected)
+
+ Expected: > 0.05
+ Received:   0.0000034025841776540665",
+ ]
```

# Test source

```ts
  1   | /** Bongo Planet source-prepared paused camera/output check. Separate root GO is
  2   |  * required for actual execution. No renderer/adapter/geometry replacement. */
  3   | import {test,expect,type Page} from '@playwright/test';
  4   | import fs from 'node:fs';
  5   | import path from 'node:path';
  6   | import {createHash} from 'node:crypto';
  7   | import {createBridge} from '../src/output/bridge';
  8   | 
  9   | const APP='http://127.0.0.1:5417/BongoPlanet/';
  10  | const MAIN=new URL('assets/index-BXks7Y4v.js',APP).href;
  11  | const MAIN_SHA='32b57ff2dabeadc3d85f8143cd91c50abeea9785ebb1a2f35497ee1db198bb93';
  12  | const OUTPUT_SHA='70d3cb4326689f0348a86a5f1929ca0a3ff6b32d95be24a303944fac53763089';
  13  | const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  14  | const phi=(1+Math.sqrt(5))/2,s=1/Math.sqrt(9*phi*phi+1),c=3*phi*s;
  15  | type V=[number,number,number];
  16  | const XYZ:Record<string,V>={right:[c,0,s],left:[-c,0,s],forward:[-s,c,0],back:[s,-c,0],up:[0,s,c],down:[0,-s,-c]};
  17  | const VERTEX={right:85,left:29,forward:10,back:69,up:37,down:53};
  18  | const norm=(v:number[])=>Math.hypot(...v),distance=(a:number[],b:number[])=>norm(a.map((x,i)=>x-b[i]));
  19  | const dot=(a:number[],b:number[])=>a.reduce((sum,x,i)=>sum+x*b[i],0);
  20  | const theta=Math.acos(dot(XYZ.right,XYZ.forward));
  21  | const tangent=XYZ.forward.map((x,i)=>(x-dot(XYZ.right,XYZ.forward)*XYZ.right[i])/Math.sin(theta));
  22  | function arc(f:number):V{return XYZ.right.map((x,i)=>x*Math.cos(theta*f)+tangent[i]*Math.sin(theta*f)) as V;}
  23  | function progress(q:number[]){const f=Math.atan2(dot(q,tangent),dot(q,XYZ.right))/theta;expect(distance(q,arc(f))).toBeLessThanOrEqual(1e-6);expect(Math.abs(norm(q)-1)).toBeLessThanOrEqual(1e-6);return f;}
  24  | /** Independent bounded OSC string/padding/type/float decoding, not decodeOSC. */
  25  | function decode(hex:string){
  26  |  const bytes=Buffer.from(hex,'hex');expect(bytes.length).toBeLessThanOrEqual(128);let offset=0;
  27  |  const string=()=>{const end=bytes.indexOf(0,offset);expect(end).toBeGreaterThanOrEqual(offset);const value=bytes.toString('ascii',offset,end),next=(end+4)&~3;expect(next).toBeLessThanOrEqual(bytes.length);for(let i=end;i<next;i++)expect(bytes[i]).toBe(0);offset=next;return value;};
  28  |  const address=string(),types=string(),match=/^\/adm\/obj\/([1-9]\d*)\/xyz$/.exec(address);expect(match).toBeTruthy();expect(types).toBe(',fff');expect(bytes.length-offset).toBe(12);
  29  |  const position=[0,1,2].map(i=>bytes.readFloatBE(offset+i*4));expect(position.every(Number.isFinite)).toBe(true);return{objectId:Number(match![1]),position,address};
  30  | }
  31  | type Wire={index:number;before:number;after:number;camera:number[];packet:any};
  32  | let bridge:ReturnType<typeof createBridge>|undefined,out='',port=0;
  33  | const report:any={title:'Bongo Planet paused camera/output contract',qualificationPassed:false,scope:'Finite camera/paused movement control checks; no sound/venue/continuous clock qualification',cases:[],errors:[],checkpoints:[],cleanup:{nativeCloseObserved:false,httpClosedObserved:false}};
  34  | function save(name:string,value:unknown){fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
  35  | function checkpoint(name:string,detail:any={}){expect(report.checkpoints.length).toBeLessThan(64);report.checkpoints.push({name,nodeMonotonic:performance.now()/1000,...detail});}
  36  | function healthy(){const state=bridge!.state() as any;expect(state.clock.ready).toBe(true);expect(state.clock.failure??'').toBe('');expect(state.clock.clockEvidenceFailure).toBe('');expect(state.clock.uncertaintyMs).toBeLessThanOrEqual(10);expect(state.drops).toBe(0);expect(state.pending).toBe(0);expect(state.activeVoices).toBe(0);return state;}
  37  | async function browserState(page:Page){return page.evaluate(()=>{const b=(window as any).__bongo,w=(window as any).__cameraWitness;return{scene:b.scene,view:b.view.getDiagnostics(),output:b.output,status:b.status,audioState:b.audio.state,events:b.events,wires:w.rows,inputs:w.inputs,wireError:w.error};});}
  38  | function stableObjects(state:any){return state.objects.map((o:any)=>({objectId:o.objectId,nodeId:o.nodeId,position:o.position})).sort((a:any,b:any)=>a.nodeId.localeCompare(b.nodeId));}
  39  | function verifyReceived(wires:Wire[],events:any[],raw:any[]){
  40  |  let eventIndex=0,rawIndex=0;expect(wires.length).toBeGreaterThan(0);
  41  |  for(const row of wires){const p=row.packet;while(eventIndex<events.length&&!(events[eventIndex].type==='position'&&events[eventIndex].nodeId===p.nodeId&&events[eventIndex].objectId===p.objectId&&distance(events[eventIndex].position,p.position)<1e-12))eventIndex++;
  42  |   expect(eventIndex,'Missing ordered receiver position').toBeLessThan(events.length);eventIndex++;
  43  |   let matched=false;while(rawIndex<raw.length){const d=decode(raw[rawIndex].hex);rawIndex++;if(d.objectId===p.objectId&&distance(d.position,p.position)<=1e-6){matched=true;break;}}
  44  |   expect(matched,'Missing ordered independent raw OSC').toBe(true);expect(rawIndex).toBeGreaterThan(0);
  45  |   const decoded=decode(raw[rawIndex-1].hex);expect(decoded.objectId).toBe(p.objectId);expect(distance(decoded.position,p.position)).toBeLessThanOrEqual(1e-6);
  46  |  }
  47  | }
  48  | async function emptyPoint(page:Page){const box=await page.locator('canvas').boundingBox();expect(box).toBeTruthy();const slots=await page.evaluate(()=>(window as any).__bongo.slots),candidates=[{x:box!.x+10,y:box!.y+10},{x:box!.x+10,y:box!.y+box!.height-10},{x:box!.x+10,y:box!.y+box!.height*.5}],p=candidates.find(p=>slots.filter((s:any)=>s.visible).every((s:any)=>Math.hypot(s.x-p.x,s.y-p.y)>40));expect(p,'No declared empty gesture point').toBeTruthy();return{p:p!,box:box!};}
  49  | 
  50  | test.use({viewport:{width:1440,height:1000},launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']}});
  51  | test.setTimeout(30000);
  52  | test.beforeAll(async()=>{
  53  |  out=process.env.BONGO_CAMERA_EVIDENCE_DIR??'';if(!out)throw Error('Exclusive BONGO_CAMERA_EVIDENCE_DIR required');fs.mkdirSync(out,{recursive:false});
  54  |  const outputSource=fs.readFileSync('src/output/OutputAdapter.ts');report.outputSourceHash=sha(outputSource);expect(report.outputSourceHash).toBe(OUTPUT_SHA);
  55  |  checkpoint('owned bridge startup');bridge=createBridge(0,0,{nativeClock:true});port=await bridge.start();
  56  |  await expect.poll(()=>{const state=healthy();return state.clock.worker?.clockDomain??'';},{timeout:3000}).toBe('native-monotonic');
  57  |  save('initial-receiver.json',healthy());checkpoint('receiver ready',{port});
  58  | });
  59  | test.afterAll(async()=>{
  60  |  if(!out)return;
  61  |  if(bridge){
  62  |   try{save('receiver-before-close.json',bridge.state());report.receiverRecords=bridge.records;report.rawOSC=bridge.raw;expect(bridge.records.length).toBeLessThan(4000);expect(bridge.raw.length).toBeLessThan(4000);}catch(error){report.errors.push('Preclose evidence: '+String(error));}
  63  |   // Observation/assertion/disk errors never bypass the owned close attempt.
  64  |   try{await bridge.close();report.cleanup.nativeCloseObserved=true;report.cleanup.httpClosedObserved=!bridge.server.listening;report.receiverAfterClose=bridge.state();}catch(error){report.errors.push('Cleanup: '+String(error));}
  65  |  }
  66  |  try{save('report.json',report);}catch(error){report.errors.push('Final evidence write: '+String(error));throw error;}
> 67  |  expect(report.errors).toEqual([]);expect(report.cleanup.nativeCloseObserved).toBe(true);expect(report.cleanup.httpClosedObserved).toBe(true);
      |                        ^ Error: expect(received).toEqual(expected) // deep equality
  68  | });
  69  | 
  70  | test('trusted camera orbit/zoom preserves XYZ, and paused manual output arc survives concurrent camera motion',async({page})=>{
  71  |  try{
  72  |   page.on('pageerror',error=>{if(report.errors.length<32)report.errors.push('Page: '+error.message.slice(0,1024));else report.browserErrorOverflow=true;});
  73  |   let originalBody:Promise<void>|undefined;
  74  |   // Register BEFORE goto; only the genuine page script response qualifies.
  75  |   page.on('response',response=>{if(response.url()!==MAIN||response.request().resourceType()!=='script')return;report.originalMainResponses=(report.originalMainResponses??0)+1;if(report.originalMainResponses!==1){report.errors.push('Duplicate original main script response');return;}originalBody=response.body().then(bytes=>{if(bytes.length>2*1024*1024)throw Error('Original main body cap exceeded');fs.writeFileSync(path.join(out,'original-page-main.js'),bytes,{flag:'wx'});report.originalMainHash=sha(bytes);report.originalMainBytes=bytes.length;report.originalMainURL=response.url();}).catch(error=>{report.errors.push('Original main response capture: '+String(error));});});
  76  |   const servedBefore=await(await page.request.get(MAIN)).body();expect(servedBefore.length).toBeLessThanOrEqual(2*1024*1024);fs.writeFileSync(path.join(out,'served-main-before.js'),servedBefore,{flag:'wx'});report.servedMainBeforeHash=sha(servedBefore);expect(report.servedMainBeforeHash).toBe(MAIN_SHA);
  77  |   await page.addInitScript(({target})=>{
  78  |    const Base=window.WebSocket;const witness:{rows:any[];inputs:any[];bytes:number;error:string}={rows:[],inputs:[],bytes:0,error:''};(window as any).__cameraWitness=witness;
  79  |    window.addEventListener('pointermove',event=>{if(!event.isTrusted||event.buttons!==1)return;if(witness.inputs.length>=128){witness.error='Bounded pointer witness overflow';return;}witness.inputs.push({time:performance.now()/1000,trusted:event.isTrusted,buttons:event.buttons,cameraBeforeControls:(window as any).__bongo?.view.getDiagnostics().camera});},{capture:true});
  80  |    class Observed extends Base{constructor(url:string|URL,protocols?:string|string[]){super(String(url)==='ws://127.0.0.1:5418'?target:url,protocols);}override send(data:string|Blob|BufferSource){const before=performance.now()/1000;super.send(data);const after=performance.now()/1000;try{if(typeof data!=='string')throw Error('Nonstring producer wire');const packet=JSON.parse(data);if(packet.type!=='position')return;const row={index:witness.rows.length,before,after,camera:(window as any).__bongo.view.getDiagnostics().camera,packet},bytes=new TextEncoder().encode(JSON.stringify(row)).byteLength;if(witness.rows.length>=1024||witness.bytes+bytes>524288){witness.error='Bounded wire witness overflow';return;}witness.rows.push(row);witness.bytes+=bytes;}catch(error){witness.error=String(error);}}}
  81  |    window.WebSocket=Observed;
  82  |   },{target:`ws://127.0.0.1:${port}`});
  83  |   checkpoint('page navigation');await page.goto(APP);await page.waitForFunction(()=>(window as any).__bongo);await expect.poll(()=>report.originalMainResponses??0).toBe(1);expect(originalBody).toBeDefined();await originalBody;expect(report.originalMainHash).toBe(MAIN_SHA);expect(report.errors).toEqual([]);await page.locator('#fixture').selectOption('F07');await page.waitForFunction(()=>(window as any).__bongo.scene.pieces.length===6);
  84  |   const scene=(await browserState(page)).scene;expect(scene.pieces.map((p:any)=>[p.id,p.vertex])).toEqual(Object.entries(VERTEX));
  85  |   await page.locator('summary').click();await page.locator('#bridge').click();await expect.poll(async()=>{const state=await browserState(page);return state.output.connected&&Number.isFinite(state.output.uncertaintyMs);}).toBe(true);
  86  |   await expect.poll(()=>healthy().objects.length).toBe(6);const initial=healthy(),before=await browserState(page);expect(before.audioState).toBe('locked');expect(before.wireError).toBe('');
  87  |   for(const [id,xyz]of Object.entries(XYZ)){const obj=initial.objects.find((o:any)=>o.nodeId===id);expect(obj).toBeTruthy();expect(distance(obj.position,xyz)).toBeLessThanOrEqual(1e-6);}
  88  |   const staticStart={wireIndex:before.wires.length,receiverIndex:bridge!.records.length,rawIndex:bridge!.raw.length};
  89  |   checkpoint('static orbit');const {p,box}=await emptyPoint(page);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.65,{steps:12});await page.mouse.up();
  90  |   await expect.poll(async()=>distance((await browserState(page)).view.camera,before.view.camera)).toBeGreaterThan(.1);await page.waitForTimeout(150);
  91  |   const orbited=await browserState(page);expect(orbited.scene).toEqual(scene);expect(stableObjects(healthy())).toEqual(stableObjects(initial));
  92  |   checkpoint('static zoom');await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.wheel(0,-200);await expect.poll(async()=>Math.abs(norm((await browserState(page)).view.camera)-norm(orbited.view.camera))).toBeGreaterThan(.05);
  93  |   await page.waitForTimeout(150);const zoomed=await browserState(page);expect(zoomed.scene).toEqual(scene);expect(stableObjects(healthy())).toEqual(stableObjects(initial));expect(zoomed.wireError).toBe('');
  94  |   const staticWires:Wire[]=zoomed.wires.slice(staticStart.wireIndex),staticEntries=bridge!.records.slice(staticStart.receiverIndex),staticRaw=bridge!.raw.slice(staticStart.rawIndex);
  95  |   for(const row of staticWires){const p=row.packet,original=initial.objects.find((o:any)=>o.nodeId===p.nodeId);expect(original,'Unknown static node').toBeTruthy();expect(p.objectId).toBe(original.objectId);expect(XYZ[p.nodeId]).toBeDefined();expect(distance(p.position,XYZ[p.nodeId]),'Transient camera-relative static XYZ').toBeLessThanOrEqual(1e-6);}
  96  |   if(staticWires.length)verifyReceived(staticWires,staticEntries,staticRaw);
  97  |   // No static resends is valid; the mandatory original six positions still
  98  |   // supply a nonempty receiver/UDP join, and ALL interval packets are checked.
  99  |   verifyReceived(zoomed.wires,bridge!.records,bridge!.raw);
  100 |   report.cases.push({name:'Paused F07 genuine orbit+zoom',before,orbited,zoomed,staticInterval:{...staticStart,wireEnd:zoomed.wires.length,wires:staticWires,entries:staticEntries,raw:staticRaw,allPacketsCheckedAgainstFixedWorldXYZ:true},receiverInitial:initial,receiverAfter:healthy(),independentXYZ:XYZ,passed:true});
  101 |   for(const fps of [60,15,2]){
  102 |    checkpoint('movement preparation',{fps});const startScene=structuredClone(scene);startScene.pieces=startScene.pieces.filter((p:any)=>p.id==='right');await page.evaluate(s=>(window as any).__bongo.load(s),startScene);await page.locator('#fps').selectOption(String(fps));
  103 |    await expect.poll(()=>{const q=healthy();return q.objects.length===1&&distance(q.objects[0].position,XYZ.right)<1e-6;}).toBe(true);await page.waitForTimeout(130);
  104 |    const pre=await browserState(page),old=healthy().objects[0],eventStart=bridge!.records.length,rawStart=bridge!.raw.length,wireStart=pre.wires.length;expect(pre.wireError).toBe('');expect(pre.audioState).toBe('locked');
  105 |    const chosen=pre.output.clockSynchronization.reduce((best:any,x:any)=>x.uncertaintyMs<best.uncertaintyMs?x:best,{uncertaintyMs:Infinity});expect(chosen.uncertaintyMs).toBeLessThanOrEqual(10);
  106 |    const next=structuredClone(startScene);next.pieces[0].vertex=10;const empty=await emptyPoint(page);await page.mouse.move(empty.p.x,empty.p.y);await page.mouse.down();
  107 |    checkpoint('movement committed',{fps});const bracket=await page.evaluate(s=>{const b=(window as any).__bongo,before=performance.now()/1000,camera=b.view.getDiagnostics().camera;b.edit(s);return{before,after:performance.now()/1000,camera};},next);expect(bracket.after-bracket.before).toBeLessThanOrEqual(.005);
  108 |    await page.waitForTimeout(45);await page.mouse.move(empty.p.x+220,empty.p.y+35,{steps:2});await page.mouse.up();await page.waitForTimeout(220);
  109 |    const post=await browserState(page),receiver=healthy(),wires:Wire[]=post.wires.slice(wireStart);expect(post.wireError).toBe('');expect(post.scene).toEqual(next);expect(post.audioState).toBe('locked');expect(post.events).toHaveLength(0);expect(distance(post.view.camera,bracket.camera)).toBeGreaterThan(.05);expect(receiver.objects).toHaveLength(1);expect(receiver.objects[0].objectId).toBe(old.objectId);expect(receiver.objects[0].nodeId).toBe('right');expect(distance(receiver.objects[0].position,XYZ.forward)).toBeLessThanOrEqual(1e-6);
  110 |    expect(wires.length).toBeGreaterThanOrEqual(3);const inputs=await page.evaluate(()=>(window as any).__cameraWitness.inputs),gesture=inputs.find((input:any)=>input.time>=bracket.after);expect(gesture).toBeTruthy();expect(gesture.trusted).toBe(true);expect(gesture.buttons).toBe(1);const samples=wires.map(row=>{expect(row.packet.objectId).toBe(old.objectId);expect(row.packet.nodeId).toBe('right');const f=progress(row.packet.position),producerTime=row.packet.sent-chosen.offset,lo=Math.max(0,Math.min(1,(producerTime-bracket.after-.001)/.12)),hi=Math.max(0,Math.min(1,(producerTime-bracket.before+.001)/.12));expect(f).toBeGreaterThanOrEqual(lo-1e-6);expect(f).toBeLessThanOrEqual(hi+1e-6);return{...row,progress:f,allowedFraction:{lo,hi},cameraDistance:distance(row.camera,gesture.cameraBeforeControls)};});
  111 |    expect(samples.every((x,i)=>i===0||x.progress>=samples[i-1].progress-1e-8)).toBe(true);expect(samples.filter(x=>x.progress>0&&x.progress<.99&&x.before<gesture.time).length).toBeGreaterThanOrEqual(1);expect(samples.filter(x=>x.progress>0&&x.progress<.99&&x.before>=gesture.time&&x.cameraDistance>.05).length).toBeGreaterThanOrEqual(1);
  112 |    const entries=bridge!.records.slice(eventStart),raw=bridge!.raw.slice(rawStart);verifyReceived(wires,entries,raw);report.cases.push({name:'Paused manual arc during genuine orbit',fps,from:{vertex:85,xyz:XYZ.right},to:{vertex:10,xyz:XYZ.forward},sceneBefore:startScene,sceneAfter:next,editBracket:bracket,gesture,chosenSynchronization:chosen,clockScope:'Common producer offset cancels; same-browser stable monotonic/1ms timestamp premise. No continuous cross-host bound.',samples,entries,raw,receiver,passed:true});
  113 |   }
  114 |   const final=await browserState(page);verifyReceived(final.wires,bridge!.records,bridge!.raw);expect(final.wireError).toBe('');const servedAfter=await(await page.request.get(MAIN)).body();expect(servedAfter.length).toBeLessThanOrEqual(2*1024*1024);fs.writeFileSync(path.join(out,'served-main-after.js'),servedAfter,{flag:'wx'});report.servedMainAfterHash=sha(servedAfter);expect(report.servedMainAfterHash).toBe(MAIN_SHA);expect(report.browserErrorOverflow??false).toBe(false);expect(report.errors).toEqual([]);checkpoint('output disconnect');await page.locator('#bridge').click();await expect.poll(()=>bridge!.state().session).toBe('');await expect.poll(()=>(bridge!.state() as any).clock.worker?.objects??-1).toBe(0);report.scopedChecksPassed=true;
  115 |  }catch(error){report.errors.push(String(error));throw error;}
  116 |  finally{if(!page.isClosed()){try{const final=await browserState(page);report.finalBrowser=final;if(final.output.connected)await page.locator('#bridge').click();}catch(error){report.errors.push('Browser cleanup observation: '+String(error));}}}
  117 | });
  118 | 
```