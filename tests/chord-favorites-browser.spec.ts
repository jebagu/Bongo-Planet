import {test,expect} from '@playwright/test';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import type {Scene} from '../src/core/contracts';
import {loadLocalPreset} from './presetHelpers';

const evidence='evidence/chord-favorites';
const songs:{id:string;name:string}[]=JSON.parse(readFileSync('assets/chord-favorites.json','utf8'));
test.beforeEach(async({page})=>{
  // Other work in this checkout must not restart an audio audition through HMR.
  await page.routeWebSocket('ws://127.0.0.1:5417/**',socket=>socket.close());
  await page.goto('./');await page.waitForFunction(()=>(window as any).__bongo?.slots.length===92);
  mkdirSync(evidence,{recursive:true});
});

test('the menu separates simple favorites, chord favorites and the retained drum loops',async({page})=>{
  const menu=page.getByLabel('Preset',{exact:true});
  expect(await menu.locator('optgroup').evaluateAll(groups=>groups.map(g=>(g as HTMLOptGroupElement).label))).toEqual(['Favorites - Simple','Favorites - Chords','favorites - with loops','Drum Loops','Airy & Ambient','Minimal Routing']);
  await expect(menu.locator('hr')).toHaveCount(5);
  await expect(menu.locator('optgroup[label="Drum Loops"] option')).toHaveCount(3);
  await expect(menu.locator('optgroup[label="Favorites - Chords"] option')).toHaveCount(12);
  await expect(menu.locator('optgroup[label="Favorites - Simple"] option')).toHaveCount(7);
  for(const [id,name] of [['D04','Dub Drum Loop'],['D05','Afrobeat Drum Loop'],['DB03','Trapdoor — Half-Time Build']])await expect(menu.locator(`option[value="${id}"]`)).toHaveText(name);
  for(const id of ['C04','C05','P01','P02','P03','D01','D02','D03','DB01','DB02','DB04','DB05'])await expect(menu.locator(`option[value="${id}"]`)).toHaveCount(0);
  await menu.click();await page.screenshot({path:`${evidence}/preset-sections.png`});await page.keyboard.press('Escape');
});

for(const song of songs) {
  test(`${song.id}: ${song.name} sounds every layer in the real worklet`,async({page})=>{
    test.setTimeout(50000);
    const errors:string[]=[],failures:string[]=[];
    page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
    const look=await page.evaluate(()=>(window as any).__bongo.look.get());
    await loadLocalPreset(page,song.id);
    expect(await page.evaluate(()=>(window as any).__bongo.status?.running??false)).toBe(false);
    expect(await page.evaluate(()=>(window as any).__bongo.look.get())).toEqual(look);
    const written=JSON.parse(readFileSync(`public/fixtures/${song.id}.json`,'utf8')) as Scene;
    const sounding=written.pieces.filter(p=>p.kind==='note').map(p=>p.id).sort();
    await page.locator('#play').click();
    await page.waitForFunction(({ids})=>{
      const played=new Set((window as any).__bongo.events.filter((e:any)=>e.type==='onset').map((e:any)=>e.trigger.nodeId));
      return ids.every(id=>played.has(id));
    },{ids:sounding},{timeout:40000});
    const result=await page.evaluate(async()=>{
      const b=(window as any).__bongo,analyser=b.audio.context.createAnalyser();analyser.fftSize=4096;b.audio.node.connect(analyser);
      let peak=0;
      for(let i=0;i<10;i++) {
        const pcm=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(pcm);
        for(const sample of pcm)peak=Math.max(peak,Math.abs(sample));
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      b.audio.node.disconnect(analyser);
      return {peak,status:b.status,onsets:b.events.filter((e:any)=>e.type==='onset').map((e:any)=>e.trigger)};
    });
    expect(result.peak).toBeGreaterThan(.0001);expect(result.status.running).toBe(true);
    expect(result.status.stolenVoices).toBe(0);expect(result.status.lateDrops).toBe(0);
    const stack=written.pieces.filter(p=>p.kind==='note').reduce((map,p)=>map.set(p.vertex,[...(map.get(p.vertex)??[]),p.id]),new Map<number,string[]>());
    for(const ids of stack.values())if(ids.length>=3) {
      const first=result.onsets.filter((t:any)=>t.nodeId===ids[0]).map((t:any)=>t.onset);
      for(const id of ids)expect(result.onsets.filter((t:any)=>t.nodeId===id).map((t:any)=>t.onset)).toEqual(first);
    }
    expect(errors).toEqual([]);expect(failures).toEqual([]);
    writeFileSync(`${evidence}/${song.id}-browser.json`,JSON.stringify({id:song.id,name:song.name,scope:'Actual browser AudioWorklet output; physical listening is not claimed',...result,errors,failures},null,2));
    if(['C01','C03','C05'].includes(song.id))await page.screenshot({path:`${evidence}/${song.id}-playing.png`});
    await page.locator('#play').click();await expect.poll(()=>page.evaluate(()=>(window as any).__bongo.status.activeVoices)).toBe(0);
  });
}

test('a chord arrangement saves, imports and remains editable on a narrow view',async({page})=>{
  await loadLocalPreset(page,'C01');
  const before=await page.evaluate(()=>(window as any).__bongo.scene);
  await page.locator('#save').click();await page.locator('#clear').click();await page.locator('#restore').click();
  expect(await page.evaluate(()=>(window as any).__bongo.scene)).toEqual(before);
  const download=page.waitForEvent('download');await page.locator('#export-scene').click();await(await download).saveAs(`${evidence}/Bongo-Planet.json`);
  await page.locator('#clear').click();await page.locator('#file').setInputFiles(`${evidence}/Bongo-Planet.json`);
  expect(await page.evaluate(()=>(window as any).__bongo.scene)).toEqual(before);
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#reset-view').click();
  const target=await page.evaluate(()=>{
    const b=(window as any).__bongo;
    return b.view.getProjectedPieces().find((p:any)=>p.visible&&b.scene.pieces.filter((n:any)=>n.vertex===p.vertex).length===4&&p.y>250&&p.x>20&&p.x<innerWidth-20);
  });
  expect(target).toBeDefined();await page.mouse.click(target.x,target.y);
  await expect(page.locator('[data-stack-piece]')).toHaveCount(4);
  await page.locator('[data-stack-piece]').last().click();
  await expect(page.locator('.stack-context')).toContainText('4 / 4');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.selection-card').scrollIntoViewIfNeeded();await page.screenshot({path:`${evidence}/mobile-chord-editing.png`});
});
