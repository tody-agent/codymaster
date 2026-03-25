#!/usr/bin/env bash
# =============================================================================
# CodyMaster Skeleton Indexer — Zero-Dependency Lightning-Fast Code Scanner
# =============================================================================
# TRIZ Principles Applied:
#   #1  Segmentation   — Index only signatures, not full content
#   #2  Taking Out     — Extract skeleton, discard body
#   #3  Local Quality  — Different patterns per language
#   #10 Prior Action   — Run once, reuse across sessions
#   #13 Inversion      — Code summarizes itself to the agent
#   #25 Self-Service   — Auto-detects languages, zero config
#   #35 Parameter Changes — Unit: file content → function signature
#
# Usage:
#   ./index-codebase.sh [project_root] [output_file]
#
# Output: Compact skeleton.md (~3000 tokens for 200-file project)
# Speed:  <2 seconds on most projects
# Deps:   ZERO (uses grep, find, awk, wc — standard POSIX tools)
# =============================================================================

set -uo pipefail

# --- Configuration ---
PROJECT_ROOT="${1:-.}"
OUTPUT_FILE="${2:-$PROJECT_ROOT/.cm/skeleton.md}"
MAX_DEPTH=10
MAX_SIGS_PER_FILE=15
MAX_FILES_PER_DIR=15
MAX_TOTAL_LINES=600

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- Ensure .cm directory exists ---
mkdir -p "$(dirname "$OUTPUT_FILE")"

# --- Detect project name ---
PROJECT_NAME=$(basename "$(cd "$PROJECT_ROOT" && pwd)")

# --- Count files by extension ---
count_files() {
  local ext="$1"
  find "$PROJECT_ROOT" -name "*.${ext}" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -not -path "*/build/*" \
    -not -path "*/.next/*" \
    -not -path "*/vendor/*" \
    -not -path "*/__pycache__/*" \
    -not -path "*/target/*" \
    -not -path "*/.cm/*" \
    -not -path "*/.codegraph/*" \
    -not -name "*.min.*" \
    -not -name "*.d.ts" \
    -not -name "*.map" \
    -type f 2>/dev/null | wc -l | tr -d ' '
}

# --- Detect languages ---
detect_languages() {
  local langs=""
  local ts_count=$(count_files "ts")
  local tsx_count=$(count_files "tsx")
  local js_count=$(count_files "js")
  local jsx_count=$(count_files "jsx")
  local py_count=$(count_files "py")
  local go_count=$(count_files "go")
  local rs_count=$(count_files "rs")
  local java_count=$(count_files "java")
  local php_count=$(count_files "php")
  local rb_count=$(count_files "rb")
  local c_count=$(count_files "c")
  local cpp_count=$(count_files "cpp")
  local swift_count=$(count_files "swift")
  local kt_count=$(count_files "kt")
  local vue_count=$(count_files "vue")
  local svelte_count=$(count_files "svelte")

  [ "$ts_count" -gt 0 ] || [ "$tsx_count" -gt 0 ] && langs="${langs}typescript($((ts_count+tsx_count))) "
  [ "$js_count" -gt 0 ] || [ "$jsx_count" -gt 0 ] && langs="${langs}javascript($((js_count+jsx_count))) "
  [ "$py_count" -gt 0 ] && langs="${langs}python($py_count) "
  [ "$go_count" -gt 0 ] && langs="${langs}go($go_count) "
  [ "$rs_count" -gt 0 ] && langs="${langs}rust($rs_count) "
  [ "$java_count" -gt 0 ] && langs="${langs}java($java_count) "
  [ "$php_count" -gt 0 ] && langs="${langs}php($php_count) "
  [ "$rb_count" -gt 0 ] && langs="${langs}ruby($rb_count) "
  [ "$c_count" -gt 0 ] && langs="${langs}c($c_count) "
  [ "$cpp_count" -gt 0 ] && langs="${langs}cpp($cpp_count) "
  [ "$swift_count" -gt 0 ] && langs="${langs}swift($swift_count) "
  [ "$kt_count" -gt 0 ] && langs="${langs}kotlin($kt_count) "
  [ "$vue_count" -gt 0 ] && langs="${langs}vue($vue_count) "
  [ "$svelte_count" -gt 0 ] && langs="${langs}svelte($svelte_count) "

  echo "$langs"
}

