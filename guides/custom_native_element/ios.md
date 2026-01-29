# Creating a Custom Native Element for Lynx from Scratch (Dec 19, 2025)

## Prerequisites

To get started with building a Custom Native Element for Lynx, we first need to set up a new application using the Lynx CLI tool.

### Create a New Lynx App with CLI

Use the following command to create a new Lynx application:

```
npx create-lynxjs-app
```

During the setup:
- Provide your desired application name.
- Make sure both Android and iOS platforms are selected when prompted.

Once the setup is complete, your project structure will include the necessary folders for `android/` and `apple/`, alongside your JavaScript source files.

It's **recommended to use the CLI** method to create your application instead of using the Quick Start from the Lynx website (https://lynxjs.org/guide/start/quick-start?ios-simulator-platform=macos-arm64&explorer-platform=ios-simulator).  
The CLI tool automatically generates the proper native folder structure (android, apple) and keeps it organized next to your JS source code.

### (Optional) Prepare Lynx Explorer 

Lynx Explorer is a sandbox environment that allows you to quickly run and experiment with Lynx applications. It offers the easiest way to get started without setting up a full native development environment.

Alternatively, you can build the application directly using an IDE such as Android Studio or Xcode if you're interested in native development.

Based on the current knowledge, [Hot Module Replacement (HMR)](https://webpack.js.org/concepts/hot-module-replacement/) is only supported for apps launched via Lynx Explorer. When integrating Lynx with native platforms, any change to the application requires rebuilding the native side in order to reload the updated bundle.

| Platform | Prebuilt                     | Build from sources                                 |
|-----------|------------------------------|-----------------------------------------------------|
| Android   | Download from GitHub Releases https://github.com/lynx-family/lynx/releases/tag/3.5.1 | Follow Building Lynx Explorer for Android https://github.com/lynx-family/lynx/tree/develop/explorer/android |
| iOS       | (simulator only) Download https://github.com/lynx-family/lynx/releases/latest/download/LynxExplorer-arm64.app.tar.gz and drag unpacked .app to the simulator | Follow Building Lynx Explorer for iOS https://github.com/lynx-family/lynx/tree/develop/explorer/darwin/ios |

## Launching application via Lynx Explorer

To get started, install the dependencies and start the development server:

```bash
npm install
npm run dev
```

Running the development server will open the packager window in the terminal, where you can either scan the generated QR code or copy the bundle URL.

In the Lynx Explorer app, paste the bundle URL into the "Enter Card URL" field. After submitting, your application should launch immediately.

## Launching application from Xcode

To launch the application in a native iOS environment via Xcode, follow these steps:

1. Install JavaScript dependencies:

   ```bash
   npm install
   npm run dev
   ```

2. Install CocoaPods dependencies:

   ```bash
   cd apple
   pod install
   ```

### Known Issue: Pod Version Conflict

By default, the CLI generates dependencies using Lynx version 3.4.1. However, this version currently causes a CocoaPods resolution error related to pre-release versions:

```
[!] CocoaPods could not find compatible versions for pod "PrimJS/quickjs_debugger":
  In snapshot (Podfile.lock):
    PrimJS/quickjs_debugger (= 2.14.0-rc.1)
  In Podfile:
    LynxDevtool/Framework (= 3.4.1) was resolved to 3.4.1, which depends on
      PrimJS/quickjs_debugger
There are only pre-release versions available satisfying the following requirements:
        'PrimJS/quickjs_debugger', '= 2.14.0-rc.1'
        'PrimJS/quickjs_debugger', '>= 0'
You should explicitly specify the version in order to install a pre-release version
```

### Recommended Solution

To resolve this issue, upgrade Lynx dependencies to version `3.5.1` in the `Podfile`. Below is a sample diff showing the necessary changes:

```diff
diff --git a/apple/Podfile b/apple/Podfile
index 7996c39..abcf20d 100644
--- a/apple/Podfile
+++ b/apple/Podfile
@@ -3,18 +3,18 @@ source 'https://cdn.cocoapods.org/'
 platform :ios, '10.0'
 
 target 'LynxScreens' do
-  pod 'Lynx', '3.4.1', :subspecs => [
+  pod 'Lynx', '3.5.1', :subspecs => [
     'Framework',
   ]
 
-  pod 'LynxDevtool', '3.4.1', :subspecs => [
+  pod 'LynxDevtool', '3.5.1', :subspecs => [
     'Framework',
     'LynxRecorder',
   ]
 
-  pod 'BaseDevtool', '3.4.1'
+  pod 'BaseDevtool', '3.5.1'
 
-  pod 'LynxService', '3.4.1', :subspecs => [
+  pod 'LynxService', '3.5.1', :subspecs => [
     'Image',
     'Log',
     'Devtool',
@@ -26,6 +26,6 @@ target 'LynxScreens' do
   pod 'SDWebImageWebPCoder', '0.11.0'
 
   # XElement
-  pod 'XElement', '3.4.1'
-  pod 'DebugRouter', '5.0.13-rc.1'
+  pod 'XElement', '3.5.1'
+  pod 'DebugRouter', '5.0.13'
 end
```

After applying the changes, run pod install again:

```bash
pod install
```

Now you're ready to build and run the project using Xcode. Open `.xcworkspace` file in XCode and build the application.

### Bundle Not Loading — Troubleshooting

If the application fails to load the Lynx bundle, here are two common approaches to diagnose and resolve the issue:

#### 1. Load via Packager (Recommended)

Ensure the packager is running:

```bash
npm run dev
```

By default, Lynx loads the bundle from a local development server when running in Debug mode, using the following logic:

```swift
#if DEBUG
    lynxView.loadTemplate(
      fromURL: "http://localhost:3000/main.lynx.bundle?fullscreen=true",
      initData: nil
    )
#else
    lynxView.loadTemplate(fromURL: "main.lynx")
#endif
```

So when running in Debug mode, you must start the development server. The app will attempt to load the bundle from the specified URL (usually `localhost:3000`).

#### 2. Load via Embedded Resource (Experimental)

You can also pre-bundle the application and embed it into your Xcode project:

- The bundle is generated in the `dist/` directory after running:

  ```bash
  npm run build
  ```

- In Xcode, open your Target settings → Build Phases → Copy Bundle Resources and add the file:

  ```
  dist/main.lynx.bundle
  ```

- Then update your Swift code to load the embedded bundle instead of fetching it from the dev server:

```diff
diff --git a/apple/LynxScreens/SceneDelegate.swift b/apple/LynxScreens/SceneDelegate.swift
index 209ccc2..b9ce178 100644
--- a/apple/LynxScreens/SceneDelegate.swift
+++ b/apple/LynxScreens/SceneDelegate.swift
@@ -13,6 +13,7 @@ class SceneDelegate: UIResponder, UIWindowSceneDelegate {
      builder.enableGenericResourceFetcher = .true
      builder.genericResourceFetcher = GenericResourceFetcher()
#endif
+     builder.config = LynxConfig(provider: CustomLynxProvider())
      builder.screenSize = windowScene.screen.bounds.size
      builder.fontScale = 1.0
    }
@@ -27,10 +28,7 @@ class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    rootViewController.view = lynxView
    
#if DEBUG
-   lynxView.loadTemplate(
-     fromURL: "http://localhost:3000/main.lynx.bundle?fullscreen=true",
-     initData: nil
-   )
+   lynxView.loadTemplate(fromURL: "main.lynx", initData: nil)
#else
    lynxView.loadTemplate(fromURL: "main.lynx")
#endif
@@ -39,3 +37,19 @@ class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  }
}

+class CustomLynxProvider: NSObject, LynxTemplateProvider {
+  func loadTemplate(withUrl url: String!, onComplete callback: LynxTemplateLoadBlock!) {
+    if let filePath = Bundle.main.path(forResource: url, ofType: "bundle") {
+      do {
+        let data = try Data(contentsOf: URL(fileURLWithPath: filePath))
+        callback(data, nil)
+      } catch {
+        print("Error reading file: \(error.localizedDescription)")
+        callback(nil, error)
+      }
+    } else {
+      let urlError = NSError(domain: "com.lynx", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid URL."])
+      callback(nil, urlError)
+    }
+  }
+}
```

This method ensures your app runs independently of the packager.

## Custom Native Element development

This section explains how to create and register a custom native element for a Lynx-based application. We'll walk through implementing a simple native `UIView` extension.

### Native Component Implementation

We begin by implementing a custom native `UIView`. This view includes a property for setting the background color based on a hex string.

- header:
```objective-c

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface LynxColorBoxView : UIView

@property (nonatomic, copy) NSString *backgroundColorHex;

@end

NS_ASSUME_NONNULL_END
```

- implementation:
```objective-c
#import "LynxColorBoxView.h"

@implementation LynxColorBoxView

- (void)setBackgroundColorHex:(NSString *)backgroundColorHex {
    _backgroundColorHex = [backgroundColorHex copy];
    self.backgroundColor = [self colorFromHexString:_backgroundColorHex];
}

- (UIColor *)colorFromHexString:(NSString *)hexString {
    NSString *cleanString = [hexString stringByTrimmingCharactersInSet:
                             [NSCharacterSet whitespaceAndNewlineCharacterSet]];

    if ([cleanString hasPrefix:@"#"]) {
        cleanString = [cleanString substringFromIndex:1];
    }

    if (cleanString.length != 6) {
        return [UIColor lightGrayColor];
    }

    unsigned int rgbValue = 0;
    NSScanner *scanner = [NSScanner scannerWithString:cleanString];
    [scanner scanHexInt:&rgbValue];

    CGFloat red = ((rgbValue >> 16) & 0xFF) / 255.0;
    CGFloat green = ((rgbValue >> 8) & 0xFF) / 255.0;
    CGFloat blue = (rgbValue & 0xFF) / 255.0;

    return [UIColor colorWithRed:red green:green blue:blue alpha:1.0];
}

@end
```

### View Manager Implementation

The view manager is responsible for creating the view and mapping properties passed from the JS layer to the native component.

#### Register the Native Component

To register the component with Lynx, you need to use the `LYNX_LAZY_REGISTER_UI` macro and import `LynxComponentRegistry` header.

```objective-c
#import "LynxColorBoxComponent.h"

#import <Lynx/LynxComponentRegistry.h>

@implementation LynxColorBoxComponent

LYNX_LAZY_REGISTER_UI("color-box-view")

// ...

@end
```

#### Declare Property Setters

To expose properties to JavaScript, use the `LYNX_PROP_SETTER` macro and import `LynxPropsProcessor`. This connects the JS-side prop with the Objective-C.

```objective-c
// ...
#import <Lynx/LynxPropsProcessor.h>

@implementation LynxColorBoxComponent

// ...

LYNX_PROP_SETTER("backgroundColorHex", setBackgroudColorHex, NSString *) {
    self.view.backgroundColorHex = value;
}

// ...

@end
```

#### Override `createView`

This method is called when the view is created in the Element Tree. It should return the instance of your custom view.

```objective-c
@implementation LynxColorBoxComponent

// ...

- (UIView *)createView {
  UIView *colorBoxView = [[LynxColorBoxView alloc] init];
  return colorBoxView;
}

// ...
```

### Final View Manager Code

Putting everything together, the complete view manager implementation looks like this:

```objective-c
#import <Lynx/LynxUI.h>
#import "LynxColorBoxView.h"

NS_ASSUME_NONNULL_BEGIN

@interface LynxColorBoxComponent : LynxUI <LynxColorBoxView *>

@end

NS_ASSUME_NONNULL_END
```

```objective-c
#import "LynxColorBoxComponent.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxPropsProcessor.h>

@implementation LynxColorBoxComponent

LYNX_LAZY_REGISTER_UI("color-box-view")

LYNX_PROP_SETTER("backgroundColorHex", setBackgroudColorHex, NSString *) {
    self.view.backgroundColorHex = value;
}

- (UIView *)createView {
  UIView *colorBoxView = [[LynxColorBoxView alloc] init];
  return colorBoxView;
}

@end
```

### Registering a Custom Native Element for an Application Instance

If AppDelegate/SceneDelegate is implemented in Swift, include the header of your View Manager in the Bridging Header:
```objective-c
#import "elements/LynxColorBoxComponent.h"
```

Register the native component using the builder object when creating a `LynxView` instance:

```swift
let lynxView = LynxView { builder in
  // ...
  builder.config?.registerUI(LynxColorBoxComponent.self, withName: "color-box-view")
}
```

### Extending IntrinsicElements with a Custom Component

Lynx has a configuration file that allows recognition of symbols registered as native elements.

You need to add the type definition for your custom component in `src/rspeedy-env.d.ts`.

```ts
declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    ...,
    "color-box-view": {
      className?: string;
      id?: string;
      style?: string | Lynx.CSSProperties;
      backgroundColorHex?: string | undefined;
    };
  }
}
```

Note: `tsconfig.json` used in this project

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@lynx-js/react",

    "module": "node16",
    "moduleResolution": "node16",

    "strict": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    "esModuleInterop": true,
    "skipLibCheck": true,
  },
  "exclude": ["dist/"],
}
```

### Creating an Instance of the Component in JS

Lynx supports JSX syntax, so using components looks similar to HTML markup.

In any file, e.g. `App.tsx`, you can add the following:

```tsx
// ...
import * as Lynx from "@lynx-js/types";

// ...
export function App(props: { onRender?: () => void }) {
  return (
    <view>
      <view className="Content">
        <color-box-view 
          backgroundColorHex="#45ac1f"
          style={{
            height: 200,
            width: 200,
          }}
        />
      </view>
    </view>
  );
}
// ...
```

Then, you can launch the application and observe that the Custom Native Element with the green background color is rendered. You can verify that `LynxColorBoxView` is present in the native hierarchy.

---

## References

- CLI Source Code & Docs: https://github.com/lynx-community/cli/tree/main
- Official Quick Start Guide: https://lynxjs.org/guide/start/quick-start?ios-simulator-platform=macos-arm64&explorer-platform=ios-simulator
- Custom Native Element Development: https://lynxjs.org/guide/custom-native-component.html?platform=ios 
- Example implementation of Custom Native Element for iOS: https://github.com/software-mansion/lynx-screens/commit/8f152dcf6c14849ac2758ce0541e8e8d12b47aca

---