/** Opt-in diagnostic copies only. --prepare/--check never launch a worker. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = "/Users/jeremyguillory/Documents/ChatGPT/ripple";
const sourceDirectory = "/Users/jeremyguillory/Documents/ChatGPT/ripple/evidence/step-09/native-scheduling-diagnostic/diagnostic-source/2d1af318862d614e";
const frozenHash = '97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173';
const bridgeHash = 'c24a37011f631df7a979b5c4010b1b96baa22b6799abae4c231c95246deec460';
const slots = 8192, words = 16, header = 16;
const bytes = (slots * words + header) * 8;
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const patches: {label: string; beforeSha256: string; replacementSha256: string}[] = [];
function unique(source: string, before: string, after: string, label: string) {
  if (source.split(before).length !== 2) throw Error(`Insertion ${label} is not unique`);
  patches.push({label, beforeSha256: hash(before), replacementSha256: hash(after)});
  return source.replace(before, after);
}

// Record words: committed sequence, event, hrtime, 13 event-specific integers.
// Diagnostic storage is separate from musical receipt queues and ACKs.
const workerDiagnostic = String.raw`
const {performance:diagPerformance,PerformanceObserver:DiagObserver}=require('node:perf_hooks');
const diagData=new BigInt64Array(workerData.diagnosticBuffer);
let diagSequence=0,diagGeneration=0,diagArmed=null,diagPhase=0,diagPreviousHealth=0n;
const diagSlots=8192,diagWords=16,diagHeader=16;
function diagRecord(code,a=0n,b=0n,c=0n,d=0n,e=0n,f=0n,g=0n,h=0n,i=0n,j=0n,k=0n,l=0n,m=0n){
 try{
  const n=++diagSequence,index=diagHeader+((n-1)%diagSlots)*diagWords;
  Atomics.store(diagData,index,0n);
  diagData[index+1]=BigInt(code);diagData[index+2]=now();
  diagData[index+3]=BigInt(a);diagData[index+4]=BigInt(b);diagData[index+5]=BigInt(c);diagData[index+6]=BigInt(d);diagData[index+7]=BigInt(e);diagData[index+8]=BigInt(f);diagData[index+9]=BigInt(g);diagData[index+10]=BigInt(h);diagData[index+11]=BigInt(i);diagData[index+12]=BigInt(j);diagData[index+13]=BigInt(k);diagData[index+14]=BigInt(l);diagData[index+15]=BigInt(m);
  Atomics.store(diagData,index,BigInt(n));Atomics.store(diagData,0,BigInt(n));
  if(n>diagSlots)Atomics.store(diagData,2,BigInt(n-diagSlots));
 }catch{Atomics.add(diagData,3,1n);}
}
function diagIncident(t,late=false){const at=late?1:4,count=late?5:6;Atomics.add(diagData,count,1n);if(!Atomics.load(diagData,at))Atomics.store(diagData,at,t);}
function diagEnter(phase,command=0){
 const t=now(),old=diagPhase;diagPhase=phase;
 const before=now(),cpu=process.threadCpuUsage(),after=now();
 diagRecord(3,t,phase,command,cpu.user,cpu.system,before,after,pending.length,voices.size);
 if(phase===2){
  const gap=diagPreviousHealth?t-diagPreviousHealth:0n;if(gap>40000000n)diagIncident(t);diagPreviousHealth=t;
  const elu=diagPerformance.eventLoopUtilization();
  diagRecord(7,t,gap,BigInt(Math.round(elu.active*1e6)),BigInt(Math.round(elu.idle*1e6)),receiptBytes,unacknowledged.size,inFlight,lastHeartbeat,t-lastHeartbeat,clockBudget?t-BigInt(clockBudget.sentHrNs):0n);
 }
 return [old,t,phase,command];
}
function diagExit(mark){
 const t=now(),before=now(),cpu=process.threadCpuUsage(),after=now();
 diagRecord(4,t,mark[2],mark[3],cpu.user,cpu.system,before,after,t-mark[1],pending.length,voices.size);diagPhase=mark[0];
}
function diagWrap(fn,phase){return function(){const mark=diagEnter(phase);try{return fn();}finally{diagExit(mark);}};}
function diagGcRecords(entries){
 for(const entry of entries){
  const before=now(),perfNs=BigInt(Math.round(diagPerformance.now()*1e6)),after=now();
  diagRecord(8,BigInt(Math.round(entry.startTime*1e6)),BigInt(Math.round(entry.duration*1e6)),entry.detail?.kind??0,entry.detail?.flags??0,before,perfNs,after);
 }
}
const diagGc=new DiagObserver(list=>diagGcRecords(list.getEntries()));
diagGc.observe({entryTypes:['gc']});
`;

const instrumentedSchedule = String.raw`function schedule(){
 const old=diagArmed,cancelBefore=now();clearTimeout(timer);timer=undefined;const cancelAfter=now();
 if(old)diagRecord(2,old.generation,old.deadline,old.trigger,cancelBefore,cancelAfter,diagPhase);
 diagArmed=null;if(dead||!pending.length)return;
 const delay=Number(pending[0].deadlineHrNs-now())/1e6;
 const arm={generation:++diagGeneration,deadline:pending[0].deadlineHrNs,trigger:pending[0].triggerSequence,reason:diagPhase};
 const armBefore=now();
 timer=setTimeout(()=>{const entry=now();diagRecord(5,arm.generation,arm.deadline,arm.trigger,entry,arm.reason);diagArmed=null;dispatch();},Math.max(0,delay));
 const armAfter=now();diagArmed=arm;
 diagRecord(1,arm.generation,arm.deadline,arm.trigger,BigInt(Math.round(Math.max(0,delay)*1e6)),armBefore,armAfter,arm.reason);
}`;

function instrumentWorker(original: string) {
  let source = unique(original, 'const now=()=>process.hrtime.bigint();', 'const now=()=>process.hrtime.bigint();\n' + workerDiagnostic, 'worker primitive diagnostic ring');
  const start = source.indexOf('function schedule(){'), end = source.indexOf('\nconst health=', start);
  if (start < 0 || end < 0) throw Error('Schedule boundaries missing');
  source = unique(source, source.slice(start, end), instrumentedSchedule, 'timer arm cancel fire');
  source = unique(source, "const health=setInterval(()=>{", "const health=setInterval(()=>{const diagMark=diagEnter(2);try{", 'health callback entry');
  source = unique(source, "flush();schedule();},25);", "flush();schedule();}finally{diagExit(diagMark);}},25);\ndispatch=diagWrap(dispatch,1);flush=diagWrap(flush,4);", 'health callback exit and phase wrappers');
  source = unique(source, "parentPort.on('message',c=>{", "parentPort.on('message',c=>{const diagMark=diagEnter(3,c.sequence??0);try{", 'message entry');
  source = unique(source, "});\nparentPort.on('messageerror'", "}finally{diagExit(diagMark);}});\nparentPort.on('messageerror'", 'message exit');
  source = unique(source, 'pending.push({...c,deadlineHrNs});pending.sort(', 'const diagSort=diagEnter(6,c.sequence);try{pending.push({...c,deadlineHrNs});pending.sort(', 'queue sort entry');
  source = unique(source, ':a.triggerSequence-b.triggerSequence);\n  peakPending=', ':a.triggerSequence-b.triggerSequence);}finally{diagExit(diagSort);}\n  peakPending=', 'queue sort exit');
  source = unique(source, 'if(late)lateDrops++;else onsetCount++;', 'if(late)lateDrops++;else onsetCount++;if(late)diagIncident(actualHrNs,true);\n  diagRecord(6,p.triggerSequence,p.deadlineHrNs,actualHrNs,mutationHrBeforeNs,mutationHrAfterNs,late?1:0);', 'actual execution incident');
  source = unique(source, "parentPort.on('messageerror'", "parentPort.on('close',()=>{diagGcRecords(diagGc.takeRecords());diagGc.disconnect();diagRecord(9);});\nparentPort.on('messageerror'", 'final GC drain');
  return source;
}

const memoryHelpers = `
export const diagnosticBuffers: SharedArrayBuffer[] = [];
function createDiagnosticBuffer(){const buffer=new SharedArrayBuffer(${bytes});diagnosticBuffers.push(buffer);return buffer;}
`;

function prepare() {
  patches.length = 0;
  const native = fs.readFileSync(path.join(root, 'src/output/NativeClock.ts'), 'utf8');
  const bridge = fs.readFileSync(path.join(root, 'src/output/bridge.ts'), 'utf8');
  if (hash(native) !== frozenHash || hash(bridge) !== bridgeHash) throw Error('Frozen production source changed; refuse instrumentation');
  const opener = 'export const NATIVE_WORKER_SOURCE = String.raw`', closer = '\n`;';
  const start = native.indexOf(opener), end = native.indexOf(closer, start);
  if (start < 0 || end < 0 || native.split(opener).length !== 2) throw Error('Worker source boundary not unique');
  const originalWorker = native.slice(start + opener.length, end);
  const worker = instrumentWorker(originalWorker);
  let copied = unique(native, native.slice(start, end + closer.length), 'export const NATIVE_WORKER_SOURCE = ' + JSON.stringify(worker) + ';', 'embed instrumented worker');
  const outputImport = (name: string) => './' + path.relative(sourceDirectory, path.join(root, 'src/output', name + '.ts')).split(path.sep).join('/');
  copied = unique(copied, "from './protocol'", `from '${outputImport('protocol')}'`, 'native protocol import');
  copied = unique(copied, "from './ReceiverClock'", `from '${outputImport('ReceiverClock')}'`, 'native contract import');
  copied = unique(copied, 'export class NativeClock implements ReceiverClock {', memoryHelpers + '\nexport class NativeClock implements ReceiverClock {\n  private readonly diagnosticBuffer = createDiagnosticBuffer();', 'parent shared memory');
  copied = unique(copied, 'poison: this.poison.buffer}', 'poison: this.poison.buffer, diagnosticBuffer: this.diagnosticBuffer}', 'worker diagnostic storage');
  let copiedBridge = unique(bridge, "from './NativeClock'", "from './NativeClock.instrumented.ts'", 'copied bridge clock import');
  for (const name of ['protocol', 'RenderClock', 'ReceiverClock']) copiedBridge = unique(copiedBridge, `from './${name}'`, `from '${outputImport(name)}'`, 'copied bridge ' + name);
  fs.mkdirSync(sourceDirectory, {recursive: true});
  const files = {'NativeClock.frozen.ts': native, 'bridge.frozen.ts': bridge, 'worker.frozen.cjs': originalWorker,
    'NativeClock.instrumented.ts': copied, 'bridge.instrumented.ts': copiedBridge, 'worker.instrumented.cjs': worker,
    'harness.frozen.ts': fs.readFileSync(import.meta.filename, 'utf8')};
  for (const [name, contents] of Object.entries(files)) {
    const target = path.join(sourceDirectory, name);
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') !== contents) throw Error('Refusing to overwrite different diagnostic source: ' + target);
    if (!fs.existsSync(target)) fs.writeFileSync(target, contents, {flag: 'wx'});
  }
  const manifest = {diagnosticOnly: true, originalNativeSha256: frozenHash, originalBridgeSha256: bridgeHash,
    files: Object.fromEntries(Object.entries(files).map(([name, contents]) => [name, hash(contents)])), patches,
    ring: {slots, words, headerWords: header, byteLength: bytes, retentionCapBytes: 6 * 1024 * 1024},
    recordSchema: {common: ['sequence', 'eventCode', 'recordHrNs', '13 integer payload fields, zero-padded'],
      event1: ['generation', 'intendedDeadlineHrNs', 'triggerSequence', 'requestedDelayNs', 'armBeforeHrNs', 'armAfterHrNs', 'callerPhase'],
      event2: ['cancelledGeneration', 'intendedDeadlineHrNs', 'triggerSequence', 'cancelBeforeHrNs', 'cancelAfterHrNs', 'callerPhase'],
      event3: ['callbackEntryHrNs', 'phase', 'commandSequence', 'cpuUserUs', 'cpuSystemUs', 'cpuBeforeHrNs', 'cpuAfterHrNs', 'pending', 'voices'],
      event4: ['callbackExitHrNs', 'phase', 'commandSequence', 'cpuUserUs', 'cpuSystemUs', 'cpuBeforeHrNs', 'cpuAfterHrNs', 'phaseWallDurationNs', 'pending', 'voices'],
      event5: ['generation', 'intendedDeadlineHrNs', 'triggerSequence', 'timerCallbackEntryHrNs', 'armCallerPhase'],
      event6: ['triggerSequence', 'intendedDeadlineHrNs', 'actualHrNs', 'mutationBeforeHrNs', 'mutationAfterHrNs', 'lateDropBoolean'],
      event7: ['healthEntryHrNs', 'healthEntryGapNs', 'eluActiveNs', 'eluIdleNs', 'receiptBytes', 'unacknowledgedCommands', 'inFlightBatch', 'lastHeartbeatHrNs', 'heartbeatAgeNs', 'budgetAgeNs'],
      event8: ['gcPerformanceStartNs', 'gcDurationNs', 'gcKind', 'gcFlags', 'pairBeforeHrNs', 'pairPerformanceNs', 'pairAfterHrNs'],
      event9: ['workerPortClosed'], phases: {1: 'dispatch', 2: 'health', 3: 'message', 4: 'flush', 6: 'queue sort'},
      independent: ['sequence', 'expectedHrNs', 'actualHrNs', 'cpuUserUs', 'cpuSystemUs', 'cpuBeforeHrNs', 'cpuAfterHrNs', 'pid']},
    invariants: ['No policy constants changed', 'No deadline retargeting', 'No dropped trigger retry', 'No musical receipt/ACK dependency on diagnostic storage']};
  const target = path.join(sourceDirectory, 'manifest.json'), text = JSON.stringify(manifest, null, 2) + '\n';
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') !== text) throw Error('Refusing different diagnostic manifest');
  if (!fs.existsSync(target)) fs.writeFileSync(target, text, {flag: 'wx'});
  return {manifest, worker};
}

function readRing(buffer: SharedArrayBuffer) {
  const data = new BigInt64Array(buffer), end = Atomics.load(data, 0), begin = end > BigInt(slots) ? end - BigInt(slots) + 1n : 1n;
  const rows: bigint[][] = []; let inconsistent = 0;
  for (let n = begin; n <= end; n++) {
    const index = header + Number((n - 1n) % BigInt(slots)) * words;
    const first = Atomics.load(data, index);
    if (first !== n) { inconsistent++; continue; }
    const row = Array.from(data.subarray(index, index + words));
    if (Atomics.load(data, index) !== first) { inconsistent++; continue; }
    rows.push(row);
  }
  return {sequence: end, lateIncidentHrNs: Atomics.load(data, 1), healthIncidentHrNs: Atomics.load(data, 4), lateIncidentCount: Atomics.load(data, 5), healthIncidentCount: Atomics.load(data, 6), overwritten: Atomics.load(data, 2), errors: Atomics.load(data, 3), inconsistent, rows};
}

const witnessSource = String.raw`
let sequence=0,lastReported=0,next=process.hrtime.bigint()+10000000n;
const slots=2048,words=8,data=new BigInt64Array(slots*words);
function tick(){const actual=process.hrtime.bigint(),before=process.hrtime.bigint(),cpu=process.threadCpuUsage(),after=process.hrtime.bigint(),n=++sequence,index=((n-1)%slots)*words;data.set([BigInt(n),next,actual,BigInt(cpu.user),BigInt(cpu.system),before,after,BigInt(process.pid)],index);next=actual+10000000n;}
function report(final=false){const end=sequence,begin=Math.max(lastReported+1,end-slots+1),rows=[];for(let n=begin;n<=end;n++)rows.push(Array.from(data.subarray(((n-1)%slots)*words,((n-1)%slots+1)*words),String));if(process.stdout.writableLength>262144){process.exitCode=1;clearInterval(timer);clearInterval(reporter);process.stdin.destroy();return;}process.stdout.write(JSON.stringify({type:'ticks',pid:process.pid,sequence:end,omittedSinceLastReport:Math.max(0,begin-lastReported-1),reportHrNs:process.hrtime.bigint().toString(),final,rows})+'\n');lastReported=end;}
const timer=setInterval(tick,10),reporter=setInterval(()=>report(),1000);
let input='';process.stdin.on('data',chunk=>{input+=chunk;while(input.includes('\n')){const at=input.indexOf('\n'),line=input.slice(0,at);input=input.slice(at+1);const c=JSON.parse(line);if(c.type==='probe')process.stdout.write(JSON.stringify({type:'probe',sequence:c.sequence,observedHrNs:process.hrtime.bigint().toString()})+'\n');if(c.type==='close'){clearInterval(timer);clearInterval(reporter);report(true);process.stdin.pause();process.stdout.end();}}});
process.stdout.write(JSON.stringify({type:'ready',pid:process.pid,observedHrNs:process.hrtime.bigint().toString()})+'\n');
`;

async function serve(duration: number) {
  if (duration < 5 || duration > 130 || !Number.isFinite(duration)) throw Error('Diagnostic duration must be 5–130 seconds');
  const prepared = {manifest: JSON.parse(fs.readFileSync(path.join(sourceDirectory, "manifest.json"), "utf8"))};
  const directory = process.env.BONGO_COORD_OUTPUT!;
  fs.mkdirSync(directory, {recursive: false});
  const clock = await import(pathToFileURL(path.join(sourceDirectory, 'NativeClock.instrumented.ts')).href);
  const {createBridge} = await import(pathToFileURL(path.join(sourceDirectory, 'bridge.instrumented.ts')).href);
  const receiver = createBridge(5423, 0, {nativeClock: true});
  const incidents: Record<string, unknown>[] = [], failures: string[] = [], probes: Record<string, unknown>[] = [];
  const failure = (reason: string) => { if (failures.length < 32) failures.push(reason); };
  let witnessRows: string[][] = [], witnessSequence = 0, witnessFinal = false, witnessExit: number | null = null, stopped = false;
  let output = '', stderrBytes = 0, totalRetainedBytes = 0;
  const witness = spawn(process.execPath, ['-e', witnessSource], {stdio: ['pipe', 'pipe', 'pipe']});
  const requests = new Map<number, bigint>();
  witness.on('error', error => failure('Witness error: ' + error));
  witness.on('exit', code => { witnessExit = code; if (!witnessFinal || code !== 0) failure('Witness exited without clean final report'); });
  witness.stdin.on('error', error => failure('Witness stdin: ' + error));
  witness.stderr.on('data', chunk => { stderrBytes += chunk.length; if (stderrBytes > 65536) { failure('Witness stderr overflow'); witness.kill('SIGTERM'); } });
  witness.stdout.on('data', chunk => {
    output += chunk.toString();
    if (Buffer.byteLength(output) > 1024 * 1024) { failure('Witness framing overflow'); witness.kill('SIGTERM'); return; }
    while (output.includes('\n')) {
      const index = output.indexOf('\n'), line = output.slice(0, index); output = output.slice(index + 1);
      try {
        const message = JSON.parse(line), arrival = process.hrtime.bigint();
        if (message.type === 'ready') {
          for (let n = 1; n <= 8; n++) { const before = process.hrtime.bigint(); requests.set(n, before); witness.stdin.write(JSON.stringify({type: 'probe', sequence: n}) + '\n'); }
        } else if (message.type === 'probe') {
          const before = requests.get(message.sequence), observed = BigInt(message.observedHrNs);
          if (before === undefined || observed < before || observed > arrival) throw Error('Cross-process hrtime containment failure');
          probes.push({sequence: message.sequence, beforeHrNs: before.toString(), childHrNs: observed.toString(), afterHrNs: arrival.toString()});requests.delete(message.sequence);
        } else if (message.type === 'ticks') {
          if (!Array.isArray(message.rows) || message.rows.length > 2048 || !Number.isSafeInteger(message.sequence) || message.sequence < witnessSequence) throw Error('Witness record count/order');
          if (message.omittedSinceLastReport) throw Error('Independent tick ring overflow before reporting');
          let previous = witnessRows.at(-1);
          for (const [index, row] of message.rows.entries()) {
            if (!Array.isArray(row) || row.length !== 8 || row.some((value: unknown) => typeof value !== 'string' || !/^\d{1,24}$/.test(value))) throw Error('Invalid independent tick row');
            const values = row.map((value: string) => BigInt(value));
            if (values[0] !== BigInt(witnessSequence + index + 1) || values[2] > values[5] || values[5] > values[6] || values[6] > arrival || values[7] !== BigInt(message.pid)) throw Error('Independent tick causal/sequence bounds');
            if (previous && (values[1] !== BigInt(previous[2]) + 10000000n || values[2] <= BigInt(previous[2]) || values[3] < BigInt(previous[3]) || values[4] < BigInt(previous[4]))) throw Error('Independent tick clock/counter discontinuity');
            previous = row;
          }
          if (witnessSequence + message.rows.length !== message.sequence) throw Error('Independent tick terminal sequence mismatch');
          witnessRows = [...witnessRows, ...message.rows].slice(-2048); witnessSequence = message.sequence; witnessFinal ||= !!message.final;
        } else throw Error('Unexpected witness message');
      } catch (error) { failure(String(error)); witness.kill('SIGTERM'); }
    }
  });
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  let pendingIncident: {kind: 'late-drop' | 'health-gap'; triggerHrNs: bigint; snapshot: ReturnType<typeof readRing>; witness: string[][]} | undefined;
  let reader: ReturnType<typeof setInterval> | undefined;
  const begin = process.hrtime.bigint();
    const token=process.env.BONGO_COORD_TOKEN;if(!token||!process.send)throw Error('Owned coordinator IPC required');
    let readyHr:bigint|undefined,clientStartHr:bigint|undefined,clientCompleteHr:bigint|undefined,commandSequence=0,messageSequence=0;
    const lifecycleRows:any[]=[];
    const emit=(type:string,data:any={})=>{if(lifecycleRows.length>=32)throw Error('Host lifecycle capacity');const m={token,sequence:++messageSequence,type,...data};lifecycleRows.push({...m,token:'redacted',hrNs:process.hrtime.bigint().toString()});process.send!(m);};
    const disconnected=()=>{failure('Owned coordinator IPC disconnected');stopped=true;};process.once('disconnect',disconnected);
    const command=(m:any)=>{try{if(!m||m.token!==token||m.sequence!==commandSequence+1)throw Error('Invalid coordinated command');commandSequence=m.sequence;
      if(m.type==='client-start'){if(!readyHr||clientStartHr)throw Error('Invalid client-start transition');clientStartHr=process.hrtime.bigint();}
      else if(m.type==='client-complete'){if(!clientStartHr||clientCompleteHr||m.elapsedTimedSeconds<120)throw Error('Invalid client-complete transition');clientCompleteHr=process.hrtime.bigint();}
      else if(m.type==='stop'){if(!clientCompleteHr)throw Error('Stop before client-complete');stopped=true;}
      else if(m.type==='abort'){failure('Explicit coordinator abort: '+String(m.reason));stopped=true;}
      else throw Error('Unknown coordinated command');emit('service-ack',{commandSequence});
    }catch(error){failure(String(error));stopped=true;}};process.on('message',command);

  let cleanup: Record<string, unknown> = {};
  try {
    const deadline = begin + 4000000000n;
    while (probes.length < 8) { if (failures.length || process.hrtime.bigint() > deadline) throw Error('Independent witness startup failed'); await wait(10); }
    await receiver.start();
    const buffers = clock.diagnosticBuffers as SharedArrayBuffer[];
    if (buffers.length !== 1) throw Error('Expected one diagnostic worker');
    const capturedKinds = new Set<string>();
    reader = setInterval(() => {
      const data = new BigInt64Array(buffers[0]), lateHrNs = Atomics.load(data, 1), healthHrNs = Atomics.load(data, 4);
      if (Atomics.load(data, 3)) { if (!failures.includes('Worker diagnostic record errors')) failure('Worker diagnostic record errors'); }
      const kind = lateHrNs && !capturedKinds.has('late-drop') ? 'late-drop' : healthHrNs && !capturedKinds.has('health-gap') ? 'health-gap' : undefined;
      if (!pendingIncident && kind) {
        const triggerHrNs = kind === 'late-drop' ? lateHrNs : healthHrNs;
        capturedKinds.add(kind);pendingIncident = {kind, triggerHrNs, snapshot: readRing(buffers[0]), witness: witnessRows};
      }
      if (pendingIncident && process.hrtime.bigint() >= pendingIncident.triggerHrNs + 1000000000n) {
        const block = {kind: pendingIncident.kind, triggerHrNs: pendingIncident.triggerHrNs, before: pendingIncident.snapshot, after: readRing(buffers[0]), independentBefore: pendingIncident.witness, independentAfter: witnessRows};
        const size = Buffer.byteLength(JSON.stringify(block, (_key, value) => typeof value === 'bigint' ? value.toString() : value));
        if (totalRetainedBytes + size > 6 * 1024 * 1024) failure('Diagnostic retention cap exceeded; incident truncated');
        else { incidents.push(block); totalRetainedBytes += size; }
        pendingIncident = undefined;
      }
    }, 250);
    process.stdout.write('Diagnostic copied receiver ready: http://127.0.0.1:5423/receiver (not qualification)\n');
    readyHr=process.hrtime.bigint();emit('service-ready');
    const signal = () => { stopped = true; };process.once('SIGINT', signal);process.once('SIGTERM', signal);
    while (!stopped && !failures.length) {const now=process.hrtime.bigint();
      if(Number(now-begin)/1e6>190000)failure('Host independent hard lifecycle deadline');
      else if(!clientStartHr&&readyHr&&Number(now-readyHr)/1e6>30000)failure('Client-start deadline');
      else if(clientStartHr&&!clientCompleteHr&&Number(now-clientStartHr)/1e6>125000)failure('Client-complete deadline');
      else if(clientCompleteHr&&Number(now-clientCompleteHr)/1e6>15000)failure('Client-cleanup stop deadline');
      await wait(100);
    }
    process.off('SIGINT', signal);process.off('SIGTERM', signal);
  } catch (error) { failure(String(error)); }
  finally {
    clearInterval(reader);
    if (pendingIncident) incidents.push({kind: pendingIncident.kind, triggerHrNs: pendingIncident.triggerHrNs, before: pendingIncident.snapshot, independentBefore: pendingIncident.witness, postwindowTruncated: true});
    try { await receiver.close(); cleanup.receiverCloseCompleted = true; } catch (error) { cleanup.receiverCloseCompleted = false; failure('Receiver close: ' + error); }
    cleanup.serverClosed = !receiver.server.listening;
    if (witness.exitCode === null && !witness.killed) {
      for (let n = 9; n <= 16; n++) { requests.set(n, process.hrtime.bigint()); witness.stdin.write(JSON.stringify({type: 'probe', sequence: n}) + '\n'); }
      const probeEnd = process.hrtime.bigint() + 1000000000n;
      while (probes.length < 16 && process.hrtime.bigint() < probeEnd && witnessExit === null) await wait(10);
      if (probes.length !== 16) failure('Closing independent clock probes missing');
      witness.stdin.end(JSON.stringify({type: 'close'}) + '\n');
    }
    const end = process.hrtime.bigint() + 2000000000n;
    while (witnessExit === null && process.hrtime.bigint() < end) await wait(10);
    if (witnessExit === null) { witness.kill('SIGTERM'); failure('Witness forced termination required'); const endAfterKill = process.hrtime.bigint() + 1000000000n; while (witnessExit === null && process.hrtime.bigint() < endAfterKill) await wait(10); if (witnessExit === null) { witness.kill('SIGKILL'); failure('Witness exit remains unobserved'); } }
    cleanup = {...cleanup, witnessFinalAcknowledged: witnessFinal, witnessExit, witnessPid: witness.pid};
    const finalBuffers = clock.diagnosticBuffers as SharedArrayBuffer[];
    const offsets = probes.map(pair => ({lower: BigInt(pair.childHrNs as string) - BigInt(pair.afterHrNs as string), upper: BigInt(pair.childHrNs as string) - BigInt(pair.beforeHrNs as string)}));
    const lower = offsets.reduce((value, interval) => value > interval.lower ? value : interval.lower, -(1n << 63n)), upper = offsets.reduce((value, interval) => value < interval.upper ? value : interval.upper, 1n << 63n);
    const independentClock = {offsetLowerNs: lower, offsetUpperNs: upper, widthNs: upper - lower, zeroContained: lower <= 0n && upper >= 0n,
      limitation: 'Causal bracket intersection bounds relative origin; it does not prove exact clock identity. Overlay must cover this interval.', probesExpected: 16, probesObserved: probes.length};
    if (!independentClock.zeroContained || probes.length !== 16) failure('Independent clock overlay cannot be validated');
    const report = {diagnosticOnly: true, node: process.version, platform: process.platform, architecture: process.arch, parentPid: process.pid,
      startedHrNs: begin, endedHrNs: process.hrtime.bigint(), durationRequestedSeconds: duration, manifest: prepared.manifest, probes, independentClock, failures,
      coordinatedLifecycle: {rows:lifecycleRows,readyHr,clientStartHr,clientCompleteHr,commandSequence,scope:'Host-only lifecycle; frozen2d1 musical instrumentation unchanged'},
      policy: 'Unchanged 20ms/10ms/lease/queue policy; dropped triggers are never retried.',
      incidents, finalRing: finalBuffers[0] ? readRing(finalBuffers[0]) : null, independentFinalRows: witnessRows, witnessSequence, cleanup, retentionTruncated: false,
      incidentSelection: 'One first health-gap block and one first real late-drop block reserved independently; additional incidents counted, not silently claimed captured.',
      finalReceiverState: receiver.state(), incidentRetainedBytes: totalRetainedBytes, limitation: 'Instrumented source-copy numerical control diagnostic; not receiver qualification or physical/audio evidence.'};
    const serialize = () => JSON.stringify(report, (_key, value) => typeof value === 'bigint' ? value.toString() : value);
    if (Buffer.byteLength(serialize()) > 6 * 1024 * 1024) { report.retentionTruncated = true; if (report.finalRing) report.finalRing.rows = []; report.independentFinalRows = []; }
    while (Buffer.byteLength(serialize()) > 6 * 1024 * 1024 && report.incidents.length) { report.retentionTruncated = true; report.incidents.pop(); }
    if (report.retentionTruncated) { failure('Final serialized evidence exceeded6MiB; explicit truncation'); process.exitCode = 1; }
    fs.writeFileSync(path.join(directory, 'report.json'), serialize() + '\n', {flag: 'wx'});
    if (failures.length) process.exitCode = 1;
    process.stdout.write(directory + '\n');
    emit('service-cleanup',{ok:!failures.length,serverClosed:cleanup.serverClosed,receiverCloseCompleted:cleanup.receiverCloseCompleted,witnessExit});process.off('message',command);process.off('disconnect',disconnected);process.disconnect();
  }
}

const arguments_ = process.argv.slice(2);
if (arguments_.some(value => !['--prepare', '--check', '--serve'].includes(value) && !value.startsWith('--duration='))) throw Error('Unknown diagnostic option');
if (arguments_.includes('--serve')) {
  if (arguments_.includes('--check')) throw Error('Do not combine source check and actual diagnostic');
  await serve(Number(arguments_.find(value => value.startsWith('--duration='))?.split('=')[1] ?? 120));
} else if (arguments_.includes('--prepare') || arguments_.includes('--check')) {
  const prepared = prepare();
  if (arguments_.includes('--check')) {
    // Parse only. Never evaluate or instantiate worker code in this mode.
    new Function(prepared.worker);
    new Function(witnessSource);
    process.stdout.write('Source-only parse and unique-insertion checks passed; no worker or service launched.\n');
  }
  process.stdout.write(sourceDirectory + '\n');
} else {
  process.stdout.write('Use --prepare --check for source preparation. --serve requires coordinated root GO; isolated port5423, no automatic browser.\n');
}
