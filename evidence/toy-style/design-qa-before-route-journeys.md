# Bongo Planet geometric-toy style acceptance

final result: passed

## Scope and visual truth

Source: design/mockups/2026-10-12/geometric-personality.png, 1487 × 1058 pixels.

Requested adaptation: the geometric characters, eyes, faceted planet, warm palette, and traveling luminous paths; remove wind-up keys; add an editable asset package and preserve a switch to the existing style. This is a reversible art skin for the current game, not a replacement of every control/layout in the illustrative mock.

Implementation: http://127.0.0.1:5417/BongoPlanet/.

Desktop comparison: evidence/toy-style/desktop.png, 1486 × 1058 pixels, measured CSS viewport 1486 × 1058. The in-app browser required a 1784 × 1270 override to yield that CSS size. Native capture also scales the visible page within its frame; comparisons used content-region proportions rather than claiming pixel-perfect measurements. Source and final implementation were inspected together in one paired-image tool result. Both show eight pieces and active music; event phase and precise placements differ because the reference is an illustration.

Other evidence: evidence/toy-style/final-preview.png (690 × 1079 native normal-view capture), evidence/toy-style/mobile.png (378 × 818 native capture; measured mobile CSS width 377, height 844), evidence/toy-style/original.png, and evidence/toy-style/editor.png. Browser viewport overrides were reset. The delivered tab uses the toy example and is paused.

## Comparison history and fixes

1. P2: tall/narrow stages cropped the new planet's sides. The toy camera now adapts its field of view to the stage aspect ratio. The original camera behavior is retained. Post-fix normal-view and mobile captures show the whole globe.
2. P2: the phone layout placed detailed controls before the sphere. Mobile toy layout now puts the palette and globe first. Evidence: mobile-before.png and mobile.png.
3. P2: larger artwork could push Play/Pause out of view inside a scrolled desktop palette. The toy transport now moves into the bottom utility toolbar; the original style restores it to its original parent. Post-fix evidence: final-preview.png and desktop.png. Style changes were exercised during playback after this fix.

## Required fidelity surfaces

- Typography: locally bundled Manrope 800 gives the title a heavier playful voice; existing DM Sans and readable control labels remain. Toy labels use 12–15 px depending on role; existing fine-print status/diagnostics remains smaller. No generated text is substituted for editable controls.
- Spacing/layout: the planet is the primary interactive region, with a compact palette and bottom transport. The current game's detailed inspector remains in its existing control column. Mobile prioritizes the sphere. No horizontal overflow was measured at the checked desktop or mobile widths.
- Colors/tokens: editable cream background, blue faceted sphere, yellow generators, mint notes, coral beats, and pale golden slots reflect the selected direction. Scene lighting affects mesh colors. Original restores its own existing palette independently of toy settings.
- Asset fidelity: real 3D meshes have distinct ring/capsule/rounded-block silhouettes, eyes, feet, and directional contact shadows. Generated transparent PNGs provide the palette illustrations. No wind-up hardware exists in the generator model or thumbnail. Paths follow spherical arcs with luminous cores, soft outer bands, and traveling beads; exact bloom strength differs from the illustrative mock and is adjustable.
- Copy/content: Bongo Planet is the exact title. Existing musical controls are retained; Visual style and Edit look identify the new controls. Appearance presets contain no composition fields.

Eyes, feet, ring shape, and path beads were legible in the full desktop comparison and generated asset views; an additional artificial enlarged crop was not needed for those simple shapes. The appearance editor was inspected separately.

## Browser interactions checked

- Load Toy ensemble and play/pause music.
- Select a chunky note by its body, move it to an open slot, preserve its pitch/settings.
- Switch to Original and back while music continues; selected note and settings remain.
- Toggle eyes and change size; reload and observe persisted values.
- Import theme.json through the file chooser; appearance resets to the supplied values.
- Run at 2 FPS rendering with audio still active; evidence/toy-style/low-fps.json records running=true, fpsLimit=2, eight pieces, and event sequence=306.
- Open/close the editor and inspect its controls.
- Check final browser console: no application errors or warnings returned.

The in-app download-event waiter did not capture the Blob export event, so browser file delivery for Export look was not independently verified. Its serialization/validation is covered by unit checks. The ZIP and all package assets were verified over HTTP, in the production build, and against manifest hashes.

## Automated verification

- Production build: passed.
- 26 test files / 286 tests: passed when excluding the separate render-bridge browser-launch integration test.
- Full suite attempt: 286 passed; tests/bridge-render.test.ts could not launch its separate Chrome process (SIGABRT / EPERM). This environment-blocked integration result is not a pass and was not repaired by changing unrelated output code.
- Four exported GLBs load with Three.js GLTFLoader.
- Transparent PNG alpha channels present.
- ZIP integrity passed; 14 manifest files verified, production copies matched, live asset routes matched.

## Follow-up polish

P3: optional cloud scenery, a planet mascot/logo, softer cinematic lighting, alternate expressions, and individual note color variants could move closer to the illustration. They are outside this character/path asset package. Palette PNGs retain their default appearance when live mesh colors or eyes are edited.

## Implementation checklist

- Character meshes, PNGs, editable defaults and CSS: complete.
- Portable GLBs, source copies, checksummed manifest and ZIP: complete.
- Reversible style selector and appearance editor: complete.
- Browser interaction, responsive and visual checks: complete.
- External render-bridge Chrome-launch integration: environment-blocked, recorded above.
