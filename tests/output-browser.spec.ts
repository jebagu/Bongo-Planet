import {loadFixture,clearPlanet,connectOutput,disconnectOutput,renderFPS,appScene} from './browser-support';
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { topology } from '../src/core/geometry';

const state = async () => (await fetch('http://127.0.0.1:5418/state')).json() as Promise<any>;
const percentile = (values: number[], p: number) => [...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))] ?? 0;
const fixture = (id:string) => JSON.parse(fs.readFileSync(`public/fixtures/${id}.json`,'utf8'));
async function connect(page:Page) {
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');
  await page.waitForFunction(()=>(window as any).__bongo);
   await connectOutput(page);
  await expect.poll(async()=>page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(true);
  await expect.poll(async()=>page.evaluate(()=>(window as any).__bongo.output.uncertaintyMs)).toBeLessThanOrEqual(10);
}
test.afterEach(async({page})=>{if(!page.isClosed())await page.evaluate(()=>{(window as any).__probe?.adapter.dispose();if((window as any).__bongo?.output.connected)(window as any).__bongo.outputAdapter.disconnect();});});

async function sourceProbe(page:Page,scene:any){
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);
  const response=await page.request.get('/BongoPlanet/src/output/OutputAdapter.ts');
  test.skip(!response.headers()['content-type']?.includes('javascript'),'Actual adapter regression requires Vite source-module serving.');
  await page.evaluate(async scene=>{const url='/BongoPlanet/src/output/OutputAdapter.ts';const {OutputAdapter}=await import(url);const adapter=new OutputAdapter(()=>performance.now()/1000),statuses:string[]=[];adapter.onStatus=(text:string)=>statuses.push(text);adapter.setScene(scene,'load');adapter.connect();(window as any).__probe={adapter,statuses};},scene);
  await page.waitForFunction(()=>(window as any).__probe.adapter.diagnostics.connected&&Number.isFinite((window as any).__probe.adapter.diagnostics.uncertaintyMs));
  await expect.poll(async()=>(await state()).objects.length).toBe(scene.pieces.filter((p:any)=>p.kind!=='generator').length);
}

test('locked-audio edits remove remote objects and readd the same ID',async({page})=>{
  await connect(page);const original=fixture('F07');await page.evaluate(s=>(window as any).__bongo.load(s),original);
  await expect.poll(async()=>(await state()).objects.length).toBe(6);
  expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('locked');
  const before=await state(),originalObject=before.objects.find((o:any)=>o.nodeId==='right');
  const deleted=structuredClone(original);deleted.pieces=deleted.pieces.filter((p:any)=>p.id!=='right');
  await page.evaluate(s=>(window as any).__bongo.edit(s),deleted);
  await expect.poll(async()=>(await state()).objects.map((o:any)=>o.nodeId).sort()).toEqual(deleted.pieces.map((p:any)=>p.id).sort());
  const afterDelete=await state();expect(afterDelete.objects).toHaveLength(5);expect(afterDelete.session).toBe(before.session);
  await page.evaluate(s=>(window as any).__bongo.edit(s),original);
  await expect.poll(async()=>(await state()).objects.length).toBe(6);
  const afterReadd=await state(),restored=afterReadd.objects.find((o:any)=>o.nodeId==='right');expect(restored.objectId).toBe(originalObject.objectId);expect(restored.position).toEqual(topology.vertices[85]);
  expect(afterReadd.drops).toBe(before.drops);expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('locked');
  fs.writeFileSync('evidence/step-09/locked-edit-regression.json',JSON.stringify({date:new Date().toISOString(),before,afterDelete,afterReadd,audioStayedLocked:true},null,2)+'\n');
});

