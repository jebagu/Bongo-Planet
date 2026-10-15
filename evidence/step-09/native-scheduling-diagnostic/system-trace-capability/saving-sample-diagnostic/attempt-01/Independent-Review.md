# Bongo Planet — independent saving-phase sample readback

The single saving-phase diagnostic acquired its requested stack sample, but the collector **failed the original45-second command budget** and required SIGKILL. This result does not qualify the partial System Trace, establish a deadlock, or explain any product scheduler deadline miss.

Readback covers the reviewed f0d74b6b source binding, `result.json`, incremental `events.jsonl`, bounded key stack sections, worker Review and retention manifest. Small-file hashes independently match the manifest:

- Result: `91f068bec3185dbe1ec61b84e1a4e4790c6bfa265d3464b9955e17776a951181`.
- Events: `20447a257337ec8d804977d7c92cf2cea76190412cae03c5b7e0c1ec517be443`.
- Captured source: `f0d74b6be706b184a63631f2532d966bc81181b4747d219f4694041de2511f69`.
- 220,303-byte sample: `a8262790fa50356ce36dce9fb46632b5b1d64ea76a4875eb0eed2bafd807f56f`.

Exactly one decision/sample launch is retained. Saving was observed at collector elapsed32.185670 seconds. The decision at37.261856 seconds records saving age5.076190, fresh owned PID/start/executable identity and7.738124 seconds left before the original budget. Sample PID8027 targets owned collector7928. Output-written text was observed about2.073571 seconds after launch; the final sample exit is0 and no absolute-four-second overrun was recorded. These are observer timestamps and requested sampling intervals, not exact internal phase durations or calibrated timing precision.

The collector received SIGINT at45.049887 seconds, SIGTERM at55.016654 and SIGKILL at58.035903, then exited−9. Overall diagnostic elapsed62.619984 seconds remained under75. Idle Node7927 and its Worker both exited0; sample exited0. The recorded final inventory is complete and empty for the observed owned lineage, including previously observed DTServiceHub7930. No production process was targeted. Unobserved detached helpers are outside that cleanup claim.

The raw sample identifies xctrace7928, version16.0/build17E202, macOS26.5.1. Key bounded observations agree with the worker review:

- Main thread14008635:748 observations under `Runner.runRecording` → `XRTrace saveDocument:saveCopy:error:` → `NSOperation waitUntilFinished` → condition-variable wait.
- Thread14010868:748 observations under AnalysisCore dictionary/concurrent enumeration, `dispatch_apply` and `dispatch_once` wait.
- Thread14010998:748 observations beneath the concurrent enumeration, distributed across varying AnalysisCore instructions, `XRUnionTimeRange`, page-pool allocation and `close`.
- Thread14011001:748 observations under `XRAnalysisCoreSpaceSealingOperation`, waiting for an operation to finish.

The main/sealing waits coexist with diverse sampled analysis instructions. This narrows the sample to save-related analysis activity and dependencies; it does not establish useful monotonic progress, completion likelihood, a wait-cycle deadlock, an OS scheduling fault, or exact CPU percentages. Aggregated stack counts are not elapsed milliseconds. Most internal AnalysisCore symbols are unresolved. The intrusive sample targets the idle collector, not the product worker; its1.7G footprint/1.8G peak must not be transferred to the product.

The existing retention manifest reports276 regular trace files totaling369,338,970 bytes, no file-mutation exceptions, and a peak observed logical trace size1,254,820,600 bytes. This reviewer inspected that manifest but did not rehash the369MB trace. Logical file size is distinct from allocated disk usage. The collector's partial trace remains unqualified: no export, usable scheduler-row proof, Mach-thread mapping, product causality or further probe follows from this review. Originals and prior manifests remain unchanged.
