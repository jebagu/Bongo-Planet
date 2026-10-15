# Bongo Planet — independent completed binary capture review

The independent offline audit passes **acquisition and retained-path integrity** for this completed run. It does **not** qualify absolute product onset timing, individual mixture arrivals, physical presentation, listening, or any milestone. Earlier failed captures remain failed and unchanged.

## Reproduction and binding

Run [independent-audit.py](independent-audit.py) with Python 3 from any directory. It reads the completed artifacts and exclusively creates [independent-audit.json](independent-audit.json), refusing to replace an existing result. The implementation imports no production code, codec or capture analyzer. It independently parses the framing and raw bytes, reconstructs each expected derived record, detects native rectangles, and checks fixed-lag path equality. No browser, service, profiler, product test or new recording was launched.

The successful audit took 15.741 seconds. Its result SHA-256 is `90f15e60165bc9c214c46b00a8ccd1009f69e508b3435ca941b279c422505205`; audit-source SHA-256 is `9423872a9fed44094a72224abd5b9051fbb71f58a5cb8328c1d012affbb8e7ed`. All 56 entries in the acquisition's existing final manifest match their retained sizes and hashes. The report, metadata, event stream, frozen harness, observer, fixtures, topology, application source and fetched before/after assets are bound in the result. The main and processor remain `d8040f40…` and `0f0b12c9…` respectively.

The original container SHA-256 is `ac2568dc1b43730c1a7c9dd81764620fda24e9d36257e8a5d4accfba0972ce58`.

## Full retention readback

The complete 125,505,853-byte container contains 2,832 frames: 2,286 PCM frames and 546 event frames. All frame lengths, stream sequences, original PCM FNV checksums and both raw Float32 paths match. The largest actual frame is 244,137 bytes, below the unchanged 262,144-byte cap. There is no partial prefix, frame, callback or unparsed tail.

All 73,152 original 128-sample blocks and their complete derived metadata match the container in original order. Each path contains 9,363,456 finite mono Float32 samples; both measured peaks are 0.9800000190734863. All 111,860 derived event rows match their full original event and global/per-segment index, original callback/row, chunk, session, receive-clock and container provenance. All 546 actual callbacks had one frame; this run supplies no live oversized-callback evidence beyond the separate source-only chunking controls.

The audit joins all 2,832 Node trace rows to container kind, sequence and exact appended byte count. Each full append precedes its ACK enqueue on the Node clock. All 2,832 browser dispatches have distinct, successful corresponding settlements; unresolved count is zero. Browser and Node clock origins are never subtracted. Append completion is not an fsync durability guarantee.

The report records positive closure of the owned browser process, page/context, AudioContext, input tracks, socket, servers, container descriptor and callback admission, with zero active Node callbacks, pending requests, collector errors or first overflow. This readback verifies those retained observations rather than re-inspecting live processes.

## Independent calibration and full windows

All ten before/after calibration retention intervals contain exactly 12 native rectangles. Each rectangle is exactly 48 samples of Float32(0.3), with no other nonzero input samples in its interval. The product tap is numerically zero throughout all ten retained calibration intervals. Every scheduled native frame has one unambiguous retained metadata mapping; all 120 detections give **640 raw samples**, or **13.333333 ms**, delay. Before/analysis/tail/after and successive segment calibration intervals are ordered without reused supports.

The raw-index lag is an exact integer for these observations. The result additionally states a one-sample allowance for native scheduling/render quantization; this is not a measured hardware presentation uncertainty. Calibration demonstrates route stability at the 120 independent observations. The full fixed-lag comparison below supplies additional evidence over the product signal; neither can distinguish a transient delay change confined to an acoustically invariant interval.

| Segment | Original analysis indices | Complete blocks | At native 640 samples |
| --- | ---: | ---: | --- |
| F02, 64 s | 2062–26061 | 24,000 | Exact byte equality |
| F03, 24 s | 30174–39174 | 9,001 | Exact byte equality |
| F06, 20 s | 43310–50810 | 7,501 | Exact byte equality |
| F08, 20 s | 54956–62456 | 7,501 | Exact byte equality |
| F02 actual Delay100, 12 s | 66598–71098 | 4,501 | 1,584 blocks / 201,600 samples differ |

