import {loadFixture,clearPlanet,connectOutput,disconnectOutput,renderFPS,appScene} from './browser-support';
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const destination=process.env.BONGO_CAPACITY_EVIDENCE_DIR??'evidence/step-05/capacity';
const receiver=async()=>await(await fetch('http://127.0.0.1:5418/state')).json() as any;

test('real F09 phase edits overflow worklet capacity, fail closed and require explicit Play',async({page})=>{
  test.setTimeout(30000);fs.mkdirSync(destination,{recursive:true});
  fs.copyFileSync('tests/capacity-browser.spec.ts',`${destination}/capacity-browser.spec.ts`);
  const browserErrors:string[]=[];page.on('pageerror',e=>browserErrors.push(e.message));
  const audioAdapterSourceSha256=createHash('sha256').update(fs.readFileSync('src/audio/AudioAdapter.ts')).digest('hex');
  const html=await(await page.request.get('http://127.0.0.1:5417/BongoPlanet/')).text(),asset=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1]).find(source=>!source.includes('@vite/client'))!;
  const servedBundleSha256=createHash('sha256').update(await(await page.request.get(asset)).body()).digest('hex');
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);
  await loadFixture(page,'F09');
  await expect.poll(async()=>page.evaluate(()=>(window as any).__bongo.scene.pieces.length)).toBe(92);
  const initialReceiver=await receiver();
  expect(initialReceiver.session).toBe('');expect(initialReceiver.activeVoices).toBe(0);
  await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.status?.running);
  await page.waitForFunction(()=>(window as any).__bongo.events.some((e:any)=>e.type==='emission'));
  // Request future tempo while the current 40 BPM beat is still in progress.
  const result=await page.evaluate(async()=>{
    const b=(window as any).__bongo;
    const anchor=b.events.find((e:any)=>e.type==='emission').time;
    const initialScene=b.scene,generators=initialScene.pieces.filter((p:any)=>p.kind==='generator');
    if(generators.length!==8||generators.some((p:any)=>p.period!==8||p.phase!==0)||initialScene.settings.bpm!==40)throw Error('F09 independent capacity oracle requires eight phase-zero eight-beat generators at40BPM');
    // The requested tempo becomes effective at beat1, not at request time.
    // Anchor and the declared40→180 BPM rule form an independent piecewise clock.
    const tempoBoundaryTime=anchor+60/40;
    const request={audioNow:b.audio.now,status:b.status};
    if(Math.max(request.audioNow,request.status.time)>=tempoBoundaryTime||request.status.beat>=1)throw Error('Future tempo request missed the first integer beat');
    const beatAt=(time:number)=>time<tempoBoundaryTime?(time-anchor)*40/60:1+(time-tempoBoundaryTime)*180/60;
    const requested=b.scene;requested.settings.bpm=180;b.edit(requested);
    const edits:any[]=[];const started=performance.now();
    for(let i=0;i<16&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');i++){
      const now=b.audio.now,statusBefore=b.status;
      const targetTime=Math.max(now,statusBefore.time)+.06,derivedBeat=beatAt(targetTime);
      const phase=(derivedBeat%8)/8,scene=b.scene;
      if(!Number.isFinite(phase)||phase<0||phase>=1||derivedBeat<=beatAt(Math.max(now,statusBefore.time)))throw Error('Capacity edit must target a legal future phase');
      scene.pieces.forEach((p:any)=>{if(p.kind==='generator')p.phase=phase;});
      const sequenceBefore=statusBefore.sequence;
      b.edit(scene);
      const matches=()=>b.events.filter((e:any)=>e.type==='emission'&&Math.abs(e.time-targetTime)<1e-6&&generators.some((p:any)=>p.id===e.generatorId));
      const deadline=performance.now()+500;
      while(performance.now()<deadline&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')&&matches().length<8)await new Promise(r=>setTimeout(r,5));
      const matched=matches();
      edits.push({index:i,actualAudioNow:now,anchor,tempoBoundaryTime,derivedBeat,targetTime,phase,statusBefore,sequenceBefore,matchedEmissions:matched,capacityResetObserved:b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded'),status:b.status,audioState:b.audio.state,output:b.output});
      if(b.audio.state==='error'&&!b.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded'))throw Error('A different processor failure interrupted the capacity burst');
    }
    return {anchor,request,tempoBoundaryTime,edits,elapsedWallMs:performance.now()-started,events:b.events,status:b.status,audioState:b.audio.state,output:b.output};
  });
  fs.writeFileSync(`${destination}/phase-burst.json`,JSON.stringify({date:new Date().toISOString(),realAudioWorklet:true,audioAdapterSourceSha256,asset,servedBundleSha256,capacitySpecificRemoteRelease:'Unmeasured: bridge remains disconnected to isolate worklet capacity from independent native socket backpressure.',initialReceiver,result},null,2)+'\n');
  expect(result.events.some((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded')).toBe(true);
  expect(result.edits.filter((edit:any)=>!edit.capacityResetObserved).every((edit:any)=>edit.matchedEmissions.length===8)).toBe(true);
  const capacityResetIndex=result.events.findIndex((e:any)=>e.type==='reset'&&e.reason==='pending limit exceeded');
  expect(result.events.slice(capacityResetIndex+1).some((e:any)=>e.type==='trigger')).toBe(false);
  await expect(page.locator('#notice')).toContainText(/pending.*limit exceeded/i);
  await expect(page.locator('#play')).toHaveText('▶ Play');
  await page.waitForFunction(()=>(window as any).__bongo.status?.running===false&&(window as any).__bongo.status?.pending===0&&(window as any).__bongo.status?.activeVoices===0);
  await expect.poll(async()=>(await receiver()).session).toBe('');
  const stoppedReceiver=await receiver();expect(stoppedReceiver.pending).toBe(0);expect(stoppedReceiver.activeVoices).toBe(0);expect(stoppedReceiver.objects).toHaveLength(0);
  await page.waitForTimeout(5000);
  await expect(page.locator('#notice')).toContainText(/pending.*limit exceeded/i);
  expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('error');
  await page.screenshot({path:`${destination}/persistent-capacity-error.png`});
  const failed=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,output:b.output,audioState:b.audio.state,caption:document.querySelector('#audio-state')?.textContent};});
  const onsetCount=await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length);
  await page.evaluate(()=>(window as any).__bongo.audio.enable());await page.waitForTimeout(150);
  await page.evaluate(()=>{const b=(window as any).__bongo,scene=b.scene;scene.pieces.find((p:any)=>p.kind==='note').timbre='triangle';b.edit(scene);});
  await page.waitForTimeout(300);
  expect(await page.evaluate(()=>(window as any).__bongo.status.running)).toBe(false);
  expect(await page.evaluate(()=>(window as any).__bongo.status.pending)).toBe(0);
  expect(await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length)).toBe(onsetCount);
  expect(await page.evaluate(()=>(window as any).__bongo.output.connected)).toBe(false);
  const afterEnableEdit=await page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,audioState:b.audio.state,output:b.output,caption:document.querySelector('#audio-state')?.textContent};});
  await expect.soft(page.locator('#notice'),'Capacity explanation survives Enable and unrelated edit').toContainText(/pending.*limit exceeded/i);
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
