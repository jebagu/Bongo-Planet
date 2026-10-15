# Bongo Planet — trace finalization log investigation

The collector **exceeded the configured finalization deadline**; the evidence does not prove a deadlock or that it made no progress. No product scheduling remedy is justified by this investigation.

## Boundaries and execution

Only the original xctracePID98024 and its observed DTServiceHubPID98034 were queried, from2026-10-11 **22:27:11+0000 through22:28:10+0000**, with display timezoneUTC. `query.py` and `query-result.json` retain the exact command, bounded collection implementation, timestamps, output and exit. The query was:

```sh
/usr/bin/log show --start '2026-10-11 22:27:11+0000' --end '2026-10-11 22:28:10+0000' --timezone UTC --style json --info --debug --no-pager --predicate '(processID == 98024 OR processID == 98034)'
```

The owned queryPID98792 exited0 in1.987293s, with empty stderr, no output/deadline truncation and854,834 retained output bytes, below1MiB. Its waited exit was confirmed before root's presentation-capture quiet hold. No sudo, settings, new recording, export retry, product execution or bulk-store/hash operation occurred. Original partial trace, sources and recording commands remain unchanged.

## Observations

The retained JSON contains697 entries. Early profiler messages include a file-descriptor handshake failure from DTServiceHub and unavailable Processor Trace service messages. Those are observations, not proof of a System Trace permission failure or explanation of finalization.

In xctracePID98024, retained registration-category errors occur at22:27:53.885850,22:27:53.989849 and22:27:54.331661UTC: `Failed to get unit 106452 from store <private>`, then106460 and106468. These occur approximately42.1–42.5s after the recording command started. Thus the process continued emitting internal activity near the configured45s timeout; lack of stdout updates during saving was not evidence of zero activity. Failed registrations alone do not establish useful save progress, a wait cycle, corrupted capture data or an eventual successful save. Their precise subsystem/context remains a separate interpretive question.

The original collector reported its5s time limit and `Recording completed. Saving output file...`, then exceeded the bounded wait and was eventually killed. The later TOC export's missing instrument run data is compatible with an unfinished finalization, but it does not establish why finalization took too long or whether the trace was already invalid before forced termination.

`partial-inventory.json` records251 files totalling13,361,014 bytes and a bounded39,510 bytes of readable schema/plist metadata. The inventory reads no bulk-store payload and calculates no hashes. The populated directory establishes that files were written before cleanup; with no contemporaneous size snapshots it cannot measure save throughput or whether growth continued during the finalization interval. Stored table schemas do not qualify scheduler-row coverage or Node-worker→Mach-thread mapping.

## Next step limits

Correct collector status language from an asserted stall/deadlock to **deadline exceeded during saving**. This is supported now. The logs do not justify a QoS change, timer/runtime fix, privilege workaround or a claim that a larger timeout will fix the trace.

A separately reviewed future idle-target collector investigation could distinguish5s acquisition from postprocessing and retain phase timestamps plus bounded file-growth/process-state samples during saving. If root chooses a larger independently declared finalization budget for that new diagnostic, it must remain a hypothesis, not an inferred required duration or musical deadline change. Actual stack/state observations near the postprocessing deadline would be stronger evidence than simply increasing the timeout. No further collector or product capture is authorized or executed by this report; the prior capability attempt remains failed.

Raw messages retain macOS `<private>` redactions. Scope is restricted to the two owned profiler PIDs; no unrelated user/application logs were queried. No unrelated private message content is quoted in this report.
