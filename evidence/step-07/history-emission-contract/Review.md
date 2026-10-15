# Bongo Planet — history emission contract readback

The two pure deterministic controls passed; whole-project typecheck passed. The exact tool exits/source bindings and original Vitest output are retained in [execution-01.json](execution-01.json) and [result-01.json](result-01.json). No browser, service, actual PCM, production edit or acceptance-ledger change occurred.

The placement ledger retains six scheduled trigger IDs, five actual Engine onsets and one deletion cancellation. Undo preserves the original generator/kept-note IDs; redo restores the exact placed-note scene object for a later emission while cancelled trigger3 never onsets. The deletion ledger retains six scheduled trigger IDs, four actual Engine onsets and two deletion cancellations. Both undo restorations preserve the original note/beat/generator IDs, while cancelled triggers1/3 never return; future note triggers3/5 are separately generated fresh IDs and3 is subsequently cancelled by redo.

Expected times, sounds, positions, sequences and IDs are hand-specified in source/Plan. Both ledgers reject session replacement, duplicate IDs, resets, late drops and leftover pending work. This supports modeled S07-A8/A20/A22 History→Engine edit composition only. Browser gesture routing, AudioAdapter cancellation/audio, every piece kind and load/clear histories remain outside these checks. Root owns acceptance decisions.
