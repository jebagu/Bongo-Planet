# Bongo Planet — copied native scheduling diagnostic preparation

Status: source-only preparation passed and root reports Astra source clearance. **No instrumented receiver, worker, independent heartbeat process, browser or profiler has been launched by this agent.** Execution remains coordinated by root after the workload is ready. This is an instrumented source-copy diagnostic, not receiver qualification or physical/audio evidence.

## Immutable binding

Reviewer-cleared harness: `scripts/native-scheduling-diagnostic.ts`, SHA256 **`2d1af318862d614ee5ea47b6f532e4828ce8cd7ee1bb3df898097431eea16932`**.

Prepared copies and manifest: `diagnostic-source/2d1af318862d614e/`.

| File | SHA256 |
| --- | --- |
| NativeClock.frozen.ts | `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173` |
| bridge.frozen.ts | `c24a37011f631df7a979b5c4010b1b96baa22b6799abae4c231c95246deec460` |
| worker.frozen.cjs | `345d132b3bd5e4f56c263b3fc4fb17a3919b1867df1e1c4203ff5fbe85df5696` |
| NativeClock.instrumented.ts | `5080ab7855839ffa0215d04a85fa194a9499efdfe887e7637ae9e9130f14656f` |
| bridge.instrumented.ts | `eb68fa9393a6b0b63416b8fa7fcb4fae783bbc0db01415149e018104886cdde5` |
| worker.instrumented.cjs | `ae030275ee58f8ba4ce21220306851f0ad410a799f31e177dadb646a683fd727` |

Hashes above come from the prepared manifest, not from a later reconstruction. Preparation requires exact frozen original hashes and asserts each of its 19 text insertions matches once. Subsequent harness versions get separate source-hash directories and cannot overwrite these copies. Production NativeClock and bridge were not edited.

## Source-only outcomes

1. First `--prepare --check` preserved copied sources at `diagnostic-source/` and failed parsing the injected GC helper because it had an extra closing brace. It exited1 before evaluating the worker or creating any worker/service. Those first copies and their original manifest remain unchanged. The repo TypeScript check passed at that stage; string-embedded JavaScript requires its own syntax check.
2. Corrected `--prepare --check` passed unique insertion checks and parsed both embedded worker and independent witness with `new Function` without executing either. It produced `diagnostic-source/2d1af318862d614e/`.
3. `npm run typecheck` passed for the current repo/harness.
4. Initial explicit copied-module TypeScript invocation exited1 with TS5112 because TypeScript7 requires `--ignoreConfig` when filenames are specified. It was a command configuration issue. The same explicit check with `--ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --allowImportingTsExtensions --types node` passed for both copied modules.
5. Source review addressed health-noise consuming the only incident latch: one first health-gap block and one first real late-drop block are reserved independently. Further incidents have counters and are not claimed captured. Independent tick overlay retains eight startup and eight closing causal origin brackets, their offset intersection/width and an explicit limitation that containment does not establish exact clock identity.

Root reported source clearance for the exact harness SHA above after this preparation. No runtime scheduling performance or failure reproduction has been established by these source checks.

## Coordinated startup and readiness

Root's intended command, only after execution GO:

```sh
npx tsx scripts/native-scheduling-diagnostic.ts --serve --duration=130
```

This binds the copied receiver on loopback **5423**, with private ephemeral UDP receipt port. It does not stop or replace the actual bridge on5418. A conflict on5423 fails startup; do not move it silently. The stable diagnostic UI is **http://127.0.0.1:5423/receiver**; the state endpoint is **http://127.0.0.1:5423/state** and producer WebSocket is **ws://127.0.0.1:5423/**. The original strict producer Origin **http://127.0.0.1:5417** remains required.

Wait for stdout `Diagnostic copied receiver ready: http://127.0.0.1:5423/receiver (not qualification)` and independently require `/state` to report `clock.mode === 'native-monotonic'`, `clock.ready === true` and no clock failure before workload Play. Readiness follows the unchanged native origin calibration and eight actual causal worker probes. The workload agent plans an init-time exact ws5418→ws5423 mapping only for its isolated frozen5417 app page; no production configuration changes are implied.

`/state` keeps the copied bridge contract: current session/object/pending/voice/drop state, last100 events, recentRows64 and native clock diagnostics. These sampled rings do not constitute a complete control denominator. The diagnostic's shared-memory incident rings preserve callback/timer/CPU/GC neighborhoods separately; no diagnostic read or disk write gates musical receipt ACK delivery.

There is no HTTP stop endpoint. Root can send SIGTERM to the exact owned harness process; otherwise duration130s initiates cleanup. Duration includes witness/receiver startup. The workload should complete its120s window and drain within that bound, and report any truncation honestly. Do not kill global Node/Chrome processes or the real5418 bridge.

## Evidence and limits

The harness creates a fresh directory `run-<UTC ISO timestamp with colons replaced by hyphens>/` under this diagnostic folder, then writes exclusive `report.json` after cleanup. It retains source manifest, raw hrtime records, independently bracketed CPU counters, GC interval/conversion/delivery witnesses, cross-process probes, exact heartbeat ticks, incident coverage/counters, final receiver state, failures and cleanup outcomes. The first preparation failure is separate from this future actual-run evidence.

Unchanged receiver policy: **5376 pending, 64 voices, 92 objects, 12s maximum future deadline, ±20ms actual execution, 10ms uncertainty, 500ms producer watchdog and 1500ms calibration budget**. IPC admission and receipt bounds remain intact; one receipt batch of at most64 rows/61440 bytes is in flight with a500ms ACK timeout. Diagnostic primitive rings are separate from this channel, with an explicit6MiB serialized retained-evidence cap and truncation reports. The instrumented paths necessarily add overhead; an absence of a failure would not erase the original s2-132 failure. No dropped event is retried, no intended timestamp becomes an actual timestamp and no deadline is fitted to observations.

Await root's coordinated execution GO. While any quiet capture is active, hold typechecks, preparation, tests, service/profiler launches, builds and large hashes until terminal cleanup is confirmed.
