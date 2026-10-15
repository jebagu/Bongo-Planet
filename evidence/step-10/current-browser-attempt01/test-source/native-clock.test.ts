import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {afterAll, expect, it} from 'vitest';
import {NativeClock, NATIVE_WORKER_SOURCE, nativePairBound} from '../src/output/NativeClock';
import type {NativeReceiverOnset, ReceiverClockCommand} from '../src/output/ReceiverClock';
import type {Packet} from '../src/output/protocol';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate: () => boolean, timeout = 3000) {
  const end = performance.now() + timeout;
  while (!predicate()) { if (performance.now() > end) throw Error('Native observation timed out'); await wait(2); }
}
const captureDirectory = path.resolve(`evidence/step-09/native-clock-integration/capture-${Date.now()}`);
const moduleSource = fs.readFileSync(path.resolve('src/output/NativeClock.ts'));
const testSource = fs.readFileSync(path.resolve('tests/native-clock.test.ts'));
const captured: (() => unknown)[] = [];
afterAll(() => {
  fs.mkdirSync(captureDirectory, {recursive: false});
  fs.writeFileSync(path.join(captureDirectory, 'NativeClock.ts'), moduleSource);
  fs.writeFileSync(path.join(captureDirectory, 'native-clock.test.ts'), testSource);
  fs.writeFileSync(path.join(captureDirectory, 'witnesses.json'), JSON.stringify({capturedAt: new Date().toISOString(), node: process.version, platform: process.platform, arch: process.arch, moduleSha256: createHash('sha256').update(moduleSource).digest('hex'), testSha256: createHash('sha256').update(testSource).digest('hex'), cases: captured.map(read => read()), limitation: 'Isolated native numerical controls only; no audio, browser or application fixture qualification.'}, null, 2) + '\n');
});
function harness() {
  const onsets: NativeReceiverOnset[] = [], applied: number[] = [], failures: string[] = [], releases: {session: string; reason: string}[] = [];
  const clock = new NativeClock({onset: receipt => { if (receipt.clockDomain === 'native-monotonic') onsets.push(receipt); },
    applied: n => applied.push(n), failure: reason => failures.push(reason), release: (session, reason) => releases.push({session, reason})});
  let sequence = 0; const commands: unknown[] = [];
  captured.push(() => ({commands, onsets, applied, failures, releases, diagnostics: clock.diagnostics}));
  const send = (packet: Exclude<Packet, {type: 'sync'}>) => { const command = {commandSequence: ++sequence, packet}; commands.push({command, observedHrNs: process.hrtime.bigint().toString(), observedPerformanceMs: performance.now()}); clock.send(command); return sequence; };
  const start = (session: string) => send({version: 1, type: 'start', session, sequence: 0});
  const position = (session: string, xyz: [number, number, number] = [1, 0, 0], objectId = 7) => send({version: 1, type: 'position', session, sequence: 1, nodeId: 'node', objectId, position: xyz, sent: performance.now() / 1000});
  const trigger = (session: string, n: number, onset = performance.now() / 1000 + 0.12) => send({version: 1, type: 'trigger', session, sequence: 1, triggerSequence: n,
    id: `${session}-${n}`, generatorId: 'generator', nodeId: 'node', objectId: 7, onset,
    sound: {kind: 'note', frequency: 440, timbre: 'sine', duration: 2, level: .5}});
  return {clock, send, start, position, trigger, onsets, applied, failures, releases};
}

