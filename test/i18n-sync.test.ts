import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

test('i18n namespaces have identical key counts', () => {
    const langDir = path.resolve(__dirname, '../public/i18n');
    const langs = ['en', 'vi', 'zh', 'ru', 'ko', 'hi'];
    const namespaces = ['common', 'home', 'personas', 'skills', 'pages', 'vs'];
    
    const countKeys = (obj: any): number => {
        let count = 0;
        for (const k in obj) {
            if (typeof obj[k] === 'object' && obj[k] !== null) {
                count += countKeys(obj[k]);
            } else {
                count++;
            }
        }
        return count;
    };

    // Calculate baseline counts (English)
    const baseCounts: Record<string, number> = {};
    const enDir = path.join(langDir, 'en');
    
    if (fs.existsSync(enDir)) {
        for (const ns of namespaces) {
            const file = path.join(enDir, `${ns}.json`);
            if (fs.existsSync(file)) {
                const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
                baseCounts[ns] = countKeys(data);
            }
        }
    }

    // Verify other languages against English
    for (const lang of langs) {
        if (lang === 'en') continue;
        
        const dir = path.join(langDir, lang);
        if (!fs.existsSync(dir)) continue;

        for (const ns of namespaces) {
            const file = path.join(dir, `${ns}.json`);
            if (!fs.existsSync(file)) {
                expect.fail(`Missing namespace file: ${lang}/${ns}.json`);
            }
            
            const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
            const count = countKeys(data);
            
            expect(count, `Namespace [${ns}] in [${lang}] has a different key count (${count}) than [en] (${baseCounts[ns] || 0})`).toBe(baseCounts[ns] || 0);
        }
    }
});