# --- Total source file count ---
total_source_files() {
  find "$PROJECT_ROOT" \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" \
       -o -name "*.php" -o -name "*.rb" -o -name "*.c" -o -name "*.cpp" \
       -o -name "*.h" -o -name "*.swift" -o -name "*.kt" \
       -o -name "*.vue" -o -name "*.svelte" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -not -path "*/build/*" \
    -not -path "*/.next/*" \
    -not -path "*/vendor/*" \
    -not -path "*/__pycache__/*" \
    -not -path "*/target/*" \
    -not -path "*/.cm/*" \
    -not -name "*.min.*" \
    -not -name "*.d.ts" \
    -not -name "*.map" \
    -type f 2>/dev/null | wc -l | tr -d ' '
}

# --- Standard exclude args for find ---
FIND_EXCLUDES=(
  -not -path "*/node_modules/*"
  -not -path "*/.git/*"
  -not -path "*/dist/*"
  -not -path "*/build/*"
  -not -path "*/.next/*"
  -not -path "*/vendor/*"
  -not -path "*/__pycache__/*"
  -not -path "*/target/*"
  -not -path "*/.cm/*"
  -not -path "*/.codegraph/*"
  -not -path "*/.venv/*"
  -not -path "*/.wrangler/*"
  -not -path "*/.pytest_cache/*"
  -not -path "*/output/*"
  -not -path "*/docs/js/lang/*"
  -not -name "*.min.*"
  -not -name "*.d.ts"
  -not -name "*.map"
  -not -name "*.pyc"
)

# =============================================================================
# EXTRACTION ENGINES — One per language family
# =============================================================================

# --- TypeScript/JavaScript: exports, functions, classes, interfaces, types ---
extract_ts_js() {
  local file="$1"
  local relpath="${file#$PROJECT_ROOT/}"
  grep -n \
    -e '^export ' \
    -e '^export default ' \
    -e '^  export ' \
    -e '^function ' \
    -e '^async function ' \
    -e '^class ' \
    -e '^interface ' \
    -e '^type ' \
    -e '^enum ' \
    -e '^const .* = (' \
    -e '^const .* = async (' \
    -e '^const .* = () =>' \
    -e '^const .* = async () =>' \
    -e 'router\.\(get\|post\|put\|delete\|patch\)(' \
    -e 'app\.\(get\|post\|put\|delete\|patch\)(' \
    "$file" 2>/dev/null | \
    sed 's/{.*//;s/ =>.*//' | \
    head -40 || true
}

# --- Python: def, class, decorators, imports ---
extract_python() {
  local file="$1"
  grep -n \
    -e '^def ' \
    -e '^async def ' \
    -e '^class ' \
    -e '^    def ' \
    -e '^    async def ' \
    -e '^@app\.\(route\|get\|post\|put\|delete\)' \
    -e '^@router\.\(get\|post\|put\|delete\)' \
    -e '^from .* import ' \
    "$file" 2>/dev/null | \
    sed 's/:$/:/;s/{.*//;s/""".*//;s/#.*//' | \
    head -40 || true
}

# --- Go: func, type, interface ---
extract_go() {
  local file="$1"
  grep -n \
    -e '^func ' \
    -e '^type .* struct' \
    -e '^type .* interface' \
    -e '^package ' \
    "$file" 2>/dev/null | \
    sed 's/{.*//' | \
    head -40 || true
}

# --- Rust: fn, struct, enum, impl, trait ---
extract_rust() {
  local file="$1"
  grep -n \
    -e '^pub fn ' \
    -e '^fn ' \
    -e '^pub struct ' \
    -e '^struct ' \
    -e '^pub enum ' \
    -e '^enum ' \
    -e '^impl ' \
    -e '^pub trait ' \
    -e '^trait ' \
    -e '^mod ' \
    -e '^pub mod ' \
    "$file" 2>/dev/null | \
    sed 's/{.*//' | \
    head -40 || true
}