it('native clock calibrates independently and preserves actual control witnesses, coordinates and cancellation', async () => {
  const h = harness(); let beat: ReturnType<typeof setInterval> | undefined;
  try {
    await h.clock.start(0); expect(h.clock.ready).toBe(true);
    expect(h.clock.diagnostics.causalWitnesses).toHaveLength(8);
    expect(h.clock.diagnostics.uncertaintyMs).toBeLessThanOrEqual(10);
    h.start('normal'); h.position('normal');
    beat = setInterval(() => h.send({version: 1, type: 'heartbeat', session: 'normal'}), 50);
    const n = h.trigger('normal', 1, performance.now() / 1000);
    await until(() => h.onsets.length === 1 && h.applied.includes(n));
    const actual = h.onsets[0];
    expect(actual).toMatchObject({type: 'onset', nodeId: 'node', objectId: 7, generatorId: 'generator', position: [1, 0, 0], clockDomain: 'native-monotonic'});
    expect(Math.abs(actual.errorMs) + actual.uncertaintyMs).toBeLessThanOrEqual(20);
    expect(BigInt(actual.actualHrNs)).toBe(BigInt(actual.mutationHrAfterNs));
    expect(BigInt(actual.mutationHrBeforeNs)).toBeLessThanOrEqual(BigInt(actual.actualHrNs));
    expect(actual.actual).toBe(Number(BigInt(actual.actualHrNs) - BigInt(actual.fixedNodeHrOffsetNs)) / 1e9);
    expect(actual).not.toHaveProperty('currentFrame'); expect(actual).not.toHaveProperty('sampleOffset');
    h.trigger('normal', 2); h.position('normal', [0, 1, 0]);
    await until(() => h.onsets.length === 2);
    expect(h.onsets[1].position).toEqual([0, 1, 0]);
    expect(h.onsets[0].position).toEqual([1, 0, 0]);
    h.trigger('normal', 3, performance.now() / 1000 + .25);
    const cancel = h.send({version: 1, type: 'cancel', session: 'normal', sequence: 2, ids: ['normal-1', 'normal-2', 'normal-3'], nodeIds: ['node']});
    await until(() => h.applied.includes(cancel));
    await wait(300);
    expect(h.onsets).toHaveLength(2);
    await until(() => (h.clock.diagnostics.worker as {pending: number; activeVoices: number; objects: number}).objects === 0);
    expect(h.clock.diagnostics.worker).toMatchObject({pending: 0, activeVoices: 0, objects: 0});
    await wait(650); // real periodic held-out bracket, heartbeat keeps epoch alive
    expect(h.clock.diagnostics.clockPairSequence).toBeGreaterThan(3);
    expect(h.failures).toEqual([]);
  } finally { clearInterval(beat); await h.clock.close(); }
  expect(h.clock.diagnostics.cleanup).toMatchObject({closedAcknowledged: true, exitObserved: true, exitCode: 0});
});

it('worker executes during blocked parent and drops genuinely late controls without fake rendering fields', async () => {
  const h = harness();
  try {
    await h.clock.start(0); h.start('parent-block'); h.position('parent-block');
    const deadline = performance.now() / 1000 + .2;
    h.trigger('parent-block', 1, deadline);
    await until(() => (h.clock.diagnostics.worker as {pending?: number}).pending === 1);
    await wait(Math.max(0, deadline * 1000 - performance.now() - 30));
    const before = process.hrtime.bigint(); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); const after = process.hrtime.bigint();
    await until(() => h.onsets.length === 1);
    expect(h.onsets[0].type).toBe('onset');
    expect(BigInt(h.onsets[0].actualHrNs)).toBeGreaterThanOrEqual(before);
    expect(BigInt(h.onsets[0].actualHrNs)).toBeLessThanOrEqual(after);
    expect(Math.abs(h.onsets[0].errorMs) + h.onsets[0].uncertaintyMs).toBeLessThanOrEqual(20);
    h.trigger('parent-block', 2, performance.now() / 1000 - .03);
    await until(() => h.onsets.length === 2);
    expect(h.onsets[1].type).toBe('late-drop'); expect(h.onsets[1].errorMs).toBeGreaterThan(20);
    expect(h.failures).toEqual([]);
  } finally { await h.clock.close(); }
});

