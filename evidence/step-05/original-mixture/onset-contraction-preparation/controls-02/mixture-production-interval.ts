import {add, divide, hull, interval, multiply, nextDown, nextUp, subtract, type Interval} from './mixture-onset-interval';

/** Conditional engineering premise, not a measured/certified Chromium bound. */
export const CALL_ERROR = 2 ** -40;
export const NUMERICAL_ASSUMPTIONS = Object.freeze({
  basicArithmetic: 'IEEE754 binary64 round-to-nearest, one outward representable step per elementary operation',
  sineAbsoluteError: CALL_ERROR, tanhAbsoluteError: CALL_ERROR, exponentialRelativeError: CALL_ERROR,
  javascriptMathCertified: false, float32: 'monotone round-to-nearest binary32 output conversion',
  noteExpression: 'phase=age*frequency; sin((2*Math.PI)*phase); envelope=(attack*end)*.18; waveform*envelope*1*level',
  mixtureExpression: 'ordered additions; .98*Math.tanh(mix*volume)',
  unsupported: ['kick/triangle/noise', 'cancellation fades', 'frequency Math.pow derivation', 'unknown ownership']
});
export interface SineParameters {origin: Interval; frequency: number; duration: number; level: number}

function finiteBox(a: Interval): void {
  interval(a.lo, a.hi);
  if (!Number.isFinite(a.lo) || !Number.isFinite(a.hi)) throw Error('Unsupported nonfinite expression interval');
}
function widen(a: Interval, radius: number): Interval {
  if (!Number.isFinite(radius) || radius < 0) throw Error('Invalid conditional error radius');
  return add(a, interval(-radius, radius));
}
/** |sin(x)-sin(y)|<=|x-y|. The call at midpoint is only a reference under
 * CALL_ERROR; a second CALL_ERROR covers the candidate implementation call.
 * This is a continuous Lipschitz enclosure, not interpolation of grid samples. */
export function conditionalSine(input: Interval): Interval {
  finiteBox(input);
  const midpoint = input.lo / 2 + input.hi / 2;
  const radius = nextUp(Math.max(Math.abs(input.lo - midpoint), Math.abs(input.hi - midpoint)));
  const reference = Math.sin(midpoint);
  return interval(Math.max(-1 - CALL_ERROR, nextDown(reference - radius - 2 * CALL_ERROR)),
    Math.min(1 + CALL_ERROR, nextUp(reference + radius + 2 * CALL_ERROR)));
}
/** tanh is monotone. Endpoint reference errors plus candidate-call error. */
export function conditionalTanh(input: Interval): Interval {
  finiteBox(input);
  return interval(Math.max(-1 - CALL_ERROR, nextDown(Math.tanh(input.lo) - 2 * CALL_ERROR)),
    Math.min(1 + CALL_ERROR, nextUp(Math.tanh(input.hi) + 2 * CALL_ERROR)));
}
export function binary32Range(input: Interval): Interval {
  finiteBox(input);
  // Correctly rounded fround is monotone: endpoint conversion encloses every
  // possible rounded output, including subnormals and signed zero.
  const lo = Math.fround(input.lo), hi = Math.fround(input.hi);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) throw Error('Unsupported Float32 overflow');
  return interval(lo, hi);
}
export function productionSineRange(v: SineParameters, time: Interval): Interval {
  finiteBox(v.origin); finiteBox(time);
  if (![v.frequency,v.duration,v.level].every(Number.isFinite) || v.frequency < 0 || v.duration < 1e-6
    || v.duration > 120 || v.level < 0 || v.level > 1) throw Error('Unsupported note expression parameters');
  const age = subtract(time, v.origin);
  if (age.hi < 0 || age.lo >= v.duration) return interval(0);
  const inside = interval(Math.max(0,age.lo), Math.min(v.duration,age.hi));
  const attackRaw = divide(inside,interval(.002));
  const attack = interval(Math.min(1,attackRaw.lo), Math.min(1,attackRaw.hi));
  const quarter = divide(interval(v.duration),interval(4));
  const release = interval(Math.min(.02,quarter.lo), Math.min(.02,quarter.hi));
  const endRaw = divide(subtract(interval(v.duration),inside),release);
  const end = interval(Math.max(0,Math.min(1,endRaw.lo)),Math.max(0,Math.min(1,endRaw.hi)));
  const envelope = multiply(multiply(attack,end),interval(.18));
  const phase = multiply(inside,interval(v.frequency));
  const waveform = conditionalSine(multiply(multiply(interval(2),interval(Math.PI)),phase));
  let output = multiply(multiply(multiply(waveform,envelope),interval(1)),interval(v.level));
  if (age.lo < 0 || age.hi >= v.duration) output = hull(output,interval(0));
  return output;
}
/** Each term encloses its own production expression. Real addition is order
 * independent; n rounded additions differ from it by at most n*u*sum(abs)
 * /(1-n*u), plus n subnormal steps. This additional bound covers every allowed
 * insertion order, not just the order used by this interval loop. */
export function productionMixRange(terms: readonly Interval[],volume: number): Interval {
  if (terms.length > 64 || !Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('Invalid expression mixture');
  let sum=interval(0),magnitudes=interval(0);
  for(const term of terms){finiteBox(term);sum=add(sum,term);magnitudes=add(magnitudes,interval(Math.max(Math.abs(term.lo),Math.abs(term.hi))));}
  const nu=terms.length*2**-53;
  const rounding=add(divide(multiply(interval(nu),magnitudes),interval(1-nu)),interval(terms.length*Number.MIN_VALUE)).hi;
  sum=widen(sum,rounding);
  return binary32Range(multiply(interval(.98),conditionalTanh(multiply(sum,interval(volume)))));
}
export function squaredDistanceLower(value: number, range: Interval): number {
  finiteBox(range);if(!Number.isFinite(value))throw Error('Nonfinite observation');
  const distance = value < range.lo ? subtract(interval(range.lo),interval(value)).lo
    : value > range.hi ? subtract(interval(value),interval(range.hi)).lo : 0;
  return Math.max(0,multiply(interval(Math.max(0,distance)),interval(Math.max(0,distance))).lo);
}
export function squaredDistanceUpper(value: number, range: Interval): number {
  finiteBox(range);if(!Number.isFinite(value))throw Error('Nonfinite observation');
  const distance=nextUp(Math.max(Math.abs(value-range.lo),Math.abs(value-range.hi)));
  return multiply(interval(distance),interval(distance)).hi;
}
