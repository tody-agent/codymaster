#!/usr/bin/env python3
"""
TDD RED Phase — Tests for multi-device breakpoint system.
Tests device CSV loading, search, and filtering.
"""
import csv
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from core import CSV_CONFIG, search, DATA_DIR


class TestDeviceDomainRegistered(unittest.TestCase):
    """Verify devices domain is registered."""

    def test_devices_in_config(self):
        self.assertIn("devices", CSV_CONFIG)


class TestDevicesCSV(unittest.TestCase):
    """Verify devices.csv exists and has correct structure."""

    def test_csv_exists(self):
        filepath = DATA_DIR / CSV_CONFIG["devices"]["file"]
        self.assertTrue(filepath.exists(), f"Missing: {filepath}")

    def test_csv_has_rows(self):
        filepath = DATA_DIR / CSV_CONFIG["devices"]["file"]
        with open(filepath, 'r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
        self.assertGreaterEqual(len(rows), 15, "devices.csv should have ≥15 rows")

    def test_csv_has_required_columns(self):
        filepath = DATA_DIR / CSV_CONFIG["devices"]["file"]
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            cols = set(reader.fieldnames)
        required = {"Device", "Category", "Width_Min", "Width_Max"}
        self.assertTrue(required.issubset(cols), f"Missing columns: {required - cols}")


class TestDeviceSearch(unittest.TestCase):
    """Verify search returns relevant device results."""

    def test_mobile_search(self):
        result = search("mobile phone", "devices", 3)
        self.assertGreater(result["count"], 0)

    def test_tablet_search(self):
        result = search("tablet iPad", "devices", 3)
        self.assertGreater(result["count"], 0)

    def test_desktop_search(self):
        result = search("desktop monitor", "devices", 3)
        self.assertGreater(result["count"], 0)

    def test_watch_search(self):
        result = search("smartwatch wearable", "devices", 3)
        self.assertGreater(result["count"], 0)

    def test_tv_search(self):
        result = search("television TV large screen", "devices", 3)
        self.assertGreater(result["count"], 0)

    def test_domain_is_devices(self):
        result = search("foldable phone", "devices", 3)
        self.assertEqual(result["domain"], "devices")


if __name__ == "__main__":
    unittest.main()
