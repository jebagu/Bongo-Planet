# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reworked-songs-browser.spec.ts >> R-S27: Seven Nation Army plays every instrument with live audio and no dropped or stolen notes
- Location: tests/reworked-songs-browser.spec.ts:31:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5417/BongoPlanet/
Call log:
  - navigating to "http://127.0.0.1:5417/BongoPlanet/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
  3  | import {REWORKED_SONGS,REWORKED_PRESETS} from '../src/core/reworkedSongs';
  4  | import {EXAMPLES} from '../src/core/examples';
  5  | 
  6  | const root = 'evidence/reworked';
  7  | test.beforeEach(async ({page}) => {
  8  |   // Keep this playback audition stable while other chats edit the dev server.
  9  |   await page.routeWebSocket('ws://127.0.0.1:5417/**',socket => socket.close());
> 10 |   await page.goto('http://127.0.0.1:5417/BongoPlanet/');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5417/BongoPlanet/
  11 |   await page.waitForFunction(() => (window as any).__bongo?.slots.length === 92);
  12 |   mkdirSync(root,{recursive:true});
  13 | });
  14 | 
  15 | test('Reworked follows the unchanged favorites, has covers only, and keeps every earlier choice',async ({page}) => {
  16 |   const menu = page.getByLabel('Preset',{exact:true});
  17 |   expect(await menu.locator('optgroup').evaluateAll(groups => groups.map(group => (group as HTMLOptGroupElement).label)))
  18 |     .toEqual(['Favorites','Reworked','New classics','Video game themes','More presets']);
  19 |   await expect(menu.locator('hr')).toHaveCount(4);
  20 |   expect(await menu.locator('option[value]:not([value=""])').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value)))
  21 |     .toEqual(EXAMPLES.map(example => example.id));
  22 |   expect(await menu.locator('optgroup[label="Reworked"] option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value)))
  23 |     .toEqual(REWORKED_PRESETS.map(preset => preset.id));
  24 |   await menu.selectOption('S13');await page.waitForFunction(() => (window as any).__bongo.scene.pieces[0]?.id.startsWith('S13-'));
  25 |   expect(await page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBe(76);
  26 |   await menu.selectOption('F10');await page.waitForFunction(() => (window as any).__bongo.scene.pieces.length === 7);
  27 |   expect(await page.evaluate(() => (window as any).__bongo.scene.version)).toBe(1);
  28 | });
  29 | 
  30 | for (const song of REWORKED_SONGS) {
  31 |   test(`${song.id}: ${song.title} plays every instrument with live audio and no dropped or stolen notes`,async ({page}) => {
  32 |     const errors: string[] = [],failures: string[] = [];
  33 |     page.on('pageerror',error => errors.push(String(error)));
  34 |     page.on('response',response => {if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);});
  35 |     await page.getByLabel('Preset',{exact:true}).selectOption(song.id);
  36 |     await page.waitForFunction(id => (window as any).__bongo.scene.pieces[0]?.id.startsWith(`${id}-`),song.id);
  37 |     const before = await page.evaluate(() => {
  38 |       const app = (window as any).__bongo;return {scene:app.scene,appearance:app.look.get(),running:app.status?.running??false};
  39 |     });
  40 |     expect(before.running).toBe(false);expect(before.scene.settings.bpm).toBe(song.bpm);
  41 |     const sounds = before.scene.pieces.filter((piece: any) => piece.kind === 'note').map((piece: any) => piece.id).sort();
  42 |     await page.locator('#play').click();
  43 |     await page.waitForFunction(count => new Set((window as any).__bongo.events.filter((event: any) => event.type === 'onset')
  44 |       .map((event: any) => event.trigger.nodeId)).size === count,sounds.length,{timeout:Math.max(14000,song.period*60000/song.bpm+4000)});
  45 |     const result = await page.evaluate(async () => {
  46 |       const app = (window as any).__bongo,audio = app.audio;
  47 |       const analyser = audio.context.createAnalyser();analyser.fftSize=4096;audio.node.connect(analyser);
  48 |       let peak=0;
  49 |       for (let attempt=0;attempt<8;attempt++) {
  50 |         const pcm=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(pcm);
  51 |         for (const value of pcm) peak=Math.max(peak,Math.abs(value));
  52 |         await new Promise(resolve => setTimeout(resolve,25));
  53 |       }
  54 |       audio.node.disconnect(analyser);
  55 |       return {status:app.status,peak,played:[...new Set(app.events.filter((event: any) => event.type === 'onset').map((event: any) => event.trigger.nodeId))].sort()};
  56 |     });
  57 |     expect(result.played).toEqual(sounds);expect(result.peak).toBeGreaterThan(.0001);
  58 |     expect(result.status.running).toBe(true);expect(result.status.stolenVoices).toBe(0);expect(result.status.lateDrops).toBe(0);
  59 |     expect(errors).toEqual([]);expect(failures).toEqual([]);
  60 |     writeFileSync(`${root}/${song.id}-browser.json`,JSON.stringify({id:song.id,title:song.title,nodes:before.scene.pieces.length,
  61 |       bpm:song.bpm,scope:'Actual browser AudioWorklet output; musical preference remains a listening judgment',...result,errors,failures},null,2));
  62 |     if (['S13','S24','S33','S44'].includes(song.sourceId)) await page.screenshot({path:`${root}/${song.id}-playing.png`});
  63 |     await page.locator('#play').click();
  64 |     await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.status.activeVoices)).toBe(0);
  65 |     if (song.sourceId === 'S13') {
  66 |       await page.locator('#save').click();await page.locator('#fixture').selectOption('F00');await page.locator('#restore').click();
  67 |       expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(before.scene);
  68 |       expect(await page.evaluate(() => (window as any).__bongo.look.get())).toEqual(before.appearance);
  69 |       expect(await page.evaluate(() => (window as any).__bongo.status.running)).toBe(false);
  70 |       const inventory = JSON.parse(readFileSync('public/songs/reworked/index.json','utf8'));
  71 |       const track = inventory.tracks.find((track: {id:string}) => track.id === song.id);
  72 |       await page.locator('#file').setInputFiles(`public/songs/reworked/${track.file}`);
  73 |       await page.waitForFunction(id => (window as any).__bongo.scene.pieces[0]?.id.startsWith(`${id}-`),song.id);
  74 |       expect(await page.evaluate(() => (window as any).__bongo.scene)).toEqual(before.scene);
  75 |     }
  76 |   });
  77 | }
  78 | 
```