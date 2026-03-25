# UX-Master Tutorials

Step-by-step tutorials for common UX-Master workflows.

---

## Tutorial 1: Your First Validation

Learn to validate a design against UX best practices.

### Time: 5 minutes

### Prerequisites

- UX-Master CLI installed
- Sample HTML file (or use example below)

### Step 1: Create Sample HTML

```bash
cat > sample.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; padding: 20px; }
    h1 { font-size: 32px; }
    .btn { 
      background: #0066FF; 
      color: white; 
      padding: 8px 16px;
      border: none;
      font-size: 14px;
    }
    .small-btn {
      padding: 4px 8px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>Welcome</h1>
  <button class="btn">Get Started</button>
  <button class="btn small-btn">Small</button>
</body>
</html>
EOF
```

### Step 2: Run Validation

```bash
uxm validate sample.html --suite mobile
```

### Step 3: Review Results

You'll see output like:

```
Score: 75/100
Passed: 5/7 tests

Failed Tests:
  ⚠ DT-MOB-001: Fitts's Law - Touch Target Size
    Issue: Small button (32px) below minimum
    Fix: Increase to at least 44px height
```

### Step 4: Fix Issues

Edit `sample.html`:

```css
.small-btn {
  padding: 12px 20px;  /* Increased from 4px 8px */
  font-size: 12px;
  min-height: 44px;    /* Added minimum height */
}
```

### Step 5: Re-validate

```bash
uxm validate sample.html --suite mobile
```

**Expected:** Score improves to 90+

### What You Learned

- ✅ How to validate HTML files
- ✅ Reading validation results
- ✅ Fixing common issues
- ✅ Re-validation workflow

---

## Tutorial 2: Design System Generation

Create a complete design system from a description.

### Time: 10 minutes

### Step 1: Describe Your Project

```bash
uxm search "modern healthcare app with calming colors and accessibility focus" \
  --design-system \
  --project-name HealthApp
```

### Step 2: Review Output

You'll see:

```
Generated Design System: HealthApp

Colors:
  Primary: #00A3B4 (Calm teal)
  Secondary: #4ECDC4 (Soft cyan)
  Success: #10B981
  Warning: #F59E0B
  Danger: #EF4444
  
Typography:
  Font: Inter, system-ui
  Scale: 12px, 14px, 16px, 20px, 24px, 32px
  
UX Laws Applied:
  ✓ Color Psychology: Calming blues for healthcare
  ✓ WCAG AA: High contrast text
  ✓ Touch Targets: 48px minimum
```

### Step 3: Save to File

```bash
uxm search "modern healthcare app" \
  --design-system \
  --project-name HealthApp \
  --format markdown \
  --output healthapp-design-system.md
```

### Step 4: View the File

```bash
cat healthapp-design-system.md
```

You'll see a complete design system document:

```markdown
# HealthApp Design System

## Color Palette

### Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #00A3B4 | CTAs, links |
| Secondary | #4ECDC4 | Secondary actions |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Success | #10B981 | Confirmations |
| Warning | #F59E0B | Cautions |
| Danger | #EF4444 | Errors |

## Typography

### Font Stack
```
--font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 32px | 700 | Page titles |
| H2 | 24px | 600 | Section headers |
| Body | 16px | 400 | Body text |

## Spacing

### Base Unit
```
--spacing-unit: 4px;
```

### Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

## UX Guidelines

### Applied Laws
1. **Fitts's Law**: 48px touch targets
2. **Color Psychology**: Calming palette for healthcare
3. **Contrast**: WCAG AA compliant
```

### Step 5: Export to CSS

```bash
uxm search "modern healthcare app" \
  --design-system \
  --format json \
  --output healthapp-tokens.json
```

Now you have tokens ready for development!

### What You Learned

- ✅ Generating design systems from text
- ✅ Understanding AI-generated tokens
- ✅ Exporting to different formats
- ✅ Creating design documentation

---

## Tutorial 3: Website Analysis

Extract and analyze design tokens from any website.

### Time: 15 minutes

### Step 1: Choose a Website

Let's analyze Stripe.com:

```bash
uxm extract https://stripe.com \
  --output stripe-analysis.json \
  --format json
