# Bongo Planet — Step 19 review

**Step:** Qualify parity and deliver iOS release candidate  
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
| S19-A1 | Every reference fixture matches target selection between web/iOS. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A2 | Every reference fixture matches pitch between web/iOS. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A3 | Every reference fixture matches generator provenance between web/iOS. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A4 | Every reference fixture matches cancellation between web/iOS. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A5 | Every reference fixture matches committed timing within established tolerances. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A6 | Supported-device dense 30-minute runs stay within declared limits. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A7 | Supported-device dense 30-minute runs show no continuing queue growth. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A8 | Supported-device dense 30-minute runs show no continuing object growth. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A9 | Selected venue-protocol tests pass through device connection. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-A10 | Every required M4 check has individual result/evidence reporting. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | No complete execution evidence |
| S19-H1 | Unfamiliar touch player builds generator/two-note/beat repeating pattern within minute without coaching. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H2 | Unfamiliar touch player makes audible pattern edit within minute without coaching. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H3 | Device first-minute elapsed/confusion and cause explanation are recorded. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H4 | Reviewer loads same scene on web and iOS. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H5 | Reviewer compares chord behavior. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H6 | Reviewer compares phrase behavior. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H7 | Reviewer compares overlap behavior. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H8 | Reviewer compares wander behavior. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H9 | Reviewer completes lifecycle review. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H10 | Demonstrate device venue output against receiver. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H11 | If actual hall support is claimed repeat M2 directional tests on device sound path. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H12 | If actual hall support is claimed repeat M2 timing tests on device sound path. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H13 | Bundle includes installable artifact or reproducible signed-build instructions. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H14 | M4 bundle includes source. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H15 | M4 bundle includes lockfiles. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H16 | M4 bundle includes compatible fixtures. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H17 | Bundle includes user review guide. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H18 | M4 bundle records unresolved limitations. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H19 | M4 bundle records actually tested devices. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H20 | M4 bundle records actually tested output configurations. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S19-H21 | App Store publication remains separate from build delivery. | Required M1 acceptance is still open; later implementation deferred per work package. Physical devices/signing and venue dependencies also unresolved where applicable. | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): installable/reproducible build, comparison recordings, device first-minute result, soak results, compatibility table, and signed-off checklist. **M4 closes only for the device/output configurations actually tested. Untested hall connectivity or unsupported devices remain explicit limitations.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
