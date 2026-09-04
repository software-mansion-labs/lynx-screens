# Lynx Screens

This project aims to expose native navigation container components to Lynx. It is not designed to be used as a standalone library but rather as a dependency of a full-featured navigation library. The implementation is based on [`react-native-screens`](https://github.com/software-mansion/react-native-screens).

The repository is structured similarly as `react-native-screens`: a library at the root with an example app, integrated via [Lynx autolinking](https://lynxjs.org/4.0/guide/autolink.html):

- `src/` - the library sources for JS side of `lynx-screens` package
- `android/` + `ios/` - the native element implementations, exposed through `@LynxElement` annotations
- `LynxExample/` - the example app; it installs `lynx-screens` locally (`"file:../"`) and hosts the demo `StackContainer` navigator built on top of the primitives

## Getting started

Install dependencies - both the library root and the example app, which links `lynx-screens` from the repo root:

```bash
npm install
cd LynxExample
npm install
npm run dev        # start the Rspeedy dev server
```

### Android

```bash
cd LynxExample/android
./gradlew :app:assembleDebug   # or open LynxExample/android in Android Studio
```

### iOS

```bash
cd LynxExample/ios
bundle install             # once; provides CocoaPods with the cocoapods-lynx-library plugin
bundle exec pod install
open LynxScreens.xcworkspace
```

Run the `LynxScreens` app scheme from XCode.

## Sync with `react-native-screens`

The library tracks the Stack v5 work on `react-native-screens` `main` and is synced up to [`c0305806`](https://github.com/software-mansion/react-native-screens/commit/c030580604fc89d30ea13b1e56a3b9f398c4fcce) (2026-08-18). Every Stack v5 commit in that range was backported one at a time, in RNS chronological order — each backport commit links its source commit (`Related commit from RNScreens: ...`) in the commit message.

The native implementation intentionally stays as close to `react-native-screens` as possible. Divergences exist only where the Lynx platform forces them (props/state/layout plumbing, event emission, view commands) and are marked in code with `Adaptation:` / `Divergence from RNS:` comments and an `Adaptations for Lynx` section in the backport commit message.

## Roadmap

### 1. Currently supported

Already ported to Lynx and working:

| Feature | Android | iOS |
| --- | :---: | :---: |
| Base Stack v5 navigation model | ✅ | ✅ |
| `push`, `pop`, `preload`, `batch`, native pop | ✅ | ✅ |
| Nested stacks | ✅ | ✅ |
| Screen lifecycle events (`onWillAppear` / `onDidAppear` / `onWillDisappear` / `onDidDisappear`, `onDismiss`) | ✅ | ✅ |
| Per-route options updated at runtime (`setRouteOptions`) | ✅ | ✅ |
| `preventNativeDismiss` (+ `onNativeDismissPrevented`) | ✅ | ❌ |
| Predictive back gesture support (internal) | ✅ | N/A |
| Transition API / screen transitions (internal) | ✅ | ❌ |
| `ScrollViewMarker` (registers a wrapped scroll view with the enclosing screen for header integrations) | ✅ | ✅ |
| FormSheet v5 | ✅ | ✅ |

**Header — Android**

- [x] Base `headerConfig` setup (title, `small`/`medium`/`large` types, hidden, transparent) with custom subviews (background / leading / center / trailing, collapse modes)
- [x] Back button support with customization props (tint colors, custom icon, `backButtonHidden`)
- [x] Integration with Android `scrollFlags` + `liftOnScroll` (M3 Expressive app bar theme, Material 1.14)
- [x] Toolbar menu with nested submenus and groups (checkbox / radio single-selection, `menuTitle` headers)
- [x] Menu item props: icons (image sources and drawable resources) with tint colors, `title` / `titleCondensed` / `tooltipText`, `accessibilityLabel`, `disabled`, `showAsAction`
- [x] View commands: `updateToolbarMenuElements` (single and batched atomic updates)

**Header — iOS**

- [x] Base `headerConfig` setup (title / subtitle, large title / subtitle, hidden) with header items and spacers (leading / trailing / title / subtitle / largeSubtitle placements, custom views, `onPress`, `hitSlop`)
- [x] Item icons: SF Symbols, xcassets, async image / template sources
- [x] Menus and menu items (actions, toggles, radio single-selection hierarchies) with `onPress` / `onSelectionChange`
- [x] Menu props: `keepsMenuPresented`, `displayInline`, `displayAsPalette`, menu icons
- [x] `titleMenu` (menu attached to the navigation bar title, iOS 16+)
- [x] View commands: `setMenuItemOptions` / `setMenuOptions` (incl. toggle state with selection events)

### 2. Not ported / out of scope

Parts of `react-native-screens` in the synced range that were deliberately left out:

- **Native Tabs, SplitView, SafeArea, ScrollToTopGuard** — components lynx-screens doesn't port; see also the open topics below.
- **ScrollViewMarker scroll edge effects** — only the scroll view registration core of the SVM epic is ported; the iOS scroll edge effect subsystem is not.

### 3. Further plans in RNScreens

The implementation for the following features hasn't been initiated in `react-native-screens` yet, but we have plans to add the support in the nearest feature.

- [ ] Screen transition animations - the most important remaining gap before Stack v5 can be considered as feature-complete for `react-native-screens`.
- [ ] `preventNativeDismiss` support on iOS.

### 4. Open topics

- How screens should integrate with `SafeAreaView` is still unresolved in RNS. Additionally the research on the Lynx approach on this topics hasn't been investigated (who owns the insets etc.) yet. Related known gap: on iOS, v5 screen content is not inset below the navigation bar (RNS relies on UIKit's automatic scroll view insets, which Lynx's scroll view opts out of) - the examples approximate the inset with a static padding.
- Stack v5 is only a part of what `react-native-screens` ships. Whether Lynx is interested in other navigators: **Native Tabs**, **SplitView** - this hasn't been confirmed yet. Those components are good candidates for a Lynx port too.

## License

`lynx-screens` library is licensed under [The MIT License](LICENSE).
