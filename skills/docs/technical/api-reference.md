# UX-Master API Reference

Complete API documentation for UX-Master v2.0.0

---

## Table of Contents

- [CLI API](#cli-api)
- [MCP Server API](#mcp-server-api)
- [Python SDK](#python-sdk)
- [Validation Engine](#validation-engine)
- [Harvester API](#harvester-api)

---

## CLI API

### Installation

```bash
pip install uxmaster-cli
```

### Global Commands

#### `uxm init`

Install UX-Master skill for AI assistants.

```bash
uxm init --ai <platform> [options]
```

**Options:**

| Option           | Description                   | Default   |
| ---------------- | ----------------------------- | --------- |
| `--ai, -a`     | Target AI platform (required) | -         |
| `--global, -g` | Install to global config      | `false` |
| `--force, -f`  | Overwrite existing files      | `false` |
| `--output, -o` | Output directory              | `.`     |
| `--dry-run`    | Preview without creating      | `false` |

**Supported Platforms:**

- `claude` - Claude Code
- `cursor` - Cursor IDE
- `windsurf` - Windsurf IDE
- `vscode` - VS Code MCP
- `figma` - Figma Plugin
- `all` - All platforms

**Example:**

```bash
# Install for Claude Code
uxm init --ai claude

# Install globally with force
uxm init --ai claude --global --force

# Preview changes
uxm init --ai all --dry-run
```

---

#### `uxm search`

Search UX-Master knowledge base.

```bash
uxm search <query> [options]
```

**Options:**

| Option                   | Description            | Default   |
| ------------------------ | ---------------------- | --------- |
| `--domain, -d`         | Search domain          | -         |
| `--stack, -s`          | Technology stack       | -         |
| `--max-results, -n`    | Max results            | `3`     |
| `--design-system, -ds` | Generate design system | `false` |
| `--project-name, -p`   | Project name           | -         |
| `--format, -f`         | Output format          | `ascii` |

**Domains:**

- `ux-laws` - 48 UX Laws
- `design-tests` - 37 Design Tests
- `style` - Style guidelines
- `color` - Color theory
- `typography` - Typography
- `product` - Product patterns
- `landing` - Landing page patterns
- `chart` - Data visualization
- `animation` - Motion design
- `responsive` - Responsive design
- `accessibility` - Accessibility
- `devices` - Device-specific

**Stacks:**

- `html-tailwind`
- `react`, `nextjs`
- `vue`, `nuxtjs`, `nuxt-ui`
- `svelte`, `astro`
- `swiftui`, `react-native`, `flutter`
- `shadcn`, `jetpack-compose`, `angular`
- `htmx`, `electron`, `tauri`

**Example:**

```bash
# Search UX Laws
uxm search "mobile touch targets" --domain ux-laws

# Generate design system
uxm search "fintech dashboard" --design-system --project-name MyApp

# Search with stack
uxm search "form validation" --stack react -n 5
```

---

#### `uxm validate`

Validate UI against 37 Design Tests.

```bash
uxm validate <target> [options]
```

**Options:**

| Option              | Description    | Default   |
| ------------------- | -------------- | --------- |
| `--suite, -s`     | Test suite     | `all`   |
| `--format, -f`    | Output format  | `rich`  |
| `--output, -o`    | Output file    | -         |
| `--url, -u`       | Target is URL  | `false` |
| `--component, -c` | Component type | -         |

**Test Suites:**

- `all` - All 37 tests
- `mobile` - Mobile-specific (7 tests)
- `landing` - Landing page (6 tests)
- `dashboard` - Dashboard (6 tests)
- `a11y` - Accessibility (5 tests)
- `color` - Color (4 tests)
- `typography` - Typography (4 tests)

**Output Formats:**

- `rich` - Terminal with colors
- `json` - JSON output
- `markdown` - Markdown report
- `html` - HTML dashboard

**Example:**

```bash
# Validate HTML file
uxm validate index.html --suite mobile

# Validate URL
uxm validate https://stripe.com --url --suite all

# Validate component
uxm validate button.json --component button

# Generate HTML report
uxm validate index.html --format html --output report.html
```

---

#### `uxm extract`

Extract design system from website.

```bash
uxm extract <url> [options]
```

**Options:**

| Option            | Description         | Default   |
| ----------------- | ------------------- | --------- |
| `--output, -o`  | Output file         | -         |
| `--format, -f`  | Output format       | `json`  |
| `--depth, -d`   | Crawl depth         | `1`     |
| `--figma`       | Export to Figma     | `false` |
| `--stitch`      | Export to Stitch    | `false` |
| `--screenshots` | Capture screenshots | `false` |

**Output Formats:**

- `json` - Design tokens JSON
- `yaml` - YAML format
- `css` - CSS variables
- `tailwind` - Tailwind config

**Example:**

```bash
# Extract to JSON
uxm extract https://stripe.com --output stripe.json

# Export to Figma
uxm extract https://linear.app --figma

# Deep crawl with screenshots
uxm extract https://vercel.com --depth 2 --screenshots
```

---

#### `uxm mcp`

Start MCP server.

```bash
uxm mcp start [options]
```

**Options:**

| Option            | Description     | Default     |
| ----------------- | --------------- | ----------- |
| `--port, -p`    | Server port     | `3000`    |
| `--host, -h`    | Server host     | `0.0.0.0` |
| `--figma-token` | Figma API token | -           |

**Example:**

```bash
# Start server
uxm mcp start

# Start with custom port
uxm mcp start --port 8080

# Start with Figma integration
uxm mcp start --figma-token <token>
```

---

## MCP Server API

### Base URL

```
http://localhost:3000
```

### Authentication

No authentication required for local development.

### Endpoints

#### `POST /mcp/v1/initialize`

Initialize MCP connection.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize"
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "serverInfo": {
      "name": "ux-master",
      "version": "2.0.0"
    }
  }
}
```

---

#### `POST /mcp/v1/tools/list`

List available tools.

**Response:**

```json
{
  "tools": [
    {
      "name": "search_ux_laws",
      "description": "Search 48 UX Laws",
      "inputSchema": {...}
    },
    {
      "name": "validate_design",
      "description": "Validate against 37 Design Tests",
      "inputSchema": {...}
    }
  ]
}
```

---

#### `POST /mcp/v1/tools/call`

Call a tool.

### Tool: `search_ux_laws`

Search 48 UX Laws for psychology-driven design.

**Request:**

```json
{
  "name": "search_ux_laws",
  "arguments": {
    "query": "mobile touch targets",
    "product_type": "mobile",
    "max_results": 5
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"laws\": [\n    {\n      \"id\": 1,\n      \"name\": \"Fitts's Law\",\n      \"definition\": \"The time to acquire a target is a function of the distance to and size of the target.\",\n      \"application\": \"Make touch targets at least 44x44px\",\n      \"severity\": \"Critical\"\n    }\n  ],\n  \"count\": 1\n}"
    }
  ]
}
```

**Parameters:**

| Parameter        | Type    | Required | Description        |
| ---------------- | ------- | -------- | ------------------ |
| `query`        | string  | Yes      | Search query       |
| `product_type` | string  | No       | Filter by type     |
| `max_results`  | integer | No       | Max results (1-10) |

---

### Tool: `validate_design`

Validate UI code against 37 Design Tests.

**Request:**

```json
{
  "name": "validate_design",
  "arguments": {
    "html": "<button style='width: 100px'>Click</button>",
    "css": "button { padding: 10px; }",
    "test_suite": "all"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"status\": \"completed\",\n  \"score\": 85.5,\n  \"passed\": 32,\n  \"failed\": 5,\n  \"total\": 37,\n  \"tests\": [\n    {\n      \"test_id\": \"DT-MOB-001\",\n      \"name\": \"Fitts's Law\",\n      \"category\": \"mobile\",\n      \"severity\": \"critical\",\n      \"passed\": true,\n      \"message\": \"All touch targets >= 44px\",\n      \"suggestion\": \"Keep targets at least 44x44px\",\n      \"ux_law\": \"Fitts's Law\"\n    }\n  ],\n  \"summary\": {\n    \"critical_issues\": 0,\n    \"by_category\": {...}\n  }\n}"
    }
  ]
}
```

**Parameters:**

| Parameter      | Type   | Required | Description       |
| -------------- | ------ | -------- | ----------------- |
| `html`       | string | Yes      | HTML content      |
| `css`        | string | No       | CSS content       |
| `test_suite` | string | No       | Test suite to run |

**Test Suites:**

- `all` - All 37 tests
- `mobile` - Mobile tests
- `landing` - Landing page tests
- `dashboard` - Dashboard tests
- `a11y` - Accessibility tests

---

### Tool: `extract_design_system`

Extract design system from website using Harvester v4.

**Request:**

```json
{
  "name": "extract_design_system",
  "arguments": {
    "url": "https://stripe.com",
    "depth": 1,
    "include_screenshots": false
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"status\": \"completed\",\n  \"url\": \"https://stripe.com\",\n  \"design_system\": {\n    \"colors\": {...},\n    \"typography\": {...},\n    \"spacing\": {...}\n  },\n  \"css\": \":root { --color-primary: #0064FA; }\",\n  \"tokens\": {\n    \"--semi-color-primary\": \"#0064FA\"\n  },\n  \"validation\": {\n    \"score\": 92,\n    \"passed\": 34,\n    \"failed\": 3\n  }\n}"
    }
  ]
}
```

**Parameters:**

| Parameter               | Type    | Required | Description         |
| ----------------------- | ------- | -------- | ------------------- |
| `url`                 | string  | Yes      | Website URL         |
| `depth`               | integer | No       | Crawl depth (1-3)   |
| `include_screenshots` | boolean | No       | Capture screenshots |

---

### Tool: `generate_design_system`

Generate design system from description.

**Request:**

```json
{
  "name": "generate_design_system",
  "arguments": {
    "query": "fintech dashboard with dark mode",
    "project_name": "FinDash",
    "output_format": "json"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"design_system\": {\n    \"name\": \"FinDash\",\n    \"colors\": {\n      \"primary\": \"#0064FA\",\n      \"secondary\": \"#00C853\",\n      \"background\": \"#0F172A\"\n    },\n    \"typography\": {...},\n    \"ux_laws_applied\": [\n      {\n        \"name\": \"Fitts's Law\",\n        \"application\": \"48px touch targets\"\n      }\n    ]\n  }\n}"
    }
  ]
}
```

**Parameters:**

| Parameter         | Type   | Required | Description              |
| ----------------- | ------ | -------- | ------------------------ |
| `query`         | string | Yes      | Project description      |
| `project_name`  | string | No       | Project name             |
| `output_format` | string | No       | `json` or `markdown` |

---

### Tool: `export_to_figma`

Export design tokens to Figma Variables.

**Request:**

```json
{
  "name": "export_to_figma",
  "arguments": {
    "file_key": "abc123",
    "design_tokens": {
      "colors": {"primary": "#0064FA"}
    },
    "collection_name": "UX-Master Tokens"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"figma_response\": {\n    \"id\": \"123\",\n    \"name\": \"UX-Master Tokens\"\n  }\n}"
    }
  ]
}
```

**Parameters:**

| Parameter           | Type   | Required | Description     |
| ------------------- | ------ | -------- | --------------- |
| `file_key`        | string | Yes      | Figma file key  |
| `design_tokens`   | object | Yes      | Design tokens   |
| `collection_name` | string | No       | Collection name |

---

## Python SDK

### Installation

```bash
pip install uxmaster-cli
```

### Validation Engine

```python
from validation_engine import ValidationEngine

