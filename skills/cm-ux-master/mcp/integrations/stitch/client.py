#!/usr/bin/env python3
"""
Google Stitch Integration for UX-Master

Stitch is Google's AI-powered UI design tool. This integration allows
exporting UX-Master design systems to Stitch-compatible format for
enhanced AI-driven design generation.

Features:
- Export design tokens to Stitch format
- Generate Stitch-optimized prompts with UX Laws
- Sync design systems between UX-Master and Stitch
"""

import json
from typing import Optional
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class StitchColorToken:
    """Stitch color token format."""
    name: str
    value: str
    type: str = "color"
    description: Optional[str] = None


@dataclass
class StitchTypographyToken:
    """Stitch typography token format."""
    name: str
    font_family: str
    font_size: str
    font_weight: str
    line_height: str
    type: str = "typography"


@dataclass
class StitchSpacingToken:
    """Stitch spacing token format."""
    name: str
    value: str
    type: str = "dimension"


@dataclass
class StitchDesignSystem:
    """Complete Stitch design system."""
    version: str = "1.0"
    name: str = "UX-Master Design System"
    colors: list = None
    typography: list = None
    spacing: list = None
    effects: list = None
    components: list = None
    
    def __post_init__(self):
        if self.colors is None:
            self.colors = []
        if self.typography is None:
            self.typography = []
        if self.spacing is None:
            self.spacing = []
        if self.effects is None:
            self.effects = []
        if self.components is None:
            self.components = []


