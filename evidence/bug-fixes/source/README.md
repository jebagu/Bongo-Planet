# Bongo Planet

A musical constellation on a full 3V sphere. Place silent generators, melodic notes and percussion; surface distance sets arrival time. The browser instrument uses an independent TypeScript engine, Three.js and original mono AudioWorklet synthesis.

## Run locally

Requires Node.js22+ and npm. From this folder:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5417/BongoPlanet/**. Port5417 is strict: an occupied port is an error, never an automatic new URL. First generator placement starts an empty composition; loaded scenes start paused. The left menu contains the palette, piece/global controls, Volume, and Play. Utilities and collapsed Instrument diagnostics sit in the bottom tray.

Choose Generator, Note, or Beat, then click open dots repeatedly to add pieces. The tool stays active while the newest piece is highlighted. Click the active tool again or press Escape to exit placement. Select a piece to edit it; drag it to another dot to move it, or choose Move before clicking its destination. Drag a piece to the trash beside the sphere to delete it; Undo restores it. Drag empty space to rotate continuously through any direction, including upside-down views. Scroll to zoom.

In a second terminal:

```sh
npm run bridge
```

The bridge starts a private Node worker for native monotonic control execution. Wait for its ready launch message, then expand Instrument diagnostics → Connect local bridge. Open **http://127.0.0.1:5418/receiver** to inspect decoded ADM-OSC packets and actual control receipts. The WebSocket service binds127.0.0.1:5418; UDP test receiver uses127.0.0.1:5419. The producer endpoint accepts only the instrument's localhost origin. Clock, worker or bounded-backlog failure stops the receiver and requires a bridge restart. The optional `npm run bridge -- --render-clock` retains the earlier private Chrome AudioWorklet diagnostic. See the [protocol contract](docs/Output-Protocol.md). This demonstrates numerical control delivery; venue synthesis and spatial audio remain unqualified.

## Verify

```sh
npm run verify
npm run fixtures
npx tsx scripts/independent-engine-probe.ts
npx tsx scripts/engine-evidence.ts
npx tsx scripts/audio-evidence.ts
```

`verify` typechecks/builds and runs source/audio/protocol tests plus installed-Chrome browser tests. Dev server5417 and bridge5418 must already run for browser tests. Chrome executable: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Playwright video tests require `npx playwright install ffmpeg`; no replacement browser is needed. Browser artifacts are under `evidence/`. To run the production candidate after building, stop the dev server and use `npm run preview` at the same permanent URL. Live audio timing, actual Safari, unfamiliar-player, physical-touch, venue and iOS checks are separately reported. Source/offline tests do not close those gates.

Fixtures F00–F09 cover empty world, first pattern, chords, distance phrase, overlap, edits during travel, dense mix, cardinal directions, maximum workload and slow/overtaking stress. Their JSON files are in `public/fixtures/`; independent delay tables and actual vertex coordinates are in `evidence/step-02/fixture-tables.md`. Save keeps a browser-local copy; Export produces portable version1 JSON. Import validates before replacing the current scene and starts paused.

## Review status

Implementation is in progress. No milestone is accepted while its required checks remain open. See [Acceptance-Checklist.md](Acceptance-Checklist.md), [Rules.md](Rules.md), [Work-Package.md](Work-Package.md), and [external dependencies](docs/External-Dependencies.md). Original NodeBeat research assets are preserved as reference. The instrument uses original interface graphics and synthesized sounds. Its release candidate excludes unrelated research explorer assets. See [build handoff](docs/Build-Handoff.md) for the tested revision, measured results and remaining acceptance work.

The lead owns contracts, engine, scheduling/cancellation and integration; bounded workers implement rendering/input and synthesis. Independent reviews record actual failures and repairs under `evidence/step-03/` and `evidence/step-09/`.

Runtime library and font license texts: [third-party notices](docs/Third-Party-Notices.md).
