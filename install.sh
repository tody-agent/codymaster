#!/usr/bin/env bash

# CodyMaster Skills Kit v3.3.0 - Universal Installer
# Supports: Claude Code, Gemini CLI, Cursor, Codex, OpenCode, and manual copy
#
# Non-interactive flags:
#   --claude    Print Claude Code plugin install instructions and exit
#   --all       Print instructions for all platforms and exit

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
ORANGE='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

REPO_URL="https://github.com/tody-agent/codymaster"
VERSION="3.3.0"

echo -e "${CYAN}${BOLD}🧠 CodyMaster Skills Platform v${VERSION}${NC}"
echo -e "${CYAN}=====================================================${NC}"

# ── Non-interactive flags ───────────────────────────────────────────────────
if [[ "$1" == "--claude" ]]; then
  echo ""
  echo -e "${PURPLE}${BOLD}Claude Code — Install Cody Master${NC}"
  echo ""
  echo "Open Claude Code and run these 2 commands:"
  echo ""
  echo -e "  ${BOLD}Step 1:${NC} Add the marketplace"
  echo -e "  ${CYAN}claude plugin marketplace add tody-agent/codymaster${NC}"
  echo ""
  echo -e "  ${BOLD}Step 2:${NC} Install all 33+ skills in one go"
  echo -e "  ${CYAN}claude plugin install cody-master@cody-master${NC}"
  echo ""
  echo -e "${GREEN}${BOLD}✅ Done!${NC} — 33+ skills available in Claude Code"
  echo -e "Documentation: ${CYAN}https://codymaster.pages.dev/docs${NC}"
  exit 0
fi

if [[ "$1" == "--all" ]]; then
  echo ""
  echo -e "${PURPLE}${BOLD}Claude Code:${NC}"
  echo -e "  ${CYAN}claude plugin marketplace add tody-agent/codymaster${NC}"
  echo -e "  ${CYAN}claude plugin install cody-master@cody-master${NC}"
  echo ""
  echo -e "${CYAN}${BOLD}Gemini CLI:${NC}"
  echo -e "  ${CYAN}gemini extensions install ${REPO_URL}${NC}"
  echo ""
  echo -e "${BLUE}${BOLD}Cursor:${NC}"
  echo -e "  ${CYAN}/add-plugin cody-master${NC}"
  echo ""
  echo -e "${ORANGE}${BOLD}Codex:${NC}"
  echo -e "  Tell Codex: Fetch and follow ${REPO_URL}/raw/main/.codex/INSTALL.md"
  echo ""
  echo -e "${GREEN}${BOLD}✅ Done!${NC}"
  echo -e "Documentation: ${CYAN}https://codymaster.pages.dev/docs${NC}"
  exit 0
fi

# ── Interactive menu ────────────────────────────────────────────────────────
echo ""
echo "Select installation method:"
echo ""
echo -e "  ${PURPLE}${BOLD}1) 🟣 Claude Code (Recommended)${NC}"
echo -e "  ${CYAN}2) 💎 Gemini CLI (Extension)${NC}"
echo -e "  ${GREEN}3) 🟢 Antigravity / Gemini (Global skills)${NC}"
echo -e "  ${GREEN}4) 🟢 Antigravity / Gemini (Workspace skills)${NC}"
echo -e "  ${BLUE}5) 🔵 Cursor (Plugin Marketplace)${NC}"
echo -e "  ${ORANGE}6) 🟠 Codex${NC}"
echo -e "  7) 📦 OpenCode"
echo -e "  8) 📋 Manual copy (any platform)"
echo -e "  0) ${RED}❌ Exit${NC}"
echo ""

read -p "Choose (0-8): " choice

