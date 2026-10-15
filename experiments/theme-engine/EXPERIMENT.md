# Bongo Planet — reversible theme experiment

Date: 15 October 2026. Status: the user selected Original, Nebula Space and Firefly Garden, and requested a new distant 3D nebula with eyed stars and optional soft focus. The other three designs are archived. The user approved these three themes for production in the main game on 15 October 2026. The private preview remains separate.

## Checkpoint and scope

The pre-experiment checkpoint is `45cc2b82e14d6c0c3f4983b9a1b7518968dc0a0b` (`Checkpoint before reversible theme experiment`). It includes the music, preset, documentation and evidence work already present in this checkout. The experiment changes presentation only.

Preview: **http://127.0.0.1:5417/BongoPlanet/theme-experiment/**.

The ordinary application remains at **http://127.0.0.1:5417/BongoPlanet/**. Both use the same pinned port and existing server. Any web publication uses a separate theme-experiment Site and checkout. Earlier revisions were preview-only. The later explicit production approval promotes the three accepted themes through the main game publishing workflow while preserving both Site identities.

Published experiment: **https://bongo-planet-theme-experiment.jebagu.chatgpt.site** (private). Project `appgprj_6ad0b0f74e448191b561dc116ec1f18b`; source commit `0c2573efd8a02056132c1556ba08298093b1080a`; deployment `appgdep_6ad0b24c7f188191a69d8633e56df744` succeeded on 15 October 2026. Only `sites/bongo-planet-theme-experiment` was prepared and pushed. The main game Site was not deployed.

The hosted preview requires the owner's ChatGPT sign-in. Deployment success is verified by Sites; authenticated hosted gameplay was not verified because the inspection browser reached the sign-in page. Gameplay, screenshots and browser checks below are from the local app built into this deployment.

Try it: choose **Toy Ensemble** in Load preset, press **Play**, then use World theme or Previous/Next. **Original** restores the captured look while the same music keeps playing.

## Hypothesis

A single complete theme choice makes the musical toy feel more coherent and easier to customize than separate planet, sky, spark and lighting controls.

## Choices

- **Original:** the captured look with the original Planet blue sphere (`#5262e9`), corrected at the user's request; other captured colors and settings are retained.
- **Nebula Space:** Lilac dusk with Firefly Garden's night lighting, the existing sky gradient, and small distant 3D ribbon nebulae and stars with eyes. Optional Soft background focus leaves the musical stage sharp; old clouds and little planets stay hidden.
- **Firefly Garden:** dark jade and enamel, cool rim lighting, golden firefly sparks and gentle musical reactions.

Each complete theme owns instrument and planet materials/colors, grid and gate colors, lighting, shadow settings, fog/atmosphere, spark appearance/trails, motion response and interface accents. The original meshes, topology and musical event timestamps stay authoritative.

Deep Space, Sunday Picnic and Cloud Pudding are archived and absent from the picker and Previous/Next navigation. Their full pre-curation looks and the former Nebula scenery are preserved in [the archive record](../../archives/themes/2026-10-15/README.md). Historical revision notes below describe their earlier behavior.

## Reversibility

1. Theme selection and the Original snapshot use experiment-specific browser storage. Opening or switching experimental themes never overwrites the ordinary saved appearance.
2. Choosing Original restores the captured appearance with the requested blue sphere correction, without restarting or replacing the composition.
3. Opening `/BongoPlanet/` returns to the ordinary appearance editor and ordinary saved appearance.
4. Old look/composition files remain readable. New complete looks carry validated, versioned presentation values rather than depending on a mutable theme name.
5. Keep the implementation in a separate commit after the checkpoint. A later `git revert <experiment-commit>` can remove it while preserving subsequent work; do not hard-reset the shared checkout.

## Verification gates

- Checkpoint created before experiment edits: **passed** (`45cc2b8`).
- Build and TypeScript: **passed** (`npm run build`).
- Existing appearance/composition compatibility tests: **passed**; 86 tests across appearance, composition-file, spark-gates-appearance and complete-themes.
- Complete-theme serialization and malformed import rejection: **passed**, including old looks without a presentation profile.
- Browser Original restoration and isolated storage: **passed**; main appearance and composition save remained byte-for-byte unchanged.
- Switching every theme during playback preserves scene, routes and transport: **passed** in real Chrome, with continuing musical events and no shader/page errors.
- Actual desktop and narrow-screen visual inspection: **passed** at 1440 × 1000 and 825 × 1000; native in-app-browser preview also inspected. Phone interaction and Safari are **not run**.
- Reduced-motion handling and bounded repeated switching: **passed**; 20 switches, 653 geometries and 11 textures before/after, no lost context. Portrait rendering now reuses one WebGL context; theme decorations stop animating under reduced motion.
- Human preference/acceptance: **not run**; the running preview is for that decision.

