# Lynx Autolinking

How a native Lynx library gets discovered, built into a host app, and registered
with the Lynx runtime — with an emphasis on **Custom Native Elements**.

Verified against: Lynx `3.9.0` (iOS pod + Android AAR), `cocoapods-lynx-library`
`4.0.0`, `@lynx-js/autolink-codegen` `0.2.1`, and `lynx-family/lynx` @ `1a5f28b70`.
This library (`lynx-library`) is used as the worked example throughout.

---

## 1. What autolinking solves

Without it, shipping a native element means asking every app author to:

1. add your native sources to their Xcode project / Gradle build, and
2. write registration code (`[config registerUI:...]`, `builder.addBehaviors(...)`)
   in their `AppDelegate` / `Application`.

Autolinking removes both steps. The app author runs `npm install your-lib` and
then `pod install` (iOS) or a Gradle sync (Android). Nothing else. **No app code
changes at all** — not even a registration call, which is the part that surprises
most people. Section 4.5 and 5.5 explain the trick.

---

## 2. The contract: `lynx.lib.json`

One file at the package root (next to `package.json`) turns an npm package into
an autolinkable Lynx library:

```json
{
  "platforms": {
    "android": {
      "packageName": "com.example.lynxlibrary",
      "sourceDir": "android"
    },
    "ios": {
      "sourceDir": "ios",
      "podspecPath": "ios/lynx-library.podspec"
    }
  }
}
```

