# Bongo Planet — AudioContext-to-bridge clock boundary plan01

Status: read-only source/specification/evidence preparation. No browser, worker, audio, service, test, acquisition or PCM scan was run; no production/ledger changes. Existing native timing failures and S09-A9's open status remain unchanged. Root must approve reference semantics, source instrumentation and a separate actual run before execution.

## Reference and present conversion

The original Step09 gate is browser audio-time→bridge monotonic conversion within10ms on loopback, with actual spatial sound deferred to M2. Its narrowest reference is the **running render/sample timeline used by the musical engine**, not automatically the instant a speaker emits sound. A future report must say precisely whether it measures observable render-clock passage, audio-device presentation, or physical acoustic arrival. They are different tests.

The normative Web Audio definition makes `currentTime` the next render-block sample time, not a wall-clock reading; synchronization with another clock is not guaranteed. `getOutputTimestamp` instead pairs a stream sample coordinate with estimated device-presentation performance time; its accuracy depends on extrapolation distance. Neither API specifies a universal numerical error ceiling. `baseLatency` and `outputLatency` describe distinct processing/output estimates. These distinctions follow the [W3C render-clock definition](https://www.w3.org/TR/webaudio-1.0/#dom-baseaudiocontext-currenttime), [output timestamp mapping](https://www.w3.org/TR/webaudio-1.0/#dom-audiocontext-getoutputtimestamp), and [latency attributes](https://www.w3.org/TR/webaudio-1.0/#dom-audiocontext-outputlatency). Browser performance timestamps also have privacy coarsening; their reported precision is not certified physical accuracy. [High Resolution Time](https://www.w3.org/TR/hr-time-3/#coarsen-time)

Current `src/main.ts` constructs `OutputAdapter(()=>audio.now)`; `AudioAdapter.now` returns context.currentTime. For trigger sample-time `c`, OutputAdapter separately reads `a=audioNow()`, then sends

```text
bridgeDeadline = p + (c - a) + bridgeOffset
p = performance.now()/1000
```

The bridge handshake converts performance time into Node time, with a separate native hrtime/performance conversion. The audio mapping's implied offset is `p-a`. A correct render-reference comparison must independently bound the render/sample-time→performance relation over the measured interval and compare this implied offset/deadline with that relation. It cannot assume the pair is simultaneous, the rate is exactly1 at all times, or a main-thread clock read has an independently bounded relation to the processor's effective cursor.

For the *separate* device-presentation reference, the standardized estimate is

```text
presentationPerformance(c) = stamp.performanceTime/1000
                           + (c - stamp.contextTime)
```

For equal `c`, the present conversion minus this estimate, before bridge offset, is `p-a-(stamp.performanceTime/1000-stamp.contextTime)`. This algebra exposes the reference difference without fitting an onset or subtracting it away. It is a comparison against a UA estimate, not a physically measured error. The visuals use `audio.audibleNow`, which extrapolates that pair and clamps to[0,currentTime]; fallback subtracts `outputLatency ?? baseLatency ?? 0`, not both. That visual getter is not used by OutputAdapter. Replacing `audio.now` with `audibleNow` would change the reference and must not be presented as a measured repair of the original render gate.

## What retained witnesses establish

The independent native qualification review validates eight producer startup performance↔Node probes, independent end probes,8,128 Node↔native bracket pairs and600 in-window outcome witnesses. Its combined measured-domain uncertainty bounds2.115918ms /1.341917ms apply **after the browser performance boundary**. They do not enclose AudioContext→performance conversion. The F01 missing callback remains a failure despite a good percentile.

The completed copied coordinated diagnostic independently retains180 expected callbacks and120.007460458s Node /120.01080000007153s browser elapsed intervals. Native conservative p95/max1.984376/10.081126ms and producer+native3.034376/11.131126ms are separate domains, not a10ms audio-clock conversion certificate. Its own review keeps this boundary open.

The AV capture retained output timestamp samples and an observed offset-deviation maximum0.10400002383380524ms, with independent native-click route calibration13.333333ms. That observed spread concerns a different build/device-presentation estimate; it supplies no bound on a constant UA estimate bias or the present trigger conversion throughout F01/F04. Direct native-click schedule→input calibration uses the AudioContext sample axis and input clock and does not by itself establish an independent AudioContext→performance wall-time map. No original PCM was reopened for this assessment.

## Concrete implementation assessment

No retained observation here demonstrates that original render-reference conversion exceeded10ms. There are concrete unbounded assumptions: the audio/performance reads are unbracketed; a pause between them shifts the deadline; render-clock steps/bursts and suspension are not continuous unit-rate wall time. The repaired processor additionally uses `max(rawClock,previousEnd,engine.now)` with a20ms bounded stale-clock correction. Trigger `c` is in that effective timeline, while `audio.now` reads the raw public context clock. An actual difference at conversion time is not measured by source alone, but must not be omitted from the uncertainty budget. No exact20ms error is asserted from the guard constant.

If the intended reference were alignment with local device-presentation time, using currentTime instead of an output timestamp estimate omits the render/presentation distinction and can bias remote scheduling early relative to that estimate. That is a concrete semantic mismatch under that **additional reference choice**, not proof of an original render-gate failure or physical audibility. Root owns any policy/source decision.

## Minimal proposed acquisition, not authorized to run

First approve the render-reference operational definition. A feasible narrow observable is a running AudioContext sample-clock crossing bracket on the same page performance clock, separately accompanied by output timestamp estimates. It measures control-clock passage; it does not certify when the graph physically renders a sample or the device emits it. If the gate needs either stronger reference, this acquisition remains a diagnostic subset.

Use unchanged installed Chrome/product sources and original F01/F04, with explicit fetched build/source bindings and actual session/state. Passively bracket the existing event callback before/after, invoke it exactly once unchanged, and retain original WebSocket trigger payloads and before/after send clocks. Do not replace clock getters or rewrite/addModule product sources. At independent bounded sampling callbacks, read `p0,currentTime,getOutputTimestamp(),currentTime,p1`, preserving read order and both audio values. Retain context state, sampleRate, actual quantum metadata if available without source changes, performance.timeOrigin, receiver session and current handshake bounds. Same-task before/after reads bound observation time, not unknown UA getter/driver error. Record callback perturbation and observed privacy/timer granularity without promoting a chosen epsilon to a certified bound.

For each predeclared original trigger sample time `c`, retain the last sampled audio value below `c` and first at/above `c`, including all intervening original indices and clocks. The outward performance interval spans the previous observation's before time to the next observation's after time, with explicit timestamp-coarsening allowance. A skipped quantum, regression/repeated progression, stale context, missing bracket or wide callback gap remains unresolved. This is an operational clock-passage bracket: do not silently reinterpret its endpoint as an output timestamp or exact sample-processing instant. Distinguish whole-block timing from the within-block sample coordinate. Trigger admission/late delivery and exactly-once counts remain separate gates.

Reconstruct the actual conversion offset from the wire deadline, immutable trigger `c` and frozen handshake offset; compare it with independent contemporaneous render observations. For a future `c`, extrapolation needs an explicit finite rate/drift assumption or later crossing verification. Full playback coverage cannot be inferred from startup/end agreement. Retain every planned row; use conservative lower/upper conversion error plus independently bounded producer/native conversion uncertainty. A row whose total interval cannot lie wholly within±10ms is unqualified; a resource/gap failure does not disappear from the denominator. An independently paired worklet request/reply could later bracket when its raw clock is read, but requires separately reviewed instrumentation; receipt time alone cannot be substituted for the read or render instant.

Separately compute, without correction/fitting, current-conversion minus each output-presentation estimate and its variation. Retain zero/stale output timestamp pairs, sink/state changes and extrapolation distance as unavailable/unqualified. These values could demonstrate a semantic presentation offset; they do not certify physical output accuracy. No acoustic microphone, loopback PCM, venue device or recording is needed for the narrow control/reference comparison. Physical onset qualification remains separate.

A candidate acquisition is two original120s fixture windows, one at a time, with independent externally owned startup/timed/cleanup caps. Sample at requested1ms with an observed-gap criterion, never assume that cadence is delivered. Nested timer clamping and main-thread work can widen brackets. Bound samples to300,000, trace bytes32MiB, event rows8,192 per fixture; fail/retain prefixes before overruns. Polling/instrumentation is explicit host load. No artificial stall in the first ordinary reference run; deliberate stall/suspend negatives would be separately authorized, retaining failed intervals rather than redefining clock tolerance. Failed acquisition means no retry, no new rate/cap or fallback physical-truth claim. The exact sample budget/timeout and causal error equations require source review before any implementation/run.

The useful immediate result is therefore a source-defined missing boundary and a feasible **conditional control-clock bracket**. Getter comparisons and native clock calibrations alone cannot complete the original end-to-end mapping claim unless root accepts and clearly names that operational reference and uncertainty assumptions. No10ms pass is declared here.
