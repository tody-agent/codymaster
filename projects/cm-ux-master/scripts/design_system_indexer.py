#!/usr/bin/env python3
"""
Design System Indexer v4 — Semi Design Architecture Reconstruction

Phân tích và tái hiện toàn diện design system dựa trên kiến trúc Semi Design:
- Color System (Primary, Secondary, Neutrals, Semantics)
- Typography System (Font families, sizes, weights, line-heights)
- Spacing System (4px base scale)
- Border & Radius System
- Shadow System
- Component Architecture
- Layout Patterns

Kiến trúc tham khảo: DouyinFE/semi-design

Usage:
    python design_system_indexer.py --input harvest.json --project MyApp
    python design_system_indexer.py --input harvest.json --output ./design-system
    python design_system_indexer.py --multi ./harvests/*.json --merge

Author: UX Master AI
Version: 4.0.0
"""

import json
import re
import colorsys
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime
import argparse
import sys


# ============ SEMI DESIGN TOKEN SPECIFICATION ============

SEMI_COLOR_TOKENS = {
    # Brand Colors
    "primary": "--semi-color-primary",
    "secondary": "--semi-color-secondary",
    "tertiary": "--semi-color-tertiary",
    
    # Semantic Colors
    "success": "--semi-color-success",
    "warning": "--semi-color-warning",
    "danger": "--semi-color-danger",
    "info": "--semi-color-info",
    
    # Neutral Scale
    "neutral-50": "--semi-color-neutral-50",
    "neutral-100": "--semi-color-neutral-100",
    "neutral-200": "--semi-color-neutral-200",
    "neutral-300": "--semi-color-neutral-300",
    "neutral-400": "--semi-color-neutral-400",
    "neutral-500": "--semi-color-neutral-500",
    "neutral-600": "--semi-color-neutral-600",
    "neutral-700": "--semi-color-neutral-700",
    "neutral-800": "--semi-color-neutral-800",
    "neutral-900": "--semi-color-neutral-900",
    
    # Background Colors
    "bg-0": "--semi-color-bg-0",
    "bg-1": "--semi-color-bg-1",
    "bg-2": "--semi-color-bg-2",
    "bg-3": "--semi-color-bg-3",
    "bg-4": "--semi-color-bg-4",
    
    # Fill Colors
    "fill-0": "--semi-color-fill-0",
    "fill-1": "--semi-color-fill-1",
    "fill-2": "--semi-color-fill-2",
    
    # Text Colors
    "text-0": "--semi-color-text-0",
    "text-1": "--semi-color-text-1",
    "text-2": "--semi-color-text-2",
    "text-3": "--semi-color-text-3",
    
    # Border & Divider
    "border": "--semi-color-border",
    "focus-border": "--semi-color-focus-border",
    
    # Disabled States
    "disabled-bg": "--semi-color-disabled-bg",
    "disabled-text": "--semi-color-disabled-text",
    "disabled-border": "--semi-color-disabled-border",
    
    # Link Colors
    "link": "--semi-color-link",
    "link-hover": "--semi-color-link-hover",
    "link-active": "--semi-color-link-active",
    "link-visited": "--semi-color-link-visited",
    
    # Special
    "white": "--semi-color-white",
    "black": "--semi-color-black",
    "overlay": "--semi-color-overlay-bg",
    "nav-bg": "--semi-color-nav-bg",
    "shadow": "--semi-color-shadow",
    "highlight-bg": "--semi-color-highlight-bg",
    "highlight": "--semi-color-highlight",
}

SEMI_TYPOGRAPHY_TOKENS = {
    "font-family-regular": "--semi-font-family-regular",
    "font-family-light": "--semi-font-family-light",
    "font-family-bold": "--semi-font-family-bold",
    
    "font-size-extra-small": "--semi-font-size-extra-small",
    "font-size-small": "--semi-font-size-small",
    "font-size-regular": "--semi-font-size-regular",
    "font-size-header-6": "--semi-font-size-header-6",
    "font-size-header-5": "--semi-font-size-header-5",
    "font-size-header-4": "--semi-font-size-header-4",
    "font-size-header-3": "--semi-font-size-header-3",
    "font-size-header-2": "--semi-font-size-header-2",
    "font-size-header-1": "--semi-font-size-header-1",
    
    "font-weight-light": "--semi-font-weight-light",
    "font-weight-regular": "--semi-font-weight-regular",
    "font-weight-medium": "--semi-font-weight-medium",
    "font-weight-semibold": "--semi-font-weight-semibold",
    "font-weight-bold": "--semi-font-weight-bold",
    
    "line-height-regular": "--semi-line-height-regular",
    "line-height-loose": "--semi-line-height-loose",
}

