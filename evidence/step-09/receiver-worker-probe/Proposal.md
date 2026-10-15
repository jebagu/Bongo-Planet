# Bongo Planet isolated worker control-clock hypothesis

Preparation only. No worker scheduling test, intentional parent block, throughput run, browser, socket or audio context has run. Source: `scripts/receiver-worker-probe.ts`. Typecheck passes. `preparation-1791750426220.json` records worker-source syntax validation and32independent clock read brackets; the chosen bracket width is127ns. This is not scheduler qualification.

Reviewer guards are now included in frozen source SHA `837422b7ef47b73876f8b83c3508539a3f48bb18f02389099a4e7fb1abed2bcd`. Latest worker-free drycheck `preparation-1791750873288.json` passes held-out interval compatibility, injected50ms wrong-origin rejection and old/closed incarnation rejection; chosen bracket width86ns. Earlier drychecks remain preserved. No timed probe has run.

Subsequent pre-GO source hardening supersedes that candidate with SHA `821c6ccee5729b4cb15e9246189ac3df8c91b4cffde7fe2a3135e143bea80908`. `preparation-1791751617819.json` records all8dry guards passing, including errors before/after a satisfied waiter predicate and3controlled embedded-worker VM cases. Those cases force receipt capacity failure at dispatch-pop and old-epoch release, verifying no continuation/voice revival, and simulate64active voices with mutation crossing19.9→20.1ms, verifying old voice/order restoration and explicit attempted-write/rollback evidence without a normal steal. OS timers are mocked; no Worker, block or scheduling load executes. Cleanup separately records graceful close ACK, observed exit/code and forced termination; missing ACK or any retained late worker error fails the final report. No actual run has started.

The hypothesis is that an independent native Node worker, using `process.hrtime.bigint()` directly, can execute prequeued numerical control callbacks while the parent event loop is blocked. It removes UTC and parent callback dispatch from the sink's execution clock. It does not remove worker or whole-host scheduling delays; those must produce honest failures under the existing20ms guard.

The parent independently brackets each `performance.now()` read with before/after `hrtime` reads. Startup chooses the narrowest valid interval and fixes its midpoint as the conversion origin. Intended control deadlines are converted once. Actual execution reads worker hrtime inside the callback, then changes mock voice state. Parent report-arrival hrtime/performance timestamps remain separate. Ending independent origin intervals must overlap startup intervals; the bound around the fixed midpoint covers both complete intervals. UTC Date is used only for report labels.

Held-out brackets independently convert actual callback hrtime back to the caller's original BigInt Node deadline. They do not reuse the chosen conversion for both scheduled and observed error, where a wrong origin could otherwise cancel. Actual worker clock replies and every command ingress must satisfy `parentSendHr ≤ workerObservedHr ≤ parentReceiveHr`. Controls retain mutation before/after hrtime strings rather than treating one batch-arrival timestamp as execution. Protocol-negative old-incarnation traffic is labeled explicitly and creates no fictional onset/sample/voice witness.

The actual worker owns timer dispatch, pending controls,92object bindings,64mock voices, bounded5376pending controls, producer heartbeat leases, cancellation and epoch retirement. Ordinary worker timers run without busy waits. Ordered commands and acknowledged batches bound producer and receipt backlogs; the500ms producer watchdog checks the old epoch before buffered heartbeat/start commands. This is not application integration and creates no audio frame/sample fields.

IPC protects counts and bytes: at most8192unacknowledged commands and262144command bytes;8192receipt rows and2097152queued receipt bytes; one acknowledged batch of at most64rows and61440bytes. Both sides reject sequence gaps, bad ACKs and deserialization errors. Worker stdout/stderr are captured away from deadline operations with a65536byte cap. Worker incarnation UUIDs and fresh session namespaces prevent old messages from mutating a new sink; explicitly tagged negative traffic checks both directions. Actual worker-dispatch blocking is a separate negative control:100ms blocking on the worker must still exceed and fail the unchanged20ms guard.

After coordinated GO, execute:

```sh
npx tsx scripts/receiver-worker-probe.ts --run
```

Every run creates a new timestamped directory and saves the exact script/embedded worker source plus all commands, queue-ingress records, actual callback clocks, arrival clocks, state snapshots and failures. Proposed runtime is approximately10seconds:

-100ms and250ms intentional parent stalls begin30ms before a known deadline. Require actual worker ingestion≥400ms early and actual callback during the recorded parent-block interval. A separately scheduled parent timer must exceed20ms, demonstrating the test activates the failing dispatch path.
- Pending plus active cancellation, epoch replacement and stale packet rejection, a past-deadline negative control and actual500ms producer-watchdog release.
-6048controls over3seconds at2016controls/second, streamed with≥400ms measured lead. Require exact IDs once, no late drops, all actual errors≤20ms, and recorded queue/voice bounds.

The hypothesis remains untested. No result here qualifies F01/F04, the product's zero-delay forwarding, WebSocket/UDP ingress, physical sound, presentation or cancellation integration. If worker callbacks miss deadlines, retain the actual evidence before considering a production change. Run only after the parent confirms the concurrent audio capture has ended.
