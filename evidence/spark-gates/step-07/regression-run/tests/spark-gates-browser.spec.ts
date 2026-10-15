import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {gatedExample} from '../src/core/gatedExamples';
import { topology } from '../src/core/geometry';
const DEFAULT_SWITCH_LOOK={style:'ink',size:1,stroke:1,onColor:'#eabf48',offColor:'#f5eee0',glow:.2,animation:true};
const root='evidence/spark-gates';
const scene=(p:Page)=>p.evaluate(()=>(window as any).__bongo.scene);
const status=(p:Page)=>p.evaluate(()=>(window as any).__bongo.status);
const gates=(p:Page)=>p.evaluate(()=>(window as any).__bongo.gates);
async function fixture(p:Page,id='F15'){await p.locator('#fixture').selectOption(id);await expect.poll(async()=>(await scene(p)).pieces[0]?.id).toBe('gate-source');}
async function select(p:Page,vertex:number){const slot=await p.evaluate(v=>(window as any).__bongo.slots[v],vertex);expect(slot.visible).toBe(true);await p.mouse.click(slot.x,slot.y);}
const failures=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{mkdirSync(root,{recursive:true});const errors:string[]=[];failures.set(page,errors);page.on('pageerror',error=>errors.push(String(error)));await page.goto('./');await page.waitForFunction(()=>(window as any).__bongo?.view.getDiagnostics().frames>2);});
test.afterEach(async({page},info)=>{expect(failures.get(page)).toEqual([]);const video=page.video();await page.close();if(info.status==='passed')await video?.saveAs(`${root}/step-04/${info.title.replace(/[^a-z0-9]+/gi,'-').slice(0,110)}.webm`);});

