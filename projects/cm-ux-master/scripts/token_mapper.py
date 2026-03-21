#!/usr/bin/env python3
"""
Semi Token Compiler — Maps raw CSSOM harvest to the FULL Semi Design global.scss spec.

Reference: DouyinFE/semi-design/packages/semi-theme-default/scss/global.scss
Generates ~150-200+ CSS variable overrides from browser-extracted data.
"""
import json
import re
import colorsys


# ============ COLOR UTILITIES ============

def rgb_to_hex(color_str: str) -> str:
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


def hex_to_rgb(hex_str: str) -> tuple:
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join(c * 2 for c in hex_str)
    if len(hex_str) < 6:
        return (0, 0, 0)
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))


def darken(hex_color: str, factor: float) -> str:
    r, g, b = hex_to_rgb(hex_color)
    return f"#{int(r*(1-factor)):02X}{int(g*(1-factor)):02X}{int(b*(1-factor)):02X}"


def lighten(hex_color: str, factor: float) -> str:
    r, g, b = hex_to_rgb(hex_color)
    return f"#{int(r+(255-r)*factor):02X}{int(g+(255-g)*factor):02X}{int(b+(255-b)*factor):02X}"


def with_alpha(hex_color: str, alpha: float) -> str:
    r, g, b = hex_to_rgb(hex_color)
    return f"rgba({r}, {g}, {b}, {alpha})"


def derive_shades(hex_color: str) -> dict:
    """Generate all Semi Design state variants from a base color."""
    return {
        "hover": darken(hex_color, 0.10),
        "active": darken(hex_color, 0.20),
        "disabled": lighten(hex_color, 0.60),
        "light-default": lighten(hex_color, 0.88),
        "light-hover": lighten(hex_color, 0.82),
        "light-active": lighten(hex_color, 0.75),
    }


def generate_chart_palette(primary_hex: str) -> list:
    r, g, b = hex_to_rgb(primary_hex)
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    palette = []
    for i in range(20):
        hue = (h + i * 0.05) % 1.0
        sat = max(0.3, min(1.0, s + (i % 3 - 1) * 0.1))
        val = max(0.4, min(1.0, v + (i % 4 - 2) * 0.05))
        nr, ng, nb = colorsys.hsv_to_rgb(hue, sat, val)
        palette.append(f"#{int(nr*255):02X}{int(ng*255):02X}{int(nb*255):02X}")
    return palette


# ============ SEMI DESIGN COMPLETE TOKEN SPEC ============

MAPPING = {
    ("colors", "primary"):      "--semi-color-primary",
    ("colors", "success"):      "--semi-color-success",
    ("colors", "warning"):      "--semi-color-warning",
    ("colors", "danger"):       "--semi-color-danger",
    ("colors", "info"):         "--semi-color-info",
    ("colors", "link"):         "--semi-color-link",
    ("colors", "disabled_bg"):  "--semi-color-disabled-bg",
    ("colors", "disabled_text"): "--semi-color-disabled-text",
    ("surfaces", "app_bg"):      "--semi-color-bg-0",
    ("surfaces", "card_bg"):     "--semi-color-bg-1",
    ("surfaces", "sidebar_bg"):  "--semi-color-bg-2",
    ("surfaces", "header_bg"):   "--semi-color-bg-3",
    ("surfaces", "modal_bg"):    "--semi-color-bg-4",
    ("surfaces", "hover_bg"):    "--semi-color-fill-0",
    ("surfaces", "selected_bg"): "--semi-color-fill-1",
    ("surfaces", "input_bg"):    "--semi-color-fill-2",
    ("surfaces", "border"):      "--semi-color-border",
    ("surfaces", "nav_bg"):      "--semi-color-nav-bg",
    ("surfaces", "overlay_bg"):  "--semi-color-overlay-bg",
    ("typography", "title_color"):   "--semi-color-text-0",
    ("typography", "body_color"):    "--semi-color-text-1",
    ("typography", "muted_color"):   "--semi-color-text-2",
    ("typography", "body_family"):   "--semi-font-family-regular",
    ("typography", "font_family"):   "--semi-font-family-regular",
    ("typography", "heading_family"): "--semi-font-family-regular",
    ("typography", "heading_color"): "--semi-color-text-0",
    ("typography", "heading_weight"): "--semi-font-weight-bold",
    ("typography", "body_size"):     "--semi-font-size-regular",
    ("typography", "body_line_height"): "--semi-line-height-regular",
    ("geometry", "button_radius"):   "--semi-border-radius-small",
    ("geometry", "card_radius"):     "--semi-border-radius-large",
    ("geometry", "card_shadow"):     "--semi-shadow-elevated",
    ("geometry", "input_radius"):    "--semi-border-radius-medium",
    ("geometry", "button_padding"):  "--semi-spacing-tight",
}

