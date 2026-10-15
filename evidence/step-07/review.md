# Bongo Planet — Step 07 review

**Step:** Make scenes recoverable and shareable  
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
| S07-A1 | Fixture round-trips preserve topology. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A2 | Fixture round-trips preserve piece IDs. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A3 | Fixture round-trips preserve occupancy. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A4 | Fixture round-trips preserve all musical settings. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A5 | Exported compositions contain no venue credentials. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A6 | Exported compositions contain no venue endpoints. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A7 | Undo cannot resurrect cancelled triggers. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [controls-browser.spec.ts](../../tests/controls-browser.spec.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A8 | Redo cannot resurrect cancelled triggers. | Both independently specified History→Engine edit ledgers exclude the original cancelled trigger IDs from every later onset after Undo/Redo. Fresh future triggers have new unique monotonic IDs. Ordinary edit composition only; browser/audio cancellation and Clear/load are separate. | passed | [Independent readback](./history-emission-contract/IndependentReview.md) |
| S07-A9 | Undo/redo Clear cannot resurrect cancelled triggers. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A10 | Delete/restore cannot resurrect cancelled triggers. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [controls-browser.spec.ts](../../tests/controls-browser.spec.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A11 | Corrupt JSON leaves previous scene intact. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A12 | Unsupported schema versions leave previous scene intact. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A13 | Duplicate IDs leave previous scene intact. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A14 | Invalid vertices leave previous scene intact. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A15 | Non-finite values leave previous scene intact. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A16 | Simulated storage failure retains current scene. | independent execution; specific atom only. | passed | [controls-browser.spec.ts](../../tests/controls-browser.spec.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A17 | Simulated storage failure retains previous good save. | independent execution; specific atom only. | passed | [controls-browser.spec.ts](../../tests/controls-browser.spec.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A18 | Load stops the old session. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [controls-browser.spec.ts](../../tests/controls-browser.spec.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A19 | Load opens new scene paused at beat zero. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [controls-browser.spec.ts](../../tests/controls-browser.spec.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A20 | Undo placement restores stable IDs through future emissions. | Undo placement preserves exact original survivor piece IDs through future emissions; redo restores the exact placed-note object only for fresh future triggers. Complete independently specified scheduled/onset/cancel ledger passes. Ordinary edit composition only. | passed | [Independent readback](./history-emission-contract/IndependentReview.md) |
| S07-A21 | Undo movement restores vertex safely. | Actual integrated drag crosses three legal destinations, commits on release, and one Undo/Redo restores the complete pre/final scene. | passed | [gesture-history-browser.spec.ts](../../tests/gesture-history-browser.spec.ts); [Checks.md](../../evidence/step-07/gesture-history/Checks.md); [piece-drag.json](../../evidence/step-07/gesture-history/piece-drag.json) |
| S07-A22 | Undo deletion restores stable IDs through future emissions. | Delete/Undo/Redo/Undo preserves exact restored note, generator and beat IDs through later emissions, with cancelled trigger IDs never revived. Complete independently specified scheduled/onset/cancel ledger passes. Ordinary edit composition only. | passed | [Independent readback](./history-emission-contract/IndependentReview.md) |
| S07-A23 | Undo musical parameter edit restores value. | Actual trusted Global Volume and Note Level slider gestures traverse multiple values and commit on release; one Undo/Redo restores each whole pre/final scene. Only selected note level changes. | passed | [gesture-history-browser.spec.ts](../../tests/gesture-history-browser.spec.ts); [Checks.md](../../evidence/step-07/gesture-history/Checks.md); [global-volume.json](../../evidence/step-07/gesture-history/global-volume.json); [note-level.json](../../evidence/step-07/gesture-history/note-level.json) |
| S07-A24 | Undo Clear restores scene paused. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S07-A25 | Drag gesture coalesces into one history entry. | Actual integrated drag crosses three legal destinations, commits on release, and one Undo/Redo restores the complete pre/final scene. | passed | [gesture-history-browser.spec.ts](../../tests/gesture-history-browser.spec.ts); [Checks.md](../../evidence/step-07/gesture-history/Checks.md); [piece-drag.json](../../evidence/step-07/gesture-history/piece-drag.json) |
| S07-A26 | Slider gesture coalesces into one history entry. | Actual trusted Global Volume and Note Level slider gestures traverse multiple values and commit on release; one Undo/Redo restores each whole pre/final scene. Only selected note level changes. | passed | [gesture-history-browser.spec.ts](../../tests/gesture-history-browser.spec.ts); [Checks.md](../../evidence/step-07/gesture-history/Checks.md); [global-volume.json](../../evidence/step-07/gesture-history/global-volume.json); [note-level.json](../../evidence/step-07/gesture-history/note-level.json) |
| S07-H1 | Build a pattern and export actual JSON. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H2 | Clear exported pattern. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H3 | Import exported pattern. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H4 | Press Play and hear same pattern from beat zero. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H5 | Reload browser and recover local save. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H6 | Undo a move. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H7 | Undo Clear. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H8 | Invalid-file import displays a readable explanation. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H9 | Current scene survives invalid-file import. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S07-H10 | Storage failure displays a readable explanation. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): actual exported scene, reload recording, invalid-file example, and round-trip comparison. **Pass when a reviewer can keep and reproduce a composition independently.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