it('producer watchdog expires before stale buffered heartbeat and a new epoch begins empty', async () => {
  const h = harness();
  try {
    await h.clock.start(0); h.start('lease'); h.position('lease'); h.trigger('lease', 1);
    await until(() => h.onsets.length === 1);
    await until(() => h.releases.some(r => r.session === 'lease' && r.reason.includes('watchdog')));
    h.send({version: 1, type: 'heartbeat', session: 'lease'});
    await wait(30); expect(h.clock.diagnostics.worker).toMatchObject({session: '', pending: 0, activeVoices: 0, objects: 0});
    h.start('fresh'); h.position('fresh'); h.trigger('fresh', 1);
    await until(() => h.onsets.length === 2);
    expect(h.onsets[1].session).toBe('fresh'); expect(h.failures).toEqual([]);
  } finally { await h.clock.close(); }
});

it('active object rebind and IPC sequence gaps fail closed and cannot execute later admitted work', async () => {
  for (const invalid of ['binding', 'sequence']) {
    const h = harness();
    try {
      await h.clock.start(0); h.start('bad'); h.position('bad'); h.trigger('bad', 1, performance.now() / 1000 + .2);
      if (invalid === 'binding') h.position('bad', [0, 1, 0], 8);
      else h.clock.send({commandSequence: 999, packet: {version: 1, type: 'heartbeat', session: 'bad'}} satisfies ReceiverClockCommand);
      await until(() => h.failures.length === 1);
      expect(h.clock.ready).toBe(false); await wait(250);
      expect(h.onsets).toEqual([]); expect(h.failures[0]).toContain(invalid === 'binding' ? 'Active object binding changed' : 'ordering/gap');
    } finally { await h.clock.close(); }
  }
});

function controlled(name: string) {
  const messages: any[] = [], handlers: Record<string, (data: any) => void> = {};
  let now = name === 'rollback' ? 1_019_900_000n : name === 'lease-write' ? 1_499_000_000n : 1_000_000_000n;
  class ControlMap extends Map { override set(key: any, value: any) { const result = super.set(key, value); if (name === 'rollback' && key === 'control') now = 1_020_100_000n; if (name === 'lease-write' && key === 'control') now = 1_501_000_000n; return result; } }
  const sandbox = vm.createContext({Buffer, Map: ControlMap, Set, BigInt, Atomics, SharedArrayBuffer, Int32Array,
    process: {hrtime: {bigint: () => now}}, require: () => ({workerData: {incarnation: 'dry', poison: new SharedArrayBuffer(4)}, threadId: 0,
      parentPort: {postMessage: (m: any) => messages.push(m), on: (event: string, handler: (data: any) => void) => {handlers[event] = handler;}, close: () => {}}}),
    setTimeout: () => 1, clearTimeout: () => {}, setInterval: () => 1, clearInterval: () => {}});
  vm.runInContext(NATIVE_WORKER_SOURCE, sandbox);
  vm.runInContext("clockBudget={uncertaintyMs:0,sentHrNs:'1000000000',nodeHrPair:{afterHrNs:'1000000000'},clockPairSequence:1};session='old';lastHeartbeat=1000000000n;objects.set('node',{objectId:1,position:[0,0,1]});pending=[{id:'control',session:'old',nodeId:'node',generatorId:'gen',objectId:1,deadlineHrNs:1000000000n,intendedNodeNs:'0',durationNs:'1000000000'}]", sandbox);
  return {messages, handlers, sandbox, advanceHr: (value: bigint) => { now = value; }};
}

it('controlled capacity fatal aborts dispatch and late voice stealing restores the evicted state', () => {
  const fatal = controlled('capacity');
  vm.runInContext("receipts=Array.from({length:8192},()=>({type:'filler'}));dispatch()", fatal.sandbox);
  expect(vm.runInContext('({dead,session,pending:pending.length,voices:voices.size,objects:objects.size})', fatal.sandbox)).toEqual({dead: true, session: '', pending: 0, voices: 0, objects: 0});
  expect(fatal.messages.filter(m => m.type === 'fatal')).toHaveLength(1);
  const rollback = controlled('rollback');
  vm.runInContext("for(let i=0;i<64;i++)voices.set('old-'+i,{endHrNs:4000000000n});dispatch()", rollback.sandbox);
  const rows = rollback.messages.flatMap(m => m.rows ?? []), late = rows.find(r => r.type === 'late-drop');
  expect(late).toMatchObject({beforeErrorMs: 19.9, errorMs: 20.1, mockVoiceAttempted: true, mockVoiceWritten: false, lateMutationRolledBack: true});
  expect(rows.some(r => r.type === 'steal')).toBe(false);
  expect(vm.runInContext("({voices:voices.size,oldest:voices.keys().next().value,newVoice:voices.has('control')})", rollback.sandbox)).toEqual({voices: 64, oldest: 'old-0', newVoice: false});
});

