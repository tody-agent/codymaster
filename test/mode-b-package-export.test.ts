import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Mode B package API', () => {
  it('exports the orchestration module for installed harness integrations', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

    expect(pkg.exports['./mode-b']).toBe('./dist/mode-b-orchestrator.js');
  });
});
