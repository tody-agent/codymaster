---
title: "cm-dockit"
description: "Knowledge systematization engine — analyze codebases, generate Personas, JTBD, Process Flows, technical docs, SOP user guides, API references. Output as Markdow"
keywords: ["cm-dockit", "cody master", "ai skill"]
robots: "index, follow"
---

> **📋 Full Skill Source** — This is the complete, unedited SKILL.md file. Nothing is hidden or summarized.

[← Back to Skills Library](./index.md)

# CM DocKit: Knowledge Systematization Engine

A professional knowledge systematization engine powered by codebase analysis and UX design principles. **1 lần đọc source = 1 bộ tri thức hoàn chỉnh** — Personas, JTBD, Process Flows, Technical Docs, SOPs, API Reference. Supports plain Markdown output or a premium VitePress site. Includes SEO optimization, sitemap generation, and AI/LLM-readable content.

## When to Activate

- User asks to "create documentation", "generate docs"
- User mentions "SOP", "user guide", "manual"
- User wants technical docs from a codebase
- User runs `/DocKit Master`

## Document Types

| Type | Skill File | Description |
|------|-----------|-------------|
| **knowledge** | `persona-builder.md` + `jtbd-analyzer.md` + `flow-mapper.md` | Personas, JTBD, Process Flows — knowledge foundation |
| **tech** | `skills/tech-docs.md` | Architecture, database, deployment, data flow |
| **sop** | `skills/sop-guide.md` | Step-by-step user guides (enriched with knowledge) |
| **api** | `skills/api-reference.md` | API endpoint reference with examples |
| **all** | All above | Full knowledge base + documentation suite |

| Support Skill | File | Purpose |
|--------------|------|---------|
| **SEO Checklist** | `skills/seo-checklist.md` | Per-page SEO audit (title, meta, headings, robots) |
| **Content Writing** | `skills/content-writing.md` | SEO copywriting, keywords, active voice, FAQ |
| **LLM Optimization** | `skills/llm-optimization.md` | AI-readable structure, NotebookLM-friendly |

## Output Formats

| Format | Workflow | Description |
|--------|---------|-------------|
| **markdown** | `workflows/export-markdown.md` | Plain `.md` files in `docs/` folder |
| **vitepress** | `workflows/setup-vitepress.md` | Premium VitePress static site (**default**) — built-in Mermaid, search, dark mode |

## Procedure

### Step 1: Gather Input (Single Consolidated Prompt)

**CRITICAL:** Ask ALL questions in ONE message. Do NOT ask one at a time.
Present the following intake form to the user, using this exact format:

---

**📚 DocKit Master — Configuration**

Xin hãy trả lời các câu hỏi sau để tôi tự động lên kế hoạch triển khai:

| # | Câu hỏi | Lựa chọn | Mặc định |
|---|---------|----------|----------|
| 1 | **📑 Loại tài liệu?** | `knowledge` · `tech` · `sop` · `api` · `all` | `all` |
| 2 | **🎨 Định dạng output?** | `markdown` (plain) · `vitepress` (premium site) | `vitepress` |
| 3 | **📂 Phạm vi quét code?** | `full` (toàn bộ project) · `focused` (chỉ 1 thư mục/tính năng cụ thể) | `full` |
| 4 | **🎯 Tập trung vào đâu?** *(chỉ nếu chọn `focused`)* | Tên thư mục, module, hoặc tính năng cụ thể | — |
| 5 | **🌏 Ngôn ngữ viết?** | Tự động detect từ ngôn ngữ chat *(xem bên dưới)* | auto-detect |
| 6 | **🌐 Thêm đa ngôn ngữ?** | `yes` (thêm tiếng Anh + ngôn ngữ gốc) · `no` | `no` |
| 7 | **📹 Quay video demo?** | `yes` (record browser walkthrough) · `no` | `no` |
| 8 | **📁 Đường dẫn project?** | *(đường dẫn tuyệt đối)* | workspace hiện tại |
| 9 | **🔍 SEO tối ưu?** | `yes` (SEO frontmatter + checklist + sitemap) · `no` | `yes` |
| 10 | **🤖 Tối ưu cho AI/LLM?** | `yes` (AI-readable + NotebookLM sitemap) · `no` | `yes` |

*Bạn có thể trả lời ngắn gọn, ví dụ: "all, vitepress, full, yes, no, yes, yes"*

**🌏 Quy tắc ngôn ngữ thông minh:**

1. **Auto-detect**: Xác định ngôn ngữ mặc định từ ngôn ngữ người dùng đang chat
   - User chat tiếng Việt → mặc định `vi`
   - User chat tiếng Trung → mặc định `zh`
   - User chat tiếng Nhật → mặc định `ja`
   - User chat tiếng Anh → mặc định `en`
   - *(Áp dụng tương tự cho mọi ngôn ngữ khác)*
