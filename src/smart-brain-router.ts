// ─── Smart Brain Router ─────────────────────────────────────────────────────
// Task-type classifier + brain tier selector for CodyMaster's 5-Tier Brain.
// TRIZ #1 Segmentation — load only the brain tiers needed for each task type.

// ─── Types ──────────────────────────────────────────────────────────────────

export type TaskType =
  | 'simple_question'
  | 'resume_session'
  | 'code_change'
  | 'complex_feature'
  | 'content_creation'
  | 'deployment';

/**
 * Brain tiers in CodyMaster's 5-Tier architecture:
 *   1 = Sensory (always on, 0 cost)
 *   2 = Working Memory (CONTINUITY.md)
 *   3 = Long-term (SQLite learnings/decisions)
 *   4 = Semantic (qmd vector search)
 *   5 = Structural (CodeGraph AST)
 */
export type BrainTier = 1 | 2 | 3 | 4 | 5;

export interface BrainLoadPlan {
  taskType: TaskType;
  tiers: BrainTier[];
  totalBudget: number;
  tier3Scope?: string;
  tier5Filter?: string[];
  progressiveLoad: boolean;
  rationale: string;
}

// ─── Tier Costs (average token estimates) ────────────────────────────────────

const TIER_COSTS: Record<BrainTier, { label: string; avgTokens: number; latencyMs: number }> = {
  1: { label: 'Sensory',    avgTokens: 0,    latencyMs: 0   },
  2: { label: 'Working',    avgTokens: 400,  latencyMs: 0   },
  3: { label: 'Long-term',  avgTokens: 650,  latencyMs: 50  },
  4: { label: 'Semantic',   avgTokens: 1500, latencyMs: 2000 },
  5: { label: 'Structural', avgTokens: 3000, latencyMs: 5000 },
};

// ─── Task Classifier ────────────────────────────────────────────────────────
// TRIZ #1 Segmentation — classify to load only what's needed

/**
 * Lightweight task classifier — keyword based, no LLM call.
 * Cost: ~0 tokens, <1ms.
 */
export function classifyTask(description: string): TaskType {
  const lower = description.toLowerCase();

  // Order matters: more specific patterns first

  if (lower.match(/\b(resume|continue|what was|pick up|carry on|tiếp tục|đang làm gì)\b/)) {
    return 'resume_session';
  }

  if (lower.match(/\b(deploy|ship|release|publish|push to prod|triển khai|xuất bản)\b/)) {
    return 'deployment';
  }

  if (lower.match(/\b(blog|article|content|write about|documentation|bài viết|nội dung|tài liệu)\b/)) {
    return 'content_creation';
  }

  if (lower.match(/\b(fix|bug|error|crash|broken|debug|sửa|lỗi|hỏng)\b/)) {
    return 'code_change';
  }

  if (lower.match(/\b(build|create|implement|add|feature|system|xây|tạo|thêm|tính năng)\b/)) {
    return 'complex_feature';
  }

  // Short descriptive queries are likely simple questions
  if (lower.match(/\b(what|how|why|explain|status|where|show|list)\b/) && lower.length < 120) {
    return 'simple_question';
  }

  return 'code_change'; // Safe default
}

// ─── Brain Router ────────────────────────────────────────────────────────────

/**
 * Smart Brain Router — selects minimal brain layers needed for a task.
 *
 * Problem solved:
 *   Without routing, every task loads all 5 tiers = ~5550 tokens + 7s latency.
 *   With routing, simple tasks use ~0-400 tokens, complex tasks scale progressively.
 *
 * Estimated savings: ~60-80% token reduction on brain context loading.
 */
