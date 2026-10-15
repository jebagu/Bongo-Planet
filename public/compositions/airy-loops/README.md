# Airy Loops

A super slow, airy techno loop for Bongo Planet: 40 BPM, A minor, and a repeating 16-beat / 24-second arrangement.

Choose **Load preset → Favorites → Airy Loops**, then press **Play**. You can also import `Bongo-Planet.json` to load the music and its complete look. The complete file includes the Moon chalk planet, star field, toy instruments and white sparks. Imports start paused. The existing browser app is at http://127.0.0.1:5417/BongoPlanet/.

The kick and low marimba pulse every beat; the closed hi-hat answers halfway between. Four slower generators take turns entering the northern fork, launching four streams every four beats. Glass, piano, guitar and kalimba make an A minor 9 cloud, with a quiet F-colored answer and tiny bongo accents. Most junctions are silent, so the sparks keep traveling through the spaces between notes. Returning voices have restrained levels.

The routing uses 72 directed gates and 69 vertices. Every crossing takes one sixteenth note (375 ms). Each long northern circuit takes 24 hops / nine seconds; the generators include their approach hops in finite travel budgets so the streams finish at the northern fork. The complete pattern repeats every 24 seconds without accumulating sparks.

`Airy-Loops.wav` is a 24-second stereo loop rendered with the current engine, synthesizer and local samples. It includes preceding tails from steady playback and can repeat directly. Percussion keeps its natural sample length; melodic samples decay naturally, within their saved maximum duration.

`validation.json` records import/export validation, 16 cycles of engine simulation, finite travel, matching repeated onset patterns, audio headroom and matching PCM between repeated cycles. Simulation reached 13 simultaneous edges and 14 decisions in one render quantum; the offline mix used at most 18 voices, with no overloads, stolen voices or late drops.

Recreate the file and audio with `node_modules/.bin/tsx scripts/compose-airy-loops.ts` from the project root.
