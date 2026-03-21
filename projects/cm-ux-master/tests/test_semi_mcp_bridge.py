#!/usr/bin/env python3
"""
TDD RED Phase — Tests for semi_mcp_bridge.py
Semi MCP Bridge: Component mapping + Prompt generation + React template system.
"""
import json
import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


# === Fixtures ===

SAMPLE_TOKENS = {
    "--semi-color-primary": "#175CD3",
    "--semi-color-primary-hover": "#1452BD",
    "--semi-color-primary-active": "#1249A8",
    "--semi-color-success": "#10B981",
    "--semi-color-warning": "#FF7D00",
    "--semi-color-danger": "#EF4444",
    "--semi-color-bg-0": "#F4F6F8",
    "--semi-color-bg-1": "#FFFFFF",
    "--semi-color-text-0": "#0F172A",
    "--semi-color-text-1": "#475569",
    "--semi-font-family-regular": "Inter, sans-serif",
    "--semi-border-radius-medium": "4px",
    "--semi-shadow-elevated": "0px 1px 3px rgba(0,0,0,0.1)",
}

SAMPLE_META = {
    "url": "https://myharavan.com/admin",
    "title": "Haravan Admin Dashboard",
    "timestamp": "2025-02-25T03:00:00Z",
}


class TestDetectUIPatterns(unittest.TestCase):
    """Detect UI layout patterns from harvest data"""

    def test_detect_sidebar_layout(self):
        from semi_mcp_bridge import detect_ui_patterns
        harvest = {
            "surfaces": {"sidebar_bg": "rgb(31,41,55)", "card_bg": "rgb(255,255,255)"},
            "meta": {"title": "Admin Dashboard"}
        }
        patterns = detect_ui_patterns(harvest)
        self.assertIn("sidebar-layout", patterns)

    def test_detect_dashboard_from_title(self):
        from semi_mcp_bridge import detect_ui_patterns
        harvest = {
            "surfaces": {},
            "meta": {"title": "Order Management Dashboard"}
        }
        patterns = detect_ui_patterns(harvest)
        self.assertIn("dashboard", patterns)

    def test_detect_form_from_title(self):
        from semi_mcp_bridge import detect_ui_patterns
        harvest = {"surfaces": {}, "meta": {"title": "Create New Product"}}
        patterns = detect_ui_patterns(harvest)
        self.assertIn("form", patterns)

    def test_returns_list(self):
        from semi_mcp_bridge import detect_ui_patterns
        patterns = detect_ui_patterns({"surfaces": {}, "meta": {}})
        self.assertIsInstance(patterns, list)


class TestMapPatternsToComponents(unittest.TestCase):
    """Map UI patterns → Semi Design component list"""

    def test_sidebar_maps_to_layout_nav(self):
        from semi_mcp_bridge import map_patterns_to_components
        comps = map_patterns_to_components(["sidebar-layout"])
        self.assertIn("Layout", comps)
        self.assertIn("Nav", comps)

    def test_dashboard_maps_to_table_card(self):
        from semi_mcp_bridge import map_patterns_to_components
        comps = map_patterns_to_components(["dashboard"])
        self.assertIn("Table", comps)
        self.assertIn("Card", comps)

    def test_form_maps_to_form_input(self):
        from semi_mcp_bridge import map_patterns_to_components
        comps = map_patterns_to_components(["form"])
        self.assertIn("Form", comps)
        self.assertIn("Input", comps)

    def test_deduplicates(self):
        from semi_mcp_bridge import map_patterns_to_components
        comps = map_patterns_to_components(["sidebar-layout", "dashboard"])
        self.assertEqual(len(comps), len(set(comps)))


class TestGenerateMCPQueries(unittest.TestCase):
    """Generate MCP tool call instructions for AI"""

    def test_returns_list_of_queries(self):
        from semi_mcp_bridge import generate_mcp_queries
        queries = generate_mcp_queries(["Table", "Button"])
        self.assertIsInstance(queries, list)
        self.assertTrue(len(queries) >= 2)

    def test_query_has_tool_name(self):
        from semi_mcp_bridge import generate_mcp_queries
        queries = generate_mcp_queries(["Table"])
        self.assertTrue(any(q["tool"] == "get_semi_document" for q in queries))

    def test_query_has_args(self):
        from semi_mcp_bridge import generate_mcp_queries
        queries = generate_mcp_queries(["Table"])
        for q in queries:
            self.assertIn("args", q)
            self.assertIn("componentName", q["args"])


class TestGenerateReactTemplate(unittest.TestCase):
    """Generate React component template with Semi UI + tokens"""

    def test_output_is_string(self):
        from semi_mcp_bridge import generate_react_template
        code = generate_react_template(
            patterns=["sidebar-layout", "dashboard"],
            tokens=SAMPLE_TOKENS,
            meta=SAMPLE_META
        )
        self.assertIsInstance(code, str)

    def test_imports_semi_ui(self):
        from semi_mcp_bridge import generate_react_template
        code = generate_react_template(
            patterns=["sidebar-layout", "dashboard"],
            tokens=SAMPLE_TOKENS,
            meta=SAMPLE_META
        )
        self.assertIn("@douyinfe/semi-ui", code)

    def test_contains_component_jsx(self):
        from semi_mcp_bridge import generate_react_template
        code = generate_react_template(
            patterns=["sidebar-layout", "dashboard"],
            tokens=SAMPLE_TOKENS,
            meta=SAMPLE_META
        )
        self.assertIn("<Layout", code)

    def test_contains_export(self):
        from semi_mcp_bridge import generate_react_template
        code = generate_react_template(
            patterns=["dashboard"],
            tokens=SAMPLE_TOKENS,
            meta=SAMPLE_META
        )
        self.assertIn("export", code)


class TestGenerateThemeProvider(unittest.TestCase):
    """Generate CSS theme import code"""

    def test_output_contains_import(self):
        from semi_mcp_bridge import generate_theme_provider
        code = generate_theme_provider(SAMPLE_TOKENS)
        self.assertIn("semi-theme-override", code)

    def test_output_is_string(self):
        from semi_mcp_bridge import generate_theme_provider
        code = generate_theme_provider(SAMPLE_TOKENS)
        self.assertIsInstance(code, str)


class TestBuildHarvestBundle(unittest.TestCase):
    """Full pipeline: harvest data → complete output bundle"""

    def test_bundle_has_all_keys(self):
        from semi_mcp_bridge import build_harvest_bundle
        harvest = {
            "meta": SAMPLE_META,
            "colors": {"primary": "rgb(23, 92, 211)"},
            "surfaces": {"sidebar_bg": "rgb(31,41,55)", "card_bg": "rgb(255,255,255)"},
            "typography": {"font_family": "Inter"},
            "geometry": {"button_radius": "4px"}
        }
        bundle = build_harvest_bundle(harvest, SAMPLE_TOKENS)
        self.assertIn("patterns", bundle)
        self.assertIn("components", bundle)
        self.assertIn("mcp_queries", bundle)
        self.assertIn("react_template", bundle)
        self.assertIn("theme_provider", bundle)

    def test_bundle_patterns_detected(self):
        from semi_mcp_bridge import build_harvest_bundle
        harvest = {
            "meta": {"title": "Admin Dashboard"},
            "colors": {"primary": "rgb(0,0,255)"},
            "surfaces": {"sidebar_bg": "rgb(31,41,55)"},
            "typography": {}, "geometry": {}
        }
        bundle = build_harvest_bundle(harvest, SAMPLE_TOKENS)
        self.assertTrue(len(bundle["patterns"]) > 0)


if __name__ == "__main__":
    unittest.main()
