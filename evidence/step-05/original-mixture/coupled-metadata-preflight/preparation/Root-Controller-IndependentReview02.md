# Bongo Planet — metadata controller Source02 independent review

**Disposition: source GO for this wrapper correction.** This does not authorize an acquisition. The metadata helper has its own Source01 BLOCK (H01), and a corrected helper plus fresh root preflight/GO remain required. This note preserves, rather than rewrites, the controller's Source01 M01 BLOCK.

## Exact reviewed bindings

| File | Bytes | SHA256 |
|---|---:|---|
| `root-metadata-controller.py` | 12701 | `ab44fdd619076af29b7e55a43d68838469603f2b0181638b4c49ae738c065c54` |
| `root-metadata-controller-controls.py` | 11331 | `591fd0dd075214a38d6ac6de4971db9b4274976bd55e751a2bd9c156ef763e87` |
| `Root-Controller-Plan02.md` | 1205 | `d6fc805f7ec69b02a6d65f8e8831c1bd24879fc23d6ec94789e5bdd20daec4b4` |
| `Root-Controller-Derivation02.json` | 479 | `8ae18aa16175d2b845cec7a728a6e62abec9b47a2cb89c67d0ad13bf0ee35a59` |
| `Root-Controller-Delta02.diff` | 1294 | `6c090b5e01f97e4c84843bd9a589701d91c457ca7ba07438d56fbfb6740c3dbe` |
| `Root-Controller-Checks02.txt` | 115 | `1ed838ae4c40037b8e3467531d9a74025b2a092c67d4b6267b905d47f3d5722e` |

The preserved12,513-byte Source01 controller still hashes to `5a47d9944dabf16d4ac1f22c1178aa2ed45b6b2f8a77f53803ad0113e3283170`. Independent source comparison confirms the only controller change is the RSS-observation branch. No command, source-binding, ownership, discovery, signal or cleanup algorithm changed.

## M01 correction

The revised observer checks its2048-row cap, appends the raw RSS observation, and then classifies it. `None`, zero and negative integer observations consult the exact retained `Popen.poll()` result. A terminal child yields `terminalUnavailable: true` plus its exit code; a still-live child raises `Live child RSS unknown/nonpositive`. An unavailable terminal value is not added to the memory maximum or presented as a valid zero-memory sample.

Positive observations still update the maximum before validation. A value above262144KiB therefore remains a retained resource failure even if the child terminates during or immediately after the query. The correction cannot convert a measured over-budget value into a clean terminal exception. The normal process loop and final observation still establish the child exit result separately.

The query starts only while `returncode` is unknown and the child has not been reaped. No intervening reaping call occurs before the RSS query, so the acquired child's PID cannot be reused during that query. A poll performed for unavailable RSS can reap it; subsequent inventory paths remove the reaped root from ownership before discovery/signaling, as in the reviewed baseline.

The retained result reports16 pure tests passing (root tool c38a85). The new full-observer simulations cover terminal/live `None`, zero and negative readings, a normal positive terminal reading, and positive over-budget terminal/live readings. They assert retained raw data, terminal classification, no forced cleanup or signals for clean terminal cases, and retained maximum/failure for over-budget cases. Existing malformed-claim, failed-journal, reaped-root replacement, claim-ordering and initial-claim-read cleanup controls remain. I read these controls and their output; I did not rerun them or invoke any process query, signal, helper, browser or acquisition.

## Unchanged conditions and limits

The fixed command remains one `python3 scripts/coupled-onset-metadata-preflight.py --run --output-dir <absolute output>` process. Output is tied to `BONGO_METADATA_EVIDENCE_DIR`; the shared claims interface is `BONGO_MOVEMENT_RESOURCE_JOURNAL`. Successful disposition requires zero browser and proxy claims. A final helper review must continue to confirm that no additional process topology is introduced.

Main125s, total135s,256MiB and2048 observations remain unchanged. These are cooperative/detected limits, not a hard real-time scheduler guarantee. External `ps` samples are not peak-memory or aggregate-subtree measurements; the helper's independent process-maximum check is still relevant. Missing live RSS stays a failure rather than an assumed safe bound.

Root must bind the final helper/source package and interpreter context, set the expected working directory, and supply fresh absolute pairwise-disjoint output, claims and controller-journal paths. The wrapper does not prove pairwise path disjointness itself. Compact source preflight must not be represented as an original metadata or PCM scan. Inherited process-inventory/coarse-birth and observation-to-signal limitations remain; this source GO does not certify exhaustive OS cleanup or an actual successful run.

No new source blocker was found in the M01 correction. Metadata integrity, complete conditional replay, waveform/onset conclusions and acceptance decisions remain separate from the wrapper's observed lifecycle/resource disposition.
