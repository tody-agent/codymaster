const fs = require('fs');
const path = require('path');

const I18N_DIR = path.resolve(process.cwd(), 'public/i18n');
const BACKUP_DIR = path.resolve(I18N_DIR, '.bak');

const NAMESPACES = {
    common: ['meta', 'nav', 'cta', 'footer', 'socialProof', 'stats', 'claw'],
    home: ['hero', 'features', 'usp', 'howItWorks', 'install'],
    personas: ['personas'],
    skills: ['skills', 'skillsPage'],
    pages: ['startPage', 'demoPage', 'docsPage', 'storyPage', 'brainPage', 'useCases', 'bornFromPain', 'beforeAfter'],
    vs: ['vsScrum'] // Can expand if 'vsOthers' keys exist
};

function splitFile(lang) {
    const filePath = path.join(I18N_DIR, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
        console.warn(`[WARN] File not found: ${filePath}`);
        return;
    }
    
    console.log(`\n📦 Processing [${lang}]...`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const destDir = path.join(I18N_DIR, lang);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    const assignedKeys = new Set();
    
    // Split into namespaces
    for (const [ns, keys] of Object.entries(NAMESPACES)) {
        const nsData = {};
        for (const key of keys) {
            if (data[key] !== undefined) {
                nsData[key] = data[key];
                assignedKeys.add(key);
            }
        }
        
        const nsFilePath = path.join(destDir, `${ns}.json`);
        fs.writeFileSync(nsFilePath, JSON.stringify(nsData, null, 2), 'utf8');
        console.log(`  ✓ Created ${lang}/${ns}.json (${Object.keys(nsData).length} keys)`);
    }
    
    // Find unassigned keys
    const allKeys = Object.keys(data);
    const unassigned = allKeys.filter(k => !assignedKeys.has(k));
    if (unassigned.length > 0) {
        console.warn(`  ⚠️  Unassigned keys in ${lang}.json:`, unassigned);
        
        // Put unassigned keys into common by default, or create an "other.json"
        const otherData = {};
        for (const key of unassigned) {
            otherData[key] = data[key];
        }
        // Let's merge them into common.json to avoid losing data
        const commonFile = path.join(destDir, 'common.json');
        const commonData = JSON.parse(fs.readFileSync(commonFile, 'utf8'));
        Object.assign(commonData, otherData);
        fs.writeFileSync(commonFile, JSON.stringify(commonData, null, 2), 'utf8');
        console.log(`  -> Merged ${unassigned.length} unassigned keys into ${lang}/common.json`);
    }
    
    // Backup original
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    fs.renameSync(filePath, path.join(BACKUP_DIR, `${lang}.json`));
    console.log(`  Moved ${lang}.json to .bak/`);
}

function main() {
    console.log("🚀 Starting i18n namespace split...");
    const langs = ['en', 'vi', 'zh', 'ru', 'ko', 'hi'];
    for (const lang of langs) {
        splitFile(lang);
    }
    console.log("\n✅ Split complete!");
}

main();
