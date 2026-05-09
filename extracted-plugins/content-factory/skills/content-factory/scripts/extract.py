#!/usr/bin/env python3
"""
Extract Phase — Config-driven source material extraction.

Reads source documents and produces structured knowledge-base JSON.
Delegates to the original docx_extractor.py or custom extractors based on config.

Usage:
    python3 extract.py --config content-factory.config.json
    python3 extract.py --config content-factory.config.json --dry-run
    python3 extract.py --config content-factory.config.json --group CVG
"""

import json
import sys
import os
import argparse
import subprocess
from pathlib import Path


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_docx_extractor(project_root: Path, config: dict, dry_run: bool, group: str = None):
    """Run DOCX extraction using existing project script or built-in."""
    extractor = project_root / "scripts" / "docx_extractor.py"
    if not extractor.exists():
        print("❌ scripts/docx_extractor.py not found.")
        print("   This script is required for DOCX source type.")
        return False

    cmd = ["python3", str(extractor)]
    if dry_run:
        cmd.append("--dry-run")
    if group:
        cmd.extend(["--group", group])

    print(f"  📦 Running DOCX extractor...")
    print(f"  Source: {config['sources']['path']}")
    print(f"  Output: {config['output'].get('knowledge_dir', 'knowledge-base/')}")

    result = subprocess.run(cmd, cwd=str(project_root))
    return result.returncode == 0


def run_markdown_extractor(project_root: Path, config: dict, dry_run: bool):
    """Extract knowledge from existing markdown files."""
    source_path = project_root / config["sources"]["path"]
    output_dir = project_root / config["output"].get("knowledge_dir", "knowledge-base/")

    if not source_path.exists():
        print(f"❌ Source path not found: {source_path}")
        return False

    md_files = list(source_path.rglob("*.md"))
    print(f"  📄 Found {len(md_files)} markdown files")

    if dry_run:
        for f in md_files[:10]:
            print(f"    → {f.relative_to(project_root)}")
        if len(md_files) > 10:
            print(f"    ... and {len(md_files) - 10} more")
        return True

    output_dir.mkdir(parents=True, exist_ok=True)

    entries = []
    for md_file in md_files:
        with open(md_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Simple extraction: title from first heading, content summary
        import re
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else md_file.stem

        entries.append({
            "name": title,
            "source_file": str(md_file.relative_to(project_root)),
            "content_preview": content[:500]
        })

    # Write index
    index = {
        "total_entries": len(entries),
        "source_type": "markdown",
        "extracted_at": __import__("datetime").datetime.now().isoformat(),
        "entries": entries
    }

    index_file = output_dir / "index.json"
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"  ✅ Extracted {len(entries)} entries → {index_file}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extract Phase — Source material extraction")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--group", help="Filter by group code")
    args = parser.parse_args()

    config = load_config(args.config)
    project_root = Path(args.config).resolve().parent
    source_type = config["sources"]["type"]

    print(f"📦 EXTRACT Phase — Source type: {source_type}")

    extractors = {
        "docx": lambda: run_docx_extractor(project_root, config, args.dry_run, args.group),
        "markdown": lambda: run_markdown_extractor(project_root, config, args.dry_run),
    }

    extractor = extractors.get(source_type)
    if extractor:
        success = extractor()
    else:
        print(f"⚠️ Source type '{source_type}' — use manual extraction or implement custom extractor")
        print(f"   Supported: {', '.join(extractors.keys())}")
        success = True  # Non-blocking

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
