# Bongo Planet — remaining actual-output onset evidence

This is a bounded source/evidence review, not a new execution or acceptance decision. I read the original Rules/Step05 clauses, the completed binary capture/audit and numerical summaries, the v3 conditional-prefix review/metrics, and relevant model/search source and counterexamples. I did not open or scan original PCM/JSONL streams, execute a helper/test, change source, or edit the ledger.

**Conclusion:** the generic S05-A15–A28 notes are substantially out of date: the complete original recording, independent fixed-lag calibration, dense stall interventions and actual delay negative now exist. However, the retained results do not yet supply a complete, unconditional set of individual audible entrance errors or acoustic missing/extra-event counts for those atoms. No additional full atom in A15–A28 is established by the existing summaries alone without treating unresolved components/neighboring voices as nominal. This is a measurement gap, not evidence that the instrument violated each timing limit.

## Original requirement, without adding an impossible certificate

Rules requires actual loopback output against independent analytic expectations, removal of only independently measured fixed latency, at least 120 onsets spanning F02/F03/F06/F08 with 100/250 ms main-thread stalls, median/p95/maximum errors no greater than 5/10/20 ms, and no missing/duplicate ordinary events. Scheduled timestamps and offline PCM alone do not qualify it.

It does **not** require recovering arbitrary hidden generator/node identities from mono PCM, proving a JavaScript implementation correct for every input, or fitting every entrance to sub-microsecond precision. Identical waveforms have no acoustic identity. A duplicate batch that immediately replaces identical originals under the 64-voice cap can produce exactly the same output; changing only IDs also leaves PCM unchanged. The retained counterexamples construct both cases. Those limits should be handled with the independent logical ledger and an explicitly stated acoustic scope, not by demanding an impossible mono identity proof.

The converse is also necessary: an event ledger cannot show that a particular audible component reached the output, and an excellent full-mixture fit does not by itself identify a time for an overlapped or masked component. The original contract asks for individual errors and a complete ordinary-event outcome, not just one aggregate waveform residual.

## What the completed recording establishes

The retained `binary-capture-01/independent-audit.json` binds report SHA `b374b5c7d75ff691fcd7d48e948d87277f91fb00a4df82e4ca5e9ea543df5a32`, compiled processor `0f0b12c9…`, and the original acquisition main `d8040f40…`. It completed all five fixed windows with intact container/provenance/raw paths, 73,152 original blocks and 111,860 event rows. This supersedes the *evidence availability* described in the older failed capture02 notes; it does not change those older outcomes.

All 120 separately scheduled native calibration clicks were detected at the same integer 640-sample route lag before/after the five segments. The output reference remains native640 and the declared first-emission epoch; neither is fitted to product PCM. The complete positive product/input windows agree at that lag. Native observations and same-stream equality are substantial route evidence; the calibration samples alone are not a continuous proof that no interior clock/route excursion could ever occur.

The fixed forward comparison covers 6,144,384 positive samples:

| Fixture | Full samples | Nominal groups | Original nominal maximum residual |
|---|---:|---:|---:|
| F02 | 3,072,000 | 32 | 2.98023224e-8 |
| F03 | 1,152,128 | 36 | 4.47034836e-8 |
| F06 | 960,128 | 160 | 1.67265534e-6 |
| F08 | 960,128 | 240 | 2.35065818e-6 |

F02/F03 meet the original strict 1e-6 amplitude comparison; F06/F08 fail its maximum criterion, despite small RMS residuals. The later streaming diagnostic completes the dense residual inspection: 702 F06 and 4,506 F08 samples exceed that original maximum threshold. These are amplitude-model failures, not measured violations of the 20 ms onset limit.

The separately declared full-cursor hypothesis matches all 960,128 F06 samples exactly and leaves maximum F08 residual 1.19209290e-7. Its first observer-clock seed was not searched from PCM. Nevertheless, it deliberately keeps analytic admission/ownership fixed and omits unobserved earlier processor history and the command/engine clock floor. It is strong numerical mechanism/fidelity evidence; it cannot retroactively replace the original failed comparison or make its retained nominal ownership an observation of the actual active array.

The actual product-only Delay100 negative rejects nominal native640: RMS 0.048772218 and maximum 0.214687794. Its separately declared native640+4800-sample comparison agrees closely. That demonstrates sensitivity to a real 100 ms product-path delay and independence of native calibration; it is not yet a completed per-entrance negative result from the later onset solver.

