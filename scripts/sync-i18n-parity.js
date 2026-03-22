const fs = require('fs');
const path = require('path');

const I18N_DIR = path.resolve(__dirname, '../public/i18n');
const EN_DIR = path.join(I18N_DIR, 'en');
const TARGET_LANGS = ['vi', 'zh', 'ru', 'ko', 'hi'];

function syncNamespaces() {
    if (!fs.existsSync(EN_DIR)) return;
    
    const namespaces = fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'));
    
    for (const nsFile of namespaces) {
        const enData = JSON.parse(fs.readFileSync(path.join(EN_DIR, nsFile), 'utf8'));
        const enKeys = Object.keys(enData);
        
        for (const lang of TARGET_LANGS) {
            const langDir = path.join(I18N_DIR, lang);
            if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });
            
            const targetFile = path.join(langDir, nsFile);
            let targetData = {};
            if (fs.existsSync(targetFile)) {
                targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
            }
            
            let missingCount = 0;
            // Ensure all English keys exist in target
            for (const key of enKeys) {
                if (targetData[key] === undefined) {
                    // For automated mass extraction, we copy the English string to prevent breaking 
                    // until human/agent translation happens.
                    targetData[key] = enData[key];
                    // Optional: Prefix to make it obvious they need translation:
                    // targetData[key] = `[${lang.toUpperCase()}] ${enData[key]}`;
                    missingCount++;
                }
            }
            
            if (missingCount > 0 || Object.keys(targetData).length !== enKeys.length) {
                // Sort keys symmetrically
                const sorted = {};
                for (const k of enKeys) {
                    sorted[k] = targetData[k];
                }
                
                fs.writeFileSync(targetFile, JSON.stringify(sorted, null, 2), 'utf8');
                console.log(`✅ Synced ${missingCount} missing keys to ${lang}/${nsFile}`);
            }
        }
    }
}

console.log("🚀 Starting parity sync...");
syncNamespaces();
console.log("✨ Parity sync finished. All language namespaces match English key counts seamlessly.");
