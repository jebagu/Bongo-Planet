# Bongo Planet — implementation work package

**Version 0.3 · 11 October 2026 · Status: implementation in progress; acceptance gates open**

**Project name:** Bongo Planet. Use this exact name in the application, documentation, artifacts, and user-facing text. Follow the historical-name rule in `AGENTS.md`; previous project names are obsolete.

Source: [Game-Design-Brief.md](./Game-Design-Brief.md). This package turns the brief into an ordered build and acceptance plan. The brief remains the product reference. Defaults below are prototype decisions to test, not claims that the musical design or venue configuration has already been validated.

## The deliverable

Build a browser instrument in which a person can place generators, notes, and beats on a geodesic sphere, hear the resulting pattern, understand why it sounds that way, and save it. Deliver a separate, inspectable venue-output demonstration. Then qualify the actual Feÿ installation, develop the presentation, and bring the same musical rules to iOS.

The first complete release is **M1: a playable browser prototype plus a local bridge/test receiver**. It must be useful without venue hardware. M2 requires the actual venue sound path and a listening test in the hall. M3 and M4 are later releases with their own acceptance gates.

For each milestone, the reviewer receives:

- A runnable build, exact launch instructions, and an identified source revision or source snapshot.
- Named example scenes and a short review script with expected outcomes.
- Screenshots and recordings of the actual build, plus machine-readable test results where relevant.
- A checklist distinguishing **passed**, **failed**, **blocked**, and **not run**. An unchecked hardware or human test remains open.

This document authorizes no implementation, deployment, or outreach by itself. It specifies the work to execute when the build is started.

## Milestones and dependencies

| Milestone | Steps | Human-checkable result | Completion gate |
| --- | --- | --- | --- |
| **M0 — rules and engine proven** | 01–03 | Geometry diagram, fixture scenes, and readable expected-versus-actual event timelines. | Geometry, occupancy, musical timing, and editing rules pass deterministic checks. |
| **M1 — playable browser prototype** | 04–10 | Working sphere, mono sound, editing, save/load, basic animation, and a bridge receiver showing matching IDs and coordinates. | Browser review passes; an unfamiliar person completes the first-minute task; bridge evidence passes. |
| **M2 — Feÿ playback qualified** | 11–13 | Measured venue profile, working synthesis/rendering route, and observed directional playback. | Venue configuration, calibration, timing, and in-hall listening tests pass. |
| **M3 — performance presentation** | 14–16 | Polished visual treatment, optional wander/freeze, and an inside view. | Each feature preserves musical behavior and passes legibility and performance checks. |
| **M4 — iOS release candidate** | 17–19 | Installable device build, compatible scenes, and recorded device/lifecycle tests. | Musical parity, touch play, interruption recovery, and selected venue route pass on actual devices. |

Execute steps in order. Later work may be prepared while a venue or device gate is blocked, but cannot close that gate. A failed step is repaired and its affected tests rerun before dependent behavior is accepted. Finish M1 before adding wander, advanced effects, or iOS implementation.

**Working ownership:** the builder owns implementation and evidence; a human reviewer owns experience and listening acceptance. The venue technical owner supplies and validates rig information. Device acceptance requires someone with the named test devices. One person may fill several roles, but the unfamiliar-player test requires a person who has not learned the interface.

## Common review and evidence rules

Create `evidence/step-XX/` for every step. Each folder contains `review.md` with the build identifier, date, commands and environment used, test IDs, expected results, actual results, and links to artifacts. Include only evidence relevant to that step: a geometry table for an engine step, a screen/audio recording for an interaction step, or a receiver log for the bridge. Capture failures as well as passes.

Create `Acceptance-Checklist.md` during Step 01. Give every check in this package an identifier such as `S03-A1` or `S03-H1`, where A means automated and H means human. List checks individually; a paragraph containing three requirements means three checks. Initially mark them **not run**. A milestone closes only when its required checks pass. A machine test cannot substitute for a listening or unfamiliar-player test.

Tests must compare against independently specified expectations. For timing, calculate reference results from the rules and analytic examples below; do not generate the expected output using the same implementation being tested. For spatial playback, use the measured layout and a listener's observation; an outgoing coordinate log alone does not prove direction.

Record the reference laptop, operating system, browser versions, viewport, audio route, and sample rate. M1 requires current installed Chrome and Safari on that laptop; touch emulation checks gesture ownership, while physical touch-device results are reported separately. Use the same reference environment for performance comparisons.

Provide a short visible diagnostics panel in the prototype: transport beat/time, selected node ID and vertex, pending triggers, active voices, output state, and a rendering-frame-rate control for testing. Keep it collapsible. The ordinary play screen should remain compact.

### Local hosting contract

Planned permanent browser URL: **`http://127.0.0.1:5417/BongoPlanet/`**.

The project's `AGENTS.md` records this URL. In Step 01, pin port 5417 with strict-port behavior and use `/BongoPlanet/` as the application base path. Check port availability before launching. If occupied, identify and stop a stale Bongo Planet server where appropriate or report the conflict; do not silently choose another port. No server has been launched by this package.

The bridge defaults to loopback WebSocket port **5418**. Put its explicit endpoint in the local output configuration and document any browser connection requirements. A later LAN/venue endpoint is a configured output choice, not a change to the permanent browser URL.

## Prototype rules to establish in Step 01

These choices make the first build testable. Change them only with a recorded reason, updated fixtures, and a repeat of affected gates.

