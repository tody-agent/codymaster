#!/usr/bin/env node
/**
 * CodyMaster postinstall — minimal, friendly, no surprise actions.
 * The actual platform install runs through `cm` (the onboarding wizard) so
 * users always opt in interactively.
 */

const fs = require('fs');
const path = require('path');

const C = '\x1b[36m';
const G = '\x1b[32m';
const O = '\x1b[33m';
const W = '\x1b[1;37m';
const DIM = '\x1b[2m';
const NC = '\x1b[0m';

let skillCount = 60;
try {
  const skillsDir = path.join(__dirname, '..', 'skills');
  if (fs.existsSync(skillsDir)) {
    skillCount = fs
      .readdirSync(skillsDir)
      .filter((f) => {
        const full = path.join(skillsDir, f);
        return (
          f.startsWith('cm-') &&
          fs.statSync(full).isDirectory() &&
          fs.existsSync(path.join(full, 'SKILL.md'))
        );
      }).length;
  }
} catch {}

const sentiments = [
  `🐹: ${skillCount} skills stuffed in my cheeks. Ready when you are! ✨`,
  `🐹: Whiskers twitching — type ${W}cm${NC}${C} to start the wizard.`,
  '🐹: Power-nap over. Let\'s build! 🐭',
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const isGlobal =
  process.env.npm_config_global === 'true' ||
  /[/\\]npm[/\\]node_modules[/\\]codymaster$/i.test(path.resolve(__dirname, '..').replace(/\\/g, '/'));

console.log('');
console.log(`     ${G}\\${NC} ${O}( \\_/ )${NC} ${G}/${NC}`);
console.log(`    ${G}\\${NC} ${O}(${NC} ${G}^ u ^${NC} ${O})${NC} ${G}/${NC}`);
console.log(`   ${G}--${NC} ${O}(  ___  )${NC} ${G}--${NC}    ${G}${W}CodyMaster ready${NC}`);
console.log(`    ${O}| [     ] |${NC}`);
console.log(`     ${O}'--w-w--'${NC}`);
console.log('');
console.log(`    ${C}${pick(sentiments)}${NC}`);
console.log('');

if (isGlobal) {
  console.log(`    Next: run  ${W}cm${NC}  to start the onboarding wizard.`);
  console.log(`    ${DIM}It will detect your AI coding tools and install skills where you choose.${NC}`);
} else {
  console.log(`    Next: run  ${W}npx cm${NC}  inside this project to start the wizard.`);
  console.log(`    ${DIM}For a global \`cm\` command:  ${W}npm install -g codymaster${NC}${DIM}.${NC}`);
}
console.log('');
console.log(`    ${DIM}Docs: https://cody.todyle.com/docs${NC}`);
console.log('');
