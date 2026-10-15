"""Bongo Planet: one approved metadata acquisition, with owned cleanup.

The metadata helper creates no child, proxy or browser processes. The empty
controller-created claim journal and observed ancestry remain fail-closed guards.
No command runs on import. Wall/RSS limits are sampled cooperative observations.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import time


def parse_inventory(text):
    rows = {}
    for line in text.splitlines():
        fields = line.split(None, 9)
        if len(fields) != 10:
            raise ValueError("Unparseable process inventory")
        pid, parent, group = map(int, fields[:3])
        rows[pid] = {"pid": pid, "parent": parent, "group": group,
                     "birth": " ".join(fields[3:8]), "stat": fields[8],
                     "command": fields[9][:512]}
    return rows


def same_birth(a, b):
    return a["pid"] == b["pid"] and a["birth"] == b["birth"]


def discover(rows, owned):
    """Only descend through a present parent with its retained birth signature."""
    result = dict(owned)
    changed = True
    while changed:
        changed = False
        for pid, row in rows.items():
            parent = result.get(row["parent"])
            current_parent = rows.get(row["parent"])
            if pid not in result and parent and current_parent and same_birth(parent, current_parent):
                result[pid] = row
                changed = True
    if len(result) > 256:
        raise ValueError("Owned process inventory cap")
    return result


def inventory():
    result = subprocess.run(["ps", "-axo", "pid=,ppid=,pgid=,lstart=,stat=,args="],
                            capture_output=True, text=True, check=True, timeout=1)
    return parse_inventory(result.stdout)


def live_owned(rows, owned):
    return {pid: row for pid, row in rows.items()
            if pid in owned and same_birth(row, owned[pid]) and not row["stat"].startswith("Z")}


def validate_rss(rss_kib):
    if type(rss_kib) is not int or rss_kib <= 0 or rss_kib > 256 * 1024:
        raise ValueError("Observed RSS unavailable or above 256MiB")
    return rss_kib


def read_rss(pid):
    result = subprocess.run(["ps", "-p", str(pid), "-o", "rss="],
                            capture_output=True, text=True, timeout=1)
    if result.returncode != 0 or not result.stdout.strip():
        return None
    return int(result.stdout.strip())


def run(go_path, journal_path):
    go_bytes = go_path.read_bytes()
    go = json.loads(go_bytes)
    if go.get("authorization") != "Root authorizes exactly one metadata acquisition":
        raise ValueError("Exact root GO required")
    command = go["command"]
    env = os.environ.copy()
    env.update(go["environment"])
    claims_path = Path(env["BONGO_MOVEMENT_RESOURCE_JOURNAL"])
    output = Path(env["BONGO_METADATA_EVIDENCE_DIR"])
    if any(p.exists() for p in [journal_path, claims_path, output]):
        raise ValueError("Exclusive paths already exist")
    expected = ["python3", "scripts/coupled-onset-metadata-preflight.py", "--run", "--output-dir", str(output)]
    if command != expected or not output.is_absolute():
        raise ValueError("Unexpected command or nonabsolute output")
    for entry in go["sourceBindings"]:
        data = Path(entry["path"]).read_bytes()
        if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
            raise ValueError("Source binding mismatch: " + entry["path"])
    claims_path.open("x").close()
    started = time.monotonic()
    record = {"startedUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "goSha256": hashlib.sha256(go_bytes).hexdigest(), "command": command,
              "environment": go["environment"], "mainWallSeconds": 125,
              "totalWallSeconds": 135, "forcedCleanup": False, "errors": [],
              "claims": [], "owned": {}, "rssSamples": [], "maximumObservedRssKiB": 0}
    with journal_path.open("x") as file:
        file.write(json.dumps(record, indent=2) + "\n")
    child = None
    owned = {}
    claim_count = 0
    claimed_lines = []

    def persist():
        record["owned"] = {str(pid): row for pid, row in owned.items()}
        journal_path.write_text(json.dumps(record, indent=2) + "\n")

    def observe(publish=True):
        nonlocal owned, claim_count
        # Read claims first: absence cannot be judged from an older inventory.
        claim_read_error = None
        try:
            data = claims_path.read_bytes()
        except OSError as error:
            # Claim I/O cannot suppress ownership discovery before signaling.
            claim_read_error = error
            data = b""
        rows = inventory()
        if child.returncode is not None:
            owned.pop(child.pid, None)
            if "mainIdentity" not in record:
                raise ValueError("Main exited before ownership identity was observed")
        elif child.pid not in owned:
            if child.pid not in rows:
                raise ValueError("Unreaped main missing from inventory")
            else:
                # No poll/wait has reaped this Popen; its PID cannot yet be
                # reused. Keep the exact first identity before any reap.
                owned[child.pid] = rows[child.pid]
                record["mainIdentity"] = rows[child.pid]
        owned = discover(rows, owned)
        if claim_read_error is not None:
            raise claim_read_error
        if len(data) > 8192:
            raise ValueError("PID claim byte cap")
        complete = data.split(b"\n")[:-1]
        if len(complete) > 8:
            raise ValueError("PID claim count cap")
        if complete[:claim_count] != claimed_lines:
            raise ValueError("PID claim prefix changed or shortened")
        for raw in complete[claim_count:]:
            claim = json.loads(raw)
            if set(claim) != {"pid", "parentPid", "kind"} or claim["kind"] not in ("proxy", "browser-server"):
                raise ValueError("Invalid PID claim")
            if type(claim["pid"]) is not int or type(claim["parentPid"]) is not int or claim["pid"] <= 1:
                raise ValueError("Invalid PID value")
            row = rows.get(claim["pid"])
            parent = rows.get(claim["parentPid"])
            if row:
                if row["parent"] != claim["parentPid"] or not parent or parent["pid"] not in owned or not same_birth(parent, owned[parent["pid"]]):
                    raise ValueError("PID claim lacks live owned ancestry")
                owned[row["pid"]] = row
            record["claims"].append({**claim, "observed": row, "alreadyAbsent": row is None})
            claimed_lines.append(raw)
            claim_count += 1
        if publish and child.returncode is None:
            rss = read_rss(child.pid)
            if rss is None:
                if child.poll() is None:
                    raise ValueError("Live child RSS unknown")
            else:
                if len(record["rssSamples"]) >= 2048:
                    raise ValueError("RSS observation cap")
                record["rssSamples"].append({"elapsedSeconds": time.monotonic() - started, "rssKiB": rss})
                record["maximumObservedRssKiB"] = max(record["maximumObservedRssKiB"], rss)
                validate_rss(rss)
        if publish:
            persist()
        return rows

    def cleanup_inventory():
        # A malformed helper journal must never suppress cleanup of previously
        # verified ownership. Claims were attempted separately before cleanup.
        nonlocal owned
        rows = inventory()
        if child.returncode is not None:
            owned.pop(child.pid, None)
        owned = discover(rows, owned)
        return rows

    try:
        child = subprocess.Popen(command, env=env, start_new_session=True)
        record["mainPid"] = record["mainGroup"] = child.pid
        persist()
        while child.poll() is None:
            observe()
            if time.monotonic() - started >= 125:
                raise TimeoutError("Main acquisition wall allowance exhausted")
            time.sleep(.1)
        record["childExitCode"] = child.returncode
        rows = observe()
        grace = time.monotonic()
        while live_owned(rows, owned) and time.monotonic() - grace < 1:
            time.sleep(.1)
            rows = observe()
        if live_owned(rows, owned):
            raise ValueError("Owned processes remain after terminal result")
        if claims_path.read_bytes() and not claims_path.read_bytes().endswith(b"\n"):
            raise ValueError("Incomplete final PID claim")
        if child.returncode == 0:
            kinds = [claim["kind"] for claim in record["claims"]]
            if kinds.count("proxy") != 0 or kinds.count("browser-server") != 0:
                raise ValueError("Successful metadata run has unexpected process resource claims")
    except BaseException as error:
        record["errors"].append(type(error).__name__ + ": " + str(error))
        record["forcedCleanup"] = child is not None
    finally:
        if child is not None and record["forcedCleanup"]:
            # The Popen object retains the exact unreaped main. Detached roles
            # and discovered descendants require a current matching birth row.
            try:
                observe(publish=False)
            except Exception as error:
                record["errors"].append("Precleanup inventory: " + str(error))
            if child.poll() is None:
                try:
                    os.killpg(child.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                except OSError as error:
                    record["errors"].append("Main TERM: " + str(error))
            for sig, grace_seconds in [(signal.SIGTERM, 3), (signal.SIGKILL, 2)]:
                deadline = time.monotonic() + grace_seconds
                while time.monotonic() < deadline:
                    try:
                        rows = cleanup_inventory()
                        live = live_owned(rows, owned)
                        for pid in live:
                            try:
                                os.kill(pid, sig)
                            except ProcessLookupError:
                                pass
                            except OSError as error:
                                record["errors"].append("Owned signal: " + str(error))
                        if not live and child.poll() is not None:
                            break
                    except Exception as error:
                        record["errors"].append("Cleanup inventory: " + str(error))
                        break
                    time.sleep(.1)
            if child.poll() is None:
                try:
                    child.kill()
                except OSError as error:
                    record["errors"].append("Main KILL: " + str(error))
            try:
                record["childExitCode"] = child.wait(timeout=1)
            except subprocess.TimeoutExpired:
                record["errors"].append("Main reap incomplete")
        try:
            rows = inventory()
            if child is not None and child.returncode is not None:
                owned.pop(child.pid, None)
            record["remainingOwned"] = live_owned(rows, owned)
        except Exception as error:
            record["remainingOwned"] = None
            record["errors"].append("Final inventory: " + str(error))
        record["elapsedSeconds"] = time.monotonic() - started
        record["endedUtc"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if record["elapsedSeconds"] > 135:
            record["errors"].append("Total controller wall allowance exceeded")
        try:
            persist()
        except OSError as error:
            record["errors"].append("Final journal write: " + str(error))
    print(json.dumps({k: record.get(k) for k in ["childExitCode", "forcedCleanup", "elapsedSeconds", "errors", "remainingOwned"]}, indent=2))
    return 1 if record["forcedCleanup"] or record["errors"] or record["remainingOwned"] else record.get("childExitCode", 1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--go", required=True, type=Path)
    parser.add_argument("--journal", required=True, type=Path)
    args = parser.parse_args()
    raise SystemExit(run(args.go, args.journal))
