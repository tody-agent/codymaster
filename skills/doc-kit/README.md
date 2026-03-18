# 📚 Doc-Kit for Google Antigravity

[![Documentation Generator](https://img.shields.io/badge/Documentation-Generator-blueviolet?style=for-the-badge)](https://github.com/your-repo/doc-kit)
[![Format Docusaurus](https://img.shields.io/badge/Format-Docusaurus-2ca5e0?style=for-the-badge&logo=docusaurus)](https://docusaurus.io/)
[![Format Markdown](https://img.shields.io/badge/Format-Markdown-black?style=for-the-badge&logo=markdown)](https://en.wikipedia.org/wiki/Markdown)

A professional documentation generation toolkit built for **Google Antigravity**. Skip the manual documentation effort and instantly turn your codebase into beautiful, structured, and deployable documentation.

---

## 🚀 The Problem We Solve

Writing documentation is tedious. Keeping it updated is even harder.
**Doc-Kit** empowers your AI agent to independently read your code, trace logic, map architectures, and write documentation that developers and end-users will actually love to read.

## ✨ Core Features

*   **🧠 Deep Codebase Analysis:** Traces real code paths, not just file names.
*   **📐 Technical Documentation:** Generates System Architecture, Data Flows, and Database Schemas with dark-mode Mermaids.
*   **📋 SOP User Guides:** Creates step-by-step Standard Operating Procedures (SOPs) for non-technical users.
*   **🔌 API Reference:** Automatically extracts endpoints, request/response schemas, and builds cURL/JS examples.
*   **🎨 Dual Output Formats:**
    *   **Markdown:** Clean, portable `.md` files structured perfectly for any repo.
    *   **Docusaurus:** Instantly scaffolds a fully-featured, dark-mode static site ready to deploy.

## 🛠 Installation

Simply copy the `doc-kit` folder into your Antigravity skills directory:

```bash
cp -r doc-kit ~/.gemini/antigravity/skills/
```

Make sure the CLI script is executable:

```bash
chmod +x ~/.gemini/antigravity/skills/doc-kit/scripts/doc-gen.sh
```

## 💻 Quick Start

### The Interactive CLI

To get the best results effortlessly, use the built-in CLI menu:

```bash
bash ~/.gemini/antigravity/skills/doc-kit/scripts/doc-gen.sh
```

The CLI will ask you 4 quick questions:
1.  **Document Type:** Technical, SOP, API, or All.
2.  **Output Format:** Plain Markdown or Docusaurus.
3.  **Source Code Path:** Which project do you want to document?
4.  **Language:** English or Vietnamese.

It instantly generates an optimized prompt and copies it to your clipboard. Just paste it into your Google Antigravity session!

### Direct Trigger

Alternatively, simply type in your Antigravity session:

> "Use doc-kit to create documentation for the project at /path/to/my/project"

The agent will prompt you for the required choices.

## 📂 Architecture of Doc-Kit

Doc-Kit is built using specialized sub-skills for maximum depth and accuracy:

```text
skills/doc-kit/
├── SKILL.md                 # Main orchestration agent
├── scripts/
│   └── doc-gen.sh           # Highly interactive CLI
├── skills/
│   ├── analyze-codebase.md  # Semantic analysis
│   ├── tech-docs.md         # System Architecture
│   ├── sop-guide.md         # Step-by-step UX flows
│   └── api-reference.md     # Auto REST/GraphQL extraction
└── workflows/               # Rules for output (Markdown or Docusaurus)
```

## 🛡 Verification Standard

Doc-Kit enforces **zero-tolerance for shallow analysis**:
1.  **Every claim cited:** Documentation cites `(file_path:line_number)`.
2.  **Visual architecture:** Requires minimum 2 dark-theme Mermaid diagrams per technical file.
3.  **No Hand-Waving:** If the AI hasn't traced the code, it explicitly states "Requires further inspection".

---
*Elevate your codebase with documentation that writes itself.*
