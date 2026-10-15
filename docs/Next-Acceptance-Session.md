# Bongo Planet — next acceptance sessions

No milestone has been accepted. The local instrument and receiver can be reviewed independently of venue hardware; check-by-check status and observed evidence belong to Acceptance-Checklist.md. Later advanced effects, wander/inside-view and iOS implementation await M1 acceptance, as required by the work package.

## Numerical prerequisites

The current native receiver F01 loop delivered179/180; its missed callback arrived20.920250ms late despite624.460ms queue lead. Keep the failure and investigate a concrete scheduler/runtime cause before choosing a remedy. F04 delivered420/420. Control-clock conversion is independently bounded, while continuous AudioContext-to-performance mapping remains unqualified. See the [current independent review](../evidence/step-09/native-clock-qualification/attempt-01/Native-Qualification-Review.md).

The processor correction has completed a thirty-minute simultaneous product/input continuity audit. A later binary capture completed the full F02/F03/F06/F08 windows, deliberate stalls and actual100ms delay negative; independent readback verifies complete PCM/event retention and fixed640-sample native latency. Earlier backlog failures remain preserved. The original fixed-model maximum-sample criterion still fails for F06/F08. A separately declared block-cursor arithmetic hypothesis matches the complete F06 window exactly and closely matches F08, but it does not establish individual acoustic onset times. Full original-mixture and Safari individual-onset timing therefore remain open. See the [acquisition/fidelity review](../evidence/step-05/original-mixture/binary-capture-01/Review.md) and [cursor hypothesis limits](../evidence/step-05/original-mixture/binary-capture-01/Cursor-Hypothesis-Review.md).

The earlier candidate passed129 unit checks and29 Chrome source checks. The later current view repair has separately passed its affected5 mathematical checks,6 Chrome component checks and production presentation/view-model audits; this is not a rerun of the entire earlier suite on the current revision. Use the [current handoff](Build-Handoff.md) for source bindings and scoped evidence. Automated results do not substitute for real output or listening.

## Browser human review

Use the permanent URL http://127.0.0.1:5417/BongoPlanet/. For a production candidate run `npm run build` then `npm run preview`; for source harness checks run `npm run dev` instead. Only one owns5417. Run `npm run bridge` separately. The current Chrome/Playwright results do not substitute for the unfamiliar-player task or listening judgment.

Give an unfamiliar person a fresh interactive scene and only this prompt: **“Make a short musical pattern on the sphere.”** Start the 60-second timer when the scene is ready. Without coaching, observe whether they place a generator, two notes and a beat, hear a repeating pattern, make an audible change and identify its cause. Record elapsed time, actual actions, confusion, assistance and outcome. After the timed task, review pause, Clear/recovery and saved scenes separately. Use the original fixture listen/watch instructions and Step10 human rows for the formal review. A coached demonstration is not an unfamiliar-player pass.

An experienced reviewer checks front/back placement, camera independence, audible chord/phrase/overlap, mid-flight edits, interruption recovery, saved scenes and causality. Review actual Safari on the reference laptop separately. Physical touch-device checks require a real accessible device; pointer simulation records only simulated gesture ownership.

## Venue intake and calibration

The venue technical owner must provide the current Feÿ sound path, speaker/channel map and measured positions, coordinate origin/axes/units, listener area, subwoofer route, network endpoint/access, renderer/synth version and control protocol, clock ownership, object limits and operator access. No venue values have been inferred from the research archive.

Before implementing the physical route, agree the numerical venue timing/freshness limits and directional acceptance script. Preserve the measured profile outside exported compositions. Test each physical channel, then run right/left/forward/back/up/down blind-to-target listening at recorded listener positions. Capture requested/perceived directions and ambiguities. A successful localhost receiver or room recording alone cannot close M2.

## Physical iOS prerequisite

Xcode is installed at `/Applications/Xcode.app/Contents/Developer`. The live device inventory on11October2026 exposed an iPad entry marked unavailable and a provisioning-provider warning; it did not establish an available physical test device or a working signing route. No iOS install/build parity claim is made.

After M1, choose the minimum supported device/OS matrix and architecture against an actual installable probe. Evaluate native audio-render scheduling versus a WebKit wrapper using physical AudioWorklet/lifecycle/network evidence. The shared version1 scene contract, stable geometry and engine oracle define parity; simulator output cannot replace device tests. Obtain an accessible named physical device, development signing access and the selected receiver network route before qualifying Steps17–19. No App Store submission or purchase is authorized.

The next concrete dependency is an available unfamiliar player and listening reviewer for M1, followed by the actual venue owner/profile and accessible physical iOS test devices. Numerical live-output and audiovisual gates must also pass; human approval does not erase missing measurements.
