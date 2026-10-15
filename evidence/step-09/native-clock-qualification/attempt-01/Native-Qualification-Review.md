# Bongo Planet — independent native receiver qualification review

Reviewed 2026-10-11 UTC after capture. Read-only review of retained JSON, frozen source, and raw OSC bytes; no browser, service, audio capture, load test, or test-suite rerun. Only this review file was written.

**The F01/F04 pair does not qualify. F01 delivered 179 of 180 required in-window onsets.** Its remaining trigger has a substantiated late callback and an explicit drop. F04 delivered 420 of 420. The failed F01 count must remain in acceptance and in any combined result. A good percentile does not repair a missing onset.

## Bindings and method

All 11 copied source files hash to both `sourceSnapshotAtStart` and `sourceSnapshotAtEnd`. In particular:

| File | SHA-256 |
| --- | --- |
| `src/output/NativeClock.ts` | `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173` |
| `src/output/bridge.ts` | `c24a37011f631df7a979b5c4010b1b96baa22b6799abae4c231c95246deec460` |
| `src/output/ReceiverClock.ts` | `5dcea0b57e27436674b77bc9eea2a8973f7da87986e962f5f36fa4ca22dab7b8` |
| `scripts/bridge-evidence.ts` | `2d3391a935013cd1d5669f9ee913202871ed4f4ca2fe662cb5f7fd3922e7a982` |

The fetched main/processor hashes agree before/after with the declared frozen build and the retained local-build hash map. Rehashing the currently available two dist scripts also agrees: main `3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207`, processor `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`. This is fetched producer-byte and disk-source binding; it is not a separate self-attestation of the running Node module bytes.

Reviewed evidence hashes:

| Artifact | SHA-256 |
| --- | --- |
| `F01-two-minute.json` | `6f26c61fa2f5650e7bc72e47db3368df07f335ddbee4e0482ea858bee4d39b3b` |
| `F04-two-minute.json` | `63cdb5c282f15bc40b83906e36cfa3c51c6f3bf22ca2d551a84a081d03787133` |
| `live-report.json` | `7f7efe85ae0a6bd3f885ffc4b15da00368d287139a2812f9d8904025628bc4e4` |
| `runtime-start.json` | `7010597d06837b119f00fad7fffa6e2c74c85a7ef168194a2ea09792b623b43a` |

The copied fixture hashes match their reports: F01 `c7da2bb4097cf97806019b6e8996e4db308d74414de96d28ea2987e8550a2750`; F04 `a59766f28699a9249d3836e1d677e846f9db62f6088b202fc3a4dc689801eed5`.

Independent calculations used Python standard-library JSON, integer arithmetic, SHA-256, and big-endian Float32 decoding. No production engine or receiver validator was imported. The schedule was regenerated using explicit period/delay constants: F01 period 2 seconds with near/far/kick delays 0.125/0.5/0.625 seconds; F04 gen-3 period 1.5 seconds with shared-a/shared-b/hat delays 0.125/0.25/0.375, and gen-4 period 2 seconds with delays 0.75/0.75/0.625. Positions were compared with the existing Step 02 topology table; that is a consistency check against the topology artifact, not a fresh independent topology qualification.

## Full denominator results

Capture windows are F01 21:14:00.352–21:16:01.286 UTC and F04 21:16:01.498–21:18:02.288 UTC. Both requested 120 real seconds. Their frozen musical windows cover 120.032000 and 120.064000 seconds; reported elapsed monotonic wall durations are 120.352690 and 120.456758 seconds.

Every expected ID has exactly one retained execution outcome: an onset or a late-drop. The following percentiles use **all 180 / 420 outcomes**, including the F01 late callback. They use the retained harness convention, sorted index `floor(n * p)`, capped at the last index.

| Check | F01 | F04 |
| --- | ---: | ---: |
| Independent expected / scheduled | 180 / 180 | 420 / 420 |
| Successful in-window onsets | **179 — FAIL** | **420 — PASS** |
| Explicit in-window late drops | **1** | 0 |
| Duplicate in-window IDs | 0 | 0 |
| Absolute callback error p50, ms | 0.688458 | 0.785250 |
| Absolute callback error p95, ms | 1.289375 | 2.067833 |
| Absolute callback error maximum, ms | **20.920250** | 2.623749 |
| Conservative bound p50, ms | 2.759626 | 2.127167 |
| Conservative bound p95, ms | 3.355460 | 3.409750 |
| Conservative bound maximum, ms | **22.986335** | 3.965666 |
| Producer performance-to-Node uncertainty, ms | 2.038459 | 1.264458 |
| Maximum native receipt uncertainty, ms | 0.077459 | 0.077459 |
| Combined measured-domain uncertainty, ms | 2.115918 | 1.341917 |

