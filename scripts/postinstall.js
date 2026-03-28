#!/usr/bin/env node

const G = '\x1b[32m';
const C = '\x1b[36m';
const W = '\x1b[37m';
const O = '\x1b[33m';
const Y = '\x1b[1;33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const NC = '\x1b[0m';

// Simple check for Vietnamese environment for the CORE UI
const isVi = Intl.DateTimeFormat().resolvedOptions().locale.startsWith('vi');

const sentiments = {
  start: [
    "🐹: Whiskers twitching... CodyMaster incoming!",
    "🐹: Let's fill these cheeks with 65 skills! ✨",
    "🐹: Waking up from a power nap! Let's build! 🐭"
  ],
  progress: [
    "🐹: Sniffing out your AI agents...",
    "🐹: Running on the wheel to speed this up! 🏃💨",
    "🐹: Found a skill! Stashing it in my pocket... 💎"
  ],
  finish: [
    "🐹: Mission accomplished! Can I have a walnut now? 🥜",
    "🐹: My cheeks are stuffed with 65 skills for you! ✨",
    "🐹: Terminal is Hamster-approved! Better than a wheel! 🎡",
    "🐹: 65 skills stored. I'm ready for vibe coding! ⚡"
  ]
};

const getSentiment = (state) => {
  const list = sentiments[state];
  return `    ${C}${list[Math.floor(Math.random() * list.length)]}${NC}`;
};

const showSkillGuide = (choice) => {
  console.clear();
  console.log(`     ${G}\\${NC} ${O}( \\_/ )${NC} ${G}/${NC}`);
  console.log(`    ${G}\\${NC} ${O}(${NC} ${G}^ u ^${NC} ${O})${NC} ${G}/${NC}`);
  console.log(`   ${G}--${NC} ${O}(  ___  )${NC} ${G}--${NC}`);
  console.log('');
  
  if (isVi) {
    switch(choice) {
      case '1':
        console.log(`${Y}${BOLD}1. Hướng dẫn toàn tập${NC} (${C}cm-how-it-work${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Bạn mới cài CodyMaster và chưa biết bắt đầu từ đâu.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-how-it-work\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Giải thích quy trình từ ý tưởng đến lúc deploy một ứng dụng web bằng bộ skill này."`);
        break;
      case '2':
        console.log(`${Y}${BOLD}2. Vibe Coding (Zero Code)${NC} (${C}cm-start${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Bạn có ý tưởng nhưng lười gõ từng dòng code.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-start\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Tôi muốn làm một trang web bán cà phê có giỏ hàng, dùng Tailwind CSS."`);
        break;
      case '3':
        console.log(`${Y}${BOLD}3. Tham gia dự án có sẵn${NC} (${C}cm-brainstorm-idea${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Bạn nhảy vào một dự án có sẵn và thấy code quá rắc rối.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-brainstorm-idea\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Đọc toàn bộ project này và chỉ cho tôi 3 điểm yếu lớn nhất cần cải thiện ngay."`);
        break;
      case '4':
        console.log(`${Y}${BOLD}4. Thiết kế giao diện (UX/UI)${NC} (${C}cm-ux-master / cm-ui-preview${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Bạn muốn web của mình đẹp như Apple hay Linear.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-ux-master\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Lấy style từ trang stripe.com và thiết kế cho tôi một trang thanh toán cực sang."`);
        break;
      case '5':
        console.log(`${Y}${BOLD}5. Lập trình TDD & Pair code${NC} (${C}cm-tdd${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Bạn muốn code chắc chắn, không có lỗi khi chạy production.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-tdd\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Viết test case trước, sau đó code chức năng đăng ký người dùng cho tôi."`);
        break;
      case '6':
        console.log(`${Y}${BOLD}6. Dọn dẹp & Tái cấu trúc${NC} (${C}cm-clean-code${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Code chạy được nhưng nhìn như "bãi rác".`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-clean-code\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Tối ưu lại file này: xóa code thừa, đặt lại tên biến cho chuẩn và dễ hiểu hơn."`);
        break;
      case '7':
        console.log(`${Y}${BOLD}7. Quét & Sửa lỗi bảo mật${NC} (${C}cm-security-gate${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Sợ lộ API key hoặc web bị hack XSS.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-security-gate\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Kiểm tra xem project có lỗ hổng bảo mật nào không trước khi tôi push lên GitHub."`);
        break;
      case '8':
        console.log(`${Y}${BOLD}8. Viết tài liệu Docs & API${NC} (${C}cm-dockit${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Lười viết tài liệu hướng dẫn cho đồng nghiệp hoặc khách hàng.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-dockit\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Tự động tạo file hướng dẫn sử dụng (README) cho toàn bộ project này."`);
        break;
      case '9':
        console.log(`${Y}${BOLD}9. Tạo WOW Landing Page${NC} (${C}cm-cro-methodology${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Web có người vào nhưng không ai mua hàng/đăng ký.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm @/cm-cro-methodology\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Phân tích trang web này và chỉ cách tăng gấp đôi tỷ lệ khách hàng đăng ký."`);
        break;
      case '10':
        console.log(`${Y}${BOLD}10. Bảng theo dõi tiến độ${NC} (${C}cm dashboard${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Muốn biết mình đã làm được bao nhiêu % công việc rồi.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm dashboard\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Hiện bảng dashboard để tôi xem tiến độ các task hiện tại."`);
        break;
      case '11':
        console.log(`${Y}${BOLD}11. Xem Demo (Claude Code)${NC} (${C}/cm:demo${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Muốn xem CodyMaster tự "múa" code như thế nào.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`/cm:demo\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Bắt đầu demo: tự tạo một ứng dụng TodoList từ A-Z trong 1 phút."`);
        break;
      case '12':
        console.log(`${Y}${BOLD}12. Trợ giúp & Cú pháp lệnh${NC} (${C}cm help${NC})`);
        console.log(`${BOLD}🎯 Tình huống:${NC} Quên lệnh hoặc muốn tìm thêm skill xịn khác.`);
        console.log(`${BOLD}🚀 Câu lệnh:${NC} \`cm help\``);
        console.log(`${BOLD}💡 Thử copy prompt này:${NC} "Liệt kê các skill liên quan đến Growth Hacking và Marketing."`);
        break;
    }
  } else {
    switch(choice) {
      case '1':
        console.log(`${Y}${BOLD}1. The Ultimate Guide${NC} (${C}cm-how-it-work${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} You just installed CodyMaster and don't know where to start.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-how-it-work\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Explain the process from idea to deployment using this skill kit."`);
        break;
      case '2':
        console.log(`${Y}${BOLD}2. Vibe Coding (Zero Code)${NC} (${C}cm-start${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} You have an idea but are too lazy to write code manually.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-start\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Build a coffee shop website with a cart using Tailwind CSS."`);
        break;
      case '3':
        console.log(`${Y}${BOLD}3. Code an Existing Project${NC} (${C}cm-brainstorm-idea${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} You're joining an existing project and the code is a mess.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-brainstorm-idea\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Read this entire project and tell me the 3 biggest weaknesses."`);
        break;
      case '4':
        console.log(`${Y}${BOLD}4. Generate UX/UI Designs${NC} (${C}cm-ux-master / cm-ui-preview${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} You want your web app to look as premium as Apple or Linear.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-ux-master\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Copy the style from stripe.com and design a high-end checkout page."`);
        break;
      case '5':
        console.log(`${Y}${BOLD}5. Code TDD & Pair Coding${NC} (${C}cm-tdd${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} You want reliable code that doesn't break in production.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-tdd\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Write test cases first, then implement user registration for me."`);
        break;
      case '6':
        console.log(`${Y}${BOLD}6. Clean & Refactor Codebase${NC} (${C}cm-clean-code${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} The code works but it looks like a "garbage dump".`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-clean-code\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Optimize this file: remove dead code and rename variables for clarity."`);
        break;
      case '7':
        console.log(`${Y}${BOLD}7. Scan for Vulnerabilities${NC} (${C}cm-security-gate${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} Worried about leaking API keys or XSS hacks.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-security-gate\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Check if there are any security vulnerabilities before I push to GitHub."`);
        break;
      case '8':
        console.log(`${Y}${BOLD}8. Write Docs & Generate APIs${NC} (${C}cm-dockit${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} Lazy to write documentation for teammates or clients.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-dockit\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Automatically generate a README guide for this entire project."`);
        break;
      case '9':
        console.log(`${Y}${BOLD}9. Release WOW Landing Page${NC} (${C}cm-cro-methodology${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} Visitors come to your site but don't buy or sign up.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm @/cm-cro-methodology\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Analyze this website and show me how to double my sign-up rate."`);
        break;
      case '10':
        console.log(`${Y}${BOLD}10. Open Progress Dashboard${NC} (${C}cm dashboard${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} Want to know how much work is actually completed.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm dashboard\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Show the dashboard so I can see the progress of current tasks."`);
        break;
      case '11':
        console.log(`${Y}${BOLD}11. See an Interactive Demo${NC} (${C}/cm:demo${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} Want to see CodyMaster perform its magic automatically.`);
        console.log(`${BOLD}🚀 Command:${NC} \`/cm:demo\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "Start demo: build a TodoList app from scratch in 1 minute."`);
        break;
      case '12':
        console.log(`${Y}${BOLD}12. Help & Command List${NC} (${C}cm help${NC})`);
        console.log(`${BOLD}🎯 Situation:${NC} Forgot a command or looking for more cool skills.`);
        console.log(`${BOLD}🚀 Command:${NC} \`cm help\``);
        console.log(`${BOLD}💡 Try this prompt:${NC} "List all skills related to Growth Hacking and Marketing."`);
        break;
    }
  }

  console.log('');
  console.log(`${W}${BOLD}${isVi ? 'Nhấn ENTER để quay lại...' : 'Press ENTER to go back...'}${NC}`);
};

const printMenu = () => {
  console.clear();
  console.log(`     ${G}\\${NC} ${O}( \\_/ )${NC} ${G}/${NC}`);
  console.log(`    ${G}\\${NC} ${O}(${NC} ${G}^ u ^${NC} ${O})${NC} ${G}/${NC}`);
  console.log(`   ${G}--${NC} ${O}(  ___  )${NC} ${G}--${NC}    ${G}${BOLD}${isVi ? '✅ Hoàn tất!' : '✅ Done!'}${NC}`);
  console.log(`    ${O}| [     ] |${NC}`);
  console.log(`     ${O}'--w-w--'${NC}`);
  console.log('');
  
  if (isVi) {
    console.log(`    ${W}${BOLD}🎉 Thành công! Bạn đã mở khóa 65 kỹ năng AI toàn năng:${NC}`);
  } else {
    console.log(`    ${W}${BOLD}🎉 Success! You just unlocked 65 omnipotent AI skills:${NC}`);
  }
  
  console.log('');
  console.log(getSentiment('finish'));
  console.log('');
  
  if (isVi) {
    console.log(`  ${C}🎯 Orchestration${NC} : Lên kế hoạch & Điều phối Agent`);
    console.log(`  ${C}🎨 Product${NC}       : Thiết kế UX/UI & Tâm lý hành vi`);
    console.log(`  ${C}🔧 Engineering${NC}   : Code Full-stack & Tái cấu trúc`);
    console.log(`  ${C}🔒 Security${NC}      : Bảo mật tự động & Chống rò rỉ`);
    console.log(`  ${C}⚙️ Operations${NC}    : Triển khai an toàn & Quản lý CI/CD`);
    console.log(`  ${C}📈 Growth${NC}        : Tối ưu chuyển đổi (CRO) & Tracking`);
    console.log('');
    console.log(`    ${W}${BOLD}💡 Nhập số (1-12) để xem hướng dẫn & ví dụ:${NC}`);
    console.log('');
    console.log(`   1. ${Y}Cách CodyMaster vận hành    ${NC} → cm-how-it-work`);
    console.log(`   2. ${Y}Vibe coding (Zero code)     ${NC} → cm-start`);
    console.log(`   3. ${Y}Tham gia dự án có sẵn       ${NC} → cm-brainstorm-idea`);
    console.log(`   4. ${Y}Code giao diện từ URL/Ảnh   ${NC} → cm-ux-master`);
    console.log(`   5. ${Y}Lập trình TDD & Pair code   ${NC} → cm-tdd`);
    console.log(`   6. ${Y}Dọn dẹp & Tái cấu trúc      ${NC} → cm-clean-code`);
    console.log(`   7. ${Y}Quét & Sửa lỗi bảo mật      ${NC} → cm-security-gate`);
    console.log(`   8. ${Y}Viết tài liệu Docs & API    ${NC} → cm-dockit`);
    console.log(`   9. ${Y}Tạo Landing Page "WOW"      ${NC} → cm-cro-methodology`);
    console.log(`  10. ${Y}Bảng theo dõi tiến độ       ${NC} → cm dashboard`);
    console.log(`  11. ${Y}Xem Demo tự động            ${NC} → /cm:demo`);
    console.log(`  12. ${Y}Trợ giúp & Cú pháp lệnh      ${NC} → cm help`);
  } else {
    console.log(`  ${C}🎯 Orchestration${NC} : Task Planning & Agent Synergy`);
    console.log(`  ${C}🎨 Product${NC}       : UX/UI Mastery & User Psychology`);
    console.log(`  ${C}🔧 Engineering${NC}   : Full-stack TDD & Refactoring`);
    console.log(`  ${C}🔒 Security${NC}      : Automated Gates & Secret Shields`);
    console.log(`  ${C}⚙️ Operations${NC}    : Safe Deployments & CI/CD Excellence`);
    console.log(`  ${C}📈 Growth${NC}        : Conversion Tracking & Hacks`);
    console.log('');
    console.log(`    ${W}${BOLD}💡 Type a number (1-12) for guide & examples:${NC}`);
    console.log('');
    console.log(`   1. ${Y}The ultimate guide          ${NC} → cm-how-it-work`);
    console.log(`   2. ${Y}Vibe coding (Zero code)     ${NC} → cm-start`);
    console.log(`   3. ${Y}Code an existing project    ${NC} → cm-brainstorm-idea`);
    console.log(`   4. ${Y}Generate UX/UI designs      ${NC} → cm-ux-master`);
    console.log(`   5. ${Y}Code TDD & Pair coding      ${NC} → cm-tdd`);
    console.log(`   6. ${Y}Clean & Refactor codebase   ${NC} → cm-clean-code`);
    console.log(`   7. ${Y}Scan for vulnerabilities    ${NC} → cm-security-gate`);
    console.log(`   8. ${Y}Write docs & generate APIs  ${NC} → cm-dockit`);
    console.log(`   9. ${Y}Release WOW landing page    ${NC} → cm-cro-methodology`);
    console.log(`  10. ${Y}Open progress dashboard     ${NC} → cm dashboard`);
    console.log(`  11. ${Y}See an interactive demo     ${NC} → /cm:demo`);
    console.log(`  12. ${Y}Help & Command list         ${NC} → cm help`);
  }
  
  console.log('');
  console.log(`    ${W}${BOLD}${isVi ? '📚 Tài liệu:' : '📚 Documentation:'}${NC} ${C}https://cody.todyle.com/docs${NC}`);
  console.log('');
  console.log(`    ${DIM}Press 'q' to exit.${NC}`);
};

const main = async () => {
  if (!process.stdout.isTTY) {
    printMenu();
    return;
  }

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise(resolve => rl.question(query, resolve));

  while (true) {
    printMenu();
    const answer = await question('    > ');
    if (answer.toLowerCase() === 'q') break;
    if (parseInt(answer) >= 1 && parseInt(answer) <= 12) {
      showSkillGuide(answer);
      await question('');
    } else if (answer === '') {
      break;
    }
  }
  rl.close();
};

main();
