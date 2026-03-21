#!/usr/bin/env python3
"""
MasterDesign Agent — Pro Feature Stubs (Free Tier)

Provides stub functions for all Pro features that display upgrade banners.
When users call Pro features without a license, they see what they're
missing and how to upgrade — the most powerful FOMO mechanism.

Usage:
    python3 pro_stubs.py token_mapper
    python3 pro_stubs.py design_doc
    python3 pro_stubs.py project_registry
    python3 pro_stubs.py harvest_session
    python3 pro_stubs.py semi_mcp_bridge
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from license import require_pro


PRO_FEATURES = {
    "token_mapper": {
        "name": "Token Mapper",
        "description": "Map 80+ harvested tokens → Semi Design CSS variables, Figma Tokens Studio JSON, and human-readable markdown summary.",
        "example": (
            "python3 scripts/token_mapper.py -i harvest.json --project myapp\n"
            "  → output/myapp/semi-theme-override.css\n"
            "  → output/myapp/figma-tokens.json\n"
            "  → output/myapp/token-summary.md"
        ),
    },
    "design_doc": {
        "name": "Design Doc Generator",
        "description": "Generate a beautiful, self-contained HTML documentation page with interactive color swatches, typography specimens, component previews, and dark mode toggle.",
        "example": (
            "python3 scripts/design_doc_generator.py --project myapp --open\n"
            "  → output/myapp/design-system.html (single-file, shareable)"
        ),
    },
    "project_registry": {
        "name": "Multi-Project Registry",
        "description": "Manage multiple harvested design systems. Track pages scanned, auto-merge harvests, maintain project manifests.",
        "example": (
            "python3 scripts/project_registry.py --create 'MyApp' --url https://myapp.com\n"
            "python3 scripts/project_registry.py --list\n"
            "python3 scripts/project_registry.py --add-harvest myapp -i harvest.json"
        ),
    },
    "harvest_session": {
        "name": "Multi-Harvest Merge",
        "description": "Merge harvests from multiple pages using voting/frequency strategies. Calculate confidence scores for each design token.",
        "example": (
            "python3 scripts/harvest_session.py page1.json page2.json page3.json \\\n"
            "  -o merged.json --confidence"
        ),
    },
    "semi_mcp_bridge": {
        "name": "Semi MCP Bridge",
        "description": "Map harvested UI patterns to Semi Design components. Auto-detect layout types (sidebar, dashboard, form, table, card-grid) and generate React templates with correct Semi components.",
        "example": (
            "from semi_mcp_bridge import build_harvest_bundle\n"
            "bundle = build_harvest_bundle(harvest_data, semi_tokens)"
        ),
    },
}


def show_feature_stub(feature_key: str):
    """Show detailed stub for a specific Pro feature."""
    feature = PRO_FEATURES.get(feature_key)
    if not feature:
        print(f"Unknown feature: {feature_key}")
        print(f"Available: {', '.join(PRO_FEATURES.keys())}")
        return

    # Check license first
    if require_pro(feature["name"]):
        print(f"✅ {feature['name']} is available! Run the actual script.")
        return

    # Show what they're missing
    print(f"  📋 {feature['description']}")
    print()
    print(f"  Example usage:")
    for line in feature["example"].split("\n"):
        print(f"    {line}")
    print()


def show_all_features():
    """Show overview of all Pro features."""
    print()
    print("┌──────────────────────────────────────────────────────┐")
    print("│           MasterDesign Agent Pro — Feature Overview            │")
    print("├──────────────────────────────────────────────────────┤")
    
    for key, feature in PRO_FEATURES.items():
        print(f"│  🔒 {feature['name']:<46}│")
        # Wrap description
        desc = feature["description"]
        while desc:
            chunk = desc[:48]
            desc = desc[48:]
            print(f"│     {chunk:<47}│")
    
    print("├──────────────────────────────────────────────────────┤")
    print("│  → https://ux-master.dev/pro                         │")
    print("│  One-time payment. Lifetime access.                   │")
    print("│  All future updates included.                         │")
    print("└──────────────────────────────────────────────────────┘")
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] in ("--help", "-h", "all"):
        show_all_features()
    else:
        show_feature_stub(sys.argv[1])
