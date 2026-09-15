package com.lynxscreens.screens.host

import com.lynxscreens.screens.common.trace.NativeTransitionContext
import com.lynxscreens.screens.common.trace.NativeTransitionOperation
import com.lynxscreens.screens.common.trace.NativeTransitionOrigin
import com.lynxscreens.screens.common.trace.NativeTransitionPresentation
import com.lynxscreens.screens.screen.StackTransitionRole
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StackNavigationTraceTest {
    @Test
    fun popMatchesOutgoingReturnAndIncomingReenterCallbacks() {
        val context = context(NativeTransitionOperation.POP)

        assertTrue(
            StackNavigationTrace.transitionMatches(
                context,
                screenKey = "details",
                role = StackTransitionRole.RETURN,
            )
        )
        assertTrue(
            StackNavigationTrace.transitionMatches(
                context,
                screenKey = "home",
                role = StackTransitionRole.REENTER,
            )
        )
        assertFalse(
            StackNavigationTrace.transitionMatches(
                context,
                screenKey = "details",
                role = StackTransitionRole.EXIT,
            )
        )
    }

    @Test
    fun pushOnlyMatchesIncomingEnterCallback() {
        val context = context(NativeTransitionOperation.PUSH)

        assertTrue(
            StackNavigationTrace.transitionMatches(
                context,
                screenKey = "home",
                role = StackTransitionRole.ENTER,
            )
        )
        assertFalse(
            StackNavigationTrace.transitionMatches(
                context,
                screenKey = "details",
                role = StackTransitionRole.EXIT,
            )
        )
    }

    private fun context(operation: NativeTransitionOperation): NativeTransitionContext =
        NativeTransitionContext.create(
            containerId = "stack-1",
            presentation = NativeTransitionPresentation.STACK,
            operation = operation,
            origin = NativeTransitionOrigin.LYNX_PATCH,
            sourceScreenKey = "details",
            targetScreenKey = "home",
            popCount = if (operation == NativeTransitionOperation.POP) 1 else 0,
            pushCount = if (operation == NativeTransitionOperation.PUSH) 1 else 0,
        )
}