The four positive windows therefore compare **48,003 blocks / 6,144,384 samples** with zero mismatch at an offset determined exclusively from the native clicks. The actual Delay100 negative compares all 4,501 blocks exactly at the separately predeclared **640 + 4,800 = 5,440 samples**. Only those two offsets were tested; this is no all-offset uniqueness claim. Native calibration itself remains 640 samples before and after the delayed product segment, showing that calibration did not absorb the product delay.

Every analysis start equals its exact first retained emission event time and reported transport epoch; the end remains that epoch plus the predeclared duration. No epoch rounding, best-fit offset, sample trimming, interpolation or time sorting was used. First/last intersecting blocks, every interior original index, full paths, ordered-sample duration, actual timer interval and 200 ms tail are checked. Both separately sampled Node elapsed fields meet the declared duration in their causal order. The four reported 100/250 ms interventions contain their predeclared group target and meet their browser-clock duration. Snapshot and final session/running/error counters are consistent with the segment.

Eight metadata discontinuities remain explicit: paired −128/+128 sample steps at original indices 6630/6631, 19748/19749, 41865/41866 and 53371/53372. The first two pairs lie inside the positive F02 window. No affected row was filtered; source/input equality includes those original blocks. These facts do not independently prove the expected synthesis waveform or fix a general clock relationship.

## Audit correction and remaining limits

The first independent parser attempt incorrectly required equality between two separately sampled elapsed fields. The source takes the reported elapsed value, then samples the timer-end clock; their actual difference is 1–10 microseconds. [The original attempt source](independent-audit-attempt-01.py) and [failed audit result](independent-audit-attempt-01.json) are preserved. The corrected guard requires causal ordering and both durations at least the requested interval; it adds no arbitrary tolerance and changes no capture data.

`captureIntegrityAuditPassed:true` is supported. `qualificationPassed:false` and `acceptancePassed:false` remain mandatory. A deterministic mono mixture can conceal erased voices, exchanged identical identities, duplicates hidden by capacity/stealing, saturation, or timing aliases. Shared-path equality alone cannot establish independent expected entrances, full missing/duplicate exclusion, or ≥120 individually identified actual onsets. A future fixed-epoch forward-model comparison is a separate model-fidelity diagnostic and must bind this audit's exact denominator and hashes; it cannot turn those identifiability limits into an onset pass.

## Subsequent source-only fidelity helper review

Reviewed `scripts/mixture-fixed-fidelity.ts`, SHA-256 `342fc4087e5ddf41d2808237065e677c62f93e3bd17b4604b0a999be3fcd7fbe`, and [Analysis-Plan.md](Analysis-Plan.md), without executing the model. Source GO is limited to the proposed diagnostic: the helper requires this successful audit's report, metadata and both raw hashes, exact five fixed-window denominators and unchanged first-emission epochs. It binds the fixture/oracle/topology sources, preserves the original sample ordinal and reports observed global-clock residuals, compares all source and native-lag input samples against the independent forward oracle, and tests the actual negative's additional 4,800 samples as a separate predeclared graph hypothesis. It leaves actual identified groups null and qualification false. The 468 groups are explicitly modeled, not measured entrances.

The 120-second/RSS limits are cooperative detected bounds: the unchanged synchronous oracle is checked after rendering, so this is not a hard interruptible wall-clock deadline. That limit is stated in the plan and does not invalidate the proposed fidelity-only measurement. No claim about the helper's actual outcome is included in this source review.

## Actual fixed-fidelity result: two positive fixtures fail the declared maximum tolerance

Read [fixed-fidelity.json](fixed-fidelity.json), SHA-256 `7856a166b195a203991a413f628e49acf206b7e81535a74a4bd9906bbd56cc70`, from the single authorized model run. It completed in 6.719541292 seconds with recorded final RSS 239,845,376 bytes, below the declared 268,435,456-byte threshold, and no execution errors. **Exit 0 and completed-observation status do not mean that all positive fidelity comparisons passed.** The predeclared criterion requires both RMS and maximum absolute error at most 1e-6.

