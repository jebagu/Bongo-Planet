# Bongo Planet — independent native control probe review

Reviewed the closed run [run-2026-10-11T20-56-25-492Z/report.json](run-2026-10-11T20-56-25-492Z/report.json), its saved TypeScript and embedded worker source, and the proposed control-receiver boundary. This review used read-only JSON calculations and source inspection. It launched no worker, browser, audio or load test and changed no application files or acceptance status.

The measured result supports the narrow hypothesis: this worker executed prequeued numerical controls while the parent event loop was intentionally blocked. It does not qualify the integrated application receiver, physical audio or M1.

## Artifact binding

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `report.json` | 21,923,448 | `86f185c0990c477e6aaa36dc85aef77a2bea4ff1498dfbae03513c74f473f139` |
| `receiver-worker-probe.ts` | 39,252 | `821c6ccee5729b4cb15e9246189ac3df8c91b4cffde7fe2a3135e143bea80908` |
| `worker.cjs` | 10,272 | `3a901a4fab4850fb0b73d8257a3233245eb8d5e02ef4d30e8301cb4926af7f39` |

The saved sources match the report's source fields and the previously reviewed frozen probe. Environment: Node v22.20.0, Darwin arm64. Retained labels span 20:56:25.494–20:56:34.041 UTC, or 8.547 seconds. The earlier preparation-only text in `Proposal.md` describes historical preparation, not the status of this completed run.

## Independent record checks

A separate Python readback recalculated from the raw `commands` and `records` arrays rather than accepting the case booleans. All checks below agreed with the report:

- All 6,270 command sequence numbers and all 6,270 applied acknowledgements are exactly 1 through 6,270 in order. Each original send clock equals its acknowledgement's retained send clock and lies before the worker receive and parent report-arrival clocks. All 16 explicit worker clock replies satisfy send ≤ observed ≤ receive.
- The 30,470 retained records contain 6,056 queued triggers, 6,054 dispatch pops, 6,052 actual onsets and two explicit negative late drops. The only queued controls without execution are `cancel-future` and `old-epoch-1`, matching their cancellation and epoch-replacement cases. The stale trigger is not admitted.
- Every onset/late-drop retains the exact command deadline and caller deadline. `actualHrNs` equals the mutation-after witness; before ≤ after ≤ row-observation ≤ parent-arrival. Recomputed before/after deadline errors and queue leads match the recorded numbers. All successful onsets have an attempted and retained mock-voice write, with no rollback. Both negative drops have no attempted mock-voice write.
- All 6,048 throughput IDs appear exactly once, in expected order. Their independently supplied caller deadlines equal the retained anchor plus `floor(i × 1,000,000,000 / 2016)` nanoseconds. Successful actual callback timestamps are monotonic. There are no throughput late drops.
- The maximum recorded pending count is 1,440, below 5,376; active mock voices reach 64, and the final throughput snapshot contains 92 position objects. Queue admission lead across throughput controls is at least 644.040332 ms. This run exercises ordinary bounded traffic, not actual exhaustion of every byte/count limit.

Recomputed throughput absolute execution error: minimum 0.001748 ms, median 0.744976 ms, p95 2.329222 ms, maximum 7.807569 ms. Percentiles use the retained convention: sorted array index `floor(n × p)`. All 6,048 successful callbacks are within 20 ms, not merely the p95. The 6,052 successful mutation brackets have a maximum width of 23,000 ns.

## Independent clock conversion

I recalculated all 96 before/performance/after read brackets, their integer-nanosecond rounding allowance, the selected minimum-width interval and its fixed midpoint. The chosen origin interval is `[947484487132082, 947484487132167]` ns, with fixed offset `947484487132124` ns. The independently held-out startup/end intersection is `[947484487132124, 947484487132126]` ns. The deliberately injected +50 ms origin lies outside held-out compatibility.

For every actual onset, I independently recomputed the caller-domain interval as:

`[(actualHr − heldOutUpper − intendedNodeNs) / 1e6, (actualHr − heldOutLower − intendedNodeNs) / 1e6]`.

