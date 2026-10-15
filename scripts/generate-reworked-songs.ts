import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {REWORKED_SONGS,reworkedSongScene} from '../src/core/reworkedSongs';
import {exportCompositionFile} from '../src/compositionFile';
import {DEFAULT_APPEARANCE} from '../src/view/art/appearance';
import {isPercussion} from '../src/core/instruments';
import type {Scene} from '../src/core/contracts';

await mkdir('public/songs/reworked',{recursive:true});
await mkdir('public/fixtures',{recursive:true});
const tracks = [];
for (const song of REWORKED_SONGS) {
  const scene = reworkedSongScene(song),original = JSON.parse(await readFile(`public/fixtures/${song.sourceId}.json`,'utf8')) as Scene;
  const file = `${song.id}-${song.title.normalize('NFKD').replace(/[^a-zA-Z0-9\s-]/g,'').trim().replace(/\s+/g,'-')}.json`;
  await writeFile(`public/fixtures/${song.id}.json`,JSON.stringify(scene,null,2)+'\n');
  await writeFile(`public/songs/reworked/${file}`,exportCompositionFile(scene,DEFAULT_APPEARANCE)+'\n');
  const notes = scene.pieces.filter(piece => piece.kind === 'note');
  const lead = notes.filter(piece => piece.id.startsWith(`${song.id}-melody-`) && piece.instrument === song.lead);
  tracks.push({id:song.id,sourceId:song.sourceId,title:song.title,artist:song.artist,feel:song.feel,lead:song.lead,
    bpm:song.bpm,originalBpm:song.originalBpm,nodes:scene.pieces.length,originalNodes:original.pieces.length,
    instruments:notes.length,percussion:notes.filter(piece => isPercussion(piece.instrument)).length,
    leadLevels:[Math.min(...lead.map(piece => piece.level)),Math.max(...lead.map(piece => piece.level))],
    description:song.description,file});
}
await writeFile('public/songs/reworked/index.json',JSON.stringify({title:'Bongo Planet — Reworked covers',tracks},null,2)+'\n');
// The expanded Tetris score uses a half-speed master grid for its eighth notes.
const faster = tracks.filter(track => (track.bpm-track.originalBpm)*(track.sourceId==='S43'?2:1) >= 8).length;
await writeFile('docs/Reworked.md',`# Bongo Planet — Reworked covers

Open **Presets → Reworked**. This group follows Favorites and contains **${tracks.length} separate cover arrangements**: the 14 covers from the first collection, all 20 classics, the four video game themes, and the four older melody presets. Pachelbel’s Canon and Toy Ensemble stay at the top in Favorites. All earlier versions remain selectable in their existing groups. The six original songs, Toy Ensemble, and the routing demonstrations have no Reworked copy.

The lead has written accents and a rise and fall in loudness across each phrase. Note lengths vary between connected lines, held arrivals, and shorter pickups. Piano and guitar carry the melodies; occasional glass is a quieter color. Bass, chord answers, and percussion have their own accents, with gaps at the ends of phrases. ${faster} covers gain at least 8 BPM in their musical pulse; the lyrical arrangements keep a relaxed pace. Mario also moves down an octave for a warmer lead register. The expanded Tetris arrangement uses a half-speed master grid: 75 → 82 BPM gives its main theme a 150 → 164 BPM feel.

The routes still spread across the globe. Seven local branching clusters play chord tones together or as short rolls, with quieter inner voices and stronger bass notes. This keeps a large arrangement without making every instrument another melodic tick. Empty junctions in the lead carry its written rests, and every occupied instrument node plays. Tetris uses its own longer 92-node journey, with accompaniment in the melody's held notes. These versions occupy ${Math.min(...tracks.map(track => track.nodes))}–${Math.max(...tracks.map(track => track.nodes))} nodes, according to the arrangement. Comparing the original and Reworked versions is the intended listening test.

The existing musical contract is preserved: every hop takes one sixteenth, and each sound stays aligned with its spark arrival. Jazz swing is written on that grid. There is no added timing jitter or automatic tempo ramp. Every part uses finite travel. Files in **public/songs/reworked/** contain music and the default look; preset selection keeps the look already open. Regenerate with **npm run songs:reworked**.

| Cover | Feel | Original → Reworked BPM | Occupied nodes | Import file |
| --- | --- | --- | --- | --- |
${tracks.map(track => `| ${track.title} | ${track.feel} | ${track.originalBpm} → ${track.bpm} | ${track.nodes}/92 | [${track.id}](../public/songs/reworked/${track.file}) |`).join('\n')}

${tracks.map(track => `**${track.title}.** ${track.description}`).join('\n\n')}

The catalog, source-cover references, expression, and arrangement are in **src/core/reworkedSongs.ts**. Musical preference is assessed by listening; automated checks verify the source melody, dynamics, rests, file imports, routing, playback bounds, source preservation, and browser audio.
`);
console.log(JSON.stringify({covers:tracks.length,faster,nodeRange:[Math.min(...tracks.map(track => track.nodes)),Math.max(...tracks.map(track => track.nodes))],tracks:tracks.map(({id,title,nodes,bpm}) => ({id,title,nodes,bpm}))},null,2));
