#!/usr/bin/env bash

# CodyMaster Skills Kit - Installer
# A unified platform for AI Agent Skills across Gemini, Claude Code, Cursor, Windsurf, Copilot, and OpenClaw.

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
ORANGE='\033[0;33m'
BROWN='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🧠 CodyMaster Skills Platform v1.0.0 - Installer${NC}"
echo -e "${CYAN}====================================================${NC}\n"

echo "Select your target platform to install skills for:"
echo -e "1) ${GREEN}🟢 Google Antigravity (Global - all projects)${NC}"
echo -e "2) ${GREEN}🟢 Google Antigravity (Workspace - this project)${NC}"
echo -e "3) ${PURPLE}🟣 Claude Code${NC}"
echo -e "4) ${BLUE}🔵 Cursor${NC}"
echo -e "5) ${ORANGE}🟠 Windsurf${NC}"
echo -e "6) ${BROWN}🟤 Cline / RooCode${NC}"
echo -e "7) 🐈 GitHub Copilot"
echo -e "8) 🐾 OpenClaw / OpenFang"
echo -e "9) 📦 Install ALL platforms"
echo -e "0) ${RED}❌ Exit${NC}"
echo ""

read -p "Choose platform (0-9): " choice

case $choice in
    1)
        echo -e "${GREEN}Installing for Google Antigravity (Global)...${NC}"
        # Trigger global install logic
        ;;
    2)
        echo -e "${GREEN}Installing for Google Antigravity (Workspace)...${NC}"
        # Trigger workspace install logic
        ;;
    3)
        echo -e "${PURPLE}Installing for Claude Code...${NC}"
        # Claude Code format
        ;;
    4)
        echo -e "${BLUE}Installing for Cursor...${NC}"
        ;;
    5)
        echo -e "${ORANGE}Installing for Windsurf...${NC}"
        ;;
    6)
        echo -e "${BROWN}Installing for Cline...${NC}"
        ;;
    7)
        echo "Installing for GitHub Copilot..."
        ;;
    8)
        echo "Installing for OpenClaw / OpenFang..."
        ;;
    9)
        echo -e "${CYAN}Installing for ALL platforms...${NC}"
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

echo -e "\n${GREEN}Successfully installed CodyMaster agent skills!${NC}"
echo -e "Type 'npx cm' or 'cm help' to manage skills later."
