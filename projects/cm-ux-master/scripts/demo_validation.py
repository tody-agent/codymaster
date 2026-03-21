#!/usr/bin/env python3
"""
UX-Master Validation Demo Script

Demonstrates the Validation Engine with sample data.
Run this to see validation in action!
"""

import sys
import json
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

from validation_engine import ValidationEngine, generate_markdown_report, generate_html_report
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()


def print_banner():
    """Print demo banner."""
    console.print("""
[bold cyan]╔═══════════════════════════════════════════════════════════════╗[/bold cyan]
[bold cyan]║                                                               ║[/bold cyan]
[bold cyan]║   ✦ UX-Master Validation Engine Demo                          ║[/bold cyan]
[bold cyan]║                                                               ║[/bold cyan]
[bold cyan]║   41 Design Tests • 48 UX Laws • Instant Feedback             ║[/bold cyan]
[bold cyan]║                                                               ║[/bold cyan]
[bold cyan]╚═══════════════════════════════════════════════════════════════╝[/bold cyan]
""")


def demo_good_design():
    """Demo with a well-designed system."""
    console.print("\n[bold green]Demo 1: Well-Designed System[/bold green]")
    console.print("─" * 60)
    
    # Sample data for a good design
    good_design = {
        "_version": 4,
        "meta": {
            "url": "https://example.com",
            "title": "SaaS Dashboard",
            "pageType": "dashboard",
            "timestamp": "2024-01-01T00:00:00Z"
        },
        "visualAnalysis": {
            "colors": {
                "semantic": {
                    "primary": {
                        "base": "#0064FA",
                        "psychology": {"h": 220, "emotion": "professional, reliable"}
                    },
                    "secondary": {"base": "#4ECDC4"},
                    "success": {"base": "#10B981"},
                    "warning": {"base": "#F59E0B"},
                    "danger": {"base": "#EF4444"},
                    "info": {"base": "#3B82F6"}
                },
                "neutrals": {
                    "50": "#F9FAFB", "100": "#F3F4F6", "200": "#E5E7EB",
                    "300": "#D1D5DB", "400": "#9CA3AF", "500": "#6B7280",
                    "600": "#4B5563", "700": "#374151", "800": "#1F2937", "900": "#111827"
                }
            },
            "typography": {
                "hierarchy": {
                    "h1": {"size": "32px", "weight": "700", "family": "Inter"},
                    "h2": {"size": "24px", "weight": "600", "family": "Inter"},
                    "h3": {"size": "20px", "weight": "600", "family": "Inter"},
                    "h4": {"size": "18px", "weight": "600", "family": "Inter"}
                },
                "dominant": {
                    "family": "Inter, sans-serif",
                    "size": "16px",
                    "weight": "400"
                }
            },
            "layout": {
                "sidebar": {"width": 240, "position": "fixed"},
                "header": {"height": 64, "fixed": True},
                "content": {"maxWidth": "1200px", "centered": True}
            },
            "spacing": {
                "scale": [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
                "values": {}
            },
            "borders": {
                "radius": {
                    "none": "0px", "xs": "2px", "sm": "4px",
                    "md": "8px", "lg": "12px", "xl": "16px", "full": "9999px"
                }
            }
        },
        "components": {
            "blueprints": {
                "button": {
                    "count": 8,
                    "representative": {
                        "dimensions": {"width": 120, "height": 48},
                        "styles": {
                            "backgroundColor": "#0064FA",
                            "color": "#FFFFFF",
                            "padding": "12px 24px",
                            "borderRadius": "8px"
                        }
                    },
                    "variants": {
                        "primary": [{"styles": {}}],
                        "secondary": [{"styles": {}}],
                        "ghost": [{"styles": {}}]
                    }
                },
                "input": {
                    "count": 5,
                    "representative": {
                        "dimensions": {"width": 300, "height": 44}
                    }
                },
                "card": {
                    "count": 6,
                    "representative": {
                        "styles": {"borderRadius": "12px"}
                    }
                },
                "modal": {"count": 2},
                "table": {"count": 3}
            }
        },
        "quality": {
            "accessibility": {
                "contrastIssues": [],
                "missingLabels": [],
                "missingFocus": [],
                "ariaIssues": []
            }
        }
    }
    
    # Run validation
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("[green]Running validation...", total=None)
        
        engine = ValidationEngine()
        report = engine.validate(good_design, test_suite="all")
        
        progress.update(task, completed=True)
    
    # Display results
    score_color = "green" if report.score >= 80 else "yellow" if report.score >= 60 else "red"
    
    console.print(Panel.fit(
        f"[bold {score_color}]{report.score:.1f}/100[/bold {score_color}]\n"
        f"[white]✓ Passed: {report.passed_count} | ✗ Failed: {report.failed_count} | Total: {report.total_count}[/white]",
        title="[bold green]Validation Results[/bold green]",
        border_style=score_color
    ))
    
    # Show category breakdown
    table = Table(show_header=True, header_style="bold")
    table.add_column("Category")
    table.add_column("Passed", justify="right")
    table.add_column("Failed", justify="right")
    table.add_column("Score")
    
    for cat, stats in report.summary.get("by_category", {}).items():
        total = stats["passed"] + stats["failed"]
        score = (stats["passed"] / total * 100) if total > 0 else 0
        score_str = f"[green]{score:.0f}%[/green]" if score >= 80 else f"[yellow]{score:.0f}%[/yellow]"
        table.add_row(
            cat.capitalize(),
            f"[green]{stats['passed']}[/green]",
            f"[red]{stats['failed']}[/red]" if stats["failed"] > 0 else str(stats["failed"]),
            score_str
        )
    
    console.print(table)
    
    # Show any failed tests
    failed = [t for t in report.tests if not t.passed]
    if failed:
        console.print("\n[bold yellow]Areas for Improvement:[/bold yellow]")
        for test in failed[:3]:
            console.print(f"  • [yellow]{test.name}[/yellow]: {test.suggestion}")
    else:
        console.print("\n[bold green]✨ Excellent! No issues found.[/bold green]")
    
    return report


def demo_poor_design():
    """Demo with a poorly-designed system."""
    console.print("\n[bold red]Demo 2: Poorly-Designed System[/bold red]")
    console.print("─" * 60)
    
    # Sample data for a poor design
    poor_design = {
        "_version": 4,
        "meta": {
            "pageType": "generic"
        },
        "visualAnalysis": {
            "colors": {
                "semantic": {
                    "primary": {"base": "#0064FA"}
                    # Missing success, warning, danger
                },
                "neutrals": {
                    "500": "#6B7280"
                    # Missing most neutral levels
                }
            },
            "typography": {
                "hierarchy": {
                    "h1": {"size": "32px"}
                    # Missing h2, h3, h4
                },
                "dominant": {
                    "family": "Times New Roman"  # Poor font choice
                }
            },
            "spacing": {
                "scale": [5, 13, 27]  # Irregular spacing
            },
            "borders": {
                "radius": {}
            }
        },
        "components": {
            "blueprints": {
                "button": {
                    "count": 2,
                    "representative": {
                        "dimensions": {"width": 30, "height": 28}  # Too small!
                    }
                }
            }
        },
        "quality": {
            "accessibility": {
                "contrastIssues": [
                    {"element": "p", "contrast": "2.1", "fg": "#999999", "bg": "#FFFFFF"},
                    {"element": "span", "contrast": "1.8", "fg": "#AAAAAA", "bg": "#FFFFFF"}
                ],
                "missingLabels": [
                    {"type": "input"},
                    {"type": "input"}
                ],
                "missingFocus": [{"element": "button"}]
            }
        }
    }
    
    # Run validation
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("[red]Running validation...", total=None)
        
        engine = ValidationEngine()
        report = engine.validate(poor_design, test_suite="all")
        
        progress.update(task, completed=True)
    
    # Display results
    score_color = "green" if report.score >= 80 else "yellow" if report.score >= 60 else "red"
    
    console.print(Panel.fit(
        f"[bold {score_color}]{report.score:.1f}/100[/bold {score_color}]\n"
        f"[white]✓ Passed: {report.passed_count} | ✗ Failed: {report.failed_count} | Total: {report.total_count}[/white]",
        title="[bold red]Validation Results[/bold red]",
        border_style=score_color
    ))
    
    # Show critical issues
    critical = [t for t in report.tests if not t.passed and t.severity.value == "critical"]
    if critical:
        console.print(f"\n[bold red]⚠ Critical Issues ({len(critical)}):[/bold red]")
        for test in critical[:5]:
            console.print(Panel(
                f"[bold]{test.name}[/bold]\n"
                f"[red]Issue:[/red] {test.message}\n"
                f"[yellow]Fix:[/yellow] {test.suggestion}",
                border_style="red"
            ))
    
    # Show other issues
    other = [t for t in report.tests if not t.passed and t.severity.value != "critical"]
    if other:
        console.print(f"\n[bold yellow]Other Issues ({len(other)}):[/bold yellow]")
        for test in other[:5]:
            console.print(f"  • [yellow]{test.name}[/yellow]: {test.suggestion}")
    
    return report


def demo_mobile_suite():
    """Demo mobile-specific validation."""
    console.print("\n[bold blue]Demo 3: Mobile Validation Suite[/bold blue]")
    console.print("─" * 60)
    
    # Mobile app data
    mobile_app = {
        "meta": {"pageType": "mobile"},
        "visualAnalysis": {
            "colors": {
                "semantic": {
                    "primary": {"base": "#7C3AED"}
                }
            }
        },
        "components": {
            "blueprints": {
                "button": {
                    "representative": {
                        "dimensions": {"width": 50, "height": 36}  # Slightly small
                    }
                },
                "navigation": {
                    "representative": {
                        "dimensions": {"width": 375, "height": 60}
                    }
                }
            }
        }
    }
    
    engine = ValidationEngine()
    report = engine.validate(mobile_app, test_suite="mobile")
    
    console.print(f"\n[bold]Mobile Test Results:[/bold]")
    console.print(f"Score: {report.score:.1f}/100")
    console.print(f"Tests: {report.passed_count} passed, {report.failed_count} failed")
    
    console.print("\n[bold]Tests Run:[/bold]")
    for test in report.tests:
        icon = "✓" if test.passed else "✗"
        color = "green" if test.passed else "red"
        console.print(f"  [{color}]{icon}[/{color}] {test.test_id}: {test.name}")


def demo_report_generation():
    """Demo report generation in different formats."""
    console.print("\n[bold magenta]Demo 4: Report Generation[/bold magenta]")
    console.print("─" * 60)
    
    # Sample data
    sample_data = {
        "meta": {"pageType": "landing"},
        "visualAnalysis": {
            "colors": {
                "semantic": {
                    "primary": {"base": "#0064FA"},
                    "success": {"base": "#10B981"},
                    "warning": {"base": "#F59E0B"},
                    "danger": {"base": "#EF4444"}
                },
                "neutrals": {
                    "50": "#F9FAFB", "100": "#F3F4F6", "200": "#E5E7EB",
                    "300": "#D1D5DB", "400": "#9CA3AF", "500": "#6B7280",
                    "600": "#4B5563", "700": "#374151", "800": "#1F2937", "900": "#111827"
                }
            },
            "typography": {
                "hierarchy": {
                    "h1": {"size": "32px"},
                    "h2": {"size": "24px"},
                    "h3": {"size": "20px"}
                }
            },
            "spacing": {"scale": [4, 8, 12, 16, 24, 32]}
        },
        "components": {
            "blueprints": {
                "button": {
                    "representative": {"dimensions": {"width": 100, "height": 44}}
                }
            }
        },
        "quality": {"accessibility": {"contrastIssues": []}}
    }
    
    engine = ValidationEngine()
    report = engine.validate(sample_data, test_suite="all")
    
    # Generate reports
    output_dir = Path(__file__).parent.parent / "output" / "demo-reports"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Markdown report
    md_report = generate_markdown_report(report)
    md_path = output_dir / "validation-report.md"
    with open(md_path, "w") as f:
        f.write(md_report)
    console.print(f"✓ Markdown report: {md_path}")
    
    # HTML report
    html_report = generate_html_report(report)
    html_path = output_dir / "validation-report.html"
    with open(html_path, "w") as f:
        f.write(html_report)
    console.print(f"✓ HTML report: {html_path}")
    
    # JSON report
    json_path = output_dir / "validation-report.json"
    with open(json_path, "w") as f:
        json.dump(report.to_dict(), f, indent=2)
    console.print(f"✓ JSON report: {json_path}")
    
    console.print(f"\n[bold]View HTML report:[/bold] open {html_path}")


def main():
    """Run all demos."""
    print_banner()
    
    console.print("\n[dim]This demo showcases the UX-Master Validation Engine v4[/dim]")
    console.print("[dim]with 41 Design Tests across 8 categories.[/dim]\n")
    
    # Run demos
    demo_good_design()
    demo_poor_design()
    demo_mobile_suite()
    demo_report_generation()
    
    # Summary
    console.print("\n" + "=" * 60)
    console.print("[bold cyan]Demo Complete![/bold cyan]")
    console.print("=" * 60)
    console.print("\n[bold]Key Features Demonstrated:[/bold]")
    console.print("  ✓ 41 Design Tests across 8 categories")
    console.print("  ✓ Severity levels (Critical/High/Medium/Low)")
    console.print("  ✓ Category-based scoring")
    console.print("  ✓ Actionable suggestions")
    console.print("  ✓ Report generation (Markdown, HTML, JSON)")
    console.print("\n[dim]Next: Try validating your own designs![/dim]")
    console.print("[dim]  uxm validate your-file.html --suite all[/dim]\n")


if __name__ == "__main__":
    main()
