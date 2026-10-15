# Bongo Planet — independent audiovisual measurement review

Reviewed 2026-10-11 by the independent engine/integration reviewer. This review inspected existing source and retained artifacts while the separate final soak ran. It launched no browser, audio capture, network producer, test suite, or timing probe. Only this review note was written.

## Conclusion

**AV-01 and AV-02 are resolved in the corrected capture.** The recorded evidence supports the stated automated F02 headless-compositor subset: 44 independently expected and detected audible onset groups, median conservative visual error **27.202145 ms**, p95 **28.807369 ms**, and maximum **28.955074 ms**. These figures include the worst endpoint of each dark-to-bright frame interval and the observed output-clock offset variation.

This is not physical-monitor or human-listening acceptance. Both `humanAcceptancePassed` and `physicalMonitorQualified` remain false. No full Step 08 or M1 pass is inferred from this review.

## Captured revision and evidence

- Capture: `2026-10-11T18:16:16.368Z` through browser closure at `2026-10-11T18:18:08.637Z`.
- Recorded commit: `9621617296ffeacf1e27c84f65e8da949a641c69`.
- Installed Chrome `155.0.8059.39`, headless, 1200×820, exact named SPAT virtual input/output, 48 kHz.
- Recorded main asset: `index-BJ803lmz.js`, SHA-256 `e0985953a9a9dc53c99a60420ea3ce3e4cf762c5c53056e9a7dafc41397fe85f`.
- Recorded processor asset: `processor-CXjMaizv.js`, SHA-256 `155ba49f4f3e41921a86ae4adaa5595bcfe2858f5ebbadc7b28fa3281b50607d`.
- Before/after fetched asset hashes match. This closes the earlier local-`dist`-only binding gap for the recorded run.
- The SHA-256 of [the exact capture-time harness](capture-harness.ts) independently matches the report: `6ba18581049cbc287c551c5c4831ac12a8c19151458c4eb3ee5b4489af44e365`.
- The current development harness includes later negative-control and artifact-retention additions. It was compared with the retained capture harness; those later changes are not represented as having run in this capture.

Primary records: [report](report.json), [measurements](measurements.json), [clock samples](clock.json), [pixel scores](pixel-scores.json), [PCM chunk metadata](capture-chunks.json), [frame metadata](frames.json), and [measurement method](measurement-method.md).

## Findings rechecked

### AV-01 — product delay absorbed into calibration: resolved

The former method estimated loopback latency from product onsets. A constant product synthesis delay could therefore be subtracted away.

The corrected method schedules twelve native `AudioBufferSourceNode` clicks at known context times before product playback. These sources connect directly to the AudioContext destination and bypass the product worklet. Their 300 ms spacing and disjoint ±100 ms association windows establish independent matches. All twelve measured offsets are 13.333333 ms within floating-point precision. The correction is fixed from those clicks; product onsets do not affect it.

Consequently, adding 100 ms solely to product output preserves the native-click correction and leaves a 100 ms product residual. The captured harness checks every product residual against the independently derived fixture timeline and rejects deviations above 20 ms. Actual product residuals in this capture are approximately +0.083333 ms for all 44 groups.

The expected count now comes from the fixture period and a fixed 88-second product window, rather than the number of detected PCM attacks. The expected groups run from context time 5.101 through 91.101 seconds. All 44 were detected and compared in order. Missing/extra groups fail the count check; a shifted association fails the residual check.

The prepared actual product-only 100 ms DelayNode negative control had **not run at the time of this review**. Source inspection establishes the corrected dependency; live fault-injection evidence remains separate and pending.

### AV-02 — capture stall hides an early flash: resolved

Each measurement now requires a preceding dark frame and first bright frame. Its statistic is:

`max(abs(previousDarkTime − audioTime), abs(firstBrightTime − audioTime)) + observedClockDeviation`

Missing brackets produce unidentified groups and prevent the numeric pass. A long bracket is no longer scored solely from its possibly favorable first-bright endpoint. The earlier example of an onset 200 ms early followed by a capture stall would retain that large interval endpoint in the error statistic.

