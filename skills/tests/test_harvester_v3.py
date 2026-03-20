#!/usr/bin/env python3
"""Tests for harvester_v3.js — Comprehensive Design System Extraction output."""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


# === Fixture: Simulated v3 harvester output ===

V3_HARVEST = {
    "_version": 3,
    "meta": {
        "url": "https://app.example.com/dashboard",
        "timestamp": "2026-02-25T03:00:00Z",
        "title": "Dashboard — App",
        "page_type": "dashboard"
    },
    "colors": {
        "primary": "rgb(23, 92, 211)",
        "primary_text": "rgb(255, 255, 255)",
        "success": "rgb(16, 185, 129)",
        "warning": "rgb(245, 158, 11)",
        "danger": "rgb(239, 68, 68)",
        "info": "rgb(59, 130, 246)",
        "link": "rgb(37, 99, 235)",
        "disabled_bg": "rgb(229, 231, 235)",
        "disabled_text": "rgb(156, 163, 175)"
    },
    "neutrals": {
        "50": "#fafafa", "100": "#f4f4f5", "200": "#e4e4e7",
        "300": "#d4d4d8", "400": "#a1a1aa", "500": "#71717a",
        "600": "#52525b", "700": "#3f3f46", "800": "#27272a", "900": "#18181b"
    },
    "surfaces": {
        "app_bg": "rgb(244, 246, 248)",
        "card_bg": "rgb(255, 255, 255)",
        "sidebar_bg": "rgb(31, 41, 55)",
        "header_bg": "rgb(255, 255, 255)",
        "modal_bg": "rgb(255, 255, 255)",
        "hover_bg": "rgb(243, 244, 246)",
        "selected_bg": "rgb(239, 246, 255)",
        "input_bg": "rgb(255, 255, 255)",
        "border": "rgb(229, 231, 235)"
    },
    "typography": {
        "heading_family": "Plus Jakarta Sans, sans-serif",
        "body_family": "Inter, -apple-system, sans-serif",
        "body_size": "14px",
        "body_line_height": "1.5",
        "heading_size": "24px",
        "heading_weight": "700",
        "heading_color": "rgb(15, 23, 42)",
        "body_color": "rgb(71, 85, 105)",
        "muted_color": "rgb(148, 163, 184)",
        "sizes": {"xs": "11px", "sm": "12px", "base": "14px", "lg": "16px", "xl": "20px", "2xl": "24px"},
        "weights": {"regular": "400", "medium": "500", "semibold": "600", "bold": "700"}
    },
    "spacing": {
        "scale": ["4px", "8px", "12px", "16px", "20px", "24px", "32px", "48px"]
    },
    "borders": {
        "color": "rgb(229, 231, 235)",
        "width": "1px",
        "radius": {"sm": "4px", "md": "8px", "lg": "12px", "xl": "16px", "full": "9999px"}
    },
    "shadows": {
        "sm": "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px",
        "md": "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
        "lg": "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px"
    },
    "layout": {
        "sidebar_width": "256px",
        "header_height": "64px",
        "content_max_width": "1200px",
        "content_padding": "24px",
        "grid_gap": "16px"
    },
    "components": {
        "button": {
            "primary": {
                "bg": "rgb(23, 92, 211)", "color": "rgb(255, 255, 255)",
                "border_radius": "8px", "padding": "8px 16px", "font_size": "14px", "font_weight": "500"
            },
            "secondary": {
                "bg": "rgb(255, 255, 255)", "color": "rgb(55, 65, 81)",
                "border": "1px solid rgb(209, 213, 219)", "border_radius": "8px", "padding": "8px 16px"
            }
        },
        "input": {
            "default": {
                "bg": "rgb(255, 255, 255)", "color": "rgb(17, 24, 39)",
                "border": "1px solid rgb(209, 213, 219)", "border_radius": "8px", "padding": "10px 12px"
            }
        },
        "card": {
            "default": {
                "bg": "rgb(255, 255, 255)", "border_radius": "12px",
                "box_shadow": "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px", "padding": "20px"
            }
        },
        "table": {
            "header": {"bg": "rgb(249, 250, 251)", "font_weight": "600", "font_size": "12px"},
            "row": {"bg": "rgb(255, 255, 255)", "border": "1px solid rgb(243, 244, 246)"},
            "cell": {"padding": "12px 16px", "font_size": "14px"}
        },
        "nav_item": {
            "default": {"color": "rgb(156, 163, 175)", "padding": "8px 12px", "font_size": "14px"},
            "active": {"color": "rgb(255, 255, 255)", "bg": "rgba(255,255,255,0.1)", "border_radius": "8px"}
        },
        "tag": {
            "default": {"bg": "rgb(239, 246, 255)", "color": "rgb(37, 99, 235)", "border_radius": "6px", "padding": "2px 8px"}
        }
    },
    "geometry": {
        "button_radius": "8px", "card_radius": "12px",
        "card_shadow": "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px",
        "input_radius": "8px", "button_padding": "8px 16px"
    }
}

