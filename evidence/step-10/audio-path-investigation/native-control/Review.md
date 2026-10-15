# Bongo Planet native audio path control

A separately captured, independently known native AudioBufferSource waveform was compared against actual source-tap and named SPAT input samples. Product audio remained paused throughout this control. The native source had 0 mismatching samples in 28898048 comparisons; the virtual input had 16132224 in 28897408. There were 14 recorder clock step anomalies, 0 nonconstant adjacent native-tap repeats, and 0 nonconstant adjacent input repeats. These observations are an investigation control, not a product acceptance rerun.

Actual timer: 2026-10-11T19:14:26.815Z, 600.91 real seconds; cleanup completed 2026-10-11T19:24:28.300Z. The 604-second buffer was generated with xorshift32 seed 0x13579bdf, converted to Float32 at construction, and its full hash (180e6356341c8149e1ce9487b4e0e30a5cd4ea4743bcb8514d7cee1016277ce7) matched independent post-capture regeneration. The raw source and input were compared against known samples using their independently retained recording order after locating the initial 64-sample signature. No clock-derived sample index, sorting, repair, interpolation or resampling was applied. Raw data, WAV data, full expected buffer, worklet quantum metadata, frozen harness, fetched source hashes and mismatch ranges are retained.

Native and input signature start offsets differ by 640 raw samples. Twelve separately scheduled native clicks bypassed the source tap and measured the same route before the native waveform started; their independent calibration is retained in report.json. Dynamic empty startup inputs remain recorded in metadata, so raw offsets count actual input lengths. Source lengths: [0,128]; input lengths: [0,128]; render sizes: [128].

| Recorder index | Prior currentFrame | currentFrame | Step error in samples |
|---:|---:|---:|---:|
| 11236 | 1472896 | 1472896 | -128 |
| 11237 | 1472896 | 1473152 | 128 |
| 44776 | 5766016 | 5766016 | -128 |
| 44777 | 5766016 | 5766272 | 128 |
| 79168 | 10168192 | 10168192 | -128 |
| 79169 | 10168192 | 10168448 | 128 |
| 116403 | 14934272 | 14934272 | -128 |
| 116404 | 14934272 | 14934272 | -128 |
| 116405 | 14934272 | 14934656 | 256 |
| 158289 | 20295680 | 20295680 | -128 |
| 158290 | 20295680 | 20295936 | 128 |
| 174457 | 22365184 | 22365184 | -128 |
| 174458 | 22365184 | 22365184 | -128 |
| 174459 | 22365184 | 22365568 | 256 |

This is a ten-minute control on a quieter native graph. It cannot establish the production processor's exact clock reads or replace a thirty-minute dense product run. An absence of anomalies would be inconclusive. If recorder clocks repeat while native samples continue exactly through the expected buffer, that distinguishes clock telemetry repetition from native sample repetition in this run; the earlier product repeats remain actual recorded evidence. If native samples repeat, the retained oracle can identify the exact sample ranges independently of those clock fields. Neither outcome alone attributes a defect to a driver or establishes audible harm.

Exact named SPAT devices were selected without an ambient/default microphone fallback or global routing change. The observer's output is silence; playback is unmuted. Main and processor fetched bytes before/after equal e0985953a9a9dc53c99a60420ea3ce3e4cf762c5c53056e9a7dafc41397fe85f and 155ba49f4f3e41921a86ae4adaa5595bcfe2858f5ebbadc7b28fa3281b50607d. Context/tracks/Chrome and temporary 5420 server closed; permanent application URL remains http://127.0.0.1:5417/BongoPlanet/.
