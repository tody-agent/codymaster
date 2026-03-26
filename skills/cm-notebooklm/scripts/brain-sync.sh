#!/bin/bash
# brain-sync.sh — CodyMaster NotebookLM Brain Sync Engine
# Compile → Hash → Upload → Verify
#
# Usage:
#   bash brain-sync.sh compile          # Compile brain.md locally
#   bash brain-sync.sh upload           # Upload brain.md to NotebookLM
#   bash brain-sync.sh sync             # Compile + upload if changed
#   bash brain-sync.sh lesson "title"   # Add lesson interactively
#   bash brain-sync.sh status           # Show brain status
#   bash brain-sync.sh init             # First-time setup

set -euo pipefail

# --- Config ---
BRAIN_DIR="${HOME}/.codymaster"
BRAIN_FILE="${BRAIN_DIR}/brain.md"
LESSONS_FILE="${BRAIN_DIR}/lessons.md"
EXPERIENCES_FILE="${BRAIN_DIR}/experiences.md"
HASH_FILE="${BRAIN_DIR}/.brain-hash"
SKILLS_DIR="${HOME}/.gemini/antigravity/skills"
NOTEBOOK_ALIAS="codymaster"
GRADUATED_FILE="${BRAIN_DIR}/graduated_wisdom.md"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRADUATE_SCRIPT="${SCRIPT_DIR}/graduate_wisdom.py"

# --- Helpers ---
info()  { echo "🧠 $*"; }
warn()  { echo "⚠️  $*"; }
error() { echo "❌ $*" >&2; exit 1; }

ensure_dir() {
  mkdir -p "$BRAIN_DIR"
}

check_nlm() {
  command -v nlm &>/dev/null || error "nlm not installed. Run: uv tool install notebooklm-mcp-cli"
}

check_auth() {
  nlm auth status &>/dev/null || {
    warn "Session expired. Running nlm login..."
    nlm login
  }
}

current_hash() {
  [ -f "$BRAIN_FILE" ] && md5 -q "$BRAIN_FILE" 2>/dev/null || echo "none"
}

saved_hash() {
  [ -f "$HASH_FILE" ] && cat "$HASH_FILE" || echo "none"
}

save_hash() {
  current_hash > "$HASH_FILE"
}

# --- Commands ---

cmd_graduate() {
  info "Graduating proven wisdom from local .cm/ folder..."
  python3 "$GRADUATE_SCRIPT" || warn "Graduation script encountered an error."
}

