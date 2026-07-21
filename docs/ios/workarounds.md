# Lynx Screens - iOS Workarounds, Issues & Adaptations

>
> **Verified against Lynx `3.9.0` source**.
>
> **How to read the verdicts.** Each item is tagged:
>
> * **Required** - load-bearing; removing it breaks a feature. No alternative found.
> * **Required-but-fragile** - currently necessary, but rests on undocumented behavior we'd like sanctioned or replaced.
> * **Suboptimal** - works, not strictly necessary in its current form; should be refined.
> * **Cleanup** - example-app / hygiene concern, not part of the library contract.
>

---

## 0. Executive summary

| # | Workaround | Verdict | Still needed? |
|---|---|---|---|
| 1 | `insertSubview:` management | Required-but-fragile | **Yes** - the native `setViewControllers` should take care of attaching custom native components |
| 2 | Override `insertChild`/`removeChild` + manual index remapping | Required-but-fragile | **Yes** - direct consequence of #1 |
| 3 | `dispatch_async` to coalesce transitions | Suboptimal | **Replace** - iOS *does* have `onNodeReady` |
| 4 | Responder-chain walk to attach the nav controller | Required-but-fragile | **Yes** - no VC accessor exists; but this is what Lynx itself does internally |
| 5 | Autolinking support | Suboptimal | **Partly** - should be possible on 3.9.0, but hasn't been verified yet |
| 6 | Custom `TemplateProvider` + `GenericResourceFetcher` | Cleanup | **No** (for library); note `LynxTemplateProvider` is the engine's legacy path |

**After verification, only one item genuinely needs Lynx-team input:** **#1/#2** (deferred / owned attachment — no first-class API exists; the in-framework pattern is to override `insertChild:` as the `list` component does).

---

## 1. Suppressing Lynx's native view attachment

**Verdict: Required-but-fragile - the primary open question for Lynx.**

### What we do

`LynxUI.insertChild` method automatically calls `insertSubview`, taking the management over the native hierarchy. However, we need to intercept and ignore this call when dealing with a `StackHost` - `StackScreen` communication. While attaching a `StackScreen` as a Lynx child of a `StackHost` is reasonable for Lynx component hierarchy (similarly to `reactSubviews`), the native hierarchy requires screen management to be realized by `RNStackController` (at the view controller level), rather than relying on direct insertions.

```objc
- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index {
    if ([view isKindOfClass:RNSStackScreenView.class]) {
        return; // never let Lynx attach a screen to the host directly
    }
    [super insertSubview:view atIndex:index];
}
```

The only path a screen view takes into the native hierarchy should be realized by `UINavigationController.setViewControllers`.

Lynx attaches a view to the native hierarchy **as soon as the element-creation event arrives** - from Lynx's point of view a created element is a visible element. We found no Lynx API to say "create this element but do not attach it." So we intercept the attachment point and take over hierarchy management entirely.

### Do we need workaround? - verified against Lynx 3.9.0: **Yes.**

* **"Created = attached" is confirmed in the base class.** `LynxUI insertChild:atIndex:` attaches the child view in the same call `[self.view insertSubview:[child view] atIndex:index];`. The owner flow (`LynxUIOwner`, `insertNode:toParent:atIndex:` - `insertChild:`) attaches on insert; so there is no "created but unattached" state exposed - also problematic to screen preloading operation where we need to have the Screen component prepared on the JS side, but not attached natively.

### Potential risks

* **We're overriding framework behavior, not using an API.** 

We rely on `insertSubview:` being overridable and on Lynx tolerating the components that manipulates the native hierarchy. That's a behavioral contract, so might be problematic if the internal logic will change.

### Potential adjustments

`LynxUIListContainer` overrides `insertChild:atIndex:`, but **never calls `insertSubview`**, managing native attach/detach cycle itself. We could mirror that — override `RNSStackHostComponent insertChild:` instead of `RNSStackHostView.insertSubview:` (the `UIView`).
**Trade-off:** we cannot call `[super insertChild:atIndex]` on `LynxUI` while it couples the `insertSubview` call, but also realizes some side effects regarding sublayers, so overriding it, we may need to reimplement that logic and manage it on our side. The `UIView`-level preventing is the way to suppress only the view attachment while the rest of `insertChild:` runs following the core path, which is defensible.

### Open question for Lynx

> Is there a supported way to express *"create this element but do not attach it to the native hierarchy"*, or to take ownership of native attachment for a subtree? Today the only known for us in-framework pattern is to override `insertChild:` (as `list` does). If a first-class API existed, this section and most of #2 would disappear; if not, this pattern deserves an explicit guidance, because any library wrapping native navigation will hit it.

---

## 2. Overriding child bookkeeping + manual index remapping

**Verdict: Required-but-fragile - a direct, unavoidable consequence of #1.**

### What we do

Because a detached (preloaded) screen must **not** be attached, we manually exclude it from the Lynx child list until it becomes attached, and we take over index management (`RNSStackHostComponent`):

