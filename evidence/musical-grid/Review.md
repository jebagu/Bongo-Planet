# Equal-hop timing verification

14 October 2026 · Original Bongo Planet · local candidate

## Implemented contract

Each gated strut crossing takes one sixteenth note, independent of geometric length. Generator phase offsets join the same grid; newly added sources join future boundaries. All active circuits follow BPM edits at the next whole beat. Beat/time anchors prevent cumulative rounding drift. The renderer consumes the same arrival timestamps and varies physical speed per edge. Version-one radial and route playback remains compatible.

The human and agent reference is [Creation-Guide.md](../../Creation-Guide.md), linked from AGENTS, README, Rules, the design brief, work packages, kickoff, fixture guide, route/spark design notes and build handoff. The downloadable source package includes the guide and companion rules/design documents.

## Passed checks

- **460 tests across 35 files:** `npx vitest run --maxWorkers=1 --reporter=json --outputFile=evidence/musical-grid/unit-results-serial.json`. [Complete results](unit-results-serial.json), [run log](unit-run-serial.log).
- **105 final focused tests:** timing, gated routing, legacy engine/routes and the concurrent composition-file/agent-guide tests pass together. [Results](final-focused-results.json), [run log](final-focused-run.log).
- **3 installed-Chrome tests:** `npx playwright test tests/musical-grid-browser.spec.ts --reporter=list --output=evidence/musical-grid/browser-artifacts-final`. Unequal-edge chord, independent generator phases with a live tempo edit, and unchanged 125/250/375 ms schedules at 60/15/2 render FPS. The successful command ran outside the filesystem sandbox. [Final run log](browser-run-final.log), [chord events](live-chord.json), [tempo/phase events](live-tempo-and-phases.json), [FPS schedules](render-fps-timelines.json).
- All 270 struts at 40, 120 and 180 BPM use the same musical duration. Unequal branches form a C-major chord; convergences retain distinct simultaneous voices. Empty hops, upward phase ties, wrapping, sources joining live and ignored radial-grid metadata are checked.
- A controlled-population Infinite circuit completes **16,440 hops in 30 simulated minutes at 137 BPM**, with maximum scheduled-time error below 1 ns against an independent fixed-tempo oracle. This is a deterministic simulation, not a wall-clock listening soak.
- Existing gated offline PCM still starts within one sample of the independent sixteenth-note arrival. Legacy scheduling, audio, lifecycle and output tests pass.
- Production typecheck/build succeeds. [Build log](build.log). The existing large-chunk warning remains informational.
- All **59** downloadable asset files match their manifest hashes and ZIP entries; copied engine/core sources and musical docs match the checkout, including the concurrently added Agent Guide. Built package copies and the live local guide URL are verified too.
- `git diff --check` passes. [Source and contract hashes](source-sha256.json) identify the candidate; the checkout already contained unrelated changes, which were preserved.

## Retained failed attempts and scope

An initial sandboxed Chrome launch aborted before a page opened. The focused browser tests passed with the required launch permissions. A later concurrent full-suite/build attempt retained **458 passes and two failures**: another sandboxed Chrome launch and a native deadline assertion. That attempt is preserved in [unit-results.json](unit-results.json) and [unit-run.log](unit-run.log). A serial full-suite retry outside the sandbox passed all 460 tests without production changes for those failures.

Documentation and an AI-guide UI were updated concurrently in this shared checkout. Timing-core/test hashes remained unchanged through the full-suite run. A transient type error in the new tray's hidden-state check was corrected by the concurrent work. Its new starter test was adjusted to the existing Engine `play(now)`/`advance(now)`/`drain()` API and passes in the final focused run. The final production build and focused browser tests were repeated afterward, and source/package hashes were refreshed. The full-suite report retains the earlier run's source scope in [unit-source-sha256.json](unit-source-sha256.json).

Browser checks observe actual AudioWorklet event scheduling. They do not establish acoustic onset timing, physical venue playback, Safari or unfamiliar-player acceptance. Historical evidence retains its original source/mode scope. This update does not republish the public Site or close broader project milestones.
