---
name: svelte-mastery
description: 'Master Svelte 5 runes, stores, and SvelteKit patterns. Use when the user mentions "Svelte", "SvelteKit", "runes", "$state", "$derived", "$effect", "Svelte stores", or "Svelte transitions". Covers Svelte 4 and 5 reactivity, component API, SvelteKit routing, and performance. For Vue alternative, see vue-mastery. For React comparison, see react-mastery.'
license: MIT
metadata:
  author: todyle
  version: "1.0.0"
---

# Svelte Mastery Framework

A comprehensive guide to building production Svelte applications covering both Svelte 4 patterns and Svelte 5 runes. Apply these principles when building new SvelteKit apps, migrating between Svelte versions, designing stores, or optimizing component performance.

## Core Principle

**Svelte is a compiler, not a runtime — write declarative UI code and Svelte compiles it into efficient imperative DOM updates at build time.** Unlike React or Vue, there is no virtual DOM diffing at runtime. This means Svelte apps ship less JavaScript, start faster, and update the DOM with surgical precision.

**The foundation:** Svelte 5 introduces runes (`$state`, `$derived`, `$effect`) that make reactivity explicit and composable. Understanding the shift from Svelte 4's implicit reactivity (`$:` and assignment-based tracking) to Svelte 5's runes is essential. SvelteKit handles routing, SSR, and data loading.

## Scoring

**Goal: 10/10.** When reviewing Svelte code, rate 0-10:

- **9-10:** Runes for Svelte 5 (or correct `$:` for S4), SvelteKit +page patterns, actions for DOM reuse, proper transitions
- **7-8:** Good patterns with minor issues (unnecessary stores, missing keys in each blocks)
- **5-6:** Working code but mixing paradigms, manual DOM in onMount, no SvelteKit load functions
- **3-4:** Framework-agnostic patterns forced into Svelte, no transitions, no store usage
- **1-2:** DOM manipulation, no reactivity, breaking Svelte conventions

## The Svelte Mastery Framework

Six disciplines for building production Svelte applications:

### 1. Reactivity — Svelte 4 & 5

**Core concept:** Svelte 4 uses assignment-based reactivity (`count += 1` triggers update) and `$:` for reactive statements. Svelte 5 replaces both with explicit runes: `$state()`, `$derived()`, `$effect()`. Both systems compile away — zero runtime overhead.

**Why it works:** In Svelte 4, the compiler tracks assignments to top-level `let` variables and re-renders when they change. In Svelte 5, runes make reactivity explicit — `$state()` declares reactive state, `$derived()` replaces `$:` for computed values, and `$effect()` replaces `$:` for side effects. Explicit is better than implicit.

**Key insights:**
- **Svelte 4:** `let count = 0; count += 1;` triggers reactivity. `$: doubled = count * 2` derives
- **Svelte 5:** `let count = $state(0); let doubled = $derived(count * 2);`
- **Svelte 5 effects:** `$effect(() => { console.log(count) })` replaces `$: console.log(count)`
- Assignment triggers reactivity — `items = [...items, newItem]` NOT `items.push(newItem)` (Svelte 4)
- Svelte 5 runes work in `.svelte.ts` files — reusable reactive logic outside components
- `$inspect()` for development debugging of reactive values (Svelte 5)

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **State (S5)** | $state | `let count = $state(0)` |
| **Derived (S5)** | $derived | `let doubled = $derived(count * 2)` |
| **Effect (S5)** | $effect | `$effect(() => document.title = title)` |
| **State (S4)** | let + assignment | `let count = 0; count += 1` |
| **Derived (S4)** | $: label | `$: doubled = count * 2` |
| **Array update (S4)** | Reassign | `items = [...items, newItem]` |

### 2. Component API

**Core concept:** Svelte 4 uses `export let` for props and `createEventDispatcher` for events. Svelte 5 uses `$props()` rune for props and callback props for events. Both versions support `bind:` for two-way binding, slots for content projection, and `{...$$restProps}` for prop forwarding.

**Why it works:** Props are the primary component interface. Two-way binding via `bind:` simplifies form handling. Slots enable composition patterns. The migration from `export let` to `$props()` provides better TypeScript inference and destructuring patterns.

