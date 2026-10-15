# Bongo Planet — geometric toys asset package

Geometric Toys is the single Bongo Planet visual style. Rounded geometric characters have eyes and no feet or wind-up hardware. The faceted planet has one painted seam per shared triangular edge, with a persistent glowing spark playing instruments as it passes.

## Use in the game

Open http://127.0.0.1:5417/BongoPlanet/. Edit look offers 12 color swatches for the planet and each instrument, four gradient skies, a star field, eyes, happy bounce, friend size, sunshine and spark glow. Changes save separately from the composition. Save look and Load look move appearance JSON between browsers. Reset look restores defaults. Older Original/curved/legacy presets migrate to the single toy appearance.

The palette contains Generator, Guitar, Glass, Kalimba, Piano and Marimba. Play, Volume and Tempo sit directly below the palette. Generators expose Spark interval and Spark travel; the route indicator identifies automatic branches or a saved song path. All controls live in the left panel. Your planet groups the pattern picker, Edit look, Undo/Redo and Save/Load/Import. All live sound instruments use the five Harmony Bloom recordings; the art download excludes those proprietary WAVs.

Toy Ensemble demonstrates all five instruments. Twinkle Trail, Little Lamb, Row Your Boat and Morning Bells play short familiar song phrases. Song generators follow one connected seam path; every note is an editable character. Moving a song generator or choosing Use automatic routes returns it to automatic routing. The examples keep note order with constant-speed geometric timing, rather than reproducing a conventional score's exact rhythm.

## Files

- generator.glb, guitar.glb, glass.glb, kalimba.glb, piano.glb, marimba.glb and planet.glb: portable editable meshes without external textures or Blender dependencies.
- Six *-portrait.png files: portraits rendered from the actual character meshes. Live portraits regenerate when character colors or eyes change.
- theme.json: initial editable appearance defaults.
- showcase.json: Toy Ensemble composition.
- examples/F11.json through F14.json: four portable song scenes.
- source/toys.ts, appearance.ts, swatches.ts, toy-style.css and panel.css: editable art, sky and UI definitions.
- source/effects: route geometry, particle timing and core sources.
- manifest.json: byte counts and SHA-256 checksums.

Earlier generic note/beat meshes and three raster reference illustrations remain in the archive as historical assets. They do not add sound choices to the live palette. The illustrations were made with Image Gen; current portraits use the editable Three.js meshes.

## Edit and rebuild

Edit assets/geometric-toys/theme.json for defaults, src/view/art/toys.ts for proportions, and src/view/art/swatches.ts for colors/skies. Existing saved looks take precedence until Reset look. Run npx tsx scripts/song-examples.ts for song scenes and npx tsx scripts/export-toy-assets.ts for GLBs, sources, theme, examples, manifest and ZIP. Vite copies the package into the build.

Automatic routes depend on generator geometry/reach, not instrument destinations. Every route in an emission shares a constant speed. Moving or adding an instrument changes future encounters without redirecting the spark. Deleting a generator stops its journeys. At most 128 sparks are drawn with shared instanced geometry; active journey state is capped at 256 and pending sounds at 5,376. Reduced motion suppresses travel/bounce while retaining local onset feedback. Companion packets retain optional instrument identity. No third-party character artwork or Blender MCP is used.

Selected characters have saved friendly labels (Guitar 1, Marimba 2, Generator 1). The selected-piece editor uses a two-column control grid, shows the generator's routing behavior, and contains the one trash button used for both clicking and dropping. No top-right action or bottom toolbar remains. On narrow screens the same panel scrolls above the globe, with no pinned bottom controls.
