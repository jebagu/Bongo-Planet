# Bongo Planet — native scheduling diagnostic proposal

Status: read-only investigation and execution plan. No production edits, service changes, tests, intentional stalls, browser launches or captures were performed for this investigation. Root owns the next implementation/execution decision. This document does not repair or qualify the failed receiver.

## Retained failure and what it establishes

Inputs are the immutable `../native-clock-qualification/attempt-01/F01-two-minute.json`, `runtime-start.json`, `Native-Qualification-Review.md` and capture-time `source-snapshot/src/output/NativeClock.ts`. The recorded NativeClock SHA256 is `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173`; the bridge SHA256 is `c24a37011f631df7a979b5c4010b1b96baa22b6799abae4c231c95246deec460`. Current worker scheduling code was read alongside that evidence. No new large hash operation was performed.

For `s2-132` in epoch `88325b8c-2f31-483b-b288-66581c8b9ff1-s2-4`:

| Witness | Native hrtime nanoseconds / measurement |
| --- | --- |
| Worker receives queued trigger | `948626029027708` |
| Intended deadline | `948626653487375`, queue lead 624.459667 ms |
| Previous health state | `948626599974416` |
| Next health state | `948626673753458`, observed gap 73.779042 ms |
| Buffered heartbeat received / applied mutation | `948626674046208` / `948626674374833`–`948626674376750` |
| Dispatch pop | `948626674398833`–`948626674401750` |
| Actual control branch | `948626674405041`–`948626674407625` |
| Outcome | before-error 20.917666 ms; actual error 20.920250 ms; honest late drop, no voice attempted |
| Receipt report arrival | `948626682064583`, 7.656958 ms after actual |

Both surrounding health rows show pending=1, activeVoices=2, objects=3, receiptBytes=0 and unacknowledgedCommands=0. The previous heartbeat is `948626550266333`; its age at the later health row is 123.487125 ms, well inside the 500 ms lease. Thus neither late ingress nor a watchdog release explains this trigger. The state-row timestamps are taken inside the callback, not at its entry; 73.779042 ms is an observed reporting gap, not an independently measured duration of an OS suspension.

The independent heartbeat bucket ending `1791753327892` Unix ms records 51.450208 ms maximum slip, 54.001663 ms event-loop-delay maximum and 83 ticks. It corroborates a disturbance in another process, but only to a one-second window. It cannot prove that its worst tick overlaps the worker deadline. The bridge's cumulative loop maximum likewise does not localize a cause. F01 remains 179/180, F04 420/420; none of this permits converting the drop into an onset.

## Smallest useful instrumentation

Keep the receiver's clock conversion, musical deadlines, ±20 ms execution check, 10 ms uncertainty guard, 500 ms producer lease, 1500 ms calibration lease, queue limits and cancellation ordering exactly as written. Do not optimize the timer, change priority/power settings, force GC, retry a dropped trigger or add a timer fallback in this experiment.

Add an opt-in diagnostic recorder to the worker and exact tick retention to the existing independent witness. Record primitive values into preallocated storage; no JSON serialization, disk/stdio writes, new messages or unbounded object allocation in the deadline path. Use hrtime BigInts as raw anchors, not UTC for interval arithmetic. Keep identity as bounded numeric references to the existing command/trigger sequence and incarnation.

| Record | Required fields and causal purpose |
| --- | --- |
| Timer arm/cancel | Generation, reason (`health`, `trigger`, `cancel`, `dispatch`), old/new generation, next trigger sequence, exact intended deadline, hrtime immediately before/after `setTimeout` or `clearTimeout`, requested delay. Retain callback generation separately. |
| Timer callback entry/exit | Actual first/last hrtime, armed generation, intended deadline, entry-to-mutation duration, pending count. An early callback that merely rearms must also be retained. |
| Worker callback phase | Entry/exit for health, message (command type/sequence), dispatch, schedule and flush. Include receipt counts/bytes, in-flight batch/ACK age, heartbeat age and budget age. Bracket sorting and receipt serialization/`postMessage` only as subphases; record whether a command changes the earliest deadline. |
| Worker runtime | At health entry and exit: bracketed `process.threadCpuUsage()` user/system counters and `performance.eventLoopUtilization()` raw active/idle values. Retain the sampling bracket and delta, not just a utilization percentage. |
| GC observation | Worker-local `PerformanceObserver` `gc` entry startTime, duration, detail.kind/flags, observer-delivery hrtime, and independently bracketed worker performance↔hrtime conversion. Preserve delayed delivery separately from the GC interval. |
| Independent heartbeat | Every actual 10 ms tick: expected tick deadline, actual hrtime, previous tick, PID and thread CPU counters. Retain exact anomaly tick and neighbors; keep existing one-second summaries for continuity. |
| Parent receipt | Existing actual execution and report-arrival timestamps plus diagnostic block identity/sequence. Arrival is never substituted for worker execution. |

`schedule()` currently clears and rearms the timer on every health callback, as well as on ingress and dispatch. After this incident's late health row, a buffered heartbeat applies and dispatch follows about 0.65 ms later. The trace does not reveal which timer generation fires or when its predecessor was cancelled. Instrument that fact before blaming rearming or changing it. Node normalizes delays below 1 ms to 1 ms and truncates fractional delays; it does not promise exact firing or callback ordering. Preserve requested delay and the documented effective-delay calculation as separate derived values, not as a claimed observed kernel deadline. [Node 22.20 timers](https://nodejs.org/download/release/v22.20.0/docs/api/timers.html#settimeoutcallback-delay-args).

