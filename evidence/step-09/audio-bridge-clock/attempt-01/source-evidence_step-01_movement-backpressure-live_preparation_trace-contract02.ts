import assert from 'node:assert/strict';
import fs from 'node:fs';

export function requireObservationDeadline(elapsedMs: number, limitMs: number) {
  assert(Number.isFinite(elapsedMs) && elapsedMs >= 0 && Number.isFinite(limitMs) && limitMs > 0);
  assert(elapsedMs < limitMs, `Observation returned after${limitMs}ms deadline`);
}

/** Ordered epochs, not a global sequence across legitimate fresh sessions. */
export function validatePositionEpochs(sends: any[]) {
  const retired = new Set<string>(), last = new Map<string, number>();
  let active: string | null = null;
  let positions = 0;
  for (const row of sends) {
    const p = row.packet;
    if (p.type === 'sync') continue;
    assert.equal(typeof p.session, 'string'); assert(p.session.length > 0);
    if (p.type === 'start') {
      assert.equal(active, null, 'Fresh epoch started without stopping predecessor');
      assert(!retired.has(p.session), 'Retired epoch restarted');
      active = p.session; last.set(active!, 0);
    } else {
      assert.equal(p.session, active, 'Packet outside active ordered epoch');
      if (p.type === 'position') {
        assert(Number.isSafeInteger(p.sequence) && p.sequence > last.get(p.session)!);
        last.set(p.session, p.sequence); positions++;
      }
      if (p.type === 'stop') {retired.add(p.session); active = null;}
    }
  }
  return {positions, epochs: last.size, active, retired: [...retired]};
}

/** Boundary observation under the declared tagged-Chromium accounting premise. */
export function continuousPressure(audit: any, producerId: number | null, high: number, close: number) {
  assert(Number.isFinite(high) && Number.isFinite(close) && close >= high);
  const lows: any[] = [], inWindow = (t: number) => t >= high && t <= close;
  for (const v of audit.sends) if (inWindow(v.before) && v.bufferedBefore <= 65536)
    lows.push({source: 'before-send', time: v.before, buffered: v.bufferedBefore, index: v.index});
  for (const v of audit.intervalRuns) if (v.id === producerId) {
    if (inWindow(v.entry) && v.bufferedBefore <= 65536)
      lows.push({source: 'producer-entry', time: v.entry, buffered: v.bufferedBefore, index: v.index});
    if (inWindow(v.exit) && v.bufferedAfter <= 65536)
      lows.push({source: 'producer-exit', time: v.exit, buffered: v.bufferedAfter, index: v.index});
  }
  const samples = audit.samples.filter((v: any) => inWindow(v.time));
  for (const v of samples) if (v.buffered <= 65536) lows.push({source: 'sampler', time: v.time, buffered: v.buffered});
  const gaps = samples.length ? [samples[0].time - high,
    ...samples.slice(1).map((v: any, i: number) => v.time - samples[i].time), close - samples.at(-1).time] : [Infinity];
  const maxGapMs = Math.max(...gaps);
  return {lows, sampleCount: samples.length, maxGapMs,
    eligible: producerId !== null && lows.length === 0 && samples.length > 1 && maxGapMs <= 50,
    scope: 'Conditional boundary accounting; no installed-binary or continuous physical/kernel measurement'};
}

/** Append only to the exclusive existing journal created by the root owner. */
export function appendResourceClaim(journal: string, pid: number, parentPid: number, kind: 'proxy'|'browser-server') {
  assert(Number.isSafeInteger(pid) && pid > 0 && Number.isSafeInteger(parentPid) && parentPid > 0 && pid !== parentPid);
  assert(kind === 'proxy' || kind === 'browser-server');
  assert(fs.lstatSync(journal).isFile(), 'Resource journal must already be a regular file');
  const existing = fs.readFileSync(journal);
  assert(existing.length <= 8192 && (!existing.length || existing.at(-1) === 10));
  const lines = existing.toString('utf8').split('\n').filter(Boolean);
  assert(lines.length < 8, 'Resource claim count cap');
  for (const line of lines) {
    const row = JSON.parse(line);
    assert.deepEqual(Object.keys(row).sort(), ['kind', 'parentPid', 'pid']);
    assert(Number.isSafeInteger(row.pid) && row.pid > 0 && Number.isSafeInteger(row.parentPid) && row.parentPid > 0);
    assert(row.kind === 'proxy' || row.kind === 'browser-server');
    assert.notEqual(row.pid, pid, 'Duplicate resource claim');
  }
  const bytes = Buffer.from(JSON.stringify({pid, parentPid, kind}) + '\n');
  assert(existing.length + bytes.length <= 8192, 'Resource claim byte cap');
  const fd = fs.openSync(journal, 'a');
  try {assert.equal(fs.writeSync(fd, bytes), bytes.length, 'Partial resource claim write'); fs.fsyncSync(fd);}
  finally {fs.closeSync(fd);}
  return {pid, parentPid, kind};
}
