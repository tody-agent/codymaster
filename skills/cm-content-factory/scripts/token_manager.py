#!/usr/bin/env python3
"""
Token Manager — Track token usage, costs, rate limits, and budget for AI providers.

Monitors API consumption across providers (Gemini, Claude, OpenAI).
Implements circuit breaker pattern and exponential backoff.

Usage:
    from token_manager import TokenManager
    tm = TokenManager("/path/to/project")
    tm.record_usage("gemini", input_tokens=500, output_tokens=200)
    if not tm.check_budget():
        print("Budget exceeded!")
    tm.wait_if_rate_limited("gemini")
"""

import json
import time
import math
from pathlib import Path
from datetime import datetime


# Cost per 1M tokens (USD) — 2025 pricing estimates
PROVIDER_COSTS = {
    "gemini": {"input": 0.15, "output": 0.60},
    "gemini-pro": {"input": 1.25, "output": 5.00},
    "claude-sonnet": {"input": 3.00, "output": 15.00},
    "claude-haiku": {"input": 0.25, "output": 1.25},
    "openai-gpt4o": {"input": 2.50, "output": 10.00},
    "openai-gpt4o-mini": {"input": 0.15, "output": 0.60},
}

# Default rate limits (requests per minute)
RATE_LIMITS = {
    "gemini": 60,
    "gemini-pro": 30,
    "claude-sonnet": 50,
    "claude-haiku": 100,
    "openai-gpt4o": 60,
    "openai-gpt4o-mini": 100,
}


