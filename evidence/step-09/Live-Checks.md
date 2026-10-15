# Bongo Planet — actual receiver checks

This evidence uses installed Google Chrome, the browser OutputAdapter, the real loopback WebSocket bridge on port 5418, and decoded ADM-OSC received over UDP on port 5419. Receiver rows come from `http://127.0.0.1:5418/state`; they are actual bridge receipts, not proposed schedules.

## Short browser checks

```sh
npx playwright test tests/output-browser.spec.ts --workers=1 --reporter=line
```

All four source checks passed in 9.1 seconds; the three applicable immutable production-bundle checks passed in 8.3 seconds. Six paused F07 objects had the correct composition XYZ and decoded OSC addresses; camera orbit preserved object IDs and coordinates; relocation arrived at the correct destination at 60, 15, and 2 render FPS; disconnect, Clear, and page reload removed pending/active receiver work. `paused-F07-receiver.png` shows the actual receiver UI. `movement-traces.json` contains actual position receipt timestamps and ages.

The movement test waits for all six fixture positions to settle before each trace. Each trace contained seven real position receipts. The p95/max receipt ages were 0.642/0.642 ms at 60 FPS, 1.843/1.843 ms at 15 FPS, and 0.643/0.643 ms at 2 FPS. All were below the p95 40 ms / max 60 ms limits, monotonic toward the destination, and ended at correct composition XYZ with matching decoded UDP coordinates.

## Genuine socket stress

```sh
npx playwright test tests/output-browser.spec.ts --grep source-adapter --workers=1 --reporter=line
```

This separate test requires Vite source-module serving and reports an explicit skip on a production bundle. It creates a real adapter/socket, sends 1,000 position edits in one JavaScript turn, and records the resulting real receiver positions. The final passing run coalesced those edits to eight receipts with the correct final XYZ. A synchronous batch of valid future controls grew the measured native WebSocket buffer to 65,694 bytes after 198 attempts. The adapter reported control backpressure and closed; the receiver then had no session, pending triggers, or active voices, with zero additional receiver drops. `backpressure.json` stores the measured buffer, statuses, actual position rows, and released receiver state. No bufferedAmount mock or fake clock is used. Stress controls are scheduled in the future and released by disconnect; this test does not claim they produced audible onsets.

## Timed normal receipt qualification

```sh
npx tsx scripts/bridge-evidence.ts
```

The script runs F01 for two actual minutes, then F04 for two actual minutes, polling actual receiver state every 50 ms. It compares independently calculated angular reach, period, phase, travel and quantization rules with scheduled onsets and actual receipts. Every noncancelled in-window trigger must have exactly one actual onset with the expected node, generator, object ID, and XYZ. Clock uncertainty must be at most 10 ms; actual receiver p95 absolute onset error must be at most 20 ms. The exact comparison window is recorded; pending arrivals beyond its end are cancelled by Pause. Served JavaScript is hashed before and after the run to detect bundle changes. Receiver-session interruption aborts qualification and saves partial receipts.

`interrupted-F01.json` preserves the first attempt, during which a development source reload closed the actual receiver stream. It contains 63 receipts over a 120-second wall capture and three reported failures. Its rejected row was specifically `Error: Duplicate trigger`: the old receiver compared reused engine trigger IDs against historical rows from a prior browser session. That was a distinct source defect from the later reload interruption; it was not a late-receipt timing error. That interrupted attempt does not qualify the two-minute gate.

## Immutable candidate 01: exactly-once gate failed

The subsequent two actual 120-second loops completed on an unchanged served production bundle. Concurrent builds, reviewer work, and other browser tests were acknowledged by the coordinating agent during this capture; event-loop load was not instrumented then, so CPU causation is unproven. Original reports remain byte-for-byte in `candidate-01-F01-two-minute.json`, `candidate-01-F04-two-minute.json`, and `candidate-01-live-report.json`. The main reports correct the F04 comparison scope: raw receipt total was 418, of which one (`s3-421`) occurred beyond the recorded exclusive audio end during Pause processing; the in-window total was 417.

| Fixture | Independently expected | Actual in-window | Missing | Successful receipt p95 absolute error | Adapter clock uncertainty |
| --- | ---: | ---: | ---: | ---: | ---: |
| F01 | 180 | 176 | 4 | 1.297 ms | 0.400 ms |
| F04 | 420 | 417 | 3 | 1.438 ms | 0.400 ms |

The independent schedule matched engine counts and timestamps; successful actual receipts matched object IDs, node/generator provenance, and XYZ. Low p95 error among successful receipts does not compensate for missing triggers. Independent clock probe uncertainties were 0.150–1.000 ms and start/end offset changes were +0.001 ms (F01) and -0.478 ms (F04).

| Fixture / missing ID | Onset after first emission | Committed travel delay | Queued before receiver deadline | Actual late callback |
| --- | ---: | ---: | ---: | ---: |
| F01 / s2-13 | 8.125 s | 125 ms | 100.981 ms | 37.193 ms |
| F01 / s2-46 | 30.125 s | 125 ms | No queued row | Rejection association inferred below |
| F01 / s2-155 | 102.500 s | 500 ms | 498.732 ms | 36.268 ms |
| F01 / s2-169 | 112.125 s | 125 ms | 124.630 ms | 39.409 ms |
| F04 / s3-69 | 18.625 s | 625 ms | 620.621 ms | 26.299 ms |
| F04 / s3-96 | 26.625 s | 625 ms | 623.535 ms | 28.133 ms |
| F04 / s3-259 | 73.625 s | 125 ms | 104.377 ms | 53.252 ms |

