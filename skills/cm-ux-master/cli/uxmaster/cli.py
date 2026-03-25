#!/usr/bin/env python3
"""
UX-Master CLI
Main command-line interface with rich output and interactive prompts.
"""

import sys
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.tree import Tree
from rich import box

from .template_engine import PlatformManager
from .search_engine import SearchEngine

console = Console()


def print_banner():
    """Print UX-Master banner."""
    banner_text = """
[bold cyan]    ██╗   ██╗██╗  ██╗[/bold cyan] [bold white]███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ [/bold white]
[bold cyan]    ██║   ██║╚██╗██╔╝[/bold cyan] [bold white]████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗[/bold white]
[bold cyan]    ██║   ██║ ╚███╔╝ [/bold cyan] [bold white]██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝[/bold white]
[bold cyan]    ██║   ██║ ██╔██╗ [/bold cyan] [bold white]██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗[/bold white]
[bold cyan]    ╚██████╔╝██╔╝ ██╗[/bold cyan] [bold white]██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║[/bold white]
[bold cyan]     ╚═════╝ ╚═╝  ╚═╝[/bold cyan] [bold white]╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝[/bold white]
    """
    console.print(banner_text)
    console.print("[dim]                    Ultimate UX Design Intelligence v2.0.0[/dim]\n")


@click.group()
@click.version_option(version="2.0.0", prog_name="uxmaster")
def cli():
    """UX-Master CLI - Ultimate UX Design Intelligence.
    
    Features:
    - 48 UX Laws for psychology-driven design
    - 37 Design Tests with pass/fail criteria
    - 16+ AI assistant integrations
    - MCP server for AI tool integration
    - Figma & Google Stitch integrations
    """
    pass


@cli.command()
@click.option('--ai', '-a', 
              type=click.Choice([
                  'claude', 'cursor', 'windsurf', 'antigravity', 
                  'copilot', 'kiro', 'opencode', 'roocode',
                  'codex', 'qoder', 'gemini', 'trae',
                  'continue', 'codebuddy', 'droid', 'cline', 'all'
              ]),
              help='AI assistant to install for')
@click.option('--global', '-g', 'global_install', is_flag=True,
              help='Install to global/user config directory')
@click.option('--force', '-f', is_flag=True,
              help='Overwrite existing files')
@click.option('--output', '-o', type=click.Path(),
              help='Output directory (default: current directory)')
@click.option('--dry-run', is_flag=True,
              help='Show what would be generated without creating files')
def init(ai: Optional[str], global_install: bool, force: bool, output: Optional[str], dry_run: bool):
    """Install UX-Master skill for AI assistants.
    
    Examples:
        uxm init --ai claude              # Install for Claude Code
        uxm init --ai cursor --force      # Overwrite existing
        uxm init --ai all                 # Install for all platforms
        uxm init --ai figma --dry-run     # Preview Figma integration
    """
    from .commands.init import init_command
    
    print_banner()
    
    output_dir = Path(output) if output else (Path.home() / ".config" if global_install else Path.cwd())
    
    try:
        created = init_command(ai, global_install, force, output_dir, dry_run)
        
        if dry_run:
            console.print(f"\n[bold]Would create:[/bold]")
            for path in created:
                console.print(f"  [green]+[/green] {path}")
        else:
            console.print(f"\n[bold green]✓ Installation complete![/bold green]")
            console.print(f"\n[bold]Created files:[/bold]")
            for path in created:
                console.print(f"  [green]+[/green] {path}")
            
            console.print(f"\n[bold cyan]Next steps:[/bold cyan]")
            if ai == 'all':
                console.print("  1. Restart your AI coding assistant")
                console.print("  2. Try: [dim]\"Create a landing page for my SaaS\"[/dim]")
            else:
                console.print(f"  1. Restart your AI assistant")
                console.print("  2. Try: [dim]\"Design a mobile app with proper touch targets\"[/dim]")
                
    except Exception as e:
        console.print(f"\n[bold red]✗ Installation failed:[/bold red] {e}")
        raise click.ClickException(str(e))


