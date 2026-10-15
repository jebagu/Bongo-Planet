/** Bongo Planet bounded observation bookkeeping. No worker, browser or clock starts. */
export function canonical(value: unknown): string {
  const text = JSON.stringify(value);
  if (text === undefined) throw Error('Unserializable observation');
  return text;
}

/** One launch with synchronous durable ownership before readiness. Abandonment
 * is latched; later fulfillment still claims and independently closes. */
export class OwnedBrowserLaunch<T> {
  resource?: T;
  abandoned = false;
  private closure?: Promise<void>;
  constructor(private readonly claim: (resource: T) => void,
    private readonly closeResource: (resource: T) => Promise<void>,
    private readonly failure: (reason: string) => void) {}
  abandon() { this.abandoned = true; }
  async adopt(resource: T): Promise<T> {
    if (this.resource !== undefined) {
      this.abandoned = true;
      this.failure('Unexpected second browser resource');
      await this.closeResource(resource);
      throw Error('Unexpected second browser resource');
    }
    this.resource = resource;
    try {
      this.claim(resource); // synchronous append/fsync, before promise readiness
      if (this.abandoned) throw Error('Late browser fulfillment after abandonment');
      return resource;
    } catch (error) {
      this.abandoned = true;
      this.failure('Browser launch ownership '+String(error));
      try { await this.close(); }
      catch (closeError) { this.failure('Late/claim-failed browser closure '+String(closeError)); }
      throw error;
    }
  }
  close(): Promise<void> {
    this.abandon();
    if (this.resource === undefined) return Promise.resolve();
    return this.closure ??= Promise.resolve().then(() => this.closeResource(this.resource!));
  }
}

export class ObservationBudget {
  count = 0;
  bytes = 0;
  failure = '';
  constructor(readonly maxCount = 4000, readonly maxBytes = 524288) {}
  charge(value: unknown) {
    if (this.failure) throw Error(this.failure);
    const bytes = Buffer.byteLength(canonical(value));
    if (this.count + 1 > this.maxCount || this.bytes + bytes > this.maxBytes) {
      this.failure = 'Observation count/byte cap exceeded';
      throw Error(this.failure);
    }
    this.count++;
    this.bytes += bytes;
  }
}

/** Complete prefix observations: shortening, mutation or a wrapped window fails. */
export class PrefixHistory<T> {
  readonly rows: T[] = [];
  private keys: string[] = [];
  constructor(private readonly budget: ObservationBudget, private readonly label: string) {}
  ingest(values: T[]): T[] {
    if (!Array.isArray(values) || values.length < this.keys.length) throw Error(`${this.label} prefix lost`);
    const keys = values.map(canonical);
    for (let i = 0; i < this.keys.length; i++) if (keys[i] !== this.keys[i]) throw Error(`${this.label} prefix changed`);
    const added = values.slice(this.keys.length);
    for (const value of added) {
      this.budget.charge({kind: this.label, value});
      this.rows.push(JSON.parse(canonical(value)) as T);
      this.keys.push(canonical(value));
    }
    return added;
  }
}

export type HrBracket = {beforeHrNs: string; afterHrNs: string};
export type NativeObservation = {row: any; incarnation: string; readBracket: HrBracket};
/** Match whole ordered row occurrences, never timestamp-only deduplication.
 * Initial rows are a baseline; pre-baseline history is explicitly unobserved. */