```

### Step 2: Wait for Extraction

The harvester will:
1. Load the website
2. Extract colors, typography, spacing
3. Detect components
4. Analyze accessibility

**Note:** This takes 10-30 seconds

### Step 3: Review Extraction

```bash
cat stripe-analysis.json | jq '.visualAnalysis.colors.semantic'
```

You'll see:

```json
{
  "primary": {
    "base": "#635BFF",
    "psychology": {
      "h": 244,
      "emotion": "professional, reliable",
      "useCase": "primary actions, corporate"
    }
  },
  "success": {
    "base": "#00D4AA"
  }
}
```

### Step 4: Validate Extracted Design

```bash
uxm validate stripe-analysis.json --suite all --format html --output stripe-report.html
```

### Step 5: Open Report

```bash
open stripe-report.html  # macOS
# OR
xdg-open stripe-report.html  # Linux
```

You'll see a visual report with:
- Overall score
- Color palette
- Typography analysis
- Failed tests
- Recommendations

### Step 6: Compare with Your Design

```bash
# Extract your design
uxm extract https://your-site.com --output your-site.json

# Validate both
uxm validate stripe-analysis.json --suite all --format json --output stripe-val.json
uxm validate your-site.json --suite all --format json --output your-val.json

# Compare scores
echo "Stripe: $(cat stripe-val.json | jq '.score')"
echo "Yours: $(cat your-val.json | jq '.score')"
```

### What You Learned

- ✅ Extracting design tokens from websites
- ✅ Understanding harvester output
- ✅ Validating extracted designs
- ✅ Competitive analysis

---

## Tutorial 4: Figma Plugin Workflow

Use UX-Master directly in Figma.

### Time: 10 minutes

### Prerequisites

- Figma Desktop installed
- UX-Master plugin imported
- MCP server running

### Step 1: Start MCP Server

```bash
uxm mcp start
```

### Step 2: Create Test Frame in Figma

1. Open Figma
2. Create new file
3. Draw a frame (Frame 1)
4. Add elements:
   - Heading (H1, 32px)
   - Button (80x32px - intentionally small!)
   - Input field

### Step 3: Open UX-Master Plugin

1. Select Frame 1
2. Plugins → Development → UX-Master
3. Plugin opens

### Step 4: Generate Design System

1. Click **✨ Generate** tab
2. Type: "Fintech dashboard with dark mode"
3. Click **✨ Generate Magic**
4. Wait 2-3 seconds
5. Review generated:
   - Color palette
   - Typography scale
   - Applied UX Laws

### Step 5: Apply to Figma

1. Click **🎨 Apply to Figma**
2. Check Figma Variables panel
3. See new "UX-Master" collection with:
   - Color variables
   - Spacing variables

### Step 6: Validate Your Design

1. Click **✓ Validate** tab
2. Select **Test Suite: Mobile**
3. Click **Run Validation**
4. Review results:

```
Score: 65/100

⚠ Issues Found:
  Critical (1):
    Fitts's Law: Button is 32px (should be 44px)
    
  High (1):
    Input Label: Missing label on input
```

### Step 7: Fix in Figma

1. Resize button to 100x48px
2. Add label above input
3. Re-run validation
4. Score should improve to 85+

### What You Learned

- ✅ Using Figma plugin
- ✅ Generating design systems visually
- ✅ Real-time validation
- ✅ Applying tokens to Figma

---

## Tutorial 5: Component Library Validation

Validate a component library against best practices.

### Time: 20 minutes

### Step 1: Create Component Files

```bash
mkdir component-library
cd component-library
```

Create button component:

```bash
cat > button.json << 'EOF'
{
  "type": "button",
  "variants": ["primary", "secondary", "ghost"],
  "sizes": ["sm", "md", "lg"],
  "states": ["default", "hover", "active", "disabled"],
  "tokens": {
    "height": {
      "sm": 32,
      "md": 40,
      "lg": 48
    },
    "padding": {
      "sm": "8px 12px",
      "md": "12px 20px",
      "lg": "16px 24px"
    }
  }
}
EOF
```

Create input component:

```bash
cat > input.json << 'EOF'
{
  "type": "input",
  "variants": ["text", "password", "email", "number"],
  "states": ["default", "focus", "error", "disabled"],
  "tokens": {
    "height": 40,
    "borderRadius": 6
  }
}
EOF
```

### Step 2: Validate Each Component

```bash
# Validate button
uxm validate button.json --component button --format json --output button-report.json

# Validate input
uxm validate input.json --component input --format json --output input-report.json
```

### Step 3: Review Results

```bash
echo "Button Score: $(cat button-report.json | jq '.score')"
echo "Input Score: $(cat input-report.json | jq '.score')"
```

### Step 4: Create Validation Report

```bash
cat > library-report.md << 'EOF'
# Component Library Validation Report

## Summary
Generated: $(date)

## Button Component
EOF

cat button-report.json | jq -r '"Score: \(.score)/100"' >> library-report.md
cat button-report.json | jq -r '"Passed: \(.passed)/\(.total)"' >> library-report.md

