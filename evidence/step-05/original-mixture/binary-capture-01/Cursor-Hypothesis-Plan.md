# Bongo Planet — cursor arithmetic hypothesis

Source preparation only. No diagnostic has run.

This small read-only diagnostic tests one declared mechanism at the sixteen already retained F06 discrepancy samples. Starting at the first observer clock, it advances a hypothetical block cursor with `max(raw, previousEnd)` then `+128/48000`. This block-only hypothesis omits the production clock floor's independent engine/command state. Initial processor history before observer admission is unknown; this initial state is explicitly assumed, never selected from PCM. The helper uses unchanged analytic ownership and waveform equations, evaluates them at the hypothetical sample time, and compares both predictions with the exact original raw sample. It binds the audited metadata/raw files, prior immutable results and captured processor source. It does not import the production processor or synth.

Command after source review and separate execution GO:

```sh
npx tsx scripts/mixture-cursor-hypothesis.ts evidence/step-05/original-mixture/binary-capture-01
```

It creates only a new `cursor-hypothesis.json`, refusing overwrite. Cooperative bounds are 30 seconds and 256 MiB, including a final detected-bound check; the complete metadata stream and exactly sixteen F06 samples are required for a completed result. These samples were selected by largest baseline error, so this is a selected diagnostic subset. No offset, initial state, emission, sample or threshold is fitted or altered. A closer waveform prediction would support this numerical hypothesis without uniquely proving causality. It cannot replace the original fixed-epoch comparison, identify acoustic onsets, qualify a timing gate or justify a production change by itself.