| Positive fixture | Complete samples | RMS difference | Maximum absolute difference | Declared numerical criterion |
| --- | ---: | ---: | ---: | --- |
| F02 | 3,072,000 | 2.41919436e-9 | 2.98023224e-8 | Pass |
| F03 | 1,152,128 | 7.94988558e-9 | 4.47034836e-8 | Pass |
| F06 | 960,128 | 1.01541730e-7 | 1.67265534e-6 | **Fail: maximum** |
| F08 | 960,128 | 1.61307255e-7 | 2.35065818e-6 | **Fail: maximum** |

For every positive segment, source and independently shifted input comparison metrics and actual-window hashes agree, consistent with the preceding exact route audit. The dense-scene differences therefore already exist between the retained product tap and the nominal oracle; these observations do not implicate corruption on the tap-to-input route. They do not distinguish numerical evaluation, render-time-axis assumptions, oracle discrepancy, or production behavior. Cause remains unassigned, and neither tolerance relaxation nor retiming is justified by this result.

The negative's full 576,128-sample input window at native640 gives RMS 0.0487722177 and maximum 0.2146877944, rejecting nominal fidelity. The separately predeclared5440 comparison gives RMS 1.90448132e-8 and maximum 8.94069672e-8, agreeing with the nominal source comparison. This confirms the same delayed-graph hypothesis at the fixed epoch; it does not change the negative into a positive onset pass.

Independent readback rechecked the reviewed helper/oracle hashes; the successful audit, report, metadata, topology and both raw bindings; all five original interval indices, sample offsets and exact first-emission epochs; the preserved native calibration objects; and the truth value of each declared RMS-plus-maximum decision. It separately reread and hashed **all 11 actual windows** (source and native input for each segment, plus the delayed negative). All match their recorded hashes. Positive windows contain 6,144,384 samples; all five source windows contain 6,720,512. The complete container was not reparsed again, and the oracle was not independently regenerated in this readback.

The 32/36/160/240 positive groups remain **468 modeled groups only**. F06/F08 respectively contain 7,280/28,200 model-erased voices. Actual identified group counts remain null; qualification and acceptance remain false. The two failed maximum-error comparisons are retained as measured outcomes while source investigation proceeds separately.

## Source-only numerical discrepancy helper review

Source GO for `scripts/mixture-numerical-discrepancy.ts`, SHA-256 `32aca733ad92ff4cba13d59cd923c90d3041f6dfa3f81dd89e83201d5f672e2b`, within [Numerical-Discrepancy-Plan.md](Numerical-Discrepancy-Plan.md). No raw diagnostic execution was performed by this reviewer.

The helper binds the prior audit/fidelity/report and retained events, raw recordings, metadata, topology, unchanged oracle and captured synth/processor sources. Closed-form emission enumeration and independent reach traversal assign sequence identities without rounding observed timestamps into a favorable cycle. Declared logical voice/onset comparisons retain the fixed epoch and counts; explicit note timbre and beat sound checks accompany duration, level and frequency checks. The full dense re-render and raw window must hash identically to the original nominal fidelity windows before top-sample analysis proceeds. The sixteen largest absolute errors retain unchanged ordinal time, raw block-clock metadata and analytic ownership/contributions; no alternate arithmetic, fitted cursor or new tolerance is substituted.

Two initial source issues were corrected before GO. Missing or duplicate trigger rows previously skipped the corresponding onset-cardinality check; both domains are now recorded independently before any continue. A false scalar-reconstruction equality previously could coexist with completed status; the helper now retains the detail and rejects the diagnostic if scalar contributions fail to reconstruct the unchanged nominal sample. The final five-control record exercises these paths and the sequence/reach/sound checks; this reviewer read the retained controls without rerunning them.

The result can diagnose retained logical timestamp/parameter differences and nominal scalar contributions. It does not directly observe the product's active-voice array or actual acoustic entrances, and cooperative resource guards remain detected rather than preemptive limits. Original F06/F08 strict maximum-error failures remain immutable regardless of diagnostic outcome.

## Actual numerical discrepancy diagnostic: retained prefix only

The single actual diagnostic result, [numerical-discrepancy.json](numerical-discrepancy.json), SHA-256 `01a6bf432f5635228f8780e8de76809f789070f9100cbaeb75d59e4d54de957f`, is **failed-or-incomplete**, exit 1. It detected the unchanged cooperative 256 MiB limit after 7.442071667 seconds; final RSS was 291,864,576 bytes versus 268,435,456 allowed. The duplicate error strings represent the stage guard and final guard, not two diagnostic runs. No cap increase, threshold change or retry is implied.

