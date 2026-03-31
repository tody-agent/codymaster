import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadBudget,
  checkBudget,
  estimateTokens,
  getDefaultBudget,
  generateBudgetReport,
} from '../src/token-budget';
import type { TokenBudget } from '../src/token-budget';

// ─── Test Helpers ───────────────────────────────────────────────────────────

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-budget-test-'));
  fs.mkdirSync(path.join(tempDir, '.cm'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Default Budget ─────────────────────────────────────────────────────────

describe('getDefaultBudget', () => {
  test('returns budget with all required categories', () => {
    const budget = getDefaultBudget();

    expect(budget.model_context_window).toBe(200000);
    expect(budget.enforcement).toBe('soft');
    expect(budget.allocations).toBeDefined();
    expect(budget.allocations.system_prompt).toBeGreaterThan(0);
    expect(budget.allocations.skill_index_L0).toBeGreaterThan(0);
    expect(budget.allocations.skill_active_full).toBeGreaterThan(0);
    expect(budget.allocations.memory_working).toBeGreaterThan(0);
    expect(budget.allocations.memory_learnings).toBeGreaterThan(0);
    expect(budget.allocations.codebase_skeleton).toBeGreaterThan(0);
    expect(budget.allocations.context_retrieval).toBeGreaterThan(0);
    expect(budget.allocations.conversation_history).toBeGreaterThan(0);
    expect(budget.allocations.generation_budget).toBeGreaterThan(0);
  });

  test('allocations sum to model_context_window', () => {
    const budget = getDefaultBudget();
    const total = Object.values(budget.allocations).reduce((a, b) => a + b, 0);

    expect(total).toBe(budget.model_context_window);
  });
});

// ─── Load Budget ────────────────────────────────────────────────────────────

describe('loadBudget', () => {
  test('loads from .cm/token-budget.json when exists', () => {
    const custom: TokenBudget = {
      model_context_window: 128000,
      allocations: {
        system_prompt: 4000,
        skill_index_L0: 2000,
        skill_active_full: 4000,
        memory_working: 400,
        memory_learnings: 500,
        codebase_skeleton: 1000,
        context_retrieval: 8000,
        conversation_history: 25000,
        generation_budget: 83100,
      },
      enforcement: 'hard',
    };
    fs.writeFileSync(
      path.join(tempDir, '.cm', 'token-budget.json'),
      JSON.stringify(custom, null, 2)
    );

    const loaded = loadBudget(tempDir);

    expect(loaded.model_context_window).toBe(128000);
    expect(loaded.enforcement).toBe('hard');
    expect(loaded.allocations.memory_working).toBe(400);
  });

  test('returns default budget when file missing', () => {
    const loaded = loadBudget(tempDir);

    expect(loaded.model_context_window).toBe(200000);
    expect(loaded.enforcement).toBe('soft');
  });

  test('returns default budget when file is invalid JSON', () => {
    fs.writeFileSync(
      path.join(tempDir, '.cm', 'token-budget.json'),
      'not valid json{'
    );

    const loaded = loadBudget(tempDir);

    expect(loaded.model_context_window).toBe(200000);
  });
});

// ─── Check Budget ───────────────────────────────────────────────────────────

describe('checkBudget', () => {
  test('allows when within budget', () => {
    const budget = getDefaultBudget();
    const result = checkBudget(budget, 'memory_learnings', 100);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(budget.allocations.memory_learnings - 100);
  });

  test('denies when over budget in hard mode', () => {
    const budget: TokenBudget = {
      ...getDefaultBudget(),
      enforcement: 'hard',
    };
    budget.allocations.memory_learnings = 500;

    const result = checkBudget(budget, 'memory_learnings', 2500);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBeLessThan(0);
    expect(result.suggestion).toBeDefined();
    expect(result.suggestion).toContain('L0');
  });

  test('allows but warns when over budget in soft mode', () => {
    const budget: TokenBudget = {
      ...getDefaultBudget(),
      enforcement: 'soft',
    };
    budget.allocations.memory_learnings = 500;

    const result = checkBudget(budget, 'memory_learnings', 2500);

    // Soft mode allows but suggests
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThan(0);
    expect(result.suggestion).toBeDefined();
  });

  test('handles unknown category gracefully', () => {
    const budget = getDefaultBudget();
    const result = checkBudget(budget, 'nonexistent_category', 100);

    expect(result.allowed).toBe(false);
    expect(result.suggestion).toContain('Unknown');
  });

  test('returns full budget as remaining when 0 tokens used', () => {
    const budget = getDefaultBudget();
    const result = checkBudget(budget, 'system_prompt', 0);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(budget.allocations.system_prompt);
  });
});

// ─── Estimate Tokens ────────────────────────────────────────────────────────

describe('estimateTokens', () => {
  test('estimates ~4 chars per token', () => {
    const text = 'a'.repeat(400);
    const tokens = estimateTokens(text);

    expect(tokens).toBe(100);
  });

  test('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  test('rounds up for partial tokens', () => {
    const text = 'abc'; // 3 chars → 0.75 tokens → rounds to 1
    expect(estimateTokens(text)).toBe(1);
  });

  test('handles multiline text', () => {
    const text = 'line1\nline2\nline3\nline4\n'; // 24 chars → 6 tokens
    const tokens = estimateTokens(text);

    expect(tokens).toBe(6);
  });
});

// ─── Budget Report ──────────────────────────────────────────────────────────

describe('generateBudgetReport', () => {
  test('produces human-readable report with all categories', () => {
    const budget = getDefaultBudget();
    const report = generateBudgetReport(budget);

    expect(report).toContain('system_prompt');
    expect(report).toContain('memory_learnings');
    expect(report).toContain('generation_budget');
    expect(report).toMatch(/200[,.]?000/);
  });

  test('shows percentage for each category', () => {
    const budget = getDefaultBudget();
    const report = generateBudgetReport(budget);

    // Should contain percentage values
    expect(report).toMatch(/\d+\.?\d*%/);
  });
});
