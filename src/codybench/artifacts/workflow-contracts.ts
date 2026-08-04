import fs from 'fs';
import path from 'path';

const PLATFORM_ROOTS = [
  '.aider', '.amazonq', '.amp', '.claude-desktop', '.claude', '.cline', '.codex',
  '.continue', '.copilot', '.cursor-plugin', '.gemini', '.kiro', '.opencode', '.windsurf',
] as const;

export type WorkflowContractPath =
  | 'skills/cm-planning/SKILL.md'
  | 'skills/_shared/autonomy-policy.md'
  | 'skills/cm-execution/SKILL.md'
  | 'skills/cm-execution/references/mode-b-subagent.md'
  | 'skills/cm-execution/references/mode-e-triz-parallel.md'
  | 'commands/plan.md'
  | 'commands/build.md';

export interface WorkflowArtifactCheck {
  id: string;
  passed: boolean;
  message: string;
}

export interface WorkflowArtifactResult {
  checks: WorkflowArtifactCheck[];
  passedChecks: number;
  totalChecks: number;
  violations: string[];
}

const CONTRACT_PATHS: WorkflowContractPath[] = [
  'skills/cm-planning/SKILL.md',
  'skills/_shared/autonomy-policy.md',
  'skills/cm-execution/SKILL.md',
  'skills/cm-execution/references/mode-b-subagent.md',
  'skills/cm-execution/references/mode-e-triz-parallel.md',
  'commands/plan.md',
  'commands/build.md',
];

function matchesAll(text: string, patterns: RegExp[]): boolean {
  return patterns.every(pattern => pattern.test(text));
}

export function evaluateWorkflowContractArtifacts(
  projectPath: string,
  overrides: Partial<Record<WorkflowContractPath, string>> = {},
): WorkflowArtifactResult {
  const contents = new Map<WorkflowContractPath, string>();
  for (const relativePath of CONTRACT_PATHS) {
    contents.set(
      relativePath,
      overrides[relativePath] ?? fs.readFileSync(path.join(projectPath, relativePath), 'utf8'),
    );
  }
  const planning = contents.get('skills/cm-planning/SKILL.md')!;
  const policy = contents.get('skills/_shared/autonomy-policy.md')!;
  const execution = contents.get('skills/cm-execution/SKILL.md')!;
  const modeB = contents.get('skills/cm-execution/references/mode-b-subagent.md')!;
  const modeE = contents.get('skills/cm-execution/references/mode-e-triz-parallel.md')!;
  const planCommand = contents.get('commands/plan.md')!;
  const buildCommand = contents.get('commands/build.md')!;
  const policyDistributionAligned = PLATFORM_ROOTS.every(platformRoot => {
    const platformPolicyPath = path.join(
      projectPath,
      platformRoot,
      'skills/_shared/autonomy-policy.md',
    );
    const executionPath = path.join(
      projectPath,
      platformRoot,
      'skills/cm-execution/SKILL.md',
    );
    if (!fs.existsSync(platformPolicyPath) || !fs.existsSync(executionPath)) return false;
    const platformPolicy = fs.readFileSync(platformPolicyPath, 'utf8');
    const platformExecution = fs.readFileSync(executionPath, 'utf8');
    return (
      platformPolicy === policy
      && /\.\.\/_shared\/autonomy-policy\.md/i.test(platformExecution)
    );
  });
  const distributionAligned = PLATFORM_ROOTS.every(platformRoot => {
    const skill = fs.readFileSync(
      path.join(projectPath, platformRoot, 'skills/cm-execution/SKILL.md'),
      'utf8',
    );
    const reference = fs.readFileSync(
      path.join(projectPath, platformRoot, 'skills/cm-execution/references/mode-e-triz-parallel.md'),
      'utf8',
    );
    return (
      /2\+ independent tasks/i.test(skill)
      && !/SPEED \+ QUALITY on 3\+ tasks/i.test(skill)
      && /2\+ independent tasks/i.test(reference)
      && !/Use when: 3\+ tasks/i.test(reference)
    );
  });
  const checks: WorkflowArtifactCheck[] = [
    {
      id: 'planning-contract',
      passed: matchesAll(planning, [
        /independently (?:testable|reviewable) deliverable/i,
        /exact create\/modify\/test paths/i,
        /consumed\/produced interfaces/i,
        /exact command and expected result/i,
        /No Placeholders/i,
      ]),
      message: 'planning contract lacks exact reviewable task, interface, verification, or placeholder rules',
    },
    {
      id: 'micro-task',
      passed: (
        /Clear micro task[\s\S]*zero approval/i.test(policy)
        && /Clear, reversible micro task[\s\S]*zero approval/i.test(buildCommand)
        && matchesAll(buildCommand, [/RED/i, /GREEN/i, /Quality Gate/i])
      ),
      message: 'micro task zero approval, inline TDD, or verification contract is missing',
    },
    {
      id: 'scoped-approval',
      passed: (
        /one approval at the plan-to-execution boundary/i.test(planCommand)
        && /scoped execution authorization/i.test(planCommand)
        && /(?:without|do not request) per-step or per-batch re-approval/i.test(execution)
      ),
      message: 'one scoped plan approval through review is not consistently defined',
    },
    {
      id: 'distributed-autonomy-policy',
      passed: policyDistributionAligned,
      message: 'shared autonomy policy is missing, unlinked, or drifted in a platform distribution',
    },
    {
      id: 'ambiguity',
      passed: /Scope-changing ambiguity[\s\S]*Ask once[\s\S]*recommend[\s\S]*default/i.test(policy),
      message: 'scope ambiguity is not grouped into one recommended/default question',
    },
    {
      id: 'safety',
      passed: matchesAll(policy, [
        /Destructive or irreversible action[\s\S]*Require explicit approval/i,
        /Production deployment[\s\S]*Require explicit approval/i,
        /Secret or payment action[\s\S]*Require explicit approval/i,
        /External communication[\s\S]*Require explicit approval/i,
      ]),
      message: 'sensitive action approvals are incomplete',
    },
    {
      id: 'mode-b-lifecycle',
      passed: matchesAll(modeB, [
        /fresh implementer/i,
        /spec reviewer[\s\S]*quality reviewer/i,
        /at most two fix\/re-review cycles/i,
        /coordinator-owned verification/i,
      ]),
      message: 'Mode B fresh implementer, ordered reviews, retry cap, or verification rule is missing',
    },
    {
      id: 'mode-e-routing',
      passed: (
        /2\+ independent tasks/i.test(execution)
        && /2\+ independent tasks/i.test(modeE)
        && distributionAligned
      ),
      message: 'Mode E two-task routing is missing or platform distributions drifted',
    },
  ];
  const violations = checks.filter(check => !check.passed).map(check => `${check.id}: ${check.message}`);
  return {
    checks,
    passedChecks: checks.filter(check => check.passed).length,
    totalChecks: checks.length,
    violations,
  };
}
