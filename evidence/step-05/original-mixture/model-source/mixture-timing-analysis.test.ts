import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import type { Scene } from '../src/core/contracts';
import { fixtureOracle, onsetGroups, renderOracle, scalarVoice, erasedBeforeSound } from '../scripts/mixture-timing-oracle';
import { fitGroup } from '../scripts/mixture-timing-analyze';

const vertices = JSON.parse(fs.readFileSync('evidence/step-02/topology.json', 'utf8')).vertices as number[][];
const fixture = (id: string) => JSON.parse(fs.readFileSync(`public/fixtures/${id}.json`, 'utf8')) as Scene;

describe('independent original mixture oracle', () => {
  it('derives the three C-major chord pitches and two-second recurrence', () => {
    const voices = fixtureOracle(fixture('F02'), vertices, 0, 4);
    expect(onsetGroups(voices).map(g => g.voices.length)).toEqual([3, 3]);
    expect(voices.slice(0, 3).map(v => v.frequency).sort((a, b) => a - b)).toEqual([261.6255653005986, 329.6275569128699, 391.99543598174927]);
    expect(voices[3].onset - voices[0].onset).toBeCloseTo(2, 12);
  });
  it('retains the unchanged dense batches and starts erased before any sound', () => {
    for (const [id, seconds, counts, erased] of [['F06', .5, [16, 152, 158, 26], 182], ['F08', 1 / 3, [20, 284, 314, 54], 470]] as const) {
      const voices = fixtureOracle(fixture(id), vertices, 0, seconds);
      expect(onsetGroups(voices).map(g => g.voices.length)).toEqual([...counts]);
      expect(voices.filter(v => erasedBeforeSound(v)).length).toBe(erased);
      const doomed = voices.find(v => erasedBeforeSound(v))!;
      expect(renderOracle([doomed], 0, 24000).every(v => v === 0)).toBe(true);
    }
  });
  it('checks an independent quarter-cycle sine amplitude and forward saturation', () => {
    const voice = {onset: 0, kind: 'sine' as const, frequency: 100, duration: 1, level: .5};
    expect(scalarVoice(voice, .0025)).toBeCloseTo(.09, 14);
    expect(scalarVoice(voice, 0)).toBe(0);
    const populated = {...voice, sequence: 1, generatorId: 'g', nodeId: 'n', admittedFrame: 0, removedFrame: Infinity};
    expect(renderOracle([populated], 120, 1)[0]).toBeCloseTo(.98 * Math.tanh(.09 * .65), 7);
  });
  it('does not pretend an identical sine/kick waveform contains an identity', () => {
    const voices = fixtureOracle(fixture('F02'), vertices, 0, 2);
    const renamed = voices.map(v => ({...v, nodeId: 'different-' + v.nodeId, generatorId: 'other'}));
    expect(renderOracle(voices, 0, 24000)).toEqual(renderOracle(renamed, 0, 24000));
  });
  it('rejects unsupported mixtures and empty/nonfinite intervals', () => {
    expect(() => fixtureOracle(fixture('F06'), vertices, 0, 0)).toThrow();
    const altered = fixture('F02'); (altered.pieces[1] as any).timbre = 'triangle';
    expect(() => fixtureOracle(altered, vertices, 0, 2)).toThrow();
    expect(() => renderOracle([], 0, 0)).toThrow();
  });
});

