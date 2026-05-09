#!/usr/bin/env python3
"""
SEO Phase — Config-driven SEO extraction and optimization.

Two sub-commands:
  extract: Scan content → CSV with current SEO metadata
  apply:   Read optimized CSV → apply changes back to files

Usage:
    python3 seo.py --config content-factory.config.json extract
    python3 seo.py --config content-factory.config.json apply
    python3 seo.py --config content-factory.config.json apply --dry-run
"""

import json
import sys
import subprocess
import argparse
from pathlib import Path


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_seo_extract(project_root: Path, config: dict, dry_run: bool):
    """Run SEO metadata extraction."""
    extractor = project_root / "scripts" / "seo_extract.py"
    if not extractor.exists():
        print("  ⚠️ scripts/seo_extract.py not found.")
        return False

    if dry_run:
        print(f"  [DRY RUN] Would extract SEO data from: {config['output']['content_dir']}")
        return True

    print(f"  🔎 Extracting SEO metadata...")
    result = subprocess.run(["python3", str(extractor)], cwd=str(project_root))
    return result.returncode == 0


def run_seo_apply(project_root: Path, config: dict, dry_run: bool):
    """Apply SEO optimizations from CSV."""
    applier = project_root / "scripts" / "seo_apply.py"
    if not applier.exists():
        print("  ⚠️ scripts/seo_apply.py not found.")
        return False

    cmd = ["python3", str(applier)]
    if dry_run:
        cmd.append("--dry-run")

    print(f"  📝 Applying SEO changes...")
    result = subprocess.run(cmd, cwd=str(project_root))
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="SEO Phase — Extract & Apply")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("action", nargs="?", default="extract",
                        choices=["extract", "apply", "both"],
                        help="Action: extract, apply, or both")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--group", help="(unused, for pipeline compat)")
    args = parser.parse_args()

    config = load_config(args.config)
    project_root = Path(args.config).resolve().parent

    print(f"🔎 SEO Phase — Action: {args.action}")

    success = True
    if args.action in ("extract", "both"):
        success = run_seo_extract(project_root, config, args.dry_run) and success

    if args.action in ("apply", "both"):
        success = run_seo_apply(project_root, config, args.dry_run) and success

    if args.action == "extract" and success and not args.dry_run:
        csv_path = project_root / "scripts" / "seo_data.csv"
        print(f"\n  💡 Next: Optimize {csv_path}")
        print(f"     Then run: python3 seo.py --config {args.config} apply")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
