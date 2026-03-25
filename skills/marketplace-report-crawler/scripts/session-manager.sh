#!/usr/bin/env bash
# =============================================================================
# Session Manager for Marketplace Report Crawler
# =============================================================================
# Cross-agent compatible: works from ANY AI coding agent that can run shell.
# Uses agent-browser CLI for persistent browser sessions.
#
# Usage:
#   ./session-manager.sh status                       # Show all sessions
#   ./session-manager.sh login <platform> <brand-id>  # Guided login (headed)
#   ./session-manager.sh login-all                    # Login all active accounts
#   ./session-manager.sh check <platform> <brand-id>  # Check session health
#   ./session-manager.sh check-all                    # Check all sessions
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"
ACCOUNTS_FILE="$CONFIG_DIR/accounts.json"
SESSIONS_FILE="$CONFIG_DIR/sessions.json"

# Default profile root — can be overridden via env
PROFILE_ROOT="${MARKETPLACE_PROFILE_ROOT:-$HOME/.marketplace-crawler/profiles}"

# agent-browser command — use npx if not installed globally
AB_CMD="${AGENT_BROWSER_CMD:-npx -y agent-browser}"

# Platform URLs via functions (compatible with bash 3.x on macOS)
get_login_url() {
  case "$1" in
    shopee) echo "https://banhang.shopee.vn/" ;;
    lazada) echo "https://sellercenter.lazada.vn/" ;;
    tiktok) echo "https://seller-vn.tiktok.com/" ;;
    *) echo "" ;;
  esac
}

get_check_url() {
  case "$1" in
    shopee) echo "https://banhang.shopee.vn/portal/dashboard/" ;;
    lazada) echo "https://sellercenter.lazada.vn/apps/dashboard" ;;
    tiktok) echo "https://seller-vn.tiktok.com/homepage?shop_region=VN" ;;
    *) echo "" ;;
  esac
}

get_login_indicator() {
  case "$1" in
    shopee) echo "buyer/login" ;;
    lazada) echo "seller/login" ;;
    tiktok) echo "account/login" ;;
    *) echo "login" ;;
  esac
}

# --- Helpers ---

get_profile_dir() {
  local platform="$1"
  local brand_id="$2"
  echo "$PROFILE_ROOT/${platform}-${brand_id}"
}

ensure_profile_dir() {
  local dir="$1"
  mkdir -p "$dir"
}

get_brands() {
  # Returns brand IDs from accounts.json
  node -e "
    const a = require('$ACCOUNTS_FILE');
    a.accounts.filter(x => x.active).forEach(x => console.log(x.id));
  "
}

get_brand_platforms() {
  local brand_id="$1"
  node -e "
    const a = require('$ACCOUNTS_FILE');
    const b = a.accounts.find(x => x.id === '$brand_id');
    if (b) b.platforms.forEach(p => console.log(p));
  "
}

get_brand_name() {
  local brand_id="$1"
  node -e "
    const a = require('$ACCOUNTS_FILE');
    const b = a.accounts.find(x => x.id === '$brand_id');
    if (b) console.log(b.brand);
  "
}

update_session_status() {
  local platform="$1"
  local brand_id="$2"
  local status="$3"
  local now
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Create sessions.json if not exists
  if [ ! -f "$SESSIONS_FILE" ]; then
    echo '{"sessions":[]}' > "$SESSIONS_FILE"
  fi

  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$SESSIONS_FILE', 'utf8'));
    const idx = data.sessions.findIndex(s => s.platform === '$platform' && s.brandId === '$brand_id');
    const entry = {
      platform: '$platform',
      brandId: '$brand_id',
      status: '$status',
      profilePath: '$(get_profile_dir "$platform" "$brand_id")',
      $([ "$status" = "valid" ] && echo "lastLogin: '$now'," || echo "")
      lastCheck: '$now'
    };
    if (idx >= 0) { Object.assign(data.sessions[idx], entry); }
    else { data.sessions.push(entry); }
    fs.writeFileSync('$SESSIONS_FILE', JSON.stringify(data, null, 2));
  "
}

# --- Commands ---

