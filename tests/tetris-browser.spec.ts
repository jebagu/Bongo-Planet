import { loadLocalPreset } from './presetHelpers';
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { appScene } from './browser-support';
import { tetrisSongScene } from '../src/core/tetris';

const root='evidence/tetris';
for(const [id,bpm,expressive] of [['S43',75,false],['R-S43',82,true]] as const) {
  test(`${id}: all 92 nodes, full journey, clean restart and portable file`,async({page})=>{
    test.setTimeout(60000);
    mkdirSync(root,{recursive:true});
    const errors:string[]=[],failures:string[]=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('response',response=>{if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`);});
    await page.goto('http://127.0.0.1:5417/BongoPlanet/');
    await page.waitForFunction(()=>(window as any).__bongo?.slots.length===92);
    await loadLocalPreset(page,id);
    await expect.poll(()=>page.evaluate(()=>(window as any).__bongo.scene.pieces.length)).toBe(92);
    const expected=appScene(tetrisSongScene(id,bpm,expressive));
    expect(await page.evaluate(()=>(window as any).__bongo.scene)).toEqual(expected);
    expect(await page.evaluate(()=>(window as any).__bongo.status?.running??false)).toBe(false);
    const sourceSlot=await page.evaluate(()=>(window as any).__bongo.slots[44]);
    await page.mouse.click(sourceSlot.x,sourceSlot.y);
    await expect(page.getByLabel('Spark interval',{exact:true})).toHaveValue('24');
    await expect(page.getByLabel('Spark travel',{exact:true})).toHaveValue('91');
    await page.getByRole('button',{name:'▶ Play',exact:true}).click();
    await page.waitForFunction(()=>{
      const onsets=(window as any).__bongo.events.filter((event:any)=>event.type==='onset');
      return onsets.length>=94;
    },undefined,{timeout:30000});
    const result=await page.evaluate(async()=>{
      const app=(window as any).__bongo,audio=app.audio;
      const analyser=audio.context.createAnalyser();analyser.fftSize=4096;audio.node.connect(analyser);
      let peak=0;
      for(let attempt=0;attempt<10;attempt++) {
        const pcm=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(pcm);
        for(const value of pcm)peak=Math.max(peak,Math.abs(value));
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      audio.node.disconnect(analyser);
      return {peak,status:app.status,onsets:app.events.filter((event:any)=>event.type==='onset').map((event:any)=>({
        nodeId:event.trigger.nodeId,onset:event.trigger.onset,emission:event.trigger.emission,
      }))};
    });
    expect(result.peak).toBeGreaterThan(.0001);
    expect(result.status.running).toBe(true);
    expect(result.status.lateDrops).toBe(0);
    expect(result.status.stolenVoices).toBe(0);
    expect(result.status.gatedEdges).toBeLessThanOrEqual(1);
    const first=result.onsets.slice(0,91),second=result.onsets.slice(91);
    expect(new Set(first.map((hit:any)=>hit.nodeId)).size).toBe(91);
    expect(new Set(first.map((hit:any)=>hit.nodeId))).toEqual(new Set(expected.pieces.filter(piece=>piece.kind==='note').map(piece=>piece.id)));
    const start=first[0].onset,hop=15/bpm;
    first.forEach((hit:any,index:number)=>expect(hit.onset-start).toBeCloseTo(index*hop,7));
    expect(second[0].nodeId).toBe(first[0].nodeId);
    expect(second[0].onset-start).toBeCloseTo(24*60/bpm,7);
    expect(errors).toEqual([]);expect(failures).toEqual([]);
    await page.getByRole('button',{name:'Ⅱ Pause',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>(window as any).__bongo.status.activeVoices)).toBe(0);
    await page.screenshot({path:`${root}/${id}-full-planet.png`});
    const downloadPromise=page.waitForEvent('download');
    await page.locator('#export-scene').click();
    const download=await downloadPromise;
    await download.saveAs(`${root}/${id}-export.json`);
    await page.getByLabel('Preset',{exact:true}).selectOption('F00');
    await page.locator('#file').setInputFiles(`${root}/${id}-export.json`);
    await expect.poll(()=>page.evaluate(()=>(window as any).__bongo.scene.pieces.length)).toBe(92);
    expect(await page.evaluate(()=>(window as any).__bongo.scene)).toEqual(expected);
    expect(await page.evaluate(()=>(window as any).__bongo.status.running)).toBe(false);
    writeFileSync(`${root}/${id}-browser.json`,JSON.stringify({id,nodes:92,soundingNodes:91,loopSeconds:24*60/bpm,...result,errors,failures},null,2)+'\n');
  });
}
