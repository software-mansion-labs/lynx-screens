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

## Launching application from Android Studio

To launch the application in a native iOS environment via Xcode, follow these steps:

1. Install JavaScript dependencies:

   ```bash
   npm install
   npm run dev
   ```

2. Open `android` folder in Android Studio

3. Upgrade Lynx dependencies to `3.5.1`

Note: For Lynx `3.4.1` which is the default version in the template, we're noticing issues related to Custom Native Element codegen - especially missing classes for prop setters. Therefore we're recommending to upgrade to `3.5.1` version which was tested and works reliably.

```diff
diff --git a/android/app/build.gradle.kts b/android/app/build.gradle.kts
index 8ad136b..bcd9de8 100644
--- a/android/app/build.gradle.kts
+++ b/android/app/build.gradle.kts
@@ -85,13 +85,13 @@ dependencies {
     implementation("com.squareup.retrofit2:retrofit:2.7.0")
 
     // lynx dependencies
-    implementation("org.lynxsdk.lynx:lynx:3.4.1")
-    implementation("org.lynxsdk.lynx:lynx-jssdk:3.4.1")
-    implementation("org.lynxsdk.lynx:lynx-trace:3.4.1")
+    implementation("org.lynxsdk.lynx:lynx:3.5.1")
+    implementation("org.lynxsdk.lynx:lynx-jssdk:3.5.1")
+    implementation("org.lynxsdk.lynx:lynx-trace:3.5.1")
     implementation("org.lynxsdk.lynx:primjs:2.14.1")
 
     // integrating image-service
-    implementation("org.lynxsdk.lynx:lynx-service-image:3.4.1")
+    implementation("org.lynxsdk.lynx:lynx-service-image:3.5.1")
 
     // image-service dependencies, if not added, images cannot be loaded; if the host APP needs to use other image libraries, you can customize the image-service and remove this dependency
     implementation("com.facebook.fresco:fresco:2.3.0")
@@ -101,18 +101,18 @@ dependencies {
     implementation("com.facebook.fresco:animated-base:2.3.0")
 
     // integrating log-service
-    implementation("org.lynxsdk.lynx:lynx-service-log:3.4.1")
+    implementation("org.lynxsdk.lynx:lynx-service-log:3.5.1")
 
     // integrating http-service
-    implementation("org.lynxsdk.lynx:lynx-service-http:3.4.1")
+    implementation("org.lynxsdk.lynx:lynx-service-http:3.5.1")
 
     implementation("com.squareup.okhttp3:okhttp:4.9.0")
 
     // add devtool's dependencies
-    implementation ("org.lynxsdk.lynx:lynx-devtool:3.4.1")
-    implementation ("org.lynxsdk.lynx:lynx-service-devtool:3.4.1")
+    implementation ("org.lynxsdk.lynx:lynx-devtool:3.5.1")
+    implementation ("org.lynxsdk.lynx:lynx-service-devtool:3.5.1")
 
     // add xelement's dependencies
-    implementation ("org.lynxsdk.lynx:xelement:3.4.1")
-    implementation ("org.lynxsdk.lynx:xelement-input:3.4.1")
+    implementation ("org.lynxsdk.lynx:xelement:3.5.1")
+    implementation ("org.lynxsdk.lynx:xelement-input:3.5.1")
 }
\ No newline at end of file
```

4. Apply workarounds for `kapt` (optional, only for Custom Native Element development)

`kapt` (Kotlin Annotation Processing Tool) is Kotlin's equivalent of Java's annotation processing API. It is used to run annotation processors that generate code or perform checks at compile time.

Since Kotlin doesn't natively support Java's annotation processing, `kapt` acts as a bridge to support these processors in Kotlin code.

To use annotation processors for generating native elements code for Lynx, you need to enable `kapt` in your Gradle setup.

Add the kapt plugin to your module-level `build.gradle.kts` file (located at `android/app/build.gradle.kts`). Then, within the `dependencies` block, include the annotation processor dependencies:

```kotlin
plugins {
    ...
    id("kotlin-kapt")
}
...
dependencies {
    ...
    kapt("org.lynxsdk.lynx:lynx-processor:3.5.1")
    compileOnly("org.lynxsdk.lynx:lynx-processor:3.5.1")
    annotationProcessor("org.lynxsdk.lynx:lynx-processor:3.5.1")
}
```

When building the app, you may encounter the following error:

```
> Task :app:kaptGenerateStubsDebugKotlin FAILED
e: java.lang.IllegalAccessError: superclass access check failed: class org.jetbrains.kotlin.kapt3.base.javac.KaptJavaCompiler (in unnamed module @0x50f2d58) cannot access class com.sun.tools.javac.main.JavaCompiler (in module jdk.compiler) because module jdk.compiler does not export com.sun.tools.javac.main to unnamed module @0x50f2d58
	at java.base/java.lang.ClassLoader.defineClass1(Native Method)
...

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:kaptGenerateStubsDebugKotlin'.
> A failure occurred while executing org.jetbrains.kotlin.compilerRunner.GradleCompilerRunnerWithWorkers$GradleKotlinCompilerWorkAction
   > Internal compiler error. See log for more details

* Try:
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

...

BUILD FAILED in 5s
30 actionable tasks: 13 executed, 17 up-to-date
```

