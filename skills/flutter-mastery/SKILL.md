---
name: flutter-mastery
description: 'Master Flutter widgets, state management, and theming. Use when the user mentions "Flutter", "Dart", "StatefulWidget", "Riverpod", "Provider", "GoRouter", "Material 3", "Flutter performance", or "Flutter widgets". Covers widget composition, state patterns, ListView, navigation, theming, and performance. For React Native alternative, see react-native-mastery. For native iOS, see swiftui-mastery.'
license: MIT
metadata:
  author: todyle
  version: "1.0.0"
---

# Flutter Mastery Framework

A comprehensive guide to building production Flutter applications with the widget tree model, state management patterns, and Material 3 theming. Apply these principles when building cross-platform apps, designing widget architectures, optimizing list performance, or implementing animations.

## Core Principle

**Everything in Flutter is a widget — the app, the screen, the button, the padding, the alignment.** Composition is the fundamental mechanism: you build complex UIs by combining simple widgets. The widget tree is immutable — when state changes, Flutter creates a new widget tree and efficiently diffs it against the previous one to update only what changed.

**The foundation:** Flutter's rendering is unique — it doesn't use platform UI components. It draws every pixel using Skia (or Impeller), giving complete control over rendering. This means identical visuals across platforms, but also means you must handle platform conventions (back button, scrolling physics) explicitly.

## Scoring

**Goal: 10/10.** When reviewing Flutter code, rate 0-10:

- **9-10:** Proper widget composition, const constructors, Riverpod, GoRouter, Material 3 theming, RepaintBoundary
- **7-8:** Good patterns with minor issues (StatefulWidget overuse, deep nesting, missing const)
- **5-6:** Working app but setState everywhere, no state management, manual navigation
- **3-4:** Monolithic build methods, no theming, FutureBuilder without error handling
- **1-2:** Widget tree as one giant method, platform-agnostic (no platform handling)

## The Flutter Mastery Framework

Six disciplines for building production Flutter applications:

### 1. Widget Composition

**Core concept:** Prefer `StatelessWidget` for UI that doesn't change. Use `const` constructors everywhere possible (compiler static optimization). Keep `build()` methods small — extract widgets into classes, not methods. Composition over inheritance always.

**Why it works:** `const` widgets are created at compile time and reused — they never rebuild. Small widgets have smaller rebuild scopes — when state changes, only the affected subtree rebuilds. Class extraction (vs method extraction) allows Flutter to skip unchanged subtrees during diffing.

**Key insights:**
- `StatelessWidget` for anything that doesn't hold mutable state
- `const` constructors eliminate rebuild cost — `const Text('Hello')` is free
- Extract widgets to classes, not methods — class widgets get independent rebuild
- Keep build methods under 30 lines — extract when deeper than readable
- Avoid nesting beyond 4-5 levels — extract intermediate widgets
- Use `Key` for stateful items in lists — preserve widget state across reorders
- Composition: `Container(child: MyContent())` not `class MyContainer extends Container`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Static UI** | StatelessWidget | `class Avatar extends StatelessWidget { const Avatar(); }` |
| **Const usage** | const constructor | `const SizedBox(height: 16)` |
| **Extract** | Widget class | `class UserHeader extends StatelessWidget` vs `Widget _buildHeader()` |
| **Composition** | Nested widgets | `Padding(padding: ..., child: Card(child: Column(...)))` |
| **List keys** | ValueKey | `ListTile(key: ValueKey(item.id))` |

### 2. State Management

**Core concept:** `setState` for simple local UI state. For shared/complex state, use Riverpod (recommended) or Provider. Always `dispose()` controllers and subscriptions. Choose the right tool: `setState` for a toggle button, Riverpod for user session, BLoC for complex event-driven logic.

**Why it works:** `setState` is sufficient for isolated UI state but breaks down when state needs to be shared or when complex async operations are involved. Riverpod provides compile-time safety, dependency injection, and testability. Provider/Riverpod widgets rebuild surgically — only the `Consumer` widget reading the changed value rebuilds.

**Key insights:**
- `setState(() { _counter++; })` for simple local state (toggle, counter)
- Never call `setState` in `build()` — causes infinite rebuild loop
- Riverpod: `ref.watch(provider)` for reactive access, `ref.read(provider)` for one-time
- Provider: `Provider.of<T>(context)` or `context.watch<T>()`
- Always override `dispose()` — dispose controllers, cancel subscriptions
- `ChangeNotifier` for observable objects in Provider pattern
- Keep state as close to usage as possible — don't hoist unnecessarily

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Local toggle** | setState | `setState(() { _isExpanded = !_isExpanded; })` |
| **Riverpod** | ref.watch | `final count = ref.watch(counterProvider)` |
| **Provider** | ChangeNotifier | `class CartNotifier extends ChangeNotifier { ... }` |
| **Cleanup** | dispose | `@override void dispose() { _controller.dispose(); super.dispose(); }` |
| **Async state** | FutureProvider | `final userProvider = FutureProvider((ref) => api.getUser())` |

