# Bongo Planet structural metadata Plan02 independent review

Disposition: **BLOCK on one exact-cutoff mismatch in this plan; otherwise the proposed structural simplification is sound for the stated conditional family.** Correct the proof's cutoff in a preserved successor before implementation. This is source/plan review only during the separate clock acquisition's quiet window. No test, compile, helper, original JSONL/inventory/PCM scan, service, network or runtime probe was executed. Earlier dual-heap controls/cost failure and the actual resource-unfinished attempt remain unchanged.

Reviewed `Structural-Plan02.md` against the frozen metadata Source02 branch and the literal Engine/MonoSynth comparisons. The complete-ledger certificate, absence of supported in-window mutations and seeded startup history remain explicit premises. Nothing here identifies acoustic entrances or closes an acceptance gate.

## S01 — Proposed cutoff differs from the original engine

Confidence 100. The plan defines `c = end + 1e-8`. Both captured/current `Engine.advance()` emission and due checks use **`end + 1e-9`**, as does the frozen metadata branch. The engine's separate `1e-8` clock-monotonicity/boundary-identity tolerances are not its due cutoff.

Constructed example: `end = 1`, `emission = onset = 1 + 5e-9`. The strict `onset >= emission` certificate passes. The plan's `1e-8` cutoff commits and consumes this event in the current block; the original `1e-9` comparisons do not. That changes admission/voice ownership and potentially the pending-cap decision. The example does not rely on an uncertain host clock or an independent phase alteration.

Minimal correction: use the exact represented expression **`end + 1e-9`** for both commit and due comparisons throughout the proof, implementation and boundary controls. No tolerance increase is necessary: the prefix theorem holds for any common finite cutoff, so correcting this constant preserves the optimization. Keep this original plan/review and make the corrected successor explicit.

## Proof readback with that correction

Given complete finite retained voices, lifetime-unique identities, and an exact checked `onset >= emission` for every voice, any voice satisfying `onset <= c` also satisfies `emission <= c`. Thus after the complete emission phase every globally due voice has been committed. Draining the original pending priority order is equivalent to advancing the immutable global `(onset, sequence)` prefix through `c`. The proof must use the independently sorted ledger values, never observed onset callback order as its modeled oracle.

Effective block ends are monotone in the declared recurrence. Previously consumed entries therefore form an initial prefix of that same ordering, and the remaining globally due entries are precisely the next prefix. Exact onset/emission equality, ties, rounded equal block ends and a later-emitted voice whose onset precedes some earlier-emitted future voice do not invalidate the argument. Strict certificate failure, unsupported command history or incomplete ledger cannot be treated as a proved anchor rejection.

After admissions in nondecreasing `(onset, sequence)` order, deletion preserves the live map's relative order. The first live member is consequently the same oldest voice that MonoSynth selects by minimum onset/sequence. This substitutes a proved order property for repeated minimum scans; it does not assume arbitrary streaming inputs arrive in onset order.

Within one positive finite duration class, correctly rounded binary64 addition is monotone in onset. FIFO expiry keys `RN(onset + d)` therefore remain nondecreasing, including ties. Removing expired heads at every original prune site yields the same surviving active map. A stale stolen token cannot make a later queue member expire earlier; while a head's expiry is future, all later expiries in that class are future too. Cross-class deletion order has no production event or summation effect, provided the final live-map insertion order is preserved.

## Requirements for the next source package

- Preserve capacity **before due draining**. Exactly 5,376 pending voices is legal; the next attempted commit fails. The monotone committed-minus-consumed counter can detect this without a pending heap, but it must not record a would-be 5,377th commit as accepted or publish an overflowing aggregate as a completed transition. Preserve peak pending and the first failure boundary.
- Retain lifetime identity including retired entries, exact membership validation and branch-private cursors/state. Heap removal does not permit skipping membership or input-order certification.
- The duration-class limit of 16 is an analyzer support restriction, not a production capacity change. Exceeding it leaves the domain unsupported/unresolved. Report the complete class list/count before replay; never discard a class to fit.
- Keep every original before-admission and block-end prune and both interruption/late predicates. Rebuild only the relevant class from live survivors before incoming installation, then append exactly one incoming token. Enforce 192-token bounds without duplicate tokens or a reordered active map.
- Use bounded constant-time FIFO operations, such as an explicitly accounted deque/ring, or charge all real moves if using an array front removal. A `pop(0)`-style shift is not a free single primitive under the existing operation table. Charge every class/root check even when no expiry occurs, all stale removals and every compaction visit.
- Preserve old per-block/commit/due/pending-order reserves and add the second immutable sort and certificate work. Named counters must reconcile; no accounting discount or cap increase follows from the proof.
- Resource and implementation/invariant failures remain run failures with the exact candidate unresolved, not conditional clock-inconsistent exclusions. All 32 positive anchor dispositions and the independently derived negative domain remain in scope. The latter remains explicitly unattempted if failure prevents reaching it.

The proposed hand-derived/per-transition controls are suitable after the cutoff correction. Include the concrete between-tolerances example, exactly 5,376/5,377 pending commits before drain, equal/adjacent cutoff values, mixed class rounded expiry ties, stale tokens and compaction with the incoming identity excluded. Preserve the failed HASH-copy setup and repair its reference-state copying openly.

This plan eliminates actual data structures and repeated scans; it is not merely a smaller work multiplier. Nevertheless, completion within unchanged 50 million units/120 seconds/256 MiB remains unproved. The prior 176.76-million projection is preserved as a result of the prior algorithm, and no original-data attempt is justified until a corrected source package and its finite controls receive separate review and root authorization.
