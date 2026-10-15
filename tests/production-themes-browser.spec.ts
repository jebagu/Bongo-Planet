import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { APPEARANCE_STORAGE_KEY, validateAppearance } from '../src/view/art/appearance';
import { COMPLETE_THEMES, EXPERIMENT_LOOK_KEY, PRODUCTION_ORIGINAL_LOOK_KEY } from '../src/view/art/completeThemes';
import { COMPOSITION_STORAGE_KEY } from '../src/compositionFile';
import capturedOriginal from '../assets/theme-experiment-original.json' with { type: 'json' };

const original = validateAppearance(capturedOriginal);

test('all three production themes preserve playing music and main saves stay separate from the preview', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.locator('#complete-theme option:not([hidden])').allTextContents()).toEqual(['Blue Marble', 'Nebula', 'Fireflies']);
  await expect(page.locator('.theme-experiment-controls button, .theme-experiment-controls p, .theme-experiment-controls details, .theme-experiment-controls input')).toHaveCount(0);
  await expect(page.locator('#complete-theme')).toHaveValue('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get().planet)).toBe('#5262e9');
  await page.evaluate(key => localStorage.setItem(key, 'PREVIEW LOOK MUST STAY UNCHANGED'), EXPERIMENT_LOOK_KEY);
  await page.locator('#fixture').selectOption('C02');
  await expect.poll(() => page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBeGreaterThan(5);
  const scene = await page.evaluate(() => (window as any).__bongo.scene);
  await page.locator('#play').click();
  await expect(page.locator('#play')).toContainText('Pause');
  for (const theme of COMPLETE_THEMES) {
    const events = await page.evaluate(() => (window as any).__bongo.events.length);
    await page.locator('#complete-theme').selectOption(theme.id);
    expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
    await expect.poll(() => page.evaluate(() => (window as any).__bongo.events.length)).toBeGreaterThan(events);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).theme.id, APPEARANCE_STORAGE_KEY)).toBe(theme.id);
    if (theme.id === 'nebula-space') expect(await page.evaluate(() => (window as any).__bongo.look.get().theme.atmosphere.backgroundBlur)).toBe(.6);
    if (theme.id === 'firefly-garden') await expect(page.locator('.theme-fireflies')).toBeVisible();
  }
  await page.locator('#complete-theme').selectOption('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get().planet)).toBe('#5262e9');
  expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
  await page.locator('#complete-theme').selectOption('nebula-space');
  await page.evaluate(() => { const b = (window as any).__bongo, look = b.look.get(); b.look.set({ ...look, theme: { ...look.theme, atmosphere: { ...look.theme.atmosphere, backgroundBlur: 0 } } }); });
  await page.locator('#save').click();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), COMPOSITION_STORAGE_KEY);
  expect(saved.scene).toEqual(scene);
  expect(saved.appearance.theme.atmosphere.backgroundBlur).toBe(0);
  expect(await page.evaluate(key => localStorage.getItem(key), EXPERIMENT_LOOK_KEY)).toBe('PREVIEW LOOK MUST STAY UNCHANGED');
  await page.reload();
  await expect(page.locator('#complete-theme')).toHaveValue('nebula-space');
  expect(await page.evaluate(() => (window as any).__bongo.look.get().theme.atmosphere.backgroundBlur)).toBe(0);
  await page.locator('#restore').click();
  expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).theme, PRODUCTION_ORIGINAL_LOOK_KEY)).toBeUndefined();
  mkdirSync('evidence/theme-engine/production', { recursive: true });
  await page.locator('#complete-theme').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'evidence/theme-engine/production/nebula-space.png' });
  writeFileSync('evidence/theme-engine/production/verification.json', JSON.stringify({ themes: ['original', ...COMPLETE_THEMES.map(theme => theme.id)], mainPlayback: true, mainSaveReload: true, previewSaveIsolated: true, originalBlue: true, shaderErrors: errors }, null, 2));
  expect(errors).toEqual([]);
});

test('promotion preserves existing custom appearances and captures an unthemed blue Original', async ({ page }) => {
  await page.goto('./');
  const custom = { ...original, planet: '#123456', piano: '#aabbcc' };
  await page.evaluate(({ custom, lookKey, originalKey }) => {
    localStorage.setItem(lookKey, JSON.stringify(custom)); localStorage.removeItem(originalKey);
  }, { custom, lookKey: APPEARANCE_STORAGE_KEY, originalKey: PRODUCTION_ORIGINAL_LOOK_KEY });
  await page.reload();
  expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(custom);
  await expect(page.locator('#complete-theme')).toHaveValue('custom');
  await page.locator('#complete-theme').selectOption('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual({ ...custom, planet: '#5262e9' });
});

test('a saved complete theme cannot become the main Original snapshot', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(({ look, lookKey, originalKey }) => {
    localStorage.setItem(lookKey, JSON.stringify(look)); localStorage.removeItem(originalKey);
  }, { look: COMPLETE_THEMES[0].look, lookKey: APPEARANCE_STORAGE_KEY, originalKey: PRODUCTION_ORIGINAL_LOOK_KEY });
  await page.reload();
  await expect(page.locator('#complete-theme')).toHaveValue('nebula-space');
  await page.locator('#complete-theme').selectOption('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(original);
});