* `insertChild:atIndex:` (`:119`) - defers the real insertion to `updateChildMountingForStackScreen`.
* `updateChildMountingForStackScreen:` registers the child **only** when when the intention is to attach (`activityMode == .attached`) and the screen hasn't been mounted yet (no presence in `children` array); **always appending the child to the end of the list, ignoring the index param**:.
* `removeChild:atIndex:` **is then forced to ignore the index Lynx passes** and recomputes the real one.

### Why it exists

Once detached screens are excluded from `children`, the **JS-side index and the native `children` index diverge.** Lynx's insertion index is meaningless to us, so we discard it and always append; and on removal we must translate back to our own ordering.

### Do we actually need it? - verified: **Yes, given #1.**

* This is not an independent choice - it is forced by #1. If detached screens aren't in the child list (they can't be, or they'd attach), then indices **must** be managed by us.

### Risk

* Index remapping is manual and isn't obvious for maintainers.

---

## 3. Coalescing transitions with `dispatch_async` instead of a patch boundary

**Verdict: Suboptimal - and now known to be replaceable. iOS *does* expose a real patch finish signal**

### What we do

To turn many `activityMode` changes in one JS render into a single `setViewControllers` call, we defer the reconcile to the end of the current runloop turn

```objc
if (!_isMountingTransactionPending) {
    _isMountingTransactionPending = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
        self->_isMountingTransactionPending = NO;
        [self lynxMountingTransactionDidFinish]; // one reconcile per runloop turn
    });
}
```

### Why it exists

Without coalescing, many changes in a single render would try triggering many native transitions, what's suboptimal. We need a signal that JS patch has completed. On iOS we approximated that with next runloop turn signal.

### Why it's suboptimal?

1. It flushes atomically on Lynx's`PatchFinishListener`.
2. `dispatch_async` is fragile as it's unrelated to Lynx prop-updates flow.

### Verified: iOS *might* have a proper patch signal

1. `LynxUI onNodeReady`

Is this dispatch working on per-node manner? Do we have a disparity with android where we have `onPatchFinish` that's working on a global manner?

???

### Recommendation

Try adapting to **`onNodeReady`** on `RNSStackHostComponent` instead of `dispatch_async`. This matches Android's atomic-flush model, removes the "one runloop turn == one patch" assumption, and needs no Lynx-team involvement.

---

## 4. Attaching the navigation controller via the responder chain

**Verdict: Required-but-fragile - needed because Lynx gives components no VC context. (We have the same implementation in RN context)**

### What we do

`lynxAddControllerToClosestParent:` walks up the superview chain and, for each superview, walks the responder chain to find the nearest `UIViewController`, then adopts our `UINavigationController` as its child.

### Why it exists

Lynx hands components a `UIView` and no reference to any parent `UIViewController`, so we discover it ourselves at `didMoveToWindow` time.

### Do we actually need it? - verified against Lynx 3.9.0: **Yes, we have the same approach in RN, so it's fine.**

* **Lynx also uses the same responder-chain walk pattern**  in `LynxUIOverlay` to find its `customViewController`.

## 5. Autolinking

**Verdict: Suboptimal - redundant; should be replaced by autolinking.**

### What we do

Both elements are registered statically on the app level:

* `LYNX_LAZY_REGISTER_UI("...")` + `builder.config?.registerUI(Component.self, withName: "...")`.

### Do we need that? - **Probably not** 

Lynx has introduced [autolinking feature](https://lynxjs.org/guide/autolink.html?platform=ios) - we should go trough that doc and try to migrate.

---

## 6. Host app integration - custom template provider

**Verdict: Cleanup - example-app concern, not part of the library.**

### What we do

The example app ships a custom `TemplateProvider` and a DEBUG-only `GenericResourceFetcher` that fetch the bundle **over HTTP from the `rspeedy dev` server**, rather than embedding the bundle on disk as the [official guide](https://lynxjs.org/guide/start/integrate-with-existing-apps?platform=ios) shows.

### Why

For a POC we wanted fast iteration - the HTTP dev-server flow should mirror `react-native`'s Metro workflow.

### Do we need it? - **No, for the library** — but the open question is now answered.

* **`LynxTemplateProvider` is the engine's own "legacy" path.** 

It still works and I haven't found any information about deprecation, but Lynx internally warns that this is the fallback path.

It's an example-app concern that don't touch the stack implementation. The one genuine **library-level** decision the "just cleanup" the repo and try to follow the proper convention for app development and testing. 

---

## 7. What we may need from the Lynx team

**Needs guidance:**

1. Is there a supported way to create an element without attaching it to the native hierarchy, or to take ownership of native attachment for a subtree? The only in-framework
   pattern we found is to override `insertChild:/insertSubview:`

**Ours to adopt, not blocked:**

2. Trying to override **`onNodeReady`** on `RNSStackHostComponent` instead of `dispatch_async` for patch finish detection.
3. Checking the autolinking support and dropping the manual registration.
