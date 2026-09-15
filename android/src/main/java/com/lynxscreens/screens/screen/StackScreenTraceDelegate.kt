package com.lynxscreens.screens.screen

import com.lynxscreens.screens.common.trace.NativeTransitionContext

internal interface StackScreenTraceDelegate {
    fun onNativeTransition(
        context: NativeTransitionContext?,
        screenKey: String?,
        role: StackTransitionRole,
        phase: String,
    )

    fun onNativeBackPressed(fragment: StackScreenFragment)

    fun onNativeDismissPrevented(fragment: StackScreenFragment)
}
