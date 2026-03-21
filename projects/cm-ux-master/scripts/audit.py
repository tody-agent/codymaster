#!/usr/bin/env python3
"""
Audit Phase — Config-driven content audit + auto-fix.

Scans all content files for errors, generates audit report,
and optionally auto-fixes broken content using AI regeneration.

Usage:
    python3 audit.py --config content-factory.config.json              # Audit only
    python3 audit.py --config content-factory.config.json --fix        # Audit + fix
    python3 audit.py --config content-factory.config.json --fix --batch 10
    python3 audit.py --config content-factory.config.json --dry-run
"""

import json
import sys
import subprocess
import argparse
from pathlib import Path


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_audit(project_root: Path, config: dict, dry_run: bool):
    """Run content audit using existing blog_auditor.py."""
    auditor = project_root / "scripts" / "blog_auditor.py"
    if not auditor.exists():
        print("  ⚠️ scripts/blog_auditor.py not found, using basic validator...")
        validator = project_root / "scripts" / "content_validator.py"
        if validator.exists():
            cmd = ["python3", str(validator)]
            result = subprocess.run(cmd, cwd=str(project_root))
            return result.returncode == 0
        print("  ❌ No audit/validator script found.")
        return False

    cmd = ["python3", str(auditor)]
    if dry_run:
        print(f"  [DRY RUN] Would run: {' '.join(cmd)}")
        return True

    print(f"  🔍 Running content audit...")
    print(f"  Scanning: {config['output']['content_dir']}")

    result = subprocess.run(cmd, cwd=str(project_root))
    return result.returncode == 0


def run_fix(project_root: Path, config: dict, batch: int, dry_run: bool, concurrency: int = 3):
    """Run content fix using existing blog_fixer.py."""
    fixer = project_root / "scripts" / "blog_fixer.py"
    if not fixer.exists():
        print("  ⚠️ scripts/blog_fixer.py not found.")
        return False

    cmd = ["python3", str(fixer), "--batch", str(batch), "--concurrency", str(concurrency)]
    if dry_run:
        cmd.append("--dry-run")

    print(f"  🔧 Running content fixer (batch={batch}, concurrency={concurrency})...")

    result = subprocess.run(cmd, cwd=str(project_root))
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Audit Phase — Content audit + fix")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--fix", action="store_true", help="Auto-fix broken files after audit")
    parser.add_argument("--batch", type=int, default=20, help="Max files to fix")
    parser.add_argument("--concurrency", type=int, default=3, help="Parallel fix workers")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--group", help="(unused, for pipeline compat)")
    args = parser.parse_args()

    config = load_config(args.config)
    project_root = Path(args.config).resolve().parent

    print(f"🔍 AUDIT Phase")

    # Step 1: Audit
    audit_ok = run_audit(project_root, config, args.dry_run)

    # Step 2: Fix (if requested)
    if args.fix and audit_ok:
        report_file = project_root / "audit-report.json"
        if report_file.exists():
            with open(report_file) as f:
                report = json.load(f)
            fixable = report.get("summary", {}).get("total_fixable", 0)
            if fixable > 0:
                print(f"\n  📊 Found {fixable} fixable files")
                run_fix(project_root, config, args.batch, args.dry_run, args.concurrency)
            else:
                print("  ✅ No fixable issues found")
        else:
            print("  ⚠️ No audit report found. Run audit first without --fix.")

    sys.exit(0 if audit_ok else 1)


if __name__ == "__main__":
    main()
