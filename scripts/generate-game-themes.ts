import { mkdir, writeFile } from 'node:fs/promises';
import { GAME_THEMES } from '../src/core/gameThemes';
import { classicSongScene } from '../src/core/classics';
import { exportCompositionFile } from '../src/compositionFile';
import { DEFAULT_APPEARANCE } from '../src/view/art/appearance';
import { isPercussion } from '../src/core/instruments';

await mkdir('public/songs', {recursive: true});
await mkdir('public/fixtures', {recursive: true});
await mkdir('docs', {recursive: true});
const keys = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const tracks = [];
for (const song of GAME_THEMES) {
  const scene = classicSongScene(song);
  const file = `${song.id}-${song.title.normalize('NFKD').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}.json`;
  await writeFile(`public/fixtures/${song.id}.json`, JSON.stringify(scene, null, 2) + '\n');
  await writeFile(`public/songs/${file}`, exportCompositionFile(scene, DEFAULT_APPEARANCE) + '\n');
  const sounds = scene.pieces.filter(piece => piece.kind === 'note');
  tracks.push({id: song.id, title: song.title, artist: song.artist, genre: song.genre,
    nodes: scene.pieces.length, totalNodes: 92, generators: scene.pieces.length - sounds.length,
    percussion: sounds.filter(piece => isPercussion(piece.instrument)).length,
    bpm: song.bpm, meter: song.meter, key: `${keys[song.key]} ${song.scale}`,
    loopBeats: song.period, loopSeconds: song.period*60/song.bpm,
    description: song.description, file, source: song.source});
}
await writeFile('public/songs/game-themes.json', JSON.stringify({title: 'Bongo Planet — classic video game themes', tracks}, null, 2) + '\n');
await writeFile('docs/Video-Game-Themes.md', `# Bongo Planet — classic video game themes

Choose **Load preset → Favorites → Tetris — Type A (Korobeiniki)** for the extended full-planet arrangement, then press **Play**. The other three themes are in **Video game themes**, after **New classics** and before **More presets**. Selection starts paused and keeps your current look.

Four instrumental adaptations cover a platformer, an adventure, a puzzle game and a role-playing series. Mario, Zelda and Prelude retain eight-beat excerpts. Tetris uses every one of the 92 nodes on one continuous 91-hop journey: the longest possible without revisiting a node. All use the shared sixteenth-note grid, finite directed routes and the planet's sampled instruments. Backing instruments answer during held lead notes.

Mario keeps the opening fanfare; Zelda holds its final F to finish the loop before the later chromatic and triplet passages. Tetris now includes the complete eight-bar main tune, a compact bridge adapted to natural minor, and a closing C–B–A cadence. Its 75 BPM grid gives the main tune a 150 BPM feel; the 24-beat loop lasts 19.2 seconds, six times the earlier two-bar excerpt. One generator and 91 sounding instruments fill the globe. The final A rings through the five remaining grid steps, so the next melody starts cleanly. Prelude uses the opening C-added-ninth figure, spanning C2–C6, rather than its later chord changes. All fit a single supported pitch collection per planet.

| Theme | Composer / source | Occupied nodes | Master tempo | Loop | Tonality | Import file |
| --- | --- | --- | --- | --- | --- | --- |
${tracks.map(track => `| ${track.title} | ${track.artist} | ${track.nodes}/92 | ${track.bpm} BPM | ${track.loopSeconds.toFixed(1)} s | ${track.key} | [${track.id}](../public/songs/${track.file}) |`).join('\n')}

${tracks.map(track => `**${track.title}.** ${track.description}`).join('\n\n')}

Individual JSON files include music and the default look. Use **Import** to open a file or **Export** to keep an edited arrangement. The [first songbook](Songbook.md) and [20 classics](Classics.md) remain in Presets. Regenerate this collection with **npm run songs:games**, or all collections with **npm run songs**. The catalog is in **src/core/gameThemes.ts**, with Tetris's full-planet score and arrangement in **src/core/tetris.ts** and the other builders in **src/core/classics.ts**. Reworked Tetris uses the same journey with an 82 BPM master grid (164 BPM feel) and stronger written expression.

## Score references

The linked transcriptions were used to check the selected notes and rhythms. Instrumentation, backing parts, tempo choices and loop endings are adapted for Bongo Planet.

${tracks.map(track => `- [${track.title} — score reference](${track.source})`).join('\n')}

The Final Fantasy reference is a later series arrangement of the shared Prelude motif. Tetris credits the traditional folk melody and Hirokazu Tanaka's game arrangement separately. [Square Enix's Prelude collection](https://www.jp.square-enix.com/music/lineup/item/SQEX-10740.html) documents the theme across the series.
`);
console.log(JSON.stringify(tracks.map(({id, title, nodes}) => ({id, title, nodes})), null, 2));