SEMI_SPACING_TOKENS = {
    "spacing-none": "--semi-spacing-none",
    "spacing-super-tight": "--semi-spacing-super-tight",
    "spacing-extra-tight": "--semi-spacing-extra-tight",
    "spacing-tight": "--semi-spacing-tight",
    "spacing-base-tight": "--semi-spacing-base-tight",
    "spacing-base": "--semi-spacing-base",
    "spacing-base-loose": "--semi-spacing-base-loose",
    "spacing-loose": "--semi-spacing-loose",
    "spacing-extra-loose": "--semi-spacing-extra-loose",
    "spacing-super-loose": "--semi-spacing-super-loose",
}

SEMI_BORDER_TOKENS = {
    "border-thickness": "--semi-border-thickness",
    "border-thickness-control": "--semi-border-thickness-control",
    "border-thickness-control-focus": "--semi-border-thickness-control-focus",
    
    "border-radius-extra-small": "--semi-border-radius-extra-small",
    "border-radius-small": "--semi-border-radius-small",
    "border-radius-medium": "--semi-border-radius-medium",
    "border-radius-large": "--semi-border-radius-large",
    "border-radius-circle": "--semi-border-radius-circle",
    "border-radius-full": "--semi-border-radius-full",
}

SEMI_SHADOW_TOKENS = {
    "shadow-sm": "--semi-shadow-sm",
    "shadow-elevated": "--semi-shadow-elevated",
    "shadow-lg": "--semi-shadow-lg",
}

SEMI_SIZING_TOKENS = {
    "height-control-small": "--semi-height-control-small",
    "height-control-default": "--semi-height-control-default",
    "height-control-large": "--semi-height-control-large",
    
    "width-icon-extra-small": "--semi-width-icon-extra-small",
    "width-icon-small": "--semi-width-icon-small",
    "width-icon-medium": "--semi-width-icon-medium",
    "width-icon-large": "--semi-width-icon-large",
    "width-icon-extra-large": "--semi-width-icon-extra-large",
}


# ============ COLOR UTILITIES ============

def rgb_to_hex(color_str: str) -> str:
    """Convert RGB/RGBA to hex."""
    if not color_str:
        return ""
    color_str = color_str.strip()
    if color_str.startswith("#"):
        return color_str.upper()
    
    match = re.match(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', color_str)
    if match:
        r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
        return f"#{r:02X}{g:02X}{b:02X}"
    
    return color_str


def hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    """Convert hex to RGB tuple."""
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join(c * 2 for c in hex_str)
    if len(hex_str) < 6:
        return (0, 0, 0)
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))


def darken(hex_color: str, factor: float) -> str:
    """Darken a color by factor (0-1)."""
    r, g, b = hex_to_rgb(hex_color)
    return f"#{int(r*(1-factor)):02X}{int(g*(1-factor)):02X}{int(b*(1-factor)):02X}"


def lighten(hex_color: str, factor: float) -> str:
    """Lighten a color by factor (0-1)."""
    r, g, b = hex_to_rgb(hex_color)
    return f"#{int(r+(255-r)*factor):02X}{int(g+(255-g)*factor):02X}{int(b+(255-b)*factor):02X}"


def with_alpha(hex_color: str, alpha: float) -> str:
    """Add alpha channel to hex color."""
    r, g, b = hex_to_rgb(hex_color)
    return f"rgba({r}, {g}, {b}, {alpha})"


def derive_shades(hex_color: str) -> Dict[str, str]:
    """Generate Semi Design state variants from base color."""
    return {
        "hover": darken(hex_color, 0.10),
        "active": darken(hex_color, 0.20),
        "disabled": lighten(hex_color, 0.60),
        "light-default": lighten(hex_color, 0.88),
        "light-hover": lighten(hex_color, 0.82),
        "light-active": lighten(hex_color, 0.75),
    }


def luminance(hex_color: str) -> float:
    """Calculate relative luminance of a color."""
    r, g, b = [x / 255.0 for x in hex_to_rgb(hex_color)]
    
    def adjust(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    
    return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)


