# Navigation trace instrumentation

This draft adds diagnostic events to the existing native containers. Events use
fixed names, with identities and other values in trace arguments. The writer
calls Lynx trace APIs; the interface for future sharing with React Native Screens
is still open for discussion.

## Android

`LynxScreensTrace` emits points through `TraceEvent.instant` and synchronous
sections through `beginSection` / `endSection`, using the `lynx` category.
A section encloses only the synchronous native work, including exception paths.

| Prefix                  | Event suffix                                                                | Boundary                                                                             |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `LynxScreens.Stack`     | `OperationRequested`                                                        | A raw push/pop request, before reconciliation.                                       |
| `LynxScreens.Stack`     | `OperationBatchPrepared`                                                    | The actual stack operation batch is prepared.                                        |
| `LynxScreens.Stack`     | `ApplyOperations`                                                           | Synchronous submission of the batch (section).                                       |
| `LynxScreens.Stack`     | `NativeBackRequested`                                                       | A native back intent is observed.                                                    |
| `LynxScreens.Stack`     | `TransitionCallbackReceived`                                                | A Fragment transition callback, with screen, role and phase.                         |
| `LynxScreens.FormSheet` | `PresentRequested`, `DismissRequested`                                      | Presentation/dismissal intent at the Material backend boundary.                      |
| Both                    | `NativeTransitionStart`, `NativeTransitionEnd`, `NativeTransitionCancelled` | Container transition start, completion or cancellation.                              |
| Both                    | `NativeDismissCommitted`, `NativeDismissPrevented`                          | Removal is committed, or a native dismissal is prevented.                            |
| Both                    | `LifecycleEventEmitted`, `DismissEventEmitted`                              | Native sends an existing lifecycle/dismissal message to JS.                          |
| Both                    | `ScreenContentBound`                                                        | Available content identity is associated with the native operation's screen context. |

All events except `ApplyOperations` are points. Android's Material callback does
not distinguish drag, backdrop and back dismissal sources: these use
`origin=native_dismiss`; cascading dismissal uses `origin=cascade`. Programmatic
changes use `origin=lynx_patch`. The external FormSheet backend must supply its
own instrumentation; the built-in backend is the reference implementation.

## iOS

`RNSNavigationTrace` writes through `LynxTraceEvent` when its header and the trace
category are available. The current implementation covers Stack; there is no
iOS FormSheet implementation in the base branch.

Stack implements the events above except `NativeDismissPrevented`, since the
current iOS Stack has no corresponding prevention hook. Raw operation requests
are recorded before reconciliation. `ApplyOperations` surrounds the existing
synchronous UIKit calls. `TransitionCallbackReceived` records the transition
coordinator completion (end or cancel); it is separate from the guarded terminal
event. A missing coordinator permits synchronous completion, while an unavailable
completion registration cancels observation rather than claiming completion.

Lifecycle emitters capture their operation/content identity. Later host
lifecycle notifications do not revive a completed operation. Native removal is
recorded at the existing parent-removal callback.

The new trace header is private in the Pod. The existing explicit `common`
source glob includes the implementation; no additional platform dependencies or
new exported source directories are needed.

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

## JS bridge

The navigation adapter supplies `internalTrace` on the existing
`StackHostNativeComponent`, `StackScreenNativeComponent` and
`FormSheetNativeComponent` roots. Host props contain the session and operation
envelope; screen props contain the session, optional content identity and
optional bridge observer. A FormSheet needs a `traceScreenKey`, which can also
be derived from its supplied content identity. The Host envelope remains the
channel for a Sheet that is removed during an update.

The bridge encodes native attributes and forwards callback context. It does not
create navigation IDs, implement the navigation adapter or write JS trace
events. `onRootCommitted` observes the JS wrapper's effect, not a native commit
or a completed draw. `onEventForwarded` observes the current native message;
observer failures do not suppress the original handler or catch its errors.

Stack dismissal callbacks keep `screenKey` as their first argument and add an
optional `NativeEventContext` as the second. FormSheet dismissal callbacks gain
an optional context argument. Existing raw lifecycle/prevention handlers receive
the original event. The exported `UNSTABLE_decodeNativeTraceEvent` helper can
extract the versioned identity without relying on the latest navigation state.
Missing or malformed trace data remains unlinked.

Content identity is optional and independent of timing flags. This bridge does
not generate or inject FCP timing flags, add layout nodes or install first-frame
observers.

## Validation and manual acceptance

Use the library's `typecheck` and lint commands, build the example bundle and
native examples, and run Android `testDebugUnitTest`. Codec tests run with
`node --experimental-strip-types --test tests/navigation-trace.test.mjs` on Node
22.6 or newer. Native builds and protocol tests do not establish runtime event
ordering or confirm the absence of navigation regressions.

With an adapter providing the versioned props, record push/pop, batched changes,
preloaded screen activation, native back, dismissal prevention, rapid successive
transitions and nested-container teardown. On Android also cover Material Sheet
present/dismiss and cascading dismissal. Verify operation identities across
callbacks, a single terminal event, unlinked ambiguous batches and unchanged
behavior when observation is disabled. No screen FCP or presentation metric is
claimed by these events.
