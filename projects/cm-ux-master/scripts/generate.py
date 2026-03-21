#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Code Template Generator — Generate starter code from design system tokens.

Usage:
    python3 scripts/generate.py --stack html-tailwind --type page --name "MyProject"
    python3 scripts/generate.py --stack react --type component --name "PricingCard"
    python3 scripts/generate.py --stack flutter --type widget --name "ProfileCard"
    python3 scripts/generate.py --stack swiftui --type view --name "SettingsView"
"""

import argparse
import sys
from pathlib import Path
from string import Template


TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "base"

# Map stack+type to template file
TEMPLATE_MAP = {
    "html-page": "html-page.html",
    "react-component": "react-component.tsx",
    "flutter-widget": "flutter-widget.dart",
    "swiftui-view": "swiftui-view.swift",
}

DEFAULT_TOKENS = {
    "name": "MyComponent",
    "primary_color": "#2563eb",
    "secondary_color": "#3b82f6",
    "background_color": "#ffffff",
    "text_color": "#1e293b",
    "heading_font": "Inter",
    "body_font": "Inter",
    "primary_color_hex": "2563EB",
    "secondary_color_hex": "3B82F6",
    "background_color_hex": "FFFFFF",
    "text_color_hex": "1E293B",
}


class TemplateGenerator:
    """Generate code files from design system templates."""

    def __init__(self, templates_dir: Path = None):
        self.templates_dir = templates_dir or TEMPLATES_DIR

    def list_templates(self) -> list:
        """List available template names."""
        return [k for k in TEMPLATE_MAP.keys()]

    def _load_template(self, template_name: str) -> str:
        """Load template file content."""
        filename = TEMPLATE_MAP.get(template_name)
        if not filename:
            raise FileNotFoundError(f"Template '{template_name}' not found. Available: {', '.join(TEMPLATE_MAP.keys())}")

        filepath = self.templates_dir / filename
        if not filepath.exists():
            raise FileNotFoundError(f"Template file not found: {filepath}")

        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    def render(self, template_name: str, tokens: dict) -> str:
        """Render template with design tokens."""
        raw = self._load_template(template_name)

        # Merge with defaults
        merged = {**DEFAULT_TOKENS, **tokens}

        # Auto-generate hex variants for Flutter (strip # prefix)
        for key in ["primary_color", "secondary_color", "background_color", "text_color"]:
            if key in merged:
                hex_key = f"{key}_hex"
                if hex_key not in merged:
                    merged[hex_key] = merged[key].lstrip("#").upper()

        # Use safe_substitute to avoid KeyError on unmatched placeholders
        template = Template(raw)
        return template.safe_substitute(merged)

    def generate_file(self, template_name: str, tokens: dict, output_path: str = None) -> str:
        """Render template and optionally write to file."""
        content = self.render(template_name, tokens)

        if output_path:
            output = Path(output_path)
            output.parent.mkdir(parents=True, exist_ok=True)
            with open(output, 'w', encoding='utf-8') as f:
                f.write(content)
            return f"Generated: {output}"

        return content


def main():
    parser = argparse.ArgumentParser(
        description="Generate starter code from design system templates"
    )
    parser.add_argument("--stack", required=True, choices=["html-tailwind", "react", "flutter", "swiftui"],
                       help="Target technology stack")
    parser.add_argument("--type", required=True, choices=["page", "component", "widget", "view"],
                       help="Type of file to generate")
    parser.add_argument("--name", required=True, help="Component/page name (PascalCase)")
    parser.add_argument("--output", "-o", help="Output file path (default: stdout)")
    parser.add_argument("--primary", default="#2563eb", help="Primary color hex")
    parser.add_argument("--secondary", default="#3b82f6", help="Secondary color hex")
    parser.add_argument("--background", default="#ffffff", help="Background color hex")
    parser.add_argument("--text-color", default="#1e293b", help="Text color hex")
    parser.add_argument("--heading-font", default="Inter", help="Heading font family")
    parser.add_argument("--body-font", default="Inter", help="Body font family")

    args = parser.parse_args()

    # Map stack+type to template key
    type_map = {
        ("html-tailwind", "page"): "html-page",
        ("react", "component"): "react-component",
        ("flutter", "widget"): "flutter-widget",
        ("swiftui", "view"): "swiftui-view",
    }

    template_key = type_map.get((args.stack, args.type))
    if not template_key:
        print(f"Error: No template for {args.stack}/{args.type}", file=sys.stderr)
        sys.exit(1)

    tokens = {
        "name": args.name,
        "primary_color": args.primary,
        "secondary_color": args.secondary,
        "background_color": args.background,
        "text_color": args.text_color,
        "heading_font": args.heading_font,
        "body_font": args.body_font,
    }

    gen = TemplateGenerator()
    result = gen.generate_file(template_key, tokens, args.output)
    print(result)


if __name__ == "__main__":
    main()
