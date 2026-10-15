# Bongo Planet — independent production ingress repair review

Disposition: **GO for the narrow production repair; no blocking finding.** The retained component comparison and production regression support yielding between uncompressed WebSocket messages so native acknowledgments can be serviced. This is not a pass for browser movement congestion, freshness, musical timing, or physical output.

I read the exact production diff, current/frozen bridge sources, installed `ws` dispatch implementation, new regression, relevant existing ordering/native integration tests, retained test reports and command records. I did not run tests, services, browsers or probes and changed no implementation.

## Exact change and bindings

The production diff is three changed non-test lines: one removed constructor line, one explanatory comment and one replacement constructor line. `WebSocketServer` now sets `allowSynchronousEvents: false` and explicitly sets `perMessageDeflate: false`; `maxPayload: 128 * 1024` is unchanged.

| Current selected file | Bytes | SHA-256 |
|---|---:|---|
| `src/output/bridge.ts` / retained `bridge-after.ts` | 15,619 | `e4014cac06d534fcaa24021609313d3c1f1082a7ab5dc2efa31487c626140614` |
| Corrected `tests/bridge-ingress.test.ts` / retained corrected copy | 2,832 | `a7e2779dc15860cf74fc8722a8218373b902168c0316f311bec70aabbcc6a105` |
| `src/output/NativeClock.ts` | 28,579 | `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173` |

The recorded before bridge, `c24a37011f631df7a979b5c4010b1b96baa22b6799abae4c231c95246deec460`, matches the retained before copy. I verified every before/after selected binding against the appropriate retained stage. ReceiverClock, RenderClock, protocol and package-lock bytes are unchanged. Native limits remain 196,608 bytes per command, 8,192 unacknowledged commands and 262,144 unacknowledged bytes; worker receipt bounds, scheduling/lease guards, poison state and close semantics are unchanged.

`After.json` records the initial 2,761-byte test (`b11e875bf753b5d6a6edd7127b5d025b6d42246767e4084c54c6a0f3dd73f0ba`), not the subsequently corrected test. `Verification.json` correctly records the current binding and both verification stages. The old stage is preserved rather than represented as a current-file match.

## Scheduling and composition review

In installed `ws`, uncompressed text/binary delivery with this option sets `DEFER_EVENT`, schedules the next message emission with `setImmediate`, and resumes its receive loop after the message handler returns. It preserves message order within the connection. It does not run the application's handler concurrently or invent acknowledgment completion. The source also has a separate compressed-text `INFLATING` path; explicit compression-off keeps production on the path exercised by the component evidence. Server compression was already disabled by the installed default, so making that setting explicit does not newly remove a previously enabled product feature.

The message parser, independent position/control/trigger sequence checks, producer ownership, retired-session checks and position-before-trigger rule remain inside the same ordered handler. Native applied receipts may now arrive between handlers, as intended. Existing cancellation tombstones are bounded by their applied command sequence, and an onset reported after cancel/stop cannot revive the cleared voice. Their source and retained controlled-ordering assertions remain applicable.

Yielding also permits watchdog, native failure and close callbacks to occur between incoming packets. Subsequent packets still recheck the active producer/session; starts require a ready, valid execution clock; `forward` checks readiness before and after native admission and prevents OSC from falling through after a synchronous admission failure. The native worker independently enforces lease, poison, sequence and timing bounds. The change adds no stale-heartbeat exception, automatic restart, catch-up behavior, queue-cap increase or fallback scheduler.

During bridge close, the existing synchronous `closing`/release action precedes native close and WebSocket termination. A later musical packet cannot bypass the emptied session, and the execution clock becomes unavailable. Existing cleanup retains the native error while closing WebSocket/HTTP/UDP resources. I found no new path in this small diff that bypasses these guards.

This option gives other callbacks service opportunities; it does **not** guarantee a maximum delay under arbitrary host load. An overloaded connection can still miss a scheduling window or watchdog lease and fail closed. The actual comparison already records a longer successor callback span, so the comment must be understood as the intended opportunity to clear admission bytes, not a hard scheduling promise.

## Retained verification and its limits

`tests.json` is 15,692 bytes, SHA `2a7e451a55266c702397b9427cdbc79265811a6725b56ffaadcc8a509ee12170`: 43/43 assertions passed across the ingress, bridge/native, controlled ordering, native-clock and output-sync test files. The initial typecheck failed only on the test's diagnostic-union property access; the exact TS2339 log and initial test are retained. The correction adds an `in` narrowing predicate to the two existing acknowledgment waits without changing production code or expected outcomes.

The corrected typecheck log contains the successful `tsc --noEmit` command, with tool exit 0 recorded as `324ace`. `regression-corrected.json` is 1,011 bytes, SHA `0ec7cd16a1eba38e1e191775490eb5a409087e7d41f7d3d0eeb42fadcae8bf8a`, and records the corrected actual regression passing (tool `117dd0`). I did not claim the original typecheck passed or that the full 43-test suite was rerun after the test-only narrowing.

The new regression uses real local WebSocket/UDP and a real native worker with ephemeral ports. Its client offers compression and asserts no extension was negotiated. It admits 92 initial objects, waits for their raw position output and parent acknowledgments, then sends 1,200 more positions plus heartbeats. It checks the exact ordered 1,292 position records and decoded OSC results, latest object state, healthy clock, zero drops/errors and zero remaining admission bytes, then closes owned resources in `finally`. The literal cardinal positions are independent of the production OSC encoder. The older component comparison supplies the richer geometric and full applied-hook evidence; this shorter regression does not pretend to repeat that instrumentation.

The test's polling wait and outer test timeout are functional observation bounds, not calibrated ingress-latency or 500 ms congestion certificates. The retained mixed native integration checks actual onset/control coordinates and cancellation; controlled ordering tests inject delayed receipts and corrupted witnesses; neither is promoted here into a fresh sustained musical qualification.

The saved permanent-service restart records the new source hash and a ready/quiet native instance. I read that record only; I made no current network request and infer no acoustic or timing pass from service readiness.

The initial capacity failure, prior browser pressure failure and all broader open gates remain intact. This repair is justified and meaningfully regression-tested within its stated ingress scope.
