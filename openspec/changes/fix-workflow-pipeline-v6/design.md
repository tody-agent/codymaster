# Design: Fix Workflow Pipeline v6 — Multi-Platform Sync

## Context & Technical Approach

### Problem
CodyMaster v6.0 migration broke the skill pipeline:
1. `build-skills.mjs` only syncs "top 35" skills, not ALL skills
2. `_shared/helpers.md` not synced to any platform
3. Missing skills: `cm-sprint-bus`, `cm-skill-evolution`, `cm-skill-health`, `cm-dockit`, `cm-guardian-runtime`, etc.
4. TDD not enforced before execution
5. Changelog manually maintained

### Architecture Decision
**Single Source of Truth:** `skills/` is the canonical directory. All platforms sync FROM `skills/`.

```
skills/                          ← SOURCE OF TRUTH
├── _shared/helpers.md           ← Shared helpers (MUST sync)
├── cm-start/SKILL.md
├── cm-brainstorm-idea/SKILL.md
├── cm-planning/SKILL.md
├── cm-execution/SKILL.md
├── cm-tdd/SKILL.md
├── cm-quality-gate/SKILL.md
├── cm-safe-deploy/SKILL.md
├── cm-sprint-bus/SKILL.md       ← MISSING from platforms
├── cm-skill-evolution/SKILL.md  ← MISSING from platforms
├── cm-dockit/SKILL.md           ← MISSING from platforms
└── ... (52 skills total)

Sync targets:
├── .opencode/skills/    ← OpenCode
├── .cursor-plugin/skills/ ← Cursor
├── .codex/skills/       ← Codex
├── .claude/skills/      ← Claude Code
└── ... (14 platforms total)
```

## Proposed Changes

### 1. Update `scripts/build-skills.mjs`

**Current behavior:** Only syncs "top 35" skills to cursor, codex, opencode.

**New behavior:** Sync ALL skills + `_shared/` to ALL 14 platforms.

```javascript
// Current
const PLATFORM_DIRS = {
  cursor: path.join(repoRoot, '.cursor-plugin', 'skills'),
  codex: path.join(repoRoot, '.codex', 'skills'),
  opencode: path.join(repoRoot, '.opencode', 'skills'),
};

// New - add all platforms
const PLATFORM_DIRS = {
  cursor: path.join(repoRoot, '.cursor-plugin', 'skills'),
  codex: path.join(repoRoot, '.codex', 'skills'),
  opencode: path.join(repoRoot, '.opencode', 'skills'),
  'claude-code': path.join(repoRoot, '.claude', 'skills'),
  'claude-desktop': path.join(repoRoot, '.claude-desktop', 'skills'),
  antigravity: path.join(repoRoot, '.gemini', 'skills'),
  windsurf: path.join(repoRoot, '.windsurf', 'skills'),
  cline: path.join(repoRoot, '.cline', 'skills'),
  kiro: path.join(repoRoot, '.kiro', 'skills'),
  copilot: path.join(repoRoot, '.copilot', 'skills'),
  aider: path.join(repoRoot, '.aider', 'skills'),
  continue: path.join(repoRoot, '.continue', 'skills'),
  'amazon-q': path.join(repoRoot, '.amazonq', 'skills'),
  amp: path.join(repoRoot, '.amp', 'skills'),
};

// Current: only sync top 35
const TOP_35 = loadProfile('full.txt');

// New: sync ALL skills + _shared/
function getAllSkills() {
  const skills = [];
  for (const entry of fs.readdirSync(skillsRoot)) {
    const skillDir = path.join(skillsRoot, entry);
    if (fs.statSync(skillDir).isDirectory() && entry.startsWith('cm-')) {
      skills.push(entry);
    }
  }
  return skills;
}
```

**Files affected:**
- `scripts/build-skills.mjs` — Update PLATFORM_DIRS and sync logic
- `package.json` — Add `sync:all` script

### 2. Sync `_shared/helpers.md`

