# Chord Favorites — verification

Eleven independent chord arrangements are available below Favorites in the preset menu. The original six melodic scenes and all five drum scenes retain their exact fixture hashes; the five drum menu names now use the genre followed by “Drum Loop”.

Build and TypeScript checks passed. All 713 unit tests passed. All 13 dedicated browser checks passed, including every sounding layer in the actual AudioWorklet, simultaneous stack timing, paused preset loading, preserved appearance, save/export/import and four-layer editing at 390 × 844. Screenshots and per-song browser traces are retained here.

| ID | Arrangement | Chord stacks | Render peak | Maximum voices |
| --- | --- | ---: | ---: | ---: |
| C01 | Pachelbel’s Canon | 8 | 0.375 | 7 |
| C02 | Toy Ensemble | 8 | 0.256 | 12 |
| C03 | Airy Loops | 8 | 0.296 | 36 |
| C04 | Final Fantasy — Prelude | 12 | 0.432 | 8 |
| C05 | North Pole Loop | 16 | 0.247 | 28 |
| C06 | Tetris — Type A (Korobeiniki) | 12 | 0.387 | 6 |
| C07 | Prelude in C Major · Bach | 4 | 0.291 | 6 |
| C08 | Ode to Joy · Beethoven | 8 | 0.372 | 6 |
| C09 | Eine kleine Nachtmusik · Mozart | 18 | 0.329 | 5 |
| C10 | Swan Lake · Tchaikovsky | 8 | 0.323 | 7 |
| C11 | Scarborough Fair · Traditional | 8 | 0.319 | 6 |

All eleven 48 kHz stereo previews use the current engine, synth and recordings. Eight simulated cycles preserve their onset patterns and reach every written layer. Repeated steady-state PCM matches within 1e-5; maximum observed work is 14 decisions per audio quantum, maximum polyphony is 36, with zero voice steals or late drops. All eleven built fixtures have matching portable compositions.

AudioWorklet output and signal checks are machine verification; physical listening and subjective musical preference remain human judgments. The subsequent public release is version 16 at https://bongo-planet.jebagu.chatgpt.site. Anonymous verification matched all 99 hosted files to the release (removing only Cloudflare’s injected challenge script from HTML), loaded all 27 presets across the three menu sections, and measured browser audio for every preset, with no page errors or failed requests. See `public-site-validation.json` and the public-site screenshots.

Recreate the arrangements with `npm run songs:chords`. Their sources and individual arrangement notes are in `scripts/chord-favorite-scores.ts` and each `public/compositions/*-chords/README.md`.
