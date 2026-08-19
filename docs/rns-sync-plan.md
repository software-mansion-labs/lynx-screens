# RNS → lynx-screens sync plan (Stack v5)

Working checklist for backporting `react-native-screens` Stack v5 commits into `lynx-screens`.

- **Synced up to:** [`63b3baab`](https://github.com/software-mansion/react-native-screens/commit/63b3baab65a1fd36da04ae426f98ad460217e1e0)
- **Target:** [`c0305806`](https://github.com/software-mansion/react-native-screens/commit/c030580604fc89d30ea13b1e56a3b9f398c4fcce) (RNS `main` as of 2026-08-18) — 418 commits in range
- **Method:** walk the range oldest → newest and backport every commit that touches Stack v5, **always one commit at a time, strictly in RNS order** — no batching, no squashing. One RNS commit per PR, with `Related commit from RNScreens: <link>` in the PR description.
- **Examples:** when the RNS commit adds an example/test screen, port the example into `LynxExample/src/examples` and set it active in `LynxExample/src/App.tsx` in the same commit, so it can be tested right after checkout. Never port `scenario.md` files or scenario descriptions — the example only.
- **Statuses:** `[ ]` pending · `[x]` backported · `[-]` reviewed, not applicable (note why)

Out of the 418 commits, ~55 are in the backport queue below. The rest is: Tabs/Split/ScrollViewMarker (~70), FormSheet v5 (~45, out of scope — see below), Stack v4 / legacy cleanups, e2e tests, examples, docs and CI.

Sizes are rough (files touched in relevant paths): **S** ≤3, **M** ≤12, **L** >12.

## Backport queue (chronological)

Lanes: `core` = existing lynx-screens code (Host/Screen/model), `hdr-and` / `hdr-ios` = header epic (new functional area for lynx-screens), `example` = `StackContainer` in LynxExample.

- [-] `17a668299` S core-ios — fix(iOS, StackV5): Fix default props type ([#3800](https://github.com/software-mansion/react-native-screens/commit/17a668299)) — N/A: fixes a wrong Fabric default-props struct in `resetProps`; lynx-screens sets plain ivar defaults via `LYNX_PROP_SETTER`, no props structs exist
- [x] `a68e00538` M core-js — chore: make all exports from v5 component modules explicit ([#3808](https://github.com/software-mansion/react-native-screens/commit/a68e00538)) — only the stack type exports apply; lynx-screens had no default exports
- [x] `a821ff0af` L hdr-and — feat(Android, Stack v5): add basic support for header ([#3753](https://github.com/software-mansion/react-native-screens/commit/a821ff0af)) — Fabric state/C++ shadow node replaced with Lynx `StackScreenShadowNode` (CustomMeasureFunc); header height NOT forwarded as content offset (native wrapper already offset — see comment in `StackScreenCoordinatorLayout`)
- [x] `33feebbb3` L core-ios — feat(iOS, Stack v5): Align Stack implementation with RFC 753 ([#3774](https://github.com/software-mansion/react-native-screens/commit/33feebbb3)) — Swift controllers replaced with ObjC; ops queue + coordinator ported; RCTMountingTransactionObserving emulated with the existing dispatch_async transaction-finish trick
- [x] `29b2a2b2a` M core-js — chore(types): enable `exactOptionalPropertyTypes` support ([#3719](https://github.com/software-mansion/react-native-screens/commit/29b2a2b2a)) — flag enabled in root tsconfig; `| undefined` added in StackScreen types and lynx-elements IntrinsicElements
- [x] `6b51e5e04` L hdr-and — feat(Android, Stack v5): handle header configuration and custom subviews ([#3796](https://github.com/software-mansion/react-native-screens/commit/6b51e5e04)) — new `stack-header-config-native` + `stack-header-subview-native` elements; Fabric state → `ShadowStateProxy`/`ShadowStateUpdating`; subview offsets stored but not applied in align (Toolbar positions views natively); `Providing.view` renamed to `subviewView` (clash with LynxUI.getView); background stretching needs `hasBackgroundSubview` + explicit `width/height: 100%` (absolute-fill does not resolve against custom-measure constraints); known issue: flex/absolute placement of content INSIDE subviews is ignored by the engine (sizes work, positions land top-left)
- [x] `c3077147b` L hdr-and — feat(Android, Stack v5): add back button to header with customization ([#3883](https://github.com/software-mansion/react-native-screens/commit/c3077147b)) — Fresco-based ImageLoader ported (Fresco is Lynx's standard image-service engine); `imageSource` icons take a plain URI string instead of RN assets; tint color as CSS string parsed natively
- [x] `6ae17e0b7` S hdr-and — docs(Android, Stack v5): add missing docs to StackHeaderConfig ([#3897](https://github.com/software-mansion/react-native-screens/commit/6ae17e0b7)) — docs adapted where the API diverges (uri-based imageSource, Lynx layout engine)
- [x] `12edf296f` S core-js — chore(types): remove nullability from some `children` props ([#3918](https://github.com/software-mansion/react-native-screens/commit/12edf296f)) — applied to StackHost children and header subview Component/children
- [x] `0d2d8a333` M hdr-and — feat(Android, Stack v5): add support for header scroll flags ([#3908](https://github.com/software-mansion/react-native-screens/commit/0d2d8a333)) — incl. StackHeaderAppBarLayoutBehavior overshoot fix and JS type-based defaults
- [x] `ddda1e0e0` S hdr-and — fix(Android, Stack v5): prevent crash when subview with (0, 0) size is added to small header ([#3927](https://github.com/software-mansion/react-native-screens/commit/ddda1e0e0)) — on Lynx the removed fallback reported spec-size instead of crashing; sizing is enforced from the engine now
- [x] `d3abbe712` S example — refactor(Example): TabsContainer and StackContainer refactor ([#3925](https://github.com/software-mansion/react-native-screens/commit/d3abbe712)) — StackContainer part only; components resolved via useComponentsByName instead of living in reducer state
- [x] `7c5a6bf0e` S hdr-and — fix(Android, Stack v5): change header subview type to React.ComponentType ([#4079](https://github.com/software-mansion/react-native-screens/commit/7c5a6bf0e)) — subview slots take `render: () => ReactElement` now
- [x] `88572ae6a` M hdr-and — feat(Android, Stack v5): ensure StackHeaderCoordinator teardown on Screen fragment destroyed ([#4096](https://github.com/software-mansion/react-native-screens/commit/88572ae6a))
- [x] `efc2b1fa8` L hdr-and — feat(Android, Stack v5): add toolbar menu items base implementation to header ([#3965](https://github.com/software-mansion/react-native-screens/commit/efc2b1fa8)) — Fabric view command → `@LynxUIMethod` + `NodesRef.invoke`; click event via LynxCustomEvent; verified on device
- [x] `713dcc6fc` M hdr-and — feat(Android, Stack v5): expose showAsAction prop for toolbar menu items ([#4101](https://github.com/software-mansion/react-native-screens/commit/713dcc6fc)) — verified on device (item promoted to toolbar button)
- [ ] `b16e7ed3d` L hdr-ios — feat: Implement subviews layout in header for iOS stack v5 ([#3868](https://github.com/software-mansion/react-native-screens/commit/b16e7ed3d)) — includes shadow-node work
- [ ] `696309396` M hdr-ios — chore: Separate header item building from HeaderItem(Spacer)ComponentView ([#4135](https://github.com/software-mansion/react-native-screens/commit/696309396))
- [ ] `52d09d0d7` M core-and — fix(Android): route all px→dp Shadow Tree state pushes through per-display density ([#4169](https://github.com/software-mansion/react-native-screens/commit/52d09d0d7)) — check applicability to Lynx layout pipeline
- [ ] `39ab47733` L hdr-ios — feat: Initial code for menu in header items ([#4138](https://github.com/software-mansion/react-native-screens/commit/39ab47733))
- [ ] `17ec5db41` L hdr-and — feat(Android, Stack v5): toolbar menu item icon and icon tint color ([#4105](https://github.com/software-mansion/react-native-screens/commit/17ec5db41)) — Fresco-based `ImageLoader`; needs Lynx image-pipeline equivalent
- [ ] `19f550969` M hdr-and — feat(Android, Stack v5): add support for extended tinting and enforce M3 icon size for back button ([#4126](https://github.com/software-mansion/react-native-screens/commit/19f550969))
- [ ] `8c158ab95` L hdr-ios — feat: Handle onPress in iOS Menu ([#4148](https://github.com/software-mansion/react-native-screens/commit/8c158ab95))
- [ ] `3d47a11dc` L hdr-and — refactor(Android, Stack v5): separate React and native domains in header implementation ([#4150](https://github.com/software-mansion/react-native-screens/commit/3d47a11dc))
- [ ] `1e177250d` L hdr-ios — feat: Add toggling items with managed flow to menu ([#4194](https://github.com/software-mansion/react-native-screens/commit/1e177250d))
- [ ] `79bbe6d44` S core-and — fix(Android, Stack v5): set `needsCustomLayoutForChildren` to `true` for `StackHost` ([#4200](https://github.com/software-mansion/react-native-screens/commit/79bbe6d44)) — RN-specific mechanism; verify Lynx analog
- [ ] `69d05bd3d` M hdr-ios — feat: Rename label and key to title and id in Stack v5 header items ([#4208](https://github.com/software-mansion/react-native-screens/commit/69d05bd3d))
- [ ] `ee24415b6` L hdr-and — feat(Android, Stack v5): add support for nested menus in toolbar menu ([#4210](https://github.com/software-mansion/react-native-screens/commit/ee24415b6))
- [ ] `488954d9f` L hdr-ios — feat(Stack v5): Add onPress to Header Item on iOS ([#4217](https://github.com/software-mansion/react-native-screens/commit/488954d9f))
- [ ] `8914da902` M core-and — feat(Android, Stack, Tabs, SVM): introduce `Container` & `ContainerItem` ([#4216](https://github.com/software-mansion/react-native-screens/commit/8914da902)) — nested-container architecture; stack part only
- [ ] `fb70d7146` S core-ios — refactor(iOS, Stack): use RNSContainerHelpers for controller mounting ([#4231](https://github.com/software-mansion/react-native-screens/commit/fb70d7146))
- [ ] `c949a4460` L hdr-and — feat(Android, Stack v5): add support for groups in toolbar menu ([#4228](https://github.com/software-mansion/react-native-screens/commit/c949a4460))
- [ ] `a66629829` M hdr-and — feat(Android, Stack v5): add support for disabling menu items ([#4236](https://github.com/software-mansion/react-native-screens/commit/a66629829))
- [ ] `ea2b889f1` M hdr-and — feat(Android, Stack v5): add toolbar menu item text related props ([#4234](https://github.com/software-mansion/react-native-screens/commit/ea2b889f1))
- [ ] `86397af36` M hdr-and — feat(Android, Stack v5): add support for `menuTitle` (`headerTitle`) in submenus ([#4241](https://github.com/software-mansion/react-native-screens/commit/86397af36))
- [ ] `c3031986a` S hdr-and — fix(Android): handle nullable Fresco bitmap ([#4242](https://github.com/software-mansion/react-native-screens/commit/c3031986a)) — only if ImageLoader gets ported
- [ ] `11ff7d58b` S hdr-and — chore(Android): make `ImageLoader` `onLoaded`'s result nullable ([#4247](https://github.com/software-mansion/react-native-screens/commit/11ff7d58b)) — only if ImageLoader gets ported
- [ ] `7e1ce750a` M core-ios — feat(iOS, Stack, Tabs): introduce `Container` & `ContainerItem` ([#4227](https://github.com/software-mansion/react-native-screens/commit/7e1ce750a)) — stack part only
- [ ] `e38edd831` L hdr-ios — feat(iOS, Stack v5): Refactor Stack Header implementation and handle selective updates ([#4248](https://github.com/software-mansion/react-native-screens/commit/e38edd831))
- [ ] `7624a9c86` M hdr-ios — feat(Stack v5, iOS): Add `keepsMenuPresented` prop to menuItems ([#4261](https://github.com/software-mansion/react-native-screens/commit/7624a9c86))
- [ ] `b16d51623` S hdr-and — fix(Android): prevent Fresco recycled bitmap crash in ImageLoader ([#4274](https://github.com/software-mansion/react-native-screens/commit/b16d51623)) — only if ImageLoader gets ported
- [ ] `501993080` S hdr-and — fix(Android, Tabs): handle platform color in tabs appearance props ([#4284](https://github.com/software-mansion/react-native-screens/commit/501993080)) — touches shared header-config/toolbar mappers
- [ ] `fa1959d3c` M hdr-ios — feat(Stack v5, iOS): Implement hitSlop for custom header items ([#4290](https://github.com/software-mansion/react-native-screens/commit/fa1959d3c))
- [ ] `1f38fb6e7` L hdr-ios — feat(Stack v5, iOS): Support icon loading in header items and menu ([#4277](https://github.com/software-mansion/react-native-screens/commit/1f38fb6e7)) — RN image infra; needs Lynx equivalent
- [ ] `e2793da15` M hdr-ios — feat(Stack v5, iOS): Add displayInline flag to menu ([#4300](https://github.com/software-mansion/react-native-screens/commit/e2793da15))
- [ ] `f0a3a819f` M hdr-ios — feat(Stack v5, iOS): Add displayAsPalette flag for menu ([#4307](https://github.com/software-mansion/react-native-screens/commit/f0a3a819f))
- [ ] `f7431f3ea` M hdr-and — feat(Android, Stack v5): add `accessibilityLabel` for toolbar menu items ([#4250](https://github.com/software-mansion/react-native-screens/commit/f7431f3ea))
- [ ] `59dd58a84` S core-and — fix(Android, Stack v5): Prevent screen unmounting on fast navigation ([#4342](https://github.com/software-mansion/react-native-screens/commit/59dd58a84)) — fix landed in v4 `ScreensCoordinatorLayout`; verify whether lynx-screens transition finalization has the same `clearAnimation()` race
- [ ] `37177c97b` L hdr-and — feat(Android, Stack v5): support sending multiple updates via view command ([#4243](https://github.com/software-mansion/react-native-screens/commit/37177c97b))
- [ ] `693082b36` L hdr-ios — feat(Stack v5, iOS): Implement basic view commands for iOS header menu ([#4339](https://github.com/software-mansion/react-native-screens/commit/693082b36))
- [ ] `96a4107b1` S hdr-and — feat(Android, Stack v5): use M3 Expressive theme for App Bar ([#4365](https://github.com/software-mansion/react-native-screens/commit/96a4107b1))
- [ ] `d6e39013f` L core-and — refactor(Android, Stack v5): split large classes, reorganize package structure ([#4354](https://github.com/software-mansion/react-native-screens/commit/d6e39013f)) — align lynx-screens package layout with RNS
- [ ] `2828bb2a5` M hdr-and — feat(Android, Stack v5): expose `liftOnScroll` prop for `small` header, integrate with SVM ([#4368](https://github.com/software-mansion/react-native-screens/commit/2828bb2a5)) — depends on ScrollViewMarker, which lynx-screens doesn't have; decide scope on review
- [ ] `cff4f4131` L hdr-ios — feat(Stack v5, iOS): Add titleMenu ([#4349](https://github.com/software-mansion/react-native-screens/commit/cff4f4131))
- [ ] `406318890` S example — refactor(examples, stack v5): erase options as required from StackRouteConfig ([#4419](https://github.com/software-mansion/react-native-screens/commit/406318890))
- [ ] `aa9236bae` S hdr-and — fix(Android, Stack v5): change order of toolbar menu item prop application ([#4507](https://github.com/software-mansion/react-native-screens/commit/aa9236bae))

## Reviewed, likely not applicable (confirm during walk-through)

- [ ] `d4f3d71fc` — fix(ios): guard `+load` with `#ifdef RCT_DYNAMIC_FRAMEWORKS` (#3828) — RN build-system specific
- [ ] `d372cb8e6` — fix(iOS, Stack v5): framework-style imports for React core headers (#4402) — RN-specific includes
- [ ] `836c46c13` — clang-format bump (#3972); `baeac78c6` — hide react symbols from swift (#4224); `749df7a71` — RMTO to obj-c (#4420) — RNS toolchain/infra
- [ ] `7708a4af2` — react-native@0.87 support (#4375) — N/A for Lynx
- [ ] RNS repo restructuring: `f52cd54c4`, `a7e79aca8`, `7190dfe80`, `b608e9a28`, `b54af6d12`, `68dce5222`, `d8b3827b1`, `d8484a058` (gamma → top-level, v4 → legacy, `RNS_GAMMA_ENABLED` removal), `fdc2fba17` (out of experimental) — lynx-screens never had gamma dirs; only naming alignment may be worth mirroring

## Out of scope

- **FormSheet v5** — standalone component in RNS, ~45 commits in range (basic setup, detents, lifecycle events, preventNativeDismiss, appearance). Decided out of scope for this sync (2026-08-18). If that changes, the queue can be regenerated the same way as this one.
- **Tabs, Split, ScrollViewMarker, SafeArea, ScrollToTopGuard** — components lynx-screens doesn't port.
- **Stack v4 / legacy** — lynx-screens is v5-only.

Note: `2828bb2a5` (liftOnScroll) integrates with ScrollViewMarker, which lynx-screens lacks — when its turn comes, port without the SVM integration (or record `[-]` with rationale).

## Stack v5 e2e tests in range (no e2e infra in lynx-screens — use as manual test scenarios)

`b6ebfff6d` (simple navigation), `f325544fb`/`edaabbb61`/`38f1ad13c` (preventNativeDismiss), `9af76dd0a` (lifecycle events), `7bfc30bdc`/`fc6d911af`/`c39df3bc4`/`60009aff5`/`4174a5a3e`/`34bed0cbd` (toolbar/menu), `d45d50a0b`/`fb6cf3940`/`cec9234dd`/`a608b9b51` (header subviews/updates/icons), `c03058060` (lift-on-scroll)
