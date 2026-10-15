# Bongo Planet — independent core review

**Result: source audit passed after repairs; no unresolved substantiated core finding remains in the reviewed snapshot. This does not accept M0 or any human, listening, live-output, venue, or device gate.**

Reviewed by the independent GPT-6 Astra reviewer on 2026-10-11; final independent commands completed at approximately 16:59 UTC (19:59 Europe/Istanbul). The reviewer changed only this report and `scripts/independent-engine-probe.ts`. The lead repaired shared source and added regression tests.

## Scope and depth

Read `AGENTS.md`, `Rules.md`, Work-Package Steps 01–03 and prototype rules, the three critical kickoff findings, contracts, geometry, engine, history, fixtures, and core/engine tests. The repository had no commit at review time. Reviewed production/fixture files total 162 physical lines; they were new untracked files, so these are additions, excluding tests and generated fixtures. Dense formatting understates semantic size. Used deep review because transport edits, cancellation, resets, and state mutation interact across boundaries: assumption violations, component composition, recovery cascades, and repeated valid edits.

The audio adapter was outside this source-audit scope. Test assertions about trigger identity do not establish separate audible voices or live timing.

## Environment and reproducible commands

Reference machine: Darwin arm64 25.5.0; Node v22.20.0; npm 10.9.3; Vitest v5.0.3. Run from the project root:

```sh
npm run typecheck
npm run test:engine
node --import tsx scripts/independent-engine-probe.ts
```

Final results:

- TypeScript: passed, exit 0.
- Core/engine suite: 21 tests across 2 files passed, exit 0.
- Independent probe: all 9 named checks passed, exit 0; seed 92881, 32 scenes, 30 seconds per scene, 5 ms engine ticks, **53,724 triggers** compared with an independent analytic oracle to within `1e-6` seconds. Trigger IDs were unique.

The oracle enumerates emission index `k` directly and computes surface delay, quantization, and onset independently; it does not call `delayBeats` or read `expected.json`. It uses the project's already-tested topology coordinates, so it is not an independent reconstruction of topology. Random scenes use eight generators, twenty notes, variable BPM/reach/travel/phases/periods, and all three quantization settings. They are not maximum-workload or browser-output tests. The core suite separately exercises F08 and capacity recovery.

## Constructed failures and verified repairs

All scenarios below were reproduced against the initial candidate. Confidence was 100 for the mechanically reproduced execution chains. They were reported to the lead, repaired, and rerun; none is an open finding against the hashes below.

| Scenario | Observed failure before repair | Repair and verification |
| --- | --- | --- |
| Paused tempo edit is overwritten by an earlier pending transition | F01: play at 0; tick to .1; request 180 BPM; pause at .2; request 60 BPM while paused; resume at 10; tick to 11. Scene reported 60 but beat reached 2.2 rather than 1.4 because old pending 180 BPM applied at beat 1. | Applying a paused BPM change clears the previous pending transition. Regression asserts beat 1.4. |
| A short scheduling gap creates a late chord burst | F02 commits three onsets at .125. Tick to .1, then advance to .17. All three were delivered 45 ms late with `lateDrops=0`, contrary to the >20 ms drop rule. | Due onsets over 20 ms late are cancelled and counted. Regression asserts no onsets and three drops. |
| Invalid resume timestamp poisons the scheduler and exhausts its queue | Pause F05, then `play(NaN)` and `advance(.3)`. The invalid clock caused thousands of nonfinite events until the capacity stop and left beat as NaN. | `play` validates finite, monotonic time before state mutation. Regression verifies NaN/backward-time rejection leaves the snapshot unchanged. |
| A silent emission is replayed after pausing at beat zero | Start one generator with no targets; advance 0, consuming its silent emission; pause 0; add a note; resume at 1. Using trigger sequence as the fresh-start flag re-emitted beat zero. | Independent `started` state records transport start even without targets. Regression verifies no replayed emission. |
| Capacity recovery emits new children after its own reset | F09: play/advance 0; at each `time=i*.02`, set all generator phases to `(time*40/60+.00001)/8` and update a validated scene. On the ninth update, .18 s, capacity reset was followed by seven emissions and 588 triggers; engine was paused with 588 pending. | Overflow clears pending/next and terminates the enclosing emission and advance loops immediately. Both suite and independent probe assert no post-reset events and zero pending work. |
| Capacity repair discards a queued tempo change | Add a 180 BPM request at .001 before the preceding capacity scenario. An intermediate repair cleared pending tempo on overflow, so resume continued indefinitely at 40 while the scene displayed 180. At resume +2 s, beat was 1.44001 instead of 2.980045. | Overflow retains the requested future tempo, matching ordinary pause semantics. Regression and independent analytic resume check pass. |