def contrast_ratio(hex1: str, hex2: str) -> float:
    """Calculate contrast ratio between two colors."""
    l1 = luminance(hex1)
    l2 = luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


# ============ DESIGN SYSTEM INDEXER ============

@dataclass
class DesignSystem:
    """Complete design system definition."""
    name: str
    description: str = ""
    colors: Dict[str, Any] = field(default_factory=dict)
    typography: Dict[str, Any] = field(default_factory=dict)
    spacing: Dict[str, Any] = field(default_factory=dict)
    borders: Dict[str, Any] = field(default_factory=dict)
    shadows: Dict[str, Any] = field(default_factory=dict)
    sizing: Dict[str, Any] = field(default_factory=dict)
    components: Dict[str, Any] = field(default_factory=dict)
    layout: Dict[str, Any] = field(default_factory=dict)
    meta: Dict[str, Any] = field(default_factory=dict)
    
    def to_semi_tokens(self) -> Dict[str, str]:
        """Convert to Semi Design CSS variable format."""
        tokens = {}
        
        # Colors
        for name, value in self.colors.items():
            if isinstance(value, str):
                token_name = SEMI_COLOR_TOKENS.get(name, f"--color-{name}")
                tokens[token_name] = value
            elif isinstance(value, dict) and "base" in value:
                token_name = SEMI_COLOR_TOKENS.get(name, f"--color-{name}")
                tokens[token_name] = value["base"]
                
                # Add state variants
                if "shades" in value:
                    for state, shade in value["shades"].items():
                        tokens[f"{token_name}-{state}"] = shade
        
        # Typography
        for name, value in self.typography.items():
            token_name = SEMI_TYPOGRAPHY_TOKENS.get(name, f"--{name.replace('_', '-')}")
            tokens[token_name] = value
        
        # Spacing
        for name, value in self.spacing.items():
            token_name = SEMI_SPACING_TOKENS.get(name, f"--spacing-{name}")
            tokens[token_name] = value
        
        # Borders
        for name, value in self.borders.items():
            token_name = SEMI_BORDER_TOKENS.get(name, f"--border-{name}")
            tokens[token_name] = value
        
        # Shadows
        for name, value in self.shadows.items():
            token_name = SEMI_SHADOW_TOKENS.get(name, f"--shadow-{name}")
            tokens[token_name] = value
        
        # Sizing
        for name, value in self.sizing.items():
            token_name = SEMI_SIZING_TOKENS.get(name, f"--{name.replace('_', '-')}")
            tokens[token_name] = value
        
        return tokens
    
    def generate_css(self) -> str:
        """Generate CSS with CSS variables."""
        tokens = self.to_semi_tokens()
        
        lines = [
            f"/**",
            f" * {self.name} Design System",
            f" * Generated by UX Master Design System Indexer v4",
            f" * Timestamp: {datetime.now().isoformat()}",
            f" * Specification: Semi Design (DouyinFE/semi-design)",
            f" */",
            "",
            ":root {",
        ]
        
        # Group tokens by category
        categories = {
            "Brand Colors": [],
            "Semantic Colors": [],
            "Neutral Scale": [],
            "Background Colors": [],
            "Fill Colors": [],
            "Text Colors": [],
            "Border & Radius": [],
            "Shadows": [],
            "Typography": [],
            "Spacing": [],
            "Sizing": [],
            "Other": []
        }
        
        for var, val in sorted(tokens.items()):
            if "primary" in var or "secondary" in var or "tertiary" in var:
                categories["Brand Colors"].append((var, val))
            elif any(s in var for s in ["success", "warning", "danger", "info"]):
                categories["Semantic Colors"].append((var, val))
            elif "neutral" in var or "grey" in var:
                categories["Neutral Scale"].append((var, val))
            elif "bg-" in var:
                categories["Background Colors"].append((var, val))
            elif "fill-" in var:
                categories["Fill Colors"].append((var, val))
            elif "text-" in var:
                categories["Text Colors"].append((var, val))
            elif "border" in var or "radius" in var:
                categories["Border & Radius"].append((var, val))
            elif "shadow" in var:
                categories["Shadows"].append((var, val))
            elif "font" in var or "line-height" in var:
                categories["Typography"].append((var, val))
            elif "spacing" in var:
                categories["Spacing"].append((var, val))
            elif "height" in var or "width" in var:
                categories["Sizing"].append((var, val))
            else:
                categories["Other"].append((var, val))
        
        for cat_name, items in categories.items():
            if items:
                lines.append(f"\n  /* {cat_name} */")
                for var, val in items:
                    lines.append(f"  {var}: {val};")
        
        lines.append("}")
        lines.append("")
        
        # Add dark mode support
        lines.extend(self._generate_dark_mode())
        
        return "\n".join(lines)
    
    def _generate_dark_mode(self) -> List[str]:
        """Generate dark mode CSS."""
        lines = [
            "",
            "/* Dark Mode */",
            "[data-theme=\"dark\"], .dark {",
        ]
        
        # Invert background and text colors
        if self.colors.get("bg-0"):
            lines.append(f"  --semi-color-bg-0: #16161A;")
            lines.append(f"  --semi-color-bg-1: #1E1E23;")
            lines.append(f"  --semi-color-bg-2: #232329;")
            lines.append(f"  --semi-color-bg-3: #2A2A32;")
            lines.append(f"  --semi-color-bg-4: #32323A;")
            
        if self.colors.get("text-0"):
            lines.append(f"  --semi-color-text-0: #F9F9F9;")
            lines.append(f"  --semi-color-text-1: #E6E8EA;")
            lines.append(f"  --semi-color-text-2: #BBBFC4;")
            lines.append(f"  --semi-color-text-3: #8F959E;")
            
        lines.append("}")
        return lines
    
    def generate_json(self) -> str:
        """Generate JSON representation."""
        return json.dumps(asdict(self), indent=2)
    
    def generate_figma_tokens(self) -> str:
        """Generate Figma Tokens Studio compatible JSON."""
        tokens = self.to_semi_tokens()
        figma = {"_version": "1.0"}
        
        for var, val in tokens.items():
            key = var.replace("--", "").replace("semi-", "").replace("-", "/")
            
            if "color" in var or "bg-" in var or "text-" in var or "fill-" in var:
                token_type = "color"
            elif "radius" in var:
                token_type = "borderRadius"
            elif "shadow" in var:
                token_type = "boxShadow"
            elif "font-family" in var:
                token_type = "fontFamilies"
            elif "font-size" in var:
                token_type = "fontSizes"
            elif "font-weight" in var:
                token_type = "fontWeights"
            elif "spacing" in var:
                token_type = "spacing"
            elif "height" in var or "width" in var:
                token_type = "sizing"
            else:
                token_type = "other"
            
            figma[key] = {
                "value": val,
                "type": token_type,
                "description": f"Generated from {self.name} design system"
            }
        
        return json.dumps(figma, indent=2)


