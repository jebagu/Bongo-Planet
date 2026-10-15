# Bongo Planet — Step 16 review

**Step:** Deliver inside view and performance mode  
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
| S16-A1 | View changes preserve scene data. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A2 | Mode changes preserve scene data. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A3 | View/mode changes preserve generator state. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A4 | View/mode changes preserve sound IDs. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A5 | View/mode changes preserve object IDs. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A6 | View/mode changes preserve XYZ output. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A7 | Picking works in supported outside view. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A8 | Picking works in supported inside view. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A9 | Transitions do not duplicate voices. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A10 | Transitions do not duplicate callbacks. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A11 | M1 regression checks pass. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A12 | M3 performance checks pass. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A13 | M3 timing checks pass. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A14 | Reduced-motion checks pass. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A15 | Resize checks pass. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-A16 | Mode-exit checks pass. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S16-H1 | Switch outside to inside during F04 playback. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H2 | Switch inside to performance during F04 playback. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H3 | Switch performance to editing during F04 playback. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H4 | Music continues through transitions. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H5 | Source positions do not move with camera. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H6 | Locate pause quickly. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H7 | Locate mute quickly. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H8 | Locate freeze quickly. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H9 | Return to selected piece. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H10 | Unfamiliar final-interface player completes first-minute generator/two-note/beat pattern without coaching. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H11 | Unfamiliar final-interface player makes audible edit within first minute without coaching. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H12 | Final first-minute elapsed time/confusion and cause explanation are recorded. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H13 | Reviewer accepts interior depth. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H14 | Reviewer accepts interior legibility. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H15 | Performance mode exposes essential transport/mute/freeze/level/output status. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S16-H16 | Return-to-outside/editing control is usable. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): view-transition recording with sound, performance screenshots, updated novice result, and M3 acceptance checklist. **M3 closes after Steps 14–16 and the browser regression checks pass; any venue-specific M3 claims also require their actual venue tests.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
