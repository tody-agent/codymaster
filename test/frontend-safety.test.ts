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

test('landing pages do not contain catastrophic syntax corruption', () => {
  const publicDir = 'public';
  const htmlFiles = readdirSync(publicDir).filter(f => f.endsWith('.html'));
  
  for (const file of htmlFiles) {
    const content = readFileSync(path.join(publicDir, file), 'utf-8');
    
    // HTML structure integrity
    expect(content, `${file} contains invalid opening tag`).not.toMatch(/<\s+[a-zA-Z]/); // e.g., "< div"
    expect(content, `${file} contains invalid closing tag`).not.toMatch(/<\/\s+[a-zA-Z]/); // e.g., "</ div"
    expect(content, `${file} contains invalid comment format`).not.toMatch(/--\s+>/); // e.g., "text-- >"
  }
});
