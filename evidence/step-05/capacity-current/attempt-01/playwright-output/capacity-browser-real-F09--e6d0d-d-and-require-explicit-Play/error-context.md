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
      - button "▶ Play" [ref=e68] [cursor=pointer]
      - button "Enable sound" [ref=e69] [cursor=pointer]
      - generic [ref=e70]: Pending event limit exceeded; playback paused. Press Play to resume.
    - generic [ref=e71]:
      - text: Volume
      - slider "Volume" [ref=e72] [cursor=pointer]: "0.65"
    - generic [ref=e73]:
      - button "↶ Undo" [ref=e74] [cursor=pointer]
      - button "↷" [disabled] [ref=e75]
      - button "Clear" [ref=e76] [cursor=pointer]
      - button "Save" [ref=e77] [cursor=pointer]
      - button "Load" [ref=e78] [cursor=pointer]
      - button "Export" [ref=e79] [cursor=pointer]
      - button "Import" [ref=e80] [cursor=pointer]
  - group [ref=e81]:
    - generic "Instrument diagnostics Paused · 0 voices · 0 pending" [ref=e82] [cursor=pointer]:
      - text: Instrument diagnostics
      - generic [ref=e83]: Paused · 0 voices · 0 pending
    - generic [ref=e84]:
      - generic [ref=e85]: "{ \"transportBeat\": 0.708, \"audioTime\": 1.888, \"audibleTime\": 1.8555336666428248, \"selected\": null, \"pendingTriggers\": 0, \"activeVoices\": 0, \"audio\": { \"running\": false, \"beat\": 0.7084444444444441, \"time\": 1.88, \"session\": \"s2\", \"pending\": 0, \"sequence\": 5377, \"lateDrops\": 0, \"activeVoices\": 0, \"stolenVoices\": 0, \"lateDropsAudio\": 0, \"telemetryDrops\": 0 }, \"render\": { \"renderer\": \"WebGL2\", \"fpsLimit\": 60, \"frames\": 77, \"reducedMotion\": false, \"contextLost\": false, \"dragging\": null, \"selected\": null, \"destination\": null, \"triangles\": 69840, \"geometries\": 868, \"camera\": [ 0.3, 0.26000000000000034, 3.5 ], \"movingPieces\": 0, \"visualTime\": 1.8556336666666666 }, \"output\": { \"connected\": false, \"session\": \"a45da391-1d73-4fbf-93c5-5997da392d9e-idle-4\", \"uncertaintyMs\": null, \"clockSynchronization\": [], \"objects\": 84, \"buffered\": 0 } }"
      - generic [ref=e86]:
        - generic [ref=e87]:
          - text: Render rate
          - combobox "Render rate" [ref=e88]:
            - option "60" [selected]
            - option "15"
            - option "2"
        - button "Connect local bridge" [ref=e89] [cursor=pointer]
        - link "Open test receiver ↗" [ref=e90] [cursor=pointer]:
          - /url: http://127.0.0.1:5418/receiver
        - generic [ref=e91]: Disconnected
  - status: Pending event limit exceeded; playback paused. Press Play to resume.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'node:fs';
  3  | import { createHash } from 'node:crypto';
  4  | 
  5  | const destination=process.env.BONGO_CAPACITY_EVIDENCE_DIR??'evidence/step-05/capacity';
  6  | const receiver=async()=>await(await fetch('http://127.0.0.1:5418/state')).json() as any;
  7  | 
  8  | test('real F09 phase edits overflow worklet capacity, fail closed and require explicit Play',async({page})=>{
  9  |   test.setTimeout(30000);fs.mkdirSync(destination,{recursive:true});
  10 |   fs.copyFileSync('tests/capacity-browser.spec.ts',`${destination}/capacity-browser.spec.ts`);
  11 |   const browserErrors:string[]=[];page.on('pageerror',e=>browserErrors.push(e.message));
  12 |   const audioAdapterSourceSha256=createHash('sha256').update(fs.readFileSync('src/audio/AudioAdapter.ts')).digest('hex');
  13 |   const html=await(await page.request.get('http://127.0.0.1:5417/BongoPlanet/')).text(),asset=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1]).find(source=>!source.includes('@vite/client'))!;
  14 |   const servedBundleSha256=createHash('sha256').update(await(await page.request.get(asset)).body()).digest('hex');
  15 |   await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);
  16 |   await page.locator('summary').click();await page.locator('#fixture').selectOption('F09');
  17 |   await expect.poll(async()=>page.evaluate(()=>(window as any).__bongo.scene.pieces.length)).toBe(92);
  18 |   const initialReceiver=await receiver();
  19 |   expect(initialReceiver.session).toBe('');expect(initialReceiver.activeVoices).toBe(0);
  20 |   await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status?.running);
  21 |   await page.waitForFunction(()=>(window as any).__bongo.events.some((e:any)=>e.type==='emission'));
  22 |   // Request future tempo while the current 40 BPM beat is still in progress.
  23 |   const result=await page.evaluate(async()=>{
  24 |     const b=(window as any).__bongo;
  25 |     const anchor=b.events.find((e:any)=>e.type==='emission').time;
  26 |     const initialScene=b.scene,generators=initialScene.pieces.filter((p:any)=>p.kind==='generator');
  27 |     if(generators.length!==8||generators.some((p:any)=>p.period!==8||p.phase!==0)||initialScene.settings.bpm!==40)throw Error('F09 independent capacity oracle requires eight phase-zero eight-beat generators at40BPM');
  28 |     // The requested tempo becomes effective at beat1, not at request time.
  29 |     // Anchor and the declared40→180 BPM rule form an independent piecewise clock.
  30 |     const tempoBoundaryTime=anchor+60/40;
  31 |     const request={audioNow:b.audio.now,status:b.status};
  32 |     if(Math.max(request.audioNow,request.status.time)>=tempoBoundaryTime||request.status.beat>=1)throw Error('Future tempo request missed the first integer beat');
  33 |     const beatAt=(time:number)=>time<tempoBoundaryTime?(time-anchor)*40/60:1+(time-tempoBoundaryTime)*180/60;
  34 |     const requested=b.scene;requested.settings.bpm=180;b.edit(requested);
  35 |     const edits:any[]=[];const started=performance.now();
  36 |     for(let i=0;i<16&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');i++){
  37 |       const now=b.audio.now,statusBefore=b.status;
  38 |       const targetTime=Math.max(now,statusBefore.time)+.06,derivedBeat=beatAt(targetTime);
  39 |       const phase=(derivedBeat%8)/8,scene=b.scene;
  40 |       if(!Number.isFinite(phase)||phase<0||phase>=1||derivedBeat<=beatAt(Math.max(now,statusBefore.time)))throw Error('Capacity edit must target a legal future phase');
  41 |       scene.pieces.forEach((p:any)=>{if(p.kind==='generator')p.phase=phase;});
  42 |       const sequenceBefore=statusBefore.sequence;
  43 |       b.edit(scene);
  44 |       const matches=()=>b.events.filter((e:any)=>e.type==='emission'&&Math.abs(e.time-targetTime)<1e-6&&generators.some((p:any)=>p.id===e.generatorId));
  45 |       const deadline=performance.now()+500;
  46 |       while(performance.now()<deadline&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')&&matches().length<8)await new Promise(r=>setTimeout(r,5));
  47 |       const matched=matches();
  48 |       edits.push({index:i,actualAudioNow:now,anchor,tempoBoundaryTime,derivedBeat,targetTime,phase,statusBefore,sequenceBefore,matchedEmissions:matched,status:b.status,audioState:b.audio.state,output:b.output});
  49 |       if(b.audio.state==='error'&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded'))throw Error('A different processor failure interrupted the capacity burst');
  50 |     }
  51 |     return {anchor,request,tempoBoundaryTime,edits,elapsedWallMs:performance.now()-started,events:b.events,status:b.status,audioState:b.audio.state,output:b.output};
  52 |   });
  53 |   fs.writeFileSync(`${destination}/phase-burst.json`,JSON.stringify({date:new Date().toISOString(),realAudioWorklet:true,audioAdapterSourceSha256,asset,servedBundleSha256,capacitySpecificRemoteRelease:'Unmeasured: bridge remains disconnected to isolate worklet capacity from independent native socket backpressure.',initialReceiver,result},null,2)+'\n');
  54 |   expect(result.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')).toBe(true);
> 55 |   expect(result.edits.filter((edit:any)=>edit.status.running).every((edit:any)=>edit.matchedEmissions.length===8)).toBe(true);
     |                                                                                                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  56 |   const capacityResetIndex=result.events.findIndex((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');
  57 |   expect(result.events.slice(capacityResetIndex+1).some((e:any)=>e.type==='trigger')).toBe(false);
  58 |   await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
  59 |   await expect(page.locator('#play')).toHaveText('▶ Play');
  60 |   await page.waitForFunction(()=>(window as any).__bongo.status?.running===false&&(window as any).__bongo.status?.pending===0&&(window as any).__bongo.status?.activeVoices===0);
  61 |   await expect.poll(async()=>(await receiver()).session).toBe('');
  62 |   const stoppedReceiver=await receiver();expect(stoppedReceiver.pending).toBe(0);expect(stoppedReceiver.activeVoices).toBe(0);expect(stoppedReceiver.objects).toHaveLength(0);
  63 |   await page.waitForTimeout(5000);
  64 |   await expect(page.locator('#audio-state')).toContainText('Pending event limit exceeded');
  65 |   expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('error');
  66 |   await page.screenshot({path:`${destination}/persistent-capacity-error.png`});
  67 |   const failed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,output:b.output,audioState:b.audio.state,caption:document.querySelector('#audio-state')?.textContent};});
  68 |   const onsetCount=await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length);
  69 |   await page.locator('#enable').click();await page.waitForTimeout(150);
  70 |   await page.evaluate(()=>{const b=(window as any).__bongo,scene=b.scene;scene.pieces.find((p:any)=>p.kind==='note').timbre='triangle';b.edit(scene);});
  71 |   await page.waitForTimeout(300);
  72 |   expect(await page.evaluate(()=>(window as any).__bongo.status.running)).toBe(false);
  73 |   expect(await page.evaluate(()=>(window as any).__bongo.status.pending)).toBe(0);
  74 |   expect(await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length)).toBe(onsetCount);
  75 |   expect(await page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(false);
  76 |   const afterEnableEdit=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioState:b.audio.state,output:b.output,caption:document.querySelector('#audio-state')?.textContent};});
  77 |   await expect.soft(page.locator('#audio-state'),'Capacity explanation survives Enable and unrelated edit').toContainText('Pending event limit exceeded');
  78 |   await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status.running);
  79 |   // Requested tempo applies at its preserved next integer beat. Measure only
  80 |   // after that real boundary, rather than averaging the old/new-tempo interval.
  81 |   await page.waitForFunction(()=>(window as any).__bongo.status.beat>=1.5);
  82 |   const resumed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioNow:b.audio.now,scene:b.scene};});
  83 |   await page.waitForTimeout(2100);
  84 |   const later=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioNow:b.audio.now,scene:b.scene,audioState:b.audio.state};});
  85 |   const beatDelta=later.status.beat-resumed.status.beat,timeDelta=later.status.time-resumed.status.time,measuredBpm=beatDelta/timeDelta*60;
  86 |   expect(later.status.running).toBe(true);expect(measuredBpm).toBeCloseTo(180,4);expect(later.scene.settings.bpm).toBe(180);expect(browserErrors).toEqual([]);
  87 |   const servedBundleSha256AtEnd=createHash('sha256').update(await(await page.request.get(asset)).body()).digest('hex');expect(servedBundleSha256AtEnd).toBe(servedBundleSha256);
  88 |   fs.writeFileSync(`${destination}/recovery.json`,JSON.stringify({date:new Date().toISOString(),audioAdapterSourceSha256,asset,servedBundleSha256,servedBundleSha256AtEnd,failed,stoppedReceiver,afterEnableEdit,resumed,later,beatDelta,timeDelta,measuredBpm,browserErrors},null,2)+'\n');
  89 |   await page.locator('#play').click();
  90 | });
  91 | 
```