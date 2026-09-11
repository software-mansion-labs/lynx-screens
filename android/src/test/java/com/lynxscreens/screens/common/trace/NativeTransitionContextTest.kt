package com.lynxscreens.screens.common.trace

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class NativeTransitionContextTest {
    @Test
    fun transitionStateCanOnlyReachOneTerminalState() {
        val context = createContext()

        assertEquals(NativeTransitionContext.State.PREPARED, context.state)
        assertTrue(context.markStarted())
        assertFalse(context.markStarted())
        assertTrue(context.markCompleted())
        assertFalse(context.markCancelled())
        assertFalse(context.markPrevented())
        assertEquals(NativeTransitionContext.State.COMPLETED, context.state)
    }

    @Test
    fun transitionIdsAreUniqueWithinTheProcess() {
        val first = createContext()
        val second = createContext()

        assertNotEquals(first.id, second.id)
    }

    @Test
    fun traceArgumentsExcludeNullValues() {
        val context =
            NativeTransitionContext.create(
                containerId = "stack-1",
                presentation = NativeTransitionPresentation.STACK,
                operation = NativeTransitionOperation.PUSH,
                origin = NativeTransitionOrigin.LYNX_PATCH,
                sourceScreenKey = null,
                targetScreenKey = "target",
                pushCount = 1,
                navigationTraceId = "js:stack:7",
                preloadTraceId = "js:stack:6",
            )

        val arguments = context.traceArguments("optional" to null)

        assertFalse(arguments.containsKey("source_screen_key"))
        assertFalse(arguments.containsKey("optional"))
        assertEquals("target", arguments["target_screen_key"])
        assertEquals("js:stack:7", arguments["navigation_trace_id"])
        assertEquals("js:stack:6", arguments["preload_trace_id"])
        assertEquals("1", arguments["push_count"])
    }

    @Test
    fun viewLifecycleSnapshotDoesNotGuessWhichNavigationCausedIt() {
        val operation =
            NavigationTraceIdentity(
                "js:1",
                "transition:1",
                containerId = "stack:1",
                runtimeId = "runtime",
                navigatorKey = "navigator",
                screenKey = "A",
                contentScopeId = "content:1",
            )
        val lifecycle = operation.withoutOperation()
        assertEquals(null, lifecycle.navigationTraceId)
        assertEquals(null, lifecycle.nativeTransitionId)
        assertEquals("content:1", lifecycle.contentScopeId)
        assertEquals("stack:1", lifecycle.containerId)
        assertEquals("js:1", operation.navigationTraceId)
    }

    private fun createContext(): NativeTransitionContext =
        NativeTransitionContext.create(
            containerId = "stack-1",
            presentation = NativeTransitionPresentation.STACK,
            operation = NativeTransitionOperation.POP,
            origin = NativeTransitionOrigin.NATIVE_BACK,
            sourceScreenKey = "source",
            targetScreenKey = "target",
            popCount = 1,
            targetReused = true,
        )
}
