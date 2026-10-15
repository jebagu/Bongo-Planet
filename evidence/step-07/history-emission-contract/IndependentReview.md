# Bongo Planet — independent history and future-emission review

**Recommend scoped automated PASS for S07-A8, S07-A20 and S07-A22 at the History→Engine model boundary.** The two retained tests passed and their expected ledgers are independently specified. No production defect or blocking false-positive path was found in these two scenarios. This review read source, retained results and small evidence bindings only; it did not rerun tests, a browser, a service or audio.

The change is one 7,024-byte test file and evidence, with no production change. Review depth covered ordering and identity across History and Engine because edit restoration and cancellation share session state. Test/source hash is `e708280f8ed994ffc7a80e616e0966f329a6c49c0a033bbd54347b4173a175d9`; retained Engine is `19e5cba94b0db6c13b642bd28c90bc1def4bb0bc7ac6b5a95faf1e82bfa9aea3`, History is `71f9ef8099f2f0c04c2776565dca882580a5d16f13cfeb8e3bbd4e0682182b2f`.

## Actual evidence and provenance

`result-01.json` independently reports success, 2 total/2 passed/0 failed tests, both expected full test names and empty failure messages. Assertion durations are approximately 6.897 and 1.806 ms. `execution-01.json` retains the actual Vitest command, tool `d19116` exit 0, and whole-project typecheck `e3eed5` exit 0. No execution is inferred from the preparation Plan's historical “not run” heading.

All 12 entries of `manifest-final.json` independently match current file lengths and SHA-256 values: 41,699 selected bytes, manifest SHA `b6eb6b4e6606d2f86ee47f40b32464144be8e235617e91e229e3be9809685ccd`. The original `manifest-01.json` no longer matches current Plan.md; its original Plan bytes are explicitly preserved as `Plan-source-01.md`. The final package preserves both and binds the clerical bound correction from fewer than 700 to fewer than 1,200 total ticks. It does not rewrite a test outcome or production source. Result SHA is `c56da02d5045657e84821ea1e684432a1b2bef5ef8d1b3ae0d8720b1654f5d5c`.

## Why the assertions are independent and consequential

The scene uses literal IDs, settings and legal vertices. Normalized first-face corners have generator-to-sound dot product `1/√5`; their angle lies between `π/3` and `3π/8`. Period 4 and travel .75 yield a delay strictly between 1 and 1.125 beats, rounded to one beat on the quarter-beat grid. At 120 BPM that independently gives .5-second arrivals and 2-second emissions. A4 at key 9, degree 0, octave 4 is 440 Hz. Literal positions, levels, durations, timbres, emission times and sequence lists are not produced by the tested geometry, delay or sound functions.

The placement scenario creates six scheduled triggers, requires exactly five onsets `[1,2,4,5,6]`, and requires exactly one deletion cancellation, ID 3. Undo occurs after that placement's future trigger is committed but before its onset; the survivor retains its ID through the intervening emission. Redo restores the exact placed object and only a newly numbered future emission may sound it. Replaying a history event queue, resetting the musical session or reusing cancelled trigger 3 would violate the exact ledger.

The deletion scenario creates six scheduled triggers, requires exactly four onsets `[2,4,5,6]`, and exactly two cancellations, IDs 1 and 3. Its first undo restores the deleted note at .2 seconds, **before** old trigger 1's .5-second deadline, testing the important same-piece-ID/old-trigger-ID distinction. A later redo deletes and cancels new trigger 3; a subsequent undo restores the same note for fresh trigger 5. Beat and generator IDs survive throughout. Exact onset payload equality to each original committed trigger prevents a test from accepting an unrelated substitute with just the same pitch.

Both ledgers assert the complete scheduled sequence, complete onset-ID order, complete cancellation rows/reasons, emission denominator and times, uniqueness, unchanged original session, no resets, zero late drops, zero pending work and exact final scene. The final windows extend beyond all listed arrivals. Deterministic 10 ms advancement avoids introducing a simulated suspension; calling update at the already advanced time matches Engine.update's advance-before-edit semantics without replaying time.

## Composition and acceptance scope

Current main.ts pushes the old scene through `History.push`, and Undo/Redo uses the returned `restorationMode` with `apply(..., false)`. `AudioAdapter.setScene` forwards that mode; the processor selects `Engine.update` for `edit` and replacement only for other modes. The test uses the same public History and Engine edit operations and explicitly requires `restorationMode === 'edit'`. Source readback therefore supports the modeled route, while the asynchronous adapter/message/UI delivery itself was not executed by these tests.

| Atom | Recommended narrow interpretation |
|---|---|
| S07-A8 | PASS: these ordinary placement/deletion undo-redo histories do not replay cancelled logical trigger identities; future work uses fresh sequence IDs. |
| S07-A20 | PASS: undoing placement preserves the original survivor IDs in later emissions; redo restores the exact placed ID for a fresh later trigger. |
| S07-A22 | PASS: undoing deletion restores the original node ID and parameters for future emissions without reviving previously cancelled work, including restoration before an old deadline. |

These controls do not exercise Clear/load restoration, generator deletion, movement or parameter histories, gesture coalescing, browser button/keyboard routing, worklet delivery races, active synth release, receiver cancellation or audible output. In particular, the placement redo is after its old deadline; the separately tested pre-deadline restoration is an undo of deletion. The current shared edit implementation and exact ledgers support the stated model atoms without claiming all possible histories were exhaustively enumerated. Step 07's broader automated cases, human export/import/listening workflow and whole milestone remain separate. The acceptance ledger was not edited by this reviewer.
