# Bongo Planet — scope of the recorded synthesis family

Source/evidence review, 2026-10-12. No runner, tests, browser, capture or PCM/JSONL scan was executed. This note refines the prospective analysis scope in `Remaining-Onset-Feasibility.md`; it changes no original result, tolerance, model, acceptance status or acquisition.

**Independent phase/envelope origins are not free variables of this unchanged recorded program.** Under the stated captured-program provenance premise, fixing each completely retained trigger's onset, sound and sequence is legitimate. The smaller unresolved family concerns the common sample clock and actual application/admission boundaries, with their resulting voice ownership. It need not include arbitrary hidden per-component phase changes that contradict the literal implementation and recorded inputs. My earlier recommendation to search independent chord-component origins and unconstrained neighboring origins was overbroad for this specifically source-constrained scope.

## What the source fixes

I compared the current source with the binary acquisition's exact copies and report bindings. All three pairs are byte-identical:

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| `src/audio/synth.ts` | 5001 | `499f1d4aadfad5ce2c94082f19724eb24e411b4cbe5ccf2515f6d65754619191` |
| `src/audio/processor.ts` | 5839 | `429555623b5f55c8df29a00b3ce6d9546a3d85fa2d1ba3e5e6b30d0b142f849b` |
| `src/core/engine.ts` | 6475 | `19e5cba94b0db6c13b642bd28c90bc1def4bb0bc7ac6b5a95faf1e82bfa9aea3` |

`MonoSynth.start(trigger, blockStart)` stores the same trigger; it does not replace `trigger.onset` with admission time. `render` computes one `now` per sample, then `age = now - voice.trigger.onset`. That age drives the attack, tail, oscillator phase and beat decay. There is no independent per-voice clock or phase accumulator. Delayed admission can remove an attack prefix; it cannot reset the waveform to age zero without contradicting this source. Sequence determines tie-breaking in the 64-voice policy, rather than an independent onset offset.

`processor.consume(start)` drains one ordered event array, applies it synchronously to the synth, then retains those same event values for telemetry. The normal process path advances the engine to the block end, consumes at the block start, then renders. Engine onset records preserve the committed onset/sound/sequence; only position is refreshed. No inspected path subsequently changes a stored voice's onset or sound.

The completed logical readback matches 96/36/14080/40320 trigger records and independently matched onset records against analytic F02/F03/F06/F08 expectations, with no missing, duplicate, identity or sound differences. Observed-versus-analytic timestamp differences are explicitly retained, up to about 5.684e-13 s, rather than silently set to zero. These facts can constrain program inputs; they do not alone establish an emitted acoustic entrance.

## What remains uncertain

The physical sample order is recorded, but the exact internal render clock was not logged by this uninstrumented processor. Its healthy-block relation is conceptually

`S_b = max(rawProductTime_b, previousEnd_b, engine.now_b)`

`E_b = RN(S_b + Q / sampleRate)`

`now_(b,i) = RN(S_b + RN(i / sampleRate))`.

The production expression's actual evaluation/rounding order must be retained. Every voice uses this same sample time and its fixed observed onset. Previous block ends and command-boundary advancement constrain subsequent clocks; a proposed candidate cannot move one component independently while leaving the shared clock unchanged.

The observer records its own `currentTime/currentFrame` and receives the actual product output. It is not a direct log of each product `process` entry or its private `previousEnd`/`engine.now`. Equating the observer's global clock with the product callback's corresponding raw clock is an explicit graph/runtime premise or an execution relation to justify—not an observed internal field. Retained event order also does not label each `consume` boundary: telemetry can merge several consumed arrays while an earlier batch awaits acknowledgment. This affects how many voices are admitted before a particular render and which older voices are stolen before sounding. Applying the full eventual event stream in its correct order is insufficient if its block grouping is wrong.

The capture harness performs no scene edits within the fixed positive windows: it loads, deliberately plays, observes/blocks the main thread, then pauses after the tail. A source-constrained replay can therefore exclude invented in-window edit commands once it establishes that exact command/session history. ACK messages return before clock advancement. Normal no-edit block transitions also constrain the engine floor; it must not simply remain an arbitrary independent variable forever.

