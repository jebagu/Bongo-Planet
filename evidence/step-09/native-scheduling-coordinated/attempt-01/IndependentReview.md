# Independent coordinated native diagnostic readback

This is a completed **instrumented control diagnostic**, not a new receiver, audio or physical qualification. The coordinator reports completion with no errors and `qualificationPassed:false`. Earlier failed F01/native runs and the earlier client cutoff remain unchanged.

Readback binds [report.json](report.json), SHA-256 `fed6b842816889f2899ab7a44b5c049b12b8ccd76432795c4c62eaec36dd654b`; [client/report.json](client/report.json), `81825b8593beca07c580e2bfbc452f3e0bd7a2693772c2bca45fa6155a59f700`; and [receiver/report.json](receiver/report.json), `5c49351da4fd60527c065bf3e1c832bf9af00d84aaef4ccff3e61607f6df2e03`. The retained client source hashes to the reviewed private copy `60f3de9645bdfff1d96f9ac7ede2b3cfc125d1bedf4420d03bbf96e8941d2550`; the host binding is `572e09d377b6ca49808bfc9a745d6a39d7d06dcba73877e827e9b3f68cd7b1be`. The frozen2d1 manifest matches `b40c424f67c87d328341c5db3129dc684bec417eb65d0d0caad485f428086cae`. Before/after served main d8040f40, processor0f0b12c9, F01 fixture and HTML hashes agree. No browser, service, timing probe or replay was launched during this independent review.

## Window, identities and complete control denominator

The first logical emission remains **0.2506666666666672 seconds**. The fixed audio end is exactly that epoch plus120 seconds: **120.25066666666666**. The terminal observed audio clock reaches **120.28266666666667**. The independently recomputed controller interval is **120.007460458 seconds** on its Node clock and **120.01080000007153 seconds** on the browser performance clock. Neither is obtained by subtracting clocks across processes. All241 retained snapshots keep the same running engine session `s2`, connected receiver session `4ffba808-9ae7-4a31-b48c-93e8ac94e900-s2-4`, ready native worker, zero receiver drops and zero reported audio/engine/telemetry drops. The two session domains are correctly distinct throughout the handshake and final report.

The unchanged F01 period is2 seconds, with three eligible targets per cycle. The60-cycle fixed window therefore requires **180** controls. Full retained event rows contain:

| Row type | Count |
| --- | ---: |
| queued | 183 |
| onset | 180 |
| position | 13 |
| start | 4 |
| stop | 8 |

The180 onset IDs are exactly `s2-1` through `s2-180`, each once, with60 each for near/far/kick. The extra queued IDs181–183 belong to the next emission and future arrivals beyond the fixed window; they are not removed from an in-window denominator. Producer stop leaves no session, object, pending work or active voice. Native cumulative counters agree on180 onsets and zero late drops. All388 retained events and13 rawOSC rows fit the unchanged retention bounds with no reported ring-overlap loss.

## Timing and object readback

For every onset this reviewer independently recomputed `(actualHrNs−intendedHrNs)/1e6`, hrtime-to-Node conversion, the supplied pair bounds/width, exact pair age, mutation bracket and receipt-after-execution ordering. Every pair precedes execution; maximum observed pair age is655.196834 ms. Each receipt matches its queued intended time, correct generator/node, stable object and topology XYZ. No receipt is marked as arriving after cancel/stop.

| Statistic over all180 actual callbacks | Median, mean of middle pair | p95, nearest-rank | Maximum |
| --- | ---: | ---: | ---: |
| Absolute callback error, ms | 0.947104 | 1.971083 | 10.067833 |
| Absolute error + retained producer/native uncertainty, ms | 2.009313512 | 3.034376012 | 11.131126012 |

Errors are positive, from0.052208 to10.067833 ms. Producer uncertainty is1.050000011920931 ms, retaining the1 ms timestamp allowance; maximum native uncertainty is0.013293 ms. The second row adds these bounds per receipt before taking the percentile. Maximum report-arrival lag is2.6652500000068358 ms and is not substituted for callback error. These bounds concern the declared browser-performance/Node/native control clocks; the browser audio-to-performance conversion and physical presentation remain separate open boundaries.

The13 original OSC byte strings were independently decoded as aligned OSC strings plus three big-endian Float32 values. Their ordered object IDs and coordinates exactly match the corresponding position rows after Float32 conversion. This proves the recorded control/object consistency, not speaker direction or acoustic output.

Event-file SHA-256 is `d35f33f08615004f9e37db5f85853f7bc6822e0a6e884a6738de5ce1dc160f19`; rawOSC SHA-256 is `dbdeeb078495df412693ea75bb249efb086379f3da8bcb3606319754cd4398ff`.

## Diagnostic retention and closure

The service records zero late-drop and zero health-gap incidents, no diagnostic record errors/inconsistencies and no final serialization truncation. Its event ring intentionally retains only the last8192 of58,870 rows;50,678 older phase rows were overwritten. Likewise10,936 independent witness ticks were observed but only the final2048 are retained absent an incident snapshot. These bounded rings must not be described as complete per-phase/per-tick traces of the entire run. The complete control denominator comes from the separate retained event file and counters.

All16 startup/closing witness probes produce the independently recomputed relative-origin interval **[-12,709,+127,625] ns**, width140,334 ns, containing zero. This is a causal bracket, not proof of exactly identical clock origins. With no corresponding late incident in this run, it assigns no cause to earlier late callbacks.

Coordinator trace preserves readiness, matching client start,120-second completion, client cleanup, explicit service stop and service cleanup in order. Client12941 and service12938 exit0 without signals; their detached groups are recorded absent. Chrome12943 closes without forced termination. Witness12940 acknowledges its final report, exits0 and is recorded absent. Native worker acknowledges close and exits0; final queues, voices, objects, receipt bytes and unacknowledged counts are zero. The coordinator completes in122.948851166 seconds, below its200-second detected acquisition cap. These are checks of the owned resources, not a machine-wide absence claim.

The new lifecycle coordination removed the prior startup-offset censor for this one run. It did not change20 ms/10 ms/queue/voice/lease policies, prove that scheduler delays cannot recur, qualify a full production F01/F04 pair, establish an OS cause, or supersede the original failed qualification evidence.
