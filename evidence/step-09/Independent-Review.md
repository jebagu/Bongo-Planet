# Bongo Planet — independent integrated review

**Result: all substantiated source defects identified in this audit, including final cancellation/position-cache finding IR-02, are repaired and rechecked. The two-minute receiver exact-once qualification failed for both F01 and F04 under the recorded concurrent host load; a quiet instrumented rerun is still required. This source/integration audit does not accept M1. Actual-output, human, Safari, venue, and physical-device gates retain their separate evidence requirements.**

Independent GPT-6 Astra review, 2026-10-11. The reviewer owns this report and the separate acceptance-coverage proposal, and made no production changes. The lead implemented the repairs. Reference environment: Darwin 25.5.0 arm64; Node v22.20.0; npm 10.9.3; installed Google Chrome 155.0.8059.39 through Playwright, headless with `--enable-unsafe-swiftshader`. Application: `http://127.0.0.1:5417/BongoPlanet/`.

## Scope and method

Read AGENTS.md, Rules.md, Work-Package Steps 05–09 and the three kickoff concerns, audio synthesis/worklet/adapter, output adapter/protocol/bridge, main integration, History and changed-kind handling, and their tests. The initial audio/output/main review covered 464 physical production lines, mostly dense new source. Deep review was used: timing assumptions, edit/transport composition, cancellation/recovery cascades, duplicate/replayed control traffic, hash collisions, and repeated ordinary UI actions. Source tests do not establish actual audible output.

All reviewer network probes used `createBridge(0,0)` and ephemeral WebSocket/UDP ports. For integrated browser probes, an initialization script redirected only the fixed bridge URL to that isolated bridge. The review did not connect another producer to the shared 5418 receiver. Short browser/build checks overlapped other workers' capture activity; timing qualification should use an otherwise quiet host.

## Final independently run checks

The main independent command set ran from the project root on 2026-10-11, approximately 17:24–17:29 UTC. Final targeted browser repairs were independently rechecked later in the same session:

```sh
npm run typecheck
npm test
node --import tsx scripts/independent-engine-probe.ts
npm run build
npx playwright test tests/controls-browser.spec.ts --reporter=line
```

Results: typecheck and production build passed; all **47 unit tests across six files** passed; all **three controls-browser tests** passed. The production build reports a nonfatal chunk-size warning. The independent engine oracle again passed **53,724 triggers in 32 seeded scenes**, seed 92881, 30 seconds/scene, 5 ms ticks, with the nine checks and methodology preserved in `evidence/step-03/Independent-Review.md` and `scripts/independent-engine-probe.ts`. It does not prove live output timing.

The controls-browser run individually changes generator period/phase/reach/enabled; note degree/octave/timbre/duration/level; beat sound/decay/level; global tempo/key/scale/volume/travel/quantization and compares the entire scene after every control. It also proves a simulated storage failure preserves the current scene and previous good save, and Undo Load cancels a same-ID/different-kind old pulse and stays paused.

Additional inline browser rechecks on the frozen candidate:

| Constructed action | Actual final observation |
| --- | --- |
| Load F05 while audio locked; move `moving` to vertex 1; wait 500 ms. | `audio.state=locked`, `movingPieces=0`: presentation movement finishes without an audio clock. |
| Play F05; suspend its AudioContext; wait 200 ms; click Play once. | Button immediately says Play; one click returns to `running=true`. |
| Wrap `audioWorklet.addModule` with a manually held promise; click Play, load F01, release the promise, wait 1.3 s. | `state=paused`, `running=false`, zero onsets, Play enabled. Later loading wins over earlier activation intent. |
| Load scene A containing two generators, then F05 B reusing one ID as a note; Play until one pending event; Undo; wait 3.4 s. | Two generators restored, paused, zero old onsets. |
| F05 → Clear → Undo → Redo → place first generator. | Initial candidate stayed paused. Final repaired candidate reaches `state=running`, `running=true`, one generator. |
| With three active voices in an isolated actual receiver, directly invoke the installed processor-error callback. | Receiver goes from three voices to zero, with no pending work or session; browser shows error, output disconnected and Play. This invokes the callback rather than crashing the native processor. |

## Final repaired finding

### IR-01 — Redo Clear forgets first-generator auto-start (repaired; initial P2, confidence 100)

Trigger: load F05, click Clear, Undo, then Redo, choose Generator and place it on an open front slot. Expected: Redo restores Clear's empty-ready state and the first generator starts at beat zero. Actual Chrome result after 1.2 seconds: `audio.state='paused'`, `status.running=false`, one valid generator. The Clear button alone sets `ready=true`; Undo sets it false; Redo applies History's `clear` mode without restoring readiness. Thus history/model restoration and onboarding transport state disagree.

