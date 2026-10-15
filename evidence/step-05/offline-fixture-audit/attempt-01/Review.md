# Bongo Planet — offline fixture onset audit

The actual six-second offline renders pass the scoped chord, phrase and overlapping-voice checks (S05-A3, S05-A4, S05-A6). This is numerical offline evidence; live output timing and human acceptance remain open.

Each original fixture was rendered at 48 kHz from a fixed zero origin. Explicit fixture periods, delays and pitches feed an independent scalar sine/kick waveform model; expected timings do not come from the engine's receipts. Every original full mix contains 288,000 finite samples. Full-mix RMS differences are 6.99e-15 (F02), 2.17e-13 (F03) and 1.12e-13 (F04), without fitting a time offset.

Clearly labeled isolated variants mute other targets and disable other generators solely to measure entrances. All 39 entrances occur two samples (0.041667 ms) after the explicit expected onset. F02 chord members have zero measured spread, and F03 phrase entrances retain their distinct expected order. The separately validated original F04 mix preserves overlapping voices with zero stealing and a maximum of six allocated voices, matching independent enumeration. Its audible interval peak is five: a future voice is admitted in the block before a previous voice expires, so allocation and audible interval peaks differ.

[Report](report.json), [audit source](../../../../scripts/offline-fixture-onset-audit.ts) and [independent readback](Independent-Review.md) retain the source/fixture/raw-PCM bindings and the measurement limits. Original raw PCM and WAV files remain local. These artifacts were created after the archived candidate's source snapshot and are not included in that existing archive.
