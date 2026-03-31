import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BudgetAllocations {
  system_prompt: number;
  skill_index_L0: number;
  skill_active_full: number;
  memory_working: number;
  memory_learnings: number;
  codebase_skeleton: number;
  context_retrieval: number;
  conversation_history: number;
  generation_budget: number;
  [key: string]: number;
}

export interface TokenBudget {
  model_context_window: number;
  allocations: BudgetAllocations;
  enforcement: 'soft' | 'hard';
}

export interface BudgetCheckResult {
  allowed: boolean;
  remaining: number;
  suggestion?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CM_DIR = '.cm';
const BUDGET_FILE = 'token-budget.json';

// ─── Default Budget ─────────────────────────────────────────────────────────

export function getDefaultBudget(): TokenBudget {
  return {
    model_context_window: 200000,
    allocations: {
      system_prompt: 5000,        // 2.5%
      skill_index_L0: 2500,       // 1.25%
      skill_active_full: 5000,    // 2.5%
      memory_working: 500,        // 0.25%
      memory_learnings: 650,      // 0.325%
      codebase_skeleton: 1500,    // 0.75%
      context_retrieval: 10000,   // 5%
      conversation_history: 30000,// 15%
      generation_budget: 144850,  // 72.425%
    },
    enforcement: 'soft',
  };
}

// ─── Load Budget ────────────────────────────────────────────────────────────

export function loadBudget(projectPath: string): TokenBudget {
  const budgetPath = path.join(projectPath, CM_DIR, BUDGET_FILE);

  if (!fs.existsSync(budgetPath)) {
    return getDefaultBudget();
  }

  try {
    const raw = fs.readFileSync(budgetPath, 'utf-8');
    return JSON.parse(raw) as TokenBudget;
  } catch {
    return getDefaultBudget();
  }
}

// ─── Check Budget ────────────────────────────────────────────────────────────

export function checkBudget(
  budget: TokenBudget,
  category: string,
  tokenCount: number
): BudgetCheckResult {
  const allocs = budget.allocations as Record<string, number>;
  const allocated = allocs[category];

  if (allocated === undefined) {
    return {
      allowed: false,
      remaining: 0,
      suggestion: `Unknown category "${category}". Valid: ${Object.keys(allocs).join(', ')}`,
    };
  }

  const remaining = allocated - tokenCount;
  const overBudget = remaining < 0;

  if (!overBudget) {
    return { allowed: true, remaining };
  }

  const suggestion = buildSuggestion(category, tokenCount, allocated);

  if (budget.enforcement === 'hard') {
    return { allowed: false, remaining, suggestion };
  }

  // Soft mode: allow but warn
  return { allowed: true, remaining, suggestion };
}

function buildSuggestion(category: string, used: number, allocated: number): string {
  const over = used - allocated;
  if (category === 'memory_learnings') {
    return `memory_learnings over by ~${over} tokens. Switch to L0 index (cm://memory/learnings/L0) to reduce to ~100 tokens.`;
  }
  if (category === 'codebase_skeleton') {
    return `codebase_skeleton over by ~${over} tokens. Use cm://resources/skeleton/L0 for module-level index (~500 tokens).`;
  }
  if (category === 'memory_working') {
    return `memory_working over by ~${over} tokens. Read CONTINUITY abstract only (first 3 lines).`;
  }
  return `${category} over budget by ~${over} tokens. Consider using L0 index instead of full content.`;
}

// ─── Estimate Tokens ─────────────────────────────────────────────────────────

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// ─── Budget Report ────────────────────────────────────────────────────────────

export function generateBudgetReport(budget: TokenBudget): string {
  const total = budget.model_context_window;
  const lines: string[] = [
    `Token Budget Report (${total.toLocaleString()} context window, enforcement: ${budget.enforcement})`,
    '─'.repeat(70),
    `${'Category'.padEnd(25)} ${'Allocated'.padStart(10)} ${'% of CTX'.padStart(10)}`,
    '─'.repeat(70),
  ];

  const allocs = budget.allocations as Record<string, number>;
  for (const [cat, allocated] of Object.entries(allocs)) {
    const pct = ((allocated / total) * 100).toFixed(2);
    lines.push(
      `${cat.padEnd(25)} ${allocated.toLocaleString().padStart(10)} ${(pct + '%').padStart(10)}`
    );
  }

  const sum = Object.values(allocs).reduce((a, b) => a + b, 0);
  lines.push('─'.repeat(70));
  lines.push(
    `${'TOTAL'.padEnd(25)} ${sum.toLocaleString().padStart(10)} ${(((sum / total) * 100).toFixed(2) + '%').padStart(10)}`
  );

  return lines.join('\n');
}
