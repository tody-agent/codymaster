#!/usr/bin/env python3
"""
Content Factory Pipeline — Master orchestrator for the AI Content Factory.

Reads content-factory.config.json and executes phases:
  extract → plan → write → audit → seo → publish

Usage:
    python3 .agents/skills/content-factory/scripts/pipeline.py                    # Run full pipeline
    python3 .agents/skills/content-factory/scripts/pipeline.py --phase extract    # Run single phase
    python3 .agents/skills/content-factory/scripts/pipeline.py --validate-config  # Validate config
    python3 .agents/skills/content-factory/scripts/pipeline.py --dry-run          # Preview actions
    python3 .agents/skills/content-factory/scripts/pipeline.py --test-hooks       # Test hook system
    python3 .agents/skills/content-factory/scripts/pipeline.py --status           # Show pipeline status
"""

import json
import sys
import os
import subprocess
import argparse
import threading
from pathlib import Path
from datetime import datetime

# State integration
try:
    from state_manager import StateManager
    HAS_STATE = True
except ImportError:
    HAS_STATE = False

# Resolve paths
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = Path(os.getcwd()).resolve()
CONFIG_FILE = PROJECT_ROOT / "content-factory.config.json"
SCHEMA_FILE = SKILL_DIR / "config.schema.json"

PHASES = ["extract", "plan", "write", "audit", "seo", "publish"]


def load_config() -> dict:
    """Load and return the project config."""
    if not CONFIG_FILE.exists():
        print(f"❌ Config not found: {CONFIG_FILE}")
        print("   Create content-factory.config.json in project root.")
        print(f"   See examples in: {SKILL_DIR / 'examples/'}")
        sys.exit(1)

    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_config(config: dict) -> bool:
    """Validate config structure (basic validation without jsonschema dep)."""
    required_keys = ["niche", "brand", "content", "sources", "output"]
    missing = [k for k in required_keys if k not in config]
    if missing:
        print(f"❌ Missing required config keys: {', '.join(missing)}")
        return False

    if "name" not in config.get("brand", {}):
        print("❌ Missing brand.name in config")
        return False

    if "article_types" not in config.get("content", {}):
        print("❌ Missing content.article_types in config")
        return False

    if "type" not in config.get("sources", {}) or "path" not in config.get("sources", {}):
        print("❌ Missing sources.type or sources.path in config")
        return False

    if "content_dir" not in config.get("output", {}):
        print("❌ Missing output.content_dir in config")
        return False

    print("✅ Config validation passed")
    return True


def fire_hooks(config: dict, hook_name: str):
    """Execute registered hooks for a phase."""
    hooks = config.get("extensions", {}).get("hooks", {}).get(hook_name, [])
    if not hooks:
        return

    print(f"  🔗 Running {hook_name} hooks ({len(hooks)})...")
    for hook_script in hooks:
        hook_path = PROJECT_ROOT / hook_script
        if hook_path.exists():
            try:
                result = subprocess.run(
                    ["python3", str(hook_path), str(CONFIG_FILE)],
                    cwd=str(PROJECT_ROOT),
                    capture_output=True, text=True, timeout=300
                )
                if result.returncode == 0:
                    print(f"    ✅ {hook_script}")
                else:
                    print(f"    ⚠️ {hook_script}: {result.stderr[:200]}")
            except Exception as e:
                print(f"    ❌ {hook_script}: {e}")
        else:
            print(f"    ⚠️ Hook not found: {hook_script}")


