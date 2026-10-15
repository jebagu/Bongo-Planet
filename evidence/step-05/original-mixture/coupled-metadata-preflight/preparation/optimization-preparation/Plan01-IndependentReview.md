# Bongo Planet metadata operation-table independent review

Disposition: **GO for separate source implementation and pure control preparation only.** No original-data execution is approved. The table describes a genuinely different bounded algorithm without revising the failed attempt's counter or raising its limits. Completion within 50 million units remains unproved.

Reviewed exact documents:

| Document | Bytes | SHA256 |
|---|---:|---|
| `Plan01.md` | 8,810 | `46149c33c9e4333cddb9747597793d581b4f60863176983462752969abb45858` |
| `Work-Operations01.md` | 8,521 | `5f870e67609269f50802283fe86d6f04e61ad9a6edbfae389a6f7552ced584e1` |

This is a bounded document/source-semantics review. No implementation, helper, test, original inventory/JSONL/PCM scan, browser, or service was run. Source02 and actual01 remain immutable.

## Accepted structure

The plan resolves the prior identity and compaction hazards explicitly: lifetime `(session, sequence)` uniqueness includes retired voices; each anchor has fresh state; rebuilding uses only surviving live entries **before** the incoming voice is installed; insertion then creates exactly one token per heap. The insertion-ordered map remains authoritative for survivor order. Rebuilding a priority index does not rebuild that map.

Expiry by the identical precomputed binary64 `onset + duration`, removing keys `<= time`, is equivalent to the old `time < onset + duration` keep predicate for validated finite values. The stated before-each-admission and block-end prune sites, capacity-after-prune steal, `(onset, sequence)` ordering, same-block erasure identity and emitted-before-due ordering preserve the original semantics. No insertion-order shortcut replaces oldest selection.

Future order is immutable and shared only within the segment. Branch cursors, pending heaps and active/lifetime membership remain private. The 32 positive necessary anchors are all retained in fixed order; the negative domain is derived rather than guessed. All 468 group rows remain present before branch work. This scope remains conditional metadata replay, not a complete execution-history or acoustic family.

## Accounting judgment

The table fixes a coherent conservative *source data-operation* model before implementation. It retains the old per-block/commit/admission/pending-order and input/validation reserves, removes only the two active-list scan charges when those scans are actually removed, and adds concrete successor heap/map/identity/expiry/compaction operations. The future-sort reserve is paid once only because the identical sort is actually performed once; concrete sort operations are charged in addition. This is not a retrospective claim that Source02 used the new units.

Explicit heap and mergesort primitives make reads, writes, comparisons and index work reviewable. The proposed eight/thirteen-level bounds are upper bounds for active/pending heap paths, not complete operation counts. Heapify, second-child selection, final writes and copied tails still count. Stable merge passes must include every real copy, including any final destination copy; array replacement must not conceal a scan. The plan already excludes interpreter/hash-table internals from an instruction-count claim and retains independent byte/RSS/time limits.

The extra conservative charges may consume the apparent savings. In particular, concrete pending-heap work, new lifetime membership and two active heap indexes are additive to the retained reserves. A cost worksheet and tiny manually counted controls should precede claims that a dense synthetic workload fits. A broad upper bound above the cap is a feasibility warning, not grounds to lower costs or skip anchors. A synthetically observed count below the cap is not proof about the original capture.

## Required details for the source review

1. Keep named, reconcilable counters whose sum equals global charged work, including failed attempts and stale/compaction paths. Charge before the corresponding operation or bounded batch; do not charge based on its eventual success. Counter bookkeeping itself is not recursively counted, as expressly documented.
2. Separate resource exhaustion and implementation/invariant failures from legitimate candidate inconsistency. A duplicate live token, invalid heap invariant, missing identity or unexpected exception must not flow through a generic `ValueError` catch and become evidence excluding an anchor. Only the documented clock/admission/sequence predicates may produce a conditional inconsistent disposition. Resource or algorithm failure leaves the branch/future segment unresolved and the run failed.
3. Preserve original strict boundary arithmetic and guard order. For a failure during rebuilding or just before/after install, retain the exact original anchor as unresolved and do not commit a partial branch. A future-order preparation failure must retain the whole unprocessed domain. The negative segment remains explicitly unattempted if not reached.
4. Test compaction at exactly 192 existing tokens, stale roots in both heaps, reuse after expiry and after stealing, exact/nextafter expiry, and interleaved equal-onset identities. Compare ordered live scalar records at both prune sites and every admission, not only final counts or membership sets.
5. Bind the frozen list reference and retain hand-derived expected transitions separately. Finite exhaustive control domains must state their bounds and denominator; they do not prove continuous-clock completeness. Synthetic dense controls remain within the unchanged 120-second/256-MiB/50-million and storage/detail caps.

No blocker in the two documents prevents preparing that source and its controls. The unchanged caps, original failure, six unresolved F08 anchors, unattempted negative and unproved history premises must remain visible. A later source GO and root's separate exclusive authorization are still required before any original-data scan.
