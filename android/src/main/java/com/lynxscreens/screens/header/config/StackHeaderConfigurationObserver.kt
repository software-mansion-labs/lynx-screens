package com.lynxscreens.screens.header.config

import com.lynxscreens.screens.header.toolbar.update.StackHeaderToolbarMenuElementUpdate

internal interface StackHeaderConfigurationObserver {
    fun onConfigChanged(config: StackHeaderConfigurationProviding)

    fun onMenuElementsUpdated(updates: List<StackHeaderToolbarMenuElementUpdate>)
}
