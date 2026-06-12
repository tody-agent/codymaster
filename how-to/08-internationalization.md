# Internationalization (i18n)

> Safe multi-language management with 8-gate audit system. This guide teaches you how to implement and maintain internationalization in your project.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Extracting Strings](#extracting-strings)
4. [Translating Content](#translating-content)
5. [8-Gate Audit System](#8-gate-audit-system)
6. [Adding New Languages](#adding-new-languages)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is i18n?

Internationalization (i18n) is the process of designing your application to support multiple languages and regions without engineering changes.

### Why Use cm-safe-i18n?

- **Multi-pass batching** — Process translations in batches
- **Parallel-per-language** — Translate multiple languages simultaneously
- **8-gate audit** — Comprehensive quality checks
- **HTML integrity** — Ensure translations don't break UI

### When to Use

- **New projects** — Set up i18n from Day 0
- **Existing projects** — Add multi-language support
- **Content updates** — Translate new features
- **Localization** — Adapt for specific regions

---

## Setup

### Step 1: Choose i18n Framework

| Framework | Best For | Setup |
|-----------|----------|-------|
| **next-intl** | Next.js apps | `npm install next-intl` |
| **react-i18next** | React apps | `npm install react-i18next` |
| **vue-i18n** | Vue apps | `npm install vue-i18n` |
| **next-intl** | Astro apps | `npm install next-intl` |

### Step 2: Initialize cm-safe-i18n

```bash
# Run the i18n setup
/cm-safe-i18n init

# The skill will:
# 1. Detect your framework
# 2. Set up configuration
# 3. Create locale files
# 4. Configure build scripts
```

### Step 3: Project Structure

```
messages/
├── en.json              # English
├── vi.json              # Vietnamese
└── ja.json              # Japanese

src/
├── i18n/
│   ├── config.ts        # i18n configuration
│   └── request.ts       # Request configuration
└── app/
    └── [locale]/
        ├── layout.tsx   # Locale-aware layout
        └── page.tsx     # Locale-aware page
```

---

## Extracting Strings

### Manual Extraction

```bash
# Extract hardcoded strings from components
/cm-safe-i18n extract --dir src/components

# This will:
# 1. Scan all files in directory
# 2. Find hardcoded strings
# 3. Generate translation keys
# 4. Update locale files
```

### Example Extraction

**Before:**

```tsx
// src/components/LoginForm.tsx
export function LoginForm() {
  return (
    <form>
      <h1>Login</h1>
      <label>Email</label>
      <input type="email" placeholder="Enter your email" />
      <label>Password</label>
      <input type="password" placeholder="Enter your password" />
      <button>Sign In</button>
      <p>Don't have an account? Sign up</p>
    </form>
  )
}
```

**After:**

```json
// messages/en.json
{
  "login": {
    "title": "Login",
    "email": "Email",
    "emailPlaceholder": "Enter your email",
    "password": "Password",
    "passwordPlaceholder": "Enter your password",
    "submit": "Sign In",
    "noAccount": "Don't have an account?",
    "signUp": "Sign up"
  }
}
```

```tsx
// src/components/LoginForm.tsx
'use client'

import { useTranslations } from 'next-intl'

export function LoginForm() {
  const t = useTranslations('login')
  
  return (
    <form>
      <h1>{t('title')}</h1>
      <label>{t('email')}</label>
      <input type="email" placeholder={t('emailPlaceholder')} />
      <label>{t('password')}</label>
      <input type="password" placeholder={t('passwordPlaceholder')} />
      <button>{t('submit')}</button>
      <p>{t('noAccount')} <a href="/signup">{t('signUp')}</a></p>
    </form>
  )
}
```

### Batch Extraction

```bash
# Extract from multiple directories
/cm-safe-i18n extract --dir src/components src/pages src/utils

# Extract with specific patterns
/cm-safe-i18n extract --pattern "hardcoded strings"
```

---

## Translating Content

### Manual Translation

```bash
# Translate a specific file
/cm-safe-i18n translate --file messages/en.json --to vi

# This will:
# 1. Read source language
# 2. Translate each string
# 3. Preserve formatting
# 4. Write to target file
```

### Batch Translation

```bash
# Translate all files
/cm-safe-i18n translate --all

# Translate to specific languages
/cm-safe-i18n translate --to vi,ja,ko

# With AI provider
/cm-safe-i18n translate --provider gemini --model gemini-3-pro
```

### Translation Quality

```bash
# Review translations
/cm-safe-i18n review --file messages/vi.json

# Check for:
# - Consistent terminology
# - Natural phrasing
# - Cultural appropriateness
# - Technical accuracy
```

---

## 8-Gate Audit System

### Gate 1: File Structure

```bash
# Check file structure
/cm-safe-i18n audit --gate structure

# Checks:
# - All locale files exist
# - File names follow convention
# - Directory structure correct
```

### Gate 2: Key Completeness

```bash
# Check all keys are translated
/cm-safe-i18n audit --gate completeness

# Checks:
# - All source keys have translations
# - No missing keys
# - No extra keys
```

### Gate 3: Placeholder Integrity

```bash
# Check placeholders are preserved
/cm-safe-i18n audit --gate placeholders

# Checks:
# - All placeholders {name} preserved
# - No extra placeholders
# - No missing placeholders
```

### Gate 4: HTML Integrity

```bash
# Check HTML tags are preserved
/cm-safe-i18n audit --gate html

# Checks:
# - All HTML tags preserved
# - No broken tags
# - No extra tags
```

### Gate 5: Formatting

```bash
# Check formatting is preserved
/cm-safe-i18n audit --gate formatting

# Checks:
# - Number formatting correct
# - Date formatting correct
# - Currency formatting correct
```

### Gate 6: Pluralization

```bash
# Check pluralization rules
/cm-safe-i18n audit --gate pluralization

# Checks:
# - Plural forms correct
# - Count rules applied
# - Gender rules applied
```

### Gate 7: Context

```bash
# Check context is preserved
/cm-safe-i18n audit --gate context

# Checks:
# - Context markers preserved
# - Disambiguation correct
# - Tone appropriate
```

### Gate 8: Build Verification

```bash
# Check build works
/cm-safe-i18n audit --gate build

# Checks:
# - No missing keys in build
# - No unused keys
# - Build succeeds
```

### Run All Gates

```bash
# Run all 8 gates
/cm-safe-i18n audit --all

# Or run specific gates
/cm-safe-i18n audit --gates structure,completeness,placeholders
```

---

## Adding New Languages

### Step 1: Create Locale File

```bash
# Create new locale file
/cm-safe-i18n add-locale --code ja --name Japanese

# This will:
# 1. Create messages/ja.json
# 2. Copy structure from source
# 3. Add to i18n config
```

### Step 2: Translate Content

```bash
# Translate to new language
/cm-safe-i18n translate --file messages/en.json --to ja

# Review translations
/cm-safe-i18n review --file messages/ja.json
```

### Step 3: Update Configuration

```typescript
// src/i18n/config.ts
export const locales = ['en', 'vi', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
```

### Step 4: Test

```bash
# Run tests
npm run test:run

# Test in browser
# Visit /ja to see Japanese content
```

---

## Common Patterns

### Pattern 1: Dynamic Keys

```tsx
// Use dynamic keys for similar content
const t = useTranslations('products')

// Instead of:
// t('product1Name')
// t('product2Name')
// t('product3Name')

// Use:
const productNames = ['product1', 'product2', 'product3']
productNames.map(name => t(`${name}Name`))
```

### Pattern 2: Pluralization

```json
// messages/en.json
{
  "items": {
    "zero": "No items",
    "one": "1 item",
    "other": "{count} items"
  }
}
```

```tsx
// Usage
const t = useTranslations('items')
t('items', { count: 0 })  // "No items"
t('items', { count: 1 })  // "1 item"
t('items', { count: 5 })  // "5 items"
```

### Pattern 3: Interpolation

```json
// messages/en.json
{
  "greeting": "Hello, {name}!"
}
```

```tsx
// Usage
const t = useTranslations('greeting')
t('greeting', { name: 'John' })  // "Hello, John!"
```

### Pattern 4: Nested Keys

```json
// messages/en.json
{
  "auth": {
    "login": {
      "title": "Login",
      "submit": "Sign In"
    },
    "logout": {
      "title": "Logout",
      "confirm": "Are you sure?"
    }
  }
}
```

```tsx
// Usage
const t = useTranslations('auth.login')
t('title')   // "Login"
t('submit')  // "Sign In"
```

### Pattern 5: HTML Content

```json
// messages/en.json
{
  "terms": "By signing up, you agree to our <a href=\"/terms\">Terms of Service</a>"
}
```

```tsx
// Usage
const t = useTranslations('terms')
<p dangerouslySetInnerHTML={{ __html: t('terms') }} />
```

---

## Troubleshooting

### Common Issues

#### Missing Keys

```bash
# Check for missing keys
/cm-safe-i18n audit --gate completeness

# Output:
# Missing keys in ja.json:
# - login.title
# - login.submit

# Fix:
/cm-safe-i18n translate --file messages/en.json --to ja
```

#### Placeholder Mismatch

```bash
# Check placeholders
/cm-safe-i18n audit --gate placeholders

# Output:
# Placeholder mismatch in vi.json:
# - greeting: Expected {name}, found {ten}

# Fix:
# Edit messages/vi.json to fix placeholder
```

#### Build Errors

```bash
# Check build
npm run build

# Error: Missing message for "login.title" in "ja"

# Fix:
/cm-safe-i18n translate --file messages/en.json --to ja
npm run build
```

#### HTML Breaking

```bash
# Check HTML
/cm-safe-i18n audit --gate html

# Output:
# Broken HTML in vi.json:
# - terms: Missing closing </a> tag

# Fix:
# Edit messages/vi.json to fix HTML
```

### Debug Commands

```bash
# Check current locale
/cm-safe-i18n status

# List all locales
/cm-safe-i18n list-locales

# Check specific key
/cm-safe-i18n get --key login.title --locale ja

# Validate all files
/cm-safe-i18n validate --all
```

---

## Example: Complete i18n Implementation

### Step 1: Setup

```bash
# Initialize i18n
/cm-safe-i18n init

# Extract strings
/cm-safe-i18n extract --dir src
```

### Step 2: Translate

```bash
# Translate to Vietnamese
/cm-safe-i18n translate --to vi

# Translate to Japanese
/cm-safe-i18n translate --to ja
```

### Step 3: Audit

```bash
# Run all gates
/cm-safe-i18n audit --all

# Output:
# ✅ Gate 1: File structure - PASSED
# ✅ Gate 2: Key completeness - PASSED
# ✅ Gate 3: Placeholder integrity - PASSED
# ✅ Gate 4: HTML integrity - PASSED
# ✅ Gate 5: Formatting - PASSED
# ✅ Gate 6: Pluralization - PASSED
# ✅ Gate 7: Context - PASSED
# ✅ Gate 8: Build verification - PASSED
```

### Step 4: Test

```bash
# Run tests
npm run test:run

# Test in browser
# Visit / to see English
# Visit /vi to see Vietnamese
# Visit /ja to see Japanese
```

### Step 5: Deploy

```bash
# Deploy
/cm-safe-deploy

# Verify
cm deploy open
```

---

## Next Steps

- [Safe Deployment Pipeline](./09-safe-deploy.md) — Deploy i18n changes
- [Content Factory Pipeline](./07-content-factory.md) — Create translated content
- [Knowledge Management](./16-knowledge-management.md) — Manage translations