**Problem:** All skills reference `Per _shared/helpers.md#Load-Working-Memory` but `_shared/` not in any platform directory.

**Solution:** Add `_shared/` to sync list.

```javascript
// In build-skills.mjs
function syncSharedHelpers(srcRoot, dstRoot) {
  const sharedSrc = path.join(srcRoot, '_shared');
  const sharedDst = path.join(dstRoot, '_shared');
  if (fs.existsSync(sharedSrc)) {
    copyDirRecursive(sharedSrc, sharedDst);
  }
}
```

**Files affected:**
- `scripts/build-skills.mjs` — Add `_shared/` sync
- All platform directories — Will receive `_shared/helpers.md`

### 3. TDD Enforcement Gate

**Problem:** cm-execution can run without tests.

**Solution:** Add `tdd-gate.ts` module that checks:
1. Test file exists for target module
2. Tests run and fail (RED phase) before execution

```typescript
// src/execution/tdd-gate.ts
export interface TDDGateResult {
  passed: boolean;
  testFile: string | null;
  message: string;
}

export function enforceTDD(targetFiles: string[]): TDDGateResult {
  for (const file of targetFiles) {
    const testFile = findTestFile(file);
    if (!testFile) {
      return {
        passed: false,
        testFile: null,
        message: `TDD GATE: No test file found for ${file}. Write test first: ${suggestTestFile(file)}`
      };
    }
    const result = runTests(testFile);
    if (result.failures === 0) {
      return {
        passed: false,
        testFile,
        message: `TDD GATE: All tests pass in ${testFile}. Write a failing test for new behavior first.`
      };
    }
  }
  return { passed: true, testFile: null, message: 'TDD GATE: OK' };
}

function findTestFile(sourceFile: string): string | null {
  // src/foo.ts → test/foo.test.ts
  // src/bar/baz.ts → test/bar/baz.test.ts
  const testFile = sourceFile
    .replace(/^src\//, 'test/')
    .replace(/\.ts$/, '.test.ts')
    .replace(/\.js$/, '.test.js');
  return fs.existsSync(testFile) ? testFile : null;
}

function suggestTestFile(sourceFile: string): string {
  return sourceFile
    .replace(/^src\//, 'test/')
    .replace(/\.ts$/, '.test.ts')
    .replace(/\.js$/, '.test.js');
}
```

**Integration with cm-execution:**
```typescript
// In cm-execution pre-flight
import { enforceTDD } from './tdd-gate';

function preFlightCheck(task: Task): void {
  // Existing checks...
  
  // TDD enforcement
  const tddResult = enforceTDD(task.targetFiles);
  if (!tddResult.passed) {
    throw new Error(tddResult.message);
  }
}
```

**Files affected:**
- `src/execution/tdd-gate.ts` — New module
- `src/cli/commands/engineering.ts` — Add TDD gate to sprint pre-flight
- `.opencode/skills/cm-execution/SKILL.md` — Document TDD gate
- `.opencode/skills/cm-tdd/SKILL.md` — Reference gate

### 4. Changelog Automation

**Problem:** CHANGELOG.md manually maintained.

**Solution:** Git hook + script that auto-updates on commit.

