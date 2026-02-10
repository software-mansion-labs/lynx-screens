package com.lynxscreens.screens.host

import com.lynxscreens.screens.screen.StackScreenComponent

internal interface StackContainerDelegate {
    fun onDismiss(stackScreen: StackScreenComponent)
}
