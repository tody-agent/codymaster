---
name: tailwind-mastery
description: 'Master Tailwind CSS utilities, responsive design, and accessibility patterns. Use when the user mentions "Tailwind", "Tailwind CSS", "utility-first", "responsive design", "dark mode", "focus-visible", "motion-reduce", or "Tailwind v4". Covers utility patterns, layout, responsive design, components, accessibility, and performance. For React styling, see react-mastery. For design systems, see refactoring-ui.'
license: MIT
metadata:
  author: todyle
  version: "1.0.0"
---

# Tailwind CSS Mastery Framework

A comprehensive guide to building production UIs with Tailwind CSS utilities, responsive patterns, accessibility, and performance optimization. Apply these principles when styling web applications, building component libraries, implementing dark mode, or optimizing CSS output.

## Core Principle

**Utility-first CSS means composing designs directly in HTML with small, single-purpose classes.** Instead of writing custom CSS for every component, you combine utilities (`flex`, `items-center`, `p-4`, `text-lg`) to build designs. This eliminates naming fatigue, CSS specificity wars, and dead CSS. Every class you see describes exactly what it does.

**The foundation:** Tailwind works because most CSS is repeated — the same spacing, colors, and typography patterns appear throughout an application. Utilities express these patterns directly. The build tool strips unused classes, resulting in tiny production CSS. The key is working within Tailwind's design system (spacing scale, color palette, breakpoints) rather than escaping it with arbitrary values.

## Scoring

**Goal: 10/10.** When reviewing Tailwind code, rate 0-10:

- **9-10:** Mobile-first responsive, dark mode, focus-visible, motion-reduce, semantic color naming, consistent spacing scale
- **7-8:** Good utility usage with minor issues (arbitrary values for scale values, missing dark mode, inconsistent spacing)
- **5-6:** Working styles but overusing @apply, arbitrary values abundant, no responsive design
- **3-4:** Tailwind as CSS-in-HTML (every value arbitrary), no dark mode, no accessibility
- **1-2:** Fighting Tailwind with custom CSS, important! everywhere, no design system

## The Tailwind Mastery Framework

Six disciplines for production Tailwind CSS:

### 1. Utility Patterns & Design System

**Core concept:** Use Tailwind's design tokens (spacing scale, color palette, font sizes) instead of arbitrary values. The spacing scale (4px increments: `p-1`=4px, `p-2`=8px, `p-4`=16px) creates visual consistency. Extend the design system via `tailwind.config.js` for brand colors, not with arbitrary `[]` values.

**Why it works:** Constraints breed consistency. When everyone uses `gap-4` instead of `gap-[15px]`, spacing is uniform across the entire application. The predefined scale means fewer design decisions and faster development. Custom theme values (`bg-primary`, `text-success`) encode brand semantics.

**Key insights:**
- Spacing scale: `p-1`=4px, `p-2`=8px, `p-4`=16px, `p-6`=24px, `p-8`=32px
- Use scale values over arbitrary: `gap-6` not `gap-[23px]`
- Color opacity: `bg-black/50` (50% opacity) instead of separate `opacity-50`
- `space-y-4` for vertical lists — adds margin between children
- `size-6` shorthand for equal width+height (Tailwind v4)
- `shrink-0` shorthand (v4) instead of `flex-shrink-0`
- Extend theme for brand colors: `bg-primary`, `text-cta`, `border-success`
- `bg-linear-to-r` (v4) replaces `bg-gradient-to-r`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Spacing** | Scale values | `p-4 m-6 gap-8` |
| **Color opacity** | Slash syntax | `bg-black/50 text-white/80` |
| **List spacing** | space-y | `<div class="space-y-4">` |
| **Brand color** | Theme extend | `bg-primary text-on-primary` |
| **Square element** | size utility | `size-8` (= `h-8 w-8`) |
| **Gradient** | bg-linear (v4) | `bg-linear-to-r from-blue-500 to-purple-500` |

### 2. Layout

**Core concept:** Container with `max-w-7xl mx-auto` for content width. `flex` for one-dimensional, `grid` for two-dimensional layouts. Responsive padding `px-4 md:px-6 lg:px-8`. Container queries `@container` for component-level responsiveness.

**Why it works:** `max-w-7xl mx-auto` prevents content from stretching to unreadable widths on large screens. `gap-*` replaces manual margins on grid/flex children, simplifying layout code. Container queries enable components to respond to their container size rather than the viewport — essential for reusable components.

