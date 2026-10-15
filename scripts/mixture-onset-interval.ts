/** Real-function bounds only. No PCM, ownership search, or JS Math accuracy claim. */
export interface Interval { lo: number; hi: number }
export interface Enclosure {
  range: Interval;
  conservativeFallbacks: readonly string[];
  realAnalyticModel: true;
  javascriptMathAccuracyCertified: false;
}
const bits = new DataView(new ArrayBuffer(8));
export function nextUp(x: number): number {
  if (Number.isNaN(x)) throw Error('NaN endpoint');
  if (x === Infinity) return x;
  if (x === 0) return Number.MIN_VALUE;
  bits.setFloat64(0, x, false);
  const word = bits.getBigUint64(0, false);
  bits.setBigUint64(0, x > 0 ? word + 1n : word - 1n, false);
  return bits.getFloat64(0, false);
}
export function nextDown(x: number): number { return -nextUp(-x); }
export function interval(lo: number, hi = lo): Interval {
  if (typeof lo !== 'number' || typeof hi !== 'number' || Number.isNaN(lo) || Number.isNaN(hi) || lo > hi) throw Error('Invalid interval');
  return { lo, hi };
}
function check(a: Interval): void { if (typeof a.lo !== 'number' || typeof a.hi !== 'number' || Number.isNaN(a.lo) || Number.isNaN(a.hi) || a.lo > a.hi) throw Error('Invalid interval'); }
const whole = (): Interval => interval(-Infinity, Infinity);
function outward(lo: number, hi: number): Interval {
  return Number.isNaN(lo) || Number.isNaN(hi) ? whole() : interval(nextDown(lo), nextUp(hi));
}
export function add(a: Interval, b: Interval): Interval { check(a); check(b); return outward(a.lo + b.lo, a.hi + b.hi); }
export function negate(a: Interval): Interval { check(a); return interval(-a.hi, -a.lo); }
export function subtract(a: Interval, b: Interval): Interval { return add(a, negate(b)); }
export function multiply(a: Interval, b: Interval): Interval {
  check(a); check(b);
  const products = [a.lo * b.lo, a.lo * b.hi, a.hi * b.lo, a.hi * b.hi];
  if (products.some(Number.isNaN)) return whole();
  return outward(Math.min(...products), Math.max(...products));
}
export function divide(a: Interval, b: Interval): Interval {
  check(a); check(b);
  if (b.lo <= 0 && b.hi >= 0) throw Error('Division interval contains zero');
  return multiply(a, outward(1 / b.hi, 1 / b.lo));
}
export function hull(a: Interval, b: Interval): Interval { check(a); check(b); return interval(Math.min(a.lo, b.lo), Math.max(a.hi, b.hi)); }
export function intersect(a: Interval, b: Interval): Interval {
  check(a); check(b);
  return interval(Math.max(a.lo, b.lo), Math.min(a.hi, b.hi));
}
function minOne(a: Interval): Interval { return interval(Math.min(1, a.lo), Math.min(1, a.hi)); }
function nonnegative(a: Interval): Interval { return intersect(a, interval(0, Infinity)); }
function absoluteMaximum(a: Interval): number { return Math.max(Math.abs(a.lo), Math.abs(a.hi)); }
function enclosure(range: Interval, reasons: readonly string[] = []): Enclosure {
  return { range, conservativeFallbacks: [...new Set(reasons)], realAnalyticModel: true, javascriptMathAccuracyCertified: false };
}
/** These exact binary64 endpoints bracket real pi; independent Machin control proves it. */
export const REAL_PI = Object.freeze(interval(3.141592653589793, 3.1415926535897936));
function remainderTerm(radius: number, degree: number): Interval {
  let term = interval(1);
  for (let n = 1; n <= degree; n++) term = divide(multiply(term, interval(radius)), interval(n));
  return nonnegative(term);
}

/** Taylor degree32 has zero coefficient32, hence highest nonzero degree31.
 * The degree32 Lagrange remainder uses derivative33<=1: |x|^33/33!. */
export function sineRange(input: Interval): Enclosure {
  check(input);
  if (!Number.isFinite(input.lo) || !Number.isFinite(input.hi)) return enclosure(interval(-1, 1), ['sine: nonfinite argument']);
  // The quotient is only a choice of integer. Validity uses the checked real-pi reduction.
  const k = Math.round((input.lo / 2 + input.hi / 2) / (2 * 3.141592653589793));
  if (!Number.isSafeInteger(k) || Math.abs(k) > 1048576) return enclosure(interval(-1, 1), ['sine: reduction index outside bounded domain']);
  const x = subtract(input, multiply(interval(2 * k), REAL_PI));
  if (absoluteMaximum(x) > 4) return enclosure(interval(-1, 1), ['sine: reduced domain exceeds [-4,4]']);
  const square = multiply(x, x);
  let term = x, sum = x;
  for (let n = 1; n <= 15; n++) {
    term = negate(divide(multiply(term, square), interval((2 * n) * (2 * n + 1))));
    sum = add(sum, term);
  }
  const remainder = remainderTerm(absoluteMaximum(x), 33).hi;
  return enclosure(intersect(add(sum, interval(-remainder, remainder)), interval(-1, 1)));
}