test('delayed cancel resends retained positions without resurrecting removed nodes @source-adapter',async({page})=>{
  const original=fixture('F01');await sourceProbe(page,original);const before=await state(),far=before.objects.find((o:any)=>o.nodeId==='far'),cutoff=Math.max(...before.events.map((e:any)=>e.time));
  const edited=structuredClone(original);edited.pieces=edited.pieces.filter((p:any)=>p.id!=='near');
  await page.evaluate(s=>(window as any).__probe.adapter.setScene(s,'edit'),edited);
  const retained=edited.pieces.filter((p:any)=>p.kind!=='generator').map((p:any)=>p.id).sort();
  await expect.poll(async()=>(await state()).objects.map((o:any)=>o.nodeId).sort()).toEqual(retained);
  await page.evaluate(()=>(window as any).__probe.adapter.event({type:'cancel',ids:[],nodeIds:['near','far'],reason:'delayed engine cancellation'}));
  await expect.poll(async()=>(await state()).events.filter((e:any)=>e.type==='position'&&e.nodeId==='far'&&e.time>cutoff).length).toBeGreaterThan(0);
  const after=await state();expect(after.objects.map((o:any)=>o.nodeId).sort()).toEqual(retained);expect(after.objects.find((o:any)=>o.nodeId==='far')).toMatchObject({objectId:far.objectId,position:far.position});
  expect(after.drops).toBe(before.drops);expect(after.events.filter((e:any)=>e.type==='position'&&e.nodeId==='near'&&e.time>cutoff)).toHaveLength(0);
  const raw=after.rawOSC.filter((r:any)=>r.objectId===far.objectId).at(-1);for(let i=0;i<3;i++)expect(raw.position[i]).toBeCloseTo(far.position[i],6);
  fs.writeFileSync('evidence/step-09/delayed-cancel-regression.json',JSON.stringify({date:new Date().toISOString(),before,after},null,2)+'\n');
});

test('same-ID Note to Beat edit cancels old work and precedes the next trigger with position @source-adapter',async({page})=>{
  const original=fixture('F01'),prefix=randomUUID(),oldId=`${prefix}-1`,newId=`${prefix}-2`;await sourceProbe(page,original);
  await page.evaluate(id=>{const now=performance.now()/1000;(window as any).__probe.adapter.event({type:'trigger',trigger:{session:'same-id-regression',sequence:1,id,generatorId:'gen',nodeId:'near',emission:now,beat:0,onset:now+5,angle:0,position:[0,0,1],sound:{kind:'note',frequency:440,timbre:'sine',duration:.2,level:.1}}});},oldId);
  await expect.poll(async()=>(await state()).events.some((e:any)=>e.type==='queued'&&e.id===oldId)).toBe(true);
  const before=await state(),near=before.objects.find((o:any)=>o.nodeId==='near'),cutoff=Math.max(...before.events.map((e:any)=>e.time));
  const changed=structuredClone(original);changed.pieces=changed.pieces.map((p:any)=>p.id==='near'?{id:p.id,vertex:p.vertex,kind:'beat',sound:'hat',duration:.2,level:.1}:p);
  await page.evaluate(({scene,oldId,newId})=>{const adapter=(window as any).__probe.adapter;adapter.setScene(scene,'edit');adapter.event({type:'cancel',ids:[oldId],nodeIds:['near'],reason:'kind changed'});const now=performance.now()/1000;adapter.event({type:'trigger',trigger:{session:'same-id-regression',sequence:2,id:newId,generatorId:'gen',nodeId:'near',emission:now,beat:0,onset:now+.4,angle:0,position:[0,0,1],sound:{kind:'beat',sound:'hat',duration:.2,level:.1}}});},{scene:changed,oldId,newId});
  await expect.poll(async()=>(await state()).events.filter((e:any)=>e.type==='onset'&&e.id===newId).length,{timeout:4000}).toBe(1);
  const after=await state(),rows=after.events.filter((e:any)=>e.time>cutoff),cancelIndex=rows.findIndex((e:any)=>e.type==='cancel'&&e.id===oldId),positionIndex=rows.findIndex((e:any)=>e.type==='position'&&e.nodeId==='near'),queuedIndex=rows.findIndex((e:any)=>e.type==='queued'&&e.id===newId);
  expect(cancelIndex).toBeGreaterThanOrEqual(0);expect(positionIndex).toBeGreaterThan(cancelIndex);expect(queuedIndex).toBeGreaterThan(positionIndex);expect(rows.some((e:any)=>e.type==='onset'&&e.id===oldId)).toBe(false);expect(after.drops).toBe(before.drops);
  expect(after.objects.find((o:any)=>o.nodeId==='near')).toMatchObject({objectId:near.objectId,position:near.position});expect(rows.find((e:any)=>e.type==='onset'&&e.id===newId)).toMatchObject({objectId:near.objectId,nodeId:'near',position:near.position});
  fs.writeFileSync('evidence/step-09/same-id-kind-regression.json',JSON.stringify({date:new Date().toISOString(),before,after,actualOrdering:{cancelIndex,positionIndex,queuedIndex}},null,2)+'\n');
});

