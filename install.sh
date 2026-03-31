#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  CodyMaster Skills Kit v4.3.0 — Universal Installer
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
C='\033[0;36m'; R='\033[0;31m'; W='\033[1;37m'; NC='\033[0m'; BOLD='\033[1m'; DIM='\033[2m'

REPO_URL="https://github.com/tody-agent/codymaster"
RAW_URL="https://raw.githubusercontent.com/tody-agent/codymaster/main"
VERSION="4.4.0"
SCOPE="user"   # default scope for Claude Code

if [ -d "skills" ]; then
  TOTAL_SKILLS=$(ls -1d skills/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
elif [ -d "$HOME/.cody-master/skills" ]; then
  TOTAL_SKILLS=$(ls -1d "$HOME/.cody-master/skills"/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
else
  TOTAL_SKILLS="60+"
fi


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
    vi:tagline)   echo "60+ kỹ năng AI cho Claude Code và các AI agents khác" ;;
    vi:detecting) echo "🔍 Đang phát hiện các AI agent đã cài..." ;;
    vi:found)     echo "✅ Đã tìm thấy" ;;
    vi:not_found) echo "❌ Không tìm thấy" ;;
    vi:select)    echo "Chọn platform để cài (nhập số, cách nhau dấu phẩy):" ;;
    vi:scope)     echo "Phạm vi cài đặt cho Claude Code:" ;;
    vi:scope_user)    echo "User (tất cả projects)" ;;
    vi:scope_project) echo "Project (chỉ project này)" ;;
    vi:done)      echo "✅ Hoàn tất!" ;;
    vi:onboard)   echo "🎯 Bắt đầu ngay với AI Agent của bạn:" ;;
    vi:docs)      echo "📚 Tài liệu:" ;;

    zh:welcome)   echo "欢迎使用 CodyMaster v${VERSION}" ;;
    zh:tagline)   echo "Claude Code 的 60+ AI 技能" ;;
    zh:detecting) echo "🔍 检测已安装的 AI Agent..." ;;
    zh:found)     echo "✅ 已找到" ;;
    zh:not_found) echo "❌ 未找到" ;;
    zh:select)    echo "选择要安装的平台（输入数字，逗号分隔）:" ;;
    zh:scope)     echo "Claude Code 安装范围:" ;;
    zh:scope_user)    echo "用户级（所有项目）" ;;
    zh:scope_project) echo "项目级（仅此项目）" ;;
    zh:done)      echo "✅ 完成！" ;;
    zh:onboard)   echo "🎯 立即开始与您的 AI Agent 合作:" ;;
    zh:docs)      echo "📚 文档:" ;;

    ko:welcome)   echo "CodyMaster v${VERSION}에 오신 것을 환영합니다" ;;
    ko:tagline)   echo "Claude Code용 60+ AI 스킬" ;;
    ko:detecting) echo "🔍 설치된 AI Agent 감지 중..." ;;
    ko:found)     echo "✅ 발견됨" ;;
    ko:not_found) echo "❌ 없음" ;;
    ko:select)    echo "설치할 플랫폼 선택 (숫자, 쉼표로 구분):" ;;
    ko:scope)     echo "Claude Code 설치 범위:" ;;
    ko:scope_user)    echo "사용자 (모든 프로젝트)" ;;
    ko:scope_project) echo "프로젝트 (이 프로젝트만)" ;;
    ko:done)      echo "✅ 완료!" ;;
    ko:onboard)   echo "🎯 AI Agent와 즉시 시작하세요:" ;;
    ko:docs)      echo "📚 문서:" ;;

    *)
      case "$key" in
        welcome)   echo "Welcome to CodyMaster v${VERSION}" ;;
        tagline)   echo "60+ AI skills for Claude Code and other AI agents" ;;
        detecting) echo "🔍 Detecting installed AI agents..." ;;
        found)     echo "✅ Found" ;;
        not_found) echo "❌ Not found" ;;
        select)    echo "Select platforms to install (numbers, comma-separated):" ;;
        scope)     echo "Installation scope for Claude Code:" ;;
        scope_user)    echo "User — available across all projects (recommended)" ;;
        scope_project) echo "Project — this project only (committed to .claude/)" ;;
        done)      echo "✅ Done!" ;;
        onboard)   echo "🎯 Get started immediately with your AI Agent:" ;;
        docs)      echo "📚 Documentation:" ;;
      esac
      ;;
  esac
}

