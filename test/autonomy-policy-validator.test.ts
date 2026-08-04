import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '..');
const VALIDATOR = path.join(REPO_ROOT, 'scripts', 'validate-autonomy-policy.mjs');

const validFiles: Record<string, string> = {
  'skills/_shared/autonomy-policy.md': `# Autonomy and confirmation policy

## Decision table

| Class | Decision |
|---|---|
| Read-only or reversible, in-scope | Proceed automatically. |
| Scope-changing ambiguity | Ask once with a recommendation and default. |
| Destructive or irreversible action | Require explicit approval. |
| Production deployment | Require explicit approval. |
| Secret or payment action | Require explicit approval. |
| External communication | Require explicit approval. |

## Scoped execution authorization

Approved plans create scoped execution authorization without per-step or per-batch re-approval.

## Status and pause semantics

Batch updates are non-blocking. Pause only for a blocker, material plan change, or an explicit-approval action.
`,
  'skills/cm-start/SKILL.md': `# Start

Follow [_shared/autonomy-policy.md](../_shared/autonomy-policy.md).
Select the project level from evidence and continue without confirmation when the objective is clear; the user may override it.
`,
  'skills/cm-execution/SKILL.md': `# Execution

Follow [_shared/autonomy-policy.md](../_shared/autonomy-policy.md).
Treat approved plan scope as scoped execution authorization and do not request per-step or per-batch re-approval.
`,
  'skills/cm-execution/references/mode-a-batch.md': `# Batch

Follow [_shared/autonomy-policy.md](../../_shared/autonomy-policy.md).
Between batches, send a non-blocking status update and continue. Pause only for a blocker, material plan change, or an explicit-approval action.
`,
  'commands/plan.md': `# Plan

Follow [the shared autonomy policy](../skills/_shared/autonomy-policy.md).
Request one approval at the plan-to-execution boundary; approval grants scoped execution authorization.
`,
  'commands/build.md': `# Build

Follow [the shared autonomy policy](../skills/_shared/autonomy-policy.md).
Reuse scoped execution authorization without re-approval. A clear micro task may proceed with zero approval. Explicit approval still gates destructive actions, production deployment, secrets, payments, and external communication.
`,
};

function makeFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-autonomy-policy-'));
  for (const [relativePath, content] of Object.entries(validFiles)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  return root;
}

function validate(root: string): string {
  return execFileSync(process.execPath, [VALIDATOR, root], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

describe('autonomy policy validator', () => {
  const fixtures: string[] = [];

  afterEach(() => {
    while (fixtures.length) fs.rmSync(fixtures.pop()!, { recursive: true, force: true });
  });

  it('accepts entry points that share one scoped-authorization policy', () => {
    const root = makeFixture();
    fixtures.push(root);

    expect(validate(root)).toContain('autonomy-policy: OK');
  });

  it('rejects a blocking checkpoint reintroduced between batches', () => {
    const root = makeFixture();
    fixtures.push(root);
    fs.appendFileSync(
      path.join(root, 'skills/cm-execution/references/mode-a-batch.md'),
      '\nBetween batches: report and wait.\n',
      'utf8'
    );

    expect(() => validate(root)).toThrowError(/blocking checkpoint/i);
  });

  it('rejects an entry point that stops referencing the shared policy', () => {
    const root = makeFixture();
    fixtures.push(root);
    fs.writeFileSync(path.join(root, 'commands/build.md'), '# Build\n\nImplement the feature.\n', 'utf8');

    expect(() => validate(root)).toThrowError(/commands\/build\.md.*shared autonomy policy/i);
  });
});
