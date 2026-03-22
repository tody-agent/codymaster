const fs = require('fs');
const path = require('path');

const publicDir = '/Users/todyle/Builder/Cody_Master/public';
const componentsDir = path.join(publicDir, 'components');
const filesToProcess = [];

fs.readdirSync(publicDir).forEach(file => {
  if (file.endsWith('.html')) {
    filesToProcess.push(path.join(publicDir, file));
  }
});

if (fs.existsSync(componentsDir)) {
  fs.readdirSync(componentsDir).forEach(file => {
    if (file.endsWith('.html')) {
      filesToProcess.push(path.join(componentsDir, file));
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const langStartIndex = content.indexOf('<div class="lang-switcher" id="lang-switcher">');
  if (langStartIndex === -1) {
    console.log('No lang-switcher in ' + path.basename(filePath));
    return;
  }
  
  // Find the exact <li> boundary to remove the switcher safely from nav links
  const liStartIndex = content.lastIndexOf('<li', langStartIndex);
  const liEndIndex = content.indexOf('</li>', langStartIndex) + 5;
  
  if (liStartIndex === -1 || liEndIndex < 5) return;
  
  const originalLiBlock = content.substring(liStartIndex, liEndIndex);
  
  let innerSwitcher = originalLiBlock.replace(/<li[^>]*>/, '').replace(/<\/li>$/, '').trim();
  
  // Find hamburger
  const hamburgerStartIndex = content.indexOf('<div class="nav__hamburger"');
  if (hamburgerStartIndex === -1) {
    console.log('No hamburger in ' + path.basename(filePath));
    return;
  }
  
  const hamburgerEndIndex = content.indexOf('</div>', hamburgerStartIndex) + 6;
  const originalHamburgerBlock = content.substring(hamburgerStartIndex, hamburgerEndIndex);
  
  // Wrap them together inside .nav__controls
  const newControlsBlock = `<div class="nav__controls">\n        ${innerSwitcher}\n        ${originalHamburgerBlock}\n      </div>`;
  
  // Remove the lang-switcher from the old position
  content = content.replace(originalLiBlock, '');
  // Insert the new controls wrapper where hamburger was
  content = content.replace(originalHamburgerBlock, newControlsBlock);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Refactored: ' + path.basename(filePath));
}

filesToProcess.forEach(processFile);
console.log('Done refactoring HTML pages.');
