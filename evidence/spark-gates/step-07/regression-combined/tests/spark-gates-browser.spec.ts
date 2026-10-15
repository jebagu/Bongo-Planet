import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {gatedExample} from '../src/core/gatedExamples';
import { topology } from '../src/core/geometry';
const DEFAULT_SWITCH_LOOK=JSON.parse(readFileSync(new URL('../assets/geometric-toys/theme.json',import.meta.url),'utf8')).switches;
const root='evidence/spark-gates';
const scene=(p:Page)=>p.evaluate(()=>(window as any).__bongo.scene);
const status=(p:Page)=>p.evaluate(()=>(window as any).__bongo.status);
const gates=(p:Page)=>p.evaluate(()=>(window as any).__bongo.gates);
async function fixture(p:Page,id='F15'){await p.locator('#fixture').selectOption(id);await expect.poll(async()=>(await scene(p)).pieces[0]?.id).toBe('gate-source');}
async function select(p:Page,vertex:number){const slot=await p.evaluate(v=>(window as any).__bongo.slots[v],vertex);expect(slot.visible).toBe(true);await p.mouse.click(slot.x,slot.y);}
async function clickGate(p:Page,vertex:number,exit:number){const gate=(await gates(p)).find((g:any)=>g.vertex===vertex&&g.exit===exit&&g.visible);expect(gate).toBeTruthy();await p.mouse.click(gate.x,gate.y);}
const failures=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{mkdirSync(root,{recursive:true});const errors:string[]=[];failures.set(page,errors);page.on('pageerror',error=>errors.push(String(error)));await page.goto('./');await page.waitForFunction(()=>(window as any).__bongo?.view.getDiagnostics().frames>2);});
test.afterEach(async({page},info)=>{expect(failures.get(page)).toEqual([]);const video=page.video();await page.close();if(info.status==='passed')await video?.saveAs(`${root}/step-04/${info.title.replace(/[^a-z0-9]+/gi,'-').slice(0,110)}.webm`);});

