# Bongo Planet — integrated gesture history

```sh
npx playwright test tests/gesture-history-browser.spec.ts --workers=1 --reporter=line
npx tsc --noEmit
```

Three installed-Chrome checks passed in 4.1 seconds; TypeScript checking passed. Each test used the actual paused production app, real controls, and captured complete pre/post scenes. No history, engine, input event, or scene state was stubbed.

- Global volume: one held-pointer slider gesture traversed multiple trusted native input values. The app committed the final selected value on release. One Undo restored the complete scene before the gesture; one Redo restored the complete final scene.
- Note level: the same check used the selected Note's actual inspector slider and verified that only that Note's level changed, with complete-scene Undo/Redo restoration.
- Piece relocation: one actual drag passed through three legal destinations. The model stayed unchanged while held and committed the final destination on release. One Undo restored the entire original scene; one Redo restored the entire moved scene.

The slider gesture is intentionally accepted as commit on release; continuous model changes while held are not required. Actual trusted input records, held-pointer scene traces, full final scenes, and Undo/Redo scenes are in `global-volume.json`, `note-level.json`, and `piece-drag.json`. The three `*-after-redo.png` images show the final restored controls/placement.

The browser checks overlapped the separately declared final stress soak. Their own app stayed paused and disconnected from spatial output; they did not modify application source or the soak's server/browser. Their Chrome contexts closed automatically after the tests.
