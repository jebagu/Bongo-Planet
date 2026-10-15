# Bongo Planet — successor movement-pressure feasibility review

**Disposition: GO for bounded implementation preparation, with the constraints below. No acquisition GO and no A43 acceptance change.** The proposal describes a credible conditional experiment, not evidence that legal movement can cross the real browser threshold in the available heartbeat window. Actual01 remains failed.

Reviewed `Successor-Feasibility.md`,8,509 bytes, SHA256 `3f92b105b63a59a262a2edc712d9691d25164982aa3cfb73b2524275ae3a8090`, against the original helper/proxy/config/controller, current production sources, and retained diagnosis correction. Source reading only: no socket, browser, helper, process query, test, original stream or PCM scan.

Current bindings independently checked:

| Input | Bytes | SHA256 |
|---|---:|---|
| Original live helper | 44526 | `8f7e454b59a3b9110ac4da2b33daba59bd7cf45525fed38b3dd87557bbd22090` |
| Transparent proxy | 12184 | `b3417d9279f066513fe3580e9af774d0cbe780d6afabc4ffb8a19848fe4acd0b` |
| Isolated Playwright config | 738 | `4de79768089e19729d68dc68dcf226940ddee591e4b5989cf5aadb7cab87c5cb` |
| External root controller | 11444 | `8a9ec1e4cbe3bcaa004a067020723d5cc9be8d5388e74d308e812e01020ae537` |
| OutputAdapter | 8203 | `70d3cb4326689f0348a86a5f1929ca0a3ff6b32d95be24a303944fac53763089` |
| NativeClock | 28579 | `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173` |
| Bridge | 15619 | `e4014cac06d534fcaa24021609313d3c1f1082a7ab5dc2efa31487c626140614` |

## Real threshold and finite preparation

Stopping the proxy's actual reads can propagate TCP pressure to the browser; a small receive-buffer readback alone cannot establish when that happens. Neither approximately276KB of prior payload nor the1,024-byte accepted receive buffer proves a65,536-byte browser queue. The prior maximum21,318 was below the production threshold. Changing the acquisition to finish on a genuine `bufferedAmount > 65536` observation is sound; treating a longer sleep or a proxy queue size as that observation would not be.

Keep the original legal scene/IDs, disabled generator,91 sources and unchanged sentinels. Public relocations may occur at most once per20ms without catch-up. No payload padding, repeated reliable controls, fake bufferedAmount, forced private tick, timer-cadence change, threshold reduction or watchdog extension is needed or justified. The20ms registration supplies an upper intended cadence, not a guaranteed throughput or lower crossing time.

The2s outer preconditioning ceiling is an upper diagnostic bound only. It must terminate earlier on missing session/voice, native/parent failure, exhausted lease admission margin or another original cap. Freeze a complete count/byte envelope for startup, preconditioning, one bounded latest-state edit, post-resume settling and failure cleanup. The proposed9,200-call calculation is not the full acquisition denominator: existing startup/tail calls, trace wrappers, repeated snapshots and scene copies also consume the unchanged16,384-send/150-edit/byte limits. Exhausting those limits remains failure/incomplete rather than a reason to raise them.

## Drain has two watchdog clocks

The native worker expires the epoch when its own `now - lastHeartbeat > 500ms`; the bridge separately expires it when its Node performance clock exceeds500ms since parent receipt. Parent receipt precedes native application. Thus a native heartbeat-age margin alone does **not** certify the same margin against the parent watchdog. Current public bridge state does not expose its private `lastHeartbeat` value.

Treat the proposed150ms margin as a predeclared acquisition rule, not a guarantee. A successor should either conservatively bound the earlier parent heartbeat from retained causal observations as well, or explicitly call the margin native-only and require actual surviving parent/native session health through resume/recovery before passing. Do not manufacture a parent heartbeat timestamp from the later native application. Retain the exact same-domain observation time, worker-state freshness and mapping premise used for any age bound; recheck elapsed/deadline conditions after awaited observations and immediately before resume. A stale heartbeat value is conservative only when paired with a current observation-time bound and the same incarnation/session.

