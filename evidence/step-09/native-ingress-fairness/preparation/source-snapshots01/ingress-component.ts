import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {WebSocket} from 'ws';
import {trace} from './trace';
import {summarizeAges} from './age';
import {encodeOSC} from './frozen-source/protocol';
const folder=path.dirname(fileURLToPath(import.meta.url));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
async function bounded<T>(p:Promise<T>,ms:number){let t:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([p,new Promise<never>((_,reject)=>{t=setTimeout(()=>reject(Error('Detected operation bound '+ms+'ms')),ms);})]);}finally{clearTimeout(t);}}
const sleep=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
export async function runComponent(){
 const mode=process.env.BONGO_INGRESS_MODE;assert(mode==='baseline'||mode==='successor');
 const output=process.env.BONGO_INGRESS_EVIDENCE_DIR,reserve=process.env.BONGO_INGRESS_CONTROLLER_RESERVE,journal=process.env.BONGO_MOVEMENT_RESOURCE_JOURNAL;
 assert(output&&path.isAbsolute(output)&&!fs.existsSync(output),'Require fresh absolute component output');
 assert(reserve&&path.isAbsolute(reserve)&&!fs.existsSync(reserve)&&reserve!==output,'Require unused external controller reserve');
 assert(journal&&path.isAbsolute(journal)&&fs.lstatSync(journal).isFile()&&fs.statSync(journal).size===0,'Require external exclusive empty journal; no detached claims expected');
 fs.mkdirSync(output,{recursive:true});
 const start=performance.now(),report:any={title:'Bongo Planet native ingress fairness component',mode,status:'preparing',qualificationPassed:false,startedUtc:new Date().toISOString(),pid:process.pid,parentPid:process.ppid,output,reserve,journal,errors:[],cleanup:{},sendAttempts:[],sendCompletions:[],stages:[],expected:{commands:1313,positions:1292,initialPositions:92,burstPositions:1200},limits:{acquisitionMs:15000,cleanupMs:5000,externalMainMs:25000,externalTotalMs:35000,traceRows:16000,traceBytes:8388608,reportBytesDetected:16777216,clientBufferedBytes:1048576},scope:['Position-only component, not browser pressure/onset/acoustic qualification.','Equal intended packets and timestamp recipe, not equal accepted outcomes.','Instrumentation reads public diagnostics at public callback/hook boundaries; private NativeClock/worker unchanged.','Callback logging/counter getter perturbation is equal; no exact hidden intermediate peak claim.','Detected/cooperative local bounds; external controller owns process containment.']};
 const save=()=>{const text=JSON.stringify(report,null,2)+'\n';assert(Buffer.byteLength(text)<=16777216,'Final report detected byte cap');fs.writeFileSync(path.join(output,'report.json'),text);};
 let bridge:any,client:WebSocket|undefined,clientClosed=false;
 let clientClose:Promise<void>|undefined;
 const budget=()=>{assert(performance.now()-start<15000,'Component acquisition detected15s bound');assert(!trace.failed);assert.equal(report.errors.length,0,'Retained first component error');};
 const health=()=>{const s=bridge.state();assert(s.clock.ready&&!s.clock.failure&&!s.clock.clockEvidenceFailure,'Native clock unavailable');assert.equal(s.drops,0);return s;};
 async function waitUntil(test:()=>boolean,ms:number){const begin=performance.now();while(true){budget();const done=test(),elapsed=performance.now()-begin;assert(elapsed<ms,'Condition returned after fixed '+ms+'ms bound');if(done)return;await sleep(2);}}
 const snapshot=(stage:string)=>{const s=bridge.state();assert(report.stages.length<32);report.stages.push({stage,nodeMs:performance.now(),state:s});return s;};
 try{
  const bindings=JSON.parse(fs.readFileSync(path.join(folder,'candidate-bindings.json'),'utf8'));report.bindings=bindings;
  for(const name of ['NativeClock','RenderClock','ReceiverClock','protocol','bridge'])assert.equal(sha(fs.readFileSync(path.join(folder,'frozen-source',name+'.ts'))),bindings.hashes[name]);
  const candidate='bridge-'+mode+'.ts';assert.equal(sha(fs.readFileSync(path.join(folder,candidate))),bindings.hashes[mode]);
  const fixtureBytes=fs.readFileSync(path.join(folder,'fixture.json'));assert.equal(sha(fixtureBytes),bindings.hashes.fixture);const fixture=JSON.parse(fixtureBytes.toString());
  report.fixtureSha256=sha(fixtureBytes);report.helperSha256=sha(fs.readFileSync(fileURLToPath(import.meta.url)));report.traceSourceSha256=sha(fs.readFileSync(path.join(folder,'trace.ts')));
  fs.writeFileSync(path.join(output,'fixture.json'),fixtureBytes,{flag:'wx'});
  const wsFiles=['node_modules/ws/package.json','node_modules/ws/lib/receiver.js','node_modules/ws/lib/websocket-server.js'];report.installedWs={};for(const name of wsFiles)report.installedWs[name]=sha(fs.readFileSync(name));assert.equal(JSON.parse(fs.readFileSync(wsFiles[0],'utf8')).version,'8.22.0');
  save();const {createBridge}=await import('./'+candidate);bridge=createBridge(0,0,{nativeClock:true});const port=await bounded(bridge.start(),5000);report.port=port;report.receiverReady=snapshot('native-ready');health();
  // Native calibration/startup ACK accounting must be fully quiescent, twice.
  await waitUntil(()=>{const s=health();return s.clock.unacknowledgedCommands===0&&s.clock.unacknowledgedBytes===0&&s.clock.worker.unacknowledgedCommands===0&&s.clock.worker.unacknowledgedBytes===0;},2000);
  await sleep(2);const idle=health();assert.equal(idle.clock.unacknowledgedCommands,0);assert.equal(idle.clock.unacknowledgedBytes,0);report.quiescentBeforeConnect=snapshot('quiescent');
  client=new WebSocket('ws://127.0.0.1:'+port+'/',{origin:'http://127.0.0.1:5417',perMessageDeflate:false});
  clientClose=new Promise(resolve=>client!.once('close',(code,reason)=>{clientClosed=true;report.clientClose={code,reason:reason.toString(),nodeMs:performance.now()};resolve();}));
  client.on('error',e=>{if(report.errors.length<32)report.errors.push('Client transport '+String(e));});
  client.on('message',b=>{if(report.errors.length<32)report.errors.push('Receiver message '+b.toString().slice(0,2048));});
  await bounded(new Promise<void>((resolve,reject)=>{client!.once('open',resolve);client!.once('error',reject);}),2000);assert.equal(client.extensions,'');report.negotiatedExtensions=client.extensions;
  const intended:any[]=[];
  function sendStage(stage:string,packets:any[],offsets:(number|null)[]=packets.map(()=>0)){const epoch=performance.now()/1000;report[stage+'Epoch']=epoch;for(const [recipeIndex,template] of packets.entries()){budget();assert.equal(client!.readyState,WebSocket.OPEN);const p={...template,...(template.type==='position'?{sent:epoch+(offsets[recipeIndex]??0)/1000}:{})},text=JSON.stringify(p);assert(client!.bufferedAmount+Buffer.byteLength(text)<=1048576);const index=intended.length;intended.push(p);report.intended=intended;assert(index<1400);report.sendAttempts.push({index,stage,nodeMs:performance.now(),bytes:Buffer.byteLength(text),sha256:sha(text)});client!.send(text,{compress:false},error=>{if(report.sendCompletions.length>=1400){report.errors.push('Send completion count cap');return;}report.sendCompletions.push({index,nodeMs:performance.now(),error:error?String(error):null});});}}
  sendStage('initial',fixture.initial);const initialCommands=fixture.initial.length;
  await waitUntil(()=>{health();const s=bridge.state();return trace.rows.filter(r=>r.type==='bridge-command-applied').length===initialCommands&&bridge.raw.length===92&&s.clock.unacknowledgedCommands===0&&s.clock.unacknowledgedBytes===0&&s.clock.worker.objects===92&&s.clock.worker.unacknowledgedCommands===0&&s.clock.worker.unacknowledgedBytes===0;},2000);
  const pre=health();assert.equal(pre.objects.length,92);assert.equal(pre.clock.unacknowledgedCommands,0);assert.equal(pre.clock.unacknowledgedBytes,0);assert.equal(pre.clock.worker.objects,92);assert.equal(pre.clock.worker.unacknowledgedCommands,0);assert.equal(pre.clock.worker.unacknowledgedBytes,0);report.quiescentBeforeBurst=snapshot('pre-burst');
  sendStage('burst',fixture.burst,fixture.burstSentOffsetsMs);report.burstSendCompletedNodeMs=performance.now();
  await waitUntil(()=>{health();const s=bridge.state();return s.clock.unacknowledgedCommands===0&&s.clock.unacknowledgedBytes===0&&s.clock.worker.objects===92&&s.clock.worker.unacknowledgedCommands===0&&s.clock.worker.unacknowledgedBytes===0&&bridge.records.filter((r:any)=>r.type==='position').length===fixture.expectedPositions&&bridge.raw.length===fixture.expectedPositions&&trace.rows.filter(r=>r.type==='bridge-command-applied').length===intended.length&&report.sendCompletions.length===intended.length;},2500);
  report.intended=intended;const full=health();report.completedState=snapshot('full-denominator');
  const positions=intended.filter(p=>p.type==='position'),records=bridge.records.filter((r:any)=>r.type==='position');assert.equal(records.length,1292);assert.equal(bridge.raw.length,1292);
  positions.forEach((p,i)=>{assert.equal(records[i].objectId,p.objectId);assert.equal(records[i].nodeId,p.nodeId);assert.deepEqual(records[i].position,p.position);assert.equal(bridge.raw[i].hex,encodeOSC(p.objectId,p.position).toString('hex'));});
  report.positionAge={all:summarizeAges(records.map((r:any)=>r.ageMs)),initial:summarizeAges(records.slice(0,92).map((r:any)=>r.ageMs)),burst:summarizeAges(records.slice(92).map((r:any)=>r.ageMs)),scope:'Full observed original sent→bridge receipt age; aged resumed-size burst is not position freshness acceptance'};
  const applied=trace.rows.filter(v=>v.type==='bridge-command-applied');assert.deepEqual(applied.map(v=>v.sequence),Array.from({length:intended.length},(_,i)=>i+1));
  assert.equal(report.sendCompletions.length,intended.length);assert(report.sendCompletions.every((v:any)=>!v.error));assert.equal(full.clock.unacknowledgedCommands,0);assert.equal(full.clock.unacknowledgedBytes,0);assert.equal(full.clock.worker.activeVoices,0);assert.equal(full.clock.worker.pending,0);assert.equal(full.clock.worker.lateDrops,0);assert.equal(full.clock.worker.onsetCount,0);
  const latest=new Map<string,any>();positions.forEach(p=>latest.set(p.nodeId,p));assert.equal(full.objects.length,92);for(const p of latest.values()){const o=full.objects.find((v:any)=>v.nodeId===p.nodeId);assert(o);assert.equal(o.objectId,p.objectId);assert.deepEqual(o.position,p.position);}
  report.fullDenominator={intendedCommands:intended.length,positions:1292,nativeApplied:applied.length,rawOsc:bridge.raw.length,sendCompletions:report.sendCompletions.length};report.status='completed-position-ingress-component';
 }catch(e){report.errors.push(String(e));report.status='failed';}
 finally{
  const begin=performance.now();
  if(client){try{if(client.readyState===WebSocket.OPEN)client.close(1000,'Component cleanup');await bounded(clientClose!,1000);report.cleanup.clientClosed=clientClosed;}catch(e){report.errors.push('Client cleanup '+String(e));client.terminate();report.cleanup.forcedClient=true;}}
  if(bridge){report.beforeClose=snapshot('before-close');const accepted=bridge.records.filter((v:any)=>v.type==='position');report.acceptedPrefixAgesMs=accepted.map((v:any)=>v.ageMs);report.acceptedPrefixAgeSummary=summarizeAges(report.acceptedPrefixAgesMs);report.ageDenominator={expected:1292,accepted:accepted.length,missing:1292-accepted.length,complete:accepted.length===1292};report.records=bridge.records.slice();report.rawOsc=bridge.raw.slice();try{await bounded(bridge.close(),3000);report.cleanup.bridgeClosed=true;const s=bridge.state();report.afterClose=s;assert.equal(s.clock.cleanup.closedAcknowledged,true);assert.equal(s.clock.cleanup.exitObserved,true);assert.equal(s.clock.cleanup.exitCode,0);assert(!s.clock.closeFailure);assert(!s.clock.failure&&!s.clock.clockEvidenceFailure,'Late native failure');assert.equal(s.drops,0);report.cleanup.nativeClosed=true;}catch(e){report.errors.push('Bridge/native cleanup '+String(e));}}
  report.cleanup.elapsedMs=performance.now()-begin;report.trace={rows:trace.rows,bytes:trace.bytes,failed:trace.failed};report.finishedUtc=new Date().toISOString();report.elapsedSeconds=(performance.now()-start)/1000;report.journalFinal=fs.readFileSync(journal,'utf8');
  if(report.status==='completed-position-ingress-component'&&report.clientClose?.code!==1000)report.errors.push('Completed component has abnormal client close');
  if(report.errors.length||trace.failed||!report.cleanup.clientClosed||!report.cleanup.bridgeClosed||!report.cleanup.nativeClosed||report.cleanup.forcedClient||report.cleanup.elapsedMs>5000||report.elapsedSeconds>20||report.journalFinal!=='')report.status='failed';save();
 }
 if(report.status!=='completed-position-ingress-component')process.exitCode=1;
 console.log(JSON.stringify({mode,status:report.status,output,errors:report.errors,cleanup:report.cleanup,qualificationPassed:false}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)void runComponent().catch(e=>{console.error(e);process.exitCode=1;});
