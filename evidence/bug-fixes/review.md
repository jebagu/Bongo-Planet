# Bongo Planet — bug-fix review

12 October 2026. Implementation authorized by the user's “run it”. The requested code changes are implemented. Human acceptance and browser/device qualifications are reported separately below.

Local review URL: **http://127.0.0.1:5417/BongoPlanet/**. Vite runs on the pinned port with strict-port behavior. The existing project preview server was replaced with the development server at this same URL. The existing local bridge remains on port 5418.

## Implementation

- `src/main.ts`: removes decorative copy; consolidates palette, selected-piece controls, musical controls, Volume, and Play into the left menu; puts utilities and inline expandable diagnostics into the bottom tray. Placement and selection are independent. Move is explicit. All delete controls share the existing scene/history/audio/output edit path.
- `src/style.css`: replaces the three-column layout with the left menu and sphere; adds trash hover feedback and responsive wrapping. Expanded diagnostics occupies the tray's normal document flow so it cannot intercept Play or piece gestures.
- `src/view/SphereView.ts`: persistent tool-compatible routing, explicit movement intent, cross-canvas trash drops, safe cancellation, and TrackballControls with continuous pole traversal and bounded zoom. Camera pointer cleanup also covers blur and middle-button zoom.
- Browser regressions now use explicit Move, current projected slot positions, and a collapsed diagnostics tray before measuring canvas coordinates. Removed-caption tests now check the requested compact layout.
- `Rules.md`, `README.md`, and both work packages describe the current behavior.

## Environment and reproducibility

Node v22.20.0; installed Google Chrome 155.0.8059.39 on macOS. Chrome automation uses the repository's Playwright configuration and its existing SwiftShader launch option. This verifies real browser interaction and AudioWorklet/receiver behavior, but not physical audio output or touch hardware.

Viewport reviews: 1440 × 1000, 1180 × 800, and 390 × 844. The view harness also runs at 1000 × 820. Source snapshot and SHA-256 identifiers are in `source/` and `manifest.json`. Source files are retained without dependencies or bulk runtime assets.

Final verification result: **passed — build, 268 unit/integration tests, and all 37 installed-Chrome browser tests**. The final command was `npm run build && npm test -- --maxWorkers=1 && npm run test:web`, exit code 0. Commands and full output are retained in `verify-serial.log`. The initial `verify.log` is also retained: the existing native receiver integration test failed with “Native clock conversion uncertainty exceeds10ms” under the default concurrent unit runner. An earlier standalone unit/integration run also passed all 268 tests; a separate earlier attempt timed out waiting for a native onset. This renderer/UI change does not modify native scheduling or relax its timing budget. Serializing unit files resolved the observed verification failure; a sensitivity to parallel process load is an inference from these runs, not a completed native-clock diagnosis.

Chrome initially aborted at process launch inside the filesystem/process sandbox. Browser-dependent test commands subsequently ran with the granted process-launch permissions; those initial launch failures did not execute interaction assertions.

## Acceptance checks

The following Chrome checks passed against the implemented source in the targeted and broader regression runs. The final combined-run result is recorded above.

