# Bongo Planet — Spark Gates implementation review

Recorded 2026-10-14T19:47:11.635836+00:00. The requested kickoff commit is **`396c820`**. Routing, hop travel, lifecycle, persistence, output integration and current direct gate editing are implemented. Human acceptance remains open.

## Measured results

| Check | Actual result | Evidence |
| --- | --- | --- |
| Production build/typecheck | passed | [Build log](step-07/build-qualified.log), [validation](step-07/validation.json) |
| Full source/audio/bridge suite | 467 passed; 0 failed | [Unit report](step-07/unit-qualified-results.json) |
| Full installed-Chrome suite | 68 passed; 0 failed; 0 skipped | [Browser report](step-07/regression-qualified/full-browser-results.json) |
| Current combined additions | 487 source tests and 19 gate browser checks passed; current dense budget passed | [Latest units](step-07/latest-unit-results.json), [current gates](step-07/regression-qualified/latest-gates-browser-results.json), [current budget](step-03/post-instruments-budget/report.json) |
| Independent circuits | Nine analytic arrival/sound traces pass | [Expected and actual events](step-02/circuit-traces.json) |
| Actual local output timing | 135 arrivals; fixed latency 13.33 ms; maximum compensated error 1.0000 samples; observer continuity and source hashes pass | [Capture and all individual errors](step-03/live-audio/attempt-08/report.json), [audible capture](step-03/live-audio/attempt-08/virtual.wav) |
| Dense worklet budget | 64 live edges, 768 arrivals/s; worst CPU 1.592 ms versus 2.902 ms quantum | [Real render-thread trace](step-03/qualified-worklet-budget/report.json) |
| Final 30-minute finite and Infinite circuits | passed | [Result](step-07/qualified-soak/result.json), [source manifest](step-07/qualified-soak/application-manifest.json) |
| Look/source asset archive | All 69 manifest entries match files and archive; F00–F14 unchanged from kickoff | [Independent hash verification](step-07/asset-verification.json) |
| Safari native UI spot checks | Activation, one-hop/Infinite input, live Ember/Chevron changes and appearance reload verified through the actual app | [Scoped native UI record](step-07/safari-native-ui.json) |

The live timing measurement used the exact **SPAT 8ch loopback (Virtual)** input/output at 48 kHz, three independently scheduled calibration probes and actual 100/250 ms main-thread stalls. It captures the product AudioWorklet and its real virtual output; it does not measure physical speakers, venue output or a person's listening. Raw observations and failed attempts are retained. WAVs are derived without normalization or time shifting.

## Bounds and fixes

The core streams one committed edge per branch; finite budgets count empty junctions and revisits, and the final arrival sounds before termination. Equal-hop forks share a sixteenth-note deadline. Tempo changes apply to every circuit on the next whole beat. Wiring stays on vertices. Placing a generator enables all its local exits in one edit; moving it does not carry wiring.

Independent bounds are 256 edges, 2,016 rolling arrivals/s, 5,376 pending sounds, 64 voices, **64 decisions per actual audio quantum**, 2,048 reliable event records and 23,520 output-ownership records. Logical overload pauses visibly and releases work. Rendering caps heads at 128 without changing music. The initial 128-decision quota allowed a synchronized 96-edge trace with 2.924 ms CPU against a 2.902 ms quantum; that failed measurement is retained in [the prior trace](step-03/current-worklet-budget/report.json). The measured 64-decision quota and explicit recovery replace it. Dense qualification is scoped to this reference machine and fixture, not every device/layout.

Transport epochs prevent old events/status from restoring canceled work. Every Play gets a fresh session, preserving legacy resume visuals. Pause removes render heads immediately even at 2 FPS. Source ownership releases old long voices locally and remotely. Native numeric-key gestures coalesce to one Undo entry. A bounded legacy-preview cache removes repeated shortest-path calculation before live phase edits; the previously failing real capacity burst now passes.

## Source and remaining acceptance

The final soak uses an immutable production build at the permanent URL, with its complete application source and SHA-256 manifest retained. Snapshot start: `2026-10-14T19:03:34.262Z`. Source files changed afterward by separately requested instrument/UI work: agentGuide.ts, ai-music.css, aiMusicPage.ts, audio/samples.ts, audio/synth.ts, core/contracts.ts, core/engine.ts, core/examples.ts, core/instruments.ts, core/songbook.ts, main.ts, output/protocol.ts, panel.css, toy-style.css, view/SparkGateRenderer.ts, view/SphereView.ts, view/agentMusic.ts, view/art/appearance.ts, view/art/controls.ts, view/art/gateIcons.ts, view/art/swatches.ts, view/art/toys.ts, view/selectionPanel.ts. The engine scheduling class is byte-identical; complete changed files are still listed rather than represented as identical. Current combined source, gate controls and dense audio received the separate rechecks above. [Validation](step-07/validation.json) gives the exact comparison; the 30-minute result applies to the retained binary, not untested future edits.

All acceptance subcases are in [the individual checklist](Acceptance-Checklist.md). The earlier failed/interrupted broad runs are preserved in `step-07/regression-combined/` and `step-07/regression-qualified/interrupted-browser-results.json`; missing evidence folders, changed file-format assertions, HMR edits and a stopped local server were repaired before the passing full run. Earlier successful 30-minute candidates are preserved separately.

Listening, unfamiliar-player and full person-led Chrome/Safari review remain **not run**. Safari WebDriver is **blocked** because Allow remote automation is disabled; native app spot checks did not change that setting and do not replace the remaining tasks. Original dimensional styles/inspector controls are explicitly superseded by later direct requests. G1/G2/G3 human acceptance remains open; no physical-touch, venue or iOS acceptance is claimed. [Short player review task](step-07/Human-Review-Task.md).

Runnable app: **[Bongo Planet](http://127.0.0.1:5417/BongoPlanet/)**. Dev port 5417 and the local bridge on 5418 are preserved. The implementation follows the original checkout's contract; the independent fork was not edited.
