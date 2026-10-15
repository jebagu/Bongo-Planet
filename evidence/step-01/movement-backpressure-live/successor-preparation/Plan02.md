# Bongo Planet — movement-pressure successor Plan02

**SOURCE PLAN ONLY, pending root and independent review before implementation.** This is a separate successor to the failed acquisition, not a retry authorization or an A43 disposition. Original helper, proxy, controllers, preparation/Plan02.md, snapshots and actual01 remain byte-exact. The frozen audio-clock Source01 is outside this task.

## Fixed ownership and implementation boundary

Proposed new helper: `scripts/movement-backpressure-successor.spec.ts`. Proposed new configuration, pure controls and source copies live only in this `successor-preparation/` directory. Reuse the unchanged byte-transparent `scripts/movement-backpressure-proxy.py` and reviewed ownership/trace/cleanup primitives by explicit source bindings; do not alter them. Permanent app5417 and bridge5418 remain untouched. The proposed actual uses the existing private proxy5426, ordinary native bridge5427 and UDP5428, checking availability only after a separate actual GO. No port check, process launch, browser, network or native startup is part of preparation.

Two **fresh sequential** arms, drain then sustain, each own one Chrome launchServer/connect/context and one detached proxy, with its own ordinary in-process native bridge/worker. Successful acquisition requires exactly **two browser-server and two proxy durable claims** in the root-created exclusive journal, no other claims, and independently confirmed closure between arms. There is no shared browser, second simultaneous client, extra heartbeat source or automatic restart. Claim/late-fulfillment/fault handling and the proxy process-plus-three-stdio closure certificate remain mandatory. Root owns the new external controller; it will derive from its current reviewed ownership implementation rather than modify the original controller.

## Exact operative time budget

All these are admission deadlines checked before an operation and again immediately after every awaited result, before accepting success. Timers are cooperative; the external controller is independent of the acquisition event loop but also subject to host scheduling. No hard real-time/preemption claim follows.

| Layer/stage | Fixed ceiling | Accounting |
|---|---:|---|
| Each fresh arm startup |20s|Native startup, proxy readiness, Chrome ownership/navigation/assets, eight original sync replies, genuine onset chain, generator-disable/full-scene edit and settled initial snapshot all share this one deadline.|
| Each impaired preconditioning arm |2s|Starts at completed both-direction pause ACK; expires earlier for high/admission, voice/session loss, fault, trace/send/edit cap, or native lease admission exhaustion. This is an outer diagnostic bound, never a heartbeat extension.|
| Drain recovery |1.5s|Starts at first accepted high witness, **including** edit-stop/one latest legal edit, immediate resume request and ACK, actual low, settled full snapshot and receiver/raw verification. No fixed40ms delay.|
| Sustain close/readback |1.2s|Starts at first accepted high witness; includes actual sender close, native release observation, stop edits, resume and final no-revival readback. No unconditional sleeping.|
| Each arm owned cleanup |10s|One absolute shared allowance for independent audio/context/browser/server/proxy/native/port-closure attempts. Per-operation timeout is min(original operation bound, remaining stage and global allowance); a late result cannot pass. Uncompleted attempts/forced or unknown closure remain failure.|
| Final asset/source/report binding |3s|After two closed arms, with checks against the same helper70s deadline. This is a maximum reservation, not an extension.|
| Helper total |70s|Absolute from test entry, includes all startup, acquisition, verification and cleanup. Two worst-case drain-sized arms:2×(20+2+1.5+10)+3=70s; sustain's1.2s tail leaves0.3s slack. Any used time before arm startup is charged to the same total and reduces later availability.|
| Playwright test / global |90s /100s|Unchanged historical layers; helper70s remains the operative acquisition bound.|
| Proposed external root main / total |80s /100s|Same allowances as prior controller, leaving10s between helper target and main termination and20s external cleanup allowance after main target. Root must separately freeze/review the successor wrapper.|

Outer caps do not compel later stages to start: insufficient remaining time fails, then independent owned cleanup is attempted within remaining allowances. A deadline/fault never prevents the controller from validating and cleaning already claimed ownership. No post-deadline result, inferred successful closure, timeout retarget or reused attempt directory is accepted.

## Complete finite traffic and evidence accounting

