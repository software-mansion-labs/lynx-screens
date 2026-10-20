package com.lynxscreens.screens.host

import androidx.fragment.app.FragmentManager
import com.lynxscreens.screens.screen.StackScreenComponent

internal interface StackContainerDelegate {
    fun onScreenDismissCommitted(stackScreen: StackScreenComponent)

    /**
     * Resolves the fragment manager the container should run its operations on. Called every time the container
     * is attached to a window, as the result may differ between attachments.
     */
    fun resolveFragmentManager(): FragmentManager
}
