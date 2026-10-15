# Bongo Planet — Step 03 review

**Step:** Prove musical engine without renderer  
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
| S03-A1 | Independent analytic timing examples match within 1e-6 seconds. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A2 | At unchanged tempo/period all arrivals precede the next generator cycle. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A3 | Inclusive reach boundaries obey the declared numerical tolerance. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A4 | F02 notes share onsets. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A5 | F02 notes retain distinct pitches. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A6 | F03 has at least three distinct default-quantization onsets. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A7 | F04 preserves trigger provenance for both generators. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A8 | F04 identical-pitch/same-onset triggers retain separate IDs. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A9 | F05 pre-emission edits affect that emission even with prepared lookahead work. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A10 | F05 post-emission movement retains the committed travel delay. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A11 | Target deletion cancels the correct pending events. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A12 | Generator deletion cancels its pending child events. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A13 | Pause produces no old pending onsets. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A14 | Clear produces no old-session onsets. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A15 | Load produces no old-session onsets. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A16 | Tempo edits do not duplicate emissions. | Exact F09 tempo increase preserves initial 672 committed absolute onsets. All four independently specified later cycles each have eight distinct generators and 672 distinct generator/target pairs; total2688unique trigger IDs, no replay. Specific source scenario only. | passed | [engine.test.ts](../../tests/engine.test.ts); [unit-results.json](../../evidence/unit-results.json); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A17 | Tempo edits do not replay emissions. | Exact F09 tempo increase preserves initial 672 committed absolute onsets. All four independently specified later cycles each have eight distinct generators and 672 distinct generator/target pairs; total2688unique trigger IDs, no replay. Specific source scenario only. | passed | [engine.test.ts](../../tests/engine.test.ts); [unit-results.json](../../evidence/unit-results.json); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A18 | Phase edits do not duplicate emissions. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A19 | Phase edits do not replay emissions. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A20 | Tempo increases preserve committed arrivals overtaken by later emissions. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A21 | Varying simulated render frequency leaves the event stream unchanged. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A22 | Quantization resolves nearest-grid ties upward. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A23 | Quantization clamps to the last grid tick strictly before next emission. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A24 | New/enabled generators join the next eligible emission boundary without replaying missed emissions. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A25 | Only notes/beats produce voices; generators remain silent. | independent execution; specific atom only. | passed | [audio.test.ts](../../tests/audio.test.ts); [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A26 | There is no note-to-note propagation in M1. | source inspection plus independent oracle; specific atom only. | passed | [engine.ts](../../src/core/engine.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A27 | There is no generator-to-generator triggering in M1. | source inspection plus independent oracle; specific atom only. | passed | [engine.ts](../../src/core/engine.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A28 | Post-emission sound edits do not alter committed parameters. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A29 | Onset positions use the sound node's current position. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A30 | Disabling a generator suppresses future emissions while emitted pulses finish. | independent execution; specific atom only. | passed | [engine.test.ts](../../tests/engine.test.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A31 | Injected clock makes engine expectations deterministic. | independent execution; specific atom only. | passed | [independent-engine-probe.ts](../../scripts/independent-engine-probe.ts); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A32 | F09 committed arrivals retain absolute timing when later emissions overtake them. | Exact F09 tempo increase preserves initial 672 committed absolute onsets. All four independently specified later cycles each have eight distinct generators and 672 distinct generator/target pairs; total2688unique trigger IDs, no replay. Specific source scenario only. | passed | [engine.test.ts](../../tests/engine.test.ts); [unit-results.json](../../evidence/unit-results.json); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-A33 | F09 tempo edits do not duplicate or replay emissions. | Exact F09 tempo increase preserves initial 672 committed absolute onsets. All four independently specified later cycles each have eight distinct generators and 672 distinct generator/target pairs; total2688unique trigger IDs, no replay. Specific source scenario only. | passed | [engine.test.ts](../../tests/engine.test.ts); [unit-results.json](../../evidence/unit-results.json); [Independent-Review.md](../../evidence/step-09/Independent-Review.md) |
| S03-H1 | Timeline report exposes expected and actual sound IDs, angles, beat/time, provenance, and cancellations. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S03-H2 | Reviewer can read one chord timeline. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S03-H3 | Reviewer can read one phrase timeline. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S03-H4 | Reviewer can read one overlapping cycle. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S03-H5 | Moved note retains its old committed onset in the report. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S03-H6 | Moved note's next emission shows updated timing. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S03-H7 | Deleted note has a visible cancellation entry. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S03-H8 | Deleted note has no later onset. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): expected-versus-actual tables including sound IDs, angles, beat/time, provenance, and cancellations. **M0 passes when Steps 01–03 pass. No sound or 3D screenshot is required to claim this engine milestone.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