test('live paused F07 objects, exact XYZ, decoded OSC and camera-independent stable IDs',async({page})=>{
  await connect(page); await page.evaluate(s=>(window as any).__bongo.load(s),fixture('F07'));
  await expect.poll(async()=>(await state()).objects.length).toBe(6);
  const before=await state();
  expect(await page.evaluate(()=>(window as any).__bongo.status?.running??false)).toBe(false);
  for(const piece of fixture('F07').pieces){const object=before.objects.find((p:any)=>p.nodeId===piece.id);expect(object.position).toEqual(topology.vertices[piece.vertex]);const raw=before.rawOSC.filter((raw:any)=>raw.objectId===object.objectId).at(-1);expect(raw.address).toBe(`/adm/obj/${object.objectId}/xyz`);for(let i=0;i<3;i++)expect(raw.position[i]).toBeCloseTo(topology.vertices[piece.vertex][i],6);}
  const canvas=await page.locator('canvas').boundingBox();expect(canvas).toBeTruthy();
  await page.mouse.move(canvas!.x+15,canvas!.y+canvas!.height/2);await page.mouse.down();await page.mouse.move(canvas!.x+canvas!.width-20,canvas!.y+canvas!.height/2,{steps:20});await page.mouse.up();await page.waitForTimeout(200);
  expect((await state()).objects.map((o:any)=>({id:o.objectId,nodeId:o.nodeId,position:o.position}))).toEqual(before.objects.map((o:any)=>({id:o.objectId,nodeId:o.nodeId,position:o.position})));
  const receiver=await page.context().newPage();await receiver.goto('http://127.0.0.1:5418/receiver');await expect(receiver.locator('#positions')).toContainText('right');await receiver.screenshot({path:'evidence/step-09/paused-F07-receiver.png'});await receiver.close();
});

test('actual source relocation traces remain timely at 60, 15 and 2 render FPS',async({page})=>{
  await connect(page);const traces=[];
  for(const fps of [60,15,2]){
    await page.evaluate(s=>(window as any).__bongo.load(s),fixture('F07'));
    await expect.poll(async()=>{const s=await state();return s.objects.length===6&&fixture('F07').pieces.every((p:any)=>JSON.stringify(s.objects.find((o:any)=>o.nodeId===p.id)?.position)===JSON.stringify(topology.vertices[p.vertex]));}).toBe(true);
    await renderFPS(page,fps);
     // collapse the inline tray before reading screen coordinates
    await page.locator('canvas').scrollIntoViewIfNeeded();
    const scene=fixture('F07');const slots=await page.evaluate(()=>(window as any).__bongo.slots);
    const piece=scene.pieces.find((p:any)=>slots[p.vertex].visible&&slots[p.vertex].y>150&&slots[p.vertex].y<750);
    expect(piece).toBeTruthy();const from=slots[piece.vertex];const target=slots.find((p:any)=>p.visible&&!scene.pieces.some((x:any)=>x.vertex===p.vertex)&&Math.hypot(p.x-from.x,p.y-from.y)>80);
    const before=await state();const object=before.objects.find((o:any)=>o.nodeId===piece.id);const cutoff=Math.max(...before.events.map((e:any)=>e.time));
    await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:12});await page.mouse.up();await page.waitForTimeout(240);
    const result=await state();const entries=result.events.filter((e:any)=>e.type==='position'&&e.nodeId===piece.id&&e.time>cutoff);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    const final=result.objects.find((o:any)=>o.nodeId===piece.id);expect(final.objectId).toBe(object.objectId);expect(final.position).toEqual(topology.vertices[target.vertex]);
    const decoded=result.rawOSC.filter((raw:any)=>raw.objectId===object.objectId).at(-1);for(let i=0;i<3;i++)expect(decoded.position[i]).toBeCloseTo(topology.vertices[target.vertex][i],6);
    const ages=entries.map((e:any)=>e.ageMs);expect(percentile(ages,.95)).toBeLessThanOrEqual(40);expect(Math.max(...ages)).toBeLessThanOrEqual(60);
    const progress=entries.map((e:any)=>Math.acos(Math.max(-1,Math.min(1,e.position.reduce((s:number,v:number,i:number)=>s+v*topology.vertices[piece.vertex][i],0)))));
    expect(progress.every((value:number,i:number)=>i===0||value>=progress[i-1]-1e-8)).toBe(true);
    traces.push({fps,nodeId:piece.id,objectId:object.objectId,fromVertex:piece.vertex,toVertex:target.vertex,p95AgeMs:percentile(ages,.95),maxAgeMs:Math.max(...ages),entries});
  }
  fs.writeFileSync('evidence/step-09/movement-traces.json',JSON.stringify({date:new Date().toISOString(),actualReceiverPositions:true,traces},null,2)+'\n');
});

