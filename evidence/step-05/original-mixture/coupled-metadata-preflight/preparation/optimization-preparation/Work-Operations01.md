# Bongo Planet — proposed successor work operations 01

Source design only; no implementation, controls, original-data run or PCM read. Applies to a future separately reviewed successor, not frozen helper Source026d417b4a…/attempt01's recorded50,000,038 units. Same50,000,000 cap. This table describes algorithm/data-operation units, **not CPU instructions or every interpreter/allocator/hash-table probe**. Instrumentation itself is bounded by unchanged time/RSS/bytes; recursively charging the counter would not define a useful finite measure.

## Explicit charge rules

Charge units before doing bounded batches of the indicated work. Do not defer a large hidden operation beyond a guard or count only a public heap call. Counters accumulate across every source/input phase and every anchor; no per-branch reset. A guard can stop mid-operation; retain the branch/frontier as unfinished, never as rejected/completed. Instrumented primitives must be independent of result reporting and cannot choose a lower charge based on success.

| Operation | Charge |
| --- | --- |
| Original input line/block/native detection/ledger validation/anchor inspection | Keep existing charge plus actual added successor data operations; no removal of validation or domain work. JSON parsing/canonical hashing remains bounded by unchanged bytes/time/RSS, as in Source02. |
| Numeric/string key comparison (`<`, `>`, `==`, boundary test) in successor ordering/membership algorithm |1 each comparison actually evaluated, including loop/root/capacity/expiry checks. |
| Priority tuple key field read or construction |1 per field read/write; cache a read value only if the source actually reuses it. |
| Heap entry array read, array write, append/pop, or move |1 each source data operation. A swap is two reads+two writes; it is not one free operation. |
| Parent/child index calculation or ordinary arithmetic for successor state/expiry |1 each evaluated arithmetic operation; compute RN(onset+duration) once and charge its addition. Preserve source IEEE result. |
| Active map membership/lookup/insert/delete |1 each semantic map operation. Successful and stale lookups both count. Hash-table internals are not presented as independently measured instructions. |
| Live/stale token decision, loop advance and stale removal |Charge its actual comparisons/reads/map operations and heap pop; no zero-cost stale discard. |
| Active iteration, live-key extraction and heap compaction |Charge every visited entry, field access, output write and heap operation. Checking whether compaction is required counts. |
| Per-anchor future cursor/pending queue/admission/seen-order/hash bookkeeping |Retain Source02 block/trigger work and charge added reads/moves/comparisons/mutations; pending5376 check is unchanged. Hash byte processing remains separately byte/time bounded. |
| Future-order preparation |Retain the old n*bit_length(n) ordering reserve **once for the sort genuinely performed once per segment**, then charge explicit successor comparison/move/index work described below. Do not retain repeated sorts while deleting their charge. |
| Clock, interruption, late and prune-boundary checks |Preserve all old checks and count successor-evaluated arithmetic/comparisons; both processor-start and Engine-end interruption predicates remain. |

There is no new equivalent-unit discount, smaller active-scan multiplier,500million allowance or omitted candidate. Existing generic overhead charges remain even where additional precise charges make the table conservative. Final source must expose named counters so reviewers can join their sum to global work, including compaction/stale work. Table revision would require a new pre-actual source review; it is not adjustable after a resource failure.

The exact Source02 accounting mapping is: preserve one unit per block and per future commit; preserve one unit per due admission plus `max(1, len(pending).bit_length())` after its pop; preserve the existing input/validation charges. Replace the old `3*len(active)` admission scan and block-end `len(active)` filter charge only because those actual scans are removed, charging all replacement operations above instead. Preserve the `n*max(1,n.bit_length())` future-sort reserve once per segment, plus the explicit sort work. A replacement that still performs a list scan must charge its visits; it cannot claim that scan eliminated. The pending heap's old reserve and its concrete new heap operations are additive, not interchangeable. Source02's recorded total is not retroactively restated in the successor units.

Lifetime uniqueness requires a branch-private retired-or-admitted identity set, not just current live membership. Count its membership tests and successful insertions separately from live-map operations. Tokens carry `(session, sequence)` identity; the validated whole-session sequence domain forbids reuse even after expiry or stealing. Exact identity comparisons and any token-field retrieval count. This bounded set uses the unchanged 50,000-sequence/session limit; no unbounded generation history is introduced.

## Ordering and hidden-operation strategy

Prefer tiny explicitly counted binary-heap push/pop/heapify routines for the two active heaps **and pending heap**. Keys are literal `(onset,sequence)` or `(RN(onset+duration),sequence)`; equality/tie comparisons count individually. A sift can visit at most ceil(log2(max(heap-size,1))) levels, but level count is not its entire cost: reads, key comparisons, moves and index calculations are separately charged. Two-child selection and final leaf/root operations count. This makes the actual source operations observable and avoids treating `heapq.heappop` as one unit. Capacity192 per active heap and5376 pending remain hard bounds.

If installed standard heap primitives are retained instead, source must bind/read their exact algorithm and precharge a proven conservative bound including all of those operations. A bare bit_length multiplier is insufficient for a new exact-operation claim. This fallback is not automatically approved; explicit heaps are the proposed small implementation.

Future ordering is immutable and prepared once per segment. Prefer a stable bottom-up mergesort with explicit comparisons/reads/writes rather than unobserved Timsort moves. At most ceil(log2(n)) passes, each pass writes every covered input once, and comparisons are at most n−1 per pass; tuple reads/index and source bookkeeping still count. Charge the unchanged n*bit_length(n) reserve **in addition**, plus concrete operations. Reference keys and stable equal-key behavior must match the frozen future sort. No already-sorted or average-case shortcut is assumed without validation; any verified fast path still charges its full validation pass.

## Finite bounds and non-guarantee

At most64 live voices; heaps are compacted before a push would exceed192 tokens. An individual heap sift has at most8 levels for size192; pending size5376 has at most13. These bounds support per-operation conservative charges and fixed storage, not a claim that8/13 itself counts all primitive work. Compaction visits at most64 active records, rebuilds at most64 entries and charges all its sift/array work. Its threshold test and dictionary iteration are counted. Tombstone removals can be amortized over previously inserted tokens, but each real removal is still charged when performed; no amortization discount enters the reported counter.

Exact future/heap/list operations need source controls to derive actual counts. A broad worst-case bound may exceed50million; it must be printed as such, not replaced by an unproved optimistic constant. Expected savings come from fewer actual64-member scans and seven avoided identical sorts per positive segment. Existing small summaries do not prove a new whole-run cost. Completion under50million is **unproven**. Any pure synthetic bound/control above the cap is a source feasibility warning; any future actual over-cap stays failed without retry or cap increase.

The hard storage bound is independent of that cost claim: at most 64 live records, two heaps of at most 192 tokens each, 5,376 pending tokens, and the unchanged 50,000-entry lifetime identity set per branch. Future tuples are shared read-only per segment; branch states are released sequentially. Python object/layout overhead still needs source controls and the unchanged observed RSS limit. No byte estimate from token counts is claimed to prove interpreter peak memory.
