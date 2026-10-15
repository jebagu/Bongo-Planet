import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import type { Scene } from '../src/core/contracts';
import { topology } from '../src/core/geometry';

const destination=path.resolve(process.env.BONGO_RECEIVER_EVIDENCE_DIR??'evidence/step-09/render-clock-qualification');
if(fs.existsSync(path.join(destination,'live-report.json'))||fs.existsSync(path.join(destination,'source-snapshot')))throw Error('Refusing to overwrite receiver evidence');
fs.mkdirSync(destination,{recursive:true});
const seconds=120;
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const percentile=(values:number[],p:number)=>[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]??0;
const state=async()=>await (await fetch('http://127.0.0.1:5418/state')).json() as any;
const hash=(file:string)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceFiles=['src/output/OutputAdapter.ts','src/output/protocol.ts','src/output/bridge.ts','src/output/RenderClock.ts','src/output/NativeClock.ts','src/output/ReceiverClock.ts','src/core/engine.ts','src/main.ts','src/audio/AudioAdapter.ts','src/audio/processor.ts','scripts/bridge-evidence.ts'];
const sourceSnapshotAtStart=Object.fromEntries(sourceFiles.map(file=>[file,hash(file)]));
for(const file of sourceFiles){const target=path.join(destination,'source-snapshot',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);}
async function servedBundle(){const html=await(await fetch('http://127.0.0.1:5417/BongoPlanet/')).text();const assets=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1]);return Promise.all(assets.map(async asset=>({asset,sha256:createHash('sha256').update(await(await fetch(new URL(asset,'http://127.0.0.1:5417'))).text()).digest('hex')})));}
const servedBundleAtStart=await servedBundle();
const distScriptFiles=fs.readdirSync('dist/assets').filter(file=>file.endsWith('.js'));
const distScriptsAtStart=Object.fromEntries(distScriptFiles.map(file=>[file,hash(path.join('dist/assets',file))]));
const processorAsset=distScriptFiles.find(file=>file.startsWith('processor-'));
if(!processorAsset)throw Error('Built producer processor missing');
async function servedProcessor(){return createHash('sha256').update(await(await fetch(`http://127.0.0.1:5417/BongoPlanet/assets/${processorAsset}`)).text()).digest('hex');}
const servedProcessorAtStart=await servedProcessor();
const expectedMain=process.env.BONGO_EXPECT_MAIN_SHA,expectedProcessor=process.env.BONGO_EXPECT_PROCESSOR_SHA;
if(expectedMain&&!servedBundleAtStart.some(asset=>asset.sha256===expectedMain))throw Error('Served main hash differs from explicit frozen build');
if(expectedProcessor&&servedProcessorAtStart!==expectedProcessor)throw Error('Served processor hash differs from explicit frozen build');
if(servedProcessorAtStart!==distScriptsAtStart[processorAsset])throw Error('Served processor differs from local immutable built bytes');
const receiverAtStart=await state();
fs.writeFileSync(path.join(destination,'runtime-start.json'),JSON.stringify({date:new Date().toISOString(),sourceSnapshotAtStart,servedBundleAtStart,servedProcessorAtStart,expectedMain,expectedProcessor,distScriptsAtStart,receiverAtStart},null,2)+'\n');
const expectedReceiverMode=process.env.BONGO_EXPECT_RECEIVER_MODE??'native-monotonic';
if(receiverAtStart.clock?.mode!==expectedReceiverMode||!receiverAtStart.clock.ready)throw Error('Mandatory '+expectedReceiverMode+' clock unavailable before capture');
const stableObjectId=(id:string)=>{let value=2166136261;for(const c of id){value^=c.charCodeAt(0);value=Math.imul(value,16777619);}return (value>>>0)%2147483646+1;};
function independent(scene:Scene,duration:number){
  const events:{generatorId:string;nodeId:string;onset:number}[]=[];
  for(const generator of scene.pieces)if(generator.kind==='generator'&&generator.enabled){
    const period=generator.period*60/scene.settings.bpm;
    for(const node of scene.pieces)if(node.kind!=='generator'){
      const u=topology.vertices[generator.vertex],v=topology.vertices[node.vertex];
      const theta=Math.acos(Math.max(-1,Math.min(1,u.reduce((sum,value,i)=>sum+value*v[i],0))));
      if(theta>generator.reach*Math.PI/180+1e-9)continue;
      const raw=scene.settings.travel*generator.period*theta/Math.PI,grid=scene.settings.quantization;
      const delayBeats=grid?Math.min(Math.floor(raw/grid+0.5+1e-10)*grid,(Math.ceil(generator.period/grid)-1)*grid):raw;
      for(let k=0;k*period+generator.phase*period<duration;k++){
        const onset=k*period+generator.phase*period+delayBeats*60/scene.settings.bpm;
        if(onset<duration-1e-6)events.push({generatorId:generator.id,nodeId:node.id,onset});
      }
    }
  }
  return events.sort((a,b)=>a.onset-b.onset||a.generatorId.localeCompare(b.generatorId)||a.nodeId.localeCompare(b.nodeId));
}

