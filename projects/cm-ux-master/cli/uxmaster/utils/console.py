"""Console utilities for rich output."""

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

console = Console()


def print_banner():
    """Print UX-Master banner."""
    banner_text = Text()
    banner_text.append("UX-Master ", style="bold cyan")
    banner_text.append("v2.0.0", style="dim")
    
    panel = Panel(
        banner_text,
        subtitle="Ultimate UX Design Intelligence",
        subtitle_align="center",
        border_style="cyan"
    )
    console.print(panel)


def print_success(message: str):
    """Print success message."""
    console.print(f"[bold green]✓[/bold green] {message}")


def print_error(message: str):
    """Print error message."""
    console.print(f"[bold red]✗[/bold red] {message}")


def print_warning(message: str):
    """Print warning message."""
    console.print(f"[bold yellow]⚠[/bold yellow] {message}")


def print_info(message: str):
    """Print info message."""
    console.print(f"[blue]ℹ[/blue] {message}")