COLOR_TOKENS = {
    "--semi-color-primary", "--semi-color-success", "--semi-color-warning",
    "--semi-color-danger", "--semi-color-info", "--semi-color-link",
    "--semi-color-disabled-bg", "--semi-color-disabled-text",
    "--semi-color-bg-0", "--semi-color-bg-1", "--semi-color-bg-2",
    "--semi-color-bg-3", "--semi-color-bg-4",
    "--semi-color-fill-0", "--semi-color-fill-1", "--semi-color-fill-2",
    "--semi-color-border", "--semi-color-text-0",
    "--semi-color-text-1", "--semi-color-text-2", "--semi-color-text-3",
    "--semi-color-nav-bg", "--semi-color-overlay-bg",
    "--semi-color-white", "--semi-color-black",
    "--semi-color-focus-border", "--semi-color-highlight-bg",
    "--semi-color-highlight", "--semi-color-shadow",
}

SEMANTIC_CATEGORIES = ("primary", "secondary", "tertiary", "info", "success", "danger", "warning")

SEMI_SPACING_SCALE = {
    "none": "0", "super-tight": "2px", "extra-tight": "4px",
    "tight": "8px", "base-tight": "12px", "base": "16px",
    "base-loose": "20px", "loose": "24px", "extra-loose": "32px",
    "super-loose": "40px",
}

SEMI_FONT_SIZES = {
    "small": "12px", "regular": "14px",
    "header-6": "16px", "header-5": "18px", "header-4": "20px",
    "header-3": "24px", "header-2": "28px", "header-1": "32px",
}

SEMI_SIZING = {
    "height-control-small": "24px", "height-control-default": "32px",
    "height-control-large": "40px",
    "width-icon-extra-small": "8px", "width-icon-small": "12px",
    "width-icon-medium": "16px", "width-icon-large": "20px",
    "width-icon-extra-large": "24px",
}


def map_to_semi_tokens(raw: dict) -> dict:
    """Map raw harvest JSON to the COMPLETE Semi Design CSS variable spec."""
    tokens = {}
    is_v3 = raw.get("_version", 1) >= 3

    # Step 1: Direct mapping
    for (section, key), semi_var in MAPPING.items():
        value = raw.get(section, {}).get(key)
        if value:
            if semi_var in COLOR_TOKENS:
                value = rgb_to_hex(value)
            tokens[semi_var] = value

    # Step 2: Full 7-state color variants
    _derive_color_states(raw, tokens)

    # Step 3: Disabled, link, special, text
    _map_disabled_states(raw, tokens)
    _map_link_states(raw, tokens)
    _map_special_colors(raw, tokens)
    _map_text_system(raw, tokens)

    # Step 4: v3 extensions
    if is_v3:
        _map_v3_neutrals(raw, tokens)
        _map_v3_typography(raw, tokens)
        _map_v3_spacing(raw, tokens)
        _map_v3_borders(raw, tokens)
        _map_v3_shadows(raw, tokens)
        _map_v3_layout(raw, tokens)
        _map_v3_sizing(raw, tokens)
        _map_v3_chart_palette(raw, tokens)

    return tokens


def _derive_color_states(raw, tokens):
    for cat in SEMANTIC_CATEGORIES:
        base_var = f"--semi-color-{cat}"
        if base_var not in tokens:
            continue
        base_hex = tokens[base_var]
        shades = derive_shades(base_hex)
        for suffix, val in shades.items():
            tokens[f"{base_var}-{suffix}"] = val

    # Auto-generate secondary and tertiary if missing
    if "--semi-color-secondary" not in tokens and "--semi-color-primary" in tokens:
        secondary = lighten(tokens["--semi-color-primary"], 0.15)
        tokens["--semi-color-secondary"] = secondary
        for suffix, val in derive_shades(secondary).items():
            tokens[f"--semi-color-secondary-{suffix}"] = val

    if "--semi-color-tertiary" not in tokens:
        tertiary = "#6B7075"
        tokens["--semi-color-tertiary"] = tertiary
        for suffix, val in derive_shades(tertiary).items():
            tokens[f"--semi-color-tertiary-{suffix}"] = val

    # Default colors
    grey_0 = tokens.get("--semi-color-neutral-50", "#F9F9F9")
    tokens.setdefault("--semi-color-default", grey_0)
    tokens.setdefault("--semi-color-default-hover", darken(grey_0, 0.03))
    tokens.setdefault("--semi-color-default-active", darken(grey_0, 0.06))


