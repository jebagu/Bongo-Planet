import datetime
import json
import pathlib
import selectors
import subprocess
import time

directory = pathlib.Path(__file__).resolve().parent
result_path = directory / 'query-result.json'
if result_path.exists():
    raise SystemExit('Query already retained; do not rerun')
arguments = ['/usr/bin/log', 'show', '--start', '2026-10-11 22:27:11+0000', '--end', '2026-10-11 22:28:10+0000',
             '--timezone', 'UTC', '--style', 'json', '--info', '--debug', '--no-pager',
             '--predicate', '(processID == 98024 OR processID == 98034)']
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
begin = time.monotonic()
process = subprocess.Popen(arguments, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
selector = selectors.DefaultSelector()
selector.register(process.stdout, selectors.EVENT_READ, 'stdout')
selector.register(process.stderr, selectors.EVENT_READ, 'stderr')
parts = {'stdout': bytearray(), 'stderr': bytearray()}
limit = 1024 * 1024
reason = None
while selector.get_map():
    if time.monotonic() - begin > 12:
        reason = '12-second read deadline; cleanup included within15s budget'
        break
    for key, _ in selector.select(timeout=0.05):
        chunk = key.fileobj.read1(16384)
        if not chunk:
            selector.unregister(key.fileobj)
            continue
        remaining = limit - sum(len(value) for value in parts.values())
        parts[key.data].extend(chunk[:remaining])
        if len(chunk) > remaining:
            reason = '1MiB combined stdout/stderr cap reached'
            break
    if reason:
        break
if reason and process.poll() is None:
    process.terminate()
try:
    process.wait(timeout=1)
except subprocess.TimeoutExpired:
    process.kill()
    process.wait(timeout=1)
selector.close()
result = {'argv': arguments, 'pid': process.pid, 'startedUtc': started,
          'endedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'elapsedWallSeconds': time.monotonic()-begin,
          'exitCode': process.returncode, 'stdout': parts['stdout'].decode(errors='replace'),
          'stderr': parts['stderr'].decode(errors='replace'), 'limitReason': reason,
          'retainedOutputBytes': sum(len(value) for value in parts.values()), 'ownedQueryProcessExited': process.poll() is not None,
          'predicateScope': 'Only original xctrace98024 and childDTServiceHub98034; no broad product/user logs'}
with result_path.open('x') as file:
    json.dump(result, file, indent=2)
    file.write('\n')
print(json.dumps({key: value for key, value in result.items() if key != 'stdout'}, indent=2))
