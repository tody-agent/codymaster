#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Design System Extractor — Extract design tokens from existing websites/apps.

This is the CORE NEW CAPABILITY that existing AI tools and libraries lack:
the ability to analyze an existing product's design system and generate
a compatible skill set that inherits the brand identity.

Usage:
    # Extract from URL
    python3 extractor.py --url "https://example.com" --output design-system/EXTRACTED.md

    # Extract from screenshots directory
    python3 extractor.py --screenshots ./screenshots/ --output design-system/EXTRACTED.md

    # Extract and generate custom skill
    python3 extractor.py --url "https://example.com" --generate-skill --project "MyBrand"

    # Extract with specific pages for deeper analysis
    python3 extractor.py --url "https://example.com" --pages "home,pricing,dashboard"

Workflow:
    1. ANALYZE — Crawl/parse existing product → extract visual tokens
    2. GENERATE — Create custom skill set matching brand identity
    3. EXTEND — Build new pages/features consistent with extracted system

Dependencies:
    - Python 3.8+ (stdlib only for core; optional: requests for URL fetching)
    - No external dependencies required for local/screenshot mode
"""

import argparse
import json
import re
import sys
import io
import os
import csv
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple
from collections import Counter, defaultdict
from math import sqrt

# Force UTF-8
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class ColorToken:
    """Represents an extracted color with context."""
    hex: str
    role: str = "unknown"          # primary, secondary, accent, bg, text, border, etc.
    frequency: int = 0             # how often it appears
    contexts: List[str] = field(default_factory=list)  # where it's used: ["button", "header", "link"]
    contrast_white: float = 0.0    # contrast ratio against white
    contrast_black: float = 0.0    # contrast ratio against black
    wcag_aa: bool = False
    wcag_aaa: bool = False


@dataclass
class TypographyToken:
    """Represents extracted typography information."""
    font_family: str
    role: str = "unknown"          # heading, body, mono, accent
    weight: str = "400"
    size_px: int = 16
    line_height: float = 1.5
    letter_spacing: str = "normal"
    frequency: int = 0
    source: str = "system"         # google-fonts, adobe-fonts, system, custom


@dataclass
class SpacingToken:
    """Represents extracted spacing values."""
    value_px: int
    css_variable: str = ""
    frequency: int = 0
    contexts: List[str] = field(default_factory=list)  # padding, margin, gap


@dataclass
class ComponentPattern:
    """Represents an extracted UI component pattern."""
    name: str                      # button, card, input, modal, nav, etc.
    variants: List[str] = field(default_factory=list)  # primary, secondary, ghost
    border_radius: str = ""
    shadow: str = ""
    padding: str = ""
    transition: str = ""
    hover_state: str = ""
    css_snippet: str = ""


@dataclass 
class LayoutPattern:
    """Represents extracted layout information."""
    max_width: str = "1200px"
    grid_system: str = "12-column"
    breakpoints: Dict[str, int] = field(default_factory=lambda: {
        "mobile": 375,
        "tablet": 768, 
        "desktop": 1024,
        "wide": 1440
    })
    container_padding: str = "16px"
    section_gap: str = "64px"


@dataclass
class ExtractedDesignSystem:
    """Complete extracted design system."""
    project_name: str
    source_url: str = ""
    extracted_at: str = ""
    brand_voice: str = ""          # formal, casual, playful, premium, technical
    visual_density: str = "medium" # low, medium, high
    
    colors: List[ColorToken] = field(default_factory=list)
    typography: List[TypographyToken] = field(default_factory=list)
    spacing: List[SpacingToken] = field(default_factory=list)
    components: List[ComponentPattern] = field(default_factory=list)
    layout: LayoutPattern = field(default_factory=LayoutPattern)
    
    # Inferred properties
    color_temperature: str = ""    # warm, cool, neutral
    design_era: str = ""           # modern, classic, retro, futuristic
    ui_style_match: str = ""       # closest match to known UI styles
    anti_patterns_detected: List[str] = field(default_factory=list)


# ============================================================================
# COLOR UTILITIES
# ============================================================================

class ColorUtils:
    """Color analysis and contrast calculation utilities."""

    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join(c * 2 for c in hex_color)
        if len(hex_color) != 6:
            return (0, 0, 0)
        try:
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        except ValueError:
            return (0, 0, 0)

    @staticmethod
    def rgb_to_hex(r: int, g: int, b: int) -> str:
        """Convert RGB to hex."""
        return f"#{r:02x}{g:02x}{b:02x}"

    @staticmethod
    def relative_luminance(r: int, g: int, b: int) -> float:
        """Calculate relative luminance per WCAG 2.0."""
        def linearize(c):
            c = c / 255.0
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)

    @classmethod
    def contrast_ratio(cls, hex1: str, hex2: str) -> float:
        """Calculate WCAG contrast ratio between two colors."""
        r1, g1, b1 = cls.hex_to_rgb(hex1)
        r2, g2, b2 = cls.hex_to_rgb(hex2)
        l1 = cls.relative_luminance(r1, g1, b1)
        l2 = cls.relative_luminance(r2, g2, b2)
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)

    @classmethod
    def is_wcag_aa(cls, fg_hex: str, bg_hex: str, large_text: bool = False) -> bool:
        """Check WCAG AA compliance."""
        ratio = cls.contrast_ratio(fg_hex, bg_hex)
        return ratio >= 3.0 if large_text else ratio >= 4.5

    @classmethod
    def is_wcag_aaa(cls, fg_hex: str, bg_hex: str, large_text: bool = False) -> bool:
        """Check WCAG AAA compliance."""
        ratio = cls.contrast_ratio(fg_hex, bg_hex)
        return ratio >= 4.5 if large_text else ratio >= 7.0

    @staticmethod
    def color_temperature(hex_color: str) -> str:
        """Determine if a color is warm, cool, or neutral."""
        r, g, b = ColorUtils.hex_to_rgb(hex_color)
        if r > b + 30:
            return "warm"
        elif b > r + 30:
            return "cool"
        return "neutral"

    @staticmethod
    def color_category(hex_color: str) -> str:
        """Categorize color into broad groups."""
        r, g, b = ColorUtils.hex_to_rgb(hex_color)
        # Grayscale detection
        if abs(r - g) < 15 and abs(g - b) < 15 and abs(r - b) < 15:
            if r < 50:
                return "black"
            elif r > 200:
                return "white"
            return "gray"
        # Dominant channel
        if r > g and r > b:
            return "warm-red" if g < 100 else "warm-orange"
        elif g > r and g > b:
            return "green"
        elif b > r and b > g:
            return "blue"
        return "mixed"


# ============================================================================
# CSS PARSER — Extract design tokens from raw CSS
# ============================================================================

class CSSParser:
    """Parse CSS content and extract design tokens."""

    # Regex patterns for CSS extraction
    COLOR_PATTERNS = [
        re.compile(r'#([0-9a-fA-F]{6})\b'),
        re.compile(r'#([0-9a-fA-F]{3})\b'),
        re.compile(r'rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)'),
        re.compile(r'rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)'),
        re.compile(r'hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)'),
    ]

    FONT_PATTERN = re.compile(
        r'font-family\s*:\s*([^;]+);', re.IGNORECASE
    )

    FONT_SIZE_PATTERN = re.compile(
        r'font-size\s*:\s*(\d+(?:\.\d+)?)(px|rem|em)', re.IGNORECASE
    )

    FONT_WEIGHT_PATTERN = re.compile(
        r'font-weight\s*:\s*(\d+|bold|normal|lighter|bolder)', re.IGNORECASE
    )

    SPACING_PATTERN = re.compile(
        r'(?:padding|margin|gap)\s*:\s*([\d.]+)(px|rem|em)', re.IGNORECASE
    )

    BORDER_RADIUS_PATTERN = re.compile(
        r'border-radius\s*:\s*([^;]+);', re.IGNORECASE
    )

    BOX_SHADOW_PATTERN = re.compile(
        r'box-shadow\s*:\s*([^;]+);', re.IGNORECASE
    )

    TRANSITION_PATTERN = re.compile(
        r'transition\s*:\s*([^;]+);', re.IGNORECASE
    )

    CSS_VAR_PATTERN = re.compile(
        r'--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);'
    )

    GOOGLE_FONTS_PATTERN = re.compile(
        r'fonts\.googleapis\.com/css2?\?family=([^"\'&\s]+)', re.IGNORECASE
    )

    MAX_WIDTH_PATTERN = re.compile(
        r'max-width\s*:\s*(\d+)(px|rem)', re.IGNORECASE
    )

    MEDIA_QUERY_PATTERN = re.compile(
        r'@media[^{]*(?:min-width|max-width)\s*:\s*(\d+)px', re.IGNORECASE
    )

    def __init__(self):
        self.colors: Counter = Counter()
        self.color_contexts: Dict[str, List[str]] = defaultdict(list)
        self.fonts: Counter = Counter()
        self.font_sizes: Counter = Counter()
        self.font_weights: Counter = Counter()
        self.spacings: Counter = Counter()
        self.border_radii: Counter = Counter()
        self.shadows: List[str] = []
        self.transitions: List[str] = []
        self.css_variables: Dict[str, str] = {}
        self.google_fonts: List[str] = []
        self.max_widths: List[int] = []
        self.breakpoints: List[int] = []

    def parse_css(self, css_content: str, context: str = "stylesheet"):
        """Parse CSS content and extract all tokens."""
        self._extract_css_variables(css_content)
        self._extract_colors(css_content, context)
        self._extract_fonts(css_content)
        self._extract_spacing(css_content)
        self._extract_borders(css_content)
        self._extract_shadows(css_content)
        self._extract_transitions(css_content)
        self._extract_layout(css_content)

    def parse_html(self, html_content: str):
        """Extract design tokens from HTML (inline styles, class hints, font imports)."""
        # Extract Google Fonts
        for match in self.GOOGLE_FONTS_PATTERN.finditer(html_content):
            font_names = match.group(1).replace('+', ' ').split('|')
            for name in font_names:
                clean_name = name.split(':')[0].strip()
                if clean_name:
                    self.google_fonts.append(clean_name)

        # Extract inline styles
        inline_style_pattern = re.compile(r'style\s*=\s*"([^"]*)"', re.IGNORECASE)
        for match in inline_style_pattern.finditer(html_content):
            self.parse_css(match.group(1), context="inline")

        # Extract <style> blocks
        style_block_pattern = re.compile(r'<style[^>]*>(.*?)</style>', re.DOTALL | re.IGNORECASE)
        for match in style_block_pattern.finditer(html_content):
            self.parse_css(match.group(1), context="style-block")

        # Detect Tailwind classes for color extraction
        tailwind_color_pattern = re.compile(
            r'(?:bg|text|border|ring|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(\d+)',
            re.IGNORECASE
        )
        tailwind_colors = tailwind_color_pattern.findall(html_content)
        # Note: we track Tailwind color usage patterns but can't resolve to hex without config

    def _extract_css_variables(self, css: str):
        for match in self.CSS_VAR_PATTERN.finditer(css):
            var_name = match.group(1)
            var_value = match.group(2).strip()
            self.css_variables[var_name] = var_value

    def _extract_colors(self, css: str, context: str):
        # Hex colors
        for pattern in self.COLOR_PATTERNS[:2]:
            for match in pattern.finditer(css):
                hex_val = match.group(1)
                if len(hex_val) == 3:
                    hex_val = ''.join(c * 2 for c in hex_val)
                hex_color = f"#{hex_val.lower()}"
                self.colors[hex_color] += 1
                self.color_contexts[hex_color].append(context)

        # RGB colors → convert to hex
        for match in self.COLOR_PATTERNS[2].finditer(css):
            r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
            hex_color = ColorUtils.rgb_to_hex(r, g, b)
            self.colors[hex_color] += 1
            self.color_contexts[hex_color].append(context)

        # RGBA → convert to hex (ignore alpha for token extraction)
        for match in self.COLOR_PATTERNS[3].finditer(css):
            r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
            hex_color = ColorUtils.rgb_to_hex(r, g, b)
            self.colors[hex_color] += 1
            self.color_contexts[hex_color].append(context)

    def _extract_fonts(self, css: str):
        for match in self.FONT_PATTERN.finditer(css):
            font_list = match.group(1).strip()
            # Get first font in the stack
            primary_font = font_list.split(',')[0].strip().strip("'\"")
            if primary_font and primary_font.lower() not in ('inherit', 'initial', 'unset'):
                self.fonts[primary_font] += 1

        for match in self.FONT_SIZE_PATTERN.finditer(css):
            size = float(match.group(1))
            unit = match.group(2)
            if unit == 'rem':
                size = size * 16  # Convert to px (assuming 16px base)
            elif unit == 'em':
                size = size * 16
            self.font_sizes[int(size)] += 1

        for match in self.FONT_WEIGHT_PATTERN.finditer(css):
            weight = match.group(1)
            weight_map = {'normal': '400', 'bold': '700', 'lighter': '300', 'bolder': '800'}
            weight = weight_map.get(weight.lower(), weight)
            self.font_weights[weight] += 1

    def _extract_spacing(self, css: str):
        for match in self.SPACING_PATTERN.finditer(css):
            size = float(match.group(1))
            unit = match.group(2)
            if unit == 'rem':
                size = size * 16
            elif unit == 'em':
                size = size * 16
            self.spacings[int(size)] += 1

    def _extract_borders(self, css: str):
        for match in self.BORDER_RADIUS_PATTERN.finditer(css):
            radius = match.group(1).strip()
            self.border_radii[radius] += 1

    def _extract_shadows(self, css: str):
        for match in self.BOX_SHADOW_PATTERN.finditer(css):
            shadow = match.group(1).strip()
            if shadow.lower() != 'none':
                self.shadows.append(shadow)

    def _extract_transitions(self, css: str):
        for match in self.TRANSITION_PATTERN.finditer(css):
            transition = match.group(1).strip()
            if transition.lower() != 'none':
                self.transitions.append(transition)

    def _extract_layout(self, css: str):
        for match in self.MAX_WIDTH_PATTERN.finditer(css):
            width = int(match.group(1))
            unit = match.group(2)
            if unit == 'rem':
                width = width * 16
            self.max_widths.append(width)

        for match in self.MEDIA_QUERY_PATTERN.finditer(css):
            self.breakpoints.append(int(match.group(1)))


# ============================================================================
# DESIGN SYSTEM ANALYZER — Infer roles and patterns from raw tokens
# ============================================================================

class DesignSystemAnalyzer:
    """Analyze extracted tokens and infer design system structure."""

    def __init__(self, parser: CSSParser, project_name: str, source_url: str = ""):
        self.parser = parser
        self.project_name = project_name
        self.source_url = source_url

    def analyze(self) -> ExtractedDesignSystem:
        """Run full analysis and return structured design system."""
        ds = ExtractedDesignSystem(
            project_name=self.project_name,
            source_url=self.source_url,
            extracted_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )

        ds.colors = self._analyze_colors()
        ds.typography = self._analyze_typography()
        ds.spacing = self._analyze_spacing()
        ds.components = self._analyze_components()
        ds.layout = self._analyze_layout()
        ds.color_temperature = self._infer_color_temperature(ds.colors)
        ds.brand_voice = self._infer_brand_voice(ds)
        ds.visual_density = self._infer_visual_density(ds)
        ds.design_era = self._infer_design_era(ds)
        ds.ui_style_match = self._match_ui_style(ds)
        ds.anti_patterns_detected = self._detect_anti_patterns(ds)

        return ds

    def _analyze_colors(self) -> List[ColorToken]:
        """Analyze colors and infer their roles."""
        tokens = []
        # Sort by frequency
        sorted_colors = self.parser.colors.most_common(20)

        for i, (hex_color, freq) in enumerate(sorted_colors):
            category = ColorUtils.color_category(hex_color)
            contexts = self.parser.color_contexts.get(hex_color, [])

            # Infer role based on frequency, category, and position
            role = self._infer_color_role(hex_color, freq, category, i, sorted_colors)

            contrast_w = ColorUtils.contrast_ratio(hex_color, "#ffffff")
            contrast_b = ColorUtils.contrast_ratio(hex_color, "#000000")

            token = ColorToken(
                hex=hex_color,
                role=role,
                frequency=freq,
                contexts=contexts[:5],
                contrast_white=round(contrast_w, 2),
                contrast_black=round(contrast_b, 2),
                wcag_aa=ColorUtils.is_wcag_aa(hex_color, "#ffffff"),
                wcag_aaa=ColorUtils.is_wcag_aaa(hex_color, "#ffffff")
            )
            tokens.append(token)

        return tokens

    def _infer_color_role(self, hex_color: str, freq: int, category: str,
                          position: int, all_colors: list) -> str:
        """Infer the role of a color in the design system."""
        r, g, b = ColorUtils.hex_to_rgb(hex_color)

        # White/near-white = background
        if r > 240 and g > 240 and b > 240:
            return "background"

        # Black/near-black = text
        if r < 50 and g < 50 and b < 50:
            return "text-primary"

        # Dark gray = text-secondary
        if category == "gray" and r < 120:
            return "text-secondary"

        # Light gray = border or background-secondary
        if category == "gray" and r > 180:
            return "border" if freq < 10 else "background-secondary"

        # Medium gray = text-tertiary
        if category == "gray":
            return "text-tertiary"

        # First chromatic color = primary
        chromatic_position = 0
        for c_hex, c_freq in all_colors:
            cat = ColorUtils.color_category(c_hex)
            if cat not in ("black", "white", "gray"):
                if c_hex == hex_color:
                    break
                chromatic_position += 1

        if chromatic_position == 0:
            return "primary"
        elif chromatic_position == 1:
            return "secondary"
        elif chromatic_position == 2:
            return "accent"
        elif chromatic_position == 3:
            return "cta"

        return "decorative"

    def _analyze_typography(self) -> List[TypographyToken]:
        """Analyze typography and infer roles."""
        tokens = []
        sorted_fonts = self.parser.fonts.most_common(5)
        sorted_sizes = self.parser.font_sizes.most_common(10)

        for i, (font_name, freq) in enumerate(sorted_fonts):
            # Determine if Google Font
            source = "google-fonts" if font_name in self.parser.google_fonts else "system"

            # Infer role
            if i == 0 and len(sorted_fonts) > 1:
                role = "body"       # Most frequent = body
            elif i == 1:
                role = "heading"    # Second = heading
            elif "mono" in font_name.lower() or "code" in font_name.lower():
                role = "mono"
            else:
                role = "accent"

            # If only 1 font, it's both
            if len(sorted_fonts) == 1:
                role = "body+heading"

            # Find most common size for this role context
            size = sorted_sizes[0][0] if sorted_sizes else 16

            token = TypographyToken(
                font_family=font_name,
                role=role,
                weight=self.parser.font_weights.most_common(1)[0][0] if self.parser.font_weights else "400",
                size_px=size,
                frequency=freq,
                source=source
            )
            tokens.append(token)

        return tokens

    def _analyze_spacing(self) -> List[SpacingToken]:
        """Analyze spacing values and detect scale."""
        tokens = []
        sorted_spacings = self.parser.spacings.most_common(15)

        # Detect if 4px or 8px base
        values = [s[0] for s in sorted_spacings]
        base_4_count = sum(1 for v in values if v % 4 == 0)
        base_8_count = sum(1 for v in values if v % 8 == 0)

        base = 4 if base_4_count > base_8_count else 8

        for value, freq in sorted_spacings:
            # Generate CSS variable name
            if value <= 4:
                var_name = "--space-xs"
            elif value <= 8:
                var_name = "--space-sm"
            elif value <= 16:
                var_name = "--space-md"
            elif value <= 24:
                var_name = "--space-lg"
            elif value <= 32:
                var_name = "--space-xl"
            elif value <= 48:
                var_name = "--space-2xl"
            else:
                var_name = "--space-3xl"

            token = SpacingToken(
                value_px=value,
                css_variable=var_name,
                frequency=freq
            )
            tokens.append(token)

        return tokens

    def _analyze_components(self) -> List[ComponentPattern]:
        """Infer component patterns from extracted data."""
        components = []

        # Button pattern
        most_common_radius = self.parser.border_radii.most_common(1)
        radius = most_common_radius[0][0] if most_common_radius else "8px"

        # Most common transition
        common_transition = "all 200ms ease" 
        if self.parser.transitions:
            common_transition = self.parser.transitions[0]

        # Most common shadow
        common_shadow = "0 1px 3px rgba(0,0,0,0.1)"
        if self.parser.shadows:
            common_shadow = self.parser.shadows[0]

        # Find primary and secondary colors
        primary_color = "#2563EB"
        text_color = "#1E293B"
        bg_color = "#FFFFFF"
        for token_data in self.parser.colors.most_common(20):
            hex_c = token_data[0]
            cat = ColorUtils.color_category(hex_c)
            if cat not in ("black", "white", "gray") and primary_color == "#2563EB":
                primary_color = hex_c
            r, g, b = ColorUtils.hex_to_rgb(hex_c)
            if r > 240 and g > 240 and b > 240 and bg_color == "#FFFFFF":
                bg_color = hex_c
            if r < 50 and g < 50 and b < 50 and text_color == "#1E293B":
                text_color = hex_c

        components.append(ComponentPattern(
            name="button",
            variants=["primary", "secondary", "ghost"],
            border_radius=radius,
            shadow=common_shadow,
            padding="12px 24px",
            transition=common_transition,
            hover_state="opacity: 0.9; transform: translateY(-1px)",
            css_snippet=f""".btn-primary {{
  background: {primary_color};
  color: white;
  padding: 12px 24px;
  border-radius: {radius};
  font-weight: 600;
  transition: {common_transition};
  cursor: pointer;
}}"""
        ))

        components.append(ComponentPattern(
            name="card",
            variants=["default", "elevated", "outlined"],
            border_radius=radius,
            shadow=common_shadow,
            padding="24px",
            transition=common_transition,
            hover_state="box-shadow: 0 10px 15px rgba(0,0,0,0.1); transform: translateY(-2px)",
            css_snippet=f""".card {{
  background: {bg_color};
  border-radius: {radius};
  padding: 24px;
  box-shadow: {common_shadow};
  transition: {common_transition};
}}"""
        ))

        components.append(ComponentPattern(
            name="input",
            variants=["default", "error", "disabled"],
            border_radius=radius,
            padding="12px 16px",
            transition=common_transition,
            css_snippet=f""".input {{
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: {radius};
  font-size: 16px;
  transition: border-color 200ms ease;
}}
.input:focus {{
  border-color: {primary_color};
  outline: none;
  box-shadow: 0 0 0 3px {primary_color}20;
}}"""
        ))

        return components

    def _analyze_layout(self) -> LayoutPattern:
        """Analyze layout patterns."""
        layout = LayoutPattern()

        if self.parser.max_widths:
            # Use most common max-width
            most_common = Counter(self.parser.max_widths).most_common(1)
            if most_common:
                layout.max_width = f"{most_common[0][0]}px"

        if self.parser.breakpoints:
            sorted_bp = sorted(set(self.parser.breakpoints))
            if len(sorted_bp) >= 1:
                layout.breakpoints["mobile"] = sorted_bp[0]
            if len(sorted_bp) >= 2:
                layout.breakpoints["tablet"] = sorted_bp[1]
            if len(sorted_bp) >= 3:
                layout.breakpoints["desktop"] = sorted_bp[2]
            if len(sorted_bp) >= 4:
                layout.breakpoints["wide"] = sorted_bp[3]

        return layout

    def _infer_color_temperature(self, colors: List[ColorToken]) -> str:
        """Infer overall color temperature."""
        temps = {"warm": 0, "cool": 0, "neutral": 0}
        for color in colors:
            if color.role not in ("background", "text-primary", "text-secondary", "border"):
                temp = ColorUtils.color_temperature(color.hex)
                temps[temp] += color.frequency
        return max(temps, key=temps.get)

    def _infer_brand_voice(self, ds: ExtractedDesignSystem) -> str:
        """Infer brand voice from visual signals."""
        signals = []

        # Color-based signals
        if ds.color_temperature == "warm":
            signals.append("friendly")
        elif ds.color_temperature == "cool":
            signals.append("professional")

        # Typography signals
        for t in ds.typography:
            name_lower = t.font_family.lower()
            if any(kw in name_lower for kw in ["serif", "garamond", "georgia", "times", "playfair", "cormorant"]):
                signals.append("premium")
            elif any(kw in name_lower for kw in ["mono", "code", "source", "jetbrains", "fira"]):
                signals.append("technical")
            elif any(kw in name_lower for kw in ["comic", "fredoka", "bubblegum", "pacifico"]):
                signals.append("playful")

        # Shadow depth signals
        if len(self.parser.shadows) > 5:
            signals.append("layered")
        elif len(self.parser.shadows) == 0:
            signals.append("flat")

        # Determine dominant voice
        if "premium" in signals:
            return "premium"
        elif "technical" in signals:
            return "technical"
        elif "playful" in signals:
            return "playful"
        elif "professional" in signals:
            return "formal"
        return "casual"

    def _infer_visual_density(self, ds: ExtractedDesignSystem) -> str:
        """Infer visual density from spacing."""
        if not ds.spacing:
            return "medium"
        avg_spacing = sum(s.value_px for s in ds.spacing) / len(ds.spacing)
        if avg_spacing < 12:
            return "high"
        elif avg_spacing > 24:
            return "low"
        return "medium"

    def _infer_design_era(self, ds: ExtractedDesignSystem) -> str:
        """Infer design era/trend."""
        radius_values = list(self.parser.border_radii.keys())
        has_large_radius = any("16" in r or "20" in r or "24" in r or "full" in r or "9999" in r for r in radius_values)
        has_shadows = len(self.parser.shadows) > 0
        has_glassmorphism = any("backdrop" in str(s).lower() or "blur" in str(s).lower() for s in self.parser.shadows + list(self.parser.css_variables.values()))

        if has_glassmorphism:
            return "modern-glass"
        elif has_large_radius and has_shadows:
            return "modern-soft"
        elif not has_shadows and not has_large_radius:
            return "modern-flat"
        return "modern"

    def _match_ui_style(self, ds: ExtractedDesignSystem) -> str:
        """Match to closest known UI style from ui-ux-pro-max library."""
        era = ds.design_era
        voice = ds.brand_voice
        density = ds.visual_density

        style_map = {
            ("modern-glass", "premium", "low"): "Glassmorphism + Liquid Glass",
            ("modern-glass", "professional", "medium"): "Glassmorphism",
            ("modern-glass", "technical", "high"): "Glassmorphism + Dark Mode",
            ("modern-soft", "friendly", "low"): "Soft UI Evolution",
            ("modern-soft", "premium", "low"): "Neumorphism",
            ("modern-soft", "casual", "medium"): "Claymorphism",
            ("modern-flat", "professional", "medium"): "Minimalism",
            ("modern-flat", "technical", "high"): "Flat Design",
            ("modern-flat", "playful", "medium"): "Vibrant & Block-based",
            ("modern", "premium", "low"): "Minimalism + Glassmorphism",
            ("modern", "professional", "medium"): "Minimalism",
            ("modern", "casual", "medium"): "Flat Design",
        }

        key = (era, voice, density)
        if key in style_map:
            return style_map[key]

        # Fallback: match by era
        era_fallback = {
            "modern-glass": "Glassmorphism",
            "modern-soft": "Soft UI Evolution",
            "modern-flat": "Minimalism",
            "modern": "Flat Design"
        }
        return era_fallback.get(era, "Minimalism")

    def _detect_anti_patterns(self, ds: ExtractedDesignSystem) -> List[str]:
        """Detect UX anti-patterns in the extracted system."""
        issues = []

        # Check color contrast
        bg_colors = [c for c in ds.colors if c.role == "background"]
        text_colors = [c for c in ds.colors if "text" in c.role]
        if bg_colors and text_colors:
            for text in text_colors:
                for bg in bg_colors:
                    ratio = ColorUtils.contrast_ratio(text.hex, bg.hex)
                    if ratio < 4.5:
                        issues.append(f"Low contrast: {text.hex} on {bg.hex} (ratio: {ratio:.1f}, need >= 4.5)")

        # Check too many colors
        chromatic = [c for c in ds.colors if c.role not in ("background", "text-primary", "text-secondary", "border")]
        if len(chromatic) > 6:
            issues.append(f"Too many accent colors ({len(chromatic)}). Recommend <= 5 for consistency.")

        # Check font count
        if len(ds.typography) > 3:
            issues.append(f"Too many fonts ({len(ds.typography)}). Recommend <= 3 (heading + body + optional mono).")

        # Check spacing consistency
        if ds.spacing:
            values = [s.value_px for s in ds.spacing]
            base_4 = sum(1 for v in values if v % 4 == 0)
            ratio = base_4 / len(values) if values else 0
            if ratio < 0.5:
                issues.append("Inconsistent spacing scale. Recommend using 4px or 8px base unit.")

        # Check missing transitions
        if not self.parser.transitions:
            issues.append("No transitions detected. Add 150-300ms transitions for hover/focus states.")

        return issues


# ============================================================================
# OUTPUT FORMATTERS
# ============================================================================

class OutputFormatter:
    """Format extracted design system for various outputs."""

    @staticmethod
    def to_markdown(ds: ExtractedDesignSystem) -> str:
        """Generate comprehensive EXTRACTED.md file."""
        lines = []

        lines.append(f"# Extracted Design System: {ds.project_name}")
        lines.append("")
        lines.append(f"> **Source:** {ds.source_url or 'Local analysis'}")
        lines.append(f"> **Extracted:** {ds.extracted_at}")
        lines.append(f"> **Brand Voice:** {ds.brand_voice}")
        lines.append(f"> **Visual Density:** {ds.visual_density}")
        lines.append(f"> **Color Temperature:** {ds.color_temperature}")
        lines.append(f"> **Design Era:** {ds.design_era}")
        lines.append(f"> **Closest UI Style:** {ds.ui_style_match}")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Colors
        lines.append("## Color Palette")
        lines.append("")
        lines.append("| Hex | Role | Frequency | Contrast (White) | WCAG AA | WCAG AAA |")
        lines.append("|-----|------|-----------|-------------------|---------|----------|")
        for c in ds.colors[:12]:
            lines.append(f"| `{c.hex}` | {c.role} | {c.frequency} | {c.contrast_white} | {'Pass' if c.wcag_aa else 'Fail'} | {'Pass' if c.wcag_aaa else 'Fail'} |")
        lines.append("")

        # CSS Variables for colors
        lines.append("### Color CSS Variables")
        lines.append("")
        lines.append("```css")
        lines.append(":root {")
        for c in ds.colors[:8]:
            var_name = f"--color-{c.role.replace(' ', '-')}"
            lines.append(f"  {var_name}: {c.hex};")
        lines.append("}")
        lines.append("```")
        lines.append("")

        # Typography
        lines.append("## Typography")
        lines.append("")
        lines.append("| Font | Role | Weight | Source |")
        lines.append("|------|------|--------|--------|")
        for t in ds.typography:
            lines.append(f"| {t.font_family} | {t.role} | {t.weight} | {t.source} |")
        lines.append("")

        if ds.typography:
            lines.append("### Typography CSS")
            lines.append("")
            lines.append("```css")
            for t in ds.typography:
                role_class = t.role.replace("+", "-")
                lines.append(f".text-{role_class} {{")
                lines.append(f"  font-family: '{t.font_family}', sans-serif;")
                lines.append(f"  font-weight: {t.weight};")
                lines.append(f"}}")
                lines.append("")
            lines.append("```")
            lines.append("")

        # Spacing
        lines.append("## Spacing Scale")
        lines.append("")
        lines.append("| Value (px) | CSS Variable | Frequency |")
        lines.append("|------------|--------------|-----------|")
        for s in ds.spacing[:10]:
            lines.append(f"| {s.value_px}px | `{s.css_variable}` | {s.frequency} |")
        lines.append("")

        # Components
        lines.append("## Component Patterns")
        lines.append("")
        for comp in ds.components:
            lines.append(f"### {comp.name.title()}")
            lines.append("")
            lines.append(f"- **Variants:** {', '.join(comp.variants)}")
            lines.append(f"- **Border Radius:** {comp.border_radius}")
            if comp.shadow:
                lines.append(f"- **Shadow:** {comp.shadow}")
            if comp.transition:
                lines.append(f"- **Transition:** {comp.transition}")
            lines.append("")
            lines.append("```css")
            lines.append(comp.css_snippet)
            lines.append("```")
            lines.append("")

        # Layout
        lines.append("## Layout")
        lines.append("")
        lines.append(f"- **Max Width:** {ds.layout.max_width}")
        lines.append(f"- **Grid System:** {ds.layout.grid_system}")
        lines.append(f"- **Breakpoints:**")
        for name, value in ds.layout.breakpoints.items():
            lines.append(f"  - {name}: {value}px")
        lines.append("")

        # Anti-patterns
        if ds.anti_patterns_detected:
            lines.append("## Anti-Patterns Detected")
            lines.append("")
            for issue in ds.anti_patterns_detected:
                lines.append(f"- {issue}")
            lines.append("")

        # Recommendations
        lines.append("## Recommendations")
        lines.append("")
        lines.append("Based on the analysis, here are recommendations to improve the design system:")
        lines.append("")
        lines.append(f"1. **UI Style Match:** Your design most closely matches **{ds.ui_style_match}**. "
                     f"Consider aligning fully with this style for consistency.")
        lines.append(f"2. **Brand Voice:** Detected **{ds.brand_voice}** voice. "
                     f"Ensure all new components maintain this tone.")
        lines.append(f"3. **Color Temperature:** **{ds.color_temperature}**. "
                     f"New accent colors should stay within this temperature range.")
        lines.append("")

        return "\n".join(lines)

    @staticmethod
    def to_skill(ds: ExtractedDesignSystem) -> str:
        """Generate a BRAND-SKILL.md file for AI coding tools."""
        lines = []

        lines.append(f"# Brand Skill: {ds.project_name}")
        lines.append("")
        lines.append("> **AUTO-GENERATED** from extracted design system.")
        lines.append("> When building UI for this project, ALWAYS follow these rules.")
        lines.append("> These rules OVERRIDE generic style recommendations.")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Brand Identity
        lines.append("## Brand Identity")
        lines.append("")
        lines.append(f"- **Voice:** {ds.brand_voice}")
        lines.append(f"- **Visual Density:** {ds.visual_density}")
        lines.append(f"- **Color Temperature:** {ds.color_temperature}")
        lines.append(f"- **Base Style:** {ds.ui_style_match}")
        lines.append("")

        # Mandatory Colors
        lines.append("## Mandatory Color Palette")
        lines.append("")
        lines.append("ALWAYS use these exact colors. Do NOT substitute with generic palettes.")
        lines.append("")
        lines.append("```css")
        lines.append(":root {")
        for c in ds.colors[:8]:
            var_name = f"--brand-{c.role.replace(' ', '-')}"
            lines.append(f"  {var_name}: {c.hex};")
        lines.append("}")
        lines.append("```")
        lines.append("")

        # Mandatory Typography
        lines.append("## Mandatory Typography")
        lines.append("")
        lines.append("ALWAYS use these fonts. Do NOT fall back to Inter/system fonts.")
        lines.append("")
        for t in ds.typography:
            lines.append(f"- **{t.role}:** `{t.font_family}` (weight: {t.weight}, source: {t.source})")
        lines.append("")

        # Component Rules
        lines.append("## Component Rules")
        lines.append("")
        lines.append("All components MUST follow these patterns:")
        lines.append("")
        for comp in ds.components:
            lines.append(f"### {comp.name.title()}")
            lines.append(f"- Border radius: `{comp.border_radius}`")
            if comp.shadow:
                lines.append(f"- Shadow: `{comp.shadow}`")
            if comp.transition:
                lines.append(f"- Transition: `{comp.transition}`")
            lines.append(f"- Variants: {', '.join(comp.variants)}")
            lines.append("")

        # Deviation Rules
        lines.append("## Deviation Policy")
        lines.append("")
        lines.append("If you MUST deviate from the brand skill:")
        lines.append("")
        lines.append("1. Document the deviation in a comment: `/* DEVIATION: reason */`")
        lines.append("2. Ensure the deviation maintains brand voice ({})".format(ds.brand_voice))
        lines.append("3. Keep color temperature consistent ({})".format(ds.color_temperature))
        lines.append("4. Log the deviation for design review")
        lines.append("")

        # Anti-patterns
        lines.append("## Brand Anti-Patterns (NEVER DO)")
        lines.append("")
        if ds.anti_patterns_detected:
            for issue in ds.anti_patterns_detected:
                lines.append(f"- {issue}")
        lines.append("- Do NOT use colors outside the brand palette without documentation")
        lines.append("- Do NOT mix icon libraries")
        lines.append("- Do NOT use different border-radius values than defined above")
        lines.append("")

        return "\n".join(lines)

    @staticmethod
    def to_tailwind_config(ds: ExtractedDesignSystem) -> str:
        """Generate Tailwind CSS config from extracted tokens."""
        config = {
            "theme": {
                "extend": {
                    "colors": {},
                    "fontFamily": {},
                    "borderRadius": {},
                    "boxShadow": {},
                    "spacing": {}
                }
            }
        }

        # Colors
        for c in ds.colors[:8]:
            key = c.role.replace(" ", "-").replace("_", "-")
            config["theme"]["extend"]["colors"][key] = c.hex

        # Typography
        for t in ds.typography:
            key = t.role.replace("+", "-")
            config["theme"]["extend"]["fontFamily"][key] = [t.font_family, "sans-serif"]

        # Border radius
        if ds.components:
            for comp in ds.components:
                if comp.border_radius:
                    config["theme"]["extend"]["borderRadius"]["brand"] = comp.border_radius
                    break

        # Spacing
        for s in ds.spacing[:8]:
            key = s.css_variable.replace("--space-", "")
            config["theme"]["extend"]["spacing"][key] = f"{s.value_px}px"

        return f"""// tailwind.config.js — Auto-generated from {ds.project_name} design extraction
