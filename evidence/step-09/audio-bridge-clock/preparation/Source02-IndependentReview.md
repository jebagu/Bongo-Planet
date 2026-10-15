# Bongo Planet clock Source02 independent source review

Disposition: **BLOCK on the remaining terminal-persistence deadline path C03.** The original C01 disposal race and C02 first-emission/fixture deadline paths are repaired. This is a source-only successor review; no acquisition, test, browser, service, audio, original stream or PCM was run/read.

| Binding | Bytes | SHA256 |
|---|---:|---|
| Helper `scripts/output-audio-clock.spec.ts` | 43,003 | `7e65549447332cf565014a2285b7c6a175a76ef12505e0bb040a4f71bbb76cfc` |
| `clock-lifecycle02.ts` | 1,313 | `5686dae0a50b160dee494de105dbf725a5b24ac04d274c7259a0405cfcd8fc33` |
| `clock-controls02.ts` | 4,082 | `c8335249675706cdfe9857c7bdbfdb3b1173ec033ce040aa492bf3905b908b0c` |
| `Manifest02.json` | 28,358 | `d2347fc6d0e2807385d7cd19dbd6ebfce59dd554aaef96186a21346b596c9b0f` |

All 134 selected manifest entries independently matched their current lengths/hashes, totaling 2,008,960 bytes. Read the complete exact delta, relevant integrated helper paths, pure module/controls, final retained logs and ResourcePlan01. `SourceChecks02.json` and its logs retain 67 pure passes (32 original comparisons plus 35 lifecycle/deadline controls) and private strict compilation success. The intermediate 64-control source and Source01/BLOCK remain preserved. Shared global typecheck is still a root prerequisite at this readback, not asserted from the private compile.

## Closed findings

**C01:** The helper retains the pre-disposal observer snapshot, performs disposal independently, then reads the persistent latch after awaited context closure and before page destruction. `requireBrowserShutdownCertificate` requires both snapshots, exact clean/error/overflow/stopped fields and a post-disposal `clock.state === 'closed'`. Failure in the first read does not suppress disposal or the later resource cleanup attempts. The synthetic asynchronous controls inject the original callback's fault during disposal and reject it without depending on a thrown page error.

**C02:** First-emission success now follows post-await deadline checks. Batch drains check stage/fixture deadlines before taking data, after retaining the returned prefix, and after ACK. Acquisition, final empty remainder, synchronous analysis and fixture-summary persistence all have post-operation checks before committing the completed fixture. Failure cleanup explicitly drains a prefix without converting an expired fixture to success. Late returned records are preserved before the deadline error rather than discarded.

The 35-second cumulative non-window allowance correctly applies to startup/transition/readback and excludes owned cleanup, matching ResourcePlan01. Cleanup still faces the separate helper/test/root ceilings. Pure controls cover equality and nonfinite deadline rejection, late asynchronous successes, empty final batches, the cumulative allowance and the helper endpoint.

## C03 — Final report persistence can cross 280 seconds after the last deadline check

Confidence 75; blocking the claimed whole-helper resource certificate. At helper lines 200–204:

1. `helperBudget()` checks the current time before report construction.
2. The code computes `elapsedSeconds` and `diagnosticPassed`.
3. `JSON.stringify`, Buffer construction and synchronous `chargeFile('report.json', ...)` execute.
4. No elapsed-time check follows these operations; the test body can return normally.

A concrete boundary scenario is a clean pre-report check at 279,999 ms followed by successful serialization/write that returns at 280,010 ms. The retained report can still say `diagnosticPassed: true` and record only the pre-persistence elapsed value. The independent root allows 285 seconds before termination, so it need not reject this crossing. The Playwright timer is also cooperative; it should not be used as proof that synchronous final work could not cross its deadline before the body resolves. This requires no timeout extension, malformed data or production failure.

This is a request for **detected failure after persistence**, not hard preemption or an infinitely self-referential timestamp. Minimal repair: check the monotonic deadline after final serialization/persistence and make an overrun a failed terminal disposition. Preserve the written report honestly as a pre-terminal snapshot; an additive bounded terminal certificate or retained failure must prevent its provisional success field from being mistaken for whole-helper success. A synthetic control should advance the clock during a successful final write and require failed disposition, while leaving the original written bytes intact. If the intended certificate instead ends before persistence, that narrower scope must be explicit and must not claim to bound all helper work.

No other new source blocker was found in this delta. Numerical comparison, full denominators, original callback invocation, native lifecycle guards, declared caps, immutable fixtures and owned-browser/controller boundary remain unchanged. Even after C03 is resolved, unknown effective-clock/getter terms keep `originalConversionGatePassed` and `qualificationPassed` false; operational diagnostic completion alone cannot close S09-A9 or any physical/PCM gate. Any acquisition still requires the fixed successor's final global check, fresh root bindings/resource preflight and separate root authorization.
