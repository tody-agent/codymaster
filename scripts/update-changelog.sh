#!/bin/bash
# update-changelog.sh — Auto-update CHANGELOG.md from git commits
#
# Usage:
#   bash scripts/update-changelog.sh          # Update CHANGELOG.md
#   bash scripts/update-changelog.sh --dry-run # Preview without writing
#
# Follows conventional commits format:
#   feat: → 🚀 Features
#   fix: → 🐛 Bug Fixes
#   security: → 🔒 Security
#   improve/refactor/perf: → 🚀 Improvements

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHANGELOG="$REPO_ROOT/CHANGELOG.md"
DRY_RUN=false

if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# Get last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# Get commits since last tag
if [ -z "$LAST_TAG" ]; then
  COMMITS=$(git log --oneline -20 --no-merges)
else
  COMMITS=$(git log --oneline "$LAST_TAG"..HEAD --no-merges)
fi

if [ -z "$COMMITS" ]; then
  echo "No commits found since last tag."
  exit 0
fi

# Categorize commits
FEATURES=$(echo "$COMMITS" | grep -iE "^[a-f0-9]+ feat:" | sed 's/^[a-f0-9]* /- /' || true)
FIXES=$(echo "$COMMITS" | grep -iE "^[a-f0-9]+ fix:" | sed 's/^[a-f0-9]* /- /' || true)
SECURITY=$(echo "$COMMITS" | grep -iE "^[a-f0-9]+ (security|sec):" | sed 's/^[a-f0-9]* /- /' || true)
IMPROVEMENTS=$(echo "$COMMITS" | grep -iE "^[a-f0-9]+ (improve|refactor|perf):" | sed 's/^[a-f0-9]* /- /' || true)
OTHER=$(echo "$COMMITS" | grep -ivE "^[a-f0-9]+ (feat|fix|security|sec|improve|refactor|perf):" | sed 's/^[a-f0-9]* /- /' || true)

# Generate changelog entry
DATE=$(date +%Y-%m-%d)
VERSION=$(node -p "require('$REPO_ROOT/package.json').version" 2>/dev/null || echo "unreleased")

ENTRY="## [$VERSION] - $DATE\n\n"

if [ -n "$FEATURES" ]; then
  ENTRY+="### 🚀 Features\n$FEATURES\n\n"
fi

if [ -n "$FIXES" ]; then
  ENTRY+="### 🐛 Bug Fixes\n$FIXES\n\n"
fi

if [ -n "$SECURITY" ]; then
  ENTRY+="### 🔒 Security\n$SECURITY\n\n"
fi

if [ -n "$IMPROVEMENTS" ]; then
  ENTRY+="### 🚀 Improvements\n$IMPROVEMENTS\n\n"
fi

if [ -n "$OTHER" ]; then
  ENTRY+="### 📦 Other\n$OTHER\n\n"
fi

if [ "$DRY_RUN" = true ]; then
  echo "=== DRY RUN — would add to CHANGELOG.md ==="
  echo -e "$ENTRY"
  exit 0
fi

# Prepend to CHANGELOG.md
if [ -f "$CHANGELOG" ]; then
  TEMP=$(mktemp)
  echo -e "$ENTRY" > "$TEMP"
  cat "$CHANGELOG" >> "$TEMP"
  mv "$TEMP" "$CHANGELOG"
else
  echo -e "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nCategories: 🚀 **Improvements** | 🐛 **Bug Fixes** | 🔒 **Security**\n\n---\n\n$ENTRY" > "$CHANGELOG"
fi

echo "✅ CHANGELOG.md updated (version: $VERSION)"
