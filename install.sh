#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  CodyMaster Skills Kit v3.4.0 — Universal Installer
#  Inspired by: npx skills add (vercel-labs/skills)
#
#  Usage:
#    bash install.sh                    Interactive menu
#    bash install.sh --claude           Claude Code (non-interactive)
#    bash install.sh --claude --global  Claude Code, user scope
#    bash install.sh --claude --project Claude Code, project scope
#    bash install.sh --gemini           Gemini CLI
#    bash install.sh --aider            Aider
#    bash install.sh --continue         Continue.dev
#    bash install.sh --amazon-q         Amazon Q CLI (q)
#    bash install.sh --amp              Amp
#    bash install.sh --all              All detected platforms
# ════════════════════════════════════════════════════════════════

set -e

# ── Colors ──────────────────────────────────────────────────────
G='\033[0;32m'; B='\033[0;34m'; P='\033[0;35m'; O='\033[0;33m'
C='\033[0;36m'; R='\033[0;31m'; W='\033[1;37m'; NC='\033[0m'; BOLD='\033[1m'

REPO_URL="https://github.com/tody-agent/codymaster"
RAW_URL="https://raw.githubusercontent.com/tody-agent/codymaster/main"
VERSION="3.4.0"
SCOPE="user"   # default scope for Claude Code

# ── i18n ────────────────────────────────────────────────────────
detect_lang() {
  local lang="${LANG:-en}"
  case "$lang" in
    vi*|VI*) echo "vi" ;;
    zh*|ZH*) echo "zh" ;;
    ko*|KO*) echo "ko" ;;
    ru*|RU*) echo "ru" ;;
    hi*|HI*) echo "hi" ;;
    *)       echo "en" ;;
  esac
}

LANG_CODE=$(detect_lang)

msg() {
  local key="$1"
  case "$LANG_CODE:$key" in
    vi:welcome)   echo "Chào mừng bạn đến với CodyMaster v${VERSION}" ;;
    vi:tagline)   echo "34+ kỹ năng AI cho Claude Code và các AI agents khác" ;;
    vi:detecting) echo "🔍 Đang phát hiện các AI agent đã cài..." ;;
    vi:found)     echo "✅ Đã tìm thấy" ;;
    vi:not_found) echo "❌ Không tìm thấy" ;;
    vi:select)    echo "Chọn platform để cài (nhập số, cách nhau dấu phẩy):" ;;
    vi:scope)     echo "Phạm vi cài đặt cho Claude Code:" ;;
    vi:scope_user)    echo "User (tất cả projects)" ;;
    vi:scope_project) echo "Project (chỉ project này)" ;;
    vi:done)      echo "✅ Hoàn tất!" ;;
    vi:onboard)   echo "🎯 Bắt đầu ngay trong Claude Code:" ;;
    vi:docs)      echo "📚 Tài liệu:" ;;

    zh:welcome)   echo "欢迎使用 CodyMaster v${VERSION}" ;;
    zh:tagline)   echo "Claude Code 的 34+ AI 技能" ;;
    zh:detecting) echo "🔍 检测已安装的 AI Agent..." ;;
    zh:found)     echo "✅ 已找到" ;;
    zh:not_found) echo "❌ 未找到" ;;
    zh:select)    echo "选择要安装的平台（输入数字，逗号分隔）:" ;;
    zh:scope)     echo "Claude Code 安装范围:" ;;
    zh:scope_user)    echo "用户级（所有项目）" ;;
    zh:scope_project) echo "项目级（仅此项目）" ;;
    zh:done)      echo "✅ 完成！" ;;
    zh:onboard)   echo "🎯 在 Claude Code 中立即开始:" ;;
    zh:docs)      echo "📚 文档:" ;;

    ko:welcome)   echo "CodyMaster v${VERSION}에 오신 것을 환영합니다" ;;
    ko:tagline)   echo "Claude Code용 34+ AI 스킬" ;;
    ko:detecting) echo "🔍 설치된 AI Agent 감지 중..." ;;
    ko:found)     echo "✅ 발견됨" ;;
    ko:not_found) echo "❌ 없음" ;;
    ko:select)    echo "설치할 플랫폼 선택 (숫자, 쉼표로 구분):" ;;
    ko:scope)     echo "Claude Code 설치 범위:" ;;
    ko:scope_user)    echo "사용자 (모든 프로젝트)" ;;
    ko:scope_project) echo "프로젝트 (이 프로젝트만)" ;;
    ko:done)      echo "✅ 완료!" ;;
    ko:onboard)   echo "🎯 Claude Code에서 바로 시작:" ;;
    ko:docs)      echo "📚 문서:" ;;

    *)
      case "$key" in
        welcome)   echo "Welcome to CodyMaster v${VERSION}" ;;
        tagline)   echo "34+ AI skills for Claude Code and other AI agents" ;;
        detecting) echo "🔍 Detecting installed AI agents..." ;;
        found)     echo "✅ Found" ;;
        not_found) echo "❌ Not found" ;;
        select)    echo "Select platforms to install (numbers, comma-separated):" ;;
        scope)     echo "Installation scope for Claude Code:" ;;
        scope_user)    echo "User — available across all projects (recommended)" ;;
        scope_project) echo "Project — this project only (committed to .claude/)" ;;
        done)      echo "✅ Done!" ;;
        onboard)   echo "🎯 Get started immediately in Claude Code:" ;;
        docs)      echo "📚 Documentation:" ;;
      esac
      ;;
  esac
}

