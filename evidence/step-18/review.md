# Bongo Planet — Step 18 review

**Step:** Implement touch instrument and lifecycle  
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
| S18-A1 | Shared golden behavior tests pass on iOS engine. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A2 | Lifecycle transitions cancel old work. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A3 | Lifecycle transitions release old voices. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A4 | Repeated load cannot leak voices. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A5 | Repeated load cannot leak objects. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A6 | Repeated Clear cannot leak voices. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A7 | Repeated Clear cannot leak objects. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A8 | Multi-touch ownership follows shared contract. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A9 | Occupancy follows shared contract. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A10 | Wander follows shared contract. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A11 | Freeze follows shared contract. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A12 | Import failures preserve valid scene. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A13 | Web-to-iOS-to-web JSON preserves musical settings. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-A14 | Web-to-iOS-to-web JSON preserves current-schema meaning. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S18-H1 | Each named supported device completes first-minute touch interaction. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H2 | Each named supported device completes all F05 touch edits. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H3 | Background/foreground recovers correctly. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H4 | Lock/unlock recovers correctly. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H5 | Audio interruption recovers correctly. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H6 | Audio route change recovers correctly. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H7 | Venue network loss shows truthful state. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H8 | Venue reconnect recovers correctly. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H9 | No lifecycle/network test leaves stuck sound. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H10 | No lifecycle/network test creates duplicate backlog. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H11 | No lifecycle/network test loses scene. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H12 | No lifecycle/network test shows misleading running status. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H13 | Import web-made scene on device. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H14 | Export device scene back to web. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H15 | Phone/tablet layout matches supported-device decision. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H16 | Touch palette is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H17 | Touch snapping is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H18 | Touch orbit is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H19 | Touch pinch is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H20 | Touch inspectors are usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H21 | Touch transport is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H22 | Touch Undo is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H23 | Touch save is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H24 | Touch import is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H25 | Touch export is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H26 | Reduced motion is usable on supported devices. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H27 | Selected M3 presentation is usable on supported devices. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S18-H28 | Selected M3 movement is usable on supported devices. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): installable candidate, device recordings, lifecycle checklist, round-tripped scenes, and event/audio reports. **Pass when the complete instrument is usable and recoverable on actual supported devices.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
