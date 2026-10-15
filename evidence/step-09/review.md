# Bongo Planet — Step 09 review

**Step:** Prove venue output with inspectable receiver  
**Status:** open — atom-level evidence recorded below; required gates remain unaccepted
**Source revision/snapshot:** [source snapshot](../source-snapshot.json); individual immutable captures retain their own hashes
**Run date/time/timezone:** 11October2026, Europe/Istanbul; exact UTC timestamps in linked reports
**Builder/tester:** Codex lead/workers; independent review recorded separately
**Human reviewer:** not recorded (required for H checks)  
**Prerequisite steps/gates:** see Work-Package.md; not accepted by this template

## Environment

- Reference environment: [environment.json](../step-01/environment.json).
- OS: macOS26.5.1 build25F80, arm64.
- Toolchain: Node22.20.0/npm10.9.3; exact package versions in package-lock.json.
- Chrome155.0.8059.39; Safari26.5. Individual browser acceptance scope is recorded separately.
- App browser tests1440×1000; view harness1000×820; narrow390×844; default testdevice scale1. Native Safari screenshot retains actualwindow.
- Referenceoutput MacBook Pro Speakers48kHz. Actualcapture routes explicitlynamedvirtualSPAT/Aux at48kHz; per-run report authoritative.
- Earlier product-derived calibration13.4167ms provides relative stability only and can hide constant product delay. Corrected F02 AV subset uses independent native-click route calibration13.3333ms; full original-dense/Safari timing and human acceptance remain open.
- Three.js WebGL2, tested60/15/2 renderFPS; softwareheadless flags inreports.
- No available physical iOS device/signing route verified.
- Actual venue profile/network/synth/renderer unavailable.
- Sceneversion1; topologyicosa-3v-v1; F00–F09actualJSON inpublic/fixtures.
- Command working directory: project root unless explicitly recorded otherwise.

## Commands and method

Actual commands, results and scope are in linked reports, including [verify log](../step-10/verify.log). No human, live-output, venue or device pass is inferred from source tests.

| Command or human method | Date/time | Exit/result | Log artifact |
| --- | --- | --- | --- |
| Per-check method in linked artifacts | Exact timestamps retained in JSON/logs | Specific atom result below | See per-check artifact links |

## Expected versus actual

Expectations below are specified from the work package before execution. Link the independent oracle/calculation where applicable. For failed or blocked checks record the observed difference, dependency, and next action; preserve original failures alongside reruns.

