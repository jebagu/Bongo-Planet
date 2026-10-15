# Bongo Planet — scene transaction controls

Nine focused model tests passed; the whole-project typecheck passed. Production sources were unchanged. Source snapshots and hashes, exact commands/tool results and machine test output are retained here.

Successful additions of all three piece kinds return exactly one added ID/vertex/kind and preserve every previous piece and settings. Successful deletion of each kind returns the separately declared remaining IDs. The original scene remains byte-identical after each operation; modifying the returned nested settings/pieces cannot change it. Rejections cover occupied slots, duplicate IDs, out-of-range vertices, a ninth generator, callback failure after a draft deletion, and invalid final settings after a draft deletion. Earlier valid draft changes never leak into the original scene when validation or callback execution fails.

The actual palette add and inspector delete callsites use `changeScene` before `apply`; this is Step02's model geometry/occupancy transaction boundary. The focused tests do not measure browser gestures, renderer/audio/output side-effect atomicity, asynchronous observers, or venue behavior. Existing browser tests cover separate interaction requirements; no such result is inferred here. Root acceptance follows independent source and retained-result review.
