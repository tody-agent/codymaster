const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const docsDir = path.join(__dirname, '../docs');
const dirsToScan = [publicDir, docsDir];

const gaSnippet = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JCHYEW645C"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-JCHYEW645C');
</script>
`;

const gaEventsScript = `<script src="js/ga-events.js"></script>`;


function findHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

try {
  let updatedCount = 0;
  let skippedCount = 0;
  let eventsInjected = 0;

  dirsToScan.forEach(dir => {
    const files = findHtmlFiles(dir);

    files.forEach(filePath => {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Inject GA config if not present
      if (!content.includes('G-JCHYEW645C') && !content.includes('gtag(')) {
        if (content.includes('</head>')) {
          content = content.replace('</head>', `${gaSnippet}\n</head>`);
          modified = true;
          updatedCount++;
        } else {
          console.warn(`[WARN] No </head> found in ${filePath}`);
        }
      } else {
        skippedCount++;
      }

      // Inject ga-events.js if not present (for public dir pages only, not docs)
      if (filePath.startsWith(publicDir) && !content.includes('ga-events.js')) {
        if (content.includes('</body>')) {
          content = content.replace('</body>', `${gaEventsScript}\n</body>`);
          modified = true;
          eventsInjected++;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    });
  });

  console.log(`\nSuccess: Injected GA into ${updatedCount} HTML files. Skipped ${skippedCount} (already had GA). Injected ga-events.js into ${eventsInjected} pages.`);

} catch (error) {
  console.error('Error injecting GA script:', error);
  process.exit(1);
}
