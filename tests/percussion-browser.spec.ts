import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { emptyScene, newPiece, placePiece } from '../src/core/contracts';
import { topology } from '../src/core/geometry';
import { INSTRUMENTS, PERCUSSION_INSTRUMENTS, INSTRUMENT_ROOT_HZ } from '../src/core/instruments';
import { labelPieces } from '../src/core/pieceLabels';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');
  await page.waitForFunction(() => (window as any).__bongo?.slots?.length === 92);
});

test('picker places all five percussion voices and preserves them through Save and Load', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(String(error)));
  for (const instrument of PERCUSSION_INSTRUMENTS) {
    await page.getByRole('button', { name: instrument.name, exact: true }).click();
    const slot = await page.evaluate(() => {
      const app = (window as any).__bongo;
      return app.slots.find((slot: any) => slot.visible && slot.y > 180 && slot.y < innerHeight - 100 && !app.scene.pieces.some((piece: any) => piece.vertex === slot.vertex));
    });
    await page.mouse.click(slot.x, slot.y);
    await expect(page.getByLabel('Instrument', { exact: true })).toHaveValue(instrument.id);
    await expect(page.locator('#selection-title')).toHaveText(`${instrument.name} 1`);
    await expect(page.locator('[data-field="degree"], [data-field="octave"], [data-field="duration"]')).toHaveCount(0);
  }
  const saved = await page.evaluate(() => (window as any).__bongo.scene);
  expect(saved.pieces.map((piece: any) => piece.instrument)).toEqual(PERCUSSION_INSTRUMENTS.map(i => i.id));
  await page.locator('#save').click();
  await page.locator('#clear').click();
  await page.locator('#restore').click();
  expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(saved);
  const restoredSlot = await page.evaluate(vertex => (window as any).__bongo.slots[vertex], saved.pieces[0].vertex);
  await page.mouse.click(restoredSlot.x, restoredSlot.y);
  const selector = page.getByLabel('Instrument', { exact: true });
  await expect(selector.locator('option')).toHaveCount(INSTRUMENTS.length);
  await selector.selectOption('snare');
  await expect(page.locator('#selection-title')).toHaveText('Snare 2');
  await selector.selectOption('piano');
  await expect(page.getByLabel('Note length', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('all percussion samples decode and produce independent live worklet hits at natural pitch', async ({ page }) => {
  const responses: { path: string; status: number }[] = [];
  page.on('response', response => { if (response.url().includes('/audio/percussion/')) responses.push({path: response.url(), status: response.status()}); });
  let scene = emptyScene();
  const generator = newPiece('generator', 0, 'percussion-source'); generator.period = 1;
  scene = placePiece(scene, generator);
  const vertices = topology.neighbors[0].slice(0, PERCUSSION_INSTRUMENTS.length);
  for (const [index, instrument] of PERCUSSION_INSTRUMENTS.entries()) {
    scene = placePiece(scene, {...newPiece('note', vertices[index], `percussion-${index}`), instrument: instrument.id, degree: 6, octave: 6, duration: 0.05});
  }
  scene.settings.key = 11;
  await page.locator('#file').setInputFiles({name: 'percussion.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(labelPieces(scene)))});
  await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBe(6);
  await page.locator('#play').click();
  await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.events.filter((event: any) => event.type === 'onset').length), {timeout: 8000}).toBeGreaterThanOrEqual(10);
  const onsets = await page.evaluate(() => (window as any).__bongo.events.filter((event: any) => event.type === 'onset').slice(0, 5).map((event: any) => event.trigger));
  expect(new Set(onsets.map((trigger: any) => trigger.nodeId)).size).toBe(5);
  expect(new Set(onsets.map((trigger: any) => trigger.onset)).size).toBe(1);
  expect(new Set(onsets.map((trigger: any) => trigger.sound.frequency))).toEqual(new Set([INSTRUMENT_ROOT_HZ]));
  expect(new Set(onsets.map((trigger: any) => trigger.sound.instrument))).toEqual(new Set(PERCUSSION_INSTRUMENTS.map(i => i.id)));
  expect(responses).toHaveLength(10); expect(responses.every(response => response.status === 200)).toBe(true);
  const peak = await page.evaluate(async () => {
    const audio = (window as any).__bongo.audio, analyser = audio.context.createAnalyser();
    analyser.fftSize = 4096; audio.node.connect(analyser);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const pcm = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(pcm); audio.node.disconnect(analyser);
    return Math.max(...pcm.map(Math.abs));
  });
  expect(peak).toBeGreaterThan(0.0001);
  await page.locator('#play').click();
  await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.status.activeVoices)).toBe(0);
  mkdirSync('evidence/percussion-picker', {recursive: true});
  writeFileSync('evidence/percussion-picker/browser-audio.json', JSON.stringify({responses, onsets, peak, scope: 'Headless browser render output; physical listening not claimed'}, null, 2));
});

test('renders matching editable portraits and keeps the picker reachable on desktop and mobile', async ({ page }) => {
  mkdirSync('evidence/percussion-picker/portraits', {recursive: true});
  for (const id of ['generator', ...INSTRUMENTS.map(i => i.id)]) {
    const selector = id === 'generator' ? '[data-kind="generator"] .piece-icon' : `[data-instrument="${id}"] .piece-icon`;
    const image = await page.locator(selector).evaluate(element => getComputedStyle(element).backgroundImage);
    const match = image.match(/data:image\/png;base64,([^"')]+)/);
    expect(match).not.toBeNull();
    writeFileSync(`evidence/percussion-picker/portraits/${id}-portrait.png`, Buffer.from(match![1], 'base64'));
  }
  await page.screenshot({path: 'evidence/percussion-picker/picker-desktop.png'});
  for (const [width, height] of [[1180, 800], [390, 844]]) {
    await page.setViewportSize({width, height});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const instrument of PERCUSSION_INSTRUMENTS) {
      const button = page.getByRole('button', {name: instrument.name, exact: true});
      await button.scrollIntoViewIfNeeded(); await expect(button).toBeInViewport();
    }
    await page.screenshot({path: `evidence/percussion-picker/picker-${width}.png`, fullPage: width < 600});
  }
});