| Topic | Initial rule |
| --- | --- |
| Geometry | Full 3V geodesic sphere: expected 92 vertices, 270 edges, 180 triangular faces. Unit-radius musical coordinates; physical dimensions are output-profile data. Use deterministic vertex IDs and a named topology version. |
| Occupancy | At most one piece per vertex. Palette drops and moves commit atomically. Invalid/cancelled moves preserve the previous state. |
| Pieces | Generators are silent. Notes and beats produce independent voices when reached. No note-to-note propagation and no generator-to-generator triggering in M1. |
| Musical defaults | 120 BPM; C major; generator period 4 beats; phase 0; reach 90°; pitched sine voice; kick, hat, and snare choices. Silence until a sound node is triggered. |
| Initial transport | A fresh or cleared empty scene is ready. Its first generator placement starts transport at beat zero, so the first-minute interaction needs no separate Play action. Explicit Pause remains paused until Play; loading a saved scene remains paused until Play. |
| Generator controls | Period choices 1, 2, 3, 4, 6, or 8 master beats; phase as a fraction of the period; angular reach 0–180°; enable/disable. Include 3 and 4 beats for overlapping rhythmic cycles. |
| Emission grid | A generator emits at transport beats `k × period + phase × period`. A newly added/enabled generator joins the next eligible boundary; it does not replay missed emissions. |
| Surface distance | For normalized vertex vectors `u` and `v`, `theta = acos(clamp(dot(u, v), -1, 1))`. Reach is inclusive, with a documented numerical tolerance. Interior chord length is never used for musical timing. |
| Travel | Raw delay in beats is `fraction × period × theta / pi`. Default fraction is 0.75; adjustable range 0.25–0.75. Thus the same angular distance has the same raw delay at a given period, regardless of reach. |
| Quantization | Off, 1/32 note, or 1/16 note; default 1/16. In quarter-note beats these grids are 0.125 and 0.25. Round delay to the nearest grid tick, resolving ties upward, and clamp to the last grid tick strictly before the next emission. |
| Pulse commitment | At emission, commit eligible target IDs, travel delays, and sound parameters. Moving or changing a piece afterward affects subsequent emissions. Its position at onset is its current position. Lookahead scheduling must preserve this logical boundary, including edits before an emission. |
| Multiple generators | Preserve separate trigger IDs and provenance, including identical pitches at identical times. Use separate voices; no silent deduplication. Start with a 64-active-voice cap and a deterministic release/steal policy, visibly reported when reached. |
| Tempo/key edits | Tempo changes take effect at the next master beat, preserving beat continuity. Already emitted pulses retain their committed absolute onset times; a tempo increase may therefore let a later emission overtake an older arrival. The within-cycle guarantee applies at unchanged tempo/period. Key/scale and voice edits apply to subsequent emissions; sounding voices finish with their existing pitch/envelope. |
| Deletion/disable | Deleting a target cancels its pending triggers and releases active voices. Deleting a generator cancels its pending child triggers. Disabling a generator suppresses future emissions; already emitted pulses finish. |
| Pause/reset | Pause cancels pending onsets and releases voices within 100 ms. Resume continues the retained beat without replaying a backlog. Clear stops all activity and restores an empty sphere and default musical settings. Undoing Clear restores the scene paused. |
| Audio interruption | If the audio clock is suspended, show paused/interrupted state, reconcile the schedule, and require an explicit resume when needed. Never emit a catch-up burst. |
| Save/load | Versioned JSON stores topology, stable piece IDs, vertex IDs, and musical settings. Loading validates before replacement, stops the old session, and opens the new scene paused at beat zero. Camera, transient playback state, and venue connection details do not change musical meaning. |
| Coordinates | Composition axes are `x = right`, `y = forward`, `z = up`, in normalized sphere coordinates. Three.js maps to `(x, z, -y)`. Camera orbit does not transform composition coordinates. Venue calibration is a separate explicit transform. |
| Later movement | Manual relocation is a committed vertex move with a brief visual/source-position interpolation. Wander reserves its destination and traverses an adjacent surface edge; only arrival commits the destination vertex for musical relationships. No two pieces may reserve/occupy the same destination. |

Example independent timing reference: at 120 BPM with a 4-beat period, fraction 0.75, and quantization off, angular distances 30°, 60°, and 90° yield delays of 0.5, 1, and 1.5 beats: **250, 500, and 750 ms**. With 1/16 quantization, these examples remain unchanged. Two notes at 60° must share the 500 ms onset while retaining their distinct pitches.

For M1, browser sound is a mono mix. Use original synthesized voices and original interface assets. The NodeBeat archive is a mechanics/reference source; its flat-scene assumptions and broader features are not automatically Bongo Planet requirements. Consult its `ASSET-RIGHTS.md` before reusing material.

## Build decisions recorded during Step 01

See `Rules.md` for supported limits (8 generators, 92 total pieces, 40–180 BPM, 64 voices, 5376 pending triggers), F08 maximum-fanout stress and F09 overtaking stress, live-output timing budgets and measured-latency method, and independent 50Hz position freshness/coalescing/backpressure rules. Live-output capture, receiver trace comparison at 60/15/2 FPS, and renderer-specific interpolation are separate acceptance checks; scheduled timestamps/offline PCM alone cannot pass them.

## Reference scenes

Build these fixtures once and reuse them in tests and review. Each fixture has a scene JSON, a small labeled image/table of piece IDs and positions, and a prose explanation of what the reviewer should hear and see. Step 01 specifies them; Steps 02–03 supply actual deterministic 3V vertex IDs. Do not invent vertex IDs before the topology exists.

