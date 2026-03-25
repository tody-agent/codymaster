#!/usr/bin/env bash
# =============================================================================
# ab-wrapper.sh — agent-browser thin wrapper
# =============================================================================
# Provides shorthand commands for marketplace report crawling.
# Cross-agent compatible: any AI agent can call these commands.
#
# Usage:
#   ./ab-wrapper.sh login <platform> <brand-id>         # Guided login
#   ./ab-wrapper.sh check <platform> <brand-id>         # Check session
#   ./ab-wrapper.sh crawl <platform> <brand-id> <YYYYMM> # Crawl reports
#   ./ab-wrapper.sh open <platform> <brand-id> <url>    # Open URL with session
#   ./ab-wrapper.sh snapshot <platform> <brand-id>      # Get page snapshot
#   ./ab-wrapper.sh close <platform> <brand-id>         # Close browser
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE_ROOT="${MARKETPLACE_PROFILE_ROOT:-$HOME/.marketplace-crawler/profiles}"
AB_CMD="${AGENT_BROWSER_CMD:-npx -y agent-browser}"

get_profile_dir() {
  echo "$PROFILE_ROOT/${1}-${2}"
}

ensure_ab() {
  if ! command -v agent-browser &>/dev/null && ! npx -y agent-browser --version &>/dev/null 2>&1; then
    echo "❌ agent-browser not found. Installing..."
    npm install -g agent-browser 2>/dev/null || {
      echo "⚠️  Global install failed. Using npx (slower first run)."
    }
  fi
}

# --- Commands ---

case "${1:-help}" in
  login)
    "$SCRIPT_DIR/session-manager.sh" login "$2" "$3"
    ;;
  check)
    "$SCRIPT_DIR/session-manager.sh" check "$2" "$3"
    ;;
  crawl)
    platform="$2"
    brand_id="$3"
    period="${4:-$(date -v-1m +%Y%m 2>/dev/null || date -d '-1 month' +%Y%m)}"
    echo "🕷️  Starting crawl: $platform / $brand_id / $period"
    node "$SCRIPT_DIR/crawl-runner.js" --plan --platform "$platform" --brand-id "$brand_id" --period "$period"
    ;;
  open)
    profile_dir=$(get_profile_dir "$2" "$3")
    mkdir -p "$profile_dir"
    $AB_CMD --profile "$profile_dir" open "$4"
    ;;
  snapshot)
    profile_dir=$(get_profile_dir "$2" "$3")
    $AB_CMD --profile "$profile_dir" snapshot -i --json
    ;;
  screenshot)
    profile_dir=$(get_profile_dir "$2" "$3")
    output="${4:-/tmp/marketplace-screenshot-$(date +%s).png}"
    $AB_CMD --profile "$profile_dir" screenshot "$output"
    echo "📸 Screenshot saved: $output"
    ;;
  close)
    profile_dir=$(get_profile_dir "$2" "$3")
    $AB_CMD --profile "$profile_dir" close 2>/dev/null || true
    echo "🔒 Browser closed for $2/$3"
    ;;
  exec)
    # Pass any agent-browser command with the correct profile
    profile_dir=$(get_profile_dir "$2" "$3")
    shift 3
    $AB_CMD --profile "$profile_dir" "$@"
    ;;
  help|*)
    echo ""
    echo "🕷️  ab-wrapper — Marketplace Browser Automation"
    echo "════════════════════════════════════════════════"
    echo ""
    echo "Session Management:"
    echo "  login <platform> <brand-id>              Guided login (headed browser)"
    echo "  check <platform> <brand-id>              Check session validity"
    echo ""
    echo "Crawling:"
    echo "  crawl <platform> <brand-id> [YYYYMM]     Generate & show crawl plan"
    echo ""
    echo "Browser Control:"
    echo "  open <platform> <brand-id> <url>          Open URL with saved session"
    echo "  snapshot <platform> <brand-id>            Get accessibility tree (JSON)"
    echo "  screenshot <platform> <brand-id> [path]   Take screenshot"
    echo "  close <platform> <brand-id>               Close browser"
    echo "  exec <platform> <brand-id> <ab-args...>   Run any agent-browser command"
    echo ""
    echo "Environment:"
    echo "  MARKETPLACE_PROFILE_ROOT     Default: ~/.marketplace-crawler/profiles"
    echo "  AGENT_BROWSER_CMD            Default: npx -y agent-browser"
    echo ""
    ;;
esac
