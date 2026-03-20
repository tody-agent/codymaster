#!/usr/bin/env python3
"""
TDD RED Phase — Tests for token_mapper.py
Semi Design Token Compiler: raw JSON → --semi-* variables → CSS/JSON output.
"""
import json
import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


# === Fixture: Simulated harvester output ===
RAW_HARVEST = {
    "meta": {
        "url": "https://myharavan.com/admin",
        "timestamp": "2025-02-25T03:00:00Z",
        "title": "Haravan Admin"
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


class TestRgbToHex(unittest.TestCase):
    """Color conversion utility"""

    def test_rgb_to_hex_basic(self):
        from token_mapper import rgb_to_hex
        self.assertEqual(rgb_to_hex("rgb(23, 92, 211)"), "#175CD3")

    def test_rgb_to_hex_white(self):
        from token_mapper import rgb_to_hex
        self.assertEqual(rgb_to_hex("rgb(255, 255, 255)"), "#FFFFFF")

    def test_rgb_to_hex_black(self):
        from token_mapper import rgb_to_hex
        self.assertEqual(rgb_to_hex("rgb(0, 0, 0)"), "#000000")

    def test_rgb_to_hex_with_spaces(self):
        from token_mapper import rgb_to_hex
        self.assertEqual(rgb_to_hex("rgb( 23 , 92 , 211 )"), "#175CD3")

    def test_rgba_to_hex(self):
        from token_mapper import rgb_to_hex
        result = rgb_to_hex("rgba(23, 92, 211, 0.5)")
        self.assertEqual(result, "#175CD3")

    def test_already_hex(self):
        from token_mapper import rgb_to_hex
        self.assertEqual(rgb_to_hex("#175CD3"), "#175CD3")


class TestDeriveShades(unittest.TestCase):
    """Auto-generate hover/active variants"""

    def test_derive_hover_is_darker(self):
        from token_mapper import derive_shades
        shades = derive_shades("#175CD3")
        self.assertIn("hover", shades)
        self.assertNotEqual(shades["hover"], "#175CD3")

    def test_derive_active_is_darkest(self):
        from token_mapper import derive_shades
        shades = derive_shades("#175CD3")
        self.assertIn("active", shades)

    def test_derive_light_variant(self):
        from token_mapper import derive_shades
        shades = derive_shades("#175CD3")
        self.assertIn("light-default", shades)


class TestMapToSemiTokens(unittest.TestCase):
    """Core mapping: raw JSON → Semi Design variables"""

    def test_maps_primary_color(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-color-primary", tokens)
        self.assertEqual(tokens["--semi-color-primary"], "#175CD3")

    def test_maps_primary_hover(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-color-primary-hover", tokens)

    def test_maps_semantic_colors(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-color-success", tokens)
        self.assertIn("--semi-color-warning", tokens)
        self.assertIn("--semi-color-danger", tokens)

    def test_maps_surface_colors(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-color-bg-0", tokens)
        self.assertIn("--semi-color-bg-1", tokens)

    def test_maps_text_colors(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-color-text-0", tokens)
        self.assertIn("--semi-color-text-1", tokens)

    def test_maps_border(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-color-border", tokens)

    def test_maps_typography(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-font-family-regular", tokens)

    def test_maps_geometry(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-border-radius-medium", tokens)

    def test_maps_shadow(self):
        from token_mapper import map_to_semi_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        self.assertIn("--semi-shadow-elevated", tokens)


class TestGenerateCssOverride(unittest.TestCase):
    """CSS output for Semi Design theme override"""

    def test_output_contains_root_selector(self):
        from token_mapper import map_to_semi_tokens, generate_css_override
        tokens = map_to_semi_tokens(RAW_HARVEST)
        css = generate_css_override(tokens, RAW_HARVEST.get("meta", {}))
        self.assertIn("body", css)

    def test_output_contains_semi_vars(self):
        from token_mapper import map_to_semi_tokens, generate_css_override
        tokens = map_to_semi_tokens(RAW_HARVEST)
        css = generate_css_override(tokens, RAW_HARVEST.get("meta", {}))
        self.assertIn("--semi-color-primary", css)

    def test_output_is_valid_css_block(self):
        from token_mapper import map_to_semi_tokens, generate_css_override
        tokens = map_to_semi_tokens(RAW_HARVEST)
        css = generate_css_override(tokens, RAW_HARVEST.get("meta", {}))
        self.assertIn("{", css)
        self.assertIn("}", css)
        self.assertEqual(css.count("{"), css.count("}"))


class TestGenerateFigmaTokens(unittest.TestCase):
    """JSON output for Figma Tokens Studio"""

    def test_output_is_valid_json(self):
        from token_mapper import map_to_semi_tokens, generate_figma_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        result = generate_figma_tokens(tokens, RAW_HARVEST.get("meta", {}))
        parsed = json.loads(result)
        self.assertIsInstance(parsed, dict)

    def test_tokens_have_value_and_type(self):
        from token_mapper import map_to_semi_tokens, generate_figma_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        result = json.loads(generate_figma_tokens(tokens, RAW_HARVEST.get("meta", {})))
        if "semi-color-primary" in result:
            token = result["semi-color-primary"]
            self.assertIn("value", token)
            self.assertIn("type", token)

    def test_color_tokens_have_type_color(self):
        from token_mapper import map_to_semi_tokens, generate_figma_tokens
        tokens = map_to_semi_tokens(RAW_HARVEST)
        result = json.loads(generate_figma_tokens(tokens, RAW_HARVEST.get("meta", {})))
        for key, val in result.items():
            if "color" in key and isinstance(val, dict) and "type" in val:
                self.assertEqual(val["type"], "color")


class TestGenerateSummary(unittest.TestCase):
    """Markdown summary report"""

    def test_summary_is_string(self):
        from token_mapper import map_to_semi_tokens, generate_summary
        tokens = map_to_semi_tokens(RAW_HARVEST)
        md = generate_summary(tokens, RAW_HARVEST.get("meta", {}))
        self.assertIsInstance(md, str)

    def test_summary_contains_source_url(self):
        from token_mapper import map_to_semi_tokens, generate_summary
        tokens = map_to_semi_tokens(RAW_HARVEST)
        md = generate_summary(tokens, RAW_HARVEST.get("meta", {}))
        self.assertIn("myharavan.com", md)


class TestMissingValues(unittest.TestCase):
    """Graceful handling of incomplete harvest data"""

    def test_empty_surfaces(self):
        from token_mapper import map_to_semi_tokens
        sparse = {
            "meta": {"url": "x"},
            "colors": {"primary": "rgb(0,0,255)"},
            "surfaces": {},
            "typography": {},
            "geometry": {}
        }
        tokens = map_to_semi_tokens(sparse)
        self.assertIn("--semi-color-primary", tokens)

    def test_no_crash_on_missing_keys(self):
        from token_mapper import map_to_semi_tokens
        sparse = {"colors": {"primary": "rgb(0,0,255)"}}
        tokens = map_to_semi_tokens(sparse)
        self.assertIn("--semi-color-primary", tokens)


if __name__ == "__main__":
    unittest.main()
