# Bongo Planet — standalone render-clock diagnostic

```sh
npx tsx scripts/receiver-clock-probe.ts
npx tsc --noEmit
```

The diagnostic passed in 6.8 seconds; TypeScript checking passed. This is a feasibility prototype, not integration or qualification of the application receiver/F01/F04. It creates its own loopback HTTP/WebSocket process at port 5421 and installed Chrome. Real AudioContexts render silently through zero gain; no microphone, getUserMedia, device capture, synth, physical sound, or system default-route change is involved.

| Deliberate Node-thread block | Actual worklet control error | Original Node timer callback error/result |
| --- | ---: | --- |
| 100 ms | 0.001953 ms | 80.279958 ms late → dropped by unchanged 20 ms guard |
| 250 ms | 0.337646 ms | 231.642541 ms late → dropped by unchanged 20 ms guard |

Both controls were actually ingested through the worklet's MessagePort with approximately 500 ms lead before Node was blocked. The negative-control block uses `Atomics.wait` only on the standalone Node thread; it is deliberate descheduling, not a proposed scheduling solution or busy-wait optimization. The worklet's queued state precedes the block, so a delayed report after it cannot manufacture prequeue evidence.

The worklet records its actual `process()` block `currentFrame`, sample index, callback `Date.now()` witness, and a real `.25` write into the output buffer at that index. Frame/wall calibration uses 30 independent real process clock observations before any test onsets; no intended onset is used to fit it. Browser↔Node synchronization and Node monotonic↔wall brackets are retained. Conservative combined calibration uncertainty was 2.867462 ms. `executionWallMs` is the coarse actual callback-wall witness plus the executed sample offset within the block; it is not a claimed hardware presentation timestamp. Raw frame values and report-arrival times remain separate. The zero-gain route makes these control transitions inaudible; output PCM before gain is not independently captured device output.

Real-process lifecycle cases also passed: future cancellation prevented its onset, active cancellation cleared the control voice, a new epoch invalidated pending old work and rejected stale work, and the worklet watchdog cleared pending/active state after the existing 500 ms heartbeat policy. These small cases do not replace exhaustive cancellation/object/schema validation of an integrated receiver.

The zero-delay case uses a separate real producer AudioContext and the current `audio.now` conversion form: `onsetAudioSeconds === audioNowSeconds`, with the simultaneous browser performance timestamp mapped to Node. In this run the just-activated producer's currentTime was zero; this is a startup zero-delay probe, not a steady-state producer test. Node wire arrival was 0.042500 ms after intended time. Actual earliest worklet execution was 10.162598 ms after intended time, within the unchanged 20 ms policy. No latency was added to its deadline. This directly measures the prototype wire and sink path; it does not reproduce the application's AudioWorklet→main-thread event-forwarding delay or prove zero-delay behavior under upstream stalls.

`report.json` preserves all clock samples, handshake rounds, control packets, worklet ingress/queue/onset/cancel/epoch/watchdog records, Node callback outcomes, script/processor hashes and limitations. The browser, both contexts, socket and standalone server closed at completion. Application source and the retained failed receiver captures were unchanged.

The next implementation can immediately forward accepted Node controls to a companion worklet and use these actual process-frame receipts. It must newly qualify three-clock calibration, deadlines, object XYZ and stable IDs, capacity/backpressure, close-deadline cancellation, suspended receiver lifecycle and actual two-minute F01/F04 receipts. The diagnostic demonstrates that a prequeued render-clock control can execute while the Node event loop is blocked; it does not promise immunity to whole-host pauses, audio underruns, or late upstream delivery.
