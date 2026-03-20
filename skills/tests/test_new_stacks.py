#!/usr/bin/env python3
"""
TDD RED Phase — Tests for new stacks: angular, htmx, electron, tauri.
Tests CSV file existence, column format, and BM25 search quality.
"""
import csv
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from core import STACK_CONFIG, AVAILABLE_STACKS, search_stack, DATA_DIR


EXPECTED_COLUMNS = {"No", "Category", "Guideline", "Description", "Do", "Don't",
                    "Code Good", "Code Bad", "Severity", "Docs URL"}

NEW_STACKS = ["angular", "htmx", "electron", "tauri"]


class TestNewStacksRegistered(unittest.TestCase):
    """Verify new stacks are registered in STACK_CONFIG."""

    def test_angular_in_config(self):
        self.assertIn("angular", STACK_CONFIG)

    def test_htmx_in_config(self):
        self.assertIn("htmx", STACK_CONFIG)

    def test_electron_in_config(self):
        self.assertIn("electron", STACK_CONFIG)

    def test_tauri_in_config(self):
        self.assertIn("tauri", STACK_CONFIG)

    def test_new_stacks_in_available_list(self):
        for stack in NEW_STACKS:
            self.assertIn(stack, AVAILABLE_STACKS, f"{stack} not in AVAILABLE_STACKS")


class TestNewStackCSVFiles(unittest.TestCase):
    """Verify CSV files exist and have correct columns."""

    def _load_csv(self, stack_name):
        filepath = DATA_DIR / STACK_CONFIG[stack_name]["file"]
        self.assertTrue(filepath.exists(), f"Missing: {filepath}")
        with open(filepath, 'r', encoding='utf-8') as f:
            return list(csv.DictReader(f))

    def test_angular_csv_exists_with_rows(self):
        rows = self._load_csv("angular")
        self.assertGreaterEqual(len(rows), 30, "angular.csv should have ≥30 rows")

    def test_htmx_csv_exists_with_rows(self):
        rows = self._load_csv("htmx")
        self.assertGreaterEqual(len(rows), 25, "htmx.csv should have ≥25 rows")

    def test_electron_csv_exists_with_rows(self):
        rows = self._load_csv("electron")
        self.assertGreaterEqual(len(rows), 30, "electron.csv should have ≥30 rows")

    def test_tauri_csv_exists_with_rows(self):
        rows = self._load_csv("tauri")
        self.assertGreaterEqual(len(rows), 25, "tauri.csv should have ≥25 rows")

    def test_column_format_consistency(self):
        """All new stacks must use the same column format as existing stacks."""
        for stack in NEW_STACKS:
            rows = self._load_csv(stack)
            actual_cols = set(rows[0].keys())
            self.assertTrue(
                EXPECTED_COLUMNS.issubset(actual_cols),
                f"{stack} missing columns: {EXPECTED_COLUMNS - actual_cols}"
            )


class TestNewStackSearch(unittest.TestCase):
    """Verify BM25 search returns relevant results from new stacks."""

    def test_angular_search(self):
        result = search_stack("signals standalone component", "angular", 3)
        self.assertGreater(result["count"], 0, "angular search should return results")
        self.assertEqual(result["stack"], "angular")

    def test_htmx_search(self):
        result = search_stack("hx-get progressive enhancement", "htmx", 3)
        self.assertGreater(result["count"], 0, "htmx search should return results")
        self.assertEqual(result["stack"], "htmx")

    def test_electron_search(self):
        result = search_stack("context isolation preload", "electron", 3)
        self.assertGreater(result["count"], 0, "electron search should return results")
        self.assertEqual(result["stack"], "electron")

    def test_tauri_search(self):
        result = search_stack("rust command invoke", "tauri", 3)
        self.assertGreater(result["count"], 0, "tauri search should return results")
        self.assertEqual(result["stack"], "tauri")


if __name__ == "__main__":
    unittest.main()
