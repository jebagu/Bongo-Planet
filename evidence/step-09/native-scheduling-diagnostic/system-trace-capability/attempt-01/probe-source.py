#!/usr/bin/env python3
"""One bounded, explicitly invoked System Trace probe of an owned idle process."""
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
DESTINATION = ROOT / "evidence/step-09/native-scheduling-diagnostic/system-trace-capability/attempt-01"
IDLE_SOURCE = r"""
const {Worker,isMainThread,parentPort,threadId}=require('node:worker_threads');
if(isMainThread){
 const worker=new Worker(__filename,{name:'BPTraceIdle'});
 const timer=setInterval(()=>{},60000);
 let closing=false;
 worker.on('message',message=>{process.stdout.write(JSON.stringify({...message,pid:process.pid,node:process.version})+'\n');});
 worker.on('error',error=>{process.stderr.write(String(error)+'\n');process.exitCode=1;clearInterval(timer);});
 worker.on('exit',code=>{process.stdout.write(JSON.stringify({type:'worker-exit',code,pid:process.pid})+'\n');clearInterval(timer);if(!closing)process.exitCode=1;});
 process.on('SIGTERM',()=>{closing=true;worker.postMessage('close');});
}else{
 const timer=setInterval(()=>{},1000);
 parentPort.on('message',message=>{if(message==='close'){clearInterval(timer);parentPort.close();}});
 parentPort.postMessage({type:'ready',threadId,requestedWorkerName:'BPTraceIdle',observedHrNs:process.hrtime.bigint().toString(),limitation:'Node threadId is not a Mach thread identifier'});
}
"""


def save(name, value):
    contents = json.dumps(value, indent=2) + "\n" if not isinstance(value, str) else value
    with (DESTINATION / name).open("x") as target:
        target.write(contents)


def utc():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def command(arguments, timeout=30):
    begun = utc()
    try:
        completed = subprocess.run(arguments, cwd=ROOT, text=True, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, timeout=timeout)
        return {"argv": arguments, "startedUtc": begun, "endedUtc": utc(),
                "exitCode": completed.returncode, "stdout": completed.stdout, "stderr": completed.stderr}
    except subprocess.TimeoutExpired as error:
        return {"argv": arguments, "startedUtc": begun, "endedUtc": utc(), "timeoutSeconds": timeout,
                "stdout": str(error.stdout or ""), "stderr": str(error.stderr or ""), "failure": "Timed out; no retry"}


def prepare():
    DESTINATION.mkdir(parents=True, exist_ok=False)
    save("probe-source.py", pathlib.Path(__file__).read_text())
    save("idle-node.cjs", IDLE_SOURCE)
    commands = [["/usr/bin/sw_vers"], ["/usr/bin/uname", "-a"], ["/usr/bin/xcode-select", "-p"],
                ["/usr/bin/xcrun", "xctrace", "version"], ["/usr/bin/xcrun", "xctrace", "list", "templates"]]
    inventory = {"createdUtc": utc(), "nodeExecutable": shutil.which("node"),
                 "commands": [command(arguments) for arguments in commands],
                 "noProfilerRecorded": True, "runCount": 0}
    if inventory["nodeExecutable"]:
        inventory["commands"].append(command([inventory["nodeExecutable"], "--version"]))
    inventory["systemTraceListed"] = any("System Trace" in item.get("stdout", "") for item in inventory["commands"][-2:])
    save("inventory.json", inventory)
    print(DESTINATION)


