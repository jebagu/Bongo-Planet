# Bongo Planet — isolated render-clock integration checks

The actual companion scheduler passed its isolated browser test at2026-10-11T19:29:54.282Z. This is real silent AudioWorklet control execution, not full application fixture or sound acceptance. The actual bridge producer path has a separate root-owned integration test/report.

| Case | Actual Node block | Worklet ingress lead | Actual control error | Old Node timer error | Receipt uncertainty |
| --- | ---: | ---: | ---: | ---: | ---: |
| Requested100ms |110.053ms |499.472ms |+3.0074ms |+82.4914ms |8.2634ms |
| Requested250ms |256.519ms |493.826ms |+3.0068ms |+227.8187ms |8.3562ms |

The test required actual processor queue receipt before each Node block. The processor wrote a control sample at the recorded sample offset, then muted its output downstream. Actual timing uses the observed processor callback wall clock plus that sample offset, converted with an independently measured fixed Node wall/monotonic offset. Intended deadlines do not supply actual timestamps. Clock uncertainty conservatively includes coarse-wall observations, measured frame/wall residual, Node-wall drift, and a full render quantum. Node wall-offset change from beginning to end was+0.662842ms.

Exactly two controls executed. Pending cancellation and epoch retirement suppressed future controls. The producer-heartbeat watchdog released its epoch and cleared pending/active controls. Deliberate final AudioContext suspension failed closed with `Receiver AudioContext suspended/closed`; this is an expected negative control, not a successful-run timing failure. Private page access without capability and unauthorized sink capability were rejected. Browser/context/socket/server cleanup completed.

The module bounds pending5376, active controls64, objects92, commands8192, receipts8192, one in-flight receipt batch of at most16 rows and61440 serialized UTF-8 bytes, and acknowledgement wait500ms. Cancel receipts contain counts and command sequence rather than echoing potentially large ID arrays. Command application acknowledgements follow all prior queued receipt rows. Active node/object rebinding fails; cancelling a node clears its binding for legitimate re-addition. Render discontinuity, clock uncertainty above10ms, suspension, lost socket, and queue/readback pressure fail closed. No Node deadline timer fallback exists.

`attempt-03-raw.json` contains source hashes, independent clock samples, actual sample/frame/callback witnesses, old-timer negative controls, ordered acknowledgements, releases, expected failure, and cleanup. The module SHA256 is `5c87b228f429e487e6b80cfbdc76d21f11fa7dd789e52babe6b65215f690e6b9`. Typechecking passed. Browser run passed1 test in6.4 seconds, using installed Chrome.

The first run exposed a test harness equality error: continuing genuine heartbeats advanced the applied sequence beyond the cancellation sequence. The harness now requires the applied sequence to reach or exceed the captured cancellation command. The exact observed failure and initial passing terminal outcomes are labeled in `attempt-01-terminal-failure.txt` and `attempt-02-terminal-pass.txt`. The original failed test-context file was cleared by the second default test-output directory; it is not represented as preserved raw context. The instrumented run uses its own output directory. All runs explicitly override the reporter, so `evidence/browser-results.json` remains unchanged; its exact committed bytes are separately archived as `legacy-browser-results.json`.

These checks do not prove actual F01/F04 production output, steady product zero-delay forwarding, audible synthesis, ADM spatial sound, long-run clock stability, or sustained capacity under maximal event load. Those gates remain separate and retain all earlier failed receiver evidence.