### 3. Layout & Lists

**Core concept:** `Column`/`Row` for linear layouts, `Expanded`/`Flexible` for flex behavior, `SizedBox` for spacing. `ListView.builder` for long lists (lazy rendering). `CustomScrollView` with Slivers for complex scroll effects. `LayoutBuilder` for responsive layouts.

**Why it works:** `ListView.builder` only builds widgets that are visible on screen (plus buffer) — a list of 10,000 items uses memory for ~20. `itemExtent` skips the measurement pass when all items are the same height. Slivers compose independently scrollable regions (headers that collapse, lists that scroll, footers that stick).

**Key insights:**
- `ListView.builder(itemCount: N, itemBuilder: ...)` for 20+ items — always
- `itemExtent: 60` when all items have the same height — skip measurement
- `SizedBox(height: 16)` for spacing, not `Container(height: 16)`
- `Expanded(child: ...)` to fill remaining space in Row/Column
- `LayoutBuilder(builder: (context, constraints) => ...)` for responsive
- `CustomScrollView(slivers: [SliverAppBar, SliverList])` for complex scroll
- Avoid `ListView` inside `ListView` — use `SliverList` in `CustomScrollView`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Long list** | ListView.builder | `ListView.builder(itemCount: items.length, itemBuilder: (_, i) => ...)` |
| **Fixed height** | itemExtent | `ListView.builder(itemExtent: 72, ...)` |
| **Spacing** | SizedBox | `SizedBox(height: 16)` between widgets |
| **Fill space** | Expanded | `Row(children: [Expanded(child: TextField()), Button()])` |
| **Responsive** | LayoutBuilder | `LayoutBuilder(builder: (_, c) => c.maxWidth > 600 ? Wide() : Narrow())` |
| **Complex scroll** | Slivers | `CustomScrollView(slivers: [SliverAppBar(), SliverList()])` |

### 4. Navigation

**Core concept:** Use `go_router` for declarative routing with type-safe arguments. Handle Android back button with `PopScope` (not deprecated `WillPopScope`). Define routes as a tree structure. Support deep linking with URL-based routes.

**Why it works:** `go_router` provides web-like URL routing, type-safe arguments, nested navigation (for tabs + detail), and deep linking out of the box. `PopScope` handles Android 14's predictive back gesture properly. Declarative routing keeps navigation state inspectable and debuggable.

**Key insights:**
- `go_router` over `Navigator.push` for complex apps
- Typed route arguments — `GoRoute(path: '/user/:id', builder: ...)`
- `context.go('/home')` for navigation, `context.push('/details')` for stack
- `PopScope(canPop: false, onPopInvokedWithResult: ...)` for custom back
- `ShellRoute` for persistent bottom navigation with nested routes
- Deep linking: routes match URLs automatically
- Named routes: `context.goNamed('profile', pathParameters: {'id': '123'})`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Route config** | GoRouter | `GoRouter(routes: [GoRoute(path: '/', builder: (_, __) => Home())])` |
| **Navigate** | context.go | `context.go('/user/${user.id}')` |
| **Back handling** | PopScope | `PopScope(canPop: false, onPopInvokedWithResult: handleBack)` |
| **Tabs + detail** | ShellRoute | `ShellRoute(builder: (_, __, child) => Shell(child: child))` |
| **Type-safe params** | Extra | `GoRoute(path: '/item/:id', builder: (_, state) => Detail(id: state.pathParameters['id']))` |

### 5. Theming & Material 3

**Core concept:** Use `ThemeData` with `ColorScheme.fromSeed()` for Material 3 design. Access theme via `Theme.of(context)` — never hardcode colors or text styles. Support dark mode with `darkTheme` parameter. Custom themes create consistent, brandable UIs.

**Why it works:** Material 3's seed-based color system generates a complete harmonious palette from a single seed color. `Theme.of(context)` ensures consistency throughout the app and enables dynamic theming (dark mode, user preferences). System font scaling respects user accessibility settings.

