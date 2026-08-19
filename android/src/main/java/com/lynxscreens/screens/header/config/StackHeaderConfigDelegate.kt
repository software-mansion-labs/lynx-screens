package com.lynxscreens.screens.header.config

import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemOptions

interface StackHeaderConfigDelegate {
    fun onConfigChange(config: StackHeaderConfigProviding)

    fun onMenuItemUpdate(
        id: String,
        options: StackHeaderToolbarMenuItemOptions,
    )
}
