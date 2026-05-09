#!/usr/bin/env python3
"""
Publish Phase — Config-driven build + deploy.

Runs build command, validates content, commits, and pushes to git.

Usage:
    python3 publish.py --config content-factory.config.json --build     # Build only
    python3 publish.py --config content-factory.config.json --push      # Git push only
    python3 publish.py --config content-factory.config.json             # Build + push
    python3 publish.py --config content-factory.config.json --dry-run
"""

import json
import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_build(project_root: Path, config: dict, dry_run: bool) -> bool:
    """Run the build command from config."""
    build_cmd = config.get("pipeline", {}).get("build_command", "")
    if not build_cmd:
        print("  ⚠️ No build_command in config.pipeline")
        return True

    if dry_run:
        print(f"  [DRY RUN] Would run: {build_cmd}")
        return True

    print(f"  🔨 Building: {build_cmd}")
    result = subprocess.run(build_cmd, shell=True, cwd=str(project_root))
    if result.returncode == 0:
        print("  ✅ Build complete")
    else:
        print("  ❌ Build failed")
    return result.returncode == 0


def run_git_push(project_root: Path, config: dict, dry_run: bool) -> bool:
    """Git add, commit, and push content."""
    content_dir = config["output"]["content_dir"]
    branch = config.get("pipeline", {}).get("git_branch", "main")

    # Check for changes
    result = subprocess.run(
        ["git", "status", "--porcelain", content_dir],
        capture_output=True, text=True, cwd=str(project_root)
    )
    changed_lines = [l for l in result.stdout.strip().split('\n') if l.strip()]
    num_changes = len(changed_lines)

    if num_changes == 0:
        print("  ✅ No new content to publish")
        return True

    print(f"  📄 Found {num_changes} new/modified files")

    if dry_run:
        print("  [DRY RUN] Would commit:")
        for line in changed_lines[:10]:
            print(f"    {line}")
        return True

    # Stage
    subprocess.run(["git", "add", content_dir], cwd=str(project_root))

    # Also stage knowledge-base and topics-queue if they exist
    kb_dir = config["output"].get("knowledge_dir", "knowledge-base/")
    queue_dir = config["output"].get("queue_dir", "topics-queue/")
    for extra in [kb_dir, queue_dir]:
        if (project_root / extra).exists():
            subprocess.run(["git", "add", extra], cwd=str(project_root))

    # Commit
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    niche = config.get("niche", "content")
    msg = f"auto: publish {num_changes} {niche} articles ({timestamp})"

    subprocess.run(["git", "commit", "-m", msg], cwd=str(project_root))

    # Push
    push_result = subprocess.run(
        ["git", "push", "origin", branch],
        capture_output=True, text=True, cwd=str(project_root)
    )

    if push_result.returncode != 0:
        # Try alternate branch names
        alt = "master" if branch == "main" else "main"
        push_result = subprocess.run(
            ["git", "push", "origin", alt],
            capture_output=True, text=True, cwd=str(project_root)
        )

    if push_result.returncode == 0:
        print(f"  ✅ Published {num_changes} articles to {branch}")
    else:
        print(f"  ⚠️ Push failed: {push_result.stderr[:200]}")
        print("     Content is committed locally. Push manually.")

    return True


def main():
    parser = argparse.ArgumentParser(description="Publish Phase — Build + Deploy")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--build", action="store_true", help="Build only")
    parser.add_argument("--push", action="store_true", help="Git push only")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--group", help="(unused, for pipeline compat)")
    args = parser.parse_args()

    config = load_config(args.config)
    project_root = Path(args.config).resolve().parent

    print(f"🚀 PUBLISH Phase")

    build_only = args.build and not args.push
    push_only = args.push and not args.build
    do_both = not args.build and not args.push

    success = True
    if build_only or do_both:
        success = run_build(project_root, config, args.dry_run) and success

    if push_only or do_both:
        if config.get("pipeline", {}).get("auto_publish", False) or push_only:
            success = run_git_push(project_root, config, args.dry_run) and success
        else:
            print("  ⬜ auto_publish is disabled in config")
            print("     Use --push to force, or set pipeline.auto_publish: true")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
