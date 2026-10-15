# Bongo Planet — fixed-epoch analysis plan

Preparation only. The capture and original report/raw files remain immutable. No new recording, browser, profiler or build is authorized by this plan.

The first stage is deliberately limited to **full-window forward fidelity**, using the unchanged independent `fixtureOracle`/`renderOracle`, not the production Engine/synth. Proposed invocation after successful independent raw audit and source review:

```sh
npx tsx scripts/mixture-fixed-fidelity.ts evidence/step-05/original-mixture/binary-capture-01 --audit evidence/step-05/original-mixture/binary-capture-01/independent-audit.json
```

It exclusively creates `fixed-fidelity.json`; an existing output is rejected. Successful independent audit must bind the exact report, full ordered metadata, both raw recordings and all fixed intervals. The helper also binds the retained topology, fixtures and independent oracle source. It never substitutes local scheduled-onset timestamps for PCM.

Each full interval includes the recorded first/last intersecting-edge blocks and every interior original index. The time axis is original sample-stream ordinal: `firstRecordedFrame +128*originalIndex`. Actual `currentFrame`/`currentTime` residuals remain reported; no sort, timestamp repair, fitted intercept, resampling or PCM alteration occurs. Neighboring model voices through the extra250ms rendering support are included while the declared original group denominator stays fixed at32/36/160/240 positive groups. The negative adds no groups to the468-positive denominator.

The independently scheduled direct native rectangles, not product onsets, define the route. Astra's early readback reports all120 raw48-sample calibration rectangles at exactly640samples, before and after every segment, with silent product tap. The helper requires the completed audit's explicit stable640sample before/after result and retains the complete calibration observations rather than fitting a median product shift. Sample-quantization and physical-route/unsampled-continuum limits remain those of the audit; no timing uncertainty distribution is invented from nominal fidelity.

At the fixed epoch the helper compares every product-tap sample and every virtual-input sample at **native640 only**, hashing each actual/model window. It reports RMS/max differences and finite samples with predeclared1e-6 numerical fidelity tolerance. This is a model-fidelity criterion, not an onset-error criterion. The actual100ms negative is still compared at native640; a separate **predeclared+4800sample graph hypothesis** is evaluated and clearly marked as not fitted. Matching that separate hypothesis cannot recenter or turn the negative into a positive timing pass.

Runtime is bounded at120s, checked between stages and during sample comparisons, with256MiB resident-memory guard; unchanged oracle rendering is synchronous and the guard checks immediately after each call. Raw slices are read per segment instead of loading both complete recordings; file hashes are streamed. A bound failure retains a failed/incomplete result with completed-prefix details, not a full certificate. No actual analysis has run yet.

This stage leaves actual group identification unset. Full nominal fidelity alone does not exclude different IDs, identical oscillator/beat identity, missing/late attacks masked by saturation, or duplicate batches leaving the same64 voices. Retained event-ledger identity is distinct from acoustic duplicate exclusion. The source-only protocol missing/duplicate controls do not substitute for acoustic controls.

After the full fidelity result, a separately reviewed group method may compare observed mixture residual against a predeclared omitted-group background to bound the first distinguishable attack, documenting finite contrast/saturation delay and waveform assumptions. Existing translated-origin/late-insertion sampled families can provide limited diagnostics, including declared100ms and whole-period alias hypotheses, but finite hypotheses cannot prove continuous or global uniqueness. No group algorithm, local-prefix abstraction or new qualification is implemented here.

Execution note: root subsequently authorized the one reviewed invocation. It completed and is retained in [fixed-fidelity.json](fixed-fidelity.json) and [analysis-execution.json](analysis-execution.json); the dense maximum-error criteria were not met. The preparation text above records the method before execution. No group method or additional recording followed.
