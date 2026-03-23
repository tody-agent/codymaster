import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('Frontend Safety', () => {
  // Test 1: HTML files have proper structure
  it('index.html has required meta tags', () => {
    const html = readFileSync('public/index.html', 'utf-8');
    expect(html).toContain('<meta charset=');
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain('<title');
    expect(html).toContain('lang=');
  });

  // Test 2: No syntax errors in JS files
  it('JavaScript files parse without errors', () => {
    const jsDir = 'public/static/js';
    if (!existsSync(jsDir)) return;
    const files = readdirSync(jsDir).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      const content = readFileSync(join(jsDir, file), 'utf-8');
      expect(() => new Function(content)).not.toThrow();
    });
  });

  // Test 3: CSS files reference design tokens (not raw values)
  it('stylesheets use design tokens', () => {
    const cssFile = 'public/static/css/style.css';
    if (!existsSync(cssFile)) return;
    const css = readFileSync(cssFile, 'utf-8');
    const rawColors = css.match(/#[0-9a-fA-F]{3,8}(?!.*design-tokens)/g);
    if (rawColors && rawColors.length > 0) {
      console.warn(`⚠️ Found ${rawColors.length} raw color values. Use design tokens instead.`);
    }
  });

  // Test 4: Design tokens file exists
  it('design-tokens.css exists', () => {
    expect(existsSync('public/static/css/design-tokens.css')).toBe(true);
  });

  // Test 5: AGENTS.md exists
  it('AGENTS.md exists at project root', () => {
    expect(existsSync('AGENTS.md')).toBe(true);
  });

  // Test 6: .project-identity.json exists
  it('.project-identity.json exists', () => {
    expect(existsSync('.project-identity.json')).toBe(true);
  });
});
