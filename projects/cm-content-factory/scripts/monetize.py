#!/usr/bin/env python3
"""
Monetization Scorer — Score content by commercial potential.

Analyzes articles and topics for monetization potential:
  - Commercial intent score
  - Conversion potential
  - CTA recommendations
  - Revenue-priority topic ranking

Usage:
    python3 monetize.py --config content-factory.config.json --score-all
    python3 monetize.py --config content-factory.config.json --score article.md
    python3 monetize.py --config content-factory.config.json --priority-queue
"""

import json
import sys
import re
import argparse
from pathlib import Path
from datetime import datetime
from safe_path import safe_resolve


# Commercial intent signals
COMMERCIAL_KEYWORDS_VI = [
    "giá", "bao nhiêu", "mua", "đặt lịch", "dịch vụ", "chi phí",
    "khuyến mãi", "ưu đãi", "trị liệu", "phác đồ", "liệu trình"
]

COMMERCIAL_KEYWORDS_EN = [
    "price", "cost", "buy", "book", "service", "deal",
    "discount", "treatment", "program", "plan", "subscription"
]

TRANSACTIONAL_CATEGORIES = ["phac-do", "chan-dung", "reviews", "programs"]

CTA_TEMPLATES = {
    "vi": {
        "soft": "👉 Tìm hiểu thêm về dịch vụ {service} tại {brand}",
        "medium": "📞 Đặt lịch tư vấn miễn phí: {hotline}",
        "hard": "🎁 Ưu đãi đặc biệt: Giảm 20% cho lần đầu trải nghiệm. Đặt lịch ngay!",
        "educational": "📚 Xem thêm bài viết về {topic} tại {brand}"
    },
    "en": {
        "soft": "👉 Learn more about {service} at {brand}",
        "medium": "📞 Book a free consultation: {hotline}",
        "hard": "🎁 Special offer: 20% off your first session. Book now!",
        "educational": "📚 Read more about {topic} at {brand}"
    }
}


class MonetizationScorer:
    """Score content by commercial and conversion potential."""

    def __init__(self, config_path: str):
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.project_root = Path(config_path).resolve().parent
        self.language = self.config.get("brand", {}).get("language", "vi")

    def score_article(self, filepath: Path) -> dict:
        """Score a single article for monetization potential."""
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse frontmatter
        fm = self._parse_frontmatter(content)
        body = self._get_body(content)

        score = {
            "file": filepath.name,
            "slug": filepath.stem,
            "category": fm.get("category", "unknown"),
            "scores": {
                "commercial_intent": 0,
                "conversion_potential": 0,
                "topic_demand": 0,
                "content_quality": 0
            },
            "total": 0,
            "cta_recommendation": "",
            "monetization_notes": []
        }

        # 1. Commercial intent (0-30)
        keywords = COMMERCIAL_KEYWORDS_VI if self.language == "vi" else COMMERCIAL_KEYWORDS_EN
        keyword_hits = sum(1 for kw in keywords if kw.lower() in body.lower())
        score["scores"]["commercial_intent"] = min(30, keyword_hits * 5)

        # Transactional category bonus
        if fm.get("category", "") in TRANSACTIONAL_CATEGORIES:
            score["scores"]["commercial_intent"] = min(30, score["scores"]["commercial_intent"] + 10)

        # 2. Conversion potential (0-30)
        has_cta = bool(re.search(r'(đặt lịch|tư vấn|liên hệ|book|contact|call)', body, re.IGNORECASE))
        has_pricing = bool(re.search(r'(giá|chi phí|price|cost|\d+\.?\d*\s*(vnđ|đ|\$|usd))', body, re.IGNORECASE))
        has_faq = bool(re.search(r'(câu hỏi|faq|q&a)', body, re.IGNORECASE))

        score["scores"]["conversion_potential"] = (
            (10 if has_cta else 0) +
            (10 if has_pricing else 0) +
            (10 if has_faq else 0)
        )

        # 3. Topic demand (0-20) — based on title keyword
        title = fm.get("title", filepath.stem)
        high_demand = ["đau", "mất ngủ", "stress", "giảm cân", "đau lưng", "cổ vai gáy",
                       "pain", "sleep", "weight", "back", "neck"]
        demand_hits = sum(1 for kw in high_demand if kw.lower() in title.lower())
        score["scores"]["topic_demand"] = min(20, demand_hits * 10)

        # 4. Content quality signals (0-20)
        words = len(body.split())
        h2_count = len(re.findall(r'^## ', body, re.MULTILINE))
        score["scores"]["content_quality"] = (
            (5 if words >= 500 else 0) +
            (5 if words >= 800 else 0) +
            (5 if h2_count >= 3 else 0) +
            (5 if has_faq else 0)
        )

        # Total
        score["total"] = sum(score["scores"].values())

        # CTA recommendation
        templates = CTA_TEMPLATES.get(self.language, CTA_TEMPLATES["vi"])
        if score["total"] >= 60:
            score["cta_recommendation"] = "hard"
        elif score["total"] >= 35:
            score["cta_recommendation"] = "medium"
        elif score["scores"]["commercial_intent"] > 0:
            score["cta_recommendation"] = "soft"
        else:
            score["cta_recommendation"] = "educational"

        score["suggested_cta"] = templates.get(score["cta_recommendation"], "")

        # Notes
        if not has_cta:
            score["monetization_notes"].append("Missing CTA — add a booking/contact link")
        if score["scores"]["commercial_intent"] == 0:
            score["monetization_notes"].append("Low commercial intent — add service mentions")
        if score["total"] >= 50:
            score["monetization_notes"].append("🔥 High monetization potential!")

        return score

    def score_all(self) -> list:
        """Score all articles for monetization."""
        content_dir = safe_resolve(self.project_root, self.config["output"]["content_dir"])
        if not content_dir.exists():
            return []

        articles = sorted(content_dir.glob("*.md"))
        scores = [self.score_article(a) for a in articles]
        return sorted(scores, key=lambda s: s["total"], reverse=True)

    def priority_queue(self) -> list:
        """Generate monetization-priority writing queue."""
        scores = self.score_all()

        # Identify high-potential articles needing improvement
        needs_work = [s for s in scores if s["total"] >= 30 and s["monetization_notes"]]
        already_good = [s for s in scores if s["total"] >= 60]
        low_potential = [s for s in scores if s["total"] < 30]

        return {
            "hot": [s["slug"] for s in already_good[:10]],
            "optimize": [{"slug": s["slug"], "notes": s["monetization_notes"]} for s in needs_work[:10]],
            "low_priority": len(low_potential),
            "avg_score": sum(s["total"] for s in scores) / max(len(scores), 1)
        }

    def _parse_frontmatter(self, content: str) -> dict:
        match = re.match(r'^---\s*\n(.+?)\n---', content, re.DOTALL)
        if not match:
            return {}
        fm = {}
        for line in match.group(1).split('\n'):
            if ':' in line:
                key, _, val = line.partition(':')
                fm[key.strip()] = val.strip().strip('"').strip("'")
        return fm

    def _get_body(self, content: str) -> str:
        match = re.match(r'^---\s*\n.+?\n---\s*\n(.*)', content, re.DOTALL)
        return match.group(1) if match else content