def _map_disabled_states(raw, tokens):
    colors = raw.get("colors", {})
    tokens.setdefault("--semi-color-disabled-text",
        rgb_to_hex(colors.get("disabled_text", "")) or
        with_alpha(tokens.get("--semi-color-text-0", "#1C1F23"), 0.35))
    tokens.setdefault("--semi-color-disabled-border",
        tokens.get("--semi-color-neutral-100", "#E6E8EA"))
    tokens.setdefault("--semi-color-disabled-bg",
        rgb_to_hex(colors.get("disabled_bg", "")) or
        tokens.get("--semi-color-neutral-100", "#E6E8EA"))
    tokens.setdefault("--semi-color-disabled-fill",
        with_alpha(tokens.get("--semi-color-neutral-800", "#2E3238"), 0.04))


def _map_link_states(raw, tokens):
    link_base = tokens.get("--semi-color-link")
    if not link_base:
        link_base = tokens.get("--semi-color-primary", "#0064FA")
        tokens["--semi-color-link"] = link_base
    tokens["--semi-color-link-hover"] = darken(link_base, 0.10)
    tokens["--semi-color-link-active"] = darken(link_base, 0.20)
    tokens["--semi-color-link-visited"] = link_base


def _map_special_colors(raw, tokens):
    primary = tokens.get("--semi-color-primary", "#0064FA")
    tokens.setdefault("--semi-color-focus-border", primary)
    tokens.setdefault("--semi-color-shadow", "rgba(0, 0, 0, 0.04)")
    tokens.setdefault("--semi-color-white", "#FFFFFF")
    tokens.setdefault("--semi-color-black", "#000000")
    tokens.setdefault("--semi-color-highlight-bg", "#F0C000")
    tokens.setdefault("--semi-color-highlight", "#000000")
    tokens.setdefault("--semi-color-overlay-bg", "rgba(22, 22, 26, 0.6)")
    surfaces = raw.get("surfaces", {})
    if surfaces.get("sidebar_bg"):
        tokens.setdefault("--semi-color-nav-bg", rgb_to_hex(surfaces["sidebar_bg"]))
    else:
        tokens.setdefault("--semi-color-nav-bg", "#FFFFFF")


def _map_text_system(raw, tokens):
    typo = raw.get("typography", {})
    text_0 = rgb_to_hex(typo.get("heading_color", typo.get("title_color", "")))
    text_1 = rgb_to_hex(typo.get("body_color", ""))
    text_2 = rgb_to_hex(typo.get("muted_color", ""))
    if text_0:
        tokens.setdefault("--semi-color-text-0", text_0)
    if text_1:
        tokens.setdefault("--semi-color-text-1", text_1)
    if text_2:
        tokens.setdefault("--semi-color-text-2", text_2)
    if "--semi-color-text-0" in tokens:
        t0 = tokens["--semi-color-text-0"]
        if t0.startswith("#"):
            r, g, b = hex_to_rgb(t0)
            tokens.setdefault("--semi-color-text-3", f"rgba({r}, {g}, {b}, 0.35)")


def _map_v3_neutrals(raw, tokens):
    neutrals = raw.get("neutrals", {})
    for step, val in neutrals.items():
        if val:
            hex_val = rgb_to_hex(val)
            tokens[f"--semi-color-neutral-{step}"] = hex_val
            grey_map = {"50": "--semi-grey-0", "100": "--semi-grey-1",
                "200": "--semi-grey-2", "300": "--semi-grey-3",
                "400": "--semi-grey-4", "500": "--semi-grey-5",
                "600": "--semi-grey-6", "700": "--semi-grey-7",
                "800": "--semi-grey-8", "900": "--semi-grey-9"}
            grey_var = grey_map.get(str(step))
            if grey_var:
                r, g, b = hex_to_rgb(hex_val)
                tokens[grey_var] = f"{r},{g},{b}"