Location: `src/main.ts`, `apply`, Clear/Undo/Redo handlers (approximately lines 26 and 40–42 in the recorded snapshot). Minimal repair: centralize `ready=true` for `apply(...,'clear')` so direct and redone Clear share semantics; retain paused restoration for Undo Clear. Add the exact UI sequence as a regression. After the capture freeze, the lead centralized Clear readiness in `apply`. The reviewer reran the exact browser sequence and observed `running=true`. The regression `redo Clear restores first-generator auto-start readiness` now covers it in `tests/app-browser.spec.ts`. IR-01 is closed for the final hashes below.

## Constructed failures repaired during this audit

The failures below were reproduced or mechanically constructed against earlier integrated candidates and reported to the lead. All listed repaired behavior has either an independently rerun regression or the explicitly limited verification stated in the last column. These are historical findings, not additional open defects in the recorded source.

| Failure chain and reproduction | Repair / final verification |
| --- | --- |
| A trigger sound `{kind:'note',duration:1,level:.5}` or negative frequency passed the receiver grammar; note/beat fields could be mixed, allowing semantically unsynthesizable controls. | Strict discriminated note/beat schemas require frequency/timbre or percussion sound and enforce their own duration bounds. Malformed examples reject in rerun bridge tests. |
| Valid node IDs `n-5z56us-1yqnk3` and `n-1cu46m-1pvjh2t` hash to 1760164625; the second initial position was rejected, then its trigger lacked a matching object. | ObjectMapping sorts new IDs and linear-probes collisions while retaining active mappings. Independent recheck: equal raw hashes, distinct mapped IDs, first ID stable after adding another node. |
| Queue a note at now+.03, wait 60 ms, cancel its trigger ID with an empty nodeIds list: receiver active voice remained. | Receiver matches active voices by trigger ID or node ID. Independent recheck: active voices 1→0. |
| Cancel an upcoming trigger, then resend its original immutable identity with a fresh control sequence: cancelled work sounded again. | Separate monotonic triggerSequence rejects replay independently of controlSequence. Recheck leaves exactly the first legitimate onset and records one rejection. |
| Intermediate replay fix permitted two pending records with the same ID and different sequences, overwriting the first timer in a Map; cancelling the ID left the orphan timer sounding. | Pending/active ID guard restored; protocol also binds ID suffix to immutable triggerSequence. Recheck: duplicate-ID attempt rejected, cancel leaves zero onsets and zero pending. |
| Stop heartbeats for >500 ms: receiver retired the session but left the browser socket open, so further traffic permanently hit stale-session errors while UI still reported connected. | Watchdog releases then closes the producer. Independent isolated probe: empty session and WebSocket CLOSED (3), one watchdog stop. |
| Reconnect after a prior successful clock sync but delay the second sync response. Old uncertainty allowed start/position/trigger before handshake, then the response restarted the same session and reset control sequences. | Every connect resets uncertainty/offset/start state; stale-socket callbacks are ignored. Mock-socket final probe sends only sync before reply, one start afterward, and no missed-trigger replay. |
| A locked AudioContext leaves time zero; manual movement driven by the musical clock never finishes. | Manual placement/movement use performance time independently of compensated musical time. Actual Chrome recheck above passes. |
| After context suspension, stale status still displayed Pause; the first intended resume awaited activation then read old running state and paused again. | Main captures pause intent before awaiting activation and masks status during interruption/error. Actual Chrome one-click recovery passes. |
| Safari startup audio-clock jump immediately interrupted the initial transport. | Worklet delays each explicit start until 250 ms of stable quanta; a >100 ms clock gap pauses and requires explicit resume. Simulated startup/resume jump tests pass. Actual Safari qualification remains external to this reviewer. |
| Load during the new warm-up cleared the pending start but left adapter state `starting`, permanently disabling Play. | Non-edit setScene reconciles paused/locked/interrupted state. Controlled in-flight browser recheck ends paused with Play enabled. |
| An awaited module activation completed after Load and unconditionally issued Play, violating paused-load semantics. | Main records Play intent synchronously before activation; Load/Clear cancel it; enable honors only current intent. Manually gated addModule probe has zero onsets after Load. |
| Native processor failure could stop local clock processing while output heartbeat kept remote queued events alive. | Main disconnects output on error/interrupted state. Independent final callback injection released three active voices on an actual isolated receiver and left UI error/disconnected. A generic Event dispatch did not simulate native fault delivery; the successful probe called the installed callback directly. Crashing the native processor itself was not tested. |
| Pending capacity reset paused engine but kept adapter wantedPlay true, allowing a later ordinary activation to restart it. | Reset clears wantedPlay and transitions to a persistent error reason, so generic telemetry cannot erase it; main disconnects output. Engine cap/regression tests pass. Source delta was inspected; a complete capacity-overflow browser UI scenario was not separately measured. |
| Undo Load with a reused ID changing generator↔note applied an ordinary edit. Old committed note sounded even though both restored pieces were generators; its mesh could retain the previous kind. | History stores edit/load/clear operation mode; Load/Clear restoration uses a paused replacement; engine treats same-ID kind changes as remove/add; view recreates kind geometry. Actual Chrome Undo Load probe and regression pass. |

