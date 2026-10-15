# Bongo Planet — System Trace capability result

**Collection blocked; no scheduler attribution or native thread mapping qualified.** Exactly one recording was attempted on an owned idle Node process. It reported reaching its5s recording limit, then exceeded the configured finalization deadline while saving. The bounded collector watchdog expired and ultimately required SIGKILL. A separately authorized, once-only read-only TOC salvage failed because the retained partial trace lacks instrument run data. No recording retry, sudo, settings change, privacy bypass, product workload, product audio or browser capture occurred. Later retained logs show internal activity near the timeout; neither deadlock nor inactivity is established.

## Reproducible scope and retained evidence

`attempt-01/inventory.json` retains exact version/template commands and outputs: macOS26.5.1/build25F80, Darwin25.5.0 arm64, Xcode selected at `/Applications/Xcode.app/Contents/Developer`, xctrace16.0(17E202), Node22.20.0 at `/usr/local/bin/node`. System Trace and Audio System Trace are listed. Template presence proves availability to select, not successful collection.

The helper is `scripts/system-trace-capability.py`, copied exactly to `attempt-01/probe-source.py`; the benign target source is `attempt-01/idle-node.cjs`. The main processPID98023 owned one worker requested as `BPTraceIdle`; it performed only ordinary idle timers. Its reported Node `threadId=1` is explicitly not a Mach identifier.

Root acknowledged a quiet window before the recording. `attempt-01/recording-invocation.json` is an exclusive marker preventing a second recording. Actual argv retained in `result.json`:

```sh
/usr/bin/xcrun xctrace record --template 'System Trace' --attach 98023 --time-limit 5s --output <attempt-01>/raw.trace
```

CollectorPID98024 started at2026-10-11T22:27:11.801110UTC and terminated at22:28:09.899521UTC, exit−9. Stdout reports attachment, reaching the specified5s time limit, recording completion and saving output. No stderr or permission-denial message was emitted. The instrument's claimed5s acquisition is not independently verified by an exported run. The approximately58s collector lifetime includes startup/finalization and timeout cleanup; do not describe it as five seconds of total profiler overhead. The configured45s collector wait begins at command launch, rather than at a measured saving-phase timestamp. The cause of exceeding that deadline is unresolved; no permission conclusion follows from the timeout.

The partial directory `attempt-01/raw.trace/` is preserved unchanged, including table/store metadata. It is not a finalized, usable capture.

## One bounded TOC salvage

Root separately authorized one read-only export, at most20s. `attempt-01/toc-export-helper.py` and `toc-export.json` preserve the exact command and outcome:

```sh
/usr/bin/xcrun xctrace export --input <attempt-01>/raw.trace --toc --output <attempt-01>/partial-toc.xml
```

ExportPID98384 exited10 after1.972814s, with empty stdout and stderr `Export failed: Trace is malformed; instrument run data is missing`. No XML output exists. This was not another recording. No further export/recording was attempted.

## Cleanup and mapping limits

The owned Node and worker both exited0 after the graceful close message. During collection, live process inventory observed DTServiceHubPID98034 as a child of collector98024. `attempt-01/cleanup-verification.json` retains final checks showing helper98022, Node98023, collector98024 and observed service98034 absent. Ownership of that service is attributed to the retained earlier tool output, not reconstructed start metadata. `export-cleanup-verification.json` shows no xctrace export or DTServiceHub remaining after salvage. These checks establish observed owned-process cleanup, not all possible unobserved daemon lifetimes. Production bridge5418 and frontend5417 were untouched.

No usable TOC, scheduler rows, native-thread metadata or target-correlated execution/wait states were exported. Requested worker name and Node threadId alone cannot establish Node-worker→Mach-thread mapping. Partial storage schemas are not proof of complete scheduler event coverage. The previous receiver off-CPU-looking gaps remain compatible with several causes and cannot support a QoS, timer, GC or runtime remedy yet.

## Smallest justified next measurement

The initial proposal below was subsequently followed by the bounded PID-specific log read documented in `log-investigation/Result.md`. The final disposition and file proposal are in `Finalization-Handoff.md`; no further recording occurred.

Investigate **collector finalization**, before another product scheduling capture. The smallest next read-only step is a bounded examination of xctrace/DTServiceHub diagnostic/unified-log messages for22:27:11–22:28:10UTC, retaining exact query and failures, to seek an explicit save, exporter, collector or entitlement error. It is proposed, not executed here. The failed capture is retained; no unchanged retry is justified by this result.

If logs provide no explanation, root can separately consider an idle-target collector investigation with a bounded stack/state snapshot specifically during the reported saving phase. That would be a new causal experiment with a declared altered observation protocol, not a product gate attempt. Sampling the collector is intrusive and cannot qualify musical deadlines. A later successfully finalized System Trace must first demonstrate actual target-PID scheduler rows and a native-thread identity before recording the product or selecting a scheduling remedy. An independently authorized spindump timeline could alternatively test native thread/QoS visibility, but its sampled states do not replace complete scheduler transitions. No new measurement, permission change or remedy is authorized by this document.