The fixed caps remain **150 public scene edits per arm,16,384 actual producer send records per arm,8MiB browser trace per arm**. Full-scene expansion with generator disable counts as one ordinary edit. At most100 preconditioning relocations plus at most one latest recovery edit are permitted:102 edits total, leaving48 unused; this is not permission to add control traffic. Initial public load is recorded separately. A single chained timeout schedules the next relocation no sooner than20ms **after** the preceding call; no catch-up or batched repeated edits. Every edit retains before/after and legal scene/ID disposition. The92-piece validated scene has91 source objects,89 relocated and the two unchanged long-note/node-9 sentinels; IDs, sound/settings and disabled generator are unchanged by relocations. The sole active8s note is established by matching original local trigger/onset, wire sound/triggerSequence and genuine native onset, not fabricated voice state.

The complete send envelope is enforced before each trace append, including prelude, sync/control/heartbeat, movement, recovery and cleanup:

| Phase | Maximum retained producer sends |
|---|---:|
| Startup/prelude/initial settled state |1,024|
| Paused-read preconditioning, through accepted high or failure |10,240|
| Drain recovery or sustain close/readback |4,096|
| Arm cleanup |1,024|
| **Total** |**16,384**|

These stricter phase reservations cannot enlarge the existing total. Nominal2s×50ticks/s×91sources=9,100 position calls is only a sanity calculation, not a promised actual denominator or a replacement for counted calls. Browser heartbeat, initial/full latest snapshots and cleanup consume their actual respective phase counts. Cap failure retains the prefix and still invokes the original callback/send exactly once; it never fabricates traffic or permits uncharged append.

All original per-category browser caps remain:4,096 samples,4,096 callback runs,16 timer registrations,16 closes,128 visible statuses and150 edit rows. Every row's serialized UTF-8 bytes, including scene copies, counts toward the shared8MiB browser trace before append. Original parent retention is bounded at256 rows per existing snapshot collection and shared8MiB per arm; requested parent observation cadence20ms yields at most100 preconditioning and75 drain-tail observations before extra final witnesses, but actual counts/bytes govern. Do not silently omit fault/voice/session checks because a retention branch is full. Complete final trace/report remains subject to original detected16MiB serialization cap. Native recentRows64 overlap, bridge/raw rolling limits, gaps/truncation and full ordered packet denominators are explicit; lack of complete required correspondence is incomplete/failure, not permission to increase production rings.

Unchanged proxy caps:65,536 bytes per directional queued pipe,8MiB combined retained raw bytes per arm,32,768 events,4,096-byte event/command payload,128 stdout ACK rows/65,536 stdout bytes/8,192 stderr bytes in the helper. The proxy's70s independent lifetime remains. Each module body has the existing detected2MiB cap. Resource journal remains8claims/8,192B, with successful exact4claims above. All counters include failure cleanup rather than reset to obtain new budget.

## Genuine high, native admission and unknown parent margin

Before impairment require exactly one positive local/parent/native voice, zero pending, the matched epoch/incarnation and no clock/error/drop/telemetry fault. Native natural end is **mutationHrBeforeNs+8e9**. Require at least4s conservatively remaining at impairment entry; otherwise fail before pause. Original deadlines are not shifted to a later onset receipt.

Pause real socket reads in **both directions**, preserving writes of bytes already read. Record pause request/ACK and both pipe queues, EOF/partial-write state. Browser movement begins only under legal declared edit pacing. Observe original socket bufferedAmount using ordinary send and callback boundaries plus the unchanged requested20ms passive sampler. Require an actual strictly greater-than65,536 read; equality is not high. Proxy byte counts/receive-buffer sizes/elapsed time cannot stand in for this predicate.

During acquisition preserve same local/native sessions and the sole voice. Clock readiness/failure, rejected/drop/onset/cancel/reset history, stale worker state, expired voice or trace gaps abort without retry. At each observation record the Node hrtime bracket and current authoritative worker observedHrNs/lastHeartbeatHrNs/incarnation. A state used for admission must be from the same incarnation/session, not future or regressed; use the current reader's conservative hrtime upper endpoint to calculate native age. Native margin≥150ms is a **native-only acquisition rule**, checked again after awaited browser/native reads and immediately before requesting resume. Do not call it a parent lease bound.

