# Bongo Planet — F06 retention diagnostic, attempt 01

This one authorized diagnostic exited **1** after **116.233 actual monotonic seconds**, from 2026-10-11T22:05:45.696Z to 22:07:41.929Z. Baseline, observer-only, PCM-only and events-only arms completed their bounded diagnostic observations. Combined retention failed/incomplete at the 110-second operation deadline; its final health/activity certificate and complete promise drain are absent. No acceptance or timing qualification follows. No retry occurred.

All five owned browser contexts, exact SPAT capture tracks and AudioContexts closed. The owned Chrome process and temporary immutable client server closed; the 120-second forced-stop watchdog did not fire. Root production services were not stopped. Full retained results are in [report.json](report.json), [analysis.json](analysis.json), and each arm's ordered browser/Node traces and raw files.

## Controlled workload and provenance

Five fresh pages/contexts used the unchanged original F06 scene, default view and original `onEvents` handler exactly once per callback: baseline; observer graph with no retention; PCM retention; event retention; both. The same Chrome process and fixed arm ordering remain confounds. Each requested 16-second exposure began after an observed first emission and matching-session running status. The first-emission epoch was retained separately; controller/startup time was not silently counted as exposure.

Only the named SPAT 8ch loopback virtual input/output was selected. The output destination changed on the test context; no global/default device or ambient microphone was used. The observer tapped the actual production node in parallel and captured virtual input; its output was silent. PCM payloads retained the original 32-block batches, 128-sample paths, original Array.from/exposed-function transport, and independent pending caps of 128. No product workload, PCM, original capture or source was modified.

Frozen harness SHA256: `c09a19bf4a17c1e53b684fb6d26190ca02910bc04d1f20f269b584fdf2e9e24e`.
Frozen/served main SHA256: `3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207`.
Frozen/served processor SHA256: `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`.
Original F06 SHA256: `e2cc3fec0762b540ac4d8644e9dc7bfd48571b89d7bc4561ed28852310c37954`.

## Same-domain observations

Times below are milliseconds. Original-handler measurements cover active-exposure synchronous callback bodies only. Retention phases include all retained stage dispatches, including startup/tail. Promise lifetime spans browser dispatch to browser settlement; it is not browser-to-Node transit. Node callback entry is the first observed callback entry, not queue admission. Promise-lifetime percentiles use resolved observations only and are censored: the combined PCM/event distributions omit27/18 still-unsettled dispatches, respectively; they are not full latency distributions.

| Arm | Completed Node exposure (s) | Handler p95 / max | Browser heartbeat max | rAF gap max | Max pending PCM / events |
| --- | ---: | ---: | ---: | ---: | ---: |
| Baseline | 16.137 | 12.8 / 17.0 | 69.2 | 50.0 | 0 / 0 |
| Observer-only | 16.215 | 19.2 / 40.0 | 145.8 | 83.4 | 0 / 0 |
| PCM-only | 17.254 | 20.8 / 50.1 | 161.1 | 133.3 | 29 / 0 |
| Events-only | 16.112 | 11.3 / 15.0 | 54.2 | 33.4 | 0 / 2 |
| Combined, incomplete | absent | 17.4 / 23.6 | 296.5 | 250.0 | 78 / 53 |

| Retention arm/path | Dispatches / settled | Payload construction p95 | Synchronous dispatch p95 | Browser promise lifetime median / p95 / max | Node callback p95 / max |
| --- | ---: | ---: | ---: | ---: | ---: |
| PCM-only PCM | 229 / 229 | 1.0 | 4.0 | 329.7 / 2156.1 / 2442.7 | 3.490 / 9.337 |
| Events-only events | 135 / 135 | 0.0 | 3.8 | 36.7 / 99.2 / 194.5 | 3.758 / 8.953 |
| Combined PCM | 296 / 269 | 0.8 | 3.1 | 4598.8 / 6217.6 / 6798.3 | 3.352 / 47.714, pooled callbacks |
| Combined events | 198 / 180 | 0.0 | 5.9 | 4627.2 / 6165.1 / 6779.0 | 3.352 / 47.714, pooled callbacks |

Node callback conversion/JSON/append p95 was respectively 1.102/0.226/2.241 ms in PCM-only; JSON/append p95 2.509/1.075 ms in events-only; combined pooled JSON/append p95 2.020/1.693 ms and PCM conversion p95 0.718 ms. The global Node 50-ms heartbeat had median 51.291, p95 84.581 and max 487.055 ms across 1,929 intervals. This global measure includes setup and cleanup and cannot be directly aligned to browser epochs.

Observed browser long tasks numbered 0/2/4/0/0 across the five arms, with observer-only maximum73 ms and PCM-only maximum79 ms. Zero reported long tasks in the incomplete combined trace does not establish absence of deferred UI/GPU/GC or protocol scheduling costs.

## Combined failure and retained scope

Combined's saved browser trace spans 23.451 seconds between its exposure marker and cleanup's exposure end, but the delayed controller never certified completion of the fixed 16-second exposure or final current-session running state. Its last timely state reported running, 64 voices, no observed late/audio-late/telemetry drops, context time10.794667, pending retention23 PCM/16 events. This is an observation at that time, not an end-of-arm health assertion.

Cleanup retained 296 PCM dispatches and198 event dispatches, with all matching Node callbacks and finite raw retention (9,472 blocks,1,212,416 samples per path,34,695 events). At browser cleanup there were still27 PCM and18 event promises unsettled after the two-second drain. Both raw paths and metadata were retained in original order; matching Node callback completion does not prove browser acknowledgement settlement. Neither an actual128-cap overflow nor a processor/context error was observed in this run. First actual error/overflow fields remain null; deadline and incomplete drain remain explicit failures.

The first four arms passed only their diagnostic activity/state/cleanup guards. Combined's final activity guards and final pre-cleanup observation are absent; the overall five-arm experiment did not complete. Its failure can reflect the finite global budget, delayed controller observations and retention pipeline behavior together. This experiment does not establish a unique allocation of delay.

## Interpretation and open checks

Combined retention's multi-second browser promise lifetimes are much longer than measured synchronous Node callback bodies. This narrows the investigation to work outside those bodies as well as queueing/settlement behavior, but does not locate the delay in IPC, browser or Node scheduling, frontend promise handling, protocol serialization, disk, deferred view/render/GPU/GC work, or a unique component. Low synchronous original-handler cost does not exonerate later UI work. Product telemetry acknowledgements/drop counts and diagnostic retention promises are separate queues.

Short fresh arms do not reproduce or clear the earlier warm third-segment128-cap overflow. No absolute onset timing, native-loopback calibration, original-mixture identification, complete combined exposure, end-state health, complete retention drain, human listening, or acceptance gate is qualified. Diagnostic timers, wrapper checks, graph observer, trace construction and trace serialization perturb the workload. Browser and Node monotonic clocks remain separate; no transit estimate is obtained by subtracting them.

[analyze.py](analyze.py) derives the read-only summaries from saved traces. [manifest-final.json](manifest-final.json) binds these additions and the immutable captured originals; the original [manifest.json](manifest.json) remains unchanged.
