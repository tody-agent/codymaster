#!/usr/bin/env bash
# =============================================================================
# Session Health Check — Validates if a marketplace session is still active
# =============================================================================
# Returns exit code 0 if session is valid, 1 if expired/invalid.
# Designed to be called by other scripts or directly by AI agents.
#
# Usage:
#   ./session-check.sh <platform> <brand-id>
#   # Exit 0 = valid, Exit 1 = expired/no-profile
# =============================================================================

set -uo pipefail

PROFILE_ROOT="${MARKETPLACE_PROFILE_ROOT:-$HOME/.marketplace-crawler/profiles}"
AB_CMD="${AGENT_BROWSER_CMD:-npx -y agent-browser}"

platform="${1:-}"
brand_id="${2:-}"

if [ -z "$platform" ] || [ -z "$brand_id" ]; then
  echo "Usage: $0 <platform> <brand-id>"
  echo "Example: $0 shopee vita-dairy"
  exit 2
fi

PROFILE_DIR="$PROFILE_ROOT/${platform}-${brand_id}"

# Check if profile exists
if [ ! -d "$PROFILE_DIR" ]; then
  echo "NO_PROFILE"
  exit 1
fi

# Define test URLs and login page indicators
case "$platform" in
  shopee)
    CHECK_URL="https://banhang.shopee.vn/portal/dashboard/"
    LOGIN_PATTERN="buyer/login\|account/login"
    ;;
  lazada)
    CHECK_URL="https://sellercenter.lazada.vn/apps/dashboard"
    LOGIN_PATTERN="seller/login\|sso/login"
    ;;
  tiktok)
    CHECK_URL="https://seller-vn.tiktok.com/homepage?shop_region=VN"
    LOGIN_PATTERN="account/login\|passport"
    ;;
  *)
    echo "UNKNOWN_PLATFORM"
    exit 2
    ;;
esac

# Try to navigate to dashboard and check if redirected to login
$AB_CMD --profile "$PROFILE_DIR" open "$CHECK_URL" 2>/dev/null
sleep 3
$AB_CMD --profile "$PROFILE_DIR" wait --load networkidle 2>/dev/null || true

CURRENT_URL=$($AB_CMD --profile "$PROFILE_DIR" get url 2>/dev/null || echo "ERROR")
$AB_CMD --profile "$PROFILE_DIR" close 2>/dev/null || true

if echo "$CURRENT_URL" | grep -qi "$LOGIN_PATTERN"; then
  echo "EXPIRED"
  exit 1
elif echo "$CURRENT_URL" | grep -qi "error\|ERROR"; then
  echo "ERROR"
  exit 1
else
  echo "VALID"
  exit 0
fi