it('controlled worker bounds reject pending overflow, expired budget and command ACK gaps', () => {
  const pending = controlled('pending');
  vm.runInContext('pending=Array.from({length:5376},()=>({deadlineHrNs:2000000000n}))', pending.sandbox);
  pending.handlers.message({incarnation: 'dry', sequence: 1, type: 'trigger', session: 'old', triggerSequence: 1, nodeId: 'node', objectId: 1, deadlineHrNs: '2000000000', durationNs: '1000000000'});
  expect(pending.messages.find(m => m.type === 'fatal')?.reason).toContain('Pending capacity');
  const expired = controlled('expiry');
  vm.runInContext("clockBudget.sentHrNs='-1000000000';dispatch()", expired.sandbox);
  expect(expired.messages.find(m => m.type === 'fatal')?.reason).toContain('budget expired');
  const ack = controlled('ack'); ack.handlers.message({incarnation: 'dry', type: 'ack', batchSequence: 100});
  expect(ack.messages.find(m => m.type === 'fatal')?.reason).toContain('ACK gap');
});

it('controlled stale heartbeat cannot revive lease and poisoned/late worker dispatch cannot write voices', () => {
  const stale = controlled('stale');
  vm.runInContext('lastHeartbeat=0n', stale.sandbox);
  stale.handlers.message({incarnation: 'dry', sequence: 1, type: 'heartbeat', session: 'old'});
  expect(vm.runInContext('({session,pending:pending.length,voices:voices.size,objects:objects.size})', stale.sandbox)).toEqual({session: '', pending: 0, voices: 0, objects: 0});
  const poisoned = controlled('poison'); vm.runInContext('Atomics.store(poison,0,1);dispatch()', poisoned.sandbox);
  expect(poisoned.messages.find(m => m.type === 'fatal')?.reason).toContain('poisoned');
  expect(vm.runInContext('voices.size', poisoned.sandbox)).toBe(0);
  const late = controlled('late'); vm.runInContext('pending[0].deadlineHrNs=970000000n;dispatch()', late.sandbox);
  expect(late.messages.flatMap(m => m.rows ?? []).find(r => r.type === 'late-drop')).toMatchObject({errorMs: 30, mockVoiceAttempted: false, mockVoiceWritten: false});
});

it('held-out native conversion rejects incompatible origin and retains wide later bracket uncertainty', () => {
  const startup = {beforeHrNs: '999999999', afterHrNs: '1000000001', performanceMs: 0, offsetLowerNs: '999999998', offsetUpperNs: '1000000002', widthNs: '4'};
  const wide = {beforeHrNs: '989999999', afterHrNs: '1010000001', performanceMs: 0, offsetLowerNs: '989999998', offsetUpperNs: '1010000002', widthNs: '20000004'};
  expect(nativePairBound(wide, startup, 1000000000n)).toBe(10000002n);
  const shifted = {beforeHrNs: '1050000000', afterHrNs: '1050000001', performanceMs: 0, offsetLowerNs: '1049999999', offsetUpperNs: '1050000002', widthNs: '3'};
  expect(() => nativePairBound(shifted, startup, 1000000000n)).toThrow('incompatible');
  expect(() => nativePairBound({...wide, widthNs: '2'}, startup, 1000000000n)).toThrow('algebra');
  const worker = controlled('budget'); worker.handlers.message({incarnation: 'dry', sequence: 1, type: 'clock-budget', uncertaintyMs: 10.000002});
  expect(worker.messages.find(m => m.type === 'fatal')?.reason).toContain('exceeds10ms');
  expect(vm.runInContext('voices.size', worker.sandbox)).toBe(0);
});

