import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
// Read the actual downloadable example, without importing browser art modules into Node.
const starterComposition = () => JSON.parse(readFileSync('Agent-Guide.md', 'utf8').match(/```json\n([\s\S]*?)\n```/)![1]);

const evidence = 'evidence/ai-music';
const scene = (page: Page) => page.evaluate(() => (window as any).__bongo.scene);
const look = (page: Page) => page.evaluate(() => (window as any).__bongo.look.get());
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(String(error)));
  await page.goto('./');
  await page.waitForFunction(() => (window as any).__bongo?.view.getDiagnostics().frames > 2);
  await mkdir(evidence, {recursive: true});
});
test.afterEach(async ({page}) => expect(errors.get(page)).toEqual([]));

test('current dropdowns match and every look control is expanded on desktop and mobile', async ({page}) => {
  const styles = await page.locator('#fixture, #edit-look, #ai-music').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return [style.height, style.borderRadius, style.borderWidth, style.backgroundImage, style.color, style.fontFamily, style.fontSize, style.fontWeight, style.padding];
  }));
  expect(styles).toHaveLength(3); expect(styles[1]).toEqual(styles[0]); expect(styles[2]).toEqual(styles[0]);
  await expect(page.locator('#edit-look')).toHaveText('Edit look');
  await page.locator('#edit-look').click();
  await expect(page.locator('#look-editor details, #look-editor summary')).toHaveCount(0);
  for (const size of [{width:1440,height:1000}, {width:390,height:844}]) {
    await page.setViewportSize(size);
    await expect(page.getByRole('button', {name:'Planet: Apricot',exact:true})).toBeVisible();
    await expect(page.getByRole('button', {name:'Export look file',exact:true})).toBeVisible();
    await expect(page.getByRole('button', {name:'Import look file',exact:true})).toBeVisible();
    await page.locator('#edit-look').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`${evidence}/looks-${size.width}.png`});
  }
});

test('the prompt copies the current guide and downloads a valid music-and-look starter', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read','clipboard-write'], {origin:'http://127.0.0.1:5417'});
  await page.locator('#ai-music').click();
  await expect(page.locator('.project-controls #ai-music-guide')).toBeVisible();
  await page.locator('#music-request').fill('A kalimba melody with glass chords, a peach sky, and lightning sparks.');
  const prompt = await page.locator('#agent-prompt').inputValue();
  expect(prompt).toContain('A kalimba melody with glass chords');
  expect(prompt).toContain('bongo-planet-composition');
  expect(prompt).toContain('scene.version: 2');
  expect(prompt).toContain('appearance');
  expect(prompt).not.toMatch(/legacy|version-one|older files/i);
  await page.locator('#copy-agent-prompt').click();
  await expect(page.locator('#agent-copy-status')).toContainText('Prompt copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(prompt);
  await page.locator('#copy-agent-prompt').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${evidence}/agent-guide-desktop.png`});
  const guideDownload = page.waitForEvent('download'); await page.locator('#download-agent-guide').click();
  const guide = await guideDownload;
  expect(guide.suggestedFilename()).toBe('Bongo-Planet-Agent-Guide.md');
  expect(await readFile((await guide.path())!, 'utf8')).toBe(readFileSync('Agent-Guide.md','utf8'));
  const starterDownload = page.waitForEvent('download'); await page.locator('#download-agent-starter').click();
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
  await page.setViewportSize({width:390,height:844});
  await page.locator('#music-request').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:`${evidence}/agent-guide-mobile.png`});
  await page.locator('#close-ai-music').click(); await expect(page.locator('#ai-music-guide')).toBeHidden();
  await expect(page.locator('#ai-music')).toBeFocused();
});

test('failed clipboard copy selects the complete prompt for manual copying', async ({page}) => {
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', {value: async () => {throw Error('Blocked');}}));
  await page.locator('#ai-music').click(); await page.locator('#copy-agent-prompt').click();
  await expect(page.locator('#agent-copy-status')).toContainText('prompt is selected');
  const selection = await page.locator('#agent-prompt').evaluate((element: HTMLTextAreaElement) => ({start:element.selectionStart,end:element.selectionEnd,length:element.value.length}));
  expect(selection.start).toBe(0); expect(selection.end).toBe(selection.length);
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
