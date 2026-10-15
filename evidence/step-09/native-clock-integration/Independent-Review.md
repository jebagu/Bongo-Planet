# Bongo Planet — independent native receiver integration review

Final source readback: 2026-10-11 UTC / 2026-10-12 Europe/Istanbul. Review depth: deep, covering the new worker implementation and its clock, IPC, bridge and shutdown boundaries. No application code or tests were edited by this reviewer. No service, browser, audio capture or test was launched by this review; the implementation owners retained the cited test results.

**Disposition: source blockers resolved; ready for fresh coordinated production evidence gathering. This is not a Step 09 or M1 acceptance pass.**

## Reviewed source binding

| File | SHA-256 |
| --- | --- |
| `src/output/NativeClock.ts` | `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173` |
| `src/output/ReceiverClock.ts` | `5dcea0b57e27436674b77bc9eea2a8973f7da87986e962f5f36fa4ca22dab7b8` |
| `src/output/bridge.ts` | `c24a37011f631df7a979b5c4010b1b96baa22b6799abae4c231c95246deec460` |
| `src/output/RenderClock.ts` | `1e389cb2e035c40ed29176854a6432fd4ad2772b13ca3ef735a9865fe8bb054c` |
| `tests/native-clock.test.ts` | `605ac218d9efe3c1fc1d09ec53fdbe37e11fb4f4ffed410b37e3ce75f3dae785` |
| `tests/bridge-native.test.ts` | `a59569844745b6140cfb25048a31b565d5a209229f4030f096ad76332dd11497` |
| `tests/bridge-ordering.test.ts` | `e8313a245c94a0ae8566ddeebd6fea948ce6067ed5c8e6b6e3d7a077c1fb0fd6` |

The RenderClock readback was limited to the new common invalidation boundary; this review does not requalify that retained diagnostic implementation. The browser audio/model source was outside this review.

## Constructed failure chains and final repairs

1. **Receipt capacity failure followed by state revival.** A receipt-limit failure can occur while popping a due control or releasing an old epoch. The final worker returns immediately from unsuccessful row/release operations, clears the session on fatal failure and does not resume the mutation. Controlled capacity and pending/command-byte/ACK-gap cases cover the bounded failure branches.

2. **Clock or lease expiry inside a due-control burst.** A guard only at callback entry could permit subsequent due controls after shared poison, lease expiry or a stale clock budget. The final loop checks before pop, after pop, before mutation and after mutation. A released lease also clears the pending queue, so the pre-pop path now rechecks that the queue is nonempty. The failed [attempt-05.json](attempt-05.json) preserves the 9/10 result that exposed the empty-queue dereference; it is not relabeled as a pass.

3. **Lease expires during the control write.** With a last heartbeat at 1 s, an actual mutation spanning 1.499–1.501 s and an intended onset at 1.49 s, the post-write watchdog clears objects even though its successful release receipt returns true. Without a session check, subsequent onset construction dereferenced the removed object. The final code checks the local control's epoch again after that guard and returns. The controlled regression verifies no exception, no onset, and empty session/voices/pending/objects.

4. **An expired budget is refreshed before an overdue health callback.** The worker now checks an existing budget before processing any ordinary command, including a replacement clock-budget message. A later refresh cannot erase the expired interval. The controlled expired-budget refresh is fatal. No deadline is retargeted during calibration.

5. **A late voice write loses the voice it displaced.** If a full 64-voice map admits a control at 19.9 ms lateness but its post-write witness is 20.1 ms late, the new voice is rolled back and the old voice plus original Map order is restored. The row retains attempted-write/rollback evidence and no successful steal receipt. Shared poison is checked around this boundary as well.

6. **A fault during graceful close disappears.** The parent no longer drops its first failure merely because close has started. It preserves the reason and rejects a newly failed shutdown even if the worker later acknowledges close and exits 0. Graceful completion also requires both acknowledgement and observed exit; forced termination cannot be returned as ordinary success. Existing failure diagnostics remain visible when a previously failed worker is subsequently cleaned up.

