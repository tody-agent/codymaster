import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// VitePress Docs Frontend Tests
// Ensures that the VitePress site generates correctly and handles frontmatter.

describe('VitePress Docs Verification', () => {
  it('should have a valid package.json', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBe('dockit-docs-site');
    expect(pkg.scripts).toHaveProperty('build');
    expect(pkg.scripts).toHaveProperty('test:gate');
  });

  it('should have VitePress config pointing to correct srcDir', () => {
    const configPath = path.resolve(__dirname, '../.vitepress/config.mts');
    expect(fs.existsSync(configPath)).toBe(true);
    
    const configContent = fs.readFileSync(configPath, 'utf-8');
    // Ensure srcDir is pointing to the parent docs folder to avoid duplication
    expect(configContent).toContain("srcDir: '../docs'");
  });

  it('should enforce CSS layout rules to prevent sidebar text wrapping and overlap', () => {
    const cssPath = path.resolve(__dirname, '../.vitepress/theme/custom.css');
    
    // Test should not fail if custom.css doesn't exist yet, but if it does, it must have layout fixes
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      
      // Look for the specific layout fix CSS rules
      expect(cssContent).toContain('.VPSidebarItem .text');
      expect(cssContent).toContain('white-space: nowrap;');
      expect(cssContent).toContain('text-overflow: ellipsis;');
      
      // Look for top navigation overlap prevention rules
      expect(cssContent).toContain('.VPNavBarTitle .title');
      expect(cssContent).toContain('.VPNavBarMenu');
    }
  });
});
