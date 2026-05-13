"""Tests for agent_dispatcher.py — Task queue, claiming, and stale detection."""
import json
import sys
import time
import pytest
from pathlib import Path
from datetime import datetime, timedelta

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


class TestAgentDispatcher:
    """Test AgentDispatcher class."""

    def test_enqueue(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        task = d.enqueue("task-1", "write", {"topic": "SEO"})
        assert task["id"] == "task-1"
        assert task["status"] == "queued"
        assert task["type"] == "write"

    def test_no_duplicate_enqueue(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("task-1", "write")
        d.enqueue("task-1", "write")
        q = d.get_queue()
        assert q["total"] == 1

    def test_claim_next(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("task-1", "write")
        task = d.claim_next("agent-1")
        assert task is not None
        assert task["status"] == "claimed"
        assert task["claimed_by"] == "agent-1"

    def test_claim_empty_queue_returns_none(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        assert d.claim_next("agent-1") is None

    def test_claim_by_type(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("task-1", "write")
        d.enqueue("task-2", "audit")
        task = d.claim_next("agent-1", task_type="audit")
        assert task["id"] == "task-2"

    def test_complete(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("task-1", "write")
        d.claim_next("agent-1")
        d.complete("task-1", "agent-1", {"result": "ok"})
        q = d.get_queue()
        assert q["done"] == 1

    def test_fail_with_retry(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("task-1", "write")
        d.claim_next("agent-1")
        d.fail("task-1", "agent-1", "timeout")
        q = d.get_queue()
        task = next(t for t in q["tasks"] if t["id"] == "task-1")
        assert task["status"] == "queued"  # requeued for retry
        assert task["retries"] == 1

    def test_fail_exceeds_max_retries(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("task-1", "write")
        for _ in range(3):
            d.claim_next("agent-1")
            d.fail("task-1", "agent-1", "error")
        q = d.get_queue()
        task = next(t for t in q["tasks"] if t["id"] == "task-1")
        assert task["status"] == "failed"
        assert task["retries"] == 3

    def test_priority_ordering(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("low", "write", priority=10)
        d.enqueue("high", "write", priority=1)
        d.enqueue("mid", "write", priority=5)
        task = d.claim_next("agent-1")
        assert task["id"] == "high"

    def test_enqueue_batch(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        tasks = [
            {"id": "b-1", "type": "write"},
            {"id": "b-2", "type": "write"},
            {"id": "b-3", "type": "audit"},
        ]
        added = d.enqueue_batch(tasks)
        assert len(added) == 3
        q = d.get_queue()
        assert q["total"] == 3

    def test_queue_summary(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("t1", "write")
        d.enqueue("t2", "write")
        d.claim_next("agent-1")
        q = d.get_queue()
        assert q["queued"] == 1
        assert q["claimed"] == 1

    def test_reset(self, tmp_path):
        from agent_dispatcher import AgentDispatcher
        d = AgentDispatcher(str(tmp_path))
        d.enqueue("t1", "write")
        d.enqueue("t2", "write")
        d.reset()
        q = d.get_queue()
        assert q["total"] == 0