Readback confirms bindings to the reviewed helper32aca733, unchanged oracle82a90a52, original audit, fidelity result, recordings, metadata and events. All four positive logical ledgers report complete expected trigger and onset counts: **96 / 36 / 14,080 / 40,320**, with the same denominators in timestamp statistics and no reported missing, duplicate, extra, sound or identity differences. Maximum absolute retained timestamp differences are respectively **1.42108547e-14 / 0 / 0 / 5.68434189e-13 seconds**. These are logical ledger results, not acoustic arrivals.

The completed **F06** scan retains all960,128 samples, the exact previously bound raw/oracle window hashes, **702 errors above1e-6**, and16 ranked sample details. This reviewer independently reread those16 actual raw Float32 values, verified their offsets/frame/block arithmetic and absolute error values, and recomputed Float32 reconstruction from the recorded64 ordered scalar contributions. All reproduce the recorded nominal sample; all64 retained logical onsets equal their model onset at these points. Maximum error remains1.6726553440093994e-6 at window sample948167/frame6537927, original block50717/sample71. The observed block time agrees with the ordinal block start at all16 points.

**F08 has no completed raw-sample/top-ownership result.** “Not attempted” would overstate the limit: with the F08 logical ledger retained, the reviewed source next calls the full oracle renderer and then the resource guard before reading/scanning its raw window. The source path therefore places this interruption at the post-render guard. It supplies no completed F08 sample-analysis certificate.

The top F06 errors' repeated phase and gradually increasing magnitude may motivate hypotheses, but no production active-array observation, reconstructed render cursor, alternate arithmetic test or unique causal separation occurred. Small logical timestamp deltas and exact block metadata do not by themselves establish the precise time used inside each product synthesis sample. No full oracle re-render, broad raw reparse or new acquisition was performed during this independent readback. The original F06/F08 maximum-error failures, null actual identified groups and false qualification/acceptance remain unchanged.

## Source-only declared cursor hypothesis

Source GO for `scripts/mixture-cursor-hypothesis.ts`, SHA-256 `324c5eacaca92514bc979f32d6ddb009312b89b34f7c3612c82572aba37c9b8b`, and [Cursor-Hypothesis-Plan.md](Cursor-Hypothesis-Plan.md). No hypothesis run was performed by this reviewer.

The helper replays one declared block-only cursor from the first retained raw observer clock, using `max(raw, previousEnd)` plus128/48000, across all original metadata. It neither searches the initial state nor fits an offset. At exactly the16 previously retained largest-error F06 samples, it preserves the analytic voice identities/order and unchanged scalar equations, verifies the exact raw value/frame mapping, and reports prediction errors without modifying the original nominal comparison. Prior audit, failed-prefix, fidelity, metadata/raw/oracle and captured processor bindings are checked.

A source-review gap in final resource reporting was closed: the helper now rechecks its cooperative30-second/256 MiB bound before writing and latches failed/incomplete status on overrun. The selected-largest-error nature of the16 points is explicit. These are postselected diagnostic observations, not held-out validation.

Initial processor history before the observer is unknown. The block-only replay also omits the independent engine/command floor used by production. Preserving nominal analytic ownership while testing a different sample time is a narrowly declared mechanism hypothesis, not a complete processor reproduction or observed active-array proof. Even a closer prediction cannot alone establish unique causality, qualify acoustic onsets, erase the F06/F08 strict failures, or justify a production change.

## Actual declared cursor hypothesis readback

[cursor-hypothesis.json](cursor-hypothesis.json), SHA-256 `1ba2607c11278c5f22ef81b7d8d76b463a422d4f1ff5949e29548ee55fae8c07`, completed in0.318047083 seconds with final RSS122,191,872 bytes, no errors and all qualification/acceptance fields false. It binds the reviewed324c5eac helper and unchanged prior evidence. Its explicit initial state is the first retained raw time0.96 seconds, with earlier processor history unknown.

