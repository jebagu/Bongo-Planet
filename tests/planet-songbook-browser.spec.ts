import { loadLocalPreset } from './presetHelpers';
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PLANET_SONGS } from '../src/core/songbook';

const root = 'evidence/songbook';
test.beforeEach(async ({page}) => {
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');
  await page.waitForFunction(() => (window as any).__bongo?.slots.length === 92);
  mkdirSync(root,{recursive:true});
});

test('all 20 new presets load paused and produce live sample audio', async ({page}) => {
  test.setTimeout(90000);
  const errors: string[] = [], failures: string[] = [], results: unknown[] = [];
  page.on('pageerror',error => errors.push(String(error)));
  page.on('response',response => {if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);});
  for (const song of PLANET_SONGS) {
    await loadLocalPreset(page,song.id);
    await page.waitForFunction(id => (window as any).__bongo.scene.pieces.some((piece: any) => piece.id.startsWith(`${id}-`)),song.id);
    expect(await page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBe(song.nodes);
    expect(await page.evaluate(() => (window as any).__bongo.status?.running ?? false)).toBe(false);
    const before = await page.evaluate(() => (window as any).__bongo.events.length);
    await page.getByRole('button',{name:'▶ Play',exact:true}).click();
    await page.waitForFunction(start => (window as any).__bongo.events.slice(start).filter((event: any) => event.type === 'onset').length >= 5,before);
    const result = await page.evaluate(async () => {
      const app = (window as any).__bongo, audio = app.audio;
      const analyser = audio.context.createAnalyser(); analyser.fftSize = 4096;
      audio.node.connect(analyser);
      let peak = 0;
      for (let attempt = 0; attempt < 8; attempt++) {
        const pcm = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(pcm);
        for (const value of pcm) peak = Math.max(peak,Math.abs(value));
        await new Promise(resolve => setTimeout(resolve,25));
      }
      audio.node.disconnect(analyser);
      return {peak,status:app.status,state:audio.state};
    });
    expect(result.peak).toBeGreaterThan(.0001);
    expect(result.status.running).toBe(true);
    expect(result.status.stolenVoices).toBe(0);
    expect(result.status.lateDrops).toBe(0);
    results.push({id:song.id,title:song.title,nodes:song.nodes,...result});
    await page.getByRole('button',{name:'Ⅱ Pause',exact:true}).click();
    await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.status.activeVoices)).toBe(0);
  }
  expect(errors).toEqual([]); expect(failures).toEqual([]);
  writeFileSync(`${root}/live-audio.json`,JSON.stringify({scope:'Real browser AudioWorklet output; no physical listening claim',results,errors,failures},null,2));
});

for (const song of PLANET_SONGS.filter(song => song.nodes === 92)) {
  test(`${song.id}: all 92 nodes are occupied and all 88 instrument nodes play in the browser`, async ({page}) => {
    await loadLocalPreset(page,song.id);
    await page.waitForFunction(id => (window as any).__bongo.scene.pieces[0]?.id.startsWith(id),song.id);
    const scene = await page.evaluate(() => (window as any).__bongo.scene);
    expect(scene.pieces.map((piece: any) => piece.vertex).sort((a: number,b: number) => a-b)).toEqual(Array.from({length:92},(_,i) => i));
    const before = await page.evaluate(() => (window as any).__bongo.events.length);
    await page.locator('#play').click();
    await page.waitForFunction(start => new Set((window as any).__bongo.events.slice(start).filter((event: any) => event.type === 'onset').map((event: any) => event.trigger.nodeId)).size === 88,before,{timeout:12000});
    const result = await page.evaluate(start => {
      const app = (window as any).__bongo;
      return {status:app.status,playedNodes:[...new Set(app.events.slice(start).filter((event: any) => event.type === 'onset').map((event: any) => event.trigger.nodeId))]};
    },before);
    expect(result.status.running).toBe(true);
    expect(result.status.stolenVoices).toBe(0);
    expect(result.status.lateDrops).toBe(0);
    writeFileSync(`${root}/${song.id}-all-nodes.json`,JSON.stringify(result,null,2));
    if (song.id === 'S17') await page.screenshot({path:`${root}/all-92-nodes.png`});
    await page.locator('#play').click();
    await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.status.activeVoices)).toBe(0);
    await page.locator('#save').click();
    await page.locator('#clear').click();
    await page.locator('#restore').click();
    expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(scene);
    expect(await page.evaluate(() => (window as any).__bongo.status.running)).toBe(false);
  });
}
