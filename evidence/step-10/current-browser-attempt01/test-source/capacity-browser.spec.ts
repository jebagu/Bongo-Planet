import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const destination='evidence/step-05/capacity';
const receiver=async()=>await(await fetch('http://127.0.0.1:5418/state')).json() as any;

test('real F09 phase edits overflow worklet capacity, fail closed and require explicit Play',async({page})=>{
  test.setTimeout(30000);fs.mkdirSync(destination,{recursive:true});
  const browserErrors:string[]=[];page.on('pageerror',e=>browserErrors.push(e.message));
  const audioAdapterSourceSha256=createHash('sha256').update(fs.readFileSync('src/audio/AudioAdapter.ts')).digest('hex');
  const html=await(await page.request.get('http://127.0.0.1:5417/BongoPlanet/')).text(),asset=html.match(/<script[^>]+src="([^"]+)"/)![1];
  const servedBundleSha256=createHash('sha256').update(await(await page.request.get(asset)).body()).digest('hex');
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);
  await page.locator('summary').click();await page.locator('#fixture').selectOption('F09');
  await expect.poll(async()=>page.evaluate(()=>(window as any).__bongo.scene.pieces.length)).toBe(92);
  const initialReceiver=await receiver();
  expect(initialReceiver.session).toBe('');expect(initialReceiver.activeVoices).toBe(0);
  await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status?.running);
  await page.waitForFunction(()=>(window as any).__bongo.events.some((e:any)=>e.type==='emission'));
  // Request future tempo while the current 40 BPM beat is still in progress.
  const result=await page.evaluate(async()=>{
    const b=(window as any).__bongo;
    const anchor=b.events.find((e:any)=>e.type==='emission').time;
    const requested=b.scene;requested.settings.bpm=180;b.edit(requested);
    const edits:any[]=[];const started=performance.now();
    for(let i=0;i<16&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');i++){
      const now=b.audio.now,elapsedBeat=(now-anchor)*40/60;
      // This is a legal phase slightly ahead of the actual audio clock. Each
      // edit is consumed by the real worklet, then its real emission is awaited.
      const phase=(elapsedBeat+.04)/8,scene=b.scene;
      if(phase>=1)throw Error('Capacity phase burst missed its first eight-beat cycle');
      scene.pieces.forEach((p:any)=>{if(p.kind==='generator')p.phase=phase;});
      const emissionCount=b.events.filter((e:any)=>e.type==='emission').length;
      b.edit(scene);
      const deadline=performance.now()+500;
      while(performance.now()<deadline&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')&&b.events.filter((e:any)=>e.type==='emission').length===emissionCount)await new Promise(r=>setTimeout(r,5));
      edits.push({index:i,actualAudioNow:now,anchor,derivedBeat:elapsedBeat,phase,status:b.status,audioState:b.audio.state,output:b.output,emissions:b.events.filter((e:any)=>e.type==='emission').length});
      if(b.audio.state==='error'&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded'))throw Error('A different processor failure interrupted the capacity burst');
    }
    return {anchor,edits,elapsedWallMs:performance.now()-started,events:b.events,status:b.status,audioState:b.audio.state,output:b.output};
  });
  fs.writeFileSync(`${destination}/phase-burst.json`,JSON.stringify({date:new Date().toISOString(),realAudioWorklet:true,audioAdapterSourceSha256,asset,servedBundleSha256,capacitySpecificRemoteRelease:'Unmeasured: bridge remains disconnected to isolate worklet capacity from independent native socket backpressure.',initialReceiver,result},null,2)+'\n');
  expect(result.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')).toBe(true);
  const capacityResetIndex=result.events.findIndex((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');
  expect(result.events.slice(capacityResetIndex+1).some((e:any)=>e.type==='trigger')).toBe(false);
  await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
  await expect(page.locator('#play')).toHaveText('▶ Play');
  await page.waitForFunction(()=>(window as any).__bongo.status?.running===false&&(window as any).__bongo.status?.pending===0&&(window as any).__bongo.status?.activeVoices===0);
  await expect.poll(async()=>(await receiver()).session).toBe('');
  const stoppedReceiver=await receiver();expect(stoppedReceiver.pending).toBe(0);expect(stoppedReceiver.activeVoices).toBe(0);expect(stoppedReceiver.objects).toHaveLength(0);
  await page.waitForTimeout(5000);
  await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
  expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('error');
  await page.screenshot({path:`${destination}/persistent-capacity-error.png`});
  const failed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,output:b.output,audioState:b.audio.state,caption:document.querySelector('#audio-state')?.textContent};});
  const onsetCount=await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length);
  await page.locator('#enable').click();await page.waitForTimeout(150);
  await page.evaluate(()=>{const b=(window as any).__bongo,scene=b.scene;scene.pieces.find((p:any)=>p.kind==='note').timbre='triangle';b.edit(scene);});
  await page.waitForTimeout(300);
  expect(await page.evaluate(()=>(window as any).__bongo.status.running)).toBe(false);
  expect(await page.evaluate(()=>(window as any).__bongo.status.pending)).toBe(0);
  expect(await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length)).toBe(onsetCount);
  expect(await page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(false);
  const afterEnableEdit=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioState:b.audio.state,output:b.output,caption:document.querySelector('#audio-state')?.textContent};});
  await expect.soft(page.locator('#audio-state'),'Capacity explanation survives Enable and unrelated edit').toContainText('Pending event limit exceeded');
  await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status.running);
  // Requested tempo applies at its preserved next integer beat. Measure only
  // after that real boundary, rather than averaging the old/new-tempo interval.
  await page.waitForFunction(()=>(window as any).__bongo.status.beat>=1.5);
  const resumed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioNow:b.audio.now,scene:b.scene};});
  await page.waitForTimeout(2100);
  const later=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioNow:b.audio.now,scene:b.scene,audioState:b.audio.state};});
  const beatDelta=later.status.beat-resumed.status.beat,timeDelta=later.status.time-resumed.status.time,measuredBpm=beatDelta/timeDelta*60;
  expect(later.status.running).toBe(true);expect(measuredBpm).toBeCloseTo(180,4);expect(later.scene.settings.bpm).toBe(180);expect(browserErrors).toEqual([]);
  const servedBundleSha256AtEnd=createHash('sha256').update(await(await page.request.get(asset)).body()).digest('hex');expect(servedBundleSha256AtEnd).toBe(servedBundleSha256);
  fs.writeFileSync(`${destination}/recovery.json`,JSON.stringify({date:new Date().toISOString(),audioAdapterSourceSha256,asset,servedBundleSha256,servedBundleSha256AtEnd,failed,stoppedReceiver,afterEnableEdit,resumed,later,beatDelta,timeDelta,measuredBpm,browserErrors},null,2)+'\n');
  await page.locator('#play').click();
});
