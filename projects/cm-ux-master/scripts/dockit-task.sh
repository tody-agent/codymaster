#!/bin/bash
# ============================================================
# DocKit Master v2 — Task Worker
# Executes a single documentation generation task
# ============================================================
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

log() { echo -e "${DIM}$(date +%H:%M:%S)${NC} [task:${TASK_ID:-?}] $1"; }

# ── Parse Args ──────────────────────────────────────────────
TASK_ID=""
PROJECT_PATH=""
OUTPUT_PATH=""
ENGINE="gemini"
SKILL_DIR=""
LANGUAGE="vi"

while [[ $# -gt 0 ]]; do
  case $1 in
    --task-id)   TASK_ID="$2"; shift 2 ;;
    --project)   PROJECT_PATH="$2"; shift 2 ;;
    --output)    OUTPUT_PATH="$2"; shift 2 ;;
    --engine)    ENGINE="$2"; shift 2 ;;
    --skill-dir) SKILL_DIR="$2"; shift 2 ;;
    --language)  LANGUAGE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [[ -z "$TASK_ID" || -z "$PROJECT_PATH" || -z "$OUTPUT_PATH" ]]; then
  echo "Usage: dockit-task.sh --task-id ID --project PATH --output PATH --engine ENGINE --skill-dir DIR"
  exit 1
fi

PROMPTS_DIR="${SKILL_DIR}/prompts"
PROJECT_NAME="$(basename "$PROJECT_PATH")"

# ── Prompt Builder ──────────────────────────────────────────
build_prompt() {
  local prompt_file="$PROMPTS_DIR/${TASK_ID}.md"
  
  if [[ -f "$prompt_file" ]]; then
    # Load from prompts directory and substitute variables
    sed -e "s|{{PROJECT_PATH}}|$PROJECT_PATH|g" \
        -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
        -e "s|{{OUTPUT_PATH}}|$OUTPUT_PATH|g" \
        -e "s|{{LANGUAGE}}|$LANGUAGE|g" \
        "$prompt_file"
  else
    # Fallback: generate a generic prompt
    cat << PROMPT
You are DocKit Master, a documentation generator.

Task: Generate the "$TASK_ID" documentation for the project at: $PROJECT_PATH

Language: $LANGUAGE
Output file: $OUTPUT_PATH

Instructions:
1. Scan the project codebase thoroughly
2. Generate comprehensive documentation
3. Write the output as a Markdown file
4. Include YAML frontmatter with title, description, keywords
5. Use Mermaid diagrams where helpful
6. Include tables for structured data

Write the complete file content for: $OUTPUT_PATH
PROMPT
  fi
}

# ── Execute via Gemini CLI ──────────────────────────────────
run_gemini() {
  local prompt
  prompt="$(build_prompt)"
  
  log "Running via Gemini CLI..."
  
  # Create temp prompt file
  local tmp_prompt="/tmp/dockit-prompt-${TASK_ID}-$$.md"
  echo "$prompt" > "$tmp_prompt"
  
  # Run Gemini CLI
  # The exact command depends on Gemini CLI version
  local result_file="/tmp/dockit-result-${TASK_ID}-$$.md"
  
  if command -v gemini &>/dev/null; then
    # Try Gemini CLI with file output
    gemini -p "$(cat "$tmp_prompt")" > "$result_file" 2>/dev/null
    
    if [[ -f "$result_file" ]] && [[ -s "$result_file" ]]; then
      mkdir -p "$(dirname "$OUTPUT_PATH")"
      cp "$result_file" "$OUTPUT_PATH"
      log "✅ Output written to: $OUTPUT_PATH"
      rm -f "$tmp_prompt" "$result_file"
      return 0
    fi
  fi
  
  # Fallback: save prompt for manual execution
  log "⚠️ Gemini CLI execution failed. Saving prompt for manual use."
  mkdir -p "$(dirname "$OUTPUT_PATH")"
  echo "<!-- DOCKIT: Task $TASK_ID - Prompt saved, needs manual execution -->" > "$OUTPUT_PATH"
  echo "<!-- Run: gemini -p \"\$(cat $tmp_prompt)\" > $OUTPUT_PATH -->" >> "$OUTPUT_PATH"
  cat "$tmp_prompt" >> "$OUTPUT_PATH"
  rm -f "$result_file"
  return 1
}

# ── Execute via Prompt Copy ─────────────────────────────────
run_prompt_copy() {
  local prompt
  prompt="$(build_prompt)"
  
  log "Saving prompt for manual execution..."
  mkdir -p "$(dirname "$OUTPUT_PATH")"
  
  # Save the prompt
  local prompt_save="$PROJECT_PATH/docs/_prompts/${TASK_ID}.md"
  mkdir -p "$(dirname "$prompt_save")"
  echo "$prompt" > "$prompt_save"
  
  # Create placeholder output
  cat > "$OUTPUT_PATH" << PLACEHOLDER
---
title: "$TASK_ID (pending)"
description: "This document needs to be generated manually"
---

# $TASK_ID

> ⚠️ This document was not auto-generated. Run the prompt manually:
> \`$prompt_save\`

Paste the prompt into Gemini CLI or Antigravity to generate this document.
PLACEHOLDER

  log "Prompt saved: $prompt_save"
  return 0  # Don't fail, just mark as needing manual work
}

# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

log "Starting task: $TASK_ID"
log "Project: $PROJECT_PATH"
log "Output: $OUTPUT_PATH"
log "Engine: $ENGINE"

case "$ENGINE" in
  gemini)
    run_gemini
    ;;
  prompt|*)
    run_prompt_copy
    ;;
esac

exit_code=$?
log "Task $TASK_ID finished with exit code $exit_code"
exit $exit_code
