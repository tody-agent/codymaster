#!/bin/bash
# ============================================================
# DocKit Master v2 — Task Runner (Orchestrator)
# Manages parallel doc generation with progress tracking
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; YELLOW='\033[1;33m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

# ── Helpers ─────────────────────────────────────────────────
log()  { echo -e "${DIM}$(date +%H:%M:%S)${NC} $1"; }
info() { log "${CYAN}ℹ${NC}  $1"; }
ok()   { log "${GREEN}✅${NC} $1"; }
warn() { log "${YELLOW}⚠️${NC}  $1"; }
err()  { log "${RED}❌${NC} $1"; }
step() { log "${MAGENTA}▶${NC}  ${BOLD}$1${NC}"; }

# ── Banner ──────────────────────────────────────────────────
show_banner() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}  ${BOLD}📚 DocKit Master v2 — Task Runner${NC}                  ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${DIM}Progress tracking • Multi-threading • Resume${NC}       ${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# ── Usage ───────────────────────────────────────────────────
show_usage() {
  show_banner
  echo -e "${BOLD}Usage:${NC}"
  echo "  dockit-runner.sh [options]"
  echo ""
  echo -e "${BOLD}Options:${NC}"
  echo "  -p, --project PATH     Project root path (required)"
  echo "  -t, --type TYPE        Doc type: knowledge|tech|sop|api|all (default: all)"
  echo "  -f, --format FORMAT    Output: markdown|astro (default: astro)"
  echo "  -l, --lang LANG        Language: vi|en|vi+en (default: vi)"
  echo "  -j, --jobs N           Max parallel tasks (default: 3)"
  echo "      --dry-run          Show task plan without executing"
  echo "      --resume           Resume from last _progress.json"
  echo "      --audit            Audit draft docs and promote to final"
  echo "      --no-draft         Skip draft, write directly to docs/"
  echo "      --engine ENGINE    gemini|antigravity (default: gemini)"
  echo "  -h, --help             Show this help"
  echo ""
  echo -e "${BOLD}Monitor Progress:${NC}"
  echo "  In a separate terminal, run:"
  echo -e "  ${GREEN}bash $SCRIPT_DIR/dockit-dashboard.sh /path/to/project${NC}"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo "  # Full docs for a project"
  echo "  dockit-runner.sh -p ./my-project -t all"
  echo ""
  echo "  # Resume interrupted run"
  echo "  dockit-runner.sh -p ./my-project --resume"
  echo ""
  echo "  # Audit and promote drafts"
  echo "  dockit-runner.sh -p ./my-project --audit"
}

# ── Default Config ──────────────────────────────────────────
PROJECT_PATH=""
DOC_TYPE="all"
FORMAT="astro"
LANGUAGE="vi"
MAX_JOBS=3
DRY_RUN=false
RESUME=false
AUDIT_MODE=false
NO_DRAFT=false
ENGINE="gemini"

# ── Parse Args ──────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--project)  PROJECT_PATH="$2"; shift 2 ;;
    -t|--type)     DOC_TYPE="$2"; shift 2 ;;
    -f|--format)   FORMAT="$2"; shift 2 ;;
    -l|--lang)     LANGUAGE="$2"; shift 2 ;;
    -j|--jobs)     MAX_JOBS="$2"; shift 2 ;;
    --dry-run)     DRY_RUN=true; shift ;;
    --resume)      RESUME=true; shift ;;
    --audit)       AUDIT_MODE=true; shift ;;
    --no-draft)    NO_DRAFT=true; shift ;;
    --engine)      ENGINE="$2"; shift 2 ;;
    -h|--help)     show_usage; exit 0 ;;
    *) err "Unknown option: $1"; show_usage; exit 1 ;;
  esac
done

# ── Validation ──────────────────────────────────────────────
if [[ -z "$PROJECT_PATH" ]]; then
  show_usage
  err "Project path is required (-p /path/to/project)"
  exit 1
fi

PROJECT_PATH="$(cd "$PROJECT_PATH" 2>/dev/null && pwd)" || {
  err "Directory not found: $PROJECT_PATH"
  exit 1
}

PROJECT_NAME="$(basename "$PROJECT_PATH")"
DRAFT_DIR="$PROJECT_PATH/docs/_draft"
FINAL_DIR="$PROJECT_PATH/docs"
PROGRESS_FILE="$PROJECT_PATH/docs/_progress.json"
LOG_FILE="$PROJECT_PATH/docs/_dockit.log"

