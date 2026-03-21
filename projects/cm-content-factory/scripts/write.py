#!/usr/bin/env python3
"""
Write Phase — Config-driven AI content generation.

Generates articles from topic queue using prompt templates and knowledge context.
Delegates to existing content_writer.py or runs standalone.

Usage:
    python3 write.py --config content-factory.config.json --batch 10
    python3 write.py --config content-factory.config.json --batch 50 --concurrency 3
    python3 write.py --config content-factory.config.json --group TTN
    python3 write.py --config content-factory.config.json --dry-run
"""

import json
import sys
import subprocess
import argparse
from pathlib import Path


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_writer(project_root: Path, config: dict, batch: int, concurrency: int,
               dry_run: bool, group: str = None, topic_type: str = None):
    """Run content writing using existing project script."""
    writer = project_root / "scripts" / "content_writer.py"
    if not writer.exists():
        print("❌ scripts/content_writer.py not found.")
        print("   This script is required for the WRITE phase.")
        return False

    pipeline_cfg = config.get("pipeline", {})
    effective_concurrency = concurrency or pipeline_cfg.get("concurrency", 1)

    cmd = [
        "python3", str(writer),
        "--batch", str(batch),
        "--concurrency", str(effective_concurrency),
    ]

    if dry_run:
        cmd.append("--dry-run")
    if group:
        cmd.extend(["--group", group])
    if topic_type:
        cmd.extend(["--topic-type", topic_type])

    print(f"  ✍️ Running content writer...")
    print(f"  Batch: {batch} articles")
    print(f"  Concurrency: {effective_concurrency}")
    print(f"  AI Provider: {pipeline_cfg.get('ai_provider', 'gemini-cli')}")
    print(f"  Output: {config['output']['content_dir']}")

    result = subprocess.run(cmd, cwd=str(project_root))

    # Auto-validate if configured
    if result.returncode == 0 and not dry_run and pipeline_cfg.get("auto_validate", True):
        print("\n  🔍 Auto-validating generated content...")
        validator = project_root / "scripts" / "content_validator.py"
        if validator.exists():
            subprocess.run(["python3", str(validator)], cwd=str(project_root))

    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Write Phase — AI content generation")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--batch", type=int, default=10, help="Number of articles to write")
    parser.add_argument("--concurrency", type=int, default=0, help="Parallel workers (0=use config)")
    parser.add_argument("--group", help="Filter by group code")
    parser.add_argument("--topic-type", help="Filter by article type")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    config = load_config(args.config)
    project_root = Path(args.config).resolve().parent

    print(f"✍️ WRITE Phase — Batch: {args.batch}")

    success = run_writer(
        project_root, config, args.batch, args.concurrency,
        args.dry_run, args.group, args.topic_type
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
