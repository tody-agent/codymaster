#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  CodyMaster — Universal Installer Bootstrap (v6.1.0)
#
#  Quick paths:
#    npm install -g codymaster && cm        ← the canonical install
#    bash install.sh                        ← this script (Node-aware fallback)
#    bash install.sh --all --profile core   ← non-interactive multi-platform
#
#  This script is a thin bootstrap. The real install logic lives in the
#  `cm install` TypeScript engine (src/install/). When Node is available
#  we hand off to it. When it isn't, we fall back to a minimal rsync
#  copy for power users.
# ════════════════════════════════════════════════════════════════

set -e

VERSION="6.1.0"
REPO_URL="https://github.com/tody-agent/codymaster"
RAW_URL="https://raw.githubusercontent.com/tody-agent/codymaster/main"

G='\033[0;32m'; C='\033[0;36m'; O='\033[0;33m'; R='\033[0;31m'
W='\033[1;37m'; NC='\033[0m'; BOLD='\033[1m'; DIM='\033[2m'

SCRIPT_DIR=""
_src="${BASH_SOURCE[0]:-$0}"
if [[ "$_src" != /dev/fd/* ]] && [[ "$_src" != /proc/self/fd/* ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$_src")" && pwd)"
fi

# ── Hamster banner ───────────────────────────────────────────────
banner() {
  cat <<'EOF'
     \ ( \_/ ) /
    \ (  ^ u ^  ) /
   --(  (___)  )--
    | [     ] |
     '--w-w--'
EOF
  echo -e "    ${W}${BOLD}CodyMaster v${VERSION}${NC} — ${C}AI skills for every coding agent${NC}"
  echo ""
  echo -e "    ${C}🐹: Cheeks ready. Let's get you set up!${NC}"
  echo ""
}

# ── Locate or fetch the codymaster source tree ───────────────────
ensure_source() {
  if [[ -n "$SCRIPT_DIR" && -d "$SCRIPT_DIR/skills" && -d "$SCRIPT_DIR/dist" ]]; then
    CM_HOME="$SCRIPT_DIR"
    return
  fi
  if [[ -d "skills" && -d "dist" ]]; then
    CM_HOME="$PWD"
    return
  fi
  CM_HOME="$HOME/.cody-master"
  if [[ ! -d "$CM_HOME/skills" ]]; then
    if ! command -v git &>/dev/null; then
      echo -e "${R}git not found. Install git or use:  npm install -g codymaster${NC}"
      exit 1
    fi
    echo -e "  ${W}Cloning into $CM_HOME...${NC}"
    git clone --depth 1 "$REPO_URL" "$CM_HOME"
  else
    git -C "$CM_HOME" pull --quiet --ff-only 2>/dev/null || true
  fi
  if [[ ! -d "$CM_HOME/dist" ]] && command -v npm &>/dev/null; then
    echo -e "  ${W}Building TypeScript...${NC}"
    (cd "$CM_HOME" && npm install --silent && npm run build --silent)
  fi
}

# ── Hand off to the Node-based engine ────────────────────────────
delegate_to_cli() {
  local args=("$@")
  if command -v node &>/dev/null && [[ -f "$CM_HOME/dist/index.js" ]]; then
    CM_HOME="$CM_HOME" node "$CM_HOME/dist/index.js" install "${args[@]}"
    return $?
  fi
  return 127
}

# ── Pure-bash fallback (no Node) ─────────────────────────────────
fallback_copy() {
  local platform="$1"
  local profile="${2:-full}"
  local target=""
  case "$platform" in
    claude-code)    target="$HOME/.claude/skills" ;;
    claude-desktop) target="$HOME/Library/Application Support/Claude/skills" ;;
    cursor)         target="$HOME/.cursor/rules" ;;
    windsurf)       target="$HOME/.windsurf/rules" ;;
    antigravity)    target="$HOME/.gemini/antigravity/skills" ;;
    codex)          target="$HOME/.codex/skills" ;;
    opencode)       target="$HOME/.opencode/skills" ;;
    cline)          target="$HOME/.cline/skills" ;;
    kiro)           target="$HOME/.kiro/steering" ;;
    aider)          target="$HOME/.aider/skills" ;;
    continue)       target="$HOME/.continue/rules" ;;
    amazon-q)       target="$HOME/.aws/amazonq/skills" ;;
    amp)            target="$HOME/.amp/skills" ;;
    *) echo -e "${R}Unknown platform: $platform${NC}"; return 1 ;;
  esac
  mkdir -p "$target"
  echo -e "  ${W}Copying skills → ${target}${NC}"
  local allow=""
  if [[ "$profile" != "full" && -f "$CM_HOME/skills/profiles/$profile.txt" ]]; then
    allow=$(grep -v '^[[:space:]]*#' "$CM_HOME/skills/profiles/$profile.txt" | sed '/^$/d')
  fi
  local count=0
  for d in "$CM_HOME"/skills/cm-*/; do
    name=$(basename "$d")
    if [[ -n "$allow" ]] && ! grep -qx "$name" <<<"$allow"; then continue; fi
    [[ -f "${d}SKILL.md" ]] || continue
    cp -r "$d" "$target/$name"
    count=$((count + 1))
  done
  echo -e "  ${G}✅ ${count} skills installed to ${target}${NC}"
}

# ── Argument parsing ─────────────────────────────────────────────
TARGETS=()
PROFILE="core"
SCOPE="user"
DRY=""
ALL=0
LIST=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)           ALL=1 ;;
    --list)          LIST=1 ;;
    --profile)       PROFILE="$2"; shift ;;
    --profile=*)     PROFILE="${1#*=}" ;;
    --scope)         SCOPE="$2"; shift ;;
    --scope=*)       SCOPE="${1#*=}" ;;
    --dry-run)       DRY="--dry-run" ;;
    -h|--help)
      sed -n '2,15p' "$0"; exit 0 ;;
    --*)             TARGETS+=("${1#--}") ;;
    *)               TARGETS+=("$1") ;;
  esac
  shift
done

# ── Main ─────────────────────────────────────────────────────────
banner
ensure_source

cli_args=()
[[ -n "$DRY" ]]    && cli_args+=("$DRY")
[[ "$ALL" -eq 1 ]] && cli_args+=("--all")
[[ "$LIST" -eq 1 ]] && cli_args+=("--list")
cli_args+=("--profile" "$PROFILE" "--scope" "$SCOPE")

if [[ "$ALL" -eq 1 || "$LIST" -eq 1 || ${#TARGETS[@]} -eq 0 ]]; then
  if delegate_to_cli "${cli_args[@]}"; then exit 0; fi
  echo -e "${O}Node not available — pass an explicit platform name to use the bash fallback, e.g.:${NC}"
  echo "  bash install.sh claude-code --profile core"
  exit 1
fi

for t in "${TARGETS[@]}"; do
  if delegate_to_cli "$t" "${cli_args[@]}"; then continue; fi
  echo -e "${O}⚠  Falling back to bash copy for ${t} (Node not detected)${NC}"
  fallback_copy "$t" "$PROFILE"
done

echo ""
echo -e "    ${G}🐹: Mission accomplished — Run ${W}cm${NC}${G} to explore.${NC}"
echo ""
