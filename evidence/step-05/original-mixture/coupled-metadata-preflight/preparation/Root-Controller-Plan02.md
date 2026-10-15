# Bongo Planet — metadata controller Source02 correction

Preserve Source01 wrapper/control copies,12-control output, derivation/delta/plan and independent BLOCK. Source02 corrects only M01: RSS observations are retained before classification; missing/nonpositive RSS calls the exact unreaped Popen poll. Terminal observations are labeled unavailable, while unknown/nonpositive live RSS fails. A positive value above256MiB still fails and retains its observed maximum even if the child just exited. Invalid positive shapes remain fail-closed.

Command, fixed125s/135s budgets,256MiB/2048sample allowance, source binding and ownership/discovery/signaling/cleanup remain unchanged. Sampled RSS is not peak-memory proof; helper getrusage remains separate. No actual acquisition or original metadata/PCM scan runs.

The16 pure tests include nine full-observer race simulations: missing/zero/negative RSS for terminal and live children, normal positive terminal RSS, and positive-overbudget terminal/live failure with the raw maximum retained. Every process,inventory,RSS,signal and sleep operation is mocked; existing ownership controls remain. Source review and fresh exclusive root GO precede any actual.
