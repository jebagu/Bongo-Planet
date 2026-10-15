# Bongo Planet — fixed production audio clock, thirty-minute observation

The full uninstrumented run completed **1800.146166417 actual monotonic seconds** with fifty-nine validated edits. It recorded twenty-eight repeated-clock/recovery pairs without a repeated nonconstant PCM block on either path. Every timed source/input sample compared at the independently measured native route lag matched exactly. These are observed results for this frozen build and route; `acceptancePassed` remains **false** until the lead reconciles the applicable checks. No human listening, independent dense onset-timing, physical-speaker or venue approval is claimed.

## Execution and frozen build

Command: `npx tsx scripts/audio-clock-validation.ts --seconds 1800 --output evidence/step-10/audio-clock-validation/attempt-02-30-minute`.

The timer started **2026-10-11 20:24:11.882 UTC**. Its declared thirty-minute window completed without restart; capture tail and cleanup finished **20:54:12.566 UTC**. Installed Chrome **155.0.8059.39** ran unmuted against the client-only immutable snapshot at `http://127.0.0.1:5420/BongoPlanet/`. This was a test route; the permanent project URL remains `http://127.0.0.1:5417/BongoPlanet/`.

Frozen main `index-3J-yL5Nu.js` SHA256: `3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207`.

Frozen uninstrumented processor `processor-DjdrVTs8.js` SHA256: `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`.

Captured harness SHA256: `28a934ec2106300ba0c253b03a9281a754b76fdf580448985d9b807cc27bc2dc`, identical to the preceding five-minute run. Actual HTTP HTML/main/processor bytes were verified before and after capture; all corresponding hashes matched. The retained client snapshot excludes unrelated research assets. Git HEAD recorded at setup was `a9a5401a9bb44e0cd351ddcd525292e4be9768f5`; the exact compiled asset hashes and captured individual source hashes bind the frozen candidate without claiming the working tree was that committed revision. The lead committed the unchanged cursor/fatal-latch work during the run. That action did not restart this client, change its snapshot or mutate its audio source.

The lead declared concurrent documentation/pure-source work and a brief eighteen-case unit rerun. No parallel browser/audio probe or intentional host-load experiment ran during this capture. This is not a claim that the machine was otherwise idle.

## Actual topology and calibration

The exact named **SPAT 8ch loopback (Virtual)** input and output were selected by device ID; the actual input track identity was checked. No physical/default microphone was opened, no driver was installed, and system defaults were not changed. Only this AudioContext's output sink was selected.

The ordinary production worklet remained connected to its output destination. A parallel pre-device tap fed observer input0; the named virtual MediaStream fed observer input1 within the same AudioContext. Observer output was silence, avoiding doubled audio. The observer retained independent monotonic block indices, both actual input lengths/channel counts, output quantum length, `currentFrame`, `currentTime`, and original mono Float32 samples in original order.

Twelve native AudioBufferSource clicks scheduled before product playback bypassed the product tap and went directly to the same destination. All twelve independently detected input clicks agreed on **640 samples / 13.333333333 ms** route lag, within fractional-sample roundoff. No product onsets or product waveform were fitted to set the route constant. Native calibration was before the timed run; actual source/input byte comparison checks that same fixed relationship throughout the full timed interval.

Original F06 ran unchanged apart from the declared validated ordinary edits every thirty seconds: alternate 120/121 BPM, swap n4/n5 vertices, and cycle n4 degree. Fifty-nine edits completed. All sampled runtime states, including the final state, were running with 64 voices and zero late/audio-late/telemetry drops. Final pending was 184, trigger sequence 1,273,888 and stolen-voice count 1,273,640. Browser heap measurements and UI-object counts were not collected in this harness; this capture alone does not prove those requirements.

## Recorded observations

