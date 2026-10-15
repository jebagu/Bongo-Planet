# Bongo Planet — idle bridge health observation and restart

A live health read at2026-10-11T23:50:05UTC found the owned bridge unavailable, with no session, objects, pending events or active voices. Its configured clock guard had failed closed after a retained calibration bracket widened the maximum reported uncertainty to25.542334ms, exceeding the unchanged10ms policy. The worker had acknowledged closure and exited0. The complete original state and clock brackets are preserved in `state-before.json`; no scheduling cause or active-event loss is inferred from this idle observation.

The service matched owned PID92747 running this project's `src/output/bridge.ts`. After preserving the failure, the root sent SIGTERM to that PID and launched the unchanged service with `npm run bridge`, session69663. The old PID was absent afterward. At23:51:14.234977UTC, the new worker incarnation reported ready=true, failure=null, uncertainty0.021335ms, no session, zero pending and zero active voices. Full state, source hashes and restart provenance are retained separately.

This restores the local service; it does not repair the measured native scheduling drops, erase the idle guard failure or qualify long-running availability. NativeClock and bridge source remain unchanged, with all timing/uncertainty limits preserved. No automatic recovery or retry of queued musical events was added.