The four F06/F08 measured main-thread stalls are fully recorded, with live worklet progress and output retention. They support S05-A14's causal execution clause. They do not, without an entrance witness, assign actual errors to the groups that sounded during the stalls.

## What the event and onset analyses establish

The complete logical ledger has 96/36/14,080/40,320 matched trigger rows and independently matched onset rows for F02/F03/F06/F08, with no missing, duplicate, extra, identity or sound differences in that ledger. The nominal inventory retains all 468 groups and 54,532 voice rows. It classifies 7,280 F06 and 28,200 F08 voices as erased before sound by the specified ownership policy. Deliberately erased voices must not be manufactured into acoustic misses or counted as measured arrivals; the classification is still explicitly nominal until the relevant ownership/acoustic distinction is established.

The v3 result, SHA `6bd5d1553ba31c7dbecb3a9a9d14e34f2eca8ee7fe69058b86c20c3970c9ab45`, contains 32 F02 and 31 F03 completed **conditional** family measurements, five resource-unfinished F03 rows and 400 unsupported dense rows. It stops at 50,000,234 voice evaluations against the unchanged 50,000,000 detected limit. The completed intervals are narrow (overall signed endpoints about −0.039714 to +0.027670 ms), with concrete full-plus-attack witnesses and rejecting missing/extra/delayed component controls.

The source labels the family correctly: common group-origin and quantum-admission variation with neighboring voices fixed. Independent continuous origins of chord components and joint F03 neighbor alternatives are not exhausted; dense ownership is not implemented. Rejecting one missing component at a time does not reject compensating joint alternatives. The five unfinished rows cannot be imputed as zero error or dropped from a percentile. All 468 `actualIdentified` flags remain false and identified-count/qualification fields remain null/false. I rely here on the prior complete retained-result readback and small metrics, without reopening the 4 MB result or rerunning the search.

## Atom disposition from the retained evidence

| Original atoms | Established subset | Remaining requirement before a full pass |
|---|---|---|
| A15–A17: F02/F03 median, p95, maximum | Actual independently calibrated full-waveform fidelity; 63 model-conditional entrance bounds | Complete acoustic entrance intervals with unresolved component/neighbor timing carried, including five unfinished rows; conservative statistics with the full declared denominator |
| A18: at least 120 actual onsets across all four fixtures | Complete recording contains all required fixture windows and 468 nominal groups | At least 120 measured audible entrances with fixture/stall coverage; do not relabel the nominal inventory or 63 conditional rows as measured count |
| A19–A21: F06 statistics | Full original PCM and fixed-lag equality; numerical/cursor diagnostic | Actual F06 entrance-error bounds; none is completed by the sparse solver |
| A22–A24: F08 statistics | Same complete acquisition/fidelity evidence for maximum workload | Actual F08 entrance-error bounds, including saturation and ownership alternatives |
| A25–A26: 100/250 ms stall onset budgets | All four original dense interventions occurred with retained live progress | Entrance bounds for the corresponding audible groups and the declared error statistics, not only timely event records |
| A27–A28: no missing/duplicate ordinary output events | Full logical event count/identity matches and complete output retention; close full-mixture agreement | Reconcile all expected output-distinguishable entrances/extras, while explicitly separating inaudible stealing and indistinguishable identity/multiplicity classes |

There is no reason to keep saying the whole recording/stall/negative acquisition is absent. There is also no basis to set the original timing atoms to failed solely because a numerical model's amplitude maximum or a solver resource limit failed. A current note should say **complete acquisition; partial/conditional analysis; acoustic timing/count qualification remains open**, with the complete capture and later results linked alongside the older failures.

## Smallest sound next analysis

The useful target is **threshold classification**, not another high-precision best fit. The original budgets require 5/10/20 ms, whereas v3 spent work producing intervals tens of microseconds wide and sometimes seeking an origin witness width of 1e-10 seconds. Preserve the declared synthesis equations, tolerances and work/RSS/time caps; extending the explicitly covered nuisance family must be a separately reviewed change, not a favorable replacement fit or silent continuation of a failed run. Prepare any successor separately, preserving every result.

1. **Start with direct acoustic support where it is identifiable.** For F02, use the existing complete fixed windows to delimit all repeated chord bursts from the recorded signal, with a predeclared noise/Float32 allowance and pre/attack/tail checks. Then bound the three distinct components jointly within each burst, rather than forcing one common origin. F03 needs a joint local treatment wherever its preceding/next note can overlap the entrance. A single matched-filter peak or first nonzero sample measures neither all chord components nor a new entrance on top of an old tail. Do not subtract an unresolved neighbor's nominal waveform and call the residual independent.

