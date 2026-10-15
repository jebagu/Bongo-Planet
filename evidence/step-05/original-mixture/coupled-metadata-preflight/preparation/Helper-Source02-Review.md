# Bongo Planet — metadata helper Source02 H01 correction

Source only, no original JSONL/inventory/PCM scan or runtime. The four reviewed Source01 files were hash-checked and copied byte-exact to helper-source01-preserved before editing; source01 snapshots, control records and preparation-manifest-01 remain unchanged.

H01 is corrected with two distinct literal strict100ms predicates: processor compares start minus previousEnd, while Engine.advance compares end minus preceding engine.time. Engine time starts at the retained play(epoch) anchor and thereafter is the previous healthy block end under the unchanged no-command premise. Both guards run before emission/due replay; neither changes clock corrections, late limits, pending/voice limits or resource caps.

Thirty pure synthetic controls and Python parse PASS (helper-source02-controls01.json; runner exit0,0.0691269169s). Added independent99ms start/101.667ms end scenario, separate strict100ms nextafter boundaries, and a two-block exact end-boundary control. The99ms candidate must fail despite passing the processor predicate. No actual stream was scanned.

Conditional shared-clock, startup-floor, empty-state and command-history unknown flags remain. All original exclusions,468 summaries/candidate frontier rules,120s/256MiB/50million budgets, fixed inputs/output contract and always-false waveform/onset qualification are unchanged. Root controller Source02 has a separate source GO; no helper/controller actual authorization follows from this source package.

Exact fixed CLI remains python3 scripts/coupled-onset-metadata-preflight.py --run --output-dir <fresh absolute directory>; output result.json. There is no separate helper config or child-process topology. Source02 reviewer/root GO and fresh external preflight are still required before execution.
