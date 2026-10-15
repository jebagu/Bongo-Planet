# Bongo Planet — Step 10 review

**Step:** Package and accept browser prototype  
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
| S10-A1 | Verify invokes relevant type checks. | Actual npm run verify performs type/build, 52 unit checks across six suites and 28 installed-Chrome browser checks; exit0. | passed | [verify-report.json](../../evidence/step-10/verify-report.json); [verify.log](../../evidence/step-10/verify.log); [unit-results.json](../../evidence/unit-results.json); [browser-results.json](../../evidence/browser-results.json) |
| S10-A2 | Verify invokes build checks. | Actual npm run verify performs type/build, 52 unit checks across six suites and 28 installed-Chrome browser checks; exit0. | passed | [verify-report.json](../../evidence/step-10/verify-report.json); [verify.log](../../evidence/step-10/verify.log); [unit-results.json](../../evidence/unit-results.json); [browser-results.json](../../evidence/browser-results.json) |
| S10-A3 | Verify invokes engine checks. | Actual npm run verify performs type/build, 52 unit checks across six suites and 28 installed-Chrome browser checks; exit0. | passed | [verify-report.json](../../evidence/step-10/verify-report.json); [verify.log](../../evidence/step-10/verify.log); [unit-results.json](../../evidence/unit-results.json); [browser-results.json](../../evidence/browser-results.json) |
| S10-A4 | Verify invokes audio checks. | Actual npm run verify performs type/build, 52 unit checks across six suites and 28 installed-Chrome browser checks; exit0. | passed | [verify-report.json](../../evidence/step-10/verify-report.json); [verify.log](../../evidence/step-10/verify.log); [unit-results.json](../../evidence/unit-results.json); [browser-results.json](../../evidence/browser-results.json) |
| S10-A5 | Verify invokes web checks. | Actual npm run verify performs type/build, 52 unit checks across six suites and 28 installed-Chrome browser checks; exit0. | passed | [verify-report.json](../../evidence/step-10/verify-report.json); [verify.log](../../evidence/step-10/verify.log); [unit-results.json](../../evidence/unit-results.json); [browser-results.json](../../evidence/browser-results.json) |
| S10-A6 | Verify invokes bridge checks. | Actual npm run verify performs type/build, 52 unit checks across six suites and 28 installed-Chrome browser checks; exit0. | passed | [verify-report.json](../../evidence/step-10/verify-report.json); [verify.log](../../evidence/step-10/verify.log); [unit-results.json](../../evidence/unit-results.json); [browser-results.json](../../evidence/browser-results.json) |
| S10-A7 | Verify reports individual failures. | Isolated negative control injects two named failing assertions; unchanged npm run verify exits1 and reports both names. Browser checks do not run after unit failure. Shared candidate untouched. | passed | [report.json](../../evidence/step-10/verify-negative/report.json); [verify.log](../../evidence/step-10/verify-negative/verify.log) |
| S10-A8 | Clean installation builds application. | Committed9621617 isolated npm ci/build exit0 with no existing node_modules reused; actualcleanproductionpreview opened atpermanentURL inCUA, F01 loads4pieces paused. Source/archive/build hashes retained. | passed | [report.json](../../evidence/step-10/clean-final/report.json); [opened-ax.txt](../../evidence/step-10/clean-final/opened-ax.txt); [opened.png](../../evidence/step-10/clean-final/opened.png) |
| S10-A9 | Clean installation opens /BongoPlanet/ at permanent URL. | Committed9621617 isolated npm ci/build exit0 with no existing node_modules reused; actualcleanproductionpreview opened atpermanentURL inCUA, F01 loads4pieces paused. Source/archive/build hashes retained. | passed | [report.json](../../evidence/step-10/clean-final/report.json); [opened-ax.txt](../../evidence/step-10/clean-final/opened-ax.txt); [opened.png](../../evidence/step-10/clean-final/opened.png) |
| S10-A10 | F06 30-minute repeated-edit run keeps queues within declared bounds. | Frozen repaired processor 0f0b12c9 completed 1800.146166 actual monotonic seconds of original F06 with 59 validated edits; sampled pending 0–336 stayed below 5376. Full coverage and cleanup verified. Queue observation only. | passed | [Review.md](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/Review.md); [report.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/report.json); [root-raw-audit.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/root-raw-audit.json); [manifest-final.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/manifest-final.json) |
| S10-A11 | F06 30-minute repeated-edit run keeps voices within declared bounds. | Frozen repaired processor 0f0b12c9 completed the same 1800.146166-second F06 run; every sampled running state held 64 voices at the declared cap. Intentional stealing retained; human listening remains open. | passed | [Review.md](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/Review.md); [report.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/report.json); [root-raw-audit.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/root-raw-audit.json); [manifest-final.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/manifest-final.json) |
| S10-A12 | F06 30-minute repeated-edit run has no uncaught errors. | Final9621617 F06 completed1800.735real seconds with no uncaught page, console or HTTP errors. Actual recorded sample irregularities remain separately unresolved. | passed | [soak-review.json](../../evidence/step-10/final-soak/soak-review.json); [soak-report.json](../../evidence/step-10/final-soak/soak-report.json); [Independent-Review.md](../../evidence/step-10/final-soak/Independent-Review.md) |
| S10-A13 | F06 30-minute repeated-edit run has no late-event burst. | Repaired frozen processor 0f0b12c9 completed 1800.146166 actual seconds / 59 edits with reported late, audio-late and telemetry-drop counters all zero. All 675,056 timed blocks match the actual input at independently native-measured 640-sample lag; 28 repeated-clock/recovery pairs produced zero varying repeated PCM blocks. No observed late-event burst in this run. This specific check does not establish independent dense individual-onset timing, physical sound or human approval. | passed | [Review.md](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/Review.md); [report.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/report.json); [root-raw-audit.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/root-raw-audit.json); [manifest-final.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/manifest-final.json) |
| S10-A14 | F06 30-minute repeated-edit run has no continuing session-object growth after warm-up. | Final30min observed document count1, listeners80 and geometries1250–1590 bounded; last-five-minute heap floor47.303MB versus warm-up51.690MB, without sustained rising floor. Periodic observations, not an unlimited-memory guarantee. | passed | [soak-review.json](../../evidence/step-10/final-soak/soak-review.json); [soak-report.json](../../evidence/step-10/final-soak/soak-report.json); [Independent-Review.md](../../evidence/step-10/final-soak/Independent-Review.md) |
| S10-A15 | Long-session memory observations are recorded. | Final1800.735-second candidate memory observations recorded: warmup heap min/median/max51.690/57.222/80.828MB; last5min47.303/66.551/99.686MB. Scope and raw observations retained. | passed | [soak-review.json](../../evidence/step-10/final-soak/soak-review.json); [soak-report.json](../../evidence/step-10/final-soak/soak-report.json); [Independent-Review.md](../../evidence/step-10/final-soak/Independent-Review.md) |
| S10-A16 | Long-session timing observations are recorded. | Repaired frozen processor 0f0b12c9 recorded 86,700,032 original samples per path and all 677,344 independent quantum indices across calibration, the 1800.146166-second timer and tail. Independent complete audit verifies 675,056 timed blocks / 86,407,168 matched samples, finite data, timer coverage, native calibration, hashes and cleanup. Absolute individual dense onsets and human listening remain separate. | passed | [Review.md](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/Review.md); [report.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/report.json); [root-raw-audit.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/root-raw-audit.json); [manifest-final.json](../../evidence/step-10/audio-clock-validation/attempt-02-30-minute/manifest-final.json) |
| S10-A17 | Maximum-workload stress run covers declared supported limits. | No execution evidence yet. | not run | No complete execution evidence |
| S10-H1 | Unfamiliar person receives only Make a short musical pattern on the sphere. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H2 | 60-second timer starts when fresh-session interactive scene is ready. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H3 | Unfamiliar person places a generator without coaching within 60 seconds. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H4 | Unfamiliar person places two notes without coaching within 60 seconds. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H5 | Unfamiliar person places a beat without coaching within 60 seconds. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H6 | Unfamiliar person hears repeating pattern without coaching within 60 seconds. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H7 | Unfamiliar person makes audibly changing edit without coaching within 60 seconds. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H8 | Unfamiliar person points to sound cause; elapsed time and confusion recorded. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H9 | Five-minute guide verifies F00 silence. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H10 | Five-minute guide verifies F02 chord. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H11 | Five-minute guide verifies F03 distinct onsets. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H12 | Five-minute guide verifies F04 overlap. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H13 | Five-minute guide verifies F05 movement. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H14 | Five-minute guide verifies F05 deletion. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H15 | Five-minute guide verifies F05 pause. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H16 | Five-minute guide verifies save/load. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H17 | Five-minute guide verifies orbit. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H18 | Five-minute guide verifies rear placement. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H19 | Five-minute guide verifies receiver ID match. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H20 | Five-minute guide verifies receiver position match. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H21 | Guide runs in required Chrome. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H22 | Guide runs in required Safari. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H23 | Guide verifies reduced-motion behavior. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H24 | Reviewer listens to 30-minute dense-session evidence. | Actual full-session WAV is retained for human listening. No named reviewer has listened; recording contains unresolved duplicated blocks and is not qualified seamless audio. | not run | [continuous-virtual-capture.wav](../../evidence/step-10/final-soak/continuous-virtual-capture.wav); [soak-review.json](../../evidence/step-10/final-soak/soak-review.json); [Next-Acceptance-Session.md](../../docs/Next-Acceptance-Session.md) |
| S10-H25 | Reviewer assesses limiting/stealing behavior. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H26 | Reviewer records whether F01 is clear and enjoyable enough to keep listening. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H27 | Release bundle includes application source. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H28 | Release bundle includes application build. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H29 | Release bundle includes lockfile. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H30 | Release bundle includes fixture scenes. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H31 | Release bundle includes bridge/receiver. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H32 | Release bundle includes README. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H33 | Release bundle includes Rules. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H34 | Release bundle includes acceptance evidence. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H35 | Installation instructions are reproducible from bundle. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S10-H36 | Bridge launch instructions are reproducible from bundle. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): launchable bundle, actual exported scenes, test summary, short walkthrough with sound, first-minute result, and long-session report. **M1 closes only when all required Steps 01–10 checks pass.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