| Fixture | Contents and expected use |
| --- | --- |
| **F00 — Empty** | Zero pieces; visible structure; no pending triggers or sound. Startup and Clear reference. |
| **F01 — First pattern** | One generator, two notes, and one beat. A short, legible repeating phrase for basic playback/edit/save demonstrations. |
| **F02 — Chord** | Three distinct pitches at equal angular distance from one generator. Shared onset, separate voices. Choose symmetric 3V vertices and document the measured angles. |
| **F03 — Distance phrase** | At least three notes at distances mapping to three distinct default-quantization ticks. Label order and calculated delays. Also include analytic distance cases in pure-engine tests; the mesh need not contain exact 30°/60°/90° vertices. |
| **F04 — Overlap** | Two generators with periods 3 and 4 beats targeting shared notes/beats; include an identical-pitch/same-onset case. Log each generator and trigger separately. |
| **F05 — Edit during travel** | Long enough travel to move, delete, disable, pause, clear, or load between emission and onset. Named test actions and expected cancellation/commitment results. |
| **F06 — Dense** | All 92 slots occupied: 4 generators, 44 notes, 44 beats. Full reach, short periods, and long releases exercise voice limits, event bounds, readability, and storage. |
| **F07 — Directions** | Labeled pieces nearest right, left, forward, back, up, and down. Record their actual coordinates. Also provide exact cardinal vectors as protocol/calibration probes independent of mesh vertices. |

## Step 01 — establish the build contract

**Depends on:** the brief and this package. **Produces:** a minimal project skeleton, `AGENTS.md`, `README.md`, `Rules.md`, `Acceptance-Checklist.md`, fixture definitions, and scene/event contract definitions.

Set up TypeScript, Three.js, browser audio boundaries, and a test runner. Keep topology/model, musical engine, rendering/input, audio, storage, and output adapters distinguishable without building a general plugin framework. Add the pinned local server configuration. Document install/start commands and planned verification commands: `npm run test:engine`, `test:audio`, `test:web`, `test:bridge`, and `verify`. Create each command when its implementation exists; a placeholder success is not a pass.

**Renderer choice:** Use Three.js `WebGLRenderer`, backed by WebGL 2, for M1. Keep rendering and visual effects separate from the musical engine. Reconsider `WebGPURenderer` during Step 14 if a specific visual requirement or measured performance problem justifies it.

Define versioned scene data and event fields: session ID, trigger sequence/ID, generator ID, sound-node ID, scheduled onset, sound parameters, and composition position. Specify maximum settings, voice/event bounds, late-event policy, undo coverage, and invalid-input handling. Resolve any ambiguity needed to make Steps 02–09 deterministic in `Rules.md`.

**End-of-step automated tests:** install/build/type checks pass on the reference machine; server uses the configured path/port; invalid contract examples are rejected; valid minimal examples round-trip. If a test command is not implemented yet, its future checks remain not run.

**End-of-step human tests:** another reader can identify the M1 scope, run the empty shell at the permanent URL, and find the rules and acceptance list. The fixture descriptions explain expected outcomes without reading code. Confirm all milestone statuses are still open.

**Evidence and gate:** setup transcript, shell screenshot, contract examples, and completed Step 01 checks. **Pass only when the project runs and the next steps have unambiguous rules.**

## Step 02 — prove sphere geometry and occupancy

**Depends on:** 01. **Produces:** pure topology/occupancy model, populated fixture vertex tables, and a geometry report.

Generate the full 3V topology with normalized vertices, deterministic IDs, triangle/edge connectivity, and neighbors. Implement add, move, delete, and validation as atomic model operations. Keep game-node IDs separate from vertex IDs. Implement angular distance and reach checks. Create an inspectable geometry image labeling axes and selected fixture vertices.

**End-of-step automated tests:** counts are 92/270/180; Euler characteristic is 2; every edge belongs to two faces; the graph is connected; no duplicate vertices or zero-area faces; vectors are unit length within `1e-6`; IDs and fixtures reproduce across runs. Analytic distance cases return 0, π/2, and π; symmetric pairs agree. Occupied, out-of-range, and cancelled moves preserve the previous valid state. Every fixture respects occupancy.

**End-of-step human tests:** inspect the whole-sphere image and table, including the far side. Compare the selected symmetric chord vertices and the increasing-distance phrase vertices. Trace one legal move and one rejected move in a readable before/after report.

**Evidence and gate:** geometry image, counts/adjacency report, fixture coordinate tables, and operation transcript. **Pass when both the topology and slot rules are independently inspectable and correct.**

## Step 03 — prove the musical engine without the renderer

**Depends on:** 02. **Produces:** deterministic transport/event engine, golden event expectations, and readable timelines for F01–F05.

Implement generator phases/periods, target selection, delay/quantization, pitch assignment, multi-generator provenance, and cancellation. Inject the clock; the engine must not import Three.js, the DOM, or Web Audio. Define revisions/session epochs so old scheduled work cannot survive deletion, Clear, or scene replacement. Test changes on both sides of the emission boundary, even if an adapter has already prepared work through lookahead.

