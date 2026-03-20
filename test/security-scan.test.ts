import { test, expect } from 'vitest';
import fs from 'fs';
import { execSync } from 'child_process';

test('no secret files tracked by git', () => {
    const tracked = execSync('git ls-files', { encoding: 'utf-8' });
    const badFiles = ['.env', '.dev.vars', '.env.local', '.env.production'];
    const found = badFiles.filter(f => tracked.split('\n').includes(f));
    expect(found, `Secret files tracked: ${found.join(', ')}`).toEqual([]);
});

test('.gitignore contains required security patterns', () => {
    const gitignore = fs.readFileSync('.gitignore', 'utf-8');
    expect(gitignore).toContain('.env');
});

test('no hardcoded secrets in source files', () => {
    const dangerousPatterns = [
        /SERVICE_KEY\s*[=:]\s*['"][a-zA-Z0-9/+=]{20,}/g,
        /PRIVATE_KEY\s*[=:]\s*['"][a-zA-Z0-9/+=]{20,}/g,
        /-----BEGIN.*PRIVATE KEY-----/g,
    ];
    const srcDirs = ['public/js', 'src'];
    for (const srcDir of srcDirs) {
        if (!fs.existsSync(srcDir)) continue;
        const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        for (const file of files) {
            const content = fs.readFileSync(`${srcDir}/${file}`, 'utf-8');
            for (const pattern of dangerousPatterns) {
                expect(content, `${file} contains potential secret`).not.toMatch(pattern);
            }
        }
    }
});
