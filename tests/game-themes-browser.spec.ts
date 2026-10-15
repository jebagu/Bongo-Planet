import { loadLocalPreset } from './presetHelpers';
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GAME_THEMES } from '../src/core/gameThemes';

const root = 'evidence/game-themes';
test.beforeEach(async ({page}) => {
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');
  await page.waitForFunction(() => (window as any).__bongo?.slots.length === 92);
  mkdirSync(root, {recursive: true});
});

for (const song of GAME_THEMES) {
  test(`${song.id}: ${song.title} loads paused and plays every instrument in the browser`, async ({page}) => {
    const errors: string[] = [], failures: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => {if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);});
    const menu = page.getByLabel('Preset', {exact: true});
    await expect(menu.locator('optgroup[label="Video game themes"] option')).toHaveCount(0);
    await expect(menu.locator('optgroup[label="Favorites - Simple"] option[value="S43"]')).toHaveText('Tetris — Type A (Korobeiniki)');
    await loadLocalPreset(page,song.id);
    await page.waitForFunction(id => (window as any).__bongo.scene.pieces[0]?.id.startsWith(id), song.id);
    const before = await page.evaluate(() => {
      const app = (window as any).__bongo;
      return {scene: app.scene, running: app.status?.running ?? false, appearance: app.look.get()};
    });
    expect(before.scene.pieces).toHaveLength(song.nodes);
    expect(before.running).toBe(false);
    const sounds = before.scene.pieces.filter((piece: any) => piece.kind === 'note').map((piece: any) => piece.id).sort();
    await page.getByRole('button', {name: '▶ Play', exact: true}).click();
    await page.waitForFunction(count => new Set((window as any).__bongo.events
      .filter((event: any) => event.type === 'onset').map((event: any) => event.trigger.nodeId)).size === count, sounds.length);
    const result = await page.evaluate(async () => {
      const app = (window as any).__bongo, audio = app.audio;
      const analyser = audio.context.createAnalyser(); analyser.fftSize = 4096; audio.node.connect(analyser);
      let peak = 0;
      for (let attempt = 0; attempt < 8; attempt++) {
        const pcm = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(pcm);
        for (const value of pcm) peak = Math.max(peak, Math.abs(value));
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      audio.node.disconnect(analyser);
      return {peak, status: app.status, played: [...new Set(app.events.filter((event: any) => event.type === 'onset')
        .map((event: any) => event.trigger.nodeId))].sort()};
    });
    expect(result.played).toEqual(sounds);
    expect(result.peak).toBeGreaterThan(.0001);
    expect(result.status.running).toBe(true);
    expect(result.status.stolenVoices).toBe(0);
    expect(result.status.lateDrops).toBe(0);
    expect(errors).toEqual([]); expect(failures).toEqual([]);
    writeFileSync(`${root}/${song.id}-browser.json`, JSON.stringify({id: song.id, title: song.title,
      scope: 'Actual browser AudioWorklet output; musical listening remains a human judgment', ...result, errors, failures}, null, 2));
    if (song.id === 'S41') await page.screenshot({path: `${root}/mario-playing.png`});
    await page.getByRole('button', {name: 'Ⅱ Pause', exact: true}).click();
    await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.status.activeVoices)).toBe(0);
    await page.locator('#save').click();
    await page.locator('#clear').click();
    await page.locator('#restore').click();
    expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(before.scene);
    expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(before.appearance);
    expect(await page.evaluate(() => (window as any).__bongo.status.running)).toBe(false);
  });
}