export function routeTask(taskDescription: string): BrainLoadPlan {
  const taskType = classifyTask(taskDescription);

  switch (taskType) {
    case 'simple_question':
      return {
        taskType,
        tiers: [1],
        totalBudget: 200,
        progressiveLoad: false,
        rationale: 'Simple question — Tier 1 (Sensory) only. No memory or code context needed.',
      };

    case 'resume_session':
      return {
        taskType,
        tiers: [1, 2],
        totalBudget: 500,
        progressiveLoad: false,
        rationale: 'Session resume — Tier 1 + Tier 2 (CONTINUITY.md) to recall working state.',
      };

    case 'code_change':
      return {
        taskType,
        tiers: [1, 2, 3, 5],
        tier3Scope: extractScope(taskDescription),
        tier5Filter: extractFilePaths(taskDescription),
        totalBudget: 3000,
        progressiveLoad: false,
        rationale: 'Code change — Tiers 1+2+3+5. Learnings scoped, CodeGraph for affected files.',
      };

    case 'deployment':
      return {
        taskType,
        tiers: [1, 2, 3],
        tier3Scope: 'deploy',
        totalBudget: 1500,
        progressiveLoad: false,
        rationale: 'Deployment — Tiers 1+2+3. Scoped learnings for deploy patterns.',
      };

    case 'content_creation':
      return {
        taskType,
        tiers: [1, 3, 4],
        totalBudget: 2000,
        progressiveLoad: false,
        rationale: 'Content creation — Tiers 1+3+4. Semantic search for related content.',
      };

    case 'complex_feature':
      return {
        taskType,
        tiers: [1, 2, 3, 4, 5],
        totalBudget: 5000,
        progressiveLoad: true,
        rationale: 'Complex feature — All tiers, progressive loading. Start L0, upgrade on demand.',
      };
  }
}

// ─── Scope Extraction ────────────────────────────────────────────────────────

/**
 * Extract a module scope from the task description for Tier 3 scoping.
 * Returns undefined if no clear scope detected.
 */
function extractScope(description: string): string | undefined {
  const lower = description.toLowerCase();

  // Priority 1: Look for common scope keywords (most reliable)
  const scopes = ['auth', 'api', 'deploy', 'test', 'build', 'db', 'ui', 'cli', 'i18n', 'security'];
  const found = scopes.find(s => lower.includes(s));
  if (found) return found;

  // Priority 2: Look for explicit "module: xxx" or "component: xxx" patterns
  const moduleMatch = lower.match(/(?:module|component|service|package)[:\s]+(\w[\w-]*)/);
  if (moduleMatch) return moduleMatch[1];

  return undefined;
}

/**
 * Extract file paths mentioned in the task for Tier 5 filtering.
 */
function extractFilePaths(description: string): string[] | undefined {
  const matches = description.match(/[\w./-]+\.(ts|js|tsx|jsx|py|go|rs|md|json|yaml|yml)/g);
  return matches && matches.length > 0 ? matches : undefined;
}

// ─── Token Savings Estimator ─────────────────────────────────────────────────

/**
 * Estimate token savings from smart routing vs loading all tiers.
 */
export function estimateSavings(plan: BrainLoadPlan): {
  withoutRouting: number;
  withRouting: number;
  saved: number;
  percentage: number;
} {
  const allTiersTokens = Object.values(TIER_COSTS).reduce((sum, t) => sum + t.avgTokens, 0);
  const planTokens = plan.tiers.reduce((sum, tier) => sum + TIER_COSTS[tier].avgTokens, 0);

  return {
    withoutRouting: allTiersTokens,
    withRouting: planTokens,
    saved: allTiersTokens - planTokens,
    percentage: Math.round(((allTiersTokens - planTokens) / allTiersTokens) * 100),
  };
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

/**
 * Format a BrainLoadPlan for CLI display.
 */
export function formatBrainPlan(plan: BrainLoadPlan): string {
  const savings = estimateSavings(plan);
  const tierLabels = plan.tiers.map(t => `  ${t}. ${TIER_COSTS[t].label} (~${TIER_COSTS[t].avgTokens} tokens)`);

  const lines = [
    `🧠 Brain Load Plan`,
    `─`.repeat(50),
    `Task type:   ${plan.taskType}`,
    `Progressive: ${plan.progressiveLoad ? 'Yes' : 'No'}`,
    `Budget:      ${plan.totalBudget.toLocaleString()} tokens`,
    ``,
    `Active tiers:`,
    ...tierLabels,
    ``,
    `Token savings:`,
    `  All tiers:   ~${savings.withoutRouting.toLocaleString()} tokens`,
    `  This plan:   ~${savings.withRouting.toLocaleString()} tokens`,
    `  Saved:       ~${savings.saved.toLocaleString()} tokens (${savings.percentage}%)`,
    ``,
    `Rationale: ${plan.rationale}`,
  ];

  if (plan.tier3Scope) {
    lines.push(`Tier 3 scope: ${plan.tier3Scope}`);
  }
  if (plan.tier5Filter) {
    lines.push(`Tier 5 filter: ${plan.tier5Filter.join(', ')}`);
  }

  return lines.join('\n');
}
