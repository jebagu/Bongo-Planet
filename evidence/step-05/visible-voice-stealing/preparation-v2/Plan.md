# Bongo Planet — original loaded response body observation v2

Source preparation only. V1's helper, preparation and failed attempt01 remain unchanged. A new actual attempt requires reviewer source GO and separate explicit root quiet GO; no retry/fallback is inferred.

The v2 helper preserves original F08/public-load/deliberate-Play behavior, original event/status/render callbacks, bridge disconnection, positive running status↔visible diagnostics equality, complete scene comparison, visible-counter scrolling/screenshots, zero late/telemetry drops, pause/audio.dispose/closed-context/browser checks and narrow S01-A30 scope. Observation-loop conditions are17seconds since Play and18seconds since test entry; actual Play→pause acknowledgement must be≤20seconds. Test26seconds, global runner/final duration30seconds are cooperative/detected bounds; interrupted cleanup remains incomplete failure. No timing, audio/receiver/venue or human qualification is inferred.

Minimal new instrumentation uses public `context.newCDPSession(page)`. Before navigation it registers raw Network request/response/finished/failed listeners, enables Network with3MiB total/1MiB per-resource buffers, and disables HTTP cache explicitly. Cache-disabled loading is an acquisition perturbation, not a timing test. There is no route, fulfilled/replaced response, addModule interception, target auto-attachment, private protocol access or browser/API-fetch processor fallback.

Frozen main URL is parsed from production HTML and its known processor URL from the SHA-verified main bytes. The observer admits exactly one original GET per expected module URL on **one page-CDP session**, rejects redirects/duplicate IDs/URLs/response mismatch/failure/finish-before-response, and retrieves each completed request's body using that original request ID. Main/fixture API preflight remains separate served-state evidence. The mandatory processor proof is the joined actual page-CDP body; absent events/body remain a failure. A direct HTTP hash or successful worklet status cannot substitute.

Retained evidence contains original ordered raw event payloads with independent Node receive clocks, request-ID→response→finish indices, response status/URL, complete decoded module bytes, lengths and SHA256. UTF-8 text/base64 decoding is strict; malformed/noncanonical encodings or unequal expected hashes fail. No Node↔CDP clock subtraction or network-latency claim is made. No processor API fetch occurs inside the page, so a harness fetch cannot masquerade as its actual module request.

Bounded pure observer caps:256raw events,16KiB per event,1MiB cumulative raw payload,2body tasks,1MiB decoded per body/2MiB total. Encoded strings are checked before decoding; unresolved body tasks fail after1.5seconds at the certificate boundary. Existing Playwright response corroboration retains at most16JS requests and has a separate1.5second settlement bound. These are declared diagnostic limits, not product limits. No excess body task is admitted. Every callback failure is retained; decoded valid prefix may remain, but incomplete/missing/error state cannot certify.

Finally retains the observer prefix/body files even on error, catches persistence failures so cleanup continues, detaches CDP, disposes audio, closes context/browser and records acknowledgements. Detach or unresolved/failed observer errors invalidate the whole attempt. Runner timeouts can still prevent a complete report; lack of an acknowledgement is failure rather than inferred closure. Browser closure is runner-owned/acknowledged, not independently inventoried by this spec.

Pure controls cover exact independent UTF-8/base64 bytes, unframed request IDs, unique ordered joins, missing original request, swapped URL ownership, duplicate request/response/finish, body mismatch, loading failure, unsupported finish ordering, invalid/noncanonical base64, decoded byte/task/event caps, missing processor and unresolved promises. They do not simulate Chromium AudioWorklet network availability. Actual page-CDP feasibility remains unmeasured; if absent, preserve the new failure and stop without escalation.

Source-only controls: `npx vitest run tests/ui-loaded-module-observer.test.ts`; `npm run typecheck`. Hold these during root-requested quiet acquisitions. No browser is invoked by the pure observer test import.

Predeclared actual command, **withheld**:

```sh
BONGO_VISIBLE_STEAL_OUTPUT=evidence/step-05/visible-voice-stealing/attempt-02 \
BONGO_VISIBLE_STEAL_MAIN_SHA=32b57ff2dabeadc3d85f8143cd91c50abeea9785ebb1a2f35497ee1db198bb93 \
BONGO_VISIBLE_STEAL_PROCESSOR_SHA=0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793 \
npx playwright test --config=evidence/step-05/visible-voice-stealing/preparation-v2/playwright.config.ts
```

Root must confirm the still-frozen production assets at actual GO. Output must not exist. No automatic acceptance ledger changes; the report always retains `qualificationPassed:false` even if this narrow visibility witness completes.
