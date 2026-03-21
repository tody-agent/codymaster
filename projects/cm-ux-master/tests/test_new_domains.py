#!/usr/bin/env python3
"""
TDD RED Phase — Tests for new data domains: animation, responsive, accessibility.
Tests CSV loading, BM25 search quality, and auto domain detection.
"""
import sys
import unittest
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from core import CSV_CONFIG, search, detect_domain, DATA_DIR


class TestNewDomainsRegistered(unittest.TestCase):
    """Verify new domains are registered in CSV_CONFIG."""

    def test_animation_domain_exists(self):
        self.assertIn("animation", CSV_CONFIG)

    def test_responsive_domain_exists(self):
        self.assertIn("responsive", CSV_CONFIG)

    def test_accessibility_domain_exists(self):
        self.assertIn("accessibility", CSV_CONFIG)


class TestNewDomainCSVFiles(unittest.TestCase):
    """Verify CSV files exist and have correct structure."""

    def test_animation_csv_exists(self):
        filepath = DATA_DIR / CSV_CONFIG["animation"]["file"]
        self.assertTrue(filepath.exists(), f"Missing: {filepath}")

    def test_responsive_csv_exists(self):
        filepath = DATA_DIR / CSV_CONFIG["responsive"]["file"]
        self.assertTrue(filepath.exists(), f"Missing: {filepath}")

    def test_accessibility_csv_exists(self):
        filepath = DATA_DIR / CSV_CONFIG["accessibility"]["file"]
        self.assertTrue(filepath.exists(), f"Missing: {filepath}")

    def test_animation_csv_has_rows(self):
        import csv
        filepath = DATA_DIR / CSV_CONFIG["animation"]["file"]
        with open(filepath, 'r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
        self.assertGreaterEqual(len(rows), 20, "animation.csv should have ≥20 rows")

    def test_responsive_csv_has_rows(self):
        import csv
        filepath = DATA_DIR / CSV_CONFIG["responsive"]["file"]
        with open(filepath, 'r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
        self.assertGreaterEqual(len(rows), 20, "responsive.csv should have ≥20 rows")

    def test_accessibility_csv_has_rows(self):
        import csv
        filepath = DATA_DIR / CSV_CONFIG["accessibility"]["file"]
        with open(filepath, 'r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
        self.assertGreaterEqual(len(rows), 20, "accessibility-advanced.csv should have ≥20 rows")


class TestNewDomainSearch(unittest.TestCase):
    """Verify BM25 search returns relevant results from new domains."""

    def test_animation_search_returns_results(self):
        result = search("hover micro interaction", "animation", 3)
        self.assertGreater(result["count"], 0, "animation search should return results")

    def test_responsive_search_returns_results(self):
        result = search("container query breakpoint", "responsive", 3)
        self.assertGreater(result["count"], 0, "responsive search should return results")

    def test_accessibility_search_returns_results(self):
        result = search("focus indicator WCAG", "accessibility", 3)
        self.assertGreater(result["count"], 0, "accessibility search should return results")

    def test_animation_search_has_correct_domain(self):
        result = search("skeleton loader", "animation", 3)
        self.assertEqual(result["domain"], "animation")

    def test_responsive_search_has_correct_domain(self):
        result = search("fluid typography", "responsive", 3)
        self.assertEqual(result["domain"], "responsive")

    def test_accessibility_search_has_correct_domain(self):
        result = search("screen reader", "accessibility", 3)
        self.assertEqual(result["domain"], "accessibility")


class TestDomainAutoDetect(unittest.TestCase):
    """Verify detect_domain picks new domains from keywords."""

    def test_detect_animation(self):
        self.assertEqual(detect_domain("micro interaction hover animation"), "animation")

    def test_detect_responsive(self):
        self.assertEqual(detect_domain("breakpoint container query responsive"), "responsive")

    def test_detect_accessibility_advanced(self):
        self.assertEqual(detect_domain("wcag 2.2 focus indicator target size"), "accessibility")


if __name__ == "__main__":
    unittest.main()
