"""Extract command implementation."""

from ..utils.console import console


def extract_command(url: str, output_format: str = "json") -> dict:
    """Extract design system from URL.
    
    Args:
        url: Website URL
        output_format: Output format
        
    Returns:
        Extracted design tokens
    """
    # Placeholder - will integrate with harvester module
    console.print(f"[yellow]Extraction from {url} - implementation pending[/yellow]")
    return {}
