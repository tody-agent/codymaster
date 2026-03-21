"""Tests for state_manager.py — State persistence, events, and thread safety."""
import json
import sys
import pytest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


class TestStateManager:
    """Test StateManager class."""

    def test_default_state(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        state = sm.load()
        assert state["status"] == "idle"
        assert state["version"] == "2.0"
        assert len(state["pipeline"]["phases"]) == 6

    def test_save_and_load(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.update_phase("extract", "running", progress=0.5)
        state = sm.load()
        assert state["pipeline"]["phases"]["extract"]["status"] == "running"
        assert state["pipeline"]["phases"]["extract"]["progress"] == 0.5

    def test_phase_lifecycle(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.update_phase("write", "running", progress=0.0)
        sm.update_phase("write", "running", progress=0.5)
        sm.update_phase("write", "done", progress=1.0)
        state = sm.load()
        p = state["pipeline"]["phases"]["write"]
        assert p["status"] == "done"
        assert p["progress"] == 1.0
        assert p["started_at"] is not None
        assert p["finished_at"] is not None

    def test_add_task(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.add_task("task-1", "running", {"topic": "SEO"})
        state = sm.load()
        assert len(state["tasks"]) == 1
        assert state["tasks"][0]["id"] == "task-1"
        assert state["tasks"][0]["meta"]["topic"] == "SEO"

    def test_update_existing_task(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.add_task("task-1", "running")
        sm.add_task("task-1", "done", {"result": "ok"})
        state = sm.load()
        assert len(state["tasks"]) == 1
        assert state["tasks"][0]["status"] == "done"

    def test_update_tokens(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.update_tokens("gemini", input_tokens=100, output_tokens=50, cost_usd=0.001)
        sm.update_tokens("gemini", input_tokens=200, output_tokens=100, cost_usd=0.002)
        state = sm.load()
        assert state["tokens"]["total_input"] == 300
        assert state["tokens"]["total_output"] == 150
        assert state["tokens"]["total_cost_usd"] == 0.003
        assert state["tokens"]["providers"]["gemini"]["requests"] == 2

    def test_budget_check(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.set_budget(0.01)
        assert sm.check_budget() is True
        sm.update_tokens("gemini", cost_usd=0.011)
        assert sm.check_budget() is False

    def test_add_error(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.add_error("write", "API timeout")
        state = sm.load()
        assert len(state["errors"]) == 1
        assert state["errors"][0]["message"] == "API timeout"

    def test_event_logging(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.log_event("info", "test event", {"key": "val"})
        sm.log_event("error", "test error")
        events = sm.get_recent_events(10)
        assert len(events) == 2
        assert events[0]["level"] == "info"
        assert events[1]["level"] == "error"

    def test_reset(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.update_phase("write", "done", progress=1.0)
        sm.add_task("t1", "done")
        sm.reset()
        state = sm.load()
        assert state["status"] == "idle"
        assert len(state["tasks"]) == 0

    def test_get_snapshot(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.log_event("info", "snapshot test")
        snap = sm.get_snapshot()
        assert "recent_events" in snap
        assert len(snap["recent_events"]) >= 1

    def test_overall_status_completed(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        for phase in ["extract", "plan", "write", "audit", "seo", "publish"]:
            sm.update_phase(phase, "done", progress=1.0)
        state = sm.load()
        assert state["status"] == "completed"

    def test_overall_status_error(self, tmp_path):
        from state_manager import StateManager
        sm = StateManager(str(tmp_path))
        sm.update_phase("extract", "done")
        sm.update_phase("plan", "failed", error="Network error")
        state = sm.load()
        assert state["status"] == "error"
        assert len(state["errors"]) == 1
