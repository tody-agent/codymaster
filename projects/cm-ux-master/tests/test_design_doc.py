#!/usr/bin/env python3
"""Tests for design_doc_generator.py — Design System Documentation Site."""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from design_doc_generator import generate_doc_html


# === Fixtures ===

SAMPLE_TOKENS = {
    "--semi-color-primary": "#2463EB",
    "--semi-color-primary-hover": "#1D59D4",
    "--semi-color-primary-active": "#174FBD",
    "--semi-color-primary-light-default": "#EDF3FD",
    "--semi-color-success": "#10B981",
    "--semi-color-warning": "#F59E0B",
    "--semi-color-danger": "#EF4444",
    "--semi-color-bg-0": "#F4F6F8",
    "--semi-color-bg-1": "#FFFFFF",
    "--semi-color-bg-2": "#1F2937",
    "--semi-color-border": "#E5E7EB",
    "--semi-color-text-0": "#0F172A",
    "--semi-color-text-1": "#475569",
    "--semi-color-text-2": "#94A3B8",
    "--semi-font-family-regular": "Inter, -apple-system, sans-serif",
    "--semi-font-size-regular": "14px",
    "--semi-border-radius-medium": "4px",
    "--semi-border-radius-large": "8px",
    "--semi-shadow-elevated": "0px 1px 3px rgba(0, 0, 0, 0.1)",
}

SAMPLE_HARVEST = {
    "meta": {"url": "https://app.example.com", "timestamp": "2026-01-01T00:00:00Z", "title": "Example App"},
    "colors": {"primary": "rgb(36, 99, 235)"},
    "surfaces": {"app_bg": "rgb(244, 246, 248)"},
    "typography": {"font_family": "Inter, -apple-system, sans-serif", "body_size": "14px"},
    "geometry": {"button_radius": "4px"}
}

SAMPLE_META = {
    "name": "Example App",
    "url": "https://app.example.com",
    "updated_at": "2026-01-01T00:00:00Z",
    "harvest_count": 3,
}


class TestGenerateDocHtml(unittest.TestCase):
    """HTML generation output validation."""

    def setUp(self):
        self.html = generate_doc_html(SAMPLE_TOKENS, SAMPLE_HARVEST, SAMPLE_META)

    def test_returns_string(self):
        self.assertIsInstance(self.html, str)

    def test_valid_html_structure(self):
        self.assertIn("<!DOCTYPE html>", self.html)
        self.assertIn("<html", self.html)
        self.assertIn("</html>", self.html)
        self.assertIn("<head>", self.html)
        self.assertIn("</head>", self.html)
        self.assertIn("<body>", self.html)
        self.assertIn("</body>", self.html)

    def test_has_project_title(self):
        self.assertIn("Example App", self.html)

    def test_has_introduction_section(self):
        self.assertIn('id="introduction"', self.html)

    def test_has_colors_section(self):
        self.assertIn('id="colors"', self.html)

    def test_has_typography_section(self):
        self.assertIn('id="typography"', self.html)

    def test_has_geometry_section(self):
        self.assertIn('id="geometry"', self.html)

    def test_has_components_section(self):
        self.assertIn('id="components"', self.html)

    def test_has_tokens_section(self):
        self.assertIn('id="tokens"', self.html)

    def test_has_usage_section(self):
        self.assertIn('id="usage"', self.html)

    def test_has_dark_mode_toggle(self):
        self.assertIn("toggleTheme", self.html)
        self.assertIn("data-theme", self.html)

    def test_has_copy_functionality(self):
        self.assertIn("copyColor", self.html)

    def test_contains_css_variables(self):
        self.assertIn("--semi-color-primary", self.html)

    def test_has_color_swatches(self):
        self.assertIn("swatch", self.html)
        self.assertIn("#2463EB", self.html)

    def test_has_component_previews(self):
        self.assertIn("comp-btn", self.html)
        self.assertIn("comp-input", self.html)
        self.assertIn("comp-tag", self.html)

    def test_has_token_table(self):
        self.assertIn("token-table", self.html)

    def test_has_responsive_styles(self):
        self.assertIn("@media", self.html)

    def test_source_url_in_intro(self):
        self.assertIn("https://app.example.com", self.html)

    def test_page_count_shown(self):
        self.assertIn("3", self.html)


class TestMinimalInput(unittest.TestCase):
    """Handles minimal/empty input gracefully."""

    def test_empty_tokens(self):
        html = generate_doc_html({})
        self.assertIn("<!DOCTYPE html>", html)
        self.assertIn("Design System", html)

    def test_no_meta(self):
        html = generate_doc_html(SAMPLE_TOKENS)
        self.assertIn("<!DOCTYPE html>", html)

    def test_no_harvest(self):
        html = generate_doc_html(SAMPLE_TOKENS, meta=SAMPLE_META)
        self.assertIn("Example App", html)


if __name__ == "__main__":
    unittest.main()
