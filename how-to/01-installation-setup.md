# Installation & Setup

> Complete guide to installing CodyMaster, configuring your environment, and connecting your first AI agent. This guide covers all supported platforms and integration options.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Environment Configuration](#environment-configuration)
4. [Project Setup](#project-setup)
5. [AI Agent Integration](#ai-agent-integration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | v18.0+ | v20.x LTS |
| **npm** | v9.0+ | v10.x |
| **Git** | v2.30+ | Latest |
| **OS** | macOS, Linux, Windows (WSL2) | macOS/Linux |

### Optional Dependencies

| Tool | Purpose | When to Install |
|------|---------|-----------------|
| **Python 3.10+** | Content factory scripts | Content creation workflows |
| **Playwright** | Browser automation | UI testing and preview |
| **Docker** | Isolated environments | Security-sensitive projects |

### Account Requirements

- **GitHub account** — For repository access and CI/CD
- **Cloudflare account** — For deployment (optional)
- **Supabase/Neon account** — For database (optional)

---

## Installation Methods

### Method 1: Global Install (Recommended)

```bash
# Install CodyMaster globally
npm install -g codymaster

# Verify installation
cm --version

# Initialize configuration
cm init
```

### Method 2: Project-Level Install

```bash
# Navigate to your project
cd your-project

# Install as dev dependency
npm install --save-dev codymaster

# Add to package.json scripts
npm pkg set scripts.cm="cm"

# Run via npm
npm run cm -- --version
```

### Method 3: One-Line Install Script

```bash
# Download and run install script
curl -fsSL https://raw.githubusercontent.com/codymaster/codymaster/main/install.sh | bash

# The script will:
# 1. Check system requirements
# 2. Install Node.js if missing
# 3. Install CodyMaster globally
# 4. Run initial configuration wizard
```

### Method 4: Development Install (Contributors)

```bash
# Clone the repository
git clone https://github.com/codymaster/codymaster.git
cd codymaster

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link

# Verify
cm --version
```

---

## Environment Configuration

### Step 1: Run Configuration Wizard

```bash
# Interactive wizard (recommended for first-time setup)
cm config wizard

# The wizard will prompt for:
# 1. Project name and type
# 2. GitHub credentials
# 3. Cloudflare account (optional)
# 4. Supabase/Neon database (optional)
# 5. AI agent preferences
# 6. Quality gate settings
```

### Step 2: Manual Configuration

If you prefer manual setup, create `.cm/config.yaml`:

```yaml
# .cm/config.yaml
project:
  name: "my-project"
  type: "nextjs"  # nextjs, astro, react, vue, node, python
  
identity:
  github:
    enabled: true
    default_branch: "main"
  cloudflare:
    enabled: false
    account_id: ""
  supabase:
    enabled: false
    project_ref: ""

quality:
  gates:
    secrets: true
    tests: true
    build: true
    lint: true
  auto_fix: true

skills:
  auto_load: true
  max_concurrent: 3
  
memory:
  enabled: true
  nli: true
  backup: true
```

### Step 3: Environment Variables

Create `.env.local` (not committed to git):

```bash
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_DEFAULT_ORG=your-org

# Cloudflare (if using)
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxx

# Supabase (if using)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Provider (choose one)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
GEMINI_API_KEY=xxxxxxxxxxxxx
```

### Step 4: Git Hooks Setup

```bash
# Install pre-commit hooks
cm hooks install

# This sets up:
# - Secret scanning before commits
# - Code quality checks
# - Automatic formatting
# - Commit message validation
```

---

## Project Setup

### New Project from Scratch

```bash
# Bootstrap a new project with all best practices
cm project bootstrap

# The wizard will:
# 1. Ask for project name and type
# 2. Create project structure
# 3. Set up design system (if UI project)
# 4. Configure CI/CD pipelines
# 5. Set up testing infrastructure
# 6. Initialize i18n (multi-language support)
# 7. Create AGENTS.md manifest
# 8. Set up quality gates
```

### Existing Project Integration

```bash
# Add CodyMaster to existing project
cd your-existing-project

# Initialize CodyMaster
cm init

# Generate codebase analysis
cm index skeleton

# Create initial continuity file
cm continuity init

# Verify everything works
cm doctor
```

### Project Structure

After setup, your project will have:

```
your-project/
├── .cm/
│   ├── config.yaml          # Project configuration
│   ├── CONTINUITY.md        # Working memory
│   ├── skeleton.md          # Codebase overview
│   ├── context-bus.json     # Pipeline state
│   └── sprint/              # Sprint artifacts
├── openspec/                # Design documents
│   └── changes/             # Feature specifications
├── agents/                  # Agent personas
│   ├── architect.md
│   ├── engineer.md
│   ├── reviewer.md
│   ├── security.md
│   └── pm.md
├── src/                     # Source code
├── test/                    # Tests
├── docs/                    # Documentation
├── AGENTS.md                # Agent manifest
├── GEMINI.md                # Gemini instructions
└── package.json
```

---

## AI Agent Integration

### Claude Desktop

```bash
# Get MCP configuration
cm mcp-serve --print-config

# Copy the "Claude Desktop config" block into:
# ~/Library/Application Support/Claude/claude_desktop_config.json
```

Example config:

```json
{
  "mcpServers": {
    "codymaster": {
      "command": "cm",
      "args": ["mcp-serve", "--project", "/path/to/your/project"]
    }
  }
}
```

### Goose

```bash
# Get MCP configuration
cm mcp-serve --print-config

# Copy the "Goose config" block into:
# ~/.config/goose/config.yaml
```

Example config:

```yaml
extensions:
  codymaster:
    cmd: cm
    args:
      - mcp-serve
      - --project
      - /path/to/your/project
```

### Cursor

```bash
# Get MCP configuration
cm mcp-serve --print-config

# Copy the JSON config into:
# .cursor/mcp.json (project-level)
# or ~/.cursor/mcp.json (global)
```

### VS Code with Continue

```json
// .continue/config.json
{
  "mcpServers": [
    {
      "name": "codymaster",
      "command": "cm",
      "args": ["mcp-serve", "--project", "${workspaceFolder}"]
    }
  ]
}
```

### Manual MCP Connection

```bash
# Start MCP server for any stdio client
cm mcp-serve --project /path/to/your/project

# The server exposes 15 MCP tools:
# - cm_memory_read/write/search
# - cm_context_get/advance
# - cm_budget_check
# - cm_skill_resolve
# - cm_natural (plain English memory)
# - And more...
```

---

## Verification

### Run Doctor Check

```bash
# Comprehensive system check
cm doctor

# Output:
# ✅ Node.js v20.10.0
# ✅ npm v10.2.3
# ✅ Git v2.42.0
# ✅ CodyMaster v5.1.0
# ✅ Configuration valid
# ✅ Git hooks installed
# ✅ MCP server ready
# ✅ Quality gates configured
```

### Test Memory System

```bash
# Write a test memory
cm_natural("remember that this is a test project")

# Read it back
cm_natural("what is this project about?")

# Should return your memory
```

### Test Quality Gates

```bash
# Run a quick gate check
npm run test:gate:kit

# Should pass (or show what needs fixing)
```

### Test MCP Connection

```bash
# Start MCP server
cm mcp-serve --project .

# In another terminal, test with any MCP client
# Or use the built-in test
cm mcp-test
```

---

## Troubleshooting

### Common Issues

#### "cm: command not found"

```bash
# Check if npm global bin is in PATH
npm config get prefix

# Add to PATH (macOS/Linux)
export PATH="$(npm config get prefix)/bin:$PATH"

# Or reinstall with sudo (if needed)
sudo npm install -g codymaster
```

#### "Configuration file not found"

```bash
# Initialize configuration
cm init

# Or run the wizard
cm config wizard
```

#### "MCP server failed to start"

```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
kill -9 $(lsof -t -i :3000)

# Try again
cm mcp-serve --project .
```

#### "Git hooks not working"

```bash
# Reinstall hooks
cm hooks install

# Verify hooks are executable
ls -la .git/hooks/

# Should see:
# pre-commit
# commit-msg
# pre-push
```

#### "Quality gate failing"

```bash
# Run with verbose output
cm gate --verbose

# Check specific gate
npm run gate:secrets
npm run gate:lint
npm run gate:tests
```

### Getting Help

```bash
# Check CodyMaster status
cm status

# View recent logs
cm logs --tail 50

# Get system info for support
cm system-info > support-info.txt

# Open GitHub issues
# https://github.com/codymaster/codymaster/issues
```

### Reset Configuration

```bash
# Backup current config
cp -r .cm .cm.backup

# Reset to defaults
cm config reset

# Or completely reinitialize
cm init --force
```

---

## Next Steps

- [Your First Project](./02-first-project.md) — Bootstrap a complete project
- [Vibe Coding Daily Loop](./03-vibe-coding-loop.md) — Learn the daily rhythm
- [MCP Integration](./14-mcp-integration.md) — Advanced agent connections
- [Troubleshooting Guide](./troubleshooting.md) — Detailed problem resolution
