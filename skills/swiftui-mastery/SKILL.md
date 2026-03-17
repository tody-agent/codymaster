---
name: swiftui-mastery
description: 'Master SwiftUI views, state management, and navigation. Use when the user mentions "SwiftUI", "@State", "@Binding", "@Observable", "NavigationStack", "SwiftUI views", or "iOS app design". Covers view composition, state property wrappers, navigation, layout, and architecture. For iOS design guidelines, see ios-hig-design. For cross-platform mobile, see react-native-mastery.'
license: MIT
metadata:
  author: todyle
  version: "1.0.0"
---

# SwiftUI Mastery Framework

A comprehensive guide to building production iOS/macOS applications with SwiftUI. Apply these principles when building native Apple apps, choosing state management patterns, designing navigation flows, or optimizing view performance.

## Core Principle

**SwiftUI is declarative — describe WHAT your UI looks like for each state, and the framework handles HOW to update.** Views are lightweight value types (structs) that are cheap to create. The `body` property is a function of state — when state changes, SwiftUI diffs the view tree and updates only what changed.

**The foundation:** The most common confusion in SwiftUI is choosing the right state property wrapper. `@State` for view-local value types, `@Binding` for two-way child access, `@StateObject` for view-owned reference types, `@ObservedObject` for injected reference types, `@EnvironmentObject` for app-wide shared state, and `@Observable` (iOS 17+) for the modern approach that simplifies all of the above.

## Scoring

**Goal: 10/10.** When reviewing SwiftUI code, rate 0-10:

- **9-10:** Correct property wrappers, NavigationStack, small focused views, @Observable for iOS 17+, proper accessibility
- **7-8:** Good patterns with minor issues (wrong wrapper choice, GeometryReader overuse)
- **5-6:** Working code but monolithic views, NavigationView (deprecated), mixed UIKit
- **3-4:** Imperative UIKit thinking in SwiftUI, 500+ line views, wrong modifier order
- **1-2:** Fighting the framework, using UIKit wrappers for everything SwiftUI handles

## The SwiftUI Mastery Framework

Six disciplines for building production SwiftUI applications:

### 1. Views & Modifiers

**Core concept:** Views are structs conforming to the `View` protocol. Each has a `body` computed property returning `some View`. Keep views small and focused — extract subviews when things get complex. Modifier order matters — `padding` before `background` gives different results than the reverse.

**Why it works:** SwiftUI views are value types — creating them is essentially free. The framework compares view descriptions to determine minimal DOM updates. Small views compose easily, name clearly, and test independently. Modifier ordering creates a pipeline where each modifier wraps the previous result.

**Key insights:**
- `struct MyView: View { var body: some View { } }` — always struct, never class
- `.padding().background(Color.red)` ≠ `.background(Color.red).padding()` — order matters
- Extract subviews at 20+ lines — `<Header/>` `<Content/>` `<Footer/>`
- Custom `ViewModifier` for reusable modifier combinations
- Conditional modifiers should keep view identity — use same view type in both branches
- `.frame(maxWidth: .infinity)` for full-width, not fixed `.frame(width: 375)`
- Use `#Preview` macro (Xcode 15+) with multiple state configurations

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **View struct** | Standard view | `struct ProfileView: View { var body: some View { } }` |
| **Modifier order** | Padding then bg | `.padding(16).background(.blue).cornerRadius(8)` |
| **Custom modifier** | ViewModifier | `struct CardStyle: ViewModifier { func body(content:) }` |
| **Conditional** | Same type | `Text(title).foregroundColor(isActive ? .blue : .gray)` |
| **Preview** | #Preview | `#Preview("Light") { ContentView() }` |

### 2. State Management

**Core concept:** Choose the right property wrapper based on ownership and type. `@State` owns local value types. `@Binding` borrows from parent. `@StateObject` owns reference types. `@ObservedObject` borrows reference types. `@Observable` (iOS 17+) replaces most of these with simpler fine-grained tracking.

**Why it works:** SwiftUI re-renders views when state they depend on changes. Using the wrong wrapper causes either missed updates (not observing) or unnecessary re-renders (observing too much). `@Observable` (iOS 17+) tracks actual property access — only views reading a specific property update when it changes.