Without new delivered heartbeats,150ms native margin requires crossing before native age350ms; the earlier parent deadline may tighten that further. Consequently, a2s outer bound cannot rescue a failed sub500ms active-session drain window. Queued old heartbeats cannot revive an expired native epoch, and its8s voice does not override either lease.

After a timely crossing, immediately request real resume. Preserve the full criteria: observed low, all91 newest positions including unchanged sentinels, settled coordinates, stable IDs, ordered raw/receiver correspondence, healthy native execution, no stale/rejected positions, and bounded complete drain. A proxy resume ACK or browser low alone is insufficient. Stop unnecessary public edits before failure-path resume so cleanup does not keep generating backlog. The ingress fairness repair reduces one demonstrated admission failure mechanism; it neither establishes this margin nor promises successful congestion recovery.

## Sustain must separate sender and receiver actions

Preserve the original proxy's pause of reads in **both directions**. This lets the receiver's independently generated close/release remain retained behind the impairment while observing whether the unchanged sender makes its own congestion-close call. Do not drop, rewrite or selectively intercept heartbeat/control frames. Existing writes of already-read bytes may continue; retain both-direction pause ACK queues and subsequent writes, and update the last actually applied heartbeat rather than assuming the pause ACK was the last delivery.

The timer origin is the producer's cached tick time, not the after-send crossing timestamp or the first20ms sampler hit. If a position crosses mid-loop, the next unchanged-map item can initialize congestion with that callback's cached time; a crossing on the final item can defer initialization to a later confirmed callback. Keep the unique original callback identity, entry/exit bracket and declared timestamp allowance. If any observed same-socket before-send or original producer callback boundary is low before close, or the callback identity/last-item case is ambiguous, the original500ms-duration claim remains incomplete. Sampling alone cannot prove continuity. The tagged Chromium accounting premise remains a source/conformance premise, not installed-binary or kernel-queue attestation.

Require a genuine high while the matched native voice still exists, and retain a release before `mutationHrBeforeNs + 8e9`; using the later onset receipt timestamp would retarget natural expiry. The native worker self-watchdog can release before the sender closes, because its lease begins at the earlier delivered heartbeat. Report that timeline honestly. A parent-forwarded watchdog stop and a native self-watchdog release are distinct actors; their clocks and evidence must not be interchanged. An early receiver close reaching the browser, or a release before the observed high, cannot become proof of the sender's500ms congestion action. This is a numerical receiver-control witness; acoustic/physical release is outside the original live-control atom.

## Frozen successor review before acquisition

Implementation preparation may retain this experimental direction, but cannot consist solely of changing250 to2000 in the old helper. Existing250ms observation,320ms drain-request,350ms resume-ACK and fixed post-high40ms delay branches must be replaced coherently by the declared threshold/lease admission state machine. That is a future helper change, not a production timeout change. Preserve all per-session sequence, ring-overlap, late native fault, proxy final-stream certificate and ownership-safe cleanup guards.

The original external controller has80s main/100s total cooperative ceilings and expects the two fresh arm resource claims; the original helper/config have their own70/90/100s layers. Freeze their consistency for the successor. Keep the required absolute isolated Playwright output, fresh disjoint artifacts/claims, synchronous durable resource claims including late browser fulfillment, exact process-handle cleanup and root-owned residual descendant checks. Forced/unknown closure, late proxy errors, raw-ring gaps or trace caps cannot pass. Private5426/5427/5428 resources remain separate from permanent5417/5418.

The current proposal explicitly accepts no crossing, expired lease, incomplete timer brackets or resource failure as possible outcomes. With those conditions retained, no conceptual blocker prevents preparing a separate bounded successor. A reviewed source package and fresh root-controlled quiet authorization are still required before one actual attempt. The prior failed report and its timing correction must remain immutable, and A43 remains open until actual evidence supplies the original movement-pressure conjuncts.