The six queued misses were delivered 101–624 ms ahead of their deadline and later dropped by the receiver callback's 20 ms rule. Receiver/host timer delay therefore explains those recorded late callback outcomes; late client delivery does not explain those six. The separate unqueued `s2-46` is associated by same-emission companion times with the unique `Onset outside scheduling window` rejection, approximately 131.143 ms after its intended deadline. This association is an inference because that rejection row lacked a trigger ID. Drops occurred throughout the loops, including 500/625 ms committed delays; they were not confined to startup or the shortest delay.

`failure-analysis.json` retains the exact missing IDs and correlation calculations. Periodic browser AudioWorklet status was not serialized for candidate 01, so it cannot establish browser thread or audio timestamp causation. No browser page errors occurred. For candidate 02, the updated capture script records browser audio/status/clock samples once per second, full final engine events, receiver `timing` samples, per-queued lead/time fields supplied by the bridge, and a separate Node process with a real 10 ms heartbeat plus event-loop delay/utilization. The updated script passed TypeScript checking and its isolated heartbeat emitted a real sample. Criteria and scheduling semantics remain unchanged.

## Final candidate 02 quiet capture: overall gate failed

After the independent soak browser closed and the audio capture completed, the coordinator froze source commit `62bccbabffd5523feae2b92358907faa00f706ae` and declared no further UI, tests, compiles, or builds during this run. Two real 120-second loops ran from 20:52:59 to 20:57:01 local time. The served main bundle `/BongoPlanet/assets/index-CmWoIPXv.js` SHA-256 remained `608ba66763385e1b87e7f99d210c2fb78e6bc3bd4f10b66c5cb1a7eb577ef34a`; tracked main/output/engine source snapshots also remained unchanged. The unchanged main asset refers to the same processor asset; a separate pre-run processor-file SHA-256 was not recorded.

| Fixture | Independently expected | Actual in-window | Successful receipt p95 / max absolute error | Adapter uncertainty | Independent probe uncertainty |
| --- | ---: | ---: | ---: | ---: | ---: |
| F01 | 180 | 178 | 1.358 / 10.916 ms | 0.350 ms | 0.150 ms |
| F04 | 420 | 420 | 1.234 / 5.033 ms | 0.350 ms | 0.150 ms |

F04 passes its in-window receipt and timing checks. One additional raw receipt (`s3-421`) beyond the exclusive audio end is retained separately and excluded from these counts. Independent onset arithmetic differed from engine scheduling by less than 0.000001 ms. Independent clock-offset changes were +0.027708 ms (F01) and -0.046875 ms (F04).

F01 still fails exactly once: `s2-62` (`far`) at 40.500 seconds, committed delay 500 ms, was queued 496.024 ms early and its callback was 66.385 ms late. `s2-63` (`kick`) at 40.625 seconds, delay 625 ms, was queued 621.172 ms early and its callback was 44.642 ms late. Both were actual receiver late drops, with no scheduling-window rejection. They cannot be explained by late arrival or the smallest permitted travel delay.

Mapping receiver monotonic time to host wall time through the independent clock probe and nearest browser sample places both drops in the same independent witness interval: 94.263 ms maximum 10 ms heartbeat slip, 97.780 ms maximum event-loop delay, and only 59 heartbeat callbacks in approximately one second. Across all F01 intervals, witness maxima were 153.718 ms slip and 163.709 ms event-loop delay. The bridge's cumulative delay maximum rose from a pre-existing 134.480 ms to 165.413 ms. F04 witness maxima were 21.772 ms slip and 28.951 ms delay. These measurements are consistent with shared host/process descheduling or a receiver-service scheduling limit; they do not identify an OS cause or establish intrinsic hardware incapability. Bridge maximum/utilization are cumulative since bridge start; witness maxima reset each second.

Browser samples stayed running with zero engine late drops, audio late drops, voice steals, or telemetry drops. No browser page errors occurred. The periodic audio-versus-performance offset span was 5.900 ms (F01) and 5.433 ms (F04), much smaller than the two callback delays, though one-second sampling is not a complete browser scheduling trace.

`candidate-02-F01-two-minute.json`, `candidate-02-F04-two-minute.json`, and `candidate-02-live-report.json` preserve this capture; `quiet-analysis.json` contains exact missing triggers and nearby witness/browser samples. Candidate 01 failures remain preserved. The capture exited with failure, closed its own Chrome browser, terminated its own witness process, and released the receiver: no session, objects, pending events, or active voices. The overall gate remains failed. No further retries, timing-policy relaxation, or scheduling changes were performed.

## Scope

These measurements qualify local delivery and independent object metadata only. They do not establish actual venue synthesis, calibrated spatial rendering, directional listening, or audible/visual synchronization. The separate stress test proves the adapter's bounded socket response on this machine; it does not simulate a venue network.
