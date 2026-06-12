# UI Conventions — Professional Polish Rules

Detailed conventions extracted from `SKILL.md` for progressive disclosure. Load this when you
need the full do/don't tables for icons, interaction, light/dark contrast, layout, and the
exhaustive pre-delivery checklist. The MANDATORY Core Directives live in `SKILL.md`; this file is
the polish layer on top of them.

## Icons & Visual Elements

| Rule | Do | Don't |
|------|----|-------|
| **No emoji icons** | Use SVG icons (Heroicons, Lucide, Simple Icons) | Use emojis like 🎨 🚀 as UI icons |
| **Stable hover states** | Use color/opacity transitions on hover | Use scale transforms that shift layout |
| **Correct brand logos** | Research official SVG from Simple Icons | Guess or use incorrect logo paths |
| **Consistent icon sizing** | Use fixed viewBox (24x24) with w-6 h-6 | Mix different icon sizes randomly |

## Interaction & Cursor

| Rule | Do | Don't |
|------|----|-------|
| **Cursor pointer** | Add `cursor-pointer` to all clickable elements | Leave default cursor on interactive elements |
| **Hover feedback** | Provide visual feedback (color, shadow, border) | No indication element is interactive |
| **Smooth transitions** | Use `transition-colors duration-200` | Instant state changes or too slow (>500ms) |

## Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|-------|
| **Glass card light mode** | Use `bg-white/80` or higher opacity | Use `bg-white/10` (too transparent) |
| **Text contrast light** | Use `#0F172A` (slate-900) for text | Use `#94A3B8` (slate-400) for body text |
| **Border visibility** | Use `border-gray-200` in light mode | Use `border-white/10` (invisible) |

> With the shadcn-aligned color schema, prefer the semantic tokens directly: `--foreground` on
> `--background`, `--card-foreground` on `--card`, `--muted-foreground` on `--muted`. The palette
> data already encodes WCAG-checked on-color pairs, so use them rather than hand-picking grays.

## Layout & Spacing

| Rule | Do | Don't |
|------|----|-------|
| **Floating navbar** | Add `top-4 left-4 right-4` spacing | Stick navbar to `top-0 left-0 right-0` |
| **Content padding** | Account for fixed navbar height | Let content hide behind fixed elements |
| **Consistent max-width** | Use same `max-w-6xl` or `max-w-7xl` | Mix different container widths |

---

## Full Pre-Delivery Checklist

The MANDATORY Core-Directive checklist is in `SKILL.md`. The items below are the extended
visual / interaction / layout / accessibility polish pass — run them before shipping.

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from a consistent icon set (Heroicons/Lucide)
- [ ] Brand logos are correct (verified from Simple Icons)
- [ ] Hover states don't cause layout shift

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation

### Light/Dark Mode
- [ ] Light mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Semantic tokens used (`--foreground`/`--card-foreground`/`--muted-foreground`)

### Layout
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] No content hidden behind fixed navbars

### Accessibility
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected
