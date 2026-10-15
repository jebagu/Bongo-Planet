# Bongo Planet — System Trace finalization handoff

**Configured finalization deadline exceeded; collection remains failed.** One owned idle-process recording reported reaching5s acquisition, then exceeded the45s collector wait while saving and required SIGKILL. That wait begins at command launch, not an independently timestamped saving-phase start. A once-only TOC salvage failed with missing instrument run data.

The bounded PID-specific UTC log query exited0 in1.99s and retained697 entries/854,834 bytes. Internal messages continue near the deadline; there is **no established deadlock, inactivity, permission cause or collector remedy**. No scheduler rows or Node-worker→Mach-thread mapping qualified. All observed owned processes exited; product services were untouched. Original raw trace and query/recording outputs remain preserved. `finalization-manifest.json` links the exact sources, commands, outcomes and limits.

Already tracked: scheduling `Plan.md`, `Preparation-Review.md`, both diagnostic source-copy generations and `scripts/native-scheduling-diagnostic.ts`.

Proposed new tracked files: `scripts/system-trace-capability.py`; this capability folder's compact Markdown/JSON records; idle/helper/query source copies. These are currently untracked. No staging or commit was performed.

Proposed local retained evidence: `attempt-01/raw.trace/` (251 files,13,361,014 bytes), preserved for candidate archive inclusion. No broad deletion or ignore change was made. Other agents' untracked workload/receiver raw files were observed but are outside this proposal.

Before another collector measurement, retain acquisition/postprocessing phase timestamps and bounded file-growth/process-state evidence. A longer finalization budget would be a new hypothesis, not a proven fix. No test, profiler or recording is authorized by this handoff; await root GO.
