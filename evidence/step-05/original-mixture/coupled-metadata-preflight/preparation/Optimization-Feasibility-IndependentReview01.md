# Bongo Planet metadata optimization plan independent review

Disposition: **GO to prepare the explicit operation table and a separately reviewed source successor. No execution/acquisition GO.** The proposed changes can reduce real repeated work while preserving the current conditional replay semantics. The failed Source02 attempt, its 50-million limit and unresolved candidates remain unchanged.

Reviewed `Optimization-Feasibility01.md`, SHA256 `10ee44e22a32dc66ee5c35cd3e2d73cab9e8c7ff992a05ae27aa2d92eb654d75`, against the previously reviewed Source02 branch and the small actual01 result. No helper, tests, original streams, inventory, PCM, browser or service was executed/scanned for this review.

## Semantic basis

The invariant future `(emission, sequence)` ordering can be computed once per segment. Each branch must own its own cursor, pending heap, active membership and outputs. Sharing only the immutable ordered tuples does not change which emissions are committed before the due-drain step. Sorting once is a real eliminated operation; merely reducing the charge for sorting repeatedly would not be acceptable.

For finite validated onset/duration/time values, the old keep predicate `time < RN(onset + duration)` is equivalent to removing every expiry key `<= time`. Precomputing that identical binary64 sum once preserves its value. The expiry heap must be drained at every original prune location: before each due admission and at block end. It must not move expiry earlier to the emission/commit phase or replace block start by block end.

After pruning, a live minimum of `(onset, sequence)` is exactly the current list's steal choice. Dictionary deletion preserves relative insertion order among survivors, and appending each new unique sequence preserves the list's order. Thus the dual heaps may index expiry and oldest selection without becoming a substitute ordering for future waveform summation. This preflight still computes no waveform.

Bounded stale tokens are legitimate provided live membership is authoritative. Expired tokens discarded from the oldest heap must not be counted as steals; a stolen token later discarded from the expiry heap must not expire a different voice. Current-block erasure requires the actual stolen live voice's original admission-block identity. Counts alone are insufficient; the required intermediate ordered identities and erasure hash are appropriate equivalence witnesses.

## Necessary source requirements

These are implementation conditions for a future review, not newly imposed acoustic gates:

1. **Exact identity and uniqueness.** Validate sequence uniqueness across the whole branch/session, including already expired/stolen voices. A stale token must refer to the exact live identity/generation; do not allow a reused sequence to make an old token live again. Fresh heaps and membership are required for each anchor and reset scope.
2. **Compaction ordering.** Specify whether rebuilding happens before or after installing a new live entry. Rebuild from the authoritative membership and then add the pending token exactly once; rebuilding after insertion followed by an unconditional push would duplicate its token. Both heaps must remain within the declared 192-token bound throughout public mutation boundaries, not merely after an eventual cleanup. A heap rebuild must not reorder the active dictionary.
3. **Original control flow.** Preserve emission-before-due ordering, due `(onset, sequence)` order, pending-cap check before admission, each original prune site, strict equality behavior and the two separate interruption/late-drop predicates. Do not pre-expire a voice against a future pending onset or skip guards during bulk operations.
4. **Failure frontier.** Charge/check while inspecting stale entries and rebuilding as well as ordinary admissions. If a charge fails, do not commit a partially mutated branch or label it inconsistent. Retain the original anchor as unresolved; keep all later anchors and the unattempted negative segment visible as pending. Any shared immutable-order preparation failure must leave the segment uncompleted rather than silently selecting fewer candidates.
5. **Honest accounting.** Freeze the operation table before measuring whether a synthetic workload fits. Count heap comparisons/moves, stale checks, dictionary operations, compaction iteration and actual validation/result work under a coherent conservative convention. Python/library internals not represented by those semantic units must remain explicitly bounded by bytes/RSS/time, not claimed to be measured CPU instructions. Do not tune constants after a failed workload to obtain a pass. Keep the 50-million/120-second/256-MiB and all other caps unchanged.

The plan already calls for most of these safeguards. The compaction insertion point and lifetime uniqueness deserve explicit code invariants because each can pass a simple final-count test while changing intermediate ownership or accounting.

## Evidence required before a source successor is ready

The proposed comparison against the frozen list implementation at every admission and both prune sites is suitable. Keep independently hand-derived cases as well as reference equality: 65 coincident voices, nonconsecutive tie sequences, exact expiry/nextafter boundaries, expire-before-steal, same-block erasure, both directions of stale tokens, multiple compactions, no-due blocks, pending overflow and both clock-gap predicates. Add compaction exactly when an incoming admission reaches the token limit, including a cap/guard failure during reconstruction, and attempted reuse of an already retired sequence.

For synthetic finite enumerations, retain the domain and denominator so a finite equivalence result is not described as continuous clock-family coverage. A dense synthetic cost result can demonstrate operation-table feasibility; it cannot establish the retained capture's completed frontier without a later independently authorized run.

The actual01 result supports investigating an algorithmic cost reduction: it failed on work at 50,000,038 units after about five seconds, not on its wall-time or memory allowance. It does not establish that either proposed data structure will fit the unchanged budget. Completion, source soundness and acoustic identification remain separate questions. This plan does not justify production changes, retimed inputs, increased limits, discarded anchors, a selected best anchor, or any acceptance upgrade.
