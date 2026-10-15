# Bongo Planet — classic video game themes

Choose **Load preset → Favorites → Tetris — Type A (Korobeiniki)** for the extended full-planet arrangement, then press **Play**. The other three themes are in **Video game themes**, after **New classics** and before **More presets**. Selection starts paused and keeps your current look.

Four instrumental adaptations cover a platformer, an adventure, a puzzle game and a role-playing series. Mario, Zelda and Prelude retain eight-beat excerpts. Tetris uses every one of the 92 nodes on one continuous 91-hop journey: the longest possible without revisiting a node. All use the shared sixteenth-note grid, finite directed routes and the planet's sampled instruments. Backing instruments answer during held lead notes.

Mario keeps the opening fanfare; Zelda holds its final F to finish the loop before the later chromatic and triplet passages. Tetris now includes the complete eight-bar main tune, a compact bridge adapted to natural minor, and a closing C–B–A cadence. Its 75 BPM grid gives the main tune a 150 BPM feel; the 24-beat loop lasts 19.2 seconds, six times the earlier two-bar excerpt. One generator and 91 sounding instruments fill the globe. The final A rings through the five remaining grid steps, so the next melody starts cleanly. Prelude uses the opening C-added-ninth figure, spanning C2–C6, rather than its later chord changes. All fit a single supported pitch collection per planet.

| Theme | Composer / source | Occupied nodes | Master tempo | Loop | Tonality | Import file |
| --- | --- | --- | --- | --- | --- | --- |
| Super Mario Bros. — Ground Theme | Koji Kondo | 72/92 | 168 BPM | 2.9 s | C major | [S41](../public/songs/S41-Super-Mario-Bros-Ground-Theme.json) |
| The Legend of Zelda — Overworld | Koji Kondo | 76/92 | 144 BPM | 3.3 s | B♭ major | [S42](../public/songs/S42-The-Legend-of-Zelda-Overworld.json) |
| Tetris — Type A (Korobeiniki) | Traditional / Hirokazu Tanaka | 92/92 | 75 BPM | 19.2 s | A minor | [S43](../public/songs/S43-Tetris-Type-A-Korobeiniki.json) |
| Final Fantasy — Prelude | Nobuo Uematsu | 72/92 | 100 BPM | 4.8 s | C major | [S44](../public/songs/S44-Final-Fantasy-Prelude.json) |

**Super Mario Bros. — Ground Theme.** The seven-note opening fanfare on bright marimba, keeping its little silences and high-to-low G answer. Plucked bass, kalimba and a light backbeat give it a bouncy planet groove.

**The Legend of Zelda — Overworld.** The main-theme leap from B-flat down to F, then the quick climb into a high F. That last note is held to close this two-bar adaptation, over piano roots, glass and soft hand percussion.

**Tetris — Type A (Korobeiniki).** All 92 nodes join one 91-hop journey: the complete eight-bar main tune, a compact natural-minor bridge and a closing cadence. Piano leads, with low guitar, marimba and hand-drum answers in the held notes. The 75 BPM grid gives the main tune its familiar 150 BPM feel; the 24-beat loop lasts 19.2 seconds.

**Final Fantasy — Prelude.** The signature C–D–E–G added-ninth arpeggio rises from C2 to C6 and falls back toward home. Glass takes the flowing line, with quiet piano, low guitar and a barely-there hand-drum pulse.

Individual JSON files include music and the default look. Use **Import** to open a file or **Export** to keep an edited arrangement. The [first songbook](Songbook.md) and [20 classics](Classics.md) remain in Presets. Regenerate this collection with **npm run songs:games**, or all collections with **npm run songs**. The catalog is in **src/core/gameThemes.ts**, with Tetris's full-planet score and arrangement in **src/core/tetris.ts** and the other builders in **src/core/classics.ts**. Reworked Tetris uses the same journey with an 82 BPM master grid (164 BPM feel) and stronger written expression.

## Score references

The linked transcriptions were used to check the selected notes and rhythms. Instrumentation, backing parts, tempo choices and loop endings are adapted for Bongo Planet.

- [Super Mario Bros. — Ground Theme — score reference](https://mariofreepianosheetmusic.wordpress.com/wp-content/uploads/2015/05/mario-sheet-music-overworld-main-theme.pdf)
- [The Legend of Zelda — Overworld — score reference](https://www.vgleadsheets.com/assets/sheets/C/The%20Legend%20of%20Zelda%20-%20Overworld.pdf)
- [Tetris — Type A (Korobeiniki) — score reference](https://www.vgleadsheets.com/assets/sheets/C/Tetris%20-%20Korobeiniki%20%28Tetris%20Type%20A%29.pdf)
- [Final Fantasy — Prelude — score reference](https://gametabs.net/tabs/final-fantasy-vii/prelude-10)

The Final Fantasy reference is a later series arrangement of the shared Prelude motif. Tetris credits the traditional folk melody and Hirokazu Tanaka's game arrangement separately. [Square Enix's Prelude collection](https://www.jp.square-enix.com/music/lineup/item/SQEX-10740.html) documents the theme across the series.