class StitchExporter:
    """Export UX-Master design systems to Stitch format."""
    
    def __init__(self):
        self.design_system = StitchDesignSystem()
    
    def export_from_uxm(self, uxm_design_system: dict) -> dict:
        """Convert UX-Master design system to Stitch format.
        
        Args:
            uxm_design_system: Design system from UX-Master
            
        Returns:
            Stitch-compatible design system dict
        """
        # Set name if provided
        if "project_name" in uxm_design_system:
            self.design_system.name = uxm_design_system["project_name"]
        
        # Convert colors
        if "colors" in uxm_design_system:
            self._convert_colors(uxm_design_system["colors"])
        
        # Convert typography
        if "typography" in uxm_design_system:
            self._convert_typography(uxm_design_system["typography"])
        
        # Convert style/effects
        if "style" in uxm_design_system:
            self._convert_style(uxm_design_system["style"])
        
        # Generate Stitch-optimized prompts
        prompts = self._generate_prompts(uxm_design_system)
        
        return {
            "design_system": asdict(self.design_system),
            "stitch_prompts": prompts,
            "metadata": {
                "source": "ux-master",
                "version": "2.0.0",
                "generated_at": "2026-02-25"
            }
        }
    
    def _convert_colors(self, colors: dict):
        """Convert UX-Master colors to Stitch tokens."""
        color_mapping = {
            "primary": ("Primary", "Main brand color"),
            "secondary": ("Secondary", "Secondary brand color"),
            "cta": ("CTA", "Call-to-action color"),
            "background": ("Background", "Page background color"),
            "text": ("Text", "Primary text color"),
            "success": ("Success", "Success state color"),
            "warning": ("Warning", "Warning state color"),
            "error": ("Error", "Error state color"),
        }
        
        for key, value in colors.items():
            if isinstance(value, str):
                name, desc = color_mapping.get(key, (key.title(), f"{key} color"))
                token = StitchColorToken(
                    name=name,
                    value=value,
                    description=desc
                )
                self.design_system.colors.append(asdict(token))
    
    def _convert_typography(self, typography: dict):
        """Convert UX-Master typography to Stitch tokens."""
        heading_font = typography.get("heading", "Inter")
        body_font = typography.get("body", "Inter")
        
        # Create typography scale
        sizes = [
            ("heading-xl", "48px", "700", "1.2"),
            ("heading-lg", "36px", "700", "1.2"),
            ("heading-md", "24px", "600", "1.3"),
            ("heading-sm", "20px", "600", "1.3"),
            ("body-lg", "18px", "400", "1.6"),
            ("body-md", "16px", "400", "1.6"),
            ("body-sm", "14px", "400", "1.5"),
            ("caption", "12px", "400", "1.4"),
        ]
        
        for name, size, weight, line_height in sizes:
            token = StitchTypographyToken(
                name=name,
                font_family=heading_font if "heading" in name else body_font,
                font_size=size,
                font_weight=weight,
                line_height=line_height
            )
            self.design_system.typography.append(asdict(token))
    
    def _convert_style(self, style: dict):
        """Convert style information to Stitch effects."""
        effects = []
        
        if "effects" in style:
            effects_str = style["effects"]
            # Parse effects string for keywords
            if "shadow" in effects_str.lower():
                effects.append({
                    "name": "card-shadow",
                    "type": "box-shadow",
                    "value": "0 4px 6px rgba(0,0,0,0.1)"
                })
            if "glass" in effects_str.lower() or "blur" in effects_str.lower():
                effects.append({
                    "name": "glass-effect",
                    "type": "backdrop-filter",
                    "value": "blur(10px)"
                })
        
        self.design_system.effects = effects
    
    def _generate_prompts(self, uxm_ds: dict) -> dict:
        """Generate Stitch-optimized prompts with UX Laws."""
        prompts = {
            "system_prompt": self._generate_system_prompt(uxm_ds),
            "component_prompts": self._generate_component_prompts(uxm_ds),
            "ux_constraints": self._extract_ux_constraints(uxm_ds)
        }
        return prompts
    
    def _generate_system_prompt(self, uxm_ds: dict) -> str:
        """Generate system prompt with design system context."""
        style_name = uxm_ds.get("style", {}).get("name", "Modern")
        colors = uxm_ds.get("colors", {})
        typography = uxm_ds.get("typography", {})
        
        prompt = f"""You are an expert UI designer creating a {style_name} interface.

DESIGN SYSTEM:
- Style: {style_name}
- Primary Color: {colors.get('primary', '#2563EB')}
- CTA Color: {colors.get('cta', '#F97316')}
- Background: {colors.get('background', '#F8FAFC')}
- Heading Font: {typography.get('heading', 'Inter')}
- Body Font: {typography.get('body', 'Inter')}

APPLY THESE UX PRINCIPLES:
- Fitts's Law: All interactive elements must be at least 44x44px
- Hick's Law: Limit choices to reduce cognitive load
- Visual Hierarchy: Clear distinction between headings and body text
- Consistency: Use the design system tokens throughout

Generate clean, modern UI with proper spacing and accessibility."""
        
        return prompt.strip()
    
    def _generate_component_prompts(self, uxm_ds: dict) -> dict:
        """Generate component-specific prompts."""
        colors = uxm_ds.get("colors", {})
        primary = colors.get('primary', '#2563EB')
        cta = colors.get('cta', '#F97316')
        
        return {
            "button": f"""Create buttons with:
- Primary: Background {primary}, white text, rounded corners
- CTA: Background {cta}, white text, prominent placement
- Min height: 44px for touch targets
- Hover: Subtle opacity change (0.9)
- Focus: Visible ring for accessibility""",
            
            "card": f"""Create cards with:
- Background: White or light shade
- Border radius: 8-12px
- Shadow: Subtle elevation (0 2px 4px rgba(0,0,0,0.1))
- Padding: 16-24px
- Hover: Slight elevation increase""",
            
            "input": f"""Create form inputs with:
- Border: 1px solid neutral gray
- Border radius: 6-8px
- Padding: 12px 16px
- Focus: Border color {primary} with ring
- Error: Red border with helpful message""",
            
            "navigation": """Create navigation with:
- Clear hierarchy: Logo > Primary Nav > CTAs
- Mobile: Hamburger menu with proper touch targets
- Active state: Clear visual indicator
- Accessibility: Keyboard navigable"""
        }
    
    def _extract_ux_constraints(self, uxm_ds: dict) -> list:
        """Extract UX constraints as structured data."""
        constraints = []
        
        # From UX Laws if available
        ux_laws = uxm_ds.get("ux_laws", [])
        for law in ux_laws[:5]:  # Top 5 laws
            constraints.append({
                "law": law.get("Law_Name"),
                "application": law.get("Application"),
                "severity": law.get("Severity")
            })
        
        return constraints
    
    def save_to_file(self, output_path: Path, data: dict):
        """Save Stitch export to JSON file."""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


