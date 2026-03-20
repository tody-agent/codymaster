#!/bin/bash
# ============================================================
# DocKit Master v2 — Progress Dashboard
# Real-time terminal dashboard for monitoring doc generation
# ============================================================
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; YELLOW='\033[1;33m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
BG_GREEN='\033[42m'; BG_RED='\033[41m'; BG_YELLOW='\033[43m'
BG_BLUE='\033[44m'; BG_DIM='\033[100m'

# ── Args ────────────────────────────────────────────────────
PROJECT_PATH="${1:-}"
REFRESH="${2:-5}"  # Refresh interval in seconds

if [[ -z "$PROJECT_PATH" ]]; then
  echo "Usage: dockit-dashboard.sh /path/to/project [refresh_seconds]"
  echo ""
  echo "  Monitors DocKit Master progress in real-time."
  echo "  Default refresh: 5 seconds. Press Ctrl+C to stop."
  exit 1
fi

PROJECT_PATH="$(cd "$PROJECT_PATH" 2>/dev/null && pwd)" || {
  echo "Directory not found: $PROJECT_PATH"
  exit 1
}

PROGRESS_FILE="$PROJECT_PATH/docs/_progress.json"

# ── Render Dashboard ────────────────────────────────────────
render() {
  clear
  
  if [[ ! -f "$PROGRESS_FILE" ]]; then
    echo -e "${YELLOW}⏳ Waiting for DocKit Master to start...${NC}"
    echo -e "${DIM}Looking for: $PROGRESS_FILE${NC}"
    return
  fi

  python3 << 'PYEOF'
import json, sys, os
from datetime import datetime, timezone

progress_file = os.environ.get("PROGRESS_FILE", "")
try:
    with open(progress_file, 'r') as f:
        data = json.load(f)
except Exception as e:
    print(f"\033[1;33m⏳ Waiting for valid progress data...\033[0m")
    sys.exit(0)

# Colors
C = '\033[0;36m'; G = '\033[0;32m'; R = '\033[0;31m'; Y = '\033[1;33m'
B = '\033[1m'; D = '\033[2m'; N = '\033[0m'; M = '\033[0;35m'
BG_G = '\033[42m'; BG_R = '\033[41m'; BG_Y = '\033[43m'; BG_B = '\033[44m'; BG_D = '\033[100m'

config = data.get('config', {})
stats = data.get('stats', {})
tasks = data.get('tasks', [])
total = stats.get('total', 0)
done = stats.get('done', 0)
running = stats.get('running', 0)
failed = stats.get('failed', 0)
pending = stats.get('pending', 0)

# Header
print(f"\n{C}╔══════════════════════════════════════════════════════╗{N}")
print(f"{C}║{N}  {B}📊 DocKit Master v2 — Dashboard{N}                     {C}║{N}")
print(f"{C}╚══════════════════════════════════════════════════════╝{N}")

# Config
print(f"\n  {D}Project:{N}  {B}{data.get('project', '?')}{N}")
print(f"  {D}Type:{N}     {config.get('type', '?')}   {D}Format:{N} {config.get('format', '?')}   {D}Lang:{N} {config.get('language', '?')}")
print(f"  {D}Engine:{N}   {config.get('engine', '?')}   {D}Jobs:{N} {config.get('max_jobs', '?')}")

# Progress bar
pct = int(done / total * 100) if total > 0 else 0
bar_width = 40
filled = int(bar_width * done / total) if total > 0 else 0
bar = '█' * filled + '░' * (bar_width - filled)
color = G if pct == 100 else (Y if pct > 50 else C)
print(f"\n  {color}{bar}{N}  {B}{pct}%{N}  ({done}/{total})")

# Stats cards
print(f"\n  {BG_G} ✅ Done: {done} {N}  {BG_Y} ⏳ Running: {running} {N}  {BG_D} ⏸️ Pending: {pending} {N}  {BG_R} ❌ Failed: {failed} {N}")

# Task table
print(f"\n  {B}{'#':>3}  {'Status':^8}  {'Task':<32}  {'Time':>8}{N}")
print(f"  {'─'*3}  {'─'*8}  {'─'*32}  {'─'*8}")

for i, t in enumerate(tasks):
    status = t.get('status', 'pending')
    icon = {'done': f'{G}✅ Done{N}', 'running': f'{Y}⏳ Run {N}', 'pending': f'{D}⏸️ Wait{N}', 'failed': f'{R}❌ Fail{N}'}.get(status, '❓')
    label = t.get('label', t.get('id', '?'))[:32]
    
    # Calculate duration
    dur = ''
    if t.get('started_at'):
        try:
            start = datetime.fromisoformat(t['started_at'].replace('Z', '+00:00'))
            if t.get('completed_at'):
                end = datetime.fromisoformat(t['completed_at'].replace('Z', '+00:00'))
            else:
                end = datetime.now(timezone.utc)
            secs = int((end - start).total_seconds())
            if secs < 60:
                dur = f'{secs}s'
            else:
                dur = f'{secs//60}m{secs%60}s'
        except:
            dur = ''
    
    print(f"  {i+1:>3}  {icon}  {label:<32}  {D}{dur:>8}{N}")

# Errors
failed_tasks = [t for t in tasks if t.get('error')]
if failed_tasks:
    print(f"\n  {R}{B}Errors:{N}")
    for t in failed_tasks:
        print(f"    {R}• {t['label']}: {t['error']}{N}")

# Footer
print(f"\n  {D}Last updated: {datetime.now().strftime('%H:%M:%S')}   Refresh: {os.environ.get('REFRESH', '5')}s   Ctrl+C to stop{N}")
if pct == 100:
    print(f"\n  {G}{B}🎉 All tasks completed! Run --audit to review and finalize.{N}")
print()
PYEOF
}

# ── Main Loop ───────────────────────────────────────────────
export PROGRESS_FILE REFRESH

trap 'echo -e "\n${DIM}Dashboard closed.${NC}"; exit 0' INT

while true; do
  render
  sleep "$REFRESH"
done