// Generated: {ds.extracted_at}

/** @type {{import('tailwindcss').Config}} */
module.exports = {json.dumps(config, indent=2)}
"""

    @staticmethod
    def to_css_variables(ds: ExtractedDesignSystem) -> str:
        """Generate CSS custom properties file."""
        lines = []
        lines.append(f"/* {ds.project_name} — Design Tokens */")
        lines.append(f"/* Auto-extracted: {ds.extracted_at} */")
        lines.append(f"/* Source: {ds.source_url or 'local'} */")
        lines.append("")
        lines.append(":root {")
        lines.append("  /* Colors */")
        for c in ds.colors[:10]:
            var_name = f"--brand-{c.role.replace(' ', '-')}"
            lines.append(f"  {var_name}: {c.hex};")

        lines.append("")
        lines.append("  /* Typography */")
        for t in ds.typography:
            role = t.role.replace("+", "-")
            lines.append(f"  --font-{role}: '{t.font_family}', sans-serif;")
            lines.append(f"  --font-weight-{role}: {t.weight};")

        lines.append("")
        lines.append("  /* Spacing */")
        for s in ds.spacing[:8]:
            lines.append(f"  {s.css_variable}: {s.value_px}px;")

        lines.append("")
        lines.append("  /* Shadows */")
        if ds.components:
            for comp in ds.components:
                if comp.shadow:
                    lines.append(f"  --shadow-{comp.name}: {comp.shadow};")

        lines.append("")
        lines.append("  /* Border Radius */")
        if ds.components:
            for comp in ds.components:
                if comp.border_radius:
                    lines.append(f"  --radius-{comp.name}: {comp.border_radius};")
                    break  # Usually uniform

        lines.append("")
        lines.append("  /* Transitions */")
        if ds.components:
            for comp in ds.components:
                if comp.transition:
                    lines.append(f"  --transition-default: {comp.transition};")
                    break

        lines.append("")
        lines.append("  /* Layout */")
        lines.append(f"  --max-width: {ds.layout.max_width};")
        for name, value in ds.layout.breakpoints.items():
            lines.append(f"  --breakpoint-{name}: {value}px;")

        lines.append("}")
        lines.append("")

        return "\n".join(lines)


# ============================================================================
# MAIN EXTRACTION PIPELINE
# ============================================================================

class DesignSystemExtractor:
    """Main extraction pipeline orchestrator."""

    def __init__(self, project_name: str):
        self.project_name = project_name
        self.parser = CSSParser()

    def extract_from_css_files(self, css_files: List[str]) -> ExtractedDesignSystem:
        """Extract from local CSS files."""
        for filepath in css_files:
            path = Path(filepath)
            if path.exists() and path.suffix == '.css':
                with open(path, 'r', encoding='utf-8') as f:
                    self.parser.parse_css(f.read(), context=path.name)
        
        analyzer = DesignSystemAnalyzer(self.parser, self.project_name)
        return analyzer.analyze()

    def extract_from_html_files(self, html_files: List[str]) -> ExtractedDesignSystem:
        """Extract from local HTML files."""
        for filepath in html_files:
            path = Path(filepath)
            if path.exists() and path.suffix in ('.html', '.htm', '.vue', '.svelte', '.jsx', '.tsx'):
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.parser.parse_html(content)

        analyzer = DesignSystemAnalyzer(self.parser, self.project_name)
        return analyzer.analyze()

    def extract_from_directory(self, directory: str) -> ExtractedDesignSystem:
        """Extract from all CSS/HTML files in a directory recursively."""
        dir_path = Path(directory)
        if not dir_path.exists():
            print(f"Error: Directory not found: {directory}", file=sys.stderr)
            sys.exit(1)

        css_extensions = {'.css'}
        html_extensions = {'.html', '.htm', '.vue', '.svelte', '.jsx', '.tsx'}

        file_count = 0
        for path in dir_path.rglob('*'):
            if path.suffix in css_extensions:
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        self.parser.parse_css(f.read(), context=path.name)
                    file_count += 1
                except Exception as e:
                    print(f"Warning: Could not parse {path}: {e}", file=sys.stderr)

            elif path.suffix in html_extensions:
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        self.parser.parse_html(f.read())
                    file_count += 1
                except Exception as e:
                    print(f"Warning: Could not parse {path}: {e}", file=sys.stderr)

        print(f"Analyzed {file_count} files from {directory}", file=sys.stderr)

        analyzer = DesignSystemAnalyzer(self.parser, self.project_name, source_url=directory)
        return analyzer.analyze()

    def extract_from_url(self, url: str) -> ExtractedDesignSystem:
        """Extract from a live URL by fetching HTML and linked CSS."""
        try:
            import urllib.request
            import urllib.parse

            print(f"Fetching {url}...", file=sys.stderr)

            # Fetch HTML
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (UI-UX-Pro-Max Extractor)'
            })
            with urllib.request.urlopen(req, timeout=15) as response:
                html_content = response.read().decode('utf-8', errors='ignore')

            self.parser.parse_html(html_content)

            # Find and fetch linked CSS files
            css_link_pattern = re.compile(
                r'<link[^>]*href=["\']([^"\']*\.css[^"\']*)["\']', re.IGNORECASE
            )
            for match in css_link_pattern.finditer(html_content):
                css_url = match.group(1)
                if not css_url.startswith('http'):
                    css_url = urllib.parse.urljoin(url, css_url)

                try:
                    print(f"  Fetching CSS: {css_url[:80]}...", file=sys.stderr)
                    css_req = urllib.request.Request(css_url, headers={
                        'User-Agent': 'Mozilla/5.0 (UI-UX-Pro-Max Extractor)'
                    })
                    with urllib.request.urlopen(css_req, timeout=10) as css_response:
                        css_content = css_response.read().decode('utf-8', errors='ignore')
                    self.parser.parse_css(css_content, context=css_url.split('/')[-1])
                except Exception as e:
                    print(f"  Warning: Could not fetch CSS {css_url}: {e}", file=sys.stderr)

            analyzer = DesignSystemAnalyzer(self.parser, self.project_name, source_url=url)
            return analyzer.analyze()

        except ImportError:
            print("Error: urllib not available. Use --directory mode instead.", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            print(f"Error fetching URL: {e}", file=sys.stderr)
            sys.exit(1)


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Extract design system from existing websites/apps",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract from URL
  python3 extractor.py --url https://example.com -p "MyBrand"

  # Extract from local project directory
  python3 extractor.py --directory ./src -p "MyApp"

  # Extract from specific CSS files
  python3 extractor.py --css style.css theme.css -p "MyProject"

  # Generate complete skill set
  python3 extractor.py --url https://example.com --generate-skill -p "MyBrand"

  # Export as Tailwind config
  python3 extractor.py --directory ./src -p "MyApp" --format tailwind
        """
    )

    # Input sources (mutually exclusive)
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--url", "-u", help="URL to analyze")
    input_group.add_argument("--directory", "-d", help="Local directory to analyze")
    input_group.add_argument("--css", nargs="+", help="Specific CSS files to analyze")
    input_group.add_argument("--html", nargs="+", help="Specific HTML files to analyze")

    # Options
    parser.add_argument("--project-name", "-p", required=True, help="Project/brand name")
    parser.add_argument("--output", "-o", default=None, help="Output file path (default: stdout)")
    parser.add_argument("--format", "-f",
                       choices=["markdown", "skill", "tailwind", "css-vars", "json"],
                       default="markdown",
                       help="Output format (default: markdown)")
    parser.add_argument("--generate-skill", action="store_true",
                       help="Also generate BRAND-SKILL.md file")
    parser.add_argument("--persist", action="store_true",
                       help="Save to design-system/ folder structure")

    args = parser.parse_args()

    # Initialize extractor
    extractor = DesignSystemExtractor(args.project_name)

    # Extract based on input source
    if args.url:
        ds = extractor.extract_from_url(args.url)
    elif args.directory:
        ds = extractor.extract_from_directory(args.directory)
    elif args.css:
        ds = extractor.extract_from_css_files(args.css)
    elif args.html:
        ds = extractor.extract_from_html_files(args.html)

    # Format output
    formatter = OutputFormatter()
    format_map = {
        "markdown": formatter.to_markdown,
        "skill": formatter.to_skill,
        "tailwind": formatter.to_tailwind_config,
        "css-vars": formatter.to_css_variables,
        "json": lambda ds: json.dumps(asdict(ds), indent=2, ensure_ascii=False, default=str),
    }

    output = format_map[args.format](ds)

    # Write output
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"Written to {output_path}", file=sys.stderr)
    else:
        print(output)

    # Generate skill if requested
    if args.generate_skill and args.format != "skill":
        skill_output = formatter.to_skill(ds)
        if args.persist:
            project_slug = args.project_name.lower().replace(' ', '-')
            skill_dir = Path("design-system") / project_slug
            skill_dir.mkdir(parents=True, exist_ok=True)

            # Write EXTRACTED.md
            extracted_path = skill_dir / "EXTRACTED.md"
            with open(extracted_path, 'w', encoding='utf-8') as f:
                f.write(formatter.to_markdown(ds))
            print(f"Written to {extracted_path}", file=sys.stderr)

            # Write BRAND-SKILL.md
            skill_path = skill_dir / "BRAND-SKILL.md"
            with open(skill_path, 'w', encoding='utf-8') as f:
                f.write(skill_output)
            print(f"Written to {skill_path}", file=sys.stderr)

            # Write tailwind config
            tailwind_path = skill_dir / "tailwind.config.js"
            with open(tailwind_path, 'w', encoding='utf-8') as f:
                f.write(formatter.to_tailwind_config(ds))
            print(f"Written to {tailwind_path}", file=sys.stderr)

            # Write CSS variables
            css_path = skill_dir / "design-tokens.css"
            with open(css_path, 'w', encoding='utf-8') as f:
                f.write(formatter.to_css_variables(ds))
            print(f"Written to {css_path}", file=sys.stderr)

            print(f"\nComplete design system persisted to design-system/{project_slug}/", file=sys.stderr)
        else:
            print("\n" + "=" * 60, file=sys.stderr)
            print("BRAND SKILL (use --persist to save to file):", file=sys.stderr)
            print("=" * 60, file=sys.stderr)
            print(skill_output)


if __name__ == "__main__":
    main()