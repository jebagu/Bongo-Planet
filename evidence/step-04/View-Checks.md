# Bongo Planet — sphere view checks

Checked with installed Google Chrome on macOS using Playwright, at a 1000 × 820 viewport. The isolated view harness uses an 800 × 760 canvas and real Three.js WebGL rendering. This harness checks presentation and pointer ownership separately from the musical engine.

The recording uses Playwright's locally cached FFmpeg. Install that small test-only dependency with `npx playwright install ffmpeg` if absent. The browser test explicitly uses the installed Google Chrome executable and software-WebGL fallback when required by headless rendering.

Commands:

```sh
npm run typecheck
npx vitest run tests/view-math.test.ts
npx playwright test tests/view-browser.spec.ts --workers=1 --reporter=line
```

Results: typecheck passed; 4 geometry tests passed; 5 browser tests passed.

- Mouse placement and relocation commit the expected vertices. A captured piece gesture survives leaving the canvas. Occupied and outside drops commit no move.
- Synthetic touch pointer cancellation, a competing non-primary pointer, and focus loss preserve placement state and release drag ownership.
- A real palette drag commits one placement; selecting the piece followed by an open slot commits one relocation. A palette tap does not report an invalid drop.
- All placements from rear projections resolve only to foreground slots. Empty-space orbit exposes previously hidden vertices while preserving the exact composition JSON; a newly exposed vertex accepts placement.
- Reduced-motion preference switches presentation, and 2 FPS rendering creates no additional placement or movement callbacks.
- Geometry checks cover mapped composition axes, surface-arc radii/endpoints, finite deterministic antipodal and near-antipodal paths, and wavefront angles across both poles and the far side.

Screenshots:

- `front.png`: generator ring, selected note orb, slot markers, and geodesic framework after a captured move and two rejected drops. The quiet rear hemisphere is visible through the foreground framework.
- `rear.png`: the same model after empty-space orbit, with a beat placed on a newly exposed vertex. Camera movement changed no previous model vertices.
- `reduced-motion.png`: generator selection with reduced motion and 2 FPS; emission feedback is a simple highlight.
- `interaction.webm`: the actual mouse acceptance run, including placement, captured relocation outside the canvas, and rejected occupied/outside drops. This isolated recording has no audio.

The shared local URL is `http://127.0.0.1:5417/BongoPlanet/`; the isolated harness is under `tests/view-harness.html` on that base path.

## Open acceptance evidence

These tests do not establish M1 acceptance. Audible/visible onset error and output-latency compensation require synchronized audio/frame measurement. Physical touch hardware, required-browser parity, and unfamiliar-user first-minute testing still need their own evidence. The view receives timestamps and renders feedback; it contains no musical scheduling or audio generation.

Basic settle, wavefront, arc illumination, onset highlights, and 120 ms surface move/trail feedback are implemented. Rich bloom, wander, and inside view are deferred as specified.
