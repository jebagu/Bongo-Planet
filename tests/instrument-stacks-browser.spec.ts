import {test, expect, type Page} from '@playwright/test';
import {mkdirSync, writeFileSync} from 'node:fs';
import {emptyScene, newPiece} from '../src/core/contracts';

const evidence='evidence/instrument-stacks';
const scene=(page:Page)=>page.evaluate(()=>(window as any).__bongo.scene);
const pieces=(page:Page)=>page.evaluate(()=>(window as any).__bongo.view.getProjectedPieces());
const nextSlot=(page:Page,vertex:number)=>page.evaluate(v=>(window as any).__bongo.view.getProjectedStackSlots().find((s:any)=>s.vertex===v),vertex);
async function drag(page:Page,from:{x:number;y:number},to:{x:number;y:number}) {
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:12});
}
async function paletteDrag(page:Page,instrument:string,target:{x:number;y:number}) {
  const button=page.locator(`[data-instrument="${instrument}"]`);await button.scrollIntoViewIfNeeded();
  const box=(await button.boundingBox())!;await drag(page,{x:box.x+box.width/2,y:box.y+box.height/2},target);
}
async function stackBase(page:Page) {
  return page.evaluate(()=>{
    const b=(window as any).__bongo,view=b.view;
    const direction=view.camera.position.clone().normalize();
    const slots=b.slots.filter((s:any)=>{
      const normal=view.slots[s.vertex].position.clone().normalize(),facing=normal.dot(direction);
      const top=normal.clone().multiplyScalar(1.035+.19*3*view.getAppearance().size+.13).project(view.camera);
      return s.visible&&facing>.35&&facing<.65&&Math.abs(top.x)<.94&&Math.abs(top.y)<.94&&s.y>innerHeight*.4&&s.y<innerHeight*.8;
    });
    return slots.sort((a:any,b:any)=>Math.hypot(a.x-innerWidth*.48,a.y-innerHeight*.64)-Math.hypot(b.x-innerWidth*.48,b.y-innerHeight*.64))[0];
  });
}
async function buildStack(page:Page) {
  await page.locator('[data-instrument=piano]').click();
  const slot=await stackBase(page);
  await page.mouse.click(slot.x,slot.y);
  const first=(await pieces(page))[0];await page.mouse.click(first.x,first.y);expect((await scene(page)).pieces).toHaveLength(1);
  for (const instrument of ['glass','kalimba','marimba']) {
    await paletteDrag(page,instrument,await nextSlot(page,slot.vertex));
    if(instrument==='marimba')await page.screenshot({path:`${evidence}/fourth-layer-preview.png`});
    await page.mouse.up();
  }
  await expect.poll(async()=>(await scene(page)).pieces.length).toBe(4);
  return slot.vertex;
}

test.beforeEach(async({page})=>{
  mkdirSync(evidence,{recursive:true});
  await page.goto('./');await page.waitForFunction(()=>(window as any).__bongo?.view.getDiagnostics().frames>2);
});

test('real palette drags build a spaced four-note chord and reject a fifth layer',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
  const vertex=await buildStack(page),stack=(await scene(page)).pieces;
  expect(stack.map((p:any)=>p.instrument)).toEqual(['piano','glass','kalimba','marimba']);
  expect(stack.map((p:any)=>p.degree)).toEqual([0,2,4,6]);expect(stack.every((p:any)=>p.vertex===vertex)).toBe(true);
  expect(await nextSlot(page,vertex)).toBeUndefined();
  const projected=await pieces(page);
  for(let i=1;i<4;i++)expect(Math.hypot(projected[i].x-projected[i-1].x,projected[i].y-projected[i-1].y)).toBeGreaterThan(20);
  for(const p of projected){await page.mouse.click(p.x,p.y);expect(await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().selected)).toBe(p.id);}
  await page.mouse.move(1100,900);await page.screenshot({path:`${evidence}/four-layer-chord.png`});
  await paletteDrag(page,'piano',projected[0]);await page.mouse.up();
  expect((await scene(page)).pieces).toEqual(stack);await expect(page.locator('#notice')).toContainText('4 instruments');
  await page.locator('[data-stack-piece]').last().click();await expect(page.locator('.stack-context')).toContainText('4 / 4');
  expect(errors).toEqual([]);
});

