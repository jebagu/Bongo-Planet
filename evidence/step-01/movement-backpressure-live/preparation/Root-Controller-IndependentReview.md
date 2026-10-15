# Bongo Planet — independent controller source review

**Disposition: BLOCK the reviewed candidate for acquisition.** Two process-ownership ordering defects need correction and a separately bound readback. This is source review only: I did not execute the controller, its controls, a process-table probe, signals, browser, proxy, receiver, or acquisition. No acceptance result changes.

## Exact reviewed candidate

The original current files were read before root began corrections. Their preserved copies in `root-controller-source-02/` independently match every binding in `Root-Controller-Source-Checks-02.json`:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| root-controller.py | 10,317 | acbf3af49cbcd826f97113621690014b8d4964adf8e973960c8406e31fcfe83d |
| root-controller-controls.py | 5,371 | 1ca814c7ecfa3e7653f2a9f8f2e054af660a9c9c055c7f0b114f4248b6858858 |
| Root-Controller-Plan.md | 2,470 | 82a02e8b80872b65f65788796fbeec85e6ce8328ace3b1170e5b981c256bad08 |
| Root-BufferedAmount-Semantics.md | 1,054 | 896b911911caca2389a8b314fa013b4799c538da2d2591cd7a37bfc9079d74c6 |

Line references below address this preserved controller, not any successor at the original path. The retained record reports eight pure controls passing in tool `57dcc8`, plus an earlier read-only 1,012-row parser check in `92e7c5`. I read the controls; I did not rerun them. Their fake `Popen`, process tables, signal functions, and sleep establish simulated behavior only. Review depth was deep: a new approximately 230-line process controller crosses process lifecycle, PID identity, filesystem evidence, and cleanup boundaries.

## C01 — a fast-exiting main can cause an unrelated reused PID to be killed

**Blocking; confidence 75 (complete source-constructible sequence, actual PID reuse not observed).** Locations: lines 102–108, 146–152, 154–158, and 187–191.

1. `Popen` returns a main PID; that process exits before the first loop condition.
2. `child.poll()` at line 146 reaps it and returns the exit status. No main birth signature has been recorded.
3. The OS later reuses that numeric PID. The terminal `observe()` sees its new row and unconditionally inserts that row into `owned` at line 108. There is no original identity comparison and no check that the original child is still unreaped.
4. The unrelated process persists through the one-second grace interval, so the controller enters forced cleanup.
5. `live_owned` agrees with the replacement identity that the controller itself incorrectly recorded. The individual signal loop can TERM/KILL the replacement and any descendants adopted through it.

This is not merely the disclosed second-resolution `lstart` limitation. There is no original birth signature in this sequence at all. The eight controls test reuse of an already recorded parent, not initial ownership acquisition after the original main was reaped.

**Minimum correction:** acquire the first main identity only while the `Popen` child is known unreaped, without an intervening reap; never seed ownership from a PID after its `returncode` is known. An early exit before first identity observation must retain unknown initial ancestry and fail. Retire the main's numeric signaling eligibility after it is reaped. Add a simulated fast-exit/replacement-PID control that proves the replacement receives no signal.

## C02 — a newly claimed resource can be consumed as absent using an older snapshot

**Blocking; confidence 75 (complete ordering scenario, no live leak asserted).** Locations: lines 102, 110, and 122–129; terminal claim counts at 161–164.

1. `observe()` takes its process inventory.
2. The helper subsequently spawns a proxy or Chromium server and synchronously appends its claim, before the controller reads the claim file.
3. The new PID is absent from the older inventory. The controller permanently consumes the claim with `alreadyAbsent: true`, without validating live ancestry or taking a post-claim snapshot.
4. If the spawning parent then exits and the detached resource is reparented before the next inventory, recursive discovery cannot infer its original ownership. The already consumed claim is not retried.
5. Cleanup loses this resource's identity, while the kind-count certificate still includes the claim. It need not produce the Plan's required explicit unknown-ownership failure. This is especially relevant to the late-browser-fulfillment path the claim interface is intended to contain.

**Minimum correction:** validate each newly read claim against an inventory acquired after reading that claim, or keep it pending until a subsequent inventory. Absence from a pre-claim snapshot is not evidence of exit. If live ancestry cannot be established, retain an explicit unresolved-ownership failure and never silently count that claim as a verified resource. A pure interleaving control should make the first inventory predate a new claim and the next contain its live process; it must be owned and eligible for safe cleanup, or explicitly unresolved.

## What is sound, and what remains conditional

- The command allowlist, exact root authorization string, exclusive output/claim paths, source-byte/hash comparisons, and before-launch journal creation are useful admission guards. They still rely on root selecting the intended working directory, environment, complete binding set, and correct source/configuration. They are not a substitute for the later root GO and source02 harness review.
- For identities already established, recursive discovery requires a present matching-birth parent. `live_owned` rejects mismatched birth rows and zombies. Cleanup attempts claim processing, then independently inventories known descendants even after a malformed claim or journal-write error; the two full simulated controls exercise that separation. Main process-group signaling is guarded by the live `Popen` state, while detached processes use retained identities.
- Any forced path remains failure. A nonzero child exit propagates; unknown final inventory and journal-write errors fail. Releasing Python handles or reporting an empty known-owned map would not establish the absence of unobserved descendants.
- The 80-second acquisition and 100-second total are accurately described as cooperative checks. One-second `ps` timeouts, TERM/KILL grace intervals, and a bounded reap help. Blocking filesystem operations or host scheduling can exceed these targets; the final elapsed check detects an overrun but cannot undo it. This does not become an OS-enforced deadline.
- Second-resolution birth signatures and snapshot-to-signal races remain practical OS-identity limits. Unobserved reparented descendants cannot be safely guessed from a PID. Process-table failure or the 256-identity cap can limit detached cleanup; such outcomes must remain failed/unknown and require root inspection, not a complete-closure claim.
- The claim schema and byte/count caps are bounded, but kind counts alone do not prove four distinct validated resource incarnations. Source02's acquisition path must append one claim per acquired role, including late fulfillment. Prefix mutation/duplicate evidence must not be promoted into independent proof of both arms' ownership.
- No live acquisition or cleanup has qualified this controller. The prior movement Source01 BLOCK, all existing failed captures, real-congestion acceptance status, and broader audio/network/human gates remain unchanged.

Root was notified of C01 and C02 before this note was saved. Any successor corrections are outside the hash-specific BLOCK above and require their own retained source/control readback.
