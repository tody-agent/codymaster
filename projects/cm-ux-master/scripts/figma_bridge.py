#!/usr/bin/env python3
"""
Figma Bridge — Export/Import Design Tokens với Figma

Tích hợp 2 chiều giữa Harvester v4 và Figma:
- Export tokens từ Harvester → Figma Tokens Studio
- Import tokens từ Figma → Harvester format
- Sync tokens giữa code và design

Usage:
    python figma_bridge.py export --input design-system.json --output figma-tokens.json
    python figma_bridge.py import --input figma-tokens.json --output design-system.json
    python figma_bridge.py sync --file <figma_file_key> --token <access_token>

Author: UX Master AI
Version: 4.0.0
"""

import json
import argparse
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class FigmaToken:
    """Single Figma token representation."""
    name: str
    value: Any
    type: str
    description: str = ""


class FigmaBridge:
    """Bridge between Harvester and Figma."""
    
    TOKEN_TYPES = {
        "color": ["color", "bg-", "text-", "fill-", "border"],
        "fontSizes": ["font-size", "size-"],
        "fontFamilies": ["font-family", "family"],
        "fontWeights": ["font-weight", "weight"],
        "spacing": ["spacing", "space", "padding", "margin"],
        "borderRadius": ["radius", "rounded"],
        "boxShadow": ["shadow", "elevation"],
        "sizing": ["width", "height", "size-"]
    }
    
    def __init__(self):
        self.tokens = []
    
    def detect_token_type(self, name: str, value: Any) -> str:
        """Detect token type from name."""
        name_lower = name.lower()
        
        # Check value first
        if isinstance(value, str):
            if value.startswith("#") or value.startswith("rgb"):
                return "color"
            if "px" in value and any(x in name_lower for x in ["shadow", "elevation"]):
                return "boxShadow"
            if "px" in value and any(x in name_lower for x in ["radius", "rounded"]):
                return "borderRadius"
        
        # Check name patterns
        for token_type, patterns in self.TOKEN_TYPES.items():
            for pattern in patterns:
                if pattern in name_lower:
                    return token_type
        
        return "other"
    
    def harvester_to_figma(self, harvester_data: Dict, token_set_name: str = "Design System") -> Dict:
        """Convert Harvester format to Figma Tokens Studio format."""
        figma_tokens = {
            "_version": "1.0",
            token_set_name: {}
        }
        
        # Process colors
        colors = harvester_data.get("colors", {})
        for name, value in colors.items():
            if isinstance(value, dict) and "base" in value:
                # Complex color with shades
                figma_tokens[token_set_name][f"color/{name}"] = {
                    "value": value["base"],
                    "type": "color",
                    "description": f"Base {name} color"
                }
                
                # Add shades
                if "shades" in value:
                    for shade_name, shade_value in value["shades"].items():
                        figma_tokens[token_set_name][f"color/{name}/{shade_name}"] = {
                            "value": shade_value,
                            "type": "color",
                            "description": f"{name} {shade_name} variant"
                        }
            elif isinstance(value, str):
                figma_tokens[token_set_name][f"color/{name}"] = {
                    "value": value,
                    "type": "color",
                    "description": f"{name} color"
                }
        
        # Process typography
        typography = harvester_data.get("typography", {})
        for name, value in typography.items():
            token_type = self.detect_token_type(name, value)
            
            # Organize hierarchically
            parts = name.replace("--", "").replace("semi-", "").split("-")
            category = parts[0] if parts else "other"
            
            figma_tokens[token_set_name][f"{category}/{name}"] = {
                "value": value,
                "type": token_type,
                "description": f"Typography: {name}"
            }
        
        # Process spacing
        spacing = harvester_data.get("spacing", {})
        for name, value in spacing.items():
            clean_name = name.replace("--", "").replace("semi-", "").replace("spacing-", "")
            figma_tokens[token_set_name][f"spacing/{clean_name}"] = {
                "value": value,
                "type": "spacing",
                "description": f"Spacing: {clean_name}"
            }
        
        # Process borders
        borders = harvester_data.get("borders", {})
        for name, value in borders.items():
            clean_name = name.replace("--", "").replace("semi-", "").replace("border-", "")
            token_type = "borderRadius" if "radius" in name else "borderWidth"
            figma_tokens[token_set_name][f"border/{clean_name}"] = {
                "value": value,
                "type": token_type,
                "description": f"Border: {clean_name}"
            }
        
        # Process shadows
        shadows = harvester_data.get("shadows", {})
        for name, value in shadows.items():
            clean_name = name.replace("--", "").replace("semi-", "").replace("shadow-", "")
            figma_tokens[token_set_name][f"shadow/{clean_name}"] = {
                "value": value,
                "type": "boxShadow",
                "description": f"Shadow: {clean_name}"
            }
        
        return figma_tokens
    
    def figma_to_harvester(self, figma_data: Dict) -> Dict:
        """Convert Figma Tokens Studio format to Harvester format."""
        harvester_data = {
            "name": "Imported from Figma",
            "colors": {},
            "typography": {},
            "spacing": {},
            "borders": {},
            "shadows": {},
            "sizing": {}
        }
        
        # Get first token set
        token_set = None
        for key, value in figma_data.items():
            if key != "_version" and isinstance(value, dict):
                token_set = value
                break
        
        if not token_set:
            return harvester_data
        
        for full_name, token in token_set.items():
            if not isinstance(token, dict):
                continue
            
            value = token.get("value")
            token_type = token.get("type", "other")
            
            # Parse hierarchical name
            parts = full_name.split("/")
            category = parts[0] if parts else "other"
            name = "/".join(parts[1:]) if len(parts) > 1 else parts[0]
            
            # Convert to semi format
            semi_name = f"--semi-{category}-{name.replace('/', '-')}"
            
            if token_type == "color" or category == "color":
                harvester_data["colors"][name] = value
            elif token_type in ["fontSizes", "fontFamilies", "fontWeights"]:
                harvester_data["typography"][semi_name.replace("--semi-", "")] = value
            elif token_type == "spacing":
                harvester_data["spacing"][semi_name.replace("--semi-", "")] = value
            elif token_type in ["borderRadius", "borderWidth"]:
                harvester_data["borders"][semi_name.replace("--semi-", "")] = value
            elif token_type == "boxShadow":
                harvester_data["shadows"][semi_name.replace("--semi-", "")] = value
            elif token_type == "sizing":
                harvester_data["sizing"][semi_name.replace("--semi-", "")] = value
        
        return harvester_data
    
    def generate_css_from_figma(self, figma_data: Dict) -> str:
        """Generate CSS variables from Figma tokens."""
        harvester_data = self.figma_to_harvester(figma_data)
        
        lines = [
            "/**",
            " * Design System — Generated from Figma",
            f" * Timestamp: {__import__('datetime').datetime.now().isoformat()}",
            " */",
            "",
            ":root {"
        ]
        
        # Colors
        if harvester_data["colors"]:
            lines.append("  /* Colors */")
            for name, value in harvester_data["colors"].items():
                var_name = f"--semi-color-{name.replace('/', '-')}"
                lines.append(f"  {var_name}: {value};")
        
        # Typography
        if harvester_data["typography"]:
            lines.append("\n  /* Typography */")
            for name, value in harvester_data["typography"].items():
                lines.append(f"  --semi-{name}: {value};")
        
        # Spacing
        if harvester_data["spacing"]:
            lines.append("\n  /* Spacing */")
            for name, value in harvester_data["spacing"].items():
                lines.append(f"  --semi-{name}: {value};")
        
        # Borders
        if harvester_data["borders"]:
            lines.append("\n  /* Borders */")
            for name, value in harvester_data["borders"].items():
                lines.append(f"  --semi-{name}: {value};")
        
        # Shadows
        if harvester_data["shadows"]:
            lines.append("\n  /* Shadows */")
            for name, value in harvester_data["shadows"].items():
                lines.append(f"  --semi-{name}: {value};")
        
        lines.append("}")
        
        return "\n".join(lines)
    
    def compare_tokens(self, harvester_data: Dict, figma_data: Dict) -> Dict:
        """Compare tokens between Harvester and Figma."""
        # Convert both to same format for comparison
        figma_converted = self.figma_to_harvester(figma_data)
        
        differences = {
            "added": [],
            "removed": [],
            "modified": []
        }
        
        # Check colors
        h_colors = set(harvester_data.get("colors", {}).keys())
        f_colors = set(figma_converted.get("colors", {}).keys())
        
        differences["added"].extend([{"type": "color", "name": c} for c in f_colors - h_colors])
        differences["removed"].extend([{"type": "color", "name": c} for c in h_colors - f_colors])
        
        # Check modified
        for color in h_colors & f_colors:
            h_val = harvester_data["colors"][color]
            f_val = figma_converted["colors"][color]
            if isinstance(h_val, dict):
                h_val = h_val.get("base", "")
            if h_val != f_val:
                differences["modified"].append({
                    "type": "color",
                    "name": color,
                    "harvester": h_val,
                    "figma": f_val
                })
        
        return differences


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Figma Bridge — Design Tokens Sync",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Export Harvester to Figma
  python figma_bridge.py export --input design-system.json --name "MyApp"
  
  # Import Figma to Harvester
  python figma_bridge.py import --input figma-tokens.json
  
  # Generate CSS from Figma
  python figma_bridge.py css --input figma-tokens.json --output design-system.css
  
  # Compare tokens
  python figma_bridge.py compare --harvester design-system.json --figma figma-tokens.json
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command")
    
    # Export command
    export_parser = subparsers.add_parser("export", help="Export Harvester to Figma")
    export_parser.add_argument("--input", "-i", required=True, help="Harvester JSON file")
    export_parser.add_argument("--output", "-o", help="Output Figma tokens file")
    export_parser.add_argument("--name", "-n", default="Design System", help="Token set name")
    
    # Import command
    import_parser = subparsers.add_parser("import", help="Import Figma to Harvester")
    import_parser.add_argument("--input", "-i", required=True, help="Figma tokens JSON")
    import_parser.add_argument("--output", "-o", default="from-figma.json", help="Output file")
    
    # CSS command
    css_parser = subparsers.add_parser("css", help="Generate CSS from Figma")
    css_parser.add_argument("--input", "-i", required=True, help="Figma tokens JSON")
    css_parser.add_argument("--output", "-o", default="design-system.css", help="Output CSS file")
    
    # Compare command
    compare_parser = subparsers.add_parser("compare", help="Compare Harvester vs Figma")
    compare_parser.add_argument("--harvester", "-h", required=True, help="Harvester JSON")
    compare_parser.add_argument("--figma", "-f", required=True, help="Figma tokens JSON")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    bridge = FigmaBridge()
    
    if args.command == "export":
        with open(args.input, 'r') as f:
            harvester_data = json.load(f)
        
        figma_tokens = bridge.harvester_to_figma(harvester_data, args.name)
        
        output_path = args.output or "figma-tokens.json"
        with open(output_path, 'w') as f:
            json.dump(figma_tokens, f, indent=2)
        
        token_count = len(figma_tokens.get(args.name, {}))
        print(f"✓ Exported {token_count} tokens to {output_path}")
        print(f"✓ Token set name: {args.name}")
        print("\nNext steps:")
        print("1. Open Figma and install Tokens Studio plugin")
        print("2. Import the JSON file")
        print("3. Apply tokens to your designs")
    
    elif args.command == "import":
        with open(args.input, 'r') as f:
            figma_data = json.load(f)
        
        harvester_data = bridge.figma_to_harvester(figma_data)
        
        with open(args.output, 'w') as f:
            json.dump(harvester_data, f, indent=2)
        
        print(f"✓ Imported {len(harvester_data)} categories to {args.output}")
        for category, tokens in harvester_data.items():
            if isinstance(tokens, dict):
                print(f"  - {category}: {len(tokens)} tokens")
    
    elif args.command == "css":
        with open(args.input, 'r') as f:
            figma_data = json.load(f)
        
        css = bridge.generate_css_from_figma(figma_data)
        
        with open(args.output, 'w') as f:
            f.write(css)
        
        print(f"✓ Generated CSS: {args.output}")
        print(f"✓ Lines: {len(css.split(chr(10)))}")
    
    elif args.command == "compare":
        with open(args.harvester, 'r') as f:
            harvester_data = json.load(f)
        with open(args.figma, 'r') as f:
            figma_data = json.load(f)
        
        diff = bridge.compare_tokens(harvester_data, figma_data)
        
        print("Token Comparison Results:")
        print(f"  Added in Figma: {len(diff['added'])}")
        print(f"  Removed from Figma: {len(diff['removed'])}")
        print(f"  Modified: {len(diff['modified'])}")
        
        if diff['modified']:
            print("\nModified tokens:")
            for item in diff['modified']:
                print(f"  - {item['name']}: {item['harvester']} → {item['figma']}")


if __name__ == "__main__":
    main()
