# Bongo Planet — repeated-block investigation

The final 30-minute SPAT recording contains strongly varying adjacent equal 128-sample blocks and a paired −128/+128-sample recorder-clock anomaly. The immutable original capture remains the evidence; it is not repaired or replaced by this investigation.

The discriminating experiment records the actual product worklet output before its destination and the exact named virtual input together in one silent, two-input observer. Independent block/batch indices preserve arrival order even if clock values repeat. Per-quantum `currentFrame`, `currentTime`, actual input lengths, raw offsets and raw Float32 samples are retained. Both routes share one observer clock: they do not provide two independent clock witnesses.

The first capture uses original F06 with defined 30-second edits and an immutable production snapshot. Twelve native direct-to-destination calibration clicks bypass the product tap. They estimate only fixed route lag, permitting waveform-neighborhood comparison between source and input without altering either recording. An absent recurrence in a five-minute capture does not exonerate the earlier 30-minute fault.

Possible outcomes guide the next experiment:

- A repeated direct-tap block followed by the same repeated input neighborhood localizes the issue upstream of the output-device boundary. It does not alone distinguish synthesis from browser graph execution.
- A varied direct-tap neighborhood with an input-only repetition localizes the new observation downstream of the tap. It does not uniquely identify the virtual driver rather than browser input buffering.
- A repeated observer clock plus repeated direct PCM supports the shared render-clock hypothesis. The value read inside the product processor remains uninstrumented in this first probe.
- Missing/reordered independent block indices or raw/metadata disagreement invalidates capture attribution and requires a harness investigation first.

Changing `currentTime` to `currentFrame / sampleRate` is not an established remedy. The [Web Audio rendering model](https://www.w3.org/TR/webaudio-1.1/#rendering-loop) defines the two values from the same render-frame counter; [Chromium's global-scope implementation](https://chromium.googlesource.com/chromium/src/+/HEAD/third_party/blink/renderer/modules/webaudio/audio_worklet_global_scope.cc) also computes `currentTime` from that counter. These sources describe intended/current upstream behavior, not proof of the installed browser's behavior during the recorded anomaly. Ordinary floating-point error at the observed duration is far smaller than a sample and cannot by itself explain a full 128-frame displacement.

A separate native `AudioBufferSource` with known aperiodic data through the same two-input observer is the next useful control if the first capture reproduces the issue. Native-source repetition would bypass the product's clock-dependent synthesis. Each experiment retains its own source binding, raw evidence, interpretation and limits; no milestone changes follow merely from a diagnostic capture.
