# Bongo Planet — independent movement-backpressure attempt01 readback

**Disposition: FAILED; S01-A43 remains open.** The first arm did not observe the real browser buffer exceed 65,536 bytes in its declared acquisition window. The failure path resumed the proxy, after which the native receiver separately failed its command-admission capacity guard. The planned short-pressure recovery and sustained 500 ms sender/watchdog measurements were not completed; the sustain arm was never attempted. No cap/threshold change, automatic retry or acceptance upgrade follows.

This review reads the retained source, JSON and raw TCP/OSC bytes only. I did not run the helper, tests, browser, receiver, proxy, replay or another acquisition. I own only this review note.

## Bindings and lifecycle

`report.json` is 7,035,033 bytes, SHA-256 `3384429713f09c9d6cdbf3411555d00ddecf6aedfd82e765218c59e32ff50e8c`. All 68 entries in the actual root GO independently match their recorded lengths/hashes. The retained helper copy is 44,526 bytes, `8f7e454b59a3b9110ac4da2b33daba59bd7cf45525fed38b3dd87557bbd22090`; proxy is 12,184 bytes, `b3417d9279f066513fe3580e9af774d0cbe780d6afabc4ffb8a19848fe4acd0b`. Source05's explicit output directory is included in the actual binding; the failed run did not use the old shared-default config.

Root GO is 18,834 bytes, SHA `9ce939d63f0278a4f5e42aa5455f547c798d54eac1b56053ce93501c06c728c9`. Controller report is 10,553 bytes, SHA `3dc39325678d438f9d8d90aab0869e3cf4c92748f4b14d326a8fff10ae743c41`; its GO hash and command agree. The actual command ran once, session 26149, terminal `bc16ca`, exit 1. The controller records 5.679901625029743 seconds, 04:13:17.034719–04:13:22.714705 UTC; the helper records 4.165279791 seconds. These are different timer scopes, not contradictory durations. The runner records one unexpected failure, no successful/flaky case and no retry.

The genuine page-main response and separately served-before main both have 697,116 bytes and hash `32b57ff2dabeadc3d85f8143cd91c50abeea9785ebb1a2f35497ee1db198bb93`. The served-before processor has 105,473 bytes and hash `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`. No genuine loaded-worklet body or completed served-after observations are inferred.

## What was actually exercised

The prelude retains exactly one matching local trigger, local onset, wire trigger and native onset for `long-note`. The local trigger/onset objects agree, with 440 Hz sine, duration 8 seconds, level 0.1. Wire and native identities join the explicit engine and receiver domains. Native callback error is 1.085125 ms with reported conversion uncertainty 0.004333 ms; that single prelude value is not a sustained timing qualification. The native natural end equals the original `mutationHrBeforeNs + 8e9`, with 7.78897475 seconds remaining at admission.

The legal public edit scene contains 92 distinct pieces on all 92 distinct vertices: a disabled generator, 91 sound nodes, and the original active note. Twelve retained edits preserve settings, IDs, vertex exclusivity, generator-disable state and fixed vertices for `long-note` and `node-9`. Successive edit starts are at least 23.100000024 ms apart; the longest recorded edit call is about 5.100000024 ms. This is real finite edit traffic, not fabricated socket buffering or private adapter ticking.

The browser trace contains 1,316 sends: 8 sync, 4 starts, 17 heartbeats, 1,283 positions, 3 stops and one trigger. It retains 95 buffer samples, 102 observed original interval runs, 12 edits and no witness error. The largest recorded before-send buffer is 21,081 bytes and after-send buffer 21,318 bytes; sampled buffer maximum is 52 bytes. `firstHighSend`, `firstHighSample`, crossing and first-high run are all absent. None reaches the 65,536-byte threshold. These observations establish threshold non-acquisition within this attempted window, not a universal impossibility of pressure on this host.

The final in-loop threshold observation is at 247.712833 ms after the Node pause acknowledgement. The loop's next boundary exits without a high observation, explicitly resumes the proxy and throws `True bufferedAmount threshold not reached within acquisition budget`. No complete pressure-origin bracket, 91-object recovery certificate or sustained sender-duration result exists.

## Independent raw transport and denominator checks

I reparse the complete TCP captures independently of the harness, separating each HTTP upgrade header and decoding every WebSocket frame, including masking, extended lengths and complete payload boundaries.

