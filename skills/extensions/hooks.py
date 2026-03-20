#!/usr/bin/env python3
"""
Hook System — Pre/post phase hook execution for Content Factory pipeline.

Hooks are Python scripts registered in content-factory.config.json under
extensions.hooks. Each hook receives the config file path as argument.

Usage in custom hook scripts:
    import sys, json
    config_path = sys.argv[1]
    with open(config_path) as f:
        config = json.load(f)
    # ... your hook logic
"""

import json
import sys
import subprocess
from pathlib import Path


def load_hooks(config_path: str) -> dict:
    """Load hook registry from config."""
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    return config.get("extensions", {}).get("hooks", {})


def fire(hook_name: str, config_path: str, project_root: str = None) -> list:
    """
    Execute all registered hooks for a given hook point.

    Args:
        hook_name: e.g., "pre_write", "post_publish"
        config_path: Path to content-factory.config.json
        project_root: Project root directory (defaults to config parent)

    Returns:
        List of (script, success, output) tuples
    """
    hooks = load_hooks(config_path)
    scripts = hooks.get(hook_name, [])

    if not scripts:
        return []

    if not project_root:
        project_root = str(Path(config_path).resolve().parent)

    results = []
    for script in scripts:
        script_path = Path(project_root) / script
        if not script_path.exists():
            results.append((script, False, f"Not found: {script_path}"))
            continue

        try:
            result = subprocess.run(
                ["python3", str(script_path), config_path],
                cwd=project_root,
                capture_output=True, text=True,
                timeout=300  # 5 min per hook
            )
            results.append((script, result.returncode == 0, result.stdout[:500]))
        except subprocess.TimeoutExpired:
            results.append((script, False, "Timeout (5 min)"))
        except Exception as e:
            results.append((script, False, str(e)))

    return results


def list_hooks(config_path: str) -> dict:
    """List all registered hooks with their status."""
    hooks = load_hooks(config_path)
    project_root = Path(config_path).resolve().parent
    status = {}

    for hook_name, scripts in hooks.items():
        status[hook_name] = []
        for script in scripts:
            exists = (project_root / script).exists()
            status[hook_name].append({
                "script": script,
                "exists": exists,
                "path": str(project_root / script)
            })

    return status


# Convenience hook points
HOOK_POINTS = [
    "pre_extract", "post_extract",
    "pre_plan", "post_plan",
    "pre_write", "post_write",
    "pre_audit", "post_audit",
    "pre_seo", "post_seo",
    "pre_publish", "post_publish",
]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 hooks.py <config_path> [hook_name]")
        print(f"\nAvailable hook points: {', '.join(HOOK_POINTS)}")
        sys.exit(1)

    config_path = sys.argv[1]
    if len(sys.argv) > 2:
        hook_name = sys.argv[2]
        results = fire(hook_name, config_path)
        for script, ok, output in results:
            icon = "✅" if ok else "❌"
            print(f"  {icon} {script}: {output[:100]}")
    else:
        status = list_hooks(config_path)
        print("🔗 Registered Hooks:")
        for hook_name, scripts in status.items():
            if scripts:
                print(f"\n  {hook_name}:")
                for s in scripts:
                    icon = "✅" if s["exists"] else "❌"
                    print(f"    {icon} {s['script']}")
        if not any(status.values()):
            print("  (none registered)")
