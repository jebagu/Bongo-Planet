# Bongo Planet metadata actual01 independent readback

Disposition: **confirmed failed/resource-unfinished observation, with useful conditional metadata results and an explicit unresolved frontier.** It is not a completed coupled-onset analysis, acoustic identification, or acceptance pass. No second helper execution, original JSONL/PCM/container scan, browser, service, or new acquisition was performed for this readback.

## Bound execution and inputs

| Retained artifact | Bytes | SHA256 |
|---|---:|---|
| `attempt-01/result.json` | 79,054 | `b99e16aefe6cfd7d9d981fde796909da68971805e4b06b87929b1bb3c96d7bf0` |
| `preparation/Root-Actual01-GO.json` | 8,939 | `60c265c92cb36bbe8a4eb95f7796b619660a3ee0f253df808d03635bc0b985f1` |
| `preparation/Root-Actual01-Controller.json` | 4,118 | `6398dc12c88e6ea116806e4cff454a0e763c38bfc9252ab20f7bb487857eaff1` |
| `preparation/Root-Actual01-Execution.log` | 328 | `1cf8d86498a8b4431d68ee3c04e66150ec9343fd1873de540ef6bd1a6833901d` |
| `attempt-01/Root-Cleanup-Observation01.json` | 853 | `7a9e3ed772a73c243d79e9bfaf38c791d5ca1cc13c74a62119ccbdeb1bea554c` |

Independently verified all 27 GO bindings against current small source/preparation bytes. They include the reviewed 27,394-byte helper `6d417b4a33021aaba47a0b15b6bf4be5cd8b0a2646d339dbf09bd6445b36fd51` and controller `ab44fdd619076af29b7e55a43d68838469603f2b0181638b4c49ae738c065c54`. The controller binds the GO's exact hash, command and absolute output path. Root's preflight counts 26 prior bindings; the GO adds that preflight itself as the 27th. The helper's terminal log and controller agree on exit 1. This readback does not invent another launch or authorization time.

Rehashed only the small original report (142,316 bytes, `b374b5c7d75ff691fcd7d48e948d87277f91fb00a4df82e4ca5e9ea543df5a32`) and prior independent audit (72,458 bytes, `90f15e60165bc9c214c46b00a8ccd1009f69e508b3435ca941b279c422505205`). The actual helper pins those inputs and inventory `448590de61a9e4265fb33238b6c2e0ca2582d8f7c32373a4c8fda7be89213998`, checks captured source identities, and verifies each JSONL hash after exhausting its iterator. Both scans completed before branch exploration. Their pinned expected hashes are:

- Quantums: `d7857847483bdaef23887a3cd60056ad1e174212b573d52e7e35a7fc3dbd1523`.
- Events: `8bc32b932c086dbd0cd1e27b8315ba1ab807bdfed666127cc725898fa4ef5b0b`.

The retained result's completed-scan fields plus this exact source path establish that those checks preceded replay. I did **not** independently rehash the large original streams in this review. Current production/build changes do not silently replace the capture's explicitly bound program: capture harness `9c087afe…`, processor source `42955562…`, synth `499f1d4a…`, engine `19e5cba9…`.

## Complete input denominators and native ordinal mapping

The result reports all 73,152 original ordered 128-sample metadata blocks and all 111,860 event rows, across 546 original callbacks/wire batches. These agree with the retained capture report; each audio path contains 9,363,456 original samples. Metadata preserves four repeated-frame/skipped-frame pairs at indices 6630/6631, 19748/19749, 41865/41866 and 53371/53372. It does not sort away or interpolate those anomalies.

Independently recalculated the 120 small retained calibration observations: five segments × before/after × 12 native rectangles. Every `inputRawSampleIndex - independentExpectedFrame` equals **−45,440 samples**. Every native route difference is 640 samples, every rectangle has 48 samples, and each phase retains its silent product-tap/support-bound flags. This verifies arithmetic and agreement with the previously audited detections, not a fresh audio detection. The global offset is an **input ordinal** mapping under the continuous-stream/shared-clock premises. It does not establish physical oscillator accuracy, unobserved interior driver behavior, or effective processor-cursor history.

All 468 positive group rows remain: F02 32, F03 36, F06 160, F08 240, with 54,532 logical voices in total. Every group still says `not-analyzed` and `qualificationPassed: false`. No unresolved group was removed from the denominator.

## Frontier and branch outcomes

Independently checked that completed branch indices and unresolved indices are disjoint and exactly partition each retained necessary anchor domain:

| Fixture | Necessary original indices | Processed | Retained unresolved |
|---|---|---:|---|
| F02 | 2055–2062 | 8 | none |
| F03 | 30167–30174 | 8 | none |
| F06 | 43303–43310 | 8 | none |
| F08 | 54949–54956 | 2 | 54951–54956 |

F02 index 2055 is recorded as `conditional-inconsistent: Candidate clock-fatal`; the other seven complete the declared conditional structural replay. This is rejection within the seeded empty-start/no-command family, not proof that the actual program failed or that all possible startup history is excluded. F03/F06 each have eight completed conditional branches. F08 has two; the interrupted third branch is not committed and remains unresolved with the other five.

The full negative segment's input rows were scanned, but its per-segment ledger/anchor replay stage was never reached. Four segment result objects do not imply that all five acquisition segments have completed structural analysis. Its unknown domain must remain pending in any successor.

Logical scalar comparisons retain nominal expected counts 96 / 36 / 14,080 / 40,320. Full retained trigger/onset counts are respectively 99/99, 39/37, 14,432/14,406 and 40,992/40,992. The distinction includes post-window commitment, playback tail and pause cancellation; those rows are not silently classified as in-window duplicates or missing onsets.

In particular, F06's **14,096 derived consumes are not its nominal 14,080 in-window voices**. `branch()` replays through the audit's inclusive last intersecting original block, drains due controls through that block's end, and compares that derived sequence only to the retained onset-order prefix. Its effective final ends span 136.45600000012766–136.47466666679435 seconds, beyond the declared window end 136.45333333343655. The extra 16 therefore belong to a different structural horizon/count definition; the compact result does not enumerate those individual IDs, so this note does not pretend to independently classify each one from raw events. All branches explicitly retain 310 later onset records not replayed. F08 likewise derives 40,340 rather than 40,320 and retains 652 later records. These counts cannot replace the nominal acoustic denominator.

F06's 7,280 and F08's 28,200 same-admission-block erasures agree across their completed branches; their ordered hashes are retained. This is conditional voice ownership computation, not evidence that an erased logical identity produced a separately identifiable sound. No PCM entrance was evaluated.

## Resource failure and cleanup

The work limit remains 50,000,000. The cooperative guard detected 50,000,038 charged units, after 5.050095167 seconds, well before 120 seconds. A whole transition charge can cross the threshold; no result after the failed charge is accepted as a completed branch. The final check preserves a second `Resource-unfinished: cooperative guard` error, explaining the two equal error strings rather than hiding the first failure. The result remains `failed-or-resource-unfinished`.

The helper retained 136,790,016 bytes as its maximum observed OS-reported RSS high-water reading; the external controller's 32 samples peak at 133,584 KiB, numerically the same byte count. Both are below 268,435,456 bytes. External sampling does not certify an unsampled peak, and the helper's last reading does not certify later serialization's entire lifetime. Input charge is 104,938,239 bytes; output is 79,054 bytes. Spare wall time/RSS does not authorize increasing the work limit or rerunning.

The root controller finished in 5.311720125 seconds with child exit 1, `forcedCleanup: false`, no controller errors, empty claims and no remaining owned processes. Root's separate retained exact-PID query found child 61083 absent. This supports closure of the acquired metadata process; it is not an exhaustive machine/process inventory claim. No PCM, browser, receiver or permanent service was acquired by this helper.

The result correctly retains zero actual identified groups, `waveformAnalyzed: false`, `qualificationPassed: false`, and explicit unknowns for shared dispatch, pre-anchor cursor/engine state, unlogged command entry and initial voice state. I found no contradiction in Root-Observation01's provisional failed/conditional disposition. Any optimization should preserve this failed attempt and prove semantic equivalence within the same resource limits before a separately authorized execution.
