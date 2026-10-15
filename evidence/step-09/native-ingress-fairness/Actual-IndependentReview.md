# Bongo Planet — independent actual ingress comparison

Disposition: the retained comparison supports the narrow production change to `allowSynchronousEvents: false`, with compression explicitly disabled and the existing native bounds unchanged. It demonstrates a parent-side acknowledgment service problem under this particular uncompressed position burst and its avoidance in the successor. It does not qualify movement backpressure, position freshness, musical deadlines, or physical output. Both reports correctly retain `qualificationPassed: false`.

This review reads the two closed acquisitions and their frozen sources. I did not launch either component, a worker, browser, service, test, or profiler. I independently checked source/GO bindings, complete command and trace ordering, serialized payload hashes and byte counts, all retained OSC datagrams, and cleanup records. Existing failures remain unchanged.

## Bindings and run boundaries

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `baseline-01/report.json` | 3,500,854 | `f9d7ffbb00c73de916bf5711649eb39624aaed57b038f6925b341952218f71c3` |
| `successor-01/report.json` | 4,630,374 | `a5c17ee8f3777fb858bf7829e1771a4188cf8eb366d5a036ec224ee18bea8874` |
| Prepared component | 13,019 | `447709ee2eb90b9e5d1e3a5128b0a9c1558ad9b3554728fcc58971f8e130f896` |
| Trace observer | 1,302 | `526d25838637a9dba1e847b806c7f0d7a8c0c1203bf73cb7283ef84849c2c95d` |
| Baseline bridge copy | 15,867 | `fb36ff59c15dd1116ad1fe01f9a411dfd6d9aeaa386f3c9b482648bc51cc4059` |
| Successor bridge copy | 15,868 | `2ce9c0b75fb31e8376f567c215f7635e7f075ce43fc51d7025ed25c5579ec03f` |
| Fixture | 424,399 | `2259ff02b13d877a73171dd80e9ef2bb9df42feeebdc58a57a5d3d17698882b5` |

All 59 bindings in each root GO matched the retained/current selected inputs. The two bridge copies differ only in the declared WebSocket synchronous-event boolean. Both explicitly set `perMessageDeflate: false`; the client also disables it, sends with `compress: false`, and records an empty negotiated extension string. The copied NativeClock/embedded worker remains byte-identical to `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173`. Native capacities and receiver semantics were not increased or replaced.

Baseline root GO is `085e43e676a386254c84655f85332b8739b906929821bacb6ccf93794d5859d6`; controller is `8aa055fe8c1e548bade8e427969fda1590e5b89312c91f0d352439df06791dbd`. Its sole child exited 1 (tool `a8d9e3`), controller elapsed 0.592925208 s. Successor GO is `6ba9331d08ce9dd81823ddb2a4ca355ddf290a092d4555a3f9326f8a5bd50b03`; controller is `d03b9a94261f037a2fb33473335cc51239c6636aa23afa70655dd896a011ac74`. Its sole child exited 0 (tool `639d33`), controller elapsed 0.592951375 s. These are separate acquisitions, not a retry of a changed threshold. Helper elapsed times were 0.179396208 and 0.267095125 s, respectively.

## Full denominators and independent byte readback

The fixed recipe is 94 initial commands (start, 92 positions, heartbeat), followed by 1,219 burst commands (1,200 positions and 19 heartbeats). Position sequences run 1–1,292. Both runs begin the burst with 92 objects and zero parent and worker unacknowledged commands/bytes, after the initial applied and OSC denominators have completed. Startup/calibration backlog therefore does not explain the baseline burst's starting condition.

| Retained observation | Baseline | Successor |
|---|---:|---:|
| Intended commands / send attempts / successful send callbacks | 1,313 / 1,313 / 1,313 | 1,313 / 1,313 / 1,313 |
| Message-enter / parsed / message-exit rows | 1,313 each | 1,313 each |
| Accepted position records | 866 / 1,292 | 1,292 / 1,292 |
| Retained raw OSC position datagrams | 156 / 1,292 | 1,292 / 1,292 |
| Applied-hook rows before cleanup | 94, then suppressed after failure | 1,313 |
| Final trace rows / charged bytes | 4,033 / 961,804 | 5,253 / 1,130,936 |

Every command's parsed payload matches its intended packet in order. Send callback indices are unique and complete and all errors are null. I recomputed each send's JSON payload SHA/byte count, checked message-enter byte counts, and found contiguous trace indices with nondecreasing retained Node and hrtime timestamps. Client send completion alone is not receiver admission or native execution proof.

The workload has equal packet recipes, order, coordinates, and relative timestamp offsets; it is **not byte-identical on the wire**. Independently generated absolute `sent` numbers serialize to different decimal lengths: baseline application payloads total 291,711 bytes, successor 287,007 bytes. This 4,704-byte difference and uncontrolled transport chunking are comparative limitations. They do not erase the directly recorded acknowledgment-interleaving difference, but preclude describing the experiment as an exactly byte-matched performance trial.

I decoded every retained OSC hex buffer independently of the production encoder: address string and padding, exact `,fff` type tag and padding, three big-endian Float32 values, and exact packet length. Every baseline retained position/raw packet matches the corresponding prefix of intended position order; every successor packet matches the full 1,292-position order. Object IDs and `/adm/obj/<id>/xyz` addresses match. Maximum Euclidean Float32 coordinate error against the intended doubles is 3.2946889533e-8. The successor's final 92-object state exactly matches each node's last intended object ID and double-precision position.

The baseline is not credited with a complete OSC denominator: 426 planned positions lack admission records, and 710 admitted positions lack retained raw receipt rows. Its 156 raw rows are a failure prefix, not evidence assigning those missing rows to packet loss. No complete post-failure UDP-drain certificate is present. The successor has no such missing or extra position packet.

