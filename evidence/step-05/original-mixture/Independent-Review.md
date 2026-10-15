# Bongo Planet — independent mixture-method review

Reviewed 2026-10-11. This is a source and retained-artifact review, performed during the separate exclusive audio capture. The reviewer launched no browser, audio capture, worker, load probe or test suite. No application source, fixture, capture or acceptance status was changed. Review depth was deep: the new diagnostic scripts exceed 200 source lines and compose timing, state ownership, capture interpretation and failure reporting.

## Frozen source binding

The working files and the copies listed in [model-source/bindings.json](model-source/bindings.json) have matching SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `scripts/mixture-timing-oracle.ts` | `82a90a5254680efcaeb68e7584be1a8568ce9c0e1a23dced029d2560ab154551` |
| `scripts/mixture-timing-analyze.ts` | `8b54443701080affd84ff1186cfbb6874cfc3e61e4db972d0624ebf6c63bc3fd` |
| `scripts/mixture-timing-feasibility.ts` | `efb11abd8189c591152bc1e334a982ba5c5a13129a15d991474462e04723620c` |
| `tests/mixture-timing-analysis.test.ts` | `c25a449b6ca18fd1b86e9cd1427da986873f81ec32b9f4759f4fc1dab59deb73` |

The retained [analysis-unit-attempt03.json](analysis-unit-attempt03.json) reports 15 passed, zero failed tests. I inspected the assertions and their hand-derived truth waveforms; I did not rerun them. The fit tests generate truth directly from the declared oscillator and envelope equations rather than invoking the production synth or oracle renderer. The pitch, dense-batch counts and erased-voice assertions contain independent expected constants. These are useful counterexamples, not a general identifiability proof.

## Substantiated method corrections

The current source resolves the constructed admission-clamp counterexample: with nominal onset 25 ms, phase origin shifted to 20 ms and independently declared admission at 30 ms, it reports entrance at 30 ms, or +5 ms, rather than the -5 ms phase displacement. Ownership is recomputed for each candidate. If every relevant voice is removed before its first possible sounding sample, the candidate entrance is null.

The search now retains translated-origin and unchanged-phase late-insertion hypotheses. Plausible endpoints prevent `sampledFamilyWithin20Ms`. An off-grid 10.3 ms start can remain unidentified rather than being recentered, and a weak-attack 100 Hz example retains whole-period aliases beyond 20 ms when searched over 40 ms. The named `sampledFamilyAbsErrorBoundMs` is explicitly conditional on the sampled family: adding half a step does not prove that no intervening or more distant plausible hypothesis exists.

The complete 64-voice duplicate counterexample is represented honestly. Inserting a second identical batch can evict the first and leave identical mono PCM, even through saturation. `pcmDuplicateExclusionQualified` remains false for that case. Renaming node or generator IDs also leaves the supported sine/kick PCM unchanged. Logical identity and erased starts cannot be recovered from those samples.

`qualificationPassed` is unconditionally false. [Method.md](Method.md) accurately preserves the finite-family limitation and the independent calibration, complete capture and human gates. I found no remaining source blocker to using these frozen files for further diagnostic analysis within that scope.

## Retained fidelity result and limits

The [retained feasibility report](retained-feasibility-1791750663561/report.json) compares two seconds each of older, unchanged F06 and F08 PCM. It reports RMS differences of approximately 2.17e-12 and 1.33e-9 at the freely searched 640-sample lag. Its calibration was product-derived, so these values support waveform-model fidelity only. They cannot establish absolute onset timing, current-candidate performance or full-fixture coverage. All three relevant result flags remain false: independent calibration, absolute timing qualification and entrance identification.

That old report binds oracle SHA `879f51f851ab34d9f1b06462a5d25579498862a609a689e863db5d5a2769c62c`, not the newly frozen oracle. The inspected difference extracts ownership recomputation and orders insertions by admission, onset and sequence. The old fidelity result must remain attached to its preserved source; this review does not relabel it as a fresh run of the new oracle.

Before timing qualification, the necessary work remains:

- Bind actual served assets and unchanged F02/F03/F06/F08 segments to raw capture, retain an independently logged transport epoch, and use native calibration outside the product synth before and after capture. No fitted product intercept may replace that calibration.
- Retain every expected group and classify unidentified, erased, missing and ambiguous results explicitly. The denominator cannot become only the best-fitting 120 observations. The suggested complete segment plan has roughly 468 groups before edge exclusions; that is a plan, not a measured count.
- Validate route uncertainty and residual tolerance independently. Expand and refine the ambiguity search, including timing outside the initial interval, rather than treating grid spacing as a universal bound. With other groups held nominal, the current per-group fit does not exclude simultaneous changes to several groups.
- Keep logical provenance separate from identifiable audible group timing. An original voice erased by the 64-voice policy, or an indistinguishable identical voice, admits no individual mono-PCM onset measurement. Saturated or periodic evidence may remain unresolved even when the full waveform fits well.
- Preserve deliberate scheduling stalls and a product-only 100 ms delay rejection in the eventual original-mixture measurement. Physical listening, Safari and the complete S05 live timing gate remain open.

## Related worker-probe preparation review

This section records the separately requested source-only review of `scripts/receiver-worker-probe.ts`. It does not qualify the application receiver. The reviewed final file and preserved `preparation-source-821c6cce.ts` both hash to `821c6ccee5729b4cb15e9246189ac3df8c91b4cffde7fe2a3135e143bea80908`; embedded worker SHA is `3a901a4fab4850fb0b73d8257a3233245eb8d5e02ef4d30e8301cb4926af7f39`.

Three constructed failure chains in the initial SHA `837422b7ef47b73876f8b83c3508539a3f48bb18f02389099a4e7fb1abed2bcd` were repaired and read back:

1. **Receipt capacity failure during dispatch or epoch replacement.** Previously, a full receipt queue could clear state through `fatal()` and then fall through into new voice/session mutation. `row()` and release operations now return failure; callers immediately return, and fatal cleanup clears the epoch. The retained VM cases fill 8,192 receipt rows and demonstrate empty pending, voice, object and session state after both dispatch-pop and old-epoch release failure.
2. **Late worker failure lost during successful wait/cleanup.** A predicate already true could formerly bypass the worker-error check, while forced termination could be labeled closed. The waiter now checks error before and after the predicate; final reporting retains all latched worker errors. Missing close acknowledgement, missing exit and forced termination are failures, with distinct cleanup fields.
3. **Late mutation after stealing an old voice.** With 64 voices, a 19.9 ms pre-write witness and 20.1 ms post-write witness previously removed the newly late voice while losing the evicted old voice. The repaired branch restores both that voice and its original Map position. It records attempted mutation and rollback clocks, labels the result a late drop, and does not emit a successful steal receipt.

The retained [preparation-1791751617819.json](../../step-09/receiver-worker-probe/preparation-1791751617819.json) binds the final SHA and reports eight preparation guards plus three embedded-source VM cases passing. I inspected the controlled clocks, assertions and readback source; no real Worker, OS load, browser or audio was exercised by that preparation run or this review.

The probe is ready to gather isolated hypothesis evidence after the exclusive capture is cleaned up. It uses bounded queues, explicit receipt acknowledgement, monotonic callback mutation witnesses, independent held-out caller-clock brackets and a deliberately wrong-offset negative check. Actual callback time remains distinct from delayed parent receipt arrival. This does not establish that worker timers survive host descheduling. Actual run results, full application WebSocket/UDP ingress, cancellation integration, producer audio-to-performance conversion and fresh F01/F04 remain unqualified. No frame, sample, audible-output or milestone pass follows from this mock-control probe.
