import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadCmConfig } from '../src/cm-config';

describe('cm-config', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-cfg-'));
    fs.mkdirSync(path.join(tmp, '.cm'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('returns empty object when config missing', () => {
    expect(loadCmConfig(tmp)).toEqual({});
  });

  it('parses browse, guardian, storage, canary and ignores legacy viking config block', () => {
    fs.writeFileSync(
      path.join(tmp, '.cm', 'config.yaml'),
      [
        'storage:',
        '  backend: sqlite',
        '  viking:',
        '    host: 10.0.0.2',
        '    port: 1999',
        '    workspace: app',
        '    timeout: 5000',
        'browse:',
        '  port: 18080',
        '  host: 0.0.0.0',
        'guardian:',
        '  whitelist_prefixes:',
        '    - pnpm run build',
        '  freeze_roots: [src, test]',
        'canary:',
        '  browse_port: 18080',
      ].join('\n'),
      'utf8'
    );
    const c = loadCmConfig(tmp);
    expect(c.storage?.backend).toBe('sqlite');
    expect(c.storage && 'viking' in c.storage).toBe(false);
    expect(c.browse?.port).toBe(18080);
    expect(c.browse?.host).toBe('0.0.0.0');
    expect(c.guardian?.whitelist_prefixes).toEqual(['pnpm run build']);
    expect(c.guardian?.freeze_roots).toEqual(['src', 'test']);
    expect(c.canary?.browse_port).toBe(18080);
  });

  it('returns {} on invalid YAML', () => {
    fs.writeFileSync(path.join(tmp, '.cm', 'config.yaml'), 'bad: [[[', 'utf8');
    expect(loadCmConfig(tmp)).toEqual({});
  });
});