## Recorded failure sequence and successor service opportunities

Baseline burst messages 95–1,313 run from Node 284.710292 to 334.341334 ms, a 49.631042 ms callback span. There are **zero applied-hook callbacks inside that span**: all 1,219 burst message callbacks occur without an intervening applied hook. The largest observed parent boundary counters are 787 commands / 262,026 bytes.

At message 882, the entry is still ready with those counters. The packet is position sequence 867, node `ingress-node-38`, object 39. Entry/parsed/exit times are 320.692625 / 320.697084 / 321.167875 ms; exit is failed with `Error: Native command count/byte capacity exceeded`. The aggregate cap is 262,144 bytes, leaving only 118 bytes; the incoming wire payload alone is 234 bytes and the native envelope adds fields. The count is far below 8,192 and the individual packet far below 196,608 bytes. The observed state and source therefore identify the aggregate unacknowledged-byte branch, rather than an individual-message or count overflow.

The receiver immediately fails closed: the clock error and rejected current admission are retained, followed by stale-session rejections. Records contain 866 positions, 432 rejections, two stops, one start and one clock error. No continued healthy session is inferred from successful client send callbacks.

**Applied-hook suppression must not be mistaken for worker inactivity.** Frozen NativeClock validates/decrements applied receipts but calls `hooks.applied` only while `!failureReason`. The baseline's 94 applied-hook rows are therefore a censored count after the latch. Its retained closing native tail reaches applied command sequence 881: mutation hrtime 975422048563083–975422048564916 ns, reported to the parent at 975422071866333 ns. A receiver-close release is also retained. This is positive evidence that native work had progressed while its parent-side acknowledgments were not being serviced during the synchronous ingress burst. It is not a complete independent history of all executed commands after failure.

In the successor, burst callbacks span 302.101375–398.636167 ms (96.534792 ms) and **1,217 applied-hook callbacks occur between the first and last burst callbacks**. The longest burst run without such a hook is three message callbacks; across the whole acquisition it is four. Observed parent peaks are five commands / 1,650 bytes overall, and four / 1,373 bytes during the burst. At the baseline's failing message number 882 the successor remains healthy, moving from one / 316 bytes to two / 649 bytes. Applied command sequences 1–1,313 complete in order; the last two hooks occur immediately after the last burst callback. The full-denominator checkpoint is retained at 405.072167 ms with zero parent/worker unacknowledged state and the complete 92-object result.

These counters measure the documented callback boundaries, not an invisible continuous maximum. The successor also takes longer to process the callback span. The supported improvement is service opportunity and bounded outstanding admission under this burst, not a claim that asynchronous delivery is uniformly faster.

## Cleanup is separate from the fixture

The successor's final applied-hook sequence **1,314** is the subsequent bridge shutdown stop, not an extra fixture command. It occurs at 412.576833 ms, after the 1,313-command completion checkpoint and normal client close. The retained native shutdown release/applied rows agree. Fixture OSC and command denominators must remain 1,292 and 1,313.

Both native workers acknowledge close and have exit 0 observed. Both final worker snapshots have zero objects, voices, pending triggers and unacknowledged commands/bytes. Baseline still has its original clock failure latched, and the helper correctly adds `Bridge/native cleanup AssertionError [ERR_ASSERTION]: Late native failure`; `cleanup.nativeClosed` is not falsely set. This is an unsuccessful component with observed resource closure, not a successful native-health result. Successor has no late failure and all three helper cleanup certificates are true.

Both external controllers report no forced cleanup, no controller errors, and empty `remainingOwned`; both resource-claim journals are empty as expected for this topology. Root's later sampled checks find each main PID absent and private HTTP ports 61208 / 62003 refused (`connectEx: 61`). These corroborate observed process/TCP cleanup; they do not assert arbitrary descendant discovery, independent UDP closure checks, or physical audio release.

## Freshness and qualification limits

The successor's full 1,292-position observed sent-to-receipt age distribution has p95 285.822250 ms and maximum 291.286208 ms. Its deliberately aged 1,200-position burst has p95 286.131417 ms; the 92 initial positions have p95 16.821250 ms. The full result fails the 40/60 ms freshness thresholds and says so. Baseline ages cover only its 866 admitted positions, with p95 283.967291 ms and maximum 285.587291 ms; comparing that selected prefix with a complete successor denominator as a performance victory would be unsound.

This position-only local component contains no musical onset, voice, real browser `bufferedAmount` congestion, producer 500 ms recovery witness, audio clock conversion, PCM, hardware output, or physical observation. It neither passes S01-A43 nor repairs the qualification of older failed browser/native captures. The parent admission failure in the prior proxy experiment remains a separate observation; this component supplies a concrete matching mechanism, not retrospective proof of that experiment's unrecorded callback interleaving.

## Recommendation

Proceed with the minimal production WebSocket-server option change to disable synchronous message events, explicitly retain compression-disabled operation, and retain all native admission/receipt/session/watchdog caps and fail-closed behavior. The measured causal chain is sufficiently concrete for that bounded repair: a valid burst is fully received, uninterrupted callback dispatch accumulates parent unacknowledged bytes despite worker progress, and yielding between ingress callbacks permits acknowledgment service and completes the same intended workload.

Treat source review and relevant existing control/epoch/cancellation/close regressions of the resulting production diff as a separate verification step. A single acquisition per mode, the timestamp serialization difference, shared host scheduling, logging perturbation, and uncontrolled TCP grouping prevent a universal capacity or scheduling guarantee. Keep all broader acceptance gates and the original failed artifacts unchanged.
