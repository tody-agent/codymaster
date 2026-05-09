#!/usr/bin/env python3
"""
Scoreboard — Reward/penalty tracking for self-learning content factory.

Tracks content quality scores based on user feedback and pipeline outcomes.
Higher scores → patterns reinforced. Lower scores → patterns avoided.

Usage:
    python3 scoreboard.py --config content-factory.config.json --status
    python3 scoreboard.py --config content-factory.config.json --reward "Great article!" article.md
    python3 scoreboard.py --config content-factory.config.json --penalty "edited" article.md
    python3 scoreboard.py --config content-factory.config.json --detect-changes
    python3 scoreboard.py --config content-factory.config.json --leaderboard
"""

import json
import sys
import os
import re
import subprocess
import argparse
from pathlib import Path
from datetime import datetime


DEFAULT_SCORING = {
    "reward_praise": 10,
    "reward_engagement": 5,
    "reward_first_pass": 3,
    "penalty_edit": -5,
    "penalty_delete": -10,
    "penalty_audit_fail": -3
}

PRAISE_KEYWORDS_VI = [
    "tốt", "hay", "giỏi", "xuất sắc", "tuyệt vời", "đỉnh", "chất lượng",
    "perfect", "great", "nice", "good", "awesome", "excellent", "LGTM"
]

CRITICISM_KEYWORDS_VI = [
    "sửa", "fix", "sai", "lỗi", "xoá", "delete", "remove", "wrong",
    "dở", "tệ", "bad", "redo", "viết lại", "chỉnh"
]


class Scoreboard:
    """Reward/penalty tracking system."""

    def __init__(self, config_path: str):
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.project_root = Path(config_path).resolve().parent
        mem_dir = self.project_root / self.config.get("memory", {}).get("memory_dir", "memory")
        self.scoreboard_file = mem_dir / "scoreboard.json"
        self.scoring_rules = {**DEFAULT_SCORING, **self.config.get("scoring", {})}

        # Ensure file exists
        mem_dir.mkdir(parents=True, exist_ok=True)
        if not self.scoreboard_file.exists():
            self._save({
                "total_score": 0,
                "lifetime_rewards": 0,
                "lifetime_penalties": 0,
                "articles": {},
                "events": [],
                "streaks": {"current_success": 0, "best_success": 0},
                "created_at": datetime.now().isoformat()
            })

    def _load(self) -> dict:
        with open(self.scoreboard_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save(self, data: dict):
        data["updated_at"] = datetime.now().isoformat()
        with open(self.scoreboard_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def reward(self, reason: str, article: str = None, points: int = None):
        """Add reward points."""
        data = self._load()

        # Auto-detect reward type
        if points is None:
            if any(kw in reason.lower() for kw in PRAISE_KEYWORDS_VI):
                points = self.scoring_rules["reward_praise"]
                event_type = "praise"
            elif "engagement" in reason.lower() or "share" in reason.lower():
                points = self.scoring_rules["reward_engagement"]
                event_type = "engagement"
            elif "first_pass" in reason.lower() or "audit pass" in reason.lower():
                points = self.scoring_rules["reward_first_pass"]
                event_type = "first_pass"
            else:
                points = self.scoring_rules["reward_praise"]
                event_type = "general"
        else:
            event_type = "custom"

        data["total_score"] += points
        data["lifetime_rewards"] += points

        # Track per-article
        if article:
            art_key = Path(article).stem if "/" in article else article
            if art_key not in data["articles"]:
                data["articles"][art_key] = {"score": 0, "events": []}
            data["articles"][art_key]["score"] += points
            data["articles"][art_key]["events"].append({
                "type": event_type, "points": points,
                "reason": reason[:100], "at": datetime.now().isoformat()
            })

        # Update streak
        data["streaks"]["current_success"] += 1
        if data["streaks"]["current_success"] > data["streaks"]["best_success"]:
            data["streaks"]["best_success"] = data["streaks"]["current_success"]

        # Log event
        data["events"].append({
            "type": "reward", "event_type": event_type,
            "points": points, "article": article,
            "reason": reason[:100], "at": datetime.now().isoformat()
        })

        # Keep last 500 events
        data["events"] = data["events"][-500:]

        self._save(data)
        print(f"  🏆 +{points} points ({event_type}){f' → {article}' if article else ''}")
        return points

    def penalty(self, reason: str, article: str = None, points: int = None):
        """Subtract penalty points."""
        data = self._load()

        # Auto-detect penalty type
        if points is None:
            if any(kw in reason.lower() for kw in ["xoá", "delete", "remove"]):
                points = self.scoring_rules["penalty_delete"]
                event_type = "delete"
            elif any(kw in reason.lower() for kw in ["sửa", "edit", "fix", "chỉnh"]):
                points = self.scoring_rules["penalty_edit"]
                event_type = "edit"
            elif "audit" in reason.lower() or "fail" in reason.lower():
                points = self.scoring_rules["penalty_audit_fail"]
                event_type = "audit_fail"
            else:
                points = self.scoring_rules["penalty_edit"]
                event_type = "general"
        else:
            event_type = "custom"

        data["total_score"] += points  # points is negative
        data["lifetime_penalties"] += abs(points)

        # Track per-article
        if article:
            art_key = Path(article).stem if "/" in article else article
            if art_key not in data["articles"]:
                data["articles"][art_key] = {"score": 0, "events": []}
            data["articles"][art_key]["score"] += points
            data["articles"][art_key]["events"].append({
                "type": event_type, "points": points,
                "reason": reason[:100], "at": datetime.now().isoformat()
            })

        # Reset streak
        data["streaks"]["current_success"] = 0

        data["events"].append({
            "type": "penalty", "event_type": event_type,
            "points": points, "article": article,
            "reason": reason[:100], "at": datetime.now().isoformat()
        })
        data["events"] = data["events"][-500:]

        self._save(data)
        print(f"  📉 {points} points ({event_type}){f' → {article}' if article else ''}")
        return points

    def detect_changes(self) -> dict:
        """Detect git changes to auto-score edits and deletes."""
        content_dir = self.config["output"]["content_dir"]

        try:
            # Detect deleted files
            result = subprocess.run(
                ["git", "diff", "--name-only", "--diff-filter=D", "HEAD~5", "HEAD", content_dir],
                capture_output=True, text=True, cwd=str(self.project_root)
            )
            deleted = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]

            # Detect modified files
            result = subprocess.run(
                ["git", "diff", "--name-only", "--diff-filter=M", "HEAD~5", "HEAD", content_dir],
                capture_output=True, text=True, cwd=str(self.project_root)
            )
            modified = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]

            # Score deletes
            for f in deleted:
                self.penalty(f"File deleted: {f}", article=f)

            # Score user-edits (not auto-generated)
            for f in modified:
                # Check if edit was manual (not by pipeline)
                result = subprocess.run(
                    ["git", "log", "-1", "--format=%s", "--", f],
                    capture_output=True, text=True, cwd=str(self.project_root)
                )
                commit_msg = result.stdout.strip()
                if not commit_msg.startswith("auto:"):
                    self.penalty(f"User edited: {f}", article=f)

            return {"deleted": len(deleted), "edited": len(modified)}

        except Exception as e:
            print(f"  ⚠️ Git detection error: {e}")
            return {"deleted": 0, "edited": 0}

    def auto_score_feedback(self, feedback: str, article: str = None):
        """Auto-detect sentiment and score accordingly."""
        feedback_lower = feedback.lower()

        if any(kw in feedback_lower for kw in PRAISE_KEYWORDS_VI):
            self.reward(feedback, article)
        elif any(kw in feedback_lower for kw in CRITICISM_KEYWORDS_VI):
            self.penalty(feedback, article)
        else:
            print(f"  ℹ️ Neutral feedback — no score change")

    def get_leaderboard(self, top_n: int = 10) -> list:
        """Get top-scoring articles."""
        data = self._load()
        ranked = sorted(
            data.get("articles", {}).items(),
            key=lambda x: x[1].get("score", 0),
            reverse=True
        )
        return ranked[:top_n]

    def get_worst(self, top_n: int = 10) -> list:
        """Get worst-scoring articles (candidates for rewrite)."""
        data = self._load()
        ranked = sorted(
            data.get("articles", {}).items(),
            key=lambda x: x[1].get("score", 0)
        )
        return ranked[:top_n]

    def get_status(self) -> dict:
        """Get current scoreboard status."""
        data = self._load()
        return {
            "total_score": data.get("total_score", 0),
            "lifetime_rewards": data.get("lifetime_rewards", 0),
            "lifetime_penalties": data.get("lifetime_penalties", 0),
            "tracked_articles": len(data.get("articles", {})),
            "total_events": len(data.get("events", [])),
            "current_streak": data.get("streaks", {}).get("current_success", 0),
            "best_streak": data.get("streaks", {}).get("best_success", 0),
            "grade": _calc_grade(data.get("total_score", 0))
        }