2. **Đa ngôn ngữ (`yes`)**: Tự động thêm tiếng Anh (`en`) làm ngôn ngữ phụ
   - Ví dụ: user Việt + đa ngôn ngữ → `vi` + `en`
   - Ví dụ: user Trung + đa ngôn ngữ → `zh` + `en`
   - Nếu user đã chat tiếng Anh + đa ngôn ngữ → hỏi thêm muốn ngôn ngữ phụ nào
3. **Override**: User có thể ghi đè bằng cách chỉ định rõ, ví dụ: "viết bằng tiếng Nhật"

---

### Step 1b: Auto-Generate Execution Plan

After receiving answers, **immediately create an execution plan** (do NOT ask more questions).

Map the answers to this execution config:

```
DOC_TYPE     = [knowledge | tech | sop | api | all]
FORMAT       = [markdown | vitepress]
SCOPE        = [full | focused]
FOCUS_TARGET = [directory/module name if focused, else null]
LANGUAGE     = [vi | en | vi+en]
I18N         = [yes | no] (only relevant for vitepress)
RECORD       = [yes | no]
PROJECT_PATH = [absolute path]
SEO          = [yes | no] (default: yes)
LLM_OPTIMIZE = [yes | no] (default: yes)
```

Then present the plan to user as a checklist artifact, like:

```markdown
## 🚀 Kế hoạch triển khai

- [ ] Quét code: [full/focused → target]
- [ ] Tạo tài liệu: [type] bằng [language]
- [ ] Xuất format: [markdown/vitepress]
- [ ] [If vitepress + i18n] Cấu hình đa ngôn ngữ
- [ ] [If record] Quay video walkthrough
- [ ] [If seo] Chạy SEO checklist + tạo sitemap
- [ ] [If llm_optimize] Áp dụng LLM optimization rules
- [ ] Kiểm tra và bàn giao
```

**After presenting the plan → proceed to Step 2 immediately (auto-execute).**
Do NOT wait for approval unless the plan has ambiguity.

### Step 2: Analyze Codebase

Read and follow `skills/analyze-codebase.md` in this directory.

Output: structured analysis saved to `docs/analysis.md` (NOT `_analysis.md`) including:
- Project type, languages, frameworks
- Directory structure and architecture layers
- Entry points, routes, database schema
- Key business logic modules
- Dependencies overview
- Test coverage

### Step 3: Apply Content Guidelines

**MANDATORY** — Read `skills/content-guidelines.md` before generating any content.

Key rules to enforce:
- **Filenames**: kebab-case, no underscores, no dots
- **Frontmatter**: Every `.md` file must have `title`, `description`, `keywords`, `robots`
- **Quick Reference**: Every doc starts with a summary box
- **Progressive Disclosure**: Use `&lt;details&gt;` for advanced content
- **Admonitions**: Use `:::tip`, `:::info`, `:::warning`, `:::danger` for callouts
- **Mermaid**: NO hardcoded colors — VitePress auto-adapts to light/dark
- **Code Groups**: Use `:::code-group` for multi-platform examples
- **Internal Links**: ≥2 cross-links per page

### Step 3b: Apply SEO & LLM Guidelines (If enabled)

**If SEO = yes:** Read `skills/content-writing.md` for:
- Keyword placement (title, H1, first paragraph, H2s, meta)
- Inverted pyramid structure (answer first, details later)
- Active voice (≥80%), transition words (≥30%)
- FAQ in schema-ready format for rich snippets

**If LLM_OPTIMIZE = yes:** Read `skills/llm-optimization.md` for:
- Clean heading hierarchy (no skipped levels)
- Text descriptions alongside all Mermaid diagrams
- Self-contained sections (≤500 words per H2)
- Consistent terminology (glossary section in index)
- UTF-8 clean output

### Step 4: Generate Documents

Based on the chosen type, read and follow the corresponding skill file:

- **knowledge** → Run 3 skills sequentially:
  1. Read `skills/persona-builder.md` → `docs/personas/` (Buyer & User Personas)
  2. Read `skills/jtbd-analyzer.md` → `docs/jtbd/` (JTBD Canvases)
  3. Read `skills/flow-mapper.md` → `docs/flows/` (Workflow, Sequence, Lifecycle, Journey)

- **tech** → Read `skills/tech-docs.md`, generate:
  - `docs/architecture.md` — System architecture + ADR
  - `docs/database.md` — Database schema & data model
  - `docs/deployment.md` — Deployment & infrastructure
  - `docs/data-flow.md` — Data flow diagrams

