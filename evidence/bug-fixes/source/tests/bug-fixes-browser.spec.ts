import {test, expect, type Page} from '@playwright/test';
import {mkdirSync, writeFileSync} from 'node:fs';
import {emptyScene, newPiece} from '../src/core/contracts';

const evidence = 'evidence/bug-fixes';
test.use({video: {mode: 'on', size: {width: 1440, height: 1000}}});
type Slot = {vertex: number; x: number; y: number; visible: boolean};
const scene = (page: Page) => page.evaluate(() => (window as any).__bongo.scene);
const diagnostic = (page: Page) => page.evaluate(() => (window as any).__bongo.view.getDiagnostics());
const slots = (page: Page): Promise<Slot[]> => page.evaluate(() => (window as any).__bongo.slots);
async function openSlot(page: Page): Promise<Slot> {
  const composition = await scene(page);
  return (await slots(page)).find(s => s.visible && !composition.pieces.some((p: any) => p.vertex === s.vertex))!;
}
async function drag(page: Page, from: {x: number; y: number}, to: {x: number; y: number}) {
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(to.x, to.y, {steps: 12}); await page.mouse.up();
}
async function trash(page: Page) {
  await page.locator('#trash').scrollIntoViewIfNeeded();
  const box = (await page.locator('#trash').boundingBox())!;
  return {x: box.x + box.width / 2, y: box.y + box.height / 2};
}
test.beforeEach(async ({page}) => {
  mkdirSync(evidence, {recursive: true});
  await page.goto('./');
  await page.waitForFunction(() => (window as any).__bongo?.view.getDiagnostics().frames > 2);
});
test.afterEach(async ({page}, info) => {
  if (info.status !== 'passed') return;
  const video = page.video();
  await page.close();
  await video?.saveAs(`${evidence}/${info.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.webm`);
});

test('minimal left menu and bottom tray at desktop and narrow sizes', async ({page}) => {
  await expect(page.locator('header')).toHaveText('Bongo Planet');
  for (const copy of ['A musical constellation', 'YOUR OWN LITTLE UNIVERSE', 'BUILD YOUR PATTERN', 'SHAPE THE SOUND', 'Distance is a rhythm.', 'Equal distances make a chord.', 'Drag empty space', 'Every dot is']) {
    expect(await page.locator('body').innerText()).not.toContain(copy);
  }
  for (const id of ['tempo', 'key', 'scale', 'travel', 'quantization', 'volume', 'play', 'enable']) {
    await expect(page.locator(`.palette #${id}`)).toHaveCount(1);
  }
  for (const id of ['clear', 'save', 'restore', 'export', 'import', 'undo', 'redo', 'fixture']) {
    await expect(page.locator(`footer #${id}`)).toHaveCount(1);
  }
  await expect(page.locator('details')).not.toHaveAttribute('open');
  await page.screenshot({path: `${evidence}/desktop-empty.png`});
  for (const kind of ['generator', 'note', 'beat']) {
    await page.locator(`[data-kind=${kind}]`).click();
    const slot = await openSlot(page); await page.mouse.click(slot.x, slot.y);
    await expect(page.locator('#inspector-content h2')).toHaveText(kind[0].toUpperCase() + kind.slice(1));
    await page.screenshot({path: `${evidence}/desktop-${kind}.png`});
  }
  await page.locator('summary').click(); await expect(page.locator('#stats')).toBeVisible();
  await page.locator('summary').click(); await expect(page.locator('#stats')).not.toBeVisible();
  for (const size of [{width: 1180, height: 800}, {width: 390, height: 844}]) {
    await page.setViewportSize(size);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const selector of ['#volume', '#play', '#trash', '#clear']) {
      await page.locator(selector).scrollIntoViewIfNeeded(); await expect(page.locator(selector)).toBeInViewport();
    }
    await page.screenshot({path: `${evidence}/layout-${size.width}.png`, fullPage: true});
  }
});