Current unchanged bridge exposes no private parent lastHeartbeat. This plan **leaves the parent watchdog margin unknown**; it does not infer parent receipt from later native application or invent an offset/drift allowance. A drain can qualify the actual outcome only if complete observations show the original parent and native session, positive sole voice and healthy state survive high→resume→complete recovery. An unobserved interval is labelled, and any observed release/retirement/fault rejects. The2s outer cap cannot salvage a sub500ms lease failure. Sustain also requires high before either observed receiver release or natural voice expiry; native150ms admission constrains drain only, not the subsequent intentionally sustained lease-loss observation.

## Drain state machine

On accepted high stop the chained edit schedule promptly; retain the exact latest scene and, if used, perform at most one declared legal latest relocation before resume. Recheck the native-only margin, epoch/voice, acquisition/tail deadlines and faults after the edit/observation; send resume immediately, with the original500ms control-ACK bound further limited by remaining1.5s recovery and70s global deadlines. A slow ACK may exhaust a lease and fail; it cannot be accepted merely because requested earlier.

Require actual socket low, no position send while actual observations remain high, and the automatically recovered **all91** latest positions, including both unchanged sentinels. Validate stable object IDs against initial objects, exact legal latest composition coordinates, within-epoch sequence independence/order, receiver positions and decoded rawOSC in their complete bounded delivery prefixes. No queued old scene may overwrite final latest state. Require finite/healthy current local/native state, same session, sole active voice, zero pending and no unexpected event/reset/cancel/release/rejection/drop. Resume ACK or browser low alone does not pass. Any lost ring/stream/final binding or unsupported interpolation/clock assumption remains explicit rather than upgraded to proof.

On failure stop edits **before** failure-path resume/close. Failure cleanup cannot become a recovery pass. A failure in drain ends the one acquisition and leaves sustain unattempted; do not open a fresh arm to rescue a failed experiment.

## Sustain state machine and timer interpretation

The fresh second arm again preconditions only actual legal movement. When high is accepted while the genuine voice/session still exists, retain both-direction pause until original producer congestion-close call is observed or the fixed1.2s tail fails. No extra control packets, user disconnect or bypass close is sent during this observation. Receiver may self-release earlier; preserve that actor's timeline without turning it into sender-duration evidence. Once sender close is observed, stop edits before resume and require bounded complete empty/retired no-revival readback.

Preserve unique actual producer20ms callback identity and entry/exit brackets. Mid-map crossing can initialize the production cached time at a later item in the **same** callback; final-item crossing requires the first later confirmed callback beginning high. The origin cannot be an after-send time or sampler hit. Retain the original±1ms declared callback timestamp/numerical allowance, branch/map-order witness, all before-send and callback entry/exit reads. Any actual≤65,536 read in the high→close interval vetoes continuity; ambiguous origin/identity or missing boundary makes the original500ms timer result incomplete. Requested20ms sample cadence with any leading/interior/trailing gap>50ms also makes it incomplete. This is conditional tagged-Chromium accounting/source behavior, not installed kernel or continuous queue attestation.

Native release must precede its retained before-mutation natural end. Native self-watchdog heartbeat→release is measured in native hrtime; parent-forwarded stop is labelled separately with parent age unknown. A close delivered from the receiver before an original sender congestion-close is not a500ms sender pass. Literal visible disconnect reason and actual close call, healthy final native state/no stale revival, final proxy fault/stdio closure and original late browser/native fault latches remain mandatory.

## Proposed pure controls and review sequence

After this Plan GO only: derive the separate helper/config with explicit unique source changes; prepare pure controls for exact cap/equality, high after expiry, native-only-vs-unknown parent margin, post-await deadline crossings, no catch-up/all-edit accounting, phase reservations/global byte cap, last-item/cached-callback ambiguity, boundary low veto, genuine singleton/release actor, missing full sentinel recovery and late cleanup faults. No process/socket/native launch on import or in controls. Existing original control semantics/thresholds are retained.

Freeze exact helper/config/control/source copies, full hashes/diff, controls including failures, one coordinated typecheck and independent source review. Root then derives/reviews its separate80/100 wrapper with exact4claim success, absolute fresh outputs and immutable production/runtime bindings. Only a later root exclusive actual GO may execute **one** acquisition; no automatic retry, timeout extension, traffic padding, fake getter, private tick, policy/threshold/cap change or gate upgrade is authorized here.

This plan relies on `Successor-Feasibility.md` and `Successor-Feasibility-IndependentReview01.md` and their retained bindings. Its experiment may still fail to reach high before either lease. That is a useful finite failed result, not a reason to redefine movement pressure or acceptance.