**End-of-step automated tests:** independent timing examples match within `1e-6` seconds; at unchanged tempo/period, all arrivals precede the generator's next cycle; reach boundaries obey the declared tolerance. F02 has shared onsets and distinct pitches; F03 has at least three distinct default onsets; F04 preserves both generators. F05 proves pre-emission edits affect that emission, post-emission moves retain committed delay, target/generator deletion cancels the correct events, and pause/Clear/load produce no old-session onsets. Tempo/phase edits do not duplicate or replay emissions; a tempo increase preserves any committed arrival overtaken by a later emission. Vary simulated render frequency without changing the event stream.

**End-of-step human tests:** open the timeline report. Read one chord, one phrase, and one overlapping cycle. Follow a moved note's old committed onset and next updated onset. Verify a deleted note has a visible cancellation entry and no later onset.

**Evidence and gate:** expected-versus-actual tables including sound IDs, angles, beat/time, provenance, and cancellations. **M0 passes when Steps 01–03 pass. No sound or 3D screenshot is required to claim this engine milestone.**

## Step 04 — make sphere placement and navigation usable

**Depends on:** 03. **Produces:** interactive empty sphere, palette, vertex picking, automatic connection previews, orbit/zoom, and basic piece selection.

Render the geodesic framework with visible slots and distinct Generator/Note/Beat shapes. Add palette drag, piece relocation, destination highlight, invalid-drop feedback, and surface-arc connection previews. Keep the rear hemisphere quieter and prevent picking a hidden rear slot through a foreground surface. Separate camera gestures from node gestures; cancel safely on pointer cancellation or focus loss. Support mouse and touch input, with a simple select-piece/select-slot alternative to dragging.

**End-of-step automated tests:** model state matches each successful drop; occupied/outside drops and `pointercancel` preserve state; orbit/zoom never change node IDs, vertices, or relationships; drag ownership survives leaving a node; resizing preserves selection and distances. Test touch gesture routing and competing pointers explicitly.

**End-of-step human tests:** place all three types, move a piece, attempt an occupied drop, cancel a drag, rotate to the rear, and place there. Check the intended destination and previews are clear. Repeat with touch emulation. An empty-space gesture moves the view, while a captured node gesture keeps moving that piece.

**Evidence and gate:** annotated front/back screenshots and a short interaction recording. **Pass when placement is predictable from every side and camera movement leaves the composition unchanged.**

## Step 05 — deliver the first audible vertical slice

**Depends on:** 04. **Produces:** working Web Audio adapter and a playable F01/F02/F03 in the actual browser.

Enable audio from the first deliberate interaction. Show “Enable sound” if activation is blocked without obstructing placement. Add original pitched synthesis and kick/hat/snare, envelopes, level controls, a true mono bus, and output protection. Schedule from the audio clock with bounded lookahead independently of rendering. Enforce the voice cap and release/steal rule. Define recovery when scheduling is late; never compress missed events into a burst.

**End-of-step automated tests:** generators alone remain silent; offline audio renders expected onsets within 5 ms, including chords and distinct phrase timings; mono output has one logical channel or identical left/right channels. F04 preserves overlapping voices within limits. F06 never exceeds the voice cap, contains no non-finite samples, and stays below normalized sample peak 0.99. Exercise refused activation, suspended audio, late scheduling, and cancellation of already scheduled-but-unstarted sources.

**End-of-step human tests:** start from F00; add a generator, then a note, another note, and a beat. Hear the chord and distance phrase fixtures; compare the event labels with the sounds. Confirm audio enabling works in both required browsers, the output is mono, and a dense mix has no obvious clipping or stuck voice. Note sounds are independently distinguishable from beats.

**Evidence and gate:** browser activation results, fixture audio files from the implemented synth, offline onset/peak report, and a live playback recording. **Pass when the browser is an audible instrument with the specified timing and cancellation behavior.**

## Step 06 — complete musical controls and safe live editing

**Depends on:** 05. **Produces:** node inspectors, Play/Pause, tempo, key/scale, volume, Clear, and functioning emission-boundary edits.

Expose every M1 control in the brief: generator period/phase/reach/enabled; note scale degree/octave/timbre/duration/level; beat sound/decay/level. Offer at least two pitched timbres. Expose travel fraction and quantization for prototype tuning. Reflect valid ranges and selected values. Keep movement, sound muting, and transport state distinct; wander/freeze comes later. Provide a Clear confirmation or an immediately available Undo recovery.

**End-of-step automated tests:** each control changes its corresponding model field and preserves unrelated properties. Moving a note preserves its chosen pitch. Key/scale remapping affects subsequent emissions; active voices do not retune. Tempo changes preserve beat continuity and committed absolute onsets. Disable, delete, pause, Clear, and interruption satisfy the rules, including the 100 ms release limit and no catch-up burst.

**End-of-step human tests:** use F05 to move and delete during travel, change tempo during a phrase, disable one of two generators, and pause/resume. Confirm the visible state matches what is heard. Adjust each inspector control and explain its effect from the display. Clear returns to the empty silent sphere.

**Evidence and gate:** control checklist, recordings of mid-flight edits, and cancellation timing results. **Pass when the user can deliberately edit and stop music without unexplained triggers.**

## Step 07 — make scenes recoverable and shareable

**Depends on:** 06. **Produces:** Undo, saved-scene storage, JSON export/import, and a portable fixture library.

Support undo for placement, movement, deletion, musical parameter edits, and Clear. Coalesce a drag/slider gesture into one history entry. Undo is an edit, not a replay of old scheduled events; restored pieces resume through future emissions with their stable IDs and current session validity. Save locally and export/import the versioned composition JSON. Keep venue profiles and connection details outside it. Provide readable validation/storage failures while retaining the current scene and previous good save.