# ── Header ───────────────────────────────────────────────────────
print_header() {
  echo ""
  echo -e "${C}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${C}${BOLD}║  🧠 CodyMaster Skills Kit                        ║${NC}"
  echo -e "${C}${BOLD}║  $(msg welcome | head -c 48 | awk '{printf "%-48s", $0}')║${NC}"
  echo -e "${C}${BOLD}║  $(msg tagline | head -c 48 | awk '{printf "%-48s", $0}')║${NC}"
  echo -e "${C}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

# ── Agent Detection ──────────────────────────────────────────────
detect_agents() {
  echo -e "${W}$(msg detecting)${NC}"
  echo ""

  DETECTED=()

  if command -v claude &>/dev/null; then
    echo -e "  ${P}${BOLD}1) 🟣 Claude Code${NC}        $(msg found)"
    DETECTED+=("claude")
  else
    echo -e "  ${P}1) 🟣 Claude Code${NC}        $(msg not_found)"
  fi

  if command -v gemini &>/dev/null; then
    echo -e "  ${C}${BOLD}2) 💎 Gemini CLI${NC}         $(msg found)"
    DETECTED+=("gemini")
  else
    echo -e "  ${C}2) 💎 Gemini CLI${NC}         $(msg not_found)"
  fi

  # Check for Cursor
  if [ -d "$HOME/.cursor" ] || [ -d "/Applications/Cursor.app" ]; then
    echo -e "  ${B}${BOLD}3) 🔵 Cursor${NC}             $(msg found)"
    DETECTED+=("cursor")
  else
    echo -e "  ${B}3) 🔵 Cursor${NC}             $(msg not_found)"
  fi

  if command -v codex &>/dev/null; then
    echo -e "  ${O}${BOLD}4) 🟠 Codex${NC}              $(msg found)"
    DETECTED+=("codex")
  else
    echo -e "  ${O}4) 🟠 Codex${NC}              $(msg not_found)"
  fi

  if command -v opencode &>/dev/null; then
    echo -e "  ${G}${BOLD}5) 📦 OpenCode${NC}           $(msg found)"
    DETECTED+=("opencode")
  else
    echo -e "  ${G}5) 📦 OpenCode${NC}           $(msg not_found)"
  fi

  if command -v aider &>/dev/null; then
    echo -e "  ${O}${BOLD}6) 🤖 Aider${NC}              $(msg found)"
    DETECTED+=("aider")
  else
    echo -e "  ${O}6) 🤖 Aider${NC}              $(msg not_found)"
  fi

  if [ -d "$HOME/.continue" ]; then
    echo -e "  ${B}${BOLD}7) 🔗 Continue.dev${NC}       $(msg found)"
    DETECTED+=("continue")
  else
    echo -e "  ${B}7) 🔗 Continue.dev${NC}       $(msg not_found)"
  fi

  if command -v q &>/dev/null; then
    echo -e "  ${W}${BOLD}8) ☁️  Amazon Q CLI${NC}      $(msg found)"
    DETECTED+=("amazon-q")
  else
    echo -e "  ${W}8) ☁️  Amazon Q CLI${NC}      $(msg not_found)"
  fi

  if command -v amp &>/dev/null; then
    echo -e "  ${G}${BOLD}9) ⚡ Amp${NC}                $(msg found)"
    DETECTED+=("amp")
  else
    echo -e "  ${G}9) ⚡ Amp${NC}                $(msg not_found)"
  fi

  echo -e "  ${W}10) 📋 Manual copy${NC}        (any platform)"
  echo ""
}

# ── Onboarding block ─────────────────────────────────────────────
print_onboarding() {
  local scope="$1"
  echo ""
  echo -e "${G}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${G}${BOLD}║  $(msg done | awk '{printf "%-48s", $0}')║${NC}"
  echo -e "${G}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${W}${BOLD}$(msg onboard)${NC}"
  echo ""
  echo -e "  ${C}/cm:demo${NC}       ← Run this first! Interactive tour"
  echo -e "  ${C}/cm:plan${NC}       ← Start a new feature"
  echo -e "  ${C}/cm:build${NC}      ← Build with TDD"
  echo -e "  ${C}/cm:debug${NC}      ← Fix a bug"
  echo -e "  ${C}/cm:review${NC}     ← Code review"
  echo -e "  ${C}/cm:deploy${NC}     ← Deploy safely"
  echo ""
  echo -e "${W}${BOLD}$(msg docs)${NC} ${C}https://cody-master-a5q.pages.dev/docs${NC}"
  echo ""
}

# ── Claude Code installer ────────────────────────────────────────
install_claude() {
  local scope="${1:-user}"
  echo ""
  echo -e "${P}${BOLD}Claude Code — Installing Cody Master${NC}"
  echo ""

  if command -v claude &>/dev/null; then
    # Cleanup old marketplace if exists
    claude plugin marketplace remove cody-master 2>/dev/null || true
    echo -e "  ${W}Adding marketplace...${NC}"
    claude plugin marketplace add tody-agent/codymaster 2>/dev/null || true
    echo -e "  ${W}Installing plugin (scope: ${scope})...${NC}"
    claude plugin install cm@codymaster --scope "$scope"
    echo ""
    echo -e "  ${G}✅ cm installed — scope: ${scope}${NC}"
    print_onboarding "$scope"
  else
    echo -e "  ${R}Claude Code CLI not found. Install from: https://claude.ai/code${NC}"
    echo ""
    echo "  Then run these commands in Claude Code:"
    echo ""
    echo -e "  ${BOLD}1.${NC} ${C}claude plugin marketplace add tody-agent/codymaster${NC}"
    echo -e "  ${BOLD}2.${NC} ${C}claude plugin install cm@codymaster --scope ${scope}${NC}"
    echo ""
    echo -e "  First thing after install: ${C}/cm:demo${NC}"
  fi
}

# ── Gemini CLI installer ─────────────────────────────────────────
install_gemini() {
  echo ""
  echo -e "${C}${BOLD}Gemini CLI — Installing Cody Master${NC}"
  echo ""
  if command -v gemini &>/dev/null; then
    echo -e "  ${W}Trying gemini extensions install...${NC}"
    if gemini extensions install "$REPO_URL" 2>/dev/null; then
      echo -e "  ${G}✅ Installed via Gemini extensions${NC}"
    else
      echo -e "  ${W}Falling back to direct skills copy...${NC}"
      install_antigravity "$HOME/.gemini/skills"
      echo -e "  ${G}✅ Skills copied to ~/.gemini/skills/${NC}"
      echo -e "  ${C}ℹ  Add to your GEMINI.md: @~/.gemini/skills/*/SKILL.md${NC}"
    fi
  else
    echo ""
    echo -e "  ${R}Gemini CLI not found. Install from:${NC}"
    echo -e "  ${C}https://github.com/google-gemini/gemini-cli${NC}"
    echo ""
    echo -e "  Then run:"
    echo -e "  ${C}gemini extensions install ${REPO_URL}${NC}"
  fi
}

# ── Aider installer ──────────────────────────────────────────────
install_aider() {
  echo ""
  echo -e "${O}${BOLD}Aider — Installing Cody Master${NC}"
  echo ""
  if command -v aider &>/dev/null; then
    local target="$HOME/.aider/skills"
    install_antigravity "$target"
    # Create .aiderignore entry if not present
    if [ ! -f ".aider.conf.yml" ] || ! grep -q "read:" .aider.conf.yml 2>/dev/null; then
      echo -e "  ${W}Tip: add skills context to .aider.conf.yml:${NC}"
      echo -e "  ${C}read: - ~/.aider/skills/cm-planning/SKILL.md${NC}"
    fi
    echo -e "  ${G}✅ Skills installed to ${target}${NC}"
  else
    echo -e "  ${R}Aider not found. Install: ${C}pip install aider-chat${NC}"
    echo -e "  Or: ${C}https://aider.chat${NC}"
  fi
}

# ── Continue.dev installer ───────────────────────────────────────
install_continue() {
  echo ""
  echo -e "${B}${BOLD}Continue.dev — Installing Cody Master${NC}"
  echo ""
  local rules_dir="$HOME/.continue/rules"
  mkdir -p "$rules_dir"
  local count=0
  for skill_dir in skills/*/; do
    skill_name=$(basename "$skill_dir")
    if [ -f "${skill_dir}SKILL.md" ]; then
      cp "${skill_dir}SKILL.md" "${rules_dir}/${skill_name}.md"
      count=$((count + 1))
    fi
  done
  echo -e "  ${G}✅ ${count} skill rules installed to ${rules_dir}${NC}"
  echo -e "  ${C}ℹ  Rules are auto-loaded by Continue.dev from ~/.continue/rules/${NC}"
}

# ── Amazon Q CLI installer ───────────────────────────────────────
install_amazon_q() {
  echo ""
  echo -e "${W}${BOLD}Amazon Q CLI — Installing Cody Master${NC}"
  echo ""
  local target="$HOME/.aws/amazonq/skills"
  install_antigravity "$target"
  echo -e "  ${G}✅ Skills installed to ${target}${NC}"
  echo -e "  ${W}To use in Q chat, reference skills:${NC}"
  echo -e "  ${C}q chat --context ~/.aws/amazonq/skills/cm-planning/SKILL.md${NC}"
}

# ── Amp installer ────────────────────────────────────────────────
install_amp() {
  echo ""
  echo -e "${G}${BOLD}Amp — Installing Cody Master${NC}"
  echo ""
  local target="$HOME/.amp/skills"
  install_antigravity "$target"
  echo -e "  ${G}✅ Skills installed to ${target}${NC}"
  echo -e "  ${C}ℹ  Reference skills in Amp via your AGENTS.md or system prompt${NC}"
}

# ── Gemini/Antigravity file copy ─────────────────────────────────
install_antigravity() {
  local target="$1"
  echo ""
  echo -e "${G}${BOLD}Installing skills to: ${target}${NC}"
  echo ""
  if [ ! -d "skills" ]; then
    echo -e "${R}Error: Run from the cody-master repo root.${NC}"
    exit 1
  fi
  mkdir -p "$target"
  local count=0
  for skill_dir in skills/*/; do
    skill_name=$(basename "$skill_dir")
    if [ -f "${skill_dir}SKILL.md" ]; then
      cp -r "$skill_dir" "${target}/${skill_name}"
      echo -e "  ${G}✅${NC} $skill_name"
      count=$((count + 1))
    fi
  done
  echo ""
  echo -e "${G}${count} skills installed to ${target}${NC}"
}

# ── Scope selector for Claude ────────────────────────────────────
select_scope() {
  echo ""
  echo -e "${W}${BOLD}$(msg scope)${NC}"
  echo ""
  echo -e "  ${BOLD}1)${NC} 🌐 $(msg scope_user)"
  echo -e "  ${BOLD}2)${NC} 📁 $(msg scope_project)"
  echo ""
  read -p "  Choose (1-2, default=1): " scope_choice
  case "${scope_choice:-1}" in
    2) SCOPE="project" ;;
    *) SCOPE="user" ;;
  esac
}

