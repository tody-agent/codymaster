#!/bin/bash
# CodyMaster CLI Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/todyle/codymaster/main/scripts/install.sh | bash
#
# Detects platform, checks prerequisites, installs globally via npm.

set -e

CM_VERSION="${CM_VERSION:-latest}"
PACKAGE_NAME="codymaster"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

info()  { echo -e "${BLUE}  ℹ ${RESET}$1"; }
ok()    { echo -e "${GREEN}  ✅ ${RESET}$1"; }
warn()  { echo -e "${YELLOW}  ⚠️  ${RESET}$1"; }
err()   { echo -e "${RED}  ❌ ${RESET}$1"; }

echo ""
echo -e "${BOLD}  🐹 CodyMaster Installer${RESET}"
echo -e "  The Hamster-Powered AI Agent Framework"
echo ""

# ─── Detect Platform ──────────────────────────────────────────────
detect_platform() {
  local os arch

  case "$(uname -s)" in
    Darwin*)    os="macos" ;;
    Linux*)     os="linux" ;;
    MINGW*|MSYS*|CYGWIN*)  os="windows" ;;
    *)          os="unknown" ;;
  esac

  case "$(uname -m)" in
    x86_64|amd64)   arch="x64" ;;
    arm64|aarch64)   arch="arm64" ;;
    *)               arch="$(uname -m)" ;;
  esac

  echo "${os}-${arch}"
}

PLATFORM=$(detect_platform)
info "Platform: ${PLATFORM}"

# ─── Check Node.js ────────────────────────────────────────────────
check_node() {
  if command -v node &>/dev/null; then
    local node_version
    node_version=$(node --version 2>/dev/null | sed 's/v//')
    local major
    major=$(echo "$node_version" | cut -d. -f1)

    if [ "$major" -ge 18 ]; then
      ok "Node.js v${node_version} found"
      return 0
    else
      err "Node.js v${node_version} found but v18+ required"
      return 1
    fi
  else
    err "Node.js not found"
    return 1
  fi
}

# ─── Check npm ────────────────────────────────────────────────────
check_npm() {
  if command -v npm &>/dev/null; then
    local npm_version
    npm_version=$(npm --version 2>/dev/null)
    ok "npm v${npm_version} found"
    return 0
  else
    err "npm not found"
    return 1
  fi
}

# ─── Install Node.js if missing ───────────────────────────────────
install_node() {
  info "Installing Node.js via nvm..."

  if command -v nvm &>/dev/null; then
    nvm install --lts
    nvm use --lts
  elif [ -f "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck source=/dev/null
    source "$HOME/.nvm/nvm.sh"
    nvm install --lts
    nvm use --lts
  else
    # Install nvm
    info "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

    export NVM_DIR="$HOME/.nvm"
    # shellcheck source=/dev/null
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install --lts
    nvm use --lts
  fi

  if check_node; then
    ok "Node.js installed successfully"
  else
    err "Node.js installation failed. Please install manually: https://nodejs.org"
    exit 1
  fi
}

# ─── Main Install Flow ───────────────────────────────────────────
main() {
  # Check/install Node.js
  if ! check_node; then
    install_node
  fi

  # Check npm
  if ! check_npm; then
    err "npm is required but not found. Please install Node.js from https://nodejs.org"
    exit 1
  fi

  # Install codymaster
  echo ""
  info "Installing codymaster..."

  if [ "$CM_VERSION" = "latest" ]; then
    npm install -g "$PACKAGE_NAME@latest"
  else
    npm install -g "$PACKAGE_NAME@${CM_VERSION}"
  fi

  # Verify installation
  echo ""
  if command -v cm &>/dev/null; then
    local installed_version
    installed_version=$(cm --version 2>/dev/null || echo "unknown")
    ok "CodyMaster installed successfully!"
    echo ""
    echo -e "  ${BOLD}Version:${RESET}  v${installed_version}"
    echo -e "  ${BOLD}Command:${RESET}  cm --help"
    echo -e "  ${BOLD}Docs:${RESET}     https://github.com/todyle/codymaster"
    echo ""
    echo -e "  ${BOLD}Quick start:${RESET}"
    echo -e "    cm status          Show project summary"
    echo -e "    cm task add \"...\"   Create a task"
    echo -e "    cm dashboard       Start dashboard"
    echo ""
  else
    warn "cm command not found in PATH. You may need to restart your shell:"
    echo ""
    echo "  # For bash/zsh:"
    echo "  source ~/.bashrc  # or source ~/.zshrc"
    echo ""
    echo "  # Or add npm global bin to PATH:"
    echo "  export PATH=\"\$(npm config get prefix)/bin:\$PATH\""
    echo ""
  fi
}

main
