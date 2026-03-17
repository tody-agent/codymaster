---
name: vue-mastery
description: 'Master Vue 3 Composition API, Pinia state, and Vue Router. Use when the user mentions "Vue", "Composition API", "Pinia", "Vue Router", "ref", "reactive", "computed", "defineProps", or "script setup". Covers reactivity, composables, state management, and performance. For Svelte alternative, see svelte-mastery. For React comparison, see react-mastery.'
license: MIT
metadata:
  author: todyle
  version: "1.0.0"
---

# Vue 3 Mastery Framework

A comprehensive guide to building production Vue 3 applications with the Composition API, Pinia state management, and Vue Router. Apply these principles when building new Vue apps, migrating from Options API, designing composables, or optimizing performance.

## Core Principle

**Vue's reactivity is automatic — declare reactive state, and the template updates itself.** The Composition API with `<script setup>` is the modern standard, offering better TypeScript support, cleaner code organization, and logic reuse through composables. The most common mistake is fighting Vue's reactivity system instead of working with it.

**The foundation:** Vue's fine-grained reactivity system tracks dependencies automatically — when you read a `ref` inside a `computed`, Vue knows to update the computed when that ref changes. Understanding `ref` vs `reactive`, `.value` in script vs auto-unwrap in templates, and when to use `computed` vs `watch` vs `watchEffect` is the core of Vue mastery.

## Scoring

**Goal: 10/10.** When reviewing Vue code, rate 0-10:

- **9-10:** Composition API throughout, proper ref/reactive usage, Pinia stores, typed composables, v-memo on heavy lists
- **7-8:** Good Composition API with minor reactivity issues (reactive for primitives, missing computed)
- **5-6:** Working code but mixing Options/Composition, Vuex instead of Pinia, manual subscriptions
- **3-4:** Options API in new code, mixins for reuse, no TypeScript
- **1-2:** Vue 2 patterns, `this.$refs` everywhere, event bus anti-pattern

## The Vue 3 Mastery Framework

Six disciplines for building production Vue applications:

### 1. Composition API & Script Setup

**Core concept:** `<script setup>` is the recommended syntax for Vue 3 — it automatically exposes top-level bindings to the template, provides compile-time optimizations, and works seamlessly with TypeScript. `defineProps`, `defineEmits`, and `withDefaults` replace the Options API's `props`, `emits`, and default value declarations.

**Why it works:** `<script setup>` reduces boilerplate by ~40% versus the explicit `setup()` function. Everything declared at the top level is available in the template without a return statement. TypeScript generics on `defineProps<T>()` provide type-safe props without runtime overhead.

**Key insights:**
- `<script setup>` is the standard — no `export default`, no `setup()` return
- `defineProps<{ name: string }>()` for typed props without runtime PropTypes
- `defineEmits<{ change: [id: number] }>()` for typed event emissions
- `withDefaults(defineProps<Props>(), { count: 0 })` for default values
- `defineModel()` for simplified v-model binding (Vue 3.4+)
- All top-level variables and functions auto-expose to template
- Use `defineExpose` only when parent needs `ref` access to child internals

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Component** | script setup | `<script setup lang="ts">` |
| **Props** | defineProps | `defineProps<{ title: string; count?: number }>()` |
| **Events** | defineEmits | `defineEmits<{ save: [data: FormData] }>()` |
| **Defaults** | withDefaults | `withDefaults(defineProps<Props>(), { size: 'md' })` |
| **v-model** | defineModel | `const model = defineModel<string>()` |
| **Expose** | defineExpose | `defineExpose({ focus: () => input.value?.focus() })` |

### 2. Reactivity System

**Core concept:** `ref()` for primitives and values you reassign, `reactive()` for objects you mutate in place. `computed()` for derived values that cache automatically. Remember: `.value` is needed in `<script>` but auto-unwrapped in `<template>`.

**Why it works:** Vue's reactivity is proxy-based — it tracks which properties are read during render and re-renders only when those specific properties change. `computed` caches results and only recalculates when dependencies change. `shallowRef` and `shallowReactive` opt out of deep reactivity for large data sets.

