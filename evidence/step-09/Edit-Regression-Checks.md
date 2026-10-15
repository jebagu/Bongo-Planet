# Bongo Planet — remote object lifecycle regressions

Actual installed Chrome and the source-served OutputAdapter sent real WebSocket traffic to the receiver on port 5418. No clock, socket buffer, receiver object state, or adapter position state was mocked.

```sh
npx playwright test tests/output-browser.spec.ts --grep 'locked-audio|delayed cancel|same-ID Note' --workers=1 --reporter=line
npx tsc --noEmit
```

Three receiver regressions passed in 4.6 seconds; TypeScript checking passed.

- **Locked audio deletion/readdition:** F07 connects with six remote objects while audio remains locked. Editing away `right` leaves exactly five objects in the same receiver session. Readding the same node ID restores six objects, its original object ID, and exact XYZ. Actual snapshots are in `locked-edit-regression.json`.
- **Delayed cancellation:** Remove `near`, then deliver a delayed engine cancellation naming both removed `near` and retained `far`. The removed object remains absent; the retained object is resent with its original object ID and XYZ, including matching actual decoded UDP coordinates. Actual snapshots are in `delayed-cancel-regression.json`.
- **Retained ID changes kind:** Queue future Note work for `near`, edit it to Beat with the same ID, cancel the old work, then schedule the Beat. Actual receiver ordering is old-trigger cancellation → fresh position → accepted new trigger, followed by exactly one new actual onset at the current position. The old future onset is cancelled. Actual snapshots and ordering indexes are in `same-id-kind-regression.json`.

Receiver drop counters did not increase in these passing checks. The fixture-based expectations are derived from actual fixture node IDs; the synthetic trigger IDs are unique per run to exclude historical receiver log rows. Source-only adapter regressions explicitly skip on immutable production hosting. This short regression pass does not replace the pending four-minute quiet timing qualification.
