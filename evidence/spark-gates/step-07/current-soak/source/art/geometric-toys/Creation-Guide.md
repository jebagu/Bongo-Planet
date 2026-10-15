# Bongo Planet — creation guide

For people composing on the planet and agents creating or changing compositions. These are the current rules for **version-two gated scenes**, including Switch Chain, Switch Fork and Infinite Circuit. See [Rules.md](Rules.md) for the executable contract.

## The shared musical grid

**Every crossing of one strut takes one sixteenth note, regardless of its geometric length.** A beat means a quarter note: four hops make one beat; sixteen hops make a four-beat bar. Empty junctions and return trips each consume a step too.

| Journey at 120 BPM | Arrival after emission |
| --- | --- |
| 1 hop | 125 ms |
| 2 hops | 250 ms |
| 3 hops | 375 ms |
| 4 hops | 500 ms / 1 beat |

At any fixed tempo, hop duration in seconds is `15 / BPM`. Route length means **number of crossings**, including revisits. Visual distance, camera position and render frame rate do not determine musical time. Sparks cross longer struts faster so their visible arrival matches the sound.

**Spark interval** sets how often a generator emits, in beats. **Spark travel** limits how many hops each branch can complete; changing it changes the phrase length, while each hop still takes one step. Infinite removes that limit. Switching off **Emit new sparks** lets existing sparks finish or circulate; Pause stops them. Repeated emissions into Infinite circuits can accumulate until an explicit capacity limit pauses playback.

## Make a chord

Split one spark into branches and put different pitches the **same number of hops from that split**. They sound together, even when the branches cover different physical distances. In the default C-major scene, try C, E and G in the same octave. More generally, use the first, third and fifth degrees of the scene's scale.

Open **Switch Fork** for a ready example: the first instrument answers after one step, then two branches answer together on the second step. To delay one branch, route it through an extra empty junction. Avoid enabling return or extra exits unless you want those additional sounds. Distinct sparks arriving together remain separate voices; identical notes can therefore get louder.

## Keep several generators aligned

All generators share transport beat zero and the sixteenth-note grid. Periods of 1, 2 and 4 beats give regular layers. Periods of 3 and 4 beats realign their emissions every 12 beats when their start offsets match. A generator added or enabled during playback joins its next eligible future boundary; it does not start a private clock.

Three-hop and four-hop **circuits** return to their starts together every 12 steps, or 3 beats, when launched together. Circuit length and generator interval are independent. Use empty junctions for spaces between notes, repeated visits for repeated notes, and equal-hop branches for chords.

Tempo edits take effect at the next whole beat. All active circuits and future emissions use the new tempo together from that boundary. Note length controls sustain in seconds; it does not change spark speed or note spacing. Key, scale and chosen pitches determine harmonic relationships; a common rhythm alone does not guarantee consonant harmony.

## Contract for agents

- Use `version: 2`, `settings.propagation: "gated"`, valid adjacent vertex IDs and directed `wiring`. The core schemas validate occupancy and topology. Gate edits belong to junctions independently of pieces.
- `HOP_BEATS = 0.25` in `src/core/gated.ts` is the musical unit. `Engine` anchors beat-to-time conversion and supplies edge timestamps. Never derive gated delays from chord lengths, mean strut length, route length, generator period or travel budget. `GatedEdge.speed` is a per-edge display diagnostic.
- Generator `period` is in beats; saved `phase` is a fraction of that period. Its effective offset is `round(phase * period / 0.25) * 0.25`, wrapped modulo `period`; halfway values round upward. Preserve the saved metadata. Phase zero aligns downbeats; other offsets stay on the shared grid.
- Commit one edge ahead. Whole-beat tempo changes happen on hop boundaries, so the current edge completes on schedule and every following edge uses the new tempo. Rendering consumes audio timestamps. Never snap sounds separately after routing or deduplicate simultaneous musical arrivals.
- Existing version-two files adopt these equal-hop rules. Version-one radial/routes files, including F01–F14, retain their historical timing until converted to gated routing. The app converts when a gate is edited; Undo restores the original. Do not silently rewrite those saved compositions.
- Keep this guide, [Rules.md](Rules.md), the [design brief](Game-Design-Brief.md) and [spark-gates plan](Spark-Gates-Work-Package.md) consistent. Check `tests/musical-grid.test.ts`, `tests/spark-gates.test.ts` and `tests/musical-grid-browser.spec.ts` when changing timing.
