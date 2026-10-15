# Bongo Planet — recovery and control ordering baseline

Frozen root repair02 `afb87dc21bc880f1f2d855c42949b40f71232a3c3d0528570b061033cd76e17b` passes the original six controls but **fails three new composition controls**. Final test source is `6737fb05c21e3891d40ca5eee5671b3309acd5c00820d72b5f117f161df9c5ce`. Typecheck passes. No production change, build, browser, real socket, service or PCM read occurred.

All three controls use public methods. An initial real-model engine event establishes musical session `s2`. A modeled high-buffer tick starts recovery; a partial drain lets `near` be sent while `far` remains in the pending full snapshot. The next intervention occurs in that same musical session, without a reset/load/reconnect that could incidentally repair ordering.

| Intervention | Actual modeled packet order / failure |
| --- | --- |
| Add note `kick` at vertex9, drain, emit its trigger | Pending `far` position precedes `kick` trigger `s2-2`; there is no `kick` position. The receiver has no preceding position binding for that new trigger target. |
| Move already-served `near` to vertex9, keep congestion for150ms, drain, emit its trigger | After the120ms interpolation has settled, pending `far` position precedes `near` trigger `s2-2`; no latest `near` position is sent. The receiver would still have the prior coordinate. |
| Cancel surviving already-served `near`, with receiver-binding node ID included | `cancel` precedes pending `far` position; no replacement `near` snapshot follows that cancellation. The assertion fails before the subsequent trigger is invoked. This retained run therefore does not claim an observed post-cancel trigger failure. |

Expected object IDs and settled corner coordinates use the existing independent literal/formula references, including `kick` object ID1176245026. Position-before-trigger and restored-snapshot assertions are based on complete modeled send order. The failed run does not reach later coordinate assertions in these three cases; those remain executable post-repair checks rather than passed baseline evidence.

[vitest.json](vitest.json), [source-binding.json](source-binding.json), [execution.json](execution.json) and [traces](traces) retain exact sources/results/status/UTF-8 byte model. Earlier baseline and repair records are preserved. This demonstrates an adapter logic composition failure, not actual transport rejection, remote stale coordinates, buffering timing or acceptance qualification. Root owns the production correction.

Focused command: `BONGO_OUTPUT_MOVEMENT_EVIDENCE=evidence/step-01/movement-backpressure-regression/recovery-control-baseline-01/traces npx vitest run tests/output-movement-backpressure.test.ts --reporter=json --outputFile=evidence/step-01/movement-backpressure-regression/recovery-control-baseline-01/vitest.json`; tool `cbd5dd`, exit1,0.537024042s. `npm run typecheck`: tool `f62d9c`, exit0,0.309149667s. Test result: six passed, three failed. No thresholds, expected order or original assertions were weakened.
