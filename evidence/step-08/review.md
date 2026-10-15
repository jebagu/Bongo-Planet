# Bongo Planet — Step 08 review

**Step:** Show musical causality clearly  
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
| S08-A1 | Arc samples remain on sphere within 1e-6. | All92×92 unit-path pairs pass mathematical checks; actual current production3×49 Float32 connection-buffer samples have maximum radius error3.9197844e-8, below1e-6. Decorative framework/wavefront offsets are separate. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md); [root-unit-results.json](../../evidence/step-08/unit-arc/root-unit-results.json) |
| S08-A2 | Antipodal paths remain finite. | independent execution; specific atom only. | passed | [view-math.test.ts](../../tests/view-math.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S08-A3 | Near-antipodal paths remain finite. | independent execution; specific atom only. | passed | [view-math.test.ts](../../tests/view-math.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S08-A4 | Antipodal path convention is deterministic. | independent execution; specific atom only. | passed | [view-math.test.ts](../../tests/view-math.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S08-A5 | Rendering cannot generate sound events. | No execution evidence yet. | not run | No complete execution evidence |
| S08-A6 | 60 FPS automated playback retains expected scheduled onsets. | Current production F02 at60FPS retains9unique session-bound scheduled receipts over a full6-second first-emission window at independent relative times0.125+2k. Actual render progress verified; no PCM/acoustic timing claim. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S08-A7 | 15 FPS automated playback retains expected scheduled onsets. | Current production F02 at15FPS retains9unique session-bound scheduled receipts over a full6-second first-emission window at independent relative times0.125+2k. Actual render progress verified; no PCM/acoustic timing claim. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S08-A8 | 2 FPS automated playback retains expected scheduled onsets. | Current production F02 at2FPS retains9unique session-bound scheduled receipts over a full6-second first-emission window at independent relative times0.125+2k. Actual render progress verified; no PCM/acoustic timing claim. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S08-A9 | Camera matrices do not affect output positions. | Actual paused F07 orbit/zoom; exact scene, six identities/world XYZ and initial OSC joins unchanged. | passed | [Scoped root decision](camera-output-contract/attempt-01/Root-Gate-Decision.md); concurrent case remains failed. |
| S08-A10 | Reduced-motion preferences change presentation without changing events. | During active60FPS playback, normal pulses are visible and chord scales exceed1; reduced pulses are hidden and all scales equal1, with timestamped paired screenshots/render progress. Both fresh arms retain all9independently expected scheduled onsets. Human readability not qualified. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S08-A11 | Manual-move interpolation updates sustained source positions independently of camera motion. | Four paused camera/output cases pass at60/15/2FPS; no active sustained voice. | not run | [Partial actual supplement](camera-output-contract/attempt-02/Root-Gate-Supplement.md); active-source clause remains open. |
| S08-H1 | F02 cause/travel/response are understandable with sound. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H2 | F03 cause/travel/response are understandable with sound. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H3 | Median visual-versus-audible onset error is at most 50 ms over at least 30 triggers. | Automated headless F02 subset: 44 independently calibrated PCM/frame groups, conservative median27.202145ms/p9528.807369ms/max28.955074ms. Human listening/physical-monitor acceptance still not performed. | not run | [report.json](../../evidence/step-08/av/report.json); [measurement-method.md](../../evidence/step-08/av/measurement-method.md); [Independent-Review.md](../../evidence/step-08/av/Independent-Review.md); [Next-Acceptance-Session.md](../../docs/Next-Acceptance-Session.md) |
| S08-H4 | 95th-percentile visual-versus-audible onset error is at most 100 ms over at least 30 triggers. | Automated headless F02 subset: 44 independently calibrated PCM/frame groups, conservative median27.202145ms/p9528.807369ms/max28.955074ms. Human listening/physical-monitor acceptance still not performed. | not run | [report.json](../../evidence/step-08/av/report.json); [measurement-method.md](../../evidence/step-08/av/measurement-method.md); [Independent-Review.md](../../evidence/step-08/av/Independent-Review.md); [Next-Acceptance-Session.md](../../docs/Next-Acceptance-Session.md) |
| S08-H5 | Onset measurement includes output-latency compensation. | Automated headless F02 subset: 44 independently calibrated PCM/frame groups, conservative median27.202145ms/p9528.807369ms/max28.955074ms. Human listening/physical-monitor acceptance still not performed. | not run | [report.json](../../evidence/step-08/av/report.json); [measurement-method.md](../../evidence/step-08/av/measurement-method.md); [Independent-Review.md](../../evidence/step-08/av/Independent-Review.md); [Next-Acceptance-Session.md](../../docs/Next-Acceptance-Session.md) |
| S08-H6 | Onset measurement includes audible output/frame timestamps or equivalent measured evidence. | Automated headless F02 subset: 44 independently calibrated PCM/frame groups, conservative median27.202145ms/p9528.807369ms/max28.955074ms. Human listening/physical-monitor acceptance still not performed. | not run | [report.json](../../evidence/step-08/av/report.json); [measurement-method.md](../../evidence/step-08/av/measurement-method.md); [Independent-Review.md](../../evidence/step-08/av/Independent-Review.md); [Next-Acceptance-Session.md](../../docs/Next-Acceptance-Session.md) |
| S08-H7 | At 2 FPS actual music remains unchanged despite coarse visuals. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H8 | Sustained moving source interpolates smoothly in diagnostics. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H9 | Pole crossings remain readable. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H10 | Far-side crossings remain readable. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H11 | Reduced-motion view preserves selection information. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H12 | Reduced-motion view preserves musical information. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H13 | Placement settle is clear. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H14 | Generator wavefront follows surface. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H15 | Eligible surface arcs illuminate. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H16 | Receiving pieces flash/envelope at audible onset. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S08-H17 | Movement trails explain relocation. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): annotated recording, onset-error report, low-FPS audio comparison, and reduced-motion screenshot. **Pass when animation explains the music and rendering rate does not determine it.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
