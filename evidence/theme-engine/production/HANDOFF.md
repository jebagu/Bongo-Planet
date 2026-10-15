# Bongo Planet production themes

The user explicitly approved **Original, Nebula Space and Firefly Garden** for the main Bongo Planet and asked the **Reorder and simplify the menu** chat to publish them with its menu and guide changes.

The main `/BongoPlanet/` entry now uses the approved picker in Theme. Main appearance saves use `bongo-planet-appearance-v1`; Original has an independent, unthemed blue snapshot at `bongo-planet-original-look-v1`. The private preview keeps its own keys. Existing custom/imported looks remain intact. Collapsed Look files retains appearance-only import/export; Composition continues to transfer music and look together.

Nebula's accepted colors, nighttime lighting, distant 3D nebula and seven eyed stars are unchanged. Soft background focus defaults to .6 CSS pixels and keeps musical shapes sharp. Original and Firefly Garden retain their accepted rendering. Deep Space, Sunday Picnic and Cloud Pudding remain archived and absent from the picker. The old editor source is preserved in `archives/themes/2026-10-15/legacy-look-controls.ts.txt`.

Validation: **production build, 147 focused tests, and 21 Chrome checks passed**. Checks include main playback/save/reload, original capture, customized looks, preview isolation, file import/export, storage failure, menu consistency, legacy gate/spark appearances, fixed North Pole and four GPU background-clearance cases on the main entry. Receipts and a main-entry screenshot are in this directory; GPU evidence is in `evidence/theme-engine/distant-nebula/`.

The publishing owner should rebuild the shared source, run `node scripts/prepare-public-site.mjs`, then use the existing main Site workflow at `sites/bongo-planet` for project `appgprj_6acfc426d578819180c161a37ca9f603`. Preserve its public audience, Worker, D1/migrations, empty capabilities and shelved chatbot control. Do not replace it with the private preview's Site identity. This chat has not prepared or deployed the main Site checkout, to avoid racing the publishing owner.
