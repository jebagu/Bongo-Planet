# Bongo Planet — coordinated strut sparks

For current equal-hop gated timing, chords and shared-grid alignment, read [Creation-Guide.md](../Creation-Guide.md) and [Rules.md](../Rules.md). Historical distance-driven particle behavior below applies to legacy version-one radial playback. Current gated particles follow the audio engine's per-edge timestamps, with variable visual speed, and play every occupied junction they pass.

Implemented October 14, 2026. Local preview: http://127.0.0.1:5417/BongoPlanet/.

The default generator effect is a luminous orb and short tail moving node to node on the visible struts. The network stays quiet; there are no expanding generator wavefronts, direct curved connection paths, or movement trails in this mode. Notes and beats react locally to actual onset events. Passing an occupied intermediate vertex does not generate a sound or reaction.

Routes use weighted shortest paths on the existing 92-vertex graph. Orb centers and tail segments follow the exact eight sampled chords used by the strut mesh, including when reversed. Each route fits the existing committed onset; the audio scheduler, angular reach, quantization, sound generation, and output packets are unchanged. Optional emission sourceVertex metadata retains the original launch vertex when presentation receives events after a generator move.

Moving a target keeps the spark's current position, chooses an endpoint of its current edge, and routes the remaining journey to the new vertex over the remaining time. Canceled journeys and deleted pieces disappear. Reset clears both journeys and musical feedback. Instant onsets have local reactions without outbound particles. Reduced motion hides traveling sparks and bounce, keeping color feedback and quiet struts.

Coincident sparks from the same generator emission moving in the same direction combine. Distinct emissions and generators remain separate. Rendering uses two instanced sphere meshes and one fixed tail buffer, with at most 128 visible sparks. Journeys beyond that drawing limit still receive local musical reactions. Visual pending state respects the engine's 5,376-trigger cap.

Edit look → Generator effects switches between Strut sparks and Legacy rings and paths. The choice persists and participates in appearance import/export, independently of the visual skin and composition. Old appearance files without pulseEffects adopt Strut sparks. Original plus Legacy rings and paths restores the earlier presentation. Effects changes preserve transport; legacy effects resume from subsequent events. Reset toy look restores Strut sparks.

The downloadable asset package includes editable effect sources and their topology/contracts dependencies. Regenerate it with `npx tsx scripts/export-toy-assets.ts`.

## Verification

- Production build and TypeScript checking passed.
- Unit suite: 300 tests passed in 27 files, excluding tests/bridge-render.test.ts (the separate Chrome-launch integration previously blocked in this environment; not rerun for this change).
- New routing/lifecycle tests cover all 8,464 vertex pairs, exact strut geometry, source provenance, moved targets, repeated continuous reroutes, coincident branches, cancellation/deletion/reset, instant notes, early telemetry, low-frame-rate skipping, and bounded state/render allocation.
- In-app browser: Toy ensemble playing with active sparks, zero expanding rings, and zero curved travel paths; no application console warnings/errors returned.
- Legacy effects worked during uninterrupted playback; Original and Geometric toys switched while the same audio session continued.
- Maximum workload: 92 occupied vertices, 64 active voices, 128 visible sparks at 2 FPS, two merged coincident sparks, no reported late audio/engine/telemetry drops. Geometry count stayed at 742 between the 60 FPS and 2 FPS samples. Evidence: evidence/strut-sparks/dense.json and low-fps.json. Counts are samples at different musical phases, not a frame-for-frame comparison.
- Reduced-motion behavior and movement/cancellation continuity were covered by automated model/render tests; this change did not repeat the full pointer-interaction browser suite.

Browser captures and diagnostics are in evidence/strut-sparks/. The final preview uses the toy showcase; the appearance selector remains on Strut sparks.
