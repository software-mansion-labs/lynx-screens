# Lynx Screens

This project aims to expose native navigation container components (currently the Stack v5 navigation model) to Lynx. It is not designed to be used as a standalone library but rather as a dependency of a full-featured navigation library. The implementation is based on [`react-native-screens`](https://github.com/software-mansion/react-native-screens).

The repository is a playground app rather than a shippable library: 
- `src/` holds the ReactLynx side (`StackContainer`, navigation state, native component wrappers)
- `android/` + `apple/` hold the native element implementations, which are statically registered inside the application context.

## Getting started

```bash
npm install
npm run dev        # start the Rspeedy dev server
```

Then run the `android/` or `apple/` project from the proper IDE.

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

### 2. Able to port from RNScreens

These features have already landed in `react-native-screens` after the Lynx port branched off. They are implemented and actively developed on the RNS side, so they are in a state where porting can start.

**Header - Android**

- [ ] Base `headerConfig` + `headerSubviews` setup
- [ ] Back button support with customization props (tint color, custom icon)
- [ ] Integration with Android `scrollFlags`
- [ ] Toolbar, menus and submenus support
- [ ] `showAsAction` support
- [ ] Menu item props: icons and colors for items

**Header - iOS**

- [ ] Base `headerConfig` + `headerSubviews` setup
- [ ] Menus and menu items
- [ ] Menu props: `keepsMenuPresented`, `displayInline`, `displayAsPalette`, menu icons

The header work in RNS is still actively developed and the API shape may change.

### 3. Further plans in RNScreens

The implementation for the following features hasn't been initiated in `react-native-screens` yet, but we have plans to add the support in the nearest feature.

- [ ] Screen transition animations - the most important remaining gap before Stack v5 can be considered as feature-complete for `react-native-screens`.
- [ ] `preventNativeDismiss` support on iOS.

### 4. Open topics

- How screens should integrate with `SafeAreaView` is still unresolved in RNS. Additionally the research on the Lynx approach on this topics hasn't been investigated (who owns the insets etc.) yet.
- Stack v5 is only a part of what `react-native-screens` ships. Whether Lynx is interested in other navigators: **Native Tabs**, **SplitView** - this hasn't been confirmed yet. Those components are good candidates for a Lynx port too.
