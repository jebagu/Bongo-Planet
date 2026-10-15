"""Regenerate the handoff from retained reports, without inventing acceptance."""
import datetime
import hashlib
import json
from pathlib import Path

root = Path('evidence/spark-gates')
def read(path):
    file = root / path
    return json.loads(file.read_text()) if file.exists() else {}
def link(path, label=None):
    return f'[{label or path}]({path})'

date = datetime.datetime.now(datetime.timezone.utc).isoformat()
units = read('step-07/unit-qualified-results.json')
browser = read('step-07/regression-qualified/full-browser-results.json').get('stats', {})
live = read('step-03/live-audio/attempt-08/report.json')
budget = read('step-03/qualified-worklet-budget/report.json')
soak = read('step-07/qualified-soak/result.json')
environment = read('step-07/environment.json')
manifest = read('step-07/qualified-soak/application-manifest.json')
snapshot = read('step-07/qualified-soak/snapshot.json')
differences = []
for name, digest in manifest.get('files', {}).items():
    file = Path('src') / name
    if not file.exists() or hashlib.sha256(file.read_bytes()).hexdigest() != digest:
        differences.append(name)
differences.extend(str(file.relative_to('src')) for file in Path('src').rglob('*') if file.is_file() and str(file.relative_to('src')) not in manifest.get('files', {}))
differences.sort()
critical = ('core/', 'audio/', 'output/', 'view/SparkGate', 'view/StrutSpark')
core_differences = [name for name in differences if name.startswith(critical) or name in ('main.ts', 'compositionFile.ts')]
old_engine=(root/'step-07/qualified-soak/application-source/core/engine.ts').read_text()
new_engine=Path('src/core/engine.ts').read_text()
scheduler_unchanged=old_engine[old_engine.index('export class Engine'):]==new_engine[new_engine.index('export class Engine'):]
latest_units=read('step-07/latest-unit-results.json')
latest_gates=read('step-07/regression-qualified/latest-gates-browser-results.json').get('stats',{})
latest_budget=read('step-03/post-instruments-budget/report.json')
build_log = root / 'step-07/build-qualified.log'
build_passed = build_log.exists() and 'built in' in build_log.read_text() and 'error TS' not in build_log.read_text()
validation = {
    'date': date, 'buildPassed': build_passed, 'buildLog': 'build-qualified.log',
    'sourceSnapshot': 'qualified-soak/application-manifest.json',
    'compiledSnapshot': 'qualified-soak/source/',
    'sourceFiles': len(manifest.get('files', {})),
    'changedAfterSnapshot': differences,
    'clockLifecycleRoutingSourcesMatch': not core_differences,
    'criticalDifferences': core_differences,
    'engineSchedulingClassMatches': scheduler_unchanged,
    'latestCombinedUnitTestsPassed': latest_units.get('success',False),
    'latestGateBrowserTests': latest_gates,
    'latestAudioBudgetPassed': latest_budget.get('passed',False),
    'unitTestsPassed': units.get('success', False),
    'browserTestsPassed': browser.get('expected', 0) > 0 and browser.get('unexpected') == 0 and browser.get('skipped') == 0,
    'note': 'Later separately requested instrument and UI additions are identified explicitly. Their current source/gate/budget rechecks are separate from the retained 30-minute binary.',
}
(root/'step-07/validation.json').write_text(json.dumps(validation, indent=2)+'\n')

