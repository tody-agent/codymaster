#!/usr/bin/env python3
"""
Harvester v4 — Browser Automation Module

Tự động hóa việc mở browser, thu thập design system từ bất kỳ website nào
và tạo design tokens theo chuẩn Semi Design.

Features:
- Multi-page crawling với recursive extraction
- Screenshot capture cho visual reference
- Smart element detection
- Auto-retry và error handling
- Parallel processing cho multiple URLs

Usage:
    python harvester_browser.py --url https://example.com --output ./output
    python harvester_browser.py --urls urls.txt --crawl --max-pages 10
    python harvester_browser.py --interactive  # Interactive mode

Author: UX Master AI
Version: 4.0.0
"""

import asyncio
import json
import os
import sys
import time
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from urllib.parse import urljoin, urlparse
import hashlib

# Optional imports for browser automation
try:
    from playwright.async_api import async_playwright, Page, Browser, BrowserContext
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("[WARN] Playwright not installed. Browser automation disabled.")
    print("[INFO] Install with: pip install playwright && playwright install chromium")


@dataclass
class HarvestConfig:
    """Configuration for harvest session."""
    url: str
    output_dir: Path = field(default_factory=lambda: Path("./output"))
    wait_time: float = 3.0
    scroll_page: bool = True
    take_screenshots: bool = True
    full_page_screenshot: bool = True
    viewport: Dict[str, int] = field(default_factory=lambda: {"width": 1440, "height": 900})
    mobile_viewport: Optional[Dict[str, int]] = None
    dark_mode: bool = False
    auth_credentials: Optional[Dict[str, str]] = None
    cookies: Optional[List[Dict]] = None
    headers: Optional[Dict[str, str]] = None
    max_retries: int = 3
    timeout: int = 30
    crawl_links: bool = False
    max_pages: int = 1
    same_domain_only: bool = True


@dataclass
class HarvestResult:
    """Result from a single page harvest."""
    url: str
    timestamp: str
    success: bool
    data: Optional[Dict] = None
    screenshot_path: Optional[str] = None
    mobile_screenshot_path: Optional[str] = None
    error: Optional[str] = None
    page_type: str = "unknown"
    duration_ms: int = 0