- Client→upstream: 318,790 bytes, SHA `156d5bb96ac0110e8961e70c7599e612ce30be4f9557fa56f130177a30e27973`; 502-byte handshake header, 1,316 masked text frames and one close frame. All 1,316 parsed JSON messages equal the full retained browser-send packets in exact order. There is no partial frame tail.
- Upstream→client: 722 bytes, SHA `3db5331f417656eeb83e0d1cd2a712a2fe627b43453ec005b5d3254051077627`; 129-byte handshake response, eight unmasked text responses and one close frame, with no partial tail.

All 205 proxy event indices are contiguous and their own monotonic timestamps are nondecreasing. Pause and resume acknowledgements are adjacent original events, so no proxy read/write was logged between them. The acknowledged paused interval is 253.719041 ms in the proxy's clock; the corresponding Node acknowledgement interval is 253.874792 ms. I do not subtract timestamps across those domains. At both ACK boundaries, the two pipe counters are identical with zero queued bytes. The first post-resume write occurs 0.266042 ms after resume in the proxy's own clock. This demonstrates resumed forwarding, not a drained/congested sender certificate.

The complete raw lengths equal each direction's summed read and write bytes and its final boundary counters. The proxy's largest retained internal queue is 16,384 bytes, below 65,536, and no poison/partial-write flag is set. Reported socket receive-buffer readbacks are 1,024 bytes for listener/accepted client and 9,216 for upstream. These readbacks do not describe every kernel/network buffer or imply that browser `bufferedAmount` must cross its threshold.

There are 878 accepted receiver-position rows and 878 raw OSC packets. I independently decode all OSC strings/padding/`,fff`/big-endian Float32 payloads and match them in exact order to the first 878 position sends, with node/object equality and coordinate tolerance `1e-6`. The remaining 405 of 1,283 position sends correspond numerically to 405 rejection rows: one command-admission failure and 404 stale-session rejections. These rejections are retained failure evidence, not quietly removed from the denominator.

## Separate native receiver admission failure

The receiver records its stop reason and clock-error as `Native command count/byte capacity exceeded`, followed by `Receiver clock failed during command admission` and stale-session rejections. The clock-error appears 29.393666 ms after the resume acknowledgement in the **same Node performance domain**. Final clock readiness is false and its failure remains latched. This is not a 500 ms sender backpressure close, a native lease-watchdog result, or an acoustic-release result.

The frozen `NativeClock.post` source throws that exact error before posting when a packet or unacknowledged command collection exceeds its count/byte bounds. The actual sequence therefore substantiates a post-resume admission failure under this finite buffered delivery. The report does not retain the exact failing counter/packet-size snapshot, so I do not claim a measured peak, a uniquely isolated scheduling cause, or the exact failing bound solely from the common error string. In particular, aggregate forwarded bytes are not identical to the native serialized unacknowledged-byte count.

The final rolling native tail is not a complete post-resume worker transcript. It ends with a `Receiver close` release and numerical empty state, but cannot establish every intermediate mutation or an independent watchdog deadline. The ordinary receiver/raw lists remain below their ring limits and preserve the aggregate admitted/rejected denominator. Successful fail-closed emptying does not make the intended recovery behavior successful.

## Cleanup and conclusion

Proxy cleanup passes its strengthened certificate: stop acknowledgement, process/stdin/stdout/stderr close observed, exit zero, null signal, no retained proxy errors and no queued byte tail. Its own final report says stopped and every owned socket/listener/selector/raw/journal resource closed. Browser/context/audio disposal flags are true. The native worker acknowledges close and exits zero; bridge/ports close successfully. Nevertheless the helper correctly adds `Late native clock/evidence failure` to the arm errors because the prior admission failure remains latched. Graceful process closure and healthy musical/control completion are separate facts.

The root controller independently observes both durable claims (proxy PID 47082 and browser PID 47083 under worker 47063), records no forced cleanup/controller errors and ends with no remaining **known-owned** identities. Root's later readback finds private TCP 5426/5427 refused, no UDP 5428 listing, both claimed PIDs absent and no matching private Chrome profile; the permanent bridge remains quiet and ready. These sampled process/port checks are not exhaustive OS lineage or physical-release proof.

The actual result stays failed with no sustain arm. The absence of real sender pressure, unfinished recovery criteria, separate native admission failure, missing final binding checks and no sustained watchdog witness keep A43 open. The evidence is sufficient to motivate a separately authorized design investigation of the receiver admission/backlog path; it does not authorize production changes, capacity increases or another acquisition.

I also read `Root-Gate-Decision.md`; its failure, denominator, missing-check and limited-cleanup claims agree with this independent readback. Both independently decoded TCP close frames carry code 1011 and reason `receiver clock failed`, reinforcing the distinction from the unobserved sender control-backpressure close. No root decision or ledger was modified.
