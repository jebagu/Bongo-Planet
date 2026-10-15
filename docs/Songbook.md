# Bongo Planet — first 20-song collection

Choose a title in **Presets**, then press **Play**. **Pachelbel’s Canon** is kept at the top in Favorites; the other 19 arrangements are in **More presets**. All 20 use version-two gated compositions. The additional [20 classics](Classics.md) and four [Video game themes](Video-Game-Themes.md) have their own groups between Favorites and More presets.

The individual files in [public/songs](../public/songs/) include music and the default look. Use **Import** to open one, or **Export** to keep an edited arrangement. Preset selection retains your current look. Regenerate the songs with **npm run songs** after editing **src/core/songbook.ts**.

There are 14 newly arranged covers of traditional or classical melodies, and six originals. These are compact instrumental loops: the lead phrases last two bars, with independently repeating bass, drum, and upper-register parts. Three-beat songs use six-beat lead phrases. All timing follows the current one-sixteenth-per-hop rule. Parts finish their finite routes before their next emission.

Sizes count occupied nodes, including generators: six quarter planets (23/92), six half planets (46/92), four near-full planets (76/92), and four complete planets (92/92). Empty junctions carry rhythmic rests in the smaller arrangements. Every occupied sound node is on an active route. The complete planets use every single topology vertex, with no silent filler pieces.

Across the collection, melodies and accompaniment use all seven scale degrees and the full supported octave range, 2–6. Drums use all five recorded percussion instruments: high bongo, low bongo, kick, snare, and closed hi-hat. Individual layers have different dynamics; the full planets deliberately keep their extra percussion and high accents quieter than the lead.

| Song | Arrangement | Size | Tempo / meter | Tonality | Import file |
| --- | --- | --- | --- | --- | --- |
| Ode to Joy | Ludwig van Beethoven | 23/92 | 114 BPM · 4/4 | C major | [S01](../public/songs/S01-Ode-to-Joy.json) |
| When the Saints Go Marching In | Traditional spiritual | 23/92 | 126 BPM · 4/4 | F major | [S02](../public/songs/S02-When-the-Saints-Go-Marching-In.json) |
| Simple Gifts | Joseph Brackett | 23/92 | 108 BPM · 4/4 | G major | [S03](../public/songs/S03-Simple-Gifts.json) |
| Drunken Sailor | Traditional sea shanty | 23/92 | 132 BPM · 4/4 | D minor | [S04](../public/songs/S04-Drunken-Sailor.json) |
| Scarborough Fair | Traditional English ballad | 23/92 | 88 BPM · 4/4 | C major | [S05](../public/songs/S05-Scarborough-Fair.json) |
| Sakura | Traditional Japanese melody | 23/92 | 84 BPM · 4/4 | C major | [S06](../public/songs/S06-Sakura.json) |
| Amazing Grace | Traditional NEW BRITAIN tune | 46/92 | 92 BPM · 3/4 | F major | [S07](../public/songs/S07-Amazing-Grace.json) |
| Auld Lang Syne | Traditional Scottish melody | 46/92 | 102 BPM · 4/4 | D major | [S08](../public/songs/S08-Auld-Lang-Syne.json) |
| Greensleeves | Traditional English melody | 46/92 | 112 BPM · 3/4 | A minor | [S09](../public/songs/S09-Greensleeves.json) |
| Oh! Susanna | Stephen Foster | 46/92 | 138 BPM · 4/4 | C major | [S10](../public/songs/S10-Oh-Susanna.json) |
| Shenandoah | Traditional American folk melody | 46/92 | 78 BPM · 4/4 | F major | [S11](../public/songs/S11-Shenandoah.json) |
| Brahms’ Lullaby | Johannes Brahms | 46/92 | 88 BPM · 3/4 | G major | [S12](../public/songs/S12-Brahms-Lullaby.json) |
| Pachelbel’s Canon | Johann Pachelbel | 76/92 | 96 BPM · 4/4 | D major | [S13](../public/songs/S13-Pachelbels-Canon.json) |
| New World Largo | Antonín Dvořák, Symphony No. 9 | 76/92 | 74 BPM · 4/4 | C♯ major | [S14](../public/songs/S14-New-World-Largo.json) |
| Mango Moon | Original | 76/92 | 116 BPM · 4/4 | F major | [S15](../public/songs/S15-Mango-Moon.json) |
| Velvet Meteor | Original | 76/92 | 94 BPM · 4/4 | E minor | [S16](../public/songs/S16-Velvet-Meteor.json) |
| Bongo World Carnival | Original | 92/92 | 128 BPM · 4/4 | C major | [S17](../public/songs/S17-Bongo-World-Carnival.json) |
| Midnight Circuit | Original | 92/92 | 122 BPM · 4/4 | D minor | [S18](../public/songs/S18-Midnight-Circuit.json) |
| Seven-Step Sun | Original | 92/92 | 144 BPM · 4/4 | G major | [S19](../public/songs/S19-Seven-Step-Sun.json) |
| The Planet After Rain | Original | 92/92 | 82 BPM · 4/4 | A minor | [S20](../public/songs/S20-The-Planet-After-Rain.json) |

**Ode to Joy.** The opening theme on piano, with a warm guitar floor and a crisp bongo backbeat.

**When the Saints Go Marching In.** A little marimba street parade, with syncopated low bongos and a snare answer.

**Simple Gifts.** A thumb-piano Shaker melody, woody bass, and a small hand-drum circle.

**Drunken Sailor.** A short, rowdy shanty riff over a lopsided kick and snare break.

**Scarborough Fair.** A D-Dorian glass refrain with a low drone and widely spaced hand percussion.

**Sakura.** The E-Phrygian cherry-blossom melody, with deep piano and delicate bongo taps.

**Amazing Grace.** A lilting six-beat guitar phrase, piano roots, glass responses, and a brushed-feeling drum waltz.

**Auld Lang Syne.** A bright piano toast, a climbing upper register, and warm snare-and-bongo replies.

**Greensleeves.** A six-beat glass waltz, plucked low strings, and a rolling high/low bongo conversation.

**Oh! Susanna.** A fast marimba hoedown with a picked bass and alternating hand drums.

**Shenandoah.** An unhurried river-song guitar line, resonant piano bass, and soft high glass.

**Brahms’ Lullaby.** A small piano music box with a descending high answer and a gentle three-beat bongo pulse.

**Pachelbel’s Canon.** The descending Canon line and its eight bass changes, wrapped in a sparkling four-on-the-floor arrangement.

**New World Largo.** The Largo’s opening melody, spacious piano bass, and a slow, low-bongo heartbeat.

**Mango Moon.** A sunny, syncopated marimba hook over a tumbling clave groove and a kalimba crown.

**Velvet Meteor.** A wide minor glass melody, a weighty broken beat, and dry little guitar sparks.

**Bongo World Carnival.** Every node joins a bright hand-drum carnival: a rising marimba hook, low guitar, and tiny glass fireworks.

**Midnight Circuit.** A minor-key night drive with pumping kick, an insistent piano hook, and glass lights at the top of the planet.

**Seven-Step Sun.** A full-scale kalimba climb and diving answer, with quick broken drums and very high marimba flecks.

**The Planet After Rain.** A spacious guitar melody through five registers, a deep half-time pulse, and a quiet halo of glass.

This inventory is generated by **scripts/generate-songbook.ts**. Machine playback, file round-trips, node coverage, musical grid, bounded repetition, and browser audio are checked separately from subjective listening.
