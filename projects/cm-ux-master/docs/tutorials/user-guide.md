# UX-Master User Guide

Complete guide to using UX-Master v2.0.0 for design validation and system generation.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [CLI Usage](#cli-usage)
5. [Figma Plugin](#figma-plugin)
6. [MCP Server](#mcp-server)
7. [Validation](#validation)
8. [Design System Generation](#design-system-generation)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is UX-Master?

UX-Master is an AI-powered design intelligence platform that helps you:

- ✅ **Validate** designs against 37 Design Tests
- ✅ **Generate** complete design systems in seconds
- ✅ **Extract** design tokens from any website
- ✅ **Apply** 48 UX Laws for psychology-driven design

### Who is it for?

- **Designers** - Validate designs before handoff
- **Developers** - Ensure UI meets UX standards
- **Product Managers** - Quick design quality checks
- **Teams** - Maintain consistency across products

---

## Installation

### Prerequisites

- Python 3.10+
- pip or uv
- (Optional) Node.js for Figma plugin development

### Install UX-Master CLI

```bash
pip install uxmaster-cli
```

Or with uv (faster):

```bash
uv pip install uxmaster-cli
```

### Verify Installation

```bash
uxm --version
# Should print: uxmaster, version 2.0.0
```

---

## Quick Start

### 1. Install for Your AI Assistant

```bash
# For Claude Code
uxm init --ai claude

# For Cursor IDE
uxm init --ai cursor

# For all platforms
uxm init --ai all
```

### 2. Generate Your First Design System

```bash
uxm search "fintech dashboard" --design-system --project-name MyApp
```

### 3. Validate a Website

```bash
uxm validate https://stripe.com --url --suite mobile
```

---

## CLI Usage

### Command Overview

```bash
uxm [command] [arguments] [options]
```

### Common Workflows

#### Workflow 1: Design System from Scratch

```bash
# Generate design system
uxm search "e-commerce mobile app" --design-system -ds --project-name ShopApp

# Save to file
uxm search "e-commerce mobile app" --design-system --format markdown --output design-system.md
```

#### Workflow 2: Validate Existing Design

```bash
# Extract from website
uxm extract https://competitor.com --output competitor.json

# Validate extracted design
uxm validate competitor.json --suite all --format html --output report.html

# Open report
open report.html
```

#### Workflow 3: Component Validation

```bash
# Create component JSON
cat > button.json << 'EOF'
{
  "count": 5,
  "variants": ["primary", "secondary", "ghost"],
  "dimensions": {"width": 100, "height": 44}
}
EOF

# Validate
uxm validate button.json --component button
```

---

## Figma Plugin

### Installation

1. Open Figma Desktop
2. Go to **Plugins** → **Development** → **Import Plugin from Manifest**
3. Select `mcp/integrations/figma/plugin/manifest.json`

### Using the Plugin

#### Generate Design System

1. Open plugin from Figma menu
2. Click **✨ Generate** tab
3. Describe your project:
   ```
   A fintech dashboard with dark mode, modern glassmorphism style
   ```
4. Click **✨ Generate Magic**
5. Wait 2-3 seconds
6. Review generated tokens
7. Click **Apply to Figma** to create Variables

#### Validate Design

1. Select a frame in Figma
2. Open UX-Master plugin
3. Click **✓ Validate** tab
4. Select test suite:
   - **All Tests** - Complete validation (37 tests)
   - **Mobile** - Mobile-specific checks
   - **Landing** - Landing page validation
   - **Dashboard** - Dashboard validation
   - **Accessibility** - WCAG compliance
5. Click **Run Validation**
6. Review results:
   - **Score** - Overall quality (0-100)
   - **Passed/Failed** - Test counts
   - **Category Breakdown** - Scores by category
   - **Issues** - Failed tests with fixes
   - **Quick Fixes** - Top recommendations

### Understanding Validation Results

#### Score Interpretation

| Score | Rating | Action |
|-------|--------|--------|
| 90-100 | Excellent | Ship it! |
| 80-89 | Good | Minor tweaks |
| 70-79 | Fair | Review issues |
| 60-69 | Needs Work | Fix critical issues |
| <60 | Poor | Major revisions |

#### Issue Severity

- 🔴 **Critical** - Must fix before shipping
- 🟠 **High** - Should fix for good UX
- 🟡 **Medium** - Fix if time permits
- 🟢 **Low** - Nice to have

#### Example Fix

```
⚠ DT-MOB-001: Fitts's Law - Touch Target Size
Issue: 3 components below minimum size
Fix: Increase touch targets to at least 44x44px
UX Law: Fitts's Law
```

---

## MCP Server

### What is MCP?

Model Context Protocol (MCP) allows AI assistants like Claude, Cursor, and VS Code to use UX-Master tools directly.

### Starting the Server

```bash
# Default port 3000
uxm mcp start

# Custom port
uxm mcp start --port 8080

# With Figma integration
uxm mcp start --figma-token YOUR_TOKEN
```

### Using with Claude Code

Once installed (`uxm init --ai claude`), Claude can:

```
You: Create a landing page for my SaaS

Claude: I'll design a landing page for you. Let me check the UX guidelines first...

[Claude uses UX-Master internally]

Claude: Based on UX-Master's recommendations, here's your design:
- Hero section with clear value proposition
- Primary CTA in contrasting color
- Social proof above the fold
- Form limited to 3 fields

I've applied Fitts's Law (44px touch targets) and Hick's Law 
(limited choices) to optimize conversions.
```

### Using with Cursor IDE

1. Install MCP config: `uxm init --ai cursor`
2. Restart Cursor
3. Use in chat:
   ```
   /uxm validate this component
   /uxm generate design system for a dashboard
   /uxm search UX laws for mobile
   ```

---

## Validation

### Test Suites Explained

#### All Tests (37)

Complete validation across all categories:
- Mobile (7 tests)
- Landing Page (6 tests)
- Dashboard (6 tests)
- Typography (4 tests)
- Color (4 tests)
- Layout (4 tests)
- Accessibility (5 tests)
- Interaction (5 tests)

#### Mobile Tests

Validates:
- Touch target sizes (44px minimum)
- Thumb zone placement
- Touch feedback states
- Gesture support

**Use for:** Mobile apps, responsive websites

#### Landing Page Tests

Validates:
- Hero clarity (5-second test)
- CTA prominence
- Social proof placement
- Form friction

**Use for:** Marketing sites, product pages

#### Dashboard Tests

Validates:
- Information density
- Quick action accessibility
- Empty states
- Loading states

**Use for:** Admin panels, analytics, tools

#### Accessibility Tests

Validates:
- WCAG color contrast
- Focus visibility
- Input labels
- ARIA usage

**Use for:** All projects (required for compliance)

### Interpreting Results

#### Example Report

```
Score: 85/100

Passed: 32/37 tests

By Category:
  Mobile:      6/7  (86%)
  Color:       4/4  (100%)
  Typography:  3/4  (75%)
  Layout:      4/4  (100%)
  A11y:        4/5  (80%)

Critical Issues: 1
  - DT-MOB-001: Touch targets too small

Recommendations:
1. Increase button height from 32px to 44px
2. Add h2 heading between h1 and h3
3. Improve color contrast on secondary text
```

### Fixing Issues

#### Common Fixes

**Small Touch Targets**
```css
/* Before */
.btn { padding: 6px 12px; height: 28px; }

/* After */
.btn { padding: 12px 24px; min-height: 44px; }
```

**Poor Color Contrast**
```css
/* Before */
.text-secondary { color: #888; }

/* After */
.text-secondary { color: #666; } /* Better contrast */
```

**Missing Heading Hierarchy**
```html
<!-- Before -->
<h1>Title</h1>
<h3>Subtitle</h3> <!-- Skips h2 -->

<!-- After -->
<h1>Title</h1>
<h2>Subtitle</h2>
<h3>Section</h3>
```

---

## Design System Generation

### From Description

```bash
uxm search "dark mode fintech dashboard with glassmorphism" --design-system
```

### From Website

```bash
# Extract existing design
uxm extract https://linear.app --output linear.json

# Generate based on extracted style
uxm search "similar to linear.app but for healthcare" --design-system
```

### Output Formats

#### Markdown (Human-readable)

```bash
uxm search "fintech dashboard" --design-system --format markdown --output design.md
```

Generates:
```markdown
# MyApp Design System

## Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary | #0064FA | CTAs, links |
| Success | #10B981 | Confirmations |

## Typography
...

## UX Laws Applied
- Fitts's Law: 48px touch targets
- Hick's Law: Max 2 primary actions
```

#### JSON (Machine-readable)

```bash
uxm search "fintech dashboard" --design-system --format json --output tokens.json
```

Generates:
```json
{
  "colors": {
    "primary": "#0064FA",
    "success": "#10B981"
  },
  "spacing": {
    "unit": 4,
    "scale": [4, 8, 12, 16, 24]
  }
}
```

---

## Best Practices

### Design Validation Workflow

1. **Design Phase**
   - Create initial design in Figma
   - Run validation every 30 minutes
   - Fix critical issues immediately

2. **Before Handoff**
   - Run full validation suite
   - Score should be >= 80
   - Generate validation report

3. **During Development**
   - Validate components as built
   - Run CI/CD validation checks
   - Monitor regression

4. **Before Launch**
   - Final validation pass
   - Document exceptions
   - Archive reports

### Validation Frequency

| Phase | Frequency | Suite |
|-------|-----------|-------|
| Exploration | As needed | Quick |
| Design | Every 30 min | Mobile/Landing/Dashboard |
| Review | Before handoff | All |
| Development | Per component | Component-specific |
| Pre-launch | Once | All + A11y |

### Team Integration

#### Design System Team

```bash
# Weekly validation of design system
uxm validate design-system.json --suite all --format html --output weekly-report.html
```

#### Product Teams

```bash
# Per-feature validation
uxm validate feature-component.json --component button
```

#### QA Teams

```bash
# Pre-release validation
uxm validate https://staging.example.com --url --suite all
```

---

## Troubleshooting

### Common Issues

#### Issue: `command not found: uxm`

**Solution:**
```bash
# Check Python path
which python3

# Reinstall with --user
pip install --user uxmaster-cli

# Or use full path
python3 -m uxmaster --help
```

#### Issue: `MCP server not running`

**Solution:**
```bash
# Start server
uxm mcp start

# Check if running
curl http://localhost:3000/health

# Check port availability
lsof -i :3000
```

#### Issue: `Validation failed - File not found`

**Solution:**
```bash
# Check file exists
ls -la path/to/file.html

# Use absolute path
uxm validate $(pwd)/file.html

# Check file permissions
chmod 644 file.html
```

#### Issue: Figma plugin not working

**Solution:**
1. Check MCP server is running
2. Verify plugin manifest path
3. Check browser console for errors
4. Try reloading plugin (Ctrl+Alt+P)

#### Issue: Low validation scores

**Not necessarily a problem!**

Validation is guidance, not gospel:
- Some designs intentionally break rules
- Context matters (brand, audience, constraints)
- Use judgment alongside scores

**When to ignore:**
- Deliberate artistic choices
- Brand guidelines differ
- Technical constraints
- User testing proves otherwise

### Getting Help

1. **Check documentation**: `uxm docs`
2. **Verbose output**: `uxm validate file.html -v`
3. **Community Discord**: https://discord.gg/uxmaster
4. **GitHub Issues**: https://github.com/uxmaster/uxmaster/issues

---

## Advanced Usage

### Custom Validation Rules

```python
# custom_validator.py
from validation_engine import ValidationEngine, DesignTest, TestResult

class CustomTest(DesignTest):
    def __init__(self):
        self.test_id = "CUSTOM-001"
        self.name = "Brand Color Check"
        self.severity = "high"
    
    def run(self, data):
        brand_color = "#FF0000"
        has_brand = False
        
        # Check if brand color exists
        colors = data.get("visualAnalysis", {}).get("colors", {})
        for _, color_data in colors.get("semantic", {}).items():
            if color_data.get("base") == brand_color:
                has_brand = True
        
        return TestResult(
            test_id=self.test_id,
            name=self.name,
            category="brand",
            severity=self.severity,
            passed=has_brand,
            message="Brand color present" if has_brand else "Missing brand color",
            suggestion=f"Add brand color {brand_color}",
            ux_law="Brand Consistency"
        )

# Use custom test
engine = ValidationEngine()
engine._register(CustomTest())
```

### CI/CD Integration

```yaml
# .github/workflows/ux-validation.yml
name: UX Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install UX-Master
        run: pip install uxmaster-cli
      
      - name: Validate Design
        run: |
          uxm validate index.html --suite all --format json --output validation.json
      
      - name: Check Score
        run: |
          SCORE=$(cat validation.json | jq '.score')
          if [ $(echo "$SCORE < 70" | bc) -eq 1 ]; then
            echo "Validation score $SCORE is below threshold"
            exit 1
          fi
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation.json
```

---

## Tips & Tricks

### Faster Validation

```bash
# Validate only specific suite
uxm validate file.html --suite mobile  # 7 tests vs 37

# Skip extraction screenshots
uxm extract https://example.com --depth 1  # vs --depth 2
```

### Batch Validation

```bash
# Validate multiple files
for file in *.html; do
  uxm validate "$file" --suite mobile --format json --output "reports/${file%.html}.json"
done
```

### Design System Templates

```bash
# Create template
uxm search "fintech template" --design-system --format json --output templates/fintech.json

# Use template for new projects
uxm search "similar to templates/fintech.json" --design-system
```

---

## Next Steps

- Read [API Reference](API-REFERENCE.md)
- Watch [Video Tutorials](https://youtube.com/uxmaster)
- Join [Discord Community](https://discord.gg/uxmaster)
- Star on [GitHub](https://github.com/uxmaster/ux-master)

---

**Happy validating! ✨**
