# Bongo Planet — creation guide

For humans and agents composing **version-two gated scenes**, with chains, forks and circuits. [Rules.md](Rules.md) is the executable contract.

## Compose with an AI agent

**AI setup and music guide** opens **/BongoPlanet/ai-music/** in a new tab with the music guide, shared FAQ and prompt builder. Describe the music and look, copy the generated prompt to your assistant, save its complete JSON as Bongo-Planet.json, choose **Import** in **Composition**, then press **Play**. Imports start paused.

The canonical file reference and FAQ are [Agent-Guide.md](Agent-Guide.md), generated from the same sources as the app's AI guide page. Files use an outer `format: "bongo-planet-composition"`, `version: 1`, with a musical `scene` and a complete visual `appearance`. Use `scene.version: 2` and `appearance.version: 1`. **Clear** starts an empty planet and can be undone. **Save / Load** keep both in this browser; **Export / Import** transfer both in one JSON file. Scene Undo/Redo restores music; appearance changes keep their separate automatic browser save.

The left menu runs **Instruments → Play → Piece selector → Mix → Theme → Composition**, followed by **AI setup and music guide** and **FAQ**. The selected-piece card sits below the preset picker. The theme experiment uses the same order. The human guide gives the essentials and three import steps; the copied prompt and downloaded reference retain the full file schema, musical rules and neighbor map.

**Piece selector → Favorites - Simple → North Pole Loop** combines a slow descent with quiet uphill return lanes. One northernmost generator launches four streams at 40 BPM. All four return to it after 24 hops (nine seconds), exactly when the next six-beat pulse begins. Finite 24-hop travel ends the returning streams at the generator, keeping each cycle bounded. The portable file is `compositions/north-pole-loop/Bongo-Planet.json`.

**Piece selector → Favorites - Simple → Airy Loops** loads a super slow, airy techno loop at 40 BPM in A minor. Five finite generators interleave a soft kick/marimba pulse with four long branching waves, using 72 directed gates across 69 junctions. The full arrangement repeats every 16 beats (24 seconds). The preset starts paused; press **Play**. Its complete music-and-look file, with Moon chalk and a star field, is `compositions/airy-loops/Bongo-Planet.json`.

## Favorite presets

The preset menu has six sections, separated by dividers. All presets load paused and preserve your current look. Importing a complete `Bongo-Planet.json` file loads its look too.

**Favorites - Simple** contains Pachelbel’s Canon, Toy Ensemble, Airy Loops, Final Fantasy — Prelude · Reworked, North Pole Loop, Tetris — Type A (Korobeiniki), and Take On Me — Spark Build, in that order. The last entry duplicates the same Spark Build arrangement available under **favorites - with loops**. Both entries remain available; the six earlier favorites retain their music.

**Favorites - Chords** contains the ten chord arrangements below, followed by Dancing Queen and Take On Me. Chord layers at the same junction sound together when a spark arrives. Each arrangement has its own voicings, melody, register, bass movement, note lengths and dynamics.

| Chord favorite | Arrangement | Complete music-and-look file |
| --- | --- | --- |
| Pachelbel’s Canon | Piano soprano, descending guitar ground, held inner harmony and kalimba counterlines | `compositions/canon-chords/Bongo-Planet.json` |
| Toy Ensemble | Two staggered lanes trade seventh chords and plucked answers across all five melodic instruments | `compositions/toy-ensemble-chords/Bongo-Planet.json` |
| Airy Loops | Original five slow sources with restrained minor-nine and major-seven stacks | `compositions/airy-loops-chords/Bongo-Planet.json` |
| Tetris — Type A (Korobeiniki) | Complete existing melody and bridge, low guitar roots and dancing chord accompaniment | `compositions/tetris-chords/Bongo-Planet.json` |
| Prelude in C Major · Bach | Four opening measures of BWV 846 over held bass inversions | `compositions/bach-prelude-chords/Bongo-Planet.json` |
| Ode to Joy · Beethoven | Eight-bar opening theme as a warm piano chorale with kalimba replies | `compositions/ode-to-joy-chords/Bongo-Planet.json` |
| Eine kleine Nachtmusik · Mozart | Plucked marimba fanfare with clipped tonic/dominant chords | `compositions/nachtmusik-chords/Bongo-Planet.json` |
| Swan Lake · Tchaikovsky | Broad glass melody, dark piano harmony and moving guitar bass; natural-minor adaptation | `compositions/swan-lake-chords/Bongo-Planet.json` |
| Scarborough Fair · Traditional | Eight 3/4 measures of D-Dorian guitar melody, open suspended voicings and quiet kalimba replies | `compositions/scarborough-fair-chords/Bongo-Planet.json` |
| Avril 14th · Aphex Twin | Eight-measure, 24-second form with expressive A-flat piano, a punchier D-flat/B-flat-minor passage with marimba accents, a soft return and a closing breath | `compositions/avril-14th-chords/Bongo-Planet.json` |
| Dancing Queen — ABBA | Recognizable melody, bass, chord stacks including D6, and percussion | `compositions/dancing-queen/Bongo-Planet.json` |
| Take On Me — a-ha | Bright melodic hook, moving bass, chord stacks and percussion | `compositions/take-on-me/Bongo-Planet.json` |

These are instrumental loop arrangements and excerpts. Chord favorites use finite travel and stay within the four-layer, 92-piece and 64-voice limits. Airy Loops retains its branching geometry; the other chord arrangements use adjacent finite journeys whose empty junctions preserve rests. Local composition folders include a stereo preview, a complete import file and validation reports. Recreate the ten chord arrangements with `npm run songs:chords`.

Avril 14th develops over 32 beats at 80 BPM (24 seconds): the expressive four-bar opening, a contrasting harmonic passage, and a shortened return with a closing breath. The middle has firmer piano downbeats, shorter releases and low marimba chord accents; the opening and return keep their softer touch. Two finite generators hand off at beat 16 on a shared adjacent ring. Their 64- and 60-hop limits stop each phrase; passing through the other generator does not start another emission. The 92-piece arrangement keeps the same tempo and stays bounded.

Dancing Queen and Take On Me are four-bar cover excerpts that repeat every 16 beats, using three finite lanes of 64, 16 and eight adjacent hops across 91 junctions. They use recognizable melodies and chord progressions with bass, chord stacks and percussion. Recreate their local compositions with `npm run songs:pop`.

**Drum Loops** contains Dub, Afrobeat and the retained build-and-release loop Trapdoor:

| Drum loop | Genre | BPM | Complete music-and-look file |
| --- | --- | --- | --- |
| Dub Drum Loop | Dub | 80 | `compositions/low-tide/Bongo-Planet.json` |
| Afrobeat Drum Loop | Afrobeat | 100 | `compositions/sunwheel/Bongo-Planet.json` |
| Trapdoor — Half-Time Build | Half-time / trap | 160 | `compositions/trapdoor/Bongo-Planet.json` |

Dub leaves beat one open and places kick and snare together on beat three. Afrobeat uses interlocking bongos and different syncopated kick patterns in its second bar. Both use the five recorded percussion instruments, with accents, quiet ghost notes and a two-bar phrase. Four finite generators drive separate 32-, 32-, 16- and 8-hop lanes through all 92 junctions using 88 directed gates. The first musical downbeat is one sixteenth after launch. Local folders contain four-bar WAV loops with both alternating sample takes and steady-state tails; the public Site includes their portable JSONs.

Trapdoor — Half-Time Build (`DB03`, 160 BPM) keeps a repeating four-bar groove on its own finite lane. A second source launches into five- and seven-hop closed circuits sharing one fork. Returning sparks split again, making an increasingly dense hat-and-snare fill, and retain their original hop count. Its 25-hop limit ends the fill while the normal groove continues; the whole build-and-release cycle repeats every 32 beats. Tempo stays constant. The routes cover 84 junctions and use all five recorded percussion instruments. `npm run songs:drum-builds` regenerates Trapdoor, its separate `assets/drum-build-presets.json` catalog and settled stereo preview; it verifies eight-cycle stability, every reached instrument, bounded routing, a clear rise and fall in attack density, audio headroom and no stolen voices or late drops. The WAV includes two musical cycles so alternating takes repeat exactly.

The chord versions of Final Fantasy and North Pole Loop, the other three pop covers, and House, Techno and Breakbeat Drum Loops are removed from the menu and publishing catalogs. Their original source compositions remain available locally for import and regression checks.

## Coverage around the sphere

The twelve **Favorites - Chords** arrangements distribute their sounding parts around the globe. Their authored routes retain the original melodic pitches, note lengths, levels and onset times while placing the phrases across different sides and heights. Six quiet harmonic replies fill uncovered areas in Airy Loops, Eine kleine Nachtmusik, Swan Lake and Scarborough Fair. Airy Loops retains its five original sources and exits; short, finite side branches carry additional quiet replies. Tetris keeps its existing 91-piece budget.

Coverage is measured at all 92 junctions, using the angular distance to the nearest sounding location. Each retained chord preset now has a largest measured gap below 24 degrees at those probes; this is not a continuous-surface bound or a physical surround-listening result. Stacked chords remain co-located; the phrases and answers spread around them. Actual source positions follow the new junctions, independently of the camera. `assets/wraparound-layouts.json` stores the authored paths and quiet replies, and the usual song generators reproduce them. The simple favorites, drum loops and curated menu membership stay unchanged.

## Favorites with loops: build, crest and release

**favorites - with loops** follows Favorites - Chords in the preset menu. It contains three separate demo arrangements; the original Dancing Queen, Take On Me and Kite Weather presets remain available in their existing sections.

| Preset | BPM | Musical cycle | Routing and pacing | Complete file |
| --- | --- | --- | --- | --- |
| Dancing Queen — Spark Build | 120 | 32 beats / 16 seconds | The familiar tune stays on its own lane. A source joins on beat eight, recirculating through 12- and 13-hop loops before its 51-hop budget ends the build. | `compositions/dancing-queen-spark-build/Bongo-Planet.json` |
| Take On Me — Spark Build | 180 | 32 beats / 10.667 seconds | A clear marimba hook gains short interlocking runs through six- and 11-hop return circuits. An 83.3 ms hop and 37-hop budget allow a fast crest followed by the quiet hook. | `compositions/take-on-me-spark-build/Bongo-Planet.json` |
| Kite Weather — Squall | 144 | 32 beats / 13.333 seconds | The original 90-junction network uses sparse six-hop landmarks and a 63-hop lifetime, allowing a second round of returns before a long quiet release. | `compositions/kite-weather-squall/Bongo-Planet.json` |

Each returning spark follows the fork’s enabled exits again. It keeps its original used-hop count; returning through a generator does not reset its travel or create a new scheduled emission. Unequal return lengths interleave extra note attacks and reinforce accents. Finite travel ends the flourish, and the next scheduled launch begins a new cycle. Master tempo stays constant within each demo.

All three load paused and preserve the current look. Import the complete file for its coordinated look. Local folders include a stereo `preview.wav` and a validation report. Previews may include two musical cycles so alternating drum takes repeat correctly. `npm run songs:loops` regenerates the scores and checks eight-cycle stability, every reached instrument, a clear rise and fall in note density, audio headroom and no stolen voices or late drops.

**Airy & Ambient** and **Minimal Routing** retain the ten earlier original loops. Their catalogs remain `assets/ambient-presets.json` and `assets/routing-presets.json`; recreate them with `npm run songs:ambient`.

## Edit a piece

Click a piece on the planet to open its **Selected piece** card. The card shows its portrait, name and sound controls. Drag a piece to an empty junction or onto another instrument's stack to move it. Each layer can be selected directly on the planet or with the numbered portraits in its card. Use the trash button or drag a layer onto the trash to delete just that layer; the others close the gap. Moves and deletions can be undone.

## Choose a look with contrast

Off gates use **Whisper half pixel**: a faint 0.5-pixel outline at 25% opacity. The outline stays thin as you zoom or resize; the flat glyph naturally foreshortens toward the planet's edge. On gates keep their full-opacity orange fill. Saved outline and fill colors remain supported; `switches.stroke` multiplies the default half-pixel width.

Hover over an arrow to reveal a soft white edge glow and a hand cursor. Click to toggle that arrow. The glow keeps off arrows hollow and on arrows filled, follows the visible click target as the globe moves, and fades in and out in about 100 ms. Reduced motion shows the highlight immediately. Hovering never changes the music or saved look.

The main game's **Theme** section offers **Blue Marble, Nebula and Fireflies**. The section contains only its heading and drop-down. Themes apply immediately, save automatically and transfer in complete compositions. Switching themes preserves the music and playback. **Blue Marble** restores the browser's captured original palette with Planet blue (`#5262e9`). The Composition buttons save or transfer music and look together.

Existing custom/imported appearances retain their explicit colors, backdrop, spark and gate settings. Earlier Moon chalk and Lilac dusk combinations and all existing backdrop IDs remain readable, outside the three-theme picker. Appearance stores `planetFinish` (`smooth`, `clay`, `workedClay`, `paintedWood`, `velvet`), `gridColor` (hex or `null` for automatic contrast), `gridOpacity` (0–1) and `gridWidth` (0.5–3 CSS pixels). Older files receive the original smooth finish and automatic grid. Use the exact theme values in [Agent-Guide.md](Agent-Guide.md) when composing a look.

The same approved lineup remains available in the private preview at `/BongoPlanet/theme-experiment/`, using separate local saves. Deep Space, Sunday Picnic and Cloud Pudding remain archived and hidden from both pickers. Complete looks include an optional, validated `appearance.theme` version-one profile for materials, lighting, shadows, fog/atmosphere, spark treatment, motion and interface accents. Export retains these values alongside the music. A saved complete theme never becomes the main game's Blue Marble snapshot. See [the theme record](experiments/theme-engine/EXPERIMENT.md) for scope and verification.

The skies use layered gradients with dark lower edges. Nebula retains its lilac palette and Fireflies' cool nighttime lighting, fog and rim. Decoration `distant-nebula` adds two small flowing 3D ribbon nebulae and seven beveled stars, with the same painted toy materials and solid eyes as the instruments. Their softened colors, small scale and positions near the sky's edges distinguish them from musical pieces. The old cloud characters and little planets remain hidden. Fireflies keeps its bounded field of 72 golden sparks following wider, winding paths in 5–12 seconds. Reduced motion stops decorative drift and flicker. Blue Marble corrects earlier captured sphere colors to Planet blue while retaining the other captured values. In the retained preview, untouched retired presets restore Blue Marble and retain a separate browser backup; customized looks remain intact. Exported files retain their explicit palette values.

Nebula's new scenery sits at least 20 world units behind the globe's origin and stays steady on screen when orbiting or zooming the musical stage. Nebula gives only this distant layer a subtle depth-of-field blur; composition files can set its blur to 0 for crisp background toys. The portable `atmosphere.backgroundBlur` field accepts 0–2 CSS pixels, defaults to 0 for older files, and is .6 in the Nebula preset. A silhouette mask applied after the blur keeps the background out of musical shapes, including faint rear notes, chords, the North Pole and placement ghosts. The globe, instruments and sparks remain sharp. The [archived designs](archives/themes/2026-10-15/README.md) preserve the former scenery and explicit imports. These changes affect presentation only.

## View the globe

A floating red-and-white **North Pole** model with an **N** sign marks the globe's fixed north axis. Its post and plaque are fixed in the globe's geometry, with the N facing the globe's front (+Z in the rendered world). The plaque does not swivel toward the camera when you orbit, tilt or use Slow rotate. The starting view includes room for the marker.

The top-right **Reset view** button restores the starting orientation and zoom and stops slow rotation. **Slow rotate** toggles a gentle spin around the current view's vertical axis, preserving any tilt you chose by dragging. One full turn takes two minutes. Rotation pauses during camera, piece and gate gestures and resumes when you release. It works while music is paused. These view controls leave the music and saved look unchanged; camera state is not saved in composition files.

## The shared musical grid

**One strut crossing takes one sixteenth note, regardless of geometric length.** A beat means a quarter note: four hops make one beat; sixteen make a four-beat bar. Empty junctions and return trips consume steps too.

| Journey at 120 BPM | Arrival after emission |
| --- | --- |
| 1 hop | 125 ms |
| 2 hops | 250 ms |
| 3 hops | 375 ms |
| 4 hops | 500 ms / 1 beat |

At fixed tempo, hop duration is `15 / BPM` seconds. Sparks cross longer struts faster so visible arrival matches sound. Camera position and frame rate cannot alter timing.

**Spark interval** sets emission frequency in beats. **Spark travel** limits each branch's hops; it does not change hop duration. Infinite removes that limit. Switching off **Emit new sparks** leaves existing sparks traveling; Pause stops them. Repeated Infinite emissions can accumulate until a capacity limit pauses playback.

## Add percussion

The instrument picker includes **High bongo (`bongo-high`), Low bongo (`bongo-low`), Kick (`kick`), Snare (`snare`), and Hi-hat (`hi-hat`)** alongside the five melodic instruments. The hi-hat is closed. Every spark arrival plays one recorded hit at its natural pitch and lets its tail finish; repeated arrivals can overlap. Two takes alternate for each percussion sound. Level controls loudness. Key, scale, degree, octave and note length do not retune, stretch or shorten these one-shots. Saved percussion pieces still use `kind: "note"` and retain valid degree/octave/timbre/duration metadata for file compatibility.

All percussion heads face outward from the planet, with eyes on the outward face. The left-panel portraits retain their upright presentation; portable models use the planet orientation.

## Make a chord

**Stack up to four instruments at one junction.** Layers rise straight outward, perpendicular to the planet's surface. Hover over an instrument to reveal four faint cylinder outlines showing its stack's capacity. While placing or dragging an instrument, the next available cylinder brightens; drop into it to add a layer, with a visible gap between the instruments. You can also select an instrument in the palette and click the available cylinder. Orbit the planet to inspect the stack from the side; numbered portraits select layers that overlap in a head-on view. Each spark arrival plays the whole stack together, with independent sounds, levels and note lengths. Mix instrument types or repeat the same one. Generators keep their own junctions; the planet still supports 92 pieces total.

A triad has three notes; a seventh chord has four. Newly placed melodic layers start on successive scale thirds above the first melodic layer. In default C major, stacking four pianos starts C, E, G, B. Edit each layer's Note and Octave to choose another voicing. Percussion layers play their natural hits and do not affect these suggested pitches. Moving an existing layer preserves its pitch. Saved files keep each layer as its own piece with the same `vertex`; piece-array order defines bottom to top. No new field or scene version is required.

You can also split a spark into branches and put different pitches the **same number of hops from the split**. They sound together despite different physical distances. In default C major, try C, E and G in one octave: the first, third and fifth scale degrees.

In a forked phrase, one instrument can answer on step one and two answer together on step two. An extra empty junction delays a branch by one step. Enable return exits deliberately: revisits play again. Simultaneous sparks remain separate voices, so identical notes can get louder.

## Keep several generators aligned

Generators share transport beat zero and the same grid. Intervals of 1, 2 and 4 beats give regular layers. Intervals of 3 and 4 beats realign every 12 beats when start offsets match. Added or enabled generators join their next eligible future boundary.

Gated **Spark interval** choices are 1, 2, 3, 4, 6, 8, 12, 16, 24 and 32 beats. Use the longer intervals for extended phrases so a new melody does not start before the previous journey finishes. These intervals change emission frequency; every hop still takes one sixteenth note. Legacy version-one intervals remain 1, 2, 3, 4, 6 and 8 beats.

**Piece selector → Favorites - Simple → Tetris — Type A (Korobeiniki)** uses all 92 nodes: one generator and 91 sounding instruments on a single continuous journey, the longest route without revisiting a vertex. It includes the complete eight-bar main strain, a compact natural-minor bridge and a closing cadence. Its 75 BPM master grid gives the main tune a 150 BPM feel; the 24-beat loop lasts 19.2 seconds. Backing instruments answer during held lead notes. The final A sustains through the return gap; there are no overlapping melody streams.

Three-hop and four-hop **circuits** launched together return together every 12 steps, or 3 beats. Circuit length and generator interval are independent. Use empty junctions for spaces, revisits for repeated notes, and equal-hop branches for chords.

Tempo edits affect all active circuits and future emissions together at the next whole beat. Note length controls melodic sustain in seconds, independently of spacing; percussion uses its natural one-shot decay. Key, scale and chosen pitches determine melodic harmony; a common rhythm alone does not guarantee consonance.

## Contract for agents

- Use `version: 2`, `settings.propagation: "gated"`, adjacent vertex IDs and directed `wiring`. Gates belong to junctions independently of pieces.
- `HOP_BEATS = 0.25` in `src/core/gated.ts` is authoritative. `Engine` supplies anchored beat-to-time deadlines. Geometry, interval and travel budget must never determine gated delays; `GatedEdge.speed` is a display diagnostic.
- Generator `period` is in beats; saved `phase` is a fraction of that period. Its effective offset is `round(phase * period / 0.25) * 0.25`, wrapped modulo `period`; halfway values round upward. Preserve the saved metadata. Phase zero aligns downbeats; other offsets stay on the shared grid.
- Commit one edge ahead. Whole-beat tempo changes align with hop boundaries. Rendering consumes audio timestamps. Never separately snap sounds or deduplicate simultaneous arrivals.
- Keep this guide, [Rules.md](Rules.md), the [design brief](Game-Design-Brief.md) and [spark-gates plan](Spark-Gates-Work-Package.md) consistent. Regenerate [Agent-Guide.md](Agent-Guide.md) with `npm run docs:agents` whenever behavior, instruments, settings or looks change; its generator also supplies the app's prompt and FAQ. Run the musical-grid and spark-gates tests, including browser checks, after timing changes.
