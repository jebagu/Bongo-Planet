# Bongo Planet — Step 13 review

**Step:** Calibrate and accept hall playback  
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
| S13-A1 | Channel-identification logs match approved map. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A2 | Actual configuration matches approved map. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A3 | Control measurements meet agreed limits. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A4 | Audio measurements meet agreed limits. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A5 | Calibration probes transform correctly. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A6 | Saved scene preserves object identity after reload. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A7 | Saved scene preserves coordinates after reload. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A8 | Pause releases venue voices. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A9 | Clear releases venue voices. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-A10 | Disconnect releases venue voices. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S13-H1 | Operator checks every physical channel. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H2 | Operator checks subwoofer path. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H3 | Measured geometry is verified in hall. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H4 | Orientation is verified in hall. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H5 | Mono monitoring is tested separately. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H6 | Predeclared safe test level is used. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H7 | Blind listener identifies right for exact probe. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H8 | Blind listener identifies left for exact probe. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H9 | Blind listener identifies forward for exact probe. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H10 | Blind listener identifies back for exact probe. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H11 | Blind listener identifies up for exact probe. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H12 | Blind listener identifies down for exact probe. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H13 | Blind listener identifies actual F07-node directions. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H14 | Blind listener follows relocated source. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H15 | Blind listener follows adjacent surface trajectory. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H16 | Direction table records requested and perceived directions. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H17 | Direction table records ambiguous cases. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H18 | Direction table records listener positions. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H19 | Unresolved direction retains open gate or explicitly reviewer-approved acceptance revision. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H20 | Chord musical identity survives spatial rendering. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H21 | Phrase musical identity survives spatial rendering. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H22 | Overlap musical identity survives spatial rendering. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S13-H23 | Reviewer/operator sign off final measured profile and hall results. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): final measured profile, per-channel checklist, direction test table, hall demonstration recording, timing measurements, and reviewer/operator sign-off. A room recording supports the session record; it cannot alone prove spatial direction. **M2 closes only after actual in-hall playback and listening acceptance.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
