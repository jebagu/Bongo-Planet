# Bongo Planet — v3 bounded actual readback

One root-authorized v3 run exited **1**, retaining all **468** positive rows: **63 conditional family measurements**, **5 resource-unfinished F03 rows**, and **400 dense unsupported/unattempted rows**. `qualificationPassed` and `acceptancePassed` are false; `actualIdentifiedGroups` is null, and every row retains `actualIdentified:false`. No retry, cap/tolerance change, original PCM read or additional search was performed for this readback.

The actual command was `npx tsx scripts/mixture-onset-runner-v3.ts --run evidence/step-05/original-mixture/binary-capture-01 --output evidence/step-05/original-mixture/onset-tail-contraction-mvp/attempt-01 --inventory evidence/step-05/original-mixture/group-inventory/attempt-01/inventory.json`. Root reports launch tool3e1122/session18181, readiness checkerdb9a7a exit0 and terminal poll909052 exit1. Prelaunch GO was recorded at2026-10-12T02:10:51.269513+00:00; the terminal was polled at02:14:37UTC. Exact process launch/completion UTC were not retained and must not be inferred from those observations. Root owns the separate execution record and tool-output retention.

## Stop and retained work

The measured monotonic duration was **82.76213287499999 seconds**. Maximum sampled RSS was **215,515,136 bytes /205.53125MiB**, not an OS peak. The recorded error was `Error: MVP work/detail capacity exhausted`. The specific exceeded aggregate is **50,000,234 voice evaluations against50,000,000**, overshooting by234 within the work checked at the next existing guard. The other retained counters were3363 cells against131072,572 comparisons against4096,3,114,705 detail bytes against8,388,608 and maximum frontier19 against2048. Neither the120-second cooperative time target,256MiB sampled-memory target nor4096 per-group cell cap ended this run.

All retained completed groups consumed16 preparation cells:1008 preparation plus2355 search cells equals3363 total. The largest completed group used197 cells including preparation. The unfinished group has no retained diagnostic; no partial witness, proof or frontier is substituted for it. All aggregate cells are accounted for by completed groups, so no new preparation/bisection cell is recorded for the failing F03 group. The serialized result does not retain the exact last concrete-comparison call or source instruction at the voice-work guard.

## Exact group boundaries

| Fixture | Retained denominator | Conditional completed | Remaining disposition |
|---|---:|---|---|
| F02 |32|Indices0–31, expected6.583666666666667–68.58366666666667s|None|
| F03 |36|Indices0–30, expected81.5490000000604–101.5490000000604s|Index31 attempted, no assigned diagnostic;32–35 not attempted after failure; all five resource-unfinished|
| F06 |160|None|160 dense unsupported/unattempted|
| F08 |240|None|240 dense unsupported/unattempted|

The five remaining F03 expected onsets are101.9240000000604,102.0490000000604,103.5490000000604,103.9240000000604 and104.0490000000604 seconds. The runner sets `attempting` before calling the group search and only assigns the returned diagnostic afterward. Its outer failure handler labels both that attempted row and the remaining unattempted F03 rows resource-unfinished; this shared disposition does not mean all five searches ran.

The two immutable complete-window denominators were3,072,000 samples for F02 (original indices2062–26061, firstFrame310016, mapped input offset264576) and1,152,128 for F03 (indices30174–39174, firstFrame3908352, input offset3862912). The fixed original ordinal clock retains baseFrame46080 and the previously audited native640-sample mapping; no clock fit or recentering occurred.

## Conditional results and limits

All63 completed groups retain committed16-slot support contraction, complete960-sample attack, complete processing of their declared narrowed cells, one concrete compatible witness and rejection of the nominal missing/extra and per-component missing/+100ms/extra attack controls. The1008 singleton records remain in the raw result. F02 retains221 excluded/32 unexcluded terminal cells; F03 retains821 excluded/135 unexcluded (up to13 in a group). Multiple unexcluded cells are retained as an outer union hull, not collapsed to a fitted point.

With the inherited one-sample ordinal allowance, completed F02 signed-error hull extrema are−0.03971354164919679/+0.027669270866700423ms; F03 extrema are−0.039713602031118476/+0.02766921047767331ms. Maximum interval width is0.0615234375147035ms. These numbers describe only the conditional common-origin/quantum-admission family with all neighboring voices fixed. They are not independently identified physical onsets, a sound/presentation clock accuracy claim, or a general timing qualification. Witness upper RMS ranges are2.4208089150502866e−9–2.421003879532271e−9 full and5.282395025596378e−13–8.938096965765772e−9 attack for F02;7.950930296270126e−9–7.950960604023332e−9 full and5.520131187689105e−9–1.5133918706080767e−8 attack for F03. Denominators and tolerance were unchanged.

Independent component origins, joint neighboring-origin/admission alternatives, dense ownership search, cursor sensitivity and the actual negative-delay analysis remain unimplemented/unattempted. JavaScript transcendental bounds are declared assumptions, not a certified implementation guarantee. Thus63 conditional measurements cannot close any all468 or actual identified-onset gate. V3's early/tail proof reduced the supported search enough to complete a prefix, while cumulative expression work exhausted the unchanged aggregate budget before the final five F03 rows. This is the measured stopping condition; the result does not justify a larger cap or automatic continuation.

## Provenance and preservation

Raw result SHA256 is `6bd5d1553ba31c7dbecb3a9a9d14e34f2eca8ee7fe69058b86c20c3970c9ab45` (4,012,944 bytes). Runner SHA is `2f2d3c3931ec8749dc2e56e6e560236edc0f5a3b1683117d7b7ce1eb0b9d4098`, main `d8040f401399d61fddde16e1fcd744f1d85208073bf1dd64f2059bcdcaed2245`, processor `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`. The source directory copies exact prelaunch controls-02 frozen bytes and verifies them against both that binding and the result's runner/interval/expression/oracle bindings. These are not reconstructed source snapshots. Prior v1/v2 failures and v3 controls-01 failure remain preserved. `Readback-Metrics.json` contains recomputed result-only arithmetic. Manifests bind retained small evidence/source files without rereading or copying original PCM.
