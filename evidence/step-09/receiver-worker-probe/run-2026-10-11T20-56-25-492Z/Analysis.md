# Bongo Planet isolated native worker probe

The single authorized actual run passed 11/11 cases and 48/48 checks, with no recorded failures or worker errors. It ran 2026-10-11 20:56:25.494–20:56:34.041 UTC on Node22.20.0, Darwin arm64. No application runtime was changed. Exact captured source SHA256: `821c6ccee5729b4cb15e9246189ac3df8c91b4cffde7fe2a3135e143bea80908`; embedded worker SHA256: `3a901a4fab4850fb0b73d8257a3233245eb8d5e02ef4d30e8301cb4926af7f39`.

| Requested parent block | Actual block | Queue lead | Actual worker control error | Actual parent timer error | Receipt arrival after worker mutation |
| --- | ---: | ---: | ---: | ---: | ---: |
|100 ms|105.385125 ms|549.844041 ms|0.663293 ms|75.062126 ms|74.317041 ms|
|250 ms|258.503333 ms|549.923666 ms|2.093459 ms|229.618543 ms|227.463334 ms|

Each worker control executed once during the independently recorded parent block. The parent-timer negative controls failed the unchanged20 ms bound. Their report arrival delays are retained separately from actual worker `hrtime` mutation completion.

The three-second2016 controls/second case executed6048/6048 controls once, with zero duplicates and zero late drops. Actual absolute error p95 was2.329222 ms; maximum7.807569 ms. Minimum queue lead was644.040332 ms. Peak pending was1440/5376, peak active mock voices64/64, and92 objects were populated. All6052 successful controls across the full probe were independently assessed against held-out caller-origin intervals: p95 bound2.329222 ms, maximum7.807569 ms.

The fixed performance↔hrtime origin was independently bracketed before scheduling.32 held-out startup and32 ending brackets were compatible; the derived start/end conversion bound was0.000043 ms. Their held-out common origin interval was `[947484487132124,947484487132126]` ns. These are numerical bounds for the shared native clock conversion in this run, not physical clock or acoustic precision claims.16 cross-thread clock requests and6270 applied-command ingress records satisfied send≤worker observation≤parent receipt containment. An injected50 ms wrong origin was rejected independently, preventing conversion-offset errors from canceling between scheduled and reported values.

Actual cancel released an active mock voice and pending future control; the cancelled future control never executed. Epoch replacement removed old pending work; stale commands did not produce old onsets. Producer heartbeat expiration cleared queue, voices, objects and epoch after503.493834 ms, and a later stale heartbeat did not revive the epoch. Past-deadline input dropped at31.502668 ms error; deliberate worker blocking dropped at72.313543 ms error. Neither negative control wrote a mock voice. Worker descheduling therefore remains a real failure path rather than being hidden by the parent-isolation result.

The worker completed an acknowledged graceful close and exit0. There was no forced termination, browser, microphone, AudioContext or physical output. All6270 raw commands and30470 records, exact source and worker snapshots, failures and cleanup are preserved in `report.json` and accompanying files. No unchanged rerun was performed.

This supports the bounded hypothesis that a worker-owned native monotonic control queue can remove UTC conversion and parent event-loop delay from already-ingested control callbacks. It does not qualify application WebSocket/UDP ingress, actual producer audio/main-thread mapping, F01/F04 exactly-once integration, physical audio presentation, prolonged host scheduling, or actual worker restart/recovery. Incarnation rejection used explicitly tagged stale traffic against one real worker instance. Production integration and its independent qualification remain required.
