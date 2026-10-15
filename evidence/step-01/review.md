# Bongo Planet — Step 01 review

**Step:** Establish the build contract  
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
| S01-A1 | Dependency installation succeeds on the identified reference laptop. | Committed9621617 isolated npm ci/build exit0 with no existing node_modules reused; actualcleanproductionpreview opened atpermanentURL inCUA, F01 loads4pieces paused. Source/archive/build hashes retained. | passed | [report.json](../../evidence/step-10/clean-final/report.json); [opened-ax.txt](../../evidence/step-10/clean-final/opened-ax.txt); [opened.png](../../evidence/step-10/clean-final/opened.png) |
| S01-A2 | Production build succeeds on the reference laptop. | independent execution; specific atom only. | passed | [Independent-Review.md](../../evidence/step-09/Independent-Review.md); [package.json](../../package.json) |
| S01-A3 | Type checking succeeds on the reference laptop. | independent execution; specific atom only. | passed | [Independent-Review.md](../../evidence/step-09/Independent-Review.md); [package.json](../../package.json) |
| S01-A4 | Browser application uses /BongoPlanet/ as its base path. | independent execution; specific atom only. | passed | [Independent-Review.md](../../evidence/step-09/Independent-Review.md); [vite.config.ts](../../vite.config.ts) |
| S01-A5 | Dev server pins port 5417 with strict-port behavior. | static configuration inspection plus actual browser opening; specific atom only. | passed | [vite.config.ts](../../vite.config.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A6 | Port conflicts are identified without silently changing the permanent URL. | Second dev launch refused occupied5417, exit1, no alternative port. | passed | [port-conflict.json](../../evidence/step-01/port-conflict.json) |
| S01-A7 | Invalid scene contract examples are rejected. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A8 | Invalid event contract examples are rejected. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A9 | Valid minimal scene examples round-trip. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A10 | Valid minimal event examples round-trip. | independent execution; specific atom only. | passed | [bridge.test.ts](../../tests/bridge.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A11 | Engine does not import Three.js. | static dependency inspection and Node execution; specific atom only. | passed | [engine.ts](../../src/core/engine.ts); [contracts.ts](../../src/core/contracts.ts); [geometry.ts](../../src/core/geometry.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A12 | Engine does not import DOM APIs. | static dependency inspection and Node execution; specific atom only. | passed | [engine.ts](../../src/core/engine.ts); [contracts.ts](../../src/core/contracts.ts); [geometry.ts](../../src/core/geometry.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A13 | Engine does not import Web Audio. | static dependency inspection and Node execution; specific atom only. | passed | [engine.ts](../../src/core/engine.ts); [contracts.ts](../../src/core/contracts.ts); [geometry.ts](../../src/core/geometry.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A14 | Reference commands are implemented when their checks exist; no placeholder success counts as evidence. | static script inspection and executed subset; specific atom only. | passed | [package.json](../../package.json); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A15 | Scene schema and topology identity are versioned. | contract inspection plus executed engine assertions; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A16 | Event contract includes session identity. | contract inspection plus executed engine assertions; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A17 | Event contract includes trigger sequence and stable trigger ID. | contract inspection plus executed engine assertions; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A18 | Event contract includes generator ID. | contract inspection plus executed engine assertions; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A19 | Event contract includes sound-node ID. | contract inspection plus executed engine assertions; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A20 | Event contract includes scheduled onset. | contract inspection plus executed engine assertions; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A21 | Event contract includes committed sound parameters. | contract inspection plus executed engine assertions; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A22 | Event contract includes composition position. | contract inspection plus executed engine assertions; specific atom only. | passed | [contracts.ts](../../src/core/contracts.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A23 | Generator count is validated at maximum 8. | independent execution; specific atom only. | passed | [core.test.ts](../../tests/core.test.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A24 | Total occupied pieces is validated at maximum 92. | Independent schema boundary checks accept 92 occupied pieces and reject 93; accept 40/180 BPM and reject 39.99/180.01. | passed | [core.test.ts](../../tests/core.test.ts); [final-core-unit-results.json](../../evidence/step-03/final-core-unit-results.json) |
| S01-A25 | Maximum-target workload uses 84 targets with 8 generators. | fixture inspection plus engine execution; specific atom only. | passed | [F08.json](../../public/fixtures/F08.json); [Rules.md](../../Rules.md); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A26 | Tempo range 40–180 BPM is validated. | Independent schema boundary checks accept 92 occupied pieces and reject 93; accept 40/180 BPM and reject 39.99/180.01. | passed | [core.test.ts](../../tests/core.test.ts); [final-core-unit-results.json](../../evidence/step-03/final-core-unit-results.json) |
| S01-A27 | Pending-event cap 5376 is validated and exceeding it visibly errors/pauses. | RealF09 worklet reached5376pending after8validphaseedits, resetpausedpending/voices0; errorpersistsEnable/edit, noimplicitrestart, explicitPlay recovers180BPM. Bridgecausalcapacityrelease remainsunmeasured; initialcaptionfailure retained. | passed | [capacity-browser.spec.ts](../../tests/capacity-browser.spec.ts); [Checks.md](../../evidence/step-05/capacity/Checks.md); [recovery.json](../../evidence/step-05/capacity/recovery.json) |
| S01-A28 | 64-active-voice cap is validated. | independent execution; specific atom only. | passed | [audio.test.ts](../../tests/audio.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A29 | Oldest-onset-then-sequence steal policy is deterministic. | independent execution; specific atom only. | passed | [audio.test.ts](../../tests/audio.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A30 | Voice stealing is visibly counted. | Actual status and rendered diagnostics agree at 912; both PNGs show the count. Stronger capture helpers remain failed. | passed | [Root gate decision](../step-05/visible-voice-stealing/attempt-02/Root-Gate-Decision.md) |
| S01-A31 | Events more than 20 ms late are dropped/counted without a catch-up burst. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [audio.test.ts](../../tests/audio.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A32 | Undo coverage and invalid-input behavior are specified. | requirements inspection; specific atom only. | passed | [Rules.md](../../Rules.md); [Work-Package.md](../../Work-Package.md); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A33 | Live-output median error budget <=5 ms is fixed before measurement. | requirements inspection; specific atom only. | passed | [Rules.md](../../Rules.md); [Work-Package.md](../../Work-Package.md); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A34 | Live-output p95 error budget <=10 ms is fixed before measurement. | requirements inspection; specific atom only. | passed | [Rules.md](../../Rules.md); [Work-Package.md](../../Work-Package.md); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A35 | Live-output maximum error budget <=20 ms is fixed before measurement. | requirements inspection; specific atom only. | passed | [Rules.md](../../Rules.md); [Work-Package.md](../../Work-Package.md); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A36 | Live-output protocol requires >=120 actual captured onsets. | requirements inspection; specific atom only. | passed | [Rules.md](../../Rules.md); [Work-Package.md](../../Work-Package.md); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A37 | Live output measurement method includes independently expected onsets and measured fixed output latency. | requirements inspection; specific atom only. | passed | [Rules.md](../../Rules.md); [Work-Package.md](../../Work-Package.md); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A38 | F08 defines maximum workload: 8 generators and 84 long-release targets; F09 defines period-8/tempo-increase overtaking stress. | fixture inspection and test execution; specific atom only. | passed | [F08.json](../../public/fixtures/F08.json); [F09.json](../../public/fixtures/F09.json); [Rules.md](../../Rules.md); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A39 | Position service is independent of rendering and updates at 50 Hz. | static scheduling inspection; specific atom only. | passed | [OutputAdapter.ts](../../src/output/OutputAdapter.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A40 | Loopback position age p95 <=40 ms budget is fixed before measurement. | requirements inspection; specific atom only. | passed | [Rules.md](../../Rules.md); [Work-Package.md](../../Work-Package.md); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A41 | Loopback position age maximum <=60 ms budget is fixed before measurement. | requirements inspection; specific atom only. | passed | [Rules.md](../../Rules.md); [Work-Package.md](../../Work-Package.md); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-A42 | Unsent positions coalesce newest per object; trigger/cancel controls never coalesce and per-stream sequences are independent. | No execution evidence yet. | not run | No complete execution evidence |
| S01-A43 | BufferedAmount >64 KiB pauses movement sends, latest snapshot resumes, and 500 ms congestion visibly disconnects/releases via watchdog. | No execution evidence yet. | not run | No complete execution evidence |
| S01-A44 | Rendering uses Three.js WebGLRenderer backed by WebGL 2 for M1. | source inspection and actual browser execution; specific atom only. | passed | [SphereView.ts](../../src/view/SphereView.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S01-H1 | Another reader can identify the M1 scope. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H2 | Another reader can launch the empty shell at http://127.0.0.1:5417/BongoPlanet/. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H3 | Another reader can find Rules.md. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H4 | Another reader can find Acceptance-Checklist.md. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H5 | Fixture descriptions explain expected audible outcomes without reading code. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H6 | Fixture descriptions explain expected visible outcomes without reading code. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H7 | All milestone statuses are initially open. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H8 | Reference laptop is recorded. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H9 | Operating system/version is recorded. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H10 | Installed Chrome version is recorded. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H11 | Installed Safari version is recorded. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H12 | Review viewport is recorded. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H13 | Audio route is recorded. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H14 | Audio sample rate is recorded. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H15 | Diagnostics expose transport beat/time. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H16 | Diagnostics expose selected node ID and vertex. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H17 | Diagnostics expose pending triggers. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H18 | Diagnostics expose active voices. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H19 | Diagnostics expose output state. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H20 | Diagnostics expose a rendering-frame-rate control. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H21 | Diagnostics remain collapsible and ordinary play screen compact. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H22 | Rules resolve ambiguities necessary for Steps 02–09. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S01-H23 | Original synthesis/interface asset provenance is recorded; any NodeBeat material reuse follows ASSET-RIGHTS.md. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): setup transcript, shell screenshot, contract examples, and completed Step 01 checks. **Pass only when the project runs and the next steps have unambiguous rules.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
