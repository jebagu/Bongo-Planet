# Bongo Planet — current verification

Fresh isolated checkout: `/var/folders/w6/592shmyj7sbgwmrqvbhb1kw80000gn/T/bongo-clock-verify-hc32w4k_`.

- Fresh `npm ci`: exit0, 59 packages installed, 60 audited, zero reported vulnerabilities.
- `npm run build`: exit0, original committed project Vite configuration. The unrelated working research plugin was not included. Main asset SHA-256 `3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207`; processor SHA-256 `0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793`.
- Fresh unit repeat: **129/129 assertions passed, all27 reported suites passed, success=true**. Actual native worker tests were serialized using `--no-file-parallelism`. [Results](current-clean-unit-attempt02-results.json), [actual native witnesses](current-clean-unit-witnesses/).
- Fresh Chrome repeat: **29/29 passed, zero skipped, zero flaky**, 68.745197 seconds, starting2026-10-11T21:26:06.711Z. [Results](current-browser-attempt02-results.json), [retained test/source/evidence copy](current-browser-attempt02/), [videos/assets](current-browser-attempt02-assets/).
- Current working tree `npm run typecheck`: exit0 after the reviewed original-mixture harness and full-forward diagnostic additions, before capture-02 launch.

The first fresh unit attempt passed all129 assertions but exited1 because the native-test evidence parent directory was absent in a new checkout. Its report remains [preserved](current-clean-unit-results.json). The correction creates only that parent directory before the exclusive capture directory.

The first fresh full browser attempt passed28/29. Its capacity harness continued using a40BPM phase clock after the product changed to180BPM, so it stopped creating valid emissions before reaching the queue cap. The correction uses an independently specified piecewise tempo clock and awaits each actual emission identity rather than a bounded telemetry-ring count. The production code and queue limit were unchanged. [Original full attempt](current-browser-attempt01/), [capacity diagnosis and corrected attempts](../step-05/capacity-current/Analysis.md).

Commands for the current repeated checks:

```sh
npx vitest run --no-file-parallelism --reporter=json --outputFile=/absolute/path/current-clean-unit-attempt02-results.json
BONGO_CAPACITY_EVIDENCE_DIR=evidence/step-05/capacity-current/full-suite PLAYWRIGHT_JSON_OUTPUT_NAME=/absolute/path/current-browser-attempt02-results.json npx playwright test --reporter=line,json --output=/absolute/path/current-browser-attempt02-assets
```

Browser checks require the source dev server at the permanent5417 URL and an available local bridge. The production preview is restored after the browser suite. These checks do not substitute for the separately measured failed F01 receiver loop, full original-mixture onset qualification, Safari parity, unfamiliar-player acceptance, venue listening or physical iOS devices. All milestones remain open.
