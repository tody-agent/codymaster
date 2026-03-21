"""Tests for token_manager.py — Token tracking, budget, circuit breaker, and rate limiting."""
import json
import sys
import pytest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


class TestTokenManager:
    """Test TokenManager class."""

    def test_estimate_cost_gemini(self):
        from token_manager import TokenManager
        tm = TokenManager()
        cost = tm.estimate_cost("gemini", 1_000_000, 1_000_000)
        assert cost == 0.75  # 0.15 + 0.60

    def test_estimate_cost_unknown_provider(self):
        from token_manager import TokenManager
        tm = TokenManager()
        cost = tm.estimate_cost("unknown", 1_000_000, 1_000_000)
        assert cost == 4.0  # fallback 1.0 + 3.0

    def test_record_usage(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path))
        cost = tm.record_usage("gemini", input_tokens=1000, output_tokens=500, task_id="test-1")
        assert cost > 0
        s = tm.get_summary()
        assert s["total_input_tokens"] == 1000
        assert s["total_output_tokens"] == 500
        assert s["total_requests"] == 1
        assert s["providers"]["gemini"]["requests"] == 1

    def test_multiple_providers(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path))
        tm.record_usage("gemini", input_tokens=1000, output_tokens=500)
        tm.record_usage("claude-sonnet", input_tokens=2000, output_tokens=1000)
        s = tm.get_summary()
        assert len(s["providers"]) == 2
        assert s["total_input_tokens"] == 3000

    def test_budget_within(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path), budget_usd=10.0)
        tm.record_usage("gemini", input_tokens=1000, output_tokens=500)
        assert tm.check_budget() is True

    def test_budget_exceeded(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path), budget_usd=0.0001)
        tm.record_usage("gemini", input_tokens=100000, output_tokens=50000)
        assert tm.check_budget() is False

    def test_budget_status(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path), budget_usd=1.0)
        tm.record_usage("gemini", input_tokens=1000, output_tokens=500)
        status = tm.get_budget_status()
        assert status["limit_usd"] == 1.0
        assert status["within_budget"] is True
        assert status["percentage_used"] >= 0

    def test_circuit_breaker_closed(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path))
        assert tm.is_circuit_open("gemini") is False

    def test_circuit_breaker_opens(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path))
        for _ in range(5):
            tm.record_usage("gemini", input_tokens=100, output_tokens=50, success=False)
        assert tm.is_circuit_open("gemini") is True

    def test_circuit_breaker_resets_on_success(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path))
        for _ in range(3):
            tm.record_usage("gemini", input_tokens=100, output_tokens=50, success=False)
        tm.record_usage("gemini", input_tokens=100, output_tokens=50, success=True)
        assert tm.is_circuit_open("gemini") is False

    def test_backoff_seconds(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path))
        assert tm.get_backoff_seconds("gemini") == 0.0
        tm.record_usage("gemini", success=False)
        assert tm.get_backoff_seconds("gemini") == 2.0
        tm.record_usage("gemini", success=False)
        assert tm.get_backoff_seconds("gemini") == 4.0

    def test_reset(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path))
        tm.record_usage("gemini", input_tokens=1000, output_tokens=500)
        tm.reset()
        s = tm.get_summary()
        assert s["total_input_tokens"] == 0
        assert len(s["providers"]) == 0

    def test_failure_tracking(self, tmp_path):
        from token_manager import TokenManager
        tm = TokenManager(str(tmp_path))
        tm.record_usage("gemini", input_tokens=100, success=False)
        s = tm.get_summary()
        assert s["providers"]["gemini"]["failures"] == 1
