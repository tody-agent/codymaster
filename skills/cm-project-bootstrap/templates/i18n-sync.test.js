import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('i18n Sync', () => {
  const i18nDir = 'public/static/i18n';

  it('primary language file exists', () => {
    expect(existsSync(join(i18nDir, 'vi.json'))).toBe(true);
  });

  it('all language files have same keys as primary', () => {
    if (!existsSync(i18nDir)) return;
    const primaryKeys = getAllKeys(
      JSON.parse(readFileSync(join(i18nDir, 'vi.json'), 'utf-8'))
    );

    const langFiles = readdirSync(i18nDir)
      .filter(f => f.endsWith('.json') && f !== 'vi.json');

    langFiles.forEach(file => {
      const langKeys = getAllKeys(
        JSON.parse(readFileSync(join(i18nDir, file), 'utf-8'))
      );
      const missing = primaryKeys.filter(k => !langKeys.includes(k));
      expect(missing, `${file} missing keys: ${missing.join(', ')}`).toEqual([]);
    });
  });
});

function getAllKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return typeof val === 'object' && val !== null
      ? getAllKeys(val, fullKey)
      : [fullKey];
  });
}
