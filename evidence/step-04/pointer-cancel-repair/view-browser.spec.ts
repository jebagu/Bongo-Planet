import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test.use({ browserName: 'chromium', viewport: { width: 1000, height: 820 }, video: { mode: 'on', size: { width: 1000, height: 820 } }, launchOptions: { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--enable-unsafe-swiftshader'] } });
const evidence = 'evidence/step-04';
type Slot = { vertex: number; x: number; y: number; visible: boolean };
const slots = (page: Page): Promise<Slot[]> => page.evaluate(() => (window as any).harness.view.getProjectedSlots());
const calls = (page: Page): Promise<any[]> => page.evaluate(() => (window as any).harness.calls);
const pointer = (page: Page, type: string, slot: Slot, pointerId = 1, extra = {}) => page.locator('canvas').dispatchEvent(type, { pointerId, pointerType: 'touch', isPrimary: true, button: 0, clientX: slot.x, clientY: slot.y, bubbles: true, ...extra });

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5417/BongoPlanet/tests/view-harness.html');
  await page.waitForFunction(() => (window as any).harness?.view.getDiagnostics().frames > 2);
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith('mouse placement') && testInfo.status === 'passed') {
    const video = page.video();
    await page.close();
    await mkdir(evidence, { recursive: true });
    await video?.saveAs(`${evidence}/interaction.webm`);
  }
});

test('mouse placement, captured relocation, occupied and outside drops', async ({ page }) => {
  const front = (await slots(page)).filter(p => p.visible);
  const a = front[0], b = front.find(p => Math.hypot(p.x-a.x,p.y-a.y)>120)!;
  await page.evaluate(() => (window as any).harness.view.setTool('generator'));
  await page.mouse.click(a.x, a.y);
  await page.evaluate(() => (window as any).harness.view.setTool('note'));
  await page.mouse.click(b.x, b.y);
  expect((await calls(page)).filter(c=>c.type==='place')).toHaveLength(2);
  await page.evaluate(() => (window as any).harness.view.setTool(null));
  const target = front.find(p => p.vertex!==a.vertex && p.vertex!==b.vertex && Math.hypot(p.x-b.x,p.y-b.y)>100)!;
  await page.mouse.move(b.x,b.y); await page.mouse.down();
  await page.mouse.move(850,780); // leave the canvas without losing piece ownership
  expect(await page.evaluate(() => (window as any).harness.view.getDiagnostics().dragging)).toBeTruthy();
  await page.mouse.move(target.x,target.y); await page.mouse.up();
  const moved = (await calls(page)).filter(c=>c.type==='move');
  expect(moved).toHaveLength(1); expect(moved[0].vertex).toBe(target.vertex);
  await page.mouse.move(target.x,target.y); await page.mouse.down(); await page.mouse.move(a.x,a.y); await page.mouse.up();
  await page.mouse.move(target.x,target.y); await page.mouse.down(); await page.mouse.move(850,780); await page.mouse.up();
  expect((await calls(page)).filter(c=>c.type==='move')).toHaveLength(1);
  await mkdir(evidence,{recursive:true});
  await page.screenshot({path:`${evidence}/front.png`});
});

test('touch cancellation, competing pointers and focus loss preserve the scene', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(String(error)));
  const front = (await slots(page)).filter(p=>p.visible), a=front[0], b=front[5];
  await page.evaluate(() => (window as any).harness.view.setTool('beat'));
  await pointer(page,'pointerdown',a); await pointer(page,'pointermove',b); await pointer(page,'pointercancel',b);
  await pointer(page,'pointerup',b);
  expect((await calls(page)).filter(c=>c.type==='place')).toHaveLength(0);
  await pointer(page,'pointerdown',a); await pointer(page,'pointerdown',b,2,{isPrimary:false}); await pointer(page,'pointerup',a); await pointer(page,'pointerup',b,2,{isPrimary:false});
  expect((await calls(page)).filter(c=>c.type==='place')).toHaveLength(0);
  await pointer(page,'pointerdown',a); await page.evaluate(()=>window.dispatchEvent(new Event('blur'))); await pointer(page,'pointerup',a);
  expect((await calls(page)).filter(c=>c.type==='place')).toHaveLength(0);
  expect(await page.evaluate(()=>(window as any).harness.view.getDiagnostics().dragging)).toBeNull();
  expect(errors).toEqual([]);
});

