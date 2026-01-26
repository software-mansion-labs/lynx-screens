# Lynx iOS Internal Architecture

## 1. Environment & Initialization

* **JSC and V8:** Logs show `make JSC runtime`, but V8 annotations are present either. 

### Template Loading Flow

The loading process initiates in the native host and bridges into the C++ Core:

I have my TemplateProvider definition which fetches the bundle via `URLSession` in `loadTemplate:withUrl:onComplete` method

```swift
func loadTemplate(withUrl url: String!, onComplete callback: LynxTemplateLoadBlock!) {
    guard let encodeUrl = url.addingPercentEncoding(withAllowedCharacters: .urlFragmentAllowed),
          let nsUrl = URL(string: encodeUrl) else {
      let errorMsg = "Invalid URL: \(String(describing: url))"
      let error = NSError(domain: "com.lynx",
                          code: 400,
                          userInfo: [NSLocalizedDescriptionKey: errorMsg])
      callback(nil, error)
      return
    }
    
    let task = URLSession.shared.dataTask(with: nsUrl) { data, response, error in
      DispatchQueue.main.async {
        if let error = error {
          callback(data, error)
        } else if data == nil {
          let errorMsg = "data from \(String(describing: url)) is nil!"
          let dataError = NSError(domain: "com.lynx",
                                  code: 200,
                                  userInfo: [NSLocalizedDescriptionKey: errorMsg])
          callback(nil, dataError)
        } else {
          callback(data, nil)
        }
      }
    }
    task.resume()
}
```

Then, I'm initializing `LynxEnv` in application with my `TemplateProvider`

```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let lynxEnv = LynxEnv.sharedInstance()
    let config = LynxConfig(provider: TemplateProvider())
    
    // Register new modules with:
    // config.register(YourModuleName.self)
    
    lynxEnv.prepareConfig(config)
    
    return true
}
```

When I'm launching the app with SceneDelegate with `scene:willConnectTo:session:options` I can load the lynx bundle

```swift
lynxView.loadTemplate(
    fromURL: "http://localhost:3000/main.lynx.bundle?fullscreen=true",
    initData: nil
)
```

`LynxView:loadTemplateFromURL` calls `LynxTemplateRenderer:loadTemplateFromURL` which calls our `TemplateProvider` that realizes `LynxTemplateRenderer:internalLoadTemplate` in `onCompleteCallback`

`LynxTemplateRenderer:internalLoadTemplate` calls `LynxShell::LoadTemplate` that calls `LynxEngine::LoadTemplate` and finally `TemplateAssembler::LoadTemplate`. After the template is decoded, the flow reaches `TasmMediator::OnJSSourcePrepared`, which asynchronously triggers `runtime->OnJSSourcePrepared`. 
Then, `LynxRuntime` continues on the `LynxJS` thread and invokes `App::loadApp`, passing the bundle.  
At this stage, the JavaScript runtime proceeds to load and execute the code contained in the template, initiating the Lynx application.

## 2. Screen Metrics and Viewport

The engine requires physical constraints before the first render pass.

| Component | Responsibility |
| --- | --- |
| **LynxViewBuilder** | Captures initial `screenSize` (defaults to `UIScreen.main.bounds.size`). |
| **LynxUIContext** | Manages `LynxScreenMetrics` (width, height, scale). |
| **LynxEnvConfig** | C++ class storing metrics for the layout engine. |

This process can be divided into three key phases: initialization, transfer to the C++ engine, and template loading process.

1. Initialization Phase (Application -> Builder)

It starts in the native layer during the creation of the `LynxView`, where we manually provide the root view size for `Lynx`

```swift
let lynxView = LynxView { builder in
  ...
  builder.screenSize = windowScene.screen.bounds.size
  ...
}
```

Inside `LynxTemplateRenderer:initWithBuilderBlock`, there is a fallback in case the dimensions are not provided.
If `builder.screenSize` is zero, the system falls back to the device's default screen dimensions:

```objective-c
/// Member Variable
CGSize screenSize;
if (!CGSizeEqualToSize(builder.screenSize, CGSizeZero)) {
  screenSize = builder.screenSize;
} else {
  screenSize = [UIScreen mainScreen].bounds.size;
}
builder.screenSize = screenSize;
...
/// UIRender + LynxShell + Event
[self setUpWithBuilder:builder screenSize:screenSize];
```

