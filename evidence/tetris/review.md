# Bongo Planet — extended Tetris arrangement

Both S43 and R-S43 use every vertex: one generator and 91 sounding instruments on a 91-hop adjacent path, with no repeated vertices, forks or overlapping melody streams. This is the longest single traversal possible without revisiting a vertex. The score contains the eight-bar main strain, a compact newly arranged natural-minor bridge, and a C–B–A cadence. Accompaniment answers in the lead's held notes. The final A sustains through the five grid steps after the last arrival.

The standard version runs for 19.2 seconds before restarting, six times the old 3.2-second excerpt. Its 75 BPM grid gives the main strain a 150 BPM feel. Reworked has a 164 BPM feel on an 82 BPM grid and repeats after 17.561 seconds. The bridge changes rhythm and replaces chromatic leading tones with E to fit the current natural-minor pitch collection.

Gated generators now offer 12, 16, 24 and 32 beats in addition to their earlier intervals. Legacy intervals remain unchanged. The engine's hop timing, capacity bounds, phase rules and tempo-change behavior are unchanged. The selected-piece UI and generated agent guide expose the new options.

Verification:

- Build and TypeScript checks passed.
- All 669 unit tests in 41 files passed with two workers, including three complete loops per Tetris version, independent melody/onset references, all-node coverage, interval validation, and a long phased generator across a tempo change. An earlier default-parallel run timed out under load; the bounded-worker rerun passed without timing-test changes.
- Both dedicated Chrome AudioWorklet browser tests passed: each played all 91 sound nodes, restarted at the correct interval, produced nonzero PCM, had zero late drops and voice steals, paused cleanly, and exported/imported the same scene while retaining its 24-beat interval. The existing S43 game-theme browser test passed too.
- Browser exports and screenshots are retained beside this report; numerical results are in `verification.json` and the two browser traces.
- SHA-256 comparisons confirmed that all 188 unrelated song/fixture files checked retained their original bytes.

Browser checks used the permanent local URL, http://127.0.0.1:5417/BongoPlanet/. These results verify machine playback; musical listening remains a human judgment.
