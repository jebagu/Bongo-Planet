# Bongo Planet reconnect actual01 independent review

**Recommendation: the retained actual supports S09-A15, “Reconnect synchronizes current state,” for the tested paused UI/OutputAdapter path.** The user-facing reconnect initiates a fresh session and the adapter automatically sends the edited scene's complete snapshot; the harness does not supply the six position packets itself. The same-count edit makes stale snapshot reuse detectably wrong. Root owns the ledger disposition. No broader milestone or musical/physical-output qualification follows.

This review read retained source, complete small JSON traces and all twelve raw OSC packets. No browser, receiver, helper, test, acquisition or rerun was executed by the reviewer. Source01/02 preparation failures remain preserved; only source03 was used for this actual.

## Provenance and completion

`report.json` is 1,000,003 bytes, SHA `61d9f56fb9cb017330658b5cb33a4d04fd925f132132fa42bdd2283e5a49026e`. It records `testPassed:true`, `scopedChecksPassed:true`, `qualificationPassed:false`, errors=[], and no error-overflow/force flag.

The actual helper is source03 `881cd09cdac783aaa9e3aeffa3fcb3b70664641af2c92d1126c4e34358dba0c7`. All 13 report source bindings independently match current bytes. All 66 bindings in the root GO also match; this includes the preflight file added after its recorded 65-input check. The GO hash matches the controller's `goSha256`.

- Root GO: 17,258 bytes, `b63f0a7b30cd8a2d8398fa03f267c3881ccd097a61f644f0c412d98437dd4672`, authorized2026-10-12T05:36:24.290330Z.
- Controller result: 7,789 bytes, `669d8eb86a93bbbd46d8c7091387cf30aeb3da6f203b6a515b82cb007a3b6fb4`; actual command/environment match the GO. It records exit0, no errors or forced cleanup, and3.525733249960467s elapsed.
- Root execution: `e924aac791b5bef8d79a8fcfcf198585efff7cb7a54b745b267e76739c082bda`, launchbe81c0/session52165/terminal9b307d, retryCount0.
- Playwright's retained runner records exactly one expected passing test, no skipped/unexpected/flaky cases, test duration2082ms. Its overall runner duration is2689.284ms; these are distinct from the external-controller duration.

The genuine original page main-script response is697,116 bytes and hashes to `32b57ff2dabeadc3d85f8143cd91c50abeea9785ebb1a2f35497ee1db198bb93`; its retained bytes and both separately fetched before/after main files agree. Both served processor files are105,473 bytes, `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`. The processor is **served-byte evidence only**: the adapter remained locked with no AudioContext, so no loaded-worklet-body or audio execution claim is made.

## Full snapshot and stale-state audit

The initial scene contains exactly right85, left29, forward10, back69, up37 and down53. While disconnected, the harness removes `forward`, moves `right` to10, and adds `reconnect-new-note` at85. The other four pieces and full scene configuration remain unchanged. I independently reconstructed this edit and matched it to `expectedCurrentScene`, the disconnected edited scene, browserAfter and final browser scene. Both snapshots therefore have six objects but different required identities/coordinates.

For each connection I independently checked all six sends against its six receiver position rows and six raw OSC datagrams, with no omitted or extra position rows in either prefix. The golden node/object mapping and independent `normalize(3φ,0,1)` orientations match. Stable `right` keeps object2028154342 at the new forward coordinate; removed `forward`878684189 is absent after reconnect, and the new note uses2136539021 at the old right coordinate. Other stable object IDs remain unchanged.

All twelve datagrams were independently decoded from their hex bytes, including OSC address, padded string boundaries, `,fff` type tag, exact remaining12-byte payload and finite big-endian Float32 coordinates. Maximum wire-position discrepancy from the independent analytic coordinate was1.2412670766e-16; maximum decoded Float32 discrepancy was2.0544909692e-8, below the unchanged1e-6 criterion. Receiver coordinates equal their corresponding sent coordinates. No product geometry or mapping function was imported for this readback.

