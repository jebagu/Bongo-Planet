# Bongo Planet — real pending-capacity regression

```sh
npx playwright test tests/capacity-browser.spec.ts --workers=1 --reporter=line
npx tsc --noEmit
```

Final regression passed in 13.4 seconds; TypeScript checking passed. Installed Chrome loaded the real production app and AudioWorklet. No processor error, reset, fake clock, synth counter, or capacity state was injected.

F09 loaded all 92 pieces. The test requested 180 BPM during the initial 40 BPM beat and derived each legal generator phase from the actual first emission timestamp and AudioContext time. Eight edit iterations in 999.2 ms reached the real 5,376 pending limit; the attempted next trigger advanced the sequence to 5,377 and emitted `pending limit exceeded`. There were no triggers following that reset in the captured event batch and no interrupted-clock or processor-backlog reset.

After actual telemetry settled, transport was paused, pending was zero, and audio voices were zero. The capacity explanation remained visible in the persistent audio status after five seconds, beyond the transient notice timeout. Enable and an unrelated Note timbre edit preserved the explanation, paused transport, zero pending work, and zero additional onsets. They did not reconnect output.

Explicit Play resumed transport. After the preserved next integer beat boundary, the real engine beat advanced 6.232 beats in 2.077333333 seconds: exactly 180 BPM. Browser page errors were absent. `phase-burst.json` retains the real edits, emission/reset/trigger events, intermediate telemetry, and source identity. `recovery.json` records the persistent failure state, Enable/edit state, actual recovery timestamps, and measured tempo. `persistent-capacity-error.png` shows the persistent visible status.

The served main asset was `/BongoPlanet/assets/index-BJ803lmz.js`, SHA-256 `e0985953a9a9dc53c99a60420ea3ce3e4cf762c5c53056e9a7dafc41397fe85f`, unchanged before/after the check. AudioAdapter source SHA-256 was `9e01be8fe5e5e573134ec8c576829697f39502ff5ba78e9115ea960aba6bbfc6`.

Attempt 01 reached the same real capacity error but failed because Enable followed by an edit cleared the persistent explanation to “Paused.” Its phase burst, screenshot, and error context remain in `attempt-01-*`. The lead repaired retained capacity status; the final run did not relax that assertion.

Scope: the bridge stayed disconnected to isolate worklet capacity from native socket backpressure caused by F09's large trigger batches. Remote release specifically caused by a capacity error is unmeasured. Zero audio voices after the error was measured; this run does not claim active voices were present immediately before overflow. Browser cleanup was automatic at test completion.
