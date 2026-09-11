package com.lynxscreens.screens.host

import com.lynxscreens.screens.common.trace.*
import com.lynxscreens.screens.screen.StackTransitionRole

/** Mutable ownership is used only while preparing an operation; callbacks carry its handle. */
internal class StackNavigationTrace(
    private val containerIdProvider: () -> String,
    private val navigationTraceContextStore: NavigationTraceContextStore,
) {
    internal var activeContext: NativeTransitionContext? = null
        private set

    private val participants = java.util.WeakHashMap<NativeTransitionContext, MutableSet<String>>()
    private val ended = java.util.WeakHashMap<NativeTransitionContext, MutableSet<String>>()
    private val containerId
        get() = containerIdProvider()

    internal fun prepareOperations(
        sourceScreenKey: String?,
        targetScreenKey: String?,
        popCount: Int,
        pushCount: Int,
        before: List<String>,
        after: List<String>,
        contents: Map<String, ContentTraceIdentity>,
        batch: TraceBatch?,
        animated: Boolean,
    ): NativeTransitionContext? {
        val session = navigationTraceContextStore.session ?: return null
        cancel("superseded")
        val binding =
            batch
                ?.takeIf { it.session == session }
                ?.consume(containerId, ExpectedTraceChange.Stack(before, after))
        val context =
            NativeTransitionContext.create(
                containerId,
                NativeTransitionPresentation.STACK,
                resolveOperation(popCount, pushCount),
                NativeTransitionOrigin.LYNX_PATCH,
                sourceScreenKey,
                targetScreenKey,
                popCount,
                pushCount,
                pushCount == 0,
                binding?.navigationTraceId,
                binding?.preloadTraceId,
                session,
                contents,
            )
        activeContext = context
        context.contents.values.forEach { content ->
            LynxScreensTrace.instant("LynxScreens.Stack.ScreenContentBound") {
                content.identity(context.containerId).arguments()
            }
        }
        participants[context] =
            if (animated) listOfNotNull(sourceScreenKey, targetScreenKey).toMutableSet()
            else mutableSetOf()
        LynxScreensTrace.instant(LynxScreensTrace.STACK_OPERATION_BATCH_PREPARED) {
            context.traceArguments(
                "unlinked_reason" to if (binding == null) "missing_or_ambiguous_binding" else null
            )
        }
        return context
    }

    internal fun <T> traceApplyOperations(context: NativeTransitionContext?, block: () -> T): T =
        if (context == null) block()
        else
            LynxScreensTrace.section(
                LynxScreensTrace.STACK_APPLY_OPERATIONS,
                { context.traceArguments() },
                block,
            )

    internal fun committed(context: NativeTransitionContext?) {
        if (context != null && participants[context]?.isEmpty() == true) {
            start(context, false)
            complete(context)
        }
    }

    internal fun platformCallback(
        context: NativeTransitionContext?,
        screenKey: String?,
        role: StackTransitionRole,
        phase: String,
    ) {
        if (context == null) return
        LynxScreensTrace.instant(LynxScreensTrace.STACK_TRANSITION_CALLBACK_RECEIVED) {
            context
                .identityFor(screenKey)
                .arguments("phase" to phase, "transition_role" to role.traceValue)
        }
        when (phase) {
            "start" -> start(context, true)
            "cancel" -> cancel(context, "platform_transition_cancelled")
            "end" -> {
                screenKey?.let { ended.getOrPut(context) { mutableSetOf() }.add(it) }
                val required = participants[context]
                if (
                    required != null &&
                        required.isNotEmpty() &&
                        ended[context]?.containsAll(required) == true
                )
                    complete(context)
            }
        }
    }

    internal fun nativeBackRequested(
        sourceScreenKey: String?,
        targetScreenKey: String?,
        contents: Map<String, ContentTraceIdentity>,
        animated: Boolean,
    ): NativeTransitionContext? {
        val session = navigationTraceContextStore.session ?: return null
        cancel("superseded")
        val context =
            NativeTransitionContext.create(
                containerId,
                NativeTransitionPresentation.STACK,
                NativeTransitionOperation.POP,
                NativeTransitionOrigin.NATIVE_BACK,
                sourceScreenKey,
                targetScreenKey,
                popCount = 1,
                targetReused = true,
                navigationTraceId = NativeNavigationTraceIdGenerator.create(containerId),
                session = session,
                contents = contents,
            )
        activeContext = context
        context.contents.values.forEach { content ->
            LynxScreensTrace.instant("LynxScreens.Stack.ScreenContentBound") {
                content.identity(context.containerId).arguments()
            }
        }
        participants[context] =
            if (animated) listOfNotNull(sourceScreenKey, targetScreenKey).toMutableSet()
            else mutableSetOf()
        LynxScreensTrace.instant(LynxScreensTrace.STACK_NATIVE_BACK_REQUESTED) {
            context.traceArguments()
        }
        return context
    }

    internal fun nativeDismissPrevented(
        sourceScreenKey: String?,
        targetScreenKey: String?,
        contents: Map<String, ContentTraceIdentity>,
    ): NativeTransitionContext? {
        val context =
            nativeBackRequested(sourceScreenKey, targetScreenKey, contents, false) ?: return null
        if (context.markPrevented())
            LynxScreensTrace.instant(LynxScreensTrace.STACK_NATIVE_DISMISS_PREVENTED) {
                context.traceArguments("status" to "prevented")
            }
        return context
    }

    internal fun nativeDismissCommitted(context: NativeTransitionContext?, screenKey: String?) {
        if (context != null)
            LynxScreensTrace.instant(LynxScreensTrace.STACK_NATIVE_DISMISS_COMMITTED) {
                context.identityFor(screenKey).arguments()
            }
    }

    internal fun cancel(reason: String) {
        activeContext?.let { cancel(it, reason) }
    }

    private fun start(context: NativeTransitionContext, animated: Boolean) {
        if (context.markStarted())
            LynxScreensTrace.instant(LynxScreensTrace.STACK_NATIVE_TRANSITION_START) {
                context.traceArguments("is_animated" to animated)
            }
    }

    private fun complete(context: NativeTransitionContext) {
        if (!context.markCompleted()) return
        LynxScreensTrace.instant(LynxScreensTrace.STACK_NATIVE_TRANSITION_END) {
            context.traceArguments("status" to "completed")
        }
        release(context)
    }

    private fun cancel(context: NativeTransitionContext, reason: String) {
        if (!context.markCancelled()) return
        LynxScreensTrace.instant(LynxScreensTrace.STACK_NATIVE_TRANSITION_CANCELLED) {
            context.traceArguments("reason" to reason)
        }
        release(context)
    }

    private fun release(context: NativeTransitionContext) {
        participants.remove(context)
        ended.remove(context)
        if (activeContext === context) activeContext = null
    }

    internal companion object {
        internal fun transitionMatches(
            context: NativeTransitionContext,
            screenKey: String?,
            role: StackTransitionRole,
        ): Boolean =
            when (context.operation) {
                NativeTransitionOperation.PUSH ->
                    context.targetScreenKey == screenKey && role == StackTransitionRole.ENTER
                NativeTransitionOperation.POP ->
                    (context.sourceScreenKey == screenKey && role == StackTransitionRole.RETURN) ||
                        (context.targetScreenKey == screenKey &&
                            role == StackTransitionRole.REENTER)
                NativeTransitionOperation.BATCH ->
                    (context.sourceScreenKey == screenKey &&
                        (role == StackTransitionRole.EXIT || role == StackTransitionRole.RETURN)) ||
                        (context.targetScreenKey == screenKey &&
                            (role == StackTransitionRole.ENTER ||
                                role == StackTransitionRole.REENTER))
                NativeTransitionOperation.PRESENT,
                NativeTransitionOperation.DISMISS -> false
            }

        internal fun pushRequested(screenKey: String?) {
            operationRequested(NativeTransitionOperation.PUSH, screenKey)
        }

        internal fun popRequested(screenKey: String?) {
            operationRequested(NativeTransitionOperation.POP, screenKey)
        }

        internal fun lifecycleEventEmitted(
            traceIdentity: NavigationTraceIdentity?,
            screenKey: String?,
            eventName: String,
        ) {
            eventEmitted(
                traceName = LynxScreensTrace.STACK_LIFECYCLE_EVENT_EMITTED,
                traceIdentity = traceIdentity,
                screenKey = screenKey,
                eventName = eventName,
                isNative = null,
            )
        }

        internal fun dismissEventEmitted(
            traceIdentity: NavigationTraceIdentity?,
            screenKey: String?,
            eventName: String,
            isNative: Any?,
        ) {
            eventEmitted(
                traceName = LynxScreensTrace.STACK_DISMISS_EVENT_EMITTED,
                traceIdentity = traceIdentity,
                screenKey = screenKey,
                eventName = eventName,
                isNative = isNative,
            )
        }

        private fun operationRequested(operation: NativeTransitionOperation, screenKey: String?) {
            LynxScreensTrace.instant(LynxScreensTrace.STACK_OPERATION_REQUESTED) {
                LynxScreensTrace.argumentsOf(
                    "presentation" to NativeTransitionPresentation.STACK.traceValue,
                    "operation" to operation.traceValue,
                    "origin" to NativeTransitionOrigin.LYNX_PATCH.traceValue,
                    "screen_key" to screenKey,
                )
            }
        }

        private fun eventEmitted(
            traceName: String,
            traceIdentity: NavigationTraceIdentity?,
            screenKey: String?,
            eventName: String,
            isNative: Any?,
        ) {
            if (traceIdentity == null) return
            LynxScreensTrace.instant(traceName) {
                traceIdentity.arguments() +
                    LynxScreensTrace.argumentsOf(
                        "navigation_trace_id" to traceIdentity.navigationTraceId,
                        "native_transition_id" to traceIdentity.nativeTransitionId,
                        "presentation" to NativeTransitionPresentation.STACK.traceValue,
                        "screen_key" to screenKey,
                        "event_name" to eventName,
                        "is_native" to isNative,
                    )
            }
        }

        private fun resolveOperation(popCount: Int, pushCount: Int): NativeTransitionOperation =
            when {
                popCount > 0 && pushCount > 0 -> NativeTransitionOperation.BATCH
                pushCount > 0 -> NativeTransitionOperation.PUSH
                else -> NativeTransitionOperation.POP
            }
    }
}
