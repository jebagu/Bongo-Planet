# Bongo Planet — deterministic expected versus actual event timelines

Run 2026-10-11T17:25:27.020Z, command `npx tsx scripts/engine-evidence.ts`. Injected clock,5ms ticks; logical times below are source-engine observations, not live audible measurements. Expectations come from independently calculated fixture angle/quantization tables. Independent seeded oracle coverage is in Independent-Review.md.

| Fixture | Session-trigger ID | Provenance | Angle radians | Emission beat / seconds | Expected onset seconds | Actual onset seconds | Committed sound |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | s1-1 | gen → near | 0.350405413 | 0.000000 / 0.000000 | 0.125000000 | 0.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F01 | s1-2 | gen → far | 1.029884430 | 0.000000 / 0.000000 | 0.500000000 | 0.500000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F01 | s1-3 | gen → kick | 1.382085796 | 0.000000 / 0.000000 | 0.625000000 | 0.625000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F01 | s1-4 | gen → near | 0.350405413 | 4.000000 / 2.000000 | 2.125000000 | 2.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F01 | s1-5 | gen → far | 1.029884430 | 4.000000 / 2.000000 | 2.500000000 | 2.500000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F01 | s1-6 | gen → kick | 1.382085796 | 4.000000 / 2.000000 | 2.625000000 | 2.625000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F01 | s1-7 | gen → near | 0.350405413 | 8.000000 / 4.000000 | 4.125000000 | 4.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F01 | s1-8 | gen → far | 1.029884430 | 8.000000 / 4.000000 | 4.500000000 | 4.500000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F01 | s1-9 | gen → kick | 1.382085796 | 8.000000 / 4.000000 | 4.625000000 | 4.625000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F02 | s2-1 | gen → chord-0 | 0.350405413 | 0.000000 / 0.000000 | 0.125000000 | 0.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F02 | s2-2 | gen → chord-1 | 0.350405413 | 0.000000 / 0.000000 | 0.125000000 | 0.125000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F02 | s2-3 | gen → chord-2 | 0.350405413 | 0.000000 / 0.000000 | 0.125000000 | 0.125000000 | {"kind":"note","frequency":391.99543598174927,"timbre":"sine","duration":0.6,"level":0.65} |
| F02 | s2-4 | gen → chord-0 | 0.350405413 | 4.000000 / 2.000000 | 2.125000000 | 2.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F02 | s2-5 | gen → chord-1 | 0.350405413 | 4.000000 / 2.000000 | 2.125000000 | 2.125000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F02 | s2-6 | gen → chord-2 | 0.350405413 | 4.000000 / 2.000000 | 2.125000000 | 2.125000000 | {"kind":"note","frequency":391.99543598174927,"timbre":"sine","duration":0.6,"level":0.65} |
| F02 | s2-7 | gen → chord-0 | 0.350405413 | 8.000000 / 4.000000 | 4.125000000 | 4.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F02 | s2-8 | gen → chord-1 | 0.350405413 | 8.000000 / 4.000000 | 4.125000000 | 4.125000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F02 | s2-9 | gen → chord-2 | 0.350405413 | 8.000000 / 4.000000 | 4.125000000 | 4.125000000 | {"kind":"note","frequency":391.99543598174927,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-1 | gen → phrase-0 | 0.350405413 | 0.000000 / 0.000000 | 0.125000000 | 0.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-2 | gen → phrase-1 | 1.029884430 | 0.000000 / 0.000000 | 0.500000000 | 0.500000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-3 | gen → phrase-2 | 1.382085796 | 0.000000 / 0.000000 | 0.625000000 | 0.625000000 | {"kind":"note","frequency":391.99543598174927,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-4 | gen → phrase-0 | 0.350405413 | 4.000000 / 2.000000 | 2.125000000 | 2.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-5 | gen → phrase-1 | 1.029884430 | 4.000000 / 2.000000 | 2.500000000 | 2.500000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-6 | gen → phrase-2 | 1.382085796 | 4.000000 / 2.000000 | 2.625000000 | 2.625000000 | {"kind":"note","frequency":391.99543598174927,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-7 | gen → phrase-0 | 0.350405413 | 8.000000 / 4.000000 | 4.125000000 | 4.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-8 | gen → phrase-1 | 1.029884430 | 8.000000 / 4.000000 | 4.500000000 | 4.500000000 | {"kind":"note","frequency":329.6275569128699,"timbre":"sine","duration":0.6,"level":0.65} |
| F03 | s3-9 | gen → phrase-2 | 1.382085796 | 8.000000 / 4.000000 | 4.625000000 | 4.625000000 | {"kind":"note","frequency":391.99543598174927,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-1 | gen-3 → shared-a | 0.350405413 | 0.000000 / 0.000000 | 0.125000000 | 0.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-2 | gen-3 → shared-b | 0.756743305 | 0.000000 / 0.000000 | 0.250000000 | 0.250000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-3 | gen-3 → hat | 1.107148718 | 0.000000 / 0.000000 | 0.375000000 | 0.375000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F04 | s4-6 | gen-4 → hat | 1.382085796 | 0.000000 / 0.000000 | 0.625000000 | 0.625000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F04 | s4-4 | gen-4 → shared-a | 1.642856132 | 0.000000 / 0.000000 | 0.750000000 | 0.750000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-5 | gen-4 → shared-b | 1.498736522 | 0.000000 / 0.000000 | 0.750000000 | 0.750000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-7 | gen-3 → shared-a | 0.350405413 | 3.000000 / 1.500000 | 1.625000000 | 1.625000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-8 | gen-3 → shared-b | 0.756743305 | 3.000000 / 1.500000 | 1.750000000 | 1.750000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-9 | gen-3 → hat | 1.107148718 | 3.000000 / 1.500000 | 1.875000000 | 1.875000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F04 | s4-12 | gen-4 → hat | 1.382085796 | 4.000000 / 2.000000 | 2.625000000 | 2.625000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F04 | s4-10 | gen-4 → shared-a | 1.642856132 | 4.000000 / 2.000000 | 2.750000000 | 2.750000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-11 | gen-4 → shared-b | 1.498736522 | 4.000000 / 2.000000 | 2.750000000 | 2.750000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-13 | gen-3 → shared-a | 0.350405413 | 6.000000 / 3.000000 | 3.125000000 | 3.125000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-14 | gen-3 → shared-b | 0.756743305 | 6.000000 / 3.000000 | 3.250000000 | 3.250000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-15 | gen-3 → hat | 1.107148718 | 6.000000 / 3.000000 | 3.375000000 | 3.375000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F04 | s4-18 | gen-4 → hat | 1.382085796 | 8.000000 / 4.000000 | 4.625000000 | 4.625000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F04 | s4-19 | gen-3 → shared-a | 0.350405413 | 9.000000 / 4.500000 | 4.625000000 | 4.625000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-16 | gen-4 → shared-a | 1.642856132 | 8.000000 / 4.000000 | 4.750000000 | 4.750000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-17 | gen-4 → shared-b | 1.498736522 | 8.000000 / 4.000000 | 4.750000000 | 4.750000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-20 | gen-3 → shared-b | 0.756743305 | 9.000000 / 4.500000 | 4.750000000 | 4.750000000 | {"kind":"note","frequency":261.6255653005986,"timbre":"sine","duration":0.6,"level":0.65} |
| F04 | s4-21 | gen-3 → hat | 1.107148718 | 9.000000 / 4.500000 | 4.875000000 | 4.875000000 | {"kind":"beat","sound":"kick","duration":0.25,"level":0.7} |
| F05 | s5-1 | gen → moving | 3.141592633 | 0.000000 / 0.000000 | 3.000000000 | 3.000000000 | {"kind":"note","frequency":349.2282314330039,"timbre":"sine","duration":0.6,"level":0.65} |

## Cancellation scenarios

| Action | Expected | Actual | Cancellation/reset events |
| --- | --- | --- | --- |
| target deletion at .2s | Original pending onset at3s never fires | 0 onsets through3.1s; pending0 | `[{"type":"cancel","ids":["s6-1"],"nodeIds":["moving"],"reason":"delete"}]` |
| generator deletion at .2s | Original pending onset at3s never fires | 0 onsets through3.1s; pending0 | `[{"type":"cancel","ids":["s7-1"],"nodeIds":[],"reason":"delete"}]` |
| pause at .2s | Original pending onset at3s never fires | 0 onsets through3.1s; pending0 | `[{"type":"cancel","ids":["s8-1"],"nodeIds":[],"reason":"pause"},{"type":"reset","session":"s8","reason":"pause"}]` |
| load at .2s | Original pending onset at3s never fires | 0 onsets through3.1s; pending0 | `[{"type":"cancel","ids":["s9-1"],"nodeIds":[],"reason":"load"},{"type":"reset","session":"s9","reason":"load"},{"type":"reset","session":"s10","reason":"load"}]` |
| clear at .2s | Original pending onset at3s never fires | 0 onsets through3.1s; pending0 | `[{"type":"cancel","ids":["s11-1"],"nodeIds":[],"reason":"clear"},{"type":"reset","session":"s11","reason":"clear"},{"type":"reset","session":"s12","reason":"clear"}]` |

## Source snapshot SHA-256

```json
{
  "src/core/engine.ts": "19e5cba94b0db6c13b642bd28c90bc1def4bb0bc7ac6b5a95faf1e82bfa9aea3",
  "src/core/contracts.ts": "497e8bae2417ccd0652407a9a33dc08a775b56de8e54553465a2ee158ececdfc",
  "src/core/geometry.ts": "b6b788d732a900a102d108623033055bc221099a5d91f8e648af16d2905b69bf",
  "public/fixtures/expected.json": "0d1a6a7f137238894843496d218e0db08484728a3b68f2a7481cce2d6203ee3f"
}
```