def _map_v3_typography(raw, tokens):
    typo = raw.get("typography", {})
    sizes = typo.get("sizes", {})
    size_map = {"xs": "--semi-font-size-extra-small", "sm": "--semi-font-size-small",
        "base": "--semi-font-size-regular", "lg": "--semi-font-size-header-6",
        "xl": "--semi-font-size-header-5", "2xl": "--semi-font-size-header-4",
        "3xl": "--semi-font-size-header-3", "4xl": "--semi-font-size-header-2",
        "5xl": "--semi-font-size-header-1"}
    for key, var in size_map.items():
        if key in sizes:
            tokens[var] = sizes[key]
    for semi_key, default_val in SEMI_FONT_SIZES.items():
        tokens.setdefault(f"--semi-font-size-{semi_key}", default_val)
    weights = typo.get("weights", {})
    weight_map = {"light": "--semi-font-weight-light", "regular": "--semi-font-weight-regular",
        "medium": "--semi-font-weight-medium", "semibold": "--semi-font-weight-semibold",
        "bold": "--semi-font-weight-bold"}
    for key, var in weight_map.items():
        if key in weights:
            tokens[var] = weights[key]
    tokens.setdefault("--semi-font-weight-light", "200")
    tokens.setdefault("--semi-font-weight-regular", "400")
    tokens.setdefault("--semi-font-weight-bold", "600")


def _map_v3_spacing(raw, tokens):
    scale = raw.get("spacing", {}).get("scale", [])
    px_values = []
    for v in scale:
        match = re.match(r'(\d+)', str(v))
        if match:
            px_values.append(int(match.group(1)))
    px_values.sort()
    for name, default_val in SEMI_SPACING_SCALE.items():
        target_px = int(re.match(r'(\d+)', default_val).group(1)) if re.match(r'(\d+)', default_val) else 0
        if px_values:
            closest = min(px_values, key=lambda x: abs(x - target_px))
            if abs(closest - target_px) <= max(4, target_px * 0.3):
                tokens[f"--semi-spacing-{name}"] = f"{closest}px"
            else:
                tokens[f"--semi-spacing-{name}"] = default_val
        else:
            tokens[f"--semi-spacing-{name}"] = default_val


def _map_v3_borders(raw, tokens):
    borders = raw.get("borders", {})
    if "width" in borders:
        tokens["--semi-border-thickness-control"] = borders["width"]
    if "color" in borders:
        tokens.setdefault("--semi-color-border", rgb_to_hex(borders["color"]))
    radii = borders.get("radius", {})
    radius_map = {"xs": "--semi-border-radius-extra-small", "sm": "--semi-border-radius-small",
        "md": "--semi-border-radius-medium", "lg": "--semi-border-radius-large",
        "xl": "--semi-border-radius-large", "full": "--semi-border-radius-full"}
    for key, var in radius_map.items():
        if key in radii:
            tokens[var] = radii[key]
    tokens.setdefault("--semi-border-radius-extra-small", "3px")
    tokens.setdefault("--semi-border-radius-small", "3px")
    tokens.setdefault("--semi-border-radius-medium", "6px")
    tokens.setdefault("--semi-border-radius-large", "12px")
    tokens.setdefault("--semi-border-radius-circle", "50%")
    tokens.setdefault("--semi-border-radius-full", "9999px")
    tokens.setdefault("--semi-border-thickness", "0")
    tokens.setdefault("--semi-border-thickness-control", "1px")
    tokens.setdefault("--semi-border-thickness-control-focus", "1px")


def _map_v3_shadows(raw, tokens):
    shadows = raw.get("shadows", {})
    shadow_map = {"sm": "--semi-shadow-sm", "md": "--semi-shadow-elevated", "lg": "--semi-shadow-lg"}
    for key, var in shadow_map.items():
        if key in shadows:
            tokens[var] = shadows[key]
    tokens.setdefault("--semi-shadow-elevated",
        "0 0 1px rgba(0, 0, 0, 0.3), 0 4px 14px rgba(0, 0, 0, 0.1)")


def _map_v3_layout(raw, tokens):
    layout = raw.get("layout", {})
    layout_map = {"sidebar_width": "--semi-layout-sidebar-width",
        "header_height": "--semi-layout-header-height",
        "content_max_width": "--semi-layout-content-max-width",
        "content_padding": "--semi-layout-content-padding",
        "grid_gap": "--semi-layout-grid-gap"}
    for key, var in layout_map.items():
        if key in layout:
            tokens[var] = layout[key]


