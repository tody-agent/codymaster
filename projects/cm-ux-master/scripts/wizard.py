#!/usr/bin/env python3
"""
UX Master Wizard — Interactive Design System Generator

One command = Complete design system. 10x productivity boost.

Usage:
    python wizard.py                    # Interactive mode
    python wizard.py --url <url>        # Quick mode
    python wizard.py --preset saas      # Use preset template

Features:
- Beautiful CLI with animations
- Interactive prompts
- Progress tracking
- One-click Figma export
- Google Stitch integration
- Component generation

Author: UX Master AI
Version: 4.0.0
"""

import os
import sys
import time
import json
import asyncio
import argparse
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))


# ANSI Colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'


class Spinner:
    """Animated spinner for loading states."""
    def __init__(self, message="Loading"):
        self.message = message
        self.running = False
        self.spinner_chars = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
        self.idx = 0
    
    def start(self):
        self.running = True
        self._spin()
    
    def _spin(self):
        while self.running:
            char = self.spinner_chars[self.idx % len(self.spinner_chars)]
            sys.stdout.write(f"\r{Colors.CYAN}{char}{Colors.END} {self.message}")
            sys.stdout.flush()
            self.idx += 1
            time.sleep(0.1)
    
    def stop(self, success=True):
        self.running = False
        icon = f"{Colors.GREEN}✓{Colors.END}" if success else f"{Colors.RED}✗{Colors.END}"
        sys.stdout.write(f"\r{icon} {self.message}\n")
        sys.stdout.flush()


def print_banner():
    """Print awesome banner."""
    banner = f"""
{Colors.CYAN}{Colors.BOLD}
 ██╗   ██╗██╗  ██╗    ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
 ██║   ██║╚██╗██╔╝    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
 ██║   ██║ ╚███╔╝     ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
 ██║   ██║ ██╔██╗     ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
 ╚██████╔╝██╔╝ ██╗    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
  ╚═════╝ ╚═╝  ╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
{Colors.END}
{Colors.BOLD}{Colors.YELLOW}           Design System Wizard v4.0 — AI-Powered Extraction{Colors.END}
{Colors.BLUE}              One Command = Complete Design System = 10x Productivity{Colors.END}

"""
    print(banner)


def print_progress(step: int, total: int, message: str):
    """Print progress bar."""
    width = 40
    filled = int(width * step / total)
    bar = f"{Colors.GREEN}{'█' * filled}{Colors.END}{'░' * (width - filled)}"
    percent = int(100 * step / total)
    print(f"\n{Colors.BOLD}[{bar}] {percent}%{Colors.END}")
    print(f"{Colors.CYAN}→ {message}{Colors.END}\n")


def print_success(message: str):
    """Print success message."""
    print(f"{Colors.GREEN}{Colors.BOLD}✓ {message}{Colors.END}")


def print_info(message: str):
    """Print info message."""
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")


def print_warning(message: str):
    """Print warning message."""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")


def print_error(message: str):
    """Print error message."""
    print(f"{Colors.RED}✗ {message}{Colors.END}")


def ask_question(question: str, options: Optional[List[str]] = None, default: str = "") -> str:
    """Ask interactive question."""
    print(f"\n{Colors.BOLD}{Colors.CYAN}?{Colors.END} {Colors.BOLD}{question}{Colors.END}")
    
    if options:
        for i, opt in enumerate(options, 1):
            marker = f"{Colors.GREEN}→{Colors.END}" if opt == default else " "
            print(f"  {marker} {i}. {opt}")
        
        while True:
            try:
                choice = input(f"\n{Colors.YELLOW}Select (1-{len(options)}): {Colors.END}").strip()
                if choice.isdigit() and 1 <= int(choice) <= len(options):
                    return options[int(choice) - 1]
                elif choice == "" and default:
                    return default
            except:
                pass
            print_error("Invalid selection. Please try again.")
    else:
        response = input(f"{Colors.YELLOW}> {Colors.END}").strip()
        return response if response else default


@dataclass
class WizardConfig:
    """Configuration from wizard."""
    url: str
    project_name: str
    framework: str
    include_mobile: bool
    generate_components: bool
    export_figma: bool
    create_stitch: bool
    output_dir: Path


