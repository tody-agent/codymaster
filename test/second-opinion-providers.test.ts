import { describe, it, expect } from 'vitest';
import { redactDiffForReview } from '../src/second-opinion-providers';

describe('second-opinion-providers', () => {
  it('redactDiffForReview masks sk- style tokens', () => {
    const raw = 'echo sk-abcdefghijklmnopqrstuvwxyz0123456789\n';
    const out = redactDiffForReview(raw);
    expect(out).toContain('[REDACTED_TOKEN]');
    expect(out).not.toContain('sk-abc');
  });

  it('redactDiffForReview masks line secrets', () => {
    const raw = 'SECRET: super-secret-value\n';
    const out = redactDiffForReview(raw);
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('super-secret');
  });
});