## Final cancellation/position composition finding

### IR-02 — Delete while audio is locked leaves receiver objects; later cancellation can erase re-added positions (repaired; initial P2, confidence 100)

The output adapter relies on audio-engine cancellation to remove receiver objects, even while the audio engine has never been initialized. Reproduction: fresh page → load F07 (audio remains locked) → connect bridge → delete a note. `AudioAdapter.setScene(edit)` has no node to message; `OutputAdapter.setScene(edit)` removes its local position but sends no cancellation. The receiver retains the ghost object indefinitely while heartbeats continue. A deterministic inline socket probe confirmed initial `[sync,start,heartbeat,position]`, then **no outgoing packet after deleting the only sound node and invoking the position tick**, although local diagnostics report zero objects.

The complementary case is a note→beat edit under the same stable ID: the local position cache is unchanged; Engine emits cancellation for the former kind; receiver removes the node's position; the next trigger finds the local cached position unchanged and sends no replacement. Independent control trace after the replacement was `[cancel, trigger]`, with no intervening position. The actual receiver's validated path therefore rejects the trigger for lacking its required position. A delayed delete cancellation after an Undo re-add has the same cache-ordering hazard.

Locations: `src/output/OutputAdapter.ts` setScene and event(cancel), and `src/audio/AudioAdapter.ts` send/setScene. Minimal repair: output scene synchronization sends cancellation for removed former sound-node IDs itself, before any new position sends, independently of audio activation. After forwarding any engine cancellation, invalidate the position-send cache for still-current affected node IDs and resend their current positions, preserving cancel-before-position-before-trigger ordering. Preserve trigger-ID cancellation/release behavior and test locked deletion, same-ID kind replacement, and rapid delete/Undo restoration on an isolated receiver.

Final repair: `setScene(edit)` now sends removed sound-node cancellation independently of audio; engine cancellation invalidates any surviving node position cache and sends the replacement position before another trigger. The reviewer verified the mocked traces `[cancel]`, `[cancel, position, trigger]`, and `[cancel, position, cancel, position, trigger]` for locked deletion, kind replacement, and delayed cancellation after restoration respectively.

A separate **actual ephemeral WebSocket/UDP receiver probe** using the production OutputAdapter completed in 0.37 seconds without a browser or shared-port producer. Results: locked deletion reduced receiver objects **1→0** with zero drops; replacing note→beat cancelled `s1-1` and delivered only `s1-2`, retaining one object and zero drops; deletion/restoration followed by delayed engine cancellation still delivered `s1-3`, again one object and zero drops. IR-02 is closed for the final hashes below. This short deterministic probe proves ordering/recovery, not long-run timing qualification.

## Audio-thread bounds and telemetry stress

Earlier independent simulated-worklet probes used 48 kHz, 128-sample quanta and F08:

- With event acknowledgments held for 250 ms (.75–1.00 seconds), maximum active voices were 64, sample peak 0.980000019 (Float32 rounding), telemetryDrops=0, and no error. After Pause at the first block at/after 1.1 seconds, output was exactly silent after 1.13 seconds.
- With acknowledgments withheld for 1.5 seconds, the worklet explicitly failed with `Audio event consumer stalled: reliable backlog exceeded 2048 records.`, paused, and reached zero pending/active voices. The observed telemetryDrops counter was 700. This demonstrates bounded failure, not uninterrupted performance under an arbitrarily stalled consumer.
- The rerun audio suite independently checks analytic .25/.5/.75-second first signal to <5 ms, exact sample-offset behavior, three simultaneous chord voices, 440 Hz spectral dominance, finite deterministic percussion, cap/steal ordering, saturation <.99, 20 ms release, and >20 ms late drops. Worklet tests separately exercise startup gaps, repeated warm-up, pause/load cancellation, and explicit recovery.