echo "" >> library-report.md
echo "## Input Component" >> library-report.md
cat input-report.json | jq -r '"Score: \(.score)/100"' >> library-report.md
cat input-report.json | jq -r '"Passed: \(.passed)/\(.total)"' >> library-report.md
```

### Step 5: Fix Issues

Button fix:

```bash
cat > button.json << 'EOF'
{
  "type": "button",
  "variants": ["primary", "secondary", "ghost"],
  "sizes": ["sm", "md", "lg"],
  "states": ["default", "hover", "active", "disabled"],
  "tokens": {
    "height": {
      "sm": 36,    // Increased from 32
      "md": 44,    // Increased from 40
      "lg": 52     // Increased from 48
    }
  }
}
EOF
```

### Step 6: Re-validate

```bash
uxm validate button.json --component button --format json --output button-report-v2.json
echo "New Button Score: $(cat button-report-v2.json | jq '.score')"
```

### What You Learned

- ✅ Component-level validation
- ✅ Batch validation
- ✅ Creating validation reports
- ✅ Iterative improvement

---

## Tutorial 6: CI/CD Integration

Add UX validation to your deployment pipeline.

### Time: 15 minutes

### Prerequisites

- GitHub repository
- Basic GitHub Actions knowledge

### Step 1: Create Workflow File

```bash
mkdir -p .github/workflows
cat > .github/workflows/ux-validation.yml << 'EOF'
name: UX Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install UX-Master
        run: pip install uxmaster-cli
      
      - name: Validate Design Tokens
        run: |
          uxm validate design-tokens.json --suite all \
            --format json --output validation-report.json
      
      - name: Check Validation Score
        run: |
          SCORE=$(cat validation-report.json | jq '.score')
          echo "Validation Score: $SCORE"
          
          if (( $(echo "$SCORE < 75" | bc -l) )); then
            echo "❌ Validation score $SCORE is below threshold (75)"
            exit 1
          fi
          
          echo "✅ Validation passed with score $SCORE"
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: ux-validation-report
          path: validation-report.json
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('validation-report.json'));
            
            const body = `## 🎨 UX Validation Report
            
            **Score:** ${report.score.toFixed(1)}/100
            
            **Results:**
            - ✅ Passed: ${report.passed}
            - ❌ Failed: ${report.failed}
            
            ${report.failed > 0 ? '⚠️ Please review failed tests before merging.' : '✅ All tests passed!'}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
EOF
```

### Step 2: Create Sample Tokens

```bash
cat > design-tokens.json << 'EOF'
{
  "visualAnalysis": {
    "colors": {
      "semantic": {
        "primary": {"base": "#0064FA"},
        "success": {"base": "#10B981"},
        "warning": {"base": "#F59E0B"},
        "danger": {"base": "#EF4444"}
      },
      "neutrals": {
        "50": "#F9FAFB", "100": "#F3F4F6", "200": "#E5E7EB",
        "300": "#D1D5DB", "400": "#9CA3AF", "500": "#6B7280",
        "600": "#4B5563", "700": "#374151", "800": "#1F2937", "900": "#111827"
      }
    },
    "typography": {
      "hierarchy": {
        "h1": {"size": "32px", "weight": "700"},
        "h2": {"size": "24px", "weight": "600"},
        "h3": {"size": "20px", "weight": "600"}
      }
    },
    "spacing": {
      "scale": [4, 8, 12, 16, 20, 24, 32]
    }
  },
  "components": {
    "blueprints": {
      "button": {
        "representative": {
          "dimensions": {"width": 100, "height": 44}
        }
      }
    }
  },
  "quality": {
    "accessibility": {
      "contrastIssues": []
    }
  }
}
EOF
```

### Step 3: Commit and Push

```bash
git add .
git commit -m "Add UX validation to CI"
git push origin main
```

### Step 4: Check Action Results

1. Go to GitHub → Actions
2. See "UX Validation" workflow
3. Click on latest run
4. View results:
   - Score displayed
   - Passed/failed tests
   - Artifact uploaded

### Step 5: Test PR Comment

1. Create a branch: `git checkout -b test-validation`
2. Modify tokens to break validation
3. Push and create PR
4. See automated comment with validation results

### What You Learned

- ✅ GitHub Actions integration
- ✅ Automated validation
- ✅ PR comments
- ✅ CI/CD best practices

---

## Tutorial 7: Custom Validation Rules

Extend UX-Master with your own validation rules.

### Time: 20 minutes

### Prerequisites

- Python knowledge
- UX-Master installed

### Step 1: Create Custom Validator