case $choice in
    1)
        echo ""
        echo -e "${PURPLE}${BOLD}Claude Code — Marketplace Install${NC}"
        echo ""
        echo "Run these commands in Claude Code:"
        echo ""
        echo -e "  ${BOLD}Step 1:${NC} Add marketplace"
        echo -e "  ${CYAN}claude plugin marketplace add tody-agent/codymaster${NC}"
        echo ""
        echo -e "  ${BOLD}Step 2:${NC} Install all 33+ skills"
        echo -e "  ${CYAN}claude plugin install cody-master@cody-master${NC}"
        ;;
    2)
        echo ""
        echo -e "${CYAN}${BOLD}Gemini CLI — Extension Install${NC}"
        echo ""
        echo "Run:"
        echo -e "  ${CYAN}gemini extensions install ${REPO_URL}${NC}"
        echo ""
        echo "To update:"
        echo -e "  ${CYAN}gemini extensions update cody-master${NC}"
        ;;
    3)
        echo ""
        echo -e "${GREEN}${BOLD}Antigravity / Gemini — Global Install${NC}"
        echo ""
        SKILLS_DIR="${HOME}/.gemini/antigravity/skills"
        if [ ! -d "skills" ]; then
            echo "Error: Run this from the cody-master repo root."
            exit 1
        fi
        mkdir -p "${SKILLS_DIR}"
        for skill_dir in skills/*/; do
            skill_name=$(basename "$skill_dir")
            if [ -f "${skill_dir}SKILL.md" ]; then
                cp -r "$skill_dir" "${SKILLS_DIR}/${skill_name}"
                echo -e "  ✅ ${skill_name}"
            fi
        done
        echo ""
        echo -e "${GREEN}Skills installed to ${SKILLS_DIR}${NC}"
        ;;
    4)
        echo ""
        echo -e "${GREEN}${BOLD}Antigravity / Gemini — Workspace Install${NC}"
        echo ""
        read -p "Target project path: " PROJECT_DIR
        if [ ! -d "$PROJECT_DIR" ]; then
            echo "Error: Directory not found."
            exit 1
        fi
        SKILLS_DIR="${PROJECT_DIR}/.gemini/skills"
        mkdir -p "${SKILLS_DIR}"
        for skill_dir in skills/*/; do
            skill_name=$(basename "$skill_dir")
            if [ -f "${skill_dir}SKILL.md" ]; then
                cp -r "$skill_dir" "${SKILLS_DIR}/${skill_name}"
                echo -e "  ✅ ${skill_name}"
            fi
        done
        echo ""
        echo -e "${GREEN}Skills installed to ${SKILLS_DIR}${NC}"
        ;;
    5)
        echo ""
        echo -e "${BLUE}${BOLD}Cursor — Plugin Install${NC}"
        echo ""
        echo "In Cursor Agent chat, run:"
        echo -e "  ${CYAN}/add-plugin cody-master${NC}"
        echo ""
        echo "Or search for \"cody-master\" in the plugin marketplace."
        ;;
    6)
        echo ""
        echo -e "${ORANGE}${BOLD}Codex — Install${NC}"
        echo ""
        echo "Tell Codex:"
        echo -e "  ${CYAN}Fetch and follow instructions from ${REPO_URL}/raw/main/.codex/INSTALL.md${NC}"
        ;;
    7)
        echo ""
        echo -e "${BOLD}OpenCode — Install${NC}"
        echo ""
        echo "Tell OpenCode:"
        echo -e "  ${CYAN}Fetch and follow instructions from ${REPO_URL}/raw/main/.opencode/INSTALL.md${NC}"
        ;;
    8)
        echo ""
        echo -e "${BOLD}Manual Copy — Any Platform${NC}"
        echo ""
        echo "Copy skills to your platform's skills directory:"
        echo ""
        echo -e "  ${CYAN}# Gemini/Antigravity"
        echo -e "  cp -r skills/* ~/.gemini/skills/${NC}"
        echo ""
        echo -e "  ${CYAN}# OpenCode"
        echo -e "  cp -r skills/* .opencode/skills/${NC}"
        echo ""
        echo -e "  ${CYAN}# Cursor"
        echo -e "  cp -r skills/* .cursor/skills/${NC}"
        echo ""
        echo -e "  ${CYAN}# Codex"
        echo -e "  cp -r skills/* .codex/skills/${NC}"
        echo ""
        echo -e "  ${CYAN}# Kiro"
        echo -e "  cp -r skills/* .kiro/skills/${NC}"
        ;;
    0)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}${BOLD}✅ Done!${NC}"
echo -e "Documentation: ${CYAN}https://codymaster.pages.dev/docs${NC}"
