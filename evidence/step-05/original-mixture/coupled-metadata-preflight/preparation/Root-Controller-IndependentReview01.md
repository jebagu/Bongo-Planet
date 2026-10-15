# Bongo Planet metadata controller source01 independent review

**Disposition: BLOCK pending the narrow RSS terminal-race correction below.** This is source-only review of the wrapper; no helper, metadata scan, original recording, browser, process inventory, signal, test or acquisition was executed. The final metadata helper remains a separate review/authorization boundary.

## Bindings

- Controller:12,513 bytes, `5a47d9944dabf16d4ac1f22c1178aa2ed45b6b2f8a77f53803ad0113e3283170`.
- Controls:8,257 bytes, `31cf7f2b39363ae425f201464c5719b588bc539a3b7134feb47ce1f4e50f3164`.
- Plan:2,111 bytes, `2e1e5a700b5796273f3fba4ceff71fff5f49567001d6100a71acf27ae2d68e77`.
- Derivation:2,344 bytes, `439fbea8f78a41b26d59f807865b52e7388110267f941bc72b376dc435fefb7e`.
- Delta:5,967 bytes, `5db26a26317a6977bd068c49cfea34410f6aa56166b0dae7d2e9e5cb0abca77f`.
- Retained12-control output:111 bytes, `a86a150651d34bd22d6f7ab8b6ef734452b614e943f335c3fb44eb4b33c2d5c9`; root records c06cc7 exit0. These pure controls were inspected, not rerun.

The new behavior is more than a task-name substitution: it changes command/output contract, success topology and resource limits, and adds live child RSS observation. The previous observed ancestry/birth and failure cleanup algorithm is retained. Review focused on the new observer's composition with that lifecycle.

## M01 — zero RSS after child exit bypasses the terminal-race branch

**Blocking before this candidate's actual use; confidence75.** A mechanically constructible sequence is:

1. `observe()` takes an inventory while the exact unreaped child is still alive and owned.
2. The child finishes normally during `ps -p PID -o rss=`. The query can encounter a terminal/unreaped process with no resident pages and return numeric0 rather than a missing row.
3. `read_rss()` returns integer0. The implementation checks the exact Popen terminal state **only when RSS is None**, not for a zero/nonpositive reading.
4. It appends0 and calls `validate_rss(0)`, which throws. The wrapper records RSS failure and enters forced-cleanup disposition even though a `child.poll()` at that boundary would establish a clean terminal child.

The source sequence is definite for the supplied zero/terminal condition; the reviewer did not run a process to measure how often the host's ps presents that condition. The issue is a false acquisition failure and misleading RSS classification, not a false low-memory pass or an authorization to signal another PID. The intended distinction between unavailable **live** RSS and a terminal observation currently handles only one representation of absence.

**Minimal successor:** retain the raw unavailable/nonpositive observation, then classify it against the exact still-unreaped Popen handle. If the child is terminal, label the observation terminal/unavailable rather than a valid memory sample; if still live, fail. Do not normalize malformed or over-budget positive values into success. In particular, a positive RSS above262144KiB must remain a retained resource failure even if the child exits immediately afterward.

Add mocked full-observer controls for zero/None terminal, zero/None live, and over-budget retention/cleanup. The existing added test checks `validate_rss()` inputs only; the older ownership simulations mock a positive RSS and do not exercise this composition. No real ps/signal/helper scan is needed for these controls. Preserve source01 and its12 passing pure results as distinct preparation evidence.

## Checks otherwise consistent with the plan

The exact command is one `python3 scripts/coupled-onset-metadata-preflight.py --run --output-dir <output>` process, with the output taken from `BONGO_METADATA_EVIDENCE_DIR` and required to be absolute. There is no Playwright runner directory. The external claims file still uses `BONGO_MOVEMENT_RESOURCE_JOURNAL`; successful disposition requires zero proxy and zero browser claims. The helper is expected to create no child process, with final source review responsible for confirming that topology.

Main125s/total135s agree with helper120s plus terminal/report margin and a separate cleanup allowance. These are cooperative observed wall limits. RSS uses explicit KiB and the correct262144KiB threshold for256MiB. It is neither a peak certificate nor aggregate subtree memory. The helper's independent maximum-RSS check remains necessary. Each valid numeric sample is appended and maximum updated before threshold validation, so a positive over-budget observation survives in memory for the failure report;2048 retained samples bound that series.

RSS acquisition occurs only while `child.returncode` is None. Without another reaping call, the Popen child PID cannot be reused during that query. The existing precleanup/final-inventory paths remove a reaped main before descendant discovery. Claim read/write problems remain separate from already verified ownership, and the existing TERM/KILL/reap logic and observed-owned limits are unchanged. Unknown inventory or remaining resources cannot become successful closure.

Root must still supply fresh, absolute, disjoint controller-journal/claims/output paths, bind the helper and interpreter context, and fix the working directory for the relative script command. The controller does not itself prove pairwise path disjointness. Source binding reads occur before the child resource window; a future GO should bind the compact preparation/source files rather than accidentally adding unbounded original input reads to the controller. No original input or output directory is cleared here.

Inherited coarse birth-signature and inventory-to-signal race limitations remain; no hard real-time or exhaustive descendant guarantee is introduced. A wrapper exit0 would only describe its own observed ownership/resource outcome, not metadata integrity, complete anchor enumeration, waveform/onset evidence or qualification. No additional source blocker was found beyond M01.
