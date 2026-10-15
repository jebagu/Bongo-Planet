# Bongo Planet production process-entry clock investigation

Every retained source duplicate was a fresh production process invocation with repeated entry clock values; observed duplicates are not explained by skipping this product process callback. There are 4 retained nonconstant adjacent source block repeats in this separately instrumented five-minute F06 run. Production and dependent observer clock tuples agree at every valid source block: true. Full production invocation-counter step distribution: {"1":115007}.

| Observer index | Unique samples | Range | Production invocation index | Entry frame step | Entry time step |
|---:|---:|---:|---|---:|---:|
| 9849 | 97 | 1.95996 | 10122 → 10123 | 0 | 0 |
| 32212 | 128 | 0.00458288 | 32485 → 32486 | 0 | 0 |
| 52892 | 20 | 0.00000184774 | 53165 → 53166 | 0 | 0 |
| 100789 | 98 | 1.95910 | 101062 → 101063 | 0 | 0 |

Actual timer was 300.563 seconds from 2026-10-11T19:31:21.145Z; cleanup completed 2026-10-11T19:36:22.199Z. The retained native clicks measured 640.0000000000148 samples of route delay. Raw product and exact SPAT input recordings remain unchanged, with original per-block samples, monotonic observer indices, independent production indices, both clock tuples, anomaly windows, and fetched-asset attestations. Source/input lengths were [128]/[128] and render sizes [128].

The only diagnostic code change is the retained lexical registerProcessor prefix, which subclasses the original registered processor and writes one shared clock/index object immediately before calling its original process method. Product node → observer dependency orders the product before the observer. The wrapper observes method entry; it does not patch the original internal currentTime expression. It adds allocation and invocation overhead and is not an acceptance-qualified production snapshot.

Original processor SHA: 155ba49f4f3e41921a86ae4adaa5595bcfe2858f5ebbadc7b28fa3281b50607d. Instrumented fetched processor SHA: 41e8ba440852834e61b5583154feddf03e674cbdd481ed7e84a2dd87aab75621. Prefix SHA: 24e1295b1a4665cd9a68530fbb88218e385d8654aacd914ab9e9dbd2ae4c72e0. Main fetched SHA remains e0985953a9a9dc53c99a60420ea3ce3e4cf762c5c53056e9a7dafc41397fe85f. Original processor bytes are retained as processor-original.js and instrumented bytes in the evidence source snapshot; both fetched pre/post bindings are retained in report.json. Application source files were not edited.

The source synthesizer uses its currentTime-derived block start to compute deterministic samples. The entry result can distinguish actual repeated-clock invocation from a skipped production callback, but it alone does not prove a fix, explain the browser's clock behavior, or establish audible harm. Native-control clock repetition without native sample repetition and its separate input zero-block anomaly remain distinct evidence. The thirty-minute seamless-output acceptance gate remains open.

Chrome, context, exact input tracks and temporary server closed. No ambient/default microphone or global routing change was used; permanent application URL remains http://127.0.0.1:5417/BongoPlanet/.
