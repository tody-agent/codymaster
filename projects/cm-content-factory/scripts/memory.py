#!/usr/bin/env python3
"""
Memory Engine — 3-layer memory system for self-learning content factory.

Architecture:
  1. Semantic Memory — Long-term patterns, rules, writing style (persistent)
  2. Episodic Memory — Per-session experiences with outcomes (time-bounded)
  3. Working Memory — Current session context (ephemeral)

Usage:
    python3 memory.py --config content-factory.config.json --status
    python3 memory.py --config content-factory.config.json --learn
    python3 memory.py --config content-factory.config.json --test
"""

import json
import sys
import os
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from safe_path import safe_resolve


MEMORY_SCHEMA = {
    "semantic": {
        "writing_patterns.json": {
            "description": "Accumulated writing style preferences",
            "patterns": {},
            "style_preferences": {
                "tone": [],
                "sentence_length": "medium",
                "paragraph_style": "concise",
                "heading_style": "question-based",
                "cta_style": "soft"
            },
            "updated_at": None
        },
        "seo_patterns.json": {
            "description": "SEO rules proven effective",
            "patterns": {},
            "effective_titles": [],
            "effective_descriptions": [],
            "keyword_strategies": [],
            "updated_at": None
        },
        "niche_knowledge.json": {
            "description": "Domain knowledge accumulated from research",
            "domains": {},
            "sources": [],
            "confidence_scores": {},
            "updated_at": None
        },
        "mistakes.json": {
            "description": "Anti-patterns learned from user corrections",
            "patterns": {},
            "common_errors": [],
            "deleted_content_reasons": [],
            "updated_at": None
        }
    },
    "episodic": {},
    "working": {
        "current_session.json": {
            "session_id": None,
            "started_at": None,
            "phase": None,
            "articles_processed": 0,
            "errors": [],
            "notes": []
        }
    }
}


