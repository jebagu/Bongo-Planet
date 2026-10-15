# Bongo Planet — full-window cursor hypothesis plan

Source preparation only. This extends the declared block recurrence from the sixteen postselected F06 samples to all 6,144,384 original positive-window samples. The sample result motivates the extension, so this is a diagnostic follow-up rather than an independent pre-acquisition hypothesis. It creates a new result and preserves all earlier failures.

The recurrence is fixed: seed the first raw observer time, then `start=max(raw, previousEnd)` and `previousEnd=start+128/48000`. Unknown earlier processor history and the omitted engine/command clock floor remain explicit. The unchanged independent oracle supplies logical voices and analytic ownership; only waveform sample time becomes `blockStart+withinBlock/48000`. Original admission and removal remain fixed. No initial-state search, fitted onset, offset, sample repair, resampling or production change is included.

The helper binds the independent audit, exact full metadata/raw files, captured processor, topology and unchanged oracle. It verifies each unchanged nominal oracle window and actual raw window against the prior full-fidelity hashes before comparing the declared hypothesis. All four original positive windows are required; the negative control stays in its previous immutable analysis, since this scope concerns numerical arithmetic only. Acoustic identification, alternate onset families and missing/duplicate ambiguity are not evaluated.

Prepare with typecheck and source-only arithmetic/removal/comparison controls. After independent source review and root GO, run once:

```sh
npx tsx scripts/mixture-cursor-full-hypothesis.ts evidence/step-05/original-mixture/binary-capture-01
```

This exclusively creates `cursor-full-hypothesis.json`. Cooperative 120-second and 256 MiB limits include final failure checks; a failure preserves its prefix without automatic retry or budget increase. Full-window agreement can support the numerical mechanism, but does not uniquely prove causality, qualify acoustic onsets, replace original strict failures or justify a production change on its own.
