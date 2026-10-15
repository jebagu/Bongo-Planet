# Bongo Planet — independent active-camera controller source review

**Source GO for the controller**, conditional on the final active-camera helper review and root's exact binding/resource/quiet preflight. No acquisition is authorized by this note, and no live process closure or acceptance criterion is certified.

I read the Plan, complete retained delta and modified admission/lifecycle paths, and the simulated-control delta against the separately GO-reviewed backpressure controller04. All four bindings in `Root-Camera-Controller-Source-Checks-01.json` match current bytes. Reconstructing the textual diff from the two source files agrees exactly with the retained delta.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| root-camera-controller.py | 11,459 | c30a6e8db423b6cb9eea278ea1acc1f3b0cf21cb29e93c8b56e5987b187b924e |
| root-camera-controller-controls.py | 8,001 | c9922737b61aa086464e98dde355766b67cbbda0b683786724c7b1642d00c0e6 |
| Root-Camera-Controller-Delta.diff | 3,819 | 56625bcf46216c841e8ff7c546a7edce4c6c402df70283453b6331e55689bdfc |
| Root-Camera-Controller-Plan.md | 1,793 | 1f63c09037aff8277e0cf974a995a17839300c9c5a66b667c8d01377dd17e0cf |

The eleven substitutions change the header, exact camera authorization and configuration command, evidence/runner environment keys, acquisition/total allowances, and successful resource claim counts. The controller now requires **one browser-server and zero proxy claims**. Its shared `BONGO_MOVEMENT_RESOURCE_JOURNAL` key is intentional and must be supplied unchanged by the helper/root GO. No ownership, claim ordering, evidence-error handling, discovery, signaling or cleanup algorithm differs from controller04.

The three reviewed ownership corrections remain present: no first identity adoption after the main was reaped; claims are read before their validating inventory; and claim-read errors are latched while independent identity discovery proceeds before signaling. Accepted claim prefixes cannot mutate. Terminal main PIDs are retired from discovery and signal eligibility. These preserve the earlier simulated replacement-PID, reparented unresolved claim, and initial persistent claim-read-error protections.

The retained record reports **11 pure controls passed**, tool `abc606`, exit zero. I read the control changes: module/configuration/authorization/environment names change, while the same failure-path assertions remain. I did not run the controls, controller, process inventory, signals, browser or services. This is simulated evidence only.

The **35-second main / 50-second total** allowances remain cooperative wall checks. They include the controller's normal cleanup reserve but cannot preempt blocked filesystem calls or host descheduling. Forced cleanup, unknown inventory/ancestry, remaining known-owned processes, malformed evidence, and nonzero child outcomes cannot pass. Second-resolution process birth signatures and snapshot-to-signal races remain practical identity limits; an empty known-owned set does not prove absence of every unobserved reparented descendant.

Before an actual GO, the final helper must claim its own browser immediately on launch fulfillment, including late fulfillment, preserve the claim through evidence failures, and close it independently. Root must bind this controller, reviewed helper/configuration, source and served assets, correct working directory/environment, fresh outputs and externally created journal. The native receiver/worker must remain inside the observed runner ancestry; any different resource topology requires another ownership readback. The helper's numerical active-source/camera conclusions and the full S08-A11 decision remain a separate review.
