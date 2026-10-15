# Bongo Planet — video game themes verification

Verified locally on 2026-10-14. The four added presets are S41–S44, in the Video game themes group. This change adds short arranged excerpts, generated fixture and portable composition files, and a generated write-up at `docs/Video-Game-Themes.md`.

- **Passed:** `npm run songs:games` generated four fixtures, four complete music-and-look files, the inventory and the write-up.
- **Passed:** `npm run build`, including the generated agent guide and TypeScript checks. Vite reported its existing large-chunk advisory.
- **Passed:** 82 tests across `game-themes.test.ts`, `classics.test.ts`, `planet-songbook.test.ts` and `composition-file.test.ts`. Checks include independent reference pitches and onset positions, hook rests, three bounded loops, every sound node reached, portable imports and preserved favorite fixture hashes.
- **Passed:** the classics browser menu regression. Favorites remain first, all 53 presets are unique, and the four groups have three dividers.
- **Passed:** all four game-theme browser tests after adding the save/load appearance assertion. Each preset loads paused, plays every occupied sound node, produces nonzero AudioWorklet output with zero late drops and stolen voices, releases voices on Pause, and restores its music and look paused through Save/Load.
- **Passed:** visual inspection of `mario-playing.png` and `git diff --check`.

The initial sandboxed Chrome launch aborted before loading the application. Running the same checks outside the sandbox succeeded. Per-theme browser measurements are retained in `S41-browser.json` through `S44-browser.json`.

The local development URL is `http://127.0.0.1:5417/BongoPlanet/`. The production build includes the new songs. This task did not publish the public Site. Browser audio measurements are distinct from subjective listening, physical speaker, Safari or venue acceptance.