**End-of-step automated tests:** fixture round-trips preserve topology, IDs, occupancy, and all musical settings. Saved file inspection finds no venue credentials/endpoints. Undo/redo, including Clear and deleting/restoring a node, cannot resurrect cancelled triggers. Corrupt JSON, unsupported versions, duplicate IDs, invalid vertices, non-finite values, and simulated storage failure leave the previous scene intact. Load resets playback according to the rule.

**End-of-step human tests:** build a pattern, export it, Clear, import it, press Play, and hear the same pattern from beat zero. Reload the browser and recover a local save. Undo a move and Clear. Import a deliberately invalid file and see an explanation while the current scene survives.

**Evidence and gate:** actual exported scene, reload recording, invalid-file example, and round-trip comparison. **Pass when a reviewer can keep and reproduce a composition independently.**

## Step 08 — show musical causality clearly

**Depends on:** 07. **Produces:** complete basic animations and reduced-motion presentation.

Add placement settle, generator wavefront, illuminated eligible arcs, onset flashes/envelopes, and movement trails. Wavefronts and connections follow the surface across poles and the rear hemisphere. Derive animation timing from audio/event timestamps, accounting for browser audio-output latency with output timestamps or a measured compensation. Sustained source positions follow the manual-move interpolation; camera motion remains presentation-only. Reduced motion replaces expansion/bounce/trails with simple highlights while preserving selection and musical information.

**End-of-step automated tests:** arc samples remain on the sphere within `1e-6`; antipodal/near-antipodal paths remain finite and use a deterministic path convention; rendering cannot generate sound events. Automated playback at render settings 60, 15, and 2 FPS gives the same scheduled onsets. Camera matrices do not affect output positions. Reduced-motion preferences switch presentation without changing events.

**End-of-step human tests:** watch F02 and F03 with sound; cause, travel, and response are understandable. At normal frame rate, compare visible/audible onsets; median visual onset error must be at most 50 ms and 95th percentile at most 100 ms over at least 30 triggers. Use a clock report that includes output-latency compensation and a recording with loopback audio/frame timestamps or an equivalent measured method; a screen recording that excludes audible output cannot pass this check. At 2 FPS, accept coarse visuals but require unchanged music. Verify a sustained moving source interpolates smoothly in diagnostics, and the pole/far-side and reduced-motion cases remain readable.

**Evidence and gate:** annotated recording, onset-error report, low-FPS audio comparison, and reduced-motion screenshot. **Pass when animation explains the music and rendering rate does not determine it.**

## Step 09 — prove venue output with an inspectable receiver

**Depends on:** 08. **Produces:** browser output adapter, local WebSocket bridge, OSC test receiver, output status, and protocol documentation.

Define versioned musical-event and position messages with stable object IDs and session/sequence identity. Implement a clock conversion/handshake between browser audio time and bridge monotonic time; report round-trip delay and uncertainty. Queue future triggers deliberately, reject stale/duplicate traffic, and send positions before their corresponding onset. Support initial positions, movement updates, clear/stop, scene replacement, and reconnect state synchronization. Release remote voices on output disconnect; include a receiver-side heartbeat/watchdog so a broken connection can release voices even when no stop message arrives. Use a 500 ms timeout for the local test receiver; agree the actual venue timeout in Step 11. Reconnect never replays missed triggers.

Encode ADM-OSC `/adm/obj/{id}/xyz` positions with a documented sound-node-to-integer mapping. The test receiver displays decoded OSC and companion musical events, including intended onset, arrival, IDs, and coordinates. It supplies a readable table or simple source-position display. Keep musical-event grammar independent of the eventual venue synth; the actual renderer grammar is selected in Step 11. Validate message schemas and limit the bridge to configured destinations.

**End-of-step automated tests:** decoding raw receiver packets reproduces IDs and normalized coordinates; exact cardinal probes pass the coordinate transform; malformed/non-finite messages are rejected. Over a two-minute loop, every non-cancelled F01/F04 trigger arrives exactly once and matches its position object. On loopback, bridge clock conversion error is at most 10 ms; receiver scheduling error is at most 20 ms at the 95th percentile. Test loss, duplicates, stale epochs, disconnect/reconnect, Clear, and pending-event cancellation with observable stop/release handling.

**End-of-step human tests:** load F07 and identify its labeled objects in the receiver. Move one note; its XYZ updates while its ID stays fixed. Rotate the camera; coordinates stay fixed. Disconnect/reconnect the bridge; status is accurate and local mono playback remains usable. Clear removes active receiver objects and releases any test voices.

**Evidence and gate:** launch instructions, captured raw/decoded OSC, event/position table, latency/clock report, and side-by-side browser/receiver recording. **Pass proves control/event delivery to a test receiver. Actual spatial sound remains an M2 gate.**

## Step 10 — package and accept the browser prototype

**Depends on:** 01–09. **Produces:** the M1 release bundle, a five-minute review guide, and completed M1 acceptance evidence.

Package the application source/build, lockfile, fixture scenes, bridge/receiver, README, Rules, and acceptance evidence. Make installation and launching reproducible from the bundle. Include the permanent browser URL and a concise bridge-launch procedure. Public hosting, accounts, recording features, MIDI output, and scored game modes are outside M1.

**End-of-step automated tests:** `verify` runs the relevant type/build/engine/audio/web/bridge checks and reports individual failures. A clean install builds and opens `/BongoPlanet/`. Run F06 for 30 minutes with a repeated edit cycle: queues/voices remain within declared bounds, no uncaught errors, no late-event burst, and no continuing growth of session objects after warm-up. Record actual memory/timing observations and the reference machine; a real-time performance failure keeps the gate open.

