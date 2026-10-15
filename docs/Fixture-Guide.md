# Bongo Planet — fixture definitions and independent expectations

**Population status:** F00–F09 now exist in `public/fixtures/`; exact IDs, measured coordinates and independent first-emission delay tables are in [fixture-tables.md](../evidence/step-02/fixture-tables.md), with [topology.json](../evidence/step-02/topology.json) and [geometry.svg](../evidence/step-02/geometry.svg). Deterministic and offline results are recorded in the acceptance evidence. Human listening and live-output qualification remain open.

**Current composition rules:** read the [creation guide](../Creation-Guide.md). F00–F14 are saved version-one compatibility fixtures; the app's Empty planet action starts a fresh version-two scene. F15/F16/F17 cover current gated playback. Their independent oracle at constant tempo is `emission time + hops * 15 / BPM`, independent of measured edge lengths. At 120 BPM Switch Chain sounds at 125/250/375 ms; Switch Fork sounds at 125 ms then two voices together at 250 ms. Infinite Circuit advances on the same sixteenth-note grid. The angular oracle below is scoped to the older radial fixtures. `tests/musical-grid.test.ts` additionally covers all 270 struts, shared source phases, live joining, tempo changes and thirty simulated minutes without drift; the browser counterpart checks actual worklet events at 60/15/2 render FPS.

Use topology `icosa-3v-v1` and versioned scene schema from [Rules.md](../Rules.md). Composition axes are x=right, y=forward, z=up; rendering maps `(x,z,-y)`. Every populated fixture needs actual scene JSON, stable piece IDs, vertex IDs, a labeled image/table, normalized coordinates, independent measured angular distances, computed delays, and a prose listen/watch script. Save the exact fixture/source revision beside run evidence. Fixtures must respect one piece per slot and the supported limits.