export class NativeTailHistory {
  readonly rows: NativeObservation[] = [];
  readonly tailLimit = 64;
  private previous: string[] = [];
  private incarnation = '';
  private seeded = false;
  constructor(private readonly budget: ObservationBudget) {}
  ingest(tail: any[], incarnation: string, readBracket: HrBracket): NativeObservation[] {
    if (!Array.isArray(tail) || tail.length > this.tailLimit || !incarnation) throw Error('Invalid native tail');
    if (BigInt(readBracket.beforeHrNs) > BigInt(readBracket.afterHrNs)) throw Error('Reversed native read bracket');
    if (this.incarnation && incarnation !== this.incarnation) throw Error('Native incarnation changed');
    this.incarnation = incarnation;
    const keys = tail.map(canonical);
    let overlap = 0;
    if (this.seeded && this.previous.length) {
      const matches: number[] = [];
      for (let n = 1; n <= Math.min(this.previous.length, keys.length); n++) {
        if (this.previous.slice(-n).every((key, i) => key === keys[i])) matches.push(n);
      }
      if (matches.length !== 1) throw Error(matches.length ? 'Ambiguous native occurrence overlap' : 'Native tail gap');
      overlap = matches[0];
    }
    const added: NativeObservation[] = [];
    for (const row of tail.slice(overlap)) {
      if (!/^\d+$/.test(row.observedHrNs ?? '') || !/^\d+$/.test(row.reportArrivalHrNs ?? '')) throw Error('Missing native row clock witness');
      const h = BigInt(row.observedHrNs), arrival = BigInt(row.reportArrivalHrNs);
      if (h > arrival || arrival > BigInt(readBracket.afterHrNs)) throw Error('Native receipt causal order invalid');
      const last = this.rows.at(-1);
      if (last && h < BigInt(last.row.observedHrNs)) throw Error('Native row clock reversed');
      const value = {row: JSON.parse(canonical(row)), incarnation, readBracket: {...readBracket}};
      this.budget.charge({kind: 'native', value});
      this.rows.push(value);
      added.push(value);
    }
    this.previous = keys;
    this.seeded = true;
    return added;
  }
}

export type LocalObservation = {
  status: any; adapterState: string; contextState: string | null;
  audioNow: number; browserBefore: number; browserAfter: number; parentBracket: HrBracket;
};
export class LocalFreshness {
  private time: number | undefined;
  private session = '';
  observe(value: LocalObservation): boolean {
    if (value.browserAfter < value.browserBefore || BigInt(value.parentBracket.beforeHrNs) > BigInt(value.parentBracket.afterHrNs)) throw Error('Reversed local observation bracket');
    if (value.status === null) {
      if (this.time !== undefined) throw Error('Local telemetry disappeared');
      return false;
    }
    const time = value.status.time;
    if (!Number.isFinite(time) || time < 0 || !Number.isFinite(value.audioNow) || value.audioNow < time - .02) throw Error('Invalid local audio clock');
    if (this.time !== undefined && time < this.time) throw Error('Local status time reversed');
    const fresh = this.time === undefined || time > this.time;
    this.time = time;
    this.session = value.status.session;
    return fresh;
  }
  get lastTime() { return this.time; }
  get lastSession() { return this.session; }
}

export function assertActiveLocal(value: LocalObservation, engineSession: string, localEnd: number) {
  const s = value.status;
  if (!s || value.adapterState !== 'running' || value.contextState !== 'running' || s.running !== true || s.session !== engineSession || s.activeVoices !== 1 || s.pending !== 0 || s.sequence !== 1 || !Number.isFinite(s.time) || s.time >= localEnd) throw Error('Sole local voice no longer active');
  for (const field of ['lateDrops', 'lateDropsAudio', 'telemetryDrops', 'stolenVoices']) if (s[field] !== 0) throw Error('Local voice error/drop/steal');
}

export function assertActiveNative(row: any, session: string, endHrNs: bigint) {
  if (BigInt(row.observedHrNs) >= endHrNs) throw Error('Native natural lifetime expired');
  if (row.type === 'state' && (row.session !== session || row.state?.session !== session || row.state.activeVoices !== 1 || row.state.pending !== 0 || row.state.lateDrops !== 0 || row.state.onsetCount !== 1 || row.state.peakVoices !== 1 || row.state.objects !== 1)) throw Error('Sole native voice no longer active');
  if (row.session !== session || ['release', 'late-drop', 'steal', 'voice-expired', 'cancelled', 'started', 'stale', 'stale-incarnation'].includes(row.type)) throw Error('Unexpected native voice lifecycle');
}

export type Pair = HrBracket & {performanceNs: string; offsetLowerNs: string; offsetUpperNs: string};
/** UTC-free independently bracketed fixed origin. Interior use is conditional
 * on the same Node monotonic stable-rate/rounding premise, not a continuous proof. */
