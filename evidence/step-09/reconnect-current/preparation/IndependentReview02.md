# Bongo Planet reconnect source02 independent review

**Disposition: BLOCK.** Candidate02 closes the intended late-fault reporting paths but its new validator rejects every healthy production NativeClock observation. No runtime, browser, service, worker, test or acquisition was executed by the reviewer. Source01 and its BLOCK remain unchanged; this is a distinct source-only result.

## Binding and depth

The bounded readback independently hashed all 50 unique Manifest02 entries: zero mismatches, 533,525 summed bytes. Manifest02 itself is 10,275 bytes, SHA `2d6728b7f58604cfc10ac5a8db88b66b8e5b2b907979fa00d58b76ab14a122d9`.

- Helper: 25,100 bytes, `ccf5e2c8c1da632225e3ed3506d790e0779903d3e8bcdabcef5ccab950bef425`.
- Validator `final-state02.ts`: 2,014 bytes, `5e035a63ae2c9ae610f816b325f8bef0cbe325c3a27b343a7f22ab77f81f9f78`.
- Controls: 3,024 bytes, `9def5a07f8a61239b05807b5dc9dc16c6cd963720e0d33d6733a0a96eb949d5b`.
- Plan02: 2,916 bytes, `e95636e59a482698ebb5bff9ae46d9836feff8406bfc9b85358081d4f330ed87`.
- Exact Source01-to-02 diff: 11,213 bytes, `ff689ffc4a28d0000a86c6ad4d323e0db6a79f49856aae06fb2049d2735e9308`.

The retained 29 pure controls passed and the complete private helper/config/validator/control compilation exited0 (89603c). These results are preserved, not rerun. The controls exercise synthetic observations; successful compilation cannot establish correspondence between those observations and production's runtime representation.

## R02 — the positive toy state hides an unavoidable healthy-runtime rejection

**Blocking; confidence100.** `assertFinalNative()` line4 requires both `clock.failure === ''` and `clock.closeFailure === ''`. The unchanged production NativeClock initializes `failureReason` and `closeFailureReason` to **null** and exposes those values directly in `diagnostics`. `bridge.state()` spreads those diagnostics without normalizing them. Only `clockEvidenceFailure` uses an empty-string no-fault representation.

Consequently, an otherwise completely healthy actual connection and changed-state reconnect reaches the new post-assets `assertFinalNative(healthy(), records, false)`, then throws `Final native clock fault/unknown state` because `null !== ''`. The preclose and postclose predicates would reject the same healthy representation. The helper cannot complete successfully even with perfect delivery and graceful shutdown. The control's invented `failure:'' / closeFailure:''` baseline makes its positive cases pass and conceals this contract mismatch.

**Minimal successor:** require literal `null` for these two production no-fault fields and literal `''` for `clockEvidenceFailure`. Do not broadly normalize absent/malformed values to clean state. Update the positive synthetic observations to the actual production shape, retain failure-string and missing-field negatives, and bind the successor separately. Preserve this candidate and its passing synthetic results as preparation evidence, not a product failure or attempted acquisition.

## R01 integration otherwise addressed

The exact diff adds the pure validator to the helper's source bindings, checks final native state after the served-after requests, and independently checks before and after native closure. Fault fields, reported failures, uncertainty, drops, unexpected musical/error records and native work counters are included. Expected `ready:false` after a clean close is distinct from failure. Both explicit final-browser and final-clock certificates are required by the final success expression.

Browser final observation checks the retained witness, locked adapter, absent context and no events/running/music. Its failure no longer skips the separately guarded UI disconnect. Page/context/browser/server/native cleanup remain independently attempted. A failed final predicate cannot be converted to success by a later clean close because the error list is latched. The native postclose state is the worker's authoritative closed message state; matching ACK/exit0 does not substitute for the new fault checks.

No additional source blocker was found in this bounded successor review. The exact six-object and same-count changed-scene oracles, eight-reply synchronization ordering, native musical ACK/newer-state distinction, ordinary public UI/edit path, main-body binding, reused ownership/claims, fixed caps and dedicated configuration are unchanged from source01. The external root controller approval and its fresh path/ownership/binding preflight remain separate prerequisites. Even a corrected source GO would only permit consideration of one bounded root-controlled paused reconnect acquisition; it would not pass an acceptance atom or qualify active sound, physical output, full audio-clock conversion or automatic retry.
