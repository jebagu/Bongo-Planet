# Bongo Planet — F01 copied native receiver workload, attempt 01

The one authorized diagnostic exited **1**, retained as **failed/incomplete**. Its copied receiver reached its declared130-second service lifetime before the browser could certify120 seconds of timed workload. This is an orchestration censor, not a completed120-second test. No retry occurred. The run also retained **two actual late-drop receipts**; these observations are distinct from the terminal service cutoff and are not erased by it.

Client execution ran from 2026-10-11T22:16:32.443Z to22:18:35.182Z,122.737372 actual monotonic seconds including preparation and cleanup. The copied receiver's [separate report](../run-2026-10-11T22-16-23.827Z/report.json) records130.102749 seconds from its hrtime bounds, process exit0 and clean receiver/server/witness closure. Client errors are exactly `TypeError: fetch failed` and `Cleanup: TypeError: fetch failed` after the copied receiver stopped. The client owned browser and browser process both closed; no capture tracks, physical mic, virtual input recorder or additional witness were created. Root's permanent services were not stopped.

## Retained denominator and binding

[report.json](report.json) retains239500-ms controller snapshots. The last successful poll was119.006325 seconds after the Node timer start, with audioNow119.28, the same connected session and ready native clock. `timerEnd` and the completed120-second certificate are absent. The immutable first logical emission epoch is0.2506666666666672 seconds, its observed receive-context time0.256, and fixed requested audio end120.25066666666666. The epoch/end were never shifted to accommodate the cutoff. Pre-stop observation had audioNow119.78133333333334 and output disconnected; it does not fill the missing end-state/receipt certificate.

The original F01 fixture and default view were unchanged. The exact producer WebSocket mapping `ws://127.0.0.1:5418` → `ws://127.0.0.1:5423` was observed exactly once. Producer protocol, original event handler and limits were unchanged. Activation took284.685ms and preserved the original first-emission record. Chrome preview was explicitly muted; this is numerical control evidence, with no audible or physical output qualification.

Actual HTTP bytes before and after matched the frozen assets:

- Main `index-3J-yL5Nu.js`: SHA256 `3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207`.
- Processor `processor-DjdrVTs8.js`: SHA256 `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`.
- Original F01: SHA256 `c7da2bb4097cf97806019b6e8996e4db308d74414de96d28ea2987e8550a2750`.
- Workload harness: SHA256 `a07157c33980faa06325c5616c4c6ff00eb7332b10eec7120f97dacd5f99acab`.

[receiver-source-manifest.json](receiver-source-manifest.json) binds the separate copied/instrumented receiver. No production source was instrumented by this client. Copied worker traces and independent witness belong to the root-owned receiver report, not a second witness started here.

## Actual records and open checks

[events.jsonl](events.jsonl) retains383 unique observed receiver rows:180 queued,178 onset,2 late-drop,12 position,7 stop and4 start. These include preparation/session lifecycle rows, not383 musical onsets. [rawOSC.jsonl](rawOSC.jsonl) retains12 original decoded/hex position rows, four per object. Polls checked overlap of the receiver's last100-row rings; no ring gap/capacity loss was observed before terminal fetch failure. Retained receipt bytes195,644 plus compact snapshot bytes820,753 total1,016,397, below the32MiB cap. Terminal unavailable receiver state and receipts after the last successful poll remain censored.

The actual late-drop rows identify `s2-123`/kick at23.771272ms observed error and `s2-175`/near at131.079397ms, both in the retained native monotonic domain. They are preserved without retries or alternate timestamp fitting. Last observed receiver state reports drops2 and worker onsetCount178/lateDrops2. This review does not allocate their cause; independent diagnostic ring/witness analysis belongs to the separate receiver investigation.

After cutoff the client requested Pause/producer stop and closed its AudioContext/browser. Its post-stop receiver fetch was unavailable, so client stop acknowledgement is absent. Root separately confirmed the copied receiver service's clean stop. Both cleanup outcomes remain explicit.

No completed120-second certificate, complete terminal receipt drain, onset timing qualification, copied-bridge acceptance, physical/audio output, human listening or full fixture qualification is asserted. Browser and Node monotonic clocks remain distinct. The frozen original denominator was not shortened; this incomplete run was not automatically retried.

[manifest.json](manifest.json) binds the client evidence and review; the separate root receiver report remains linked, not modified.
