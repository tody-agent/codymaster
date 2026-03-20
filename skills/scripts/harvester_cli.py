#!/usr/bin/env python3
"""
Harvester v4 CLI — Unified Interface for AI-Powered Visual Extraction

Tổng hợp toàn bộ workflow thu thập và tái hiện design system:
1. Browser automation (harvester_browser.py)
2. Design system indexing (design_system_indexer.py)
3. Component generation (component_generator.py)

Usage:
    # Full workflow: Harvest → Index → Generate
    python harvester_cli.py extract --url https://example.com --generate
    
    # Just harvest
    python harvester_cli.py extract --url https://example.com
    
    # Index existing harvest
    python harvester_cli.py index --input harvest.json --name "MyApp"
    
    # Generate components from design system
    python harvester_cli.py generate --input design-system.json --all
    
    # Multi-page workflow
    python harvester_cli.py extract --url https://example.com --crawl --max-pages 5 --generate

Author: UX Master AI
Version: 4.0.0
"""

import argparse
import asyncio
import json
import sys
import subprocess
from pathlib import Path
from typing import Optional, List
from datetime import datetime

# Import local modules
sys.path.insert(0, str(Path(__file__).parent))

try:
    from harvester_browser import BrowserHarvester, HarvestConfig, DesignSystemBuilder
    BROWSER_AVAILABLE = True
except ImportError:
    BROWSER_AVAILABLE = False

try:
    from design_system_indexer import DesignSystemIndexer, merge_multiple_harvests
    INDEXER_AVAILABLE = True
except ImportError:
    INDEXER_AVAILABLE = False

try:
    from component_generator import ComponentGenerator, COMPONENT_SPECS
    GENERATOR_AVAILABLE = True
except ImportError:
    GENERATOR_AVAILABLE = False


