# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: capacity-browser.spec.ts >> real F09 phase edits overflow worklet capacity, fail closed and require explicit Play
- Location: tests/capacity-browser.spec.ts:8:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - link "◌ Bongo Planet A musical constellation" [ref=e4] [cursor=pointer]:
      - /url: ./
      - generic [ref=e5]: ◌
      - generic [ref=e6]:
        - text: Bongo Planet
        - generic [ref=e7]: A musical constellation
    - generic [ref=e8]: YOUR OWN LITTLE UNIVERSE
    - button "How to play ↗" [ref=e10] [cursor=pointer]
  - main [ref=e11]:
    - complementary [ref=e12]:
      - paragraph [ref=e13]: 01 / BUILD YOUR PATTERN
      - heading "Give your world a rhythm." [level=1] [ref=e14]: Give yourworld a rhythm.
      - paragraph [ref=e15]: Place a generator. Add a note.Let the distances make music.
      - generic [ref=e16]:
        - button "◎ Generator A silent, repeating pulse +" [ref=e17] [cursor=pointer]:
          - generic [ref=e18]: ◎
          - generic [ref=e19]:
            - text: Generator
            - generic [ref=e20]: A silent, repeating pulse
          - generic [ref=e21]: +
        - button "● Note A melody at every distance +" [ref=e22] [cursor=pointer]:
          - generic [ref=e23]: ●
          - generic [ref=e24]:
            - text: Note
            - generic [ref=e25]: A melody at every distance
          - generic [ref=e26]: +
        - button "◆ Beat A little weight and texture +" [ref=e27] [cursor=pointer]:
          - generic [ref=e28]: ◆
          - generic [ref=e29]:
            - text: Beat
            - generic [ref=e30]: A little weight and texture
          - generic [ref=e31]: +
      - paragraph [ref=e32]: Drag a piece onto a dot, or choose a piece and tap an open dot.
      - generic [ref=e33]:
        - generic [ref=e34]: Explore a constellation
        - combobox "Explore a constellation" [ref=e35]:
          - option "Your composition"
          - option "Empty world"
          - option "First pattern"
          - option "Equal-distance chord"
          - option "Distance phrase"
          - option "Overlapping cycles"
          - option "Edit during travel"
          - option "Dense scene"
          - option "Six directions"
          - option "Maximum workload"
          - option "Slow travel stress" [selected]
    - generic [ref=e36]:
      - generic [ref=e37]:
        - generic [ref=e38]: YOUR CONSTELLATION
        - generic [ref=e39]: Drag empty space to turn · Scroll to zoom
      - img "Bongo Planet sphere. Choose a piece, then tap an open slot; drag empty space to orbit." [ref=e41]
      - generic:
        - generic: ⊹
        - generic: Distance is a rhythm.Equal distances make a chord.
      - generic [ref=e42]:
        - generic [ref=e43]: 92 / 92 vertices
        - button "Orbit / select ↖" [ref=e44] [cursor=pointer]
    - complementary [ref=e45]:
      - paragraph [ref=e46]: 02 / SHAPE THE SOUND
      - generic [ref=e48]:
        - text: ◌
        - heading "Every dot is a possibility." [level=2] [ref=e49]: Every dot isa possibility.
        - paragraph [ref=e50]: Select a piece to tune it.Choose a palette piece to begin.
      - generic [ref=e51]:
        - generic [ref=e52]: The whole planet
        - generic [ref=e53]:
          - text: Tempo
          - generic [ref=e54]: 180 BPM
          - slider "Tempo 180 BPM" [ref=e55] [cursor=pointer]: "180"
        - generic [ref=e56]:
          - generic [ref=e57]:
            - text: Key
            - combobox "Key" [ref=e58]:
              - option "C" [selected]
              - option "C♯"
              - option "D"
              - option "D♯"
              - option "E"
              - option "F"
              - option "F♯"
              - option "G"
              - option "G♯"
              - option "A"
              - option "A♯"
              - option "B"
          - generic [ref=e59]:
            - text: Scale
            - combobox "Scale" [ref=e60]:
              - option "Major" [selected]
              - option "Minor"
              - option "Pentatonic"
        - generic [ref=e61]:
          - text: Pulse travel
          - generic [ref=e62]: 75%
          - slider "Pulse travel 75%" [ref=e63] [cursor=pointer]: "0.75"
        - generic [ref=e64]:
          - text: Rhythm grid
          - combobox "Rhythm grid" [ref=e65]:
            - option "Free / unquantized"
            - option "1/32 note"
            - option "1/16 note" [selected]
  - contentinfo [ref=e66]:
    - generic [ref=e67]:
      - button "Ⅱ Pause" [ref=e68] [cursor=pointer]
      - generic [ref=e69]: Playing · mono preview
    - generic [ref=e70]:
      - text: Volume
      - slider "Volume" [ref=e71] [cursor=pointer]: "0.65"
    - generic [ref=e72]:
      - button "↶ Undo" [ref=e73] [cursor=pointer]
      - button "↷" [disabled] [ref=e74]
      - button "Clear" [ref=e75] [cursor=pointer]
      - button "Save" [ref=e76] [cursor=pointer]
      - button "Load" [ref=e77] [cursor=pointer]
      - button "Export" [ref=e78] [cursor=pointer]
      - button "Import" [ref=e79] [cursor=pointer]
  - group [ref=e80]:
    - generic "Instrument diagnostics Playing · 64 voices · 189 pending" [ref=e81] [cursor=pointer]:
      - text: Instrument diagnostics
      - generic [ref=e82]: Playing · 64 voices · 189 pending
    - generic [ref=e83]:
      - generic [ref=e84]: "{ \"transportBeat\": 24.236, \"audioTime\": 9.536, \"audibleTime\": 9.508191999928474, \"selected\": null, \"pendingTriggers\": 189, \"activeVoices\": 64, \"audio\": { \"running\": true, \"beat\": 24.23600000000073, \"time\": 9.501333333333333, \"session\": \"s2\", \"pending\": 189, \"sequence\": 7392, \"lateDrops\": 0, \"activeVoices\": 64, \"stolenVoices\": 7139, \"lateDropsAudio\": 0, \"telemetryDrops\": 0 }, \"render\": { \"renderer\": \"WebGL2\", \"fpsLimit\": 60, \"frames\": 281, \"reducedMotion\": false, \"contextLost\": false, \"dragging\": null, \"selected\": null, \"destination\": null, \"triangles\": 69840, \"geometries\": 1967, \"camera\": [ 0.3, 0.26000000000000034, 3.5 ], \"movingPieces\": 0, \"visualTime\": 9.508191999928474 }, \"output\": { \"connected\": false, \"session\": \"db097e4a-c4d3-48aa-acbe-a03b70a84a68-s2-3\", \"uncertaintyMs\": null, \"clockSynchronization\": [], \"objects\": 84, \"buffered\": 0 } }"
      - generic [ref=e85]:
        - generic [ref=e86]:
          - text: Render rate
          - combobox "Render rate" [ref=e87]:
            - option "60" [selected]
            - option "15"
            - option "2"
        - button "Connect local bridge" [ref=e88] [cursor=pointer]
        - link "Open test receiver ↗" [ref=e89] [cursor=pointer]:
          - /url: http://127.0.0.1:5418/receiver
        - generic [ref=e90]: Disconnected
  - status: F09 loaded paused. Press Play.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'node:fs';
  3  | import { createHash } from 'node:crypto';
  4  | 
  5  | const destination='evidence/step-05/capacity';
  6  | const receiver=async()=>await(await fetch('http://127.0.0.1:5418/state')).json() as any;
  7  | 
  8  | test('real F09 phase edits overflow worklet capacity, fail closed and require explicit Play',async({page})=>{
  9  |   test.setTimeout(30000);fs.mkdirSync(destination,{recursive:true});
  10 |   const browserErrors:string[]=[];page.on('pageerror',e=>browserErrors.push(e.message));
  11 |   const audioAdapterSourceSha256=createHash('sha256').update(fs.readFileSync('src/audio/AudioAdapter.ts')).digest('hex');
  12 |   const html=await(await page.request.get('http://127.0.0.1:5417/BongoPlanet/')).text(),asset=html.match(/<script[^>]+src="([^"]+)"/)![1];
  13 |   const servedBundleSha256=createHash('sha256').update(await(await page.request.get(asset)).body()).digest('hex');
  14 |   await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);
  15 |   await page.locator('summary').click();await page.locator('#fixture').selectOption('F09');
  16 |   await expect.poll(async()=>page.evaluate(()=>(window as any).__bongo.scene.pieces.length)).toBe(92);
  17 |   const initialReceiver=await receiver();
  18 |   expect(initialReceiver.session).toBe('');expect(initialReceiver.activeVoices).toBe(0);
  19 |   await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status?.running);
  20 |   await page.waitForFunction(()=>(window as any).__bongo.events.some((e:any)=>e.type==='emission'));
  21 |   // Request future tempo while the current 40 BPM beat is still in progress.
  22 |   const result=await page.evaluate(async()=>{
  23 |     const b=(window as any).__bongo;
  24 |     const anchor=b.events.find((e:any)=>e.type==='emission').time;
  25 |     const requested=b.scene;requested.settings.bpm=180;b.edit(requested);
  26 |     const edits:any[]=[];const started=performance.now();
  27 |     for(let i=0;i<16&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');i++){
  28 |       const now=b.audio.now,elapsedBeat=(now-anchor)*40/60;
  29 |       // This is a legal phase slightly ahead of the actual audio clock. Each
  30 |       // edit is consumed by the real worklet, then its real emission is awaited.
  31 |       const phase=(elapsedBeat+.04)/8,scene=b.scene;
  32 |       if(phase>=1)throw Error('Capacity phase burst missed its first eight-beat cycle');
  33 |       scene.pieces.forEach((p:any)=>{if(p.kind==='generator')p.phase=phase;});
  34 |       const emissionCount=b.events.filter((e:any)=>e.type==='emission').length;
  35 |       b.edit(scene);
  36 |       const deadline=performance.now()+500;
  37 |       while(performance.now()<deadline&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')&&b.events.filter((e:any)=>e.type==='emission').length===emissionCount)await new Promise(r=>setTimeout(r,5));
  38 |       edits.push({index:i,actualAudioNow:now,anchor,derivedBeat:elapsedBeat,phase,status:b.status,audioState:b.audio.state,output:b.output,emissions:b.events.filter((e:any)=>e.type==='emission').length});
  39 |       if(b.audio.state==='error'&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded'))throw Error('A different processor failure interrupted the capacity burst');
  40 |     }
  41 |     return {anchor,edits,elapsedWallMs:performance.now()-started,events:b.events,status:b.status,audioState:b.audio.state,output:b.output};
  42 |   });
  43 |   fs.writeFileSync(`${destination}/phase-burst.json`,JSON.stringify({date:new Date().toISOString(),realAudioWorklet:true,audioAdapterSourceSha256,asset,servedBundleSha256,capacitySpecificRemoteRelease:'Unmeasured: bridge remains disconnected to isolate worklet capacity from independent native socket backpressure.',initialReceiver,result},null,2)+'\n');
> 44 |   expect(result.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')).toBe(true);
     |                                                                                              ^ Error: expect(received).toBe(expected) // Object.is equality
  45 |   const capacityResetIndex=result.events.findIndex((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');
  46 |   expect(result.events.slice(capacityResetIndex+1).some((e:any)=>e.type==='trigger')).toBe(false);
  47 |   await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
  48 |   await expect(page.locator('#play')).toHaveText('▶ Play');
  49 |   await page.waitForFunction(()=>(window as any).__bongo.status?.running===false&&(window as any).__bongo.status?.pending===0&&(window as any).__bongo.status?.activeVoices===0);
  50 |   await expect.poll(async()=>(await receiver()).session).toBe('');
  51 |   const stoppedReceiver=await receiver();expect(stoppedReceiver.pending).toBe(0);expect(stoppedReceiver.activeVoices).toBe(0);expect(stoppedReceiver.objects).toHaveLength(0);
  52 |   await page.waitForTimeout(5000);
  53 |   await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
  54 |   expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('error');
  55 |   await page.screenshot({path:`${destination}/persistent-capacity-error.png`});
  56 |   const failed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,output:b.output,audioState:b.audio.state,caption:document.querySelector('#audio-state')?.textContent};});
  57 |   const onsetCount=await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length);
  58 |   await page.locator('#enable').click();await page.waitForTimeout(150);
  59 |   await page.evaluate(()=>{const b=(window as any).__bongo,scene=b.scene;scene.pieces.find((p:any)=>p.kind==='note').timbre='triangle';b.edit(scene);});
  60 |   await page.waitForTimeout(300);
  61 |   expect(await page.evaluate(()=>(window as any).__bongo.status.running)).toBe(false);
  62 |   expect(await page.evaluate(()=>(window as any).__bongo.status.pending)).toBe(0);
  63 |   expect(await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length)).toBe(onsetCount);
  64 |   expect(await page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(false);
  65 |   const afterEnableEdit=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioState:b.audio.state,output:b.output,caption:document.querySelector('#audio-state')?.textContent};});
  66 |   await expect.soft(page.locator('#audio-state'),'Capacity explanation survives Enable and unrelated edit').toContainText('Pending event limit exceeded');
  67 |   await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status.running);
  68 |   // Requested tempo applies at its preserved next integer beat. Measure only
  69 |   // after that real boundary, rather than averaging the old/new-tempo interval.
  70 |   await page.waitForFunction(()=>(window as any).__bongo.status.beat>=1.5);
  71 |   const resumed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioNow:b.audio.now,scene:b.scene};});
  72 |   await page.waitForTimeout(2100);
  73 |   const later=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioNow:b.audio.now,scene:b.scene,audioState:b.audio.state};});
  74 |   const beatDelta=later.status.beat-resumed.status.beat,timeDelta=later.status.time-resumed.status.time,measuredBpm=beatDelta/timeDelta*60;
  75 |   expect(later.status.running).toBe(true);expect(measuredBpm).toBeCloseTo(180,4);expect(later.scene.settings.bpm).toBe(180);expect(browserErrors).toEqual([]);
  76 |   const servedBundleSha256AtEnd=createHash('sha256').update(await(await page.request.get(asset)).body()).digest('hex');expect(servedBundleSha256AtEnd).toBe(servedBundleSha256);
  77 |   fs.writeFileSync(`${destination}/recovery.json`,JSON.stringify({date:new Date().toISOString(),audioAdapterSourceSha256,asset,servedBundleSha256,servedBundleSha256AtEnd,failed,stoppedReceiver,afterEnableEdit,resumed,later,beatDelta,timeDelta,measuredBpm,browserErrors},null,2)+'\n');
  78 |   await page.locator('#play').click();
  79 | });
  80 | 
```