# --- Java/Kotlin: class, interface, method ---
extract_java_kt() {
  local file="$1"
  grep -n \
    -e '^\(public\|private\|protected\) .* class ' \
    -e '^\(public\|private\|protected\) .* interface ' \
    -e '^\(public\|private\|protected\) .* enum ' \
    -e '^\(public\|private\|protected\) .*(.*)' \
    -e '^class ' \
    -e '^fun ' \
    -e '^suspend fun ' \
    -e '^data class ' \
    -e '^object ' \
    -e '^interface ' \
    -e '^package ' \
    "$file" 2>/dev/null | \
    sed 's/{.*//;s/:.*//' | \
    head -40 || true
}

# --- PHP: function, class ---
extract_php() {
  local file="$1"
  grep -n \
    -e '^\(public\|private\|protected\) function ' \
    -e '^function ' \
    -e '^class ' \
    -e '^interface ' \
    -e '^trait ' \
    -e '^namespace ' \
    "$file" 2>/dev/null | \
    sed 's/{.*//' | \
    head -40 || true
}

# --- Ruby: def, class, module ---
extract_ruby() {
  local file="$1"
  grep -n \
    -e '^  def ' \
    -e '^def ' \
    -e '^class ' \
    -e '^module ' \
    "$file" 2>/dev/null | \
    head -40 || true
}

# --- C/C++: function declarations, struct, class ---
extract_c_cpp() {
  local file="$1"
  grep -n \
    -e '^[a-zA-Z_].*(.*) {' \
    -e '^[a-zA-Z_].*(.*);' \
    -e '^struct ' \
    -e '^class ' \
    -e '^typedef ' \
    -e '^#define ' \
    -e '^namespace ' \
    "$file" 2>/dev/null | \
    sed 's/{.*//' | \
    head -40 || true
}

# --- Swift: func, class, struct, protocol ---
extract_swift() {
  local file="$1"
  grep -n \
    -e '^func ' \
    -e '^class ' \
    -e '^struct ' \
    -e '^protocol ' \
    -e '^enum ' \
    -e '^    func ' \
    -e '^    static func ' \
    -e '^extension ' \
    "$file" 2>/dev/null | \
    sed 's/{.*//' | \
    head -40 || true
}

# =============================================================================
# MAIN EXTRACTION LOOP
# =============================================================================

extract_file() {
  local file="$1"
  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx|mjs|cjs|vue|svelte)
      extract_ts_js "$file"
      ;;
    py)
      extract_python "$file"
      ;;
    go)
      extract_go "$file"
      ;;
    rs)
      extract_rust "$file"
      ;;
    java|kt|kts)
      extract_java_kt "$file"
      ;;
    php)
      extract_php "$file"
      ;;
    rb)
      extract_ruby "$file"
      ;;
    c|cpp|cc|cxx|h|hpp)
      extract_c_cpp "$file"
      ;;
    swift)
      extract_swift "$file"
      ;;
  esac
}

# =============================================================================
# GENERATE SKELETON
# =============================================================================

echo -e "${CYAN}🦴 CodyMaster Skeleton Indexer${NC}"
echo -e "${CYAN}   Scanning: ${PROJECT_ROOT}${NC}"

START_TIME=$(date +%s%N 2>/dev/null || python3 -c "import time; print(int(time.time()*1e9))" 2>/dev/null || echo 0)