class StitchClient:
    """Client for Google Stitch API interactions."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Stitch client.
        
        Args:
            api_key: Google API key for Stitch
        """
        self.api_key = api_key
        self.exporter = StitchExporter()
    
    def prepare_for_stitch(self, design_system: dict) -> dict:
        """Prepare UX-Master design system for Stitch.
        
        Args:
            design_system: UX-Master design system
            
        Returns:
            Stitch-compatible format
        """
        return self.exporter.export_from_uxm(design_system)
    
    def generate_stitch_prompt(self, component_type: str, design_system: dict) -> str:
        """Generate a Stitch-optimized prompt for a component.
        
        Args:
            component_type: Type of component (button, card, etc.)
            design_system: UX-Master design system
            
        Returns:
            Stitch prompt string
        """
        stitch_data = self.exporter.export_from_uxm(design_system)
        prompts = stitch_data.get("stitch_prompts", {})
        
        # Get component-specific prompt
        component_prompts = prompts.get("component_prompts", {})
        if component_type in component_prompts:
            return component_prompts[component_type]
        
        # Fallback to system prompt
        return prompts.get("system_prompt", "Create a modern, accessible UI component.")
    
    def create_design_prompt_enhancer(self, design_system: dict) -> callable:
        """Create a function that enhances prompts with UX constraints.
        
        Returns:
            Function that takes a prompt and returns enhanced prompt
        """
        stitch_data = self.exporter.export_from_uxm(design_system)
        ux_constraints = stitch_data.get("stitch_prompts", {}).get("ux_constraints", [])
        
        def enhance_prompt(base_prompt: str) -> str:
            """Enhance a prompt with UX constraints."""
            enhancements = []
            
            for constraint in ux_constraints:
                if constraint.get("severity") == "Critical":
                    enhancements.append(f"- CRITICAL: {constraint.get('law')} - {constraint.get('application')}")
            
            if enhancements:
                enhanced = base_prompt + "\n\nUX REQUIREMENTS:\n" + "\n".join(enhancements)
                return enhanced
            
            return base_prompt
        
        return enhance_prompt


# Utility functions
def convert_to_stitch_format(uxm_tokens: dict) -> str:
    """Convert UX-Master tokens to Stitch format and return as JSON string.
    
    Args:
        uxm_tokens: UX-Master design tokens
        
    Returns:
        JSON string in Stitch format
    """
    exporter = StitchExporter()
    stitch_data = exporter.export_from_uxm({
        "colors": uxm_tokens.get("colors", {}),
        "typography": uxm_tokens.get("typography", {}),
        "style": uxm_tokens.get("style", {}),
        "project_name": uxm_tokens.get("project_name", "UX-Master Design System")
    })
    
    return json.dumps(stitch_data, indent=2)


def create_stitch_prompt_with_ux_laws(
    component_description: str,
    ux_laws: list,
    style_keywords: list
) -> str:
    """Create a Stitch prompt enriched with UX Laws.
    
    Args:
        component_description: What to design
        ux_laws: List of applicable UX Laws
        style_keywords: Style descriptors
        
    Returns:
        Enhanced prompt for Stitch
    """
    prompt_parts = [
        f"Design a {component_description}.",
        "",
        "STYLE:",
        f"- {' '.join(style_keywords)}",
        "",
        "UX PRINCIPLES (MANDATORY):",
    ]
    
    for law in ux_laws:
        law_name = law.get("Law_Name", "")
        application = law.get("Application", "")
        prompt_parts.append(f"- {law_name}: {application}")
    
    prompt_parts.extend([
        "",
        "REQUIREMENTS:",
        "- All touch targets minimum 44x44px",
        "- Clear visual hierarchy",
        "- Proper contrast ratios (WCAG AA)",
        "- Smooth transitions (150-300ms)",
        "- Accessible focus states"
    ])
    
    return "\n".join(prompt_parts)