export class FixedHrMapping {
  readonly pairs: Pair[] = [];
  readonly offsetNs: bigint;
  uncertaintyNs = 0n;
  constructor(pair: Pair, private readonly budget: ObservationBudget) {
    this.offsetNs = (BigInt(pair.offsetLowerNs) + BigInt(pair.offsetUpperNs)) / 2n;
    this.check(pair);
  }
  check(pair: Pair) {
    const before = BigInt(pair.beforeHrNs), after = BigInt(pair.afterHrNs), p = BigInt(pair.performanceNs);
    if (after < before || BigInt(pair.offsetLowerNs) !== before - p - 1n || BigInt(pair.offsetUpperNs) !== after - p + 1n) throw Error('Hr/performance bracket algebra invalid');
    const lower = BigInt(pair.offsetLowerNs), upper = BigInt(pair.offsetUpperNs);
    this.budget.charge({kind: 'hr-performance-pair', pair});
    const abs = (x: bigint) => x < 0n ? -x : x;
    const u = [abs(this.offsetNs - lower), abs(upper - this.offsetNs)].reduce((a, b) => a > b ? a : b);
    if (u > this.uncertaintyNs) this.uncertaintyNs = u;
    if (this.uncertaintyNs > 10000000n) throw Error('Hr/performance uncertainty exceeds10ms');
    this.pairs.push({...pair});
  }
  interval(performanceSeconds: number) {
    if (!Number.isFinite(performanceSeconds)) throw Error('Invalid movement receipt time');
    const center = BigInt(Math.round(performanceSeconds * 1e9)) + this.offsetNs;
    return {lower: center - this.uncertaintyNs - 1n, upper: center + this.uncertaintyNs + 1n};
  }
}

/** Wire supplies duration and triggerSequence; neither is invented on a receipt. */
export function soleTriggerChain(events: any[], packets: any[], receipts: any[]) {
  const triggers = events.filter(e => e.type === 'trigger'), onsets = events.filter(e => e.type === 'onset');
  const wires = packets.filter(p => p.type === 'trigger'), native = receipts.filter(r => r.type === 'onset');
  if ([triggers, onsets, wires, native].some(rows => rows.length !== 1) || events.filter(e => e.type === 'emission').length !== 1) throw Error('Not a sole complete trigger/onset chain');
  const t = triggers[0].trigger, local = onsets[0].trigger, wire = wires[0], receipt = native[0];
  const sound = {kind: 'note', frequency: 440, timbre: 'sine', duration: 8, level: .1};
  const matchingSound = (candidate: any) => candidate && Object.keys(candidate).length === Object.keys(sound).length && Object.entries(sound).every(([key, value]) => candidate[key] === value);
  if ([t, local, wire].some(v => !matchingSound(v.sound)) || t.generatorId !== 'gen' || t.nodeId !== 'long-note' || !Number.isSafeInteger(t.sequence) || t.sequence !== 1 || wire.triggerSequence !== t.sequence || t.id !== local.id || t.id !== wire.id || t.id !== receipt.id || local.session !== t.session || local.sequence !== t.sequence || wire.generatorId !== t.generatorId || receipt.generatorId !== t.generatorId || wire.nodeId !== t.nodeId || receipt.nodeId !== t.nodeId || receipt.objectId !== wire.objectId || receipt.session !== wire.session || receipt.clockDomain !== 'native-monotonic') throw Error('Trigger/wire/native identity or sound mismatch');
  const first = events.findIndex(e => e.type === 'trigger');
  if (events.slice(first).some(e => ['reset', 'cancel'].includes(e.type))) throw Error('Sole local chain cancelled/reset');
  const firstWire = packets.findIndex(p => p.type === 'trigger');
  if (packets.slice(firstWire + 1).some(p => ['start', 'stop', 'cancel'].includes(p.type))) throw Error('Sole wire epoch changed/released');
  if (receipts.some(r => ['late-drop', 'steal'].includes(r.type))) throw Error('Native onset failed/stolen');
  return {trigger: t, localOnset: local, wire, nativeOnset: receipt, engineSession: t.session, outputSession: wire.session, nativeEndHrNs: BigInt(receipt.mutationHrBeforeNs) + 8000000000n, localEnd: t.onset + 8};
}