class HarvesterCLI:
    """Unified CLI for Harvester v4 workflow."""
    
    VERSION = "4.0.0"
    
    def __init__(self):
        self.output_dir = Path("./output")
        
    def print_banner(self):
        """Print CLI banner."""
        banner = f"""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Harvester v4 — AI-Powered Visual Extraction              ║
║   Design System Intelligence & Component Generation        ║
║                                                               ║
║   Version: {self.VERSION}                                        ║
║   Based on: Semi Design Architecture (DouyinFE)            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
"""
        print(banner)
    
    def extract(self, args):
        """Run extraction workflow."""
        print("[PHASE 1/3] Extracting Design System...")
        print(f"[CONFIG] URL: {args.url}")
        print(f"[CONFIG] Output: {args.output}")
        
        if not BROWSER_AVAILABLE:
            print("[ERROR] Browser automation not available. Install Playwright:")
            print("  pip install playwright && playwright install chromium")
            return 1
        
        # Setup config
        config = HarvestConfig(
            url=args.url,
            output_dir=Path(args.output),
            wait_time=args.wait,
            crawl_links=args.crawl,
            max_pages=args.max_pages,
            viewport={"width": args.viewport_width, "height": args.viewport_height},
            mobile_viewport={"width": 375, "height": 812} if args.mobile else None,
            take_screenshots=not args.no_screenshot,
            dark_mode=args.dark_mode
        )
        
        # Run harvest
        async def run_harvest():
            async with BrowserHarvester(config) as harvester:
                return await harvester.harvest()
        
        results = asyncio.run(run_harvest())
        
        # Report results
        success_count = sum(1 for r in results if r.success)
        print(f"\n[RESULT] Harvested {success_count}/{len(results)} pages successfully")
        
        for result in results:
            status = "✓" if result.success else "✗"
            print(f"  {status} {result.url} ({result.page_type})")
        
        # Build design system
        print("\n[PHASE 2/3] Building Design System...")
        builder = DesignSystemBuilder(results, config.output_dir)
        design_system_meta = builder.build()
        
        print(f"[OK] Design system built!")
        print(f"  Tokens: {len(design_system_meta['tokens'].get('color', {}))} colors")
        print(f"  Components: {len(design_system_meta['blueprints'])}")
        
        # Generate components if requested
        if args.generate:
            print("\n[PHASE 3/3] Generating Components...")
            self._run_component_generation(
                config.output_dir / "design-system.json",
                config.output_dir / "components",
                args.framework
            )
        
        print(f"\n[COMPLETE] Output: {config.output_dir}")
        return 0
    
    def index(self, args):
        """Run indexing workflow."""
        print("[PHASE 1/1] Indexing Design System...")
        
        if not INDEXER_AVAILABLE:
            print("[ERROR] Design system indexer not available.")
            return 1
        
        # Load harvest data
        input_path = Path(args.input)
        
        if args.multi:
            print(f"[INFO] Merging {len(args.multi)} harvest files...")
            data = merge_multiple_harvests([Path(f) for f in args.multi])
        else:
            with open(input_path, 'r') as f:
                data = json.load(f)
        
        # Index
        indexer = DesignSystemIndexer(data, name=args.name)
        design_system = indexer.index()
        
        # Generate outputs
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # CSS
        css = design_system.generate_css()
        css_path = output_dir / "design-system.css"
        with open(css_path, "w") as f:
            f.write(css)
        print(f"[OK] CSS: {css_path}")
        
        # JSON
        json_str = design_system.generate_json()
        json_path = output_dir / "design-system.json"
        with open(json_path, "w") as f:
            f.write(json_str)
        print(f"[OK] JSON: {json_path}")
        
        # Figma tokens
        if args.figma:
            figma_str = design_system.generate_figma_tokens()
            figma_path = output_dir / "figma-tokens.json"
            with open(figma_path, "w") as f:
                f.write(figma_str)
            print(f"[OK] Figma: {figma_path}")
        
        print(f"\n[COMPLETE] Design system indexed: {args.name}")
        return 0
    
    def generate(self, args):
        """Run component generation workflow."""
        print("[PHASE 1/1] Generating Components...")
        
        return self._run_component_generation(
            Path(args.input),
            Path(args.output),
            args.framework,
            args.component
        )
    
    def _run_component_generation(self, input_path: Path, output_dir: Path, framework: str, component: Optional[str] = None) -> int:
        """Internal method to run component generation."""
        if not GENERATOR_AVAILABLE:
            print("[ERROR] Component generator not available.")
            return 1
        
        # Load design system
        with open(input_path, 'r') as f:
            design_system = json.load(f)
        
        # Create generator
        generator = ComponentGenerator(design_system, framework=framework)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        if component:
            # Generate single component
            print(f"[INFO] Generating {component} component ({framework})...")
            files = generator.generate(component)
            
            comp_dir = output_dir / component
            comp_dir.mkdir(parents=True, exist_ok=True)
            
            for filename, content in files.items():
                filepath = comp_dir / filename
                with open(filepath, "w") as f:
                    f.write(content)
            
            print(f"[OK] Generated: {comp_dir}")
        else:
            # Generate all components
            print(f"[INFO] Generating all components ({framework})...")
            results = generator.generate_all()
            
            for comp_name, files in results.items():
                comp_dir = output_dir / comp_name
                comp_dir.mkdir(exist_ok=True)
                
                for filename, content in files.items():
                    filepath = comp_dir / filename
                    with open(filepath, "w") as f:
                        f.write(content)
                
                print(f"[OK] {comp_name}/")
            
            print(f"\n[COMPLETE] Generated {len(results)} components in {output_dir}")
        
        return 0
    
    def quick(self, args):
        """Quick workflow: Extract + Index + Generate in one command."""
        self.print_banner()
        
        print("[QUICK MODE] Full workflow: Extract → Index → Generate")
        print(f"[TARGET] {args.url}")
        print()
        
        # Phase 1: Extract
        extract_args = argparse.Namespace(
            url=args.url,
            output=args.output,
            wait=3.0,
            crawl=False,
            max_pages=1,
            viewport_width=1440,
            viewport_height=900,
            mobile=False,
            no_screenshot=False,
            dark_mode=False,
            generate=False,  # We'll handle generation separately
            framework=args.framework
        )
        
        result = self.extract(extract_args)
        if result != 0:
            return result
        
        # Phase 2: Index (automatic from extract)
        # Phase 3: Generate
        output_dir = Path(args.output)
        
        print("\n" + "="*60)
        print("[AUTO-GENERATE] Creating components...")
        
        gen_result = self._run_component_generation(
            output_dir / "design-system.json",
            output_dir / "components",
            args.framework
        )
        
        # Print summary
        print("\n" + "="*60)
        print("[FINAL SUMMARY]")
        print(f"  Source: {args.url}")
        print(f"  Output: {output_dir}")
        print(f"  Framework: {args.framework}")
        print()
        print("Generated files:")
        for file in sorted(output_dir.rglob("*")):
            if file.is_file():
                rel_path = file.relative_to(output_dir)
                print(f"  • {rel_path}")
        
        return 0


