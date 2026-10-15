# Bongo Planet — qualification clock analysis

This is a read-only derivation from the interrupted attempt. Raw derived numbers are in `clock-analysis.json`;633 deduplicated recorded render-clock ticks, with source provenance, are in `clock-ticks.json` and `clock-ticks.csv`. These are sampled observations, not every actual quantum.

The startup frame-to-wall offset was1791747585120.6667ms. The30 startup samples were emitted every8 quanta, all at blockIndex modulo8 equal0. Their signed residuals were−0.333496,0,+0.333252ms. Every recorded periodic tick likewise samples that same phase. This sparse phase coverage does not justify assuming other render callbacks have the same residual.

| Snapshot | Periodic clock rows retained | Context-time range | Observed signed frame/wall residual | Node-only uncertainty | Largest onset-worklet uncertainty |
| --- | ---: | --- | --- | ---: | ---: |
| Runtime start |256 |11.688–17.128s |−0.333496 to+0.333252ms |5.915526ms |0ms (none observed) |
| F01 interruption |229 |13.9067–18.7707s |−0.333496 to+0.666504ms |6.311766ms |8.645262ms |
| Capture cleanup |227 |14.248–19.0693s |−0.333496 to+0.666504ms |6.311766ms |8.645262ms |
| Subsequent idle failure |256 |24.552–29.992s |−0.333496 to+0.666504ms |6.433348ms |8.645262ms |

All adjacent periodic rows within these retained segments advance exactly1024 frames /8 process blocks, with callback-wall steps21 or22ms. Their median signed residual is0ms. No repeated sampled frame, sustained sampled offset shift, or backwards sampled wall clock appears. Inter-snapshot gaps remain unobserved.

The fixed Node performance-to-wall calibration began at performance195.369708–195.371333ms with wall1791747583740ms, yielding offset1791747583544.6294ms and bracket/coarse uncertainty1.0008125ms. Runtime maximum measured offset difference reached0.977783ms at interruption and1.099365ms before idle failure. That is not evidence of an equivalent continuous physical clock drift: coarse integer Date.now observations and the sampling bracket contribute. The retained independent host witness covers only the short producer-start window and showed maximum10ms-heartbeat slip1.603333ms and loop-delay maximum3.129343ms; it does not cover the later idle clock failure.

The module's conservative receipt budget is:

`initial Node-wall bracket/coarse uncertainty + maximum observed Node-wall offset change +1ms worklet Date.now coarse term +128/48000*1000ms full quantum + maximum every-quantum frame/wall residual`.

At interruption, the Node-only estimate is exactly1.0008125+0.977783203+1+2.666666667+0.666503906=6.311766276ms. The actual onset receipt carries8.645262370ms because the worklet observed a larger lifetime residual between emitted periodic ticks. With the maximum Node drift available then, that worklet lifetime residual must lie between3.000000 and3.977783ms; the actual base budget at the historical maximum was not logged, so the exact residual cannot be recovered. The sole onset's own callback residual is−0.333496ms. Historical maximum uncertainty persists on later receipts.

The actual producer sync uncertainty1.449999988ms combines with the receipt8.645262370ms to10.095262358ms, causing the requested unchanged10ms gate to stop the run after0.165591292s. The observed control error−0.315271139ms and real sample write remain valid short observations; they do not complete fixture acceptance.

After disconnect cleanup, the helper reports `Render callback mapping drift` at Node monotonic31.578890208s. That source branch follows checks for exact per-callback128-frame advance, nondecreasing wall time, and wall gap≤500ms. It therefore is not the repeated-frame branch at the offending callback. Its residual threshold, given the last retained budget, would require magnitude greater than4.233156ms. The actual fatal callback/frame/wall/residual was not retained, however; we cannot distinguish a brief callback scheduling excursion, an unobserved wall discontinuity under500ms, or another frame/wall relationship fault. Recorded periodic rows do not show sustained drift. No physical hardware limitation or specific host descheduling cause is established.

A justified next calibration change is to observe a bounded startup window at every actual quantum, retain each modulo8 phase's extrema, and choose a fixed center from that independently observed entire offset interval. That directly removes the sparse-phase assumption. Continue retaining every-quantum runtime extrema in periodic diagnostic rows and include exact offending callback/budget fields in fatal messages before clearing state. Preserve10ms combined uncertainty and20ms onset policy; do not fit the offset to product deadlines, discard inconvenient phases, or silently retry the same configuration.

A separate formal timing-budget review is also warranted: frame-to-wall offset is used to select an execution frame, whereas actual receipt time is computed from observed callback Date.now plus actual sample offset and fixed Node-wall offset. Calibration residual affects target selection and measured onset error; whether it also belongs in actual timestamp uncertainty must be justified from the observer equations, independently of whether removing a term would make this attempt pass. No term has been removed here.
