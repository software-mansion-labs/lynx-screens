package com.lynxscreens.screens.common.trace

import com.lynx.tasm.base.TraceEvent

internal object LynxScreensTrace {
    internal const val STACK_OPERATION_REQUESTED = "LynxScreens.Stack.OperationRequested"
    internal const val STACK_OPERATION_BATCH_PREPARED = "LynxScreens.Stack.OperationBatchPrepared"
    internal const val STACK_APPLY_OPERATIONS = "LynxScreens.Stack.ApplyOperations"
    internal const val STACK_NATIVE_BACK_REQUESTED = "LynxScreens.Stack.NativeBackRequested"
    internal const val STACK_TRANSITION_CALLBACK_RECEIVED =
        "LynxScreens.Stack.TransitionCallbackReceived"
    internal const val STACK_NATIVE_TRANSITION_START = "LynxScreens.Stack.NativeTransitionStart"
    internal const val STACK_NATIVE_TRANSITION_END = "LynxScreens.Stack.NativeTransitionEnd"
    internal const val STACK_NATIVE_TRANSITION_CANCELLED =
        "LynxScreens.Stack.NativeTransitionCancelled"
    internal const val STACK_NATIVE_DISMISS_COMMITTED = "LynxScreens.Stack.NativeDismissCommitted"
    internal const val STACK_NATIVE_DISMISS_PREVENTED = "LynxScreens.Stack.NativeDismissPrevented"
    internal const val STACK_LIFECYCLE_EVENT_EMITTED = "LynxScreens.Stack.LifecycleEventEmitted"
    internal const val STACK_DISMISS_EVENT_EMITTED = "LynxScreens.Stack.DismissEventEmitted"

    internal const val FORM_SHEET_PRESENT_REQUESTED = "LynxScreens.FormSheet.PresentRequested"
    internal const val FORM_SHEET_DISMISS_REQUESTED = "LynxScreens.FormSheet.DismissRequested"
    internal const val FORM_SHEET_NATIVE_TRANSITION_START =
        "LynxScreens.FormSheet.NativeTransitionStart"
    internal const val FORM_SHEET_NATIVE_TRANSITION_END =
        "LynxScreens.FormSheet.NativeTransitionEnd"
    internal const val FORM_SHEET_NATIVE_TRANSITION_CANCELLED =
        "LynxScreens.FormSheet.NativeTransitionCancelled"
    internal const val FORM_SHEET_NATIVE_DISMISS_COMMITTED =
        "LynxScreens.FormSheet.NativeDismissCommitted"
    internal const val FORM_SHEET_NATIVE_DISMISS_PREVENTED =
        "LynxScreens.FormSheet.NativeDismissPrevented"
    internal const val FORM_SHEET_LIFECYCLE_EVENT_EMITTED =
        "LynxScreens.FormSheet.LifecycleEventEmitted"
    internal const val FORM_SHEET_DISMISS_EVENT_EMITTED =
        "LynxScreens.FormSheet.DismissEventEmitted"

    private const val CATEGORY = "lynx"

    internal fun isEnabled(): Boolean =
        try {
            TraceEvent.categoryEnabled(CATEGORY)
        } catch (_: Exception) {
            false
        }

    internal fun instant(name: String, arguments: () -> Map<String, String>) {
        if (!isEnabled()) {
            return
        }
        try {
            TraceEvent.instant(CATEGORY, name, arguments())
        } catch (_: Exception) {
            /* Observation only. */
        }
    }

    internal fun <T> section(
        name: String,
        arguments: () -> Map<String, String>,
        block: () -> T,
    ): T {
        if (!isEnabled()) {
            return block()
        }

        val began =
            try {
                TraceEvent.beginSection(CATEGORY, name, arguments())
                true
            } catch (_: Exception) {
                false
            }
        return try {
            block()
        } finally {
            if (began)
                try {
                    TraceEvent.endSection(CATEGORY, name)
                } catch (_: Exception) {
                    /* Observation only. */
                }
        }
    }

    internal fun argumentsOf(vararg entries: Pair<String, Any?>): Map<String, String> = buildMap {
        entries.forEach { (key, value) ->
            if (value != null) {
                put(key, value.toString())
            }
        }
    }
}
