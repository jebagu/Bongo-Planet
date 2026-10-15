# Bongo Planet — logical unit arc preparation

`surfaceArc` now defaults to unit radius. `SphereView.arc` explicitly supplies the previous 48 segments and 1.018 display radius, preserving its displayed connection/trail/preview points. Other display radius choices are unchanged. Only that expression in SphereView was edited; root's pointer-cancellation edits were preserved.

Prepared tests cover all 92 × 92 directed topology pairs, 49 default samples each (414,736 samples): finite coordinates, exact transformed endpoints and norm error ≤1e-6. Analytic north/south poles, exact/near antipodes, coincident points and a south-pole quarter arc additionally check default-path determinism, endpoints, finiteness, norm and angular midpoint. The north-to-south quarter/three-quarter samples check π/4 and 3π/4. Existing explicit 1.018 display-lift checks remain intact.

Rules.md explains logical unit geometry versus display lift. The Work-Package criterion was not changed. These tests address default logical arc geometry; they do not establish a literal unit-radius display gate. Root owns acceptance interpretation after review.

Validation: parent ran the focused view-math test once: **5/5 passed**, with no failed or pending cases, in `root-unit-results.json`. Parent also reported **npm typecheck passed**. This agent launched no unit/typecheck run and had no interrupted attempt. The near-antipodal midpoint assertion passed unchanged: the deterministic tangent changes path direction while the angle uses the actual endpoint dot product.

`source-bindings.json` records post-test source hashes, exact source readback copies and the retained result hash. Its provenance explicitly distinguishes this readback from a test-launch snapshot. Existing frozen transport and presentation evidence is not presented as a capture of this changed source. Parent owns the build, browser follow-up and acceptance interpretation; this agent ran no build or browser capture.
