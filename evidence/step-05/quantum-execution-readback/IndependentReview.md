# Bongo Planet — independent per-quantum execution review

**Recommendation: scoped PASS for the original S05-A14 execution clause in the retained Chrome/48 kHz live-worklet configuration.** The source driver and actual blocked-main-thread witnesses support this clause. They do not require a new individual-onset certifier to establish where the engine and synthesis execute. Root owns the ledger decision; this review changes no acceptance status.

I read the current processor, AudioAdapter, engine and synthesis call paths, the frozen capture graph/stall loop, the original Rules/Step05 requirements, and the selected completed diagnostic and recording records. No application/helper/test/browser/service/profiler was run. No full PCM or large JSONL scan was performed.

## Bound evidence and independent retained-data checks

The four entries of `Manifest.json` all match their recorded bytes and hashes, totaling 50,233 bytes. The manifest itself is 878 bytes, SHA `823c299c741e80d2e403766ffc521025c8061abb14dae06222c2dbc63f4601c7`. In particular, `Readback.md` is 9,460 bytes, SHA `1986c671d90f1e700a23fedf0ef3e8f23b2a189e3c05b7fba146ad268d098b0f`.

All 21 small-file entries in `Source-and-Evidence-Bindings.json` match independently recomputed bytes and hashes. Current processor, engine, synth and AudioAdapter sources equal the corresponding original binary capture's sources. The processor source is `429555623b5f55c8df29a00b3ce6d9546a3d85fa2d1ba3e5e6b30d0b142f849b`; the retained compiled processor is `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`, the same identity declared in the thirty-minute capture.

The binary report hash `b374b5c7d75ff691fcd7d48e948d87277f91fb00a4df82e4ca5e9ea543df5a32` agrees with the earlier complete independent audit. That audit remains successful for acquisition integrity, with 2,832 complete container frames, 73,152 original blocks and 111,860 event rows. I rely on its already completed full-container/raw audit for whole-file provenance; I did not independently rehash the large recordings in this review.

I independently sought to each of the 24 specified first/last metadata and event byte offsets, checked the complete original row against the derivative, and read the contiguous metadata ranges between each first and last block. Total original JSONL data read was 79,991 bytes. All 260 selected metadata rows have contiguous independent indices, 128-sample frame/offset increments, full 128-sample source/input paths, and starts within their recorded stall interval:

| Original fixture | Browser main-thread block | Context interval | Original block indices | Count |
|---|---:|---|---|---:|
| F06 | 100 ms | 124.448–124.544 | 46,308–46,343 | 36 |
| F06 | 250 ms | 128.389333333–128.634666667 | 47,786–47,877 | 92 |
| F08 | 100 ms | 155.493333333–155.594666667 | 57,950–57,987 | 38 |
| F08 | 250 ms | 159.445333333–159.696 | 59,432–59,525 | 94 |

All 16 selected retained emission rows lie inside the corresponding context interval and are delivered to the main thread after its release. These are original event rows, not regenerated expected events. Their callback receive clocks remain distinct from their logical emission times. The capture's actual `while (performance.now() - start < durationMs)` intervention blocks the same browser thread that runs the UI/RAF, while the worklet graph is already running. Context-time spans and measured browser durations are not substituted for one another or asserted to be exact cross-clock timing measurements.

I also reread exactly 8,192 PCM bytes: first/last 128-sample product blocks for each of four interventions and their input counterparts at the independently established +640-sample lag. Every block hash matches `Bounded-PCM-Witnesses.json`; every source/input pair is byte-identical, finite and contains nonzero samples. The first and last product hashes differ in every intervention. One F06/250 ms boundary block is constant saturation, so that block alone does not identify individual voice progress. Full-window exact route equality rests on the earlier complete audit, not an extrapolation from these eight sampled block pairs.

## What the source establishes

`BongoProcessor.process` has one regular healthy output path. It derives the current block interval, calls `engine.advance(end)` once, drains/applies engine events, calls `synth.render(channels[0], start, volume)` once, and copies that output into any additional channels. The synthesis sample loop uses the passed block origin and sample rate. It does not depend on a main-thread timer, RAF cadence, or a main-thread batch of pre-rendered samples.

The AudioAdapter creates the actual registered AudioWorkletNode and connects it to the AudioContext destination. Its port handlers receive/acknowledge event and status messages; they do not run the synthesis loop. The frozen capture uses that production node, its ordinary destination path, a parallel tap, and a separate observer worklet that copies actual input arrays per process callback. The observer itself outputs silence. Thus live recorded samples are not an offline renderer or the output of the measurement observer.

“Once per quantum” here denotes the **regular musical driver per healthy output callback**. An explicit scene edit, load or pause also advances the engine to its command boundary through `Engine.update`/`replace`/`pause`; these handlers do not render a second synthesis block. An assertion that there is exactly one engine-method invocation under every possible command sequence would be a different and false reading of the implementation. Absent output channels and a latched processor failure also have explicit early-return/silence paths.

The current clock cursor uses `max(raw currentTime, previous block end, engine.now)` and then advances the full output-array duration. Repeated browser clock globals therefore do not select a stale block merely because the same raw timestamp is observed. This supports the source execution explanation, without claiming a newly established relationship to physical presentation time.

## Supporting entry-count and long-session evidence

The separately instrumented earlier `source-clock-control/entry-analysis.json` retains 115,008 observer blocks and all 115,007 invocation-counter transitions equal to +1. Its four repeated-clock tuples still have fresh production process entries. The wrapper recorded immediately before synchronous `super.process`, so this is direct invocation evidence for that earlier instrumented processor. It is corroboration of the execution architecture, not literal call-count logging inside every current uninstrumented callback, nor proof that the earlier repeated-clock PCM defect never existed.

The unchanged compiled processor's later thirty-minute report hash `909bd6d30f6e55928430e521e4133e68728f182e16b84f8116a14ac3029c399b` matches its existing `root-raw-audit.json`. The retained records show 1,800.146166417 monotonic seconds, 677,344 original 128-sample blocks, 59 edits, and 675,056 timed blocks / 86,407,168 samples exactly matched at the independently measured native lag. The final audio snapshot remains running; late, audio-late and telemetry-drop counters are zero. The recorded clock-repeat/recovery observations remain present. This is longer supporting execution evidence; I checked its small bindings and audit record, not the entire raw files again.

## Scope of the recommendation

Rules explicitly place live synthesis and the engine tick in the audio render thread; Step05 requires audio-clock scheduling independent of rendering. The checklist's S05-A14 states that execution requirement separately from the actual-output onset-error requirements. Current source causality, live product sample progress and new engine emissions during four measured main-thread interventions adequately support the original causal clause for this retained configuration.

The result is bounded by the implemented reliable-event consumer limit. A sufficiently long/high-fanout main-thread blockage can exceed 2,048 queued telemetry records and correctly fail closed; independence does not promise unlimited operation with a frozen consumer. Audio-context suspension, failed worklet execution, indefinite host/audio-thread descheduling, Safari, physical output/listening and individual compensated onset budgets remain separate. The recorded 100/250 ms interventions do not by themselves pass S05-A25/A26 or the broader live-output gate.

No missing acoustic onset identification, current uninstrumented internal counter, or universal scheduling proof is silently supplied. Conversely, imposing one of those stronger unrelated certifications would withhold this original execution clause despite the retained source and live evidence. Earlier failed recordings and numerical/onset qualifications remain unchanged.
