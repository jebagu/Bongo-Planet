# Bongo Planet — Step 15 review

**Step:** Add controlled wander and freeze  
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
| S15-A1 | Identical seed/settings produce identical moves. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A2 | Only neighboring vertices are reached. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A3 | Occupancy never overlaps. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A4 | Reservations never overlap. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A5 | Motion paths stay on sphere surface. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A6 | Movement is independent of rendering FPS. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A7 | Full occupancy with no legal moves does not deadlock. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A8 | Freeze follows declared safe-state policy. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A9 | Mute releases/suppresses sound while movement continues. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A10 | Pause stops transport and suspends wander until resume. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A11 | Sustained voice positions track interpolation. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A12 | Deleting moving node cancels position updates. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A13 | Saved movement settings round-trip. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A14 | Load starts paused. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A15 | Load retains no stale reservations. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A16 | Simultaneous motion proposals resolve deterministically. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A17 | Only arrival commits destination vertex/relationships. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A18 | Manual input takes movement ownership. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A19 | Clear cancels movement/reservations. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A20 | Delete cancels movement/reservations. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-A21 | Load cancels movement/reservations. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S15-H1 | Let F01 wander. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H2 | Freeze a desirable pattern. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H3 | Listen for two cycles while frozen. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H4 | Unfreeze pattern. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H5 | Mute and observe continued motion. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H6 | Pause and observe movement suspension. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H7 | Drag wandering piece and observe clear ownership. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H8 | Watch sustained moving source in receiver. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H9 | When M2 is available verify sustained wander interpolation in actual renderer. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H10 | When M2 is available verify sustained wander interpolation in hall. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S15-H11 | Movement, freeze, mute, and transport states are visibly distinct. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): motion/state recording, seeded movement log, receiver position trace, and updated scene schema/migration evidence. **Pass when movement is controllable and introduces no occupancy or sound-ownership errors. Venue wander qualification is tracked separately if M2 is blocked.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
