# North Pole Trickle — Bongo Planet

Choose **Load preset → Favorites → North Pole Trickle**, then press **Play**. The preset is permanently listed as `N01`, including in the production build. You can also import `Bongo-Planet.json` to load its complete music and visual look.

One generator sits at junction 38, one of the two northernmost available junctions. The mesh has no junction exactly at the mathematical North Pole. It emits once every 12 seconds at 40 BPM. Four directed streams descend through horizontal bands; every exit goes to a lower junction. The sound reaches the southernmost junctions after 4.875 seconds, then rests before the next pulse.

Glass gives way to Kalimba, Marimba and Piano while the C-major pentatonic melody descends from C6 to C3. Notes in a band arrive together. The 0.62-second tails allow at most two neighboring bands to sound at once. Two silent junctions in the first band keep the upper routes aligned.

The look uses an Ink planet, Star field sky, small instruments, bright white sparks and gold downward arrows.

`validation.json` records strict import round-trip, actual topology adjacency, downward-only crossings and a 35-second engine simulation at a 128-sample/48-kHz quantum: three emissions, each instrument once per emission, no overload and at most two sounding layers.

The composition was imported into the running local app. Its controls showed 40 BPM, Generator 1, an 8-beat interval, finite 13-hop travel and Emit new sparks enabled. Playback showed the Pause button; the screenshot is retained at `evidence/north-pole-trickle/browser-playback.jpg`. Audible quality and live audio-onset accuracy were not separately measured.