The conservative value for each row is `abs(actual callback error) + that row's native uncertainty + the fixture's independent producer bound`. The original F01 report's onset-only p95 of 1.273166 ms and conservative p95 of 3.339251 ms omit the dropped callback. They must not be presented as full-denominator statistics. The recalculated 180-row numbers above still satisfy the numerical p95 threshold, while exactly-once delivery fails.

The independent schedule differs from recorded scheduled times by at most 4.45e-13 ms for F01 and zero for F04. Per-pair expected counts are 60/60/60 for F01, with only gen/kick short at 59 actual onsets; F04 has 80 for each gen-3 target and 60 for each gen-4 target. F04 retains all 40 cross-generator coincident-time groups, including 20 groups where both generators trigger the same node at the same time with independent trigger IDs.

## Clock witness verification

All 600 in-window outcome witnesses, plus the three post-window onsets, satisfy the independently recomputed checks:

- One native incarnation `9b6fdd91-863d-47ad-8b28-cdb9c2a3e8bb` and fixed offset `948531668758666` ns throughout.
- Mutation-before ≤ mutation-after = actual; actual clocks are nondecreasing; bridge receipt arrival follows actual execution.
- `errorMs = (actualHrNs - intendedHrNs) / 1e6`; actual/intended Node timestamps match subtraction of the fixed offset. Each encoded deadline matches its earlier queued onset within rounding to one nanosecond.
- Each bracket's lower/upper endpoints equal before/after hrtime minus independently rounded performance nanoseconds, with the explicit ±1 ns allowance. Width and startup interval overlap checks pass.
- Every witness pair matches the last pair of its declared calibration window. `clockPairAgeMs` equals `(actualHrNs - pair.afterHrNs) / 1e6`; no future pair is used. Maximum ages across retained actual outcomes are 699.755542 ms / 786.572125 ms, below the 1.5-second worker budget.
- Native uncertainty covers each bracket and the recorded cumulative maximum. All 254 calibration windows are present, sequences 1–254 without gaps, with 32 pairs each: **8,128 brackets**. Recomputing their cumulative endpoint bound yields 0.077459 ms maximum.
- All eight startup causal probes contain the worker clock between the parent's send and receipt clocks. Available sampled applied-command rows also satisfy send ≤ worker receive ≤ mutation-before ≤ mutation-after ≤ observation ≤ report arrival (1,403 F01 rows and 1,521 F04 rows).

The eight producer startup samples independently satisfy the half-RTT, midpoint-offset, and additional 1 ms timestamp-allowance equations. The chosen sample is the first minimum-uncertainty sample. Independent start/end probe intervals overlap the frozen startup interval. Their entire intervals are covered around that unchanged offset to derive the producer bounds in the table; no onset was used to fit an offset.

These results qualify the retained **performance-to-Node-to-native-worker numerical control domain**. They do not measure the browser AudioContext-to-performance relationship throughout playback, sound-wave onset, audio-output hardware, or physical presentation. The previously open audio-to-performance boundary therefore remains open; do not expand these bounds into an unqualified end-to-end audio clock pass.

## F01 missing event and available causal evidence

`s2-132`, generator `gen`, node `kick`, was committed for musical onset 86.87566666666666 seconds (86.625 seconds after the fixture origin). Its receiver epoch remains `88325b8c-2f31-483b-b288-66581c8b9ff1-s2-4`.

1. Bridge queued onset 94.98472870901192 at 94.36021341700001: **624.515334 ms lead**.
2. The retained native queued row proves worker receipt at hrtime `948626029027708`, ahead of intended `948626653487375` by **624.459667 ms**. Late network or IPC delivery is not the cause of this missed deadline.
3. The worker popped it at `948626674398833`–`948626674401750`, then measured mutation-before `948626674405041` and mutation-after/actual `948626674407625`.
4. Before-error was 20.917666 ms; final error was **20.920250 ms**. The native row records `mockVoiceAttempted=false`, `mockVoiceWritten=false`, and `lateMutationRolledBack=false`. This was an honest drop before creating the control voice, not a receipt delay mistaken for execution delay.
5. Native receipt delivery followed actual execution by about 7.657 ms. It did not change the callback timestamp or hide the drop.

