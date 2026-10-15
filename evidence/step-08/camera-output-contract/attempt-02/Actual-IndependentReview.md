# Bongo Planet — independent camera/output attempt02 readback

**The retained actual supports all four finite paused-output cases. No contradictory result or remaining blocker was found within that scope.** `scopedChecksPassed=true`, `qualificationPassed=false` and `errors=[]` are consistent with the independently checked data. The static result adds current evidence to S08-A9. The moving results establish sampled paused control-position behavior at the three selected frame-rate settings; **S08-A11's sustained active-source requirement remains open**. Actual01 remains failed and unchanged.

This review read source and retained artifacts, recomputed their small-file hashes, and performed independent arithmetic/OSC decoding on the recorded JSON. It launched no browser, service, test, capture, profiler or production helper and changed only this note.

## Execution and bindings

The report is 1,605,442 bytes, SHA `bbfb5f27d6f914a4977a44566dab064134075541d8fe9bdba278110c7e09cecc`. RootExecution records launch `182919`, session `88344`, terminal `f92d07`, exit 0. The external controller records 2026-10-12T03:01:47.780056Z through 03:01:54.245870Z, monotonic elapsed 6.467746790964156 seconds, owned PID/process group 37853 and `forcedCleanup=false`. These are retained controller observations, not a new reviewer execution.

The exact executed spec remains `a0a9dc7db15b4fff568b2a6b1cfeb41a93b47a7f2f265e2895fba45cfde099b1` (20,626 bytes); OutputAdapter remains `70d3cb4326689f0348a86a5f1929ca0a3ff6b32d95be24a303944fac53763089` (8,203 bytes). All 61 files/541,837 bytes of preparation Manifest-04 independently match their recorded sizes/hashes; that manifest is `d57e9d994c3b00c7d9d19ec32310bb335e6691289d539a679d467ca820161473`. It retains the successful global typecheck `d6a089` and the earlier failures. Root's GO binds final source review `317ba4b1…`; no earlier conditional review or failed check is substituted for the completed preflight.

The genuine page script response, served-before body and served-after body independently hash to `32b57ff2dabeadc3d85f8143cd91c50abeea9785ebb1a2f35497ee1db198bb93`, each 697,116 bytes. There is exactly one qualifying original page-main response at the declared `index-BXks7Y4v.js` URL. These establish the executed main and separately observed served stability. The retained installed Three sources explain gesture direction and polar clamping but are not reconstructed executed bundle inputs. Audio remained locked: no loaded processor-body or acoustic claim follows from this run or from root's separate served-processor preflight.

Additional independently hashed witnesses:

- `Root-Actual02-GO.json`: 1,068 bytes, `273397905b4e33fd3e8ccea30521bcc1231e251809bfb10df04dee796e9941a3`.
- `Root-Actual02-Controller.json`: 827 bytes, `377178456d6ac9e67a2b3c5606d0c23d1af002188d7f318faee764d092f81266`.
- `initial-receiver.json`: 40,041 bytes, `2406d55998cc240be8071426e8865e6747a797bbeae750357a931a4146b23994`.
- `receiver-before-close.json`: 137,794 bytes, `ae39cb2c2cc5b46bd5086356cfbfff05000ce57a4b410e095de25236610eb5a2`.

## Complete packet denominator and static case

I decoded **all 44 raw OSC packets**, including string terminators/padding, `/adm/obj/<ID>/xyz`, `,fff`, exact remaining 12 bytes and three big-endian finite Float32 values. All 44 browser position sends match all 44 receiver position rows and all 44 decoded UDP packets **one-to-one in original order, without skipping extras or duplicates**. Receiver XYZ equals the corresponding JSON send exactly; each decoded component equals independent binary32 rounding of that send. Maximum resulting vector difference is 3.0993466352e-8, below 1e-6.

The 57 bridge records contain 44 positions, four starts and nine stops. Traversing their actual start/stop boundaries binds every position to its sent session. Position sequences in the four sessions are contiguous from one, with counts **6/8/15/15**. These are position-stream observations; the send witness does not purport to retain every heartbeat/control wire. All right-node movement packets preserve object ID 2028154342. The 21 measured forward-arc packets are a subset of the full 44, which also retain the initial six positions and preparation/reset trajectories.

