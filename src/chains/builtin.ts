import type { ChainDefinition } from '../skill-chain';

// ─── Built-in Chain Definitions ─────────────────────────────────────────────
// TRIZ #40 Composite Materials — skills compose into pipelines

const BUILTIN_CHAINS: ChainDefinition[] = [
  {
    id: 'feature-development',
    name: 'Feature Development',
    description: 'Full pipeline: analyze → plan → test → build → verify → ship',
    icon: '🚀',
    steps: [
      { skill: 'cm-brainstorm-idea', condition: 'if-complex', optional: true, description: 'Analyze problem & evaluate options (skip for simple features)' },
      { skill: 'cm-planning', condition: 'always', description: 'Design implementation plan' },
      { skill: 'cm-tdd', condition: 'always', description: 'Write tests first (Red-Green-Refactor)' },
      { skill: 'cm-execution', condition: 'always', description: 'Execute the implementation plan' },
      { skill: 'cm-quality-gate', condition: 'always', description: 'Run 6-gate verification' },
      { skill: 'cm-safe-deploy', condition: 'if-ready', optional: true, description: 'Deploy to staging/production' },
    ],
    triggers: ['feature', 'build', 'create', 'implement', 'add', 'new feature', 'develop', 'tạo', 'xây dựng', 'thêm tính năng'],
  },
  {
    id: 'bug-fix',
    name: 'Bug Fix',
    description: 'Investigate → fix with tests → verify quality',
    icon: '🐛',
    steps: [
      { skill: 'cm-debugging', condition: 'always', description: 'Root cause investigation (5-phase)' },
      { skill: 'cm-tdd', condition: 'always', description: 'Fix with regression test' },
      { skill: 'cm-quality-gate', condition: 'always', description: 'Verify fix quality' },
    ],
    triggers: ['bug', 'fix', 'error', 'broken', 'crash', 'debug', 'sửa', 'lỗi', 'hỏng'],
  },
  {
    id: 'content-launch',
    name: 'Content Launch',
    description: 'Generate content → setup tracking → optimize conversions',
    icon: '📝',
    steps: [
      { skill: 'cm-content-factory', condition: 'always', description: 'Research & generate content' },
      { skill: 'cm-ads-tracker', condition: 'if-ready', optional: true, description: 'Setup conversion tracking' },
      { skill: 'cro-methodology', condition: 'if-ready', optional: true, description: 'CRO audit & optimization' },
    ],
    triggers: ['content', 'blog', 'article', 'marketing', 'launch', 'campaign', 'nội dung', 'bài viết', 'chiến dịch'],
  },
  {
    id: 'new-project',
    name: 'New Project Setup',
    description: 'Bootstrap → plan → implement → verify → deploy',
    icon: '🏗️',
    steps: [
      { skill: 'cm-project-bootstrap', condition: 'always', description: 'Full project setup with design system & CI' },
      { skill: 'cm-planning', condition: 'always', description: 'Plan initial features' },
      { skill: 'cm-tdd', condition: 'always', description: 'Setup test infrastructure' },
      { skill: 'cm-execution', condition: 'always', description: 'Build initial features' },
      { skill: 'cm-quality-gate', condition: 'always', description: 'Quality verification' },
      { skill: 'cm-safe-deploy', condition: 'if-ready', optional: true, description: 'Initial deployment' },
    ],
    triggers: ['new project', 'init', 'bootstrap', 'setup', 'scaffold', 'start from scratch', 'dự án mới', 'khởi tạo'],
  },
  {
    id: 'code-review',
    name: 'Code Review & Ship',
    description: 'Review code → verify quality → deploy',
    icon: '🔍',
    steps: [
      { skill: 'cm-code-review', condition: 'always', description: 'Professional PR review' },
      { skill: 'cm-quality-gate', condition: 'always', description: '6-gate verification' },
      { skill: 'cm-safe-deploy', condition: 'if-ready', optional: true, description: 'Ship to production' },
    ],
    triggers: ['review', 'PR', 'pull request', 'merge', 'ship', 'release', 'kiểm tra', 'duyệt code'],
  },
];

// ─── Exports ────────────────────────────────────────────────────────────────

export function getBuiltinChains(): ChainDefinition[] {
  return BUILTIN_CHAINS;
}

export function getChainById(id: string): ChainDefinition | undefined {
  return BUILTIN_CHAINS.find(c => c.id === id);
}

export function getAllChainIds(): string[] {
  return BUILTIN_CHAINS.map(c => c.id);
}
