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

## Custom Native Element development - TBC

---

## References

- CLI Source Code & Docs: https://github.com/lynx-community/cli/tree/main
- Official Quick Start Guide: https://lynxjs.org/guide/start/quick-start?ios-simulator-platform=macos-arm64&explorer-platform=ios-simulator
- Custom Native Element Development: https://lynxjs.org/guide/custom-native-component.html?platform=ios 

---