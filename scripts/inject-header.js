const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const componentsDir = path.join(publicDir, 'components');
const headerPath = path.join(componentsDir, 'header.html');

try {
  const headerHTML = fs.readFileSync(headerPath, 'utf8').trim();
  const files = fs.readdirSync(publicDir).filter(file => file.endsWith('.html'));

  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Using regex to match from <nav ...> to </nav>
    const navRegex = /<nav[^>]*class="[^"]*nav[^"]*"[^>]*>[\s\S]*?<\/nav>/i;
    
    if (navRegex.test(content)) {
      content = content.replace(navRegex, headerHTML);
      fs.writeFileSync(filePath, content);
      updatedCount++;
      console.log(`[OK] Injected header into ${file}`);
    } else {
      console.warn(`[WARN] Could not find <nav> tag in ${file}`);
    }
  });

  console.log(`\nSuccess: Updated ${updatedCount} HTML files with the unified header.`);
} catch (error) {
  console.error('Error injecting header:', error);
  process.exit(1);
}
