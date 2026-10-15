import { loadLocalPreset } from './presetHelpers';
import {test,expect} from '@playwright/test';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {REWORKED_SONGS} from '../src/core/reworkedSongs';
import {EXAMPLES} from '../src/core/examples';

const root = 'evidence/reworked';
test.beforeEach(async ({page}) => {
  // Keep this playback audition stable while other chats edit the dev server.
  await page.routeWebSocket('ws://127.0.0.1:5417/**',socket => socket.close());
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');
  await page.waitForFunction(() => (window as any).__bongo?.slots.length === 92);
  mkdirSync(root,{recursive:true});
});

test('only favorites are listed, with the reworked Prelude retained',async ({page}) => {
  const menu = page.getByLabel('Preset',{exact:true});
  expect(await menu.locator('optgroup').evaluateAll(groups => groups.map(group => (group as HTMLOptGroupElement).label)))
    .toEqual(['Favorites - Simple','Favorites - Chords','favorites - with loops','Drum Loops','Airy & Ambient','Minimal Routing']);
  await expect(menu.locator('hr')).toHaveCount(2);
  expect(await menu.locator('option[value]:not([value=""])').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value)))
    .toEqual(EXAMPLES.map(example => example.id));
  expect(await menu.locator('optgroup[label="Reworked"] option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value)))
    .toEqual([]);
  await menu.selectOption('S13');await page.waitForFunction(() => (window as any).__bongo.scene.pieces[0]?.id.startsWith('S13-'));
  expect(await page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBe(76);
  await menu.selectOption('F10');await page.waitForFunction(() => (window as any).__bongo.scene.pieces.length === 7);
  expect(await page.evaluate(() => (window as any).__bongo.scene.version)).toBe(1);
});

for (const song of REWORKED_SONGS) {
  test(`${song.id}: ${song.title} plays every instrument with live audio and no dropped or stolen notes`,async ({page}) => {
    const errors: string[] = [],failures: string[] = [];
    page.on('pageerror',error => errors.push(String(error)));
    page.on('response',response => {if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);});
    await loadLocalPreset(page,song.id);
    await page.waitForFunction(id => (window as any).__bongo.scene.pieces[0]?.id.startsWith(`${id}-`),song.id);
    const before = await page.evaluate(() => {
      const app = (window as any).__bongo;return {scene:app.scene,appearance:app.look.get(),running:app.status?.running??false};
    });
    expect(before.running).toBe(false);expect(before.scene.settings.bpm).toBe(song.bpm);
    const sounds = before.scene.pieces.filter((piece: any) => piece.kind === 'note').map((piece: any) => piece.id).sort();
    await page.locator('#play').click();
    await page.waitForFunction(count => new Set((window as any).__bongo.events.filter((event: any) => event.type === 'onset')
      .map((event: any) => event.trigger.nodeId)).size === count,sounds.length,{timeout:Math.max(14000,song.period*60000/song.bpm+4000)});
    const result = await page.evaluate(async () => {
      const app = (window as any).__bongo,audio = app.audio;
      const analyser = audio.context.createAnalyser();analyser.fftSize=4096;audio.node.connect(analyser);
      let peak=0;
      for (let attempt=0;attempt<8;attempt++) {
        const pcm=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(pcm);
        for (const value of pcm) peak=Math.max(peak,Math.abs(value));
        await new Promise(resolve => setTimeout(resolve,25));
      }
      audio.node.disconnect(analyser);
      return {status:app.status,peak,played:[...new Set(app.events.filter((event: any) => event.type === 'onset').map((event: any) => event.trigger.nodeId))].sort()};
    });
    expect(result.played).toEqual(sounds);expect(result.peak).toBeGreaterThan(.0001);
    expect(result.status.running).toBe(true);expect(result.status.stolenVoices).toBe(0);expect(result.status.lateDrops).toBe(0);
    expect(errors).toEqual([]);expect(failures).toEqual([]);
    writeFileSync(`${root}/${song.id}-browser.json`,JSON.stringify({id:song.id,title:song.title,nodes:before.scene.pieces.length,
      bpm:song.bpm,scope:'Actual browser AudioWorklet output; musical preference remains a listening judgment',...result,errors,failures},null,2));
    if (['S13','S24','S33','S44'].includes(song.sourceId)) await page.screenshot({path:`${root}/${song.id}-playing.png`});
    await page.locator('#play').click();
    await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.status.activeVoices)).toBe(0);
    if (song.sourceId === 'S13') {
      await page.locator('#save').click();await page.locator('#clear').click();await page.locator('#restore').click();
      expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(before.scene);
      expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(before.appearance);
      expect(await page.evaluate(() => (window as any).__bongo.status.running)).toBe(false);
      const inventory = JSON.parse(readFileSync('public/songs/reworked/index.json','utf8'));
      const track = inventory.tracks.find((track: {id:string}) => track.id === song.id);
      await page.locator('#file').setInputFiles(`public/songs/reworked/${track.file}`);
      await page.waitForFunction(id => (window as any).__bongo.scene.pieces[0]?.id.startsWith(`${id}-`),song.id);
      expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(before.scene);
    }
  });
}