The complete before/orbited/zoomed scene equals the retained original F07 fixture. Independent coordinates derived from normalized `(3φ,0,1)` and its declared orientations agree with all six fixed receiver objects to maximum vector error 1.2412670766e-16. Node IDs, object IDs and receiver world XYZ remain exact through static orbit and zoom. The observed orbit displacement is 4.1408367559; the zoom changes camera radius by 0.2440800903. Trusted canvas/capture pointer records support the public orbit. The static interval is exactly wire indices `[6,6)`, with **zero** additional position/receiver/UDP rows. This is a valid unchanged-output observation, not six fabricated resends during the gesture. The six mandatory initial rows supply the nonempty delivery denominator.

## Three concurrent paused trajectories

Each arm independently retains a single right note, public edit vertex 85→10, the original remaining piece/settings fields, the requested FPS limit, and the complete resulting scene. I recomputed the shortest unit arc from the analytic endpoints using dot/atan2 coordinates, without calling production geometry. Each arm contains seven monotonic position samples ending at the exact declared destination. Maximum arc residual across all 21 is 1.6653345369e-16; maximum unit-norm error is 2.2204460493e-16. All seven rows in each arm equal the corresponding contiguous full-report receiver/raw slices.

| FPS setting | Edit bracket width (ms) | Final camera displacement | Intermediate samples before / after camera change | First post-change >.05 sample after edit (ms) |
| --- | ---: | ---: | ---: | ---: |
| 60 | 0.599999905 | 1.839056404 | 3 / 3 | 78.099999905 |
| 15 | 0.500000000 | 0.886600165 | 3 / 3 | 69.200000048 |
| 2 | 0.500000000 | 0.067421705 | 3 / 2 | 99.000000000 |

The post-change counts require `0 < progress < .99`, a sample after the recorded controlling pointer move, and camera displacement greater than .05 relative to that move's pre-control camera. The first qualifying displacements are .2049101432, .0937216040 and .1588875972, at arc fractions .6466666669, .5733333339 and .8233333339 respectively. All qualifying post-change intermediate samples occur before 120 ms from even the earliest edit-bracket endpoint. Thus the assertion is supported by intermediate camera and position observations, not merely different end states.

Every arm has an actual trusted primary pointer move targeting canvas with capture, preceded by the same pointer's `gotpointercapture` and followed by up/lost-capture. The selected start/end points have recorded canvas hits, slot clearance and at least 120-pixel canvas margin. Recorded public camera hemisphere and the chosen ±120-pixel vertical direction agree. Both hemispheres occur. This supplies routing and displacement evidence missing from actual01; it does not rewrite that failed attempt's cause or result.

For timing, I independently recomputed `producerTime = packet.sent − chosen.offset` and each allowed fraction from the retained before/after edit bracket, declared ±1 ms timestamp allowance and unchanged 120 ms duration. Every sample fits; the recorded chosen offset is 1.6664151670238418 seconds. It is the same producer offset added to packet timestamps, so it cancels into the browser clock. This is explicitly conditional on the stated same-browser monotonic/precision premise, **not** a continuous browser-to-Node calibration or an independently measured receiver-age bound.

The first sampled endpoint sends occur 136.699999928, 129.299999952 and 128.899999976 ms after the earliest edit time. These are finite output samples consistent with the 120 ms interpolation rule and periodic sending. They do not prove an endpoint packet was emitted exactly at 120 ms or that every unobserved interior instant was measured. FPS is the retained selected render limit, not a physical display refresh-rate certification.

## Caps, closure and remaining scope

The final retained counts are 44 wire rows, 48 trusted pointer rows, 16 checkpoints, 57 bridge rows and 44 raw packets, comfortably below their declared row caps. There are no reported wire/browser errors, context loss, drop, pending trigger or active voice in measured snapshots. Final browser state is audio `locked`, musical events empty and output disconnected. The native recent-row diagnostic contains its bounded 64-row tail; this note does not call it a complete native execution trace.

Native cleanup reports `closedAcknowledged=true`, `exitObserved=true`, `exitCode=0`; unacknowledged commands/bytes are zero, and failure/closeFailure are null with no reported failures. HTTP closure is observed. Final receiver session is empty with zero objects/pending/voices/drops. Root's separate `Root-CleanupReadback.json` (477 bytes, SHA `1a1ee06dce0e9a3e8096f4e3d90df9f72d93dafd4c59d7edc6770d15d35be2c8`) records no remaining owned-group/profile matches and refusal at private HTTP port 56046. This is limited post-terminal inventory, not a complete OS census, UDP exclusivity proof or acoustic release measurement.

The result supports static camera independence and the sampled **paused** manual position path through trusted concurrent camera gestures at 60/15/2 FPS settings. It does not independently satisfy sustained active-source following, real renderer/venue interpolation, audible or physical timing, human legibility, Safari, continuous clock behavior or all camera states. No acceptance status or original failure was changed by this review.
