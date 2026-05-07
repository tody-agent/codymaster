---
name: cm-test-gate
description: Complete guide to setting up a reliable test gate for any project — covers stack detection, 4 core test files, script wiring, secret hygiene, and Cloudflare Workers/Pages patterns. Use when starting a new project, adding CI to an existing one, or when "tests pass but production breaks." Companion to cm-safe-deploy and cm-project-bootstrap.
---

# cm-test-gate: Multi-Layer Test Gate Setup

## Overview

A deployment process without a test gate is just shipping code and praying. The `test:gate` script is your first line of defense before deployment. A test gate MUST verify four things: frontend component safety, backend API behavior, core business logic, and i18n synchronization.

**Core assumption:** The most dangerous errors are syntax flaws, variable shadowing, or import failures that tests often skip if they only check logic.

**Violating the letter of this process is violating the spirit of quality engineering.**

## The Protocol

When setting up a test gate for a project, follow these 5 phases in order.

### Phase 1: Stack Detection and Environment Setup

**Goal:** Identify the framework and install the correct testing dependencies.

1. **Detect Stack:**
   - Check `package.json` for framework (React, Vue, Svelte, static HTML) and build tool (Vite, Next.js).
   - Check for `wrangler.json(c)` (Cloudflare Workers/Pages).
   - Check for Tailwind, PostCSS, or specific UI libraries.

2. **Install Dependencies (Example: Vite/Vitest):**
   ```bash
   # Install vitest and related tools
   npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
   # (Adjust based on framework: e.g., @testing-library/svelte)
   ```

3. **Configure File:**
   - Create `vitest.config.ts` (or `.js`):
     ```typescript
     import { defineConfig } from 'vitest/config'
     // Import framework plugin (e.g., react(), svelte())
     
     export default defineConfig({
       test: {
         environment: 'jsdom',
         globals: true,
         setupFiles: ['./test/setup.ts'], // Optional
       },
     })
     ```

### Phase 2: The 4 Core Test Files

A complete `test:gate` must cover four distinct layers. Do not combine these files.

#### Layer 1: Frontend Safety (`frontend-safety.test.ts`)
This layer prevents white screens and catastrophic syntax errors in the browser. Emphasize parsing and template rendering over logical assertions.

*Use the exact implementation from `cm-quality-gate` regarding the 4 corruption checks.*

```typescript
import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

test('app.js does not contain catastrophic syntax corruption', () => {
    // 1. Read the raw file
    const content = fs.readFileSync(path.resolve(__dirname, '../public/static/app.js'), 'utf-8');
    
    // 2. Syntax Validation (Check for broken template literals)
    // ❌ Bug #1: Single-quote wrapping template string
    expect(content).not.toMatch(/=\s*'[^']*\$\{t\(/);
    
    // 3. Delimiter consistency
    // ❌ Bug #4: Mismatched delimiters
    expect(content).not.toMatch(/t\('[^']*\`/);
    expect(content).not.toMatch(/t\(\`[^']*'\)/);
    
    // 4. HTML structure integrity
    // ❌ Bug #2: Spaces inside tags or broken closers
    expect(content).not.toMatch(/<\s+[a-zA-Z]/); // e.g., "< div"
    expect(content).not.toMatch(/<\/\s+[a-zA-Z]/); // e.g., "</ div"
    expect(content).not.toMatch(/--\s+>/); // e.g., "text-- >"
});
```

#### Layer 2: API Routes (`api-routes.test.ts`)
This layer ensures backend endpoints respond correctly and handle JSON properly.

*Example for a generic fetch wrapper or specific Next.js/Worker handler:*

```typescript
import { test, expect } from 'vitest';

test('API mock test', async () => {
    // Test your server handlers directly
    // Ensure 200 OK for valid inputs and 400 for errors
    expect(true).toBe(true);
});
```

#### Layer 3: Business Logic (`business-logic.test.ts`)
This layer tests pure functions: calculations, validations, and data transformations.