**Key insights:**
- `max-w-7xl mx-auto px-4` for main content container
- `flex items-center justify-between` — most common header pattern
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` for responsive grid
- `gap-*` on flex/grid containers, not margins on children
- Responsive padding: `px-4 sm:px-6 lg:px-8`
- `@container` + `@lg:grid-cols-2` for component-level responsive (v3.2+)
- Negative margins sparingly: `-mt-8` for intentional overlapping effects

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Container** | max-w + padding | `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">` |
| **Flex row** | items-center | `<nav class="flex items-center justify-between h-16">` |
| **Grid** | Responsive cols | `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">` |
| **Container query** | @container | `<div class="@container"><div class="@lg:grid-cols-2">` |

### 3. Responsive Design

**Core concept:** Mobile-first — write base styles for mobile, add breakpoints for larger screens via `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes. Test at all breakpoints: 320, 375, 768, 1024, 1280, 1536px. Use `hidden md:block` for visibility control.

**Why it works:** Mobile-first ensures the smallest, most constrained screens get attention first. Adding complexity for larger screens is natural — hiding sidebar on mobile, showing it on desktop. This approach also results in smaller CSS because mobile styles don't need breakpoint prefixes.

**Key insights:**
- Base styles = mobile. Breakpoints add desktop enhancements
- `text-sm md:text-base lg:text-lg` — progressive text sizing
- `hidden md:flex` — hide on mobile, show on desktop
- `flex-col md:flex-row` — stack on mobile, row on desktop
- Test at 320px (smallest iPhone SE) — don't ignore small screens
- `aspect-video` with `object-cover` for responsive media
- `srcset` with `sizes` attribute for responsive images (HTML, not Tailwind)

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Mobile-first** | Base + breakpoint | `<h1 class="text-2xl md:text-4xl lg:text-5xl">` |
| **Show/hide** | hidden + display | `<nav class="hidden md:flex">` (mobile menu alternative) |
| **Stack → row** | Direction change | `<div class="flex flex-col md:flex-row gap-4">` |
| **Responsive image** | aspect + object | `<img class="aspect-video object-cover w-full rounded-xl">` |
| **Responsive padding** | Breakpoint padding | `<main class="px-4 sm:px-6 lg:px-8">` |

### 4. Components

**Core concept:** Buttons need consistent sizing (`px-4 py-2`), minimum touch targets on mobile (`min-h-[44px]`), loading states, and proper icon button labels. Cards use `rounded-lg shadow-md` with hover feedback. Forms need visible focus indicators (`focus:ring-2`), disabled states, and keyboard accessibility.

**Why it works:** Consistency in component sizing creates visual rhythm. Touch targets of 44px minimum (Apple HIG standard) prevent frustrating tap misses on mobile. Focus indicators are essential for keyboard navigation and WCAG compliance. Interactive elements must provide feedback — hover, focus, active, disabled states.

**Key insights:**
- Buttons: `px-4 py-2 rounded-lg font-medium transition-colors`
- Touch targets: `min-h-[44px] min-w-[44px]` on all interactive mobile elements
- Loading button: `disabled + opacity-50 + spinner icon`
- Cards: `rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow`
- Inputs: `h-10 w-full px-3 rounded-md border focus:ring-2 focus:ring-blue-500`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
- Icon buttons: always include `aria-label`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Button** | Standard | `<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">` |
| **Touch target** | Mobile minimum | `<button class="min-h-[44px] min-w-[44px]">` |
| **Card** | Hover feedback | `<div class="rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">` |
| **Input** | Focus ring | `<input class="h-10 px-3 rounded-md border focus:ring-2 focus:ring-blue-500">` |
| **Disabled** | Opacity + cursor | `<button disabled class="disabled:opacity-50 disabled:cursor-not-allowed">` |
| **Icon button** | aria-label | `<button aria-label="Close"><XIcon class="size-5"/></button>` |

### 5. Accessibility

**Core concept:** `sr-only` for screen reader text, `focus-visible:ring-2` for keyboard-only focus indicators, `motion-reduce:animate-none` for motion sensitivity, semantic HTML always. Accessibility is not optional — it's a legal requirement in many jurisdictions.

**Why it works:** `focus-visible` shows focus rings only for keyboard users (not mouse clicks), improving both aesthetics and accessibility. `motion-reduce` respects OS-level reduced motion preferences — essential for users with vestibular disorders. `sr-only` provides context to screen readers without affecting visual design.

**Key insights:**
- `sr-only` for text visible only to screen readers
- `focus-visible:ring-2` instead of `focus:ring-2` — keyboard-only focus
- `motion-reduce:animate-none` respects prefers-reduced-motion
- `motion-reduce:transition-none` for transition-heavy components
- Never `outline-none` without a replacement focus indicator
- Always `aria-label` on icon-only buttons
- Dark mode: `dark:bg-gray-900 dark:text-gray-100` — ensure sufficient contrast
- SVG explicit dimensions: `<svg class="size-6" width="24" height="24">` to prevent layout shift

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Screen reader** | sr-only | `<span class="sr-only">Close menu</span>` |
| **Keyboard focus** | focus-visible | `<button class="focus-visible:ring-2 focus-visible:ring-blue-500">` |
| **Reduced motion** | motion-reduce | `<div class="animate-pulse motion-reduce:animate-none">` |
| **Dark mode** | dark: prefix | `<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">` |
| **Icon a11y** | aria-label | `<button aria-label="Delete item"><TrashIcon class="size-5"/></button>` |
| **SVG dims** | Explicit w/h | `<svg class="size-6" width="24" height="24">` |

