# Bongo Planet — movement recovery repair 02 review

Reviewed candidate OutputAdapter SHA256 `afb87dc21bc880f1f2d855c42949b40f71232a3c3d0528570b061033cd76e17b`, frozen six-control source `db7e9cd51290919dd50fd910081edd2ed1e20f28d227a1a7f447cb627d3775df`, and repair-02 retained results/traces. This was source and retained-data review only; no tests, browser, network, services or build were run.

The six retained controls pass. The previously constructed partial-drain starvation was independently reproduced against repair 01 and is fixed for unchanged membership: repair 02's trace sends `near` at 1,040 ms, `far` at 1,060 ms, then both in a later pass, rather than repeatedly sending only `near`. The pending Set survives a pause; successful sends remove their own ID, and coordinates are computed at send time. Deleted IDs are skipped. `connect()` and successful `start()` clear recovery state, so reset/load/clear/new-session starts do not reuse the old Set. Existing reliable trigger/cancel fail-closed and movement-only timeout checks still pass.

## Remaining regression: edits during recovery can bypass position-before-trigger

**P2, source-constructed confidence 100; not executed.** The Set snapshots membership when recovery begins. While it exists, `tick()` visits only that Set, even when normal dirty-position state has changed. `setScene(edit)` currently does not add new or already-served dirty IDs to it.

1. Establish a musical session and positions for `near` and `far`. Create congestion and partially drain so `near` is sent and removed from `recoveryPositions`, leaving `far` pending.
2. During that recovery, use a valid scene edit to add a third sound node. Its position has `last=''`, but its ID is absent from the existing Set. The musical session remains the same.
3. Drain the buffer enough for the remaining snapshot and a reliable command, then deliver a same-session trigger for the new node before the ordinary interval tick.
4. `event(trigger)` calls `tick()`. It sends only `far`, empties the recovery Set, sets it to null and returns. It does not then visit the normal position map in that same call.
5. `event(trigger)` immediately sends the new node's trigger. The receiver has no preceding position/object binding and rejects it at the unchanged `Position must precede its trigger` guard. The new sound is lost despite the available buffer.

The same omission affects an already-served node moved during recovery: after its interpolation completes, a same-session trigger can be sent using the receiver's old XYZ because its newly dirty cache is outside the pending Set. `event(cancel)` also marks surviving nodes dirty after the receiver removes their bindings, but currently does not enroll them in recovery; this requires the same reinsertion policy. These are interactions between public edit/event paths and the new recovery-only traversal, not a criticism of the modeled unchanged-membership control.

The minimum correction is to include every newly added, newly dirty or cancellation-invalidated surviving node in an active recovery pass, preserving the existing order/progress of pending IDs and computing the current coordinate at send time. Alternatively, after completing recovery, flush ordinary dirty positions in the same tick before returning to trigger admission. Deletion should remove/skip obsolete entries; connect/start should keep clearing the state. Retain reliable-control immediate failure and existing limits. Do not restore whole-pass cache clearing, which recreates the original starvation.

Add a public-interface modeled case establishing the same musical session before congestion, then insert a new node after the first recovery send and deliver its trigger with room in the buffer. Require its position before its trigger. A companion already-served move/cancel case should check the restored current XYZ/binding. These are proposed source controls; this review authorizes no execution and makes no live network claim.

Repair 02 therefore resolves the retained partial-drain finding but is not yet source-approved for integration. S01-A43 live buffered delivery, visible timeout and receiver release remain separate open evidence. The original failures and all six passing scenarios remain preserved. Root owns the next correction and acceptance decisions.