**End-of-step human tests:**

1. From a fresh browser session, an unfamiliar person receives only: “Make a short musical pattern on the sphere.” Start a 60-second timer when the interactive scene is ready. They place a generator, two notes, and a beat, hear a repeating pattern, and make one edit that audibly changes it without coaching. Ask them to point to what causes the sounds. Record elapsed time and any confusion. If no unfamiliar person is available, this check is **not run**, so M1 is not accepted yet.
2. Run the five-minute guide: F00 silence → F02 chord → F03 distinct onsets → F04 overlap → F05 move/delete/pause → save/load → orbit/rear placement → receiver ID/position match. Confirm both required browsers and reduced-motion behavior.
3. Listen to the 30-minute dense session evidence and review any limiting/stealing. Confirm ordinary F01 playback is clear and enjoyable enough to keep listening to; record the reviewer's assessment rather than presenting it as an automated result.

**Evidence and gate:** launchable bundle, actual exported scenes, test summary, short walkthrough with sound, first-minute result, and long-session report. **M1 closes only when all required Steps 01–10 checks pass.**

## Step 11 — establish the actual Feÿ output contract

**Depends on:** M1. **Produces:** a dated venue inventory, measured output profile, routing diagram, and bench/in-hall acceptance plan.

Confirm the current installation with its technical owner: speaker count, locations, coordinate convention, channel map, interface, sample rate, subwoofer routing, Reaper role, available synth, spatial renderer, accepted OSC grammar, object/voice limits, network route, and monitoring/stop controls. The brief's historical 30.1 description and model diameter are starting references, not calibration data. Record whether each value was measured, read from current configuration, or remains unknown.

Choose the exact route for independent source synthesis and rendering. The profile stores measured speaker coordinates/channel assignments, venue orientation/scale, supported messages, output-device routing, and bass management. Set a maximum acceptable control-to-sound latency and animation/audio discrepancy **before** the hall acceptance test, using the bench measurements and reviewer agreement. No unanswered routing or timing assumption may be silently treated as resolved.

**End-of-step automated tests:** profile validation rejects missing/duplicate channels, non-finite coordinates, unsupported protocol selections, and absent required limits. Unit transforms and channel/object mappings round-trip. The profile can be changed without altering a saved composition.

**End-of-step human tests:** the venue technical owner checks the inventory and routing diagram against the actual system. Identify right/forward/up and the subwoofer path physically. Review the chosen latency limits and test sound levels. Document any difference from the historical rig.

**Evidence and gate:** approved dated profile, inventory provenance, routing diagram, and numerical acceptance limits. **Pass requires current venue data. Missing access or configuration keeps M2 blocked while independent work may continue.**

## Step 12 — bench-test the complete venue sound path

**Depends on:** 11. **Produces:** bridge-to-synth-to-renderer integration with independent audio objects and emergency stop/recovery.

Implement the selected venue musical grammar, stable object mapping, voice ownership, renderer position conversion, timestamp compensation, and output profile selection. Route each sound node as an independent spatial object; overlapping generators may produce multiple voices for the same object. Test the full path with a renderer monitor or multichannel capture before listening in the hall. Avoid playing local preview and venue output simultaneously by accident; make monitoring mode explicit.

**End-of-step automated tests:** F01/F04 produce the expected object/voice assignments; position changes affect the correct object only; cancellation and note-off/release ownership survive deletion, Clear, pause, scene load, disconnect, and duplicates. Captured isolated-object outputs remain independent before renderer mixing. Bench timing meets the limits recorded in Step 11. Profile/object limits are enforced visibly rather than dropping sources silently.

**End-of-step human tests:** compare a single note, chord, beat, and overlapping phrase against mono preview. Move a sustained source and observe its interpolation in the actual renderer. Stop the bridge and use emergency stop; no voice remains stuck. Reconnect without replaying the old phrase. Identify the independent object in the renderer and its actual audio feed.

**Evidence and gate:** renderer screenshots, isolated-object audio/capture, raw control logs, failure/recovery recording, and timing report. **Pass when the full intended sound path works on the bench; hall direction is still unqualified.**

## Step 13 — calibrate and accept playback in the hall

**Depends on:** 12 and access to the working installation. **Produces:** calibrated venue profile, in-hall demonstration, and M2 acceptance report.

With the venue operator, identify every physical speaker/channel, verify measured geometry and orientation, and verify the intended subwoofer route. Play exact cardinal probes, then actual F07 nodes and a controlled surface trajectory. Calibrate transforms and timing without changing composition coordinates. Test mono monitoring separately from venue playback. Use the predeclared safe test level and acceptance limits from Step 11.

**End-of-step automated tests:** channel-identification logs and configuration match the approved map; actual control/audio measurements meet the agreed limits; calibration probes transform correctly; a saved scene yields the same object identity and coordinates after reload. Verify pause/Clear/disconnect release the venue voices.

**End-of-step human tests:** an operator checks each physical channel and the subwoofer. A listener who cannot see the requested target identifies right/left/forward/back and up/down for the probes, then follows a relocated source and an adjacent surface trajectory. Record each requested and perceived direction, including ambiguous cases and listener positions. If the layout cannot resolve one required direction, report that limitation and keep the corresponding gate open or explicitly revise the acceptance scope with the reviewer. Play the chord/phrase/overlap fixtures and confirm their musical identity survives spatial rendering.