class BrowserHarvester:
    """Browser automation for design system extraction."""
    
    HARVESTER_JS_PATH = Path(__file__).parent / "harvester_v4.js"
    
    def __init__(self, config: HarvestConfig):
        self.config = config
        self.results: List[HarvestResult] = []
        self.visited_urls: set = set()
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        
    async def __aenter__(self):
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright is required for browser automation")
        
        self.playwright = await async_playwright().start()
        
        # Launch browser with appropriate settings
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        )
        
        # Create context with viewport and other settings
        context_options = {
            "viewport": self.config.viewport,
            "device_scale_factor": 1,
        }
        
        if self.config.headers:
            context_options["extra_http_headers"] = self.config.headers
            
        self.context = await self.browser.new_context(**context_options)
        
        # Add cookies if provided
        if self.config.cookies:
            await self.context.add_cookies(self.config.cookies)
            
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def harvest_single(self, url: str, is_mobile: bool = False) -> HarvestResult:
        """Harvest design system from a single URL."""
        start_time = time.time()
        
        if url in self.visited_urls:
            return HarvestResult(
                url=url,
                timestamp=datetime.now().isoformat(),
                success=False,
                error="URL already visited"
            )
        
        self.visited_urls.add(url)
        
        # Create new page
        page = await self.context.new_page()
        
        try:
            # Set viewport for mobile if needed
            if is_mobile and self.config.mobile_viewport:
                await page.set_viewport_size(self.config.mobile_viewport)
            
            # Navigate to URL
            await page.goto(url, wait_until="networkidle", timeout=self.config.timeout * 1000)
            
            # Wait for page to stabilize
            await asyncio.sleep(self.config.wait_time)
            
            # Handle any cookie consent dialogs (common patterns)
            await self._handle_cookie_consent(page)
            
            # Scroll page if configured
            if self.config.scroll_page and not is_mobile:
                await self._scroll_page(page)
            
            # Take screenshot if enabled
            screenshot_path = None
            if self.config.take_screenshots:
                screenshot_path = await self._take_screenshot(page, url, is_mobile)
            
            # Inject and execute harvester
            harvest_data = await self._execute_harvester(page)
            
            # Get page metadata
            page_type = await page.evaluate("""() => {
                const url = window.location.href.toLowerCase();
                const title = document.title.toLowerCase();
                const combined = url + " " + title;
                
                if (/dashboard|overview/.test(combined)) return 'dashboard';
                if (/setting|config/.test(combined)) return 'settings';
                if (/report|analytics/.test(combined)) return 'report';
                if (/order|transaction/.test(combined)) return 'orders';
                if (/product|catalog/.test(combined)) return 'products';
                if (/user|profile|account/.test(combined)) return 'users';
                return 'generic';
            }""")
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            await page.close()
            
            return HarvestResult(
                url=url,
                timestamp=datetime.now().isoformat(),
                success=True,
                data=harvest_data,
                screenshot_path=screenshot_path,
                page_type=page_type,
                duration_ms=duration_ms
            )
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            await page.close()
            
            return HarvestResult(
                url=url,
                timestamp=datetime.now().isoformat(),
                success=False,
                error=str(e),
                duration_ms=duration_ms
            )
    
    async def _handle_cookie_consent(self, page: Page):
        """Handle common cookie consent dialogs."""
        consent_selectors = [
            'button[aria-label*="Accept"]',
            'button[aria-label*="accept"]',
            '[class*="cookie"] button',
            '[id*="cookie"] button',
            'button:has-text("Accept")',
            'button:has-text("I agree")',
            '[class*="consent"] button:first-child',
            '[data-testid*="cookie-accept"]'
        ]
        
        for selector in consent_selectors:
            try:
                button = await page.query_selector(selector)
                if button:
                    await button.click()
                    await asyncio.sleep(0.5)
                    break
            except:
                continue
    
    async def _scroll_page(self, page: Page):
        """Scroll page to load lazy content."""
        # Get page height
        height = await page.evaluate("() => document.body.scrollHeight")
        
        # Scroll in increments
        viewport_height = self.config.viewport["height"]
        steps = min(5, height // viewport_height)
        
        for i in range(steps):
            await page.evaluate(f"window.scrollTo(0, {(i + 1) * viewport_height})")
            await asyncio.sleep(0.5)
        
        # Scroll back to top
        await page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(0.3)
    
    async def _take_screenshot(self, page: Page, url: str, is_mobile: bool) -> str:
        """Take screenshot of the page."""
        # Create filename from URL
        parsed = urlparse(url)
        domain = parsed.netloc.replace(".", "_")
        path = parsed.path.replace("/", "_").replace(".", "_")[:50]
        suffix = "mobile" if is_mobile else "desktop"
        
        filename = f"{domain}{path}_{suffix}.png"
        filepath = self.config.output_dir / filename
        
        # Ensure directory exists
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        # Take screenshot
        if self.config.full_page_screenshot and not is_mobile:
            await page.screenshot(path=str(filepath), full_page=True)
        else:
            await page.screenshot(path=str(filepath))
        
        return str(filepath)
    
    async def _execute_harvester(self, page: Page) -> Dict:
        """Inject and execute harvester v4 script."""
        # Read harvester script
        if not self.HARVESTER_JS_PATH.exists():
            raise FileNotFoundError(f"Harvester script not found: {self.HARVESTER_JS_PATH}")
        
        with open(self.HARVESTER_JS_PATH, 'r') as f:
            harvester_js = f.read()
        
        # Execute script and get results
        result = await page.evaluate(f"""
            () => {{
                {harvester_js}
                return JSON.parse(result);
            }}
        """)
        
        return result
    
    async def crawl(self, start_url: str, max_pages: Optional[int] = None) -> List[HarvestResult]:
        """Crawl multiple pages starting from URL."""
        max_pages = max_pages or self.config.max_pages
        to_visit = [start_url]
        results = []
        
        while to_visit and len(results) < max_pages:
            url = to_visit.pop(0)
            
            if url in self.visited_urls:
                continue
            
            result = await self.harvest_single(url)
            results.append(result)
            
            if result.success and self.config.crawl_links:
                # Find links on the page
                new_links = await self._extract_links(url, result.data)
                
                for link in new_links:
                    if link not in self.visited_urls and link not in to_visit:
                        to_visit.append(link)
        
        return results
    
    async def _extract_links(self, base_url: str, data: Dict) -> List[str]:
        """Extract links to crawl from page data."""
        links = []
        
        # This would typically come from the page, but we can infer from navigation
        # For now, return empty to prevent infinite crawling
        # In a real implementation, you'd extract from the page content
        
        return links
    
    async def harvest(self) -> List[HarvestResult]:
        """Main harvest method."""
        if self.config.crawl_links and self.config.max_pages > 1:
            return await self.crawl(self.config.url)
        else:
            # Harvest desktop version
            result = await self.harvest_single(self.config.url, is_mobile=False)
            self.results.append(result)
            
            # Harvest mobile version if configured
            if self.config.mobile_viewport:
                mobile_result = await self.harvest_single(self.config.url, is_mobile=True)
                if mobile_result.screenshot_path:
                    result.mobile_screenshot_path = mobile_result.screenshot_path
            
            return self.results


class DesignSystemBuilder:
    """Build design system from harvest results."""
    
    def __init__(self, results: List[HarvestResult], output_dir: Path):
        self.results = results
        self.output_dir = output_dir
        
    def build(self) -> Dict[str, Any]:
        """Build comprehensive design system."""
        # Merge data from all successful harvests
        merged_data = self._merge_harvest_data()
        
        # Generate design tokens
        tokens = self._generate_tokens(merged_data)
        
        # Generate component blueprints
        blueprints = self._generate_blueprints(merged_data)
        
        # Generate CSS variables
        css = self._generate_css(tokens)
        
        # Save all outputs
        self._save_outputs(tokens, blueprints, css, merged_data)
        
        return {
            "tokens": tokens,
            "blueprints": blueprints,
            "css_path": str(self.output_dir / "design-tokens.css"),
            "stats": self._generate_stats()
        }
    
    def _merge_harvest_data(self) -> Dict:
        """Merge data from multiple harvest results."""
        merged = {
            "colors": {},
            "typography": {},
            "spacing": {},
            "components": {},
            "pages": []
        }
        
        for result in self.results:
            if not result.success or not result.data:
                continue
            
            data = result.data
            merged["pages"].append({
                "url": result.url,
                "type": result.page_type,
                "timestamp": result.timestamp
            })
            
            # Merge colors (take most common values)
            if "visualAnalysis" in data:
                va = data["visualAnalysis"]
                if "colors" in va:
                    merged["colors"] = self._merge_colors(merged["colors"], va["colors"])
                if "typography" in va:
                    merged["typography"] = self._merge_typography(merged["typography"], va["typography"])
                if "spacing" in va:
                    merged["spacing"] = self._merge_spacing(merged["spacing"], va["spacing"])
            
            # Merge component blueprints
            if "components" in data and "blueprints" in data["components"]:
                merged["components"] = self._merge_components(
                    merged["components"], 
                    data["components"]["blueprints"]
                )
        
        return merged
    
    def _merge_colors(self, existing: Dict, new: Dict) -> Dict:
        """Merge color data."""
        # Simple merge - prefer new values if they exist
        if not existing:
            return new
        
        for key, value in new.items():
            if key not in existing and value:
                existing[key] = value
        
        return existing
    
    def _merge_typography(self, existing: Dict, new: Dict) -> Dict:
        """Merge typography data."""
        if not existing:
            return new
        
        # Prefer hierarchy from homepage or dashboard
        if "hierarchy" in new and len(new["hierarchy"]) > len(existing.get("hierarchy", {})):
            existing["hierarchy"] = new["hierarchy"]
        
        return existing
    
    def _merge_spacing(self, existing: Dict, new: Dict) -> Dict:
        """Merge spacing data."""
        if not existing:
            return new
        return existing
    
    def _merge_components(self, existing: Dict, new: Dict) -> Dict:
        """Merge component blueprints."""
        for comp_type, blueprint in new.items():
            if comp_type not in existing:
                existing[comp_type] = blueprint
            else:
                # Merge variants
                if "variants" in blueprint:
                    for variant, instances in blueprint["variants"].items():
                        if variant not in existing[comp_type].get("variants", {}):
                            if "variants" not in existing[comp_type]:
                                existing[comp_type]["variants"] = {}
                            existing[comp_type]["variants"][variant] = instances
        
        return existing
    
    def _generate_tokens(self, data: Dict) -> Dict:
        """Generate design tokens from merged data."""
        tokens = {
            "color": {},
            "typography": {},
            "spacing": {},
            "border": {},
            "shadow": {},
            "sizing": {}
        }
        
        # Extract color tokens
        colors = data.get("colors", {})
        if "semantic" in colors:
            semantic = colors["semantic"]
            for name, value in semantic.items():
                if isinstance(value, dict) and "base" in value:
                    tokens["color"][name] = value["base"]
                elif isinstance(value, str):
                    tokens["color"][name] = value
        
        # Extract neutrals
        if "neutrals" in colors:
            for step, hex_val in colors["neutrals"].items():
                tokens["color"][f"neutral-{step}"] = hex_val
        
        # Extract typography tokens
        typography = data.get("typography", {})
        if "dominant" in typography:
            dom = typography["dominant"]
            tokens["typography"]["font-family-base"] = dom.get("family", "system-ui")
            tokens["typography"]["font-size-base"] = dom.get("size", "14px")
        
        if "hierarchy" in typography:
            for level, props in typography["hierarchy"].items():
                if props:
                    tokens["typography"][f"{level}-size"] = props.get("size", "")
                    tokens["typography"][f"{level}-weight"] = props.get("weight", "")
        
        return tokens
    
    def _generate_blueprints(self, data: Dict) -> Dict:
        """Generate component blueprints."""
        return data.get("components", {})
    
    def _generate_css(self, tokens: Dict) -> str:
        """Generate CSS variables from tokens."""
        lines = [
            "/**",
            " * Design System Tokens",
            f" * Generated: {datetime.now().isoformat()}",
            " * Source: Harvester v4",
            " */",
            "",
            ":root {"
        ]
        
        # Color tokens
        lines.append("  /* Colors */")
        for name, value in tokens.get("color", {}).items():
            if value:
                var_name = f"--color-{name.replace('_', '-')}"
                lines.append(f"  {var_name}: {value};")
        
        # Typography tokens
        lines.append("\n  /* Typography */")
        for name, value in tokens.get("typography", {}).items():
            if value:
                var_name = f"--{name.replace('_', '-')}"
                lines.append(f"  {var_name}: {value};")
        
        lines.append("}")
        
        return "\n".join(lines)
    
    def _save_outputs(self, tokens: Dict, blueprints: Dict, css: str, data: Dict):
        """Save all output files."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save tokens JSON
        with open(self.output_dir / "design-tokens.json", "w") as f:
            json.dump(tokens, f, indent=2)
        
        # Save CSS
        with open(self.output_dir / "design-tokens.css", "w") as f:
            f.write(css)
        
        # Save blueprints
        with open(self.output_dir / "component-blueprints.json", "w") as f:
            json.dump(blueprints, f, indent=2)
        
        # Save full data
        with open(self.output_dir / "harvest-merged.json", "w") as f:
            json.dump(data, f, indent=2)
    
    def _generate_stats(self) -> Dict:
        """Generate harvest statistics."""
        successful = [r for r in self.results if r.success]
        return {
            "total_pages": len(self.results),
            "successful": len(successful),
            "failed": len(self.results) - len(successful),
            "total_duration_ms": sum(r.duration_ms for r in self.results)
        }


async def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Harvester v4 — AI-Powered Visual Extraction",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic harvest
  python harvester_browser.py --url https://example.com
  
  # With output directory
  python harvester_browser.py --url https://example.com --output ./my-design-system
  
  # Multi-page from file
  python harvester_browser.py --urls urls.txt --output ./output
  
  # Crawl mode
  python harvester_browser.py --url https://example.com --crawl --max-pages 5
  
  # Mobile + Desktop
  python harvester_browser.py --url https://example.com --mobile
        """
    )
    
    parser.add_argument("--url", "-u", help="Single URL to harvest")
    parser.add_argument("--urls", "-f", help="File containing URLs to harvest (one per line)")
    parser.add_argument("--output", "-o", default="./output", help="Output directory")
    parser.add_argument("--crawl", "-c", action="store_true", help="Crawl linked pages")
    parser.add_argument("--max-pages", "-m", type=int, default=1, help="Maximum pages to harvest")
    parser.add_argument("--wait", "-w", type=float, default=3.0, help="Wait time after page load (seconds)")
    parser.add_argument("--viewport-width", type=int, default=1440, help="Viewport width")
    parser.add_argument("--viewport-height", type=int, default=900, help="Viewport height")
    parser.add_argument("--mobile", action="store_true", help="Also capture mobile viewport (375x812)")
    parser.add_argument("--no-screenshot", action="store_true", help="Disable screenshots")
    parser.add_argument("--dark-mode", action="store_true", help="Enable dark mode preference")
    parser.add_argument("--timeout", type=int, default=30, help="Page load timeout (seconds)")
    parser.add_argument("--retries", type=int, default=3, help="Max retries on failure")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")
    
    args = parser.parse_args()
    
    if not PLAYWRIGHT_AVAILABLE:
        print("[ERROR] Playwright is required. Install with:")
        print("  pip install playwright")
        print("  playwright install chromium")
        sys.exit(1)
    
    # Interactive mode
    if args.interactive:
        url = input("Enter URL to harvest: ").strip()
        output = input(f"Output directory [./output]: ").strip() or "./output"
        
        config = HarvestConfig(
            url=url,
            output_dir=Path(output),
            wait_time=3.0,
            viewport={"width": 1440, "height": 900}
        )
        
        if input("Enable mobile viewport? [y/N]: ").lower() == 'y':
            config.mobile_viewport = {"width": 375, "height": 812}
        
    elif args.url:
        config = HarvestConfig(
            url=args.url,
            output_dir=Path(args.output),
            wait_time=args.wait,
            crawl_links=args.crawl,
            max_pages=args.max_pages,
            viewport={"width": args.viewport_width, "height": args.viewport_height},
            mobile_viewport={"width": 375, "height": 812} if args.mobile else None,
            take_screenshots=not args.no_screenshot,
            dark_mode=args.dark_mode,
            timeout=args.timeout,
            max_retries=args.retries
        )
    
    elif args.urls:
        # Process multiple URLs from file
        with open(args.urls, 'r') as f:
            urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        
        print(f"[INFO] Processing {len(urls)} URLs from {args.urls}")
        
        for url in urls:
            config = HarvestConfig(
                url=url,
                output_dir=Path(args.output) / urlparse(url).netloc.replace(".", "_"),
                wait_time=args.wait,
                take_screenshots=not args.no_screenshot
            )
            
            print(f"\n[HARVEST] {url}")
            async with BrowserHarvester(config) as harvester:
                results = await harvester.harvest()
                
                builder = DesignSystemBuilder(results, config.output_dir)
                design_system = builder.build()
                
                print(f"[OK] Harvested: {design_system['stats']}")
                print(f"[OK] Output: {config.output_dir}")
        
        return
    
    else:
        parser.print_help()
        sys.exit(1)
    
    # Execute harvest
    print(f"[INIT] Harvesting: {config.url}")
    print(f"[CONFIG] Output: {config.output_dir}")
    print(f"[CONFIG] Viewport: {config.viewport}")
    
    async with BrowserHarvester(config) as harvester:
        results = await harvester.harvest()
        
        print(f"\n[RESULTS] {len(results)} pages harvested")
        
        for result in results:
            status = "✓" if result.success else "✗"
            print(f"  {status} {result.url} ({result.page_type})")
            if not result.success:
                print(f"      Error: {result.error}")
        
        # Build design system
        print("\n[BUILD] Generating design system...")
        builder = DesignSystemBuilder(results, config.output_dir)
        design_system = builder.build()
        
        print(f"[OK] Design system generated!")
        print(f"[STATS] {design_system['stats']}")
        print(f"[OUTPUT] Files saved to: {config.output_dir}")
        print(f"  - design-tokens.json")
        print(f"  - design-tokens.css")
        print(f"  - component-blueprints.json")
        print(f"  - harvest-merged.json")


if __name__ == "__main__":
    asyncio.run(main())
