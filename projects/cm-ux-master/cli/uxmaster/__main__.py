#!/usr/bin/env python3
"""UX-Master CLI - Entry point."""

import sys
from uxmaster.cli import cli

def main():
    """Main entry point."""
    try:
        cli()
    except KeyboardInterrupt:
        print("\n\n✋ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
