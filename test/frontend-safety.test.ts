import { parse } from 'acorn';
import { readFileSync, readdirSync } from 'fs';
import { test, expect } from 'vitest';
import path from 'path';
import { JSDOM } from 'jsdom';

test('JS files have valid syntax', () => {
  const jsDir = 'public/js';
  const files = readdirSync(jsDir).filter(f => f.endsWith('.js'));
  
  for (const file of files) {
    const code = readFileSync(path.join(jsDir, file), 'utf-8');
    expect(() => parse(code, { ecmaVersion: 2022, sourceType: 'script' })).not.toThrow();
  }
});

test('index.html parses successfully into JSDOM', () => {
  const html = readFileSync('public/index.html', 'utf-8');
  expect(() => new JSDOM(html)).not.toThrow();
  
  const dom = new JSDOM(html);
  // Basic sanity check: language switcher exists
  const langMenu = dom.window.document.getElementById('lang-menu');
  expect(langMenu).not.toBeNull();
});
