# Bongo Planet route journeys — verification

October 14, 2026. Scope: selected Painted seams appearance and route-driven playback in the original Bongo Planet checkout.

- Production build/type checking passed.
- 28 unit files / 311 tests passed. The separate tests/bridge-render.test.ts browser-launch integration was excluded, as in the prior art work; it was not rerun here. The full browser/venue acceptance suite is not claimed.
- New tests cover all 92 sources across six reach settings, adjacency, reach coverage, distinct launch seams, constant speed, one route identity playing multiple pieces, PCM output beginning at passage time, movement/addition/deletion, pause/mode/interruption/capacity, backward-compatible scenes, and maximum-workload equality at 60/2 FPS render sampling.
- The in-app browser played Toy ensemble using seams/routes. live-hits.json and final-status.json record one route ID playing multiple instruments, local audio running, zero reported late drops, no expanding rings, and no curved destination paths.
- Native pointer dragging moved toy-4 to vertex 71 while music continued. moved-note.json records preserved pitch/settings and a route reaching that new vertex. Deleting it preserved journeys and changed occupancy to seven pieces (deleted-note.json).
- Maximum workload was explicitly switched to routes and muted for the run. dense-60fps.json and dense-2fps.json record 92 occupied vertices, 64 active voices, stable 558 geometry count, and zero engine/audio/telemetry drops. The 2 FPS sample reaches 729,341 route hits over approximately 220 seconds. Zero visible particles in one low-FPS sample is a phase/aliasing observation, not an audio failure; all journey timing continues on the audio thread.
- rollback.json/rollback.jpg record original skin, radial musical rules, legacy effects, zero route journeys, and resumed music. The original rhythm grid re-enables in that mode. Returning to routes preserves the existing transport session/beat; the final showcase was then reloaded for a clean state.
- Mobile check used a requested 390 × 844 viewport with actual 375 × 844 CSS content (15-pixel vertical scrollbar), DPR 1, no horizontal overflow. Native mobile.jpg is 375 × 812; the capture height differs from the emulated CSS viewport, so it is not claimed as a pixel-identical mobile comparison. Before the fix Play began at y=1198; after fixing the transport bar it is y=785..834, inside the viewport. mobile-before.jpg and mobile.jpg retain the comparison. The globe remains fully visible; main music controls remain scrollable.
- Desktop visual comparison used source and rendered evidence together at 1487 × 1058 CSS/DPR 1. The post-fix report is design-qa.md.
- Asset package rebuilt: 22 manifest files, all hashes and production copies verified; served ZIP matched local bytes and ZIP integrity passed. GLB loading tests passed. Native screenshots are JPEG files; the Image Gen source and palette assets remain PNGs.
- Browser console returned no application warnings/errors on the checked final view. Temporary viewport overrides were reset.

These checks do not constitute independent physical loopback onset-error measurement, venue/spatial-output qualification, unfamiliar-player acceptance, or physical mobile-device testing. Those remain the project's separately tracked gates.
