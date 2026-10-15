import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { Worker } from 'node:worker_threads';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WebSocket } from 'ws';
import { packetSchema } from './../../../../../src/output/protocol.ts';
import type { ReceiverClock, ReceiverClockCommand, ReceiverClockHooks, NativeReceiverOnset } from './../../../../../src/output/ReceiverClock.ts';

/** Worker controls are numerical companion state; this module renders no audio. */
export const NATIVE_WORKER_SOURCE = "\nconst {parentPort,workerData}=require('node:worker_threads');\nconst incarnation=workerData.incarnation,poison=new Int32Array(workerData.poison);\nlet clockBudget=null,closing=false;\nconst now=()=>process.hrtime.bigint();\n\nconst {performance:diagPerformance,PerformanceObserver:DiagObserver}=require('node:perf_hooks');\nconst diagData=new BigInt64Array(workerData.diagnosticBuffer);\nlet diagSequence=0,diagGeneration=0,diagArmed=null,diagPhase=0,diagPreviousHealth=0n;\nconst diagSlots=8192,diagWords=16,diagHeader=16;\nfunction diagRecord(code,a=0n,b=0n,c=0n,d=0n,e=0n,f=0n,g=0n,h=0n,i=0n,j=0n,k=0n,l=0n,m=0n){\n try{\n  const n=++diagSequence,index=diagHeader+((n-1)%diagSlots)*diagWords;\n  Atomics.store(diagData,index,0n);\n  diagData[index+1]=BigInt(code);diagData[index+2]=now();\n  diagData[index+3]=BigInt(a);diagData[index+4]=BigInt(b);diagData[index+5]=BigInt(c);diagData[index+6]=BigInt(d);diagData[index+7]=BigInt(e);diagData[index+8]=BigInt(f);diagData[index+9]=BigInt(g);diagData[index+10]=BigInt(h);diagData[index+11]=BigInt(i);diagData[index+12]=BigInt(j);diagData[index+13]=BigInt(k);diagData[index+14]=BigInt(l);diagData[index+15]=BigInt(m);\n  Atomics.store(diagData,index,BigInt(n));Atomics.store(diagData,0,BigInt(n));\n  if(n>diagSlots)Atomics.store(diagData,2,BigInt(n-diagSlots));\n }catch{Atomics.add(diagData,3,1n);}\n}\nfunction diagIncident(t,late=false){const at=late?1:4,count=late?5:6;Atomics.add(diagData,count,1n);if(!Atomics.load(diagData,at))Atomics.store(diagData,at,t);}\nfunction diagEnter(phase,command=0){\n const t=now(),old=diagPhase;diagPhase=phase;\n const before=now(),cpu=process.threadCpuUsage(),after=now();\n diagRecord(3,t,phase,command,cpu.user,cpu.system,before,after,pending.length,voices.size);\n if(phase===2){\n  const gap=diagPreviousHealth?t-diagPreviousHealth:0n;if(gap>40000000n)diagIncident(t);diagPreviousHealth=t;\n  const elu=diagPerformance.eventLoopUtilization();\n  diagRecord(7,t,gap,BigInt(Math.round(elu.active*1e6)),BigInt(Math.round(elu.idle*1e6)),receiptBytes,unacknowledged.size,inFlight,lastHeartbeat,t-lastHeartbeat,clockBudget?t-BigInt(clockBudget.sentHrNs):0n);\n }\n return [old,t,phase,command];\n}\nfunction diagExit(mark){\n const t=now(),before=now(),cpu=process.threadCpuUsage(),after=now();\n diagRecord(4,t,mark[2],mark[3],cpu.user,cpu.system,before,after,t-mark[1],pending.length,voices.size);diagPhase=mark[0];\n}\nfunction diagWrap(fn,phase){return function(){const mark=diagEnter(phase);try{return fn();}finally{diagExit(mark);}};}\nfunction diagGcRecords(entries){\n for(const entry of entries){\n  const before=now(),perfNs=BigInt(Math.round(diagPerformance.now()*1e6)),after=now();\n  diagRecord(8,BigInt(Math.round(entry.startTime*1e6)),BigInt(Math.round(entry.duration*1e6)),entry.detail?.kind??0,entry.detail?.flags??0,before,perfNs,after);\n }\n}\nconst diagGc=new DiagObserver(list=>diagGcRecords(list.getEntries()));\ndiagGc.observe({entryTypes:['gc']});\n\nlet session='',sequence=0,triggerSequence=0,lastHeartbeat=0n,dead=false;\nlet pending=[],objects=new Map(),voices=new Map(),expired=new Set(),timer;\nlet receipts=[],receiptBytes=0,batchSequence=0,inFlight=0,inFlightApplied=0,flightAt=0n,unacknowledged=new Map(),unacknowledgedBytes=0;\nlet peakPending=0,peakVoices=0,onsetCount=0,lateDrops=0;\nfunction row(type,fields={}){if(dead)return false;const value={type,session,observedHrNs:now().toString(),...fields},bytes=Buffer.byteLength(JSON.stringify(value));if(receipts.length>=8192||receiptBytes+bytes>2097152||bytes>60000){fatal('Receipt count/byte capacity exceeded');return false;}receipts.push(value);receiptBytes+=bytes;return true;}\nfunction flush(){\n if(dead)return;\n if(inFlight){if(now()-flightAt>500000000n)fatal('Receipt acknowledgement timeout');return;}\n if(dead)return;if(!receipts.length){if(closing){clearTimeout(timer);clearInterval(health);parentPort.postMessage({type:'closed',incarnation,observedHrNs:now().toString(),state:state()});parentPort.close();}return;}\n let count=0,bytes=128;\n for(const r of receipts){const n=Buffer.byteLength(JSON.stringify(r));if(n>60000){fatal('Oversized receipt');return;}if(count===64||bytes+n>61440)break;bytes+=n+1;count++;}\n const rows=receipts.splice(0,count);receiptBytes-=rows.reduce((sum,r)=>sum+Buffer.byteLength(JSON.stringify(r)),0);\n inFlightApplied=Math.max(0,...rows.filter(r=>r.type==='applied').map(r=>r.internalSequence));\n inFlight=++batchSequence;flightAt=now();parentPort.postMessage({type:'batch',incarnation,batchSequence:inFlight,rows});\n}\nfunction retire(s){expired.add(s);if(expired.size>1000)expired.delete(expired.values().next().value);}\nfunction release(reason){if(dead)return false;const old=session,mutationHrBeforeNs=now();pending=[];voices.clear();objects.clear();session='';const mutationHrAfterNs=now();if(old){retire(old);return row('release',{session:old,reason,pending:0,activeVoices:0,mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString()});}return true;}\nfunction fatal(reason){if(dead)return;dead=true;clearTimeout(timer);clearInterval(health);const priorState={session,pending:pending.length,activeVoices:voices.size},mutationHrBeforeNs=now();pending=[];voices.clear();objects.clear();session='';const mutationHrAfterNs=now();parentPort.postMessage({type:'fatal',incarnation,reason,observedHrNs:now().toString(),mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString(),priorState,state:state()});}\nfunction clockHealthy(t){if(Atomics.load(poison,0)){fatal('Parent clock poisoned');return false;}if(!clockBudget)return false;if(t-BigInt(clockBudget.sentHrNs)>1500000000n){fatal('Native clock calibration budget expired');return false;}if(!Number.isFinite(clockBudget.uncertaintyMs)||clockBudget.uncertaintyMs>10){fatal('Native clock uncertainty exceeds10ms');return false;}return !dead;}\nfunction watchdog(t){if(session&&t-lastHeartbeat>500000000n)return release('Producer heartbeat watchdog');return !dead;}\nfunction state(){return {clockDomain:'native-monotonic',incarnation,session,pending:pending.length,activeVoices:voices.size,objects:objects.size,peakPending,peakVoices,onsetCount,lateDrops,lastHeartbeatHrNs:lastHeartbeat.toString(),receiptBytes,unacknowledgedCommands:unacknowledged.size,unacknowledgedBytes};}\nfunction expireVoices(){for(const [id,v]of voices)if(v.endHrNs<=now()){const mutationHrBeforeNs=now();voices.delete(id);const mutationHrAfterNs=now();if(!row('voice-expired',{id,mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString()}))return false;}return !dead;}\nfunction dispatch(){\n timer=undefined;if(dead||!clockHealthy(now())||!watchdog(now())||!expireVoices())return;\n while(pending.length&&pending[0].deadlineHrNs<=now()){\n  if(!clockHealthy(now())||!watchdog(now()))return;if(!pending.length)break;\n  const popBeforeHrNs=now(),p=pending.shift(),popAfterHrNs=now();if(!row('dispatch-pop',{id:p.id,mutationHrBeforeNs:popBeforeHrNs.toString(),mutationHrAfterNs:popAfterHrNs.toString()}))return;if(!clockHealthy(now())||!watchdog(now()))return;if(p.session!==session)continue;\n  // This is the actual callback execution clock, read independently of the\n  // deadline and of the parent receiving this report. No audio samples exist.\n  if(!clockHealthy(now())||!watchdog(now()))return;if(p.session!==session)continue;\n  const mutationHrBeforeNs=now(),beforeErrorMs=Number(mutationHrBeforeNs-p.deadlineHrNs)/1e6;\n  let late=Math.abs(beforeErrorMs)>20,evicted,rollback;\n  const mockVoiceAttempted=!late;\n  if(!late){\n   if(voices.size>=64){const oldest=voices.keys().next().value;evicted=[oldest,voices.get(oldest)];voices.delete(oldest);}\n   voices.set(p.id,{nodeId:p.nodeId,endHrNs:mutationHrBeforeNs+BigInt(p.durationNs)});peakVoices=Math.max(peakVoices,voices.size);\n  }\n  const mutationHrAfterNs=now(),actualHrNs=mutationHrAfterNs,errorMs=Number(actualHrNs-p.deadlineHrNs)/1e6;\n  if(!late&&(Math.abs(errorMs)>20||Atomics.load(poison,0))){\n   const rollbackHrBeforeNs=now();voices.delete(p.id);if(evicted)voices=new Map([evicted,...voices]);const rollbackHrAfterNs=now();\n   rollback={rollbackHrBeforeNs:rollbackHrBeforeNs.toString(),rollbackHrAfterNs:rollbackHrAfterNs.toString(),restoredEvictedId:evicted?.[0]??null};late=true;\n  }\n  if(!clockHealthy(now())||!watchdog(now()))return;if(p.session!==session)return;\n  if(!late&&evicted&&!row('steal',{id:evicted[0],mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString()}))return;\n  if(late)lateDrops++;else onsetCount++;if(late)diagIncident(actualHrNs,true);\n  diagRecord(6,p.triggerSequence,p.deadlineHrNs,actualHrNs,mutationHrBeforeNs,mutationHrAfterNs,late?1:0);\n  if(!row(late?'late-drop':'onset',{id:p.id,nodeId:p.nodeId,generatorId:p.generatorId,objectId:p.objectId,position:[...objects.get(p.nodeId).position],\n   intendedHrNs:p.deadlineHrNs.toString(),intendedNodeNs:p.intendedNodeNs,actualHrNs:actualHrNs.toString(),mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString(),beforeErrorMs,errorMs,mockVoiceAttempted,mockVoiceWritten:!late,lateMutationRolledBack:!!rollback,rollback,uncertaintyMs:clockBudget.uncertaintyMs,nodeHrPair:clockBudget.nodeHrPair,clockPairSequence:clockBudget.clockPairSequence,activeVoices:voices.size,pending:pending.length}))return;\n }\n flush();schedule();\n}\nfunction schedule(){\n const old=diagArmed,cancelBefore=now();clearTimeout(timer);timer=undefined;const cancelAfter=now();\n if(old)diagRecord(2,old.generation,old.deadline,old.trigger,cancelBefore,cancelAfter,diagPhase);\n diagArmed=null;if(dead||!pending.length)return;\n const delay=Number(pending[0].deadlineHrNs-now())/1e6;\n const arm={generation:++diagGeneration,deadline:pending[0].deadlineHrNs,trigger:pending[0].triggerSequence,reason:diagPhase};\n const armBefore=now();\n timer=setTimeout(()=>{const entry=now();diagRecord(5,arm.generation,arm.deadline,arm.trigger,entry,arm.reason);diagArmed=null;dispatch();},Math.max(0,delay));\n const armAfter=now();diagArmed=arm;\n diagRecord(1,arm.generation,arm.deadline,arm.trigger,BigInt(Math.round(Math.max(0,delay)*1e6)),armBefore,armAfter,arm.reason);\n}\nconst health=setInterval(()=>{const diagMark=diagEnter(2);try{if(dead||!clockBudget)return;if(closing){flush();return;}if(!clockHealthy(now())||!watchdog(now())||!expireVoices())return;if(!row('state',{state:state()}))return;flush();schedule();}finally{diagExit(diagMark);}},25);\ndispatch=diagWrap(dispatch,1);flush=diagWrap(flush,4);\nparentPort.on('message',c=>{const diagMark=diagEnter(3,c.sequence??0);try{\n const receivedHrNs=now();if(c.incarnation!==incarnation){if(!row('stale-incarnation',{incomingIncarnation:c.incarnation}))return;flush();return;}\n if(c.type==='ack'){\n  if(c.batchSequence!==inFlight||!inFlight){fatal('Receipt ACK gap/order violated');return;}\n  for(const [n,bytes]of unacknowledged)if(n<=inFlightApplied){unacknowledged.delete(n);unacknowledgedBytes-=bytes;}\n  inFlight=0;flush();return;\n }\n if(c.type==='close'){closing=true;clearTimeout(timer);if(dead){clearInterval(health);parentPort.postMessage({type:'closed',incarnation,observedHrNs:now().toString(),state:state()});parentPort.close();return;}if(!release('Receiver close'))return;flush();return;}\n if(dead||closing)return;\n if(clockBudget&&!clockHealthy(now()))return;\n if(c.type!=='clock-budget'&&c.type!=='clock'&&!clockBudget){fatal('Native clock budget unavailable');return;}\n if(!watchdog(now()))return; // buffered heartbeats cannot revive an expired epoch\n const commandBytes=Buffer.byteLength(JSON.stringify(c));if(commandBytes>196608||unacknowledged.size>=8192||unacknowledgedBytes+commandBytes>262144){fatal('Command count/byte capacity exceeded');return;}\n if(!Number.isSafeInteger(c.sequence)||c.sequence!==sequence+1){fatal('Command ordering/gap violated');return;}\n sequence=c.sequence;\n unacknowledged.set(sequence,commandBytes);unacknowledgedBytes+=commandBytes;\n const mutationHrBeforeNs=now();\n if(c.type==='clock-budget'){if(!Number.isFinite(c.uncertaintyMs)||c.uncertaintyMs<0||c.uncertaintyMs>10){fatal('Native clock uncertainty exceeds10ms');return;}clockBudget={uncertaintyMs:c.uncertaintyMs,sentHrNs:c.parentSentHrNs,nodeHrPair:c.nodeHrPair,clockPairSequence:c.clockPairSequence};if(!clockHealthy(now()))return;}\n else if(c.type==='start'){\n  if(typeof c.session!=='string'||c.session===session||expired.has(c.session)){fatal('Retired/nonfresh epoch reused');return;}\n  if(!release('New epoch'))return;session=c.session;triggerSequence=0;lastHeartbeat=now();if(!row('started'))return;\n }else if(c.type==='clock'){if(!row('clock',{requestSequence:c.sequence,parentSentHrNs:c.parentSentHrNs,workerObservedHrNs:receivedHrNs.toString()}))return;}\n else if(c.type==='snapshot'){if(!row('snapshot',{requestSequence:c.sequence,state:state()}))return;}\n else if(c.session!==session||!session){if(!row('stale',{incomingSession:c.session,command:c.type}))return;}\n else if(c.type==='heartbeat'){lastHeartbeat=now();}\n else if(c.type==='stop'){if(!release(c.reason||'Producer stop'))return;}\n else if(c.type==='position'){\n  if(objects.has(c.nodeId)&&objects.get(c.nodeId).objectId!==c.objectId){fatal('Active object binding changed');return;}\n  if(!objects.has(c.nodeId)&&objects.size>=92){fatal('Object capacity exceeded');return;}\n  if(!Array.isArray(c.position)||c.position.length!==3||c.position.some(n=>!Number.isFinite(n)||Math.abs(n)>1)){fatal('Invalid position');return;}for(const [node,obj]of objects)if(node!==c.nodeId&&obj.objectId===c.objectId){fatal('Object ID collision');return;}objects.set(c.nodeId,{objectId:c.objectId,position:[...c.position]});\n }else if(c.type==='cancel'){\n  const ids=new Set(c.ids),nodes=new Set(c.nodeIds);pending=pending.filter(p=>!ids.has(p.id)&&!nodes.has(p.nodeId));\n  for(const [id,v]of voices)if(ids.has(id)||nodes.has(v.nodeId))voices.delete(id);\n  for(const node of nodes)objects.delete(node);if(!row('cancelled',{ids:c.ids.length,nodeIds:c.nodeIds.length,state:state()}))return;schedule();\n }else if(c.type==='trigger'){\n  if(!Number.isSafeInteger(c.triggerSequence)||c.triggerSequence<=triggerSequence||objects.get(c.nodeId)?.objectId!==c.objectId){fatal('Trigger ordering/object mismatch');return;}\n  triggerSequence=c.triggerSequence;if(pending.length>=5376){fatal('Pending capacity exceeded');return;}\n  const deadlineHrNs=BigInt(c.deadlineHrNs);if(deadlineHrNs-now()>12000000000n||BigInt(c.durationNs)<0n||BigInt(c.durationNs)>8000000000n){fatal('Trigger scheduling/duration bound exceeded');return;}\n  const diagSort=diagEnter(6,c.sequence);try{pending.push({...c,deadlineHrNs});pending.sort((a,b)=>a.deadlineHrNs<b.deadlineHrNs?-1:a.deadlineHrNs>b.deadlineHrNs?1:a.triggerSequence-b.triggerSequence);}finally{diagExit(diagSort);}\n  peakPending=Math.max(peakPending,pending.length);if(!row('queued',{id:c.id,intendedHrNs:deadlineHrNs.toString(),receivedHrNs:receivedHrNs.toString(),queueLeadMs:Number(deadlineHrNs-receivedHrNs)/1e6,pending:pending.length}))return;schedule();\n }else{fatal('Unknown command');return;}\n if(dead)return;const mutationHrAfterNs=now();if(!row('applied',{internalSequence:c.sequence,commandSequence:c.commandSequence,workerReceivedHrNs:receivedHrNs.toString(),parentSentHrNs:c.parentSentHrNs,mutationHrBeforeNs:mutationHrBeforeNs.toString(),mutationHrAfterNs:mutationHrAfterNs.toString()}))return;flush();\n}finally{diagExit(diagMark);}});\nparentPort.on('close',()=>{diagGcRecords(diagGc.takeRecords());diagGc.disconnect();diagRecord(9);});\nparentPort.on('messageerror',()=>fatal('Worker message deserialization failed'));\nparentPort.postMessage({type:'ready',incarnation,observedHrNs:now().toString(),clock:'process.hrtime.bigint',threadId:require('node:worker_threads').threadId});";

