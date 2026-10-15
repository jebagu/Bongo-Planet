import datetime
import json
import pathlib
import subprocess
import time

directory = pathlib.Path(__file__).resolve().parent
target = directory / 'partial-toc.xml'
if target.exists() or (directory / 'toc-export.json').exists():
    raise SystemExit('Refusing a second TOC export')
arguments = ['/usr/bin/xcrun', 'xctrace', 'export', '--input', str(directory / 'raw.trace'), '--toc', '--output', str(target)]
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
start = time.monotonic()
process = subprocess.Popen(arguments, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
timeout = False
try:
    stdout, stderr = process.communicate(timeout=15)
except subprocess.TimeoutExpired:
    timeout = True
    process.terminate()
    try:
        stdout, stderr = process.communicate(timeout=1)
    except subprocess.TimeoutExpired:
        process.kill()
        stdout, stderr = process.communicate(timeout=1)
result = {'argv': arguments, 'pid': process.pid, 'startedUtc': started,
          'endedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'elapsedWallSeconds': time.monotonic()-start,
          'exitCode': process.returncode, 'stdout': stdout, 'stderr': stderr, 'timedOut': timeout,
          'ownedExportProcessExited': process.poll() is not None, 'collectionRemainsFailed': True,
          'newRecording': False, 'settingsChanged': False, 'outputExists': target.exists()}
with (directory / 'toc-export.json').open('x') as file:
    json.dump(result, file, indent=2)
    file.write('\n')
print(json.dumps(result, indent=2))
raise SystemExit(0 if process.returncode == 0 and not timeout else 1)
