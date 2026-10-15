# Bongo Planet — independent remaining M1 evidence review

Reviewed 2026-10-12. This review reads the original requirements, bounded source and retained reports. It does not execute the application, tests, receiver, browser, profiler, capture, or an audio analysis. No PCM or event-JSONL stream was scanned. Only this note was written; root owns acceptance decisions.

**Recommend the original-scoped automated closures S09-A11, S09-A17, S09-A22 and S10-A17. Additionally, recommend S09-A8 for identity consistency across all 600 required controls.** The latter corrects the worker note's unnecessary dependency on S09-A6. F01 exactly-once delivery remains **FAILED** at 179/180, and the combined Step 09 gate remains open. S09-A9 and automatic changed-state reconnect S09-A15 remain open. None of these recommendations accepts M1 or qualifies acoustic output.

## Evidence and source boundaries

The reviewed worker note is `Readback.md`, 13,974 bytes, SHA-256 `00c74b606f260c890a5f1f447230f3ee33a6523a609926098af32f32c390a1a8`. Its `Source-and-Evidence-Bindings.json` lists 24 inputs / 1,100,868 declared bytes. Twenty-two match current bytes. The two mutable acceptance documents have changed since that snapshot:

| Input | Snapshot SHA-256 | Independently observed current SHA-256 |
| --- | --- | --- |
| `Acceptance-Checklist.md` | `99dcc1bb559dcb1c92de4c7922cdf59375fdca36ee8f4ba7aa25a6f4815c0980` | `3ebe173fa1f7e90f5e33ad44e962759af139d1945f5d7609c870245b1c1605c1` |
| `evidence/acceptance-results.json` | `86da0580962ae519b93026b1c0c3c48347857216f634e32b8ea8b02521eb51d6` | `953102cff3007f38f2d7825203557212b305a3c22b7d98890ee109b730f3a398` |

These are snapshot-to-current differences in root-owned working acceptance documents, not evidence of changed acquisition reports. Do not claim all 24 entries still bind the current checkout, or use the snapshot's open-row count as a permanent current count. The other 22 bindings, including original requirements, source files, selected test reports and prior independent reviews, matched at this readback.

The native acquisition used bridge `c24a37011f631df7a979b5c4010b1b96baa22b6799abae4c231c95246deec460`; current bridge is `e4014cac06d534fcaa24021609313d3c1f1082a7ab5dc2efa31487c626140614`. Direct diff confirms only the WebSocketServer options/comment change: `allowSynchronousEvents:false` and explicit `perMessageDeflate:false`. NativeClock remains byte-identical `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173`; protocol/receipt/release logic is not changed by that bridge delta. This supports carrying forward specifically preserved semantics, not relabeling the historical acquisitions as runs of today's entire source tree.

The retained 29-case Chrome suite binds historical main build `3c462437…` and OutputAdapter `bd46913c…`. Current OutputAdapter is `70d3cb4326689f0348a86a5f1929ca0a3ff6b32d95be24a303944fac53763089`, with subsequent movement-recovery changes. Direct old/current comparison confirms that public non-edit replacement still sends stop, changes the session generation, and starts a fresh snapshot; the current start additionally resets recovery state. The adapter as a whole is **not** byte-identical to that historical browser run. `src/main.ts` remains `6761945b…`; its validated `apply` routes Clear and load modes as described below.

## Original clause interpretation

Work-Package Step 09 explicitly says its gate proves **control/event delivery to a test receiver**, with actual spatial sound reserved for M2. Its automated sentence separately requires exactly-once arrivals and position matching, then observable loss, epoch, disconnect/reconnect, Clear and pending-cancellation handling. An acoustic-release certificate is not a missing prerequisite for the three control-lifecycle recommendations.

