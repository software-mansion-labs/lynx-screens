# Navigation trace instrumentation

This draft adds diagnostic events to the existing native containers. Events use
fixed names, with identities and other values in trace arguments. The writer
calls Lynx trace APIs; the interface for future sharing with React Native Screens
is still open for discussion.

## Android

`LynxScreensTrace` emits points through `TraceEvent.instant` and synchronous
sections through `beginSection` / `endSection`, using the `lynx` category.
A section encloses only the synchronous native work, including exception paths.

| Prefix | Event suffix | Boundary |
| --- | --- | --- |
| `LynxScreens.Stack` | `OperationRequested` | A raw push/pop request, before reconciliation. |
| `LynxScreens.Stack` | `OperationBatchPrepared` | The actual stack operation batch is prepared. |
| `LynxScreens.Stack` | `ApplyOperations` | Synchronous submission of the batch (section). |
| `LynxScreens.Stack` | `NativeBackRequested` | A native back intent is observed. |
| `LynxScreens.Stack` | `TransitionCallbackReceived` | A Fragment transition callback, with screen, role and phase. |
| `LynxScreens.FormSheet` | `PresentRequested`, `DismissRequested` | Presentation/dismissal intent at the Material backend boundary. |
| Both | `NativeTransitionStart`, `NativeTransitionEnd`, `NativeTransitionCancelled` | Container transition start, completion or cancellation. |
| Both | `NativeDismissCommitted`, `NativeDismissPrevented` | Removal is committed, or a native dismissal is prevented. |
| Both | `LifecycleEventEmitted`, `DismissEventEmitted` | Native sends an existing lifecycle/dismissal message to JS. |
| Both | `ScreenContentBound` | Available content identity is associated with the native operation's screen context. |

All events except `ApplyOperations` are points. Android's Material callback does
not distinguish drag, backdrop and back dismissal sources: these use
`origin=native_dismiss`; cascading dismissal uses `origin=cascade`. Programmatic
changes use `origin=lynx_patch`. The external FormSheet backend must supply its
own instrumentation; the built-in backend is the reference implementation.

## Correlation

`traceSession` enables navigation observation for a runtime and navigator.
`navigationTraceContext` carries a versioned envelope, sequence and expected
container changes. The native layer consumes a unique matching binding once per
container. Missing or ambiguous bindings remain unlinked. The framework can
supply `contentTraceContext` to identify the screen's content instance.

`navigation_trace_id` identifies one logical request; `native_transition_id`
identifies one native operation. They are not interchangeable. Native back and
dismissal requests create a native request identity. Existing native messages
carry the captured identity as `detail.traceIdentity` for the navigation adapter
to reuse when synchronizing JS state.

Delayed transition callbacks retain their operation handle. A completed,
cancelled or prevented operation cannot claim another terminal event. Generic
Android View lifecycle notifications retain their screen/container identity and
omit request/transition IDs because those callbacks do not identify a specific
navigation operation.

Submitting operations, completing a transition and sending a lifecycle event
are separate facts. None proves that pixels have been presented. This change has
no first-frame probe and does not calculate screen performance metrics.
