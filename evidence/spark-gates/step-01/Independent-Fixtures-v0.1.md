# Independent circuit expectations

Fixed topology `icosa-3v-v1`, measured directly before the propagation implementation. G = vertex 0, A = 1, B = 2, C = 3, D = 4, E = 5. Vertex 0 has neighbors 1, 4, 10, 16, 22. A has neighbors 0, 2, 4, 5, 10, 13. B has neighbors 1, 3, 5, 6, 13, 15. D connects to both 0 and 1; E connects to both 1 and 4.

Each hop takes chord length / mean topology chord length × 60 / BPM / 4 seconds. Calculate chord lengths from the published vertex coordinates, independently of `seamDistance` or routing code. Source emissions start at hop zero.

| Circuit | Directed exits | Expected arrivals |
| --- | --- | --- |
| Chain | 0→1, 1→2, 2→3 | limit 1: A; limit 2: A,B; limit 3: A,B,C, including the final sound |
| Empty chain | Same, no instrument at A | A silent hop still counts; B then C play |
| Fork | 0→1; 1→2 and 1→5 | A sounds once; two children inherit one used hop, limit and speed. B arrives before E: A–B = 0.40354821233519766; A–E = 0.4124114893098499 |
| Sink | 0→1; explicit 1→none | A plays then stops |
| Return | 0→1; 1→0 | With limit 3: A, silent G, A. No new clock emission from passage |
| Convergence | 0→1 and 0→4; 1→5 and 4→5 | A and D; two distinct E sounds, even if their times coincide |
| Finite loop | 0→1; 1→4; 4→0 | Limit 7: 1,4,0,1,4,0,1. Seven edge completions |
| Infinite loop | Same, disable source after initial emission | Retain one live edge; exceed 10,000 completions; no hidden cutoff |

An A-side switch owns A→B only. The B-side switch owns B→A. Wiring belongs to these structural junctions and remains there when an instrument or source moves. Missing wiring is all Off; an explicit empty record remains authored all Off after placing a generator. Factory placement at an unconfigured source initializes just that source's outgoing gates.
