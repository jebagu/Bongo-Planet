# Bongo Planet — route journeys

Built October 14, 2026 from the selected Painted seams concept in design/mockups/2026-10-14/painted-seams.png.

**Compatibility scope:** this document describes version-one automatic journeys and saved song paths. Fresh compositions use version-two directed gates with equal sixteenth-note hop timing. Read the [creation guide](../Creation-Guide.md) and [current rules](../Rules.md) for chords, shared-grid emissions and tempo alignment. Constant physical speed below applies only to legacy version-one playback. Editing a gate converts that composition to current routing; Undo restores the original paused.

Each neighboring vertex pair has one visible straight seam, coincident with the faceted planet edge. A generator pulse emits one spark per automatic route at the same speed for that emission. The same particle sounds each note/drum it passes and keeps going. It is never replaced by a destination-specific particle.

## Route rules

Automatic routes cover the generator's angular reach. Geometry determines a shortest-path tree and splits it into five or six outgoing sectors (fewer at very small reach). A continuous walk explores each sector, making chosen turns and retracing when it needs to reach another branch. That is still one particle. Revisited instruments play again on passage. There is no manual route-drawing tool in this change; source and reach determine the routes, while placing/moving instruments changes the phrase.

The longest route sets the common speed so its last arrival falls at the travel fraction of the generator cycle. Shorter routes end earlier. Separate generators retain their own period/phase. Pending journeys retain their times after tempo/reach/period edits; later pulses use the new settings. New visits are scheduled with stable route ID and step metadata, and the renderer uses the same passage timestamps on the audible clock.

Route scheduling replaced the old direct-angular-distance timing for version-one route scenes. Quantization remains available in Original pulses. Saved version-one scenes without the optional settings.propagation property retain Original pulses. Toy Ensemble and saved song examples use legacy routes; fresh compositions use gated playback. Switching modes releases pending work and preserves the accumulated transport beat. The appearance preset surface property is independent of playback behavior.

Moving an instrument cancels its pending old-vertex visits and schedules its remaining new-vertex encounters. This never changes route geometry or creates a particle. Deleting a sound cancels its hits; other instruments on the same route still sound. Deleting a generator stops its journeys. Disable allows already emitted journeys to finish. Pause/load/clear/interruption reset all journeys.

Bounds: 256 active journeys; 5,376 pending sounds; 182 vertex entries per route; 128 rendered orbs; shared instance/tail buffers. At fixed settings there are no more than 48 in-flight journeys in the full eight-generator scene because they finish before their next pulse. Repeated phase changes or major tempo changes can temporarily overlap pulses and are subject to the caps.

## Controls and rollback

- Version-one radial/route mode remains readable and portable in saved musical scenes. The current play screen does not expose a mode selector.
- Geometric Toys with straight painted seams is the supported appearance. Earlier curved/Original looks migrate safely; they are not current rollback controls.
- Clicking a legacy gate makes a gated copy, applies the requested toggle and starts paused at beat zero. One Undo restores the prior legacy scene paused; its saved file is retained until the player chooses Save.
- Edit look is a live left tray with five flat gate glyphs and three spark styles. Routing and musical history remain independent of look edits. Portable composition files can bundle the validated look beside the musical scene.

## Current gated replacement

F15/F16/F17 demonstrate directed chain, fork and Infinite circuits. The core retains only each branch's committed edge and upcoming sound. On arrival it sounds the destination, consumes one hop and reads current outgoing gates. Every enabled exit receives a branch; an Off exit receives none. Empty junctions and revisits count. A finite budget includes its final sound; Infinite has no hidden lifetime cutoff.

Wiring belongs to vertices, independent of pieces. Placing a generator enables all of its local outgoing arrows as one history edit. Moving any piece preserves both junctions' wiring. Generator interval and enable/travel edits apply to later emissions; existing branches retain their budget and follow the shared grid.

The view uses engine-supplied edge times. Each hop takes one sixteenth note, so forks with equal hop counts can sound chords despite different chord lengths. Tempo changes affect every circuit at the next whole beat. Current bounds include 256 edges, 2,016 arrivals/second and the measured 64-decision audio-quantum limit; overload pauses visibly. This edge stream uses neither the complete legacy walk arrays nor destination-created particles.

Pause/load/clear/interruption clear propagation and old transport epochs cannot restore it. Source deletion cancels descendant sounds and releases owned voices; unrelated sources continue. See [the Spark Gates review](../evidence/spark-gates/review.md) for exact-source evidence and remaining human/Safari tasks.

The asset ZIP includes the effect and core route-engine sources. Source/offline/browser checks for this feature are scoped separately from the project's outstanding venue, device, and independent live-output timing acceptance gates. The existing angular fixtures F00–F09 continue to describe Original pulses; F10 is the route showcase.