**Key insights:**
- `ColorScheme.fromSeed(seedColor: Color)` generates the full Material 3 palette
- `Theme.of(context).colorScheme.primary` — never `Colors.blue` directly
- `Theme.of(context).textTheme.bodyLarge` — never `TextStyle(fontSize: 16)`
- `MaterialApp(theme: lightTheme, darkTheme: darkTheme)` for dark mode
- Support system text scaling — use theme text styles, not fixed sizes
- Custom component themes: `ElevatedButton.styleFrom()` in theme data
- `ThemeExtensions` for brand-specific theme properties

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Color scheme** | fromSeed | `ColorScheme.fromSeed(seedColor: Colors.blue)` |
| **Use color** | Theme.of | `color: Theme.of(context).colorScheme.primary` |
| **Text style** | textTheme | `style: Theme.of(context).textTheme.headlineMedium` |
| **Dark mode** | MaterialApp | `MaterialApp(theme: light, darkTheme: dark, themeMode: ThemeMode.system)` |
| **Custom extension** | ThemeExtension | `class BrandTheme extends ThemeExtension<BrandTheme> { }` |

### 6. Performance

**Core concept:** Use `const` widgets for compile-time optimization. Isolate rebuilds with `RepaintBoundary`. Profile with Flutter DevTools before optimizing. Minimize widget tree depth. Keep `build` methods fast — never do heavy computation there.

**Why it works:** `const` widgets are singleton instances reused across rebuilds — the diff engine skips them entirely. `RepaintBoundary` isolates repainting to a subtree — animations in one area don't cause the entire screen to repaint. DevTools provides widget rebuild counts and frame timing for targeted optimization.

**Key insights:**
- `const` constructors everywhere — `const Icon(Icons.add)`, `const SizedBox(height: 8)`
- Avoid rebuilding the entire tree — isolate changing widgets with `Consumer` or `Builder`
- `RepaintBoundary` wraps animated/frequently-changing widgets
- Profile: Flutter DevTools > Performance tab > widget rebuild counts
- Heavy computation in ViewModel/service, not in `build()`
- `AutomaticKeepAliveClientMixin` for tab views that should maintain state
- Pre-compute in `initState` or controllers, not in `build`

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Const** | Const widgets | `const Padding(padding: EdgeInsets.all(16))` |
| **Isolate rebuild** | RepaintBoundary | `RepaintBoundary(child: AnimatedWidget())` |
| **Profile** | DevTools | Widget Inspector → highlight rebuilds |
| **Keep state** | AutomaticKeepAlive | `class _State with AutomaticKeepAliveClientMixin` |
| **Precompute** | initState | `@override void initState() { _filtered = computeFilter(); }` |

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| **setState for shared state** | Doesn't scale, no separation | Use Riverpod/Provider |
| **Missing const constructors** | Unnecessary rebuilds | Add `const` to every static widget and constructor |
| **ListView(children:) for long lists** | All items in memory at once | Use `ListView.builder` |
| **WillPopScope** | Deprecated, breaks Android 14+ | Use `PopScope` widget |
| **Hardcoded colors** | Inconsistent UI, no dark mode | Use `Theme.of(context).colorScheme` |
| **Fixed font sizes** | Ignores system text scaling | Use `Theme.of(context).textTheme` |
| **Missing dispose()** | Memory leaks, stale listeners | Always override dispose for controllers |
| **Deep widget nesting** | Hard to read, hard to debug | Extract intermediate widgets to classes |
| **Navigator.push everywhere** | Complex state, no deep linking | Use go_router |
| **No keys on stateful list items** | State assigned to wrong widget | Add `ValueKey(item.id)` |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Using const constructors? | Wasted rebuilds | Add const to static widget instances |
| Using ListView.builder? | Memory overuse in lists | Replace children-based ListView |
| State management beyond setState? | Scalability issues | Adopt Riverpod or Provider |
| Using Theme.of(context)? | Hardcoded colors/fonts | Replace with theme accessors |
| Dark mode supported? | Incomplete UX | Add darkTheme in MaterialApp |
| Using GoRouter? | No deep linking | Migrate from Navigator |
| All controllers disposed? | Memory leaks | Override dispose() |
| Profile with DevTools? | Blind optimization | Measure rebuild counts |
| Using PopScope? | Broken on Android 14+ | Replace WillPopScope |
| Widget tree reasonably flat? | Hard to read/debug | Extract widget classes |

## Further Reading

- [Flutter Documentation](https://docs.flutter.dev/) — Official reference
- [Riverpod](https://riverpod.dev/) — Recommended state management
- [go_router](https://pub.dev/packages/go_router) — Declarative routing
- [Flutter DevTools](https://docs.flutter.dev/tools/devtools) — Performance profiling
- [Material 3 for Flutter](https://m3.material.io/develop/flutter) — Design system reference

## About

This skill synthesizes patterns from the Flutter core team, Riverpod creator Remi Rousselet, and the Dart/Flutter community. For React Native alternative, see react-native-mastery. For native iOS, see swiftui-mastery. For code quality, see clean-code.