/** Degree18 Taylor, exp(|x|)<=8/7 for |x|<=1/8; exact power-of-two scaling. */
export function exponentialRange(input: Interval): Enclosure {
  check(input);
  if (!Number.isFinite(input.lo) || !Number.isFinite(input.hi) || absoluteMaximum(input) > 64)
    return enclosure(interval(0, Infinity), ['exp: argument outside [-64,64]']);
  let x = input, squares = 0;
  while (absoluteMaximum(x) > .125) { x = divide(x, interval(2)); squares++; }
  // Outward halving may require10 rather than9 iterations at a64 endpoint.
  if (squares > 10) return enclosure(interval(0, Infinity), ['exp: scaling iteration bound']);
  let sum = interval(1), term = interval(1);
  for (let n = 1; n <= 18; n++) { term = divide(multiply(term, x), interval(n)); sum = add(sum, term); }
  const remainder = multiply(remainderTerm(absoluteMaximum(x), 19), divide(interval(8), interval(7))).hi;
  let result = nonnegative(add(sum, interval(-remainder, remainder)));
  for (let n = 0; n < squares; n++) result = nonnegative(multiply(result, result));
  return enclosure(result);
}
function tanhPoint(x: number): Enclosure {
  // For x>=32: 1-tanh(x)=2/(exp(2x)+1)<2^-63<2^-53 since e>2.
  // nextDown(1)=1-2^-53; the negative case follows odd symmetry.
  if (x >= 32) return enclosure(interval(nextDown(1), 1));
  if (x <= -32) return enclosure(interval(-1, nextUp(-1)));
  const exp = exponentialRange(interval(2 * x));
  return enclosure(intersect(divide(subtract(exp.range, interval(1)), add(exp.range, interval(1))), interval(-1, 1)), exp.conservativeFallbacks);
}
/** Monotonicity permits endpoint evaluation; no sampled interpolation. */
export function tanhRange(input: Interval): Enclosure {
  check(input);
  const low = tanhPoint(input.lo), high = tanhPoint(input.hi);
  return enclosure(interval(low.range.lo, high.range.hi), [...low.conservativeFallbacks, ...high.conservativeFallbacks]);
}

export interface FixedVoice {
  kind: 'sine' | 'kick' | 'triangle' | 'hat' | 'snare';
  origin: Interval;
  frequency: number;
  duration: number;
  level: number;
}
function validateVoice(v: FixedVoice): void {
  interval(v.origin.lo, v.origin.hi);
  if (![v.origin.lo, v.origin.hi, v.frequency, v.duration, v.level].every(Number.isFinite)
    || v.frequency < 0 || v.duration < 1e-6 || v.duration > 120 || v.level < 0 || v.level > 1
    || !['sine', 'kick', 'triangle', 'hat', 'snare'].includes(v.kind)) throw Error('Invalid fixed voice/domain');
}
/** Fixed active membership supplied by caller; external cancellation fade is not modeled. */
export function voiceRange(v: FixedVoice, time: number): Enclosure {
  validateVoice(v);
  if (!Number.isFinite(time)) throw Error('Nonfinite sample time');
  const age = subtract(interval(time), v.origin);
  if (age.hi <= 0 || age.lo >= v.duration) return enclosure(interval(0));
  const inside = intersect(age, interval(0, v.duration));
  const releaseSeconds = Math.min(.02, v.duration / 4);
  // duration/4 may round: enclose the min branch independently, rather than point-round it.
  const release = interval(Math.min(.02, divide(interval(v.duration), interval(4)).lo),
    Math.min(.02, divide(interval(v.duration), interval(4)).hi));
  if (releaseSeconds <= 0) throw Error('Invalid release duration');
  const envelope = multiply(minOne(divide(inside, interval(.002))),
    minOne(divide(subtract(interval(v.duration), inside), release)));
  if (v.kind === 'triangle' || v.kind === 'hat' || v.kind === 'snare') {
    const scale = v.kind === 'triangle' ? .18 : v.kind === 'hat' ? .28 : .45;
    const noiseMagnitude = v.kind === 'snare' ? add(interval(.8), interval(.2)).hi : 1;
    const bound = multiply(multiply(multiply(interval(scale), interval(v.level)), interval(noiseMagnitude)), envelope).hi;
    return enclosure(interval(-bound, bound), [v.kind === 'triangle' ? 'triangle: asin branch unsupported'
      : `${v.kind}: seed/sample-index branches unsupported; full noise range retained`]);
  }
  const reasons: string[] = [];
  const take = (value: Enclosure) => { reasons.push(...value.conservativeFallbacks); return value.range; };
  let phase: Interval, gain: Interval;
  if (v.kind === 'sine') { phase = multiply(multiply(interval(2), REAL_PI), multiply(interval(v.frequency), inside)); gain = interval(.18); }
  else {
    const cycles = add(multiply(interval(48), inside), multiply(interval(2.31),
      subtract(interval(1), take(exponentialRange(negate(divide(inside, interval(.022))))))));
    phase = multiply(multiply(interval(2), REAL_PI), cycles);
    gain = multiply(interval(.65), take(exponentialRange(negate(divide(multiply(interval(4.5), inside), interval(v.duration))))));
  }
  let result = multiply(multiply(multiply(take(sineRange(phase)), envelope), gain), interval(v.level));
  if (age.lo <= 0 || age.hi >= v.duration) result = hull(result, interval(0));
  return enclosure(result, reasons);
}
/** Branch order is retained. This function does not verify admission or ownership. */
export function fixedMixtureRange(voices: readonly FixedVoice[], time: number, volume: number): Enclosure {
  if (voices.length > 64 || !Number.isFinite(time) || !Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('Invalid fixed mixture/cap');
  let sum = interval(0);
  const reasons: string[] = [];
  for (const voice of voices) { const value = voiceRange(voice, time); sum = add(sum, value.range); reasons.push(...value.conservativeFallbacks); }
  const bounded = tanhRange(multiply(sum, interval(volume)));
  return enclosure(multiply(interval(.98), bounded.range), [...reasons, ...bounded.conservativeFallbacks]);
}
