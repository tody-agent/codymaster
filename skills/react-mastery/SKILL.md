---
name: react-mastery
description: 'Master React state, hooks, and performance patterns. Use when the user mentions "React hooks", "useState", "useEffect", "React performance", "React.memo", "custom hooks", or "React component patterns". Covers state management, effects lifecycle, component composition, and TypeScript integration. For Next.js SSR, see nextjs-mastery. For mobile, see react-native-mastery.'
license: MIT
metadata:
  author: todyle
  version: "1.0.0"
---

# React Mastery Framework

A comprehensive guide to building production React applications with correct state management, optimized rendering, and maintainable component patterns. Apply these principles when building new React apps, reviewing components, debugging re-renders, or teaching React best practices.

## Core Principle

**React is a declarative UI library — describe WHAT your UI should look like for a given state, and let React figure out HOW to update the DOM.** The most common source of bugs and performance issues in React is fighting this model: mutating state directly, using effects for derived values, or creating unnecessary re-renders through careless reference creation.

**The foundation:** React's rendering model is simple — when state changes, the component and its children re-render. Understanding this deeply (what triggers a render, what gets recreated, what gets memoized) is the difference between a React developer and a React expert. State should be minimal, effects should be rare, and components should be small.

## Scoring

**Goal: 10/10.** When reviewing React code, rate 0-10:

- **9-10:** Minimal state, no unnecessary effects, proper memoization, clean hooks, full TypeScript
- **7-8:** Good patterns with minor issues (extra state, missing cleanup, occasional inline objects)
- **5-6:** Working code but with effects for derived state, prop drilling, inconsistent patterns
- **3-4:** Class components mixed with hooks, missing error boundaries, no TypeScript
- **1-2:** Inline everything, no state management strategy, untestable components

## The React Mastery Framework

Seven disciplines for building robust React applications:

### 1. State Management

**Core concept:** State should be minimal — if you can compute a value from existing state or props, don't store it as state. Choose the right tool: useState for simple values, useReducer for complex related values, Context for app-wide data, and external stores (Zustand/Redux) for cross-cutting concerns.

**Why it works:** Every piece of state is a potential source of bugs. Redundant state can desynchronize, and unnecessary state triggers unnecessary renders. The React docs themselves say "if you can calculate something from existing props or state, don't put it in state."

**Key insights:**
- `useState` for simple local state (toggles, form inputs, counters)
- `useReducer` for complex state with multiple sub-values that update together
- Derive values in render — `const total = items.reduce(...)` not `const [total, setTotal] = useState(0)`
- Lazy initialization — `useState(() => expensiveComputation())` not `useState(expensiveComputation())`
- Lift state up to the nearest common ancestor when siblings need the same data
- Split contexts by concern — `ThemeContext` + `AuthContext` not one giant `AppContext`
- Memoize context values with `useMemo` to prevent consumer re-renders

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Simple toggle** | useState with boolean | `const [open, setOpen] = useState(false)` |
| **Related values** | useReducer with actions | `useReducer(formReducer, initialForm)` |
| **Derived data** | Compute in render | `const filtered = items.filter(i => i.active)` |
| **Global theme** | Context + useMemo | `<ThemeContext.Provider value={useMemo(...)}>` |
| **Expensive init** | Lazy useState | `useState(() => JSON.parse(localStorage.get(...)))` |
| **Cross-cutting** | Zustand store | `const count = useStore(s => s.count)` |

### 2. Effects & Lifecycle

**Core concept:** Effects are for synchronizing with external systems — not for deriving state, handling events, or transforming data. The most common React anti-pattern is reaching for useEffect when you should be computing during render or handling in event handlers.

**Why it works:** Effects run after render and can cause cascading re-renders when they set state. A component that computes `filteredItems` in an effect re-renders twice (once with stale data, once with filtered data). Computing in render avoids this entirely. The React team created an entire docs page called "You Might Not Need an Effect."

**Key insights:**
- Always return a cleanup function for subscriptions, timers, and listeners
- Dependencies must include ALL values referenced inside the effect
- Transform data during render, not in effects — `const filtered = items.filter(...)` not `useEffect → setFiltered`
- Handle events in event handlers, not effects — `onClick={handleSave}` not `useEffect to watch for shouldSave`
- Use `useRef` for values that don't trigger renders (interval IDs, DOM elements)
- `useDeferredValue` for debouncing expensive renders instead of effects with timeouts
- Empty deps `[]` means "run once on mount" — make sure that's what you actually want

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **API subscription** | Effect with cleanup | `useEffect(() => { sub(); return unsub; }, [])` |
| **Derived filtering** | Compute in render | `const visible = items.filter(predicate)` |
| **Debounce search** | useDeferredValue | `const deferred = useDeferredValue(query)` |
| **DOM measurement** | Ref + effect | `useEffect(() => { height = ref.current.offsetHeight })` |
| **Timer** | Ref for interval ID | `const intervalRef = useRef(null)` |
| **Avoid effect** | Event handler | `onClick={() => saveToServer(data)}` |