def run_phase(phase: str, config: dict, dry_run: bool = False, extra_args: list = None,
              state_manager: 'StateManager' = None):
    """Run a single pipeline phase."""
    script_path = SCRIPT_DIR / f"{phase}.py"
    if not script_path.exists():
        print(f"❌ Phase script not found: {script_path}")
        if state_manager:
            state_manager.update_phase(phase, "failed", error=f"Script not found: {phase}.py")
        return False

    # Emit state: phase starting
    if state_manager:
        state_manager.update_phase(phase, "running", progress=0.0)

    # Fire pre-hook
    fire_hooks(config, f"pre_{phase}")

    cmd = ["python3", str(script_path), "--config", str(CONFIG_FILE)]
    if dry_run:
        cmd.append("--dry-run")
    if extra_args:
        cmd.extend(extra_args)

    print(f"\n{'═' * 50}")
    print(f"  Phase: {phase.upper()}")
    print(f"{'═' * 50}")

    if dry_run:
        print(f"  [DRY RUN] Would execute: {' '.join(cmd)}")
        if state_manager:
            state_manager.update_phase(phase, "done", progress=1.0)
        fire_hooks(config, f"post_{phase}")
        return True

    try:
        result = subprocess.run(
            cmd, cwd=str(PROJECT_ROOT),
            timeout=3600  # 1h max per phase
        )
        success = result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"  ❌ Phase {phase} timed out (1h limit)")
        success = False
    except Exception as e:
        print(f"  ❌ Phase {phase} error: {e}")
        success = False

    # Emit state: phase result
    if state_manager:
        if success:
            state_manager.update_phase(phase, "done", progress=1.0)
        else:
            state_manager.update_phase(phase, "failed", error=f"Phase {phase} failed")

    # Fire post-hook
    fire_hooks(config, f"post_{phase}")

    return success


def show_status(config: dict):
    """Show current pipeline status."""
    print(f"\n{'═' * 60}")
    print(f"  🏭 Content Factory — Status Report")
    print(f"{'═' * 60}")
    print(f"  Niche:     {config['niche']}")
    print(f"  Brand:     {config['brand']['name']}")
    print(f"  Language:  {config['brand'].get('language', 'vi')}")
    print(f"  AI:        {config.get('pipeline', {}).get('ai_provider', 'gemini-cli')}")
    print(f"  Parallel:  {config.get('pipeline', {}).get('concurrency', 1)}")
    print()

    # Knowledge-base status
    kb_dir = PROJECT_ROOT / config["output"].get("knowledge_dir", "knowledge-base/")
    if kb_dir.exists():
        groups = [d for d in kb_dir.iterdir() if d.is_dir()]
        index = kb_dir / "index.json"
        disease_count = 0
        if index.exists():
            with open(index) as f:
                idx = json.load(f)
                disease_count = idx.get("total_diseases", len(idx.get("groups", [])))
        print(f"  📚 Knowledge-base: {len(groups)} groups, {disease_count} entries")
    else:
        print(f"  📚 Knowledge-base: Not yet created")

    # Topics queue status
    queue_dir = PROJECT_ROOT / config["output"].get("queue_dir", "topics-queue/")
    if queue_dir.exists():
        batches = list(queue_dir.glob("*.json"))
        total_topics = 0
        for b in batches:
            with open(b) as f:
                data = json.load(f)
                total_topics += len(data.get("topics", []))
        print(f"  📋 Topics queue: {len(batches)} batches, {total_topics} topics")
    else:
        print(f"  📋 Topics queue: Not yet created")

    # Content status
    content_dir = PROJECT_ROOT / config["output"]["content_dir"]
    if content_dir.exists():
        articles = list(content_dir.glob("*.md"))
        print(f"  📄 Content: {len(articles)} articles")
    else:
        print(f"  📄 Content: Not yet created")

    # Extensions
    ext = config.get("extensions", {})
    hooks_count = sum(len(v) for v in ext.get("hooks", {}).values())
    openclaw = "✅ enabled" if ext.get("openclaw", {}).get("enabled") else "⬜ disabled"
    print(f"  🔗 Hooks: {hooks_count} registered")
    print(f"  🐙 OpenClaw: {openclaw}")

    print(f"\n{'═' * 60}\n")


def test_hooks(config: dict):
    """Test that all registered hooks exist and are executable."""
    print("🧪 Testing hooks...")
    hooks = config.get("extensions", {}).get("hooks", {})
    all_ok = True
    for hook_name, scripts in hooks.items():
        for script in scripts:
            path = PROJECT_ROOT / script
            if path.exists():
                print(f"  ✅ {hook_name}: {script}")
            else:
                print(f"  ❌ {hook_name}: {script} — NOT FOUND")
                all_ok = False
    if not hooks or all(not v for v in hooks.values()):
        print("  ⬜ No hooks registered")
    return all_ok


