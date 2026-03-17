---
name: react-native-mastery
description: 'Master React Native components, navigation, and performance patterns. Use when the user mentions "React Native", "Expo", "FlatList", "React Navigation", "Reanimated", "react-native-gesture-handler", or "cross-platform mobile". Covers components, navigation, list optimization, animations, and native integration. For React fundamentals, see react-mastery. For native iOS, see swiftui-mastery.'
license: MIT
metadata:
  author: todyle
  version: "1.0.0"
---

# React Native Mastery Framework

A comprehensive guide to building production React Native applications. Apply these principles when building cross-platform mobile apps, optimizing lists, implementing gesture-based animations, or integrating native modules.

## Core Principle

**React Native bridges React's declarative model to native platform views — write JavaScript/TypeScript that renders to UIView (iOS) and android.view.View (Android).** The most impactful skill is understanding where the JS thread ends and the native thread begins, and keeping the bridge traffic minimal.

**The foundation:** Performance in React Native comes down to three things: minimizing bridge crossings, running animations on the UI thread (via Reanimated), and virtualizing lists properly (FlatList with all optimizations). Get these three right and your app feels native.

## Scoring

**Goal: 10/10.** When reviewing React Native code, rate 0-10:

- **9-10:** Expo workflow, FlatList with all optimizations, Reanimated for animations, proper platform handling, Detox E2E
- **7-8:** Good patterns with minor issues (ScrollView for long lists, JS thread animations)
- **5-6:** Working app but slow lists, no gesture handling, inconsistent platform behavior
- **3-4:** Web React patterns forced onto mobile, TouchableOpacity everywhere, no performance optimization
- **1-2:** Direct DOM thinking, no native considerations, broken on one platform

## The React Native Mastery Framework

Six disciplines for building production React Native applications:

### 1. Components & Styling

**Core concept:** Use functional components with hooks. Styles go in `StyleSheet.create()` for optimization. Handle platform differences with `Platform.select()` or `.ios.tsx`/`.android.tsx` files. Use `Pressable` instead of `TouchableOpacity` for modern touch handling.

**Why it works:** `StyleSheet.create()` validates styles at creation time and creates an optimized reference — inline objects create new references on every render. `Pressable` provides a unified API with `android_ripple`, `pressed` state styling, and `hitSlop` for touch target expansion.

**Key insights:**
- `StyleSheet.create({})` for all styles — never inline style objects
- `Pressable` over `TouchableOpacity` — more flexible, better touch feedback
- `Platform.select({ ios: {}, android: {} })` for platform-specific styles
- `useWindowDimensions()` for responsive layouts — not fixed pixel values
- Flexbox is the layout model — `flexDirection` defaults to `'column'` (unlike web)
- Colocate component files: `components/Button/index.tsx` + `styles.ts`
- `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` for small touch targets

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Styles** | StyleSheet | `const styles = StyleSheet.create({ container: { flex: 1 } })` |
| **Touch** | Pressable | `<Pressable onPress={} android_ripple={{ color: 'gray' }}>` |
| **Platform** | Platform.select | `Platform.select({ ios: { shadow }, android: { elevation: 4 } })` |
| **Responsive** | useWindowDimensions | `const { width } = useWindowDimensions()` |
| **Touch target** | hitSlop | `<Pressable hitSlop={10}>` |

### 2. Navigation

**Core concept:** React Navigation is the standard — stack, tab, drawer navigators. Type navigation params for safety. Handle the Android back button with `BackHandler`. Configure deep linking for URL-based navigation.

**Why it works:** React Navigation provides native-feeling transitions (iOS slide, Android fade) and handles the complex state management of navigation stacks. Typed params prevent runtime crashes from missing route parameters. Deep linking enables push notifications and external URLs to navigate to specific screens.

