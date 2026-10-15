# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: capacity-browser.spec.ts >> real F09 phase edits overflow worklet capacity, fail closed and require explicit Play
- Location: tests/capacity-browser.spec.ts:7:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#audio-state')
Expected substring: "Pending event limit exceeded"
Received string:    "Paused"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('#audio-state') with timeout 5000ms
  - waiting for locator('#audio-state')
    14 × locator resolved to <span class="state" id="audio-state">Paused</span>
       - unexpected value "Paused"

```

```yaml
- text: Paused
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'node:fs';
  3  | 
  4  | const destination='evidence/step-05/capacity';
  5  | const receiver=async()=>await(await fetch('http://127.0.0.1:5418/state')).json() as any;
  6  | 
  7  | test('real F09 phase edits overflow worklet capacity, fail closed and require explicit Play',async({page})=>{
  8  |   test.setTimeout(30000);fs.mkdirSync(destination,{recursive:true});
  9  |   const browserErrors:string[]=[];page.on('pageerror',e=>browserErrors.push(e.message));
  10 |   await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);
  11 |   await page.locator('summary').click();await page.locator('#fixture').selectOption('F09');
  12 |   await expect.poll(async()=>page.evaluate(()=>(window as any).__bongo.scene.pieces.length)).toBe(92);
  13 |   const initialReceiver=await receiver();
  14 |   expect(initialReceiver.session).toBe('');expect(initialReceiver.activeVoices).toBe(0);
  15 |   await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status?.running);
  16 |   await page.waitForFunction(()=>(window as any).__bongo.events.some((e:any)=>e.type==='emission'));
  17 |   // Request future tempo while the current 40 BPM beat is still in progress.
  18 |   const result=await page.evaluate(async()=>{
  19 |     const b=(window as any).__bongo;
  20 |     const anchor=b.events.find((e:any)=>e.type==='emission').time;
  21 |     const requested=b.scene;requested.settings.bpm=180;b.edit(requested);
  22 |     const edits:any[]=[];const started=performance.now();
  23 |     for(let i=0;i<16&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');i++){
  24 |       const now=b.audio.now,elapsedBeat=(now-anchor)*40/60;
  25 |       // This is a legal phase slightly ahead of the actual audio clock. Each
  26 |       // edit is consumed by the real worklet, then its real emission is awaited.
  27 |       const phase=(elapsedBeat+.04)/8,scene=b.scene;
  28 |       if(phase>=1)throw Error('Capacity phase burst missed its first eight-beat cycle');
  29 |       scene.pieces.forEach((p:any)=>{if(p.kind==='generator')p.phase=phase;});
  30 |       const emissionCount=b.events.filter((e:any)=>e.type==='emission').length;
  31 |       b.edit(scene);
  32 |       const deadline=performance.now()+500;
  33 |       while(performance.now()<deadline&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')&&b.events.filter((e:any)=>e.type==='emission').length===emissionCount)await new Promise(r=>setTimeout(r,5));
  34 |       edits.push({index:i,actualAudioNow:now,anchor,derivedBeat:elapsedBeat,phase,status:b.status,audioState:b.audio.state,output:b.output,emissions:b.events.filter((e:any)=>e.type==='emission').length});
  35 |       if(b.audio.state==='error'&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded'))throw Error('A different processor failure interrupted the capacity burst');
  36 |     }
  37 |     return {anchor,edits,elapsedWallMs:performance.now()-started,events:b.events,status:b.status,audioState:b.audio.state,output:b.output};
  38 |   });
  39 |   fs.writeFileSync(`${destination}/phase-burst.json`,JSON.stringify({date:new Date().toISOString(),realAudioWorklet:true,capacitySpecificRemoteRelease:'Unmeasured: bridge remains disconnected to isolate worklet capacity from independent native socket backpressure.',initialReceiver,result},null,2)+'\n');
  40 |   expect(result.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')).toBe(true);
  41 |   await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
  42 |   await expect(page.locator('#play')).toHaveText('▶ Play');
  43 |   await page.waitForFunction(()=>(window as any).__bongo.status?.running===false&&(window as any).__bongo.status?.pending===0&&(window as any).__bongo.status?.activeVoices===0);
  44 |   await expect.poll(async()=>(await receiver()).session).toBe('');
  45 |   const stoppedReceiver=await receiver();expect(stoppedReceiver.pending).toBe(0);expect(stoppedReceiver.activeVoices).toBe(0);expect(stoppedReceiver.objects).toHaveLength(0);
  46 |   await page.waitForTimeout(5000);
  47 |   await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
  48 |   expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('error');
  49 |   await page.screenshot({path:`${destination}/persistent-capacity-error.png`});
  50 |   const failed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,output:b.output,audioState:b.audio.state,caption:document.querySelector('#audio-state')?.textContent};});
  51 |   const onsetCount=await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length);
  52 |   await page.locator('#enable').click();await page.waitForTimeout(150);
  53 |   await page.evaluate(()=>{const b=(window as any).__bongo,scene=b.scene;scene.pieces.find((p:any)=>p.kind==='note').timbre='triangle';b.edit(scene);});
  54 |   await page.waitForTimeout(300);
> 55 |   await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  56 |   expect(await page.evaluate(()=>(window as any).__bongo.status.running)).toBe(false);
  57 |   expect(await page.evaluate(()=>(window as any).__bongo.status.pending)).toBe(0);
  58 |   expect(await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length)).toBe(onsetCount);
  59 |   expect(await page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(false);
  60 |   await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status.running);
  61 |   const resumed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioNow:b.audio.now,scene:b.scene};});
  62 |   await page.waitForTimeout(2100);
  63 |   const later=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioNow:b.audio.now,scene:b.scene,audioState:b.audio.state};});
  64 |   const beatDelta=later.status.beat-resumed.status.beat,timeDelta=later.status.time-resumed.status.time,measuredBpm=beatDelta/timeDelta*60;
  65 |   expect(later.status.running).toBe(true);expect(measuredBpm).toBeCloseTo(180,4);expect(later.scene.settings.bpm).toBe(180);expect(browserErrors).toEqual([]);
  66 |   fs.writeFileSync(`${destination}/recovery.json`,JSON.stringify({date:new Date().toISOString(),failed,stoppedReceiver,resumed,later,beatDelta,timeDelta,measuredBpm,browserErrors},null,2)+'\n');
  67 |   await page.locator('#play').click();
  68 | });
  69 | 
```