Node 22.20.0 provides per-thread CPU counters via `process.threadCpuUsage()` and external worker counters via `worker.cpuUsage()`, both added in 22.19. Use the worker-local synchronous counters first; parent observation must retain its request/response interval. `process.cpuUsage()` is process-wide and cannot isolate this worker. [Process documentation](https://nodejs.org/download/release/v22.20.0/docs/api/process.html#processthreadcpuusagepreviousvalue), [Worker documentation](https://nodejs.org/download/release/v22.20.0/docs/api/worker_threads.html#workercpuusageprev).

GC observations expose interval/duration and kind/flags. ELU measures event-loop active/idle time, not CPU usage; a blocking call can report high utilization while consuming little CPU. `monitorEventLoopDelay` is timer-based and detects loop delay without identifying the cause. The existing health timestamps already supply a worker gap signal, so another 1 ms worker histogram timer is unnecessary in the first patch. [Node 22.20 performance APIs](https://nodejs.org/download/release/v22.20.0/docs/api/perf_hooks.html).

Installed `@types/node` is 26.6.5 and describes some APIs using newer version histories; the version-specific primary documentation above establishes availability on the recorded Node 22.20.0 runtime. Feature/version checks belong in preparation, outside playback.

## Bounded retention and integrity

Use an 8192-slot, at most 1 MiB primitive ring in the worker, and a 2048-slot, at most 256 KiB ring in the independent process. Retain monotonic record sequence, overwritten count, oldest/newest hrtime and clock-pair identity. Parent reads a consistent sequence-checked snapshot through shared memory; it must never make worker receipt ACK delivery depend on diagnostic disk writes. Existing musical receipt limits still apply independently.

On the first callback gap above 40 ms or absolute onset error above 10 ms, latch a diagnostic incident; these are observation thresholds, not new playback policies. Freeze the available preceding ring and collect at most one additional second into a second fixed ring. Retain no more than two incident blocks per run, at most 6 MiB total raw diagnostic data including independent rings and metadata. If capacity prevents the requested context, keep explicit truncation counters and actual coverage; do not assert that a nominal 3-second prewindow was retained. At end/close, drain outstanding GC observer records and retain any delivery lag. A worker fatal includes the ring snapshot through parent-owned shared memory even if no later worker callback runs.

The independent witness must retain its exact anomaly ticks and match intervals using directly shared hrtime anchors plus causal cross-process bracket checks. UTC buckets remain labels. Preserve source bytes, Node/macOS versions, flags, PIDs/incarnation, clock brackets, ring schema, enabled probes, observed record-write/phase durations and cleanup. Report instrumentation overhead and trace overflow; adding diagnostics can alter allocation/scheduling and must be declared. No absence of a new failure erases attempt-01.

## Interpretation and escalation

| Retained pattern | Supported inference; remaining limit |
| --- | --- |
| One command/sort/flush phase spans the gap, and worker CPU rises comparably | Worker computation is implicated; phase wall duration alone also includes preemption. |
| GC interval overlaps the deadline and accounts for much of the gap | GC is implicated in this isolate; GC wall duration can itself include descheduling. |
| All worker callbacks are absent, little worker CPU accrues, exact independent tick overlaps | Off-CPU/waiting disturbance is supported; kernel scheduler, coalescing, power or blocking attribution remains unresolved. |
| Callback entered on time but mutation is late | Time inside the callback/phase caused the lateness, rather than timer entry alone. |
| Worker callbacks continue normally while the armed timer generation is missing or repeatedly superseded | Timer handling becomes a concrete code hypothesis; assess requested/effective delay and generation order before a remedy. |
| Parent reports late but worker callback is on time | Reporting/IPC delay; it must not be called execution lateness. |

Local manuals and tool paths were read, without launching a profiler: `/usr/bin/xctrace`, `/usr/sbin/spindump`, `/usr/bin/sample`, `/usr/bin/powermetrics`, `/usr/bin/fs_usage`, `/usr/bin/vm_stat` exist. Presence does not establish installed Xcode templates, tracing entitlements or usable privileges.

If the bounded Node records leave an off-CPU ambiguity, root can authorize one **diagnostic**, separately labelled macOS System Trace session. First inventory its installed template/support and permissions; then use a bounded recording (for example 120 seconds, a 10-second `--window`, stop after the first incident plus postwindow) and retain raw `.trace`, table-of-contents/export commands and time-domain alignment. System scheduler events can distinguish runnable waiting, actual execution and blocking/wakeup states, with competing thread activity if collection supports it. A worker_threads `threadId` is a Node identity, not a Mach thread identifier: prove the native-thread mapping from retained trace metadata/call stacks; if ambiguous, leave attribution open or propose a separately reviewed minimal `pthread_threadid_np` witness. Do not infer a competing process from total CPU alone.

The local `spindump` manual describes timeline thread state, QoS, App Nap suppression and timer-coalescing information; its sampled running/runnable or suspended states may narrow a gap but cannot reconstruct every scheduler transition. The `sample` manual explicitly says it suspends/resumes the target to collect stacks, making it intrusive for deadline qualification. Time Profiler/CPU profiles are useful for executing stacks, not proof of off-CPU scheduler latency. `powermetrics` and memory/I/O summaries provide contextual aggregates, not a 20 ms control witness. Do not launch all profilers together. Treat profiler failure/unavailable scheduler tables and recording overhead as explicit limitations; no privilege or system-default changes are authorized by this plan.

## Review before execution

Root reviews the bounded patch and recorder capacities first. Source-only controlled checks should prove timer generation joins, GC time conversion, ring consistency/truncation, fatal snapshot preservation and unchanged late-drop/cancel/watchdog behavior. Any deliberate blocking checks and actual capture require a separately coordinated GO after other audio/browser captures close. The first live diagnostic answers the attribution question and retains all outcomes; it is not an unchanged qualification retry. Any scheduling remedy follows only from the measured distinction and needs its own independent acceptance run with the original denominators and bounds.
