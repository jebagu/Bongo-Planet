import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { validateScene } from '../src/core/contracts';
import { labelPieces } from '../src/core/pieceLabels';
import { instrumentScene } from '../src/core/instruments';

const FAVORITE_EXAMPLES: {id: string}[] = ['favorite-presets.json','chord-favorites.json','pop-presets.json','drum-presets.json','drum-build-presets.json','ambient-presets.json','routing-presets.json','loop-favorites.json'].flatMap(name => JSON.parse(readFileSync(new URL(`../assets/${name}`, import.meta.url), 'utf8')));

/** Historical regression scenes remain local; exercise the ordinary Import UI. */
export async function loadLocalPreset(page: Page, id: string): Promise<void> {
  if (id === 'F00') {
    await page.locator('#clear').click();
    await expect.poll(() => page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBe(0);
    return;
  }
  const raw = readFileSync(`public/fixtures/${id}.json`);
  const expected = labelPieces(instrumentScene(validateScene(JSON.parse(raw.toString()))));
  if (FAVORITE_EXAMPLES.some(preset => preset.id === id)) {
    await page.getByLabel('Preset', { exact: true }).selectOption(id);
  } else {
    await page.locator('#file').setInputFiles({ name: `${id}.json`, mimeType: 'application/json', buffer: raw });
  }
  await expect.poll(() => page.evaluate(() => (window as any).__bongo.scene)).toEqual(expected);
}