**Evidence and gate:** final measured profile, per-channel checklist, direction test table, hall demonstration recording, timing measurements, and reviewer/operator sign-off. A room recording supports the session record; it cannot alone prove spatial direction. **M2 closes only after actual in-hall playback and listening acceptance.**

## Step 14 — improve visual quality without losing the instrument

**Depends on:** M1; M2 is not required for browser visual work. **Produces:** a polished visual pass and before/after comparison.

Refine materials, restrained bloom, depth, mesh lighting, and trails. Establish a small visual system for piece types, selection, eligible targets, unavailable vertices, disabled pieces, and output status. Preserve the dark-stage character and foreground readability. Keep effects adjustable and reduced motion functional. Validate the ordinary and dense scenes at the reference laptop's normal review viewport and a narrow viewport.

**End-of-step automated tests:** replay the M1 interaction/timing suite; identical saved scenes generate identical events. Reference F01 averages at least 50 FPS over 60 seconds and F06 at least 30 FPS, with audio timing still within M1 tolerances. If hardware cannot meet these prototype targets, reduce effects and retest. There are no renderer errors or layout overflow at the reviewed sizes.

**End-of-step human tests:** compare matched before/after views of F01/F06 and both hemispheres. Identify every piece type and selected/destination state without relying on color alone. Judge whether the new effects improve depth while keeping the cause of each sound clear. Repeat the placement and reduced-motion reviews.

**Evidence and gate:** matched screenshots, live recording, frame/timing report, and a short visual-review checklist. **Pass when the visual improvement preserves playability, causality, and measured timing.**

## Step 15 — add controlled wander and freeze

**Depends on:** 14. **Produces:** optional deterministic adjacent-vertex motion, freeze, and saved movement settings.

Add opt-in wander with a seed, movement rate, and eligible pieces. Reserve destinations, follow sphere edges smoothly, and resolve simultaneous proposals deterministically. Commit vertex/relationship changes on arrival. Manual input takes ownership cleanly; Clear/delete/load cancel movement and reservations. Freeze stops movement at a defined safe state while transport continues; mute releases/suppresses sound while movement continues; Pause stops transport and automatically suspends wander until resume. Preserve the distinction visibly.

**End-of-step automated tests:** identical seed/settings generate identical moves; only neighboring vertices are reached; no overlapping occupancy/reservations; paths stay on the surface; movement is independent of render FPS. Full occupancy handles zero available moves without deadlock. Freeze/mute/Pause obey separate policies. Sustained voice positions track interpolation, and deleting a moving node cancels updates. Saved movement settings round-trip; load starts paused without stale reservations.

**End-of-step human tests:** let F01 wander, freeze a desirable pattern, listen for two cycles, unfreeze, mute while observing continued motion, then pause. Drag a wandering piece and verify ownership is clear. Watch a sustained source move in the receiver; when M2 is available, also verify it in the actual renderer and hall.

**Evidence and gate:** motion/state recording, seeded movement log, receiver position trace, and updated scene schema/migration evidence. **Pass when movement is controllable and introduces no occupancy or sound-ownership errors. Venue wander qualification is tracked separately if M2 is blocked.**

## Step 16 — deliver the inside view and performance mode

**Depends on:** 15. **Produces:** outside/inside camera views, compact performance presentation, and the M3 bundle.

Add an inside-the-sphere view with usable camera constraints and return-to-outside control. Provide a performance mode with essential transport, mute, freeze, level, and output status. Keep composition coordinates fixed in all views. Preserve a route back to editing and make rear/inside nodes readable. Package the visual/movement changes and repeat the original first-minute and musical review so polish has not obscured the instrument.

**End-of-step automated tests:** view/mode changes preserve scene data, generator state, sound/object IDs, and XYZ output; picking works in supported views; transitions do not duplicate voices or callbacks. Re-run M1 and M3 performance/timing/reduced-motion checks, including resize and mode exit.

**End-of-step human tests:** switch outside → inside → performance → editing during F04 playback. Confirm music continues and source positions do not move because the camera moved. Locate pause/mute/freeze quickly and return to the selected piece. Repeat a novice first-minute test on the final interface. Reviewer confirms interior depth and legibility are acceptable.

**Evidence and gate:** view-transition recording with sound, performance screenshots, updated novice result, and M3 acceptance checklist. **M3 closes after Steps 14–16 and the browser regression checks pass; any venue-specific M3 claims also require their actual venue tests.**

## Step 17 — choose and prove the iOS architecture

**Depends on:** M1 contracts; target M3 schema/behavior for the planned iOS release. **Produces:** an architecture decision and a small on-device audio/scene-loading spike.

Compare a shared runtime and native engine implementation against the actual event contracts, scheduling needs, app lifecycle, touch rendering, distribution path, and venue connection needs. Select one with recorded tradeoffs. Do not assume TypeScript can be used unchanged in native audio. Define minimum supported devices/OS, orientation behavior, build/distribution instructions, and the selected local-network venue route.

**End-of-step automated tests:** the spike reads current web fixture JSON and produces the expected F02/F03/F04 event timelines. Current schema versions are recognized; incompatible versions fail clearly. Verify the selected build route produces an installable development artifact.

**End-of-step human tests:** install the spike on a named physical device, play a chord and distance phrase, and interrupt/resume audio once. Confirm its timing/output constraints support the decision and that a venue connectivity probe reaches the test receiver. If devices or signing access are unavailable, report the architecture as provisional and leave the device gate open.