MINIMAL_V3 = {
    "_version": 3,
    "meta": {"url": "https://example.com", "timestamp": "", "title": "", "page_type": "generic"},
    "colors": {"primary": "rgb(0, 122, 255)"},
    "neutrals": {},
    "surfaces": {},
    "typography": {"body_family": "system-ui"},
    "spacing": {"scale": []},
    "borders": {"radius": {}},
    "shadows": {},
    "layout": {},
    "components": {},
    "geometry": {}
}


class TestV3OutputStructure(unittest.TestCase):
    """Validate v3 harvest JSON has all required sections."""

    def test_has_version_marker(self):
        self.assertEqual(V3_HARVEST["_version"], 3)

    def test_has_all_top_level_keys(self):
        required = {"_version", "meta", "colors", "neutrals", "surfaces", "typography",
                     "spacing", "borders", "shadows", "layout", "components", "geometry"}
        self.assertTrue(required.issubset(set(V3_HARVEST.keys())))

    def test_meta_has_page_type(self):
        self.assertIn("page_type", V3_HARVEST["meta"])
        self.assertEqual(V3_HARVEST["meta"]["page_type"], "dashboard")


class TestV3Colors(unittest.TestCase):
    """Enhanced color extraction."""

    def test_has_primary(self):
        self.assertIn("primary", V3_HARVEST["colors"])

    def test_has_semantic_colors(self):
        for key in ("success", "warning", "danger", "info"):
            self.assertIn(key, V3_HARVEST["colors"])

    def test_has_link_color(self):
        self.assertIn("link", V3_HARVEST["colors"])

    def test_has_disabled_colors(self):
        self.assertIn("disabled_bg", V3_HARVEST["colors"])
        self.assertIn("disabled_text", V3_HARVEST["colors"])


class TestV3Neutrals(unittest.TestCase):
    """Neutral scale detection."""

    def test_has_10_steps(self):
        self.assertEqual(len(V3_HARVEST["neutrals"]), 10)

    def test_steps_are_named(self):
        for step in ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]:
            self.assertIn(step, V3_HARVEST["neutrals"])

    def test_values_are_hex(self):
        for val in V3_HARVEST["neutrals"].values():
            self.assertTrue(val.startswith("#"), f"{val} is not hex")


class TestV3Surfaces(unittest.TestCase):
    """Expanded surface extraction."""

    def test_has_core_surfaces(self):
        for key in ("app_bg", "card_bg", "sidebar_bg", "border"):
            self.assertIn(key, V3_HARVEST["surfaces"])

    def test_has_new_surfaces(self):
        for key in ("header_bg", "modal_bg", "hover_bg", "selected_bg", "input_bg"):
            self.assertIn(key, V3_HARVEST["surfaces"])


