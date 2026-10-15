# Bongo Planet — independent ingress controller delta review

**Disposition: source GO, conditional on separate component source review and root actual preflight.** This note authorizes no launch. It concerns the controller for one explicitly bound ingress arm; neither baseline/successor behavior nor production repair is established.

I read the complete controller and simulated controls, Root-Controller-Plan01, Checks01 and the declared delta against the previously reviewed camera controller. Read-only hashing confirms all three Checks01 bindings. The actual unified diff regenerated from the two source texts equals Root-Controller-Delta01.diff byte for byte. No controller, controls, process inventory, signal, socket, component, browser or service was executed for this review.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Ingress controller | 11,474 | `5efb2587e424d59a249368529f20faaa71169447cdc1ceec1b786b53993a7503` |
| Simulated controls | 8,002 | `6f974e8390c2dafdfbc5c53848458c0ff372a13f4a0fe1183e715d9b074c7c20` |
| Exact delta | 3,843 | `4bcaee4ad28d2e2866c4b7ede760f00cbca2d2b1b0aa3cca3c38f203bf7e0930` |
| Checks01 | 1,150 | `de70a5066e816c0b830c854425a8374969ac51fa74b8b720b56f2691c29faa02` |
| Plan01 | 1,340 | `d49d4e6c9aef76974ca808735a91d44da1f3397012c9fc7495bae2bae2884463` |
| Reviewed camera base | 11,459 | `c30a6e8db423b6cb9eea278ea1acc1f3b0cf21cb29e93c8b56e5987b187b924e` |

The delta contains 11 changed source lines (22 additions/deletions), excluding controls. I checked the environmental assumptions and cleanup composition despite its small size because it signals owned processes. Checks01 retains 11 simulated tests passed, exit 0, with no real process/signal/socket exercise; these are source controls, not an actual containment certificate.

The fixed command is `/usr/local/bin/node --import tsx evidence/step-09/native-ingress-fairness/preparation/ingress-component.ts`. Exact authorization wording and environment-path names are changed for that component. The main and total allowances become 25 and 35 seconds, respectively. A successful child must publish zero proxy and zero browser claims; the generic journal parser remains available to identify unexpected resources on a failed path. The header describes that generic protocol rather than evidence that this topology launches either resource. A worker thread shares the main process and requires no detached PID claim.

The prior containment fixes remain unchanged: read claims before taking the inventory; reject a changed accepted claim prefix; seed only an unreaped `Popen` root; retire the root identity after reaping; discover only through a present matching parent birth signature; and continue ownership discovery after latching claim-read failure. Cleanup inventory remains independent of malformed claims or failed evidence writes. Known owned descendants are checked by current identity before individual signals; the unreaped main uses its retained child/process-group identity. A reaped replacement root is not reused as an ownership seed. Unknown reparented ancestry remains an explicit failed/unresolved condition, not permission to signal an unrelated PID.

The smaller total allowance does not turn cooperative Python/OS operations into a hard timer. The controller still bounds each `ps` call, monitors the main, performs its existing finite TERM/KILL/reap stages, and fails if the observed total exceeds 35 seconds. Scheduling or filesystem/OS stalls can still exceed the target. A final-write failure may leave the earlier file as a prefix; stdout/exit and root readback remain necessary. Empty `remainingOwned` proves absence only of observed, identified owned processes, not an exhaustive global orphan proof. These limitations are inherited and documented, not removed by the new command.

For an actual decision, root must bind the complete final component/instrumented sources, controller, mode and exact environment. In particular, the helper must validate its mode and implement the declared Node-plus-worker-thread-only topology; this controller does not inspect component semantics or validate comparison equality. Use distinct absent absolute output, reserve, controller journal and resource-journal paths for each authorized arm, with no overlap with existing evidence or permanent services. The currently empty resource journal and all source hashes are rechecked by the controller; fresh root preflight should also bind the selected runtime and verify the resources required by the helper's separate plan.

No blocker was found in this literal-only controller successor. The component source review, actual timing/ordering denominators, cleanup result and any causal interpretation remain separate. At most the separately authorized baseline and successor are contemplated; neither a retry nor an application change follows from this note.