Evidence: `evidence/theme-engine/playback-verification.json`, `stress-verification.json`, and the named theme screenshots. Full-repository test runs were not clean: the first default run had 734 passes and six failures; a two-worker run had 736 passes and six failures, including timing limits, a sandbox-blocked render browser, and a preset-count expectation while other preset work changed concurrently. Those broader results are not reported as experiment acceptance. Focused theme tests and the two browser checks passed after repairs.

## Limits of this experiment

This is an actual Three.js presentation experiment, not a claim of pixel-identical reproduction of the generated art. Detailed hand-authored scenery, complex fluid simulation and volumetric rendering are outside this pass. Musical scheduling, audio synthesis and venue output are unchanged.

## Visual refinement — 15 October 2026

The user accepted Original and requested more depth/darker skies, a colorful abstract Eagle Nebula backdrop, more distant clouds and more golden fireflies.

- Original keeps the captured values and original sky rendering.
- Deep Space now has a blue upper glow, a near-black lower sky, a vignette and stars with varied apparent distance/brightness.
- Nebula Space layers original generated cyan, teal, violet, magenta and amber dust-pillar artwork behind the lilac planet. The lower sky remains dark. [Artwork and generation prompt](../../assets/theme-engine/README.md).
- Sunday Picnic and Cloud Pudding now have darker lower gradients. Their smaller, fainter cloud puffs sit farther behind the globe, outside the instrument area, and keep that background position when the camera orbits.
- Firefly Garden retains night lighting and adds a fixed pool of 72 independently drifting/flickering golden sparks with soft glows and small streaks. Reduced motion stops their animation.

Untouched version-one browser preset selections refresh to the revised catalog. Customized looks and the captured Original are preserved. Portable file round trips retain explicit values.

Verification: production build **passed**; 93 focused appearance/file/theme tests **passed**; all three real-Chrome browser checks **passed**. These include continued playback while switching themes, Original restoration, main-save isolation, returning-browser refresh, decorative animation/reduced motion, bounded switching, and cloud depth/clearance across camera orientations. Updated named screenshots and JSON receipts are in `evidence/theme-engine/`. The main game Site is not part of this publication.

Publication succeeded at the same experiment URL on 15 October 2026. Pushed Site source: `aa14b30076eb1afc7eee45f20755345ea68eb3e0`. Deployment: `appgdep_6ad0b9e0b248819199efe3321f9ea1c5`. Receipt: `evidence/theme-engine/publication-refinement-v2.json`. The Site remains private to its owner. Local rendering was visually inspected in the native browser; authenticated hosted gameplay retains the sign-in verification limit recorded above.

## Cartoon skies and livelier fireflies — 15 October 2026

The user accepted Original and Deep Space, asked for Firefly Garden's nighttime lighting in Nebula Space, preferred a cartoon sky over the nebula image, requested smoother clouds and a Super Mario World-like distant background, and asked for more movement from the fireflies.

- Nebula Space now uses the same cool ambient/fill lights, warm key light, lighting strength, shadows, fog and rim as Firefly Garden. Original vector cloud bands replace the astronomical-looking backdrop; the earlier image remains only as a historical source asset.
- Sunday Picnic and Cloud Pudding share three smooth beveled cloud silhouettes, with opaque surfaces that avoid the previous puffs' transparent intersections. The background positions remain camera-relative and clear the planet. Original layered hills evoke rounded 16-bit platform scenery; Cloud Pudding uses a cooler tint.
- Firefly Garden retains its existing light and color values. Its 72 decorations now follow winding paths with roughly three times the travel distance and 5–12-second flights, previously 12–28 seconds. Reduced motion still stops drift and flicker.
- Untouched selections from both earlier browser catalogs refresh to the current preset. Customized looks, explicit imported values and the captured Original are preserved.
- The publication helper replaces only its generated hashed-asset directory before copying the new build, so obsolete backdrops are excluded from the new package.

Verification: production build and **98 focused tests passed**. All **three Chrome browser checks passed**, including playback, Original restoration, save isolation, preset refresh, animation/reduced motion and bounded switching. Geometry/texture counts stayed at 653/11 during the switching check. The final cloud placement was inspected at 1440 × 1000 and 390 × 844, with no page errors or phone overflow; shared night lighting was also checked from the running app. Updated screenshots and `feedback-verification.json` are in `evidence/theme-engine/`. These are local Chrome checks; Safari and physical-device checks were not run.

Published to the same owner-private experiment Site on 15 October 2026. Site source: `7798d5efdc988df1cec31878f317174a518b4cf9`; deployment: `appgdep_6ad0bf15787081918debbd2558bd20f2`; status: **succeeded**. Receipt: `evidence/theme-engine/publication-refinement-v3.json`. Hosted gameplay was not reverified; local Chrome verification and Sites publication success are recorded separately.

