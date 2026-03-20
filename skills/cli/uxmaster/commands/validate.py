"""Validate command implementation with Validation Engine v4."""

import json
import sys
from pathlib import Path
from typing import Optional

from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

from ..utils.console import console


def validate_command(
    file_path: Path,
    suite: str = "all",
    output: Optional[Path] = None,
    format: str = "rich"
) -> dict:
    """Validate UI file against 37 Design Tests.
    
    Args:
        file_path: Path to HTML/JSON file to validate
        suite: Test suite to run (all, mobile, landing, dashboard, a11y)
        output: Optional output file path
        format: Output format (rich, json, markdown, html)
        
    Returns:
        Validation results dict
    """
    # Import validation engine
    try:
        scripts_path = Path(__file__).parent.parent.parent.parent / "scripts"
        sys.path.insert(0, str(scripts_path))
        from validation_engine import ValidationEngine
    except ImportError as e:
        console.print(f"[red]Error: Cannot import validation engine: {e}[/red]")
        return {"error": str(e)}
    
    # Check file exists
    if not file_path.exists():
        console.print(f"[red]Error: File not found: {file_path}[/red]")
        return {"error": "File not found"}
    
    # Load data
    with console.status(f"[bold blue]Loading {file_path}..."):
        try:
            with open(file_path) as f:
                data = json.load(f)
        except json.JSONDecodeError:
            console.print(f"[red]Error: Invalid JSON in {file_path}[/red]")
            return {"error": "Invalid JSON"}
    
    # Run validation
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task(f"[cyan]Running {suite} test suite...", total=None)
        
        engine = ValidationEngine()
        report = engine.validate(data, test_suite=suite)
        
        progress.update(task, completed=True)
    
    # Display results
    if format == "rich":
        _display_rich_results(report)
    
    # Save output if requested
    if output:
        if format == "json":
            output_content = json.dumps(report.to_dict(), indent=2)
        elif format == "markdown":
            from validation_engine import generate_markdown_report
            output_content = generate_markdown_report(report)
        elif format == "html":
            from validation_engine import generate_html_report
            output_content = generate_html_report(report)
        else:
            output_content = json.dumps(report.to_dict(), indent=2)
        
        with open(output, "w") as f:
            f.write(output_content)
        console.print(f"\n[green]✓ Report saved to {output}[/green]")
    
    return report.to_dict()


def _display_rich_results(report):
    """Display validation results in rich format."""
    # Score panel
    score_color = "green" if report.score >= 80 else "yellow" if report.score >= 60 else "red"
    
    console.print(Panel.fit(
        f"[bold {score_color}]{report.score:.0f}/100[/bold {score_color}]\n"
        f"[white]Passed: {report.passed_count} | Failed: {report.failed_count} | Total: {report.total_count}[/white]",
        title="[bold]UX-Master Validation Report[/bold]",
        border_style=score_color
    ))
    
    # Critical issues
    critical_count = report.summary.get("critical_issues", 0)
    if critical_count > 0:
        console.print(Panel(
            f"[bold red]⚠ {critical_count} critical issues must be fixed[/bold red]\n"
            f"Fixes: {', '.join(report.summary.get('critical_fixes', []))}",
            title="[bold red]Critical Issues[/bold red]",
            border_style="red"
        ))
    
    # Summary by category
    console.print("\n[bold]Results by Category:[/bold]")
    cat_table = Table(show_header=True, header_style="bold")
    cat_table.add_column("Category")
    cat_table.add_column("Passed", justify="right")
    cat_table.add_column("Failed", justify="right")
    cat_table.add_column("Score")
    
    for cat, stats in report.summary.get("by_category", {}).items():
        total = stats["passed"] + stats["failed"]
        score = (stats["passed"] / total * 100) if total > 0 else 0
        score_str = f"[green]{score:.0f}%[/green]" if score >= 80 else f"[yellow]{score:.0f}%[/yellow]"
        cat_table.add_row(
            cat.capitalize(),
            f"[green]{stats['passed']}[/green]",
            f"[red]{stats['failed']}[/red]" if stats["failed"] > 0 else str(stats["failed"]),
            score_str
        )
    
    console.print(cat_table)
    
    # Failed tests table
    failed_tests = [t for t in report.tests if not t.passed]
    if failed_tests:
        console.print("\n[bold red]Failed Tests:[/bold red]")
        
        fail_table = Table(show_header=True, header_style="bold")
        fail_table.add_column("ID", style="dim")
        fail_table.add_column("Name")
        fail_table.add_column("Category")
        fail_table.add_column("Severity")
        fail_table.add_column("Issue")
        
        for test in failed_tests[:20]:  # Limit to 20
            severity_color = {
                "critical": "red",
                "high": "orange3",
                "medium": "yellow",
                "low": "dim"
            }.get(test.severity.value, "white")
            
            fail_table.add_row(
                test.test_id,
                test.name,
                test.category.value,
                f"[{severity_color}]{test.severity.value}[/{severity_color}]",
                test.message[:50] + "..." if len(test.message) > 50 else test.message
            )
        
        console.print(fail_table)
        
        if len(failed_tests) > 20:
            console.print(f"[dim]... and {len(failed_tests) - 20} more issues[/dim]")
    
    # Suggestions
    console.print("\n[bold cyan]Top Recommendations:[/bold cyan]")
    for i, test in enumerate(failed_tests[:5], 1):
        console.print(f"{i}. [bold]{test.name}[/bold]: {test.suggestion}")
    
    console.print()


