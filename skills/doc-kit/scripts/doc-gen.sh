#!/bin/bash
# ============================================================
# Doc-Kit — Documentation Generator CLI
# Generates optimized prompts for Google Antigravity
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Header
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}📚 Doc-Kit — Documentation Generator${NC}        ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}Powered by Google Antigravity${NC}               ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Choose document type
echo -e "${BOLD}📑 Step 1: Document Type${NC}"
echo ""
echo -e "  ${GREEN}1)${NC} tech       — Technical docs (Architecture, DB, Deployment)"
echo -e "  ${GREEN}2)${NC} sop        — SOP User Guides (step-by-step)"
echo -e "  ${GREEN}3)${NC} api        — API Reference (endpoints, schemas)"
echo -e "  ${GREEN}4)${NC} all        — Full documentation suite"
echo ""
read -p "$(echo -e ${BLUE}Select [1-4]:${NC} )" DOC_CHOICE

case $DOC_CHOICE in
  1) DOC_TYPE="tech" ;;
  2) DOC_TYPE="sop" ;;
  3) DOC_TYPE="api" ;;
  4) DOC_TYPE="all" ;;
  *) echo -e "${RED}❌ Invalid choice${NC}"; exit 1 ;;
esac

echo ""

# Step 2: Choose output format
echo -e "${BOLD}🎨 Step 2: Output Format${NC}"
echo ""
echo -e "  ${GREEN}1)${NC} markdown   — Plain Markdown (simple, portable)"
echo -e "  ${GREEN}2)${NC} docusaurus — Docusaurus site (beautiful, searchable)"
echo ""
read -p "$(echo -e ${BLUE}Select [1-2]:${NC} )" FORMAT_CHOICE

case $FORMAT_CHOICE in
  1) FORMAT="markdown" ;;
  2) FORMAT="docusaurus" ;;
  *) echo -e "${RED}❌ Invalid choice${NC}"; exit 1 ;;
esac

echo ""

# Step 3: Source code path
echo -e "${BOLD}📂 Step 3: Source Code Path${NC}"
echo ""
read -p "$(echo -e ${BLUE}Path to project root:${NC} )" SOURCE_PATH

# Validate path
if [ ! -d "$SOURCE_PATH" ]; then
  echo -e "${RED}❌ Directory not found: $SOURCE_PATH${NC}"
  exit 1
fi

# Convert to absolute path
SOURCE_PATH=$(cd "$SOURCE_PATH" && pwd)

echo ""

# Step 4: Documentation language
echo -e "${BOLD}🌏 Step 4: Output Language${NC}"
echo ""
echo -e "  ${GREEN}1)${NC} en — English (default)"
echo -e "  ${GREEN}2)${NC} vi — Tiếng Việt"
echo ""
read -p "$(echo -e ${BLUE}Select [1-2] (Enter = English):${NC} )" LANG_CHOICE

case $LANG_CHOICE in
  2) DOC_LANG="Vietnamese" ;;
  *) DOC_LANG="English" ;;
esac

echo ""
echo -e "${CYAN}══════════════════════════════════════════════${NC}"
echo ""

# Generate prompt
PROMPT="Use the doc-kit skill to generate documentation for the project at: $SOURCE_PATH

Configuration:
- Document type: $DOC_TYPE
- Output format: $FORMAT
- Language: $DOC_LANG

Please refer to the skill file at skills/doc-kit/SKILL.md and execute the procedure.
Start from Step 2 (Analyze Codebase) since input parameters are already provided above."

echo -e "${BOLD}✅ Prompt successfully generated!${NC}"
echo ""
echo -e "${YELLOW}━━━ Copy the prompt below and paste it into Antigravity ━━━${NC}"
echo ""
echo -e "${GREEN}$PROMPT${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Copy to clipboard if pbcopy available (macOS)
if command -v pbcopy &> /dev/null; then
  echo "$PROMPT" | pbcopy
  echo -e "${GREEN}📋 Copied to clipboard! Paste (Cmd+V) into Antigravity.${NC}"
fi

echo ""