**Key insights:**
- **Svelte 4:** `export let count = 0` declares prop with default
- **Svelte 5:** `let { count = 0, onChange } = $props()` — destructure with defaults
- `bind:value` for two-way input binding — replaces `value + on:input` patterns
- `bind:this` to get DOM element reference
- Named slots `<slot name="header">` for multi-area content projection
- `$$slots.name` to conditionally render slot wrappers
- `{...$$restProps}` to forward unknown props to child elements

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Props (S5)** | $props | `let { name, age = 0 } = $props()` |
| **Props (S4)** | export let | `export let name; export let age = 0` |
| **Input bind** | bind:value | `<input bind:value={name}>` |
| **DOM ref** | bind:this | `<canvas bind:this={canvas}>` |
| **Slots** | Named slot | `<slot name="header">Default</slot>` |
| **Forward props** | restProps | `<button {...$$restProps}>` |

### 3. Stores

**Core concept:** Svelte stores are reactive containers for shared state. `writable` for mutable state, `readable` for external data sources, `derived` for computed values. The `$` prefix auto-subscribes in components — `$count` reads and tracks a `count` store.

**Why it works:** Stores solve cross-component state sharing with minimal API surface. The `$` prefix auto-subscribes on component mount and unsubscribes on destroy — no manual cleanup needed in components. Stores are plain JS objects with a `.subscribe()` method, making them composable and framework-agnostic.

**Key insights:**
- `writable(initialValue)` — read/write store for shared mutable state
- `readable(initialValue, startFn)` — read-only store for external data
- `derived(sourceStore, $value => transform)` — computed from other stores
- `$storeName` auto-subscribes in `.svelte` files — use for all store access
- Custom stores: any object with `.subscribe()` is a valid store
- Manual subscriptions (in `.js/.ts` files) must be cleaned up

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Shared state** | writable | `export const count = writable(0)` |
| **External data** | readable | `readable(0, set => { const i = setInterval(() => set(Date.now()), 1000) })` |
| **Computed** | derived | `export const doubled = derived(count, $c => $c * 2)` |
| **Use in component** | $ prefix | `<p>{$count}</p>` — auto-subscribes |
| **Update** | set/update | `count.update(n => n + 1)` |

### 4. SvelteKit

**Core concept:** SvelteKit is the official app framework — file-based routing with `+page.svelte`, server data loading with `+page.server.js`, form actions, and SSR. Load data before render with `load()` functions, handle forms server-side with `actions`.

**Why it works:** SvelteKit's `load` function runs before the page renders — no loading spinners. Server-only code stays in `+page.server.js` — database access, API keys, and secrets never reach the client. Form actions provide progressive enhancement — forms work without JavaScript.

**Key insights:**
- `+page.svelte` for route components, `+layout.svelte` for shared layouts
- `+page.js` runs on both server and client — universal data loading
- `+page.server.js` runs server-only — safe for secrets, database access
- `export function load({ params, fetch })` returns data to the page
- Form actions: `export const actions = { default: async ({ request }) => { } }`
- `$app/stores` provides `$page`, `$navigating`, `$updated` stores
- `$app/navigation` provides `goto`, `invalidate`, `invalidateAll`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Route** | +page.svelte | `routes/blog/[slug]/+page.svelte` |
| **Load data** | +page.server.js | `export async function load({ params }) { return { post } }` |
| **Form action** | actions | `export const actions = { default: async ({ request }) => { } }` |
| **Page data** | $page store | `import { page } from '$app/stores'; $page.params.id` |
| **Navigate** | goto | `import { goto } from '$app/navigation'; goto('/dashboard')` |

### 5. Transitions & Actions

**Core concept:** Svelte has built-in transition directives (`transition:fade`, `in:fly`, `out:slide`) and actions (`use:action`) for declarative DOM behavior. Transitions animate elements entering/leaving the DOM. Actions encapsulate reusable DOM logic (click outside, tooltip, intersection observer).

**Why it works:** Transitions compile to optimized CSS animations — no runtime animation library needed. Actions provide a `use:directive` pattern for reusable DOM behavior without lifecycle boilerplate. `transition:fade|local` prevents ancestor triggers from re-animating children.

