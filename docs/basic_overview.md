# Lynx - Technical Overview

This document provides an overview of the key concepts and architecture behind the Lynx framework.

---

## Core Components of Lynx

- **LynxApp (JavaScript):** The main application logic layer built on the Lynx framework.
- **LynxCore (C++):** The core engine responsible for low-level rendering and platform integration.
- **Host (Platform-Specific):** A native layer specific to the target platform (e.g. Android, iOS) that integrates with LynxCore.
- **PrimJS:** A JavaScript engine developed by and used within the Lynx ecosystem.

<img width="1032" height="868" alt="lynx_infrastructure" src="https://github.com/user-attachments/assets/209c6faa-2730-4163-afb9-06662e61d3d7" />

---

## Threading Model

Lynx implements a multi-threaded architecture for optimized performance:

1. **UI Thread (Main Thread):** The main application thread, responsible for rendering the UI.
2. **Background Scripting Thread (JS Thread):** Dedicated to executing scripting code in the background.
3. **Engine Thread (Tasm Thread):** Handles the pixel rendering pipeline.
4. **Layout Thread:** Performs layout calculations and updates within the rendering pipeline.

---

## Rendering Pipeline

Rendering is divided into several phases: (1-4) during the first render and (3-4) for re-renders.

### Render Phases:

#### 1. Load

- Downloads and requests the application bundle.

#### 2. Parse

- Parses the downloaded application bundle into executable code structures.

#### 3. Framework Rendering

Executed in two possible modes:

- **Main Thread Rendering:** Renders the frame on the UI Thread directly, allowing synchronous UI updates, but may block the interface for heavier tasks.
- **Background-driven Rendering:** Initiated from a background thread, with rendering commands passed at some point to the main thread for processing. This can reduce UI Thread load, at the cost of possible added latency for rendering.

<img width="1462" height="1602" alt="rendering" src="https://github.com/user-attachments/assets/8b0b8fd3-0740-4d65-ad57-64cc620148c5" />

#### 4. Pixel Pipeline

Responsible for converting the Element Tree into actual pixels displayed on the screen. Consists of several phases:

##### 4.1 Resolve

- Generates styles and props for elements.
- Syncs with layout nodes.
- Constructs the layout node tree.
- Produces drawing operations (`UI Paint OP`).

Types of resolve:

- **Parallel Resolve:** Tasks run concurrently across threads.
- **Serial Resolve:** Tasks run sequentially on a single thread.

##### 4.2 Layout

- Computes layout using the layout node tree.
- Synchronizes results with elements.
- Generates layout-specific operations (`UI Layout OP`).

##### 4.3 Execute UI OP

- Performs UI update operations:
  - **UI Paint OP:** Includes visual tree mutations (Element Tree Mutations & Element Mutations).
  - **UI Layout OP:** Includes metric or positioning updates.

##### 4.4 Paint

- Final rendering stage using the native UI platform and component tree.

---

## Types of operations for Element Tree

### Element Tree Operations

- **Element Tree Mutation:** Adding, removing, or replacing elements in the tree.
- **Selector Query:** Search for elements by selector (similar to `querySelector` or `querySelectorAll` in web).

### Element Operations

- **Element Mutation:** Set or get attributes for a specific element.
- **Element Method:** Invoke methods on an element such as `getBoundingClientRect`, `animate`, etc.

---

## References

- Instant First-Frame Rendering: https://lynxjs.org/guide/interaction/ifr.html
- Dual-thread architecture: https://lynxjs.org/guide/scripting-runtime/index.html#javascript-runtime
- Rendering pipeline explanation:  
  https://lynxjs.org/next/guide/performance/analysis-performance/reactlynx-render-process#reactlynx-rendering-pipeline
