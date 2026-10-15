# Bongo Planet — original-mixture binary capture 01

This single authorized acquisition exited **0** after **200.090347 actual monotonic seconds**,2026-10-11T23:07:43.033Z→23:11:03.296Z. It retained all five predeclared original-scene windows, all120 scheduled direct-native calibration clicks (12 before and12 after each segment), and the four actual100/250ms main-thread interventions. The harness reports `captureErrorFree:true` for acquisition integrity only. **Absolute onset timing, actual group identification and acceptance remain unqualified pending independent calibration/audit/model review.**

| Fixture | Variant | Requested seconds | Actual Node seconds | Fixed analysis blocks | Original index interval |
| --- | --- | ---: | ---: | ---: | --- |
| F02 | original-positive | 64 | 64.002074 | 24,000 | 2062–26061 |
| F03 | original-positive | 24 | 24.008188 | 9,001 | 30174–39174 |
| F06 | original-positive | 20 | 20.004630 | 7,501 | 43310–50810 |
| F08 | original-positive | 20 | 20.004466 | 7,501 | 54956–62456 |
| F02 | original-delay100-negative | 12 | 12.005893 | 4,501 | 66598–71098 |

[report.json](report.json) retains each original first-emission event/time separately from callback receive-context/browser clocks. Every fixed analysis window starts at that first logical emission; no epoch fitting, trimming, sample repair or sorting was used. Full intersecting-edge intervals include all interior original indices, including any shared-clock anomalies. The internal acquisition checks report complete128-sample positive-channel paths through all fixed analysis windows,200ms retained lag tails and native calibration supports. Those reports still require independent raw readback.

The unchanged original F02/F03/F06/F08 positive fixtures have **32/36/160/240 modeled audible groups,468 total**. Model-erased voices, coincident identity and saturation ambiguities are reported separately and cannot become successful actual arrivals merely by being in an oracle/event list. Actual identifiable group counts remain unset. The negative F02 window is excluded from the120-positive-onset denominator.

F06 andF08 each underwent measured100ms and250ms browser main-thread stalls enclosing the fixed independently selected expected group. All four retained actual browser durations meet the requested interval. The negative variant adds an actual100ms DelayNode on the product audible branch while the tap remains before Delay; native calibration sources bypass both tap and Delay. No recorded sample was shifted to manufacture either result.

## Retention and cleanup

The untouched [capture.container](capture.container) contains **2,832 complete frames /125,505,853bytes**:2,286 PCM batches,73,152 contiguous original128-sample blocks,9,363,456 mono Float32 samples per path,546 event wire frames and111,860 full event rows. All546 original callbacks fit one wire frame in this actual run. The bounded chunk/reassembly path was independently exercised by source controls; it was not presented as an observed live oversized callback here. [product-tap.f32](product-tap.f32), [virtual-input.f32](virtual-input.f32), [quantums.jsonl](quantums.jsonl) and [events.jsonl](events.jsonl) are derived copies of the complete container. Original callback/row/chunk and session/segment provenance remain in derived event rows.

The complete container revalidation/derivation reports zero unparsed tail, zero nonfinite samples, and source/input peaks0.9800000190734863. All accepted browser requests received matching successful acknowledgements after full Node container writes; final PCM/event/socket pending counts were zero, with observed maxima4/4. The128 event pending limit counts transport chunk frames; original callback count and row denominator are separate. Full append-before-ACK is a retention boundary, not fsync durability or cross-file atomicity.

Owned page/context/browser process, AudioContext/exact namedSPAT virtual tracks, socket5424/client server5420, container descriptor and Node callback admission all closed positively. Node callbacks active at closure were0. No first error, overflow, collector poison, forced browser termination or hard watchdog occurred. Permanent root services were preserved. [browser-retention-trace.json](browser-retention-trace.json) and [node-retention-trace.json](node-retention-trace.json) retain separate same-domain observations; their clock origins must not be subtracted as transport latency.

## Binding and open analysis

