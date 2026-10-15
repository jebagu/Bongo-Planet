# Bongo Planet — independent review of the recorded sample anomaly

Reviewed 2026-10-11 during the final soak. This is a narrow read-only inspection of already-written capture data, not a final 30-minute acceptance review. No browser, audio, network or timing probe was launched. The active capture, its timestamps and worker reports were not modified.

## Observation

The [sample-clock report](sample-clock-anomalies.json) records a −128/+128-sample pair between chunks 16142→16143→16144 near context time 689 seconds, despite recorder timestamps originating from integer `currentFrame`. The [worker PCM inspection](anomaly-pcm-inspection.json) identifies adjacent equal 128-sample blocks at raw sample offsets **33,061,376** and **33,061,504**.

An independent seek/read of only raw samples `[33,056,768, 33,069,056)` — 49,152 bytes, 96 blocks — confirms their byte-for-byte equality. Both blocks have SHA-256 `0dc0c4668da32728838d7f58f83da4ab62ee8f0d348ae6a3ec104abb5f7f598b`.

The repeated block is not constant saturation:

- It contains **52 distinct Float32 values**. Only 72 of 128 samples equal the absolute peak; 44 samples are at least `1e-6` below that peak in magnitude.
- It contains 117 negative and 11 positive samples. The transition crosses zero at offset 117, from `−0.0068242345` to `+0.2105716765`, then reaches `+0.9660597444` at its final sample.
- The entire nonlinear transition repeats exactly, together with the saturated portion. Its RMS is **0.9455654337**, and its peak is **0.9800000191**.
- Repeating the block creates a `+0.9660597444 → −0.9800000191` boundary step of **−1.9460597634** in the retained PCM.
- This is the only adjacent exact duplicate in the inspected 96-block window. The neighboring blocks differ, so that window does not exhibit a persistent 128-sample repeating waveform.

The duplicate begins 640 raw samples into chunk 16143, the same 2048-sample chunk with the displaced header. Each 128-sample block represents **2.666667 ms** at 48 kHz. These are localization facts, not a causal attribution.

## Interpretation and acceptance scope

The duplicated nonconstant transition is stronger evidence than equal headers, nonzero samples, or a flat saturated plateau alone. Saturation does not explain the exact repetition of dozens of interior values and the zero crossing. The local neighbors also do not support dismissing this as ordinary stationary 128-sample periodicity.

Nevertheless, these observations do **not** identify whether the repetition arose in the product's audio generation, browser/audio-clock processing, virtual output device, input capture path, or another shared component. They do not independently prove that a listener heard a defect. A simultaneous independently timestamped product-output tap and virtual-input recording would help distinguish those paths in a later diagnostic; none was added during this run.

Accordingly, **sample-continuous recording and seamless actual-output claims remain unqualified**. A completed wall-clock timer, bounded queues/voices, and no JavaScript errors can remain separately reportable observations. They cannot cancel this waveform/timestamp anomaly. Do not repair the evidence by deleting the repeated block, shifting its timestamp, or counting only unaffected audio. The worker's final whole-run review must retain the anomaly and its limits.

The supplied JSON records were also identified independently: sample-clock report SHA-256 `df7c918c1fc9b00b2141a38a0c86168e8b6c200baef000a128508844badea7ee`; worker PCM-inspection report SHA-256 `39ad8d523b0332e24d0bb8b573c2573947c16e03d1f48d85e4441c00633aabae`. The growing whole-run PCM file was not hashed or scanned by this reviewer.