**Key insights:**
- `ref()` for primitives (string, number, boolean) and values you reassign
- `reactive()` for objects you mutate — but loses reactivity on destructure
- `computed()` caches derived values — `const double = computed(() => count.value * 2)`
- `watch()` for specific source watching with old/new value access
- `watchEffect()` auto-tracks dependencies, simpler for simple effects
- `shallowRef()` for large objects where deep reactivity causes performance issues
- `toRefs()` and `storeToRefs()` to destructure without losing reactivity
- Clean up watchers — `watchEffect(onCleanup => { onCleanup(() => unsub()) })`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Primitive** | ref | `const count = ref(0); count.value++` |
| **Object** | reactive | `const state = reactive({ user: null, loading: false })` |
| **Derived** | computed | `const total = computed(() => items.value.reduce(...))` |
| **Side effect** | watchEffect | `watchEffect(() => document.title = title.value)` |
| **Specific watch** | watch | `watch(userId, async (newId) => await fetchUser(newId))` |
| **Large data** | shallowRef | `const bigList = shallowRef(largeArray)` |

### 3. Component Architecture

**Core concept:** Single-File Components (`.vue`) keep template, script, and style together. Composables (functions starting with `use`) replace mixins for logic reuse. Provide/inject replaces deep prop drilling. Async components lazy-load heavy dependencies.

**Why it works:** SFCs are the natural unit of Vue — everything a component needs is in one file. Composables are plain functions that use Vue's reactivity APIs, making them testable, composable, and type-safe. Unlike mixins, there are no naming collisions and dependencies are explicit.

**Key insights:**
- Composables must start with `use` — `useFetch`, `useForm`, `useAuth`
- Return `ref` values from composables (not reactive) to maintain reactivity on destructure
- Use `toValue()` or `unref()` for flexible composable params (accept ref or plain value)
- PascalCase for component names in templates — `<MyComponent/>`
- `defineAsyncComponent()` for lazy-loading heavy components (modals, charts)
- `provide/inject` for dependency injection without prop drilling
- `<Teleport to="body">` for modals that need to escape the DOM tree

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Reusable logic** | Composable | `const { data, error } = useFetch(url)` |
| **Flexible params** | toValue | `const val = toValue(maybeRef)` |
| **Lazy component** | Async component | `defineAsyncComponent(() => import('./HeavyChart.vue'))` |
| **DI** | Provide/inject | `provide('theme', theme); const theme = inject('theme')` |
| **Portal** | Teleport | `<Teleport to="body"><Modal/></Teleport>` |

### 4. State Management (Pinia)

**Core concept:** Pinia is the official state manager for Vue 3. Define stores with `defineStore` using the setup syntax (Composition API style). Access store state with `storeToRefs()` to maintain reactivity when destructuring.

**Why it works:** Pinia eliminates Vuex's boilerplate (no mutations, no modules concept). Setup stores use the same Composition API patterns as components — `ref` for state, `computed` for getters, functions for actions. DevTools integration provides time-travel debugging. Stores are lazy-loaded — only instantiated when first used.

**Key insights:**
- Setup store syntax: `defineStore('counter', () => { const count = ref(0); return { count } })`
- `storeToRefs(store)` for destructuring state/getters reactively
- Actions are plain functions — async actions just use async/await
- Stores can use other stores — compose stores for complex logic
- `$reset()` resets to initial state (options stores only)
- SSR-safe — Pinia handles hydration automatically with Nuxt
- Plugins extend all stores — `pinia.use(myPlugin)`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Store definition** | Setup store | `defineStore('cart', () => { const items = ref([]) })` |
| **Destructure** | storeToRefs | `const { items, total } = storeToRefs(cartStore)` |
| **Action** | Plain function | `function addItem(item) { items.value.push(item) }` |
| **Composition** | Store uses store | `const authStore = useAuthStore()` inside another store |

### 5. Vue Router

**Core concept:** File-based routing (via Nuxt) or declarative routing with `createRouter`. Use `useRouter()` and `useRoute()` for Composition API access. Lazy-load route components for code splitting. Navigation guards protect routes.

**Why it works:** Lazy-loading route components means users only download code for the page they visit. Navigation guards centralize auth checks instead of duplicating in every component. `useRoute()` provides reactive params and query access.

**Key insights:**
- `useRouter()` for navigation, `useRoute()` for current route info
- Lazy load: `component: () => import('./Page.vue')` for code splitting
- `beforeEach` navigation guard for auth protection
- `<RouterView>` with `<Transition>` for animated page transitions
- Named views for multi-pane layouts
- Route meta fields for declarative permission checks

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Navigate** | useRouter | `const router = useRouter(); router.push('/dashboard')` |
| **Current route** | useRoute | `const route = useRoute(); route.params.id` |
| **Lazy route** | Dynamic import | `component: () => import('./views/Dashboard.vue')` |
| **Auth guard** | beforeEach | `router.beforeEach((to) => { if (!auth && to.meta.requiresAuth) return '/login' })` |