# ── Check Engine ────────────────────────────────────────────
check_engine() {
  if [[ "$ENGINE" == "gemini" ]]; then
    if ! command -v gemini &>/dev/null; then
      warn "Gemini CLI not found. Install: npm install -g @anthropic-ai/gemini-cli"
      warn "Falling back to prompt-copy mode."
      ENGINE="prompt"
    else
      ok "Gemini CLI found: $(which gemini)"
    fi
  fi
}

# ── Progress JSON ───────────────────────────────────────────
init_progress() {
  mkdir -p "$DRAFT_DIR" "$(dirname "$PROGRESS_FILE")"
  
  if [[ "$RESUME" == true ]] && [[ -f "$PROGRESS_FILE" ]]; then
    info "Resuming from existing progress file"
    return
  fi

  cat > "$PROGRESS_FILE" << PJSON
{
  "project": "$PROJECT_NAME",
  "project_path": "$PROJECT_PATH",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "config": {
    "type": "$DOC_TYPE",
    "format": "$FORMAT",
    "language": "$LANGUAGE",
    "engine": "$ENGINE",
    "max_jobs": $MAX_JOBS
  },
  "tasks": [],
  "stats": { "total": 0, "done": 0, "running": 0, "pending": 0, "failed": 0 }
}
PJSON
  ok "Progress file initialized: $PROGRESS_FILE"
}