### 3. Component Patterns

**Core concept:** Components should be small, focused, and composed through children and props — not inheritance. Every component should do one thing. If you're extracting a component, the name should describe that one thing clearly.

**Why it works:** Small components are testable, nameable, and reusable. Composition via `children` makes components flexible without needing to anticipate every use case. Compound components (Tab + TabPanel sharing context) give consumers full control over rendering while keeping state logic encapsulated.

**Key insights:**
- Prefer composition (`<Card>{content}</Card>`) over configuration (`<Card content={...} />`)
- Use `children` for flexible content projection
- Compound components share state via internal context
- Render props for customizable rendering logic
- `forwardRef` for exposing DOM access to parent components
- Keep related files together — `components/User/UserCard.tsx` + `useUser.ts`
- Use `<>...</>` (fragments) to avoid unnecessary wrapper DOM elements
- Destructure props in function signature — `function Button({ size = 'md' })`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Flexible wrapper** | Children prop | `<Card>{content}</Card>` |
| **Related components** | Compound pattern | `<Tabs><Tab/><TabPanel/></Tabs>` |
| **Customizable render** | Render prop | `<DataFetcher render={data => <List data={data}/>}/>` |
| **DOM access** | forwardRef | `const Input = forwardRef((props, ref) => ...)` |
| **Split large** | Extract subcomponents | `<UserAvatar/> <UserName/> <UserBio/>` |

### 4. Performance Optimization

**Core concept:** Measure before optimizing. React is fast by default — most apps never need `React.memo`, `useMemo`, or `useCallback`. When you do optimize, target the specific bottleneck: expensive calculations get `useMemo`, callbacks passed to memoized children get `useCallback`, and pure components with expensive renders get `React.memo`.

**Why it works:** Premature optimization adds complexity and makes code harder to read. But when you have measured the bottleneck (React DevTools Profiler), targeted optimizations are surgical. Virtualizing a list of 10,000 items, lazy-loading a heavy chart library, or memoizing an expensive sort transform the user experience.

**Key insights:**
- Profile with React DevTools before adding any memoization
- `useMemo` for expensive computations — filtering, sorting, complex calculations
- `useCallback` for functions passed to `React.memo`-wrapped children
- `React.memo` wraps components that render often with the same props
- Avoid creating new objects/arrays inline in JSX — `style={styles}` not `style={{ margin: 10 }}`
- `React.lazy` + `Suspense` for code splitting by route or heavy component
- Virtualize long lists (100+ items) with `react-window` or `@tanstack/virtual`
- React 18 auto-batches state updates — don't manually batch with `flushSync`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Expensive filter** | useMemo | `useMemo(() => items.filter(predicate), [items, predicate])` |
| **Callback to child** | useCallback | `useCallback(() => save(id), [id])` |
| **Pure list item** | React.memo | `export default memo(ListItem)` |
| **Route splitting** | React.lazy | `const Page = lazy(() => import('./Page'))` |
| **Long list** | Virtualization | `<VirtualizedList data={items} itemSize={50}/>` |
| **Inline objects** | Extract constant | `const STYLE = { margin: 10 }; <div style={STYLE}>` |

### 5. Custom Hooks

**Core concept:** Custom hooks extract reusable stateful logic from components. They must start with `use`, follow the Rules of Hooks (top level only, React functions only), and should be named to describe what they do, not how they work.

**Why it works:** Without custom hooks, stateful logic gets duplicated across components or crammed into components that are too large. Custom hooks are the primary mechanism for code reuse in modern React — they replace mixins, HOCs, and render props for most use cases.

**Key insights:**
- Name with `use` prefix — `useFetch`, `useForm`, `useAuth`
- Extract when logic is used in 2+ components
- Can call other hooks — compose complex behavior from simpler hooks
- Return tuple `[value, setValue]` or object `{ data, error, loading }`
- Handle cleanup inside the hook, not in the consuming component
- Test hooks with `renderHook` from testing-library

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Data fetching** | useFetch hook | `const { data, error } = useFetch('/api/users')` |
| **Form handling** | useForm hook | `const { values, handleChange } = useForm(initial)` |
| **Media query** | useMediaQuery hook | `const isMobile = useMediaQuery('(max-width: 768px)')` |
| **Debounced value** | useDebounce hook | `const debounced = useDebounce(search, 300)` |
| **Composing hooks** | Hook calling hook | `function useUser() { const { data } = useFetch(...) }` |

### 6. TypeScript Integration

**Core concept:** TypeScript makes React components self-documenting through prop interfaces, event types, and generic components. Every component should have typed props, every state should have explicit types for complex values, and every event handler should use React's event types.

