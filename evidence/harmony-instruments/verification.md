# Harmony Bloom instrument integration — October 14, 2026

Passed: production TypeScript/Vite build; 335 unit tests in 29 files (excluding the previously environment-blocked bridge-render integration). The full standalone Playwright/receiver suite was not rerun.

New checks cover byte-identical source hashes for all five WAVs; actual stereo PCM at root and octave; exact onset silence; natural sample end; cancellation fade; complete-bank activation and failed-load retry; scene serialization and old-composition conversion; companion packet identity; editable mesh structure; all five portable GLBs loading with the game loader.

Live in-app browser checks: all five palette portraits visible; drag-and-drop placed Guitar, Glass, Kalimba, Piano and Marimba with the matching inspector; changing Marimba to Piano updated the character and inspector; undo restored Marimba. Found and repaired multi-part Body picking during this check, then reloaded and repeated all five successful placements. No error/warning logs occurred after the fix reload (14:11 UTC onward); earlier recorded errors are retained in the tab history.

The clean seven-piece ensemble played on actual AudioWorklet playback: 9 active voices and 223 route passages at the first recorded check, with zero late engine/audio drops, stolen voices or telemetry drops. Final live-playback.json records a later check. No physical speaker/loopback recording or reproduction of Harmony Bloom effects is claimed.

Mobile check requested 390x844; six cards were within the page width, with the fixed Play control at y785–834. No horizontal overflow. Native mobile screenshot is 375x812, reflecting capture/scrollbar sizing; reviewed visually together with DOM rectangles. Temporary viewport override reset.

34 art files are in the refreshed manifest, including five instrument GLBs and six native-rendered PNG portraits. ZIP integrity passed. The final production build contains the WAVs and art assets. The preview is left on Toy ensemble, paused, at http://127.0.0.1:5417/BongoPlanet/. No publication or fork edits.
