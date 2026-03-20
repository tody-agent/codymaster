# How UX Master v4 Works 🔬

> **Deep technical dive into the extraction pipeline, AI analysis, and code generation.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         UX Master v4 Pipeline                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INPUT                      PROCESSING                    OUTPUT       │
│                                                                         │
│  ┌──────────┐              ┌─────────────┐            ┌─────────────┐  │
│  │ Website  │─────────────▶│  Browser    │───────────▶│ Screenshots │  │
│  │   URL    │              │  Crawler    │            │   & HTML    │  │
│  └──────────┘              └─────────────┘            └──────┬──────┘  │
│                                                              │         │
│                                                              ▼         │
│                                                 ┌────────────────────┐ │
│                                                 │   AI Extractor     │ │
│                                                 │  (harvester_v4.js) │ │
│                                                 └─────────┬──────────┘ │
│                                                           │            │
│                                                           ▼            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    RAW HARVEST DATA                              │   │
│  │  • Color histograms (frequency-based)                            │   │
│  │  • Component geometries (position, size)                         │   │
│  │  • Typography metrics                                            │   │
│  │  • Layout grids                                                  │   │
│  │  • Page type classification                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SEMI DESIGN MAPPER                            │   │
│  │  • Map → 150+ CSS variables (--semi-color-*, --semi-spacing-*)   │   │
│  │  • Derive 7-state color variants (hover/active/disabled/etc)     │   │
│  │  • Generate chart palette (20 colors)                            │   │
│  │  • Create Figma tokens (W3C format)                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   COMPONENT GENERATOR                            │   │
│  │  • Blueprint → React/Vue/Semi/shadcn code                        │   │
│  │  • TypeScript definitions                                        │   │
│  │  • Tailwind CSS classes                                          │   │
│  │  • Props interfaces                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         OUTPUTS                                  │   │
│  │  📄 design-system.css    (150+ CSS variables)                    │   │
│  │  📄 design-system.json   (Structured tokens)                     │   │
│  │  📄 figma-tokens.json    (Tokens Studio format)                  │   │
│  │  📄 DESIGN.md            (Stitch-compatible)                     │   │
│  │  📁 components/          (React/Vue/Semi/shadcn)                 │   │
│  │  📄 index.html           (Visual preview)                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Browser Extraction

### What Happens

```python
# scripts/harvester_browser.py

class HarvesterBrowser:
    async def extract(self, url: str) -> HarvestResult:
        """
        1. Launch headless Chromium
        2. Navigate to URL
        3. Wait for visual stability
        4. Inject harvester_v4.js
        5. Execute AI extraction
        6. Capture screenshot
        7. Return structured data
        """
```

### Code Walkthrough

```python
async def extract(self, url: str, wait_seconds: int = 3):
    # 1. Launch browser
    browser = await chromium.launch(headless=True)
    page = await browser.new_page(
        viewport={'width': 1440, 'height': 900}
    )
    
    # 2. Navigate and wait
    await page.goto(url, wait_until='networkidle')
    await asyncio.sleep(wait_seconds)  # Let JS animations finish
    
    # 3. Inject extraction engine
    harvester_script = Path('harvester_v4.js').read_text()
    await page.add_script_tag(content=harvester_script)
    
    # 4. Execute extraction
    result = await page.evaluate('''() => {
        return window.harvesterV4.extract({
            includeColors: true,
            includeTypography: true,
            includeComponents: true
        });
    }''')
    
    # 5. Capture screenshot for verification
    screenshot = await page.screenshot(full_page=True)
    
    return {
        'data': result,
        'screenshot': screenshot,
        'url': url,
        'timestamp': time.time()
    }
```

### Key Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| **Headless Browser** | Playwright Chromium | Accurate rendering |
| **Visual Stability** | `wait_seconds` parameter | Let animations finish |
| **Mobile Detection** | Viewport emulation | Responsive design analysis |
| **Error Resilience** | Try/catch in browser | Handle broken sites |

---

## Stage 2: AI Extraction (harvester_v4.js)

### Core Algorithm

