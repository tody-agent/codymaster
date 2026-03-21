#!/usr/bin/env python3
"""
Google Stitch Integration — AI Design Generation Bridge

Tích hợp Harvester v4 với Google Stitch để tạo UI bằng AI:
- Tạo DESIGN.md từ design tokens
- Generate optimized prompts cho Stitch
- Sync giữa code và AI-generated designs
- Batch screen generation

Usage:
    python stitch_integration.py design-md --input design-system.json --project "MyApp"
    python stitch_integration.py prompt --input design-system.json --screen dashboard
    python stitch_integration.py batch --spec screens.json

Author: UX Master AI
Version: 4.0.0
"""

import json
import argparse
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ScreenSpec:
    """Screen specification for generation."""
    name: str
    type: str
    description: str
    sections: List[str]


class StitchIntegration:
    """Integration with Google Stitch AI."""
    
    SCREEN_TEMPLATES = {
        "dashboard": {
            "description": "Data overview and key metrics display",
            "sections": [
                "Header with navigation and user profile",
                "Key metrics cards (4-6 cards in grid)",
                "Charts and data visualization",
                "Recent activity feed",
                "Quick action buttons"
            ],
            "keywords": ["analytics", "metrics", "overview", "data"]
        },
        "landing": {
            "description": "Marketing homepage with conversion focus",
            "sections": [
                "Hero section with headline and CTA",
                "Feature highlights (3-4 features)",
                "Social proof (testimonials/logos)",
                "Pricing or value proposition",
                "Footer with navigation and links"
            ],
            "keywords": ["marketing", "conversion", "hero", "features"]
        },
        "settings": {
            "description": "User preferences and configuration",
            "sections": [
                "Sidebar navigation for categories",
                "Form inputs for preferences",
                "Toggle switches for features",
                "Save and cancel actions",
                "Section organization with dividers"
            ],
            "keywords": ["configuration", "preferences", "forms", "options"]
        },
        "profile": {
            "description": "User profile and account management",
            "sections": [
                "Profile header with avatar",
                "User statistics or badges",
                "Activity timeline or history",
                "Edit profile actions",
                "Tab navigation for sections"
            ],
            "keywords": ["account", "user", "avatar", "stats"]
        },
        "checkout": {
            "description": "Payment and order completion flow",
            "sections": [
                "Order summary sidebar",
                "Payment form with validation",
                "Shipping information",
                "Review and confirm step",
                "Progress indicator"
            ],
            "keywords": ["payment", "order", "form", "ecommerce"]
        },
        "list": {
            "description": "Data list with search and filters",
            "sections": [
                "Search bar with filters",
                "Sort and view options",
                "Data table or card grid",
                "Pagination controls",
                "Bulk action toolbar"
            ],
            "keywords": ["table", "grid", "search", "data"]
        },
        "detail": {
            "description": "Item detail view with full information",
            "sections": [
                "Breadcrumb navigation",
                "Hero image or media",
                "Main content area",
                "Related items sidebar",
                "Action buttons"
            ],
            "keywords": ["view", "detail", "content", "media"]
        }
    }
    
    def __init__(self, design_tokens: Optional[Dict] = None):
        self.tokens = design_tokens or {}
    
    def generate_design_md(self, project_name: str) -> str:
        """Generate DESIGN.md file for Stitch."""
        colors = self.tokens.get("color", {})
        typography = self.tokens.get("typography", {})
        spacing = self.tokens.get("spacing", {})
        borders = self.tokens.get("borders", {})
        
        lines = [
            f"# Design System: {project_name}",
            "",
            "## 1. Visual Theme & Atmosphere",
            f"A professional, modern interface designed for {project_name}.",
            "The design prioritizes clarity, usability, and consistent visual language.",
            "",
            "## 2. Color Palette & Roles",
            ""
        ]
        
        # Primary colors
        if "primary" in colors:
            primary = colors["primary"]
            if isinstance(primary, dict):
                primary = primary.get("base", "")
            lines.extend([
                f"**Primary Action** ({primary})",
                f"- Hex: {primary}",
                "- Usage: Main CTAs, primary buttons, active states, links",
                "- Psychology: Professional, trustworthy, actionable",
                ""
            ])
        
        # Semantic colors
        semantic_colors = ["success", "warning", "danger", "info"]
        lines.append("**Semantic Colors:**")
        for color_name in semantic_colors:
            if color_name in colors:
                color_val = colors[color_name]
                if isinstance(color_val, dict):
                    color_val = color_val.get("base", "")
                lines.append(f"- {color_name.capitalize()}: {color_val}")
        lines.append("")
        
        # Neutral scale
        lines.append("**Neutral Scale:**")
        for i in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]:
            key = f"neutral-{i}"
            if key in colors:
                lines.append(f"- {key}: {colors[key]}")
        lines.append("")
        
        # Background colors
        lines.append("**Background Colors:**")
        bg_mapping = {
            "bg-0": "Page background",
            "bg-1": "Card/surface background",
            "bg-2": "Sidebar/secondary background",
            "bg-3": "Header background",
            "bg-4": "Modal/overlay background"
        }
        for key, desc in bg_mapping.items():
            if key in colors:
                lines.append(f"- {key} ({desc}): {colors[key]}")
        lines.append("")
        
        # Typography
        lines.extend([
            "## 3. Typography Rules",
            "",
            f"**Font Family:** {typography.get('font-family-regular', 'Inter, -apple-system, sans-serif')}",
            "- Clean, modern sans-serif for optimal readability",
            "- Fallback to system fonts for performance",
            "",
            "**Type Scale:**"
        ])
        
        # Font sizes
        size_mapping = {
            "font-size-header-1": "32px — Hero headlines",
            "font-size-header-2": "28px — Section headers",
            "font-size-header-3": "24px — Subsection headers",
            "font-size-header-4": "20px — Card titles",
            "font-size-header-5": "18px — Small headers",
            "font-size-header-6": "16px — Labels",
            "font-size-regular": "14px — Body text",
            "font-size-small": "12px — Captions, metadata"
        }
        for key, desc in size_mapping.items():
            if key in typography:
                lines.append(f"- {desc.split(' — ')[1]}: {typography[key]}")
        
        lines.extend([
            "",
            "**Font Weights:**",
            "- Light (200): Special emphasis",
            "- Regular (400): Body text",
            "- Medium (500): Subheadings",
            "- Semibold (600): Labels, buttons",
            "- Bold (700): Headlines",
            "",
            "## 4. Component Stylings",
            "",
            "**Buttons:**",
            "- Primary: Solid fill with primary color, white text",
            "- Secondary: Outlined with primary border, transparent background",
            "- Ghost: No border, text only with hover background",
            "- Border Radius: 6px (medium rounded)",
            f"- Padding: {spacing.get('spacing-base-tight', '12px')} {spacing.get('spacing-base', '16px')}",
            "- Hover: Darken background by 10%",
            "- Active: Darken background by 20%",
            "",
            "**Cards:**",
            f"- Background: {colors.get('bg-1', '#FFFFFF')}",
            f"- Border Radius: {borders.get('radius-lg', '12px')} (large rounded)",
            "- Shadow: Elevated (subtle shadow for depth)",
            f"- Padding: {spacing.get('spacing-loose', '24px')}",
            "- Border: 1px solid neutral-200 (optional)",
            "",
            "**Inputs:**",
            f"- Border: {borders.get('thickness-control', '1px')} solid neutral-300",
            f"- Border Radius: {borders.get('radius-medium', '6px')}",
            "- Focus: Primary color border with subtle shadow",
            f"- Padding: {spacing.get('spacing-tight', '8px')} {spacing.get('spacing-base-tight', '12px')}",
            "- Placeholder: neutral-400",
            "",
            "**Tags/Badges:**",
            "- Small rounded (full radius for pills)",
            "- Light background with matching text",
            "- Success: green tint, Warning: yellow tint, Danger: red tint",
            "",
            "## 5. Layout Principles",
            f"- **Grid System:** 8px base unit ({spacing.get('spacing-tight', '8px')})",
            "- **Max Content Width:** 1200px (centered)",
            "- **Spacing Scale:",
        ])
        
        spacing_scale = [
            ("spacing-none", "0px"),
            ("spacing-super-tight", "2px"),
            ("spacing-extra-tight", "4px"),
            ("spacing-tight", "8px"),
            ("spacing-base-tight", "12px"),
            ("spacing-base", "16px"),
            ("spacing-base-loose", "20px"),
            ("spacing-loose", "24px"),
            ("spacing-extra-loose", "32px"),
            ("spacing-super-loose", "40px")
        ]
        for key, default in spacing_scale:
            if key in spacing:
                lines.append(f"  - {key.replace('spacing-', '')}: {spacing[key]}")
        
        lines.extend([
            "",
            "- **Shadows:**",
            "  - sm: Subtle elevation (cards at rest)",
            "  - elevated: Medium elevation (dropdowns, popovers)",
            "  - lg: High elevation (modals, dialogs)",
            "",
            "## 6. Responsive Breakpoints",
            "- Mobile: < 640px",
            "- Tablet: 640px — 1024px",
            "- Desktop: > 1024px",
            "",
            "## 7. Accessibility",
            "- WCAG AA compliant contrast ratios",
            "- Focus visible states on all interactive elements",
            "- Semantic HTML structure",
            "- Touch target minimum 44x44px on mobile",
            ""
        ])
        
        return "\n".join(lines)
    
    def generate_stitch_prompt(self, screen_type: str, custom_sections: Optional[List[str]] = None) -> Dict:
        """Generate optimized prompt for Google Stitch."""
        template = self.SCREEN_TEMPLATES.get(screen_type, self.SCREEN_TEMPLATES["dashboard"])
        colors = self.tokens.get("color", {})
        typography = self.tokens.get("typography", {})
        
        # Build color section
        color_lines = ["## Color Palette"]
        
        if "primary" in colors:
            primary = colors["primary"]
            if isinstance(primary, dict):
                primary = primary.get("base", "")
            color_lines.append(f"- **Primary**: {primary} — Main CTAs, buttons, active states")
        
        semantic = ["success", "warning", "danger", "info"]
        for s in semantic:
            if s in colors:
                val = colors[s]
                if isinstance(val, dict):
                    val = val.get("base", "")
                color_lines.append(f"- **{s.capitalize()}**: {val}")
        
        # Typography section
        font_family = typography.get('font-family-regular', 'Inter, sans-serif')
        
        # Build prompt
        sections = custom_sections or template["sections"]
        
        prompt_parts = [
            f"# Design a {screen_type} screen",
            "",
            f"Create a {template['description']} with the following specifications:",
            "",
            *color_lines,
            "",
            "## Typography",
            f"- Font Family: {font_family}",
            f"- Base Size: {typography.get('font-size-regular', '14px')}",
            "- Clean, modern, professional aesthetic",
            "",
            "## Layout & Structure",
            f"This {screen_type} should include:"
        ]
        
        for i, section in enumerate(sections, 1):
            prompt_parts.append(f"{i}. {section}")
        
        prompt_parts.extend([
            "",
            "## Design Guidelines",
            "- Use the primary color for main actions and highlights",
            "- Maintain consistent 8px spacing grid",
            "- Include hover states for interactive elements",
            "- Ensure proper visual hierarchy",
            "- Use cards with subtle shadows for content grouping",
            "- Keep accessibility in mind (contrast, touch targets)",
            "",
            "## Style Notes",
            "- Modern, professional appearance",
            "- Clean lines and generous whitespace",
            "- Subtle animations on interactions",
            "- Mobile-responsive layout",
            f"- Keywords: {', '.join(template['keywords'])}"
        ])
        
        return {
            "prompt": "\n".join(prompt_parts),
            "screen_type": screen_type,
            "word_count": len(" ".join(prompt_parts).split()),
            "sections": sections,
            "estimated_screens": len(sections),
            "tips": [
                "Paste this prompt into Google Stitch",
                "Adjust sections based on specific needs",
                "Iterate on generated designs",
                "Export and refine in Figma if needed"
            ]
        }
    
    def generate_batch_spec(self, screens: List[str]) -> Dict:
        """Generate batch specification for multiple screens."""
        specs = []
        
        for screen in screens:
            template = self.SCREEN_TEMPLATES.get(screen, self.SCREEN_TEMPLATES["dashboard"])
            specs.append({
                "name": screen,
                "description": template["description"],
                "sections": template["sections"],
                "keywords": template["keywords"]
            })
        
        return {
            "project": "Generated from Harvester",
            "timestamp": datetime.now().isoformat(),
            "screens": specs,
            "total_screens": len(specs),
            "workflow": [
                "Generate each screen using individual prompts",
                "Maintain consistency using shared DESIGN.md",
                "Review and iterate on each screen",
                "Export final designs to Figma",
                "Handoff to development with design tokens"
            ]
        }
    
    def generate_component_library_prompt(self) -> str:
        """Generate prompt for creating component library in Stitch."""
        colors = self.tokens.get("color", {})
        
        primary = colors.get("primary", "#0064FA")
        if isinstance(primary, dict):
            primary = primary.get("base", "#0064FA")
        
        return f"""
Create a comprehensive component library with the following elements:

## Colors
- Primary: {primary}
- Use semantic colors for states (success, warning, danger, info)
- Neutral scale from white to black for text and backgrounds

## Components to Create

### Buttons
1. Primary Button — Solid fill, white text
2. Secondary Button — Outlined style
3. Ghost Button — Text only with hover background
4. Destructive Button — Red/danger color
5. Icon Button — Circular with icon only

### Form Elements
1. Text Input — Default, focus, error states
2. Select/Dropdown — Single select
3. Checkbox — Checked and unchecked
4. Radio Button — Selected and unselected
5. Toggle Switch — On and off states
6. Textarea — Multi-line input

### Data Display
1. Card — With header, content, footer
2. Table — With headers, rows, hover states
3. List — Ordered and unordered
4. Badge/Tag — Various colors
5. Avatar — Circle and square
6. Progress Bar — Linear

### Feedback
1. Alert — Info, success, warning, error
2. Toast/Notification — Auto-dismiss
3. Modal/Dialog — Overlay with content
4. Tooltip — Hover information
5. Skeleton — Loading state

### Navigation
1. Tabs — Horizontal and vertical
2. Breadcrumbs — Path navigation
3. Pagination — Page numbers
4. Sidebar — Collapsible navigation
5. Navbar — Top navigation

## Style Guidelines
- Consistent border radius (6px for inputs, 12px for cards)
- Proper spacing using 8px grid
- Clear hover and active states
- Accessible contrast ratios
- Modern, clean aesthetic
"""


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Google Stitch Integration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate DESIGN.md
  python stitch_integration.py design-md --input design-system.json --project "MyApp"
  
  # Generate screen prompt
  python stitch_integration.py prompt --input design-system.json --screen dashboard
  
  # Generate batch spec
  python stitch_integration.py batch --input design-system.json --screens dashboard landing settings
  
  # Component library prompt
  python stitch_integration.py components --input design-system.json
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command")
    
    # DESIGN.md command
    design_parser = subparsers.add_parser("design-md", help="Generate DESIGN.md")
    design_parser.add_argument("--input", "-i", required=True, help="Design tokens JSON")
    design_parser.add_argument("--project", "-p", required=True, help="Project name")
    design_parser.add_argument("--output", "-o", help="Output file")
    
    # Prompt command
    prompt_parser = subparsers.add_parser("prompt", help="Generate Stitch prompt")
    prompt_parser.add_argument("--input", "-i", required=True, help="Design tokens JSON")
    prompt_parser.add_argument("--screen", "-s", required=True,
                              choices=["dashboard", "landing", "settings", "profile", "checkout", "list", "detail"],
                              help="Screen type")
    prompt_parser.add_argument("--output", "-o", help="Output file")
    
    # Batch command
    batch_parser = subparsers.add_parser("batch", help="Generate batch spec")
    batch_parser.add_argument("--input", "-i", required=True, help="Design tokens JSON")
    batch_parser.add_argument("--screens", "-s", nargs="+", required=True, help="Screen types")
    batch_parser.add_argument("--output", "-o", default="batch-spec.json", help="Output file")
    
    # Components command
    comp_parser = subparsers.add_parser("components", help="Generate component library prompt")
    comp_parser.add_argument("--input", "-i", required=True, help="Design tokens JSON")
    comp_parser.add_argument("--output", "-o", help="Output file")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Load tokens
    with open(args.input, 'r') as f:
        data = json.load(f)
    
    # Extract tokens
    tokens = data.get("tokens", data)  # Handle both formats
    
    integration = StitchIntegration(tokens)
    
    if args.command == "design-md":
        design_md = integration.generate_design_md(args.project)
        
        output_path = args.output or "DESIGN.md"
        with open(output_path, 'w') as f:
            f.write(design_md)
        
        print(f"✓ Generated DESIGN.md: {output_path}")
        print(f"✓ Length: {len(design_md)} characters")
        print("\nNext steps:")
        print("1. Open Google Stitch")
        print("2. Create new project")
        print("3. Upload DESIGN.md as reference")
        print("4. Start generating screens")
    
    elif args.command == "prompt":
        result = integration.generate_stitch_prompt(args.screen)
        
        output_path = args.output or f"stitch-prompt-{args.screen}.txt"
        with open(output_path, 'w') as f:
            f.write(result["prompt"])
        
        print(f"✓ Generated prompt: {output_path}")
        print(f"✓ Word count: {result['word_count']}")
        print(f"✓ Sections: {len(result['sections'])}")
        print("\nTips:")
        for tip in result["tips"]:
            print(f"  • {tip}")
    
    elif args.command == "batch":
        spec = integration.generate_batch_spec(args.screens)
        
        with open(args.output, 'w') as f:
            json.dump(spec, f, indent=2)
        
        print(f"✓ Generated batch spec: {args.output}")
        print(f"✓ Screens: {spec['total_screens']}")
        for s in spec["screens"]:
            print(f"  • {s['name']}: {s['description']}")
    
    elif args.command == "components":
        prompt = integration.generate_component_library_prompt()
        
        output_path = args.output or "component-library-prompt.txt"
        with open(output_path, 'w') as f:
            f.write(prompt)
        
        print(f"✓ Generated component library prompt: {output_path}")
        print("✓ Includes: Buttons, Forms, Data Display, Feedback, Navigation")


if __name__ == "__main__":
    main()
