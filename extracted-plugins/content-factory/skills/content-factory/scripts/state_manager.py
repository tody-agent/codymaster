#!/usr/bin/env python3
"""
State Manager — Central state management for Content Factory dashboard.

All pipeline scripts write state here; dashboard reads it.
State persisted to `.content-factory-state.json` at project root.
Events logged to `logs/events.jsonl` (append-only).

Usage:
    from state_manager import StateManager
    sm = StateManager("/path/to/project")
    sm.update_phase("write", "running", progress=0.5)
    sm.add_task("write-article-1", "writing", {"topic": "SEO Tips"})
    sm.log_event("info", "Article 1 started")
"""

import json
import os
import time
import threading
from pathlib import Path
from datetime import datetime


class StateManager:
    """Thread-safe state manager for Content Factory pipeline."""

    STATE_FILE = ".content-factory-state.json"
    EVENTS_FILE = "logs/events.jsonl"

    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd()).resolve()
        self.state_path = self.project_root / self.STATE_FILE
        self.events_path = self.project_root / self.EVENTS_FILE
        self._lock = threading.Lock()
        self._ensure_dirs()

    def _ensure_dirs(self):
        """Create logs directory if needed."""
        self.events_path.parent.mkdir(parents=True, exist_ok=True)

    def _default_state(self) -> dict:
        """Return default empty state."""
        return {
            "version": "2.0",
            "started_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "status": "idle",
            "pipeline": {
                "current_phase": None,
                "phases": {
                    "extract": {"status": "pending", "progress": 0, "started_at": None, "finished_at": None},
                    "plan": {"status": "pending", "progress": 0, "started_at": None, "finished_at": None},
                    "write": {"status": "pending", "progress": 0, "started_at": None, "finished_at": None},
                    "audit": {"status": "pending", "progress": 0, "started_at": None, "finished_at": None},
                    "seo": {"status": "pending", "progress": 0, "started_at": None, "finished_at": None},
                    "publish": {"status": "pending", "progress": 0, "started_at": None, "finished_at": None},
                },
            },
            "tasks": [],
            "tokens": {
                "total_input": 0,
                "total_output": 0,
                "total_cost_usd": 0.0,
                "budget_limit_usd": None,
                "providers": {},
            },
            "errors": [],
            "stats": {
                "articles_total": 0,
                "articles_written": 0,
                "articles_passed_audit": 0,
                "articles_failed": 0,
            },
            "agents": [],
        }

    def load(self) -> dict:
        """Load current state from disk."""
        if not self.state_path.exists():
            return self._default_state()
        try:
            with open(self.state_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return self._default_state()

    def save(self, state: dict):
        """Save state to disk (thread-safe)."""
        state["updated_at"] = datetime.now().isoformat()
        with self._lock:
            tmp = self.state_path.with_suffix(".tmp")
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2, ensure_ascii=False)
            tmp.replace(self.state_path)

    def update_phase(self, phase: str, status: str, progress: float = None, error: str = None):
        """Update phase status and optional progress (0.0 - 1.0)."""
        state = self.load()
        phase_data = state["pipeline"]["phases"].get(phase, {})

        phase_data["status"] = status
        if progress is not None:
            phase_data["progress"] = min(1.0, max(0.0, progress))
        if status == "running" and not phase_data.get("started_at"):
            phase_data["started_at"] = datetime.now().isoformat()
        if status in ("done", "failed"):
            phase_data["finished_at"] = datetime.now().isoformat()

        state["pipeline"]["phases"][phase] = phase_data
        state["pipeline"]["current_phase"] = phase if status == "running" else state["pipeline"]["current_phase"]

        # Update overall status
        if status == "running":
            state["status"] = "running"
        elif all(p["status"] == "done" for p in state["pipeline"]["phases"].values()):
            state["status"] = "completed"
        elif any(p["status"] == "failed" for p in state["pipeline"]["phases"].values()):
            state["status"] = "error"

        if error:
            self._add_error(state, phase, error)

        self.save(state)
        self.log_event("info" if status != "failed" else "error",
                       f"Phase {phase}: {status}" + (f" ({progress*100:.0f}%)" if progress else ""),
                       {"phase": phase, "status": status})

    def add_task(self, task_id: str, status: str, meta: dict = None):
        """Add or update a task in the queue."""
        state = self.load()
        existing = next((t for t in state["tasks"] if t["id"] == task_id), None)
        now = datetime.now().isoformat()

        if existing:
            existing["status"] = status
            existing["updated_at"] = now
            if meta:
                existing["meta"].update(meta)
        else:
            state["tasks"].append({
                "id": task_id,
                "status": status,
                "created_at": now,
                "updated_at": now,
                "meta": meta or {},
            })

        # Keep last 200 tasks max
        if len(state["tasks"]) > 200:
            done = [t for t in state["tasks"] if t["status"] in ("done", "failed")]
            active = [t for t in state["tasks"] if t["status"] not in ("done", "failed")]
            state["tasks"] = active + done[-100:]

        self.save(state)

    def update_tokens(self, provider: str, input_tokens: int = 0, output_tokens: int = 0, cost_usd: float = 0.0):
        """Track token usage by provider."""
        state = self.load()
        tokens = state["tokens"]
        tokens["total_input"] += input_tokens
        tokens["total_output"] += output_tokens
        tokens["total_cost_usd"] = round(tokens["total_cost_usd"] + cost_usd, 6)

        if provider not in tokens["providers"]:
            tokens["providers"][provider] = {"input": 0, "output": 0, "cost_usd": 0.0, "requests": 0}

        p = tokens["providers"][provider]
        p["input"] += input_tokens
        p["output"] += output_tokens
        p["cost_usd"] = round(p["cost_usd"] + cost_usd, 6)
        p["requests"] += 1

        self.save(state)

    def check_budget(self) -> bool:
        """Check if spending is within budget. Returns True if OK."""
        state = self.load()
        limit = state["tokens"].get("budget_limit_usd")
        if limit is None:
            return True
        return state["tokens"]["total_cost_usd"] < limit

    def set_budget(self, budget_usd: float):
        """Set budget limit."""
        state = self.load()
        state["tokens"]["budget_limit_usd"] = budget_usd
        self.save(state)

    def update_stats(self, **kwargs):
        """Update article statistics."""
        state = self.load()
        for k, v in kwargs.items():
            if k in state["stats"]:
                state["stats"][k] = v
        self.save(state)

    def increment_stat(self, key: str, amount: int = 1):
        """Increment a stat counter."""
        state = self.load()
        if key in state["stats"]:
            state["stats"][key] += amount
        self.save(state)

    def register_agent(self, agent_id: str, agent_type: str):
        """Register an active agent."""
        state = self.load()
        existing = next((a for a in state["agents"] if a["id"] == agent_id), None)
        now = datetime.now().isoformat()
        if existing:
            existing["last_seen"] = now
        else:
            state["agents"].append({
                "id": agent_id,
                "type": agent_type,
                "registered_at": now,
                "last_seen": now,
            })
        self.save(state)

    def _add_error(self, state: dict, source: str, message: str):
        """Add error to state (max 50)."""
        state["errors"].append({
            "source": source,
            "message": message,
            "timestamp": datetime.now().isoformat(),
        })
        state["errors"] = state["errors"][-50:]

    def add_error(self, source: str, message: str):
        """Public method to add an error."""
        state = self.load()
        self._add_error(state, source, message)
        self.save(state)
        self.log_event("error", message, {"source": source})

    def log_event(self, level: str, message: str, data: dict = None):
        """Append event to JSONL log file."""
        event = {
            "ts": datetime.now().isoformat(),
            "level": level,
            "msg": message,
        }
        if data:
            event["data"] = data

        with self._lock:
            with open(self.events_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(event, ensure_ascii=False) + "\n")

    def get_recent_events(self, n: int = 100) -> list:
        """Read last N events from log."""
        if not self.events_path.exists():
            return []
        try:
            with open(self.events_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            events = []
            for line in lines[-n:]:
                line = line.strip()
                if line:
                    try:
                        events.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
            return events
        except IOError:
            return []

    def reset(self):
        """Reset state to default (for new pipeline run)."""
        state = self._default_state()
        self.save(state)
        self.log_event("info", "State reset — new pipeline run")

    def get_snapshot(self) -> dict:
        """Get full state snapshot including recent events."""
        state = self.load()
        state["recent_events"] = self.get_recent_events(50)
        return state


# CLI interface
if __name__ == "__main__":
    import sys
    sm = StateManager()

    if len(sys.argv) < 2:
        print("Usage: python3 state_manager.py <command>")
        print("  status  — Show current state")
        print("  reset   — Reset state")
        print("  events  — Show recent events")
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd == "status":
        state = sm.load()
        print(f"\n🏭 Content Factory State")
        print(f"  Status: {state['status']}")
        print(f"  Updated: {state['updated_at']}")
        print(f"\n  Pipeline:")
        for phase, data in state["pipeline"]["phases"].items():
            icon = {"pending": "⬜", "running": "🔄", "done": "✅", "failed": "❌"}.get(data["status"], "❓")
            progress = f" ({data['progress']*100:.0f}%)" if data["progress"] > 0 else ""
            print(f"    {icon} {phase}{progress}")
        print(f"\n  Tokens: {state['tokens']['total_input']}in / {state['tokens']['total_output']}out")
        print(f"  Cost: ${state['tokens']['total_cost_usd']:.4f}")
        print(f"  Tasks: {len(state['tasks'])}")
        print(f"  Errors: {len(state['errors'])}")
        print(f"  Agents: {len(state['agents'])}")

    elif cmd == "reset":
        sm.reset()
        print("✅ State reset")

    elif cmd == "events":
        events = sm.get_recent_events(20)
        for e in events:
            icon = {"info": "ℹ️", "warn": "⚠️", "error": "❌"}.get(e["level"], "•")
            print(f"  {icon} [{e['ts'][-8:]}] {e['msg']}")