Initial and reconnect epochs are distinct, ending `idle-2` and `idle-3`. In each connection, exactly eight sync sends match eight real sync replies by original `t0`; each reply follows its send, each next probe follows the prior reply, the single start follows reply8, and all six positions follow the start. Position sequence restarts1–6 in the new session. This is synchronization ordering evidence, not a full audio-clock accuracy certificate.

Native musical ACK and subsequent state were also independently joined:

| Functional boundary | Command sequence | Parent/native objects | Newer native state after applied mutation |
|---|---:|---:|---:|
| Initial snapshot | 8 | 6 / 6 | 13.739000ms |
| Deliberate disconnect | 10 | 0 / 0 | 9.343791ms |
| Edited reconnect snapshot | 18 | 6 / 6 | 23.610291ms |

Those elapsed values describe observation ordering, not scheduling-error measurements. Each state has the required matching session and zero pending, active voices, onsets and late drops. Calibration rows are not substituted for musical applied acknowledgements. The disconnected browser is disconnected, its edited scene is retained without new sends during the edit, and parent/native empty state precedes reconnection.

## Denominators, final faults and cleanup

The last retained browser witness has56 contiguous original indices and10,434 charged bytes:35 sends,16 replies,2 constructs,2 opens and1 close. The sends comprise16 sync,2 start,4 heartbeat,12 position and the **first** deliberate stop. This browser observation precedes the final cleanup disconnect; it is not a complete through-close send trace. The complete retained bridge records separately contain19 rows:12 positions,2 starts and5 stops (two new-session releases, the deliberate disconnect, cleanup disconnect and shutdown). There are exactly12 raw OSC packets. No queued/onset/cancel replay, late-drop, rejected, clock-error, socket-error or steal row appears; no musical trigger was sent.

All retained browser observations show locked adapter, null context/status and empty local events. Final witness error is empty, its connection count is2, and the explicit final-browser-fault-free flag is true. This is the bounded paused path, not an active-playing test.

Final native state is empty: session='', objects0, pending0, activeVoices0, onsetCount0 and lateDrops0. It reports ready=false as expected after close, failure=null, closeFailure=null, clockEvidenceFailure='', reportedFailures=[], and uncertaintyMs0.00373. The last number belongs to native diagnostics only and does not qualify the audio-to-bridge boundary. Native close acknowledgement and observed exit0 are both true. The Source03 final-clock certificate is true; the earlier null-schema and late-fault reporting blockers do not recur in this retained actual.

The report charges369,240 observation bytes,12 retained state rows and12 polls, below its524,288-byte/48-state/256-poll limits. Browser witness, receiver/raw and final report denominators are below their respective caps; no truncation or cap failure is reported.

All six resource closure booleans are true: page, context, browser connection, browser process, native clock and HTTP. Browser exit is0 with no signal and observed close. The durable journal contains exactly one browser claim, PID57367/parent57361. The external controller retained that ownership and ends with `remainingOwned:{}`, no forced cleanup and no errors. Root's separately retained cleanup readback (`55a74849a30ed0e5e3e90df5148e1eee1a126e302d53971bd1f611b6e3a20a44`) records the claimed browser absent and private HTTP57769 refusing connections, with permanent bridge readiness/quiet preserved. These are independent process/HTTP observations plus native ACK evidence, not an exhaustive OS, UDP-process or physical-audio proof.

## Original requirement judgment

The original S09-A15 wording concerns current-state synchronization on reconnect; it does not require autonomous retry or an already playing source. This actual directly exercises the previously missing OutputAdapter integration with a real UI reconnect, fresh sync/session, edited same-count scene and complete current position delivery. It is sufficient for a **scoped pass of that atom** without inventing a stronger active-audio prerequisite. Keep explicit that the edit uses the application's ordinary public edit surface while disconnected and the receiver URL alone is redirected to an owned private native receiver.

It does not establish no-replay behavior for actually missed musical triggers, autonomous reconnect retry, local mono playback usability, acoustic release, full audio-time conversion, sustained congestion, Safari or venue sound. Those remain separate requirements/evidence. Earlier native F01 timing failure and all preparation failures remain unchanged.
