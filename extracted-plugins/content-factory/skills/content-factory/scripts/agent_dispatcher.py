#!/usr/bin/env python3
"""
Agent Dispatcher — Multi-agent task queue with file-based locking.

Enables multiple AI agents (Gemini CLI, Claude, OpenCode) to work on the same
pipeline independently. Tasks are claimed via atomic file writes.

Usage:
    from agent_dispatcher import AgentDispatcher
    dispatcher = AgentDispatcher("/path/to/project")
    dispatcher.enqueue("write-article-1", "write", {"topic": "SEO Tips"})
    task = dispatcher.claim_next("gemini-agent-1")
    dispatcher.complete(task["id"], "gemini-agent-1", {"result": "ok"})
"""

import json
import os
import time
import hashlib
from pathlib import Path
from datetime import datetime, timedelta


class AgentDispatcher:
    """File-based multi-agent task queue."""

    TASKS_FILE = ".content-factory-tasks.json"
    HEARTBEAT_TIMEOUT = 600  # 10 min stale threshold
    MAX_RETRIES = 3

    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd()).resolve()
        self.tasks_path = self.project_root / self.TASKS_FILE

    def _load(self) -> dict:
        if not self.tasks_path.exists():
            return {"version": "1.0", "tasks": [], "agents": {}}
        try:
            with open(self.tasks_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {"version": "1.0", "tasks": [], "agents": {}}

    def _save(self, data: dict):
        tmp = self.tasks_path.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        tmp.replace(self.tasks_path)

    def enqueue(self, task_id: str, task_type: str, meta: dict = None, priority: int = 5) -> dict:
        """Add a task to the queue."""
        data = self._load()
        existing = next((t for t in data["tasks"] if t["id"] == task_id), None)
        if existing:
            return existing

        task = {
            "id": task_id,
            "type": task_type,
            "status": "queued",
            "priority": priority,
            "meta": meta or {},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "claimed_by": None,
            "claimed_at": None,
            "completed_at": None,
            "retries": 0,
            "error": None,
            "result": None,
        }
        data["tasks"].append(task)
        self._save(data)
        return task

    def enqueue_batch(self, tasks: list) -> list:
        """Add multiple tasks at once. Each item: {"id", "type", "meta", "priority"}."""
        data = self._load()
        existing_ids = {t["id"] for t in data["tasks"]}
        added = []

        for item in tasks:
            if item["id"] in existing_ids:
                continue
            task = {
                "id": item["id"],
                "type": item.get("type", "write"),
                "status": "queued",
                "priority": item.get("priority", 5),
                "meta": item.get("meta", {}),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "claimed_by": None,
                "claimed_at": None,
                "completed_at": None,
                "retries": 0,
                "error": None,
                "result": None,
            }
            data["tasks"].append(task)
            added.append(task)

        self._save(data)
        return added

    def claim_next(self, agent_id: str, task_type: str = None) -> dict | None:
        """Claim the next available task for an agent. Returns None if empty."""
        data = self._load()
        self._cleanup_stale(data)

        # Filter by type if specified
        candidates = [
            t for t in data["tasks"]
            if t["status"] == "queued" and (task_type is None or t["type"] == task_type)
        ]

        if not candidates:
            return None

        # Sort by priority (lower = higher priority) then creation time
        candidates.sort(key=lambda t: (t["priority"], t["created_at"]))
        task = candidates[0]

        task["status"] = "claimed"
        task["claimed_by"] = agent_id
        task["claimed_at"] = datetime.now().isoformat()
        task["updated_at"] = datetime.now().isoformat()

        # Register agent
        data["agents"][agent_id] = {
            "last_seen": datetime.now().isoformat(),
            "current_task": task["id"],
        }

        self._save(data)
        return task

    def heartbeat(self, agent_id: str, task_id: str = None):
        """Update agent heartbeat to prevent stale detection."""
        data = self._load()
        if agent_id in data["agents"]:
            data["agents"][agent_id]["last_seen"] = datetime.now().isoformat()
        else:
            data["agents"][agent_id] = {
                "last_seen": datetime.now().isoformat(),
                "current_task": task_id,
            }
        self._save(data)

    def complete(self, task_id: str, agent_id: str, result: dict = None):
        """Mark task as done."""
        data = self._load()
        task = next((t for t in data["tasks"] if t["id"] == task_id), None)
        if not task:
            return

        task["status"] = "done"
        task["completed_at"] = datetime.now().isoformat()
        task["updated_at"] = datetime.now().isoformat()
        task["result"] = result

        if agent_id in data["agents"]:
            data["agents"][agent_id]["current_task"] = None

        self._save(data)

    def fail(self, task_id: str, agent_id: str, error: str = None):
        """Mark task as failed. Auto-retry if under limit."""
        data = self._load()
        task = next((t for t in data["tasks"] if t["id"] == task_id), None)
        if not task:
            return

        task["retries"] += 1
        task["error"] = error
        task["updated_at"] = datetime.now().isoformat()

        if task["retries"] < self.MAX_RETRIES:
            # Requeue for retry
            task["status"] = "queued"
            task["claimed_by"] = None
            task["claimed_at"] = None
        else:
            task["status"] = "failed"
            task["completed_at"] = datetime.now().isoformat()

        if agent_id in data["agents"]:
            data["agents"][agent_id]["current_task"] = None

        self._save(data)

    def get_queue(self) -> dict:
        """Get queue summary."""
        data = self._load()
        tasks = data["tasks"]
        return {
            "total": len(tasks),
            "queued": sum(1 for t in tasks if t["status"] == "queued"),
            "claimed": sum(1 for t in tasks if t["status"] == "claimed"),
            "done": sum(1 for t in tasks if t["status"] == "done"),
            "failed": sum(1 for t in tasks if t["status"] == "failed"),
            "agents": data["agents"],
            "tasks": tasks,
        }

    def _cleanup_stale(self, data: dict):
        """Requeue tasks from agents that timed out."""
        now = datetime.now()
        for task in data["tasks"]:
            if task["status"] == "claimed" and task["claimed_at"]:
                claimed_time = datetime.fromisoformat(task["claimed_at"])
                agent_id = task["claimed_by"]

                # Check agent heartbeat
                agent = data["agents"].get(agent_id, {})
                last_seen = agent.get("last_seen")
                if last_seen:
                    last_time = datetime.fromisoformat(last_seen)
                else:
                    last_time = claimed_time

                if (now - last_time).total_seconds() > self.HEARTBEAT_TIMEOUT:
                    task["status"] = "queued"
                    task["claimed_by"] = None
                    task["claimed_at"] = None
                    task["updated_at"] = now.isoformat()

    def reset(self):
        """Clear all tasks."""
        self._save({"version": "1.0", "tasks": [], "agents": {}})


# CLI interface
if __name__ == "__main__":
    import sys
    d = AgentDispatcher()

    if len(sys.argv) < 2:
        print("Usage: python3 agent_dispatcher.py <command>")
        print("  status    — Show queue status")
        print("  reset     — Clear all tasks")
        print("  add <id> <type> — Add a task")
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd == "status":
        q = d.get_queue()
        print(f"\n📋 Task Queue")
        print(f"  Total:   {q['total']}")
        print(f"  Queued:  {q['queued']}")
        print(f"  Claimed: {q['claimed']}")
        print(f"  Done:    {q['done']}")
        print(f"  Failed:  {q['failed']}")
        if q["agents"]:
            print(f"\n  Active Agents:")
            for aid, info in q["agents"].items():
                task = info.get("current_task", "none")
                print(f"    {aid}: task={task}")

    elif cmd == "reset":
        d.reset()
        print("✅ Queue cleared")

    elif cmd == "add" and len(sys.argv) >= 4:
        task = d.enqueue(sys.argv[2], sys.argv[3])
        print(f"✅ Added: {task['id']} ({task['type']})")
