import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ARCHIVED_COMPLETE_THEMES, ARCHIVED_LOOK_KEY, COMPLETE_THEMES, EXPERIMENT_LOOK_KEY, ORIGINAL_LOOK_KEY } from '../src/view/art/completeThemes';
import { APPEARANCE_STORAGE_KEY, validateAppearance } from '../src/view/art/appearance';
import { COMPOSITION_STORAGE_KEY } from '../src/compositionFile';
import capturedOriginal from '../assets/theme-experiment-original.json' with { type: 'json' };
import previousCatalog from '../assets/theme-engine/catalog-v1.json' with { type: 'json' };
import previousClearCatalog from '../assets/theme-engine/catalog-v4.json' with { type: 'json' };

const original = validateAppearance(capturedOriginal);

test('themes preserve live music, restore Original, isolate saves and survive reload', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /shader|WebGL|THREE/.test(message.text())) errors.push(message.text()); });
  await page.goto('./');
  await page.evaluate(({ appearance, compositionKey, lookKey, experimentKey, originalKey }) => {
    localStorage.setItem(lookKey, JSON.stringify(appearance));
    localStorage.setItem(compositionKey, 'MAIN SAVE MUST STAY UNCHANGED');
    localStorage.removeItem(experimentKey); localStorage.removeItem(originalKey);
  }, { appearance: original, compositionKey: COMPOSITION_STORAGE_KEY, lookKey: APPEARANCE_STORAGE_KEY, experimentKey: EXPERIMENT_LOOK_KEY, originalKey: ORIGINAL_LOOK_KEY });
  await page.goto('theme-experiment/');
  await expect(page.locator('#complete-theme')).toBeVisible();
  await expect(page.locator('#complete-theme')).toHaveValue('original');
  expect(await page.locator('#complete-theme option:not([hidden])').allTextContents()).toEqual(['Blue Marble', 'Nebula', 'Fireflies']);
  await page.locator('#fixture').selectOption('C02');
  await expect.poll(() => page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBeGreaterThan(5);
  const scene = await page.evaluate(() => (window as any).__bongo.scene);
  await page.getByRole('button', { name: 'Play', exact: false }).click();
  await expect(page.locator('#play')).toContainText('Pause');
  await expect.poll(() => page.evaluate(() => (window as any).__bongo.events.length)).toBeGreaterThan(2);
  mkdirSync('evidence/theme-engine', { recursive: true });
  await page.screenshot({ path: 'evidence/theme-engine/original.png' });
  for (const theme of COMPLETE_THEMES) {
    const eventsBefore = await page.evaluate(() => (window as any).__bongo.events.length);
    await page.locator('#complete-theme').selectOption(theme.id);
    await expect.poll(() => page.evaluate(() => (window as any).__bongo.view.getDiagnostics().frames)).toBeGreaterThan(1);
    expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
    await expect(page.locator('#play')).toContainText('Pause');
    await expect.poll(() => page.evaluate(() => (window as any).__bongo.events.length)).toBeGreaterThan(eventsBefore);
    expect(await page.evaluate(() => (window as any).__bongo.view.world.getObjectByName('Theme scenery').visible)).toBe(theme.id === 'nebula-space');
    if (theme.id === 'nebula-space') {
      await expect(page.locator('.star-field')).toBeHidden();
      await expect(page.locator('.theme-sky-decoration')).toHaveAttribute('data-decoration', 'distant-nebula');
      expect(await page.evaluate(() => {
        const scenery = (window as any).__bongo.view.world;
        return { distant: scenery.getObjectByName('Distant nebula sky').visible, old: scenery.getObjectByName('Theme nebula characters').visible };
      })).toEqual({ distant: true, old: false });
      expect(await page.evaluate(() => (window as any).__bongo.look.get().theme.atmosphere.backgroundBlur)).toBe(.6);
      await page.evaluate(() => { const b = (window as any).__bongo, look = b.look.get(); b.look.set({ ...look, theme: { ...look.theme, atmosphere: { ...look.theme.atmosphere, backgroundBlur: 0 } } }); });
      expect(await page.evaluate(() => (window as any).__bongo.look.get().theme.atmosphere.backgroundBlur)).toBe(0);
      await page.evaluate(() => { const b = (window as any).__bongo, look = b.look.get(); b.look.set({ ...look, theme: { ...look.theme, atmosphere: { ...look.theme.atmosphere, backgroundBlur: .6 } } }); });
      expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
    }
    if (theme.id === 'firefly-garden') {
      await expect(page.locator('.theme-fireflies i')).toHaveCount(72);
      await expect(page.locator('.theme-fireflies')).toBeVisible();
      const spark = page.locator('.theme-fireflies i').first();
      const transform = await spark.evaluate(element => getComputedStyle(element).transform);
      await expect.poll(() => spark.evaluate(element => getComputedStyle(element).transform)).not.toBe(transform);
      const flight = await spark.evaluate(element => {
        const animation = element.getAnimations().find(animation => (animation as CSSAnimation).animationName === 'theme-firefly-flight')!;
        const duration = Number(animation.effect!.getTiming().duration), time = animation.currentTime;
        animation.pause(); animation.currentTime = 0;
        const start = element.getBoundingClientRect();
        animation.currentTime = duration;
        const end = element.getBoundingClientRect();
        animation.currentTime = time; animation.play();
        return { duration, distance: Math.hypot(end.x - start.x, end.y - start.y) };
      });
      expect(flight.duration).toBeLessThan(12000);
      expect(flight.distance).toBeGreaterThan(40);
    }
    await page.screenshot({ path: `evidence/theme-engine/${theme.id}.png` });
  }
  await page.locator('#complete-theme').selectOption('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(original);
  expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
  await page.locator('#complete-theme').selectOption('nebula-space');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), APPEARANCE_STORAGE_KEY)).toBe(JSON.stringify(original));
  expect(await page.evaluate(key => localStorage.getItem(key), COMPOSITION_STORAGE_KEY)).toBe('MAIN SAVE MUST STAY UNCHANGED');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(`theme-experiment:${key}`)!).appearance.theme.id, COMPOSITION_STORAGE_KEY)).toBe('nebula-space');
  await page.reload();
  await expect(page.locator('#complete-theme')).toHaveValue('nebula-space');
  expect(await page.evaluate(() => (window as any).__bongo.look.get().theme.atmosphere.backgroundBlur)).toBe(.6);
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
  await page.goto('./');
  await expect(page.locator('#complete-theme')).toHaveValue('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(original);
  expect(errors).toEqual([]);
  writeFileSync('evidence/theme-engine/playback-verification.json', JSON.stringify({ themes: COMPLETE_THEMES.map(t => t.id), scenePreserved: true, playbackContinued: true, originalRestored: true, mainAppearanceUnchanged: true, mainCompositionSaveUnchanged: true, reloadPassed: true, shaderErrors: errors }, null, 2));
});

