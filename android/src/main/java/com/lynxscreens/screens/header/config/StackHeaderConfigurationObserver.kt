package com.lynxscreens.screens.header.config

import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemOptions

interface StackHeaderConfigurationObserver {
    fun onConfigChanged(config: StackHeaderConfigurationProviding)

    fun onMenuItemUpdated(
        id: String,
        options: StackHeaderToolbarMenuItemOptions,
    )
}
