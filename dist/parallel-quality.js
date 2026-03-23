"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMiniGatePrompt = generateMiniGatePrompt;
exports.compositeAgentPrompt = compositeAgentPrompt;
exports.getQualityContractForTask = getQualityContractForTask;
exports.validateAgentReport = validateAgentReport;
// ─── TRIZ #3: Local Quality — Per-Agent Mini Gate ──────────────────────────
/**
 * Generates a lightweight quality gate prompt that each agent must run
 * on its own modified files. Only checks syntax (Layer 1) and business
 * logic (Layer 3) — skips full suite for speed.
 *
 * TRIZ Principle #3 (Local Quality): Each part of the system should
 * perform the function that is most useful locally.
 */
function generateMiniGatePrompt(task, contract) {
    const checks = [];
    if (contract.mustPassSyntax) {
        checks.push(`1. **Syntax Validation**: Ensure all modified files parse without errors.
   For TypeScript/JavaScript files, run: \`npx tsc --noEmit\` or use acorn parser.
   Modified files to check: ${task.affectedFiles.join(', ') || 'all changed files'}`);
    }
    if (contract.mustPassTests) {
        checks.push(`2. **Test Execution**: Run tests relevant to your changes.
   Command: \`npm run test:gate\` OR run only tests related to modified files.
   If you created new functionality, write at least 1 test for it.`);
    }
    if (contract.mustSelfReview) {
        checks.push(`3. **Self-Review Checklist**:
   - [ ] No console.log/debug statements left
   - [ ] No hardcoded values that should be configurable
   - [ ] No TODO comments without associated task IDs
   - [ ] Error handling is present for all async operations
   - [ ] Types are properly defined (no \`any\` unless justified)`);
    }
    return `
## ⚡ Quality Contract (TRIZ #3 Local Quality)

Before reporting task completion, you MUST pass these quality checks:

${checks.join('\n\n')}

### Constraints
- Maximum modified files: ${contract.maxModifiedFiles}
- Timeout: ${Math.round(contract.timeoutMs / 1000)}s

### Report Format
After completing quality checks, report:
\`\`\`json
{
  "taskId": "${task.id}",
  "passed": true/false,
  "modifiedFiles": ["file1.ts", "file2.ts"],
  "testsPassed": 0,
  "testsFailed": 0,
  "issues": []
}
\`\`\`
`;
}
// ─── TRIZ #40: Composite — Agent = Implementer + Tester + Reviewer ────────
/**
 * Generates a composite agent prompt that instructs the agent to perform
 * all three roles: implement, test, and review.
 *
 * TRIZ Principle #40 (Composite Materials): Change from uniform to composite.
 * Each agent is not just an implementer — it's a composite of three roles.
 */
function compositeAgentPrompt(task, project, batchInfo) {
    const qualityGate = generateMiniGatePrompt(task, task.qualityContract);
    return `# Parallel Task: ${task.title}

## 🔧 Context
| Field | Value |
|-------|-------|
| Project | ${project.name} |
| Workspace | \`${project.path}\` |
| Batch | ${batchInfo.batchId} (task ${batchInfo.position + 1}/${batchInfo.batchSize}) |
| Skill | ${task.skill || 'None'} |
| Priority | ${task.priority} |

## 📝 Description

${task.description || 'No additional description provided.'}

## 🎭 Your Three Roles (TRIZ #40 Composite)

### Role 1: IMPLEMENTER
Implement the task as described above. Follow existing code patterns and conventions.
${task.skill ? `Use skill \`${task.skill}\` for guidance.` : ''}

### Role 2: TESTER
After implementing, write or update tests for your changes:
- At minimum, 1 test per new function
- Run existing tests to ensure no regressions
- If TDD applies, write tests FIRST (cm-tdd)

### Role 3: REVIEWER
Before reporting completion, review your own work:
- Read your diff critically
- Check for edge cases you may have missed
- Verify error handling completeness

${qualityGate}

## ⚠️ Parallel Execution Rules

1. **ONLY modify these files**: ${task.affectedFiles.length > 0 ? task.affectedFiles.map(f => `\`${f}\``).join(', ') : 'Files as needed for this task'}
2. **DO NOT modify files outside your scope** — other agents are working in parallel
3. **Report your actual modified files** after completion for conflict detection
4. **If you need to modify a shared file**, STOP and report the conflict instead of proceeding
`;
}
// ─── Quality Contract Presets ───────────────────────────────────────────────
/**
 * Returns a quality contract tuned for the task type.
 */
function getQualityContractForTask(task) {
    // High-priority or urgent tasks get stricter contracts
    if (task.priority === 'urgent' || task.priority === 'high') {
        return {
            mustPassSyntax: true,
            mustPassTests: true,
            mustSelfReview: true,
            maxModifiedFiles: 5,
            timeoutMs: 180000, // 3 min — tighter deadline
        };
    }
    // Standard contract
    return {
        mustPassSyntax: true,
        mustPassTests: true,
        mustSelfReview: true,
        maxModifiedFiles: 10,
        timeoutMs: 300000, // 5 min
    };
}
// ─── Validate Agent Report ──────────────────────────────────────────────────
/**
 * Validates an agent's self-reported quality gate result.
 * Returns a structured result with pass/fail details.
 */
function validateAgentReport(report, contract) {
    const checks = [];
    // Check file count constraint
    checks.push({
        name: 'Modified files within limit',
        passed: report.modifiedFiles.length <= contract.maxModifiedFiles,
        details: `${report.modifiedFiles.length}/${contract.maxModifiedFiles} files`,
    });
    // Check test results
    if (contract.mustPassTests) {
        checks.push({
            name: 'Tests passing',
            passed: report.testsFailed === 0,
            details: `${report.testsPassed} passed, ${report.testsFailed} failed`,
        });
    }
    // Check self-reported pass status
    checks.push({
        name: 'Agent self-assessment',
        passed: report.passed,
        details: report.issues.length > 0 ? report.issues.join('; ') : 'No issues reported',
    });
    const allPassed = checks.every(c => c.passed);
    return {
        passed: allPassed,
        taskId: report.taskId,
        checks,
        timestamp: new Date().toISOString(),
    };
}
