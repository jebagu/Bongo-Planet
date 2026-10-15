# Bongo Planet — independent source05 artifact-isolation review

**Disposition: source GO for the config-only successor, subject to root's fresh actual preflight.** The new config consumes the external controller's exclusive artifact-output environment variable, preventing an omitted value from silently selecting Playwright's shared default directory. No actual backpressure acquisition, browser, services, test runner or controls were executed by this reviewer. S01-A43 remains open.

I read the exact source04-to-05 config diff, the four config-import controls, Source05-Delta/Review, retained check results, and the root controller's output-path preflight. This is five added config lines with no removed behavior; the unchanged helper/process-ownership review remains the prior Source04 note.

The selected `preparation-manifest-source05.json` has SHA `6d25828cf4e3d1e0727b2a8fea7c5f68aaac1bcd6f15b0a9ffaefbcb774c014d`. All 12 entries independently match their lengths and hashes (67,130 selected file bytes).

- Config: 738 bytes, `4de79768089e19729d68dc68dcf226940ddee591e4b5989cf5aadb7cab87c5cb`.
- Config controls: 1,162 bytes, `e57e5bbb63f8076414758ac3752f6bb1b98916c4e9b19c2e4efb4d1a465cfe7a`.
- Unchanged helper: 44,526 bytes, `8f7e454b59a3b9110ac4da2b33daba59bd7cf45525fed38b3dd87557bbd22090`.
- Preserved old config: 406 bytes, `ddfb03b3a0f02dda05f495526ff5eabc21b4de2b91dc2bc3e401c010d7d69532`.

The prior source04 manifest is retained unchanged as historical preparation. Its live config path is intentionally superseded; this review does not claim that the old manifest still matches that newly changed path. Its original config bytes survive in the explicit source04 copy/snapshot. The new selected manifest binds both versions and the prior independent GO note.

Missing, empty or relative `BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT` now throws during config evaluation. An absolute value is assigned directly to `outputDir`; the config does not manufacture a directory, fall back, or alter test selection, one worker, zero retries, 90-second test timeout, 100-second global timeout or reporters. The retained four import-only controls (`524a94`, exit zero) exercise those three rejection cases and exact successful assignment. They do not demonstrate a real runner's filesystem behavior or cleanup. The initial explicit-file TypeScript command failed with TS5112 (`6ba855`); the corrected `--ignoreConfig` invocation passed (`235558`) without a config-source change. No new whole-project typecheck is claimed; helper typing retains root's earlier `2cf2bf` result.

An absolute path alone is not an ownership or non-destructiveness certificate. Root must supply the intended fresh, exclusive runner directory, verify it is absent and safely separate from retained evidence, and preserve that exact environment/command in the actual GO. The separately reviewed root controller checks the runner and evidence/journal paths for prior existence before launch. Playwright can manage its selected output directory; therefore those root path checks remain material, not an optional assumption. No environment override, different command, reused output directory or parallel acquisition is authorized by this source review.

The helper's source04 numerical, pressure, timer, native-voice, capture and cleanup limits remain unchanged, as does the external controller's separate ownership disposition. The configuration correction does not retry a failed measurement: no backpressure actual had started. Root's new binding/quiet/resources preflight and explicit one-run decision remain required.
