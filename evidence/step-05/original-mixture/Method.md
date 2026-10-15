# Bongo Planet — original mixture measurement preparation

This work does not pass a live timing gate. The independent model and analyzer are diagnostic tools; every analyzer result explicitly retains `qualificationPassed: false`.

`scripts/mixture-timing-oracle.ts` imports no engine, synthesizer or geometry implementation. It derives original major-scale pitches, great-circle travel, quantization, generator emission order and64-voice ownership from unchanged fixtures and the retained topology vectors. It renders the full sine/kick mixture through the declared forward saturation, without inverting saturated PCM or changing voices to make detection easier.

The first transport emission supplies a declared epoch. It is never fitted to product PCM. A future capture must retain that logical provenance separately from measured audio and independently calculate every later expected group. Native direct-buffer clicks before and after playback establish the fixed route offset and its stability; the production worklet is excluded from those calibration clicks.

## Completed checks

The15 counterexample tests in `analysis-unit-attempt03.json` pass. They include hand-derived5/10/20ms shifted starts, unchanged-phase late insertion, missing and doubled groups, transport-clamped admission, an off-grid10.3ms start, whole-period aliases beyond20ms, a saturated64-voice duplicate batch, erased starts and identity substitution. Typecheck also passes. The truth samples for fitting tests are calculated directly from declared sine/envelope equations, rather than the production synth or oracle renderer.

The retained two-second original F06/F08 windows match the independent forward model almost exactly: F06 RMS difference2.17e-12 and F08 RMS difference1.33e-9. See `retained-feasibility-1791750663561/report.json`. These are old-candidate windows with product-derived calibration and a freely searched lag. They establish model fidelity only; they do not establish absolute timing, full-window coverage or the repaired candidate's performance.

A fresh run of the frozen oracle at20:50UTC produced the same predicted raw hashes and numerical differences; `retained-feasibility-1791751833580/report.json` binds the current oracle SHA82a90a52. The earlier source binding and report remain preserved. The fresh run still compares old recordings and still does not qualify absolute timing.

## Required interpretation

- A profile includes translated phase/origin and late insertion with unchanged later phase. Fitting phase alone would miss a withheld attack.
- Every candidate recomputes ownership. Actual modeled entrance is the later of phase origin and admission, provided the voice survives to sound. The analyzer rejects windows without pre-onset and attack coverage.
- Missing and whole-group duplicate alternatives remain explicit. Identical IDs do not have distinct mono waveforms. A duplicate batch can evict the original batch while producing identical PCM.
- Original F06 erases182 new voices before sound per cycle; original F08 erases470. Those starts are retained as logical provenance, never counted as measured audible onsets.
- `sampledFamilyAbsErrorBoundMs` and `sampledFamilyWithin20Ms` describe only the sampled model family. Plausible search endpoints prevent even that conditional20ms result. Discrete sampling and half-step padding do not establish exclusion between samples or outside the search range.
- Full qualification still needs an expanded/refined ambiguity analysis, independently bound calibration and epoch, all original segment windows, at least120 actual identifiable groups, deliberate scheduling stalls and a real product-only100ms delay negative control. Unidentified, saturated, erased or identity-ambiguous observations cannot silently become successful individual arrivals.

No raw PCM is repaired, recentered, resampled, reordered or deleted. Safari, physical listening, and the complete original-mixture timing gate remain open.
