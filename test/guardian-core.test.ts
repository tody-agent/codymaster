import { describe, it, expect } from 'vitest';
import { checkShellCommand, isPathUnderRoots, normalizeRoots } from '../src/guardian-core';

describe('guardian-core', () => {
  it('blocks rm -rf /', () => {
    const r = checkShellCommand('rm -rf /');
    expect(r.safe).toBe(false);
  });

  it('allows npm run build', () => {
    const r = checkShellCommand('npm run build');
    expect(r.safe).toBe(true);
  });

  it('respects freeze roots', () => {
    const roots = normalizeRoots('/proj', ['src']);
    expect(isPathUnderRoots('/proj/src/foo.ts', roots)).toBe(true);
    expect(isPathUnderRoots('/proj/other/x', roots)).toBe(false);
  });
});