**Key insights:**
- `transition:fade` for enter+exit, `in:fly out:fade` for asymmetric
- `|local` modifier prevents ancestor-triggered transitions
- Built-in: `fade`, `fly`, `slide`, `scale`, `blur`, `draw`, `crossfade`
- Actions receive element ref and optional params — return `{ update, destroy }`
- Actions are perfect for: click-outside, tooltips, intersection observers, drag
- `{#key id}` forces component remount when key changes

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Fade** | transition:fade | `<div transition:fade>` |
| **Fly in, fade out** | Asymmetric | `<div in:fly={{ y: 20 }} out:fade>` |
| **Local scope** | local modifier | `<div transition:slide\|local>` |
| **Click outside** | Action | `<div use:clickOutside on:outclick={close}>` |
| **Force remount** | #key block | `{#key item.id}<Component/>{/key}` |

### 6. Styling & Templates

**Core concept:** Styles in `<style>` are scoped by default — no CSS Modules or BEM needed. `:global()` escapes scoping. CSS variables enable dynamic theming. Template logic uses `{#if}`, `{#each}`, `{#await}` blocks.

**Why it works:** Scoped styles eliminate class naming conflicts entirely. The compiler strips unused styles. CSS variables via `style="--color: {color}"` enable component-level theming without JavaScript. Template blocks read naturally and handle every common pattern.

**Key insights:**
- `<style>` is scoped by default — styles only apply to this component's elements
- `:global(.class)` to style children or third-party library elements
- CSS variables for dynamic styling: `style="--color: {dynamicColor}"`
- `{#if condition}...{:else if}...{:else}...{/if}` for conditionals
- `{#each items as item (item.id)}` — always use keyed each blocks
- `{#await promise}...{:then data}...{:catch error}...{/await}` for async
- `class:active={isActive}` directive for conditional classes

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Scoped style** | Default style tag | `<style> .btn { color: blue } </style>` |
| **Dynamic theme** | CSS variables | `<div style="--accent: {color}">` |
| **Conditional class** | class: directive | `<div class:active={isActive}>` |
| **List render** | each with key | `{#each items as item (item.id)}` |
| **Async data** | await block | `{#await fetchData()}{:then data}{:catch error}{/await}` |

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| **Array.push without reassign (S4)** | Reactivity not triggered | `items = [...items, newItem]` |
| **$: for effects in Svelte 5** | Deprecated, use runes | `$effect(() => ...)` |
| **No key in #each** | Wrong items update | `{#each items as item (item.id)}` |
| **onMount for data fetching (Kit)** | No SSR, loading flash | Use `+page.js` load function |
| **Forgetting $prefix** | Reading store contract not value | `{$count}` not `{count}` in template |
| **No transition:local** | Parent changes re-trigger animations | Add `\|local` modifier |
| **Manual addEventListener** | Memory leaks | Use `on:event` or actions (`use:`) |
| **Global styles everywhere** | Style conflicts | Use scoped `<style>` by default |
| **Svelte 4 patterns in Svelte 5** | Mixing paradigms | Migrate to runes consistently |
| **No cleanup in actions** | Memory leaks on unmount | Return `{ destroy() {} }` from action |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Using runes for Svelte 5? | Old `$:` syntax | Migrate to `$state`, `$derived`, `$effect` |
| Are each blocks keyed? | Rendering bugs | Add `(item.id)` to every `{#each}` |
| Using load functions (Kit)? | Client-side data fetch | Move to `+page.js` / `+page.server.js` |
| Stores using $ prefix? | Manual subscribe | Use `$store` in components |
| Actions for reusable DOM? | Duplicated onMount logic | Extract to `use:action` |
| Transitions scoped with local? | Unwanted re-animations | Add `\|local` modifier |
| Styles scoped? | Leaking CSS | Remove `:global()` unless needed |
| Form actions used (Kit)? | API route for forms | Use `+page.server.js` actions |

## Further Reading

- [Svelte Documentation](https://svelte.dev/docs) — Official reference
- [SvelteKit Documentation](https://kit.svelte.dev/docs) — Full app framework
- [Svelte 5 Runes](https://svelte.dev/blog/runes) — The new reactivity system
- [Svelte Tutorial](https://svelte.dev/tutorial) — Interactive learning
- [Rich Harris talks](https://www.youtube.com/results?search_query=rich+harris+svelte) — Creator's design philosophy

## About

This skill synthesizes patterns from the Svelte core team documentation, Rich Harris's design philosophy, and community best practices. Covers both Svelte 4 and Svelte 5 runes. For Vue alternative, see vue-mastery. For React comparison, see react-mastery. For styling, see tailwind-mastery.
