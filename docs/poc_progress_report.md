# Lynx Screens - Technical Overview

**Project:** POC for **screens v5** native stack model on Lynx
**Repository:** https://github.com/software-mansion/lynx-screens

---

## 1. Executive Summary

Our goal was to create a POC demonstrating that the `react-native-screens` stack architecture can be reproduced on Lynx. **We successfully confirmed that exposing native navigation primitives integrates with the Lynx framework.** Currently, a working native stack runs on both Android and iOS, driven by a shared JS navigator implementation (`StackContainer`). We also developed a production-shape demo app to validate this solution in real-life scenarios.

Current State of Work:
- Basic stack model operations: push, pop, and screen preloading - all work. 
- Nesting stack navigators is supported on both platforms including advanced concepts. Native back gestures route correctly at the current nesting level. Additionally, if a nested stack pops its first (and only) screen, the operation is delegated to the parent, popping the entire nested stack.
- On Android we additionally implemented `preventNativeDismiss`, predictive back gesture support, and the Transition API for screen swipe dismissal.

**Header support is a crucial milestone required before any potential release.** The work hasn't started yet. During the initial Lynx POC, headers were not yet ready in `react-native-screens`, so we had nothing to port. Priorities shifted before this changed, and the task currently sits in the backlog.

**Open Topics & Architecture Questions.** 
- **Screen Preloading**. Lynx inherently attaches a view to the native hierarchy as soon as the instance-creation event arrives. However, preloading requires the exact opposite: building the screen now but displaying it later. Since we haven't found a native way to defer this in Lynx, both platforms currently **intercept and suppress Lynx's Child and View attachment entirely**, taking over the native hierarchy management. While this workaround is stable in our testing, **we are NOT confident if this aligns with Lynx's intended architectural design**. Resolving this is our primary open question for the Lynx team.
- **Host app integration**. Our example apps load bundles from the dev server rather than from disk, so they implement a custom template provider instead of the embedded setup shown in the [integration guide](https://lynxjs.org/guide/start/integrate-with-existing-apps?platform=ios). 
- The two platforms are at different maturity levels due to intentional prioritization of scope. Android serves as the reference implementation and includes some additional features. iOS was left only with the original POC. Achieving feature parity is a planned objective for `react-native-screens`, so we should intend to replicate this parity for Lynx as well.

---

## 2. Current Status & Achievements

### 2.1 Navigation operations

The JS navigator exposes an imperative API for controlling the navigation from the JS level. The following operations are implemented:

| Operation | Status | Notes |
|---|---|---|
| `push(routeName)` | Working | |
| `pop(routeKey)` | Working | |
| `preload(routeName)` | Working | The screen is added to model, but not presented |
| `batch([...])` | Working | |

We also differentiate the dismissal paths: JS-initiated pops and user-initiated (native) dismissals. Both are supported, with the native layer reporting the event source back to JS.

### 2.2 Nested stacks

Supported on both platforms. A route component inside `StackContainer` can itself render a nested container.

- Each nesting level resolves its own native container and its own back stack.
- A back gesture reaches the innermost active stack.
- When a nested stack is asked to pop its last remaining screen - it emits an effect that pops the screen containing it in the parent stack instead.

### 2.3 Android-specific features

These were ported because they were already available in `react-native-screens` when we reached them:

- **`preventNativeDismiss`** — a screen can refuse a native dismissal and be notified when it does.
- **Predictive back gesture** — support is **inherited** from the native android. This was problematic and required some workarounds in `react-native-screens` due to some `react-native` core architectural decisions.
- **Transition API on dismiss** — screens animate out with fully-native transitions.

---

## 3. High-Level Native Architecture

### 3.1 JS model

JS renders a declarative list of screens, marking each as either `attached` or `detached`. The native side then reconciles this state to manage the native navigation container.

To bridge this information to the native layer, we expose custom Lynx Elements:

- **`stack-host-native`** - one per stack. It manages the platform navigation object.
- **`stack-screen-native`** — one per screen. It carries the `screenKey` and `activityMode` (`attached` / `detached`).

`activityMode` is as the only source of truth driving screen preloading, popping, and dismissal classification. On the native side, the these state transitions are interpreted as follows:

- `detached` at creation = the screen is **preloaded**
- `detached` after being previously attached = the screen is **popped**
- `attached` = **pushed**.

### 3.2 Android

```
└─ StackHostView  (associated with StackHostComponent)
   └─ StackContainer  (manages Fragment operations)
      └─ StackScreenView  (one instance per screen, associated with StackScreenComponent)
      └─ StackScreenView  (one instance per screen, associated with StackScreenComponent)
```

On the native side, each screen is backed by `Fragment`. Lynx child mutations aren't applied immediately - they accumulate as push/pop intents and are managed by a centralized coordinator, which handles the following:
- conflicting operations are resolved (e.g., a new push cancels a pending pop for the same screen).
- operations are strictly sorted to ensure pops are executed top-down, while pushes are executed bottom-up.
- operations are flushed atomically only when Lynx signals the end of a patch via its `PatchFinishListener`.

This architecture ensures that a single JS render batch reliably translates into exactly one cohesive native transition.

### 3.3 iOS

```
└─ RNSStackHostView
   └─ RNSStackController  (UINavigationController — the actual navigator)
      └─ RNSStackScreenController  (UIViewController, one per screen)
         └─ RNSStackScreenView (one instance per screen, associated with RNSStackScreenComponent)
```

TODO: @t0maboro - child insertion logic

### 3.4 The architectural divergence

| Axis | Android | iOS |
|---|---|---|
| Navigation primitive | `FragmentManager` | `UINavigationController` |
| Screen primitive | `Fragment` | `UIViewController` (`.view` *is* Lynx view) |
| Reconciliation | Imperative op queue, push/pop cancellation | `setViewControllers` |
| Suppressing Lynx auto-attach | `insertView`/`removeView` no-ops | `insertSubview:` blocking direct insertion of `Screen` to `Host` |

---

## 4. Workarounds

While all the technical debt outlined below is known, deliberate, and fully documented in the source code, safely resolving some of these underlying issues may require a direct architectural guidance from the Lynx team.

### 4.1 The preloading problem

Preloading means "build a screen's view hierarchy and run its first render **now**", so that when the user navigates to it later, the transition is instant. The screen must exist but must not be visible.

Lynx attaches views to the native hierarchy **as soon as the instance-creation event arrives**. From Lynx's perspective this is reasonable - a created element is a visible element. We haven't found a solution in Lynx core to make the view "created", but not "inserted" to the native hierarchy.

**As for now, we intercept the attachment point.** Both platforms suppress Lynx's native attachment entirely and take over the hierarchy themselves. Neither platform detaches anything, because neither ever lets the attachment happen.

**On Android**, `insertView` and `removeView` — Lynx's native view attachment hooks — are overridden to do **nothing at all**:

```kotlin
override fun insertView(child: LynxUI<*>?) {
    // NO-OP
    // We intentionally ignore Lynx's default native view insertion here.
    // Responsibility for building and managing the native view hierarchy is
    // transferred to StackContainer, which utilizes FragmentManager to
    // handle view attachment within the Fragment lifecycle.
}
```

The only route into the native hierarchy becomes the fragment transaction. On top of that, the Lynx *child* insert is gated on activity mode - a detached screen is not registered as a child at all - and the insert is **replayed manually** when the prop later flips to attached:

```kotlin
// Lynx attaches children on insert by default. To support preloading,
// we manually trigger the insert logic only when confirmed ATTACHED.
insertChild(stackScreen, super.getChildCount())
```

**On iOS**, the interception happens one level lower - at `UIView` itself. The host view overrides `insertSubview:atIndex:` and silently drops any insertion of a screen view:

```objc
if ([view isKindOfClass:RNSStackScreenView.class]) {
    return;
}
```

An attached screen view has no superview at all until `UINavigationController` adopts it.

### 4.2 Why we are unsure about this approach

The workaround is stable in our testing, but we have some concerns

1. **We are overriding framework behaviour, not using an existing APIs.** We are relying on the fact that these methods happen to be overridable and that Lynx tolerates a component that ignores them. That is a behavioral contract, not a documented one, and there's a potential risk that it can change in any release without breaking change.

2. **The escape hatch is at a different level on each platform** Android intercepts at Lynx's own insertion hook; iOS relies on `UIView.insertSubview:`. The mechanism should look the same on both.

3. **It forces us to reimplement bookkeeping Lynx already does.** Because detached screens are excluded from the Lynx child list, the JS-side indices and the native-side indices diverge, so index remapping has to be done manually on removal. Lynx's child-insertion index is discarded and children are always appended. That index management is fragile and won't be obvious to whoever touches this next.

**The question for the Lynx team:** is there a supported way to express "create this element but do not attach it", or to take ownership of native attachment for a subtree? If yes, most of this section should be deleted. If no, this pattern is worth sanctioning explicitly, because any library wrapping a native navigation may encounter the similar issues.

### 4.3 Host app integration - custom template provider & resource fetcher

Both example apps ship a custom `TemplateProvider` and a `GenericResourceFetcher`, which diverges from the [official integration guide](https://lynxjs.org/guide/start/integrate-with-existing-apps).

The guide documents the embedded case - the bundle ships inside the app and is read from disk. For a POC we needed fast iteration. Both apps fetch the bundle over HTTP from the `rspeedy dev` server, which gives us the same workflow `react-native` has with Metro.

These are example-app concerns and do not affect the stack implementation itself, but they should be cleaned up before this code is production-ready.

**Open question: is `LynxTemplateProvider` a valid template loading path we should use?**

---

## 5. Missing Features

### 5.1 Header support

**Status: not started.**

Header support is the remaining blocker for a production-ready state. Its absence is strictly a matter of project priorities, not a technical difficulty. Our strategy was to directly port the `react-native-screens` architecture rather than work on a parallel implementation. However, header support was not yet finalized in `react-native-screens` when the Lynx implementation began.

Without a mature reference architecture to port, building headers from scratch for Lynx would have required designing the abstraction and attempting to merge this solution `react-native-screens` later. We therefore deferred it. Priorities changed before the upstream implementation was in "usable" state, and the task has sit in the backlog since.

### 5.2 iOS parity

iOS needs: `preventNativeDismiss` and some refactors we made for transactions boundary for `react-native-screens` that haven't been ported yet.

### 5.3 Autolinking

**Status: not attempted.**

Currently, both example applications register every custom native Element manually. On Android, this is done via `addBehavior`:

```kotlin
viewBuilder.addBehavior(object : Behavior("stack-host-native") {
    override fun createUI(context: LynxContext) = StackHostComponent(context)
})
```

On iOS, it relies on `LYNX_LAZY_REGISTER_UI` combined with an explicit `registerUI` call within the `ViewController`.

With [Autolinking](https://lynxjs.org/guide/autolink.html) support now available in Lynx, this static configuration should become obsolete. Automated, annotation-driven registration of native Elements is a strict requirement for shipping this implementation as a standalone library.

We started working on the POC on **Lynx 3.5**, where manual registration was the only available method. Although we have recently upgraded both platforms to Lynx **3.9.0** (which should support autolinking), we have not yet attempted to adopt it. The current codebase contains no preliminary work for this feature.

The impact is low while this remains a POC - manual registration is "good enough", but for shipping the final solution we definitely need to work on that.

---

## 6. Conclusion

The `react-native-screens` architecture ports to Lynx, and the port was mostly straightforward once the native component structure was settled.

There are two things that prevents us from treating it as production-ready solution. First, **preloading required us to override framework behavior**, and we would like to refine that pattern. Second, **headers implementation hasn't started**, and the demo application revealed that causing to implement the custom header and take care of SafeArea and content management manually.
