#!/usr/bin/env python3
"""Source-prepared, single-run idle collector diagnostic. Requires explicit run GO."""
import argparse
import datetime
import json
import os
import pathlib
import select
import shutil
import signal
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'evidence/step-09/native-scheduling-diagnostic/system-trace-capability/finalization-diagnostic/attempt-01'
IDLE = r"""
const {Worker,isMainThread,parentPort,threadId}=require('node:worker_threads');
if(isMainThread){
 const worker=new Worker(__filename,{name:'BPFinalizeIdle'}); let closing=false;
 worker.on('message',m=>console.log(JSON.stringify({...m,pid:process.pid,node:process.version})));
 worker.on('error',e=>{console.error(String(e));process.exitCode=1;});
 worker.on('exit',code=>{console.log(JSON.stringify({type:'worker-exit',code}));if(!closing)process.exitCode=1;});
 process.on('SIGTERM',()=>{closing=true;worker.postMessage('close');});
}else{
 const timer=setInterval(()=>{},60000);
 parentPort.on('message',m=>{if(m==='close'){clearInterval(timer);parentPort.close();}});
 parentPort.postMessage({type:'ready',threadId,requestedName:'BPFinalizeIdle',limitation:'Node threadId is not a Mach thread identifier'});
}
"""


def utc():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def save(path, value):
    with path.open('x') as stream:
        stream.write(value if isinstance(value, str) else json.dumps(value, indent=2) + '\n')