export interface NodeHrPair {
  beforeHrNs: string;
  performanceMs: number;
  afterHrNs: string;
  offsetLowerNs: string;
  offsetUpperNs: string;
  widthNs: string;
}

/** ±1ns covers conversion of performance milliseconds into integer nanoseconds. */
export function nativeClockPair(): NodeHrPair {
  const before = process.hrtime.bigint(), performanceMs = performance.now(), after = process.hrtime.bigint();
  const nodeNs = BigInt(Math.round(performanceMs * 1e6));
  return {beforeHrNs: before.toString(), performanceMs, afterHrNs: after.toString(),
    offsetLowerNs: (before - nodeNs - 1n).toString(), offsetUpperNs: (after - nodeNs + 1n).toString(), widthNs: (after - before + 2n).toString()};
}

/** A held-out bracket covers uncertainty even when its midpoint agrees. */
export function nativePairBound(pair: NodeHrPair, startup: NodeHrPair, fixedOffsetNs: bigint): bigint {
  if (!Number.isFinite(pair.performanceMs)) throw Error('Invalid native clock bracket');
  const before = BigInt(pair.beforeHrNs), after = BigInt(pair.afterHrNs), nodeNs = BigInt(Math.round(pair.performanceMs * 1e6));
  const lower = BigInt(pair.offsetLowerNs), upper = BigInt(pair.offsetUpperNs);
  if (before > after || lower !== before - nodeNs - 1n || upper !== after - nodeNs + 1n || BigInt(pair.widthNs) !== after - before + 2n) throw Error('Invalid native clock bracket algebra');
  if (lower > BigInt(startup.offsetUpperNs) || upper < BigInt(startup.offsetLowerNs)) throw Error('Independent native clock origin intervals incompatible');
  const bounds = [fixedOffsetNs - lower, upper - fixedOffsetNs].map(value => value < 0n ? -value : value);
  return bounds[0] > bounds[1] ? bounds[0] : bounds[1];
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const MAX_COMMAND_BYTES = 196608, MAX_UNACKNOWLEDGED_BYTES = 262144;


export const diagnosticBuffers: SharedArrayBuffer[] = [];
function createDiagnosticBuffer(){const buffer=new SharedArrayBuffer(1048704);diagnosticBuffers.push(buffer);return buffer;}

export class NativeClock implements ReceiverClock {
  private readonly diagnosticBuffer = createDiagnosticBuffer();
  private worker?: Worker;
  private readonly poison = new Int32Array(new SharedArrayBuffer(4));
  private incarnation = randomUUID();
  private started = false;
  private available = false;
  private closing = false;
  private closed = false;
  private exited = false;
  private exitCode: number | null = null;
  private failureReason: string | null = null;
  private closeFailureReason: string | null = null;
  private reportedFailures: string[] = [];
  private sequence = 0;
  private bridgeSequence = 0;
  private applied = 0;
  private batchSequence = 0;
  private unacknowledged = new Map<number, number>();
  private unacknowledgedBytes = 0;
  private fixedOffsetNs = 0n;
  private startupPair?: NodeHrPair;
  private currentPair?: NodeHrPair;
  private pairSequence = 0;
  private maximumUncertaintyNs = 0n;
  private maximumUncertaintyPair?: NodeHrPair;
  private calibrationWindows: Record<string, unknown>[] = [];
  private lastCalibrationHrNs = 0n;
  private calibrationTimer?: ReturnType<typeof setInterval>;
  private clockRequests = new Map<number, {resolve: () => void}>();
  private causalWitnesses: Record<string, unknown>[] = [];
  private workerState: Record<string, unknown> = {};
  private recentRows: Record<string, unknown>[] = [];
  private ignoredIncarnations = 0;
  private stdioBytes = 0;
  private closePromise?: Promise<void>;

  constructor(private readonly hooks: ReceiverClockHooks) {}
  get ready() { return this.available && !this.failureReason && !this.closing; }
  get diagnostics(): Record<string, unknown> {
    return {clockDomain: 'native-monotonic', workerIncarnation: this.incarnation, ready: this.ready,
      failure: this.failureReason, reportedFailures: [...this.reportedFailures], closeFailure: this.closeFailureReason, uncertaintyMs: Number(this.maximumUncertaintyNs) / 1e6,
      fixedNodeHrOffsetNs: this.fixedOffsetNs.toString(), startupPair: this.startupPair, nodeHrPair: this.currentPair,
      clockPairSequence: this.pairSequence, clockPairAgeMs: this.currentPair ? Number(process.hrtime.bigint() - BigInt(this.currentPair.afterHrNs)) / 1e6 : null,
      maximumUncertaintyPair: this.maximumUncertaintyPair, calibrationWindows: [...this.calibrationWindows],
      causalWitnesses: [...this.causalWitnesses], worker: {...this.workerState}, recentRows: [...this.recentRows],
      unacknowledgedCommands: this.unacknowledged.size, unacknowledgedBytes: this.unacknowledgedBytes,
      ignoredIncarnations: this.ignoredIncarnations, cleanup: {closedAcknowledged: this.closed, exitObserved: this.exited, exitCode: this.exitCode},
      limitation: 'Numerical control callbacks and voice state; no audio or physical presentation is rendered.'};
  }
  invalidate(reason: string) { this.fail(reason); }
  servePage(_request: IncomingMessage, _response: ServerResponse) { return false; }
  acceptConnection(_socket: WebSocket, _request: IncomingMessage) { return false; }

  private fail(reason: string) {
    if (this.reportedFailures.length < 32) this.reportedFailures.push(reason);
    if (this.closing && !this.failureReason) this.closeFailureReason = reason;
    if (this.failureReason) return;
    this.failureReason = reason; this.available = false; Atomics.store(this.poison, 0, 1);
    clearInterval(this.calibrationTimer);
    // No queued commands may apply after clock failure. This control bypasses
    // admission limits and is ordered after already-sent work on the same port.
    try { this.worker?.postMessage({type: 'close', incarnation: this.incarnation}); } catch { /* already dead */ }
    if (!this.closing) this.hooks.failure(reason);
  }

  private calibrate(initial = false) {
    const pairs = Array.from({length: 32}, nativeClockPair);
    if (initial) {
      this.startupPair = pairs.reduce((a, b) => BigInt(a.widthNs) <= BigInt(b.widthNs) ? a : b);
      this.fixedOffsetNs = (BigInt(this.startupPair.offsetLowerNs) + BigInt(this.startupPair.offsetUpperNs)) / 2n;
    }
    const startup = this.startupPair!;
    for (const pair of pairs) {
      const bound = nativePairBound(pair, startup, this.fixedOffsetNs);
      if (bound > this.maximumUncertaintyNs) { this.maximumUncertaintyNs = bound; this.maximumUncertaintyPair = pair; }
    }
    this.currentPair = pairs.at(-1)!; this.pairSequence++;
    this.lastCalibrationHrNs = BigInt(this.currentPair.afterHrNs);
    this.calibrationWindows.push({sequence: this.pairSequence, pairs, fixedNodeHrOffsetNs: this.fixedOffsetNs.toString(), maximumUncertaintyNs: this.maximumUncertaintyNs.toString()});
    if (this.calibrationWindows.length > 8) this.calibrationWindows.shift();
    if (this.maximumUncertaintyNs > 10000000n) throw Error('Native clock conversion uncertainty exceeds10ms');
    if (this.worker && !this.closing && !this.failureReason) this.post({type: 'clock-budget', uncertaintyMs: Number(this.maximumUncertaintyNs) / 1e6,
      nodeHrPair: this.currentPair, clockPairSequence: this.pairSequence});
  }

  private ensureCalibration() {
    if (process.hrtime.bigint() - this.lastCalibrationHrNs >= 1000000000n) this.calibrate();
  }

  private post(fields: Record<string, unknown>) {
    if (!this.worker || this.failureReason || this.closing) throw Error('Native receiver clock unavailable');
    const packet = {...fields, sequence: this.sequence + 1, incarnation: this.incarnation, parentSentHrNs: process.hrtime.bigint().toString()};
    const bytes = Buffer.byteLength(JSON.stringify(packet));
    if (bytes > MAX_COMMAND_BYTES || this.unacknowledged.size >= 8192 || this.unacknowledgedBytes + bytes > MAX_UNACKNOWLEDGED_BYTES) throw Error('Native command count/byte capacity exceeded');
    this.sequence++; this.unacknowledged.set(this.sequence, bytes); this.unacknowledgedBytes += bytes;
    this.worker.postMessage(packet); return this.sequence;
  }

  async start(_port: number) {
    if (this.started) throw Error('Native receiver cannot restart');
    this.started = true;
    try {
      this.calibrate(true); this.calibrate(); // held-out startup brackets
      this.worker = new Worker(NATIVE_WORKER_SOURCE, {eval: true, workerData: {incarnation: this.incarnation, poison: this.poison.buffer, diagnosticBuffer: this.diagnosticBuffer}, stdout: true, stderr: true});
      let startup = false;
      this.worker.on('message', message => {
        if (message?.type === 'ready' && message.incarnation === this.incarnation) startup = true;
        try { this.receive(message); } catch (error) { this.fail(String(error)); }
      });
      this.worker.on('error', error => this.fail('Native worker error: ' + String(error)));
      this.worker.on('messageerror', () => this.fail('Native worker message deserialization failed'));
      this.worker.on('exit', code => {
        this.exited = true; this.exitCode = code;
        if (!this.closed || code !== 0) this.fail(`Native worker exited without graceful acknowledgement (${code})`);
      });
      const stdio = (data: Buffer) => { this.stdioBytes += data.length; if (this.stdioBytes > 65536) this.fail('Native worker stdio byte limit exceeded'); };
      this.worker.stdout.on('data', stdio); this.worker.stderr.on('data', stdio);
      await this.until(() => startup, 'Native worker startup timed out');
      this.calibrate();
      for (let i = 0; i < 8; i++) {
        let observed = false;
        const n = this.post({type: 'clock'});
        this.clockRequests.set(n, {resolve: () => { observed = true; }});
        await this.until(() => observed, 'Native causal clock probe timed out');
      }
      this.available = true;
      this.calibrationTimer = setInterval(() => { if (this.failureReason || this.closing) return; try { this.calibrate(); } catch (error) { this.fail(String(error)); } }, 1000);
    } catch (error) { this.fail(String(error)); throw error; }
  }

  private async until(predicate: () => boolean, reason: string, timeout = 4000) {
    const end = performance.now() + timeout;
    while (true) {
      if (this.failureReason) throw Error(this.failureReason);
      const satisfied = predicate();
      if (this.failureReason) throw Error(this.failureReason);
      if (satisfied) return;
      if (performance.now() > end) throw Error(reason);
      await sleep(2);
    }
  }

  send(command: ReceiverClockCommand) {
    if (!this.ready) { this.fail('Native receiver unavailable for producer command'); return; }
    try {
      this.ensureCalibration();
      const packet = packetSchema.parse(command.packet);
      if (packet.type === 'sync' || !Number.isSafeInteger(command.commandSequence) || command.commandSequence !== this.bridgeSequence + 1) throw Error('Native bridge command ordering/gap violated');
      this.bridgeSequence = command.commandSequence;
      const fields: Record<string, unknown> = {...packet, commandSequence: command.commandSequence};
      // IPC ordering is independent of each producer packet sequence.
      delete fields.sequence;
      if (packet.type === 'trigger') {
        const intendedNodeNs = BigInt(Math.round(packet.onset * 1e9));
        fields.deadlineHrNs = (intendedNodeNs + this.fixedOffsetNs).toString();
        fields.intendedNodeNs = intendedNodeNs.toString();
        fields.durationNs = BigInt(Math.round(packet.sound.duration * 1e9)).toString();
      }
      this.post(fields);
    } catch (error) { this.fail(String(error)); }
  }

  private receive(message: any) {
    const reportHrNs = process.hrtime.bigint();
    if (message?.incarnation !== this.incarnation) { this.ignoredIncarnations++; return; }
    if (Buffer.byteLength(JSON.stringify(message)) > 65536) throw Error('Native receipt byte bound exceeded');
    if (message.type === 'fatal') { this.workerState = message.state; this.fail('Native worker fatal: ' + message.reason); return; }
    if (message.type === 'closed') { this.closed = true; this.workerState = message.state; return; }
    if (message.type === 'ready') return;
    if (message.type !== 'batch' || message.batchSequence !== this.batchSequence + 1 || !Array.isArray(message.rows) || message.rows.length > 64) throw Error('Native receipt batch gap/order/count violated');
    this.batchSequence = message.batchSequence;
    for (const row of message.rows) {
      this.recentRows.push({...row, reportArrivalHrNs: reportHrNs.toString()});
      if (this.recentRows.length > 64) this.recentRows.shift();
      if (row.type === 'applied') {
        if (row.internalSequence !== this.applied + 1 || !this.unacknowledged.has(row.internalSequence)) throw Error('Native applied acknowledgement gap/order violated');
        this.applied = row.internalSequence;
        this.unacknowledgedBytes -= this.unacknowledged.get(this.applied)!; this.unacknowledged.delete(this.applied);
        if (BigInt(row.parentSentHrNs) > BigInt(row.workerReceivedHrNs) || BigInt(row.workerReceivedHrNs) > reportHrNs) throw Error('Native command ingress causal containment failed');
        if (row.commandSequence !== undefined && !this.failureReason) this.hooks.applied(row.commandSequence);
      } else if (row.type === 'clock') {
        const request = this.clockRequests.get(row.requestSequence);
        if (!request || BigInt(row.parentSentHrNs) > BigInt(row.workerObservedHrNs) || BigInt(row.workerObservedHrNs) > reportHrNs) throw Error('Native clock causal containment failed');
        this.causalWitnesses.push({...row, reportArrivalHrNs: reportHrNs.toString()});
        if (this.causalWitnesses.length > 16) this.causalWitnesses.shift();
        this.clockRequests.delete(row.requestSequence); request.resolve();
      } else if (row.type === 'state') this.workerState = row.state;
      else if (row.type === 'release' && !this.failureReason) this.hooks.release(row.session, row.reason);
      else if ((row.type === 'onset' || row.type === 'late-drop') && !this.failureReason) {
        this.ensureCalibration();
        const actualHr = BigInt(row.actualHrNs), before = BigInt(row.mutationHrBeforeNs), after = BigInt(row.mutationHrAfterNs);
        if (before > after || actualHr !== after || actualHr > reportHrNs) throw Error('Native control mutation witness invalid');
        const actual = Number(actualHr - this.fixedOffsetNs) / 1e9;
        const intended = Number(BigInt(row.intendedNodeNs)) / 1e9;
        const receipt: NativeReceiverOnset = {type: row.type, session: row.session, id: row.id, generatorId: row.generatorId, nodeId: row.nodeId,
          objectId: row.objectId, position: row.position, intended, actual, errorMs: Number(actualHr - BigInt(row.intendedHrNs)) / 1e6,
          clockDomain: 'native-monotonic', workerIncarnation: this.incarnation, fixedNodeHrOffsetNs: this.fixedOffsetNs.toString(),
          intendedHrNs: row.intendedHrNs, actualHrNs: row.actualHrNs, mutationHrBeforeNs: row.mutationHrBeforeNs, mutationHrAfterNs: row.mutationHrAfterNs,
          nodeHrPair: row.nodeHrPair, clockPairSequence: row.clockPairSequence,
          clockPairAgeMs: Number(actualHr - BigInt(row.nodeHrPair.afterHrNs)) / 1e6,
          uncertaintyMs: Math.max(row.uncertaintyMs, Number(this.maximumUncertaintyNs) / 1e6)};
        if (!Number.isFinite(receipt.uncertaintyMs) || receipt.uncertaintyMs > 10 || receipt.clockPairAgeMs < 0) throw Error('Native receipt clock bound invalid');
        this.hooks.onset(receipt);
      }
    }
    this.worker?.postMessage({type: 'ack', incarnation: this.incarnation, batchSequence: message.batchSequence});
  }

  close(): Promise<void> {
    if (this.closePromise) return this.closePromise;
    this.closePromise = this.finishClose(); return this.closePromise;
  }
  private async finishClose() {
    this.closing = true; this.available = false; clearInterval(this.calibrationTimer);
    if (!this.worker) return;
    if (!this.exited) this.worker.postMessage({type: 'close', incarnation: this.incarnation});
    const end = performance.now() + 1000;
    while (!this.exited && performance.now() < end) await sleep(2);
    if (!this.exited) { await this.worker.terminate(); throw Error('Native worker required forced termination'); }
    if (!this.closed || this.exitCode !== 0) throw Error('Native worker graceful close failed');
    if (this.closeFailureReason) throw Error('Native worker close failed: ' + this.closeFailureReason);
  }
}
