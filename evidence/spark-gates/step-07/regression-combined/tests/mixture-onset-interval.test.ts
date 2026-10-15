import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { add, divide, exponentialRange, fixedMixtureRange, hull, intersect, interval,
  multiply, nextDown, nextUp, REAL_PI, sineRange, subtract, tanhRange, voiceRange,
  type Enclosure, type FixedVoice, type Interval } from '../scripts/mixture-onset-interval';

const references = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,
  '../evidence/step-05/original-mixture/onset-interval-preparation/reference-vectors.json'), 'utf8'));
function contains(range: Interval, expected: readonly number[]) {
  expect(range.lo).toBeLessThanOrEqual(expected[0]);
  expect(range.hi).toBeGreaterThanOrEqual(expected[1]);
}
function width(range: Interval) { return range.hi - range.lo; }
const base: FixedVoice = { kind: 'sine', origin: interval(0), frequency: 440, duration: .6, level: .65 };

describe('outward IEEE arithmetic and invalid domains', () => {
  test('signed zero, subnormal adjacency, infinity and finite overflow', () => {
    expect(nextUp(-0)).toBe(Number.MIN_VALUE);
    expect(nextDown(0)).toBe(-Number.MIN_VALUE);
    expect(Object.is(nextUp(-Number.MIN_VALUE), -0)).toBe(true);
    expect(nextDown(Number.MIN_VALUE)).toBe(0);
    expect(nextDown(Infinity)).toBe(Number.MAX_VALUE);
    expect(nextUp(-Infinity)).toBe(-Number.MAX_VALUE);
    expect(nextUp(Infinity)).toBe(Infinity);
    const overflow = add(interval(Number.MAX_VALUE), interval(Number.MAX_VALUE));
    expect(overflow.lo).toBe(Number.MAX_VALUE); expect(overflow.hi).toBe(Infinity);
    // Exact real MIN_VALUE/2 is positive but lies below every positive Float64.
    const underflow = divide(interval(Number.MIN_VALUE), interval(2));
    expect(underflow.lo).toBeLessThanOrEqual(0); expect(underflow.hi).toBeGreaterThanOrEqual(Number.MIN_VALUE);
  });
  test('exact rational outcomes, interval signs and unknown nonfinite product', () => {
    contains(add(interval(.25), interval(.5)), [.75, .75]);
    contains(subtract(interval(.75), interval(.5)), [.25, .25]);
    contains(multiply(interval(-3, -2), interval(4, 5)), [-15, -8]);
    contains(divide(interval(1), interval(3)), [.3333333333333333, .33333333333333337]);
    expect(multiply(interval(0), interval(Infinity))).toEqual(interval(-Infinity, Infinity));
    expect(hull(interval(-2, -1), interval(3, 4))).toEqual(interval(-2, 4));
    expect(intersect(interval(-2, 2), interval(1, 4))).toEqual(interval(1, 2));
  });
  test('NaN, inverted bounds, zero divisor and empty intersection reject', () => {
    expect(() => interval(NaN)).toThrow(); expect(() => interval(undefined as any)).toThrow(); expect(() => interval(2, 1)).toThrow();
    expect(() => nextUp(NaN)).toThrow();
    expect(() => sineRange({ lo: NaN, hi: 1 })).toThrow();
    expect(() => multiply({ lo: 2, hi: 1 }, interval(0))).toThrow();
    expect(() => divide(interval(1), interval(-1, 1))).toThrow();
    expect(() => intersect(interval(0, 1), interval(2, 3))).toThrow();
  });
});

