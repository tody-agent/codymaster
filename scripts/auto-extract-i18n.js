const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const I18N_EN_DIR = path.resolve(__dirname, '../public/i18n/en');

// Ignore elements that shouldn't be translated
const IGNORE_TAGS = ['SCRIPT', 'STYLE', 'SVG', 'PATH', 'NOSCRIPT', 'CODE', 'PRE'];
// Keys to ignore matching exactly
const IGNORE_TEXT = ["CodyMaster", "🇬🇧", "English", "🇻🇳", "Tiếng Việt", "🇨🇳", "🇷🇺", "Русский", "🇰🇷", "한국어", "🇮🇳"];

const NAMESPACE_MAPPING = {
    'cli.html': 'pages',
    'faq.html': 'home',
    'playbook.html': 'pages',
    'vs-bolt.html': 'vs',
    'vs-google-ai-studio.html': 'vs',
    'vs-lovable.html': 'vs',
    'vs-others.html': 'vs',
    'vs-replit.html': 'vs',
    'vs-scrum.html': 'vs',
    'why-cody-master.html': 'home',
    'index.html': 'home',
    'brain.html': 'pages',
    'demo.html': 'pages',
    'for-claw-family.html': 'personas',
    'for-cmos.html': 'personas',
    'for-designers.html': 'personas',
    'for-founders.html': 'personas',
    'for-pms.html': 'personas',
    'for-tech-teams.html': 'personas',
    'persona.html': 'personas',
    'skills.html': 'skills',
    'start.html': 'pages',
    'story.html': 'pages',
};

// Map memory
const namespaces = {
    common: {},
    home: {},
    personas: {},
    skills: {},
    pages: {},
    vs: {}
};

// Load existing namespaces
for (const ns of Object.keys(namespaces)) {
    const file = path.join(I18N_EN_DIR, `${ns}.json`);
    if (fs.existsSync(file)) {
        namespaces[ns] = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
}

function generateKeyPath(pageName, text, index) {
    const baseKey = pageName.replace('.html', '').replace(/[^a-zA-Z0-9]/g, '_');
    return `${baseKey}_auto_${index}`;
}

function extractFile(filePath, fileName) {
    const nsKey = NAMESPACE_MAPPING[fileName] || 'pages'; // default to pages
    
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const document = dom.window.document;
    
    const walker = document.createTreeWalker(document.body, dom.window.NodeFilter.SHOW_TEXT);
    
    let counter = 1;
    let modified = false;
    let node;
    
    while(node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (!text) continue;
        if (node.parentElement && IGNORE_TAGS.includes(node.parentElement.tagName)) continue;
        if (IGNORE_TEXT.includes(text)) continue;
        if (text.length <= 1) continue;
        
        // Ignore math/numbers/formulas
        if (/^[0-9\s\.,\-\+\/]+$/.test(text)) continue;
        
        let hasI18n = false;
        let currentElement = node.parentElement;
        
        // Check for existing i18n
        let depth = 0;
        while (currentElement && depth < 2) {
            if (currentElement.hasAttribute('data-i18n')) {
                hasI18n = true;
                break;
            }
            currentElement = currentElement.parentElement;
            depth++;
        }
        
        if (!hasI18n) {
            const key = generateKeyPath(fileName, text, counter);
            const fullDotPath = `${nsKey}.${key}`;
            
            // Text nodes themselves don't support attributes.
            // If the parent only contains this text node, we attach to the parent.
            // If the parent contains multiple generic text nodes, we wrap the text node in a <span>.
            if (node.parentElement.childNodes.length === 1) {
                node.parentElement.setAttribute('data-i18n', fullDotPath);
            } else {
                const span = document.createElement('span');
                span.setAttribute('data-i18n', fullDotPath);
                span.textContent = text;
                node.parentNode.replaceChild(span, node);
            }
            
            namespaces[nsKey][key] = text;
            counter++;
            modified = true;
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, dom.serialize(), 'utf8');
        console.log(`✅ ${fileName}: Extracted ${counter - 1} strings to '${nsKey}' namespace.`);
    }
}

function main() {
    const files = Object.keys(NAMESPACE_MAPPING);
    
    for (const file of files) {
        extractFile(path.join(PUBLIC_DIR, file), file);
    }
    
    // Save namespaces
    for (const [ns, data] of Object.entries(namespaces)) {
        const file = path.join(I18N_EN_DIR, `${ns}.json`);
        // Sort keys aesthetically
        const sorted = Object.keys(data).sort().reduce((acc, key) => {
            acc[key] = data[key];
            return acc;
        }, {});
        fs.writeFileSync(file, JSON.stringify(sorted, null, 2), 'utf8');
        console.log(`💾 Saved en/${ns}.json (${Object.keys(sorted).length} keys)`);
    }
}

main();