def _map_v3_sizing(raw, tokens):
    components = raw.get("components", {})
    for comp_name in ("button", "input"):
        comp = components.get(comp_name, {})
        default = comp.get("default", comp.get("primary", comp.get("secondary", {})))
        if isinstance(default, dict) and "height" in default:
            tokens.setdefault("--semi-height-control-default", default["height"])
    for key, val in SEMI_SIZING.items():
        tokens.setdefault(f"--semi-{key}", val)


def _map_v3_chart_palette(raw, tokens):
    primary = tokens.get("--semi-color-primary")
    if not primary or not primary.startswith("#"):
        return
    palette = generate_chart_palette(primary)
    for i, color in enumerate(palette):
        tokens[f"--semi-color-data-{i}"] = color


# ============ OUTPUT GENERATORS ============

def generate_css_override(tokens: dict, meta: dict = None) -> str:
    meta = meta or {}
    url = meta.get("url", "unknown")
    title = meta.get("title", "")
    timestamp = meta.get("timestamp", "")

    groups = {
        "Brand Colors": [], "Secondary & Tertiary": [], "Semantic Colors": [],
        "Default Colors": [], "Disabled States": [], "Link Colors": [],
        "Special Colors": [], "Surface & Background": [],
        "Fill Colors": [], "Text Colors": [],
        "Border & Radius": [], "Shadows": [],
        "Typography": [], "Spacing": [], "Sizing": [],
        "Layout": [], "Chart Data Palette": [], "Neutral Scale": [],
        "Grey Palette": [], "Other": [],
    }

    for var, val in sorted(tokens.items()):
        if "data-" in var:
            groups["Chart Data Palette"].append((var, val))
        elif "neutral-" in var:
            groups["Neutral Scale"].append((var, val))
        elif "grey-" in var:
            groups["Grey Palette"].append((var, val))
        elif "primary" in var and "color" in var:
            groups["Brand Colors"].append((var, val))
        elif "secondary" in var or "tertiary" in var:
            groups["Secondary & Tertiary"].append((var, val))
        elif any(s in var for s in ("success", "warning", "danger", "info-")):
            groups["Semantic Colors"].append((var, val))
        elif "default" in var and "color" in var:
            groups["Default Colors"].append((var, val))
        elif "disabled" in var:
            groups["Disabled States"].append((var, val))
        elif "link" in var:
            groups["Link Colors"].append((var, val))
        elif any(s in var for s in ("white", "black", "focus", "highlight", "nav-bg", "overlay")):
            groups["Special Colors"].append((var, val))
        elif "bg-" in var:
            groups["Surface & Background"].append((var, val))
        elif "fill-" in var:
            groups["Fill Colors"].append((var, val))
        elif "text-" in var:
            groups["Text Colors"].append((var, val))
        elif "border" in var or "radius" in var or "thickness" in var:
            groups["Border & Radius"].append((var, val))
        elif "shadow" in var:
            groups["Shadows"].append((var, val))
        elif "font-" in var or "line-height" in var:
            groups["Typography"].append((var, val))
        elif "spacing" in var:
            groups["Spacing"].append((var, val))
        elif "height-" in var or "width-icon" in var:
            groups["Sizing"].append((var, val))
        elif "layout" in var:
            groups["Layout"].append((var, val))
        else:
            groups["Other"].append((var, val))

    lines = [
        f"/* Semi-Sync Harvester — Theme Override */",
        f"/* Source: {url} */",
        f"/* Title: {title} */",
        f"/* Extracted: {timestamp} */",
        f"/* Total Tokens: {len(tokens)} */",
        f"/* Spec: Semi Design global.scss (DouyinFE/semi-design) */",
        "",
        "body {"
    ]

    for group_name, items in groups.items():
        if items:
            lines.append(f"\n  /* -- {group_name} ({len(items)}) -- */")
            for var, val in items:
                lines.append(f"  {var}: {val};")

    lines.append("\n}")
    return "\n".join(lines)


def generate_figma_tokens(tokens: dict, meta: dict = None) -> str:
    meta = meta or {}
    figma = {}
    for var, val in tokens.items():
        key = var.replace("--", "").replace("semi-", "semi/")
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
        figma[key] = {"value": val, "type": token_type}
    result = {
        "_metadata": {
            "source": meta.get("url", ""),
            "title": meta.get("title", ""),
            "generated_by": "UX Master — Semi-Sync Harvester v3",
            "timestamp": meta.get("timestamp", ""),
            "token_count": len(tokens),
        },
        **figma
    }
    return json.dumps(result, indent=2, ensure_ascii=False)