# Update a task in _progress.json (uses temp file for atomicity)
update_task() {
  local task_id="$1"
  local status="$2"
  local extra="${3:-}"  # optional JSON fields
  
  local now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local tmp="$PROGRESS_FILE.tmp"
  
  # Use Python for JSON manipulation (available on macOS)
  python3 -c "
import json, sys
with open('$PROGRESS_FILE', 'r') as f:
    data = json.load(f)

found = False
for t in data['tasks']:
    if t['id'] == '$task_id':
        t['status'] = '$status'
        if '$status' == 'running':
            t['started_at'] = '$now'
        elif '$status' in ('done', 'failed'):
            t['completed_at'] = '$now'
        if '$status' == 'failed' and '$extra':
            t['error'] = '$extra'
        t['attempts'] = t.get('attempts', 0) + (1 if '$status' == 'running' else 0)
        found = True
        break

# Recount stats
stats = {'total': len(data['tasks']), 'done': 0, 'running': 0, 'pending': 0, 'failed': 0}
for t in data['tasks']:
    s = t.get('status', 'pending')
    if s in stats:
        stats[s] += 1
data['stats'] = stats

with open('$tmp', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null && mv "$tmp" "$PROGRESS_FILE"
}

# Add a task to _progress.json
add_task() {
  local task_id="$1"
  local label="$2"
  local output_file="$3"
  local depends="${4:-}"
  
  python3 -c "
import json
with open('$PROGRESS_FILE', 'r') as f:
    data = json.load(f)

# Skip if already exists
if any(t['id'] == '$task_id' for t in data['tasks']):
    pass
else:
    data['tasks'].append({
        'id': '$task_id',
        'label': '$label',
        'status': 'pending',
        'output_file': '$output_file',
        'depends_on': '$depends' if '$depends' else None,
        'started_at': None,
        'completed_at': None,
        'attempts': 0,
        'error': None
    })
    data['stats']['total'] = len(data['tasks'])
    data['stats']['pending'] = sum(1 for t in data['tasks'] if t['status'] == 'pending')

with open('$PROGRESS_FILE', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null
}

# ── Task Planning ───────────────────────────────────────────
plan_tasks() {
  step "Planning tasks for type=$DOC_TYPE"
  
  local output_base="$DRAFT_DIR"
  [[ "$NO_DRAFT" == true ]] && output_base="$FINAL_DIR"
  
  # Phase 0: Always analyze
  add_task "analysis" "📊 Codebase Analysis" "$output_base/analysis.md" ""

  if [[ "$DOC_TYPE" == "knowledge" || "$DOC_TYPE" == "all" ]]; then
    add_task "personas" "👥 Personas" "$output_base/personas/index.md" "analysis"
    add_task "jtbd"     "🎯 JTBD Canvases" "$output_base/jtbd/index.md" "analysis"
    add_task "flows"    "🔄 Process Flows" "$output_base/flows/index.md" "analysis"
  fi

  if [[ "$DOC_TYPE" == "tech" || "$DOC_TYPE" == "all" ]]; then
    add_task "architecture" "🏗️ Architecture" "$output_base/architecture.md" "analysis"
    add_task "database"     "🗄️ Database Schema" "$output_base/database.md" "analysis"
    add_task "deployment"   "🚀 Deployment Guide" "$output_base/deployment.md" "analysis"
    add_task "data-flow"    "📡 Data Flow" "$output_base/data-flow.md" "analysis"
  fi

  if [[ "$DOC_TYPE" == "sop" || "$DOC_TYPE" == "all" ]]; then
    # SOPs depend on knowledge being done first
    local sop_dep="analysis"
    [[ "$DOC_TYPE" == "all" ]] && sop_dep="personas"
    add_task "sop-index" "📋 SOP Index" "$output_base/sop/index.md" "$sop_dep"
    # Individual SOPs will be discovered from codebase analysis
    add_task "sop-modules" "📋 SOP Modules (batch)" "$output_base/sop/" "$sop_dep"
  fi

  if [[ "$DOC_TYPE" == "api" || "$DOC_TYPE" == "all" ]]; then
    add_task "api-reference" "📡 API Reference" "$output_base/api/index.md" "analysis"
  fi

  if [[ "$FORMAT" == "astro" ]]; then
    add_task "astro-site" "⭐ Astro Starlight Site" "$PROJECT_PATH/docs-site/" "sop-modules,api-reference"
  fi

  local total
  total=$(python3 -c "import json; d=json.load(open('$PROGRESS_FILE')); print(d['stats']['total'])")
  ok "Planned $total tasks"
}

# ── Task Execution ──────────────────────────────────────────
run_task() {
  local task_id="$1"
  
  # Get task info
  local task_label task_output task_status
  task_label=$(python3 -c "import json; d=json.load(open('$PROGRESS_FILE')); t=[x for x in d['tasks'] if x['id']=='$task_id'][0]; print(t['label'])")
  task_output=$(python3 -c "import json; d=json.load(open('$PROGRESS_FILE')); t=[x for x in d['tasks'] if x['id']=='$task_id'][0]; print(t['output_file'])")
  task_status=$(python3 -c "import json; d=json.load(open('$PROGRESS_FILE')); t=[x for x in d['tasks'] if x['id']=='$task_id'][0]; print(t['status'])")
  
  # Skip already done tasks (for resume)
  if [[ "$task_status" == "done" ]]; then
    info "Skipping $task_id (already done)"
    return 0
  fi

  step "[$task_id] $task_label"
  update_task "$task_id" "running"
  
  # Create output directory
  mkdir -p "$(dirname "$task_output")"
  
  # Run via dockit-task.sh
  if bash "$SCRIPT_DIR/dockit-task.sh" \
    --task-id "$task_id" \
    --project "$PROJECT_PATH" \
    --output "$task_output" \
    --engine "$ENGINE" \
    --skill-dir "$SKILL_DIR" \
    --language "$LANGUAGE" \
    >> "$LOG_FILE" 2>&1; then
    
    update_task "$task_id" "done"
    ok "[$task_id] ✓ Completed → $(basename "$task_output")"
    return 0
  else
    local exit_code=$?
    update_task "$task_id" "failed" "exit_code=$exit_code"
    err "[$task_id] ✗ Failed (exit $exit_code). Check: $LOG_FILE"
    return 1
  fi
}

# Get tasks ready to run (pending + all deps done)
get_ready_tasks() {
  python3 -c "
import json
with open('$PROGRESS_FILE', 'r') as f:
    data = json.load(f)

done_ids = {t['id'] for t in data['tasks'] if t['status'] == 'done'}

for t in data['tasks']:
    if t['status'] != 'pending':
        continue
    deps = t.get('depends_on') or ''
    dep_ids = [d.strip() for d in deps.split(',') if d.strip()]
    if all(d in done_ids for d in dep_ids):
        print(t['id'])
" 2>/dev/null
}

# Count running tasks
count_running() {
  python3 -c "import json; d=json.load(open('$PROGRESS_FILE')); print(sum(1 for t in d['tasks'] if t['status']=='running'))" 2>/dev/null
}

# Check if all done
all_done() {
  python3 -c "
import json
d = json.load(open('$PROGRESS_FILE'))
pending = sum(1 for t in d['tasks'] if t['status'] in ('pending', 'running'))
print('yes' if pending == 0 else 'no')
" 2>/dev/null
}

# ── Parallel Execution Loop ────────────────────────────────
run_all_tasks() {
  step "Starting execution (max $MAX_JOBS parallel)"
  echo "" >> "$LOG_FILE"
  echo "═══ DocKit Master v2 — Run started $(date) ═══" >> "$LOG_FILE"
  
  local pids=()
  local pid_tasks=()
  
  while true; do
    # Reap finished background jobs
    local new_pids=()
    local new_pid_tasks=()
    for i in "${!pids[@]}"; do
      if kill -0 "${pids[$i]}" 2>/dev/null; then
        new_pids+=("${pids[$i]}")
        new_pid_tasks+=("${pid_tasks[$i]}")
      fi
    done
    pids=("${new_pids[@]}" 2>/dev/null || true)
    pid_tasks=("${new_pid_tasks[@]}" 2>/dev/null || true)
    
    # Check if all done
    if [[ "$(all_done)" == "yes" ]]; then
      break
    fi
    
    # Launch ready tasks up to MAX_JOBS
    local running="${#pids[@]}"
    if (( running < MAX_JOBS )); then
      local ready_tasks
      ready_tasks=$(get_ready_tasks)
      
      for task_id in $ready_tasks; do
        if (( ${#pids[@]} >= MAX_JOBS )); then
          break
        fi
        
        run_task "$task_id" &
        local pid=$!
        pids+=("$pid")
        pid_tasks+=("$task_id")
        info "Launched [$task_id] (PID $pid)"
      done
    fi
    
    # If nothing ready and nothing running, we might be stuck
    if [[ -z "$(get_ready_tasks)" ]] && (( ${#pids[@]} == 0 )); then
      local has_failed
      has_failed=$(python3 -c "import json; d=json.load(open('$PROGRESS_FILE')); print('yes' if any(t['status']=='failed' for t in d['tasks']) else 'no')")
      if [[ "$has_failed" == "yes" ]]; then
        err "Some tasks failed and are blocking others. Run with --resume to retry."
        break
      fi
    fi
    
    sleep 2
  done
  
  # Wait for all remaining
  for pid in "${pids[@]}"; do
    wait "$pid" 2>/dev/null || true
  done
}

# ── Audit Mode ──────────────────────────────────────────────
run_audit() {
  step "Auditing draft documents"
  
  if [[ ! -d "$DRAFT_DIR" ]]; then
    err "No draft directory found: $DRAFT_DIR"
    exit 1
  fi
  
  local count=0
  while IFS= read -r file; do
    count=$((count + 1))
  done < <(find "$DRAFT_DIR" -name "*.md" -type f 2>/dev/null)
  
  info "Found $count draft files"
  echo ""
  echo -e "${BOLD}Draft files:${NC}"
  find "$DRAFT_DIR" -name "*.md" -type f | sort | while read -r f; do
    local size
    size=$(wc -c < "$f" | tr -d ' ')
    local rel="${f#"$DRAFT_DIR/"}"
    echo -e "  ${GREEN}✓${NC} $rel ${DIM}(${size}B)${NC}"
  done
  
  echo ""
  echo -e "${YELLOW}Review the files in: $DRAFT_DIR${NC}"
  echo ""
  read -p "$(echo -e "${BLUE}Promote all drafts to final? [y/N]:${NC} ")" confirm
  
  if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
    step "Promoting drafts to final"
    # Copy while preserving structure (skip _draft and _progress files)
    find "$DRAFT_DIR" -name "*.md" -type f | while read -r f; do
      local rel="${f#"$DRAFT_DIR/"}"
      local dest="$FINAL_DIR/$rel"
      mkdir -p "$(dirname "$dest")"
      cp "$f" "$dest"
      ok "  $rel"
    done
    ok "All drafts promoted to docs/"
  else
    info "Cancelled. Drafts remain in _draft/"
  fi
}

# ── Dry Run ─────────────────────────────────────────────────
show_dry_run() {
  echo ""
  echo -e "${BOLD}📋 Task Plan (dry-run):${NC}"
  echo ""
  
  python3 -c "
import json
with open('$PROGRESS_FILE', 'r') as f:
    data = json.load(f)

print(f'  Project:  {data[\"project\"]}')
print(f'  Type:     {data[\"config\"][\"type\"]}')
print(f'  Format:   {data[\"config\"][\"format\"]}')
print(f'  Language: {data[\"config\"][\"language\"]}')
print(f'  Engine:   {data[\"config\"][\"engine\"]}')
print(f'  Jobs:     {data[\"config\"][\"max_jobs\"]}')
print()

# Build dependency graph
done_ids = set()
waves = []
tasks_by_id = {t['id']: t for t in data['tasks']}
remaining = list(data['tasks'])

while remaining:
    wave = []
    for t in remaining:
        deps = [d.strip() for d in (t.get('depends_on') or '').split(',') if d.strip()]
        if all(d in done_ids for d in deps):
            wave.append(t)
    if not wave:
        break
    waves.append(wave)
    for t in wave:
        done_ids.add(t['id'])
        remaining.remove(t)

for i, wave in enumerate(waves):
    parallel = '∥' if len(wave) > 1 else '→'
    print(f'  Wave {i+1} ({parallel} {len(wave)} tasks):')
    for t in wave:
        deps = t.get('depends_on') or '-'
        print(f'    {t[\"label\"]:30s}  deps={deps}')
    print()

print(f'  Total: {len(data[\"tasks\"])} tasks in {len(waves)} waves')
" 2>/dev/null
  
  echo ""
  echo -e "${DIM}Run without --dry-run to execute.${NC}"
}

# ── Show Pre-run Guide ──────────────────────────────────────
show_monitor_guide() {
  echo ""
  echo -e "${CYAN}━━━ 📊 Cách theo dõi tiến trình ━━━${NC}"
  echo ""
  echo -e "  ${BOLD}1.${NC} Mở terminal mới và chạy dashboard:"
  echo -e "     ${GREEN}bash $SCRIPT_DIR/dockit-dashboard.sh $PROJECT_PATH${NC}"
  echo ""
  echo -e "  ${BOLD}2.${NC} Hoặc xem log trực tiếp:"
  echo -e "     ${GREEN}tail -f $LOG_FILE${NC}"
  echo ""
  echo -e "  ${BOLD}3.${NC} Xem progress JSON:"
  echo -e "     ${GREEN}cat $PROGRESS_FILE | python3 -m json.tool${NC}"
  echo ""
  echo -e "  ${BOLD}4.${NC} Nếu bị ngắt giữa chừng, resume bằng:"
  echo -e "     ${GREEN}bash $SCRIPT_DIR/dockit-runner.sh -p $PROJECT_PATH --resume${NC}"
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# ── Print Summary ───────────────────────────────────────────
show_summary() {
  echo ""
  echo -e "${CYAN}━━━ 📊 Summary ━━━${NC}"
  python3 -c "
import json
with open('$PROGRESS_FILE', 'r') as f:
    data = json.load(f)
s = data['stats']
print(f'  ✅ Done:    {s[\"done\"]}')
print(f'  ❌ Failed:  {s[\"failed\"]}')
print(f'  📊 Total:   {s[\"total\"]}')
print()
for t in data['tasks']:
    icon = {'done':'✅','failed':'❌','running':'⏳','pending':'⏸️'}.get(t['status'],'❓')
    print(f'  {icon} {t[\"label\"]:30s} {t[\"status\"]}')
" 2>/dev/null
  echo ""
  
  if [[ "$NO_DRAFT" == false ]]; then
    echo -e "  📁 Draft files: ${GREEN}$DRAFT_DIR${NC}"
    echo -e "  Run ${GREEN}--audit${NC} to review and promote to final."
  fi
  echo -e "  📋 Progress:  ${GREEN}$PROGRESS_FILE${NC}"
  echo -e "  📝 Log:       ${GREEN}$LOG_FILE${NC}"
  echo ""
}

# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

show_banner

# Handle audit mode
if [[ "$AUDIT_MODE" == true ]]; then
  run_audit
  exit 0
fi

# Setup
check_engine
init_progress
plan_tasks

# Dry run?
if [[ "$DRY_RUN" == true ]]; then
  show_dry_run
  exit 0
fi

# Show monitoring guide
show_monitor_guide

# Confirm
read -p "$(echo -e "${BLUE}Start generating documentation? [Y/n]:${NC} ")" start_confirm
if [[ "$start_confirm" == "n" || "$start_confirm" == "N" ]]; then
  info "Cancelled."
  exit 0
fi

# Execute
echo ""
step "Starting DocKit Master v2..."
echo ""

run_all_tasks
show_summary
