import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

test('i18n files have identical key counts', () => {
    const langDir = path.resolve(__dirname, '../public/i18n');
    const langs = ['en.json', 'vi.json', 'zh.json', 'ru.json', 'ko.json', 'hi.json'];
    
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

    let baseCount = -1;
    let baseFile = '';

    for (const file of langs) {
        if (!fs.existsSync(path.join(langDir, file))) continue;
        
        const data = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf-8'));
        const count = countKeys(data);
        
        if (baseCount === -1) {
            baseCount = count;
            baseFile = file;
        } else {
            expect(count, `File ${file} has a different key count than ${baseFile}`).toBe(baseCount);
        }
    }
});
