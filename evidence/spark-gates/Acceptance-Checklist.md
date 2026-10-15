# Bongo Planet — Spark Gates acceptance

Original kickoff checkpoint: `396c820`. The routing package is implemented; human acceptance stays open. Later direct user requests changed the visual contract. Superseded cases are explicitly blocked and are not represented as passed. All subcases start as not run in `Initial-Expanded-Checks.json`.

| ID | Check | Status | Evidence / limits |
| --- | --- | --- | --- |
| SG-S01-A01-01 | five-neighbor wiring | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-02 | six-neighbor wiring | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-03 | all 540 directed entries | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-04 | duplicate junction | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-05 | duplicate exit | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-06 | non-adjacent exit | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-07 | negative vertex | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-08 | vertex 92 | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-09 | exit 92 | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-10 | duplicate piece ID | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-11 | occupied vertex | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-12 | 93 pieces | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-13 | ninth generator | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-14 | zero limit | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-15 | negative limit | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-16 | fractional limit | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-17 | unsafe integer | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-18 | NaN limit | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-19 | numeric Infinity | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-20 | null limit | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-21 | uppercase tag | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-22 | numeric string | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A01-23 | malformed tag | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A02-01 | source begins at hop zero | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A02-02 | travel one | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A02-03 | travel three | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A02-04 | Infinite tag | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A02-05 | explicit all-Off record round trip | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A02-06 | new source eight-hop default | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A02-07 | factory outgoing arrows On | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A02-08 | appearance excluded from composition | **blocked** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json) Superseded by the later direct request to bundle visual style with music. The musical scene still has a separate strict schema. |
| SG-S01-A03-01 | legacy F00 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-02 | legacy F01 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-03 | legacy F02 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-04 | legacy F03 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-05 | legacy F04 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-06 | legacy F05 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-07 | legacy F06 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-08 | legacy F07 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-09 | legacy F08 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-10 | legacy F09 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-11 | legacy F10 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-12 | legacy F11 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-13 | legacy F12 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-14 | legacy F13 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-15 | legacy F14 round trip and interpretation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-16 | saved song path preserved | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-17 | radial copy adjacent shortest paths | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-18 | conversion tie break | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-19 | copy starts with travel eight | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S01-A03-20 | copy preserves music and source IDs | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A01-01 | chain limit one | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-02 | chain limit two | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-03 | chain limit three | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-04 | empty-junction hop | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-05 | sink sounds before ending | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-06 | fork both children | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-07 | reverse return | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-08 | convergence distinct sounds | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-09 | seven-hop loop | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-10 | Off receives no child | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A01-11 | all-Off generator keeps its clock | **passed** | [step-02/circuit-traces.json](step-02/circuit-traces.json)  |
| SG-S02-A02-01 | child used hops inherited | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A02-02 | child travel limit inherited | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A02-03 | child speed inherited | **blocked** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S02-A02-04 | travel does not change hop duration | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A02-05 | source passage creates no emission | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A02-06 | distinct visits retain IDs | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A02-07 | children share the master grid | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A02-08 | unequal-edge chord arrivals | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A02-09 | whole-beat tempo changes align active and new sparks | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A03-01 | fine/coarse finite timeline | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A03-02 | dense fine/coarse timeline | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A03-03 | simultaneous source emissions and arrivals | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A03-04 | source ordering | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S02-A03-05 | exit ordering | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A01-01 | more than 10000 hops | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A01-02 | bounded active edges | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A01-03 | bounded arrival history | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A01-04 | bounded event history | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A01-05 | disable retains live Infinite branch | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A01-06 | exit Off ends future departure | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A01-07 | source deletion stops descendants | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-01 | gate before arrival | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-02 | gate at unprocessed arrival | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-03 | gate after processed arrival | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-04 | committed edge times unchanged | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-05 | moved occupant reconciliation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-06 | added occupant reconciliation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-07 | deleted occupant cancellation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-08 | committed sound parameters | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A02-09 | edit revision and effective time | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A03-01 | offline onset within one frame | **passed** | [step-03/live-audio/attempt-08/report.json](step-03/live-audio/attempt-08/report.json)  |
| SG-S03-A03-02 | independent live calibration | **passed** | [step-03/live-audio/attempt-08/report.json](step-03/live-audio/attempt-08/report.json)  |
| SG-S03-A03-03 | at least 120 live arrivals | **passed** | [step-03/live-audio/attempt-08/report.json](step-03/live-audio/attempt-08/report.json)  |
| SG-S03-A03-04 | 100ms main-thread stall | **passed** | [step-03/live-audio/attempt-08/report.json](step-03/live-audio/attempt-08/report.json)  |
| SG-S03-A03-05 | 250ms main-thread stall | **passed** | [step-03/live-audio/attempt-08/report.json](step-03/live-audio/attempt-08/report.json)  |
| SG-S03-A03-06 | no missing measured arrivals | **passed** | [step-03/live-audio/attempt-08/report.json](step-03/live-audio/attempt-08/report.json)  |
| SG-S03-A03-07 | live loopback observer continuity | **passed** | [step-03/live-audio/attempt-08/report.json](step-03/live-audio/attempt-08/report.json)  |
| SG-S03-A04-01 | 256 active edges | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-02 | 2016 rolling arrivals per second | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-03 | 5376 pending cap | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-04 | 64 resident voices and original stealing policy | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-05 | 64 decisions per audio quantum | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-06 | prospective split checked atomically | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-07 | finite edge times | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-08 | no zero-time loop | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-09 | no growing route arrays | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-10 | bounded ancestry IDs | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-11 | 2048 reliable event backlog | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-12 | 23520 output ownership metadata cap | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-13 | overload recovery | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A04-14 | measured worklet budget | **passed** | [step-03/qualified-worklet-budget/report.json](step-03/qualified-worklet-budget/report.json)  |
| SG-S03-A05-01 | Pause cancellation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A05-02 | load cancellation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A05-03 | clear cancellation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A05-04 | interruption cancellation | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A05-05 | old transport epoch events ignored | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A05-06 | old transport epoch status ignored | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A05-07 | fresh resume session | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A05-08 | two sources retain ownership | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A05-09 | long owned voice after 64 short voices | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S03-A06-01 | future receiver trigger | **passed** | [step-03/receiver.json](step-03/receiver.json)  |
| SG-S03-A06-02 | stable trigger IDs | **passed** | [step-03/receiver.json](step-03/receiver.json)  |
| SG-S03-A06-03 | positions precede triggers | **passed** | [step-03/receiver.json](step-03/receiver.json)  |
| SG-S03-A06-04 | cancel delivery | **passed** | [step-03/receiver.json](step-03/receiver.json)  |
| SG-S03-A06-05 | stop/reset delivery | **passed** | [step-03/receiver.json](step-03/receiver.json)  |
| SG-S03-A06-06 | strict wire grammar excludes gate metadata | **passed** | [step-03/receiver.json](step-03/receiver.json)  |
| SG-S03-A06-07 | owned source cancellation | **passed** | [step-03/receiver.json](step-03/receiver.json)  |
| SG-S04-A01-01 | canvas On | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A01-02 | canvas Off | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A01-03 | sink through canvas | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A01-04 | continuation through canvas | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A01-05 | split through canvas | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A01-06 | state edits real scene | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A01-07 | routing edits real arrivals | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A01-08 | empty world arrows visible | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A01-09 | unselected arrows clickable | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A02-01 | move instrument keeps wiring | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A02-02 | delete instrument keeps wiring | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A02-03 | move generator keeps both junctions wiring | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A02-04 | Undo restores scene and wiring | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-01 | gate tap does not place | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-02 | gate tap does not move | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-03 | gate tap does not delete | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-04 | drag cancels gate edit | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-05 | pointercancel cancels gate edit | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-06 | Escape cancels gate edit | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-07 | focus loss cancels gate edit | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-08 | competing pointer cancels gate edit | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-09 | persistent palette placement | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-10 | explicit Move | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-11 | trash | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A03-12 | orbit | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A04-01 | arbitrary rotation | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A04-02 | upside-down camera | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A04-03 | rear gates cannot be picked | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A04-04 | resize | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A04-05 | narrow layout | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A04-06 | touch emulation | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A04-07 | nearest visible target | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A05-01 | keyboard gate focus | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A05-02 | Space toggles | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A05-03 | Enter toggles | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S04-A05-04 | empty junction selection | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S04-A05-05 | bulk All on inspector | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S04-A05-06 | bulk All off inspector | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A01-01 | Ink switch renderer | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A01-02 | Toy switch renderer | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A01-03 | Glow switch renderer | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A01-04 | identical routing across switch styles | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A01-05 | Arrow glyph | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A01-06 | Chevron glyph | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A01-07 | Triangle glyph | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A01-08 | Bolt glyph | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A01-09 | Comet glyph | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A01-10 | Ember spark | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A01-11 | White spark | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A01-12 | Lightning spark | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A01-13 | appearance does not reset transport | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A02-01 | switch size | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A02-02 | switch stroke | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A02-03 | On color | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A02-04 | Off color | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A02-05 | switch glow control | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A02-06 | switch animation | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A02-07 | Reset switches look | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-A02-08 | spark style | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-01 | look export | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-02 | look import | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-03 | look reload | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-04 | old look defaults | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-05 | invalid style | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-06 | invalid size | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-07 | invalid stroke | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-08 | invalid glow | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-09 | invalid On color | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-10 | invalid Off color | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A03-11 | invalid animation | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A04-01 | fifty style/icon switches | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A04-02 | stable geometry count | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A04-03 | stable material identities | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A04-04 | zero glow static shape | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A04-05 | reduced motion | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A04-06 | front comparison | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S05-A04-07 | oblique grayscale comparison | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-01 | travel one inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-02 | travel three inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-03 | travel eight inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-04 | travel 93 inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-05 | Infinite inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-06 | reject zero inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-07 | reject negative inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-08 | reject fractional inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-09 | reject unsafe integer inspector | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A01-10 | no percentage travel field | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-01 | save | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-02 | load | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-03 | export | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-04 | import | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-05 | wiring round trip | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-06 | travel round trip | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-07 | source/music IDs round trip | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-08 | instrument parameters round trip | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-09 | paused beat zero on load | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A02-10 | transient sparks excluded | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A03-01 | gate Undo | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A03-02 | gate Redo | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A03-03 | bulk gate edit history | **blocked** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S06-A03-04 | source initialization history | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A03-05 | finite limit history | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A03-06 | Infinite limit history | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A03-07 | numeric gesture one entry | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A03-08 | conversion Undo paused legacy | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A04-01 | corrupt v2 atomic reject | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A04-02 | unsupported version | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A04-03 | storage failure current scene intact | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A04-04 | storage failure previous save intact | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A04-05 | legacy fixtures compatibility | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S06-A04-06 | F15 F16 F17 no collision | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A01-01 | production build | **passed** | [step-07/validation.json](step-07/validation.json)  |
| SG-S07-A01-02 | type checking | **passed** | [step-07/validation.json](step-07/validation.json)  |
| SG-S07-A01-03 | full unit suite | **passed** | [step-07/unit-qualified-results.json](step-07/unit-qualified-results.json)  |
| SG-S07-A01-04 | full browser suite | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json) Full combined regression; the earlier failed attempt is retained in regression-combined. |
| SG-S07-A01-05 | audio regressions | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A01-06 | output regressions | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A01-07 | asset manifest/archive verification | **passed** | [step-07/asset-verification.json](step-07/asset-verification.json)  |
| SG-S07-A02-01 | 60 FPS timeline | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A02-02 | 15 FPS timeline | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A02-03 | 2 FPS timeline | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A02-04 | render cap logical/visible/hidden counts | **passed** | [step-07/fps-timelines.json](step-07/fps-timelines.json)  |
| SG-S07-A03-01 | 30-minute eight-source finite circuit | **passed** | [step-07/qualified-soak/result.json](step-07/qualified-soak/result.json) Immutable production snapshot and its source manifest retained. Earlier candidate runs are preserved separately. |
| SG-S07-A03-02 | 30-minute controlled Infinite loop | **passed** | [step-07/qualified-soak/result.json](step-07/qualified-soak/result.json) Immutable production snapshot and its source manifest retained. Earlier candidate runs are preserved separately. |
| SG-S07-A03-03 | worklet clock retained | **passed** | [step-07/qualified-soak/result.json](step-07/qualified-soak/result.json) Immutable production snapshot and its source manifest retained. Earlier candidate runs are preserved separately. |
| SG-S07-A03-04 | active/pending state plateau | **passed** | [step-07/qualified-soak/result.json](step-07/qualified-soak/result.json) Immutable production snapshot and its source manifest retained. Earlier candidate runs are preserved separately. |
| SG-S07-A03-05 | event history plateau | **passed** | [step-07/qualified-soak/result.json](step-07/qualified-soak/result.json) Immutable production snapshot and its source manifest retained. Earlier candidate runs are preserved separately. |
| SG-S07-A03-06 | renderer geometry plateau | **passed** | [step-07/qualified-soak/result.json](step-07/qualified-soak/result.json) Immutable production snapshot and its source manifest retained. Earlier candidate runs are preserved separately. |
| SG-S07-A03-07 | telemetry zero loss | **passed** | [step-07/qualified-soak/result.json](step-07/qualified-soak/result.json) Immutable production snapshot and its source manifest retained. Earlier candidate runs are preserved separately. |
| SG-S07-A04-01 | deliberate branching saturation | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A04-02 | repeated Infinite emission saturation | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A04-03 | visible pause reason | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A04-04 | pending work released | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A04-05 | voices released | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A04-06 | simplify and recover | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S07-A04-07 | no backlog on resume | **passed** | [step-07/regression-qualified/full-browser-results.json](step-07/regression-qualified/full-browser-results.json)  |
| SG-S01-H01-01 | directed ownership | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S01-H01-02 | reverse travel | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S01-H01-03 | empty-junction counting | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S01-H01-04 | final arrival sound | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S02-H01-01 | trace single branch | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S02-H01-02 | trace split parents/children | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S02-H01-03 | count hops | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S02-H01-04 | identify termination | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S03-H01-01 | listen chain | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S03-H01-02 | listen fork | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S03-H01-03 | listen sink | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S03-H01-04 | listen revisiting loop | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S03-H01-05 | no destination particle | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S03-H02-01 | switch during travel | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S03-H02-02 | Pause Infinite promptly | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S04-H01-01 | open two exits | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S04-H01-02 | close an exit and hear change | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S04-H01-03 | wire empty junction | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S04-H01-04 | move instrument and see retained wiring | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S04-H02-01 | keyboard edits | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S04-H02-02 | touch emulation review | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S04-H02-03 | physical touch result distinguished | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S05-H01-01 | Ink front and oblique | **blocked** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-H01-02 | Toy front and oblique | **blocked** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-H01-03 | Glow front and oblique | **blocked** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md) Superseded by later direct user requests for flat arrows, five icons, three spark styles, a live tray and shared-grid hop timing. Older look fields still validate; their former individual UI controls are historical. |
| SG-S05-H01-04 | current flat icons direction and target clarity | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S05-H02-01 | adjust while listening | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S05-H02-02 | grayscale zero-glow comparison | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S05-H02-03 | reduced motion comparison | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S06-H01-01 | prepared chain review | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S06-H01-02 | prepared fork review | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S06-H01-03 | change travel | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S06-H01-04 | save/export/reload and hear phrase | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S06-H02-01 | saved song copy review | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S06-H02-02 | intentional phrase change recognized | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S06-H02-03 | Undo preserves original | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H01-01 | Chrome editing | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H01-02 | Chrome styles | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H01-03 | Chrome 1/3/Infinite | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H01-04 | Chrome saving | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H01-05 | Chrome Pause | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H01-06 | Chrome rotation | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H01-07 | Safari editing | **not run** | [step-07/safari-native-ui.json](step-07/safari-native-ui.json) Native agent UI spot checks were performed; the required person review remains open. WebDriver is disabled separately. |
| SG-S07-H01-08 | Safari styles | **not run** | [step-07/safari-native-ui.json](step-07/safari-native-ui.json) Native agent UI spot checks were performed; the required person review remains open. WebDriver is disabled separately. |
| SG-S07-H01-09 | Safari 1/3/Infinite | **not run** | [step-07/safari-native-ui.json](step-07/safari-native-ui.json) Native agent UI spot checks were performed; the required person review remains open. WebDriver is disabled separately. |
| SG-S07-H01-10 | Safari saving | **not run** | [step-07/safari-native-ui.json](step-07/safari-native-ui.json) Native agent UI spot checks were performed; the required person review remains open. WebDriver is disabled separately. |
| SG-S07-H01-11 | Safari Pause | **not run** | [step-07/safari-native-ui.json](step-07/safari-native-ui.json) Native agent UI spot checks were performed; the required person review remains open. WebDriver is disabled separately. |
| SG-S07-H01-12 | Safari rotation | **not run** | [step-07/safari-native-ui.json](step-07/safari-native-ui.json) Native agent UI spot checks were performed; the required person review remains open. WebDriver is disabled separately. |
| SG-S07-H02-01 | unfamiliar person selects instrument | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H02-02 | unfamiliar person toggles exit | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H02-03 | unfamiliar person recognizes split | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H02-04 | unfamiliar person recognizes sink | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
| SG-S07-H02-05 | unfamiliar person sets three hops | **not run** | [step-07/Human-Review-Task.md](step-07/Human-Review-Task.md)  |
