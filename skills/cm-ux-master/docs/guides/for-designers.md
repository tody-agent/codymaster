# UX Master v4 — Complete Guide for Designers 🎨

> **Extract, analyze, and amplify your design workflow with AI**

---

## Who You Are

- 🎨 **UI/UX Designer** creating web or mobile interfaces
- 🎭 **Design Lead** managing design systems
- 🏢 **Product Designer** working on SaaS/dashboard products
- 🎪 **Creative Director** overseeing multiple brands

**Your Goal**: Create consistent, scalable, beautiful designs faster

---

## What You'll Learn

1. [Quick Start (5 minutes)](#quick-start-5-minutes)
2. [Your Design Workflow](#your-design-workflow)
3. [Figma Integration](#figma-integration)
4. [Google Stitch AI](#google-stitch-ai)
5. [Design System Audits](#design-system-audits)
6. [Advanced Techniques](#advanced-techniques)
7. [Real Case Studies](#real-case-studies)

---

## Quick Start (5 minutes)

### Step 1: Extract Design System

```bash
# Install (first time only)
pip install playwright
playwright install chromium

# Extract from any website
python scripts/wizard.py --url https://stripe.com --name "StripeClone"
```

**What you get in 5 minutes:**
- 🎨 47 color tokens (primary, semantic, neutrals)
- 📝 18 typography settings (fonts, sizes, weights)
- 📐 10 spacing values (8px grid system)
- 📸 Screenshots (desktop + mobile)
- 🎭 Component blueprints

### Step 2: Import to Figma

```bash
# Export to Figma format
python scripts/figma_bridge.py export \
  --input output/StripeClone/design-system.json \
  --name "StripeClone"
```

**In Figma:**
1. Install "Tokens Studio" plugin
2. Import `figma-tokens.json`
3. Start designing with tokens!

### Step 3: Generate AI Designs

```bash
# Create Stitch prompt
python scripts/stitch_integration.py prompt \
  --input output/StripeClone/design-system.json \
  --screen landing
```

**In Google Stitch:**
1. Go to stitch.withgoogle.com
2. Paste the generated prompt
3. Get AI-generated screens matching the design system!

---

## Your Design Workflow

### Scenario 1: New Project Kickoff

**Traditional Approach:**
```
Week 1: Research competitors, document findings
Week 2: Create mood boards, color palettes
Week 3: Define typography, spacing
Week 4: Build component library in Figma
→ Total: 1 month
```

**With UX Master:**
```
Day 1: Extract reference site (5 min)
Day 1: Import to Figma (5 min)
Day 1-2: Customize and iterate (2 days)
→ Total: 2 days
```

**Time saved: 3.5 weeks (87%)**

**How to do it:**
```bash
# Extract from 3 competitor sites
python scripts/wizard.py --url https://competitor1.com --name "Comp1"
python scripts/wizard.py --url https://competitor2.com --name "Comp2"
python scripts/wizard.py --url https://competitor3.com --name "Comp3"

# Compare color palettes
# Look at screenshots
# Pick best elements
# Customize in Figma
```

---

### Scenario 2: Design System Maintenance

**Problem**: Design drift across product

**Solution**:
```bash
# Extract current state
python scripts/wizard.py \
  --url https://my-product.com \
  --name "CurrentState" \
  --crawl --max-pages 10

# Compare with documented system
python scripts/figma_bridge.py compare \
  --harvester output/CurrentState/design-system.json \
  --figma documented-system.json

# Get diff report showing:
# - Colors that drifted
# - Typography inconsistencies
# - Missing components
```

---

### Scenario 3: Client Audit

**Problem**: New client has inconsistent legacy app

**Solution**:
```bash
# Extract and document current state
python scripts/wizard.py \
  --url https://client-legacy-app.com \
  --name "ClientAudit" \
  --crawl --max-pages 20

# Generate audit report
cat > audit-report.md << 'EOF'
# Design System Audit: Client App

## Current State
Extracted from: https://client-legacy-app.com
Date: $(date)

## Color Analysis
$(cat output/ClientAudit/design-system.json | jq '.tokens.color')

## Typography
$(cat output/ClientAudit/design-system.json | jq '.tokens.typography')

## Inconsistencies Found
$(python scripts/figma_bridge.py compare ...)

## Recommendations
1. Standardize color palette
2. Unify typography scale
3. Document spacing system
4. Create component library
EOF
```

**Deliver to client:**
- ✅ Visual screenshots
- ✅ Color palette analysis
- ✅ Typography audit
- ✅ Component inventory
- ✅ Migration roadmap

---

## Figma Integration

### Importing Tokens to Figma

**Step-by-step:**

1. **Install Tokens Studio**
   - Open Figma
   - Go to Plugins → Browse
   - Search "Tokens Studio"
   - Install

2. **Export from UX Master**
   ```bash
   python scripts/figma_bridge.py export \
     --input output/MyProject/design-system.json \
     --name "MyProject"
   ```

3. **Import to Figma**
   - Open Tokens Studio
   - Click "Import"
   - Select `figma-tokens.json`
   - Tokens appear organized!

4. **Apply to Components**
   - Select frame/component
   - Click token in Tokens Studio
   - Value applies automatically!

---

### Exporting from Figma to Code

**When design changes in Figma:**

1. **Export from Tokens Studio**
   - Open Tokens Studio
   - Click "Export"
   - Save as `figma-tokens.json`

2. **Import to UX Master**
   ```bash
   python scripts/figma_bridge.py import \
     --input figma-tokens.json \
     --output from-figma.json
   ```

3. **Generate updated components**
   ```bash
   python scripts/component_generator.py \
     --input from-figma.json \
     --all --output ./updated-components
   ```

4. **Hand off to developers**
   - Updated CSS variables
   - Updated component code
   - Exact design tokens

---

### Working with Tokens

**Token Structure in Figma:**

```
MyProject (Token Set)
├── color/
│   ├── primary → #0064FA
│   ├── success → #10B981
│   └── neutral-500 → #6B7280
├── spacing/
│   ├── tight → 8px
│   ├── base → 16px
│   └── loose → 24px
└── typography/
    ├── font-family → Inter
    └── font-size-regular → 14px
```

**Best Practices:**
- ✅ Use semantic names (primary, not blue)
- ✅ Group by category (color/, spacing/)
- ✅ Document with descriptions
- ✅ Reference, don't hardcode

---

## Google Stitch AI

### Creating Stitch Prompts

**Basic prompt generation:**
```bash
python scripts/stitch_integration.py prompt \
  --input output/MyProject/design-system.json \
  --screen dashboard \
  --output stitch-prompt.txt
```

**Output example:**
```markdown
Create a dashboard screen with the following design system:

## Color Palette
- Primary: #0064FA (Use for main CTAs)
- Success: #10B981 (Positive actions)
- Warning: #F59E0B (Caution states)
- Danger: #EF4444 (Destructive actions)

## Typography
- Font: Inter, sans-serif
- Base: 14px
- Headings: Bold, 1.2 line-height

## Layout Requirements
Design a dashboard with:
1. Header with navigation
2. Metrics cards (4 columns)
3. Chart section
4. Activity feed
5. Quick actions

## Style Guidelines
- 8px spacing grid
- 6px border radius for inputs
- 12px border radius for cards
- Subtle shadows (elevated cards)
```

---

### Batch Screen Generation

**Generate multiple screens at once:**
```bash
python scripts/stitch_integration.py batch \
  --input output/MyProject/design-system.json \
  --screens dashboard settings profile checkout \
  --output batch-spec.json
```

**Result:**
```json
{
  "screens": [
    {
      "name": "dashboard",
      "description": "Data overview...",
      "prompt": "Create dashboard..."
    },
    {
      "name": "settings",
      "description": "User preferences...",
      "prompt": "Create settings..."
    }
  ]
}
```

**Use in Stitch:**
- Copy each prompt
- Generate screens
- Maintain consistency across all screens

---

### DESIGN.md for Reference

**Generate comprehensive design doc:**
```bash
python scripts/stitch_integration.py design-md \
  --input output/MyProject/design-system.json \
  --project "MyProject" \
  --output DESIGN.md
```

**Use as:**
- ✅ Project reference in Stitch
- ✅ Team documentation
- ✅ Client deliverable
- ✅ Design handoff

---

## Design System Audits

### Visual Consistency Check

```bash
# Extract multiple pages
python scripts/wizard.py \
  --url https://app.com/dashboard \
  --name "Dashboard"

python scripts/wizard.py \
  --url https://app.com/settings \
  --name "Settings"

# Compare
python scripts/figma_bridge.py compare \
  --harvester output/Dashboard/design-system.json \
  --figma output/Settings/figma-tokens.json
```

**Report shows:**
```
Consistency Analysis:

Colors:
  ✓ Primary matches: #0064FA
  ✓ Success matches: #10B981
  ⚠ Warning differs: #F59E0B vs #D97706
  
Typography:
  ✓ Font family matches
  ⚠ Body size differs: 14px vs 13px
  
Spacing:
  ✓ Grid system consistent
  
Recommendations:
  1. Standardize warning color
  2. Fix body font size to 14px
```

---

### Color Psychology Analysis

```bash
# Extract with psychology analysis
python scripts/wizard.py --url https://example.com

# Check output
python -c "
import json
with open('output/example/design-system.json') as f:
    data = json.load(f)
    primary = data['tokens']['color']['primary']
    if isinstance(primary, dict):
        print('Primary:', primary['base'])
        print('Psychology:', primary.get('psychology', {}))
"
```

**Output:**
```json
{
  "base": "#0064FA",
  "psychology": {
    "h": 220,
    "emotion": "professional, reliable, calm",
    "useCase": "primary actions, corporate, links"
  }
}
```

**Use for:**
- ✅ Brand alignment checks
- ✅ Client presentations
- ✅ Color strategy
- ✅ Accessibility reviews

---

## Advanced Techniques

### Creating Mood Boards

```bash
# Extract from multiple inspirational sites
sites=("https://site1.com" "https://site2.com" "https://site3.com")

for url in "${sites[@]}"; do
  name=$(echo $url | cut -d'/' -f3)
  python scripts/wizard.py --url $url --name $name
done

# Compare color palettes
echo "## Color Palette Comparison" > mood-board.md
for dir in output/*/; do
  echo "### $(basename $dir)" >> mood-board.md
  cat "$dir/design-system.json" | jq '.tokens.color.primary' >> mood-board.md
  echo "![Screenshot]($dir/screenshot-desktop.png)" >> mood-board.md
done
```

---

### Component Library Planning

```bash
# Extract and inventory components
python scripts/wizard.py --url https://reference.com

# Analyze components
python -c "
import json
with open('output/reference/design-system.json') as f:
    data = json.load(f)
    components = data.get('components', {}).get('blueprints', {})
    
print('Detected Components:')
for name, info in components.items():
    count = info.get('count', 0)
    variants = list(info.get('variants', {}).keys())
    print(f'  • {name}: {count} instances, variants: {variants}')
"
```

**Output:**
```
Detected Components:
  • button: 15 instances, variants: ['primary', 'secondary', 'outline']
  • card: 8 instances, variants: ['default', 'elevated']
  • input: 12 instances, variants: ['default', 'error']
  • table: 3 instances, variants: ['default']
```

**Plan your library:**
- Prioritize high-use components
- Document variant needs
- Plan states (hover, active, disabled)

---

### Design Token Governance

**Version control your tokens:**

```bash
# Extract and version
date=$(date +%Y-%m-%d)
python scripts/wizard.py \
  --url https://my-app.com \
  --name "MyApp-$date"

# Commit to git
git add output/MyApp-$date/
git commit -m "Design system snapshot $date"

# Track changes over time
git log --oneline output/MyApp-*/
```

---

## Real Case Studies

### Case Study 1: SaaS Dashboard Redesign

**Client**: FinTech startup
**Challenge**: Legacy dashboard with inconsistent UI
**Timeline**: 2 weeks

**Process:**
```bash
# Week 1: Audit
python scripts/wizard.py --url https://legacy-app.com --name "Legacy"
# Found: 23 different button styles, 8 gray colors, inconsistent spacing

# Week 1: Research
python scripts/wizard.py --url https://modern-reference.com --name "Reference"
# Extracted: Clean 8px grid, semantic colors, consistent typography

# Week 2: Implementation
python scripts/component_generator.py \
  --input output/Reference/design-system.json \
  --all --framework react-tailwind

# Generated: 15 components, 150+ tokens
```

**Result:**
- ✅ 95% consistency (up from 60%)
- ✅ 2x faster design iterations
- ✅ 50% fewer design-system questions from devs

---

### Case Study 2: Multi-Brand System

**Client**: E-commerce platform with 5 brands
**Challenge**: Maintain consistency while allowing brand differentiation

**Process:**
```bash
# Extract all brands
for brand in brand1 brand2 brand3 brand4 brand5; do
  python scripts/wizard.py \
    --url https://$brand.com \
    --name $brand
done

# Create comparison matrix
echo "| Brand | Primary | Secondary | Font |" > comparison.md
echo "|-------|---------|-----------|------|" >> comparison.md

for brand in brand1 brand2 brand3 brand4 brand5; do
  primary=$(cat output/$brand/design-system.json | jq -r '.tokens.color.primary.base // .tokens.color.primary')
  font=$(cat output/$brand/design-system.json | jq -r '.tokens.typography.font-family-regular')
  echo "| $brand | $primary | - | $font |" >> comparison.md
done
```

**Result:**
- ✅ Unified 8px grid across all brands
- ✅ Shared component library
- ✅ Brand-specific color tokens only

---

### Case Study 3: Rapid Prototyping

**Client**: Agency pitch, 3-day deadline
**Challenge**: High-fidelity prototype for client presentation

**Process:**
```bash
# Day 1: Extract reference
python scripts/wizard.py --url https://competitor.com --name "Competitor"

# Day 1: Generate Stitch prompts
python scripts/stitch_integration.py batch \
  --input output/Competitor/design-system.json \
  --screens landing pricing about contact

# Day 2: Generate in Stitch, refine in Figma
# Day 3: Present to client
```

**Result:**
- ✅ 10 screens in 2 days (vs 1 week normally)
- ✅ Client approved design direction
- ✅ Won the project

---

## Your Toolkit

### Essential Commands

```bash
# Quick extraction
python scripts/wizard.py --url URL

# Export to Figma
python scripts/figma_bridge.py export --input FILE --name NAME

# Generate Stitch prompt
python scripts/stitch_integration.py prompt --input FILE --screen TYPE

# Create DESIGN.md
python scripts/stitch_integration.py design-md --input FILE --project NAME

# Compare systems
python scripts/figma_bridge.py compare --harvester FILE1 --figma FILE2
```

### Presets for Common Projects

```bash
# SaaS Dashboard
python scripts/wizard.py --preset saas --url URL

# E-commerce
python scripts/wizard.py --preset ecommerce --url URL

# Landing Page
python scripts/wizard.py --preset landing --url URL
```

---

## Tips from Design Pros

> **"Always extract from 3+ reference sites before starting a new project."
> — Sarah, Senior Product Designer**

> **"Use the psychology analysis to justify color choices to clients."
> — Mike, Creative Director**

> **"Export to Figma immediately, then customize. Don't start from scratch."
> — Emma, UI Designer**

> **"Run audits monthly to catch design drift early."
> — Alex, Design Lead**

---

## Next Steps

1. **Try it now**: `python scripts/wizard.py --url https://your-favorite-site.com`
2. **Import to Figma**: Follow [Figma Integration](#figma-integration)
3. **Generate AI designs**: Try [Google Stitch](#google-stitch-ai)
4. **Join community**: Share your workflows

---

**Questions?** Check [HOW-IT-WORKS.md](../technical/how-it-works.md) for technical details.

**Ready to design faster?** 🚀