```javascript
// harvester_v4.js - Visual Extraction Engine

class HarvesterV4 {
    extract(options) {
        return {
            // Visual Analysis
            colors: this.extractColors(),
            typography: this.extractTypography(),
            spacing: this.extractSpacing(),
            components: this.extractComponents(),
            
            // Structural
            layout: this.analyzeLayout(),
            pageType: this.detectPageType(),
            
            // Metadata
            _version: 4,
            _timestamp: Date.now()
        };
    }
    
    // ========================================
    // COLOR EXTRACTION
    // ========================================
    
    extractColors() {
        const elements = document.querySelectorAll('*');
        const frequency = new Map();
        
        // Collect all colors
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            const text = style.color;
            const border = style.borderColor;
            
            [bg, text, border].forEach(color => {
                if (color && color !== 'transparent') {
                    frequency.set(color, (frequency.get(color) || 0) + 1);
                }
            });
        });
        
        // Sort by frequency
        const sorted = [...frequency.entries()]
            .sort((a, b) => b[1] - a[1]);
        
        return {
            histogram: {
                background: sorted.slice(0, 20),
                text: this.getTextColors(sorted),
                border: this.getBorderColors(sorted)
            },
            dominant: this.extractDominant(sorted)
        };
    }
    
    extractNeutrals(histogram) {
        // Extract gray scale (50-900)
        const grays = histogram.filter(([color, count]) => {
            const rgb = this.parseRGB(color);
            return this.isGray(rgb);  // R ≈ G ≈ B
        });
        
        // Map to 10-step scale
        return {
            50: this.lightest(grays),
            100: this.step(grays, 0.1),
            200: this.step(grays, 0.2),
            // ... 300-800
            900: this.darkest(grays)
        };
    }
    
    // ========================================
    // COMPONENT DETECTION
    // ========================================
    
    extractComponents() {
        const blueprints = [];
        
        // Button detection
        document.querySelectorAll('button, [role="button"], .btn, .button')
            .forEach(el => {
                blueprints.push(this.analyzeButton(el));
            });
        
        // Input detection
        document.querySelectorAll('input, textarea, select, [contenteditable]')
            .forEach(el => {
                blueprints.push(this.analyzeInput(el));
            });
        
        // Card detection
        document.querySelectorAll('.card, [class*="card"], .panel, .box')
            .forEach(el => {
                blueprints.push(this.analyzeCard(el));
            });
        
        return { blueprints, count: blueprints.length };
    }
    
    analyzeButton(el) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        return {
            type: 'button',
            geometry: {
                width: rect.width,
                height: rect.height,
                padding: {
                    top: style.paddingTop,
                    right: style.paddingRight,
                    bottom: style.paddingBottom,
                    left: style.paddingLeft
                }
            },
            visual: {
                backgroundColor: style.backgroundColor,
                color: style.color,
                borderRadius: style.borderRadius,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight
            },
            variants: this.inferVariants(el)
        };
    }
    
    // ========================================
    // TYPOGRAPHY EXTRACTION
    // ========================================
    
    extractTypography() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const body = document.querySelectorAll('p, span, div');
        
        return {
            headings: [...headings].map(h => ({
                level: h.tagName,
                fontSize: this.getComputedSize(h),
                fontWeight: this.getComputedWeight(h),
                lineHeight: this.getComputedLineHeight(h),
                fontFamily: this.getComputedFont(h)
            })),
            body: {
                fontSize: this.mode([...body].map(this.getComputedSize)),
                lineHeight: this.mode([...body].map(this.getComputedLineHeight)),
                fontFamily: this.mode([...body].map(this.getComputedFont))
            }
        };
    }
    
    // ========================================
    // PAGE TYPE DETECTION
    // ========================================
    
    detectPageType() {
        const url = window.location.pathname;
        const patterns = {
            dashboard: /dashboard|home|overview|analytics/,
            settings: /setting|config|preference/,
            auth: /login|signin|register|signup|auth/,
            profile: /profile|account|user/,
            listing: /list|grid|table|data/,
            detail: /detail|view|item/,
            landing: /^\/$|^\/home$/
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(url)) return type;
        }
        
        // Fallback: analyze content structure
        if (document.querySelectorAll('table, .grid, .list').length > 3) {
            return 'listing';
        }
        if (document.querySelectorAll('form').length > 2) {
            return 'form';
        }
        
        return 'generic';
    }
}
```

### Extraction Output Format