# Create engine
engine = ValidationEngine()

# Load harvester data
with open('harvest.json') as f:
    data = json.load(f)

# Run validation
report = engine.validate(data, test_suite='all')

# Check results
print(f"Score: {report.score}/100")
print(f"Passed: {report.passed_count}/{report.total_count}")

# Check specific test
for test in report.tests:
    if not test.passed:
        print(f"❌ {test.name}: {test.suggestion}")
```

**Test Suites:**

```python
# Available suites
report = engine.validate(data, test_suite='mobile')
report = engine.validate(data, test_suite='landing')
report = engine.validate(data, test_suite='dashboard')
report = engine.validate(data, test_suite='a11y')
```

**Validate Component:**

```python
component_data = {
    "count": 5,
    "representative": {
        "dimensions": {"width": 100, "height": 44}
    }
}

report = engine.validate_component(component_data, "button")
```

---

### Search Engine

```python
from search_engine import SearchEngine

engine = SearchEngine()

# Search UX Laws
results = engine.search(
    query="mobile touch targets",
    domain="ux-laws",
    max_results=5
)

# Search Design Tests
results = engine.search(
    query="button validation",
    domain="design-tests"
)

# Generate design system
system = engine.generate_design_system(
    query="fintech dashboard",
    project_name="MyApp"
)
```

---

### Design System Indexer

```python
from design_system_indexer import DesignSystemIndexer