| Atom | Independent recommendation | Actual scope |
| --- | --- | --- |
| S09-A8 — Every trigger matches its position object. | **Supported** | All 180 F01 and 420 F04 required controls have matching accepted identity/position evidence, including the explicit late-drop outcome. No lost onset is reclassified as delivered. |
| S09-A11 — Traffic loss produces observable handling without stale playback. | **Supported for the reliable musical transport** | Actual WebSocket loss releases active receiver control state and cancels future work through its original deadline. This is not a universal UDP-loss detector. |
| S09-A17 — Clear produces observable stop/release handling. | **Supported by compositional control evidence** | Actual native Clear releases active/future controls; actual public UI Clear empties the receiver; unchanged relevant source connects that UI action to the tested stop/epoch behavior. |
| S09-A22 — Scene replacement invalidates old traffic. | **Supported by compositional control evidence** | Actual C→D replacement cancels old work, rejects retired C traffic and accepts D once; public load uses the same validated mode/epoch transition. |
| S10-A17 — Maximum-workload stress run covers declared supported limits. | **Supported as workload coverage** | Actual F08 exercises maximum configuration/fanout and long release with both declared stalls; actual F09 reaches the pending limit and recovery policy. This does not make failed/open timing, fidelity or listening results pass. |

The requirement does not demand an exhaustive Cartesian product of every legal sound parameter. Conversely, merely exercising a maximum workload cannot replace any separately stated performance or audio threshold.

## Full-denominator identity check: S09-A8

I independently regenerated the 120-second schedules with literal fixture periods/delays: F01 period 2 s with near/far/kick offsets .125/.5/.625 s; F04 period 1.5 s with offsets .125/.25/.375 and period 2 s with offsets .75/.75/.625. These reproduce 180 and 420 required controls exactly. The selected retained schedule/receiver/OSC arrays were inspected; no audio data or large telemetry trace was analyzed.

For **every** required ID, I verified exactly one queue record and exactly one onset-or-late-drop outcome; matching generator, node and integer object ID; fixture/topology XYZ; an earlier matching position record before queue admission; and independently decoded matching raw OSC preceding the outcome. The reported diagnostic position is not inferred from an acoustic signal. This is the control identity scope required by Step 09.

| Recomputed check | F01 | F04 |
| --- | ---: | ---: |
| Independent expected / scheduled / joined identities | 180 / 180 / 180 | 420 / 420 / 420 |
| Successful onsets | **179** | 420 |
| Explicit late-drop outcomes | **1** | 0 |
| Identity / coordinate mismatches | 0 | 0 |
| Raw OSC packets independently decoded | 13 | 8 |
| Minimum matching prior OSC lead, ms | 116.583209 | 119.009667 |
| Maximum OSC Float32 coordinate difference | 2.60486618e-8 | 2.60486616e-8 |

F01 mapping is near→1425233680, far→1022892529, kick→1176245026; F04 is shared-a→430201711, shared-b→413424092, hat→1925126085. All remain unique/stable within the corresponding retained epoch. All 21 raw byte strings decode exactly to their retained addresses, integer IDs, `,fff` tags and Float32 values.

The failing `s2-132` is explicitly generator `gen`, node `kick`, object 1176245026, XYZ `[0.5773502691896258,0.5773502691896258,0.5773502691896258]`. Its earlier queue and position/OSC evidence agree. The native callback is 20.920250 ms late and creates no control voice. That is a delivery/scheduling failure, **not absent or mismatched identity evidence**. A8 can therefore pass as a separate conjunction while A6 and the combined sentence/gate fail. The worker note's statement that the missing onset necessarily prevents the identity atom is too strong; do not copy that dependency into the ledger.

Rechecked report bindings: F01 17,225,484 bytes / `6f26c61fa2f5650e7bc72e47db3368df07f335ddbee4e0482ea858bee4d39b3b`; F04 18,109,496 bytes / `63cdb5c282f15bc40b83906e36cfa3c51c6f3bf22ca2d551a84a081d03787133`. This narrow recheck does not requalify their clock conversion, change any denominator, or substitute outcomes for acoustic onsets.

## Loss, Clear and replacement

The actual native lifecycle child report hashes to `c6338897361cdce3cffb639e23e05f1cd10a140a1ffc08fb1a14cf123a954c3c`. I rechecked its three passed cases, 78 producer packets, 287 worker rows, 45 bridge rows and five raw OSC records. Its 60 internal applied sequence numbers are exactly 1–60. Eight unique queued controls produce four unique onsets; the other four future controls have no onset after release. Sixteen retired-epoch packets are rejected.

