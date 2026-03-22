const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Recursively find all HTML files
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = findHtmlFiles(publicDir);

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Add playbook to header (before skills)
  const skillsRe = /(<li><a href="skills\.html" class="nav__link" data-i18n="nav\.skills">Skills<\/a><\/li>)/g;
  if (content.match(skillsRe) && !content.includes('playbook.html" class="nav__link"')) {
    content = content.replace(skillsRe, '<li><a href="playbook.html" class="nav__link" data-i18n="nav.playbook">Playbook</a></li>\n      $1');
    changed = true;
  }

  // 2. Replace demo with CLI in header
  const demoHeaderRe = /<a href="demo\.html" class="nav-dropdown__item"><span class="lang-flag">▶️<\/span> <span data-i18n="nav\.demo">Demo<\/span><\/a>/g;
  if (content.match(demoHeaderRe)) {
    content = content.replace(demoHeaderRe, '<a href="cli.html" class="nav-dropdown__item"><span class="lang-flag">⌨️</span> <span data-i18n="nav.cli">CLI</span></a>');
    changed = true;
  }

  // 3. Replace demo with CLI in footer
  const demoFooterRe = /<a href="demo\.html" data-i18n="nav\.demo">Demo<\/a>/g;
  if (content.match(demoFooterRe)) {
    content = content.replace(demoFooterRe, '<a href="cli.html" data-i18n="nav.cli">CLI</a>');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', path.basename(file));
  }
}

console.log('Done updating navigation');
