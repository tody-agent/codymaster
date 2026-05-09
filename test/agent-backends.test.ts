import { describe, it, expect } from 'vitest';
import { getBackend, listBackends } from '../src/agent/factory';
import { checkMinVersion } from '../src/agent/version';

describe('Agent backend factory', () => {
  const expectedNames = [
    'claude-code', 'codex', 'cursor', 'gemini',
    'copilot', 'antigravity', 'opencode',
  ];

  it('listBackends() returns all 7 backend names', () => {
    const names = listBackends();
    expect(names).toHaveLength(7);
    for (const n of expectedNames) {
      expect(names).toContain(n);
    }
  });

  it('getBackend() throws on unknown name', () => {
    expect(() => getBackend('nonexistent')).toThrow('Unknown agent backend: nonexistent');
  });

  for (const name of expectedNames) {
    it(`getBackend('${name}') returns a valid backend`, () => {
      const backend = getBackend(name);
      expect(backend.name).toBe(name);
      expect(typeof backend.detectVersion).toBe('function');
      expect(typeof backend.execute).toBe('function');
    });
  }
});

describe('checkMinVersion', () => {
  it('returns true when version equals min', () => {
    expect(checkMinVersion('1.0.0', '1.0.0')).toBe(true);
  });

  it('returns true when version exceeds min', () => {
    expect(checkMinVersion('2.3.4', '1.0.0')).toBe(true);
  });

  it('returns true for patch bump', () => {
    expect(checkMinVersion('1.0.1', '1.0.0')).toBe(true);
  });

  it('returns true for minor bump', () => {
    expect(checkMinVersion('1.1.0', '1.0.0')).toBe(true);
  });

  it('returns false when version is below min', () => {
    expect(checkMinVersion('0.9.0', '1.0.0')).toBe(false);
  });

  it('returns false for lower patch', () => {
    expect(checkMinVersion('1.0.0', '1.0.1')).toBe(false);
  });
});