TOTAL_FILES=$(total_source_files)
LANGUAGES=$(detect_languages)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- Detect framework & config ---
FRAMEWORK="unknown"
[ -f "$PROJECT_ROOT/package.json" ] && FRAMEWORK="node"
[ -f "$PROJECT_ROOT/next.config.js" ] || [ -f "$PROJECT_ROOT/next.config.ts" ] || [ -f "$PROJECT_ROOT/next.config.mjs" ] && FRAMEWORK="next.js" || true
[ -f "$PROJECT_ROOT/vite.config.ts" ] || [ -f "$PROJECT_ROOT/vite.config.js" ] && FRAMEWORK="vite" || true
[ -f "$PROJECT_ROOT/astro.config.mjs" ] || [ -f "$PROJECT_ROOT/astro.config.ts" ] && FRAMEWORK="astro" || true
[ -f "$PROJECT_ROOT/nuxt.config.ts" ] && FRAMEWORK="nuxt" || true
[ -f "$PROJECT_ROOT/requirements.txt" ] || [ -f "$PROJECT_ROOT/pyproject.toml" ] && FRAMEWORK="python" || true
[ -f "$PROJECT_ROOT/manage.py" ] && FRAMEWORK="django" || true
[ -f "$PROJECT_ROOT/go.mod" ] && FRAMEWORK="go" || true
[ -f "$PROJECT_ROOT/Cargo.toml" ] && FRAMEWORK="rust" || true
[ -f "$PROJECT_ROOT/pom.xml" ] && FRAMEWORK="maven" || true
[ -f "$PROJECT_ROOT/build.gradle" ] || [ -f "$PROJECT_ROOT/build.gradle.kts" ] && FRAMEWORK="gradle" || true
[ -f "$PROJECT_ROOT/Gemfile" ] && FRAMEWORK="ruby" || true
[ -f "$PROJECT_ROOT/composer.json" ] && FRAMEWORK="php/composer" || true
[ -f "$PROJECT_ROOT/wrangler.toml" ] && FRAMEWORK="${FRAMEWORK}+cloudflare" || true
[ -f "$PROJECT_ROOT/hooks.py" ] && FRAMEWORK="frappe" || true

# --- Write header ---
{
  echo "# 🦴 Skeleton Index: ${PROJECT_NAME}"
  echo ""
  echo "| Meta | Value |"
  echo "|------|-------|"
  echo "| Generated | ${TIMESTAMP} |"
  echo "| Source Files | ${TOTAL_FILES} |"
  echo "| Languages | ${LANGUAGES} |"
  echo "| Framework | ${FRAMEWORK} |"
  echo ""

  # --- Entry points ---
  echo "## Entry Points"
  echo ""
  for entry in \
    "src/index.ts" "src/index.js" "src/main.ts" "src/main.js" \
    "src/App.tsx" "src/App.jsx" "src/app.ts" "src/app.js" \
    "app/layout.tsx" "app/page.tsx" "pages/index.tsx" "pages/_app.tsx" \
    "main.py" "app.py" "manage.py" "main.go" "cmd/main.go" \
    "src/main.rs" "src/lib.rs" "index.php" "config/app.php"; do
    if [ -f "$PROJECT_ROOT/$entry" ]; then
      echo "- \`$entry\`"
    fi
  done
  echo ""

  # --- Key config files ---
  echo "## Config Files"
  echo ""
  for cfg in \
    "package.json" "tsconfig.json" "wrangler.toml" \
    "next.config.js" "next.config.ts" "next.config.mjs" \
    "vite.config.ts" "vite.config.js" \
    "astro.config.mjs" "nuxt.config.ts" \
    "pyproject.toml" "requirements.txt" "setup.py" \
    "go.mod" "Cargo.toml" "pom.xml" "build.gradle" "build.gradle.kts" \
    "Gemfile" "composer.json" \
    "Dockerfile" "docker-compose.yml" "docker-compose.yaml" \
    ".env.example" "AGENTS.md"; do
    if [ -f "$PROJECT_ROOT/$cfg" ]; then
      echo "- \`$cfg\`"
    fi
  done
  echo ""

  # --- Directory tree (depth 2) ---
  echo "## Directory Structure"
  echo ""
  echo '```'
  # Use find to create a clean tree
  find "$PROJECT_ROOT" -maxdepth 2 -type d \
    -not -path "*/node_modules*" \
    -not -path "*/.git*" \
    -not -path "*/dist*" \
    -not -path "*/build*" \
    -not -path "*/.next*" \
    -not -path "*/vendor*" \
    -not -path "*/__pycache__*" \
    -not -path "*/target*" \
    -not -path "*/.cm*" \
    -not -path "*/.codegraph*" \
    2>/dev/null | \
    sed "s|$PROJECT_ROOT/||;s|$PROJECT_ROOT||" | \
    sort | \
    head -60 | \
    awk '{
      depth = gsub(/\//, "/")
      indent = ""
      for (i = 0; i < depth; i++) indent = indent "  "
      n = split($0, parts, "/")
      if (NR == 1) print parts[n] "/"
      else print indent parts[n] "/"
    }'
  echo '```'
  echo ""

  # --- Module-by-module skeleton ---
  echo "## Code Skeleton"
  echo ""

  # Get all source directories sorted
  prev_dir=""
  dir_file_count=0
  total_lines=0
  find "$PROJECT_ROOT" \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" \
       -o -name "*.php" -o -name "*.rb" -o -name "*.c" -o -name "*.cpp" \
       -o -name "*.h" -o -name "*.swift" -o -name "*.kt" \
       -o -name "*.vue" -o -name "*.svelte" \) \
    "${FIND_EXCLUDES[@]}" \
    -type f 2>/dev/null | \
    sort | \
    while IFS= read -r file; do
      # Stop if total output exceeds line cap
      if [ "$total_lines" -ge "$MAX_TOTAL_LINES" ]; then
        echo ""
        echo "_... output capped at ${MAX_TOTAL_LINES} lines. Run with larger MAX_TOTAL_LINES for full index._"
        break
      fi

      relpath="${file#$PROJECT_ROOT/}"
      dir=$(dirname "$relpath")
      fname=$(basename "$relpath")

      # Print directory header when directory changes
      if [ "$dir" != "$prev_dir" ]; then
        echo "### \`${dir}/\`"
        echo ""
        prev_dir="$dir"
        dir_file_count=0
        total_lines=$((total_lines + 2))
      fi

      # Cap files per directory
      dir_file_count=$((dir_file_count + 1))
      if [ "$dir_file_count" -gt "$MAX_FILES_PER_DIR" ]; then
        if [ "$dir_file_count" -eq "$((MAX_FILES_PER_DIR + 1))" ]; then
          echo "_... and more files in this directory_"
          echo ""
          total_lines=$((total_lines + 2))
        fi
        continue
      fi

      # Extract signatures
      sigs=$(extract_file "$file" | head -"$MAX_SIGS_PER_FILE")

      if [ -n "$sigs" ]; then
        sig_lines=$(echo "$sigs" | wc -l | tr -d ' ')
        echo "**${fname}**"
        echo '```'
        echo "$sigs"
        echo '```'
        echo ""
        total_lines=$((total_lines + sig_lines + 4))
      else
        # File exists but no extractable signatures — just note it
        lines=$(wc -l < "$file" 2>/dev/null | tr -d ' ')
        echo "- \`${fname}\` (${lines} lines)"
        total_lines=$((total_lines + 1))
      fi
    done

} > "$OUTPUT_FILE"