| Field | Required | Default | Notes |
| --- | --- | --- | --- |
| `platforms` | yes | — | Must declare at least one of `android` / `ios`. A scanner simply ignores packages that don't declare *its* platform. |
| `platforms.ios.sourceDir` | no | `ios` | Directory scanned for registration markers. Must exist and stay inside the package (validated against the package realpath, so symlinks can't escape). |
| `platforms.ios.podspecPath` | no | first `*.podspec` under `sourceDir`, sorted | Same containment rule. |
| `platforms.android.packageName` | yes | — | Java package. Codegen validates it as a Java identifier; the Gradle plugin derives `<packageName>.LynxLibraryProviderImpl` from it. |
| `platforms.android.sourceDir` | no | `android` | Must exist **and contain `build.gradle` or `build.gradle.kts`** — it is included as a real Gradle project. |

It must also be listed in `package.json` → `files`, or it won't survive
`npm pack` and the host app will never see it.

---

## 3. The three phases

Autolinking is the same three-phase story on both platforms, implemented by
different tools:

| Phase | iOS | Android |
| --- | --- | --- |
| **Discover** | `use_lynx_library!` in the Podfile scans `node_modules` for `lynx.lib.json` | `org.lynxsdk.library-settings` settings plugin does the same scan |
| **Link** | `pod <name>, :path => ios/` per library | `include(":lynx_library_<name>")` + `implementation project(...)` on the app |
| **Register** | generated `LynxGeneratedLibraryRegistry` pod, invoked via runtime swizzle | generated `LynxAutolinkGenerated` class, invoked by `LynxEnv` via reflection |

The discovery step is byte-for-byte the same algorithm on both platforms:

- Start at the Podfile dir / Gradle settings dir.
- Walk **up to 6 directory levels upward**, collecting every `node_modules` found.
  (This is what makes monorepos and hoisted installs work.)
- In each `node_modules`, look at every child directory, skipping dotted names;
  descend exactly one level into `@scope/` directories.
- A package qualifies if it contains `lynx.lib.json` declaring that platform.
- Results are sorted by npm name, so generated output is deterministic.

---

## 4. iOS

### 4.1 What the app author writes

```ruby
# apple/Podfile
plugin 'cocoapods-lynx-library'

target 'MyLynxApp' do
  use_lynx_library!

  pod 'Lynx', '3.9.0', :subspecs => ['Framework']
  # ...
end
```

`use_lynx_library!` accepts two options:

- `:root` — where to start the `node_modules` walk (default: the Podfile's dir).
- `:output_dir` — where to write the generated registry
  (default: `generated/lynx-library` relative to `:root`).

### 4.2 Linking the pod

For each discovered library the plugin reads the pod name straight out of the
podspec text with a regex (`/\.name\s*=\s*['"]([^'"]+)['"]/`) and then declares:

```ruby
podfile.pod pod_name, :path => File.dirname(podspec_path)
```

⚠️ **The podspec's filename must equal `s.name`.** CocoaPods resolves a
`:path` pod by looking for `<name>.podspec` in that directory. A file called
`build.podspec` containing `s.name = 'lynx-library'` fails with
*"No podspec found for `lynx-library`"*.

### 4.3 Scanning for registration markers

The plugin globs `sourceDir/**/*.{h,m,mm,swift}` and text-scans each file. Two
shapes are recognised:

**(a) Markers inside an `@implementation` body** — the scanner splits the file
on `@implementation` and looks within each class body:

| Marker | Kind | Emitted into the registry |
| --- | --- | --- |
| `LYNX_LAZY_REGISTER_UI("tag")` | UI element | `[config registerUI:cls withName:@"tag"]` |
| `LYNX_LAZY_REGISTER_SHADOW_NODE("tag")` | shadow node | `[config registerShadowNode:cls withName:@"tag"]` |
| `LYNX_LAZY_REGISTER_RENDERER_HOST("tag")` | renderer host | `[config.componentRegistry registerRendererHost:cls withName:@"tag"]` |

**(b) Attribute-style markers immediately preceding a declaration:**

| Marker | Placement | Kind | Emitted |
| --- | --- | --- | --- |
| `@LynxElement("tag")` | directly before `@implementation` | UI element | `[config registerUI:...]` |
| `@LynxNativeModule("Name")` | directly before `@implementation` or `@interface` | native module | `[config registerModule:...]` |
| `@LynxService(Cls, Proto)` | anywhere | service | **nothing** — collected but the emitter has no `:service` branch today |

`@LynxElement` and `@LynxNativeModule` are *pure markers*. They are defined in
the Lynx headers as no-op expansions:

```objc
// Lynx/LynxUI.h:20
#define LynxElement(name) class LynxElementMarker;
// Lynx/LynxModule.h:22
#define LynxNativeModule(module_name) class LynxNativeModuleMarker;
```

so `@LynxElement("x-lynx-card")` compiles to `@class LynxElementMarker;` — a
harmless forward declaration that exists only so the scanner can find it.

**Caveats of a regex-based scan**, worth knowing before you debug:

- Markers inside comments or `#if 0` blocks are still picked up.
- `.swift` files are globbed but no Swift marker syntax exists — **Swift elements
  cannot be autolinked**. Write the element in Objective-C (it can wrap a Swift view).
- The class name is taken literally from `@implementation <Name>`; the registry
  resolves it at runtime with `NSClassFromString`, guarded by an `if`, so a
  stripped or renamed class degrades to a no-op rather than a crash.

### 4.4 The generated registry pod

Output lands in `<root>/generated/lynx-library/`:

```
LynxGeneratedLibraryRegistry.h
LynxGeneratedLibraryRegistry.m
LynxLibraryRegistry.podspec
```

and the plugin appends `pod 'LynxLibraryRegistry', :path => output_dir`. For this
library the `.m` comes out as:

```objc
// Generated by cocoapods-lynx-library. Do not edit.
@implementation LynxGeneratedLibraryRegistry
- (void)setup:(LynxConfig *)config {
  if (config == nil) { return; }
  if (NSClassFromString(@"LynxLibraryCardElement")) { [config registerUI:NSClassFromString(@"LynxLibraryCardElement") withName:@"x-lynx-card"]; }
  if (NSClassFromString(@"LynxLibraryElement")) { [config registerUI:NSClassFromString(@"LynxLibraryElement") withName:@"x-lynx-library"]; }
}
@end
```

This file is regenerated on every `pod install`. Don't edit it; don't rely on it
being in version control.

### 4.5 How it runs without any app code

This is the part that looks like magic. `LynxAutolinkGeneratedLoader.m` ships
**inside the Lynx pod itself** (`platform/darwin/common/lynx/`). At Lynx
init time it:

1. checks `objc_getClass("LynxGeneratedLibraryRegistry")` — if the app never ran
   autolinking, the class doesn't exist and the loader returns immediately;
2. otherwise swizzles `-[LynxConfig initWithProvider:]` and
   `-[LynxEnv prepareConfig:]`;
3. both swizzles funnel into `LynxAutolinkSetupConfig(config)`, which instantiates
   the registry and calls `setup:` — **once per `LynxConfig`**, guarded by an
   associated object under `@synchronized(config)`.

So the ordinary app code already in every Lynx app is enough:

```swift
let lynxEnv = LynxEnv.sharedInstance()      // triggers the lazy-load pass → swizzle installed
let config = LynxConfig(provider: TemplateProvider())  // swizzled init → setup: runs here
lynxEnv.prepareConfig(config)               // swizzled too; idempotent
```

"At Lynx init time" means the **lazy-load** pass. `LynxLazyRegister` registers a
`_dyld_register_func_for_add_image` callback that reads the
`__LYNX__DATA,__LYNX__SECTION` Mach-O section of every loaded image, building a
table of `+lynxLazyLoad` methods. `+[LynxLazyRegister loadLynxInitTask]` drains
that table once, and is called from `-[LynxEnv init]`, `-[LynxView init]`, and
`-[LynxBaseConfigurator init]`. `LynxAutolinkGeneratedLoader`'s own
`+lynxLazyLoad` is what runs the swizzle.

**Two registration paths, one element.** Note that `LYNX_LAZY_REGISTER_UI`
already does its own registration — it expands to:

```objc
+ (void)lynxLazyLoad {
  LYNX_BASE_INIT_METHOD [LynxComponentRegistry registerUI:self withName:@"x-lynx-card"];
}
```

i.e. it registers into the **global** `LynxComponentRegistry` during the same
lazy-load pass. So an element declared with the macro is registered twice: once
globally by the macro, once per-`LynxConfig` by the generated registry. An
element declared with `@LynxElement("...")` has no self-registration at all and
depends **entirely** on the generated registry. Both work; the macro form is more
forgiving if autolinking is misconfigured, the marker form is cleaner and mirrors
Android.

One linker detail that makes this work: CocoaPods puts `-ObjC` in the app's
`OTHER_LDFLAGS`, which force-loads every Objective-C object file out of the
static pod archives. Without it, an element class nobody references from app code
could be dead-stripped before it ever registers.

---

## 5. Android

Android's flow is structurally the same, but it is compile-time all the way down —
annotation processing instead of a text scan, and reflection instead of swizzling.

> Status note: the iOS path is wired up and verified in `../../my-lynx-app`.
> The Android Gradle plugin (`org.lynxsdk.lynx:lynx-library-plugin`) is **not**
> applied in that test app yet, so the Android flow below is documented from the
> Lynx sources rather than from a local end-to-end run.

### 5.1 What the app author writes

Two plugins, from `platform/android/lynx_library_plugin`:

- `org.lynxsdk.library-settings` — a **`Settings`** plugin, applied in
  `settings.gradle(.kts)`.
- `org.lynxsdk.library-build` — a **`Project`** plugin, applied to the root project.

The plugin is published as `org.lynxsdk.lynx:lynx-library-plugin` with
`automatedPublishing = false` and **no Gradle plugin markers**, so it is resolved
through a `buildscript` classpath rather than the `plugins { id(...) version ... }`
block.

### 5.2 Discover + include

The settings plugin runs the shared scan and, for each library, does:

```groovy
settings.include(library.projectPath)                      // e.g. :lynx_library_lynx_library
settings.project(library.projectPath).projectDir = library.androidDir
```

The project path is `":lynx_library_" + npmName.replaceAll('[^A-Za-z0-9_]+','_')`,
so `@scope/foo-bar` becomes `:lynx_library__scope_foo_bar`. This is why
`platforms.android.sourceDir` must contain a real `build.gradle(.kts)` — it is
included as an ordinary Android library subproject.

### 5.3 Per-library annotation processing

The build plugin then, for each included library project, appends a javac arg:

```
-Alynx.library.packageName=<platforms.android.packageName>
```

(and the equivalent `kapt.arguments` when `kotlin-kapt` is present), and adds an
`implementation project(...)` dependency from the `com.android.application`
module onto every library.

That `-A` option is the opt-in switch for `LynxLibraryProcessor`. Two processors
in `org.lynxsdk.lynx:lynx-processor` do the work:

| Processor | Input | Output |
| --- | --- | --- |
| `LynxBehaviorProcessor` | `@LynxElement`, `@LynxBehavior`, `@LynxShadowNode`, `@LynxGeneratorName` | `<pkg>.BehaviorGenerator` with `static List<Behavior> getBehaviors()` |
| `LynxLibraryProcessor` | the above + `@LynxNativeModule`, `@LynxService` | `<packageName>.LynxLibraryProviderImpl implements LynxLibraryProvider` |

`LynxLibraryProcessor` **returns early and emits nothing** when
`lynx.library.packageName` is absent. That's deliberate: plain Lynx app modules
use the same annotations for behavior generation and must not accidentally emit a
library provider.

For this library, the generated provider is effectively:

```java
public class LynxLibraryProviderImpl implements LynxLibraryProvider {
  @Override public void register(LynxLibraryRegistry registry) {
    registry.addBehaviors(com.example.lynxlibrary.BehaviorGenerator.getBehaviors());
  }
}
```

and `BehaviorGenerator.getBehaviors()` contains one anonymous `Behavior` per tag:

```java
result.add(new Behavior("x-lynx-card", false, false, false) {
  @Override public LynxUI createUI(LynxContext context) {
    return new LynxLibraryCardElement(context);
  }
});
```

Note `LynxBehaviorProcessor` picks the constructor shape for you: if the class
declares a `(LynxContext, Object)` constructor it generates `createUIWithParams`,
otherwise `createUI(LynxContext)`. A matching `@LynxShadowNode(tagName = "...")`
class is folded into the same `Behavior` as `createShadowNode()`.

### 5.4 The app-module registry

For every application variant the build plugin registers a
`generate<Variant>LynxLibraryRegistry` task, wires it via
`variant.registerJavaGeneratingTask(...)`, and writes into
`build/generated/source/lynxLibraryRegistry/<variant>/`:

```java
// Generated by org.lynxsdk.library. Do not edit.
package com.lynx.tasm.library;

@Keep
public final class LynxAutolinkGenerated {
  private static final String[] PROVIDERS = new String[] {
      "com.example.lynxlibrary.LynxLibraryProviderImpl"
  };
  public static void setupGlobal(Context context) { LynxLibraryRegistry.setupGlobal(context, PROVIDERS); }
  public static void setup(LynxViewBuilder builder) { LynxLibraryRegistry.setup(builder, PROVIDERS); }
}
```

Only the provider **class names** are baked in — the classes themselves are
resolved reflectively, so a library that fails to build its provider degrades to
a logged warning instead of a link error.

### 5.5 How it runs without any app code

`LynxEnv.init(...)` calls `setupAutolinkGlobal(context)`, which reflectively looks
up `com.lynx.tasm.library.LynxAutolinkGenerated` and invokes its static
`setupGlobal(Context)`. `ClassNotFoundException` is caught and logged at debug
level — that's the "autolinking not configured" path.

`LynxLibraryRegistry.setupGlobal` then, for each provider name:
`Class.forName` → no-arg constructor (made accessible) → `register(registry)`.
Global setup is de-duplicated by class name in a static set, so repeated
`LynxEnv` init doesn't double-register. With no `LynxViewBuilder` in play,
`addBehaviors` forwards to `LynxEnv.inst().addBehaviors(...)` — i.e. process-wide.

`LynxAutolinkGenerated.setup(builder)` also exists for per-`LynxView` scoping, but
nothing in Lynx calls it; an app can call it explicitly if it wants library
elements confined to one `LynxViewBuilder`.

---

## 6. Custom Native Elements, end to end

This is the case autolinking handles best, because an element needs **no generated
bridge code at all** — just a class, a tag name, and a registration.

### 6.1 iOS

Header — plain `LynxUI` subclass, nothing autolink-specific:

```objc
// ios/src/LynxLibraryCardElement.h
#import <UIKit/UIKit.h>
#import <Lynx/LynxUI.h>

@interface LynxLibraryCardElement : LynxUI<UIView *>
@end
```

Implementation — this is where the tag name lives:

```objc
// ios/src/LynxLibraryCardElement.m
#import "LynxLibraryCardElement.h"
#import <Lynx/LynxComponentRegistry.h>

@implementation LynxLibraryCardElement

LYNX_LAZY_REGISTER_UI("x-lynx-card")

- (UIView *)createView {
  UIView *view = [[UIView alloc] init];
  view.backgroundColor = [UIColor systemRedColor];
  view.layer.cornerRadius = 50;
  view.layer.masksToBounds = YES;
  return view;
}

@end
```

The equivalent marker-only form (drop the `LynxComponentRegistry.h` import; the
macro comes from `LynxUI.h`):

```objc
@LynxElement("x-lynx-card")
@implementation LynxLibraryCardElement
// ...
@end
```

Rules that actually bite:

- The marker goes in the **`.m`, attached to `@implementation`**. On the
  `@interface` it is invisible to the scanner and to the compiler-generated
  registration. (`@LynxUIRegister` is not a thing — if you have it in a file, it
  came from an old scaffold and registers nothing.)
- The podspec needs `s.ios.deployment_target`. Without it CocoaPods assumes iOS
  4.3, which predates ARC weak references, and `#import <Lynx/LynxUI.h>` fails
  with *"cannot create __weak reference because the current deployment target does
  not support weak references"*.
- `s.dependency 'Lynx'` and `s.requires_arc = true` are both needed.

### 6.2 Android

```java
// android/src/main/java/com/example/lynxlibrary/LynxLibraryCardElement.java
package com.example.lynxlibrary;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
import com.lynx.tasm.behavior.LynxContext;
import com.lynx.tasm.behavior.LynxElement;
import com.lynx.tasm.behavior.ui.LynxUI;

@LynxElement(name = "x-lynx-card")
public class LynxLibraryCardElement extends LynxUI<View> {
  public LynxLibraryCardElement(LynxContext context) {
    super(context);
  }

  @Override
  protected View createView(Context context) {
    View view = new View(context);
    view.setBackgroundColor(Color.parseColor("#0A84FF"));
    return view;
  }
}
```

`@LynxElement` also carries `isCreateAsync`, `needProcessDirection`,
`supportFragmentLayerRender`, and `fragmentLayerRendererHost` — all forwarded into
the generated `Behavior`.

The library's `android/build.gradle.kts` must pull in the annotation processor,
or nothing is generated:

```kotlin
dependencies {
  implementation("org.lynxsdk.lynx:lynx:3.9.0")
  implementation("org.lynxsdk.lynx:service-api:3.9.0")
  annotationProcessor("org.lynxsdk.lynx:lynx-processor:3.9.0")   // kapt(...) for Kotlin
}
```

### 6.3 The JS side

Nothing autolinked here — the tag is just a string both sides agree on. The
element is usable as a bare intrinsic:

```tsx
<x-lynx-card style="width:100px;height:60px;" />
```

A thin wrapper is the ergonomic default, and gives you a place to hang types:

```tsx
// src/index.tsx
export function Card(props: CardProps) {
  return <x-lynx-card {...props} />;
}
```

### 6.4 Naming

The tag string in the native marker **is** the JSX tag. Keep it identical across
iOS, Android, and JS — a mismatch produces a silently unrendered node, not an
error. The `x-` prefix is convention for custom elements, not a requirement.

---

## 7. Elements vs. Native Modules

Worth being explicit, because `npm run codegen` looks like it should be involved
in elements and isn't.

| | Custom Native Element | Native Module |
| --- | --- | --- |
| Declared in JS as | a JSX tag (`<x-lynx-card />`) | a callable object |
| Needs a typed bridge? | no — props flow through Lynx's prop system | yes — method signatures must match on both sides |
| `@lynx-js/autolink-codegen` | **not involved** | generates `generated/<Name>.ts`, `ios/src/generated/<Name>Spec.{h,m}`, `<pkg>/generated/<Name>Spec.java` |
| Source of truth | the native class + tag string | `/** @lynxmodule */ export declare class ... {}` in `types/**/*.d.ts` |
| Autolink registration | `registerUI:` / `Behavior` | `registerModule:` / `registry.registerModule(...)` |

So for a pure-element library, `npm run codegen` is a no-op and the whole
pipeline is podspec globs + Gradle project inclusion + the two registration
markers. Codegen only matters once you add `@lynxmodule` declarations.

---

## 8. Verifying it worked

**iOS** — after `bundle exec pod install`, open
`<app>/generated/lynx-library/LynxGeneratedLibraryRegistry.m` and confirm `setup:`
has a `registerUI:` line per element:

```objc
if (NSClassFromString(@"LynxLibraryCardElement")) { [config registerUI:NSClassFromString(@"LynxLibraryCardElement") withName:@"x-lynx-card"]; }
```

An **empty `setup:` body** is the canonical symptom: the pod was discovered and
linked, but no marker was recognised in `sourceDir`.

**Android** — check
`app/build/generated/source/lynxLibraryRegistry/<variant>/com/lynx/tasm/library/LynxAutolinkGenerated.java`
for your provider class name, and the library's own
`build/generated/.../BehaviorGenerator.java` for your tag. At runtime, a
`LynxLibraryRegistry` warning in logcat (`Skip unavailable Lynx library provider …`)
means the provider name was baked in but the class isn't on the classpath.

### Troubleshooting table

| Symptom | Cause | Fix |
| --- | --- | --- |
| `No podspec found for <name>` | podspec filename ≠ `s.name` | Rename to `<s.name>.podspec`, update `podspecPath` |
| CocoaPods validation error | podspec missing `s.homepage`, or `s.source = { :path => '..' }` | Add `s.homepage`; use `s.source = { :git => ..., :tag => s.version.to_s }` |
| `cannot create __weak reference…` when importing `LynxUI.h` | no `s.ios.deployment_target` → defaults to iOS 4.3 | Add `s.ios.deployment_target = '10.0'` (match the app's `platform :ios`) and `s.requires_arc = true` |
| `setup:` generated but empty | marker on `@interface`, in a `.h` only, in Swift, or a non-existent macro like `@LynxUIRegister` | Put `LYNX_LAZY_REGISTER_UI("tag")` inside `@implementation` in the `.m`, or `@LynxElement("tag")` directly above it |
| Library not discovered at all | `lynx.lib.json` missing from `package.json` → `files`; or app is >6 dir levels from the `node_modules` holding it | Add to `files` and re-`npm pack`; check the walk depth |
| Element renders nothing, no error | tag string mismatch between native and JSX | Make the strings identical |
| Android: no `LynxLibraryProviderImpl` | `annotationProcessor`/`kapt` on `lynx-processor` missing, or `-Alynx.library.packageName` not passed (build plugin not applied) | Add the processor dependency; apply `org.lynxsdk.library-build` to the root project |
| Android: version skew | scaffold pins placeholder versions like `0.0.1-alpha.1` | Align `lynx`, `service-api`, and `lynx-processor` with the app's Lynx version |

---

## 9. Source map

If you need ground truth, these are the files that define the behaviour:

**iOS**
- `tools/ios_tools/cocoapods-lynx-library/lib/lynx/library/autolink.rb` — discovery, marker scan, code generation (identical to the shipped gem 4.0.0)
- `tools/ios_tools/cocoapods-lynx-library/lib/cocoapods_plugin.rb` — the `use_lynx_library!` DSL
- `platform/darwin/common/lynx/LynxAutolinkGeneratedLoader.m` — the swizzle
- `platform/darwin/common/lazy_load/LynxLazyRegister.m` — the `__LYNX__DATA` section scan
- `platform/darwin/common/lynx/public/base/LynxComponentRegistry.h`, `.../lazy_load/LynxLazyLoad.h` — `LYNX_REGISTER_*` / `LYNX_LAZY_REGISTER_*`
- `platform/darwin/ios/lynx/public/ui/LynxUI.h:20` — the `LynxElement(name)` marker macro

**Android**
- `platform/android/lynx_library_plugin/src/main/groovy/org/lynxsdk/library/` — `LynxLibraryScanner`, `LynxLibrarySettingsPlugin`, `LynxLibraryBuildPlugin`, `LynxLibraryRegistryGenerator`, `LynxLibraryInfo`
- `platform/android/lynx_processor/src/main/java/com/lynx/processor/LynxBehaviorProcessor.java` — `BehaviorGenerator`
- `platform/android/lynx_processor/src/main/java/com/lynx/processor/LynxLibraryProcessor.java` — `LynxLibraryProviderImpl`
- `platform/android/lynx_android/src/main/java/com/lynx/tasm/library/LynxLibraryRegistry.java` — provider instantiation
- `platform/android/lynx_android/src/main/java/com/lynx/tasm/LynxEnv.java:368` — `setupAutolinkGlobal`

**Codegen (modules only)**
- `@lynx-js/autolink-codegen` (`dist/index.js`) — `@lynxmodule` scan + spec emission
