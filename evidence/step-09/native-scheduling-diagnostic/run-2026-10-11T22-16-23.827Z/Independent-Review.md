# Bongo Planet — independent Native scheduling diagnostic review

The instrumented receiver completed its declared 130-second lifetime and closed cleanly. The browser workload **failed/incompletely finished** because that lifetime ended before its separate 120-second exposure certificate. Independently of this orchestration cutoff, the receiver recorded **178 onsets and two actual late drops**. This is diagnostic evidence about this new run, not qualification or an explanation of the earlier uninstrumented F01 failure.

No browser, service, test, load or diagnostic rerun was launched for this review. Read-only calculations joined the retained integer records and checked their provenance.

## Provenance, coverage and cleanup

- Receiver report SHA-256: `2249681d122ac9840c252932f443a2d8ca8d4a0da167c17c4dd113c9e67ad604`.
- All seven source files agree with the receiver manifest, including harness `2d1af318…`, frozen NativeClock `97c63e08…`, instrumented module `5080ab78…` and instrumented worker `ae030275…`.
- Retained browser harness `a07157c3…`, original F01 `c7da2bb4…` and copied receiver manifest `b40c424f…` agree with the workload report. Served main `3c462437…` and processor `0f0b12c9…` are unchanged in its before/after attestations.
- Receiver start/end hrtime span is **130.102749291 seconds**. The receiver report has no failures, record errors, inconsistent rows or retention truncation. Its exit-zero status describes the diagnostic service and evidence collection, not musical delivery success.
- The worker produced 61,828 diagnostic records. Retained snapshots contain 20,260 unique, internally contiguous records in ranges 1–3,453, 35,110–43,724 and 53,637–61,828. Overlapping snapshots agree byte-for-byte after integer decoding. This is **not a full-run trace**: final ring overwrite count is 53,636. Two reserved incident blocks cover the first health gap and first late drop; the final ring also retains the second late drop. Counters report 11 health gaps and two late incidents.
- The independent child produced 11,900 ticks; retained snapshots contain 5,014 unique ticks in ranges 1–829, 6,291–8,427 and 9,853–11,900. Each retained slice has contiguous sequence, monotonic CPU counters, causal measurement brackets and `nextExpected = previousActual + 10 ms`. Overlap agrees. Omitted full-run ticks are not claimed retained.
- All 16 startup/closing child-clock probes were retained. Independently rederived child-minus-parent offset intersection is **[−81,708, +188,834] ns**, width **270,542 ns**. Any overlay must include this interval; zero containment does not prove exact clock identity or exclude an unobserved transient between probes.
- The receiver closed its server; its Native worker has no close failure and final pending/voices/objects/receipt bytes/unacknowledged commands are zero. The independent child acknowledged its final report and exited zero. The client confirms owned Chrome PID 96435 closed without a recorded forced termination. Its producer-stop request completed, but the post-stop receiver fetch failed because the service had already ended; that client-side check is unavailable rather than passed. The receiver's own final state separately confirms it stopped.

The workload retains 239 polls, ending at **119.006324625 seconds** of its requested exposure. `timerEnd` is absent. Its terminal errors are the unavailable receiver fetch and unavailable post-stop fetch. No ring-overlap or capacity loss is recorded. Its 383 event rows include 180 queued, 178 onset, two late-drop, 12 position, seven stop and four start records; 12 raw OSC rows are retained. The 180 queued IDs and the 180 singular outcomes independently match exactly `s2-1` through `s2-180`, all outcomes in the final workload session. These counts do not manufacture the missing 120-second health certificate.

## First late drop: timer callback already late

Trigger `s2-123` (kick) was queued **624.535500 ms** before its requested onset. Its unchanged hrtime deadline is `952374765619436`.

The trace retains six successive arms for this head trigger, generations 1222–1227, and five cancellations. The final arm, generation **1227**, was created by the health callback at `952374746970875`, **18.648561 ms before the deadline**, with requested delay 18.649061 ms. The arm bracket lasts 0.022416 ms. Its preceding cancellation lasts 0.004791 ms. There is **no cancellation of generation 1227 before it fires**.

That timer's callback-entry witness is `952374788939166`, **23.319730 ms late**. The actual execution witness is `952374789390708`, **23.771272 ms late**: callback entry to actual witness is **0.451542 ms**. Thus most of this new event's lateness is already present before the timer callback begins, rather than arising from a long voice mutation.