def generate_summary(tokens: dict, meta: dict = None) -> str:
    meta = meta or {}
    total = len(tokens)
    cats = {}
    for var in tokens:
        if "color" in var:
            cats["Color"] = cats.get("Color", 0) + 1
        elif "font" in var or "line-height" in var:
            cats["Typography"] = cats.get("Typography", 0) + 1
        elif "spacing" in var:
            cats["Spacing"] = cats.get("Spacing", 0) + 1
        elif "border" in var or "radius" in var:
            cats["Border"] = cats.get("Border", 0) + 1
        elif "shadow" in var:
            cats["Shadow"] = cats.get("Shadow", 0) + 1
        elif "layout" in var:
            cats["Layout"] = cats.get("Layout", 0) + 1
        elif "data-" in var:
            cats["Chart"] = cats.get("Chart", 0) + 1
        else:
            cats["Other"] = cats.get("Other", 0) + 1
    lines = [
        f"# Semi-Sync Harvest Report\n",
        f"**Source:** {meta.get('url', 'unknown')}",
        f"**Total Tokens:** {total}\n",
        "| Category | Count |", "|---|---|",
    ]
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        lines.append(f"| {cat} | {count} |")
    lines.extend(["\n## Token Reference\n", "| Semi Variable | Value |", "|---|---|"])
    for var, val in sorted(tokens.items()):
        lines.append(f"| `{var}` | `{val}` |")
    return "\n".join(lines)


# ============ CLI ============

if __name__ == "__main__":
    import argparse
    import sys
    from pathlib import Path

    parser = argparse.ArgumentParser(description="Semi Token Compiler")
    parser.add_argument("--input", "-i", help="Input JSON file")
    parser.add_argument("--output", "-o", default=None, help="Output CSS file")
    parser.add_argument("--figma", "-f", default=None, help="Output Figma tokens file")
    parser.add_argument("--project", "-p", default=None, help="Project slug")
    parser.add_argument("--summary", "-s", action="store_true", help="Print summary")
    parser.add_argument("--test", action="store_true", help="Run with sample data")
    args = parser.parse_args()

    if args.test:
        sample = {
            "meta": {"url": "https://example.com", "timestamp": "test", "title": "Test"},
            "colors": {"primary": "rgb(23, 92, 211)", "success": "rgb(16, 185, 129)"},
            "surfaces": {"app_bg": "rgb(244, 246, 248)", "card_bg": "rgb(255, 255, 255)"},
            "typography": {"font_family": "Inter, sans-serif", "body_size": "14px",
                           "title_color": "rgb(15, 23, 42)", "body_color": "rgb(71, 85, 105)"},
            "geometry": {"button_radius": "4px", "card_shadow": "0px 1px 3px rgba(0,0,0,0.1)"}
        }
        tokens = map_to_semi_tokens(sample)
        print(generate_css_override(tokens, sample["meta"]))
        print("\n---\n")
        print(generate_summary(tokens, sample["meta"]))
        sys.exit(0)

    if args.input:
        with open(args.input, "r") as f:
            raw = json.load(f)
    else:
        raw = json.load(sys.stdin)

    meta = raw.get("meta", {})
    tokens = map_to_semi_tokens(raw)

    if args.project:
        from project_registry import ProjectRegistry
        registry = ProjectRegistry()
        project_dir = registry.get_project_dir(args.project)
        project_dir.mkdir(parents=True, exist_ok=True)
        css_path = args.output or str(project_dir / "semi-theme-override.css")
        figma_path = args.figma or str(project_dir / "figma-tokens.json")
        manifest = registry.get(args.project)
        if manifest:
            registry.add_page_harvest(args.project, raw)
    else:
        css_path = args.output or "semi-theme-override.css"
        figma_path = args.figma or "figma-tokens.json"

    css = generate_css_override(tokens, meta)
    with open(css_path, "w") as f:
        f.write(css)
    print(f"[OK] CSS written to {css_path} ({len(tokens)} tokens)")

    figma = generate_figma_tokens(tokens, meta)
    with open(figma_path, "w") as f:
        f.write(figma)
    print(f"[OK] Figma tokens written to {figma_path}")

    if args.summary:
        print("\n" + generate_summary(tokens, meta))
