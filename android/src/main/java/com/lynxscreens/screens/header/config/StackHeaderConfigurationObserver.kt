package com.lynxscreens.screens.header.config

import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuElementOptions

internal interface StackHeaderConfigurationObserver {
    fun onConfigChanged(config: StackHeaderConfigurationProviding)

    fun onMenuElementUpdated(
        id: String,
        options: StackHeaderToolbarMenuElementOptions,
    )
}
