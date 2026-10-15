"""Pure process-table controls. No subprocess, signal, browser or socket runs."""
import importlib.util
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("owned_controller", Path(__file__).with_name("root-controller.py"))
controller = importlib.util.module_from_spec(spec)
spec.loader.exec_module(controller)


def row(pid, parent, birth="Mon Oct 12 06:15:00 2026", stat="S", group=None):
    return {"pid": pid, "parent": parent, "birth": birth, "stat": stat,
            "group": pid if group is None else group, "command": "fixture"}


class Controls(unittest.TestCase):
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

    def check_failed_run_cleanup(self, write_failure=False):
        # Entire run is simulated: no command, ps, signal, sleep or socket.
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            claims = base / "claims.jsonl"
            journal = base / "controller.json"
            go = base / "go.json"
            go.write_text(json.dumps({
                "authorization": "Root authorizes exactly one movement acquisition",
                "command": ["npx", "playwright", "test", "--config=evidence/step-01/movement-backpressure-live/preparation/playwright.config.ts"],
                "environment": {"BONGO_MOVEMENT_RESOURCE_JOURNAL": str(claims),
                                "BONGO_MOVEMENT_LIVE_OUTPUT": str(base / "attempt"),
                                "BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT": str(base / "runner")},
                "sourceBindings": []}))
            rows = {10: row(10, 2), 11: row(11, 10)}
            class Child:
                pid = 10
                returncode = None
                def poll(self):
                    return self.returncode
                def kill(self):
                    self.returncode = -9
                    rows.pop(10, None)
                def wait(self, timeout):
                    return self.returncode
            child = Child()
            def launch(*args, **kwargs):
                claims.write_bytes(b"invalid json\n")
                return child
            def group_signal(pid, sig):
                self.assertEqual(pid, 10)
                child.returncode = -15
                rows.pop(10, None)
            def signal_pid(pid, sig):
                self.assertEqual(pid, 11)
                rows.pop(pid, None)
            real_write = Path.write_text
            def write(path, data, *args, **kwargs):
                if write_failure and path == journal:
                    raise OSError("simulated disk failure")
                return real_write(path, data, *args, **kwargs)
            with patch.object(controller.subprocess, "Popen", side_effect=launch), \
                 patch.object(controller, "inventory", side_effect=lambda: dict(rows)), \
                 patch.object(controller.os, "killpg", side_effect=group_signal), \
                 patch.object(controller.os, "kill", side_effect=signal_pid), \
                 patch.object(controller.time, "sleep"), \
                 patch.object(Path, "write_text", write), contextlib.redirect_stdout(io.StringIO()) as stdout:
                self.assertEqual(controller.run(go, journal), 1)
            result = json.loads(stdout.getvalue())
            self.assertTrue(result["forcedCleanup"])
            self.assertEqual(result["remainingOwned"], {})
            self.assertTrue(result["errors"])
            self.assertEqual(rows, {})

    def test_malformed_claim_does_not_prevent_owned_cleanup(self):
        self.check_failed_run_cleanup()

    def test_journal_write_failure_does_not_prevent_owned_cleanup(self):
        self.check_failed_run_cleanup(write_failure=True)


if __name__ == "__main__":
    unittest.main()
