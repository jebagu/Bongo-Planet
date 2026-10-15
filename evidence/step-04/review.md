# Bongo Planet — Step 04 review

**Step:** Make sphere placement and navigation usable  
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
| S04-A1 | Every successful palette drop matches model state. | No execution evidence yet. | not run | No complete execution evidence |
| S04-A2 | Every successful relocation matches model state. | No execution evidence yet. | not run | No complete execution evidence |
| S04-A3 | Occupied drops preserve state. | No execution evidence yet. | not run | No complete execution evidence |
| S04-A4 | Outside drops preserve state. | No execution evidence yet. | not run | No complete execution evidence |
| S04-A5 | Pointercancel preserves state. | Current installed-Chrome production audit preserves the existing-piece model and clears dragging after synthetic cancellation/focus loss, with no page errors. Handler scope only; physical touch/OS focus loss not qualified. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A6 | Focus loss cancels input safely. | Current installed-Chrome production audit preserves the existing-piece model and clears dragging after synthetic cancellation/focus loss, with no page errors. Handler scope only; physical touch/OS focus loss not qualified. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A7 | Orbit preserves node IDs. | Exact populated original F02 IDs, occupied vertices and musical model relationships remain unchanged after actual mouse orbit and wheel zoom; camera changes are explicitly nonzero. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A8 | Orbit preserves occupied vertices. | Exact populated original F02 IDs, occupied vertices and musical model relationships remain unchanged after actual mouse orbit and wheel zoom; camera changes are explicitly nonzero. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A9 | Orbit preserves relationships. | Exact populated original F02 IDs, occupied vertices and musical model relationships remain unchanged after actual mouse orbit and wheel zoom; camera changes are explicitly nonzero. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A10 | Zoom preserves node IDs. | Exact populated original F02 IDs, occupied vertices and musical model relationships remain unchanged after actual mouse orbit and wheel zoom; camera changes are explicitly nonzero. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A11 | Zoom preserves occupied vertices. | Exact populated original F02 IDs, occupied vertices and musical model relationships remain unchanged after actual mouse orbit and wheel zoom; camera changes are explicitly nonzero. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A12 | Zoom preserves relationships. | Exact populated original F02 IDs, occupied vertices and musical model relationships remain unchanged after actual mouse orbit and wheel zoom; camera changes are explicitly nonzero. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A13 | Drag ownership survives leaving a node. | No execution evidence yet. | not run | No complete execution evidence |
| S04-A14 | Resize preserves selection. | Viewport resize preserves the selected chord node and the complete original fixed-topology scene, hence logical angular distances. Pixel distances are not required invariant. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A15 | Resize preserves distances. | Viewport resize preserves the selected chord node and the complete original fixed-topology scene, hence logical angular distances. Pixel distances are not required invariant. | passed | [report.json](../../evidence/step-04/current-presentation-audit/attempt-04/report.json); [Independent-Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Independent-Review.md); [Review.md](../../evidence/step-04/current-presentation-audit/attempt-04/Review.md) |
| S04-A16 | Touch gesture routing assigns node and camera gestures correctly. | No execution evidence yet. | not run | No complete execution evidence |
| S04-A17 | Competing pointers cannot steal gesture ownership. | No execution evidence yet. | not run | No complete execution evidence |
| S04-A18 | Hidden rear slots cannot be picked through foreground surface. | No execution evidence yet. | not run | No complete execution evidence |
| S04-A19 | Select-piece/select-slot alternative works without dragging. | No execution evidence yet. | not run | No complete execution evidence |
| S04-H1 | Place a Generator. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H2 | Place a Note. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H3 | Place a Beat. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H4 | Move a piece to a legal vertex. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H5 | Attempt an occupied drop and observe clear rejection. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H6 | Cancel a drag and observe state preservation. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H7 | Rotate to the rear hemisphere. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H8 | Place a piece on the rear hemisphere. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H9 | Intended destination highlight is clear. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H10 | Connection previews are clear and follow surface arcs. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H11 | Touch emulation places all three piece types. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H12 | Touch emulation relocates a piece. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H13 | Touch emulation rejects occupied drop. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H14 | Touch emulation cancels drag safely. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H15 | Touch emulation rotates to rear and places there. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H16 | Empty-space gesture moves the view. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H17 | Captured node gesture continues moving its piece. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H18 | Visible slots and Generator/Note/Beat shapes are distinguishable. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |
| S04-H19 | Rear hemisphere is quieter without losing navigability. | Human reviewer/player sign-off not performed; automated evidence cannot substitute. . | not run | [Next acceptance session](../../docs/Next-Acceptance-Session.md) |

Required evidence from plan (check links above; incomplete requirements stayopen): annotated front/back screenshots and a short interaction recording. **Pass when placement is predictable from every side and camera movement leaves the composition unchanged.**

## Artifacts

Retained artifacts are linked per check. Independent timeline/oracle, offline sound, actual browser, receiver and live PCM captures remain separate evidence classes.

## Findings, dependencies, and reruns

Independent source review and actual measurements are linked per check. Required human, live-timing, venue and physical-device checks remain open wherever no complete passing evidence exists. Preserve failed runs alongside subsequent results; no acceptance-scope exception has been approved.

## Acceptance decision

**Open.** Required human and/or measurement/prerequisite checks remain open. Individual passed atoms do not close a step or milestone.
