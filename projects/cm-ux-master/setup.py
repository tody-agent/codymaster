#!/usr/bin/env python3
"""
UX Master Setup Script

One-command setup for Harvester v4.
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, description):
    """Run shell command with error handling."""
    print(f"\n📦 {description}...")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✓ {description} complete")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Setup UX Master."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   UX Master v4.0 Setup                                        ║
║   Design System Intelligence Platform                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
""")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("✗ Python 3.8+ required")
        sys.exit(1)
    
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Install Python dependencies
    deps = [
        "playwright",
        "asyncio",
    ]
    
    for dep in deps:
        if not run_command(f"pip install {dep}", f"Installing {dep}"):
            print(f"Warning: Failed to install {dep}")
    
    # Install Playwright browsers
    run_command("playwright install chromium", "Installing Chromium browser")
    
    # Make scripts executable
    scripts_dir = Path(__file__).parent / "scripts"
    for script in ["wizard.py", "harvester_cli.py"]:
        script_path = scripts_dir / script
        if script_path.exists():
            script_path.chmod(0o755)
    
    # Make quick-start executable
    quick_start = Path(__file__).parent / "templates" / "quick-start.sh"
    if quick_start.exists():
        quick_start.chmod(0o755)
    
    print("""
╔═══════════════════════════════════════════════════════════════╗
║                    ✓ Setup Complete!                          ║
╚═══════════════════════════════════════════════════════════════╝

Quick Start:
  python scripts/wizard.py --url https://example.com

Or use the quick-start script:
  ./templates/quick-start.sh https://example.com

Documentation:
  docs/FOR-DESIGNERS.md
  docs/FOR-PRODUCT-MANAGERS.md
  docs/FOR-DEVELOPERS.md

Happy extracting! 🚀
""")

if __name__ == "__main__":
    main()