This is a known issue that occurs because Java 17 (or newer versions) introduced stronger module boundaries. The internal classes used by `kapt` are not exported by default in Java modules. This results in an `IllegalAccessError`.

`kapt` tries to interact with internal compiler APIs, but due to restrictions, it fails unless explicitly allowed through JVM startup options.

To fix this, you need to add additional JVM arguments to `gradle.properties` to manually export these internal compiler packages by bypassing module boundaries:

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8 \
  --add-exports=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED \
  --add-exports=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED \
  --add-exports=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED \
  --add-exports=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED \
  --add-exports=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED \
  --add-exports=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED

kapt.use.worker.api=false
```

5. Apply workarounds for `lynx@3.5.1` compatibility issues

Lynx `v3.5.1` has a compatibility issue with `kapt` and the Kotlin compiler on certain setups. To successfully build your project, you need to apply a workaround or patch in some of the Android source files.

For example, [this commit](https://github.com/software-mansion/lynx-screens/blob/5f88f53de3bf54f0f4c74cea9a9dcffca9d852ee/android/app/src/main/java/com/lynxscreens/providers/GenericResourceFetcher.kt) provides a fix in the GenericResourceFetcher from CLI which is outdated after upgrading dependencies earlier.

6. Launch the application

## Custom Native Element development

This section explains how to create and register a custom native element for a Lynx-based application. We'll walk through implementing a simple native `View` extension.

### Integration with LynxProcessor Module

Add the kapt plugin to your module-level `build.gradle.kts` file (located at `android/app/build.gradle.kts`). Then, within the `dependencies` block, include the annotation processor dependencies:

```kotlin
plugins {
    ...
    id("kotlin-kapt")
}
...
dependencies {
    ...
    kapt("org.lynxsdk.lynx:lynx-processor:3.5.1")
    compileOnly("org.lynxsdk.lynx:lynx-processor:3.5.1")
    annotationProcessor("org.lynxsdk.lynx:lynx-processor:3.5.1")
}
```

**Note:** If any issue occurs, please refer to `Apply workarounds for kapt (optional, only for Custom Native Element development)` section.

### Declaring Custom Element

#### Creating the View Manager Class

The View Manager class is responsible for managing the lifecycle of the custom native view and passing props from the frontend to the native component.

```kotlin
package com.lynxscreens.elements

import android.view.View
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.LynxUI

class LynxColorBoxViewManager(context: LynxContext) : LynxUI<View>(context) {
    // ...
}
```

#### Creating the Native View Instance

To create a custom native element, you need to implement the `createView` method, which returns a new instance of the native Android View.

```kotlin
package com.lynxscreens.elements

// ...
import android.content.Context
// ...

class LynxColorBoxViewManager(context: LynxContext) : LynxUI<View>(context) {
    override fun createView(context: Context): View {
        return View(context)
    }
}
```

#### Handling Prop Updates

To listen for prop changes sent from JS, use the `@LynxProp` annotation. This ensures that your view reacts dynamically to property updates.

```kotlin
package com.lynxscreens.elements

// ...
import android.graphics.Color
// ...
import com.lynx.tasm.behavior.LynxProp
// ...

class LynxColorBoxViewManager(context: LynxContext) : LynxUI<View>(context) {
    // ...

    @LynxProp(name = "backgroundColorHex")
    fun setBackgroundColorHex(value: String) {
        try {
            val color = Color.parseColor(value)
            mView.setBackgroundColor(color)
        } catch (e: IllegalArgumentException) {
        }
    }
}
```

### Registering Custom Element

In this example, we use local element registration via the `viewBuilder` object inside `MainActivity`. Lynx also supports global registration, allowing custom components to be shared across multiple `LynxView` instances.

```kotlin
package com.lynxscreens

// ...
import com.lynx.tasm.behavior.Behavior
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.LynxUI
// ...
import com.lynxscreens.elements.LynxColorBoxViewManager

class MainActivity : Activity() {
    private fun buildLynxView(): LynxView {
        // ...

        viewBuilder.addBehavior(object : Behavior("color-box-view") {
            override fun createUI(context: LynxContext): LynxColorBoxViewManager {
                return LynxColorBoxViewManager(context)
            }
        })

        // ...

        return viewBuilder.build(this)
    }
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
- Official Quick Start Guide: https://lynxjs.org/guide/start/quick-start?ios-simulator-platform=macos-arm64&explorer-platform=android
- Custom Native Element Development: https://lynxjs.org/guide/custom-native-component.html?platform=android
- Example implementation of Custom Native Element for android: https://github.com/software-mansion/lynx-screens/commit/9feb6668df5bffb30a923a1a0a663e28a428bc00

---