These are synthesized sample buffers and simulated processor evidence. They do not substitute for captured browser-output onset timing, physical mono routing, listening, or audible release measurement. The current offline PCM artifact was inspected and its synth/engine hashes match the reviewed source; it likewise is not live-loopback evidence.

## Receiver timing and remaining acceptance evidence

The reviewer independently counted the archived actual records and compared their IDs with the recorded scheduled comparison window:

| Archived run | Expected in window | Actual matching onsets | Missing IDs / actual rejection |
| --- | --- | --- | --- |
| `candidate-01-F01-two-minute.json` | 180 | 176 | `s2-13`, `s2-155`, `s2-169` late-dropped at 37.19, 36.27 and 39.41 ms; `s2-46` rejected outside scheduling window. |
| `candidate-01-F04-two-minute.json` | 420 | 417 | `s3-69`, `s3-96`, `s3-259` late-dropped at 26.30, 28.13 and 53.25 ms. |

Archived F04 contains 418 total raw onset rows, including `s3-421` outside the scheduled comparison window. Filtering by the scheduled IDs gives 417 legitimate in-window receipts; the extra boundary row must not be called a duplicate. Received-event p95 values near 1.3/1.4 ms cannot compensate for missing expected events. Both exact-once gates remain failed for these runs. The candidate archive reports an unchanged served bundle. The run overlapped other agents' browser/build activity, so these measurements do not isolate receiver-main-loop blocking from host scheduling.

Artifact SHA-256: F01 `7f199cc1ac7c9f85d0389d1c9635b390b0d45e98947d80e89cfd7bde6cbd928f`; F04 `e6596d70908572cafcd49cc98c5b64fc605d106769ab6019135bdc8576e06d90`.

Recommended next diagnostic: keep the 20 ms drop rule; record queue/intended/callback times, Node event-loop delay and utilization, host load, clock uncertainty and stalls; rerun with other build/browser work stopped. If receiver-main-loop blocking is demonstrated, a dedicated bounded scheduler worker is an option, with cancellation/session ordering verified across that boundary. Moving timers or adding a busy wait does not establish real-time host guarantees. The lead added event-loop delay/utilization and timer/heartbeat metadata without changing the deadline/drop semantics; this delta was inspected. A repeated failure keeps the gate open.

The proposal `evidence/Acceptance-Coverage-Proposal.json` maps only specific existing assertions/artifacts. It is a proposed status update for lead review, not a milestone closure. In particular:

- Actual-output timing requires ≥120 captured product onsets across the required fixtures, fixed measured latency compensation, 100/250 ms main-thread stalls, and no missing/duplicate ordinary events. The separate oscillator capture probe does not pass this product gate.
- Browser statuses, EngineEvent onsets and offline PCM are distinct from audible output. Actual Safari parity and the unfamiliar-player first-minute exercise remain separate; none receives a human pass here.
- Visual/audio synchronization needs at least 30 measured audiovisual onsets. Low FPS screenshots and timestamps are insufficient.
- Sustained receiver loops, position traces and the 30-minute F06 run must be assessed against their exact immutable source hashes and complete results. Interrupted attempts remain evidence of failure/interruption, not successful soak evidence.
- Physical touch, actual venue audio/interpolation, hall listening and iOS device qualification remain outside this review.

## Final delta verification

After the main independent command set, the lead changed centralized Clear readiness, persistent capacity-error state, receiver timing instrumentation, and final output cancellation/resnapshot ordering. The reviewer inspected those changes and independently reran Clear/Redo auto-start, actual-receiver processor-error callback handling, and all three IR-02 cancellation/resnapshot scenarios. The lead reported the updated build, 47 unit tests and 11 app/control browser tests passing; those reported broader reruns are distinguished from the reviewer's own command results above. Receiver deadline behavior was not loosened.

## Reviewed source hashes

SHA-256 records identify the source actually inspected and tested. Production changes after these hashes require relevant rechecks. No source commit was available for the original new-file candidate.

