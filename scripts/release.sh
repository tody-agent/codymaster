#!/bin/bash
# CodyMaster Release Script
# Usage: bash scripts/release.sh [patch|minor|major|v1.2.3]
#
# Bumps version, updates changelog, commits, tags, and pushes.
# GitHub Actions will handle npm publish on tag push.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

info()  { echo -e "${BLUE}  ℹ ${RESET}$1"; }
ok()    { echo -e "${GREEN}  ✅ ${RESET}$1"; }
warn()  { echo -e "${YELLOW}  ⚠️  ${RESET}$1"; }
err()   { echo -e "${RED}  ❌ ${RESET}$1"; exit 1; }

BUMP_TYPE="${1:-patch}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG_JSON="$REPO_ROOT/package.json"

# ─── Pre-checks ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}  🐹 CodyMaster Release${RESET}"
echo ""

# Ensure clean working tree
if [ -n "$(git status --porcelain)" ]; then
  err "Working tree is not clean. Commit or stash changes first."
fi

# Ensure on main/master
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
  warn "Not on main branch (currently on: $CURRENT_BRANCH)"
  read -p "  Continue anyway? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# ─── Calculate new version ───────────────────────────────────────
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null)
info "Current version: v$CURRENT_VERSION"

case "$BUMP_TYPE" in
  patch)  NEW_VERSION=$(echo "$CURRENT_VERSION" | awk -F. '{print $1"."$2"."$3+1}') ;;
  minor)  NEW_VERSION=$(echo "$CURRENT_VERSION" | awk -F. '{print $1"."$2+1".0"}') ;;
  major)  NEW_VERSION=$(echo "$CURRENT_VERSION" | awk -F. '{print $1+1".0.0"}' ;;
  v*)     NEW_VERSION="${BUMP_TYPE#v}" ;;
  *)
    err "Usage: $0 [patch|minor|major|v1.2.3]"
    ;;
esac

info "New version: v$NEW_VERSION"
echo ""

# Confirm
read -p "  Release v$NEW_VERSION? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  info "Aborted."
  exit 0
fi

# ─── Bump version in package.json ────────────────────────────────
info "Bumping version in package.json..."
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('$PKG_JSON', 'utf-8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync('$PKG_JSON', JSON.stringify(pkg, null, 2) + '\n');
"
ok "package.json updated"

# ─── Sync MCP server version ─────────────────────────────────────
MCP_FILE="$REPO_ROOT/src/mcp-context-server.ts"
if [ -f "$MCP_FILE" ]; then
  sed -i '' "s/SERVER_VERSION = '[^']*'/SERVER_VERSION = '$NEW_VERSION'/" "$MCP_FILE" 2>/dev/null || \
  sed -i "s/SERVER_VERSION = '[^']*'/SERVER_VERSION = '$NEW_VERSION'/" "$MCP_FILE" 2>/dev/null
  ok "MCP server version synced"
fi

# ─── Update changelog ────────────────────────────────────────────
info "Updating changelog..."
if [ -f "$REPO_ROOT/scripts/update-changelog.sh" ]; then
  bash "$REPO_ROOT/scripts/update-changelog.sh" || warn "Changelog update failed (non-fatal)"
  ok "Changelog updated"
else
  warn "Changelog script not found, skipping"
fi

# ─── Build ───────────────────────────────────────────────────────
info "Building..."
npm run build 2>/dev/null || npx tsc
ok "Build complete"

# ─── Commit & Tag ────────────────────────────────────────────────
info "Committing..."
git add -A
git commit -m "chore: release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
ok "Tagged v$NEW_VERSION"

# ─── Push ────────────────────────────────────────────────────────
info "Pushing to origin..."
git push origin "$CURRENT_BRANCH"
git push origin "v$NEW_VERSION"
ok "Pushed to origin"

echo ""
echo -e "${GREEN}  ✅ Release v$NEW_VERSION complete!${RESET}"
echo ""
echo -e "  ${BOLD}What happens next:${RESET}"
echo -e "  1. GitHub Actions will run CI tests"
echo -e "  2. On tag push, npm publish runs automatically"
echo -e "  3. GitHub Release is created with release notes"
echo ""
echo -e "  ${BOLD}Monitor:${RESET}  https://github.com/todyle/codymaster/actions"
echo ""
