package com.lynxscreens.screens.host

import com.lynxscreens.screens.screen.StackScreenComponent

internal interface StackContainerDelegate {
    fun onScreenDismissCommitted(stackScreen: StackScreenComponent)
}
