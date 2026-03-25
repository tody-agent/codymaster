"""Init command implementation."""

from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.prompt import Confirm

from ..template_engine import PlatformManager
from ..utils.console import print_banner, print_success, print_error

console = Console()


def init_command(
    ai: Optional[str],
    global_install: bool = False,
    force: bool = False,
    output: Optional[Path] = None,
    dry_run: bool = False
) -> list[str]:
    """Initialize UX-Master for an AI assistant.
    
    Args:
        ai: AI assistant type
        global_install: Install to global config
        force: Overwrite existing files
        output: Output directory
        dry_run: Preview without creating files
        
    Returns:
        List of created file paths
    """
    manager = PlatformManager()
    
    if ai is None:
        raise click.UsageError("Please specify --ai or run interactively")
    
    # Determine output directory
    if output:
        output_dir = output
    elif global_install:
        output_dir = Path.home() / ".config"
    else:
        output_dir = Path.cwd()
    
    # Generate files
    if dry_run:
        console.print(f"[yellow]DRY RUN: Would generate for {ai}[/yellow]")
        return []
    
    if ai == "all":
        created = manager.generate_all_platforms(output_dir)
    else:
        created = manager.generate_skill(ai, output_dir)
    
    return created