test('SG-S04-A01 canvas exits alter actual sink continuation and fork sounds',async({page})=>{
 await fixture(page);await select(page,46);
 const before=await scene(page),exit=(await gates(page)).find((g:any)=>g.vertex===46&&g.exit===47);expect(exit.visible).toBe(true);
 await page.mouse.click(exit.x,exit.y);expect((await scene(page)).wiring.find((w:any)=>w.vertex===46).exits).toEqual([]);expect((await scene(page)).pieces).toEqual(before.pieces);
 await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.gatedArrivals).toBe(1);await page.locator('#play').click();
 expect(await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').map((e:any)=>e.trigger.nodeId))).toEqual(['gate-note-0']);
 await fixture(page);await select(page,46);await page.locator('#gates-all-off').click();
 const i=topology.neighbors[46].indexOf(47)+1;await page.getByRole('button',{name:`Exit ${i}, Off`,exact:true}).click();
 const j=topology.neighbors[46].indexOf(44)+1;await page.getByRole('button',{name:`Exit ${j}, Off`,exact:true}).click();
 expect((await scene(page)).wiring.find((w:any)=>w.vertex===46).exits).toEqual([44,47]);
 await page.locator('#play').click();await expect.poll(async()=>await page.evaluate(()=>(window as any).__bongo.events.some((e:any)=>e.type==='edge-stop'&&e.reason==='split'))).toBe(true);await page.locator('#play').click();
 await page.screenshot({path:`${root}/step-04/front.png`});writeFileSync(`${root}/step-04/edited-circuit.json`,JSON.stringify(await scene(page),null,2));
});
test('SG-S04-A03 gate gesture cancellation Escape focus loss and dragging preserve scene',async({page})=>{
 await fixture(page);await select(page,46);const exit=(await gates(page)).find((g:any)=>g.vertex===46&&g.exit===47),original=await scene(page);
 for(const action of ['drag','escape','cancel','blur','competing']){await page.mouse.move(exit.x,exit.y);await page.mouse.down();if(action==='drag')await page.mouse.move(exit.x+30,exit.y+30,{steps:5});if(action==='escape')await page.keyboard.press('Escape');if(action==='cancel')await page.locator('#sphere canvas').dispatchEvent('pointercancel',{pointerId:1,isPrimary:true});if(action==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));if(action==='competing')await page.locator('#sphere canvas').dispatchEvent('pointerdown',{pointerId:8,isPrimary:false,clientX:exit.x,clientY:exit.y});await page.mouse.up();expect(await scene(page)).toEqual(original);}
});
test('SG-S04-A02 moving deleting and history leave strut wiring at its original vertices',async({page})=>{
 await fixture(page);await select(page,46);const before=await scene(page),empty=await page.evaluate(()=>(window as any).__bongo.slots.find((s:any)=>s.visible&&!(window as any).__bongo.scene.pieces.some((p:any)=>p.vertex===s.vertex)));
 // Explicit Move owns the destination tap.
 await page.evaluate(()=>(window as any).__bongo.view.setMoveIntent('gate-note-0'));await page.mouse.click(empty.x,empty.y);expect((await scene(page)).wiring).toEqual(before.wiring);expect((await scene(page)).pieces.find((p:any)=>p.id==='gate-note-0').vertex).toBe(empty.vertex);
 await page.locator('#undo').click();expect((await scene(page)).wiring).toEqual(before.wiring);expect((await scene(page)).pieces.find((p:any)=>p.id==='gate-note-0').vertex).toBe(46);
 await select(page,46);await page.locator('#trash').click();expect((await scene(page)).wiring).toEqual(before.wiring);await page.locator('#undo').click();
 await select(page,44);await page.evaluate(()=>(window as any).__bongo.view.setMoveIntent('gate-source'));await page.mouse.click(empty.x,empty.y);expect((await scene(page)).wiring).toEqual(before.wiring);
});
test('SG-S04-A05 keyboard and empty junction controls share the real gate backend',async({page})=>{
 await fixture(page);const empty=await page.evaluate(()=>(window as any).__bongo.slots.find((s:any)=>s.visible&&!(window as any).__bongo.scene.pieces.some((p:any)=>p.vertex===s.vertex)));await page.mouse.click(empty.x,empty.y);await expect(page.locator('#selection-title')).toHaveText('Empty junction');
 await page.getByRole('button',{name:'Exit 1, Off',exact:true}).focus();await page.keyboard.press('Space');expect((await scene(page)).wiring.find((w:any)=>w.vertex===empty.vertex).exits).toHaveLength(1);expect((await status(page))?.running??false).toBe(false);
 await page.getByRole('button',{name:'Exit 1, On',exact:true}).focus();await page.keyboard.press('Enter');expect((await scene(page)).wiring.find((w:any)=>w.vertex===empty.vertex).exits).toEqual([]);
 await page.locator('#gates-all-on').click();expect((await scene(page)).wiring.find((w:any)=>w.vertex===empty.vertex).exits).toHaveLength(topology.neighbors[empty.vertex].length);await page.locator('#undo').click();expect((await scene(page)).wiring.find((w:any)=>w.vertex===empty.vertex).exits).toEqual([]);
});
test('SG-S05 all three real styles and shared controls preserve routing and transport',async({page})=>{
 await fixture(page);await select(page,46);await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.running).toBe(true);const composition=await scene(page),revision=(await status(page)).editRevision;
 await page.locator('#edit-look').click();
 for(const style of ['ink','toy','glow']){await page.locator(`[data-switch-style=${style}]`).click();expect(await page.evaluate(()=>(window as any).__bongo.look.get().switches.style)).toBe(style);await page.locator('#close-look').click();await page.screenshot({path:`${root}/step-05/${style}-front.png`});await page.locator('#edit-look').click();}
 for(const [key,value] of [['size','1.5'],['stroke','1.4'],['glow','0']]){const field=page.locator(`[data-switch-look=${key}]`);await field.fill(value);await field.dispatchEvent('input');expect(await page.evaluate(k=>(window as any).__bongo.look.get().switches[k],key)).toBe(Number(value));}
 for(const [key,value] of [['onColor','#112233'],['offColor','#eeeeee']]){await page.locator(`[data-switch-look=${key}]`).fill(value);await page.locator(`[data-switch-look=${key}]`).dispatchEvent('input');expect(await page.evaluate(k=>(window as any).__bongo.look.get().switches[k],key)).toBe(value);}
 await page.locator('[data-switch-look=animation]').uncheck();expect(await page.evaluate(()=>(window as any).__bongo.look.get().switches.animation)).toBe(false);
 await page.locator('#reset-switch-look').click();expect(await page.evaluate(()=>(window as any).__bongo.look.get().switches)).toEqual(DEFAULT_SWITCH_LOOK);
 expect(await scene(page)).toEqual(composition);expect((await status(page)).running).toBe(true);expect((await status(page)).editRevision).toBe(revision);
 await page.locator('#close-look').click();await page.locator('#play').click();
});
test('SG-S05-A04 fifty switch style cycles reuse geometry and retain zero-glow static shapes',async({page})=>{
 await fixture(page);await select(page,46);const before=await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics());
 await page.evaluate(()=>{const b=(window as any).__bongo;for(let i=0;i<50;i++)b.look.set({...b.look.get(),switches:{...b.look.get().switches,style:['ink','toy','glow'][i%3]}});});
 await page.waitForTimeout(250);const after=await page.evaluate(()=>(window as any).__bongo.view.getDiagnostics());expect(after.geometries).toBe(before.geometries);expect(after.switches.geometries).toBe(5);expect(after.switches.materials).toBe(5);
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>(window as any).__bongo.look.set({...((window as any).__bongo.look.get()),switches:{...((window as any).__bongo.look.get().switches),glow:0}}));await page.screenshot({path:`${root}/step-05/zero-glow-reduced-motion.png`});
 writeFileSync(`${root}/step-05/resources.json`,JSON.stringify({before,after},null,2));
});
test('SG-S06-A01 travel 1 3 8 93 Infinite and invalid values use inspector budgets',async({page})=>{
 await fixture(page);await select(page,44);
 for(const value of [1,3,8,93]){const field=page.getByRole('spinbutton',{name:'Spark travel',exact:true});await field.fill(String(value));await field.dispatchEvent('change');expect((await scene(page)).pieces[0].travel).toBe(value);await page.screenshot({path:`${root}/step-06/travel-${value}.png`});}
 await page.getByLabel('Infinite travel', {exact:true}).check();expect((await scene(page)).pieces[0].travel).toBe('infinite');await expect(page.getByRole('spinbutton',{name:'Spark travel'})).toBeDisabled();await page.screenshot({path:`${root}/step-06/travel-infinite.png`});await page.getByLabel('Infinite travel',{exact:true}).uncheck();
 for(const value of ['0','-1','2.5','9007199254740992']){const previous=await scene(page),field=page.getByRole('spinbutton',{name:'Spark travel',exact:true});await field.fill(value);await field.dispatchEvent('change');expect(await scene(page)).toEqual(previous);}
 expect(await page.locator('.selection-card').innerText()).not.toMatch(/Spark travel\s*\d+%/);
});
test('SG-S06-A02 save export import reload and conversion Undo preserve independent formats',async({page})=>{
 await fixture(page);await select(page,44);await page.getByLabel('Infinite travel',{exact:true}).check();const saved=await scene(page);await page.locator('#save').click();const download=page.waitForEvent('download');await page.locator('#export-scene').click();await(await download).saveAs(`${root}/step-06/exported-gated-scene.json`);
 await page.locator('#fixture').selectOption('F00');await expect.poll(async()=>(await scene(page)).pieces.length).toBe(0);await page.locator('#restore').click();expect(await scene(page)).toEqual(saved);expect((await status(page))?.running??false).toBe(false);
 await page.reload();await page.waitForFunction(()=>(window as any).__bongo);await page.locator('#restore').click();expect(await scene(page)).toEqual(saved);
 await page.locator('#fixture').selectOption('F11');await expect.poll(async()=>(await scene(page)).version).toBe(1);const original=await scene(page);await page.locator('#make-gated-copy').click();await expect(page.locator('.conversion-dialog')).toContainText('This changes the phrase');await page.locator('#confirm-gated-copy').click();expect((await scene(page)).version).toBe(2);expect((await scene(page)).pieces.map((p:any)=>p.id)).toEqual(original.pieces.map((p:any)=>p.id));await page.locator('#undo').click();expect(await scene(page)).toEqual(original);expect((await status(page))?.running??false).toBe(false);
 await page.locator('#file').setInputFiles({name:'bad-v2.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...saved,wiring:[{vertex:44,exits:[44]}]}))});await expect(page.locator('#notice')).toContainText('Import failed');expect(await scene(page)).toEqual(original);
});
test('SG-S04-A04 arbitrary rotation hides rear hit targets and narrow layouts keep inspector usable',async({page})=>{
 await fixture(page);await select(page,46);await page.evaluate(()=>{const b=(window as any).__bongo;b.view.camera.position.negate();b.view.camera.up.negate();b.view.camera.lookAt(0,0,0);b.view.camera.updateMatrixWorld();});await page.waitForTimeout(100);expect((await gates(page)).filter((g:any)=>g.vertex===46&&g.visible)).toHaveLength(0);const before=await scene(page),rear=(await gates(page)).find((g:any)=>g.vertex===46&&g.exit===47);await page.mouse.click(rear.x,rear.y);expect(await scene(page)).toEqual(before);await page.screenshot({path:`${root}/step-04/rear.png`});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('#junction-picker').selectOption('46');await expect(page.locator('#gates-all-on')).toBeVisible();await page.screenshot({path:`${root}/step-04/narrow.png`,fullPage:true});
});
test('SG-S03-A06 local native receiver gets future triggers preceding positions cancellation and stop',async({page})=>{
 await fixture(page);await page.evaluate(()=>(window as any).__bongo.outputAdapter.connect());await expect.poll(async()=>await page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(true);await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.gatedArrivals).toBeGreaterThanOrEqual(3);const playing=await(await page.request.get('http://127.0.0.1:5418/state')).json();expect(playing.drops).toBe(0);expect(playing.events.some((e:any)=>e.type==='queued'&&e.queueLeadMs>0)).toBe(true);expect(playing.events.some((e:any)=>e.type==='position')).toBe(true);expect(playing.events.some((e:any)=>e.type==='onset')).toBe(true);
 await page.locator('#play').click();await page.waitForTimeout(150);const stopped=await(await page.request.get('http://127.0.0.1:5418/state')).json();expect(stopped.pending).toBe(0);expect(stopped.events.some((e:any)=>e.type==='stop'&&e.reason==='pause')).toBe(true);writeFileSync(`${root}/step-03/receiver.json`,JSON.stringify({playing,stopped},null,2));await page.evaluate(()=>(window as any).__bongo.outputAdapter.disconnect());
});
test('SG-S07-A02 live event timing matches at 60 15 and 2 render FPS',async({page})=>{
 const traces:any[]=[];for(const fps of [60,15,2]){await fixture(page);await page.evaluate(f=>(window as any).__bongo.view.setFPS(f),fps);await page.locator('#play').click();await expect.poll(async()=>(await status(page))?.gatedArrivals).toBe(3);await page.locator('#play').click();traces.push(await page.evaluate(()=>{const e=(window as any).__bongo.events;const last=e.filter((e:any)=>e.type==='emission').at(-1);return e.filter((e:any)=>e.type==='onset'&&e.trigger.emission===last.time).map((e:any)=>[e.trigger.nodeId,Number((e.trigger.onset-last.time).toFixed(8))]);}));}expect(traces[1]).toEqual(traces[0]);expect(traces[2]).toEqual(traces[0]);writeFileSync(`${root}/step-07/fps-timelines.json`,JSON.stringify(traces,null,2));
});
