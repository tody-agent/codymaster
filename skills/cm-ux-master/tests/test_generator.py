#!/usr/bin/env python3
"""
TDD RED Phase — Tests for code template generator.
Tests template loading, token substitution, and output correctness.
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "base"


class TestTemplatesExist(unittest.TestCase):
    """Template files must exist."""

    def test_html_page_template(self):
        self.assertTrue((TEMPLATES_DIR / "html-page.html").exists())

    def test_react_component_template(self):
        self.assertTrue((TEMPLATES_DIR / "react-component.tsx").exists())

    def test_flutter_widget_template(self):
        self.assertTrue((TEMPLATES_DIR / "flutter-widget.dart").exists())

    def test_swiftui_view_template(self):
        self.assertTrue((TEMPLATES_DIR / "swiftui-view.swift").exists())


class TestGeneratorModule(unittest.TestCase):
    """Template generator module must be importable and functional."""

    def test_import(self):
        from generate import TemplateGenerator
        self.assertTrue(callable(TemplateGenerator))

    def test_list_templates(self):
        from generate import TemplateGenerator
        gen = TemplateGenerator()
        templates = gen.list_templates()
        self.assertIn("html-page", templates)
        self.assertIn("react-component", templates)

    def test_render_html_page(self):
        from generate import TemplateGenerator
        gen = TemplateGenerator()
        tokens = {
            "name": "TestPage",
            "primary_color": "#7c3aed",
            "secondary_color": "#3b82f6",
            "background_color": "#0f172a",
            "text_color": "#e2e8f0",
            "heading_font": "Inter",
            "body_font": "Inter",
        }
        output = gen.render("html-page", tokens)
        self.assertIn("#7c3aed", output)
        self.assertIn("Inter", output)
        self.assertIn("TestPage", output)

    def test_render_react_component(self):
        from generate import TemplateGenerator
        gen = TemplateGenerator()
        tokens = {
            "name": "PricingCard",
            "primary_color": "#2563eb",
            "secondary_color": "#3b82f6",
            "background_color": "#ffffff",
            "text_color": "#1e293b",
            "heading_font": "Inter",
            "body_font": "Inter",
        }
        output = gen.render("react-component", tokens)
        self.assertIn("PricingCard", output)
        self.assertIn("#2563eb", output)

    def test_render_flutter_widget(self):
        from generate import TemplateGenerator
        gen = TemplateGenerator()
        tokens = {
            "name": "ProfileCard",
            "primary_color": "#7c3aed",
            "secondary_color": "#3b82f6",
            "background_color": "#ffffff",
            "text_color": "#1e293b",
            "heading_font": "Inter",
            "body_font": "Inter",
        }
        output = gen.render("flutter-widget", tokens)
        self.assertIn("ProfileCard", output)

    def test_render_swiftui_view(self):
        from generate import TemplateGenerator
        gen = TemplateGenerator()
        tokens = {
            "name": "SettingsView",
            "primary_color": "#7c3aed",
            "secondary_color": "#3b82f6",
            "background_color": "#ffffff",
            "text_color": "#1e293b",
            "heading_font": "Inter",
            "body_font": "Inter",
        }
        output = gen.render("swiftui-view", tokens)
        self.assertIn("SettingsView", output)

    def test_unknown_template_raises(self):
        from generate import TemplateGenerator
        gen = TemplateGenerator()
        with self.assertRaises(FileNotFoundError):
            gen.render("nonexistent", {})


if __name__ == "__main__":
    unittest.main()