| ID | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- |
| BF-01-A1 | Header contains only Bongo Planet | Header text assertion; `desktop-empty.png` | passed |
| BF-01-A2 | Removed slogans/instructions/captions absent | Visible-copy checks and removal of caption/right-inspector elements | passed |
| BF-01-A3 | Functional controls appear once in the left menu | Palette/global control containment and count assertions | passed |
| BF-01-A4 | Selected controls work for all piece kinds | Inspector/global-field regression suite; `desktop-generator.png`, `desktop-note.png`, `desktop-beat.png` | passed |
| BF-01-A5 | Volume and Play are in the left menu | Containment assertions; actual native slider/transport tests | passed |
| BF-01-A6 | Utilities are in the bottom tray | Clear, Save, Load, Export, Import, Undo, Redo, Examples assertions | passed |
| BF-01-A7 | Diagnostics starts collapsed and expands safely | Toggle assertions; receiver test activates Play with diagnostics open | passed |
| BF-01-A8 | Narrow/short controls remain reachable without horizontal overflow | Scroll/reachability assertions; `layout-1180.png`, `layout-390.png` | passed |
| BF-02-A1 | Consecutive Note clicks create new pieces | Three placements; all previous IDs/vertices/settings unchanged | passed |
| BF-02-A2 | Consecutive Generator clicks create new pieces | Three placements with distinct IDs | passed |
| BF-02-A3 | Consecutive Beat clicks create new pieces | Three placements with distinct IDs | passed |
| BF-02-A4 | Newest piece highlighted while tool stays active | Selected ID and pressed-tool assertions after every placement | passed |
| BF-02-A5 | Occupied click selects without duplication | Scene equality and active-tool assertions | passed |
| BF-02-A6 | Switching/toggling tools and Escape behave deliberately | Kind checks; toggle/exit assertions | passed |
| BF-02-A7 | Highlight alone never relocates a piece | Empty-slot click preserves complete scene | passed |
| BF-02-A8 | Drag and explicit Move preserve identity/settings | Actual drag history and destination-click tests | passed |
| BF-02-A9 | Invalid/cancelled actions preserve model | Occupied/outside/cancellation and competing-pointer checks | passed |
| BF-02-A10 | Clear/load reset transient tool state | Tool-reset assertions and existing load/activation tests | passed |
| BF-03-A1 | Trash deletes each piece kind on release | Note/Generator/Beat drag-to-trash assertions | passed |
| BF-03-A2 | Trash hover highlights without deletion | Scene unchanged until release; `drop-active` assertion | passed |
| BF-03-A3 | Undo/redo restore/remove same piece in one edit | Full scene equality including stable ID and settings | passed |
| BF-03-A4 | Selected deletion removes stale inspector state | Null selection and empty inspector assertions | passed |
| BF-03-A5 | Palette-to-trash creates nothing | Full scene equality | passed |
| BF-03-A6 | Outside, Escape, cancellation, blur, competing pointer preserve piece | Full scene equality for every cancellation case | passed |
| BF-03-A7 | Touch pointer release deletes through same target | Handler-level touch emulation; no physical-touch claim | passed |
| BF-03-A8 | Deleted target cancels pending local and remote work | F05 pending count becomes zero; receiver clears; no later onset | passed |
| BF-03-A9 | Deleted sounding note releases its voice | Long-note AudioWorklet voice count becomes zero | passed |
| BF-03-A10 | Deleted generator cancels pending children | F05 generator removal clears pending trigger; target retained | passed |
| BF-04-A1 | At least two full vertical turns cross both poles | Accumulated sampled camera arc exceeds 4π; both pole directions and inverted up vector observed | passed |
| BF-04-A2 | At least two full horizontal and diagonal turns | Accumulated sampled camera arc exceeds 4π in each direction | passed |
| BF-04-A3 | Reversal and arbitrary rotation remain finite | Position/up/quaternion samples finite; reverse gestures work | passed |
| BF-04-A4 | Rotation preserves scene/composition coordinates | Full scene equality; separate F07 exact receiver XYZ/ID assertions | passed |
| BF-04-A5 | Picking/placement/movement/trash work after rotation | Actual creation, ID-preserving drag, deletion after repeated turns | passed |
| BF-04-A6 | Camera cancellation/blur releases ownership | Pointer capture released; later rotation usable | passed |
| BF-04-A7 | Zoom bounds retained | Camera radius remains within 2.3–5.5 | passed |
| BF-04-A8 | Render-rate independent output remains valid | Actual relocation/receiver trace checks at 60, 15, and 2 FPS | passed |
| VIS-01 | Agent inspects actual desktop/narrow layout | Reviewed generated desktop and narrow screenshots | passed |
| SAF-01 | Installed Safari interaction suite | Safari 26.5 driver refuses session: Allow remote automation is disabled | blocked |
| TOUCH-01 | Physical touch-device interaction | No physical-device test performed | not run |
| HUMAN-01 | User reviews layout and consecutive placements | Runnable build and screenshots/video provided; user review pending | not run |
| HUMAN-02 | User reviews trash affordance and continuous rotation | Interaction and rotation videos provided; user review pending | not run |

## Artifacts

- Screenshots: `desktop-empty.png`, `desktop-generator.png`, `desktop-note.png`, `desktop-beat.png`, `layout-1180.png`, `layout-390.png`, `persistent-placement.png`, `rotation-poles.png`.
- WebM videos named after the seven regression tests, covering placement, deletion, cancellation, sounding/pending audio, and camera behavior.
- `rotation-trace.json`: sampled camera/up/quaternion values, independent accumulated angular travel, and unchanged before/after scene.
- `browser-results.json`: final full Playwright report after verification.
- `verify.log` and `verify-serial.log`: initial concurrent-run failure and final verification transcript.
- `manifest.json` and `source/`: reviewed source/build identifiers.

No original milestone, human listening, physical venue, or iOS gate is closed by this interface work.