it('controlled lease expiry between due rows prevents later writes and expired clock budget cannot refresh', () => {
  const burst = controlled('burst');
  Object.assign(burst.sandbox, {advanceHr: () => burst.advanceHr(1600000000n)});
  vm.runInContext("pending.push({...pending[0],id:'second',deadlineHrNs:1100000000n});const originalRow=row;row=function(type,fields){const ok=originalRow(type,fields);if(type==='onset')advanceHr();return ok;};dispatch()", burst.sandbox);
  const rows = burst.messages.flatMap(m => m.rows ?? []);
  expect(rows.filter(r => r.type === 'onset').map(r => r.id)).toEqual(['control']);
  expect(rows.find(r => r.type === 'release')?.reason).toContain('watchdog');
  expect(vm.runInContext('({session,voices:voices.size,pending:pending.length})', burst.sandbox)).toEqual({session: '', voices: 0, pending: 0});
  const expired = controlled('refresh'); vm.runInContext("clockBudget.sentHrNs='-1000000000'", expired.sandbox);
  expired.handlers.message({incarnation: 'dry', sequence: 1, type: 'clock-budget', uncertaintyMs: 0, parentSentHrNs: '1000000000'});
  expect(expired.messages.find(m => m.type === 'fatal')?.reason).toContain('budget expired');
  expect(vm.runInContext('dead', expired.sandbox)).toBe(true);
  const bytes = controlled('bytes'); vm.runInContext('unacknowledgedBytes=262144', bytes.sandbox);
  bytes.handlers.message({incarnation: 'dry', sequence: 1, type: 'heartbeat', session: 'old'});
  expect(bytes.messages.find(m => m.type === 'fatal')?.reason).toContain('count/byte capacity');
});

it('controlled fault during graceful close remains recorded and rejects successful cleanup', async () => {
  const h = harness(); await h.clock.start(0);
  const closing = h.clock.close();
  (h.clock as unknown as {fail: (reason: string) => void}).fail('Controlled close-time fault');
  await expect(closing).rejects.toThrow('Controlled close-time fault');
  expect(h.clock.diagnostics).toMatchObject({failure: 'Controlled close-time fault', closeFailure: 'Controlled close-time fault', cleanup: {closedAcknowledged: true, exitObserved: true, exitCode: 0}});
  expect(h.failures).toEqual([]); // bridge hooks are already shutting down
});

it('explicit invalidation poisons the actual worker and clears pending controls without fallback', async () => {
  const h = harness();
  try {
    await h.clock.start(0); h.start('invalidate'); h.position('invalidate'); h.trigger('invalidate', 1, performance.now() / 1000 + .2);
    await until(() => (h.clock.diagnostics.worker as {pending?: number}).pending === 1);
    h.clock.invalidate('Controlled invalid witness'); expect(h.clock.ready).toBe(false);
    await wait(250); expect(h.onsets).toEqual([]); expect(h.failures).toEqual(['Controlled invalid witness']);
    expect(h.clock.diagnostics.worker).toMatchObject({pending: 0, activeVoices: 0, objects: 0});
  } finally { await h.clock.close(); }
});

it('controlled control write crossing lease cannot dereference released objects or emit an onset', () => {
  const lease = controlled('lease-write');
  expect(() => vm.runInContext('pending[0].deadlineHrNs=1490000000n;dispatch()', lease.sandbox)).not.toThrow();
  expect(vm.runInContext('({session,voices:voices.size,pending:pending.length,objects:objects.size})', lease.sandbox)).toEqual({session: '', voices: 0, pending: 0, objects: 0});
  vm.runInContext('flush()', lease.sandbox);
  const rows = lease.messages.flatMap(m => m.rows ?? []);
  expect(rows.find(r => r.type === 'release')?.reason).toContain('watchdog');
  expect(rows.some(r => r.type === 'onset')).toBe(false);
});
