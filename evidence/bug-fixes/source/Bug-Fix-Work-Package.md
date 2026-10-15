# Bongo Planet — bug-fix work package

**12 October 2026 · Status: implemented; verification and review recorded in [evidence/bug-fixes/review.md](./evidence/bug-fixes/review.md)**

Source: the user's requested interface and interaction tweaks. This is a follow-up to [Work-Package.md](./Work-Package.md) and [Game-Design-Brief.md](./Game-Design-Brief.md). It supersedes their ordinary-screen layout and implicit click-to-relocate behavior wherever those conflict with the requirements below. Existing musical, occupancy, audio, storage, and output contracts still apply.

**Authorization:** the user authorized implementation with “run it” on 12 October 2026. The changes are implemented and served at the permanent local URL. The linked review records automated results and the remaining Safari, physical-touch, and human-review checks separately.

## Result

The ordinary play screen has the title **Bongo Planet**, one compact menu on the left, the sphere, a small trash target beside it, and a utility tray at the very bottom. Remove decorative and instructional copy. Repeated clicks with an active placement tool add new pieces even while the latest piece is highlighted. Existing pieces can be dragged to the trash. The sphere can be rotated continuously in every direction, including through both poles.

## Requirements

### BF-01 — simplify and consolidate the interface

The top-left title reads only **Bongo Planet**. Remove the subtitle, decorative brandmark, centered slogan, and How to play button/dialog from the ordinary interface.

Remove the following visible copy and associated empty layout space:

- “A musical constellation” and “YOUR OWN LITTLE UNIVERSE”.
- “How to play”, “01 / BUILD YOUR PATTERN”, “Give your world a rhythm.”, and the introductory instructions.
- The explanatory subtitles beneath Generator, Note, and Beat, and the palette drag/tap instructions.
- “Explore a constellation”, “YOUR CONSTELLATION”, and the decorative scene heading, including “EMPTY WORLD”.
- “Drag empty space to turn · Scroll to zoom”.
- “02 / SHAPE THE SOUND”, “The whole planet”, and the empty-selection promotional text.
- The bottom caption “Distance is a rhythm.” / “Equal distances make a chord.” and its decorative icon.

Keep short labels that identify actual controls, their values, and necessary error/status feedback. The request to remove the bottom rhythm caption does not remove the functional Rhythm grid control.

Move the entire right-hand inspector into the left menu; remove the right sidebar. Arrange the left menu in this order:

1. Generator, Note, Beat palette.
2. Selected-piece controls, when a piece is selected.
3. Global controls: Tempo, Key, Scale, Pulse travel, Rhythm grid, and Volume. Volume sits with the other sliders.
4. Play/Pause and necessary audio enable/recovery controls and compact audio status.

Play/Pause moves out of the footer into this menu. Preserve the existing single transport toggle and audio activation behavior. Do not merge Play and Volume into an ambiguous control.

Provide a compact utility tray at the very bottom containing Instrument diagnostics, Clear, Save, Load, and Export. Move the existing Undo, Redo, Import, and fixture/example selector into this same tray so they remain available without creating another menu. Use a short functional label such as “Examples” for the selector. Instrument diagnostics remains collapsed by default; expanding it reveals its existing information and bridge/render controls within the bottom area. Keep vertex/piece IDs and other technical details in diagnostics rather than in decorative play-screen text.

Keep the small trash target beside the sphere, adjacent to the left menu. It is an interaction target, not another settings panel. On narrower viewports, the left menu and bottom tray may scroll/wrap; controls and the trash target must remain reachable and must not cover the active drop destination. Preserve accessible names for icon-only controls without adding paragraphs of visible instructions.

### BF-02 — persistent placement, independent of highlight

Reported reproduction: choose Note, click an open vertex A, and the new note is highlighted. Click open vertex B. The current behavior moves the highlighted note from A to B. The required behavior leaves it at A and places a second note at B.

Required interaction contract:

- Generator, Note, and Beat are persistent placement tools. A successful placement does not clear the active tool.
- Clicking an open vertex while a tool is active creates a new piece of that kind, with a new stable piece ID. The newest piece is highlighted and its controls appear in the left menu.
- Highlight/selection identifies the piece being inspected. It does not change a subsequent placement click into a move.
- Switching palette tools changes the kind of subsequent placements. Clicking the active palette tool again, or pressing Escape when no drag is in progress, exits placement mode. Reflect the active tool visually.
- Clicking an occupied vertex selects its existing piece without duplicating, overwriting, or moving it. Selection alone does not clear an active placement tool.
- Dragging an existing piece from its own position explicitly moves that piece, even if a placement tool is active. Preserve its ID and settings. An empty-slot click never implicitly moves a highlighted piece.
- Preserve the existing non-drag relocation alternative through a deliberate Move action in the selected-piece controls: choose Move, then an open destination. This explicit mode exits placement mode; it must not be entered merely by highlighting a piece.
- An invalid placement, occupied destination, outside drop, or cancelled gesture preserves the scene. Failed placement leaves the tool available for the next attempt.
- Empty-space drags still rotate the view. They must not place or relocate pieces. Escape during a drag cancels that drag first.

Treat tool state, selection state, and explicit movement intent as separate state. Clear/load reset transient gesture and tool state; neither may leave a drag or a stale selected ID active.

### BF-03 — drag existing pieces to a trash target

Add a small visible trash-can icon beside the sphere. Dragging an existing Note, Generator, or Beat onto it and releasing removes that piece from the composition.