| File | SHA-256 |
| --- | --- |
| `src/core/contracts.ts` | `497e8bae2417ccd0652407a9a33dc08a775b56de8e54553465a2ee158ececdfc` |
| `src/core/engine.ts` | `19e5cba94b0db6c13b642bd28c90bc1def4bb0bc7ac6b5a95faf1e82bfa9aea3` |
| `src/core/history.ts` | `71f9ef8099f2f0c04c2776565dca882580a5d16f13cfeb8e3bbd4e0682182b2f` |
| `src/audio/AudioAdapter.ts` | `00a1a7dc4110410029f9bec97070a6d2116a96098987f1e736dcf06df026c227` |
| `src/audio/processor.ts` | `21f41689ecaba9ec56794a67df80258afe2cb21f6936e895f5e1be30200bcbf4` |
| `src/audio/synth.ts` | `499f1d4aadfad5ce2c94082f19724eb24e411b4cbe5ccf2515f6d65754619191` |
| `src/output/OutputAdapter.ts` | `1de9d6f130354479e068a54b4d7db12396bd1cd2dae2cdc06ff9eb8e8a3c1e84` |
| `src/output/protocol.ts` | `85f2219aad582737d93ff0a3bfd3afe4f0441ea6065262847a9ec3e301190c37` |
| `src/output/bridge.ts` | `67ba181b0d778277edccbf82c2b46b735b96fba359842c011cb912c221060813` |
| `src/main.ts` | `6761945b12c918e4877afd1cd4879ea5f9b1470c8a9449f6e04ea77ce6926243` |
| `tests/controls-browser.spec.ts` | `0a4425af71cf2d6fbd278ae1f2e7146fc85cb99bf79252f736c9f02fda84c3c0` |
| `tests/worklet.test.ts` | `e8f47c2d04bfc9482387cc271fcdf4b084c4dccad12415ee940801fa2cd5abd1` |
| `tests/audio.test.ts` | `6876cf7f667952fc907413471386ff5340ea37fb848fa4995999264527de9bbc` |
| `tests/bridge.test.ts` | `7a80532803a30891bd0b475e53a4941dc43e3303f4995d99610a64789b305545` |
| `tests/app-browser.spec.ts` | `dc8340c3e0783d83d58c552b82c06e06cb3d5a95ebb6aaa91e544f5a0b517b76` |

## Narrow acceptance-regression recheck — 2026-10-11, after 18:29 UTC

Read-only review of the added schema, pitch/scale and F09 assertions; no test, browser, audio or network probe was launched during the final soak. The application `src/` remains unchanged from commit `9621617`. All 58 file hashes in the current [source snapshot](../source-snapshot.json) match disk. Earlier command results and hashes in this report remain historical evidence, not a claim that every later artifact was rerun by this reviewer.

The schema test independently accepts 92 occupied vertices and BPM 40/180, rejects BPM 39.99/180.01, and requires the explicit `too_big` issue on `pieces` for 93 entries. Thus the unavoidable duplicate occupancy in the 93-entry example cannot alone satisfy the assertion. These tests support S01-A24/A26, not exhaustive coverage of every numeric field.

Pitch expectations are independent numeric constants for E4, B4, E-flat4, A-flat4, A4, C5, D5 and C-sharp4; they agree with reference MIDI notes 64, 71, 63, 68, 69, 72, 74 and 61 under A4=440 Hz equal temperament. Pentatonic degrees 5/6 check octave overflow. The scale-edit test preserves the committed E4 trigger and checks that the next emission at two seconds becomes E-flat4. This supports the specific S06-A21 scenario; it is not a listening or spectral measurement.

One F09 oracle gap was found and repaired by the lead: aggregate totals initially allowed the last two batches to be redistributed. The final test checks **all four** beat/time pairs `(8,23/6)`, `(16,6.5)`, `(24,55/6)`, `(32,71/6)`, each with eight distinct generator IDs and 672 distinct generator/node pairs. These constants follow independently from beat 1 occurring at 1.5 seconds at 40 BPM, then `time = 1.5 + (beat − 1)/3` at 180 BPM. Totals of 32 emissions and 2688 unique trigger IDs, plus exactly one unchanged arrival for each initial committed trigger, now support the stated F09 no-duplicate/no-replay scenario. Final engine-test SHA-256: `66d9545645307669f725f29df9f12ac2d17e80af3c324ebdcd6b988162bb1130`.

The retained [latest unit results](../unit-results.json) show all 52 tests passing after this repair, including F09. The earlier [verify report](../step-10/verify-report.json) and log show type/build and 28 installed-Chrome checks passed before the final test-only strengthening. These are inspected execution artifacts, not new reviewer executions. The lead was asked to link the latest unit artifact from the F09 ledger entries, whose earlier 27-test result predates that strengthening.

No unsupported human pass was found: the ledger has no passed human IDs, keeps all milestones open, retains the failed F01 receiver exact-once gate, and leaves the final-revision 30-minute gate open while its capture runs. The separately reviewed F02 audiovisual result remains a headless measured subset. This appendix does not accept M1 or qualify the ongoing soak.
