#!/usr/bin/env python3
"""
Scaffold — Project scaffolding for content factory.

Creates a complete Astro-based content website from config.
Supports Cloudflare Pages, GitHub Pages, and Netlify deployment.

Usage:
    python3 scaffold.py --config content-factory.config.json
    python3 scaffold.py --config content-factory.config.json --dry-run
    python3 scaffold.py --config content-factory.config.json --deploy-only
"""

import json
import sys
import os
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = SCRIPT_DIR.parent / "templates"


class Scaffold:
    """Project scaffolding engine."""

    def __init__(self, config_path: str, dry_run: bool = False):
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)
        self.project_root = Path(config_path).resolve().parent
        self.dry_run = dry_run
        self.brand = self.config.get("brand", {})
        self.deploy_target = self.config.get("deploy", {}).get("target", "none")

    def scaffold_website(self):
        """Create a full Astro website from template."""
        print(f"  🏗️ Scaffolding Astro website...")
        print(f"     Brand: {self.brand.get('name', 'Unknown')}")
        print(f"     Deploy: {self.deploy_target}")

        if self.dry_run:
            print(f"  ⏭️ DRY RUN — no files created")
            self._print_plan()
            return

        # 1. Create directory structure
        self._create_dirs()

        # 2. Generate package.json
        self._create_package_json()

        # 3. Generate astro.config.mjs
        self._create_astro_config()

        # 4. Generate base layout
        self._create_layouts()

        # 5. Generate pages
        self._create_pages()

        # 6. Generate components
        self._create_components()

        # 7. Generate styles
        self._create_styles()

        # 8. Generate deploy configs
        self._create_deploy_config()

        # 9. Generate static files
        self._create_static_files()

        print(f"\n  🎉 Website scaffolded!")
        print(f"  Next: cd {self.project_root} && npm install && npm run dev")

    def setup_deploy(self):
        """Setup deployment configuration only."""
        self._create_deploy_config()
        print(f"  ✅ Deploy config created for: {self.deploy_target}")

    def _print_plan(self):
        print(f"\n  Would create:")
        dirs = ["src/layouts", "src/pages/blog", "src/components", "src/styles", "public", "content/blog"]
        for d in dirs:
            print(f"    📁 {d}/")
        files = ["package.json", "astro.config.mjs", "src/layouts/Base.astro",
                 "src/pages/index.astro", "src/pages/blog/index.astro",
                 "src/pages/blog/[slug].astro", "src/styles/global.css"]
        for f in files:
            print(f"    📄 {f}")

    def _create_dirs(self):
        for d in ["src/layouts", "src/pages/blog", "src/components", "src/styles",
                   "public", "content/blog", "knowledge", "topics-queue"]:
            (self.project_root / d).mkdir(parents=True, exist_ok=True)

    def _create_package_json(self):
        slug = self.brand.get("name", "site").lower().replace(" ", "-")
        pkg = {
            "name": slug,
            "type": "module",
            "version": "1.0.0",
            "scripts": {
                "dev": "astro dev",
                "build": "astro build",
                "preview": "astro preview"
            },
            "dependencies": {
                "astro": "^5.0.0",
                "@astrojs/sitemap": "^3.0.0"
            }
        }
        self._write_json(self.project_root / "package.json", pkg)

    def _create_astro_config(self):
        site_url = f"https://{self.brand.get('name', 'site').lower().replace(' ', '-')}.pages.dev"
        content = f"""import {{ defineConfig }} from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({{
  site: '{site_url}',
  integrations: [sitemap()],
  output: 'static',
  build: {{ assets: 'assets' }}
}});
"""
        self._write_file(self.project_root / "astro.config.mjs", content)

    def _create_layouts(self):
        name = self.brand.get("name", "My Site")
        colors = self.brand.get("colors", {})
        primary = colors.get("primary", "#1A1A2E")
        secondary = colors.get("secondary", "#E94560")
        accent = colors.get("accent", "#F5F5F5")

        layout = f"""---
interface Props {{ title: string; description?: string; }}
const {{ title, description = "{name}" }} = Astro.props;
---
<!DOCTYPE html>
<html lang="{self.brand.get('language', 'en')}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content={{description}} />
  
  <!-- PageSpeed: Preconnect & Font Preload -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" as="style" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  
  <title>{{title}} — {name}</title>

  <!-- PageSpeed: Inline Critical CSS -->
  <style is:inline>
    :root {{
      --color-primary: {primary};
      --color-secondary: {secondary};
      --color-accent: {accent};
      --color-bg: #ffffff;
      --color-text: #1a1a1a;
      --font-body: 'Inter', system-ui, sans-serif;
      --header-height: 64px;
    }}
    *,*::before,*::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    html {{ scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }}
    body {{ font-family: var(--font-body); background: var(--color-bg); color: var(--color-text); line-height: 1.6; min-height: 100vh; }}
    .container {{ max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }}
    .header {{ position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid #eee; z-index: 100; }}
  </style>

  <style is:global>
    @import '../styles/global.css';
  </style>
</head>
<body>
  <header class="header">
    <div class="container" style="height: var(--header-height); display: flex; justify-content: space-between; align-items: center;">
      <a href="/" style="font-weight: 700; font-size: 1.2rem; color: var(--color-primary);">{name}</a>
      <nav>
        <a href="/blog" style="margin-left: 1.5rem; font-weight: 500;">Blog</a>
        <a href="/about" style="margin-left: 1.5rem; font-weight: 500;">About</a>
      </nav>
    </div>
  </header>
  <main class="container" style="padding: 2rem 1.5rem;">
    <slot />
  </main>
  <footer style="background: #111; color: #ccc; text-align: center; padding: 3rem 1rem; margin-top: 4rem;">
    <div class="container">
      <p style="margin-bottom: 0.5rem; font-weight: 600; color: white;">{name}</p>
      <p style="font-size: 0.85rem;">&copy; {{new Date().getFullYear()}} All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
"""
        self._write_file(self.project_root / "src/layouts/Base.astro", layout)

    def _create_pages(self):
        name = self.brand.get("name", "My Site")
        slogan = self.brand.get("slogan", "")

        # Index page
        index = f"""---
import Base from '../layouts/Base.astro';
---
<Base title="Home">
  <section style="text-align: center; padding: 4rem 1rem;">
    <h1 style="font-size: 2.5rem; color: var(--color-primary);">
      {name}
    </h1>
    <p style="font-size: 1.3rem; color: #555; margin-top: 1rem;">
      {slogan}
    </p>
    <a href="/blog" style="display: inline-block; margin-top: 2rem; background: var(--color-primary); color: white; padding: 0.8rem 2rem; border-radius: 8px; font-weight: 600;">
      Read Our Blog →
    </a>
  </section>
</Base>
"""
        self._write_file(self.project_root / "src/pages/index.astro", index)

        # Blog listing
        blog_list = """---
import Base from '../../layouts/Base.astro';
import fs from 'node:fs';
import path from 'node:path';

const contentDir = path.join(process.cwd(), 'content/blog');
let articles = [];

if (fs.existsSync(contentDir)) {
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  articles = files.map(f => {
    const content = fs.readFileSync(path.join(contentDir, f), 'utf-8');
    const fmMatch = content.match(/^---\\n([\\s\\S]*?)\\n---/);
    const fm = {};
    if (fmMatch) {
      fmMatch[1].split('\\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) fm[key.trim()] = val.join(':').trim().replace(/^["']|["']$/g, '');
      });
    }
    return { slug: f.replace('.md', ''), ...fm };
  }).sort((a, b) => (b.pubDate || '').localeCompare(a.pubDate || ''));
}
---
<Base title="Blog">
  <h1 style="font-size: 2rem; margin-bottom: 2rem;">📚 Blog</h1>
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
    {articles.map(a => (
      <a href={`/blog/${a.slug}`} style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s; display: block;">
        <h2 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 0.5rem;">{a.title || a.slug}</h2>
        <p style="color: #666; font-size: 0.9rem;">{a.description || ''}</p>
        <span style="color: var(--color-secondary); font-size: 0.8rem; margin-top: 0.5rem; display: block;">{a.category || ''}</span>
      </a>
    ))}
  </div>
  {articles.length === 0 && <p style="color: #888;">No articles yet. Run <code>/write-batch</code> to generate content!</p>}
</Base>
"""
        self._write_file(self.project_root / "src/pages/blog/index.astro", blog_list)

        # Article detail
        article_detail = """---
import Base from '../../layouts/Base.astro';
import fs from 'node:fs';
import path from 'node:path';

export function getStaticPaths() {
  const contentDir = path.join(process.cwd(), 'content/blog');
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  return files.map(f => ({ params: { slug: f.replace('.md', '') } }));
}

const { slug } = Astro.params;
const filePath = path.join(process.cwd(), 'content/blog', `${slug}.md`);
const raw = fs.readFileSync(filePath, 'utf-8');

const fmMatch = raw.match(/^---\\n([\\s\\S]*?)\\n---/);
const fm = {};
if (fmMatch) {
  fmMatch[1].split('\\n').forEach(line => {
    const [key, ...val] = line.split(':');
    if (key && val.length) fm[key.trim()] = val.join(':').trim().replace(/^["']|["']$/g, '');
  });
}
const body = raw.replace(/^---[\\s\\S]*?---\\n/, '');
---
<Base title={fm.title || slug} description={fm.description}>
  <article style="max-width: 720px; margin: 0 auto;">
    <a href="/blog" style="color: var(--color-secondary); font-size: 0.85rem;">← Back to Blog</a>
    <h1 style="font-size: 2rem; margin: 1rem 0; color: var(--color-primary);">{fm.title || slug}</h1>
    {fm.description && <p style="color: #666; font-size: 1.1rem; margin-bottom: 2rem;">{fm.description}</p>}
    <div class="article-body" set:html={body} />
  </article>
</Base>
<style>
  .article-body { font-size: 1.05rem; }
  .article-body h2 { font-size: 1.4rem; margin: 2rem 0 1rem; color: var(--color-primary); }
  .article-body h3 { font-size: 1.15rem; margin: 1.5rem 0 0.75rem; }
  .article-body p { margin-bottom: 1rem; }
  .article-body ul, .article-body ol { margin: 1rem 0; padding-left: 1.5rem; }
  .article-body li { margin-bottom: 0.5rem; }
  .article-body blockquote { border-left: 3px solid var(--color-secondary); padding: 1rem; margin: 1rem 0; background: #f9f9f9; border-radius: 4px; }
</style>
"""
        self._write_file(self.project_root / "src/pages/blog/[slug].astro", article_detail)

        # About page
        about = f"""---
import Base from '../layouts/Base.astro';
---
<Base title="About">
  <div style="max-width: 720px; margin: 0 auto;">
    <h1>About {name}</h1>
    <p style="margin-top: 1rem; font-size: 1.1rem; color: #555;">
      {slogan}
    </p>
    <p style="margin-top: 1rem;">
      This website is powered by the AI Content Factory — a self-learning content engine
      that gets smarter with every article.
    </p>
  </div>
</Base>
"""
        self._write_file(self.project_root / "src/pages/about.astro", about)

    def _create_components(self):
        pass  # Components are inline in the pages for simplicity

    def _create_styles(self):
        css = """/* Content Factory — Generated Global Styles */
:root {
  --color-text-muted: #555555; /* WCAG AA on white */
  --color-text-dim: #767676;   /* WCAG AA on white */
}

.article-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

@media (max-width: 768px) {
  body { font-size: 16px; } /* Prevent zooming on input focus in mobile */
  h1 { font-size: 1.8rem; }
}

/* Accessibility: Focus visible */
:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
"""
        self._write_file(self.project_root / "src/styles/global.css", css)

    def _create_deploy_config(self):
        slug = self.brand.get("name", "site").lower().replace(" ", "-")

        if self.deploy_target == "cloudflare":
            self._write_file(self.project_root / "wrangler.toml", f"""name = "{slug}"
compatibility_date = "2025-01-01"
pages_build_output_dir = "dist"

[build]
command = "npm run build"
""")
            print(f"  ✅ wrangler.toml created")

        elif self.deploy_target == "github":
            gh_dir = self.project_root / ".github" / "workflows"
            gh_dir.mkdir(parents=True, exist_ok=True)
            self._write_file(gh_dir / "deploy.yml", f"""name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
""")
            print(f"  ✅ GitHub Actions deploy.yml created")

        elif self.deploy_target == "netlify":
            self._write_file(self.project_root / "netlify.toml", f"""[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
""")
            print(f"  ✅ netlify.toml created")

    def _create_static_files(self):
        slug = self.brand.get("name", "site").lower().replace(" ", "-")
        
        # Robots.txt
        self._write_file(self.project_root / "public/robots.txt",
                         f"User-agent: *\nAllow: /\n\nSitemap: https://{slug}.pages.dev/sitemap-index.xml\n")
        
        # Cloudflare _headers (Security & Cache)
        headers = """/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
"""
        self._write_file(self.project_root / "public/_headers", headers)
        print(f"  ✅ public/_headers created (Security + Cache)")

    def _write_file(self, path: Path, content: str):
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    def _write_json(self, path: Path, data: dict):
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Scaffold — Website Generator")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--dry-run", action="store_true", help="Preview without creating files")
    parser.add_argument("--deploy-only", action="store_true", help="Only create deploy config")
    args = parser.parse_args()

    scaffold = Scaffold(args.config, dry_run=args.dry_run)

    if args.deploy_only:
        scaffold.setup_deploy()
    else:
        scaffold.scaffold_website()


if __name__ == "__main__":
    main()