- Highlight the target while a valid existing-piece drag is over it. Hovering alone never deletes anything.
- Commit deletion only on release inside the target. Recognize the target even after the pointer leaves the canvas; do not let generic outside-drop handling consume the action first.
- A palette item dropped on the trash is discarded without creating a piece or modifying the composition.
- Releasing elsewhere, Escape, pointer cancellation, focus loss, or a competing-pointer cancellation preserves the existing piece.
- Deletion uses the existing scene/history/audio/output path. It is one undoable edit, clears selection if needed, cancels a deleted target's pending triggers and releases its voices, and cancels a deleted generator's pending child triggers. Unrelated pieces continue according to the existing rules.
- Keep a non-drag delete action accessible from the selected-piece controls, using an icon with an accessible name. The trash target must also work with touch pointer input.
- Drag ownership stays with the piece until completion; neither rotation nor a second pointer may convert a cancelled gesture into deletion.

### BF-04 — continuous rotation in every direction

Allow repeated full turns horizontally, vertically, and diagonally, with smooth continuation through the poles. There must be no directional end stop, pole lock, or forced upright reset. Zoom keeps its existing bounds.

Use a camera/orientation approach that supports this behavior, such as quaternion-based trackball rotation. Merely widening azimuth limits on the current orbit controller does not satisfy continuous vertical rotation.

Rotation changes the view only. Piece IDs, occupied vertices, composition coordinates, distances, musical timing, and venue/source coordinates remain unchanged. Picking, near/rear visibility, drop previews, and drag targets must work after arbitrary rotation, including an upside-down view. Preserve mouse and touch gesture ownership, cancellation, resize behavior, and existing render-rate controls.

## Current source pointers

These source pointers include the original diagnosis; the implementation now separates placement from selection:

- `src/main.ts`: page markup, selection/tool state, inspector rendering, transport, scene actions, and deletion. Placement highlights the newest piece without clearing the tool; shared deletion uses the existing scene/history/audio/output path.
- `src/view/SphereView.ts`: palette/piece pointer routing, scene picking, trash drops, cancellation, explicit movement intent, and selection. The implicit selected-piece/open-slot relocation branch was removed. Camera navigation uses `TrackballControls`.
- `src/style.css`: three-column layout, header, captions, footer, diagnostics, and responsive rules.
- `src/core/history.ts`, scene contracts, and audio/output adapters: reuse the existing edit and cancellation semantics. Change them only if needed to satisfy the acceptance cases.
- Existing browser, engine, audio, and bridge tests: extend the relevant suites when implementing. Update prior tests that assume placement automatically exits or selection implicitly relocates.

## Ordered implementation and acceptance plan

The ordered implementation plan is retained below. Actual verification and outstanding review gates are recorded in the linked evidence checklist.

| Step | Depends on | Deliverable | Automated checks at the end | Human checks at the end |
| --- | --- | --- | --- | --- |
| 1 — consolidate the interface | Authorization | BF-01 layout, one left menu, bottom utility tray | Removed copy absent; one instance of each functional control; relocated control bindings work; diagnostics toggles; no clipped controls at desktop and narrow viewport | Review front screen with no selection and with each piece kind selected; all sliders and Play are on the left; utilities are at the bottom; sphere gains the former right-sidebar space |
| 2 — separate placement and selection | Step 1 | BF-02 persistent tools and explicit relocation | Place three notes with three open-slot clicks: count increases by three, IDs are distinct, prior vertices unchanged; repeat for Generator and Beat; switch/exit tools; occupied clicks select only; deliberate drag and Move action relocate once; invalid/cancelled actions preserve state | Reproduce the user's Note A → Note B sequence without reselecting Note; newest note stays highlighted; tune it and continue placement; move an existing piece deliberately |
| 3 — add trash deletion | Steps 1–2 | BF-03 target and shared deletion path | Drop each piece kind into trash; hover/cancel/outside release do not delete; palette-to-trash adds nothing; undo/redo restore/remove the same ID and settings; selected deletion clears stale UI; pending/active audio and output cancellations follow existing rules | Drag each kind off the sphere into trash and undo it; repeat with touch emulation; verify the target is obvious, reachable, and responds before release |
| 4 — remove rotation limits and integrate | Steps 2–3 | BF-04 continuous rotation with correct picking | Repeated horizontal/vertical/diagonal drags cross both poles; orientation changes remain finite and continuous; compare scene and composition/output coordinates before/after; placement, relocation, and trash still work from upside-down/rear views; cancellation and competing pointers remain safe | Make at least two full horizontal and two full vertical turns, reverse direction, and rotate diagonally; place and move pieces after crossing each pole; confirm no stop, snap, or upright reset |

Each acceptance statement is an individual check. Record its ID, expected result, actual result, and status: **passed**, **failed**, **blocked**, or **not run**. A passing build alone does not close an interaction check.

For the implementation review, run the existing `npm run build`, `npm test`, and `npm run test:web` checks, with focused browser regressions for these interactions. Use the permanent URL **http://127.0.0.1:5417/BongoPlanet/**; check port availability and retain strict-port behavior. Review in installed Chrome and Safari; distinguish touch emulation from any physical touch-device test.

Implementation evidence is under `evidence/bug-fixes/`: the review checklist, a source snapshot/manifest, environment and viewport sizes, screenshots showing the left menu/bottom tray, interaction videos, rotation traces, and test results. Human/device review remains distinct from the recorded automation and agent screenshot inspection.

## Completion gate

All four requirements pass their automated and human checks. Existing play/pause, selected-piece editing, save/load/import/export, undo/redo, diagnostics, audio cancellation, and output behavior still work. Any blocked browser/device or human check remains explicit. This package does not close the original implementation package's outstanding acceptance gates.
