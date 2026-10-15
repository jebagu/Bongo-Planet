# Bongo Planet — Step 02 review

**Step:** Prove sphere geometry and occupancy  
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
| S02-A1 | Vertex count is 92. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A2 | Edge count is 270. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A3 | Triangular-face count is 180. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A4 | Euler characteristic is 2. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A5 | Every edge belongs to two faces. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A6 | Graph is connected. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A7 | There are no duplicate vertices. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A8 | There are no zero-area faces. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A9 | All vertex vectors have unit length within 1e-6. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A10 | Vertex IDs reproduce across runs. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A11 | Fixture vertex selection reproduces across runs. | Actual isolated fixture regeneration exit0; all 11 fixture JSON hashes byte-identical before/after. Shared fixtures unchanged. | passed | [report.json](../../evidence/step-02/regeneration/report.json) |
| S02-A12 | Analytic same-vector angular distance is 0. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A13 | Analytic orthogonal-vector angular distance is pi/2. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A14 | Analytic antipodal-vector angular distance is pi. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A15 | Symmetric distance pairs agree. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A16 | Occupied-destination moves preserve previous valid state. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A17 | Out-of-range moves preserve previous valid state. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A18 | Cancelled moves preserve previous valid state. | Current installed-Chrome production audit preserves the existing-piece model and clears dragging after synthetic cancellation/focus loss, with no page errors. Handler scope only; physical touch/OS focus loss not qualified. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S02-A19 | All fixtures respect one-piece-per-vertex occupancy. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-A20 | Add operations commit atomically. | No execution evidence yet. | not run | No complete execution evidence |
| S02-A21 | Delete operations commit atomically. | No execution evidence yet. | not run | No complete execution evidence |
| S02-A22 | Game-node IDs remain separate from vertex IDs. | source contract plus executed move assertion; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S02-H1 | Whole-sphere image and vertex table are inspectable. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S02-H2 | Far side appears in geometry evidence. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S02-H3 | Composition axes are labeled right/forward/up. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S02-H4 | Symmetric chord vertices are compared with measured angles. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S02-H5 | Increasing-distance phrase vertices are compared with calculated delays. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S02-H6 | One legal move has a readable before/after report. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S02-H7 | One rejected move has a readable before/after report. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): geometry image, counts/adjacency report, fixture coordinate tables, and operation transcript. **Pass when both the topology and slot rules are independently inspectable and correct.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