7. **Synchronous worker-send failure still emits OSC.** In the initial bridge, position state was set, `forward()` could synchronously fail and release the session, and the handler then continued to send the position over UDP. The final forwarding boundary checks readiness before admission and readiness plus unchanged epoch afterward. Its controlled regression invokes failure inside `send(position)` and observes no position record or received OSC packet after release.

8. **An invalid execution witness disconnects one producer but leaves the clock reusable.** The final bridge latches evidence failure and calls the clock's synchronous `invalidate()`. Native invalidation sets shared poison and stops availability. Corruption tests reconnect afterward and verify that no new session is admitted. The production CLI selects the native clock; render mode is explicit. There is no automatic restart or fallback.

9. **The age field hides a calibration pair obtained after execution.** Validation now requires pair-after ≤ actual execution and checks `clockPairAgeMs = (actualHrNs - pair.afterHrNs) / 1e6`, alongside bracket algebra, uncertainty, intended/actual conversion, domain, mutation, IDs and finite coordinates. The prior test helper's hardcoded age was corrected to a explicitly synthetic pre-execution bracket. Forged-age and future-pair cases are rejected. The controlled helper is not represented as live measurement.

10. **Worker-close failure leaks listening resources.** The bridge now retains a clock-close error while closing WebSocket, HTTP and UDP resources, then propagates that error. The controlled regression verifies the server has no remaining address after cleanup rejects.

## Clock, ownership and ordering assessment

The native witness is a numerical control witness with BigInt hrtime strings, original intended Node deadline, actual mutation bracket, independently sampled Node/hrtime pair, age, sequence and worker incarnation. It carries no fabricated render-frame or sample fields. The fixed mapping is selected once; subsequent independent brackets increase the retained uncertainty or fail the clock. Parent receipt arrival remains distinct from worker execution.

The worker owns due controls, positions, active mock voices, cancellation and heartbeat expiry. It bounds pending controls at 5,376, objects at 92 and active voices at 64. IPC separately bounds command count/bytes, receipt count/bytes, batch size and outstanding acknowledgement time. Parent and worker sequence validation prevents an applied boundary from silently skipping earlier commands. A buffered heartbeat is checked against expiry before it can update the lease.

At the bridge boundary, an executed receipt arriving after cancellation or stop may be logged from an epoch-qualified tombstone before the ordered applied ACK, without reviving active voices. After the ACK prunes that tombstone, duplicate or cancelled-without-execution receipts are ignored. The controlled tests cover cancel, stop and replacement sessions for both clock domains; namespace keys distinguish slash-containing epoch/ID pairs. These tests exercise ordering semantics, not live timing qualification.

## Retained evidence inspected

- [attempt-08.json](attempt-08.json): 12/12 native module tests pass. [capture-1791753107678/witnesses.json](capture-1791753107678/witnesses.json) binds the exact module/test hashes above. Its saved copies match those hashes. Seven actual worker instances retain graceful close acknowledgements and exit 0; expected negative cases retain their explicit failure reasons. Tests mix actual workers with explicitly controlled embedded-source VM cases.
- [full-unit-attempt-01.json](full-unit-attempt-01.json): 129/129 tests pass, zero failed. This includes 12 native-clock cases, 20 bridge-ordering cases and one real WebSocket-to-bridge-to-native-worker integration case. Source assertions were inspected, including live coordinates, pending/active cancellation, invalidation, absence of audio fields and the strengthened corrupted-witness reconnect checks. The owner reports typecheck passing.
- Earlier failed attempts remain in this directory. The separate [native worker hypothesis review](../receiver-worker-probe/Independent-Review.md) documents the independent raw audit of 6,048 throughput controls and deliberate blocking. Those measurements belong to the probe's saved source, not this newly integrated module.

## Remaining qualification boundaries

Fresh sustained F01/F04 runs must demonstrate the integrated path's exact non-cancelled denominator, real deadlines, IDs, positions, uncertainty and late-drop behavior. A 129-test result and the short isolated probe cannot establish that sustained result. Worker or whole-host descheduling can still violate deadlines and must remain an observed failure under the unchanged 20 ms rule.

Producer audio-to-performance clock correlation remains a separate open boundary. Numerical control delivery does not establish actual product-audio onset timing, physical presentation, human listening, Safari qualification or venue sound. No acceptance ledger or human gate was changed by this review.
