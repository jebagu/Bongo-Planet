# Bongo Planet menu cleanup

- Non-Guitar palette icons raised 5 pixels; DOM bounds show 6 pixels between icon box and label. Guitar unchanged (1 pixel gap). Native screenshot confirms labels do not cover instrument artwork.
- Play status copy, Move piece, reach/offset/enabled controls, Clear, Export and stage caption removed. Live DOM count for all removed selectors: zero.
- Generator editor fields: period and travel. Route behavior remains visible. Interval change from 8 to 4 beats succeeded; Undo restored 8 beats.
- Your planet groups Patterns, Edit look, Undo/Redo, Save/Load/Import in aligned rows. One trash button. Edit look opened and closed successfully.
- Live Toy Ensemble playback succeeded: 155 route hits with zero engine/audio late drops at the captured check. Preview left paused with Generator 1 selected. Browser error logs empty.
- Responsive 390 by 844 check: document scroll width 375, no horizontal overflow; same removed-controls and single-trash checks passed. Viewport override reset.
- Production build passed. 72 focused tests passed across six files (piece panel, instruments, route journeys, songs, appearance, art package). Art ZIP rebuilt with 43 manifest files; ZIP integrity passed.
- Only existing Harmony Bloom audio recordings are used. Legacy reach, phase and enabled values retained in scene data to preserve existing compositions.
