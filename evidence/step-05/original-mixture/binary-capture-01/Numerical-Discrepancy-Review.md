# Bongo Planet — incomplete numerical discrepancy diagnostic

The single authorized read-only invocation of reviewed helperSHA `32aca733ad92ff4cba13d59cd923c90d3041f6dfa3f81dd89e83201d5f672e2b` exited **1** after **7.442072 monotonic seconds**. [numerical-discrepancy.json](numerical-discrepancy.json) retains the failed/incomplete prefix. The cooperative256MiB resident-memory guard detected an overrun; final RSS was291,864,576bytes. The same resource error appears at the interrupted stage and at the final guard. No limit increase, retry, raw change, fitted offset or original-criterion change followed. Synchronous rendering can exceed a cooperative guard before its next check; this was not a preemptive memory ceiling.

The complete positive logical trigger/onset ledger was compared before the interruption:

| Fixture | Declared voices | Matched trigger rows | Matched onset rows | Maximum absolute emission/onset delta |
| --- | ---: | ---: | ---: | ---: |
| F02 | 96 | 96 | 96 | 1.421085e-14 seconds |
| F03 | 36 | 36 | 36 | 0 |
| F06 | 14,080 | 14,080 | 14,080 | 0 |
| F08 | 40,320 | 40,320 | 40,320 | 5.684342e-13 seconds |

Each retained ledger has no reported missing, duplicate or extra logical trigger/onset rows, sound-parameter differences or identity differences. The independent closed-form sequence calculation does not choose a cycle from observed timestamps. These are logical event records; they do not certify acoustic missing/duplicate exclusion or actual independently identifiable PCM arrivals.

The **F06** full960,128-sample nominal window was reproduced with the unchanged oracle and exact original model/raw window hashes. It has702 samples with absolute error>1e-6. The sixteen largest retained sample details all reconstruct the original nominal Float32 sample exactly from their analytic scalar contributions; each has64 analytically active voices and zero retained-onset difference. The maximum error is1.6726553440093994e-6 at window sample948167, original block50717/sample71, absolute frame6537927. Its retained observer block-clock difference from the ordinal block start is0. Many top errors recur500ms apart with increasing error magnitude; that is an observation, not an established clock, phase, ownership or arithmetic cause.

**F08's PCM/top-sample inspection is incomplete.** Its logical ledger is retained, but no completed F08 numerical ownership/sample certificate follows from this diagnostic. No arithmetic replica, reconstructed processor cursor, derivative attribution or actual production active-array snapshot was evaluated. The existing [fixed-fidelity.json](fixed-fidelity.json) strict F06/F08 maximum-error failures remain unchanged, and all qualification/acceptance fields remain false.

[Numerical-Discrepancy-Plan.md](Numerical-Discrepancy-Plan.md), [numerical-source-controls-final.json](numerical-source-controls-final.json) and [numerical-execution.json](numerical-execution.json) retain the reviewed scope, five source-only controls and exact execution record. Source controls and full typecheck passed before this actual invocation; the earlier tooling-only control-runner failure is retained separately. [manifest-numerical-discrepancy.json](manifest-numerical-discrepancy.json) binds these additions without replacing any prior manifest or recording.