def run():
    inventory = json.loads((DESTINATION / "inventory.json").read_text())
    # Exclusive marker prevents a second recording, including after failure.
    save("recording-invocation.json", {"dateUtc": utc(), "oneRecordingOnly": True,
                                      "durationSeconds": 5, "scope": "Owned idle Node + idle Worker; no product workload"})
    if not inventory.get("nodeExecutable") or not inventory.get("systemTraceListed"):
        save("result.json", {"failure": "Preparation lacks Node or System Trace template; no recording attempted"})
        raise SystemExit(1)
    idle_argv = [inventory["nodeExecutable"], str(DESTINATION / "idle-node.cjs")]
    idle = subprocess.Popen(idle_argv, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    report = {"startedUtc": utc(), "idle": {"argv": idle_argv, "pid": idle.pid}, "failures": [],
              "systemSettingsChanged": False, "sudoUsed": False, "noPromptFlagUsed": False}
    trace = None
    try:
        assert idle.stdout is not None
        if not select.select([idle.stdout], [], [], 5)[0]:
            raise RuntimeError("Owned idle process did not become ready")
        ready_line = idle.stdout.readline()
        ready = json.loads(ready_line)
        if ready.get("type") != "ready" or ready.get("pid") != idle.pid:
            raise RuntimeError("Owned idle readiness identity mismatch")
        report["idle"]["ready"] = ready
        trace_argv = ["/usr/bin/xcrun", "xctrace", "record", "--template", "System Trace", "--attach", str(idle.pid),
                      "--time-limit", "5s", "--output", str(DESTINATION / "raw.trace")]
        report["recording"] = {"argv": trace_argv, "startedUtc": utc()}
        trace = subprocess.Popen(trace_argv, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 start_new_session=True)
        report["recording"]["pid"] = trace.pid
        try:
            stdout, stderr = trace.communicate(timeout=45)
        except subprocess.TimeoutExpired:
            report["failures"].append("Recording timed out; permission prompt or collector failure unresolved; no retry")
            trace.send_signal(signal.SIGINT)
            try:
                stdout, stderr = trace.communicate(timeout=10)
            except subprocess.TimeoutExpired:
                trace.terminate()
                try:
                    stdout, stderr = trace.communicate(timeout=3)
                except subprocess.TimeoutExpired:
                    trace.kill()
                    stdout, stderr = trace.communicate(timeout=3)
        report["recording"].update({"endedUtc": utc(), "exitCode": trace.returncode, "stdout": stdout, "stderr": stderr})
        if trace.returncode != 0:
            report["failures"].append("System Trace recording failed; no retry or permission bypass")
        else:
            export = command(["/usr/bin/xcrun", "xctrace", "export", "--input", str(DESTINATION / "raw.trace"),
                              "--toc", "--output", str(DESTINATION / "toc.xml")])
            report["tableOfContentsExport"] = export
            if export.get("exitCode") != 0:
                report["failures"].append("Trace TOC export failed; scheduler coverage remains unverified")
    except Exception as error:
        report["failures"].append(str(error))
    finally:
        if trace is not None and trace.poll() is None:
            trace.terminate()
            try:
                trace.wait(timeout=3)
            except subprocess.TimeoutExpired:
                trace.kill()
                trace.wait(timeout=3)
            report["failures"].append("Owned trace collector required final forced cleanup")
        if idle.poll() is None:
            idle.terminate()
        try:
            idle_stdout, idle_stderr = idle.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            idle.kill()
            idle_stdout, idle_stderr = idle.communicate(timeout=3)
            report["failures"].append("Owned idle Node required forced termination")
        report["idle"].update({"exitCode": idle.returncode, "remainingStdout": idle_stdout, "stderr": idle_stderr,
                                "exitObserved": idle.poll() is not None})
        if idle.returncode != 0:
            report["failures"].append("Owned idle Node did not exit0")
        report["cleanup"] = {"ownedNodeExited": idle.poll() is not None,
                             "ownedCollectorExited": trace is None or trace.poll() is not None,
                             "productionServicesTouched": False}
        report["endedUtc"] = utc()
        save("result.json", report)
    print(DESTINATION)
    if report["failures"]:
        raise SystemExit(1)


parser = argparse.ArgumentParser()
parser.add_argument("mode", choices=["prepare", "run"])
arguments = parser.parse_args()
if arguments.mode == "prepare":
    prepare()
else:
    run()
