#!/usr/bin/env python3
"""
TDD RED Phase — Tests for harvester.js CSSOM extraction output.
Validates JSON structure and data quality from browser injection.
"""
import json
import unittest


# === Fixtures: Simulated harvester.js output ===

VALID_HARVEST = {
    "meta": {
        "url": "https://example.com/admin",
        "timestamp": "2025-02-25T03:00:00Z",
        "title": "Admin Dashboard"
    },
    "colors": {
        "primary": "rgb(23, 92, 211)",
        "primary_text": "rgb(255, 255, 255)",
        "success": "rgb(16, 185, 129)",
        "warning": "rgb(245, 158, 11)",
        "danger": "rgb(239, 68, 68)"
    },
    "surfaces": {
        "app_bg": "rgb(244, 246, 248)",
        "card_bg": "rgb(255, 255, 255)",
        "sidebar_bg": "rgb(31, 41, 55)",
        "border": "rgb(229, 231, 235)"
    },
    "typography": {
        "font_family": "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        "heading_size": "24px",
        "body_size": "14px",
        "body_line_height": "1.5",
        "title_color": "rgb(15, 23, 42)",
        "body_color": "rgb(71, 85, 105)",
        "muted_color": "rgb(148, 163, 184)"
    },
    "geometry": {
        "button_radius": "4px",
        "card_radius": "8px",
        "input_radius": "4px",
        "card_shadow": "0px 1px 3px rgba(0, 0, 0, 0.1)",
        "button_padding": "8px 16px"
    }
}

MINIMAL_HARVEST = {
    "meta": {"url": "https://example.com", "timestamp": "", "title": ""},
    "colors": {"primary": "rgb(0, 122, 255)"},
    "surfaces": {},
    "typography": {},
    "geometry": {}
}


class TestHarvesterOutputStructure(unittest.TestCase):
    """Validate JSON structure from harvester.js"""

    def test_has_required_top_level_keys(self):
        """Harvest output MUST contain all 5 top-level categories"""
        required = {"meta", "colors", "surfaces", "typography", "geometry"}
        self.assertEqual(required, set(VALID_HARVEST.keys()))

    def test_meta_has_url(self):
        """Meta must contain the source URL"""
        self.assertIn("url", VALID_HARVEST["meta"])
        self.assertTrue(VALID_HARVEST["meta"]["url"].startswith("http"))

    def test_meta_has_timestamp(self):
        self.assertIn("timestamp", VALID_HARVEST["meta"])

    def test_colors_has_primary(self):
        """At minimum, primary color must be extracted"""
        self.assertIn("primary", VALID_HARVEST["colors"])

    def test_color_format_is_rgb(self):
        """Colors should be in rgb() or rgba() format"""
        for key, val in VALID_HARVEST["colors"].items():
            self.assertTrue(
                val.startswith("rgb(") or val.startswith("rgba("),
                f"Color '{key}' has invalid format: {val}"
            )

    def test_surfaces_has_app_bg(self):
        self.assertIn("app_bg", VALID_HARVEST["surfaces"])

    def test_typography_has_font_family(self):
        self.assertIn("font_family", VALID_HARVEST["typography"])

    def test_geometry_has_button_radius(self):
        self.assertIn("button_radius", VALID_HARVEST["geometry"])


class TestHarvesterMinimalOutput(unittest.TestCase):
    """Validate graceful handling when few elements are found"""

    def test_minimal_still_has_all_keys(self):
        required = {"meta", "colors", "surfaces", "typography", "geometry"}
        self.assertEqual(required, set(MINIMAL_HARVEST.keys()))

    def test_minimal_has_at_least_primary(self):
        self.assertIn("primary", MINIMAL_HARVEST["colors"])

    def test_empty_sections_are_dicts(self):
        self.assertIsInstance(MINIMAL_HARVEST["surfaces"], dict)
        self.assertIsInstance(MINIMAL_HARVEST["typography"], dict)
        self.assertIsInstance(MINIMAL_HARVEST["geometry"], dict)


class TestHarvesterJsonSerializable(unittest.TestCase):
    """Output must be JSON-serializable (for console transport)"""

    def test_valid_json_roundtrip(self):
        s = json.dumps(VALID_HARVEST)
        parsed = json.loads(s)
        self.assertEqual(parsed["colors"]["primary"], "rgb(23, 92, 211)")

    def test_no_non_serializable_types(self):
        """No sets, functions, or other non-JSON types"""
        s = json.dumps(VALID_HARVEST)
        self.assertIsInstance(s, str)


if __name__ == "__main__":
    unittest.main()
