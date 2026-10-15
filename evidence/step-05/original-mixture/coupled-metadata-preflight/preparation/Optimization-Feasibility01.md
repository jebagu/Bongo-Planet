# Bongo Planet — metadata optimization feasibility 01

Read-only source/result planning after attempt01,2026-10-12. No original JSONL/inventory/container/PCM reread, source change, test, service or new actual run. Reviewed only the small retained result and frozen branch source. Source02/current actual remain immutable and failed; this proposes a separately authorized successor, not a retry or altered result.

## What the failure establishes

Attempt01 validated73152 ordered metadata blocks,111860 event rows/546 callbacks and120 native detections with one ordinal offset−45440. It retained all468 groups. Work stopped at50,000,038 counted units after5.050095167s, observed process maximum RSS136,790,016B. Time/RSS were not the recorded limiting guard. F02/F03/F06 each retain all8 necessary anchor dispositions; first F02 anchor was conditionally clock-fatal. F08 completed2 of8, leaving6 explicit unresolved anchors; the negative segment was not replayed. No completed execution-family or acoustic certificate follows.

Frozen branch charges `3*len(active)` for admission/prune/min/removal scans, a pending heap ordering bound, and `len(active)` again at every block-end prune. Dense active membership is generally64, and F06 retained14096 derived onsets per completed branch/F08 retained40340 (including explicit edge/tail onsets). Completing eight branches of both implies435488 admissions, with roughly83.6million units from the three64-member admission scans alone if membership stays full. This arithmetic is a workload explanation, not newly measured phase profiling or a claim every admission sees64. The frozen algorithm cannot reliably fit the unchanged50million budget simply by waiting longer.

Each branch also sorts the identical committed future tuple list anew and charges n*bit_length(n). That is real repeated work, not a necessary branch-specific state transition. The mutable pending and active state must remain independent; future ordering need not be recomputed.

## Minimal structural successor proposal

First prepare the immutable `(emission,sequence)` future ordering **once per segment**, then use a separate cursor and pending heap for every anchor. Count the sort/validation actually performed once; keep all per-branch reads/admissions/heap work. No shared mutable cursor, pending state or active membership. This saves repeated sorting rather than deleting its count while still performing it. All candidates, clocks, due order, pending5376 checks, exact interruption/late guards, expected/event comparisons and tail disposition remain unchanged.

Replace the repeatedly filtered active list with one insertion-ordered active dictionary plus two bounded priority heaps:

- Expiry heap: `(RN(onset+duration),sequence)`. Prune at exactly the existing block-start-before-each-admission and block-end locations, deleting live entries whose expiry<=time. Computing the same binary64 sum once gives the same value as repeating it in the list predicate; no epsilon or new rounding formula.
- Oldest heap: `(onset,sequence)`. At64 live voices, remove the first live minimum, preserving literal oldest-onset/sequence tie behavior. Do not substitute insertion order without proof of monotonic admissions.
- Active dictionary keeps admission order. Removing an entry leaves the other entries' order unchanged; a new voice appends. This retains the reference list's summation order for a possible later waveform stage, though this preflight still renders none. Sequence/identity uniqueness is validated; do not reuse stale heap entries across a reset/session.

Expiry or stealing leaves a stale token in the other heap. Before using a root, check its exact live identity and discard stale tokens with every operation counted. Cap each heap at192 tokens; before a push would exceed that cap, rebuild that heap from the at-most64 live entries. Count all iteration, key creation/comparison, moves and heapification work; compaction is not free and stale rows cannot be silently skipped in accounting. No unbounded lazy-deletion accumulation or reliance on garbage collection. Expired entries never count as steals; stolen-in-current-block erasure count/hash must match the frozen list reference exactly. Preserve zero-duration rejection, strict expiry equality, fractional clocks and the two distinct interruption/late tests.

Two heaps avoid per-admission64-member min/filter/remove and per-block64-member filter when nothing expires. This is more robust than relying on the current event stream being globally monotonic in onset; it handles all declared branches and tie cases. Indexed dual heaps could avoid tombstones but introduce more cross-index mutation complexity. They are not the first proposal.

## Honest work and resource accounting

Keep120s/256MiB/50million and every byte/line/sequence/anchor/detail/output limit. No500million allowance. Do not merely change `3*len(active)` to a smaller multiplier while retaining those scans. The optimized data structures must actually replace the scans.

Before successor implementation freeze a semantic operation table, applying the existing charge convention consistently: input/block/trigger operations, key comparisons, heap entry reads/moves, live/stale membership checks, dictionary insert/delete, expiry additions, active iteration and compaction all cost explicitly counted units. Use instrumented small heap operations or a reviewed conservative upper bound for every hidden heap operation; do not count only public heapq calls. Continue counting pending heap ordering and all source validation, candidate inspection and result assembly. JSON/hash machinery remains separately bounded by the unchanged bytes/time/RSS rules; this is not a count of every Python/OS instruction. Never present an abstract counter as actual CPU instructions.

Sharing immutable future order and replacing linear active scans should substantially reduce real work. It is not yet a demonstrated<=50million completion: worst-case tombstone/compaction and primitive-accounting constants need source/control measurement. If a sound bound or pure controls indicate the successor still cannot finish, report that before actual; do not lower accounting costs, skip anchors or enlarge the cap. Source02 failure remains valid even if a genuinely different algorithm later succeeds.

## Independent comparison controls before source GO

Use synthetic production-shaped event/quantum scenes, no original files. Compare optimized and frozen list reference at **every admission and both prune sites**, not just final counts: ordered active sequence IDs, pending/due order, stolen sequence, expiry removals, current-block erasure sequence/hash, counters, effective clock and branch disposition. The frozen list is an equivalence reference; hand-derived outcomes provide separate expectations.

Required independent outcomes include65 simultaneous1s voices (sequence1 stolen before render); equal onset/nonconsecutive sequence ties; mixed short/long durations with exact expiry and nextafter neighbors; expiry before stealing; an expired current-block voice removed without a steal; oldest-token stale after expiry and expiry-token stale after stealing; forced multiple192-token compactions with unchanged live order; continuous dense replacement without stale memory growth; no-due blocks and block-end expiration; first-play fractional anchors/double repeats;99ms start gap with101.667ms engine gap; separate late predicates; pending5376 overflow; incorrect telemetry order; interruption during a heap rebuild. A malformed duplicate sequence must fail rather than overwrite live membership.

For an exhaustive small finite control domain, enumerate independently specified durations/onset ties/admission blocks, comparing all intermediate states; this is a finite source test, not continuous clock-family completion. Instrument work for sparse and saturated controls, including stale/compaction cases, and retain both raw accounting and allocations. Fixed legal dense synthetic workloads may demonstrate cost under the existing cap without scanning original data. Require exact equality of all reference outputs, preserve every failed control/snapshot and submit source plus operation table for Astra/root review before any actual decision.

## Decision

A bounded structural optimization is credible: reuse genuinely invariant future sorting and index active expiry/oldest decisions rather than rescanning64 entries. No production repair, clock retiming, changed ownership, selection of best anchors or acoustic inference is proposed. New code and any actual scan remain unauthorized by this note. The current six unresolved F08 anchors, unattempted negative, startup/history premises and always-false waveform/onset qualification remain explicit.
