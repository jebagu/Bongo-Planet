# Bongo Planet — transport diagnostic, attempt 01

This one authorized two-arm diagnostic exited **1** after **32.834635 actual monotonic seconds**,2026-10-11T22:42:56.441Z→22:43:29.276Z. The exposed-function arm reached the actual128-pending PCM cap before completing its24-second exposure. The independently planned binary socket arm was **not attempted** under the strict non-drain-failure stop rule. This is a failed/incomplete two-arm experiment, with no full comparison, timing qualification or retry.

All owned page/context/browser-process/AudioContext/exact SPAT tracks, callback admission, container descriptor and temporary5420/5424 servers closed positively. Zero active Node callbacks remained. No forced process stop or100-second watchdog was needed. Root's permanent services were not stopped. Complete saved observations are in [report.json](report.json), [analysis.json](analysis.json), the arm's ordered traces and untouched framed container.

## Actual overflow and retained denominator

The first error is `PCM retention backlog limit exceeded`: refused PCM sequence227, original observer indices7264–7295, at context21.066666666666666 and browser monotonic21966.299999952316ms. It records PCM pending128 and event pending88 before refusal. The browser-clock interval from the exposure marker3975.700000047684ms to error is17.990600 seconds; the corresponding context interval is17.989333 seconds. This is neither a complete24-second exposure nor a shortened replacement denominator.

First logical emission remained2.5173333333333625 seconds, independently retained with receive-context2.52 and receive-browser3420.799999952316ms. Matching session was s3. Exposure marker context3.0773333333333333 and browser3975.700000047684ms followed activation; the original epoch was not rebased. Final24-second exposure certificate, end-state/activity guards and socket comparison are absent.

Accepted retention preserved227 PCM batches,7,264128-sample original blocks,929,792 actual mono samples per path,151 event batches and26,571 full original events. The complete container is17,788,226bytes across378 framed records. Re-decoding, sequence/length/channel/finite/checksum checks and derivation consumed its entire original byte range, with no unparsed tail or collector failure. Raw copies in [exposed-function/product-tap.f32](exposed-function/product-tap.f32) and [exposed-function/virtual-input.f32](exposed-function/virtual-input.f32), [quantums.jsonl](exposed-function/quantums.jsonl) and [events.jsonl](exposed-function/events.jsonl) derive only from these accepted frames. The original [capture.container](exposed-function/capture.container) remains untouched.

The browser observer ultimately reported312 batches, but only227 were accepted before the refusal. Its later metadata/diagnostic observations do not supply the missing raw prefix beyond the cap. All227 PCM and151 event dispatches eventually received matching successful acknowledgements; final unresolved accepted-request counts are zero. That later drain does not erase the earlier128-cap failure or supply a24-second exposure certificate. The refused sequence227 was never dispatched/acknowledged. No onset lateness or telemetry drop was observed in the retained last product status, but this is not a timing qualification. The diagnostic's fail handler requested Pause, and later telemetry reported paused/zero voices.

## Same-domain phases

[analyze.py](analyze.py) reads saved traces only. Browser original-handler durations refer to synchronous calls between exposure start and first error. Browser dispatch/promise values cover accepted whole-arm requests, including startup/tail. Node values cover corresponding callback bodies, never browser→Node transit.

| Observed phase | Median ms | p95 ms | Maximum ms |
| --- | ---: | ---: | ---: |
| Original synchronous handler,144 calls | 0.100 | 17.900 | 27.100 |
| Browser PCM payload construction,227 | 0.400 | 1.300 | 3.400 |
| Browser PCM synchronous dispatch,227 | 1.700 | 3.600 | 11.100 |
| Browser event payload construction,151 | 0.200 | 0.800 | 1.600 |
| Browser event synchronous dispatch,151 | 1.900 | 6.700 | 10.300 |
| Browser PCM dispatch→ACK,227 | 8199.700 | 10803.300 | 11109.700 |
| Browser event dispatch→ACK,151 | 8259.700 | 10819.700 | 11150.100 |
| Node PCM callback,227 | 0.887 | 3.380 | 11.994 |
| Node event callback,151 | 1.498 | 7.162 | 123.119 |
| Node PCM reconstruction,227 | 0.386 | 1.602 | 2.889 |
| Node framed decode,378 | 0.082 | 2.080 | 4.756 |
| Node validation,378 | 0.220 | 1.249 | 10.945 |
| Node complete container append,378 | 0.099 | 0.481 | 7.123 |

ACK delivery is observed through the browser promise. The exposed function's protocol ACK enqueue internals are not directly instrumented; no invented Node ACK-delivery duration appears. The saved requested first24-browser-second dispatch subset contains only210 PCM/144 event dispatches because the arm stopped early; its p95 lifetimes10,838.800/10,819.700ms are explicitly an **incomplete** subset, not an equal24-second comparison. All accepted-request lifetimes have resolved in this saved trace. The refused request and absent socket arm remain separate censored/absent outcomes.

Pre-error browser50ms-heartbeat intervals had p9591.300ms/max148.200ms. Frame gaps had maximum83.400ms; one retained long task measured94ms. These observations do not uniquely allocate multi-second acknowledgement delay. Synchronous Node append bodies were short in this sample, but neither disk nor product handler, IPC, browser/Node protocol queues, deferred UI/render/GPU/GC or scheduler is assigned as the cause. Low original-handler cost cannot clear later view work.

## Frozen source and limits

Unchanged original F06/default view, named SPAT virtual input/output, product destination plus silent parallel dual-input observer,32×128 batches and independent128 pending caps were retained. Native Float32 byte checksums validate reconstructed baseline samples; original nonfinite JSON is rejected before encoding. Each acknowledged record followed a complete length-prefixed synchronous container append. No cross-file atomicity/fsync durability is claimed. Framing/checksums/trace/ACK validation are new diagnostic perturbations; they do not reassign the earlier warm capture failure.

Reviewed harness SHA256 `d59291f05425e80c0460346c6dc3290c55df1e99739ebff52a62b46d5410ddb8` is frozen as [transport-harness.ts](transport-harness.ts). Actual served pre/post main hash remained `3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207`, processor `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`, and original F06 `e2cc3fec0762b540ac4d8644e9dc7bfd48571b89d7bc4561ed28852310c37954`.

No socket-only acquisition, transport hypothesis qualification, original-failure root cause, absolute onset, human listening or acceptance gate is asserted here. Any later authorized acquisition must have its own output/source binding and cannot turn this failed two-arm run into a completed comparison. [manifest-final.json](manifest-final.json) adds this review and read-only analysis while preserving [manifest.json](manifest.json) and original capture artifacts.