@cli.command()
@click.argument('query')
@click.option('--domain', '-d',
              type=click.Choice([
                  'ux-laws', 'design-tests', 'style', 'color', 
                  'typography', 'product', 'landing', 'chart',
                  'animation', 'responsive', 'accessibility', 'devices'
              ]),
              help='Search domain')
@click.option('--stack', '-s',
              type=click.Choice([
                  'html-tailwind', 'react', 'nextjs', 'vue', 'nuxtjs',
                  'nuxt-ui', 'svelte', 'astro', 'swiftui', 'react-native',
                  'flutter', 'shadcn', 'jetpack-compose', 'angular',
                  'htmx', 'electron', 'tauri'
              ]),
              help='Technology stack')
@click.option('--max-results', '-n', default=3, help='Maximum results to show')
@click.option('--design-system', '-ds', is_flag=True,
              help='Generate complete design system recommendation')
@click.option('--project-name', '-p', help='Project name for design system')
@click.option('--format', '-f', 'output_format',
              type=click.Choice(['ascii', 'markdown', 'json']),
              default='ascii', help='Output format')
@click.option('--persist', is_flag=True,
              help='Save to design-system/MASTER.md')
@click.option('--page', help='Create page-specific override file')
def search(query: str, domain: Optional[str], stack: Optional[str], max_results: int,
           design_system: bool, project_name: Optional[str], output_format: str,
           persist: bool, page: Optional[str]):
    """Search UX-Master knowledge base.
    
    Examples:
        uxm search "fintech dashboard" --design-system
        uxm search "mobile touch targets" --domain ux-laws
        uxm search "glassmorphism" --domain style -n 5
        uxm search "form validation" --stack react
    """
    from .commands.search import search_command
    
    print_banner()
    
    engine = SearchEngine()
    
    try:
        if design_system:
            result = engine.generate_design_system(
                query=query,
                project_name=project_name,
                output_format=output_format
            )
            console.print(result)
        elif stack:
            results = engine.search_stack(query, stack, max_results)
            _display_search_results(results, stack)
        else:
            results = engine.search(query, domain, max_results)
            _display_search_results(results, domain)
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


def _display_search_results(results: list, source: Optional[str]):
    """Display search results in a rich table."""
    if not results:
        console.print("[yellow]No results found[/yellow]")
        return
    
    table = Table(
        title=f"Search Results: {source or 'General'}",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan"
    )
    
    if results:
        for key in results[0].keys():
            if not key.startswith('_'):
                table.add_column(key.replace('_', ' ').title(), overflow="fold")
    
    for result in results[:5]:
        row_values = []
        for key, value in result.items():
            if not key.startswith('_'):
                text = str(value)
                if len(text) > 80:
                    text = text[:77] + "..."
                row_values.append(text)
        table.add_row(*row_values)
    
    console.print(table)


@cli.command()
@click.argument('url')
@click.option('--output', '-o', type=click.Path(), help='Output file')
@click.option('--format', '-f', 
              type=click.Choice(['json', 'yaml', 'css', 'tailwind']),
              default='json', help='Output format')