All 6,052 intervals match the retained independently bounded records. Their maximum absolute bound is 7.807569 ms; p95 is 2.329222 ms. The conservative 43 ns conversion allowance describes these bracketing calculations for this run. It is not timer resolution, a physical clock-accuracy claim, or a bound on future host descheduling. Caller origin and actual callback are not both inferred from product onset fitting.

## Activated failure controls and lifecycle

| Case | Worker execution error | Parent timer error | Worker execution to parent receipt |
| --- | ---: | ---: | ---: |
| Nominal 100 ms parent block; actual block 105.385125 ms | 0.663293 ms | 75.062126 ms | 74.317041 ms |
| Nominal 250 ms parent block; actual block 258.503333 ms | 2.093459 ms | 229.618543 ms | 227.463334 ms |

Both actual worker mutations occur within the recorded parent-block intervals. The late parent receipts are distinct from the actual execution clocks. The parent-timer controls demonstrate that the blocking intervention activated the dispatch problem.

The separate actual worker block lasts 101.200166 ms and produces a 72.313543 ms late drop with no mock-voice write. The already-past deadline produces a 31.502668 ms late drop. Thus the worker probe retains failures when its own execution is late; it does not reinterpret them as successful onsets.

The heartbeat watchdog releases the epoch after 503.493834 ms from the retained last heartbeat. Its state has zero pending, voices and objects, and the subsequent stale heartbeat does not restore the session or voices. Pending/active cancellation and epoch replacement retain the expected state and absence of execution. Cleanup records a graceful close acknowledgement and observed exit code 0, with no forced termination, worker error or residual session/pending/voice/object state. The final closed record contains 240 queued receipt bytes for the shutdown release; the closed-state snapshot itself proves the release, so this is not an acknowledged delivery of every diagnostic shutdown row.

The report's 11 cases are supported within their stated boundaries. These controls do not substitute for delayed-receipt cancellation/stop races across the real WebSocket bridge.

## Bounded integration assessment

Step 09 explicitly makes control/event delivery to a test receiver its M1 scope; actual spatial sound remains M2. A native worker owning the numerical deadline queue and mock voices is consistent with that boundary. The observed isolation from parent dispatch is a substantiated reason to attempt the bounded integration. This short run does not establish sustained reliability or remove worker/shared-host scheduling risk.

The proposed discriminated `native-monotonic` witness is appropriate: retain worker incarnation, intended/actual BigInt hrtime strings, mutation brackets, the independent Node/hrtime calibration pair, sequence and age. Do not populate render-frame/sample fields for this path. The Node-facing intended time must remain the original received deadline; no recalibration may silently retarget accepted work or fit an error away.

Required integration behavior remains:

- Readiness follows successful worker startup and independent clock validation. Lost worker, malformed/order-invalid receipt, stale calibration, acknowledgement timeout or capacity failure poisons the clock, releases state and disconnects the producer. No automatic restart, diagnostic fallback or missed-trigger replay is implied.
- Both directions retain count and byte limits, ordered applied acknowledgements, a bounded outstanding batch, bounded retired identity tracking and explicit process incarnation. Validate the producer protocol before IPC. A validated control must not be lost because admission accounting and worker acknowledgement disagree.
- The worker checks heartbeat expiry before accepting buffered commands. Cancellation and epoch replacement remain ordered with actual execution. Preserve already-executed onset receipts ahead of the corresponding applied ACK; late receipt delivery must not revive voices after cancellation/stop. Reuse the existing bridge-ordering tests against the new implementation.
- The worker must measure the actual mutation and keep the unchanged 20 ms late rule. Late writes that crossed the bound must preserve honest attempted-write/rollback evidence and restore any displaced voice. Clock uncertainty remains separate and conservatively reported.
- Fresh integrated F01/F04 loops, live ingress/position/ID checks, disconnect/reconnect, cancellation races and bounded failure tests are still required. The browser audio-to-performance conversion remains a separate open boundary. A native control witness does not establish source audio correlation, physical presentation or listening quality.

No blocking defect was found in the retained probe evidence. Production integration is a new implementation requiring its own source review and evidence; this document records no acceptance pass.