# Load harvester data
with open('harvest.json') as f:
    data = json.load(f)

# Index design system
indexer = DesignSystemIndexer(data, name="MyApp")
design_system = indexer.index()

# Generate CSS
css = design_system.generate_css()

# Get tokens
tokens = design_system.to_semi_tokens()

# Save
with open('design-system.css', 'w') as f:
    f.write(css)
```

---

## Validation Engine

### Test Categories

#### Mobile Tests (7)

| ID         | Name                 | Severity | Check                 |
| ---------- | -------------------- | -------- | --------------------- |
| DT-MOB-001 | Fitts's Law          | Critical | Touch targets >= 44px |
| DT-MOB-002 | Thumb Zone           | High     | Actions in bottom 25% |
| DT-MOB-003 | Touch Feedback       | High     | Hover/active states   |
| DT-MOB-004 | Tap Delay            | Medium   | No 300ms delay        |
| DT-MOB-005 | Swipe Gestures       | Low      | List swipe support    |
| DT-MOB-006 | Gestural Consistency | Medium   | Consistent gestures   |
| DT-MOB-007 | Pull-to-Refresh      | Low      | PTR support           |

#### Landing Page Tests (6)

| ID         | Name             | Severity | Check               |
| ---------- | ---------------- | -------- | ------------------- |
| DT-LND-001 | Hero Clarity     | Critical | Value prop in 5 sec |
| DT-LND-002 | CTA Prominence   | Critical | Visual dominance    |
| DT-LND-003 | Social Proof     | High     | Above the fold      |
| DT-LND-004 | Form Friction    | High     | Max 5 fields        |
| DT-LND-005 | Trust Indicators | High     | Security badges     |
| DT-LND-006 | FAQ Visibility   | Medium   | Easy to find        |

#### Dashboard Tests (6)

| ID         | Name              | Severity | Check             |
| ---------- | ----------------- | -------- | ----------------- |
| DT-DSH-001 | Data Density      | High     | Information scent |
| DT-DSH-002 | Quick Actions     | High     | Within 2 clicks   |
| DT-DSH-003 | Empty States      | Medium   | Guide users       |
| DT-DSH-004 | Loading States    | Medium   | Skeleton screens  |
| DT-DSH-005 | Real-time Updates | Medium   | Fresh data        |
| DT-DSH-006 | Customization     | Low      | User control      |

#### Typography Tests (4)

| ID         | Name          | Severity | Check         |
| ---------- | ------------- | -------- | ------------- |
| DT-TYP-001 | Hierarchy     | Critical | 3+ levels     |
| DT-TYP-002 | Line Length   | Medium   | 45-75 chars   |
| DT-TYP-003 | Font Families | Medium   | Max 2-3 fonts |
| DT-TYP-004 | Font Loading  | Medium   | Performance   |

#### Color Tests (4)

| ID         | Name            | Severity | Check               |
| ---------- | --------------- | -------- | ------------------- |
| DT-CLR-001 | WCAG Contrast   | Critical | 4.5:1 ratio         |
| DT-CLR-002 | Semantic Colors | High     | Primary/Success/etc |
| DT-CLR-003 | Neutral Scale   | High     | 5+ levels           |
| DT-CLR-004 | Dark Mode       | Low      | Color support       |

#### Layout Tests (4)

| ID         | Name           | Severity | Check       |
| ---------- | -------------- | -------- | ----------- |
| DT-LYT-001 | Spacing System | High     | 4px base    |
| DT-LYT-002 | Border Radius  | Medium   | Consistency |
| DT-LYT-003 | Grid System    | Medium   | 8/12/24 col |
| DT-LYT-004 | Breakpoints    | High     | Responsive  |

#### Accessibility Tests (5)

| ID         | Name           | Severity | Check             |
| ---------- | -------------- | -------- | ----------------- |
| DT-A11-001 | Focus States   | Critical | Visible focus     |
| DT-A11-002 | Input Labels   | Critical | Associated labels |
| DT-A11-003 | ARIA Usage     | High     | Proper attributes |
| DT-A11-004 | Keyboard Nav   | Critical | Tab order         |
| DT-A11-005 | Screen Readers | High     | SR support        |

#### Interaction Tests (5)

| ID         | Name              | Severity | Check        |
| ---------- | ----------------- | -------- | ------------ |
| DT-INT-001 | Animation Perf    | Medium   | 60fps        |
| DT-INT-002 | Transition Timing | Medium   | 150-300ms    |
| DT-INT-003 | Hover Response    | Medium   | < 150ms      |
| DT-INT-004 | Error Prevention  | High     | Undo/cancel  |
| DT-INT-005 | Undo Capability   | Medium   | Undo actions |

---

## Harvester API

### Browser Injection

```javascript
// Inject harvester_v4.js into browser console
const harvester = document.createElement('script');
harvester.src = 'https://ux-master.dev/harvester_v4.js';
document.head.appendChild(harvester);