describe('entrance timing model counterexamples', () => {
  const rate = 48000;
  const voice = {sequence: 1, generatorId: 'g', nodeId: 'n', onset: .025, kind: 'sine' as const, frequency: 73, duration: .08, level: .6, admittedFrame: 1152, removedFrame: Infinity};
  // Hand-derived known-time data; neither the production synth nor the oracle
  // renderer generates these positive/negative truth samples.
  const truth = (translation: number, gate: number, copies = 1) => Float32Array.from({length: 4800}, (_, frame) => {
    const time = frame / rate, age = time - .025 - translation;
    if (time < gate || age <= 0 || age >= .08) return 0;
    const fade = Math.min(age / .002, 1) * Math.min((.08 - age) / .02, 1);
    return .98 * Math.tanh(copies * .108 * Math.sin(age * 146 * Math.PI) * fade * .65);
  });
  const fit = (pcm: Float32Array) => fitGroup([voice], {onset: .025, voices: [voice]}, {firstFrame: 0, pcm, sampleRate: rate, volume: .65, routeUncertaintyMs: .02, toleranceRms: 1e-6, transportEpochFrame: 0, stepSamples: 48});

  it('measures known5/10/20ms translations without recentering them', () => {
    for (const delay of [.005, .010, .020]) {
      const result = fit(truth(delay, 0));
      expect(result.identified).toBe(true);
      expect(result.best.family).toBe('translated-origin');
      expect(result.best.entranceErrorMs).toBeCloseTo(delay * 1000, 8);
      for (const bound of result.entranceErrorBoundsMs!) expect(bound).toBeCloseTo(delay * 1000, 8);
      expect(result.qualificationPassed).toBe(false);
    }
  });
  it('detects a missing attack despite unchanged later phase', () => {
    const gate = 1664 / rate; // Actual later quantum:9.6667ms after nominal.
    const result = fit(truth(0, gate));
    expect(result.identified).toBe(true);
    expect(result.best.family).toBe('late-insertion');
    expect(result.best.entranceErrorMs).toBeCloseTo(9.6666666667, 7);
    expect(result.entranceErrorBoundsMs![0]).toBeGreaterThan(9);
  });
  it('does not return zero timing error for a missing group', () => {
    const result = fit(new Float32Array(4800));
    expect(result.missingExcluded).toBe(false);
    expect(result.identified).toBe(false);
    expect(result.sampledFamilyAbsErrorBoundMs).toBeNull();
    expect(result.sampledFamilyWithin20Ms).toBe(false);
  });
  it('recognizes a distinguishable doubled group as an alternate model', () => {
    const result = fit(truth(0, 0, 2));
    expect(result.duplicateExcluded).toBe(false);
    expect(result.pcmDuplicateExclusionQualified).toBe(false);
    expect(result.identified).toBe(false);
  });
  it('rejects tail-only and nonfinite recording data', () => {
    expect(() => fitGroup([voice], {onset: .025, voices: [voice]}, {firstFrame: 2400, pcm: new Float32Array(4800), sampleRate: rate, volume: .65, routeUncertaintyMs: 0, toleranceRms: 1e-6, transportEpochFrame: 0})).toThrow('tails');
    const data = truth(0, 0); data[100] = NaN;
    expect(() => fit(data)).toThrow('Nonfinite');
  });
  it('does not qualify a plausible translation at the search boundary', () => {
    const result = fit(truth(.020, 0));
    expect(result.searchBoundaryTouched).toBe(true);
    expect(result.sampledFamilyWithin20Ms).toBe(false);
  });
  it('measures transport-clamped entrance separately from shifted phase', () => {
    const clamped = {...voice, admittedFrame: 1440};
    const result = fitGroup([clamped], {onset: voice.onset, voices: [clamped]}, {
      firstFrame: 0, pcm: truth(-.005, .030), sampleRate: rate, volume: .65,
      routeUncertaintyMs: .02, toleranceRms: 1e-6, transportEpochFrame: 1440, stepSamples: 48});
    expect(result.best.shiftSamples).toBe(-240);
    expect(result.best.entranceErrorMs).toBeCloseTo(5, 8);
  });
  it('retains ambiguity when a whole duplicate batch leaves the same64 voices', () => {
    const batch = Array.from({length: 64}, (_, i) => ({...voice, sequence: i + 1}));
    const result = fitGroup(batch, {onset: voice.onset, voices: batch}, {
      firstFrame: 0, pcm: truth(0, 0, 64), sampleRate: rate, volume: .65,
      routeUncertaintyMs: .02, toleranceRms: 1e-6, transportEpochFrame: 0, stepSamples: 48});
    expect(result.missingExcluded).toBe(true);
    expect(result.duplicateRms).toBeLessThan(1e-6);
    expect(result.pcmDuplicateExclusionQualified).toBe(false);
    expect(result.qualificationPassed).toBe(false);
  });
  it('does not qualify a narrow search that misses an off-grid actual start', () => {
    const result = fit(truth(.0103, 0));
    expect(result.identified).toBe(false);
    expect(result.qualificationPassed).toBe(false);
  });
  it('preserves whole-period aliases when the entrance contrast is too weak', () => {
    const periodic = {...voice, onset: .05, frequency: 100, duration: 1};
    const pcm = Float32Array.from({length: 24000}, (_, frame) => {
      const age = frame / rate - .05;
      return age <= 0 ? 0 : .98 * Math.tanh(.108 * Math.sin(age * 200 * Math.PI) * Math.min(age / .002, 1) * .65);
    });
    const result = fitGroup([periodic], {onset: .05, voices: [periodic]}, {
      firstFrame: 0, pcm, sampleRate: rate, volume: .65, routeUncertaintyMs: 0,
      toleranceRms: .015, transportEpochFrame: 0, searchMs: 40, stepSamples: 48});
    expect(result.plausible.some(row => Math.abs(row.entranceErrorMs ?? 0) >= 30)).toBe(true);
    expect(result.sampledFamilyWithin20Ms).toBe(false);
    expect(result.qualificationPassed).toBe(false);
  });
});