## Three-dimensional scenery and fixed North Pole — 15 October 2026

The user requested scenery that matches the instruments' visual style, including eyes and solid 3D bodies, playful space characters, the original blue sphere, and a North Pole plaque fixed to the globe's geometry.

- Sunday Picnic and Cloud Pudding now share puffy sphere-built clouds and rounded capsule hills. The same painted body material and eye/glint builders serve instruments and scenery; the scenery palettes follow each theme.
- Nebula Space has four colorful nebula characters, two little planets (one ringed), and three beveled star characters, all with eyes. These replace the SVG background and remain behind the musical objects.
- Original restores Planet blue (`#5262e9`) while retaining other captured fields. Returning browsers with the earlier Original selection receive the correction; the main saved appearance is unchanged.
- The North Pole's post and plaque remain fixed in globe coordinates. The N faces rendered +Z and no longer swivels toward an orbiting camera. A browser regression checks both world transforms while the camera moves.
- Deep Space's presentation values and Firefly Garden's lighting/motion remain as accepted. Decorative drift stops under reduced motion, and scenery creates no musical pieces or picking targets.

Verification: production build and **136 focused tests passed**, including composition-file and instrument coverage. All **five Chrome checks passed**, covering playback, serialization/save isolation, Original migration, fixed North Pole transforms, reduced motion and repeated switching. Resource counts stayed at 660 geometries and 11 textures in the repeated-switch check. Desktop rendering at 1440 × 1000 and phone rendering at 390 × 844 were inspected; phone checks found no page errors or horizontal overflow. Evidence is under `evidence/theme-engine/characters/` and the current theme browser receipts. Safari and physical devices were not tested.

Published to the same owner-private experiment Site on 15 October 2026. Site source: `c2e160f046582b16bada6f3b6c31dd3a1bdc032c`; deployment: `appgdep_6ad0c31177d081918ec439571e6b8c11`; status: **succeeded**. Receipt: `evidence/theme-engine/publication-characters-v4.json`. The existing authenticated in-app preview tab was refreshed and the blue Original sphere was visually confirmed. Hosted musical playback was not rerun; playback and orbit regression checks were performed locally in Chrome.

## Foreground priority for musical objects — 15 October 2026

The user reported scenery intersecting musical objects in Nebula Space, Sunday Picnic and Cloud Pudding.

- The scenery now occupies a distant camera-relative depth, starting eight world units behind the scene origin and moving farther back if needed to clear current musical bounds. Orthographic apparent sizes and the character designs are retained.
- A reusable half-resolution silhouette pass reserves the actual shapes of instruments, including translucent rear notes, maximum-sized four-layer chords, placement ghosts and the North Pole. Scenery materials clear beneath these silhouettes with a small soft margin. The sky gradient remains behind the notes, so a faint note no longer reveals a cloud or little planet through its body.
- The mask follows camera orbit, tilt, zoom, viewport size and pixel density. Solid coverage for single-texel details is preserved on Retina screens. Selection halos do not become invisible blockers. The pass restores camera layers, render target, material override, shadows and clear color before the normal draw, and disposes its reusable target with the view.
- Original, Deep Space and Firefly Garden do not use this pass. Musical scene data, timing, picking and saved look/composition formats are unchanged.

Validation: production build and **137 focused tests passed**. All **17 Chrome checks passed**, including the existing playback/save/North Pole regressions and twelve GPU pixel-comparison cases across all three themes, standard and rotated/zoomed views, maximum-sized four-layer chords, narrow Retina and phone Retina layouts. Across 1,081,068 protected pixel samples, enabling scenery changed no RGBA channel value (maximum difference **0**). Scenery remained visible outside the protected shapes in every case; the closest measured depth clearance was **6.01 world units**. Evidence and screenshots: `evidence/theme-engine/background-clearance/summary.json` and the twelve named case receipts. These are local Chrome checks; Safari and physical devices were not tested.

## Approved lineup and archive — 15 October 2026

The user selected Original, Nebula Space and Firefly Garden. Deep Space, Sunday Picnic and Cloud Pudding are saved outside the picker and Previous/Next navigation. [The archive](../../archives/themes/2026-10-15/README.md) points to the complete pre-curation appearance snapshot, including the former Nebula scenery.

Nebula Space changes only its atmosphere decoration to `none`, hiding its stars, clouds and little planets while retaining its colors, materials, nighttime lighting, fog, rim, sparks and motion. Firefly Garden retains its accepted appearance and animation. Untouched retired browser presets receive a separate backup before returning to Original; customized looks and explicit historical file imports remain supported.