| ID / name | Required contents | Independent expectation / review use | Population status |
| --- | --- | --- | --- |
| F00 — Empty | Zero pieces, visible structure | No pending triggers or sound; startup/Clear reference; default musical settings | Populated: [F00.json](../public/fixtures/F00.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F01 — First pattern | One generator, two notes, one beat | Short legible repeating phrase; basic editing, save/load, transport and receiver demonstrations | Populated: [F01.json](../public/fixtures/F01.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F02 — Chord | One generator and three distinct pitches on symmetric equal-distance vertices | Independently measured equal angles produce shared onset with separate pitch/voice/trigger identity | Populated: [F02.json](../public/fixtures/F02.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F03 — Distance phrase | At least three notes with distinct default-quantization ticks | Independently calculated increasing distances produce at least three labeled onset times | Populated: [F03.json](../public/fixtures/F03.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F04 — Overlap | Two generators, periods 3 and 4, shared notes/beats; identical-pitch/same-onset case | Separate generator provenance/trigger IDs and voices survive coincidence; no deduplication | Populated: [F04.json](../public/fixtures/F04.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F05 — Edit during travel | Long travel allowing named actions between emission/onset | Pre-emission edits affect that pulse; post-emission edits retain committed delay/sound; current position used at onset; delete cancels; disable permits emitted pulse; pause/Clear/load invalidate old work | Populated: [F05.json](../public/fixtures/F05.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F06 — Dense | All 92 slots: 4 generators, 44 notes, 44 beats; full reach, short periods, long releases | Voice cap/level/event bounds, readability, save/load, 30-minute repeated-edit soak; this is not maximum-generator workload | Populated: [F06.json](../public/fixtures/F06.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F07 — Directions | Pieces nearest right/left/forward/back/up/down, actual coordinates; separate exact cardinal probes | Fixed IDs/XYZ under orbit; receiver coordinate mapping. In hall, required listener direction results are independent of outgoing logs | Populated: [F07.json](../public/fixtures/F07.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F08 — Maximum workload | All 92 slots: 8 generators and 84 long-release sound targets; full reach, period 1, 180 BPM | Maximum 672 generator×target fanout per simultaneous batch; up to 2016 committed triggers/sec; 64 active voices with deterministic counted stealing; queues within 5376 cap | Populated: [F08.json](../public/fixtures/F08.json); exact coordinates and first-emission expectations in fixture-tables.md. |
| F09 — Overtaking and queue capacity | Period-8 pulses followed by tempo increase, supported settings only | Already emitted absolute arrivals survive overtaking by later emission; no duplicate/replay; observe queue bound and visible pause on overflow | Populated: [F09.json](../public/fixtures/F09.json); exact coordinates and first-emission expectations in fixture-tables.md. |

## Legacy radial timing oracle

For normalized vectors `u,v`, independently calculate `theta = acos(clamp(dot(u,v), -1, 1))`. Surface delay in beats is `travelFraction * period * theta / pi`; inclusive reach has `1e-9` radian tolerance. Quantization off preserves raw delay; 1/32 and 1/16 grids are 0.125 and 0.25 quarter-note beats. Nearest ties round upward; clamp to last tick strictly before next emission. Compute expectations independently of the engine being tested.

Analytic pure-engine probes at 120 BPM, period 4, travel fraction 0.75: 30° = 0.5 beats = 250 ms; 60° = 1 beat = 500 ms; 90° = 1.5 beats = 750 ms. These stay unchanged under default 1/16 quantization. Two distinct pitches at 60° both start at 500 ms with separate trigger/voice identity. Also test angular 0, pi/2, pi, quantization ties, and last-tick clamp independently of fixture mesh selections.

A fresh scene's first generator starts at beat zero. Explicit Pause stays paused; load starts paused at beat zero. Added/enabled/period/phase-edited generators join future boundaries strictly after current beat. Key/sound snapshots commit at emission; source position refreshes at onset. Tempo edits apply at next integer beat and never rewrite absolute committed onset seconds. F05/F09 tables must show both beat/time and epoch identity.

## Coordinate probes

| Direction | Exact normalized composition vector |
| --- | --- |
| right | (1, 0, 0) |
| left | (-1, 0, 0) |
| forward | (0, 1, 0) |
| back | (0, -1, 0) |
| up | (0, 0, 1) |
| down | (0, 0, -1) |

Exact cardinal probes test protocol/calibration; they are not invented mesh vertex IDs. F07 nearest-vertex directions must retain actual measured coordinates and offsets. Camera rotation cannot alter composition vectors. Venue calibration uses a separate measured output-profile transform.

## Live-output and position trace protocols

The live audio gate captures at least 120 actual output onsets spanning F02/F03/F06/F08, including 100 ms and 250 ms main-thread stalls. Estimate fixed latency from isolated probes and compensate only that constant. Report median <=5 ms, p95 <=10 ms, maximum <=20 ms, every per-onset error, and any missing/duplicate ordinary events. Record laptop/browser/audio route/sample rate/stall times. Audio-render-thread suspension is a separate interruption/recovery test. Offline PCM or scheduled event times alone cannot pass live output. Visual sync uses at least 30 captured audiovisual triggers, median <=50 ms/p95 <=100 ms, with compensated actual audible output.

For movement, compare actual receiver traces at 60/15/2 render FPS. Independent 50 Hz position updates must give p95 age <=40 ms, maximum <=60 ms, final position error <=1e-6, no stale regression or ID change. Test 120 ms manual relocation interpolation and its final update; use monotonic clock/clock uncertainty in trace interpretation. At bufferedAmount >64 KiB coalesce unsent positions newest per object, resume with latest full snapshot, and visibly disconnect/watchdog-release after 500 ms congestion. Never coalesce trigger/cancel controls. Venue renderer interpolation remains a separate Steps 11–13 physical-route qualification.

## Fixture provenance record

For any changed fixture record: actual filename/hash; schema/topology version; per-piece stable ID/type/vertex/coordinates/settings; independent angle/delay/onset table; action schedule; expected cancellations/voice stealing; labeled image; human review script; source revision. Preserve failed evidence and original exported files. Do not replace an unavailable unfamiliar-player, listening, venue, or physical-device check with a fixture demonstration.