```json
{
  "visualAnalysis": {
    "colors": {
      "histogram": {
        "background": [
          ["rgb(255, 255, 255)", 452],
          ["rgb(249, 250, 251)", 234],
          ["rgb(0, 100, 250)", 89]
        ]
      },
      "neutrals": {
        "50": "#F9FAFB",
        "100": "#F3F4F6",
        "500": "#6B7280",
        "900": "#111827"
      },
      "dominant": {
        "primary": "#0064FA",
        "background": "#FFFFFF",
        "surface": "#F9FAFB"
      }
    },
    "typography": {
      "headings": [
        {"level": "H1", "fontSize": "32px", "fontWeight": "600"},
        {"level": "H2", "fontSize": "24px", "fontWeight": "600"},
        {"level": "H3", "fontSize": "20px", "fontWeight": "500"}
      ],
      "body": {
        "fontSize": "14px",
        "lineHeight": "1.5",
        "fontFamily": "Inter, -apple-system, sans-serif"
      }
    },
    "components": {
      "blueprints": [
        {
          "type": "button",
          "geometry": {"width": 120, "height": 40},
          "visual": {
            "backgroundColor": "#0064FA",
            "color": "#FFFFFF",
            "borderRadius": "6px"
          }
        }
      ]
    }
  },
  "pageType": "dashboard",
  "_version": 4
}
```

---

## Stage 3: Semi Design Token Mapping

### Mapping Algorithm

```python
# scripts/token_mapper.py

class SemiDesignMapper:
    """
    Maps raw harvest data to Semi Design CSS variable specification.
    Generates ~150 CSS variables.
    """
    
    def map_to_semi_tokens(self, harvest_data: dict) -> dict:
        tokens = {
            'color': self.map_colors(harvest_data['colors']),
            'typography': self.map_typography(harvest_data['typography']),
            'spacing': self.map_spacing(harvest_data['spacing']),
            'border': self.map_borders(harvest_data['borders']),
            'shadow': self.map_shadows(harvest_data['shadows'])
        }
        return tokens
    
    def map_colors(self, colors: dict) -> dict:
        """
        Generate 7-state color variants for each base color.
        
        States: default, hover, active, disabled, light, light-hover, dark
        """
        base_primary = colors['dominant']['primary']
        
        return {
            # Primary color with 7 states
            'primary': base_primary,
            'primary-hover': self.darken(base_primary, 0.1),
            'primary-active': self.darken(base_primary, 0.2),
            'primary-disabled': self.fade(base_primary, 0.35),
            'primary-light': self.lighten(base_primary, 0.4),
            'primary-light-hover': self.lighten(base_primary, 0.35),
            'primary-dark': self.darken(base_primary, 0.3),
            
            # Functional colors
            'success': self.derive_success(base_primary),
            'warning': '#F59E0B',
            'danger': '#EF4444',
            'info': '#3B82F6',
            
            # Neutrals (10 shades)
            'neutral-50': colors['neutrals']['50'],
            'neutral-100': colors['neutrals']['100'],
            # ... 200-800
            'neutral-900': colors['neutrals']['900'],
            
            # Backgrounds
            'bg-0': '#FFFFFF',
            'bg-1': '#F9FAFB',
            'bg-2': '#F3F4F6',
            'bg-3': '#E5E7EB',
            'bg-4': '#D1D5DB',
            
            # Text colors
            'text-0': colors['neutrals']['900'],  # Primary text
            'text-1': colors['neutrals']['600'],  # Secondary
            'text-2': colors['neutrals']['400'],  # Tertiary
            'text-3': colors['neutrals']['300'],  # Disabled
            
            # Borders
            'border': colors['neutrals']['200'],
            'border-strong': colors['neutrals']['300'],
            'border-hover': colors['neutrals']['400'],
            
            # Chart palette (20 colors)
            'chart-blue': '#0064FA',
            'chart-cyan': '#06B6D4',
            'chart-green': '#10B981',
            # ... 17 more
        }
    
    def derive_shades(self, hex_color: str) -> dict:
        """
        Derive 7 color states using HSL manipulation.
        """
        h, s, l = self.hex_to_hsl(hex_color)
        
        return {
            'default': hex_color,
            'hover': self.hsl_to_hex(h, s, max(l - 10, 0)),
            'active': self.hsl_to_hex(h, s, max(l - 20, 0)),
            'disabled': self.hsl_to_hex(h, s * 0.3, l),
            'light': self.hsl_to_hex(h, s, min(l + 40, 95)),
            'light-hover': self.hsl_to_hex(h, s, min(l + 35, 95)),
            'dark': self.hsl_to_hex(h, s, max(l - 30, 0))
        }
    
    def generate_chart_palette(self, base_colors: list) -> dict:
        """
        Generate 20-color palette for data visualization.
        Uses complementary and analogous colors.
        """
        palette = {}
        
        # Primary colors (blue-based)
        palette[0] = base_colors[0]
        palette[1] = self.rotate_hue(base_colors[0], 15)
        palette[2] = self.rotate_hue(base_colors[0], -15)
        
        # Secondary colors
        palette[3] = self.complementary(base_colors[0])
        palette[4] = self.rotate_hue(base_colors[0], 120)  # Triadic
        palette[5] = self.rotate_hue(base_colors[0], -120)
        
        # Analogous extensions
        for i in range(6, 20):
            palette[i] = self.rotate_hue(base_colors[0], i * 18)
        
        return palette
```

