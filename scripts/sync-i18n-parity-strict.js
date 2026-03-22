const fs = require('fs');
const path = require('path');

const I18N_DIR = path.resolve(process.cwd(), 'public/i18n');
const langs = ['vi', 'zh', 'ru', 'ko', 'hi'];
const namespaces = ['common', 'home', 'personas', 'skills', 'pages', 'vs'];

// Deep clone structure of `src`, filling leaf values from `valuesSource`.
// If `valuesSource` doesn't have the leaf value, fallback to `src`.
function deepCloneValues(src, valuesSource) {
    if (Array.isArray(src)) {
        return src.map((item, index) => {
            const valMatch = (Array.isArray(valuesSource) || (typeof valuesSource === 'object' && valuesSource !== null)) ? valuesSource[index] : undefined;
            if (typeof item === 'object' && item !== null) {
                return deepCloneValues(item, valMatch);
            } else {
                return valMatch !== undefined ? valMatch : item;
            }
        });
    } else if (typeof src === 'object' && src !== null) {
        const obj = {};
        for (const key in src) {
            const valMatch = (typeof valuesSource === 'object' && valuesSource !== null) ? valuesSource[key] : undefined;
            if (typeof src[key] === 'object' && src[key] !== null) {
                obj[key] = deepCloneValues(src[key], valMatch);
            } else {
                obj[key] = valMatch !== undefined ? valMatch : src[key];
            }
        }
        return obj;
    } else {
        return (valuesSource !== undefined) ? valuesSource : src;
    }
}

function syncNamespace(ns) {
    console.log(`\n📂 Syncing namespace: [${ns}]`);
    
    const enPath = path.join(I18N_DIR, 'en', `${ns}.json`);
    if (!fs.existsSync(enPath)) {
        console.error(`❌ English master file not found: ${enPath}`);
        return;
    }
    
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    
    langs.forEach(lang => {
        const langPath = path.join(I18N_DIR, lang, `${ns}.json`);
        if (!fs.existsSync(langPath)) return;
        
        const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
        
        const cleanedData = deepCloneValues(enData, langData);

        fs.writeFileSync(langPath, JSON.stringify(cleanedData, null, 2), 'utf8');
        console.log(`  ✅ [${lang}/${ns}] Cleaned and saved with exact English parity.`);
    });
}

namespaces.forEach(syncNamespace);
console.log('\n✨ All namespaces perfectly synced with English master.');
