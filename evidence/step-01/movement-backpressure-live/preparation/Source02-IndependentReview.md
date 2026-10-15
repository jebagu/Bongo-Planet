# Bongo Planet — independent backpressure source02 review

**Disposition: BLOCK for one late proxy-error completion gap.** The five prior Source01 findings are addressed. This note is bound to the successor below; it neither rewrites the original BLOCK nor authorizes acquisition. No tests, sockets, browser, receiver, proxy, controller, profiler or live helper were executed by this reviewer.

## Binding and retained controls

I read the complete current helper, pure trace/claim/deadline helpers and controls, unchanged proxy and timer observer, relevant frozen OutputAdapter paths, Plan03 and Source02-Review. All **34 entries / 291,776 bytes** in `preparation-manifest-source02.json` independently match. The manifest itself is 7,700 bytes, SHA-256 `e007a3b516701b08faa2d546aa4e4a4555d3afaabde491a705cac7b4b20ddd63`.

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| scripts/movement-backpressure-live.spec.ts | 42,186 | ced6892f2fe8537750fd995afbbab5567a48b47851748566f8c13997e38f8d74 |
| scripts/movement-backpressure-proxy.py | 12,184 | b3417d9279f066513fe3580e9af774d0cbe780d6afabc4ffb8a19848fe4acd0b |
| preparation/trace-contract02.ts | 4,489 | 818f403e31f896d536161c85687cce66a8a6a1545a74a210b14c8a09f1d3ca79 |
| preparation/trace-controls02.ts | 4,615 | a7d8f7a284bf9d928c0a00f40ae2ec86c889a43fc286e5db5ab298965ffe17bb |
| preparation/timer-observer.ts | 984 | 00131cad68a7d2a790380c4dec2b3828370a8080e29dadfe5677c2573a3a3eff |

The retained result reports six proxy controls (`4bbe23`), eight timer controls (`c76039`), 32 final trace/claim controls (`1c780f`), and shared global typecheck `37c7df`, all exit zero. Earlier 31-control and sibling typing outcomes remain distinct. Pure controls use synthetic packets/process IDs and throwaway claim files, including an injected partial write; they do not demonstrate actual TCP backpressure, process ownership, watchdog timing or cleanup. The helper delta is 40 added / 32 removed physical lines, many densely formatted; process/session/clock composition warrants deeper review than this line count suggests.

## Prior findings closed in this successor

1. **B01, ordered session sequences:** `validatePositionEpochs` walks all sends in order, accepts fresh sequence domains only after a predecessor stop, rejects retired epochs and within-session duplicate/reordered positions, and does not discard the legitimate idle prelude. The runtime applies it to complete retained sends in both arms.
2. **B02, pressure continuity:** `continuousPressure` includes every retained same-socket before-send low and confirmed producer callback entry/exit low, including equality at 65,536. It also checks independent samples plus leading, interior and trailing gaps. An observed low makes the 500 ms claim ineligible. Under the explicitly declared tagged Chromium counter-accounting and synchronous-callback premise, a hidden low followed by a high requires an intervening observed send; its before-send low or the callback exit exposes it. Matching browser version metadata is not a reproducible binary attestation or continuous kernel-queue measurement. Missing/ambiguous producer identity or gaps over 50 ms remain incomplete.
3. **B03, deadline admission:** threshold and recovery observations recheck their original deadlines after awaited state returns; full recovery and sender-close readbacks are also checked. Startup/onset/heartbeat waits recheck the 20-second startup bound. A late observation cannot become timely through the old pre-await loop condition. Resource timing remains cooperative.
4. **B04, ownership publication:** the helper requires an existing empty regular root-owned journal outside the attempt directory. Proxy spawn and browser launch fulfillment synchronously append capped, fsynced exact claims before proceeding, including late fulfillment; claims reject duplicate PIDs and incomplete prior rows. Failed writes leave their evidence and fail the arm. The external root controller is a separate dependency: candidate04 received its own source GO, with practical identity/unknown-descendant limitations. A helper acknowledgement is not a substitute for that controller's actual retained inventory and cleanup disposition.
5. **B05, receiver health:** post-resume and final receiver states are retained then checked for native mode, readiness, failure/evidence failure, and zero drops. Empty voice/object state alone cannot pass. Post-close checks preserve native close/exit acknowledgements and reject late clock/evidence failure or drops. Source02 explicitly rejects stale traffic if it produces a drop after resume; it does not silently classify that as harmless recovery.

## B06 — a late proxy fault can be retained while arm completion still succeeds

**Blocking; confidence 75.** Helper `ProxyControl.fault()` and lines 169–172 form the relevant boundary.

1. The stop command's ACK resolves its waiter. The proxy's `close` promise subsequently resolves with exit code zero.
2. A process/stdio error or stderr data arriving after the stop waiter is settled calls `fault()`. It appends to `proxy.errors`; rejecting already settled readiness/waiters no longer changes the awaited stop result.
3. Cleanup assigns `arm.proxyErrors = proxy.errors`, so the fault can appear in retained evidence, but neither the completed proxy-exit branch nor the final arm-success predicate checks that collection.
4. If the process exit is zero and the other cleanup flags pass, the arm and outer helper can still report `completed-narrow-live-subsets` with a recorded proxy fault.

This is a completion-certificate propagation defect, not an assertion that a live fault has occurred. The proxy adapter explicitly treats these process/stream events as failures; they must not become diagnostic-only merely because they arrive late.

**Minimum correction:** after the bounded proxy exit/stream-close observation, require an empty latched proxy-error collection and propagate any errors into the arm's failure state. Require the successful proxy exit/cleanup certificate in the final completion predicate as well. A pure late-fault control can resolve stop first, latch a fault before terminal close, and show that zero process exit cannot certify success.

## Unchanged limits and scope

The fixed two-arm workload, 91 objects, public at-most-50 Hz edits, unmodified production send/getter values, 65,536-byte threshold and 500 ms policy remain intact. The proxy stops reads in both directions while already buffered FIFO writes may drain; retained boundaries and raw bytes must be interpreted accordingly. Six proxy controls cover pure FIFO/control behavior, not a live selector/kernel implementation.

The sole long voice is joined across local trigger/onset, wire trigger and native onset with explicit engine/receiver session domains. Its native natural end uses `mutationHrBeforeNs + 8e9`, not the later completion witness. Native self-watchdog and parent-forwarded stop remain separately labelled. Neither numerical release nor empty companion voice state measures acoustic output.

Caps remain finite and explicit: 16,384 sends, 4,096 sample/callback rows, 150 edits, 8 MiB browser trace and retained snapshot budgets, 16 MiB detected serialized arm total, 64-row rolling native history, proxy FIFO 64 KiB and raw retention 8 MiB, and 2 MiB detected module bodies. Native overlap gaps make the relevant evidence incomplete; the helper does not claim a complete native receipt history through every cleanup moment. Serialization/body/filesystem bounds are detected/cooperative and rely on the separately reviewed external controller for an independent process deadline.

Before any future actual GO, root must bind this helper's corrected successor, exact dependencies/configuration, the reviewed controller, fresh output/journal paths, source and served assets, and the exclusive ports/quiet window. Actual main response bytes are mandatory; fetched processor bytes plus the fixed main/source URL remain explicitly separate from an observed loaded-worklet body. `qualificationPassed` stays false; S01-A43 and broad clock/audio/human gates remain open.