# --- Calculate timing ---
END_TIME=$(date +%s%N 2>/dev/null || python3 -c "import time; print(int(time.time()*1e9))" 2>/dev/null || echo 0)
if [ "$START_TIME" != "0" ] && [ "$END_TIME" != "0" ]; then
  ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
  echo -e "${GREEN}✅ Done in ${ELAPSED_MS}ms${NC}"
else
  echo -e "${GREEN}✅ Done${NC}"
fi

# --- Stats ---
OUTPUT_LINES=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')
OUTPUT_BYTES=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
OUTPUT_TOKENS_EST=$((OUTPUT_BYTES / 4))

echo -e "   📄 ${OUTPUT_FILE}"
echo -e "   📊 ${TOTAL_FILES} source files → ${OUTPUT_LINES} lines (~${OUTPUT_TOKENS_EST} tokens)"
echo -e "   🗣️ Languages: ${LANGUAGES}"
echo -e "   🏗️ Framework: ${FRAMEWORK}"

# --- Intelligence level recommendation ---
if [ "$TOTAL_FILES" -lt 20 ]; then
  echo -e "   🎯 Intelligence Level: ${CYAN}MINIMAL${NC} (skeleton sufficient)"
elif [ "$TOTAL_FILES" -lt 50 ]; then
  echo -e "   🎯 Intelligence Level: ${CYAN}LITE${NC} (skeleton + diagram recommended)"
elif [ "$TOTAL_FILES" -lt 200 ]; then
  echo -e "   🎯 Intelligence Level: ${CYAN}STANDARD${NC} (consider CodeGraph for deep analysis)"
else
  echo -e "   🎯 Intelligence Level: ${CYAN}FULL${NC} (CodeGraph + qmd strongly recommended)"
fi
