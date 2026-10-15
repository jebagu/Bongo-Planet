# Bongo Planet — independent retention diagnostic review

The single diagnostic **failed/incompletely finished**, exiting after 116.232624 seconds. Baseline, observer-only, PCM-only and events-only completed their declared exposures and drained. Combined reached the global 110-second operation deadline and retained unresolved requests after cleanup. This is not a reproduced 128-request overflow: its first-error/first-overflow fields remain null and its observed maxima are 78 PCM / 53 event requests.

Reviewed source SHA-256: `c09a19bf4a17c1e53b684fb6d26190ca02910bc04d1f20f269b584fdf2e9e24e`. The report binds unchanged served production main `3c462437…` and processor `0f0b12c9…` before/after. Independent readback verified the manifest hashes of the retained harness, F06, report, Node heartbeat and every retained browser/Node trace. Node callback sequences and observer batch indices are contiguous; raw file sizes agree with retained sample counters. No browser, service, test or diagnostic rerun was performed by this reviewer.

## Actual denominators

The four completed browser-clock exposure windows are 16.1369, 16.2249, 16.8615 and 16.1107 seconds respectively. Their original-handler exposure records total 22,808 / 22,840 / 23,700 / 22,808, across 129 / 130 / 135 / 129 callback batches. Observer-only retains 6,080 exposure blocks and PCM-only 6,336, each with the checked 32-block batches, 128-sample paths and continuous original indices. PCM-only retained 229 total batches; events-only retained 135. Both drained to zero.

Combined has no successful final exposure snapshot or pre-cleanup snapshot. Its observed browser interval from exposure marker to cleanup request is 23.4514 seconds, which must **not** be presented as a completed qualified exposure. Its last retained health poll still reports running F06 and zero product late/audio-late/telemetry drops. It ultimately retained 296 PCM and 198 event callbacks, including 34,695 event records. The final browser observation retains 27 PCM and 18 event requests pending even though the context and tracks closed; the browser process, contexts and server then closed. Closure does not turn an undrained observation into a pass.

## Same-domain duration findings

Values below were independently recomputed from raw traces using nearest-rank p95. Exposure dispatches are selected by their browser dispatch timestamp; matching Node callbacks use the same kind/sequence identifier, without subtracting unlike clock epochs.

| Arm / stream | Exposure dispatches with retained settlements | Browser promise lifetime p95 | Synchronous browser dispatch p95 | Node callback entry-to-exit p95 |
| --- | --- | --- | --- | --- |
| PCM-only / PCM | 198 / 198 | 2,188.8 ms | 4.1 ms | 3.513 ms |
| Events-only / events | 129 / 129 | 99.2 ms | 3.7 ms | 3.758 ms |
| Combined observed prefix / PCM | 248 / 275 | 6,274.0 ms | 3.1 ms | 2.795 ms |
| Combined observed prefix / events | 170 / 188 | 6,222.4 ms | 5.8 ms | 3.684 ms |

The combined promise-lifetime percentiles are **censored resolved-only summaries**. The missing 27 PCM / 18 event settlements remain in the denominator and cannot be omitted from a completion claim. Maximum resolved lifetimes are 6,798.3 / 6,779.0 ms. All 296 / 198 dispatched requests eventually have retained Node callback exit records without callback errors. This establishes eventual Node-side handling of those payloads; it does not establish that every exit preceded the browser's pending-count snapshot, because that cross-process observation was not independently timestamp-bracketed.

Synchronous original-handler p95/max durations, in arm order, are 12.8/17.0, 19.2/40.0, 20.8/50.1, 11.3/15.0 and 17.4/23.6 ms. Combined's measured handler durations are not uniquely large among these arms. In its observed prefix, browser heartbeat gaps reach 296.5 ms and frame timestamp gaps 250 ms. Its Node heartbeat maximum over the whole arm, including setup/cleanup, is 487.055 ms. Those are scheduling observations, not identified CPU consumers.

The long promise lifetimes are much larger than the directly bracketed dispatch and Node callback spans. This narrows the next investigation to unmeasured waiting or work around these boundaries, including protocol transport/serialization/deserialization, task scheduling and response delivery. It does not identify a particular IPC direction or establish that disk, UI, the operating system or Playwright alone caused the delay. Callback durations are elapsed wall time, not isolated CPU time. The original handler excludes deferred rendering/GPU/GC work. A lack of recorded long-task entries cannot exonerate those paths.

## Scope

The experiment uses a fixed order, fresh pages/contexts, one shared browser process and additional diagnostic timers/traces. It omits the earlier capture's accumulated F02/F03 history. No single-arm comparison is randomized or repeated, and the combined arm was also closest to the global deadline. Therefore this run does not determine the cause of original-mixture capture-02, clear that failed capture, or justify increasing its queue cap or timing limits.

The failure guards correctly preserve the incomplete outcome, censored requests and unavailable final observation. Both acceptance and qualification remain false. A transport-boundary control may be a useful next diagnostic, but it would require a separately reviewed design and coordinated execution; no additional run follows from this review.
