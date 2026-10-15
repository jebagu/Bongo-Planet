# Bongo Planet — native process-tap readback

Read-only source and local-file review. No browser, audio collector or service was launched by this reviewer; two bounded numerical file-read commands were used. Source and existing capture bytes were not changed. These reads were authorized while root was running diagnostic experiments, so this note does not label every root experiment an otherwise quiet run.

## Independently observed files

All three metadata files declare48,000Hz and two channels, zero unexpected buffer-count mismatches, and successful stop/IOProc/aggregate/tap destruction. Their exact file lengths match `frames × 2 × 4`.

| Capture | Frames / bytes | Interior exact-zero runs | Maximum run | Runs of at least64 frames |
|---|---:|---:|---:|---|
| chrome-device-F08-02 |1,917,952 /15,343,616|21|828|175,454,828|
| iab-device-F08 |1,054,208 /8,433,664|17|35|None|
| chrome-playback-device-F08 |1,580,032 /12,640,256|17|35|None|

"Interior" means bounded on both sides by nonzero recorded stereo frames. Leading/trailing recording silence is excluded. Thus the IAB/playback statement is specifically **no long runs**, not no exact-zero samples or short runs at all. The untruncated Chrome02 readback also reports zero nonfinite samples and zero unequal stereo frames.

Chrome02's long runs begin at frame580,256 (12.088666667s,175frames=3.645833333ms),840,781 (17.516270833s,454frames=9.458333333ms), and867,530 (18.073541667s,828frames=17.25ms). Start/end offsets modulo512 are160/335,77/19 and202/6. Their adjacent eight-frame extrema are approximately10^-6 or lower; they have near-zero/ringing boundaries rather than an observed large-amplitude instantaneous file cut. Neither those boundaries nor the nonmultiple512 lengths proves a particular upstream cause.

## Collector path and acquisition alternatives

`process-capture.m:15` copies each input float immediately into preallocated storage. It writes only the accumulated frame count after stop/destroy calls, so the large unused zero-initialized allocation is not appended to the file. The recordings remain below the60-second allocation. There is no file I/O, logging or heap allocation in the copy callback and no collector gain/filter/resampling code. These facts argue against simple trailing-capacity padding or a deliberate writer transformation as the source of interior runs.

However, the same line writes literal zero when `mData` is null. No null-buffer mask/count is saved. `unexpectedBuffers=0` covers only the `mNumberBuffers` mismatch branch, and does **not** exclude null input data, empty callbacks, callback starvation or CoreAudio-supplied silence. Empty or mismatched callbacks return without recording their omitted time. Callback `AudioTimeStamp` arguments and callback sizes are not retained, so recorded-frame time cannot certify wall-clock continuity. A missed callback would compress the saved timeline rather than necessarily insert a zero block; null-data handling can insert zeros. The long runs are not aligned whole512-frame chunks, which weakens that one simple null-whole512-buffer explanation, but callback-size stability itself was not recorded.

The private aggregate enables a process tap without explicit drift compensation or a separately retained clock-source relation. Tap/aggregate acquisition therefore remains part of the measured path. The route snapshot associates process object185 with Chrome helper PID1787 and198 with Codex helper PID5022, both with Studio Display Speakers device157; the collector's own JSON does not bind the selected process object/PID, full ASBD, timestamps or route identity. A process mixdown can also include other audio streams owned by that process. This is process-output evidence, not a microphone or physical-speaker measurement.

Write return values are not checked and successful stop codes do not retrospectively establish callback continuity. Actual byte-length agreement rules out truncation in these particular files; it does not supply missing callback witnesses. Noninterleaved copying also relies on every channel buffer having the count inferred from channel0, without retaining/checking each channel byte length. No such malformed-layout corruption is established here.

## Supported conclusion and smallest distinguishing addition

The default Chrome02 **retained process-tap stream** contains three long silence runs that the retained IAB and playback-hint trial do not. This is consistent with a Chrome downstream buffering problem and with the proposed latency tradeoff, but it is not yet a uniquely established browser underrun or physical-speaker defect. Equal product-node recordings from a different take cannot by themselves locate these three individual gaps after the worklet.

Before attributing them uniquely, a bounded collector witness can count null/empty/shape-mismatch callbacks, retain per-callback frame counts plus valid input sample/host timestamps and an independently read host arrival time, and bind process object/PID/route/full ASBD. Preserve these in preallocated bounded storage and write after stopping, with explicit overflow and write-success checks. Ideally pair the product-node PCM and native tap during the **same** take and retain one fixed alignment, then inspect the corresponding three windows without fitting separate offsets around gaps. None of these observations requires changing synthesis, weakening an acceptance gate, or asserting that reported outputLatency is a physical zero.
