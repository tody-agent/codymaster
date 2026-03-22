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

function findHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
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

  dirsToScan.forEach(dir => {
    const files = findHtmlFiles(dir);

    files.forEach(filePath => {
      let content = fs.readFileSync(filePath, 'utf8');

      if (content.includes('G-JCHYEW645C') || content.includes('gtag(')) {
        skippedCount++;
        return;
      }

      if (content.includes('</head>')) {
        content = content.replace('</head>', `${gaSnippet}\n</head>`);
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
      } else {
        console.warn(`[WARN] No </head> found in ${filePath}`);
      }
    });
  });

  console.log(`\nSuccess: Injected GA into ${updatedCount} HTML files. Skipped ${skippedCount} items.`);
} catch (error) {
  console.error('Error injecting GA script:', error);
  process.exit(1);
}
