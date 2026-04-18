import { describe, it, expect } from 'vitest';
import {
  classifyTask,
  routeTask,
  estimateSavings,
  formatBrainPlan,
  type TaskType,
  type BrainLoadPlan,
} from '../src/smart-brain-router';

// ─── classifyTask ────────────────────────────────────────────────────────────

describe('classifyTask', () => {
  it('classifies simple questions', () => {
    expect(classifyTask('What color is the button?')).toBe('simple_question');
    expect(classifyTask('How does the auth work?')).toBe('simple_question');
    expect(classifyTask('Explain the routing logic')).toBe('simple_question');
    expect(classifyTask('Show me the status')).toBe('simple_question');
  });

  it('does not classify long text as simple_question', () => {
    const longQuestion = 'What is the best way to implement a complex authentication system with OAuth2, JWT tokens, refresh token rotation, and session management using Redis as the session store?';
    expect(classifyTask(longQuestion)).not.toBe('simple_question');
  });

  it('classifies session resume', () => {
    expect(classifyTask('Resume where I left off')).toBe('resume_session');
    expect(classifyTask('Continue the work')).toBe('resume_session');
    expect(classifyTask('What was I working on?')).toBe('resume_session');
    expect(classifyTask('Pick up from yesterday')).toBe('resume_session');
    expect(classifyTask('Tiếp tục công việc')).toBe('resume_session');
  });

  it('classifies code changes', () => {
    expect(classifyTask('Fix the login bug')).toBe('code_change');
    expect(classifyTask('Debug the crash on startup')).toBe('code_change');
    expect(classifyTask('There is an error in the API')).toBe('code_change');
    expect(classifyTask('Sửa lỗi đăng nhập')).toBe('code_change');
  });

  it('classifies complex features', () => {
    expect(classifyTask('Build a payment system with Stripe integration')).toBe('complex_feature');
    expect(classifyTask('Create a user dashboard')).toBe('complex_feature');
    expect(classifyTask('Implement WebSocket notifications')).toBe('complex_feature');
    expect(classifyTask('Add multi-tenant support')).toBe('complex_feature');
    expect(classifyTask('Tạo tính năng thanh toán')).toBe('complex_feature');
  });

  it('classifies content creation', () => {
    expect(classifyTask('Write a blog post about React')).toBe('content_creation');
    expect(classifyTask('Create the API documentation')).toBe('content_creation');
    expect(classifyTask('Generate article about performance')).toBe('content_creation');
    expect(classifyTask('Viết bài viết về AI')).toBe('content_creation');
  });

  it('classifies deployment', () => {
    expect(classifyTask('Deploy to production')).toBe('deployment');
    expect(classifyTask('Ship the release')).toBe('deployment');
    expect(classifyTask('Publish the package')).toBe('deployment');
    expect(classifyTask('Triển khai lên production')).toBe('deployment');
  });

  it('defaults to code_change for ambiguous input', () => {
    expect(classifyTask('do the thing')).toBe('code_change');
    expect(classifyTask('make it work')).toBe('code_change');
  });
});

// ─── routeTask ───────────────────────────────────────────────────────────────

describe('routeTask', () => {
  it('routes simple questions to Tier 1 only', () => {
    const plan = routeTask('What is the API endpoint?');
    expect(plan.taskType).toBe('simple_question');
    expect(plan.tiers).toEqual([1]);
    expect(plan.totalBudget).toBeLessThanOrEqual(200);
    expect(plan.progressiveLoad).toBe(false);
  });

  it('routes session resume to Tier 1+2', () => {
    const plan = routeTask('Continue the work');
    expect(plan.taskType).toBe('resume_session');
    expect(plan.tiers).toEqual([1, 2]);
    expect(plan.totalBudget).toBeLessThanOrEqual(500);
  });

  it('routes code changes to Tier 1+2+3+5', () => {
    const plan = routeTask('Fix the login bug in auth module');
    expect(plan.taskType).toBe('code_change');
    expect(plan.tiers).toEqual([1, 2, 3, 5]);
    expect(plan.tier3Scope).toBe('auth');
  });

  it('routes deployment to Tier 1+2+3 with deploy scope', () => {
    const plan = routeTask('Deploy the release to staging');
    expect(plan.taskType).toBe('deployment');
    expect(plan.tiers).toEqual([1, 2, 3]);
    expect(plan.tier3Scope).toBe('deploy');
  });

  it('routes complex features to all tiers with progressive load', () => {
    const plan = routeTask('Build a complete payment system');
    expect(plan.taskType).toBe('complex_feature');
    expect(plan.tiers).toEqual([1, 2, 3, 4, 5]);
    expect(plan.progressiveLoad).toBe(true);
    expect(plan.totalBudget).toBe(5000);
  });

  it('routes content creation to Tier 1+3+4', () => {
    const plan = routeTask('Write documentation for the API');
    expect(plan.taskType).toBe('content_creation');
    expect(plan.tiers).toEqual([1, 3, 4]);
  });

  it('extracts file paths for Tier 5 filtering', () => {
    const plan = routeTask('Fix the bug in src/auth.ts and utils/helpers.js');
    expect(plan.tier5Filter).toContain('src/auth.ts');
    expect(plan.tier5Filter).toContain('utils/helpers.js');
  });

  it('includes rationale in every plan', () => {
    const plan = routeTask('Fix something');
    expect(plan.rationale).toBeTruthy();
    expect(plan.rationale.length).toBeGreaterThan(10);
  });
});

// ─── estimateSavings ─────────────────────────────────────────────────────────

describe('estimateSavings', () => {
  it('estimates high savings for simple questions', () => {
    const plan = routeTask('What is X?');
    const savings = estimateSavings(plan);
    expect(savings.percentage).toBeGreaterThanOrEqual(90);
    expect(savings.saved).toBeGreaterThan(4000);
  });

  it('estimates zero savings for complex features (all tiers)', () => {
    const plan = routeTask('Build a complete payment system');
    const savings = estimateSavings(plan);
    expect(savings.percentage).toBe(0);
    expect(savings.withRouting).toBe(savings.withoutRouting);
  });

  it('estimates moderate savings for code changes', () => {
    const plan = routeTask('Fix the login bug');
    const savings = estimateSavings(plan);
    expect(savings.percentage).toBeGreaterThanOrEqual(20);
    expect(savings.percentage).toBeLessThan(90);
  });
});

// ─── formatBrainPlan ─────────────────────────────────────────────────────────

describe('formatBrainPlan', () => {
  it('produces readable output', () => {
    const plan = routeTask('Fix the login bug');
    const output = formatBrainPlan(plan);
    expect(output).toContain('Brain Load Plan');
    expect(output).toContain('code_change');
    expect(output).toContain('Active tiers');
    expect(output).toContain('Token savings');
  });

  it('includes scope information when available', () => {
    const plan = routeTask('Fix the auth module error');
    const output = formatBrainPlan(plan);
    expect(output).toContain('auth');
  });
});