test('each layer edits, moves, cancels and deletes independently with undo',async({page})=>{
  const vertex=await buildStack(page),before=await scene(page),root=before.pieces[0];
  const second=(await pieces(page))[1];await page.mouse.click(second.x,second.y);
  await page.getByLabel('Note',{exact:true}).selectOption('3');
  expect((await scene(page)).pieces.map((p:any)=>p.degree)).toEqual([0,3,4,6]);
  const edited=await scene(page),target=await page.evaluate(v=>{
    const b=(window as any).__bongo,root=b.view.getProjectedPieces()[0];
    return b.slots.find((s:any)=>s.visible&&s.vertex!==v&&Math.hypot(s.x-root.x,s.y-root.y)>180&&s.y>250&&s.y<innerHeight-80);
  },vertex);
  await drag(page,(await pieces(page))[0],target);await page.keyboard.press('Escape');await page.mouse.up();expect(await scene(page)).toEqual(edited);
  await drag(page,(await pieces(page))[0],target);await page.mouse.up();
  expect((await scene(page)).pieces.find((p:any)=>p.id===root.id).vertex).toBe(target.vertex);
  expect((await scene(page)).pieces.filter((p:any)=>p.vertex===vertex).map((p:any)=>p.id)).toEqual(before.pieces.slice(1).map((p:any)=>p.id));
  await page.locator('#undo').click();expect(await scene(page)).toEqual(edited);
  await page.locator(`[data-stack-piece="${before.pieces[2].id}"]`).click();await page.locator('#trash').click();
  expect((await scene(page)).pieces.map((p:any)=>p.id)).toEqual(before.pieces.filter((_:any,i:number)=>i!==2).map((p:any)=>p.id));
  await page.locator('#undo').click();expect(await scene(page)).toEqual(edited);
  await page.locator('#redo').click();expect((await scene(page)).pieces).toHaveLength(3);
});