2. **Carry nuisance uncertainty explicitly.** For a target entrance, include all overlapping audible signatures whose origin, insertion or ownership is still uncertain. Either bound them jointly or use a conservative envelope/projection proven to contain every allowed nuisance contribution. Cache nominal background only on samples where all relevant candidate branches provably leave it unchanged. For dense groups, recompute the 64-voice ownership branch when insertion/multiplicity changes, or retain the branch as unresolved. Saturator inversion is inappropriate near its flat region; use forward bounds and prefer discriminating unsaturated attack/release samples without discarding saturated data from the full denominator.

3. **Use a separation certificate instead of equating amplitude with milliseconds.** Let `Y_i` be measured input samples at native640 with their declared measurement/numerical allowance, and let `F_i(Θ)` enclose every waveform for a candidate parameter cell, including its nuisance voices. A necessary compatibility bound is

   `L(Θ) = Σ_i distance(Y_i, F_i(Θ))²`.

   If `L(Θ) > N·τ²`, the whole cell is excluded by the already declared full-window RMS criterion. Apply the separately declared attack criterion with its own complete denominator; any singleton contrast must exceed the *complete* applicable window allowance. The sum of interval distances is only a necessary exclusion test, not proof that the independent per-sample intervals share one realizable waveform. Retain a concrete full-support plus attack witness for compatibility. This is the missing logical bridge from a tiny waveform residual to a timing bound; the amplitude residual alone contains no units-of-time guarantee.

4. **Stop refining a retained cell when its whole entrance range is classified against the required budget.** Entrance remains `max(phase/envelope origin, actual admission)` for a surviving voice, with output-sample/native-calibration allowance added outward. A cell wholly within a 5 ms error band already satisfies all three time thresholds for that event; it need not be shrunk to microseconds. Continue excluding potentially compatible cells outside the relevant limits, including whole-carrier-period aliases, unchanged-phase late insertion and neighboring-cycle alternatives. Cover the full finite support capable of influencing the comparison; outside-support branches may be collapsed to missing only with the same support proof. A search edge or unexamined branch is unresolved, never automatically good.

5. **Keep outcome counts separate from timing percentiles.** Use an input-order/fixture-order coverage plan fixed before residual selection. All 68 sparse groups plus a fixed 26 groups from each dense fixture would give 120 groups if they are identifiable, including all four retained stall targets; that is an objective, not an asserted feasible result or permission to choose only easy successes. Keep all 468 inventory rows and acoustic ambiguity/missing/extra/resource statuses visible. For a measured set of size `n`, derive absolute-error upper bounds from each whole entrance interval and compute a declared median and `ceil(.95n)` p95; unresolved rows are not zero or silently excluded. The complete ordinary-event count assessment remains separate from any selected timing subset.

6. **Use the original actual negative without rebasing.** At native640, the Delay100 segment must yield out-of-budget/absent-in-window entrances under the same detector, rather than become good after selecting +4800 samples. The latter remains only a separately labeled graph hypothesis. Keep the original ordinal model and declared cursor sensitivity separate; never optimize across clock models to select the smaller error. Any numerical/clock-family assumption used by an enclosure must be visible in its scope.

This is not a demand for an exhaustive search over arbitrary replacement programs or hidden IDs. It is a request to include the *specific unresolved variables that the current fitting family already identifies* when those variables can affect the tested acoustic entrance. Structural separation, conservative nuisance bounds and stopping at the actual budget thresholds can be much smaller than repeating full-window fine fitting for every group. Retain the existing 120 s, 256 MiB and finite work/detail bounds with failure-prefix preservation; no claim is made that all dense branches will fit them.

## Identifiability limit and decision boundary

If all admissible models with an entrance outside a budget can be excluded by measured PCM while at least one full-support witness remains, the retained recording can support that timing bound. If saturation, exact waveform equivalence, erased starts or joint nuisance cancellation leave bad-time alternatives compatible, the row is acoustically ambiguous. No amount of increasing grid density converts identical PCM into identity information.

The logical ledger can establish that ordinary trigger/onset messages were neither lost nor duplicated. Actual PCM can establish output-distinguishable behavior. Combining these is legitimate and closer to the original requirement than an impossible unique-ID decoder, but their two scopes must stay explicit. Existing reports have not yet completed that reconciliation or the required actual-error denominator; a new source-only feasibility decision is the next authorized boundary, not a retroactive pass or an automatic execution/retry.
