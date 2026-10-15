import {mkdir,writeFile} from 'node:fs/promises';
import {CLASSIC_SONGS,classicSongScene} from '../src/core/classics';
import {exportCompositionFile} from '../src/compositionFile';
import {DEFAULT_APPEARANCE} from '../src/view/art/appearance';
import {isPercussion} from '../src/core/instruments';

await mkdir('public/songs',{recursive:true});
await mkdir('public/fixtures',{recursive:true});
const tracks = [];
for (const song of CLASSIC_SONGS) {
  const scene = classicSongScene(song);
  const file = `${song.id}-${song.title.normalize('NFKD').replace(/[^a-zA-Z0-9\s-]/g,'').trim().replace(/\s+/g,'-')}.json`;
  await writeFile(`public/fixtures/${song.id}.json`,JSON.stringify(scene,null,2)+'\n');
  await writeFile(`public/songs/${file}`,exportCompositionFile(scene,DEFAULT_APPEARANCE)+'\n');
  const sounds = scene.pieces.filter(piece => piece.kind === 'note');
  tracks.push({id:song.id,title:song.title,artist:song.artist,genre:song.genre,nodes:scene.pieces.length,totalNodes:92,
    generators:scene.pieces.length - sounds.length,percussion:sounds.filter(piece => isPercussion(piece.instrument)).length,
    bpm:song.bpm,meter:song.meter,description:song.description,file,source:song.source});
}
await writeFile('public/songs/classics.json',JSON.stringify({title:'Bongo Planet — 20 classics',tracks},null,2)+'\n');
const references = CLASSIC_SONGS.filter(song => song.source).map(song => `- [${song.title} — reference for the short hook](${song.source})`).join('\n');
await writeFile('docs/Classics.md',`# Bongo Planet — 20 classics

In **Presets**, **Pachelbel’s Canon** and **Toy Ensemble** are the first two songs, in Favorites. Dividers separate [Reworked covers](Reworked.md), the 20 **New classics**, the four [Video game themes](Video-Game-Themes.md), and **More presets**, containing the other existing examples. Select a song and press **Play**. Selecting a preset starts paused and keeps your current look.

These are compact instrumental arrangements of recognizable hooks and opening phrases: six pop, six rock, five classical, and three jazz. Each occupies **82–88 of the 92 nodes**. The music uses actual bass motion and chord tones for its selected passage, with the hook kept louder than the accompaniment. Bass-led songs put their hook in the lower registers. Classical arrangements use softer percussion and longer overlapping notes.

All music uses the current shared sixteenth-note grid and finite directed routes. The opening triplets of Moonlight Sonata are three adjacent hops per group, and In the Mood uses a 3:1 long-short pulse. These are short loop adaptations, not full recordings or complete scores. The music uses one diatonic pitch collection per planet; the selected passages fit that collection, including the parent scales for the modal rock riffs.

| Song | Artist / composer | Style | Occupied nodes | Tempo | Import file |
| --- | --- | --- | --- | --- | --- |
${tracks.map(track => `| ${track.title} | ${track.artist} | ${track.genre} | ${track.nodes}/92 | ${track.bpm} BPM | [${track.id}](../public/songs/${track.file}) |`).join('\n')}

${tracks.map(track => `**${track.title}.** ${track.description}`).join('\n\n')}

The [first 20-song collection](Songbook.md) remains available. Individual files in **public/songs/** include music and the default look; use **Import** to load one, or **Export** to keep your edited version. Regenerate this collection with **npm run songs:classics**. Data and arrangement rules are in **src/core/classics.ts**. Machine tests check every occupied sound node, hook pitch and rhythm, bounded playback, portable imports, menu order, and live browser audio; musical preference remains a listening judgment.

## Hook references

The arrangement and accompaniment are written for this planet. These references were used to check the short motifs and their pitch collections:

${references}
`);
console.log(JSON.stringify(tracks.map(({id,title,nodes,percussion}) => ({id,title,nodes,percussion})),null,2));
