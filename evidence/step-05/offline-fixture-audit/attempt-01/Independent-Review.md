# Bongo Planet — independent offline fixture review

The completed [audit](report.json) supports scoped passes for **S05-A3, S05-A4 and S05-A6**. These are numerical offline Engine/MonoSynth checks. They do not qualify the live AudioWorklet, browser output, physical route, listening or any milestone.

Reviewed harness SHA-256: `709174328c3e345682a942b4498b216dde301d60f2fa0057423a0df9dac0e261`. Before execution, review requested actual entrance checks for every isolated cycle rather than only the first, explicit chord spread/phrase order, zero stealing, and an independently enumerated overlap count. The retained executed source includes those checks.

The expected schedules use explicit periods, delays and frequencies, without deriving expectations from Engine event times or fixture expected-output files. F02 expects three pitches at 0.125 seconds every two seconds. F03 expects entrances at 0.125, 0.5 and 0.625 seconds every two seconds. F04 uses both original 1.5- and 2-second generator periods and includes the same-node, same-pitch cross-generator coincidence at 4.75 seconds. The full original mixtures are rendered separately from the clearly labeled variants that mute other targets and disable other generators.

## Independent artifact readback

No application, browser or full audit rerun was performed. A bounded read-only calculation verified all six retained source hashes, all three fixture hashes, and all fifteen raw PCM hashes. Every raw file has exactly 288,000 finite Float32 samples (six seconds at 48 kHz).

Independently rescanned all **39 isolated entrances** from their raw samples: nine F02, nine F03 and twenty-one F04. Each first sample above the declared `1e-4` signal threshold is two samples after its independently specified onset: approximately **0.041667 ms**. F02's three measured entrances have zero spread in each of three cycles. F03 preserves the three distinct expected entrances and their order in every cycle. These threshold crossings describe the implemented attack envelope; no product-derived offset was subtracted.

Independently checked 1,125 original-mixture sample points against scalar sine/kick equations at the fixed zero epoch: 316 F02, 370 F03 and 439 F04 points, including onset neighborhoods and the F04 overlap. Each checked expected Float32 sample equals the retained sample exactly. This spot-check corroborates the complete executed harness comparison; it is not a second full-waveform comparison. The actual report's complete nominal RMS differences are approximately `6.99e-15`, `2.17e-13` and `1.12e-13` respectively, with no fitted time shift.

Independent interval enumeration gives allocated-voice peaks **3, 3 and 6**, agreeing with the actual counters. F04's peak of six includes the upcoming 4.875-second kick admitted at block start `233984 / 48000 = 4.8746666667` while the prior kick has not expired. The maximum number of simultaneous audible-duration intervals is five. My preliminary source-review message's estimate of five concerned audible overlap and was not the correct allocated-voice counter expectation. The report correctly records six. No stealing or Engine/synth late drops occurred in these renders.

## Scope and disposition

The original full-mixture PCM comparison, actual per-pair entrances, distinct schedule provenance and bounded non-stealing allocation jointly support the three named offline checks. Scheduled receipts are corroborating evidence; they are not substituted for PCM. Identical simultaneous voices remain indistinguishable from identity alone in a mono waveform, and the labeled isolated variants are not claimed to be unmodified full-mixture recordings.

The separate failed live mixture captures, receiver exactly-once failure, live clock-conversion gaps, human review and physical-output requirements remain unchanged. `liveQualificationPassed=false` is appropriate. No overall acceptance or milestone pass follows from this result.
