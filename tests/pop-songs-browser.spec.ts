import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { POP_SONGS } from '../src/core/popSongs';

for (const song of POP_SONGS.filter(song=>['P04','P05'].includes(song.id))) test(`${song.id}: ${song.title} loads from Favorites - Chords and plays the complete cover passage`,async ({page}) => {
  test.setTimeout(45000);
  const errors: string[] = [], failures: string[] = [];
  page.on('pageerror',error => errors.push(String(error)));
  page.on('response',response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');
  await page.waitForFunction(() => (window as any).__bongo?.slots.length === 92);
  const menu = page.getByLabel('Preset',{exact:true});
  await expect(menu.locator('optgroup[label="Favorites - Chords"] option')).toHaveCount(11);
  await expect(menu.locator('optgroup[label="Favorites - Simple"] option')).toHaveCount(7);
  const look = await page.evaluate(() => (window as any).__bongo.look.get());
  await menu.selectOption(song.id);
  await expect.poll(() => page.evaluate(() => (window as any).__bongo.scene.pieces[0]?.id)).toBe(`${song.id}-source-0`);
  expect(await page.evaluate(() => (window as any).__bongo.status?.running ?? false)).toBe(false);
  expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(look);
  await expect(page.locator('#tempo-label')).toHaveText(`${song.bpm} BPM`);
  const expected = await page.evaluate(() => (window as any).__bongo.scene.pieces.filter((piece:any) => piece.kind === 'note').map((piece:any) => piece.id).sort());
  await page.locator('#play').click();
  await page.waitForFunction(ids => {
    const app = (window as any).__bongo, heard = new Set(app.events.filter((event:any) => event.type === 'onset').map((event:any) => event.trigger.nodeId));
    return ids.every((id:string) => heard.has(id));
  },expected,{timeout:24000});
  const result = await page.evaluate(async () => {
    const app = (window as any).__bongo, audio = app.audio, analyser = audio.context.createAnalyser();
    analyser.fftSize = 4096; audio.node.connect(analyser);
    let peak = 0;
    for (let attempt = 0; attempt < 8; attempt++) {
      const pcm = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(pcm);
      for (const sample of pcm) peak = Math.max(peak,Math.abs(sample));
      await new Promise(resolve => setTimeout(resolve,25));
    }
    audio.node.disconnect(analyser);
    return {peak,status:app.status,heard:[...new Set(app.events.filter((event:any) => event.type === 'onset').map((event:any) => event.trigger.nodeId))].sort()};
  });
  expect(result.heard).toEqual(expected); expect(result.peak).toBeGreaterThan(.0001);
  expect(result.status.running).toBe(true); expect(result.status.stolenVoices).toBe(0); expect(result.status.lateDrops).toBe(0);
  expect(errors).toEqual([]); expect(failures).toEqual([]);
  mkdirSync('evidence/pop-music',{recursive:true});
  writeFileSync(`evidence/pop-music/${song.id}-browser.json`,JSON.stringify({song:song.title,scope:'Actual browser AudioWorklet output, no subjective listening claim',...result,errors,failures},null,2) + '\n');
  if (song.id === 'P03') await page.screenshot({path:'evidence/pop-music/bohemian-rhapsody.png'});
  await page.locator('#play').click();
  await expect.poll(() => page.evaluate(() => (window as any).__bongo.status.activeVoices)).toBe(0);
});