2. Transfer to C++ (LynxEnvConfig)

After determining the native screen size, it is passed to the C++ engine.  
A `LynxScreenMetrics` object is created, which stores width, height, and screen scale.

```objective-c
- (void)setupUIOwnerWithBuilder:(LynxViewBuilder *)builder {
  LynxScreenMetrics *screenMetrics =
      [[LynxScreenMetrics alloc] initWithScreenSize:builder.screenSize
                                              scale:[UIScreen mainScreen].scale];
  ...
}
```

In `setUpLynxShellWithLastInstanceId`, the native values are passed to the constructor of the C++ class `lynx::tasm::LynxEnvConfig`.

```cpp
LynxScreenMetrics* screenMetrics = [_lynxUIRenderer getScreenMetrics];
auto lynx_env_config = lynx::tasm::LynxEnvConfig(
    screenMetrics.screenSize.width, screenMetrics.screenSize.height, 1.f, screenMetrics.scale);
```

3. Template Loading Process

During the `LoadTemplate` call, the engine ensures that screen metrics are defined before rendering begins.

`LynxShell::LoadTemplate` calls `LynxEngine::LoadTemplate` that calls `TemplateAssembler::LoadTemplate`

In `TemplateAssembler::OnRenderTemplate`, the `OnScreenMetricsSet` method is invoked.

```cpp
// Before render element, execute screen metrics override.
auto& client = page_proxy_.element_manager();
if (client != nullptr) {
  OnScreenMetricsSet(client->GetLynxEnvConfig().ScreenWidth(),
                      client->GetLynxEnvConfig().ScreenHeight());
}
```

## 3. The Pixel Pipeline (TASM)
The **TASM** (Template Assembly) thread is responsible for the pipeline that transforms the `ElementTree` into UI updates.

### First Layout Phase (`LayoutContext`)

1. Tree Building Phase (TASM & ElementManager)

We're starting the flow by loading the template (`LoadTemplateInternal`).

`TemplateAssembler` processes the data and creates Elements (`RenderTemplate`).

At this point, the Elements exist in memory as objects, but they do not yet have assigned dimensions or positions. Therefore, the `ElementManager` requests a layout pass by calling `RequestLayout`.

2. Calculation Phase (LayoutThread & LayoutContext)

`TasmMediator` forwards the task to `LayoutContext`.

`LayoutContext::Layout` invokes the layout calculation algorithm, which is described in detail in a later section.

3. Notification Phase (LynxTemplateRenderer & LynxView)

After the calculations are finished, the results must be propagated back to the native layer so that the views can actually be rendered.

`LayoutMediator::OnLayoutAfter` signals the completion of layout calculations.

`NativeFacadeDarwin::OnPageChanged` notifies the platform layer that the page layout has changed (it has been created for the first time).

`LynxView templateRender:onPageChanged:` The iOS component receives the signal and prepares to apply UI updates.

### Layout Phase (`LayoutContext`)
Lynx uses a layout engine (`Starlight`, similar to `Yoga` in `react-native`).
1. **Request:** `ElementManager::RequestLayout` is triggered after a "Patch" (JS/Fiber update).
2. **Calculation:** `LayoutContext::Layout` performs:
    * `DispatchLayoutBeforeRecursively`: Pre-layout hooks.
    * `root_->CalculateLayout`: Core box-model math.
    * `LayoutRecursively`: Updates layout results for the node tree.

```objective-c
// Dispatch OnLayoutBefore
LOGD("[Layout] Layout start" << view_port_info_str);
{
  TRACE_EVENT(LYNX_TRACE_CATEGORY, LAYOUT_CONTEXT_DISPATCH_BEFORE_RECURSIVE);
  DispatchLayoutBeforeRecursively(root_);
}
// CalculateLayout
LOGV("[Layout] Computing layout" << view_port_info_str);
{
  TRACE_EVENT(LYNX_TRACE_CATEGORY_VITALS, LAYOUT_CONTEXT_CALCULATE_LAYOUT);
  root_->CalculateLayout(GetFixedNodeSet());
}
LOGV("[Layout] Updating layout result" << view_port_info_str);
{
  TRACE_EVENT(LYNX_TRACE_CATEGORY, LAYOUT_CONTEXT_LAYOUT_RECURSIVE);
  LayoutRecursively(root(), options);
}
LOGV("[Layout] Dispatch layout after" << view_port_info_str);
...
delegate_->OnLayoutAfter(options, std::move(holder), true);
```

