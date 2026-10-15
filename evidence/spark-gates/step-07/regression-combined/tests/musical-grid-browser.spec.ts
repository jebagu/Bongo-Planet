import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { emptyScene, newPiece, type EngineEvent, type Scene } from '../src/core/contracts';

const evidence = 'evidence/musical-grid';
async function events(page: Page): Promise<EngineEvent[]> { return page.evaluate(() => (window as any).__bongo.events); }
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto('./'); await page.waitForFunction(() => (window as any).__bongo?.view.getDiagnostics().frames > 2);
  mkdirSync(evidence, { recursive: true });
  (page as any).gridErrors = errors;
});
test.afterEach(async ({ page }) => { expect((page as any).gridErrors).toEqual([]); });

test('unequal struts produce a simultaneous chord in the live AudioWorklet', async ({ page }) => {
  await page.locator('#fixture').selectOption('F16'); await page.locator('#play').click();
  await expect.poll(async () => (await events(page)).filter(e => e.type === 'onset').length).toBe(3);
  await page.locator('#play').click();
  const trace = await events(page), emission = trace.find(e => e.type === 'emission')!;
  if (emission.type !== 'emission') throw Error('Missing emission');
  const played = trace.filter(e => e.type === 'onset').map(e => e.trigger);
  expect(played.map(t => Number((t.onset - emission.time).toFixed(9)))).toEqual([.125, .25, .25]);
  expect(played[1].onset).toBe(played[2].onset);
  writeFileSync(`${evidence}/live-chord.json`, JSON.stringify(trace, null, 2));
});

test('independent source phases and a live tempo edit retain one musical grid', async ({ page }) => {
  const scene: Scene = { ...emptyScene(), wiring: [{ vertex: 0, exits: [1] }, { vertex: 10, exits: [1] }], pieces: [
    { ...newPiece('generator', 0, 'one'), period: 1, travel: 1 },
    { ...newPiece('generator', 10, 'two'), period: 2, phase: .13, travel: 1 }, newPiece('note', 1, 'note'),
  ] };
  await page.evaluate(s => (window as any).__bongo.load(s), scene); await page.locator('#play').click();
  await expect.poll(async () => (await events(page)).filter(e => e.type === 'onset').length).toBeGreaterThanOrEqual(2);
  await page.locator('#tempo').evaluate((input: HTMLInputElement) => { input.value = '60'; input.dispatchEvent(new Event('change', { bubbles: true })); });
  await expect.poll(async () => (await events(page)).filter(e => e.type === 'emission').length).toBeGreaterThanOrEqual(7);
  await page.locator('#play').click();
  const trace = await events(page), emissions = trace.filter(e => e.type === 'emission'), edit = trace.find(e => e.type === 'edit-accepted');
  expect(edit?.type).toBe('edit-accepted'); if (edit?.type !== 'edit-accepted') throw Error('Missing tempo edit');
  const epoch = emissions[0].time, changeBeat = Math.floor((edit.time - epoch) * 2 + 1e-9) + 1, changeTime = epoch + changeBeat / 2;
  expect(emissions.filter(e => e.generatorId === 'two')[0].time - epoch).toBeCloseTo(.125, 9);
  expect(emissions.some(e => e.periodSeconds === 1 && e.generatorId === 'one')).toBe(true);
  for (const time of [...emissions.map(e => e.time), ...trace.filter(e => e.type === 'onset').map(e => e.trigger.onset)]) {
    const beat = time <= changeTime ? (time - epoch) * 2 : changeBeat + time - changeTime;
    expect(beat * 4).toBeCloseTo(Math.round(beat * 4), 8);
  }
  for (const { edge } of trace.filter(e => e.type === 'edge')) expect(edge.arrival - edge.departure).toBeCloseTo(edge.departure < changeTime - 1e-9 ? .125 : .25, 9);
  writeFileSync(`${evidence}/live-tempo-and-phases.json`, JSON.stringify({ epoch, changeBeat, changeTime, trace }, null, 2));
});

test('equal-hop audible schedules survive 60, 15 and 2 render FPS', async ({ page }) => {
  const timelines: number[][] = [];
  for (const fps of [60, 15, 2]) {
    await page.locator('#fixture').selectOption('F15');
    const before = (await events(page)).length;
    await page.evaluate(fps => (window as any).__bongo.view.setFPS(fps), fps); await page.locator('#play').click();
    await expect.poll(async () => (await events(page)).slice(before).filter(e => e.type === 'onset').length).toBe(3);
    await page.locator('#play').click();
    const trace = (await events(page)).slice(before), emission = trace.find(e => e.type === 'emission')!;
    if (emission.type !== 'emission') throw Error('Missing emission');
    timelines.push(trace.filter(e => e.type === 'onset').map(e => Number((e.trigger.onset - emission.time).toFixed(9))));
  }
  expect(timelines).toEqual([[.125, .25, .375], [.125, .25, .375], [.125, .25, .375]]);
  writeFileSync(`${evidence}/render-fps-timelines.json`, JSON.stringify(timelines, null, 2));
});