A separate bounded Python readback streamed all73,152 metadata records and independently recomputed the exact declared cursor recurrence. It reproduced the reported cursor-versus-ordinal range, **0 to2.0045831661263946e-10 seconds**, without searching initial state or offsets. It then independently reread the16 original raw Float32 samples and evaluated the retained ordered scalar voices at the declared hypothesis times. **All16 predictions equal their original raw Float32 values**, matching the recorded zero hypothesis error. Selected sample-time shifts are1.206217348226346e-10 to1.2735767995764036e-10 seconds. The original nominal errors remain1.58e-6 to1.67e-6 at those selected points.

This strengthens the narrow numerical-mechanism hypothesis: a tiny accumulated block-time difference can account for these postselected F06 discrepancies under unchanged scalar voices. It does not uniquely establish actual production cursor history, engine/command floors, active-array identity, full-window agreement, F08 behavior, or independently detected acoustic entrances. No new reference offset or threshold was chosen, and the original strict fidelity failures remain unchanged.

## Source-only structural streaming diagnostic review

Source GO for `scripts/mixture-numerical-streaming.ts`, SHA-256 `4467ba82727184c76115fdab6eb1276f1761a818092acc5ef52ee4f08cac5aa2`, and [Numerical-Streaming-Plan.md](Numerical-Streaming-Plan.md). This is a separate implementation with a new exclusive output; the original32aca733 memory failure remains immutable. No actual streaming diagnostic was executed by this reviewer.

The compact sequence projection preserves the reviewed reference semantics: independent trigger/onset counts; first-trigger scalar fields and full-trigger SHA; first-onset scalar/hash and an any-different flag; independent first-insertion order for extra trigger/onset domains. The unique-trigger comparison detects any differing onset regardless of arrival order. Duplicate-trigger handling, complete original global/per-segment indices, all segment counts, fixed epochs/windows and unchanged oracle/raw hashes remain enforced. SHA-based equality carries its stated collision assumption.

The ten retained controls compare the actual frozen32aca733 loop against the compact projection for distinct, reordered, missing/duplicate, changed full-trigger/sound and extra-order cases, and compare ranking/threshold counting and scalar reconstruction. They were read, not rerun. One segment map is summarized and cleared before advancing; all such maps are released before dense rendering, leaving typed metadata/onset arrays. The50,000-sequence/32 MiB projected-state caps and unchanged120-second/256 MiB detected RSS limits fail closed, including the final guard. Serialized-state size and released references do not prove V8's actual RSS or collection timing. The synthetic allocation result is preparation evidence only; actual resource completion remains a separate measurement.

No alternate cursor, arithmetic or new fidelity threshold enters this streaming diagnostic. Its purpose is to complete the original logical-ledger and fixed nominal top-sample inspection with less retained state; all onset-identifiability and analytic-ownership limits remain.

## Actual streaming diagnostic readback

[numerical-streaming.json](numerical-streaming.json), SHA-256 `06b3b47c3cc52972a12aa337da0c2f1cad3104f26c0b45adf4debd168209b0ea`, completed in6.795141083 seconds with no errors. Maximum observed RSS at cooperative checks was220,823,552 bytes, below the unchanged268,435,456-byte cap; it is not continuously instrumented peak RSS. The source binding remains4467ba82. All111,860 events are counted; maximum compact state was40,992 sequences/21,832,500 serialized bytes. The original failed diagnostic is unchanged.

Independent structural equality checks confirm **all four ledger objects and the complete F06 segment/top16 object exactly equal the original32aca733 retained prefix**. Both completed dense960,128-sample windows bind the original nominal oracle and raw hashes. F06 retains702 samples above1e-6/max1.6726553440093994e-6. F08 newly completes with**4,506 samples above1e-6/max2.3506581783294678e-6**. Both original strict criteria remain unmet.

This reviewer independently reread all32 selected original raw Float32 values, checked their reported absolute errors, and recomputed Float32 output from their recorded64 ordered scalar contributions. Every reconstruction matches its unchanged nominal value. F08's maximum is window sample952165/frame8032613, original block62394/sample101. Its top-point retained logical-onset differences range4.831690603168681e-13 to5.684341886080801e-13 seconds; F06's are zero. Observer block-clock differences from nominal block start are zero at these points. These are completed nominal sample diagnostics, not actual product active-array or synthesis-time observations.

