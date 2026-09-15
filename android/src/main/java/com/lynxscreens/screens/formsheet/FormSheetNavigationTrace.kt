package com.lynxscreens.screens.formsheet

import com.lynxscreens.screens.common.trace.ContentTraceIdentity
import com.lynxscreens.screens.common.trace.ExpectedTraceChange
import com.lynxscreens.screens.common.trace.LynxScreensTrace
import com.lynxscreens.screens.common.trace.NativeNavigationTraceIdGenerator
import com.lynxscreens.screens.common.trace.NativeTransitionContext
import com.lynxscreens.screens.common.trace.NativeTransitionOperation
import com.lynxscreens.screens.common.trace.NativeTransitionOrigin
import com.lynxscreens.screens.common.trace.NativeTransitionPresentation
import com.lynxscreens.screens.common.trace.NavigationTraceContextStore
import com.lynxscreens.screens.common.trace.NavigationTraceIdentity
import com.lynxscreens.screens.common.trace.TraceBatch

/** Owns FormSheet trace context construction, state transitions, and common arguments. */
internal class FormSheetNavigationTrace(
    private val containerIdProvider: () -> String,
    private val screenKeyProvider: () -> String?,
    private val navigationTraceContextStore: NavigationTraceContextStore,
    private val batchProvider: () -> TraceBatch? = { null },
    private val contentProvider: () -> ContentTraceIdentity? = { null },
) {
    private val traceIdentity
        get() = containerIdProvider()

    private var activeContext: NativeTransitionContext? = null
    private var recentContext: NativeTransitionContext? = null
    private var eventOverride: NativeTransitionContext? = null
    private var overriding = false
    internal val operation
        get() = activeContext

    internal fun <T> withOperation(context: NativeTransitionContext?, block: () -> T): T {
        val previous = eventOverride
        val previousFlag = overriding
        eventOverride = context
        overriding = true
        try {
            return block()
        } finally {
            eventOverride = previous
            overriding = previousFlag
        }
    }

    private fun identity(context: NativeTransitionContext?) =
        context?.identityFor(screenKeyProvider())

    internal val eventTraceIdentity: NavigationTraceIdentity?
        get() = identity(if (overriding) eventOverride else activeContext ?: recentContext)

    internal fun captureBatch(): TraceBatch? = batchProvider()

    internal fun beginPresent(batch: TraceBatch? = batchProvider()) {
        if (navigationTraceContextStore.session == null) {
            return
        }
        cancel("superseded")
        recentContext = null
        val screenKey = screenKeyProvider()
        val navigationTraceContext =
            screenKey?.let {
                batch?.consume(traceIdentity, ExpectedTraceChange.Sheet(it, false, true))
            }
        val context =
            NativeTransitionContext.create(
                containerId = traceIdentity,
                session = navigationTraceContextStore.session,
                contents = listOfNotNull(contentProvider()).associateBy { it.screenKey },
                presentation = NativeTransitionPresentation.FORM_SHEET,
                operation = NativeTransitionOperation.PRESENT,
                origin = NativeTransitionOrigin.LYNX_PATCH,
                sourceScreenKey = navigationTraceContext?.sourceScreenKey,
                targetScreenKey = screenKey ?: traceIdentity,
                pushCount = 1,
                navigationTraceId = navigationTraceContext?.navigationTraceId,
            )
        activeContext = context
        context.contents.values.forEach { content ->
            LynxScreensTrace.instant("LynxScreens.FormSheet.ScreenContentBound") {
                content.identity(context.containerId).arguments()
            }
        }
        LynxScreensTrace.instant(LynxScreensTrace.FORM_SHEET_PRESENT_REQUESTED) {
            context.traceArguments()
        }
    }

    internal fun beginProgrammaticDismiss(batch: TraceBatch? = batchProvider()) {
        beginDismiss(NativeTransitionOrigin.LYNX_PATCH, batch)
    }

    internal fun beginNativeDismiss(
        origin: NativeTransitionOrigin = NativeTransitionOrigin.NATIVE_DISMISS
    ) {
        beginDismiss(origin)
    }

    private fun beginDismiss(origin: NativeTransitionOrigin, batch: TraceBatch? = batchProvider()) {
        if (navigationTraceContextStore.session == null) {
            return
        }
        cancel("superseded")
        recentContext = null
        val screenKey = screenKeyProvider()
        val navigationTraceContext =
            if (origin == NativeTransitionOrigin.LYNX_PATCH)
                screenKey?.let {
                    batch?.consume(traceIdentity, ExpectedTraceChange.Sheet(it, true, false))
                }
            else null
        val context =
            NativeTransitionContext.create(
                containerId = traceIdentity,
                session = navigationTraceContextStore.session,
                contents = listOfNotNull(contentProvider()).associateBy { it.screenKey },
                presentation = NativeTransitionPresentation.FORM_SHEET,
                operation = NativeTransitionOperation.DISMISS,
                origin = origin,
                sourceScreenKey = screenKey ?: traceIdentity,
                targetScreenKey = navigationTraceContext?.targetScreenKey,
                popCount = 1,
                navigationTraceId =
                    navigationTraceContext?.navigationTraceId
                        ?: if (origin != NativeTransitionOrigin.LYNX_PATCH) {
                            NativeNavigationTraceIdGenerator.create(traceIdentity)
                        } else {
                            null
                        },
            )
        activeContext = context
        context.contents.values.forEach { content ->
            LynxScreensTrace.instant("LynxScreens.FormSheet.ScreenContentBound") {
                content.identity(context.containerId).arguments()
            }
        }
        LynxScreensTrace.instant(LynxScreensTrace.FORM_SHEET_DISMISS_REQUESTED) {
            context.traceArguments()
        }
    }

    internal fun start(
        isAnimated: Boolean,
        operation: NativeTransitionContext? = if (overriding) eventOverride else activeContext,
    ) {
        val context = operation ?: return
        if (!context.markStarted()) {
            return
        }
        LynxScreensTrace.instant(LynxScreensTrace.FORM_SHEET_NATIVE_TRANSITION_START) {
            context.traceArguments("is_animated" to isAnimated)
        }
    }

    internal fun complete(
        operation: NativeTransitionContext? = if (overriding) eventOverride else activeContext
    ) {
        val context = operation ?: return
        if (!context.markCompleted()) {
            return
        }
        LynxScreensTrace.instant(LynxScreensTrace.FORM_SHEET_NATIVE_TRANSITION_END) {
            context.traceArguments("status" to "completed")
        }
        recentContext = context
        if (activeContext === context) activeContext = null
    }

    internal fun cancel(
        reason: String,
        operation: NativeTransitionContext? = if (overriding) eventOverride else activeContext,
    ) {
        val context = operation ?: return
        if (!context.markCancelled()) {
            return
        }
        LynxScreensTrace.instant(LynxScreensTrace.FORM_SHEET_NATIVE_TRANSITION_CANCELLED) {
            context.traceArguments("status" to "cancelled", "reason" to reason)
        }
        recentContext = context
        if (activeContext === context) activeContext = null
    }

    internal fun nativeDismissPrevented() {
        val context = activeContext ?: return
        if (!context.markPrevented()) {
            return
        }
        LynxScreensTrace.instant(LynxScreensTrace.FORM_SHEET_NATIVE_DISMISS_PREVENTED) {
            context.traceArguments(
                "screen_key" to (screenKeyProvider() ?: traceIdentity),
                "status" to "prevented",
            )
        }
        recentContext = context
        if (activeContext === context) activeContext = null
    }

    internal fun dismissCommittedAndComplete(
        operation: NativeTransitionContext? = if (overriding) eventOverride else activeContext
    ) {
        val context = operation
        LynxScreensTrace.instant(LynxScreensTrace.FORM_SHEET_NATIVE_DISMISS_COMMITTED) {
            context?.traceArguments("screen_key" to (screenKeyProvider() ?: traceIdentity))
                ?: LynxScreensTrace.argumentsOf(
                    "container_id" to traceIdentity,
                    "presentation" to NativeTransitionPresentation.FORM_SHEET.traceValue,
                    "screen_key" to (screenKeyProvider() ?: traceIdentity),
                )
        }
        complete(context)
    }

    internal fun dispose(reason: String) {
        cancel(reason)
    }

    internal fun eventEmitted(eventName: String, isLifecycleEvent: Boolean, channel: String?) {
        if (navigationTraceContextStore.session == null) return
        val traceName =
            if (isLifecycleEvent) {
                LynxScreensTrace.FORM_SHEET_LIFECYCLE_EVENT_EMITTED
            } else {
                LynxScreensTrace.FORM_SHEET_DISMISS_EVENT_EMITTED
            }
        LynxScreensTrace.instant(traceName) {
            val identity = eventTraceIdentity
            (identity?.arguments() ?: emptyMap()) +
                LynxScreensTrace.argumentsOf(
                    "navigation_trace_id" to identity?.navigationTraceId,
                    "native_transition_id" to identity?.nativeTransitionId,
                    "container_id" to traceIdentity,
                    "presentation" to NativeTransitionPresentation.FORM_SHEET.traceValue,
                    "screen_key" to (screenKeyProvider() ?: traceIdentity),
                    "event_name" to eventName,
                    "channel" to channel,
                )
        }
    }
}
