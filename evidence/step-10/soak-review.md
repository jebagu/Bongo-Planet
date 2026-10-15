# Bongo Planet — actual dense soak review

The immutable F06 composition ran for **1,800.125 real seconds** in installed Chrome 155, with actual output routed to Orbisonic Aux Cable. The timer began at 2026-10-11 17:19:48.347 UTC; cleanup finished at 17:49:48.554 UTC. The test browser and context closed with exit code 0, and the evidence-only port 5420 listener disappeared. The permanent application URL remains http://127.0.0.1:5417/BongoPlanet/.

There were 59 validated ordinary scene edits and 30 status samples. Every sample retained 92 pieces and running audio. Active voices stayed at or below 64, pending events at or below 336, and retained event records at or below 10,000. Both late-drop counters and telemetry drops remained zero. There were no uncaught exceptions. Two startup console 404 messages were retained; an independent startup reproduction attributed both to `/favicon.ico`. This snapshot therefore does not meet a literal zero-console-error criterion.

Warm-up heap use at minutes 2–4 ranged from 40.2 to 74.1 MB, median 55.0 MB. The last five minutes ranged from 39.4 to 95.9 MB, median 53.2 MB. Across the post-warm-up run, heap use ranged from 30.1 to 97.0 MB with natural garbage collection. Render geometries cycled between 1,250 and 1,590; event listeners stayed at 79 and documents at one. No sustained rise in heap floors or object counts was observed. These observations do not prove the absence of every possible memory leak.

The final audio-status sample was at 1,741.016 seconds; an end screenshot and clean shutdown followed the completed duration. Actual audio was not recorded continuously during this soak, so missing audible events across all 30 minutes are not independently counted. Separate loopback evidence identifies actual output onsets for documented fixture variants.

The tested snapshot predates later warm-up, UI, output, and lifecycle fixes. The final commit is `62bccbabffd5523feae2b92358907faa00f706ae`. Its main and audio-processor compiled bundle hashes differ from the immutable snapshot. The lead separately regression-tested the final source. Do not promote this earlier run into a full 30-minute qualification of that revision.

Exact samples, edits, environment, browser arguments, source hashes, final bundle comparison, and retained errors are in `soak-report.json` and `soak-review.json`. The exact harness is retained as `soak-harness.ts`; original source files are under `soak-source/`. Start/end screenshots and the favicon request attribution are retained beside the report.