# ════════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════════

print_header

# ── Non-interactive flags ────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --global|--user)   SCOPE="user" ;;
    --project|--local) SCOPE="project" ;;
  esac
done

if [[ "$1" == "--claude" ]]; then
  install_claude "$SCOPE"
  exit 0
fi

if [[ "$1" == "--gemini" ]]; then
  install_gemini
  exit 0
fi

if [[ "$1" == "--aider" ]]; then
  install_aider
  exit 0
fi

if [[ "$1" == "--continue" ]]; then
  install_continue
  exit 0
fi

if [[ "$1" == "--amazon-q" ]]; then
  install_amazon_q
  exit 0
fi

if [[ "$1" == "--amp" ]]; then
  install_amp
  exit 0
fi

if [[ "$1" == "--all" ]]; then
  echo -e "${W}${BOLD}Installing to all detected platforms...${NC}"
  echo ""
  command -v claude &>/dev/null && install_claude "$SCOPE"
  command -v gemini &>/dev/null && install_gemini
  command -v aider  &>/dev/null && install_aider
  [ -d "$HOME/.continue" ]    && install_continue
  command -v q      &>/dev/null && install_amazon_q
  command -v amp    &>/dev/null && install_amp
  exit 0
fi

# ── Interactive mode ─────────────────────────────────────────────
detect_agents

