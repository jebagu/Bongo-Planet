# Bongo Planet — instrument stacks

Verified locally on October 15, 2026. Baseline checkpoint: `cbca787` (`V1.1`).

## Behavior

- Up to four sounding instruments share a junction, ordered bottom to top in the scene's piece array. The existing 92-piece total and exclusive generator junctions remain enforced.
- Layers rise perpendicular to the planet along their vertex's outward normal, with visible gaps and no camera-dependent displacement. Hover reveals four faint cylinder outlines, including with no palette tool selected. During placement, the next available cylinder brightens around the translucent preview.
- Each arrival plays all layers at the same timestamp, with separate trigger IDs, voices and cancellation. A stack does not multiply spark paths or hop decisions.
- New melodic layers suggest successive thirds; default C major produces C/E/G/B. Moving a layer preserves its pitch. Individual body selection and numbered portrait controls allow independent edits.
- Moves, deletion, Undo/Redo, Save/Load and Export/Import retain layer identities, order and routing. Removing a layer closes its gap. Reduced motion settles positions immediately.

## Verification

- Production build and TypeScript checks: passed.
- Initial stack implementation: 43 files, 694 unit tests and 35 browser checks passed, including ten engine/contract tests covering validation, layer order, pitch suggestions, shared arrivals, convergence, live edits and legacy playback.
- Surface-normal/cylinder revision: 25 targeted unit/reference tests and 13 browser checks passed. Seven stack checks cover real palette drags, individual editing/moving/deleting, Undo/Redo, portable saves, desktop/narrow layouts, reduced motion, touch placement, nonzero live AudioWorklet output, fixed radial positions through camera rotation, and cylinder hover without scene mutation.
- Six gate regressions passed for gesture cancellation, wiring preservation, keyboard operation, touch, empty planets and generator placement. Instrument hit priority now compares actual depth with the gate, keeping a visible arrow clickable when a body is behind it.
- Existing regression helpers now scroll sliders into view before native pointer gestures and account for the app's legacy instrument/travel migration. The preset helper reads its catalog through Node's filesystem, avoiding the existing browser-runner JSON import-attribute issue.

Audio evidence in `live-audio.json` contains four distinct triggers sharing one onset and a measured nonzero PCM peak. Screenshots show cylinder hover, the fourth-layer preview, the completed radial stack, and the narrow view. These checks cover Chrome and touch emulation; they do not replace physical listening, Safari, venue or device qualification.

## Try it

Open <http://127.0.0.1:5417/BongoPlanet/>. Place an instrument and hover over it to see the four outlined cylinders. Drag another instrument into the brighter next cylinder to add a layer. Orbit to see the stack from the side. Click a visible layer or its numbered portrait to edit it; each incoming spark plays the whole chord.
