# Bongo Planet — fixed production audio clock, five-minute validation

The uninstrumented production capture observed five repeated-clock/recovery pairs without a repeated nonconstant PCM block on either path. This is bounded efficacy evidence for the render-cursor fix. It is not a thirty-minute acceptance result, an onset-timing qualification, or human listening approval.

## Execution and binding

Command: `npx tsx scripts/audio-clock-validation.ts --seconds 300 --output evidence/step-10/audio-clock-validation/attempt-01`.

The actual monotonic timer started **2026-10-11 20:16:21.798 UTC**, ran **300.544731333 seconds**, and cleanup finished **20:21:22.817 UTC**. Installed Chrome **155.0.8059.39** ran unmuted. The test-only immutable client was served at `http://127.0.0.1:5420/BongoPlanet/`; the permanent project URL remains `http://127.0.0.1:5417/BongoPlanet/`.

Frozen client main `index-3J-yL5Nu.js` SHA256: `3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207`.

Frozen, uninstrumented processor `processor-DjdrVTs8.js` SHA256: `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`.

The actual HTTP HTML/main/processor bytes were verified before and after capture, with identical hashes. The retained snapshot contains only this client's index, icon, assets and fixtures. Git HEAD metadata was `a9a5401a9bb44e0cd351ddcd525292e4be9768f5`; compiled hashes and captured individual source hashes bind this candidate directly, without claiming the working tree was that committed revision. The captured harness SHA256 is `28a934ec2106300ba0c253b03a9281a754b76fdf580448985d9b807cc27bc2dc`.

## Actual measurement

The exact named **SPAT 8ch loopback (Virtual)** output and input were selected by device ID. The input track identity was checked. No default or ambient microphone was opened; the test changed only its AudioContext sink, not system defaults.

The production worklet remained connected to its normal output destination. A parallel tap fed observer input0; the named virtual input fed observer input1 in the same AudioContext. Observer output was silence, preventing doubled audio. One observer retained per-quantum monotonic block indices, actual input/output lengths, `currentFrame`, `currentTime`, and untouched mono Float32 samples from both paths. Original order was preserved. There was no processor instrumentation, fake PCM, timestamp repair, resampling or sample deletion/insertion.

Twelve native AudioBufferSource calibration clicks bypassed the production tap and were scheduled before product playback. All twelve actual input detections agreed on **640 samples / 13.333333333 ms** fixed route lag, within fractional-sample roundoff. This calibration did not fit product onsets.

Original F06 ran with nine validated edits at thirty-second intervals: alternate 120/121 BPM, swap n4/n5 vertices, and change n4 degree. All sampled runtime states, including the final state, remained running with 64 voices; late, audio-late and telemetry-drop counts were zero. The final stolen-voice count was 213,574. Recorder backlog peaked at two batches and drained to zero.

## Results

| Observation | Actual result |
|---|---:|
| Retained observer blocks | 115,008, all 128 samples |
| Raw samples per path | 14,721,024 |
| Raw bytes per path | 58,884,096 |
| Nonfinite samples | 0 |
| Peak magnitude per path | 0.9800000190734863 |
| Repeated-clock/recovery groups | 5; ten frame-step anomalies |
| Nonconstant adjacent byte-identical blocks, product/input | 0 / 0 |
| Timed blocks compared at independent native lag | 112,704 / 112,704 |
| Exactly matching timed source/input samples | 14,426,112 |
| Timed source/input byte mismatches | 0 |
| Actual all-zero input blocks | 6; every one matches source silence five blocks earlier |

Every repeated-clock source block differs from its preceding actual source block. The five clock-group windows and their original raw samples are retained as `clock-1` through `clock-5` artifacts. Frame-step events occur approximately 138.885, 164.667, 173.469, 187.467 and 207.531 seconds into the timed run. No double-repeat group occurred in this live capture; repeated twice/recovery behavior is covered by the separate processor regression tests.

The six all-zero input blocks are not unexplained inserted-route silence: read-only analysis confirms each is byte-identical to the source silence at the independently calibrated 640-sample lag. No additional route shift appeared in this timed interval. This does not erase or explain away the earlier native-control inserted-zero/128-sample-shift observation.

Retained coverage spans context time **0.714666667 through 307.402666667 seconds**, including the entire declared timer interval **6.741333333 through 307.285333333**. A 150 ms capture tail followed the timed window. Metadata sample totals exactly match raw-file sample totals, independent block indices remain ordered, and retained progress was checked during capture. All timed blocks participate in comparison; zero mismatches does not mean an empty comparison.

## Artifacts and limits

`report.json` contains setup, asset attestations, native calibration, runtime snapshots, edits, coverage and counts. `quantums.jsonl` retains original metadata. `product-tap.f32` and `virtual-input.f32` are authoritative untouched raw data; the corresponding Float32 WAVs contain the same sample bytes. `post-capture-analysis.cjs/json` documents read-only clock-window and zero-input analysis.

Product raw SHA256: `4213df9b1f082f86ac8c5c2d3eba88f76b646b06b2b5035b8698a4e640b98dd6`.

Virtual input raw SHA256: `c32f5cfad01d6e240e290881003850d68811af77bc921e0970ecb97a1a52d2b9`.

Cleanup confirmed context closed, all input tracks ended, pending retention zero, browser closed and test server closed. Errors were empty and all capture guards passed. The shared observer clock is not an instrumented read of the processor's internal clock expression; the earlier separately instrumented production-entry investigation establishes the original causal mechanism. This capture tests the uninstrumented fix under five actual observer clock anomalies. It cannot establish universal absence of faults, exact individual dense onset timing, thirty-minute continuity, physical-speaker playback or human approval. `acceptancePassed` remains **false**.