An initial TypeScript failure in the pitch test came from `newPiece` returning the entire Piece union. The lead added a generic narrowed return type. Final typecheck passes. A transient adapter typecheck error observed during concurrent work was also gone on the final run; the adapter itself was not reviewed here.

## Additional independent probes

The preserved probe script also proves these specific core facts:

- Reach at the exact boundary and 0.5e-9 radians inside tolerance includes the target; 2e-9 radians outside excludes it: counts `[1,1,0]`.
- F04 has a real cross-generator equal-onset/identical-pitch collision at **4.75 seconds**: `gen-4:shared-a`, `gen-4:shared-b`, and `gen-3:shared-b`, each C4 at 261.6255653005986 Hz with three distinct trigger IDs.
- Deleting the F05 target then undoing its deletion does not resurrect its cancelled committed pulse.
- Undoing Clear restores the scene paused at beat zero in the Clear-created session, without old onsets.
- Editing to period 3 / phase .25 at beat 1.2 joins beat 3.75, exactly 1.875 seconds at 120 BPM.
- Disabling and re-enabling at beat 2 joins beat 4, with no replay.
- A key edit delivered at the processed emission at 2 seconds preserves C4 in that emission and produces G4 in the next emission at 4 seconds.

## Remaining evidence and acceptance boundaries

- Step 01–03 human gates remain open: another reader's shell/rules review, whole-sphere/occupancy inspection, and readable chord/phrase/overlap/edit/cancellation timeline review. This code audit cannot substitute for those activities.
- This report does not supply the complete expected-versus-actual human timeline artifact required by Step 03. Probe assertions and generated timing tables are useful evidence but are not that review.
- Separate audible voices, voice stealing, actual output latency/error, main-thread-stall playback, audible pause/release, and visual synchrony require later audio/browser evidence. No browser, loopback capture, or listening test was performed by this reviewer.
- Position freshness at 60/15/2 render FPS, backpressure, receiver control ordering, venue interpolation, and physical iOS behavior were not qualified by this review.
- The initial suite's varying-FPS check changes snapshot access while the engine keeps 5 ms ticks. It proves renderer-independent core timestamps, not actual slow-renderer performance or live scheduling.
- `Engine` accepts typed `Scene` inputs; import/UI/message boundaries must validate unknown data before model replacement. The contract and import validation tests pass; integration of all such entry points was outside this review.

## Reviewed snapshot hashes

There was no source commit to cite. These SHA-256 hashes identify the exact final files read/tested; later source changes need appropriate reruns.

| File | SHA-256 |
| --- | --- |
| `src/core/contracts.ts` | `497e8bae2417ccd0652407a9a33dc08a775b56de8e54553465a2ee158ececdfc` |
| `src/core/geometry.ts` | `b6b788d732a900a102d108623033055bc221099a5d91f8e648af16d2905b69bf` |
| `src/core/engine.ts` | `c59d1c49c9980a8529af1d0237a3caba170b8bb3dded8f74420bc646dcf45484` |
| `src/core/history.ts` | `394371942f583569aa90a68c31931cd3de0a28ea64fabef4c5f719ce90268483` |
| `tests/core.test.ts` | `ca0cf7f6ae020dcc0c1a7e2fded8e533713ed9fd40d3b926aef2f75f933055fc` |
| `tests/engine.test.ts` | `495fd1e4f17cfe72c310e1ed3303d4e556340bda37a9ceb79b4a6edb44aae348` |
| `scripts/fixtures.ts` | `6b3f76a1a6a53d2520def5ff9ed55248ab8ab2fd2d5a672b7a997f1fde081c8a` |
| `scripts/independent-engine-probe.ts` | `5a96c221447d79af83d40337488b3d0a726f8a180fe94b908bef8c159953703c` |
