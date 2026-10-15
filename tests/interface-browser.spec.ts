import { loadLocalPreset } from './presetHelpers';
import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { INSTRUMENTS } from '../src/core/instruments';

const APPEARANCE_STORAGE_KEY = 'bongo-planet-appearance-v1';
const DEFAULT_APPEARANCE = JSON.parse(readFileSync(new URL('../assets/geometric-toys/theme.json',import.meta.url),'utf8'));

const evidence = 'evidence/interface-cleanup';
const look = (page: Page) => page.evaluate(() => (window as any).__bongo.look.get());
const scene = (page: Page) => page.evaluate(() => (window as any).__bongo.scene);
const camera = (page: Page) => page.evaluate(() => (window as any).__bongo.view.getDiagnostics());
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', error => messages.push(String(error)));
  await page.goto('./');
  await page.waitForFunction(() => (window as any).__bongo?.view.getDiagnostics().frames > 2);
  await mkdir(evidence, { recursive: true });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test('orthographic is permanent and old camera and animation preferences migrate', async ({ page }) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: APPEARANCE_STORAGE_KEY,
    value: { ...DEFAULT_APPEARANCE, projection: 'perspective', eyes: false, bounce: false },
  });
  await page.reload();
  await page.waitForFunction(() => (window as any).__bongo?.view.getDiagnostics().frames > 2);
  expect(await look(page)).toMatchObject({ eyes: true, bounce: true });
  await expect(page.locator('#projection, .view-settings, .diagnostics')).toHaveCount(0);
  for (const size of [{ width: 1440, height: 1000 }, { width: 825, height: 1100 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await expect.poll(async () => (await camera(page)).cameraType).toBe('OrthographicCamera');
    expect((await camera(page)).projection).toBe('orthographic');
    const bounds = await page.evaluate(() => {
      const { view } = (window as any).__bongo;
      view.camera.updateMatrixWorld();
      const position = view.toyPlanet.geometry.attributes.position;
      const points = Array.from({ length: position.count }, (_, i) => view.camera.position.clone()
        .fromBufferAttribute(position, i).project(view.camera));
      return points.every(point => Math.abs(point.x) < 1 && Math.abs(point.y) < 1);
    });
    expect(bounds).toBe(true);
  }
});

test('all portraits fit without clipping or label overlap and menu sections stay in order', async ({ page }) => {
  const portraits = await page.locator('.palette-piece .piece-icon').evaluateAll(async elements => Promise.all(elements.map(async element => {
    const image = new Image();
    image.src = (element as HTMLElement).style.backgroundImage.slice(5, -2);
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    return { left, right, top, bottom, width: canvas.width, height: canvas.height };
  })));
  expect(portraits).toHaveLength(INSTRUMENTS.length + 1);
  for (const portrait of portraits) {
    expect(portrait.right).toBeGreaterThan(portrait.left);
    expect(portrait.left).toBeGreaterThanOrEqual(8);
    expect(portrait.top).toBeGreaterThanOrEqual(8);
    expect(portrait.width - 1 - portrait.right).toBeGreaterThanOrEqual(8);
    expect(portrait.height - 1 - portrait.bottom).toBeGreaterThanOrEqual(8);
  }
  await loadLocalPreset(page,'F14');
  await expect.poll(async () => (await scene(page)).pieces.length).toBeGreaterThan(0);
  for (const size of [{ width: 1440, height: 1000 }, { width: 825, height: 1100 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    const layout = await page.evaluate(() => {
      const sections = ['.piece-palette', '.transport', '.preset-controls', '.selection-card', '.global-controls', '.settings-controls', '.project-controls', '.ai-music-section'].map(selector => {
        const { top, bottom } = document.querySelector(selector)!.getBoundingClientRect();
        return { top, bottom };
      });
      const portraits = [...document.querySelectorAll('.palette-piece')].map(button => {
        const icon = button.querySelector('.piece-icon')!.getBoundingClientRect();
        const name = button.querySelector('.piece-name')!.getBoundingClientRect();
        const tile = button.getBoundingClientRect();
        return { gap: name.top - icon.bottom, inside: icon.left >= tile.left && icon.right <= tile.right && icon.top >= tile.top && name.bottom <= tile.bottom };
      });
      return { sections, portraits, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    for (let index = 1; index < layout.sections.length; index++) {
      expect(layout.sections[index].top).toBeGreaterThanOrEqual(layout.sections[index - 1].bottom);
    }
    expect(layout.overflow).toBe(false);
    for (const portrait of layout.portraits) {
      expect(portrait.gap).toBeGreaterThanOrEqual(6);
      expect(portrait.inside).toBe(true);
    }
    await page.screenshot({ path: `${evidence}/palette-${size.width}.png` });
  }
});

test('production themes apply in the left menu while the sphere remains interactive', async ({ page }) => {
  await page.locator('#fixture').selectOption({ label: 'Toy Ensemble' });
  await expect.poll(async () => (await scene(page)).pieces.length).toBeGreaterThan(0);
  const composition = await scene(page);
  await page.locator('#complete-theme').selectOption('nebula-space');
  expect((await look(page)).theme.atmosphere.backgroundBlur).toBe(.6);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const edited = await look(page), before = await camera(page);
  const bounds = (await page.locator('#sphere canvas').boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * .9, bounds.y + bounds.height * .9); await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height * .8, { steps: 6 }); await page.mouse.up();
  expect((await camera(page)).cameraQuaternion).not.toEqual(before.cameraQuaternion);
  expect(await scene(page)).toEqual(composition);
  await page.screenshot({ path: `${evidence}/production-theme-desktop.png` });
  await page.reload();
  await expect(page.locator('#complete-theme')).toHaveValue('nebula-space');
  expect(await look(page)).toEqual(edited);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#complete-theme').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${evidence}/production-theme-mobile.png` });
});

test('composition files transfer appearances and the theme drop-down restores Blue Marble', async ({ page }) => {
  const composition = await scene(page);
  const defaultLook = await look(page);
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#export-scene').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('Bongo-Planet.json');
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toMatchObject({ scene: composition, appearance: await look(page) });
  await page.locator('#file').setInputFiles({ name: 'Custom-look-composition.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'bongo-planet-composition', version: 1, scene: composition,
      appearance: { ...defaultLook, planet: '#aabbcc' } })) });
  await expect.poll(async () => (await look(page)).planet).toBe('#aabbcc');
  expect(await look(page)).toMatchObject({ eyes: true, bounce: true });
  expect((await camera(page)).cameraType).toBe('OrthographicCamera');
  expect(await scene(page)).toEqual(composition);
  await page.locator('#complete-theme').selectOption('original');
  expect(await look(page)).toEqual(defaultLook);
});

test('unavailable storage is explained without losing the active theme', async ({ page }) => {
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.locator('#complete-theme').selectOption('nebula-space');
  expect((await look(page)).theme.id).toBe('nebula-space');
  await expect(page.locator('#notice')).toContainText('could not save');
  await expect(page.locator('#complete-theme')).toHaveValue('nebula-space');
});