class TokenManager:
    """Token usage tracker with rate limiting and circuit breaker."""

    USAGE_FILE = "logs/token_usage.json"
    MAX_CONSECUTIVE_FAILURES = 5
    BACKOFF_BASE_SECONDS = 2.0
    BACKOFF_MAX_SECONDS = 120.0

    def __init__(self, project_root: str = None, budget_usd: float = None):
        self.project_root = Path(project_root or ".").resolve()
        self.usage_path = self.project_root / self.USAGE_FILE
        self.budget_usd = budget_usd
        self._request_timestamps: dict[str, list] = {}
        self._consecutive_failures: dict[str, int] = {}
        self._ensure_dirs()

    def _ensure_dirs(self):
        self.usage_path.parent.mkdir(parents=True, exist_ok=True)

    def _load_usage(self) -> dict:
        if not self.usage_path.exists():
            return self._default_usage()
        try:
            with open(self.usage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return self._default_usage()

    def _default_usage(self) -> dict:
        return {
            "session_id": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "started_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_cost_usd": 0.0,
            "budget_limit_usd": self.budget_usd,
            "budget_remaining_usd": self.budget_usd,
            "providers": {},
            "requests": [],
        }

    def _save_usage(self, usage: dict):
        usage["updated_at"] = datetime.now().isoformat()
        tmp = self.usage_path.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(usage, f, indent=2, ensure_ascii=False)
        tmp.replace(self.usage_path)

    def estimate_cost(self, provider: str, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for a given request."""
        costs = PROVIDER_COSTS.get(provider, {"input": 1.0, "output": 3.0})
        input_cost = (input_tokens / 1_000_000) * costs["input"]
        output_cost = (output_tokens / 1_000_000) * costs["output"]
        return round(input_cost + output_cost, 6)

    def record_usage(self, provider: str, input_tokens: int = 0, output_tokens: int = 0,
                     success: bool = True, task_id: str = None):
        """Record a completed API request."""
        cost = self.estimate_cost(provider, input_tokens, output_tokens)
        usage = self._load_usage()

        usage["total_input_tokens"] += input_tokens
        usage["total_output_tokens"] += output_tokens
        usage["total_cost_usd"] = round(usage["total_cost_usd"] + cost, 6)

        if usage["budget_limit_usd"] is not None:
            usage["budget_remaining_usd"] = round(
                usage["budget_limit_usd"] - usage["total_cost_usd"], 6
            )

        # Per-provider stats
        if provider not in usage["providers"]:
            usage["providers"][provider] = {
                "input_tokens": 0, "output_tokens": 0,
                "cost_usd": 0.0, "requests": 0,
                "failures": 0,
            }
        p = usage["providers"][provider]
        p["input_tokens"] += input_tokens
        p["output_tokens"] += output_tokens
        p["cost_usd"] = round(p["cost_usd"] + cost, 6)
        p["requests"] += 1
        if not success:
            p["failures"] += 1

        # Append request entry (keep last 500)
        usage["requests"].append({
            "ts": datetime.now().isoformat(),
            "provider": provider,
            "input": input_tokens,
            "output": output_tokens,
            "cost": cost,
            "success": success,
            "task_id": task_id,
        })
        usage["requests"] = usage["requests"][-500:]

        self._save_usage(usage)

        # Track for circuit breaker
        if success:
            self._consecutive_failures[provider] = 0
        else:
            self._consecutive_failures[provider] = \
                self._consecutive_failures.get(provider, 0) + 1

        return cost

    def check_budget(self) -> bool:
        """Returns True if within budget (or no budget set)."""
        usage = self._load_usage()
        limit = usage.get("budget_limit_usd") or self.budget_usd
        if limit is None:
            return True
        return usage["total_cost_usd"] < limit

    def get_budget_status(self) -> dict:
        """Get budget status summary."""
        usage = self._load_usage()
        limit = usage.get("budget_limit_usd") or self.budget_usd
        spent = usage["total_cost_usd"]
        return {
            "limit_usd": limit,
            "spent_usd": spent,
            "remaining_usd": round((limit or 0) - spent, 6) if limit else None,
            "percentage_used": round((spent / limit) * 100, 1) if limit else 0,
            "within_budget": spent < limit if limit else True,
        }

    def is_circuit_open(self, provider: str) -> bool:
        """Check if circuit breaker is tripped (too many failures)."""
        return self._consecutive_failures.get(provider, 0) >= self.MAX_CONSECUTIVE_FAILURES

    def get_backoff_seconds(self, provider: str) -> float:
        """Calculate exponential backoff delay."""
        failures = self._consecutive_failures.get(provider, 0)
        if failures == 0:
            return 0.0
        delay = min(
            self.BACKOFF_BASE_SECONDS * math.pow(2, failures - 1),
            self.BACKOFF_MAX_SECONDS,
        )
        return delay

    def wait_if_rate_limited(self, provider: str):
        """Wait if needed to respect rate limits."""
        now = time.time()
        limit = RATE_LIMITS.get(provider, 60)
        window = 60.0  # 1 minute window

        if provider not in self._request_timestamps:
            self._request_timestamps[provider] = []

        # Clean old timestamps
        self._request_timestamps[provider] = [
            ts for ts in self._request_timestamps[provider]
            if now - ts < window
        ]

        if len(self._request_timestamps[provider]) >= limit:
            oldest = self._request_timestamps[provider][0]
            wait_time = window - (now - oldest) + 0.5
            if wait_time > 0:
                time.sleep(wait_time)

        self._request_timestamps[provider].append(time.time())

    def reset_circuit(self, provider: str):
        """Manually reset circuit breaker for a provider."""
        self._consecutive_failures[provider] = 0

    def get_summary(self) -> dict:
        """Get usage summary."""
        usage = self._load_usage()
        return {
            "total_input_tokens": usage["total_input_tokens"],
            "total_output_tokens": usage["total_output_tokens"],
            "total_cost_usd": usage["total_cost_usd"],
            "budget": self.get_budget_status(),
            "providers": usage["providers"],
            "total_requests": len(usage["requests"]),
        }

    def reset(self):
        """Reset usage for new session."""
        usage = self._default_usage()
        self._save_usage(usage)
        self._request_timestamps.clear()
        self._consecutive_failures.clear()


# CLI interface
if __name__ == "__main__":
    import sys
    tm = TokenManager()

    if len(sys.argv) < 2:
        print("Usage: python3 token_manager.py <command>")
        print("  status  — Show token usage summary")
        print("  reset   — Reset usage for new session")
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd == "status":
        s = tm.get_summary()
        print(f"\n💰 Token Usage Summary")
        print(f"  Input:  {s['total_input_tokens']:,} tokens")
        print(f"  Output: {s['total_output_tokens']:,} tokens")
        print(f"  Cost:   ${s['total_cost_usd']:.4f}")
        print(f"  Requests: {s['total_requests']}")
        b = s["budget"]
        if b["limit_usd"]:
            bar_len = 20
            filled = int(bar_len * b["percentage_used"] / 100)
            bar = "█" * filled + "░" * (bar_len - filled)
            print(f"  Budget: [{bar}] {b['percentage_used']}% (${b['spent_usd']:.4f}/${b['limit_usd']:.2f})")
        print(f"\n  Per Provider:")
        for name, data in s["providers"].items():
            print(f"    {name}: {data['requests']} req, ${data['cost_usd']:.4f}, {data['failures']} failures")

    elif cmd == "reset":
        tm.reset()
        print("✅ Token usage reset")