### 6. Performance

**Core concept:** Vue's fine-grained reactivity is already fast. Optimize only what's measured to be slow: `v-once` for static content, `v-memo` for expensive list items, `shallowRef` for large data, and `defineAsyncComponent` for heavy imports.

**Why it works:** Unlike React which re-renders entire component trees, Vue tracks exact dependencies and updates only what changed. This means most Vue apps don't need manual optimization. When they do, Vue provides granular controls that React doesn't — `v-memo` can skip re-rendering specific list items based on dependency comparison.

**Key insights:**
- `v-once` renders a subtree once — never re-evaluated
- `v-memo="[item.id, item.selected]"` skips re-render if deps unchanged
- `shallowReactive` / `shallowRef` for large flat data structures
- `defineAsyncComponent` for modals, charts, and other heavy components
- Never `v-if` and `v-for` on the same element — use `<template v-for>` wrapper
- Always provide `:key` with stable unique IDs in `v-for`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Static content** | v-once | `<footer v-once>{{ copyright }}</footer>` |
| **Heavy list** | v-memo | `<div v-for="item in list" v-memo="[item.id, item.active]">` |
| **Lazy modal** | Async component | `defineAsyncComponent(() => import('./Modal.vue'))` |
| **Large data** | shallowRef | `const bigData = shallowRef(largeDataset)` |
| **Key in v-for** | Stable key | `v-for="item in items" :key="item.id"` |

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| **Forgetting .value in script** | Ref not updated, silent bugs | `count.value++` not `count++` in `<script>` |
| **reactive for primitives** | Can't track reassignment | Use `ref()` for primitives |
| **Destructuring reactive** | Loses reactivity | Use `toRefs()` or `storeToRefs()` |
| **v-if with v-for same element** | Priority issues, wrong behavior | Wrap in `<template v-for>`, `v-if` inside |
| **Mixins for code reuse** | Naming collisions, implicit deps | Use composables (`useFetch`, `useForm`) |
| **Vuex in new projects** | Verbose, no TS support, deprecated | Use Pinia with setup stores |
| **Index as v-for key** | Stale state, wrong updates | Use `item.id` as key |
| **Options API in new code** | Missing TS support, harder reuse | Use `<script setup>` Composition API |
| **No watch cleanup** | Memory leaks, stale subscriptions | Return cleanup from `watchEffect(onCleanup => ...)` |
| **Direct prop mutation** | Breaks one-way data flow | `emit('update:modelValue', newVal)` |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Is `<script setup>` used? | Old Composition syntax | Convert to `<script setup>` |
| Are props typed with generics? | Runtime errors | `defineProps<{ name: string }>()` |
| Using Pinia (not Vuex)? | Verbose, no TS | Migrate to Pinia setup stores |
| Are composables prefixed with `use`? | Convention violation | Rename to `useXxx` |
| Are route components lazy-loaded? | Large initial bundle | `() => import('./Page.vue')` |
| Using `storeToRefs`? | Lost reactivity on destructure | Wrap store destructure |
| Are v-for keys stable IDs? | Rendering bugs | Use `item.id` not index |
| Are watchers cleaned up? | Memory leaks | Add `onCleanup` in watchEffect |
| Using computed for derived values? | Unnecessary recalculation | Replace methods with computed |
| Is v-if separated from v-for? | Template compilation issues | Use `<template v-for>` wrapper |

## Further Reading

- [Vue.js Documentation](https://vuejs.org/) — Official docs (comprehensive)
- [Pinia Documentation](https://pinia.vuejs.org/) — Official state management
- [VueUse](https://vueuse.org/) — Collection of essential composables
- [Vue Router](https://router.vuejs.org/) — Official routing
- [Anthony Fu's blog](https://antfu.me/) — Core team member, VueUse creator

## About

This skill synthesizes patterns from the Vue.js core team documentation, Evan You's design philosophy, and community best practices. For SSR with Nuxt, consult the Nuxt documentation. For alternative reactive frameworks, see svelte-mastery. For code quality, see clean-code.