class Diagnostic:
    def __init__(self):
        self.start = time.monotonic()
        self.hard_end = self.start + 75
        self.report = {'startedUtc': utc(), 'limits': {'hardWallSeconds': 75,
            'collectorLaunchBudgetSeconds': 45, 'captureSeconds': 5,
            'sampleDecisionElapsedSeconds': 20, 'sampleDurationSeconds': 1,
            'streamBytesPerProcess': 262144, 'eventsBytes': 1048576,
            'sampleFileBytes': 2097152, 'metadataObservations': 38,
            'inventoryBytes': 1048576, 'traceEntriesPerObservation': 2048},
            'failures': [], 'ownership': {}, 'processes': {},
            'noProductWorkload': True, 'sudoOrSettingsChanges': False}
        self.events = (OUT / 'events.jsonl').open('x')
        self.event_bytes = 0
        self.children = {}
        self.stream_bytes = {}
        self.tail = ''
        self.saving_at = None
        self.trace = None
        self.sample = None
        self.idle = None
        self.observations = 0
        self.event_io_failed = False
        self.idle_tail = ''

    def event(self, kind, **fields):
        if self.event_io_failed:
            return
        row = {'utc': utc(), 'elapsedSeconds': time.monotonic() - self.start,
               'kind': kind, **fields}
        line = json.dumps(row) + '\n'
        count = len(line.encode())
        if self.event_bytes + count > 1048576:
            if not self.report.get('eventsTruncated'):
                self.report['eventsTruncated'] = True
                self.report['failures'].append('Event metadata cap exceeded; cleanup continues, no retry')
            return
        try:
            self.events.write(line)
            self.events.flush()
            self.event_bytes += count
        except OSError as error:
            self.event_io_failed = True
            self.report['failures'].append(f'Event log I/O failed; cleanup continues: {error}')

    def launch(self, name, argv):
        process = subprocess.Popen(argv, cwd=ROOT, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, start_new_session=True)
        self.children[name] = process
        self.report['processes'][name] = {'argv': argv, 'pid': process.pid,
                                         'startedUtc': utc()}
        for stream in [process.stdout, process.stderr]:
            os.set_blocking(stream.fileno(), False)
        self.event('launch', name=name, pid=process.pid, argv=argv)
        return process

    def drain(self):
        for name, process in self.children.items():
            for channel in ['stdout', 'stderr']:
                stream = getattr(process, channel)
                while select.select([stream], [], [], 0)[0]:
                    data = os.read(stream.fileno(), 4096)
                    if not data:
                        break
                    count = self.stream_bytes.get(name, 0) + len(data)
                    self.stream_bytes[name] = count
                    if count > 262144:
                        raise RuntimeError(f'{name} stream cap exceeded')
                    text = data.decode('utf-8', errors='replace')
                    self.event('stream', name=name, channel=channel, text=text)
                    if name == 'idle' and channel == 'stdout':
                        self.idle_tail += text
                        while '\n' in self.idle_tail:
                            line, self.idle_tail = self.idle_tail.split('\n', 1)
                            try:
                                row = json.loads(line)
                            except json.JSONDecodeError:
                                continue
                            if row.get('type') == 'worker-exit':
                                self.report['idleWorkerExit'] = row
                        self.idle_tail = self.idle_tail[-8192:]
                    if name == 'collector' and channel == 'stdout':
                        self.tail = (self.tail + text)[-4096:]
                        for phase, marker in [('recording', 'Starting recording'),
                                              ('recording-completed', 'Recording completed'),
                                              ('saving', 'Saving output file')]:
                            if marker in self.tail and phase not in self.report:
                                self.report[phase] = {'utc': utc(), 'collectorElapsedSeconds': time.monotonic() - self.trace_start}
                                self.event('phase-observed', phase=phase, **self.report[phase])
                                if phase == 'saving':
                                    self.saving_at = time.monotonic()

    def inventory(self):
        try:
            return self._inventory()
        except Exception as error:
            self.report['failures'].append(f'Ownership inventory unavailable: {error}')
            self.event('inventory-unavailable', reason=str(error))
            return None

    def _inventory(self):
        # Only comm, not private command arguments. Retain only owned lineage.
        argv = ['/bin/ps', '-axo', 'pid=,ppid=,pgid=,lstart=,state=,comm=']
        process = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            stdout, stderr = process.communicate(timeout=min(.4, max(.01, self.hard_end - time.monotonic())))
        except subprocess.TimeoutExpired:
            process.kill(); process.communicate(timeout=.4)
            self.event('inventory-unavailable', reason='bounded ps timeout', pid=process.pid)
            return None
        if process.returncode or len(stdout) + len(stderr) > 1048576:
            self.event('inventory-unavailable', reason='ps error/output cap', exitCode=process.returncode)
            return None
        rows = {}
        for line in stdout.decode(errors='replace').splitlines():
            fields = line.split(None, 9)
            if len(fields) != 10:
                continue
            pid, ppid, pgid = map(int, fields[:3])
            rows[pid] = {'pid': pid, 'ppid': ppid, 'pgid': pgid,
                         'startIdentity': ' '.join(fields[3:8]), 'state': fields[8], 'comm': fields[9]}
        owned = {p.pid for p in self.children.values() if p.poll() is None}
        owned |= {int(pid) for pid, prior in self.report['ownership'].items()
                  if int(pid) in rows and rows[int(pid)]['startIdentity'] == prior['startIdentity']}
        changed = True
        while changed:
            added = {pid for pid, row in rows.items() if row['ppid'] in owned}
            changed = not added.issubset(owned); owned |= added
        scoped = [row for pid, row in rows.items() if pid in owned]
        for row in scoped:
            previous = self.report['ownership'].get(str(row['pid']))
            if previous and previous['startIdentity'] != row['startIdentity']:
                self.report['failures'].append('Owned PID start identity changed; no signal/sample permitted')
                continue
            self.report['ownership'][str(row['pid'])] = row
        return [row for row in scoped if self.report['ownership'].get(str(row['pid']), {}).get('startIdentity') == row['startIdentity']]

    def growth(self):
        begun = time.monotonic(); count = 0; size = 0; truncated = False
        target = OUT / 'raw.trace'
        if target.exists():
            for directory, dirs, files in os.walk(target, followlinks=False):
                if time.monotonic() - begun > .05:
                    truncated = True; break
                dirs[:] = [d for d in dirs if not (pathlib.Path(directory) / d).is_symlink()]
                for name in files:
                    path = pathlib.Path(directory) / name
                    if count >= 2048 or time.monotonic() - begun > .05:
                        truncated = True; break
                    try:
                        stat = path.lstat()
                        if not path.is_symlink():
                            count += 1; size += stat.st_size
                    except FileNotFoundError:
                        pass
                if truncated:
                    break
        return {'fileCount': count, 'summedFileBytes': size, 'truncated': truncated,
                'observationSeconds': time.monotonic() - begun,
                'scope': 'metadata only; file growth is activity, not proof of useful finalization'}

    def observe(self):
        if self.observations >= 38:
            raise RuntimeError('Metadata observation cap exceeded')
        self.observations += 1
        self.event('observation', ownedProcesses=self.inventory(), traceGrowth=self.growth())

    def sample_once(self):
        rows = self.inventory()
        row = next((r for r in (rows or []) if r['pid'] == self.trace.pid), None)
        valid = row and pathlib.Path(row['comm']).name in ['xctrace', 'xcrun']
        decision = {'elapsed': time.monotonic() - self.trace_start,
                    'savingObserved': self.saving_at is not None,
                    'collectorActive': self.trace.poll() is None,
                    'collectorIdentity': row, 'identityConfirmed': bool(valid)}
        self.event('sample-decision', **decision)
        if not valid or self.saving_at is None or self.trace.poll() is not None:
            self.report['sampleSkipped'] = decision
            return
        self.sample_start = time.monotonic()
        self.sample = self.launch('sample', ['/usr/bin/sample', str(self.trace.pid), '1', '1',
                                           '-file', str(OUT / 'collector-sample.txt')])

    def terminate_owned(self):
        # Never broad kill or signal ambient processes. Every descendant signal
        # requires a current PID/start match against prior observed owned lineage.
        for sig, wait in [(signal.SIGINT, 1), (signal.SIGTERM, 2), (signal.SIGKILL, 1)]:
            rows = self.inventory()
            if rows is not None:
                for row in reversed(rows):
                    if row['pid'] in [p.pid for p in self.children.values() if p.poll() is not None]:
                        continue
                    self.event('cleanup-signal', pid=row['pid'], startIdentity=row['startIdentity'], signal=int(sig))
                    try: os.kill(row['pid'], sig)
                    except ProcessLookupError: pass
                    except OSError as error: self.report['failures'].append(f'Owned cleanup signal failed: {error}')
            for name, process in self.children.items():
                if process.poll() is None:
                    # Direct unreaped Popen child identity remains owned even if ps failed.
                    try: process.send_signal(sig)
                    except OSError as error: self.report['failures'].append(f'{name} direct cleanup signal failed: {error}')
            end = min(time.monotonic() + wait, self.hard_end - .5)
            while time.monotonic() < end:
                try: self.drain()
                except Exception as error: self.report['failures'].append(str(error)); break
                time.sleep(.05)
        for name, process in self.children.items():
            try: process.wait(timeout=max(.01, min(.3, self.hard_end - time.monotonic())))
            except subprocess.TimeoutExpired: self.report['failures'].append(f'{name} exit unresolved at hard deadline')
            self.report['processes'][name]['exitCode'] = process.poll()
        try: self.drain()
        except Exception as error: self.report['failures'].append(f'Final output drain failed: {error}')
        if self.idle is not None and self.idle.returncode != 0:
            self.report['failures'].append('Owned idle Node did not exit0')
        if self.idle is not None and self.report.get('idleWorkerExit', {}).get('code') != 0:
            self.report['failures'].append('Owned idle Worker exit0 acknowledgment missing/nonzero')
        remaining = self.inventory() if time.monotonic() < self.hard_end - .5 else None
        self.report['cleanup'] = {'directChildrenExited': all(p.poll() is not None for p in self.children.values()),
            'remainingObservedOwnedProcesses': remaining,
            'inventoryComplete': remaining is not None,
            'limitation': 'Observed descendant lineage only; an unobserved detached helper is not claimed absent',
            'productionServicesTouched': False}
        if remaining is None or remaining:
            self.report['failures'].append('Owned descendant cleanup unresolved; report to lead, no retry')

    def run(self):
        try:
            node = shutil.which('node')
            if not node:
                raise RuntimeError('Node unavailable')
            self.idle = self.launch('idle', [node, str(OUT / 'idle-node.cjs')])
            ready_end = time.monotonic() + 5
            ready = b''
            while time.monotonic() < ready_end:
                if select.select([self.idle.stdout], [], [], .05)[0]:
                    ready += os.read(self.idle.stdout.fileno(), 4096)
                    if len(ready) > 8192: raise RuntimeError('Idle readiness output cap')
                    if b'\n' in ready: break
            message = json.loads(ready.decode())
            if message.get('type') != 'ready' or message.get('pid') != self.idle.pid:
                raise RuntimeError('Idle readiness identity mismatch')
            self.event('idle-ready', message=message)
            self.trace_start = time.monotonic()
            self.trace = self.launch('collector', ['/usr/bin/xcrun', 'xctrace', 'record', '--template',
                'System Trace', '--attach', str(self.idle.pid), '--time-limit', '5s', '--output', str(OUT / 'raw.trace')])
            next_observe = self.trace_start; sampled = False; stage = 0
            while self.trace.poll() is None:
                now = time.monotonic(); elapsed = now - self.trace_start
                if now >= self.hard_end - 7: raise RuntimeError('Hard wall cleanup reserve reached')
                self.drain()
                if now >= next_observe:
                    self.observe(); next_observe = now + 2
                if elapsed >= 20 and not sampled:
                    sampled = True; self.sample_once()
                if self.sample and self.sample.poll() is None:
                    path = OUT / 'collector-sample.txt'
                    if time.monotonic() - self.sample_start >= 4 or (path.exists() and path.stat().st_size > 2097152):
                        self.sample.kill(); self.report['failures'].append('Owned sample exceeded 4s/2MiB bound')
                for index, (threshold, sig) in enumerate([(45, signal.SIGINT), (55, signal.SIGTERM), (58, signal.SIGKILL)]):
                    if elapsed >= threshold and stage <= index:
                        self.event('collector-budget-signal', collectorElapsedSeconds=elapsed, signal=int(sig))
                        if index == 0: self.report['failures'].append('Original 45s collector-command budget exceeded; deadlock/permission cause unproven')
                        self.trace.send_signal(sig); stage = index + 1
                time.sleep(.05)
            self.drain()
            self.event('collector-exit', exitCode=self.trace.returncode)
            if self.trace.returncode:
                self.report['failures'].append('Collector nonzero exit; no recording/export retry')
            # No export in this experiment. Preserve successful or partial trace.
            if self.sample and self.sample.poll() is None:
                remaining = min(self.sample_start + 4 - time.monotonic(),
                                self.hard_end - time.monotonic() - 7)
                if remaining <= 0:
                    self.sample.kill()
                    self.report['failures'].append('Owned sample exceeded absolute 4s command bound')
                else:
                    try:
                        self.sample.wait(timeout=remaining)
                    except subprocess.TimeoutExpired:
                        self.sample.kill()
                        self.report['failures'].append('Owned sample exceeded absolute 4s command bound')
            if self.sample and self.sample.returncode:
                self.report['failures'].append('Collector sample failed; retain raw permission/tool error without bypass')
            sample_path = OUT / 'collector-sample.txt'
            if sample_path.exists() and sample_path.stat().st_size > 2097152:
                self.report['failures'].append('Sample file exceeded detected 2MiB bound; retain original, no silent truncation')
            if self.idle.poll() is None:
                self.idle.terminate()
                self.idle.wait(timeout=2)
        except Exception as error:
            self.report['failures'].append(str(error))
        finally:
            self.terminate_owned()
            self.report['endedUtc'] = utc()
            self.report['elapsedSeconds'] = time.monotonic() - self.start
            self.report['traceGrowthFinal'] = self.growth()
            try: self.events.close()
            except OSError as error: self.report['failures'].append(f'Event log close failed: {error}')
            save(OUT / 'result.json', self.report)
        return 1 if self.report['failures'] else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['run'])
    parser.parse_args()
    # Exclusive directory is a permanent single-invocation marker, even on failure.
    OUT.mkdir(parents=True, exist_ok=False)
    save(OUT / 'diagnostic-source.py', pathlib.Path(__file__).read_text())
    save(OUT / 'idle-node.cjs', IDLE)
    save(OUT / 'invocation.json', {'utc': utc(), 'explicitRun': True,
                                 'scope': 'Owned idle collector finalization only; intrusive sample is not musical qualification'})
    raise SystemExit(Diagnostic().run())


if __name__ == '__main__':
    main()