| Observation | Actual result |
|---|---:|
| Monotonic timed duration | 1800.146166417 s |
| Retained observer blocks | 677,344, all 128 samples |
| Retained raw samples per path | 86,700,032 |
| Retained raw bytes per path | 346,800,128 |
| Float32 WAV duration per path | 1806.250666667 s, including calibration/tail |
| Nonfinite samples | 0 |
| Peak magnitude per path | 0.9800000190734863 |
| Repeated-clock/recovery pairs | 28; fifty-six clock-step anomalies |
| Nonconstant adjacent byte-identical blocks, source/input | 0 / 0 |
| Timed blocks compared at native fixed lag | 675,056 / 675,056 |
| Timed source/input samples matching exactly | 86,407,168 |
| Timed source/input byte mismatches | 0 |
| All-zero actual input blocks | 30; all match source silence at fixed lag |
| Recorder backlog peak/final | 2 batches / 0 |
| Capture errors | 0 |

Every clock group is a single repeated `currentFrame` followed by the corresponding recovery step: frame-step errors -128 then +128. Every source block at a repeated-clock index differs from its preceding actual source block. Original local windows and metadata for all twenty-eight groups are retained as `clock-1` through `clock-28` artifacts. No double-repeat group occurred in this live run; double repeats are tested by the independent block-count processor regression.

All thirty zero input blocks are byte-identical to original source silence five blocks earlier at the native-measured 640-sample lag. There is no additional inserted zero, route-delay shift or byte mismatch in this timed interval. This does not erase the earlier native-control capture's inserted-zero/128-sample route-shift observation, nor prove such a route fault cannot recur.

The retained context coverage is **0.842666667 through 1807.093333333 seconds**, spanning the complete declared timer interval **6.837333333 through 1806.986666667 seconds**. A 150 ms tail followed the timed window. Raw lengths exactly equal metadata sample totals; independent indices remain ordered; recorder progress was checked through the final snapshot. All timed blocks participate in the calibrated comparison. The original `clockValidation.scope` text names the harness's five-minute default, while `requestedSeconds=1800`, actual elapsed duration and this report describe the explicit thirty-minute invocation.

## Preserved evidence and boundaries

`report.json` retains setup, before/after asset attestations, native calibration, edits, snapshots, coverage and counts. `quantums.jsonl` retains unmodified block metadata. `product-tap.f32` and `virtual-input.f32` are the untouched raw recordings. Their Float32 WAV counterparts contain identical sample bytes and provide listening artifacts. `post-capture-analysis.cjs/json` independently inspects the original clock windows and source-matched zero input blocks. No raw samples or timestamps were sorted, aligned destructively, repaired, inserted, deleted or resampled.

Product raw SHA256: `917aebed264db7f9be1b64af26f187052782df498f0d679288316264ab9df163`.

Virtual input raw SHA256: `38302bc413591dd4895551283d540a11ca9c3b3315b662ded91646cd424caf62`.

The lead independently streamed and re-audited the complete original recordings and metadata. [root-raw-audit.json](root-raw-audit.json) confirms all 677,344 indices, finite raw samples, twelve actual .3-amplitude native clicks at the 640-sample lag, whole timer coverage, all 86,407,168 timed sample matches, and zero nonconstant adjacent duplicates. Its auditor source SHA256 is `1ab535f2d43d2377730e4bbe581ada767ecc7eed8f98c480c8994f413bdeefd0`. The final recursive manifest includes that separate audit and all retained artifacts.

Cleanup confirms ended input tracks, closed AudioContext, drained retention, closed browser and closed test server. The shared observer timestamps are not instrumented reads of the processor's internal clock expression; the earlier production-entry diagnostic establishes the original repeated-clock causal mechanism. This uninstrumented run demonstrates absence of the repeated-block symptom across twenty-eight observed shared-clock pairs and exact source-to-virtual-input continuity for the full timed interval. It does not independently identify individual dense onsets, measure physical speaker output, demonstrate human listening approval, qualify untested external devices/venues or prove universal fault absence. Acceptance and human flags remain open for lead review.
