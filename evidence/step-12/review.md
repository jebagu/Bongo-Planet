# Bongo Planet — Step 12 review

**Step:** Bench-test complete venue sound path  
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
| S12-A1 | F01 produces expected object assignments. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A2 | F01 produces expected voice assignments. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A3 | F04 produces expected object assignments. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A4 | F04 produces expected voice assignments. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A5 | Position change affects correct object only. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A6 | Deletion preserves cancellation/release ownership. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A7 | Clear preserves cancellation/release ownership. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A8 | Pause preserves cancellation/release ownership. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A9 | Scene load preserves cancellation/release ownership. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A10 | Disconnect preserves cancellation/release ownership. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A11 | Duplicates preserve cancellation/release ownership. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A12 | Captured isolated-object outputs remain independent before renderer mixing. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A13 | Bench timing meets Step 11 limits. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A14 | Profile limits are visibly enforced. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A15 | Object limits are visibly enforced. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A16 | Sources are not silently dropped. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A17 | Renderer movement traces meet agreed interpolation/freshness limits at 60 FPS. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A18 | Renderer movement traces meet agreed interpolation/freshness limits at 15 FPS. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-A19 | Renderer movement traces meet agreed interpolation/freshness limits at 2 FPS. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | No complete execution evidence |
| S12-H1 | Compare single note against mono preview. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H2 | Compare chord against mono preview. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H3 | Compare beat against mono preview. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H4 | Compare overlapping phrase against mono preview. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H5 | Move sustained source and observe actual renderer interpolation. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H6 | Stop bridge and verify no stuck voice. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H7 | Use emergency stop and verify no stuck voice. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H8 | Reconnect without replaying old phrase. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H9 | Identify independent object in actual renderer. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H10 | Identify independent object's actual audio feed. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S12-H11 | Monitoring mode makes local-preview versus venue playback explicit. | Actual measured venue profile, renderer route, operator/hall/listener unavailable. . | blocked | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): renderer screenshots, isolated-object audio/capture, raw control logs, failure/recovery recording, and timing report. **Pass when the full intended sound path works on the bench; hall direction is still unqualified.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
