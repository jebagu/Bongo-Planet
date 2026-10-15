# Bongo Planet — independent controller candidate03 review

**Disposition: BLOCK pending one cleanup correction.** The two candidate02 ordering faults are repaired, but the new claims-first ordering can prevent initial ownership discovery when the claim-file read itself fails. This is source-only review. No controller, controls, process inventory, signals, browser, receiver, or acquisition were executed by this reviewer.

The current bytes independently matched all four entries in `Root-Controller-Source-Checks-03.json` at readback:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| root-controller.py | 11,148 | 0a995c883c0b429b2bc1320993b9e98a6107aed485e17d54194c2afde47ea3b7 |
| root-controller-controls.py | 7,388 | 47d7857bfa5d4904b0b89aae40a6301aa101e36dd66d530739769045fb096e49 |
| Root-Controller-Plan.md | 3,234 | 9a45f037c80c98da19b7f5620991b37398fac7b487afb1aa72a9d2902f1a8c7d |
| Root-BufferedAmount-Semantics.md | 1,054 | 896b911911caca2389a8b314fa013b4799c538da2d2591cd7a37bfc9079d74c6 |

The retained ten-control result is `f1b9c1`, exit zero, simulated process tables/signals only. I read the entire current source, controls and Plan; I did not rerun the controls. The original candidate02 BLOCK note and exact source snapshots remain unchanged.

## Closed faults from candidate02

**C01: repaired.** A first main identity can be seeded only while `Popen.returncode` is unset. There is no poll/wait between that test and the identity adoption. After reaping, the main PID is removed before discovery, cleanup inventory, and final ownership filtering. An early terminal child without a recorded first identity explicitly fails. The new full simulated run retains a replacement PID and its child, requires zero signal attempts, and checks the unknown-initial-identity reason. This covers the previously missing root-identity sequence, rather than just reuse of an already recorded descendant.

**C02: repaired.** Claims are read before the inventory used to validate them. A claim arriving during that inventory is deferred to the next read and a later inventory. The new simulated run appends its claim after the first snapshot, then reparents the claimed live resource; the next read explicitly fails live ancestry and does not consume that claim. This is an honest unresolved-ownership failure, not proof that the unowned process was cleaned. Accepted claim prefixes are also compared byte-for-byte to reject shortening/mutation.

## C03 — initial claim-file I/O failure can destroy discoverable ancestry before cleanup

**Blocking; confidence 75.** The constructed sequence is at `observe()`'s first `claims_path.read_bytes()`, the precleanup `observe(publish=False)`, then group TERM before `cleanup_inventory()`.

1. The main successfully spawns a detached resource through an owned test worker. Main, worker and detached resource are all still present and would be discoverable from the unreaped main.
2. The first claim-file read raises `OSError` before `inventory()` and before the initial main identity is seeded. The `owned` map is still empty.
3. The exception enters forced cleanup. Its precleanup call to the same `observe()` encounters the same read error, again without taking a process inventory.
4. The controller sends TERM to the main process group. The detached process survives that group signal, while its worker parent can exit and the resource can be reparented.
5. `cleanup_inventory()` only calls `discover(rows, owned)`. It does not seed an empty map from the still-unreaped main. No detached identity is discovered or signaled, even if the root is still present; after reparenting its original ancestry is unavailable. Final known-owned filtering can be empty while that resource remains alive.

The overall run fails, which is correct, but the external controller has lost an avoidably discoverable detached resource. This is the exact evidence-I/O/cleanup composition the separate controller is intended to cover. The existing disk-failure control raises on controller-journal writes; the claims read still succeeds there, so that control does not exercise this sequence.

**Minimum correction:** read claims first for C02, but latch a read failure instead of immediately abandoning ownership observation. Independently inventory, safely seed/discover the unreaped main, then raise the retained read error before accepting any claims. An equivalent independent pre-signal ownership-discovery path is acceptable, provided it also safely seeds the first main identity and runs before group TERM. Add a pure control with an initial persistent claim-read error, a detached descendant, and an unrelated row; require cleanup of the verified descendant and zero signaling of the unrelated row.

## Limits retained

No other new blocker was identified in this narrow successor readback. The original review's conditions still apply: source/configuration/working-directory and actual helper claim publication need a later root preflight; force or unknown closure cannot pass; second-resolution birth signatures and snapshot-to-signal races are not kernel identity attestations; unobserved reparented resources remain unknown; the 80/100-second limits are cooperative and filesystem/scheduling delays can exceed them. Kind counts rely on the separately reviewed helper for distinct acquisition roles. No live cleanup or acquisition is qualified by these simulated controls, and S01-A43 remains open.

This note is bound only to candidate03 above. A subsequent correction requires its own source/control binding and review; it does not alter either earlier BLOCK record.
