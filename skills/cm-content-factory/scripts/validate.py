#!/usr/bin/env python3
"""
Validate Phase — Config-driven content quality validation.

Checks content files against configurable quality rules.

Usage:
    python3 validate.py --config content-factory.config.json
    python3 validate.py --config content-factory.config.json --file article.md
"""

import json
import re
import sys
import argparse
from pathlib import Path
from datetime import datetime


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_frontmatter(content: str) -> tuple:
    """Parse YAML frontmatter. Returns (dict|None, body_str)."""
    match = re.match(r'^---\s*\n(.+?)\n---\s*\n(.*)', content, re.DOTALL)
    if not match:
        return None, content

    fm_text = match.group(1)
    body = match.group(2)

    fm = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if value:
                fm[key] = value
    return fm, body


def count_words(text: str) -> int:
    """Count words in text."""
    clean = re.sub(r'#+ ', '', text)
    clean = re.sub(r'\[.*?\]\(.*?\)', '', clean)
    clean = re.sub(r'[*_`~]', '', clean)
    clean = re.sub(r'---', '', clean)
    return len(clean.split())


def validate_article(filepath: Path, config: dict) -> dict:
    """Validate a single article against config rules."""
    content_cfg = config.get("content", {})
    audit_cfg = config.get("audit", {})
    seo_cfg = config.get("seo", {})
    fm_schema = content_cfg.get("frontmatter_schema", {})
    word_limits = content_cfg.get("word_count", {"min": 500, "max": 1200})

    report = {
        "file": filepath.name,
        "slug": filepath.stem,
        "status": "pass",
        "issues": [],
        "warnings": [],
        "stats": {}
    }

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Frontmatter
    fm, body = parse_frontmatter(content)
    if not fm:
        report["issues"].append("Missing YAML frontmatter")
        report["status"] = "fail"
        return report

    for field in fm_schema.get("required", ["title", "slug", "description", "category"]):
        if field not in fm:
            report["issues"].append(f"Missing frontmatter: {field}")

    # SEO checks
    if fm.get("title") and len(fm["title"]) > seo_cfg.get("title_max_length", 60):
        report["warnings"].append(f"Title too long: {len(fm['title'])} chars")
    if fm.get("description") and len(fm["description"]) > seo_cfg.get("description_max_length", 160):
        report["warnings"].append(f"Description too long: {len(fm['description'])} chars")

    # 2. Word count
    wc = count_words(body)
    report["stats"]["word_count"] = wc
    if wc < word_limits.get("min", 500):
        report["issues"].append(f"Too short: {wc} words (min {word_limits['min']})")
        report["status"] = "fail"
    elif wc > word_limits.get("max", 1200) * 1.5:
        report["warnings"].append(f"Very long: {wc} words")

    # 3. Headings
    h2 = len(re.findall(r'^## ', body, re.MULTILINE))
    h3 = len(re.findall(r'^### ', body, re.MULTILINE))
    report["stats"]["h2_count"] = h2
    report["stats"]["h3_count"] = h3
    min_h = audit_cfg.get("min_headings", 3)
    if h2 < min_h:
        report["warnings"].append(f"Low H2 count: {h2} (recommend {min_h}+)")

    # 4. FAQ
    if audit_cfg.get("require_faq", False):
        has_faq = bool(re.search(r'(câu hỏi|faq|hỏi đáp|question)', body, re.IGNORECASE))
        report["stats"]["has_faq"] = has_faq
        if not has_faq:
            report["warnings"].append("No FAQ section")

    # 5. CTA
    if audit_cfg.get("require_cta", False):
        has_cta = bool(re.search(r'(đặt lịch|tư vấn|liên hệ|hotline|contact|book)', body, re.IGNORECASE))
        report["stats"]["has_cta"] = has_cta
        if not has_cta:
            report["warnings"].append("No CTA found")

    # 6. Disclaimer
    if audit_cfg.get("require_disclaimer", False):
        disclaimer = content_cfg.get("disclaimer", "")
        if disclaimer and disclaimer.lower() not in body.lower():
            report["warnings"].append("Missing disclaimer")

    # 7. AI garbage detection
    for pattern in audit_cfg.get("error_patterns", []):
        if re.search(pattern, content, re.IGNORECASE):
            report["issues"].append(f"AI artifact detected: {pattern[:40]}...")
            report["status"] = "fail"
            break

    # Update status
    if report["issues"]:
        report["status"] = "fail"
    elif report["warnings"]:
        report["status"] = "warn"

    return report


def main():
    parser = argparse.ArgumentParser(description="Validate Phase — Quality checks")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--file", help="Validate single file")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--group", help="(unused, for pipeline compat)")
    args = parser.parse_args()

    config = load_config(args.config)
    project_root = Path(args.config).resolve().parent
    content_dir = project_root / config["output"]["content_dir"]

    print(f"✅ VALIDATE Phase")

    if args.file:
        fp = Path(args.file) if Path(args.file).exists() else content_dir / args.file
        report = validate_article(fp, config)
        _print_report(report)
        sys.exit(0 if report["status"] != "fail" else 1)

    if not content_dir.exists():
        print(f"  ❌ Content directory not found: {content_dir}")
        sys.exit(1)

    articles = sorted(content_dir.glob("*.md"))
    if not articles:
        print("  ⚠️ No articles found")
        sys.exit(0)

    print(f"  📄 Validating {len(articles)} articles...")

    reports = []
    for fp in articles:
        report = validate_article(fp, config)
        reports.append(report)
        _print_report(report, compact=True)

    passed = sum(1 for r in reports if r["status"] == "pass")
    warned = sum(1 for r in reports if r["status"] == "warn")
    failed = sum(1 for r in reports if r["status"] == "fail")
    avg_words = sum(r["stats"].get("word_count", 0) for r in reports) / max(len(reports), 1)

    print(f"\n{'=' * 50}")
    print(f"  📊 VALIDATION SUMMARY")
    print(f"{'=' * 50}")
    print(f"  ✅ Pass: {passed}")
    print(f"  ⚠️ Warn: {warned}")
    print(f"  ❌ Fail: {failed}")
    print(f"  📝 Avg words: {avg_words:.0f}")
    print(f"{'=' * 50}")

    # Save report
    report_file = project_root / config["output"].get("reports_dir", ".") / "validation-report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total": len(reports), "passed": passed,
            "warned": warned, "failed": failed,
            "reports": reports
        }, f, ensure_ascii=False, indent=2)


def _print_report(report: dict, compact: bool = False):
    icon = {"pass": "✅", "warn": "⚠️", "fail": "❌"}.get(report["status"], "❓")
    if compact:
        wc = report["stats"].get("word_count", 0)
        print(f"  {icon} {report['file']:50s} ({wc:4d} words)")
    else:
        print(f"\n{icon} {report['file']}")
        for i in report["issues"]:
            print(f"   ❌ {i}")
        for w in report["warnings"]:
            print(f"   ⚠️ {w}")


if __name__ == "__main__":
    main()