def _calc_grade(score: int) -> str:
    """Calculate grade from score."""
    if score >= 100: return "🏆 S-Tier (Master)"
    if score >= 50: return "🥇 A-Tier (Expert)"
    if score >= 20: return "🥈 B-Tier (Skilled)"
    if score >= 0: return "🥉 C-Tier (Learning)"
    return "📉 D-Tier (Needs Improvement)"


def main():
    parser = argparse.ArgumentParser(description="Scoreboard — Reward/Penalty System")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--status", action="store_true", help="Show scoreboard")
    parser.add_argument("--reward", help="Add reward with reason")
    parser.add_argument("--penalty", help="Add penalty with reason")
    parser.add_argument("--feedback", help="Auto-detect sentiment from feedback")
    parser.add_argument("--detect-changes", action="store_true", help="Auto-score from git changes")
    parser.add_argument("--leaderboard", action="store_true", help="Show top articles")
    parser.add_argument("--worst", action="store_true", help="Show worst articles")
    parser.add_argument("article", nargs="?", help="Article slug or path")
    args = parser.parse_args()

    board = Scoreboard(args.config)

    if args.status:
        status = board.get_status()
        print(f"\n{'═' * 50}")
        print(f"  📊 SCOREBOARD")
        print(f"{'═' * 50}")
        print(f"  Grade:       {status['grade']}")
        print(f"  Total Score: {status['total_score']}")
        print(f"  Rewards:     +{status['lifetime_rewards']}")
        print(f"  Penalties:   -{status['lifetime_penalties']}")
        print(f"  Articles:    {status['tracked_articles']}")
        print(f"  Streak:      {status['current_streak']} (best: {status['best_streak']})")
        print(f"{'═' * 50}")

    elif args.reward:
        board.reward(args.reward, args.article)

    elif args.penalty:
        board.penalty(args.penalty, args.article)

    elif args.feedback:
        board.auto_score_feedback(args.feedback, args.article)

    elif args.detect_changes:
        print("🔍 Detecting git changes...")
        changes = board.detect_changes()
        print(f"  Deleted: {changes['deleted']}, Edited: {changes['edited']}")

    elif args.leaderboard:
        top = board.get_leaderboard()
        print(f"\n🏆 TOP ARTICLES:")
        for slug, info in top:
            print(f"  {info['score']:+4d}  {slug}")

    elif args.worst:
        worst = board.get_worst()
        print(f"\n📉 WORST ARTICLES (rewrite candidates):")
        for slug, info in worst:
            print(f"  {info['score']:+4d}  {slug}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
