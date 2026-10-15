import { assignOwnership, renderOracle, type OracleVoice, type OracleGroup } from './mixture-timing-oracle';

export interface FitWindow {
  firstFrame: number; pcm: Float32Array; sampleRate: number; volume: number;
  routeUncertaintyMs: number; toleranceRms: number;
  /** Independently logged first transport emission, never fitted from PCM. */
  transportEpochFrame: number;
  searchMs?: number; stepSamples?: number;
}

function difference(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || !a.length) throw Error('Empty or inconsistent PCM comparison');
  let square = 0;
  for (let i = 0; i < a.length; i++) {
    if (!Number.isFinite(a[i]) || !Number.isFinite(b[i])) throw Error('Nonfinite PCM comparison');
    square += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(square / a.length);
}

/** Model-family evaluation, not peak matching or a product-delay calibration. */
export function fitGroup(voices: readonly OracleVoice[], group: OracleGroup, window: FitWindow) {
  const {firstFrame, pcm, sampleRate: rate, volume, toleranceRms: tolerance} = window;
  const searchMs = window.searchMs ?? 20, step = window.stepSamples ?? 24;
  if (!group.voices.length || !Number.isFinite(group.onset) || !pcm.length || !Number.isFinite(rate) || rate <= 0 || !Number.isInteger(firstFrame) || !Number.isFinite(tolerance) || tolerance <= 0 || !Number.isFinite(window.routeUncertaintyMs) || window.routeUncertaintyMs < 0 || !Number.isFinite(searchMs) || searchMs <= 0 || !Number.isInteger(step) || step < 1) throw Error('Invalid entrance fitting inputs');
  if (!Number.isInteger(window.transportEpochFrame)) throw Error('Missing independently declared transport epoch');
  const coversEntrance = firstFrame / rate <= group.onset - searchMs / 1000 - .002 && (firstFrame + pcm.length) / rate >= group.onset + searchMs / 1000 + .004;
  if (!coversEntrance) throw Error('Window must include pre-onset mixture and attack; tails alone cannot identify an entrance');
  const sequences = new Set(group.voices.map(v => v.sequence));
  if (sequences.size !== group.voices.length || group.voices.some(v => !voices.some(x => x.sequence === v.sequence && x.onset === v.onset))) throw Error('Group is not uniquely bound to this oracle');
  const epochFrame = window.transportEpochFrame;
  const render = (rows: readonly OracleVoice[]) => renderOracle(assignOwnership(rows, rate), firstFrame, pcm.length, rate, volume);
  const nominal = render(voices), omitted = voices.filter(v => !sequences.has(v.sequence));
  const missing = render(omitted), missingRms = difference(pcm, missing);
  const highestSequence = Math.max(...voices.map(v => v.sequence));
  const duplicate = render([...voices, ...group.voices.map((v, index) => ({...v, sequence: highestSequence + index + 1}))]);
  const duplicateRms = difference(pcm, duplicate);
  const entrance = (rows: readonly OracleVoice[]) => {
    const owned = assignOwnership(rows, rate).filter(v => sequences.has(v.sequence));
    const starts = owned.filter(v => v.removedFrame > Math.max(v.admittedFrame, Math.floor(v.onset * rate) + 1))
      .map(v => Math.max(v.onset, v.admittedFrame / rate));
    return starts.length ? (Math.min(...starts) - group.onset) * 1000 : null;
  };
  const profile: {family: 'translated-origin' | 'late-insertion'; shiftSamples: number; entranceErrorMs: number | null; rms: number; searchEdge: boolean}[] = [];
  const radius = Math.ceil(searchMs * rate / 1000 / step);
  for (let index = -radius; index <= radius; index++) {
    const shiftSamples = index * step, delta = shiftSamples / rate;
    const changed = voices.map(v => !sequences.has(v.sequence) ? v : {...v, onset: v.onset + delta,
      admittedFrame: Math.max(epochFrame, (Math.ceil(((v.onset + delta) * rate - 1e-7) / 128) - 1) * 128)});
    profile.push({family: 'translated-origin', shiftSamples, entranceErrorMs: entrance(changed), rms: difference(pcm, render(changed)), searchEdge: Math.abs(index) === radius});
    if (index >= 0) {
      // Preserve nominal phase/envelope while withholding entry. A late start
      // need not translate the later waveform; test the missing attack itself.
      const admission = index === 0 ? group.voices[0].admittedFrame : Math.ceil((group.onset * rate + shiftSamples) / 128) * 128;
      const delayed = voices.map(v => !sequences.has(v.sequence) ? v : {...v, admittedFrame: Math.max(v.admittedFrame, admission)});
      profile.push({family: 'late-insertion', shiftSamples, entranceErrorMs: entrance(delayed), rms: difference(pcm, render(delayed)), searchEdge: index === radius});
    }
  }
  const plausible = profile.filter(row => row.rms <= tolerance);
  const best = [...profile].sort((a, b) => a.rms - b.rms)[0];
  const missingExcluded = missingRms > tolerance, duplicateExcluded = duplicateRms > tolerance;
  const identified = missingExcluded && plausible.length > 0 && plausible.every(row => row.entranceErrorMs !== null);
  const searchBoundaryTouched = plausible.some(row => row.searchEdge);
  const bounds = identified ? [Math.min(...plausible.map(row => row.entranceErrorMs!)), Math.max(...plausible.map(row => row.entranceErrorMs!))] : null;
  // Half-step padding bounds only the sampled hypotheses. It does not prove
  // exclusion between samples or beyond the searched interval.
  const sampledFamilyAbsErrorBoundMs = bounds ? Math.max(...bounds.map(Math.abs)) + window.routeUncertaintyMs + step * 500 / rate : null;
  return {onset: group.onset, logicalVoices: group.voices.length, window: {firstFrame, samples: pcm.length, sampleRate: rate},
    scope: 'One audible group; no PCM identity or erased-voice claim', nominalRms: difference(pcm, nominal),
    missingRms, duplicateRms, missingExcluded, duplicateExcluded, audibleContrastRms: difference(nominal, missing),
    identified, searchBoundaryTouched, entranceErrorBoundsMs: bounds, sampledFamilyAbsErrorBoundMs, best, plausible, profile,
    sampledFamilyWithin20Ms: !searchBoundaryTouched && sampledFamilyAbsErrorBoundMs !== null && sampledFamilyAbsErrorBoundMs <= 20,
    qualificationPassed: false,
    qualificationLimit: 'Finite model-family search only; independent capture/calibration and exclusion outside the search interval remain required',
    // Logical duplicate evidence must be supplied independently if this mono
    // counterfactual is indistinguishable. Never count it as a PCM proof.
    pcmDuplicateExclusionQualified: duplicateExcluded};
}
