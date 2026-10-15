# Bongo Planet — independent backpressure source04 review

**Disposition: source GO for one separately root-authorized, bounded diagnostic.** B07 is closed by the ownership-safe termination decision; B06's strict final closure/error certificate remains intact. I found no additional blocking failure in this successor. This is permission to proceed through root's separate actual preflight, not a successful congestion measurement or an acceptance result. S01-A43 remains open.

No helper, control suite, test, browser, process, signal, socket, service or acquisition was executed by this reviewer. I read the complete source03-to-04 diff, the termination function and all eleven retained pure controls, the unchanged closure certificate, Plan05, source-control result and root's shared typecheck record. The helper diff has 14 added/deleted lines, excluding the new small decision module and controls. Although small, it crosses process-ownership and asynchronous cleanup boundaries; I traced terminal-error, early ownership-failure, late browser-fulfillment and unresolved-child paths.

## Exact binding readback

`preparation-manifest-source04.json` is SHA-256 `fe82816d32e2e9d898e34182771ac5cb319e00bcda9bd7bfa9bec39b55181078`. All 33 selected entries, totaling 178,351 file bytes, independently match their recorded lengths and hashes at readback. These are selected entries, not a claim that every file in the repository is covered.

- Helper, 44,526 bytes: `8f7e454b59a3b9110ac4da2b33daba59bd7cf45525fed38b3dd87557bbd22090`.
- `owned-termination04.ts`, 725 bytes: `1011ab83a1bc24ef1eeb281e6bf660e23fbe2af48e66e2ff2fdb4d16b92edfbb`.
- Its controls, 1,750 bytes: `b21aa2d20a1db1e0a7fdf269de11a4ce9ae286d5d632929c8c120fa9e2d3184c`.
- Unchanged closure certificate: `3c2014dd099d866300f7b7fa6cef1eac8c6eede4a54b02f0bec9358f3b3d06e0`.

Retained control run `b37d39` reports eleven passing pure cases, no real process spawning and no real signals. Shared global typecheck `2cf2bf` exited zero. `Root-Shared-Typecheck-04.json` accurately labels its hashes as read **after** that command; it does not establish an additional pre-command hash observation. I did not rerun either check.

## B07 closed; B06 preserved

The new decision calls the acquired `ChildProcess.kill('SIGTERM')` only when `closeObserved === false`, `exitCode === null` and `signalCode === null`. Any observed close, known exit, known signal or unknown/nonmatching identity field refuses termination. The helper no longer contains numeric-PID or process-group signaling. A synchronously checked live handle and its native child-process lifecycle replace the old numeric-group operation; residual descendants belong to the separately reviewed identity-checking root controller.

All four relevant sites use this decision: proxy claim failure, proxy cleanup failure, ordinary browser cleanup failure and late browser-launch cleanup failure. The browser close listener is installed before the durable claim and abandonment checks. On a cleanup exception, the ordinary/late browser and final proxy branches retain the attempted/accepted/error decision and mark attempted forced termination as a failure. Refusing to signal an already terminated child does not clear the original error.

In particular, construct the previous failure sequence: stop ACK, process exit zero, every stream closed, then a retained late stderr fault causes the certificate to reject. Source04 now records failed cleanup with **zero further signal attempts**. The already-closed nonzero-exit sequence behaves the same. The controls directly exercise both combinations using the real certificate and termination decision. They also cover seven closed/exit/signal combinations, an unresolved handle's single SIGTERM call and a throwing handle. These simulated controls establish decision behavior, not live PID-reuse or forced-cleanup success.

The strict certificate still awaits process/stdin/stdout/stderr closure, requires code zero and null signal, and rejects every retained fault. Proxy faults propagate into the arm; the certificate is revalidated before the final arm save and required by arm/outer success predicates. A signal refusal or a zero process exit cannot convert this error-bearing outcome into a completed diagnostic.

## Unchanged conditions and limits

The complete delta leaves the source02 fixes in place: per-session position ordering; all retained low-buffer observations invalidate the continuous-high claim; post-await admission deadlines; durable resource claims before readiness, including late acquisitions; and post-resume native health/no-revival checks. It leaves source03's closure/error defenses in place. Pressure thresholds, timer bounds, event/control handling, production sources, original fixed two-arm workload and numerical voice lifetime are unchanged.

The root controller remains a separate prerequisite: reviewed source04 `8a9ec1e4cbe3bcaa004a067020723d5cc9be8d5388e74d308e812e01020ae537`, with its independently retained GO note. Root must freshly bind the helper/controller/dependencies/configuration and served assets, exclusive output/journal paths, private ports and quiet execution before any actual launch. Helper timeout paths alone do not prove descendant absence or an unconditional wall-clock bound. Unknown or forced cleanup remains a failure.

The buffer-continuity inference remains conditional on the retained Chromium/WebSocket task-accounting premise; tagged source and installed version are not reproducible binary attestation. Requested sampling and callback brackets are not continuous kernel-queue measurement. Ring gaps, ambiguous timer origins, missed activation/pressure windows or failed cleanup must remain incomplete/failed. Native voice state is numerical control evidence, not physical audible release. Loaded processor response-body observation remains absent and is not invented by the main/source/served-processor binding.

The earlier source01–03 failures, BLOCK notes and snapshots remain unchanged. This review makes no acceptance-ledger change and does not relax any gate or authorize a retry.