echo -e "${W}${BOLD}$(msg select)${NC}"
echo -e "  ${W}(or press Enter to install for all detected: ${#DETECTED[@]} found)${NC}"
echo ""
read -p "  > " platform_input

# Default: all detected
if [ -z "$platform_input" ] && [ ${#DETECTED[@]} -gt 0 ]; then
  platforms=("${DETECTED[@]}")
else
  IFS=',' read -ra nums <<< "$platform_input"
  platforms=()
  for n in "${nums[@]}"; do
    n=$(echo "$n" | tr -d ' ')
    case "$n" in
      1)  platforms+=("claude") ;;
      2)  platforms+=("gemini") ;;
      3)  platforms+=("cursor") ;;
      4)  platforms+=("codex") ;;
      5)  platforms+=("opencode") ;;
      6)  platforms+=("aider") ;;
      7)  platforms+=("continue") ;;
      8)  platforms+=("amazon-q") ;;
      9)  platforms+=("amp") ;;
      10) platforms+=("manual") ;;
    esac
  done
fi

# Install for each selected platform
for platform in "${platforms[@]}"; do
  case "$platform" in
    claude)
      select_scope
      install_claude "$SCOPE"
      ;;
    gemini)
      install_gemini
      ;;
    cursor)
      echo ""
      echo -e "${B}${BOLD}Cursor — Plugin Install${NC}"
      echo -e "  In Cursor Agent chat, run: ${C}/add-plugin cm${NC}"
      ;;
    codex)
      echo ""
      echo -e "${O}${BOLD}Codex — Install${NC}"
      echo -e "  Tell Codex: ${C}Fetch and follow ${RAW_URL}/.codex/INSTALL.md${NC}"
      ;;
    opencode)
      echo ""
      echo -e "${G}${BOLD}OpenCode — Install${NC}"
      echo -e "  Tell OpenCode: ${C}Fetch and follow ${RAW_URL}/.opencode/INSTALL.md${NC}"
      ;;
    aider)
      install_aider
      ;;
    continue)
      install_continue
      ;;
    amazon-q)
      install_amazon_q
      ;;
    amp)
      install_amp
      ;;
    manual)
      echo ""
      echo -e "${W}${BOLD}Manual Copy — Any Platform${NC}"
      echo ""
      echo -e "  ${C}# Gemini CLI${NC}"
      echo -e "  gemini extensions install ${REPO_URL}"
      echo ""
      echo -e "  ${C}# Aider${NC}"
      echo -e "  bash install.sh --aider"
      echo ""
      echo -e "  ${C}# Continue.dev${NC}"
      echo -e "  bash install.sh --continue"
      echo ""
      echo -e "  ${C}# Any platform (copy)${NC}"
      echo -e "  cp -r skills/* ~/.gemini/skills/"
      ;;
  esac
done

echo ""
echo -e "${C}$(msg docs) https://cody-master-a5q.pages.dev/docs${NC}"
echo ""