class DesignSystemIndexer:
    """Index and reconstruct design system from harvest data."""
    
    def __init__(self, harvest_data: Dict, name: str = "Untitled"):
        self.data = harvest_data
        self.name = name
        
    def index(self) -> DesignSystem:
        """Main indexing method."""
        visual_analysis = self.data.get("visualAnalysis", {})
        
        return DesignSystem(
            name=self.name,
            description=f"Design system extracted from {self.data.get('meta', {}).get('url', 'unknown')}",
            colors=self._index_colors(visual_analysis.get("colors", {})),
            typography=self._index_typography(visual_analysis.get("typography", {})),
            spacing=self._index_spacing(visual_analysis.get("spacing", {})),
            borders=self._index_borders(visual_analysis.get("borders", {})),
            shadows=self._index_shadows(visual_analysis.get("shadows", {})),
            sizing=self._index_sizing(visual_analysis.get("components", {})),
            components=self._index_components(self.data.get("components", {})),
            layout=self._index_layout(visual_analysis.get("layout", {})),
            meta=self.data.get("meta", {})
        )
    
    def _index_colors(self, color_data: Dict) -> Dict[str, Any]:
        """Extract and normalize color system."""
        colors = {}
        
        semantic = color_data.get("semantic", {})
        
        # Primary color
        if semantic.get("primary"):
            primary = semantic["primary"]
            base = rgb_to_hex(primary.get("base", "")) if isinstance(primary, dict) else rgb_to_hex(primary)
            if base:
                colors["primary"] = {
                    "base": base,
                    "shades": derive_shades(base),
                    "psychology": primary.get("psychology") if isinstance(primary, dict) else None
                }
        
        # Semantic colors
        for name in ["success", "warning", "danger", "info"]:
            if semantic.get(name):
                val = semantic[name]
                base = rgb_to_hex(val.get("base", "")) if isinstance(val, dict) else rgb_to_hex(val)
                if base:
                    colors[name] = {
                        "base": base,
                        "shades": derive_shades(base)
                    }
        
        # Link color
        if semantic.get("link"):
            colors["link"] = rgb_to_hex(semantic["link"])
        
        # Text colors
        text_colors = semantic.get("text", {})
        if text_colors.get("primary"):
            colors["text-0"] = rgb_to_hex(text_colors["primary"])
        if text_colors.get("secondary"):
            colors["text-1"] = rgb_to_hex(text_colors["secondary"])
        if text_colors.get("disabled"):
            colors["text-2"] = rgb_to_hex(text_colors["disabled"])
        
        # Background colors
        bg_colors = semantic.get("background", {})
        if bg_colors.get("page"):
            colors["bg-0"] = rgb_to_hex(bg_colors["page"])
        if bg_colors.get("card"):
            colors["bg-1"] = rgb_to_hex(bg_colors["card"])
        if bg_colors.get("sidebar"):
            colors["bg-2"] = rgb_to_hex(bg_colors["sidebar"])
        if bg_colors.get("header"):
            colors["bg-3"] = rgb_to_hex(bg_colors["header"])
        if bg_colors.get("modal"):
            colors["bg-4"] = rgb_to_hex(bg_colors["modal"])
        
        # Neutral scale
        neutrals = color_data.get("neutrals", {})
        for step, val in neutrals.items():
            colors[f"neutral-{step}"] = rgb_to_hex(val)
        
        # Fill colors (derive from neutrals if not present)
        if "neutral-100" in colors:
            colors["fill-0"] = with_alpha(colors["neutral-100"], 0.05)
            colors["fill-1"] = with_alpha(colors["neutral-100"], 0.10)
            colors["fill-2"] = with_alpha(colors["neutral-100"], 0.15)
        
        # Border color
        if colors.get("neutral-200"):
            colors["border"] = colors["neutral-200"]
        
        # Disabled states
        if colors.get("neutral-100"):
            colors["disabled-bg"] = colors["neutral-100"]
        if colors.get("neutral-500"):
            colors["disabled-text"] = colors["neutral-500"]
        
        # Special colors
        colors["white"] = "#FFFFFF"
        colors["black"] = "#000000"
        colors["overlay"] = "rgba(0, 0, 0, 0.6)"
        colors["shadow"] = "rgba(0, 0, 0, 0.04)"
        
        return colors
    
    def _index_typography(self, typo_data: Dict) -> Dict[str, str]:
        """Extract typography system."""
        typography = {}
        
        # Font family
        if typo_data.get("dominant"):
            dom = typo_data["dominant"]
            typography["font-family-regular"] = dom.get("family", "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
        
        # Font sizes from hierarchy
        hierarchy = typo_data.get("hierarchy", {})
        size_map = {
            "h1": "header-1",
            "h2": "header-2",
            "h3": "header-3",
            "h4": "header-4",
            "h5": "header-5",
            "h6": "header-6"
        }
        
        for level, semi_key in size_map.items():
            if level in hierarchy:
                typography[f"font-size-{semi_key}"] = hierarchy[level].get("size", "")
        
        # Body size
        if typo_data.get("body"):
            typography["font-size-regular"] = typo_data["body"].get("size", "14px")
            typography["line-height-regular"] = typo_data["body"].get("lineHeight", "1.5")
        
        # Weights
        weights = typo_data.get("weights", {})
        weight_map = {
            "light": "200",
            "regular": "400",
            "medium": "500",
            "semibold": "600",
            "bold": "700"
        }
        for name, default in weight_map.items():
            typography[f"font-weight-{name}"] = weights.get(name, default)
        
        return typography
    
    def _index_spacing(self, spacing_data: Dict) -> Dict[str, str]:
        """Extract spacing system."""
        spacing = {}
        
        scale = spacing_data.get("scale", [])
        semi_scale = {
            "none": "0",
            "super-tight": "2px",
            "extra-tight": "4px",
            "tight": "8px",
            "base-tight": "12px",
            "base": "16px",
            "base-loose": "20px",
            "loose": "24px",
            "extra-loose": "32px",
            "super-loose": "40px"
        }
        
        # Map detected values to Semi scale
        if scale:
            px_values = []
            for v in scale:
                match = re.match(r'(\d+)', str(v))
                if match:
                    px_values.append(int(match.group(1)))
            
            for name, default_val in semi_scale.items():
                target_px = int(re.match(r'(\d+)', default_val).group(1))
                if px_values:
                    closest = min(px_values, key=lambda x: abs(x - target_px))
                    if abs(closest - target_px) <= max(4, target_px * 0.3):
                        spacing[name] = f"{closest}px"
                    else:
                        spacing[name] = default_val
                else:
                    spacing[name] = default_val
        else:
            spacing = semi_scale
        
        return spacing
    
    def _index_borders(self, border_data: Dict) -> Dict[str, str]:
        """Extract border system."""
        borders = {}
        
        # Border widths
        widths = border_data.get("widths", [])
        if widths:
            borders["thickness-control"] = widths[0][0]
        else:
            borders["thickness-control"] = "1px"
        
        borders["thickness"] = "0"
        borders["thickness-control-focus"] = "1px"
        
        # Border radius
        radius = border_data.get("radius", {})
        radius_map = {
            "xs": "3px",
            "sm": "3px",
            "md": "6px",
            "lg": "12px",
            "full": "9999px"
        }
        
        for key, default in radius_map.items():
            semi_key = f"radius-{key}"
            if key in radius:
                borders[semi_key] = radius[key]
            else:
                borders[semi_key] = default
        
        borders["radius-circle"] = "50%"
        
        return borders
    
    def _index_shadows(self, shadow_data: Dict) -> Dict[str, str]:
        """Extract shadow system."""
        shadows = {}
        
        if shadow_data.get("sm"):
            shadows["sm"] = shadow_data["sm"]["value"]
        else:
            shadows["sm"] = "0 0 1px rgba(0, 0, 0, 0.1)"
        
        if shadow_data.get("md"):
            shadows["elevated"] = shadow_data["md"]["value"]
        else:
            shadows["elevated"] = "0 0 1px rgba(0, 0, 0, 0.3), 0 4px 14px rgba(0, 0, 0, 0.1)"
        
        if shadow_data.get("lg"):
            shadows["lg"] = shadow_data["lg"]["value"]
        else:
            shadows["lg"] = "0 0 1px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.12)"
        
        return shadows
    
    def _index_sizing(self, component_data: Dict) -> Dict[str, str]:
        """Extract sizing system from components."""
        sizing = {}
        
        # Button heights
        buttons = component_data.get("button", {})
        if "sizes" in buttons:
            sizes = buttons["sizes"]
            if "sm" in sizes:
                sizing["height-control-small"] = sizes["sm"].get("styles", {}).get("height", "24px")
            if "md" in sizes:
                sizing["height-control-default"] = sizes["md"].get("styles", {}).get("height", "32px")
            if "lg" in sizes:
                sizing["height-control-large"] = sizes["lg"].get("styles", {}).get("height", "40px")
        
        # Default sizing if not found
        if "height-control-small" not in sizing:
            sizing["height-control-small"] = "24px"
            sizing["height-control-default"] = "32px"
            sizing["height-control-large"] = "40px"
        
        # Icon sizes
        sizing["width-icon-extra-small"] = "8px"
        sizing["width-icon-small"] = "12px"
        sizing["width-icon-medium"] = "16px"
        sizing["width-icon-large"] = "20px"
        sizing["width-icon-extra-large"] = "24px"
        
        return sizing
    
    def _index_components(self, comp_data: Dict) -> Dict[str, Any]:
        """Index component blueprints."""
        return comp_data.get("blueprints", {})
    
    def _index_layout(self, layout_data: Dict) -> Dict[str, Any]:
        """Index layout patterns."""
        return {
            "type": layout_data.get("type", "unknown"),
            "has_sidebar": layout_data.get("sidebar") is not None,
            "has_header": layout_data.get("header") is not None,
            "sidebar_width": layout_data.get("sidebar", {}).get("width", 240),
            "header_height": layout_data.get("header", {}).get("height", 64)
        }


def merge_multiple_harvests(harvest_files: List[Path]) -> Dict:
    """Merge multiple harvest files into one."""
    merged = {
        "_version": 4,
        "_merged": True,
        "meta": {
            "sources": [],
            "timestamp": datetime.now().isoformat()
        },
        "visualAnalysis": {
            "colors": {"semantic": {}, "neutrals": {}},
            "typography": {},
            "spacing": {},
            "borders": {},
            "shadows": {},
            "layout": {}
        },
        "components": {"blueprints": {}}
    }
    
    color_votes = {}
    
    for file_path in harvest_files:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        meta = data.get("meta", {})
        merged["meta"]["sources"].append({
            "url": meta.get("url", "unknown"),
            "type": meta.get("pageType", "unknown"),
            "file": str(file_path)
        })
        
        va = data.get("visualAnalysis", {})
        
        # Merge colors (voting system)
        colors = va.get("colors", {})
        semantic = colors.get("semantic", {})
        for name, value in semantic.items():
            if name not in color_votes:
                color_votes[name] = []
            color_votes[name].append(value)
        
        # Merge components
        blueprints = data.get("components", {}).get("blueprints", {})
        for comp_type, blueprint in blueprints.items():
            if comp_type not in merged["components"]["blueprints"]:
                merged["components"]["blueprints"][comp_type] = blueprint
    
    # Select most common colors
    for name, votes in color_votes.items():
        if votes:
            # Simple: take first non-null value
            merged["visualAnalysis"]["colors"]["semantic"][name] = next(
                (v for v in votes if v), votes[0]
            )
    
    return merged


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Design System Indexer v4 — Semi Design Architecture",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Index single harvest file
  python design_system_indexer.py --input harvest.json --name "MyApp"
  
  # Index with output directory
  python design_system_indexer.py --input harvest.json --output ./design-system
  
  # Merge multiple harvests
  python design_system_indexer.py --multi ./harvests/*.json --name "MergedSystem"
  
  # Generate Figma tokens
  python design_system_indexer.py --input harvest.json --figma --output ./figma
        """
    )
    
    parser.add_argument("--input", "-i", help="Input harvest JSON file")
    parser.add_argument("--multi", "-m", nargs="+", help="Multiple harvest files to merge")
    parser.add_argument("--name", "-n", default="Untitled", help="Design system name")
    parser.add_argument("--output", "-o", default="./output", help="Output directory")
    parser.add_argument("--figma", "-f", action="store_true", help="Generate Figma tokens")
    parser.add_argument("--css", "-c", action="store_true", help="Generate CSS only")
    parser.add_argument("--json", "-j", action="store_true", help="Generate JSON only")
    
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load data
    if args.multi:
        print(f"[INFO] Merging {len(args.multi)} harvest files...")
        data = merge_multiple_harvests([Path(f) for f in args.multi])
    elif args.input:
        with open(args.input, 'r') as f:
            data = json.load(f)
    else:
        parser.print_help()
        sys.exit(1)
    
    # Index design system
    print(f"[INFO] Indexing design system: {args.name}")
    indexer = DesignSystemIndexer(data, name=args.name)
    design_system = indexer.index()
    
    # Generate outputs
    if not args.figma and not args.css and not args.json:
        # Generate all
        args.figma = args.css = args.json = True
    
    if args.css:
        css = design_system.generate_css()
        css_path = output_dir / "design-system.css"
        with open(css_path, "w") as f:
            f.write(css)
        print(f"[OK] CSS: {css_path}")
    
    if args.json:
        json_str = design_system.generate_json()
        json_path = output_dir / "design-system.json"
        with open(json_path, "w") as f:
            f.write(json_str)
        print(f"[OK] JSON: {json_path}")
    
    if args.figma:
        figma_str = design_system.generate_figma_tokens()
        figma_path = output_dir / "figma-tokens.json"
        with open(figma_path, "w") as f:
            f.write(figma_str)
        print(f"[OK] Figma: {figma_path}")
    
    # Print summary
    print(f"\n[SUMMARY] Design System: {args.name}")
    print(f"  Colors: {len(design_system.colors)}")
    print(f"  Typography: {len(design_system.typography)}")
    print(f"  Spacing: {len(design_system.spacing)}")
    print(f"  Components: {len(design_system.components)}")
    print(f"\nOutput directory: {output_dir}")


if __name__ == "__main__":
    main()
