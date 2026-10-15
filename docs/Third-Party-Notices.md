# Bongo Planet — third-party notices

The instrument uses original interface graphics and synthesized sounds. The following runtime libraries and fonts are distributed with the runnable candidate; their original license texts are retained without alteration. Source dependencies are pinned by package-lock.json.

| Package | Installed version | License | Text |
| --- | --- | --- | --- |
| `@fontsource/dm-sans` | 5.3.0 | OFL-1.1 | [DM-Sans license](licenses/DM-Sans-LICENSE.txt) |
| `@fontsource/manrope` | 5.3.0 | OFL-1.1 | [Manrope license](licenses/Manrope-LICENSE.txt) |
| `three` | 0.186.1 | MIT | [Three license](licenses/Three-LICENSE.txt) |
| `zod` | 4.6.6 | MIT | [Zod license](licenses/Zod-LICENSE.txt) |
| `ws` | 8.22.0 | MIT | [ws license](licenses/ws-LICENSE.txt) |
| `playwright` | 1.64.0 | Apache-2.0 | [license](licenses/Playwright-LICENSE.txt), [notice](licenses/Playwright-NOTICE.txt) |
| `playwright-core` | 1.64.0 | Apache-2.0 | [license](licenses/Playwright-Core-LICENSE.txt), [notice](licenses/Playwright-Core-NOTICE.txt) |

The local bridge uses Playwright to launch the installed Google Chrome browser as its private render-clock companion. Chrome is not redistributed in the candidate bundle. Install the development dependencies with `npm ci` to run the bridge.

NodeBeat reference graphics and audio are not incorporated into the instrument. Unrelated research explorer assets are excluded from the candidate bundle.
