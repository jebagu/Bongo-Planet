# Bongo Planet — integrated receiver regression checks

`latest-integration-results.json` records six passing checks from the actual bridge tests, including the real installed-Chrome companion. The oversized-producer test sends an actual WebSocket frame above the server's 128 KiB bound, observes close code 1009 and verifies session release and the recorded socket error. The real companion check verifies execution coordinates, rejects an active object rebinding, permits rebinding after node cancellation, and cancels a pending onset.

`ordering-unit-results.json` records three passing controlled-clock tests. These use actual bridge/WebSocket admission with a simulated ordered receiver interface. Each retains an execution receipt delivered after cancellation, stop, or stop followed by a new session, ahead of the applied-command boundary. None recreates an active voice; a repeated receipt after the boundary produces no second onset. These tests isolate Node's receipt/tombstone handling. They do not prove browser receipt ordering or live timing.

Commands:

```sh
npm run typecheck
npx vitest run tests/bridge.test.ts tests/bridge-render.test.ts --reporter=json --outputFile=evidence/step-09/render-clock-integration/latest-integration-results.json
npx vitest run tests/bridge-ordering.test.ts --reporter=json --outputFile=evidence/step-09/render-clock-integration/ordering-unit-results.json
```

The earlier isolated-stall report `attempt-03-raw.json` records its capture-time source SHA, but the exact source bytes at that SHA were not saved before later diagnostics-only edits. Its raw observations remain available; an exact source reconstruction is not claimed. New full-fixture qualification saves exact source snapshots before launch. All milestone, physical-output and human listening gates remain open.