### CSS Output Format

```css
/* design-system.css - Auto-generated from extraction */

/* ========================================
   COLORS - 7 States per Base
   ======================================== */
:root {
  /* Primary: Extracted #0064FA */
  --semi-color-primary: #0064FA;
  --semi-color-primary-hover: #0052CC;
  --semi-color-primary-active: #0041A3;
  --semi-color-primary-disabled: rgba(0, 100, 250, 0.35);
  --semi-color-primary-light: #E6F0FF;
  --semi-color-primary-light-hover: #CCE0FF;
  --semi-color-primary-dark: #003366;
  
  /* Success: Derived or extracted */
  --semi-color-success: #10B981;
  --semi-color-success-hover: #059669;
  --semi-color-success-active: #047857;
  --semi-color-success-disabled: rgba(16, 185, 129, 0.35);
  --semi-color-success-light: #D1FAE5;
  --semi-color-success-light-hover: #A7F3D0;
  --semi-color-success-dark: #064E3B;
  
  /* Warning */
  --semi-color-warning: #F59E0B;
  --semi-color-warning-hover: #D97706;
  /* ... */
  
  /* Danger */
  --semi-color-danger: #EF4444;
  --semi-color-danger-hover: #DC2626;
  /* ... */
  
  /* Neutral Scale (50-900) */
  --semi-color-neutral-50: #F9FAFB;
  --semi-color-neutral-100: #F3F4F6;
  --semi-color-neutral-200: #E5E7EB;
  --semi-color-neutral-300: #D1D5DB;
  --semi-color-neutral-400: #9CA3AF;
  --semi-color-neutral-500: #6B7280;
  --semi-color-neutral-600: #4B5563;
  --semi-color-neutral-700: #374151;
  --semi-color-neutral-800: #1F2937;
  --semi-color-neutral-900: #111827;
  
  /* Backgrounds */
  --semi-color-bg-0: #FFFFFF;
  --semi-color-bg-1: #F9FAFB;
  --semi-color-bg-2: #F3F4F6;
  --semi-color-bg-3: #E5E7EB;
  --semi-color-bg-4: #D1D5DB;
  
  /* Text */
  --semi-color-text-0: #111827;  /* Primary */
  --semi-color-text-1: #4B5563;  /* Secondary */
  --semi-color-text-2: #9CA3AF;  /* Tertiary */
  --semi-color-text-3: #D1D5DB;  /* Disabled */
  
  /* Borders */
  --semi-color-border: #E5E7EB;
  --semi-color-border-strong: #D1D5DB;
  --semi-color-border-hover: #9CA3AF;
  
  /* ========================================
     TYPOGRAPHY
     ======================================== */
  --semi-font-family-regular: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --semi-font-family-bold: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Header sizes (extracted from H1-H6) */
  --semi-font-size-header-1: 32px;
  --semi-font-size-header-2: 24px;
  --semi-font-size-header-3: 20px;
  --semi-font-size-header-4: 18px;
  --semi-font-size-header-5: 16px;
  --semi-font-size-header-6: 14px;
  
  /* Body sizes */
  --semi-font-size-regular: 14px;
  --semi-font-size-small: 12px;
  --semi-font-size-large: 16px;
  
  /* Font weights */
  --semi-font-weight-regular: 400;
  --semi-font-weight-bold: 600;
  --semi-font-weight-light: 300;
  
  /* Line heights */
  --semi-line-height-regular: 1.5;
  --semi-line-height-loose: 1.75;
  --semi-line-height-tight: 1.25;
  
  /* ========================================
     SPACING (8px base grid)
     ======================================== */
  --semi-spacing-none: 0;
  --semi-spacing-super-tight: 4px;
  --semi-spacing-tight: 8px;
  --semi-spacing-base-tight: 12px;
  --semi-spacing-base: 16px;
  --semi-spacing-base-loose: 20px;
  --semi-spacing-loose: 24px;
  --semi-spacing-super-loose: 32px;
  
  /* ========================================
     BORDERS
     ======================================== */
  --semi-border-radius-small: 3px;
  --semi-border-radius-medium: 6px;
  --semi-border-radius-large: 12px;
  --semi-border-radius-full: 9999px;
  
  --semi-border-thickness: 1px;
  --semi-border-thickness-control: 1px;
  --semi-border-thickness-control-focus: 2px;
  
  /* ========================================
     SHADOWS
     ======================================== */
  --semi-shadow-elevated: 0 4px 14px rgba(0, 0, 0, 0.1);
  --semi-shadow-knob: 0 2px 4px rgba(0, 0, 0, 0.1);
  --semi-shadow-modal: 0 8px 32px rgba(0, 0, 0, 0.12);
  --semi-shadow-tooltip: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

---

## Stage 4: Component Generation

### Generation Algorithm

```python
# scripts/component_generator.py

