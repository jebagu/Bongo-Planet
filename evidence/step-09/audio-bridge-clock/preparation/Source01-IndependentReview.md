# Bongo Planet clock Source01 independent source review

Disposition: **BLOCK for acquisition with this exact candidate.** Two concrete lifecycle/deadline paths can report a completed diagnostic without satisfying its declared checks. This is a source review, not an acquisition or acceptance result. No browser, service, audio, helper, test, original recording, or full input stream was executed/read for this review.

Bindings independently read from current bytes:

| Artifact | Bytes | SHA256 |
|---|---:|---|
| `scripts/output-audio-clock.spec.ts` | 40,976 | `8abe7e7290405775f4f4ec41ae9c5d4d9961f15950bb7b9e7c11ba450183044e` |
| `clock-contract01.ts` | 5,022 | `8611e2fe3a05cfc9b8a2c7883ef431b022f8f65cbe280fa0b37f399c87d93e46` |
| `Manifest01.json` | 18,232 | `b4ed4dff5d61bde3f1988159856403070c48fb0b024401e32e9827edba59873e` |

All 89 manifest entries independently matched their byte lengths and SHA256 values, totaling 1,338,503 bytes. The first binding-read command treated the manifest's descriptive `base` value (`repository root`) as a filesystem path and failed before verification; the corrected read resolved the recorded repository-relative paths and verified all entries. Neither command ran the helper. `SourceChecks01.json` retains 32 passing pure controls and a successful private strict compile; the earlier nullable-type failure remains preserved. Root separately reports shared typecheck `b1d6f5`; it is outside this frozen manifest and is not needed to establish either finding below.

Review depth: deep. The new helper is over 200 lines of substantive acquisition/protocol/lifecycle behavior when its long statements are expanded, with asynchronous browser/native boundaries, session matching, retained evidence and child ownership. Reviewed the full helper, pure comparison functions and controls, resource plan, ownership dependency, and relevant unchanged AudioAdapter disposal/callback paths.

## C01 — A processor fault during AudioContext disposal escapes the final browser certificate

Confidence 75; blocking measurement correctness. Helper lines 181–184 certify `cleanup.finalBrowserFaultFree` **before** awaiting `audio.dispose()`. `AudioAdapter.dispose()` disconnects the node and awaits `context.close()`, but does not clear `node.port.onmessage` or `node.onprocessorerror`. Its installed callbacks can still change adapter state and invoke the observer's wrapped `onState` while disposal is pending.

Constructed sequence:

1. The final observer read is clean, so `finalBrowserFaultFree = true`.
2. The next browser evaluation calls Pause and awaits AudioContext closure.
3. A queued processor error or `onprocessorerror` fires during that await. The original adapter callback sets state `error`; the observer latches `observerError`. This path need not throw a page error.
4. Context closure succeeds. The evaluation returns only the context state `closed`.
5. The helper closes the page without another observer/fault read. The stale clean certificate remains true and can contribute to `diagnosticPassed`.

The observer's `stopped` flag suppresses retained sampling/events, but does not disable its error latch; the missing step is reading that latch after disposal. Native pre/post-close checks correctly distinguish those phases and do not cover this browser-side path.

Minimal repair: retain a post-disposal observer/adapter fault snapshot before page destruction and require it, together with the prior snapshot, in the browser final certificate. Preserve any error latched while close was pending. Add a pure lifecycle control that injects the late callback between the clean pre-close read and fulfilled disposal, and rejects the otherwise clean result. A source successor can preserve all current numerical and acquisition limits.

## C02 — Awaited operations can cross the declared deadline and then take the success branch

Confidence 100 for the control-flow scenario; blocking resource-certificate correctness. The helper's first-emission loop (line 166) checks success before its five-second deadline. The fixed-window loop (line 168) checks the 125-second deadline only before awaited work. The final readback loop (line 173) checks only while more batches remain, followed by an unchecked final drain and analysis.

Constructed sequences:

1. The first-emission loop begins a drain/state read before five seconds. The awaited operations complete after five seconds and expose a running first-emission witness. The loop breaks before checking the expired deadline.
2. A fixed-window iteration begins just before `active.startedMs + 125000`, waits and drains across that deadline, and obtains the frozen window. The next loop condition is false, so no expired-deadline check executes.
3. A final awaited drain crosses the same fixture deadline with no further queued batch. No final fixture elapsed check precedes accepting/saving its analysis.

The per-operation timeouts, overall 35-second non-window allowance, and external controller do not establish these smaller deadlines. An overrun of one or two seconds can fit those broader budgets while violating the stated first-emission/fixture bound.

Minimal repair: check each applicable monotonic deadline after awaited observations and **before** accepting success; add a final fixture elapsed check after its last readback/analysis and before its completed result is committed. Keep the five/125-second values unchanged. Pure controls should cover a late success returned by an await, including the final batch with an empty remainder. These remain cooperative detected limits, not hard preemption guarantees.

## Scope that remains sound on source inspection

- The clock comparison preserves the actual `D - c - O` relationship, original eight synchronization samples and later independent passage/bracket evidence. Missing public-passage evidence stays absent; an unknown getter bias or effective engine-cursor relation does not become zero.
- The original trigger/receiver matching retains all relevant IDs and outcomes, separates post-window controls, and freezes a half-open expected window before the declared drain. Callback receipt time is not labelled acoustic onset.
- Actual loaded main-body evidence, served processor bytes and any observed processor response are distinct. The helper does not invent a loaded-worklet-body observation.
- Browser batch order, byte/count limits and ACK-after-append behavior are explicit. Receiver caps are checked before retaining a misleading wrapped prefix. Measurement callbacks call the original handlers once, including measurement-failure paths.
- Native faults are checked before and after native close; browser launch ownership and late fulfillment use the separately reviewed durable claim/closure machinery. These strengths do not repair C01 or C02.

Even after repair, this helper can only report the operational diagnostic it actually measures. `originalConversionGatePassed` and `qualificationPassed` remain false while the effective engine/public AudioContext relation and getter bias are unknown. No S09-A9, physical presentation, PCM onset, or milestone pass follows from this source review.
