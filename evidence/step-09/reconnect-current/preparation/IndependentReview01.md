# Bongo Planet reconnect source01 independent review

**Disposition: BLOCK for candidate01.** This is a source-only review; no browser, receiver, helper, test, or acquisition was executed by the reviewer. A successor needs the final-fault checks described below and a separate review before any root-controlled actual run. This finding does not alter a production source or acceptance status.

## Exact candidate and evidence

- Helper: `e8178523c77518da4c79c32b5d347e2a7ac95a803a7aecb4474cbdb03b37e44b`, 24,139 bytes. The final readback uses the preserved `source/scripts/output-reconnect-current.spec.ts`; the working script was subsequently being corrected by its owner.
- `Manifest01.json`: `e956847618b1e8b22bc42968e2932d20f7d15b192009bf44af688c54bd4ebaa5`, 8,595 bytes. The initial independent readback matched all 42 manifest entries. These represent 40 unique paths: the two Source01 configuration copies each occur twice. The stated 473,907 bytes sum manifest entries, not unique files.
- Plan: `524296f03e9412c9a06502c853f36527da37802300a4dbb7b5d2878c54b4ded4`, 7,660 bytes; configuration: `7324454be53aa75c27fe869795d7466bb44e6143ee83e66f188ef2113c60cb00`, 535 bytes.
- `SourceChecks01.json`: `c3f0f2886ce44fba1869f1cf2229d7cf58186dada90d81cab340533b6ee88bfd`, 3,904 bytes. It records 23 passing pure expectation/source controls and successful global/private typechecks. These do not execute the browser scenario or the late-fault path below.
- Production NativeClock is `97c63e08014aed1ab9ee8c5cbf7166a4f33e0027fbb10f91b305fde32c30f173`; bridge is `e4014cac06d534fcaa24021609313d3c1f1082a7ab5dc2efa31487c626140614`; OutputAdapter is `70d3cb4326689f0348a86a5f1929ca0a3ff6b32d95be24a303944fac53763089`. The frozen copies permit review without treating later edits as candidate01.

## R01 — a native failure after the functional checks can become a successful report

**Blocking; confidence 100 (mechanically constructible from the helper and NativeClock).**

1. Initial connection, changed disconnected scene, reconnection, matching musical ACK, and newer native state all pass.
2. At helper line 94 the final rejection/music-record assertion executes, followed by two awaited served-asset requests. Browser cleanup also contains asynchronous waits after that assertion.
3. During this interval, a native clock calibration/admission/runtime failure can call `NativeClock.fail()`. This latches `failure`, records `reportedFailures`, poisons the worker and sends its close command. The bridge can retain a `clock-error` and evidence failure. The worker may still acknowledge close and exit with code 0.
4. Because this failure happened **before** explicit `NativeClock.close()`, it does not set `closeFailureReason`. `finishClose()` verifies acknowledgement, exit code, and close-time failure; it intentionally does not turn an already-latched earlier failure into a cleanup exception. A failed worker and a gracefully closed worker are therefore compatible observations.
5. Helper lines 98–105 retain final browser/native data but do not validate its failure fields or recheck final forbidden receiver rows. The success expression only sees earlier `scopedChecksPassed`, the helper error list, force flags, and closure booleans. All of these can permit `testPassed: true` despite the retained native failure.

This is an error-contract composition failure, not a proposal to change NativeClock's shutdown semantics. Cleanup must still proceed independently after a failure.

The same unchecked-final-witness pattern applies to a browser witness error/error-overflow or unexpected audio/event state latched after the last functional `browserState()` and before its cleanup observation. That observation is currently retained without reapplying the locked/no-music/error predicates. The final bridge record check also needs to reject late rejected, queued, onset, late-drop, and clock-error rows and latched drop/evidence-failure counters, rather than merely retaining them.

**Minimal successor:** validate and latch browser final faults and native faults before and after native close; distinguish expected `ready: false` after a clean close from failure; reject `failure`, `closeFailure`, `reportedFailures`, `clockEvidenceFailure`, nonzero drops, and forbidden final records. Require explicit final-fault-free certificates in the final disposition, while keeping all cleanup attempts independent. Add a pure control for functional success followed by pre-close native failure and graceful ACK/exit0: it must fail. Preserve a clean-close positive control, where ready becomes false without a fault. Add late browser/record-fault controls using the actual final predicate.

## Checks that did not reveal another source blocker

- The changed scene has the **same six-object count** as the initial scene but removes `forward`, moves stable ID `right` from vertex85 to10, and adds a distinct note at85. Exact node IDs, golden object IDs, and independently derived `normalize(3φ,0,1)` orientations make stale same-count state fail. The original six nearest-icosphere positions are not incorrectly replaced with exact cardinal axes.
- Each connection requires eight matched sync exchanges, one subsequent start, and exactly six ordered position sends, parent receiver positions and independently decoded OSC messages. Golden coordinate checks and full per-prefix counts prevent an ordered-subsequence match from concealing extra snapshot positions.
- Native acknowledgement is matched to the musical command sequence, and native observation must be newer than its applied mutation. Calibration receipts are not treated as musical ACKs; parent object state and native object count/epoch remain distinct evidence.
- Changes use the public edit surface while output is disconnected, followed by actual UI reconnection. The wrapper substitutes only the exact default bridge URL with a private ephemeral receiver. Native send is called once; it does not fabricate buffered amounts, manually tick the adapter, or fabricate snapshot data.
- The original main-script response listener is installed before navigation and requires one matching script body. Served-before/after processor bytes are a separate observation; the helper does not pretend to have observed an actual worklet body. The scenario remains locked and paused, with no active audio or musical delivery claim.
- The dedicated configuration requires a nonempty absolute `BONGO_RECONNECT_PLAYWRIGHT_OUTPUT` and uses it as the Playwright output directory. Evidence creation is exclusive. The root wrapper uses the matching evidence/output environment names and the separately reviewed one-browser/zero-proxy ownership contract. A future root preflight still needs fresh, absolute, disjoint evidence/output/journal paths.
- Durable browser claims precede readiness; abandonment/late fulfillment and independent page, context, connection, server and native cleanup are present. Root external containment remains separate. Polling, native/wire/raw retention and final report sizes have explicit finite limits. These are detected/cooperative bounds, not proof against an indefinitely descheduled host.

## Scope and remaining boundary

The intended actual can establish changed-state manual reconnect and its complete current position snapshot under the retained local/control conditions. It cannot establish automatic reconnect, active-source sound continuity, acoustic release, whole-loop clock mapping, Safari, or physical-output timing. Candidate01 has no actual result, and no original milestone or gate is passed by this source review. The prior controller source approval remains separate and does not override R01.
