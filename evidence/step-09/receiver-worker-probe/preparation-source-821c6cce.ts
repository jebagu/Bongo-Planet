import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { Worker } from 'node:worker_threads';

// Hypothesis probe only. This file is not an application receiver or an audio
// renderer. --check creates no worker, timer load, browser, socket or audio.
const WORKER_SOURCE=String.raw`
const {parentPort,workerData}=require('node:worker_threads');
const incarnation=workerData.incarnation;
const now=()=>process.hrtime.bigint();
let session='',sequence=0,triggerSequence=0,lastHeartbeat=0n,dead=false;
let pending=[],objects=new Map(),voices=new Map(),expired=new Set(),timer;
let receipts=[],receiptBytes=0,batchSequence=0,inFlight=0,inFlightApplied=0,flightAt=0n,unacknowledged=new Map(),unacknowledgedBytes=0;
let peakPending=0,peakVoices=0,onsetCount=0,lateDrops=0;
function row(type,fields={}){if(dead)return false;const value={type,session,observedHrNs:now().toString(),...fields},bytes=Buffer.byteLength(JSON.stringify(value));if(receipts.length>=8192||receiptBytes+bytes>2097152||bytes>60000){fatal('Receipt count/byte capacity exceeded');return false;}receipts.push(value);receiptBytes+=bytes;return true;}
function flush(){
 if(dead)return;
 if(inFlight){if(now()-flightAt>500000000n)fatal('Receipt acknowledgement timeout');return;}
 if(!receipts.length||dead)return;
 let count=0,bytes=128;
 for(const r of receipts){const n=Buffer.byteLength(JSON.stringify(r));if(n>60000){fatal('Oversized receipt');return;}if(count===64||bytes+n>61440)break;bytes+=n+1;count++;}
 const rows=receipts.splice(0,count);receiptBytes-=rows.reduce((sum,r)=>sum+Buffer.byteLength(JSON.stringify(r)),0);
 inFlightApplied=Math.max(0,...rows.filter(r=>r.type==='applied').map(r=>r.commandSequence));
 inFlight=++batchSequence;flightAt=now();parentPort.postMessage({type:'batch',incarnation,batchSequence:inFlight,rows});
}
function retire(s){expired.add(s);if(expired.size>1000)expired.delete(expired.values().next().value);}
function release(reason){if(dead)return false;const old=session,mutationHrBeforeNs=now();pending=[];voices.clear();objects.clear();session='';const mutationHrAfterNs=now();if(old){retire(old);return row('release',{session:old,reason,pending:0,activeVoices:0,mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString()});}return true;}
function fatal(reason){if(dead)return;dead=true;clearTimeout(timer);clearInterval(health);const state={session,pending:pending.length,activeVoices:voices.size},mutationHrBeforeNs=now();pending=[];voices.clear();objects.clear();session='';const mutationHrAfterNs=now();parentPort.postMessage({type:'fatal',incarnation,reason,observedHrNs:now().toString(),mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString(),state});}
function watchdog(t){if(session&&t-lastHeartbeat>500000000n)return release('Producer heartbeat watchdog');return !dead;}
function state(){return {incarnation,session,pending:pending.length,activeVoices:voices.size,objects:objects.size,peakPending,peakVoices,onsetCount,lateDrops,lastHeartbeatHrNs:lastHeartbeat.toString(),receiptBytes,unacknowledgedCommands:unacknowledged.size,unacknowledgedBytes};}
function expireVoices(){for(const [id,v]of voices)if(v.endHrNs<=now()){const mutationHrBeforeNs=now();voices.delete(id);const mutationHrAfterNs=now();if(!row('voice-expired',{id,mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString()}))return false;}return !dead;}
function dispatch(){
 timer=undefined;if(dead||!watchdog(now())||!expireVoices())return;
 while(pending.length&&pending[0].deadlineHrNs<=now()){
  const popBeforeHrNs=now(),p=pending.shift(),popAfterHrNs=now();if(!row('dispatch-pop',{id:p.id,mutationHrBeforeNs:popBeforeHrNs.toString(),mutationHrAfterNs:popAfterHrNs.toString()}))return;if(p.session!==session)continue;
  // This is the actual callback execution clock, read independently of the
  // deadline and of the parent receiving this report. No audio samples exist.
  const mutationHrBeforeNs=now(),beforeErrorMs=Number(mutationHrBeforeNs-p.deadlineHrNs)/1e6;
  let late=Math.abs(beforeErrorMs)>20,evicted,rollback;
  const mockVoiceAttempted=!late;
  if(!late){
   if(voices.size>=64){const oldest=voices.keys().next().value;evicted=[oldest,voices.get(oldest)];voices.delete(oldest);}
   voices.set(p.id,{nodeId:p.nodeId,endHrNs:mutationHrBeforeNs+BigInt(p.durationNs)});peakVoices=Math.max(peakVoices,voices.size);
  }
  const mutationHrAfterNs=now(),actualHrNs=mutationHrAfterNs,errorMs=Number(actualHrNs-p.deadlineHrNs)/1e6;
  if(!late&&Math.abs(errorMs)>20){
   const rollbackHrBeforeNs=now();voices.delete(p.id);if(evicted)voices=new Map([evicted,...voices]);const rollbackHrAfterNs=now();
   rollback={rollbackHrBeforeNs:rollbackHrBeforeNs.toString(),rollbackHrAfterNs:rollbackHrAfterNs.toString(),restoredEvictedId:evicted?.[0]??null};late=true;
  }
  if(!late&&evicted&&!row('steal',{id:evicted[0],mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString()}))return;
  if(late)lateDrops++;else onsetCount++;
  if(!row(late?'late-drop':'onset',{id:p.id,nodeId:p.nodeId,generatorId:p.generatorId,objectId:p.objectId,position:[...objects.get(p.nodeId).position],
   intendedHrNs:p.deadlineHrNs.toString(),intendedNodeNs:p.intendedNodeNs,actualHrNs:actualHrNs.toString(),mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString(),beforeErrorMs,errorMs,mockVoiceAttempted,mockVoiceWritten:!late,lateMutationRolledBack:!!rollback,rollback,activeVoices:voices.size,pending:pending.length}))return;
 }
 flush();schedule();
}
function schedule(){
 clearTimeout(timer);timer=undefined;if(dead||!pending.length)return;
 const delay=Number(pending[0].deadlineHrNs-now())/1e6;
 // Ordinary worker timers only; no busy wait and no deliberate early callback.
 timer=setTimeout(dispatch,Math.max(0,delay));
}
const health=setInterval(()=>{if(dead||!watchdog(now())||!expireVoices())return;flush();schedule();},25);
parentPort.on('message',c=>{
 const receivedHrNs=now();if(c.incarnation!==incarnation){if(!row('stale-incarnation',{incomingIncarnation:c.incarnation}))return;flush();return;}
 if(c.type==='ack'){
  if(c.batchSequence!==inFlight||!inFlight){fatal('Receipt ACK gap/order violated');return;}
  for(const [n,bytes]of unacknowledged)if(n<=inFlightApplied){unacknowledged.delete(n);unacknowledgedBytes-=bytes;}
  inFlight=0;flush();return;
 }
 if(c.type==='close'){clearTimeout(timer);clearInterval(health);release('Probe close');parentPort.postMessage({type:'closed',incarnation,observedHrNs:now().toString(),state:state()});parentPort.close();return;}
 if(dead)return;
 if(!watchdog(now()))return; // buffered heartbeats cannot revive an expired epoch
 const commandBytes=Buffer.byteLength(JSON.stringify(c));if(commandBytes>65536||unacknowledged.size>=8192||unacknowledgedBytes+commandBytes>262144){fatal('Command count/byte capacity exceeded');return;}
 if(!Number.isSafeInteger(c.sequence)||c.sequence!==sequence+1){fatal('Command ordering/gap violated');return;}
 sequence=c.sequence;
 unacknowledged.set(sequence,commandBytes);unacknowledgedBytes+=commandBytes;
 const mutationHrBeforeNs=now();
 if(c.type==='start'){
  if(!c.session?.startsWith(incarnation+'/')||c.session===session||expired.has(c.session)){fatal('Retired/nonfresh epoch reused');return;}
  if(!release('New epoch'))return;session=c.session;triggerSequence=0;lastHeartbeat=now();if(!row('started'))return;
 }else if(c.type==='clock'){if(!row('clock',{requestSequence:c.sequence,parentSentHrNs:c.parentSentHrNs,workerObservedHrNs:receivedHrNs.toString()}))return;}
 else if(c.type==='snapshot'){if(!row('snapshot',{requestSequence:c.sequence,state:state()}))return;}
 else if(c.session!==session||!session){if(!row('stale',{incomingSession:c.session,command:c.type}))return;}
 else if(c.type==='heartbeat'){lastHeartbeat=now();}
 else if(c.type==='stop'){if(!release(c.reason||'Producer stop'))return;}
 else if(c.type==='position'){
  if(objects.has(c.nodeId)&&objects.get(c.nodeId).objectId!==c.objectId){fatal('Active object binding changed');return;}
  if(!objects.has(c.nodeId)&&objects.size>=92){fatal('Object capacity exceeded');return;}
  objects.set(c.nodeId,{objectId:c.objectId,position:[...c.position]});
 }else if(c.type==='cancel'){
  const ids=new Set(c.ids),nodes=new Set(c.nodeIds);pending=pending.filter(p=>!ids.has(p.id)&&!nodes.has(p.nodeId));
  for(const [id,v]of voices)if(ids.has(id)||nodes.has(v.nodeId))voices.delete(id);
  for(const node of nodes)objects.delete(node);if(!row('cancelled',{ids:c.ids.length,nodeIds:c.nodeIds.length,state:state()}))return;schedule();
 }else if(c.type==='trigger'){
  if(c.triggerSequence<=triggerSequence||objects.get(c.nodeId)?.objectId!==c.objectId){fatal('Trigger ordering/object mismatch');return;}
  triggerSequence=c.triggerSequence;if(pending.length>=5376){fatal('Pending capacity exceeded');return;}
  const deadlineHrNs=BigInt(c.deadlineHrNs);
  pending.push({...c,deadlineHrNs});pending.sort((a,b)=>a.deadlineHrNs<b.deadlineHrNs?-1:a.deadlineHrNs>b.deadlineHrNs?1:a.triggerSequence-b.triggerSequence);
  peakPending=Math.max(peakPending,pending.length);if(!row('queued',{id:c.id,intendedHrNs:deadlineHrNs.toString(),receivedHrNs:receivedHrNs.toString(),queueLeadMs:Number(deadlineHrNs-receivedHrNs)/1e6,pending:pending.length}))return;schedule();
 }else if(c.type==='diagnostic-block'){
  const blockBeforeHrNs=now();Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,c.durationMs);const blockAfterHrNs=now();
  if(!row('worker-block',{requestedMs:c.durationMs,blockBeforeHrNs:blockBeforeHrNs.toString(),blockAfterHrNs:blockAfterHrNs.toString()}))return;if(!watchdog(now()))return;
 }else if(c.type==='diagnostic-old-receipt'){
  // A tagged protocol-negative message, never an onset/sample/voice witness.
  parentPort.postMessage({type:'protocol-negative',incarnation:'retired-'+incarnation,observedHrNs:now().toString(),requestSequence:c.sequence});
 }else{fatal('Unknown command');return;}
 if(dead)return;const mutationHrAfterNs=now();if(!row('applied',{commandSequence:c.sequence,workerReceivedHrNs:receivedHrNs.toString(),parentSentHrNs:c.parentSentHrNs,mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString()}))return;flush();
});
parentPort.on('messageerror',()=>fatal('Worker message deserialization failed'));
parentPort.postMessage({type:'ready',incarnation,observedHrNs:now().toString(),clock:'process.hrtime.bigint',threadId:require('node:worker_threads').threadId});
`;