### 6. Performance & Configuration

**Core concept:** Configure `content` paths correctly so Tailwind can tree-shake unused classes. Avoid overusing `@apply` — it defeats the purpose of utility-first CSS. Use JIT mode (default in v3+) for development performance. Custom utilities in theme config for repeated one-off values.

**Why it works:** Tailwind's production CSS is tiny because it only includes classes actually used in your source files. Incorrect `content` configuration results in either missing styles (too narrow) or bloated CSS (too broad). `@apply` creates abstraction layers that Tailwind's utility-first approach was designed to eliminate.

**Key insights:**
- `content: ['./src/**/*.{js,ts,jsx,tsx}']` — must cover all template files
- `@apply` sparingly — prefer direct utilities in HTML/JSX
- Custom utilities in `tailwind.config.js` for repeated arbitrary values
- `@tailwindcss/forms` for consistent form element reset
- `@tailwindcss/typography` (`prose`) for markdown/CMS content
- Group and Peer for parent/sibling state: `group-hover:text-blue-500`
- `peer-checked:bg-blue-100` for checkbox/radio state styling

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Content config** | Glob patterns | `content: ['./src/**/*.{js,ts,jsx,tsx,html}']` |
| **Custom utility** | Theme extend | `extend: { boxShadow: { card: '0 4px 20px rgba(0,0,0,.08)' } }` |
| **Plugin** | Official | `plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]` |
| **Group hover** | Parent state | `<div class="group"><span class="group-hover:text-blue-500">` |
| **Peer** | Sibling state | `<input class="peer"><label class="peer-checked:font-bold">` |
| **Prose** | Typography | `<article class="prose prose-lg max-w-none dark:prose-invert">` |

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| **Arbitrary values for scale values** | Inconsistent spacing/sizing | Use `p-4` not `p-[15px]` |
| **Heavy @apply usage** | Creates CSS abstractions that defeat utility-first | Use utilities directly in HTML |
| **No dark mode** | Poor UX in low-light, not respecting OS preference | Add `dark:` variants |
| **outline-none without replacement** | Keyboard users can't see focus | `focus-visible:ring-2` |
| **No motion-reduce** | Harms vestibular disorder users | `motion-reduce:animate-none` |
| **Small touch targets** | Frustrating mobile experience | `min-h-[44px]` minimum |
| **Missing content paths** | Styles missing in production | Verify all template file paths |
| **Desktop-first approach** | Complex mobile overrides | Start with mobile, add `md:` `lg:` |
| **bg-gradient-to in v4** | Deprecated syntax | Use `bg-linear-to-r` in Tailwind v4 |
| **SVGs without explicit dimensions** | Layout shift before CSS loads | Add `width` and `height` attributes |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Using Tailwind's spacing scale? | Inconsistent spacing | Replace arbitrary values with scale tokens |
| Mobile-first responsive? | Complex overrides | Start with mobile base, add breakpoints |
| Dark mode implemented? | Missing OS preference respect | Add `dark:` variants for all colors |
| Focus indicators visible? | Keyboard a11y broken | Add `focus-visible:ring-2` |
| Motion preferences respected? | A11y violation | Add `motion-reduce:` variants |
| Touch targets ≥44px? | Mobile tap frustration | Add `min-h-[44px]` |
| Content paths correct? | Missing production styles | Audit tailwind.config.js content |
| Using semantic colors? | Hard to rebrand | Move to `bg-primary` theme tokens |
| Icon buttons labeled? | Screen reader fails | Add `aria-label` to all icon buttons |
| SVGs have explicit dimensions? | Layout shift | Add `width` and `height` attributes |

## Further Reading

- [Tailwind CSS Documentation](https://tailwindcss.com/docs) — Official reference
- [Tailwind CSS v4 Migration](https://tailwindcss.com/docs/upgrade-guide) — v3 to v4 changes
- [Refactoring UI](https://www.refactoringui.com/) — Design principles from Tailwind creators
- [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) — Prose styling
- [Heroicons](https://heroicons.com/) — SVG icons from Tailwind Labs

## About

This skill synthesizes patterns from Adam Wathan (Tailwind creator), Steve Schoger (Refactoring UI), and the Tailwind CSS community. For visual design principles, see refactoring-ui. For top-tier web design, see top-design. For React integration, see react-mastery.
