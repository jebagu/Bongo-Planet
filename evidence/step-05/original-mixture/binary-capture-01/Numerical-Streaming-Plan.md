# Bongo Planet — streaming numerical diagnostic plan

Source preparation only. This is a separate structurally smaller implementation of the original numerical diagnostic, not a retry authorization. The original helperSHA32aca733/result and its256MiB failure remain immutable. Source/typecheck controls precede reviewer/root execution approval:

```sh
npx tsx scripts/mixture-numerical-streaming.ts --controls evidence/step-05/original-mixture/binary-capture-01/numerical-streaming-source-controls-final.json
```

Only after a separate actual GO:

```sh
npx tsx scripts/mixture-numerical-streaming.ts evidence/step-05/original-mixture/binary-capture-01
```

That invocation exclusively creates `numerical-streaming.json`. Existing outputs are rejected. No browser, capture, production edit, PCM repair, alternate clock, fitted phase or threshold change is included.

The exact independent audit, fixed-fidelity result, full raw/metadata/event hashes, captured processor/synth source and unchanged oracle are bound as before. One original-order event pass validates the complete global and per-segment indices/count, including the negative segment. Only one positive segment's compact sequence map exists at a time. Each sequence holds independent trigger/onset counts, first-trigger scalar fields plus its full-trigger SHA256, first-onset scalar/hash, an any-different-onset flag, and each event domain's first-insertion order. Thus onset-before-trigger, duplicate mismatches and extra-row ordering retain the original full-row semantics without storing full repeated events/provenance/positions. SHA256 equality carries the usual hash-collision assumption.

Each completed segment's ledger is summarized and cleared. Incremental count/min/max statistics replace large delta arrays. The dense later stage retains only first-trigger onset Float64 arrays, while original metadata uses two Float64 arrays indexed by unchanged original block order. After all event ledgers are released, F06 andF08 each reproduce the unchanged full fixed oracle/sample hashes, rank the same sixteen largest discrepancies, and reconstruct nominal scalar contributions with the same required invariant. Window/group denominators and anomaly scopes remain unchanged. Captured clocks are observations only.

Structural caps remain below the unchanged cooperative256MiB process guard: at most50,000 compact sequences/current segment and32MiB serialized projected state; at most100,000 metadata blocks/two arrays (1,600,000bytes); two retained onset arrays (800,016bytes); one dense raw/prediction pair (7,681,024bytes for these fixed windows). Oracle/V8 object overhead is not identical to serialized bytes, so these caps are not an absolute resident-memory proof. The source control measures a42,000-sequence synthetic projection and process RSS/heap without GC flags, alongside the static byte bounds. Actual elapsed120s/RSS256MiB guards remain cooperative detected limits, with synchronous oracle calls checked before/after. Any capacity/resource failure preserves an incomplete prefix; no cap increase or automatic rerun follows.

Controls execute the frozen helper's extracted actual ledger loop as the reference for distinct, missing, duplicate, reordered, onset-before-trigger, wrong-sound and full-trigger-mismatch rows. Extra trigger/onset insertion orders are independently checked. Dense ranking/threshold counting is compared with the frozen actual loop on synthetic PCM; scalar reconstruction is checked against the unchanged oracle. These synthetic controls do not substitute for actual raw execution or acoustic onset identification.

Completion is diagnostic only. The original strict F06/F08 fidelity failures, null actual identified-group count, ambiguity/missing/duplicate acoustic limits and qualification=false remain unchanged.
