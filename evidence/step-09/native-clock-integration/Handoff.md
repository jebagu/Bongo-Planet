# Bongo Planet native control receiver handoff

The owned module and tests are frozen for independent review. `NativeClock.ts` implements `ReceiverClock` with one native worker, no browser dependency, no timer fallback and no automatic restart. This is a numerical control receiver; it renders no audio or physical presentation.

- Module SHA256: `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173`.
- Test SHA256: `605ac218d9efe3c1fc1d09ec53fdbe37e11fb4f4ffed410b37e3ce75f3dae785`.
- Typecheck passed. Final owned report: `attempt-08.json`, 12/12 tests passed.
- Immutable module/test and actual control witnesses: `capture-1791753107678/`.
- All seven actual workers reported graceful close acknowledgement and exited 0. The controlled shutdown-fault test intentionally requires close to reject, while preserving those cleanup facts. No browser, AudioContext, microphone, server or production fixture capture was launched by these tests.

The worker owns pending controls, positions, voice state, cancellation, stop, epochs and the producer heartbeat lease. Bounds are 5,376 pending controls, 64 control voices, 92 objects, 12 seconds of future scheduling and the unchanged absolute 20 ms execution guard. Ordinary worker timers are used; there is no busy wait. Voice stealing rolls back the new insertion and restores the evicted entry if actual mutation completion crosses the late bound. Each due row checks poison, lease and calibration before removal and mutation; it checks the epoch again after a successful watchdog release can clear the model.

The parent chooses one independent bracketed `performance.now()` ↔ `hrtime` origin at startup. A held-out startup window and eight actual cross-thread causal probes precede readiness. Every second, 32 independent brackets check compatibility with the fixed startup interval; the maximum observed bound includes wide brackets and is retained with its exact witness. The origin never fits product deadlines or changes after startup. The worker rejects an already expired clock budget before refresh, and a calibration gap beyond 1.5 seconds fails the helper. Producer heartbeat expiration remains 500 ms and is checked before buffered traffic; helper calibration does not renew it.

Execution receipts carry native clock domain, incarnation, intended/actual hrtime, before/after mutation brackets, the fixed conversion offset, execution-time clock pair and its age, identity and a position snapshot. Actual time is mutation completion, not parent report arrival. Native receipts have no frame or sample fields. Receipt arrival may trigger a fresh held-out measurement and conservatively widen the timestamp bound; earlier valid execution is not rejected merely because its report arrived later.

| Actual isolated control | Error | Timestamp conversion bound |
| --- | ---: | ---: |
| Zero-delay control | 2.410730 ms | 0.007521 ms |
| Following moved coordinate | 0.195105 ms | 0.007521 ms |
| Callback during a 100 ms parent block | 1.608667 ms | 0.005334 ms |
| Expired input, actual late drop | 31.515625 ms | 0.005334 ms |
| Initial watchdog-epoch control | 0.579208 ms | 0.005543 ms |
| Fresh epoch after watchdog release | 1.974667 ms | 0.005543 ms |

Message count and byte bounds, exact internal ordering, incarnation rejection, receipt batching and ACK deadlines fail closed. Bridge command ACKs follow earlier executed receipts in the ordered batch. `invalidate(reason)` sets a shared atomic poison synchronously; subsequent worker checks cannot continue normal execution. Worker errors, deserialization failure, receipt/command overflow, incompatible clocks or worker death fail permanently. New shutdown faults remain recorded and prevent a successful close result.

The tests additionally cover active-object rebind rejection, cancel removing pending/active state, preserved execution coordinates, stale heartbeat rejection, fresh epoch, explicit invalidation, IPC sequence/ACK/byte failures, pending overflow, receipt overflow abort, late voice-steal rollback, lease expiry between due rows and during a valid-duration control write, expired-budget refresh rejection, wide later clock brackets and shutdown error retention.

Previous artifacts remain intact. Attempt 01 failed three diagnostics waits because authoritative state rows were omitted; the bounded worker state stream fixed that omission. Attempt 05 caught an empty-queue dereference after a watchdog release succeeded; the queue is now rechecked before pop. Those failures and capture snapshots are preserved. No unchanged retry or relaxed acceptance threshold was used.

The earlier standalone probe demonstrated 6,048 controls over three seconds at 2,016/second, plus 100/250 ms blocked-parent negative comparisons. That separate prototype evidence is not a production throughput qualification. The production bridge, real producer clock mapping, WebSocket/UDP ingress, full F01/F04 counts and end-to-end conservative timing limits still require root-owned integration and fresh qualification. Worker or shared-host descheduling can still miss deadlines; that failure remains observable and is not claimed to be eliminated.