| Test ID | Expected result | Actual result | Status | Artifact / oracle |
| --- | --- | --- | --- | --- |
| S09-A1 | Raw receiver packet decoding reproduces stable IDs. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A2 | Raw receiver packet decoding reproduces normalized coordinates. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A3 | Exact cardinal probes pass coordinate transform. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A4 | Malformed messages are rejected. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A5 | Non-finite messages are rejected. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A6 | Every non-cancelled F01 trigger arrives exactly once over two-minute loop. | Current native-worker receiver delivered179/180 in-window F01 onsets over120.353 actual seconds. s2-132 was queued624.460ms early but its callback was20.920250ms late and honestly dropped. Independent scheduling disturbance observed; specific cause remains unresolved. Earlier failures retained; combined qualification fails. | failed | [Native-Qualification-Review.md](../../evidence/step-09/native-clock-qualification/attempt-01/Native-Qualification-Review.md); [live-report.json](../../evidence/step-09/native-clock-qualification/attempt-01/live-report.json) |
| S09-A7 | Every non-cancelled F04 trigger arrives exactly once over two-minute loop. | Current frozen native-worker receiver delivered420/420 in-window F04 onsets exactly once over120.457 actual seconds, including20 coincident groups targeting the same node from both generators. Two postwindow onsets retained separately; scoped current run only. | passed | [Native-Qualification-Review.md](../../evidence/step-09/native-clock-qualification/attempt-01/Native-Qualification-Review.md); [live-report.json](../../evidence/step-09/native-clock-qualification/attempt-01/live-report.json) |
| S09-A8 | Every trigger matches its position object. | Independent current readback verifies unchanged object/XYZ provenance for all599 delivered controls and the missing F01 diagnostic position, plus21 decoded OSC packets. This partial consistency result cannot count the missing F01 control as delivered or qualify every required trigger. | not run | [Native-Qualification-Review.md](../../evidence/step-09/native-clock-qualification/attempt-01/Native-Qualification-Review.md); [live-report.json](../../evidence/step-09/native-clock-qualification/attempt-01/live-report.json) |
| S09-A9 | Loopback clock-conversion error is at most 10 ms. | Current independent performance-to-Node-to-native-worker conversion bounds are2.115918/1.341917ms, recomputed across600 outcomes and8128 clock brackets. Browser AudioContext-to-performance mapping throughout playback remains unmeasured; end-to-end clock conversion gate stays open. | not run | [Native-Qualification-Review.md](../../evidence/step-09/native-clock-qualification/attempt-01/Native-Qualification-Review.md); [live-report.json](../../evidence/step-09/native-clock-qualification/attempt-01/live-report.json) |
| S09-A10 | Receiver scheduling error is at most 20 ms at 95th percentile. | Current full-denominator native callback conservative p95 errors3.355460ms F01 and3.409750ms F04, including the F01 dropped callback among all180 outcomes. Measured control-clock domain only; F01 exactly-once stillFAILED and audio-to-performance boundary remains open. | passed | [Native-Qualification-Review.md](../../evidence/step-09/native-clock-qualification/attempt-01/Native-Qualification-Review.md); [live-report.json](../../evidence/step-09/native-clock-qualification/attempt-01/live-report.json) |
| S09-A11 | Traffic loss produces observable handling without stale playback. | No execution evidence yet. | not run | No complete execution evidence |
| S09-A12 | Duplicate traffic cannot duplicate voices/events. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A13 | Stale epochs are rejected. | No execution evidence yet. | not run | No complete execution evidence |
| S09-A14 | Disconnect releases remote voices. | independent Chrome plus isolated actual receiver; specific atom only. | passed | [app-browser.spec.ts](../../tests/app-browser.spec.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A15 | Reconnect synchronizes current state. | No execution evidence yet. | not run | No complete execution evidence |
| S09-A16 | Reconnect does not replay missed triggers. | independent execution; specific atom only. | passed | [Independent-Review.md](../../evidence/step-09/Independent-Review.md); [OutputAdapter.ts](../../src/output/OutputAdapter.ts) |
| S09-A17 | Clear produces observable stop/release handling. | No execution evidence yet. | not run | No complete execution evidence |
| S09-A18 | Pending-event cancellation produces observable stop/release handling. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A19 | Receiver watchdog releases voices after 500 ms without heartbeat. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A20 | Initial positions precede corresponding onsets. | independent actual ephemeral receiver and control trace inspection; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A21 | Movement updates retain object identity. | Actual receiver traces/handshake/native WebSocket bufferedAmount stress verifies this atom; no venue qualification. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [backpressure.json](../../evidence/step-09/backpressure.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A22 | Scene replacement invalidates old traffic. | No execution evidence yet. | not run | No complete execution evidence |
| S09-A23 | ADM-OSC /adm/obj/{id}/xyz uses documented sound-node-to-integer mapping. | source mapping inspection plus raw byte and isolated tests; specific atom only. | passed | [protocol.ts](../../src/output/protocol.ts); [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A24 | Bridge sends only to configured destinations. | static destination inspection; specific atom only. | passed | [bridge.ts](../../src/output/bridge.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A25 | Clock handshake reports round-trip delay. | Actual receiver traces/handshake/native WebSocket bufferedAmount stress verifies this atom; no venue qualification. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [backpressure.json](../../evidence/step-09/backpressure.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A26 | Clock handshake reports uncertainty. | static protocol plus mocked handshake execution; specific atom only. | passed | [OutputAdapter.ts](../../src/output/OutputAdapter.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S09-A27 | At 60 FPS actual receiver position age p95 is <=40 ms. | Actual 60FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A28 | At 60 FPS actual receiver position age maximum is <=60 ms. | Actual 60FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A29 | At 60 FPS final position error is <=1e-6. | Actual 60FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A30 | At 60 FPS there is no stale position regression. | Actual 60FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A31 | At 60 FPS object IDs remain unchanged. | Actual 60FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A32 | At 15 FPS actual receiver position age p95 is <=40 ms. | Actual 15FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A33 | At 15 FPS actual receiver position age maximum is <=60 ms. | Actual 15FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A34 | At 15 FPS final position error is <=1e-6. | Actual 15FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A35 | At 15 FPS there is no stale position regression. | Actual 15FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A36 | At 15 FPS object IDs remain unchanged. | Actual 15FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A37 | At 2 FPS actual receiver position age p95 is <=40 ms. | Actual 2FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A38 | At 2 FPS actual receiver position age maximum is <=60 ms. | Actual 2FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A39 | At 2 FPS final position error is <=1e-6. | Actual 2FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A40 | At 2 FPS there is no stale position regression. | Actual 2FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A41 | At 2 FPS object IDs remain unchanged. | Actual 2FPS receiver movement: packet ages within budgets, finalXYZ within1e-6, no regression or ID change; service-independent transport trace, not venue interpolation. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A42 | Position coalescing preserves latest valid movement state. | Actual receiver traces/handshake/native WebSocket bufferedAmount stress verifies this atom; no venue qualification. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [backpressure.json](../../evidence/step-09/backpressure.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-A43 | Backpressure stays bounded and reports staleness rather than silently delaying positions indefinitely. | Actual receiver traces/handshake/native WebSocket bufferedAmount stress verifies this atom; no venue qualification. | passed | [movement-traces.json](../../evidence/step-09/movement-traces.json); [backpressure.json](../../evidence/step-09/backpressure.json); [output-browser.spec.ts](../../tests/output-browser.spec.ts) |
| S09-H1 | Identify each labeled F07 object in receiver. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H2 | Move one note and observe XYZ updates. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H3 | Moving note keeps same ID. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H4 | Rotate camera and observe fixed coordinates. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H5 | Disconnect bridge and observe truthful status. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H6 | Reconnect bridge and observe truthful status. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H7 | Local mono playback remains usable during bridge failure. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H8 | Clear removes active receiver objects. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H9 | Clear releases test voices. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H10 | Receiver displays intended onset, arrival, IDs, and coordinates. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S09-H11 | Receiver launch/browser connection requirements are reproducible. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): launch instructions, captured raw/decoded OSC, event/position table, latency/clock report, and side-by-side browser/receiver recording. **Pass proves control/event delivery to a test receiver. Actual spatial sound remains an M2 gate.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