First, `UpdateLayoutInfo` is invoked for the current node, and only afterward the layout is recursively processed for its children in `LayoutRecursively`.

```cpp
void LayoutContext::LayoutRecursively(
    LayoutNode* node, const std::shared_ptr<PipelineOptions>& options) {
  if (!node->IsDirty() && !node->is_virtual()) {
    return;
  }

  if (IfNeedsUpdateLayoutInfo(node)) {
    UpdateLayoutInfo(node);
  }

  for (auto& child : node->children()) {
    LayoutRecursively(child, options);
  }

  node->MarkUpdated();
  ...
}
```

In `UpdateLayoutInfo`, all layout-related updates for the given node are performed.

```cpp
void LayoutContext::UpdateLayoutInfo(LayoutNode* node) {
  // Faster than use YGTransferLayoutOutputsRecursive in YGJNI.cc by 0.5 times
  auto sl_node = node->slnode();
  if (!sl_node) return;
  const auto& layout_result = sl_node->GetLayoutResult();
  float width = layout_result.size_.width_;
  float height = layout_result.size_.height_;
  ...
  delegate_->OnLayoutUpdate(
      node->id(), left, top, width, height, paddings, margins, borders,
      sticky_positions, sl_node->GetCSSStyle()->GetMaxHeight().GetRawValue());

  if (node->slnode()->GetSLMeasureFunc()) {
    // Dispatch OnLayoutAfter to those nodes that have custom measure
    platform_impl_->OnLayout(node->id(), left, top, width, height, paddings,
                             borders);
    ...
  }
}
```

### Painting Phase (`PaintingContextDarwin`)
Calculated values are dispatched to the Main Thread for native rendering.
* **UpdatePaintingNode:** Handles non-geometry properties (e.g. `backgroundColor`).
* **UpdateLayout:** Handles geometry (x, y, width, height, margins, padding).

**Note:** Within the `OnPatchFinishForFiber` flow, property updates (`UpdatePaintingNode`) are generally executed before layout updates (`UpdateLayout`), but I observed that they're called from another thread.

```cpp
void PaintingContextDarwin::UpdateLayout(int sign, float x, float y, float width, float height,
                                         const float* paddings, const float* margins,
                                         const float* borders, const float* flatten_bounds,
                                         const float* sticky, float max_height,
                                         uint32_t node_index) {
  // top left bottom right for UIEdgeInset
#define UI_EDGE_INSETS(array) \
  array != nullptr ? UIEdgeInsetsMake(array[1], array[0], array[3], array[2]) : UIEdgeInsetsZero
  NSMutableArray* stickyArr;
  if (sticky != nil) {
    stickyArr = [[NSMutableArray alloc] init];
    for (int i = 0; i < 4; i++) {
      [stickyArr addObject:[NSNumber numberWithFloat:sticky[i]]];
    }
  }
  __weak LynxUIOwner* uiOwner = uiOwner_;
  Enqueue([uiOwner, sign, x, y, width, height, padding = UI_EDGE_INSETS(paddings),
           border = UI_EDGE_INSETS(borders), margin = UI_EDGE_INSETS(margins), stickyArr]() {
    TRACE_EVENT(LYNX_TRACE_CATEGORY, UI_OPERATION_QUEUE_UPDATE_LAYOUT_TASK);

    [uiOwner updateUI:sign
           layoutLeft:x
                  top:y
                width:width
               height:height
              padding:padding
               border:border
               margin:margin
               sticky:stickyArr];
  });
#undef UI_EDGE_INSETS
}
```

What determines that `UpdatePaintingNode` is executed before `UpdateLayout`?