test('camera cancellation reaches orbit controls and leaves subsequent orbit usable', async ({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(String(error)));
  const canvas=page.locator('canvas'),box=(await canvas.boundingBox())!;
  await page.mouse.move(box.x+10,box.y+box.height*.5);await page.mouse.down();
  // Mouse pointer 1 is browser-active; cancel its camera-owned gesture. This is
  // an automated handler control, not a physical touch qualification.
  await canvas.dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',isPrimary:true,bubbles:true});await page.mouse.up();
  const before=await page.evaluate(()=>(window as any).harness.view.getDiagnostics().camera);
  await page.mouse.move(box.x+10,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6,{steps:20});await page.mouse.up();await page.waitForTimeout(350);
  const after=await page.evaluate(()=>(window as any).harness.view.getDiagnostics().camera);
  expect(Math.hypot(...after.map((v:number,i:number)=>v-before[i]))).toBeGreaterThan(.01);expect(errors).toEqual([]);
});

test('palette drag and select-piece/select-slot alternative commit one edit', async ({ page }) => {
  const front = (await slots(page)).filter(p=>p.visible), a=front[10], b=front.find(p=>Math.hypot(p.x-a.x,p.y-a.y)>100)!;
  const palette=page.locator('#palette');
  await palette.click();
  expect((await calls(page)).filter(c=>c.type==='message')).toHaveLength(0);
  const box=(await palette.boundingBox())!;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down(); await page.mouse.move(a.x,a.y,{steps:5}); await page.mouse.up();
  expect((await calls(page)).filter(c=>c.type==='place')).toHaveLength(1);
  await page.mouse.click(a.x,a.y); await page.mouse.click(b.x,b.y);
  expect((await calls(page)).filter(c=>c.type==='move')).toHaveLength(1);
  expect((await calls(page)).find(c=>c.type==='move').vertex).toBe(b.vertex);
});

test('camera orbit exposes the rear while preserving composition and rear picking', async ({ page }) => {
  const initial=await slots(page), front=initial.filter(p=>p.visible);
  await page.evaluate(()=>(window as any).harness.view.setTool('note'));
  for (const rear of initial.filter(p=>!p.visible).slice(0,10)) await page.mouse.click(rear.x,rear.y);
  const placements=(await calls(page)).filter(c=>c.type==='place');
  for(const placement of placements) expect(front.some(p=>p.vertex===placement.vertex)).toBe(true);
  const before=await page.evaluate(() => JSON.stringify((window as any).harness.scene));
  await page.evaluate(()=>(window as any).harness.view.setTool(null));
  await page.mouse.move(70,380); await page.mouse.down(); await page.mouse.move(700,450,{steps:30}); await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => JSON.stringify((window as any).harness.scene))).toBe(before);
  const after=await slots(page);
  expect(after.some(p=>p.visible && !initial[p.vertex].visible)).toBe(true);
  const newlyVisible=after.find(p=>p.visible && !initial[p.vertex].visible)!;
  await page.evaluate(()=>(window as any).harness.view.setTool('beat'));
  await page.mouse.click(newlyVisible.x,newlyVisible.y);
  expect((await calls(page)).some(c=>c.type==='place' && c.vertex===newlyVisible.vertex)).toBe(true);
  await mkdir(evidence,{recursive:true}); await page.screenshot({path:`${evidence}/rear.png`});
});

test('timestamp feedback renders at low FPS and reduced motion creates no model events', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  const a=(await slots(page)).find(p=>p.visible)!;
  await page.evaluate(()=> (window as any).harness.view.setTool('generator'));
  await page.mouse.click(a.x,a.y);
  const before=await page.evaluate(()=>JSON.stringify((window as any).harness.scene));
  await page.evaluate(()=> {
    const h=(window as any).harness;
    h.view.setTool(null); h.view.setFPS(2);
    h.view.event({type:'emission',generatorId:h.scene.pieces[0].id,time:performance.now()/1000,periodSeconds:2,reach:180});
  });
  await page.waitForTimeout(700);
  expect(await page.evaluate(()=>JSON.stringify((window as any).harness.scene))).toBe(before);
  expect(await page.evaluate(()=>(window as any).harness.view.getDiagnostics().reducedMotion)).toBe(true);
  expect((await calls(page)).filter(c=>c.type==='place')).toHaveLength(1);
  await mkdir(evidence,{recursive:true}); await page.screenshot({path:`${evidence}/reduced-motion.png`});
});
