# Step 7 — regression, soak and handoff

Date: 2026-10-14T19:47:11.635836+00:00. Kickoff checkpoint: `396c820` on `codex/bongo-planet`.
Reference environment: macOS 26.5.1, arm64, Node v22.20.0, Chrome 155.0.8059.41.
Source identifier: [retained application manifest](../step-07/qualified-soak/application-manifest.json); compiled candidate is retained beside it. [Environment](../step-07/environment.json).

Later direct requests replace the original dimensional switches with permanent flat glyphs, three spark looks, a left tray, shared-grid timing, generator-placement initialization and bundled composition files. The individual checklist identifies superseded cases. Human results are not inferred from source tests.

Checks: SG-S07-A01/A02/A03/A04.

Full units: 467 passed. Full browser: 68 passed, 0 failed. Final timed soak: passed.

[Final measured review](../review.md), [individual checklist](../Acceptance-Checklist.md), [browser interactions](regression-qualified/), [immutable build and samples](qualified-soak/), [remaining human task](Human-Review-Task.md).

Commands: `npm run build`, `npm test -- --maxWorkers=1 --no-file-parallelism`, `npm run test:web`, `spark-gates-soak.ts`, asset archive hash verification.

SG-S07-H01/H02 remain not run; WebDriver configuration is blocked separately from native Safari spot checks. Overall acceptance is not closed.