A useful additional anchor exists: all four recorded fixtures begin with enabled, zero-phase generators after fresh load. In the literal healthy first-play block, `engine.play(S_b)` followed by `advance(E_b)` emits the beat-zero event at **that same S_b**. The retained first emission can thus constrain the internal start value without choosing it from PCM. It does not by itself identify the exact original observer block index or prove the clock relation between the two processors. Keep every block-index/clock state consistent with that anchor and existing observations; do not silently choose `round(epoch*sampleRate)` as an internally observed quantum or choose the best-fitting seed.

Once admissible clock/block histories and consume boundaries are bounded, ownership can be derived by executing the literal admission, prune, cancellation and oldest-onset/sequence stealing rules for those histories. There is no requirement to observe the private active array if those state transitions are proved from sufficient evidence. Conversely, the current full-cursor diagnostic deliberately keeps nominal admission/removal fixed and omits the command floor/earlier history; its excellent fit has not performed that proof.

## Sound narrower analysis and decision boundary

A defensible next family is the set of **complete executions of this fixed program consistent with the recorded event values/order, command history, shared-clock constraints and observed sample order**. It fixes each `onset` and sound value, varies only admissible shared clock/admission state, and recomputes ownership on each affected branch. Independent analytic expectations remain the reference; the observed inputs are not used to redefine the expected schedule. For a surviving voice, an entrance is its first contributing output sample after actual admission and nonnegative rounded age—not merely its scheduled timestamp. Intentionally erased voices stay outside the audible-arrival denominator with their ownership reason retained.

The measured PCM is still essential: require the complete independently calibrated input/product paths to be compatible with the candidate execution, and reject or retain each out-of-budget **program-admissible** clock/admission alternative. Native calibration remains fixed at its independently observed 640 samples; no product delay is fitted away. A small amplitude residual is not a bound in milliseconds. Timing follows only after the complete compatible execution set yields bounded entrance sample indices relative to independent expectations, or after another direct actual-output entrance measurement supplies that bound.

This can eliminate the previous combinatorial search over impossible independent phase shifts. It cannot discard a legal shared-clock excursion, different consume grouping, late insertion or stealing branch solely because the nominal replay fits. The necessary per-sample enclosure versus concrete complete-waveform witness distinction remains. The declared 1e-6 comparison criteria, floating-point expression rules and explicitly assumed `2^-40` Math-call accuracy remain unchanged; this note neither certifies that assumption nor adds tolerance. All 468 inventory rows, the full count denominator, unfinished branches and the required fixture/stall coverage must remain visible.

Logical event counts plus deterministic source constraints can rule out invented duplicate calls/changed IDs; actual PCM checks output behavior. There is no original requirement to decode hidden identity permutations from indistinguishable mono waveforms. Nevertheless, a complete event ledger cannot independently prove that every logically present voice contributed to output after capacity pruning. The shared-state replay/acoustic witness is the missing bridge, especially for dense mixtures.

The original requirement prohibits **timestamps alone**. It does not prohibit this combination of independently expected timings, source causality, complete event provenance, actual calibrated PCM and a rigorously bounded execution family. No additional loaded-worklet-body attestation is claimed: the evidence binds captured source/build, fixed module URL and served bytes; treating that as the program used retains its stated provenance premise. A hostile or different hidden program is not silently certified by the proposed family.

**Recommendation:** prepare a separately reviewed, smaller coupled execution analysis if root chooses. First prove or conservatively bound product/observer block alignment, the fresh-play clock anchor and in-window consume grouping; derive ownership rather than assuming nominal ownership. It may use existing evidence if those relations are derivable—new instrumentation is not automatically required. If they cannot be bounded from the retained data, keep the corresponding onset rows conditional/unresolved and identify that precise missing witness. No current numerical failure is replaced, no gate passes here, and no analysis execution or retry is authorized.
