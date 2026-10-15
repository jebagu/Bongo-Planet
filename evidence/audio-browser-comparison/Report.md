# Bongo Planet browser audio investigation

Investigated 2026-10-12 on the user's Mac, existing Chrome profile and Codex in-app browser. No production synthesis or AudioContext policy was changed.

## Outcome

No consistent browser-specific timbre change was reproduced. Matched scenes generate identical mono PCM (F01 and F08 exactly; F09 within Float32 rounding after alignment). One Chrome process-output recording has three short silent runs; the in-app counterpart and a playback-buffer trial do not. Two later default-buffer controls were also clean, so the difference is intermittent and causal attribution remains open.

The user tabs initially showed different scenes: Chrome F09 at40BPM; in-app tab1 F01 at120BPM; in-app tab2 F08 at180BPM. All were paused. They also referenced different main bundles. The historical on-disk main bundle referenced the same processor asset as the current build. The source audio processor was not changed during this investigation. Existing user compositions were left intact. An attempted Export download event timed out; it was not treated as successful preservation. All experiments used separate tabs/iframes with fixture scenes.

## Matched product signal

A passive diagnostic AudioWorklet copied the actual product-node mono output into Float32 PCM. The existing audible connection remained in place; the tap output silence. The application UI's loaded-paused fixture confirmation was read before recording. Each take included12seconds of PCM and retained scene, event/status observations, actual sample rate and output-latency estimates. Playback warmup and separate-port ordering mean captures must be aligned; index0 is not a shared acoustic start.

| Pattern | Rate in both | Retained onsets in both | Aligned maximum PCM difference |
| --- | --- | --- | --- |
| F01 First pattern |44100Hz|18|0|
| F08 Maximum workload |44100Hz|23824|0|
| F09 Slow travel stress |44100Hz|672|2.98e-8|

F08 has peak0.98, RMS about0.92, and approximately82.7% of samples above absolute0.9 in both recordings. F09 has RMS about0.627 and approximately17.5% above0.9. This is shared heavy limiting/saturation, consistent with many long overlapping voices; it can obscure attacks and sound dense or muddy. No normalization, timbre, envelope or voice-stealing policy was changed.

Raw comparison details: [analysis.json](analysis.json). The matching scene JSON and PCM are linked by the filenames in that report. Counters did not report late audio drops or telemetry drops in the retained successful takes. Event/status observations include post-window pause rows; they are not a separate acceptance gate or proof of every physical onset.

## Routing and process-output recordings

A read-only CoreAudio query while Chrome played showed both Chrome's audio helper and Codex's audio helper using the same Studio Display Speakers device157. No route was changed. See [chrome-playing-routes.json](chrome-playing-routes.json).

A separate private, unmuted CoreAudio process tap copied each browser helper's output to preallocated memory and saved after stopping. Native tap format was48000Hz stereo; channels were identical. This is a software output-stream measurement, not a microphone recording of the physical speakers. The tap may add scheduling load. Source and cleanup outcomes are retained in process-capture.m and each native JSON.

F01 process-output correlation was0.999978 after integer alignment, with identical channel configuration and closely matching gain. Subsample resampling phase and different window coverage prevent byte identity downstream; no broad spectral muffling was demonstrated.

Original complete Chrome F08 native recording chrome-device-F08-02 contains interior exact-zero runs175,454 and828frames, or3.646,9.458 and17.250ms. The corresponding IAB recording has no runs>=64frames; it does contain short near-crossing zero runs, maximum35frames. Source readback: [Native-Process-Tap-Readback01.md](Native-Process-Tap-Readback01.md).

The initial native collector silently substituted zeros for a null input pointer and omitted callback timestamps. Although gap boundaries were not whole512-frame blocks, this acquisition ambiguity prevents uniquely attributing the original gaps to Chrome. The source was hardened to retain null counts, buffer shapes, callback offsets and sample timestamps. The final default-buffer control had nullFrames0, emptyCalls0, unexpectedBuffers0, callbackOverflow0, continuous callback sample timestamps and no interior zero runs>=64frames. All four stop/destroy operations returned0. See chrome-traced-default-device-F08.json.

## Buffer experiment

Only the diagnostic iframe overrode AudioContext construction to test latencyHint='playback'. On the same F08 scene and main build, reported baseLatency increased5.805ms→23.220ms. The playback-hint native take had no interior zero runs>=64frames. Its reported outputLatency was0; that is not a claim of zero physical latency. A reverse default-buffer trial was also clean. Therefore one successful playback-buffer trial is not sufficient to claim a proven fix. Production AudioAdapter remains interactive.

## Discarded or limited takes

- chrome-device-F01 was an all-zero standby capture before test playback; excluded.
- Initial F08 HTTP uploads exceeded the collector's8MiB metadata limit and failed. No files were accepted from those attempts. The limit was raised to48MiB for bounded12second maximum-workload takes; original server source retained as capture-server-v1.py.
- chrome-device-F08 covered only the beginning of playback because the22second native recording ended early; excluded from the main native comparison. A40second repeat was retained as chrome-device-F08-02.
- The IAB F08 native comparison covers most of its12second sound window; a small ending difference can inflate whole-window residuals. No physical-speaker equivalence is claimed.
- This investigation does not close or waive existing build acceptance gates.

Listening copies: [Chrome first-pattern output](Chrome-first-pattern-output.wav) and [In-app first-pattern output](In-app-first-pattern-output.wav). These are derived stereo float WAVs trimmed to11.1seconds, beginning100ms before the first audible sample; no gain normalization or codec conversion was applied. Original native PCM remains retained.

## Reproduction tool

[Audio comparison page](http://127.0.0.1:5417/BongoPlanet/audio-comparison.html) embeds the current instrument and offers a12second passive tap, WAV/metadata downloads, and default/playback buffer selection. Changing buffering resets only the diagnostic iframe. Choose the fixture and wait for its loaded-paused notice before recording. The optional local collector is not required for downloads. It was stopped after the investigation. Existing user tabs were not reloaded or edited.

The user's exact compared pattern and whether both browsers had the same scene remain unconfirmed. That information is needed to reproduce their reported subjective difference instead of equating a passing controlled comparison with a solved complaint.