test('repeated switching stays bounded and respects reduced motion on a narrow screen', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 825, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('theme-experiment/');
  await page.locator('#fixture').selectOption('C02');
  await expect.poll(() => page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBeGreaterThan(5);
  for (const theme of COMPLETE_THEMES) {
    const frame = await page.evaluate(() => (window as any).__bongo.view.getDiagnostics().frames);
    await page.locator('#complete-theme').selectOption(theme.id);
    await expect.poll(() => page.evaluate(() => (window as any).__bongo.view.getDiagnostics().frames)).toBeGreaterThan(frame);
  }
  const warm = await page.evaluate(() => (window as any).__bongo.view.getDiagnostics());
  for (let cycle = 0; cycle < 3; cycle++) for (const theme of COMPLETE_THEMES) await page.locator('#complete-theme').selectOption(theme.id);
  const after = await page.evaluate(() => (window as any).__bongo.view.getDiagnostics());
  expect(after.reducedMotion).toBe(true);
  expect(after.contextLost).toBe(false);
  expect(after.geometries).toBeLessThanOrEqual(warm.geometries + 5);
  expect(after.textures).toBeLessThanOrEqual(warm.textures + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.theme-fireflies i').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.screenshot({ path: 'evidence/theme-engine/narrow-reduced-motion.png' });
  writeFileSync('evidence/theme-engine/stress-verification.json', JSON.stringify({ switches: COMPLETE_THEMES.length * 4, viewport: { width: 825, height: 1000 }, warm, after }, null, 2));
});

test('returning Nebula users see the new distant sky and can still restore Original', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(({ previous, original, lookKey, experimentKey }) => {
    localStorage.setItem(lookKey, JSON.stringify(original));
    localStorage.setItem(experimentKey, JSON.stringify(previous));
  }, { previous: previousClearCatalog.find(look => look.theme.id === 'nebula-space'), original, lookKey: APPEARANCE_STORAGE_KEY, experimentKey: EXPERIMENT_LOOK_KEY });
  await page.goto('theme-experiment/');
  await expect(page.locator('#complete-theme')).toHaveValue('nebula-space');
  expect(await page.evaluate(() => (window as any).__bongo.look.get().theme.atmosphere.decoration)).toBe('distant-nebula');
  await expect(page.locator('.star-field')).toBeHidden();
  await page.locator('#complete-theme').selectOption('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(original);
});

test('saved background focus stays crisp across reload without adding a Theme control', async ({ page }) => {
  await page.goto('theme-experiment/');
  await page.locator('#complete-theme').selectOption('nebula-space');
  await page.evaluate(() => { const b = (window as any).__bongo, look = b.look.get(); b.look.set({ ...look, theme: { ...look.theme, atmosphere: { ...look.theme.atmosphere, backgroundBlur: 0 } } }); });
  await page.reload();
  await expect(page.locator('#complete-theme')).toHaveValue('nebula-space');
  expect(await page.evaluate(() => (window as any).__bongo.look.get().theme.atmosphere.backgroundBlur)).toBe(0);
  expect(await page.evaluate(() => (window as any).__bongo.look.get().theme.atmosphere.backgroundBlur)).toBe(0);
  await page.evaluate(() => { const b = (window as any).__bongo, look = b.look.get(); b.look.set({ ...look, theme: { ...look.theme, atmosphere: { ...look.theme.atmosphere, backgroundBlur: .6 } } }); });
  await page.locator('#complete-theme').selectOption('firefly-garden');
  await expect(page.locator('#soft-background-focus')).toHaveCount(0);
  await page.locator('#complete-theme').selectOption('original');
  await expect(page.locator('#soft-background-focus')).toHaveCount(0);
});

test('retired browser presets restore Original, retain a backup, and remain importable as custom looks', async ({ page }) => {
  await page.goto('./');
  for (const archived of ARCHIVED_COMPLETE_THEMES) {
    const previous = previousCatalog.find(look => look.theme.id === archived.id)!;
    await page.evaluate(({ previous, original, experimentKey, originalKey }) => {
      localStorage.setItem(originalKey, JSON.stringify(original));
      localStorage.setItem(experimentKey, JSON.stringify(previous));
    }, { previous, original, experimentKey: EXPERIMENT_LOOK_KEY, originalKey: ORIGINAL_LOOK_KEY });
    await page.goto('theme-experiment/');
    await expect(page.locator('#complete-theme')).toHaveValue('original');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), ARCHIVED_LOOK_KEY)).toEqual(validateAppearance(previous));
    await page.evaluate(look => (window as any).__bongo.look.set(look), archived.look);
    await expect(page.locator('#complete-theme')).toHaveValue('custom');
    expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(archived.look);
    await page.locator('#complete-theme').selectOption('nebula-space');
    await expect(page.locator('#complete-theme')).toHaveValue('nebula-space');
  }
});