@click.option('--depth', '-d', default=1, help='Crawl depth (1-3)')
@click.option('--figma', is_flag=True, help='Export to Figma variables')
@click.option('--stitch', is_flag=True, help='Export to Google Stitch')
@click.option('--screenshots', is_flag=True, help='Capture screenshots')
def extract(url: str, output: Optional[str], format: str, depth: int, 
            figma: bool, stitch: bool, screenshots: bool):
    """Extract design system from website.
    
    Examples:
        uxm extract https://stripe.com --output stripe-tokens.json
        uxm extract https://linear.app --format tailwind
        uxm extract https://vercel.com --figma
    """
    from .commands.extract import extract_command
    
    print_banner()
    
    console.print(f"[bold]Extracting from:[/bold] {url}")
    console.print(f"[dim]Format: {format} | Depth: {depth}[/dim]\n")
    
    try:
        result = extract_command(url, format)
        console.print("[green]Extraction complete![/green]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.argument('target')
@click.option('--suite', '-s',
              type=click.Choice(['all', 'mobile', 'landing', 'dashboard', 'a11y', 'color', 'typography']),
              default='all', help='Test suite to run (37 Design Tests)')
@click.option('--format', '-f',
              type=click.Choice(['rich', 'json', 'markdown', 'html']),
              default='rich', help='Output format')
@click.option('--output', '-o', type=click.Path(), help='Save report to file')
@click.option('--url', '-u', is_flag=True, help='Target is a URL (use Harvester v4)')
@click.option('--component', '-c', 
              type=click.Choice(['button', 'input', 'card', 'modal', 'navigation', 'table']),
              help='Validate specific component type')
def validate(target: str, suite: str, format: str, output: Optional[str], url: bool, component: Optional[str]):
    """Validate UI against 37 Design Tests using Validation Engine v4.
    
    Validates HTML files, URLs, or components against UX-Master's 37 Design Tests
    including Fitts's Law, WCAG contrast, typography hierarchy, and more.
    
    Examples:
        # Validate local HTML file
        uxm validate index.html --suite mobile
        
        # Validate a live website
        uxm validate https://stripe.com --url
        
        # Validate specific component
        uxm validate button.json --component button
        
        # Generate HTML report
        uxm validate index.html --suite all --format html --output report.html
        
        # Quick accessibility check
        uxm validate https://example.com --url --suite a11y
    """
    from .commands.validate import validate_command, validate_url_command, validate_component_command
    
    print_banner()
    
    try:
        if url:
            console.print(f"[bold]Validating URL:[/bold] {target}")
            console.print(f"[dim]Using Harvester v4 + Validation Engine | Suite: {suite}[/dim]\n")
            result = validate_url_command(target, suite, Path(output) if output else None)
        elif component:
            console.print(f"[bold]Validating Component:[/bold] {component}")
            console.print(f"[dim]File: {target} | Suite: {suite}[/dim]\n")
            result = validate_component_command(component, Path(target))
        else:
            console.print(f"[bold]Validating File:[/bold] {target}")
            console.print(f"[dim]Suite: {suite} | Format: {format}[/dim]\n")
            result = validate_command(Path(target), suite, Path(output) if output else None, format)
        
        if result.get('error'):
            console.print(f"[bold red]✗ Validation failed:[/bold red] {result['error']}")
        else:
            score = result.get('score', 0)
            score_color = 'green' if score >= 80 else 'yellow' if score >= 60 else 'red'
            console.print(f"\n[bold {score_color}]Score: {score:.0f}/100[/bold {score_color}]")
            
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
def platforms():
    """List supported AI platforms."""
    print_banner()
    
    manager = PlatformManager()
    platforms_dict = manager.list_supported_platforms()
    
    table = Table(
        title="Supported AI Platforms",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan"
    )
    
    table.add_column("CLI Flag", style="dim")
    table.add_column("Platform Name", style="bright_white")
    table.add_column("Status", style="green")
    
    for key, name in sorted(platforms_dict.items()):
        table.add_row(f"--ai {key}", name, "✓ Supported")
    
    console.print(table)
    console.print(f"\n[dim]Total: {len(platforms_dict)} platforms[/dim]")


@cli.command()
def docs():
    """Open UX-Master documentation."""
    click.launch("https://ux-master.dev/docs")


# Import and add MCP commands
try:
    from .commands.mcp import mcp as mcp_group
    cli.add_command(mcp_group, name="mcp")
except ImportError:
    # MCP dependencies not installed
    @cli.group()
    def mcp():
        """MCP server commands (install with: pip install uxmaster[mcp])"""
        console.print("[yellow]MCP support not installed.[/yellow]")
        console.print("[dim]Install with: pip install uxmaster[mcp][/dim]")
        raise click.Abort()


# Entry point
if __name__ == "__main__":
    cli()