Release mutation brackets lie inside the corresponding first subsequent musical applied-command bracket. Newer authoritative empty worker states follow loss/Clear/final stop; replacement releases C before D becomes current. Retained observations run beyond the unchanged A, B and C future deadlines plus 100 ms. The prior independent review's release margins remain valid: 976.125311 ms for loss, 882.580603/575.951978 ms for Clear, and 955.781061 ms for replacement. D's new object 77 / node `node:new/scene` / XYZ `[0,0,-1]` executes once. Final worker state is empty and native close acknowledges with exit 0; no errors are retained.

This acquisition's earlier extra root preflight failed path resolution and was corrected after the run; prior explicit authorization and source GO are separately recorded. It is not a successful prelaunch binding check. That historical qualification is unchanged.

The actual Chrome report has 29 expected, zero unexpected/flaky/skipped, and no suite errors. Its public `disconnect, Clear and page reload release actual receiver sessions` case passes in 1987 ms: F01 reaches an actual receiver onset, disconnect empties the receiver, reconnect occurs, Clear empties objects/pending/voices, F07 load reaches six objects, and page reload empties receiver state. It does not prove an active voice remained at the public Clear instant or inject stale packets during that UI load. Those are separately tested native cases, connected by source: `main.ts` Clear calls `apply(emptyScene(),'clear')`; restore/import/fixture and exposed validated load paths use `load`; OutputAdapter non-edit replacement stops the current epoch and creates a new one.

This is explicitly **source plus separate actual protocol/UI evidence**, not one invented integrated acquisition. It is adequate for the original bounded automated control clauses. Human Clear review, arbitrary individual UDP loss, and physical sound release remain separate. The same browser case checks only reconnect's `connected` state before Clear, so it does not close automatic synchronization of a changed composition (A15).

## Maximum-workload coverage

The actual binary capture F08 segment contains exactly 92 pieces: eight enabled generators, 42 notes and 42 beats. BPM is 180; all generators use period 1, phase 0 and 180° reach; notes last 8 s, beats decay 4 s. Its actual monotonic duration is 20.004466458 s. The already independently audited fixed window is 147.5093333334745–167.5093333334745 context seconds, original indices 54956–62456 inclusive, 7501 blocks / 960128 samples per path. No PCM was reopened for this review.

Both actual browser stalls contain their declared independent group targets: 100 ms around 155.5093333334745 s and 250 ms around 159.5093333334745 s. Final audio status is running, 64 voices, 368 pending, sequence 40992, 54902 steals, and zero reported engine/audio late or telemetry drops. Only sampled status is available; the two snapshots are not continuous proof of pending maxima. The complete capture remains `qualificationPassed=false`; the strict nominal F06/F08 waveform and unresolved dense-onset results retain their actual failures/limitations.

The retained corrected F09 capacity evidence reaches 5376 pending after eight legal phase edits, then resets sequence 5377 and visibly pauses. `recovery.json` directly retains pending/voices 0, error caption, paused state after Enable plus an unrelated edit, and explicit-Play recovery measuring 6.232 beats / 2.077333333333 s = 180 BPM. The earlier failed phase-clock/first completeness attempts remain preserved. This isolated test has output disconnected and does not demonstrate release of previously sounding remote voices.

The historical full Chrome suite's real F09 case passes in 12021 ms. The canonical clean unit report has `success=true`, 129/129, including independent F08 672 pairs / 2016 triggers in `[0,1)`, maximum-bound/suspension, F09 overtaking and capacity/tempo recovery expectations. The earlier 129-assertion report with an overall failure is not substituted for this successful suite. These actual workload and independent expectation records support S10-A17's coverage claim, not all downstream performance or music-quality conclusions.

## Remaining limits and disposition

- Keep **S09-A6 failed** at 179/180; A8 identity closure does not supply its missing onset, improve its maximum error or qualify the combined loop.
- Keep **S09-A9 open**: performance→Node→native-worker bounds do not measure continuous AudioContext→performance conversion.
- Keep **S09-A15 open**: manual fresh-peer snapshot and source plausibility are not an observed automatic changed-state reconnect.
- Full live-output timing/missing/duplicate proof, physical listening, Safari/human requirements and all unfinished milestone gates retain their own status. No new prerequisite was introduced, and none was waived.

Root may record the five scoped atom recommendations above with these exact denominators/source boundaries. The original acquisition/helper failures, separate audio/control domains and combined gate status remain unchanged.