// Run extraction
const data = window.UXMasterHarvester.extract();
console.log(JSON.stringify(data, null, 2));
```

### Python API

```python
from harvester_browser import BrowserHarvester

harvester = BrowserHarvester()

# Harvest single page
result = harvester.harvest("https://example.com")

if result["success"]:
    data = result["data"]
    print(f"Extracted {len(data['components']['blueprints'])} components")
```

### Output Format

```json
{
  "_version": 4,
  "meta": {
    "url": "https://example.com",
    "title": "Page Title",
    "pageType": "dashboard",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "visualAnalysis": {
    "colors": {
      "semantic": {...},
      "neutrals": {...}
    },
    "typography": {...},
    "layout": {...},
    "spacing": {...}
  },
  "components": {
    "blueprints": {...}
  },
  "quality": {
    "accessibility": {...}
  }
}
```

---

## Error Codes

| Code | Meaning             | Resolution             |
| ---- | ------------------- | ---------------------- |
| 400  | Bad Request         | Check parameters       |
| 404  | Not Found           | Check URL/file path    |
| 422  | Validation Error    | Check input format     |
| 500  | Server Error        | Check logs             |
| 503  | Service Unavailable | MCP server not running |

---

## Rate Limits

- CLI: No limits
- MCP Server: 100 requests/minute
- Harvester: 10 URLs/minute

---

## Support

- Documentation: https://ux-master.dev/docs
- Issues: https://github.com/uxmaster/ux-master/issues
- Discord: https://discord.gg/uxmaster