cmd_compile() {
  ensure_dir
  info "Compiling brain.md..."

  cat > "$BRAIN_FILE" << 'HEADER'
# CodyMaster Brain
> Auto-compiled knowledge base. Do not edit directly.
> Re-compile with: bash brain-sync.sh compile

HEADER

  echo "Generated: $(date +%Y-%m-%d' '%H:%M)" >> "$BRAIN_FILE"
  echo "" >> "$BRAIN_FILE"

  # Section 1: Skill Index (names + descriptions only)
  echo "---" >> "$BRAIN_FILE"
  echo "# Skill Index" >> "$BRAIN_FILE"
  echo "" >> "$BRAIN_FILE"

  local count=0
  for skill_dir in "$SKILLS_DIR"/*/; do
    [ -d "$skill_dir" ] || continue
    local name=$(basename "$skill_dir")
    local file="$skill_dir/SKILL.md"
    [ -f "$file" ] || continue

    # Extract description from frontmatter
    local desc=$(awk '/^description:/{found=1; sub(/^description: */, ""); print; next} found && /^  /{print; next} found{exit}' "$file" | head -3)
    echo "## $name" >> "$BRAIN_FILE"
    echo "$desc" >> "$BRAIN_FILE"
    echo "" >> "$BRAIN_FILE"
    count=$((count + 1))
  done
  info "  → $count skills indexed"

  # Section 2: Lessons Learned
  if [ -f "$LESSONS_FILE" ]; then
    echo "---" >> "$BRAIN_FILE"
    echo "# Lessons Learned" >> "$BRAIN_FILE"
    echo "" >> "$BRAIN_FILE"
    cat "$LESSONS_FILE" >> "$BRAIN_FILE"
    local lesson_count=$(grep -c "^## Lesson:" "$LESSONS_FILE" 2>/dev/null || echo 0)
    info "  → $lesson_count lessons included"
  fi

  # Section 3: Coding Experiences
  if [ -f "$EXPERIENCES_FILE" ]; then
    echo "---" >> "$BRAIN_FILE"
    echo "# Coding Experiences" >> "$BRAIN_FILE"
    echo "" >> "$BRAIN_FILE"
    cat "$EXPERIENCES_FILE" >> "$BRAIN_FILE"
    local exp_count=$(grep -c "^## Experience:" "$EXPERIENCES_FILE" 2>/dev/null || echo 0)
    info "  → $exp_count experiences included"
  fi

  # Section 3b: Graduated Project Wisdom
  if [ -f "$GRADUATED_FILE" ]; then
    echo "---" >> "$BRAIN_FILE"
    echo "# Graduated Project Wisdom" >> "$BRAIN_FILE"
    echo "" >> "$BRAIN_FILE"
    cat "$GRADUATED_FILE" >> "$BRAIN_FILE"
    local grad_count=$(grep -c "\*\*ID:\*\*" "$GRADUATED_FILE" 2>/dev/null || echo 0)
    info "  → $grad_count graduated items included"
  fi

  # Section 4: Project identity (if exists)
  local agents_file="$SKILLS_DIR/AGENTS.md"
  if [ -f "$agents_file" ]; then
    echo "---" >> "$BRAIN_FILE"
    echo "# Project Identity" >> "$BRAIN_FILE"
    echo "" >> "$BRAIN_FILE"
    cat "$agents_file" >> "$BRAIN_FILE"
  fi

  local size=$(wc -c < "$BRAIN_FILE" | tr -d ' ')
  local lines=$(wc -l < "$BRAIN_FILE" | tr -d ' ')
  info "Compiled: $BRAIN_FILE ($lines lines, ${size} bytes)"

  # Check if changed
  if [ "$(current_hash)" = "$(saved_hash)" ]; then
    info "No changes since last upload."
  else
    info "Changes detected. Run 'brain-sync.sh upload' to sync to cloud."
  fi
}

cmd_upload() {
  check_nlm
  check_auth

  [ -f "$BRAIN_FILE" ] || error "brain.md not found. Run 'brain-sync.sh compile' first."

  # Check if changed
  if [ "$(current_hash)" = "$(saved_hash)" ]; then
    info "No changes. Skipping upload."
    return 0
  fi

  info "Uploading brain.md to NotebookLM..."

  # Check if source already exists (by title match)
  local existing=$(nlm source list "$NOTEBOOK_ALIAS" --quiet 2>/dev/null | head -1)

  if [ -n "$existing" ]; then
    # Delete old brain source and re-add (NotebookLM has no update API)
    info "Replacing existing brain source..."
    # We search by title to find the right source
    local source_id=$(nlm source list "$NOTEBOOK_ALIAS" --json 2>/dev/null | \
      python3 -c "import sys,json; sources=json.load(sys.stdin); [print(s['id']) for s in sources if 'CodyMaster Brain' in s.get('title','')]" 2>/dev/null | head -1)
    if [ -n "$source_id" ]; then
      nlm source delete "$source_id" --confirm 2>/dev/null || true
      sleep 2
    fi
  fi

  nlm source add "$NOTEBOOK_ALIAS" \
    --text "$(cat "$BRAIN_FILE")" \
    --title "CodyMaster Brain — Compiled Knowledge"

  save_hash
  info "Upload complete! Hash: $(current_hash)"
}

cmd_sync() {
  cmd_graduate
  cmd_compile
  if [ "$(current_hash)" != "$(saved_hash)" ]; then
    echo ""
    read -p "🔄 Changes detected. Upload to NotebookLM? [Y/n] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
      cmd_upload
    else
      info "Skipped upload. brain.md saved locally."
    fi
  fi
}