# ── Header ───────────────────────────────────────────────────────
print_header() {
  clear
  hamster_sentiment "start"
  echo -e "    ${O}( . \ --- / . )${NC}"
  echo -e "     ${O}/${NC}   ${O}${BOLD}^   ^${NC}   ${O}\\\\${NC}"
  echo -e "    ${O}(${NC}      ${O}${BOLD}u${NC}      ${O})${NC}"
  echo -e "     ${O}|  \\ ___ /  |${NC}"
  echo -e "      ${O}'--w---w--'${NC}"
  echo ""
  echo -e "    ${O}${BOLD}$(msg welcome)${NC} 🐹"
  echo ""
  echo -e "    ${DIM}CodyMaster${NC} ${O}v${VERSION}${NC} ${DIM}• ${TOTAL_SKILLS} Skills • ~${NC}"
  echo -e "${DIM}  ──────────────────────────────────────────────────${NC}"
  echo ""
}

# ── Agent Detection ──────────────────────────────────────────────
detect_agents() {
  hamster_sentiment "progress"
  echo ""
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

# ── Hamster Sentiment ─────────────────────────────────────────────
hamster_sentiment() {
  local state="${1:-finish}"
  local idx=$(( RANDOM % 3 ))
  
  case $state in
    "start")
      case $idx in
        0) echo -e "    ${C}🐹: Whiskers twitching... CodyMaster incoming!${NC}" ;;
        1) echo -e "    ${C}🐹: Let's fill these cheeks with ${TOTAL_SKILLS} skills! ✨${NC}" ;;
        2) echo -e "    ${C}🐹: Waking up from a power nap! Let's build! 🐭${NC}" ;;
      esac
      ;;
    "progress")
      case $idx in
        0) echo -e "    ${C}🐹: Sniffing out your AI agents...${NC}" ;;
        1) echo -e "    ${C}🐹: Running on the wheel to speed this up! 🏃‍♂️💨${NC}" ;;
        2) echo -e "    ${C}🐹: Found a skill! Stashing it in my pocket... 💎${NC}" ;;
      esac
      ;;
    "finish")
      case $idx in
        0) echo -e "    ${C}🐹: Mission accomplished! Can I have a walnut now? 🥜${NC}" ;;
        1) echo -e "    ${C}🐹: My cheeks are stuffed with ${TOTAL_SKILLS} skills for you! ✨${NC}" ;;
        2) echo -e "    ${C}🐹: Terminal is Hamster-approved! Better than a wheel! 🎡${NC}" ;;
      esac
      ;;
  esac
}

