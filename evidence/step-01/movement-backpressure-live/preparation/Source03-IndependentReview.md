# Bongo Planet — independent backpressure source03 review

**Disposition: BLOCK for a terminal-PID signaling path.** The late proxy-error completion defect B06 is repaired. Its newly strict certificate can now enter a catch branch after the proxy has conclusively closed; that branch still signals its numeric process group. No actual helper, controls, processes, signals, browser, sockets or services were executed by this reviewer.

I read the complete source02-to-03 helper delta, `proxy-cleanup03.ts`, its controls, Plan04, Source03-Review and retained source-control result. The selected `preparation-manifest-source03.json` is SHA-256 `3f249e4fe0e927945754007130e3ef2bfedc255ebceedc53283ec5303c7b257e`; all 28 entries independently match current bytes at readback.

Exact reviewed sources:

- Helper: `6ef318ec41ae1e5d32ffa7a8b5f2061c16f8063d1ec9a27898e3e49ae5a7053e`.
- Cleanup certificate: `3c2014dd099d866300f7b7fa6cef1eac8c6eede4a54b02f0bec9358f3b3d06e0`.
- Cleanup controls: `1744ec3ce9ac129476e6af23c100deac142c3d37c15342f7d64a7dafb322d3cb`.

The retained eleven pure controls passed in `aeff80`; shared global typecheck passed in `30ef3c`. These controls manipulate lifecycle fields and errors, without process or signal execution. They correctly distinguish a stop ACK/zero-exit prefix from complete process/stdio closure. They do not execute the live helper's catch/signaling branch.

## B06 is closed

The successor installs stdin/stdout/stderr close listeners immediately after spawn and joins all three with the child `close` event. Cleanup boundedly awaits both exit and that complete join. `requireProxyCleanup` requires exact true closure flags, code zero, null signal and an empty retained error collection. Faults are copied into the arm, propagated into `arm.errors`, rechecked before save, and rejected by the arm and outer success predicates. A zero exit can no longer certify an error-bearing result. The prior B01–B05 fixes, source/data/timing limits, source02 trace contract and production code are unchanged through the retained delta.

## B07 — terminal certificate failure signals a no-longer-owned numeric group

**Blocking; confidence 75.** Location: the proxy cleanup catch following `requireProxyCleanup(proxy.closure, proxy.errors)` in the live helper.

1. The proxy's process and all three streams close; `fullyClosed` resolves and the retained exit code is zero.
2. A previously latched late fault correctly makes the new certificate throw. A nonzero already-closed exit can reach the same catch.
3. The catch unconditionally calls `process.kill(-proxy.child.pid, 'SIGTERM')` whenever the old PID is truthy, although the process is known closed.
4. If the numeric group has been recycled by then, the signal can target an unrelated group. Even without reuse, it is an attempted signal unsupported by a live ownership witness. Marking the run failed does not make that signal safe.

This is separate from the external controller04's repaired process-identity checks: the helper sends this signal itself, outside those checks. No live PID reuse or erroneous signal is claimed to have occurred.

**Minimum correction:** do not signal after known process closure/exit. For a genuinely unresolved/live child, use its owned `ChildProcess` termination handle rather than blindly signaling a numeric group; leave residual descendant cleanup to the external controller's identity-validated inventory. Preserve certificate failure and every error regardless of whether a signal was needed. A pure control of the actual cleanup decision should show zero signal attempts for fully-closed late-fault and nonzero-closed outcomes, and retain failure in both cases.

The earlier Source01/02 BLOCK notes and exact snapshots remain unchanged. Controller04 retains its separate scoped source GO, but does not authorize this helper. After this narrow correction, a newly frozen helper/control binding and root's final source/assets/paths/quiet/ownership preflight are still required. All original conditional pressure-accounting, cooperative deadline, numerical voice-release and incomplete-ring limitations remain; S01-A43 is unchanged.