test('real socket backpressure and coalesced position updates @source-adapter',async({page})=>{
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);
  const moduleResponse=await page.request.get('/BongoPlanet/src/output/OutputAdapter.ts');
  test.skip(!moduleResponse.headers()['content-type']?.includes('javascript'),'This separate adapter stress test requires Vite source serving, not the immutable production receipt bundle.');
  await page.evaluate(async scene=>{
    const url='/BongoPlanet/src/output/OutputAdapter.ts';const {OutputAdapter}=await import(url);
    const adapter=new OutputAdapter(()=>performance.now()/1000);const statuses:string[]=[];adapter.onStatus=(s:string)=>statuses.push(s);adapter.setScene(scene,'load');adapter.connect();(window as any).__probe={adapter,statuses};
  },fixture('F01'));
  await page.waitForFunction(()=>(window as any).__probe.adapter.diagnostics.connected&&Number.isFinite((window as any).__probe.adapter.diagnostics.uncertaintyMs));await expect.poll(async()=>(await state()).objects.length).toBe(3);
  const baseline=await state(),cutoff=Math.max(...baseline.events.map((e:any)=>e.time));
  await page.evaluate(scene=>{for(let i=0;i<1000;i++){scene.pieces.find((p:any)=>p.id==='near').vertex=i%2?7:5;(window as any).__probe.adapter.setScene(scene,'edit');}},fixture('F01'));
  await page.waitForTimeout(180);const coalesced=(await state()).events.filter((e:any)=>e.type==='position'&&e.nodeId==='near'&&e.time>cutoff);expect(coalesced.length).toBeGreaterThan(0);expect(coalesced.length).toBeLessThan(50);expect((await state()).objects.find((o:any)=>o.nodeId==='near').position).toEqual(topology.vertices[7]);
  const traffic=await page.evaluate(()=>{
    const probe=(window as any).__probe,adapter=probe.adapter;const onset=performance.now()/1000+10;let maxBuffered=0,sent=0;
    for(let i=0;i<10000&&adapter.diagnostics.connected;i++){
      adapter.event({type:'trigger',trigger:{session:'actual-backpressure-probe',sequence:i+1,id:`pressure-${i+1}`,generatorId:'gen',nodeId:'near',emission:performance.now()/1000,beat:0,onset,angle:0,position:[0,0,1],sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.1}}});
      maxBuffered=Math.max(maxBuffered,adapter.diagnostics.buffered);sent++;
    }
    return {maxBuffered,sent,statuses:probe.statuses};
  });
  await expect.poll(async()=>(await state()).session).toBe('');const released=await state();expect(released.pending).toBe(0);expect(released.activeVoices).toBe(0);expect(released.drops).toBe(baseline.drops);expect(traffic.maxBuffered).toBeGreaterThan(65536);expect(traffic.statuses.some((s:string)=>s.includes('control backpressure'))).toBe(true);
  fs.writeFileSync('evidence/step-09/backpressure.json',JSON.stringify({date:new Date().toISOString(),actualSocketBuffer:true,submittedPositionEdits:1000,actualPositionReceipts:coalesced,traffic,initialReceiverDrops:baseline.drops,additionalReceiverDrops:released.drops-baseline.drops,actualReleaseState:released},null,2)+'\n');
  await page.evaluate(()=>(window as any).__probe.adapter.dispose());
});

test('disconnect, Clear and page reload release actual receiver sessions',async({page})=>{
  await connect(page);await page.evaluate(s=>(window as any).__bongo.load(s),fixture('F01'));const beforePlay=await state(),cutoff=Math.max(...beforePlay.events.map((e:any)=>e.time));await page.locator('#play').click();await expect.poll(async()=>(await state()).events.filter((e:any)=>e.type==='onset'&&e.time>cutoff).length,{timeout:6000}).toBeGreaterThan(0);
  await connectOutput(page);await expect.poll(async()=>(await state()).session).toBe('');expect((await state()).pending).toBe(0);expect((await state()).activeVoices).toBe(0);
  await connectOutput(page);await expect.poll(async()=>page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(true);await clearPlanet(page);await expect.poll(async()=>(await state()).objects.length).toBe(0);expect((await state()).pending).toBe(0);expect((await state()).activeVoices).toBe(0);
  await page.evaluate(s=>(window as any).__bongo.load(s),fixture('F07'));await expect.poll(async()=>(await state()).objects.length).toBe(6);await page.reload();await expect.poll(async()=>(await state()).session).toBe('');expect((await state()).objects).toHaveLength(0);expect((await state()).pending).toBe(0);expect((await state()).activeVoices).toBe(0);
});
