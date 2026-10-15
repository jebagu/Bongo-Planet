# Bongo Planet audio anomaly investigation findings

The actual product tap contained three adjacent nonconstant 128-sample repeats during a 300.452-second F06 capture. The exact same waveforms appeared as adjacent repeats in the named SPAT input five blocks later. Two source repeats were strongly varied; the third had 62 distinct values and a smaller range. Each source repeat coincided with a repeated observer currentFrame/currentTime followed by a correcting forward step. The first-run raw files, timestamps and capture harness remain unchanged.

The separately recorded 600.910-second native control provides a different result. A known native AudioBufferSource advanced exactly through 28,898,048 expected source samples while the observer clock exhibited fourteen step anomalies across six occasions. No adjacent nonconstant native sample blocks repeated. The native expected buffer was independently regenerated and its complete SHA matched the browser-created buffer. Therefore, clock repetition did not imply native sample repetition in this control.

The native SPAT input had one separate zero-filled 128-sample block at observer index 101551, context frame 13033344. Its surrounding clock fields advanced normally. After that block, the input exactly followed the known native sequence with a persistent extra 128-sample delay. This observed input-path difference does not identify a virtual driver, output graph, browser media pipeline or recorder as the cause. Original input samples were not shifted or repaired.

The product synthesizer computes deterministic samples from the currentTime-derived block start. Repeated production clock values are consequently a plausible mechanism for the product repeats. The first probe records a dependent observer's clock rather than production's actual process entry, so this is a hypothesis awaiting the separately prepared production-entry wrapper diagnostic. A cached or reused graph output remains another possibility until the independent production invocation counter is observed.

Evidence:

- [Product dual-path review](Review.md), [raw report](report.json), [independent analysis](post-capture-analysis.json), [anomaly windows and clocks](anomaly-details.json).
- [Native control review](native-control/Review.md), [independent expected-buffer comparison](native-control/independent-native-analysis.json), [input position diagnosis](native-control/Input-Position-Addendum.md).
- Native source data SHA: 07268f7468080286dd7d4177b3bec67e2c6069158acf61e26368dc462d1e7830.
- Native expected buffer SHA: 180e6356341c8149e1ce9487b4e0e30a5cd4ea4743bcb8514d7cee1016277ce7.

Both runs fetched the unchanged production main e0985953a9a9dc53c99a60420ea3ce3e4cf762c5c53056e9a7dafc41397fe85f and processor 155ba49f4f3e41921a86ae4adaa5595bcfe2858f5ebbadc7b28fa3281b50607d before and after capture. Both closed their AudioContext, exact input tracks, Chrome, and temporary 5420 server. No ambient/default microphone fallback, global routing change, application source change or acceptance pass occurred. The native control used a quieter workload and cannot replace a dense product run. These investigations neither establish audibility nor complete the thirty-minute seamless-output acceptance gate.