test('SG-S04-A01 canvas exits alter actual sink continuation and fork sounds',async({page})=>{
 await fixture(page);await select(page,46);
 const before=await scene(page),exit=(await gates(page)).find((g:any)=>g.vertex===46&&g.exit===47);expect(exit.visible).toBe(true);
 await page.mouse.click(exit.x,exit.y);expect((await scene(page)).wiring.find((w:any)=>w.vertex===46).exits).toEqual([]);expect((await scene(page)).pieces).toEqual(before.pieces);
 await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.gatedArrivals).toBe(1);await page.locator('#play').click();
 expect(await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').map((e:any)=>e.trigger.nodeId))).toEqual(['gate-note-0']);
 await fixture(page);await clickGate(page,46,44);
 expect((await scene(page)).wiring.find((w:any)=>w.vertex===46).exits).toEqual([44,47]);
 await page.locator('#play').click();await expect.poll(async()=>await page.evaluate(()=>(window as any).__bongo.events.some((e:any)=>e.type==='edge-stop'&&e.reason==='split'))).toBe(true);await page.locator('#play').click();
 await page.screenshot({path:`${root}/step-04/front.png`});writeFileSync(`${root}/step-04/edited-circuit.json`,JSON.stringify(await scene(page),null,2));
});
test('SG-S04-A03 gate gesture cancellation Escape focus loss and dragging preserve scene',async({page})=>{
 await fixture(page);await select(page,46);const exit=(await gates(page)).find((g:any)=>g.vertex===46&&g.exit===47),original=await scene(page);
 for(const action of ['drag','escape','cancel','blur','competing']){await page.mouse.move(exit.x,exit.y);await page.mouse.down();if(action==='drag')await page.mouse.move(exit.x+30,exit.y+30,{steps:5});if(action==='escape')await page.keyboard.press('Escape');if(action==='cancel')await page.locator('#sphere canvas').dispatchEvent('pointercancel',{pointerId:1,isPrimary:true});if(action==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));if(action==='competing')await page.locator('#sphere canvas').dispatchEvent('pointerdown',{pointerId:8,isPrimary:false,clientX:exit.x,clientY:exit.y});await page.mouse.up();expect(await scene(page)).toEqual(original);}
});
test('SG-S04 locked audio still updates the flat gate state immediately',async({page})=>{
 await fixture(page);expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('locked');
 const counts=()=>page.evaluate(()=>(window as any).__bongo.view.gates.children.map((m:any)=>m.count));
 const before=await counts();await clickGate(page,46,47);await expect.poll(counts).not.toEqual(before);
 expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('locked');await page.screenshot({path:`${root}/step-04/locked-switch.png`});
});
test('SG-S04-A02 moving deleting and history leave strut wiring at its original vertices',async({page})=>{
 await fixture(page);await select(page,46);const before=await scene(page),empty=await page.evaluate(()=>(window as any).__bongo.slots.find((s:any)=>s.visible&&!(window as any).__bongo.scene.pieces.some((p:any)=>p.vertex===s.vertex)));
 // Explicit Move owns the destination tap.
 await page.locator('#move-piece').click();await page.mouse.click(empty.x,empty.y);expect((await scene(page)).wiring).toEqual(before.wiring);expect((await scene(page)).pieces.find((p:any)=>p.id==='gate-note-0').vertex).toBe(empty.vertex);
 await page.locator('#undo').click();expect((await scene(page)).wiring).toEqual(before.wiring);expect((await scene(page)).pieces.find((p:any)=>p.id==='gate-note-0').vertex).toBe(46);
 await select(page,46);await page.locator('#trash').click();expect((await scene(page)).wiring).toEqual(before.wiring);await page.locator('#undo').click();
 await select(page,44);await page.locator('#move-piece').click();await page.mouse.click(empty.x,empty.y);expect((await scene(page)).wiring).toEqual(before.wiring);
});
test('SG-S04-A05 keyboard toggles on-sphere gates without an instrument panel',async({page})=>{
 const canvas=page.locator('#sphere canvas');await canvas.focus();await page.keyboard.press('ArrowRight');
 const id=await page.evaluate(()=>(window as any).__bongo.view.keyboardGate);expect(id).toBeTruthy();
 const [vertex,exit]=id.split('>').map(Number);await page.keyboard.press('Enter');
 expect((await scene(page)).wiring.find((w:any)=>w.vertex===vertex).exits).toEqual([exit]);
 await page.keyboard.press('Space');expect((await scene(page)).wiring.find((w:any)=>w.vertex===vertex).exits).toEqual([]);
 expect((await status(page))?.running??false).toBe(false);await expect(page.locator('.outgoing-sparks,.gate-exits')).toHaveCount(0);
 await page.locator('#undo').click();expect((await scene(page)).wiring.find((w:any)=>w.vertex===vertex).exits).toEqual([exit]);
});
test('SG-S05 five gate icons and three spark styles preserve routing and playback',async({page})=>{
 await fixture(page,'F17');await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.running).toBe(true);
 const composition=await scene(page),revision=(await status(page)).editRevision;await page.locator('#edit-look').click();
 for(const icon of ['arrow','chevron','triangle','bolt','comet']){
  await page.locator(`[data-gate-icon=${icon}]`).click();expect(await page.evaluate(()=>(window as any).__bongo.look.get().switches.icon)).toBe(icon);
  await page.screenshot({path:`${root}/step-05/${icon}-front.png`});
 }
 for(const style of ['ember','white','lightning']){
  await page.locator(`[data-spark-style=${style}]`).click();expect(await page.evaluate(()=>(window as any).__bongo.look.get().sparkStyle)).toBe(style);
  await expect.poll(async()=>await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().sparks.visible)).toBeGreaterThan(0);
  await page.screenshot({path:`${root}/step-05/spark-${style}.png`});
 }
 expect(await scene(page)).toEqual(composition);expect((await status(page)).running).toBe(true);expect((await status(page)).editRevision).toBe(revision);
 await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.palette #look-editor')).toBeVisible();
 await page.locator('#close-look').click();await page.locator('#play').click();
});
test('SG-S05-A04 fifty icon cycles keep bounded geometry and static shapes with reduced motion',async({page})=>{
 await fixture(page);const before=await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics());
 await page.evaluate(()=>{const b=(window as any).__bongo;for(let i=0;i<50;i++)b.look.set({...b.look.get(),switches:{...b.look.get().switches,icon:['arrow','chevron','triangle','bolt','comet'][i%5]}});});
 await page.waitForTimeout(250);const after=await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics());
 expect(after.geometries).toBe(before.geometries);expect(after.switches.geometries).toBe(2);expect(after.switches.materials).toBe(2);expect(after.switches.marks).toBe(540);
 await page.emulateMedia({reducedMotion:'reduce'});await page.screenshot({path:`${root}/step-05/zero-glow-reduced-motion.png`});
 writeFileSync(`${root}/step-05/resources.json`,JSON.stringify({before,after},null,2));
});
test('SG-S06-A01 travel 1 3 8 93 Infinite and invalid values use inspector budgets',async({page})=>{
 await fixture(page);await select(page,44);
 for(const value of [1,3,8,93]){const field=page.getByRole('spinbutton',{name:'Spark travel',exact:true});await field.fill(String(value));await field.dispatchEvent('change');expect((await scene(page)).pieces[0].travel).toBe(value);await page.screenshot({path:`${root}/step-06/travel-${value}.png`});}
 await page.getByLabel('Infinite travel', {exact:true}).check();expect((await scene(page)).pieces[0].travel).toBe('infinite');await expect(page.getByRole('spinbutton',{name:'Spark travel'})).toBeDisabled();await page.screenshot({path:`${root}/step-06/travel-infinite.png`});await page.getByLabel('Infinite travel',{exact:true}).uncheck();
 for(const value of ['0','-1','2.5','9007199254740992']){const previous=await scene(page),field=page.getByRole('spinbutton',{name:'Spark travel',exact:true});await field.fill(value);await field.dispatchEvent('change');expect(await scene(page)).toEqual(previous);}
 expect(await page.locator('.selection-card').innerText()).not.toMatch(/Spark travel\s*\d+%/);
});
test('SG-S06-A03 a repeated native numeric key gesture makes one Undo entry',async({page})=>{await fixture(page);await select(page,44);const before=await scene(page);await page.getByRole('spinbutton',{name:'Spark travel',exact:true}).focus();await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowUp');await page.keyboard.up('ArrowUp');expect((await scene(page)).pieces[0].travel).toBe(6);await page.locator('#undo').click();expect(await scene(page)).toEqual(before);await page.locator('#redo').click();expect((await scene(page)).pieces[0].travel).toBe(6);});
test('SG-S06-A02 save export import reload and conversion Undo preserve independent formats',async({page})=>{
 await fixture(page);await select(page,44);await page.getByLabel('Infinite travel',{exact:true}).check();const saved=await scene(page);await page.locator('#save').click();const download=page.waitForEvent('download');await page.locator('#export-scene').click();await(await download).saveAs(`${root}/step-06/exported-gated-scene.json`);
 await page.locator('#fixture').selectOption('F00');await expect.poll(async()=>(await scene(page)).pieces.length).toBe(0);await page.locator('#restore').click();expect(await scene(page)).toEqual(saved);expect((await status(page))?.running??false).toBe(false);
 await page.reload();await page.waitForFunction(()=>(window as any).__bongo);await page.locator('#restore').click();expect(await scene(page)).toEqual(saved);
 await page.locator('#fixture').selectOption('F11');await expect.poll(async()=>(await scene(page)).version).toBe(1);const original=await scene(page);const gate=(await gates(page)).find((g:any)=>g.visible);await page.mouse.click(gate.x,gate.y);await expect(page.getByRole('dialog')).toHaveCount(0);expect((await scene(page)).version).toBe(2);expect((await scene(page)).pieces.map((p:any)=>p.id)).toEqual(original.pieces.map((p:any)=>p.id));await page.locator('#undo').click();expect(await scene(page)).toEqual(original);expect((await status(page))?.running??false).toBe(false);
 await page.locator('#file').setInputFiles({name:'bad-v2.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...saved,wiring:[{vertex:44,exits:[44]}]}))});await expect(page.locator('#notice')).toContainText('Import failed');expect(await scene(page)).toEqual(original);
});
test('SG-S04-A04 arbitrary rotation hides rear hit targets and narrow layouts keep inspector usable',async({page})=>{
 await fixture(page);await select(page,46);await page.evaluate(()=>{const b=(window as any).__bongo;b.view.camera.position.negate();b.view.camera.up.negate();b.view.camera.lookAt(0,0,0);b.view.camera.updateMatrixWorld();});await page.waitForTimeout(100);expect((await gates(page)).filter((g:any)=>g.vertex===46&&g.visible)).toHaveLength(0);const before=await scene(page),rear=(await gates(page)).find((g:any)=>g.vertex===46&&g.exit===47);await page.mouse.click(rear.x,rear.y);expect((await scene(page)).wiring.find((w:any)=>w.vertex===46)).toEqual(before.wiring.find((w:any)=>w.vertex===46));await page.screenshot({path:`${root}/step-04/rear.png`});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('#junction-picker').selectOption('46');await expect(page.locator('#selection-title')).toContainText('Piano');await page.screenshot({path:`${root}/step-04/narrow.png`,fullPage:true});
});
test('SG-S03-A06 local native receiver gets future triggers preceding positions cancellation and stop',async({page})=>{
 await fixture(page);const baseline=(await(await page.request.get('http://127.0.0.1:5418/state')).json()).drops;await page.evaluate(()=>(window as any).__bongo.outputAdapter.connect());await expect.poll(async()=>await page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(true);await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.gatedArrivals).toBeGreaterThanOrEqual(3);const playing=await(await page.request.get('http://127.0.0.1:5418/state')).json();expect(playing.drops).toBe(baseline);expect(playing.events.some((e:any)=>e.type==='queued'&&e.queueLeadMs>0)).toBe(true);expect(playing.events.some((e:any)=>e.type==='position')).toBe(true);expect(playing.events.some((e:any)=>e.type==='onset')).toBe(true);
 await page.locator('#play').click();await page.waitForTimeout(150);const stopped=await(await page.request.get('http://127.0.0.1:5418/state')).json();expect(stopped.pending).toBe(0);expect(stopped.events.some((e:any)=>e.type==='stop'&&e.reason==='pause')).toBe(true);writeFileSync(`${root}/step-03/receiver.json`,JSON.stringify({playing,stopped},null,2));await page.evaluate(()=>(window as any).__bongo.outputAdapter.disconnect());
});
test('SG-S07-A02 live event timing matches at 60 15 and 2 render FPS',async({page})=>{
 const traces:any[]=[];for(const fps of [60,15,2]){await fixture(page);await page.evaluate(f=>(window as any).__bongo.view.setFPS(f),fps);await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.gatedArrivals).toBe(3);await page.locator('#play').click();traces.push(await page.evaluate(()=>{const e=(window as any).__bongo.events;const last=e.filter((e:any)=>e.type==='emission').at(-1);return e.filter((e:any)=>e.type==='onset'&&e.trigger.emission===last.time).map((e:any)=>[e.trigger.nodeId,Number((e.trigger.onset-last.time).toFixed(8))]);}));}expect(traces[1]).toEqual(traces[0]);expect(traces[2]).toEqual(traces[0]);writeFileSync(`${root}/step-07/fps-timelines.json`,JSON.stringify(traces,null,2));
});
test('SG-S04 touch emulation edits a selected gate without placing or moving instruments',async({browser})=>{
 const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}}),page=await context.newPage();try{await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);await fixture(page);await page.locator('#sphere').scrollIntoViewIfNeeded();const slot=await page.evaluate(()=>(window as any).__bongo.slots[46]);await page.touchscreen.tap(slot.x,slot.y);const exit=(await gates(page)).find((g:any)=>g.vertex===46&&g.exit===47&&g.visible),before=await scene(page);expect(exit).toBeTruthy();await page.touchscreen.tap(exit.x,exit.y);const after=await scene(page);expect(after.pieces).toEqual(before.pieces);expect(after.wiring.find((w:any)=>w.vertex===46).exits).toEqual([]);await page.screenshot({path:`${root}/step-04/touch-emulated.png`,fullPage:true});}finally{await context.close();}
});
test('SG-S03 pause clears heads immediately and legacy journeys render after load and resume',async({page})=>{await fixture(page,'F17');await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.gatedEdges).toBeGreaterThan(0);await page.locator('#play').click();expect(await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().sparks.visible)).toBe(0);await page.locator('#fixture').selectOption('F11');await page.locator('#play').click();await expect.poll(async()=>await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().routes.journeys)).toBeGreaterThan(0);await page.locator('#play').click();await page.locator('#play').click();await expect.poll(async()=>await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics().routes.journeys),{timeout:7000}).toBeGreaterThan(0);await page.locator('#play').click();});
test('SG-S05 front oblique grayscale previews and look files retain safe defaults',async({page})=>{
 await fixture(page,'F16');await select(page,47);const original=await scene(page);await page.locator('#edit-look').click();await expect(page.locator('[data-gate-icon] svg')).toHaveCount(10);await expect(page.locator('[data-spark-style]')).toHaveCount(3);
 await page.locator('.look-files summary').click();const download=page.waitForEvent('download');await page.locator('#export-look').click();await(await download).saveAs(`${root}/step-05/exported-look.json`);
 const current=await page.evaluate(()=>(window as any).__bongo.look.get());const old={...current};delete old.switches;await page.locator('#look-file').setInputFiles({name:'old-look.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});expect(await page.evaluate(()=>(window as any).__bongo.look.get().switches)).toEqual(DEFAULT_SWITCH_LOOK);
 const before=await page.evaluate(()=>(window as any).__bongo.look.get());await page.locator('#look-file').setInputFiles({name:'bad-look.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...before,switches:{...before.switches,style:'invalid'}}))});expect(await page.evaluate(()=>(window as any).__bongo.look.get())).toEqual(before);
 await page.locator('#close-look').click();await page.evaluate(()=>{const b=(window as any).__bongo;b.view.camera.position.applyAxisAngle(b.view.camera.up,.23);b.view.camera.lookAt(0,0,0);b.view.camera.updateMatrixWorld();});
 for(const icon of ['arrow','chevron','triangle','bolt','comet']){await page.evaluate(icon=>{const b=(window as any).__bongo;b.look.set({...b.look.get(),switches:{...b.look.get().switches,icon,onColor:'#eeeeee',offColor:'#eeeeee',glow:0,animation:false}});},icon);await page.waitForTimeout(80);await page.screenshot({path:`${root}/step-05/${icon}-oblique-grayscale.png`});}
 expect(await scene(page)).toEqual(original);
});
test('SG-S07-A04 deliberate branching visibly pauses then simplifies and recovers',async({page})=>{
 const scene=gatedExample('loop');scene.wiring=topology.neighbors.map((exits,vertex)=>({vertex,exits}));await page.evaluate(s=>(window as any).__bongo.load(s),scene);await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.running).toBe(false);await expect(page.locator('#notice')).toContainText('gated edge limit exceeded');await expect(page.locator('#notice')).toBeVisible();await page.waitForTimeout(4600);await expect(page.locator('#notice')).toBeVisible();expect((await status(page)).gatedEdges).toBe(0);expect((await status(page)).pending).toBe(0);await expect.poll(async()=>(await status(page)).activeVoices).toBe(0);await page.screenshot({path:`${root}/step-07/branching-capacity-paused.png`});await fixture(page);await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.gatedArrivals).toBe(3);await page.locator('#play').click();
});

test('empty planet gates are always visible, default off and clickable before selecting an instrument',async({page})=>{
 const initial=await scene(page),marks=await gates(page);expect(marks).toHaveLength(540);expect(marks.every((g:any)=>!g.on&&!g.selected)).toBe(true);
 const gate=marks.find((g:any)=>g.visible&&g.x>800&&g.x<1100&&g.y>350&&g.y<650);expect(gate).toBeTruthy();
 await page.mouse.click(gate.x,gate.y);expect((await scene(page)).pieces).toEqual([]);
 expect((await scene(page)).wiring).toEqual([{vertex:gate.vertex,exits:[gate.exit]}]);
 await page.mouse.click(gate.x,gate.y);expect((await scene(page)).wiring[0].exits).toEqual([]);
 await page.locator('#undo').click();expect((await scene(page)).wiring[0].exits).toEqual([gate.exit]);
 await page.locator('#undo').click();expect(await scene(page)).toEqual(initial);
});
test('placing a generator enables its outgoing arrows in one undoable edit and gates remain editable',async({page})=>{
 const initial=await scene(page),slot=await page.evaluate(()=>(window as any).__bongo.slots[44]);await page.locator('[data-kind=generator]').click();await page.mouse.click(slot.x,slot.y);
 const placed=await scene(page);expect(placed.pieces).toHaveLength(1);expect(placed.wiring).toEqual([{vertex:44,exits:topology.neighbors[44]}]);
 await expect.poll(async()=>(await gates(page)).filter((g:any)=>g.vertex===44&&g.on).length).toBe(topology.neighbors[44].length);
 await page.locator('#undo').click();expect(await scene(page)).toEqual(initial);await page.locator('#redo').click();expect(await scene(page)).toEqual(placed);
 await page.locator('#sphere canvas').press('Escape');
 const gate=(await gates(page)).find((g:any)=>g.vertex===44&&g.visible);expect(gate).toBeTruthy();
 await page.locator('[data-kind=note][data-instrument=glass]').click();const before=await scene(page);
 await page.mouse.click(gate.x,gate.y);const edited=await scene(page);expect(edited.pieces).toEqual(before.pieces);expect(edited.wiring).toEqual([{vertex:44,exits:topology.neighbors[44].filter(exit=>exit!==gate.exit)}]);
 await page.locator('#play').click();
});