cmd_lesson() {
  ensure_dir
  local title="${1:-}"

  if [ -z "$title" ]; then
    read -p "📝 Lesson title: " title
  fi

  [ -z "$title" ] && error "Title required."

  cat >> "$LESSONS_FILE" << EOF

## Lesson: $title
**Date:** $(date +%Y-%m-%d)
**Context:** 
**Problem:** 
**Root Cause:** 
**Solution:** 
**Prevention:** 
**Tags:** 
EOF

  info "Lesson template added to $LESSONS_FILE"
  info "Edit the file, then run 'brain-sync.sh sync' to upload."
  echo "  → $LESSONS_FILE"
}

cmd_experience() {
  ensure_dir
  local title="${1:-}"

  if [ -z "$title" ]; then
    read -p "💡 Experience title: " title
  fi

  [ -z "$title" ] && error "Title required."

  cat >> "$EXPERIENCES_FILE" << EOF

## Experience: $title
**Date:** $(date +%Y-%m-%d)
**Stack:** 
**Pattern:** 
**When to Use:** 
**Pitfalls:** 
EOF

  info "Experience template added to $EXPERIENCES_FILE"
  info "Edit the file, then run 'brain-sync.sh sync' to upload."
  echo "  → $EXPERIENCES_FILE"
}