**Evidence and gate:** decision record, install/build transcript, device details, parity report, and on-device recording. **Pass when the chosen architecture has working device evidence.**

## Step 18 — implement the touch instrument and lifecycle

**Depends on:** 17. **Produces:** a complete iOS candidate with audio, touch UI, scene storage, and selected venue connectivity.

Implement the palette, snapping, orbit/pinch, inspectors, transport, undo, save/import/export, reduced motion, and selected M3 presentation/movement behavior. Adapt layout to phone/tablet as required by the supported-device decision. Handle app backgrounding, interruptions, route changes, suspension, network loss, and reconnect. Make audio/interruption and venue states truthful. Preserve the web scene format and stable object identity.

**End-of-step automated tests:** shared golden behavior tests pass on the iOS engine; lifecycle transitions cancel/release old work; repeated load/clear cannot leak voices or objects. Multi-touch ownership, occupancy, wander/freeze, and import failures obey the same contracts. Web → iOS → web JSON round-trip preserves musical settings and current schema meaning.

**End-of-step human tests:** on the named supported devices, perform the first-minute interaction and all F05 edits with touch. Background/foreground, lock/unlock, interrupt audio, change audio route, and lose/reconnect venue output. Confirm no stuck sound, duplicate backlog, lost scene, or misleading running status. Import a web-made scene and export it back.

**Evidence and gate:** installable candidate, device recordings, lifecycle checklist, round-tripped scenes, and event/audio reports. **Pass when the complete instrument is usable and recoverable on actual supported devices.**

## Step 19 — qualify parity and deliver the iOS release candidate

**Depends on:** 18. **Produces:** the M4 candidate bundle and final compatibility/device acceptance report.

Package the installable artifact or reproducible signed-build instructions for the chosen distribution route, source/lockfiles, compatible fixtures, user review guide, and all unresolved limitations. Public App Store publication is a separate release action. Compare web and iOS musical results, rather than requiring identical platform-specific waveform bytes.

**End-of-step automated tests:** every reference fixture produces matching target selection, pitch, generator provenance, cancellation, and committed timing within the established tolerances. Dense 30-minute runs on the supported devices remain within the declared limits with no continuing queue/object growth. Selected venue-protocol tests pass through the device connection. All required M4 checks are individually reported.

**End-of-step human tests:** an unfamiliar person builds and edits a pattern within a minute on a touch device. A reviewer loads the same scene on web/iOS, compares the chord, phrase, overlap, and wander behavior, and completes the lifecycle review. Demonstrate device venue output against the receiver; if actual hall support is a release claim, repeat the M2 directional/timing tests using the device sound path.

**Evidence and gate:** installable/reproducible build, comparison recordings, device first-minute result, soak results, compatibility table, and signed-off checklist. **M4 closes only for the device/output configurations actually tested. Untested hall connectivity or unsupported devices remain explicit limitations.**

## Requirement coverage

| Brief requirement | Owning steps | Principal acceptance evidence |
| --- | --- | --- |
| Empty 3V sphere and first-minute loop | 02, 04, 05, 10 | Geometry report, silent startup, unfamiliar-player timed test. |
| Generator/Note/Beat palette and all controls | 04–06 | Placement recording and per-control checks. |
| Surface reach, timing, chords, phrases, overlapping generators | 03, 05, 08 | Independent event timelines and actual onset/audio comparisons. |
| Atomic occupancy, edit commitment, deletion cancellation | 02–07 | Rejected-move reports and F05 cancellation evidence. |
| Camera independence, both hemispheres, continuous surface paths | 04, 08, 09, 16 | Front/back/inside review, arc tests, unchanged XYZ capture. |
| Audio-clock scheduling and graceful low frame rate | 03, 05, 08, 10 | Identical event streams, onset reports, low-FPS playback. |
| Mono mix, coherent pitch, dense-arrangement level management | 05, 06, 10 | Channel/peak reports, listening results, dense-session evidence. |
| Play/Pause, tempo, key/scale, level, Undo, Clear, Save/Load | 06, 07 | Live edit review and portable round-trip scene. |
| Basic motion feedback and reduced motion | 08 | Synchronized recording and readable reduced-motion view. |
| Independent engine/adapters and versioned scenes/events | 01–03, 07, 09, 17 | Contracts, pure-engine checks, cross-platform fixtures. |
| Musical events plus ADM-OSC object positions | 09, 11, 12 | Decoded packets, clock report, real object/audio routing. |
| Feÿ profile, measured routing, subwoofer, spatial direction | 11–13 | Current inventory, calibrated channel map, listener direction test. |
| Polished effects, wander/freeze, inside view, performance mode | 14–16 | Visual comparisons, motion logs, regression and mode reviews. |
| iOS touch, lifecycle, compatibility, venue connectivity | 17–19 | Physical-device builds, lifecycle results, scene parity, output qualification. |

## Completion and handoff

At each milestone, update the checklist and provide the runnable artifact, the human review guide, and the evidence index. State exactly which milestone is accepted and which remain open. Do not describe a working receiver as a completed venue integration, a simulator run as device qualification, or a recorded demonstration as proof that an unfamiliar player succeeded.

If work stops between steps, leave a handoff containing the last passing build identifier, current step, remaining checks, known failures, exact launch/test commands, and next concrete action. Preserve passing fixtures and original evidence. A blocked venue or device test stays visible until the required environment is available and the test is actually performed.