cmd_status() {
  echo ""
  echo "📊 Marketplace Session Status"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo "Profile root: $PROFILE_ROOT"
  echo ""

  if [ ! -f "$SESSIONS_FILE" ]; then
    echo "⚠️  No sessions tracked yet. Run 'login-all' first."
    return
  fi

  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$SESSIONS_FILE', 'utf8'));
    if (data.sessions.length === 0) {
      console.log('⚠️  No sessions tracked yet.');
      process.exit(0);
    }
    const icons = { valid: '✅', expired: '❌', unknown: '❓' };
    data.sessions.forEach(s => {
      const icon = icons[s.status] || '❓';
      const last = s.lastCheck ? new Date(s.lastCheck).toLocaleString() : 'never';
      console.log(\`  \${icon} \${s.platform.padEnd(8)} \${s.brandId.padEnd(15)} \${s.status.padEnd(10)} last: \${last}\`);
    });
  "
  echo ""
}

cmd_login() {
  local platform="$1"
  local brand_id="$2"
  local brand_name
  brand_name=$(get_brand_name "$brand_id")
  local profile_dir
  profile_dir=$(get_profile_dir "$platform" "$brand_id")
  local login_url
  login_url=$(get_login_url "$platform")

  ensure_profile_dir "$profile_dir"

  echo ""
  echo "🔐 Guided Login: $brand_name on ${platform^^}"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo "📂 Profile: $profile_dir"
  echo "🌐 URL: $login_url"
  echo ""
  echo "⏳ Opening browser in headed mode..."
  echo "   → Please login manually (solve CAPTCHA/OTP as needed)"
  echo "   → When you see the dashboard, press Enter here to save session"
  echo ""

  # Open browser in headed mode with persistent profile
  $AB_CMD --profile "$profile_dir" --headed open "$login_url" &
  local ab_pid=$!

  # Wait for user to confirm login
  read -r -p "✅ Press Enter when login is complete... "

  # Take a screenshot as proof
  local screenshot_dir="$profile_dir/screenshots"
  mkdir -p "$screenshot_dir"
  $AB_CMD --profile "$profile_dir" screenshot "$screenshot_dir/login-success-$(date +%Y%m%d).png" 2>/dev/null || true

  # Close the browser (profile is auto-saved)
  $AB_CMD --profile "$profile_dir" close 2>/dev/null || true

  # Update session tracking
  update_session_status "$platform" "$brand_id" "valid"

  echo ""
  echo "✅ Session saved for $brand_name on ${platform^^}"
  echo "   Profile: $profile_dir"
  echo ""
}

cmd_login_all() {
  echo ""
  echo "🔐 Guided Login — All Active Accounts"
  echo "═══════════════════════════════════════════════════════"
  echo ""

  local brands
  brands=$(get_brands)

  for brand_id in $brands; do
    local platforms
    platforms=$(get_brand_platforms "$brand_id")
    for platform in $platforms; do
      cmd_login "$platform" "$brand_id"
    done
  done

  echo ""
  echo "✅ All accounts logged in. Run 'check-all' to verify."
  echo ""
}

cmd_check() {
  local platform="$1"
  local brand_id="$2"
  local brand_name
  brand_name=$(get_brand_name "$brand_id")
  local profile_dir
  profile_dir=$(get_profile_dir "$platform" "$brand_id")
  local check_url
  check_url=$(get_check_url "$platform")
  local login_indicator
  login_indicator=$(get_login_indicator "$platform")

  if [ ! -d "$profile_dir" ]; then
    echo "❌ ${platform}/${brand_id}: No profile found (never logged in)"
    update_session_status "$platform" "$brand_id" "unknown"
    return 1
  fi

  # Open in headless mode, navigate to dashboard, check URL
  $AB_CMD --profile "$profile_dir" open "$check_url" 2>/dev/null || true
  sleep 3
  $AB_CMD --profile "$profile_dir" wait --load networkidle 2>/dev/null || true

  local current_url
  current_url=$($AB_CMD --profile "$profile_dir" get url 2>/dev/null || echo "error")

  $AB_CMD --profile "$profile_dir" close 2>/dev/null || true

  if echo "$current_url" | grep -qi "$login_indicator"; then
    echo "❌ ${platform}/${brand_id} ($brand_name): Session EXPIRED"
    update_session_status "$platform" "$brand_id" "expired"
    return 1
  else
    echo "✅ ${platform}/${brand_id} ($brand_name): Session VALID"
    update_session_status "$platform" "$brand_id" "valid"
    return 0
  fi
}

cmd_check_all() {
  echo ""
  echo "🔍 Checking All Sessions"
  echo "═══════════════════════════════════════════════════════"
  echo ""

  local valid=0
  local expired=0
  local unknown=0

  local brands
  brands=$(get_brands)

  for brand_id in $brands; do
    local platforms
    platforms=$(get_brand_platforms "$brand_id")
    for platform in $platforms; do
      if cmd_check "$platform" "$brand_id"; then
        ((valid++))
      else
        ((expired++))
      fi
    done
  done

  echo ""
  echo "📊 Summary: $valid valid, $expired expired/unknown"
  echo ""
}

# --- Main ---

case "${1:-help}" in
  status)
    cmd_status
    ;;
  login)
    if [ $# -lt 3 ]; then
      echo "Usage: $0 login <platform> <brand-id>"
      echo "Platforms: shopee, lazada, tiktok"
      exit 1
    fi
    cmd_login "$2" "$3"
    ;;
  login-all)
    cmd_login_all
    ;;
  check)
    if [ $# -lt 3 ]; then
      echo "Usage: $0 check <platform> <brand-id>"
      exit 1
    fi
    cmd_check "$2" "$3"
    ;;
  check-all)
    cmd_check_all
    ;;
  *)
    echo ""
    echo "🕷️  Marketplace Session Manager"
    echo "════════════════════════════════"
    echo ""
    echo "Commands:"
    echo "  status                       Show all session statuses"
    echo "  login <platform> <brand-id>  Guided login (opens browser)"
    echo "  login-all                    Login all active accounts"
    echo "  check <platform> <brand-id>  Check if session is valid"
    echo "  check-all                    Check all sessions"
    echo ""
    echo "Platforms: shopee, lazada, tiktok"
    echo "Brands: $(get_brands | tr '\n' ', ')"
    echo ""
    echo "Environment:"
    echo "  MARKETPLACE_PROFILE_ROOT     Profile directory (default: ~/.marketplace-crawler/profiles)"
    echo "  AGENT_BROWSER_CMD            agent-browser command (default: npx -y agent-browser)"
    echo ""
    echo "Examples:"
    echo "  $0 login shopee vita-dairy"
    echo "  $0 check-all"
    echo "  $0 status"
    echo ""
    ;;
esac