class ComponentGenerator:
    """
    Generates framework-specific components from design tokens.
    Supports: React, Vue, Semi Design, shadcn/ui
    """
    
    def generate(self, tokens: dict, framework: str) -> dict:
        """
        Generate all components for specified framework.
        """
        components = {}
        
        # Core components
        for component_type in ['button', 'input', 'card', 'badge']:
            components[component_type] = self.generate_component(
                component_type, 
                tokens, 
                framework
            )
        
        return components
    
    def generate_component(self, type: str, tokens: dict, framework: str) -> str:
        """
        Generate single component with framework-specific code.
        """
        generators = {
            'react-tailwind': self._gen_react_tailwind,
            'semi': self._gen_semi_component,
            'vue': self._gen_vue_component,
            'shadcn': self._gen_shadcn_component
        }
        
        return generators[framework](type, tokens)
    
    def _gen_react_tailwind(self, type: str, tokens: dict) -> str:
        """
        Generate React component with Tailwind CSS.
        """
        if type == 'button':
            return '''
import React from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({{
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick
}}) => {{
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {{
    primary: 'bg-[var(--semi-color-primary)] text-white hover:bg-[var(--semi-color-primary-hover)] active:bg-[var(--semi-color-primary-active)]',
    secondary: 'bg-[var(--semi-color-neutral-100)] text-[var(--semi-color-text-0)] hover:bg-[var(--semi-color-neutral-200)]',
    outline: 'border border-[var(--semi-color-border)] text-[var(--semi-color-text-0)] hover:bg-[var(--semi-color-bg-1)]',
    ghost: 'text-[var(--semi-color-text-0)] hover:bg-[var(--semi-color-bg-1)]',
    danger: 'bg-[var(--semi-color-danger)] text-white hover:bg-[var(--semi-color-danger-hover)]'
  }};
  
  const sizeStyles = {{
    sm: 'px-3 py-1.5 text-sm rounded-[var(--semi-border-radius-small)]',
    md: 'px-4 py-2 text-sm rounded-[var(--semi-border-radius-medium)]',
    lg: 'px-6 py-3 text-base rounded-[var(--semi-border-radius-medium)]'
  }};
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <button
      className={`${{baseStyles}} ${{variantStyles[variant]}} ${{sizeStyles[size]}} ${{disabledStyles}}`}
      disabled={{disabled || loading}}
      onClick={{onClick}}
    >
      {{loading && <span className="mr-2 animate-spin">↻</span>}}
      {{children}}
    </button>
  );
}};
'''
        # ... other component types
