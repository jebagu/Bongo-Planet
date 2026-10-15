# Bongo Planet — receiver position invariance preparation

Status: source preparation only. No browser, receiver, UDP socket or test has been launched for this audit. Actual execution requires separate root GO after source review.

The proposed receiver is an independently owned, ordinary `createBridge(5424,5425,{nativeClock:true})`, using unchanged production sources. Port5424 is the temporary HTTP/WebSocket diagnostic service, with readable receiver URL `http://127.0.0.1:5424/receiver`; UDP5425 is its actual loopback receiver. Strict availability checks occur only on authorized execution. Permanent5417/5418 services remain untouched. The audit exclusively owns this receiver and its muted installed-Chrome process. It does not use the pending lifecycle coordinator.

## Independently specified cases

| Case | Independent expectation | Qualification scope |
| --- | --- | --- |
| Paused F07 initial snapshot | Six named objects match literal right/left/forward/back/up/down composition axes; raw OSC address and big-endian float32 values decode correctly. No camera transform enters XYZ. | Actual decoded object mapping/cardinal control transport. No spatial listening. |
| Identical legal moves at60/15/2FPS | Same sound-node ID and identical declared destination list at each FPS; validated occupancy, whole scene changes only that vertex. Three separated120ms shortest-arc moves are driven by browser monotonic deadlines, not rendered frames. Initial/current/final positions match an independent trigonometric oracle within the captured edit-call timing bracket. | Actual receiver freshness, IDs, final coordinates, monotonic progress per move; not venue interpolation. |
| Native UDP freshness | Every captured native position send has exactly one ordered actual UDP receipt, independently decoded from retained raw bytes. Conditional arrival-age upper bound p95≤40ms/max≤60ms under the explicit clock model below; separately retain actual sender interval gaps and moving-snapshot counts. | Distinguishes wire age from service cadence; neither intended timestamps nor bridge-admission timestamps substitute for UDP arrival. Sparse probes do not prove continuous clock stability. |
| Unsent rapid edits |100 synchronous valid alternating edits end at the declared final vertex. Native sends remain fewer than edits; settle snapshot is newest, stable IDs, and only the final committed scene survives. | Ordinary unsent movement coalescing subset of S01-A42. Does not induce or simulate bufferedAmount congestion. |
| Short real F01 fixed-position window | Real production engine, nonempty emissions and independent period/reach/quantization count; freeze audioEnd before a100ms normal-play drain, then Pause. Each in-window committed trigger ID appears exactly once in native onset receipts and matches its unchanged object/XYZ. Position and control sequences are independently increasing per epoch. | Scoped mapping/control independence corroboration for S09-A8/S01-A42; not their full two-minute F01/F04 gate or actual audio timing. Post-window receipts retained separately. |

Raw positions are captured by observing the existing native WebSocket `send`, retaining its before/after browser performance bracket and native bufferedAmount; only the constructor URL is mapped exactly from5418 to5424. Neither the socket buffer nor the adapter clock, timers, model, event stream or processor is simulated. The independent oracle does not import production interpolation, OSC codec, object hashing, engine scheduling or output adapter.

## Clock and completeness controls

The clock model is an explicit assumption: during this one browser navigation and ordinary receiver lifetime, browser `performance.now` and Node `performance.now` share a stable monotonic rate and fixed origin difference, with the declared1ms timestamp precision allowance. Sync probes observe compatibility at sampled times; they do **not** prove that an offset/rate excursion cannot occur between them. No unmeasured drift allowance is invented. All age upper bounds, and the combined producer clock bound, are labeled **conditional on this fixed-monotonic/precision model** in the report and row fields. Model geometry, bytes, IDs and receipt counts remain separately observable.

Independent sync probes retain t0/t1/server, raw half-RTT, and that1ms timestamp allowance. Each60/15/2FPS arm has its own fresh before/after probes, with browser send-bracket coverage and UDP receipt-bracket coverage asserted. Each compared UDP row retains the preceding probe age and following probe lead, measured directly within the receiver's Node monotonic domain, plus the raw probe records. The short F01 arm likewise brackets actual native execution timestamps; report arrival stays separate. Initial/cardinal positions outside an independent probe bracket are explicitly marked unbracketed rather than presented as continuously observed clock proof.

Startup, per-arm and closing offset intervals must overlap the producer's frozen chosen interval. The conditional bound around its unchanged chosen offset is the maximum distance to every retained independent interval endpoint; it must remain≤10ms. This bound is added to `(UDP arrival − packet.sent)` rather than silently fitting an offset to receipts. Native onset uncertainty and the conditional producer uncertainty are retained separately; their sum must≤10ms for any qualified short-control mapping case. No physical presentation assertion follows.

The receiver's complete in-memory records/raw arrays are retained directly rather than its rolling100-row HTTP view. Exceeding the underlying5000-row retention cap, the audit's8192-send cap,32MiB report cap, losing readiness, nonfinite clock values, unmatched/duplicate raw receipts or any producer errors fails the attempt. A100ms drain never changes the frozen window or removes an in-window expected ID. Initial/final served assets and exact source bytes/hashes are retained. Attempt directories are exclusive and never reused.

## Still open

S01-A43 requires actual >64KiB buffering, a latest full snapshot after recovery, and actual >500ms congestion disconnect/watchdog release. This audit does not manufacture the browser bufferedAmount or claim that a rapid-edit test establishes socket congestion. Existing `tests/output-sync.test.ts` contains clock handshake tests, not congestion semantics. Existing `tests/output-browser.spec.ts` has a separate source-adapter pressure test; its successful native-buffer evidence can be independently reread, but source-only/simulated congestion is not fresh actual receiver evidence. A root-approved bounded real transport congestion strategy is needed before that requirement can close.

S09-A8 remains scoped unless all required noncancelled controls over each full two-minute F01/F04 window qualify. Renderer/venue interpolation, actual audio onsets, physical presentation, perceived cardinals and non-Chrome browsers remain unqualified. No acceptance ledger or production file is edited by this audit.

Proposed limits:110s operation deadline,120s owned-browser watchdog, bounded cleanup and no automatic retries. No service launch until root/Astra source GO.

## Source revision controls

The first draft740d3d929a4bcc26512fd2d489022ee82661ee758f990fb31913545645458ecd remains unchanged in `source-controls/audit-source.ts`, with its original compiler observations. The correction changes only measurement labeling and adds fresh per-arm probe/context retention; it does not add a drift number, retarget deadlines or expand actual authorization. Revised source and strict typecheck observations are retained in a new exclusive revision directory. Actual audit remains not run.
