# Bongo Planet — project instructions

## Naming

- The exact project and game name is **Bongo Planet**. Use it in titles, UI, documentation, artifacts, and communication. Do not append model numbers or other suffixes to the product name.
- **Ripple and Globophone are old names. If you ever see either in historical material, treat it as obsolete and use Bongo Planet instead. Never use either old name as the current project or product name.** Keep the old spellings only in this historical-name rule.

## Local hosting

- Permanent planned browser URL: **http://127.0.0.1:5417/BongoPlanet/**.
- Pin port **5417** with strict-port behavior and use **/BongoPlanet/** as the application base path.
- Check port availability before launching. Identify and stop a stale project server where appropriate or report the conflict; do not silently change the permanent URL.
- The local bridge defaults to loopback WebSocket port **5418**.
- The URL is a build contract; no running server is implied by these instructions.
- Composer asset explorer: **http://127.0.0.1:5417/BongoPlanet/research/mario-paint/index.html**. The build includes this standalone page and its assets so it also works under `npm run preview`.

## Project references

- Product reference: `Game-Design-Brief.md`.
- Implementation and acceptance plan: `Work-Package.md`.
- Build kickoff instructions: `Multi-Agent-Kickoff.md`. Execute them when the user authorizes starting the build; a request to edit planning documents alone does not start implementation.
