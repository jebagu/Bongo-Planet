# Bongo Planet — Reworked covers verification

Verified locally on 2026-10-14 at http://127.0.0.1:5417/BongoPlanet/.

The Reworked group adds 42 separate cover versions directly after Favorites. Pachelbel’s Canon stays first in Reworked; the unchanged original Canon and Toy Ensemble stay first in Favorites. The six original songs, Toy Ensemble and routing demonstrations have no reworked copy.

The arrangements use written phrase accents, varied note lengths, warmer piano/guitar leads, quieter inner voices, branching chord rolls, and individual tempi. Twenty-nine gain at least 8 BPM in their musical pulse. Occupancy is 67–92 nodes, with all 92 occupied in Bach’s Prelude, Tetris and Final Fantasy’s Prelude. Each occupied sound node plays. The one-sixteenth-per-hop timing remains intact.

- Passed: production build and final TypeScript check.
- Passed: all 87 rework tests, including source-melody pitch order, eight complete loops, exact onset grid, varied dynamics/articulation, bounded routing, every instrument reached, portable imports and source preservation. The combined song collections passed 153 tests before the final full suite.
- Passed: 669 unique full-suite tests after rerunning the numerical-analysis file with a 30-second timeout. The initial full run had 668 passes and one unrelated numerical test exceeding its default five-second timeout; all 22 tests in that file then passed in 3.83 seconds without code changes.
- Passed: browser menu order, all earlier choices, 42 cover entries and four dividers.
- Passed: all 42 reworks in actual browser AudioWorklet playback. Every expected sound node is observed; every track produces nonzero PCM with zero late drops, zero stolen voices, no page errors and no failing requests. Pause releases voices; reworked Canon also passes music/look Save/Load and portable Import.
- Passed: all 42 portable files match the production build and the 44-file ZIP archive.
- Passed: 49 pre-existing scenes, including both favorites and all six original songs, match their pre-edit SHA256 hashes. Mario, Zelda and Final Fantasy also retain their original game-theme fixture hashes.
- Passed: visual inspection of the playing Canon rework and whitespace checks.

Five browser checks were interrupted during a shared local-server restart. All five passed on retry; both original and retry reports are retained. Development reloads are blocked only within this browser test so concurrent source edits do not interrupt playback.

Tetris was concurrently expanded in the shared project to a 24-beat, 92-node journey. Its Reworked copy includes that current longer arrangement at an 82 BPM master grid (164 BPM main-theme feel), with stronger accents and varied articulation. The original 49-scene baseline remains separate from the game-theme hashes captured before this expansion.

Per-track results are in verification.json and R-*-browser.json. Raw browser reports, source/export hashes, build and test logs, screenshots, and Bongo-Planet-Reworked-Covers.zip are retained here. These machine checks do not establish subjective musical preference or physical-speaker acceptance.
