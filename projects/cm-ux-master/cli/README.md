# UX-Master CLI

Ultimate UX Design Intelligence - CLI tool with 48 UX Laws, 37 Design Tests, and MCP integrations.

## Installation

### From PyPI (Recommended)

```bash
pip install uxmaster
```

### From Homebrew (macOS/Linux)

```bash
brew install uxmaster
```

### Development Installation

```bash
cd cli
pip install -e ".[dev]"
```

## Quick Start

```bash
# Install for Claude Code
uxm init --ai claude

# Generate design system
uxm search "fintech dashboard" --design-system

# Search UX Laws
uxm search "mobile touch targets" --domain ux-laws

# List supported platforms
uxm platforms
```

## Commands

### `init` - Install skill for AI assistants

```bash
uxm init --ai claude                    # Install for Claude Code
uxm init --ai cursor --force            # Overwrite existing
uxm init --ai all                       # Install for all platforms
uxm init --ai claude --global           # Install to global config
uxm init --ai figma --dry-run           # Preview Figma integration
```

### `search` - Search knowledge base

```bash
# Generate design system
uxm search "fintech dashboard" --design-system -p "MyApp"

# Search specific domain
uxm search "fitts law" --domain ux-laws
uxm search "glassmorphism" --domain style
uxm search "mobile forms" --domain design-tests

# Stack-specific guidelines
uxm search "form validation" --stack react
```

### `extract` - Extract design system from website

```bash
uxm extract https://stripe.com --output stripe.json
uxm extract https://linear.app --format tailwind
uxm extract https://vercel.com --figma
```

### `validate` - Validate UI against Design Tests

```bash
uxm validate index.html --suite mobile
uxm validate component.html --suite a11y --output report.html
```

### `platforms` - List supported AI platforms

```bash
uxm platforms
```

## Features

### 1. Template Engine

Advanced template system with:
- YAML-based platform configurations
- Conditional blocks: `{{#if pro}}...{{/if}}`
- Loops: `{{#each stacks}}...{{/each}}`
- Partials: `{{> quick-reference}}`
- Variables with filters: `{{name | upper}}`

### 2. Multi-Platform Support

16 AI platforms supported:
- Claude Code
- Cursor
- Windsurf
- Antigravity
- GitHub Copilot
- Kiro
- OpenCode
- Roo Code
- Codex
- Qoder
- Gemini CLI
- Trae
- Continue
- CodeBuddy
- Droid (Factory)
- Cline

### 3. Search Engine

BM25-based search across:
- 16 domains (48 UX Laws, 37 Design Tests, 67 styles, etc.)
- 17 technology stacks
- 1000+ design rules

### 4. MCP Integration (Coming)

- Figma plugin for design token sync
- Google Stitch integration
- VS Code MCP server

## Architecture

```
cli/
├── uxmaster/
│   ├── __init__.py
│   ├── __main__.py
│   ├── cli.py              # Main CLI commands
│   ├── template_engine.py  # Template rendering
│   ├── search_engine.py    # BM25 search
│   ├── commands/           # Command implementations
│   └── utils/              # Utilities
├── templates/
│   ├── platforms/          # Platform YAML configs
│   └── base/               # Base templates
├── pyproject.toml
└── README.md
```

## Development

### Setup

```bash
cd cli
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
```

### Testing

```bash
pytest
```

### Code Quality

```bash
black uxmaster/
ruff check uxmaster/
mypy uxmaster/
```

## License

MIT License - see LICENSE file for details.