The previous recorded callback exit and next dispatch entry span **41.847833 ms**. Cumulative worker thread user+system CPU changes only **119 µs** between their bracketed samples. Adjacent health observations span 43.050875 ms; ELU changes by approximately 1.471166 ms active and 41.573875 ms idle. There is no retained worker GC interval overlapping this local window.

Independent child tick 8,387 spans **34.255542 ms** since the preceding tick, making its 10-ms target **24.255542 ms late**. CPU counter change is 89 µs. The CPU-read bracket in that tick itself spans **15.631125 ms**, so the counter must not be assigned to the initial tick timestamp as if sampled instantaneously. The following tick is also late. With the retained cross-process offset interval, these observations overlap the worker's delay window.

This localizes an observed scheduling delay shared in time with an independent process. It does not establish the operating system, power management, timer implementation, another process or a unique component as the cause. Repeated timer replacement is visible, but this incident does **not** show a cancelled final timer or a continuously busy worker callback causing the miss.

## Second late drop: long wall spans with little measured thread CPU

Trigger `s2-175` (near) was queued **124.525208 ms** early. Its unchanged deadline is `952410265319436`. Generation **1744** was first armed approximately 124.312770 ms before that deadline.

While processing the next trigger command (1379), the bracket around cancellation of generation 1744 runs from `952410141137583` to `952410273888166`: **132.750583 ms elapsed wall time**. The cancellation begins before the deadline and returns 8.568730 ms after it. Generation 1745 is then armed with zero delay; later message and health callbacks replace it with 1746 and 1747, still retaining the original deadline. Generation **1747** fires at `952410396329833`, **131.010397 ms late**. Actual witness `952410396398833` is **131.079397 ms late**, only **0.069000 ms** after timer callback entry.

Command 1379's measured entry-to-exit witness span is **183.958583 ms**, while its bracketed thread CPU counters change only **412 µs**. From that command's entry to the eventual dispatch-entry witness is **255.242875 ms**, with **973 µs** cumulative thread CPU change. The adjacent health interval is 278.967333 ms. ELU reports approximately 253.956958 ms active and 25.012750 ms idle: **ELU active time is not proof of equivalent CPU consumption**.

An instrumentation caveat is directly visible here. The flush exit marker at record 60,414 reports a 0.222167-ms phase span, but its subsequent `threadCpuUsage()` measurement bracket spans **49.637917 ms** before the record is committed. A phase span ending before that measurement cannot be treated as the full wall occupancy of the wrapper. The long cancellation bracket likewise does not prove that `clearTimeout` consumed 132 ms of CPU.

Independent child tick 11,643 spans **260.475542 ms**, or **250.475542 ms lateness** relative to its preceding actual tick plus 10 ms. Its CPU counters change only **84 µs**; its measurement bracket is 0.179458 ms. This interval overlaps the worker's long wall spans under the independently retained origin bound. No retained worker GC interval overlaps the event. The evidence supports concurrent scheduling stalls with little observed thread CPU; it does not identify their cause or prove how an uninstrumented scheduler would have behaved.

## Clock and claim limits

All 180 outcome witnesses independently satisfy the retained fixed hrtime-to-Node conversion, deadline/error algebra and exact pair-age algebra. Their measurement uncertainty is at most **0.170937 ms**; the producer reports a separate **1.149999976 ms** performance-to-Node uncertainty. Neither number qualifies the still-open audio-clock-to-performance relation or physical sound presentation. The two late outcomes are not explained away by these bounds.

For description only, nearest-rank absolute-error p95 across all 180 outcomes, including both late drops, is **1.362105 ms**, while maximum is **131.079397 ms**. A favorable percentile cannot erase either missing execution. The 23 retained GC observations do not prove the absence of GC in unretained windows or other processes.

The first reserved health-gap incident (46.258083 ms) occurred before the browser workload began; it must not be attributed to F01. The source is instrumented, trace windows are partial, the child uses the same host, and the client lacks its full exposure certificate. There is no controlled counterfactual for timer churn, no OS scheduler trace and no identification of a specific competing task. Therefore neither this run nor its two new late drops can be used to assign the cause of the earlier F01 qualification failure, qualify 120-second delivery, justify a relaxed deadline, or authorize a retry. All acceptance and human gates remain unchanged.
