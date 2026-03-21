#!/usr/bin/env bash

# CodyMaster Skills Kit v3.3.0 - Universal Installer
# Supports: Claude Code, Gemini CLI, Cursor, Codex, OpenCode, and manual copy

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
ORANGE='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

REPO_URL="https://github.com/tody-agent/cody-master"
VERSION="3.3.0"

echo -e "${CYAN}${BOLD}🧠 CodyMaster Skills Platform v${VERSION}${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo ""
echo "Select installation method:"
echo ""
echo -e "  ${PURPLE}${BOLD}1) 🟣 Claude Code (Marketplace — recommended)${NC}"
echo -e "  ${PURPLE}2) 🟣 Claude Code (Individual plugins)${NC}"
echo -e "  ${CYAN}3) 💎 Gemini CLI (Extension)${NC}"
echo -e "  ${GREEN}4) 🟢 Antigravity / Gemini (Global skills)${NC}"
echo -e "  ${GREEN}5) 🟢 Antigravity / Gemini (Workspace skills)${NC}"
echo -e "  ${BLUE}6) 🔵 Cursor (Plugin Marketplace)${NC}"
echo -e "  ${ORANGE}7) 🟠 Codex${NC}"
echo -e "  8) 📦 OpenCode"
echo -e "  9) 📋 Manual copy (any platform)"
echo -e "  0) ${RED}❌ Exit${NC}"
echo ""

read -p "Choose (0-9): " choice

case $choice in
    1)
        echo ""
        echo -e "${PURPLE}${BOLD}Claude Code — Marketplace Install${NC}"
        echo ""
        echo "Run these commands in Claude Code:"
        echo ""
        echo -e "  ${BOLD}Step 1:${NC} Add marketplace"
        echo -e "  ${CYAN}claude plugin marketplace add tody-agent/cody-master${NC}"
        echo ""
        echo -e "  ${BOLD}Step 2:${NC} Install all plugins"
        echo -e "  ${CYAN}claude plugin install cm-engineering@cody-master${NC}"
        echo -e "  ${CYAN}claude plugin install cm-operations@cody-master${NC}"
        echo -e "  ${CYAN}claude plugin install cm-product@cody-master${NC}"
        echo -e "  ${CYAN}claude plugin install cm-growth@cody-master${NC}"
        echo -e "  ${CYAN}claude plugin install cm-orchestration@cody-master${NC}"
        echo ""
        echo -e "  ${BOLD}Or install individual plugins as needed.${NC}"
        ;;
    2)
        echo ""
        echo -e "${PURPLE}${BOLD}Claude Code — Pick Plugins${NC}"
        echo ""
        echo "Available plugins:"
        echo -e "  ${BOLD}cm-engineering${NC}    — TDD, debugging, quality gates, code review"
        echo -e "  ${BOLD}cm-operations${NC}     — Deploy, identity guard, git worktrees, secrets, i18n"
        echo -e "  ${BOLD}cm-product${NC}        — Planning, brainstorm, UX/UI, bootstrap, docs"
        echo -e "  ${BOLD}cm-growth${NC}         — Content factory, ads tracking, CRO"
        echo -e "  ${BOLD}cm-orchestration${NC}  — Execution, continuity, skill chaining"
        echo ""
        echo "First add the marketplace:"
        echo -e "  ${CYAN}claude plugin marketplace add tody-agent/cody-master${NC}"
        echo ""
        echo "Then install the plugins you want:"
        echo -e "  ${CYAN}claude plugin install cm-engineering@cody-master${NC}"
        ;;
    3)
        echo ""
        echo -e "${CYAN}${BOLD}Gemini CLI — Extension Install${NC}"
        echo ""
        echo "Run:"
        echo -e "  ${CYAN}gemini extensions install ${REPO_URL}${NC}"
        echo ""
        echo "To update:"
        echo -e "  ${CYAN}gemini extensions update cody-master${NC}"
        ;;
    4)
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
    5)
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
    6)
        echo ""
        echo -e "${BLUE}${BOLD}Cursor — Plugin Install${NC}"
        echo ""
        echo "In Cursor Agent chat, run:"
        echo -e "  ${CYAN}/add-plugin cody-master${NC}"
        echo ""
        echo "Or search for \"cody-master\" in the plugin marketplace."
        ;;
    7)
        echo ""
        echo -e "${ORANGE}${BOLD}Codex — Install${NC}"
        echo ""
        echo "Tell Codex:"
        echo -e "  ${CYAN}Fetch and follow instructions from ${REPO_URL}/raw/main/.codex/INSTALL.md${NC}"
        ;;
    8)
        echo ""
        echo -e "${BOLD}OpenCode — Install${NC}"
        echo ""
        echo "Tell OpenCode:"
        echo -e "  ${CYAN}Fetch and follow instructions from ${REPO_URL}/raw/main/.opencode/INSTALL.md${NC}"
        ;;
    9)
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
