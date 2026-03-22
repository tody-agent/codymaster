const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom'); // Assuming jsdom is available, we can also use regex if it fails.

const PUBLIC_DIR = path.resolve(__dirname, '../public');

function scanFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const document = dom.window.document;
    const walker = document.createTreeWalker(document.body, dom.window.NodeFilter.SHOW_TEXT);
    
    let findings = [];
    let node;
    while(node = walker.nextNode()) {
        const text = node.textContent.trim();
        // Ignore empty, comments, or scripts
        if (!text) continue;
        if (node.parentElement && ['SCRIPT', 'STYLE', 'SVG', 'PATH', 'NOSCRIPT'].includes(node.parentElement.tagName)) continue;
        
        let hasI18n = false;
        let currentElement = node.parentElement;
        // Check up to 2 levels up for data-i18n (in case of embedded spans)
        let depth = 0;
        while (currentElement && depth < 2) {
            if (currentElement.hasAttribute('data-i18n')) {
                hasI18n = true;
                break;
            }
            currentElement = currentElement.parentElement;
            depth++;
        }
        
        // Also ignore simple numbers or very short symbols
        if (!hasI18n && text.length > 2 && !/^[0-9\s\.,\-\+\/]+$/.test(text)) {
            // Found a string that might need translation
            findings.push({ text: text, tag: node.parentElement.tagName });
        }
    }
    return findings;
}

function main() {
    let requiredModules = true;
    try { require('jsdom'); } catch(e) { requiredModules = false; }
    if (!requiredModules) {
        console.error("Please run: npm install jsdom --no-save");
        process.exit(1);
    }
    
    const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));
    
    console.log("=== HARDCODED STRING SCAN ===");
    for (const file of files) {
        const findings = scanFile(path.join(PUBLIC_DIR, file));
        if (findings && findings.length > 0) {
            console.log(`\n\n📄 ${file} (${findings.length} strings):`);
            // Print unique ones to avoid spam
            const unique = [...new Set(findings.map(f => f.text))];
            for (let i = 0; i < Math.min(unique.length, 10); i++) {
                const preview = unique[i].length > 50 ? unique[i].substring(0, 50) + "..." : unique[i];
                console.log(`  - "${preview}"`);
            }
            if (unique.length > 10) console.log(`  ... and ${unique.length - 10} more.`);
        }
    }
}

main();