describe('real transcendentals with independent rational references', () => {
  test('pi literal bracket independently follows rational Machin remainder bounds', () => {
    contains(REAL_PI, references.piExpected);
    expect(width(REAL_PI)).toBeLessThan(1e-15);
    expect(Object.isFrozen(REAL_PI)).toBe(true);
  });
  for (const [index, vector] of references.vectors.entries()) {
    test(`exact-rational vector ${index}: ${vector.function}`, () => {
      let result: Enclosure;
      if (vector.function === 'voice') {
        result = voiceRange({ ...vector.voice, origin: interval(vector.voice.onset) }, vector.time);
      } else {
        const fn = vector.function === 'sine' ? sineRange : vector.function === 'exp' ? exponentialRange : tanhRange;
        result = fn(interval(vector.input));
      }
      contains(result.range, vector.expected);
      expect(result.conservativeFallbacks).toEqual([]);
      expect(width(result.range)).toBeLessThan(1e-10);
      expect(result.realAnalyticModel).toBe(true);
      expect(result.javascriptMathAccuracyCertified).toBe(false);
    });
  }
  test('turning points and a continuous off-grid support are enclosed', () => {
    contains(sineRange(divide(REAL_PI, interval(2))).range, [1, 1]);
    contains(sineRange(multiply(REAL_PI, interval(-.5))).range, [-1, -1]);
    const range = sineRange(interval(.123456789, 1.23456789)).range;
    for (const vector of references.vectors.filter((v: any) => v.function === 'sine' && [.123456789, 1.23456789].includes(v.input))) contains(range, vector.expected);
    contains(sineRange(interval(-Number.MIN_VALUE, Number.MIN_VALUE)).range, [-Number.MIN_VALUE, Number.MIN_VALUE]);
  });
  test('wide and unsupported arguments retain broad reasons, never grid certification', () => {
    for (const input of [interval(-10, 10), interval(1e100), interval(-Infinity, Infinity)]) {
      const result = sineRange(input); expect(result.range).toEqual(interval(-1, 1)); expect(result.conservativeFallbacks.length).toBeGreaterThan(0);
    }
    const exp = exponentialRange(interval(-65, -64)); expect(exp.range).toEqual(interval(0, Infinity)); expect(exp.conservativeFallbacks.length).toBeGreaterThan(0);
    const saturation = tanhRange(interval(32, 100)); expect(saturation.range).toEqual(interval(nextDown(1), 1));
    expect(tanhRange(interval(-100, -32)).range).toEqual(interval(-1, nextUp(-1)));
    contains(tanhRange(interval(-Infinity, Infinity)).range, [-1, 1]);
  });
});

describe('supplied fixed-ownership branch, not an ownership proof', () => {
  test('onset/end and attack/release branches retain the zero alternative', () => {
    expect(voiceRange(base, -.01).range).toEqual(interval(0));
    expect(voiceRange(base, .7).range).toEqual(interval(0));
    contains(voiceRange(base, 0).range, [0, 0]);
    contains(voiceRange({ ...base, origin: interval(-.001, .001) }, 0).range, [0, 0]);
    contains(voiceRange({ ...base, origin: interval(-.001, .001) }, .6).range, [0, 0]);
    // Exact zero-frequency sine is zero through the attack and short-duration release transition.
    contains(voiceRange({ ...base, frequency: 0, duration: .001 }, .0005).range, [0, 0]);
    expect(voiceRange(base, .002).conservativeFallbacks).toEqual([]);
    expect(voiceRange(base, .58).conservativeFallbacks).toEqual([]);
  });
  test('noise/sample-index and triangle alternatives are explicitly unresolved', () => {
    for (const kind of ['hat', 'snare', 'triangle'] as const) {
      const result = voiceRange({ ...base, kind, origin: interval(-1 / 48000, 1 / 48000) }, .001);
      contains(result.range, [0, 0]); expect(result.conservativeFallbacks.length).toBe(1);
      expect(result.conservativeFallbacks[0]).toMatch(/unsupported/);
    }
  });
  test('bounded mixture and rejection of unsupported resources/parameters', () => {
    const many = fixedMixtureRange(Array.from({ length: 64 }, () => base), .001, 1);
    expect(many.range.lo).toBeGreaterThan(-.99); expect(many.range.hi).toBeLessThan(.99);
    contains(fixedMixtureRange([], 0, 1).range, [0, 0]);
    expect(() => fixedMixtureRange(Array.from({ length: 65 }, () => base), 0, 1)).toThrow();
    expect(() => fixedMixtureRange([], NaN, 1)).toThrow();
    expect(() => fixedMixtureRange([], 0, 2)).toThrow();
    expect(() => voiceRange({ ...base, duration: 0 }, 0)).toThrow();
    expect(() => voiceRange({ ...base, level: -1 }, 0)).toThrow();
  });
});
