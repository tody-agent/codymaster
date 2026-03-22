const fs = require('fs');
const path = require('path');

const I18N_DIR = path.resolve(__dirname, '../public/i18n');
const EN_DIR = path.join(I18N_DIR, 'en');
const TARGET_LANGS = ['vi', 'zh', 'ru', 'ko', 'hi'];

function auditTranslations() {
    let totalIssues = 0;
    
    if (!fs.existsSync(EN_DIR)) {
        console.error("❌ English namespace not found!");
        return;
    }
    
    const namespaces = fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'));
    
    console.log("🔍 Starting Deep Translation Content Audit...\n");
    
    for (const lang of TARGET_LANGS) {
        let langIssues = 0;
        let totalStrings = 0;
        let translatedStrings = 0;
        const langDir = path.join(I18N_DIR, lang);
        
        console.log(`[${lang.toUpperCase()}] Auditing translations...`);
        
        if (!fs.existsSync(langDir)) {
            console.log(`  ❌ Missing language folder: ${lang}`);
            totalIssues++;
            continue;
        }
        
        for (const nsFile of namespaces) {
            const enData = JSON.parse(fs.readFileSync(path.join(EN_DIR, nsFile), 'utf8'));
            const targetFile = path.join(langDir, nsFile);
            
            if (!fs.existsSync(targetFile)) {
                console.log(`  ❌ Missing namespace file: ${lang}/${nsFile}`);
                langIssues++;
                continue;
            }
            
            const targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
            
            // Check keys equality
            for (const key of Object.keys(enData)) {
                totalStrings++;
                const enVal = enData[key];
                const tarVal = targetData[key];
                
                if (tarVal === undefined || tarVal === null || tarVal === "") {
                    console.log(`  ⚠️ Empty Value: ${nsFile} -> ${key}`);
                    langIssues++;
                } else if (tarVal === enVal) {
                    // Ignore numbers, whitespace, symbols, emojis or extremely short words
                    const isNonTranslatable = 
                        /^[0-9\s\.,\-\+\/\(\)\|\!\?\#\%\&\*\=\<\>]+$/.test(tarVal) || 
                        /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(tarVal) ||
                        tarVal.length <= 1 || 
                        tarVal.startsWith("cm-") ||
                        ["CodyMaster", "GitHub", "VND", "USD", "EN", "English", "Vibe Coding", "Gemini", "Claude", "Cursor", "Discord", "中 文", "中文", "हिन्दी", "Русский", "한국어", "Tiếng Việt", "= init()"].includes(tarVal);

                    if (isNonTranslatable) {
                        translatedStrings++;
                        continue;
                    }
                    console.log(`  ⚠️ Untranslated (Matches EN exactly): ${nsFile} -> ${key} => "${tarVal}"`);
                    langIssues++;
                } else {
                    translatedStrings++;
                }
            }
        }
        
        const completionRate = Math.round((translatedStrings / totalStrings) * 100) || 0;
        if (langIssues === 0) {
            console.log(`  ✅ 100% Translated! (${translatedStrings}/${totalStrings} strings)`);
        } else {
            console.log(`  ⚠️ Issue Count: ${langIssues}. Translation Completion: ${completionRate}% (${translatedStrings}/${totalStrings} strings)`);
        }
        console.log("-------------------------------------------------");
        totalIssues += langIssues;
    }
    
    console.log(`\n🏁 AUDIT COMPLETE: Found ${totalIssues} unresolved translation issues.`);
}

auditTranslations();