SourceHEAD `e7fe740896ebe1b62cd8104d3c6f91dc4882a032`; frozen captureSHA `9c087afe2a69ac1c92a1688b2267c82308cffff71ab4cca8f9d358b975f64edd`; codecSHA `d5d61b4530b2cd7015f86adb207b39c0e1775dca9f2dfca674445bdd82d9a6d8`. Actual fetched pre/post assets both match mainSHA `d8040f401399d61fddde16e1fcd744f1d85208073bf1dd64f2059bcdcaed2245` and uninstrumented processorSHA `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`. Exact original fixtures, topology, runtime source and client-only bundle were retained with source hashes.

The15 source-only protocol controls and typecheck preceded actual acquisition; they test framing, byte fidelity, finite rejection, caps, partial-append terminal poison, missing/duplicate retention and full chunk provenance. They do not test acoustic missing/duplicate group exclusion. Those independent mixture-family controls, measured native before/after route stability, full original-source/input comparison, negative measured-delay failure and actual onset identification/uncertainty remain analysis work. No product-derived calibration, complete human listening or physical venue conclusion follows from this capture. Earlier failed original/exposed captures remain immutable and failed.

[manifest-final.json](manifest-final.json) binds the acquisition review snapshot while preserving [manifest.json](manifest.json) and all captured originals. The subsequent analysis records have their separate [manifest-analysis.json](manifest-analysis.json).

## Independent audit and fixed-fidelity observation

The completed [independent-audit.json](independent-audit.json), SHA `90f15e60165bc9c214c46b00a8ccd1009f69e508b3435ca941b279c422505205`, independently reparses the complete container, derived bytes, original event provenance and acknowledgements. Its capture-integrity result is true with no errors; its qualification and acceptance results remain false. All120 actual calibration rectangles have the same independently measured640-sample lag, with silent product tap during all ten calibration supports. Every positive fixed window is byte-identical between product tap and input at640. The actual100ms negative disagrees at640 and is byte-identical at the separately declared5440-sample hypothesis. This is same-signal and route evidence, not acoustic onset identification.

The single authorized [fixed-fidelity.json](fixed-fidelity.json) execution exited0 after **6.719541 monotonic seconds**, with no execution errors and final RSS239,845,376bytes. It used the unchanged independent oracle and every original fixed-window sample at the retained first-emission epoch. The predeclared criterion requires **both RMS and maximum absolute error ≤1e-6**; it was not relaxed after readback.

| Original window | Samples per comparison | RMS error | Maximum absolute error | Predeclared fidelity criterion |
| --- | ---: | ---: | ---: | --- |
| F02 positive, tap/input | 3,072,000 | 2.419194e-9 | 2.980232e-8 | Met |
| F03 positive, tap/input | 1,152,128 | 7.949886e-9 | 4.470348e-8 | Met |
| F06 positive, tap/input | 960,128 | 1.015417e-7 | 1.672655e-6 | **Not met: maximum error** |
| F08 positive, tap/input | 960,128 | 1.613073e-7 | 2.350658e-6 | **Not met: maximum error** |
| F02 negative, tap | 576,128 | 1.904481e-8 | 8.940697e-8 | Met |
| F02 negative, input at native640 | 576,128 | 4.877222e-2 | 2.146878e-1 | **Rejected nominal model** |
| F02 negative, input at declared5440 | 576,128 | 1.904481e-8 | 8.940697e-8 | Met separate100ms hypothesis |

These are numerical waveform differences, including nonzero Float32 mismatch counts; model agreement is not byte identity. The dense maximum-error failures remain unexplained by this execution. No tolerance change, epoch fit, PCM repair, omitted sample or rerun followed. The helper retains all468 modeled positive audible groups, but `actualIdentifiedGroups:null` and qualification/acceptance false. It does not exclude global/continuous alternative timing models or acoustically indistinguishable duplicate identities. No timing ledger or human gate changes follow from this observation.

[analysis-execution.json](analysis-execution.json) retains the exact command, helper hash, terminal session/exit and recorded output. The120s/RSS256MiB guards are cooperative detected bounds; synchronous oracle rendering is checked before/after, without preemptive interruption. [Analysis-Plan.md](Analysis-Plan.md) retains the source-reviewed method and its remaining limits.
