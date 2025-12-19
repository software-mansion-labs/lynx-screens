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










## Custom Native Element development

This section explains how to create and register a custom native element for a Lynx-based application. We'll walk through implementing a simple native `View` extension.









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
- Example implementation of Custom Native Element for iOS: **TBD**

---