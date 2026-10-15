# Independent circuit expectations

Fixed topology `icosa-3v-v1`, measured directly before the propagation implementation. G = vertex 0, A = 1, B = 2, C = 3, D = 4, E = 5. Vertex 0 has neighbors 1, 4, 10, 16, 22. A has neighbors 0, 2, 4, 5, 10, 13. B has neighbors 1, 3, 5, 6, 13, 15. D connects to both 0 and 1; E connects to both 1 and 4.

The initial geometric timing oracle is retained in `Independent-Fixtures-v0.1.md`. The later authorized shared-grid contract replaces it: every hop takes `15 / BPM` seconds, independently of geometric length. At 120 BPM the first, second and third hops end 0.125, 0.250 and 0.375 seconds after emission. Source emissions start at hop zero. These fixed vertex lists and analytic times are written before engine execution; `step-02/circuit-traces.json` contains the resulting actual events, budgets and provenance.

| Circuit | Directed exits | Expected arrivals |
| --- | --- | --- |
| Chain | 0→1, 1→2, 2→3 | limit 1: A; limit 2: A,B; limit 3: A,B,C, including the final sound |
| Empty chain | Same, no instrument at A | A silent hop still counts; B then C play |
| Fork | 0→1; 1→2 and 1→5 | A sounds at 0.125 s; two children inherit one used hop and limit, then B and E both sound at 0.250 s. Unequal strut lengths produce different display speeds, never different musical deadlines. |
| Sink | 0→1; explicit 1→none | A plays then stops |
| Return | 0→1; 1→0 | With limit 3: A, silent G, A. No new clock emission from passage |
| Convergence | 0→1 and 0→4; 1→5 and 4→5 | A and D; two distinct E sounds, even if their times coincide |
| Finite loop | 0→1; 1→4; 4→0 | Limit 7: 1,4,0,1,4,0,1. Seven edge completions |
| Infinite loop | Same, disable source after initial emission | Retain one live edge; exceed 10,000 completions; no hidden cutoff |

An A-side switch owns A→B only. The B-side switch owns B→A. Wiring belongs to these structural junctions and remains there when an instrument or source moves. Missing wiring is all Off; an explicit empty record survives ordinary file round trips. Under the later placement request, placing a generator turns all of that junction's outgoing arrows On, even over authored Off wiring, in one history operation. Moving a generator does not initialize either junction.