**Key insights:**
- `@State private var count = 0` — view-local, SwiftUI-managed, always `private`
- `@Binding var isOn: Bool` — two-way reference to parent's state, pass with `$isOn`
- `@StateObject` — view CREATES and OWNS the object (survives re-renders)
- `@ObservedObject` — view RECEIVES the object (doesn't manage lifecycle)
- `@EnvironmentObject` — app-wide injected state
- `@Observable` (iOS 17+) — modern macro, tracks property access automatically
- `@Bindable` — create bindings from `@Observable` objects
- `@Published` in `ObservableObject` — automatically notifies observers

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Local state** | @State | `@State private var isExpanded = false` |
| **Child access** | @Binding | `@Binding var selectedTab: Int` |
| **View model (own)** | @StateObject | `@StateObject private var vm = ProfileViewModel()` |
| **View model (inject)** | @ObservedObject | `@ObservedObject var vm: ProfileViewModel` |
| **Modern (iOS 17+)** | @Observable | `@Observable class ViewModel { var count = 0 }` |
| **App-wide** | @EnvironmentObject | `@EnvironmentObject var settings: AppSettings` |

### 3. Navigation

**Core concept:** `NavigationStack` (iOS 16+) with `navigationDestination(for:)` provides type-safe, programmatic navigation. It replaces the deprecated `NavigationView`. Use `@Environment(\.dismiss)` for programmatic dismissal. Deep linking maps URLs to navigation state.

**Why it works:** NavigationStack manages a navigation path as a value type — you can save, restore, and programmatically manipulate the entire navigation state. Type-safe destinations prevent runtime crashes from wrong view types. Path-based navigation supports deep linking naturally.

**Key insights:**
- `NavigationStack` replaces `NavigationView` (deprecated)
- `.navigationDestination(for: Item.self)` for type-safe navigation targets
- `NavigationLink(value: item)` pushes to registered destination
- `@State private var path = NavigationPath()` for programmatic control
- `@Environment(\.dismiss) var dismiss` for pop/sheet dismissal
- `.sheet(isPresented:)` and `.fullScreenCover(isPresented:)` for modal presentation
- `.toolbar { ToolbarItem(placement:) { } }` for navigation bar items

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Navigation** | NavigationStack | `NavigationStack { List { NavigationLink(value: item) } }` |
| **Destination** | Type-safe | `.navigationDestination(for: Item.self) { item in DetailView(item: item) }` |
| **Programmatic** | Path | `path.append(item)` |
| **Dismiss** | Environment | `@Environment(\.dismiss) var dismiss; Button("Close") { dismiss() }` |
| **Modal** | sheet | `.sheet(isPresented: $showSettings) { SettingsView() }` |
| **Toolbar** | ToolbarItem | `.toolbar { ToolbarItem { Button("Add") { } } }` |

### 4. Layout

**Core concept:** `VStack`, `HStack`, `ZStack` for linear layouts. `LazyVStack`/`LazyHStack` for lists with many items. `Grid` for two-dimensional layouts. `GeometryReader` only when you truly need parent dimensions. Use `spacing`, `padding`, and `frame` consistently.

**Why it works:** Stack-based layout is intuitive — nested VStacks/HStacks describe most UIs naturally. Lazy stacks only instantiate views that are on-screen, critical for performance with large data sets. GeometryReader should be rare — most layouts are expressible without it.

**Key insights:**
- `VStack`, `HStack`, `ZStack` for simple linear/overlay layouts
- `LazyVStack` / `LazyHStack` for 100+ items — lazy instantiation
- `Spacer()` pushes content apart within stacks
- `.frame(maxWidth: .infinity, alignment: .leading)` for full-width aligned content
- `GeometryReader` only for responsive calculations — avoid wrapping everything
- `Grid` (iOS 16+) for table-like layouts with aligned columns
- Consistent spacing — use a design system scale, not magic numbers

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Vertical list** | VStack/LazyVStack | `LazyVStack { ForEach(items) { item in Row(item) } }` |
| **Horizontal** | HStack | `HStack { Image(...) VStack { Text(title) Text(subtitle) } }` |
| **Full width** | frame | `.frame(maxWidth: .infinity, alignment: .leading)` |
| **Overlay** | ZStack | `ZStack { Image(...) Text("Overlay") }` |
| **Spacing** | padding | `.padding(16)` or `.padding(.horizontal, 20)` |

### 5. Lists & Data

**Core concept:** `List` for standard scrollable content with system styling. `ForEach` requires `Identifiable` items or explicit `id:`. Use `.task` modifier for async data loading with automatic cancellation. `@FocusState` manages keyboard focus for forms.

**Why it works:** `List` provides platform-native gestural features (swipe-to-delete, reorder) automatically. `.task` is superior to `onAppear` + `Task {}` because it automatically cancels the task when the view disappears. `@FocusState` eliminates UIKit first-responder management.

**Key insights:**
- `List` for scrollable content with system chrome (separators, insets)
- `ForEach` requires `Identifiable` protocol or explicit `id:` parameter
- `.task { await loadData() }` — automatic cancellation on disappear
- `.onDelete(perform:)` and `.onMove(perform:)` for list editing
- `@FocusState` for keyboard focus management — `focused = .email`
- `@MainActor` on view models for thread-safe UI updates
- `Form` + `Section` for settings-style screens

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **List** | Standard list | `List { ForEach(items) { item in ItemRow(item) } }` |
| **Identifiable** | Protocol | `struct Item: Identifiable { let id: UUID; let title: String }` |
| **Async load** | .task | `.task { items = await api.fetchItems() }` |
| **Swipe delete** | onDelete | `.onDelete { indexSet in items.remove(atOffsets: indexSet) }` |
| **Focus** | @FocusState | `@FocusState var isFocused: Bool` |
| **Settings** | Form | `Form { Section("Profile") { TextField("Name", text: $name) } }` |

### 6. Architecture & Testing

**Core concept:** MVVM separates view logic into `ViewModel` classes. Views are "dumb" — they display ViewModel state and forward user actions. Dependency injection via `init` parameters makes ViewModels testable. Use `@MainActor` for thread safety.

**Why it works:** ViewModels are plain Swift classes that can be unit tested without SwiftUI infrastructure. Views become simple state renderers. Dependency injection via protocols enables mock substitution in tests. `@MainActor` guarantees UI updates happen on the main thread.

**Key insights:**
- ViewModel: `@Observable class ProfileViewModel { var items: [Item] = [] }`
- Views read from ViewModel: `Text(vm.userName)` not business logic in views
- Inject dependencies: `init(service: ServiceProtocol)` for testability
- `@MainActor` on ViewModels ensures `@Published` updates are main-thread safe
- Preview with mock data: `#Preview { ProfileView(vm: .preview) }`
- Unit test ViewModels with XCTest — no SwiftUI dependency needed

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **ViewModel** | @Observable | `@Observable class VM { var items: [Item] = [] }` |
| **View uses VM** | Simple rendering | `@State var vm = ProfileVM(); Text(vm.name)` |
| **DI** | Protocol injection | `init(service: APIServiceProtocol)` |
| **Thread safety** | @MainActor | `@MainActor class ViewModel { }` |
| **Test** | XCTest | `func testLoad() async { await vm.load(); XCTAssertEqual(vm.items.count, 3) }` |

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| **@ObservedObject for owned object** | Object recreated on re-render, state lost | Use `@StateObject` for objects the view creates |
| **@StateObject for injected object** | Double initialization, wrong ownership | Use `@ObservedObject` for objects passed from parent |
| **500+ line View struct** | Impossible to debug, test, or modify | Extract subviews — each view < 50 lines |
| **NavigationView in new code** | Deprecated, limited API | Use `NavigationStack` (iOS 16+) |
| **GeometryReader everywhere** | Performance cost, layout complexity | Use built-in modifiers (`.frame`, `.aspectRatio`) |
| **Wrong modifier order** | Unexpected visual results | Remember: modifiers wrap from inside out |
| **onAppear + Task for async** | No automatic cancellation | Use `.task { }` modifier |
| **Forgetting accessibility labels** | VoiceOver cannot describe elements | Add `.accessibilityLabel("description")` |
| **Fixed font sizes** | Doesn't respect Dynamic Type | Use `.font(.body)` system styles |
| **No @MainActor on VM** | Thread safety crashes | Add `@MainActor` to ViewModel class |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Are property wrappers correct? | State bugs | Audit @State vs @StateObject vs @ObservedObject |
| Using NavigationStack? | Deprecated API | Migrate from NavigationView |
| Views under 50 lines? | Hard to maintain | Extract subviews |
| Using .task for async? | No auto-cancellation | Replace onAppear + Task |
| Using @Observable (iOS 17+)? | Unnecessary re-renders | Migrate from ObservableObject |
| Accessibility labels present? | VoiceOver fails | Add .accessibilityLabel |
| Modifier order correct? | Visual bugs | padding → background → cornerRadius |
| Previews for multiple states? | Visual regressions | Add #Preview for light/dark/loading/error |
| Dynamic Type supported? | Fixed text sizes | Use system font styles |
| ViewModels unit tested? | No safety net | XCTest for ViewModel methods |

## Further Reading

- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui) — Apple official reference
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) — iOS design standards
- [Hacking with Swift](https://www.hackingwithswift.com/quick-start/swiftui) — Paul Hudson's tutorials
- [SwiftUI by Example](https://www.hackingwithswift.com/quick-start/swiftui) — Comprehensive cookbook
- [WWDC SwiftUI sessions](https://developer.apple.com/videos/swiftui) — Direct from Apple engineers

## About

This skill synthesizes patterns from Apple's SwiftUI documentation, WWDC sessions, and community best practices. For iOS design guidelines, see ios-hig-design. For cross-platform mobile, see react-native-mastery or flutter-mastery. For code quality, see clean-code.
