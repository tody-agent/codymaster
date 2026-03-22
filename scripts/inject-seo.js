const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const baseUrl = 'https://cody-master-a5q.pages.dev';

const getSeoBlock = (file, title, description) => {
  const canonicalPath = file === 'index.html' ? '' : file;
  const canonicalUrl = `${baseUrl}/${canonicalPath}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": title || "CodyMaster Kit",
    "operatingSystem": "Any",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": description || "Universal AI Agent Skills Platform — Turn ideas into production-ready code 10x faster."
  };

  return `
  <!-- INJECTED_SEO_START -->
  <link rel="canonical" href="${canonicalUrl}" />
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
  <!-- INJECTED_SEO_END -->
</head>`;
};

try {
  const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));
  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Extract title and description for schema if possible
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const descMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    
    const title = titleMatch ? titleMatch[1].trim() : "CodyMaster Kit";
    const description = descMatch ? descMatch[1].trim() : "";

    // Remove old injected SEO block if exists
    const oldSeoRegex = /<!-- INJECTED_SEO_START -->[\s\S]*?<!-- INJECTED_SEO_END -->\s*/g;
    content = content.replace(oldSeoRegex, '');

    // Inject before </head>
    const headEndRegex = /<\/head>/i;
    if (headEndRegex.test(content)) {
      content = content.replace(headEndRegex, getSeoBlock(file, title, description));
      fs.writeFileSync(filePath, content);
      updatedCount++;
      console.log(`[OK] Injected SEO into ${file}`);
    } else {
      console.warn(`[WARN] Could not find </head> tag in ${file}`);
    }
  });

  console.log(`\nSuccess: Updated ${updatedCount} HTML files with SEO JSON-LD and canonical tags.`);
} catch (error) {
  console.error('Error injecting SEO:', error);
  process.exit(1);
}