class MemoryEngine:
    """Three-layer memory system for the content factory."""

    def __init__(self, config_path: str):
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.project_root = Path(config_path).resolve().parent
        mem_cfg = self.config.get("memory", {})
        self.memory_dir = safe_resolve(self.project_root, mem_cfg.get("memory_dir", "memory"))
        self.auto_learn = mem_cfg.get("auto_learn", True)
        self.max_episodic_days = mem_cfg.get("max_episodic_days", 90)

        # Ensure directory structure
        self._init_dirs()

    def _init_dirs(self):
        """Create memory directory structure if not exists."""
        for subdir in ["semantic", "episodic", "working"]:
            (self.memory_dir / subdir).mkdir(parents=True, exist_ok=True)

        # Initialize semantic files if missing
        for filename, schema in MEMORY_SCHEMA["semantic"].items():
            filepath = self.memory_dir / "semantic" / filename
            if not filepath.exists():
                data = dict(schema)
                data["updated_at"] = datetime.now().isoformat()
                self._save_json(filepath, data)

        # Initialize working memory
        working_file = self.memory_dir / "working" / "current_session.json"
        if not working_file.exists():
            self._save_json(working_file, MEMORY_SCHEMA["working"]["current_session.json"])

    # ──────────────────────────────────────────────
    # SEMANTIC MEMORY — Long-term patterns & rules
    # ──────────────────────────────────────────────

    def load_semantic(self, category: str) -> dict:
        """Load a semantic memory file."""
        filepath = self.memory_dir / "semantic" / f"{category}.json"
        if filepath.exists():
            return self._load_json(filepath)
        return {}

    def save_semantic(self, category: str, data: dict):
        """Save to semantic memory."""
        data["updated_at"] = datetime.now().isoformat()
        filepath = self.memory_dir / "semantic" / f"{category}.json"
        self._save_json(filepath, data)

    def add_writing_pattern(self, pattern_id: str, pattern: dict):
        """Add or update a writing pattern."""
        data = self.load_semantic("writing_patterns")
        patterns = data.get("patterns", {})

        if pattern_id in patterns:
            # Update confidence based on usage
            existing = patterns[pattern_id]
            existing["applications"] = existing.get("applications", 0) + 1
            existing["confidence"] = min(1.0, existing.get("confidence", 0.5) + 0.05)
            existing["last_used"] = datetime.now().isoformat()
        else:
            pattern.setdefault("confidence", 0.5)
            pattern.setdefault("applications", 1)
            pattern.setdefault("created", datetime.now().isoformat())
            pattern.setdefault("last_used", datetime.now().isoformat())
            patterns[pattern_id] = pattern

        data["patterns"] = patterns
        self.save_semantic("writing_patterns", data)

    def add_mistake(self, mistake: dict):
        """Record a mistake to avoid in future."""
        data = self.load_semantic("mistakes")
        patterns = data.get("patterns", {})
        mistakes_list = data.get("common_errors", [])

        mistake_id = mistake.get("id", f"err-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
        mistake["recorded_at"] = datetime.now().isoformat()
        mistake.setdefault("severity", "medium")
        mistake.setdefault("occurrences", 1)

        if mistake_id in patterns:
            patterns[mistake_id]["occurrences"] = patterns[mistake_id].get("occurrences", 0) + 1
            patterns[mistake_id]["last_seen"] = datetime.now().isoformat()
        else:
            patterns[mistake_id] = mistake

        data["patterns"] = patterns
        data["common_errors"] = mistakes_list
        self.save_semantic("mistakes", data)

    def add_niche_knowledge(self, domain: str, knowledge: dict):
        """Add acquired domain knowledge from research."""
        data = self.load_semantic("niche_knowledge")
        domains = data.get("domains", {})

        if domain not in domains:
            domains[domain] = {
                "topics": {},
                "sources": [],
                "acquired_at": datetime.now().isoformat()
            }

        for key, value in knowledge.items():
            if key == "topics":
                domains[domain]["topics"].update(value)
            elif key == "sources":
                domains[domain]["sources"].extend(value)
            else:
                domains[domain][key] = value

        data["domains"] = domains
        self.save_semantic("niche_knowledge", data)

    def get_writing_context(self) -> dict:
        """Get accumulated writing context for content generation."""
        patterns = self.load_semantic("writing_patterns")
        mistakes = self.load_semantic("mistakes")
        seo = self.load_semantic("seo_patterns")
        knowledge = self.load_semantic("niche_knowledge")

        # Get top patterns by confidence
        top_patterns = sorted(
            patterns.get("patterns", {}).values(),
            key=lambda p: p.get("confidence", 0) * p.get("applications", 1),
            reverse=True
        )[:10]

        # Get recent mistakes to avoid
        recent_mistakes = sorted(
            mistakes.get("patterns", {}).values(),
            key=lambda m: m.get("occurrences", 0),
            reverse=True
        )[:5]

        return {
            "style": patterns.get("style_preferences", {}),
            "top_patterns": top_patterns,
            "avoid": [m.get("description", m.get("id", "")) for m in recent_mistakes],
            "seo_rules": seo.get("effective_titles", [])[:5],
            "domain_knowledge": list(knowledge.get("domains", {}).keys())
        }

    # ──────────────────────────────────────────────
    # EPISODIC MEMORY — Per-session experiences
    # ──────────────────────────────────────────────

    def record_experience(self, phase: str, outcome: str, details: dict):
        """Record a pipeline experience."""
        now = datetime.now()
        year_dir = self.memory_dir / "episodic" / str(now.year)
        year_dir.mkdir(parents=True, exist_ok=True)

        episode = {
            "id": f"ep-{now.strftime('%Y%m%d-%H%M%S')}",
            "timestamp": now.isoformat(),
            "phase": phase,
            "outcome": outcome,  # success, partial, failure
            "details": details,
            "niche": self.config.get("niche", "unknown"),
            "lessons": details.get("lessons", []),
            "user_feedback": details.get("user_feedback", None)
        }

        filename = f"{now.strftime('%m-%d')}-{phase}.json"
        filepath = year_dir / filename

        # Append to existing or create new
        if filepath.exists():
            episodes = self._load_json(filepath)
            if isinstance(episodes, list):
                episodes.append(episode)
            else:
                episodes = [episodes, episode]
        else:
            episodes = [episode]

        self._save_json(filepath, episodes)
        return episode["id"]

    def get_recent_experiences(self, days: int = 7, phase: str = None) -> list:
        """Retrieve recent episodic memories."""
        experiences = []
        now = datetime.now()

        for i in range(days):
            day = now - timedelta(days=i)
            year_dir = self.memory_dir / "episodic" / str(day.year)
            if not year_dir.exists():
                continue

            for f in year_dir.glob(f"{day.strftime('%m-%d')}-*.json"):
                data = self._load_json(f)
                if isinstance(data, list):
                    experiences.extend(data)
                else:
                    experiences.append(data)

        if phase:
            experiences = [e for e in experiences if e.get("phase") == phase]

        return sorted(experiences, key=lambda x: x.get("timestamp", ""), reverse=True)

    def cleanup_old_episodes(self):
        """Remove episodic memories older than max_episodic_days."""
        cutoff = datetime.now() - timedelta(days=self.max_episodic_days)
        removed = 0

        episodic_dir = self.memory_dir / "episodic"
        for year_dir in episodic_dir.iterdir():
            if not year_dir.is_dir():
                continue
            for f in year_dir.glob("*.json"):
                try:
                    data = self._load_json(f)
                    entries = data if isinstance(data, list) else [data]
                    if entries and entries[0].get("timestamp", ""):
                        ts = datetime.fromisoformat(entries[0]["timestamp"])
                        if ts < cutoff:
                            f.unlink()
                            removed += 1
                except (ValueError, KeyError):
                    pass

        return removed

    # ──────────────────────────────────────────────
    # WORKING MEMORY — Current session
    # ──────────────────────────────────────────────

    def start_session(self, phase: str = None):
        """Initialize working memory for current session."""
        session = {
            "session_id": f"ses-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "started_at": datetime.now().isoformat(),
            "phase": phase,
            "articles_processed": 0,
            "errors": [],
            "notes": []
        }
        self._save_json(self.memory_dir / "working" / "current_session.json", session)
        return session["session_id"]

    def update_session(self, updates: dict):
        """Update current working memory."""
        filepath = self.memory_dir / "working" / "current_session.json"
        session = self._load_json(filepath) if filepath.exists() else {}
        session.update(updates)
        self._save_json(filepath, session)

    def end_session(self, outcome: str = "complete"):
        """Finalize session and create episodic record."""
        filepath = self.memory_dir / "working" / "current_session.json"
        session = self._load_json(filepath) if filepath.exists() else {}
        session["ended_at"] = datetime.now().isoformat()
        session["outcome"] = outcome

        # Create episodic record from session
        if session.get("phase"):
            self.record_experience(
                phase=session["phase"],
                outcome=outcome,
                details={
                    "articles_processed": session.get("articles_processed", 0),
                    "errors": session.get("errors", []),
                    "notes": session.get("notes", [])
                }
            )

        # Archive session
        self._save_json(
            self.memory_dir / "working" / "session_end.json", session
        )

    # ──────────────────────────────────────────────
    # PATTERN EXTRACTION — Learn from experiences
    # ──────────────────────────────────────────────

    def extract_patterns(self):
        """Analyze episodic memories and extract semantic patterns."""
        experiences = self.get_recent_experiences(days=30)
        if not experiences:
            print("  ⚠️ No recent experiences to learn from")
            return 0

        patterns_added = 0

        # Group by phase
        phases = {}
        for exp in experiences:
            phase = exp.get("phase", "unknown")
            phases.setdefault(phase, []).append(exp)

        for phase, exps in phases.items():
            successes = [e for e in exps if e.get("outcome") == "success"]
            failures = [e for e in exps if e.get("outcome") == "failure"]

            # Extract success patterns
            if len(successes) >= 2:
                self.add_writing_pattern(f"success-{phase}", {
                    "description": f"{phase} phase success pattern ({len(successes)} occurrences)",
                    "source": "episodic_analysis",
                    "category": phase,
                    "success_count": len(successes)
                })
                patterns_added += 1

            # Extract failure patterns as mistakes
            for fail in failures:
                errors = fail.get("details", {}).get("errors", [])
                for error in errors[:3]:
                    self.add_mistake({
                        "id": f"err-{phase}-{hash(str(error)) % 10000}",
                        "description": str(error)[:200],
                        "phase": phase,
                        "severity": "high" if "delete" in str(error).lower() else "medium"
                    })
                    patterns_added += 1

        print(f"  📊 Extracted {patterns_added} patterns from {len(experiences)} experiences")
        return patterns_added

    # ──────────────────────────────────────────────
    # STATUS & UTILITIES
    # ──────────────────────────────────────────────

    def get_status(self) -> dict:
        """Get memory system status."""
        status = {"layers": {}}

        # Semantic
        semantic_dir = self.memory_dir / "semantic"
        semantic_files = list(semantic_dir.glob("*.json")) if semantic_dir.exists() else []
        total_patterns = 0
        for f in semantic_files:
            data = self._load_json(f)
            total_patterns += len(data.get("patterns", {}))

        status["layers"]["semantic"] = {
            "files": len(semantic_files),
            "total_patterns": total_patterns
        }

        # Episodic
        episodic_dir = self.memory_dir / "episodic"
        episodic_files = list(episodic_dir.rglob("*.json")) if episodic_dir.exists() else []
        status["layers"]["episodic"] = {
            "files": len(episodic_files),
            "recent_7d": len(self.get_recent_experiences(7))
        }

        # Working
        working_file = self.memory_dir / "working" / "current_session.json"
        session = self._load_json(working_file) if working_file.exists() else {}
        status["layers"]["working"] = {
            "active_session": session.get("session_id"),
            "phase": session.get("phase")
        }

        return status

    def _load_json(self, filepath: Path) -> dict:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_json(self, filepath: Path, data):
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Memory Engine — Self-learning system")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--status", action="store_true", help="Show memory status")
    parser.add_argument("--learn", action="store_true", help="Extract patterns from experiences")
    parser.add_argument("--cleanup", action="store_true", help="Remove old episodic memories")
    parser.add_argument("--context", action="store_true", help="Show writing context")
    parser.add_argument("--test", action="store_true", help="Run self-test")
    args = parser.parse_args()

    engine = MemoryEngine(args.config)

    if args.status:
        status = engine.get_status()
        print(f"\n{'═' * 50}")
        print(f"  🧠 Memory System Status")
        print(f"{'═' * 50}")
        for layer, info in status["layers"].items():
            print(f"\n  📦 {layer.upper()}")
            for k, v in info.items():
                print(f"    {k}: {v}")
        print(f"\n{'═' * 50}")

    elif args.learn:
        print("🧠 Learning from experiences...")
        count = engine.extract_patterns()
        print(f"  ✅ {count} patterns extracted")

    elif args.cleanup:
        removed = engine.cleanup_old_episodes()
        print(f"🧹 Cleaned up {removed} old episodic memories")

    elif args.context:
        ctx = engine.get_writing_context()
        print(json.dumps(ctx, ensure_ascii=False, indent=2))

    elif args.test:
        print("🧪 Testing memory system...")
        # Test session lifecycle
        sid = engine.start_session("test")
        print(f"  ✅ Session started: {sid}")
        engine.update_session({"articles_processed": 1, "notes": ["test note"]})
        print(f"  ✅ Session updated")
        engine.end_session("success")
        print(f"  ✅ Session ended → episodic record created")

        # Test pattern recording
        engine.add_writing_pattern("test-pattern", {
            "description": "Test writing pattern",
            "category": "test"
        })
        print(f"  ✅ Writing pattern recorded")

        engine.add_mistake({
            "id": "test-mistake",
            "description": "Test mistake",
            "phase": "test"
        })
        print(f"  ✅ Mistake recorded")

        # Test context
        ctx = engine.get_writing_context()
        print(f"  ✅ Writing context generated ({len(ctx)} keys)")

        # Status
        status = engine.get_status()
        print(f"  ✅ Status: {status['layers']['semantic']['total_patterns']} patterns")
        print(f"\n  🎉 All memory tests passed!")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