test('stacks round-trip with their order and remain selectable on a narrow reduced-motion view',async({page})=>{
  await buildStack(page);const before=await scene(page);
  await page.locator('#save').click();await page.locator('#clear').click();await page.locator('#restore').click();expect(await scene(page)).toEqual(before);
  const download=page.waitForEvent('download');await page.locator('#export-scene').click();await(await download).saveAs(`${evidence}/Bongo-Planet.json`);
  await page.locator('#clear').click();await page.locator('#file').setInputFiles(`${evidence}/Bongo-Planet.json`);expect(await scene(page)).toEqual(before);
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});
  await page.locator('#reset-view').click();await page.waitForTimeout(150);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for (const layer of await pieces(page)) {
    expect(layer.visible).toBe(true);await page.mouse.click(layer.x,layer.y);
    expect(await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().selected)).toBe(layer.id);
  }
  await page.locator('.selection-card').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${evidence}/mobile-chord.png`});
});

test('live worklet produces four distinct simultaneous voices and nonzero chord audio',async({page})=>{
  const next=emptyScene();
  next.pieces=[{...newPiece('generator',0,'source'),period:1,travel:1},...[0,2,4,6].map((degree,i)=>({...newPiece('note',1,`voice-${i}`),degree,instrument:'piano' as const,duration:1,level:.3}))];
  next.wiring=[{vertex:0,exits:[1]}];
  await page.locator('#file').setInputFiles({name:'chord.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(next))});
  await page.locator('#play').click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length),{timeout:8000}).toBeGreaterThanOrEqual(4);
  const onsets=await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').slice(0,4).map((e:any)=>e.trigger));
  expect(new Set(onsets.map((t:any)=>t.onset)).size).toBe(1);expect(new Set(onsets.map((t:any)=>t.nodeId)).size).toBe(4);
  const peak=await page.evaluate(async()=>{
    const audio=(window as any).__bongo.audio,analyser=audio.context.createAnalyser();analyser.fftSize=4096;audio.node.connect(analyser);
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    const pcm=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(pcm);audio.node.disconnect(analyser);return Math.max(...pcm.map(Math.abs));
  });
  expect(peak).toBeGreaterThan(.0001);
  await page.locator('#play').click();await expect.poll(()=>page.evaluate(()=>(window as any).__bongo.status.activeVoices)).toBe(0);
  writeFileSync(`${evidence}/live-audio.json`,JSON.stringify({onsets,peak,scope:'Live browser worklet output; physical listening not claimed'},null,2));
});

test('touch can add a layer on the elevated glow while a body tap still selects',async({browser})=>{
  const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  const page=await context.newPage();
  try {
    await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo?.slots.length===92);
    await page.locator('[data-instrument=piano]').click();
    const slot=await page.evaluate(()=>{
      const b=(window as any).__bongo,direction=b.view.camera.position.clone().normalize();
      return b.slots.filter((s:any)=>{const facing=b.view.slots[s.vertex].position.clone().normalize().dot(direction);return s.visible&&facing>.35&&facing<.65;}).sort((a:any,b:any)=>Math.hypot(a.x-innerWidth*.3,a.y-innerHeight*.82)-Math.hypot(b.x-innerWidth*.3,b.y-innerHeight*.82))[0];
    });
    await page.touchscreen.tap(slot.x,slot.y);expect((await scene(page)).pieces).toHaveLength(1);
    const root=(await pieces(page))[0];await page.touchscreen.tap(root.x,root.y);expect((await scene(page)).pieces).toHaveLength(1);
    const glow=await nextSlot(page,slot.vertex);await page.touchscreen.tap(glow.x,glow.y);expect((await scene(page)).pieces).toHaveLength(2);
    const updated=(await pieces(page))[0];await page.touchscreen.tap(updated.x,updated.y);expect((await scene(page)).pieces).toHaveLength(2);
    expect(await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().selected)).toBe(root.id);
  } finally {await context.close();}
});

test('stack positions and cylinder axes remain perpendicular to the planet as the camera turns',async({page})=>{
  const vertex=await buildStack(page);
  await page.keyboard.press('Escape');
  const inspect=()=>page.evaluate(v=>{
    const b=(window as any).__bongo,view=b.view,normal=view.slots[v].position.clone().normalize();
    return b.scene.pieces.map((p:any)=>{
      const position=view.pieces.get(p.id).group.position.clone();
      return {id:p.id,point:position.toArray(),radius:position.length(),offAxis:position.clone().cross(normal).length()};
    });
  },vertex);
  const before=await inspect();
  const size=await page.evaluate(()=>(window as any).__bongo.view.getAppearance().size);
  for(let i=0;i<4;i++){expect(before[i].offAxis).toBeLessThan(1e-10);if(i)expect(before[i].radius-before[i-1].radius).toBeCloseTo(.19*size,7);}
  await page.evaluate(()=>{
    const view=(window as any).__bongo.view;view.camera.position.applyAxisAngle(view.camera.up,.7);view.camera.lookAt(0,0,0);view.camera.updateMatrixWorld();
  });
  await page.waitForTimeout(100);expect(await inspect()).toEqual(before);
});

test('hover without a palette tool reveals four cylinder slots and leaves the scene untouched',async({page})=>{
  await page.locator('[data-instrument=piano]').click();
  const slot=await stackBase(page);
  await page.mouse.click(slot.x,slot.y);await page.keyboard.press('Escape');
  const before=await scene(page),piece=(await pieces(page))[0];
  await page.mouse.move(piece.x,piece.y);
  await expect.poll(()=>page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().stackGuide)).toMatchObject({visible:true,vertex:slot.vertex,occupied:1,slots:4,nextLayer:null});
  const normalError=await page.evaluate(()=>{
    const view=(window as any).__bongo.view,guide=view.stackGuide,normal=view.slots[guide.vertex].position.clone().normalize();
    const axis=normal.clone().set(0,0,1).applyQuaternion(guide.quaternion);
    return axis.distanceTo(normal);
  });
  expect(normalError).toBeLessThan(1e-10);expect(await scene(page)).toEqual(before);
  await page.screenshot({path:`${evidence}/cylinder-hover.png`});
  await page.mouse.move(100,100);
  await expect.poll(()=>page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().stackGuide.visible)).toBe(false);
});
