"""Pure process-table controls. No subprocess, signal, browser or socket runs."""
import importlib.util
from pathlib import Path
import unittest

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


if __name__ == "__main__":
    unittest.main()