# ── Onboarding block ─────────────────────────────────────────────
# ── Skill Guides Hub ─────────────────────────────────────────────
show_skill_guide() {
  local choice="$1"
  clear
  hamster_sentiment "finish"
  echo ""
  
  if [ "$LANG_CODE" = "vi" ]; then
    case "$choice" in
      1)
        echo -e "${Y}${BOLD}1. Hướng dẫn toàn tập${NC} (${C}cm-how-it-work${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Bạn mới cài CodyMaster và chưa biết bắt đầu từ đâu."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-how-it-work\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Giải thích quy trình từ ý tưởng đến lúc deploy một ứng dụng web bằng bộ skill này.\""
        ;;
      2)
        echo -e "${Y}${BOLD}2. Vibe Coding (Zero Code)${NC} (${C}cm-start${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Bạn có ý tưởng nhưng lười gõ từng dòng code."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-start\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Tôi muốn làm một trang web bán cà phê có giỏ hàng, dùng Tailwind CSS.\""
        ;;
      3)
        echo -e "${Y}${BOLD}3. Tham gia dự án có sẵn${NC} (${C}cm-brainstorm-idea${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Bạn nhảy vào một dự án có sẵn và thấy code quá rắc rối."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-brainstorm-idea\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Đọc toàn bộ project này và chỉ cho tôi 3 điểm yếu lớn nhất cần cải thiện ngay.\""
        ;;
      4)
        echo -e "${Y}${BOLD}4. Thiết kế giao diện (UX/UI)${NC} (${C}cm-ux-master / cm-ui-preview${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Bạn muốn web của mình đẹp như Apple hay Linear."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-ux-master\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Lấy style từ trang stripe.com và thiết kế cho tôi một trang thanh toán cực sang.\""
        ;;
      5)
        echo -e "${Y}${BOLD}5. Lập trình TDD & Pair code${NC} (${C}cm-tdd${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Bạn muốn code chắc chắn, không có lỗi khi chạy production."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-tdd\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Viết test case trước, sau đó code chức năng đăng ký người dùng cho tôi.\""
        ;;
      6)
        echo -e "${Y}${BOLD}6. Dọn dẹp & Tái cấu trúc${NC} (${C}cm-clean-code${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Code chạy được nhưng nhìn như \"bãi rác\"."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-clean-code\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Tối ưu lại file này: xóa code thừa, đặt lại tên biến cho chuẩn và dễ hiểu hơn.\""
        ;;
      7)
        echo -e "${Y}${BOLD}7. Quét & Sửa lỗi bảo mật${NC} (${C}cm-security-gate${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Sợ lộ API key hoặc web bị hack XSS."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-security-gate\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Kiểm tra xem project có lỗ hổng bảo mật nào không trước khi tôi push lên GitHub.\""
        ;;
      8)
        echo -e "${Y}${BOLD}8. Viết tài liệu Docs & API${NC} (${C}cm-dockit${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Lười viết tài liệu hướng dẫn cho đồng nghiệp hoặc khách hàng."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-dockit\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Tự động tạo file hướng dẫn sử dụng (README) cho toàn bộ project này.\""
        ;;
      9)
        echo -e "${Y}${BOLD}9. Tạo WOW Landing Page${NC} (${C}cm-cro-methodology${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Web có người vào nhưng không ai mua hàng/đăng ký."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm @/cm-cro-methodology\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Phân tích trang web này và chỉ cách tăng gấp đôi tỷ lệ khách hàng đăng ký.\""
        ;;
      10)
        echo -e "${Y}${BOLD}10. Bảng theo dõi tiến độ${NC} (${C}cm dashboard${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Muốn biết mình đã làm được bao nhiêu % công việc rồi."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm dashboard\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Hiện bảng dashboard để tôi xem tiến độ các task hiện tại.\""
        ;;
      11)
        echo -e "${Y}${BOLD}11. Xem Demo (Claude Code)${NC} (${C}/cm:demo${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Muốn xem CodyMaster tự \"múa\" code như thế nào."
        echo -e "${W}🚀 Câu lệnh:${NC} \`/cm:demo\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Bắt đầu demo: tự tạo một ứng dụng TodoList từ A-Z trong 1 phút.\""
        ;;
      12)
        echo -e "${Y}${BOLD}12. Trợ giúp & Cú pháp lệnh${NC} (${C}cm help${NC})"
        echo -e "${W}🎯 Tình huống:${NC} Quên lệnh hoặc muốn tìm thêm skill xịn khác."
        echo -e "${W}🚀 Câu lệnh:${NC} \`cm help\`"
        echo -e "${W}💡 Thử copy prompt này:${NC} \"Liệt kê các skill liên quan đến Growth Hacking và Marketing.\""
        ;;
    esac
  else
    case "$choice" in
      1)
        echo -e "${Y}${BOLD}1. The Ultimate Guide${NC} (${C}cm-how-it-work${NC})"
        echo -e "${W}🎯 Situation:${NC} You just installed CodyMaster and don't know where to start."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-how-it-work\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Explain the process from idea to deployment using this skill kit.\""
        ;;
      2)
        echo -e "${Y}${BOLD}2. Vibe Coding (Zero Code)${NC} (${C}cm-start${NC})"
        echo -e "${W}🎯 Situation:${NC} You have an idea but are too lazy to write code manually."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-start\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Build a coffee shop website with a cart using Tailwind CSS.\""
        ;;
      3)
        echo -e "${Y}${BOLD}3. Code an Existing Project${NC} (${C}cm-brainstorm-idea${NC})"
        echo -e "${W}🎯 Situation:${NC} You're joining an existing project and the code is a mess."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-brainstorm-idea\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Read this entire project and tell me the 3 biggest weaknesses.\""
        ;;
      4)
        echo -e "${Y}${BOLD}4. Generate UX/UI Designs${NC} (${C}cm-ux-master / cm-ui-preview${NC})"
        echo -e "${W}🎯 Situation:${NC} You want your web app to look as premium as Apple or Linear."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-ux-master\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Copy the style from stripe.com and design a high-end checkout page.\""
        ;;
      5)
        echo -e "${Y}${BOLD}5. Code TDD & Pair Coding${NC} (${C}cm-tdd${NC})"
        echo -e "${W}🎯 Situation:${NC} You want reliable code that doesn't break in production."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-tdd\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Write test cases first, then implement user registration for me.\""
        ;;
      6)
        echo -e "${Y}${BOLD}6. Clean & Refactor Codebase${NC} (${C}cm-clean-code${NC})"
        echo -e "${W}🎯 Situation:${NC} The code works but it looks like a \"garbage dump\"."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-clean-code\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Optimize this file: remove dead code and rename variables for clarity.\""
        ;;
      7)
        echo -e "${Y}${BOLD}7. Scan for Vulnerabilities${NC} (${C}cm-security-gate${NC})"
        echo -e "${W}🎯 Situation:${NC} Worried about leaking API keys or XSS hacks."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-security-gate\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Check if there are any security vulnerabilities before I push to GitHub.\""
        ;;
      8)
        echo -e "${Y}${BOLD}8. Write Docs & Generate APIs${NC} (${C}cm-dockit${NC})"
        echo -e "${W}🎯 Situation:${NC} Lazy to write documentation for teammates or clients."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-dockit\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Automatically generate a README guide for this entire project.\""
        ;;
      9)
        echo -e "${Y}${BOLD}9. Release WOW Landing Page${NC} (${C}cm-cro-methodology${NC})"
        echo -e "${W}🎯 Situation:${NC} Visitors come to your site but don't buy or sign up."
        echo -e "${W}🚀 Command:${NC} \`cm @/cm-cro-methodology\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Analyze this website and show me how to double my sign-up rate.\""
        ;;
      10)
        echo -e "${Y}${BOLD}10. Open Progress Dashboard${NC} (${C}cm dashboard${NC})"
        echo -e "${W}🎯 Situation:${NC} Want to know how much work is actually completed."
        echo -e "${W}🚀 Command:${NC} \`cm dashboard\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Show the dashboard so I can see the progress of current tasks.\""
        ;;
      11)
        echo -e "${Y}${BOLD}11. See an Interactive Demo${NC} (${C}/cm:demo${NC})"
        echo -e "${W}🎯 Situation:${NC} Want to see CodyMaster perform its magic automatically."
        echo -e "${W}🚀 Command:${NC} \`/cm:demo\`"
        echo -e "${W}💡 Try this prompt:${NC} \"Start demo: build a TodoList app from scratch in 1 minute.\""
        ;;
      12)
        echo -e "${Y}${BOLD}12. Help & Command List${NC} (${C}cm help${NC})"
        echo -e "${W}🎯 Situation:${NC} Forgot a command or looking for more cool skills."
        echo -e "${W}🚀 Command:${NC} \`cm help\`"
        echo -e "${W}💡 Try this prompt:${NC} \"List all skills related to Growth Hacking and Marketing.\""
        ;;
    esac
  fi

  echo ""
  echo -e "${DIM}──────────────────────────────────────────────────${NC}"
  echo -e "${W}$(msg press_enter) ${DIM}or 'q' to exit${NC}"
  read -r next_step
  if [ "$next_step" = "q" ]; then
    exit 0
  fi
}