const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const clockProbe=()=>page.evaluate(()=>new Promise<{t0:number;t1:number;server:number;rawHalfRTTMs:number;timestampAllowanceMs:number;offsetSeconds:number;uncertaintyMs:number;offsetIntervalSeconds:[number,number]}>((resolve,reject)=>{
  const ws=new WebSocket('ws://127.0.0.1:5418');const timeout=setTimeout(()=>{ws.close();reject(Error('Clock probe timed out'));},2000);
  let t0:number;
  ws.onopen=()=>{t0=performance.now()/1000;ws.send(JSON.stringify({version:1,type:'sync',t0}));};
  ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.type!=='sync')return;const t1=performance.now()/1000;clearTimeout(timeout);ws.close();
    if(message.version!==1||message.t0!==t0||!Number.isFinite(message.server)||t1<t0){reject(Error('Invalid independent clock response'));return;}
    const rawHalfRTTMs=(t1-t0)*500,timestampAllowanceMs=1,uncertaintyMs=rawHalfRTTMs+timestampAllowanceMs,offsetSeconds=message.server-(t0+t1)/2;
    resolve({t0,t1,server:message.server,rawHalfRTTMs,timestampAllowanceMs,offsetSeconds,uncertaintyMs,offsetIntervalSeconds:[offsetSeconds-uncertaintyMs/1000,offsetSeconds+uncertaintyMs/1000]});};
  ws.onerror=()=>{clearTimeout(timeout);reject(Error('Clock probe failed'));};
}));
function fixedProducerClock(output:any,probes:Awaited<ReturnType<typeof clockProbe>>[]){
  // This is the adapter's frozen lowest-uncertainty startup sample, not a fit
  // to receiver onsets. Cover the complete independent probe intervals around
  // that unchanged offset; incompatible intervals also fail qualification.
  const samples=output.clockSynchronization??[];
  const chosen=samples.reduce((best:any,sample:any)=>!best||sample.uncertaintyMs<best.uncertaintyMs?sample:best,null);
  if(!chosen||!Number.isFinite(chosen.offset)||!Number.isFinite(chosen.uncertaintyMs))throw Error('Producer frozen clock sample missing');
  const producerIntervalSeconds=[chosen.offset-chosen.uncertaintyMs/1000,chosen.offset+chosen.uncertaintyMs/1000];
  const comparisons=probes.map(probe=>({probe,offsetDifferenceMs:(probe.offsetSeconds-chosen.offset)*1000,
    compatible:producerIntervalSeconds[0]<=probe.offsetIntervalSeconds[1]&&probe.offsetIntervalSeconds[0]<=producerIntervalSeconds[1],
    boundAroundFixedProducerOffsetMs:Math.abs(probe.offsetSeconds-chosen.offset)*1000+probe.uncertaintyMs}));
  return {chosen,producerIntervalSeconds,comparisons,compatible:comparisons.every(row=>row.compatible),
    uncertaintyMs:Math.max(chosen.uncertaintyMs,...comparisons.map(row=>row.boundAroundFixedProducerOffsetMs))};
}
const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const reports:any[]=[];let captureFailure='';const cleanup={browserClosed:false,witnessClosed:false};
// A separate Node process observes real host scheduling without sharing the
// bridge's timers or this capture process's HTTP/browser polling work.
const hostHeartbeat:any[]=[];
const witness=spawn(process.execPath,['--input-type=module','-e',`
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
const delay=monitorEventLoopDelay({resolution:1});delay.enable();
let deadline=performance.now()+10,ticks=0,maxSlip=0,previous=performance.eventLoopUtilization();
const heartbeat=setInterval(()=>{const actual=performance.now();maxSlip=Math.max(maxSlip,actual-deadline);ticks++;deadline=actual+10;},10);
const report=setInterval(()=>{const current=performance.eventLoopUtilization();const utilization=performance.eventLoopUtilization(current,previous).utilization;previous=current;
process.stdout.write(JSON.stringify({hostUnixMs:Date.now(),pid:process.pid,ticks,heartbeatMaxSlipMs:maxSlip,loopDelayP95Ms:delay.percentile(95)/1e6,loopDelayMaxMs:delay.max/1e6,eventLoopUtilization:utilization})+'\\n');ticks=0;maxSlip=0;delay.reset();},1000);
process.on('SIGTERM',()=>{clearInterval(heartbeat);clearInterval(report);delay.disable();process.exit(0);});
`],{stdio:['ignore','pipe','pipe']});
let witnessBuffer='',witnessError='';
witness.stdout.on('data',chunk=>{witnessBuffer+=chunk.toString();let newline:number;while((newline=witnessBuffer.indexOf('\n'))>=0){hostHeartbeat.push(JSON.parse(witnessBuffer.slice(0,newline)));witnessBuffer=witnessBuffer.slice(newline+1);}});
witness.stderr.on('data',chunk=>{witnessError+=chunk.toString();});
try{
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo);
  await page.locator('summary').click();await page.locator('#bridge').click();await page.waitForFunction(()=>(window as any).__bongo.output.connected&&Number.isFinite((window as any).__bongo.output.uncertaintyMs));
  for(const fixtureId of ['F01','F04']){
    const fixtureFile=`public/fixtures/${fixtureId}.json`,scene=JSON.parse(fs.readFileSync(fixtureFile,'utf8')) as Scene;
    fs.copyFileSync(fixtureFile,path.join(destination,`${fixtureId}-fixture.json`));
    await page.evaluate(scene=>{const b=(window as any).__bongo;b.events.length=0;b.load(scene);},scene);await sleep(150);
    const clockAtStart=await clockProbe();
    const producerClockAtStart=fixedProducerClock(await page.evaluate(()=>(window as any).__bongo.output),[clockAtStart]);
    if(!producerClockAtStart.compatible)throw Error('Frozen producer offset incompatible with independent start interval');
    const baseline=await state(),lastRecordTime=Math.max(...baseline.events.map((e:any)=>e.time));
    const records=new Map<string,any>(),raw=new Map<string,any>();
    const capture=(snapshot:any)=>{for(const row of snapshot.events)if(row.time>lastRecordTime)records.set(JSON.stringify(row),row);for(const row of snapshot.rawOSC)if(row.arrival>lastRecordTime)raw.set(JSON.stringify(row),row);};
    const hostStart=Date.now(),receiverTiming:any[]=[],browserTelemetry:any[]=[];
    const started=new Date().toISOString();await page.locator('#play').click();
    await page.waitForFunction(()=>(window as any).__bongo.status?.running);
    const wallStart=performance.now();let nextProgress=30,liveSession='',nextTelemetry=0;
    while(performance.now()-wallStart<seconds*1000){
      const snapshot=await state();capture(snapshot);const elapsed=(performance.now()-wallStart)/1000;
      if(elapsed>=nextTelemetry){
        receiverTiming.push({hostUnixMs:Date.now(),elapsedWallSeconds:elapsed,session:snapshot.session,timing:snapshot.timing,clock:snapshot.clock,pending:snapshot.pending,activeVoices:snapshot.activeVoices,drops:snapshot.drops});
        browserTelemetry.push(await page.evaluate(()=>{const b=(window as any).__bongo;return {hostUnixMs:Date.now(),browserPerformanceSeconds:performance.now()/1000,audioNow:b.audio.now,audibleNow:b.audio.audibleNow,audioState:b.audio.state,status:b.status,output:b.output};}));
        nextTelemetry=elapsed+1;
      }
      const hasQueued=[...records.values()].some(e=>e.type==='queued');if(hasQueued&&!liveSession)liveSession=snapshot.session;
      const producerUncertainty=Math.max(producerClockAtStart.uncertaintyMs,browserTelemetry.at(-1)?.output?.uncertaintyMs??Infinity);
      const combinedUncertainty=producerUncertainty+(snapshot.clock?.uncertaintyMs??Infinity);
      if(!snapshot.clock?.ready||snapshot.clock.failure||combinedUncertainty>10||(elapsed>1&&(!snapshot.session||(liveSession&&snapshot.session!==liveSession)))){
        fs.writeFileSync(path.join(destination,`${fixtureId}-interrupted-${Date.now()}.json`),JSON.stringify({fixture:fixtureId,started,elapsedWallSeconds:elapsed,interrupted:true,reason:!snapshot.clock?.ready||snapshot.clock.failure?'Actual receiver clock failed/unready':combinedUncertainty>10?'Combined producer/receiver uncertainty exceeds10ms':'Actual receiver session ended or changed',combinedUncertaintyMs:combinedUncertainty,sourceSnapshotAtStart,servedBundleAtStart,liveSession,receiverSnapshot:snapshot,actualReceiverRecords:[...records.values()],actualDecodedOSC:[...raw.values()],browserTelemetry,receiverTiming,hostHeartbeat:hostHeartbeat.filter(sample=>sample.hostUnixMs>=hostStart)},null,2)+'\n');
        reports.push({fixture:fixtureId,started,completed:false,elapsedWallSeconds:elapsed,failures:['Actual receiver clock/session interruption or uncertainty gate failure'],receiverSnapshot:snapshot,combinedUncertaintyMs:combinedUncertainty});
        throw Error(`${fixtureId} actual receiver stream interrupted after${elapsed.toFixed(1)}seconds; clock=${snapshot.clock?.failure||snapshot.clock?.ready}, combined uncertainty=${combinedUncertainty.toFixed(3)}ms`);
      }
      if(elapsed>=nextProgress){
        if(sourceFiles.some(file=>hash(file)!==sourceSnapshotAtStart[file])||distScriptFiles.some(file=>hash(path.join('dist/assets',file))!==distScriptsAtStart[file]))throw Error('Runtime source/dist bytes changed during capture');
        console.log(`${fixtureId}: ${elapsed.toFixed(1)} actual seconds; ${[...records.values()].filter(e=>e.type==='onset').length} receiver onsets`);nextProgress+=30;}await sleep(50);
    }
    const frozenWindow=await page.evaluate(()=>{const b=(window as any).__bongo;return {audioEnd:b.audio.now,events:b.events,output:b.output,status:b.status};});
    const audioEnd=frozenWindow.audioEnd;
    const scheduled=frozenWindow.events.filter((e:any)=>e.type==='trigger'&&e.trigger.onset<audioEnd).map((e:any)=>e.trigger);
    const inWindowIds=new Set(scheduled.map((trigger:any)=>trigger.id));
    const drainStarted=performance.now(),drainSnapshots:any[]=[];
    // Keep normal playback running for a declared receipt drain. Freeze IDs
    // first: neither delayed receipts nor Pause can redefine the tested window.
    do{const snapshot=await state();capture(snapshot);drainSnapshots.push({elapsedMs:performance.now()-drainStarted,ready:snapshot.clock?.ready,failure:snapshot.clock?.failure,uncertaintyMs:snapshot.clock?.uncertaintyMs,session:snapshot.session});await sleep(10);}while(performance.now()-drainStarted<100);
    const finalDrainSnapshot=await state();capture(finalDrainSnapshot);drainSnapshots.push({elapsedMs:performance.now()-drainStarted,ready:finalDrainSnapshot.clock?.ready,failure:finalDrainSnapshot.clock?.failure,uncertaintyMs:finalDrainSnapshot.clock?.uncertaintyMs,session:finalDrainSnapshot.session});
    const receiptDrain={requestedMs:100,actualMs:performance.now()-drainStarted,snapshots:drainSnapshots};
    const cancelledBeforePause=new Set([...records.values()].filter(e=>e.type==='cancel').map(e=>e.id));
    await page.locator('#play').click();await sleep(100);capture(await state());
    const clockAtEnd=await clockProbe();
    const app=await page.evaluate(()=>({events:(window as any).__bongo.events,output:(window as any).__bongo.output,status:(window as any).__bongo.status}));
    const receiver=[...records.values()],queued=receiver.filter(e=>e.type==='queued'),allOnsets=receiver.filter(e=>e.type==='onset'),cancelled=new Set(receiver.filter(e=>e.type==='cancel').map(e=>e.id));
    const emissions=frozenWindow.events.filter((e:any)=>e.type==='emission');const audioOrigin=Math.min(...emissions.map((e:any)=>e.time));const duration=audioEnd-audioOrigin;
    if(!emissions.length||![audioOrigin,audioEnd,duration].every(Number.isFinite)||duration<=0){
      const invalid={fixture:fixtureId,started,completed:false,failures:['Empty emissions or invalid/nonpositive frozen comparison window'],audioOrigin,audioEnd,duration,frozenWindow,receiptDrain,actualReceiverRecords:receiver};
      fs.writeFileSync(path.join(destination,`${fixtureId}-invalid-window.json`),JSON.stringify(invalid,null,2)+'\n');reports.push(invalid);throw Error(`${fixtureId} invalid actual comparison window`);
    }
    const expected=independent(scene,duration);
    if(!expected.length){
      const invalid={fixture:fixtureId,started,completed:false,failures:['Independent fixture oracle produced no expected events'],audioOrigin,audioEnd,duration,frozenWindow,receiptDrain,actualReceiverRecords:receiver};
      fs.writeFileSync(path.join(destination,`${fixtureId}-empty-oracle.json`),JSON.stringify(invalid,null,2)+'\n');reports.push(invalid);throw Error(`${fixtureId} empty independent fixture oracle`);
    }
    const onsets=allOnsets.filter(e=>inWindowIds.has(e.id)),excludedPostWindowOnsets=allOnsets.filter(e=>!inWindowIds.has(e.id));
    const failures:string[]=[];
    if(receiptDrain.snapshots.some(row=>!row.ready||row.failure))failures.push('Actual receiver clock failed/unready during normal-play receipt drain');
    if(receiptDrain.snapshots.some(row=>producerClockAtStart.uncertaintyMs+row.uncertaintyMs>10))failures.push('Combined clock uncertainty exceeded10ms during normal-play receipt drain');
    for(const event of excludedPostWindowOnsets){if(!app.events.some((e:any)=>e.type==='trigger'&&e.trigger.id===event.id&&e.trigger.onset>=audioEnd))failures.push(`${event.id}: unexpected actual receiver onset outside captured schedule`);}
    if(witnessError||!hostHeartbeat.some(sample=>sample.hostUnixMs>=hostStart))failures.push('Independent host heartbeat telemetry missing or failed');
    if(app.output.uncertaintyMs>10)failures.push('Clock uncertainty exceeds10ms');
    if(clockAtStart.uncertaintyMs>10||clockAtEnd.uncertaintyMs>10)failures.push('Independent round-trip clock probe uncertainty exceeds10ms');
    for(const trigger of scheduled){const matching=onsets.filter(e=>e.id===trigger.id);if(!cancelledBeforePause.has(trigger.id)&&matching.length!==1)failures.push(`${trigger.id}: expected exactly one actual receiver onset, got${matching.length}`);for(const event of matching){const node=scene.pieces.find(p=>p.id===event.nodeId)!;if(event.objectId!==stableObjectId(trigger.nodeId)||event.generatorId!==trigger.generatorId||event.nodeId!==trigger.nodeId||event.position.some((v:number,i:number)=>Math.abs(v-topology.vertices[node.vertex][i])>1e-9))failures.push(`${trigger.id}: object/provenance/XYZ mismatch`);}}
    if(expected.length!==scheduled.length)failures.push(`Independent expected${expected.length} != scheduled${scheduled.length}`);
    const keys=[...new Set(expected.map(e=>`${e.generatorId}/${e.nodeId}`))];
    const oracleTimingMs=keys.flatMap(key=>{
      const expectedTimes=expected.filter(e=>`${e.generatorId}/${e.nodeId}`===key).map(e=>e.onset).sort((a,b)=>a-b);
      const scheduledTimes=scheduled.filter((e:any)=>`${e.generatorId}/${e.nodeId}`===key).map((e:any)=>e.onset-audioOrigin).sort((a:number,b:number)=>a-b);
      return expectedTimes.map((time,index)=>Math.abs(time-scheduledTimes[index])*1000);
    });
    const independentSchedulingMaxErrorMs=Math.max(0,...oracleTimingMs);
    if(!Number.isFinite(independentSchedulingMaxErrorMs)||independentSchedulingMaxErrorMs>.001)failures.push('Independent onset schedule differs by more than1e-6seconds');
    const counts=(events:any[])=>Object.fromEntries([...new Set(events.map(e=>`${e.generatorId}/${e.nodeId}`))].sort().map(key=>[key,events.filter(e=>`${e.generatorId}/${e.nodeId}`===key).length]));
    if(JSON.stringify(counts(expected))!==JSON.stringify(counts(onsets)))failures.push('Independent per-generator/per-node counts differ from actual receiver onsets');
    const producerClock=fixedProducerClock(frozenWindow.output,[clockAtStart,clockAtEnd]);
    if(!producerClock.compatible)failures.push('Frozen producer offset incompatible with independent start/end clock intervals');
    const producerUncertaintyMs=Math.max(producerClock.uncertaintyMs,app.output.uncertaintyMs,...browserTelemetry.map(row=>row.output.uncertaintyMs));
    const receiptUncertaintyMs=Math.max(0,...onsets.map(e=>e.uncertaintyMs));
    const combinedClockUncertaintyMs=producerUncertaintyMs+receiptUncertaintyMs;
    if(!Number.isFinite(combinedClockUncertaintyMs)||combinedClockUncertaintyMs>10)failures.push('Combined producer sync + receiver receipt uncertainty exceeds10ms');
    const timing=onsets.map(e=>Math.abs(e.errorMs)),conservativeTiming=onsets.map(e=>Math.abs(e.errorMs)+e.uncertaintyMs+producerUncertaintyMs);
    if(percentile(timing,.95)>20)failures.push('Receiver p95 onset error exceeds20ms');
    if(percentile(conservativeTiming,.95)>20)failures.push('Conservative receiver p95 error bound exceeds20ms');
    const late=receiver.filter(e=>['late-drop','rejected'].includes(e.type));if(late.length)failures.push(`${late.length} receiver late/rejected events`);
    const missingTriggers=scheduled.filter((trigger:any)=>!cancelledBeforePause.has(trigger.id)&&!onsets.some(e=>e.id===trigger.id)).map((trigger:any)=>({trigger,queued:queued.find(e=>e.id===trigger.id),lateDrop:receiver.find(e=>e.type==='late-drop'&&e.id===trigger.id)}));
    const hostEnd=Date.now();
    const report={fixture:fixtureId,fixtureSha256:hash(fixtureFile),started,ended:new Date().toISOString(),requestedRealSeconds:seconds,elapsedWallSeconds:(performance.now()-wallStart)/1000,audioOrigin,audioEnd,comparisonWindowSeconds:duration,windowRule:'Freeze audioEnd and scheduled IDs together after at least120seconds; retain normal playback for a100ms receipt-poll drain before Pause. Exactly-once comparison never excludes an in-window ID because of terminal Pause. Post-window actual receipts are retained separately.',receiptDrain,frozenWindow,producerClockAtStart,producerClock,cancelledBeforePause:[...cancelledBeforePause],clockUncertaintyMs:app.output.uncertaintyMs,clockAtStart,clockAtEnd,clockOffsetChangeMs:(clockAtEnd.offsetSeconds-clockAtStart.offsetSeconds)*1000,independentExpectedCount:expected.length,scheduledWithinWindow:scheduled.length,actualReceiverOnsets:onsets.length,rawActualReceiverOnsets:allOnsets.length,excludedPostWindowOnsets,queued:queued.length,cancelled:cancelled.size,expectedCounts:counts(expected),actualCounts:counts(onsets),independentSchedulingMaxErrorMs,completed:true,producerUncertaintyMs,receiptUncertaintyMs,combinedClockUncertaintyMs,conservativeReceiverAbsOnsetErrorBoundMs:{p50:percentile(conservativeTiming,.5),p95:percentile(conservativeTiming,.95),max:Math.max(0,...conservativeTiming)},receiverAbsOnsetErrorMs:{p50:percentile(timing,.5),p95:percentile(timing,.95),max:Math.max(0,...timing)},failures,missingTriggers,expected,scheduled,actualReceiverRecords:receiver,actualDecodedOSC:[...raw.values()],browserErrors:[...errors],browserTelemetry,finalBrowserStatus:app.status,engineEvents:app.events,receiverTiming,hostHeartbeat:hostHeartbeat.filter(sample=>sample.hostUnixMs>=hostStart&&sample.hostUnixMs<=hostEnd),hostHeartbeatProcessError:witnessError};
    reports.push(report);fs.writeFileSync(path.join(destination,`${fixtureId}-two-minute.json`),JSON.stringify(report,null,2)+'\n');console.log(`${fixtureId} complete: ${onsets.length} actual onsets; failures=${failures.length}`);
  }
}catch(error){captureFailure=String(error);console.error(captureFailure);process.exitCode=1;}finally{witness.kill('SIGTERM');cleanup.witnessClosed=await new Promise<boolean>(resolve=>{if(witness.exitCode!==null){resolve(true);return;}witness.once('exit',()=>resolve(true));setTimeout(()=>resolve(false),2000);});await page.evaluate(()=>{if((window as any).__bongo?.output.connected)(document.querySelector('#bridge') as HTMLButtonElement).click();}).catch(()=>{});await browser.close();cleanup.browserClosed=true;}
const servedBundleAtEnd=await servedBundle(),servedProcessorAtEnd=await servedProcessor();
const sourceSnapshotAtEnd=Object.fromEntries(sourceFiles.map(file=>[file,hash(file)])),distScriptsAtEnd=Object.fromEntries(distScriptFiles.map(file=>[file,hash(path.join('dist/assets',file))]));
const sourceUnchanged=JSON.stringify(sourceSnapshotAtStart)===JSON.stringify(sourceSnapshotAtEnd),distScriptsUnchanged=JSON.stringify(distScriptsAtStart)===JSON.stringify(distScriptsAtEnd);
const receiverAtEnd=await state();
const report={expectedMain,expectedProcessor,servedProcessorAtStart,servedProcessorAtEnd,servedProcessorUnchanged:servedProcessorAtStart===servedProcessorAtEnd,captureFailure,cleanup,sourceUnchanged,distScriptsUnchanged,distScriptsAtStart,distScriptsAtEnd,receiverAtStart,receiverAtEnd,title:'Bongo Planet live WebSocket/UDP receiver evidence',date:new Date().toISOString(),command:'npx tsx scripts/bridge-evidence.ts',receiver:'http://127.0.0.1:5418/state',actualReceipts:true,servedBundleAtStart,servedBundleAtEnd,servedBundleUnchanged:JSON.stringify(servedBundleAtStart)===JSON.stringify(servedBundleAtEnd),sourceSnapshotAtStart,sourceSnapshotAtEnd,reports:reports.map(({expected,scheduled,actualReceiverRecords,actualDecodedOSC,...report})=>report),limitations:['Local actual receiver and decoded loopback ADM-OSC only; no venue spatial synthesis or physical directional listening.','Backpressure is measured by a separate source-adapter socket test; this timed run exercises normal local receipt.']};
fs.writeFileSync(path.join(destination,'live-report.json'),JSON.stringify(report,null,2)+'\n');
if(captureFailure||reports.some(r=>r.failures.length)||reports.length!==2||errors.length||!report.servedBundleUnchanged||!report.servedProcessorUnchanged||!sourceUnchanged||!distScriptsUnchanged)process.exitCode=1;
