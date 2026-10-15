# Bongo Planet — separate socket-only acquisition, attempt 02

This independently authorized socket-only diagnostic exited **0** and completed **24.104854 actual Node monotonic seconds /24.104100 browser monotonic seconds** of original F06 exposure. Total execution was31.992869 seconds,2026-10-11T22:48:32.015Z→22:49:04.008Z. It tested the previously unattempted binary-retention arm in a fresh owned browser process. The [earlier two-arm attempt01](../attempt-01/Review.md) remains failed/incomplete after exposed-function PCM128-cap overflow, with no completed paired24-second comparison. Neither acquisition qualifies product onset timing or acceptance.

The final running/session/exposure/activity guards and all accepted-request acknowledgements completed. No first error, overflow, collector failure or retained partial tail was observed. Maximum pending PCM/event requests were6/3; both were zero at cleanup. Owned page/context/browser process, AudioContext/exact SPAT tracks, socket and temporary5420/5424 servers, container descriptor and Node callback admission closed positively, with zero active callbacks. No forced stop or hard watchdog occurred. Permanent root services were not stopped.

## Unchanged workload and retained bytes

Unchanged original F06/default view, exact SPAT virtual input/output, normal product destination plus the same silent dual-input observer,32×128 batches, full original event rows and independent128 pending caps were used. Socket PCM travelled as native little-endian Float32 bytes without Array.from or PCM serialization through browser automation. Node validated sequence, independent quantum indices, path/channel lengths, finite samples and original browser byte checksums before writing each full framed record and then acknowledging it.

[report.json](report.json) retains first logical emission2.085333333333338 seconds separately from its receive-context2.0906666666666665 seconds. The original epoch was not fitted to PCM or rebased after activation. Both browser and Node observed durations exceeded the requested24 seconds; per-block original-index progression and event activity covered that exposure with the declared edge bounds.

The untouched [binary-websocket/capture.container](binary-websocket/capture.container) contains514 complete frames /24,350,892bytes:309 PCM batches,9,888128-sample blocks,1,265,664 actual mono samples per path,205 event batches and36,480 full events. Derivation revalidated its entire original byte range, with zero unparsed tail. [product-tap.f32](binary-websocket/product-tap.f32), [virtual-input.f32](binary-websocket/virtual-input.f32), [quantums.jsonl](binary-websocket/quantums.jsonl) and [events.jsonl](binary-websocket/events.jsonl) are derived copies; the original container is preserved. ACK follows full synchronous framed append, not fsync or cross-file atomicity.

All309 PCM/205 event requests eventually received matching successful acknowledgements. No unresolved accepted request was omitted from the saved whole-arm distribution. The fixed first24-browser-second dispatch subset includes281 PCM/192 event requests, all resolved; startup/tail requests are retained separately rather than silently used to change the matched interval.

## Same-domain phases

[analyze.py](analyze.py) derives [analysis.json](analysis.json) from saved traces only. Browser dispatch→ACK measurements include all intervening work; Node elapsed phase measurements have their own clock origin. No browser→Node transit or absolute product latency is obtained by subtraction.

| Observed phase | Median ms | p95 ms | Maximum ms |
| --- | ---: | ---: | ---: |
| First24s browser PCM dispatch→ACK,281 | 1.400 | 18.400 | 198.800 |
| First24s browser event dispatch→ACK,192 | 4.300 | 24.700 | 176.000 |
| Whole-arm browser PCM dispatch→ACK,309 | 1.600 | 55.700 | 449.200 |
| Whole-arm browser event dispatch→ACK,205 | 4.500 | 34.500 | 349.500 |
| Original synchronous event handler,193 active calls | 0.100 | 17.500 | 53.800 |
| Browser PCM payload construction,309 | 0.100 | 0.600 | 2.800 |
| Browser PCM synchronous send,309 | 0.100 | 0.300 | 1.300 |
| Browser event payload construction,205 | 0.300 | 0.900 | 2.100 |
| Browser event synchronous send,205 | 0.200 | 0.700 | 1.400 |
| Node PCM callback,309 | 0.523 | 1.707 | 52.636 |
| Node event callback,205 | 2.009 | 7.204 | 73.399 |
| Node wire normalization/decode,514 | 0.001 | 3.115 | 71.184 |
| Node framed decode,514 | 0.087 | 1.622 | 28.564 |
| Node validation,514 | 0.191 | 0.769 | 5.309 |
| Node complete append,514 | 0.097 | 0.329 | 4.754 |
| Node ACK enqueue,514 | 0.096 | 0.445 | 42.854 |

Active browser heartbeat intervals had p9572.100ms/max166.400ms. Frame gaps had max116.700ms, with two retained long tasks54/59ms. These observations do not qualify audio timing or uniquely locate any residual delay. Node ACK enqueue is distinct from browser ACK receipt. Original-handler timing covers synchronous work only; deferred UI/render/GPU/GC remains unallocated.

This short separate socket acquisition showed much smaller retained-request lifetime and queue maxima than the failed exposed acquisition, but unequal successful exposure, fixed order, fresh-process/runtime variation and instrumentation prevent a completed equal-window paired conclusion. The original warm third-segment failure is not reassigned uniquely to IPC, disk, product handler or scheduler. The raw recording has no independent native-route calibration or original-mixture onset identification here.

## Binding and open gates

Reviewed socket-only harness SHA256 `7966516c940c2439f68389a6cf26d00e6b6d7a6de6a913fddd0452f6052afc52` is frozen as [transport-harness.ts](transport-harness.ts). Actual HTTP pre/post main remained `3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207`, processor `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`, and original F06 `e2cc3fec0762b540ac4d8644e9dc7bfd48571b89d7bc4561ed28852310c37954`.

[Independent-Review.md](Independent-Review.md) separately re-parses every retained frame and derived file, confirming exact bytes/provenance, finite samples, full append-before-ACK boundaries and the reported distributions. Its scope remains the same short transport pipeline.

No exposed rerun, completed paired comparison, absolute onset/mixture timing, human listening, physical venue output or acceptance gate is asserted. Product workload, limits, original evidence and PCM were unchanged. [manifest-final.json](manifest-final.json) binds added review/read-only analysis while preserving [manifest.json](manifest.json) and captured originals.