test('persistent placement creates distinct pieces and explicit movement preserves identity', async ({page}) => {
  for (const kind of ['note', 'generator', 'beat']) {
    await page.locator(`[data-kind=${kind}]`).click();
    for (let i = 0; i < 3; i++) {
      const before = await scene(page), slot = await openSlot(page);
      await page.mouse.click(slot.x, slot.y);
      const after = await scene(page);
      expect(after.pieces.slice(0, -1)).toEqual(before.pieces);
      expect(after.pieces.at(-1)).toMatchObject({kind, vertex: slot.vertex});
      expect(new Set(after.pieces.map((p: any) => p.id)).size).toBe(after.pieces.length);
      expect((await diagnostic(page)).selected).toBe(after.pieces.at(-1).id);
      await expect(page.locator(`[data-kind=${kind}]`)).toHaveAttribute('aria-pressed', 'true');
    }
  }
  const before = await scene(page), first = before.pieces[0], firstSlot = (await slots(page))[first.vertex];
  await page.mouse.click(firstSlot.x, firstSlot.y);
  expect(await scene(page)).toEqual(before); expect((await diagnostic(page)).tool).toBe('beat');
  await page.locator('#move-piece').click();
  const destination = await openSlot(page); await page.mouse.click(destination.x, destination.y);
  const moved = await scene(page);
  expect(moved.pieces[0]).toEqual({...first, vertex: destination.vertex});
  expect(moved.pieces.slice(1)).toEqual(before.pieces.slice(1));
  expect((await diagnostic(page)).moveIntent).toBeNull();
  const empty = await openSlot(page); await page.mouse.click(empty.x, empty.y);
  expect(await scene(page)).toEqual(moved); // highlight alone never relocates
  await page.locator('[data-kind=note]').click(); await page.keyboard.press('Escape');
  expect((await diagnostic(page)).tool).toBeNull();
  await page.locator('[data-kind=note]').click(); await page.locator('[data-kind=note]').click();
  expect((await diagnostic(page)).tool).toBeNull();
  await page.locator('[data-kind=beat]').click();
  await drag(page, (await slots(page))[destination.vertex], await openSlot(page));
  expect((await scene(page)).pieces).toHaveLength(9);
  await page.screenshot({path: `${evidence}/persistent-placement.png`});
  await page.locator('#clear').click(); expect((await diagnostic(page)).tool).toBeNull();
  await page.locator('[data-kind=note]').click(); await page.locator('#fixture').selectOption('F01');
  await expect.poll(async () => (await diagnostic(page)).tool).toBeNull();
});