def create_parser():
    """Create argument parser."""
    parser = argparse.ArgumentParser(
        prog="harvester",
        description="Harvester v4 — AI-Powered Visual Extraction",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Workflows:
  1. extract  - Harvest design system from URL
  2. index    - Index existing harvest files
  3. generate - Generate components from design system
  4. quick    - Full workflow in one command

Examples:
  # Quick workflow
  harvester quick https://example.com
  
  # Extract only
  harvester extract --url https://example.com --output ./my-design
  
  # Multi-page crawl
  harvester extract --url https://example.com --crawl --max-pages 5
  
  # Generate components
  harvester generate --input design-system.json --all --framework semi

For more help: harvester <command> --help
"""
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Extract command
    extract_parser = subparsers.add_parser(
        "extract",
        help="Extract design system from URL",
        description="Harvest visual design tokens from any website"
    )
    extract_parser.add_argument("--url", "-u", required=True, help="Target URL")
    extract_parser.add_argument("--output", "-o", default="./output", help="Output directory")
    extract_parser.add_argument("--wait", "-w", type=float, default=3.0, help="Wait time after load")
    extract_parser.add_argument("--crawl", "-c", action="store_true", help="Crawl linked pages")
    extract_parser.add_argument("--max-pages", "-m", type=int, default=1, help="Max pages to harvest")
    extract_parser.add_argument("--viewport-width", type=int, default=1440, help="Viewport width")
    extract_parser.add_argument("--viewport-height", type=int, default=900, help="Viewport height")
    extract_parser.add_argument("--mobile", action="store_true", help="Capture mobile viewport")
    extract_parser.add_argument("--no-screenshot", action="store_true", help="Disable screenshots")
    extract_parser.add_argument("--dark-mode", action="store_true", help="Enable dark mode")
    extract_parser.add_argument("--generate", "-g", action="store_true", help="Auto-generate components")
    extract_parser.add_argument("--framework", "-f", default="react-tailwind",
                               choices=["react-tailwind", "semi", "vue"],
                               help="Target framework")
    
    # Index command
    index_parser = subparsers.add_parser(
        "index",
        help="Index harvest files into design system",
        description="Process harvest data into structured design system"
    )
    index_parser.add_argument("--input", "-i", help="Input harvest JSON")
    index_parser.add_argument("--multi", "-m", nargs="+", help="Multiple harvest files")
    index_parser.add_argument("--name", "-n", default="Untitled", help="Design system name")
    index_parser.add_argument("--output", "-o", default="./output", help="Output directory")
    index_parser.add_argument("--figma", action="store_true", help="Generate Figma tokens")
    
    # Generate command
    generate_parser = subparsers.add_parser(
        "generate",
        help="Generate components from design system",
        description="Create React/Vue components from design tokens"
    )
    generate_parser.add_argument("--input", "-i", required=True, help="Design system JSON")
    generate_parser.add_argument("--output", "-o", default="./components", help="Output directory")
    generate_parser.add_argument("--component", "-c", help="Generate specific component")
    generate_parser.add_argument("--all", "-a", action="store_true", help="Generate all components")
    generate_parser.add_argument("--framework", "-f", default="react-tailwind",
                                choices=["react-tailwind", "semi", "vue"],
                                help="Target framework")
    
    # Quick command
    quick_parser = subparsers.add_parser(
        "quick",
        help="Quick workflow: Extract + Index + Generate",
        description="Full workflow in one command"
    )
    quick_parser.add_argument("url", help="Target URL")
    quick_parser.add_argument("--output", "-o", default="./output", help="Output directory")
    quick_parser.add_argument("--framework", "-f", default="react-tailwind",
                             choices=["react-tailwind", "semi", "vue"],
                             help="Target framework")
    
    return parser


def main():
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    cli = HarvesterCLI()
    
    if args.command == "quick":
        sys.exit(cli.quick(args))
    elif args.command == "extract":
        sys.exit(cli.extract(args))
    elif args.command == "index":
        sys.exit(cli.index(args))
    elif args.command == "generate":
        sys.exit(cli.generate(args))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
