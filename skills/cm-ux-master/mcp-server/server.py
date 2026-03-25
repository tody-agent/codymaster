#!/usr/bin/env python3
"""
UX Master MCP Server — Model Context Protocol for Harvester v4

MCP Server cho phép AI assistants (Claude, Cursor, v.v.) tương tác trực tiếp
với Harvester v4 để thu thập và tái hiện design system.

Tools:
- harvest_url: Thu thập design system từ URL
- generate_components: Tạo components từ design tokens
- export_to_figma: Export tokens sang Figma
- create_stitch_prompt: Tạo prompt cho Google Stitch
- compare_designs: So sánh 2 design systems

Usage with Claude/Cursor:
    User: "Extract design system from https://example.com"
    AI: Dùng tool harvest_url → Trả về tokens
    
    User: "Generate React components from this design"
    AI: Dùng tool generate_components → Trả về code

Author: UX Master AI
Version: 4.0.0
"""

import json
import sys
import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))


class MCPLogger:
    """Log to stderr (stdout reserved for MCP protocol)."""
    @staticmethod
    def info(msg: str):
        print(f"[INFO] {msg}", file=sys.stderr)
    
    @staticmethod
    def error(msg: str):
        print(f"[ERROR] {msg}", file=sys.stderr)


class HarvesterMCPServer:
    """MCP Server for UX Master Harvester v4."""
    
    def __init__(self):
        self.logger = MCPLogger()
        
    def send_response(self, result: Any, error: Optional[str] = None):
        """Send JSON-RPC response."""
        response = {
            "jsonrpc": "2.0",
            "result": result if error is None else None,
            "error": {"code": -32000, "message": error} if error else None
        }
        print(json.dumps(response), flush=True)
    
    def handle_initialize(self, params: Dict) -> Dict:
        """Handle initialize request."""
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            },
            "serverInfo": {
                "name": "ux-master-harvester",
                "version": "4.0.0"
            }
        }
    
    def handle_tools_list(self) -> Dict:
        """List available tools."""
        return {
            "tools": [
                {
                    "name": "harvest_url",
                    "description": "Extract complete design system from any website URL. Returns colors, typography, spacing, components, and tokens.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "url": {
                                "type": "string",
                                "description": "Website URL to extract design system from"
                            },
                            "include_mobile": {
                                "type": "boolean",
                                "description": "Also extract mobile viewport design",
                                "default": True
                            },
                            "wait_time": {
                                "type": "number",
                                "description": "Seconds to wait for page load",
                                "default": 3
                            }
                        },
                        "required": ["url"]
                    }
                },
                {
                    "name": "generate_components",
                    "description": "Generate production-ready React/Vue components from design tokens. Supports React+Tailwind, Semi Design, and Vue 3.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "design_tokens": {
                                "type": "object",
                                "description": "Design tokens from harvest_url result"
                            },
                            "framework": {
                                "type": "string",
                                "enum": ["react-tailwind", "semi", "vue"],
                                "description": "Target framework",
                                "default": "react-tailwind"
                            },
                            "components": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Specific components to generate (button, card, input, etc.)"
                            }
                        },
                        "required": ["design_tokens"]
                    }
                },
                {
                    "name": "export_to_figma",
                    "description": "Export design tokens to Figma Tokens Studio format. Import directly into Figma for design handoff.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "design_tokens": {
                                "type": "object",
                                "description": "Design tokens to export"
                            },
                            "token_set_name": {
                                "type": "string",
                                "description": "Name of the token set in Figma",
                                "default": "Design System"
                            }
                        },
                        "required": ["design_tokens"]
                    }
                },
                {
                    "name": "create_stitch_prompt",
                    "description": "Create optimized prompt for Google Stitch AI to generate matching designs. Use for quick UI generation based on extracted design system.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "design_tokens": {
                                "type": "object",
                                "description": "Design tokens from harvest"
                            },
                            "screen_type": {
                                "type": "string",
                                "enum": ["dashboard", "landing", "settings", "profile", "checkout"],
                                "description": "Type of screen to generate"
                            }
                        },
                        "required": ["design_tokens", "screen_type"]
                    }
                },
                {
                    "name": "create_design_md",
                    "description": "Generate DESIGN.md file for Google Stitch based on extracted design system. Creates semantic design documentation.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "design_tokens": {
                                "type": "object",
                                "description": "Design tokens"
                            },
                            "project_name": {
                                "type": "string",
                                "description": "Name of the project"
                            }
                        },
                        "required": ["design_tokens", "project_name"]
                    }
                }
            ]
        }
    
    async def handle_harvest_url(self, params: Dict) -> Dict:
        """Harvest design system from URL."""
        url = params.get("url")
        include_mobile = params.get("include_mobile", True)
        wait_time = params.get("wait_time", 3)
        
        self.logger.info(f"Harvesting: {url}")
        
        try:
            from harvester_browser import BrowserHarvester, HarvestConfig
            
            config = HarvestConfig(
                url=url,
                output_dir=Path("./output"),
                wait_time=wait_time,
                take_screenshots=True,
                mobile_viewport={"width": 375, "height": 812} if include_mobile else None
            )
            
            async with BrowserHarvester(config) as harvester:
                results = await harvester.harvest()
                
                if not results or not results[0].success:
                    return {"error": "Failed to harvest", "details": results[0].error if results else "No results"}
                
                result = results[0]
                
                # Build design system
                from harvester_browser import DesignSystemBuilder
                builder = DesignSystemBuilder(results, config.output_dir)
                ds_meta = builder.build()
                
                return {
                    "success": True,
                    "url": url,
                    "page_type": result.page_type,
                    "tokens": ds_meta["tokens"],
                    "components_detected": list(ds_meta["blueprints"].keys()),
                    "screenshot": result.screenshot_path,
                    "mobile_screenshot": result.mobile_screenshot_path if include_mobile else None,
                    "summary": {
                        "colors": len(ds_meta["tokens"].get("color", {})),
                        "typography": len(ds_meta["tokens"].get("typography", {})),
                        "components": len(ds_meta["blueprints"])
                    }
                }
                
        except Exception as e:
            self.logger.error(str(e))
            return {"error": str(e)}
    
    def handle_generate_components(self, params: Dict) -> Dict:
        """Generate components from tokens."""
        tokens = params.get("design_tokens", {})
        framework = params.get("framework", "react-tailwind")
        components = params.get("components", [])
        
        self.logger.info(f"Generating {framework} components")
        
        try:
            from component_generator import ComponentGenerator
            
            # Create mock design system structure
            design_system = {
                "name": "Extracted",
                "colors": tokens.get("color", {}),
                "typography": tokens.get("typography", {}),
                "components": tokens.get("components", {}),
                "meta": {"url": "extracted"}
            }
            
            generator = ComponentGenerator(design_system, framework=framework)
            
            generated = {}
            if components:
                for comp in components:
                    try:
                        files = generator.generate(comp)
                        generated[comp] = files
                    except:
                        pass
            else:
                generated = generator.generate_all()
            
            return {
                "success": True,
                "framework": framework,
                "components_generated": len(generated),
                "files": {
                    name: {k: v[:500] + "..." if len(v) > 500 else v 
                           for k, v in files.items()}
                    for name, files in generated.items()
                }
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def handle_export_to_figma(self, params: Dict) -> Dict:
        """Export tokens to Figma format."""
        tokens = params.get("design_tokens", {})
        token_set_name = params.get("token_set_name", "Design System")
        
        self.logger.info(f"Exporting to Figma: {token_set_name}")
        
        figma_tokens = {
            "_version": "1.0",
            token_set_name: {}
        }
        
        # Convert tokens to Figma format
        for category, values in tokens.items():
            if isinstance(values, dict):
                for name, value in values.items():
                    key = f"{category}/{name}"
                    
                    if "color" in category or "bg-" in str(value) or "text-" in str(value):
                        token_type = "color"
                    elif "font-size" in name:
                        token_type = "fontSizes"
                    elif "font-family" in name:
                        token_type = "fontFamilies"
                    elif "spacing" in name:
                        token_type = "spacing"
                    elif "radius" in name:
                        token_type = "borderRadius"
                    else:
                        token_type = "other"
                    
                    figma_tokens[token_set_name][key] = {
                        "value": value,
                        "type": token_type
                    }
        
        return {
            "success": True,
            "format": "figma-tokens",
            "token_set": token_set_name,
            "token_count": len(figma_tokens[token_set_name]),
            "tokens": figma_tokens,
            "instructions": "Copy the tokens object into Figma Tokens Studio plugin"
        }
    
    def handle_create_stitch_prompt(self, params: Dict) -> Dict:
        """Create optimized prompt for Google Stitch."""
        tokens = params.get("design_tokens", {})
        screen_type = params.get("screen_type", "dashboard")
        
        colors = tokens.get("color", {})
        typography = tokens.get("typography", {})
        
        # Build Stitch-optimized prompt
        prompt_parts = [
            f"Create a {screen_type} screen with the following design system:",
            "",
            "## Color Palette",
        ]
        
        # Add primary colors
        if "primary" in colors:
            primary = colors["primary"]
            if isinstance(primary, dict):
                primary = primary.get("base", "#0064FA")
            prompt_parts.append(f"- Primary: {primary} (Use for main CTAs and highlights)")
        
        # Add semantic colors
        for name in ["success", "warning", "danger", "info"]:
            if name in colors:
                val = colors[name]
                if isinstance(val, dict):
                    val = val.get("base", "")
                if val:
                    prompt_parts.append(f"- {name.capitalize()}: {val}")
        
        # Add neutrals
        prompt_parts.extend([
            "",
            "## Typography",
            f"- Font Family: {typography.get('font-family-regular', 'Inter, sans-serif')}",
            f"- Base Size: {typography.get('font-size-regular', '14px')}",
            "",
            "## Visual Style",
            "- Modern, clean interface",
            "- Consistent spacing with 8px grid system",
            "- Accessible color contrast (WCAG AA)",
            "- Professional, business-ready aesthetic",
            "",
            f"## Screen Requirements",
            f"Design a {screen_type} screen that includes:",
        ])
        
        # Add screen-specific requirements
        screen_requirements = {
            "dashboard": [
                "- Header with navigation and user profile",
                "- Key metrics cards in grid layout",
                "- Data visualization section",
                "- Recent activity list",
                "- Quick action buttons"
            ],
            "landing": [
                "- Hero section with headline and CTA",
                "- Feature highlights in 3-column grid",
                "- Social proof section",
                "- Pricing section",
                "- Footer with navigation"
            ],
            "settings": [
                "- Sidebar navigation for settings categories",
                "- Form inputs for user preferences",
                "- Toggle switches for features",
                "- Save and cancel buttons",
                "- Section dividers"
            ],
            "profile": [
                "- Profile header with avatar and name",
                "- User stats cards",
                "- Activity timeline",
                "- Edit profile button",
                "- Tab navigation for sections"
            ]
        }
        
        prompt_parts.extend(screen_requirements.get(screen_type, ["- Main content area"]))
        
        prompt_parts.extend([
            "",
            "Design Guidelines:",
            "- Use the primary color for main actions",
            "- Maintain consistent spacing (16px, 24px, 32px)",
            "- Include hover states for interactive elements",
            "- Ensure mobile responsiveness",
            "- Add subtle shadows for depth (elevated cards)"
        ])
        
        return {
            "success": True,
            "screen_type": screen_type,
            "prompt": "\n".join(prompt_parts),
            "word_count": len(" ".join(prompt_parts).split()),
            "tips": [
                "Paste this prompt directly into Google Stitch",
                "Adjust based on specific requirements",
                "Add custom sections as needed"
            ]
        }
    
    def handle_create_design_md(self, params: Dict) -> Dict:
        """Generate DESIGN.md for Stitch."""
        tokens = params.get("design_tokens", {})
        project_name = params.get("project_name", "Untitled Project")
        
        colors = tokens.get("color", {})
        typography = tokens.get("typography", {})
        
        design_md = f"""# Design System: {project_name}

## 1. Visual Theme & Atmosphere
A professional, modern interface with clean aesthetics and thoughtful use of whitespace. 
The design prioritizes clarity and usability while maintaining visual appeal.

## 2. Color Palette & Roles
"""
        
        # Add colors
        if "primary" in colors:
            primary = colors["primary"]
            if isinstance(primary, dict):
                primary = primary.get("base", "")
            design_md += f"\n**Primary Action** ({primary})\n"
            design_md += f"- Hex: {primary}\n"
            design_md += "- Usage: Main CTAs, primary buttons, links, active states\n"
            design_md += "- Psychology: Professional, trustworthy, actionable\n"
        
        # Neutrals
        design_md += "\n**Neutral Scale**\n"
        for i in range(0, 1000, 100):
            key = f"neutral-{i}" if i > 0 else "neutral-50"
            if key in colors:
                design_md += f"- {key}: {colors[key]}\n"
        
        # Typography
        design_md += """
## 3. Typography Rules
"""
        font_family = typography.get("font-family-regular", "Inter, sans-serif")
        design_md += f"""
**Font Family**: {font_family}
- Clean, modern sans-serif for optimal readability
- Use system font stack for performance

**Type Scale**:
- Base: {typography.get('font-size-regular', '14px')}
- Headings: Bold weight (600-700)
- Body: Regular weight (400)
- Line Height: 1.5 for readability
"""
        
        design_md += """
## 4. Component Stylings

**Buttons:**
- Primary: Solid fill with primary color, white text
- Secondary: Outlined with border, transparent background
- Border Radius: 6px (medium)
- Padding: 12px 24px (base spacing)
- Hover: Slight darken of background

**Cards:**
- Background: White or bg-1
- Border Radius: 12px (large)
- Shadow: Elevated (0 4px 14px rgba(0,0,0,0.1))
- Padding: 24px

**Inputs:**
- Border: 1px solid neutral-200
- Border Radius: 6px
- Focus: Primary color border
- Padding: 12px 16px

## 5. Layout Principles
- 8px grid system for consistent spacing
- Max content width: 1200px
- Generous whitespace (breathing room)
- Clear visual hierarchy
- Mobile-first responsive design
"""
        
        return {
            "success": True,
            "project_name": project_name,
            "design_md": design_md,
            "usage": "Save as DESIGN.md and use with Google Stitch MCP",
            "next_steps": [
                "Upload DESIGN.md to Stitch project",
                "Reference when generating new screens",
                "Maintain consistency across designs"
            ]
        }
    
    async def handle_tool_call(self, tool_name: str, params: Dict) -> Dict:
        """Route tool calls to handlers."""
        handlers = {
            "harvest_url": self.handle_harvest_url,
            "generate_components": lambda p: self.handle_generate_components(p),
            "export_to_figma": lambda p: self.handle_export_to_figma(p),
            "create_stitch_prompt": lambda p: self.handle_create_stitch_prompt(p),
            "create_design_md": lambda p: self.handle_create_design_md(p),
        }
        
        handler = handlers.get(tool_name)
        if handler:
            if asyncio.iscoroutinefunction(handler):
                return await handler(params)
            return handler(params)
        
        return {"error": f"Unknown tool: {tool_name}"}
    
    async def run(self):
        """Main server loop."""
        self.logger.info("UX Master MCP Server starting...")
        
        while True:
            try:
                line = input()
                if not line:
                    continue
                
                request = json.loads(line)
                method = request.get("method")
                params = request.get("params", {})
                req_id = request.get("id")
                
                if method == "initialize":
                    result = self.handle_initialize(params)
                    self.send_response(result)
                    
                elif method == "tools/list":
                    result = self.handle_tools_list()
                    self.send_response(result)
                    
                elif method == "tools/call":
                    tool_name = params.get("name")
                    tool_params = params.get("arguments", {})
                    result = await self.handle_tool_call(tool_name, tool_params)
                    self.send_response(result)
                    
                elif method == "shutdown":
                    self.send_response(None)
                    break
                    
            except EOFError:
                break
            except json.JSONDecodeError as e:
                self.logger.error(f"JSON decode error: {e}")
            except Exception as e:
                self.logger.error(f"Error: {e}")
                self.send_response(None, str(e))


async def main():
    """Entry point."""
    server = HarvesterMCPServer()
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())
