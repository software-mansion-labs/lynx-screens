package com.lynxscreens.screens.common.trace

import java.util.concurrent.atomic.AtomicLong

internal enum class NativeTransitionOperation(internal val traceValue: String) {
    PUSH("push"),
    POP("pop"),
    BATCH("batch"),
    PRESENT("present"),
    DISMISS("dismiss"),
}

internal enum class NativeTransitionOrigin(internal val traceValue: String) {
    LYNX_PATCH("lynx_patch"),
    NATIVE_BACK("native_back"),
    NATIVE_DISMISS("native_dismiss"),
    CASCADE("cascade"),
}

internal enum class NativeTransitionPresentation(internal val traceValue: String) {
    STACK("stack"),
    FORM_SHEET("form_sheet"),
}

internal class NativeTransitionContext
private constructor(
    internal val id: String,
    internal val navigationTraceId: String?,
    internal val preloadTraceId: String?,
    internal val containerId: String,
    internal val presentation: NativeTransitionPresentation,
    internal val operation: NativeTransitionOperation,
    internal val origin: NativeTransitionOrigin,
    internal val sourceScreenKey: String?,
    internal val targetScreenKey: String?,
    internal val popCount: Int,
    internal val pushCount: Int,
    internal val targetReused: Boolean,
    internal val session: TraceSession?,
    internal val contents: Map<String, ContentTraceIdentity>,
) {
    internal val traceIdentity =
        NavigationTraceIdentity(
            navigationTraceId = navigationTraceId,
            preloadTraceId = preloadTraceId,
            nativeTransitionId = id,
            containerId = containerId,
            runtimeId = session?.runtimeId,
            navigatorKey = session?.navigatorKey,
        )

    internal fun identityFor(screenKey: String?): NavigationTraceIdentity =
        contents[screenKey]?.identity(containerId, traceIdentity)
            ?: traceIdentity.copy(screenKey = screenKey)

    internal enum class State {
        PREPARED,
        STARTED,
        COMPLETED,
        CANCELLED,
        PREVENTED,
    }

    internal var state: State = State.PREPARED
        private set

    internal fun markStarted(): Boolean {
        if (state != State.PREPARED) {
            return false
        }
        state = State.STARTED
        return true
    }

    internal fun markCompleted(): Boolean {
        if (state == State.COMPLETED || state == State.CANCELLED || state == State.PREVENTED) {
            return false
        }
        state = State.COMPLETED
        return true
    }

    internal fun markCancelled(): Boolean {
        if (state == State.COMPLETED || state == State.CANCELLED || state == State.PREVENTED) {
            return false
        }
        state = State.CANCELLED
        return true
    }

    internal fun markPrevented(): Boolean {
        if (state == State.COMPLETED || state == State.CANCELLED || state == State.PREVENTED) {
            return false
        }
        state = State.PREVENTED
        return true
    }

    internal fun traceArguments(vararg additional: Pair<String, Any?>): Map<String, String> =
        LynxScreensTrace.argumentsOf(
            "runtime_id" to session?.runtimeId,
            "navigator_key" to session?.navigatorKey,
            "navigation_trace_id" to navigationTraceId,
            "preload_trace_id" to preloadTraceId,
            "native_transition_id" to id,
            "container_id" to containerId,
            "presentation" to presentation.traceValue,
            "operation" to operation.traceValue,
            "origin" to origin.traceValue,
            "source_screen_key" to sourceScreenKey,
            "target_screen_key" to targetScreenKey,
            "pop_count" to popCount,
            "push_count" to pushCount,
            "target_reused" to targetReused,
            *additional,
        )

    internal companion object {
        private val nextId = AtomicLong()

        internal fun create(
            containerId: String,
            presentation: NativeTransitionPresentation,
            operation: NativeTransitionOperation,
            origin: NativeTransitionOrigin,
            sourceScreenKey: String?,
            targetScreenKey: String?,
            popCount: Int = 0,
            pushCount: Int = 0,
            targetReused: Boolean = false,
            navigationTraceId: String? = null,
            preloadTraceId: String? = null,
            session: TraceSession? = null,
            contents: Map<String, ContentTraceIdentity> = emptyMap(),
        ): NativeTransitionContext =
            NativeTransitionContext(
                id = "$containerId:transition:${nextId.incrementAndGet()}",
                navigationTraceId = navigationTraceId,
                preloadTraceId = preloadTraceId,
                containerId = containerId,
                presentation = presentation,
                operation = operation,
                origin = origin,
                sourceScreenKey = sourceScreenKey,
                targetScreenKey = targetScreenKey,
                popCount = popCount,
                pushCount = pushCount,
                targetReused = targetReused,
                session = session,
                contents = contents.toMap(),
            )
    }
}
