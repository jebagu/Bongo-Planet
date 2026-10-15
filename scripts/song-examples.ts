import { writeFile } from 'node:fs/promises';
import { SONGS, songScene } from '../src/core/examples';
for (const song of SONGS) {
  const scene=songScene(song);
  await writeFile(`public/fixtures/${song.id}.json`,JSON.stringify(scene,null,2)+'\n');
  console.log(`${song.id}: ${song.song} (${scene.pieces.length} characters)`);
}