**Key insights:**
- Stack, Tab, Drawer navigators compose into complex nav structures
- Type `RootStackParamList` for type-safe `navigation.navigate()`
- `useFocusEffect` for logic that runs when screen is focused (not just mounted)
- `BackHandler.addEventListener` in `useFocusEffect` for Android back
- Deep linking: `linking: { prefixes: ['myapp://'], config: { screens: {} } }`
- `navigation.setOptions()` for dynamic header configuration

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Stack** | createStackNavigator | `const Stack = createNativeStackNavigator<RootStackParamList>()` |
| **Navigate** | Typed params | `navigation.navigate('Details', { id: item.id })` |
| **Focus effect** | useFocusEffect | `useFocusEffect(useCallback(() => { loadData() }, []))` |
| **Back handler** | BackHandler | `BackHandler.addEventListener('hardwareBackPress', handleBack)` |
| **Deep link** | linking config | `linking: { prefixes: ['myapp://'], config: { screens: { Home: '' } } }` |

### 3. Lists & Performance

**Core concept:** `FlatList` for any list over ~20 items — it virtualizes rendering. Always provide `keyExtractor`, memoize `renderItem` components with `React.memo`, use `getItemLayout` for known heights, and tune `windowSize` for memory optimization.

**Why it works:** `ScrollView` with `.map()` renders ALL items into the DOM — 1,000 items means 1,000 views in memory. `FlatList` only renders what's visible (plus a buffer), dramatically reducing memory and improving scroll performance. Each optimization (`getItemLayout`, `memo`, `windowSize`) compounds.

**Key insights:**
- `FlatList` over `ScrollView` + `.map()` for 20+ items — always
- `keyExtractor={(item) => item.id}` — stable unique key, never index
- `renderItem` component wrapped in `React.memo` — prevent re-renders
- `getItemLayout` for fixed-height items — skip measurement pass
- `windowSize={5}` reduces off-screen rendering (default 21 is overkill)
- `removeClippedSubviews={true}` on Android for additional memory savings
- `initialNumToRender={10}` for faster initial render
- `SectionList` for grouped data with section headers

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Basic list** | FlatList | `<FlatList data={items} keyExtractor={i => i.id} renderItem={...}/>` |
| **Memoized item** | React.memo | `const Item = memo(({ item }) => <View>...</View>)` |
| **Fixed height** | getItemLayout | `getItemLayout={(_, i) => ({ length: 60, offset: 60 * i, index: i })}` |
| **Memory** | windowSize | `windowSize={5}` |
| **Sections** | SectionList | `<SectionList sections={[{ title: 'A', data: [...] }]}/>` |

### 4. Animation

**Core concept:** Use `react-native-reanimated` for 60fps animations on the UI thread. `Gesture Handler` for native gesture recognition. Worklets run on the UI thread — no bridge crossing, no JS thread blocking. Shared values bridge between JS and UI threads.

**Why it works:** The Animated API runs on the JS thread — complex animations block JavaScript and cause jank. Reanimated runs animation worklets on the native UI thread independently, achieving consistent 60fps even during heavy JS computation. Gesture Handler processes touches natively without bridge round-trips.

**Key insights:**
- `useSharedValue` for animation values that live on UI thread
- `useAnimatedStyle` returns styles computed on UI thread
- `withSpring()`, `withTiming()`, `withDecay()` for animation types
- Gesture Handler: `<GestureDetector gesture={pan}>` for native gestures
- `runOnUI(() => {})` for running worklets on UI thread
- Combine with gesture: drag, swipe-to-dismiss, pinch-to-zoom
- `Layout.duration(300)` for layout animations on entering/exiting

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Shared value** | useSharedValue | `const offset = useSharedValue(0)` |
| **Animated style** | useAnimatedStyle | `useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }))` |
| **Spring** | withSpring | `offset.value = withSpring(targetValue)` |
| **Gesture** | GestureDetector | `<GestureDetector gesture={Gesture.Pan().onUpdate(e => {...})}/>` |
| **Layout anim** | entering/exiting | `<Animated.View entering={FadeIn} exiting={FadeOut}/>` |

### 5. Native Integration

**Core concept:** Use Expo for maximum productivity — it handles native configuration, builds, and over-the-air updates. Request permissions with proper checks. Use Hermes engine for improved startup time and memory usage.