**Why it works:** TypeScript catches prop misuse at compile time instead of runtime. IDE autocompletion makes components discoverable. Typed events prevent `event.target.value` on a div. Generic components (`<List<T>>`) enable type-safe reusable patterns.

**Key insights:**
- Define `interface Props {}` for all component props
- Use `React.ChangeEvent<HTMLInputElement>` for input handlers
- `useState<User | null>(null)` for complex state types
- Generic components: `function List<T>({ items }: { items: T[] })`
- Discriminated unions for component variants
- `PropsWithChildren<Props>` when accepting children
- Avoid `any` — use `unknown` and narrow with type guards

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Props** | Interface | `interface ButtonProps { onClick: () => void; size?: 'sm' \| 'lg' }` |
| **State** | Typed useState | `useState<User \| null>(null)` |
| **Events** | React event types | `(e: React.ChangeEvent<HTMLInputElement>) => ...` |
| **Generics** | Generic component | `function Select<T>({ items, onSelect }: SelectProps<T>)` |
| **Children** | PropsWithChildren | `function Card({ children }: PropsWithChildren<CardProps>)` |

### 7. Testing

**Core concept:** Test what users see and do — not implementation details. Use Testing Library's queries in priority order: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`. Tests should survive refactoring: they should break only when behavior changes, never when implementation changes.

**Why it works:** Tests that check internal state (`component.state.count`) break on every refactor. Tests that check rendered output (`screen.getByText('3 items')`) survive restructuring, hook changes, and state management swaps. Accessible queries (`getByRole`) also validate that your accessibility is correct.

**Key insights:**
- Use `@testing-library/react` with `jest` or `vitest`
- Query priority: role > label > text > testId
- `userEvent` over `fireEvent` for realistic interactions
- `waitFor` for async assertions
- Test error boundaries wrapping sections components
- Avoid snapshot tests for logic — they test too much or too little
- Use `renderHook` for custom hook testing

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Find element** | Accessible query | `screen.getByRole('button', { name: /submit/i })` |
| **User action** | userEvent | `await userEvent.click(submitButton)` |
| **Async result** | waitFor | `await waitFor(() => expect(screen.getByText('Done')))` |
| **Error boundary** | Error rendering | `<ErrorBoundary><Content/></ErrorBoundary>` |
| **Custom hook** | renderHook | `const { result } = renderHook(() => useCounter())` |

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| **useEffect for derived state** | Causes double render, stale data flash | Compute in render body |
| **Missing effect cleanup** | Memory leaks, stale subscriptions | Always return cleanup function |
| **Index as key for dynamic lists** | Wrong items update, state bugs | Use stable unique ID (`item.id`) |
| **Prop drilling 5+ levels** | Brittle, hard to maintain | Use Context or composition |
| **useState for related values** | Values desynchronize | useReducer for related state |
| **Inline objects in JSX** | New reference every render, breaks memo | Extract to constant or useMemo |
| **Empty deps with referenced values** | Stale closures, bugs | Include all referenced values |
| **Effect instead of event handler** | Unnecessary complexity | Handle in onClick/onSubmit |
| **No error boundaries** | One error crashes entire app | Wrap sections with ErrorBoundary |
| **Memoizing everything** | Added complexity, no measured benefit | Profile first, memoize bottlenecks |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Is every piece of state truly necessary? | Redundant state | Remove and compute from existing state/props |
| Do all effects have cleanup? | Memory leaks risk | Add return function with unsubscribe/clear |
| Are keys stable and unique? | List rendering bugs | Use `item.id` not array index |
| Is state lifted to correct level? | Prop drilling or duplication | Move to nearest common ancestor or Context |
| Are expensive computations memoized? | Slow renders | Wrap with `useMemo` (after profiling) |
| Is code split by route? | Large initial bundle | `React.lazy` for route components |
| Are long lists virtualized? | DOM thrashing, lag | Use `react-window` for 100+ items |
| Do all components have typed props? | Runtime prop errors | Add TypeScript interfaces |
| Are tests querying by role? | Fragile tests | Switch to `getByRole`, `getByLabelText` |
| Is React DevTools Profiler used? | Blind optimization | Profile before adding memo/callback |

## Further Reading

- [React.dev](https://react.dev/) — Official documentation (comprehensive and regularly updated)
- [*"You Might Not Need an Effect"*](https://react.dev/learn/you-might-not-need-an-effect) — Essential reading on when NOT to use useEffect
- [*"Thinking in React"*](https://react.dev/learn/thinking-in-react) — The mental model for building React UIs
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — The standard for React component testing
- [Bulletproof React](https://github.com/alan2207/bulletproof-react) — Production architecture patterns

## About

This skill synthesizes patterns from the React core team documentation, Kent C. Dodds' testing philosophy, Dan Abramov's state management guidance, and production patterns from large-scale React applications. For server-side rendering, see nextjs-mastery. For mobile development, see react-native-mastery. For code quality, see clean-code.
