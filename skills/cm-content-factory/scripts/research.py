#!/usr/bin/env python3
"""
Research Engine — Auto-research any topic for the content factory.

Capabilities:
  1. Web search for topic keywords
  2. Competitor content analysis (scrape top SERP results)
  3. Knowledge synthesis → structured JSON
  4. Auto-save to memory/semantic/niche_knowledge.json

Usage:
    python3 research.py --config content-factory.config.json --topic "fitness recovery"
    python3 research.py --config content-factory.config.json --topic "bấm huyệt đau lưng" --depth deep
    python3 research.py --config content-factory.config.json --competitor https://example.com
    python3 research.py --config content-factory.config.json --gap-scan
"""

import json
import sys
import re
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

# Import memory engine if available
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
try:
    from memory import MemoryEngine
except ImportError:
    MemoryEngine = None


class ResearchEngine:
    """Auto-research engine for discovering and synthesizing knowledge."""

    def __init__(self, config_path: str):
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.config_path = config_path
        self.project_root = Path(config_path).resolve().parent
        self.research_cfg = self.config.get("research", {})
        self.memory = MemoryEngine(config_path) if MemoryEngine else None

    def research_topic(self, topic: str, depth: str = "standard") -> dict:
        """Research a topic using web search and synthesis.

        Args:
            topic: The topic to research
            depth: "quick" (3 sources), "standard" (5), "deep" (10)

        Returns:
            Structured knowledge dict
        """
        max_sources = {"quick": 3, "standard": 5, "deep": 10}.get(depth, 5)
        max_sources = min(max_sources, self.research_cfg.get("max_sources_per_topic", 10))

        print(f"  🔍 Researching: {topic} (depth: {depth}, max sources: {max_sources})")

        knowledge = {
            "topic": topic,
            "researched_at": datetime.now().isoformat(),
            "depth": depth,
            "sources": [],
            "key_points": [],
            "subtopics": [],
            "competitor_insights": [],
            "content_angles": [],
            "keywords": [],
            "questions_people_ask": []
        }

        # Step 1: Generate search queries
        queries = self._generate_queries(topic)
        print(f"  📋 Generated {len(queries)} search queries")

        # Step 2: Search and extract
        for query in queries[:max_sources]:
            result = self._search_web(query)
            if result:
                knowledge["sources"].append(result)

        # Step 3: Extract key points from sources
        knowledge["key_points"] = self._extract_key_points(knowledge["sources"])

        # Step 4: Generate content angles
        knowledge["content_angles"] = self._suggest_content_angles(topic, knowledge["key_points"])

        # Step 5: Save to memory
        if self.memory:
            self.memory.add_niche_knowledge(topic, {
                "topics": {topic: knowledge},
                "sources": [s.get("url", "") for s in knowledge["sources"]]
            })
            print(f"  💾 Saved to memory/semantic/niche_knowledge.json")

        # Save as standalone research file
        research_dir = self.project_root / "memory" / "research"
        research_dir.mkdir(parents=True, exist_ok=True)
        slug = re.sub(r'[^a-z0-9]+', '-', topic.lower())[:50]
        research_file = research_dir / f"{slug}.json"
        with open(research_file, "w", encoding="utf-8") as f:
            json.dump(knowledge, f, ensure_ascii=False, indent=2)
        print(f"  📄 Research saved: {research_file.relative_to(self.project_root)}")

        return knowledge

    def analyze_competitor(self, url: str) -> dict:
        """Analyze a competitor's content structure."""
        print(f"  🔎 Analyzing competitor: {url}")

        analysis = {
            "url": url,
            "analyzed_at": datetime.now().isoformat(),
            "content_structure": {},
            "topics_covered": [],
            "missing_from_us": [],
            "their_strengths": [],
            "our_advantages": []
        }

        # Try to extract page content
        content = self._fetch_url(url)
        if content:
            analysis["content_structure"] = self._analyze_structure(content)
            analysis["topics_covered"] = self._extract_topics(content)

            # Compare with our content
            our_content = self._get_our_content_inventory()
            their_topics = set(t.lower() for t in analysis["topics_covered"])
            our_topics = set(t.lower() for t in our_content)
            analysis["missing_from_us"] = list(their_topics - our_topics)

        return analysis

    def scan_content_gaps(self) -> list:
        """Scan for content gaps — topics we should cover but don't."""
        print(f"  🕳️ Scanning for content gaps...")

        # Get our current content inventory
        our_topics = self._get_our_content_inventory()
        print(f"  📄 Our inventory: {len(our_topics)} articles")

        # Get competitor URLs from config
        competitor_urls = self.research_cfg.get("competitor_urls", [])

        gaps = []
        for url in competitor_urls:
            analysis = self.analyze_competitor(url)
            for missing in analysis.get("missing_from_us", []):
                gaps.append({
                    "topic": missing,
                    "found_at": url,
                    "priority": "medium",
                    "estimated_difficulty": "medium"
                })

        # Also check knowledge base for unwritten topics
        kb_dir = self.project_root / self.config["output"].get("knowledge_dir", "knowledge-base/")
        if kb_dir.exists():
            for group_dir in kb_dir.iterdir():
                if not group_dir.is_dir():
                    continue
                for json_file in group_dir.glob("*.json"):
                    with open(json_file) as f:
                        data = json.load(f)
                    disease_name = data.get("disease_name", json_file.stem)
                    if disease_name.lower() not in [t.lower() for t in our_topics]:
                        gaps.append({
                            "topic": disease_name,
                            "found_at": "knowledge-base",
                            "priority": "high",
                            "estimated_difficulty": "low"
                        })

        print(f"  🕳️ Found {len(gaps)} content gaps")

        # Save gap analysis
        gap_file = self.project_root / "content-gaps.json"
        with open(gap_file, "w", encoding="utf-8") as f:
            json.dump({
                "scanned_at": datetime.now().isoformat(),
                "total_gaps": len(gaps),
                "gaps": gaps
            }, f, ensure_ascii=False, indent=2)

        return gaps

    # ──────────────────────────────────────────────
    # Internal methods
    # ──────────────────────────────────────────────

    def _generate_queries(self, topic: str) -> list:
        """Generate search queries from topic."""
        lang = self.config.get("brand", {}).get("language", "vi")
        niche = self.config.get("niche", "")

        queries = [topic]

        if lang == "vi":
            queries.extend([
                f"{topic} là gì",
                f"cách điều trị {topic}",
                f"{topic} triệu chứng nguyên nhân",
                f"{topic} bấm huyệt" if "medspa" in niche else f"{topic} hướng dẫn",
            ])
        else:
            queries.extend([
                f"what is {topic}",
                f"{topic} complete guide",
                f"{topic} symptoms causes treatment",
                f"best {topic} tips",
            ])

        return queries

    def _search_web(self, query: str) -> dict:
        """Search web for a query. Returns structured result."""
        # Use curl for basic URL fetching, or delegate to browser tool
        # This is a lightweight fallback — full research uses the AI agent's search
        return {
            "query": query,
            "searched_at": datetime.now().isoformat(),
            "method": "pending_ai_search",
            "note": "Full search requires AI agent context. Use /research workflow."
        }

    def _fetch_url(self, url: str) -> str:
        """Fetch URL content."""
        try:
            result = subprocess.run(
                ["curl", "-s", "-L", "--max-time", "10", url],
                capture_output=True, text=True, timeout=15
            )
            return result.stdout[:50000] if result.returncode == 0 else ""
        except Exception:
            return ""

    def _analyze_structure(self, html: str) -> dict:
        """Extract content structure from HTML."""
        h1 = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        h2 = re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.IGNORECASE | re.DOTALL)
        h3 = re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.IGNORECASE | re.DOTALL)

        # Clean HTML tags from headings
        clean = lambda items: [re.sub(r'<[^>]+>', '', i).strip() for i in items]

        return {
            "h1": clean(h1),
            "h2": clean(h2)[:20],
            "h3": clean(h3)[:30],
            "word_count_estimate": len(html.split()) // 3  # rough estimate
        }

    def _extract_topics(self, html: str) -> list:
        """Extract topic names from HTML content."""
        h2 = re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.IGNORECASE | re.DOTALL)
        return [re.sub(r'<[^>]+>', '', h).strip() for h in h2[:30]]

    def _extract_key_points(self, sources: list) -> list:
        """Extract key points from research sources."""
        return [f"Source: {s.get('query', 'unknown')}" for s in sources if s]

    def _suggest_content_angles(self, topic: str, key_points: list) -> list:
        """Suggest content angles based on research."""
        article_types = self.config.get("content", {}).get("article_types", [])
        return [
            {
                "type": at["id"],
                "title": at["title_template"].replace("{topic_name}", topic),
                "angle": at.get("seo_intent", "informational")
            }
            for at in article_types
        ]

    def _get_our_content_inventory(self) -> list:
        """Get list of our published content titles."""
        content_dir = self.project_root / self.config["output"]["content_dir"]
        titles = []

        if content_dir.exists():
            for md in content_dir.glob("*.md"):
                with open(md, "r", encoding="utf-8") as f:
                    content = f.read(500)
                match = re.search(r'title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
                if match:
                    titles.append(match.group(1).strip())
                else:
                    titles.append(md.stem)

        return titles


def main():
    parser = argparse.ArgumentParser(description="Research Engine — Auto-research topics")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--topic", help="Topic to research")
    parser.add_argument("--depth", default="standard", choices=["quick", "standard", "deep"])
    parser.add_argument("--competitor", help="Competitor URL to analyze")
    parser.add_argument("--gap-scan", action="store_true", help="Scan for content gaps")
    args = parser.parse_args()

    engine = ResearchEngine(args.config)

    if args.topic:
        print(f"🔬 RESEARCH Mode — Topic: {args.topic}")
        result = engine.research_topic(args.topic, args.depth)
        print(f"\n  📊 Results:")
        print(f"    Sources: {len(result['sources'])}")
        print(f"    Key points: {len(result['key_points'])}")
        print(f"    Content angles: {len(result['content_angles'])}")
        for angle in result["content_angles"]:
            print(f"      → {angle['title'][:60]}...")

    elif args.competitor:
        print(f"🔎 COMPETITOR Analysis")
        result = engine.analyze_competitor(args.competitor)
        print(f"\n  Topics covered: {len(result.get('topics_covered', []))}")
        print(f"  Missing from us: {len(result.get('missing_from_us', []))}")

    elif args.gap_scan:
        print(f"🕳️ CONTENT GAP Scan")
        gaps = engine.scan_content_gaps()
        high = [g for g in gaps if g["priority"] == "high"]
        print(f"\n  Total gaps: {len(gaps)}")
        print(f"  High priority: {len(high)}")
        for g in high[:10]:
            print(f"    → {g['topic']} (from: {g['found_at']})")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