```cpp
void ElementManager::OnPatchFinishForFiber(
    std::shared_ptr<PipelineOptions> &options,
    base::MoveOnlyClosure<void, bool> patch_finish_callback,
    FiberElement *element) {
  ...
  // ----------------------------------------
  // UpdatePaintingNode is called from here
  element->FlushActionsAsRoot();
  // ----------------------------------------

  ...

  // if flush_option do not need layout or options do not need layout, skip
  // layout.
  if ((!need_layout_ || !options->trigger_layout_) &&
      !options->render_for_recreate_engine) {
    ...
  } else {
    ...
    if (need_layout_ && !(options->has_layout)) {
      options->has_layout = need_layout_;
    }
    // ----------------------------------------
    // UpdateLayout is called from here
    patch_finish_callback(true);
    // ----------------------------------------
    need_layout_ = false;
  }
  ...
}
```

**Note:** With overriding the `layoutDidFinished` method, we can obtain the latest layout information and apply custom logic.

## 4. Execution Order (Initial Render)
Methods that are responsible for building the tree structure:
```cpp
LayoutContext::CreateLayoutNode
LayoutContext::InsertLayoutNode
LayoutContext::RemoveLayoutNodeAtIndex
LayoutContext::MoveLayoutNode
LayoutContext::InsertLayoutNodeBefore
LayoutContext::RemoveLayoutNode
LayoutContext::DestroyLayoutNode
```

Observed sequence during the first render pass:

1. **Node Creation:** Nodes are created (Page [ID:10] first, then Custom Element [ID:17], followed by other children 11-16).
2. **Tree Attachment (Inserts):** Top-down attachment:
    * `10 (Page) -> 11 -> 12 -> 13`
    * `13 -> 14 (view)`
    * `13 -> 17 (Custom Native Element)`
    * `14 -> 15, 15 -> 16 (text)`
3. **Layout Updates:** `UpdateLayoutInfo` is called in the following order `(10, 11, 12, 13, 14, 15, 17)` starting from `LynxView` and for `13` it goes down recursively for descendants of `14` before proceeding to `Custom Native Element`

## 5. Property Update Logic

### First render - triggered by `CreatePaintingNode` in `createUIWithSign` method

**Note:** At this moment, frame hasn't been set yet.

```cpp
void PaintingContextDarwin::CreatePaintingNode(int sign, const std::string& tag,
                                               const fml::RefPtr<PropBundle>& painting_data,
                                               bool flatten, bool create_node_async,
                                               uint32_t node_index) {
  PropBundleDarwin* pda = static_cast<PropBundleDarwin*>(painting_data.get());
  NSString* tagName = [[NSString alloc] initWithUTF8String:tag.c_str()];
  // TODO(renzhongyue): Remove copy, we now own the shared_ptr of prop bundle here.
  NSDictionary* props = pda->dictionary();
  __weak LynxUIOwner* uiOwner = uiOwner_;

  ...

  Enqueue([uiOwner, sign, tagName, eventSet = pda->event_set(),
           lepusEventSet = pda->lepus_event_set(), props, node_index,
           gestureDetectorSet = pda->gesture_detector_set()]() {
    TRACE_EVENT(LYNX_TRACE_CATEGORY, UI_OPERATION_QUEUE_CREATE_PAINTING_NODE);

    [uiOwner createUIWithSign:sign
                      tagName:tagName
                     eventSet:eventSet
                lepusEventSet:lepusEventSet
                        props:props
                    nodeIndex:node_index
           gestureDetectorSet:gestureDetectorSet];
  });
}
```

### Updates - triggered by `UpdatePaintingNode`

Example: Updating `backgroundColor`.

1. **TASM Thread:** Detects change and calls `PaintingContextDarwin::UpdatePaintingNode`.
2. **Queue:** Operation is enqueued in `LynxUIOperationQueue`.
3. **Main Thread:** `LynxPropsProcessor` triggers the native setter:
    ```objective-c
    LYNX_PROP_SETTER("backgroundColorHex", setBackgroudColorHex, NSString *) {
      self.view.backgroundColorHex = value;
    }
    ```

## 6. Page Concept ([ref.](https://lynxjs.org/guide/spec.html#page)) 
* **Page:** A standalone view with a unique route (relative path).
* **Manifest:** A JSON configuration; the first entry is the `entry point`.
* **Resources:** Each page contains its own scripts, visual configs, and root component.