def start_dashboard(port: int = 5050):
    """Start dashboard server in background thread."""
    dashboard_script = SCRIPT_DIR / "dashboard_server.py"
    if not dashboard_script.exists():
        print(f"  ⚠️ Dashboard not found: {dashboard_script}")
        return None

    import subprocess as sp
    proc = sp.Popen(
        ["python3", str(dashboard_script), "--port", str(port)],
        cwd=str(PROJECT_ROOT),
    )
    return proc


def main():
    parser = argparse.ArgumentParser(
        description="Content Factory Pipeline — Master orchestrator"
    )
    parser.add_argument("--phase", choices=PHASES, help="Run single phase")
    parser.add_argument("--validate-config", action="store_true", help="Validate config only")
    parser.add_argument("--dry-run", action="store_true", help="Preview without executing")
    parser.add_argument("--test-hooks", action="store_true", help="Test hook system")
    parser.add_argument("--status", action="store_true", help="Show pipeline status")
    parser.add_argument("--from-phase", choices=PHASES, help="Start pipeline from phase")
    parser.add_argument("--batch", type=int, default=10, help="Batch size for write phase")
    parser.add_argument("--group", help="Filter by group code")
    parser.add_argument("--dashboard", action="store_true", help="Auto-start dashboard server")
    parser.add_argument("--dashboard-port", type=int, default=5050, help="Dashboard port")
    parser.add_argument("--budget", type=float, help="Max budget in USD")
    args = parser.parse_args()

    config = load_config()

    if args.validate_config:
        sys.exit(0 if validate_config(config) else 1)

    if args.status:
        show_status(config)
        return

    if args.test_hooks:
        sys.exit(0 if test_hooks(config) else 1)

    if not validate_config(config):
        sys.exit(1)

    # Initialize state manager
    sm = None
    if HAS_STATE:
        sm = StateManager(str(PROJECT_ROOT))
        sm.reset()
        sm.log_event("info", f"Pipeline started for {config['brand']['name']}")
        if args.budget:
            sm.set_budget(args.budget)

    # Start dashboard
    dashboard_proc = None
    if args.dashboard:
        dashboard_proc = start_dashboard(args.dashboard_port)
        if dashboard_proc:
            print(f"  🌐 Dashboard: http://localhost:{args.dashboard_port}")

    print(f"\n🏭 Content Factory Pipeline — {config['brand']['name']}")
    print(f"   Niche: {config['niche']}")
    print(f"   Started: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    # Determine phases to run
    if args.phase:
        phases = [args.phase]
    elif args.from_phase:
        start_idx = PHASES.index(args.from_phase)
        phases = PHASES[start_idx:]
    else:
        phases = PHASES

    # Build extra args per phase
    extra = {}
    if args.batch:
        extra["write"] = ["--batch", str(args.batch)]
    if args.group:
        for p in phases:
            extra.setdefault(p, []).extend(["--group", args.group])

    # Execute
    results = {}
    for phase in phases:
        phase_extra = extra.get(phase, [])
        success = run_phase(phase, config, args.dry_run, phase_extra, state_manager=sm)
        results[phase] = success
        if not success and not args.dry_run:
            print(f"\n❌ Pipeline stopped at phase: {phase}")
            break

    # Summary
    print(f"\n{'═' * 50}")
    print(f"  📊 PIPELINE SUMMARY")
    print(f"{'═' * 50}")
    for phase, ok in results.items():
        icon = "✅" if ok else "❌"
        print(f"  {icon} {phase.upper()}")
    print(f"{'═' * 50}")
    print(f"  Finished: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    if sm:
        sm.log_event("info", "Pipeline finished")

    # Stop dashboard if we started it
    if dashboard_proc:
        dashboard_proc.terminate()


if __name__ == "__main__":
    main()
