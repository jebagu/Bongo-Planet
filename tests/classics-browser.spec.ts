import { loadLocalPreset } from './presetHelpers';
import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {CLASSIC_SONGS} from '../src/core/classics';
import {EXAMPLES} from '../src/core/examples';

const root = 'evidence/classics';
test.beforeEach(async ({page}) => {
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');
  await page.waitForFunction(() => (window as any).__bongo?.slots.length === 92);
  mkdirSync(root,{recursive:true});
});

test('favorites have separate sections and local archived scenes still import',async ({page}) => {
  const menu = page.getByLabel('Preset',{exact:true});
  expect(await menu.locator('optgroup').evaluateAll(groups => groups.map(group => (group as HTMLOptGroupElement).label))).toEqual(['Favorites - Simple','Favorites - Chords','favorites - with loops','Drum Loops','Airy & Ambient','Minimal Routing']);
  await expect(menu.locator('hr')).toHaveCount(5);
  await expect(menu.locator('optgroup[label="Favorites - Simple"] option[value="R-S44"]')).toHaveText('Final Fantasy — Prelude · Reworked');
  await expect(menu.locator('optgroup[label="Favorites - Simple"] option[value="N01"]')).toHaveCount(0);
  await expect(menu.locator('option[value="N01"]')).toHaveCount(0);
  expect(await menu.locator('option[value]:not([value=""])').evaluateAll(options => options.slice(0,2).map(option => (option as HTMLOptionElement).value))).toEqual(['S13','F10']);
  await expect(menu.locator('option')).toHaveCount(EXAMPLES.length + 1);
  await menu.selectOption('S13');
  await page.waitForFunction(() => (window as any).__bongo.scene.pieces.length === 76);
  const canon = await page.evaluate(() => (window as any).__bongo.scene);
  await menu.selectOption('F10');
  await page.waitForFunction(() => (window as any).__bongo.scene.pieces.length === 7);
  const toy = await page.evaluate(() => (window as any).__bongo.scene);
  expect(toy.version).toBe(1); expect(canon.version).toBe(2);
  await loadLocalPreset(page,'S01');
  await page.waitForFunction(() => (window as any).__bongo.scene.pieces.length === 23);
  await page.locator('#clear').click();
  await page.waitForFunction(() => (window as any).__bongo.scene.pieces.length === 0);
  await menu.scrollIntoViewIfNeeded(); await menu.click();
  await page.screenshot({path:`${root}/presets-menu.png`});
  await page.keyboard.press('Escape');
});

for (const song of CLASSIC_SONGS) {
  test(`${song.id}: ${song.title} sounds every instrument node with no missing audio`,async ({page}) => {
    const errors: string[] = [],failures: string[] = [];
    page.on('pageerror',error => errors.push(String(error)));
    page.on('response',response => {if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);});
    await loadLocalPreset(page,song.id);
    await page.waitForFunction(id => (window as any).__bongo.scene.pieces[0]?.id.startsWith(id),song.id);
    const scene = await page.evaluate(() => (window as any).__bongo.scene);
    expect(scene.pieces.length).toBe(song.nodes);
    const sounds = scene.pieces.filter((piece: any) => piece.kind !== 'generator').map((piece: any) => piece.id).sort();
    expect(await page.evaluate(() => (window as any).__bongo.status?.running ?? false)).toBe(false);
    await page.locator('#play').click();
    await page.waitForFunction(expected => new Set((window as any).__bongo.events.filter((event: any) => event.type === 'onset').map((event: any) => event.trigger.nodeId)).size === expected,sounds.length,{timeout:14000});
    const result = await page.evaluate(async () => {
      const app = (window as any).__bongo,audio = app.audio;
      const analyser = audio.context.createAnalyser();analyser.fftSize = 4096;audio.node.connect(analyser);
      let peak = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        const pcm = new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(pcm);
        for (const value of pcm) peak = Math.max(peak,Math.abs(value));
        await new Promise(resolve => setTimeout(resolve,25));
      }
      audio.node.disconnect(analyser);
      return {status:app.status,peak,played:[...new Set(app.events.filter((event: any) => event.type === 'onset').map((event: any) => event.trigger.nodeId))].sort()};
    });
    expect(result.played).toEqual(sounds);expect(result.peak).toBeGreaterThan(.0001);
    expect(result.status.running).toBe(true);expect(result.status.stolenVoices).toBe(0);expect(result.status.lateDrops).toBe(0);
    expect(errors).toEqual([]);expect(failures).toEqual([]);
    writeFileSync(`${root}/${song.id}-browser.json`,JSON.stringify({id:song.id,title:song.title,nodes:song.nodes,scope:'Actual browser AudioWorklet output; no subjective listening claim',...result,errors,failures},null,2));
    if (['S23','S30','S33','S36','S40'].includes(song.id)) await page.screenshot({path:`${root}/${song.id}-playing.png`});
    await page.locator('#play').click();
    await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.status.activeVoices)).toBe(0);
    if (song.id === 'S21') {
      await page.locator('#save').click();await page.locator('#clear').click();await page.locator('#restore').click();
      expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
      expect(await page.evaluate(() => (window as any).__bongo.status.running)).toBe(false);
    }
  });
}
