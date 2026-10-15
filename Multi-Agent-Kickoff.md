# Bongo Planet — multi-agent build kickoff

Select **GPT-6.1 Sol → Extra High** for the main chat, then copy the prompt below into the Bongo Planet project chat.

```text
Build Bongo Planet by executing the complete Work-Package.md in the current project workspace. Use Game-Design-Brief.md as the product reference. Read [Creation-Guide.md](Creation-Guide.md) and [Rules.md](Rules.md) first: current version-two gated scenes use equal sixteenth-note hops and shared-grid tempo alignment; the original distance-based fixtures below are version-one compatibility material.

The exact project and game name is Bongo Planet. Use it throughout the application, documentation, artifacts, and communication, without model-number suffixes. Read and follow the historical-name rule in AGENTS.md. If historical material uses a previous project name, replace it with Bongo Planet when editing that material.

This is authorization to begin implementation, install project dependencies, run the local application and bridge, and perform the required tests. Continue working toward completion; do not stop after planning or the first playable demonstration.

Create a persistent goal to complete the work package through M0–M4, with every required acceptance gate accurately reported. Do not invent a token budget.

Agent arrangement:

- Main agent: GPT-6.1 Sol, Extra High. Act as lead developer and integrator. Own the shared contracts, musical rules, transport, scheduling, cancellation semantics, integration, and acceptance decisions. Implement code yourself as well as coordinating.
- Up to two implementation subagents: GPT-6.1 Sol, High. Delegate bounded tasks with explicit file ownership, interfaces, prerequisites, and acceptance criteria.
- Independent reviewer: GPT-6 Astra, Extra High. Review substantial completed changes and milestone candidates for correctness, failure scenarios, and missing evidence. The reviewer should examine the actual implementation and tests.

Explicitly set each subagent's model and effort rather than inheriting the lead's settings. Give each a self-contained assignment and the relevant source material. Tell workers they share the workspace, must preserve others' edits, and must coordinate interface changes through the lead. Keep no more than four agents active, including the lead. This prompt explicitly requests delegated subagent work during the build.

Read the work package, design brief, and applicable AGENTS.md instructions first. Consult NodeBeat-Research.zip where relevant and follow its asset-rights guidance.

Before or during Step 01, incorporate the three findings from the critical review:

1. Establish a live browser audio timing budget. Test actual output against independent expected onset times, compensating for measured fixed output latency. Include dense playback and deliberate scheduling stalls; offline renders and scheduled timestamps alone cannot prove live accuracy.
2. Define supported generator, target, tempo, and event limits. Make stress fixtures cover the maximum supported workload rather than relying only on the existing four-generator dense fixture.
3. Define position-update freshness independently of rendering, including coalescing and backpressure behavior. Compare receiver movement traces at 60, 15, and 2 FPS. Qualify renderer-specific interpolation during the venue steps.

Record these decisions in the package and Rules.md, and update affected acceptance checks and fixtures.

Execute the package in dependency order. During Steps 01–03, keep engine decisions with the lead and delegate independent fixtures or tests. After contracts stabilize, delegate suitable rendering/input, audio, storage, or bridge work as its prerequisites become available. Parallelize independent work within the plan; do not assign all steps concurrently.

Use Extra High for normal lead work and High for implementation workers. Reserve Max for specific unresolved architecture or scheduling problems, and return to the normal settings afterward.

Maintain Acceptance-Checklist.md and the required evidence/step-XX/ folders. Identify the source revision, environment, commands, expected results, actual results, and artifacts. Commit coherent passing changes where appropriate. Tests must use independently specified expectations, not reproduce the implementation's logic.

Have the independent reviewer inspect milestone candidates. Assess findings, fix substantiated problems, and rerun affected checks. Integrate and validate workers' changes before accepting a step.

Follow the permanent hosting contract:
http://127.0.0.1:5417/BongoPlanet/

Pin port 5417 with strict-port behavior and use /BongoPlanet/ as the application base path. Keep the contract recorded in AGENTS.md. Resolve or report a port conflict without silently changing the URL. Use the planned loopback bridge port 5418.

Continue autonomously through routine implementation choices, debugging, and repairs. Ask for missing external information early while continuing useful independent work. Give concise progress updates explaining what is working, what remains uncertain, and what the next check will establish.

Human, venue, and physical-device checks require the actual people and environments specified in the package. Identify those dependencies early. When one is unavailable, keep its checks open and continue later independent work where the package permits it. Report unavailable checks as blocked or not run; simulated results cannot substitute for required acceptance evidence.

Keep public publication, App Store submission, purchases, and outreach outside this build authorization.

Close the persistent goal only when all required milestone gates have passed. If external dependencies prevent completion, deliver the strongest runnable result available and a precise handoff: accepted milestones, remaining checks, blockers, latest passing revision, exact launch/test commands, evidence links, and the next action needed.

Begin now with Step 01 and proceed toward completion.
```