# ── Onboarding block ─────────────────────────────────────────────
print_onboarding() {
  while true; do
    clear
    print_header
    
    if [ "$LANG_CODE" = "vi" ]; then
      echo -e "    ${W}${BOLD}🎉 Thành công! Bạn đã mở khóa ${TOTAL_SKILLS} kỹ năng AI toàn năng:${NC}"
      echo ""
      hamster_sentiment "finish"
      echo ""
      echo -e "  ${C}🎯 Orchestration${NC} : Lên kế hoạch & Điều phối Agent"
      echo -e "  ${C}🎨 Product${NC}       : Thiết kế UX/UI & Tâm lý hành vi"
      echo -e "  ${C}🔧 Engineering${NC}   : Code Full-stack & Tái cấu trúc"
      echo -e "  ${C}🔒 Security${NC}      : Bảo mật tự động & Chống rò rỉ"
      echo -e "  ${C}⚙️ Operations${NC}    : Triển khai an toàn & Quản lý CI/CD"
      echo -e "  ${C}📈 Growth${NC}        : Tối ưu chuyển đổi (CRO) & Tracking"
      echo ""
      echo -e "    ${W}${BOLD}💡 Nhập số (1-12) để xem hướng dẫn & ví dụ:${NC}"
      echo ""
      echo -e "   1. ${Y}Cách CodyMaster vận hành    ${NC} → cm-how-it-work"
      echo -e "   2. ${Y}Vibe coding (Zero code)     ${NC} → cm-start"
      echo -e "   3. ${Y}Tham gia dự án có sẵn       ${NC} → cm-brainstorm-idea"
      echo -e "   4. ${Y}Code giao diện từ URL/Ảnh   ${NC} → cm-ux-master"
      echo -e "   5. ${Y}Lập trình TDD & Pair code   ${NC} → cm-tdd"
      echo -e "   6. ${Y}Dọn dẹp & Tái cấu trúc      ${NC} → cm-clean-code"
      echo -e "   7. ${Y}Quét & Sửa lỗi bảo mật      ${NC} → cm-security-gate"
      echo -e "   8. ${Y}Viết tài liệu Docs & API    ${NC} → cm-dockit"
      echo -e "   9. ${Y}Tạo Landing Page \"WOW\"      ${NC} → cm-cro-methodology"
      echo -e "  10. ${Y}Bảng theo dõi tiến độ       ${NC} → cm dashboard"
      echo -e "  11. ${Y}Xem Demo tự động            ${NC} → /cm:demo"
      echo -e "  12. ${Y}Trợ giúp & Cú pháp lệnh      ${NC} → cm help"
    else
      echo -e "    ${W}${BOLD}🎉 Success! You just unlocked ${TOTAL_SKILLS} omnipotent AI skills:${NC}"
      echo ""
      hamster_sentiment "finish"
      echo ""
      echo -e "  ${C}🎯 Orchestration${NC} : Task Planning & Agent Synergy"
      echo -e "  ${C}🎨 Product${NC}       : UX/UI Mastery & User Psychology"
      echo -e "  ${C}🔧 Engineering${NC}   : Full-stack TDD & Refactoring"
      echo -e "  ${C}🔒 Security${NC}      : Automated Gates & Secret Shields"
      echo -e "  ${C}⚙️ Operations${NC}    : Safe Deployments & CI/CD Excellence"
      echo -e "  ${C}📈 Growth${NC}        : Conversion Tracking & Hacks"
      echo ""
      echo -e "    ${W}${BOLD}💡 Type a number (1-12) for guide & examples:${NC}"
      echo ""
      echo -e "   1. ${Y}The ultimate guide          ${NC} → cm-how-it-work"
      echo -e "   2. ${Y}Vibe coding (Zero code)     ${NC} → cm-start"
      echo -e "   3. ${Y}Code an existing project    ${NC} → cm-brainstorm-idea"
      echo -e "   4. ${Y}Generate UX/UI designs      ${NC} → cm-ux-master"
      echo -e "   5. ${Y}Code TDD & Pair coding      ${NC} → cm-tdd"
      echo -e "   6. ${Y}Clean & Refactor codebase   ${NC} → cm-clean-code"
      echo -e "   7. ${Y}Scan for vulnerabilities    ${NC} → cm-security-gate"
      echo -e "   8. ${Y}Write docs & generate APIs  ${NC} → cm-dockit"
      echo -e "   9. ${Y}Release WOW landing page    ${NC} → cm-cro-methodology"
      echo -e "  10. ${Y}Open progress dashboard     ${NC} → cm dashboard"
      echo -e "  11. ${Y}See an interactive demo     ${NC} → /cm:demo"
      echo -e "  12. ${Y}Help & Command list         ${NC} → cm help"
    fi
    
    echo ""
    echo -e "    ${W}${BOLD}$(msg docs)${NC} ${C}https://cody.todyle.com/docs${NC}"
    echo ""
    echo -e "    ${DIM}Press 'q' to exit.${NC}"
    echo -n "    > "
    read -r user_choice
    
    if [[ "$user_choice" =~ ^[0-9]+$ ]] && [ "$user_choice" -gt 0 ] && [ "$user_choice" -le 12 ]; then
      show_skill_guide "$user_choice"
    elif [ "$user_choice" = "q" ]; then
      break
    fi
  done
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

# ── Gemini CLI / Antigravity installer ────────────────────────────
install_gemini() {
  echo ""
  echo -e "${C}${BOLD}Gemini CLI / Antigravity — Installing Cody Master${NC}"
  echo ""
  target="$HOME/.gemini/antigravity/skills"
  install_skills_to "$target"
  echo ""
  echo -e "  ${G}✅ Skills installed to ${target}${NC}"
  echo -e "  ${C}ℹ  Add to your GEMINI.md: @~/.gemini/antigravity/skills/cm-skill-index/SKILL.md${NC}"
  echo -e "  ${C}ℹ  Skills will auto-activate in Antigravity and Gemini CLI${NC}"
}

# ── Aider installer ──────────────────────────────────────────────
install_aider() {
  echo ""
  echo -e "${O}${BOLD}Aider — Installing Cody Master${NC}"
  echo ""
  target="$HOME/.aider/skills"
  install_skills_to "$target"
  echo -e "  ${W}Tip: add skills context to .aider.conf.yml:${NC}"
  echo -e "  ${C}read: - ~/.aider/skills/cm-planning/SKILL.md${NC}"
  echo -e "  ${G}✅ Skills installed to ${target}${NC}"
}

# ── Continue.dev installer ───────────────────────────────────────
install_continue() {
  echo ""
  echo -e "${B}${BOLD}Continue.dev — Installing Cody Master${NC}"
  echo ""
  target="$HOME/.continue/rules"
  install_skills_to "$target" "md"
  echo -e "  ${C}ℹ  Rules are auto-loaded by Continue.dev from ~/.continue/rules/${NC}"
}

# ── Amazon Q CLI installer ───────────────────────────────────────
install_amazon_q() {
  echo ""
  echo -e "${W}${BOLD}Amazon Q CLI — Installing Cody Master${NC}"
  echo ""
  target="$HOME/.aws/amazonq/skills"
  install_skills_to "$target"
  echo -e "  ${G}✅ Skills installed to ${target}${NC}"
  echo -e "  ${W}To use in Q chat, reference skills:${NC}"
  echo -e "  ${C}q chat --context ~/.aws/amazonq/skills/cm-planning/SKILL.md${NC}"
}

# ── Amp installer ────────────────────────────────────────────────
install_amp() {
  echo ""
  echo -e "${G}${BOLD}Amp — Installing Cody Master${NC}"
  echo ""
  target="$HOME/.amp/skills"
  install_skills_to "$target"
  echo -e "  ${G}✅ Skills installed to ${target}${NC}"
  echo -e "  ${C}ℹ  Reference skills in Amp via your AGENTS.md or system prompt${NC}"
}

# ── CLI installer ────────────────────────────────────────────────
install_cli() {
  if command -v npm &>/dev/null; then
    echo ""
    echo -e "${G}${BOLD}CLI Dashboard — Installing Cody Master CLI${NC}"
    echo ""
    echo -e "  To get the full experience with the ${C}cm${NC} command and visual dashboard,"
    echo -e "  it is recommended to install the global npm package."
    echo ""
    read -p "  Install codymaster globally? (y/N): " install_npm
    if [[ "$install_npm" =~ ^[Yy]$ ]]; then
      echo -e "  ${W}Running: npm install -g codymaster${NC}"
      npm install -g codymaster || echo -e "  ${O}Note: You might need sudo for global install: sudo npm install -g codymaster${NC}"
    fi
  fi
}

# ── Ensure clone exists ──────────────────────────────────────────
CLONE_DIR=""
ensure_clone() {
  # If we're in the repo root with skills/ dir, use it directly
  if [ -d "skills" ]; then
    CLONE_DIR="."
    return
  fi

  # If ~/.cody-master already exists and has skills, use it
  if [ -d "$HOME/.cody-master/skills" ]; then
    CLONE_DIR="$HOME/.cody-master"
    return
  fi

  # Clone the repo
  echo -e "  ${W}Cloning CodyMaster to ~/.cody-master...${NC}"
  git clone --depth 1 "${REPO_URL}.git" "$HOME/.cody-master" 2>/dev/null || {
    echo -e "  ${R}Error: Failed to clone ${REPO_URL}${NC}"
    echo -e "  ${R}Check your internet connection and try again.${NC}"
    exit 1
  }
  CLONE_DIR="$HOME/.cody-master"
  echo -e "  ${G}✅ Cloned to ~/.cody-master${NC}"
}

# ── Copy skills to target directory ──────────────────────────────
install_skills_to() {
  local target="$1"
  local format="${2:-raw}"
  ensure_clone
  echo ""
  echo -e "${G}${BOLD}Installing skills to: ${target}${NC}"
  echo ""
  mkdir -p "$target"
  local count=0
  local installed=()
  for skill_dir in "${CLONE_DIR}"/skills/*/; do
    skill_name=$(basename "$skill_dir")
    if [ -f "${skill_dir}SKILL.md" ]; then
      if [[ "$format" == "mdc" ]]; then
        # Create Cursor glob native format
        echo "---" > "${target}/${skill_name}.mdc"
        echo "description: ${skill_name}" >> "${target}/${skill_name}.mdc"
        echo "globs: *" >> "${target}/${skill_name}.mdc"
        echo "---" >> "${target}/${skill_name}.mdc"
        cat "${skill_dir}SKILL.md" >> "${target}/${skill_name}.mdc"
        installed+=("${skill_name}.mdc")
      elif [[ "$format" == "md" ]]; then
        cp "${skill_dir}SKILL.md" "${target}/${skill_name}.md"
        installed+=("${skill_name}.md")
      else
        cp -r "$skill_dir" "${target}/${skill_name}"
        installed+=("$skill_name")
      fi
      count=$((count + 1))
    fi
  done
  
  local line="  ${DIM}"
  for s in "${installed[@]}"; do
    if [ ${#line} -gt 70 ]; then
      echo -e "${line}${NC}"
      line="  ${DIM}"
    fi
    line="${line}${s}, "
  done
  if [ "${line}" != "  ${DIM}" ]; then
    echo -e "${line%, }${NC}"
  fi

  echo ""
  echo -e "${G}✅ ${count} skills installed to ${target}${NC}"
}

# ── Legacy alias ─────────────────────────────────────────────────
install_antigravity() {
  install_skills_to "$1"
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

if [[ "$1" == "--gemini" ]] || [[ "$1" == "--antigravity" ]]; then
  install_gemini
  print_onboarding
  exit 0
fi

if [[ "$1" == "--cursor" ]]; then
  echo ""
  echo -e "${B}${BOLD}Cursor — Installing Cody Master${NC}"
  echo ""
  target=".cursor/rules"
  install_skills_to "$target" "mdc"
  echo -e "  ${C}ℹ  Cursor will automatically load .mdc rules from this project${NC}"
  print_onboarding
  exit 0
fi

if [[ "$1" == "--aider" ]]; then
  install_aider
  print_onboarding
  exit 0
fi

if [[ "$1" == "--continue" ]]; then
  install_continue
  print_onboarding
  exit 0
fi

if [[ "$1" == "--amazon-q" ]]; then
  install_amazon_q
  print_onboarding
  exit 0
fi

if [[ "$1" == "--amp" ]]; then
  install_amp
  print_onboarding
  exit 0
fi

if [[ "$1" == "--kiro" ]]; then
  echo ""
  echo -e "${O}${BOLD}Kiro — Installing Cody Master${NC}"
  echo ""
  install_skills_to ".kiro/steering" "raw"
  print_onboarding
  exit 0
fi

if [[ "$1" == "--windsurf" ]]; then
  echo ""
  echo -e "${O}${BOLD}Windsurf — Installing Cody Master${NC}"
  echo ""
  install_skills_to ".windsurf/rules" "raw"
  print_onboarding
  exit 0
fi

if [[ "$1" == "--cline" ]]; then
  echo ""
  echo -e "${O}${BOLD}Cline/RooCode — Installing Cody Master${NC}"
  echo ""
  install_skills_to ".cline/skills" "raw"
  print_onboarding
  exit 0
fi

if [[ "$1" == "--opencode" ]]; then
  echo ""
  echo -e "${G}${BOLD}OpenCode — Installing Cody Master${NC}"
  echo ""
  install_skills_to ".opencode/skills" "raw"
  print_onboarding
  exit 0
fi

if [[ "$1" == "--copilot" ]]; then
  echo ""
  echo -e "${G}${BOLD}GitHub Copilot — Installing Cody Master${NC}"
  echo ""
  echo -e "  Please manually add skills context to copilot-instructions.md:"
  echo -e "  ${C}cat ~/.cody-master/skills/cm-planning/SKILL.md >> .github/copilot-instructions.md${NC}"
  exit 0
fi

if [[ "$1" == "--all" ]]; then
  echo -e "${W}${BOLD}Installing to all detected platforms...${NC}"
  echo ""
  command -v claude &>/dev/null && install_claude "$SCOPE"
  install_gemini
  command -v aider  &>/dev/null && install_aider
  [ -d "$HOME/.continue" ]    && install_continue
  command -v q      &>/dev/null && install_amazon_q
  command -v amp    &>/dev/null && install_amp
  [ -d "$HOME/.cursor" ] || [ -d "/Applications/Cursor.app" ] && {
    install_skills_to ".cursor/rules" "mdc"
  }
  install_cli
  print_onboarding
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
      echo -e "  ${C}# Gemini CLI / Antigravity${NC}"
      echo -e "  git clone --depth 1 ${REPO_URL}.git ~/.cody-master"
      echo -e "  cp -r ~/.cody-master/skills/* ~/.gemini/antigravity/skills/"
      echo ""
      echo -e "  ${C}# Aider${NC}"
      echo -e "  bash install.sh --aider"
      echo ""
      echo -e "  ${C}# Continue.dev${NC}"
      echo -e "  bash install.sh --continue"
      echo ""
      echo -e "  ${C}# Any platform (copy)${NC}"
      echo -e "  cp -r ~/.cody-master/skills/* <your-platform-skills-dir>/"
      ;;
  esac
done

install_cli
print_onboarding

echo ""
echo -e "${C}$(msg docs) https://cody.todyle.com/docs${NC}"
echo ""
