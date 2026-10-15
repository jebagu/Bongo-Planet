# Bongo Planet — S05-A14 quantum-execution readback

**Recommendation: scoped pass for the original S05-A14 clause on the retained installed-Chrome/live AudioWorklet configuration.** Existing source causality, a direct production-entry diagnostic, live product PCM through four main-thread interventions, and the unchanged processor's thirty-minute run jointly support it. A new onset/cross-clock certifier is not necessary for this particular clause. Root owns the acceptance disposition; this note changes no ledger or runtime.

The original clause is: “Engine and live synthesis run once per audio-render quantum independently of main-thread/render stalls.” This readback means the regular musical driver executes one engine advancement and one synthesis render per healthy worklet output callback. It does not claim there is only one engine method invocation when an explicit edit/pause command also applies at the worklet boundary, nor that any duration of consumer stall can bypass the declared fail-closed backlog limits.

## Source causality and frozen identity

The current `src/audio/processor.ts` is byte-identical to the binary capture's `application-source/src/audio/processor.ts`; the same is true for current engine, synth and AudioAdapter sources. Retained uninstrumented processor bytes hash `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793` in both the binary and thirty-minute captures. Small source/report hashes and audit references are retained in `Source-and-Evidence-Bindings.json`.

- `src/audio/AudioAdapter.ts:54–55,70` loads the registered live AudioWorklet and connects its node to the ordinary AudioContext destination. Lines57–68 receive/ACK events and telemetry; they do not synthesize or periodically advance the musical engine.
- `src/audio/processor.ts:89–109` implements the live output callback. Lines94–105 derive one block interval and call `engine.advance(end)` once; lines106–109 consume events, call `synth.render(channels[0], start, volume)` once and copy that result to additional channels. No RAF, main-thread timer or per-channel second engine/render driver is present.
- `src/audio/synth.ts:65–68` renders the actual output array's samples from that block interval. `src/view/SphereView.ts:309–315` separately throttles visual RAF updates; it reads the clock and cannot create music.
- Command handlers at `processor.ts:28–45` apply edits/pause in the worklet, with `engine.ts:23–25` performing command-boundary advancement. They do not call synthesis rendering. `processor.ts:48–54` floors repeated browser time against the previous block end; each fresh process invocation still advances a complete rendered block.

This is inspectable causal architecture, rather than a statement inferred only from scheduled event timestamps. Event ACK/backlog limits remain explicit: `processor.ts:59–71` fails closed if reliable telemetry exceeds 2,048 records. The evidence below covers measured 100/250 ms main/render-thread stalls, not an unlimited frozen consumer or an audio device/context suspension.

## Actual blocked-main-thread evidence

The completed original-mixture binary capture is a live browser AudioWorklet acquisition, not OfflineAudioContext rendering. Its frozen `capture-harness.ts:131–150` uses the real production node, its ordinary destination connection, a parallel pre-device tap and named SPAT virtual input. The observer (`observer-worklet.js:3–5`) copies actual input arrays and increments an independent block index each process callback. `capture-harness.ts:203–205` deliberately blocks browser main-thread execution in a measured loop and retains both browser and context endpoints. The main thread also hosts visual RAF, so those interventions prevent the renderer from driving playback during the interval.

The existing `independent-audit.json` reparsed the complete original container: 73,152 original 128-sample blocks, 111,860 complete event rows, exact source/input paths and complete callback retention. The two full F06/F08 positive windows each have 7,501 blocks with no metadata clock-step anomaly and exact source/input equality at the independently measured 640-sample route lag. Their acquisition report remains `qualificationPassed:false`; that does not negate this narrower execution observation.

A new read-only bounded seek inspected only 2,114,112 bytes of the large metadata/event files. It retained exact original byte offsets below in `Bounded-Witnesses.json`; it did not scan the complete JSONL streams. “Blocks” selects actual starts within the recorded context interval, without trimming or repairing their data.

