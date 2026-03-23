#!/usr/bin/env python3
"""
Plan Phase — Config-driven topic planning.

Generates topic queue from knowledge-base using configured article types.
Delegates to existing topic_planner.py or generates from config.

Usage:
    python3 plan.py --config content-factory.config.json
    python3 plan.py --config content-factory.config.json --dry-run
    python3 plan.py --config content-factory.config.json --group CVG
"""

import json
import sys
import os
import subprocess
import argparse
from pathlib import Path
from safe_path import safe_resolve


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_planner(project_root: Path, config: dict, dry_run: bool, group: str = None):
    """Run topic planning using existing project script."""
    planner = project_root / "scripts" / "topic_planner.py"
    if not planner.exists():
        print("❌ scripts/topic_planner.py not found.")
        print("   Creating basic topic plan from knowledge-base...")
        return generate_basic_plan(project_root, config, dry_run, group)

    cmd = ["python3", str(planner)]
    if group:
        cmd.extend(["--group", group])

    print(f"  📋 Running topic planner...")
    print(f"  Article types: {len(config['content']['article_types'])}")
    print(f"  Output: {config['output'].get('queue_dir', 'topics-queue/')}")

    if dry_run:
        cmd.append("--dry-run")

    result = subprocess.run(cmd, cwd=str(project_root))
    return result.returncode == 0


def generate_basic_plan(project_root: Path, config: dict, dry_run: bool, group: str = None):
    """Generate topic plan directly from config when no planner script exists."""
    kb_dir = safe_resolve(project_root, config["output"].get("knowledge_dir", "knowledge-base/"))
    queue_dir = safe_resolve(project_root, config["output"].get("queue_dir", "topics-queue/"))
    index_file = kb_dir / "index.json"

    if not index_file.exists():
        print(f"❌ Knowledge-base index not found: {index_file}")
        print("   Run extract phase first.")
        return False

    with open(index_file, "r", encoding="utf-8") as f:
        index = json.load(f)

    article_types = config["content"]["article_types"]
    topics = []

    entries = index.get("entries", [])
    if group:
        entries = [e for e in entries if e.get("group_code") == group]

    for entry in entries:
        for at in article_types:
            topic_name = entry.get("name", entry.get("disease_name", "Unknown"))
            title = at["title_template"].replace("{topic_name}", topic_name)
            slug = _slugify(title)

            topics.append({
                "title": title,
                "slug": slug,
                "article_type": at["id"],
                "category": at["category"],
                "seo_intent": at.get("seo_intent", "informational"),
                "tags": at.get("tags_base", []),
                "source_entry": entry.get("name", ""),
                "group_code": entry.get("group_code", ""),
                "status": "pending"
            })

    if dry_run:
        print(f"  [DRY RUN] Would generate {len(topics)} topics")
        for t in topics[:5]:
            print(f"    → {t['title'][:60]}...")
        return True

    queue_dir.mkdir(parents=True, exist_ok=True)
    from datetime import datetime
    batch_file = queue_dir / f"batch-{datetime.now().strftime('%Y%m%d-%H%M')}.json"

    batch = {
        "generated_at": datetime.now().isoformat(),
        "total_topics": len(topics),
        "config_niche": config["niche"],
        "topics": topics
    }

    with open(batch_file, "w", encoding="utf-8") as f:
        json.dump(batch, f, ensure_ascii=False, indent=2)

    print(f"  ✅ Generated {len(topics)} topics → {batch_file}")
    return True


def _slugify(text: str, max_len: int = 80) -> str:
    """Convert text to URL slug."""
    import re
    import unicodedata

    # Vietnamese character map
    char_map = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    }

    text = text.lower()
    result = []
    for c in text:
        result.append(char_map.get(c, c))
    text = ''.join(result)

    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text[:max_len]


def main():
    parser = argparse.ArgumentParser(description="Plan Phase — Topic planning")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--group", help="Filter by group code")
    args = parser.parse_args()

    config = load_config(args.config)
    project_root = Path(args.config).resolve().parent

    print(f"📋 PLAN Phase — {len(config['content']['article_types'])} article types")

    success = run_planner(project_root, config, args.dry_run, args.group)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