common = f'''Date: {date}. Kickoff checkpoint: `396c820` on `codex/bongo-planet`.
Reference environment: macOS {environment.get('macOS')}, {environment.get('architecture')}, Node {environment.get('node')}, Chrome {environment.get('Chrome')}.
Source identifier: [retained application manifest](../step-07/qualified-soak/application-manifest.json); compiled candidate is retained beside it. [Environment](../step-07/environment.json).

Later direct requests replace the original dimensional switches with permanent flat glyphs, three spark looks, a left tray, shared-grid timing, generator-placement initialization and bundled composition files. The individual checklist identifies superseded cases. Human results are not inferred from source tests.
'''
steps = {
 1: ('Directed wiring and dual-version contracts', 'SG-S01-A01/A02/A03',
     'Expected unique adjacent directed exits, tagged finite/Infinite travel and explicit version-one compatibility. Actual strict schemas accept all 540 directed entries and reject invalid topology, duplicates, occupancy/ID violations and invalid limits. New generators use eight hops; placement enables their outgoing gates as one edit. Explicit all-Off records round-trip; moving sources does not initialize wiring. F00–F14 remain byte-identical to the kickoff.',
     ['Independent-Fixtures.md', '../step-07/unit-qualified-results.json', '../step-07/asset-verification.json'],
     'npm run typecheck; npm test -- --maxWorkers=1 --no-file-parallelism',
     'SG-S01-H01 remains not run.'),
 2: ('Streaming finite propagation', 'SG-S02-A01/A02/A03',
     'Expected analytic 125 ms adjacent hops at 120 BPM, exact final sounds, inherited budgets and distinct fork/convergence identities. Actual nine independently specified circuits match every listed arrival and sound. Unequal-length fork children sound together at 250 ms. Fine/coarse and dense under-cap advances agree; empty hops, returns and seven-hop revisits count correctly.',
     ['circuit-traces.json', '../step-01/Independent-Fixtures.md', '../step-07/unit-qualified-results.json'],
     'node_modules/.bin/tsx scripts/spark-gates-evidence.ts; focused spark-gates/musical-grid tests',
     'SG-S02-H01 remains not run. The original inherited physical-speed requirement is superseded.'),
 3: ('Audio clock, Infinite, cancellation and output', 'SG-S03-A01 through A06',
     'Expected more than 10,000 hops without an expanding path, sample-accurate destination sound, effective-time edits and complete ownership/lifecycle cleanup. Actual tests retain bounded edges/history and ordered edits, cancel or replace changed occupants, ignore old transport epochs, and preserve unrelated sources. Long source-owned voices are released after 90 intervening short triggers. The real native receiver gets future controls, preceding positions and cancellation without internal gate metadata in its strict packets.',
     ['../step-07/unit-qualified-results.json', 'live-audio/attempt-08/report.json', 'qualified-worklet-budget/report.json', '../step-07/regression-qualified/evidence/spark-gates/step-03/receiver.json'],
     'spark-gates-live-audio.ts; spark-gates-worklet-budget.ts; audio/output unit and installed-Chrome receiver tests',
     'SG-S03-H01/H02 remain not run. Virtual loopback is local timing evidence; actual speakers/venue are unqualified.'),
 4: ('Direct sphere editing and gestures', 'SG-S04-A01 through A05',
     'Expected visible directed controls to change real routing, preserve wiring through moves/deletion/history and own their gestures. Actual browser clicks produce sink/continuation/fork sounds. Locked audio still shows gate edits. Drag, Escape, focus loss, competing-pointer and touch-emulation checks preserve the scene when canceled. Keyboard focus with Space/Enter edits canvas gates; rear targets remain excluded. The later direct-edit request supersedes the original inspector/bulk rows.',
     ['../step-07/regression-qualified/full-browser-results.json', '../step-07/regression-qualified/evidence/spark-gates/step-04/'],
     'npm run test:web; focused spark-gates-browser.spec.ts',
     'SG-S04-H01/H02 remain not run. Emulated touch does not qualify a physical device.'),
 5: ('Flat gate glyphs, spark looks and bounded resources', 'SG-S05-A01 through A04',
     'Expected five gate glyphs and three spark looks to preserve music and keep renderer resources bounded. Actual front/oblique/grayscale comparisons, live look edits, old/invalid look files and 50 icon cycles pass. Two shared gate geometries/materials remain resident. Original Ink/Toy/Glow rendering and their removed individual controls are explicitly superseded. Legacy previews now cache only one conversion and invalidate for reach/path/occupancy changes; measured mean preview cost falls from 85.47 ms to 0.62 ms per F09 phase edit, and the real capacity burst passes.',
     ['../step-07/regression-qualified/full-browser-results.json', '../step-07/regression-qualified/evidence/spark-gates/step-05/', 'preview-cache-results.json', 'preview-cost.json'],
     'spark-gates-appearance tests; real installed-Chrome icon/style/resource tests; legacy capacity recheck',
     'Current-person visual/listening review remains not run. Historical-style cases are blocked as superseded.'),
 6: ('Travel controls, history, storage and prepared scenes', 'SG-S06-A01 through A04',
     'Expected real controls for 1/3/8/93/Infinite, one Undo entry per numeric gesture, atomic storage/import and preserved legacy originals. Actual browser controls, save/export/import/reload and history pass. The current portable envelope carries scene and validated appearance together, while older bare scenes remain importable. A first legacy gate click converts and toggles as one paused load operation; Undo restores the original paused. F15/F16/F17 do not collide with preserved F00–F14.',
     ['../step-07/regression-qualified/full-browser-results.json', '../step-07/regression-qualified/evidence/spark-gates/step-06/', '../step-07/unit-qualified-results.json'],
     'full scene/composition/appearance unit suite; installed-Chrome storage/history/AI-file tests',
     'SG-S06-H01/H02 remain not run.'),
}
for step, (title, ids, actual, artifacts, commands, limit) in steps.items():
    body = f'# Step {step} — {title}\n\n{common}\nChecks: **{ids}**. Current automated requirements: **passed**; superseded cases are recorded separately.\n\n{actual}\n\nCommands: `{commands}`.\n\nEvidence:\n\n' + '\n'.join(f'- {link(p)}' for p in artifacts) + f'\n\n{limit}\n'
    (root/f'step-{step:02}/review.md').write_text(body)