def main():
    parser = argparse.ArgumentParser(description="Monetization Scorer")
    parser.add_argument("--config", required=True)
    parser.add_argument("--score", help="Score single article")
    parser.add_argument("--score-all", action="store_true")
    parser.add_argument("--priority-queue", action="store_true")
    args = parser.parse_args()

    scorer = MonetizationScorer(args.config)

    if args.score:
        fp = Path(args.score)
        if not fp.exists():
            fp = safe_resolve(scorer.project_root, str(Path(scorer.config["output"]["content_dir"]) / args.score))
        result = scorer.score_article(fp)
        print(f"\n💰 {result['slug']}: {result['total']}/100")
        for k, v in result["scores"].items():
            print(f"  {k}: {v}")
        print(f"  CTA: {result['cta_recommendation']}")
        for note in result["monetization_notes"]:
            print(f"  📝 {note}")

    elif args.score_all:
        scores = scorer.score_all()
        print(f"\n{'═' * 60}")
        print(f"  💰 MONETIZATION SCORES ({len(scores)} articles)")
        print(f"{'═' * 60}")
        for s in scores[:20]:
            bar = "█" * (s["total"] // 5) + "░" * (20 - s["total"] // 5)
            print(f"  {s['total']:3d} {bar} {s['slug'][:40]}")
        avg = sum(s["total"] for s in scores) / max(len(scores), 1)
        print(f"\n  Average: {avg:.0f}/100")

    elif args.priority_queue:
        queue = scorer.priority_queue()
        print(f"\n🔥 HOT (ready to monetize): {len(queue['hot'])}")
        for slug in queue["hot"]:
            print(f"    → {slug}")
        print(f"\n⚡ OPTIMIZE (needs CTA/improvements): {len(queue['optimize'])}")
        for item in queue["optimize"]:
            print(f"    → {item['slug']}: {', '.join(item['notes'][:2])}")
        print(f"\n📉 Low priority: {queue['low_priority']} articles")
        print(f"   Average score: {queue['avg_score']:.0f}/100")


if __name__ == "__main__":
    main()