cmd_status() {
  ensure_dir
  echo "🧠 CodyMaster Brain Status"
  echo "=========================="

  if [ -f "$BRAIN_FILE" ]; then
    local size=$(wc -c < "$BRAIN_FILE" | tr -d ' ')
    local lines=$(wc -l < "$BRAIN_FILE" | tr -d ' ')
    echo "📄 brain.md:     $lines lines, $size bytes"
    echo "🔑 Local hash:   $(current_hash)"
    echo "🔑 Synced hash:  $(saved_hash)"
    if [ "$(current_hash)" = "$(saved_hash)" ]; then
      echo "✅ Status:       In sync"
    else
      echo "🔄 Status:       Changes pending"
    fi
  else
    echo "📄 brain.md:     Not compiled yet"
  fi

  echo ""
  if [ -f "$LESSONS_FILE" ]; then
    local lc=$(grep -c "^## Lesson:" "$LESSONS_FILE" 2>/dev/null || echo 0)
    echo "📝 Lessons:      $lc"
  else
    echo "📝 Lessons:      0"
  fi

  if [ -f "$EXPERIENCES_FILE" ]; then
    local ec=$(grep -c "^## Experience:" "$EXPERIENCES_FILE" 2>/dev/null || echo 0)
    echo "💡 Experiences:  $ec"
  else
    echo "💡 Experiences:  0"
  fi

  echo ""
  local skill_count=$(find "$SKILLS_DIR" -maxdepth 2 -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
  echo "📦 Skills found: $skill_count"

  if [ -f "$GRADUATED_FILE" ]; then
    local gc=$(grep -c "\*\*ID:\*\*" "$GRADUATED_FILE" 2>/dev/null || echo 0)
    echo "🎓 Graduated:    $gc items"
  else
    echo "🎓 Graduated:    0 items"
  fi

  # NLM status (if available)
  if command -v nlm &>/dev/null; then
    echo ""
    echo "--- NotebookLM ---"
    nlm auth status 2>/dev/null && echo "🔐 Auth: Active" || echo "🔐 Auth: Expired (run nlm login)"
  fi
}

cmd_init() {
  check_nlm
  ensure_dir

  info "First-time setup..."

  # 1. Login
  check_auth

  # 2. Create notebook
  info "Creating CodyMaster Brain notebook..."
  local nb_id=$(nlm notebook create "CodyMaster Brain" --quiet 2>/dev/null)
  if [ -z "$nb_id" ]; then
    error "Failed to create notebook. Check nlm auth."
  fi

  # 3. Set alias
  nlm alias set codymaster "$nb_id"
  info "Alias set: codymaster → $nb_id"

  # 4. Compile & upload
  cmd_compile
  cmd_upload

  info "✅ Setup complete! Your master brain is ready."
  echo ""
  echo "Quick commands:"
  echo "  brain-sync.sh status    — Check status"
  echo "  brain-sync.sh lesson    — Add lesson learned"
  echo "  brain-sync.sh sync      — Recompile & upload"
  echo "  brain-sync.sh init-project — Create a project-specific brain (Dual-Brain)"
  echo "  nlm notebook query codymaster 'your question'"
}

cmd_init_project() {
  check_nlm
  check_auth
  
  local project_name="${PWD##*/}"
  info "Initializing Project Brain for: $project_name"
  
  mkdir -p .cm
  if [ -f ".cm/notebook_id" ]; then
    warn "Project Brain already initialized. ID: $(cat .cm/notebook_id)"
    return 0
  fi
  
  local output=$(nlm notebook create "Project $project_name" 2>/dev/null)
  
  # output has format:
  # ✓ Created notebook: Project test
  #   ID: 7a97...
  local nb_id=$(echo "$output" | grep "ID:" | awk '{print $2}')
  
  if [ -z "$nb_id" ]; then
    error "Failed to create Project Brain. Output: $output"
  fi
  
  echo "$nb_id" > .cm/notebook_id
  info "✅ Project Brain created! ID saved in .cm/notebook_id"
  echo "Use 'brain-sync.sh sync-project' to upload your local docs."
}

cmd_sync_project() {
  check_nlm
  check_auth
  
  [ -f ".cm/notebook_id" ] || error "Project Brain not initialized. Run 'init-project' first."
  local nb_id=$(cat .cm/notebook_id)
  
  info "Compiling project documents..."
  local temp_compile=".cm/project_context.md"
  mkdir -p .cm
  
  echo "# Project Context: ${PWD##*/}" > "$temp_compile"
  echo "Compiled: $(date +%Y-%m-%d' '%H:%M)" >> "$temp_compile"
  echo "" >> "$temp_compile"
  
  local doc_count=0
  
  # Search for docs and READMEs
  for md in $(find . -maxdepth 3 -type f -name "*.md" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/.cm/*" 2>/dev/null); do
    echo "## File: $md" >> "$temp_compile"
    cat "$md" >> "$temp_compile"
    echo "" >> "$temp_compile"
    doc_count=$((doc_count + 1))
  done
  
  info "  → $doc_count markdown files compiled."
  if [ $doc_count -eq 0 ]; then
    warn "No local markdown files found to sync."
    return 0
  fi
  
  info "Uploading Context to Project Brain ($nb_id)..."
  
  # Delete old Project Context source and re-add 
  local existing=$(nlm source list "$nb_id" --quiet 2>/dev/null | head -1)
  if [ -n "$existing" ]; then
    local source_id=$(nlm source list "$nb_id" --json 2>/dev/null | \
      python3 -c "import sys,json; sources=json.load(sys.stdin); [print(s['id']) for s in sources if 'Project Context' in s.get('title','')]" 2>/dev/null | head -1)
    if [ -n "$source_id" ]; then
      nlm source delete "$source_id" --confirm 2>/dev/null || true
      sleep 2
    fi
  fi
  
  nlm source add "$nb_id" \
    --text "$(cat "$temp_compile")" \
    --title "Project Context — Local Docs"
    
  info "✅ Project Brain synced successfully!"
}

# --- Main ---
case "${1:-help}" in
  graduate)     cmd_graduate ;;
  init-project) cmd_init_project ;;
  sync-project) cmd_sync_project ;;
  compile)      cmd_compile ;;
  upload)     cmd_upload ;;
  sync)       cmd_sync ;;
  lesson)     cmd_lesson "${2:-}" ;;
  experience) cmd_experience "${2:-}" ;;
  status)     cmd_status ;;
  init)       cmd_init ;;
  *)
    echo "🧠 CodyMaster Brain Sync"
    echo ""
    echo "Usage: brain-sync.sh <command>"
    echo ""
    echo "Commands:"
    echo "  init          First-time setup (create master notebook + compile + upload)"
    echo "  init-project  Create an isolated Project Brain for the current directory"
    echo "  graduate      Extract proven local learnings & decisions to global limits"
    echo "  compile       Compile brain.md from skills + lessons + experiences"
    echo "  upload        Upload brain.md to NotebookLM"
    echo "  sync          Compile + upload if changed (asks confirmation)"
    echo "  sync-project  Merge local markdown files and push to isolated Project Brain"
    echo "  lesson        Add a lesson learned"
    echo "  experience  Add a coding experience"
    echo "  status      Show brain status"
    ;;
esac