| Fixture / measured main-thread stall | Actual context interval | Live block indices / count | Metadata byte offsets, first→last | First in-stall emission event / byte offset | Actual callback received at context time |
| --- | --- | --- | --- | --- | --- |
| F06 / 100 ms | 124.448–124.544 | 46,308–46,343 / 36 | 12,324,917→12,334,338 | 11,657 / 8,512,428 | 124.554666667 |
| F06 / 250 ms | 128.389333333–128.634666667 | 47,786–47,877 / 92 | 12,722,863→12,747,368 | 17,321 / 12,675,608 | 128.645333333 |
| F08 / 100 ms | 155.493333333–155.594666667 | 57,950–57,987 / 38 | 15,459,487→15,469,454 | 61,783 / 45,360,358 | 155.621333333 |
| F08 / 250 ms | 159.445333333–159.696 | 59,432–59,525 / 94 | 15,858,512→15,883,553 | 78,007 / 57,297,212 | 159.72 |

Metadata offsets refer to `binary-capture-01/quantums.jsonl`; event offsets refer to its `events.jsonl`. The first corresponding new emission times are 124.45333333343655, 128.45333333343655, 155.50933333347473 and 159.50933333347484: each lies inside its blocked interval. Their original callbacks are185/217/382/430, delivered after main-thread release. These are actual retained engine events; delivery time is distinguished from musical event time and is not presented as an independently measured acoustic onset. Combined with the source driver and live PCM, they show that main-thread delivery/RAF is not the engine's scheduler.

A further exact seek read only 8,192 retained PCM bytes: the first and last 128-sample product blocks in each interval and the corresponding input blocks at the already established 640-sample lag. Every pair is finite, nonzero and byte-identical across that route; first/last product hashes differ in each interval. `Bounded-PCM-Witnesses.json` retains exact byte offsets, hashes and scalar observations. One first F06-250 block is constant saturation, so nonzero/saturation alone is not treated as proof of advancing individual voices. Full-window continuity evidence comes from the prior independent audit; individual onset identification remains separate.

## Once-per-callback corroboration and long live run

The earlier separately instrumented `audio-path-investigation/source-clock-control` records production method entry immediately before synchronous `super.process(...)`. Its `Review.md` and `audio-path-investigation/Independent-Review.md:42–61` independently corroborate 115,008 live observer blocks and all115,007 production invocation-counter transitions equal to+1. Even at four repeated clock tuples, a fresh production invocation occurred. This excludes a skipped product callback/reused output explanation for those investigated events. The wrapper adds overhead and uses the earlier processor; it is causal diagnostic support, not a claim that the current uninstrumented run has an internal entry counter.

The uninstrumented fixed processor's `audio-clock-validation/attempt-02-30-minute/report.json` and `root-raw-audit.json` provide longer actual execution evidence: 1,800.146166417 monotonic seconds, 59 validated edits, 677,344 live 128-sample observer blocks and 86,700,032 samples per path. All675,056 timed blocks /86,407,168 timed samples match the virtual input at the independent native lag, with zero nonconstant adjacent duplicates and zero late/audio-late/telemetry drops. The final runtime snapshot remains running with64 voices, sequence1,273,888 and184 pending. The28 observed clock-repeat/recovery pairs remain in the evidence; they do not become dropped callbacks or hidden sample repairs. This readback verifies the small report's hash against the existing full raw audit, rather than rescanning hundreds of megabytes.

## Precise disposition and limits

Recommend **S05-A14 pass scoped to the retained Chrome155/48 kHz production-worklet graph and the measured main-thread/render interventions**, based on one regular per-quantum driver plus observed live progress independent of the blocked main thread. No missing stronger onset-certifier witness should be attached to this original causal clause. The original compiled processor and captured source bind the inference; literal internal call-count logging in every current live quantum is not asserted.

Offline fixture synthesis, oracle comparisons, planned onsets, acoustic group identification and native receiver callbacks are not substituted for live product worklet execution. Numerical mixture/onset failures and earlier repeated-clock/route failures stay intact. This scoped result does not certify physical speakers/venues, human listening, Safari, universal clock precision, indefinite host/audio-thread descheduling or every independent acceptance atom. No source, prior artifact, helper, test, service, browser, runtime or ledger was changed or launched for this readback.