const sourcePath=path.resolve('scripts/receiver-worker-probe.ts');
const sourceSha256=createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
const workerSha256=createHash('sha256').update(WORKER_SOURCE).digest('hex');
const artifactRoot=path.resolve('evidence/step-09/receiver-worker-probe');
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
type OriginPair={beforeHrNs:string;performanceMs:number;afterHrNs:string;offsetLowerNs:string;offsetUpperNs:string;widthNs:string};
function originPair():OriginPair{
  const before=process.hrtime.bigint(),perf=performance.now(),after=process.hrtime.bigint(),perfNs=BigInt(Math.round(perf*1e6));
  // ±0.5ns accounts for rounding performance milliseconds to integer ns.
  return {beforeHrNs:before.toString(),performanceMs:perf,afterHrNs:after.toString(),offsetLowerNs:(before-perfNs-1n).toString(),offsetUpperNs:(after-perfNs+1n).toString(),widthNs:(after-before+2n).toString()};
}
function calibrate(){const samples=Array.from({length:32},originPair),chosen=samples.reduce((a,b)=>BigInt(a.widthNs)<=BigInt(b.widthNs)?a:b);return {samples,chosen,offsetNs:(BigInt(chosen.offsetLowerNs)+BigInt(chosen.offsetUpperNs))/2n};}
function originAgreement(chosen:OriginPair,heldOut:OriginPair[],injectedOffsetNs=0n){
  const lower=BigInt(chosen.offsetLowerNs)+injectedOffsetNs,upper=BigInt(chosen.offsetUpperNs)+injectedOffsetNs;
  return heldOut.every(pair=>lower<=BigInt(pair.offsetUpperNs)&&BigInt(pair.offsetLowerNs)<=upper);
}
function eligibleIncarnation(active:string|null,received:string){return active!==null&&active===received;}
function checkedPredicate(predicate:()=>boolean,error:()=>string){if(error())throw Error(error());const satisfied=predicate();if(error())throw Error(error());return satisfied;}
function capacityRegression(){
  // Controlled embedded-source regression; no Worker, OS timers or loads run.
  const cases=['dispatch-pop','new-epoch-release','late-voice-rollback'].map(name=>{
    const messages:any[]=[],handlers:Record<string,(data:any)=>void>={};let fakeHr=name==='late-voice-rollback'?1_019_900_000n:1_000_000_000n;
    class ControlledMap extends Map{override set(key:any,value:any){const result=super.set(key,value);if(name==='late-voice-rollback'&&key==='control')fakeHr=1_020_100_000n;return result;}}
    const sandbox=vm.createContext({Buffer,Map:ControlledMap,Set,BigInt,Atomics,SharedArrayBuffer,Int32Array,
      process:{hrtime:{bigint:()=>fakeHr}},require:()=>({workerData:{incarnation:'dry'},threadId:0,parentPort:{postMessage:(message:any)=>messages.push(message),on:(event:string,handler:(data:any)=>void)=>{handlers[event]=handler;},close:()=>{}}}),
      setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{}});
    vm.runInContext(WORKER_SOURCE,sandbox);
    vm.runInContext("session='dry/old';lastHeartbeat=1000000000n;objects.set('node',{objectId:1,position:[0,0,1]});voices.set('old',{endHrNs:2000000000n});receipts=Array.from({length:8192},()=>({type:'filler'}));receiptBytes=0;pending=[{id:'control',session:'dry/old',nodeId:'node',deadlineHrNs:1000000000n,durationNs:'1000000000'}]",sandbox);
    if(name==='late-voice-rollback'){
      vm.runInContext("receipts=[];receiptBytes=0;voices.clear();for(let i=0;i<64;i++)voices.set('old-'+i,{endHrNs:4000000000n});",sandbox);
      vm.runInContext('dispatch()',sandbox);const rows=messages.flatMap(message=>message.rows??[]),late=rows.find(row=>row.type==='late-drop');
      const state=vm.runInContext("({dead,voices:voices.size,oldest:voices.keys().next().value,controlPresent:voices.has('control')})",sandbox);
      return {name,pass:!state.dead&&state.voices===64&&state.oldest==='old-0'&&!state.controlPresent&&late?.mockVoiceAttempted===true&&late?.lateMutationRolledBack===true&&late?.beforeErrorMs===19.9&&late?.errorMs===20.1&&!rows.some(row=>row.type==='steal'),state,late};
    }
    if(name==='dispatch-pop')vm.runInContext('dispatch()',sandbox);else handlers.message({type:'start',incarnation:'dry',session:'dry/new',sequence:1});
    const state=vm.runInContext('({dead,session,pending:pending.length,voices:voices.size,objects:objects.size})',sandbox);
    return {name,pass:state.dead&&state.session===''&&state.pending===0&&state.voices===0&&state.objects===0&&messages.filter(m=>m.type==='fatal').length===1,state,fatal:messages.find(m=>m.type==='fatal')};
  });return cases;
}
function summary(values:number[]){const sorted=[...values].sort((a,b)=>a-b);return {count:sorted.length,p50:sorted[Math.floor(sorted.length*.5)]??null,p95:sorted[Math.floor(sorted.length*.95)]??null,max:sorted.at(-1)??null};}
const run=process.argv.includes('--run');
if(process.argv.some(arg=>arg.startsWith('--')&&arg!=='--run'&&arg!=='--check'))throw Error('Use --check or --run');
new vm.Script(WORKER_SOURCE,{filename:'bongo-worker-control-probe.cjs'});
if(!run){
  let errorBeforePredicateRejected=false,errorAfterPredicateRejected=false;
  try{checkedPredicate(()=>true,()=> 'late-worker-error');}catch{errorBeforePredicateRejected=true;}
  let error='';try{checkedPredicate(()=>{error='during-predicate-error';return true;},()=>error);}catch{errorAfterPredicateRejected=true;}
  const clock=calibrate(),heldOut=calibrate(),capacityRegressions=capacityRegression(),guards={heldOutCompatible:originAgreement(clock.chosen,heldOut.samples),injected50msOriginRejected:!originAgreement(clock.chosen,heldOut.samples,50000000n),oldIncarnationRejected:!eligibleIncarnation('new','old'),closedIncarnationRejected:!eligibleIncarnation(null,'old'),errorBeforePredicateRejected,errorAfterPredicateRejected,capacityFailCannotRevive:capacityRegressions.filter(row=>row.name!=='late-voice-rollback').every(row=>row.pass),lateStealRollbackRestoresVoice:capacityRegressions.find(row=>row.name==='late-voice-rollback')?.pass===true};fs.mkdirSync(artifactRoot,{recursive:true});
  const report={title:'Bongo Planet worker control-clock probe preparation',date:new Date().toISOString(),sourceSha256,workerSha256,syntaxPass:true,workerLaunched:false,browserLaunched:false,audioOpened:false,intentionalLoadRun:false,clock:{...clock,offsetNs:clock.offsetNs.toString()},heldOutClock:{samples:heldOut.samples,chosen:heldOut.chosen},guards,capacityRegressions,limitations:['Syntax, held-out clock brackets, pure predicate guards and controlled embedded-source capacity regressions only; no OS scheduling, real Worker, throughput or application qualification.']};
  const file=path.join(artifactRoot,`preparation-${Date.now()}.json`);fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({syntaxPass:true,workerLaunched:false,clockBracketWidthNs:clock.chosen.widthNs,guards,report:file}));if(Object.values(guards).some(passed=>!passed))process.exitCode=1;
}else{
  const directory=path.join(artifactRoot,`run-${new Date().toISOString().replace(/[:.]/g,'-')}`);
  fs.mkdirSync(directory,{recursive:false});fs.copyFileSync(sourcePath,path.join(directory,'receiver-worker-probe.ts'));fs.writeFileSync(path.join(directory,'worker.cjs'),WORKER_SOURCE);
  const origin=calibrate(),heldOutStart=calibrate(),offsetNs=origin.offsetNs,incarnation=randomUUID();
  const intendedHr=(perfMs:number)=>BigInt(Math.round(perfMs*1e6))+offsetNs;
  const epoch=(label:string)=>`${incarnation}/${label}`;
  const worker=new Worker(WORKER_SOURCE,{eval:true,workerData:{incarnation},stdout:true,stderr:true});
  const records:any[]=[],commands:any[]=[],cases:any[]=[],failures:string[]=[],ignoredReceipts:any[]=[],workerErrors:any[]=[];
  let ready=false,closed=false,workerError='',sequence=0,applied=0,lastBatchSequence=0,activeIncarnation:string|null=incarnation,ignoredOldReceipts=0,unacknowledgedBytes=0,workerStdio='',heartbeat:ReturnType<typeof setInterval>|undefined;
  const unacknowledged=new Map<number,number>();
  const cleanup={workerClosed:false,gracefulCloseAcknowledged:false,terminationRequested:false,forcedTermination:false,workerExitObserved:false,workerExitCode:null as number|null,browserOpened:false,audioOpened:false};
  const setWorkerError=(reason:string)=>{if(!workerError)workerError=reason;if(workerErrors.length<64)workerErrors.push({reason,observedHrNs:process.hrtime.bigint().toString()});};
  const forceTerminate=()=>{cleanup.terminationRequested=true;cleanup.forcedTermination=true;return worker.terminate();};
  worker.on('message',message=>{
    const reportArrivalHrNs=process.hrtime.bigint().toString(),reportArrivalPerformanceMs=performance.now();
    if(!eligibleIncarnation(activeIncarnation,message.incarnation)){ignoredOldReceipts++;if(ignoredReceipts.length<16)ignoredReceipts.push({message,reportArrivalHrNs,reportArrivalPerformanceMs,reason:'Incarnation inactive/mismatch'});return;}
    if(Buffer.byteLength(JSON.stringify(message))>65536){setWorkerError('Parent receipt byte bound exceeded');void forceTerminate();return;}
    if(message.type==='batch'&&(message.batchSequence!==lastBatchSequence+1||!Array.isArray(message.rows)||message.rows.length>64)){setWorkerError('Parent receipt batch gap/order/count violated');void forceTerminate();return;}
    if(message.type==='batch')lastBatchSequence=message.batchSequence;
    if(message.type==='ready')ready=true;
    if(message.type==='closed'){closed=true;cleanup.gracefulCloseAcknowledged=true;}
    if(message.type==='fatal')setWorkerError(message.reason);
    const rows=message.type==='batch'?message.rows:[message];
    for(const row of rows){records.push({...row,incarnation,reportArrivalHrNs,reportArrivalPerformanceMs});if(row.type==='applied'){
      if(row.commandSequence!==applied+1){setWorkerError('Parent applied acknowledgement gap/order violated');void forceTerminate();return;}
      applied=row.commandSequence;const bytes=unacknowledged.get(applied);if(bytes===undefined){setWorkerError('Unknown command acknowledgement');void forceTerminate();return;}
      unacknowledged.delete(applied);unacknowledgedBytes-=bytes;
    }}
    if(records.length>50000){setWorkerError('Parent evidence bound exceeded');void forceTerminate();return;}
    if(message.type==='batch')worker.postMessage({type:'ack',incarnation,batchSequence:message.batchSequence});
  });
  worker.on('error',error=>{setWorkerError(String(error));});
  worker.on('messageerror',()=>{setWorkerError('Parent message deserialization failed');void forceTerminate();});
  worker.on('exit',code=>{cleanup.workerExitObserved=true;cleanup.workerExitCode=code;if(!closed)setWorkerError(`Worker exited before clean close (${code})`);else if(code!==0&&!cleanup.forcedTermination)setWorkerError(`Worker graceful exit failed (${code})`);});
  const stdio=(data:Buffer)=>{workerStdio+=data.toString();if(Buffer.byteLength(workerStdio)>65536){setWorkerError('Worker stdio byte limit exceeded');void forceTerminate();}};
  worker.stdout.on('data',stdio);worker.stderr.on('data',stdio);
  const send=(command:Record<string,unknown>)=>{
    const parentSentHrNs=process.hrtime.bigint().toString(),packet={...command,incarnation,sequence:sequence+1,parentSentHrNs},bytes=Buffer.byteLength(JSON.stringify(packet));
    if(bytes>65536||unacknowledged.size>=8192||unacknowledgedBytes+bytes>262144)throw Error('Parent command count/byte bound exceeded');
    sequence++;unacknowledged.set(sequence,bytes);unacknowledgedBytes+=bytes;commands.push({sentHrNs:parentSentHrNs,sentPerformanceMs:performance.now(),packet});worker.postMessage(packet);return sequence;
  };
  const until=async(predicate:()=>boolean,reason:string,timeout=4000)=>{const start=performance.now();while(!checkedPredicate(predicate,()=>workerError)){if(performance.now()-start>timeout)throw Error(reason);await sleep(5);}};
  const waitApplied=async(n:number)=>until(()=>applied>=n,'Command acknowledgement missing');
  const checks=(name:string,checks:Record<string,boolean>,extra:Record<string,unknown>={})=>{for(const [key,passed]of Object.entries(checks))if(!passed)failures.push(`${name}: ${key}`);const result={name,checks,...extra};cases.push(result);console.log(JSON.stringify({case:name,checks}));};
  const beat=(session:string)=>{if(heartbeat)clearInterval(heartbeat);heartbeat=setInterval(()=>{try{send({type:'heartbeat',session});}catch(error){setWorkerError(String(error));worker.postMessage({type:'close',incarnation});}},100);};
  const start=async(session:string,count=1)=>{await waitApplied(send({type:'start',session}));for(let i=0;i<count;i++)send({type:'position',session,nodeId:`node-${i}`,objectId:i+1,position:[0,0,1]});await waitApplied(sequence);beat(session);};
  const trigger=(session:string,id:string,triggerSequence:number,deadlineHrNs:bigint,node=0,durationNs='1000000000',intendedNodeNs=deadlineHrNs-offsetNs)=>send({type:'trigger',session,id,triggerSequence,nodeId:`node-${node}`,objectId:node+1,generatorId:'generator',deadlineHrNs:deadlineHrNs.toString(),intendedNodeNs:intendedNodeNs.toString(),durationNs});
  const snapshot=async()=>{const requestSequence=send({type:'snapshot'});await until(()=>records.some(r=>r.type==='snapshot'&&r.requestSequence===requestSequence),'Snapshot missing');return records.find(r=>r.type==='snapshot'&&r.requestSequence===requestSequence).state;};
  const started=new Date().toISOString();
  try{
    await until(()=>ready,'Worker startup failed');
    const clockContainment:any[]=[];
    const crossThreadCheck=async(count:number)=>{for(let i=0;i<count;i++){
      const requestSequence=send({type:'clock'});await until(()=>records.some(r=>r.type==='clock'&&r.requestSequence===requestSequence),'Cross-thread clock witness missing');
      const witness=records.find(r=>r.type==='clock'&&r.requestSequence===requestSequence),sent=BigInt(witness.parentSentHrNs),observed=BigInt(witness.workerObservedHrNs),received=BigInt(witness.reportArrivalHrNs);
      clockContainment.push({witness,contained:sent<=observed&&observed<=received});
    }};
    await crossThreadCheck(8);
    checks('independent-monotonic-origin',{heldOutIntervalsCompatible:originAgreement(origin.chosen,heldOutStart.samples),injected50msOffsetRejected:!originAgreement(origin.chosen,heldOutStart.samples,50000000n),crossThreadCausalContainment:clockContainment.every(row=>row.contained)},
      {heldOutSamples:heldOutStart.samples,clockContainment:[...clockContainment],injectedOffsetNs:'50000000'});
    {
      const session=epoch('incarnation');await start(session);const before=await snapshot(),ignoredBefore=ignoredOldReceipts;
      worker.postMessage({type:'start',incarnation:'retired-'+incarnation,session:'old-process-session',sequence:999});
      await until(()=>records.some(row=>row.type==='stale-incarnation'),'Old-incarnation command not rejected');
      await waitApplied(send({type:'diagnostic-old-receipt',session}));const after=await snapshot();
      checks('incarnation-boundary',{freshWorkerIdentity:after.incarnation===incarnation,freshSessionPrefix:after.session.startsWith(incarnation+'/'),oldCommandCannotReplaceEpoch:before.session===after.session,oldReceiptIgnored:ignoredOldReceipts===ignoredBefore+1,noFabricatedOnset:!records.some(row=>row.type==='onset')},{before,after,ignoredReceipts:[...ignoredReceipts]});
    }
    for(const durationMs of [100,250]){
      const label=`parent-block-${durationMs}`,session=epoch(label),id=`${label}-1`;await start(session);
      const deadlinePerformanceMs=performance.now()+550,deadlineHrNs=intendedHr(deadlinePerformanceMs);
      const intendedNodeNs=BigInt(Math.round(deadlinePerformanceMs*1e6));
      await waitApplied(trigger(session,id,1,deadlineHrNs,0,'1000000000',intendedNodeNs));const queued=records.find(r=>r.type==='queued'&&r.id===id);
      let negative:any;
      const parentTimer=setTimeout(()=>{const actualHrNs=process.hrtime.bigint();negative={intendedHrNs:deadlineHrNs.toString(),actualHrNs:actualHrNs.toString(),errorMs:Number(actualHrNs-deadlineHrNs)/1e6};},Math.max(0,deadlinePerformanceMs-performance.now()));
      await sleep(Math.max(0,deadlinePerformanceMs-30-performance.now()));
      const blockBeginHrNs=process.hrtime.bigint();Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,durationMs);const blockEndHrNs=process.hrtime.bigint();
      await until(()=>records.some(r=>['onset','late-drop'].includes(r.type)&&r.id===id)&&!!negative,'Block control did not report');clearTimeout(parentTimer);
      const actual=records.find(r=>['onset','late-drop'].includes(r.type)&&r.id===id);
      checks(label,{prequeueLeadAtLeast400ms:queued?.queueLeadMs>=400,actualControlOnset:actual.type==='onset'&&actual.mockVoiceWritten,
        actualWithin20ms:Math.abs(actual.errorMs)<=20,exactlyOnce:records.filter(r=>r.type==='onset'&&r.id===id).length===1,
        workerExecutedDuringBlockedParent:BigInt(actual.actualHrNs)>=blockBeginHrNs&&BigInt(actual.actualHrNs)<=blockEndHrNs,
        originalParentTimerFails20ms:negative.errorMs>20},
        {requestedBlockMs:durationMs,actualBlockMs:Number(blockEndHrNs-blockBeginHrNs)/1e6,blockBeginHrNs:blockBeginHrNs.toString(),blockEndHrNs:blockEndHrNs.toString(),queued,actual,parentTimerNegativeControl:negative});
    }
    {
      const session=epoch('cancel');await start(session);const base=performance.now();
      await waitApplied(trigger(session,'cancel-active',1,intendedHr(base+450)));await waitApplied(trigger(session,'cancel-future',2,intendedHr(base+850)));
      await until(()=>records.some(r=>r.type==='onset'&&r.id==='cancel-active'),'Active cancellation onset missing');
      await waitApplied(send({type:'cancel',session,ids:['cancel-active','cancel-future'],nodeIds:[]}));const afterCancel=await snapshot();
      await sleep(Math.max(0,base+950-performance.now()));
      checks('cancel-pending-and-active',{pendingReleased:afterCancel.pending===0,activeReleased:afterCancel.activeVoices===0,futureNeverExecuted:!records.some(r=>['onset','late-drop'].includes(r.type)&&r.id==='cancel-future')},{afterCancel});
    }
    {
      const old=epoch('old-epoch'),next=epoch('new-epoch');await start(old);const deadline=performance.now()+450;
      await waitApplied(trigger(old,'old-epoch-1',1,intendedHr(deadline)));await start(next);
      await waitApplied(send({type:'heartbeat',session:old}));await waitApplied(trigger(old,'stale-trigger',2,intendedHr(deadline+100)));
      await sleep(Math.max(0,deadline+150-performance.now()));const state=await snapshot();
      checks('epoch-replacement',{newEpochRetained:state.session===next,oldPendingReleased:state.pending===0,noOldOrStaleOnset:!records.some(r=>r.type==='onset'&&['old-epoch-1','stale-trigger'].includes(r.id)),stalePacketWitness:records.some(r=>r.type==='stale'&&r.incomingSession===old)},{state});
    }
    {
      const session=epoch('late-negative');await start(session);await waitApplied(trigger(session,'late-negative-1',1,intendedHr(performance.now()-30)));
      await until(()=>records.some(r=>r.type==='late-drop'&&r.id==='late-negative-1'),'Negative late guard did not report');const actual=records.find(r=>r.type==='late-drop'&&r.id==='late-negative-1');
      checks('past-deadline-negative',{unchanged20msGuard:actual.errorMs>20,noMockVoiceWrite:actual.mockVoiceWritten===false,noVoice:!(await snapshot()).activeVoices},{actual});
    }
    {
      const session=epoch('worker-dispatch-negative');await start(session);const deadlinePerformanceMs=performance.now()+450;
      await waitApplied(trigger(session,'worker-dispatch-negative-1',1,intendedHr(deadlinePerformanceMs)));
      await sleep(Math.max(0,deadlinePerformanceMs-30-performance.now()));
      await waitApplied(send({type:'diagnostic-block',session,durationMs:100}));
      await until(()=>records.some(r=>r.type==='late-drop'&&r.id==='worker-dispatch-negative-1'),'Worker late-dispatch negative did not fail');
      const actual=records.find(r=>r.type==='late-drop'&&r.id==='worker-dispatch-negative-1'),block=records.find(r=>r.type==='worker-block'&&r.session===session);
      checks('worker-dispatch-negative',{workerDelayStillFails20ms:actual.errorMs>20,noMockVoiceWrite:actual.mockVoiceWritten===false,actualWorkerBlock:BigInt(block.blockAfterHrNs)-BigInt(block.blockBeforeHrNs)>=100000000n},{actual,block});
    }
    {
      const session=epoch('watchdog');await start(session);await waitApplied(trigger(session,'watchdog-active',1,intendedHr(performance.now()+450),0,'2000000000'));
      await until(()=>records.some(r=>r.type==='onset'&&r.id==='watchdog-active'),'Watchdog active onset missing');
      if(heartbeat)clearInterval(heartbeat);heartbeat=undefined;const last=(await snapshot()).lastHeartbeatHrNs;
      await until(()=>records.some(r=>r.type==='release'&&r.session===session&&r.reason==='Producer heartbeat watchdog'),'Watchdog did not release',1200);
      const release=records.find(r=>r.type==='release'&&r.session===session&&r.reason==='Producer heartbeat watchdog');const state=await snapshot();
      await waitApplied(send({type:'heartbeat',session}));const afterStale=await snapshot();
      const leaseAgeMs=Number(BigInt(release.observedHrNs)-BigInt(last))/1e6;
      checks('producer-heartbeat-watchdog',{actualLeaseExpired:leaseAgeMs>500,boundedDetection:leaseAgeMs<=600,pendingReleased:state.pending===0,activeReleased:state.activeVoices===0,epochReleased:state.session==='',staleHeartbeatCannotRevive:afterStale.session===''&&afterStale.activeVoices===0}, {release,state,afterStale,leaseAgeMs});
    }
    {
      const session=epoch('throughput'),rate=2016,durationSeconds=3,total=rate*durationSeconds,chunkSize=126;await start(session,92);
      const streamStart=performance.now(),anchorNodeNs=BigInt(Math.round((streamStart+650)*1e6)),anchor=anchorNodeNs+offsetNs;
      for(let first=0;first<total;first+=chunkSize){
        await sleep(Math.max(0,streamStart+first*1000/rate-performance.now()));
        for(let i=first;i<Math.min(total,first+chunkSize);i++){const stepNs=BigInt(i)*1000000000n/BigInt(rate);trigger(session,`throughput-${i+1}`,i+1,anchor+stepNs,i%92,'800000000',anchorNodeNs+stepNs);}
        await waitApplied(sequence);
      }
      await until(()=>records.filter(r=>['onset','late-drop'].includes(r.type)&&r.session===session).length>=total,'Throughput receipts missing',5000);
      const actual=records.filter(r=>r.type==='onset'&&r.session===session),late=records.filter(r=>r.type==='late-drop'&&r.session===session),queued=records.filter(r=>r.type==='queued'&&r.session===session);
      const state=await snapshot(),errors=summary(actual.map(r=>Math.abs(r.errorMs))),duplicates=actual.length-new Set(actual.map(r=>r.id)).size;
      checks('2016-controls-per-second',{expectedCount:actual.length===total,exactlyOnce:duplicates===0&&Array.from({length:total},(_,i)=>`throughput-${i+1}`).every(id=>actual.some(r=>r.id===id)),noLateDrops:late.length===0,
        p95Within20ms:(errors.p95??Infinity)<=20,allWithin20ms:(errors.max??Infinity)<=20,prequeueLeadAtLeast400ms:queued.length===total&&queued.every(r=>r.queueLeadMs>=400),pendingWithin5376:state.peakPending<=5376,voicesWithin64:state.peakVoices<=64},
        {rate,durationSeconds,total,anchorHrNs:anchor.toString(),anchorNodeNs:anchorNodeNs.toString(),streamStartPerformanceMs:streamStart,actualCount:actual.length,lateCount:late.length,duplicates,absoluteErrorMs:errors,queueLeadMs:summary(queued.map(r=>r.queueLeadMs)),state});
    }
    await crossThreadCheck(8);checks('end-cross-thread-clock',{causalContainment:clockContainment.every(row=>row.contained)},{clockContainment});
  }catch(error){failures.push(String(error));console.error(String(error));}
  finally{
    if(heartbeat)clearInterval(heartbeat);
    if(!cleanup.workerExitObserved)worker.postMessage({type:'close',incarnation});
    // Cleanup must still collect close/exit evidence after a recorded failure.
    // It deliberately does not suppress that failure via the normal waiter.
    const deadline=performance.now()+1000;while(!cleanup.workerExitObserved&&performance.now()<deadline)await sleep(5);
    if(!closed)failures.push('Graceful worker close acknowledgement missing');
    if(!cleanup.workerExitObserved){await forceTerminate();failures.push('Worker required forced termination');}
    cleanup.workerClosed=closed&&cleanup.workerExitObserved&&cleanup.workerExitCode===0&&!cleanup.forcedTermination;
    if(!cleanup.workerClosed)failures.push('Worker did not complete acknowledged graceful close');
    activeIncarnation=null;
  }
  const endClock=calibrate(),startLow=BigInt(origin.chosen.offsetLowerNs),startHigh=BigInt(origin.chosen.offsetUpperNs),endLow=BigInt(endClock.chosen.offsetLowerNs),endHigh=BigInt(endClock.chosen.offsetUpperNs);
  const compatible=startLow<=endHigh&&endLow<=startHigh&&originAgreement(origin.chosen,endClock.samples);
  const conversionBoundNs=[offsetNs-startLow,startHigh-offsetNs,offsetNs-endLow,endHigh-offsetNs].map(n=>n<0n?-n:n).reduce((a,b)=>a>b?a:b);
  if(!compatible)failures.push('Independent start/end monotonic-origin intervals incompatible');
  // Held-out origins independently assess the caller's Node deadlines. An
  // injected wrong offset cannot cancel between scheduled and reported time.
  const heldOut=[...heldOutStart.samples,...endClock.samples],heldLow=heldOut.map(pair=>BigInt(pair.offsetLowerNs)).reduce((a,b)=>a>b?a:b),heldHigh=heldOut.map(pair=>BigInt(pair.offsetUpperNs)).reduce((a,b)=>a<b?a:b);
  if(heldLow>heldHigh)failures.push('Held-out origin intervals have no common monotonic conversion');
  const independentlyBoundedOnsets=records.filter(row=>row.type==='onset').map(row=>{
    const actual=BigInt(row.actualHrNs),intended=BigInt(row.intendedNodeNs),lower=Number(actual-heldHigh-intended)/1e6,upper=Number(actual-heldLow-intended)/1e6;
    return {id:row.id,intendedNodeNs:row.intendedNodeNs,actualHrNs:row.actualHrNs,errorLowerMs:lower,errorUpperMs:upper,absoluteErrorBoundMs:Math.max(Math.abs(lower),Math.abs(upper))};
  });
  if(independentlyBoundedOnsets.some(row=>row.absoluteErrorBoundMs>20))failures.push('Held-out independent caller-clock callback bound exceeds20ms');
  const appliedRows=records.filter(row=>row.type==='applied');
  if(appliedRows.some(row=>BigInt(row.parentSentHrNs)>BigInt(row.workerReceivedHrNs)||BigInt(row.workerReceivedHrNs)>BigInt(row.reportArrivalHrNs)))failures.push('Cross-thread command ingress containment failed');
  if(records.some(row=>row.mutationHrBeforeNs&&BigInt(row.mutationHrBeforeNs)>BigInt(row.mutationHrAfterNs)))failures.push('Control mutation bracket reversed');
  for(const error of workerErrors)if(!failures.includes(error.reason))failures.push(error.reason);
  if(workerError&&!failures.includes(workerError))failures.push(workerError);
  const report={title:'Bongo Planet isolated native worker control-clock hypothesis',started,ended:new Date().toISOString(),sourceSha256,workerSha256,command:'npx tsx scripts/receiver-worker-probe.ts --run',environment:{node:process.version,platform:process.platform,arch:process.arch},
    hypothesis:'Shared native monotonic timing and worker-owned queues remove UTC mapping and parent dispatch from actual control callbacks; shared host/worker descheduling can still fail.',
    origin:{samples:origin.samples,chosen:origin.chosen,fixedOffsetNs:offsetNs.toString()},heldOutStart:{samples:heldOutStart.samples,chosen:heldOutStart.chosen},endClock:{samples:endClock.samples,chosen:endClock.chosen},originIntervalsCompatible:compatible,conservativeMonotonicConversionUncertaintyMs:Number(conversionBoundNs)/1e6,
    heldOutOriginIntervalNs:[heldLow.toString(),heldHigh.toString()],independentlyBoundedOnsets,independentCallerErrorBoundMs:summary(independentlyBoundedOnsets.map(row=>row.absoluteErrorBoundMs)),
    incarnation,cases,failures,workerError,workerErrors,commands,records,cleanup,ignoredOldReceipts,ignoredReceipts,workerStdio,limitations:['Numerical control callbacks and mock voice state only; no audio, physical presentation, frame or sample timing is claimed.','This isolated MessagePort probe does not qualify application WebSocket/UDP ingress, producer audio/main-thread mapping, cancellation integration or F01/F04.','Worker timers can still miss deadlines under worker/shared-host descheduling; unchanged20ms failures are retained.','Report arrival and actual callback hrtime are independently retained; a delayed parent report is not an onset timestamp.','Incarnation rejection includes explicitly tagged protocol-negative traffic; it is not a fabricated actual control onset.']};
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,cases:cases.length,failures,cleanup}));if(failures.length)process.exitCode=1;
}