**Why it works:** Expo abstracts native complexity (Xcode, Gradle, linking) while providing escape hatches when you need native code. The managed workflow covers 90%+ of app needs. For the remaining 10%, Expo Go and EAS Build support custom native modules.

**Key insights:**
- Expo for new projects — `npx create-expo-app`
- `expo-image` over `Image` for caching and performance
- `PermissionsAndroid.request()` before accessing camera, location, etc.
- Hermes enabled by default — faster startup, lower memory
- `expo-notifications` for push notifications (cross-platform)
- EAS Build for cloud-based native builds
- EAS Update for over-the-air JavaScript updates

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **New project** | Expo | `npx create-expo-app my-app --template` |
| **Images** | expo-image | `<Image source={url} cachePolicy="memory-disk"/>` |
| **Permissions** | Request flow | `const { status } = await Camera.requestPermissionsAsync()` |
| **OTA update** | EAS Update | `eas update --branch production` |

### 6. Testing

**Core concept:** React Native Testing Library for component tests, Detox for end-to-end tests on real devices. Test behavior and accessibility — not implementation details. Always test on both iOS and Android devices.

**Why it works:** RNTL mirrors Testing Library's philosophy — test what users see and do. Detox runs on real device simulators providing confidence that touch interactions, navigation, and native features work correctly. Both platforms must be tested — many bugs are platform-specific.

**Key insights:**
- React Native Testing Library: `render`, `fireEvent`, `waitFor`
- Detox for critical E2E flows — login, purchase, onboarding
- Test on real devices — simulators miss performance issues
- `accessibilityLabel` doubles as test handle AND screen reader text
- `accessibilityRole` for semantic meaning

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Component test** | RNTL render | `render(<PostList/>); expect(screen.getByText('Title'))` |
| **User action** | fireEvent | `fireEvent.press(screen.getByRole('button', { name: 'Submit' }))` |
| **E2E** | Detox | `await element(by.id('login-btn')).tap()` |

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| **ScrollView + map for long lists** | All items in memory, slow | Use `FlatList` with virtualization |
| **Index as keyExtractor** | Wrong items update on changes | Use `item.id` as key |
| **Inline renderItem function** | Re-creates on every render | Extract + `React.memo` |
| **JS thread animations** | Jank, blocked interactions | Use Reanimated worklets on UI thread |
| **Inline style objects** | New reference every render | `StyleSheet.create()` |
| **No platform handling** | Broken on one platform | `Platform.select()` or `.ios`/`.android` files |
| **TouchableOpacity in new code** | Limited API, deprecated pattern | Use `Pressable` |
| **No hitSlop on small targets** | Frustrating touch experience | `hitSlop={10}` on icons and small buttons |
| **Bare RN for new projects** | Unnecessary complexity | Use Expo managed workflow |
| **Simulator-only testing** | Miss real device issues | Test on physical devices |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Using FlatList for lists? | Performance issues | Replace ScrollView+map with FlatList |
| Items memoized in lists? | Unnecessary re-renders | Wrap renderItem component in React.memo |
| Animations on UI thread? | Jank during interaction | Migrate to Reanimated useSharedValue |
| Using Pressable? | Missing touch feedback | Replace TouchableOpacity |
| Using StyleSheet.create? | Style validation missing | Move styles out of render |
| Platform differences handled? | One platform broken | Add Platform.select checks |
| Permissions requested properly? | Crash or denied | Check and request permissions |
| Tests on both platforms? | Platform-specific bugs | Run Detox on iOS + Android |

## Further Reading

- [React Native Documentation](https://reactnative.dev/) — Official reference
- [Expo Documentation](https://docs.expo.dev/) — Managed workflow
- [React Navigation](https://reactnavigation.org/) — Standard navigation library
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/) — UI thread animations
- [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) — Native gestures

## About

This skill synthesizes patterns from the React Native core team, Expo team, Software Mansion (Reanimated, Gesture Handler), and community best practices. For React web fundamentals, see react-mastery. For native iOS, see swiftui-mastery. For Flutter alternative, see flutter-mastery.