```

### Generated Component Structure

```
components/
├── button/
│   ├── component.tsx      # React component
│   ├── index.ts           # Public export
│   └── component.test.tsx # Test file
├── input/
│   ├── component.tsx
│   └── index.ts
├── card/
│   ├── component.tsx
│   └── index.ts
└── index.ts               # Barrel exports
```

---

## Step-by-Step Tutorial: End-to-End

### Tutorial 1: Extract Your First Design System

```bash
# Step 1: Navigate to project
cd /Users/todyle/Library/Mobile\ Documents/com~apple~CloudDocs/Code/AgentSkills/ux-master

# Step 2: Choose a well-designed site
URL="https://linear.app"  # Great example

# Step 3: Run extraction
python scripts/wizard.py --url $URL --name "LinearClone"

# Step 4: Inspect output
ls -la output/LinearClone/
# → design-system.css
# → design-system.json
# → figma-tokens.json
# → components/
# → screenshot-desktop.png
# → index.html (preview)

# Step 5: View preview
open output/LinearClone/index.html

# Step 6: Check tokens
cat output/LinearClone/design-system.json | jq '.tokens.color | keys'
# → primary, success, warning, danger, neutral-50...900, etc.
```

### Tutorial 2: Integrate with React Project

```bash
# Step 1: Create new React app
npx create-react-app my-app --template typescript
cd my-app

# Step 2: Add Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Step 3: Copy extracted files
cp ../ux-master/output/LinearClone/design-system.css src/
cp -r ../ux-master/output/LinearClone/components/* src/components/

# Step 4: Import in index.tsx
cat >> src/index.tsx << 'EOF'
import './design-system.css';
EOF

# Step 5: Use components
cat > src/App.tsx << 'EOF'
import React from 'react';
import { Button, Card, Input } from './components';

function App() {
  return (
    <div className="p-8 bg-[var(--semi-color-bg-1)] min-h-screen">
      <Card variant="elevated">
        <h1 className="text-[var(--semi-color-text-0)] text-2xl mb-4">
          My App
        </h1>
        <Input placeholder="Enter your name" />
        <div className="mt-4">
          <Button variant="primary">Submit</Button>
        </div>
      </Card>
    </div>
  );
}

export default App;
EOF

# Step 6: Run
npm start
```

### Tutorial 3: Multi-Page Crawl

```bash
# Crawl entire site for comprehensive design system
python scripts/wizard.py \
  --url https://stripe.com \
  --name "StripeFull" \
  --crawl \
  --max-pages 20 \
  --wait 5

# Results
ls output/StripeFull/
# → harvest-merged.json       # Combined from all pages
# → pages/                    # Individual page data
#   ├── stripe_com_pricing.json
#   ├── stripe_com_docs.json
#   └── ...

# Analyze merged results
cat output/StripeFull/harvest-merged.json | jq '.summary'
# {
#   "pages_crawled": 20,
#   "unique_buttons": 8,
#   "unique_inputs": 4,
#   "color_consistency": 0.95
# }
```

### Tutorial 4: Figma Integration

```bash
# Step 1: Export to Figma format
python scripts/figma_bridge.py export \
  --input output/LinearClone/design-system.json \
  --name "LinearDesignSystem"

# Step 2: Output created
cat output/LinearClone/figma-tokens.json | jq '. | keys'
# → core, semantic, component

# Step 3: Import to Figma
# 1. Install "Tokens Studio" plugin in Figma
# 2. Open plugin → Import → JSON
# 3. Paste contents of figma-tokens.json
# 4. Apply to your designs

# Step 4: Sync changes later
python scripts/figma_bridge.py compare \
  --harvester new-extraction.json \
  --figma figma-tokens.json \
  > changes.md
```

### Tutorial 5: Custom Component Generation

```bash
# Step 1: Extract reference
python scripts/wizard.py --url https://vercel.com --name "VercelRef"

# Step 2: Generate specific components
python scripts/component_generator.py \
  --input output/VercelRef/design-system.json \
  --component button \
  --framework shadcn \
  --output ./my-components

# Step 3: Inspect generated code
cat my-components/button/component.tsx

# Step 4: Customize
# Edit to match your exact needs

# Step 5: Generate all components
python scripts/component_generator.py \
  --input output/VercelRef/design-system.json \
  --all \
  --framework react-tailwind \
  --output ./components
```

---

## Advanced Topics

### Custom Extraction Rules

```javascript
// Create custom extractor
const customExtractor = {
  // Override color extraction
  extractColors: (elements) => {
    // Your custom logic
    return customColors;
  },
  
  // Add custom component detection
  detectCustomComponents: () => {
    return document.querySelectorAll('.my-custom-widget');
  }
};

// Use with harvester
window.harvesterV4.extract({
  customRules: customExtractor
});
```

### Plugin Architecture

```python
# Create custom processor
class MyCustomProcessor:
    def process(self, harvest_data):
        # Transform data
        return transformed_data

# Register with pipeline
from scripts.token_mapper import TokenMapper

mapper = TokenMapper()
mapper.register_processor('custom', MyCustomProcessor())
```

---

## Troubleshooting Deep Dive

### Issue: Extraction yields wrong colors

**Diagnosis:**
```bash
# Check if CSS is loaded
python -c "
import json
with open('output/debug/harvest.json') as f:
    data = json.load(f)
    # Check computed vs declared colors
    print('Computed:', data['visualAnalysis']['colors']['computed'])
    print('Declared:', data['visualAnalysis']['colors']['declared'])
"

# Solution: Wait longer for CSS
python scripts/wizard.py --url ... --wait 10
```

### Issue: Components not detected

**Diagnosis:**
```bash
# Check what selectors matched
grep -A5 "blueprints" output/*/harvest.json