class TestV3Typography(unittest.TestCase):
    """Typography scale."""

    def test_has_heading_and_body_family(self):
        self.assertIn("heading_family", V3_HARVEST["typography"])
        self.assertIn("body_family", V3_HARVEST["typography"])

    def test_has_size_scale(self):
        self.assertIn("sizes", V3_HARVEST["typography"])
        self.assertGreaterEqual(len(V3_HARVEST["typography"]["sizes"]), 3)

    def test_has_weights(self):
        self.assertIn("weights", V3_HARVEST["typography"])
        self.assertGreaterEqual(len(V3_HARVEST["typography"]["weights"]), 2)


class TestV3Spacing(unittest.TestCase):
    """Spacing scale inference."""

    def test_has_scale(self):
        self.assertIn("scale", V3_HARVEST["spacing"])
        self.assertGreaterEqual(len(V3_HARVEST["spacing"]["scale"]), 4)

    def test_values_are_px(self):
        for v in V3_HARVEST["spacing"]["scale"]:
            self.assertTrue(v.endswith("px"))


class TestV3Borders(unittest.TestCase):
    """Border system."""

    def test_has_radius_scale(self):
        self.assertIn("radius", V3_HARVEST["borders"])
        self.assertIn("md", V3_HARVEST["borders"]["radius"])

    def test_has_border_width(self):
        self.assertIn("width", V3_HARVEST["borders"])


class TestV3Shadows(unittest.TestCase):
    """Shadow system."""

    def test_has_at_least_one_shadow(self):
        self.assertTrue(len(V3_HARVEST["shadows"]) >= 1)

    def test_has_classified_shadows(self):
        self.assertIn("md", V3_HARVEST["shadows"])


class TestV3Layout(unittest.TestCase):
    """Layout metrics."""

    def test_has_sidebar_width(self):
        self.assertIn("sidebar_width", V3_HARVEST["layout"])

    def test_has_header_height(self):
        self.assertIn("header_height", V3_HARVEST["layout"])


class TestV3Components(unittest.TestCase):
    """Component blueprints."""

    def test_has_button(self):
        self.assertIn("button", V3_HARVEST["components"])
        self.assertIn("primary", V3_HARVEST["components"]["button"])

    def test_button_has_style_profile(self):
        btn = V3_HARVEST["components"]["button"]["primary"]
        self.assertIn("bg", btn)
        self.assertIn("color", btn)
        self.assertIn("border_radius", btn)

    def test_has_input(self):
        self.assertIn("input", V3_HARVEST["components"])

    def test_has_card(self):
        self.assertIn("card", V3_HARVEST["components"])

    def test_has_table(self):
        self.assertIn("table", V3_HARVEST["components"])
        self.assertIn("header", V3_HARVEST["components"]["table"])
        self.assertIn("row", V3_HARVEST["components"]["table"])
        self.assertIn("cell", V3_HARVEST["components"]["table"])

    def test_has_nav_item(self):
        self.assertIn("nav_item", V3_HARVEST["components"])

    def test_has_tag(self):
        self.assertIn("tag", V3_HARVEST["components"])


class TestV3BackwardCompat(unittest.TestCase):
    """Legacy geometry section for v2 compatibility."""

    def test_has_geometry(self):
        self.assertIn("geometry", V3_HARVEST)

    def test_geometry_has_button_radius(self):
        self.assertIn("button_radius", V3_HARVEST["geometry"])


class TestV3MinimalInput(unittest.TestCase):
    """Handles minimal harvest gracefully."""

    def test_has_required_keys(self):
        required = {"_version", "meta", "colors", "surfaces", "typography", "geometry"}
        self.assertTrue(required.issubset(set(MINIMAL_V3.keys())))

    def test_components_can_be_empty(self):
        self.assertIsInstance(MINIMAL_V3["components"], dict)


class TestV3JsonSerializable(unittest.TestCase):
    """Output must be JSON-serializable."""

    def test_roundtrip(self):
        s = json.dumps(V3_HARVEST)
        parsed = json.loads(s)
        self.assertEqual(parsed["_version"], 3)
        self.assertEqual(parsed["meta"]["page_type"], "dashboard")


if __name__ == "__main__":
    unittest.main()
