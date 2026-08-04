#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] ?? path.join(scriptDir, '..'));

const POLICY = 'skills/_shared/autonomy-policy.md';
const ENTRY_POINTS = [
  'skills/cm-start/SKILL.md',
  'skills/cm-execution/SKILL.md',
  'skills/cm-execution/references/mode-a-batch.md',
  'commands/plan.md',
  'commands/build.md',
];
const PLATFORM_ROOTS = [
  '.aider', '.amazonq', '.amp', '.claude-desktop', '.claude', '.cline', '.codex',
  '.continue', '.copilot', '.cursor-plugin', '.gemini', '.kiro', '.opencode', '.windsurf',
];

const errors = [];

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    errors.push(`${relativePath}: missing required policy file`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function requireMatch(relativePath, text, pattern, message) {
  if (!pattern.test(text)) errors.push(`${relativePath}: ${message}`);
}

const policy = read(POLICY);
const policyRules = [
  [/## Decision table/i, 'missing decision table'],
  [/read-only[^\n|]*or reversible[^\n|]*in-scope/i, 'missing automatic in-scope action class'],
  [/scope-changing ambiguity/i, 'missing scope-changing ambiguity class'],
  [/destructive or irreversible action/i, 'missing destructive action class'],
  [/production deployment/i, 'missing production deployment class'],
  [/secret or payment action/i, 'missing secret/payment class'],
  [/external communication/i, 'missing external communication class'],
  [/scoped execution authorization/i, 'missing scoped execution authorization semantics'],
  [/without per-step or per-batch re-approval/i, 'missing no-reapproval invariant'],
  [/non-blocking/i, 'missing non-blocking status semantics'],
  [/pause only/i, 'missing explicit pause conditions'],
];
for (const [pattern, message] of policyRules) requireMatch(POLICY, policy, pattern, message);

const entryContents = new Map();
for (const relativePath of ENTRY_POINTS) {
  const text = read(relativePath);
  entryContents.set(relativePath, text);
  requireMatch(relativePath, text, /autonomy-policy\.md/i, 'must reference the shared autonomy policy');
}

const semanticRules = {
  'skills/cm-start/SKILL.md': [
    [/select[^\n]*project level[^\n]*evidence/i, 'must select project level from evidence'],
    [/without confirmation/i, 'must not require level confirmation when the objective is clear'],
    [/override/i, 'must allow a user override'],
  ],
  'skills/cm-execution/SKILL.md': [
    [/scoped execution authorization/i, 'must consume scoped execution authorization'],
    [/per-step or per-batch re-approval/i, 'must prohibit repeated execution approval'],
  ],
  'skills/cm-execution/references/mode-a-batch.md': [
    [/non-blocking status update/i, 'must use non-blocking batch status updates'],
    [/pause only/i, 'must define evidence-based pause conditions'],
  ],
  'commands/plan.md': [
    [/one approval/i, 'must have one approval boundary'],
    [/plan-to-execution/i, 'must place approval at the plan-to-execution boundary'],
    [/scoped execution authorization/i, 'must define the authorization produced by approval'],
  ],
  'commands/build.md': [
    [/scoped execution authorization/i, 'must reuse plan authorization'],
    [/zero approval/i, 'must allow zero approval for clear micro tasks'],
    [
      /destructive[\s\S]*production deploy(?:ment)?[\s\S]*secrets?[\s\S]*payments?[\s\S]*external communication/i,
      'must retain explicit approval for sensitive actions',
    ],
  ],
};

for (const [relativePath, rules] of Object.entries(semanticRules)) {
  const text = entryContents.get(relativePath) ?? '';
  for (const [pattern, message] of rules) requireMatch(relativePath, text, pattern, message);
}

const forbiddenBlockingCheckpoints = [
  /between batches[^\n]*(?:report[^\n]*)?and wait/i,
  /wait for sign-off/i,
  /let (?:the )?user confirm[^\n]*level/i,
  /(?:ask|request)[^\n]*approval[^\n]*(?:each|every|per)[ -]?(?:step|batch)/i,
];
for (const [relativePath, text] of entryContents) {
  if (forbiddenBlockingCheckpoints.some((pattern) => pattern.test(text))) {
    errors.push(`${relativePath}: blocking checkpoint conflicts with scoped execution authorization`);
  }
}

for (const platformRoot of PLATFORM_ROOTS) {
  const platformPolicyPath = `${platformRoot}/skills/_shared/autonomy-policy.md`;
  const platformPolicy = read(platformPolicyPath);
  if (platformPolicy && platformPolicy !== policy) {
    errors.push(`${platformPolicyPath}: content drifted from ${POLICY}`);
  }

  const executionPath = `${platformRoot}/skills/cm-execution/SKILL.md`;
  const execution = read(executionPath);
  const link = execution.match(/\]\(([^)\s]*autonomy-policy\.md)\)/i)?.[1];
  if (!link) {
    errors.push(`${executionPath}: must link to the distributed autonomy policy`);
    continue;
  }
  const resolvedLink = path.resolve(path.dirname(path.join(root, executionPath)), link);
  const expectedPolicy = path.resolve(root, platformPolicyPath);
  if (resolvedLink !== expectedPolicy) {
    errors.push(`${executionPath}: autonomy policy link must resolve to ${platformPolicyPath}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`✗ ${error}`);
  console.error(`autonomy-policy: ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`autonomy-policy: OK (${ENTRY_POINTS.length} entry points, ${PLATFORM_ROOTS.length} platforms)`);