One retained snapshot contains consecutive native 25 ms health-state records at `948626599974416` and `948626673753458`: a **73.779042 ms observed gap**, straddling the deadline. Both show pending=1, activeVoices=2, receiptBytes=0, unacknowledgedCommands=0. The following dispatch is about 0.654 ms after the latter state report. There is no capacity-pressure evidence near this event.

Approximate alignment via nearby receiver snapshots places the callback around 21:15:27.562 UTC. The independent heartbeat process's surrounding one-second bucket ending 21:15:27.892 reports **51.450208 ms maximum heartbeat slip**, **54.001663 ms event-loop delay maximum**, and 83 heartbeat ticks. The bridge's nearby cumulative event-loop maximum is 35.061759 ms; it does not localize that maximum to this event. Browser telemetry has no reported engine/audio late drops or telemetry drops, but it is not a waveform recording.

This is evidence of a contemporaneous scheduling disturbance across independent observed contexts, compatible with host contention or descheduling. It does **not** distinguish an OS scheduling pause, runtime/GC work, power management, competing activity, or another specific root cause. The one-second host bucket is too coarse for that attribution, and the worker trace has no scheduler/GC attribution. The case establishes a failure of the current system on this run, not a proof that NativeClock's ordering logic is wrong or that a reference machine would inevitably fail.

Do not increase the 20 ms limit, retry the dropped trigger, fit the timestamp to its target, or rerun merely to replace this result. Further work needs a specific causal question and retained evidence, such as worker timer due/dispatch and scheduler/runtime attribution, before choosing a remedy.

## Positions, epochs, denominator boundary, and cleanup

All **599 successful in-window controls** have the expected generator/node provenance, stable integer object mapping, and unchanged fixture XYZ. The missing F01 outcome's diagnostic position also matches; it must not be counted as a delivered control. Each retained onset has a prior position record. Independent decoding of all **21 raw OSC packets** reproduces their addresses, integer object IDs, `,fff` type tags, and big-endian values; maximum difference from the topology coordinates is 2.605e-8. A valid decoded position precedes each object's first actual onset (minimum lead from its latest prior packet: 116.583 ms in F01 and 119.010 ms in F04).

There are no in-window cancellations. Normal-play receipt drains lasted 109.438417 ms and 105.371959 ms, with unchanged active epochs and healthy clocks. The final required scheduled onset is already 1.407 seconds / 1.189 seconds before the frozen window end, so terminal Pause cannot explain the missing F01 event.

The one F01 post-window onset (`s2-181`) and two F04 post-window onsets (`s3-421`, `s3-422`) are retained separately and correspond to later scheduled events. Pause cancels only later IDs `s2-182`/`s2-183` and `s3-423`–`s3-426`. Complete queued accounting is F01 183 = 180 successful raw onsets + 1 late drop + 2 cancellations, and F04 426 = 422 successful raw onsets + 4 cancellations. No stale-session onset or unexpected replay appears in the retained records.

Final bridge and worker states both show empty session, zero objects, zero pending, and zero active voices. Cumulative worker onsetCount=602 and lateDrops=1 agrees with all successful raw controls plus the explicit drop. The browser and independent witness process closed according to the capture report. The native service itself remains ready; its worker-close acknowledgement/exit fields are false because this harness does not shut down the persistent receiver service. Do not describe this run as exercising native service shutdown.

Native `recentRows` retains only 64 rows per snapshot, so sampled snapshots are not a complete command/ACK trace, especially for F04. Full onset/drop receipts provide the complete tested denominator; sampled state rows support only the explicitly described local observations. No deliberate loss, reconnect fault, overloaded fanout, physical spatial sound, Safari, or human gate is newly qualified by these two loops.

**Disposition:** preserve F01 exactly-once **FAILED**, F04 exactly-once passed for this frozen local run, position/provenance consistency passed for delivered controls, and the scoped numerical p95/clock calculations as recorded above. Combined F01/F04 qualification and broader milestone acceptance remain open.
