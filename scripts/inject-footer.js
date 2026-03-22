const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const componentsDir = path.join(publicDir, 'components');
const footerPath = path.join(componentsDir, 'footer.html');

try {
  const footerHTML = fs.readFileSync(footerPath, 'utf8').trim();
  const files = fs.readdirSync(publicDir).filter(file => file.endsWith('.html'));

  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Match any <footer ...> to </footer> block
    const footerRegex = /<footer[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/footer>/i;
    
    if (footerRegex.test(content)) {
      content = content.replace(footerRegex, footerHTML);
      fs.writeFileSync(filePath, content);
      updatedCount++;
      console.log(`[OK] Injected footer into ${file}`);
    } else {
      console.warn(`[WARN] Could not find <footer> tag in ${file}`);
    }
  });

  console.log(`\nSuccess: Updated ${updatedCount} HTML files with the unified footer.`);
} catch (error) {
  console.error('Error injecting footer:', error);
  process.exit(1);
}