No full model rerender or container reparse was repeated during this review. Readback agrees with [Numerical-Streaming-Review.md](Numerical-Streaming-Review.md) and the execution record's scope. The structural reduction succeeded for this one measured run without changing the cap; it does not retroactively pass the earlier failed execution, prove an absolute memory bound, assign unique numerical causality, or qualify acoustic onsets.

## Source-only full-window cursor hypothesis

Source GO for `scripts/mixture-cursor-full-hypothesis.ts`, control-bound SHA-256 `35ee6ec74775a911d46da2afa8d7638d77ce64ac384b6981ea49b4507a972761`, and [Cursor-Full-Hypothesis-Plan.md](Cursor-Full-Hypothesis-Plan.md). The four retained pure controls were read, not rerun. No actual full-window hypothesis execution was performed by this reviewer.

Candidate inclusion, admission, removal and duration pruning use the original nominal ordinal frame/time, matching the original oracle. Only scalar waveform/envelope time changes to the fixed block recurrence plus within-block offset. This is a deliberately frozen-ownership arithmetic hypothesis; it is not a fully retimed synth/capacity counterfactual. The distinction matters at ownership boundaries and is explicit in the plan/result limitations.

The helper requires every original nominal/raw window hash and all6,144,384 positive samples, with one declared seed, no search, no changed epoch or tolerance, exclusive new output, and final detected resource-failure checks. The negative control remains in its prior immutable analysis because this new scope concerns numerical arithmetic. Full-window coverage reduces reliance on16 selected points, but the hypothesis was still selected after this capture. Unknown initial history, omitted engine/command floors, analytic rather than observed ownership, and non-uniqueness of acoustic explanations remain. Even full agreement would not replace the strict original failures or qualify an onset gate.

## Actual full-window cursor hypothesis readback

[cursor-full-hypothesis.json](cursor-full-hypothesis.json), SHA-256 `e1cb7eafcb42cec9027f90d7c14d991d9f6a6ff2a35a3c5d76e65a04325db61e`, completed in 9.970082792 seconds with no errors. Maximum observed RSS at cooperative checks was 234,700,800 bytes, below the unchanged 268,435,456-byte bound; this is not a continuously sampled peak. The helper binding remains `35ee6ec74775a911d46da2afa8d7638d77ce64ac384b6981ea49b4507a972761`. Qualification and acceptance remain false and actual identified groups remain null.

| Fixture | Full original samples | Hypothesis RMS error | Maximum absolute error | Differing Float32 samples |
| --- | ---: | ---: | ---: | ---: |
| F02 | 3,072,000 | 2.11090452e-11 | 1.49011612e-8 | 182 |
| F03 | 1,152,128 | 6.95906749e-12 | 7.45058060e-9 | 7 |
| F06 | 960,128 | 0 | 0 | 0 |
| F08 | 960,128 | 3.56482005e-9 | 1.19209290e-7 | 6,604 |

All **6,144,384 samples** in the four unchanged positive windows are included. F06's prediction and previously independently audited raw window share SHA-256 `09bde609375d18553469ad56e3969d519f91e738d5df5c61a3cd6f645a0c53fd`, supporting exact full-window Float32 equality. F08 is substantially closer under this hypothesis but is not byte-identical. No hypothesis sample exceeds 1e-6. These are new hypothesis results; the original nominal F06/F08 maximum-error failures remain explicitly false in the result and unchanged in the original fidelity artifact.

Independent readback verified the current helper and small-artifact hashes, immutable audit/report/fidelity/raw/metadata/oracle/topology bindings, exact epochs and original interval indices, complete sample denominators, and each raw-window hash against the previously independently hashed window. It verified that every retained nominal metric and decision still equals the original fidelity result. The declared seed of 0.96 seconds, all 73,152 metadata blocks and cursor-delta range 0 to 2.0045831661263946e-10 seconds match the earlier independent recurrence replay. No full oracle rerender, new raw-container reparse or new acquisition was performed for this readback.

The full-window result strengthens the numerical-mechanism explanation beyond the 16 postselected points, especially the exact F06 equality. It does not independently observe the production cursor, its earlier history, the engine/command floor, or active-voice ownership. The hypothesis was selected after this capture, and ownership remains the original nominal analytic ownership while only scalar sample time changes. Unique causal attribution, generalization to other runs, physical presentation timing, and individually identified acoustic onsets remain open. This result changes no acceptance gate or production source.