test('trash removes each kind with one undoable edit and cancels safely', async ({page}) => {
  for (const kind of ['note', 'generator', 'beat'] as const) {
    const slot = await openSlot(page), next = emptyScene(); next.pieces = [newPiece(kind, slot.vertex, `${kind}-trash`)];
    await page.evaluate(s => (window as any).__bongo.load(s), next);
    await drag(page, slot, await trash(page)); expect((await scene(page)).pieces).toHaveLength(0);
    expect((await diagnostic(page)).selected).toBeNull(); await expect(page.locator('#inspector-content')).toBeEmpty();
    await page.locator('#undo').click(); expect(await scene(page)).toEqual(next);
    await page.locator('#redo').click(); expect((await scene(page)).pieces).toHaveLength(0);
  }
  await page.locator('[data-kind=note]').click(); const slot = await openSlot(page); await page.mouse.click(slot.x, slot.y);
  const before = await scene(page), target = await trash(page);
  await page.mouse.move(slot.x, slot.y); await page.mouse.down(); await page.mouse.move(target.x, target.y, {steps: 8});
  await expect(page.locator('#trash')).toHaveClass(/drop-active/); expect(await scene(page)).toEqual(before);
  await page.keyboard.press('Escape'); await page.mouse.up(); expect(await scene(page)).toEqual(before);
  await expect(page.locator('#trash')).not.toHaveClass(/drop-active/);
  const canvas = page.locator('canvas');
  for (const cancellation of ['pointercancel', 'blur', 'competing']) {
    const data = {pointerId: 71, pointerType: 'touch', isPrimary: true, button: 0, bubbles: true};
    await canvas.dispatchEvent('pointerdown', {...data, clientX: slot.x, clientY: slot.y});
    await canvas.dispatchEvent('pointermove', {...data, clientX: target.x, clientY: target.y});
    if (cancellation === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    else if (cancellation === 'competing') await canvas.dispatchEvent('pointerdown', {...data, pointerId: 72, isPrimary: false});
    else await canvas.dispatchEvent('pointercancel', data);
    await canvas.dispatchEvent('pointerup', {...data, clientX: target.x, clientY: target.y});
    expect(await scene(page)).toEqual(before);
  }
  await drag(page, slot, {x: 1430, y: 30}); expect(await scene(page)).toEqual(before);
  const box = (await page.locator('[data-kind=generator]').boundingBox())!;
  await drag(page, {x: box.x + 20, y: box.y + 20}, target); expect(await scene(page)).toEqual(before);
  // Handler-level touch emulation of the same release target, distinct from physical-device qualification.
  const touch = {pointerId: 73, pointerType: 'touch', isPrimary: true, button: 0, bubbles: true};
  await canvas.dispatchEvent('pointerdown', {...touch, clientX: slot.x, clientY: slot.y});
  await canvas.dispatchEvent('pointermove', {...touch, clientX: target.x, clientY: target.y});
  await canvas.dispatchEvent('pointerup', {...touch, clientX: target.x, clientY: target.y});
  expect((await scene(page)).pieces).toHaveLength(0);
});

test('trash cancels committed pending sound and remote output', async ({page}) => {
  await page.locator('#fixture').selectOption('F05');
  await expect.poll(async () => (await scene(page)).pieces.length).toBe(2);
  await page.locator('summary').click(); await page.locator('#bridge').click();
  await expect.poll(async () => page.evaluate(() => (window as any).__bongo.output.connected)).toBe(true);
  await page.locator('summary').click(); await page.locator('#play').click();
  await expect.poll(async () => page.evaluate(() => (window as any).__bongo.status?.pending)).toBe(1);
  const current = await scene(page), note = current.pieces.find((p: any) => p.kind === 'note');
  // The fixture's target is on the rear; expose it through actual camera navigation.
  const box = (await page.locator('canvas').boundingBox())!;
  for (let i = 0; i < 8 && !(await slots(page))[note.vertex].visible; i++) {
    await drag(page, {x: box.x + 5, y: box.y + box.height / 2}, {x: box.x + box.width * .65, y: box.y + box.height / 2});
    await page.waitForTimeout(50);
  }
  const from = (await slots(page))[note.vertex]; expect(from.visible).toBe(true);
  await drag(page, from, await trash(page));
  await expect.poll(async () => page.evaluate(() => (window as any).__bongo.status?.pending)).toBe(0);
  await expect.poll(async () => page.request.get('http://127.0.0.1:5418/state').then(r => r.json()).then(s => s.pending + s.activeVoices)).toBe(0);
  const count = await page.evaluate(() => (window as any).__bongo.events.filter((e: any) => e.type === 'onset').length);
  await page.waitForTimeout(1800);
  expect(await page.evaluate(() => (window as any).__bongo.events.filter((e: any) => e.type === 'onset').length)).toBe(count);
});

test('trash releases sounding voices and deleting a generator cancels its pending children', async ({page}) => {
  const front = (await slots(page)).filter(s => s.visible), target = front[10], source = front.find(s => s.vertex !== target.vertex)!;
  const next = emptyScene(), generator = newPiece('generator', source.vertex, 'voice-generator');
  if (generator.kind === 'generator') { generator.reach = 180; generator.period = 8; }
  const note = newPiece('note', target.vertex, 'long-note');
  if (note.kind === 'note') note.duration = 8;
  next.pieces = [generator, note]; await page.evaluate(s => (window as any).__bongo.load(s), next);
  await page.locator('#play').click();
  await expect.poll(async () => page.evaluate(() => (window as any).__bongo.status?.activeVoices), {timeout: 8000}).toBe(1);
  await drag(page, target, await trash(page));
  await expect.poll(async () => page.evaluate(() => (window as any).__bongo.status?.activeVoices)).toBe(0);
  expect((await scene(page)).pieces).toEqual([generator]);
  await page.locator('#fixture').selectOption('F05'); await expect.poll(async () => (await scene(page)).pieces.length).toBe(2);
  await page.locator('#play').click(); await expect.poll(async () => page.evaluate(() => (window as any).__bongo.status?.pending)).toBe(1);
  const box = (await page.locator('canvas').boundingBox())!, gen = (await scene(page)).pieces.find((p: any) => p.kind === 'generator');
  for (let i = 0; i < 8 && !(await slots(page))[gen.vertex].visible; i++) {
    await drag(page, {x: box.x + 5, y: box.y + box.height / 2}, {x: box.x + box.width * .65, y: box.y + box.height / 2});
    await page.waitForTimeout(40);
  }
  const from = (await slots(page))[gen.vertex]; expect(from.visible).toBe(true);
  await drag(page, from, await trash(page));
  await expect.poll(async () => page.evaluate(() => (window as any).__bongo.status?.pending)).toBe(0);
  const retained = await scene(page); expect(retained.pieces).toHaveLength(1); expect(retained.pieces[0].kind).toBe('note');
});

test('camera blur and zoom cancellation release ownership and preserve the scene', async ({page}) => {
  const before = await scene(page), canvas = page.locator('canvas'), box = (await canvas.boundingBox())!;
  for (const button of ['left', 'middle'] as const) {
    await page.mouse.move(box.x + 5, box.y + box.height / 2); await page.mouse.down({button});
    expect(await canvas.evaluate(el => el.hasPointerCapture(1))).toBe(true);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    expect(await canvas.evaluate(el => el.hasPointerCapture(1))).toBe(false);
    await page.mouse.up({button});
  }
  const orientation = (await diagnostic(page)).camera;
  await drag(page, {x: box.x + 5, y: box.y + box.height / 2}, {x: box.x + box.width * .7, y: box.y + box.height / 2});
  expect((await diagnostic(page)).camera).not.toEqual(orientation); expect(await scene(page)).toEqual(before);
  await page.mouse.wheel(0, 10000); await page.waitForTimeout(60);
  expect(Math.hypot(...(await diagnostic(page)).camera)).toBeLessThanOrEqual(5.5 + 1e-9);
  await page.mouse.wheel(0, -10000); await page.waitForTimeout(60);
  expect(Math.hypot(...(await diagnostic(page)).camera)).toBeGreaterThanOrEqual(2.3 - 1e-9);
});

test('rotation crosses both poles for repeated full turns and preserves composition', async ({page}) => {
  test.setTimeout(60000);
  await page.locator('#fixture').selectOption('F07'); await expect.poll(async () => (await scene(page)).pieces.length).toBe(6);
  const before = await scene(page), box = (await page.locator('canvas').boundingBox())!;
  const trace: any[] = [await diagnostic(page)];
  for (const direction of ['vertical', 'horizontal', 'diagonal'] as const) {
    const start = direction === 'vertical' ? {x: box.x + box.width / 2, y: box.y + 5} : {x: box.x + 5, y: box.y + box.height / 2};
    const end = direction === 'vertical' ? {x: start.x, y: box.y + box.height - 5} : {x: box.x + box.width - 5, y: direction === 'horizontal' ? start.y : box.y + box.height - 5};
    const samples: any[] = [await diagnostic(page)];
    for (let turn = 0; turn < 8; turn++) {
      await page.mouse.move(start.x, start.y); await page.mouse.down();
      for (let step = 1; step <= 16; step++) {
        const t = step / 16;
        await page.mouse.move(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t);
        await page.waitForTimeout(20); samples.push(await diagnostic(page));
      }
      await page.mouse.up();
    }
    const arc = samples.slice(1).reduce((sum, s, i) => {
      const a = samples[i].camera, b = s.camera;
      const dot = a.reduce((v: number, x: number, j: number) => v + x * b[j], 0) / (Math.hypot(...a) * Math.hypot(...b));
      return sum + Math.acos(Math.max(-1, Math.min(1, dot)));
    }, 0);
    expect(arc).toBeGreaterThan(4 * Math.PI); // independent accumulated angular distance: at least two turns
    expect(samples.every(s => [...s.camera, ...s.cameraUp, ...s.cameraQuaternion].every(Number.isFinite))).toBe(true);
    if (direction === 'vertical') {
      expect(samples.some(s => s.cameraUp[1] < -.7)).toBe(true);
      expect(samples.some(s => s.camera[1] > 2.5)).toBe(true);
      expect(samples.some(s => s.camera[1] < -2.5)).toBe(true);
      await page.screenshot({path: `${evidence}/rotation-poles.png`});
    }
    trace.push({direction, arc, samples}); expect(await scene(page)).toEqual(before);
    await drag(page, end, start); // reverse direction remains usable
  }
  writeFileSync(`${evidence}/rotation-trace.json`, JSON.stringify({before, after: await scene(page), trace}, null, 2));
  await page.locator('[data-kind=note]').click(); const newSlot = await openSlot(page); await page.mouse.click(newSlot.x, newSlot.y);
  expect((await scene(page)).pieces.slice(0, -1)).toEqual(before.pieces);
  const created = (await scene(page)).pieces.at(-1); expect(created.vertex).toBe(newSlot.vertex);
  const next = await openSlot(page); await drag(page, newSlot, next);
  expect((await scene(page)).pieces.at(-1)).toEqual({...created, vertex: next.vertex});
  await drag(page, next, await trash(page)); expect(await scene(page)).toEqual(before);
});