test('Original restores blue for a returning browser without rewriting the main saved look', async ({ page }) => {
  const previous = { ...original, planet: '#4e5b81' };
  await page.goto('./');
  await page.evaluate(({ previous, experimentKey, originalKey, mainKey }) => {
    localStorage.setItem(experimentKey, JSON.stringify(previous));
    localStorage.setItem(originalKey, JSON.stringify(previous));
    localStorage.setItem(mainKey, JSON.stringify(previous));
  }, { previous, experimentKey: EXPERIMENT_LOOK_KEY, originalKey: ORIGINAL_LOOK_KEY, mainKey: APPEARANCE_STORAGE_KEY });
  await page.goto('theme-experiment/');
  await expect(page.locator('#complete-theme')).toHaveValue('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get().planet)).toBe('#5262e9');
  await page.locator('#complete-theme').selectOption('nebula-space');
  await page.locator('#complete-theme').selectOption('original');
  expect(await page.evaluate(() => (window as any).__bongo.look.get().planet)).toBe('#5262e9');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).planet, APPEARANCE_STORAGE_KEY)).toBe('#4e5b81');
});

test('the North Pole sign stays fixed to the globe front when orbiting', async ({ page }) => {
  await page.goto('theme-experiment/');
  await expect.poll(() => page.evaluate(() => (window as any).__bongo.view.getDiagnostics().frames)).toBeGreaterThan(2);
  const pose = () => page.evaluate(() => {
    const view = (window as any).__bongo.view;
    const pole = view.world.getObjectByName('Bongo Planet North Pole');
    return { camera: view.getDiagnostics().camera, pole: pole.matrixWorld.toArray(), sign: pole.getObjectByName('North Pole sign').matrixWorld.toArray() };
  });
  await expect.poll(async () => (await pose()).camera.length).toBe(3);
  const before = await pose(), box = (await page.locator('#sphere canvas').boundingBox())!;
  await page.mouse.move(box.x + 8, box.y + box.height * .6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .45, box.y + box.height * .7, { steps: 20 });
  await page.mouse.up();
  await expect.poll(async () => Math.hypot(...(await pose()).camera.map((value: number, i: number) => value - before.camera[i]))).toBeGreaterThan(.1);
  const after = await pose();
  expect(after.pole).toEqual(before.pole);
  expect(after.sign).toEqual(before.sign);
});