```bash
#!/bin/bash
# scripts/update-changelog.sh

# Get last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# Get commits since last tag
if [ -z "$LAST_TAG" ]; then
  COMMITS=$(git log --oneline -20)
else
  COMMITS=$(git log --oneline "$LAST_TAG"..HEAD)
fi

# Categorize commits
FEATURES=$(echo "$COMMITS" | grep -i "^.*feat:" | sed 's/^[a-f0-9]* /- /')
FIXES=$(echo "$COMMITS" | grep -i "^.*fix:" | sed 's/^[a-f0-9]* /- /')
SECURITY=$(echo "$COMMITS" | grep -i "^.*security\|sec:" | sed 's/^[a-f0-9]* /- /')
IMPROVEMENTS=$(echo "$COMMITS" | grep -i "^.*improve\|refactor\|perf:" | sed 's/^[a-f0-9]* /- /')

# Generate changelog entry
DATE=$(date +%Y-%m-%d)
VERSION=$(node -p "require('./package.json').version")

ENTRY="## [$VERSION] - $DATE\n\n"
if [ -n "$FEATURES" ]; then ENTRY+="### 🚀 Features\n$FEATURES\n\n"; fi
if [ -n "$FIXES" ]; then ENTRY+="### 🐛 Bug Fixes\n$FIXES\n\n"; fi
if [ -n "$SECURITY" ]; then ENTRY+="### 🔒 Security\n$SECURITY\n\n"; fi
if [ -n "$IMPROVEMENTS" ]; then ENTRY+="### 🚀 Improvements\n$IMPROVEMENTS\n\n"; fi

# Prepend to CHANGELOG.md
TEMP=$(mktemp)
echo -e "$ENTRY" > "$TEMP"
cat CHANGELOG.md >> "$TEMP"
mv "$TEMP" CHANGELOG.md

echo "✅ CHANGELOG.md updated"
```

**Git hook setup:**
```bash
# .git/hooks/post-commit
#!/bin/bash
scripts/update-changelog.sh
git add CHANGELOG.md
git commit --amend --no-edit
```

**Files affected:**
- `scripts/update-changelog.sh` — New script
- `.git/hooks/post-commit` — Git hook
- `package.json` — Add `changelog` script

### 5. Gemini CLI Integration (`cm parallel`)

**Problem:** No parallel execution with Gemini CLI.

**Solution:** Create `cm parallel` command that dispatches tasks to Gemini CLI.

```typescript
// src/cli/commands/parallel.ts
import { Command } from 'commander';
import { execSync, spawn } from 'child_process';

export function registerParallelCommands(program: Command) {
  program
    .command('parallel <task>')
    .description('Execute task in parallel using Gemini CLI')
    .option('-n, --count <n>', 'Number of parallel instances', '3')
    .option('--context <files>', 'Context files to include')
    .action(async (task, opts) => {
      const count = parseInt(opts.count);
      console.log(`Starting ${count} parallel instances for: ${task}`);
      
      const processes = [];
      for (let i = 0; i < count; i++) {
        const p = spawn('gemini', [
          '-p', `Instance ${i+1}: ${task}`,
          '--context', opts.context || '.'
        ], { stdio: 'pipe' });
        processes.push(p);
      }
      
      // Monitor and collect results
      const results = await Promise.all(
        processes.map(p => new Promise((resolve) => {
          p.on('close', (code) => resolve(code));
        }))
      );
      
      console.log('All instances completed:', results);
    });
}
```

**Files affected:**
- `src/cli/commands/parallel.ts` — New command
- `src/cli/command-registry.ts` — Register command
- `.opencode/skills/cm-execution/SKILL.md` — Document parallel execution

## Verification

1. **Skill sync test:**
   ```bash
   npm run build:skills -- --all-platforms
   # Verify _shared/ exists in all platform dirs
   ls .opencode/skills/_shared/helpers.md
   ls .cursor-plugin/skills/_shared/helpers.md
   ls .codex/skills/_shared/helpers.md
   ```

2. **TDD gate test:**
   ```bash
   # Should fail - no test file
   cm sprint complete build -m "test"
   # Expected: TDD GATE error
   
   # Should fail - tests pass (no RED phase)
   npm run test:gate
   cm sprint complete build -m "test"
   # Expected: TDD GATE error
   ```

3. **Changelog test:**
   ```bash
   git commit -m "feat: test feature"
   cat CHANGELOG.md | head -20
   # Expected: New entry with feature
   ```

4. **Parallel test:**
   ```bash
   cm parallel "write unit tests for auth module" --count 3
   # Expected: 3 Gemini instances running
   ```

## Security Considerations

- Skill sync must not copy `.env` or credentials
- TDD gate must not expose internal paths in errors
- Changelog must not include sensitive commit messages
- Gemini CLI must not expose API keys in process list
