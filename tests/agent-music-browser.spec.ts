import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
// Read the actual downloadable example, without importing browser art modules into Node.
const starterComposition = () => JSON.parse(readFileSync('Agent-Guide.md', 'utf8').match(/```json\n([\s\S]*?)\n```/)![1]);

const evidence = 'evidence/ai-music-page';
const scene = (page: Page) => page.evaluate(() => (window as any).__bongo.scene);
const look = (page: Page) => page.evaluate(() => (window as any).__bongo.look.get());
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context }) => {
  function trackErrors(target: Page) {
    const messages: string[] = []; errors.set(target, messages);
    target.on('pageerror', error => messages.push(String(error)));
  }
  trackErrors(page);
  context.on('page', trackErrors);
  await page.goto('./');
  await page.waitForFunction(() => (window as any).__bongo?.view.getDiagnostics().frames > 2);
  await mkdir(evidence, {recursive: true});
});
test.afterEach(async ({context}) => {
  for (const page of context.pages()) expect(errors.get(page)).toEqual([]);
});

async function openGuide(page: Page) {
  const opened = page.waitForEvent('popup');
  await page.locator('#ai-music').click();
  const guide = await opened;
  await expect(guide).toHaveURL(/\/BongoPlanet\/ai-music\/$/);
  await expect(guide.locator('#agent-prompt')).toHaveValue(/bongo-planet-composition/);
  return guide;
}

test('preset and look dropdowns match while AI music is a page link on desktop and mobile', async ({page}) => {
  const styles = await page.locator('#fixture, #complete-theme').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return [style.height, style.borderRadius, style.borderWidth, style.backgroundImage, style.color, style.fontFamily, style.fontSize, style.fontWeight, style.padding];
  }));
  expect(styles).toHaveLength(2); expect(styles[1]).toEqual(styles[0]);
  await expect(page.getByRole('link', {name:'AI setup and music guide (opens in a new tab)',exact:true})).toHaveAttribute('href', '/BongoPlanet/ai-music/');
  await expect(page.getByRole('link', {name:'FAQ (opens in a new tab)',exact:true})).toHaveAttribute('href', '/BongoPlanet/ai-music/#faq-title');
  expect(await page.locator('#ai-music').getAttribute('aria-expanded')).toBeNull();
  expect(await page.locator('#ai-music').evaluate(element => getComputedStyle(element).backgroundImage)).toBe('none');
  await expect(page.locator('#ai-music-guide, #music-request, #agent-prompt')).toHaveCount(0);
  await expect(page.locator('#complete-theme')).toBeVisible();
  for (const size of [{width:1440,height:1000}, {width:390,height:844}]) {
    await page.setViewportSize(size);
    await expect(page.locator('#complete-theme')).toBeVisible();
    await expect(page.locator('.theme-experiment-controls button, .theme-experiment-controls details')).toHaveCount(0);
    await page.locator('#complete-theme').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`${evidence}/looks-${size.width}.png`});
  }
});

test('the prompt copies the current guide and downloads a valid music-and-look starter', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read','clipboard-write'], {origin:'http://127.0.0.1:5417'});
  const originalScene = await scene(page), originalLook = await look(page);
  const guidePage = await openGuide(page);
  await expect(guidePage).toHaveTitle('Write music with AI — Bongo Planet');
  await expect(guidePage.getByRole('heading', {name:'How the planet works',exact:true})).toBeVisible();
  await expect(guidePage.locator('#sphere, .palette, canvas')).toHaveCount(0);
  expect(await guidePage.evaluate(() => '__bongo' in window)).toBe(false);
  await expect(guidePage.locator('#agent-faq summary')).toHaveCount(9);
  expect(await scene(page)).toEqual(originalScene); expect(await look(page)).toEqual(originalLook);
  await guidePage.screenshot({path:`${evidence}/ai-page-desktop.png`});
  await guidePage.locator('#music-request').fill('A kalimba melody with glass chords, a peach sky, and lightning sparks.');
  const prompt = await guidePage.locator('#agent-prompt').inputValue();
  expect(prompt).toContain('A kalimba melody with glass chords');
  expect(prompt).toContain('bongo-planet-composition');
  expect(prompt).toContain('scene.version: 2');
  expect(prompt).toContain('appearance');
  expect(prompt).toContain(readFileSync('Agent-Guide.md', 'utf8'));
  await guidePage.locator('#copy-agent-prompt').click();
  await expect(guidePage.locator('#agent-copy-status')).toContainText('Prompt copied');
  expect(await guidePage.evaluate(() => navigator.clipboard.readText())).toBe(prompt);
  await guidePage.locator('#copy-agent-prompt').scrollIntoViewIfNeeded();
  await guidePage.screenshot({path:`${evidence}/agent-guide-desktop.png`});
  const guideDownload = guidePage.waitForEvent('download'); await guidePage.locator('#download-agent-guide').click();
  const guide = await guideDownload;
  expect(guide.suggestedFilename()).toBe('Bongo-Planet-Agent-Guide.md');
  expect(await readFile((await guide.path())!, 'utf8')).toBe(readFileSync('Agent-Guide.md','utf8'));
  const starterDownload = guidePage.waitForEvent('download'); await guidePage.locator('#download-agent-starter').click();
  const starter = await starterDownload;
  expect(starter.suggestedFilename()).toBe('Bongo-Planet-Starter.json');
  const file = JSON.parse(await readFile((await starter.path())!, 'utf8'));
  expect(file).toEqual(starterComposition());
  await page.locator('#file').setInputFiles((await starter.path())!);
  await expect.poll(async () => (await scene(page)).pieces.length).toBe(4);
  expect(await scene(page)).toEqual(file.scene); expect(await look(page)).toEqual(file.appearance);
  expect(await page.evaluate(() => (window as any).__bongo.status?.running ?? false)).toBe(false);
  await page.locator('#play').click();
  await expect.poll(async () => await page.evaluate(() => (window as any).__bongo.events.filter((event:any) => event.type==='onset').length)).toBeGreaterThanOrEqual(3);
  await page.locator('#play').click();
  await guidePage.setViewportSize({width:390,height:844});
  await guidePage.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  expect(await guidePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await guidePage.screenshot({path:`${evidence}/ai-page-mobile.png`});
  await guidePage.locator('#music-request').scrollIntoViewIfNeeded();
  await guidePage.screenshot({path:`${evidence}/agent-guide-mobile.png`});
  await guidePage.close();
  await expect(page).toHaveURL('http://127.0.0.1:5417/BongoPlanet/');
  expect(await scene(page)).toEqual(file.scene); expect(await look(page)).toEqual(file.appearance);
});

