# Bongo Planet — project instructions

## Separate fork

- **This checkout remains the original Bongo Planet.**
- **Super Bongo Planet** is an independent fork at `/Users/jeremyguillory/Documents/ChatGPT/super-bongo-planet`.
- Work requested for Super Bongo Planet belongs in that fork; read its `AGENTS.md` and `FORK.md` first. Do not rename this original or mix the two projects' edits, services, saved scenes, or acceptance evidence.
- The fork uses `http://127.0.0.1:5517/SuperBongoPlanet/`, bridge port 5518, and UDP receiver port 5519. This original retains the ports below.

## Naming

- The exact project and game name is **Bongo Planet**. Use it in titles, UI, documentation, artifacts, and communication. Do not append model numbers or other suffixes to the product name.
- **Ripple and Globophone are old names. If you ever see either in historical material, treat it as obsolete and use Bongo Planet instead. Never use either old name as the current project or product name.** Keep the old spellings only in this historical-name rule.

## Local hosting

- Permanent planned browser URL: **http://127.0.0.1:5417/BongoPlanet/**.
- Pin port **5417** with strict-port behavior and use **/BongoPlanet/** as the application base path.
- Check port availability before launching. Identify and stop a stale project server where appropriate or report the conflict; do not silently change the permanent URL.
- The local bridge defaults to loopback WebSocket port **5418**.
- The URL is a build contract; no running server is implied by these instructions.
- **Production themes approved on 15 October 2026:** Blue Marble, Nebula and Fireflies belong in the main **/BongoPlanet/** game and its public Site. The user explicitly approved promotion from the private preview. Main appearance/composition storage remains separate from the preview; use `bongo-planet-original-look-v1` for the main Blue Marble snapshot. Preserve existing custom/imported looks.
- Retained preview: **http://127.0.0.1:5417/BongoPlanet/theme-experiment/**. It keeps separate browser appearance/composition saves and its private Site identity. The three approved themes also ship in the main game; do not overwrite either Site's audience or identity.
- Separate experiment Site: **https://bongo-planet-theme-experiment.jebagu.chatgpt.site**, checkout `sites/bongo-planet-theme-experiment`, project ID `appgprj_6ad0b0f74e448191b561dc116ec1f18b`. Prepare with `node scripts/prepare-theme-experiment-site.mjs` after building. Preserve its private audience.
- Approved complete-theme lineup: **Blue Marble, Nebula, Fireflies**. Nebula keeps its palette and nighttime lighting with a new distant 3D ribbon nebula and small stars with eyes. Its saved background focus affects only this scenery; keep the musical stage sharp. The Theme section contains only its heading and drop-down; omit the restore pill, descriptions, focus checkbox, Previous/Next and Look files controls. Keep the stored theme IDs and browser keys unchanged when renaming the visible choices. The old large clouds and planets stay hidden. Deep Space, Sunday Picnic and Cloud Pudding remain saved outside the picker; see `archives/themes/2026-10-15/README.md`. Do not restore those choices without a user request.
- Composer asset explorer: **http://127.0.0.1:5417/BongoPlanet/research/mario-paint/index.html**. The build includes this standalone page and its assets so it also works under `npm run preview`.
- Sound palette listening room: **http://127.0.0.1:5417/BongoPlanet/research/sound-palette/index.html**. Research-only page served by the development server; not included in the production build.
- Arrow outline studies: **http://127.0.0.1:5417/BongoPlanet/research/arrow-studies/**. Isolated research-only comparison with ten fainter outlines; it does not change the game or its saved look.
- Color and material studies: **http://127.0.0.1:5417/BongoPlanet/research/color-studies/**. Isolated HTML mockup with numbered color and clay combinations, the original instrument meshes and an optional shared star field; it does not change the game or its saved look.
- AI music introduction and guide: **http://127.0.0.1:5417/BongoPlanet/ai-music/**. A standalone page included in the production build; the Write music with AI link opens the file-based guide in a new tab.

## Project references

- Public GitHub repository: **https://github.com/jebagu/Bongo-Planet**. Its `main` branch contains a source snapshot, including the current uncommitted development work when prepared. Prepare it with `node scripts/prepare-github-source.mjs`; the independent publishing checkout is `release/github/Bongo-Planet`. Keep the original development Git history and raw diagnostic captures here. Do not push this checkout's historical branches to the public repository: they contain captures over GitHub's file-size limit. See `docs/GitHub.md`.

- **Chatbot control is shelved (2026-10-15):** keep `src/aiControl.ts` and `sites/bongo-planet/bongo/src/aiControl.ts` disabled. Do not import `src/liveConnection.ts` from the instrument entry. The public Site retains its Worker, D1 binding, migrations and connection implementation, but omits the MCP capability and returns HTTP 410 for `/mcp` and `/api/ai/*`. The guide uses composition files again. Full pre-shelving source is saved on `archive/chatbot-control-2026-10-15` in the Site checkout and in the task output archive; see `sites/bongo-planet/Chatbot-Control-Shelved.md`. The service URL stays `http://127.0.0.1:5416/BongoPlanet/`. Restore chatbot control only when the user requests it; ordinary publications must keep it disabled.
- **Canonical agent composition reference:** `Agent-Guide.md` documents the portable music-and-look file, current instruments, visual settings, FAQ and real topology neighbors. It is generated by `npm run docs:agents` from `src/agentGuide.ts`, the validators/catalogs and `Creation-Guide.md`; the standalone AI music page uses that same generator. After changing instruments, behavior, settings or appearance options, update the applicable source and `Creation-Guide.md` / `Rules.md`, regenerate the guide, and run `tests/composition-file.test.ts`. `npm run build` regenerates it too. Do not maintain a separate copied FAQ.
- **Musical creation and timing contract:** read `Creation-Guide.md` and `Rules.md` before changing scheduling, generators, routes, fixtures, or composition examples. Current gated playback uses one sixteenth note per adjacent hop on a shared master grid, independent of geometry. All active circuits follow whole-beat tempo changes together. Keep distance-based timing confined to version-one compatibility playback.
- Public Site: **https://bongo-planet.jebagu.chatgpt.site**.
- Sites publishing checkout: `sites/bongo-planet`; its `.openai/hosting.json` retains project ID `appgprj_6acfc426d578819180c161a37ca9f603`. Reuse this Site for future publications.
- Refresh the publishing snapshot with `npm run build`, then `node scripts/prepare-public-site.mjs`. For the full-stack Site, this prepares public/ and refreshes its validator/guide source; build and package the Worker with the Sites workflow afterward. The public package serves the app at `/` and `/BongoPlanet/`; local hosting stays on its permanent URL above.

- Product reference: `Game-Design-Brief.md`.
- Implementation and acceptance plan: `Work-Package.md`.
- Spark-switch, routing-backend, and node-count/Infinite travel implementation plan: `Spark-Gates-Work-Package.md`. Gated playback exists in the current source; consult `Rules.md` and `Creation-Guide.md` for current behavior. Historical UI defaults and original acceptance evidence in the plan do not override later documented changes.
- Spark Gates implementation/qualification: `evidence/spark-gates/review.md` and `evidence/spark-gates/Acceptance-Checklist.md`. Preserve individual passed/failed/blocked/not-run results, retained source snapshots, and the measured 64-decision quantum bound. Actual human, Safari, venue and physical-device review stay distinct from machine tests.
- Build kickoff instructions: `Multi-Agent-Kickoff.md`. Execute them when the user authorizes starting the build; a request to edit planning documents alone does not start implementation.
