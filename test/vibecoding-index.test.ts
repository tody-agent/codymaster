import { describe, it, expect } from 'vitest';
import {
  computeVibeIndex,
  applyVibeMode,
  formatVibeReport,
  VIBE_WEIGHTS,
} from '../src/vibecoding-index';

describe('vibecoding-index', () => {
  it('returns 0 for all-zero inputs', () => {
    const r = computeVibeIndex({ intent: 0, ownership: 0, context: 0, tests: 0, review: 0 });
    expect(r.score).toBe(0);
    expect(r.band).toBe('POOR');
  });

  it('returns 100 for all-one inputs', () => {
    const r = computeVibeIndex({ intent: 1, ownership: 1, context: 1, tests: 1, review: 1 });
    expect(r.score).toBe(100);
    expect(r.band).toBe('GREAT');
  });

  it('weights sum to 1.0', () => {
    const sum = VIBE_WEIGHTS.intent + VIBE_WEIGHTS.ownership +
      VIBE_WEIGHTS.context + VIBE_WEIGHTS.tests + VIBE_WEIGHTS.review;
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('clamps inputs > 1 and < 0', () => {
    const r = computeVibeIndex({ intent: 5, ownership: -2, context: 0.5, tests: 0.5, review: 0.5 });
    expect(r.components.intent).toBe(1);
    expect(r.components.ownership).toBe(0);
    expect(r.score).toBeGreaterThan(0);
  });

  it('applyVibeMode OFF never blocks', () => {
    const r = computeVibeIndex({ intent: 0, ownership: 0, context: 0, tests: 0, review: 0 });
    expect(applyVibeMode(r, 'OFF').status).toBe('pass');
  });

  it('applyVibeMode FULL blocks when score < 70', () => {
    const r = computeVibeIndex({ intent: 0.3, ownership: 0.3, context: 0.3, tests: 0.3, review: 0.3 });
    expect(r.score).toBeLessThan(70);
    expect(applyVibeMode(r, 'FULL').status).toBe('block');
  });

  it('applyVibeMode FULL passes when score ≥ 70', () => {
    const r = computeVibeIndex({ intent: 0.9, ownership: 0.9, context: 0.9, tests: 0.9, review: 0.9 });
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(applyVibeMode(r, 'FULL').status).toBe('pass');
  });

  it('formatVibeReport renders score + advice', () => {
    const r = computeVibeIndex({ intent: 0.2 });
    const out = formatVibeReport(r);
    expect(out).toContain('Vibecoding Index');
    expect(out).toContain('Advice');
  });

  it('emits advice for low components', () => {
    const r = computeVibeIndex({ intent: 0.1, ownership: 0.1, context: 0.1, tests: 0.1, review: 0.1 });
    expect(r.advice.length).toBeGreaterThan(0);
  });
});
