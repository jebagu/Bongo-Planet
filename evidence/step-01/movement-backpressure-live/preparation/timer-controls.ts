import assert from 'node:assert/strict';
import {wrapObservedInterval} from './timer-observer';

// Source-only: fake callbacks/clock, no browser, sockets or services.
let controls = 0;
function make() {
  const a: any = {executing: null, intervalRuns: [], sends: [], socket: {bufferedAmount: 70000},
    pressureStart: 0, producerCandidates: new Set([3]), firstHighRun: null};
  let time = 10;
  return {a, clock: () => time++, record: (rows: any[], row: any) => rows.push(row)};
}
{
  const {a, clock, record} = make(), receiver = {token: 'unchanged'}, sentinel = {};
  let calls = 0;
  const wrapped = wrapObservedInterval(function(this: unknown, x: unknown, y: unknown) {
    calls++; assert.equal(this, receiver); assert.equal(x, sentinel); assert.equal(y, 7);
    assert.equal(a.executing.id, 3); a.sends.push({}); return sentinel;
  }, a, 3, clock, record);
  assert.equal(wrapped.call(receiver, sentinel, 7), sentinel); assert.equal(calls, 1);
  assert.equal(a.executing, null); assert.deepEqual(a.intervalRuns[0],
    {id: 3, index: 0, entry: 10, exit: 11, bufferedBefore: 70000, bufferedAfter: 70000, sendStart: 0, sendEnd: 1});
  assert.equal(a.firstHighRun, a.intervalRuns[0]); controls++;
}
{
  const {a, clock, record} = make(), error = Error('original callback exception');
  a.executing = {parent: true}; const parent = a.executing;
  assert.throws(() => wrapObservedInterval(() => {throw error;}, a, 3, clock, record)(), e => e === error);
  assert.equal(a.executing, parent); assert.equal(a.intervalRuns.length, 1); controls++;
}
for (const change of ['ambiguous', 'different', 'prepressure', 'low'] as const) {
  const {a, clock, record} = make();
  if (change === 'ambiguous') a.producerCandidates.add(9);
  if (change === 'different') a.producerCandidates = new Set([9]);
  if (change === 'prepressure') a.pressureStart = 12;
  if (change === 'low') a.socket.bufferedAmount = 65536;
  wrapObservedInterval(() => {}, a, 3, clock, record)();
  assert.equal(a.firstHighRun, null); controls++;
}
{
  const {a, clock, record} = make();
  const wrapped = wrapObservedInterval(() => {}, a, 3, clock, record);
  wrapped(); const first = a.firstHighRun; wrapped();
  assert.equal(a.firstHighRun, first); assert.equal(a.intervalRuns[1].index, 1); controls++;
}
{
  // The exact source transport used by the browser, with no imported closure.
  const serialized = new Function(`return (${String(wrapObservedInterval)})`)() as typeof wrapObservedInterval;
  const {a, clock, record} = make(); let calls = 0;
  assert.equal(serialized(() => {calls++; return 19;}, a, 3, clock, record)(), 19);
  assert.equal(calls, 1); assert.equal(a.intervalRuns.length, 1); controls++;
}
console.log(JSON.stringify({status: 'passed-source-controls', controls, actualAcquisition: false}));
