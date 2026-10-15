# North Pole Loop — Bongo Planet

Choose **Load preset → Favorites → North Pole Loop**, then press **Play**. You can also import `Bongo-Planet.json` to load its complete music and look.

One generator at the northernmost junction sends four slow streams down the layers at 40 BPM. They reach the bottom in 4.875 seconds, then climb quiet return lanes back to the generator in 4.125 seconds. The next pulse starts as they return: a closed nine-second cycle.

Four lower piano pieces move to neighboring outer junctions to leave the return lanes clear. The original pitches and instruments are retained. Two streams share each bottom note, with each voice halved in level to keep those notes gentle. The original **North Pole Trickle** Favorite and files remain available.

Each stream has finite 24-hop travel. It ends at the generator as the next six-beat pulse begins, so return arrivals cannot multiply the four-way split. **Pause** stops playback normally. The appearance matches the original composition file; loading a preset keeps the browser's current look.

`validation.json` records real neighboring connections, downward and uphill routes, quiet returns, one generator and 100 completed engine cycles without overload. Regenerate the composition and its fixture with `node --import tsx scripts/compose-north-pole-loop.ts`.