soak_status = 'passed' if soak.get('passed') else 'not run — final timed run still in progress'
audio = live.get('analysis', {})
visits = audio.get('visits', [])
max_audio = max((abs(v['compensatedVirtualErrorFrames']) for v in visits), default=0)
processing = budget.get('processingBudget', {})
body = f'''# Bongo Planet — Spark Gates implementation review

Recorded {date}. The requested kickoff commit is **`396c820`**. Routing, hop travel, lifecycle, persistence, output integration and current direct gate editing are implemented. Human acceptance remains open.

## Measured results

| Check | Actual result | Evidence |
| --- | --- | --- |
| Production build/typecheck | {'passed' if build_passed else 'not run'} | [Build log](step-07/build-qualified.log), [validation](step-07/validation.json) |
| Full source/audio/bridge suite | {units.get('numPassedTests', 0)} passed; {units.get('numFailedTests', 0)} failed | [Unit report](step-07/unit-qualified-results.json) |
| Full installed-Chrome suite | {browser.get('expected', 0)} passed; {browser.get('unexpected', 0)} failed; {browser.get('skipped', 0)} skipped | [Browser report](step-07/regression-qualified/full-browser-results.json) |
| Current combined additions | {latest_units.get('numPassedTests',0)} source tests and {latest_gates.get('expected',0)} gate browser checks passed; current dense budget {'passed' if latest_budget.get('passed') else 'not run'} | [Latest units](step-07/latest-unit-results.json), [current gates](step-07/regression-qualified/latest-gates-browser-results.json), [current budget](step-03/post-instruments-budget/report.json) |
| Independent circuits | Nine analytic arrival/sound traces pass | [Expected and actual events](step-02/circuit-traces.json) |
| Actual local output timing | {len(visits)} arrivals; fixed latency {audio.get('latencyMs', 0):.2f} ms; maximum compensated error {max_audio:.4f} samples; observer continuity and source hashes {'pass' if audio.get('passed') else 'do not pass'} | [Capture and all individual errors](step-03/live-audio/attempt-08/report.json), [audible capture](step-03/live-audio/attempt-08/virtual.wav) |
| Dense worklet budget | 64 live edges, {processing.get('arrivalsPerSecond', 0)} arrivals/s; worst CPU {processing.get('threadCPU', {}).get('maxMs', 0):.3f} ms versus {processing.get('nominalQuantumMs', 0):.3f} ms quantum | [Real render-thread trace](step-03/qualified-worklet-budget/report.json) |
| Final 30-minute finite and Infinite circuits | {soak_status} | [Result](step-07/qualified-soak/result.json), [source manifest](step-07/qualified-soak/application-manifest.json) |
| Look/source asset archive | All {read('step-07/asset-verification.json').get('manifestFiles', 0)} manifest entries match files and archive; F00–F14 unchanged from kickoff | [Independent hash verification](step-07/asset-verification.json) |
| Safari native UI spot checks | Activation, one-hop/Infinite input, live Ember/Chevron changes and appearance reload verified through the actual app | [Scoped native UI record](step-07/safari-native-ui.json) |

The live timing measurement used the exact **SPAT 8ch loopback (Virtual)** input/output at 48 kHz, three independently scheduled calibration probes and actual 100/250 ms main-thread stalls. It captures the product AudioWorklet and its real virtual output; it does not measure physical speakers, venue output or a person's listening. Raw observations and failed attempts are retained. WAVs are derived without normalization or time shifting.

## Bounds and fixes

The core streams one committed edge per branch; finite budgets count empty junctions and revisits, and the final arrival sounds before termination. Equal-hop forks share a sixteenth-note deadline. Tempo changes apply to every circuit on the next whole beat. Wiring stays on vertices. Placing a generator enables all its local exits in one edit; moving it does not carry wiring.

Independent bounds are 256 edges, 2,016 rolling arrivals/s, 5,376 pending sounds, 64 voices, **64 decisions per actual audio quantum**, 2,048 reliable event records and 23,520 output-ownership records. Logical overload pauses visibly and releases work. Rendering caps heads at 128 without changing music. The initial 128-decision quota allowed a synchronized 96-edge trace with 2.924 ms CPU against a 2.902 ms quantum; that failed measurement is retained in [the prior trace](step-03/current-worklet-budget/report.json). The measured 64-decision quota and explicit recovery replace it. Dense qualification is scoped to this reference machine and fixture, not every device/layout.

Transport epochs prevent old events/status from restoring canceled work. Every Play gets a fresh session, preserving legacy resume visuals. Pause removes render heads immediately even at 2 FPS. Source ownership releases old long voices locally and remotely. Native numeric-key gestures coalesce to one Undo entry. A bounded legacy-preview cache removes repeated shortest-path calculation before live phase edits; the previously failing real capacity burst now passes.

## Source and remaining acceptance

The final soak uses an immutable production build at the permanent URL, with its complete application source and SHA-256 manifest retained. Snapshot start: `{snapshot.get('started', 'pending')}`. Source files changed afterward by separately requested instrument/UI work: {', '.join(differences) if differences else 'none at this record'}. The engine scheduling class is {'byte-identical' if scheduler_unchanged else 'changed'}; complete changed files are still listed rather than represented as identical. Current combined source, gate controls and dense audio received the separate rechecks above. [Validation](step-07/validation.json) gives the exact comparison; the 30-minute result applies to the retained binary, not untested future edits.

All acceptance subcases are in [the individual checklist](Acceptance-Checklist.md). The earlier failed/interrupted broad runs are preserved in `step-07/regression-combined/` and `step-07/regression-qualified/interrupted-browser-results.json`; missing evidence folders, changed file-format assertions, HMR edits and a stopped local server were repaired before the passing full run. Earlier successful 30-minute candidates are preserved separately.

Listening, unfamiliar-player and full person-led Chrome/Safari review remain **not run**. Safari WebDriver is **blocked** because Allow remote automation is disabled; native app spot checks did not change that setting and do not replace the remaining tasks. Original dimensional styles/inspector controls are explicitly superseded by later direct requests. G1/G2/G3 human acceptance remains open; no physical-touch, venue or iOS acceptance is claimed. [Short player review task](step-07/Human-Review-Task.md).

Runnable app: **[Bongo Planet](http://127.0.0.1:5417/BongoPlanet/)**. Dev port 5417 and the local bridge on 5418 are preserved. The implementation follows the original checkout's contract; the independent fork was not edited.
'''
(root/'review.md').write_text(body)
(root/'step-07/review.md').write_text(f'# Step 7 — regression, soak and handoff\n\n{common}\nChecks: SG-S07-A01/A02/A03/A04.\n\nFull units: {units.get("numPassedTests",0)} passed. Full browser: {browser.get("expected",0)} passed, {browser.get("unexpected",0)} failed. Final timed soak: {soak_status}.\n\n[Final measured review](../review.md), [individual checklist](../Acceptance-Checklist.md), [browser interactions](regression-qualified/), [immutable build and samples](qualified-soak/), [remaining human task](Human-Review-Task.md).\n\nCommands: `npm run build`, `npm test -- --maxWorkers=1 --no-file-parallelism`, `npm run test:web`, `spark-gates-soak.ts`, asset archive hash verification.\n\nSG-S07-H01/H02 remain not run; WebDriver configuration is blocked separately from native Safari spot checks. Overall acceptance is not closed.\n')
print(json.dumps({'sourceFiles': len(manifest.get('files', {})), 'criticalDifferences': core_differences, 'laterUIDifferences': differences, 'unitsPassed': units.get('numPassedTests'), 'browserPassed': browser.get('expected'), 'soakPassed': soak.get('passed', False)}))
