#!/usr/bin/env bash
# CodyMaster - Deprecated Installer
# This script has been intentionally retained to provide legacy users with update instructions.

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${RED}${BOLD}🛑 DEPRECATED: The monolithic install.sh script has been removed.${NC}\n"

echo -e "To make CodyMaster more robust, we have migrated to ${BOLD}Native Plugin Extensions${NC} for AI agents."
echo -e "You no longer need to run this bash script or manually copy directories.\n"

echo -e "${YELLOW}Please use the native install commands for your platform:${NC}\n"

echo -e "${CYAN}▶ Claude Desktop / Cowork:${NC}"
echo -e "  Open Settings -> Plugins -> Add marketplace -> type 'tody-agent/codymaster'\n"

echo -e "${CYAN}▶ Claude Code CLI:${NC}"
echo -e "  claude plugin marketplace add tody-agent/codymaster"
echo -e "  claude plugin install cm@codymaster --scope user\n"

echo -e "${CYAN}▶ Gemini CLI / Antigravity:${NC}"
echo -e "  gemini extensions install https://github.com/tody-agent/codymaster\n"

echo -e "${CYAN}▶ Cursor:${NC}"
echo -e "  Type this to the agent: /add-plugin cody-master\n"

echo -e "${CYAN}▶ Codex / OpenCode:${NC}"
echo -e "  Tell your agent: Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.opencode/INSTALL.md\n"

echo -e "${GREEN}Need the Dashboard? Just run:${NC}"
echo -e "  npm install -g codymaster\n"

echo -e "📚 See the full documentation at: ${BOLD}https://cody.todyle.com/docs${NC}\n"
exit 1