```bash
cat > brand_validator.py << 'EOF'
#!/usr/bin/env python3
"""Custom brand validation for ACME Corp."""

import sys
import json
from pathlib import Path

# Add UX-Master to path
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

from validation_engine import (
    ValidationEngine, DesignTest, TestResult,
    TestCategory, TestSeverity
)

class BrandColorTest(DesignTest):
    """Ensure brand colors are used."""
    
    def __init__(self):
        self.test_id = "BRAND-001"
        self.name = "Brand Color Usage"
        self.category = TestCategory.COLOR
        self.severity = TestSeverity.HIGH
        self.ux_law = "Brand Consistency"
        self.brand_colors = ["#FF6B00", "#003366"]  # ACME brand
    
    def run(self, data):
        colors = data.get("visualAnalysis", {}).get("colors", {})
        semantic = colors.get("semantic", {})
        
        found_brand = []
        for name, color_data in semantic.items():
            base = color_data.get("base", "")
            if base in self.brand_colors:
                found_brand.append(name)
        
        passed = len(found_brand) > 0
        
        return TestResult(
            test_id=self.test_id,
            name=self.name,
            category=self.category,
            severity=self.severity,
            passed=passed,
            message=f"Found brand colors in: {found_brand}" if passed else "No brand colors detected",
            suggestion=f"Use brand colors {self.brand_colors} for primary actions",
            ux_law=self.ux_law
        )

class LogoSpacingTest(DesignTest):
    """Ensure proper logo spacing."""
    
    def __init__(self):
        self.test_id = "BRAND-002"
        self.name = "Logo Clear Space"
        self.category = TestCategory.LAYOUT
        self.severity = TestSeverity.MEDIUM
        self.ux_law = "Brand Guidelines"
    
    def run(self, data):
        layout = data.get("visualAnalysis", {}).get("layout", {})
        header = layout.get("header", {})
        
        # Check if header has adequate height for logo + spacing
        height = header.get("height", 0)
        passed = height >= 64  # Minimum for logo + spacing
        
        return TestResult(
            test_id=self.test_id,
            name=self.name,
            category=self.category,
            severity=self.severity,
            passed=passed,
            message="Adequate logo spacing" if passed else "Header may be too small for logo",
            suggestion="Ensure 16px minimum clear space around logo",
            ux_law=self.ux_law
        )

# Main
def main():
    engine = ValidationEngine()
    
    # Register custom tests
    engine._register(BrandColorTest())
    engine._register(LogoSpacingTest())
    
    # Load data
    with open(sys.argv[1]) as f:
        data = json.load(f)
    
    # Run validation
    report = engine.validate(data, test_suite="all")
    
    # Print results
    print(f"Score: {report.score:.1f}/100")
    print(f"Passed: {report.passed_count}/{report.total_count}")
    
    # Show brand-specific results
    for test in report.tests:
        if test.test_id.startswith("BRAND-"):
            icon = "✓" if test.passed else "✗"
            print(f"{icon} {test.name}: {test.message}")

if __name__ == "__main__":
    main()
EOF

chmod +x brand_validator.py
```

### Step 2: Create Test Data

```bash
cat > brand-test.json << 'EOF'
{
  "visualAnalysis": {
    "colors": {
      "semantic": {
        "primary": {"base": "#FF6B00"},
        "secondary": {"base": "#003366"}
      }
    },
    "layout": {
      "header": {"height": 80}
    }
  }
}
EOF
```

### Step 3: Run Custom Validator

```bash
python brand_validator.py brand-test.json
```

Output:
```
Score: 95.0/100
Passed: 39/41
✓ Brand Color Usage: Found brand colors in: ['primary', 'secondary']
✓ Logo Clear Space: Adequate logo spacing
```

### Step 4: Test Failure

```bash
cat > brand-bad.json << 'EOF'
{
  "visualAnalysis": {
    "colors": {
      "semantic": {
        "primary": {"base": "#0064FA"}
      }
    },
    "layout": {
      "header": {"height": 40}
    }
  }
}
EOF

python brand_validator.py brand-bad.json
```

Output:
```
Score: 87.8/100
✗ Brand Color Usage: No brand colors detected
✗ Logo Clear Space: Header may be too small for logo
```

### What You Learned

- ✅ Creating custom tests
- ✅ Extending Validation Engine
- ✅ Brand-specific validation
- ✅ Integration with existing tests

---

## Next Steps

### Continue Learning

1. **Advanced Validation**
   - Custom test suites
   - Regression testing
   - Performance optimization

2. **Team Integration**
   - Shared configurations
   - Team dashboards
   - Automated reporting

3. **API Development**
   - Custom MCP tools
   - Webhook integrations
   - Third-party plugins

### Resources

- [API Reference](API-REFERENCE.md)
- [User Guide](USER-GUIDE.md)
- [GitHub Examples](https://github.com/uxmaster/examples)
- [Discord Community](https://discord.gg/uxmaster)

---

**Congratulations!** You've completed all tutorials. You're now a UX-Master power user! 🎉
