#!/usr/bin/env python3
"""
MCP (Model Context Protocol) command for UX-Master CLI

Manages MCP server lifecycle and configuration.
"""

import subprocess
import sys
import os
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()


@click.group()
def mcp():
    """Manage MCP (Model Context Protocol) server."""
    pass


@mcp.command()
@click.option('--port', '-p', default=3000, help='Server port')
@click.option('--host', '-h', default='0.0.0.0', help='Server host')
@click.option('--detach', '-d', is_flag=True, help='Run in background')
def start(port: int, host: str, detach: bool):
    """Start the MCP server.
    
    Examples:
        uxm mcp start              # Start on default port 3000
        uxm mcp start -p 8080      # Start on port 8080
        uxm mcp start -d           # Run in background
    """
    from ..utils.console import print_banner
    print_banner()
    
    env = os.environ.copy()
    env['PORT'] = str(port)
    env['HOST'] = host
    
    if detach:
        # Run in background
        if sys.platform == 'darwin' or sys.platform.startswith('linux'):
            subprocess.Popen(
                [sys.executable, '-m', 'mcp.server'],
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
            console.print(f"[green]✓[/green] MCP Server started in background on {host}:{port}")
        else:
            console.print("[yellow]Background mode not supported on this platform[/yellow]")
    else:
        # Run in foreground
        console.print(f"[blue]Starting MCP Server on {host}:{port}...[/blue]")
        console.print("[dim]Press Ctrl+C to stop[/dim]\n")
        
        try:
            subprocess.run(
                [sys.executable, '-m', 'mcp.server'],
                env=env
            )
        except KeyboardInterrupt:
            console.print("\n[yellow]MCP Server stopped[/yellow]")


@mcp.command()
def stop():
    """Stop the running MCP server."""
    import psutil
    
    killed = False
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info.get('cmdline', [])
            if cmdline and 'mcp.server' in ' '.join(cmdline):
                proc.terminate()
                killed = True
                console.print(f"[green]✓[/green] Stopped MCP server (PID: {proc.info['pid']})")
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    if not killed:
        console.print("[yellow]No MCP server found running[/yellow]")


@mcp.command()
def status():
    """Check MCP server status."""
    import requests
    
    try:
        response = requests.get('http://localhost:3000/health', timeout=2)
        if response.status_code == 200:
            data = response.json()
            
            panel = Panel(
                f"[green]●[/green] Server is running\n"
                f"[dim]Version:[/dim] {data.get('version', 'unknown')}\n"
                f"[dim]URL:[/dim] http://localhost:3000\n"
                f"[dim]API:[/dim] /mcp/v1/",
                title="MCP Server Status",
                border_style="green"
            )
            console.print(panel)
            
            # Show tools
            tools_response = requests.post('http://localhost:3000/mcp/v1/tools/list', timeout=2)
            if tools_response.status_code == 200:
                tools = tools_response.json().get('tools', [])
                
                table = Table(title="Available Tools")
                table.add_column("Tool", style="cyan")
                table.add_column("Description", style="white")
                
                for tool in tools:
                    table.add_row(
                        tool.get('name', ''),
                        tool.get('description', '')[:60] + '...'
                    )
                
                console.print(table)
        else:
            console.print("[yellow]⚠ Server responded with error[/yellow]")
    except requests.ConnectionError:
        console.print("[red]✗[/red] MCP Server is not running")
        console.print("[dim]Start with: uxm mcp start[/dim]")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")


@mcp.command()
def config():
    """Show MCP configuration."""
    config_path = Path(__file__).parent.parent.parent.parent / "mcp" / "mcp-config.json"
    
    if config_path.exists():
        import json
        with open(config_path) as f:
            config = json.load(f)
        
        console.print(Panel(
            f"[bold]{config.get('name')}[/bold] v{config.get('version')}\n"
            f"{config.get('description')}",
            title="MCP Configuration",
            border_style="blue"
        ))
        
        console.print(f"\n[dim]Config file:[/dim] {config_path}")
        console.print(f"[dim]Tools:[/dim] {len(config.get('tools', []))}")
        console.print(f"[dim]Resources:[/dim] {len(config.get('resources', []))}")
    else:
        console.print("[red]Config file not found[/red]")


@mcp.command()
@click.argument('tool')
@click.option('--data', '-d', help='JSON data for tool arguments')
def call(tool: str, data: str):
    """Call an MCP tool directly.
    
    Example:
        uxm mcp call search_ux_laws -d '{"query": "mobile touch targets"}'
    """
    import requests
    import json
    
    try:
        arguments = json.loads(data) if data else {}
        
        response = requests.post(
            'http://localhost:3000/mcp/v1/tools/call',
            json={"name": tool, "arguments": arguments},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            console.print_json(json.dumps(result, indent=2))
        else:
            console.print(f"[red]Error:[/red] {response.status_code}")
            console.print(response.text)
    except requests.ConnectionError:
        console.print("[red]MCP Server not running. Start with: uxm mcp start[/red]")
    except json.JSONDecodeError:
        console.print("[red]Invalid JSON in --data argument[/red]")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
