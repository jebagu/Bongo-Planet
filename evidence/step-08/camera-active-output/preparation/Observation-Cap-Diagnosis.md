# Bongo Planet active camera — actual01 observation accounting

Read-only diagnosis. Helper/observer/test, thresholds and caps remain unchanged. No acquisition, service, browser, test or retry was launched. The preserved report is980969 bytes, SHA `4d9d0c25464c21190aba7b6faa99403e64df29bdbaa5c1cb0209ca02d5213bf0`. It retains two completed60/15FPS arms, seven samples each; the2FPS attempt reached its post-scene/camera/status snapshot but did not obtain the required completed fresh-after/during witnesses or final disposition. `scopedChecksPassed`/guardEnd are absent. This is a failed/incomplete full experiment, not a third-arm pass.

The report's ObservationBudget is1261 accepted observations/523850 bytes with a latched cap failure. Count was below4000; only438 of the fixed524288 bytes remained. Reconstructing each original charge wrapper from the retained arrays with Node `Buffer.byteLength(JSON.stringify(value))` exactly reproduces both totals (read-only analysis chunk7e2626). There is no unexplained accounting difference:

| Charged category | Count | Bytes |
| --- | ---: | ---: |
| wire |103|30776|
| pointer |30|9983|
| local-event |5|1018|
| receiver |59|11680|
| raw-OSC |46|12423|
| native original row + incarnation/read bracket |374|218024|
| local-observation |184|83577|
| native-read mirrored diagnostics |223|107210|
| hr-performance-pair |225|44323|
| checkpoint |12|4836|
| **Total** |**1261**|**523850**|

Native rows are the largest category. Their246 original state rows cost156529 bytes;110 applied rows54279;8 clock rows2864;4 started1234;3 release1306; one queued421, dispatch-pop401 and onset990. These are distinct original occurrences, not redundant rows that can simply be deleted. The authoritative state rows provide the fresh native during witness and complete observed lifecycle. Preserve them and their unique ordered tail coverage.

The additional223 native-read snapshots cost107210 bytes while carrying only six distinct session/pending/voice/drop/worker semantic states. They mirror the already retained native state stream; changing pair age/read bracket makes nearly every serialized snapshot different without supplying another authoritative worker instant. Retaining first/change/error health snapshots can remove this duplication while still executing every readiness/clock/drop/voice check at its original cadence.

Local polling retained87 fresh observations40925 bytes,82 non-null telemetry rereads38680, and15 null pre-activation rows3972. A reread is explicitly not a fresh status.time witness. All read brackets are different, but repeated unchanged telemetry does not supply the required fresh before/during/after evidence. Retain every fresh status and every adapter/context/status transition; validate every poll and summarize unchanged rereads with bounded counters/brackets. Do not suppress local event/wire/pointer ingestion when a telemetry reread is not retained.

Read-only projection (956984) using those exact records, no PCM or altered source: local fresh-or-semantic-transition retention would keep89 rows41459 bytes and omit95 unchanged rereads42118. Native health-transition retention, additionally keyed by readiness, uncertainty, incarnation and clockPairSequence, would keep12 existing full snapshots5688 bytes instead of223/107210. The same acquired prefix would then cost380210 bytes before new bounded summary metadata, saving143640 and leaving144078 bytes. This is a retrospective accounting estimate, **not** evidence that a successor or a longer window will finish under the cap. Extra delay, new transitions or queue loss can still fail the same fixed limits.

The source-order evidence localizes the cap to retention rather than a musical failure. The final pair and final native state were accepted in a drain bracket `972881367652000..972881369114958`; the newest state observedHrNs is972881361248333. The last accepted native-read bracket instead ends972881343561125. Source orders native-read charging after pair/prefix/tail ingestion. Preclose original rows show the next receipt only at972881370607666, after the final bracket. This supports rejection of that drain's mirrored native-read append; the rejected value/its exact byte length are not retained, so this remains a source-order inference rather than a directly logged rejected-category witness. The failure was surfaced while2FPS `newLocal` awaited a fresh final observation. Poisoning then also rejected the preclose prefix append, as the second retained error states.

The latest retained pre-failure local state is running with one voice, sequence1, pending0 and zero drops/steals; the newest native state likewise has one onset/current/peak voice, one object, pending0 and zero drops. These finite points do not finish the omitted witness window. All seven cleanup flags were true, Chrome exit code0/signalnull, native close/exit acknowledgment0; root separately retained8.3658 seconds/no force. Cleanup success does not turn the acquisition failure into a pass.

Independent actual review separately verifies all46 retained position wire/receiver/raw triples. The47th preclose position belongs to the deliberate post-failure Pause idle epoch, outside the capped main prefix. Served-after main/processor files are absent: the report's processorBinding describes the planned before/after method, while this failed acquisition retained original main and served-before bytes only. No completed after-binding or genuinely loaded-worklet-body claim follows.

The980969-byte pretty report is larger than512KiB because it also duplicates already charged witnesses in attempts/cases, includes cleanup/source data and adds whitespace. The512KiB budget is canonical raw observation charges, not an asserted whole-report serialization limit. Report-size or count-cap relaxation is unnecessary for the proposed retention repair. No ledger or acceptance atom was changed.
