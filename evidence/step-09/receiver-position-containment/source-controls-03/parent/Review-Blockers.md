# Bongo Planet — controls03 source review blockers

Candidate 3e44f930577ca9ace6c0a965a23ee93b5ccce609fa657552e1b916ef8ac92453 passed eleven pure controls and typechecks but is **not source-ready for actual execution**.

Independent review found per-assert/OSC/probe operation IPC can exceed the 1024-message unacknowledged cap during a healthy synchronous analysis loop, before ACK callbacks run. Roughly 21 operation messages per position row means more than 49 rows can provoke this diagnostic-induced failure. Existing pure controls did not cover a normal maximum synchronous burst. No actual run occurred.

Both agent and reviewer also identified uncaught parent output/sample file-I/O exceptions in event callbacks, which could escape bounded cleanup. Root authorized a source-only correction. Controls03 exact source and check records remain unchanged. The later corrected candidate must retain bounded operation summaries without adding yields to the original loops, test a normal synchronous burst, and catch output/sample I/O failures while continuing cleanup.
