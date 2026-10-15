# Bongo Planet — Painted seams and route journeys

final result: passed

## Scope and visual truth

Selected source: design/mockups/2026-10-14/painted-seams.png, 1487 × 1058 pixels. The user selected option 1 **as a visual style**, then authorized its build together with one spark per continuous route. The scoped target is the faceted planet, a single seam on each shared face edge, and route-driven musical encounters. The application's controls, exact 92-vertex topology, save/history/diagnostics and working layout remain. This is not a pixel-identical recreation of the illustrative control layout or generated piece placements.

Implementation: http://127.0.0.1:5417/BongoPlanet/.

Final desktop capture: evidence/route-journeys/desktop-final.jpg, 1487 × 1058 pixels; CSS viewport 1487 × 1058, DPR 1. The source and final implementation were opened together in one paired-image comparison input. Both show eight pieces in the same toy theme during playback. Spark phase, local reactions, and exact placements differ because the source is an illustration.

Mobile capture: evidence/route-journeys/mobile.jpg, 375 × 812 pixels. Requested viewport 390 × 844; measured CSS content 375 × 844 (vertical scrollbar), DPR 1. The native capture height differs from the emulated CSS viewport. Mobile review used content proportions and DOM rectangles rather than claiming pixel-identical mobile measurements. Images were not warped. Native screenshots are JPEGs; source art remains PNG. Temporary viewport overrides were reset.

## Comparison history and fixes

1. P2: seams were too faint, and the large gold placement dots sat slightly away from their seam junctions. Source and before-polish.jpg were opened together. Fix: 1.6-pixel lavender seams, stronger opacity, smaller dots positioned on the same radius-0.99 junctions. The final paired comparison confirms a single connection with no offset curved grid.
2. P2: musical halo rings added clutter around hit characters. Fix: Painted seams uses body brighten/squash; rings remain only for selection and the earlier curved look. The final capture has no musical halo rings.
3. P2: Play/Pause was below the initial mobile screen, beginning at y=1198. Evidence: mobile-before.jpg and DOM measurement. Fix: mobile transport is pinned to the bottom with space reserved for access to the final scene controls. Post-fix DOM rectangle is y=785..834 inside the 844px viewport, and mobile.jpg visibly shows playback control with the complete globe. No horizontal overflow was measured.

No actionable P0/P1/P2 visual issues remain in the selected style scope.

## Required fidelity surfaces

- Typography: bundled Manrope 800/navy title and DM Sans controls retain the source's playful direction. The existing 34px title, compact toolbar, and 12–15px controls remain rather than adopting the illustration's larger title/cards. The caption matches the source. Mobile labels and transport are readable; text remains real UI.
- Spacing/layout: globe is the main object, desktop palette remains left, utilities remain in the bottom tray, and phone layout prioritizes palette/globe. The whole globe fits. The new Pulse behavior control explains musical rules; existing save/history/diagnostic controls are retained. More compact palette/title and different object center are intentional under the user's visual-style selection.
- Colors/tokens: cream background, blue-purple faceted globe, lavender seams, yellow generators, mint notes, coral drums, navy eyes, white-gold orb. Actual Three.js lighting remains editable. Seam geometry coincides with face edges, eliminating the prior two-network appearance.
- Asset/geometry fidelity: existing transparent footless palette PNGs and real editable ring/capsule/block meshes are reused. Eyes remain optional; no feet or wind-up hardware. Native 3D is required for the existing rotatable game. The real 92-vertex network is denser than the illustrative mock. The source's long glowing route becomes local orb/tail lighting during playback, as stated in the concept brief. The scene is not a rasterized replacement.
- Copy/content: exact name Bongo Planet; caption “One spark. A whole phrase.” Existing instrument/scene controls remain functional. Route journeys and Original pulses distinguish musical rules. The disabled rhythm grid is explained. Appearance and playback remain independent.

Seams, character silhouettes/eyes and orb are large enough to judge in the full-size paired comparison; an artificial focused crop was unnecessary for this scoped geometry/style check. Small controls were inspected through browser state and the mobile capture.

## Functional evidence

Toy ensemble plays with stable particle IDs across multiple note/drum encounters. Native dragging and deletion work during playback. Routes launch on distinct neighboring seams, preserve speed per emission, and cross empty vertices. Character reactions use actual onset events. Original musical/visual rollback was exercised. Maximum workload ran at 60 and 2 FPS with no reported late engine/audio/telemetry drops and stable geometry counts. Browser console returned no warnings/errors. Build and 311 unit tests passed, excluding the separate bridge-render Chrome-launch integration. Asset package checksums, production copies, served ZIP bytes, and archive integrity passed.

Detailed evidence: evidence/route-journeys/verification.md. This pass does not close independent physical loopback, venue, unfamiliar-player, physical-device or full browser-suite acceptance gates.

## Follow-up polish

P3: manual route drawing/direction editing could give more control than automatic geometry-owned walks. Walks can retrace seams to visit another branch; instruments sound on each passage. This is the same particle returning, not a duplicate spark. Palette PNGs retain default colors when the live appearance is edited.

## Implementation checklist

- Single coplanar seams and aligned placement dots: complete.
- Persistent route particles with route-driven audio: complete.
- Local character reactions and footless editable assets: complete.
- Backward-compatible scenes and musical/visual rollback: complete.
- Build, unit/audio/model, desktop/mobile browser checks: complete.
- Rebuilt checksummed asset ZIP: complete.

The previous art QA report is preserved at evidence/toy-style/design-qa-before-route-journeys.md.
