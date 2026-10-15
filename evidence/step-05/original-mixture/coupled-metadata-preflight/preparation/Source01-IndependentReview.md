# Bongo Planet — metadata helper Source01 independent review

Disposition: **BLOCK this helper revision pending H01 below.** This is a source review, not an acquisition or an onset qualification. The external metadata controller has a separate review and disposition.

Reviewed helper `scripts/coupled-onset-metadata-preflight.py`, 26,818 bytes, SHA256 `876dcb496adb8078b50540925f13e0ced3f24496dafd126c7236e7aa1667b9ec`; controls 8,713 bytes, SHA256 `fd7df8a4f97a1354cd8eb7d02e7eef6ad18d4b947b947abd87ef06bcbb77429a`. The selected 5,206-byte `preparation-manifest-01.json` has SHA256 `542d58bac131af27153c794ea52ae46d964a920f000d82c2326d6e963de814cc`. All20 entries and173,416 selected bytes independently match their recorded lengths and hashes.

Depth: deep, because the new helper is over200 lines and composes clock recurrence, event ordering, capacity admission, resource failure, and evidence classification. I read the full helper, controls, plan/implementation scope, small acquisition/audit reports, and the exact captured engine/processor/synth sources. I did not import or execute the helper/controls, scan original JSONL, read PCM, launch services, or repeat an acquisition. The retained26-control success is evidence supplied by the preparation run, not a new reviewer test run.

## H01 — a99ms start gap survives replay although the real engine interrupts

Severity: P2; confidence100; concrete manual correction available.

At helper lines304–307, the second and later blocks check `start - prior <= .1`, then calculate `end`. Production has two distinct checks: the processor compares the block start with `previousEnd`, while `Engine.advance(end)` compares the block **end** with its preceding engine time. Under the helper's own unchanged/no-command premise, that preceding engine time equals `prior`.

A mechanically constructible two-block scenario is:

1. Sample rate48,000, block length128, epoch0. The first block ends at `q = 128/48000`.
2. The next raw block starts at `q + .099`. The helper's lag guard passes, and its interruption check sees only99ms.
3. Supply a trigger whose emission and onset equal that second start, duration1, sequence1, with retained onset order `[1]`. The helper admits and consumes it, neither20ms late predicate fires, and it can return `conditional-structural-replay`.
4. The actual processor also passes its start-gap check, but calls `Engine.advance(start + q)`. The engine sees elapsed `.099 + q`, about101.667ms, enters its interrupted-clock path before emitting/draining, and cannot produce that onset.

This is a false structural survivor even after accepting the helper's stated initial-empty/no-command premises. It is not evidence that this gap occurs in the retained original metadata, which I did not scan.

Minimal correction: retain the existing processor start-gap check and add the distinct engine end-gap check before replaying emissions or due voices. For the first block, engine time is the anchored epoch established by `play`; for later blocks, it is the previous end. Preserve the literal strict100ms comparison and add synthetic cases around the end-based boundary, including a99ms start gap that passes the processor check but fails the engine check. The existing26 controls distinguish the two20ms late predicates, but do not test these two100ms interruption predicates.

## Other reviewed properties

- The actual CLI requires explicit `--run`, a fresh absolute output directory, and internally fixed acquisition paths. It never opens PCM/container data or imports application runtime modules. Fixed report/audit/inventory digests and captured program-source hashes are checked before replay; JSONL digest validation follows complete streaming consumption. A digest failure leaves failure status, never completed feasibility.
- The selected report and audit independently match their pinned hashes. Their actual schemas match the helper's accessed source-hash, stats, segment, native-detection and coverage fields. Captured engine, processor and synth hashes match the helper constants. I did not rehash original metadata/events or the inventory during this review.
- All468 nominal group rows are built before metadata/event processing, with qualification false. Full128-sample paths, original index order, linear offsets and report counts are checked; repeated clock labels remain in original order. Both raw clock fields are checked for agreement. The native mapping processes all120 retained calibration detections; a global offset dissent is retained and then fails the run. This consumes the previous independent raw-audio audit; it is not a new native-click detection or continuous physical clock proof.
- Trigger/onset counts are independent, duplicate/different identities fail, logical in-window IDs and sound parameters compare with the pinned inventory, and future post-window triggers are separated from missing ordinary onsets. Callback/chunk provenance and receive-clock identity are validated without treating telemetry batches as private consume boundaries. The fixed negative segment is only a metadata recipe here, not an acoustic negative-control pass.
- The replay commits crossed emissions before draining due triggers, applies the5376 pending cap, orders due rows by onset/sequence, checks engine-end and synth-start20ms late predicates separately, prunes at synth block-start/admission and block-end boundaries, and uses oldest onset/sequence for64-voice stealing. It does not silently reuse the nominal oracle's dense ownership. H01 is the identified exception to source-faithful clock interruption.
- Anchor enumeration retains every necessary index within the declared calibration-bounded domain, including repeated clock candidates. The128-candidate cap fails rather than slices the domain. Per-branch resource failure preserves the unprocessed anchor frontier and all group rows. Unexpected control reasons fail; load/pause timing and absence of unlogged in-window commands remain an explicit frozen-harness provenance premise, not a fact proved by the event ledger.
- The120s/256MiB/50,000,000-work, per-input, sequence, detail and8MiB-output limits remain unchanged. Checks are cooperative and RSS observations do not make allocations preemptively safe. Root containment remains required. A serialization/output-cap failure may leave no result file; that cannot be called a completed observation.

## Scope after correction

A successful future scan could establish complete metadata integrity, the retained calibration-offset agreement, and conditional structural replay under the explicit shared-clock, startup, empty-state and command-history premises. `laterOnsetsNotReplayed` is an explicit tail count; prefix equality is not a full-tail replay certificate. Every replayed anchor must remain labeled conditional, and even all anchors becoming inconsistent would not disprove unmodeled prehistory or commands.

The helper neither evaluates PCM nor identifies waveform entrances. It cannot waive the existing strict fidelity failures, establish468 actual audible groups, certify missing/duplicate audible voices, or alter acceptance status. No actual scan is recommended until H01 is fixed in a separately frozen successor and root completes the independent controller/preflight review.
