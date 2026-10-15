# Bongo Planet — movement backpressure repair review

Reviewed production candidate `aa50a3f3addf611c33d174874df64107b625d860080061b39ff56b761cd41606`, final test source `93e356d78d575155bf83da3605c10fa8277d99e42ac8c21a60a9d926232a89df`, baseline-01/02 results and traces, and repair-01 result/bindings. No tests, sockets, services, browser, build or PCM analysis were run by this reviewer. The small production diff receives the standard composition pass because it changes asynchronous output/backpressure and interacts with session/control delivery.

The retained baseline-02 has the two intended failures and three passes; repair-01 has five passes and typecheck success. Baseline-01's inadequate unchanged-object case remains clearly distinguished. Expected geometry and object identities in the final controls are independent literals/formulas, and tests call the public adapter API. The byte backlog is an explicit model with actual serialized UTF-8 packet sizes, not observed network behavior.

The new per-object guard fixes the direct cross-component failure in baseline-02: the first movement packet can cross 64 KiB without the next movement packet entering the reliable-control fail-closed path. Clearing caches on the first modeled full drain includes the unchanged object in the resumed snapshot. The five retained controls also preserve the movement-only 500 ms timeout and immediate trigger/cancel failure without deferred replay. Asynchronous browser `close` differs from the synchronous mock callback, but the added `readyState` check and existing OPEN guard prevent subsequent sends while the real socket is CLOSING.

## Remaining constructed failure: repeated partial drains restart the snapshot

**P2, source-constructed confidence 100; not executed.** The current recovery code clears every `p.last` whenever `this.congested` is nonzero, then resets `this.congested` before traversing the same Map order. Consider two objects after one congestion observation:

1. Before each 20 ms tick, a legitimate partial drain leaves `bufferedAmount=65535` (or another value within one position packet of the cap). More than one object still needs the full recovery snapshot.
2. The top-level `>65536` branch does not run. Recovery clears both send caches and sets `congested=0`.
3. The first object's position packet is accepted and increases the buffer beyond 65536. Its cache is set. The next iteration sees congestion, sets its timestamp to this tick and returns before sending the second object.
4. The next partial drain returns below the cap. Recovery clears the successful first cache again, repeats the same first packet and pauses before the second. Periodic heartbeats can consume the remaining headroom on some ticks; they do not provide fairness to later objects.
5. Repeating this legitimate drain pattern prevents completion of the current full snapshot. The local 500 ms congestion age is repeatedly cleared, so this adapter guard cannot terminate the stalled recovery. A real receiver may independently time out; that would not establish successful recovery and is not assumed in this source construction.

The repair therefore fixes a complete-drain case while leaving progress unprotected across fragmented drains. This is not a claim that the old source recovered correctly: it disconnected immediately instead. It is a new reachable incomplete-recovery behavior in the proposed pause/resume implementation.

The minimum necessary design correction is to preserve progress through **one** full newest-state recovery snapshot across successive pauses. Do not repeatedly invalidate already-sent entries before the remaining entries have been serviced. For example, retain a bounded pending recovery-ID set/cursor, read each current coordinate when actually sending, accommodate deletion/new edits, and clear the recovery state only after that pass completes. A fair rotation is another possible implementation if its full-snapshot and edit semantics are explicit. Preserve the 64 KiB policy, reliable trigger/cancel fail-closed behavior and the declared congestion watchdog; do not resolve the failure by raising thresholds or silently dropping unsent objects.

A targeted pure control should model several consecutive partial drains without emptying the queue, then assert progress to every object, newest-coordinate/identity preservation and bounded behavior when recovery never completes. It should retain the existing full-drain, persistent-congestion and reliable-control assertions. No further actual test is authorized by this review.

Until the constructed recovery case is addressed, this review does not give unconditional source approval to the movement repair. Existing five-test results remain valid for their declared scenarios. S01-A43 live socket congestion, actual latest receiver snapshot, visible timeout and receiver release remain unqualified; these modeled tests cannot close them. Root owns the correction and all acceptance decisions.