Independent arithmetic over all 44 stored measurements reproduced every endpoint statistic and the reported nearest-rank median, p95, and maximum. Every preceding frame has zero qualifying ROI pixels; every first bright frame has at least 258. The largest bracket is 20.076036 ms. Adjacent retained images [00277](frames/00277.jpg) and [00278](frames/00278.jpg) were also inspected visually: the target changes from cyan to bright at the scored location.

## Artifact consistency

The metadata contains 2,173 chunks totaling 4,450,304 samples. The raw file is exactly 17,801,216 bytes, matching that count at four bytes per Float32 sample. The WAV sample payload is byte-for-byte identical to the raw file. Independently computed raw SHA-256 matches the report: `68f0220696c34c3923ca695885c4056a632f0cdf4f750b4abe4b4279bfb8d14a`.

Reported inter-chunk sample-time deviation is approximately `4.57e-10` samples; the source derives timestamps from integer `currentFrame`, checks continuity, closes the context, and drains pending writes before analysis. The prior unexplained tail/metadata discrepancy is absent. There are 5,566 retained frame records. The report contains no page errors and records browser closure.

Independent verification used small JSON arithmetic, source/diff reads, SHA-256 and byte comparisons, and two retained-image views. It did not rerun PCM onset extraction or decode all JPEGs during the concurrent soak; those detector results were audited through the retained source, onset arrays, pixel scores, and sample images.

## Remaining scope and qualifications

- The output-clock deviation of 0.104000 ms is observed mapping stability, not an independently measured bound on absolute device-clock accuracy. The measurement still uses the browser's estimated `getOutputTimestamp()` presentation mapping and CDP frame clock.
- The 44 observations are repeated simultaneous F02 chord groups and one visible target, not 132 separately resolved voices. They do not establish F03, every source, reduced motion, low-FPS readability, physical screen scanout, or venue behavior.
- Earlier failed or method-limited attempts remain evidence; this corrected capture does not retroactively pass them.
- A separate future-harness reporting edge was sent to the lead: an exception after the numeric flag becomes true must clear that flag in `catch`. The lead's subsequent source change explicitly clears it; this was rechecked by reading the updated handler. The edge did not occur in the reviewed artifact. No production-source change is required for the resolved AV-01/AV-02 findings.

## Actual 100 ms negative control — independently corroborated

The formerly pending control ran from **2026-10-11T18:48:38.801Z** to **18:48:58.918Z**; its browser closed. The [retained report](negative-control-delay100/report.json) records `negative-control-expected-rejection`, `negativeControlPassed: true`, and `automatedNumericSubsetPassed: false`. Human/physical-monitor flags remain false.

The retained harness connects twelve native calibration sources directly to the destination, then inserts a DelayNode only between the product worklet and destination. The recorded delay is 0.10000000149 seconds. The native sources bypass it; calibration remains **13.333333 ms**.

Independent re-extraction from the actual retained Float32 PCM reproduced all 18 onset times: twelve calibration clicks and six product groups. Independent geometry/quantization arithmetic gives the original F02 delay of 0.125 seconds and six expected groups in the 12-second control window. Subtracting only the native calibration leaves **100.083333 ms error for every product group**. All six exceed 20 ms, matching the exact reported rejection: `Product output differs by more than20ms from independent fixture expectation after native calibration.` This occurs before the later 30-group visual gate; the negative result is not merely insufficient visual sample count.

The independent read also confirms 392 chunks totaling **802,816 samples**, exact metadata/raw count agreement, maximum clock deviation approximately `1.16e-10` samples, identical raw/WAV sample bytes, and the report's raw SHA-256 `eee32cc1e1a0ceb9d4df3b2f821bf4eb38f2ec8b1b01f5ec53fdc13bcc505945`. The retained harness SHA-256 matches `d29e85a2fdc8ca4056f8853ff2d2aa273c122fcca9f00668907f32afde1da747`. Before/after served main and processor hashes match each other and the positive capture's assets. The error list is empty; the expected threshold rejection is recorded separately.

This closes the pending live fault-injection evidence for AV-01: the corrected method detects a constant product-only delay rather than absorbing it into calibration. It does not enlarge the positive capture's F02/headless scope or qualify the separate long-soak recording anomaly. This recheck launched no browser or probe and changed only this review note.
