#!/usr/bin/env python3
"""Tests for harvest_session.py — Multi-Page Scanner."""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from harvest_session import merge_harvests, calculate_confidence, merge_with_confidence


# === Fixtures ===

HARVEST_DASHBOARD = {
    "meta": {"url": "https://app.com/dashboard", "timestamp": "2026-01-01T00:00:00Z", "title": "Dashboard"},
    "colors": {"primary": "rgb(23, 92, 211)", "primary_text": "rgb(255, 255, 255)"},
    "surfaces": {"app_bg": "rgb(244, 246, 248)", "card_bg": "rgb(255, 255, 255)", "sidebar_bg": "rgb(31, 41, 55)"},
    "typography": {"font_family": "Inter, sans-serif", "body_size": "14px", "body_color": "rgb(71, 85, 105)"},
    "geometry": {"button_radius": "4px", "card_radius": "8px"}
}

HARVEST_ORDERS = {
    "meta": {"url": "https://app.com/orders", "timestamp": "2026-01-01T00:01:00Z", "title": "Orders"},
    "colors": {"primary": "rgb(23, 92, 211)", "success": "rgb(16, 185, 129)", "danger": "rgb(239, 68, 68)"},
    "surfaces": {"app_bg": "rgb(244, 246, 248)", "card_bg": "rgb(255, 255, 255)"},
    "typography": {"font_family": "Inter, sans-serif", "body_size": "14px"},
    "geometry": {"button_radius": "4px", "card_radius": "8px", "input_radius": "4px"}
}

HARVEST_SETTINGS = {
    "meta": {"url": "https://app.com/settings", "timestamp": "2026-01-01T00:02:00Z", "title": "Settings"},
    "colors": {"primary": "rgb(23, 92, 211)", "warning": "rgb(245, 158, 11)"},
    "surfaces": {"app_bg": "rgb(244, 246, 248)", "card_bg": "rgb(255, 255, 255)"},
    "typography": {"font_family": "Inter, sans-serif", "body_size": "14px"},
    "geometry": {"button_radius": "4px", "card_radius": "8px"}
}


class TestMergeHarvests(unittest.TestCase):
    """Merging multiple page harvests."""

    def test_empty_list(self):
        self.assertEqual(merge_harvests([]), {})

    def test_single_harvest_passthrough(self):
        result = merge_harvests([HARVEST_DASHBOARD])
        self.assertEqual(result, HARVEST_DASHBOARD)

    def test_merge_preserves_primary(self):
        result = merge_harvests([HARVEST_DASHBOARD, HARVEST_ORDERS, HARVEST_SETTINGS])
        self.assertEqual(result["colors"]["primary"], "rgb(23, 92, 211)")

    def test_merge_unions_color_keys(self):
        """Merging should pick up success/danger from orders, warning from settings."""
        result = merge_harvests([HARVEST_DASHBOARD, HARVEST_ORDERS, HARVEST_SETTINGS])
        self.assertIn("success", result["colors"])
        self.assertIn("danger", result["colors"])
        self.assertIn("warning", result["colors"])

    def test_merge_unions_geometry_keys(self):
        """input_radius only in orders page should appear in merged."""
        result = merge_harvests([HARVEST_DASHBOARD, HARVEST_ORDERS])
        self.assertIn("input_radius", result["geometry"])

    def test_merge_surfaces_union(self):
        """sidebar_bg only in dashboard should appear in merged."""
        result = merge_harvests([HARVEST_DASHBOARD, HARVEST_ORDERS])
        self.assertIn("sidebar_bg", result["surfaces"])

    def test_merge_meta_has_page_count(self):
        result = merge_harvests([HARVEST_DASHBOARD, HARVEST_ORDERS, HARVEST_SETTINGS])
        self.assertEqual(result["meta"]["page_count"], 3)

    def test_merge_meta_has_pages_list(self):
        result = merge_harvests([HARVEST_DASHBOARD, HARVEST_ORDERS])
        self.assertIn("pages", result["meta"])
        self.assertEqual(len(result["meta"]["pages"]), 2)

    def test_merge_uses_most_frequent_value(self):
        """When values differ, pick most frequent."""
        h1 = {"meta": {}, "colors": {"primary": "rgb(0,0,255)"}, "surfaces": {}, "typography": {}, "geometry": {}}
        h2 = {"meta": {}, "colors": {"primary": "rgb(255,0,0)"}, "surfaces": {}, "typography": {}, "geometry": {}}
        h3 = {"meta": {}, "colors": {"primary": "rgb(0,0,255)"}, "surfaces": {}, "typography": {}, "geometry": {}}
        result = merge_harvests([h1, h2, h3])
        self.assertEqual(result["colors"]["primary"], "rgb(0,0,255)")


class TestCalculateConfidence(unittest.TestCase):
    """Token confidence scoring."""

    def test_empty_harvests(self):
        self.assertEqual(calculate_confidence([]), {})

    def test_single_page_full_confidence(self):
        conf = calculate_confidence([HARVEST_DASHBOARD])
        self.assertEqual(conf["colors"]["primary"], 1.0)

    def test_partial_appearance(self):
        """success only in 1 of 3 pages → 0.33 confidence."""
        conf = calculate_confidence([HARVEST_DASHBOARD, HARVEST_ORDERS, HARVEST_SETTINGS])
        self.assertAlmostEqual(conf["colors"]["success"], 0.33, places=2)

    def test_full_appearance(self):
        """primary in all 3 pages → 1.0 confidence."""
        conf = calculate_confidence([HARVEST_DASHBOARD, HARVEST_ORDERS, HARVEST_SETTINGS])
        self.assertEqual(conf["colors"]["primary"], 1.0)

    def test_all_sections_present(self):
        conf = calculate_confidence([HARVEST_DASHBOARD])
        self.assertIn("colors", conf)
        self.assertIn("surfaces", conf)
        self.assertIn("typography", conf)
        self.assertIn("geometry", conf)


class TestMergeWithConfidence(unittest.TestCase):
    """Combined merge + confidence."""

    def test_has_confidence_key(self):
        result = merge_with_confidence([HARVEST_DASHBOARD, HARVEST_ORDERS])
        self.assertIn("_confidence", result)

    def test_has_merged_data(self):
        result = merge_with_confidence([HARVEST_DASHBOARD, HARVEST_ORDERS])
        self.assertIn("colors", result)
        self.assertIn("surfaces", result)


if __name__ == "__main__":
    unittest.main()