Validation: the production build, **143 focused tests** and **nine Chrome checks** passed. The browser checks cover the exact three-theme picker, no Nebula star field or 3D scenery, continuing playback, isolated saves/reload, retired-preset backups, imported custom looks, bounded switching, reduced motion and the fixed North Pole. Three of the checks exercise historical scenery imports using the saved appearances; those designs remain absent from the picker. Evidence: `evidence/theme-engine/curation-verification.json`, `playback-verification.json` and `stress-verification.json`. The private theme-experiment Site remains the sole publication target.

Published as source `f512642da79a5f31c176d65e8887f739403c66f0`, deployment `appgdep_6ad0d2f867648191a60e37f08fd69693` (succeeded). The existing signed-in in-app browser was reloaded and showed the approved three choices. Publication receipt: `evidence/theme-engine/publication-curated-v6.json`. The main game Site was not deployed.

## Distant nebula and background focus — 15 October 2026

The user requested a different 3D nebula and stars with eyes, placed much farther into the background, then suggested slight defocus and a camera option.

- New sculpted, tapered violet, teal and rose ribbons replace the former cloud-shaped nebula characters. Two small formations and seven beveled eyed stars use the game's painted materials and solid eye geometry. The old cloud characters and little planets stay hidden; the three-theme lineup is unchanged.
- The new sky sits at least twenty world units behind the globe's origin, with smaller apparent sizes and softened colors. Its framing and apparent scale remain steady through globe orbit and zoom, which avoids the orthographic camera's tendency to make distant meshes look as close as the instruments.
- **Soft background focus**, on by default, provides a subtle .6-CSS-pixel depth-of-field treatment. It can be disabled for crisp background toys, and the selection survives reload and portable appearance export. `atmosphere.backgroundBlur` accepts 0–2 and defaults to zero for old files.
- Only the distant sky renders into the focus target. The musical silhouette mask applies again after blurring; the globe, instruments, North Pole and sparks render sharply afterward. Offscreen state is restored and resources are disposed with the view. Original, Firefly Garden and explicit archived files retain their rendering.
- `assets/theme-engine/catalog-v4.json` preserves the preceding scenery-free approved looks for exact browser-preset refresh; explicit file imports retain their presentation values.

Validation: production build and **147 focused tests passed**; all **23 Chrome checks passed**. This includes four new distant-sky GPU cases, twelve archived scenery-import cases and seven theme/playback/save/focus/North Pole regressions. Across **406,740 protected musical pixels**, the new blurred background changed no RGBA channel (maximum difference **0**); the closest measured depth gap from an instrument bound was **17.66 world units**. Unit checks verify 3D star thickness and eyes, screen stability through orbit/zoom, reduced motion, serialization and unchanged accepted palettes. Evidence: `evidence/theme-engine/distant-nebula/summary.json` and its four case screenshots/receipts. Browser checks use local Chrome, including emulated phone/Retina layouts; physical devices and Safari were not tested.

Published as source `6a085265163bfe80f4871c432e361f6ff7cec448`, deployment `appgdep_6ad0d7c2b078819180fb81d98cd9cb33` (succeeded). Reloading the existing signed-in in-app browser retained Nebula Space and showed Soft background focus enabled, with the new distant scenery visible. Publication receipt: `evidence/theme-engine/publication-distant-nebula-v7.json`. The main game Site was not deployed.

## Production approval and integration — 15 October 2026

The user approved all three current themes for production in the main Bongo Planet and asked the **Reorder and simplify the menu** chat to publish the combined release. This explicitly supersedes the earlier preview-only boundary for Original, Nebula Space and Firefly Garden. The private Site retains its identity and audience.

The main entry now uses the same approved picker and background-focus option, with main-game appearance storage and a separate unthemed Original snapshot. Mounting preserves existing custom/imported looks and never captures an active complete theme as Original. The preview keeps isolated saves. Appearance-only import/export remains available under collapsed Look files; the former editor source is archived. Musical scheduling, scene saves and accepted theme rendering remain unchanged.

Validation: build, **147 focused tests** and **21 Chrome checks** passed, including main-entry playback/save/reload, custom preservation, Original capture, preview isolation, legacy file import, menu and gate/spark compatibility, and four main-entry GPU clearance cases. The final publishing handoff and receipts are in `evidence/theme-engine/production/`. Main Site publication is owned by the menu chat to avoid conflicting writes or deployments.

Repeated switching retained 660 geometries and 12 textures before/after. Published to the same owner-private experiment Site on 15 October 2026. Site source: `b18fa44fb0b5042c1524583e5283b03f0ad88ef1`; deployment: `appgdep_6ad0cf2a456c819192c9b48b6f4cbe43`; status: **succeeded**. Receipt: `evidence/theme-engine/publication-background-v5.json`. The existing authenticated in-app tab was refreshed and the published module `planet-CxZ7ecLO.js` verified. Hosted musical playback was not rerun; the playback and pixel-separation checks above were performed locally in Chrome.
