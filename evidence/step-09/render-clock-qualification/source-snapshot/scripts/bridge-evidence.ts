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
const sourceFiles=['src/output/OutputAdapter.ts','src/output/protocol.ts','src/output/bridge.ts','src/output/RenderClock.ts','src/output/ReceiverClock.ts','src/core/engine.ts','src/main.ts','scripts/bridge-evidence.ts'];
const sourceSnapshotAtStart=Object.fromEntries(sourceFiles.map(file=>[file,hash(file)]));
for(const file of sourceFiles){const target=path.join(destination,'source-snapshot',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);}
async function servedBundle(){const html=await(await fetch('http://127.0.0.1:5417/BongoPlanet/')).text();const assets=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1]);return Promise.all(assets.map(async asset=>({asset,sha256:createHash('sha256').update(await(await fetch(new URL(asset,'http://127.0.0.1:5417'))).text()).digest('hex')})));}
const servedBundleAtStart=await servedBundle();
const distScriptFiles=fs.readdirSync('dist/assets').filter(file=>file.endsWith('.js'));
const distScriptsAtStart=Object.fromEntries(distScriptFiles.map(file=>[file,hash(path.join('dist/assets',file))]));
const receiverAtStart=await state();
fs.writeFileSync(path.join(destination,'runtime-start.json'),JSON.stringify({date:new Date().toISOString(),sourceSnapshotAtStart,servedBundleAtStart,distScriptsAtStart,receiverAtStart},null,2)+'\n');
if(receiverAtStart.clock?.mode!=='audio-render-clock'||!receiverAtStart.clock.ready)throw Error('Mandatory render clock unavailable before capture');
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
const clockProbe=()=>page.evaluate(()=>new Promise<{offsetSeconds:number;uncertaintyMs:number}>((resolve,reject)=>{
  const ws=new WebSocket('ws://127.0.0.1:5418');const timeout=setTimeout(()=>{ws.close();reject(Error('Clock probe timed out'));},2000);
  ws.onopen=()=>ws.send(JSON.stringify({version:1,type:'sync',t0:performance.now()/1000}));
  ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.type!=='sync')return;const t1=performance.now()/1000;clearTimeout(timeout);ws.close();resolve({offsetSeconds:message.server-(message.t0+t1)/2,uncertaintyMs:(t1-message.t0)*500});};
  ws.onerror=()=>{clearTimeout(timeout);reject(Error('Clock probe failed'));};
}));
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
      const producerUncertainty=browserTelemetry.at(-1)?.output?.uncertaintyMs??Infinity;
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
    const audioEnd=await page.evaluate(()=>(window as any).__bongo.audio.now);capture(await state());
    await page.locator('#play').click();await sleep(100);capture(await state());
    const clockAtEnd=await clockProbe();
    const app=await page.evaluate(()=>({events:(window as any).__bongo.events,output:(window as any).__bongo.output,status:(window as any).__bongo.status}));
    const receiver=[...records.values()],queued=receiver.filter(e=>e.type==='queued'),allOnsets=receiver.filter(e=>e.type==='onset'),cancelled=new Set(receiver.filter(e=>e.type==='cancel').map(e=>e.id));
    const emissions=app.events.filter((e:any)=>e.type==='emission');const audioOrigin=Math.min(...emissions.map((e:any)=>e.time));const duration=audioEnd-audioOrigin;
    const expected=independent(scene,duration),scheduled=app.events.filter((e:any)=>e.type==='trigger'&&e.trigger.onset<audioEnd).map((e:any)=>e.trigger);
    const inWindowIds=new Set(scheduled.map((trigger:any)=>trigger.id));
    const onsets=allOnsets.filter(e=>inWindowIds.has(e.id)),excludedPostWindowOnsets=allOnsets.filter(e=>!inWindowIds.has(e.id));
    const failures:string[]=[];
    for(const event of excludedPostWindowOnsets){if(!app.events.some((e:any)=>e.type==='trigger'&&e.trigger.id===event.id&&e.trigger.onset>=audioEnd))failures.push(`${event.id}: unexpected actual receiver onset outside captured schedule`);}
    if(witnessError||!hostHeartbeat.some(sample=>sample.hostUnixMs>=hostStart))failures.push('Independent host heartbeat telemetry missing or failed');
    if(app.output.uncertaintyMs>10)failures.push('Clock uncertainty exceeds10ms');
    if(clockAtStart.uncertaintyMs>10||clockAtEnd.uncertaintyMs>10)failures.push('Independent round-trip clock probe uncertainty exceeds10ms');
    for(const trigger of scheduled){const matching=onsets.filter(e=>e.id===trigger.id);if(!cancelled.has(trigger.id)&&matching.length!==1)failures.push(`${trigger.id}: expected exactly one actual receiver onset, got${matching.length}`);for(const event of matching){const node=scene.pieces.find(p=>p.id===event.nodeId)!;if(event.objectId!==stableObjectId(trigger.nodeId)||event.generatorId!==trigger.generatorId||event.nodeId!==trigger.nodeId||event.position.some((v:number,i:number)=>Math.abs(v-topology.vertices[node.vertex][i])>1e-9))failures.push(`${trigger.id}: object/provenance/XYZ mismatch`);}}
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
    const producerUncertaintyMs=Math.max(app.output.uncertaintyMs,clockAtStart.uncertaintyMs,clockAtEnd.uncertaintyMs,...browserTelemetry.map(row=>row.output.uncertaintyMs));
    const receiptUncertaintyMs=Math.max(0,...onsets.map(e=>e.uncertaintyMs));
    const combinedClockUncertaintyMs=producerUncertaintyMs+receiptUncertaintyMs;
    if(!Number.isFinite(combinedClockUncertaintyMs)||combinedClockUncertaintyMs>10)failures.push('Combined producer sync + receiver receipt uncertainty exceeds10ms');
    const timing=onsets.map(e=>Math.abs(e.errorMs)),conservativeTiming=onsets.map(e=>Math.abs(e.errorMs)+e.uncertaintyMs+producerUncertaintyMs);
    if(percentile(timing,.95)>20)failures.push('Receiver p95 onset error exceeds20ms');
    if(percentile(conservativeTiming,.95)>20)failures.push('Conservative receiver p95 error bound exceeds20ms');
    const late=receiver.filter(e=>['late-drop','rejected'].includes(e.type));if(late.length)failures.push(`${late.length} receiver late/rejected events`);
    const missingTriggers=scheduled.filter((trigger:any)=>!cancelled.has(trigger.id)&&!onsets.some(e=>e.id===trigger.id)).map((trigger:any)=>({trigger,queued:queued.find(e=>e.id===trigger.id),lateDrop:receiver.find(e=>e.type==='late-drop'&&e.id===trigger.id)}));
    const hostEnd=Date.now();
    const report={fixture:fixtureId,fixtureSha256:hash(fixtureFile),started,ended:new Date().toISOString(),requestedRealSeconds:seconds,elapsedWallSeconds:(performance.now()-wallStart)/1000,audioOrigin,audioEnd,comparisonWindowSeconds:duration,windowRule:'Onsets from first emission audio timestamp inclusive to captured audioEnd exclusive; actual receipt counts/errors use exactly these scheduled IDs. Post-window receipts during Pause processing are retained separately.',clockUncertaintyMs:app.output.uncertaintyMs,clockAtStart,clockAtEnd,clockOffsetChangeMs:(clockAtEnd.offsetSeconds-clockAtStart.offsetSeconds)*1000,independentExpectedCount:expected.length,scheduledWithinWindow:scheduled.length,actualReceiverOnsets:onsets.length,rawActualReceiverOnsets:allOnsets.length,excludedPostWindowOnsets,queued:queued.length,cancelled:cancelled.size,expectedCounts:counts(expected),actualCounts:counts(onsets),independentSchedulingMaxErrorMs,completed:true,producerUncertaintyMs,receiptUncertaintyMs,combinedClockUncertaintyMs,conservativeReceiverAbsOnsetErrorBoundMs:{p50:percentile(conservativeTiming,.5),p95:percentile(conservativeTiming,.95),max:Math.max(0,...conservativeTiming)},receiverAbsOnsetErrorMs:{p50:percentile(timing,.5),p95:percentile(timing,.95),max:Math.max(0,...timing)},failures,missingTriggers,expected,scheduled,actualReceiverRecords:receiver,actualDecodedOSC:[...raw.values()],browserErrors:[...errors],browserTelemetry,finalBrowserStatus:app.status,engineEvents:app.events,receiverTiming,hostHeartbeat:hostHeartbeat.filter(sample=>sample.hostUnixMs>=hostStart&&sample.hostUnixMs<=hostEnd),hostHeartbeatProcessError:witnessError};
    reports.push(report);fs.writeFileSync(path.join(destination,`${fixtureId}-two-minute.json`),JSON.stringify(report,null,2)+'\n');console.log(`${fixtureId} complete: ${onsets.length} actual onsets; failures=${failures.length}`);
  }
}catch(error){captureFailure=String(error);console.error(captureFailure);process.exitCode=1;}finally{witness.kill('SIGTERM');cleanup.witnessClosed=await new Promise<boolean>(resolve=>{if(witness.exitCode!==null){resolve(true);return;}witness.once('exit',()=>resolve(true));setTimeout(()=>resolve(false),2000);});await page.evaluate(()=>{if((window as any).__bongo?.output.connected)(document.querySelector('#bridge') as HTMLButtonElement).click();}).catch(()=>{});await browser.close();cleanup.browserClosed=true;}
const servedBundleAtEnd=await servedBundle();
const sourceSnapshotAtEnd=Object.fromEntries(sourceFiles.map(file=>[file,hash(file)])),distScriptsAtEnd=Object.fromEntries(distScriptFiles.map(file=>[file,hash(path.join('dist/assets',file))]));
const sourceUnchanged=JSON.stringify(sourceSnapshotAtStart)===JSON.stringify(sourceSnapshotAtEnd),distScriptsUnchanged=JSON.stringify(distScriptsAtStart)===JSON.stringify(distScriptsAtEnd);
const receiverAtEnd=await state();
const report={captureFailure,cleanup,sourceUnchanged,distScriptsUnchanged,distScriptsAtStart,distScriptsAtEnd,receiverAtStart,receiverAtEnd,title:'Bongo Planet live WebSocket/UDP receiver evidence',date:new Date().toISOString(),command:'npx tsx scripts/bridge-evidence.ts',receiver:'http://127.0.0.1:5418/state',actualReceipts:true,servedBundleAtStart,servedBundleAtEnd,servedBundleUnchanged:JSON.stringify(servedBundleAtStart)===JSON.stringify(servedBundleAtEnd),sourceSnapshotAtStart,sourceSnapshotAtEnd,reports:reports.map(({expected,scheduled,actualReceiverRecords,actualDecodedOSC,...report})=>report),limitations:['Local actual receiver and decoded loopback ADM-OSC only; no venue spatial synthesis or physical directional listening.','Backpressure is measured by a separate source-adapter socket test; this timed run exercises normal local receipt.']};
fs.writeFileSync(path.join(destination,'live-report.json'),JSON.stringify(report,null,2)+'\n');
if(captureFailure||reports.some(r=>r.failures.length)||reports.length!==2||errors.length||!report.servedBundleUnchanged||!sourceUnchanged||!distScriptsUnchanged)process.exitCode=1;