```typescript
import { test, expect } from 'vitest';

test('Calculates score correctly', () => {
    // const result = calculateScore(input);
    // expect(result).toBe(expected);
    expect(true).toBe(true);
});
```

#### Layer 4: i18n Synchronization (`i18n-sync.test.ts`)
This layer guarantees that language files are complete and identical in structure.

```typescript
import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

test('i18n files have identical key counts', () => {
    const langDir = path.resolve(__dirname, '../public/static/i18n');
    const langs = ['vi.json', 'en.json', 'th.json', 'ph.json'];
    
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
    for (const file of langs) {
        if (!fs.existsSync(path.join(langDir, file))) continue;
        
        const data = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf-8'));
        const count = countKeys(data);
        
        if (baseCount === -1) {
            baseCount = count;
        } else {
            expect(count, `File ${file} has a different key count`).toBe(baseCount);
        }
    }
});
```

#### Layer 5: Security Scan (`security-scan.test.ts`)
This layer prevents secrets from being committed to the repository. Powered by `cm-secret-shield` patterns.

```typescript
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
    expect(gitignore).toContain('.dev.vars');
});

test('no hardcoded secrets in source files', () => {
    const dangerousPatterns = [
        /SERVICE_KEY\s*[=:]\s*['"][a-zA-Z0-9/+=]{20,}/g,
        /PRIVATE_KEY\s*[=:]\s*['"][a-zA-Z0-9/+=]{20,}/g,
        /-----BEGIN.*PRIVATE KEY-----/g,
    ];
    const srcDir = 'src';
    if (!fs.existsSync(srcDir)) return;
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
    for (const file of files) {
        const content = fs.readFileSync(`${srcDir}/${file}`, 'utf-8');
        for (const pattern of dangerousPatterns) {
            expect(content, `${file} contains potential secret`).not.toMatch(pattern);
        }
    }
});
```

### Phase 3: Script Wiring

Wire these tests into `package.json` to make them easily executable by CI or other skills.

```json
{
  "scripts": {
    "test": "vitest",
    "test:gate": "vitest run --reporter=verbose",
    "test:security": "snyk test && aikido-api-client scan-release $npm_package_name $(git rev-parse HEAD) --minimum-severity-level=HIGH",
    "test:watch": "vitest watch"
  }
}
```

> **Security Gate Check:** The `test:security` script runs the Snyk dependency check and the Aikido release scan in parallel. See `cm-security-gate` for advanced SAST/IaC flags.

### Phase 4: Secret Hygiene and Ignore Configuration

**NEVER commit `.env` or `.dev.vars`.** Ensure tests do not expose actual production secrets.

1.  **Check `.gitignore`:**
    ```bash
    grep -E "node_modules|\.env|\.dev\.vars" .gitignore
    # Must exist, if not, add them.
    ```
2.  **Define Mock Env:**
    Create a `.env.test` file (this CAN be committed) with safe, mock values if needed by the test environment.

### Phase 5: Verification

Run the test gate to prove it works before declaring the task complete.

```bash
npm run test:gate
```

## Integration with Other Skills

| Skill | Relationship |
|---|---|
| `cm-safe-deploy` | `test:gate` is Gate 2 in the safe deploy pipeline. |
| `cm-project-bootstrap` | Should invoke `cm-test-gate` during Phase 7 (Infrastructure Setup). |
| `cm-safe-i18n` | Relies on the i18n tests set up in Phase 2, Layer 4. |
| `cm-secret-shield` | Layer 5 security scan uses Secret Shield patterns. |

## Red Flags - STOP and Fix

- Setting up tests but not creating the `test:gate` run script.
- Combining all tests into one massive `app.test.js` file.
- Skipping the `frontend-safety.test.ts` layer for SPA/monolith projects.
- Using real production database credentials in the test setup.
- Ignoring test failures and proceeding anyway.
