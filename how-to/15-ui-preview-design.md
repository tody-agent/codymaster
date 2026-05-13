# UI Preview & Design

> Visual concept generation with Stitch and Pencil MCP. This guide teaches you how to create UI previews before implementing.

## Table of Contents

1. [Overview](#overview)
2. [Available Tools](#available-tools)
3. [Stitch Integration](#stitch-integration)
4. [Pencil Integration](#pencil-integration)
5. [When to Use UI Preview](#when-to-use-ui-preview)
6. [Best Practices](#best-practices)

---

## Overview

### Why UI Preview?

- **Validate design** before coding
- **Get stakeholder approval** early
- **Reduce rework** by catching issues early
- **Improve communication** with visual references

### Available Tools

| Tool | Best For | Features |
|------|----------|----------|
| **Stitch** | Quick concepts | Fast generation, AI-powered |
| **Pencil** | Detailed control | Pixel-level control, design system |

---

## Available Tools

### Check Available Tools

```bash
# Check if Stitch is available
/cm-ui-preview --check-stitch

# Check if Pencil is available
/cm-ui-preview --check-pencil

# Check both
/cm-ui-preview --check
```

### Tool Selection Matrix

| Stitch only | Pencil only | Both available |
|-------------|-------------|----------------|
| Use Stitch (fast concept) | Use Pencil (detailed control) | Ask user preference |

---

## Stitch Integration

### When to Use

- Quick visual validation
- Non-technical stakeholders
- Rapid iteration

### Generate Screen

```bash
# Generate a screen from text
/cm-ui-preview --tool stitch --prompt "Login form with email and password fields, modern design"

# This will:
# 1. Create a project
# 2. Generate the screen
# 3. Return the screen URL
```

### Example Prompts

```bash
# Login form
/cm-ui-preview --prompt "Login form with email, password, and remember me checkbox. Modern, clean design with blue accent color."

# Dashboard
/cm-ui-preview --prompt "Analytics dashboard with charts, stats cards, and sidebar navigation. Dark theme."

# Landing page
/cm-ui-preview --prompt "Landing page for SaaS product with hero section, features grid, and CTA button."
```

### Edit Screen

```bash
# Edit existing screen
/cm-ui-preview --tool stitch --edit [screen-id] --prompt "Make the button larger and change color to green"

# Add new screen
/cm-ui-preview --tool stitch --add --prompt "Add a signup page similar to login but with name field"
```

### Variants

```bash
# Generate variants
/cm-ui-preview --tool stitch --variants [screen-id] --prompt "Create 3 variants with different color schemes"

# This will:
# 1. Generate 3 versions
# 2. Apply different colors
# 3. Return all variants
```

---

## Pencil Integration

### When to Use

- Detailed control
- Design system alignment
- Pixel-level precision

### Open Document

```bash
# Open .pen file
/cm-ui-preview --tool pencil --open design.pen

# Or create new
/cm-ui-preview --tool pencil --new
```

### Generate Component

```bash
# Generate component
/cm-ui-preview --tool pencil --prompt "Login form component with email, password fields"

# This will:
# 1. Create component in .pen file
# 2. Follow design guidelines
# 3. Export to code-ready assets
```

### Export to Code

```bash
# Export to code
/cm-ui-preview --tool pencil --export [component-id]

# This generates:
# - React component
# - CSS styles
# - TypeScript types
```

---

## When to Use UI Preview

### Always Use

- **New features** — Validate design before coding
- **Complex UI** — Ensure layout is correct
- **Stakeholder approval** — Get buy-in early
- **Design system** — Maintain consistency

### Consider Using

- **UI changes** — Preview before implementing
- **Responsive design** — Test different screen sizes
- **Accessibility** — Validate color contrast

### Skip When

- **Simple changes** — Button text, small tweaks
- **Backend only** — No UI involved
- **Emergency fixes** — Speed is critical

---

## Best Practices

### 1. Be Specific

```bash
# Bad
/cm-ui-preview --prompt "Make a form"

# Good
/cm-ui-preview --prompt "Login form with email and password fields, remember me checkbox, blue primary button, modern clean design"
```

### 2. Iterate

```bash
# First pass
/cm-ui-preview --prompt "Login form with email and password"

# Refine
/cm-ui-preview --edit [screen-id] --prompt "Make the button larger and add loading state"

# Finalize
/cm-ui-preview --edit [screen-id] --prompt "Add error states for invalid email and wrong password"
```

### 3. Get Feedback

```bash
# Share preview
/cm-ui-preview --share [screen-id]

# This generates a shareable URL
# Send to stakeholders for approval
```

### 4. Document Decisions

```bash
# Save design decision
cm_natural("remember that login form uses blue primary color (#3B82F6)")

# This ensures consistency
```

### 5. Use Design System

```bash
# Apply design system
/cm-ui-preview --apply-design-system [screen-id]

# This ensures:
# - Consistent colors
# - Consistent typography
# - Consistent spacing
```

---

## Example: Complete UI Preview

### Scenario: Login page

#### Step 1: Generate Concept

```bash
/cm-ui-preview --prompt "Login page for SaaS app with email and password fields, remember me checkbox, forgot password link, blue primary button, modern clean design"

# Output:
# Screen generated: https://stitch.example.com/screen/abc123
```

#### Step 2: Get Feedback

```bash
# Share with team
/cm-ui-preview --share abc123

# Feedback: "Add social login buttons"
```

#### Step 3: Iterate

```bash
/cm-ui-preview --edit abc123 --prompt "Add Google and GitHub login buttons below the form"

# Output:
# Screen updated: https://stitch.example.com/screen/abc123
```

#### Step 4: Finalize

```bash
# Apply design system
/cm-ui-preview --apply-design-system abc123

# Export for development
/cm-ui-preview --export abc123

# Output:
# - src/components/auth/LoginPage.tsx
# - src/components/auth/LoginPage.css
# - src/types/auth.ts
```

#### Step 5: Implement

```bash
# Use exported code as reference
/cm-execution --task "Implement login page based on design"

# The implementation will match the preview
```

---

## Next Steps

- [Knowledge Management](./16-knowledge-management.md) — Document design decisions
- [New Feature Development](./04-feature-development.md) — Implement designs
- [Code Review Process](./06-code-review.md) — Review implementation
