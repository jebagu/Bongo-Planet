# Bongo Planet — necessary support and admission contraction

Prepare a separate version of the runner, preserving the original source and failed attempt. Before the existing bisection, intersect its root domain with **individually proved necessary support/admission constraints**. Keep every tolerance, resource limit, numerical premise, clock, denominator, full/attack comparison and disposition rule unchanged. This is a source proposal, not authorization for another recording analysis or a prediction that the search will finish.

## A singleton contradiction provides the necessary constraint

For a fixed, predeclared attack sample index `i`, let `y_i` be its recorded Float32 value. Compute `B_i`, the complete output enclosure with the selected group absent and every other voice fixed, using the same conditional expression, summation, gain, tanh and Float32 bounds. The existing proved non-stealing ownership condition is required. Let `L_i = squaredDistanceLower(y_i, B_i)`.

Let `N_A` be the **complete** attack denominator, 960 for this attempt, and `epsilon` the unchanged binary64 tolerance. Form the upper threshold by the existing directed arithmetic, `T_A_plus = nextUp(N_A * nextUp(epsilon * epsilon))`. If and only if `L_i > T_A_plus`, absence of every selected component at sample `i` contradicts the complete attack criterion: one sample alone would exceed its entire squared-error allowance. Thus every compatible candidate must have at least one selected component potentially contributing at that sample.

Use a strict comparison against the outward upper threshold. Equality, an interval touching the threshold, nonfinite arithmetic, incomplete attack support, or an unproved ownership branch provides no contraction. Do not test against a subset denominator or a rounded displayed RMS. Do not turn a sum of several weak sample bounds into a claim that every one of those samples requires presence: such a sum can establish only a collective contradiction. Each constraint used in the intersection below must have its own singleton proof.

Choose the bounded sample set and traversal order from the existing deterministic sample schedule, before reading sample amplitudes. The PCM value decides whether the proof succeeds; it does not select a peak, fitted epoch or best candidate. This can be extended to samples outside the attack only by comparing each singleton against the complete full-window threshold, with that distinction retained explicitly.

## Invert the rounded support tests conservatively

Keep each component's actual supplied duration and difference. With round-to-nearest binary64 written `RN`, define:

```
delta_j = RN(selected[j].onset - selected[0].onset)
t_i     = RN((firstFrame + i) / rate)
c_j     = RN(origin + delta_j)
age_j   = RN(t_i - c_j)
```

These are the operations represented by the current candidate expression; do not substitute a differently associated origin expression. A component can contribute only if the shared admission frame `A <= firstFrame+i` and `0 <= age_j < duration_j`. Replace the strict age interval conservatively by the closed `[0, duration_j]`; retaining impossible endpoints is safe.

For a finite binary64 interval `I=[lo,hi]`, define `inflate(I)=[nextDown(lo),nextUp(hi)]`. If `RN(z)` belongs to `I`, then the real pre-rounding value `z` belongs to this inflated interval. It is deliberately wider than the exact rounding-cell preimage, including midpoint ties, zero and subnormals. Infinities or invalid endpoints must trigger an unresolved/no-contraction path, not clipping.

Using the existing outward interval subtraction:

```
agePre_j = inflate([0, duration_j])
C_ij     = subtract([t_i,t_i], agePre_j)
O_ij     = subtract(inflate(C_ij), [delta_j,delta_j])
```

For any compatible candidate whose component `j` contributes, rounded-age membership implies `c_j` lies in `C_ij`; inversion of the rounded origin addition then implies `origin` lies in `O_ij`. Consequently the singleton certificate proves the necessary origin condition `origin in union_j O_ij`. A minimal implementation may retain the **hull of this union**, which loses pruning strength but preserves every component alternative. Intersecting component intervals with one another would be wrong: only one component is required to contribute. Use separate durations and differences even when the current F02 components coincide; a maximum-duration shortcut must be justified as an enclosing hull, never assumed to represent every component.

The same certificate gives the necessary admission upper bound:

```
f_i    = firstFrame + i
A_max  = 128 * floor(f_i / 128)
```

Validate safe integer frames and exact 128-frame quantization. This is the greatest allowed admission quantum not later than that sample; use integer frame arithmetic, not a floating seconds round trip. Keep the original admission lower bound. Admission at the boundary remains allowed. The support inequalities are necessary only: phase zeros, attack zero, cancellation, saturation and correlated parameters can still prevent a match.

## Intersect proofs, preserve all other possibilities

Intersect the original origin domain with the origin hull from each independently certified sample; reduce admission-high by the minimum independently certified `A_max`. This intersection is sound because every individual constraint was proved necessary for every compatible candidate. Preserve the original domain and a certificate for every removal. A certified empty intersection means the family is incompatible, not a successful timing measurement. If any prerequisite or guard is unavailable, retain the unresolved original domain and fail conservatively.

Do not narrow around the expected onset, a nominal witness, ±20 ms or the lowest RMS. Do not select one period alias, collapse late admission into waveform phase, change the existing early-admission equivalence rule, or discard outside-window missing-family handling. This contraction excludes only origin/admission combinations incapable of contributing at required samples; it is not phase-alias exclusion and does not prove joint component or neighboring-origin identifiability.

Retain `i`, integer frame, rounded sample time, absent-group enclosure, lower squared distance, complete denominator, upper threshold, each component's duration/difference and derived interval, admission quantum bound, root before/after, and operation counts. Charge the bounded extra expression evaluations and retained certificates to the existing work/detail limits. Commit a contracted domain only after its certificate is complete. Any interruption before that point restores the original unresolved domain; later search failures must retain all unresolved contracted cells plus the valid exclusion certificate, or conservatively restore the original root. Keep all prior partial rows and all 468 denominator rows.

## Source controls before any new execution decision

- Test strict threshold equality and touching intervals, nonfinite values, complete versus clipped attacks, and several individually weak samples whose sum exceeds the threshold. The weak-sample case must not generate the unjustified intersection.
- Test age zero/duration, signed zero/subnormal inverse bounds, nonzero component differences, unequal durations, and cases where rounded subtraction or origin addition lies immediately on either side of a support boundary.
- Test admission immediately before, at and after a 128-frame boundary; compatible off-grid origins and late admissions must survive.
- Test a group where only one component supports a required sample; union/hull must retain it. Preserve a distant periodic alias inside the necessary support domain.
- Use small independent synthetic candidates to check that contraction never removes known compatible parameters. This supplements the proof; a finite grid is not a continuous-domain proof.
- Preserve resource-failure output and whole unresolved-domain retention during certificate construction and after bisection begins. Keep the old cap-triggered attempt intact. Measure source-only work counts on a synthetic long root before deciding whether one separately authorized recording analysis is useful.

The improvement changes search preparation only. All original numerical assumptions, missing implementation scopes, unsupported dense rows and false acceptance/qualification flags remain explicit.