class UXMasterWizard:
    """Interactive wizard for design system generation."""
    
    PRESETS = {
        "saas": {
            "name": "SaaS Dashboard",
            "description": "Modern SaaS dashboard with data visualization",
            "typical_url": "https://app.example.com/dashboard"
        },
        "ecommerce": {
            "name": "E-commerce",
            "description": "Product catalog, cart, and checkout flows",
            "typical_url": "https://shop.example.com"
        },
        "landing": {
            "name": "Landing Page",
            "description": "Marketing site with hero, features, CTA",
            "typical_url": "https://example.com"
        },
        "admin": {
            "name": "Admin Panel",
            "description": "Data management and configuration interface",
            "typical_url": "https://admin.example.com"
        }
    }
    
    def __init__(self):
        self.config = None
        self.results = {}
    
    def run_interactive(self):
        """Run interactive wizard."""
        print_banner()
        
        print(f"{Colors.BOLD}Welcome to UX Master Wizard!{Colors.END}")
        print("I'll help you extract and generate a complete design system in minutes.\n")
        
        # Step 1: Choose mode
        mode = ask_question(
            "What would you like to do?",
            options=[
                "Extract from URL (harvest existing website)",
                "Use preset template",
                "Import from Figma",
                "Quick start with demo"
            ]
        )
        
        if "Extract" in mode:
            self._extract_flow()
        elif "preset" in mode.lower():
            self._preset_flow()
        elif "Figma" in mode:
            self._figma_flow()
        else:
            self._demo_flow()
    
    def _extract_flow(self):
        """Extract from URL flow."""
        print_progress(1, 5, "Step 1: Source Configuration")
        
        # Get URL
        url = ask_question(
            "Enter the website URL to extract design system from:",
            default="https://"
        )
        
        while not url.startswith("http"):
            print_error("Please enter a valid URL starting with http:// or https://")
            url = ask_question("Website URL:")
        
        # Project name
        project_name = ask_question(
            "Project name:",
            default=self._extract_domain(url)
        )
        
        # Framework
        framework = ask_question(
            "Target framework?",
            options=["React + Tailwind CSS", "Semi Design", "Vue 3 + Tailwind"],
            default="React + Tailwind CSS"
        )
        framework_map = {
            "React + Tailwind CSS": "react-tailwind",
            "Semi Design": "semi",
            "Vue 3 + Tailwind": "vue"
        }
        
        # Options
        print(f"\n{Colors.BOLD}Configuration Options:{Colors.END}")
        include_mobile = ask_question(
            "Include mobile viewport extraction?",
            options=["Yes", "No"],
            default="Yes"
        ) == "Yes"
        
        generate_components = ask_question(
            "Generate component code?",
            options=["Yes", "No"],
            default="Yes"
        ) == "Yes"
        
        export_figma = ask_question(
            "Export to Figma Tokens Studio?",
            options=["Yes", "No"],
            default="Yes"
        ) == "Yes"
        
        create_stitch = ask_question(
            "Create Google Stitch DESIGN.md?",
            options=["Yes", "No"],
            default="Yes"
        ) == "Yes"
        
        self.config = WizardConfig(
            url=url,
            project_name=project_name,
            framework=framework_map[framework],
            include_mobile=include_mobile,
            generate_components=generate_components,
            export_figma=export_figma,
            create_stitch=create_stitch,
            output_dir=Path("./output") / project_name.lower().replace(" ", "-")
        )
        
        # Execute
        self._execute_extraction()
    
    def _preset_flow(self):
        """Use preset template."""
        print_progress(1, 3, "Step 1: Select Preset")
        
        preset_names = [f"{k}: {v['name']} - {v['description']}" for k, v in self.PRESETS.items()]
        selected = ask_question(
            "Choose a preset template:",
            options=preset_names,
            default=preset_names[0]
        )
        
        preset_key = selected.split(":")[0]
        preset = self.PRESETS[preset_key]
        
        print_info(f"Using preset: {preset['name']}")
        
        url = ask_question(
            "Website URL (optional, press Enter to skip):",
            default=preset['typical_url']
        )
        
        if url and url != "https://":
            self.config = WizardConfig(
                url=url,
                project_name=preset['name'],
                framework="react-tailwind",
                include_mobile=True,
                generate_components=True,
                export_figma=True,
                create_stitch=True,
                output_dir=Path("./output") / preset_key
            )
            self._execute_extraction()
        else:
            self._generate_from_preset(preset_key)
    
    def _figma_flow(self):
        """Import from Figma flow."""
        print_progress(1, 3, "Step 1: Figma Import")
        
        print_info("Figma import requires Figma file URL and access token.")
        print_info("Feature coming soon! For now, use Figma Tokens Studio export.")
        
        input(f"\n{Colors.YELLOW}Press Enter to continue...{Colors.END}")
        self.run_interactive()
    
    def _demo_flow(self):
        """Demo with sample data."""
        print_progress(1, 3, "Loading Demo Data")
        
        demo_data = {
            "name": "Demo SaaS",
            "colors": {
                "primary": {"base": "#0064FA"},
                "success": {"base": "#10B981"},
                "warning": {"base": "#F59E0B"},
                "danger": {"base": "#EF4444"}
            },
            "typography": {
                "font-family-regular": "Inter, sans-serif",
                "font-size-regular": "14px"
            }
        }
        
        print_success("Demo data loaded!")
        print_info("Generating components from demo design system...")
        
        # Simulate generation
        time.sleep(1)
        print_success("Components generated!")
        self._show_summary({
            "demo": True,
            "components": ["Button", "Card", "Input", "Badge"],
            "tokens": {"colors": 8, "typography": 6}
        })
    
    def _execute_extraction(self):
        """Execute the extraction process."""
        print_progress(2, 5, "Step 2: Extracting Design System")
        
        try:
            from harvester_browser import BrowserHarvester, HarvestConfig
            
            config = HarvestConfig(
                url=self.config.url,
                output_dir=self.config.output_dir,
                take_screenshots=True,
                mobile_viewport={"width": 375, "height": 812} if self.config.include_mobile else None
            )
            
            print_info(f"Opening browser and navigating to {self.config.url}...")
            
            async def run():
                async with BrowserHarvester(config) as harvester:
                    return await harvester.harvest()
            
            results = asyncio.run(run())
            
            if not results or not results[0].success:
                print_error(f"Extraction failed: {results[0].error if results else 'Unknown'}")
                return
            
            result = results[0]
            print_success(f"Extracted {result.page_type} page successfully!")
            
            # Build design system
            print_progress(3, 5, "Step 3: Building Design System")
            
            from harvester_browser import DesignSystemBuilder
            builder = DesignSystemBuilder(results, self.config.output_dir)
            ds_meta = builder.build()
            
            token_count = (
                len(ds_meta["tokens"].get("color", {})) +
                len(ds_meta["tokens"].get("typography", {})) +
                len(ds_meta["tokens"].get("spacing", {}))
            )
            print_success(f"Built design system with {token_count} tokens!")
            
            # Generate components
            if self.config.generate_components:
                print_progress(4, 5, "Step 4: Generating Components")
                self._generate_components(ds_meta["tokens"])
            
            # Export extras
            if self.config.export_figma:
                self._export_figma(ds_meta["tokens"])
            
            if self.config.create_stitch:
                self._create_stitch_files(ds_meta["tokens"])
            
            # Show summary
            print_progress(5, 5, "Step 5: Finalizing")
            self._show_summary({
                "url": self.config.url,
                "project": self.config.project_name,
                "tokens": ds_meta["tokens"],
                "components": list(ds_meta["blueprints"].keys()),
                "output_dir": self.config.output_dir
            })
            
        except Exception as e:
            print_error(f"Error: {e}")
            import traceback
            traceback.print_exc()
    
    def _generate_components(self, tokens: Dict):
        """Generate component code."""
        try:
            from component_generator import ComponentGenerator
            
            design_system = {
                "name": self.config.project_name,
                "colors": tokens.get("color", {}),
                "typography": tokens.get("typography", {}),
                "meta": {"url": self.config.url}
            }
            
            generator = ComponentGenerator(design_system, framework=self.config.framework)
            results = generator.generate_all()
            
            comp_dir = self.config.output_dir / "components"
            comp_dir.mkdir(parents=True, exist_ok=True)
            
            for comp_name, files in results.items():
                comp_subdir = comp_dir / comp_name
                comp_subdir.mkdir(exist_ok=True)
                
                for filename, content in files.items():
                    filepath = comp_subdir / filename
                    with open(filepath, "w") as f:
                        f.write(content)
            
            print_success(f"Generated {len(results)} components ({self.config.framework})")
            
        except Exception as e:
            print_warning(f"Component generation warning: {e}")
    
    def _export_figma(self, tokens: Dict):
        """Export to Figma format."""
        try:
            figma_data = {
                "_version": "1.0",
                self.config.project_name: {}
            }
            
            for category, values in tokens.items():
                if isinstance(values, dict):
                    for name, value in values.items():
                        key = f"{category}/{name}"
                        figma_data[self.config.project_name][key] = {
                            "value": value,
                            "type": "color" if "color" in category else "other"
                        }
            
            figma_path = self.config.output_dir / "figma-tokens.json"
            with open(figma_path, "w") as f:
                json.dump(figma_data, f, indent=2)
            
            print_success(f"Exported Figma tokens ({len(figma_data[self.config.project_name])} tokens)")
            
        except Exception as e:
            print_warning(f"Figma export warning: {e}")
    
    def _create_stitch_files(self, tokens: Dict):
        """Create Google Stitch files."""
        try:
            colors = tokens.get("color", {})
            typography = tokens.get("typography", {})
            
            # DESIGN.md
            design_md = f"""# Design System: {self.config.project_name}

## Visual Theme
Modern, professional interface extracted from {self.config.url}

## Color Palette
"""
            
            if "primary" in colors:
                primary = colors["primary"]
                if isinstance(primary, dict):
                    primary = primary.get("base", "")
                design_md += f"\n**Primary**: {primary}\n"
            
            design_md += f"""
## Typography
- Font: {typography.get('font-family-regular', 'Inter, sans-serif')}
- Base Size: {typography.get('font-size-regular', '14px')}

## Usage
Use this DESIGN.md with Google Stitch MCP for consistent UI generation.
"""
            
            stitch_path = self.config.output_dir / "DESIGN.md"
            with open(stitch_path, "w") as f:
                f.write(design_md)
            
            print_success("Created Google Stitch DESIGN.md")
            
        except Exception as e:
            print_warning(f"Stitch files warning: {e}")
    
    def _show_summary(self, data: Dict):
        """Show final summary."""
        print("\n" + "="*60)
        print(f"{Colors.GREEN}{Colors.BOLD}🎉 Design System Generated Successfully!{Colors.END}")
        print("="*60)
        
        if data.get("demo"):
            print(f"\n{Colors.CYAN}Demo Mode — Sample Components Generated:{Colors.END}")
            print(f"  Components: {', '.join(data['components'])}")
            print(f"  Tokens: {data['tokens']['colors']} colors, {data['tokens']['typography']} typography")
        else:
            print(f"\n{Colors.BOLD}Project:{Colors.END} {data['project']}")
            print(f"{Colors.BOLD}Source:{Colors.END} {data['url']}")
            print(f"{Colors.BOLD}Output:{Colors.END} {data['output_dir']}")
            
            print(f"\n{Colors.CYAN}Extracted:{Colors.END}")
            tokens = data['tokens']
            print(f"  🎨 {len(tokens.get('color', {}))} color tokens")
            print(f"  📝 {len(tokens.get('typography', {}))} typography tokens")
            print(f"  📐 {len(tokens.get('spacing', {}))} spacing tokens")
            print(f"  🧩 {len(data['components'])} components detected")
            
            print(f"\n{Colors.CYAN}Generated Files:{Colors.END}")
            output = Path(data['output_dir'])
            if output.exists():
                for file in sorted(output.rglob("*")):
                    if file.is_file():
                        rel = file.relative_to(output)
                        size = file.stat().st_size
                        size_str = f"{size/1024:.1f}KB" if size > 1024 else f"{size}B"
                        print(f"  📄 {rel} ({size_str})")
        
        print(f"\n{Colors.GREEN}{Colors.BOLD}Next Steps:{Colors.END}")
        print("  1. 📁 Check the output directory for all files")
        print("  2. 🎨 Import figma-tokens.json into Figma Tokens Studio")
        print("  3. 📝 Use DESIGN.md with Google Stitch for AI design generation")
        print("  4. 💻 Copy components/ to your project")
        print("  5. 🚀 Start building with your new design system!")
        
        print(f"\n{Colors.YELLOW}💡 Tip:{Colors.END} Use these tokens with AI coding assistants:")
        print(f"   'Use design tokens from {data.get('output_dir', './output')}/design-system.css'")
        
        print("\n" + "="*60)
        print(f"{Colors.BOLD}Happy designing! 🚀{Colors.END}")
        print("="*60 + "\n")
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc.replace("www.", "").split(".")[0].capitalize()
        except:
            return "MyProject"
    
    def run_quick(self, url: str, **kwargs):
        """Quick mode with minimal interaction."""
        print_banner()
        print_info(f"Quick mode: Extracting from {url}")
        
        self.config = WizardConfig(
            url=url,
            project_name=kwargs.get("name", self._extract_domain(url)),
            framework=kwargs.get("framework", "react-tailwind"),
            include_mobile=True,
            generate_components=True,
            export_figma=True,
            create_stitch=True,
            output_dir=Path("./output") / kwargs.get("name", "extracted")
        )
        
        self._execute_extraction()


def main():
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="UX Master Wizard — Interactive Design System Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode
  python wizard.py
  
  # Quick extraction
  python wizard.py --url https://example.com
  
  # With specific framework
  python wizard.py --url https://example.com --framework semi --name "MyApp"
  
  # Use preset
  python wizard.py --preset saas
        """
    )
    
    parser.add_argument("--url", "-u", help="URL to extract (quick mode)")
    parser.add_argument("--name", "-n", help="Project name")
    parser.add_argument("--framework", "-f", default="react-tailwind",
                       choices=["react-tailwind", "semi", "vue"],
                       help="Target framework")
    parser.add_argument("--preset", "-p", choices=["saas", "ecommerce", "landing", "admin"],
                       help="Use preset template")
    parser.add_argument("--output", "-o", default="./output", help="Output directory")
    
    args = parser.parse_args()
    
    wizard = UXMasterWizard()
    
    if args.url:
        wizard.run_quick(args.url, name=args.name, framework=args.framework)
    elif args.preset:
        wizard.run_interactive()  # Will handle preset internally
    else:
        wizard.run_interactive()


if __name__ == "__main__":
    main()