def validate_url_command(
    url: str,
    suite: str = "all",
    output: Optional[Path] = None
) -> dict:
    """Validate a live URL using Harvester v4 + Validation Engine.
    
    Args:
        url: URL to validate
        suite: Test suite to run
        output: Optional output file path
        
    Returns:
        Validation results dict
    """
    try:
        scripts_path = Path(__file__).parent.parent.parent.parent / "scripts"
        sys.path.insert(0, str(scripts_path))
        
        from harvester_browser import BrowserHarvester
        from validation_engine import ValidationEngine
    except ImportError as e:
        console.print(f"[red]Error: Cannot import required modules: {e}[/red]")
        return {"error": str(e)}
    
    # Harvest
    with console.status(f"[bold blue]Harvesting {url}..."):
        harvester = BrowserHarvester()
        result = harvester.harvest(url)
        
        if not result.get("success"):
            console.print(f"[red]Harvest failed: {result.get('error')}[/red]")
            return {"error": result.get("error")}
    
    # Validate
    data = result.get("data", {})
    engine = ValidationEngine()
    report = engine.validate(data, test_suite=suite)
    
    # Display
    _display_rich_results(report)
    
    # Save if requested
    if output:
        with open(output, "w") as f:
            json.dump(report.to_dict(), f, indent=2)
        console.print(f"[green]✓ Report saved to {output}[/green]")
    
    return report.to_dict()


def validate_component_command(
    component_type: str,
    file_path: Path
) -> dict:
    """Validate a specific component type.
    
    Args:
        component_type: Type of component (button, input, card, etc.)
        file_path: Path to component JSON file
        
    Returns:
        Validation results dict
    """
    try:
        scripts_path = Path(__file__).parent.parent.parent.parent / "scripts"
        sys.path.insert(0, str(scripts_path))
        from validation_engine import ValidationEngine
    except ImportError as e:
        console.print(f"[red]Error: Cannot import validation engine: {e}[/red]")
        return {"error": str(e)}
    
    # Load component data
    with open(file_path) as f:
        component_data = json.load(f)
    
    # Validate
    engine = ValidationEngine()
    report = engine.validate_component(component_data, component_type)
    
    # Display
    console.print(Panel.fit(
        f"[bold]Component Validation: {component_type}[/bold]\n"
        f"Score: {report.score:.0f}/100 | Passed: {report.passed_count}/{report.total_count}",
        border_style="blue"
    ))
    
    for test in report.tests:
        icon = "✓" if test.passed else "✗"
        color = "green" if test.passed else "red"
        console.print(f"[{color}]{icon}[/{color}] {test.test_id}: {test.name}")
        if not test.passed:
            console.print(f"   [dim]{test.suggestion}[/dim]")
    
    return report.to_dict()