- **sop** → **Auto-run `knowledge` first if not yet generated**, then:
  - Read `skills/sop-guide.md`, generate:
  - `docs/sop/` — One `.md` per feature/module
  - Each file: Persona Context → Process Flow → Steps → Journey → Troubleshooting → FAQ

- **api** → Read `skills/api-reference.md`, generate:
  - `docs/api/` — Organized by resource
  - Each file: Quick Ref → Endpoints table → Multi-language examples

- **all** → Run `knowledge` → `tech` → `sop` → `api` sequentially

### Step 5: Export

Based on the chosen format, read and follow the corresponding workflow:

- **markdown** → Read `workflows/export-markdown.md`
  - Create `docs/README.md` as index
  - Organize into clean folder structure

- **vitepress** → Read `workflows/setup-vitepress.md`
  - Scaffold VitePress with premium template
  - Auto-sidebar from folder structure
  - Built-in Mermaid, search, dark mode
  - Build and verify

### Step 5b: Generate Sitemap (If SEO = yes)

Read and follow `workflows/generate-sitemap.md`:

- **VitePress**: Sitemap auto-generated via `sitemap` config option. Generate `robots.txt`, extract `sitemap-urls.txt`
- **Markdown**: Generate `docs/sitemap.md` (link index) + `docs/sitemap-urls.txt`
- Both formats produce a **NotebookLM-ready URL list** for AI research

### Step 5c: Run SEO Audit (If SEO = yes)

Read `skills/seo-checklist.md` and audit every generated page:
- Title (50–60 chars, keyword) ✔️
- Meta description (150–160 chars) ✔️
- Single H1, no skipped levels ✔️
- ≥2 internal links ✔️
- Robots directive set ✔️
- All images have alt text ✔️

### Step 6: Summary

Present to user:
- List of generated files with sizes
- How to view/serve the docs
- Next steps (customize, deploy, etc.)

**If generated docs > 30 files**, also suggest:

```markdown
💡 **Pro Tip: Deep Search**

Bộ tài liệu vừa tạo có [X] files. Bạn có thể index chúng bằng
[qmd](https://github.com/tobi/qmd) để AI tra cứu ngữ nghĩa nhanh
trong mọi session tương lai:

\`\`\`bash
npm install -g @tobilu/qmd
qmd collection add ./docs --name project-docs
qmd context add qmd://project-docs "Tài liệu dự án [tên dự án]"
qmd embed
\`\`\`

Xem thêm: `cm-deep-search` skill.
```

## CLI Quick Start

For a fast interactive experience, users can run:

```bash
bash ~/.gemini/antigravity/skills/"DocKit Master"/scripts/doc-gen.sh
```

## UX Principles Applied

| UX Law | Application |
|--------|-------------|
| **Hick's Law** | ≤7 TOC items, progressive disclosure for advanced content |
| **Miller's Law** | Information chunked into groups of 5-9 |
| **Doherty Threshold** | Tables for structured data, scannable summaries |
| **Jakob's Law** | Standard doc layout (sidebar + content + TOC) |
| **Fitts's Law** | Touch-friendly navbar links (≥44px) |
| **WCAG 2.1 AA** | Focus-visible rings, high contrast, reduced motion |

## Constraints

- All Mermaid diagrams use NO hardcoded inline styles — VitePress theming handles light/dark
- Every technical claim cites `(file_path:line_number)`
- SOP docs use `&lt;details&gt;` for troubleshooting (progressive disclosure)
- All generated files include YAML frontmatter with `title`, `description`
- **Pure Markdown** — no MDX, no special escaping needed
- **No underscore-prefixed filenames** — breaks auto-sidebar detection
- VitePress output must pass `npx vitepress build` without errors
- **SEO default**: `robots: "index, follow"` unless page is internal/draft
- **≥2 internal links** per page (never orphan pages)
- **Text fallback** for every Mermaid diagram (LLM readability)
- **Self-contained sections** — each H2 makes sense read alone
- `sitemap-urls.txt` generated for NotebookLM import

## CM DocKit Development Rules

If you are an AI agent asked to modify or upgrade this skill (CM DocKit):
1. **Test Gate Enforcement**: You MUST run the backend test suite located in `~/.gemini/antigravity/skills/cm-dockit` by executing `$ npm run test:gate` or `$ vitest`. Do NOT claim "task completed" unless tests pass.
2. **Boilerplate Integrity**: If modifying `templates/vitepress-premium`, ensure the frontend test suite (`tests/frontend.test.ts`) still works.
3. **No Direct Copying**: Never hardcode file-copy commands that copy `[project_root]/docs/` content into `docs-site/`. Always rely on `srcDir: '../docs'` in `config.mts`.
