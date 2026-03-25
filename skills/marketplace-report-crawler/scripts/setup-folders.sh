#!/bin/bash
# ============================================================================
# Marketplace Report Folder Structure Generator
# ============================================================================
# Usage: bash setup-folders.sh [output_root] [yearMonth]
# Example: bash setup-folders.sh ./data 202602
#
# Creates organized folder tree:
#   {root}/{Platform}/{Brand}/{report_type}/
#   Files will be saved as: {YYYYMM}_{Brand}_{report_type}.{ext}
# ============================================================================

set -e

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}/../config"
OUTPUT_ROOT="${1:-/Users/todyle/Builder/Boxme/AutomateReport/data}"
YEAR_MONTH="${2:-$(date -v-1m +%Y%m 2>/dev/null || date -d '-1 month' +%Y%m)}"

echo "=============================================="
echo "📁 Marketplace Report Folder Generator"
echo "=============================================="
echo "📂 Output Root: ${OUTPUT_ROOT}"
echo "📅 Period: ${YEAR_MONTH}"
echo ""

# --- Read configs using Node.js (cross-platform JSON parsing) ---
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is required. Please install it first."
  exit 1
fi

# Extract accounts and report types from JSON configs
ACCOUNTS=$(node -e "
const accounts = require('${CONFIG_DIR}/accounts.json').accounts;
const reportTypes = require('${CONFIG_DIR}/report-types.json').reportTypes;

// For each active account, list platform + report types
accounts.filter(a => a.active).forEach(account => {
  account.platforms.forEach(platform => {
    const reports = reportTypes
      .filter(r => r.platform === platform && r.status !== 'disabled')
      .map(r => r.id);
    // Deduplicate report IDs
    const uniqueReports = [...new Set(reports)];
    uniqueReports.forEach(reportId => {
      console.log(\`\${platform}|\${account.brandSlug}|\${reportId}\`);
    });
  });
});
")

# --- Create folders ---
FOLDER_COUNT=0

echo "$ACCOUNTS" | while IFS='|' read -r platform brand reportType; do
  # Capitalize platform name for folder
  PLATFORM_DIR=$(echo "$platform" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
  
  FOLDER_PATH="${OUTPUT_ROOT}/${PLATFORM_DIR}/${brand}/${reportType}"
  
  if [ ! -d "$FOLDER_PATH" ]; then
    mkdir -p "$FOLDER_PATH"
    echo "  ✅ Created: ${PLATFORM_DIR}/${brand}/${reportType}/"
  else
    echo "  ⏭️  Exists:  ${PLATFORM_DIR}/${brand}/${reportType}/"
  fi
  
  FOLDER_COUNT=$((FOLDER_COUNT + 1))
done

echo ""
echo "=============================================="
echo "✅ Folder structure ready!"
echo ""
echo "📝 File naming convention:"
echo "   {YYYYMM}_{Brand}_{report_type}.{ext}"
echo "   Example: ${YEAR_MONTH}_Vita_Dairy_platform_income.xlsx"
echo ""
echo "📂 Full path example:"
echo "   ${OUTPUT_ROOT}/Shopee/Vita_Dairy/platform_income/${YEAR_MONTH}_Vita_Dairy_platform_income.xlsx"
echo "=============================================="
