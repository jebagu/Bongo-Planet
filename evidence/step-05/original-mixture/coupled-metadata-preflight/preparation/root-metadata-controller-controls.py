"""Pure process-table controls. No subprocess, signal, browser or socket runs."""
import importlib.util
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("owned_controller", Path(__file__).with_name("root-metadata-controller.py"))
controller = importlib.util.module_from_spec(spec)
spec.loader.exec_module(controller)


def row(pid, parent, birth="Mon Oct 12 06:15:00 2026", stat="S", group=None):
    return {"pid": pid, "parent": parent, "birth": birth, "stat": stat,
            "group": pid if group is None else group, "command": "fixture"}


class Controls(unittest.TestCase):
    def test_rss_units_boundary_and_unknown_shape(self):
        self.assertEqual(controller.validate_rss(262144), 262144)
        for value in [None, True, False, 0, -1, 262145, 1.0, "1024"]:
            with self.assertRaises(ValueError):
                controller.validate_rss(value)

    def check_rss_race(self, value, terminal, expected_exit):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory); claims=base/"claims.jsonl"; journal=base/"journal.json"; go=base/"go.json"
            go.write_text(json.dumps({"authorization":"Root authorizes exactly one metadata acquisition",
                "command":["python3","scripts/coupled-onset-metadata-preflight.py","--run","--output-dir",str(base/"attempt")],
                "environment":{"BONGO_MOVEMENT_RESOURCE_JOURNAL":str(claims),"BONGO_METADATA_EVIDENCE_DIR":str(base/"attempt")},"sourceBindings":[]}))
            rows={10:row(10,2)}; sampled=False; signals=[]
            class Child:
                pid=10; returncode=None
                def poll(self):
                    if sampled and terminal:
                        self.returncode=0; rows.pop(10,None)
                    return self.returncode
                def kill(self):
                    self.returncode=-9; rows.pop(10,None)
                def wait(self,timeout): return self.returncode
            child=Child()
            def rss(pid):
                nonlocal sampled
                self.assertEqual(pid,10); sampled=True; return value
            def term(pid,sig):
                self.assertEqual(pid,10); signals.append(pid); child.returncode=-15; rows.pop(10,None)
            with patch.object(controller.subprocess,"Popen",return_value=child), \
                 patch.object(controller,"inventory",side_effect=lambda:dict(rows)), \
                 patch.object(controller,"read_rss",side_effect=rss), \
                 patch.object(controller.os,"killpg",side_effect=term), \
                 patch.object(controller.os,"kill",side_effect=term), \
                 patch.object(controller.time,"sleep"), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(controller.run(go,journal),expected_exit)
            result=json.loads(journal.read_text()); self.assertEqual(result["remainingOwned"],{})
            self.assertEqual(result["rssSamples"][0]["rssKiB"],value)
            if expected_exit==0:
                self.assertEqual(signals,[]); self.assertFalse(result["forcedCleanup"]); self.assertEqual(result["errors"],[])
                if value is None or value<=0: self.assertTrue(result["rssSamples"][0]["terminalUnavailable"])
            else:
                self.assertTrue(result["forcedCleanup"]); self.assertTrue(result["errors"])
                if value is not None and value>262144: self.assertEqual(result["maximumObservedRssKiB"],value)

    def test_rss_missing_and_zero_terminal_are_retained(self):
        for value in [None,0,-1]: self.check_rss_race(value,True,0)

    def test_rss_missing_and_zero_live_fail(self):
        for value in [None,0,-1]: self.check_rss_race(value,False,1)

    def test_rss_positive_terminal_succeeds(self):
        self.check_rss_race(1024,True,0)

    def test_rss_positive_over_budget_is_retained_and_fails(self):
        for terminal in [False,True]: self.check_rss_race(262145,terminal,1)

    def test_parse_spaced_command_and_group(self):
        text = "  10  2 10 Mon Oct 12 06:15:00 2026 S /path with spaces --argument\n"
        self.assertEqual(controller.parse_inventory(text)[10], {
            **row(10, 2), "command": "/path with spaces --argument"})

    def test_recursive_descendants_include_detached_group(self):
        rows = {10: row(10, 2), 11: row(11, 10, group=10), 12: row(12, 11), 90: row(90, 2)}
        self.assertEqual(set(controller.discover(rows, {10: rows[10]})), {10, 11, 12})

    def test_reused_parent_birth_does_not_authorize_descendant(self):
        original = row(10, 2)
        current = row(10, 2, birth="Mon Oct 12 06:15:01 2026")
        self.assertEqual(set(controller.discover({10: current, 11: row(11, 10)}, {10: original})), {10})

    def test_absent_parent_does_not_authorize_descendant(self):
        self.assertEqual(set(controller.discover({11: row(11, 10)}, {10: row(10, 2)})), {10})

    def test_zombie_and_reused_pid_are_not_live_targets(self):
        owned = {10: row(10, 2), 11: row(11, 10), 12: row(12, 10)}
        rows = {10: row(10, 2, stat="Z"), 11: row(11, 10, birth="Mon Oct 12 06:15:01 2026"), 12: row(12, 10)}
        self.assertEqual(set(controller.live_owned(rows, owned)), {12})

    def test_malformed_inventory_and_capacity_fail(self):
        with self.assertRaises(ValueError):
            controller.parse_inventory("not a process row")
        with self.assertRaises(ValueError):
            controller.discover({}, {i: row(i, 2) for i in range(257)})

    def check_failed_run_cleanup(self, write_failure=False, fast_exit=False, claim_race=False, claim_read_failure=False):
        # Entire run is simulated: no command, ps, signal, sleep or socket.
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            claims = base / "claims.jsonl"
            journal = base / "controller.json"
            go = base / "go.json"
            go.write_text(json.dumps({
                "authorization": "Root authorizes exactly one metadata acquisition",
                "command": ["python3", "scripts/coupled-onset-metadata-preflight.py", "--run", "--output-dir", str(base / "attempt")],
                "environment": {"BONGO_MOVEMENT_RESOURCE_JOURNAL": str(claims),
                                "BONGO_METADATA_EVIDENCE_DIR": str(base / "attempt")},
                "sourceBindings": []}))
            rows = {10: row(10, 2), 11: row(11, 10), 90: row(90, 2)}
            inventory_count = 0
            signal_calls = []
            class Child:
                pid = 10
                returncode = None
                def poll(self):
                    if claim_race and inventory_count >= 1:
                        self.returncode = 1
                        rows.pop(10, None)
                        rows[11] = row(11, 1)
                    return self.returncode
                def kill(self):
                    self.returncode = -9
                    rows.pop(10, None)
                def wait(self, timeout):
                    return self.returncode
            child = Child()
            if fast_exit:
                child.returncode = 0
                rows[10] = row(10, 2, birth="Mon Oct 12 06:16:00 2026")
                rows[11] = row(11, 10, birth="Mon Oct 12 06:16:00 2026")
            def launch(*args, **kwargs):
                claims.write_bytes(b"" if claim_race else b"invalid json\n")
                return child
            def inventory():
                nonlocal inventory_count
                inventory_count += 1
                if claim_race and inventory_count == 1:
                    # Appended AFTER this inventory has been formed. A reader
                    # using an earlier snapshot must not consume its absence.
                    snapshot = {10: rows[10]}
                    claims.write_text(json.dumps({"pid": 11, "parentPid": 10, "kind": "proxy"}) + "\n")
                    return snapshot
                return dict(rows)
            def group_signal(pid, sig):
                signal_calls.append(('group', pid, sig))
                self.assertEqual(pid, 10)
                child.returncode = -15
                rows.pop(10, None)
            def signal_pid(pid, sig):
                signal_calls.append(('pid', pid, sig))
                self.assertEqual(pid, 11)
                rows.pop(pid, None)
            real_write = Path.write_text
            real_read = Path.read_bytes
            def read(path):
                if claim_read_failure and path == claims:
                    raise OSError("simulated initial claim-read failure")
                return real_read(path)
            def write(path, data, *args, **kwargs):
                if write_failure and path == journal:
                    raise OSError("simulated disk failure")
                return real_write(path, data, *args, **kwargs)
            with patch.object(controller.subprocess, "Popen", side_effect=launch), \
                 patch.object(controller, "inventory", side_effect=inventory), \
                 patch.object(controller, "read_rss", return_value=1024), \
                 patch.object(controller.os, "killpg", side_effect=group_signal), \
                 patch.object(controller.os, "kill", side_effect=signal_pid), \
                 patch.object(controller.time, "sleep"), \
                 patch.object(Path, "read_bytes", read), \
                 patch.object(Path, "write_text", write), contextlib.redirect_stdout(io.StringIO()) as stdout:
                self.assertEqual(controller.run(go, journal), 1)
            result = json.loads(stdout.getvalue())
            self.assertTrue(result["forcedCleanup"])
            self.assertEqual(result["remainingOwned"], {})
            self.assertTrue(result["errors"])
            if fast_exit:
                self.assertEqual(signal_calls, [])
                self.assertEqual(set(rows), {10, 11, 90})
                self.assertTrue(any('before ownership identity' in e for e in result['errors']))
            elif claim_race:
                self.assertEqual(signal_calls, [])
                self.assertEqual(set(rows), {11, 90})
                self.assertTrue(any('lacks live owned ancestry' in e for e in result['errors']))
                retained = json.loads(journal.read_text())
                self.assertEqual(retained['claims'], [])
            else:
                self.assertEqual(set(rows), {90})
                self.assertTrue(any(call[0]=='pid' and call[1]==11 for call in signal_calls))

    def test_malformed_claim_does_not_prevent_owned_cleanup(self):
        self.check_failed_run_cleanup()

    def test_journal_write_failure_does_not_prevent_owned_cleanup(self):
        self.check_failed_run_cleanup(write_failure=True)

    def test_reaped_early_root_replacement_never_authorizes_signals(self):
        self.check_failed_run_cleanup(fast_exit=True)

    def test_post_inventory_claim_is_unresolved_not_silently_absent(self):
        self.check_failed_run_cleanup(claim_race=True)

    def test_initial_claim_read_failure_still_discovers_detached_descendant(self):
        self.check_failed_run_cleanup(claim_read_failure=True)


if __name__ == "__main__":
    unittest.main()