# Solution: Custom selectors
python scripts/wizard.py --url ... --selectors "[data-testid=button]"
```

---

## Performance Optimization

### Extraction Speed

```bash
# Default (slower, more accurate)
python scripts/wizard.py --url ... --wait 3

# Fast mode (faster, may miss some animations)
python scripts/wizard.py --url ... --wait 0 --no-screenshot

# Parallel extraction
python -c "
from concurrent.futures import ThreadPoolExecutor
import subprocess

urls = ['https://site1.com', 'https://site2.com', 'https://site3.com']

def extract(url):
    subprocess.run(['python', 'scripts/wizard.py', '--url', url])

with ThreadPoolExecutor(3) as ex:
    ex.map(extract, urls)
"
```

### Memory Usage

```python
# For large sites, process in chunks
python scripts/wizard.py \
  --url https://huge-site.com \
  --crawl \
  --max-pages 50 \
  --batch-size 10  # Process 10 pages at a time
```

---

## API Reference

### HarvesterV4 JavaScript API

```typescript
interface HarvesterOptions {
  includeColors?: boolean;      // default: true
  includeTypography?: boolean;  // default: true
  includeSpacing?: boolean;     // default: true
  includeComponents?: boolean;  // default: true
  colorDepth?: number;          // default: 20
  selectorFilter?: string[];    // default: ['button', 'input', ...]
}

interface HarvestResult {
  visualAnalysis: {
    colors: ColorAnalysis;
    typography: TypographyAnalysis;
    spacing: SpacingAnalysis;
    components: ComponentAnalysis;
  };
  layout: LayoutAnalysis;
  pageType: string;
  _version: number;
  _timestamp: number;
}

// Usage
const result = window.harvesterV4.extract(options);
```

### Python API

```python
from scripts.harvester_browser import HarvesterBrowser
from scripts.token_mapper import SemiDesignMapper
from scripts.component_generator import ComponentGenerator

# Extract
browser = HarvesterBrowser()
harvest = await browser.extract("https://example.com")

# Map tokens
mapper = SemiDesignMapper()
tokens = mapper.map_to_semi_tokens(harvest['data'])

# Generate components
generator = ComponentGenerator()
components = generator.generate(tokens, framework='react-tailwind')
```

---

## Contributing

### Adding New Component Types

```python
# scripts/component_generator.py

def generate_component(self, type: str, tokens: dict, framework: str):
    if type == 'calendar':  # New component
        return self._gen_calendar(tokens, framework)
    # ... existing types

def _gen_calendar(self, tokens: dict, framework: str) -> str:
    # Implementation
    pass
```

### Adding New Framework Support

```python
def generate_component(self, type: str, tokens: dict, framework: str):
    generators = {
        # ... existing
        'svelte': self._gen_svelte_component,
        'solid': self._gen_solid_component
    }
    return generators[framework](type, tokens)
```

---

**Ready to master the internals?** 🔬

```bash
# Explore the code
ls scripts/
cat harvester_v4.js | head -100

# Run tests
python scripts/test_harvester_v4.py
```
