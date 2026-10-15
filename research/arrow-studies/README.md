# Bongo Planet — fainter arrows

One isolated, interactive page with ten thinner or dimmer outline treatments.

**Permanent local URL:** http://127.0.0.1:5417/BongoPlanet/research/arrow-studies/

The default comparison is treatment 04, a 0.50 CSS-pixel white outline at 45% opacity. Treatment 10 is the faintest. Choose any numbered preview to compare it against the current outline. Drag a large planet to rotate, click an arrow or tab to the planet and use arrow keys and Enter to toggle the unchanged filled state, hide filled arrows, zoom, or reset. A choice is encoded in the URL fragment and never applied to the game.

`source-data.js` is an exported snapshot of the actual game's topology, contour, gate locations, scale, and colors. The globe is a vector projection of that geometry; its facet lighting is an approximation for this study. The baseline models the current world-space stroke, which scales with the planet. The ten proposed strokes are screen-space CSS pixels, so their stated width stays constant as you zoom. Their opacity affects outlines only. The filled arrow uses the source's unchanged amber/orange on color. Tiny OFF/ON examples are at 24px.

Regenerate the source snapshot from the project root with:

```sh
npx tsx research/arrow-studies/export-source.ts
```

The page is buildless and uses only local assets. Serve through the existing pinned Vite development server. It does not modify production source, composition storage, appearance storage, audio, or the public Bongo Planet Site.