test('failed clipboard copy selects the complete prompt for manual copying', async ({page}) => {
  const guide = await openGuide(page);
  await guide.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', {value: async () => {throw Error('Blocked');}}));
  await guide.locator('#copy-agent-prompt').click();
  await expect(guide.locator('#agent-copy-status')).toContainText('prompt is selected');
  const selection = await guide.locator('#agent-prompt').evaluate((element: HTMLTextAreaElement) => ({start:element.selectionStart,end:element.selectionEnd,length:element.value.length}));
  expect(selection.start).toBe(0); expect(selection.end).toBe(selection.length);
});

test('the guide loads and reloads directly, with all navigation returning to the planet', async ({page}) => {
  await page.goto('ai-music/');
  await expect(page.getByRole('heading', {level:1})).toHaveText('Write music with AI.');
  await expect(page.locator('#agent-prompt')).toHaveValue(/Planet neighbor map/);
  await page.reload();
  await expect(page.locator('#agent-faq summary')).toHaveCount(9);
  for (const link of await page.locator('.brand, .return-link, footer a').all()) {
    await expect(link).toHaveAttribute('href', '/BongoPlanet/');
  }
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('save load export and import restore current music and look together, rejecting a bad half atomically', async ({page}) => {
  const file = starterComposition();
  file.appearance.sparkStyle = 'lightning'; file.appearance.planet = '#aabbcc';
  await page.locator('#file').setInputFiles({name:'AI-Composition.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file))});
  await expect.poll(async () => (await look(page)).sparkStyle).toBe('lightning');
  const savedScene = await scene(page), savedLook = await look(page);
  await page.locator('#save').click();
  const downloadEvent = page.waitForEvent('download'); await page.locator('#export-scene').click();
  const exported = await downloadEvent;
  const exportedText = await readFile((await exported.path())!, 'utf8');
  expect(JSON.parse(exportedText)).toMatchObject({format:'bongo-planet-composition',version:1,scene:savedScene,appearance:savedLook});
  await page.evaluate(() => { const b=(window as any).__bongo; const next=b.scene; next.pieces=[]; b.edit(next); b.look.set({...b.look.get(),planet:'#ffffff',sparkStyle:'white'}); });
  await page.reload(); await page.waitForFunction(() => (window as any).__bongo);
  await page.locator('#restore').click(); expect(await scene(page)).toEqual(savedScene); expect(await look(page)).toEqual(savedLook);
  const bad = JSON.parse(exportedText); bad.scene.pieces=[]; bad.appearance.switches.icon='bad';
  await page.locator('#file').setInputFiles({name:'bad-look.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  await expect(page.locator('#notice')).toContainText('Import failed');
  expect(await scene(page)).toEqual(savedScene); expect(await look(page)).toEqual(savedLook);
  const badRoute = JSON.parse(exportedText); badRoute.scene.wiring=[{vertex:44,exits:[44]}]; badRoute.appearance.planet='#ffffff';
  await page.locator('#file').setInputFiles({name:'bad-route.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(badRoute))});
  await expect(page.locator('#notice')).toContainText('Import failed');
  expect(await scene(page)).toEqual(savedScene); expect(await look(page)).toEqual(savedLook);
  await page.evaluate(() => { const b=(window as any).__bongo; const next=b.scene; next.pieces=[]; b.edit(next); b.look.set({...b.look.get(),planet:'#ffffff'}); });
  await page.locator('#file').setInputFiles({name:'Bongo-Planet.json',mimeType:'application/json',buffer:Buffer.from(exportedText)});
  expect(await scene(page)).toEqual(savedScene); expect(await look(page)).toEqual(savedLook);
  expect(await page.evaluate(() => (window as any).__bongo.status?.running ?? false)).toBe(false);
});
