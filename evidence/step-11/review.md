# Bongo Planet — Step 11 review

**Step:** Establish actual Feÿ output contract  
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
| S11-A1 | Venue profile rejects missing channels. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-A2 | Venue profile rejects duplicate channels. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-A3 | Venue profile rejects non-finite speaker coordinates. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-A4 | Venue profile rejects unsupported protocols. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-A5 | Venue profile rejects absent required limits. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-A6 | Unit transforms round-trip. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-A7 | Channel mappings round-trip. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-A8 | Object mappings round-trip. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-A9 | Venue profile can change without changing saved composition. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S11-H1 | Technical owner verifies current speaker count. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H2 | Technical owner verifies measured speaker locations. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H3 | Technical owner verifies coordinate convention. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H4 | Technical owner verifies channel map. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H5 | Technical owner verifies interface. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H6 | Technical owner verifies sample rate. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H7 | Technical owner verifies subwoofer routing. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H8 | Technical owner verifies Reaper role. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H9 | Technical owner verifies available synth. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H10 | Technical owner verifies spatial renderer. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H11 | Technical owner verifies accepted OSC grammar. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H12 | Technical owner verifies object limits. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H13 | Technical owner verifies voice limits. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H14 | Technical owner verifies network route. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H15 | Technical owner verifies monitoring controls. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H16 | Technical owner verifies stop controls. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H17 | Inventory labels each value measured, current configuration, or unknown. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H18 | Technical owner checks routing diagram against actual system. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H19 | Physically identify right axis. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H20 | Physically identify forward axis. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H21 | Physically identify up axis. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H22 | Physically identify subwoofer path. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H23 | Reviewer agrees numerical maximum control-to-sound latency before hall test. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H24 | Reviewer agrees numerical maximum animation/audio discrepancy before hall test. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H25 | Review safe test sound levels. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H26 | Document differences from historical rig. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H27 | Agree actual venue watchdog timeout. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H28 | Profile captures venue orientation. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H29 | Profile captures venue scale. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H30 | Profile captures bass management. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H31 | Chosen independent synthesis/rendering route is explicit with no unanswered routing assumption. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S11-H32 | Renderer-specific position interpolation/freshness qualification method is agreed. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): approved dated profile, inventory provenance, routing diagram, and numerical acceptance limits. **Pass requires current venue data. Missing access or configuration keeps M2 blocked while independent work may continue.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
