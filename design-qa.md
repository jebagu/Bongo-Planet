# Bongo Planet — one left control panel

final result: passed

Scope: six placeable pieces, then Play, Volume/Tempo and a contained selected-piece editor; all scene/look/diagnostic controls in the same sidebar. No top-right action or bottom bar. One trash control handles both click deletion and drag-to-delete. Generator Spark travel is independent per instance; friendly labels identify selected pieces; routing state is explicit.

Evidence: evidence/left-panel/desktop.jpg, song-generator.jpg, mobile.jpg, playback.json and verification.md. The prior toy-interface report is preserved in evidence/left-panel/previous-design-qa.md.

Visual checks: aligned field headings/readouts, matching-height controls in the two-column editor, compact six-card grid, clear selected character portrait/name, readable labels on the light sidebar against the star field, and one trash button. On narrow screens the same panel scrolls above the globe; no horizontal overflow or pinned bottom toolbar. Edit look continues to open from the sidebar.

Functional checks: Guitar 2 placement, click deletion, Undo and drag deletion; Generator 1 travel 25% while Generator 2 retains 75%; saved song route visible and switchable to automatic; names/travel round-trip in JSON/history; actual sample playback. Final build and 352 source tests passed (bridge-render excluded). Full browser/receiver and physical audio acceptance remain separate. Only the five Harmony Bloom samples are used by the game.
